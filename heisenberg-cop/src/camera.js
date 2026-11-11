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
  1: { loc: 'A', aperture: 0.012, keys: () => [k(0, [1.0, 1.5, 1.2], [0.5, 1.5, -1.8]), k(beat(1, 'nonsense', 0, 0.3), [0.7, 1.55, 0.9], [-0.2, 1.65, -2.5])] },
  2: { loc: 'B', aperture: 0.010, keys: () => [k(shotStart(2), [-4.5, 1.5, 10.0], [-10.0, 0.9, 1.75]), k(beat(2, 'Heisenberg', 0, 0.3), [-2.0, 1.55, 9.0], [-2.4, 0.9, 1.75])] },
  3: { loc: 'B', aperture: 0.012, keys: () => [k(shotStart(3), [1.9, 1.55, 5.9], [0.5, 1.35, 2.4]), k(beat(3, 'going', 0, 0.3), [1.5, 1.5, 5.2], [0.45, 1.35, 2.4])] },
  4: { loc: 'B', aperture: 0.006, focus: 2.6, keys: () => [k(shotStart(4), [-1.1, 1.5, 4.8], [-0.1, 1.7, 0.9]), k(beat(4, 'am', 0, 0.3), [-0.8, 1.55, 4.1], [0.0, 1.85, 0.5])] },
  5: { loc: 'B', aperture: 0.012, keys: () => [k(shotStart(5), [0.3, 1.6, 5.4], [1.0, 1.45, 3.15]), k(beat(5, 'principle', 0, 0.3), [0.55, 1.55, 4.8], [1.0, 1.45, 3.15])] },
  6: { loc: 'B', aperture: 0.008, keys: () => [k(shotStart(6), [2.6, 1.9, 4.5], [4.6, 2.7, -5.4]), k(beat(6, 'defined', 0, 0.3), [3.5, 2.3, 1.6], [4.6, 2.9, -5.4])] },
  7: { loc: 'B', aperture: 0.008, keys: () => [k(shotStart(7), [3.5, 2.3, 1.6], [4.6, 2.9, -5.4]), k(beat(7, 'blurry', 0, 0.3), [3.95, 2.55, 0.2], [4.6, 2.9, -5.4])] },
  8: { loc: 'B', aperture: 0.012, keys: () => [k(shotStart(8), [1.8, 1.5, 4.6], [1.0, 1.0, 3.2]), k(beat(8, 'uncertain', 0, 0.3), [1.45, 1.4, 4.1], [1.0, 0.95, 3.25])] },
};
// Lighting per location; the pivot (shot 9) is cooler.
export const LIGHTS = {
  A: { dir: [-5, 6, 7], key: '#ffe6bc', keyI: 2.6, sky: '#fff0d8', gnd: '#7a5a40', hemiI: 1.4, fog: ['#3a2e28', 60, 300], skyTint: '#ffffff', tint: '#fff8ee', lamp: 1.5, lampPos: [-0.6, 2.5, -0.6] },
  B: { dir: [-6, 5, 7], key: '#ffd29a', keyI: 2.4, sky: '#eef0f8', gnd: '#6f7a52', hemiI: 1.5, fog: ['#e8dcc6', 40, 180], skyTint: '#ffe8d0', tint: '#fff6ea', lamp: 0 },
};
export const SHOT_LIGHT = {};
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
