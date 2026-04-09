import { FileText, Bell, Share } from 'lucide-react';

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
    <div className="p-6 space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h2 className="text-2xl font-serif text-vela-gold">Digital Jewellery Box</h2>
          <p className="text-sm text-vela-light/70 font-light">
            Your personal vault of Vela pieces.
          </p>
        </div>
        <button className="text-vela-gold hover:text-vela-gold-muted p-2">
          <Share size={20} />
        </button>
      </div>

      <div className="grid gap-6">
        {pieces.map(piece => (
          <div key={piece.id} className="bg-vela-dark border border-vela-gray/30 rounded-xl overflow-hidden group">
            <div className="aspect-video relative overflow-hidden">
              <img 
                src={piece.image} 
                alt={piece.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-vela-black/80 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="font-serif text-xl">{piece.name}</h3>
                <p className="text-xs text-vela-gold font-mono">{piece.type}</p>
              </div>
            </div>
            
            <div className="p-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-vela-light/50 text-xs mb-1">Metal</p>
                <p>{piece.metal}</p>
              </div>
              <div>
                <p className="text-vela-light/50 text-xs mb-1">Acquired</p>
                <p>{piece.date}</p>
              </div>
            </div>
            
            <div className="border-t border-vela-gray/30 p-4 flex gap-2">
              {piece.hasCert && (
                <button className="flex-1 flex items-center justify-center gap-2 bg-vela-black border border-vela-gray/50 py-2 rounded-lg text-xs hover:border-vela-gold/50 transition-colors">
                  <FileText size={14} /> Certificate
                </button>
              )}
              <button className="flex-1 flex items-center justify-center gap-2 bg-vela-black border border-vela-gray/50 py-2 rounded-lg text-xs hover:border-vela-gold/50 transition-colors">
                <Bell size={14} /> Care Reminder
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
