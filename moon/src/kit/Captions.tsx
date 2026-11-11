// Word-by-word captions in the top third: each word lands on its spoken moment.
import React from 'react';
import { C, CAPTION, FONT, SAFE, TYPE } from '../style';
import { WORDS, Word, clamp, easeOut } from '../timeline';

// lines: a punch word gets its own line; break before a line gets too long, and after a comma or "..."
type Page = { lines: Word[][]; t0: number };
export const PAGES: Page[] = (() => {
  const pages: Page[] = []; let lines: Word[][] = [], cur: Word[] = [];
  const flushLine = () => { if (cur.length) { if (lines.length === CAPTION.maxLines) flushPage(); lines.push(cur); cur = []; } };
  function flushPage() { if (lines.length) pages.push({ lines, t0: lines[0][0].start }); lines = []; }
  for (const w of WORDS) {
    if (w.punch) { flushLine(); cur = [w]; flushLine(); }
    else {
      const len = cur.reduce((a, x) => a + x.text.length + 1, 0) + w.text.length * (w.soft ? 1.15 : 1);
      if (cur.length && len > CAPTION.maxChars) flushLine();
      cur.push(w);
      if (w.pauseAfter && cur.length >= 3) flushLine();
    }
    if (w.sentenceEnd) { flushLine(); flushPage(); }
  }
  flushLine(); flushPage();
  return pages;
})();

const WordSpan: React.FC<{ w: Word; t: number }> = ({ w, t }) => {
  const p = easeOut(clamp((t - w.start) / CAPTION.wordIn, 0, 1));
  const g = Math.round(138 + (255 - 138) * p);
  const base: React.CSSProperties = { display: 'inline-block', position: 'relative', margin: '0 0.14em', opacity: p, color: `rgb(${g},${g},${g})`, filter: `blur(${CAPTION.blur * (1 - p)}px)`, transform: `translateY(${CAPTION.rise * (1 - p)}px)`, textShadow: '0 0 20px rgba(0,0,0,0.6)' };
  if (w.punch) {
    const sc = CAPTION.punchScale - (CAPTION.punchScale - 1) * p, q = clamp((t - w.start) / CAPTION.ring, 0, 1);
    return (
      <span style={{ ...base, fontFamily: FONT.sans, fontWeight: TYPE.punch.weight, fontSize: TYPE.punch.size, lineHeight: 1.05, transform: `translateY(${CAPTION.rise * (1 - p)}px) scale(${sc})`, textShadow: `0 0 30px rgba(255,255,255,${0.5 * p}), 0 0 20px rgba(0,0,0,0.6)` }}>
        {w.text.toUpperCase()}
        {q > 0 && q < 1 ? <span style={{ position: 'absolute', left: '50%', top: '50%', width: 260, height: 260, marginLeft: -130, marginTop: -130, borderRadius: '50%', border: `4px solid ${C.white}`, opacity: 1 - q, transform: `scale(${1.5 * easeOut(q)})` }} /> : null}
      </span>
    );
  }
  if (w.soft) return <span style={{ ...base, fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: TYPE.soft.weight, fontSize: TYPE.soft.size }}>{w.text}</span>;
  return <span style={{ ...base, fontFamily: FONT.sans, fontWeight: TYPE.caption.weight, fontSize: TYPE.caption.size }}>{w.text}</span>;
};
const PageView: React.FC<{ page: Page; t: number; out: number }> = ({ page, t, out }) => (
  <div style={{ position: 'absolute', left: SAFE.left, right: SAFE.right, top: CAPTION.top, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 1 - out, filter: `blur(${10 * out}px)` }}>
    {page.lines.map((line, i) => (
      <div key={i} style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', lineHeight: 1.15, whiteSpace: 'nowrap' }}>
        {line.map((w) => <WordSpan key={w.i} w={w} t={t} />)}
      </div>
    ))}
  </div>
);
export const Captions: React.FC<{ t: number }> = ({ t }) => {
  let k = -1; for (let i = 0; i < PAGES.length; i++) if (t >= PAGES[i].t0 - 0.02) k = i;
  if (k < 0) return null;
  const swap = clamp((t - PAGES[k].t0) / CAPTION.lineOut, 0, 1);
  return (
    <>
      {k > 0 && swap < 1 ? <PageView page={PAGES[k - 1]} t={t} out={swap} /> : null}
      <PageView page={PAGES[k]} t={t} out={0} />
    </>
  );
};
