import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, MeshRefractionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import {
  accentGeometry,
  buildRing,
  causticTexture,
  glintSites,
  grainTexture,
  poolTexture,
  studioEnvironment,
  studioKeyLights,
  type GlintSite,
  type Placement,
} from '@/lib/ringModel';
import type { Cut, Finish, Gem, Geometry, Materials, Metal, Mode } from '@/lib/ringTypes';

/** UI laid over the canvas, in CSS pixels. The ring is framed in the space that is left. */
export type Insets = { top: number; right: number; bottom: number; left: number };
const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

type Props = {
  geometry: Geometry;
  materials: Materials;
  mode: Mode;
  label: string;
  carat?: number;
  /** The camera shot to hold: one per configurator step, plus the close-ups of the finale. */
  shot?: string;
  /** Cuts to stand on the turntable, the chosen one in front; null shows the chosen ring alone. */
  carousel?: readonly Cut[] | null;
  insets?: Insets;
  /** Whether the visitor can turn the ring by dragging. */
  interactive?: boolean;
};

const METAL: Record<Metal, { color: string; roughness: number }> = {
  yellow: { color: '#f0bd62', roughness: 0.08 },
  white: { color: '#eceae5', roughness: 0.07 },
  rose: { color: '#eba88d', roughness: 0.08 },
  platinum: { color: '#d4d6da', roughness: 0.11 },
};

const GEM: Record<Gem, { color: string; ior: number; aberration: number }> = {
  diamond: { color: '#ffffff', ior: 2.42, aberration: 0.03 },
  sapphire: { color: '#3d5cff', ior: 1.77, aberration: 0.006 },
  ruby: { color: '#ff2a4a', ior: 1.77, aberration: 0.006 },
  emerald: { color: '#22c96f', ior: 1.58, aberration: 0.004 },
};

/** Mirror polish keeps the shine; satin trades it for a brushed, stretched highlight. */
const FINISH: Record<Finish, { roughness: number; anisotropy: number; env: number }> = {
  polished: { roughness: 0, anisotropy: 0, env: 1.55 },
  satin: { roughness: 0.34, anisotropy: 0.85, env: 1.3 },
};

/** Light a stone throws on the surface below: a warm white for diamond, the stone's own hue otherwise. */
const CAUSTIC: Record<Gem, { color: string; opacity: number }> = {
  diamond: { color: '#fff4e2', opacity: 0.42 },
  sapphire: { color: '#7d93ff', opacity: 0.62 },
  ruby: { color: '#ff6f86', opacity: 0.62 },
  emerald: { color: '#5ee09a', opacity: 0.58 },
};

/**
 * Where the camera and the ring rest for each shot, like a product film: wide for shape,
 * close on the claws for setting, down onto the stone for stone. zoom scales the fitted
 * distance, lookY aims the camera, yaw and tilt pose the ring.
 */
type Shot = { zoom: number; lookY: number; yaw: number; tilt: number };
const SHOTS: Record<string, Shot> = {
  shape: { zoom: 0.88, lookY: 0, yaw: -0.35, tilt: 1.12 },
  setting: { zoom: 0.78, lookY: 0.4, yaw: -0.55, tilt: 0.95 },
  band: { zoom: 0.9, lookY: 0.12, yaw: 0.95, tilt: 0.72 },
  metal: { zoom: 0.76, lookY: -0.02, yaw: -0.2, tilt: 1.0 },
  stone: { zoom: 0.74, lookY: 0.28, yaw: -0.35, tilt: 1.2 },
  finish: { zoom: 0.88, lookY: 0.1, yaw: 0.5, tilt: 0.78 },
  // The finale's chapters.
  hero: { zoom: 1.02, lookY: 0.02, yaw: -0.5, tilt: 1.05 },
  'close-stone': { zoom: 0.6, lookY: 0.36, yaw: -0.35, tilt: 1.25 },
  'close-setting': { zoom: 0.55, lookY: 0.5, yaw: -0.6, tilt: 0.92 },
  macro: { zoom: 0.46, lookY: 0.42, yaw: 0.85, tilt: 0.88 },
};
const shotFor = (id: string) => SHOTS[id] ?? SHOTS.shape;

type Drag = { active: boolean; lastX: number; lastY: number; pending: number; pendingTilt: number; vel: number; last: number };
type Pose = { yaw: number; tilt: number };
/** Per-frame state shared across the scene: how open the turntable is, its angle and radius. */
type StageState = { spread: number; angle: number; radius: number };

/** Ring-local height of the bottom of the band and half its width, for resting it on the floor. */
const RING_BOTTOM = -1.37;
const RING_HALF_WIDTH = 0.1;
const floorY = (tilt: number) => RING_BOTTOM * Math.cos(tilt) - RING_HALF_WIDTH * Math.sin(tilt) + 0.06;

/**
 * Seen by the main camera but not by the contact-shadow camera: floor light, glints and rings
 * fading on the turntable live here, so they never cast a shadow.
 */
const NO_SHADOW = 1;

const TAU = Math.PI * 2;
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const { damp, lerp, clamp } = THREE.MathUtils;

/**
 * Procedural textures are drawn once and shared by every ring on the stage (the turntable
 * shows four), and kept for the life of the page: they are small and cheap to hold.
 */
const textures: { caustic?: THREE.Texture; pool?: THREE.Texture; grain?: THREE.Texture } = {};
const sharedCaustic = () => (textures.caustic ??= causticTexture());
const sharedPool = () => (textures.pool ??= poolTexture());
const sharedGrain = () => (textures.grain ??= grainTexture());

/* ------------------------------------------------------------ metal sweep */

type Wipe = {
  uFrom: { value: THREE.Color };
  uTo: { value: THREE.Color };
  uWipe: { value: number };
  uWidth: { value: number };
  uGlint: { value: number };
};

const wipeUniforms = (): Wipe => ({
  uFrom: { value: new THREE.Color() },
  uTo: { value: new THREE.Color() },
  uWipe: { value: 1e3 },
  uWidth: { value: 0.28 },
  uGlint: { value: 0 },
});

/**
 * A metal change sweeps across the ring from left to right instead of fading: the new metal
 * takes over behind a soft edge that carries a thin line of light.
 */
function withWipe<T extends THREE.MeshPhysicalMaterial>(m: T, u: Wipe): T {
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWipePos;').replace(
      '#include <project_vertex>',
      `#include <project_vertex>
      vec4 wipeP = vec4( transformed, 1.0 );
      #ifdef USE_INSTANCING
        wipeP = instanceMatrix * wipeP;
      #endif
      vWipePos = ( modelMatrix * wipeP ).xyz;`,
    );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
      varying vec3 vWipePos;
      uniform vec3 uFrom;
      uniform vec3 uTo;
      uniform float uWipe;
      uniform float uWidth;
      uniform float uGlint;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
      float wipeK = smoothstep( uWipe - uWidth, uWipe + uWidth, vWipePos.x );
      diffuseColor.rgb = mix( uTo, uFrom, wipeK );`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
      float wipeEdge = 1.0 - abs( wipeK * 2.0 - 1.0 );
      totalEmissiveRadiance += uGlint * wipeEdge * wipeEdge * vec3( 1.0, 0.93, 0.8 );`,
      );
  };
  m.customProgramCacheKey = () => 'vela-wipe';
  return m;
}

/* ----------------------------------------------------------------- glints */

const GLINT_VERT = /* glsl */ `
  uniform vec3 uLights[4];
  uniform float uTime;
  uniform float uStrength;
  attribute vec3 aPos;
  attribute vec3 aNormal;
  attribute float aSize;
  attribute float aPhase;
  varying vec2 vUv;
  varying float vGlow;
  void main() {
    vec4 world = modelMatrix * vec4( aPos, 1.0 );
    vec3 n = normalize( mat3( modelMatrix ) * aNormal );
    vec3 toEye = normalize( cameraPosition - world.xyz );
    vec3 r = reflect( -toEye, n );
    float g = 0.0;
    for ( int i = 0; i < 4; i++ ) g = max( g, pow( max( dot( r, uLights[ i ] ), 0.0 ), 90.0 ) );
    g *= step( 0.08, dot( n, toEye ) ); // a facet turned away from the eye cannot flash
    float twinkle = 0.7 + 0.3 * sin( uTime * 2.1 + aPhase * 6.2831 );
    vGlow = g * twinkle * uStrength;
    vec4 view = viewMatrix * world;
    view.xyz += normalize( -view.xyz ) * 0.04; // sit just in front of the facet
    view.xy += position.xy * aSize * ( 0.35 + 0.65 * vGlow );
    gl_Position = projectionMatrix * view;
    vUv = uv;
  }
`;

const GLINT_FRAG = /* glsl */ `
  varying vec2 vUv;
  varying float vGlow;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r2 = dot( p, p );
    float core = exp( -r2 * 22.0 );
    float rays = exp( -abs( p.x ) * 30.0 ) * exp( -abs( p.y ) * 2.6 ) + exp( -abs( p.y ) * 30.0 ) * exp( -abs( p.x ) * 2.6 );
    float diag = exp( -abs( p.x - p.y ) * 40.0 ) * exp( -abs( p.x + p.y ) * 4.0 ) + exp( -abs( p.x + p.y ) * 40.0 ) * exp( -abs( p.x - p.y ) * 4.0 );
    float a = ( core + 0.6 * rays + 0.16 * diag ) * vGlow * ( 1.0 - smoothstep( 0.85, 1.0, sqrt( r2 ) ) );
    if ( a < 0.003 ) discard;
    gl_FragColor = vec4( 1.0, 0.985, 0.95, a );
  }
`;

/**
 * Star glints: each facet site flashes only when it mirrors one of the studio's key lights
 * back at the eye, so they come and go as the ring turns, the way a real stone sparkles.
 */
function Glints({ sites, fade }: { sites: GlintSite[]; fade: MutableRefObject<number> }) {
  const geometry = useMemo(() => {
    const quad = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = quad.index;
    g.setAttribute('position', quad.getAttribute('position'));
    g.setAttribute('uv', quad.getAttribute('uv'));
    const n = sites.length;
    const pos = new Float32Array(n * 3);
    const nrm = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const phase = new Float32Array(n);
    sites.forEach((s, i) => {
      pos.set([s.pos.x, s.pos.y, s.pos.z], i * 3);
      nrm.set([s.normal.x, s.normal.y, s.normal.z], i * 3);
      size[i] = s.size;
      phase[i] = s.phase;
    });
    g.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3));
    g.setAttribute('aNormal', new THREE.InstancedBufferAttribute(nrm, 3));
    g.setAttribute('aSize', new THREE.InstancedBufferAttribute(size, 1));
    g.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1));
    g.instanceCount = n;
    return g;
  }, [sites]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uLights: { value: studioKeyLights(4) }, uTime: { value: 0 }, uStrength: { value: 0 } },
        vertexShader: GLINT_VERT,
        fragmentShader: GLINT_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  const mesh = useRef<THREE.Mesh>(null);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    mesh.current.layers.set(NO_SHADOW);
    mesh.current.userData.noShadow = true;
  }, []);
  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
    material.uniforms.uStrength.value = fade.current;
  });
  return <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} renderOrder={5} />;
}

/* ------------------------------------------------------------------ floor */

/**
 * Light on the floor beneath a ring: a soft pool thrown back by the polished metal, and the
 * stone's caustic, tinted to the gem.
 */
function Pools({ gem, metal, fade, still }: { gem: Gem; metal: Metal; fade: MutableRefObject<number>; still: boolean }) {
  const caustic = sharedCaustic();
  const pool = sharedPool();
  const group = useRef<THREE.Group>(null);
  const cm = useRef<THREE.MeshBasicMaterial>(null);
  const pm = useRef<THREE.MeshBasicMaterial>(null);
  const causticColor = useMemo(() => new THREE.Color(CAUSTIC[gem].color), [gem]);
  const poolColor = useMemo(() => new THREE.Color('#ffffff').lerp(new THREE.Color(METAL[metal].color), 0.45), [metal]);
  useLayoutEffect(() => {
    group.current?.traverse((o) => o.layers.set(NO_SHADOW));
  }, []);
  useFrame(({ clock }, delta) => {
    const k = 1 - Math.exp(-6 * Math.min(delta, 0.05));
    const f = fade.current;
    if (group.current) group.current.visible = f > 0.002;
    if (cm.current) {
      cm.current.color.lerp(causticColor, k);
      const shimmer = still ? 0 : 0.08 * Math.sin(clock.elapsedTime * 1.3);
      cm.current.opacity = (CAUSTIC[gem].opacity + shimmer) * f;
    }
    if (pm.current) {
      pm.current.color.lerp(poolColor, k);
      pm.current.opacity = 0.7 * f;
    }
  });
  return (
    <group ref={group}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0.42]} scale={[3.4, 2, 1]} renderOrder={1}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial ref={pm} map={pool} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.15, 0.012, 0.55]} renderOrder={2}>
        <planeGeometry args={[2.6, 2.6]} />
        <meshBasicMaterial ref={cm} map={caustic} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** One soft shadow under everything on the stage, resting under the hero ring as it tips. */
function Floor({ pose }: { pose: MutableRefObject<Pose> }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current) group.current.position.y = floorY(pose.current.tilt);
  });
  return (
    <group ref={group}>
      <ContactShadows opacity={0.3} scale={12} blur={2.4} far={2.4} resolution={1024} color="#000000" />
    </group>
  );
}

/* ------------------------------------------------------------------- ring */

function Placements({
  items,
  geometry,
  material,
  meshRef,
  children,
}: {
  items: Placement[];
  geometry: THREE.BufferGeometry;
  material?: THREE.Material;
  meshRef?: MutableRefObject<THREE.InstancedMesh | null>;
  children?: ReactNode;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (meshRef) meshRef.current = mesh;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const y = new THREE.Vector3(0, 1, 0);
    items.forEach((p, i) => {
      q.setFromUnitVectors(y, p.up);
      m.compose(p.pos, q, new THREE.Vector3(p.size, p.size, p.size));
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items, meshRef]);
  if (!items.length) return null;
  return (
    <instancedMesh key={items.length} ref={ref} args={[geometry, material, items.length]}>
      {children}
    </instancedMesh>
  );
}

type FadeMaterial = THREE.Material & { opacity: number };

function Ring({
  geometry,
  materials,
  carat,
  env,
  fade,
  still,
}: {
  geometry: Geometry;
  materials: Materials;
  carat: number;
  env: THREE.Texture;
  fade: MutableRefObject<number>;
  still: boolean;
}) {
  const { cut, setting, band } = geometry;
  const model = useMemo(() => buildRing({ cut, setting, band }, carat), [cut, setting, band, carat]);
  const sites = useMemo(() => glintSites(cut, carat, model), [cut, carat, model]);
  useEffect(
    () => () => {
      model.band.dispose();
      model.stone.dispose();
      model.metal.forEach((g) => g.dispose());
    },
    [model],
  );

  const wipe = useMemo(wipeUniforms, []);
  const shared = useMemo(
    () => ({
      accent: accentGeometry(),
      bead: new THREE.SphereGeometry(1, 12, 10),
      // Every ring material is created transparent, so fading one in or out on the turntable only
      // changes a number: flipping it opaque/transparent mid-fade would recompile shaders and stall.
      metal: withWipe(new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: 0.08, envMapIntensity: 1.55, transparent: true }), wipe),
      // The shank carries the finish: its UVs run around the finger, so the grain and the
      // anisotropic highlight follow the band. Claws and settings stay mirror-polished.
      band: withWipe(
        new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: 0.08, envMapIntensity: 1.55, roughnessMap: sharedGrain(), anisotropy: 0, transparent: true }),
        wipe,
      ),
    }),
    [wipe],
  );
  useEffect(
    () => () => {
      shared.accent.dispose();
      shared.bead.dispose();
      shared.metal.dispose();
      shared.band.dispose();
    },
    [shared],
  );

  const head = useRef<THREE.Group>(null);
  const stone = useRef<THREE.Mesh>(null);
  const pave = useRef<THREE.InstancedMesh | null>(null);
  const seenStone = useRef<THREE.Material | null>(null);
  const look = METAL[materials.metal];
  const metalColor = useMemo(() => new THREE.Color(look.color), [look.color]);
  const gemColor = useMemo(() => new THREE.Color(GEM[materials.gem].color), [materials.gem]);
  const sweep = useRef({ t: 1, from: new THREE.Color(), first: true });
  const castsShadow = useRef(true);
  const lastMetal = useRef(materials.metal);
  const centre = useMemo(() => new THREE.Vector3(), []);

  // A new metal sweeps in from the left; the first one is simply there.
  useEffect(() => {
    if (lastMetal.current === materials.metal) return;
    lastMetal.current = materials.metal;
    sweep.current.from.copy(wipe.uTo.value);
    sweep.current.t = 0;
  }, [materials.metal, wipe]);

  // A small settle whenever the design changes.
  const key = `${cut}-${setting}-${band}-${carat}`;
  useEffect(() => {
    head.current?.scale.setScalar(0.94);
  }, [key]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const fin = FINISH[materials.finish];
    const sw = sweep.current;
    if (sw.first) {
      wipe.uFrom.value.copy(metalColor);
      wipe.uTo.value.copy(metalColor);
      shared.metal.roughness = look.roughness;
      shared.band.roughness = look.roughness + fin.roughness;
      shared.band.anisotropy = fin.anisotropy;
      shared.band.envMapIntensity = fin.env;
      sw.first = false;
    }

    if (sw.t < 1) {
      sw.t = still ? 1 : Math.min(1, sw.t + dt / 1.05);
      const cx = head.current ? head.current.getWorldPosition(centre).x : 0;
      wipe.uFrom.value.copy(sw.from);
      wipe.uTo.value.copy(metalColor);
      wipe.uWipe.value = cx + lerp(-1.9, 1.9, easeInOut(sw.t));
      wipe.uGlint.value = Math.sin(Math.PI * sw.t) * 1.4;
      if (sw.t >= 1) {
        wipe.uWipe.value = 1e3;
        wipe.uGlint.value = 0;
      }
    } else {
      wipe.uFrom.value.copy(metalColor);
      wipe.uTo.value.copy(metalColor);
    }

    shared.metal.roughness = damp(shared.metal.roughness, look.roughness, 6, dt);
    shared.band.roughness = damp(shared.band.roughness, look.roughness + fin.roughness, 6, dt);
    shared.band.anisotropy = damp(shared.band.anisotropy, fin.anisotropy, 6, dt);
    shared.band.envMapIntensity = damp(shared.band.envMapIntensity, fin.env, 6, dt);

    // The gemstone's colour eases across; a freshly cut stone starts on its colour.
    const sm = stone.current?.material as (THREE.Material & { color: THREE.Color }) | undefined;
    if (sm?.color) {
      if (sm !== seenStone.current) {
        sm.color.copy(gemColor);
        seenStone.current = sm;
      } else sm.color.lerp(gemColor, 1 - Math.exp(-5 * dt));
    }

    // Fading in and out of the turntable.
    const o = fade.current;
    const pm = pave.current?.material as FadeMaterial | undefined;
    for (const m of [shared.metal, shared.band, sm, pm] as Array<FadeMaterial | undefined>) if (m) m.opacity = o;

    const g = head.current;
    if (g) {
      g.visible = o > 0.002;
      g.scale.setScalar(damp(g.scale.x, 1, 7, dt));
      // A ring that is fading is not solid enough to cast a shadow.
      const solid = o > 0.97;
      if (solid !== castsShadow.current) {
        castsShadow.current = solid;
        g.traverse((obj) => {
          if (!obj.userData.noShadow) obj.layers.set(solid ? 0 : NO_SHADOW);
        });
      }
    }
  });

  const gem = GEM[materials.gem];
  return (
    <group ref={head} position={[0, -0.22, 0]}>
      <mesh geometry={model.band} material={shared.band} />
      {model.metal.map((g, i) => (
        <mesh key={`${key}-${i}`} geometry={g} material={shared.metal} />
      ))}
      <mesh ref={stone} key={`stone-${key}`} geometry={model.stone} position={[0, model.stoneY, 0]}>
        <MeshRefractionMaterial envMap={env} bounces={4} ior={gem.ior} fresnel={1} aberrationStrength={gem.aberration} fastChroma toneMapped={false} transparent />
      </mesh>
      {/* Pavé and halo stones are real refracting diamonds too, drawn as one instanced mesh. */}
      <Placements key={`pave-${key}`} items={model.accents} geometry={shared.accent} meshRef={pave}>
        <MeshRefractionMaterial envMap={env} bounces={2} ior={2.42} fresnel={1} aberrationStrength={0.02} fastChroma toneMapped={false} transparent />
      </Placements>
      <Placements items={model.beads} geometry={shared.bead} material={shared.metal} />
      <Glints sites={sites} fade={fade} />
    </group>
  );
}

/* -------------------------------------------------------------- turntable */

/**
 * One ring on the turntable. The chosen ring follows the visitor's drags and the shot's pose
 * and, as the turntable closes, glides to the centre; the others turn to face the middle and
 * fade as they pass behind it or as the turntable closes.
 */
function Item({
  index,
  count,
  chosen,
  stage,
  pose,
  geometry,
  materials,
  carat,
  env,
  still,
}: {
  index: number;
  count: number;
  chosen: boolean;
  stage: MutableRefObject<StageState>;
  pose: MutableRefObject<Pose>;
  geometry: Geometry;
  materials: Materials;
  carat: number;
  env: THREE.Texture;
  still: boolean;
}) {
  const holder = useRef<THREE.Group>(null);
  const yawGroup = useRef<THREE.Group>(null);
  const tiltGroup = useRef<THREE.Group>(null);
  const floor = useRef<THREE.Group>(null);
  const fade = useRef(chosen ? 1 : 0);
  const blend = useRef(chosen ? 1 : 0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const st = stage.current;
    const alpha = (index / count) * TAU + st.angle;
    const r = chosen ? st.radius * st.spread : st.radius;
    holder.current?.position.set(Math.sin(alpha) * r, 0, Math.cos(alpha) * r);

    const visible = clamp((Math.cos(alpha) + 0.55) / 0.55, 0, 1); // gone as it passes behind
    // The others clear quickly once the turntable starts to close.
    fade.current = damp(fade.current, chosen ? visible : visible * st.spread ** 3, 6, dt);

    blend.current = damp(blend.current, chosen ? 1 : 0, 3, dt);
    const b = blend.current;
    // Rings at the sides turn in towards the middle, mirrored left and right.
    const a = wrap(alpha);
    const sideYaw = -a * 0.55 + SHOTS.shape.yaw * Math.max(0, Math.cos(a));
    const heroYaw = sideYaw + wrap(pose.current.yaw - sideYaw);
    const tilt = lerp(SHOTS.shape.tilt, pose.current.tilt, b);
    yawGroup.current?.rotation.set(0, lerp(sideYaw, heroYaw, b), 0);
    tiltGroup.current?.rotation.set(tilt, 0, 0);
    floor.current?.position.set(0, floorY(tilt), 0);
  });

  return (
    <group ref={holder}>
      <group ref={yawGroup}>
        <group ref={tiltGroup}>
          <Ring geometry={geometry} materials={materials} carat={carat} env={env} fade={fade} still={still} />
        </group>
      </group>
      <group ref={floor}>
        <Pools gem={materials.gem} metal={materials.metal} fade={fade} still={still} />
      </group>
    </group>
  );
}

function Showcase({
  carousel,
  geometry,
  materials,
  carat,
  env,
  pose,
  stage,
  still,
}: {
  carousel: readonly Cut[] | null;
  geometry: Geometry;
  materials: Materials;
  carat: number;
  env: THREE.Texture;
  pose: MutableRefObject<Pose>;
  stage: MutableRefObject<StageState>;
  still: boolean;
}) {
  // Keep the last turntable line-up mounted while it closes, so the other rings can fade out.
  const lineup = useRef<readonly Cut[]>(carousel ?? [geometry.cut]);
  if (carousel) lineup.current = carousel;
  const [open, setOpen] = useState(!!carousel);
  useEffect(() => {
    if (carousel) setOpen(true);
  }, [carousel]);
  const list = open ? lineup.current : [geometry.cut];
  const chosenIndex = Math.max(0, list.indexOf(geometry.cut));

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const st = stage.current;
    st.spread = still ? (carousel ? 1 : 0) : damp(st.spread, carousel ? 1 : 0, 2.6, dt);
    const target = -(chosenIndex / list.length) * TAU;
    const step = wrap(target - st.angle);
    st.angle += still ? step : step * (1 - Math.exp(-3.4 * dt));
    if (!carousel && open && st.spread < 0.01) {
      st.angle = 0;
      setOpen(false);
    }
  });

  return (
    <>
      {list.map((cut, i) => (
        <Item
          key={cut}
          index={i}
          count={list.length}
          chosen={cut === geometry.cut}
          stage={stage}
          pose={pose}
          geometry={{ ...geometry, cut }}
          materials={materials}
          carat={carat}
          env={env}
          still={still}
        />
      ))}
    </>
  );
}

/* --------------------------------------------------------- motion, camera */

/**
 * Poses the chosen ring like a product photograph: tipped back so the stone faces the camera
 * and turned on a turntable. Drags turn and tip it; when left alone it settles into the
 * shot's pose and sways gently, or spins.
 */
function HeroMotion({ mode, drag, still, shot, pose }: { mode: Mode; drag: MutableRefObject<Drag>; still: boolean; shot: string; pose: MutableRefObject<Pose> }) {
  const s = useRef({ userTilt: 0, t: 0 });
  useEffect(() => {
    drag.current.last = 0; // a newly chosen mode or shot takes over straight away
  }, [mode, shot, drag]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = pose.current;
    const st = s.current;
    const d = drag.current;
    const aim = shotFor(shot);
    st.t += dt;
    if (d.active) {
      p.yaw += d.pending;
      st.userTilt = clamp(st.userTilt + d.pendingTilt, -0.5, 0.4);
      d.pending = 0;
      d.pendingTilt = 0;
    } else if (Math.abs(d.vel) > 1e-4) {
      p.yaw += d.vel * dt;
      d.vel *= Math.exp(-3.5 * dt);
    }
    const idle = !d.active && performance.now() - d.last > 2200;
    if (idle) {
      st.userTilt = damp(st.userTilt, 0, 2, dt);
      if (mode === 'spin' && !still) p.yaw += dt * 0.5;
      else {
        const target = mode === 'side' ? Math.PI / 2 : aim.yaw + (still ? 0 : 0.3 * Math.sin(st.t * 0.4));
        const near = target + TAU * Math.round((p.yaw - target) / TAU);
        p.yaw = damp(p.yaw, near, 2.2, dt);
      }
    }
    const baseTilt = mode === 'side' ? 0 : aim.tilt;
    p.tilt = damp(p.tilt, clamp(baseTilt + st.userTilt, 0, 1.4), 4, dt);
  });
  return null;
}

/**
 * Frames the shot in the part of the stage the UI leaves free (a shifted view frustum, not a
 * tilted camera), backs off far enough for the whole ring or the whole turntable, and glides
 * between shots. It starts pulled back, for the opening dolly-in.
 */
function CameraRig({ shot, insets, stage }: { shot: string; insets: Insets; stage: MutableRefObject<StageState> }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const st = useRef({ zoom: 1.6, lookY: 0, ...insets });
  useLayoutEffect(() => {
    camera.layers.enable(NO_SHADOW);
  }, [camera]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const c = st.current;
    c.top = damp(c.top, insets.top, 5, dt);
    c.right = damp(c.right, insets.right, 5, dt);
    c.bottom = damp(c.bottom, insets.bottom, 5, dt);
    c.left = damp(c.left, insets.left, 5, dt);
    const W = Math.max(1, size.width);
    const H = Math.max(1, size.height);
    const fw = Math.max(120, W - c.left - c.right);
    const fh = Math.max(120, H - c.top - c.bottom);
    camera.aspect = fw / fh;
    camera.setViewOffset(fw, fh, -c.left, -c.top, W, H);

    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const aspect = fw / fh;
    const sp = stage.current;
    sp.radius = clamp(1.2 + aspect * 0.8, 2.5, 3.4); // never so tight that the side rings crowd the front one
    const R = sp.radius;
    const single = Math.max(1.62 / t, 1.5 / (t * aspect));
    // On the turntable the rings lie tipped back, so they stand barely half as tall as upright.
    // On a narrow screen the side rings peek in from the edges rather than shrinking the front one.
    const sideRoom = lerp(0.2, 1.4, clamp((aspect - 1) / 0.8, 0, 1));
    const turntable = Math.max(1.1 / t + R, (R + sideRoom) / (t * aspect));

    const f = shotFor(shot);
    c.zoom = damp(c.zoom, f.zoom, 2.4, dt);
    c.lookY = damp(c.lookY, f.lookY, 2.4, dt);
    const s = sp.spread;
    const dist = lerp(single * c.zoom, turntable * (0.8 + 0.2 * c.zoom), s);
    const lookZ = R * 0.32 * s;
    camera.position.set(0, 0.25 + c.lookY * 0.4 + s * 0.9, dist + lookZ);
    camera.lookAt(0, lerp(c.lookY, -0.1, s), lookZ);
  });
  return null;
}

function Studio({ env }: { env: THREE.Texture }) {
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    scene.environment = env;
    return () => {
      scene.environment = null;
    };
  }, [scene, env]);
  return null;
}

class StageBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** The live ring: procedural geometry with real refraction in the stones, rendered in three.js. */
export default function RingStage({
  geometry,
  materials,
  mode,
  label,
  carat = 1.5,
  shot = 'shape',
  carousel = null,
  insets = NO_INSETS,
  interactive = true,
}: Props) {
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState(true);
  const [live, setLive] = useState(true);
  const [still, setStill] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag>({ active: false, lastX: 0, lastY: 0, pending: 0, pendingTilt: 0, vel: 0, last: 0 });
  const pose = useRef<Pose>({ yaw: -2.6, tilt: 0.5 }); // arrives turned away and settles into its pose
  const stage = useRef<StageState>({ spread: carousel ? 1 : 0, angle: carousel ? 1.25 : 0, radius: 2.4 });
  const env = useMemo(() => studioEnvironment(), []);
  useEffect(() => () => env.dispose(), [env]);

  // Render only while the ring can actually be seen: off-screen or in a hidden tab the GPU rests.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let onScreen = true;
    let visible = !document.hidden;
    const apply = () => setLive(onScreen && visible);
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      apply();
    });
    io.observe(el);
    const vis = () => {
      visible = !document.hidden;
      apply();
    };
    document.addEventListener('visibilitychange', vis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', vis);
    };
  }, []);

  // Honour the visitor's motion preference: no sway, no spin, no sweeps, no shimmer.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setStill(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const fallback = (
    <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
      <p className="lux-ui text-sm text-stone">This preview needs WebGL. Please try another browser.</p>
    </div>
  );

  const handlers = interactive
    ? {
        onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          Object.assign(drag.current, { active: true, lastX: e.clientX, lastY: e.clientY, vel: 0, last: performance.now() });
          setHint(false);
        },
        onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
          const d = drag.current;
          if (!d.active) return;
          const dx = (e.clientX - d.lastX) * 0.012;
          d.pending += dx;
          d.pendingTilt += (e.clientY - d.lastY) * 0.006;
          const now = performance.now();
          d.vel = dx / Math.max(0.008, (now - d.last) / 1000);
          d.lastX = e.clientX;
          d.lastY = e.clientY;
          d.last = now;
        },
        onPointerUp: () => {
          const d = drag.current;
          d.active = false;
          if (performance.now() - d.last > 80) d.vel = 0;
          d.vel = clamp(d.vel, -8, 8);
          d.last = performance.now();
        },
        onPointerCancel: () => {
          drag.current.active = false;
        },
      }
    : {};

  return (
    <div
      ref={host}
      role="img"
      aria-label={label}
      className={`absolute inset-0 select-none ${interactive ? 'cursor-grab touch-pan-y active:cursor-grabbing' : ''}`}
      {...handlers}
    >
      <StageBoundary fallback={fallback}>
        <Canvas
          dpr={[1, 2]}
          frameloop={live ? 'always' : 'never'}
          fallback={fallback}
          // Giving the camera an aspect hands its framing to CameraRig.
          camera={{ fov: 25, aspect: 1.6, position: [0, 0.3, 9.2], near: 0.1, far: 80 }}
          gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.05 }}
          onCreated={() => setReady(true)}
          className="!absolute inset-0"
          style={{ opacity: ready ? 1 : 0, transform: ready ? 'scale(1)' : 'scale(0.965)', transition: 'opacity 900ms ease, transform 1400ms cubic-bezier(0.22,1,0.36,1)' }}
        >
          <CameraRig shot={shot} insets={insets} stage={stage} />
          <HeroMotion mode={mode} drag={drag} still={still} shot={shot} pose={pose} />
          <Studio env={env} />
          <Floor pose={pose} />
          <Suspense fallback={null}>
            <Showcase carousel={carousel} geometry={geometry} materials={materials} carat={carat} env={env} pose={pose} stage={stage} still={still} />
          </Suspense>
        </Canvas>
      </StageBoundary>
      {!ready && (
        <p className="lux-ui pointer-events-none absolute inset-0 flex animate-pulse items-center justify-center text-[10px] font-bold uppercase tracking-[0.24em] text-stone">
          Preparing your ring…
        </p>
      )}
      {ready && hint && interactive && (
        <p
          className="lux-ui pointer-events-none absolute inset-x-0 text-center text-[9px] font-bold uppercase tracking-[0.22em] text-midnight/30"
          style={{ bottom: insets.bottom + 10 }}
        >
          Drag to turn
        </p>
      )}
    </div>
  );
}
