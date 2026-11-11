// Camera plan for the double-slit short: per shot, camera keys (position + look-at) tied to word beats.
// Positions are local to the shot's location (x offset added at runtime).
import * as THREE from 'three';
import { beat, shotStart } from './timing.js';

// Monotone cubic time warp: zero speed at the first and last key (ease in, ease out).
export function warpU(T, t) {
  const n = T.length; if (t <= T[0]) return 0; if (t >= T[n - 1]) return 1;
  const sec = []; for (let i = 0; i < n - 1; i++) sec.push((1 / (n - 1)) / (T[i + 1] - T[i]));
  const m = [0]; for (let i = 1; i < n - 1; i++) m.push(2 * sec[i - 1] * sec[i] / (sec[i - 1] + sec[i])); m.push(0);
  let i = 0; while (t > T[i + 1]) i++;
  const h = T[i + 1] - T[i], x = (t - T[i]) / h, x2 = x * x, x3 = x2 * x;
  return (2 * x3 - 3 * x2 + 1) * (i / (n - 1)) + (x3 - 2 * x2 + x) * h * m[i] + (-2 * x3 + 3 * x2) * ((i + 1) / (n - 1)) + (x3 - x2) * h * m[i + 1];
}
const k = (t, pos, look) => ({ t, pos, look });
export const SHOTS = {
  1: { loc: 'A', aperture: 0.012, keys: () => [k(0, [1.1, 1.45, 0.9], [1.0, 1.45, -1.6]), k(beat(1, 'nonsense', 0, 0.3), [1.0, 1.5, 0.8], [0.9, 1.5, -1.7]), k(beat(1, 'both', 0, 0.3), [0.4, 1.6, 0.9], [-0.9, 1.7, -2.7])] },
  2: { loc: 'A', aperture: 0.012, keys: () => [k(shotStart(2), [1.2, 1.5, 0.6], [2.3, 1.25, -3.0]), k(beat(2, 'frame', 0, 0.3), [1.55, 1.55, -0.4], [2.45, 1.3, -3.1])] },
  3: { loc: 'B', aperture: 0.012, keys: () => [k(shotStart(3), [1.1, 1.15, 6.2], [0, 1.05, 0]), k(beat(3, 'two', 1, 0.4), [1.0, 2.7, 1.8], [0, 1.1, -3.0])] },
  4: { loc: 'C', aperture: 0.010, keys: () => [k(shotStart(4), [2.0, 3.4, 4.6], [0, 0.7, -0.5]), k(beat(4, 'interference', 0, 0.4), [1.0, 2.6, 2.4], [0, 1.0, -3.0])] },
  5: { loc: 'D', aperture: 0.012, keys: () => [k(shotStart(5), [1.5, 0.8, 3.3], [0.15, 0.5, 2.4]), k(beat(5, 'single', 0, -0.9), [1.3, 0.9, 1.9], [0.1, 0.5, 0.9]), k(beat(5, 'single', 0, 0.4), [1.2, 1.5, 0.2], [0, 1.4, -3.0])] },
  6: { loc: 'D', aperture: 0.010, keys: () => [k(shotStart(6), [1.2, 1.5, 0.2], [0, 1.4, -3.0]), k(beat(6, 'itself', 0, 0.3), [0.95, 1.45, -0.45], [0, 1.45, -3.0])] },
  7: { loc: 'E', aperture: 0.012, keys: () => [k(shotStart(7), [0.3, 1.25, 3.6], [0, 0.75, -0.8]), k(beat(7, 'till', 0, 0.3), [0.1, 1.2, 2.2], [0, 0.8, -0.8])] },
  8: { loc: 'D', aperture: 0.012, keys: () => [k(shotStart(8), [2.6, 1.7, 2.4], [0, 1.2, -1.2]), k(beat(8, 'boring', 0, 0.3), [2.0, 1.6, 1.6], [0.1, 1.3, -1.6])] },
  9: { loc: 'D', aperture: 0.012, keys: () => [k(shotStart(9), [1.1, 1.45, 1.6], [0.58, 1.2, 0.3]), k(beat(9, 'gone', 0, 0.3), [0.85, 1.35, 1.05], [0.55, 1.2, 0.3])] },
  10: { loc: 'A', aperture: 0.012, keys: () => [k(shotStart(10), [-1.3, 1.5, 1.2], [-2.6, 1.05, -2.3]), k(beat(10, 'person', 0, 0.3), [-2.1, 1.45, 0.4], [-2.75, 1.0, -2.4])] },
  11: { loc: 'D', aperture: 0.010, keys: () => [k(shotStart(11), [2.4, 2.4, 2.6], [0, 1.0, 0.0]), k(beat(11, 'one', 0, 0.3), [1.8, 1.9, 1.0], [0, 1.3, -2.6])] },
  12: { loc: 'A', aperture: 0.006, focus: 3.0, keys: () => [k(shotStart(12), [-0.15, 1.5, 3.3], [-0.15, 1.55, -2.0]), k(beat(12, 'drama', 0, 0.4), [-0.2, 1.6, 2.6], [-0.15, 1.6, -2.4])] },
};
// Lighting per location; the pivot (shot 9) is cooler.
export const LIGHTS = {
  A: { dir: [-5, 6, 7], key: '#ffe6bc', keyI: 2.6, sky: '#fff0d8', gnd: '#7a5a40', hemiI: 1.4, fog: ['#3a2e28', 60, 300], skyTint: '#ffffff', tint: '#fff8ee', lamp: 1.5, lampPos: [-0.6, 2.5, -0.6] },
  B: { dir: [-6, 10, 6], key: '#fff0d0', keyI: 2.6, sky: '#eef4ff', gnd: '#6f7a52', hemiI: 1.6, fog: ['#e2ead8', 35, 180], skyTint: '#ffffff', tint: '#ffffff', lamp: 0 },
  C: { dir: [-5, 7, 7], key: '#f6f2e4', keyI: 2.4, sky: '#eef2f0', gnd: '#5a6460', hemiI: 1.4, fog: ['#2c3230', 60, 300], skyTint: '#ffffff', tint: '#ffffff', lamp: 3, lampPos: [0, 3.2, 0] },
  D: { dir: [5, 6, 7], key: '#dfe8ff', keyI: 2.1, sky: '#d6e2f4', gnd: '#4a5058', hemiI: 1.25, fog: ['#1c242a', 60, 300], skyTint: '#ffffff', tint: '#eef2f8', lamp: 3, lampPos: [0.2, 2.8, 1.0] },
  E: { dir: [-4, 6, 8], key: '#ffe2b4', keyI: 2.5, sky: '#fff0d8', gnd: '#7a5a40', hemiI: 1.4, fog: ['#3a2e28', 60, 300], skyTint: '#ffffff', tint: '#fff8ee', lamp: 1.5, lampPos: [0, 2.5, -0.4] },
};
export const SHOT_LIGHT = {
  9: { key: '#c8d8ff', keyI: 1.8, sky: '#c9d8f0', hemiI: 1.15, tint: '#e6edf8' },
};
const curves = {};
function curvesFor(shot) {
  if (curves[shot]) return curves[shot];
  const keys = SHOTS[shot].keys();
  const v = (a) => new THREE.Vector3(...a);
  const pts = keys.map((x) => v(x.pos)), lks = keys.map((x) => v(x.look));
  const c = { T: keys.map((x) => x.t), pos: pts.length > 1 ? new THREE.CatmullRomCurve3(pts, false, 'centripetal') : null, look: lks.length > 1 ? new THREE.CatmullRomCurve3(lks, false, 'centripetal') : null, p0: pts[0], l0: lks[0] };
  curves[shot] = c;
  return c;
}
export function cameraAt(shot, t, locX) {
  const c = curvesFor(shot);
  const u = c.pos ? warpU(c.T, t) : 0;
  const pos = c.pos ? c.pos.getPoint(u) : c.p0.clone();
  const look = c.look ? c.look.getPoint(u) : c.l0.clone();
  pos.x += locX; look.x += locX;
  return { pos, look };
}
