// Step 9: one frame from the middle of every shot, tiled into a contact sheet.
// Usage: node scripts/contact-sheet.mjs [story] [--overlays] [--scenes=street,cell]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const story = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'antwerp';
const onOverlays = process.argv.includes('--overlays');
const root = path.resolve(import.meta.dirname, '..');
const timeline = JSON.parse(fs.readFileSync(path.join(root, 'public', story, 'timeline.json'), 'utf8'));
const out = path.join(root, 'out', story, onOverlays ? 'overlay-stills' : 'stills');
fs.rmSync(out, {recursive: true, force: true});
fs.mkdirSync(out, {recursive: true});

const browserExecutable = process.env.CHROME_PATH || undefined;
const chromiumOptions = {gl: process.env.GL || 'angle'};
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const inputProps = {story};
const composition = await selectComposition({serveUrl, id: 'Explainer', inputProps, browserExecutable, chromiumOptions});

const only = process.argv.find((a) => a.startsWith('--scenes='))?.slice(9).split(',');
const frames = onOverlays
  ? timeline.overlays.map((o) => Math.min(o.to - 8, o.from + 26))
  : timeline.shots.filter((s) => !only || only.includes(s.scene)).map((s) => Math.floor((s.from + s.to) / 2));
for (const [i, frame] of frames.entries()) {
  await renderStill({
    composition, serveUrl, inputProps, frame, scale: 0.4, browserExecutable, chromiumOptions,
    output: path.join(out, `${String(i).padStart(3, '0')}.png`),
  });
  process.stdout.write(`\rframe ${i + 1}/${frames.length}`);
}
// Pages of 7 x 4 frames, so each sheet stays readable.
const cols = 7;
const perPage = cols * 4;
const pages = Math.ceil(frames.length / perPage);
for (let pg = 0; pg < pages; pg++) {
  const count = Math.min(perPage, frames.length - pg * perPage);
  const rows = Math.ceil(count / cols);
  const name = (onOverlays ? 'overlays' : only ? 'check' : 'contact-sheet') + (pages > 1 ? `-${pg + 1}` : '') + '.jpg';
  const sheet = path.join(root, 'out', story, name);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-start_number', String(pg * perPage), '-i', path.join(out, '%03d.png'),
    '-frames:v', String(count), '-vf', `tile=${cols}x${rows}:padding=6`, '-frames:v', '1', '-q:v', '3', sheet]);
  console.log(`\nwrote ${sheet}`);
}
