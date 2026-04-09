import { Link } from 'react-router-dom';
import { Settings, ChevronRight, Box, Ruler, Heart } from 'lucide-react';

export default function Profile() {
  return (
    <div className="p-6 pt-12 h-full overflow-y-auto pb-24">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-serif">Profile</h1>
        <button className="p-2 hover:bg-vela-dark rounded-full transition-colors">
          <Settings size={20} className="text-vela-light/70" />
        </button>
      </header>

      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 rounded-full bg-vela-dark border border-vela-gold/30 flex items-center justify-center text-xl font-serif text-vela-gold">
          E
        </div>
        <div>
          <h2 className="text-lg font-medium">Eleanor Vance</h2>
          <p className="text-sm text-vela-light/50">eleanor.v@example.com</p>
        </div>
      </div>

      <div className="space-y-4">
        <Link to="/jewellery-box" className="bg-vela-dark p-4 rounded-lg border border-vela-gray/30 flex items-center justify-between hover:border-vela-gold/50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-vela-black flex items-center justify-center">
              <Box className="text-vela-gold" size={18} />
            </div>
            <div>
              <h3 className="text-sm font-medium">Digital Jewellery Box</h3>
              <p className="text-xs text-vela-light/50 mt-0.5">2 pieces saved</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-vela-light/30 group-hover:text-vela-gold transition-colors" />
        </Link>

        <Link to="/ring-sizer" className="bg-vela-dark p-4 rounded-lg border border-vela-gray/30 flex items-center justify-between hover:border-vela-gold/50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-vela-black flex items-center justify-center">
              <Ruler className="text-vela-gold" size={18} />
            </div>
            <div>
              <h3 className="text-sm font-medium">Ring Sizer Tool</h3>
              <p className="text-xs text-vela-light/50 mt-0.5">Size: US 6.5</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-vela-light/30 group-hover:text-vela-gold transition-colors" />
        </Link>

        <Link to="/wishlist" className="bg-vela-dark p-4 rounded-lg border border-vela-gray/30 flex items-center justify-between hover:border-vela-gold/50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-vela-black flex items-center justify-center">
              <Heart className="text-vela-gold" size={18} />
            </div>
            <div>
              <h3 className="text-sm font-medium">Wishlist</h3>
              <p className="text-xs text-vela-light/50 mt-0.5">4 items saved</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-vela-light/30 group-hover:text-vela-gold transition-colors" />
        </Link>
      </div>

      <div className="mt-12 pt-6 border-t border-vela-gray/30">
        <button className="w-full text-left p-4 text-sm text-vela-light/70 hover:text-vela-light transition-colors">
          Contact Concierge
        </button>
        <button className="w-full text-left p-4 text-sm text-vela-light/70 hover:text-vela-light transition-colors">
          FAQ & Care Guide
        </button>
        <button className="w-full text-left p-4 text-sm text-red-400/80 hover:text-red-400 transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  );
}
