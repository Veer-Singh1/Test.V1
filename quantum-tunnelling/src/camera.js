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
  1: { loc: 'A', aperture: 0.012, keys: () => [k(0, [1.0, 1.5, 1.2], [0.5, 1.5, -1.8]), k(beat(1, 'impossible', 0, 0.3), [0.8, 1.55, 0.9], [0.3, 1.55, -2.0])] },
  2: { loc: 'B', aperture: 0.008, keys: () => [k(shotStart(2), [-2.0, 1.4, 6.5], [-2.0, 0.8, 0]), k(beat(2, 'back', 0, 0.3), [-1.4, 1.5, 5.6], [-1.6, 0.9, 0])] },
  3: { loc: 'B', aperture: 0.008, keys: () => [k(shotStart(3), [-1.0, 1.8, 5.4], [-0.6, 1.5, -0.3]), k(beat(3, 'crossing', 0, 0.3), [-1.6, 1.7, 5.0], [-1.5, 1.4, -0.1])] },
  4: { loc: 'C', aperture: 0.008, keys: () => [k(shotStart(4), [0.0, 1.7, 4.4], [-1.0, 1.4, -0.3]), k(beat(4, 'wall', 0, 0.3), [0.0, 1.65, 3.6], [0.0, 1.45, -0.3])] },
  5: { loc: 'C', aperture: 0.008, keys: () => [k(shotStart(5), [0.6, 1.6, 3.2], [0.5, 1.5, -0.3]), k(beat(5, 'through', 0, 0.3), [1.2, 1.6, 2.8], [1.4, 1.45, -0.3])] },
  6: { loc: 'C', aperture: 0.008, keys: () => [k(shotStart(6), [1.8, 1.5, 3.0], [2.0, 1.4, -0.3]), k(beat(6, 'tunnelling', 0, 0.4), [1.0, 1.9, 4.2], [1.0, 2.0, -1.5])] },
  7: { loc: 'A', aperture: 0.010, keys: () => [k(shotStart(7), [-0.2, 1.6, 2.0], [-0.9, 1.8, -3.0]), k(beat(7, 'twentyeight', 0, 0.2), [0.6, 1.6, 2.4], [-0.3, 1.7, -2.6]), k(beat(7, 'wall', 0, 0.3), [2.0, 1.5, 3.2], [3.3, 1.3, 0.2])] },
  8: { loc: 'D', aperture: 0.010, keys: () => [k(shotStart(8), [0.0, 1.2, 3.0], [0, 0.9, 0]), k(beat(8, 'fifteen', 0, 0.0), [-0.9, 1.3, 2.6], [-1.4, 1.2, -0.8]), k(beat(8, 'fuse', 0, 0.3), [-0.5, 1.25, 2.6], [-0.6, 0.95, -0.3])] },
  9: { loc: 'D', aperture: 0.010, keys: () => [k(shotStart(9), [0.6, 1.2, 2.6], [0, 0.9, 0]), k(beat(9, 'power', 0, 0.3), [0.2, 1.25, 2.0], [0, 1.1, 0])] },
  10: { loc: 'E', aperture: 0.010, keys: () => [k(shotStart(10), [-0.6, 1.75, 1.6], [-0.9, 0.95, -0.6]), k(beat(10, 'flash', 0, 0.3), [-0.4, 1.7, 1.4], [-0.9, 0.9, -0.6]), k(beat(10, 'microscope', 0, 0.4), [0.5, 1.6, 1.1], [0.9, 1.05, -0.8])] },
  11: { loc: 'A', aperture: 0.010, keys: () => [k(shotStart(11), [-0.2, 1.6, 2.0], [-1.0, 1.8, -3.0]), k(beat(11, 'odds', 0, 0.3), [-0.5, 1.7, 1.4], [-1.0, 1.8, -3.0])] },
  12: { loc: 'A', aperture: 0.010, keys: () => [k(shotStart(12), [-1.0, 1.5, 2.6], [-3.0, 1.3, -0.4]), k(beat(12, 'do', 0, 0.3), [-1.4, 1.5, 2.0], [-3.0, 1.35, -0.4])] },
};
// Lighting per location; the pivot (shot 9) is cooler.
export const LIGHTS = {
  A: { dir: [-5, 6, 7], key: '#ffe6bc', keyI: 2.6, sky: '#fff0d8', gnd: '#7a5a40', hemiI: 1.4, fog: ['#3a2e28', 60, 300], skyTint: '#ffffff', tint: '#fff8ee', lamp: 1.5, lampPos: [-0.6, 2.5, -0.6] },
  B: { dir: [-6, 9, 6], key: '#fff0d0', keyI: 2.6, sky: '#eef4ff', gnd: '#6f7a52', hemiI: 1.6, fog: ['#e2ead8', 35, 180], skyTint: '#ffffff', tint: '#ffffff', lamp: 0 },
  C: { dir: [5, 6, 7], key: '#dfe8ff', keyI: 2.1, sky: '#d6e2f4', gnd: '#4a5058', hemiI: 1.3, fog: ['#1c242a', 60, 300], skyTint: '#ffffff', tint: '#eef2f8', lamp: 1.5, lampPos: [0, 2.8, 0.5] },
  D: { dir: [-3, 6, 6], key: '#ffb35a', keyI: 2.4, sky: '#ffd08a', gnd: '#a0401a', hemiI: 1.5, fog: ['#c2410c', 80, 400], skyTint: '#ffffff', tint: '#fff0dc', lamp: 0 },
  E: { dir: [-4, 6, 8], key: '#ffe2b4', keyI: 2.5, sky: '#fff0d8', gnd: '#7a5a40', hemiI: 1.4, fog: ['#3a2e28', 60, 300], skyTint: '#ffffff', tint: '#fff8ee', lamp: 1.5, lampPos: [0, 2.5, -0.4] },
};
export const SHOT_LIGHT = {
  12: { dir: [-8, 4.5, 1.5], key: '#ffd08a', keyI: 3.2, hemiI: 1.2 },
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
