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

export const LOC = { A: 0, B: 60, C: 120, D: 200 };

// ============ A: host's lab (ruler in the bin, chalk, toolbox) ============
function locLab() {
  const { G, host, board } = hostLab({ title: 'IS IT JUST BAD TOOLS?' });
  const c1 = chalkText('FLAW IN OUR TOOLS?', 2.5, 0.34, 120); c1.position.set(board.x0 + 0.2, board.faceY + 0.14, board.faceZ + 0.003); G.add(c1);
  const strike = chalkOverlay(2.3, 0.3, (g, w, h) => { g.strokeStyle = '#ff8a7a'; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(10, h * 0.6); g.bezierCurveTo(w * 0.3, h * 0.4, w * 0.7, h * 0.65, w - 10, h * 0.4); g.stroke(); }, { px: 128 });
  strike.position.set(board.x0 + 0.2, board.faceY + 0.14, board.faceZ + 0.006); G.add(strike);
  const c2 = chalkText('BUILT INTO NATURE', 2.6, 0.36, 130, '#ffd36a'); c2.position.set(board.x0 + 0.2, board.faceY - 0.28, board.faceZ + 0.003); G.add(c2);
  // bin
  const bin = new THREE.Group();
  bin.add(cyl(0.22, 0.26, 0.55, M.flat('#6a7a74', 801), { seg: 18 }));
  bin.add(cyl(0.27, 0.27, 0.04, M.dark('#3a4440'), { y: 0.55, seg: 18, inkOpts: { hull: 0.004, edges: 80 } }));
  bin.position.set(2.0, 0, -0.5); G.add(bin);
  // blurry ruler
  const rulerT = canvasTex(1024, 128, (g, w, h) => {
    g.fillStyle = '#e9c96a'; g.fillRect(0, 0, w, h);
    g.filter = 'blur(7px)';
    g.fillStyle = INK; for (let i = 0; i <= 40; i++) g.fillRect(12 + i * 25, 0, 4, i % 5 ? 30 : 60);
    g.font = `40px ${SIGN_FONT}`; for (let i = 0; i <= 8; i++) g.fillText(String(i * 5), 6 + i * 125, 100);
    g.filter = 'none';
  }, { wrap: false });
  const ruler = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.08), new THREE.MeshBasicMaterial({ map: rulerT, side: THREE.DoubleSide }));
  G.add(ruler);
  // toolbox (shot 8)
  const tb = new THREE.Group();
  tb.add(box(0.6, 0.26, 0.3, M.flat('#c23a2a', 802)));
  const lidP = new THREE.Group(); lidP.position.set(0, 0.26, -0.15); tb.add(lidP);
  const lid = box(0.6, 0.05, 0.3, M.flat('#a82e22', 803), { z: 0.15, inkOpts: { hull: 0.005, edges: 30, dynamic: true } }); lidP.add(lid);
  for (let i = 0; i < 3; i++) tb.add(box(0.04, 0.2, 0.04, M.dark('#5a5a60'), { x: -0.15 + i * 0.15, y: 0.2, z: 0.02, inkOpts: { hull: 0.003, edges: 30, thin: true } }));
  tb.position.set(0.1, 0.9, -0.95); G.add(tb); makeDynamic(tb);
  const ntf = hangingSign('NOTHING TO FIX', 1.6, 0.36, { bg: '#ffd36a', size: 190, rod: 0.7 }); ntf.position.set(0.1, 2.2, -0.9); G.add(ntf); makeDynamic(ntf);
  bakeEdges(G);
  const tW = beat(1, 'Wrong'), tIs = beat(2, 'isnt'), tNa = beat(2, 'nature'), tNo = beat(8, 'Nothing');
  return {
    group: G,
    update(t, camPos, shot) {
      const showBoard = shot >= 2;
      c1.visible = showBoard; c1.setReveal(shot === 2 ? smooth(shotStart(2) - 0.2, tIs, t) : 1);
      strike.visible = shot >= 2 && (shot > 2 || t > tIs + 0.2); strike.setReveal(shot === 2 ? smooth(tIs + 0.2, tIs + 0.6, t) : 1);
      c2.visible = shot >= 2 && (shot > 2 || t > tNa - 0.6); c2.setReveal(shot === 2 ? smooth(tNa - 0.6, tNa + 0.3, t) : 1);
      host.root.position.set(shot === 8 ? -0.6 : 0.9, 0, shot === 8 ? -1.55 : -0.6);
      // ruler: held up, then thrown into the bin on "Wrong"
      ruler.visible = shot === 1;
      const thr = smooth(tW - 0.15, tW + 0.45, t);
      const hand = new THREE.Vector3(0.9 + 0.42, 1.25, -0.55);
      const binTop = new THREE.Vector3(2.0, 0.55, -0.5);
      ruler.position.lerpVectors(hand, binTop, thr); ruler.position.y += Math.sin(thr * Math.PI) * 0.5;
      ruler.rotation.set(0, 0, 0.3 + thr * 4.0);
      animChar(host, t, camPos, { armUp: shot === 1 ? 0.45 * (1 - thr) + (thr > 0 && thr < 1 ? 0.3 : 0) : 0.05 });
      tb.visible = shot === 8;
      // toolbox lid shuts on "Nothing"
      lidP.rotation.x = shot === 8 ? -1.6 * (1 - smooth(tNo - 0.1, tNo + 0.35, t)) : -1.6;
      ntf.visible = shot === 8 && t > tNo - 0.4; ntf.position.y = lerp(3.6, 2.2, smooth(tNo - 0.4, tNo + 0.05, t));
    },
  };
}

// ============ B: wave lab (two screens) ============
function screenCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return { c, t }; }
function locWaveLab() {
  const G = room({ w: 8, d: 6, h: 3.4, wall: M.plaster('#c7cfd2', 811), floor: M.concrete('#8f9496', 812), wainscot: '#3e4c56', ceil: '#aab2b4' });
  const D = 6;
  const sign = hangingSign('DESCRIBED BY A WAVE', 2.6, 0.42, { size: 190, rod: 0.5 }); sign.position.set(0, 2.75, -D / 2 + 0.3); G.add(sign);
  const screens = [-1.25, 1.25].map((x) => {
    const sc = screenCanvas(900, 1100);
    const g = new THREE.Group();
    g.add(box(2.1, 2.5, 0.1, M.dark('#2a3036'), { y: 0.0, inkOpts: { hull: 0.012, edges: 30 } }));
    g.add(plane(1.95, 2.35, basic('#ffffff', { map: sc.t }), { y: 1.25, z: 0.056 }));
    g.position.set(x, 0.35, -D / 2 + 0.12); G.add(g);
    return sc;
  });
  G.add(box(5.0, 0.35, 0.5, M.flat('#4a5a60', 813), { y: 0, z: -D / 2 + 0.3 }));
  G.add(pendant(-1.3, 3.0, 0.2, '#3a4a5a')); G.add(pendant(1.3, 3.0, 0.2, '#3a4a5a'));
  bakeEdges(G);
  // wave packet: psi(x) = cos(k x - w t) * envelope(x / width)
  const draw = (sc, { width, labelTop, labelBot, posTxt, momTxt, showTop, showBot, spread, t }) => {
    const g = sc.c.getContext('2d'), W = sc.c.width, H = sc.c.height;
    g.fillStyle = '#0f1c22'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(120,180,200,0.15)'; g.lineWidth = 2;
    for (let i = 1; i < 9; i++) { g.beginPath(); g.moveTo(i * W / 9, 0); g.lineTo(i * W / 9, H); g.stroke(); }
    g.fillStyle = '#8af2c2'; g.font = `70px ${SIGN_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(labelTop, W / 2, 60);
    // wave
    const y0 = 330, A = 170;
    g.strokeStyle = 'rgba(138,242,194,0.35)'; g.lineWidth = 4; g.beginPath();
    for (let px = 0; px <= W; px += 3) { const x = (px - W / 2) / W * 6; const env = Math.exp(-(x * x) / (2 * width * width)); const y = y0 - A * env; px ? g.lineTo(px, y) : g.moveTo(px, y); } g.stroke();
    g.strokeStyle = '#d8fbff'; g.lineWidth = 7; g.beginPath();
    for (let px = 0; px <= W; px += 2) { const x = (px - W / 2) / W * 6; const env = Math.exp(-(x * x) / (2 * width * width)); const y = y0 - A * env * Math.cos(9 * x - t * 4); px ? g.lineTo(px, y) : g.moveTo(px, y); } g.stroke();
    if (showTop) { g.fillStyle = '#ffd36a'; g.font = `68px ${SIGN_FONT}`; g.fillText(posTxt, W / 2, 560); }
    // momentum spectrum (histogram of wavelengths)
    g.fillStyle = '#8af2c2'; g.font = `60px ${SIGN_FONT}`; g.fillText(labelBot, W / 2, 660);
    if (showBot) {
      const n = 21, bw = W / (n + 4);
      for (let i = 0; i < n; i++) { const k = (i - (n - 1) / 2) / ((n - 1) / 2); const hgt = 260 * Math.exp(-(k * k) / (2 * spread * spread)); g.fillStyle = '#5fb8ff'; g.fillRect(2 * bw + i * bw + 4, 980 - hgt, bw - 8, hgt); }
      g.fillStyle = '#ffd36a'; g.font = `68px ${SIGN_FONT}`; g.fillText(momTxt, W / 2, 1050);
    }
    sc.t.needsUpdate = true;
  };
  const tPos = beat(4, 'position'), tWl = beat(4, 'wavelengths'), tMom = beat(4, 'momentum'), tOpp = beat(5, 'opposite');
  return {
    group: G,
    update(t, camPos, shot) {
      const squeeze = shot >= 4 ? smooth(shotStart(4), tPos, t) : 0;
      draw(screens[0], { width: lerp(1.2, 0.2, squeeze), labelTop: 'SQUEEZED WAVE', labelBot: 'WAVELENGTHS', posTxt: 'POSITION: PINNED DOWN', momTxt: 'MOMENTUM: MESSY', showTop: shot >= 4 && t > tPos - 0.2, showBot: shot >= 4 && t > tWl - 0.3, spread: 0.85, t });
      draw(screens[1], { width: 2.6, labelTop: 'SMOOTH WAVE', labelBot: 'WAVELENGTHS', posTxt: 'POSITION: ???', momTxt: 'MOMENTUM: SHARP', showTop: shot >= 5 && t > tOpp - 0.4, showBot: shot >= 5 && t > tOpp - 0.2, spread: 0.06, t });
    },
  };
}

// ============ C: photo studio ============
function locStudio() {
  const G = room({ w: 8, d: 6, h: 3.4, wall: M.plaster('#e4ddd0', 821), floor: M.wood('#7a5a3c', 822), wainscot: '#5a4a3a', ceil: '#d8d0c0' });
  const D = 6;
  // backdrop paper roll
  G.add(plane(3.4, 3.0, M.flat('#9fc6d6', 823), { y: 1.5, z: -D / 2 + 0.2 }));
  G.add(cyl(0.06, 0.06, 3.6, M.dark('#3a3a3c'), { seg: 10 }).rotateZ(Math.PI / 2)); G.children[G.children.length - 1].position.set(0, 3.0, -D / 2 + 0.25);
  // camera on tripod
  const cam = new THREE.Group();
  for (const a of [0, 2.1, 4.2]) { const lg = box(0.04, 1.3, 0.04, M.dark('#2e2a28'), {}); lg.rotation.z = 0.2; const p = new THREE.Group(); p.add(lg); p.rotation.y = a; cam.add(p); }
  cam.add(box(0.36, 0.24, 0.2, M.dark('#2f3234'), { y: 1.25 }));
  const lens = cyl(0.08, 0.08, 0.18, M.dark('#1e1e22'), { seg: 14 }); lens.rotation.x = Math.PI / 2; lens.position.set(0, 1.37, -0.18); cam.add(lens);
  const flash = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), GLOW); flash.position.set(0, 1.62, -0.1); cam.add(flash);
  cam.add(box(0.12, 0.08, 0.08, M.flat('#e9e2cf', 824), { y: 1.49 }));
  cam.position.set(1.1, 0, 0.6); cam.rotation.y = 0.35; G.add(cam);
  // the electron zips across the backdrop
  const e = makeElectron(6, 1.0); G.add(e.root);
  // photo prints on a board (right wall side)
  const pb = new THREE.Group(); pb.add(box(1.9, 1.1, 0.05, M.wood('#a07a4a', 825), { y: 0, inkOpts: { hull: 0.01, edges: 30 } }));
  pb.position.set(-1.9, 1.35, -D / 2 + 0.25); G.add(pb);
  const photo = (blur) => labelTex({ w: 600, h: 520, bg: '#f6efd8', seed: blur ? 3 : 4, wearAmount: 0.1, paint: (g, w, h) => {
    g.fillStyle = '#9fc6d6'; g.fillRect(30, 30, w - 60, h - 160);
    const cx = w / 2, cy = (h - 130) / 2 + 15;
    if (blur) { for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(79,176,234,${0.12})`; g.beginPath(); g.arc(cx - 150 + i * 22, cy, 70, 0, 7); g.fill(); } }
    else { g.fillStyle = '#4fb0ea'; g.beginPath(); g.arc(cx, cy, 70, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke(); g.fillStyle = '#17171c'; g.fillRect(cx - 50, cy - 20, 40, 20); g.fillRect(cx + 10, cy - 20, 40, 20); }
    g.fillStyle = INK; g.font = `64px ${SIGN_FONT}`; g.textAlign = 'center'; g.fillText(blur ? 'MOTION BLUR' : 'SHARP SNAPSHOT', w / 2, h - 60);
  } });
  const p1 = plane(0.78, 0.68, M.label(photo(false)), { x: -2.35, y: 1.35 + 0.6, z: -D / 2 + 0.29 }); G.add(p1);
  const p2 = plane(0.78, 0.68, M.label(photo(true)), { x: -1.45, y: 1.35 + 0.6, z: -D / 2 + 0.29 }); G.add(p2);
  const notBoth = hangingSign('CAN’T HAVE BOTH', 1.6, 0.3, { bg: '#ffd36a', size: 170, rod: 0.4 }); notBoth.position.set(-1.9, 2.75, -D / 2 + 0.35); G.add(notBoth); makeDynamic(notBoth);
  G.add(pendant(0, 3.0, -0.6, '#3a3a3c'));
  bakeEdges(G);
  const tPh = beat(6, 'photo'), tSn = beat(6, 'snapshot'), tBl = beat(6, 'blur'), tSame = beat(6, 'same');
  return {
    group: G,
    update(t, camPos, shot) {
      const run = ((t - shotStart(6)) * 0.9) % 1;
      e.root.position.set(t > tBl - 0.3 ? 1.6 : lerp(1.4, -1.2, run), 0, -D / 2 + 1.0);
      e.root.visible = !(t > tBl - 0.3 && t < tBl - 0.1);
      animElectron(e, t, camPos, { strut: 1 });
      flash.visible = (t > tPh - 0.05 && t < tPh + 0.25) || (t > tSn && t < tSn + 0.2) || (t > tBl && t < tBl + 0.2);
      p1.visible = t > tSn - 0.1; p2.visible = t > tBl - 0.1;
      notBoth.visible = t > tSame - 0.3;
    },
  };
}

// ============ D: the universe ============
function locSpace() {
  const G = new THREE.Group();
  const starsT = canvasTex(2048, 1024, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#0b1026'); grd.addColorStop(1, '#1d1a3a'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
    const r = rng(9); for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(255,255,240,${0.3 + r() * 0.7})`; const s = r() * 2.6 + 0.6; g.fillRect(r() * w, r() * h, s, s); }
    for (let i = 0; i < 6; i++) { const x = r() * w, y = r() * h, rad = 120 + r() * 200; const n = g.createRadialGradient(x, y, 0, x, y, rad); n.addColorStop(0, 'rgba(140,90,200,0.25)'); n.addColorStop(1, 'rgba(140,90,200,0)'); g.fillStyle = n; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  }, { wrap: false });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.MeshBasicMaterial({ map: starsT, side: THREE.BackSide, fog: false })); G.add(dome);
  const planet = (r, col, x, y, z, ring) => { const m = mesh(new THREE.SphereGeometry(r, 32, 20), M.flat(col, 831 + Math.round(r * 10)), { inkOpts: { hull: 0.03 * r, edges: 0 } }); m.position.set(x, y, z); G.add(m); if (ring) { const rg = new THREE.Mesh(new THREE.RingGeometry(r * 1.4, r * 1.9, 48), new THREE.MeshBasicMaterial({ color: '#e9d6a0', side: THREE.DoubleSide, transparent: true, opacity: 0.8 })); rg.rotation.x = 1.2; m.add(rg); } return m; };
  const p1 = planet(1.6, '#d98a5a', -3.2, 3.2, -9, true); const p2 = planet(0.7, '#6aa8d8', 2.6, 2.0, -6); planet(0.35, '#c9c0b0', 1.0, 3.6, -7);
  // a little camera floating, then the placard
  const cam = new THREE.Group(); cam.add(box(0.36, 0.24, 0.2, M.dark('#2f3234'))); const lens = cyl(0.08, 0.08, 0.18, M.dark('#1e1e22'), { seg: 14 }); lens.rotation.x = Math.PI / 2; lens.position.set(0, 0.12, -0.18); cam.add(lens);
  cam.position.set(-0.7, 1.3, -1.6); G.add(cam); makeDynamic(cam);
  const notT = labelTex({ w: 700, h: 200, bg: '#f6efd8', border: '#b3261e', seed: 4, lines: [{ text: 'NOT THE CAMERA', size: 120, y: 0.55, color: '#b3261e' }] });
  const notC = plane(0.7, 0.2, M.label(notT), { x: -0.7, y: 1.75, z: -1.6 }); G.add(notC);
  const plinth = box(1.5, 1.0, 0.6, M.flat('#3a3a48', 840), { x: 0.7, z: -2.2 }); G.add(plinth);
  const plT = labelTex({ w: 1100, h: 520, bg: '#f2e8cf', border: INK, seed: 5, lines: [{ text: 'EXHIBIT:', size: 110, y: 0.25, color: '#8a2a22' }, { text: 'THE UNIVERSE', size: 190, y: 0.6 }], paint: (g, w, h) => { g.fillStyle = hexA(INK, 0.5); g.fillRect(200, h * 0.82, w - 400, 12); } });
  const placard = signBoard({ w: 1.5, h: 0.7, texture: plT, posts: 0, postH: 0 }); placard.position.set(0.7, 1.0, -2.0); placard.rotation.x = -0.25; G.add(placard); makeDynamic(placard);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(4, 48), new THREE.MeshToonMaterial({ gradientMap: GRAD, color: '#2a2a3a' })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; G.add(floor);
  bakeEdges(G);
  const tCam = beat(7, 'camera'), tUni = beat(7, 'universe');
  return {
    group: G,
    update(t, camPos, shot) {
      cam.rotation.set(0.3 * Math.sin(t), t * 0.6, 0.2 * Math.cos(t * 0.8)); cam.position.y = 1.3 + 0.08 * Math.sin(t * 1.4);
      notC.visible = t > tCam - 0.2;
      const up = smooth(tUni - 0.4, tUni + 0.1, t); placard.position.y = lerp(-0.6, 1.0, up); placard.visible = up > 0.01;
      p1.rotation.y = t * 0.1; p2.rotation.y = -t * 0.2;
    },
  };
}

export function buildWorld() {
  const scene = new THREE.Scene();
  const locs = { A: locLab(), B: locWaveLab(), C: locStudio(), D: locSpace() };
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
