import {Easing, interpolate, random, useCurrentFrame} from 'remotion';

// Stop-motion "on twos": every visible change happens on even frames only.
export const STEP = 2;
export const quantize = (f: number) => f - (((f % STEP) + STEP) % STEP);

/** The frame number, held for 2 frames (12 updates per second on a 24 fps timeline). */
export const useOnTwos = () => quantize(useCurrentFrame());

export const stepOf = (f: number) => Math.floor(quantize(f) / STEP);

/** Seeded random in [0,1) for a given seed + held step (+ channel). Same every render. */
export const rand = (seed: string | number, step: number, k: number | string = 0) =>
  random(`${seed}|${step}|${k}`);

/** Seeded random in [-amp, amp]. */
export const jitter = (seed: string | number, step: number, k: number | string, amp: number) =>
  (rand(seed, step, k) * 2 - 1) * amp;

/** Clamped interpolation. Pass a quantised frame, so the result is held between steps. */
export const tween = (
  f: number,
  f0: number,
  f1: number,
  v0: number,
  v1: number,
  easing: (t: number) => number = Easing.inOut(Easing.quad),
) =>
  interpolate(f, [f0, f1], [v0, v1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

/** Multi-key held interpolation. */
export const keys = (f: number, frames: number[], values: number[], easing = Easing.inOut(Easing.quad)) =>
  interpolate(f, frames, values, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

export type Boil = {x: number; y: number; r: number};

/** Boil: a tiny seeded offset/rotation that changes every 2 frames. */
export const boilAt = (seed: string | number, f: number, amp = 1.5, rot = 0.4): Boil => {
  const s = stepOf(f);
  return {x: jitter(seed, s, 'x', amp), y: jitter(seed, s, 'y', amp), r: jitter(seed, s, 'r', rot)};
};

export const useBoil = (seed: string | number, amp = 1.5, rot = 0.4) => boilAt(seed, useOnTwos(), amp, rot);

export {Easing};
