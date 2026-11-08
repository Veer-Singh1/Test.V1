// Shared set helpers (series kit): rooms, chalkboards, signs, the electron character.
import * as THREE from 'three';
import {
  INK, SIGN_FONT, HAND_FONT, M, tex, toon, GRAD, labelTex, canvasTex, box, cyl, plane, mesh, boxGeo, ink, edgeLines, bakeEdges,
  facade, building, gableRoof, lampPost, barrel, crate, signBoard, revealPlane, hills, skyDome, rng, lerp, clamp, smooth, basic, blob, hexA,
} from './kit.js';
import { makeChar, animChar, Builder, circlePts, limbPts, CHAR_MAT } from './char.js';
import { beat, shotStart, shotEnd } from './timing.js';

const V = (x, y) => new THREE.Vector2(x, y);

// ---------- shared helpers ----------
function chalkTex(lines, { w = 1024, h = 640, seed = 1, bg = '#2f3b33', paint } = {}) {
  return labelTex({ w, h, bg, chalk: true, seed, paint, lines: lines.map((L) => ({ font: HAND_FONT, color: '#f2efe4', ...L })) });
}
function chalkboard(w, h, texture, { frame = '#7a5636' } = {}) {
  const g = new THREE.Group();
  g.add(box(w + 0.12, h + 0.12, 0.05, M.wood(frame, 56), { inkOpts: { hull: 0.012, edges: 30 } }));
  g.add(plane(w, h, new THREE.MeshToonMaterial({ gradientMap: GRAD, map: texture }), { y: (h + 0.12) / 2, z: 0.03 }));
  g.add(box(w, 0.05, 0.1, M.wood(frame, 56), { y: 0.0, z: 0.06 })); // chalk ledge
  g.userData.faceY = (h + 0.12) / 2;
  return g;
}
// transparent overlay drawn with a canvas painter, written on from the left
function chalkOverlay(w, h, paint, { px = 512 } = {}) {
  const t = labelTex({ w: Math.round(px * (w / h)), h: px, bg: null, wearAmount: 0, paint });
  return revealPlane(t, w, h);
}
function chalkText(text, w, h, size, color = '#f4f1e6') {
  return chalkOverlay(w, h, (g, W, H) => {
    g.font = `${size}px ${HAND_FONT}`; g.fillStyle = color; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText(text, 8, H / 2);
  }, { px: 256 });
}
// A room: floor, back wall (with openings), side walls, ceiling, wainscot.
function room({ w = 8, d = 6, h = 3.4, wall, floor, ceil = '#d8cdb6', backOpenings = [], leftOpenings = [], rightOpenings = [], wainscot = '#6e4e34', interior = '#f6e8c4', doorPanels = true }) {
  const G = new THREE.Group();
  const fl = plane(w, d, floor, { rx: -Math.PI / 2 });
  fl.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = i % 2 ? v * d : v * w; });
  fl.receiveShadow = true; G.add(fl);
  const back = facade({ w, h, t: 0.2, mat: wall, openings: backOpenings, cornice: false, plinth: false, interior, glowWindows: true, doorPanels });
  back.position.z = -d / 2; G.add(back);
  const left = facade({ w: d, h, t: 0.2, mat: wall, openings: leftOpenings, cornice: false, plinth: false, interior, glowWindows: true });
  left.rotation.y = Math.PI / 2; left.position.x = -w / 2; G.add(left);
  const right = facade({ w: d, h, t: 0.2, mat: wall, openings: rightOpenings, cornice: false, plinth: false, interior, glowWindows: true });
  right.rotation.y = -Math.PI / 2; right.position.x = w / 2; G.add(right);
  const c = plane(w, d + 4, M.flat(ceil, 130), { rx: Math.PI / 2, y: h, z: 2 }); c.castShadow = true; G.add(c);
  G.add(box(w, 0.9, 0.05, M.panel(wainscot, 131), { y: 0, z: -d / 2 + 0.03, inkOpts: { hull: 0.008, edges: 30 } }));
  G.add(box(w, 0.06, 0.08, M.wood(wainscot, 132), { y: 0.9, z: -d / 2 + 0.05 }));
  G.add(box(w, 0.14, 0.14, M.flat('#efe4c8', 133), { y: h - 0.14, z: -d / 2 + 0.07 }));
  return G;
}
function pendant(x, y, z, color = '#3f6a4a') {
  const g = new THREE.Group();
  g.add(cyl(0.01, 0.01, 0.8, M.dark('#2e2a28'), { y: y + 0.2, seg: 6, inkOpts: { hull: 0, edges: 0 } }));
  g.add(cyl(0.34, 0.1, 0.22, M.flat(color, 145), { y, seg: 18 }));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), basic('#fff3c8')); bulb.position.y = y - 0.03; g.add(bulb);
  g.position.set(x, 0, z);
  return g;
}
function bench(w, d, h = 0.9, top = '#3f4f4a', legs = '#5a5a56') {
  const g = new THREE.Group();
  g.add(box(w, 0.07, d, M.flat(top, 150), { y: h - 0.07 }));
  g.add(box(w - 0.1, h - 0.07, d - 0.1, M.panel(legs, 151), { inkOpts: { hull: 0.012, edges: 30 } }));
  return g;
}
function hangingSign(text, w, h, { bg = '#efe2c0', fg = INK, size = 160, rod = 0.5 } = {}) {
  const g = new THREE.Group();
  const t = labelTex({ w: Math.round(512 * w / h), h: 512, bg, fg, border: INK, lines: [{ text, size, y: 0.54, color: fg, spacing: '6px' }] });
  const s = signBoard({ w, h, texture: t, frame: '#4a3226', postH: 0 });
  g.add(s);
  for (const x of [-w / 2 + 0.1, w / 2 - 0.1]) g.add(cyl(0.008, 0.008, rod, M.dark('#2e2a28'), { x, y: h + 0.1, seg: 5, inkOpts: { hull: 0, edges: 0 } }));
  return g;
}

// Moving groups need live edge lines (baked lines would stay where the group started).
function makeDynamic(group) {
  group.traverse((o) => {
    if (o.isMesh && o.userData.edges && !o.userData.isHull) { o.add(edgeLines(o.geometry, o.userData.edges, o.userData.thin)); delete o.userData.edges; }
  });
  return group;
}

// ---------- the electron (a cartoon prop character, not the base person design) ----------
const GLOW = (() => {
  const t = canvasTex(128, 128, (g, w, h) => {
    const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    r.addColorStop(0, 'rgba(140,220,255,0.75)'); r.addColorStop(0.45, 'rgba(90,190,255,0.28)'); r.addColorStop(1, 'rgba(90,190,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, h);
  }, { wrap: false });
  return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
})();
function makeElectron(seed = 1, scale = 1) {
  const root = new THREE.Group(), yawG = new THREE.Group(), bodyG = new THREE.Group();
  root.add(yawG); yawG.add(bodyG); bodyG.scale.setScalar(scale);
  const cy = 0.52, r = 0.3;
  const b = new Builder();
  b.add(circlePts(0, cy, r, r, 48), '#4fb0ea', { inkW: 0.018, seed });
  b.add(circlePts(-0.09, cy + 0.12, 0.12, 0.07, 20), '#a8ddf8', { inkW: 0 });
  b.add([V(-0.085, cy - 0.17), V(0.085, cy - 0.17), V(0.085, cy - 0.125), V(-0.085, cy - 0.125)], '#f4fbff', { inkW: 0.006, seed: seed + 1 });
  for (const ex of [-0.105, 0.105]) b.add([V(ex - 0.1, cy + 0.075), V(ex + 0.1, cy + 0.075), V(ex + 0.075, cy - 0.025), V(ex - 0.075, cy - 0.025)], '#17171c', { inkW: 0.006, seed: seed + 2 });
  b.add([V(-0.03, cy + 0.06), V(0.03, cy + 0.06), V(0.03, cy + 0.04), V(-0.03, cy + 0.04)], '#17171c', { inkW: 0 });
  b.add([V(-0.18, cy + 0.06), V(-0.15, cy + 0.06), V(-0.18, cy + 0.0), V(-0.21, cy + 0.0)], '#ffffff', { inkW: 0 });
  const sm = [];
  for (let i = 0; i <= 10; i++) { const a = Math.PI * (1.25 + 0.45 * (i / 10)); sm.push(V(0.03 + Math.cos(a) * 0.07, cy - 0.06 + Math.sin(a) * 0.03)); }
  for (let i = 10; i >= 0; i--) { const a = Math.PI * (1.25 + 0.45 * (i / 10)); sm.push(V(0.03 + Math.cos(a) * 0.07, cy - 0.06 + 0.012 + Math.sin(a) * 0.024)); }
  b.add(sm, INK, { inkW: 0 });
  const body = new THREE.Mesh(b.build(), CHAR_MAT); bodyG.add(body);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), GLOW); glow.position.set(0, cy, -0.03); bodyG.add(glow);
  const limb = (x0, y0, x1, y1, w0, w1, end, endCol) => {
    const L = new Builder(); L.add(limbPts(x0, y0, x1, y1, w0, w1), '#2a3240', { inkW: 0.008, seed });
    L.add(end, endCol, { inkW: 0.008, seed: seed + 3 });
    return L.build();
  };
  const mk = (geo, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); g.add(new THREE.Mesh(geo, CHAR_MAT)); bodyG.add(g); return g; };
  const legGeo = limb(0, 0, 0, -0.2, 0.045, 0.04, circlePts(0.03, -0.225, 0.065, 0.035, 14), '#1d1a1a');
  const armGeo = limb(0, 0, 0.03, -0.2, 0.04, 0.035, circlePts(0.035, -0.225, 0.04, 0.04, 12), '#2a2a30');
  const legL = mk(legGeo, -0.1, 0.25, -0.01); legL.scale.x = -1;
  const legR = mk(legGeo, 0.1, 0.25, -0.01);
  const armL = mk(armGeo, -0.27, cy - 0.02, -0.01); armL.scale.x = -1;
  const armR = mk(armGeo, 0.27, cy - 0.02, -0.01);
  // sweat drop
  const d = new Builder();
  const drop = [];
  for (let i = 0; i <= 16; i++) { const a = Math.PI * 2 * (i / 16) - Math.PI / 2; const rr = 0.035; drop.push(V(Math.cos(a) * rr, Math.sin(a) * rr + (Math.sin(a) > 0.6 ? (Math.sin(a) - 0.6) * 0.1 : 0))); }
  d.add(drop, '#bfe8ff', { inkW: 0.006, seed: seed + 5 });
  const sweat = new THREE.Mesh(d.build(), CHAR_MAT); sweat.position.set(0.27, cy + 0.27, 0.01); sweat.visible = false; bodyG.add(sweat);
  const shadow = blob(0.5 * scale, 0.22 * scale); root.add(shadow);
  return { root, yawG, bodyG, legL, legR, armL, armR, sweat, glow, face: 0 };
}
function animElectron(e, t, cam, { strut = 0, nervous = 0, pose = 0, face = 0 } = {}) {
  if (cam) {
    const wp = new THREE.Vector3(); e.root.getWorldPosition(wp);
    let d = Math.atan2(cam.x - wp.x, cam.z - wp.z) - e.root.rotation.y - face;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    e.yawG.rotation.y = face + clamp(d, -0.7, 0.7);
  }
  const st = Math.sin(t * 8.5);
  e.bodyG.position.y = 0.02 * Math.sin(t * 2.3) + strut * 0.04 * Math.abs(Math.cos(t * 8.5));
  e.bodyG.position.x = nervous * 0.012 * Math.sin(t * 47);
  e.bodyG.rotation.z = strut * 0.08 * st;
  e.legL.rotation.z = strut * 0.45 * st; e.legR.rotation.z = -strut * 0.45 * st;
  e.armL.rotation.z = -0.25 - strut * 0.4 * st - pose * 2.2;
  e.armR.rotation.z = 0.25 - strut * 0.4 * st + pose * 2.2;
  e.sweat.visible = nervous > 0.5;
  if (e.sweat.visible) e.sweat.position.y = 0.52 + 0.27 - ((t * 0.6) % 0.25);
}



// ---------- the host's lab (shared by the whole series) ----------
// Returns the room group plus the host and the chalkboard face position for per-short chalk.
function hostLab({ title, seed = 19 }) {
  const W = 8, D = 6;
  const G = room({ w: W, d: D, h: 3.4, wall: M.plaster('#d9d6c4', 201), floor: M.wood('#7d5a3c', 202), leftOpenings: [{ type: 'window', x: 0.3, y: 0.95, w: 1.4, h: 1.6 }], wainscot: '#5a6a5e' });
  const doorSign = hangingSign('LAB', 0.9, 0.32, { size: 230, rod: 0.0 }); doorSign.position.set(2.3, 2.3, -D / 2 + 0.05); G.add(doorSign);
  const BW = 3.8, BH = 1.55, BX = -0.6, BY = 1.05, BZ = -D / 2 + 0.06;
  const cb = chalkboard(BW, BH, chalkTex([{ text: title, size: 82, y: 0.12 }], { w: 1600, h: 650, seed }));
  cb.position.set(BX, BY, BZ); G.add(cb);
  const lb = bench(2.6, 0.8); lb.position.set(-0.6, 0, -1.0); G.add(lb);
  for (let i = 0; i < 4; i++) G.add(box(0.07 + (i % 2) * 0.02, 0.26 - i * 0.02, 0.2, M.flat(['#7a2f2a', '#2f4a5e', '#5e6a3a', '#a07a3a'][i], 220 + i), { x: -1.75 + i * 0.09, y: 0.9, z: -1.05, inkOpts: { hull: 0.004, edges: 30, thin: true } }));
  const posterT = labelTex({ w: 600, h: 800, bg: '#efe6cc', seed: 12, lines: [{ text: 'SAFETY', size: 120, y: 0.12, color: '#8a2a22' }, { text: 'FIRST', size: 120, y: 0.26, color: '#8a2a22' }],
    paint: (g, w, h) => { g.strokeStyle = INK; g.lineWidth = 10; g.beginPath(); g.arc(w / 2, h * 0.62, 150, 0, 7); g.stroke(); g.beginPath(); g.moveTo(w / 2, h * 0.5); g.lineTo(w / 2, h * 0.66); g.stroke(); g.beginPath(); g.arc(w / 2, h * 0.73, 10, 0, 7); g.fill(); } });
  G.add(plane(0.6, 0.8, M.label(posterT), { x: 1.85, y: 1.75, z: -D / 2 + 0.03 }));
  G.add(pendant(-0.6, 2.9, -0.6)); G.add(pendant(2.0, 2.9, 0.6, '#6a3f3a'));
  const host = makeChar({ palette: 'host', hat: 'none', glasses: true, seed: 701, face: 0 }); G.add(host.root);
  return { G, host, board: { x0: BX - BW / 2, x1: BX + BW / 2, faceY: BY + cb.userData.faceY, faceZ: BZ + 0.035, BX, BW } };
}

export const LOC = { A: 0, B: 60 };

// ============ A: host's lab ============
function locLab() {
  const { G, host, board } = hostLab({ title: 'UNCERTAINTY PRINCIPLE' });
  const f = chalkText('Δx · Δp ≥ ħ/2', 1.9, 0.42, 170, '#ffd36a'); f.position.set(board.x0 + 0.25, board.faceY - 0.15, board.faceZ + 0.003); G.add(f);
  bakeEdges(G);
  return {
    group: G,
    update(t, camPos) {
      host.root.position.set(1.2, 0, -1.2);
      animChar(host, t, camPos, {});
      f.setReveal(smooth(0.6, 2.4, t));
    },
  };
}

// ---------- cars ----------
function car({ body = '#3aa6a0', trim = '#e9e2cf', police = false }) {
  const g = new THREE.Group();
  const bm = M.flat(body, police ? 701 : 702);
  g.add(box(3.6, 0.72, 1.7, bm, { y: 0.32, inkOpts: { hull: 0.02, edges: 30 } }));
  if (police) { for (const zz of [0.851, -0.851]) { const door = plane(1.5, 0.6, M.flat('#1e2228', 703), { x: 0.05, y: 0.68, z: zz, ry: zz > 0 ? 0 : Math.PI }); g.add(door); } }
  // cabin: roof + pillars + windshields (side windows open so the driver shows)
  g.add(box(1.9, 0.07, 1.5, bm, { x: -0.25, y: 1.72, inkOpts: { hull: 0.01, edges: 30 } }));
  for (const x of [0.65, -0.25, -1.15]) for (const z of [0.7, -0.7]) g.add(box(0.08, 0.68, 0.08, bm, { x, y: 1.04, z, inkOpts: { hull: 0.006, edges: 30, thin: true } }));
  const glass = new THREE.MeshBasicMaterial({ color: '#bfe3ef', transparent: true, opacity: 0.35, depthWrite: false });
  const ws = plane(1.45, 0.72, glass, { x: 0.68, y: 1.39, ry: Math.PI / 2, rz: 0 }); ws.rotation.set(0, Math.PI / 2, 0); g.add(ws);
  const rw = plane(1.45, 0.66, glass, { x: -1.18, y: 1.39, ry: -Math.PI / 2 }); g.add(rw);
  // wheels
  for (const x of [1.15, -1.15]) for (const z of [0.82, -0.82]) {
    const w = cyl(0.33, 0.33, 0.24, M.dark('#1c1c1e'), { seg: 18, inkOpts: { hull: 0.01, edges: 80 } }); w.rotation.x = Math.PI / 2; w.position.set(x, 0.33, z + (z > 0 ? -0.12 : 0.12)); g.add(w);
    const hub = cyl(0.15, 0.15, 0.02, M.flat('#c9ccd0', 704), { seg: 14, inkOpts: { hull: 0, edges: 0 } }); hub.rotation.x = Math.PI / 2; hub.position.set(x, 0.33, z + (z > 0 ? 0.01 : -0.01)); g.add(hub);
  }
  // lights + bumpers
  for (const z of [0.55, -0.55]) { g.add(box(0.05, 0.16, 0.3, basic('#fff6c8'), { x: 1.81, y: 0.72, z, inkOpts: { hull: 0, edges: 30, thin: true } })); g.add(box(0.05, 0.14, 0.26, basic('#d23a2a'), { x: -1.81, y: 0.72, z, inkOpts: { hull: 0, edges: 30, thin: true } })); }
  g.add(box(0.12, 0.14, 1.75, M.flat(trim, 705), { x: 1.82, y: 0.32, inkOpts: { hull: 0.006, edges: 30, thin: true } }));
  g.add(box(0.12, 0.14, 1.75, M.flat(trim, 705), { x: -1.82, y: 0.32, inkOpts: { hull: 0.006, edges: 30, thin: true } }));
  let bar = null;
  if (police) {
    const tPol = labelTex({ w: 900, h: 220, bg: null, wearAmount: 0, lines: [{ text: 'POLICE', size: 180, y: 0.56, color: '#f4f1e6', spacing: '14px' }] });
    const pm = new THREE.MeshBasicMaterial({ map: tPol, transparent: true });
    g.add(plane(1.2, 0.3, pm, { x: 0.05, y: 0.7, z: 0.86 }));
    bar = { red: new THREE.MeshBasicMaterial({ color: '#5a1010' }), blue: new THREE.MeshBasicMaterial({ color: '#10205a' }) };
    g.add(box(0.3, 0.14, 0.55, bar.red, { x: -0.25, y: 1.79, z: 0.32, inkOpts: { hull: 0.006, edges: 30, thin: true } }));
    g.add(box(0.3, 0.14, 0.55, bar.blue, { x: -0.25, y: 1.79, z: -0.32, inkOpts: { hull: 0.006, edges: 30, thin: true } }));
  }
  return { g, bar };
}

// ============ B: the road ============
function locRoad() {
  const G = new THREE.Group();
  const grass = plane(200, 120, M.grass('#86a85e', 711), { rx: -Math.PI / 2 }); grass.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = i % 2 ? v * 120 : v * 200; }); grass.receiveShadow = true; G.add(grass);
  const road = plane(200, 7, M.concrete('#5a5c60', 712), { rx: -Math.PI / 2, y: 0.01 }); road.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = i % 2 ? v * 7 : v * 200; }); road.receiveShadow = true; G.add(road);
  const white = basic('#ecebe2'), yellow = basic('#e9c44a');
  for (let i = -40; i < 40; i++) { const d = plane(2.0, 0.14, white, { rx: -Math.PI / 2, x: i * 4, y: 0.02 }); d.receiveShadow = false; G.add(d); }
  for (const z of [3.3, -3.3]) { const l = plane(200, 0.14, yellow, { rx: -Math.PI / 2, y: 0.02, z }); G.add(l); }
  G.add(box(200, 0.15, 1.6, M.concrete('#b4ab9b', 713), { y: 0, z: -4.3, inkOpts: { hull: 0, edges: 0 } }));
  // far side: houses, trees, lamp posts
  const r = rng(7);
  for (let i = 0; i < 9; i++) {
    const h = building({ w: 5 + r() * 2, d: 5, h: 2.8 + r() * 0.8, mat: M.plaster(['#e8d2a8', '#d9c7a4', '#e6c9a0', '#cfd3bf'][i % 4], 720 + i), roofMat: M.tiles(['#a9553c', '#8f4a36', '#9a6046'][i % 3], 730), rise: 1.3,
      openings: [{ type: 'window', x: -1.0, y: 0.9, w: 0.9, h: 1.0 }, { type: 'window', x: 1.2, y: 0.9, w: 0.9, h: 1.0 }, { type: 'door', x: 0.1, w: 0.85, h: 1.95 }] });
    h.position.set(-28 + i * 8 + r() * 1.5, 0, -11 - r() * 2); G.add(h);
  }
  const tree = (x, z, s) => { const t = new THREE.Group(); t.add(cyl(0.16 * s, 0.12 * s, 1.4 * s, M.wood('#6a4a30', 740), { seg: 8 })); for (let k = 0; k < 3; k++) t.add(cyl(1.0 * s - k * 0.25 * s, 0.05, 1.3 * s, M.flat(['#4f7a3e', '#5f8a48', '#6e9a52'][k], 741 + k), { y: 1.1 * s + k * 0.55 * s, seg: 10 })); t.position.set(x, 0, z); return t; };
  for (let i = 0; i < 10; i++) G.add(tree(-30 + i * 6.5 + r() * 2, -7 - r() * 1.5, 0.9 + r() * 0.5));
  for (let i = 0; i < 6; i++) G.add(tree(-26 + i * 9 + r() * 2, 9 + r() * 3, 1.0 + r() * 0.4));
  for (let i = 0; i < 6; i++) { const lp = lampPost(4.6); lp.position.set(-20 + i * 9, 0, -4.4); lp.rotation.y = Math.PI / 2; G.add(lp); }
  G.add(hills({ w: 400, h: 22, seed: 2, color: '#a7b48f', z: -110 }));
  // speed limit sign
  const slT = labelTex({ w: 400, h: 520, bg: '#f4f1e6', border: INK, seed: 4, lines: [{ text: 'SPEED', size: 100, y: 0.18 }, { text: 'LIMIT', size: 100, y: 0.36 }, { text: '60', size: 250, y: 0.7 }] });
  const sl = signBoard({ w: 0.6, h: 0.78, texture: slT, posts: 0, postH: 1.6 }); sl.add(box(0.08, 1.6, 0.08, M.dark('#3a3a3c'), { z: -0.06 })); sl.position.set(-7.5, 0, -3.8); G.add(sl);
  // "YOU ARE HERE" sign behind the car (flips up on "exactly")
  const yahT = labelTex({ w: 900, h: 420, bg: '#ffd36a', border: INK, seed: 5, lines: [{ text: 'YOU ARE HERE', size: 150, y: 0.32 }, { text: '(EXACTLY)', size: 110, y: 0.62 }],
    paint: (g, w, h) => { g.fillStyle = INK; g.beginPath(); g.moveTo(w / 2 - 50, h * 0.78); g.lineTo(w / 2 + 50, h * 0.78); g.lineTo(w / 2, h * 0.96); g.fill(); } });
  const yahPivot = new THREE.Group(); yahPivot.position.set(-1.0, 2.6, -3.4); G.add(yahPivot);
  G.add(box(0.1, 2.6, 0.1, M.dark('#3a3a3c'), { x: -1.0, z: -3.45 }));
  const yah = signBoard({ w: 2.3, h: 1.07, texture: yahT, postH: 0 }); yahPivot.add(yah); makeDynamic(yah);
  // billboard (animated canvas): position vs momentum
  const bbC = document.createElement('canvas'); bbC.width = 1600; bbC.height = 960;
  const bbT = new THREE.CanvasTexture(bbC); bbT.colorSpace = THREE.NoColorSpace;
  const bb = new THREE.Group();
  bb.add(box(4.3, 2.6, 0.15, M.wood('#5a3a28', 750), { y: 1.6, inkOpts: { hull: 0.02, edges: 30 } }));
  bb.add(plane(4.1, 2.46, new THREE.MeshToonMaterial({ gradientMap: GRAD, map: bbT }), { y: 1.6 + 1.3, z: 0.08 }));
  for (const x of [-1.6, 1.6]) bb.add(box(0.15, 1.6, 0.15, M.wood('#4e3426', 751), { x, z: -0.05 }));
  bb.position.set(4.6, 0, -5.4); G.add(bb);
  const drawBB = (s, tt) => {
    const g = bbC.getContext('2d'), w = bbC.width, h = bbC.height;
    g.fillStyle = '#f2ead2'; g.fillRect(0, 0, w, h);
    g.fillStyle = INK; g.font = `150px ${SIGN_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('THE UNCERTAINTY PRINCIPLE', w / 2, 110);
    g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.moveTo(w / 2, 220); g.lineTo(w / 2, h - 60); g.stroke();
    // left: position on a ruler (sharp when s=1)
    g.font = `110px ${SIGN_FONT}`; g.fillText('POSITION', w * 0.25, 280);
    g.lineWidth = 6; g.beginPath(); g.moveTo(80, 620); g.lineTo(w / 2 - 80, 620); g.stroke();
    for (let i = 0; i <= 12; i++) { const x = 80 + i * ((w / 2 - 160) / 12); g.beginPath(); g.moveTo(x, 620); g.lineTo(x, i % 3 ? 650 : 680); g.stroke(); }
    const spread = lerp(260, 10, s), px = w * 0.25 + 40 * Math.sin(tt * 1.3);
    const grd = g.createRadialGradient(px, 540, 0, px, 540, spread + 30);
    grd.addColorStop(0, 'rgba(210,58,42,0.95)'); grd.addColorStop(Math.min(0.95, 30 / (spread + 30) + 0.05), 'rgba(210,58,42,0.75)'); grd.addColorStop(1, 'rgba(210,58,42,0)');
    g.fillStyle = grd; g.beginPath(); g.ellipse(px, 540, spread + 30, 46, 0, 0, 7); g.fill();
    g.fillStyle = INK; g.font = `80px ${SIGN_FONT}`; g.fillText(s > 0.5 ? 'SHARP' : 'BLURRY', w * 0.25, 800);
    // right: momentum speedometer (one needle when sharp, a fan of needles when blurry)
    g.font = `110px ${SIGN_FONT}`; g.fillText('MOMENTUM', w * 0.75, 280);
    const cx = w * 0.75, cy = 690, R = 230;
    g.lineWidth = 8; g.beginPath(); g.arc(cx, cy, R, Math.PI, 0); g.stroke();
    for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; g.beginPath(); g.moveTo(cx + Math.cos(a) * (R - 30), cy + Math.sin(a) * (R - 30)); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke(); }
    const fan = lerp(0.05, 1.3, s), n = 1 + Math.round(s * 14);
    for (let i = 0; i < n; i++) {
      const a = Math.PI * 1.5 + (n === 1 ? 0 : (i / (n - 1) - 0.5) * fan) + 0.08 * Math.sin(tt * 2 + i);
      g.strokeStyle = `rgba(42,74,140,${n === 1 ? 1 : 0.35})`; g.lineWidth = 10; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * (R - 40), cy + Math.sin(a) * (R - 40)); g.stroke();
    }
    g.fillStyle = INK; g.beginPath(); g.arc(cx, cy, 18, 0, 7); g.fill();
    g.font = `80px ${SIGN_FONT}`; g.fillText(s > 0.5 ? 'BLURRY' : 'SHARP', cx, 800);
    bbT.needsUpdate = true;
  };
  // cars
  const hc = car({ body: '#3aa6a0' }); G.add(hc.g);
  const pc = car({ body: '#f2f1ea', police: true }); G.add(pc.g);
  const heisGlow = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 3.2), GLOW); G.add(heisGlow);
  const heis = makeChar({ palette: 'heis', hat: 'none', glasses: false, seed: 821, scale: 0.75, face: 0.0 }); hc.g.add(heis.root); heis.root.position.set(0.2, 0.42, 0.35);
  const drv = makeChar({ palette: 'cop', hat: 'cap', seed: 822, scale: 0.75 }); pc.g.add(drv.root); drv.root.position.set(-0.1, 0.42, 0.35);
  const cop = makeChar({ palette: 'cop', hat: 'cap', seed: 823, face: 0.2 }); G.add(cop.root);
  const palmB = new Builder(); palmB.add(circlePts(0, 0, 0.085, 0.075, 20), '#3b2a26', { inkW: 0.01, seed: 4 });
  for (let i = 0; i < 4; i++) palmB.add(limbPts(-0.06 + i * 0.04, 0.05, -0.07 + i * 0.045, 0.13, 0.03, 0.026), '#3b2a26', { inkW: 0.008, seed: 5 + i });
  const palmHand = new THREE.Mesh(palmB.build(), CHAR_MAT); palmHand.position.set(-0.05, 1.37, 0.03); palmHand.visible = false; cop.bodyG.add(palmHand);
  // radar gun (right hand) and ticket pad (left side)
  const gun = new THREE.Group();
  gun.add(box(0.26, 0.11, 0.09, M.dark('#2a2a2e'), { x: 0.05, inkOpts: { hull: 0.004, edges: 30, dynamic: true, thin: true } }));
  gun.add(box(0.05, 0.13, 0.07, M.dark('#2a2a2e'), { x: -0.05, y: -0.12, inkOpts: { hull: 0.004, edges: 30, dynamic: true, thin: true } }));
  const rgT = labelTex({ w: 512, h: 200, bg: '#0f1a14', fg: '#9dff8a', wearAmount: 0, lines: [{ text: 'SPEED: ???', size: 130, y: 0.56, color: '#9dff8a' }] });
  const rg = plane(0.44, 0.17, basic('#ffffff', { map: rgT }), { x: 0.05, y: 0.19, z: 0.03 }); gun.add(rg);
  gun.add(box(0.48, 0.21, 0.03, M.dark('#2a2a2e'), { x: 0.05, y: 0.085, z: -0.01, inkOpts: { hull: 0.004, edges: 30, dynamic: true, thin: true } }));
  cop.armR.add(gun); gun.position.set(0.09, -0.45, 0.05);
  const tkC = document.createElement('canvas'); tkC.width = 700; tkC.height = 900;
  const tkT = new THREE.CanvasTexture(tkC); tkT.colorSpace = THREE.NoColorSpace;
  const pad = new THREE.Group();
  pad.add(box(0.36, 0.46, 0.02, M.wood('#8a6440', 760), { inkOpts: { hull: 0.004, edges: 30, dynamic: true, thin: true } }));
  pad.add(plane(0.33, 0.42, M.label(tkT), { y: 0.23, z: 0.012 }));
  cop.yawG.add(pad); pad.position.set(0.0, 0.62, 0.12); pad.rotation.x = -0.15;
  const drawTicket = (state) => {
    const g = tkC.getContext('2d'), w = tkC.width, h = tkC.height;
    g.fillStyle = '#fff6dc'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#8a2a22'; g.fillRect(0, 0, w, 120); g.fillStyle = '#fff6dc'; g.font = `96px ${SIGN_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TRAFFIC TICKET', w / 2, 64);
    g.fillStyle = INK; g.textAlign = 'left'; g.font = `70px ${SIGN_FONT}`;
    g.fillText('DRIVER: W. HEISENBERG', 50, 210); g.fillText('SPEED: ???', 50, 300); g.fillText('LOCATION: EXACT', 50, 390);
    const boxes = [['TICKET', 520], ['NO TICKET', 680]];
    boxes.forEach(([lbl, y], i) => {
      g.strokeStyle = INK; g.lineWidth = 8; g.strokeRect(60, y - 50, 100, 100);
      g.fillStyle = INK; g.font = `90px ${SIGN_FONT}`; g.fillText(lbl, 200, y + 4);
      if (state === 'both' || state === i) { g.strokeStyle = '#b3261e'; g.lineWidth = 16; g.beginPath(); g.moveTo(75, y); g.lineTo(105, y + 35); g.lineTo(150, y - 40); g.stroke(); }
    });
    tkT.needsUpdate = true;
  };
  const siren = new THREE.PointLight('#ff3a2a', 0, 9, 1.4); G.add(siren);
  makeDynamic(hc.g); makeDynamic(pc.g);
  bakeEdges(G);
  const t2 = shotStart(2), tStop = beat(2, 'Heisenberg', 0, 0.3), tEx = beat(4, 'exactly'), tPal = beat(5, 'uncertainty');
  const tPre = beat(6, 'precisely'), tDef = beat(6, 'defined'), tSq = beat(7, 'Squeeze'), tBl = beat(7, 'blurry'), tUnc = beat(8, 'uncertain'), tDid = beat(8, 'didnt');
  let lastS = -1, lastTk = '';
  return {
    group: G,
    update(t, camPos, shot) {
      // cars: pull over during shot 2, parked after
      const p = smooth(t2 - 0.6, tStop, t);
      const ease = 1 - Math.pow(1 - p, 2.2);
      hc.g.position.set(lerp(-26, 0, ease), 0, 1.75);
      pc.g.position.set(lerp(-31, -5.2, ease), 0, 1.75);
      heisGlow.position.set(hc.g.position.x, 1.2, 1.75 - 0.95);
      heisGlow.visible = true;
      const flash = Math.floor(t * 6) % 2;
      pc.bar.red.color.set(flash ? '#ff3a2a' : '#5a1010'); pc.bar.blue.color.set(flash ? '#10205a' : '#3a6aff');
      siren.position.set(pc.g.position.x - 0.25, 2.4, 1.75); siren.color.set(flash ? '#ff3a2a' : '#3a6aff'); siren.intensity = 2.2;
      animChar(heis, t, camPos, {}); animChar(drv, t, camPos, {}); drv.root.visible = shot < 3;
      // cop: out of the car from shot 3
      cop.root.visible = shot >= 3;
      cop.root.position.set(1.0, 0, 3.15);
      const palm = shot === 5 ? smooth(tPal - 0.5, tPal, t) : 0;
      animChar(cop, t, camPos, { armUp: shot === 3 || shot === 4 ? 0.38 : 0.05, armUpL: shot === 5 ? 1.17 * palm : (shot === 8 ? 0.0 : 0) });
      gun.visible = shot >= 3 && shot <= 4;
      palmHand.visible = palm > 0.6;
      pad.visible = shot === 8;
      // "YOU ARE HERE" flips up on "exactly"
      const up = shot >= 4 ? smooth(tEx - 0.3, tEx + 0.15, t) : 0;
      yahPivot.rotation.x = lerp(-Math.PI / 2, 0, up);
      yahPivot.visible = up > 0.01;
      // billboard: position sharpens / momentum blurs; then squeeze back and forth
      let s = 0.15;
      if (shot === 6) s = lerp(0.15, 0.95, smooth(tPre, tDef, t));
      if (shot === 7) s = t < tSq ? 0.95 : 0.55 + 0.42 * Math.cos((t - tSq) * 3.2);
      if (shot === 6 || shot === 7) { const q = Math.round(s * 60) + (Math.floor(t * 15) % 2) * 1000; if (q !== lastS) { drawBB(s, t); lastS = q; } }
      else if (lastS !== -2) { drawBB(0.15, 0); lastS = -2; }
      // ticket: both boxes ticked, flickering on "uncertain"
      const st = t < tDid ? 0 : t < tUnc - 0.1 ? 1 : (Math.floor(t * 8) % 2);
      const key = `${st}`;
      if (key !== lastTk) { drawTicket(st); lastTk = key; }
    },
  };
}

export function buildWorld() {
  const scene = new THREE.Scene();
  const locs = { A: locLab(), B: locRoad() };
  for (const [k, L] of Object.entries(locs)) { L.group.position.x = LOC[k]; scene.add(L.group); }
  const sky = skyDome('#8fc3e3', '#f2dcc0', 5); scene.add(sky);
  const hemi = new THREE.HemisphereLight('#fff2dc', '#7a6a58', 1.6); scene.add(hemi);
  const key = new THREE.DirectionalLight('#ffe2b8', 2.6);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03;
  const sc = key.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 16; sc.bottom = -16; sc.near = 1; sc.far = 120;
  scene.add(key); scene.add(key.target);
  const lamp = new THREE.PointLight('#ffd9a0', 0, 9, 1.6); scene.add(lamp);
  scene.fog = new THREE.Fog('#e8d6b6', 30, 160);
  return { scene, locs, sky, hemi, key, lamp };
}
