import { Link } from 'react-router-dom';
import { Heart, ChevronLeft } from 'lucide-react';

export default function Wishlist() {
  return (
    <div className="h-full min-h-0 overflow-y-auto p-6 pt-8 pb-24">
      <Link
        to="/profile"
        className="mb-6 inline-flex items-center gap-2 text-sm text-vela-light/60 transition-colors hover:text-vela-gold"
      >
        <ChevronLeft size={18} />
        Back to profile
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-vela-gold/40 bg-vela-dark">
          <Heart className="text-vela-gold" size={22} strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-serif text-2xl">Wishlist</h1>
          <p className="mt-1 text-xs text-vela-light/50">Pieces you have saved</p>
        </div>
      </div>

      <div className="rounded-xl border border-vela-gray/30 bg-vela-dark p-8 text-center">
        <p className="text-sm text-vela-light/60">No wishlist items yet.</p>
        <p className="mt-2 text-xs text-vela-light/40">Browse the atelier and tap the heart on pieces you love.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg border border-vela-gold/40 px-5 py-2.5 text-xs uppercase tracking-widest text-vela-gold transition-colors hover:bg-vela-gold/10"
        >
          Explore home
        </Link>
      </div>
    </div>
  );
}
