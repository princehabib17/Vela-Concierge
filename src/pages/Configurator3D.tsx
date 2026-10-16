import { Component, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Html, Lightformer, OrbitControls, Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

const TABS = [
  { id: 'metal', label: 'Metal', title: 'Select your metal' },
  { id: 'stone', label: 'Stone', title: 'Stone & cut' },
  { id: 'setting', label: 'Setting', title: 'Setting style' },
  { id: 'band', label: 'Band', title: 'Band style' },
  { id: 'engrave', label: 'Engraving', title: 'Engraving' },
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

type View = 'hero' | 'top' | 'profile';

const VIEW_DIRS: Record<View, THREE.Vector3> = {
  hero: new THREE.Vector3(0.18, 0.3, 1).normalize(),
  top: new THREE.Vector3(0.05, 1.7, 0.55).normalize(),
  profile: new THREE.Vector3(1, 0.1, 0.04).normalize(),
};

/** Frames the ring for any viewport (portrait phones pull back) and glides between view presets. */
function CameraRig({ view }: { view: View }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as
    | { enabled: boolean; target: THREE.Vector3; minDistance: number; maxDistance: number; update: () => void }
    | null;
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const dist = useRef(5);
  const goal = useRef(new THREE.Vector3());
  const moving = useRef(false);
  const viewRef = useRef(view);
  viewRef.current = view;

  const aim = (v: View) => goal.current.copy(VIEW_DIRS[v]).multiplyScalar(dist.current).add(TARGET);

  useEffect(() => {
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    dist.current = Math.max(1.02 / t, 0.92 / (t * (width / height))) * 1.2;
    aim(viewRef.current);
    camera.position.copy(goal.current);
    camera.lookAt(TARGET);
    camera.updateProjectionMatrix();
    if (controls) {
      controls.minDistance = dist.current * 0.55;
      controls.maxDistance = dist.current * 1.35;
      controls.update();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, controls, width, height]);

  useEffect(() => {
    aim(view);
    moving.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useFrame((_, dt) => {
    if (!moving.current) return;
    if (controls) controls.enabled = false;
    camera.position.lerp(goal.current, 1 - Math.exp(-dt * 6));
    camera.lookAt(TARGET);
    if (camera.position.distanceTo(goal.current) < 0.02) {
      camera.position.copy(goal.current);
      moving.current = false;
      if (controls) {
        controls.target.copy(TARGET);
        controls.update();
        controls.enabled = true;
      }
    }
  });

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

/* ── Screen ──────────────────────────────────────────────────────────── */

const VIEW_PRESETS: Array<{ id: View; label: string }> = [
  { id: 'hero', label: 'Studio' },
  { id: 'top', label: 'From above' },
  { id: 'profile', label: 'Profile' },
];

const GEM_SWATCH: Record<Stone, string> = {
  diamond: 'bg-gradient-to-br from-white to-gray-200',
  emerald: 'bg-gradient-to-br from-[#50C878] to-[#043927]',
  sapphire: 'bg-gradient-to-br from-[#0F52BA] to-[#000080]',
  ruby: 'bg-gradient-to-br from-[#E0115F] to-[#8B0000]',
};

const NOTES: Partial<Record<string, string>> = { bezel: '+$150', pave: '+$400', oval: '+$300', emerald: '+$600' };

function Chips<T extends string>({
  name,
  options,
  value,
  onChange,
  swatch,
}: {
  name: string;
  options: ReadonlyArray<{ id: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  swatch?: (id: T) => string;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-3">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={o.id === value}
          onClick={() => onChange(o.id)}
          className={cn('lux-chip gap-2', o.id === value ? 'lux-chip-active' : 'lux-chip-inactive')}
        >
          {swatch && <span className={cn('h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10', swatch(o.id))} />}
          <span>{o.label}</span>
          {NOTES[o.id] && <span className="text-[9px] font-normal opacity-60">{NOTES[o.id]}</span>}
        </button>
      ))}
    </div>
  );
}

export default function Configurator3D() {
  const [config, setConfig] = useState<RingConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('metal');
  const [view, setView] = useState<View>('hero');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  const update = <K extends keyof RingConfig>(key: K, value: RingConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const price = estimatePrice(config);
  const stepIndex = TABS.findIndex((tab) => tab.id === activeTab);
  const tab = TABS[stepIndex];

  const saveToBrief = () => {
    setIsSaving(true);
    setSaveMessage('');
    window.localStorage.setItem(
      'vela-ring-brief',
      JSON.stringify({ ...config, estimatedPrice: price, savedAt: new Date().toISOString() }),
    );
    timers.current.push(
      window.setTimeout(() => {
        setIsSaving(false);
        setSaveMessage('Saved to your brief');
        timers.current.push(window.setTimeout(() => setSaveMessage(''), 1800));
      }, 450),
    );
  };

  const handleNext = () => (stepIndex < TABS.length - 1 ? setActiveTab(TABS[stepIndex + 1].id) : saveToBrief());
  const handleBack = () => stepIndex > 0 && setActiveTab(TABS[stepIndex - 1].id);

  return (
    <div className="lux-bg lux-text flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
      {/* Header: hierarchy + estimate */}
      <header className="shrink-0 border-b border-[var(--lux-border)] px-5 pb-5 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <Link
          to="/"
          className="lux-ui mb-4 inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[#707070] transition-colors hover:text-[#121212]"
        >
          <ChevronLeft size={16} strokeWidth={1.5} aria-hidden />
          Atelier
        </Link>

        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="lux-kicker">Vela bespoke studio</p>
            <h1 className="lux-page-title mt-1">Ring 3D Studio</h1>
            <p className="lux-ui mt-2 max-w-[17rem] text-xs font-normal leading-relaxed tracking-[0.02em] text-[#707070]">
              Solitaire customization — drag to rotate, pinch to zoom.
            </p>
          </div>
          <motion.div key={price} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} className="shrink-0 text-right">
            <p className="lux-ui text-[9px] font-medium uppercase tracking-[0.2em] text-[#707070]">Estimate</p>
            <p className="lux-display mt-1 text-xl font-normal tabular-nums tracking-tight text-[#121212]">
              ${price.toLocaleString()}
            </p>
          </motion.div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="lux-ui text-[10px] font-medium uppercase tracking-[0.2em] text-[#707070]">
              Step {stepIndex + 1} of {TABS.length}
            </p>
            <p className="lux-display text-sm font-normal text-[#121212]">{tab.label}</p>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#e4e4e4]">
            <div
              className="h-full rounded-full bg-[#121212] transition-[width] duration-300 ease-out"
              style={{ width: `${((stepIndex + 1) / TABS.length) * 100}%` }}
              role="progressbar"
              aria-valuenow={stepIndex + 1}
              aria-valuemin={1}
              aria-valuemax={TABS.length}
            />
          </div>
          <nav className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-0.5" aria-label="Customization steps">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'lux-ui min-h-10 shrink-0 rounded-full border px-4 text-[9px] font-medium uppercase tracking-[0.16em] transition-colors',
                  activeTab === item.id
                    ? 'border-[#121212] bg-[#121212] text-[#f5f5f5]'
                    : 'border-[var(--lux-border)] bg-white text-[#121212] hover:border-[#b0b0b0]',
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* 3D viewport */}
      <section
        className="sticky top-0 z-10 h-[min(48vh,24rem)] shrink-0 border-b border-[var(--lux-border)]"
        style={{ background: STAGE }}
      >
        <div className="absolute inset-x-0 top-0 bottom-[6.25rem]">
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
            <CameraRig view={view} />
            <OrbitControls
              makeDefault
              enablePan={false}
              enableDamping
              dampingFactor={0.07}
              target={TARGET.toArray()}
              minPolarAngle={Math.PI * 0.1}
              maxPolarAngle={Math.PI * 0.62}
            />
          </Canvas>
        </CanvasErrorBoundary>
        </div>

        <div className="absolute bottom-4 left-1/2 z-10 w-[min(calc(100%-2rem),20rem)] -translate-x-1/2 px-2">
          <p className="lux-ui mb-2 text-center text-[9px] font-medium uppercase tracking-[0.2em] text-[#707070]">View</p>
          <div
            className="flex gap-1 rounded-full border border-[rgba(0,0,0,0.1)] bg-white/90 p-1 shadow-[var(--lux-shadow-soft)] backdrop-blur-md"
            role="group"
            aria-label="Camera angle"
          >
            {VIEW_PRESETS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                className={cn(
                  'lux-ui min-h-10 flex-1 rounded-full px-2 text-[9px] font-medium uppercase tracking-[0.12em] transition-colors',
                  view === v.id ? 'bg-[#121212] text-white' : 'text-[#121212] hover:bg-[#f0f0f0]',
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Options sheet */}
      <div className="shrink-0 border-t border-[var(--lux-border)] bg-[var(--lux-bg)] px-5 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] pt-6">
        <div className="mb-5">
          <p className="lux-kicker">Current step</p>
          <h2 className="lux-display mt-1 text-lg font-normal text-[#121212]">{tab.title}</h2>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
          >
            {activeTab === 'metal' && (
              <Chips name="Metal" options={OPTIONS.metal} value={config.metal} onChange={(v) => update('metal', v)} />
            )}

            {activeTab === 'stone' && (
              <div className="space-y-5">
                <div>
                  <p className="lux-kicker mb-3">Gemstone</p>
                  <Chips
                    name="Gemstone"
                    options={OPTIONS.stone}
                    value={config.stone}
                    onChange={(v) => update('stone', v)}
                    swatch={(id) => GEM_SWATCH[id]}
                  />
                </div>
                <div>
                  <p className="lux-kicker mb-3">Cut</p>
                  <Chips name="Cut" options={OPTIONS.cut} value={config.cut} onChange={(v) => update('cut', v)} />
                </div>
              </div>
            )}

            {activeTab === 'setting' && (
              <Chips name="Setting" options={OPTIONS.setting} value={config.setting} onChange={(v) => update('setting', v)} />
            )}

            {activeTab === 'band' && (
              <Chips name="Band" options={OPTIONS.band} value={config.band} onChange={(v) => update('band', v)} />
            )}

            {activeTab === 'engrave' && (
              <div>
                <label htmlFor="engrave-input" className="sr-only">
                  Engraving text
                </label>
                <input
                  id="engrave-input"
                  type="text"
                  maxLength={20}
                  value={config.engraving}
                  onChange={(e) => update('engraving', e.target.value)}
                  placeholder="Forever yours"
                  className="lux-ui h-12 w-full rounded-2xl border border-[var(--lux-border)] bg-white px-4 text-sm tracking-[0.02em] text-[#121212] transition-colors placeholder:text-[#a8a8a8] focus:border-[#121212] focus:outline-none focus:ring-2 focus:ring-[#121212]/15"
                />
                <p className="lux-ui mt-2 text-right text-[10px] tabular-nums text-[#707070]">
                  {config.engraving.length} / 20
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="lux-ui flex min-h-12 min-w-[5.5rem] shrink-0 items-center justify-center rounded-full border border-[var(--lux-border)] bg-white text-[10px] font-medium uppercase tracking-[0.18em] text-[#121212] transition-colors hover:border-[#121212]"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={isSaving}
            className={cn(
              'lux-ui flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#121212] text-[10px] font-medium uppercase tracking-[0.2em] text-[#f5f5f5] transition-opacity disabled:opacity-55',
              stepIndex > 0 ? 'min-w-0 flex-1' : 'w-full',
            )}
          >
            {isSaving ? (
              'Saving…'
            ) : stepIndex < TABS.length - 1 ? (
              <>
                <span>Continue</span>
                <ChevronRight size={16} strokeWidth={1.5} aria-hidden />
              </>
            ) : (
              <>
                <span>{saveMessage || 'Save to brief'}</span>
                <ChevronRight size={16} strokeWidth={1.5} aria-hidden />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
