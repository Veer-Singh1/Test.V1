// One continuous camera: eased moves between keys, a slow push-in while holding. No cuts.
import { CAMERA } from '../style';
import { clamp, easeInOut, lerp } from '../timeline';

type Num = number | ((t: number) => number);
export type Key = { t: number; x: Num; y: Num; z: number; dur?: number };
const val = (v: Num, t: number) => (typeof v === 'function' ? v(t) : v);

export function makeCamera(keys: Key[]) {
  const dur = (j: number) => {
    const a = keys[j - 1], b = keys[j];
    if (b.dur) return b.dur;
    const d = Math.hypot(val(b.x, b.t) - val(a.x, b.t), val(b.y, b.t) - val(a.y, b.t));
    return clamp(CAMERA.minMove + Math.abs(Math.log(b.z / a.z)) * 0.25 + d / 4000, CAMERA.minMove, CAMERA.maxMove);
  };
  const hold = (j: number, t: number) => { const k = keys[j]; const t0 = k.t + (j ? dur(j) : 0); return { x: val(k.x, t), y: val(k.y, t), z: k.z * (1 + CAMERA.drift * Math.max(0, t - t0)) }; };
  const camAt = (t: number) => {
    let i = 0; while (i + 1 < keys.length && keys[i + 1].t <= t) i++;
    const k = keys[i];
    if (i > 0 && t < k.t + dur(i)) {
      const from = hold(i - 1, t), fz = hold(i - 1, k.t).z, p = easeInOut((t - k.t) / dur(i));
      const z = Math.exp(lerp(Math.log(fz), Math.log(k.z), p));
      // when the zoom changes a lot, pan with 1/zoom so the target stays put on screen during the dive
      const u = Math.abs(Math.log(k.z / fz)) > 0.3 ? (1 / z - 1 / fz) / (1 / k.z - 1 / fz) : p;
      return { x: lerp(from.x, val(k.x, t), u), y: lerp(from.y, val(k.y, t), u), z };
    }
    return hold(i, t);
  };
  return { camAt, arrival: (j: number) => keys[j].t + (j ? dur(j) : 0) };
}
export const worldTransform = (cam: { x: number; y: number; z: number }) => `translate(${CAMERA.anchor[0]} ${CAMERA.anchor[1]}) scale(${cam.z}) translate(${-cam.x} ${-cam.y})`;
