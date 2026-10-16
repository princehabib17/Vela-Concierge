/**
 * Composites the pre-rendered ring layers (see tools/blender/render_layers.py) in WebGL.
 *
 * One set of Blender renders covers every metal and stone colour: the metal layers are
 * rendered in neutral white metal and tinted here, which also lets us animate a material
 * change as a wipe sweeping across the ring.
 */

export const FRAMES = 24;

export type Cut = 'round' | 'oval' | 'emerald' | 'pear';
export type Setting = 'claw' | 'halo' | 'bezel';
export type Band = 'plain' | 'pave' | 'eternity';
export type Metal = 'yellow' | 'white' | 'rose' | 'platinum';
export type Gem = 'diamond' | 'sapphire' | 'ruby' | 'emerald';
export type Mode = 'sway' | 'side' | 'spin';

export type Geometry = { cut: Cut; setting: Setting; band: Band };
export type Materials = { metal: Metal; gem: Gem };

type RGB = [number, number, number];

export const METAL_TINT: Record<Metal, RGB> = {
  yellow: [1.0, 0.82, 0.47],
  white: [0.93, 0.92, 0.9],
  rose: [0.97, 0.7, 0.6],
  platinum: [0.9, 0.91, 0.93],
};

const GEM_RAW: Record<Gem, RGB> = {
  diamond: [1, 1, 1],
  sapphire: [0.25, 0.42, 1],
  ruby: [1, 0.18, 0.26],
  emerald: [0.2, 0.85, 0.5],
};

const gemTint = (g: Gem): RGB =>
  g === 'diamond' ? [1, 1, 1] : (GEM_RAW[g].map((v) => Math.min(1, 0.25 + 0.75 * v)) as RGB);

type LayerKind = 'shadow' | 'stone' | 'metal' | 'plain';
type LayerRef = { name: string; kind: LayerKind };

export function layersFor(g: Geometry): LayerRef[] {
  const layers: LayerRef[] = [
    { name: 'shadow', kind: 'shadow' },
    { name: `stone_${g.cut}`, kind: 'stone' },
    { name: `metal_${g.cut}_${g.setting}`, kind: 'metal' },
  ];
  if (g.setting === 'halo') layers.push({ name: `halo_${g.cut}`, kind: 'plain' });
  if (g.band !== 'plain') layers.push({ name: g.band, kind: 'plain' });
  return layers;
}

const frameUrl = (layer: string, f: number) => `/ring/${layer}/${String(f).padStart(2, '0')}.webp`;

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  vUv.y = 1.0 - vUv.y;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uA;
uniform sampler2D uB;
uniform float uMix;
uniform vec3 uFrom;
uniform vec3 uTo;
uniform float uWipe;
uniform float uKind;     // 0 plain, 1 tinted, 2 shadow
uniform float uOpacity;
void main() {
  vec4 c = mix(texture2D(uA, vUv), texture2D(uB, vUv), uMix);   // premultiplied
  if (uKind > 1.5) {
    float a = c.a * uOpacity;
    gl_FragColor = vec4(vec3(0.20, 0.16, 0.13) * a, a);
    return;
  }
  vec3 tint = vec3(1.0);
  if (uKind > 0.5) {
    float m = smoothstep(uWipe - 0.22, uWipe + 0.22, vUv.x * 0.72 + (1.0 - vUv.y) * 0.45);
    tint = mix(uTo, uFrom, m);
  }
  gl_FragColor = vec4(c.rgb * tint, c.a) * uOpacity;
}`;

type Tex = { tex: WebGLTexture };
type Scene = { geo: Geometry; layers: LayerRef[] };

export class RingEngine {
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private cache = new Map<string, Tex | 'missing'>();
  private pending = new Map<string, Promise<void>>();
  private scene: Scene | null = null;
  private raf = 0;
  private destroyed = false;
  private reduced = false;

  private pos = 0;
  private userOffset = 0;
  private swayWeight = 1;
  private lastInteract = 0;
  private dragging = false;
  private lastX = 0;
  private mode: Mode = 'sway';
  private modeBase = 3;
  private homing = false;
  private t0 = performance.now();
  private last = performance.now();

  private metalFrom: RGB = METAL_TINT.platinum;
  private metalTo: RGB = METAL_TINT.yellow;
  private gemFrom: RGB = [1, 1, 1];
  private gemTo: RGB = [1, 1, 1];
  private wipeStart = -1;
  private wipeMs = 1100;
  private geoToken = 0;
  private introDone = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private overlay: HTMLCanvasElement,
    private hooks: { onReady?: () => void; onBusy?: (busy: boolean) => void } = {},
  ) {
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
    if (!gl) throw new Error('WebGL unavailable');
    this.gl = gl;
    this.reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const mk = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    this.prog = prog;
    gl.useProgram(prog);
    for (const n of ['uA', 'uB', 'uMix', 'uFrom', 'uTo', 'uWipe', 'uKind', 'uOpacity']) {
      this.u[n] = gl.getUniformLocation(prog, n);
    }
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);

    const loop = (now: number) => {
      if (this.destroyed) return;
      this.tick(now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
  }

  /* ── input ───────────────────────────────────────────────────────── */

  pointerDown(x: number) {
    this.dragging = true;
    this.homing = false;
    this.lastX = x;
    this.swayWeight = 0;
  }

  pointerMove(x: number, width: number) {
    if (!this.dragging) return;
    this.userOffset -= ((x - this.lastX) / width) * FRAMES * 1.05;
    this.lastX = x;
  }

  pointerUp() {
    this.dragging = false;
    this.lastInteract = performance.now();
  }

  setMode(mode: Mode) {
    this.mode = mode;
    this.homing = mode !== 'spin';
    this.swayWeight = 0;
    this.lastInteract = performance.now();
  }

  /* ── material change: animated wipe ──────────────────────────────── */

  setMaterials(m: Materials, instant = false) {
    const nextMetal = METAL_TINT[m.metal];
    const nextGem = gemTint(m.gem);
    if (instant) {
      this.metalFrom = this.metalTo = nextMetal;
      this.gemFrom = this.gemTo = nextGem;
      this.wipeStart = -1;
      return;
    }
    this.metalFrom = this.metalTo;
    this.gemFrom = this.gemTo;
    this.metalTo = nextMetal;
    this.gemTo = nextGem;
    this.wipeStart = performance.now();
  }

  private wipeProgress() {
    if (this.wipeStart < 0) return 1;
    return Math.max(0, Math.min(1, (performance.now() - this.wipeStart) / this.wipeMs));
  }

  /* ── geometry change: load, then dissolve ────────────────────────── */

  async setGeometry(geo: Geometry) {
    const token = ++this.geoToken;
    const layers = layersFor(geo);
    this.hooks.onBusy?.(true);
    const f = Math.floor(this.frameNow());
    // show as soon as the frames around the current angle exist for every layer
    await Promise.all(layers.map((l) => this.ensure(l.name, f)));
    await Promise.all(layers.map((l) => this.ensure(l.name, (f + 1) % FRAMES)));
    if (this.destroyed || token !== this.geoToken) return;

    if (this.scene) this.dissolve();
    this.scene = { geo, layers };
    this.hooks.onBusy?.(false);
    if (!this.introDone) {
      this.introDone = true;
      this.wipeStart = performance.now() + 250;  // gold floods in once the ring appears
      this.hooks.onReady?.();
    }
    // stream in the remaining frames, nearest first
    const order = [...Array(FRAMES).keys()].sort(
      (a, b) => Math.min((a - f + FRAMES) % FRAMES, (f - a + FRAMES) % FRAMES) -
        Math.min((b - f + FRAMES) % FRAMES, (f - b + FRAMES) % FRAMES),
    );
    for (const fr of order) {
      if (this.destroyed || token !== this.geoToken) return;
      await Promise.all(layers.map((l) => this.ensure(l.name, fr)));
    }
  }

  /** Freeze the old picture on the overlay and let CSS fade it out. */
  private dissolve() {
    const o = this.overlay;
    o.width = this.canvas.width;
    o.height = this.canvas.height;
    const ctx = o.getContext('2d');
    if (!ctx) return;
    this.render(performance.now());
    ctx.drawImage(this.canvas, 0, 0);
    o.style.transition = 'none';
    o.style.opacity = '1';
    void o.offsetWidth;
    o.style.transition = 'opacity 520ms cubic-bezier(0.22, 1, 0.36, 1)';
    o.style.opacity = '0';
  }

  /* ── textures ────────────────────────────────────────────────────── */

  private ensure(layer: string, f: number): Promise<void> {
    const key = frameUrl(layer, f);
    if (this.cache.has(key)) return Promise.resolve();
    const inflight = this.pending.get(key);
    if (inflight) return inflight;
    const p = new Promise<void>((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (!this.destroyed) {
          const gl = this.gl;
          const tex = gl.createTexture()!;
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          this.cache.set(key, { tex });
        }
        resolve();
      };
      img.onerror = () => {
        this.cache.set(key, 'missing');
        resolve();
      };
      img.src = key;
    }).finally(() => this.pending.delete(key));
    this.pending.set(key, p);
    return p;
  }

  private nearest(layer: string, f: number): Tex | null {
    for (let d = 0; d < FRAMES / 2; d++) {
      for (const g of [f - d, f + d]) {
        const e = this.cache.get(frameUrl(layer, (g + FRAMES * 2) % FRAMES));
        if (e && e !== 'missing') return e;
      }
    }
    return null;
  }

  /* ── frame loop ──────────────────────────────────────────────────── */

  private frameNow() {
    return ((this.pos % FRAMES) + FRAMES) % FRAMES;
  }

  private tick(now: number) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;

    if (this.homing) {
      const home = Math.round(this.userOffset / FRAMES) * FRAMES;
      this.userOffset += (home - this.userOffset) * (1 - Math.exp(-dt * 3));
    }
    const baseTarget = this.mode === 'side' ? FRAMES / 4 : this.mode === 'spin' ? 0 : 3;
    this.modeBase += (baseTarget - this.modeBase) * (1 - Math.exp(-dt * 3));
    if (!this.dragging && this.mode !== 'spin' && now - this.lastInteract > 900) {
      this.swayWeight = Math.min(1, this.swayWeight + dt / 1.6);
    }
    const swing = this.mode === 'side' ? 0.6 : 2.1;
    const sway = this.reduced ? 0 : Math.sin(((now - this.t0) / 1000) * 0.42) * swing * this.swayWeight;
    if (this.mode === 'spin' && !this.dragging) this.userOffset += dt * 2.4;
    this.pos = this.userOffset + this.modeBase + sway;
    this.render(now);
  }

  private render(_now: number) {
    const gl = this.gl;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(this.canvas.clientWidth * dpr);
    const h = Math.round(this.canvas.clientHeight * dpr);
    if (!w || !h) return;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!this.scene) return;

    // square picture sized so the ring fills the stage, clear of the mode pills at the bottom
    const inset = Math.round(64 * dpr);
    const side = Math.min(w * 1.3, (h - inset) * 1.4);
    const x0 = Math.round((w - side) / 2);
    const y0 = Math.round(inset + (h - inset - side) / 2);
    gl.viewport(x0, y0, Math.round(side), Math.round(side));

    const f = this.frameNow();
    const f0 = Math.floor(f);
    const f1 = (f0 + 1) % FRAMES;
    // hold each rendered frame crisp and only blend briefly between them
    const u = Math.min(1, Math.max(0, (f - f0 - 0.3) / 0.4));
    const mix = u * u * (3 - 2 * u);

    let wipe = this.wipeProgress();
    wipe = wipe < 1 ? -0.3 + (1 - Math.pow(1 - wipe, 3)) * 1.6 : 2;

    for (const layer of this.scene.layers) {
      const a = this.nearest(layer.name, f0);
      const b = this.nearest(layer.name, f1);
      if (!a || !b) continue;
      const isGem = layer.kind === 'stone';
      const kind = layer.kind === 'shadow' ? 2 : layer.kind === 'plain' ? 0 : 1;
      const from = isGem ? this.gemFrom : this.metalFrom;
      const to = isGem ? this.gemTo : this.metalTo;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, a.tex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, b.tex);
      gl.uniform1i(this.u.uA, 0);
      gl.uniform1i(this.u.uB, 1);
      gl.uniform1f(this.u.uMix, mix);
      gl.uniform3f(this.u.uFrom, from[0], from[1], from[2]);
      gl.uniform3f(this.u.uTo, to[0], to[1], to[2]);
      gl.uniform1f(this.u.uWipe, wipe);
      gl.uniform1f(this.u.uKind, kind);
      gl.uniform1f(this.u.uOpacity, layer.kind === 'shadow' ? 0.62 : 1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }
}
