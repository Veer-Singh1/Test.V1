// "Why the sky should be purple": one continuous shot on a black canvas.
// The sky is drawn as air molecules (dots) lit by the light they scatter; colour only exists as light.
import React from 'react';
import { C, FONT } from './kit/palette.js';
import { Defs, Figure, ScreenLabel, Pill, Ring, SW } from './kit/elements.jsx';
import { sent, beat, END, clamp, lerp, easeOut, easeInOut, ramp, pop } from './timing.js';

const st = (n) => sent(n).start;
const en = (n) => sent(n).end;
export const K = { red: '#FF4B4B', orange: '#FF9442', yellow: '#FFD84A', green: '#46D27A', blue: '#5A8BFF', violet: '#A35CFF' };
const SPECTRUM = [K.red, K.orange, K.yellow, K.green, K.blue, K.violet];

// ---------- helpers ----------
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hx = (a) => '#' + a.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
const mix = (a, b, p) => { const A = rgb(a), B = rgb(b); p = clamp(p, 0, 1); return hx(A.map((v, i) => v + (B[i] - v) * p)); };
const bump = (t, t0, d = 0.5) => Math.sin(Math.PI * ramp(t, t0, t0 + d));
const hash = (i) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const L = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
const shorten = (a, b, d) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]); return L(a, b, 1 - d / l); };
const distSeg = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1]; const u = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy), 0, 1); return Math.hypot(p[0] - a[0] - u * dx, p[1] - a[1] - u * dy); };
function Seg({ a, b, u0 = 0, u1 = 1, color, w = 4, opacity = 1, filter }) {
  if (u1 - u0 <= 0.001 || opacity <= 0.01) return null;
  const p = L(a, b, u0), q = L(a, b, u1);
  return <line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} {...SW} strokeWidth={w} stroke={color} opacity={opacity} filter={filter} />;
}
function Arrow({ a, b, u = 1, color, z, opacity = 1, w = 4, filter }) {
  if (u <= 0.01 || opacity <= 0.01) return null;
  const q = L(a, b, u), ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  return (
    <g opacity={opacity} filter={filter}>
      <line x1={a[0]} y1={a[1]} x2={q[0]} y2={q[1]} {...SW} strokeWidth={w} stroke={color} />
      <g transform={`translate(${q[0]} ${q[1]}) rotate(${ang}) scale(${1 / z})`}><path d="M4,0 L-16,-10 L-16,10 Z" fill={color} /></g>
    </g>
  );
}
const Photon = ({ p, color, z, r = 7, opacity = 1 }) => (opacity > 0.01 ? <circle cx={p[0]} cy={p[1]} r={r / z} fill={color} opacity={opacity} /> : null);
const stream = (t, period, n) => { const out = []; for (let k = 0; k < n; k++) { const ph = (((t / period + k / n) % 1) + 1) % 1; out.push({ k, ph }); } return out; };

// ---------- world layout ----------
const RX = 430, RY = 640; // sky dome (half ellipse) above a ground line
const NOON = [0, 0], SUNSET = [1150, 0], MOON = [2300, 0];
const FIG_S = 0.45, HEAD_Y = -372 * FIG_S;
const head = (d) => [d[0], d[1] + HEAD_Y];
const SUN1 = [150, -470], SUN2 = [1150 - 330, -40], SUN3 = [2300 + 150, -470];
const H1 = head(NOON);
const BEAM_END = shorten(SUN1, H1, 30);
const MOLS = [0.32, 0.55, 0.78].map((u) => L(SUN1, H1, u));
const EYE_N = [-125, -235];
// sky dots: a jittered grid inside each dome
function skyDots(c, seed, clear) {
  const out = [];
  let i = 0;
  for (let gy = -615; gy <= -22; gy += 46) for (let gx = -410; gx <= 410; gx += 46) {
    i++;
    const x = gx + (hash(seed + i) - 0.5) * 30, y = gy + (hash(seed + i + 500) - 0.5) * 30;
    if ((x / (RX - 20)) ** 2 + (y / (RY - 20)) ** 2 >= 1) continue;
    const p = [c[0] + x, c[1] + y];
    if (clear && clear(p)) continue;
    out.push({ p, ph: hash(seed + i + 900) * 6.28, h: -y / RY, i });
  }
  return out;
}
const DOTS1 = skyDots(NOON, 1, (p) => distSeg(p, SUN1, H1) < 26 || Math.hypot(p[0] - SUN1[0], p[1] - SUN1[1]) < 80 || (Math.abs(p[0]) < 50 && p[1] > -220));
const DOTS2 = skyDots(SUNSET, 2, (p) => Math.hypot(p[0] - SUN2[0], p[1] - SUN2[1]) < 70 || (Math.abs(p[0] - SUNSET[0]) < 50 && p[1] > -220));
// Earth-scale diagram for sunset
const EARTH = [1150, 2900], RE = 800, RA = 960;
const OBS = [1150, EARTH[1] - RE], OBS_S = 0.22, OBS_H = [OBS[0], OBS[1] - 372 * OBS_S];
const SS_Y = OBS_H[1];
const SS_X0 = 420, SS_IN = EARTH[0] - Math.sqrt(RA * RA - (EARTH[1] - SS_Y) ** 2), SS_END = OBS_H[0] - 22;
const PEEL = { violet: 0.12, blue: 0.3, green: 0.55, yellow: 0.78 };
const ATM = (() => {
  const out = []; let i = 0;
  for (let r = RE + 18; r < RA - 8; r += 34) for (let a = -2.75; a <= -0.4; a += 34 / r) { i++; const rr = r + (hash(i + 3000) - 0.5) * 14, aa = a + (hash(i + 4000) - 0.5) * 0.02; out.push([EARTH[0] + rr * Math.cos(aa), EARTH[1] + rr * Math.sin(aa)]); }
  return out;
})();

// ---------- camera ----------
const KEYS = [
  { t: 0, x: 0, y: -300, z: 1.0 },
  { t: st(3) - 0.1, x: 0, y: -180, z: 0.92 },
  { t: st(5) - 0.15, x: 0, y: -300, z: 1.0 },
  { t: st(6) - 0.15, x: SUNSET[0], y: -300, z: 1.0 },
  { t: st(7) - 0.15, x: MOON[0], y: -300, z: 1.0 },
  { t: st(8) - 0.1, x: 0, y: -300, z: 1.0 },
  { t: st(9) - 0.25, x: 75, y: -318, z: 2.9 },
  { t: st(14) - 0.1, x: 20, y: -300, z: 1.6 },
  { t: st(15) + 0.2, x: 0, y: -300, z: 1.05 },
  { t: st(16) - 0.15, x: 900, y: 2050, z: 1.05 },
  { t: st(18) - 0.15, x: MOON[0], y: -300, z: 1.0 },
  { t: st(19) - 0.1, x: 0, y: -300, z: 0.93 },
];
const DRIFT = 0.015;
function camAt(t) {
  let i = 0; while (i + 1 < KEYS.length && KEYS[i + 1].t <= t) i++;
  const dur = (j) => { const a = KEYS[j - 1], b = KEYS[j]; return clamp(0.6 + Math.abs(Math.log(b.z / a.z)) * 0.5 + Math.hypot(b.x - a.x, b.y - a.y) / 4000, 0.6, 1.2); };
  const hold = (j, tt) => { const kk = KEYS[j]; const t0 = kk.t + (j ? dur(j) : 0); return { x: kk.x, y: kk.y, z: kk.z * (1 + DRIFT * Math.max(0, tt - t0)) }; };
  const k = KEYS[i];
  if (i > 0 && t < k.t + dur(i)) {
    const from = hold(i - 1, k.t), p = easeInOut((t - k.t) / dur(i));
    return { x: lerp(from.x, k.x, p), y: lerp(from.y, k.y, p), z: Math.exp(lerp(Math.log(from.z), Math.log(k.z), p)) };
  }
  return hold(i, t);
}

// ---------- parts ----------
const domePath = (c) => `M${c[0] - RX},${c[1]} A${RX},${RY} 0 0 1 ${c[0] + RX},${c[1]}`;
function Sun({ p, r = 46, color = C.white, opacity = 1 }) {
  return <g opacity={opacity}><circle cx={p[0]} cy={p[1]} r={r * 1.9} fill={color} opacity={0.22} filter="url(#halo)" /><circle cx={p[0]} cy={p[1]} r={r} fill={color} /></g>;
}
function Eye({ p, z, color = C.white, opacity = 1, s = 1 }) {
  if (opacity <= 0.01) return null;
  return (
    <g transform={`translate(${p[0]} ${p[1]}) scale(${s / z})`} opacity={opacity}>
      <path d="M-58,0 Q0,-46 58,0 Q0,46 -58,0 Z" {...SW} fill={C.void} stroke={color} />
      <circle r={20} {...SW} stroke={color} />
      <circle r={8} fill={color} />
    </g>
  );
}
function Glitched({ t, g, children }) {
  // a short digital glitch: the layer jitters sideways and splits into two tinted copies
  if (g <= 0.01) return children;
  const f = Math.floor(t * 30), jx = (hash(f) - 0.5) * 40 * g, jy = (hash(f + 7) - 0.5) * 8 * g;
  return (
    <>
      <g transform={`translate(${jx + 14 * g} ${jy})`} opacity={0.5 * g}>{children}</g>
      <g transform={`translate(${jx - 14 * g} ${-jy})`} opacity={0.5 * g}>{children}</g>
      <g transform={`translate(${jx * 0.4} 0)`}>{children}</g>
    </>
  );
}

// ---------- the world ----------
export function World({ t }) {
  const cam = camAt(t), z = cam.z;
  const near = ramp(z, 0.75, 0.9);
  const tw = (d) => 0.8 + 0.2 * Math.sin(t * 2.2 + d.ph);

  // ---- noon sky colour over time ----
  const pur = beat(2, 'purple');
  const g1 = bump(t, pur - 0.12, 0.45), g2 = bump(t, beat(19, 'real') - 0.1, 0.45);
  const toViolet = Math.max(ramp(t, pur, pur + 0.05) * (1 - ramp(t, st(3) + 0.2, st(3) + 0.7)), ramp(t, beat(19, 'real'), beat(19, 'real') + 0.05) * (1 - ramp(t, beat(20, 'deal'), beat(20, 'deal') + 0.5)));
  const neutral = ramp(t, beat(8, 'actually'), beat(8, 'actually') + 0.6) * (1 - ramp(t, beat(15, 'blue'), beat(15, 'blue') + 0.6));
  const noonCol = mix(mix(K.blue, K.violet, toViolet), C.mist, neutral);
  const molR = 6 + 2 * ramp(t, beat(10, 'molecules') - 0.2, beat(10, 'molecules') + 0.2);

  // ---- noon beam: white, or unbundled into its colours ----
  const unbundle = easeInOut(ramp(t, beat(9, 'every'), beat(9, 'mixed') + 0.2)) * (1 - ramp(t, st(16) - 0.4, st(16)));
  const nrm = (() => { const dx = H1[0] - SUN1[0], dy = H1[1] - SUN1[1], l = Math.hypot(dx, dy); return [-dy / l, dx / l]; })();
  const less = ramp(t, beat(14, 'less'), beat(14, 'less') + 0.4) * (1 - ramp(t, st(16) - 0.4, st(16)));
  const sprayB = (m) => easeOut(ramp(t, beat(10, 'bounced') + m * 0.12, beat(10, 'bounced') + m * 0.12 + 0.4));
  const sprayR = (m) => easeOut(ramp(t, beat(11, 'red') - 0.1 + m * 0.1, beat(11, 'red') + 0.25 + m * 0.1));
  const sprayV = (m) => easeOut(ramp(t, beat(13, 'violet') + m * 0.1, beat(13, 'violet') + 0.4 + m * 0.1));
  const sprayOff = 1 - ramp(t, st(16) - 0.4, st(16));
  const vDim = 1 - 0.6 * less;
  const blurV = ramp(t, beat(14, 'bad') - 0.1, beat(14, 'bad') + 0.3);
  const volt = ramp(t, st(12) + 0.05, st(12) + 0.3) * (1 - ramp(t, st(12) + 1.2, st(12) + 1.8));
  const eye1 = ramp(t, beat(14, 'eyes') - 0.1, beat(14, 'eyes') + 0.25) * (1 - ramp(t, st(16) - 0.4, st(16)));
  const eye2 = ramp(t, beat(20, 'eyes') - 0.1, beat(20, 'eyes') + 0.25) * (1 - ramp(t, st(21) + 0.6, st(21) + 1.2));
  const toEyeB = ramp(t, beat(14, 'eyes'), beat(14, 'eyes') + 0.4), toEyeV = ramp(t, beat(14, 'eyes') + 0.1, beat(14, 'eyes') + 0.5) * (1 - ramp(t, beat(15, 'blue'), beat(15, 'blue') + 0.4));

  // ---- belief: the ocean ----
  const ocean = ramp(t, st(3) - 0.1, st(3) + 0.4) * (1 - ramp(t, st(5) - 0.2, st(5) + 0.6));
  const reflect = ramp(t, beat(3, 'reflecting') - 0.1, beat(3, 'reflecting') + 0.4) * (1 - ramp(t, st(4) + 0.2, st(4) + 0.5));

  // ---- sunset, Earth scale ----
  const noonRay = ramp(t, st(16) - 0.1, st(16) + 0.3);
  const ssHead = lerp(SS_X0, SS_END, easeInOut(ramp(t, beat(16, 'light'), beat(16, 'away') + 0.1)));
  const earthOn = ramp(t, st(16) - 0.4, st(16)) * (1 - ramp(t, st(18) - 0.2, st(18) + 0.3) * 0.7);
  const throughR = ramp(t, beat(17, 'orange') - 0.1, beat(17, 'orange') + 0.3);

  // ---- moon ----
  const noAir = ramp(t, beat(18, 'air') - 0.2, beat(18, 'air') + 0.2);

  const noonBeamPhotons = stream(t, 1.4, 4);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
      <Defs />
      <defs><filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter></defs>
      <rect width={1080} height={1920} fill={C.void} />
      <g transform={`translate(540 960) scale(${z}) translate(${-cam.x} ${-cam.y})`}>
        {/* ================= NOON SKY ================= */}
        <path d={domePath(NOON)} {...SW} stroke={C.graphite} />
        <Glitched t={t} g={Math.max(g1, g2)}>
          <g>{DOTS1.map((d) => <circle key={d.i} cx={d.p[0]} cy={d.p[1]} r={6} fill={noonCol} opacity={tw(d)} />)}</g>
        </Glitched>
        {/* the beam from the sun: white light, or its colours side by side */}
        {unbundle < 0.02 ? (
          <Seg a={SUN1} b={BEAM_END} color={C.white} w={5} opacity={0.85} />
        ) : SPECTRUM.map((c, i) => {
          const off = (i - 2.5) * 2.4 * unbundle, o = [nrm[0] * off, nrm[1] * off];
          return <Seg key={i} a={[SUN1[0] + o[0], SUN1[1] + o[1]]} b={[BEAM_END[0] + o[0], BEAM_END[1] + o[1]]} color={mix(C.white, c, unbundle)} w={3} opacity={i === 5 ? vDim : 1} />;
        })}
        {unbundle < 0.5 ? noonBeamPhotons.map(({ k, ph }) => <Photon key={k} p={L(SUN1, BEAM_END, ph)} color={C.white} z={z} r={8} />) : null}
        {/* scattering at three air molecules */}
        {MOLS.map((m, mi) => (
          <g key={mi} opacity={sprayOff}>
            {volt > 0.01 ? <circle cx={m[0]} cy={m[1]} r={36} fill={C.volt} opacity={0.4 * volt} filter="url(#halo)" /> : null}
            {[0, 1, 2, 3, 4, 5].map((k) => { const a = ((k / 6) * 360 + mi * 23 + 12) * Math.PI / 180; return <Arrow key={`b${k}`} a={m} b={[m[0] + 46 * Math.cos(a), m[1] + 46 * Math.sin(a)]} u={sprayB(mi)} color={volt > 0.3 ? C.volt : K.blue} z={z} w={3} />; })}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => { const a = ((k / 9) * 360 + mi * 41 + 32) * Math.PI / 180; return <Arrow key={`v${k}`} a={m} b={[m[0] + 34 * Math.cos(a), m[1] + 34 * Math.sin(a)]} u={sprayV(mi)} color={K.violet} z={z} w={3} opacity={vDim} filter={blurV > 0.3 ? 'url(#soft)' : undefined} />; })}
            <Arrow a={m} b={[m[0] + 20 * Math.cos(1.2 + mi), m[1] + 20 * Math.sin(1.2 + mi)]} u={sprayR(mi)} color={K.red} z={z} w={3} />
            <circle cx={m[0]} cy={m[1]} r={molR} fill={noonCol} />
          </g>
        ))}
        <Ring x={MOLS[1][0]} y={MOLS[1][1]} r={34} t={t} t0={st(12) + 0.05} color={C.volt} />
        {t > st(9) - 0.3 && t < st(14) + 0.3 ? <Pill x={MOLS[0][0] - 95} y={MOLS[0][1] - 10} z={z} text="AIR MOLECULE" color={C.mist} opacity={ramp(t, beat(10, 'molecules') - 0.1, beat(10, 'molecules') + 0.3) * (1 - ramp(t, st(13) - 0.3, st(13)))} /> : null}
        {t > st(13) && t < st(15) ? <Pill x={MOLS[2][0] + 100} y={MOLS[2][1] + 20} z={z} text="VIOLET ≈ 9× RED" color={K.violet} opacity={ramp(t, beat(13, 'violet'), beat(13, 'violet') + 0.3) * (1 - ramp(t, st(14) + 0.3, st(14) + 0.6))} /> : null}
        {t > st(14) && t < st(16) ?  <ScreenLabel x={SUN1[0] - 70} y={SUN1[1] - 20} z={z} text="LESS VIOLET" color={K.violet} anchor="end" opacity={less * (1 - ramp(t, st(15) + 0.3, st(15) + 0.6))} /> : null}
        {/* what reaches your eye */}
        <Arrow a={MOLS[1]} b={shorten(MOLS[1], EYE_N, 40)} u={toEyeB} color={K.blue} z={z} w={4} opacity={eye1} />
        <Arrow a={MOLS[2]} b={shorten(MOLS[2], EYE_N, 40)} u={toEyeV} color={K.violet} z={z} w={4} opacity={eye1 * 0.5} filter="url(#soft)" />
        <Eye p={EYE_N} z={z} opacity={Math.max(eye1, eye2)} s={0.9} />
        {eye1 > 0.01 ? <ScreenLabel x={EYE_N[0]} y={EYE_N[1] - 52 / z} z={z} text="YOUR EYE" color={C.ash} opacity={eye1 * near} /> : null}
        <Ring x={EYE_N[0]} y={EYE_N[1]} r={40} t={t} t0={beat(15, 'blue')} color={K.blue} />
        <Ring x={EYE_N[0]} y={EYE_N[1]} r={40} t={t} t0={beat(20, 'deal')} color={K.blue} />
        <Sun p={SUN1} />
        {t > st(9) - 0.4 && t < st(15) ?  <ScreenLabel x={SUN1[0] - 60 - 40 / z} y={SUN1[1] + 10 / z} z={z} text="SUN" anchor="end" color={C.ash} opacity={ramp(t, st(9) - 0.4, st(9)) * (1 - ramp(t, st(14) - 0.3, st(14)))} /> : null}
        {/* the ocean (a belief, crossed out) */}
        {ocean > 0.01 ? (
          <g opacity={ocean}>
            {[50, 100, 150].map((y, i) => { const pts = []; for (let x = -520; x <= 520; x += 16) pts.push(`${x},${y + 10 * Math.sin(x * 0.03 + t * 2 + i)}`); return <polyline key={y} points={pts.join(' ')} {...SW} stroke={K.blue} opacity={0.75 - i * 0.2} />; })}
            <ScreenLabel x={300} y={215} z={z} text="OCEAN" color={C.ash} />
            {[-260, 0, 260].map((x, i) => <Arrow key={x} a={[x, 30]} b={[x * 1.15, -300]} u={easeOut(ramp(t, beat(3, 'reflecting') + i * 0.08, beat(3, 'reflecting') + 0.4 + i * 0.08))} color={C.white} z={z} opacity={reflect * 0.8} />)}
          </g>
        ) : null}
        <line x1={-520} y1={0} x2={520} y2={0} {...SW} stroke={C.white} />
        <Figure x={NOON[0]} y={NOON[1]} s={FIG_S} color={mix(C.white, C.ash, ramp(z, 1.4, 2.2))} />
        <Ring x={0} y={-330} r={330} t={t} t0={pur} color={K.violet} />
        <ScreenLabel x={NOON[0]} y={NOON[1] + 64 / z} z={z} text="NOON" color={C.ash} opacity={near * (ocean > 0.5 ? 0 : 1)} />

        {/* ================= SUNSET SKY ================= */}
        <path d={domePath(SUNSET)} {...SW} stroke={C.graphite} />
        {DOTS2.map((d) => <circle key={d.i} cx={d.p[0]} cy={d.p[1]} r={6} fill={d.h < 0.16 ? K.red : d.h < 0.38 ? K.orange : d.h < 0.55 ? mix(K.orange, K.violet, (d.h - 0.38) / 0.17) : K.violet} opacity={tw(d) * (d.h < 0.55 ? 1 : 0.45)} />)}
        <Seg a={SUN2} b={shorten(SUN2, head(SUNSET), 30)} color={K.orange} w={5} opacity={0.9} />
        <Sun p={SUN2} color={K.orange} />
        <line x1={SUNSET[0] - 520} y1={0} x2={SUNSET[0] + 520} y2={0} {...SW} stroke={C.white} />
        <Figure x={SUNSET[0]} y={0} s={FIG_S} color={C.white} />
        <ScreenLabel x={SUNSET[0]} y={64 / z} z={z} text="SUNSET" color={C.ash} opacity={near} />

        {/* ================= THE MOON ================= */}
        <path d={domePath(MOON)} {...SW} stroke={C.graphite} opacity={0.6} />
        <Seg a={SUN3} b={shorten(SUN3, head(MOON), 30)} color={C.white} w={5} opacity={0.85} />
        {stream(t, 1.4, 4).map(({ k, ph }) => <Photon key={k} p={L(SUN3, shorten(SUN3, head(MOON), 30), ph)} color={C.white} z={z} r={8} />)}
        <Sun p={SUN3} />
        <path d={`M${MOON[0] - 520},0 L${MOON[0] - 300},0 Q${MOON[0] - 250},-30 ${MOON[0] - 200},0 L${MOON[0] + 180},0 Q${MOON[0] + 250},-40 ${MOON[0] + 320},0 L${MOON[0] + 520},0`} {...SW} stroke={C.mist} />
        <Figure x={MOON[0]} y={0} s={FIG_S} color={C.white} />
        <ScreenLabel x={MOON[0]} y={64 / z} z={z} text="THE MOON" color={C.ash} opacity={near} />
        {noAir > 0.01 ? <Pill x={MOON[0] - 220} y={-380} z={z} text="NO AIR" color={C.white} opacity={noAir} /> : null}

        {/* ================= SUNSET, EARTH SCALE ================= */}
        {earthOn > 0.01 ? (
          <g opacity={earthOn}>
            <circle cx={EARTH[0]} cy={EARTH[1]} r={RA} {...SW} stroke={C.graphite} />
            {ATM.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={4.5} fill={C.ash} />)}
            <circle cx={EARTH[0]} cy={EARTH[1]} r={RE} {...SW} fill={C.void} stroke={C.white} />
            <ScreenLabel x={EARTH[0] - 560} y={EARTH[1] - 820} z={z} text="AIR" color={C.ash} />
            <ScreenLabel x={EARTH[0]} y={EARTH[1] - 520} z={z} text="EARTH" color={C.ash} />
            {/* noon: a short trip through the air, all colours arrive */}
            <Sun p={[OBS_H[0], OBS_H[1] - 330]} r={26} opacity={noonRay} />
            <Seg a={[OBS_H[0], OBS_H[1] - 300]} b={[OBS_H[0], OBS_H[1] - 22]} u1={noonRay} color={C.white} w={5} />
             <Pill x={OBS_H[0] - 240} y={OBS_H[1] - 250} z={z} text="NOON: SHORT PATH" color={C.mist} opacity={noonRay} />
            {/* sunset: a long trip, the colours peel off one by one */}
            <Sun p={[SS_X0, SS_Y]} r={30} opacity={ramp(t, beat(16, 'light') - 0.3, beat(16, 'light'))} />
            {SPECTRUM.map((c, i) => {
              const name = Object.keys(K)[i];
              const stop = PEEL[name] != null ? SS_IN + PEEL[name] * (SS_END - SS_IN) : SS_END;
              const x1 = Math.min(ssHead, stop), y = SS_Y + (i - 2.5) * 4;
              const sprayed = ssHead >= stop && PEEL[name] != null;
              const ts = sprayed ? clamp((ssHead - stop) / 140, 0, 1) : 0;
              return (
                <g key={i}>
                  {x1 > SS_X0 ? <line x1={SS_X0} y1={y} x2={x1} y2={y} {...SW} strokeWidth={3} stroke={c} /> : null}
                  {sprayed ? [0, 1, 2].map((k) => { const a = (-150 + k * 100 + i * 17) * Math.PI / 180; return <Arrow key={k} a={[stop, y]} b={[stop + 60 * Math.cos(a), y + 60 * Math.sin(a)]} u={ts} color={c} z={z} w={3} />; }) : null}
                </g>
              );
            })}
            {ssHead > SS_IN + 40 ? <Pill x={(SS_IN + SS_END) / 2 - 60} y={SS_Y + 120} z={z} text="SUNSET: LONG PATH" color={C.mist} opacity={ramp(t, beat(16, 'much'), beat(16, 'much') + 0.3)} /> : null}
            <Figure x={OBS[0]} y={OBS[1]} s={OBS_S} color={throughR > 0.5 ? K.orange : C.white} />
            <Ring x={OBS_H[0]} y={OBS_H[1]} r={50} t={t} t0={beat(17, 'orange')} color={K.orange} />
            {throughR > 0.01 ?  <Pill x={OBS_H[0] - 200} y={OBS_H[1] - 120} z={z} text="ORANGE + RED" color={K.orange} opacity={throughR} /> : null}
          </g>
        ) : null}
      </g>
    </svg>
  );
}

// ---------- screen-space overlays: title, X stamp, counter, named-concept stamp ----------
export function Overlays({ t }) {
  const titleOut = ramp(t, st(2) - 0.12, st(2) + 0.13);
  const xP = pop(t, beat(4, 'not') - 0.05, 0.3), xOn = 1 - ramp(t, st(5) - 0.3, st(5) + 0.1);
  const cOn = ramp(t, beat(11, 'six') - 0.3, beat(11, 'six')) * (1 - ramp(t, st(13) - 0.2, st(13) + 0.2));
  const val = 1 + Math.round(5 * ramp(t, beat(11, 'six'), beat(11, 'red') + 0.2));
  const stampP = pop(t, st(12) + 0.05, 0.35), stampOn = 1 - ramp(t, st(13) - 0.35, st(13) + 0.05);
  return (
    <>
      {titleOut < 1 ? (
        <div style={{ position: 'absolute', left: 90, right: 160, top: 170, textAlign: 'center', opacity: 1 - titleOut, filter: `blur(${10 * titleOut}px)` }}>
          <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 104, lineHeight: 1.04, color: C.white, textShadow: '0 0 28px rgba(255,255,255,0.35), 0 0 20px rgba(0,0,0,0.6)' }}>WHY IS THE<br />SKY BLUE?</div>
        </div>
      ) : null}
      {xP > 0 && xOn > 0 ? (
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: xOn }}>
          <g transform={`translate(540 960) rotate(-6) scale(${xP})`}>
            <line x1={-260} y1={-260} x2={260} y2={260} stroke={C.white} strokeWidth={30} strokeLinecap="round" />
            <line x1={260} y1={-260} x2={-260} y2={260} stroke={C.white} strokeWidth={30} strokeLinecap="round" />
          </g>
        </svg>
      ) : null}
      {cOn > 0.01 ? (
        <div style={{ position: 'absolute', left: 330, right: 140, top: 1300, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: cOn }}>
          <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 140, color: C.white, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>×{val}</div>
          <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 24, color: C.mist, letterSpacing: '0.3em', marginTop: 14 }}>BLUE VS RED</div>
        </div>
      ) : null}
      {stampP > 0 && stampOn > 0 ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 700, display: 'flex', justifyContent: 'center', opacity: stampOn }}>
          <div style={{ transform: `rotate(-6deg) scale(${stampP})`, border: `8px solid ${C.white}`, borderRadius: 14, padding: '22px 40px', textAlign: 'center', background: 'rgba(0,0,0,0.55)', boxShadow: '0 0 40px rgba(255,255,255,0.25)' }}>
            <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 92, color: C.white, lineHeight: 1.02 }}>RAYLEIGH</div>
            <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 92, color: C.white, lineHeight: 1.02 }}>SCATTERING</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
