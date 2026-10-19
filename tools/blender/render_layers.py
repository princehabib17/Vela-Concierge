"""Renders the ring as transparent layers for the web configurator.

The browser composites these layers and tints them, so one set of renders covers every
metal and every stone colour:

    shadow                      soft contact shadow (alpha only)
    stone_<cut>                 centre stone, neutral glass
    metal_<cut>_<setting>       band + head + claws/bezel/gallery in neutral white metal;
                                the centre stone is a holdout so occlusion is exact
    halo_<cut>                  hidden-halo diamonds (holds the stone, claws and collar)
    pave | eternity             shoulder diamonds (holds the band and head)

    python render_layers.py OUT_DIR [--frames 24] [--only metal_round_claw,shadow]
                            [--size 900] [--samples 48] [--frame 0] [--shard 0/1]

Output: OUT_DIR/<layer>/<frame:02d>.png  (RGBA)
"""
import argparse
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(__file__))
import build_ring as br  # noqa: E402

SETTINGS = ('claw', 'halo', 'bezel')
CAMERA_TARGET = Vector((0, 0, 0.12))


def all_layers():
    layers = ['shadow']
    layers += [f'stone_{c}' for c in br.CUTS]
    layers += [f'metal_{c}_{s}' for c in br.CUTS for s in SETTINGS]
    layers += [f'halo_{c}' for c in br.CUTS]
    layers += ['pave', 'eternity']
    return layers


def layer_plan(layer):
    """(visible parts, holdout parts) for a layer name."""
    kind, *rest = layer.split('_')
    if layer == 'shadow':
        return [], ['band', 'head', 'stone_round', 'prongs_round']
    if kind == 'stone':
        cut = rest[0]
        return [f'stone_{cut}'], ['band', 'head', f'prongs_{cut}']  # claws for refraction only
    if kind == 'metal':
        cut, setting = rest
        parts = ['band', 'head']
        if setting in ('claw', 'halo'):
            parts.append(f'prongs_{cut}')
        if setting == 'halo':
            parts.append(f'gallery_{cut}')
        if setting == 'bezel':
            parts.append(f'bezel_{cut}')
        return parts, [f'stone_{cut}']
    if kind == 'halo':
        cut = rest[0]
        return [f'halo_{cut}'], [f'stone_{cut}', f'prongs_{cut}', f'gallery_{cut}', 'band', 'head']
    if layer in ('pave', 'eternity'):
        return [layer], ['band', 'head']
    raise ValueError(layer)


def area_light(name, loc, sx, sy, energy):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.shape = 'RECTANGLE'
    ld.size, ld.size_y, ld.energy = sx, sy, energy
    ob = bpy.data.objects.new(name, ld)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (CAMERA_TARGET - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    ob.visible_camera = False
    return ob


def use_gpu():
    """Switch Cycles to the best GPU backend available (Metal on Apple silicon)."""
    prefs = bpy.context.preferences.addons['cycles'].preferences
    for kind in ('METAL', 'OPTIX', 'CUDA', 'HIP', 'ONEAPI'):
        try:
            prefs.compute_device_type = kind
        except TypeError:
            continue
        prefs.get_devices()
        if any(d.type == kind for d in prefs.devices):
            for d in prefs.devices:
                d.use = d.type == kind
            return kind
    return None


def setup(size, samples, gpu=False):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    objs = br.build(scene.collection)

    # Neutral materials: the browser applies the metal / stone tint.
    metal, glass, dia = None, None, None
    for ob in objs.values():
        m = ob.data.materials[0]
        p = m.node_tree.nodes['Principled BSDF']
        if m.name.startswith('METAL'):
            p.inputs['Base Color'].default_value = (1, 1, 1, 1)
            p.inputs['Roughness'].default_value = 0.075
            metal = m
        elif m.name.startswith('STONE'):
            p.inputs['Base Color'].default_value = (1, 1, 1, 1)
            glass = m
        else:
            p.inputs['Base Color'].default_value = (1, 1, 1, 1)
            p.inputs['Transmission Weight'].default_value = 1.0
            dia = m

    turn = bpy.data.objects.new('turn', None)
    scene.collection.objects.link(turn)
    for ob in objs.values():
        ob.parent = turn

    floor_z = -br.outer_r(math.pi) - 0.0005
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, floor_z))
    floor = bpy.context.object
    fm = bpy.data.materials.new('FLOOR')
    fm.use_nodes = True
    fb = fm.node_tree.nodes['Principled BSDF']
    fb.inputs['Base Color'].default_value = (0.6, 0.6, 0.6, 1)
    fb.inputs['Roughness'].default_value = 0.5
    floor.data.materials.append(fm)

    world = bpy.data.worlds.new('W')
    world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (0.55, 0.55, 0.56, 1)
    bg.inputs['Strength'].default_value = 0.10
    scene.world = world

    # Softboxes: big overhead, long side strips for the band, low front fill, rim.
    area_light('top', (0.0, -0.6, 3.6), 3.4, 3.4, 330)
    area_light('left', (-3.4, -1.2, 0.9), 0.8, 3.8, 260)
    area_light('right', (3.4, -2.2, 1.3), 0.8, 3.8, 260)
    area_light('front', (0.0, -4.8, 0.7), 3.6, 1.0, 70)
    area_light('rim', (0.0, 3.6, 1.8), 3.0, 1.6, 150)

    cam_data = bpy.data.cameras.new('cam')
    cam_data.lens = 125
    cam = bpy.data.objects.new('cam', cam_data)
    scene.collection.objects.link(cam)
    cam.location = (0.0, -9.0, 3.6)
    cam.rotation_euler = (CAMERA_TARGET - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scene.camera = cam

    r = scene.render
    r.engine = 'CYCLES'
    r.resolution_x = r.resolution_y = size
    r.film_transparent = True
    r.image_settings.file_format = 'PNG'
    r.image_settings.color_mode = 'RGBA'
    r.image_settings.compression = 15
    c = scene.cycles
    backend = use_gpu() if gpu else None
    c.device = 'GPU' if backend else 'CPU'
    print('Cycles device:', backend or 'CPU', flush=True)
    c.samples = samples
    c.use_denoising = True
    c.max_bounces = 14
    c.transmission_bounces = 14
    c.glossy_bounces = 6
    c.caustics_reflective = False
    c.caustics_refractive = False
    c.sample_clamp_indirect = 10
    scene.view_settings.view_transform = 'Standard'
    return scene, objs, turn, floor


def render_layer(scene, objs, floor, layer, path):
    visible, hold = layer_plan(layer)
    for name, ob in objs.items():
        if name in visible:
            ob.hide_render, ob.is_holdout = False, False
        elif name in hold or (layer == 'shadow' and name in ('band', 'head')):
            ob.hide_render, ob.is_holdout = False, True
        else:
            ob.hide_render, ob.is_holdout = True, False
    if layer == 'shadow':
        floor.is_shadow_catcher = True
        floor.visible_camera = True
    else:
        floor.is_shadow_catcher = False
        floor.visible_camera = False
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out')
    ap.add_argument('--frames', type=int, default=24)
    ap.add_argument('--frame', type=int, default=None, help='render a single frame index')
    ap.add_argument('--only', default='')
    ap.add_argument('--size', type=int, default=900)
    ap.add_argument('--samples', type=int, default=48)
    ap.add_argument('--shard', default='0/1')
    ap.add_argument('--gpu', action='store_true', help='render on the GPU (Metal/OptiX/CUDA/HIP)')
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    a = ap.parse_args(argv)

    scene, objs, turn, floor = setup(a.size, a.samples, a.gpu)
    layers = [l for l in all_layers() if not a.only or l in a.only.split(',')]
    frames = [a.frame] if a.frame is not None else list(range(a.frames))
    shard_i, shard_n = (int(x) for x in a.shard.split('/'))
    priority = ['shadow', 'stone_round', 'metal_round_claw', 'pave', 'metal_round_halo',
                'halo_round', 'metal_round_bezel', 'eternity']
    layers.sort(key=lambda l: priority.index(l) if l in priority else len(priority))
    jobs = [(f, l) for l in layers for f in frames]  # finish one layer at a time
    jobs = [j for k, j in enumerate(jobs) if k % shard_n == shard_i]
    for n, (f, layer) in enumerate(jobs):
        path = os.path.join(a.out, layer, f'{f:02d}.png')
        if os.path.exists(path):
            continue
        os.makedirs(os.path.dirname(path), exist_ok=True)
        turn.rotation_euler.z = math.radians(360.0 * f / a.frames)
        render_layer(scene, objs, floor, layer, path)
        print(f'[{n + 1}/{len(jobs)}] {layer} f{f}', flush=True)


main()
