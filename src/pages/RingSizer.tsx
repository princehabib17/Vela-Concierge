import { useState } from 'react';
import { Ruler, Info } from 'lucide-react';

export default function RingSizer() {
  const [diameter, setDiameter] = useState(16.5); // mm

  // Simple conversion logic for prototype
  const getSizes = (d: number) => {
    const us = (d - 11.6) / 0.8;
    return {
      us: Math.max(1, Math.min(15, us)).toFixed(1),
      uk: String.fromCharCode(65 + Math.max(0, Math.min(25, Math.floor((d - 11.9) / 0.4)))),
      eu: Math.round(d * Math.PI).toString()
    };
  };

  const sizes = getSizes(diameter);

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="space-y-2">
        <h2 className="text-2xl font-serif text-vela-gold">Ring Sizer</h2>
        <p className="text-sm text-vela-light/70 font-light">
          Find your perfect fit using an existing ring.
        </p>
      </div>

      <div className="bg-vela-dark border border-vela-gray/30 rounded-xl p-6 text-center space-y-6">
        <p className="text-sm text-vela-light/80">
          Place a ring that fits you well on the screen. Adjust the slider until the circle exactly matches the <strong>inside</strong> of your ring.
        </p>

        <div className="relative h-64 flex items-center justify-center bg-vela-black rounded-xl border border-vela-gray/50 overflow-hidden">
          {/* Reference lines */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="w-full h-px bg-vela-gold" />
            <div className="h-full w-px bg-vela-gold" />
          </div>
          
          {/* The sizing circle */}
          <div 
            className="rounded-full border-2 border-vela-gold shadow-[0_0_15px_rgba(251,222,147,0.3)] transition-all duration-75"
            style={{ 
              width: `${diameter * 4}px`, // Scale factor for visual representation
              height: `${diameter * 4}px` 
            }}
          />
          
          <div className="absolute bottom-4 font-mono text-vela-gold text-sm">
            {diameter.toFixed(1)} mm
          </div>
        </div>

        <div className="space-y-4">
          <input 
            type="range" 
            min="14" 
            max="22" 
            step="0.1" 
            value={diameter}
            onChange={(e) => setDiameter(parseFloat(e.target.value))}
            className="w-full accent-vela-gold"
          />
          <div className="flex justify-between text-xs text-vela-light/50 font-mono">
            <span>Smaller</span>
            <span>Larger</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-vela-dark border border-vela-gray/30 rounded-xl p-4 text-center">
          <p className="text-xs text-vela-light/50 mb-1">US Size</p>
          <p className="text-2xl font-serif text-vela-gold">{sizes.us}</p>
        </div>
        <div className="bg-vela-dark border border-vela-gray/30 rounded-xl p-4 text-center">
          <p className="text-xs text-vela-light/50 mb-1">UK Size</p>
          <p className="text-2xl font-serif text-vela-gold">{sizes.uk}</p>
        </div>
        <div className="bg-vela-dark border border-vela-gray/30 rounded-xl p-4 text-center">
          <p className="text-xs text-vela-light/50 mb-1">EU Size</p>
          <p className="text-2xl font-serif text-vela-gold">{sizes.eu}</p>
        </div>
      </div>

      <div className="flex items-start gap-3 bg-vela-gold/10 border border-vela-gold/30 p-4 rounded-xl text-sm text-vela-gold">
        <Info size={20} className="shrink-0 mt-0.5" />
        <p>
          This is an estimation tool. For bespoke orders, we will send you a physical sizing kit to guarantee the perfect fit before crafting begins.
        </p>
      </div>

      <button className="w-full bg-vela-gold text-vela-black font-medium py-4 rounded-xl hover:bg-vela-gold-muted transition-colors">
        Save Size to Profile
      </button>
    </div>
  );
}
