// Word timings (assets/timings.json) -> helpers every scene uses.
import timings from '../assets/timings.json';
import { SOFT_WORDS } from './script';
import { VIDEO } from './style';

export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ramp = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
export const easeInOut = (x: number) => { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
// pop-in: 0 -> 110% -> 100% (ease-out with a slight overshoot)
export const pop = (t: number, t0: number, d = 0.3) => { const p = clamp((t - t0) / d, 0, 1); return p <= 0 ? 0 : p < 0.6 ? 1.1 * easeOut(p / 0.6) : 1.1 - 0.1 * easeOut((p - 0.6) / 0.4); };
export const win = (t: number, a: number, b: number, f = 0.25) => ramp(t, a - f, a) * (1 - ramp(t, b, b + f));

const bare = (w: string) => w.replace(/[^A-Za-z0-9'-]/g, '');
export type Word = { i: number; text: string; start: number; end: number; punch: boolean; soft: boolean; sentenceEnd: boolean; pauseAfter: boolean };
export const WORDS: Word[] = (timings.words as { text: string; start: number; end: number }[]).map((w, i) => {
  const b = bare(w.text);
  return {
    i, text: w.text, start: w.start, end: w.end,
    punch: b.length >= 3 && b === b.toUpperCase() && /[A-Z]/.test(b),
    soft: SOFT_WORDS.map((s) => s.toLowerCase()).includes(b.toLowerCase()),
    sentenceEnd: /[.?!]$/.test(w.text) && !/\.\.\.$/.test(w.text),
    pauseAfter: /(\.\.\.|,)$/.test(w.text),
  };
});
export const FRAMES = Math.ceil((WORDS[WORDS.length - 1].end + VIDEO.tail) * VIDEO.fps);
export const END = FRAMES / VIDEO.fps;
// start time of a spoken word: at('every', 2) = the third "every" (case and punctuation ignored)
export function at(word: string, occ = 0, off = 0): number {
  let k = 0;
  for (const w of WORDS) if (bare(w.text).toLowerCase() === bare(word).toLowerCase()) { if (k === occ) return w.start + off; k++; }
  throw new Error(`at(): "${word}" #${occ} is not in the narration`);
}
