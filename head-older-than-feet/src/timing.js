// Timing from the generated voiceover (src/script.json holds real sentence start/end times).
import data from './script.json';

export const FPS = 30;
export const S = data.sentences;
export const HOLD = 0.6; // short tail so the last line loops back into the first
export const END = S[S.length - 1].end + HOLD;
export const DURATION_FRAMES = Math.ceil(END * FPS);
export const sent = (n) => S[n - 1];

const SAY = { '2010': 'twentyten', '33': 'thirtythree', gps: 'geepeeess' };
const bare = (w) => w.replace(/[*]/g, '').replace(/[^A-Za-z0-9']/g, '');
const weight = (w) => { const b = bare(w).toLowerCase(); return (SAY[b] || b).length + 1; };
export const isPunch = (w) => { const b = bare(w); return b.length >= 3 && b === b.toUpperCase() && /[A-Z]/.test(b) && b !== 'GPS'; };
export const isFeel = (w) => /^\*[^*]+\*[.,!?]*$/.test(w);

// Every spoken word with its start/end time (placed by spoken letters inside its sentence).
export const WORDS = S.flatMap((s) => {
  const raw = s.display.split(/\s+/), ws = raw.map(weight), tot = ws.reduce((a, b) => a + b, 0);
  let acc = 0;
  return raw.map((w, i) => {
    const t0 = s.start + ((s.end - s.start) * acc) / tot; acc += ws[i];
    return { n: s.n, i, raw: w, text: w.replace(/\*/g, ''), punch: isPunch(w), feel: isFeel(w), t0, t1: s.start + ((s.end - s.start) * acc) / tot };
  });
});
export function beat(n, word, occ = 0, off = 0) {
  let k = 0;
  for (const w of WORDS) if (w.n === n && bare(w.raw).toLowerCase() === word.toLowerCase()) { if (k === occ) return w.t0 + off; k++; }
  throw new Error(`beat: "${word}" not in sentence ${n}`);
}
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOut = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
export const easeInOut = (x) => { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const ramp = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
export const pop = (t, t0, d = 0.3) => { const p = clamp((t - t0) / d, 0, 1); return p <= 0 ? 0 : p < 0.6 ? 1.1 * easeOut(p / 0.6) : 1.1 - 0.1 * easeOut((p - 0.6) / 0.4); };
