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

export const LOC = { A: 0, B: 60, C: 120, D: 200, E: 280 };

// proton: a cartoon prop like the electron, red with a plus sign
function makeProton(seed = 1, scale = 1) {
  const root = new THREE.Group(), yawG = new THREE.Group(), bodyG = new THREE.Group();
  root.add(yawG); yawG.add(bodyG); bodyG.scale.setScalar(scale);
  const cy = 0.52;
  const b = new Builder();
  b.add(circlePts(0, cy, 0.3, 0.3, 48), '#e0533f', { inkW: 0.018, seed });
  b.add(circlePts(-0.09, cy + 0.12, 0.12, 0.07, 20), '#f29a86', { inkW: 0 });
  b.add([V(-0.09, cy - 0.15), V(0.09, cy - 0.15), V(0.09, cy - 0.115), V(-0.09, cy - 0.115)], '#fff4ec', { inkW: 0.006, seed: seed + 1 });
  b.add([V(-0.0175, cy - 0.22), V(0.0175, cy - 0.22), V(0.0175, cy - 0.045), V(-0.0175, cy - 0.045)], '#fff4ec', { inkW: 0.006, seed: seed + 2 });
  for (const ex of [-0.1, 0.1]) { b.add(circlePts(ex, cy + 0.05, 0.05, 0.035, 14, Math.PI, Math.PI * 2), '#fbf6ea', { inkW: 0.006, seed }); b.add(circlePts(ex, cy + 0.035, 0.02, 0.018, 10), INK, { inkW: 0 }); b.add([V(ex - 0.06, cy + 0.06), V(ex + 0.06, cy + 0.06), V(ex + 0.055, cy + 0.075), V(ex - 0.055, cy + 0.075)], INK, { inkW: 0 }); }
  for (const sd of [-1, 1]) b.add([V(sd * 0.04, cy + 0.12), V(sd * 0.16, cy + 0.15), V(sd * 0.16, cy + 0.17), V(sd * 0.04, cy + 0.14)], INK, { inkW: 0 });
  const body = new THREE.Mesh(b.build(), CHAR_MAT); bodyG.add(body);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), GLOW); glow.position.set(0, cy, -0.03); bodyG.add(glow);
  const shadow = blob(0.5 * scale, 0.22 * scale); root.add(shadow);
  return { root, yawG, bodyG, face: 0 };
}

// ============ A: host's lab ============
function locLab() {
  const { G, host, board } = hostLab({ title: 'QUANTUM TUNNELLING' });
  // shot 7: odds meter + labels; shot 11: the honest list
  const oddsLbl = chalkText('ODDS OF GETTING THROUGH', 2.6, 0.3, 120); oddsLbl.position.set(board.x0 + 0.2, board.faceY + 0.3, board.faceZ + 0.003); G.add(oddsLbl);
  const bar = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.18), basic('#ffd36a')); bar.geometry.translate(0.5, 0, 0); bar.position.set(board.x0 + 0.25, board.faceY + 0.02, board.faceZ + 0.004); G.add(bar);
  const t1 = chalkText('THICKER WALL ↓', 1.8, 0.28, 120); t1.position.set(board.x0 + 0.2, board.faceY - 0.26, board.faceZ + 0.003); G.add(t1);
  const t2 = chalkText('HEAVIER THING ↓', 1.8, 0.28, 120); t2.position.set(board.x0 + 0.2, board.faceY - 0.52, board.faceZ + 0.003); G.add(t2);
  const t3 = chalkText('YOU ≈ 10²⁸ ATOMS', 1.7, 0.3, 130, '#ff8a7a'); t3.position.set(board.x0 + 2.0, board.faceY - 0.4, board.faceZ + 0.003); G.add(t3);
  const h1 = chalkText('TELEPORTING  ✗', 2.0, 0.3, 130, '#ff8a7a'); h1.position.set(board.x0 + 0.25, board.faceY + 0.24, board.faceZ + 0.003); G.add(h1);
  const h2 = chalkText('FASTER THAN LIGHT  ✗', 2.6, 0.3, 130, '#ff8a7a'); h2.position.set(board.x0 + 0.25, board.faceY - 0.1, board.faceZ + 0.003); G.add(h2);
  const h3 = chalkText('WAVES + ODDS  ✓', 2.2, 0.3, 130, '#ffd36a'); h3.position.set(board.x0 + 0.25, board.faceY - 0.44, board.faceZ + 0.003); G.add(h3);
  // the "bedroom wall" tag on the right wall
  const bwT = labelTex({ w: 700, h: 220, bg: '#f6efd8', border: INK, seed: 3, lines: [{ text: 'BEDROOM WALL', size: 130, y: 0.56 }] });
  const bw = plane(0.9, 0.28, M.label(bwT), { x: 3.88, y: 1.75, z: 0.2, ry: -Math.PI / 2 }); G.add(bw);
  const stars = new THREE.Group();
  for (let i = 0; i < 3; i++) { const sb = new Builder(); const pts = []; for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 + Math.PI / 2, rr = k % 2 ? 0.035 : 0.08; pts.push(V(Math.cos(a) * rr, Math.sin(a) * rr)); } sb.add(pts, '#ffd23a', { inkW: 0.01, seed: 30 + i }); const s = new THREE.Mesh(sb.build(), CHAR_MAT); s.userData.i = i; stars.add(s); }
  G.add(stars);
  bakeEdges(G);
  const tTh = beat(7, 'Thicker'), tHe = beat(7, 'heavier'), t28 = beat(7, 'twentyeight'), tSt = beat(7, 'Stop'), tWall = beat(7, 'wall', 0);
  const tTe = beat(11, 'teleporting'), tLi = beat(11, 'light'), tOd = beat(11, 'odds');
  return {
    group: G,
    update(t, camPos, shot) {
      const s7 = shot === 7, s11 = shot === 11;
      oddsLbl.visible = s7; bar.visible = s7; t1.visible = s7 && t > tTh - 0.3; t2.visible = s7 && t > tHe - 0.3; t3.visible = s7 && t > t28 - 0.6;
      t1.setReveal(smooth(tTh - 0.3, tTh + 0.4, t)); t2.setReveal(smooth(tHe - 0.3, tHe + 0.4, t)); t3.setReveal(smooth(t28 - 0.6, t28 + 0.3, t));
      bar.scale.x = s7 ? lerp(2.4, 0.03, smooth(tTh - 0.2, tHe + 0.6, t)) : 1;
      h1.visible = s11 && t > tTe - 0.5; h1.setReveal(smooth(tTe - 0.5, tTe + 0.3, t));
      h2.visible = s11 && t > tLi - 0.7; h2.setReveal(smooth(tLi - 0.7, tLi + 0.2, t));
      h3.visible = s11 && t > tOd - 0.6; h3.setReveal(smooth(tOd - 0.6, tOd + 0.2, t));
      stars.visible = false; host.root.rotation.set(0, 0, 0);
      if (shot === 1) { host.root.position.set(1.2, 0, -1.2); animChar(host, t, camPos, {}); }
      else if (s7) {
        // walks right into the "bedroom wall" on "Stop trying your bedroom wall"
        const w = smooth(tSt - 0.6, tWall, t), after = clamp((t - tWall) / 0.35, 0, 1);
        const x = lerp(2.2, 3.62, w) - 0.25 * Math.sin(after * Math.PI * 0.5);
        host.root.position.set(x, 0, 0.2); host.root.rotation.z = after > 0 ? 0.12 * Math.sin(after * Math.PI * 3) * (1 - after * 0.5) : 0;
        animChar(host, t, camPos, { walking: w > 0 && w < 1 ? 1 : 0 });
        if (t > tWall) { stars.visible = true; stars.position.set(x, 1.85, 0.25); stars.children.forEach((s) => { const a = t * 6 + s.userData.i * 2.1; s.position.set(Math.cos(a) * 0.28, Math.sin(a * 2) * 0.03, Math.sin(a) * 0.12); }); }
      } else if (s11) { host.root.position.set(1.0, 0, -1.0); animChar(host, t, camPos, { point: 0.5 }); }
      else { host.root.position.set(-2.6, 0, -0.6); animChar(host, t, camPos, {}); }
    },
  };
}

// ============ B: the hill ============
function locHill() {
  const G = new THREE.Group();
  const grass = plane(200, 140, M.grass('#86a85e', 1001), { rx: -Math.PI / 2 }); grass.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = i % 2 ? v * 140 : v * 200; }); grass.receiveShadow = true; G.add(grass);
  const H = 1.6, SIG = 1.1, hill = (x) => H * Math.exp(-(x * x) / (2 * SIG * SIG));
  const s = new THREE.Shape(); s.moveTo(-4.5, 0);
  for (let i = 0; i <= 60; i++) { const x = -4.5 + (9 * i) / 60; s.lineTo(x, hill(x)); }
  s.lineTo(4.5, 0); s.lineTo(-4.5, 0);
  const hg = new THREE.ExtrudeGeometry(s, { depth: 4, bevelEnabled: false, curveSegments: 1 }); hg.translate(0, 0, -2);
  const hm = mesh(hg, M.grass('#7a9f52', 1002), { inkOpts: { hull: 0.03, edges: 40 } }); G.add(hm);
  const ball = mesh(new THREE.SphereGeometry(0.25, 24, 16), M.flat('#d9493a', 1003), { inkOpts: { hull: 0.015, edges: 0 } });
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.02, 6, 32), basic('#f4f1e6')); ball.add(stripe);
  G.add(ball);
  const ebT = labelTex({ w: 1000, h: 260, bg: '#ffd36a', border: INK, seed: 2, lines: [{ text: 'ENERGY BARRIER', size: 170, y: 0.55 }] });
  const eb = signBoard({ w: 1.7, h: 0.44, texture: ebT, posts: 1, postH: 0.9 }); eb.position.set(0, H - 0.05, -0.6); G.add(eb); makeDynamic(eb);
  const ncT = labelTex({ w: 600, h: 600, bg: '#f4f1e6', border: '#b3261e', seed: 3, lines: [{ text: 'NO', size: 180, y: 0.32, color: '#b3261e' }, { text: 'ENERGY,', size: 110, y: 0.55 }, { text: 'NO CROSSING', size: 90, y: 0.75 }] });
  const nc = signBoard({ w: 0.8, h: 0.8, texture: ncT, posts: 0, postH: 1.3 }); nc.add(box(0.08, 1.3, 0.08, M.dark('#3a3a3c'), { z: -0.06 })); nc.position.set(-3.2, 0, 1.2); nc.rotation.y = 0.3; G.add(nc); makeDynamic(nc);
  const r = rng(4);
  const tree = (x, z, sc) => { const t = new THREE.Group(); t.add(cyl(0.16 * sc, 0.12 * sc, 1.4 * sc, M.wood('#6a4a30', 1010), { seg: 8 })); for (let k = 0; k < 3; k++) t.add(cyl(1.0 * sc - k * 0.25 * sc, 0.05, 1.3 * sc, M.flat(['#4f7a3e', '#5f8a48', '#6e9a52'][k], 1011 + k), { y: 1.1 * sc + k * 0.55 * sc, seg: 10 })); t.position.set(x, 0, z); return t; };
  for (let i = 0; i < 9; i++) G.add(tree(-14 + i * 3.6 + r() * 1.5, -6 - r() * 4, 0.9 + r() * 0.6));
  G.add(hills({ w: 400, h: 20, seed: 6, color: '#a7b48f', z: -90 }));
  bakeEdges(G);
  const t2 = shotStart(2), tBack = beat(2, 'back'), tBa = beat(3, 'barrier'), tCr = beat(3, 'crossing');
  return {
    group: G,
    update(t, camPos, shot) {
      // roll in, climb, stop, roll back (shot 2); idle at the foot after
      let x;
      if (shot === 2) { const u = clamp((t - t2) / (tBack + 0.6 - t2), 0, 1); x = -5.2 + 4.1 * Math.sin(Math.PI * u) * (u < 0.5 ? 1 : 1) - (u > 0.5 ? 0.8 * (u - 0.5) * 2 : 0); }
      else x = -4.6;
      ball.position.set(x, hill(x) + 0.25, 0.6);
      ball.rotation.z = -x / 0.25;
      eb.visible = shot === 3 && t > tBa - 0.4; eb.position.y = H - 0.05 + lerp(-1.2, 0, smooth(tBa - 0.4, tBa + 0.1, t));
      nc.visible = shot === 3 && t > tCr - 0.4; nc.rotation.x = lerp(-1.4, 0, smooth(tCr - 0.4, tCr, t));
    },
  };
}

// ============ C: the wave track ============
function locWave() {
  const G = room({ w: 10, d: 6, h: 3.6, wall: M.plaster('#c7cfd2', 1101), floor: M.concrete('#8f9496', 1102), wainscot: '#3e4c56', ceil: '#aab2b4' });
  G.add(box(8.4, 0.85, 0.9, M.panel('#4a5a60', 1103), { z: -0.3 }));
  // translucent barrier block
  const barrier = box(0.55, 1.5, 0.7, new THREE.MeshBasicMaterial({ color: '#8ea6b8', transparent: true, opacity: 0.42, depthWrite: false }), { x: 0.275, y: 0.85, z: -0.3, inkOpts: { hull: 0, edges: 30 } });
  G.add(barrier);
  const bT = labelTex({ w: 600, h: 160, bg: '#f6efd8', border: INK, seed: 2, lines: [{ text: 'BARRIER', size: 120, y: 0.56 }] });
  G.add(plane(0.5, 0.13, M.label(bT), { x: 0.275, y: 0.75, z: 0.06 }));
  // wave shown as a glowing line on a vertical plane through the track
  const waveMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uT: { value: 0 }, uFront: { value: -10 }, uK: { value: 7.5 }, uKap: { value: 2.6 }, uD: { value: 0.55 } },
    vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float uT; uniform float uFront; uniform float uK; uniform float uKap; uniform float uD; varying vec2 vP;
      float psi(float x){ if (x > uFront) return 0.0; float w = uK * 0.9;
        if (x < 0.0) return 0.42 * cos(uK * x - w * uT) + 0.22 * cos(-uK * x - w * uT + 1.0);
        if (x < uD) return 0.48 * exp(-uKap * x) * cos(-w * uT + 0.4);
        return 0.48 * exp(-uKap * uD) * cos(uK * (x - uD) - w * uT + 0.4); }
      float env(float x){ if (x > uFront) return 0.0; if (x < 0.0) return 0.6; if (x < uD) return 0.48 * exp(-uKap * x); return 0.48 * exp(-uKap * uD); }
      void main(){ float x = vP.x; float y = psi(x); float d = abs(vP.y - y);
        float line = 1.0 - smoothstep(0.018, 0.04, d);
        float e = env(x); float band = (abs(vP.y) < e) ? 0.08 : 0.0;
        vec3 col = vec3(0.45, 0.9, 1.0);
        float a = max(line, band);
        if (a < 0.01) discard;
        gl_FragColor = vec4(col * (0.6 + 0.6 * line), a); }`,
  });
  const wave = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 1.6, 1, 1), waveMat); wave.position.set(0, 1.55, -0.3); G.add(wave);
  const e = makeElectron(9, 0.7); G.add(e.root);
  const qtSign = hangingSign('QUANTUM TUNNELLING', 2.8, 0.5, { bg: '#ffd36a', size: 200, rod: 0.6 }); qtSign.position.set(0, 2.85, -2.7); G.add(qtSign); makeDynamic(qtSign);
  const lt = labelTex({ w: 500, h: 150, bg: '#f6efd8', border: INK, seed: 4, lines: [{ text: 'THIS SIDE', size: 110, y: 0.56 }] });
  const rt = labelTex({ w: 600, h: 150, bg: '#f6efd8', border: INK, seed: 5, lines: [{ text: 'OTHER SIDE', size: 110, y: 0.56 }] });
  G.add(plane(0.6, 0.18, M.label(lt), { x: -2.6, y: 0.62, z: 0.16 })); G.add(plane(0.66, 0.18, M.label(rt), { x: 2.6, y: 0.62, z: 0.16 }));
  G.add(pendant(-1.8, 3.2, 0.4, '#3a4a5a')); G.add(pendant(1.8, 3.2, 0.4, '#3a4a5a'));
  bakeEdges(G);
  const t4 = shotStart(4), tOther = beat(6, 'other'), tQt = beat(6, 'tunnelling');
  return {
    group: G,
    update(t, camPos, shot) {
      waveMat.uniforms.uT.value = t;
      waveMat.uniforms.uFront.value = shot === 4 ? lerp(-3.8, 0.4, smooth(t4, beat(4, 'wall'), t)) : (shot === 5 ? lerp(0.4, 3.8, smooth(shotStart(5), beat(5, 'through'), t)) : 3.8);
      e.root.visible = shot === 6 && t > tOther - 0.4;
      e.root.position.set(2.6, 0.85, -0.25);
      e.bodyG.scale.setScalar(0.7 * smooth(tOther - 0.4, tOther, t) + 0.0001);
      animElectron(e, t, camPos, { pose: smooth(tQt - 0.3, tQt, t) * 0.7 });
      qtSign.visible = shot === 6 && t > tQt - 0.5; qtSign.position.y = lerp(4.4, 2.85, smooth(tQt - 0.5, tQt, t));
    },
  };
}

// ============ D: the Sun's core ============
function locSun() {
  const G = new THREE.Group();
  const bgT = canvasTex(1024, 1024, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7); grd.addColorStop(0, '#fff2b0'); grd.addColorStop(0.35, '#ffb347'); grd.addColorStop(1, '#c2410c'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
    const r = rng(3); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,${200 + Math.floor(r() * 55)},120,${0.08 + r() * 0.12})`; g.beginPath(); g.arc(r() * w, r() * h, 20 + r() * 80, 0, 7); g.fill(); }
  }, { wrap: false });
  G.add(new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), new THREE.MeshBasicMaterial({ map: bgT, side: THREE.BackSide, fog: false })));
  const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 48), new THREE.MeshToonMaterial({ gradientMap: GRAD, color: '#d9772e' })); floor.rotation.x = -Math.PI / 2; G.add(floor);
  const p1 = makeProton(11, 0.9), p2 = makeProton(12, 0.9); G.add(p1.root, p2.root);
  const arrT = labelTex({ w: 256, h: 128, bg: null, wearAmount: 0, paint: (g) => { g.fillStyle = '#fff4ec'; g.beginPath(); g.moveTo(10, 50); g.lineTo(170, 50); g.lineTo(170, 20); g.lineTo(246, 64); g.lineTo(170, 108); g.lineTo(170, 78); g.lineTo(10, 78); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke(); } });
  const am = new THREE.MeshBasicMaterial({ map: arrT, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const aL = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), am), aR = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), am); aL.rotation.z = Math.PI; G.add(aL, aR);
  const repT = labelTex({ w: 700, h: 200, bg: '#f6efd8', border: INK, seed: 4, lines: [{ text: 'REPEL!', size: 150, y: 0.56, color: '#b3261e' }] });
  const rep = plane(0.7, 0.2, M.label(repT), { y: 1.75, z: 0.2 }); G.add(rep);
  const thT = labelTex({ w: 600, h: 1000, bg: '#f6efd8', border: INK, seed: 5, lines: [{ text: 'SUN CORE', size: 100, y: 0.08 }, { text: '15 000 000', size: 130, y: 0.85 }, { text: '°C', size: 100, y: 0.95 }],
    paint: (g, w, h) => { g.fillStyle = '#d23a2a'; g.fillRect(w / 2 - 30, h * 0.18, 60, h * 0.55); g.beginPath(); g.arc(w / 2, h * 0.75, 70, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 10; g.strokeRect(w / 2 - 40, h * 0.16, 80, h * 0.56); } });
  const th = signBoard({ w: 1.0, h: 1.65, texture: thT, posts: 0, postH: 0.15 }); th.add(box(0.08, 0.15, 0.08, M.dark('#3a3a3c'), { z: -0.06 })); th.position.set(-2.1, 0, -1.5); th.rotation.y = 0.3; G.add(th);
  const wall = box(0.12, 1.4, 1.0, new THREE.MeshBasicMaterial({ color: '#ffe6b0', transparent: true, opacity: 0.35, depthWrite: false }), { x: 0, z: 0, inkOpts: { hull: 0, edges: 30, dynamic: true } }); G.add(wall);
  const flash = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), GLOW); flash.position.set(0, 0.95, 0.1); G.add(flash);
  const fuseT = labelTex({ w: 700, h: 200, bg: '#ffd36a', border: INK, seed: 6, lines: [{ text: 'FUSION!', size: 150, y: 0.56 }] });
  const fuseS = plane(0.8, 0.23, M.label(fuseT), { y: 2.1, z: 0.2 }); G.add(fuseS);
  bakeEdges(G);
  const tRe = beat(8, 'repel'), tFuse = beat(8, 'fuse'), tTu = beat(9, 'tunnel'), tPow = beat(9, 'power');
  return {
    group: G,
    update(t, camPos, shot) {
      let gap, ghost = 0;
      if (shot === 8) { const k = (t - tRe + 0.6) * 1.4; gap = 0.9 + 0.5 * Math.abs(Math.sin(k)) * (t > tRe - 0.6 ? 1 : 0) + (t < tRe - 0.6 ? 0.6 : 0); }
      else { const pass = smooth(tTu - 0.3, tTu + 0.6, t); gap = lerp(0.9, 0.0, pass); ghost = pass; }
      p1.root.position.set(-gap / 2 - 0.3, 0.1, 0); p2.root.position.set(gap / 2 + 0.3, 0.1, 0);
      if (shot === 9 && t > tPow - 0.2) { p1.root.position.x = -0.2; p2.root.position.x = 0.2; }
      [p1, p2].forEach((p, i) => { p.bodyG.position.y = 0.02 * Math.sin(t * 3 + i); p.bodyG.rotation.z = (i ? -1 : 1) * 0.05 * Math.sin(t * 5); if (camPos) { const wp = new THREE.Vector3(); p.root.getWorldPosition(wp); p.yawG.rotation.y = clamp(Math.atan2(camPos.x - wp.x, camPos.z - wp.z), -0.7, 0.7); } });
      const repelOn = shot === 8 && t > tRe - 0.3;
      aL.visible = aR.visible = repelOn; rep.visible = repelOn;
      aL.position.set(-gap / 2 - 0.9, 0.62, 0.05); aR.position.set(gap / 2 + 0.9, 0.62, 0.05);
      wall.visible = shot === 9 && t > tTu - 0.8; wall.position.y = 0.9;
      flash.visible = shot === 9 && t > tPow - 0.25; flash.scale.setScalar(0.6 + 1.2 * smooth(tPow - 0.25, tPow + 0.4, t));
      fuseS.visible = shot === 9 && t > tPow - 0.1;
    },
  };
}

// ============ E: tech desk (phone + STM) ============
function locTech() {
  const G = room({ w: 8, d: 6, h: 3.4, wall: M.wallpaper('#d8d2c0', '#cbc3ac', 1201), floor: M.wood('#6e4e34', 1202), wainscot: '#4e5e48', ceil: '#d6d2c0' });
  const desk = new THREE.Group(); desk.add(box(3.4, 0.08, 1.2, M.wood('#5c3c24', 1203), { y: 0.82 }));
  for (const [x, z] of [[-1.6, -0.5], [1.6, -0.5], [-1.6, 0.5], [1.6, 0.5]]) desk.add(box(0.1, 0.82, 0.1, M.wood('#4c3220', 1204), { x, z }));
  desk.position.set(0, 0, -0.8); G.add(desk);
  // phone, lying at an angle, screen showing a chip
  const phT = canvasTex(400, 800, (g, w, h) => { g.fillStyle = '#10202a'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a6a52'; g.fillRect(60, 240, w - 120, 320); g.strokeStyle = '#9dff8a'; g.lineWidth = 4; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(60, 270 + i * 38); g.lineTo(0, 270 + i * 38); g.moveTo(w - 60, 270 + i * 38); g.lineTo(w, 270 + i * 38); g.stroke(); } g.fillStyle = '#9dff8a'; g.font = `60px ${SIGN_FONT}`; g.textAlign = 'center'; g.fillText('FLASH', w / 2, 380); g.fillText('MEMORY', w / 2, 450); for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(160,240,255,${0.5})`; g.beginPath(); g.arc(80 + (i * 37) % 240, 620 + (i * 53) % 120, 8, 0, 7); g.fill(); } }, { wrap: false });
  const phone = new THREE.Group(); phone.add(box(0.36, 0.03, 0.7, M.dark('#22262a'), { inkOpts: { hull: 0.004, edges: 30, thin: true } }));
  phone.add(plane(0.32, 0.64, basic('#ffffff', { map: phT }), { rx: -Math.PI / 2, y: 0.032 }));
  phone.position.set(-0.9, 0.905, -0.6); phone.rotation.y = 0.3; G.add(phone);
  const fmT = labelTex({ w: 700, h: 180, bg: '#f6efd8', border: INK, seed: 2, lines: [{ text: 'FLASH MEMORY', size: 130, y: 0.56 }] });
  const fm = plane(0.62, 0.16, M.label(fmT), { x: -0.9, y: 0.9, z: -0.08, rx: -0.5 }); G.add(fm);
  // STM: stand, arm, sharp tip over a surface of atoms, sparks, monitor
  const stm = new THREE.Group();
  stm.add(box(0.7, 0.08, 0.5, M.dark('#3a3a3c')));
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const a = mesh(new THREE.SphereGeometry(0.045, 12, 8), M.flat('#c9a24a', 1205), { inkOpts: { hull: 0.004, edges: 0 } }); a.position.set(-0.22 + i * 0.088, 0.1, -0.13 + j * 0.088); stm.add(a); }
  stm.add(box(0.06, 0.65, 0.06, M.dark('#3a3a3c'), { x: 0.3, z: -0.2 }));
  const arm = new THREE.Group(); arm.position.set(0.3, 0.6, -0.2); stm.add(arm);
  arm.add(box(0.4, 0.05, 0.05, M.dark('#3a3a3c'), { x: -0.2, inkOpts: { hull: 0.004, edges: 30, dynamic: true, thin: true } }));
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.42, 12), M.flat('#c9ccd0', 1206)); tip.rotation.x = Math.PI; tip.position.set(-0.36, -0.21, 0); arm.add(tip);
  const spark = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), GLOW); stm.add(spark);
  stm.position.set(0.85, 0.86, -0.75); G.add(stm); makeDynamic(stm);
  const mon = new THREE.Group(); const monT = canvasTex(800, 600, (g, w, h) => { g.fillStyle = '#121a1e'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9; i++) for (let j = 0; j < 6; j++) { const x = 70 + i * 82 + (j % 2) * 41, y = 110 + j * 82; const r = g.createRadialGradient(x, y, 0, x, y, 40); r.addColorStop(0, '#ffe08a'); r.addColorStop(1, 'rgba(255,180,60,0)'); g.fillStyle = r; g.fillRect(x - 40, y - 40, 80, 80); } g.fillStyle = '#8af2c2'; g.font = `56px ${SIGN_FONT}`; g.textAlign = 'center'; g.fillText('SINGLE ATOMS', w / 2, 50); }, { wrap: false });
  mon.add(box(0.95, 0.72, 0.08, M.dark('#2a3036'), { inkOpts: { hull: 0.008, edges: 30 } })); mon.add(plane(0.86, 0.64, basic('#ffffff', { map: monT }), { y: 0.36, z: 0.045 })); mon.add(box(0.08, 0.3, 0.08, M.dark('#2a3036'), { y: -0.3 }));
  mon.position.set(1.0, 1.18, -1.25); G.add(mon);
  const stmT = labelTex({ w: 1300, h: 200, bg: '#f6efd8', border: INK, seed: 3, lines: [{ text: 'SCANNING TUNNELLING MICROSCOPE', size: 110, y: 0.56 }] });
  G.add(plane(1.3, 0.2, M.label(stmT), { x: 0.85, y: 0.9, z: -0.15, rx: -0.5 }));
  G.add(pendant(0, 2.9, -0.4, '#4a5e48'));
  bakeEdges(G);
  return {
    group: G,
    update(t) {
      const sx = 0.22 * Math.sin(t * 1.2);
      arm.position.x = 0.3 + sx * 0.6;
      spark.position.set(arm.position.x - 0.36, 0.17, -0.2); spark.scale.setScalar(0.6 + 0.4 * Math.abs(Math.sin(t * 13)));
    },
  };
}

export function buildWorld() {
  const scene = new THREE.Scene();
  const locs = { A: locLab(), B: locHill(), C: locWave(), D: locSun(), E: locTech() };
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
