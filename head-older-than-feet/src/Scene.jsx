// "Your head is older than your feet": one continuous shot on a black canvas.
import React from 'react';
import { C, FONT } from './kit/palette.js';
import { Defs, Figure, Clock, Label, ScreenLabel, Pill, Ring, Dot, SW } from './kit/elements.jsx';
import { sent, beat, END, clamp, lerp, easeOut, easeInOut, ramp, pop } from './timing.js';

const st = (n) => sent(n).start;
const E = { x: 0, y: 1920, R: 1800 }; // Earth: the figure stands on top of it
const F = { x: 0, y: 120 }; // the figure's feet
const HEAD = { x: 165, y: -250 }, FEET = { x: 165, y: 80 };

// ---------- camera: eased moves (0.6-1.2 s) between holds; slow push-in drift during holds ----------
const KEYS = [
  { t: 0, x: 70, y: -90, z: 1.22 },
  { t: st(2), x: 0, y: -80, z: 0.78 },
  { t: st(3), x: -1500, y: -150, z: 1.0 },
  { t: st(4), x: 1720, y: -120, z: 0.72 },
  { t: st(5), x: 40, y: -110, z: 1.08 },
  { t: st(6), x: 0, y: 260, z: 0.4 },
  { t: st(9), x: -380, y: 0, z: 0.5 },
  { t: st(10) - 0.2, x: 0, y: 260, z: 0.42 },
  { t: st(11), x: 1100, y: -1390, z: 1.0 },
  { t: st(12), x: 80, y: -60, z: 0.9 },
  { t: st(14), x: 820, y: -260, z: 0.235 },
  { t: st(15), x: 1050, y: -60, z: 0.235 },
  { t: st(16), x: 40, y: -110, z: 1.0 },
  { t: st(18), x: 70, y: -90, z: 1.22 },
];
const DRIFT = 0.015; // about 3 % per 2 s
function camAt(t) {
  let i = 0; while (i + 1 < KEYS.length && KEYS[i + 1].t <= t) i++;
  const k = KEYS[i], dur = (key) => clamp(0.6 + Math.abs(Math.log(key.z / (KEYS[KEYS.indexOf(key) - 1]?.z || key.z))) * 0.5 + Math.hypot(key.x - (KEYS[KEYS.indexOf(key) - 1]?.x ?? key.x), key.y - (KEYS[KEYS.indexOf(key) - 1]?.y ?? key.y)) / 4000, 0.6, 1.2);
  const hold = (j, tt) => { const kk = KEYS[j]; const t0 = kk.t + (j ? dur(kk) : 0); return { x: kk.x, y: kk.y, z: kk.z * (1 + DRIFT * Math.max(0, tt - t0)) }; };
  if (i > 0 && t < k.t + dur(k)) {
    const from = hold(i - 1, k.t), p = easeInOut((t - k.t) / dur(k));
    // zoom interpolates in log space so pull-outs feel even
    return { x: lerp(from.x, k.x, p), y: lerp(from.y, k.y, p), z: Math.exp(lerp(Math.log(from.z), Math.log(k.z), p)) };
  }
  return hold(i, t);
}

const tick = (t, speed, ph = 0) => t * speed + ph;
const fadeTo = (t, a, b, from, to) => lerp(from, to, easeInOut(ramp(t, a, b)));

function Grid({ t, bend, color, opacity }) {
  const lines = [];
  // each grid point is pulled toward Earth, more strongly the closer it is (a picture of curved spacetime)
  const P = (x, y) => { const dx = E.x - x, dy = E.y - y, d = Math.max(1, Math.hypot(dx, dy)); const m = bend * 320 * Math.pow(E.R / Math.max(d, E.R), 2); return [x + (dx / d) * m, y + (dy / d) * m]; };
  for (let gx = -2200; gx <= 2200; gx += 220) { const pts = []; for (let gy = -1500; gy <= 1900; gy += 80) pts.push(P(gx, gy)); lines.push(pts); }
  for (let gy = -1500; gy <= 1900; gy += 220) { const pts = []; for (let gx = -2200; gx <= 2200; gx += 80) pts.push(P(gx, gy)); lines.push(pts); }
  return <g opacity={opacity}>{lines.map((pts, i) => <polyline key={i} points={pts.map((p) => p.join(',')).join(' ')} {...SW} strokeWidth={3} stroke={color} />)}</g>;
}

function BunkBed({ t, x, on, z }) {
  const op = on, top = 0.5 * 1.12, bot = 0.5;
  const hl = ramp(t, beat(3, 'faster') - 0.2, beat(3, 'faster') + 0.2);
  return (
    <g opacity={op}>
      {[-200, 200].map((dx) => <line key={dx} x1={x + dx} y1={120} x2={x + dx} y2={-520} {...SW} stroke={C.mist} />)}
      {[-60, -360].map((yy) => <line key={yy} x1={x - 200} y1={yy} x2={x + 200} y2={yy} {...SW} stroke={C.mist} />)}
      <Figure x={x + 150} y={-394} s={0.55} lying color={C.white} />
      <Figure x={x + 150} y={-94} s={0.55} lying color={C.mist} />
      <Clock x={x - 300} y={-430} r={44} turns={tick(t, top)} glow={hl > 0.5} color={C.white} />
      <Clock x={x - 300} y={-150} r={44} turns={tick(t, bot)} color={C.mist} />
      <ScreenLabel x={x - 300} y={-500} z={z} text="TOP BUNK" />
      <ScreenLabel x={x - 300} y={-75} z={z} text="BOTTOM BUNK" />
    </g>
  );
}
function MountainBeach({ t, x, on, z }) {
  const hl = ramp(t, beat(4, 'ahead') - 0.2, beat(4, 'ahead') + 0.2);
  const wave = []; for (let i = 0; i <= 40; i++) { const xx = x + 420 + i * 12; wave.push([xx, 170 + 10 * Math.sin(i * 0.8 - t * 3)]); }
  return (
    <g opacity={on}>
      <polyline points={`${x - 380},120 ${x - 120},-260 ${x},-430 ${x + 140},-250 ${x + 360},120`} {...SW} stroke={C.mist} />
      <polyline points={`${x - 70},-360 ${x},-430 ${x + 60},-370`} {...SW} stroke={C.white} />
      <line x1={x + 360} y1={120} x2={x + 940} y2={120} {...SW} stroke={C.mist} />
      <polyline points={wave.map((p) => p.join(',')).join(' ')} {...SW} stroke={C.ash} />
      <Clock x={x} y={-540} r={46} turns={tick(t, 0.56)} color={C.white} glow={hl > 0.5} />
      <Clock x={x + 640} y={20} r={46} turns={tick(t, 0.5)} color={C.mist} />
      <ScreenLabel x={x} y={-620} z={z} text="MOUNTAIN" />
      <ScreenLabel x={x + 640} y={-50} z={z} text="BEACH" />
    </g>
  );
}

export function World({ t }) {
  const cam = camAt(t);
  const z = cam.z;
  // figure: stands, lies down for "You stand up", stands again
  const lying = t >= st(3) && t < st(5) + 0.05 ? 1 : 1 - easeOut(ramp(t, st(5), beat(5, 'up') + 0.35));
  const standAngle = t < st(3) ? 0 : -90 * (t < st(5) ? 1 : lying);
  // body clocks: shown at the very start (preview of the end), shrink away ("rewind"), return at the end
  const bodyClocks = Math.max(1 - ramp(t, 0.5, 1.4), ramp(t, beat(17, 'part') - 0.2, beat(17, 'part') + 0.5));
  const headFast = ramp(t, beat(5, 'head') - 0.2, beat(5, 'head') + 0.2) * (t < st(6) ? 1 : 0);
  const crowdOn = ramp(t, st(2), st(2) + 0.4) * (t < st(3) + 0.8 ? 1 : 0.35);
  const gridOn = ramp(t, st(6) + 0.2, st(6) + 1.2) * (1 - ramp(t, st(11), st(11) + 0.6) * 0.75);
  const bend = easeInOut(ramp(t, beat(7, 'pull'), beat(8, 'time') + 0.4));
  const volt1 = ramp(t, st(10) + 0.05, st(10) + 0.3) * (1 - ramp(t, st(10) + 1.2, st(10) + 1.8));
  const gridColor = volt1 > 0.02 ? C.volt : C.graphite;
  const gridOp = gridOn * (volt1 > 0.02 ? 0.55 + 0.45 * volt1 : 1);
  const colOn = ramp(t, st(9) - 0.2, st(9) + 0.4) * (1 - ramp(t, st(11), st(11) + 0.6));
  const labOn = ramp(t, st(11) + 0.2, st(11) + 0.8) * (t < st(12) + 0.6 ? 1 : t < st(14) - 0.3 ? 0.35 : 0.1);
  const satOn = ramp(t, st(14) - 0.2, st(14) + 0.6) * (1 - ramp(t, st(16), st(16) + 0.6));
  const theta = lerp(0.18, 0.5, ramp(t, st(14), st(16)));
  const Rorb = 2750;
  const sat = { x: E.x + Rorb * Math.sin(theta), y: E.y - Rorb * Math.cos(theta) };
  const beamOn = ramp(t, beat(14, 'feel') - 0.1, beat(14, 'feel') + 0.3) * (1 - ramp(t, st(16) - 0.4, st(16)));
  const thp = 0.2 + 0.12 * easeInOut(ramp(t, beat(15, 'drift') - 0.3, st(16)));
  const pin = { x: E.x + E.R * Math.sin(thp), y: E.y - E.R * Math.cos(thp) };
  const headVolt = ramp(t, beat(18, 'ahead') - 0.1, beat(18, 'ahead') + 0.2);
  const s12Head = ramp(t, st(12), st(12) + 0.4) * (t < st(14) ? 1 : 0);
  const orbitPts = []; for (let a = -0.4; a <= 1.2; a += 0.02) orbitPts.push([E.x + Rorb * Math.sin(a), E.y - Rorb * Math.cos(a)]);
  const travelled = orbitPts.filter((p, i) => -0.4 + i * 0.02 <= theta);
  const figColor = t >= st(6) && t < st(12) ? C.mist : C.white;

  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
      <Defs />
      <rect width={1080} height={1920} fill={C.void} />
      <g transform={`translate(540 960) scale(${z}) translate(${-cam.x} ${-cam.y})`}>
        {gridOn > 0.01 ? <Grid t={t} bend={bend} color={gridColor} opacity={gridOp} /> : null}
        {/* Earth (always there, below the figure) */}
        <circle cx={E.x} cy={E.y} r={E.R} {...SW} fill={C.void} stroke={t >= st(6) ? C.white : C.graphite} />
        {t >= st(6) ? <ScreenLabel x={E.x} y={E.y - E.R + 260} z={z} text="EARTH" color={C.ash} opacity={1 - ramp(t, st(12) - 0.3, st(12)) + ramp(t, st(14), st(14) + 0.4)} /> : null}
        {/* clock column: lower = slower */}
        {colOn > 0.01 ? (
          <g opacity={colOn}>
            {[[-1150, 0.62, C.white], [-750, 0.57, C.white], [-350, 0.52, C.mist], [40, 0.46, C.mist]].map(([y, sp, col], i) => <Clock key={i} x={-650} y={y} r={46} turns={tick(t, sp, i * 0.13)} color={col} />)}
            <ScreenLabel x={-650} y={-1250} z={z} text="FASTER" color={C.mist} />
            <ScreenLabel x={-650} y={150} z={z} text="SLOWER" color={C.mist} />
          </g>
        ) : null}
        {/* crowd: everyone's clock in sync */}
        {crowdOn > 0.01 ? (
          <g opacity={crowdOn}>
            {[-560, -300, 300, 560].map((dx, i) => (
              <g key={dx} transform={`translate(${dx} 120) scale(${pop(t, st(2) + i * 0.12)}) translate(${-dx} -120)`}>
                <Figure x={dx} y={120} s={0.6} color={C.mist} />
                <Clock x={dx} y={-215} r={30} turns={tick(t, 0.5)} color={C.mist} />
              </g>
            ))}
          </g>
        ) : null}
        <BunkBed t={t} x={-1500} on={ramp(t, st(3) - 0.3, st(3) + 0.2) * (t < st(4) + 0.6 ? 1 : t < st(6) ? 0.35 : 0.12)} z={z} />
        <MountainBeach t={t} x={1450} on={ramp(t, st(4) - 0.3, st(4) + 0.2) * (t < st(5) + 0.6 ? 1 : t < st(6) ? 0.35 : 0.12)} z={z} />
        {/* lab clocks, 33 cm apart */}
        {labOn > 0.01 ? (
          <g opacity={labOn}>
            <Clock x={1100} y={-1570} r={70} turns={tick(t, 0.53)} color={C.white} />
            <Clock x={1100} y={-1210} r={70} turns={tick(t, 0.5)} color={C.mist} />
            <polyline points="1250,-1570 1290,-1570 1290,-1210 1250,-1210" {...SW} stroke={C.mist} />
            <Pill x={1420} y={-1390} z={z} text="33 CM" />
            <ScreenLabel x={1100} y={-1680} z={z} text="2010" color={C.ash} />
          </g>
        ) : null}
        {/* GPS satellite, orbit, beam, drifting map pin */}
        {satOn > 0.01 ? (
          <g opacity={satOn}>
            <polyline points={orbitPts.map((p) => p.join(',')).join(' ')} {...SW} stroke={C.graphite} />
            <polyline points={travelled.map((p) => p.join(',')).join(' ')} {...SW} stroke={C.white} />
            {beamOn > 0.01 ? <line x1={sat.x} y1={sat.y} x2={pin.x} y2={pin.y} {...SW} strokeWidth={5} stroke={C.volt} opacity={beamOn} /> : null}
            <g transform={`translate(${sat.x} ${sat.y}) rotate(${(theta * 180) / Math.PI}) scale(${1 / z})`}>
              <rect x={-22} y={-22} width={44} height={44} fill={C.white} />
              <rect x={-82} y={-12} width={50} height={24} {...SW} stroke={C.white} />
              <rect x={32} y={-12} width={50} height={24} {...SW} stroke={C.white} />
            </g>
            <ScreenLabel x={sat.x} y={sat.y - 70 / z} z={z} text="GPS SATELLITE" color={C.mist} />
            <g transform={`translate(${pin.x} ${pin.y}) rotate(${(thp * 180) / Math.PI}) scale(${1 / z})`}>
              <path d="M0,0 C-18,-26 -26,-40 -26,-56 A26,26 0 1 1 26,-56 C26,-40 18,-26 0,0 Z" fill={C.white} />
              <circle cx={0} cy={-56} r={9} fill={C.void} />
            </g>
            {ramp(t, beat(15, 'drift') - 0.2, beat(15, 'drift') + 0.2) > 0 ? <Pill x={pin.x + 330 / z} y={pin.y - 160 / z} z={z} text="~10 KM / DAY" opacity={ramp(t, beat(15, 'drift') - 0.2, beat(15, 'drift') + 0.2)} /> : null}
          </g>
        ) : null}
        {/* the figure ("you") with its clocks */}
        <g transform={`rotate(${standAngle} ${F.x} ${F.y})`}>
          <Figure x={F.x} y={F.y} color={figColor} />
          <Clock x={HEAD.x} y={HEAD.y} r={46} turns={tick(t, 0.5 + 0.06 * Math.max(headFast, headVolt, s12Head))} color={C.white} glow={headFast > 0.5 || s12Head > 0.5 || headVolt > 0.1} glowColor={headVolt > 0.1 ? C.volt : C.white} />
          <Clock x={FEET.x} y={FEET.y} r={46} turns={tick(t, 0.5)} color={headFast > 0.5 || s12Head > 0.5 ? C.mist : C.white} />
          {bodyClocks > 0.01 ? [[-150, -60, 0.53], [150, -60, 0.53], [0, -110, 0.54], [-150, 40, 0.51], [0, 30, 0.515]].map(([dx, dy, sp], i) => (
            <g key={i} transform={`translate(${dx} ${dy}) scale(${bodyClocks}) translate(${-dx} ${-dy})`}><Clock x={dx} y={dy} r={24} turns={tick(t, sp, i * 0.2)} color={C.white} /></g>
          )) : null}
          <Ring x={HEAD.x} y={HEAD.y} r={90} t={t} t0={beat(1, 'older')} />
          <Ring x={HEAD.x} y={HEAD.y} r={90} t={t} t0={beat(18, 'ahead')} color={C.volt} />
        </g>
        {t < st(3) || t >= st(16) ? <ScreenLabel x={F.x - 120} y={F.y + 70} z={z} text="YOU" color={C.ash} /> : null}
      </g>
    </svg>
  );
}

// ---------- screen-space overlays: live counter and the named-concept stamp ----------
export function Overlays({ t }) {
  const c1 = (1 - ramp(t, st(3) - 0.3, st(3))) , c3 = ramp(t, st(18) - 0.2, st(18) + 0.2);
  const c2 = ramp(t, st(12), st(12) + 0.3) * (1 - ramp(t, st(14), st(14) + 0.3));
  const tinyS = 1 - 0.3 * easeInOut(ramp(t, st(13), st(13) + 0.3));
  const counter = (val, cap, op, sc = 1) => op > 0.01 ? (
    <div style={{ position: 'absolute', left: 0, right: 160, top: 1290, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: op, transform: `scale(${sc})` }}>
      <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 140, color: C.white, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{val}</div>
      <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 24, color: C.mist, letterSpacing: '0.3em', marginTop: 14 }}>{cap}</div>
    </div>
  ) : null;
  const ns = (a, b) => Math.round(460 * easeOut(ramp(t, a, b)));
  const stampP = pop(t, st(10) + 0.05, 0.35), stampOn = 1 - ramp(t, st(11) - 0.3, st(11) + 0.1);
  return (
    <>
      {counter(ns(0, 1.6), 'NANOSECONDS OLDER · LIFETIME', c1)}
      {counter((0.46 * easeOut(ramp(t, st(12) + 0.2, beat(12, 'microsecond') + 0.3))).toFixed(2), 'MICROSECONDS GAINED · LIFETIME', c2, tinyS)}
      {counter(ns(st(18), END - 0.3), 'NANOSECONDS OLDER · LIFETIME', c3)}
      {stampP > 0 && stampOn > 0 ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 820, display: 'flex', justifyContent: 'center', opacity: stampOn }}>
          <div style={{ transform: `rotate(-6deg) scale(${stampP * 1.0})`, border: `8px solid ${C.white}`, borderRadius: 14, padding: '22px 38px', textAlign: 'center', boxShadow: `0 0 40px rgba(255,255,255,0.25)` }}>
            <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 82, color: C.white, lineHeight: 1.02, letterSpacing: '0.01em' }}>GRAVITATIONAL</div>
            <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 82, color: C.white, lineHeight: 1.02, letterSpacing: '0.01em' }}>TIME DILATION</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
