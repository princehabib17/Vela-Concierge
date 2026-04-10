import { useState, Suspense, useRef, useMemo, Component, type ReactNode, useEffect } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Text, Float, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronRight } from 'lucide-react';
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

  const metalProps = {
    metalness: 1,
    roughness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    envMapIntensity: 2.5
  };

  const materials = useMemo(() => ({
    'yellow gold': new THREE.MeshPhysicalMaterial({ color: '#E5C07B', ...metalProps }),
    'rose gold': new THREE.MeshPhysicalMaterial({ color: '#DDA7A5', ...metalProps }),
    'white gold': new THREE.MeshPhysicalMaterial({ color: '#F8F9FA', ...metalProps, roughness: 0.03 }),
    'platinum': new THREE.MeshPhysicalMaterial({ color: '#E5E4E2', ...metalProps, roughness: 0.01, envMapIntensity: 3 })
  }), []);

  const settingMaterial = metal === 'yellow gold' || metal === 'rose gold' ? materials['white gold'] : materials[metal];
  const activeMetal = materials[metal];
  const stoneProps = useMemo(() => ({
    diamond: { color: '#ffffff', transmission: 1, ior: 2.417, thickness: 1.5, roughness: 0, dispersion: 1.5 },
    emerald: { color: '#50C878', transmission: 1, ior: 1.577, thickness: 1.5, roughness: 0, dispersion: 0.8 },
    sapphire: { color: '#0F52BA', transmission: 1, ior: 1.762, thickness: 1.5, roughness: 0, dispersion: 0.5 },
    ruby: { color: '#E0115F', transmission: 1, ior: 1.762, thickness: 1.5, roughness: 0, dispersion: 0.5 }
  }), []);

  const stoneMaterials = useMemo(() => ({
    diamond: new THREE.MeshPhysicalMaterial({ ...stoneProps.diamond, envMapIntensity: 4, transparent: true, side: THREE.DoubleSide }),
    emerald: new THREE.MeshPhysicalMaterial({ ...stoneProps.emerald, envMapIntensity: 4, transparent: true, side: THREE.DoubleSide }),
    sapphire: new THREE.MeshPhysicalMaterial({ ...stoneProps.sapphire, envMapIntensity: 4, transparent: true, side: THREE.DoubleSide }),
    ruby: new THREE.MeshPhysicalMaterial({ ...stoneProps.ruby, envMapIntensity: 4, transparent: true, side: THREE.DoubleSide })
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

  const tabBase =
    'h-7 shrink-0 whitespace-nowrap rounded-[var(--lux-pill)] border px-2.5 lux-ui text-[8px] tracking-[0.14em] uppercase transition-colors';

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lux-bg lux-text">
      <section className="shrink-0 px-4 pb-0.5 pt-1">
        <p className="lux-ui lux-muted text-[8px] uppercase tracking-[0.18em]">Vela bespoke studio</p>
        <h1 className="lux-display mt-0.5 text-lg leading-none tracking-tight">Ring 3D Studio</h1>
        <p className="lux-ui lux-muted mt-0.5 truncate text-[8px] uppercase tracking-[0.16em]">
          Solitaire customization
        </p>
      </section>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <section className="relative min-h-0 flex-[2.05] basis-0 border-y border-[var(--lux-border)] bg-[radial-gradient(circle_at_50%_50%,#ffffff_0%,#f4f4f4_52%,#e8e8e8_100%)]">
          <CanvasErrorBoundary>
            <Canvas
              className="h-full w-full touch-none"
              camera={{ position: [0, 0.22, 1.42], fov: 50 }}
              dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1.5}
              gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.28, powerPreference: 'high-performance' }}
            >
              <CameraRig view={view} />
              <ambientLight intensity={1.1} />
              <spotLight position={[8, 12, 10]} angle={0.32} penumbra={1} intensity={3.1} castShadow={false} />
              <spotLight position={[-7, 9, -9]} angle={0.35} penumbra={1} intensity={1.5} />
              <pointLight position={[0, 4, 1]} intensity={1.2} />
              <Suspense fallback={<Loading3D />}>
                <RingModel {...config} />
                <Environment preset="city" />
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

          <motion.div
            key={estimatedPrice}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute right-2 top-2 z-10 flex h-7 items-center rounded-[var(--lux-pill)] border border-[#e5cc8b] lux-surface px-2 shadow-[var(--lux-shadow-soft)]"
          >
            <span className="lux-display text-xs leading-none lux-accent">${estimatedPrice.toLocaleString()}</span>
          </motion.div>
        </section>

        <section className="flex min-h-0 flex-[0.62] basis-0 flex-col overflow-hidden px-4 pb-1 pt-1">
          <div className="flex shrink-0 justify-center pb-1">
            <div className="flex gap-0.5 rounded-[var(--lux-pill)] border border-[var(--lux-border)] lux-surface p-0.5">
              {(['hero', 'top', 'profile'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={cn(
                    'h-6 rounded-[var(--lux-pill)] px-3 lux-ui text-[8px] uppercase tracking-[0.14em] transition-colors',
                    view === v ? 'bg-[#121212] text-[#f1f1f1]' : 'text-[#121212] hover:bg-[#f1f1f1]'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="no-scrollbar flex shrink-0 gap-1.5 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  tabBase,
                  activeTab === tab.id
                    ? 'border-[#121212] bg-[#121212] text-[#f1f1f1]'
                    : 'border-[var(--lux-border)] bg-transparent text-[#121212] hover:border-[#121212]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="lux-surface no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-[var(--lux-radius-md)] border border-[var(--lux-border)] px-2 py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-2"
            >
              {activeTab === 'metal' && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { id: 'yellow gold', label: 'Yellow Gold', color: 'bg-gradient-to-br from-[#F3E5AB] to-[#D4AF37]' },
                    { id: 'white gold', label: 'White Gold', color: 'bg-gradient-to-br from-[#F8F9FA] to-[#DCDCDC]' },
                    { id: 'rose gold', label: 'Rose Gold', color: 'bg-gradient-to-br from-[#E8B3B9] to-[#B76E79]' },
                    { id: 'platinum', label: 'Platinum', color: 'bg-gradient-to-br from-[#E5E4E2] to-[#9FA0A4]' }
                  ].map((m) => (
                    <button key={m.id} onClick={() => setConfig({ ...config, metal: m.id as RingConfig['metal'] })} className="space-y-1">
                      <div
                        className={cn(
                          'mx-auto flex h-10 w-10 items-center justify-center rounded-full border transition-colors',
                          m.color,
                          config.metal === m.id ? 'border-[#121212]' : 'border-[#e4e4e4]'
                        )}
                      >
                        {config.metal === m.id ? <Check size={12} className="text-[#121212]" /> : null}
                      </div>
                      <p className="lux-ui text-center text-[7px] uppercase tracking-[0.12em]">{m.label}</p>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'band' && (
                <div className="grid grid-cols-2 gap-2">
                  {(['plain', 'pave'] as const).map((item) => (
                    <button
                      key={item}
                      onClick={() => setConfig({ ...config, bandStyle: item })}
                      className={cn(
                        'flex h-9 items-center justify-between rounded-[var(--lux-radius-sm)] border px-2.5 transition-colors',
                        config.bandStyle === item ? 'border-[#121212] bg-[#f8f6f1]' : 'border-[var(--lux-border)]'
                      )}
                    >
                      <span className="lux-ui text-[9px] uppercase tracking-[0.14em]">{item}</span>
                      <span className="lux-ui text-[8px] lux-muted">{item === 'pave' ? '+$400' : 'Inc.'}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'setting' && (
                <div className="grid grid-cols-2 gap-2">
                  {(['solitaire', 'bezel'] as const).map((item) => (
                    <button
                      key={item}
                      onClick={() => setConfig({ ...config, settingStyle: item })}
                      className={cn(
                        'flex h-9 items-center justify-between rounded-[var(--lux-radius-sm)] border px-2.5 transition-colors',
                        config.settingStyle === item ? 'border-[#121212] bg-[#f8f6f1]' : 'border-[var(--lux-border)]'
                      )}
                    >
                      <span className="lux-ui text-[9px] uppercase tracking-[0.14em]">{item}</span>
                      <span className="lux-ui text-[8px] lux-muted">{item === 'bezel' ? '+$150' : 'Inc.'}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'stone' && (
                <>
                  <p className="lux-ui text-[8px] uppercase tracking-[0.16em] lux-muted">Center stone</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'diamond', label: 'Diamond', color: 'bg-gradient-to-br from-white to-gray-200' },
                      { id: 'emerald', label: 'Emerald', color: 'bg-gradient-to-br from-[#50C878] to-[#043927]' },
                      { id: 'sapphire', label: 'Sapphire', color: 'bg-gradient-to-br from-[#0F52BA] to-[#000080]' },
                      { id: 'ruby', label: 'Ruby', color: 'bg-gradient-to-br from-[#E0115F] to-[#8B0000]' }
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setConfig({ ...config, stone: s.id as RingConfig['stone'] })}
                        className={cn(
                          'flex h-9 items-center gap-2 rounded-[var(--lux-radius-sm)] border px-2 transition-colors',
                          config.stone === s.id ? 'border-[#121212] bg-[#f8f6f1]' : 'border-[var(--lux-border)]'
                        )}
                      >
                        <span className={cn('h-5 w-5 shrink-0 rounded-full border border-[#dfdfdf]', s.color)} />
                        <span className="lux-ui text-[9px] uppercase tracking-[0.12em]">{s.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="pt-1">
                    <p className="lux-ui mb-1 text-[8px] uppercase tracking-[0.16em] lux-muted">Stone shape</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['round', 'emerald', 'oval'] as const).map((shape) => (
                        <button
                          key={shape}
                          onClick={() => setConfig({ ...config, shape })}
                          className={cn(
                            'h-7 rounded-[var(--lux-pill)] border lux-ui text-[8px] uppercase tracking-[0.12em]',
                            config.shape === shape ? 'border-[#121212] bg-[#121212] text-[#f1f1f1]' : 'border-[var(--lux-border)]'
                          )}
                        >
                          {shape}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'engrave' && (
                <div className="space-y-1.5">
                  <p className="lux-ui text-[8px] uppercase tracking-[0.14em] lux-muted">Engraving (max 20)</p>
                  <input
                    type="text"
                    maxLength={20}
                    value={config.engraving}
                    onChange={(e) => setConfig({ ...config, engraving: e.target.value })}
                    placeholder="Forever Yours"
                    className="h-9 w-full rounded-[var(--lux-radius-sm)] border border-[var(--lux-border)] px-2 lux-ui text-xs bg-transparent focus:outline-none focus:border-[#121212]"
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          </div>

          <div className="mt-1 shrink-0 space-y-1">
            <button
              type="button"
              onClick={saveToBrief}
              disabled={isSaving}
              className="flex h-8 w-full items-center justify-center gap-1.5 rounded-[var(--lux-pill)] bg-[#121212] text-[#f1f1f1] lux-ui text-[8px] uppercase tracking-[0.18em] transition-opacity disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Save to Brief'}
              <ChevronRight size={14} />
            </button>
            {saveMessage ? (
              <p className="lux-ui text-center text-[8px] uppercase tracking-[0.16em] lux-accent">{saveMessage}</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
