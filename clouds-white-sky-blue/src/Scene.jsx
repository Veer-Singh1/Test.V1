// "Why are clouds white… when the sky is blue?": one continuous shot on a black canvas.
// Same visual language as "Why the sky should be purple": air molecules are small dots that glow with the
// light they scatter (blue); cloud droplets are bigger dots that scatter every colour (white).
// The camera dives from the cloud into a single molecule and a single droplet (a "powers of ten" zoom:
// that close-up world is drawn 50x smaller, inside the cloud's edge), then flies to a storm cloud.
import React from 'react';
import { C, FONT } from './kit/palette.js';
import { Defs, Figure, ScreenLabel, Pill, Ring, SW } from './kit/elements.jsx';
import { sent, beat, WORDS, clamp, lerp, easeOut, easeInOut, ramp, pop } from './timing.js';

const st = (n) => sent(n).start;
export const K = { red: '#FF4B4B', orange: '#FF9442', yellow: '#FFD84A', green: '#46D27A', blue: '#5A8BFF', violet: '#A35CFF' };
const SPECTRUM = [K.red, K.orange, K.yellow, K.green, K.blue, K.violet];

// ---------- helpers ----------
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hx = (a) => '#' + a.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
const mix = (a, b, p) => { const A = rgb(a), B = rgb(b); p = clamp(p, 0, 1); return hx(A.map((v, i) => v + (B[i] - v) * p)); };
const hash = (i) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const L = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
const shorten = (a, b, d) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]); return L(a, b, 1 - d / l); };
const win = (t, a, b, f = 0.25) => ramp(t, a - f, a) * (1 - ramp(t, b, b + f));
function Seg({ a, b, u0 = 0, u1 = 1, color, w = 4, opacity = 1 }) {
  if (u1 - u0 <= 0.001 || opacity <= 0.01) return null;
  const p = L(a, b, u0), q = L(a, b, u1);
  return <line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} {...SW} strokeWidth={w} stroke={color} opacity={opacity} />;
}
function Arrow({ a, b, u = 1, color, z, opacity = 1, w = 4, glow = 0 }) {
  if (u <= 0.01 || opacity <= 0.01) return null;
  const q = L(a, b, u), ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  return (
    <g opacity={opacity}>
      {glow > 0.01 ? <line x1={a[0]} y1={a[1]} x2={q[0]} y2={q[1]} {...SW} strokeWidth={w * 4} stroke={color} opacity={0.35 * glow} filter="url(#halo)" /> : null}
      <line x1={a[0]} y1={a[1]} x2={q[0]} y2={q[1]} {...SW} strokeWidth={w} stroke={color} />
      <g transform={`translate(${q[0]} ${q[1]}) rotate(${ang}) scale(${(1 + 0.15 * (w - 4)) / z})`}><path d="M4,0 L-16,-10 L-16,10 Z" fill={color} /></g>
    </g>
  );
}
const stream = (t, period, n) => { const out = []; for (let k = 0; k < n; k++) { const ph = (((t / period + k / n) % 1) + 1) % 1; out.push({ k, ph }); } return out; };
function Sun({ p, r = 46, color = C.white, opacity = 1 }) {
  return <g opacity={opacity}><circle cx={p[0]} cy={p[1]} r={r * 1.9} fill={color} opacity={0.22} filter="url(#halo)" /><circle cx={p[0]} cy={p[1]} r={r} fill={color} /></g>;
}
// a cloud = union of circles and rounded rectangles: thick outline first, then black fills, so only the outer edge shows
const inCloud = (p, cl, m = 0) => cl.circles.some(([x, y, r]) => Math.hypot(p[0] - x, p[1] - y) < r - m) || cl.rects.some(([x, y, w, h]) => p[0] > x + m && p[0] < x + w - m && p[1] > y + m && p[1] < y + h - m);
function CloudShape({ cl, stroke = C.white, opacity = 1 }) {
  return (
    <g opacity={opacity}>
      {cl.circles.map(([x, y, r], i) => <circle key={`c${i}`} cx={x} cy={y} r={r} {...SW} strokeWidth={8} stroke={stroke} />)}
      {cl.rects.map(([x, y, w, h], i) => <rect key={`r${i}`} x={x} y={y} width={w} height={h} rx={Math.min(40, h / 2)} {...SW} strokeWidth={8} stroke={stroke} />)}
      {cl.circles.map(([x, y, r], i) => <circle key={`cf${i}`} cx={x} cy={y} r={r} fill={C.void} />)}
      {cl.rects.map(([x, y, w, h], i) => <rect key={`rf${i}`} x={x} y={y} width={w} height={h} rx={Math.min(40, h / 2)} fill={C.void} />)}
    </g>
  );
}
const grid = (x0, x1, y0, y1, step, seed, keep) => {
  const out = []; let i = 0;
  for (let y = y0; y <= y1; y += step) for (let x = x0; x <= x1; x += step) {
    i++; const p = [x + (hash(seed + i) - 0.5) * step * 0.6, y + (hash(seed + i + 777) - 0.5) * step * 0.6];
    if (keep(p)) out.push({ p, i, ph: hash(seed + i + 99) * 6.28 });
  }
  return out;
};

// ---------- region A: the sky dome with a white cloud ----------
const RX = 430, RY = 640;
const FIG_S = 0.45;
const SUN_A = [-235, -470];
const CA = [110, -330];
const CLOUD_A = { circles: [[-120, 10, 70], [-40, -45, 95], [65, -35, 85], [140, 15, 60]].map(([x, y, r]) => [CA[0] + x, CA[1] + y, r]), rects: [[CA[0] - 175, CA[1] + 5, 365, 70]] };
const inDome = (p, m = 20) => (p[0] / (RX - m)) ** 2 + (p[1] / (RY - m)) ** 2 < 1 && p[1] < -22;
const SKY = grid(-410, 410, -615, -25, 46, 1, (p) => inDome(p) && !inCloud(p, CLOUD_A, -16) && Math.hypot(p[0] - SUN_A[0], p[1] - SUN_A[1]) > 80 && !(Math.abs(p[0]) < 50 && p[1] > -220));
const DROPS = grid(CA[0] - 180, CA[0] + 200, CA[1] - 150, CA[1] + 80, 22, 2, (p) => inCloud(p, CLOUD_A, 9));
const SKY_HIT = [-250, -215];
const CLOUD_HIT = [CA[0] - 95, CA[1] - 70];
// the dive point on the cloud's left edge, and the close-up world drawn 50x smaller around it
const PB = [CA[0] - 120 - 70 + 4, CA[1] + 6];
const SB = 0.02;
const B = (x, y) => [PB[0] + x * SB, PB[1] + y * SB];
const M_LOC = [-180, -330], D_LOC = [60, 330], D_R = 230;

// ---------- region C: a storm cloud ----------
const C0 = [1250, 0];
const STORM = {
  circles: [[-220, -420, 160], [-60, -520, 210], [130, -470, 190], [260, -390, 140], [-130, -760, 175], [95, -780, 185], [0, -950, 160]].map(([x, y, r]) => [C0[0] + x, y, r]),
  rects: [[C0[0] - 330, -390, 690, 90], [C0[0] - 420, -1160, 860, 95]],
};
const S_TOP = -1160, S_BOT = -300;
const STORM_DROPS = grid(C0[0] - 430, C0[0] + 440, S_TOP, S_BOT, 30, 3, (p) => inCloud(p, STORM, 10));
const SUN_C = [C0[0] - 470, -1250];
// light inside the storm cloud: random walks from the top; most come back out of the top
const WALKS = (() => {
  const top = [], bot = [];
  for (let s = 1; s < 3000 && (top.length < 7 || bot.length < 2); s++) {
    let p = [C0[0] - 280 + 560 * hash(s * 7), S_TOP + 20], a = Math.PI / 2 + (hash(s * 11) - 0.5) * 0.8;
    const pts = [[p[0], S_TOP - 120], p];
    for (let k = 0; k < 80; k++) {
      p = [p[0] + 72 * Math.cos(a), p[1] + 72 * Math.sin(a)]; pts.push(p);
      if (!inCloud(p, STORM)) break;
      a = hash(s * 31 + k * 17) * Math.PI * 2;
    }
    const last = pts[pts.length - 1];
    if (inCloud(last, STORM)) continue;
    if (last[1] < -900 && pts.length > 5 && top.length < 7) top.push(pts);
    else if (last[1] > S_BOT - 60 && bot.length < 2) bot.push(pts);
  }
  return [...top.map((pts) => ({ pts, out: 'top' })), ...bot.map((pts) => ({ pts, out: 'bottom' }))];
})();
function partial(pts, u) {
  const segs = []; let tot = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(l); tot += l; }
  let d = u * tot; const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (d >= segs[i - 1]) { out.push(pts[i]); d -= segs[i - 1]; } else { out.push(L(pts[i - 1], pts[i], d / segs[i - 1])); break; }
  }
  return out;
}

// ---------- camera: eased moves; when the zoom changes a lot, the pan follows 1/zoom so the dive stays put ----------
const KEYS = [
  { t: 0, x: 0, y: -300, z: 1.0 },
  { t: st(5) - 0.05, x: PB[0] + 10, y: PB[1], z: 2.0 },
  { t: st(6) - 0.15, x: PB[0], y: PB[1], z: 6.0 },
  { t: st(7) - 0.15, ...xy(B(M_LOC[0], M_LOC[1] + 70)), z: 50 },
  { t: st(9) - 0.15, ...xy(B(D_LOC[0], D_LOC[1] + 60)), z: 50 },
  { t: st(16) - 0.1, ...xy(B(D_LOC[0], D_LOC[1] + 40)), z: 53 },
  { t: st(17) - 0.1, x: C0[0], y: -600, z: 0.8 },
  { t: st(21) - 0.1, x: C0[0] - 230, y: -700, z: 0.8 },
  { t: st(22) - 0.1, x: C0[0] - 230, y: -560, z: 0.75 },
  { t: st(24) - 0.1, x: 0, y: -300, z: 0.93 },
];
function xy(p) { return { x: p[0], y: p[1] }; }
const DRIFT = 0.015;
function camAt(t) {
  let i = 0; while (i + 1 < KEYS.length && KEYS[i + 1].t <= t) i++;
  const dur = (j) => { const a = KEYS[j - 1], b = KEYS[j]; return clamp(0.6 + Math.abs(Math.log(b.z / a.z)) * 0.25 + Math.hypot(b.x - a.x, b.y - a.y) / 4000, 0.6, 1.2); };
  const hold = (j, tt) => { const kk = KEYS[j]; const t0 = kk.t + (j ? dur(j) : 0); return { x: kk.x, y: kk.y, z: kk.z * (1 + DRIFT * Math.max(0, tt - t0)) }; };
  const k = KEYS[i];
  if (i > 0 && t < k.t + dur(i)) {
    const from = hold(i - 1, k.t), p = easeInOut((t - k.t) / dur(i));
    const z = Math.exp(lerp(Math.log(from.z), Math.log(k.z), p));
    const u = Math.abs(Math.log(k.z / from.z)) > 0.3 ? (1 / z - 1 / from.z) / (1 / k.z - 1 / from.z) : p;
    return { x: lerp(from.x, k.x, u), y: lerp(from.y, k.y, u), z };
  }
  return hold(i, t);
}

// ---------- the world ----------
export function World({ t }) {
  const cam = camAt(t), z = cam.z;
  const aVis = 1 - ramp(z, 7, 12), bVis = ramp(z, 14, 30);
  const tw = (d) => 0.8 + 0.2 * Math.sin(t * 2.2 + d.ph);
  const rays = stream(t, 1.5, 4);

  // ---- hook / same sunlight / same air ----
  const sameSun = win(t, beat(2, 'sunlight') - 0.1, st(5) - 0.2), sameAir = win(t, beat(3, 'air') - 0.1, st(5) - 0.2);
  const diff = beat(4, 'different');
  const midLabels = win(t, beat(6, 'droplets') - 0.6, st(7) - 0.3);

  // ---- close-up world (B) ----
  const Mv = ramp(t, st(7) - 0.3, st(7)) * (1 - 0.8 * ramp(t, st(9) - 0.2, st(9) + 0.3));
  const mSpray = easeOut(ramp(t, beat(7, 'scatter') - 0.1, beat(7, 'scatter') + 0.5));
  const skyGlow = ramp(t, beat(8, 'sky'), beat(8, 'sky') + 0.4);
  const inM = easeInOut(ramp(t, st(7) - 0.1, beat(7, 'small')));
  const D = B(D_LOC[0], D_LOC[1]);
  const Dv = ramp(t, st(9) - 0.5, st(9));
  const wave = ramp(t, beat(9, 'huge') - 0.1, beat(9, 'huge') + 0.4) * (1 - ramp(t, st(10) + 0.2, st(10) + 0.6));
  const inD = easeInOut(ramp(t, st(10) - 0.3, beat(10, 'every')));
  const dSpray = easeOut(ramp(t, beat(10, 'scatter'), beat(10, 'equally') + 0.3));
  const hi = [win(t, st(11), st(12) - 0.05, 0.1), win(t, st(12), st(13) - 0.05, 0.1), win(t, st(13), st(14) - 0.05, 0.1)]; // red, green, blue
  const anyHi = Math.max(...hi);
  const together = ramp(t, beat(14, 'together') - 0.3, beat(14, 'together') + 0.2);
  const whiteP = ramp(t, beat(15, 'white') - 0.05, beat(15, 'white') + 0.3);
  const volt = ramp(t, st(16) + 0.05, st(16) + 0.3) * (1 - ramp(t, st(16) + 1.2, st(16) + 1.8));

  // ---- storm cloud ----
  const sameWater = win(t, beat(18, 'water') - 0.1, st(20) - 0.1), sameDrops = win(t, beat(19, 'droplets') - 0.1, st(20) - 0.1);
  const grey = ramp(t, beat(20, 'grey') - 0.1, beat(20, 'grey') + 0.5);
  const runOut = ramp(t, beat(23, 'light') - 0.3, beat(23, 'light') + 0.3);
  const walkT = (i) => st(21) + 0.15 + i * 0.32;
  const walkOn = 1 - ramp(t, st(24) - 0.3, st(24));
  const youOn = ramp(t, st(22) - 0.2, st(22) + 0.3);
  const shade = (p) => {
    const f = (p[1] - S_TOP) / (S_BOT - S_TOP);
    const band = f < 0.3 ? C.white : f < 0.55 ? '#B4B4B4' : f < 0.78 ? C.ash : '#363636';
    const deep = f < 0.55 ? band : mix(band, '#202020', runOut * (f < 0.78 ? 0.35 : 0.6));
    return mix(C.white, deep, grey);
  };

  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
      <Defs />
      <rect width={1080} height={1920} fill={C.void} />
      <g transform={`translate(540 960) scale(${z}) translate(${-cam.x} ${-cam.y})`}>
        {/* ================= A: SKY + CLOUD ================= */}
        {aVis > 0.01 ? (
          <g opacity={aVis}>
            <path d={`M${-RX},0 A${RX},${RY} 0 0 1 ${RX},0`} {...SW} stroke={C.graphite} />
            {SKY.map((d) => <circle key={d.i} cx={d.p[0]} cy={d.p[1]} r={5} fill={K.blue} opacity={tw(d) * (1 + 0.5 * Math.sin(Math.PI * ramp(t, diff, diff + 0.6)))} />)}
            {/* sunlight to the sky (scatters blue) and to the cloud (comes back white) */}
            <Seg a={SUN_A} b={SKY_HIT} color={C.white} w={4} opacity={0.75} />
            <Seg a={SUN_A} b={CLOUD_HIT} color={C.white} w={4} opacity={0.75} />
            {rays.map(({ k, ph }) => <g key={k}><circle cx={L(SUN_A, SKY_HIT, ph)[0]} cy={L(SUN_A, SKY_HIT, ph)[1]} r={7 / z} fill={C.white} /><circle cx={L(SUN_A, CLOUD_HIT, ph)[0]} cy={L(SUN_A, CLOUD_HIT, ph)[1]} r={7 / z} fill={C.white} /></g>)}
            {[0, 1, 2, 3, 4].map((k) => { const a = (k * 72 + 20) * Math.PI / 180; return <Arrow key={k} a={SKY_HIT} b={[SKY_HIT[0] + 46 * Math.cos(a), SKY_HIT[1] + 46 * Math.sin(a)]} color={K.blue} z={z} w={3} />; })}
            <CloudShape cl={CLOUD_A} />
            {DROPS.map((d) => <circle key={d.i} cx={d.p[0]} cy={d.p[1]} r={6} fill={C.white} opacity={0.75 + 0.25 * Math.sin(t * 1.7 + d.ph)} />)}
            {[[-150, -70], [-100, -150], [-40, -180]].map(([dx, dy], k) => <Arrow key={k} a={CLOUD_HIT} b={[CLOUD_HIT[0] + dx * 0.55, CLOUD_HIT[1] + dy * 0.55]} color={C.white} z={z} w={3} />)}
            <Ring x={CA[0]} y={CA[1] - 30} r={170} t={t} t0={diff} />
            <Sun p={SUN_A} />
            <line x1={-520} y1={0} x2={520} y2={0} {...SW} stroke={C.white} />
            <Figure x={0} y={0} s={FIG_S} color={C.white} opacity={1 - ramp(z, 1.6, 2.6)} />
            {sameSun > 0.01 ? <Pill x={SUN_A[0] + 10} y={SUN_A[1] - 95} z={z} text="SAME SUNLIGHT" opacity={sameSun} /> : null}
            {sameAir > 0.01 ? <Pill x={-215} y={-110} z={z} text="SAME AIR" opacity={sameAir} /> : null}
            {midLabels > 0.01 ? (
              <g opacity={midLabels}>
                <Pill x={PB[0] + 70 / z} y={PB[1] + 175 / z} z={z} text="WATER DROPLETS" />
                <Pill x={PB[0] - 60 / z} y={PB[1] - 210 / z} z={z} text="AIR MOLECULES" color={K.blue} />
              </g>
            ) : null}
          </g>
        ) : null}

        {/* ================= B: CLOSE-UP (drawn 50x smaller inside the cloud's edge) ================= */}
        {bVis > 0.01 ? (
          <g opacity={bVis} transform={`translate(${PB[0]} ${PB[1]}) scale(${SB})`}>
            {(() => {
              const zz = z * SB; // the close-up's own zoom
              const M = M_LOC, Dl = D_LOC;
              const bund = (from, to, k, u, col) => { const off = (k - 2.5) * 7; return <Seg key={k} a={[from[0], from[1] + off]} b={[to[0], to[1] + off]} u1={u} color={col} w={3} />; };
              return (
                <g>
                  {/* the molecule: light comes in from the left, blue sprays everywhere, red goes straight on */}
                  <g opacity={Mv}>
                    {[[-420, -520], [-40, -560], [120, -380], [-330, -140], [80, -160], [-470, -330]].map(([x, y], k) => (
                      <g key={k}><circle cx={x} cy={y} r={9} fill={mix(C.mist, K.blue, skyGlow)} />{skyGlow > 0.01 ? <circle cx={x} cy={y} r={34} fill={K.blue} opacity={0.35 * skyGlow} filter="url(#halo)" /> : null}</g>
                    ))}
                    {SPECTRUM.map((c, k) => bund([-700, M[1]], [M[0] - 12, M[1]], k, inM, c))}
                    <Seg a={[M[0] + 12, M[1] - 17]} b={[700, M[1] - 17]} u1={mSpray} color={K.red} w={3} />
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => { const a = (k * 45 + 22) * Math.PI / 180; return <Arrow key={k} a={[M[0] + 14 * Math.cos(a), M[1] + 14 * Math.sin(a)]} b={[M[0] + 200 * Math.cos(a), M[1] + 200 * Math.sin(a)]} u={mSpray} color={K.blue} z={zz} w={4} />; })}
                    <circle cx={M[0]} cy={M[1]} r={11} fill={C.white} />
                    <ScreenLabel x={M[0]} y={M[1] + 260} z={zz} text="AIR MOLECULE" color={C.mist} opacity={ramp(t, st(7) - 0.2, st(7) + 0.2)} />
                    <ScreenLabel x={M[0]} y={M[1] + 305} z={zz} text="SMALLER THAN A LIGHT WAVE" color={C.ash} opacity={ramp(t, beat(7, 'small') - 0.1, beat(7, 'small') + 0.3)} />
                  </g>
                  {/* the droplet: way bigger than a light wave, scatters every colour equally */}
                  <g opacity={Dv}>
                    {volt > 0.01 ? <circle cx={Dl[0]} cy={Dl[1]} r={D_R * 1.3} fill={C.volt} opacity={0.35 * volt} filter="url(#halo)" /> : null}
                    {whiteP > 0.01 ? <circle cx={Dl[0]} cy={Dl[1]} r={D_R * 1.25} fill={C.white} opacity={0.18 * whiteP * (1 - volt)} filter="url(#halo)" /> : null}
                    {SPECTRUM.map((c, k) => bund([-700, Dl[1]], [Dl[0] - D_R - 6, Dl[1]], k, inD, c))}
                    {Array.from({ length: 12 }, (_, k) => {
                      const ci = [0, 3, 4, 1, 5, 2][k % 6] , col = SPECTRUM[ci];
                      const a = (k * 30 + 15) * Math.PI / 180, a2 = a + (together * 0.0);
                      const which = ci === 0 ? 0 : ci === 3 ? 1 : ci === 4 ? 2 : -1;
                      const focus = which >= 0 ? hi[which] : 0;
                      const op = anyHi > 0.01 ? lerp(1, which >= 0 && hi[which] > 0.5 ? 1 : 0.28, anyHi) : 1;
                      const p0 = [Dl[0] + (D_R + 10) * Math.cos(a2), Dl[1] + (D_R + 10) * Math.sin(a2)], p1 = [Dl[0] + (D_R + 160) * Math.cos(a2), Dl[1] + (D_R + 160) * Math.sin(a2)];
                      return <Arrow key={k} a={p0} b={p1} u={dSpray} color={mix(col, C.white, whiteP * (1 - volt) + volt * 0)} z={zz} w={4 + 4 * focus} glow={focus} opacity={op} />;
                    })}
                    <circle cx={Dl[0]} cy={Dl[1]} r={D_R} {...SW} fill={C.void} stroke={volt > 0.3 ? C.volt : C.white} />
                    <path d={`M${Dl[0] - 150},${Dl[1] - 90} A${D_R - 50},${D_R - 50} 0 0 1 ${Dl[0] - 40},${Dl[1] - 175}`} {...SW} stroke={C.mist} />
                    {wave > 0.01 ? (() => { const pts = []; for (let x = -D_R; x <= D_R; x += 2) pts.push(`${Dl[0] + x},${Dl[1] + 9 * Math.sin((x + D_R) / (2 * D_R) * 20 * 2 * Math.PI)}`); return <polyline points={pts.join(' ')} {...SW} strokeWidth={3} stroke={C.white} opacity={wave} />; })() : null}
                    {wave > 0.01 ?  <ScreenLabel x={Dl[0]} y={Dl[1] + 70} z={zz} text="20 WAVES ACROSS" color={C.white} opacity={wave} /> : null}
                    <ScreenLabel x={Dl[0]} y={Dl[1] - D_R - 200} z={zz} text="WATER DROPLET" color={C.mist} opacity={ramp(t, st(9) - 0.2, st(9) + 0.2) * (1 - ramp(t, beat(10, 'scatter') - 0.3, beat(10, 'scatter')))} />
                  </g>
                </g>
              );
            })()}
          </g>
        ) : null}
        <Ring x={D[0]} y={D[1]} r={D_R * SB * 1.1} t={t} t0={beat(15, 'white')} />
        <Ring x={D[0]} y={D[1]} r={D_R * SB * 1.1} t={t} t0={st(16) + 0.05} color={C.volt} />

        {/* ================= C: STORM CLOUD ================= */}
        <g>
          <line x1={C0[0] - 700} y1={0} x2={C0[0] + 700} y2={0} {...SW} stroke={C.white} />
          <Sun p={SUN_C} r={40} />
          <CloudShape cl={STORM} stroke={mix(C.white, C.mist, grey * 0.5)} />
          {STORM_DROPS.map((d) => <circle key={d.i} cx={d.p[0]} cy={d.p[1]} r={7} fill={shade(d.p)} opacity={0.8 + 0.2 * Math.sin(t * 1.5 + d.ph)} />)}
          {WALKS.map((w, i) => {
            const u = ramp(t, walkT(i), walkT(i) + 1.6 + (w.out === 'bottom' ? 1.2 : 0));
            if (u <= 0) return null;
            const pts = partial(w.pts, u), head = pts[pts.length - 1], prev = pts[pts.length - 2] || pts[0];
            const col = w.out === 'top' ? C.white : mix(C.white, C.ash, 0.4 + 0.4 * runOut);
            return (
              <g key={i} opacity={walkOn * (w.out === 'bottom' ? 0.75 : 1)}>
                <polyline points={pts.map((p) => p.join(',')).join(' ')} {...SW} strokeWidth={3} stroke={col} />
                <g transform={`translate(${head[0]} ${head[1]}) rotate(${(Math.atan2(head[1] - prev[1], head[0] - prev[0]) * 180) / Math.PI}) scale(${1 / z})`}><path d="M4,0 L-16,-10 L-16,10 Z" fill={col} /></g>
              </g>
            );
          })}
          <Figure x={C0[0]} y={0} s={FIG_S} color={C.white} />
          {youOn > 0.01 ? <ScreenLabel x={C0[0]} y={60 / z} z={z} text="YOU" color={C.ash} opacity={youOn} /> : null}
          <Ring x={C0[0]} y={S_BOT - 40} r={260} t={t} t0={beat(20, 'grey')} color={C.mist} />
          {sameWater > 0.01 ?  <Pill x={C0[0] - 240} y={S_TOP - 90} z={z} text="SAME WATER" opacity={sameWater} /> : null}
          {sameDrops > 0.01 ?  <Pill x={C0[0] + 240} y={S_TOP - 90} z={z} text="SAME DROPLETS" opacity={sameDrops} /> : null}
        </g>
      </g>
    </svg>
  );
}

// ---------- screen-space overlays ----------
export function Overlays({ t }) {
  const titleOut = ramp(t, st(2) - 0.12, st(2) + 0.13);
  const w1 = WORDS.filter((w) => w.n === 1 && w.i >= 4);
  const c1 = ramp(t, beat(9, 'huge') - 0.2, beat(9, 'huge') + 0.1) * (1 - ramp(t, st(10) + 0.1, st(10) + 0.4));
  const v1 = Math.round(20 * easeOut(ramp(t, beat(9, 'huge'), beat(9, 'waves') + 0.3)));
  const stampP = pop(t, st(16) + 0.05, 0.35), stampOn = 1 - ramp(t, st(17) - 0.35, st(17) + 0.05);
  const c2 = ramp(t, beat(21, 'most') - 0.2, beat(21, 'most') + 0.1) * (1 - ramp(t, st(24) - 0.4, st(24)));
  const p2 = easeInOut(ramp(t, beat(21, 'most'), beat(21, 'bottom') + 0.2));
  const v2 = p2 < 1 ? `${Math.round(100 - 90 * p2)}%` : '<10%';
  const counter = (val, cap, op, style) => op > 0.01 ? (
    <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: op, ...style }}>
      <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: style.fontSize || 140, color: C.white, fontVariantNumeric: 'tabular-nums', lineHeight: 1, textShadow: '0 0 24px rgba(0,0,0,0.9)' }}>{val}</div>
      <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 24, color: C.mist, letterSpacing: '0.3em', marginTop: 14, textShadow: '0 0 16px rgba(0,0,0,0.9)', textAlign: 'center' }}>{cap}</div>
    </div>
  ) : null;
  return (
    <>
      {titleOut < 1 ? (
        <div style={{ position: 'absolute', left: 90, right: 160, top: 160, textAlign: 'center', opacity: 1 - titleOut, filter: `blur(${10 * titleOut}px)` }}>
          <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 100, lineHeight: 1.04, color: C.white, textShadow: '0 0 28px rgba(255,255,255,0.35), 0 0 20px rgba(0,0,0,0.6)' }}>WHY ARE CLOUDS<br />WHITE…</div>
          <div style={{ marginTop: 14 }}>
            {w1.map((w) => { const p = easeOut(clamp((t - w.t0) / 0.18, 0, 1)); const g = Math.round(138 + 117 * p); return <span key={w.i} style={{ display: 'inline-block', margin: '0 0.14em', fontFamily: FONT.sans, fontWeight: 700, fontSize: 60, opacity: p, color: `rgb(${g},${g},${g})`, filter: `blur(${12 * (1 - p)}px)`, transform: `translateY(${8 * (1 - p)}px)` }}>{w.text}</span>; })}
          </div>
        </div>
      ) : null}
      {counter(`${v1}×`, 'WIDER THAN A LIGHT WAVE', c1, { left: 0, right: 160, top: 1300 })}
      {counter(v2, 'OF THE LIGHT REACHES THE BOTTOM', c2, { left: 20, right: 700, top: 860, fontSize: 120 })}
      {stampP > 0 && stampOn > 0 ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 380, display: 'flex', justifyContent: 'center', opacity: stampOn }}>
          <div style={{ transform: `rotate(-6deg) scale(${stampP})`, border: `8px solid ${C.white}`, borderRadius: 14, padding: '22px 40px', textAlign: 'center', background: 'rgba(0,0,0,0.6)', boxShadow: '0 0 40px rgba(255,255,255,0.25)' }}>
            <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 96, color: C.white, lineHeight: 1.02 }}>MIE</div>
            <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 96, color: C.white, lineHeight: 1.02 }}>SCATTERING</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
