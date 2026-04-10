import { useState, Suspense, useRef, useMemo, Component, type ReactNode, useEffect } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Text, Float, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight } from 'lucide-react';
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
          <div className="lux-surface rounded-[var(--lux-radius-md)] border border-[var(--lux-border)] px-4 py-3 shadow-[var(--lux-shadow-soft)]">
            <p className="lux-ui lux-muted text-[10px] tracking-[0.22em] uppercase">3D preview unavailable</p>
            <p className="lux-ui lux-text mt-2 text-sm">Refresh to retry rendering the ring preview.</p>
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
      <div className="lux-surface rounded-[var(--lux-radius-sm)] border border-[var(--lux-border)] px-4 py-2 shadow-[var(--lux-shadow-soft)]">
        <span className="lux-ui lux-muted text-[10px] uppercase tracking-[0.2em]">Loading model</span>
      </div>
    </Html>
  );
}

const LOOK_AT = new THREE.Vector3(0, 0, 0);

function CameraRig({ view }: { view: 'hero' | 'top' | 'profile' }) {
  const { camera } = useThree();
  const targets: Record<'hero' | 'top' | 'profile', [number, number, number]> = {
    /* Hero: centered on X, slight elevation for a natural product shot */
    hero: [0, 0.22, 1.42],
    top: [0, 2.05, 0.92],
    profile: [1.95, 0.18, 0.12]
  };

  useFrame((_, delta) => {
    const [x, y, z] = targets[view];
    const t = Math.min(1, delta * 4.2);
    camera.position.lerp(new THREE.Vector3(x, y, z), t);
    camera.lookAt(LOOK_AT);
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

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lux-bg lux-text">

      {/* ── Breadcrumb nav ── */}
      <nav className="shrink-0 flex items-center justify-between border-b border-[var(--lux-border)] px-4 py-3">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          {tabs.map((tab, i) => (
            <span key={tab.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'lux-ui text-[9px] uppercase tracking-[0.16em] whitespace-nowrap transition-colors',
                  activeTab === tab.id ? 'lux-text font-medium' : 'lux-muted'
                )}
              >
                {tab.label}
              </button>
              {i < tabs.length - 1 && (
                <span className="lux-muted text-[9px] shrink-0 select-none">·</span>
              )}
            </span>
          ))}
        </div>
        <motion.span
          key={estimatedPrice}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="lux-display text-sm lux-accent ml-4 shrink-0"
        >
          ${estimatedPrice.toLocaleString()}
        </motion.span>
      </nav>

      {/* ── Canvas — flex-1, takes all remaining space ── */}
      <section className="relative min-h-0 flex-1 bg-[radial-gradient(circle_at_50%_50%,#ffffff_0%,#f4f4f4_52%,#e8e8e8_100%)]">
        <CanvasErrorBoundary>
          <Canvas
            className="h-full w-full touch-none"
            camera={{ position: [0, 0.22, 1.42], fov: 50 }}
            dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1.5}
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.4, powerPreference: 'high-performance' }}
          >
            <CameraRig view={view} />
            <ambientLight intensity={1.1} />
            <spotLight position={[8, 12, 10]} angle={0.32} penumbra={1} intensity={3.1} castShadow={false} />
            <spotLight position={[-7, 9, -9]} angle={0.35} penumbra={1} intensity={1.5} />
            <pointLight position={[0, 4, 1]} intensity={1.2} />
            <Suspense fallback={<Loading3D />}>
              <RingModel {...config} />
              <Environment preset="studio" />
              <ContactShadows position={[0, -1.15, 0]} opacity={0.2} scale={6} blur={2.4} far={3.5} color="#8f8f8f" />
            </Suspense>
            <OrbitControls
              target={[0, 0, 0]}
              enablePan={false}
              minPolarAngle={Math.PI / 5.5}
              maxPolarAngle={Math.PI / 1.48}
              minDistance={1.02}
              maxDistance={3.15}
            />
          </Canvas>
        </CanvasErrorBoundary>

        {/* Camera angle — floating pills inside canvas */}
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-0.5 rounded-full border border-[rgba(0,0,0,0.12)] bg-white/80 backdrop-blur-sm p-0.5">
          {(['hero', 'top', 'profile'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                'h-6 rounded-full px-3 lux-ui text-[8px] uppercase tracking-[0.14em] transition-colors',
                view === v ? 'bg-[#121212] text-white' : 'text-[#121212]'
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </section>

      {/* ── Bottom panel — shrink-0, always visible ── */}
      <div className="shrink-0 border-t border-[var(--lux-border)] px-5 pt-4 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]">

        {/* Step label */}
        <p className="lux-ui mb-3 text-[9px] uppercase tracking-[0.2em] lux-muted">
          {activeTab === 'metal' && 'Select your metal'}
          {activeTab === 'band' && 'Select band style'}
          {activeTab === 'setting' && 'Select setting'}
          {activeTab === 'stone' && 'Select center stone'}
          {activeTab === 'engrave' && 'Add an engraving'}
        </p>

        {/* Options */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="mb-4"
          >
            {activeTab === 'metal' && (
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
                {[
                  { id: 'yellow gold', label: 'Yellow Gold' },
                  { id: 'white gold',  label: 'White Gold'  },
                  { id: 'rose gold',   label: 'Rose Gold'   },
                  { id: 'platinum',    label: 'Platinum'    },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setConfig({ ...config, metal: m.id as RingConfig['metal'] })}
                    className={cn(
                      'h-10 shrink-0 rounded-full border px-4 lux-ui text-[9px] uppercase tracking-[0.14em] transition-colors',
                      config.metal === m.id
                        ? 'border-[#121212] bg-[#121212] text-[#f1f1f1]'
                        : 'border-[var(--lux-border)] text-[#121212]'
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'band' && (
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
                {[
                  { id: 'plain', label: 'Plain',  note: 'Included' },
                  { id: 'pave',  label: 'Pavé',   note: '+$400'    },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setConfig({ ...config, bandStyle: m.id as RingConfig['bandStyle'] })}
                    className={cn(
                      'flex h-10 shrink-0 items-center gap-2 rounded-full border px-5 lux-ui text-[9px] uppercase tracking-[0.14em] transition-colors',
                      config.bandStyle === m.id
                        ? 'border-[#121212] bg-[#121212] text-[#f1f1f1]'
                        : 'border-[var(--lux-border)] text-[#121212]'
                    )}
                  >
                    {m.label}
                    <span className="opacity-45 text-[8px]">{m.note}</span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'setting' && (
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
                {[
                  { id: 'solitaire', label: 'Solitaire', note: 'Included' },
                  { id: 'bezel',     label: 'Bezel',     note: '+$150'    },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setConfig({ ...config, settingStyle: m.id as RingConfig['settingStyle'] })}
                    className={cn(
                      'flex h-10 shrink-0 items-center gap-2 rounded-full border px-5 lux-ui text-[9px] uppercase tracking-[0.14em] transition-colors',
                      config.settingStyle === m.id
                        ? 'border-[#121212] bg-[#121212] text-[#f1f1f1]'
                        : 'border-[var(--lux-border)] text-[#121212]'
                    )}
                  >
                    {m.label}
                    <span className="opacity-45 text-[8px]">{m.note}</span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'stone' && (
              <div className="space-y-2">
                <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
                  {[
                    { id: 'diamond',  label: 'Diamond',  color: 'bg-gradient-to-br from-white to-gray-200'          },
                    { id: 'emerald',  label: 'Emerald',  color: 'bg-gradient-to-br from-[#50C878] to-[#043927]'     },
                    { id: 'sapphire', label: 'Sapphire', color: 'bg-gradient-to-br from-[#0F52BA] to-[#000080]'     },
                    { id: 'ruby',     label: 'Ruby',     color: 'bg-gradient-to-br from-[#E0115F] to-[#8B0000]'     },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setConfig({ ...config, stone: s.id as RingConfig['stone'] })}
                      className={cn(
                        'flex h-10 shrink-0 items-center gap-2 rounded-full border px-3 lux-ui text-[9px] uppercase tracking-[0.12em] transition-colors',
                        config.stone === s.id
                          ? 'border-[#121212] bg-[#f8f6f1]'
                          : 'border-[var(--lux-border)] text-[#121212]'
                      )}
                    >
                      <span className={cn('h-4 w-4 shrink-0 rounded-full', s.color)} />
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
                  {(['round', 'emerald', 'oval'] as const).map((shape) => (
                    <button
                      key={shape}
                      onClick={() => setConfig({ ...config, shape })}
                      className={cn(
                        'h-8 shrink-0 rounded-full border px-4 lux-ui text-[8px] uppercase tracking-[0.12em] transition-colors',
                        config.shape === shape
                          ? 'border-[#121212] bg-[#121212] text-[#f1f1f1]'
                          : 'border-[var(--lux-border)] text-[#121212]'
                      )}
                    >
                      {shape}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'engrave' && (
              <input
                type="text"
                maxLength={20}
                value={config.engraving}
                onChange={(e) => setConfig({ ...config, engraving: e.target.value })}
                placeholder="Forever Yours"
                className="h-10 w-full rounded-full border border-[var(--lux-border)] bg-transparent px-4 lux-ui text-sm focus:border-[#121212] focus:outline-none transition-colors"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Next / Save */}
        <button
          type="button"
          onClick={handleNext}
          disabled={isSaving}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#121212] text-[#f1f1f1] lux-ui text-[9px] uppercase tracking-[0.2em] transition-opacity disabled:opacity-60"
        >
          {isSaving
            ? 'Saving...'
            : stepIndex < tabs.length - 1
              ? <><span>Next</span><ChevronRight size={14} /></>
              : <><span>{saveMessage || 'Save to Brief'}</span><ChevronRight size={14} /></>
          }
        </button>
      </div>
    </div>
  );
}
