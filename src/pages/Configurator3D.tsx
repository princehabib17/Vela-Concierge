import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import RingStage from '@/components/RingStage';
import type { Mode } from '@/lib/ringTypes';
import {
  BANDS,
  CARATS,
  CUTS,
  DEFAULT_CONFIG,
  GEMS,
  METALS,
  SETTINGS,
  SIZES,
  estimate,
  label,
  type RingConfig,
} from '@/lib/ringConfig';

const STAGE = '#ececec';

const TABS = [
  { id: 'shape', label: 'Shape', title: 'Choose your shape' },
  { id: 'setting', label: 'Setting', title: 'Choose your setting' },
  { id: 'band', label: 'Band', title: 'Choose your band' },
  { id: 'metal', label: 'Metal', title: 'Choose your metal' },
  { id: 'stone', label: 'Stone', title: 'Choose your stone' },
  { id: 'finish', label: 'Finish', title: 'Size & engraving' },
] as const;

const VIEWS: Array<{ id: Mode; label: string }> = [
  { id: 'sway', label: 'Showcase' },
  { id: 'side', label: 'Profile' },
  { id: 'spin', label: 'Spin' },
];

const money = (n: number) => `$${Math.round(n).toLocaleString('en-CA')}`;

function Chips<T extends string | number>({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: ReadonlyArray<{ id: T; label: string; note?: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-3">
      {options.map((o) => (
        <button
          key={String(o.id)}
          type="button"
          role="radio"
          aria-checked={o.id === value}
          onClick={() => onChange(o.id)}
          className={cn('lux-chip gap-2', o.id === value ? 'lux-chip-active' : 'lux-chip-inactive')}
        >
          <span>{o.label}</span>
          {o.note && <span className="text-[9px] font-normal opacity-60">{o.note}</span>}
        </button>
      ))}
    </div>
  );
}

export default function Configurator3D() {
  const [config, setConfig] = useState<RingConfig>(DEFAULT_CONFIG);
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('shape');
  const [mode, setMode] = useState<Mode>('sway');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const set = <K extends keyof RingConfig>(k: K, v: RingConfig[K]) => setConfig((c) => ({ ...c, [k]: v }));

  const quote = useMemo(() => estimate(config), [config]);
  const step = TABS.findIndex((t) => t.id === tab);
  const current = TABS[step];

  const description =
    tab === 'shape'
      ? CUTS.find((o) => o.id === config.cut)?.detail
      : tab === 'setting'
        ? SETTINGS.find((o) => o.id === config.setting)?.detail
        : tab === 'band'
          ? BANDS.find((o) => o.id === config.band)?.detail
          : undefined;

  const summary = `${config.carat} carat ${label(CUTS, config.cut).toLowerCase()} ${label(GEMS, config.gem).toLowerCase()} ring, ${label(SETTINGS, config.setting).toLowerCase()} setting, ${label(BANDS, config.band).toLowerCase()} band, ${label(METALS, config.metal)}`;

  const save = () => {
    setSaving(true);
    setSaved('');
    window.localStorage.setItem(
      'vela-ring-brief',
      JSON.stringify({ ...config, estimatedPrice: quote.total, currency: 'CAD', savedAt: new Date().toISOString() }),
    );
    timers.current.push(
      window.setTimeout(() => {
        setSaving(false);
        setSaved('Saved to your brief');
        timers.current.push(window.setTimeout(() => setSaved(''), 2000));
      }, 450),
    );
  };

  const next = () => (step < TABS.length - 1 ? setTab(TABS[step + 1].id) : save());
  const back = () => step > 0 && setTab(TABS[step - 1].id);

  return (
    <div className="lux-bg lux-text flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
      <header className="shrink-0 border-b border-[var(--lux-border)] px-5 pb-5 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <Link
          to="/"
          className="lux-ui mb-4 inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[#707070] transition-colors hover:text-[#121212]"
        >
          <ChevronLeft size={16} strokeWidth={1.5} aria-hidden />
          Atelier
        </Link>

        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="lux-kicker">Vela bespoke studio</p>
            <h1 className="lux-page-title mt-1">Design your ring</h1>
            <p className="lux-ui mt-2 max-w-[17rem] text-xs leading-relaxed tracking-[0.02em] text-[#707070]">
              Every choice is rendered live. Drag the ring to turn it.
            </p>
          </div>
          <motion.div key={quote.total} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="shrink-0 text-right">
            <p className="lux-ui text-[9px] font-medium uppercase tracking-[0.2em] text-[#707070]">Estimate · CAD</p>
            <p className="lux-display mt-1 text-xl tabular-nums tracking-tight">{money(quote.total)}</p>
          </motion.div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="lux-ui text-[10px] font-medium uppercase tracking-[0.2em] text-[#707070]">
              Step {step + 1} of {TABS.length}
            </p>
            <p className="lux-display text-sm">{current.label}</p>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#e4e4e4]">
            <div
              className="h-full rounded-full bg-[#121212] transition-[width] duration-500 ease-out"
              style={{ width: `${((step + 1) / TABS.length) * 100}%` }}
              role="progressbar"
              aria-valuenow={step + 1}
              aria-valuemin={1}
              aria-valuemax={TABS.length}
            />
          </div>
          <nav className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-0.5" aria-label="Customization steps">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'lux-ui min-h-10 shrink-0 rounded-full border px-4 text-[9px] font-medium uppercase tracking-[0.16em] transition-colors',
                  tab === t.id
                    ? 'border-[#121212] bg-[#121212] text-[#f5f5f5]'
                    : 'border-[var(--lux-border)] bg-white text-[#121212] hover:border-[#b0b0b0]',
                )}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* The render */}
      <section
        className="sticky top-0 z-10 h-[min(50vh,26rem)] shrink-0 overflow-hidden border-b border-[var(--lux-border)]"
        style={{ background: `radial-gradient(120% 90% at 50% 38%, #f6f6f6 0%, ${STAGE} 62%, #e4e4e4 100%)` }}
      >
        <RingStage
          geometry={{ cut: config.cut, setting: config.setting, band: config.band }}
          materials={{ metal: config.metal, gem: config.gem }}
          carat={config.carat}
          mode={mode}
          label={summary}
        />
        <div
          className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-full border border-black/10 bg-white/85 p-1 shadow-[var(--lux-shadow-soft)] backdrop-blur-md"
          role="group"
          aria-label="Viewing mode"
        >
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setMode(v.id)}
              className={cn(
                'lux-ui min-h-9 rounded-full px-4 text-[9px] font-medium uppercase tracking-[0.14em] transition-colors',
                mode === v.id ? 'bg-[#121212] text-white' : 'text-[#121212] hover:bg-[#f0f0f0]',
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </section>

      {/* Options */}
      <div className="shrink-0 bg-[var(--lux-bg)] px-5 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] pt-6">
        <p className="lux-kicker">Current step</p>
        <h2 className="lux-display mb-5 mt-1 text-lg">{current.title}</h2>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 space-y-5"
          >
            {tab === 'shape' && <Chips name="Shape" options={CUTS} value={config.cut} onChange={(v) => set('cut', v)} />}
            {tab === 'setting' && (
              <Chips name="Setting" options={SETTINGS} value={config.setting} onChange={(v) => set('setting', v)} />
            )}
            {tab === 'band' && <Chips name="Band" options={BANDS} value={config.band} onChange={(v) => set('band', v)} />}
            {tab === 'metal' && (
              <Chips
                name="Metal"
                options={METALS.map((m) => ({ ...m, note: m.id === 'platinum' ? '+$900' : undefined }))}
                value={config.metal}
                onChange={(v) => set('metal', v)}
              />
            )}

            {tab === 'stone' && (
              <>
                <div>
                  <p className="lux-kicker mb-3">Gemstone</p>
                  <Chips name="Gemstone" options={GEMS} value={config.gem} onChange={(v) => set('gem', v)} />
                </div>
                {config.gem === 'diamond' && (
                  <div>
                    <p className="lux-kicker mb-3">Origin</p>
                    <Chips
                      name="Diamond origin"
                      options={[
                        { id: 'lab', label: 'Lab-grown', note: 'IGI certified' },
                        { id: 'mined', label: 'Mined', note: 'IGI certified' },
                      ]}
                      value={config.source}
                      onChange={(v) => set('source', v)}
                    />
                  </div>
                )}
                <div>
                  <p className="lux-kicker mb-3">Carat weight</p>
                  <Chips
                    name="Carat weight"
                    options={CARATS.map((c) => ({ id: c, label: `${c} ct` }))}
                    value={config.carat}
                    onChange={(v) => set('carat', v)}
                  />
                  <p className="lux-ui mt-3 text-[11px] leading-relaxed text-[#707070]">
                    The render shows true proportions for a classic solitaire; carat weight sets the stone you receive.
                  </p>
                </div>
              </>
            )}

            {tab === 'finish' && (
              <>
                <div>
                  <p className="lux-kicker mb-3">Ring size (US)</p>
                  <Chips
                    name="Ring size"
                    options={SIZES.map((s) => ({ id: s, label: String(s) }))}
                    value={config.size}
                    onChange={(v) => set('size', v)}
                  />
                </div>
                <div>
                  <p className="lux-kicker mb-3">Engraving</p>
                  <label htmlFor="engrave" className="sr-only">
                    Engraving text
                  </label>
                  <input
                    id="engrave"
                    type="text"
                    maxLength={20}
                    value={config.engraving}
                    onChange={(e) => set('engraving', e.target.value)}
                    placeholder="Forever yours"
                    className="lux-ui h-12 w-full rounded-2xl border border-[var(--lux-border)] bg-white px-4 text-sm tracking-[0.02em] placeholder:text-[#a8a8a8] focus:border-[#121212] focus:outline-none focus:ring-2 focus:ring-[#121212]/15"
                  />
                  <p className="lux-ui mt-2 text-right text-[10px] tabular-nums text-[#707070]">
                    {config.engraving.length} / 20 · engraved inside the band
                  </p>
                </div>
                <dl className="lux-ui divide-y divide-[var(--lux-border)] rounded-2xl border border-[var(--lux-border)] bg-white text-[12px]">
                  {quote.lines.map(([name, value]) => (
                    <div key={name} className="flex items-baseline justify-between gap-4 px-4 py-3">
                      <dt className="text-[#555]">{name}</dt>
                      <dd className="tabular-nums">{money(value)}</dd>
                    </div>
                  ))}
                  <div className="flex items-baseline justify-between gap-4 px-4 py-3 font-medium">
                    <dt>Estimate</dt>
                    <dd className="tabular-nums">{money(quote.total)} CAD</dd>
                  </div>
                </dl>
                <p className="lux-ui text-[11px] leading-relaxed text-[#707070]">
                  An estimate only. Your Vela concierge confirms the final design and quote.
                </p>
              </>
            )}

            {description && <p className="lux-display text-[15px] italic text-[#707070]">{description}</p>}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={back}
              className="lux-ui flex min-h-12 min-w-[5.5rem] shrink-0 items-center justify-center rounded-full border border-[var(--lux-border)] bg-white text-[10px] font-medium uppercase tracking-[0.18em] transition-colors hover:border-[#121212]"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={next}
            disabled={saving}
            className={cn(
              'lux-ui flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#121212] text-[10px] font-medium uppercase tracking-[0.2em] text-[#f5f5f5] transition-opacity disabled:opacity-55',
              step > 0 ? 'min-w-0 flex-1' : 'w-full',
            )}
          >
            {saving ? (
              'Saving…'
            ) : step < TABS.length - 1 ? (
              <>
                <span>Continue</span>
                <ChevronRight size={16} strokeWidth={1.5} aria-hidden />
              </>
            ) : (
              <span>{saved || 'Save to brief'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
