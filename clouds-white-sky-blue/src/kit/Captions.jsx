// Word-by-word captions: top third, centred, max two lines and about 6 words per line.
// A punch word (ALL CAPS) sits on its own line; a feeling word (*word*) is Playfair italic.
import React from 'react';
import { WORDS, S, clamp, easeOut } from '../timing.js';
import { C, FONT } from './palette.js';

function pages(n, skip) {
  const ws = WORDS.filter((w) => w.n === n && !skip(w));
  const lines = []; let cur = [];
  const flush = () => { if (cur.length) lines.push(cur); cur = []; };
  for (const w of ws) {
    if (w.punch) { flush(); lines.push([w]); continue; }
    // at 60 px Inter Bold about 22 characters fit between the side margins
    const len = cur.reduce((a, x) => a + x.text.length + 1, 0) + w.text.length * (w.feel ? 1.15 : 1);
    if (cur.length && len > 22) flush();
    cur.push(w);
    if (cur.length >= 6 || (cur.length >= 3 && /[,;:]$/.test(w.raw))) flush();
  }
  flush();
  const out = []; for (let i = 0; i < lines.length; i += 2) out.push(lines.slice(i, i + 2));
  return out;
}
const PAGES = S.filter((s) => !s.title).flatMap((s) => pages(s.n, (w) => s.concept && w.punch).map((p) => ({ n: s.n, lines: p, t0: p[0][0].t0 }))).filter((p) => p.lines.length);

function Word({ w, t }) {
  const p = easeOut(clamp((t - w.t0) / 0.18, 0, 1));
  if (p <= 0) return <span style={{ opacity: 0, margin: '0 0.14em' }}>{w.text}</span>;
  const g = Math.round(138 + (255 - 138) * p);
  const base = { display: 'inline-block', margin: '0 0.14em', opacity: p, color: `rgb(${g},${g},${g})`, filter: `blur(${12 * (1 - p)}px)`, transform: `translateY(${8 * (1 - p)}px)`, textShadow: '0 0 20px rgba(0,0,0,0.6)' };
  if (w.punch) {
    const sc = 1.15 - 0.15 * p;
    return <span style={{ ...base, fontFamily: FONT.sans, fontWeight: 900, fontSize: 122, letterSpacing: '0.01em', transform: `translateY(${8 * (1 - p)}px) scale(${sc})`, textShadow: `0 0 28px rgba(255,255,255,${0.45 * p}), 0 0 20px rgba(0,0,0,0.6)` }}>{w.text.toUpperCase()}</span>;
  }
  if (w.feel) return <span style={{ ...base, fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: 500, fontSize: 70 }}>{w.text}</span>;
  return <span style={{ ...base, fontFamily: FONT.sans, fontWeight: 700, fontSize: 60 }}>{w.text}</span>;
}
function Page({ page, t, out }) {
  const q = clamp(out, 0, 1);
  return (
    <div style={{ position: 'absolute', left: 90, right: 160, top: 170, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: 1 - q, filter: `blur(${10 * q}px)` }}>
      {page.lines.map((line, i) => (
        <div key={i} style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'center', alignItems: 'baseline', lineHeight: 1.15, whiteSpace: 'nowrap' }}>
          {line.map((w) => <Word key={`${w.n}-${w.i}`} w={w} t={t} />)}
        </div>
      ))}
    </div>
  );
}
export function Captions({ t }) {
  let k = -1; for (let i = 0; i < PAGES.length; i++) if (t >= PAGES[i].t0 - 0.02) k = i;
  if (k < 0) return null;
  const cur = PAGES[k], prev = PAGES[k - 1];
  const swap = (t - cur.t0) / 0.25;
  return (
    <>
      {prev && swap < 1 ? <Page page={prev} t={t} out={swap} /> : null}
      <Page page={cur} t={t} out={0} />
    </>
  );
}
