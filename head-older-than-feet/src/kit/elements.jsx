// Flat line-art parts from the kit: 4 px round-capped lines, fills only on figures and dots.
import React from 'react';
import { C, FONT } from './palette.js';
import { clamp, easeOut } from '../timing.js';

export const SW = { strokeWidth: 4, strokeLinecap: 'round', strokeLinejoin: 'round', vectorEffect: 'non-scaling-stroke', fill: 'none' };

export function Defs() {
  return (
    <defs>
      <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="14" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="halo" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="22" /></filter>
    </defs>
  );
}

// "You": circle head over a rounded-rectangle body. Feet at (x, y).
export function Figure({ x, y, s = 1, color = C.white, opacity = 1, lying = false }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${lying ? -90 : 0}) scale(${s})`} opacity={opacity}>
      <rect x={-62} y={-300} width={124} height={300} rx={56} fill={color} />
      <circle cx={0} cy={-372} r={58} fill={color} />
    </g>
  );
}

// Clock: circle, 4 ticks, one hand. `turns` = hand position in turns.
export function Clock({ x, y, r = 44, turns = 0, color = C.white, opacity = 1, glow = false, glowColor = C.white }) {
  const a = turns * Math.PI * 2 - Math.PI / 2;
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      {glow ? <circle r={r * 1.25} fill={glowColor} opacity={0.25} filter="url(#halo)" /> : null}
      <circle r={r} {...SW} stroke={color} fill={C.void} />
      {[0, 1, 2, 3].map((k) => { const b = (k * Math.PI) / 2; return <line key={k} x1={Math.cos(b) * r * 0.78} y1={Math.sin(b) * r * 0.78} x2={Math.cos(b) * r * 0.92} y2={Math.sin(b) * r * 0.92} {...SW} stroke={color} />; })}
      <line x1={0} y1={0} x2={Math.cos(a) * r * 0.7} y2={Math.sin(a) * r * 0.7} {...SW} stroke={color} />
      <circle r={5} fill={color} />
    </g>
  );
}

export function Label({ x, y, text, color = C.mist, size = 28, anchor = 'middle', opacity = 1 }) {
  return <text x={x} y={y} fill={color} opacity={opacity} fontFamily={FONT.sans} fontWeight={600} fontSize={size} letterSpacing="0.25em" textAnchor={anchor} style={{ textTransform: 'uppercase' }}>{text}</text>;
}
// Labels and tags keep their on-screen size regardless of camera zoom (pass the zoom).
export function ScreenLabel({ x, y, text, z, color = C.mist, size = 28, anchor = 'middle', opacity = 1 }) {
  return <g transform={`translate(${x} ${y}) scale(${1 / z})`}><Label x={0} y={0} text={text} color={color} size={size} anchor={anchor} opacity={opacity} /></g>;
}
export function Pill({ x, y, text, z, color = C.white, opacity = 1 }) {
  const w = text.length * 19 + 56;
  return (
    <g transform={`translate(${x} ${y}) scale(${1 / z})`} opacity={opacity}>
      <rect x={-w / 2} y={-30} width={w} height={60} rx={30} {...SW} stroke={color} fill={C.void} />
      <text x={0} y={10} fill={color} fontFamily={FONT.sans} fontWeight={600} fontSize={28} letterSpacing="0.2em" textAnchor="middle">{text}</text>
    </g>
  );
}
// Shockwave ring: grows from 0 to 150 % while fading (0.6 s).
export function Ring({ x, y, r = 120, t, t0, color = C.white }) {
  const p = clamp((t - t0) / 0.6, 0, 1);
  if (p <= 0 || p >= 1) return null;
  return <circle cx={x} cy={y} r={r * 1.5 * easeOut(p)} {...SW} stroke={color} opacity={1 - p} />;
}
export function Dot({ x, y, r = 12, color = C.white, opacity = 1, glow = false }) {
  return <g opacity={opacity}>{glow ? <circle cx={x} cy={y} r={r * 2.4} fill={color} opacity={0.3} filter="url(#halo)" /> : null}<circle cx={x} cy={y} r={r} fill={color} /></g>;
}
