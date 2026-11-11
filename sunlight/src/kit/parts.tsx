// Flat line-art parts: 4 px round-capped lines; fills only on figures and dots.
import React from 'react';
import { C, FONT, LINE, TYPE } from '../style';
import { clamp, easeOut } from '../timeline';

export type P = [number, number];
export const SW = { strokeWidth: LINE, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, vectorEffect: 'non-scaling-stroke' as const, fill: 'none' };
export const L = (a: P, b: P, u: number): P => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
export const polar = (c: P, r: number, deg: number): P => [c[0] + r * Math.cos((deg * Math.PI) / 180), c[1] + r * Math.sin((deg * Math.PI) / 180)];
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (a: string, b: string, p: number) => { const A = rgb(a), B = rgb(b); p = clamp(p, 0, 1); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * p).toString(16).padStart(2, '0')).join(''); };

export const Defs = () => (
  <defs>
    <filter id="halo" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="20" /></filter>
  </defs>
);
// the one glowing object: a soft bloom behind it
// drawn at a fixed size and scaled, so the blur stays proportional (no square edges on tiny objects)
export const Glow = ({ p, r, color = C.white, opacity = 1 }: { p: P; r: number; color?: string; opacity?: number }) => (opacity > 0.01 ? (
  <g transform={`translate(${p[0]} ${p[1]}) scale(${r / 50})`}><circle r={50} fill={color} opacity={0.3 * opacity} filter="url(#halo)" /></g>
) : null);
export const Figure = ({ x, y, s = 1, color = C.white, opacity = 1 }: { x: number; y: number; s?: number; color?: string; opacity?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
    <rect x={-62} y={-300} width={124} height={300} rx={56} fill={color} />
    <circle cx={0} cy={-372} r={58} fill={color} />
  </g>
);
// shockwave ring: 0 -> 150 % while fading (0.6 s)
export const Ring = ({ p, r, t, t0, color = C.white }: { p: P; r: number; t: number; t0: number; color?: string }) => {
  const q = clamp((t - t0) / 0.6, 0, 1);
  return q <= 0 || q >= 1 ? null : <circle cx={p[0]} cy={p[1]} r={r * 1.5 * easeOut(q)} {...SW} stroke={color} opacity={1 - q} />;
};
// labels keep their on-screen size whatever the zoom (pass the zoom)
export const Label = ({ p, z, text, color = C.ash, anchor = 'middle', opacity = 1 }: { p: P; z: number; text: string; color?: string; anchor?: 'start' | 'middle' | 'end'; opacity?: number }) => (opacity > 0.01 ? (
  <g transform={`translate(${p[0]} ${p[1]}) scale(${1 / z})`} opacity={opacity}>
    <text fill={color} fontFamily={FONT.sans} fontWeight={TYPE.label.weight} fontSize={TYPE.label.size} letterSpacing={TYPE.label.spacing} textAnchor={anchor}>{text.toUpperCase()}</text>
  </g>
) : null);
export const Pill = ({ p, z, text, color = C.white, opacity = 1 }: { p: P; z: number; text: string; color?: string; opacity?: number }) => {
  if (opacity <= 0.01) return null;
  const w = text.length * 23 + 50;
  return (
    <g transform={`translate(${p[0]} ${p[1]}) scale(${1 / z})`} opacity={opacity}>
      <rect x={-w / 2} y={-30} width={w} height={60} rx={30} {...SW} stroke={color} fill={C.void} />
      <text y={10} fill={color} fontFamily={FONT.sans} fontWeight={600} fontSize={28} letterSpacing="0.2em" textAnchor="middle">{text.toUpperCase()}</text>
    </g>
  );
};
export const Arrow = ({ a, b, u = 1, color = C.white, z, opacity = 1, w = LINE, dash }: { a: P; b: P; u?: number; color?: string; z: number; opacity?: number; w?: number; dash?: string }) => {
  if (u <= 0.01 || opacity <= 0.01) return null;
  const q = L(a, b, u), ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  return (
    <g opacity={opacity}>
      <line x1={a[0]} y1={a[1]} x2={q[0]} y2={q[1]} {...SW} strokeWidth={w} stroke={color} strokeDasharray={dash} />
      <g transform={`translate(${q[0]} ${q[1]}) rotate(${ang}) scale(${1 / z})`}><path d="M5,0 L-17,-11 L-17,11 Z" fill={color} /></g>
    </g>
  );
};
