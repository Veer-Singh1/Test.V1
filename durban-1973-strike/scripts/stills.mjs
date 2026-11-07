// Render check stills (one browser, one bundle) at given times or beat list.
// usage: node scripts/stills.mjs out/stills 0.5 3.9 ...   (seconds)
import { bundle } from '@remotion/bundler';
import { selectComposition, renderStill, openBrowser } from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const [outDir, ...times] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const quality = process.env.Q || 'preview';
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.jsx') });
const browserExecutable = process.env.CHROME || '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const browser = await openBrowser('chrome', { browserExecutable, chromiumOptions: { gl: 'swangle' } });
const inputProps = { quality };
const comp = await selectComposition({ serveUrl, id: 'Durban1973', inputProps, puppeteerInstance: browser });
for (const s of times) {
  const frame = Math.min(comp.durationInFrames - 1, Math.round(parseFloat(s) * 30));
  const t0 = Date.now();
  await renderStill({ composition: comp, serveUrl, output: path.join(outDir, `t${parseFloat(s).toFixed(2).padStart(5, '0')}.png`), frame, inputProps, puppeteerInstance: browser, chromiumOptions: { gl: 'swangle' }, scale: 1, timeoutInMilliseconds: 240000,
    onBrowserLog: (l) => { if (l.type === 'error' || l.type === 'warning') console.log('[browser]', l.text.slice(0, 300)); } });
  console.log('frame', frame, 't', s, ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
await browser.close({ silent: true });
