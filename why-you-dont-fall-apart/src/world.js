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

// crash helmet for the electron (a prop add-on, the character design stays the same)
function addHelmet(e) {
  const b = new Builder(), cy = 0.52;
  const dome = [];
  for (let i = 0; i <= 30; i++) { const a = Math.PI * (0.08 + 0.84 * (i / 30)); dome.push(V(Math.cos(a) * 0.335, cy + 0.05 + Math.sin(a) * 0.32)); }
  dome.push(V(-0.31, cy + 0.12)); dome.push(V(0.31, cy + 0.12));
  b.add(dome.slice(0, 31).concat([V(-0.33, cy + 0.08), V(0.33, cy + 0.08)]).reverse(), '#d23a2a', { inkW: 0.014, seed: 41 });
  b.add([V(-0.045, cy + 0.36), V(0.045, cy + 0.36), V(0.045, cy + 0.12), V(-0.045, cy + 0.12)], '#f4f1e6', { inkW: 0, z: undefined });
  b.add([V(-0.33, cy + 0.09), V(0.33, cy + 0.09), V(0.33, cy + 0.13), V(-0.33, cy + 0.13)], '#2a2a30', { inkW: 0.006, seed: 42 });
  const m = new THREE.Mesh(b.build(), CHAR_MAT); m.position.z = 0.012; e.bodyG.add(m);
  return m;
}
function sadFace(seed) {
  const b = new Builder();
  b.add(circlePts(0, 0, 0.09, 0.09, 24), ['#5fb8ff', '#8ad08a', '#f2a65a', '#e07a8a'][seed % 4], { inkW: 0.008, seed });
  for (const ex of [-0.03, 0.03]) b.add(circlePts(ex, 0.015, 0.011, 0.011, 8), INK, { inkW: 0 });
  const fr = []; for (let i = 0; i <= 8; i++) { const a = Math.PI * (0.2 + 0.6 * (i / 8)); fr.push(V(Math.cos(a) * 0.035, -0.055 + Math.sin(a) * 0.02)); }
  for (let i = 8; i >= 0; i--) { const a = Math.PI * (0.2 + 0.6 * (i / 8)); fr.push(V(Math.cos(a) * 0.035, -0.055 + 0.008 + Math.sin(a) * 0.014)); }
  b.add(fr, INK, { inkW: 0 });
  return new THREE.Mesh(b.build(), CHAR_MAT);
}

// ============ A: host's lab (puddle of sad particles) ============
function locLab() {
  const { G, host, board } = hostLab({ title: "WHY YOU DON'T FALL APART" });
  const k1 = chalkText('STILL WEIRD  ✓', 2.0, 0.34, 140); k1.position.set(board.x0 + 0.25, board.faceY + 0.12, board.faceZ + 0.003); G.add(k1);
  const k2 = chalkText('STILL HOLDING YOU TOGETHER  ✓', 3.4, 0.34, 130, '#ffd36a'); k2.position.set(board.x0 + 0.25, board.faceY - 0.3, board.faceZ + 0.003); G.add(k2);
  // the puddle
  const pud = new THREE.Mesh(new THREE.CircleGeometry(0.75, 40), new THREE.MeshToonMaterial({ gradientMap: GRAD, color: '#6fb6e0' })); pud.rotation.x = -Math.PI / 2; pud.scale.set(1.3, 0.75, 1); pud.position.set(-0.55, 0.012, 0.2); G.add(pud);
  const pudInk = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.78, 40), basic(INK)); pudInk.rotation.x = -Math.PI / 2; pudInk.scale.set(1.3, 0.75, 1); pudInk.position.set(-0.55, 0.013, 0.2); G.add(pudInk);
  const faces = []; const r = rng(3);
  for (let i = 0; i < 11; i++) { const f = sadFace(i); f.position.set(-0.55 + (r() - 0.5) * 1.5, 0.08, 0.2 + (r() - 0.5) * 0.8); G.add(f); faces.push(f); }
  const pT = labelTex({ w: 800, h: 260, bg: '#f6efd8', border: INK, seed: 6, lines: [{ text: 'YOU, WITHOUT', size: 110, y: 0.34 }, { text: 'QUANTUM PHYSICS', size: 110, y: 0.72, color: '#8a2a22' }] });
  const ps = signBoard({ w: 0.8, h: 0.26, texture: pT, posts: 1, postH: 0.55 }); ps.position.set(-1.45, 0, -0.3); ps.rotation.y = 0.3; G.add(ps);
  bakeEdges(G);
  const tWe = beat(7, 'weird'), tTo = beat(7, 'together'), tPu = beat(6, 'puddle');
  return {
    group: G,
    update(t, camPos, shot) {
      host.root.position.set(0.75, 0, 0.1);
      animChar(host, t, camPos, { point: shot === 6 ? 0.0 : 0, armUpL: shot === 6 ? 0.42 * smooth(tPu - 0.4, tPu, t) : 0 });
      faces.forEach((f, i) => { f.position.y = 0.08 + 0.015 * Math.sin(t * 2 + i); if (camPos) f.lookAt(camPos.x, f.position.y + 0.3, camPos.z); });
      k1.visible = shot === 7 && t > tWe - 0.4; k1.setReveal(smooth(tWe - 0.4, tWe + 0.3, t));
      k2.visible = shot === 7 && t > tTo - 0.6; k2.setReveal(smooth(tTo - 0.6, tTo + 0.5, t));
    },
  };
}

// ============ B: the atom ============
function locAtom() {
  const G = room({ w: 9, d: 8, h: 4, wall: M.plaster('#2c3a56', 901), floor: M.concrete('#323a4c', 902), wainscot: '#22304a', ceil: '#262f44', interior: '#1a2236' });
  const N = new THREE.Vector3(0, 1.5, -1.5);
  const nuc = new THREE.Group(); nuc.position.copy(N); G.add(nuc);
  const r = rng(11);
  for (let i = 0; i < 22; i++) {
    const v = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(0.28 * Math.cbrt(r()));
    const s = mesh(new THREE.SphereGeometry(0.12, 18, 12), M.flat(i % 2 ? '#d9534a' : '#9aa7b0', 910 + (i % 2)), { inkOpts: { hull: 0.012, edges: 0 } });
    s.position.copy(v); nuc.add(s);
  }
  const nglow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), GLOW); nglow.position.copy(N).add(new THREE.Vector3(0, 0, -0.3)); G.add(nglow);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.012, 6, 120), new THREE.MeshBasicMaterial({ color: '#8fd8ff', transparent: true, opacity: 0.6 })); ring.position.copy(N); ring.rotation.x = Math.PI / 2 - 0.35; G.add(ring);
  const nT = labelTex({ w: 600, h: 160, bg: '#f6efd8', border: INK, seed: 2, lines: [{ text: 'NUCLEUS', size: 120, y: 0.56 }] });
  G.add(plane(0.6, 0.16, M.label(nT), { x: 0, y: 1.0, z: -1.2 }));
  // the vice
  const jawMat = M.flat('#7a8790', 912);
  const jawL = box(0.3, 0.6, 0.5, jawMat, { inkOpts: { hull: 0.01, edges: 30, dynamic: true } }), jawR = box(0.3, 0.6, 0.5, jawMat, { inkOpts: { hull: 0.01, edges: 30, dynamic: true } });
  G.add(jawL, jawR);
  // gauges
  const gauge = (x, title) => {
    const c = document.createElement('canvas'); c.width = 900; c.height = 500; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace;
    const g = new THREE.Group(); g.add(box(1.4, 0.82, 0.1, M.dark('#2a3036'), { y: 1.0, inkOpts: { hull: 0.01, edges: 30 } }));
    g.add(plane(1.3, 0.72, basic('#ffffff', { map: t }), { y: 1.41, z: 0.056 })); g.add(box(0.1, 1.0, 0.1, M.dark('#3a4044'), { z: -0.05 }));
    g.position.set(x, 0, -0.4); g.rotation.y = -x * 0.25; G.add(g);
    return (val, col = '#9dff8a', jitter = 0) => { const k = c.getContext('2d'); k.fillStyle = '#10202a'; k.fillRect(0, 0, 900, 500); k.fillStyle = '#8af2c2'; k.font = `110px ${SIGN_FONT}`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(title, 450, 110); k.fillStyle = col; k.font = `130px ${SIGN_FONT}`; k.fillText(val, 450 + jitter, 330); t.needsUpdate = true; };
  };
  const gPos = gauge(-1.7, 'POSITION'), gMom = gauge(1.7, 'MOMENTUM');
  const sign = hangingSign('ATOM: NOT COLLAPSED', 2.2, 0.42, { bg: '#ffd36a', size: 180, rod: 0.6 }); sign.position.set(0, 3.0, -2.6); G.add(sign); makeDynamic(sign);
  // electron with helmet
  const e = makeElectron(8, 0.62); addHelmet(e); G.add(e.root);
  const ghosts = [];
  for (let i = 0; i < 4; i++) { const gm = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), GLOW); G.add(gm); ghosts.push(gm); }
  const arrows = [];
  const arrT = labelTex({ w: 256, h: 128, bg: null, wearAmount: 0, paint: (g) => { g.fillStyle = '#ffd36a'; g.beginPath(); g.moveTo(10, 50); g.lineTo(170, 50); g.lineTo(170, 20); g.lineTo(246, 64); g.lineTo(170, 108); g.lineTo(170, 78); g.lineTo(10, 78); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke(); } });
  for (let i = 0; i < 6; i++) { const a = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.21), new THREE.MeshBasicMaterial({ map: arrT, transparent: true, depthWrite: false })); G.add(a); arrows.push(a); }
  const CLOUD_MAT = GLOW.clone(); CLOUD_MAT.opacity = 0.35;
  const cloud = new THREE.Group(); for (let i = 0; i < 8; i++) { const c = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), CLOUD_MAT); const a = (i / 8) * Math.PI * 2; c.position.set(Math.cos(a) * 1.3, Math.sin(a * 2) * 0.3, Math.sin(a) * 0.5); cloud.add(c); } cloud.position.copy(N); G.add(cloud);
  const stars = new THREE.Group();
  for (let i = 0; i < 3; i++) { const sb = new Builder(); const pts = []; for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 + Math.PI / 2, rr = k % 2 ? 0.03 : 0.07; pts.push(V(Math.cos(a) * rr, Math.sin(a) * rr)); } sb.add(pts, '#ffd23a', { inkW: 0.008, seed: 30 + i }); const s = new THREE.Mesh(sb.build(), CHAR_MAT); s.userData.i = i; stars.add(s); }
  G.add(stars);
  G.add(pendant(-2.2, 3.6, 0.5, '#3a4a5a')); G.add(pendant(2.2, 3.6, 0.5, '#3a4a5a'));
  bakeEdges(G);
  const tSq = beat(2, 'squeezed'), tPr = beat(2, 'precise'), tUn = beat(3, 'uncertain'), t3 = shotStart(3), tFly = beat(4, 'fly'), tCol = beat(5, 'collapsing');
  const orbit = (a, rad = 1.6) => { const v = new THREE.Vector3(Math.cos(a) * rad, 0, Math.sin(a) * rad); v.applyAxisAngle(new THREE.Vector3(1, 0, 0), -0.35); return v.add(N); };
  let lastG = '';
  return {
    group: G,
    update(t, camPos, shot) {
      nuc.rotation.y = t * 0.3;
      const squeezeAt = new THREE.Vector3(0.62, 1.18, -1.2);
      let pos, jit = 0, sq = 0;
      if (shot === 1 || shot === 5) pos = orbit(t * 1.6 + 0.6);
      else if (shot === 2) { const d = smooth(shotStart(2), tSq + 0.3, t); pos = new THREE.Vector3().lerpVectors(orbit(shotStart(2) * 1.6 + 0.6), squeezeAt, d); sq = smooth(tSq + 0.1, tPr - 0.3, t); }
      else if (shot === 3) { pos = squeezeAt.clone(); sq = 1; jit = smooth(t3, tUn, t); }
      else if (shot === 4) {
        const f = smooth(tFly - 0.35, tFly + 0.6, t);
        pos = new THREE.Vector3().lerpVectors(squeezeAt, new THREE.Vector3(-1.7, 1.7, 0.1), f); pos.y += Math.sin(f * Math.PI) * 0.7;
        sq = 1 - smooth(tFly - 0.4, tFly - 0.1, t); jit = t < tFly - 0.3 ? 1 : 0;
      } else pos = orbit(t * 1.6);
      if (jit > 0) pos.add(new THREE.Vector3(Math.sin(t * 53) * 0.06 * jit, Math.cos(t * 47) * 0.05 * jit, 0));
      e.root.position.copy(pos).add(new THREE.Vector3(0, -0.32, 0));
      e.root.visible = shot <= 5;
      animElectron(e, t, camPos, { nervous: jit > 0.5 ? 1 : 0, pose: shot === 4 && t > tFly + 0.4 ? 0.6 : 0 });
      // vice jaws close in shot 2, stay in 3, open as it escapes in 4
      const gap = lerp(0.9, 0.24, sq);
      jawL.position.set(squeezeAt.x - gap / 2 - 0.15, squeezeAt.y - 0.3, squeezeAt.z); jawR.position.set(squeezeAt.x + gap / 2 + 0.15, squeezeAt.y - 0.3, squeezeAt.z);
      jawL.visible = jawR.visible = shot >= 2 && shot <= 4;
      ghosts.forEach((gm, i) => { gm.visible = jit > 0.3; gm.position.copy(squeezeAt).add(new THREE.Vector3(Math.sin(t * 31 + i * 2) * 0.25, Math.cos(t * 29 + i) * 0.2 - 0.05, 0.05)); gm.scale.setScalar(0.5 + 0.3 * jit); });
      arrows.forEach((a, i) => { a.visible = jit > 0.4; const ang = i * 1.05 + Math.sin(t * 9 + i) * 0.5; a.position.copy(squeezeAt).add(new THREE.Vector3(Math.cos(ang) * 0.45, Math.sin(ang) * 0.4, 0.1)); a.rotation.set(0, 0, ang); });
      stars.visible = shot === 4 && t > tFly + 0.5;
      if (stars.visible) { stars.position.copy(e.root.position).add(new THREE.Vector3(0, 0.75, 0)); stars.children.forEach((s) => { const a = t * 6 + s.userData.i * 2.1; s.position.set(Math.cos(a) * 0.2, Math.sin(a * 2) * 0.03, Math.sin(a) * 0.1); }); }
      cloud.visible = shot === 5; cloud.rotation.y = t * 0.4; cloud.children.forEach((c) => { if (camPos) c.lookAt(camPos.x, camPos.y, camPos.z); });
      sign.visible = shot === 5 && t > tCol - 0.6; sign.position.y = lerp(4.6, 3.0, smooth(tCol - 0.6, tCol, t));
      // gauges
      const key = shot === 2 ? (t > tPr - 0.3 ? 'p' : 'a') : shot === 3 ? `m${Math.floor(t * 12)}` : shot === 4 ? `w${Math.floor(t * 12)}` : 'n';
      if (key !== lastG) {
        if (shot === 2 && t > tPr - 0.3) { gPos('SUPER PRECISE', '#9dff8a'); gMom('...', '#8aa'); }
        else if (shot === 3 || shot === 4) { gPos('SUPER PRECISE', '#9dff8a'); gMom(t > tUn - 0.5 || shot === 4 ? ['???', 'HUGE?', '!!!', 'WILD'][Math.floor(t * 12) % 4] : '...', '#ff6a5a', t > tUn - 0.5 ? 25 * Math.sin(t * 40) : 0); }
        else { gPos('---', '#8aa'); gMom('---', '#8aa'); }
        lastG = key;
      }
    },
  };
}

export function buildWorld() {
  const scene = new THREE.Scene();
  const locs = { A: locLab(), B: locAtom() };
  for (const [k, L] of Object.entries(locs)) { L.group.position.x = LOC[k]; scene.add(L.group); }
  const sky = skyDome('#8fc3e3', '#f2dcc0', 5); scene.add(sky);
  const hemi = new THREE.HemisphereLight('#fff2dc', '#7a6a58', 1.6); scene.add(hemi);
  const key = new THREE.DirectionalLight('#ffe2b8', 2.6);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03;
  const sc = key.shadow.camera; sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -14; sc.near = 1; sc.far = 120;
  scene.add(key); scene.add(key.target);
  const lamp = new THREE.PointLight('#ffd9a0', 0, 9, 1.6); scene.add(lamp);
  scene.fog = new THREE.Fog('#e8d6b6', 30, 160);
  return { scene, locs, sky, hemi, key, lamp };
}
