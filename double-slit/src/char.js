// 2D flat people standing in the 3D world.
// Base design (never redesigned): large round head, calm half-lidded eyes, tiny smile,
// hair fringe, white collar, tie, small pear-shaped two-tone torso with a pocket patch,
// thin tapered stick limbs, dark disc hands, wobbly hand-drawn ink band around every shape.
// Variants: palette, hat (top, bowler, cap, none) and glasses only.
import * as THREE from 'three';
import { INK, rng, clamp, blob } from './kit.js';

const V = (x, y) => new THREE.Vector2(x, y);
export function circlePts(cx, cy, rx, ry = rx, n = 40, a0 = 0, a1 = Math.PI * 2) {
  const p = [];
  for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; p.push(V(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry)); }
  if (Math.abs(a1 - a0 - Math.PI * 2) < 1e-6) p.pop();
  return p;
}
export function limbPts(x0, y0, x1, y1, w0, w1, n = 8) {
  // tapered stick with round ends
  const dx = x1 - x0, dy = y1 - y0;
  const p = [];
  // end cap at (x1,y1) radius w1/2, start cap at (x0,y0) radius w0/2
  const ang = Math.atan2(dy, dx);
  for (let i = 0; i <= n; i++) { const a = ang - Math.PI / 2 + (Math.PI * i) / n; p.push(V(x1 + Math.cos(a) * w1 / 2, y1 + Math.sin(a) * w1 / 2)); }
  for (let i = 0; i <= n; i++) { const a = ang + Math.PI / 2 + (Math.PI * i) / n; p.push(V(x0 + Math.cos(a) * w0 / 2, y0 + Math.sin(a) * w0 / 2)); }
  return p;
}
function pearPts(cx, yb, yt, wb, wt, n = 48) {
  // pear: wide rounded bottom, narrower shoulders
  const p = [], h = yt - yb;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
    const k = 0.5 + 0.5 * s;
    const half = (wb / 2) * (1 - k) + (wt / 2) * k;
    const round = Math.pow(Math.abs(c), 0.8) * Math.sign(c);
    p.push(V(cx + round * half, yb + h * k));
  }
  return p;
}
// Offset a closed polygon outward with a wobbly, varying thickness (hand-drawn ink band).
export function inkBand(pts, base, seed) {
  const r = rng(seed);
  const ph = r() * 6.28, ph2 = r() * 6.28, n = pts.length;
  // centroid for winding / direction
  let cx = 0, cy = 0; pts.forEach((p) => { cx += p.x; cy += p.y; }); cx /= n; cy /= n;
  let area = 0; for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; area += a.x * b.y - b.x * a.y; }
  const sgn = area > 0 ? 1 : -1;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n];
    let tx = c.x - a.x, ty = c.y - a.y; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const nx = ty * sgn, ny = -tx * sgn;
    const k = i / n;
    const w = base * (1 + 0.28 * Math.sin(k * 6.28 * 3 + ph) + 0.14 * Math.sin(k * 6.28 * 7 + ph2));
    out.push(V(b.x + nx * w, b.y + ny * w));
  }
  return out;
}

export class Builder {
  constructor() { this.geos = []; this.z = 0; }
  add(pts, color, { inkW = 0.016, seed = 1, z } = {}) {
    const zz = z ?? (this.z += 0.0012);
    if (inkW > 0) this._poly(inkBand(pts, inkW, seed), INK, zz - 0.0006);
    this._poly(pts, color, zz);
  }
  _poly(pts, color, z) {
    const g = new THREE.ShapeGeometry(new THREE.Shape(pts), 1);
    g.translate(0, 0, z);
    const c = new THREE.Color(color), n = g.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.deleteAttribute('uv'); g.deleteAttribute('normal');
    this.geos.push(g);
  }
  build() {
    const pos = [], col = [], idx = [];
    let off = 0;
    for (const g of this.geos) {
      pos.push(...g.attributes.position.array); col.push(...g.attributes.color.array);
      const ix = g.index ? g.index.array : [...Array(g.attributes.position.count).keys()];
      for (const i of ix) idx.push(i + off);
      off += g.attributes.position.count;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    out.setIndex(idx);
    out.computeBoundingSphere();
    return out;
  }
}

export const CHAR_MAT = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });

export const PALETTES = {
  workerA: { skin: '#6b4430', hair: '#1f1715', top: '#3f6f8f', bottom: '#2b4a63', tie: '#2b4a63', pocket: '#5d8aa8', legs: '#33302e', shoes: '#241c1a' },
  workerB: { skin: '#8a5a3c', hair: '#221a17', top: '#8a7b4e', bottom: '#5e5434', tie: '#5e5434', pocket: '#a8996a', legs: '#3a3632', shoes: '#241c1a' },
  workerC: { skin: '#5a3626', hair: '#1a1412', top: '#a65a3a', bottom: '#6d3a26', tie: '#6d3a26', pocket: '#c27a58', legs: '#2f2c2a', shoes: '#241c1a' },
  workerD: { skin: '#7a4c34', hair: '#241b18', top: '#5d7b52', bottom: '#3e5536', tie: '#3e5536', pocket: '#7f9e72', legs: '#36322f', shoes: '#241c1a' },
  workerE: { skin: '#4e2f22', hair: '#18120f', top: '#c49a4a', bottom: '#8a6a2e', tie: '#8a6a2e', pocket: '#dcb86a', legs: '#33302d', shoes: '#241c1a' },
  workerF: { skin: '#94603f', hair: '#2a1f1a', top: '#6f6f7d', bottom: '#4a4a56', tie: '#4a4a56', pocket: '#9090a0', legs: '#2f2d2c', shoes: '#241c1a' },
  boss: { skin: '#f0d2b4', hair: '#6a4a32', top: '#4a4542', bottom: '#2f2b29', tie: '#8a2f2a', pocket: '#6a6460', legs: '#2c2826', shoes: '#1e1816' },
  host: { skin: '#a8714e', hair: '#2a1d18', top: '#f2f1ea', bottom: '#d6d6cc', tie: '#2b3a55', pocket: '#e2e2d8', legs: '#33384a', shoes: '#1f1a18' },
  official: { skin: '#ecd0b6', hair: '#8a8078', top: '#2f3d52', bottom: '#222c3c', tie: '#6b2d2a', pocket: '#4a5a72', legs: '#24232a', shoes: '#1a1716' },
};
export const WORKER_PALETTES = ['workerA', 'workerB', 'workerC', 'workerD', 'workerE', 'workerF'];

const GEO_CACHE = new Map();
function buildParts(pal, hat, glasses, seed) {
  const key = JSON.stringify([pal, hat, glasses, seed % 4]);
  if (GEO_CACHE.has(key)) return GEO_CACHE.get(key);
  const P = PALETTES[pal];
  const s = seed % 4;
  // ---- body (torso + head), z ~ 0
  const b = new Builder();
  const torso = pearPts(0, 0.56, 1.1, 0.46, 0.3);
  b.add(torso, P.top, { inkW: 0.018, seed: s + 1 });
  // two-tone: bottom band
  const band = torso.filter((p) => p.y < 0.72);
  band.push(V(0.2, 0.72), V(-0.2, 0.72));
  const bandPts = pearPts(0, 0.56, 1.1, 0.46, 0.3).map((p) => V(p.x, Math.min(p.y, 0.7)));
  b.add(bandPts, P.bottom, { inkW: 0, seed: s + 2 });
  b.add([V(-0.215, 0.70), V(0.215, 0.70), V(0.215, 0.715), V(-0.215, 0.715)], INK, { inkW: 0 });
  // pocket patch
  b.add([V(0.06, 0.88), V(0.15, 0.88), V(0.15, 0.97), V(0.06, 0.97)], P.pocket, { inkW: 0.008, seed: s + 3 });
  // collar + tie
  b.add([V(-0.11, 1.1), V(0.0, 1.0), V(0.0, 1.1)], '#f7f2e6', { inkW: 0.009, seed: s + 4 });
  b.add([V(0.0, 1.1), V(0.0, 1.0), V(0.11, 1.1)], '#f7f2e6', { inkW: 0.009, seed: s + 5 });
  b.add([V(-0.025, 1.04), V(0.025, 1.04), V(0.04, 0.84), V(0.0, 0.79), V(-0.04, 0.84)], P.tie, { inkW: 0.008, seed: s + 6 });
  // neck
  b.add(circlePts(0, 1.12, 0.06, 0.05, 16), P.skin, { inkW: 0.008, seed: s + 7, z: -0.0015 });
  // head
  const hy = 1.38, hr = 0.27;
  b.z += 0.0015;
  b.add(circlePts(0, hy, hr, hr * 0.97, 48), P.skin, { inkW: 0.02, seed: s + 8 });
  // ears
  b.add(circlePts(-hr * 0.98, hy - 0.02, 0.05, 0.065, 14), P.skin, { inkW: 0.01, seed: s + 9, z: b.z - 0.0009 });
  b.add(circlePts(hr * 0.98, hy - 0.02, 0.05, 0.065, 14), P.skin, { inkW: 0.01, seed: s + 10, z: b.z - 0.0009 });
  // hair cap with fringe
  if (hat !== 'top' && hat !== 'bowler') {
    const cap = [];
    for (let i = 0; i <= 24; i++) { const a = Math.PI * (0.03 + 0.94 * (i / 24)); cap.push(V(Math.cos(a) * (hr + 0.012), hy + Math.sin(a) * (hr + 0.012))); }
    // fringe edge (left to right along the forehead) with a few strands
    const fr = 5;
    for (let i = 0; i <= fr * 2; i++) {
      const x = -hr * 0.97 + (i / (fr * 2)) * hr * 1.94;
      const y = hy + 0.1 + (i % 2 ? -0.045 : 0.0) + 0.04 * Math.abs(x) / hr;
      cap.push(V(x, y));
    }
    b.add(cap.reverse(), P.hair, { inkW: 0.012, seed: s + 11 });
    // highlight
    b.add(circlePts(-0.09, hy + 0.2, 0.06, 0.018, 12), lightHex(P.hair), { inkW: 0, z: b.z + 0.0006 });
  }
  // eyes: calm, half-lidded (lower half-ellipse + lid line)
  for (const ex of [-0.095, 0.095]) {
    b.add(circlePts(ex, hy - 0.01, 0.045, 0.03, 14, Math.PI, Math.PI * 2), '#fbf6ea', { inkW: 0.006, seed: s + 12 });
    b.add(circlePts(ex + 0.006, hy - 0.022, 0.019, 0.017, 12), INK, { inkW: 0 });
    b.add([V(ex - 0.055, hy - 0.004), V(ex + 0.055, hy - 0.004), V(ex + 0.05, hy + 0.01), V(ex - 0.05, hy + 0.01)], INK, { inkW: 0 });
  }
  // eyebrows
  for (const ex of [-0.095, 0.095]) b.add([V(ex - 0.045, hy + 0.06), V(ex + 0.045, hy + 0.065), V(ex + 0.045, hy + 0.08), V(ex - 0.045, hy + 0.075)], P.hair === '#8a8078' ? '#5a5048' : INK, { inkW: 0 });
  // tiny smile
  const sm = [];
  for (let i = 0; i <= 10; i++) { const a = Math.PI * (1.2 + 0.6 * (i / 10)); sm.push(V(Math.cos(a) * 0.06, hy - 0.08 + Math.sin(a) * 0.035)); }
  for (let i = 10; i >= 0; i--) { const a = Math.PI * (1.2 + 0.6 * (i / 10)); sm.push(V(Math.cos(a) * 0.06, hy - 0.08 + 0.012 + Math.sin(a) * 0.028)); }
  b.add(sm, INK, { inkW: 0 });
  // cheeks
  const cheek = '#' + new THREE.Color(P.skin).lerp(new THREE.Color('#d8644e'), 0.35).getHexString();
  b.add(circlePts(-0.16, hy - 0.07, 0.035, 0.022, 12), cheek, { inkW: 0 });
  b.add(circlePts(0.16, hy - 0.07, 0.035, 0.022, 12), cheek, { inkW: 0 });
  // hats
  if (hat === 'top') {
    b.add([V(-0.34, hy + 0.2), V(0.34, hy + 0.2), V(0.34, hy + 0.25), V(-0.34, hy + 0.25)], '#262222', { inkW: 0.012, seed: s + 13 });
    b.add([V(-0.2, hy + 0.24), V(0.2, hy + 0.24), V(0.22, hy + 0.62), V(-0.22, hy + 0.62)], '#2c2828', { inkW: 0.014, seed: s + 14 });
    b.add([V(-0.205, hy + 0.3), V(0.205, hy + 0.3), V(0.207, hy + 0.35), V(-0.207, hy + 0.35)], '#7a2a26', { inkW: 0 });
  } else if (hat === 'bowler') {
    b.add([V(-0.36, hy + 0.17), V(0.36, hy + 0.17), V(0.33, hy + 0.23), V(-0.33, hy + 0.23)], '#2a2624', { inkW: 0.012, seed: s + 15 });
    b.add(circlePts(0, hy + 0.2, 0.25, 0.24, 30, 0, Math.PI), '#302b28', { inkW: 0.014, seed: s + 16 });
    b.add([V(-0.24, hy + 0.21), V(0.24, hy + 0.21), V(0.24, hy + 0.26), V(-0.24, hy + 0.26)], '#5a3a2a', { inkW: 0 });
  } else if (hat === 'cap') {
    b.add(circlePts(0, hy + 0.12, 0.27, 0.19, 30, 0, Math.PI), P.bottom, { inkW: 0.012, seed: s + 17 });
    b.add([V(0.0, hy + 0.11), V(0.4, hy + 0.1), V(0.38, hy + 0.15), V(0.0, hy + 0.16)], shadeHex(P.bottom), { inkW: 0.01, seed: s + 18 });
  }
  if (glasses) {
    for (const ex of [-0.095, 0.095]) {
      const o = circlePts(ex, hy - 0.01, 0.075, 0.062, 24), inner = circlePts(ex, hy - 0.01, 0.06, 0.048, 24);
      const ring = new THREE.Shape(o); ring.holes.push(new THREE.Path(inner));
      const g = new THREE.ShapeGeometry(ring, 1); g.translate(0, 0, b.z + 0.0012);
      const c = new THREE.Color(INK), n = g.attributes.position.count, col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.deleteAttribute('uv'); g.deleteAttribute('normal');
      b.geos.push(g);
    }
    b.add([V(-0.025, hy - 0.002), V(0.025, hy - 0.002), V(0.025, hy + 0.01), V(-0.025, hy + 0.01)], INK, { inkW: 0, z: b.z + 0.0014 });
  }
  const body = b.build();
  // ---- arm (pivot at shoulder = origin), hanging down
  const a = new Builder();
  a.add(limbPts(0, 0, 0.05, -0.4, 0.07, 0.05), P.top, { inkW: 0.012, seed: s + 20 });
  a.add(circlePts(0.055, -0.43, 0.05, 0.05, 18), '#3b2a26', { inkW: 0.01, seed: s + 21 });
  const arm = a.build();
  // ---- leg (pivot at hip)
  const l = new Builder();
  l.add(limbPts(0, 0, 0.0, -0.52, 0.085, 0.06), P.legs, { inkW: 0.013, seed: s + 22 });
  l.add(circlePts(0.035, -0.56, 0.085, 0.045, 18, 0, Math.PI * 2), P.shoes, { inkW: 0.011, seed: s + 23 });
  const leg = l.build();
  const out = { body, arm, leg };
  GEO_CACHE.set(key, out);
  return out;
}
function lightHex(h) { const c = new THREE.Color(h); c.lerp(new THREE.Color('#ffffff'), 0.28); return '#' + c.getHexString(); }
function shadeHex(h) { const c = new THREE.Color(h); c.multiplyScalar(0.8); return '#' + c.getHexString(); }

// Character instance. opts: palette, hat, glasses, seed, scale, face (base yaw), walk speed, props in hand.
export function makeChar({ palette = 'workerA', hat = 'none', glasses = false, seed = 1, scale = 1, face = 0 } = {}) {
  const parts = buildParts(palette, hat, glasses, seed);
  const root = new THREE.Group();
  const yawG = new THREE.Group();
  root.add(yawG);
  const bodyG = new THREE.Group();
  yawG.add(bodyG);
  bodyG.scale.setScalar(scale);
  const body = new THREE.Mesh(parts.body, CHAR_MAT);
  bodyG.add(body);
  const mk = (geo, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); const m = new THREE.Mesh(geo, CHAR_MAT); g.add(m); bodyG.add(g); return g; };
  const armL = mk(parts.arm, -0.15, 1.02, -0.012); armL.scale.x = -1;
  const armR = mk(parts.arm, 0.15, 1.02, -0.012);
  const legL = mk(parts.leg, -0.09, 0.62, -0.02); legL.scale.x = -1;
  const legR = mk(parts.leg, 0.09, 0.62, -0.02);
  const shadow = blob(0.75 * scale, 0.32 * scale);
  root.add(shadow);
  const r = rng(seed * 7 + 3);
  const st = {
    root, yawG, bodyG, armL, armR, legL, legR, face, scale,
    ph: r() * 6.28, rate: 0.9 + r() * 0.3, walk: 0, walkPh: r() * 6.28, armPose: null,
    held: null,
  };
  root.userData.char = st;
  return st;
}
// Put an object in the right hand (e.g. a brick, a placard). Object is attached to the arm group.
export function hold(st, obj, { side = 'R', x = 0.06, y = -0.45, z = 0.02 } = {}) {
  const arm = side === 'R' ? st.armR : st.armL;
  obj.position.set(x, y, z);
  arm.add(obj);
  st.held = obj;
}
// Animate: t seconds; camera position for turning toward camera (yaw clamped ~0.7 rad).
export function animChar(st, t, cam, { walking = 0, armUp = 0, armUpL = 0, nod = 1, point = 0 } = {}) {
  const { root, yawG, bodyG } = st;
  const w = t * st.rate + st.ph;
  // turn toward camera, limited yaw so never edge-on
  if (cam) {
    const wp = new THREE.Vector3(); root.getWorldPosition(wp);
    const parentYaw = root.parent ? new THREE.Euler().setFromQuaternion(root.parent.getWorldQuaternion(new THREE.Quaternion()), 'YXZ').y : 0;
    const want = Math.atan2(cam.x - wp.x, cam.z - wp.z) - parentYaw - root.rotation.y;
    let d = want - st.face; d = Math.atan2(Math.sin(d), Math.cos(d));
    yawG.rotation.y = st.face + clamp(d, -0.7, 0.7);
  }
  // idle bob, nod, arm sway; walking cycle
  const wk = walking;
  const stride = Math.sin(t * 7.2 + st.walkPh);
  bodyG.position.y = (0.012 * Math.sin(w * 2.1)) * (1 - wk) + wk * 0.03 * Math.abs(Math.cos(t * 7.2 + st.walkPh));
  bodyG.rotation.z = 0.02 * Math.sin(w * 1.3) * nod + wk * 0.03 * stride;
  st.legL.rotation.z = wk * 0.38 * stride;
  st.legR.rotation.z = -wk * 0.38 * stride;
  const sway = 0.06 * Math.sin(w * 1.7);
  st.armL.rotation.z = -(0.12 + sway) - wk * 0.35 * stride - armUpL * 2.3;
  st.armR.rotation.z = (0.12 + sway) - wk * 0.35 * stride + armUp * 2.3 + point * 1.35;
}
