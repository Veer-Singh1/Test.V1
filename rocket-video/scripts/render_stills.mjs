// Render review stills at given times (seconds) with one bundle.
// usage: node scripts/render_stills.mjs <outDir> <scale> t1 t2 ...   (t may end with "f" for a frame number)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [outDir, scaleArg, ...times] = process.argv.slice(2);
const scale = Number(scaleArg || 1);
fs.mkdirSync(outDir, {recursive: true});
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('assets')});
const composition = await selectComposition({serveUrl, id: 'RocketOrbit', browserExecutable});
for (const t of times) {
  const frame = t.endsWith('f') ? Number(t.slice(0, -1)) : Math.round(Number(t) * 24);
  const output = path.join(outDir, `still_${String(frame).padStart(4, '0')}.png`);
  await renderStill({composition, serveUrl, frame, output, scale, browserExecutable, chromiumOptions: {gl: 'swiftshader'}});
  console.log('rendered', output);
}
