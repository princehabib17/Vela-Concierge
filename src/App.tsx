import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Sparkles, Box, Camera, Map, Ruler, User } from 'lucide-react';
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

/**
 * Opening card: the master logo revealed left to right, then the star submark and the
 * brand line, as on the style sheet. Reduced motion shows it still, briefly.
 */
function SplashScreen() {
  const [gone, setGone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const starRef = useRef<HTMLSpanElement>(null);
  const tagRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      const exit = () =>
        gsap.to(rootRef.current, {
          opacity: 0,
          duration: still ? 0.3 : 0.9,
          ease: 'power2.inOut',
          delay: still ? 0.9 : 0.5,
          onComplete: () => setGone(true),
        });
      if (still) {
        exit();
        return;
      }
      const tl = gsap.timeline({ onComplete: exit });
      // 1. The master logo is revealed left to right, like light passing across polished metal.
      tl.fromTo(
        logoRef.current,
        { clipPath: 'inset(0 100% 0 0)', opacity: 0.2 },
        { clipPath: 'inset(0 0% 0 0)', opacity: 1, duration: 1.4, ease: 'power3.inOut' },
      );
      // 2. The star turns in, then the brand line settles beneath it.
      tl.fromTo(starRef.current, { opacity: 0, rotate: -45, scale: 0.6 }, { opacity: 1, rotate: 0, scale: 1, duration: 0.9, ease: 'expo.out' }, '-=0.3');
      tl.fromTo(tagRef.current, { opacity: 0, letterSpacing: '0.6em' }, { opacity: 1, letterSpacing: '0.42em', duration: 1, ease: 'power2.out' }, '-=0.6');
    }, rootRef);

    return () => ctx.revert();
  }, []);

  if (gone) return null;

  return (
    <div ref={rootRef} aria-hidden className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center bg-midnight">
      <img ref={logoRef} src="/brand/vela-logo-white.png" alt="" width={1909} height={597} className="h-auto w-[min(64vw,300px)]" />
      <span ref={starRef} className="vela-mark vela-mark-star mt-12 w-5 text-clay" />
      <p ref={tagRef} className="mt-4 text-[10px] font-normal uppercase tracking-[0.42em] text-stone-40">
        Attainable luxury
      </p>
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
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone/30 bg-midnight/95 backdrop-blur-xl"
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
                  ? 'text-cloud'
                  : 'text-stone-60 hover:text-cloud/85'
              )}
            >
              <span
                className={cn(
                  'h-0.5 w-5 rounded-full transition-colors',
                  isActive ? 'bg-cloud' : 'bg-transparent'
                )}
                aria-hidden
              />
              <Icon size={22} strokeWidth={isActive ? 1.35 : 1} className="shrink-0" />
              <span className={cn('vela-type-micro', isActive ? 'text-cloud' : 'text-stone-60')}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 flex shrink-0 items-center justify-between border-b border-stone/30 bg-midnight/90 px-6 py-4 backdrop-blur-md supports-[backdrop-filter]:bg-midnight/80">
      <Link to="/" aria-label="Vela Jewellers, home" className="flex min-w-0 items-center opacity-95 transition-opacity hover:opacity-100">
        <img src="/brand/vela-wordmark-white.png" alt="Vela Jewellers" width={1909} height={470} className="h-[19px] w-auto" />
      </Link>
      <div className="flex items-center gap-1 sm:gap-2">
        <Link to="/jewellery-box" className="vela-icon-btn" aria-label="Digital jewellery box">
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

/** Most pages are a phone-width column; the 3D studio gets the whole window. */
function Main() {
  const wide = useLocation().pathname === '/design/3d';
  return (
    <main
      className={`relative mx-auto flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden ${wide ? 'max-w-none' : 'max-w-md'}`}
    >
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
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SplashScreen />
      <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-midnight text-cloud font-sans">
        <Header />
        <Main />
        <Navigation />
      </div>
    </BrowserRouter>
  );
}
