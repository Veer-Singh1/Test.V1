/**
 * Hand-drawn SVG paths for the reader's pen.
 * Deterministic (seeded), so server-rendered HTML and repeated builds are identical.
 * All paths are drawn in a 0–100 × 0–100 box and stretched with preserveAspectRatio="none";
 * strokes use vector-effect="non-scaling-stroke" so line weight stays constant.
 */

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

const f = (n: number) => n.toFixed(1);

/** A loose ellipse that overshoots its start, like a pen circling a word. */
export function circlePath(seed = 1): string {
  const r = rng(seed);
  const pts: [number, number][] = [];
  const turns = 1.12 + r() * 0.08;
  const steps = 28;
  const start = -0.35 + r() * 0.2;
  for (let i = 0; i <= steps; i++) {
    const t = start + (i / steps) * Math.PI * 2 * turns;
    const wob = 1 + (r() - 0.5) * 0.06;
    const drift = (i / steps) * 4; // the pen drifts as it closes the loop
    pts.push([50 + Math.cos(t) * 48 * wob, 50 + Math.sin(t) * 44 * wob - drift]);
  }
  return catmull(pts);
}

/** A slightly wavy underline, pressing harder in the middle. */
export function underlinePath(seed = 2): string {
  const r = rng(seed);
  const pts: [number, number][] = [];
  for (let i = 0; i <= 8; i++) {
    const x = -2 + (i / 8) * 104;
    pts.push([x, 55 + Math.sin(i * 0.9 + r()) * 12 + (r() - 0.5) * 8]);
  }
  return catmull(pts);
}

/** A curving arrow pointing down-left (into the text). */
export function arrowPath(seed = 4): string {
  const r = rng(seed);
  const j = () => (r() - 0.5) * 6;
  const shaft = `M${f(92 + j())} ${f(8 + j())} C ${f(70 + j())} ${f(10 + j())}, ${f(30 + j())} ${f(30 + j())}, ${f(14 + j())} ${f(86 + j())}`;
  const head = `M${f(4 + j())} ${f(66 + j())} L ${f(14)} ${f(88)} L ${f(32 + j())} ${f(74 + j())}`;
  return `${shaft} ${head}`;
}

/** A tall square bracket for the margin. */
export function bracketPath(seed = 5): string {
  const r = rng(seed);
  const j = () => (r() - 0.5) * 5;
  return `M${f(90 + j())} ${f(2)} C ${f(30 + j())} ${f(4 + j())}, ${f(40 + j())} ${f(40)}, ${f(30 + j())} ${f(50)} C ${f(40 + j())} ${f(60)}, ${f(30 + j())} ${f(96 + j())}, ${f(90 + j())} ${f(98)}`;
}

/** A flourish for "The End". */
export function flourishPath(): string {
  return 'M2 60 C 18 20, 30 92, 46 58 S 66 18, 74 50 S 88 86, 98 34';
}

/** Catmull–Rom → cubic Bézier, giving a smooth hand-drawn curve through points. */
function catmull(pts: [number, number][]): string {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${f(c1x)} ${f(c1y)}, ${f(c2x)} ${f(c2y)}, ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

export type MarkKind = 'circle' | 'underline' | 'double';

/** Inline mark around a word: <span class="mark mark--circle">word<svg/></span> */
export function mark(word: string, kind: MarkKind, seed = 1): string {
  const d = kind === 'circle' ? circlePath(seed) : kind === 'double' ? `${underlinePath(seed)} ${shift(underlinePath(seed + 11), 22)}` : underlinePath(seed);
  return `<span class="mark mark--${kind}" data-ink>${word}<svg class="mark__ink" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="${d}" pathLength="1" vector-effect="non-scaling-stroke"/></svg></span>`;
}

function shift(d: string, dy: number): string {
  // shift every y coordinate (odd-indexed numbers) by dy
  let i = 0;
  return d.replace(/-?\d+\.\d/g, (n) => (i++ % 2 === 1 ? (parseFloat(n) + dy).toFixed(1) : n));
}

/** A margin note: hand-written words + an optional stroke. Decorative text is conveyed via aria-label. */
export function note(text: string, opts: { stroke?: 'arrow' | 'bracket' | 'none'; tilt?: number; className?: string; seed?: number } = {}): string {
  const { stroke = 'arrow', tilt = -2, className = '', seed = 4 } = opts;
  const d = stroke === 'arrow' ? arrowPath(seed) : stroke === 'bracket' ? bracketPath(seed) : '';
  const svg = d
    ? `<svg class="note__ink note__ink--${stroke}" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="${d}" pathLength="1" vector-effect="non-scaling-stroke"/></svg>`
    : '';
  return `<aside class="note ${className}" data-ink aria-label="Reader’s note: ${text}" style="--tilt:${tilt}deg"><span class="note__text" aria-hidden="true">${text}</span>${svg}</aside>`;
}
