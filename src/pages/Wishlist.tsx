import { Link } from 'react-router-dom';
import { Heart, ChevronLeft } from 'lucide-react';
import { PageShell } from '@/components/shell/PageShell';

export default function Wishlist() {
  return (
    <PageShell
      kicker="Saved"
      title="Wishlist"
      subtitle="Pieces you have set aside for a later decision."
      beforeHeader={
        <Link
          to="/profile"
          className="vela-type-body mb-2 inline-flex items-center gap-2 text-cloud/55 transition-colors hover:text-clay"
        >
          <ChevronLeft size={18} strokeWidth={1.25} />
          Back to profile
        </Link>
      }
    >
      <div className="vela-card-surface p-8 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-clay/35 bg-midnight">
          <Heart className="text-clay" size={22} strokeWidth={1.35} />
        </div>
        <p className="vela-type-body text-cloud/65">No wishlist items yet.</p>
        <p className="vela-type-caption mt-2 text-cloud/45">Browse the atelier and save pieces you love.</p>
        <Link
          to="/"
          className="vela-kicker-text mt-8 inline-block rounded-xl border border-clay/40 px-6 py-3 transition-colors hover:bg-clay/10"
        >
          Explore home
        </Link>
      </div>
    </PageShell>
  );
}
