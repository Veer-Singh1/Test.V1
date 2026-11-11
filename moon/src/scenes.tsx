// "The Moon is running away": the scene list, camera keys and counters for this video.
// Everything is driven by spoken-word times: at('word') comes from assets/timings.json.
import React from 'react';
import { C, VIDEO } from './style';
import { END, FRAMES, at, clamp, easeInOut, easeOut, lerp, pop, ramp, win } from './timeline';
import { makeCamera, worldTransform } from './kit/camera';
import { Arrow, Defs, Figure, Glow, L, Label, P, Pill, Ring, SW, mix, polar } from './kit/parts';
import { Counter, Stamp } from './kit/Hud';

// ---------- spoken moments ----------
const T = {
  four: at('four', 0), year: at('year.', 0), most: at('most'), parked: at('parked'), forever: at('forever.'),
  full: at('every', 1), tide: at('every', 2), eclipse: at('every', 3), but: at('but'),
  pulls: at('pulls', 0), oceans: at('oceans...'), spinning: at('spinning'), drags: at('drags'), ahead: at('ahead'),
  bulge: at('bulge'), back: at('back'), flings: at('flings'), outward: at('outward.'),
  tidal: at('tidal'), pays: at('pays'), slowing: at('slowing'), longer: at('longer.'),
  fourH: at('four', 1), twentyTwo: at('twenty-two'), ancient: at('ancient'), recorded: at('recorded'),
  how: at('how'), astronauts: at('astronauts'), mirrors: at('mirrors'), bounce: at('bounce'), so: at('so', 1),
  farther: at('farther'), better: at('...better'), goodbye: at('goodbye.'),
};
const ROUND_TRIP = 2.56; // seconds for light to go to the Moon and back
const LASER0 = T.bounce + 0.1, LASER_HIT = LASER0 + ROUND_TRIP / 2, LASER_BACK = LASER0 + ROUND_TRIP;

// ---------- the Earth-Moon system (region A, around the origin) ----------
const EARTH: P = [0, 0], ER = 120, MR = 22;
const keyed = (keys: [number, number][], t: number) => { let i = 0; while (i + 2 < keys.length && keys[i + 1][0] <= t) i++; const [t0, v0] = keys[i], [t1, v1] = keys[i + 1]; return lerp(v0, v1, clamp((t - t0) / (t1 - t0), 0, 1)); };
// The Moon circles slowly anticlockwise. It is off screen around 28 s, where it is moved (unseen) so that
// the laser and payoff scenes are framed well and the last frame equals the first.
const HIDE = T.pays + 1.0;
const theta = (t: number) => (t < HIDE ? keyed([[0, -55], [5.2, -65.4], [15.3, -80], [T.pays, -100], [HIDE, -101]], t) : keyed([[HIDE, -6], [T.how, -28], [T.so, -41.6], [END, -55]], t));
const moonR = (t: number) => (t < HIDE
  ? 440 + 30 * easeInOut(ramp(t, 0.2, T.year + 0.3)) + 35 * easeInOut(ramp(t, T.flings, T.outward + 0.6))
  : 375 + 65 * easeInOut(ramp(t, T.so + 0.3, END - 0.3)));
const refR = (t: number) => (t < T.but ? 440 : t < HIDE ? 470 : 375); // the orbit "before", drawn dashed
const moonAt = (t: number): P => polar(EARTH, moonR(t), theta(t));
// Earth's spin angle: fast like a clock hand when "Earth pays", then visibly slowing. Precomputed per frame.
const SPIN = (() => {
  const a = [0]; const w = (t: number) => (t < T.pays - 0.4 ? 36 : lerp(150, 28, easeInOut(ramp(t, T.slowing - 0.2, T.longer + 0.6))) * ramp(t, T.pays - 0.4, T.pays) + 36 * (1 - ramp(t, T.pays - 0.4, T.pays)));
  for (let f = 1; f <= FRAMES; f++) a.push(a[f - 1] + w(f / VIDEO.fps) / VIDEO.fps);
  const target = Math.ceil(a[FRAMES] / 30) * 30, fix = target - a[FRAMES]; // rim ticks repeat every 30 degrees: land exactly on one for the loop
  return a.map((v, f) => v + fix * ramp(f / VIDEO.fps, END - 6, END));
})();
const spin = (t: number) => SPIN[Math.round(clamp(t, 0, END) * VIDEO.fps)];

// ---------- region B: what most people think (far to the right) ----------
const B: P = [1500, 0], B_MOON: P = [1500, -330], B_GROUND = 150, TRI_Y = 430;
const TRI = [B[0] - 290, B[0], B[0] + 290];

// ---------- camera ----------
const cam = makeCamera([
  { t: 0, x: 0, y: 0, z: 0.86 },
  { t: T.most - 0.35, x: B[0], y: -60, z: 1.0 },
  { t: T.full - 0.25, x: B[0], y: 160, z: 1.0 },
  { t: T.but - 0.1, x: 0, y: -250, z: 1.2 },
  { t: T.pays - 0.35, x: 0, y: 20, z: 1.9 },
  { t: T.fourH - 0.2, x: 0, y: 105, z: 1.85 },
  { t: T.how - 0.2, x: 150, y: -90, z: 1.45 },
  { t: T.astronauts - 0.2, x: (t) => moonAt(t)[0] - 14, y: (t) => moonAt(t)[1] + 6, z: 4.0 },
  { t: T.bounce - 0.25, x: 150, y: -110, z: 1.45 },
  { t: T.so - 0.05, x: 0, y: 0, z: 0.86 / (1 + 0.015 * (END - (T.so - 0.05) - 1.2)), dur: 1.2 }, // drifts back to exactly the first frame
]);

const Dashed = ({ c, r, color, opacity = 1 }: { c: P; r: number; color: string; opacity?: number }) => (opacity > 0.01 ? <circle cx={c[0]} cy={c[1]} r={r} {...SW} stroke={color} strokeDasharray="4 16" opacity={opacity} /> : null);

export const World: React.FC<{ t: number }> = ({ t }) => {
  const c = cam.camAt(t), z = c.z;
  const th = theta(t), M = moonAt(t), r = moonR(t);
  const toMoon: P = [Math.cos((th * Math.PI) / 180), Math.sin((th * Math.PI) / 180)];
  const fwd: P = [toMoon[1], -toMoon[0]]; // the way the Moon is moving (anticlockwise on screen)
  const loop = 1 - ramp(t, END - 2.4, END - 0.5); // leftovers dim away before the loop point
  const near = ramp(z, 0.7, 0.8);

  // --- hook ---
  const hookLabels = (1 - ramp(t, 4.9, 5.4));
  // --- tides ---
  const tideScene = ramp(t, T.but, T.but + 0.6);
  const b = easeOut(ramp(t, T.pulls - 0.1, T.oceans + 0.4));                 // the bulge forms
  const lead = 26 * easeInOut(ramp(t, T.drags - 0.1, T.ahead + 0.5));         // ...and is dragged ahead of the Moon
  const bAng = th - lead;
  const rx = ER + 16 + 44 * b, ry = ER + 16 - 6 * b;
  const tip: P = polar(EARTH, rx, bAng);
  const volt = ramp(t, T.tidal + 0.02, T.tidal + 0.25) * (1 - ramp(t, T.tidal + 1.1, T.tidal + 1.7));
  const tideDone = ramp(t, T.pays - 0.3, T.pays + 0.3);
  const bulgeCol = volt > 0.3 ? C.volt : mix(C.white, C.mist, tideDone);
  const pullOn = win(t, T.pulls - 0.05, T.drags - 0.3, 0.2);
  const backU = easeOut(ramp(t, T.back - 0.15, T.back + 0.35)), backOn = ramp(t, T.back - 0.15, T.back) * (1 - tideDone) ;
  const fwdU = easeOut(ramp(t, T.back + 0.45, T.back + 0.85));
  const outU = easeOut(ramp(t, T.flings - 0.05, T.outward + 0.2));
  const spinArrow = ramp(t, T.spinning - 0.15, T.spinning + 0.2) * (1 - 0.6 * tideDone) * (t < HIDE + 12 ? 1 : 0) * (1 - ramp(t, T.fourH - 0.4, T.fourH));
  // --- Earth pays: the clock ---
  const clock = ramp(t, T.pays - 0.2, T.pays + 0.3);
  const clockDone = ramp(t, T.how - 0.3, T.how + 0.3);
  const hand = -spin(t) - 90;
  const coral: P = [-150, 300];
  const coralPop = pop(t, T.fourH - 0.05, 0.35), coralDone = ramp(t, T.how - 0.3, T.how + 0.3);
  const ringsU = ramp(t, T.ancient - 0.1, T.recorded + 0.6);
  // --- mirrors and lasers ---
  const mirrorPop = pop(t, T.mirrors - 0.1, 0.3);
  const EP: P = [EARTH[0] + toMoon[0] * (ER + 2), EARTH[1] + toMoon[1] * (ER + 2)];
  const MP: P = [M[0] - toMoon[0] * (MR + 9), M[1] - toMoon[1] * (MR + 9)];
  const outL = ramp(t, LASER0, LASER_HIT), backL = ramp(t, LASER_HIT, LASER_BACK);
  const laserOn = (t >= LASER0 ? 1 : 0) * (1 - 0.65 * ramp(t, LASER_BACK + 0.8, LASER_BACK + 1.6)) * loop;
  const hit = ramp(t, LASER_BACK, LASER_BACK + 0.08) * (1 - ramp(t, LASER_BACK + 0.7, LASER_BACK + 1.3));
  const flagDir = (th + 180 + 42);
  // --- which object glows (only one at a time) ---
  const moonOnA = t < T.most + 0.4 || (t > T.but + 0.5 && t < T.pays) || t > T.how;
  const moonGlow = (moonOnA ? 1 : 0) * (1 - hit) * (1 - volt);
  const moonCol = C.white;
  // --- region B ---
  const bOn = ramp(t, T.most - 0.4, T.most);
  const bDim = ramp(t, T.but - 0.1, T.but + 0.4);
  const triState = (t0: number, t1: number) => ({ s: pop(t, t0 - 0.05, 0.3), col: mix(C.white, C.mist, ramp(t, t1 - 0.15, t1 + 0.15)) });
  const tri = [triState(T.full, T.tide), triState(T.tide, T.eclipse), triState(T.eclipse, T.but)];
  const tideRise = easeInOut(ramp(t, T.tide, T.eclipse));
  const shadow = easeInOut(ramp(t, T.eclipse, T.but - 0.2));

  return (
    <svg width={VIDEO.width} height={VIDEO.height} viewBox={`0 0 ${VIDEO.width} ${VIDEO.height}`} style={{ position: 'absolute', inset: 0 }}>
      <Defs />
      <rect width={VIDEO.width} height={VIDEO.height} fill={C.void} />
      <g transform={worldTransform(c)}>
        {/* ================= A: EARTH AND MOON ================= */}
        <Dashed c={EARTH} r={refR(t)} color={t > T.so ? C.mist : C.ash} opacity={(t < 0.3 ? 0 : 1) * (t > HIDE && t < T.so ? 0 : 1) * loop * (t < T.so ? 1 - ramp(z, 1.6, 1.85) : ramp(t, T.so + 0.4, T.so + 1.0))} />
        <circle cx={0} cy={0} r={r} {...SW} strokeWidth={3} stroke={C.graphite} />
        {t > T.so + 0.6 ? <Label p={polar(EARTH, 375, 150)} z={z} text="Last year" color={C.mist} opacity={ramp(t, T.farther - 0.2, T.farther + 0.2) * loop} anchor="end" /> : null}
        {/* the tidal bulge: an oval of ocean, dragged ahead of the Moon by Earth's spin */}
        {b > 0.01 ? (
          <g opacity={loop}>
            {volt > 0.01 ? <ellipse cx={0} cy={0} rx={rx} ry={ry} transform={`rotate(${bAng})`} {...SW} strokeWidth={30} stroke={C.volt} opacity={0.4 * volt} filter="url(#halo)" /> : null}
            <ellipse cx={0} cy={0} rx={rx} ry={ry} transform={`rotate(${bAng})`} {...SW} stroke={bulgeCol} />
            {lead > 1 ? <line x1={0} y1={0} x2={polar(EARTH, rx + 70, bAng)[0]} y2={polar(EARTH, rx + 70, bAng)[1]} {...SW} strokeDasharray="4 14" stroke={mix(C.mist, C.graphite, tideDone)} /> : null}
            {tideScene > 0.01 ? <line x1={0} y1={0} x2={M[0]} y2={M[1]} {...SW} strokeDasharray="4 14" stroke={C.graphite} opacity={1 - clock} /> : null}
            <Label p={polar(EARTH, rx + 105, bAng - 4)} z={z} text="Ahead" color={C.white} opacity={win(t, T.ahead, T.bulge - 0.2, 0.2)} anchor="end" />
            <Label p={polar(EARTH, rx + 60, bAng + 180)} z={z} text="Tidal bulge" color={C.mist} opacity={ramp(t, T.oceans, T.oceans + 0.3) * (1 - tideDone)} />
          </g>
        ) : null}
        {/* the Moon pulls on the oceans */}
        {[-16, 0, 16].map((d, k) => <Arrow key={k} a={polar(EARTH, ER + 30, th + d)} b={polar(EARTH, ER + 130, th + d * 0.6)} u={easeOut(ramp(t, T.pulls - 0.05 + k * 0.06, T.pulls + 0.35 + k * 0.06))} color={C.mist} z={z} opacity={pullOn} />)}
        {/* the bulge pulls back on the Moon: mostly towards Earth, but a little forward along the orbit */}
        <Arrow a={M} b={L(M, tip, 0.42)} u={backU} color={mix(C.white, C.mist, ramp(t, T.flings - 0.2, T.flings + 0.2))} z={z} opacity={backOn} />
        <Arrow a={M} b={[M[0] + fwd[0] * 105, M[1] + fwd[1] * 105]} u={fwdU} color={C.white} z={z} opacity={backOn} />
        <Label p={[M[0] + fwd[0] * 120 - 12, M[1] + fwd[1] * 120 - 22]} z={z} text="Forward" color={C.white} opacity={win(t, T.back + 0.7, T.tidal - 0.3, 0.2)} anchor="end" />
        <Arrow a={[M[0] + toMoon[0] * 34, M[1] + toMoon[1] * 34]} b={[M[0] + toMoon[0] * 120, M[1] + toMoon[1] * 120]} u={outU} color={C.white} z={z} opacity={win(t, T.flings - 0.05, T.tidal - 0.3, 0.2)} />
        <Label p={[M[0] + 60, M[1] - 40]} z={z} text="Outward" color={C.white} opacity={win(t, T.outward, T.tidal - 0.3, 0.2)} anchor="start" />
        {/* laser ranging */}
        {laserOn > 0.01 ? (
          <g opacity={laserOn}>
            <line x1={EP[0]} y1={EP[1]} x2={L(EP, MP, outL)[0]} y2={L(EP, MP, outL)[1]} {...SW} strokeWidth={3} stroke={C.white} />
            {backL > 0 && backL < 1 ? <circle cx={L(MP, EP, backL)[0]} cy={L(MP, EP, backL)[1]} r={9 / z} fill={C.white} /> : null}
            {outL > 0 && outL < 1 ? <circle cx={L(EP, MP, outL)[0]} cy={L(EP, MP, outL)[1]} r={9 / z} fill={C.white} /> : null}
            <circle cx={EP[0]} cy={EP[1]} r={8 / z} fill={hit > 0.2 ? C.volt : C.mist} />
            <Label p={[EP[0] - 26, EP[1] + 58]} z={z} text="Laser" color={C.ash} opacity={ramp(t, LASER0 - 0.2, LASER0 + 0.1) * near} anchor="end" />
          </g>
        ) : null}
        {hit > 0.01 ? <Glow p={EP} r={50} color={C.volt} opacity={hit * 1.6} /> : null}
        <Ring p={EP} r={80} t={t} t0={LASER_BACK} color={C.volt} />
        {/* Earth: outline, rim ticks that turn with its spin, and (when it "pays") a clock hand */}
        <circle cx={0} cy={0} r={ER} {...SW} fill={C.void} stroke={C.white} />
        <g transform={`rotate(${-spin(t)})`}>
          {Array.from({ length: 12 }, (_, k) => { const a = polar(EARTH, ER - 9, k * 30), q = polar(EARTH, ER - 22 - 6 * clock * (1 - clockDone), k * 30); return <line key={k} x1={a[0]} y1={a[1]} x2={q[0]} y2={q[1]} {...SW} stroke={mix(C.ash, C.white, clock * (1 - clockDone))} />; })}
        </g>
        {clock > 0.01 ? (
          <g opacity={clock * loop}>
            <Glow p={polar(EARTH, 50, hand)} r={34} opacity={(1 - clockDone) * (1 - ramp(t, T.fourH - 0.3, T.fourH + 0.2))} />
            <line x1={0} y1={0} x2={polar(EARTH, ER - 34, hand)[0]} y2={polar(EARTH, ER - 34, hand)[1]} {...SW} strokeWidth={6} stroke={mix(C.white, C.mist, clockDone)} />
            <circle cx={0} cy={0} r={7} fill={mix(C.white, C.mist, clockDone)} />
          </g>
        ) : null}
        {spinArrow > 0.01 ? (
          <g opacity={spinArrow * (1 - clock)}>
            <path d={`M${polar(EARTH, 62, 60).join(',')} A62,62 0 0 0 ${polar(EARTH, 62, -50).join(',')}`} {...SW} stroke={C.mist} />
            <g transform={`translate(${polar(EARTH, 62, -50).join(' ')}) rotate(${-50 - 90}) scale(${1 / z})`}><path d="M5,0 L-17,-11 L-17,11 Z" fill={C.mist} /></g>
            <Label p={[-8, 10]} z={z} text="Spin" color={C.mist} />
          </g>
        ) : null}
        <Label p={[0, ER + 62 / z]} z={z} text="Earth" color={C.ash} opacity={hookLabels * near * (t < 0.3 ? t / 0.3 : 1)} />
        {/* a fossil coral: one growth ring a day, about 400 rings a year back then */}
        {coralPop > 0 ? (
          <g transform={`translate(${coral[0]} ${coral[1]}) scale(${coralPop})`} opacity={loop}>
            {(() => { const col = mix(C.white, C.mist, coralDone); const pts: string[] = []; for (let a = 0; a <= 360; a += 6) { const rr = 50 + 4 * Math.sin((a * Math.PI) / 180 * 12); pts.push(polar([0, 0], rr, a).join(',')); } return (
              <>
                <polygon points={pts.join(' ')} {...SW} stroke={col} />
                {[10, 19, 28, 37].map((rr, k) => (ringsU * 4 > k ? <circle key={rr} r={rr} {...SW} strokeWidth={3} stroke={col} opacity={clamp(ringsU * 4 - k, 0, 1)} /> : null))}
                <circle r={3} fill={col} />
              </>
            ); })()}
          </g>
        ) : null}
        <Label p={[coral[0] + 78, coral[1] - 6]} z={z} text="400 million" color={C.mist} opacity={ramp(t, T.fourH + 0.1, T.fourH + 0.4) * (1 - coralDone)} anchor="start" />
        <Label p={[coral[0] + 78, coral[1] + 32 / z - 6]} z={z} text="years ago" color={C.mist} opacity={ramp(t, T.fourH + 0.1, T.fourH + 0.4) * (1 - coralDone)} anchor="start" />
        <Label p={[coral[0], coral[1] + 62 + 40 / z]} z={z} text="Coral fossil" color={C.ash} opacity={ramp(t, T.ancient, T.ancient + 0.3) * (1 - coralDone)} />
        {/* the Moon (the hero: the one glowing object), with the mirror the astronauts left */}
        <Glow p={M} r={MR * 2.2} opacity={moonGlow} />
        <Ring p={M} r={70} t={t} t0={T.four} />
        <Ring p={M} r={70} t={t} t0={T.outward} />
        <Ring p={M} r={60} t={t} t0={T.goodbye} />
        {mirrorPop > 0 ? (
          <g opacity={loop}>
            <g transform={`translate(${MP[0]} ${MP[1]}) rotate(${th}) scale(${mirrorPop})`}><rect x={-5} y={-6} width={7} height={12} {...SW} strokeWidth={3} stroke={C.white} /></g>
            <line x1={polar(M, MR, flagDir)[0]} y1={polar(M, MR, flagDir)[1]} x2={polar(M, MR + 17 * mirrorPop, flagDir)[0]} y2={polar(M, MR + 17 * mirrorPop, flagDir)[1]} {...SW} strokeWidth={3} stroke={C.white} />
            <polygon points={[polar(M, MR + 17, flagDir), polar(M, MR + 12, flagDir + 20), polar(M, MR + 9, flagDir)].map((q) => q.join(',')).join(' ')} fill={C.white} opacity={mirrorPop > 0.9 ? 1 : 0} />
            <Label p={[MP[0] - 16, MP[1] + 16]} z={z} text="Mirror" color={C.mist} opacity={win(t, T.mirrors + 0.1, T.bounce - 0.3, 0.2)} anchor="end" />
          </g>
        ) : null}
        <circle cx={M[0]} cy={M[1]} r={MR} fill={moonCol} />
        <Label p={[M[0] + (MR + 22 / z), M[1] + 10 / z]} z={z} text="Moon" color={C.ash} opacity={hookLabels * near * (t < 0.3 ? t / 0.3 : 1)} anchor="start" />
        <Label p={[M[0] + (MR + 22 / z), M[1] + 10 / z]} z={z} text="Tonight" color={C.white} opacity={ramp(t, T.farther - 0.2, T.farther + 0.2) * loop} anchor="start" />

        {/* ================= B: "JUST PARKED UP THERE" ================= */}
        {bOn > 0.01 ? (
          <g opacity={bOn}>
            <Glow p={B_MOON} r={110} opacity={(1 - bDim) * (t < T.but ? 1 : 0)} />
            <circle cx={B_MOON[0]} cy={B_MOON[1]} r={80} {...SW} fill={C.void} stroke={mix(C.white, C.mist, bDim)} />
            {[[-28, -22, 16], [24, 12, 22], [-14, 34, 10]].map(([dx, dy, rr], k) => <circle key={k} cx={B_MOON[0] + dx} cy={B_MOON[1] + dy} r={rr} {...SW} strokeWidth={3} stroke={C.ash} />)}
            <line x1={B[0] - 430} y1={B_GROUND} x2={B[0] + 430} y2={B_GROUND} {...SW} stroke={C.mist} />
            {[-210, 0, 210].map((dx, k) => { const s = pop(t, T.most + k * 0.1, 0.3); return <g key={dx} transform={`translate(${B[0] + dx} ${B_GROUND}) scale(${s})`}><Figure x={0} y={0} s={0.5} color={C.mist} /></g>; })}
            {[-210, 0, 210].map((dx) => <line key={dx} x1={B[0] + dx} y1={B_GROUND - 230} x2={L([B[0] + dx, B_GROUND - 230], B_MOON, 0.55)[0]} y2={L([B[0] + dx, B_GROUND - 230], B_MOON, 0.55)[1]} {...SW} strokeWidth={3} strokeDasharray="3 13" stroke={C.graphite} />)}
            {/* three quick scenes */}
            <g transform={`translate(${TRI[0]} ${TRI_Y}) scale(${tri[0].s})`}>
              <circle r={72} {...SW} stroke={tri[0].col} />
              {[[-22, -18, 13], [20, 14, 18], [-8, 34, 8]].map(([dx, dy, rr], k) => <circle key={k} cx={dx} cy={dy} r={rr} {...SW} strokeWidth={3} stroke={tri[0].col} opacity={0.7} />)}
            </g>
            <g transform={`translate(${TRI[1]} ${TRI_Y}) scale(${tri[1].s})`}>
              <line x1={52} y1={-78} x2={52} y2={78} {...SW} stroke={tri[1].col} />
              {[-50, -10, 30].map((yy) => <line key={yy} x1={40} y1={yy} x2={64} y2={yy} {...SW} strokeWidth={3} stroke={tri[1].col} />)}
              <polyline points={Array.from({ length: 30 }, (_, k) => { const x = -90 + k * 6; return `${x},${lerp(48, -34, tideRise) + 9 * Math.sin(x * 0.07 + t * 4)}`; }).join(' ')} {...SW} stroke={tri[1].col} />
            </g>
            <g transform={`translate(${TRI[2]} ${TRI_Y}) scale(${tri[2].s})`}>
              <circle cx={-14} r={62} {...SW} stroke={tri[2].col} />
              <circle cx={lerp(150, 26, shadow)} r={62} {...SW} fill={C.void} stroke={mix(C.mist, C.ash, 0.3)} />
            </g>
            {['Full moon', 'High tide', 'Eclipse'].map((txt, k) => <Label key={txt} p={[TRI[k], TRI_Y + 132]} z={z} text={txt} color={C.ash} opacity={tri[k].s > 0.5 ? 1 : 0} />)}
          </g>
        ) : null}
      </g>
    </svg>
  );
};

// ---------- counters and the stamp ----------
export const Overlays: React.FC<{ t: number }> = ({ t }) => {
  const cm = (3.8 * easeInOut(ramp(t, 0.3, T.year + 0.2))).toFixed(1);
  const cmOn = ramp(t, 0.05, 0.45) * (1 - ramp(t, 5.0, 5.4));
  const hours = Math.round(lerp(22, 24, easeInOut(ramp(t, T.ancient, T.recorded + 0.7))));
  const hoursOn = ramp(t, T.twentyTwo - 0.25, T.twentyTwo) * (1 - ramp(t, T.how - 0.4, T.how - 0.1));
  const sec = clamp(t - LASER0, 0, ROUND_TRIP);
  const secOn = ramp(t, LASER0 - 0.3, LASER0) * (1 - ramp(t, T.so + 1.3, T.so + 1.7));
  const stampOn = 1 - ramp(t, T.pays - 0.45, T.pays - 0.1);
  const volt = ramp(t, T.tidal + 0.02, T.tidal + 0.25) * (1 - ramp(t, T.tidal + 0.9, T.tidal + 1.5));
  return (
    <>
      <Counter value={cm} label="Centimetres farther this year" opacity={cmOn} />
      <Counter value={`${hours}`} label={hours < 24 ? 'Hours in a day · 400 million years ago' : 'Hours in a day · today'} opacity={hoursOn} />
      <Counter value={`${sec.toFixed(2)} s`} label="Laser round trip" opacity={secOn} />
      <Stamp lines={['TIDAL', 'FRICTION']} scale={pop(t, T.tidal + 0.02, 0.35)} opacity={stampOn} top={690} color={volt > 0.4 ? C.volt : C.white} />
    </>
  );
};
