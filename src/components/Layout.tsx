import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <div className="min-h-screen bg-vela-black text-vela-light flex justify-center">
      <div className="w-full max-w-md bg-vela-black min-h-screen relative shadow-2xl overflow-hidden pb-24">
        <Outlet />
        <BottomNav />
      </div>
    </div>
  );
}
