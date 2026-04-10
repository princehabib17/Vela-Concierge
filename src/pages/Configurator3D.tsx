import { useState, Suspense, useRef, useMemo, Component, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

class CanvasErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center text-center px-6">
          <div className="bg-white/90 border border-black/10 rounded-2xl p-4 max-w-xs">
            <p className="text-xs uppercase tracking-widest text-black/50 mb-2">3D preview unavailable</p>
            <p className="text-sm text-black/75">The configurator controls still work. Refresh to retry the live render.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Photorealistic CAD-Quality Ring Component
function RingModel({ metal, stone, shape, engraving, bandStyle, settingStyle }: any) {
  const group = useRef<THREE.Group>(null);
  
  // Load the external OBJ file
  const obj = useLoader(OBJLoader, '/ring.obj');

  // Define ultra-realistic physical materials
  const metalProps = { 
    metalness: 1, 
    roughness: 0.05, // polished luxury metal
    clearcoat: 1, 
    clearcoatRoughness: 0.1, 
    envMapIntensity: 2.5 
  };
  
  const materials = useMemo(() => ({
    'yellow gold': new THREE.MeshPhysicalMaterial({ color: '#E5C07B', ...metalProps }),
    'rose gold': new THREE.MeshPhysicalMaterial({ color: '#DDA7A5', ...metalProps }),
    'white gold': new THREE.MeshPhysicalMaterial({ color: '#F8F9FA', ...metalProps, roughness: 0.03 }),
    'platinum': new THREE.MeshPhysicalMaterial({ color: '#E5E4E2', ...metalProps, roughness: 0.01, envMapIntensity: 3 }),
  }), []);

  // Setting material: Two-tone setting (classic luxury technique: white gold prongs for colored bands)
  const settingMaterial = (metal === 'yellow gold' || metal === 'rose gold')
    ? materials['white gold']
    : materials[metal as keyof typeof materials];

  const activeMetal = materials[metal as keyof typeof materials] || materials['yellow gold'];

  const stoneProps = useMemo(() => ({
    'diamond': { color: '#ffffff', transmission: 1, ior: 2.417, thickness: 1.5, roughness: 0, dispersion: 1.5 },
    'emerald': { color: '#50C878', transmission: 1, ior: 1.577, thickness: 1.5, roughness: 0, dispersion: 0.8 },
    'sapphire': { color: '#0F52BA', transmission: 1, ior: 1.762, thickness: 1.5, roughness: 0, dispersion: 0.5 },
    'ruby': { color: '#E0115F', transmission: 1, ior: 1.762, thickness: 1.5, roughness: 0, dispersion: 0.5 },
  }), []);
  
  const activeStoneProps = stoneProps[stone as keyof typeof stoneProps] || stoneProps['diamond'];

  const stoneMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      ...activeStoneProps,
      envMapIntensity: 4,
      transparent: true,
      side: THREE.DoubleSide
    });
  }, [activeStoneProps]);

  // Clone the OBJ and map materials dynamically based on the discovered internal material names
  const objClone = useMemo(() => {
    const clone = obj.clone();
    
    clone.traverse((child: any) => {
      if (child.isMesh) {
        // Essential for shadows/reflections
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Ensure smooth shading for metal and somewhat flat for facets if necessary
        child.geometry.computeVertexNormals();

        const matName = child.material.name;
        // The downloaded OBJ uses specific material names
        // _Material_1 is usually the main band
        if (matName.includes("Material_1")) {
           child.material = activeMetal;
        } 
        // _Material_28 often represents the setting / crown
        else if (matName.includes("Material_28")) {
           child.material = settingMaterial;
        } 
        // Assume anything else (Material_2, etc) are diamonds (center and pave)
        else {
           child.material = stoneMaterial;
        }
      }
    });

    // Center and scale the geometry for our viewport
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.sub(center); // Center it
    clone.position.y += 0.8; // Lift
    clone.scale.set(0.08, 0.08, 0.08); // Adjust scale of raw OBJ to fit canvas

    return clone;
  }, [obj, activeMetal, settingMaterial, stoneMaterial]);

  useFrame(() => {
    if (group.current) {
      group.current.rotation.y += 0.005; // Elegant rotation
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.03} floatIntensity={0.06}>
      <group ref={group} position={[0, -0.25, 0]} rotation={[0.18, 0.2, -0.2]}>
        {/* Cathedral knife-edge band for a premium solitaire profile */}
        <group>
          <mesh material={activeMetal} scale={[1, 1.18, 0.62]}>
            <torusGeometry args={[1, 0.1, 96, 180]} />
          </mesh>
          <mesh material={activeMetal} position={[0, 0.62, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.075, 0.045, 0.55, 32]} />
          </mesh>
          <mesh material={activeMetal} position={[0, 0.62, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[0.075, 0.045, 0.55, 32]} />
          </mesh>
        </group>

        {/* Pavé Diamonds - Optimized using InstancedMesh */}
        {bandStyle === 'pave' && (
          <Instances range={20} material={paveMaterial} geometry={paveGeometry}>
            {Array.from({ length: 20 }).map((_, i) => {
              const angle = (Math.PI / 4) + (i / 19) * (Math.PI / 2); // Top quadrant
              if (angle > Math.PI/2 - 0.18 && angle < Math.PI/2 + 0.18) return null; // Gap for setting
              return (
                <Instance
                  key={i}
                  position={[
                    Math.cos(angle) * 1.08,
                    Math.sin(angle) * 1.08 * 1.1,
                    0
                  ]}
                  rotation={[0, 0, angle]}
                />
              )
            })}
          </Instances>
        )}

        {/* Setting & Main Stone */}
        {stone !== 'none' && (
          <group position={[0, 1.13, 0]}>
            {/* Base of setting (blends into the band) */}
            <mesh material={settingMaterial} position={[0, -0.08, 0]}>
              <cylinderGeometry args={[0.07, 0.11, 0.12, 32]} />
            </mesh>
            
            {settingStyle === 'bezel' ? (
              // Bezel Setting
              <mesh material={settingMaterial} position={[0, 0.15, 0]}>
                <cylinderGeometry args={[0.42, 0.2, 0.25, 64]} />
              </mesh>
            ) : (
              // Realistic 6-Prong Setting (Classic Tiffany style)
              <group>
                {/* Gallery Rail (horizontal wire connecting prongs) */}
                <mesh material={settingMaterial} position={[0, 0.08, 0]} rotation={[Math.PI/2, 0, 0]}>
                  <torusGeometry args={[0.25, 0.02, 16, 64]} />
                </mesh>
                {/* Prongs */}
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const angle = (i / 6) * Math.PI * 2;
                  return (
                    <group key={i} rotation={[0, angle, 0]}>
                      {/* Prong body (angled outwards from base to girdle) */}
                      <mesh material={settingMaterial} position={[0, 0.12, 0.2]} rotation={[0.55, 0, 0]}>
                        <cylinderGeometry args={[0.018, 0.026, 0.4, 18]} />
                      </mesh>
                      {/* Prong tip (rounded, holding the crown) */}
                      <mesh material={settingMaterial} position={[0, 0.3, 0.3]} rotation={[0.55, 0, 0]}>
                        <sphereGeometry args={[0.025, 16, 16]} />
                      </mesh>
                    </group>
                  )
                })}
              </group>
            )}
            
            {/* Stone - High-Fidelity Lathe Geometry */}
            <mesh position={[0, 0.14, 0]} scale={shape === 'oval' ? [1, 1, 1.3] : shape === 'emerald' ? [0.8, 1, 1.2] : [1, 1, 1]}>
              {shape === 'emerald' ? (
                <octahedronGeometry args={[0.4, 2]} />
              ) : (
                <latheGeometry args={[diamondPoints, shape === 'oval' ? 32 : 16]} />
              )}
              <MeshTransmissionMaterial 
                {...activeStoneProps} 
                resolution={1024}
                samples={8}
                anisotropy={16}
                clearcoat={1}
                clearcoatRoughness={0}
                envMapIntensity={3}
              />
            </mesh>
          </group>
        )}

        {/* Dynamic Engraving overlaid on the geometry's relative coord system */}
        {engraving && (
           <Text
            position={[-0.2, 0.6, 0.9]}
            rotation={[0, 0, 0]}
            fontSize={0.04}
            color="#000000"
            anchorX="center"
            anchorY="middle"
            font="https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.woff"
          >
            {engraving}
          </Text>
        )}
      </group>
    </Float>
  );
}

export default function Configurator3D() {
  const [activeTab, setActiveTab] = useState('metal');
  const [view, setView] = useState<'hero' | 'top' | 'profile'>('hero');
  const [config, setConfig] = useState({
    metal: 'yellow gold',
    stone: 'diamond',
    engraving: ''
  });

  const tabs = [
    { id: 'metal', label: 'Metal' },
    { id: 'stone', label: 'Stone' },
    { id: 'engrave', label: 'Engraving' }
  ];

  const metalOptions = [
    { id: 'yellow gold', label: 'Yellow Gold', color: 'bg-gradient-to-br from-[#F3E5AB] to-[#D4AF37]' },
    { id: 'white gold', label: 'White Gold', color: 'bg-gradient-to-br from-[#F8F9FA] to-[#DCDCDC]' },
    { id: 'rose gold', label: 'Rose Gold', color: 'bg-gradient-to-br from-[#E8B3B9] to-[#B76E79]' },
    { id: 'platinum', label: 'Platinum', color: 'bg-gradient-to-br from-[#E5E4E2] to-[#9FA0A4]' },
  ];

  const stoneOptions = [
    { id: 'diamond', label: 'Diamond', color: 'bg-gradient-to-br from-white to-gray-200' },
    { id: 'emerald', label: 'Emerald', color: 'bg-gradient-to-br from-[#50C878] to-[#043927]' },
    { id: 'sapphire', label: 'Sapphire', color: 'bg-gradient-to-br from-[#0F52BA] to-[#000080]' },
    { id: 'ruby', label: 'Ruby', color: 'bg-gradient-to-br from-[#E0115F] to-[#8B0000]' },
  ];

  const shapeOptions = ['round', 'emerald', 'oval'];
  const bandOptions = ['plain', 'pave'];
  const settingOptions = ['solitaire', 'bezel'];
  const cameraByView = {
    hero: [0.8, 1.4, 3.6],
    top: [0.2, 3.2, 1.4],
    profile: [2.8, 1, 0.2]
  } as const;

  // Calculate estimated price
  const basePrice = 2500;
  const metalPrice = config.metal === 'platinum' ? 800 : 0;
  const stonePrice = config.stone === 'diamond' ? 4500 : 1800;
  
  const estimatedPrice = basePrice + metalPrice + stonePrice;

  return (
    <div className="h-full flex flex-col bg-[#f7f7f5] text-[#111111]">
      <header className="p-6 pb-2 z-10 absolute top-0 left-0 right-0 pointer-events-none">
        <h1 className="text-2xl font-serif mb-1 text-shadow-sm">Ring 3D Studio</h1>
        <p className="text-[#111111]/60 text-xs uppercase tracking-wider">Studio-grade solitaire customization</p>
      </header>

      {/* Studio Lighting Background Gradient */}
      <div className="flex-1 relative mt-16 bg-[radial-gradient(circle_at_42%_26%,#ffffff_0%,#f0f0ed_60%,#e4e4de_100%)]">
        <CanvasErrorBoundary>
          <Canvas 
            camera={{ position: cameraByView[view], fov: 35 }}
            dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1.5}
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.32, powerPreference: "high-performance" }}
          >
            {/* Intense Studio Lighting Setup */}
            <ambientLight intensity={1.15} />
            <spotLight position={[8, 12, 10]} angle={0.32} penumbra={1} intensity={3.2} castShadow />
            <spotLight position={[-7, 9, -9]} angle={0.35} penumbra={1} intensity={1.6} />
            <pointLight position={[0, 4, 1]} intensity={1.4} />
            
            <Suspense fallback={null}>
              <RingModel {...config} />
              <Environment preset="city" />
              <ContactShadows position={[0, -1.45, 0]} opacity={0.3} scale={7} blur={2.8} far={4} color="#777777" />
            </Suspense>
            <OrbitControls enablePan={false} minPolarAngle={Math.PI/6} maxPolarAngle={Math.PI/1.4} minDistance={2.2} maxDistance={5.8} />
          </Canvas>
        </CanvasErrorBoundary>
        
        <motion.div 
          key={estimatedPrice}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-full border border-[#d4af37]/40 shadow-lg"
        >
          <span className="text-[#9a7a1f] font-serif text-lg tracking-wide">${estimatedPrice.toLocaleString()}</span>
        </motion.div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/75 backdrop-blur-md border border-[#111111]/10 rounded-full p-1 flex gap-1">
          {(['hero', 'top', 'profile'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[10px] tracking-[0.2em] uppercase transition-colors",
                view === v ? "bg-[#111111] text-white" : "text-[#111111]/70 hover:bg-black/5"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Configurator Panel */}
      <div className="bg-white border-t border-black/10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.12)] z-20">
        {/* Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide px-4 pt-4 pb-2 border-b border-vela-gray/20">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 text-xs font-medium tracking-wider uppercase whitespace-nowrap transition-colors relative",
                activeTab === tab.id ? "text-[#9a7a1f]" : "text-black/40 hover:text-black/80"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab" 
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4af37]" 
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 min-h-[220px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'metal' && (
                <div className="grid grid-cols-4 gap-4">
                  {metalOptions.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setConfig({...config, metal: m.id})}
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
                        m.color,
                        config.metal === m.id ? "ring-2 ring-[#d4af37] ring-offset-2 ring-offset-white scale-110" : "opacity-70 group-hover:opacity-100 group-hover:scale-105"
                      )}>
                        {config.metal === m.id && <Check size={16} className={m.id === 'white gold' || m.id === 'platinum' ? 'text-black' : 'text-white'} />}
                      </div>
                      <span className={cn(
                        "text-[10px] uppercase tracking-wider text-center",
                        config.metal === m.id ? "text-[#9a7a1f]" : "text-black/50"
                      )}>{m.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'band' && (
                <div className="grid grid-cols-2 gap-4">
                  {bandOptions.map(b => (
                    <button
                      key={b}
                      onClick={() => setConfig({...config, bandStyle: b})}
                      className={cn(
                        "p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2",
                        config.bandStyle === b ? "border-[#d4af37] bg-[#d4af37]/5" : "border-black/20 hover:border-black/40"
                      )}
                    >
                      <span className="text-sm font-serif capitalize">{b}</span>
                      <span className="text-[10px] text-black/45 uppercase tracking-wider">
                        {b === 'pave' ? '+$400' : 'Included'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

                {/* Stone Selection */}
                {activeTab === 'stone' && (
                  <div className="space-y-4">
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-4">Select Center Stone</p>
                    <div className="grid grid-cols-2 gap-3">
                      {stoneOptions.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setConfig({...config, stone: s.id})}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
                            config.stone === s.id ? "border-vela-gold bg-vela-gold/10" : "border-white/5 hover:border-white/20 bg-white/5"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
                            s.color,
                            config.stone === s.id ? "ring-2 ring-[#d4af37] ring-offset-2 ring-offset-white scale-110" : "opacity-70 group-hover:opacity-100 group-hover:scale-105"
                          )}>
                            {config.stone === s.id && s.id !== 'none' && <Check size={14} className={s.id === 'diamond' ? 'text-black' : 'text-white'} />}
                          </div>
                          <span className={cn(
                            "text-[10px] uppercase tracking-wider text-center",
                            config.stone === s.id ? "text-[#9a7a1f]" : "text-black/50"
                          )}>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                  {config.stone !== 'none' && (
                    <div className="pt-4 border-t border-black/10">
                      <h4 className="text-[10px] text-black/50 uppercase tracking-wider mb-3">Stone Shape</h4>
                      <div className="flex gap-3">
                        {shapeOptions.map(s => (
                          <button
                            key={s}
                            onClick={() => setConfig({...config, shape: s})}
                            className={cn(
                              "px-4 py-2 rounded-full text-xs tracking-wider uppercase border transition-all",
                              config.shape === s ? "border-[#d4af37] text-[#9a7a1f] bg-[#d4af37]/10" : "border-black/20 text-black/70 hover:border-black/50"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

              {activeTab === 'setting' && (
                <div className="grid grid-cols-2 gap-4">
                  {settingOptions.map(s => (
                    <button
                      key={s}
                      onClick={() => setConfig({...config, settingStyle: s})}
                      className={cn(
                        "p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2",
                        config.settingStyle === s ? "border-[#d4af37] bg-[#d4af37]/5" : "border-black/20 hover:border-black/40"
                      )}
                    >
                      <span className="text-sm font-serif capitalize">{s}</span>
                      <span className="text-[10px] text-black/45 uppercase tracking-wider">
                        {s === 'bezel' ? '+$150' : 'Included'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'engrave' && (
                <div className="space-y-4">
                  <p className="text-xs text-black/60 font-light">Add a personal touch with a custom engraving on the inside of the band. Maximum 20 characters.</p>
                  <input
                    type="text"
                    maxLength={20}
                    value={config.engraving}
                    onChange={(e) => setConfig({...config, engraving: e.target.value})}
                    placeholder="e.g. Forever Yours"
                    className="w-full bg-[#fcfcfb] border border-black/20 rounded-lg p-4 text-sm text-black focus:outline-none focus:border-[#d4af37]/70 transition-colors"
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-4 pt-0 pb-24">
          <button className="w-full bg-[#d4af37] text-black py-4 rounded-xl font-medium tracking-widest uppercase text-xs hover:bg-[#c59b2d] transition-all hover:scale-[1.02] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.25)]">
            Save to Brief <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
