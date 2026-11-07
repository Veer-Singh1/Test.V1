// Double-slit short: all sets in one scene at different x offsets; only the active one is shown.
import * as THREE from 'three';
import {
  INK, SIGN_FONT, HAND_FONT, M, tex, toon, GRAD, labelTex, canvasTex, box, cyl, plane, mesh, boxGeo, ink, edgeLines, bakeEdges,
  facade, gableRoof, lampPost, barrel, crate, signBoard, revealPlane, hills, skyDome, rng, lerp, clamp, smooth, basic, blob, hexA,
} from './kit.js';
import { makeChar, animChar, Builder, circlePts, limbPts, CHAR_MAT } from './char.js';
import { beat, shotStart, shotEnd } from './timing.js';

export const LOC = { A: 0, B: 60, C: 120, D: 200, E: 280 };
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

// ---------- wave field shader (water tank and the electron's "wave of possibilities") ----------
const waveGLSL = /* glsl */`
uniform float uT; uniform float uK; uniform float uC; uniform vec2 uS1; uniform vec2 uS2; uniform float uBar; uniform float uSrc; uniform float uSpread;
float waveH(vec2 p) {
  float w = uK * uC;
  if (p.y > uBar) {
    float d = uSrc - p.y;
    if (d < 0.0 || d > uC * uT) return 0.0;
    float edge = smoothstep(0.0, uSpread, 1.0 - abs(p.x) / 3.0);
    return sin(uK * d - w * uT) * edge;
  }
  float t1 = uT - (uSrc - uBar) / uC;
  if (t1 <= 0.0) return 0.0;
  float r1 = distance(p, uS1), r2 = distance(p, uS2), h = 0.0;
  if (r1 < uC * t1) h += sin(uK * r1 - w * t1) / sqrt(1.0 + 2.0 * r1);
  if (r2 < uC * t1) h += sin(uK * r2 - w * t1) / sqrt(1.0 + 2.0 * r2);
  return h * 1.25;
}`;
function waveUniforms({ k, c, s1, s2, bar, src }) {
  return { uT: { value: 0 }, uK: { value: k }, uC: { value: c }, uS1: { value: new THREE.Vector2(...s1) }, uS2: { value: new THREE.Vector2(...s2) }, uBar: { value: bar }, uSrc: { value: src }, uSpread: { value: 0.25 } };
}
function waterMaterial(params) {
  return new THREE.ShaderMaterial({
    uniforms: { ...waveUniforms(params), uDeep: { value: new THREE.Color('#2c7aa3') }, uMid: { value: new THREE.Color('#5aaed1') }, uLight: { value: new THREE.Color('#c4ecf6') } },
    vertexShader: waveGLSL + /* glsl */`
      varying vec2 vP; varying float vH;
      void main() { vP = vec2(position.x, -position.y); vH = waveH(vP);
        vec3 p = position; p.z += vH * 0.035;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
    fragmentShader: waveGLSL + /* glsl */`
      uniform vec3 uDeep; uniform vec3 uMid; uniform vec3 uLight; varying vec2 vP;
      void main() { float h = waveH(vP);
        vec3 c = h < -0.32 ? uDeep : (h > 0.32 ? uLight : uMid);
        gl_FragColor = vec4(c, 1.0); }`,
  });
}
function cloudMaterial(params) {
  return new THREE.ShaderMaterial({
    uniforms: { ...waveUniforms(params), uFade: { value: 1 }, uEnd: { value: -3 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying vec2 vP; void main() { vP = vec2(position.x, -position.y); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: waveGLSL + /* glsl */`
      uniform float uFade; uniform float uEnd; varying vec2 vP;
      void main() { if (vP.y < uEnd) discard; float h = waveH(vP);
        float a = (h > 0.3 ? 0.55 : (h > -0.1 ? 0.16 : 0.0)) * uFade;
        gl_FragColor = vec4(vec3(0.45, 0.85, 1.0) * a, a); }`,
  });
}

// ============ A: the host's lab ============
function locLab() {
  const W = 8, D = 6;
  const G = room({ w: W, d: D, h: 3.4, wall: M.plaster('#d9d6c4', 201), floor: M.wood('#7d5a3c', 202),
    backOpenings: [{ type: 'door', x: 2.3, w: 1.0, h: 2.15 }], leftOpenings: [{ type: 'window', x: 0.3, y: 0.95, w: 1.4, h: 1.6 }], wainscot: '#5a6a5e', doorPanels: false });
  // corridor behind the door
  const cor = new THREE.Group();
  cor.add(plane(1.6, 2.5, M.wood('#6a4a32', 203), { rx: -Math.PI / 2, z: -1.25, y: 0.005 }));
  cor.add(plane(2.5, 3.0, M.plaster('#e9e2cc', 204), { ry: Math.PI / 2, x: -0.75, y: 1.5, z: -1.25 }));
  cor.add(plane(2.5, 3.0, M.plaster('#e9e2cc', 204), { ry: -Math.PI / 2, x: 0.75, y: 1.5, z: -1.25 }));
  cor.add(plane(1.6, 3.0, M.plaster('#f1ead6', 205), { z: -2.5, y: 1.5 }));
  const leaf = box(0.95, 2.1, 0.05, M.panel('#4f6b5c', 206), { x: 0.47 }); const hinge = new THREE.Group(); hinge.add(leaf); hinge.position.set(-0.5, 0, -0.12); hinge.rotation.y = 1.9; cor.add(hinge);
  cor.position.set(2.3, 0, -D / 2 - 0.2); G.add(cor);
  const doorSign = hangingSign('LAB', 0.9, 0.32, { size: 230, rod: 0.0 }); doorSign.position.set(2.3, 2.3, -D / 2 + 0.05); G.add(doorSign);
  // chalkboard: header + slit drawing (left) + checklist (right, shot 12)
  const BW = 3.8, BH = 1.55, BX = -0.6, BY = 1.05, BZ = -D / 2 + 0.06;
  const cb = chalkboard(BW, BH, chalkTex([{ text: 'DOUBLE-SLIT EXPERIMENT', size: 74, y: 0.12 }], { w: 1600, h: 650, seed: 9 }));
  cb.position.set(BX, BY, BZ); G.add(cb);
  const faceY = BY + cb.userData.faceY, faceZ = BZ + 0.035;
  // static part of the drawing: source, wall with two slits, screen
  const draw = chalkOverlay(1.7, 1.0, (g, w, h) => {
    g.strokeStyle = '#f2efe4'; g.lineWidth = 10; g.lineCap = 'round';
    g.beginPath(); g.moveTo(w * 0.5, h * 0.1); g.lineTo(w * 0.5, h * 0.36); g.moveTo(w * 0.5, h * 0.46); g.lineTo(w * 0.5, h * 0.54); g.moveTo(w * 0.5, h * 0.64); g.lineTo(w * 0.5, h * 0.9); g.stroke();
    g.beginPath(); g.moveTo(w * 0.94, h * 0.08); g.lineTo(w * 0.94, h * 0.92); g.stroke();
    g.fillStyle = '#9fd8f7'; g.beginPath(); g.arc(w * 0.1, h * 0.5, 22, 0, 7); g.fill();
    g.fillStyle = '#f2efe4'; g.font = `60px ${HAND_FONT}`; g.textAlign = 'center'; g.fillText('e', w * 0.1, h * 0.72);
  }, { px: 400 });
  draw.position.set(BX - BW / 2 + 0.15, faceY - 0.08, faceZ); G.add(draw);
  const paths = chalkOverlay(1.7, 1.0, (g, w, h) => {
    g.strokeStyle = '#ffd36a'; g.lineWidth = 9; g.lineCap = 'round'; g.setLineDash([26, 18]);
    g.beginPath(); g.moveTo(w * 0.13, h * 0.48); g.quadraticCurveTo(w * 0.32, h * 0.36, w * 0.5, h * 0.41); g.quadraticCurveTo(w * 0.72, h * 0.46, w * 0.93, h * 0.5); g.stroke();
    g.beginPath(); g.moveTo(w * 0.13, h * 0.52); g.quadraticCurveTo(w * 0.32, h * 0.64, w * 0.5, h * 0.59); g.quadraticCurveTo(w * 0.72, h * 0.54, w * 0.93, h * 0.5); g.stroke();
    g.setLineDash([]); g.fillStyle = '#ffd36a'; g.font = `70px ${HAND_FONT}`; g.textAlign = 'center'; g.fillText('BOTH?!', w * 0.72, h * 0.22);
  }, { px: 400 });
  paths.position.set(BX - BW / 2 + 0.15, faceY - 0.08, faceZ + 0.003); G.add(paths);
  const checks = [['PARTICLE', 'particles'], ['WAVE', 'waves'], ['DRAMA QUEEN', 'drama']].map(([txt], i) => {
    const l = chalkText(`${txt}  ✓`, 1.7, 0.32, 150); l.position.set(BX + 0.2, faceY + 0.22 - i * 0.36, faceZ + 0.003); G.add(l); return l;
  });
  // lab bench with a small double-slit rig
  const lb = bench(2.6, 0.8); lb.position.set(-0.6, 0, -1.0); G.add(lb);
  const rig = new THREE.Group();
  rig.add(box(0.36, 0.22, 0.24, M.flat('#c9a24a', 207), { x: -0.9 }));
  rig.add(cyl(0.05, 0.05, 0.16, M.dark('#2e2a28'), { x: -0.64, y: 0.08, seg: 10, rz: Math.PI / 2 }));
  const plate = box(0.04, 0.42, 0.36, M.flat('#8c9a9e', 208), { x: 0.0 }); rig.add(plate);
  rig.add(box(0.05, 0.55, 0.5, M.flat('#24323a', 209), { x: 0.85 }));
  rig.position.set(-0.6, 0.9, -1.05); G.add(rig);
  // side counter with "detectors": camera on tripod, coffee cup, clipboard (shot 10)
  const sc = bench(2.0, 0.7); sc.position.set(-2.85, 0, -2.45); G.add(sc);
  const tagT = labelTex({ w: 512, h: 180, bg: '#f6efd8', seed: 7, lines: [{ text: 'DETECTOR', size: 120, y: 0.55, color: '#8a2a22', spacing: '4px' }] });
  const tagMat = M.label(tagT);
  const items = new THREE.Group();
  const cam = new THREE.Group();
  for (const a of [0, 2.1, 4.2]) { const lg = box(0.03, 0.45, 0.03, M.dark('#2e2a28'), { y: 0 }); lg.rotation.z = 0.25; const p = new THREE.Group(); p.add(lg); p.rotation.y = a; cam.add(p); }
  cam.add(box(0.26, 0.17, 0.14, M.dark('#2f3234'), { y: 0.43 }));
  cam.add(cyl(0.06, 0.06, 0.12, M.dark('#1e1e22'), { y: 0.5, z: 0.12, seg: 14 }).rotateX(Math.PI / 2));
  cam.children[cam.children.length - 1].position.set(0, 0.515, 0.12);
  cam.position.set(-3.45, 0.9, -2.4); items.add(cam);
  const cup = cyl(0.07, 0.06, 0.15, M.flat('#e9dcc2', 210), { seg: 16 }); cup.position.set(-2.85, 0.9, -2.35); items.add(cup);
  items.add(cyl(0.065, 0.065, 0.005, M.dark('#4a2f22'), { x: -2.85, y: 1.04, z: -2.35, seg: 16, inkOpts: { hull: 0, edges: 0 } }));
  const clip = box(0.24, 0.02, 0.32, M.wood('#a07a4a', 211), { x: -2.25, y: 0.9, z: -2.4 }); items.add(clip);
  items.add(plane(0.2, 0.26, M.paper('#f5efdc', 212), { rx: -Math.PI / 2, x: -2.25, y: 0.925, z: -2.39 }));
  G.add(items);
  for (const [x, y, z] of [[-3.45, 1.12, -2.18], [-2.85, 1.08, -2.18], [-2.25, 0.98, -2.15]]) {
    const tag = plane(0.26, 0.09, tagMat, { x, y, z }); tag.rotation.z = (x + 3) * 0.1; G.add(tag);
  }
  G.add(pendant(-0.6, 2.9, -0.6));
  G.add(pendant(2.0, 2.9, 0.6, '#6a3f3a'));
  // poster + shelf details
  const posterT = labelTex({ w: 600, h: 800, bg: '#efe6cc', seed: 12, lines: [{ text: 'SAFETY', size: 120, y: 0.12, color: '#8a2a22' }, { text: 'FIRST', size: 120, y: 0.26, color: '#8a2a22' }],
    paint: (g, w, h) => { g.strokeStyle = INK; g.lineWidth = 10; g.beginPath(); g.arc(w / 2, h * 0.62, 150, 0, 7); g.stroke(); g.beginPath(); g.moveTo(w / 2, h * 0.5); g.lineTo(w / 2, h * 0.66); g.stroke(); g.beginPath(); g.arc(w / 2, h * 0.73, 10, 0, 7); g.fill(); } });
  G.add(plane(0.6, 0.8, M.label(posterT), { x: 1.35, y: 1.75, z: -D / 2 + 0.03 }));
  // people
  const host = makeChar({ palette: 'host', hat: 'none', glasses: true, seed: 701, face: 0 });
  G.add(host.root);
  const elec = makeElectron(3); G.add(elec.root); elec.root.visible = false;
  // bonk stars
  const stars = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const sb = new Builder(); const pts = [];
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 + Math.PI / 2, rr = k % 2 ? 0.035 : 0.08; pts.push(V(Math.cos(a) * rr, Math.sin(a) * rr)); }
    sb.add(pts, '#ffd23a', { inkW: 0.01, seed: 30 + i });
    const s = new THREE.Mesh(sb.build(), CHAR_MAT); s.userData.i = i; stars.add(s);
  }
  G.add(stars); stars.visible = false;
  bakeEdges(G);
  const tBoth = beat(1, 'both'), tFrame = beat(2, 'frame');
  const tP = beat(12, 'particles'), tW = beat(12, 'waves'), tD = beat(12, 'drama');
  return {
    group: G,
    update(t, camPos, shot) {
      paths.setReveal(shot === 1 ? smooth(tBoth - 0.9, tBoth + 0.4, t) : 1);
      paths.visible = shot !== 1 || t > tBoth - 0.95;
      const ck = [tP, tW, tD];
      checks.forEach((l, i) => { l.visible = shot === 12 && t > ck[i] - 0.15; l.setReveal(smooth(ck[i] - 0.15, ck[i] + 0.35, t)); });
      stars.visible = false; elec.root.visible = false; host.root.rotation.set(0, 0, 0);
      if (shot === 1) {
        host.root.position.set(1.2, 0, -1.2);
        animChar(host, t, camPos, { point: smooth(tBoth - 1.0, tBoth - 0.6, t) * 0.55 });
      } else if (shot === 2) {
        // walks in from the corridor, clips the door frame, recoils, stars
        const walk = clamp((t - (shotStart(2) - 0.2)) / (tFrame - shotStart(2) + 0.2), 0, 1);
        const after = clamp((t - tFrame) / 0.35, 0, 1);
        const z = lerp(-4.8, -3.18, walk) - 0.32 * Math.sin(Math.min(after, 1) * Math.PI * 0.5);
        host.root.position.set(2.55, 0, z);
        host.root.rotation.z = after > 0 ? 0.12 * Math.sin(after * Math.PI * 3) * (1 - after * 0.5) : 0;
        animChar(host, t, camPos, { walking: walk < 1 ? 1 : 0 });
        if (t > tFrame) {
          stars.visible = true;
          stars.position.set(2.55, 1.85, z + 0.05);
          stars.children.forEach((s) => { const a = t * 6 + s.userData.i * 2.1; s.position.set(Math.cos(a) * 0.28, Math.sin(a * 2) * 0.03, Math.sin(a) * 0.12); });
        }
      } else if (shot === 10) {
        host.root.position.set(-1.95, 0, -1.5);
        host.face = -0.5;
        animChar(host, t, camPos, { point: 0, armUpL: 0 });
        host.armL.rotation.z = -1.35; // pointing along the counter
        host.face = 0;
      } else if (shot === 12) {
        host.root.position.set(-0.9, 0, -0.1);
        animChar(host, t, camPos, {});
        elec.root.visible = true; elec.root.position.set(0.35, 0, 0.1);
        animElectron(elec, t, camPos, { pose: smooth(tD - 0.3, tD, t) });
      }
    },
  };
}

// ============ B: paintball range (outdoors) ============
function locRange() {
  const G = new THREE.Group();
  const ground = plane(160, 160, M.grass('#86a85e', 301), { rx: -Math.PI / 2, z: -20 });
  ground.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = v * 160; }); ground.receiveShadow = true; G.add(ground);
  const pad = plane(4, 9, M.dirt('#c9ab80', 302), { rx: -Math.PI / 2, y: 0.008, z: 0.5 });
  pad.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = i % 2 ? v * 9 : v * 4; }); pad.receiveShadow = true; G.add(pad);
  // slit wall: plywood with two vertical slits
  const sw = facade({ w: 3.2, h: 1.9, t: 0.08, mat: M.wood('#c8a46e', 303), openings: [{ type: 'window', x: -0.5, y: 0.4, w: 0.2, h: 1.25 }, { type: 'window', x: 0.5, y: 0.4, w: 0.2, h: 1.25 }].map((o) => ({ ...o, type: 'arch', w: 0.2 })), cornice: false, plinth: false, interior: '#c8a46e' });
  // remove interior backdrops (we want to see through the slits)
  sw.children.slice(1).forEach((c) => sw.remove(c));
  sw.position.z = 0.04; G.add(sw);
  for (const x of [-1.6, 1.6]) G.add(box(0.12, 2.0, 0.12, M.wood('#7a5638', 304), { x, z: -0.04 }));
  // back wall (white boards) with paint splats (canvas)
  const splatC = document.createElement('canvas'); splatC.width = 1024; splatC.height = 540;
  const splatT = new THREE.CanvasTexture(splatC); splatT.colorSpace = THREE.NoColorSpace;
  const baseBoards = labelTex({ w: 1024, h: 540, bg: '#ece6d6', seed: 31, wearAmount: 0.6, paint: (g, w, h) => { g.strokeStyle = 'rgba(90,70,50,0.35)'; g.lineWidth = 3; for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(i * w / 8, 0); g.lineTo(i * w / 8, h); g.stroke(); } } });
  G.add(box(5.2, 2.7, 0.1, M.wood('#7a5638', 305), { z: -3.1, inkOpts: { hull: 0.02, edges: 30 } }));
  const bw = plane(5.0, 2.6, new THREE.MeshToonMaterial({ gradientMap: GRAD, map: splatT }), { y: 1.35, z: -3.04 }); bw.receiveShadow = true; G.add(bw);
  // turret (paintball marker on a tripod)
  const tur = new THREE.Group();
  for (const a of [0, 2.1, 4.2]) { const lg = box(0.05, 0.95, 0.05, M.dark('#2e3236'), { y: 0 }); lg.rotation.z = 0.22; const p = new THREE.Group(); p.add(lg); p.rotation.y = a; tur.add(p); }
  const gun = new THREE.Group();
  gun.add(box(0.2, 0.18, 0.5, M.flat('#3e7a5a', 306), { z: 0 }));
  gun.add(cyl(0.035, 0.035, 0.45, M.dark('#25292c'), { seg: 10 }).rotateX(Math.PI / 2));
  gun.children[1].position.set(0, 0.09, -0.42);
  gun.add(cyl(0.11, 0.09, 0.22, M.flat('#e0c24a', 307), { y: 0.17, seg: 14 })); // hopper
  gun.position.set(0, 0.92, 0); tur.add(gun);
  tur.position.set(0, 0, 3.7); G.add(tur);
  // sign
  const sT = labelTex({ w: 1100, h: 300, bg: '#efe2c0', border: INK, seed: 33, lines: [{ text: 'ROUND 1: PAINTBALLS', size: 170, y: 0.53, spacing: '4px' }] });
  const sign = signBoard({ w: 2.0, h: 0.55, texture: sT, posts: 1, postH: 1.05 }); sign.position.set(-2.2, 0, 1.0); sign.rotation.y = 0.35; G.add(sign);
  // range details: barrels, crates, hay bales, fence, trees as hills
  for (const [x, z, c] of [[2.6, 1.8, '#5f7a5a'], [3.0, 2.3, '#8a6a3a']]) { const b = barrel(c); b.position.set(x, 0, z); G.add(b); }
  const cr = crate(0.6, '#b08654', 'PAINT'); cr.position.set(1.1, 0, 4.6); G.add(cr);
  for (let i = 0; i < 14; i++) G.add(box(0.1, 1.2, 0.1, M.wood('#7a5638', 308), { x: -7 + i, z: -6.5, inkOpts: { hull: 0.006, edges: 30, thin: true } }));
  G.add(box(14, 0.08, 0.06, M.wood('#7a5638', 308), { x: -0.5, y: 1.0, z: -6.5 }));
  G.add(hills({ w: 400, h: 18, seed: 4, color: '#9fb486', z: -110 }));
  G.add(hills({ w: 400, h: 12, seed: 8, color: '#b4c49a', z: -70 }));
  // balls
  const r = rng(51);
  const cols = ['#e23d7c', '#f5c516', '#2fb6c8', '#7ac143', '#ff7a2f'];
  const N = 64, tFire = beat(3, 'Fire') - 0.1, dt = 0.08, flight = 0.5;
  const shots = [];
  for (let i = 0; i < N; i++) {
    const side = i % 2 ? 1 : -1;
    const gx = () => { let s = 0; for (let k = 0; k < 4; k++) s += r(); return (s - 2) / 2; };
    shots.push({ t: tFire + i * dt + r() * 0.05, x: side * 0.88 + gx() * 0.16, y: 1.1 + gx() * 0.75, c: cols[Math.floor(r() * cols.length)], rot: r() * 6, s: 0.8 + r() * 0.5, seed: Math.floor(r() * 1e6) });
  }
  const ballGeo = new THREE.SphereGeometry(0.045, 10, 8);
  const balls = shots.map((s) => { const m = new THREE.Mesh(ballGeo, basic(s.c)); m.visible = false; G.add(m); return m; });
  const muzzle = new THREE.Vector3(0, 1.01, 3.7 - 0.62);
  let lastN = -1;
  const drawSplats = (n) => {
    const g = splatC.getContext('2d');
    g.drawImage(baseBoards.image, 0, 0);
    for (let i = 0; i < n; i++) {
      const s = shots[i], rr = rng(s.seed);
      const px = (s.x + 2.5) / 5.0 * splatC.width, py = (1 - s.y / 2.6) * splatC.height;
      g.fillStyle = s.c;
      const R = 22 * s.s;
      g.beginPath(); for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2 + s.rot, q = R * (0.75 + rr() * 0.5); g.lineTo(px + Math.cos(a) * q, py + Math.sin(a) * q); } g.closePath(); g.fill();
      for (let k = 0; k < 5; k++) { const a = rr() * 6.28, d = R * (1.2 + rr() * 1.4); g.beginPath(); g.arc(px + Math.cos(a) * d, py + Math.sin(a) * d, 2 + rr() * 4, 0, 7); g.fill(); }
      g.fillStyle = hexA(s.c, 0.6); g.fillRect(px - 2, py, 4, 10 + rr() * 26);
    }
    splatT.needsUpdate = true;
  };
  drawSplats(0);
  bakeEdges(G);
  return {
    group: G,
    update(t, camPos) {
      let n = 0;
      shots.forEach((s, i) => {
        const p = (t - s.t) / flight;
        const hit = new THREE.Vector3(s.x, s.y, -3.0);
        if (p >= 1) n = i + 1;
        balls[i].visible = p > 0 && p < 1;
        if (balls[i].visible) balls[i].position.lerpVectors(muzzle, hit, p);
      });
      if (n !== lastN) { drawSplats(n); lastN = n; }
      const recoil = shots.some((s) => t - s.t > 0 && t - s.t < 0.06);
      gun.position.z = recoil ? 0.05 : 0;
    },
  };
}

// ============ C: wave tank (science hall) ============
function locTank() {
  const G = room({ w: 10, d: 11, h: 4.2, wall: M.plaster('#cfd6cf', 401), floor: M.concrete('#a7a497', 402), leftOpenings: [{ type: 'window', x: -1.5, y: 1.2, w: 2.0, h: 2.0 }, { type: 'window', x: 2.0, y: 1.2, w: 2.0, h: 2.0 }], wainscot: '#4f6a6a', ceil: '#c9cdc4' });
  G.children.forEach((c) => { if (c.isMesh && c.geometry.type === 'PlaneGeometry' && c.position.y > 3) c.position.z = 1; });
  // tank: wooden frame, water plane with the wave shader, barrier with two gaps
  const TW = 5.0, TL = 7.0, WY = 0.72;
  const wood = M.wood('#8a6440', 403);
  G.add(box(TW + 0.3, 0.75, 0.15, wood, { z: TL / 2 + 0.075, inkOpts: { hull: 0.015, edges: 30 } }));
  G.add(box(TW + 0.3, 0.75, 0.15, wood, { z: -TL / 2 - 0.075, inkOpts: { hull: 0.015, edges: 30 } }));
  G.add(box(0.15, 0.75, TL, wood, { x: -TW / 2 - 0.075, inkOpts: { hull: 0.015, edges: 30 } }));
  G.add(box(0.15, 0.75, TL, wood, { x: TW / 2 + 0.075, inkOpts: { hull: 0.015, edges: 30 } }));
  for (const [x, z] of [[-2.4, -3.4], [2.4, -3.4], [-2.4, 3.4], [2.4, 3.4]]) G.add(box(0.2, 0.75, 0.2, M.wood('#6a4a30', 404), { x, z }));
  const params = { k: (2 * Math.PI) / 0.42, c: 1.0, s1: [-0.5, 1.8], s2: [0.5, 1.8], bar: 1.8, src: 3.2 };
  const wm = waterMaterial(params);
  const wgeo = new THREE.PlaneGeometry(TW, TL, 240, 340);
  const water = new THREE.Mesh(wgeo, wm); water.rotation.x = -Math.PI / 2; water.position.y = WY; G.add(water);
  // barrier (three pieces leave two gaps at x = ±0.5)
  const barMat = M.flat('#5c6a72', 405), gap = 0.36;
  const pieces = [[-TW / 2, -0.5 - gap / 2], [-0.5 + gap / 2, 0.5 - gap / 2], [0.5 + gap / 2, TW / 2]];
  for (const [a, b] of pieces) G.add(box(b - a, 0.3, 0.08, barMat, { x: (a + b) / 2, y: WY - 0.1, z: 1.8 }));
  // paddle (wave maker) at the near end
  const paddle = box(TW - 0.2, 0.12, 0.08, M.flat('#c95a3a', 406), { y: WY - 0.03, z: 3.25 }); G.add(paddle);
  G.add(box(0.5, 0.35, 0.4, M.dark('#3a3a3c'), { x: TW / 2 + 0.5, y: 0.6, z: 3.25 }));
  // far-wall pattern panel: brightness = |sum of the two slit waves|^2
  const panelMat = new THREE.ShaderMaterial({
    uniforms: { uK: { value: params.k }, uS1: { value: new THREE.Vector2(-0.5, 1.8) }, uS2: { value: new THREE.Vector2(0.5, 1.8) }, uZ: { value: -TL / 2 }, uOn: { value: 1 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float uK; uniform vec2 uS1; uniform vec2 uS2; uniform float uZ; uniform float uOn; varying vec2 vUv;
      void main(){ float x = (vUv.x - 0.5) * ${TW.toFixed(1)}; vec2 p = vec2(x, uZ);
        float r1 = distance(p, uS1), r2 = distance(p, uS2); float a1 = 1.0/sqrt(1.0+2.0*r1), a2 = 1.0/sqrt(1.0+2.0*r2);
        float I = (a1*a1 + a2*a2 + 2.0*a1*a2*cos(uK*(r1-r2))) / ((a1+a2)*(a1+a2));
        I = smoothstep(0.25, 0.8, I) * uOn;
        vec3 c = mix(vec3(0.16,0.22,0.26), vec3(0.98,0.95,0.84), I);
        gl_FragColor = vec4(c, 1.0); }`,
  });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(TW, 0.7), panelMat); panel.position.set(0, 1.12, -TL / 2 - 0.16); G.add(panel);
  G.add(box(TW + 0.3, 0.1, 0.12, wood, { y: 1.47, z: -TL / 2 - 0.2 }));
  // signs
  const sT = labelTex({ w: 1000, h: 300, bg: '#efe2c0', border: INK, seed: 41, lines: [{ text: 'ROUND 2: WAVES', size: 180, y: 0.53, spacing: '4px' }] });
  const sign = signBoard({ w: 1.9, h: 0.55, texture: sT, postH: 0 }); sign.position.set(-1.8, 2.6, -5.4); G.add(sign);
  const ipT = labelTex({ w: 1400, h: 260, bg: '#ffd36a', border: INK, seed: 42, lines: [{ text: 'INTERFERENCE PATTERN', size: 170, y: 0.54, spacing: '4px' }] });
  const ip = hangingSign('INTERFERENCE PATTERN', 2.6, 0.42, { bg: '#ffd36a', size: 190, rod: 0.8 }); ip.position.set(0, 2.2, -TL / 2 - 0.1); G.add(ip);
  G.add(pendant(-1.5, 3.6, -1.0)); G.add(pendant(1.5, 3.6, 1.5));
  bakeEdges(G);
  const t0 = shotStart(4) - 6.0, tI = beat(4, 'interference');
  return {
    group: G,
    update(t) {
      wm.uniforms.uT.value = t - t0;
      paddle.position.z = 3.25 + 0.03 * Math.sin((t - t0) * params.k * params.c);
      // the sign drops in on "interference"
      const p = smooth(tI - 0.35, tI + 0.15, t);
      ip.position.y = lerp(4.8, 2.2, p) + 0.05 * Math.sin(Math.max(0, t - tI) * 10) * Math.exp(-Math.max(0, t - tI) * 3);
    },
  };
}

// ============ D: electron lab ============
function locElectronLab() {
  const G = room({ w: 9, d: 9, h: 3.8, wall: M.plaster('#b9c3c6', 501), floor: M.concrete('#8f9496', 502), rightOpenings: [{ type: 'window', x: 1.0, y: 1.2, w: 1.6, h: 1.8 }], wainscot: '#3e4c56', ceil: '#aab2b4', interior: '#2a3a52' });
  // electron gun
  const gunG = new THREE.Group();
  gunG.add(box(1.1, 0.9, 1.2, M.flat('#6f7f86', 503)));
  gunG.add(cyl(0.22, 0.22, 0.6, M.flat('#c9a24a', 504), { seg: 20 }).rotateX(Math.PI / 2));
  gunG.children[1].position.set(0, 0.55, -0.85);
  gunG.add(box(0.3, 0.2, 0.05, M.dark('#22282c'), { x: -0.25, y: 0.55, z: 0.61 }));
  for (let i = 0; i < 3; i++) gunG.add(cyl(0.05, 0.05, 0.04, M.flat(['#d23a2a', '#e9c44a', '#4fb06a'][i], 505 + i), { x: 0.2 + i * 0.12, y: 0.6, z: 0.61, seg: 12 }).rotateX(Math.PI / 2));
  gunG.position.set(0, 0, 3.4); G.add(gunG);
  const gunT = labelTex({ w: 700, h: 160, bg: '#22282c', fg: '#e9c44a', seed: 51, lines: [{ text: 'ELECTRON GUN', size: 110, y: 0.55, color: '#e9c44a', spacing: '6px' }] });
  G.add(plane(0.9, 0.2, M.label(gunT), { y: 0.72, z: 4.01 }));
  // slit plate on a stand (two vertical slits at x = ±0.25)
  const plateG = new THREE.Group();
  const pl = facade({ w: 1.4, h: 0.9, t: 0.06, mat: M.flat('#9aa6aa', 508), openings: [{ type: 'window', x: -0.25, y: 0.15, w: 0.07, h: 0.6 }, { type: 'window', x: 0.25, y: 0.15, w: 0.07, h: 0.6 }], cornice: false, plinth: false, interior: '#9aa6aa' });
  pl.children.slice(1).forEach((c) => pl.remove(c)); // keep only the plate (no backdrops, mullions or sills)
  pl.position.y = 0.75; plateG.add(pl);
  plateG.add(box(0.1, 0.75, 0.1, M.dark('#3a4044'), { x: 0 }));
  plateG.add(box(0.7, 0.05, 0.4, M.dark('#3a4044'), { x: 0 }));
  plateG.position.set(0, 0, 0.03); G.add(plateG);
  // detector screen with dots (canvas)
  const SW = 2.6, SH = 1.8, SY = 0.55, SZ = -3.0;
  const dotC = document.createElement('canvas'); dotC.width = 1040; dotC.height = 720;
  const dotT = new THREE.CanvasTexture(dotC); dotT.colorSpace = THREE.NoColorSpace;
  G.add(box(SW + 0.2, SH + 0.2, 0.12, M.flat('#3a4448', 509), { y: SY - 0.1, z: SZ - 0.07 }));
  G.add(plane(SW, SH, basic('#ffffff', { map: dotT }), { y: SY + SH / 2, z: SZ + 0.002 }));
  G.add(box(0.12, SY - 0.1, 0.12, M.dark('#3a4044'), { x: -1.0, z: SZ - 0.07 })); G.add(box(0.12, SY - 0.1, 0.12, M.dark('#3a4044'), { x: 1.0, z: SZ - 0.07 }));
  // counter display above the screen
  const cntC = document.createElement('canvas'); cntC.width = 1024; cntC.height = 200;
  const cntT = new THREE.CanvasTexture(cntC); cntT.colorSpace = THREE.NoColorSpace;
  G.add(box(2.2, 0.48, 0.1, M.dark('#22282c'), { y: SY + SH + 0.2, z: SZ - 0.05 }));
  G.add(plane(2.05, 0.4, basic('#ffffff', { map: cntT }), { y: SY + SH + 0.44, z: SZ + 0.006 }));
  // round sign
  const sT = labelTex({ w: 1100, h: 300, bg: '#efe2c0', border: INK, seed: 52, lines: [{ text: 'ROUND 3: ELECTRONS', size: 170, y: 0.53, spacing: '4px' }] });
  const sign = signBoard({ w: 2.0, h: 0.55, texture: sT, postH: 0 }); sign.position.set(-2.6, 2.6, -4.45); G.add(sign);
  // detector on a swing arm (swings in during shot 8)
  const detPivot = new THREE.Group(); detPivot.position.set(2.2, 0, 0.3); G.add(detPivot);
  detPivot.add(box(0.12, 1.35, 0.12, M.dark('#3a4044')));
  const arm = box(1.6, 0.08, 0.08, M.dark('#3a4044'), { x: -0.8, y: 1.3 }); detPivot.add(arm);
  const det = new THREE.Group();
  det.add(box(0.36, 0.3, 0.3, M.flat('#c9a24a', 510)));
  det.add(cyl(0.07, 0.07, 0.16, M.dark('#1d1d22'), { seg: 14 }).rotateZ(Math.PI / 2));
  det.children[1].position.set(-0.24, 0.15, 0);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), basic('#5a1a12')); lamp.position.set(0.05, 0.36, 0); det.add(lamp);
  const roC = document.createElement('canvas'); roC.width = 512; roC.height = 192;
  const roT = new THREE.CanvasTexture(roC); roT.colorSpace = THREE.NoColorSpace;
  const ro = plane(0.32, 0.12, basic('#ffffff', { map: roT }), { y: 0.17, z: 0.152 }); det.add(ro);
  const onT = labelTex({ w: 640, h: 160, bg: '#22282c', fg: '#ff5a4a', seed: 53, wearAmount: 0.2, lines: [{ text: 'DETECTOR ON', size: 110, y: 0.55, color: '#ff6a5a', spacing: '6px' }] });
  const onLabel = plane(0.34, 0.085, basic('#ffffff', { map: onT }), { y: 0.03, z: 0.152 }); det.add(onLabel);
  det.position.set(-1.62, 1.05, 0); detPivot.add(det);
  // wave-of-possibilities cloud (shot 11)
  const cm = cloudMaterial({ k: (2 * Math.PI) / 0.32, c: 1.6, s1: [-0.25, 0.0], s2: [0.25, 0.0], bar: 0.0, src: 2.3 });
  cm.uniforms.uSpread.value = 0.6;
  const cloud = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 5.8, 1, 1), cm); cloud.rotation.x = -Math.PI / 2; cloud.position.set(0, 1.05, 0); G.add(cloud);
  const flash = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), GLOW); flash.position.set(0.18, SY + SH / 2, SZ + 0.02); G.add(flash);
  // the electron character
  const e = makeElectron(5); G.add(e.root);
  G.add(pendant(-1.6, 3.3, 1.2, '#3a4a5a')); G.add(pendant(1.2, 3.3, -1.5, '#3a4a5a'));
  // cables + boxes for detail
  for (let i = 0; i < 3; i++) G.add(crate(0.55, '#7a8a86', i === 0 ? 'HIGH VOLTAGE' : null).translateX(-3.4 + i * 0.6).translateZ(3.8));
  bakeEdges(G);
  // ---- dot samples (deterministic) ----
  const rI = rng(71), rP = rng(72);
  const gauss = (r) => { let s = 0; for (let k = 0; k < 6; k++) s += r(); return (s - 3) / Math.sqrt(0.5); };
  const interf = [];
  while (interf.length < 5200) {
    const x = (rI() * 2 - 1) * 1.25;
    const P = Math.pow(Math.cos((Math.PI * x) / 0.26), 2) * Math.exp(-(x * x) / (2 * 0.5 * 0.5));
    if (rI() < P) interf.push([x, gauss(rI) * 0.28]);
  }
  const which = [];
  for (let i = 0; i < 3200; i++) which.push([(i % 2 ? 0.38 : -0.38) + gauss(rP) * 0.11, gauss(rP) * 0.28]);
  const drawDots = (list, n, alpha = 1) => {
    const g = dotC.getContext('2d');
    g.fillStyle = '#10202a'; g.fillRect(0, 0, dotC.width, dotC.height);
    g.strokeStyle = 'rgba(120,180,200,0.12)'; g.lineWidth = 2;
    for (let i = 1; i < 10; i++) { g.beginPath(); g.moveTo(i * dotC.width / 10, 0); g.lineTo(i * dotC.width / 10, dotC.height); g.stroke(); }
    for (let i = 1; i < 7; i++) { g.beginPath(); g.moveTo(0, i * dotC.height / 7); g.lineTo(dotC.width, i * dotC.height / 7); g.stroke(); }
    const sx = dotC.width / SW, sy = dotC.height / SH;
    g.globalAlpha = alpha;
    for (let i = 0; i < Math.min(n, list.length); i++) {
      const [x, y] = list[i]; const px = (x + SW / 2) * sx, py = (SH / 2 - y) * sy;
      g.fillStyle = 'rgba(120,230,255,0.35)'; g.beginPath(); g.arc(px, py, 5, 0, 7); g.fill();
      g.fillStyle = '#d8fbff'; g.beginPath(); g.arc(px, py, 2.2, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    if (n === 1) { const [x, y] = list[0]; const px = (x + SW / 2) * sx, py = (SH / 2 - y) * sy; g.strokeStyle = '#ffd36a'; g.lineWidth = 6; g.beginPath(); g.arc(px, py, 34, 0, 7); g.stroke(); g.fillStyle = '#d8fbff'; g.beginPath(); g.arc(px, py, 9, 0, 7); g.fill(); }
    dotT.needsUpdate = true;
  };
  const drawCount = (n, label = 'ELECTRONS FIRED') => {
    const g = cntC.getContext('2d');
    g.fillStyle = '#121a1e'; g.fillRect(0, 0, cntC.width, cntC.height);
    g.fillStyle = '#8af2c2'; g.font = `130px ${SIGN_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(`${label}: ${Math.round(n).toLocaleString('en-ZA').replace(/,/g, ' ')}`, cntC.width / 2, cntC.height / 2 + 6);
    cntT.needsUpdate = true;
  };
  const drawReadout = (txt, on) => {
    const g = roC.getContext('2d');
    g.fillStyle = '#0f1a14'; g.fillRect(0, 0, roC.width, roC.height);
    g.fillStyle = on ? '#9dff8a' : '#2a4a2a'; g.font = `120px ${SIGN_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(txt, roC.width / 2, roC.height / 2 + 6);
    roT.needsUpdate = true;
  };
  const tSingle = beat(5, 'single'), t6a = shotStart(6), t6b = beat(6, 'stripes'), t6e = shotEnd(6);
  const tDet = beat(8, 'detector'), tVan = beat(8, 'vanished'), tCloud = shotStart(11), tOne = beat(11, 'one');
  let lastKey = '';
  return {
    group: G,
    update(t, camPos, shot) {
      // detector arm: away (rotated) except in shots 8-9
      const swing = shot === 8 ? smooth(tDet - 0.6, tDet + 0.3, t) : shot === 9 ? 1 : 0;
      detPivot.rotation.y = lerp(-1.45, 0, swing);
      lamp.material.color.set(swing > 0.95 ? '#ff3a2a' : '#5a1a12');
      onLabel.visible = swing > 0.95;
      // screen state
      let key = '', n = 0, count = 0, list = interf, alpha = 1;
      if (shot === 5) { n = t >= tSingle ? 1 : 0; count = t > beat(5, 'Then') ? 1 : 0; key = `5-${n}-${count}`; }
      else if (shot === 6) { const p = clamp((t - t6a) / (t6b + 0.6 - t6a), 0, 1); n = 1 + Math.floor(Math.pow(p, 2.2) * (interf.length - 1)); count = 1 + Math.pow(clamp((t - t6a) / (t6e - t6a - 0.4), 0, 1), 2.2) * 9999; key = `6-${n}-${Math.round(count)}`; }
      else if (shot === 8) {
        if (t < tVan - 0.5) { list = interf; n = interf.length; alpha = 1; count = 10000; }
        else { list = which; const p = clamp((t - (tVan - 0.5)) / 1.6, 0, 1); n = Math.floor(p * which.length); count = 10000 + p * 10000; }
        key = `8-${list === interf ? 'i' : 'w'}-${n}`;
      } else if (shot === 9) { list = which; n = which.length; count = 20000; key = '9'; }
      else if (shot === 11) { list = interf; n = 0; count = 0; key = '11'; }
      if (key !== lastKey) { drawDots(list, n, alpha); drawCount(count, shot >= 8 && shot <= 9 ? 'DETECTOR ON · FIRED' : 'ELECTRONS FIRED'); lastKey = key; }
      // detector readout flicker
      const side = Math.floor(t * 3.3) % 2 ? 'RIGHT' : 'LEFT';
      drawReadout(swing > 0.95 ? `SLIT: ${side}` : '---', swing > 0.95);
      // cloud (shot 11)
      cloud.visible = shot === 11;
      if (shot === 11) {
        cm.uniforms.uT.value = (t - tCloud + 0.4) * 1.0;
        cm.uniforms.uFade.value = 1 - smooth(tOne - 0.1, tOne + 0.15, t);
      }
      flash.visible = shot === 11 && t > tOne - 0.05;
      if (flash.visible) { const p = clamp((t - tOne) / 0.6, 0, 1); flash.scale.setScalar(0.6 + 1.6 * Math.exp(-p * 4)); }
      // electron character
      e.root.visible = shot === 5 || shot === 8 || shot === 9;
      if (shot === 5) {
        const strutEnd = tSingle - 0.5;
        const p = clamp((t - shotStart(5)) / (strutEnd - shotStart(5)), 0, 1);
        e.root.position.set(0.15, 0, lerp(2.6, 0.9, p));
        e.bodyG.scale.setScalar(1);
        if (t > strutEnd) { // zips through the slits as a streak
          const z = clamp((t - strutEnd) / 0.45, 0, 1);
          e.root.position.set(lerp(0.15, -0.25, z), lerp(0, 0.6, z), lerp(0.9, 0.0, z));
          e.bodyG.scale.setScalar(Math.max(0.0001, 1 - z));
        }
        animElectron(e, t, camPos, { strut: p < 1 ? 1 : 0 });
      } else if (shot === 8 || shot === 9) {
        e.root.position.set(1.3, 0, 0.45); e.bodyG.scale.setScalar(1);
        animElectron(e, t, camPos, { nervous: t > tDet - 0.3 ? 1 : 0 });
      }
    },
  };
}

// ============ E: corner shop (the "meet yourself at the till" gag) ============
function locShop() {
  const G = room({ w: 6, d: 5.5, h: 3.2, wall: M.wallpaper('#e2d2a6', '#d1bd8a', 601), floor: M.concrete('#c9b9a0', 602),
    backOpenings: [{ type: 'door', x: -1.7, w: 1.0, h: 2.15 }, { type: 'door', x: 1.7, w: 1.0, h: 2.15 }], wainscot: '#7a4e34', interior: '#fff2cf', doorPanels: false });
  const D = 5.5;
  // bright street seen through both doors
  for (const x of [-1.7, 1.7]) G.add(plane(1.4, 2.6, basic('#fff1cc'), { x, y: 1.3, z: -D / 2 - 0.6 }));
  for (const x of [-1.7, 1.7]) { const s = hangingSign('IN', 0.6, 0.3, { size: 230, rod: 0 }); s.position.set(x, 2.28, -D / 2 + 0.06); G.add(s); }
  const shopT = labelTex({ w: 1100, h: 300, bg: '#2f5a4a', fg: '#f2e6c8', border: '#f2e6c8', seed: 61, lines: [{ text: 'CORNER SHOP', size: 190, y: 0.54, color: '#f2e6c8', spacing: '8px' }] });
  const ss = signBoard({ w: 2.0, h: 0.55, texture: shopT, postH: 0 }); ss.position.set(0, 2.45, -D / 2 + 0.06); G.add(ss);
  // shelves with goods
  const r = rng(62);
  for (const x of [-2.75]) {
    const sh = new THREE.Group();
    sh.add(box(0.4, 2.2, 2.4, M.wood('#7a5638', 603)));
    for (let row = 0; row < 4; row++) for (let i = 0; i < 6; i++) sh.add(box(0.25, 0.22 + r() * 0.1, 0.3, M.flat(['#d23a2a', '#e9c44a', '#3f7aa8', '#5fa05a', '#f2efe4'][Math.floor(r() * 5)], 604 + i), { x: 0.12, y: 0.3 + row * 0.5, z: -1.0 + i * 0.4, inkOpts: { hull: 0.004, edges: 30, thin: true } }));
    sh.position.set(x, 0, 0.2); G.add(sh);
  }
  // counter + till
  const counter = new THREE.Group();
  counter.add(box(2.2, 0.95, 0.7, M.panel('#8a5a36', 610)));
  counter.add(box(2.3, 0.06, 0.8, M.wood('#5a3a22', 611), { y: 0.95 }));
  const till = new THREE.Group();
  till.add(box(0.5, 0.22, 0.4, M.flat('#3a4a4a', 612)));
  const disp = box(0.3, 0.14, 0.04, M.dark('#22282c'), { y: 0.26, z: -0.05 }); disp.rotation.x = -0.3; till.add(disp);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) till.add(box(0.06, 0.02, 0.05, M.flat('#e9e2cf', 613), { x: -0.1 + i * 0.1, y: 0.22, z: 0.05 + j * 0.06, inkOpts: { hull: 0, edges: 30, thin: true } }));
  till.position.set(0, 1.01, 0); counter.add(till);
  counter.position.set(0, 0, -1.2); G.add(counter);
  const tillSign = hangingSign('TILL', 0.55, 0.24, { size: 220, rod: 0 }); tillSign.position.set(0.62, 0.99, -1.05); G.add(tillSign);
  G.add(pendant(0, 2.9, -0.4, '#8a3a2a'));
  // two identical electrons enter through both doors and meet at the till
  const e1 = makeElectron(7), e2 = makeElectron(7);
  G.add(e1.root, e2.root);
  bakeEdges(G);
  const tBoth = beat(7, 'both'), tTill = beat(7, 'till');
  return {
    group: G,
    update(t, camPos) {
      // walk in through each door, down the side of the counter, then across to meet in front of the till
      const p = smooth(tBoth - 0.8, tTill - 0.1, t);
      const leg1 = clamp(p / 0.6, 0, 1), leg2 = clamp((p - 0.6) / 0.4, 0, 1);
      e1.root.position.set(lerp(-1.7, -0.33, leg2), 0, lerp(-3.2, -0.35, leg1));
      e2.root.position.set(lerp(1.7, 0.33, leg2), 0, lerp(-3.2, -0.35, leg1));
      const meet = t > tTill - 0.05;
      animElectron(e1, t, camPos, { strut: p > 0 && p < 1 ? 1 : 0, face: meet ? 0.7 : 0 });
      animElectron(e2, t, camPos, { strut: p > 0 && p < 1 ? 1 : 0, face: meet ? -0.7 : 0 });
      if (meet) { const j = Math.exp(-(t - tTill) * 5) * 0.08; e1.root.position.y = j; e2.root.position.y = j; }
    },
  };
}

export function buildWorld() {
  const scene = new THREE.Scene();
  const locs = { A: locLab(), B: locRange(), C: locTank(), D: locElectronLab(), E: locShop() };
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
