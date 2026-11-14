export type Shot = {
  from: number;
  to: number;
  seed: number;
  beat: string;
  scene: string;
  camera: string;
  time: 'day' | 'dusk' | 'night';
  variant?: number;
  // Scene-specific switches set in script.json.
  lasers?: boolean;
  open?: boolean;
  crew?: number;
  car?: boolean;
  bag?: boolean;
  local?: boolean;
  prop?: string;
  count?: number;
  highlight?: number;
  prison?: boolean;
  // Added for the Boston scenes.
  zoom?: number; // multiplies the scene's camera distance
  sign?: string;
  gem?: boolean;
  brick?: boolean;
  truck?: 'armored' | 'getaway';
  drive?: 'in' | 'out';
  masks?: boolean;
  outfit?: boolean;
  sacks?: boolean;
  workers?: number;
  robbers?: number;
  tied?: boolean;
  empty?: boolean;
  remove?: boolean;
  key?: boolean;
  label?: string;
  text?: string;
  sub?: string;
  flash?: boolean;
  figure?: string;
  lying?: boolean;
  coat?: string;
  hat?: 'cap' | 'beanie' | 'brim';
  gems?: boolean;
  files?: boolean;
  cast?: 'crew';
  drift?: 'gems' | 'cash';
  fire?: boolean;
  few?: boolean;
  agents?: number;
};

export type CaptionChunk = {from: number; to: number; words: {w: string; from: number}[]};

export type Overlay = {
  kind: 'badge' | 'kicker' | 'nametag';
  from: number;
  to: number;
  value?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  line1?: string;
  line2?: string;
  red?: string;
  name?: string;
  place?: string;
};

export type Timeline = {
  fps: number;
  durationInFrames: number;
  audio: string;
  title: {line1: string; line2_red: string};
  shots: Shot[];
  captions: CaptionChunk[];
  overlays: Overlay[];
};
