import { Component, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Html, Lightformer, OrbitControls, Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Config ──────────────────────────────────────────────────────────── */

type Metal = 'yellow gold' | 'white gold' | 'rose gold' | 'platinum';
type Stone = 'diamond' | 'emerald' | 'sapphire' | 'ruby';
type Cut = 'round' | 'oval' | 'emerald';
type Setting = 'prongs' | 'bezel';
type Band = 'plain' | 'pave';

type RingConfig = {
  metal: Metal;
  stone: Stone;
  cut: Cut;
  setting: Setting;
  band: Band;
  engraving: string;
};

const STEPS = [
  { id: 'style', label: 'Style', prompt: 'Select your style' },
  { id: 'metal', label: 'Metal', prompt: 'Select your metal' },
  { id: 'stone', label: 'Stone', prompt: 'Select your stone' },
  { id: 'diamonds', label: 'Diamonds', prompt: 'Select your diamonds' },
  { id: 'engraving', label: 'Engraving', prompt: 'Add an engraving' },
] as const;

const OPTIONS = {
  cut: [
    { id: 'round', label: 'Round' },
    { id: 'oval', label: 'Oval' },
    { id: 'emerald', label: 'Emerald cut' },
  ],
  setting: [
    { id: 'prongs', label: 'Claw' },
    { id: 'bezel', label: 'Bezel' },
  ],
  metal: [
    { id: 'yellow gold', label: 'Yellow gold' },
    { id: 'white gold', label: 'White gold' },
    { id: 'rose gold', label: 'Rose gold' },
    { id: 'platinum', label: 'Platinum' },
  ],
  stone: [
    { id: 'diamond', label: 'Diamond' },
    { id: 'emerald', label: 'Emerald' },
    { id: 'sapphire', label: 'Sapphire' },
    { id: 'ruby', label: 'Ruby' },
  ],
  band: [
    { id: 'plain', label: 'No diamonds' },
    { id: 'pave', label: 'Diamond-paved' },
  ],
} as const;

const DEFAULT_CONFIG: RingConfig = {
  metal: 'yellow gold',
  stone: 'diamond',
  cut: 'round',
  setting: 'prongs',
  band: 'plain',
  engraving: '',
};

function estimatePrice(c: RingConfig) {
  return (
    2500 +
    (c.metal === 'platinum' ? 800 : 0) +
    (c.stone === 'diamond' ? 4500 : 1800) +
    (c.cut === 'emerald' ? 600 : c.cut === 'oval' ? 300 : 0) +
    (c.setting === 'bezel' ? 150 : 0) +
    (c.band === 'pave' ? 400 : 0)
  );
}

const label = (list: ReadonlyArray<{ id: string; label: string }>, id: string) =>
  list.find((o) => o.id === id)?.label ?? id;

/* ── Look ────────────────────────────────────────────────────────────── */

const STAGE = '#ececec';
const SERIF: CSSProperties = { fontFamily: "'Cardo', 'Cormorant Garamond', Georgia, serif" };
const MODEL_URL = '/models/ring.glb';
const FONT_URL = '/fonts/cardo-regular.woff';
const TARGET = new THREE.Vector3(0, 0.1, 0);
const INNER_RADIUS = 0.628;

const METAL_LOOK: Record<Metal, { color: string; roughness: number }> = {
  'yellow gold': { color: '#f0cd8c', roughness: 0.15 },
  'white gold': { color: '#efede9', roughness: 0.13 },
  'rose gold': { color: '#eeb09b', roughness: 0.15 },
  platinum: { color: '#e3e5e8', roughness: 0.11 },
};

const STONE_LOOK: Record<Stone, { color: string; attenuation: string; distance: number }> = {
  diamond: { color: '#ffffff', attenuation: '#ffffff', distance: 10 },
  emerald: { color: '#6fe0a2', attenuation: '#0f8a4c', distance: 0.4 },
  sapphire: { color: '#6f93ff', attenuation: '#1238c0', distance: 0.4 },
  ruby: { color: '#ff5d7a', attenuation: '#b30f30', distance: 0.4 },
};

/* ── 3D ──────────────────────────────────────────────────────────────── */

class CanvasErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center" style={SERIF}>
          <p className="text-lg text-black/70">The preview couldn’t load. Please refresh the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function Loading3D() {
  return (
    <Html center>
      <p className="animate-pulse whitespace-nowrap text-base italic text-black/45" style={SERIF}>
        Preparing your ring…
      </p>
    </Html>
  );
}

/** Frames the ring for any viewport: portrait phones pull back, wide screens move in. */
function FitCamera() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as
    | { minDistance: number; maxDistance: number; update: () => void }
    | null;
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  useEffect(() => {
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const aspect = width / height;
    const dist = Math.max(1.02 / t, 0.92 / (t * aspect)) * 1.12;
    camera.position.copy(new THREE.Vector3(0.18, 0.3, 1).normalize().multiplyScalar(dist).add(TARGET));
    camera.lookAt(TARGET);
    camera.updateProjectionMatrix();
    if (controls) {
      controls.minDistance = dist * 0.55;
      controls.maxDistance = dist * 1.35;
      controls.update();
    }
  }, [camera, controls, width, height]);

  return null;
}

function Ring({ config }: { config: RingConfig }) {
  const { scene } = useGLTF(MODEL_URL);
  const root = useMemo(() => scene.clone(true), [scene]);
  const sway = useRef<THREE.Group>(null);

  const mats = useMemo(
    () => ({
      metal: new THREE.MeshPhysicalMaterial({
        color: METAL_LOOK['yellow gold'].color,
        metalness: 1,
        roughness: 0.15,
        envMapIntensity: 1.2,
        clearcoat: 0.3,
        clearcoatRoughness: 0.04,
      }),
      stone: new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0,
        roughness: 0,
        transmission: 1,
        thickness: 0.4,
        ior: 2.4,
        dispersion: 0.5,
        envMapIntensity: 2.4,
        specularIntensity: 1,
        attenuationColor: new THREE.Color('#ffffff'),
        attenuationDistance: 10,
      }),
      pave: new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        emissive: new THREE.Color('#ffffff'),
        emissiveIntensity: 0.32,
        metalness: 0,
        roughness: 0.02,
        ior: 2.4,
        envMapIntensity: 3.6,
        clearcoat: 1,
        clearcoatRoughness: 0,
      }),
    }),
    [],
  );

  useEffect(() => {
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (mesh.name.startsWith('stone_')) mesh.material = mats.stone;
      else if (mesh.name === 'pave') mesh.material = mats.pave;
      else mesh.material = mats.metal;
    });
  }, [root, mats]);

  useEffect(() => {
    root.traverse((o) => {
      if (!(o as THREE.Mesh).isMesh) return;
      const n = o.name;
      o.visible =
        n === 'band' ||
        n === 'head' ||
        n === `stone_${config.cut}` ||
        n === `${config.setting}_${config.cut}` ||
        (n === 'pave' && config.band === 'pave');
    });
  }, [root, config.cut, config.setting, config.band]);

  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  const metalTarget = useMemo(() => new THREE.Color(), []);
  const stoneTarget = useMemo(() => new THREE.Color(), []);
  const attenTarget = useMemo(() => new THREE.Color(), []);

  useFrame((state, dt) => {
    const k = 1 - Math.exp(-dt * 7);
    const m = METAL_LOOK[config.metal];
    mats.metal.color.lerp(metalTarget.set(m.color), k);
    mats.metal.roughness += (m.roughness - mats.metal.roughness) * k;

    const s = STONE_LOOK[config.stone];
    mats.stone.color.lerp(stoneTarget.set(s.color), k);
    mats.stone.attenuationColor.lerp(attenTarget.set(s.attenuation), k);
    mats.stone.attenuationDistance += (s.distance - mats.stone.attenuationDistance) * k;

    if (sway.current) {
      sway.current.rotation.y = -0.62 + Math.sin(state.clock.elapsedTime * 0.32) * 0.26;
    }
  });

  return (
    <group ref={sway}>
      <primitive object={root} />
      {config.engraving && (
        <Suspense fallback={null}>
        <Text
          font={FONT_URL}
          position={[0, -(INNER_RADIUS - 0.0015), 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          {...{ curveRadius: INNER_RADIUS - 0.0015 }}
          fontSize={0.05}
          letterSpacing={0.06}
          color="#4a3512"
          fillOpacity={0.8}
          anchorX="center"
          anchorY="middle"
        >
          {config.engraving}
        </Text>
        </Suspense>
      )}
    </group>
  );
}

useGLTF.preload(MODEL_URL);

/** Studio built from softboxes: dark surroundings + bright strips give polished metal its long reflections. */
function Studio() {
  const look = (self: THREE.Object3D) => self.lookAt(0, 0, 0);
  return (
    <Environment resolution={512} frames={1} background={false}>
      {/* Mid-grey dome so shadowed reflections stay soft, like a grey photo studio */}
      <mesh scale={40}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshBasicMaterial color="#8a8a90" side={THREE.BackSide} toneMapped={false} />
      </mesh>
      <Lightformer form="rect" intensity={3.2} position={[0, 6, 0]} scale={[9, 9, 1]} onUpdate={look} />
      <Lightformer form="rect" intensity={3.2} position={[-6.5, 1.2, 1.5]} scale={[1.3, 8, 1]} onUpdate={look} />
      <Lightformer form="rect" intensity={3.2} position={[6.5, 0.6, 2.5]} scale={[1.3, 8, 1]} onUpdate={look} />
      <Lightformer form="rect" intensity={1.3} position={[0, 0.8, 7]} scale={[7, 1.4, 1]} onUpdate={look} />
      <Lightformer form="rect" intensity={1.6} position={[0, 2.5, -7]} scale={[8, 3, 1]} onUpdate={look} />
      <Lightformer form="rect" intensity={1.4} color="#ffe9cf" position={[0, -6, 0]} scale={[9, 9, 1]} onUpdate={look} />
    </Environment>
  );
}

/* ── UI pieces ───────────────────────────────────────────────────────── */

const CHAMFER = 12;
const chamfer: CSSProperties = {
  clipPath: `polygon(${CHAMFER}px 0, calc(100% - ${CHAMFER}px) 0, 100% ${CHAMFER}px, 100% calc(100% - ${CHAMFER}px), calc(100% - ${CHAMFER}px) 100%, ${CHAMFER}px 100%, 0 calc(100% - ${CHAMFER}px), 0 ${CHAMFER}px)`,
};

function Segmented<T extends string>({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: ReadonlyArray<{ id: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className="no-scrollbar flex max-w-full gap-1 overflow-x-auto"
      style={chamfer}
    >
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={cn(
              'h-11 shrink-0 whitespace-nowrap px-4 text-[11px] font-medium uppercase tracking-[0.12em] text-black transition-colors md:h-12 md:px-7 md:text-[12px]',
              active ? 'bg-white' : 'bg-[#f6f6f6] text-black/75 hover:bg-white/80',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const ghostButton =
  'flex h-11 w-11 shrink-0 items-center justify-center text-black transition-opacity hover:opacity-60 disabled:pointer-events-none disabled:opacity-0 md:h-12 md:w-12';
const darkButton =
  'h-11 min-w-0 flex-1 bg-[#0e0e0e] px-8 text-[12px] font-medium uppercase tracking-[0.16em] text-white transition-colors hover:bg-black md:h-12 md:min-w-[12rem] md:flex-none';

/* ── Screen ──────────────────────────────────────────────────────────── */

export default function Configurator3D() {
  const [config, setConfig] = useState<RingConfig>(DEFAULT_CONFIG);
  const [step, setStep] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(savedTimer.current), []);

  const update = <K extends keyof RingConfig>(key: K, value: RingConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const price = estimatePrice(config);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const next = () => (isLast ? setReviewing(true) : setStep((s) => s + 1));
  const back = () => (reviewing ? setReviewing(false) : setStep((s) => Math.max(0, s - 1)));

  const saveToBrief = () => {
    window.localStorage.setItem(
      'vela-ring-brief',
      JSON.stringify({ ...config, estimatedPrice: price, savedAt: new Date().toISOString() }),
    );
    setSaved(true);
    window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setSaved(false), 2200);
  };

  const summary = [
    label(OPTIONS.cut, config.cut) + ' · ' + label(OPTIONS.setting, config.setting),
    label(OPTIONS.metal, config.metal),
    label(OPTIONS.stone, config.stone),
    label(OPTIONS.band, config.band),
    ...(config.engraving ? [`“${config.engraving}”`] : []),
  ];

  return (
    <div className="fixed inset-0 z-[70] flex flex-col overflow-hidden text-[#111]" style={{ background: STAGE }}>
      {/* Header */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-y-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-8 md:pt-6">
        <nav
          aria-label="Steps"
          className="pointer-events-auto no-scrollbar col-span-3 col-start-1 row-start-2 flex justify-center gap-2 overflow-x-auto md:col-span-1 md:row-start-1 md:justify-start"
        >
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden className="text-[10px] text-black/30">·</span>}
              <button
                type="button"
                onClick={() => {
                  setReviewing(false);
                  setStep(i);
                }}
                aria-current={!reviewing && i === step ? 'step' : undefined}
                className={cn(
                  'whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.14em] transition-colors md:text-[11px]',
                  i <= step || reviewing ? 'text-black' : 'text-black/40 hover:text-black/70',
                )}
              >
                {s.label}
              </button>
            </div>
          ))}
        </nav>

        <Link
          to="/"
          aria-label="Vela, home"
          className="pointer-events-auto col-start-2 row-start-1 text-center text-[30px] italic leading-none text-black md:text-[36px]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Vela
        </Link>

        <Link
          to="/"
          className="pointer-events-auto col-start-3 row-start-1 justify-self-end text-[10px] font-medium uppercase tracking-[0.14em] text-black transition-opacity hover:opacity-60 md:text-[11px]"
        >
          Close
        </Link>
      </header>

      {/* Stage */}
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-x-0 bottom-0 top-[5.25rem] md:top-14">
        <CanvasErrorBoundary>
          <Canvas
            className="touch-none"
            camera={{ fov: 26, near: 0.1, far: 50 }}
            dpr={[1, 2]}
            gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.05 }}
          >
            <color attach="background" args={[STAGE]} />
            <Suspense fallback={<Loading3D />}>
              <Studio />
              <Ring config={config} />
              <ContactShadows
                position={[0, -0.742, 0]}
                opacity={0.38}
                scale={4.2}
                blur={3.4}
                far={1.4}
                resolution={512}
                color="#5a4632"
              />
            </Suspense>
            <FitCamera />
            <OrbitControls
              makeDefault
              enablePan={false}
              enableDamping
              dampingFactor={0.07}
              target={TARGET.toArray()}
              minPolarAngle={Math.PI * 0.18}
              maxPolarAngle={Math.PI * 0.62}
            />
          </Canvas>
        </CanvasErrorBoundary>
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 text-center md:px-8 md:pb-8">
        <AnimatePresence mode="wait" initial={false}>
          {reviewing ? (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="text-[22px] leading-tight text-black md:text-[26px]" style={SERIF}>
                Your creation
              </h2>
              <ul className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-1" style={chamfer}>
                {summary.map((line) => (
                  <li
                    key={line}
                    className="bg-white px-4 py-3 text-[11px] font-medium uppercase tracking-[0.12em] md:px-6 md:text-[12px]"
                  >
                    {line}
                  </li>
                ))}
              </ul>
              <div className="mx-auto mt-5 flex max-w-xl items-center justify-center gap-3">
                <button type="button" onClick={back} className={ghostButton} aria-label="Back to editing">
                  <ChevronLeft size={20} strokeWidth={1.5} />
                </button>
                <button type="button" onClick={saveToBrief} className={darkButton}>
                  {saved ? 'Saved to your brief' : 'Save to brief'}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <h2 className="text-[22px] leading-tight text-black md:text-[26px]" style={SERIF}>
                {current.prompt}
              </h2>

              <div className="mx-auto mt-4 flex max-w-3xl flex-col items-center gap-3 md:mt-5 md:flex-row md:justify-center md:gap-6">
                <div className="hidden md:block">
                  <button type="button" onClick={back} disabled={step === 0} className={ghostButton} aria-label="Previous step">
                    <ChevronLeft size={20} strokeWidth={1.5} />
                  </button>
                </div>

                <div className="flex min-w-0 max-w-full flex-col items-center gap-1">
                  {current.id === 'style' && (
                    <>
                      <Segmented name="Cut" options={OPTIONS.cut} value={config.cut} onChange={(v) => update('cut', v)} />
                      <Segmented name="Setting" options={OPTIONS.setting} value={config.setting} onChange={(v) => update('setting', v)} />
                    </>
                  )}
                  {current.id === 'metal' && (
                    <Segmented name="Metal" options={OPTIONS.metal} value={config.metal} onChange={(v) => update('metal', v)} />
                  )}
                  {current.id === 'stone' && (
                    <Segmented name="Stone" options={OPTIONS.stone} value={config.stone} onChange={(v) => update('stone', v)} />
                  )}
                  {current.id === 'diamonds' && (
                    <Segmented name="Diamonds" options={OPTIONS.band} value={config.band} onChange={(v) => update('band', v)} />
                  )}
                  {current.id === 'engraving' && (
                    <div className="relative w-full" style={chamfer}>
                      <label htmlFor="engraving" className="sr-only">
                        Engraving text
                      </label>
                      <input
                        id="engraving"
                        type="text"
                        maxLength={20}
                        value={config.engraving}
                        onChange={(e) => update('engraving', e.target.value)}
                        placeholder="Forever yours"
                        className="h-11 w-full min-w-0 bg-white px-6 text-center text-[17px] text-black placeholder:text-black/35 focus:outline-none md:h-12 md:w-[22rem]"
                        style={SERIF}
                      />
                    </div>
                  )}
                </div>

                <div className="flex w-full items-center gap-3 md:w-auto">
                  {step > 0 && (
                    <button type="button" onClick={back} className={cn(ghostButton, 'md:hidden')} aria-label="Previous step">
                      <ChevronLeft size={20} strokeWidth={1.5} />
                    </button>
                  )}
                  <button type="button" onClick={next} className={darkButton}>
                    {isLast ? 'Done' : 'Next'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-4 text-[15px] text-black/60 md:mt-5" style={SERIF}>
          Your current selection: <span className="tabular-nums text-black/80">${price.toLocaleString()}</span>
        </p>
      </div>
    </div>
  );
}
