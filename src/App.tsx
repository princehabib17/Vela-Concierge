import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Sparkles, Box, Camera, Map, Ruler, Diamond, User } from 'lucide-react';
import gsap from 'gsap';
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
  const [gone, setGone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const diamondRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete() {
          // exit: blur + fade the whole screen out
          gsap.to(rootRef.current, {
            opacity: 0,
            filter: 'blur(8px)',
            duration: 0.9,
            ease: 'power2.inOut',
            delay: 0.6,
            onComplete: () => setGone(true),
          });
        },
      });

      // 1. Diamond materialises
      tl.fromTo(
        diamondRef.current,
        { scale: 0.5, opacity: 0, filter: 'blur(16px)', rotate: -15 },
        { scale: 1, opacity: 1, filter: 'blur(0px)', rotate: 0, duration: 1.1, ease: 'expo.out' },
      );

      // 2. "VELA" letters stagger in
      tl.fromTo(
        '.splash-letter',
        { y: 24, opacity: 0, filter: 'blur(8px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.7, stagger: 0.09, ease: 'power3.out' },
        '-=0.55',
      );

      // 3. Subtitle rises
      tl.fromTo(
        subtitleRef.current,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' },
        '-=0.3',
      );

      // 4. Diamond subtle pulse while holding
      tl.to(diamondRef.current, {
        scale: 1.06,
        duration: 0.9,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: 1,
      }, '+=0.2');
    }, rootRef);

    return () => ctx.revert();
  }, []);

  if (gone) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-vela-black pointer-events-none"
    >
      <div className="flex flex-col items-center">
        <div ref={diamondRef} className="mb-8">
          <Diamond className="text-vela-gold drop-shadow-[0_0_18px_rgba(251,222,147,0.4)]" size={48} strokeWidth={1} />
        </div>
        <h1 className="mb-4 flex font-serif text-5xl uppercase tracking-[0.28em] text-vela-gold">
          {'VELA'.split('').map((ch, i) => (
            <span key={i} className="splash-letter inline-block">{ch}</span>
          ))}
        </h1>
        <p ref={subtitleRef} className="text-xs font-light uppercase tracking-[0.4em] text-vela-light/60">
          Bespoke Jewellers
        </p>
      </div>
    </div>
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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-vela-gray/20 bg-vela-black/95 backdrop-blur-xl"
      style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-md items-end justify-between px-2 pt-2.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={cn(
                'flex min-w-[3.25rem] flex-col items-center gap-1 rounded-lg px-1.5 pb-1.5 pt-1 transition-colors',
                isActive
                  ? 'text-vela-gold'
                  : 'text-vela-light/45 hover:text-vela-light/85'
              )}
            >
              <span
                className={cn(
                  'h-0.5 w-5 rounded-full transition-colors',
                  isActive ? 'bg-vela-gold/90' : 'bg-transparent'
                )}
                aria-hidden
              />
              <Icon size={22} strokeWidth={isActive ? 1.35 : 1} className="shrink-0" />
              <span className={cn('vela-type-micro', isActive ? 'text-vela-gold/90' : '')}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 flex shrink-0 items-center justify-between border-b border-vela-gray/20 bg-vela-black/88 px-6 py-3.5 backdrop-blur-md supports-[backdrop-filter]:bg-vela-black/78">
      <Link to="/" className="group flex min-w-0 items-center gap-2.5">
        <Diamond className="size-[18px] shrink-0 text-vela-gold" strokeWidth={1.25} aria-hidden />
        <span className="vela-wordmark transition-colors group-hover:text-vela-gold">
          Vela
        </span>
      </Link>
      <div className="flex items-center gap-1 sm:gap-2">
        <Link
          to="/jewellery-box"
          className="vela-icon-btn"
          aria-label="Digital jewellery box"
        >
          <Box size={20} strokeWidth={1.35} />
        </Link>
        <Link to="/sizer" className="vela-icon-btn" aria-label="Ring sizer">
          <Ruler size={20} strokeWidth={1.35} />
        </Link>
        <Link to="/profile" className="vela-icon-btn" aria-label="Profile">
          <User size={20} strokeWidth={1.35} />
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
        <main className="relative mx-auto flex h-full min-h-0 w-full max-w-md flex-1 flex-col overflow-hidden">
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
