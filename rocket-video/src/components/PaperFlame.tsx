import React from 'react';
import {random} from 'remotion';
import {jitter, stepOf, useOnTwos} from '../lib/twos';
import {Cutout, CutoutName} from './Cutout';

const ORDER = [0, 2, 1, 3, 1, 0, 3, 2, 0, 3];

type FlameProps = {
  x: number;
  y: number;
  scale?: number;
  seed?: string;
  from?: number;
  until?: number;
  rotate?: number;
  /** extra frame offset so two flames on screen don't swap in sync */
  phase?: number;
};

/**
 * Replacement animation: four hand-torn paper flames swapped every 2 frames, like
 * swapping physical pieces under a stop-motion camera. (x,y) = top-centre of flame.
 */
export const PaperFlame: React.FC<FlameProps> = ({x, y, scale = 1, seed = 'flame', from = -1e9, until = 1e9, rotate = 0, phase = 0}) => {
  const f = useOnTwos();
  if (f < from || f >= until) return null;
  const s = stepOf(f) + phase + Math.floor(random(seed) * 10);
  const v = ORDER[s % ORDER.length];
  const sy = 1 + jitter(seed, s, 'sy', 0.09);
  // flames grow in over the first 3 steps after ignition
  const grow = Math.min(1, 0.45 + 0.2 * stepOf(f - from));
  return (
    <Cutout
      name={`flame_${v}` as CutoutName}
      x={x}
      y={y}
      scale={scale * grow}
      anchor={[0.5, 0.03]}
      rotate={rotate}
      seed={`${seed}-${v}`}
      style={{transform: `scaleY(${sy})`, transformOrigin: '50% 0%'}}
    />
  );
};

type SmokeProps = {
  x: number;
  y: number;
  from: number;
  dur?: number;
  seed?: string;
  dx?: number;
  dy?: number;
  s0?: number;
  s1?: number;
};

/** One paper smoke puff: grows and drifts on twos, swapping between 4 torn cut-outs. */
export const PaperSmoke: React.FC<SmokeProps> = ({x, y, from, dur = 28, seed = 'smoke', dx = 0, dy = 0, s0 = 0.25, s1 = 0.9}) => {
  const f = useOnTwos();
  const t = (f - from) / dur;
  if (t < 0 || t >= 1) return null;
  const k = stepOf(f - from);
  const v = (Math.floor(k / 2) + Math.floor(random(seed) * 4)) % 4;
  const e = 1 - Math.pow(1 - t, 2);
  const scale = s0 + (s1 - s0) * e;
  return (
    <Cutout
      name={`smoke_${v}` as CutoutName}
      x={x + dx * e}
      y={y + dy * e}
      scale={scale}
      seed={`${seed}-${v}`}
      rotate={jitter(seed, 0, 'rot', 12)}
    />
  );
};

/** A burst of several puffs fanning out from a point. */
export const SmokeBurst: React.FC<{x: number; y: number; from: number; n?: number; spread?: number; size?: number; seed: string; dur?: number; lift?: number}> = ({
  x,
  y,
  from,
  n = 5,
  spread = 260,
  size = 0.8,
  seed,
  dur = 30,
  lift = 0,
}) => (
  <>
    {Array.from({length: n}, (_, i) => {
      const a = (i / Math.max(1, n - 1) - 0.5) * Math.PI * 0.95;
      const r = spread * (0.7 + random(`${seed}${i}r`) * 0.5);
      return (
        <PaperSmoke
          key={i}
          x={x}
          y={y}
          from={from + (i % 3) * 2}
          dur={dur + Math.floor(random(`${seed}${i}d`) * 8) * 2}
          seed={`${seed}${i}`}
          dx={Math.sin(a) * r}
          dy={Math.cos(a) * r * 0.25 - lift * random(`${seed}${i}l`)}
          s0={size * 0.3}
          s1={size * (0.75 + random(`${seed}${i}s`) * 0.4)}
        />
      );
    })}
  </>
);
