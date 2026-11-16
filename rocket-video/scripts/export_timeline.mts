// Dump src/timeline.ts to build/timeline.json for the Python audio mixer.
// Node >= 22.18 strips TypeScript types natively.
import {writeFileSync, mkdirSync} from 'node:fs';
import * as T from '../src/timeline.ts';

mkdirSync('build', {recursive: true});
const out = {
  fps: T.FPS,
  duration: T.DURATION,
  beats: T.BEATS,
  events: T.EV,
  bumps: T.BUMPS,
  captions: T.CAPTIONS,
  sfx: T.SFX,
  marks: T.MARKS,
  music: T.MUSIC,
};
writeFileSync('build/timeline.json', JSON.stringify(out, null, 1));
console.log('wrote build/timeline.json');
