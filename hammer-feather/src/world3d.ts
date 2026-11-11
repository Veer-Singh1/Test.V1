// The 3D world: grey objects on a black void (the kit's palette, in three dimensions).
// Three places along x: the Moon (x = 0), a park on Earth (x = 40..45) and a vacuum chamber (x = -40).
import * as THREE from 'three';
import { C } from './style';

const std = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, flatShading: true, ...extra });
const M = { suit: std('#f2f2f2'), dark: std('#1c1c1c', { roughness: 0.4 }), person: std('#8f8f8f'), moon: std('#565656'), moonDark: std('#3a3a3a'), park: std('#4a4a4a'), steel: std('#9a9a9a', { roughness: 0.6, metalness: 0.2 }), light: std('#e6e6e6'), ball: std('#2e2e2e', { roughness: 0.35 }), rock: std('#8a8a8a', { flatShading: true }), white: new THREE.MeshBasicMaterial({ color: C.white }), rib: std('#3a3a3a') };
const mesh = (g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o; };
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, m: THREE.Material) {
  const o = mesh(new THREE.CapsuleGeometry(r, a.distanceTo(b), 1, 6), m);
  o.position.copy(a).add(b).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); return o;
}
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export const HAND_L = V(-0.42, 1.28, 0.55), HAND_R = V(0.42, 1.28, 0.55);

function human(astronaut: boolean) {
  const g = new THREE.Group(), m = astronaut ? M.suit : M.person;
  g.add(limb(V(-0.15, 0.12, 0), V(-0.15, 0.82, 0), 0.12, m), limb(V(0.15, 0.12, 0), V(0.15, 0.82, 0), 0.12, m));
  g.add(mesh(new THREE.BoxGeometry(0.26, 0.14, 0.4), astronaut ? M.steel : M.dark, -0.15, 0.07, 0.05), mesh(new THREE.BoxGeometry(0.26, 0.14, 0.4), astronaut ? M.steel : M.dark, 0.15, 0.07, 0.05));
  g.add(mesh(new THREE.CapsuleGeometry(0.29, 0.32, 1, 7), m, 0, 1.12, 0));
  g.add(limb(V(-0.36, 1.32, 0), V(-0.44, 1.22, 0.28), 0.09, m), limb(V(-0.44, 1.22, 0.28), HAND_L, 0.085, m));
  g.add(limb(V(0.36, 1.32, 0), V(0.44, 1.22, 0.28), 0.09, m), limb(V(0.44, 1.22, 0.28), HAND_R, 0.085, m));
  g.add(mesh(new THREE.IcosahedronGeometry(0.1, 0), astronaut ? M.steel : m, HAND_L.x, HAND_L.y, HAND_L.z), mesh(new THREE.IcosahedronGeometry(0.1, 0), astronaut ? M.steel : m, HAND_R.x, HAND_R.y, HAND_R.z));
  g.add(mesh(new THREE.IcosahedronGeometry(astronaut ? 0.27 : 0.21, 1), m, 0, astronaut ? 1.68 : 1.66, 0));
  if (astronaut) {
    g.add(mesh(new THREE.IcosahedronGeometry(0.21, 1), M.dark, 0, 1.68, 0.1));
    g.add(mesh(new THREE.BoxGeometry(0.56, 0.7, 0.26), M.light, 0, 1.2, -0.34));
    g.add(mesh(new THREE.BoxGeometry(0.3, 0.2, 0.12), M.steel, 0, 1.12, 0.3));
  }
  return g;
}
export function hammer() { // held by the handle, head up
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.56, 6), M.steel, 0, 0, 0));
  g.add(mesh(new THREE.BoxGeometry(0.26, 0.1, 0.1), M.light, 0, 0.3, 0));
  return g;
}
function featherShape() {
  const s = new THREE.Shape(); s.moveTo(0, -0.2); s.bezierCurveTo(0.13, -0.1, 0.12, 0.22, 0, 0.36); s.bezierCurveTo(-0.12, 0.22, -0.13, -0.1, 0, -0.2);
  return new THREE.ShapeGeometry(s, 3);
}
export function feather() {
  const g = new THREE.Group();
  const vane = new THREE.Mesh(featherShape(), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, side: THREE.DoubleSide })); vane.castShadow = true;
  g.add(vane, mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.66, 6), M.light, 0, 0.03, 0.002));
  return g;
}
function bowlingBall(r = 0.24) {
  const g = new THREE.Group(); g.add(mesh(new THREE.IcosahedronGeometry(r, 1), M.ball));
  [[-0.05, 0.17, 0.15], [0.05, 0.17, 0.15], [0, 0.1, 0.21]].forEach(([x, y, z]) => g.add(mesh(new THREE.IcosahedronGeometry(0.03, 0), M.dark, x * r / 0.24, y * r / 0.24, z * r / 0.24)));
  return g;
}
function ring() { const o = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 64), new THREE.MeshBasicMaterial({ color: C.white, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })); o.rotation.x = -Math.PI / 2; o.position.y = 0.02; return o; }
function arrow() { // points down, length 1 (scale y), origin at its tail
  const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: C.white, transparent: true });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1, 10), mat); shaft.position.y = -0.5;
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 6), mat); head.rotation.x = Math.PI; head.position.y = -1.08;
  g.add(shaft, head); (g as any).shaft = shaft; (g as any).head = head; (g as any).mat = mat; return g;
}
const hsh = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

export const X_PARK = 40, X_AIR = 44.5, X_CH = -40, CH_TOP = 9.5;
export function buildWorld() {
  const root = new THREE.Group();
  // ----- the Moon -----
  const tg = new THREE.PlaneGeometry(56, 90, 24, 38); tg.rotateX(-Math.PI / 2);
  const tp = tg.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i) + (hsh(i + 1) - 0.5) * 1.6, z = tp.getZ(i) + (hsh(i + 2) - 0.5) * 1.6, d = Math.hypot(x, z);
    const k = Math.min(1, Math.max(0, (d - 4) / 10));
    tp.setXYZ(i, x, k * ((hsh(i + 3) - 0.5) * 0.5 + 0.9 * Math.sin(x * 0.21) * Math.cos(z * 0.17)) - (z < -14 ? 0 : 0), z);
  }
  tg.computeVertexNormals();
  const moon = mesh(tg, M.moon); moon.castShadow = false; root.add(moon);
  for (let i = 0; i < 26; i++) {
    const a = hsh(i) * 6.28, d = 3 + hsh(i + 50) * 30, r = 0.5 + hsh(i + 90) * 2.2;
    const rim = mesh(new THREE.TorusGeometry(r, 0.07 + r * 0.04, 4, 9), M.moon, Math.cos(a) * d, 0.01, Math.sin(a) * d - 8); rim.rotation.x = Math.PI / 2; rim.scale.z = 0.5; root.add(rim);
    const pit = mesh(new THREE.CircleGeometry(r * 0.96, 9), M.moonDark, Math.cos(a) * d, 0.006, Math.sin(a) * d - 8); pit.rotation.x = -Math.PI / 2; pit.castShadow = false; root.add(pit);
  }
  for (let i = 0; i < 40; i++) { const a = hsh(i + 200) * 6.28, d = 2.5 + hsh(i + 260) * 22, s = 0.05 + hsh(i + 300) * 0.16; root.add(mesh(new THREE.IcosahedronGeometry(s, 0), M.rock, Math.cos(a) * d, s * 0.5, Math.sin(a) * d - 4)); }
  const astronaut = human(true); root.add(astronaut);
  const earth = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 1), std('#d8d8d8', { roughness: 1 })); earth.position.set(-7, 10.5, -34); root.add(earth);
  const sp: number[] = []; for (let i = 0; i < 500; i++) { const a = hsh(i + 700) * 6.28, e = 0.05 + hsh(i + 900) * 1.3; sp.push(Math.cos(a) * Math.cos(e) * 200, Math.sin(e) * 200, Math.sin(a) * Math.cos(e) * 200 - 0); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  root.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#9a9a9a', size: 1.6, sizeAttenuation: false })));
  const H = hammer(), Fe = feather(); root.add(H, Fe);
  // ----- the park on Earth -----
  const park = mesh(new THREE.CircleGeometry(11, 10), M.park, 42, 0, 0); park.rotation.x = -Math.PI / 2; park.castShadow = false; root.add(park);
  const tree = new THREE.Group(); tree.add(mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.6, 6), M.person, 0, 0.8, 0), mesh(new THREE.IcosahedronGeometry(1.1, 1), std('#7a7a7a', { flatShading: true }), 0, 2.4, 0)); tree.position.set(X_PARK + 1.5, 0, -3.2); root.add(tree);
  const watcher = human(false); watcher.position.set(X_PARK - 0.2, 0, -1.6); root.add(watcher);
  const ball = bowlingBall(), rock = mesh(new THREE.IcosahedronGeometry(0.22, 0), M.rock);
  const leaf = new THREE.Mesh(featherShape(), new THREE.MeshStandardMaterial({ color: '#cfcfcf', side: THREE.DoubleSide, roughness: 1 })); leaf.castShadow = true; leaf.scale.set(1.5, 0.8, 1);
  root.add(ball, rock, leaf);
  const dropper = human(false); dropper.position.set(X_AIR, 0, 0); root.add(dropper);
  const H2 = hammer(), F2 = feather(); root.add(H2, F2);
  const air = new THREE.Group(); const airMat = new THREE.MeshBasicMaterial({ color: C.ash, transparent: true, opacity: 0 });
  const airPts: THREE.Mesh[] = [];
  for (let i = 0; i < 150; i++) { const o = new THREE.Mesh(new THREE.IcosahedronGeometry(0.022, 0), airMat); (o as any).base = V(X_AIR - 1.5 + hsh(i + 11) * 3, 0.1 + hsh(i + 31) * 1.9, 0.15 + hsh(i + 51) * 0.8); airPts.push(o); air.add(o); }
  root.add(air);
  // ----- the vacuum chamber -----
  const ch = new THREE.Group(); ch.position.x = X_CH;
  const floor = mesh(new THREE.CircleGeometry(9, 12), std('#444444')); floor.rotation.x = -Math.PI / 2; floor.castShadow = false; ch.add(floor);
  for (let i = 0; i < 20; i++) { const a = Math.PI + (i / 19) * Math.PI; ch.add(mesh(new THREE.BoxGeometry(0.22, 13, 0.22), M.rib, Math.cos(a) * 8.6, 6.5, Math.sin(a) * 8.6)); }
  for (const y of [0.3, 3.5, 6.8, 10.1, 13]) { const r = mesh(new THREE.TorusGeometry(8.6, 0.12, 4, 19, Math.PI), M.rib, 0, y, 0); r.rotation.x = Math.PI / 2; r.rotation.z = Math.PI; r.rotation.y = 0; ch.add(r); }
  ch.add(mesh(new THREE.BoxGeometry(6, 0.25, 0.25), M.steel, 0, CH_TOP + 0.9, 0), mesh(new THREE.BoxGeometry(0.12, 0.6, 0.12), M.steel, -1, CH_TOP + 0.55, 0), mesh(new THREE.BoxGeometry(0.12, 0.6, 0.12), M.steel, 1, CH_TOP + 0.55, 0));
  root.add(ch);
  const ball2 = bowlingBall(0.3); const pile = new THREE.Group();
  for (let i = 0; i < 7; i++) { const f = feather(); f.position.set((hsh(i + 5) - 0.5) * 0.35, (hsh(i + 15) - 0.5) * 0.12, (hsh(i + 25) - 0.5) * 0.3); f.rotation.set(hsh(i) * 3, hsh(i + 3) * 3, hsh(i + 6) * 3); pile.add(f); }
  root.add(ball2, pile);
  // ----- helpers -----
  const rings = [ring(), ring(), ring(), ring(), ring(), ring()]; rings.forEach((r) => root.add(r));
  const aH = arrow(), aF = arrow(); root.add(aH, aF);
  // ----- lights: one hard sun, a little fill -----
  const key = new THREE.DirectionalLight('#ffffff', 2.6); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -12, right: 12, top: 16, bottom: -6, near: 1, far: 90 }); key.shadow.bias = -0.0005;
  root.add(key, key.target, new THREE.AmbientLight('#ffffff', 0.32));
  return { root, astronaut, H, Fe, ball, rock, leaf, H2, F2, airPts, airMat, ball2, pile, rings, aH, aF, key, earth };
}
