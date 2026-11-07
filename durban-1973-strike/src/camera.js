// Camera plan: per shot, camera keys (position + look-at) tied to word beats.
// Positions are local to the shot's location (x offset added at runtime).
import * as THREE from 'three';
import { beat, CUTS, shotStart, shotEnd } from './timing.js';

// Monotone cubic time warp: T = beat times per path key; returns path position 0..1
// with zero speed at the first and last key (ease in, ease out).
export function warpU(T, t) {
  const n = T.length; if (t <= T[0]) return 0; if (t >= T[n - 1]) return 1;
  const sec = []; for (let i = 0; i < n - 1; i++) sec.push((1 / (n - 1)) / (T[i + 1] - T[i]));
  const m = [0]; for (let i = 1; i < n - 1; i++) m.push(2 * sec[i - 1] * sec[i] / (sec[i - 1] + sec[i])); m.push(0);
  let i = 0; while (t > T[i + 1]) i++;
  const h = T[i + 1] - T[i], x = (t - T[i]) / h, x2 = x * x, x3 = x2 * x;
  return (2 * x3 - 3 * x2 + 1) * (i / (n - 1)) + (x3 - 2 * x2 + x) * h * m[i] + (-2 * x3 + 3 * x2) * ((i + 1) / (n - 1)) + (x3 - x2) * h * m[i + 1];
}

const k = (t, pos, look) => ({ t, pos, look });
// Shots 1 and 2 share one continuous move in the brickworks yard.
export const SHOTS = {
  1: { loc: 'A', aperture: 0.013, keys: () => [
    k(0, [0.55, 1.35, 4.1], [0.45, 1.15, -0.3]),
    k(beat(2, 'It'), [0.35, 1.4, 3.4], [0.35, 1.15, -0.4]),
    k(beat(2, 'January', 0, 0.25), [-0.5, 1.6, 1.55], [-1.0, 1.15, -1.2]),
    k(beat(2, 'works', 0, 0.35), [-0.3, 2.2, 1.2], [0, 4.35, -6.1]),
  ] },
  3: { loc: 'B', aperture: 0.013, keys: () => [
    k(shotStart(3), [-2.4, 1.15, 3.6], [-0.8, 1.45, -2.0]),
    k(beat(3, 'nine', 0, 0.5), [-1.9, 1.7, 3.3], [-0.5, 2.0, -1.6]),
    k(beat(3, 'more', 0, 0.3), [-1.2, 2.7, 4.3], [0.3, 1.4, -4.0]),
  ] },
  4: { loc: 'A', aperture: 0.014, keys: () => [
    k(shotStart(4), [3.55, 1.7, -1.4], [4.75, 1.8, -5.5]),
    k(beat(4, 'law', 0, 0.4), [4.3, 1.8, -2.95], [4.85, 1.82, -5.5]),
  ] },
  5: { loc: 'C', aperture: 0.011, keys: () => [
    k(shotStart(5), [0.35, 1.62, 2.9], [-0.35, 1.75, -2.4]),
    k(beat(5, 'two', 0, 0.9), [0.05, 1.7, 1.6], [-0.4, 1.85, -2.4]),
  ] },
  6: { loc: 'D', aperture: 0.012, keys: () => [
    k(shotStart(6), [-3.9, 1.45, 4.6], [-1.9, 1.9, -2.9]),
    k(beat(6, 'too', 0, 0.4), [-2.2, 1.6, 4.4], [0.0, 2.0, -2.9]),
  ] },
  7: { loc: 'E', aperture: 0.010, keys: () => [
    k(shotStart(7), [0.6, 3.3, 2.4], [0, 0.92, 0.1]),
    k(beat(7, 'tools', 0, 0.4), [0.25, 2.35, 2.9], [0, 1.6, -1.7]),
  ] },
  8: { loc: 'A', aperture: 0.013, keys: () => [
    k(shotStart(8), [6.4, 1.35, 3.9], [6.15, 1.2, 1.0]),
    k(beat(8, 'fire', 0, 0.3), [6.55, 1.45, 4.15], [6.15, 1.2, 1.0]),
    k(beat(8, 'all', 0, 0.4), [7.4, 3.3, 6.8], [4.6, 1.1, -0.6]),
  ] },
  9: { loc: 'F', aperture: 0.010, keys: () => [
    k(shotStart(9), [0.45, 1.62, 1.6], [0.0, 0.86, -0.4]),
    k(beat(9, 'recognised', 0, 0.6), [0.15, 1.38, 0.85], [0.0, 0.86, -0.38]),
  ] },
  10: { loc: 'A', aperture: 0.013, keys: () => [
    k(shotStart(10), [0.7, 1.45, 8.2], [-1.7, 1.0, 3.0]),
    k(beat(10, 'bricks', 0, 0.3), [-0.3, 1.3, 6.9], [-1.9, 0.95, 3.2]),
  ] },
};
SHOTS[2] = SHOTS[1];

// Lighting per shot: warm key from the upper left, hemisphere fill, fog per location.
// Warm and bright in the setup, cooler at the pivot, golden at the end.
export const LIGHTS = {
  A: { dir: [-6, 10, 5], key: '#ffe0b0', keyI: 2.5, sky: '#fff1da', gnd: '#8a7258', hemiI: 1.55, fog: ['#ead8b8', 28, 150], skyTint: '#ffffff', tint: '#ffffff', lamp: 0 },
  B: { dir: [-6, 10, 6], key: '#ffe8c4', keyI: 2.5, sky: '#f4f3e4', gnd: '#6f7a52', hemiI: 1.5, fog: ['#e2e4d4', 30, 170], skyTint: '#ffffff', tint: '#ffffff', lamp: 0 },
  C: { dir: [-8, 4.2, 1.2], key: '#ffe6bc', keyI: 3.0, sky: '#fff0d8', gnd: '#7a5a40', hemiI: 1.35, fog: ['#3a2e28', 60, 300], skyTint: '#ffffff', tint: '#fff6ea', lamp: 0, lampPos: [1.6, 2.6, 0.5] },
  D: { dir: [-6, 9, 7], key: '#ffe6c0', keyI: 2.5, sky: '#f3efe0', gnd: '#7d7262', hemiI: 1.5, fog: ['#e3dccb', 30, 170], skyTint: '#ffffff', tint: '#ffffff', lamp: 0 },
  E: { dir: [8, 4.0, 1.5], key: '#fff0d4', keyI: 2.2, sky: '#e8e4d8', gnd: '#5a4636', hemiI: 0.95, fog: ['#2c2622', 60, 300], skyTint: '#ffffff', tint: '#f6efe4', lamp: 2.5, lampPos: [0.0, 2.0, 1.0] },
  F: { dir: [-8, 4.0, 1.8], key: '#ffe2b4', keyI: 3.0, sky: '#fbead0', gnd: '#6a4a32', hemiI: 1.05, fog: ['#2c2622', 60, 300], skyTint: '#ffffff', tint: '#fff2e2', lamp: 8, lampPos: [-0.8, 1.6, -0.4] },
};
export const SHOT_LIGHT = {
  8: { dir: [-5, 8, 6], key: '#dfe6ff', keyI: 2.1, sky: '#d6e2f4', gnd: '#6a6a72', hemiI: 1.45, fog: ['#c9d3dc', 26, 140], skyTint: '#c8d8f0', tint: '#e8edf6', lamp: 0 },
  10: { dir: [-10, 3.6, 5], key: '#ffbe78', keyI: 2.9, sky: '#ffdcae', gnd: '#8a6248', hemiI: 1.35, fog: ['#f0c89c', 22, 130], skyTint: '#ffd2a0', tint: '#fff0dc', lamp: 0 },
};

const curves = {};
function curvesFor(shot) {
  if (curves[shot]) return curves[shot];
  const keys = SHOTS[shot].keys();
  const v = (a) => new THREE.Vector3(...a);
  const pts = keys.map((x) => v(x.pos)), lks = keys.map((x) => v(x.look));
  const c = {
    T: keys.map((x) => x.t),
    pos: pts.length > 1 ? new THREE.CatmullRomCurve3(pts, false, 'centripetal') : null,
    look: lks.length > 1 ? new THREE.CatmullRomCurve3(lks, false, 'centripetal') : null,
    p0: pts[0], l0: lks[0],
  };
  curves[shot] = c;
  return c;
}
// Returns world-space camera position and look-at point for time t in a given shot.
export function cameraAt(shot, t, locX) {
  const c = curvesFor(shot);
  const u = c.pos ? warpU(c.T, t) : 0;
  const pos = c.pos ? c.pos.getPoint(u) : c.p0.clone();
  const look = c.look ? c.look.getPoint(u) : c.l0.clone();
  pos.x += locX; look.x += locX;
  return { pos, look };
}
