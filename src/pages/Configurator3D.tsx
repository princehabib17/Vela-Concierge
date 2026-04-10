import { useState, Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

// Photorealistic CAD-Quality Ring Component loading user's custom .obj
function RingModel({ metal, stone, engraving }: any) {
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
    <Float speed={1.5} rotationIntensity={0.02} floatIntensity={0.05}>
      <group ref={group} position={[0, -0.4, 0]}>
        
        {/* Render the hydrated OBJ file */}
        <primitive object={objClone} />

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

  // Calculate estimated price
  const basePrice = 2500;
  const metalPrice = config.metal === 'platinum' ? 800 : 0;
  const stonePrice = config.stone === 'diamond' ? 4500 : 1800;
  
  const estimatedPrice = basePrice + metalPrice + stonePrice;

  return (
    <div className="h-full w-full flex bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-vela-black via-[#0a0a0a] to-[#000000]">
      <header className="p-8 absolute top-0 left-0 right-0 pointer-events-none z-10">
        <h1 className="text-4xl font-serif text-white/90 drop-shadow-md">Studio</h1>
        <p className="text-white/40 text-sm mt-1 uppercase tracking-[0.2em]">Bespoke Configurator</p>
      </header>

      {/* 3D Canvas occupying the full screen */}
      <div className="absolute inset-0 z-0">
        <Canvas 
          camera={{ position: [0, 0, 5], fov: 40 }}
          dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 3) : 2}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        >
          {/* Invisible HDRI to provide intense photorealistic reflections while background remains dark */}
          <Environment preset="studio" blur={1} />
          
          <ambientLight intensity={0.5} />
          {/* Key lights for jewelry */}
          <spotLight position={[5, 10, 5]} angle={0.2} penumbra={0.8} intensity={5} castShadow />
          <spotLight position={[-5, 5, -5]} angle={0.4} penumbra={1} intensity={2} />
          
          <Suspense fallback={null}>
            <RingModel {...config} />
          </Suspense>
          
          <OrbitControls enablePan={false} minPolarAngle={Math.PI/3} maxPolarAngle={Math.PI/1.5} minDistance={2} maxDistance={8} />
        </Canvas>
      </div>

      {/* Floating Glassmorphic UI Panel (Tailwind UI guidelines) */}
      <div className="pointer-events-none absolute inset-0 flex flex-col md:flex-row justify-end items-end md:items-start p-6 pt-24 z-20">
        <div className="pointer-events-auto w-full md:w-96 bg-vela-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          
          {/* Price Header */}
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
            <span className="text-white/60 text-xs tracking-widest uppercase">Estimated Value</span>
            <motion.span 
              key={estimatedPrice}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-vela-gold font-serif text-2xl"
            >
              ${estimatedPrice.toLocaleString()}
            </motion.span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex px-4 pt-4 pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 px-2 py-3 text-xs tracking-widest uppercase whitespace-nowrap transition-colors relative text-center",
                  activeTab === tab.id ? "text-vela-gold" : "text-white/40 hover:text-white/70"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="tab-indicator" 
                    className="absolute bottom-0 left-1/4 right-1/4 h-px bg-vela-gold" 
                  />
                )}
              </button>
            ))}
          </div>

          {/* Configuration Area */}
          <div className="p-6 h-64 overflow-y-auto scrollbar-hide">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
              >
                
                {/* Metal Selection */}
                {activeTab === 'metal' && (
                  <div className="space-y-4">
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-4">Select Band Alloy</p>
                    <div className="grid grid-cols-2 gap-3">
                      {metalOptions.map(m => (
                        <button
                          key={m.id}
                          onClick={() => setConfig({...config, metal: m.id})}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
                            config.metal === m.id ? "border-vela-gold bg-vela-gold/10" : "border-white/5 hover:border-white/20 bg-white/5"
                          )}
                        >
                          <div className={cn("w-6 h-6 rounded-full shadow-inner", m.color)} />
                          <span className="text-xs text-white/80">{m.label}</span>
                        </button>
                      ))}
                    </div>
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
                          <div className={cn("w-6 h-6 rounded-full shadow-inner", s.color)} />
                          <span className="text-xs text-white/80">{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Engraving */}
                {activeTab === 'engrave' && (
                  <div className="space-y-6">
                    <p className="text-xs text-white/40 font-light leading-relaxed">
                      Add a personal touch with a bespoke engraving on the inner band. (Max 20 chars)
                    </p>
                    <input
                      type="text"
                      maxLength={20}
                      value={config.engraving}
                      onChange={(e) => setConfig({...config, engraving: e.target.value})}
                      placeholder="Forever Yours"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-vela-gold/50 transition-colors placeholder:text-white/20"
                    />
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* Action Button */}
          <div className="p-6 bg-black/20 border-t border-white/5">
            <button className="w-full bg-vela-gold text-black py-4 rounded-xl font-medium tracking-widest uppercase text-xs hover:bg-white transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(251,222,147,0.15)]">
              Add to Brief <ChevronRight size={16} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
