import { Link } from 'react-router-dom';
import { Settings, ChevronRight, Box, Ruler, Heart } from 'lucide-react';
import { PageShell } from '@/components/shell/PageShell';

export default function Profile() {
  return (
    <PageShell
      kicker="Account"
      title="Profile"
      subtitle="Your Vela relationship, tools, and concierge access."
      right={
        <button type="button" className="vela-icon-btn" aria-label="Settings">
          <Settings size={20} strokeWidth={1.25} />
        </button>
      }
    >
      <div className="mb-10 flex items-center gap-4">
        <div className="vela-type-card-hero flex h-16 w-16 items-center justify-center rounded-full border border-vela-gold/30 bg-vela-dark text-vela-gold">
          E
        </div>
        <div>
          <h2 className="vela-type-section text-vela-light">Eleanor Vance</h2>
          <p className="vela-type-caption mt-0.5">eleanor.v@example.com</p>
        </div>
      </div>

      <div className="vela-stack">
        <Link to="/jewellery-box" className="vela-card-surface flex items-center justify-between p-4 transition-colors hover:border-vela-gold/40 group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-vela-black flex items-center justify-center">
              <Box className="text-vela-gold" size={18} />
            </div>
            <div>
              <h3 className="vela-type-ui-title">Digital Jewellery Box</h3>
              <p className="vela-type-caption mt-0.5">2 pieces saved</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-vela-light/30 group-hover:text-vela-gold transition-colors" />
        </Link>

        <Link to="/sizer" className="vela-card-surface flex items-center justify-between p-4 transition-colors hover:border-vela-gold/40 group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-vela-black flex items-center justify-center">
              <Ruler className="text-vela-gold" size={18} />
            </div>
            <div>
              <h3 className="vela-type-ui-title">Ring Sizer Tool</h3>
              <p className="vela-type-caption mt-0.5">Size: US 6.5</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-vela-light/30 group-hover:text-vela-gold transition-colors" />
        </Link>

        <Link
          to="/wishlist"
          className="vela-card-surface flex w-full items-center justify-between p-4 transition-colors hover:border-vela-gold/40 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-vela-black flex items-center justify-center">
              <Heart className="text-vela-gold" size={18} />
            </div>
            <div>
              <h3 className="vela-type-ui-title">Wishlist</h3>
              <p className="vela-type-caption mt-0.5">4 items saved</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-vela-light/30 group-hover:text-vela-gold transition-colors" />
        </Link>
      </div>

      <div className="mt-12 border-t border-vela-gray/20 pt-6">
        <button type="button" className="vela-type-body w-full p-4 text-left text-vela-light/70 transition-colors hover:text-vela-light">
          Contact Concierge
        </button>
        <button type="button" className="vela-type-body w-full p-4 text-left text-vela-light/70 transition-colors hover:text-vela-light">
          FAQ & Care Guide
        </button>
        <button type="button" className="w-full p-4 text-left text-sm text-red-400/80 transition-colors hover:text-red-400">
          Sign Out
        </button>
      </div>
    </PageShell>
  );
}
