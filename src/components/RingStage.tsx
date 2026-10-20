import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, MeshRefractionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { accentGeometry, buildRing, studioEnvironment, type Placement } from '@/lib/ringModel';
import type { Gem, Geometry, Materials, Metal, Mode } from '@/lib/ringTypes';

type Props = {
  geometry: Geometry;
  materials: Materials;
  mode: Mode;
  label: string;
  carat?: number;
};

const METAL: Record<Metal, { color: string; roughness: number }> = {
  yellow: { color: '#f1c56f', roughness: 0.12 },
  white: { color: '#ebe9e4', roughness: 0.1 },
  rose: { color: '#efb59c', roughness: 0.12 },
  platinum: { color: '#d9dadc', roughness: 0.16 },
};

const GEM: Record<Gem, { color: string; ior: number; aberration: number }> = {
  diamond: { color: '#ffffff', ior: 2.42, aberration: 0.014 },
  sapphire: { color: '#3d5cff', ior: 1.77, aberration: 0.006 },
  ruby: { color: '#ff2a4a', ior: 1.77, aberration: 0.006 },
  emerald: { color: '#22c96f', ior: 1.58, aberration: 0.004 },
};

type Drag = { active: boolean; lastX: number; lastY: number; pending: number; pendingTilt: number; vel: number; last: number };

/** Turns the ring for the chosen viewing mode and for the visitor's drags. */
function Rig({ mode, drag, children }: { mode: Mode; drag: React.RefObject<Drag>; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const s = useRef({ yaw: 0.62, tilt: 0.17, userTilt: 0, t: 0 });

  useEffect(() => {
    drag.current.last = 0; // a newly chosen mode takes over straight away
  }, [mode, drag]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const st = s.current;
    const d = drag.current;
    st.t += dt;
    if (d.active) {
      st.yaw += d.pending;
      st.userTilt = THREE.MathUtils.clamp(st.userTilt + d.pendingTilt, -0.35, 0.5);
      d.pending = 0;
      d.pendingTilt = 0;
    } else if (Math.abs(d.vel) > 1e-4) {
      st.yaw += d.vel * dt;
      d.vel *= Math.exp(-3.5 * dt);
    }
    const idle = !d.active && performance.now() - d.last > 2200;
    if (idle) {
      st.userTilt = THREE.MathUtils.damp(st.userTilt, 0, 2, dt);
      if (mode === 'spin') st.yaw += dt * 0.5;
      else {
        const target = mode === 'side' ? Math.PI / 2 : 0.62 + 0.3 * Math.sin(st.t * 0.42);
        const near = target + Math.PI * 2 * Math.round((st.yaw - target) / (Math.PI * 2));
        st.yaw = THREE.MathUtils.damp(st.yaw, near, 2.2, dt);
      }
    }
    const baseTilt = mode === 'side' ? 0.05 : 0.17;
    st.tilt = THREE.MathUtils.damp(st.tilt, baseTilt + st.userTilt, 4, dt);
    group.current?.rotation.set(st.tilt, st.yaw, 0);
  });

  return <group ref={group}>{children}</group>;
}

function Instances({ items, geometry, material }: { items: Placement[]; geometry: THREE.BufferGeometry; material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
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
  }, [items]);
  if (!items.length) return null;
  return <instancedMesh key={items.length} ref={ref} args={[geometry, material, items.length]} />;
}

function Ring({ geometry, materials, carat, env }: { geometry: Geometry; materials: Materials; carat: number; env: THREE.Texture }) {
  const { cut, setting, band } = geometry;
  const model = useMemo(() => buildRing({ cut, setting, band }, carat), [cut, setting, band, carat]);
  useEffect(
    () => () => {
      model.band.dispose();
      model.stone.dispose();
      model.metal.forEach((g) => g.dispose());
    },
    [model],
  );

  const shared = useMemo(
    () => ({
      accent: accentGeometry(),
      bead: new THREE.SphereGeometry(1, 12, 10),
      metal: new THREE.MeshPhysicalMaterial({ color: METAL.yellow.color, metalness: 1, roughness: 0.12, envMapIntensity: 1.15 }),
      sparkle: new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 1, roughness: 0.03, envMapIntensity: 2.6, emissive: '#ffffff', emissiveIntensity: 0.12 }),
    }),
    [],
  );
  useEffect(() => () => Object.values(shared).forEach((o) => o.dispose()), [shared]);

  // Ease between metals rather than snapping (the first metal is set without a fade).
  const look = METAL[materials.metal];
  const target = useMemo(() => new THREE.Color(look.color), [look.color]);
  const first = useRef(true);
  useFrame((_, dt) => {
    if (first.current) {
      shared.metal.color.copy(target);
      shared.metal.roughness = look.roughness;
      first.current = false;
    }
    shared.metal.color.lerp(target, 1 - Math.exp(-6 * dt));
    shared.metal.roughness = THREE.MathUtils.damp(shared.metal.roughness, look.roughness, 6, dt);
  });

  // A small settle whenever the design changes.
  const head = useRef<THREE.Group>(null);
  const key = `${cut}-${setting}-${band}-${carat}`;
  useEffect(() => {
    head.current?.scale.setScalar(0.94);
  }, [key]);
  useFrame((_, dt) => {
    const g = head.current;
    if (g) g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, 1, 7, dt));
  });

  const gem = GEM[materials.gem];
  return (
    <group ref={head} position={[0, -0.3, 0]}>
      <mesh geometry={model.band} material={shared.metal} />
      {model.metal.map((g, i) => (
        <mesh key={`${key}-${i}`} geometry={g} material={shared.metal} />
      ))}
      <mesh key={`stone-${key}`} geometry={model.stone} position={[0, model.stoneY, 0]}>
        <MeshRefractionMaterial
          envMap={env}
          bounces={3}
          ior={gem.ior}
          fresnel={1}
          aberrationStrength={gem.aberration}
          color={gem.color}
          fastChroma
          toneMapped={false}
        />
      </mesh>
      <Instances items={model.accents} geometry={shared.accent} material={shared.sparkle} />
      <Instances items={model.beads} geometry={shared.bead} material={shared.metal} />
    </group>
  );
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
export default function RingStage({ geometry, materials, mode, label, carat = 1.5 }: Props) {
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState(true);
  const drag = useRef<Drag>({ active: false, lastX: 0, lastY: 0, pending: 0, pendingTilt: 0, vel: 0, last: 0 });
  const env = useMemo(() => studioEnvironment(), []);
  useEffect(() => () => env.dispose(), [env]);

  const fallback = (
    <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
      <p className="lux-display text-base text-[#555]">This preview needs WebGL. Please try another browser.</p>
    </div>
  );

  return (
    <div
      role="img"
      aria-label={label}
      className="absolute inset-0 cursor-grab touch-pan-y select-none active:cursor-grabbing"
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        Object.assign(drag.current, { active: true, lastX: e.clientX, lastY: e.clientY, vel: 0, last: performance.now() });
        setHint(false);
      }}
      onPointerMove={(e) => {
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
      }}
      onPointerUp={() => {
        const d = drag.current;
        d.active = false;
        if (performance.now() - d.last > 80) d.vel = 0;
        d.vel = THREE.MathUtils.clamp(d.vel, -8, 8);
        d.last = performance.now();
      }}
      onPointerCancel={() => {
        drag.current.active = false;
      }}
    >
      <StageBoundary fallback={fallback}>
        <Canvas
          dpr={[1, 2]}
          fallback={fallback}
          camera={{ fov: 25, position: [0, 0.55, 9.6], near: 0.1, far: 50 }}
          gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.05 }}
          onCreated={({ camera }) => {
            camera.lookAt(0, 0.05, 0);
            setReady(true);
          }}
          className="!absolute inset-0"
          style={{ opacity: ready ? 1 : 0, transform: ready ? 'scale(1)' : 'scale(0.965)', transition: 'opacity 900ms ease, transform 1400ms cubic-bezier(0.22,1,0.36,1)' }}
        >
          <Studio env={env} />
          <Suspense fallback={null}>
            <Rig mode={mode} drag={drag}>
              <Ring geometry={geometry} materials={materials} carat={carat} env={env} />
            </Rig>
          </Suspense>
          <ContactShadows position={[0, -1.45, 0]} opacity={0.42} scale={5} blur={2.6} far={1.6} resolution={512} color="#1a1a1a" />
        </Canvas>
      </StageBoundary>
      {!ready && (
        <p className="lux-display pointer-events-none absolute inset-0 flex animate-pulse items-center justify-center text-base italic text-black/40">
          Preparing your ring…
        </p>
      )}
      {ready && hint && (
        <p className="lux-ui pointer-events-none absolute left-4 top-3 text-[9px] font-medium uppercase tracking-[0.22em] text-black/35">
          Drag to turn
        </p>
      )}
    </div>
  );
}
