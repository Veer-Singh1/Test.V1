import {random} from 'remotion';

export type Pt = [number, number];

/** Smooth path through points (Catmull-Rom -> cubic Bézier). */
export const smoothPath = (pts: Pt[], tension = 0.5): string => {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const t = tension / 3;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
};

/** Hand-drawn wobble: jitter interior points with a fixed seed (stable across frames). */
export const wobble = (pts: Pt[], seed: string, amp = 4): Pt[] =>
  pts.map((p, i) =>
    i === 0 || i === pts.length - 1
      ? p
      : [p[0] + (random(`${seed}-x${i}`) * 2 - 1) * amp, p[1] + (random(`${seed}-y${i}`) * 2 - 1) * amp],
  );

/** Points along a straight line, for wobbling. */
export const line = (a: Pt, b: Pt, n = 6): Pt[] =>
  Array.from({length: n + 1}, (_, i) => [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);

/** Points along a circular arc (angles in degrees, 0 = right, 90 = down). */
export const arc = (cx: number, cy: number, r: number, a0: number, a1: number, n = 16): Pt[] =>
  Array.from({length: n + 1}, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });

export const handPath = (pts: Pt[], seed: string, amp = 4) => smoothPath(wobble(pts, seed, amp));
