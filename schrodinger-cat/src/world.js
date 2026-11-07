// Schrödinger's cat short: all sets in one scene at different x offsets; only the active one is shown.
import * as THREE from 'three';
import {
  INK, SIGN_FONT, HAND_FONT, M, tex, toon, GRAD, labelTex, canvasTex, box, cyl, plane, mesh, boxGeo, ink, edgeLines, bakeEdges,
  facade, gableRoof, lampPost, barrel, crate, signBoard, revealPlane, hills, skyDome, rng, lerp, clamp, smooth, basic, blob, hexA,
} from './kit.js';
import { makeChar, animChar, Builder, circlePts, limbPts, CHAR_MAT } from './char.js';
import { beat, shotStart, shotEnd } from './timing.js';

export const LOC = { A: 0, B: 60, C: 120, D: 200 };
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


// ---------- the cat (a flat 2D cartoon animal in the 3D world) ----------
const GHOST_MAT = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.45, color: '#9fe8ff', depthWrite: false, side: THREE.DoubleSide });
function catGeometry(seed = 1, { wide = false } = {}) {
  const fur = '#e48a3a', dark = '#b8612a', cream = '#f6dcb2';
  const b = new Builder();
  // tail is separate (it sways); body, head, ears, face here
  const body = [];
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2, s = Math.sin(a), c = Math.cos(a), k = 0.5 + 0.5 * s; const half = 0.2 * (1 - k) + 0.11 * k; body.push(V(Math.sign(c) * Math.pow(Math.abs(c), 0.8) * half, 0.02 + 0.36 * k)); }
  b.add(body, fur, { inkW: 0.012, seed });
  b.add(circlePts(0, 0.13, 0.1, 0.12, 24), cream, { inkW: 0 });
  b.add(circlePts(-0.08, 0.03, 0.06, 0.035, 14), cream, { inkW: 0.008, seed: seed + 1 });
  b.add(circlePts(0.08, 0.03, 0.06, 0.035, 14), cream, { inkW: 0.008, seed: seed + 2 });
  const hy = 0.47;
  b.add([V(-0.15, hy + 0.06), V(-0.06, hy + 0.12), V(-0.12, hy + 0.23)], fur, { inkW: 0.01, seed: seed + 3 });
  b.add([V(0.15, hy + 0.06), V(0.06, hy + 0.12), V(0.12, hy + 0.23)], fur, { inkW: 0.01, seed: seed + 4 });
  b.add([V(-0.12, hy + 0.09), V(-0.08, hy + 0.12), V(-0.115, hy + 0.18)], '#f2a0a0', { inkW: 0 });
  b.add([V(0.12, hy + 0.09), V(0.08, hy + 0.12), V(0.115, hy + 0.18)], '#f2a0a0', { inkW: 0 });
  b.add(circlePts(0, hy, 0.16, 0.14, 40), fur, { inkW: 0.013, seed: seed + 5 });
  for (const x of [-0.04, 0, 0.04]) b.add([V(x - 0.012, hy + 0.135), V(x + 0.012, hy + 0.135), V(x + 0.006, hy + 0.08), V(x - 0.006, hy + 0.08)], dark, { inkW: 0 });
  b.add(circlePts(0, hy - 0.06, 0.07, 0.045, 18), cream, { inkW: 0 });
  // eyes: calm half-lidded, or wide open
  for (const ex of [-0.06, 0.06]) {
    if (wide) { b.add(circlePts(ex, hy + 0.01, 0.035, 0.04, 16), '#fbf6ea', { inkW: 0.005, seed }); b.add(circlePts(ex, hy + 0.005, 0.016, 0.022, 12), INK, { inkW: 0 }); }
    else { b.add(circlePts(ex, hy + 0.0, 0.035, 0.022, 14, Math.PI, Math.PI * 2), '#fbf6ea', { inkW: 0.005, seed }); b.add(circlePts(ex, hy - 0.01, 0.014, 0.012, 10), INK, { inkW: 0 }); b.add([V(ex - 0.042, hy + 0.003), V(ex + 0.042, hy + 0.003), V(ex + 0.04, hy + 0.014), V(ex - 0.04, hy + 0.014)], INK, { inkW: 0 }); }
  }
  b.add([V(-0.018, hy - 0.035), V(0.018, hy - 0.035), V(0, hy - 0.06)], '#d9707a', { inkW: 0.004, seed });
  for (const sd of [-1, 1]) for (const dy of [-0.05, -0.07]) b.add([V(sd * 0.05, hy + dy), V(sd * 0.2, hy + dy + 0.015), V(sd * 0.2, hy + dy + 0.022), V(sd * 0.05, hy + dy + 0.006)], INK, { inkW: 0 });
  return b.build();
}
const CAT_GEO = {};
function catGeo(seed, wide) { const k = `${seed}-${wide}`; return (CAT_GEO[k] ||= catGeometry(seed, { wide })); }
function makeCat(seed = 1, scale = 1) {
  const root = new THREE.Group(), yawG = new THREE.Group(), bodyG = new THREE.Group();
  root.add(yawG); yawG.add(bodyG); bodyG.scale.setScalar(scale);
  const calm = new THREE.Mesh(catGeo(seed, false), CHAR_MAT), wide = new THREE.Mesh(catGeo(seed, true), CHAR_MAT);
  wide.visible = false; bodyG.add(calm, wide);
  const tb = new Builder();
  const tail = [];
  for (let i = 0; i <= 12; i++) { const u = i / 12; tail.push(V(0.02 + 0.2 * u, 0.02 + 0.3 * u * u)); }
  const tailPts = []; const w = 0.035;
  tail.forEach((p, i) => tailPts.push(V(p.x, p.y - w * (1 - i / 14))));
  for (let i = tail.length - 1; i >= 0; i--) tailPts.push(V(tail[i].x - 0.01, tail[i].y + w * (1 - i / 14)));
  tb.add(tailPts, '#e48a3a', { inkW: 0.01, seed: seed + 9 });
  const tailG = new THREE.Group(); tailG.position.set(0.14, 0.04, -0.01); tailG.add(new THREE.Mesh(tb.build(), CHAR_MAT)); bodyG.add(tailG);
  const ghost = new THREE.Group(); ghost.add(new THREE.Mesh(catGeo(seed, false), GHOST_MAT)); ghost.position.set(0.09, 0.0, 0.004); ghost.visible = false; bodyG.add(ghost);
  const shadow = blob(0.45 * scale, 0.2 * scale); root.add(shadow);
  return { root, yawG, bodyG, calm, wide, tailG, ghost, shadow };
}
function animCat(c, t, cam, { wide = false, ghost = 0 } = {}) {
  if (cam) {
    const wp = new THREE.Vector3(); c.root.getWorldPosition(wp);
    const pq = c.root.parent ? new THREE.Euler().setFromQuaternion(c.root.parent.getWorldQuaternion(new THREE.Quaternion()), 'YXZ').y : 0;
    let d = Math.atan2(cam.x - wp.x, cam.z - wp.z) - pq - c.root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
    c.yawG.rotation.y = clamp(d, -0.7, 0.7);
  }
  c.calm.visible = !wide; c.wide.visible = wide;
  c.tailG.rotation.z = 0.18 * Math.sin(t * 2.1);
  c.bodyG.position.y = 0.006 * Math.sin(t * 1.7);
  c.ghost.visible = ghost > 0.01;
  c.ghost.children[0].material.opacity = 0.45 * ghost;
  c.ghost.position.x = 0.09 + 0.01 * Math.sin(t * 13);
}
function qMark(size = 0.3, color = '#ffd36a') {
  const t = labelTex({ w: 256, h: 256, bg: null, wearAmount: 0, lines: [{ text: '?', size: 230, font: HAND_FONT, color }], paint: () => {} });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  return m;
}
function paperTag(text, w, h, { size = 120, bg = '#f6efd8', color = INK } = {}) {
  const t = labelTex({ w: Math.round(256 * w / h), h: 256, bg, seed: 3, wearAmount: 0.3, border: '#5a3a22', lines: [{ text, size, y: 0.55, color, spacing: '3px' }] });
  return plane(w, h, M.label(t));
}

// ============ A: the host's lab (same set as the double-slit video) ============
function locLab() {
  const W = 8, D = 6;
  const G = room({ w: W, d: D, h: 3.4, wall: M.plaster('#d9d6c4', 201), floor: M.wood('#7d5a3c', 202), leftOpenings: [{ type: 'window', x: 0.3, y: 0.95, w: 1.4, h: 1.6 }], wainscot: '#5a6a5e' });
  const doorSign = hangingSign('LAB', 0.9, 0.32, { size: 230, rod: 0.0 }); doorSign.position.set(2.3, 2.3, -D / 2 + 0.05); G.add(doorSign);
  const BW = 3.8, BH = 1.55, BX = -0.6, BY = 1.05, BZ = -D / 2 + 0.06;
  const cb = chalkboard(BW, BH, chalkTex([{ text: "SCHRÖDINGER'S CAT", size: 82, y: 0.12 }], { w: 1600, h: 650, seed: 19 }));
  cb.position.set(BX, BY, BZ); G.add(cb);
  const faceY = BY + cb.userData.faceY, faceZ = BZ + 0.035;
  const draw = chalkOverlay(1.6, 1.0, (g, w, h) => {
    g.strokeStyle = '#f2efe4'; g.lineWidth = 10; g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeRect(w * 0.18, h * 0.32, w * 0.5, h * 0.5);
    g.beginPath(); g.moveTo(w * 0.18, h * 0.32); g.lineTo(w * 0.3, h * 0.16); g.lineTo(w * 0.8, h * 0.16); g.lineTo(w * 0.68, h * 0.32); g.moveTo(w * 0.8, h * 0.16); g.lineTo(w * 0.8, h * 0.66); g.lineTo(w * 0.68, h * 0.82); g.stroke();
    g.fillStyle = '#f2efe4'; g.font = `150px ${HAND_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', w * 0.43, h * 0.58);
  }, { px: 400 });
  draw.position.set(BX - BW / 2 + 0.12, faceY - 0.08, faceZ); G.add(draw);
  const ad = chalkText('ALIVE + DEAD?', 1.3, 0.3, 150, '#ffd36a'); ad.position.set(BX - BW / 2 + 0.2, faceY - 0.62, faceZ + 0.003); G.add(ad);
  const checks = ['NOT ABOUT CATS  ✓', 'ABOUT PHYSICS  ✓'].map((txt, i) => { const l = chalkText(txt, 1.9, 0.32, 150); l.position.set(BX + 0.1, faceY + 0.18 - i * 0.4, faceZ + 0.003); G.add(l); return l; });
  const lb = bench(2.6, 0.8); lb.position.set(-0.6, 0, -1.0); G.add(lb);
  // bench props: books, a flask, a cat bowl
  for (let i = 0; i < 4; i++) G.add(box(0.07 + (i % 2) * 0.02, 0.26 - i * 0.02, 0.2, M.flat(['#7a2f2a', '#2f4a5e', '#5e6a3a', '#a07a3a'][i], 220 + i), { x: -1.75 + i * 0.09, y: 0.9, z: -1.05, inkOpts: { hull: 0.004, edges: 30, thin: true } }));
  G.add(cyl(0.09, 0.07, 0.06, M.flat('#c95a3a', 224), { x: 0.3, y: 0.9, z: -1.0, seg: 16 }));
  const posterT = labelTex({ w: 600, h: 800, bg: '#efe6cc', seed: 12, lines: [{ text: 'SAFETY', size: 120, y: 0.12, color: '#8a2a22' }, { text: 'FIRST', size: 120, y: 0.26, color: '#8a2a22' }],
    paint: (g, w, h) => { g.strokeStyle = INK; g.lineWidth = 10; g.beginPath(); g.arc(w / 2, h * 0.62, 150, 0, 7); g.stroke(); g.beginPath(); g.moveTo(w / 2, h * 0.5); g.lineTo(w / 2, h * 0.66); g.stroke(); g.beginPath(); g.arc(w / 2, h * 0.73, 10, 0, 7); g.fill(); } });
  G.add(plane(0.6, 0.8, M.label(posterT), { x: 1.85, y: 1.75, z: -D / 2 + 0.03 }));
  G.add(pendant(-0.6, 2.9, -0.6)); G.add(pendant(2.0, 2.9, 0.6, '#6a3f3a'));
  const host = makeChar({ palette: 'host', hat: 'none', glasses: true, seed: 701, face: 0 }); G.add(host.root);
  const cat = makeCat(4, 1.25); G.add(cat.root);
  bakeEdges(G);
  const tDead = beat(1, 'dead'), tCats = beat(12, 'cats'), tPhys = beat(12, 'physics');
  return {
    group: G,
    update(t, camPos, shot) {
      ad.visible = shot !== 1 || t > tDead - 0.5; ad.setReveal(shot === 1 ? smooth(tDead - 0.5, tDead + 0.4, t) : 1);
      checks[0].visible = shot === 12 && t > tCats - 0.4; checks[0].setReveal(smooth(tCats - 0.4, tCats + 0.4, t));
      checks[1].visible = shot === 12 && t > tPhys - 0.4; checks[1].setReveal(smooth(tPhys - 0.4, tPhys + 0.35, t));
      cat.root.visible = shot === 12;
      if (shot === 1) { host.root.position.set(1.2, 0, -1.2); animChar(host, t, camPos, { point: smooth(tDead - 1.0, tDead - 0.6, t) * 0.55 }); }
      else { host.root.position.set(-0.75, 0, -0.1); animChar(host, t, camPos, {}); cat.root.position.set(0.4, 0, 0.1); animCat(cat, t, camPos, {}); }
    },
  };
}

// ============ B: the box experiment ============
function locBox() {
  const G = room({ w: 7, d: 6, h: 3.3, wall: M.wallpaper('#cfd8c2', '#bfcab0', 301), floor: M.wood('#6e4e34', 302), rightOpenings: [{ type: 'window', x: 0.5, y: 1.0, w: 1.4, h: 1.6 }], wainscot: '#4e5e48', ceil: '#d6d2c0' });
  const D = 6;
  // chalkboard (shot 11 writes the measurement problem)
  const cb = chalkboard(3.2, 1.3, chalkTex([{ text: "SCHRÖDINGER'S BOX", size: 80, y: 0.14 }], { w: 1400, h: 570, seed: 29 }));
  cb.position.set(0, 1.35, -D / 2 + 0.06); G.add(cb);
  const mp1 = chalkText('MEASUREMENT PROBLEM:', 2.6, 0.34, 150); mp1.position.set(-1.45, 1.35 + cb.userData.faceY + 0.06, -D / 2 + 0.1); G.add(mp1);
  const mp2 = chalkText('STILL UNSOLVED', 2.2, 0.34, 150, '#ffd36a'); mp2.position.set(-1.45, 1.35 + cb.userData.faceY - 0.34, -D / 2 + 0.1); G.add(mp2);
  // table
  const table = new THREE.Group();
  table.add(box(2.6, 0.08, 1.3, M.wood('#5c3c24', 303), { y: 0.82 }));
  for (const [x, z] of [[-1.2, -0.55], [1.2, -0.55], [-1.2, 0.55], [1.2, 0.55]]) table.add(box(0.1, 0.82, 0.1, M.wood('#4c3220', 304), { x, z }));
  table.position.set(0, 0, -0.6); G.add(table);
  // the box: open front (cutaway) that closes, a hinged lid
  const BX0 = 0, BY0 = 0.9, BZ0 = -0.6, bw = 1.5, bh = 0.95, bd = 0.95, th = 0.05;
  const boxG = new THREE.Group(); boxG.position.set(BX0, BY0, BZ0); G.add(boxG);
  const plank = M.wood('#b98a56', 305);
  boxG.add(box(bw, th, bd, plank, { inkOpts: { hull: 0.01, edges: 30 } }));
  boxG.add(box(bw, bh, th, plank, { z: -bd / 2 + th / 2, inkOpts: { hull: 0.01, edges: 30 } }));
  boxG.add(box(th, bh, bd, plank, { x: -bw / 2 + th / 2, inkOpts: { hull: 0.01, edges: 30 } }));
  boxG.add(box(th, bh, bd, plank, { x: bw / 2 - th / 2, inkOpts: { hull: 0.01, edges: 30 } }));
  const inner = plane(bw - 0.1, bh - 0.06, M.flat('#7a5636', 306), { y: bh / 2, z: -bd / 2 + th + 0.002 }); boxG.add(inner);
  const lidPivot = new THREE.Group(); lidPivot.position.set(0, bh, -bd / 2); boxG.add(lidPivot);
  const lid = box(bw + 0.04, th, bd + 0.04, plank, { z: bd / 2, inkOpts: { hull: 0.01, edges: 30, dynamic: true } }); lidPivot.add(lid);
  const front = box(bw, bh, th, plank, { z: bd / 2 - th / 2, inkOpts: { hull: 0.01, edges: 30, dynamic: true } }); boxG.add(front);
  const stamp = labelTex({ w: 700, h: 220, bg: null, wearAmount: 0, paint: (g, w, h) => { g.strokeStyle = '#8a2a22'; g.lineWidth = 12; g.strokeRect(10, 10, w - 20, h - 20); g.fillStyle = '#8a2a22'; g.font = `140px ${SIGN_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SEALED', w / 2, h / 2 + 6); } });
  const sealed = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.16), new THREE.MeshBasicMaterial({ map: stamp, transparent: true, depthWrite: false })); sealed.position.set(-0.4, bh * 0.78, bd / 2 + 0.002); sealed.rotation.z = 0.08; front.add(sealed); sealed.position.set(-0.4, 0.28, th / 2 + 0.003);
  // tags stuck on the box front (shots 6 and 11)
  const tagAD = paperTag('ALIVE + DEAD?', 0.9, 0.22, { size: 150, bg: '#ffd36a' }); tagAD.position.set(0.15, -0.05, th / 2 + 0.004); front.add(tagAD);
  const tagAOD = paperTag('ALIVE OR DEAD (NOT BOTH)', 1.25, 0.2, { size: 120 }); tagAOD.position.set(0, -0.05, th / 2 + 0.005); front.add(tagAOD);
  // inside: atom under a dome, Geiger counter, hammer, flask, cat
  const atomG = new THREE.Group(); atomG.position.set(-0.52, th, -0.05); boxG.add(atomG);
  atomG.add(cyl(0.16, 0.16, 0.04, M.dark('#3a3030'), { seg: 20 }));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#cfefff', transparent: true, opacity: 0.22, depthWrite: false })); dome.position.y = 0.04; atomG.add(dome);
  const nucleus = new THREE.Group(); nucleus.position.y = 0.12; atomG.add(nucleus);
  const nr = rng(5);
  for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), basic(i % 2 ? '#e05a4a' : '#9aa7b0')); s.position.set((nr() - 0.5) * 0.04, (nr() - 0.5) * 0.04, (nr() - 0.5) * 0.04); nucleus.add(s); }
  const ringMat = basic('#7dff9a');
  const rings = [0, 1.05, 2.1].map((a) => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.003, 6, 40), ringMat); r.rotation.set(Math.PI / 2 + 0.5, a, 0); nucleus.add(r); return r; });
  const aglow = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), GLOW); aglow.position.y = 0.12; atomG.add(aglow);
  const ghostN = nucleus.clone(); ghostN.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.35; o.material.depthWrite = false; } }); atomG.add(ghostN);
  const geiger = new THREE.Group(); geiger.position.set(-0.22, th, -0.12); boxG.add(geiger);
  geiger.add(box(0.24, 0.17, 0.15, M.flat('#d8b44a', 307)));
  const dialT = labelTex({ w: 256, h: 256, bg: '#f4ecd8', wearAmount: 0.1, paint: (g, w, h) => { g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.arc(w / 2, h * 0.7, 100, Math.PI, 0); g.stroke(); for (let i = 0; i <= 6; i++) { const a = Math.PI + (i / 6) * Math.PI; g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * 80, h * 0.7 + Math.sin(a) * 80); g.lineTo(w / 2 + Math.cos(a) * 100, h * 0.7 + Math.sin(a) * 100); g.stroke(); } } });
  geiger.add(plane(0.12, 0.12, M.label(dialT), { x: -0.04, y: 0.1, z: 0.0755 }));
  const needle = new THREE.Mesh(new THREE.PlaneGeometry(0.004, 0.05), basic('#b3261e')); needle.geometry.translate(0, 0.025, 0); needle.position.set(-0.04, 0.083, 0.077); geiger.add(needle);
  const gT = labelTex({ w: 512, h: 128, bg: '#2a2a2e', fg: '#f2e6c8', wearAmount: 0.2, lines: [{ text: 'GEIGER', size: 100, y: 0.56, color: '#f2e6c8', spacing: '6px' }] });
  geiger.add(plane(0.13, 0.035, M.label(gT), { x: 0.05, y: 0.03, z: 0.0755 }));
  const hammerPivot = new THREE.Group(); hammerPivot.position.set(0.12, th + 0.42, -0.12); boxG.add(hammerPivot);
  boxG.add(box(0.03, 0.42, 0.03, M.dark('#3a3a3c'), { x: 0.12, y: th, z: -0.12 }));
  boxG.add(box(0.14, 0.02, 0.1, M.dark('#3a3a3c'), { x: 0.12, y: th, z: -0.12 }));
  const harm = new THREE.Group(); hammerPivot.add(harm);
  harm.add(box(0.2, 0.02, 0.02, M.wood('#8a6440', 308), { x: 0.1, y: -0.01, inkOpts: { hull: 0.004, edges: 30, dynamic: true, thin: true } }));
  harm.add(box(0.05, 0.06, 0.06, M.dark('#2e2e32'), { x: 0.2, y: -0.03, inkOpts: { hull: 0.005, edges: 30, dynamic: true, thin: true } }));
  const flask = new THREE.Group(); flask.position.set(0.32, th, -0.12); boxG.add(flask);
  flask.add(new THREE.Mesh(new THREE.SphereGeometry(0.075, 18, 14), new THREE.MeshBasicMaterial({ color: '#79e06a', transparent: true, opacity: 0.85 })).translateY(0.075));
  flask.add(cyl(0.025, 0.025, 0.08, new THREE.MeshBasicMaterial({ color: '#cfefff', transparent: true, opacity: 0.6 }), { y: 0.13, seg: 10, inkOpts: { hull: 0, edges: 0 } }));
  flask.add(cyl(0.03, 0.025, 0.03, M.wood('#a07a4a', 309), { y: 0.205, seg: 10, inkOpts: { hull: 0.003, edges: 0 } }));
  const pT = labelTex({ w: 400, h: 200, bg: '#f6efd8', wearAmount: 0.2, border: '#8a2a22', lines: [{ text: 'POISON', size: 120, y: 0.56, color: '#8a2a22' }] });
  flask.add(plane(0.1, 0.05, M.label(pT), { y: 0.07, z: 0.078 }));
  // wires that light up along the chain
  const wireMat = [0, 1, 2].map(() => new THREE.MeshBasicMaterial({ color: '#3a3a3c' }));
  const wire = (a, b, m) => { const d = new THREE.Vector3().subVectors(b, a); const len = d.length(); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, len, 6), m); c.position.copy(a).add(b).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); boxG.add(c); };
  wire(new THREE.Vector3(-0.42, th + 0.02, -0.05), new THREE.Vector3(-0.34, th + 0.02, -0.12), wireMat[0]);
  wire(new THREE.Vector3(-0.1, th + 0.08, -0.12), new THREE.Vector3(0.11, th + 0.3, -0.12), wireMat[1]);
  // cat inside the box
  const cat = makeCat(4, 1.0); cat.root.position.set(0.56, th, 0.0); boxG.add(cat.root);
  // tags inside
  const tagAtom = paperTag('ATOM', 0.16, 0.06, { size: 150 }); tagAtom.position.set(-0.52, th + 0.02, 0.17); tagAtom.rotation.x = -0.4; boxG.add(tagAtom);
  const tag50 = paperTag('50 / 50', 0.2, 0.07, { size: 150, bg: '#ffd36a' }); tag50.position.set(-0.52, th + 0.36, 0.0); boxG.add(tag50);
  const tagDND = paperTag('DECAYED + NOT DECAYED', 0.46, 0.07, { size: 120, bg: '#bff0ff' }); tagDND.position.set(-0.52, th + 0.33, 0.06); boxG.add(tagDND);
  const thought = hangingSign('THOUGHT EXPERIMENT · NEVER DONE', 1.4, 0.2, { size: 120, bg: '#f6efd8', rod: 0.5 }); thought.position.set(0, BY0 + bh + 0.3, BZ0 + 0.15); G.add(thought);
  // floating question marks around the closed box (shot 6)
  const qs = [];
  for (let i = 0; i < 6; i++) { const q = qMark(0.24 + (i % 3) * 0.06); G.add(q); qs.push(q); }
  G.add(pendant(0, 2.85, -0.6, '#4a5e48'));
  for (let i = 0; i < 3; i++) G.add(crate(0.5, '#a07a4a', i === 1 ? 'CAT FOOD' : null).translateX(2.3 + (i % 2) * 0.1).translateZ(-2.2 + i * 0.55).translateY(0));
  bakeEdges(G);
  const t50 = beat(3, 'fiftyfifty'), tGe = beat(4, 'Geiger'), tHa = beat(4, 'hammer'), tFl = beat(4, 'flask'), tWo = beat(4, 'worse');
  const tDec = beat(5, 'decayed'), tAl = beat(6, 'alive'), tRe = beat(7, 'Relax'), tTh = beat(7, 'thought'), tAl11 = beat(11, 'alive'), tAr = beat(11, 'argue');
  return {
    group: G,
    update(t, camPos, shot) {
      // front panel: cutaway in shots 3-5; slides into place at the start of shot 6; closed in 11;
      // in 7 it hinges down at its bottom edge on "Relax" while the lid lifts
      let lidA = 0;
      front.rotation.x = 0; front.position.set(0, bh / 2, bd / 2 - th / 2); front.visible = true;
      if (shot <= 5) front.visible = false;
      else if (shot === 6) front.position.y = bh / 2 + 1.6 * (1 - smooth(shotStart(6) - 0.1, shotStart(6) + 0.6, t));
      else if (shot === 7) {
        const o = smooth(tRe, tRe + 0.6, t), ang = o * Math.PI / 2;
        front.rotation.x = ang; front.position.set(0, Math.cos(ang) * bh / 2, bd / 2 - th / 2 + Math.sin(ang) * bh / 2);
        lidA = smooth(tRe - 0.2, tRe + 0.5, t);
      }
      lidPivot.rotation.x = -lidA * 1.9;
      tagAD.visible = shot === 6 && t > tAl - 0.3;
      tagAOD.visible = shot === 11 && t > tAl11 - 0.3;
      sealed.visible = shot === 6 || shot === 11;
      // atom
      rings.forEach((r, i) => { r.rotation.y = t * (1.2 + i * 0.4) + i; });
      ghostN.visible = shot === 5 && t > tDec - 1.2;
      ghostN.position.set(0.035 * Math.sin(t * 7), 0.12 + 0.02 * Math.cos(t * 5), 0.02);
      nucleus.position.x = shot === 5 ? -0.02 * Math.sin(t * 7) : 0;
      tag50.visible = shot === 3 && t > t50 - 0.2;
      tagDND.visible = shot === 5 && t > tDec - 0.6;
      // chain in shot 4
      const on = (tt) => shot === 4 && t > tt - 0.1;
      wireMat[0].color.set(on(tGe) ? '#7dff9a' : '#3a3a3c');
      wireMat[1].color.set(on(tHa) ? '#7dff9a' : '#3a3a3c');
      needle.rotation.z = on(tGe) ? -0.9 + 0.15 * Math.sin(t * 40) : 0.9;
      harm.rotation.z = on(tHa) ? 0.5 + (on(tFl) ? -0.35 * smooth(tFl - 0.1, tFl + 0.15, t) : 0) : 0.1;
      flask.rotation.z = on(tFl) ? 0.08 * Math.sin(t * 30) * Math.exp(-(t - tFl) * 1.5) : 0;
      animCat(cat, t, camPos, { wide: shot === 4 && t > tWo - 0.2 });
      // thought-experiment sign drops in (shot 7)
      thought.visible = shot === 7 && t > tTh - 0.5;
      thought.position.y = lerp(3.4, BY0 + bh + 0.3, smooth(tTh - 0.5, tTh, t));
      // question marks (shot 6)
      qs.forEach((q, i) => {
        q.visible = shot === 6;
        const a = (i / qs.length) * Math.PI * 2 + t * 0.6;
        q.position.set(BX0 + Math.cos(a) * 1.0, BY0 + 1.15 + 0.12 * Math.sin(t * 2 + i), BZ0 + Math.sin(a) * 0.55 + 0.1);
        if (camPos) q.lookAt(camPos.x, q.position.y, camPos.z);
      });
      mp1.visible = shot === 11 && t > tAr - 0.6; mp1.setReveal(smooth(tAr - 0.6, tAr + 0.2, t));
      mp2.visible = shot === 11 && t > tAr + 0.1; mp2.setReveal(smooth(tAr + 0.1, tAr + 0.7, t));
    },
  };
}

// ============ C: Schrödinger's study, 1935 ============
function locStudy() {
  const G = room({ w: 6.4, d: 5.4, h: 3.4, wall: M.panel('#7d5636', 401), floor: M.wood('#5c3e28', 402), leftOpenings: [{ type: 'window', x: 0, y: 0.9, w: 1.3, h: 1.6 }], wainscot: '#4e3422', ceil: '#cdbfa0' });
  const shelf = new THREE.Group(); shelf.add(box(2.2, 2.4, 0.4, M.wood('#4e3220', 403)));
  const r = rng(3);
  for (let row = 0; row < 4; row++) for (let i = 0; i < 9; i++) shelf.add(box(0.18 + r() * 0.06, 0.28 + r() * 0.12, 0.3, M.flat(['#7a2f2a', '#2f4a5e', '#5e6a3a', '#a07a3a', '#3a3a3a'][Math.floor(r() * 5)], 404 + (i % 5)), { x: -0.9 + i * 0.22, y: 0.1 + row * 0.58, z: 0.08, inkOpts: { hull: 0.004, edges: 30, thin: true } }));
  shelf.position.set(1.8, 0, -2.45); G.add(shelf);
  const calT = labelTex({ w: 512, h: 700, bg: '#f6efdc', seed: 5, lines: [{ text: 'NOVEMBER', size: 100, y: 0.16, color: '#8a2a22' }, { text: '1935', size: 300, y: 0.6, color: INK }], paint: (g, w) => { g.fillStyle = '#8a2a22'; g.fillRect(0, 0, w, 26); } });
  G.add(plane(0.55, 0.75, M.label(calT), { x: -1.3, y: 1.85, z: -2.67 }));
  const desk = new THREE.Group();
  desk.add(box(2.0, 0.07, 1.0, M.wood('#5a3a22', 405), { y: 0.76 }));
  desk.add(box(0.55, 0.76, 0.9, M.panel('#5a3a22', 406), { x: -0.7 })); desk.add(box(0.55, 0.76, 0.9, M.panel('#5a3a22', 406), { x: 0.7 }));
  const npT = labelTex({ w: 900, h: 170, bg: '#2c2420', fg: '#e9c96a', seed: 22, lines: [{ text: "E. SCHRÖDINGER", size: 120, y: 0.56, color: '#e9c96a', spacing: '6px' }] });
  const np = new THREE.Group(); const npBox = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.72, 3), M.dark('#2c2420'), { inkOpts: { hull: 0.004, edges: 30, thin: true } }); npBox.rotation.z = Math.PI / 2; npBox.position.y = 0.04; np.add(npBox);
  np.add(plane(0.66, 0.08, M.label(npT), { y: 0.055, z: 0.035, rx: -0.52 })); np.position.set(-0.35, 0.83, 0.3); desk.add(np);
  // typewriter with the paper
  const tw = new THREE.Group();
  tw.add(box(0.5, 0.14, 0.36, M.dark('#2a2a2e')));
  tw.add(cyl(0.035, 0.035, 0.52, M.dark('#1e1e22'), { seg: 12 }).rotateZ(Math.PI / 2)); tw.children[1].position.set(0, 0.17, -0.1);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 9; j++) tw.add(cyl(0.015, 0.015, 0.02, M.flat('#e9e2cf', 410), { x: -0.2 + j * 0.05, y: 0.14, z: 0.02 + i * 0.04, seg: 8, inkOpts: { hull: 0, edges: 0 } }));
  const paperT = labelTex({ w: 700, h: 900, bg: '#f5eedb', seed: 52, wearAmount: 0.15, lines: [{ text: 'THE CAT:', size: 110, y: 0.14, color: INK }, { text: 'A COMPLAINT', size: 110, y: 0.28, color: '#8a2a22' }],
    paint: (g, w, h) => { g.fillStyle = hexA(INK, 0.45); for (let i = 0; i < 9; i++) g.fillRect(60, h * 0.42 + i * 46, w - 120 - (i % 3) * 90, 12); } });
  const paper = plane(0.3, 0.39, M.label(paperT), { y: 0.36, z: -0.1, rx: -0.15 }); tw.add(paper);
  tw.position.set(0.25, 0.83, -0.05); desk.add(tw);
  const lamp = new THREE.Group(); lamp.add(cyl(0.1, 0.1, 0.03, M.flat('#c9a24a', 411), { seg: 12 })); lamp.add(cyl(0.015, 0.015, 0.4, M.flat('#c9a24a', 411), { seg: 6 })); lamp.add(cyl(0.16, 0.06, 0.14, M.flat('#3f6a4a', 412), { y: 0.38, seg: 14 }));
  lamp.position.set(-0.8, 0.8, -0.25); desk.add(lamp);
  desk.position.set(0, 0, -0.6); G.add(desk);
  const er = makeChar({ palette: 'official', hat: 'none', glasses: true, seed: 811, face: 0 }); er.root.position.set(-0.25, 0, -1.45); G.add(er.root);
  bakeEdges(G);
  const tWrong = beat(8, 'wrong'), tCrit = beat(8, 'criticise');
  return {
    group: G,
    update(t, camPos, shot) {
      const palm = shot === 8 ? smooth(tWrong - 0.5, tWrong, t) : 0;
      animChar(er, t, camPos, { armUpL: 1.17 * palm, point: shot === 8 ? 0.55 * smooth(tCrit - 0.4, tCrit, t) * (1 - palm) : 0 });
    },
  };
}

// ============ D: decoherence room ============
function locDecoherence() {
  const G = room({ w: 8, d: 7, h: 3.6, wall: M.plaster('#2f3e56', 501), floor: M.concrete('#3a4250', 502), wainscot: '#22304a', ceil: '#2a3448', interior: '#1a2236' });
  const D = 7;
  const sign = hangingSign('DECOHERENCE', 2.4, 0.5, { bg: '#ffd36a', size: 220, rod: 0.8 }); sign.position.set(0.4, 2.3, -D / 2 + 0.3); G.add(sign);
  // vacuum bell jar with the lone electron
  const ped = cyl(0.35, 0.3, 0.8, M.flat('#5a6a7a', 503), { seg: 20 }); ped.position.set(-1.9, 0, -0.9); G.add(ped);
  const jar = new THREE.Mesh(new THREE.SphereGeometry(0.42, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#cfefff', transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
  jar.scale.y = 1.6; jar.position.set(-1.9, 0.8, -0.9); G.add(jar);
  G.add(cyl(0.44, 0.44, 0.04, M.dark('#2a2a30'), { x: -1.9, y: 0.8, z: -0.9, seg: 24 }));
  const vT = labelTex({ w: 600, h: 160, bg: '#f6efd8', seed: 2, border: INK, lines: [{ text: 'VACUUM', size: 120, y: 0.56, spacing: '6px' }] });
  G.add(plane(0.5, 0.13, M.label(vT), { x: -1.9, y: 0.55, z: -0.9 + 0.36 }));
  const e = makeElectron(5, 0.55); e.root.position.set(-1.9, 0.82, -0.9); G.add(e.root);
  // cat on a cushion, bombarded by air molecules and light
  const cush = cyl(0.42, 0.45, 0.22, M.flat('#a8443a', 504), { seg: 22 }); cush.position.set(1.0, 0, -0.6); G.add(cush);
  const cat = makeCat(4, 1.25); cat.root.position.set(1.0, 0.22, -0.55); G.add(cat.root);
  const mols = [], mr = rng(17);
  const molMat = [basic('#bfe0ff'), basic('#f2f2f2'), basic('#9fd0ff')];
  for (let i = 0; i < 70; i++) {
    const g = new THREE.Group();
    const a = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), molMat[i % 3]); g.add(a);
    if (i % 2) { const b2 = a.clone(); b2.position.x = 0.05; g.add(b2); }
    g.userData = { r: 0.5 + mr() * 1.1, ph: mr() * 6.28, sp: 0.6 + mr() * 1.4, tilt: (mr() - 0.5) * 1.6, yo: (mr() - 0.5) * 0.8 };
    G.add(g); mols.push(g);
  }
  const rays = [];
  for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 1.4), new THREE.MeshBasicMaterial({ color: '#fff3b0', transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending })); G.add(r); rays.push(r); }
  const flashes = [];
  for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.25), GLOW); G.add(f); flashes.push(f); }
  G.add(pendant(-1.9, 3.1, -0.2, '#3a4a5a')); G.add(pendant(1.0, 3.1, 0.2, '#3a4a5a'));
  bakeEdges(G);
  const tMeas = beat(10, 'measurement'), tDeco = beat(9, 'decoherence');
  return {
    group: G,
    update(t, camPos, shot) {
      const cx = 1.0, cy = 0.62, cz = -0.55;
      mols.forEach((m) => {
        const u = m.userData, a = u.ph + t * u.sp;
        const rr = u.r * (0.75 + 0.25 * Math.sin(t * 1.3 + u.ph));
        m.position.set(cx + Math.cos(a) * rr, cy + u.yo + Math.sin(a * 1.3) * 0.25, cz + Math.sin(a) * rr * 0.6);
        m.rotation.set(t * u.sp, a, u.tilt);
      });
      rays.forEach((r, i) => {
        const a = i * 1.05 + t * 0.3; const ph = ((t * 1.7 + i * 0.37) % 1);
        r.position.set(cx + Math.cos(a) * (1.4 - ph * 1.0), cy + 0.6 - ph * 0.3, cz + Math.sin(a) * 0.5);
        r.rotation.set(0, 0, a + Math.PI / 2 + 0.6);
        r.material.opacity = 0.55 * Math.sin(ph * Math.PI);
        if (camPos) r.lookAt(camPos.x, r.position.y, camPos.z);
        r.rotateZ(0.8);
      });
      flashes.forEach((f, i) => {
        const ph = (t * 2.2 + i * 0.17) % 1, k = Math.floor(t * 2.2 + i * 0.17) * 7 + i;
        const a = (k * 2.39) % 6.28, h = ((k * 0.61) % 1) * 0.55;
        f.position.set(cx + Math.cos(a) * 0.22, 0.25 + h + 0.1, cz + 0.12 + Math.sin(a) * 0.05);
        f.scale.setScalar(0.4 + 0.8 * Math.sin(ph * Math.PI));
        f.visible = true;
        if (camPos) f.lookAt(camPos.x, f.position.y, camPos.z);
      });
      // superposition ghost leaks away almost instantly once the bumps start counting (shot 10)
      const ghost = shot === 10 ? 1 - smooth(tMeas - 0.2, tMeas + 1.0, t) : shot === 9 ? 0.0 : 0;
      animCat(cat, t, camPos, { ghost });
      animElectron(e, t, camPos, {});
      sign.position.y = lerp(4.5, 2.3, smooth(tDeco - 0.4, tDeco + 0.1, t)) + 0.04 * Math.sin(Math.max(0, t - tDeco) * 10) * Math.exp(-Math.max(0, t - tDeco) * 3);
    },
  };
}

export function buildWorld() {
  const scene = new THREE.Scene();
  const locs = { A: locLab(), B: locBox(), C: locStudy(), D: locDecoherence() };
  for (const [k, L] of Object.entries(locs)) { L.group.position.x = LOC[k]; scene.add(L.group); }
  const sky = skyDome('#8fc3e3', '#eef2e0', 5);
  scene.add(sky);
  const hemi = new THREE.HemisphereLight('#fff2dc', '#7a6a58', 1.6); scene.add(hemi);
  const key = new THREE.DirectionalLight('#ffe2b8', 2.6);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03;
  const sc = key.shadow.camera; sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -14; sc.near = 1; sc.far = 120;
  scene.add(key); scene.add(key.target);
  const lamp = new THREE.PointLight('#ffd9a0', 0, 9, 1.6); scene.add(lamp);
  scene.fog = new THREE.Fog('#e8d6b6', 30, 160);
  return { scene, locs, sky, hemi, key, lamp };
}
