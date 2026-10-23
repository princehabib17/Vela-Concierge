export type Cut = 'round' | 'oval' | 'emerald' | 'pear';
export type Setting = 'claw' | 'halo' | 'bezel';
export type Band = 'plain' | 'pave' | 'eternity';
export type Metal = 'yellow' | 'white' | 'rose' | 'platinum';
export type Gem = 'diamond' | 'sapphire' | 'ruby' | 'emerald';
export type Finish = 'polished' | 'satin';
export type Mode = 'sway' | 'side' | 'spin';

export type Geometry = { cut: Cut; setting: Setting; band: Band };
export type Materials = { metal: Metal; gem: Gem; finish: Finish };
