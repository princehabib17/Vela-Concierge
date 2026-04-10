import { Link } from 'react-router-dom';
import { Sparkles, Box, Camera, Map, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, Float, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useMemo, useRef } from 'react';

// A dazzling floating diamond component for the Hero section
function HeroDiamond() {
  const mesh = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.2;
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  const diamondPoints = useMemo(() => {
    return [
      new THREE.Vector2(0, -0.4),     // Culet
      new THREE.Vector2(0.4, 0.05),   // Girdle bottom
      new THREE.Vector2(0.4, 0.1),    // Girdle top
      new THREE.Vector2(0.25, 0.25),  // Table edge
      new THREE.Vector2(0, 0.25)      // Table center
    ];
  }, []);

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={mesh} position={[0, -0.1, 0]}>
        <latheGeometry args={[diamondPoints, 32]} />
        <MeshTransmissionMaterial 
          color="#ffffff" 
          transmission={1} 
          ior={2.417} 
          thickness={1.5} 
          roughness={0} 
          chromaticAberration={0.08} 
          backside={true}
          clearcoat={1}
          clearcoatRoughness={0}
          envMapIntensity={2}
          resolution={1024}
        />
      </mesh>
    </Float>
  );
}

export default function Home() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="pb-6 h-full overflow-y-auto"
    >
      {/* Hero Section */}
      <section className="relative h-[60vh] w-full mb-8 overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 bg-vela-black">
          {/* Stunning 3D Canvas Background */}
          <Canvas 
            camera={{ position: [0, 0, 2.5], fov: 45 }}
            dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 2}
            className="w-full h-full"
          >
            <ambientLight intensity={1.2} />
            <spotLight position={[5, 10, 5]} angle={0.25} penumbra={1} intensity={6} color="#FFE6CD" />
            <spotLight position={[-5, 8, -5]} angle={0.3} penumbra={1} intensity={3} color="#FFFFFF" />
            <pointLight position={[0, -3, 0]} intensity={2} color="#DDA7A5" />
            
            <HeroDiamond />
            
            <Environment preset="city" />
            <ContactShadows position={[0, -1, 0]} opacity={0.6} scale={10} blur={2.5} far={4} color="#000000" />
          </Canvas>
          <div className="absolute inset-0 bg-gradient-to-t from-vela-black via-vela-black/10 to-transparent pointer-events-none" />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end pointer-events-none">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <h2 className="text-sm text-vela-gold tracking-[0.2em] uppercase mb-3">The Atelier</h2>
            <h1 className="text-4xl font-serif leading-tight mb-4 text-vela-light text-shadow-sm">
              Craft Your <br/><span className="italic text-vela-light/90">Legacy</span>
            </h1>
            <p className="text-vela-light/70 font-light text-sm max-w-[280px] leading-relaxed">
              Experience the art of bespoke jewellery creation with Paul Ginocchi's 40 years of mastery.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="px-6 space-y-6">
        {/* Design Tools Grid */}
        <section className="grid grid-cols-2 gap-4">
          <Link to="/design/ai" className="relative block overflow-hidden rounded-xl border border-vela-gray/30 group aspect-[4/5]">
            <img 
              src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=600&auto=format&fit=crop" 
              alt="AI Design" 
              className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-vela-black/90 via-vela-black/40 to-transparent" />
            <div className="absolute inset-0 p-4 flex flex-col justify-between z-10">
              <div className="w-8 h-8 rounded-full bg-vela-black/50 backdrop-blur-md flex items-center justify-center border border-vela-gold/30">
                <Sparkles className="text-vela-gold" size={14} />
              </div>
              <div>
                <h3 className="text-lg font-serif mb-1">AI Design</h3>
                <p className="text-[10px] text-vela-light/60 tracking-wider uppercase">Generate Concepts</p>
              </div>
            </div>
          </Link>
          
          <Link to="/design/3d" className="relative block overflow-hidden rounded-xl border border-vela-gray/30 group aspect-[4/5]">
            <img 
              src="https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?q=80&w=600&auto=format&fit=crop" 
              alt="3D Configurator" 
              className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-vela-black/90 via-vela-black/40 to-transparent" />
            <div className="absolute inset-0 p-4 flex flex-col justify-between z-10">
              <div className="w-8 h-8 rounded-full bg-vela-black/50 backdrop-blur-md flex items-center justify-center border border-vela-gold/30">
                <Box className="text-vela-gold" size={14} />
              </div>
              <div>
                <h3 className="text-lg font-serif mb-1">3D Build</h3>
                <p className="text-[10px] text-vela-light/60 tracking-wider uppercase">Configure Ring</p>
              </div>
            </div>
          </Link>
        </section>

        {/* Try On Section */}
        <section>
          <Link to="/try-on" className="relative block overflow-hidden rounded-xl border border-vela-gray/30 group">
            <div className="absolute inset-0 bg-gradient-to-r from-vela-black/90 via-vela-black/60 to-transparent z-10" />
            <img 
              src="https://images.unsplash.com/photo-1605100804763-247f66126e9e?q=80&w=800&auto=format&fit=crop" 
              alt="Virtual Try On" 
              className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 p-5 z-20 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-serif mb-1 text-vela-gold">Virtual Try-On</h3>
                <p className="text-xs text-vela-light/70 tracking-wide uppercase">Experience in AR</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-vela-gold/10 backdrop-blur-md border border-vela-gold/30 flex items-center justify-center group-hover:bg-vela-gold group-hover:text-vela-black transition-colors">
                <ArrowRight size={18} />
              </div>
            </div>
          </Link>
        </section>

        {/* Active Journey Section */}
        <section className="bg-vela-dark rounded-xl p-6 border border-vela-gray/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-vela-gold/5 rounded-full blur-2xl -mr-10 -mt-10" />
          
          <div className="flex items-start justify-between mb-6 relative z-10">
            <div>
              <h3 className="text-lg font-serif mb-1">Your Vela Journey</h3>
              <p className="text-[10px] text-vela-gold tracking-widest uppercase">Active Order</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-vela-black flex items-center justify-center border border-vela-gray/50">
              <Map className="text-vela-light/70" size={14} />
            </div>
          </div>
          
          <div className="relative pt-2 z-10">
            <div className="absolute left-[7px] top-4 bottom-0 w-[1px] bg-vela-gray/30" />
            
            <div className="flex gap-4 mb-2 relative">
              <div className="w-4 h-4 rounded-full bg-vela-gold flex items-center justify-center shrink-0 mt-1 shadow-[0_0_10px_rgba(251,222,147,0.3)]">
                <div className="w-1.5 h-1.5 rounded-full bg-vela-black" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-vela-light">Design & Stone Selection</h4>
                <p className="text-xs text-vela-light/50 mt-1.5 leading-relaxed">Paul is currently sourcing sapphires based on your brief.</p>
              </div>
            </div>
            
            <Link to="/journey" className="text-[10px] text-vela-gold uppercase tracking-widest mt-6 inline-flex items-center gap-2 hover:text-vela-light transition-colors group">
              View Full Timeline <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
