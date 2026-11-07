// All locations live in one scene at different x offsets; only the active one is shown.
import * as THREE from 'three';
import {
  INK, SIGN_FONT, HAND_FONT, M, tex, toon, GRAD, labelTex, box, cyl, plane, mesh, boxGeo, ink, edgeLines, bakeEdges,
  facade, building, gableRoof, sawRoof, chimney, lampPost, barrel, crate, signBoard, revealPlane, hills, skyDome,
  rng, lerp, clamp, smooth, basic, blob, hexA,
} from './kit.js';
import { makeChar, animChar, WORKER_PALETTES } from './char.js';
import { beat, beatEnd } from './timing.js';

export const LOC = { A: 0, B: 60, C: 120, D: 180, E: 260, F: 340 };

const brickStackMat = () => toon('stack', { map: tex.brick('#b9573a', '#4c2a20', 51, 0.8) });
function brickStack(w = 1.2, h = 1.0, d = 1.0, o = {}) {
  const g = new THREE.Group();
  g.add(box(w + 0.15, 0.12, d + 0.1, M.wood('#8c6a46', 52), { inkOpts: { hull: 0.012, edges: 30 } })); // pallet
  g.add(box(w, h, d, brickStackMat(), { y: 0.12, inkOpts: { hull: 0.02, edges: 30 } }));
  g.position.set(o.x || 0, 0, o.z || 0); g.rotation.y = o.ry || 0;
  return g;
}
function brickMesh() {
  const m = new THREE.Mesh(boxGeo(0.23, 0.075, 0.11), toon('brk', { map: tex.brick('#c0603f', '#c0603f', 53, 0.3) }));
  m.castShadow = true;
  m.add(edgeLines(m.geometry, 30, true));
  return m;
}
function wheelbarrow() {
  const g = new THREE.Group();
  const tray = mesh(new THREE.CylinderGeometry(0.45, 0.32, 0.35, 4, 1, true), M.flat('#5f7a7a', 54), { inkOpts: { hull: 0.012, edges: 30 } });
  tray.rotation.y = Math.PI / 4; tray.scale.set(1.3, 1, 0.8); tray.position.y = 0.55; g.add(tray);
  g.add(cyl(0.2, 0.2, 0.08, M.dark('#2e2a28'), { y: 0.0, x: 0.55, seg: 14, rz: Math.PI / 2 }));
  g.children[g.children.length - 1].rotation.z = Math.PI / 2; g.children[g.children.length - 1].position.set(0.55, 0.2, 0);
  g.add(box(1.2, 0.05, 0.05, M.wood('#7a5638', 55), { x: -0.25, y: 0.42, z: 0.22 }));
  g.add(box(1.2, 0.05, 0.05, M.wood('#7a5638', 55), { x: -0.25, y: 0.42, z: -0.22 }));
  return g;
}
function chalkTex(lines, { w = 1024, h = 640, seed = 1, bg = '#2f3b33' } = {}) {
  return labelTex({ w, h, bg, chalk: true, seed, lines: lines.map((L) => ({ font: HAND_FONT, color: '#f2efe4', ...L })) });
}
function chalkboard(w, h, texture, { legs = false, frame = '#7a5636' } = {}) {
  const g = new THREE.Group();
  g.add(box(w + 0.12, h + 0.12, 0.05, M.wood(frame, 56), { y: legs ? 0.5 : 0, inkOpts: { hull: 0.012, edges: 30 } }));
  const face = plane(w, h, texture ? new THREE.MeshToonMaterial({ gradientMap: GRAD, map: texture }) : M.flat('#2f3b33', 57), { y: (legs ? 0.5 : 0) + (h + 0.12) / 2, z: 0.03 });
  g.add(face);
  g.userData.faceY = (legs ? 0.5 : 0) + (h + 0.12) / 2;
  if (legs) {
    g.add(box(0.07, 0.5 + h + 0.2, 0.07, M.wood(frame, 56), { x: -w / 2 + 0.1, z: -0.05 }));
    g.add(box(0.07, 0.5 + h + 0.2, 0.07, M.wood(frame, 56), { x: w / 2 - 0.1, z: -0.05 }));
    const back = box(0.07, 0.5 + h + 0.1, 0.07, M.wood(frame, 56), { z: -0.45 }); back.rotation.x = -0.3; g.add(back);
  }
  return g;
}
// chalk overlay (transparent) that writes on from the left
function chalkLine(text, w, h, size, { color = '#f4f1e6', font = HAND_FONT, align = 'left' } = {}) {
  const t = labelTex({ w: Math.round(1024 * (w / h) / 4) * 4 > 2048 ? 2048 : Math.round(256 * (w / h)), h: 256, bg: null, wearAmount: 0, lines: [{ text, size, font, color, x: align === 'left' ? 0.5 : 0.5 }] });
  return revealPlane(t, w, h);
}
function strokeTex(kind = 'strike', color = '#f4f1e6') {
  return labelTex({ w: 512, h: 128, bg: null, wearAmount: 0, paint: (g, w, h) => {
    g.strokeStyle = color; g.lineCap = 'round'; g.lineWidth = 14;
    g.beginPath();
    if (kind === 'strike') { g.moveTo(10, h * 0.58); g.bezierCurveTo(w * 0.3, h * 0.4, w * 0.7, h * 0.62, w - 10, h * 0.42); }
    g.stroke();
  } });
}
function crowdChar(r, o = {}) {
  const pal = o.palette || WORKER_PALETTES[Math.floor(r() * WORKER_PALETTES.length)];
  const hats = ['none', 'none', 'cap', 'none', 'cap'];
  return makeChar({ palette: pal, hat: o.hat || hats[Math.floor(r() * hats.length)], seed: Math.floor(r() * 1000), face: o.face || 0, scale: o.scale || (0.97 + r() * 0.08) });
}

// ============ A: Brickworks (Coronation Brick and Tile, Durban) ============
function locBrickworks() {
  const G = new THREE.Group();
  const r = rng(11);
  const ground = plane(160, 160, M.dirt('#c9a57a', 61), { rx: -Math.PI / 2, y: 0, z: -20 });
  ground.receiveShadow = true;
  ground.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = v * 160; });
  G.add(ground);
  // road through the gate
  const road = plane(7, 70, M.concrete('#b4ab9b', 62), { rx: -Math.PI / 2, y: 0.01, z: -40 });
  road.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = i % 2 ? v * 70 : v * 7; });
  road.receiveShadow = true; G.add(road);
  // perimeter wall with pillars
  const wallMat = M.brick('#a9503a', 63);
  for (const side of [-1, 1]) {
    const w = 18;
    const wall = box(w, 2.2, 0.3, wallMat, { x: side * (3.5 + w / 2), z: -6, inkOpts: { hull: 0.02, edges: 30 } });
    G.add(wall);
    G.add(box(w + 0.1, 0.12, 0.42, M.concrete('#a39a8a', 64), { x: side * (3.5 + w / 2), y: 2.2, z: -6 }));
    for (let k = 1; k <= 4; k++) G.add(box(0.5, 2.5, 0.5, wallMat, { x: side * (3.5 + k * 4.5), z: -6 }));
  }
  // gate pillars + arch sign
  for (const side of [-1, 1]) {
    G.add(box(0.75, 2.9, 0.75, wallMat, { x: side * 3.2, z: -6 }));
    G.add(box(0.95, 0.18, 0.95, M.concrete('#a39a8a', 65), { x: side * 3.2, y: 2.9, z: -6 }));
    G.add(cyl(0.07, 0.06, 2.0, M.dark('#2f3a3a'), { x: side * 3.0, y: 3.0, z: -6.1, seg: 8 }));
    // open gate leaves (iron bars), swung inward
    const leaf = new THREE.Group();
    leaf.add(box(2.8, 0.08, 0.06, M.dark('#3a4444'), { x: 1.4, y: 1.7 }));
    leaf.add(box(2.8, 0.08, 0.06, M.dark('#3a4444'), { x: 1.4, y: 0.2 }));
    for (let k = 0; k <= 9; k++) leaf.add(box(0.04, 1.6, 0.04, M.dark('#3a4444'), { x: 0.1 + k * 0.29, y: 0.15, inkOpts: { hull: 0.006, edges: 30, thin: true } }));
    leaf.position.set(side * 2.85, 0, -5.7);
    leaf.rotation.y = side < 0 ? -1.2 : Math.PI + 1.2;
    G.add(leaf);
  }
  const signT = labelTex({ w: 2048, h: 360, bg: '#efe3c2', border: INK, seed: 3, lines: [
    { text: 'CORONATION BRICK & TILE', size: 230, y: 0.47, spacing: '6px' },
  ] });
  const sign = signBoard({ w: 6.0, h: 1.05, texture: signT, frame: '#5a3a28', postH: 0 });
  sign.position.set(0, 4.0, -6.1);
  G.add(sign);
  const durT = labelTex({ w: 1024, h: 256, bg: '#7a2f26', fg: '#f5e6c4', seed: 4, lines: [{ text: 'DURBAN', size: 190, y: 0.52, color: '#f5e6c4', spacing: '10px' }] });
  const dur = signBoard({ w: 1.8, h: 0.42, texture: durT, frame: '#5a3a28', postH: 0 });
  dur.position.set(0, 3.45, -6.05);
  G.add(dur);
  // gatehouse (pay office) with calendar
  const gh = building({ w: 3.4, d: 2.8, h: 2.7, mat: M.plaster('#e8d6b0', 66), roof: 'gable', roofMat: M.corr('#8e9b8c', 67), rise: 0.9,
    openings: [{ type: 'window', x: 0.55, y: 0.95, w: 1.0, h: 0.95 }, { type: 'door', x: -0.95, w: 0.85, h: 2.05 }], interior: '#3a2e28', door: '#4f6b5c' });
  gh.position.set(-6.6, 0, -4.2);
  G.add(gh);
  // awning over pay window
  const aw = box(1.5, 0.06, 0.8, M.corr('#9a5a3a', 68), { x: -6.6 + 0.55, y: 2.15, z: -4.2 + 1.4 + 0.35, inkOpts: { hull: 0.012, edges: 30 } });
  aw.rotation.x = 0.25; G.add(aw);
  G.add(box(0.05, 0.75, 0.05, M.dark('#3a3030'), { x: -6.6 - 0.15, y: 1.45, z: -4.2 + 1.4 + 0.72 }));
  G.add(box(0.05, 0.75, 0.05, M.dark('#3a3030'), { x: -6.6 + 1.25, y: 1.45, z: -4.2 + 1.4 + 0.72 }));
  const calT = labelTex({ w: 512, h: 700, bg: '#f6efdc', seed: 5, lines: [
    { text: 'JANUARY', size: 110, y: 0.16, color: '#8a2a22' }, { text: '1973', size: 80, y: 0.3, color: INK }, { text: '9', size: 360, y: 0.66, color: INK },
  ], paint: (g, w, h) => { g.fillStyle = '#8a2a22'; g.fillRect(0, 0, w, 26); for (let i = 0; i < 6; i++) { g.fillStyle = INK; g.beginPath(); g.arc(60 + i * 80, 14, 9, 0, 7); g.fill(); } } });
  const cal = plane(0.55, 0.75, M.label(calT), { x: -6.6 + 1.45, y: 1.75, z: -4.2 + 1.4 + 0.012 });
  G.add(cal);
  G.add(box(0.6, 0.06, 0.03, M.wood('#5a3a28', 69), { x: -6.6 + 1.45, y: 2.12, z: -4.2 + 1.4 + 0.02 }));
  // pay window label
  const payT = labelTex({ w: 768, h: 192, bg: '#2f5a4a', seed: 6, lines: [{ text: 'WAGES', size: 140, color: '#f2e6c8', y: 0.54, spacing: '8px' }] });
  G.add(plane(0.9, 0.22, M.label(payT), { x: -6.6 + 0.55, y: 2.2 - 0.05, z: -4.2 + 1.4 + 0.75, rx: 0.0 }));
  // notice board (S4)
  const noticeT = labelTex({ w: 900, h: 1100, bg: '#f4ecd6', seed: 7, border: '#8a2a22', lines: [
    { text: 'NOTICE', size: 170, y: 0.15, color: '#8a2a22', spacing: '10px' },
    { text: 'STRIKES', size: 250, y: 0.42, color: INK }, { text: 'ILLEGAL', size: 250, y: 0.64, color: '#8a2a22' },
  ], paint: (g, w, h) => { g.fillStyle = hexA(INK, 0.45); for (let i = 0; i < 4; i++) g.fillRect(110, h * 0.78 + i * 34, w - 220 - (i % 2) * 120, 10); } });
  const nb = new THREE.Group();
  nb.add(box(1.5, 1.85, 0.08, M.wood('#5e4030', 70), { y: 0.9, inkOpts: { hull: 0.015, edges: 30 } }));
  nb.add(box(0.12, 2.9, 0.12, M.wood('#4e3426', 71), { x: -0.62, z: -0.08 }));
  nb.add(box(0.12, 2.9, 0.12, M.wood('#4e3426', 71), { x: 0.62, z: -0.08 }));
  const roofNB = box(1.8, 0.07, 0.5, M.corr('#7d8a7e', 72), { y: 2.85, z: 0.12 }); roofNB.rotation.x = 0.2; nb.add(roofNB);
  const notice = plane(1.05, 1.28, M.label(noticeT), { y: 1.82, z: 0.05 });
  nb.add(notice);
  // older papers pinned around it
  nb.add(plane(0.28, 0.38, M.paper('#e6dcc0', 73), { x: -0.55, y: 1.25, z: 0.045, rz: 0.08 }));
  nb.add(plane(0.3, 0.22, M.paper('#efe6cf', 74), { x: 0.56, y: 2.3, z: 0.045, rz: -0.06 }));
  nb.position.set(4.9, 0, -5.55); nb.rotation.y = -0.18;
  G.add(nb);
  // 1973 production chalkboard on an easel (S1)
  const boardT = chalkTex([{ text: '9 JANUARY', size: 190, y: 0.3 }, { text: '1973', size: 300, y: 0.7 }], { w: 1100, h: 860, seed: 8 });
  const cb = chalkboard(1.35, 1.05, boardT, { legs: true });
  cb.position.set(-1.05, 0, -1.2); cb.rotation.y = 0.18;
  G.add(cb);
  // tally marks on the easel board ledge
  // kiln (Hoffmann-style, arched brick vaults) on the right, long axis along z
  const kiln = new THREE.Group();
  const kw = 16, kh = 3.6;
  const kFront = facade({ w: kw, h: kh, t: 0.6, mat: M.brick('#9d4a33', 75), openings: [...Array(6).keys()].map((i) => ({ type: 'arch', x: -kw / 2 + 1.6 + i * 2.6, y: 0.0001, w: 1.3, h: 2.1 })), interior: '#241713', cornice: true });
  kFront.rotation.y = -Math.PI / 2; kFront.position.set(-4, 0, 0);
  kiln.add(kFront);
  kiln.add(box(7.6, kh, kw - 0.4, M.brick('#9d4a33', 75), { x: 0, z: 0, inkOpts: { hull: 0.03, edges: 30 } }));
  const kroof = gableRoof(kw + 0.6, 9.2, 1.4, M.corr('#7f8a83', 76), kh, 'z');
  kroof.rotation.y = 0; kiln.add(kroof);
  kiln.position.set(14, 0, -2);
  G.add(kiln);
  const ch1 = chimney(24, 1.2, 0.8, M.brick('#a34e36', 77)); ch1.position.set(14.5, 0, -3); G.add(ch1);
  const ch2 = chimney(18, 1.0, 0.7, M.brick('#9a4834', 78)); ch2.position.set(-17, 0, -16); G.add(ch2);
  // drying shed on the left: posts, corrugated roof, racks of green bricks
  const shed = new THREE.Group();
  for (let i = 0; i < 4; i++) for (const zz of [-3, 3]) shed.add(box(0.18, 3.0, 0.18, M.wood('#6a4a30', 79), { x: -4.5 + i * 3, z: zz }));
  const sr = box(10.4, 0.1, 7.4, M.corr('#8a968e', 80), { y: 3.0 }); sr.rotation.z = 0.06; shed.add(sr);
  for (let i = 0; i < 3; i++) shed.add(box(8.5, 0.9, 0.9, toon('green', { map: tex.brick('#c9a27c', '#6d5440', 81, 0.6) }), { z: -2 + i * 2, inkOpts: { hull: 0.012, edges: 30 } }));
  shed.position.set(-13, 0, 2);
  G.add(shed);
  // brick stacks, barrels, wheelbarrow, lamp posts
  const stacks = [[-3.4, -3.9, 0.2], [-6.4, -1.6, -0.3], [-7.5, 0.8, -0.2], [3.4, 5.4, 0.1], [-5.8, 6.4, 0.5], [8.8, -4.8, 0.2], [-9.5, -3.8, 0.1]];
  for (const [x, z, ry] of stacks) G.add(brickStack(1.3, 0.85 + r() * 0.5, 1.0, { x, z, ry }));
  const wb = wheelbarrow(); wb.position.set(2.6, 0, -2.4); wb.rotation.y = 0.6; G.add(wb);
  const b1 = barrel('#6c7b5a'); b1.position.set(-5.2, 0, -3.4); G.add(b1);
  const b2 = barrel('#8a6a3a'); b2.position.set(-4.6, 0, -3.8); G.add(b2);
  for (const x of [-4.4, 4.4]) { const lp = lampPost(4.4); lp.position.set(x, 0, -6.6); lp.rotation.y = x < 0 ? Math.PI : 0; G.add(lp); }
  // outside the gate: houses and hills
  for (let i = 0; i < 7; i++) {
    const h = building({ w: 4 + r() * 2, d: 4, h: 2.6 + r() * 0.6, mat: M.plaster(['#e8d2a8', '#d9c7a4', '#e6c9a0', '#cfd3bf'][i % 4], 90 + i), roofMat: M.tiles(['#a9553c', '#8f4a36', '#9a6046'][i % 3], 91), rise: 1.2,
      openings: [{ type: 'window', x: -0.8, y: 0.9, w: 0.8, h: 0.9 }, { type: 'door', x: 0.9, w: 0.8, h: 1.9 }] });
    h.position.set(-24 + i * 8 + r() * 2, 0, -18 - r() * 6);
    G.add(h);
  }
  G.add(hills({ w: 400, h: 22, seed: 2, color: '#a7b48f', z: -150 }));
  G.add(hills({ w: 400, h: 14, seed: 5, color: '#b9c09b', z: -95 }));
  G.add(hills({ w: 400, h: 16, seed: 9, color: '#a9b38f', z: 110 }).rotateY(Math.PI));
  // ----- people -----
  const people = [];
  // S1 hero group with bricks
  const heroSpecs = [
    { x: 0.25, z: 0.3, pal: 'workerA', hat: 'cap' }, { x: 1.1, z: 0.0, pal: 'workerC', hat: 'none' }, { x: 1.95, z: 0.35, pal: 'workerE', hat: 'none' },
    { x: -0.6, z: -2.6, pal: 'workerB', hat: 'none' }, { x: 2.3, z: -2.6, pal: 'workerD', hat: 'cap' }, { x: 0.9, z: -3.3, pal: 'workerF', hat: 'none' },
    { x: -2.8, z: -3.6, pal: 'workerC', hat: 'cap' }, { x: 2.2, z: -4.4, pal: 'workerA', hat: 'none' },
  ];
  const s1 = new THREE.Group(); G.add(s1);
  const s1People = heroSpecs.map((p, i) => {
    const c = makeChar({ palette: p.pal, hat: p.hat, seed: 100 + i, face: 0 });
    c.root.position.set(p.x, 0, p.z);
    const br = brickMesh(); c.yawG.add(br); c.brick = br;
    s1.add(c.root); return c;
  });
  // S8: boss + one worker, then the whole yard full of workers
  const s8 = new THREE.Group(); G.add(s8);
  const boss = makeChar({ palette: 'boss', hat: 'bowler', seed: 300, face: 0.5 });
  boss.root.position.set(5.6, 0, 1.2);
  const one = makeChar({ palette: 'workerD', hat: 'cap', seed: 301, face: -0.5 });
  one.root.position.set(6.7, 0, 1.0);
  s8.add(boss.root, one.root);
  const crowd = [];
  const rc = rng(77);
  for (let i = 0; i < 60; i++) {
    const c = crowdChar(rc);
    // fill the yard between kiln and gate, leaving the boss/worker pair clear
    let x, z;
    do { x = -4 + rc() * 13; z = -5.5 + rc() * 8.5; } while ((Math.abs(x - 6.15) < 1.7 && z > -0.6) || (x > 8.8) || (Math.hypot(x - 4.6, z + 1.6) < 1.1));
    c.root.position.set(x, 0, z);
    crowd.push(c); s8.add(c.root);
  }
  // S10: sunrise, the same crowd; one worker places a final brick on a stack
  const s10 = new THREE.Group(); G.add(s10);
  const finalStack = brickStack(1.3, 0.55, 1.0, { x: -2.2, z: 3.4, ry: 0.15 });
  s10.add(finalStack);
  const lastBrick = brickMesh(); s10.add(lastBrick);
  const placer = makeChar({ palette: 'workerA', hat: 'cap', seed: 401, face: 0 });
  placer.root.position.set(-1.15, 0, 3.7);
  s10.add(placer.root);
  const crowd10 = [];
  const r10 = rng(91);
  for (let i = 0; i < 30; i++) {
    const c = crowdChar(r10);
    let x, z;
    do { x = -7 + r10() * 11; z = -5.5 + r10() * 6.5; } while (Math.hypot(x + 1.6, z - 3.2) < 2.2);
    c.root.position.set(x, 0, z); crowd10.push(c); s10.add(c.root);
  }

  bakeEdges(G);

  const handPos = (c, ang) => new THREE.Vector3(0.15 + 0.055 * Math.cos(ang) + 0.43 * Math.sin(ang), 1.02 + 0.055 * Math.sin(ang) - 0.43 * Math.cos(ang), 0.06);
  const tStop = beat(1, 'stopped');
  const tBrick = beat(10, 'bricks');
  return {
    group: G,
    update(t, cam, shot) {
      s1.visible = shot <= 4; s8.visible = shot === 8; s10.visible = shot === 10;
      if (shot <= 4) {
        s1People.forEach((c, i) => {
          const down = smooth(tStop + i * 0.06, tStop + 0.55 + i * 0.06, t);
          const armUp = 0.26 * (1 - down);
          animChar(c, t, cam, { armUp });
          // brick in hand, then set down at the feet
          const ang = 0.12 + armUp * 2.3;
          const hp = handPos(c, ang);
          const ground = new THREE.Vector3(0.32, 0.04, 0.22);
          c.brick.position.lerpVectors(hp, ground, down);
          c.brick.rotation.set(0, 0.3, (1 - down) * 0.4);
        });
      }
      if (shot === 8) {
        animChar(boss, t, cam, { point: smooth(beat(8, 'fire'), beat(8, 'fire') + 0.4, t) * (1 - smooth(beat(8, 'But'), beat(8, 'But') + 0.5, t)) });
        animChar(one, t, cam, {});
        crowd.forEach((c) => animChar(c, t, cam, {}));
      }
      if (shot === 10) {
        const p = smooth(tBrick - 1.4, tBrick, t);
        const from = new THREE.Vector3(-1.5, 0.95, 3.75), to = new THREE.Vector3(-2.15, 0.71, 3.45);
        lastBrick.position.lerpVectors(from, to, p);
        lastBrick.position.y += Math.sin(p * Math.PI) * 0.15;
        lastBrick.rotation.set(0, 0.15, (1 - p) * 0.3);
        animChar(placer, t, cam, { armUpL: 0.25 * (1 - p) + 0.08 });
        crowd10.forEach((c) => animChar(c, t, cam, {}));
      }
    },
  };
}

// ============ B: football stadium ============
function locStadium() {
  const G = new THREE.Group();
  const pitch = plane(90, 70, M.grass('#7da35a', 101), { rx: -Math.PI / 2 });
  pitch.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = i % 2 ? v * 70 : v * 90; });
  pitch.receiveShadow = true; G.add(pitch);
  const lineMat = basic('#f3efe2');
  const L = (w, d, x, z) => { const p = plane(w, d, lineMat, { rx: -Math.PI / 2, x, y: 0.015, z }); p.receiveShadow = false; G.add(p); };
  L(0.12, 40, -2, -2); L(60, 0.12, 0, 18); L(60, 0.12, 0, -22);
  const ring = new THREE.Mesh(new THREE.RingGeometry(5.0, 5.12, 64), lineMat); ring.rotation.x = -Math.PI / 2; ring.position.set(-2, 0.016, -2); G.add(ring);
  // terraces (stepped concrete) along the back
  const steps = 9;
  for (let i = 0; i < steps; i++) G.add(box(46, 0.45, 0.85, M.concrete('#b9b1a2', 102 + (i % 2)), { y: i * 0.45, z: -12 - i * 0.85, inkOpts: { hull: 0.02, edges: 30 } }));
  G.add(box(46, 4.05, 1.2, M.concrete('#a8a092', 104), { z: -12 - steps * 0.85 - 0.3 }));
  // stand roof on columns
  for (let i = 0; i < 6; i++) G.add(cyl(0.14, 0.14, 7.0, M.dark('#3b4a52'), { x: -20 + i * 8, z: -19.5, seg: 10 }));
  const roof = box(44, 0.2, 7.5, M.corr('#8b98a0', 105), { y: 7.0, z: -16.5 }); roof.rotation.x = -0.08; G.add(roof);
  // perimeter wall with painted boards (no brands)
  const cols = ['#e2c26a', '#c75a3d', '#5f8a8a', '#e8dcc0'];
  for (let i = 0; i < 9; i++) G.add(box(4.6, 1.0, 0.15, M.flat(cols[i % 4], 106 + i), { x: -20 + i * 5, z: -10.6, inkOpts: { hull: 0.012, edges: 30 } }));
  // goalpost (foreground)
  const gp = new THREE.Group();
  const white = M.flat('#f4f1e8', 115);
  gp.add(box(0.12, 2.44, 0.12, white, { x: 0 }));
  gp.add(box(0.12, 2.44, 0.12, white, { x: 0, z: -7.3 }).translateZ(0));
  gp.add(box(0.12, 0.12, 7.42, white, { y: 2.44, z: -3.65 }));
  gp.children[1].position.z = -7.32;
  gp.position.set(-9.5, 0, 6.5);
  G.add(gp);
  const flag = new THREE.Group();
  flag.add(cyl(0.025, 0.02, 1.5, M.flat('#f4f1e8', 119), { seg: 8 }));
  const fl = box(0.36, 0.26, 0.01, M.flat('#d8452e', 119), { y: 1.22, x: 0.18 }); flag.add(fl);
  flag.position.set(-3.1, 0, 2.3); G.add(flag);
  const ball = mesh(new THREE.SphereGeometry(0.11, 16, 12), M.flat('#f2ece0', 121), { y: 0.11, inkOpts: { hull: 0.008, edges: 0 } });
  ball.position.set(-2.55, 0.11, 2.5); G.add(ball);
  // floodlight towers
  for (const [x, z] of [[-26, -18], [24, -18]]) {
    const tw = new THREE.Group();
    tw.add(cyl(0.5, 0.2, 22, M.dark('#4a5458'), { seg: 6 }));
    tw.add(box(3.2, 1.6, 0.4, M.flat('#e8e4d4', 116), { y: 22 }));
    tw.position.set(x, 0, z); G.add(tw);
  }
  // city beyond
  const r = rng(5);
  for (let i = 0; i < 12; i++) {
    const h = 6 + r() * 14;
    G.add(box(6 + r() * 6, h, 6, M.plaster(['#d8cdb4', '#cfc4a8', '#e2d6bb'][i % 3], 120 + i), { x: -60 + i * 11, z: -45 - r() * 10, inkOpts: { hull: 0.06, edges: 30 } }));
  }
  G.add(hills({ w: 400, h: 24, seed: 3, color: '#a3b18e', z: -160 }));
  // crowd gathering, some still marching in from the right
  const people = [];
  const rc = rng(33);
  for (let i = 0; i < 64; i++) {
    const c = crowdChar(rc);
    const walking = i >= 46;
    let x, z;
    if (!walking) { do { x = -5.8 + rc() * 12; z = -9 + rc() * 7.0; } while (Math.hypot(x + 0.6, z + 1.5) < 1.3); }
    else { x = 7 + rc() * 10; z = -7 + rc() * 6; }
    c.root.position.set(x, 0, z);
    c.walkIn = walking; c.x0 = x;
    G.add(c.root); people.push(c);
  }
  // placard holder at the front
  const holder = makeChar({ palette: 'workerB', hat: 'cap', seed: 210, face: 0 });
  holder.root.position.set(-0.6, 0, -1.5);
  G.add(holder.root);
  const plT = labelTex({ w: 1024, h: 560, bg: '#f2e8cf', seed: 12, border: '#3a2a24', lines: [
    { text: 'R8,97', size: 330, y: 0.44, font: HAND_FONT, color: '#8a2a22' }, { text: 'A WEEK', size: 150, y: 0.83, font: HAND_FONT, color: INK },
  ] });
  const placard = new THREE.Group();
  placard.add(box(0.05, 1.5, 0.05, M.wood('#8a6440', 117), { y: -0.2, inkOpts: { hull: 0.008, edges: 30, dynamic: true } }));
  const pb = box(1.3, 0.72, 0.03, M.wood('#d9c8a4', 118), { y: 1.12, inkOpts: { hull: 0.01, edges: 30, dynamic: true } });
  placard.add(pb);
  placard.add(plane(1.24, 0.66, M.label(plT), { y: 1.12 + 0.36, z: 0.02 }));
  G.add(placard);
  const tNine = beat(3, 'nine'), tMarch = beat(3, 'marched');
  return {
    group: G,
    update(t, cam) {
      people.forEach((c) => {
        if (c.walkIn) {
          const p = smooth(tMarch - 1.5, tMarch + 3.0, t);
          c.root.position.x = c.x0 - 6.5 * p;
          animChar(c, t, cam, { walking: p > 0 && p < 1 ? 1 : 0.0 });
        } else animChar(c, t, cam, {});
      });
      const up = smooth(tNine - 0.5, tNine + 0.2, t);
      animChar(holder, t, cam, { armUp: 0.62 * up + 0.05 });
      holder.root.updateMatrixWorld(true);
      // placard: stick bottom in the raised hand, board upright
      const ang = 0.12 + (0.62 * up + 0.05) * 2.3;
      const hp = new THREE.Vector3(0.15 + 0.055 * Math.cos(ang) + 0.43 * Math.sin(ang), 1.02 + 0.055 * Math.sin(ang) - 0.43 * Math.cos(ang), 0.05);
      hp.applyMatrix4(holder.yawG.matrixWorld);
      G.worldToLocal(hp);
      placard.position.set(hp.x - 0.0, hp.y - 0.35 + 0.0, hp.z + 0.04);
      placard.position.y = lerp(0.25, hp.y - 0.35, up);
      placard.position.x = lerp(-0.3, hp.x, up);
      placard.rotation.z = (1 - up) * 0.25;
    },
  };
}

// ============ C: manager's office ============
function room({ w = 6, d = 5, h = 3.2, wall, floor, ceil = '#efe6d2', windowSide = 'left', wainscot = '#7a5232' }) {
  const G = new THREE.Group();
  const fl = plane(w, d, floor, { rx: -Math.PI / 2 });
  fl.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = i % 2 ? v * d : v * w; });
  fl.receiveShadow = true; G.add(fl);
  const back = facade({ w, h, t: 0.2, mat: wall, openings: [], cornice: false, plinth: false });
  back.position.z = -d / 2; G.add(back);
  const winO = [{ type: 'window', x: 0, y: 0.9, w: 1.3, h: 1.6 }];
  const left = facade({ w: d, h, t: 0.2, mat: wall, openings: windowSide === 'left' ? winO : [], cornice: false, plinth: false, interior: '#f6e8c4', glowWindows: true });
  left.rotation.y = Math.PI / 2; left.position.x = -w / 2; G.add(left);
  const right = facade({ w: d, h, t: 0.2, mat: wall, openings: windowSide === 'right' ? winO : [{ type: 'door', x: 0.8, w: 0.9, h: 2.1 }], cornice: false, plinth: false, interior: '#f6e8c4', glowWindows: true });
  right.rotation.y = -Math.PI / 2; right.position.x = w / 2; G.add(right);
  const c = plane(w, d + 2, M.flat(ceil, 130), { rx: Math.PI / 2, y: h, z: 1 }); c.castShadow = true; G.add(c);
  // wainscot + skirting
  G.add(box(w, 0.9, 0.05, M.panel(wainscot, 131), { y: 0, z: -d / 2 + 0.03, inkOpts: { hull: 0.008, edges: 30 } }));
  G.add(box(w, 0.06, 0.08, M.wood(wainscot, 132), { y: 0.9, z: -d / 2 + 0.05 }));
  return G;
}
function phone() {
  const g = new THREE.Group();
  const black = M.dark('#262222');
  g.add(box(0.24, 0.1, 0.2, black, { inkOpts: { hull: 0.006, edges: 30, thin: true } }));
  g.add(cyl(0.06, 0.06, 0.012, M.flat('#e9e2cf', 133), { y: 0.1, z: 0.03, seg: 16, inkOpts: { hull: 0.004, edges: 60, thin: true } }));
  const hs = box(0.3, 0.05, 0.06, black, { y: 0.12, z: -0.05, inkOpts: { hull: 0.006, edges: 30, thin: true } }); g.add(hs);
  return g;
}
function locOffice() {
  const G = room({ w: 6.4, d: 5.2, wall: M.wallpaper('#d8c9a3', '#c9b78e', 134), floor: M.wood('#8a6440', 135), ceil: '#cfc2a6' });
  // chalkboard on back wall
  const boardBase = chalkTex([{ text: 'WAGE OFFER', size: 92, y: 0.13 }], { w: 1400, h: 780, seed: 21 });
  const cb = chalkboard(2.7, 1.5, boardBase);
  const BY = 1.15;
  cb.position.set(-0.35, BY, -2.5); G.add(cb);
  const faceZ = -2.5 + 0.06;
  const l1 = chalkLine('+ R1,50', 1.45, 0.48, 200); l1.position.set(-1.55, BY + cb.userData.faceY + 0.12, faceZ + 0.003); G.add(l1);
  const strikeT = strokeTex('strike'); const st = revealPlane(strikeT, 1.5, 0.4); st.position.set(-1.6, BY + cb.userData.faceY + 0.12, faceZ + 0.006); G.add(st);
  const noT = labelTex({ w: 512, h: 256, bg: null, wearAmount: 0, lines: [{ text: 'NO', size: 190, font: HAND_FONT, color: '#f0b9a8' }] });
  const no = revealPlane(noT, 0.7, 0.35); no.position.set(0.1, BY + cb.userData.faceY + 0.14, faceZ + 0.004); G.add(no);
  const l2 = chalkLine('+ R2,07', 1.45, 0.48, 200); l2.position.set(-1.55, BY + cb.userData.faceY - 0.38, faceZ + 0.003); G.add(l2);
  const tickT = labelTex({ w: 256, h: 256, bg: null, wearAmount: 0, paint: (g) => { g.strokeStyle = '#b8e0a8'; g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.moveTo(40, 140); g.lineTo(100, 210); g.lineTo(220, 40); g.stroke(); } });
  const tick = revealPlane(tickT, 0.4, 0.4); tick.position.set(-0.4, BY + cb.userData.faceY - 0.38, faceZ + 0.004); G.add(tick);
  // picture frame + clock
  G.add(box(0.7, 0.55, 0.04, M.wood('#5a3a22', 136), { x: 1.85, y: 1.55, z: -2.58 }));
  G.add(plane(0.58, 0.43, M.flat('#9fb3a0', 137), { x: 1.85, y: 1.825, z: -2.555 }));
  const clockT = labelTex({ w: 256, h: 256, bg: '#f4ecd8', wearAmount: 0.2, paint: (g) => { g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 118, 0, 7); g.stroke(); g.lineWidth = 10; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 50); g.moveTo(128, 128); g.lineTo(180, 150); g.stroke(); } });
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.22, 32), M.label(clockT)); clock.position.set(1.85, 2.65, -2.55); G.add(clock);
  // desk
  const desk = new THREE.Group();
  const wood = M.wood('#6e4a2e', 138);
  desk.add(box(1.9, 0.07, 0.85, wood, { y: 0.74 }));
  desk.add(box(0.5, 0.74, 0.8, M.panel('#6e4a2e', 139), { x: -0.68 }));
  desk.add(box(0.5, 0.74, 0.8, M.panel('#6e4a2e', 139), { x: 0.68 }));
  desk.add(box(0.86, 0.5, 0.04, M.panel('#6e4a2e', 139), { y: 0.24, z: -0.3 }));
  const npT = labelTex({ w: 768, h: 160, bg: '#2c2420', fg: '#e9c96a', seed: 22, lines: [{ text: 'MANAGER', size: 120, y: 0.55, color: '#e9c96a', spacing: '10px' }] });
  const np = new THREE.Group();
  const npBox = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.62, 3), M.dark('#2c2420'), { inkOpts: { hull: 0.004, edges: 30, thin: true } });
  npBox.rotation.z = Math.PI / 2; npBox.rotation.x = 0.0; npBox.position.y = 0.04; np.add(npBox);
  np.add(plane(0.56, 0.08, M.label(npT), { y: 0.055, z: 0.035, rx: -0.52 }));
  np.position.set(0.1, 0.775, 0.3); desk.add(np);
  const ph = phone(); ph.position.set(-0.6, 0.775, 0.0); ph.rotation.y = 0.4; desk.add(ph);
  for (let i = 0; i < 3; i++) desk.add(box(0.32, 0.012, 0.42, M.paper('#f3ead2', 140 + i), { x: 0.5 + i * 0.03, y: 0.775 + i * 0.012, z: -0.05, ry: i * 0.12, inkOpts: { hull: 0, edges: 30, thin: true } }));
  desk.position.set(0.5, 0, -0.7);
  G.add(desk);
  // crown moulding and a pendant lamp
  G.add(box(6.4, 0.14, 0.14, M.flat('#efe4c8', 144), { y: 3.06, z: -2.53 }));
  G.add(cyl(0.01, 0.01, 0.75, M.dark('#2e2a28'), { x: 0.1, y: 2.45, z: -0.5, seg: 6, inkOpts: { hull: 0, edges: 0 } }));
  G.add(cyl(0.34, 0.1, 0.22, M.flat('#3f6a4a', 145), { x: 0.1, y: 2.25, z: -0.5, seg: 18 }));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), basic('#fff3c8')); bulb.position.set(0.1, 2.22, -0.5); G.add(bulb);
  // filing cabinet, coat stand (foreground), plant
  const fc = new THREE.Group();
  fc.add(box(0.55, 1.35, 0.6, M.flat('#6b7d74', 141)));
  for (let i = 0; i < 3; i++) fc.add(box(0.4, 0.04, 0.02, M.dark('#3a3a36'), { y: 0.3 + i * 0.42, z: 0.31, inkOpts: { hull: 0, edges: 30, thin: true } }));
  fc.position.set(2.6, 0, -2.1); G.add(fc);
  const cs = new THREE.Group();
  cs.add(cyl(0.035, 0.03, 1.9, M.wood('#4e3220', 142), { seg: 8 }));
  cs.add(cyl(0.25, 0.25, 0.04, M.wood('#4e3220', 142), { seg: 12 }));
  const coat = box(0.42, 0.75, 0.16, M.flat('#7a6a50', 143), { y: 0.95, x: 0.1 }); cs.add(coat);
  const hat = cyl(0.14, 0.12, 0.14, M.dark('#2e2a28'), { y: 1.86, x: 0.0, seg: 14 }); cs.add(hat);
  cs.position.set(2.0, 0, 2.2); G.add(cs);
  // people: boss behind desk, two worker representatives
  const boss = makeChar({ palette: 'boss', hat: 'none', glasses: true, seed: 330, face: 0 });
  boss.root.position.set(0.72, 0, -1.55); G.add(boss.root);
  const rep1 = makeChar({ palette: 'workerC', hat: 'cap', seed: 331, face: 0.4 });
  rep1.root.position.set(-1.55, 0, 0.35); G.add(rep1.root);
  const rep2 = makeChar({ palette: 'workerE', hat: 'none', seed: 332, face: 0.4 });
  rep2.root.position.set(-2.35, 0, -0.35); G.add(rep2.root);
  bakeEdges(G);
  const t1 = beat(5, 'one'), tNo = beat(5, 'no'), t2 = beat(5, 'two');
  return {
    group: G,
    update(t, cam) {
      l1.setReveal(smooth(t1 - 0.1, t1 + 0.7, t));
      l1.visible = t > t1 - 0.12;
      st.setReveal(smooth(tNo, tNo + 0.35, t)); st.visible = t > tNo;
      no.setReveal(smooth(tNo + 0.1, tNo + 0.45, t)); no.visible = t > tNo + 0.1;
      l2.setReveal(smooth(t2 - 0.2, t2 + 0.6, t)); l2.visible = t > t2 - 0.22;
      tick.setReveal(smooth(t2 + 0.65, t2 + 0.95, t)); tick.visible = t > t2 + 0.65;
      animChar(boss, t, cam, { point: smooth(t1 - 0.4, t1, t) * (1 - smooth(tNo - 0.2, tNo + 0.2, t)) * 0.7 });
      animChar(rep1, t, cam, { armUp: 0.35 * smooth(tNo - 0.3, tNo, t) * (1 - smooth(tNo + 0.9, tNo + 1.3, t)) });
      animChar(rep2, t, cam, {});
    },
  };
}

// ============ D: Frame textile mill ============
function locMill() {
  const G = new THREE.Group();
  const ground = plane(160, 120, M.concrete('#b9b0a0', 150), { rx: -Math.PI / 2, z: -10 });
  ground.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = i % 2 ? v * 120 : v * 160; });
  ground.receiveShadow = true; G.add(ground);
  // mill: long brick block, 3 floors of windows, big central door, saw-tooth roof
  const W = 44, H = 9.5;
  const wins = [];
  for (let fl = 0; fl < 3; fl++) for (let i = 0; i < 14; i++) {
    const x = -W / 2 + 1.6 + i * 3.0;
    if (fl === 0 && Math.abs(x) < 3.2) continue;
    wins.push({ type: 'window', x, y: 0.9 + fl * 2.9, w: 1.6, h: 1.9 });
  }
  wins.push({ type: 'door', x: 0, w: 4.2, h: 3.6 });
  const front = facade({ w: W, h: H, t: 0.45, mat: M.brick('#a2503a', 151), openings: wins, interior: '#5a4a3e', door: '#3c4e48' });
  front.position.z = -10; G.add(front);
  G.add(box(W, H, 24, M.brick('#9a4a36', 152), { z: -10.45 - 12, inkOpts: { hull: 0.04, edges: 30 } }));
  G.add(sawRoof(W, 24, 6, 2.6, M.corr('#7c8a86', 153), basic('#bcd3d6'), H).translateZ(-22.45));
  // open door shows the floor inside: looms (dark machines) under warm light
  const inside = new THREE.Group();
  inside.add(plane(4.2, 3.6, basic('#d9b98a'), { y: 1.8, z: -10.5 - 3 }));
  for (let i = 0; i < 3; i++) inside.add(box(1.0, 1.2, 0.8, M.dark('#3f3a34'), { x: -1.3 + i * 1.3, z: -10.5 - 1.6 }));
  G.add(inside);
  // painted name band
  const nameT = labelTex({ w: 2048, h: 300, bg: '#efe2c0', border: INK, seed: 31, lines: [{ text: 'FRAME TEXTILES', size: 230, y: 0.52, spacing: '22px' }] });
  const nameSign = signBoard({ w: 13, h: 1.9, texture: nameT, frame: '#4a3226', postH: 0 });
  nameSign.position.set(0, H - 2.25, -9.5); G.add(nameSign);
  // chimney + water tank
  const ch = chimney(26, 1.3, 0.9, M.brick('#a14d36', 154)); ch.position.set(17, 0, -26); G.add(ch);
  const tank = new THREE.Group();
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) tank.add(box(0.2, 6, 0.2, M.dark('#3e4848'), { x, z }));
  tank.add(cyl(1.6, 1.6, 2.6, M.flat('#8c9c96', 155), { y: 6, seg: 16 }));
  tank.position.set(-15, H, -18); G.add(tank);
  // fence + gate posts with chalkboard
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i++) G.add(box(0.12, 1.9, 0.12, M.dark('#3a4444'), { x: side * (3.4 + i * 1.8), z: -3.2, inkOpts: { hull: 0.006, edges: 30, thin: true } }));
    G.add(box(16.2, 0.07, 0.06, M.dark('#3a4444'), { x: side * (3.4 + 8), y: 1.75, z: -3.2 }));
    G.add(box(16.2, 0.07, 0.06, M.dark('#3a4444'), { x: side * (3.4 + 8), y: 0.4, z: -3.2 }));
    G.add(box(0.6, 2.6, 0.6, M.brick('#a2503a', 156), { x: side * 3.0, z: -3.2 }));
  }
  const outT = chalkTex([{ text: '6 000', size: 300, y: 0.42 }, { text: 'OUT', size: 210, y: 0.8 }], { w: 900, h: 760, seed: 33 });
  const board = chalkboard(1.2, 1.0, null);
  board.position.set(-3.0, 0.95, -2.86); G.add(board);
  const outLine = revealPlane(outT, 1.2, 1.0, { mat: new THREE.MeshBasicMaterial({ map: outT }) });
  outLine.position.set(-3.0 - 0.6, 0.95 + board.userData.faceY, -2.86 + 0.035); G.add(outLine);
  // street + lamp posts + houses across the road (behind camera mostly)
  for (const x of [-7, 7]) { const lp = lampPost(4.4); lp.position.set(x, 0, -2.6); G.add(lp); }
  G.add(hills({ w: 400, h: 20, seed: 7, color: '#a5b28d', z: -160 }));
  // workers streaming out of the gate toward camera/right
  const r = rng(44);
  const walkers = [];
  for (let i = 0; i < 40; i++) {
    const c = crowdChar(r);
    const lane = r();
    c.path = { x0: -1.8 + lane * 3.6, z0: -11 + r() * 1.5, x1: 0.2 + lane * 6.5 + r() * 1.2, z1: -2.4 + r() * 2.0, off: r() * 5.0 };
    walkers.push(c); G.add(c.root);
  }
  const standers = [];
  for (let i = 0; i < 14; i++) {
    const c = crowdChar(r);
    c.root.position.set(2.5 + r() * 5, 0, -2.4 + r() * 3.2);
    standers.push(c); G.add(c.root);
  }
  for (const [x, z, col] of [[-5.6, 2.4, '#6c7b5a'], [-5.0, 2.0, '#8a6a3a'], [-6.1, 1.8, '#5f6f78']]) { const b = barrel(col); b.position.set(x, 0, z); G.add(b); }
  bakeEdges(G);
  const t6 = beat(6, 'six');
  const T0 = beat(6, 'Within') - 2.5;
  return {
    group: G,
    update(t, cam) {
      walkers.forEach((c) => {
        const p = clamp((t - T0 + c.path.off) / 6.5, 0, 1);
        c.root.position.set(lerp(c.path.x0, c.path.x1, p), 0, lerp(c.path.z0, c.path.z1, p));
        c.root.visible = p > 0.0;
        animChar(c, t, cam, { walking: p < 1 ? 1 : 0 });
      });
      standers.forEach((c) => animChar(c, t, cam, {}));
      outLine.setReveal(smooth(t6 - 0.1, t6 + 0.7, t));
      outLine.visible = t > t6 - 0.12;
    },
  };
}

// ============ E: map room (Durban, 1973) ============
function locMapRoom() {
  const G = room({ w: 7, d: 6, h: 3.4, wall: M.plaster('#c9c0a6', 160), floor: M.wood('#6a4a32', 161), windowSide: 'right', wainscot: '#4e3a2a' });
  // table
  const table = new THREE.Group();
  table.add(box(4.2, 0.1, 2.8, M.wood('#5c3c24', 162), { y: 0.82 }));
  for (const [x, z] of [[-1.9, -1.2], [1.9, -1.2], [-1.9, 1.2], [1.9, 1.2]]) table.add(box(0.14, 0.82, 0.14, M.wood('#4c3220', 163), { x, z }));
  G.add(table);
  // the map: sea + land with a bay, roads, blocks
  const mapT = labelTex({ w: 2048, h: 1366, bg: '#7fa9b8', wearAmount: 0.4, seed: 41, paint: (g, w, h) => {
    // sea waves
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 4;
    for (let i = 0; i < 40; i++) { const x = w * 0.72 + (i % 5) * 90, y = 60 + i * 34; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 20, y - 12, x + 40, y); g.stroke(); }
    // land
    g.fillStyle = '#e4d6ae';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.74, 0); g.bezierCurveTo(w * 0.72, h * 0.25, w * 0.7, h * 0.4, w * 0.64, h * 0.52);
    g.bezierCurveTo(w * 0.52, h * 0.5, w * 0.45, h * 0.58, w * 0.48, h * 0.7); g.bezierCurveTo(w * 0.56, h * 0.76, w * 0.66, h * 0.66, w * 0.7, h * 0.62);
    g.bezierCurveTo(w * 0.74, h * 0.75, w * 0.76, h * 0.9, w * 0.8, h); g.lineTo(0, h); g.closePath(); g.fill();
    g.strokeStyle = INK; g.lineWidth = 6; g.stroke();
    // green hills inland
    g.fillStyle = 'rgba(140,170,110,0.5)';
    for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(120 + i * 110, 200 + (i % 3) * 300, 90, 60, 0.3, 0, 7); g.fill(); }
    // roads
    g.strokeStyle = 'rgba(120,80,50,0.7)'; g.lineWidth = 8;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, 150 + i * 200); g.bezierCurveTo(w * 0.3, 120 + i * 210, w * 0.45, 200 + i * 180, w * 0.66, 160 + i * 190); g.stroke(); }
    g.font = `italic 64px ${HAND_FONT}`; g.fillStyle = 'rgba(255,255,255,0.8)'; g.textAlign = 'center';
    g.fillText('INDIAN OCEAN', w * 0.86, h * 0.45);
    g.fillStyle = 'rgba(40,70,90,0.8)'; g.font = `48px ${HAND_FONT}`; g.fillText('BAY', w * 0.56, h * 0.62);
    // title cartouche
    g.fillStyle = '#f2e8cf'; g.fillRect(w * 0.5 - 470, h - 290, 940, 240); g.strokeStyle = INK; g.lineWidth = 10; g.strokeRect(w * 0.5 - 470, h - 290, 940, 240);
    g.fillStyle = INK; g.font = `210px ${SIGN_FONT}`; g.textBaseline = 'middle'; g.fillText('DURBAN 1973', w * 0.5, h - 165);
  } });
  const map = plane(4.0, 2.65, M.label(mapT), { rx: -Math.PI / 2, y: 0.926 });
  map.receiveShadow = true;
  G.add(map);
  // city blocks on the map
  const r = rng(12);
  for (let i = 0; i < 26; i++) {
    const x = -1.9 + r() * 2.6, z = -1.2 + r() * 1.5;
    if (x > 0.5 && z > -0.2) continue;
    G.add(box(0.08 + r() * 0.08, 0.04 + r() * 0.08, 0.08 + r() * 0.08, M.plaster('#efe2c4', 164), { x, y: 0.926, z, inkOpts: { hull: 0.003, edges: 30, thin: true } }));
  }
  // factory pins (light up one by one)
  const pins = [];
  const pinR = rng(8);
  const off = new THREE.MeshToonMaterial({ gradientMap: GRAD, color: '#9a8f80' });
  for (let i = 0; i < 34; i++) {
    let x, z;
    do { x = -1.85 + pinR() * 2.9; z = -1.25 + pinR() * 2.0; } while ((x > 0.55 && z > -0.3) || (x < -0.9 && z > 0.55));
    const pin = new THREE.Group();
    pin.add(cyl(0.03, 0.02, 0.18, M.dark('#3a3030'), { seg: 6, inkOpts: { hull: 0.004, edges: 60, thin: true } }));
    const flagMat = new THREE.MeshToonMaterial({ gradientMap: GRAD, color: '#7d7468', emissive: '#000000' });
    const flag = box(0.12, 0.08, 0.012, flagMat, { y: 0.16, x: 0.06, inkOpts: { hull: 0.003, edges: 30, dynamic: true, thin: true } });
    pin.add(flag);
    pin.position.set(x, 0.926, z);
    pin.userData.mat = flagMat;
    pin.userData.t = 0;
    G.add(pin); pins.push(pin);
  }
  // order pins roughly from the brickworks outward
  pins.sort((a, b) => Math.hypot(a.position.x + 0.6, a.position.z) - Math.hypot(b.position.x + 0.6, b.position.z));
  // tally board on the back wall
  const tb = chalkboard(2.9, 1.35, chalkTex([{ text: 'ON STRIKE', size: 96, y: 0.14 }], { w: 1400, h: 650, seed: 42 }));
  tb.position.set(0, 1.45, -2.95); G.add(tb);
  const wT = chalkLine('60 000+ workers', 2.7, 0.5, 170); wT.position.set(-1.35, 1.45 + tb.userData.faceY + 0.04, -2.95 + 0.035); G.add(wT);
  const fT = chalkLine('100+ firms', 2.0, 0.5, 170); fT.position.set(-1.35, 1.45 + tb.userData.faceY - 0.42, -2.95 + 0.035); G.add(fT);
  // hanging lamp over table
  // two people at the table edge (left)
  const a = makeChar({ palette: 'official', hat: 'none', glasses: true, seed: 520, face: 0.3 });
  a.root.position.set(-2.6, 0, -0.9); G.add(a.root);
  const b = makeChar({ palette: 'workerF', hat: 'none', seed: 521, face: 0.3 });
  b.root.position.set(-2.9, 0, 0.5); G.add(b.root);
  bakeEdges(G);
  const tStart = beat(7, 'By'), t60 = beat(7, 'sixty'), t100 = beat(7, 'hundred'), tEnd = beat(7, 'tools');
  return {
    group: G,
    update(t, cam) {
      pins.forEach((p, i) => {
        const ti = lerp(tStart + 0.2, tEnd - 0.3, i / pins.length);
        const on = smooth(ti, ti + 0.25, t);
        p.userData.mat.color.set(on > 0.5 ? '#d23a2a' : '#7d7468');
        p.userData.mat.emissive.set(on > 0.5 ? '#5a1008' : '#000000');
        p.scale.setScalar(1 + 0.6 * Math.sin(Math.PI * on) + 0.25 * on);
      });
      wT.setReveal(smooth(t60 - 0.1, t60 + 0.8, t)); wT.visible = t > t60 - 0.12;
      fT.setReveal(smooth(t100 - 0.1, t100 + 0.6, t)); fT.visible = t > t100 - 0.12;
      animChar(a, t, cam, { point: 0.5 }); animChar(b, t, cam, {});
    },
  };
}

// ============ F: government office (1979 report) ============
function locGovOffice() {
  const G = room({ w: 6.4, d: 5.4, h: 3.4, wall: M.panel('#7d5636', 170), floor: M.wood('#5c3e28', 171), windowSide: 'left', wainscot: '#4e3422' });
  // bookshelf
  const shelf = new THREE.Group();
  shelf.add(box(2.2, 2.4, 0.4, M.wood('#4e3220', 172)));
  const r = rng(3);
  for (let row = 0; row < 4; row++) for (let i = 0; i < 9; i++) {
    const h = 0.28 + r() * 0.12;
    shelf.add(box(0.18 + r() * 0.06, h, 0.3, M.flat(['#7a2f2a', '#2f4a5e', '#5e6a3a', '#a07a3a', '#3a3a3a'][Math.floor(r() * 5)], 173 + (i % 5)), { x: -0.9 + i * 0.22, y: 0.1 + row * 0.58, z: 0.08, inkOpts: { hull: 0.004, edges: 30, thin: true } }));
  }
  shelf.position.set(1.7, 0, -2.45); G.add(shelf);
  // desk
  const desk = new THREE.Group();
  desk.add(box(2.0, 0.07, 1.0, M.wood('#5a3a22', 174), { y: 0.76 }));
  desk.add(box(0.55, 0.76, 0.9, M.panel('#5a3a22', 175), { x: -0.7 }));
  desk.add(box(0.55, 0.76, 0.9, M.panel('#5a3a22', 175), { x: 0.7 }));
  desk.add(box(1.6, 0.012, 0.8, M.flat('#3f5a42', 176), { y: 0.83, inkOpts: { hull: 0, edges: 30, thin: true } })); // leather pad
  desk.position.set(0, 0, -0.6); G.add(desk);
  // report folder (title readable)
  const repT = labelTex({ w: 900, h: 1200, bg: '#c9b48a', seed: 51, border: '#5a3a22', lines: [
    { text: 'REPORT', size: 120, y: 0.16, color: '#5a3a22' },
    { text: 'WIEHAHN', size: 210, y: 0.4, color: INK }, { text: 'COMMISSION', size: 150, y: 0.55, color: INK },
    { text: '1979', size: 220, y: 0.8, color: '#8a2a22' },
  ] });
  const folder = new THREE.Group();
  folder.add(box(0.64, 0.03, 0.84, M.flat('#b8a278', 177), { inkOpts: { hull: 0.004, edges: 30, thin: true } }));
  folder.add(plane(0.62, 0.82, M.label(repT), { rx: -Math.PI / 2, y: 0.032 }));
  folder.position.set(-0.36, 0.84, -0.32); folder.rotation.y = 0.1; G.add(folder);
  // a page and the stamp
  const pageT = labelTex({ w: 700, h: 900, bg: '#f5eedb', seed: 52, wearAmount: 0.2, paint: (g, w, h) => {
    g.fillStyle = hexA(INK, 0.5); for (let i = 0; i < 12; i++) g.fillRect(60, 80 + i * 44, w - 120 - (i % 3) * 80, 12);
    g.font = `46px ${SIGN_FONT}`; g.fillStyle = INK; g.textAlign = 'left'; g.fillText('BLACK TRADE UNIONS', 60, 50);
  } });
  const page = plane(0.42, 0.54, M.label(pageT), { rx: -Math.PI / 2, x: 0.38, y: 0.842, z: -0.45, rz: -0.08 });
  G.add(page);
  const stampT = labelTex({ w: 800, h: 260, bg: null, wearAmount: 0, paint: (g, w, h) => {
    g.strokeStyle = '#b3261e'; g.lineWidth = 16; g.strokeRect(20, 20, w - 40, h - 40);
    g.fillStyle = '#b3261e'; g.font = `150px ${SIGN_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('RECOGNISED', w / 2, h / 2 + 6);
    const rr = rng(9); g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(0,0,0,${0.3 + rr() * 0.6})`; g.fillRect(rr() * w, rr() * h, 3 + rr() * 6, 2 + rr() * 4); }
  } });
  const print = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.13), new THREE.MeshBasicMaterial({ map: stampT, transparent: true, depthWrite: false }));
  print.rotation.x = -Math.PI / 2; print.rotation.z = 0.12; print.position.set(0.38, 0.8445, -0.36); G.add(print);
  const stamp = new THREE.Group();
  stamp.add(box(0.36, 0.05, 0.13, M.dark('#3a2a26'), { inkOpts: { hull: 0.005, edges: 30, dynamic: true } }));
  stamp.add(box(0.07, 0.12, 0.07, M.wood('#7a4f2e', 178), { y: 0.05, inkOpts: { hull: 0.005, edges: 30, dynamic: true } }));
  stamp.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), M.wood('#7a4f2e', 178)).translateY(0.2));
  G.add(stamp);
  // ink pad, pen, lamp
  G.add(box(0.2, 0.025, 0.14, M.dark('#2a2a32'), { x: 0.85, y: 0.83, z: -0.7 }));
  const lamp = new THREE.Group();
  lamp.add(cyl(0.1, 0.1, 0.03, M.flat('#c9a24a', 179), { seg: 12 }));
  lamp.add(cyl(0.015, 0.015, 0.4, M.flat('#c9a24a', 179), { seg: 6 }));
  lamp.add(cyl(0.16, 0.06, 0.14, M.flat('#3f6a4a', 180), { y: 0.38, seg: 14 }));
  lamp.position.set(-0.85, 0.8, -0.85); G.add(lamp);
  const off = makeChar({ palette: 'official', hat: 'none', glasses: true, seed: 610, face: 0 });
  off.root.position.set(0.2, 0, -1.45); G.add(off.root);
  bakeEdges(G);
  const tRec = beat(9, 'recognised');
  return {
    group: G,
    update(t, cam) {
      // stamp: hovers, comes down on "recognised", lifts to reveal the print
      const down = smooth(tRec - 0.35, tRec, t), up = smooth(tRec + 0.15, tRec + 0.6, t);
      const y = 0.844 + 0.025 + 0.25 * (1 - down) + 0.3 * up;
      stamp.position.set(0.38 + 0.12 * (1 - down) - 0.0 * up + 0.15 * up, y, -0.36 + 0.1 * (1 - down) - 0.1 * up);
      stamp.rotation.y = 0.12;
      print.visible = t > tRec + 0.02;
      animChar(off, t, cam, { armUp: 0.15 * (1 - up) * down });
    },
  };
}

export function buildWorld() {
  const scene = new THREE.Scene();
  const locs = {
    A: locBrickworks(), B: locStadium(), C: locOffice(), D: locMill(), E: locMapRoom(), F: locGovOffice(),
  };
  for (const [k, L] of Object.entries(locs)) { L.group.position.x = LOC[k]; scene.add(L.group); }
  const sky = skyDome();
  scene.add(sky);
  // lights
  const hemi = new THREE.HemisphereLight('#fff2dc', '#7a6a58', 1.6);
  scene.add(hemi);
  const key = new THREE.DirectionalLight('#ffe2b8', 2.6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03;
  const sc = key.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 16; sc.bottom = -16; sc.near = 1; sc.far = 120;
  scene.add(key); scene.add(key.target);
  const lamp = new THREE.PointLight('#ffd9a0', 0, 9, 1.6);
  scene.add(lamp);
  scene.fog = new THREE.Fog('#e8d6b6', 30, 160);
  return { scene, locs, sky, hemi, key, lamp };
}
