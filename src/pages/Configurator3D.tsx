import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, ChevronLeft, Link2, Minus, Plus, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import RingStage, { type Insets } from '@/components/RingStage';
import type { Cut, Mode } from '@/lib/ringTypes';
import {
  BANDS,
  CARATS,
  CUTS,
  FINISHES,
  GEMS,
  METALS,
  SETTINGS,
  SIZES,
  decodeDesign,
  encodeDesign,
  estimate,
  label,
  type RingConfig,
  type StepId,
} from '@/lib/ringConfig';

/** The studio sweep in brand colours: Cloud at the centre, Clay towards the edges, Stone 20% in the corners. */
const STAGE_BG = 'radial-gradient(120% 90% at 50% 40%, #f7f5f4 0%, #e9e8e3 72%, #dfdfdf 100%)';
const EASE = [0.22, 1, 0.36, 1] as const;

const STEPS: Array<{ id: StepId; label: string; title: string }> = [
  { id: 'shape', label: 'Shape', title: 'Choose your shape' },
  { id: 'setting', label: 'Setting', title: 'Choose your setting' },
  { id: 'band', label: 'Band', title: 'Choose your band' },
  { id: 'metal', label: 'Metal', title: 'Choose your metal' },
  { id: 'stone', label: 'Stone', title: 'Choose your stone' },
  { id: 'finish', label: 'Finish', title: 'Size & engraving' },
];

/** Every cut stands on the turntable during the shape step. */
const LINEUP: readonly Cut[] = CUTS.map((c) => c.id);

const money = (n: number) => `$${Math.round(n).toLocaleString('en-CA')}`;

/** Clearance for the app's fixed bottom navigation. */
const NAV = '5.25rem + env(safe-area-inset-bottom, 0px)';

const TOP_LINK =
  'lux-ui pointer-events-auto inline-flex min-h-10 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-stone transition-colors hover:text-midnight';

/* ------------------------------------------------------------------ hooks */

function useSize(el: HTMLElement | null) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    if (!el) {
      setSize({ w: 0, h: 0 });
      return;
    }
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return size;
}

/* -------------------------------------------------------------- controls */

type Opt<T> = { id: T; label: string; note?: string };

/** A row of choices; a white pill slides to the chosen one. Arrow keys move the choice. */
function Segmented<T extends string | number>({
  name,
  options,
  value,
  onChange,
  small = false,
}: {
  name: string;
  options: ReadonlyArray<Opt<T>>;
  value: T;
  onChange: (v: T) => void;
  small?: boolean;
}) {
  const pill = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const index = Math.max(
    0,
    options.findIndex((o) => o.id === value),
  );
  const onKey = (e: KeyboardEvent) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (index + d + options.length) % options.length;
    onChange(options[n].id);
    refs.current[n]?.focus();
  };
  // On a phone the row scrolls sideways: keep the chosen option in view.
  useEffect(() => {
    refs.current[index]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [index]);

  return (
    <div className="no-scrollbar -mx-4 max-w-[calc(100%+2rem)] overflow-x-auto px-4 sm:mx-0 sm:max-w-full sm:px-0">
      <div
        role="radiogroup"
        aria-label={name}
        onKeyDown={onKey}
        className={cn(
          'relative mx-auto flex w-max items-center rounded-full border border-midnight/[0.06] bg-cloud-20/45 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-md',
          small ? 'p-0.5' : 'p-1',
        )}
      >
        {options.map((o, i) => {
          const on = i === index;
          return (
            <button
              key={String(o.id)}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              onClick={() => onChange(o.id)}
              className={cn(
                'lux-ui relative shrink-0 rounded-full font-bold uppercase transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midnight/35',
                small ? 'h-8 px-3.5 text-[9px] tracking-[0.16em]' : 'h-10 px-4 text-[10px] tracking-[0.16em] sm:px-5',
                on ? 'text-midnight' : 'text-stone hover:text-midnight',
              )}
            >
              {on && (
                <motion.span
                  layoutId={pill}
                  aria-hidden
                  className="absolute inset-0 z-0 rounded-full bg-cloud-20 shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
                  transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
                />
              )}
              <span className="relative z-10 whitespace-nowrap">
                {o.label}
                {o.note && <span className="ml-1.5 text-[8px] tracking-[0.1em] opacity-60">{o.note}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SizeStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const i = SIZES.indexOf(value);
  const btn =
    'flex size-8 items-center justify-center rounded-full text-midnight transition-colors hover:bg-cloud-20 disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midnight/35';
  return (
    <div className="flex h-10 shrink-0 items-center rounded-full border border-midnight/[0.06] bg-cloud-20/45 p-1 backdrop-blur-md">
      <button type="button" aria-label="Smaller ring size" disabled={i <= 0} onClick={() => onChange(SIZES[i - 1])} className={btn}>
        <Minus size={14} strokeWidth={1.5} aria-hidden />
      </button>
      <p className="lux-ui min-w-[7.5rem] text-center text-[10px] font-bold uppercase tracking-[0.16em] tabular-nums" aria-live="polite">
        Size {value} <span className="text-stone-80">US</span>
      </p>
      <button type="button" aria-label="Larger ring size" disabled={i >= SIZES.length - 1} onClick={() => onChange(SIZES[i + 1])} className={btn}>
        <Plus size={14} strokeWidth={1.5} aria-hidden />
      </button>
    </div>
  );
}

function Breadcrumb({ current, onPick }: { current: number; onPick: (id: StepId) => void }) {
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((s, i) => (
        <li key={s.id} className="flex items-center gap-2">
          {i > 0 && (
            <span aria-hidden className="text-[10px] text-stone-40">
              ·
            </span>
          )}
          <button
            type="button"
            onClick={() => onPick(s.id)}
            aria-current={i === current ? 'step' : undefined}
            className={cn(
              'lux-ui py-2 text-[9px] font-bold uppercase tracking-[0.18em] transition-colors duration-300',
              i === current ? 'text-midnight' : i < current ? 'text-stone hover:text-midnight' : 'text-stone-60 hover:text-stone',
            )}
          >
            {s.label}
          </button>
        </li>
      ))}
    </ol>
  );
}

/* ---------------------------------------------------------------- finale */

type Chapter = { id: string; shot: string; kicker: string; title: string; body?: string };

/**
 * "Your ring, up close": each chapter scrolls a short card into view while the camera
 * moves to that part of the ring. The estimate and the save button stay pinned.
 */
function Finale({
  chapters,
  onChapter,
  config,
  quote,
  saving,
  saved,
  onSave,
  onEdit,
}: {
  chapters: Chapter[];
  onChapter: (shot: string) => void;
  config: RingConfig;
  quote: { total: number; lines: Array<[string, number]> };
  saving: boolean;
  saved: string;
  onSave: () => void;
  onEdit: () => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.55) onChapter((e.target as HTMLElement).dataset.shot ?? 'hero');
        }
      },
      { root, threshold: [0.55] },
    );
    root.querySelectorAll('[data-shot]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [onChapter]);

  const section = 'flex min-h-full snap-start items-end px-4 pt-24 lg:items-center lg:justify-end lg:px-10';
  const clearance = { paddingBottom: `calc(${NAV} + 5.5rem)` };
  const card =
    'w-full rounded-3xl border border-cloud-20/70 bg-cloud-20/75 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:p-6 lg:w-[24rem]';

  return (
    <motion.div
      className="absolute inset-0 z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.6, delay: 0.35 } }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      <h1 className="sr-only">Your Vela ring, up close</h1>
      <div ref={scroller} className="no-scrollbar absolute inset-0 snap-y snap-mandatory overflow-y-auto overscroll-contain">
        {chapters.map((c, i) => (
          <section key={c.id} data-shot={c.shot} className={section} style={clearance}>
            <motion.article
              className={card}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ root: scroller, amount: 0.6 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <p className="lux-kicker">{c.kicker}</p>
              <h2 className="lux-display mt-2 text-[16px] uppercase leading-snug tracking-[0.1em] text-midnight sm:text-[18px]">{c.title}</h2>
              {c.body && <p className="lux-ui mt-2.5 text-[12.5px] leading-relaxed tracking-[0.02em] text-stone">{c.body}</p>}
              {i === 0 && (
                <p className="lux-ui mt-4 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.22em] text-stone-80">
                  Scroll to see it up close
                  <ChevronDown size={14} strokeWidth={1.5} className="animate-bounce motion-reduce:animate-none" aria-hidden />
                </p>
              )}
            </motion.article>
          </section>
        ))}
        <section data-shot="hero" className={section} style={clearance}>
          <motion.article
            className={card}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ root: scroller, amount: 0.6 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            {/* The house seal signs off the estimate. */}
            <div className="flex items-start justify-between gap-4">
              <p className="lux-kicker pt-1">Your estimate</p>
              <span aria-hidden className="vela-mark vela-mark-seal -mt-1 w-16 shrink-0 text-midnight" />
            </div>
            <dl className="lux-ui mt-3 divide-y divide-midnight/[0.06] text-[12px]">
              {quote.lines.map(([name, value]) => (
                <div key={name} className="flex items-baseline justify-between gap-4 py-2">
                  <dt className="text-stone">{name}</dt>
                  <dd className="tabular-nums">{money(value)}</dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 py-2 font-bold">
                <dt>Estimate</dt>
                <dd className="tabular-nums">{money(quote.total)} CAD</dd>
              </div>
            </dl>
            <p className="lux-ui mt-2 text-[11px] leading-relaxed text-stone">
              Size {config.size} US · {config.engraving ? `engraved “${config.engraving}”` : 'no engraving'}. An estimate only: your Vela concierge confirms the
              final design and quote.
            </p>
            <button
              type="button"
              onClick={onEdit}
              className="lux-ui mt-4 inline-flex min-h-10 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-midnight underline-offset-4 hover:underline"
            >
              <ChevronLeft size={14} strokeWidth={1.5} aria-hidden />
              Edit design
            </button>
          </motion.article>
        </section>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center px-4 lg:justify-end lg:px-10"
        style={{ paddingBottom: `calc(${NAV} + 0.75rem)` }}
      >
        <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-4 rounded-full border border-cloud-20/70 bg-cloud-20/85 py-2 pl-6 pr-2 shadow-[0_12px_40px_rgba(0,0,0,0.1)] backdrop-blur-xl lg:w-[24rem]">
          <p className="lux-display text-[15px] tabular-nums tracking-[0.04em]">
            {money(quote.total)} <span className="lux-ui text-[9px] uppercase tracking-[0.18em] text-stone-80">CAD est.</span>
          </p>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            aria-live="polite"
            className="lux-ui h-11 rounded-full bg-midnight px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-cloud transition-opacity disabled:opacity-60"
          >
            {saving ? 'Saving…' : saved || 'Save to brief'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ page */

export default function Configurator3D() {
  // The whole design lives in the URL hash, so a refresh or a shared link restores it exactly.
  const [initial] = useState(() => decodeDesign(window.location.hash));
  const [config, setConfig] = useState<RingConfig>(initial.config);
  const [tab, setTab] = useState<StepId>(initial.step);
  const [phase, setPhase] = useState<'configure' | 'result'>('configure');
  const [chapter, setChapter] = useState('hero');
  const [mode, setMode] = useState<Mode>('sway');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  useEffect(() => {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${encodeDesign(config, tab)}`);
  }, [config, tab]);

  const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null);
  const [topEl, setTopEl] = useState<HTMLDivElement | null>(null);
  const [dockEl, setDockEl] = useState<HTMLDivElement | null>(null);
  const stage = useSize(stageEl);
  const top = useSize(topEl);
  const dock = useSize(dockEl);
  const wide = stage.w >= 1024;

  const set = <K extends keyof RingConfig>(k: K, v: RingConfig[K]) => setConfig((c) => ({ ...c, [k]: v }));
  const quote = useMemo(() => estimate(config), [config]);
  const step = STEPS.findIndex((s) => s.id === tab);
  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      timers.current.push(window.setTimeout(() => setCopied(false), 1800));
    } catch {
      /* clipboard unavailable: the address bar already holds the link */
    }
  };

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
        timers.current.push(window.setTimeout(() => setSaved(''), 2200));
      }, 450),
    );
  };

  const next = () => {
    if (!last) setTab(STEPS[step + 1].id);
    else {
      setChapter('hero');
      setPhase('result');
    }
  };
  const back = () => step > 0 && setTab(STEPS[step - 1].id);
  const edit = () => setPhase('configure');
  const onChapter = useCallback((shot: string) => setChapter(shot), []);

  const gemName = label(GEMS, config.gem).toLowerCase();
  const origin = config.gem === 'diamond' ? (config.source === 'lab' ? 'lab-grown ' : 'mined ') : '';
  const summary = `${config.carat} carat ${label(CUTS, config.cut).toLowerCase()} ${gemName} ring, ${label(SETTINGS, config.setting).toLowerCase()} setting, ${label(BANDS, config.band).toLowerCase()} band, ${label(METALS, config.metal)}, ${label(FINISHES, config.finish).toLowerCase()} finish`;

  const detail =
    tab === 'shape'
      ? CUTS.find((o) => o.id === config.cut)?.detail
      : tab === 'setting'
        ? SETTINGS.find((o) => o.id === config.setting)?.detail
        : tab === 'band'
          ? BANDS.find((o) => o.id === config.band)?.detail
          : tab === 'metal'
            ? FINISHES.find((o) => o.id === config.finish)?.detail
            : tab === 'stone'
              ? config.gem === 'diamond'
                ? 'Every diamond comes IGI certified'
                : undefined
              : 'Engraved inside the band, up to 20 characters';

  const chapters: Chapter[] = [
    {
      id: 'intro',
      shot: 'hero',
      kicker: 'Your Vela ring',
      title: `${label(CUTS, config.cut)} ${gemName}, ${label(SETTINGS, config.setting).toLowerCase()}`,
      body: `A ${config.carat} carat ${origin}${gemName} on a ${label(BANDS, config.band).toLowerCase()} band in ${label(METALS, config.metal).toLowerCase()}.`,
    },
    {
      id: 'stone',
      shot: 'close-stone',
      kicker: 'The stone',
      title: `${config.carat} ct ${label(CUTS, config.cut).toLowerCase()} ${gemName}`,
      body: `${CUTS.find((o) => o.id === config.cut)?.detail ?? ''}.${config.gem === 'diamond' ? ` ${config.source === 'lab' ? 'Lab-grown' : 'Mined'} and IGI certified.` : ''}`,
    },
    { id: 'setting', shot: 'close-setting', kicker: 'The setting', title: label(SETTINGS, config.setting), body: `${SETTINGS.find((o) => o.id === config.setting)?.detail ?? ''}.` },
    { id: 'band', shot: 'band', kicker: 'The band', title: label(BANDS, config.band), body: `${BANDS.find((o) => o.id === config.band)?.detail ?? ''}.` },
    {
      id: 'metal',
      shot: 'macro',
      kicker: 'The metal',
      title: `${label(METALS, config.metal)}, ${label(FINISHES, config.finish).toLowerCase()}`,
      body: `${FINISHES.find((o) => o.id === config.finish)?.detail ?? ''}.`,
    },
  ];

  const insets: Insets =
    phase === 'configure'
      ? { top: top.h, right: 0, bottom: dock.h, left: 0 }
      : wide
        ? { top: top.h, right: 30 * 16, bottom: 84, left: 0 }
        : { top: top.h, right: 0, bottom: Math.min(stage.h * 0.6, 380), left: 0 };

  const controls = (() => {
    switch (tab) {
      case 'shape':
        return <Segmented name="Shape" options={CUTS} value={config.cut} onChange={(v) => set('cut', v)} />;
      case 'setting':
        return <Segmented name="Setting" options={SETTINGS} value={config.setting} onChange={(v) => set('setting', v)} />;
      case 'band':
        return <Segmented name="Band" options={BANDS} value={config.band} onChange={(v) => set('band', v)} />;
      case 'metal':
        return (
          <>
            <Segmented
              name="Metal"
              options={METALS.map((m) => ({ ...m, note: m.id === 'platinum' ? '+$900' : undefined }))}
              value={config.metal}
              onChange={(v) => set('metal', v)}
            />
            <Segmented small name="Finish" options={FINISHES} value={config.finish} onChange={(v) => set('finish', v)} />
          </>
        );
      case 'stone':
        return (
          <>
            <Segmented name="Gemstone" options={GEMS} value={config.gem} onChange={(v) => set('gem', v)} />
            <div className="flex w-full flex-wrap items-center justify-center gap-2">
              <Segmented
                small
                name="Carat weight"
                options={CARATS.map((c) => ({ id: c, label: `${c} ct` }))}
                value={config.carat}
                onChange={(v) => set('carat', v)}
              />
              {config.gem === 'diamond' && (
                <Segmented
                  small
                  name="Diamond origin"
                  options={[
                    { id: 'lab' as const, label: 'Lab-grown' },
                    { id: 'mined' as const, label: 'Mined' },
                  ]}
                  value={config.source}
                  onChange={(v) => set('source', v)}
                />
              )}
            </div>
          </>
        );
      case 'finish':
        return (
          <div className="flex w-full flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <SizeStepper value={config.size} onChange={(v) => set('size', v)} />
            <label htmlFor="engrave" className="sr-only">
              Engraving inside the band
            </label>
            <input
              id="engrave"
              type="text"
              maxLength={20}
              value={config.engraving}
              onChange={(e) => set('engraving', e.target.value)}
              placeholder="Your engraving"
              className="lux-ui h-10 w-full max-w-[17rem] rounded-full border border-midnight/[0.06] bg-cloud-20/60 px-5 text-center text-[12px] tracking-[0.04em] backdrop-blur-md placeholder:text-stone-60 focus:border-midnight/40 focus:outline-none focus:ring-2 focus:ring-midnight/10"
            />
          </div>
        );
    }
  })();

  return (
    <div ref={setStageEl} className="lux-text relative min-h-0 flex-1 overflow-hidden" style={{ background: STAGE_BG }}>
      <RingStage
        geometry={{ cut: config.cut, setting: config.setting, band: config.band }}
        materials={{ metal: config.metal, gem: config.gem, finish: config.finish }}
        carat={config.carat}
        mode={mode}
        label={summary}
        shot={phase === 'result' ? chapter : tab}
        carousel={phase === 'configure' && tab === 'shape' ? LINEUP : null}
        insets={insets}
        interactive={phase === 'configure'}
      />

      {/* Top bar: the way out, the steps, and sharing */}
      <div ref={setTopEl} className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 pb-1 pt-2 lg:px-8 lg:pt-5">
        <div className="relative flex items-center justify-between gap-3">
          {phase === 'configure' ? (
            <Link to="/" className={TOP_LINK}>
              <ChevronLeft size={16} strokeWidth={1.5} aria-hidden />
              Atelier
            </Link>
          ) : (
            <button type="button" onClick={edit} className={TOP_LINK}>
              <ChevronLeft size={16} strokeWidth={1.5} aria-hidden />
              Edit design
            </button>
          )}
          {phase === 'configure' && (
            <nav aria-label="Design steps" className="pointer-events-auto absolute left-1/2 hidden -translate-x-1/2 lg:block">
              <Breadcrumb current={step} onPick={setTab} />
            </nav>
          )}
          <div className="pointer-events-auto flex items-center gap-1">
            {phase === 'configure' && (
              <button
                type="button"
                onClick={() => setMode((m) => (m === 'spin' ? 'sway' : 'spin'))}
                aria-pressed={mode === 'spin'}
                aria-label="Turn the ring continuously"
                title="Turn the ring continuously"
                className={cn(
                  'flex size-10 items-center justify-center rounded-full transition-colors',
                  mode === 'spin' ? 'bg-midnight text-cloud' : 'text-stone hover:bg-cloud-20/70 hover:text-midnight',
                )}
              >
                <RotateCw size={15} strokeWidth={1.5} aria-hidden />
              </button>
            )}
            <button type="button" onClick={copyLink} aria-live="polite" className={cn(TOP_LINK, 'px-2')}>
              {copied ? <Check size={14} strokeWidth={1.6} aria-hidden /> : <Link2 size={14} strokeWidth={1.6} aria-hidden />}
              <span className="hidden sm:inline">{copied ? 'Link copied' : 'Share'}</span>
              <span className="sr-only sm:hidden">{copied ? 'Link copied' : 'Share design'}</span>
            </button>
          </div>
        </div>
        {phase === 'configure' && (
          <nav aria-label="Design steps" className="no-scrollbar pointer-events-auto -mt-1 flex justify-center overflow-x-auto lg:hidden">
            <Breadcrumb current={step} onPick={setTab} />
          </nav>
        )}
      </div>

      {/* The dock: one step's choices, then on */}
      <AnimatePresence>
        {phase === 'configure' && (
          <motion.div
            key="dock"
            ref={setDockEl}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay: 0.35 } }}
            exit={{ opacity: 0, y: 16, transition: { duration: 0.35, ease: EASE } }}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 isolate flex flex-col items-center px-4 pt-2"
            style={{ paddingBottom: `calc(${NAV} + 0.75rem)` }}
          >
            {/* A soft studio fade behind the controls, so text stays clear when the ring comes close. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[calc(100%+4rem)] bg-[linear-gradient(to_top,rgba(233,232,227,0.96)_0%,rgba(233,232,227,0.9)_55%,rgba(233,232,227,0)_100%)]"
            />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.32, ease: EASE }}
                className="pointer-events-auto flex w-full max-w-[46rem] flex-col items-center gap-3"
              >
                <h1 className="lux-display text-center text-[15px] uppercase leading-tight tracking-[0.16em] text-midnight lg:text-[17px]">{current.title}</h1>
                {controls}
                {detail && <p className="lux-ui text-center text-[12.5px] text-stone">{detail}</p>}
              </motion.div>
            </AnimatePresence>

            <div className="pointer-events-auto mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={back}
                disabled={step === 0}
                aria-label="Previous step"
                className="flex size-12 items-center justify-center rounded-full text-midnight transition-[opacity,background-color] hover:bg-cloud-20/70 disabled:pointer-events-none disabled:opacity-0"
              >
                <ChevronLeft size={18} strokeWidth={1.5} aria-hidden />
              </button>
              <button
                type="button"
                onClick={next}
                className="lux-ui h-12 min-w-[13rem] rounded-full bg-midnight px-10 text-[10px] font-bold uppercase tracking-[0.24em] text-cloud shadow-[0_10px_30px_rgba(0,0,0,0.12)] transition-transform active:scale-[0.98]"
              >
                {last ? 'See your ring' : 'Next'}
              </button>
              <span aria-hidden className="size-12" />
            </div>

            <p className="lux-ui pointer-events-auto mt-3 text-center text-[12px] text-stone">
              Your design · estimate{' '}
              <motion.span key={quote.total} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="font-bold tabular-nums text-midnight">
                {money(quote.total)} CAD
              </motion.span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The finale */}
      <AnimatePresence>
        {phase === 'result' && (
          <Finale
            key="finale"
            chapters={chapters}
            onChapter={onChapter}
            config={config}
            quote={quote}
            saving={saving}
            saved={saved}
            onSave={save}
            onEdit={edit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
