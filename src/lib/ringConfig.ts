import type { Band, Cut, Finish, Gem, Metal, Setting } from './ringTypes';

export type RingConfig = {
  cut: Cut;
  setting: Setting;
  band: Band;
  metal: Metal;
  finish: Finish;
  gem: Gem;
  source: 'lab' | 'mined';
  carat: number;
  size: number;
  engraving: string;
};

export const DEFAULT_CONFIG: RingConfig = {
  cut: 'round',
  setting: 'claw',
  band: 'pave',
  metal: 'yellow',
  finish: 'polished',
  gem: 'diamond',
  source: 'lab',
  carat: 1.5,
  size: 6,
  engraving: '',
};

type Option<T extends string> = { id: T; label: string; note?: string; detail?: string };

export const CUTS: Option<Cut>[] = [
  { id: 'round', label: 'Round', detail: 'The brilliant classic' },
  { id: 'oval', label: 'Oval', detail: 'Elongated, flattering on the hand' },
  { id: 'emerald', label: 'Emerald cut', detail: 'Step-cut, hall-of-mirrors clarity' },
  { id: 'pear', label: 'Pear', detail: 'A teardrop with a single point' },
];

export const SETTINGS: Option<Setting>[] = [
  { id: 'claw', label: 'Classic claw', detail: 'Four slender claws, maximum light' },
  { id: 'halo', label: 'Hidden halo', detail: 'A secret ring of diamonds beneath the stone' },
  { id: 'bezel', label: 'Bezel', detail: 'A smooth metal collar, secure and modern' },
];

export const BANDS: Option<Band>[] = [
  { id: 'plain', label: 'Plain', detail: 'Polished, uninterrupted gold' },
  { id: 'pave', label: 'Pavé shoulders', detail: 'Graduated diamonds down the shoulders' },
  { id: 'eternity', label: 'Eternity', detail: 'Diamonds all the way around' },
];

export const METALS: Option<Metal>[] = [
  { id: 'yellow', label: '14k yellow gold' },
  { id: 'white', label: '14k white gold' },
  { id: 'rose', label: '14k rose gold' },
  { id: 'platinum', label: 'Platinum' },
];

export const FINISHES: Option<Finish>[] = [
  { id: 'polished', label: 'Mirror polish', detail: 'A high shine that catches every light' },
  { id: 'satin', label: 'Satin brushed', detail: 'A soft, directional grain, quietly modern' },
];

export const GEMS: Option<Gem>[] = [
  { id: 'diamond', label: 'Diamond' },
  { id: 'sapphire', label: 'Sapphire' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'emerald', label: 'Emerald' },
];

export const CARATS = [1, 1.5, 2, 2.5, 3];
export const SIZES = [3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

const DIAMOND_PRICE: Record<number, number> = { 1: 1200, 1.5: 1800, 2: 2500, 2.5: 3400, 3: 4600 };
const COLOUR_PRICE: Record<number, number> = { 1: 1500, 1.5: 2400, 2: 3600, 2.5: 5200, 3: 7400 };

export const label = <T extends string>(list: Option<T>[], id: T) => list.find((o) => o.id === id)?.label ?? id;

/** Rough estimate in CAD; the Vela concierge confirms the final quote. */
export function estimate(c: RingConfig): { total: number; lines: Array<[string, number]> } {
  const stone =
    c.gem === 'diamond'
      ? DIAMOND_PRICE[c.carat] * (c.source === 'mined' ? 2.6 : 1)
      : COLOUR_PRICE[c.carat];
  const lines: Array<[string, number]> = [
    ['Craftsmanship', 1100],
    [`${c.carat} ct ${label(GEMS, c.gem).toLowerCase()}${c.gem === 'diamond' ? ` (${c.source === 'lab' ? 'lab-grown' : 'mined'})` : ''}`, stone],
    ['Cut', c.cut === 'round' ? 0 : c.cut === 'oval' ? 150 : c.cut === 'pear' ? 250 : 300],
    ['Setting', c.setting === 'claw' ? 0 : c.setting === 'halo' ? 420 : 180],
    ['Band', c.band === 'plain' ? 0 : c.band === 'pave' ? 450 : 1100],
    ['Metal', c.metal === 'platinum' ? 900 : 0],
  ];
  return { total: lines.reduce((s, [, v]) => s + v, 0), lines: lines.filter(([, v]) => v > 0) };
}

/* ------------------------------------------------- shareable URL state */

export type StepId = 'shape' | 'setting' | 'band' | 'metal' | 'stone' | 'finish';
const STEP_IDS: StepId[] = ['shape', 'setting', 'band', 'metal', 'stone', 'finish'];

const pick = <T extends string>(list: Option<T>[], v: unknown, fallback: T): T =>
  list.some((o) => o.id === v) ? (v as T) : fallback;

/** Serialises a design to a compact, URL-safe hash such as `#ring=round.claw.pave.yellow.polished.diamond.lab.1.5.6.step-metal`. */
export function encodeDesign(c: RingConfig, step: StepId): string {
  const text = encodeURIComponent(c.engraving).replace(/\./g, '%2E');
  return `#ring=${[c.cut, c.setting, c.band, c.metal, c.finish, c.gem, c.source, c.carat, c.size, text || '-', step].join('~')}`;
}

/** Reads a hash written by {@link encodeDesign}. Anything missing or invalid falls back to the defaults. */
export function decodeDesign(hash: string): { config: RingConfig; step: StepId } {
  const d = DEFAULT_CONFIG;
  const raw = hash.replace(/^#ring=/, '');
  if (raw === hash || !raw) return { config: d, step: 'shape' };
  const [cut, setting, band, metal, finish, gem, source, carat, size, engr, step] = raw.split('~');
  const num = (v: string | undefined, allowed: number[], fb: number) => (allowed.includes(Number(v)) ? Number(v) : fb);
  let engraving = '';
  try {
    engraving = engr && engr !== '-' ? decodeURIComponent(engr).slice(0, 20) : '';
  } catch {
    engraving = '';
  }
  return {
    config: {
      cut: pick(CUTS, cut, d.cut),
      setting: pick(SETTINGS, setting, d.setting),
      band: pick(BANDS, band, d.band),
      metal: pick(METALS, metal, d.metal),
      finish: pick(FINISHES, finish, d.finish),
      gem: pick(GEMS, gem, d.gem),
      source: source === 'mined' ? 'mined' : 'lab',
      carat: num(carat, CARATS, d.carat),
      size: num(size, SIZES, d.size),
      engraving,
    },
    step: (STEP_IDS as string[]).includes(step) ? (step as StepId) : 'shape',
  };
}
