// "The hammer and the feather": a low-poly 3D world, one continuous camera, timed with at('word').
import React, { useMemo, useRef } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { C, FONT, SAFE, TYPE, VIDEO } from './style';
import { END, at, clamp, easeInOut, easeOut, lerp, pop, ramp, win } from './timeline';
import { Counter, Stamp } from './kit/Hud';
import { CH_TOP, HAND_L, HAND_R, X_AIR, X_CH, X_PARK, buildWorld } from './world3d';

const T = {
  dropped: at('dropped'), idea: at('idea'), fell: at('fell'), most: at('most'), obvious: at('obvious.'),
  ball: at('bowling', 0), rock: at('rock.'), leaf: at('leaf'), park: at('park.'), but: at('but', 0),
  earth: at('earth,', 0), air: at('air', 0), falls: at('falls.'), catches: at('catches'), barely: at('barely'),
  moon: at('moon', 1), no: at('no'), commander: at('commander'), held: at('held'), go: at('go.'),
  same: at('same', 0), wait: at('wait.'), pulls: at('pulls'), why: at('why'), because: at('because'), harder2: at('harder', 1),
  cancel: at('cancel'), exactly: at('exactly.'), free: at('free'), take: at('take'), scientists: at('scientists'),
  vacuum: at('vacuum'), ball2: at('bowling', 1), landing: at('landing'), aristotle: at('aristotle'), visited: at('visited'),
};
const G_MOON = 1.62, G_EARTH = 9.81, HAND_Y = 1.28;
const fallT = (h: number, g: number) => Math.sqrt((2 * h) / g);
const DROP1 = T.dropped, DROP2 = T.go + 0.05, DROP3 = T.free + 0.05, HOVER = 1.25;
const MOON_FALL = fallT(HAND_Y - 0.08, G_MOON);
const CH_DROP = T.landing - 0.15, CH_FALL = fallT(CH_TOP - 0.3, G_EARTH);

// ---------- camera: eased moves between poses, with a slow breathing drift that repeats over the loop ----------
type Pose = { t: number; p: [number, number, number]; l: [number, number, number]; d?: number };
const P0: Pose = { t: 0, p: [0.5, 1.7, 6.0], l: [0, 1.45, 0] };
const POSES: Pose[] = [
  P0,
  { t: DROP1 + 0.2, p: [1.2, 1.1, 5.0], l: [0, 1.15, 0.3], d: 1.2 },
  { t: T.most - 0.55, p: [X_PARK, 1.3, 6.2], l: [X_PARK, 1.5, 0.6], d: 1.5 },
  { t: T.but - 0.1, p: [X_AIR + 0.4, 1.4, 5.6], l: [X_AIR, 1.4, 0.3], d: 1.4 },
  { t: T.moon - 0.5, p: [-0.5, 1.6, 5.6], l: [0, 1.45, 0.2], d: 1.5 },
  { t: T.go - 0.5, p: [0.3, 1.0, 4.8], l: [0, 1.15, 0.4], d: 1.0 },
  { t: T.wait - 0.2, p: [0, 1.25, 3.6], l: [0, 1.3, 0.5], d: 1.0 },
  { t: T.take - 0.1, p: [2.6, 1.6, 7.0], l: [0, 1.4, 0], d: 1.3 },
  { t: T.scientists - 0.3, p: [X_CH, 3.2, 17], l: [X_CH, 5.6, 0], d: 1.6 },
  { t: T.ball2 - 0.4, p: [X_CH, 2.0, 12], l: [X_CH, 8.6, 0], d: 1.2 },
  { t: CH_DROP + 0.1, p: [X_CH, 1.6, 10.5], l: [X_CH, 1.2, 0], d: CH_FALL },
  { t: T.aristotle - 0.4, p: [1.4, 2.0, 7.4], l: [0, 1.9, 0], d: 1.5 },
  { t: END - 2.2, p: P0.p, l: P0.l, d: 2.0 },
];
function cameraAt(t: number) {
  let i = 0; while (i + 1 < POSES.length && POSES[i + 1].t <= t) i++;
  const k = POSES[i], prev = POSES[Math.max(0, i - 1)];
  const u = i === 0 ? 1 : easeInOut((t - k.t) / (k.d || 1.2));
  const w = (2 * Math.PI * t) / END;
  const p = k.p.map((v, j) => lerp(prev.p[j], v, u)) as number[], l = k.l.map((v, j) => lerp(prev.l[j], v, u)) as number[];
  const dist = Math.hypot(p[0] - l[0], p[2] - l[2]);
  return { p: [p[0] + 0.035 * dist * Math.sin(w * 9), p[1] + 0.012 * dist * Math.sin(w * 7), p[2] * 1 - 0.03 * dist * (1 - Math.cos(w * 11)) / 2], l };
}

// ---------- animation of everything in the world ----------
function animate(w: ReturnType<typeof buildWorld>, t: number) {
  const fall = (t0: number, h0: number, g: number, floor: number) => Math.max(floor, h0 - 0.5 * g * Math.max(0, t - t0) ** 2);
  const landed = (t0: number, h0: number, g: number, floor: number) => t >= t0 + fallT(h0 - floor, g);
  let ringI = 0;
  const ring = (x: number, z: number, t0: number, color = C.white, size = 1) => { const r = w.rings[ringI++]; const q = clamp((t - t0) / 0.7, 0, 1); r.position.set(x, 0.03, z); r.scale.setScalar(0.2 + 1.5 * size * easeOut(q)); (r.material as THREE.MeshBasicMaterial).opacity = q > 0 && q < 1 ? 1 - q : 0; (r.material as THREE.MeshBasicMaterial).color.set(color); };

  // --- the Moon: hammer (left hand) and feather (right hand) ---
  let hy = HAND_Y, lie = 0, hover = 0;
  if (t >= DROP1 && t < 8.6) { hy = fall(DROP1, HAND_Y, G_MOON, 0.08); lie = landed(DROP1, HAND_Y, G_MOON, 0.08) ? ramp(t, DROP1 + MOON_FALL, DROP1 + MOON_FALL + 0.2) : 0; }
  else if (t >= DROP2 && t < T.wait - 0.1) { hy = fall(DROP2, HAND_Y, G_MOON, 0.08); lie = ramp(t, DROP2 + MOON_FALL, DROP2 + MOON_FALL + 0.2); }
  else if (t >= T.wait - 0.1 && t < DROP3) { const u = easeInOut(ramp(t, T.wait - 0.1, T.wait + 0.6)); hy = lerp(0.08, HOVER, u); lie = 1 - u; hover = u; }
  else if (t >= DROP3 && t < T.scientists + 1.5) { hy = fall(DROP3, HOVER, G_MOON, 0.08); lie = ramp(t, DROP3 + fallT(HOVER - 0.08, G_MOON), DROP3 + fallT(HOVER - 0.08, G_MOON) + 0.2); }
  const bob = hover * 0.02 * Math.sin(t * 3);
  w.H.position.set(HAND_L.x, hy + 0.12 * (1 - lie) + bob, HAND_L.z + 0.05); w.H.rotation.set(0, 0.3, (lie * Math.PI) / 2); w.H.scale.setScalar(1.25);
  w.Fe.position.set(HAND_R.x, hy + 0.1 * (1 - lie) - bob, HAND_R.z + 0.05); w.Fe.rotation.set((lie * -Math.PI) / 2, 0.4, 0.15 * (1 - lie)); w.Fe.scale.setScalar(1.15);
  w.astronaut.rotation.y = 0.04 * Math.sin(t * 0.8);
  ring(HAND_L.x, HAND_L.z, DROP1 + MOON_FALL); ring(HAND_R.x, HAND_R.z, DROP2 + MOON_FALL);
  ring(0, HAND_L.z, DROP3 + fallT(HOVER - 0.08, G_MOON), C.volt, 1.6);
  // force arrows (the pull of gravity): 44 times bigger on the hammer
  const aOn = win(t, T.pulls - 0.1, T.free - 0.1, 0.2), grow = easeOut(ramp(t, T.pulls - 0.1, T.pulls + 0.4));
  [[w.aH, HAND_L.x, 0.62], [w.aF, HAND_R.x, 0.1]].forEach(([a, x, len]: any) => {
    a.visible = aOn > 0.01; a.position.set(x, hy - 0.22, HAND_L.z + 0.05); a.shaft.scale.y = len * grow; a.shaft.position.y = (-len * grow) / 2; a.head.position.y = -len * grow - 0.08; a.mat.opacity = aOn;
  });
  w.earth.rotation.y = t * 0.05;

  // --- the park: three everyday falls ---
  const drop = (o: THREE.Object3D, x: number, t0: number, r: number, h = 2.1) => { const s = pop(t, t0 - 0.35, 0.3); o.scale.setScalar(Math.max(0.001, s)); o.position.set(x, fall(t0, h, G_EARTH, r), 0.6); };
  drop(w.ball, X_PARK - 0.9, T.ball + 0.25, 0.24); drop(w.rock, X_PARK, T.rock + 0.1, 0.2);
  ring(X_PARK - 0.9, 0.6, T.ball + 0.25 + fallT(2.1 - 0.24, G_EARTH));
  const lu = ramp(t, T.leaf + 0.2, T.but + 0.6), ls = pop(t, T.leaf - 0.2, 0.3);
  w.leaf.scale.set(1.5 * Math.max(0.001, ls), 0.8 * Math.max(0.001, ls), 1); w.leaf.position.set(X_PARK + 0.9 + 0.3 * Math.sin(lu * 9), lerp(2.2, 0.03, lu), 0.6 + 0.2 * Math.cos(lu * 7));
  w.leaf.rotation.set(-1.2 + 0.5 * Math.sin(lu * 9), lu * 5, 0.5 * Math.cos(lu * 9));

  // --- Earth with air: the feather drifts, the hammer drops ---
  const E1 = T.falls - 0.25, E2 = T.barely - 0.1;
  let h2 = HAND_Y, lie2 = 0;
  if (t >= E1 && t < T.catches + 1.2) { h2 = fall(E1, HAND_Y, G_EARTH, 0.08); lie2 = ramp(t, E1 + 0.5, E1 + 0.65); }
  else if (t >= T.catches + 1.2 && t < E2) { const u = easeInOut(ramp(t, T.catches + 1.2, E2 - 0.15)); h2 = lerp(0.08, HAND_Y, u); lie2 = 1 - u; }
  else if (t >= E2) { h2 = fall(E2, HAND_Y, G_EARTH, 0.08); lie2 = ramp(t, E2 + 0.5, E2 + 0.65); }
  w.H2.position.set(X_AIR + HAND_L.x, h2 + 0.12 * (1 - lie2), HAND_L.z + 0.05); w.H2.rotation.set(0, 0.3, (lie2 * Math.PI) / 2); w.H2.scale.setScalar(1.25);
  const fu = ramp(t, E1, E1 + 4.6);
  const fpos = new THREE.Vector3(X_AIR + HAND_R.x + 0.3 * Math.sin(fu * 11), lerp(HAND_Y + 0.1, 0.05, fu), HAND_R.z + 0.05 + 0.12 * Math.cos(fu * 8));
  w.F2.position.copy(fpos); w.F2.rotation.set(-0.9 * Math.sin(fu * Math.PI) + (fu >= 1 ? -Math.PI / 2 : 0), 0.4, 0.6 * Math.sin(fu * 11)); w.F2.scale.setScalar(1.15);
  ring(X_AIR + HAND_L.x, HAND_L.z, E1 + fallT(HAND_Y - 0.08, G_EARTH));
  // air molecules: grey dots that the falling things have to push through
  w.airMat.opacity = ramp(t, T.air - 0.2, T.air + 0.3) * (1 - ramp(t, T.moon - 0.5, T.moon));
  const hpos = w.H2.position;
  w.airPts.forEach((o, i) => {
    const b: THREE.Vector3 = (o as any).base; let x = b.x + 0.04 * Math.sin(t * 2 + i), y = b.y + 0.04 * Math.cos(t * 1.7 + i * 2);
    for (const [q, R] of [[fpos, 0.42], [hpos, 0.25]] as [THREE.Vector3, number][]) { const dx = x - q.x, dy = y - q.y, d = Math.hypot(dx, dy); if (d < R) { x = q.x + (dx / (d || 1)) * R; y = q.y + (dy / (d || 1)) * R; } }
    o.position.set(x, y, b.z);
  });

  // --- the vacuum chamber ---
  const cy = fall(CH_DROP, CH_TOP, G_EARTH, 0.3);
  w.ball2.position.set(X_CH - 1, cy, 0); w.pile.position.set(X_CH + 1, cy - 0.12, 0);
  ring(X_CH, 0, CH_DROP + CH_FALL, C.white, 3);

  // --- the sun follows the action so shadows stay sharp ---
  const cx = cameraAt(t).l[0];
  w.key.position.set(cx + 9, 16, 9); w.key.target.position.set(cx, 0, 0); w.key.target.updateMatrixWorld();
}

const Scene: React.FC<{ t: number }> = ({ t }) => {
  const world = useMemo(() => buildWorld(), []);
  const { camera, gl } = useThree();
  const tr = useRef(t); tr.current = t;
  const apply = () => {
    const tt = tr.current, c = cameraAt(tt);
    animate(world, tt);
    camera.position.set(c.p[0], c.p[1], c.p[2]); camera.lookAt(c.l[0], c.l[1], c.l[2]);
    (camera as THREE.PerspectiveCamera).fov = 50; (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; gl.setClearColor(C.void, 1);
  };
  apply();
  useFrame(apply, -1);
  // @ts-ignore react-three-fiber element
  return <primitive object={world.root} />;
};
export const World: React.FC<{ t: number }> = ({ t }) => (
  <ThreeCanvas width={VIDEO.width} height={VIDEO.height} style={{ position: 'absolute', inset: 0, background: C.void }} camera={{ fov: 50, near: 0.1, far: 600 }} shadows>
    <Scene t={t} />
  </ThreeCanvas>
);

// ---------- 2D overlays: tags, counters, the stamp ----------
const Tag: React.FC<{ text: string; opacity: number; top?: number; color?: string }> = ({ text, opacity, top = 1420, color = C.white }) => (opacity > 0.01 ? (
  <div style={{ position: 'absolute', left: SAFE.left, right: SAFE.right, top, display: 'flex', justifyContent: 'center', opacity }}>
    <div style={{ border: `4px solid ${color}`, borderRadius: 40, padding: '14px 30px', background: 'rgba(0,0,0,0.6)', fontFamily: FONT.sans, fontWeight: TYPE.label.weight, fontSize: TYPE.label.size, letterSpacing: '0.2em', color, whiteSpace: 'nowrap' }}>{text.toUpperCase()}</div>
  </div>
) : null);
export const Overlays: React.FC<{ t: number }> = ({ t }) => {
  const crack = easeInOut(ramp(t, T.fell, T.fell + 0.7));
  const ideaOn = ramp(t, T.idea - 1.2, T.idea - 0.9) * (1 - ramp(t, T.fell + 0.5, T.fell + 0.9));
  const fallClock = clamp(t - DROP2, 0, MOON_FALL);
  const volt = ramp(t, T.free + 0.02, T.free + 0.25) * (1 - ramp(t, T.free + 0.9, T.free + 1.5));
  const half = (side: number, txt: string) => (
    <div style={{ transform: `translate(${side * 30 * crack}px, ${260 * crack * crack}px) rotate(${side * 22 * crack}deg)`, border: `4px solid ${C.white}`, [side < 0 ? 'borderRight' : 'borderLeft']: 'none', borderRadius: side < 0 ? '14px 0 0 14px' : '0 14px 14px 0', padding: '18px 22px', background: 'rgba(0,0,0,0.6)', fontFamily: FONT.sans, fontWeight: 900, fontSize: 40, color: C.white, whiteSpace: 'nowrap' } as React.CSSProperties}>{txt}</div>
  );
  return (
    <>
      <Tag text="Apollo 15 · 1971" opacity={win(t, 0.4, T.idea - 1.4, 0.3)} />
      {ideaOn > 0.01 ? (
        <div style={{ position: 'absolute', left: SAFE.left, right: SAFE.right, top: 1330, opacity: ideaOn, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex' }}>{half(-1, 'HEAVY THINGS')}{half(1, 'FALL FASTER')}</div>
          <div style={{ marginTop: 16, fontFamily: FONT.sans, fontWeight: 600, fontSize: 26, letterSpacing: '0.25em', color: C.mist, opacity: 1 - crack }}>ARISTOTLE · ABOUT 350 BC</div>
        </div>
      ) : null}
      <Tag text="Earth · air pushes back" opacity={win(t, T.air, T.moon - 0.7, 0.3)} />
      <Tag text="The Moon · almost no air" opacity={win(t, T.no, T.go - 0.3, 0.3)} />
      <Counter value={`${fallClock.toFixed(2)} s`} label="Hammer and feather · same time" opacity={win(t, DROP2, T.wait - 0.3, 0.2)} />
      <Tag text="Hammer: 44× the pull" opacity={win(t, T.pulls + 0.3, T.because - 0.2, 0.25)} />
      <Tag text="…and 44× harder to speed up" opacity={win(t, T.harder2, T.cancel - 0.1, 0.25)} />
      <Counter value="1.62 m/s²" label="Same acceleration · both" opacity={win(t, T.cancel + 0.2, T.free - 0.25, 0.25)} />
      <Stamp lines={['FREE', 'FALL']} scale={pop(t, T.free + 0.02, 0.35)} opacity={1 - ramp(t, T.take + 0.6, T.take + 1.0)} top={1180} color={volt > 0.4 ? C.volt : C.white} />
      <Tag text="NASA vacuum chamber · Ohio" opacity={win(t, T.vacuum, CH_DROP - 0.2, 0.3)} />
      <Tag text="Aristotle · 384–322 BC" opacity={win(t, T.aristotle + 0.2, T.visited + 0.3, 0.3)} />
    </>
  );
};
