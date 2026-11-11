// Shared kit: palette, painted textures, toon materials, ink outlines and model helpers.
// Every model is procedural (built in code). All UVs are in metres, so a texture's
// repeat = 1 / (metres per tile).
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

THREE.ColorManagement.enabled = false;

export const INK = '#351f22';
export const SIGN_FONT = '"Bebas Neue", "Arial Narrow", Impact, sans-serif';
export const HAND_FONT = '"Permanent Marker", "Comic Sans MS", cursive';

// ---------- random ----------
export function rng(seed = 1) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export function shade(hex, k) { // k<0 darker, k>0 lighter
  const c = new THREE.Color(hex);
  if (k < 0) c.multiplyScalar(1 + k); else c.lerp(new THREE.Color('#ffffff'), k);
  return '#' + c.getHexString();
}

// ---------- toon shading (3-band gradient) ----------
export const GRAD = (() => {
  const d = new Uint8Array([150, 205, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
})();

// ---------- painted canvas textures ----------
export function canvasTex(w, h, paint, { tile = 1, wrap = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  paint(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (wrap) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / tile, 1 / tile); }
  t.anisotropy = 8;
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

// Wear: stains, chips and scratches drawn over a base.
export function wear(g, w, h, seed, { stains = 10, chips = 16, scratches = 10, dark = '#2a1a14', light = '#ffffff', amount = 1 } = {}) {
  const r = rng(seed);
  for (let i = 0; i < stains * amount; i++) {
    const x = r() * w, y = r() * h, rad = (0.04 + r() * 0.14) * w;
    const grd = g.createRadialGradient(x, y, 0, x, y, rad);
    grd.addColorStop(0, hexA(dark, 0.10 + r() * 0.08));
    grd.addColorStop(1, hexA(dark, 0));
    g.fillStyle = grd;
    g.beginPath(); g.ellipse(x, y, rad, rad * (0.4 + r() * 0.8), r() * 3, 0, Math.PI * 2); g.fill();
  }
  // drip streaks
  for (let i = 0; i < stains * 0.5 * amount; i++) {
    const x = r() * w, y = r() * h * 0.5, len = (0.1 + r() * 0.35) * h;
    const grd = g.createLinearGradient(x, y, x, y + len);
    grd.addColorStop(0, hexA(dark, 0.12)); grd.addColorStop(1, hexA(dark, 0));
    g.fillStyle = grd; g.fillRect(x, y, 2 + r() * 5, len);
  }
  for (let i = 0; i < chips * amount; i++) {
    const x = r() * w, y = r() * h, s = (0.006 + r() * 0.02) * w;
    g.fillStyle = hexA(r() < 0.6 ? light : dark, 0.18 + r() * 0.2);
    g.beginPath();
    const n = 5 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2, rr = s * (0.5 + r() * 0.7);
      g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.fill();
  }
  g.lineCap = 'round';
  for (let i = 0; i < scratches * amount; i++) {
    const x = r() * w, y = r() * h, a = r() * Math.PI, l = (0.02 + r() * 0.07) * w;
    g.strokeStyle = hexA(r() < 0.5 ? light : dark, 0.12 + r() * 0.12);
    g.lineWidth = 1 + r() * 1.5;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
}
export function hexA(hex, a) {
  const c = new THREE.Color(hex);
  return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`;
}
function speckle(g, w, h, seed, n, cols, size = 2) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    g.fillStyle = cols[Math.floor(r() * cols.length)];
    const s = size * (0.5 + r());
    g.fillRect(r() * w, r() * h, s, s);
  }
}

const TEX = {};
export const tex = {
  plaster: (base = '#e9dcc0', seed = 1, tile = 2.5) => (TEX['pl' + base + seed + tile] ||= canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    speckle(g, w, h, seed, 900, [hexA(shade(base, -0.15), 0.25), hexA('#ffffff', 0.2)], 3);
    wear(g, w, h, seed, { stains: 9, chips: 14, scratches: 8 });
  }, { tile })),
  brick: (base = '#b4553a', mortar = '#d9c7a8', seed = 2, tile = 1.0) => (TEX['br' + base + mortar + seed] ||= canvasTex(512, 512, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = mortar; g.fillRect(0, 0, w, h);
    const rows = 13, bh = h / rows, bw = w / 4;
    for (let row = 0; row < rows; row++) {
      const off = row % 2 ? bw / 2 : 0;
      for (let k = -1; k < 5; k++) {
        g.fillStyle = shade(base, (r() - 0.5) * 0.22);
        g.fillRect(k * bw + off + 3, row * bh + 3, bw - 6, bh - 6);
      }
    }
    wear(g, w, h, seed + 5, { stains: 8, chips: 20, scratches: 6, amount: 0.8 });
  }, { tile })),
  corrugated: (base = '#8f9a92', seed = 3, tile = 1.2) => (TEX['co' + base + seed] ||= canvasTex(256, 512, (g, w, h) => {
    const n = 12;
    for (let i = 0; i < n; i++) {
      const grd = g.createLinearGradient((i / n) * w, 0, ((i + 1) / n) * w, 0);
      grd.addColorStop(0, shade(base, -0.12)); grd.addColorStop(0.5, shade(base, 0.12)); grd.addColorStop(1, shade(base, -0.12));
      g.fillStyle = grd; g.fillRect((i / n) * w, 0, w / n + 1, h);
    }
    wear(g, w, h, seed, { stains: 6, chips: 4, scratches: 3, dark: '#7a3b1c' });
  }, { tile })),
  planks: (base = '#a77a4f', seed = 4, tile = 1.2) => (TEX['pk' + base + seed] ||= canvasTex(512, 512, (g, w, h) => {
    const r = rng(seed);
    const n = 6;
    for (let i = 0; i < n; i++) {
      g.fillStyle = shade(base, (r() - 0.5) * 0.18);
      g.fillRect(0, (i / n) * h, w, h / n);
      g.strokeStyle = hexA(shade(base, -0.4), 0.35); g.lineWidth = 2;
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        const y = (i / n) * h + (h / n) * (0.2 + 0.6 * r());
        g.moveTo(0, y);
        for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * 0.02 + k) * 3);
        g.stroke();
      }
      g.fillStyle = hexA(shade(base, -0.5), 0.8); g.fillRect(0, (i / n) * h, w, 3);
    }
    wear(g, w, h, seed, { stains: 6, chips: 8, scratches: 12, amount: 0.8 });
  }, { tile })),
  dirt: (base = '#c8a77a', seed = 5, tile = 5) => (TEX['di' + base + seed] ||= canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const r = rng(seed);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = hexA(shade(base, (r() - 0.6) * 0.3), 0.35);
      g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 50, 6 + r() * 25, r() * 3, 0, 7); g.fill();
    }
    speckle(g, w, h, seed, 1500, [hexA('#6b4c32', 0.4), hexA('#f1dfbf', 0.5), hexA('#8a6a48', 0.4)], 3);
  }, { tile })),
  grass: (base = '#7fa25a', seed = 6, tile = 8) => (TEX['gr' + base + seed] ||= canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    g.fillStyle = hexA(shade(base, 0.12), 0.7); g.fillRect(0, 0, w / 2, h);
    speckle(g, w, h, seed, 2500, [hexA(shade(base, -0.25), 0.4), hexA(shade(base, 0.25), 0.4)], 3);
    wear(g, w, h, seed, { stains: 6, chips: 0, scratches: 0, dark: '#6b5a2a' });
  }, { tile })),
  concrete: (base = '#bdb6a8', seed = 7, tile = 2.5) => (TEX['cn' + base + seed] ||= canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    speckle(g, w, h, seed, 1400, [hexA('#ffffff', 0.25), hexA('#5a5248', 0.2)], 2);
    const r = rng(seed);
    g.strokeStyle = hexA('#4a3e34', 0.3); g.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y);
      for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 60; y += r() * 40; g.lineTo(x, y); }
      g.stroke();
    }
    wear(g, w, h, seed, { stains: 10, chips: 10, scratches: 4 });
  }, { tile })),
  tiles: (base = '#a9553c', seed = 8, tile = 1.0) => (TEX['ti' + base + seed] ||= canvasTex(256, 256, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = shade(base, -0.25); g.fillRect(0, 0, w, h);
    const rows = 6;
    for (let row = 0; row < rows; row++) for (let k = -1; k < 5; k++) {
      const off = row % 2 ? 32 : 0;
      g.fillStyle = shade(base, (r() - 0.5) * 0.2);
      g.beginPath();
      g.ellipse(k * 64 + off + 32, row * (h / rows) + 26, 30, 26, 0, 0, Math.PI);
      g.fill();
    }
    wear(g, w, h, seed, { stains: 5, chips: 6, scratches: 0 });
  }, { tile })),
  panel: (base = '#8a5a36', seed = 9, tile = 1.2) => (TEX['pa' + base + seed] ||= canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    g.strokeStyle = hexA(shade(base, -0.45), 0.8); g.lineWidth = 6; g.strokeRect(18, 18, w - 36, h - 36);
    g.strokeStyle = hexA(shade(base, 0.3), 0.5); g.lineWidth = 2; g.strokeRect(26, 26, w - 52, h - 52);
    wear(g, w, h, seed, { stains: 4, chips: 4, scratches: 6 });
  }, { tile })),
  wallpaper: (base = '#d9c9a0', stripe = '#c4b083', seed = 10, tile = 0.8) => (TEX['wp' + base + stripe + seed] ||= canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    g.fillStyle = stripe; for (let i = 0; i < 4; i++) g.fillRect(i * 64 + 20, 0, 16, h);
    wear(g, w, h, seed, { stains: 6, chips: 3, scratches: 3 });
  }, { tile })),
  flat: (base, seed = 11, tile = 1) => (TEX['fl' + base + seed] ||= canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    wear(g, w, h, seed, { stains: 4, chips: 4, scratches: 3, amount: 0.6 });
  }, { tile })),
};

// Labels: painted signs, chalk and paper. Returns a non-repeating texture.
export function labelTex({ w = 1024, h = 256, bg = '#efe2c0', fg = INK, border = null, lines = [], seed = 1, wearAmount = 0.7, chalk = false, paint }) {
  return canvasTex(w, h, (g) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
    if (chalk) {
      speckle(g, w, h, seed, 900, [hexA('#ffffff', 0.05), hexA('#000000', 0.12)], 3);
      const r = rng(seed);
      for (let i = 0; i < 10; i++) { // old smudges
        g.fillStyle = hexA('#ffffff', 0.04); g.beginPath();
        g.ellipse(r() * w, r() * h, 60 + r() * 120, 20 + r() * 40, r(), 0, 7); g.fill();
      }
    }
    if (border) { g.strokeStyle = border; g.lineWidth = Math.max(8, h * 0.05); g.strokeRect(g.lineWidth / 2 + 6, g.lineWidth / 2 + 6, w - g.lineWidth - 12, h - g.lineWidth - 12); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const L of lines) {
      g.font = `${L.weight || ''} ${L.size}px ${L.font || SIGN_FONT}`;
      g.fillStyle = L.color || fg;
      if (L.spacing) g.letterSpacing = L.spacing;
      g.fillText(L.text, (L.x ?? 0.5) * w, (L.y ?? 0.5) * h);
      g.letterSpacing = '0px';
    }
    if (paint) paint(g, w, h);
    if (!chalk && wearAmount > 0) wear(g, w, h, seed, { stains: 6, chips: 10, scratches: 8, amount: wearAmount });
  }, { wrap: false });
}

// ---------- materials ----------
const MATS = {};
export function toon(key, opts) {
  if (MATS[key]) return MATS[key];
  const m = new THREE.MeshToonMaterial({ gradientMap: GRAD, ...opts });
  MATS[key] = m;
  return m;
}
export const M = {
  plaster: (c = '#e9dcc0', s = 1) => toon('pl' + c + s, { map: tex.plaster(c, s) }),
  brick: (c = '#b4553a', s = 2) => toon('br' + c + s, { map: tex.brick(c, '#d9c7a8', s) }),
  corr: (c = '#8f9a92', s = 3) => toon('co' + c + s, { map: tex.corrugated(c, s) }),
  wood: (c = '#a77a4f', s = 4) => toon('wd' + c + s, { map: tex.planks(c, s) }),
  dirt: (c = '#c8a77a', s = 5) => toon('di' + c + s, { map: tex.dirt(c, s) }),
  grass: (c = '#7fa25a', s = 6) => toon('gr' + c + s, { map: tex.grass(c, s) }),
  concrete: (c = '#bdb6a8', s = 7) => toon('cn' + c + s, { map: tex.concrete(c, s) }),
  tiles: (c = '#a9553c', s = 8) => toon('ti' + c + s, { map: tex.tiles(c, s) }),
  panel: (c = '#8a5a36', s = 9) => toon('pa' + c + s, { map: tex.panel(c, s) }),
  paper: (c = '#f3ead2', s = 12) => toon('pp' + c + s, { map: tex.flat(c, s) }),
  flat: (c, s = 11) => toon('fl' + c + s, { map: tex.flat(c, s) }),
  wallpaper: (c, st, s = 10) => toon('wp' + c + st + s, { map: tex.wallpaper(c, st, s) }),
  label: (t) => new THREE.MeshToonMaterial({ gradientMap: GRAD, map: t }),
  dark: (c = '#3a2a26') => toon('dk' + c, { color: c }),
};
export const basic = (c, extra = {}) => new THREE.MeshBasicMaterial({ color: c, ...extra });

// ---------- ink outlines ----------
const HULLS = {};
export function hullMat(th) {
  const key = th.toFixed(4);
  if (HULLS[key]) return HULLS[key];
  const m = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = vec3(position) + normal * ${th.toFixed(4)};`);
  };
  m.customProgramCacheKey = () => 'hull' + key;
  HULLS[key] = m;
  return m;
}
export const LINE_MATS = [];
export function lineMat(px = 2.0) {
  const m = new LineMaterial({ color: INK, linewidth: px, worldUnits: false });
  m.fog = true;
  m.userData.basePx = px;
  LINE_MATS.push(m);
  return m;
}
const EDGE_MAT = lineMat(2.0);
const EDGE_MAT_THIN = lineMat(1.4);

// Mark a mesh for ink: a back-face hull now, edge lines baked later (static) or attached (dynamic).
export function ink(mesh, { hull = 0.02, edges = 32, dynamic = false, thin = false } = {}) {
  if (hull > 0) {
    const h = new THREE.Mesh(mesh.geometry, hullMat(hull));
    h.castShadow = false; h.receiveShadow = false;
    h.userData.isHull = true;
    mesh.add(h);
  }
  if (edges) {
    if (dynamic) {
      mesh.add(edgeLines(mesh.geometry, edges, thin));
    } else {
      mesh.userData.edges = edges;
      mesh.userData.thin = thin;
    }
  }
  return mesh;
}
export function edgeLines(geo, thresh = 32, thin = false) {
  const e = new THREE.EdgesGeometry(geo, thresh);
  const g = new LineSegmentsGeometry().setPositions(e.attributes.position.array);
  const l = new LineSegments2(g, thin ? EDGE_MAT_THIN : EDGE_MAT);
  l.userData.isLine = true;
  return l;
}
// Bake all static edge lines under root into two merged line objects (fewer draw calls).
export function bakeEdges(root) {
  root.updateMatrixWorld(true);
  const thick = [], thin = [];
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  root.traverse((o) => {
    if (o.isMesh && o.userData.edges && !o.userData.isHull) {
      const e = new THREE.EdgesGeometry(o.geometry, o.userData.edges);
      const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
      e.applyMatrix4(m);
      (o.userData.thin ? thin : thick).push(...e.attributes.position.array);
    }
  });
  for (const [arr, mat] of [[thick, EDGE_MAT], [thin, EDGE_MAT_THIN]]) {
    if (!arr.length) continue;
    const g = new LineSegmentsGeometry().setPositions(arr);
    const l = new LineSegments2(g, mat);
    l.userData.isLine = true;
    l.frustumCulled = false;
    root.add(l);
  }
}

// ---------- geometry helpers (UVs in metres) ----------
export function boxGeo(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  // face order: px, nx, py, ny, pz, nz (4 verts each)
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]);
  }
  return g;
}
export function mesh(geo, mat, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, cast = true, receive = true, inkOpts = {} } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  m.castShadow = cast; m.receiveShadow = receive;
  if (inkOpts !== false) ink(m, inkOpts);
  return m;
}
// Box resting on y (bottom at y).
export function box(w, h, d, mat, o = {}) {
  return mesh(boxGeo(w, h, d), mat, { ...o, y: (o.y || 0) + h / 2 });
}
export function cylGeo(r0, r1, h, seg = 16) {
  const g = new THREE.CylinderGeometry(r1, r0, h, seg, 1);
  const uv = g.attributes.uv, circ = Math.PI * (r0 + r1);
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * circ, uv.getY(i) * h);
  return g;
}
export function cyl(r0, r1, h, mat, o = {}) {
  return mesh(cylGeo(r0, r1, h, o.seg || 16), mat, { inkOpts: { hull: 0.02, edges: 60 }, ...o, y: (o.y || 0) + h / 2 });
}
export function plane(w, h, mat, o = {}) {
  const g = new THREE.PlaneGeometry(w, h);
  return mesh(g, mat, { inkOpts: false, cast: false, ...o });
}

// Wall with openings, extruded. Wall spans x in [-w/2, w/2], y in [0, h], front face at z=0, back at z=-t.
// openings: {x (centre), y (bottom), w, h, type: 'window' | 'door' | 'arch'}
export function wallGeo(w, h, t, openings = []) {
  const s = new THREE.Shape();
  const doors = openings.filter((o) => o.type === 'door').sort((a, b) => a.x - b.x);
  s.moveTo(-w / 2, 0);
  for (const d of doors) { // door = notch in the outline (not a hole touching the edge)
    s.lineTo(d.x - d.w / 2, 0); s.lineTo(d.x - d.w / 2, d.h); s.lineTo(d.x + d.w / 2, d.h); s.lineTo(d.x + d.w / 2, 0);
  }
  s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0);
  for (const o of openings) {
    if (o.type === 'door') continue;
    const p = new THREE.Path();
    if (o.type === 'arch') {
      const r = o.w / 2;
      p.moveTo(o.x - r, o.y); p.lineTo(o.x + r, o.y); p.lineTo(o.x + r, o.y + o.h - r);
      p.absarc(o.x, o.y + o.h - r, r, 0, Math.PI, false); p.lineTo(o.x - r, o.y);
    } else {
      p.moveTo(o.x - o.w / 2, o.y); p.lineTo(o.x + o.w / 2, o.y); p.lineTo(o.x + o.w / 2, o.y + o.h); p.lineTo(o.x - o.w / 2, o.y + o.h); p.lineTo(o.x - o.w / 2, o.y);
    }
    s.holes.push(p);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 10 });
  g.translate(0, 0, -t);
  return g;
}

// A facade: wall + reveals + sills + mullions + door panels + interior backdrop.
export function facade({ w, h, t = 0.3, mat, openings = [], interior = '#3b2f2a', frame = '#efe6d2', door = '#5b3b2a', sill = true, cornice = true, plinth = true, glowWindows = false }) {
  const g = new THREE.Group();
  g.add(mesh(wallGeo(w, h, t, openings), mat, { inkOpts: { hull: 0.025, edges: 30 } }));
  const frameMat = M.flat(frame, 21), doorMat = M.panel(door, 22);
  for (const o of openings) {
    if (o.type === 'door') {
      g.add(box(o.w, o.h, 0.06, doorMat, { x: o.x, y: 0, z: -t * 0.55 }));
      g.add(box(o.w + 0.16, 0.12, 0.12, frameMat, { x: o.x, y: o.h, z: 0.02 }));
      continue;
    }
    const back = new THREE.Mesh(new THREE.PlaneGeometry(o.w + 0.1, o.h + 0.1), glowWindows ? basic(interior) : M.flat(interior, 23));
    back.position.set(o.x, o.y + o.h / 2, -t - 0.25);
    g.add(back);
    if (o.type === 'window') {
      g.add(box(0.06, o.h, 0.06, frameMat, { x: o.x, y: o.y, z: -t * 0.5, inkOpts: { hull: 0.008, edges: 30, thin: true } }));
      g.add(box(o.w, 0.06, 0.06, frameMat, { x: o.x, y: o.y + o.h * 0.55, z: -t * 0.5, inkOpts: { hull: 0.008, edges: 30, thin: true } }));
      if (sill) g.add(box(o.w + 0.24, 0.08, t * 0.5 + 0.12, frameMat, { x: o.x, y: o.y - 0.08, z: 0.06 - t * 0.25, inkOpts: { hull: 0.012, edges: 30 } }));
    }
  }
  if (cornice) {
    g.add(box(w + 0.3, 0.18, t + 0.3, frameMat, { y: h - 0.18, z: -t / 2, inkOpts: { hull: 0.015, edges: 30 } }));
    g.add(box(w + 0.15, 0.1, t + 0.15, frameMat, { y: h - 0.32, z: -t / 2, inkOpts: { hull: 0.012, edges: 30 } }));
  }
  if (plinth) g.add(box(w + 0.08, 0.35, t + 0.08, M.concrete('#9d9486', 24), { z: -t / 2, inkOpts: { hull: 0.012, edges: 30 } }));
  return g;
}

// A simple building: four walls (front with openings), gable or flat roof.
export function building({ w, d, h, t = 0.3, mat, openings = [], sideOpenings = [], roof = 'gable', roofMat, rise = 1.6, overhang = 0.35, interior, glowWindows, frame, door }) {
  const g = new THREE.Group();
  const f = facade({ w, h, t, mat, openings, interior, glowWindows, frame, door });
  f.position.z = d / 2; g.add(f);
  const b = facade({ w, h, t, mat, openings: [], cornice: true, plinth: true, frame });
  b.position.z = -d / 2 + t; b.rotation.y = Math.PI; b.position.z = -d / 2; g.add(b);
  const sL = facade({ w: d - 2 * t, h, t, mat, openings: sideOpenings, interior, glowWindows, cornice: false, frame, door });
  sL.rotation.y = -Math.PI / 2; sL.position.x = -w / 2; g.add(sL);
  const sR = facade({ w: d - 2 * t, h, t, mat, openings: sideOpenings, interior, glowWindows, cornice: false, frame, door });
  sR.rotation.y = Math.PI / 2; sR.position.x = w / 2; g.add(sR);
  if (roof === 'gable') g.add(gableRoof(w + overhang * 2, d + overhang * 2, rise, roofMat || M.tiles(), h));
  else if (roof === 'flat') g.add(box(w + 0.2, 0.25, d + 0.2, roofMat || M.concrete(), { y: h, inkOpts: { hull: 0.02, edges: 30 } }));
  return g;
}
export function gableRoof(w, d, rise, mat, y0, axis = 'x') {
  // ridge runs along x by default
  const s = new THREE.Shape();
  s.moveTo(-d / 2, 0); s.lineTo(d / 2, 0); s.lineTo(0, rise); s.lineTo(-d / 2, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false });
  geo.translate(0, 0, -w / 2);
  geo.rotateY(Math.PI / 2);
  if (axis === 'z') geo.rotateY(Math.PI / 2);
  const m = mesh(geo, mat, { y: y0, inkOpts: { hull: 0.03, edges: 30 } });
  return m;
}
// Saw-tooth roof (mills): n teeth along z.
export function sawRoof(w, d, n, rise, mat, glassMat, y0) {
  const g = new THREE.Group();
  const step = d / n;
  for (let i = 0; i < n; i++) {
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.lineTo(step, 0); s.lineTo(step, rise); s.lineTo(0, 0);
    const geo = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false });
    geo.translate(0, 0, -w / 2); geo.rotateY(Math.PI / 2);
    // tooth i spans z in [d/2-(i+1)step, d/2-i*step]; sloped side faces +z, glazed vertical side faces -z
    const m = mesh(geo, mat, { y: y0, z: d / 2 - i * step, inkOpts: { hull: 0.03, edges: 30 } });
    g.add(m);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.4, rise * 0.8), glassMat);
    glass.position.set(0, y0 + rise * 0.45, d / 2 - (i + 1) * step - 0.02);
    glass.rotation.y = Math.PI;
    g.add(glass);
  }
  return g;
}
export function chimney(h, r0, r1, mat) {
  const g = new THREE.Group();
  g.add(cyl(r0, r1, h, mat, { seg: 20, inkOpts: { hull: 0.05, edges: 80 } }));
  g.add(cyl(r1 + 0.18, r1 + 0.18, 0.5, M.concrete('#8f8678', 31), { y: h - 0.5, seg: 20, inkOpts: { hull: 0.04, edges: 80 } }));
  g.add(cyl(r1 + 0.12, r1 + 0.12, 0.25, M.dark('#2e2422'), { y: h - 0.95, seg: 20, inkOpts: { hull: 0.03, edges: 80 } }));
  g.add(cyl(r0 + 0.4, r0 + 0.3, 1.2, M.concrete('#9b9182', 32), { seg: 20, inkOpts: { hull: 0.04, edges: 80 } }));
  return g;
}
export function lampPost(h = 4.2) {
  const g = new THREE.Group();
  const iron = M.dark('#2f3a3a');
  g.add(cyl(0.09, 0.06, h, iron, { seg: 10 }));
  g.add(box(0.7, 0.06, 0.06, iron, { y: h - 0.1, x: 0.3 }));
  const head = box(0.32, 0.36, 0.32, M.flat('#f2e2a8', 33), { y: h - 0.5, x: 0.6 });
  g.add(head);
  g.add(cyl(0.24, 0.02, 0.18, iron, { y: h - 0.16, x: 0.6, seg: 8 }));
  return g;
}
export function barrel(c = '#6c7b5a') {
  const g = new THREE.Group();
  g.add(cyl(0.3, 0.3, 0.9, M.flat(c, 34), { seg: 14 }));
  g.add(cyl(0.31, 0.31, 0.05, M.dark('#3c3a36'), { y: 0.2, seg: 14, inkOpts: { hull: 0.008, edges: 80 } }));
  g.add(cyl(0.31, 0.31, 0.05, M.dark('#3c3a36'), { y: 0.65, seg: 14, inkOpts: { hull: 0.008, edges: 80 } }));
  return g;
}
export function crate(s = 0.7, c = '#b08654', labelText) {
  const g = new THREE.Group();
  g.add(box(s, s, s, M.wood(c, 35)));
  if (labelText) {
    const t = labelTex({ w: 512, h: 256, bg: null, lines: [{ text: labelText, size: 120, color: INK }], wearAmount: 0.5 });
    const p = plane(s * 0.85, s * 0.42, new THREE.MeshToonMaterial({ gradientMap: GRAD, map: t, transparent: true }), { y: s * 0.5, z: s / 2 + 0.005 });
    g.add(p);
  }
  return g;
}
// A board on posts / wall with a painted label on its front face.
export function signBoard({ w, h, texture, depth = 0.08, frame = '#4a3226', posts = 0, postH = 1.2, postMat }) {
  const g = new THREE.Group();
  const board = box(w + 0.12, h + 0.12, depth, M.wood(frame, 36), { y: postH, inkOpts: { hull: 0.015, edges: 30 } });
  g.add(board);
  const face = plane(w, h, M.label(texture), { y: postH + (h + 0.12) / 2, z: depth / 2 + 0.004 });
  face.receiveShadow = true;
  g.add(face);
  g.userData.face = face;
  if (posts) {
    const pm = postMat || M.wood('#6e4a30', 37);
    g.add(box(0.12, postH + h * 0.6, 0.12, pm, { x: -w / 2 + 0.1, z: -0.08 }));
    g.add(box(0.12, postH + h * 0.6, 0.12, pm, { x: w / 2 - 0.1, z: -0.08 }));
  }
  return g;
}
// Write-on reveal: a plane whose visible width grows from the left (chalk being written).
export function revealPlane(texture, w, h, { mat } = {}) {
  const geo = new THREE.PlaneGeometry(w, h);
  geo.translate(w / 2, 0, 0);
  const m = new THREE.Mesh(geo, mat || new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  m.setReveal = (p) => {
    p = clamp(p, 0.0001, 1);
    for (let i = 1; i < pos.count; i += 2) { pos.setX(i, w * p); uv.setX(i, p); } // right-hand vertices
    pos.needsUpdate = true; uv.needsUpdate = true;
  };
  m.setReveal(1);
  return m;
}
// Distant hills: extruded wavy silhouettes, flat painted.
export function hills({ w = 300, h = 18, seed = 1, color = '#9fb08a', z = -120, y = 0, depth = 6 }) {
  const r = rng(seed);
  const s = new THREE.Shape();
  s.moveTo(-w / 2, -2);
  const n = 30;
  const ph = [r() * 6, r() * 6, r() * 6];
  for (let i = 0; i <= n; i++) {
    const x = -w / 2 + (i / n) * w;
    const yy = h * (0.55 + 0.25 * Math.sin(x * 0.03 + ph[0]) + 0.15 * Math.sin(x * 0.08 + ph[1]) + 0.05 * Math.sin(x * 0.23 + ph[2]));
    s.lineTo(x, yy);
  }
  s.lineTo(w / 2, -2); s.lineTo(-w / 2, -2);
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 4 });
  const m = new THREE.Mesh(geo, M.flat(color, 40 + seed));
  m.position.set(0, y, z);
  m.receiveShadow = false;
  ink(m, { hull: 0.15, edges: 70 });
  return m;
}
// Soft contact shadow blob texture/material shared by characters and props.
export const BLOB = (() => {
  const t = canvasTex(128, 128, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grd.addColorStop(0, 'rgba(40,24,20,0.55)'); grd.addColorStop(0.6, 'rgba(40,24,20,0.28)'); grd.addColorStop(1, 'rgba(40,24,20,0)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  }, { wrap: false });
  return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false });
})();
export function blob(w, d) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), BLOB);
  m.rotation.x = -Math.PI / 2; m.position.y = 0.012;
  m.renderOrder = 1;
  return m;
}
// Painted sky dome (vertical gradient with soft painted clouds).
export function skyDome(top = '#9cc3d6', horizon = '#f1dcb8', seed = 3) {
  const t = canvasTex(1024, 512, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, top); grd.addColorStop(0.47, horizon); grd.addColorStop(1, horizon);
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    const r = rng(seed);
    for (let i = 0; i < 26; i++) {
      const x = r() * w, y = h * (0.22 + r() * 0.2), cw = 60 + r() * 140;
      g.fillStyle = 'rgba(255,248,236,0.55)';
      for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + (k - 2) * cw * 0.3, y + Math.sin(k) * 6, cw * 0.35, cw * 0.12, 0, 0, 7); g.fill(); }
    }
  }, { wrap: false });
  t.wrapS = THREE.RepeatWrapping;
  const m = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, depthWrite: false }));
  m.renderOrder = -10;
  return m;
}
export { mergeGeometries };
