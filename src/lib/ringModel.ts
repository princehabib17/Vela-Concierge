/**
 * Procedural engagement ring for the live three.js configurator.
 *
 * Units: the inside radius of the band is 1 (about 8.25 mm for a size 6), so a 1.5 ct round
 * stone is ~0.9 wide. The ring stands upright: the band circles the Z axis (the finger runs
 * along Z) and the centre stone sits on top, +Y.
 */
import * as THREE from 'three';
import type { Band, Cut, Geometry } from './ringTypes';

export const INNER_R = 1;

type V2 = [number, number];
type Outline = { at: (t: number) => V2; verts?: V2[] };

/* ---------------------------------------------------------------- band */

/** Width along the finger and radial thickness of the band at angle θ from the top. */
export function bandSize(band: Band, theta: number) {
  if (band === 'eternity') return { w: 0.21, t: 0.16 };
  const f = Math.pow((1 + Math.cos(theta)) / 2, 1.4); // 1 at the top, 0 underneath
  // A slim, nearly parallel shank like Vela's Kaylee: only a whisper of taper.
  return band === 'pave' ? { w: 0.185 + 0.025 * f, t: 0.15 + 0.012 * f } : { w: 0.17 + 0.025 * f, t: 0.145 + 0.012 * f };
}

/** A seamless shank with a flat-topped, softly squared cross-section. */
function bandGeometry(band: Band) {
  const NT = 320;
  const NP = 40;
  const n = 4.5; // superellipse: flat top, straight sides, softened edges
  const pos = new Float32Array(NT * NP * 3);
  const uv = new Float32Array(NT * NP * 2); // u runs around the finger so a brushed grain follows the band
  for (let i = 0; i < NT; i++) {
    const th = (i / NT) * Math.PI * 2;
    const { w, t } = bandSize(band, th);
    const rx = Math.sin(th);
    const ry = Math.cos(th);
    for (let j = 0; j < NP; j++) {
      const ph = (j / NP) * Math.PI * 2;
      const c = Math.cos(ph);
      const s = Math.sin(ph);
      const px = Math.sign(c) * Math.abs(c) ** (2 / n);
      const py = Math.sign(s) * Math.abs(s) ** (2 / n);
      const radial = INNER_R + t / 2 + (t / 2) * py;
      const k = (i * NP + j) * 3;
      pos[k] = rx * radial;
      pos[k + 1] = ry * radial;
      pos[k + 2] = (w / 2) * px;
      uv[(i * NP + j) * 2] = (i / NT) * 24;
      uv[(i * NP + j) * 2 + 1] = j / NP;
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < NT; i++) {
    for (let j = 0; j < NP; j++) {
      const a = i * NP + j;
      const b = ((i + 1) % NT) * NP + j;
      const c = ((i + 1) % NT) * NP + ((j + 1) % NP);
      const d = i * NP + ((j + 1) % NP);
      idx.push(a, b, d, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* ------------------------------------------------------------- stones */

export type StoneSpec = { W: number; L: number; hc: number; dp: number; g: number };

/** Face-up size (W across the finger, L along it) and proportions for a cut and carat weight. */
export function stoneSpec(cut: Cut, carat: number): StoneSpec {
  const s = 0.88 * Math.cbrt(carat / 1.5); // a 1.5 ct round sits ~36% of the ring's width, as on the Kaylee
  const [W, L] = cut === 'round' ? [0.9, 0.9] : cut === 'oval' ? [0.78, 1.1] : cut === 'emerald' ? [0.76, 1.04] : [0.8, 1.2];
  const w = W * s;
  return {
    W: w,
    L: L * s,
    hc: (cut === 'emerald' ? 0.12 : 0.155) * w,
    dp: (cut === 'emerald' ? 0.4 : cut === 'round' ? 0.43 : 0.45) * w,
    g: 0.025 * w,
  };
}

const PEAR_RAW = (t: number): V2 => {
  const a = t * Math.PI * 2;
  return [Math.sin(a) * Math.sin(a / 2), Math.cos(a)]; // point at t = 0 (+Z), round end at t = 0.5
};
const PEAR_BOX = (() => {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let i = 0; i < 1024; i++) {
    const [x, z] = PEAR_RAW(i / 1024);
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
  }
  return { x0, x1, z0, z1 };
})();

export function outlineFor(cut: Cut, W: number, L: number): Outline {
  if (cut === 'pear') {
    const b = PEAR_BOX;
    return {
      at: (t) => {
        const [x, z] = PEAR_RAW(t);
        return [((x - b.x0) / (b.x1 - b.x0) - 0.5) * W, ((z - b.z0) / (b.z1 - b.z0) - 0.5) * L];
      },
    };
  }
  if (cut === 'emerald') {
    const hw = W / 2;
    const hl = L / 2;
    const c = 0.17 * W;
    const verts: V2[] = [
      [-hw + c, hl], [hw - c, hl], [hw, hl - c], [hw, -hl + c],
      [hw - c, -hl], [-hw + c, -hl], [-hw, -hl + c], [-hw, hl - c],
    ];
    return {
      verts,
      at: (t) => {
        const u = (((t % 1) + 1) % 1) * 8;
        const i = Math.floor(u);
        const f = u - i;
        const a = verts[i];
        const b = verts[(i + 1) % 8];
        return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      },
    };
  }
  return { at: (t) => [(W / 2) * Math.sin(t * Math.PI * 2), (L / 2) * Math.cos(t * Math.PI * 2)] };
}

function outwardNormal(o: Outline, t: number): V2 {
  const e = 1e-3;
  const a = o.at(t - e);
  const b = o.at(t + e);
  let nx = b[1] - a[1];
  let nz = -(b[0] - a[0]);
  const p = o.at(t);
  if (nx * p[0] + nz * p[1] < 0) { nx = -nx; nz = -nz; }
  const l = Math.hypot(nx, nz) || 1;
  return [nx / l, nz / l];
}

/** Collects flat-shaded facets, each turned to face away from the stone's centre. */
class Facets {
  pos: number[] = [];
  tri(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    const centroid = new THREE.Vector3().add(a).add(b).add(c).divideScalar(3);
    if (n.dot(centroid) < 0) [b, c] = [c, b];
    this.pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  }
  /** Quads between two rings with matching vertices (step cuts, girdle). */
  same(A: THREE.Vector3[], B: THREE.Vector3[]) {
    for (let k = 0; k < A.length; k++) {
      const k1 = (k + 1) % A.length;
      this.tri(A[k], A[k1], B[k1]);
      this.tri(A[k], B[k1], B[k]);
    }
  }
  /** Ring A to ring B with half as many vertices, B[j] above A[2j]: kites and triangles. */
  half(A: THREE.Vector3[], B: THREE.Vector3[]) {
    for (let j = 0; j < B.length; j++) {
      const a0 = A[2 * j], a1 = A[2 * j + 1], a2 = A[(2 * j + 2) % A.length];
      const b0 = B[j], b1 = B[(j + 1) % B.length];
      this.tri(a0, a1, b0);
      this.tri(a1, a2, b1);
      this.tri(b0, a1, b1);
    }
  }
  fan(A: THREE.Vector3[], apex: THREE.Vector3) {
    for (let k = 0; k < A.length; k++) this.tri(A[k], A[(k + 1) % A.length], apex);
  }
  cap(A: THREE.Vector3[]) {
    const c = new THREE.Vector3();
    A.forEach((p) => c.add(p));
    this.fan(A, c.divideScalar(A.length));
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.computeVertexNormals();
    return g;
  }
}

const ring = (o: Outline, n: number, sx: number, sz: number, y: number) =>
  Array.from({ length: n }, (_, k) => {
    const [x, z] = o.at(k / n);
    return new THREE.Vector3(x * sx, y, z * sz);
  });

const vring = (verts: V2[], sx: number, sz: number, y: number) => verts.map(([x, z]) => new THREE.Vector3(x * sx, y, z * sz));

/** A faceted stone with its girdle at y = 0: brilliant pattern, or a step cut for the emerald. */
export function stoneGeometry(cut: Cut, s: StoneSpec, girdlePoints = 32) {
  const o = outlineFor(cut, s.W, s.L);
  const f = new Facets();
  const top = s.g / 2;
  const bot = -s.g / 2;
  if (cut === 'emerald' && o.verts) {
    const v = o.verts;
    const crown = [
      vring(v, 1, 1, top),
      vring(v, 0.9, 0.92, top + 0.4 * s.hc),
      vring(v, 0.8, 0.84, top + 0.75 * s.hc),
      vring(v, 0.7, 0.76, top + s.hc),
    ];
    const pav = [
      vring(v, 1, 1, bot),
      vring(v, 0.78, 0.84, bot - 0.35 * s.dp),
      vring(v, 0.5, 0.64, bot - 0.7 * s.dp),
      vring(v, 0.03, 0.42, bot - s.dp),
    ];
    for (let i = 0; i < 3; i++) f.same(crown[i], crown[i + 1]);
    f.cap(crown[3]);
    for (let i = 0; i < 3; i++) f.same(pav[i], pav[i + 1]);
    f.same(crown[0], pav[0]);
    return f.geometry();
  }
  const n = girdlePoints;
  const G1 = ring(o, n, 1, 1, top);
  const G0 = ring(o, n, 1, 1, bot);
  const B = ring(o, n / 2, 0.79, 0.81, top + 0.55 * s.hc);
  const T = ring(o, n / 4, 0.56, 0.6, top + s.hc);
  const Q = ring(o, n / 2, 0.3, 0.32, bot - 0.78 * s.dp);
  f.half(G1, B);
  f.half(B, T);
  f.cap(T);
  f.same(G1, G0);
  f.half(G0, Q);
  f.fan(Q, new THREE.Vector3(0, bot - s.dp, 0));
  return f.geometry();
}

/* ------------------------------------------------------------- metal */

/**
 * Sweeps a closed cross-section around a stone outline. Each profile point is
 * [scale toward the centre, offset along the outline's outward normal, height].
 */
function sweep(o: Outline, profile: Array<[number, number, number]>, samples = 96) {
  const NP = profile.length;
  const pos = new Float32Array(samples * NP * 3);
  const centres: THREE.Vector3[] = [];
  for (let i = 0; i < samples; i++) {
    const t = i / samples;
    const [x, z] = o.at(t);
    const [nx, nz] = outwardNormal(o, t);
    const c = new THREE.Vector3();
    for (let j = 0; j < NP; j++) {
      const [sc, off, y] = profile[j];
      const k = (i * NP + j) * 3;
      pos[k] = x * sc + nx * off;
      pos[k + 1] = y;
      pos[k + 2] = z * sc + nz * off;
      c.add(new THREE.Vector3(pos[k], pos[k + 1], pos[k + 2]));
    }
    centres.push(c.divideScalar(NP));
  }
  const build = (flip: boolean) => {
    const idx: number[] = [];
    for (let i = 0; i < samples; i++) {
      for (let j = 0; j < NP; j++) {
        const a = i * NP + j;
        const b = ((i + 1) % samples) * NP + j;
        const c = ((i + 1) % samples) * NP + ((j + 1) % NP);
        const d = i * NP + ((j + 1) % NP);
        if (flip) idx.push(a, d, b, b, d, c);
        else idx.push(a, b, d, b, c, d);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };
  const g = build(false);
  // Normals should point out of the tube, away from each cross-section's centre.
  const nrm = g.getAttribute('normal');
  let score = 0;
  for (let i = 0; i < samples; i += 8) {
    for (let j = 0; j < NP; j++) {
      const k = i * NP + j;
      score +=
        nrm.getX(k) * (pos[k * 3] - centres[i].x) +
        nrm.getY(k) * (pos[k * 3 + 1] - centres[i].y) +
        nrm.getZ(k) * (pos[k * 3 + 2] - centres[i].z);
    }
  }
  if (score >= 0) return g;
  g.dispose();
  return build(true);
}

/** Round wire following a path, with domed ends. */
function wire(points: THREE.Vector3[], r: number, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal');
  const out: THREE.BufferGeometry[] = [new THREE.TubeGeometry(curve, closed ? 128 : 48, r, 14, closed)];
  if (!closed) {
    const tip = new THREE.SphereGeometry(r * 1.08, 20, 14);
    const p = points[points.length - 1];
    tip.translate(p.x, p.y, p.z);
    out.push(tip);
  }
  return out;
}

const PRONGS: Record<Cut, number[]> = {
  round: [1 / 8, 3 / 8, 5 / 8, 7 / 8],
  oval: [1 / 8, 3 / 8, 5 / 8, 7 / 8],
  emerald: [1.5 / 8, 3.5 / 8, 5.5 / 8, 7.5 / 8],
  pear: [0, 0.3, 0.5, 0.7],
};

/* --------------------------------------------------------- assembly */

export type Placement = { pos: THREE.Vector3; up: THREE.Vector3; size: number };

export type RingModel = {
  band: THREE.BufferGeometry;
  metal: THREE.BufferGeometry[];
  stone: THREE.BufferGeometry;
  stoneY: number;
  accents: Placement[];
  beads: Placement[];
  bottom: number;
};

export function buildRing({ cut, setting, band }: Geometry, carat: number): RingModel {
  const s = stoneSpec(cut, carat);
  const o = outlineFor(cut, s.W, s.L);
  const t0 = bandSize(band, 0).t;
  const bandTop = INNER_R + t0;
  const yg = bandTop + 0.6 * s.dp + s.g / 2; // set low: the culet tucks into the band under the gallery
  const r = 0.044 * Math.sqrt(s.W / 0.9);
  const metal: THREE.BufferGeometry[] = [];
  const accents: Placement[] = [];
  const beads: Placement[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const crownTop = yg + s.g / 2;
  const pavTop = yg - s.g / 2;

  const P = (t: number, scale: number, out: number, y: number) => {
    const [x, z] = o.at(t);
    const [nx, nz] = outwardNormal(o, t);
    return new THREE.Vector3(x * scale + nx * out, y, z * scale + nz * out);
  };

  const collarBase = pavTop - 0.1;
  for (const t of PRONGS[cut]) {
    // Claws rise from the band, hug the pavilion and fold over the crown; under a bezel
    // the same posts stop at the collar.
    const path = [
      P(t, 0.16, 0, bandTop - 0.06),
      P(t, 0.42, r * 0.95, pavTop - s.dp * 0.62),
      P(t, 0.74, r * 0.95, pavTop - s.dp * 0.27),
    ];
    if (setting === 'bezel') path.push(P(t, 0.94, 0.035, collarBase + 0.01));
    else path.push(P(t, 1, r * 0.95, yg), P(t, 0.935, r * 0.45, crownTop + s.hc * 0.2 + r * 0.6));
    metal.push(...wire(path, r));
  }
  // Gallery rail tying the posts together under the stone.
  metal.push(...wire(Array.from({ length: 48 }, (_, k) => P(k / 48, 0.56, r * 0.9, pavTop - s.dp * 0.44)), r * 0.72, true));

  if (setting === 'bezel') {
    // A slim polished collar wrapping the girdle, open underneath so light reaches the stone.
    const lip = crownTop + 0.03;
    metal.push(
      sweep(o, [
        [1, -0.026, lip - 0.012],
        [1, -0.01, lip],
        [1, 0.032, lip + 0.003],
        [1, 0.052, lip - 0.016],
        [1, 0.058, collarBase + 0.02],
        [0.99, 0.045, collarBase],
        [0.97, 0.0, collarBase],
        [0.98, -0.02, collarBase + 0.03],
        [1, -0.022, pavTop - 0.01],
      ]),
    );
  } else {
    if (setting === 'halo') {
      const hy = pavTop - 0.06;
      metal.push(...wire(Array.from({ length: 64 }, (_, k) => P(k / 64, 0.97, 0.03, hy)), 0.05, true));
      let perim = 0;
      for (let k = 0; k < 256; k++) {
        const a = o.at(k / 256);
        const b = o.at((k + 1) / 256);
        perim += Math.hypot(b[0] - a[0], b[1] - a[1]);
      }
      const d = 0.07;
      const count = Math.floor(perim / (d * 1.12));
      for (let k = 0; k < count; k++) {
        const t = k / count;
        const [nx, nz] = outwardNormal(o, t);
        accents.push({
          pos: P(t, 0.97, 0.03 + 0.045, hy + 0.012),
          up: new THREE.Vector3(nx * 0.8, 0.6, nz * 0.8).normalize(),
          size: d,
        });
      }
    }
  }

  // Diamonds set into the band, each held by small beads of metal.
  if (band !== 'plain') {
    const R0 = bandTop;
    const thStart = Math.asin(Math.min(0.9, (s.W * 0.28 + 0.06) / R0));
    const thEnd = band === 'pave' ? 1.75 : Math.PI * 2 - thStart;
    const sides = band === 'pave' ? [1, -1] : [1];
    for (const side of sides) {
      let th = thStart;
      let prev: number | null = null;
      while (true) {
        const { w, t } = bandSize(band, th);
        const d = w * 0.5;
        const rad = INNER_R + t;
        const thc = th + (d * 0.58) / rad;
        if (thc > thEnd) break;
        const dir = new THREE.Vector3(Math.sin(side * thc), Math.cos(thc), 0);
        accents.push({ pos: dir.clone().multiplyScalar(rad - 0.03 * d), up: dir, size: d });
        if (prev !== null) {
          const mid = (prev + thc) / 2;
          const md = new THREE.Vector3(Math.sin(side * mid), Math.cos(mid), 0);
          for (const z of [-1, 1]) {
            beads.push({ pos: md.clone().multiplyScalar(rad + 0.004).setZ(z * d * 0.5), up: md, size: 0.0135 });
          }
        }
        prev = thc;
        th = thc + (d * 0.58) / rad;
      }
    }
  }

  return {
    band: bandGeometry(band),
    metal,
    stone: stoneGeometry(cut, s),
    stoneY: yg,
    accents,
    beads,
    bottom: -(INNER_R + bandSize(band, Math.PI).t),
  };
}

/** A small round brilliant (diameter 1) for pavé and halo stones. */
export function accentGeometry() {
  return stoneGeometry('round', { W: 1, L: 1, hc: 0.16, dp: 0.43, g: 0.02 }, 32);
}

/* ------------------------------------------------------- environment */

type Box = { lon: number; el: number; w: number; h: number; v: number; tint?: [number, number, number] };

/** The studio's softboxes and strip lights: longitude and elevation in radians, brightness, tint. */
const STUDIO_BOXES: Box[] = [
  { lon: 0.55, el: 0.35, w: 0.38, h: 0.42, v: 7, tint: [1, 0.97, 0.93] },
  { lon: -1.9, el: 0.25, w: 0.42, h: 0.5, v: 4 },
  { lon: 2.55, el: 0.12, w: 0.22, h: 0.6, v: 5 },
  { lon: 1.45, el: 0.0, w: 0.05, h: 0.95, v: 10 },
  { lon: -0.65, el: 0.05, w: 0.045, h: 0.9, v: 9 },
  { lon: -2.75, el: 0.4, w: 0.06, h: 0.5, v: 6 },
];

/**
 * World directions of the brightest lights in the studio, matching how three.js reads an
 * equirect (longitude = atan2(z, x), elevation = asin(y)). A facet flashes when it mirrors one.
 */
export function studioKeyLights(count = 4): THREE.Vector3[] {
  return [...STUDIO_BOXES]
    .sort((a, b) => b.v - a.v)
    .slice(0, count)
    .map((b) => new THREE.Vector3(Math.cos(b.el) * Math.cos(b.lon), Math.sin(b.el), Math.cos(b.el) * Math.sin(b.lon)).normalize());
}

/**
 * A photographic jewellery studio as an HDR equirect: bright softboxes and strip lights
 * for the sparkle, black flags for the contrast lines that make polished metal read.
 */
export function studioEnvironment() {
  const W = 1024;
  const H = 512;
  const data = new Uint16Array(W * H * 4);
  const boxes = STUDIO_BOXES;
  const flags: Box[] = [
    { lon: 3.0, el: 0.1, w: 0.42, h: 0.75, v: 0.03 },
    { lon: 1.0, el: 0.1, w: 0.14, h: 0.7, v: 0.06 },
    { lon: -1.25, el: 0.15, w: 0.16, h: 0.65, v: 0.05 },
  ];
  const soft = (x: number) => {
    const a = Math.min(1, Math.max(0, (1 - x) / 0.18));
    return a * a * (3 - 2 * a);
  };
  const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
  // Every light is a soft rectangle, separable in longitude and elevation: precompute both.
  const lights = [...boxes, ...flags];
  const lonF = lights.map((b) => Float32Array.from({ length: W }, (_, i) => soft(Math.abs(wrap(-Math.PI + ((i + 0.5) / W) * Math.PI * 2 - b.lon)) / b.w)));
  const elF = lights.map((b) => Float32Array.from({ length: H }, (_, j) => soft(Math.abs(-Math.PI / 2 + ((j + 0.5) / H) * Math.PI - b.el) / b.h)));
  const one = THREE.DataUtils.toHalfFloat(1);
  for (let j = 0; j < H; j++) {
    const el = -Math.PI / 2 + ((j + 0.5) / H) * Math.PI;
    // Below the horizon is the pale studio floor: it bounces light back up, so white metals stay bright.
    const base = (el > 0 ? 0.55 + 0.35 * Math.sin(el) : 0.58 + 0.3 * Math.sin(el)) + (el > 1.15 ? 2.2 * soft((Math.PI / 2 - el) / 0.42) : 0);
    for (let i = 0; i < W; i++) {
      let r = base, g = base, b = base;
      for (let l = 0; l < lights.length; l++) {
        const m = elF[l][j] && lonF[l][i] * elF[l][j];
        if (!m) continue;
        const L = lights[l];
        if (l < boxes.length) {
          r += m * L.v * (L.tint ? L.tint[0] : 1);
          g += m * L.v * (L.tint ? L.tint[1] : 1);
          b += m * L.v * (L.tint ? L.tint[2] : 1);
        } else {
          r = r * (1 - m) + L.v * m;
          g = g * (1 - m) + L.v * m;
          b = b * (1 - m) + L.v * m;
        }
      }
      const k = (j * W + i) * 4;
      data[k] = THREE.DataUtils.toHalfFloat(r);
      data[k + 1] = THREE.DataUtils.toHalfFloat(g);
      data[k + 2] = THREE.DataUtils.toHalfFloat(b);
      data[k + 3] = one;
    }
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/* ------------------------------------------------ procedural textures */

/**
 * Fine streaks that run along U (around the finger). Used as a roughness map, it gives satin
 * metal a real brushed grain instead of a flat blur; near 1 everywhere, so polish is unaffected.
 */
export function grainTexture() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = S;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(4, S);
  let prev = 0.5;
  for (let y = 0; y < S; y++) {
    // A slightly correlated random walk across the width of the band, so streaks have body.
    prev = prev * 0.55 + Math.random() * 0.45;
    const v = Math.round((0.72 + 0.28 * prev) * 255);
    for (let x = 0; x < 4; x++) img.data.set([v, v, v, 255], (y * 4 + x) * 4);
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/**
 * Light focused through a faceted stone onto the surface below: a network of bright ridges
 * (sum of warped sine ridges) inside a soft radial falloff. White with alpha, so the material
 * colour can tint it to the gemstone.
 */
export function causticTexture() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(S, S);
  for (let j = 0; j < S; j++) {
    for (let i = 0; i < S; i++) {
      const x = i / S;
      const y = j / S;
      let v = 0;
      for (let k = 0; k < 4; k++) {
        const a = k * 1.7 + 0.4;
        const u = x * Math.cos(a) + y * Math.sin(a);
        const w = (y * Math.cos(a) - x * Math.sin(a)) * 9 + k * 1.3;
        const ridge = 1 - Math.abs(Math.sin((u + 0.16 * Math.sin(w)) * (5 + k * 3.2) * Math.PI));
        v += Math.pow(ridge, 7);
      }
      const d = Math.hypot(x - 0.5, y - 0.5) * 2;
      const fall = Math.max(0, 1 - d);
      const m = fall * fall * (3 - 2 * fall);
      const a = Math.min(1, v * 0.5) * m;
      img.data.set([255, 255, 255, Math.round(a * 255)], (j * S + i) * 4);
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}


/* ------------------------------------------------------------ glints */

export type GlintSite = { pos: THREE.Vector3; normal: THREE.Vector3; size: number; phase: number };

/** A small seeded random generator, so the sparkle pattern is the same on every visit. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Where a ring can throw a star of light: points on the centre stone's crown facets (each
 * with that facet's slope), the table, and the top of every small stone. Positions are in
 * the ring's local space, matching the group the stone is drawn in.
 */
export function glintSites(cut: Cut, carat: number, model: RingModel): GlintSite[] {
  const s = stoneSpec(cut, carat);
  const o = outlineFor(cut, s.W, s.L);
  const rnd = seeded(cut.length * 97 + Math.round(carat * 10));
  const sites: GlintSite[] = [];
  const crownBase = model.stoneY + s.g / 2;
  const n = 16;
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n;
    const [x, z] = o.at(t);
    const [nx, nz] = outwardNormal(o, t);
    const inner = k % 2 === 1; // alternate star facets (near the table) and upper girdle facets
    const f = inner ? 0.62 : 0.86;
    const slope = inner ? 0.4 : 0.66;
    sites.push({
      pos: new THREE.Vector3(x * f, crownBase + s.hc * (1 - f) * 1.15, z * f),
      normal: new THREE.Vector3(nx * Math.sin(slope), Math.cos(slope), nz * Math.sin(slope)).normalize(),
      size: s.W * (inner ? 0.17 : 0.22),
      phase: rnd(),
    });
  }
  sites.push({ pos: new THREE.Vector3(0, crownBase + s.hc, 0), normal: new THREE.Vector3(0, 1, 0), size: s.W * 0.26, phase: rnd() });
  for (const a of model.accents) {
    const jitter = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.55);
    sites.push({
      pos: a.pos.clone().addScaledVector(a.up, a.size * 0.2),
      normal: a.up.clone().add(jitter).normalize(),
      size: a.size * 1.05,
      phase: rnd(),
    });
  }
  return sites;
}

/** A soft round pool of light for the floor: white in the middle, fading to nothing. */
export function poolTexture() {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.62)');
  g.addColorStop(0.65, 'rgba(255,255,255,0.18)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}
