/* A documentary timeline (pipeline/build_doc.py writes it): long-form 16:9 or a 9:16 Short. */

export type DocShot = {
  from: number; // first frame; the shot fades in over FADE frames from here, on top of the one before
  to: number; // last frame + 1 (the builder overlaps it with the next shot by FADE frames)
  kind: 'art' | 'clip' | 'chapter' | 'quote' | 'title' | 'end' | 'black' | 'scene' | 'map' | 'timeline' | 'document' | 'chapter2';
  trans?: 'slide' | 'fade' | 'cut'; // how this shot comes in (collage kinds slide by default)
  [extra: string]: unknown; // scene items, map pins, timeline events, highlights: see Collage.tsx
  // art: an image in public/<story>/art, moved slowly from `start` to `end`
  src?: string;
  w?: number; // the image's size in pixels
  h?: number;
  fit?: 'cover' | 'contain'; // contain: the whole image over a blurred copy of itself
  start?: [number, number, number]; // view centre x, y (0..1 across the image) and zoom (1 = fitted)
  end?: [number, number, number];
  credit?: string; // small label, e.g. "Aberdeen Bestiary, c. 1200"
  // clip: an mp4 in public/<story>/clips
  clip_start?: number; // seconds into the clip
  rate?: number;
  zoom?: [number, number]; // optional slow zoom over the shot, e.g. [1, 1.06]
  // chapter / title / quote / end
  label?: string; // "Chapter II"
  title?: string;
  sub?: string;
  text?: string; // a quotation
  by?: string; // its source
  bg?: string; // background image for a quote or chapter card (in public/<story>/art)
  lines?: string[]; // end card: the credits
};

export type DocCaption = {from: number; to: number; text: string};

export type DocSfx = {src: string; from: number; volume?: number; to?: number};

export type DocTimeline = {
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  audio: string; // narration, in public/<story>/
  music?: {src: string; volume: number}; // a bed under the narration
  sfx?: DocSfx[];
  shots: DocShot[];
  captions: DocCaption[];
  subtitles?: boolean; // burn subtitles in (default true)
  theme?: string; // colour theme for collage scenes (see THEMES in Collage.tsx); a shot can set its own
};

export const FADE = 15;
