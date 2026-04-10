import { useState } from 'react';
import { Info } from 'lucide-react';
import { PageShell } from '@/components/shell/PageShell';

export default function RingSizer() {
  const [diameter, setDiameter] = useState(16.5);

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
    <PageShell
      kicker="Fit"
      title="Ring Sizer"
      subtitle="Find your perfect fit using an existing ring."
      className="animate-in fade-in duration-500"
    >
      <div className="flex flex-col gap-8">
        <div className="vela-card-surface space-y-6 p-6 text-center">
          <p className="vela-type-body text-vela-light/80">
            Place a ring that fits you well on the screen. Adjust the slider until the circle exactly matches the{' '}
            <strong className="font-medium text-vela-light">inside</strong> of your ring.
          </p>

          <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-xl border border-vela-gray/40 bg-vela-black">
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <div className="h-full w-px bg-vela-gold" />
              <div className="absolute h-px w-full bg-vela-gold" />
            </div>

            <div
              className="rounded-full border-2 border-vela-gold shadow-[0_0_15px_rgba(251,222,147,0.3)] transition-all duration-75"
              style={{
                width: `${diameter * 4}px`,
                height: `${diameter * 4}px`
              }}
            />

            <div className="vela-type-ui-title absolute bottom-4 tabular-nums text-vela-gold">
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
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-vela-gray accent-vela-gold"
            />
            <div className="vela-type-micro flex justify-between">
              <span>Smaller</span>
              <span>Larger</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="vela-card-surface p-4 text-center">
            <p className="vela-field-label">US</p>
            <p className="text-2xl font-serif text-vela-gold">{sizes.us}</p>
          </div>
          <div className="vela-card-surface p-4 text-center">
            <p className="vela-field-label">UK</p>
            <p className="text-2xl font-serif text-vela-gold">{sizes.uk}</p>
          </div>
          <div className="vela-card-surface p-4 text-center">
            <p className="vela-field-label">EU</p>
            <p className="text-2xl font-serif text-vela-gold">{sizes.eu}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-vela-gold/25 bg-vela-gold/10 p-4 text-vela-gold">
          <Info size={20} strokeWidth={1.25} className="mt-0.5 shrink-0" />
          <p className="vela-type-body text-vela-gold">
            This is an estimation tool. For bespoke orders, we send a physical sizing kit to guarantee the perfect fit before crafting begins.
          </p>
        </div>

        <button type="button" className="vela-btn-primary w-full">
          Save size to profile
        </button>
      </div>
    </PageShell>
  );
}
