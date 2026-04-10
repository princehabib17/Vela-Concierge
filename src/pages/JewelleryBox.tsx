import { FileText, Bell, Share } from 'lucide-react';
import { PageShell } from '@/components/shell/PageShell';

export default function JewelleryBox() {
  const pieces = [
    {
      id: 1,
      name: "The Heirloom Sapphire",
      type: "Custom Ring",
      metal: "Platinum",
      date: "Oct 2025",
      image: "https://images.unsplash.com/photo-1605100804763-247f66156ce4?auto=format&fit=crop&w=400&q=80",
      hasCert: true
    },
    {
      id: 2,
      name: "Pavé Diamond Band",
      type: "Wedding Band",
      metal: "18k Yellow Gold",
      date: "Jun 2024",
      image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=400&q=80",
      hasCert: false
    }
  ];

  return (
    <PageShell
      kicker="Collection"
      title="Digital Jewellery Box"
      subtitle="Certificates, care, and the story of each Vela piece—yours alone."
      right={
        <button type="button" className="vela-icon-btn text-vela-gold hover:text-vela-gold-muted" aria-label="Share collection">
          <Share size={20} strokeWidth={1.25} />
        </button>
      }
      className="animate-in fade-in duration-500"
    >
      <div className="grid gap-6">
        {pieces.map((piece) => (
          <div key={piece.id} className="vela-card-surface overflow-hidden group">
            <div className="relative aspect-video overflow-hidden">
              <img
                src={piece.image}
                alt={piece.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-vela-black/85 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="vela-type-card-hero">{piece.name}</h3>
                <p className="vela-kicker-text mt-1">{piece.type}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4">
              <div>
                <p className="vela-field-label">Metal</p>
                <p className="vela-type-body text-vela-light/90">{piece.metal}</p>
              </div>
              <div>
                <p className="vela-field-label">Acquired</p>
                <p className="vela-type-body text-vela-light/90">{piece.date}</p>
              </div>
            </div>

            <div className="flex gap-2 border-t border-vela-gray/20 p-4">
              {piece.hasCert && (
                <button
                  type="button"
                  className="vela-type-caption flex flex-1 items-center justify-center gap-2 rounded-lg border border-vela-gray/35 bg-vela-black py-2.5 text-vela-light/85 transition-colors hover:border-vela-gold/45"
                >
                  <FileText size={14} strokeWidth={1.25} /> Certificate
                </button>
              )}
              <button
                type="button"
                className="vela-type-caption flex flex-1 items-center justify-center gap-2 rounded-lg border border-vela-gray/35 bg-vela-black py-2.5 text-vela-light/85 transition-colors hover:border-vela-gold/45"
              >
                <Bell size={14} strokeWidth={1.25} /> Care Reminder
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
