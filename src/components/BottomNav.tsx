import { Link, useLocation } from 'react-router-dom';
import { Home, Sparkles, Map, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const location = useLocation();
  
  const tabs = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Design', path: '/design', icon: Sparkles },
    { name: 'Journey', path: '/journey', icon: Map },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-vela-dark/90 backdrop-blur-md border-t border-vela-gray/50 pb-safe pt-2 px-6 z-50">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path));
          const Icon = tab.icon;
          
          return (
            <Link 
              key={tab.name} 
              to={tab.path}
              className="flex flex-col items-center gap-1 p-2"
            >
              <Icon 
                size={22} 
                strokeWidth={1.5}
                className={cn(
                  "transition-colors duration-300",
                  isActive ? "text-vela-gold" : "text-vela-light/50"
                )} 
              />
              <span className={cn(
                "text-[10px] uppercase tracking-wider transition-colors duration-300",
                isActive ? "text-vela-gold" : "text-vela-light/50"
              )}>
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
