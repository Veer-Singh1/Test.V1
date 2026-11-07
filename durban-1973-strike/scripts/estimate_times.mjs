// Builds sentence_times.json from the script when no voiceover exists yet.
// Estimated pace: about 3.35 words per second overall
// (words at 3.62 wps plus a 0.2 s pause after each sentence).
// Once real audio exists, replace src/sentence_times.json with real start/end times
// (same format) and every cut and camera beat re-times automatically.
import fs from 'node:fs';
const SHOTS = [
  ["In 1973, two thousand workers in Durban did something illegal.", "They stopped making bricks."],
  ["It was the ninth of January, at the Coronation Brick and Tile works."],
  ["They earned under nine rand a week, and they marched to a football stadium to demand more."],
  ["But Black workers had no union, and striking was against the law."],
  ["Then the company offered one rand fifty more.", "They said no, and got just over two rand."],
  ["Within weeks, six thousand Frame textile workers walked out too."],
  ["By March, more than sixty thousand workers at over a hundred Durban firms had downed tools."],
  ["You see, a boss can fire one worker.", "But no factory runs without all of them."],
  ["So the government set up an inquiry.", "In 1979, it said Black unions should be recognised."],
  ["It all started with two thousand people who stopped making bricks."],
];
const WPS = 3.62, PAUSE = 0.2;
let t = 0; const out = [];
SHOTS.forEach((sents, shot) => sents.forEach((text) => {
  const words = text.split(/\s+/).length;
  const start = t, end = t + words / WPS;
  out.push({ shot: shot + 1, text, start: +start.toFixed(3), end: +end.toFixed(3) });
  t = end + PAUSE;
}));
fs.writeFileSync(new URL('../src/sentence_times.json', import.meta.url), JSON.stringify({ source: 'estimated (no voiceover yet)', sentences: out }, null, 2));
console.log(out.map(s => `${s.shot}\t${s.start.toFixed(2)}-${s.end.toFixed(2)}\t${s.text}`).join('\n'));
console.log('total words', out.reduce((a, s) => a + s.text.split(/\s+/).length, 0), 'end', t.toFixed(2));
