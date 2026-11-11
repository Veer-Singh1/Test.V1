// "That leaf hates green": one continuous shot on a black canvas.
// Colour only ever exists as LIGHT (beams, photons, arrows). Objects are line art; they only look
// coloured while the light they throw back is reaching an eye. Lights off: nothing has colour.
import React from 'react';
import { C, FONT } from './kit/palette.js';
import { Defs, Figure, ScreenLabel, Pill, Ring, Dot, SW } from './kit/elements.jsx';
import { sent, beat, END, clamp, lerp, easeOut, easeInOut, ramp, pop } from './timing.js';

const st = (n) => sent(n).start;
const en = (n) => sent(n).end;
// spectrum, ordered by how little a prism bends it (red least)
export const K = { red: '#FF4B4B', orange: '#FF9442', yellow: '#FFD84A', green: '#46D27A', blue: '#5468FF', violet: '#A35CFF' };
const SPECTRUM = [K.red, K.orange, K.yellow, K.green, K.blue, K.violet];

// ---------- colour helpers ----------
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hx = (a) => '#' + a.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
const mix = (a, b, p) => { const A = rgb(a), B = rgb(b); p = clamp(p, 0, 1); return hx(A.map((v, i) => v + (B[i] - v) * p)); };
const bump = (t, t0, d = 0.5) => { const p = ramp(t, t0, t0 + d); return Math.sin(Math.PI * p); };

// ---------- world layout ----------
const LEAF = { x: 0, y: 0, rot: 18 };
const rot = (x, y, a = LEAF.rot) => { const r = (a * Math.PI) / 180; return [LEAF.x + x * Math.cos(r) - y * Math.sin(r), LEAF.y + x * Math.sin(r) + y * Math.cos(r)]; };
const LAMP1 = [-420, -380];
const LC = rot(-60, -40); // where the light lands on the leaf
const LEAF_MID = rot(0, -10), LEAF_STEM = rot(0, 300);
const EYE1 = [310, -440];
// the world is stacked top to bottom (it suits a 9:16 frame): leaf, then the crowd, then the three objects
const CROWD_X = 0, CROWD_Y = 1300;
const YOU_HEAD = [CROWD_X, CROWD_Y - 372 * 0.6];
const SHIRT = [-380, 2300], JEANS = [90, 2300], BANANA = [530, 2360];
const LAMP2 = [150, 1730];
const PRISM = [-30, 1940];
const PI_IN = [-10, 1930], PE = [-70, 1965];
const FAN = SPECTRUM.map((c, i) => [-470 + 40 * i, 2245 + 24 * i]);
const EYE2 = [-650, 1890];

// ---------- camera: eased moves between holds, slow push-in drift during holds ----------
const KEYS = [
  { t: 0, x: -20, y: -30, z: 1.0 },
  { t: st(3), x: CROWD_X, y: 1150, z: 0.85 },
  { t: en(3) - 0.05, x: 90, y: 2180, z: 0.62 },
  { t: st(8) - 0.2, x: -230, y: 2050, z: 0.85 },
  { t: st(11) - 0.15, x: -300, y: 2100, z: 0.95 },
  { t: st(12) - 0.1, x: 0, y: 20, z: 0.9 },
  { t: st(15), x: 55, y: 860, z: 0.41 },
  { t: st(16), x: 55, y: 880, z: 0.43 },
  { t: st(17), x: -20, y: -30, z: 0.965 },
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

// ---------- geometry helpers ----------
const L = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
const Q = (a, c, b, u) => [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]];
const shorten = (a, b, d) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]); return L(a, b, 1 - d / l); };
const pts = (arr) => arr.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
function Seg({ a, b, u0 = 0, u1 = 1, color, w = 4, opacity = 1 }) {
  if (u1 - u0 <= 0.001 || opacity <= 0.01) return null;
  const p = L(a, b, u0), q = L(a, b, u1);
  return <line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} {...SW} strokeWidth={w} stroke={color} opacity={opacity} />;
}
function Arc({ a, c, b, u1 = 1, color, opacity = 1, w = 4 }) {
  if (u1 <= 0.001 || opacity <= 0.01) return null;
  const arr = []; for (let i = 0; i <= 40; i++) arr.push(Q(a, c, b, (u1 * i) / 40));
  return <polyline points={pts(arr)} {...SW} strokeWidth={w} stroke={color} opacity={opacity} />;
}
function Head({ at, from, color, z, opacity = 1, s = 1 }) {
  if (opacity <= 0.01) return null;
  const ang = (Math.atan2(at[1] - from[1], at[0] - from[0]) * 180) / Math.PI;
  return <g transform={`translate(${at[0]} ${at[1]}) rotate(${ang}) scale(${s / z})`} opacity={opacity}><path d="M4,0 L-18,-12 L-18,12 Z" fill={color} /></g>;
}
const Photon = ({ p, color, z, r = 8, opacity = 1 }) => (opacity > 0.01 ? <circle cx={p[0]} cy={p[1]} r={r / z} fill={color} opacity={opacity} /> : null);
// photons launched every period/n seconds from t0; returns those in flight with phase 0..1
function stream(t, t0, period, n) {
  const dt = period / n, out = [], jm = Math.floor((t - t0) / dt);
  for (let j = Math.max(0, jm - n); j <= jm; j++) { const ph = (t - (t0 + j * dt)) / period; if (ph >= 0 && ph < 1) out.push({ j, ph, launch: t0 + j * dt }); }
  return out;
}

// ---------- parts ----------
function Leaf({ color, glow, opacity = 1 }) {
  const veins = [140, 50, -40, -130];
  return (
    <g transform={`translate(${LEAF.x} ${LEAF.y}) rotate(${LEAF.rot})`} opacity={opacity}>
      {glow > 0.01 ? <path d="M0,230 C-230,140 -220,-150 0,-270 C220,-150 230,140 0,230 Z" fill={color} opacity={0.22 * glow} filter="url(#halo)" /> : null}
      <path d="M0,230 C-230,140 -220,-150 0,-270 C220,-150 230,140 0,230 Z" {...SW} fill={C.void} stroke={color} />
      <line x1={0} y1={230} x2={0} y2={320} {...SW} stroke={color} />
      <line x1={0} y1={225} x2={0} y2={-235} {...SW} stroke={color} opacity={0.7} />
      {veins.map((y) => [-1, 1].map((s) => <line key={`${y}${s}`} x1={0} y1={y} x2={s * (150 - Math.abs(y) * 0.2)} y2={y - 90} {...SW} stroke={color} opacity={0.7} />))}
    </g>
  );
}
function Shirt({ x, y, color, opacity = 1 }) {
  return <path transform={`translate(${x} ${y})`} opacity={opacity} d="M-70,-175 Q0,-115 70,-175 L190,-135 L245,-20 L160,15 L140,-30 L140,190 L-140,190 L-140,-30 L-160,15 L-245,-20 L-190,-135 Z" {...SW} fill={C.void} stroke={color} />;
}
function Jeans({ x, y, color, opacity = 1 }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <path d="M-130,-190 L130,-190 L152,200 L35,200 L0,-30 L-35,200 L-152,200 Z" {...SW} fill={C.void} stroke={color} />
      <line x1={-132} y1={-150} x2={132} y2={-150} {...SW} stroke={color} />
      <path d="M-100,-150 Q-95,-95 -55,-95 M100,-150 Q95,-95 55,-95" {...SW} stroke={color} />
    </g>
  );
}
function Banana({ x, y, color, opacity = 1 }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <path d="M-215,-40 Q-20,190 200,-70 Q215,-80 222,-62 Q20,215 -205,-12 Q-228,-22 -215,-40 Z" {...SW} fill={C.void} stroke={color} />
      <path d="M200,-70 L228,-102" {...SW} stroke={color} />
    </g>
  );
}
function Eye({ p, color, opacity = 1, s = 1 }) {
  return (
    <g transform={`translate(${p[0]} ${p[1]}) scale(${s})`} opacity={opacity}>
      <path d="M-64,0 Q0,-50 64,0 Q0,50 -64,0 Z" {...SW} fill={C.void} stroke={color} />
      <circle r={22} {...SW} stroke={color} />
      <circle r={9} fill={color} />
    </g>
  );
}
function Lamp({ p, on, show = 1, z, cord = 900 }) {
  if (show <= 0.01) return null;
  const col = mix(C.graphite, C.white, on);
  return (
    <g opacity={show}>
      <line x1={p[0]} y1={p[1] - cord} x2={p[0]} y2={p[1] - 62} {...SW} stroke={C.graphite} />
      <rect x={p[0] - 20} y={p[1] - 64} width={40} height={24} rx={4} {...SW} stroke={mix(C.graphite, C.mist, on)} />
      {on > 0.01 ? <circle cx={p[0]} cy={p[1]} r={70} fill={C.white} opacity={0.25 * on} filter="url(#halo)" /> : null}
      <circle cx={p[0]} cy={p[1]} r={40} {...SW} stroke={col} fill={mix(C.void, C.white, on)} />
    </g>
  );
}
function Envelope({ p, color, z, opacity = 1 }) {
  if (opacity <= 0.01) return null;
  return (
    <g transform={`translate(${p[0]} ${p[1]}) scale(${1 / z})`} opacity={opacity}>
      <rect x={-30} y={-20} width={60} height={40} rx={4} {...SW} fill={C.void} stroke={color} />
      <polyline points="-30,-20 0,4 30,-20" {...SW} stroke={color} />
    </g>
  );
}
const Prism = ({ opacity }) => <polygon opacity={opacity} points={`${PRISM[0]},${PRISM[1] - 95} ${PRISM[0] - 82},${PRISM[1] + 48} ${PRISM[0] + 82},${PRISM[1] + 48}`} {...SW} fill={C.void} stroke={C.white} />;

// ---------- the world ----------
export function World({ t }) {
  const cam = camAt(t), z = cam.z;
  const near = ramp(z, 0.5, 0.6); // small labels only when the camera is close
  const OFF = beat(15, 'off'), ON = st(16) + 0.05;
  const lights = 1 - ramp(t, OFF, OFF + 0.25) + ramp(t, ON, ON + 0.3);
  const relight = ramp(t, ON, ON + 0.45); // beams re-grow from the lamps

  // ---- leaf, its lamp, the green it throws back ----
  const isnt = beat(1, "isn't");
  const leafTint = Math.max(1 - ramp(t, isnt, isnt + 0.4), ramp(t, beat(14, 'see'), beat(14, 'see') + 0.4)) * lights;
  const leafCol = mix(mix(C.white, C.graphite, 1 - lights), K.green, leafTint);
  const leafGlow = Math.max(1 - ramp(t, isnt, isnt + 0.4), ramp(t, st(18), st(18) + 0.5)) * lights;
  const greenArrow = (t < ON ? lights : ramp(t, ON + 0.3, ON + 0.7)) * (1 + 0.6 * bump(t, beat(2, 'rejecting'), 0.7));
  const g1End = shorten(LC, EYE1, 80);
  const split = (L0) => L0 >= st(12) - 0.4 && L0 < OFF;
  const leafPhotons = stream(t, -20, 1.8, 6);

  // ---- crowd (belief) ----
  const crowdOn = ramp(t, st(3) - 0.2, st(3) + 0.3);
  const crowdDim = t < st(4) + 0.4 ? 1 : t < st(15) ? 0.18 : 0.45; // out of focus: dim to almost graphite
  const leafFocus = 1 - 0.75 * ramp(t, st(3), st(3) + 0.5) + 0.75 * ramp(t, st(12) - 0.6, st(12) - 0.1);
  const hasPulse = bump(t, beat(3, 'has') - 0.05, 0.55);

  // ---- three everyday objects ----
  const drain = ramp(t, beat(7, 'actually'), beat(7, 'actually') + 0.5);
  const objCol = (k, popT, letterT) => {
    const belief = mix(K[k], C.white, drain);
    const seen = letterT != null ? ramp(t, letterT, letterT + 0.3) : 0;
    return mix(mix(belief, C.graphite, 1 - lights), K[k], seen);
  };

  // ---- shirt demo: lamp, prism, spectrum, absorption, red bounce ----
  const lamp2Show = ramp(t, st(8) - 0.2, st(8) + 0.2);
  const whiteIn = ramp(t, beat(8, 'white'), beat(8, 'is') + 0.1);
  const fanGrow = easeOut(ramp(t, beat(8, 'every') - 0.05, beat(8, 'once') + 0.25));
  const hits = beat(9, 'hits'), swallow = beat(9, 'swallows');
  const absorbed = easeInOut(ramp(t, swallow, swallow + 0.6));
  const redOut = ramp(t, beat(10, 'bounces'), beat(10, 'eyes') + 0.1);
  const seenRed = ramp(t, beat(10, 'eyes'), beat(10, 'eyes') + 0.35);
  const volt1 = ramp(t, st(11) + 0.05, st(11) + 0.3) * (1 - ramp(t, st(11) + 1.3, st(11) + 1.9));
  const demoOn = t < ON ? lights : 0; // the prism demo is replaced by plain lamp light in the payoff
  const shirtDemoCol = mix(mix(C.white, K.red, seenRed), C.volt, volt1);
  const shirtPhotons = t > beat(10, 'eyes') && t < OFF ? stream(t, beat(10, 'eyes'), 1.6, 6) : [];

  // ---- payoff: every object mails its rejected colour to you ----
  const letters = [
    { k: 'green', from: LC, c: [-620, 520], to: [YOU_HEAD[0] - 45, YOU_HEAD[1] - 30], t0: beat(16, 'every') },
    { k: 'red', from: [SHIRT[0] - 60, SHIRT[1] - 150], c: [-850, 1250], to: [YOU_HEAD[0] - 50, YOU_HEAD[1] + 10], t0: beat(16, 'colour') },
    { k: 'blue', from: [JEANS[0], JEANS[1] - 210], c: [140, 1700], to: [YOU_HEAD[0] + 5, YOU_HEAD[1] + 60], t0: beat(16, 'around') },
    { k: 'yellow', from: [BANANA[0] + 60, BANANA[1] - 40], c: [880, 1350], to: [YOU_HEAD[0] + 50, YOU_HEAD[1] + 10], t0: beat(16, 'you') },
  ];
  const letterFade = 1 - ramp(t, st(17), st(17) + 0.6);

  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
      <Defs />
      <rect width={1080} height={1920} fill={C.void} />
      <g transform={`translate(540 960) scale(${z}) translate(${-cam.x} ${-cam.y})`}>
        {/* ================= LEAF ================= */}
        <g opacity={leafFocus}>
        <Seg a={LAMP1} b={LC} u1={t < ON ? 1 : relight} color={C.white} opacity={0.75 * lights} />
        <Seg a={LC} b={g1End} u1={1} color={K.green} opacity={clamp(greenArrow, 0, 1)} w={4 + 3 * bump(t, beat(2, 'rejecting'), 0.7)} />
        <Head at={g1End} from={LC} color={K.green} z={z} opacity={clamp(greenArrow, 0, 1)} />
        {leafPhotons.map(({ j, ph, launch }) => {
          if (lights < 0.5 || (t >= ON && t < ON + 0.7)) return null;
          const sp = split(launch);
          const kind = sp ? ['red', 'green', 'blue'][j % 3] : 'white';
          if (ph < 0.5) return <Photon key={j} p={L(LAMP1, LC, ph / 0.5)} color={kind === 'white' ? C.white : K[kind]} z={z} />;
          const u = (ph - 0.5) / 0.5;
          if (kind === 'red' || kind === 'blue') return null; // eaten: drawn on top of the leaf below

          return <Photon key={j} p={L(LC, g1End, u)} color={K.green} z={z} />;
        })}
        <Lamp p={LAMP1} on={lights} z={z} />
        <Leaf color={leafCol} glow={leafGlow} />
        {/* red and blue light eaten by chlorophyll: becomes energy running down the leaf (Volt Blue) */}
        {leafPhotons.map(({ j, ph, launch }) => {
          if (lights < 0.5 || !split(launch) || j % 3 === 1 || ph < 0.5) return null;
          const u = (ph - 0.5) / 0.5;
          const p = u < 0.35 ? L(LC, LEAF_MID, u / 0.35) : L(LEAF_MID, LEAF_STEM, (u - 0.35) / 0.65);
          return <g key={`v${j}`} opacity={1 - u * 0.6}><circle cx={p[0]} cy={p[1]} r={26 / z} fill={C.volt} opacity={0.35} filter="url(#halo)" /><circle cx={p[0]} cy={p[1]} r={10 / z} fill={C.volt} /></g>;
        })}
        <Eye p={EYE1} color={mix(C.graphite, C.white, lights)} />
        <ScreenLabel x={EYE1[0]} y={EYE1[1] - 72 / z} z={z} text="YOUR EYE" color={C.ash} opacity={near} />
        <Ring x={LC[0]} y={LC[1]} r={80} t={t} t0={beat(2, 'rejecting')} color={K.green} />
        <Ring x={LC[0]} y={LC[1]} r={80} t={t} t0={beat(13, 'leftover')} color={K.green} />
        <Ring x={EYE1[0]} y={EYE1[1]} r={70} t={t} t0={beat(14, 'see')} color={K.green} />
        <Ring x={LC[0]} y={LC[1]} r={80} t={t} t0={beat(18, 'green')} color={K.green} />
        </g>
        {t >= st(12) - 0.2 && t < st(15) + 0.4 ? <Pill x={-290} y={240} z={z} text="CHLOROPHYLL" color={C.mist} opacity={ramp(t, beat(12, 'chlorophyll'), beat(12, 'chlorophyll') + 0.3) * (1 - ramp(t, st(15), st(15) + 0.4))} /> : null}

        {/* ================= CROWD ("most people") + YOU ================= */}
        {crowdOn > 0.01 ? (
          <g opacity={crowdOn}>
            {[[-520, 'red'], [-260, 'blue'], [0, null], [260, 'yellow'], [520, 'green']].map(([dx, k], i) => {
              const x = CROWD_X + dx, s = pop(t, st(3) + i * 0.1);
              const you = k === null;
              const col = you ? (t < st(4) + 0.4 || t >= st(16) - 0.2 ? C.white : C.mist) : C.mist;
              return (
                <g key={dx} transform={`translate(${x} ${CROWD_Y}) scale(${s}) translate(${-x} ${-CROWD_Y})`} opacity={you && t >= st(16) - 0.2 ? 1 : crowdDim}>
                  <Figure x={x} y={CROWD_Y} s={0.6} color={mix(C.graphite, col, Math.max(lights, 0.25))} />
                  {k ? <circle cx={x + 62} cy={CROWD_Y - 120} r={26 * (1 + 0.35 * hasPulse)} fill={mix(C.graphite, K[k], (1 - drain * 0.6) * lights)} /> : null}
                </g>
              );
            })}
            <ScreenLabel x={CROWD_X} y={CROWD_Y + 70 / z} z={z} text="YOU" color={C.ash} opacity={t < st(4) + 0.4 || t >= st(15) ? 1 : 0.4} />
          </g>
        ) : null}
        <Ring x={YOU_HEAD[0]} y={YOU_HEAD[1]} r={70} t={t} t0={beat(16, 'rejection')} />

        {/* ================= SHIRT · JEANS · BANANA ================= */}
        {t >= st(4) - 0.1 ? (
          <g transform={`translate(${SHIRT[0]} ${SHIRT[1]}) scale(${pop(t, st(4))}) translate(${-SHIRT[0]} ${-SHIRT[1]})`}>
            {volt1 > 0.01 ? <circle cx={SHIRT[0]} cy={SHIRT[1]} r={260} fill={C.volt} opacity={0.3 * volt1} filter="url(#halo)" /> : null}
            <Shirt x={SHIRT[0]} y={SHIRT[1]} color={t < ON ? (t < st(8) ? objCol('red') : mix(shirtDemoCol, C.graphite, 1 - lights)) : objCol('red', null, letters[1].t0)} />
          </g>
        ) : null}
        {/* white light in, through the prism */}
        <Seg a={LAMP2} b={PI_IN} u1={whiteIn} color={C.white} opacity={0.85 * demoOn} />
        {lamp2Show > 0.01 ? <Prism opacity={lamp2Show * (t < ON ? 0.35 + 0.65 * lights : 0.3)} /> : null}
        {t < ON && lamp2Show > 0.01 ? <ScreenLabel x={PRISM[0] + 120} y={PRISM[1] + 40} z={z} text="PRISM" anchor="start" color={C.ash} opacity={lamp2Show * lights * near} /> : null}
        {/* the spectrum fan: every colour at once */}
        {FAN.map((T, i) => {
          const red = i === 0;
          const tail = red ? 0 : absorbed; // swallowed colours drain into the shirt
          return (
            <g key={i}>
              {!red && absorbed > 0 ? <Seg a={PE} b={T} u1={1} color={C.graphite} opacity={demoOn * 0.8} w={3} /> : null}
              <Seg a={PE} b={T} u0={tail} u1={fanGrow} color={SPECTRUM[i]} opacity={demoOn} w={7} />
              {!red && t > hits ? <circle cx={T[0]} cy={T[1]} r={(13 / z) * (1 - absorbed) * pop(t, hits, 0.3)} fill={SPECTRUM[i]} opacity={demoOn} /> : null}
            </g>
          );
        })}
        <Seg a={FAN[0]} b={shorten(FAN[0], EYE2, 85)} u1={redOut} color={K.red} opacity={demoOn} w={7} />
        <Head at={L(FAN[0], shorten(FAN[0], EYE2, 85), redOut)} from={FAN[0]} color={K.red} z={z} opacity={redOut > 0.02 ? demoOn : 0} />
        {shirtPhotons.map(({ j, ph }) => {
          if (demoOn < 0.5) return null;
          if (ph < 0.35) return <Photon key={j} p={L(LAMP2, PI_IN, ph / 0.35)} color={C.white} z={z} />;
          const i = j % 6, u = (ph - 0.35) / 0.35;
          if (u < 1) return <Photon key={j} p={L(PE, FAN[i], u)} color={SPECTRUM[i]} z={z} r={7} />;
          if (i !== 0) return null;
          return <Photon key={j} p={L(FAN[0], shorten(FAN[0], EYE2, 85), (ph - 0.7) / 0.3)} color={K.red} z={z} />;
        })}
        {lamp2Show > 0.01 ? <Eye p={EYE2} color={mix(C.graphite, C.white, lights)} opacity={lamp2Show} /> : null}
        {lamp2Show > 0.01 ? <ScreenLabel x={EYE2[0]} y={EYE2[1] + 90 / z} z={z} text="YOUR EYE" color={C.ash} opacity={lamp2Show * near} /> : null}
        <Ring x={EYE2[0]} y={EYE2[1]} r={70} t={t} t0={beat(10, 'eyes')} color={K.red} />
        <Lamp p={LAMP2} on={lights} show={lamp2Show} z={z} cord={420} />
        {/* the other two objects */}
        <Ring x={SHIRT[0]} y={SHIRT[1]} r={200} t={t} t0={st(11) + 0.05} color={C.volt} />
        {t >= st(5) - 0.1 ? <g transform={`translate(${JEANS[0]} ${JEANS[1]}) scale(${pop(t, st(5))}) translate(${-JEANS[0]} ${-JEANS[1]})`}><Jeans x={JEANS[0]} y={JEANS[1]} color={objCol('blue', null, letters[2].t0)} /></g> : null}
        {t >= st(6) - 0.1 ? (
          <g transform={`translate(${BANANA[0]} ${BANANA[1]}) scale(${pop(t, st(6))}) translate(${-BANANA[0]} ${-BANANA[1]})`}>
            <Banana x={BANANA[0]} y={BANANA[1]} color={objCol('yellow', null, letters[3].t0)} />
            <line x1={BANANA[0] - 260} y1={BANANA[1] + 120} x2={BANANA[0] + 260} y2={BANANA[1] + 120} {...SW} stroke={C.mist} opacity={0.6} />
          </g>
        ) : null}
        {[[SHIRT, 'SHIRT', st(4)], [JEANS, 'JEANS', st(5)], [BANANA, 'BANANA', st(6)]].map(([p, txt, t0]) => (t >= t0 ? <ScreenLabel key={txt} x={p[0]} y={p[1] + (txt === 'BANANA' ? 175 : 250)} z={z} text={txt} color={C.ash} opacity={ramp(t, t0, t0 + 0.3) * near} /> : null))}

        {/* ================= PAYOFF: rejection letters ================= */}
        {t >= ON ? (
          <g>
            <Seg a={LAMP2} b={[SHIRT[0] + 40, SHIRT[1] - 160]} u1={relight} color={C.white} opacity={0.6} />
            <Seg a={LAMP2} b={[JEANS[0], JEANS[1] - 200]} u1={relight} color={C.white} opacity={0.6} />
            <Seg a={LAMP2} b={[BANANA[0] - 30, BANANA[1] - 40]} u1={relight} color={C.white} opacity={0.6} />
            {letters.map((l) => {
              const u = easeInOut(ramp(t, l.t0, l.t0 + 1.25));
              if (u <= 0) return null;
              const p = Q(l.from, l.c, l.to, u);
              return (
                <g key={l.k} opacity={letterFade}>
                  <Arc a={l.from} c={l.c} b={l.to} u1={u} color={K[l.k]} />
                  <Envelope p={p} color={K[l.k]} z={z} opacity={1 - ramp(t, l.t0 + 1.25, l.t0 + 1.5)} />
                </g>
              );
            })}
          </g>
        ) : null}
      </g>
    </svg>
  );
}

// ---------- screen-space overlays: live counter and the named-concept stamp ----------
export function Overlays({ t }) {
  const cOn = ramp(t, beat(12, 'eats') - 0.3, beat(12, 'eats')) * (1 - ramp(t, st(15), st(15) + 0.35));
  const val = Math.round(90 * easeOut(ramp(t, beat(12, 'eats'), beat(12, 'energy') + 0.4)));
  const stampP = pop(t, st(11) + 0.05, 0.35), stampOn = 1 - ramp(t, st(12) - 0.35, st(12) + 0.05);
  return (
    <>
      {cOn > 0.01 ? (
        <div style={{ position: 'absolute', left: 0, right: 160, top: 1290, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: cOn, marginLeft: 80 }}>
          <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 140, color: C.white, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{val}%</div>
          <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 24, color: C.mist, letterSpacing: '0.3em', marginTop: 14 }}>OF RED + BLUE LIGHT ABSORBED</div>
        </div>
      ) : null}
      {stampP > 0 && stampOn > 0 ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 760, display: 'flex', justifyContent: 'center', opacity: stampOn }}>
          <div style={{ transform: `rotate(-6deg) scale(${stampP})`, border: `8px solid ${C.white}`, borderRadius: 14, padding: '22px 40px', textAlign: 'center', background: 'rgba(0,0,0,0.55)', boxShadow: '0 0 40px rgba(255,255,255,0.25)' }}>
            <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 92, color: C.white, lineHeight: 1.02 }}>SELECTIVE</div>
            <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 92, color: C.white, lineHeight: 1.02 }}>ABSORPTION</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
