"""Builds the Vela solitaire ring in Blender and exports public/models/ring.glb.

Run headless (bpy module or Blender binary):
    python tools/blender/build_ring.py [out.glb]
    blender -b -P tools/blender/build_ring.py -- out.glb

Every option the configurator offers is real, separately named geometry, so the
web app only toggles visibility and swaps materials by node name:

    band                          always visible
    head                          neck joining band to stone, always visible
    stone_round | stone_oval | stone_emerald   centre stone (one visible)
    prongs_<cut>                  four-claw setting for that cut
    bezel_<cut>                   closed bezel setting for that cut
    pave                          two rows of small diamonds on the shoulders

Axes (Blender, Z up): ring axis = Y, stone on +Z. glTF export converts to Y up.
Material slot names: METAL, STONE (centre stone), DIAMOND (pave).
"""
import math
import sys

import bpy
import bmesh

# ── Dimensions (scene units; ring outer diameter is ~1.5) ──────────────────
R_IN = 0.62
THICK = 0.115        # shank thickness at the shoulders (near the stone)
THIN = 0.062         # shank thickness at the bottom
WIDTH = 0.19         # shank width at the shoulders
W_THIN = 0.105       # shank width at the bottom
R_TOP = R_IN + THICK + 0.012  # crown of the domed outer surface
S = 0.255  # centre stone half-size (~45% of the finger opening, like the reference)

CUT_DEPTH = {'round': 0.72 * S, 'oval': 0.72 * S, 'emerald': 1.05 * S}


def zg(cut):
    """Height of the stone girdle above the ring centre for a given cut."""
    return R_TOP + 0.05 + CUT_DEPTH[cut]


# ── Mesh helpers ────────────────────────────────────────────────────────────
def ring_loop(n, r, z, tw=0.0, sx=1.0, sy=1.0, ox=0.0, oy=0.0):
    out = []
    for i in range(n):
        a = (i + tw) * 2 * math.pi / n
        out.append((ox + r * sx * math.cos(a), oy + r * sy * math.sin(a), z))
    return out


def rect_loop(a, b, c, z):
    """Chamfered rectangle (8 vertices, counter-clockwise)."""
    return [
        (-a + c, -b, z), (a - c, -b, z), (a, -b + c, z), (a, b - c, z),
        (a - c, b, z), (-a + c, b, z), (-a, b - c, z), (-a, -b + c, z),
    ]


def loft(loops, tws=None, cap_first=False, cap_last=False, apex=None, wrap=False):
    n = len(loops[0])
    tws = tws or [0.0] * len(loops)
    verts = [v for loop in loops for v in loop]
    faces = []
    count = len(loops)
    last = count if wrap else count - 1
    for k in range(last):
        k2 = (k + 1) % count
        ta, tb = tws[k], tws[k2]
        for i in range(n):
            j = (i + 1) % n
            a0, a1, b0, b1 = k * n + i, k * n + j, k2 * n + i, k2 * n + j
            if ta == tb:
                faces.append((a0, a1, b1, b0))
            elif tb > ta:  # lower loop is offset half a step forward
                faces += [(a0, a1, b0), (a1, b1, b0)]
            else:
                faces += [(b0, a0, b1), (a0, a1, b1)]
    if cap_first:
        faces.append(tuple(range(n)))
    if cap_last:
        faces.append(tuple(range((count - 1) * n, count * n)))
    if apex is not None:
        verts.append(apex)
        ai = len(verts) - 1
        base = (count - 1) * n
        for i in range(n):
            faces.append((base + i, base + (i + 1) % n, ai))
    return verts, faces


def translate(verts, dx=0.0, dy=0.0, dz=0.0):
    return [(x + dx, y + dy, z + dz) for x, y, z in verts]


def merge(parts):
    verts, faces = [], []
    for v, f in parts:
        off = len(verts)
        verts += v
        faces += [tuple(i + off for i in face) for face in f]
    return verts, faces


def add_object(name, vf, material, collection, smooth=False):
    verts, faces = vf
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bvs = [bm.verts.new(v) for v in verts]
    for f in faces:
        try:
            bm.faces.new([bvs[i] for i in f])
        except ValueError:
            pass  # duplicate face
    bm.normal_update()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(mesh)
    bm.free()
    if smooth:
        mesh.shade_smooth()
    mesh.materials.append(material)
    ob = bpy.data.objects.new(name, mesh)
    collection.objects.link(ob)
    return ob


# ── Materials (preview render only; the web app overrides them) ───────────
def make_materials():
    metal = bpy.data.materials.new('METAL')
    metal.use_nodes = True
    b = metal.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (1.0, 0.77, 0.34, 1)
    b.inputs['Metallic'].default_value = 1.0
    b.inputs['Roughness'].default_value = 0.08

    def glass(name, color=(1, 1, 1, 1)):
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        p = m.node_tree.nodes['Principled BSDF']
        p.inputs['Base Color'].default_value = color
        p.inputs['Roughness'].default_value = 0.0
        p.inputs['IOR'].default_value = 2.417
        p.inputs['Transmission Weight'].default_value = 1.0
        return m

    diamond = glass('DIAMOND')
    diamond.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value = 0.35
    return metal, glass('STONE'), diamond


# ── Parts ───────────────────────────────────────────────────────────────────
def _smooth(a, b, x):
    u = min(1.0, max(0.0, (x - a) / (b - a)))
    return u * u * (3 - 2 * u)


def shoulder(theta):
    """1 near the stone, 0 along the bottom of the shank (theta = angle from top)."""
    return 1.0 - _smooth(math.radians(28), math.radians(125), abs(theta))


def thick_at(theta):
    return THIN + (THICK - THIN) * shoulder(theta)


def width_at(theta):
    return W_THIN + (WIDTH - W_THIN) * shoulder(theta)


def outer_r(theta):
    """Radius of the crown of the outer surface at theta."""
    return R_IN + thick_at(theta) + 0.012 * thick_at(theta) / THICK


def band_profile():
    """Normalised rounded-rectangle section: (t across thickness 0..1, v across width -1..1)."""
    rad_t, rad_v = 0.28, 0.20
    corners = [(1 - rad_t, 1 - rad_v, 0), (rad_t, 1 - rad_v, 90),
               (rad_t, -1 + rad_v, 180), (1 - rad_t, -1 + rad_v, 270)]
    pts = []
    for ct, cv, a0 in corners:
        for k in range(6):
            a = math.radians(a0 + 90 * k / 5)
            pts.append((ct + rad_t * math.cos(a), cv + rad_v * math.sin(a)))
    return pts


def revolve(profile, steps=240):
    n = len(profile)
    verts, faces = [], []
    for s in range(steps):
        a = 2 * math.pi * s / steps
        th = a if a <= math.pi else a - 2 * math.pi
        thick, hw = thick_at(th), width_at(th) / 2
        sn, cs = math.sin(a), math.cos(a)
        for t, v in profile:
            dome = 1 - v * v
            r = R_IN + t * thick + (0.012 if t > 0.5 else 0.008) * dome * (thick / THICK)
            verts.append((r * sn, v * hw, r * cs))
    for s in range(steps):
        s2 = (s + 1) % steps
        for i in range(n):
            j = (i + 1) % n
            faces.append((s * n + i, s * n + j, s2 * n + j, s2 * n + i))
    return verts, faces


def stone(cut, scale=S, n_round=16):
    """Centre stone with its girdle at z=0; caller translates it."""
    s = scale
    if cut in ('round', 'oval'):
        sx, sy = (1.0, 1.0) if cut == 'round' else (0.88, 1.22)
        spec = [(0.56, 0.22, 0.0), (0.80, 0.13, 0.5), (1.0, 0.02, 0.0),
                (1.0, -0.02, 0.0), (0.60, -0.42, 0.5)]
        loops = [ring_loop(n_round, r * s, z * s, tw, sx, sy) for r, z, tw in spec]
        return loft(loops, [t for _, _, t in spec], cap_first=True,
                    apex=(0, 0, -0.72 * s))
    a, b, c = 0.74, 1.02, 0.26
    spec = [(0.60, 0.23), (0.74, 0.17), (0.88, 0.10), (1.0, 0.02), (1.0, -0.02),
            (0.82, -0.30), (0.60, -0.58), (0.38, -0.86), (0.14, -1.05)]
    loops = [rect_loop(a * k * s, b * k * s, c * k * s, z * s) for k, z in spec]
    return loft(loops, cap_first=True, cap_last=True)


def footprints(cut):
    """Four claw positions (x, y) around the girdle."""
    if cut == 'round':
        p = 0.707 * S * 1.0
        return [(sx * p, sy * p) for sx in (-1, 1) for sy in (-1, 1)]
    if cut == 'oval':
        px, py = 0.707 * 0.88 * S, 0.707 * 1.22 * S
        return [(sx * px, sy * py) for sx in (-1, 1) for sy in (-1, 1)]
    a, b, c = 0.74, 1.02, 0.26
    px, py = (a - c * 0.35) * S, (b - c * 0.35) * S
    return [(sx * px, sy * py) for sx in (-1, 1) for sy in (-1, 1)]


def prong(cut, px, py):
    g = zg(cut)
    z0 = R_TOP + 0.01
    path = [
        (0.35, z0, 0.028), (0.75, 0.5 * (z0 + g - 0.07), 0.024),
        (1.06, g - 0.07, 0.021), (1.03, g - 0.005, 0.020), (0.93, g + 0.034, 0.022),
    ]
    loops = [ring_loop(8, rad, z, 0, ox=px * k, oy=py * k) for k, z, rad in path]
    return loft(loops, cap_first=True, apex=(px * 0.90, py * 0.90, g + 0.060))


def prongs(cut):
    return merge([prong(cut, px, py) for px, py in footprints(cut)])


def head():
    return loft([ring_loop(12, 0.085, R_TOP - 0.03), ring_loop(12, 0.040, R_TOP + 0.075)],
                cap_first=True, cap_last=True)


def bezel(cut):
    g = zg(cut)
    s = S

    def shape(k, z):
        if cut == 'round':
            return ring_loop(16, k * s, z)
        if cut == 'oval':
            return ring_loop(16, k * s, z, sx=0.88, sy=1.22)
        return rect_loop(0.74 * k * s, 1.02 * k * s, 0.26 * k * s, z)

    spec = [(0.90, g - 0.030), (0.99, g + 0.000), (0.86, g + 0.036),   # inner wall
            (1.20, g + 0.036), (1.20, g - 0.030), (0.70, g - 0.100),   # outer wall
            (0.30, R_TOP + 0.020)]
    return loft([shape(k, z) for k, z in spec], cap_first=True, cap_last=True)


def pave():
    """One row of graduated stones down each shoulder, set flush into the shank."""
    parts = []
    for side in (-1, 1):
        th = math.radians(16.0)
        while th < math.radians(112):
            f = shoulder(th)
            s = 0.019 + 0.017 * f  # graduate from ~0.036 down to ~0.019
            sv, sf = stone('round', s, n_round=8)
            ang = th * side
            st, ct = math.sin(ang), math.cos(ang)
            tangent, radial = (ct, 0, -st), (st, 0, ct)
            cr = outer_r(th) - 0.10 * s
            cx, cz = radial[0] * cr, radial[2] * cr
            moved = [(tangent[0] * x + radial[0] * z + cx, y,
                      tangent[2] * x + radial[2] * z + cz) for x, y, z in sv]
            parts.append((moved, sf))
            th += (2.2 * s) / outer_r(th)
    return merge(parts)


# ── Scene ───────────────────────────────────────────────────────────────────
def build(collection):
    metal, glass, dia = make_materials()
    objs = {}
    objs['band'] = add_object('band', revolve(band_profile()), metal, collection, smooth=True)
    objs['head'] = add_object('head', head(), metal, collection, smooth=True)
    for cut in ('round', 'oval', 'emerald'):
        sv, sf = stone(cut)
        objs[f'stone_{cut}'] = add_object(
            f'stone_{cut}', (translate(sv, dz=zg(cut)), sf), glass, collection)
        objs[f'prongs_{cut}'] = add_object(f'prongs_{cut}', prongs(cut), metal, collection, smooth=True)
        objs[f'bezel_{cut}'] = add_object(f'bezel_{cut}', bezel(cut), metal, collection, smooth=True)
    objs['pave'] = add_object('pave', pave(), dia, collection)
    return objs


def export_glb(path):
    bpy.ops.export_scene.gltf(
        filepath=path, export_format='GLB', export_apply=True,
        export_yup=True, export_materials='EXPORT', export_cameras=False,
        export_lights=False,
    )


if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    out = argv[0] if argv else 'public/models/ring.glb'
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build(bpy.context.scene.collection)
    export_glb(out)
    print('exported', out)
