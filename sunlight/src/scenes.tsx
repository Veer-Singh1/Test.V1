// "The sunlight on your face is 100,000 years old": scene list, camera keys and counters.
// Everything is timed with at('word') from assets/timings.json.
import React from 'react';
import { C, VIDEO } from './style';
import { END, at, clamp, easeInOut, easeOut, lerp, pop, ramp, win } from './timeline';
import { makeCamera, worldTransform } from './kit/camera';
import { Arrow, Defs, Figure, Glow, L, Label, P, Pill, Ring, SW, mix, polar } from './kit/parts';
import { Counter, Stamp } from './kit/Hud';

// ---------- spoken moments ----------
const T = {
  about: at('about', 0), one: at('one', 0), thousand: at('thousand', 0), old: at('old.'),
  most: at('most'), eight: at('eight', 0), minutes: at('minutes', 0), last: at('last'), part: at('part.'),
  morning: at('morning'), skin: at('skin.'), light1: at('light', 0), window: at('window.'), plant: at('plant'), leaning: at('leaning'), sky: at('sky.'),
  but: at('but'), born: at('born'), core: at('core...'), packed: at('packed'), tight: at('tight,'),
  travel: at('travel'), tiny: at('tiny'), fraction: at('fraction'), crashes: at('crashes'), something: at('something.'),
  bounces: at('bounces', 0), absorbed: at('absorbed.'), sent: at('sent'), again: at('again...'), random0: at('random', 0), direction: at('direction.'),
  called: at('called'), random: at('random', 1), walk: at('walk.'),
  trillions: at('trillions', 0), stumbling: at('stumbling'), step: at('step'), estimates: at('estimates'), tens: at('tens'), often: at('often'), hundred2: at('hundred', 1), thousand2: at('thousand', 1),
  once: at('once'), breaks: at('breaks'), free: at('free...'), flies: at('flies'), earth: at('earth'), minutes2: at('minutes', 1),
  so: at('so', 1), warmth: at('warmth'), today: at('today...'), started: at('started'), journey: at('journey...'), neanderthals: at('neanderthals'), alive: at('alive.'),
};

// ---------- region A: the Sun and you ----------
const SC: P = [-260, -300], R = 260, CORE = 65, RAD = 182;
const FIG: P = [380, 430], HEAD: P = [380, 430 - 372 * 0.5], FACE: P = [350, 244];
const hsh = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
// the long random walk out of the Sun (drawn at Sun scale; biased a little towards you so it exits on your side)
const TARGET = polar(SC, R, (Math.atan2(FACE[1] - SC[1], FACE[0] - SC[0]) * 180) / Math.PI);
const WALK: P[] = (() => {
  const pts: P[] = [[SC[0], SC[1]]]; let p: P = [SC[0], SC[1]];
  for (let k = 0; k < 3000; k++) {
    const a = hsh(k * 7 + 3) * Math.PI * 2, dx = TARGET[0] - p[0], dy = TARGET[1] - p[1], d = Math.hypot(dx, dy);
    const v: P = [Math.cos(a) + 0.32 * dx / d, Math.sin(a) + 0.32 * dy / d], n = Math.hypot(v[0], v[1]);
    p = [p[0] + 8 * v[0] / n, p[1] + 8 * v[1] / n]; pts.push(p);
    if (Math.hypot(p[0] - SC[0], p[1] - SC[1]) >= R) break;
  }
  const last = pts[pts.length - 1], a = Math.atan2(last[1] - SC[1], last[0] - SC[0]);
  pts[pts.length - 1] = [SC[0] + R * Math.cos(a), SC[1] + R * Math.sin(a)];
  return pts;
})();
const EXIT = WALK[WALK.length - 1];
const RAY_END = L(EXIT, FACE, 1 - 30 / Math.hypot(FACE[0] - EXIT[0], FACE[1] - EXIT[1]));
// the core, close up: tightly packed particles and the first few steps of the walk (units: Sun-scale, so tiny)
const MICRO: P[] = [[0, 0], [1.5, -0.6], [0.6, -1.9], [2.2, -2.6], [3.0, -1.2], [1.9, 0.2], [3.4, 0.9]].map(([x, y]) => [SC[0] + x, SC[1] + y] as P);
const MC: P = [SC[0] + 1.6, SC[1] - 0.8];
const PARTICLES: P[] = (() => {
  const out: P[] = [...MICRO.slice(1)];
  let i = 0;
  for (let y = -10.5; y <= 10.5; y += 0.95) for (let x = -10.5; x <= 10.5; x += 0.95) {
    i++; if (Math.hypot(x, y) > 10.5) continue;
    const p: P = [SC[0] + 1.6 + x + (hsh(i + 400) - 0.5) * 0.5, SC[1] - 0.8 + y + (hsh(i + 800) - 0.5) * 0.5];
    if (out.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.62) && MICRO.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.5)) out.push(p);
  }
  return out;
})();
// micro steps: [from index, to index, start, end]
const STEPS: [number, number, number, number][] = [
  [0, 1, 0, 0], [1, 2, 0, 0], [2, 3, 0, 0], [3, 4, 0, 0], [4, 5, 0, 0], [5, 6, 0, 0],
];
STEPS[0][2] = T.fraction; STEPS[0][3] = T.crashes;
STEPS[1][2] = T.bounces - 0.05; STEPS[1][3] = T.bounces + 0.45;
STEPS[2][2] = T.absorbed - 0.45; STEPS[2][3] = T.absorbed;
STEPS[3][2] = T.sent + 0.1; STEPS[3][3] = T.again + 0.2;
STEPS[4][2] = T.random0 - 0.1; STEPS[4][3] = T.random0 + 0.35;
STEPS[5][2] = T.direction - 0.05; STEPS[5][3] = T.direction + 0.35;
function microPhoton(t: number): { p: P; idx: number } {
  let p: P = MICRO[0], idx = 0;
  for (const [a, b, t0, t1] of STEPS) { if (t >= t1) { p = MICRO[b]; idx = b; } else if (t > t0) { p = L(MICRO[a], MICRO[b], (t - t0) / (t1 - t0)); idx = a; break; } else break; }
  return { p, idx };
}
// the timeline: ~100,000 years inside the Sun, then the last 8 minutes
const TL_Y = 600, TL_A = -460, TL_B = 470;
// region C: three everyday scenes
const C1: P = [1450, 0], C2: P = [2350, 0], C3: P = [3250, 0];

// ---------- camera ----------
const HOOK = { x: 30, y: -20, z: 0.88 }, BELIEF = { x: 120, y: 100, z: 0.78 };
const cam = makeCamera([
  { t: 0, ...HOOK },
  { t: T.most - 0.3, ...BELIEF },
  { t: T.morning - 0.35, x: C1[0], y: -20, z: 1.0 },
  { t: T.light1 - 0.3, x: C2[0], y: -20, z: 1.0 },
  { t: T.plant - 0.3, x: C3[0], y: -20, z: 1.0 },
  { t: T.but - 0.15, x: SC[0], y: SC[1] + 100, z: 1.6 },
  { t: T.born - 0.25, x: SC[0], y: SC[1], z: 5 },
  { t: T.packed - 0.25, x: MC[0], y: MC[1], z: 110 },
  { t: T.called - 0.2, x: MC[0], y: MC[1] + 0.6, z: 85 },
  { t: T.trillions - 0.15, x: SC[0], y: SC[1] + 100, z: 1.6 },
  { t: T.flies - 0.25, ...HOOK },
  { t: T.started - 0.25, ...BELIEF },
  { t: T.alive + 0.75, x: HOOK.x, y: HOOK.y, z: HOOK.z / (1 + 0.015 * (END - (T.alive + 0.75) - 1.0)), dur: 1.0 },
]);

export const World: React.FC<{ t: number }> = ({ t }) => {
  const c = cam.camAt(t), z = c.z;
  const inside = ramp(z, 1.25, 1.55);          // looking inside the Sun
  const micro = ramp(z, 25, 55);               // the core, close up
  const loopOut = 1 - ramp(t, END - 1.6, END - 0.4);

  // ---- the ray to your face (hidden while we are inside the Sun's story) ----
  const flyU = ramp(t, T.flies, T.minutes2 + 0.4);
  const rayOn = t < T.but ? 1 - ramp(t, T.but - 0.2, T.but) : ramp(t, T.flies - 0.05, T.flies);
  const rayU = t < T.but ? 1 : flyU;
  // ---- the long walk ----
  const walkU = ramp(t, T.trillions, T.breaks);
  const walkN = Math.max(1, Math.floor(walkU * (WALK.length - 1)));
  const walkOn = ramp(t, T.trillions - 0.2, T.trillions) * (1 - ramp(t, T.started - 0.3, T.started + 0.3) * 0.8) * loopOut;
  const volt1 = ramp(t, T.random + 0.02, T.random + 0.25) * (1 - ramp(t, T.random + 1.1, T.random + 1.8));
  const breakT = T.breaks + 0.15;
  // ---- the micro photon ----
  const mp = microPhoton(t);
  const absorbedOn = win(t, T.absorbed, T.sent + 0.1, 0.12);
  const photonOn = ramp(t, T.born - 0.1, T.born + 0.15) * (1 - absorbedOn) * (1 - ramp(t, T.trillions, T.trillions + 0.4));
  const microTrail = MICRO.slice(0, mp.idx + 1).concat(mp.idx < MICRO.length - 1 ? [mp.p] : []);
  // ---- glow: one hero at a time ----
  const faceGlow = ramp(t, T.warmth - 0.1, T.warmth + 0.3) * (1 - ramp(t, END - 1.8, END - 0.8));
  const sunGlow = (1 - inside) * (1 - faceGlow) * (t < T.but ? 1 : ramp(t, END - 1.8, END - 0.8));
  // ---- timeline ----
  const tl1 = win(t, T.last - 0.4, T.morning - 0.5, 0.3), tl2 = win(t, T.started - 0.2, T.alive + 0.9, 0.3);
  const tlOn = Math.max(tl1, tl2);
  const neanderthal = pop(t, T.neanderthals - 0.05, 0.3) * (1 - ramp(t, T.alive + 0.9, T.alive + 1.3));
  // ---- three scenes ----
  const c1 = pop(t, T.morning - 0.1), c2 = pop(t, T.light1 - 0.1), c3 = pop(t, T.plant - 0.1);
  const lean = easeInOut(ramp(t, T.leaning - 0.1, T.sky + 0.4));
  const cDim = (t0: number) => mix(C.white, C.mist, ramp(t, t0 - 0.2, t0 + 0.2));

  return (
    <svg width={VIDEO.width} height={VIDEO.height} viewBox={`0 0 ${VIDEO.width} ${VIDEO.height}`} style={{ position: 'absolute', inset: 0 }}>
      <Defs />
      <rect width={VIDEO.width} height={VIDEO.height} fill={C.void} />
      <g transform={worldTransform(c)}>
        {/* ================= THE SUN ================= */}
        <Glow p={SC} r={R * 1.15} opacity={sunGlow} />
        <circle cx={SC[0]} cy={SC[1]} r={R} {...SW} fill={C.void} stroke={C.white} />
        {/* layers inside, shown when we look in */}
        {inside > 0.01 ? (
          <g opacity={inside * (1 - micro)}>
            <circle cx={SC[0]} cy={SC[1]} r={RAD} {...SW} strokeDasharray="4 14" stroke={C.ash} />
            <circle cx={SC[0]} cy={SC[1]} r={CORE} {...SW} stroke={mix(C.mist, C.white, ramp(t, T.born - 0.3, T.born))} />
            <Label p={[SC[0], SC[1] + CORE + 34 / z]} z={z} text="Core" color={C.mist} opacity={ramp(z, 1.3, 1.5) * (1 - ramp(z, 6, 9)) * (1 - ramp(t, T.trillions + 1, T.trillions + 1.5))} />
            <Label p={[SC[0], SC[1] - RAD + 40]} z={z} text="Radiative zone" color={C.ash} opacity={ramp(z, 1.3, 1.5) * (1 - ramp(z, 2.5, 3.5))} />
            <Label p={[SC[0], SC[1] - R + 34]} z={z} text="Surface" color={C.ash} opacity={ramp(z, 1.3, 1.5) * (1 - ramp(z, 2.5, 3.5)) * (1 - ramp(t, T.trillions, T.trillions + 0.5))} />
          </g>
        ) : null}
        {/* the core, close up: packed particles; the photon steps from one to the next */}
        {micro > 0.01 ? (
          <g opacity={micro}>
            {PARTICLES.map((p, i) => {
              const isM = i < MICRO.length - 1, k = i + 1; // MICRO[k] is particle i
              const glow = isM && k === 3 ? absorbedOn : 0;
              return (
                <g key={i}>
                  {glow > 0.01 ? <Glow p={p} r={0.9} opacity={glow} /> : null}
                  <circle cx={p[0]} cy={p[1]} r={0.3} fill={glow > 0.3 ? C.white : isM && mp.idx >= k ? C.mist : C.ash} />
                </g>
              );
            })}
            {/* the path so far */}
            <polyline points={microTrail.map((q) => q.join(',')).join(' ')} {...SW} stroke={volt1 > 0.3 ? C.volt : C.mist} />
            {volt1 > 0.01 ? <polyline points={MICRO.map((q) => q.join(',')).join(' ')} {...SW} strokeWidth={22} stroke={C.volt} opacity={0.35 * volt1} filter="url(#halo)" /> : null}
            {/* how far it gets: a tiny fraction of a centimetre */}
            {(() => {
              const o = win(t, T.tiny - 0.1, T.bounces - 0.4, 0.25); if (o < 0.01) return null;
              const a = MICRO[0], b = MICRO[1], n: P = [0.6 * 0.37, 0.6 * 0.93], a2: P = [a[0] + n[0], a[1] + n[1]], b2: P = [b[0] + n[0], b[1] + n[1]];
              return (
                <g opacity={o}>
                  <line x1={a2[0]} y1={a2[1]} x2={b2[0]} y2={b2[1]} {...SW} stroke={C.mist} />
                  {[a2, b2].map((q, k) => <line key={k} x1={q[0] - n[0] * 0.25} y1={q[1] - n[1] * 0.25} x2={q[0] + n[0] * 0.25} y2={q[1] + n[1] * 0.25} {...SW} stroke={C.mist} />)}
                  <Pill p={[(a2[0] + b2[0]) / 2 + 0.2, (a2[1] + b2[1]) / 2 + 1.25]} z={z} text="A tiny fraction of a cm" color={C.mist} />
                </g>
              );
            })()}
            <Ring p={MICRO[1]} r={0.7} t={t} t0={T.crashes} />
            <Ring p={MICRO[2]} r={0.7} t={t} t0={T.bounces + 0.45} />
            <Label p={[MICRO[3][0], MICRO[3][1] - 0.75]} z={z} text="Absorbed" color={C.white} opacity={win(t, T.absorbed, T.sent - 0.1, 0.15)} />
            {[4, 5, 6].map((k) => (t > STEPS[k - 1][2] && t < STEPS[k - 1][3] + 0.7 ? <Arrow key={k} a={MICRO[k - 1]} b={MICRO[k]} u={ramp(t, STEPS[k - 1][2], STEPS[k - 1][3])} color={C.white} z={z} opacity={1 - ramp(t, STEPS[k - 1][3] + 0.3, STEPS[k - 1][3] + 0.7)} /> : null))}
            <Label p={[MICRO[4][0] - 0.5, MICRO[4][1] + 0.25]} z={z} text="Random direction" color={C.mist} anchor="end" opacity={win(t, T.random0, T.called - 0.2, 0.2)} />
          </g>
        ) : null}
        {/* the photon itself (min 6 px on screen so it reads at any zoom) */}
        {photonOn > 0.01 ? (
          <g opacity={photonOn}>
            <Glow p={mp.p} r={Math.max(0.6, 26 / z)} opacity={1} />
            <circle cx={mp.p[0]} cy={mp.p[1]} r={Math.max(0.2, 7 / z)} fill={C.white} />
          </g>
        ) : null}
        <Ring p={SC} r={30 / Math.max(1, z / 5)} t={t} t0={T.born} />
        {/* the long random walk out to the surface */}
        {walkOn > 0.01 ? (
          <g opacity={walkOn}>
            <polyline points={WALK.slice(0, walkN + 1).map((q) => q.join(',')).join(' ')} {...SW} strokeWidth={2.5} stroke={mix(C.mist, C.ash, ramp(t, T.flies, T.flies + 1))} />
            {walkU > 0 && walkU < 1 ? <g><Glow p={WALK[walkN]} r={26 / z} /><circle cx={WALK[walkN][0]} cy={WALK[walkN][1]} r={7 / z} fill={C.white} /></g> : null}
          </g>
        ) : null}
        <Ring p={EXIT} r={60} t={t} t0={breakT} color={C.volt} />
        {win(t, breakT - 0.05, breakT + 0.7, 0.1) > 0.01 ? <Glow p={EXIT} r={40} color={C.volt} opacity={win(t, breakT - 0.05, breakT + 0.7, 0.1) * 1.6} /> : null}
        <Label p={[EXIT[0] + 26, EXIT[1] + 50]} z={z} text="Free" color={C.white} anchor="start" opacity={win(t, T.free - 0.1, T.flies - 0.1, 0.2)} />

        {/* ================= THE RAY AND YOU ================= */}
        {rayOn > 0.01 ? (
          <g opacity={rayOn}>
            <line x1={EXIT[0]} y1={EXIT[1]} x2={L(EXIT, RAY_END, rayU)[0]} y2={L(EXIT, RAY_END, rayU)[1]} {...SW} stroke={C.white} opacity={0.8} />
            {t < T.but || flyU >= 1 ? [0, 1, 2].map((k) => { const ph = ((t / 1.6 + k / 3) % 1 + 1) % 1; const q = L(EXIT, RAY_END, ph); return <circle key={k} cx={q[0]} cy={q[1]} r={7 / z} fill={C.white} />; }) : null}
            {flyU > 0 && flyU < 1 ? <g><Glow p={L(EXIT, RAY_END, flyU)} r={30 / z} /><circle cx={L(EXIT, RAY_END, flyU)[0]} cy={L(EXIT, RAY_END, flyU)[1]} r={8 / z} fill={C.white} /></g> : null}
          </g>
        ) : null}
        <Pill p={L(EXIT, RAY_END, 0.55)} z={z} text="8 minutes" color={C.white} opacity={win(t, T.eight - 0.1, T.morning - 0.6, 0.2)} />
        <Glow p={HEAD} r={70} opacity={faceGlow} />
        <Figure x={FIG[0]} y={FIG[1]} s={0.5} color={C.white} />
        <Ring p={HEAD} r={60} t={t} t0={T.one} />
        <Ring p={HEAD} r={60} t={t} t0={T.warmth} />
        <Label p={[FIG[0], FIG[1] + 50 / z]} z={z} text="You" color={C.ash} opacity={(1 - inside) * (t < 0.3 ? t / 0.3 : 1) * loopOut} />

        {/* ================= THE TIMELINE ================= */}
        {tlOn > 0.01 ? (
          <g opacity={tlOn}>
            <line x1={TL_A} y1={TL_Y} x2={TL_B - 26} y2={TL_Y} {...SW} strokeWidth={8} stroke={C.graphite} />
            <line x1={TL_B - 18} y1={TL_Y} x2={TL_B} y2={TL_Y} {...SW} strokeWidth={8} stroke={C.white} />
            <Label p={[(TL_A + TL_B) / 2 - 30, TL_Y - 34]} z={z} text="~100,000 years inside the Sun" color={C.mist} />
            <Label p={[TL_B, TL_Y + 56]} z={z} text="Last 8 min" color={C.white} anchor="end" opacity={tl1} />
            <Label p={[TL_B, TL_Y + 56]} z={z} text="Today" color={C.white} anchor="end" opacity={tl2} />
            <Label p={[TL_A, TL_Y + 56]} z={z} text="100,000 years ago" color={C.mist} anchor="start" opacity={tl2} />
            {neanderthal > 0 ? <g transform={`translate(${TL_A + 50} ${TL_Y - 50}) scale(${neanderthal})`}><Figure x={0} y={0} s={0.42} color={C.mist} /></g> : null}
            <Label p={[TL_A, TL_Y - 250]} z={z} text="Neanderthals" color={C.mist} anchor="start" opacity={neanderthal > 0.5 ? 1 : 0} />
          </g>
        ) : null}
        <Ring p={[TL_B - 9, TL_Y]} r={40} t={t} t0={T.last} />
        <Ring p={[TL_A + 50, TL_Y - 140]} r={70} t={t} t0={T.neanderthals} color={C.mist} />

        {/* ================= THREE SCENES ================= */}
        {c1 > 0 ? (
          <g transform={`translate(${C1[0]} ${C1[1]}) scale(${c1})`}>
            <circle cx={40} cy={60} r={130} {...SW} stroke={cDim(T.light1)} />
            <path d="M-10,40 Q15,25 40,40" {...SW} stroke={cDim(T.light1)} />
            <path d="M5,110 Q40,135 75,110" {...SW} stroke={cDim(T.light1)} />
            {[0, 1, 2].map((k) => <Arrow key={k} a={[-260 + k * 60, -330 + k * 20]} b={[-60 + k * 50, -90 + k * 30]} u={easeOut(ramp(t, T.morning + k * 0.12, T.morning + 0.5 + k * 0.12))} color={cDim(T.light1)} z={z} />)}
            {[0, 1, 2].map((k) => <path key={k} d={`M${120 + k * 30},-120 q10,-15 0,-30 q-10,-15 0,-30`} {...SW} strokeWidth={3} stroke={C.mist} opacity={ramp(t, T.skin - 0.2, T.skin + 0.2) * (0.5 + 0.5 * Math.sin(t * 3 + k))} />)}
            <Label p={[40, 270]} z={z} text="Morning" color={C.ash} />
          </g>
        ) : null}
        {c2 > 0 ? (
          <g transform={`translate(${C2[0]} ${C2[1]}) scale(${c2})`}>
            <rect x={-180} y={-280} width={360} height={440} {...SW} stroke={cDim(T.plant)} />
            <line x1={0} y1={-280} x2={0} y2={160} {...SW} stroke={cDim(T.plant)} />
            <line x1={-180} y1={-60} x2={180} y2={-60} {...SW} stroke={cDim(T.plant)} />
            <line x1={-420} y1={380} x2={420} y2={380} {...SW} stroke={C.mist} />
            {[-120, -20, 80].map((x, k) => <Arrow key={k} a={[x - 160, -420]} b={[x + 170, 360]} u={easeOut(ramp(t, T.light1 + 0.1 + k * 0.1, T.window + 0.2 + k * 0.1))} color={cDim(T.plant)} z={z} w={3} />)}
            <polygon points="40,380 340,380 300,350 70,350" {...SW} stroke={C.mist} opacity={ramp(t, T.window, T.window + 0.4)} />
            <Label p={[0, 460]} z={z} text="Window" color={C.ash} />
          </g>
        ) : null}
        {c3 > 0 ? (
          <g transform={`translate(${C3[0]} ${C3[1]}) scale(${c3})`}>
            <circle cx={-240} cy={-330} r={42} {...SW} stroke={C.white} />
            <polygon points="-80,240 80,240 60,360 -60,360" {...SW} stroke={C.white} />
            {(() => {
              const tip: P = [lerp(10, -150, lean), lerp(-260, -200, lean)], ctrl: P = [lerp(0, 40, lean), lerp(-60, -20, lean)];
              const at2 = (u: number): P => [(1 - u) * (1 - u) * 0 + 2 * (1 - u) * u * ctrl[0] + u * u * tip[0], (1 - u) * (1 - u) * 240 + 2 * (1 - u) * u * ctrl[1] + u * u * tip[1]];
              return (
                <>
                  <path d={`M0,240 Q${ctrl[0]},${ctrl[1]} ${tip[0]},${tip[1]}`} {...SW} stroke={C.white} />
                  {[0.35, 0.6, 0.85].map((u, k) => { const q = at2(u); const s = k % 2 ? 1 : -1; return <ellipse key={k} cx={q[0] + s * 38} cy={q[1] - 6} rx={40} ry={16} transform={`rotate(${s * -25 - lean * 20} ${q[0] + s * 38} ${q[1] - 6})`} {...SW} stroke={C.white} />; })}
                </>
              );
            })()}
            <Label p={[0, 440]} z={z} text="Plant" color={C.ash} />
          </g>
        ) : null}
      </g>
    </svg>
  );
};

// ---------- counters and the stamp ----------
const sup = (n: number) => String(n).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]).join('');
const fmt = (n: number) => n.toLocaleString('en-US');
export const Overlays: React.FC<{ t: number }> = ({ t }) => {
  const yearsOld = Math.round(100000 * easeOut(ramp(t, T.about, T.thousand + 0.5)) / 100) * 100;
  const c1 = ramp(t, 0.05, 0.45) * (1 - ramp(t, T.old + 0.4, T.most - 0.2));
  const exp = Math.round(24 * ramp(t, T.trillions, T.step));
  const c2 = ramp(t, T.trillions - 0.2, T.trillions + 0.1) * (1 - ramp(t, T.estimates - 0.3, T.estimates));
  const yrs = Math.round(lerp(0, 100000, easeOut(ramp(t, T.tens - 0.3, T.thousand2 + 0.3))) / 100) * 100;
  const c3 = ramp(t, T.estimates - 0.1, T.estimates + 0.2) * (1 - ramp(t, T.flies - 0.4, T.flies - 0.1));
  const secs = Math.round(500 * ramp(t, T.flies, T.minutes2 + 0.4));
  const c4 = ramp(t, T.flies - 0.2, T.flies) * (1 - ramp(t, T.so - 0.3, T.so));
  const stampOn = 1 - ramp(t, T.trillions - 0.45, T.trillions - 0.1);
  const volt = ramp(t, T.random + 0.02, T.random + 0.25) * (1 - ramp(t, T.random + 0.9, T.random + 1.5));
  return (
    <>
      <Counter value={fmt(yearsOld)} label="Years old" opacity={c1} />
      <Counter value={`~10${sup(Math.max(1, exp))}`} label="Bounces, roughly" opacity={c2} />
      <Counter value={fmt(yrs)} label="Years to get out" opacity={c3} />
      <Counter value={`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`} label="Minutes to Earth" opacity={c4} />
      <Stamp lines={['RANDOM', 'WALK']} scale={pop(t, T.random + 0.02, 0.35)} opacity={stampOn} top={690} color={volt > 0.4 ? C.volt : C.white} />
    </>
  );
};
