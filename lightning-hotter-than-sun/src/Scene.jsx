// "Is lightning hotter than the Sun?": one continuous shot on a black canvas.
// Regions: A = the Sun vs a bolt (hook and payoff), B = the belief (a crowd under the Sun),
// C1-C3 = three everyday storms, D (= C3) = the main bolt: a zoom into its channel (30,000 °C, plasma,
// an atom losing its electrons), then the shock wave that becomes thunder, and flash-to-bang counting.
import React from 'react';
import { C, FONT } from './kit/palette.js';
import { Defs, Figure, ScreenLabel, Pill, Ring, SW } from './kit/elements.jsx';
import { sent, beat, WORDS, clamp, lerp, easeOut, easeInOut, ramp, pop } from './timing.js';

const st = (n) => sent(n).start;
const en = (n) => sent(n).end;

// ---------- helpers ----------
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hx = (a) => '#' + a.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
const mix = (a, b, p) => { const A = rgb(a), B = rgb(b); p = clamp(p, 0, 1); return hx(A.map((v, i) => v + (B[i] - v) * p)); };
const hash = (i) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const L = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
const win = (t, a, b, f = 0.25) => ramp(t, a - f, a) * (1 - ramp(t, b, b + f));
const bump = (t, t0, d = 0.5) => Math.sin(Math.PI * ramp(t, t0, t0 + d));
const pts = (arr) => arr.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
function partial(arr, u) {
  if (u >= 1) return arr;
  const segs = []; let tot = 0;
  for (let i = 1; i < arr.length; i++) { const l = Math.hypot(arr[i][0] - arr[i - 1][0], arr[i][1] - arr[i - 1][1]); segs.push(l); tot += l; }
  let d = u * tot; const out = [arr[0]];
  for (let i = 1; i < arr.length; i++) { if (d >= segs[i - 1]) { out.push(arr[i]); d -= segs[i - 1]; } else { out.push(L(arr[i - 1], arr[i], d / segs[i - 1])); break; } }
  return out;
}
function Sun({ p, r = 46, opacity = 1, glow = 1 }) {
  return <g opacity={opacity}><circle cx={p[0]} cy={p[1]} r={r * 1.8} fill={C.white} opacity={0.22 * glow} filter="url(#halo)" /><circle cx={p[0]} cy={p[1]} r={r} fill={C.white} /></g>;
}
// a lightning bolt: glowing jagged line (with branches) drawn top-down by u, flickering by `on`
function Bolt({ main, branches = [], u = 1, on = 1, color = C.white, z = 1 }) {
  if (on <= 0.01 || u <= 0.01) return null;
  const m = partial(main, u);
  return (
    <g opacity={on}>
      <polyline points={pts(m)} {...SW} strokeWidth={18} stroke={color} opacity={0.35} filter="url(#halo)" />
      {branches.map((b, i) => (u > b.at ? <polyline key={i} points={pts(partial(b.pts, clamp((u - b.at) / (1 - b.at), 0, 1)))} {...SW} strokeWidth={3} stroke={color} opacity={0.8} /> : null))}
      <polyline points={pts(m)} {...SW} strokeWidth={6} stroke={color} />
    </g>
  );
}
// strike: draws in fast, flickers twice, then fades to a dim afterimage
const strike = (t, t0) => {
  if (t < t0) return { u: 0, on: 0 };
  const u = easeOut(ramp(t, t0, t0 + 0.18));
  const f = t - t0;
  const on = f < 0.18 ? 1 : f < 0.26 ? 0.35 : f < 0.36 ? 1 : f < 0.44 ? 0.5 : Math.max(0.12, 1 - (f - 0.44) / 0.8);
  return { u, on };
};
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
const cloudAt = (cx, cy, s = 1) => ({ circles: [[-150, 40, 90], [-50, -10, 120], [80, 0, 110], [190, 40, 80]].map(([x, y, r]) => [cx + x * s, cy + y * s, r * s]), rects: [[cx - 240 * s, cy + 50 * s, 500 * s, 80 * s]] });
function zig(a, b, n, seed, amp) {
  const out = [a];
  for (let i = 1; i < n; i++) { const p = L(a, b, i / n); out.push([p[0] + (hash(seed + i) - 0.5) * 2 * amp, p[1] + (hash(seed + i + 50) - 0.5) * amp * 0.4]); }
  out.push(b); return out;
}

// ---------- world layout ----------
const GROUND_B = 1700;
const hill = (x) => GROUND_B - 70 * Math.max(0, Math.sin((x - 3100) / 220));
// A: the Sun vs a bolt
const SUN_A = [-230, -360], BOLT_A = zig([170, -700], [300, -8], 7, 11, 70), BRANCH_A = [{ at: 0.35, pts: zig(BOLT_A[2], [60, -330], 3, 21, 30) }];
// B: the belief
const SUN_B = [0, 1080], CROWD = [-440, -220, 0, 220, 440];
// C1-C3
const C1 = 1350, C2 = 2550, C3 = 3750;
const CLOUD1 = cloudAt(C1, 1150, 0.7), BOLT1 = zig([C1 - 30, 1250], [C1 - 60, GROUND_B], 6, 31, 45);
const WIN = { x: C2 - 210, y: 1100, w: 420, h: 520 };
const BOLT2 = zig([C2 + 40, 1060], [C2 - 20, 1660], 6, 41, 50);
const BOLTD = [[3720, 1235], [3690, 1290], [3735, 1350], [3700, 1420], [3712, 1470], [3680, 1540], [3720, 1610], [3700, hill(3700)]];
const BRANCHD = [{ at: 0.3, pts: [[3735, 1350], [3790, 1400], [3812, 1462], [3850, 1500]] }, { at: 0.65, pts: [[3680, 1540], [3640, 1580], [3630, 1630]] }];
const P = [3706, 1445]; // the point the camera dives into
const TD = (() => { const dx = 12, dy = 50, l = Math.hypot(dx, dy); return [dx / l, dy / l]; })();
const TN = [-TD[1], TD[0]];
const TUBE = 10;
const AIR = (() => {
  const out = []; let i = 0;
  for (let y = P[1] - 230; y <= P[1] + 230; y += 9) for (let x = P[0] - 140; x <= P[0] + 140; x += 9) {
    i++; const p = [x + (hash(i + 900) - 0.5) * 5, y + (hash(i + 1900) - 0.5) * 5];
    const d = (p[0] - P[0]) * TN[0] + (p[1] - P[1]) * TN[1];
    out.push({ p, inside: Math.abs(d) < TUBE - 2, i, ph: hash(i) * 6.28 });
  }
  return out;
})();
const ATOM_S = 0.04; // the atom is drawn 25x smaller, inside the channel
const FAR = [4600, hill(4600)]; // the listener about 1 km away
const FAR_HEAD = [FAR[0], FAR[1] - 372 * 0.45];
const SHOCK_C = [3708, 1460];

// ---------- camera ----------
const KEYS = [
  { t: 0, x: 0, y: -250, z: 0.95 },
  { t: st(3) - 0.15, x: 0, y: 1330, z: 0.9 },
  { t: st(5) - 0.15, x: C1, y: 1380, z: 0.9 },
  { t: st(6) - 0.15, x: C2, y: 1380, z: 0.9 },
  { t: st(7) - 0.15, x: C3, y: 1380, z: 0.85 },
  { t: st(8) - 0.1, x: 3720, y: 1450, z: 1.35 },
  { t: st(10) - 0.1, x: P[0] - 160 / 7, y: P[1], z: 7 },
  { t: st(13) - 0.1, x: P[0], y: P[1], z: 58 },
  { t: st(14) - 0.1, x: 3900, y: 1440, z: 0.85 },
  { t: st(17) + 0.1, x: 4150, y: 1450, z: 0.72 },
  { t: st(21) - 0.1, x: 0, y: -250, z: 0.9 },
];
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
  const near = ramp(z, 0.6, 0.75);
  // A
  const aBolt = { u: 1, on: 0.85 + 0.15 * Math.sin(t * 23) * Math.sin(t * 7.1) };
  const temps = Math.max(1 - ramp(t, st(3) - 0.4, st(3)), ramp(t, beat(21, 'hotter') - 0.3, beat(21, 'hotter')));
  // B
  const crowdOn = ramp(t, st(3) - 0.3, st(3) + 0.2);
  const notBolt = strike(t, beat(4, 'not') - 0.05);
  // C
  const s1 = strike(t, beat(5, 'flash') - 0.05), s2 = strike(t, beat(6, 'crack') - 0.05);
  const cloudDx = lerp(-160, 0, easeInOut(ramp(t, st(7) - 0.4, st(8))));
  const CLOUDD = cloudAt(C3 + cloudDx, 1100);
  const rainOn = ramp(t, st(7) - 0.4, st(7)) * (1 - ramp(t, st(21) - 0.6, st(21)));
  // D: the strike, the channel, plasma, the atom
  const sD = strike(t, beat(9, 'slams') - 0.05);
  const dOn = t < beat(9, 'slams') - 0.05 ? 0 : t < st(14) - 0.2 ? Math.max(sD.on, 0.9) : t < beat(19, 'flash') - 0.05 ? 0.35 : null;
  const reS = strike(t, beat(19, 'flash') - 0.05);
  const boltD = dOn === null ? reS : { u: sD.u, on: dOn };
  const airVis = ramp(z, 2.2, 4) * (1 - ramp(z, 18, 30));
  const heat = easeInOut(ramp(t, beat(10, 'heats'), beat(10, 'degrees') + 0.3));
  const volt = ramp(t, st(12) + 0.05, st(12) + 0.3) * (1 - ramp(t, st(12) + 1.3, st(12) + 2.0));
  const atomVis = ramp(z, 24, 44);
  const rip = easeOut(ramp(t, beat(13, 'ripped') - 0.1, beat(13, 'apart') + 0.5));
  const tubeVis = ramp(z, 2.2, 4);
  // thunder: shock front vs the speed of sound
  const sh0 = beat(15, 'explodes') - 0.1;
  const shockR = 1100 * easeOut(ramp(t, sh0, en(16) + 0.3));
  const soundR = 520 * ramp(t, sh0, en(16) + 0.3);
  const shockOn = ramp(t, sh0, sh0 + 0.1) * (1 - ramp(t, st(19) - 0.3, st(19)));
  const boomV = ramp(t, beat(18, 'boom') - 0.1, beat(18, 'boom') + 0.15) * (1 - ramp(t, beat(18, 'boom') + 1.0, beat(18, 'boom') + 1.6));
  // flash to bang
  const fl = beat(19, 'flash'), bang = beat(20, 'kilometre');
  const lightLine = win(t, fl - 0.02, fl + 0.5, 0.05);
  const soundT = ramp(t, fl, bang);
  const toFar = Math.hypot(FAR_HEAD[0] - SHOCK_C[0], FAR_HEAD[1] - SHOCK_C[1]);
  const ruler = ramp(t, st(20), st(20) + 0.4) * (1 - ramp(t, st(21) - 0.3, st(21)));
  const farOn = ramp(t, st(17) - 0.5, st(17));

  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
      <Defs />
      <rect width={1080} height={1920} fill={C.void} />
      <g transform={`translate(540 960) scale(${z}) translate(${-cam.x} ${-cam.y})`}>
        {/* ================= A: SUN vs LIGHTNING ================= */}
        <Sun p={SUN_A} r={130} />
        <Bolt main={BOLT_A} branches={BRANCH_A} u={aBolt.u} on={aBolt.on} z={z} />
        <line x1={-560} y1={0} x2={560} y2={0} {...SW} stroke={C.white} />
        {temps > 0.01 ? (
          <g opacity={temps}>
            <Pill x={SUN_A[0]} y={95} z={z} text="SUN'S SURFACE ~5,500 °C" color={C.mist} />
            <Pill x={260} y={175} z={z} text="LIGHTNING ~30,000 °C" color={C.white} />
          </g>
        ) : null}
        <Ring x={260} y={-380} r={260} t={t} t0={beat(2, 'five')} />
        <Ring x={260} y={-380} r={260} t={t} t0={beat(21, 'hotter')} />

        {/* ================= B: "the hottest thing you'll ever see" ================= */}
        <Sun p={SUN_B} r={110} />
        <line x1={-560} y1={GROUND_B} x2={560} y2={GROUND_B} {...SW} stroke={C.white} />
        {crowdOn > 0.01 ? CROWD.map((dx, i) => {
          const s = pop(t, st(3) + i * 0.08);
          return <g key={dx} transform={`translate(${dx} ${GROUND_B}) scale(${s}) translate(${-dx} ${-GROUND_B})`} opacity={crowdOn}><Figure x={dx} y={GROUND_B} s={0.5} color={i === 2 ? C.white : C.mist} /></g>;
        }) : null}
        {crowdOn > 0.01 ? <Pill x={SUN_B[0] + 260} y={SUN_B[1] - 150} z={z} text="THE HOTTEST?" opacity={ramp(t, beat(3, 'hottest') - 0.1, beat(3, 'hottest') + 0.25)} /> : null}
        <Bolt main={zig([330, 900], [300, GROUND_B], 6, 61, 60)} u={notBolt.u} on={notBolt.on} z={z} />

        {/* ================= C1: a flash in the sky ================= */}
        <CloudShape cl={CLOUD1} />
        <Bolt main={BOLT1} u={s1.u} on={s1.on} z={z} />
        <line x1={C1 - 560} y1={GROUND_B} x2={C1 + 560} y2={GROUND_B} {...SW} stroke={C.white} />
        <Figure x={C1 + 220} y={GROUND_B} s={0.5} color={C.white} />
        {/* ================= C2: a crack outside your window ================= */}
        <defs><clipPath id="win"><rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} /></clipPath></defs>
        <g clipPath="url(#win)"><Bolt main={BOLT2} u={s2.u} on={s2.on} z={z} /></g>
        <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} {...SW} stroke={C.white} />
        <line x1={C2} y1={WIN.y} x2={C2} y2={WIN.y + WIN.h} {...SW} stroke={C.white} />
        <line x1={WIN.x} y1={WIN.y + WIN.h / 2} x2={WIN.x + WIN.w} y2={WIN.y + WIN.h / 2} {...SW} stroke={C.white} />
        {[0, 1, 2].map((k) => <Ring key={k} x={C2 + 40} y={1380} r={200 + 80 * k} t={t} t0={beat(6, 'crack') + k * 0.12} />)}
        <line x1={C2 - 560} y1={GROUND_B} x2={C2 + 560} y2={GROUND_B} {...SW} stroke={C.white} />
        <Figure x={C2 - 360} y={GROUND_B} s={0.5} color={C.white} />
        {s2.on > 0.01 ? <Pill x={C2 + 330} y={1180} z={z} text="CRACK!" opacity={win(t, beat(6, 'crack'), st(7) - 0.2, 0.1)} /> : null}

        {/* ================= C3 / D: the storm over the hills, and the main bolt ================= */}
        <polyline points={pts(Array.from({ length: 80 }, (_, i) => { const x = 3150 + i * 25; return [x, hill(x)]; }))} {...SW} stroke={C.white} />
        {rainOn > 0.01 ? (
          <g opacity={0.45 * rainOn}>
            {Array.from({ length: 40 }, (_, i) => { const x = 3540 + hash(i) * 440 + cloudDx, y0 = 1270 + (((hash(i + 40) * 400 + t * 520) % 400)); return y0 < hill(x) - 10 ? <line key={i} x1={x} y1={y0} x2={x - 8} y2={y0 + 28} {...SW} strokeWidth={3} stroke={C.mist} /> : null; })}
          </g>
        ) : null}
        <CloudShape cl={CLOUDD} />
        {/* air molecules around the channel: grey, heating to white inside it */}
        {airVis > 0.01 ? (
          <g opacity={airVis}>
            {AIR.map((d) => {
              const h = d.inside ? heat : 0;
              const jig = d.inside ? 0.6 * heat + 1.6 * rip : 0;
              const p = [d.p[0] + jig * Math.sin(t * 31 + d.ph), d.p[1] + jig * Math.cos(t * 27 + d.ph)];
              return <circle key={d.i} cx={p[0]} cy={p[1]} r={2.3} fill={volt > 0.3 && d.inside ? C.volt : mix(C.ash, C.white, h)} />;
            })}
          </g>
        ) : null}
        {tubeVis > 0.01 ? (
          <g opacity={tubeVis}>
            {volt > 0.01 ? <line x1={P[0] - TD[0] * 260} y1={P[1] - TD[1] * 260} x2={P[0] + TD[0] * 260} y2={P[1] + TD[1] * 260} {...SW} strokeWidth={90} stroke={C.volt} opacity={0.35 * volt} filter="url(#halo)" /> : null}
            {heat > 0.01 ? <line x1={P[0] - TD[0] * 260} y1={P[1] - TD[1] * 260} x2={P[0] + TD[0] * 260} y2={P[1] + TD[1] * 260} {...SW} strokeWidth={60} stroke={C.white} opacity={0.18 * heat * (1 - volt)} filter="url(#halo)" /> : null}
            {[-1, 1].map((s) => <line key={s} x1={P[0] - TD[0] * 260 + s * TN[0] * TUBE} y1={P[1] - TD[1] * 260 + s * TN[1] * TUBE} x2={P[0] + TD[0] * 260 + s * TN[0] * TUBE} y2={P[1] + TD[1] * 260 + s * TN[1] * TUBE} {...SW} stroke={volt > 0.3 ? C.volt : C.white} />)}
            <Pill x={P[0] + TN[0] * TUBE + 150 / z} y={P[1] - 330 / z} z={z} text="LIGHTNING CHANNEL" color={C.white} opacity={ramp(z, 5, 6.5) * (1 - ramp(z, 12, 20))} />
             <Pill x={P[0] - TN[0] * TUBE - 330 / z} y={P[1] - 150 / z} z={z} text="AIR" color={C.mist} opacity={ramp(z, 5, 6.5) * (1 - ramp(z, 12, 20))} />
          </g>
        ) : null}
        {/* an atom inside the channel, losing its electrons */}
        {atomVis > 0.01 ? (
          <g opacity={atomVis} transform={`translate(${P[0]} ${P[1]}) scale(${ATOM_S})`}>
            {[-30, 30].map((a, k) => <ellipse key={k} cx={0} cy={0} rx={230} ry={90} transform={`rotate(${a})`} {...SW} stroke={mix(C.white, C.graphite, rip)} opacity={1 - 0.6 * rip} />)}
            {[0, 1].map((k) => {
              const a = (k ? 30 : -30) * Math.PI / 180, th = t * 4 + k * Math.PI;
              const ex = 230 * Math.cos(th), ey = 90 * Math.sin(th);
              const orb = [ex * Math.cos(a) - ey * Math.sin(a), ex * Math.sin(a) + ey * Math.cos(a)];
              const dir = k ? [0.8, -0.6] : [-0.7, 0.7];
              const p = [orb[0] + dir[0] * 700 * rip, orb[1] + dir[1] * 700 * rip];
              return (
                <g key={k}>
                  {rip > 0.02 ? <line x1={orb[0]} y1={orb[1]} x2={p[0]} y2={p[1]} {...SW} stroke={C.mist} opacity={0.6} /> : null}
                  <circle cx={p[0]} cy={p[1]} r={20} fill={C.white} />
                </g>
              );
            })}
            <circle cx={0} cy={0} r={46} fill={C.white} />
            <circle cx={0} cy={0} r={120} fill={C.white} opacity={0.2 * rip} filter="url(#halo)" />
          </g>
        ) : null}
        {atomVis > 0.5 ? <ScreenLabel x={P[0]} y={P[1] + 190 / z} z={z} text="AN ATOM IN THE AIR" color={C.mist} opacity={(atomVis - 0.5) * 2 * (1 - rip)} /> : null}
        {atomVis > 0.5 && rip > 0.05 ? <Pill x={P[0]} y={P[1] - 380 / z} z={z} text="ELECTRONS RIPPED OFF" opacity={rip} /> : null}

        <Bolt main={BOLTD} branches={BRANCHD} u={boltD.u} on={boltD.on * (1 - tubeVis * 0.85)} z={z} />

        {/* the shock wave (faster than sound) and the sound itself */}
        {shockOn > 0.01 ? (
          <g opacity={shockOn}>
            <circle cx={SHOCK_C[0]} cy={SHOCK_C[1]} r={soundR} {...SW} strokeDasharray="10 14" stroke={C.ash} />
            {boomV > 0.01 ? <circle cx={SHOCK_C[0]} cy={SHOCK_C[1]} r={shockR} {...SW} strokeWidth={40} stroke={C.volt} opacity={0.4 * boomV} filter="url(#halo)" /> : null}
            <circle cx={SHOCK_C[0]} cy={SHOCK_C[1]} r={shockR} {...SW} strokeWidth={7} stroke={boomV > 0.3 ? C.volt : C.white} />
            <Pill x={SHOCK_C[0] + Math.min(shockR, 470) * 0.94} y={SHOCK_C[1] - Math.min(shockR, 470) * 0.34} z={z} text="SHOCK WAVE" opacity={ramp(t, sh0 + 0.4, sh0 + 0.7) * (1 - ramp(t, st(16) - 0.2, st(16)))} />
            <Pill x={SHOCK_C[0] - Math.min(soundR, 330) * 0.5} y={SHOCK_C[1] + Math.min(soundR, 330) * 0.87 + 30} z={z} text="SPEED OF SOUND" color={C.mist} opacity={ramp(t, beat(15, 'sound') - 0.3, beat(15, 'sound')) * (1 - ramp(t, st(16) - 0.2, st(16)))} />
          </g>
        ) : null}
        <Ring x={SHOCK_C[0]} y={SHOCK_C[1]} r={240} t={t} t0={beat(16, 'thunder')} />
        {/* the listener about 1 km away */}
        {farOn > 0.01 ? (
          <g opacity={farOn}>
            <Figure x={FAR[0]} y={FAR[1]} s={0.45} color={C.white} />
            <ScreenLabel x={FAR[0]} y={FAR[1] + 70 / z} z={z} text="YOU" color={C.ash} />
          </g>
        ) : null}
        <Ring x={FAR_HEAD[0]} y={FAR_HEAD[1]} r={90} t={t} t0={beat(18, 'boom')} color={C.volt} />
        <Ring x={FAR_HEAD[0]} y={FAR_HEAD[1]} r={90} t={t} t0={bang} />
        {lightLine > 0.01 ? <line x1={SHOCK_C[0]} y1={SHOCK_C[1]} x2={FAR_HEAD[0]} y2={FAR_HEAD[1]} {...SW} stroke={C.white} opacity={lightLine} /> : null}
        {soundT > 0 && soundT < 1 ? <circle cx={SHOCK_C[0]} cy={SHOCK_C[1]} r={toFar * soundT} {...SW} strokeWidth={5} stroke={C.white} opacity={0.85} /> : null}
        {ruler > 0.01 ? (
          <g opacity={ruler}>
            <line x1={SHOCK_C[0]} y1={1780} x2={FAR[0]} y2={1780} {...SW} stroke={C.mist} />
            <line x1={SHOCK_C[0]} y1={1755} x2={SHOCK_C[0]} y2={1805} {...SW} stroke={C.mist} />
            <line x1={FAR[0]} y1={1755} x2={FAR[0]} y2={1805} {...SW} stroke={C.mist} />
            <Pill x={(SHOCK_C[0] + FAR[0]) / 2} y={1780} z={z} text="≈ 1 KM" />
          </g>
        ) : null}
      </g>
    </svg>
  );
}

// ---------- screen-space overlays ----------
export function Overlays({ t }) {
  const titleOut = ramp(t, st(2) - 0.12, st(2) + 0.13);
  // white sky flash when lightning strikes
  const flashes = [beat(4, 'not'), beat(5, 'flash'), beat(6, 'crack'), beat(9, 'slams'), beat(19, 'flash')];
  const fl = Math.max(...flashes.map((f) => { const d = t - (f - 0.05); return d < 0 ? 0 : d < 0.08 ? 0.22 : d < 0.16 ? 0.05 : d < 0.24 ? 0.14 : 0; }));
  const counter = (val, cap, op, style) => op > 0.01 ? (
    <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: op, ...style }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ...(style.bg ? { background: 'rgba(0,0,0,0.88)', padding: '16px 28px', borderRadius: 18 } : {}) }}>
      <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: style.fontSize || 140, color: style.color || C.white, fontVariantNumeric: 'tabular-nums', lineHeight: 1, textShadow: '0 0 24px rgba(0,0,0,0.9)' }}>{val}</div>
      <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 24, color: C.mist, letterSpacing: '0.3em', marginTop: 12, textShadow: '0 0 16px rgba(0,0,0,0.9)', textAlign: 'center' }}>{cap}</div>
      </div>
    </div>
  ) : null;
  const c5 = win(t, beat(2, 'five') - 0.2, st(3) - 0.3, 0.2);
  const v5 = Math.max(1, Math.round(5 * easeOut(ramp(t, beat(2, 'five') - 0.2, beat(2, 'hotter') + 0.2))));
  const cT = ramp(t, beat(10, 'heats') - 0.2, beat(10, 'heats')) * (1 - ramp(t, st(13) - 0.35, st(13) - 0.05));
  const vT = Math.round(30000 * easeOut(ramp(t, beat(10, 'heats'), beat(10, 'degrees') + 0.3)) / 100) * 100;
  const cS = ramp(t, beat(11, 'sun') - 0.2, beat(11, 'sun')) * (1 - ramp(t, st(13) - 0.35, st(13) - 0.05));
  const vS = Math.round(5500 * easeOut(ramp(t, beat(11, 'only'), beat(11, 'thousand') + 0.2)) / 100) * 100;
  const stampP = pop(t, st(12) + 0.05, 0.35), stampOn = 1 - ramp(t, st(13) - 0.35, st(13) + 0.05);
  const fl19 = beat(19, 'flash'), bang = beat(20, 'kilometre');
  const cSec = ramp(t, fl19, fl19 + 0.2) * (1 - ramp(t, st(21) - 0.3, st(21)));
  const sec = 3 * ramp(t, fl19, bang);
  const fmt = (n) => n.toLocaleString('en-US');
  return (
    <>
      {fl > 0 ? <div style={{ position: 'absolute', inset: 0, background: C.white, opacity: fl }} /> : null}
      {titleOut < 1 ? (
        <div style={{ position: 'absolute', left: 90, right: 160, top: 150, textAlign: 'center', opacity: 1 - titleOut, filter: `blur(${10 * titleOut}px)` }}>
          <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 96, lineHeight: 1.04, color: C.white, textShadow: '0 0 28px rgba(255,255,255,0.35), 0 0 20px rgba(0,0,0,0.6)' }}>IS LIGHTNING<br />HOTTER THAN<br />THE SUN?</div>
        </div>
      ) : null}
      {counter(`${v5}×`, 'HOTTER', c5, { left: 440, right: 400, top: 590, fontSize: 120 })}
      {counter(`${fmt(vT)}°C`, 'LIGHTNING CHANNEL', cT, { left: 20, right: 560, top: 1090, fontSize: 104, bg: true })}
      {counter(`${fmt(vS)}°C`, "SUN'S SURFACE", cS, { left: 20, right: 560, top: 1330, fontSize: 84, color: C.mist, bg: true })}
      {counter(sec >= 2.999 ? '3 S' : `${sec.toFixed(1)} S`, sec >= 2.999 ? 'FLASH TO BANG ≈ 1 KM' : 'AFTER THE FLASH', cSec, { left: 0, right: 160, top: 1290, fontSize: 120 })}
      {stampP > 0 && stampOn > 0 ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 440, display: 'flex', justifyContent: 'center', opacity: stampOn }}>
          <div style={{ transform: `rotate(-6deg) scale(${stampP})`, border: `8px solid ${C.white}`, borderRadius: 14, padding: '22px 46px', textAlign: 'center', background: 'rgba(0,0,0,0.6)', boxShadow: '0 0 40px rgba(255,255,255,0.25)' }}>
            <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 120, color: C.white, lineHeight: 1.02 }}>PLASMA</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
