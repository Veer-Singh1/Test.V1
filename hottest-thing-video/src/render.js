// Deterministic frame renderer: steps a virtual clock (frame / fps) and captures
// each frame with Playwright. No real-time playback involved.
//
//   node src/render.js <framesDir>            render every frame
//   node src/render.js <framesDir> 0,30,300   render only these frames (for checks)
//   node src/render.js --events               print the audio event list as JSON
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const WORKERS = 4;
const url = "file://" + path.resolve(__dirname, "video.html") + "?render=1";

(async () => {
  const browser = await chromium.launch();
  const open = async () => {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    page.on("pageerror", e => { console.error("PAGE ERROR:", e.message); process.exit(1); });
    await page.goto(url);
    await page.evaluate(() => window.ready);
    return page;
  };
  if (process.argv[2] === "--events") {
    const page = await open();
    console.log(JSON.stringify(await page.evaluate(() => ({ events: window.AUDIO_EVENTS, beats: window.BEATS }))));
    await browser.close();
    return;
  }
  const dir = process.argv[2];
  fs.mkdirSync(dir, { recursive: true });
  const first = await open();
  const total = await first.evaluate(() => window.TIMELINE.frames);
  const only = process.argv[3] ? process.argv[3].split(",").map(Number) : null;
  const frames = only || Array.from({ length: total }, (_, i) => i);
  const pages = [first];
  while (pages.length < Math.min(WORKERS, frames.length)) pages.push(await open());
  let next = 0, done = 0;
  await Promise.all(pages.map(async page => {
    while (next < frames.length) {
      const f = frames[next++];
      await page.evaluate(f => window.renderFrame(f), f);
      await page.screenshot({ path: path.join(dir, `f${String(f).padStart(5, "0")}.png`), type: "png" });
      if (++done % 150 === 0) console.log(`${done}/${frames.length}`);
    }
  }));
  await browser.close();
  console.log(`rendered ${frames.length} frames`);
})();
