// All timing comes from sentence_times.json (estimated until a real voiceover exists).
import data from './sentence_times.json';

export const FPS = 30;
export const SENTENCES = data.sentences;
export const N_SHOTS = 12;
export const HOLD = 1.2; // seconds held after the last word

const byShot = (n) => SENTENCES.filter((s) => s.shot === n);
export const VO_END = SENTENCES[SENTENCES.length - 1].end;
export const DURATION = VO_END + HOLD;
export const DURATION_FRAMES = Math.ceil(DURATION * FPS);

// One CUTS array: CUTS[i] = start time of shot i+1; cuts sit in the pause after a sentence end.
export const CUTS = [0];
for (let n = 2; n <= N_SHOTS; n++) {
  const prev = byShot(n - 1), next = byShot(n);
  const a = prev[prev.length - 1].end, b = next[0].start;
  CUTS.push(a + (b - a) * 0.5);
}
CUTS.push(DURATION);

export const shotOf = (t) => {
  for (let i = N_SHOTS - 1; i >= 0; i--) if (t >= CUTS[i]) return i + 1;
  return 1;
};
export const shotStart = (n) => CUTS[n - 1];
export const shotEnd = (n) => CUTS[n];

const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, '');
// Spoken length of each written word (numbers are said as words), used to place
// words inside a sentence by proportion of spoken letters.
const SAY = { '1935': 'nineteenthirtyfive' };
const weight = (w) => { const n = norm(w); return (SAY[n] || n).length + 1; };
function wordStarts(s) {
  const words = s.text.split(/\s+/), ws = words.map(weight), total = ws.reduce((a, b) => a + b, 0);
  let acc = 0;
  return words.map((w, i) => { const st = s.start + ((s.end - s.start) * acc) / total; acc += ws[i]; return { w, st, en: s.start + ((s.end - s.start) * acc) / total }; });
}
// Time a word starts being spoken.
export function beat(shot, word, occurrence = 0, offset = 0) {
  let seen = 0;
  for (const s of byShot(shot)) {
    for (const x of wordStarts(s)) {
      if (norm(x.w) === norm(word)) {
        if (seen === occurrence) return x.st + offset;
        seen++;
      }
    }
  }
  throw new Error(`beat: word "${word}" not found in shot ${shot}`);
}
// Time a word finishes.
export function beatEnd(shot, word, occurrence = 0) {
  let seen = 0;
  for (const s of byShot(shot)) for (const x of wordStarts(s)) if (norm(x.w) === norm(word)) { if (seen === occurrence) return x.en; seen++; }
  throw new Error(`beatEnd: word "${word}" not found in shot ${shot}`);
}
