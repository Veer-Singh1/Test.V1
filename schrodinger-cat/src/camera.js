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
  1: { loc: 'A', aperture: 0.012, keys: () => [k(0, [1.1, 1.45, 0.9], [1.0, 1.45, -1.6]), k(beat(1, 'nonsense', 0, 0.3), [1.0, 1.5, 0.8], [0.9, 1.5, -1.7]), k(beat(1, 'dead', 0, 0.4), [0.4, 1.6, 0.9], [-0.9, 1.7, -2.7])] },
  2: { loc: 'C', aperture: 0.012, keys: () => [k(shotStart(2), [0.55, 1.5, 1.4], [-0.05, 1.2, -1.0]), k(beat(2, 'complaining', 0, 0.4), [0.4, 1.45, 0.85], [0.1, 1.15, -0.8])] },
  3: { loc: 'B', aperture: 0.010, keys: () => [k(shotStart(3), [0.4, 1.6, 3.0], [0, 1.25, -0.6]), k(beat(3, 'fiftyfifty', 0, 0.4), [-0.15, 1.45, 1.35], [-0.2, 1.15, -0.6])] },
  4: { loc: 'B', aperture: 0.010, keys: () => [k(shotStart(4), [-0.15, 1.45, 1.35], [-0.2, 1.15, -0.6]), k(beat(4, 'hammer', 0, 0.2), [0.0, 1.4, 0.9], [0.0, 1.1, -0.7]), k(beat(4, 'worse', 0, 0.4), [0.35, 1.35, 0.85], [0.45, 1.2, -0.65])] },
  5: { loc: 'B', aperture: 0.010, focus: 1.05, keys: () => [k(shotStart(5), [0.0, 1.4, 1.2], [-0.5, 1.1, -0.65]), k(beat(5, 'decayed', 0, 0.4), [-0.3, 1.22, 0.35], [-0.52, 1.08, -0.65])] },
  6: { loc: 'B', aperture: 0.010, keys: () => [k(shotStart(6), [0.9, 1.7, 2.6], [0, 1.35, -0.6]), k(beat(6, 'looks', 0, 0.3), [0.3, 1.6, 2.0], [0, 1.35, -0.6])] },
  7: { loc: 'B', aperture: 0.010, keys: () => [k(shotStart(7), [-0.3, 1.6, 2.2], [0, 1.35, -0.6]), k(beat(7, 'done', 0, 0.3), [0.3, 1.5, 1.6], [0.25, 1.3, -0.6])] },
  8: { loc: 'C', aperture: 0.012, keys: () => [k(shotStart(8), [-0.9, 1.6, 2.4], [-0.1, 1.3, -1.2]), k(beat(8, 'wrong', 0, 0.4), [-0.4, 1.55, 1.3], [-0.2, 1.35, -1.4])] },
  9: { loc: 'D', aperture: 0.010, keys: () => [k(shotStart(9), [-0.45, 1.5, 3.6], [-0.45, 0.9, -0.7]), k(beat(9, 'bumping', 0, 0.4), [0.1, 1.45, 3.0], [0.2, 0.9, -0.7])] },
  10: { loc: 'D', aperture: 0.010, keys: () => [k(shotStart(10), [0.7, 1.3, 2.4], [1.0, 0.75, -0.55]), k(beat(10, 'instantly', 0, 0.3), [0.95, 1.1, 1.5], [1.0, 0.72, -0.55])] },
  11: { loc: 'B', aperture: 0.010, keys: () => [k(shotStart(11), [0.6, 1.5, 1.9], [0.1, 1.25, -0.6]), k(beat(11, 'argue', 0, 0.4), [0.2, 1.75, 2.9], [0, 1.75, -2.4])] },
  12: { loc: 'A', aperture: 0.006, focus: 3.0, keys: () => [k(shotStart(12), [-0.15, 1.5, 3.3], [-0.15, 1.55, -2.0]), k(beat(12, 'physics', 0, 0.4), [-0.2, 1.6, 2.6], [-0.15, 1.6, -2.4])] },
};
// Lighting per location; the pivot (shot 9) is cooler.
export const LIGHTS = {
  A: { dir: [-5, 6, 7], key: '#ffe6bc', keyI: 2.6, sky: '#fff0d8', gnd: '#7a5a40', hemiI: 1.4, fog: ['#3a2e28', 60, 300], skyTint: '#ffffff', tint: '#fff8ee', lamp: 1.5, lampPos: [-0.6, 2.5, -0.6] },
  B: { dir: [-4, 6, 8], key: '#ffe8c4', keyI: 2.5, sky: '#f4f0e0', gnd: '#6a5a44', hemiI: 1.45, fog: ['#3a2e28', 60, 300], skyTint: '#ffffff', tint: '#fff8ee', lamp: 1.2, lampPos: [1.6, 2.5, 0.8] },
  C: { dir: [-6, 5, 6], key: '#ffdcae', keyI: 2.6, sky: '#fbe6c8', gnd: '#6a4a32', hemiI: 1.25, fog: ['#2c2622', 60, 300], skyTint: '#ffffff', tint: '#fff0e0', lamp: 2, lampPos: [-0.8, 1.6, -0.6] },
  D: { dir: [4, 6, 7], key: '#cfdcff', keyI: 2.0, sky: '#c9d8f0', gnd: '#3a4256', hemiI: 1.3, fog: ['#1a2236', 60, 300], skyTint: '#ffffff', tint: '#eef2fa', lamp: 2, lampPos: [0, 2.6, 0.5] },
};
export const SHOT_LIGHT = {
  8: { key: '#ffcf9a', keyI: 2.3, tint: '#ffe8d0' },
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
