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
  1: { loc: 'A', aperture: 0.012, keys: () => [k(0, [1.4, 1.45, 2.8], [1.3, 1.2, -0.6]), k(beat(1, 'Wrong', 0, 0.4), [1.6, 1.35, 2.2], [1.6, 0.95, -0.55])] },
  2: { loc: 'A', aperture: 0.010, keys: () => [k(shotStart(2), [0.0, 1.6, 1.8], [-0.9, 1.85, -3.0]), k(beat(2, 'nature', 0, 0.3), [-0.4, 1.75, 1.1], [-1.1, 1.9, -3.0])] },
  3: { loc: 'B', aperture: 0.008, keys: () => [k(shotStart(3), [0.0, 1.6, 2.8], [0, 1.6, -3.0]), k(beat(3, 'wave', 0, 0.3), [-0.7, 1.6, 1.4], [-1.25, 1.6, -3.0])] },
  4: { loc: 'B', aperture: 0.008, keys: () => [k(shotStart(4), [-0.7, 1.6, 1.4], [-1.25, 1.6, -3.0]), k(beat(4, 'momentum', 0, 0.4), [-1.1, 1.6, 0.4], [-1.25, 1.6, -3.0])] },
  5: { loc: 'B', aperture: 0.008, keys: () => [k(shotStart(5), [0.6, 1.6, 1.0], [1.25, 1.6, -3.0]), k(beat(5, 'opposite', 0, 0.3), [1.1, 1.6, 0.4], [1.25, 1.6, -3.0])] },
  6: { loc: 'C', aperture: 0.010, keys: () => [k(shotStart(6), [1.8, 1.5, 3.0], [0, 1.1, -2.0]), k(beat(6, 'snapshot', 0, 0.0), [0.4, 1.6, 1.4], [-1.2, 1.5, -2.6]), k(beat(6, 'same', 0, 0.3), [-1.25, 1.75, -0.4], [-1.9, 1.95, -2.7])] },
  7: { loc: 'D', aperture: 0.008, keys: () => [k(shotStart(7), [0.0, 1.6, 2.6], [-0.3, 1.6, -1.8]), k(beat(7, 'universe', 0, 0.4), [0.4, 1.5, 1.4], [0.7, 1.3, -2.0])] },
  8: { loc: 'A', aperture: 0.012, keys: () => [k(shotStart(8), [0.6, 1.55, 1.8], [0.0, 1.4, -1.0]), k(beat(8, 'fix', 1, 0.3), [0.35, 1.6, 1.2], [0.0, 1.5, -1.0])] },
};
// Lighting per location; the pivot (shot 9) is cooler.
export const LIGHTS = {
  A: { dir: [-5, 6, 7], key: '#ffe6bc', keyI: 2.6, sky: '#fff0d8', gnd: '#7a5a40', hemiI: 1.4, fog: ['#3a2e28', 60, 300], skyTint: '#ffffff', tint: '#fff8ee', lamp: 1.5, lampPos: [-0.6, 2.5, -0.6] },
  B: { dir: [5, 6, 7], key: '#dfe8ff', keyI: 2.1, sky: '#d6e2f4', gnd: '#4a5058', hemiI: 1.3, fog: ['#1c242a', 60, 300], skyTint: '#ffffff', tint: '#eef2f8', lamp: 1.5, lampPos: [0, 2.6, 0.5] },
  C: { dir: [-4, 6, 8], key: '#fff4e0', keyI: 2.6, sky: '#fff8ec', gnd: '#7a6a58', hemiI: 1.5, fog: ['#3a2e28', 60, 300], skyTint: '#ffffff', tint: '#ffffff', lamp: 1.5, lampPos: [0, 2.6, -0.4] },
  D: { dir: [4, 5, 6], key: '#cfd8ff', keyI: 2.0, sky: '#8a90c0', gnd: '#20203a', hemiI: 1.2, fog: ['#0b1026', 80, 400], skyTint: '#ffffff', tint: '#eef0ff', lamp: 0 },
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
