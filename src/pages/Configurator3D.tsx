import { useState, Suspense, useRef, useMemo, Component, type ReactNode, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Text, Float, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FBXLoader } from 'three-stdlib';

class CanvasErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <div className="lux-surface max-w-xs rounded-[var(--lux-radius-md)] border border-[var(--lux-border)] px-5 py-4 shadow-[var(--lux-shadow-soft)]">
            <p className="lux-kicker">Preview unavailable</p>
            <p className="lux-ui mt-3 text-sm leading-relaxed text-[#121212]">Refresh the page to reload the ring model.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

type RingConfig = {
  metal: 'yellow gold' | 'white gold' | 'rose gold' | 'platinum';
  stone: 'diamond' | 'emerald' | 'sapphire' | 'ruby';
  shape: 'round' | 'emerald' | 'oval';
  bandStyle: 'plain' | 'pave';
  settingStyle: 'solitaire' | 'bezel';
  engraving: string;
};

const tabs: Array<{ id: 'metal' | 'band' | 'setting' | 'stone' | 'engrave'; label: string }> = [
  { id: 'metal', label: 'Metal' },
  { id: 'band', label: 'Band' },
  { id: 'setting', label: 'Setting' },
  { id: 'stone', label: 'Stone' },
  { id: 'engrave', label: 'Engraving' }
];

function Loading3D() {
  return (
    <Html center>
      <div className="lux-surface rounded-[var(--lux-radius-sm)] border border-[var(--lux-border)] px-4 py-2.5 shadow-[var(--lux-shadow-soft)]">
        <span className="lux-kicker !text-[#707070]">Loading model</span>
      </div>
    </Html>
  );
}

const LOOK_AT = new THREE.Vector3(0, 0, 0);

const VIEW_TARGETS: Record<'hero' | 'top' | 'profile', [number, number, number]> = {
  hero: [0, 0.22, 1.42],
  top: [0, 2.05, 0.92],
  profile: [1.95, 0.18, 0.12],
};

type OrbitControlsLike = {
  enabled: boolean;
  target: THREE.Vector3;
  update: () => void;
};

/** Lerp camera only when a view preset is chosen so OrbitControls can orbit freely between presets. */
function CameraRig({ view }: { view: 'hero' | 'top' | 'profile' }) {
  const camera = useThree((s) => s.camera);

  const goal = useRef(new THREE.Vector3(...VIEW_TARGETS.hero));
  const transitioning = useRef(false);

  useEffect(() => {
    const [x, y, z] = VIEW_TARGETS[view];
    goal.current.set(x, y, z);
    transitioning.current = true;
  }, [view]);

  useFrame((state, delta) => {
    if (!transitioning.current) return;
    const controls = state.controls as unknown as OrbitControlsLike | undefined;
    if (controls) controls.enabled = false;

    const t = 1 - (1 - Math.min(1, delta * 4.8)) ** 2;
    camera.position.lerp(goal.current, t);
    camera.lookAt(LOOK_AT);
    if (camera.position.distanceTo(goal.current) < 0.04) {
      camera.position.copy(goal.current);
      camera.lookAt(LOOK_AT);
      transitioning.current = false;
      if (controls) {
        controls.target.copy(LOOK_AT);
        controls.update();
        controls.enabled = true;
      }
    }
  });

  return null;
}

function RingModel({ metal, stone, shape, engraving, bandStyle, settingStyle }: RingConfig) {
  const group = useRef<THREE.Group>(null);
  const fbx = useLoader(FBXLoader, '/eternal-pear-ring-free-3d-jewelry-model.FBX');

  // Per-metal PBR — each value tuned to real-world material behaviour
  const materials = useMemo(() => ({
    // 18k yellow gold: warm, slightly soft, brushed-satin clearcoat
    'yellow gold': new THREE.MeshPhysicalMaterial({
      color: '#C9A84C', metalness: 1, roughness: 0.12,
      clearcoat: 0.6, clearcoatRoughness: 0.08,
      anisotropy: 0.6, anisotropyRotation: 0.25,
      envMapIntensity: 2.8,
    }),
    // 18k rose gold: copper-warm, slightly more diffuse
    'rose gold': new THREE.MeshPhysicalMaterial({
      color: '#C07050', metalness: 1, roughness: 0.18,
      clearcoat: 0.4, clearcoatRoughness: 0.12,
      anisotropy: 0.4,
      iridescence: 0.08, iridescenceIOR: 1.5,
      envMapIntensity: 2.4,
    }),
    // 18k white gold: near-neutral, high specular
    'white gold': new THREE.MeshPhysicalMaterial({
      color: '#C8C8C4', metalness: 1, roughness: 0.06,
      clearcoat: 1, clearcoatRoughness: 0.04,
      anisotropy: 0.3,
      envMapIntensity: 3,
    }),
    // Platinum: coldest white, near-mirror polish, high clearcoat
    'platinum': new THREE.MeshPhysicalMaterial({
      color: '#E2E1DE', metalness: 1, roughness: 0.03,
      clearcoat: 1, clearcoatRoughness: 0.01,
      anisotropy: 0.2,
      envMapIntensity: 3.5,
    }),
  }), []);

  const settingMaterial = metal === 'yellow gold' || metal === 'rose gold' ? materials['white gold'] : materials[metal];
  const activeMetal = materials[metal];

  // Gemstone props — physically accurate IOR + dispersion + iridescence for fire
  const stoneProps = useMemo(() => ({
    diamond: {
      color: '#ffffff', transmission: 1, ior: 2.417, thickness: 1.8,
      roughness: 0, dispersion: 1.8,
      iridescence: 0.35, iridescenceIOR: 2.4,
      iridescenceThicknessRange: [100, 400] as [number, number],
    },
    emerald: {
      color: '#3CB371', transmission: 0.92, ior: 1.577, thickness: 2,
      roughness: 0.02, dispersion: 0.8,
      attenuationColor: new THREE.Color('#1a6b3c'), attenuationDistance: 0.6,
    },
    sapphire: {
      color: '#1240AB', transmission: 0.9, ior: 1.762, thickness: 2,
      roughness: 0.01, dispersion: 0.5,
      attenuationColor: new THREE.Color('#0a1f6b'), attenuationDistance: 0.7,
    },
    ruby: {
      color: '#C10230', transmission: 0.88, ior: 1.762, thickness: 2,
      roughness: 0.01, dispersion: 0.5,
      attenuationColor: new THREE.Color('#6b0010'), attenuationDistance: 0.7,
    },
  }), []);

  const stoneMaterials = useMemo(() => ({
    diamond: new THREE.MeshPhysicalMaterial({ ...stoneProps.diamond, envMapIntensity: 5, transparent: true, side: THREE.DoubleSide }),
    emerald: new THREE.MeshPhysicalMaterial({ ...stoneProps.emerald, envMapIntensity: 4.5, transparent: true, side: THREE.DoubleSide }),
    sapphire: new THREE.MeshPhysicalMaterial({ ...stoneProps.sapphire, envMapIntensity: 4.5, transparent: true, side: THREE.DoubleSide }),
    ruby:    new THREE.MeshPhysicalMaterial({ ...stoneProps.ruby,    envMapIntensity: 4.5, transparent: true, side: THREE.DoubleSide }),
  }), [stoneProps]);

  useEffect(() => {
    if (fbx.userData.initialized) return;
    fbx.traverse((child: any) => {
      if (!child.isMesh) return;
      child.castShadow = false;
      child.receiveShadow = false;
      if (!child.userData.normalsComputed) {
        child.geometry.computeVertexNormals();
        child.userData.normalsComputed = true;
      }
    });
    const box = new THREE.Box3().setFromObject(fbx);
    const center = box.getCenter(new THREE.Vector3());
    fbx.position.sub(center);
    fbx.scale.set(0.072, 0.072, 0.072);
    fbx.userData.initialized = true;
  }, [fbx]);

  useEffect(() => {
    fbx.traverse((child: any) => {
      if (!child.isMesh) return;
      const matName = child.material?.name?.toLowerCase() || child.name?.toLowerCase() || '';
      if (!child.userData.baseScale) child.userData.baseScale = child.scale.clone();
      if (!child.userData.basePosition) child.userData.basePosition = child.position.clone();

      child.scale.copy(child.userData.baseScale);
      child.position.copy(child.userData.basePosition);

      if (matName.includes('diamond') || matName.includes('gem') || matName.includes('stone')) {
        child.material = stoneMaterials[stone];
        if (shape === 'oval') child.scale.set(child.scale.x * 1.15, child.scale.y * 0.9, child.scale.z);
        if (shape === 'emerald') child.scale.set(child.scale.x * 1.1, child.scale.y * 0.85, child.scale.z * 1.05);
        if (settingStyle === 'bezel') child.position.y += 0.01;
      } else if (matName.includes('setting') || matName.includes('prong')) {
        child.material = settingMaterial;
        if (settingStyle === 'bezel') child.scale.multiplyScalar(1.03);
      } else {
        child.material = activeMetal;
        if (bandStyle === 'pave') child.scale.set(child.scale.x * 1.02, child.scale.y, child.scale.z * 1.02);
      }
      child.material.needsUpdate = true;
    });
  }, [fbx, activeMetal, settingMaterial, stoneMaterials, stone, shape, bandStyle, settingStyle]);

  useEffect(() => {
    return () => {
      Object.values(materials).forEach((m) => m.dispose());
      Object.values(stoneMaterials).forEach((m) => m.dispose());
    };
  }, [materials, stoneMaterials]);

  useFrame(() => {
    if (!group.current) return;
    group.current.rotation.y += 0.0038;
  });

  return (
    <Float speed={0.6} rotationIntensity={0.012} floatIntensity={0.012}>
      <group ref={group} position={[0, 0, 0]}>
        <primitive object={fbx} />
        {engraving && (
          <Text
            position={[-0.2, 0.6, 0.9]}
            fontSize={0.04}
            color="#121212"
            anchorX="center"
            anchorY="middle"
            font="https://fonts.gstatic.com/s/cardo/v19/wlp_gwjKBV1pqhv43IE.woff"
          >
            {engraving}
          </Text>
        )}
      </group>
    </Float>
  );
}

export default function Configurator3D() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('metal');
  const [view, setView] = useState<'hero' | 'top' | 'profile'>('hero');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [config, setConfig] = useState<RingConfig>({
    metal: 'yellow gold',
    stone: 'diamond',
    shape: 'round',
    bandStyle: 'plain',
    settingStyle: 'solitaire',
    engraving: ''
  });

  const basePrice = 2500;
  const estimatedPrice =
    basePrice +
    (config.metal === 'platinum' ? 800 : 0) +
    (config.stone === 'diamond' ? 4500 : 1800) +
    (config.bandStyle === 'pave' ? 400 : 0) +
    (config.settingStyle === 'bezel' ? 150 : 0);

  const saveToBrief = () => {
    setIsSaving(true);
    setSaveMessage('');
    window.localStorage.setItem(
      'vela-ring-brief',
      JSON.stringify({ ...config, estimatedPrice, savedAt: new Date().toISOString() })
    );
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('Saved to your brief');
      setTimeout(() => setSaveMessage(''), 1800);
    }, 450);
  };

  const stepIndex = tabs.findIndex((t) => t.id === activeTab);

  const handleNext = () => {
    if (stepIndex < tabs.length - 1) {
      setActiveTab(tabs[stepIndex + 1].id);
    } else {
      saveToBrief();
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) setActiveTab(tabs[stepIndex - 1].id);
  };

  const stepTitle =
    activeTab === 'metal'
      ? 'Select your metal'
      : activeTab === 'band'
        ? 'Band style'
        : activeTab === 'setting'
          ? 'Setting style'
          : activeTab === 'stone'
            ? 'Center stone & cut'
            : 'Engraving';

  const viewPresets = [
    { id: 'hero' as const, label: 'Studio' },
    { id: 'top' as const, label: 'From above' },
    { id: 'profile' as const, label: 'Profile' },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lux-bg lux-text">
      {/* ── Studio header: hierarchy + estimate ── */}
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
          <motion.div
            key={estimatedPrice}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="shrink-0 text-right"
          >
            <p className="lux-ui text-[9px] font-medium uppercase tracking-[0.2em] text-[#707070]">Estimate</p>
            <p className="lux-display mt-1 text-xl font-normal tabular-nums tracking-tight text-[#121212]">
              ${estimatedPrice.toLocaleString()}
            </p>
          </motion.div>
        </div>

        {/* Step progress + jump navigation */}
        <div className="mt-6 space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="lux-ui text-[10px] font-medium uppercase tracking-[0.2em] text-[#707070]">
              Step {stepIndex + 1} of {tabs.length}
            </p>
            <p className="lux-display text-sm font-normal text-[#121212]">{tabs[stepIndex].label}</p>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#e4e4e4]">
            <div
              className="h-full rounded-full bg-[#121212] transition-[width] duration-300 ease-out"
              style={{ width: `${((stepIndex + 1) / tabs.length) * 100}%` }}
              role="progressbar"
              aria-valuenow={stepIndex + 1}
              aria-valuemin={1}
              aria-valuemax={tabs.length}
            />
          </div>
          <nav className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-0.5" aria-label="Customization steps">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'lux-ui min-h-10 shrink-0 rounded-full border px-4 text-[9px] font-medium uppercase tracking-[0.16em] transition-colors',
                  activeTab === tab.id
                    ? 'border-[#121212] bg-[#121212] text-[#f5f5f5]'
                    : 'border-[var(--lux-border)] bg-white text-[#121212] hover:border-[#b0b0b0]',
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── 3D viewport ── */}
      <section className="relative min-h-[min(52vh,22rem)] flex-1 basis-0 bg-[radial-gradient(circle_at_50%_42%,#ffffff_0%,#f4f4f4_48%,#e6e6e6_100%)]">
        <CanvasErrorBoundary>
          <Canvas
            className="h-full w-full min-h-[240px] touch-none"
            camera={{ position: VIEW_TARGETS.hero, fov: 48 }}
            dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1.5}
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.35,
              powerPreference: 'high-performance',
            }}
          >
            <CameraRig view={view} />
            <ambientLight intensity={1.05} />
            <spotLight position={[8, 12, 10]} angle={0.32} penumbra={1} intensity={3} castShadow={false} />
            <spotLight position={[-7, 9, -9]} angle={0.35} penumbra={1} intensity={1.45} />
            <pointLight position={[0, 4, 1]} intensity={1.15} />
            <Suspense fallback={<Loading3D />}>
              <RingModel {...config} />
              <Environment preset="studio" />
              <ContactShadows position={[0, -1.15, 0]} opacity={0.18} scale={6} blur={2.6} far={3.5} color="#8f8f8f" />
            </Suspense>
            <OrbitControls
              makeDefault
              enableDamping
              dampingFactor={0.08}
              target={[0, 0, 0]}
              enablePan={false}
              minPolarAngle={Math.PI / 5.5}
              maxPolarAngle={Math.PI / 1.48}
              minDistance={1.02}
              maxDistance={3.15}
            />
          </Canvas>
        </CanvasErrorBoundary>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f0f0f0]/90 to-transparent" aria-hidden />

        <div className="absolute bottom-4 left-1/2 z-10 w-[min(calc(100%-2rem),20rem)] -translate-x-1/2 px-2">
          <p className="lux-ui mb-2 text-center text-[9px] font-medium uppercase tracking-[0.2em] text-[#707070]">
            View
          </p>
          <div
            className="flex gap-1 rounded-full border border-[rgba(0,0,0,0.1)] bg-white/90 p-1 shadow-[var(--lux-shadow-soft)] backdrop-blur-md"
            role="group"
            aria-label="Camera angle"
          >
            {viewPresets.map((v) => (
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

      {/* ── Options sheet ── */}
      <div className="shrink-0 border-t border-[var(--lux-border)] bg-[var(--lux-bg)] px-5 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] pt-6">
        <div className="mb-5">
          <p className="lux-kicker">Current step</p>
          <h2 className="lux-display mt-1 text-lg font-normal text-[#121212]">{stepTitle}</h2>
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
              <div className="no-scrollbar flex flex-wrap gap-3">
                {[
                  { id: 'yellow gold', label: 'Yellow gold' },
                  { id: 'white gold', label: 'White gold' },
                  { id: 'rose gold', label: 'Rose gold' },
                  { id: 'platinum', label: 'Platinum' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setConfig({ ...config, metal: m.id as RingConfig['metal'] })}
                    className={cn(
                      'lux-chip',
                      config.metal === m.id ? 'lux-chip-active' : 'lux-chip-inactive',
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'band' && (
              <div className="no-scrollbar flex flex-wrap gap-3">
                {[
                  { id: 'plain', label: 'Plain', note: 'Included' },
                  { id: 'pave', label: 'Pavé', note: '+$400' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setConfig({ ...config, bandStyle: m.id as RingConfig['bandStyle'] })}
                    className={cn(
                      'lux-chip gap-2',
                      config.bandStyle === m.id ? 'lux-chip-active' : 'lux-chip-inactive',
                    )}
                  >
                    <span>{m.label}</span>
                    <span className="text-[9px] font-normal opacity-60">{m.note}</span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'setting' && (
              <div className="no-scrollbar flex flex-wrap gap-3">
                {[
                  { id: 'solitaire', label: 'Solitaire', note: 'Included' },
                  { id: 'bezel', label: 'Bezel', note: '+$150' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setConfig({ ...config, settingStyle: m.id as RingConfig['settingStyle'] })}
                    className={cn(
                      'lux-chip gap-2',
                      config.settingStyle === m.id ? 'lux-chip-active' : 'lux-chip-inactive',
                    )}
                  >
                    <span>{m.label}</span>
                    <span className="text-[9px] font-normal opacity-60">{m.note}</span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'stone' && (
              <div className="space-y-5">
                <div>
                  <p className="lux-kicker mb-3">Gemstone</p>
                  <div className="no-scrollbar flex flex-wrap gap-3">
                    {[
                      { id: 'diamond', label: 'Diamond', color: 'bg-gradient-to-br from-white to-gray-200' },
                      { id: 'emerald', label: 'Emerald', color: 'bg-gradient-to-br from-[#50C878] to-[#043927]' },
                      { id: 'sapphire', label: 'Sapphire', color: 'bg-gradient-to-br from-[#0F52BA] to-[#000080]' },
                      { id: 'ruby', label: 'Ruby', color: 'bg-gradient-to-br from-[#E0115F] to-[#8B0000]' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setConfig({ ...config, stone: s.id as RingConfig['stone'] })}
                        className={cn(
                          'lux-chip gap-2.5',
                          config.stone === s.id ? 'lux-chip-active' : 'lux-chip-inactive',
                        )}
                      >
                        <span className={cn('h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10', s.color)} />
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="lux-kicker mb-3">Cut</p>
                  <div className="no-scrollbar flex flex-wrap gap-3">
                    {(['round', 'emerald', 'oval'] as const).map((shape) => (
                      <button
                        key={shape}
                        type="button"
                        onClick={() => setConfig({ ...config, shape })}
                        className={cn(
                          'lux-chip capitalize',
                          config.shape === shape ? 'lux-chip-active' : 'lux-chip-inactive',
                        )}
                      >
                        {shape}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
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
                  onChange={(e) => setConfig({ ...config, engraving: e.target.value })}
                  placeholder="Forever yours"
                  className="h-12 w-full rounded-2xl border border-[var(--lux-border)] bg-white px-4 lux-ui text-sm tracking-[0.02em] text-[#121212] placeholder:text-[#a8a8a8] focus:border-[#121212] focus:outline-none focus:ring-2 focus:ring-[#121212]/15 transition-colors"
                />
                <p className="lux-ui mt-2 text-right text-[10px] tabular-nums text-[#707070]">
                  {config.engraving.length} / 20
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="lux-ui flex min-h-12 min-w-[5.5rem] shrink-0 items-center justify-center rounded-full border border-[var(--lux-border)] bg-white text-[10px] font-medium uppercase tracking-[0.18em] text-[#121212] transition-colors hover:border-[#121212]"
            >
              Back
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleNext}
            disabled={isSaving}
            className={cn(
              'flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#121212] text-[#f5f5f5] lux-ui text-[10px] font-medium uppercase tracking-[0.2em] transition-opacity disabled:opacity-55',
              stepIndex > 0 ? 'min-w-0 flex-1' : 'w-full',
            )}
          >
            {isSaving ? (
              'Saving…'
            ) : stepIndex < tabs.length - 1 ? (
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
