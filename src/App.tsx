import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Sparkles, Box, Camera, Map, Ruler, Diamond, User } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from './lib/utils';

// Components for pages
import Home from './pages/Home';
import AIDesign from './pages/AIDesign';
import Configurator3D from './pages/Configurator3D';
import ARTryOn from './pages/ARTryOn';
import JourneyTracker from './pages/JourneyTracker';
import JewelleryBox from './pages/JewelleryBox';
import RingSizer from './pages/RingSizer';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';

function SplashScreen() {
  /** visible → fading (pointer-events off so UI is usable while overlay fades) → unmounted */
  const [phase, setPhase] = useState<'visible' | 'fading' | 'off'>('visible');

  useEffect(() => {
    const startFade = setTimeout(() => setPhase('fading'), 2400);
    const remove = setTimeout(() => setPhase('off'), 2400 + 800);
    return () => {
      clearTimeout(startFade);
      clearTimeout(remove);
    };
  }, []);

  if (phase === 'off') return null;

  return (
    <motion.div
      aria-hidden={phase === 'fading'}
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'fading' ? 0 : 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-vela-black"
      style={{ pointerEvents: phase === 'fading' ? 'none' : 'auto' }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <Diamond className="mb-8 text-vela-gold" size={48} strokeWidth={1} />
        <h1 className="mb-4 ml-3 text-5xl font-serif uppercase tracking-[0.3em] text-vela-gold">Vela</h1>
        <p className="ml-1 text-xs font-light uppercase tracking-[0.4em] text-vela-light/60">Bespoke Jewellers</p>
      </motion.div>
    </motion.div>
  );
}

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Home' },
    { path: '/design/ai', icon: Sparkles, label: 'AI Design' },
    { path: '/design/3d', icon: Box, label: '3D Build' },
    { path: '/try-on', icon: Camera, label: 'Try On' },
    { path: '/journey', icon: Map, label: 'Journey' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-vela-black/90 backdrop-blur-lg border-t border-vela-gray/30 pb-safe pt-2 px-6 z-50">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 p-2 transition-colors",
                isActive ? "text-vela-gold" : "text-vela-light/40 hover:text-vela-light"
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 1.5 : 1} />
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 shrink-0 bg-gradient-to-b from-vela-black/90 to-vela-black/0 backdrop-blur-sm px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Diamond className="text-vela-gold" size={20} strokeWidth={1.5} />
        <h1 className="text-xl font-serif tracking-widest uppercase text-vela-light">Vela</h1>
      </div>
      <div className="flex gap-5">
        <Link to="/jewellery-box" className="text-vela-light/80 hover:text-vela-gold transition-colors">
          <Box size={20} strokeWidth={1.5} />
        </Link>
        <Link to="/sizer" className="text-vela-light/80 hover:text-vela-gold transition-colors">
          <Ruler size={20} strokeWidth={1.5} />
        </Link>
        <Link to="/profile" className="text-vela-light/80 hover:text-vela-gold transition-colors">
          <User size={20} strokeWidth={1.5} />
        </Link>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SplashScreen />
      <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-vela-black text-vela-light font-sans">
        <Header />
        <main className="relative flex min-h-0 flex-1 flex-col w-full max-w-md mx-auto overflow-hidden pb-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/design/ai" element={<AIDesign />} />
            <Route path="/design/3d" element={<Configurator3D />} />
            <Route path="/try-on" element={<ARTryOn />} />
            <Route path="/journey" element={<JourneyTracker />} />
            <Route path="/jewellery-box" element={<JewelleryBox />} />
            <Route path="/sizer" element={<RingSizer />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/wishlist" element={<Wishlist />} />
          </Routes>
        </main>
        <Navigation />
      </div>
    </BrowserRouter>
  );
}
