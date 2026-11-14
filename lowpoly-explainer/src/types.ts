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
};

export type CaptionChunk = {from: number; to: number; words: {w: string; from: number}[]};

export type Overlay = {
  kind: 'badge' | 'kicker' | 'nametag';
  from: number;
  to: number;
  value?: number;
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
