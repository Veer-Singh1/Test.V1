import React, {useMemo} from 'react';
import {Cutout} from '../src/components/Cutout';
import {MarkerStroke} from '../src/components/MarkerStroke';
import {Pin, Sheet, Stars} from '../src/components/Paper';
import {SmokeBurst} from '../src/components/PaperFlame';
import {C, PaperStrip} from '../src/components/PaperStrip';
import {arc, handPath, Pt} from '../src/lib/paths';
import {useOnTwos} from '../src/lib/twos';
import {BEATS, EV, MARKS} from '../src/timeline';

const B = BEATS.orbit.from;
const L = (g: number) => g - B;

// Desk model: a paper Earth pinned through its centre, a paper mountain with a cannon.
export const EC: Pt = [540, 1060];
export const ER = 300; // on-screen radius
const EARTH_SCALE = ER / 950;
const MUZZLE: Pt = [633, 570];
const R0 = Math.hypot(MUZZLE[0] - EC[0], MUZZLE[1] - EC[1]);
const PERIOD = 120; // frames for one full orbit at circular speed
const VC = (2 * Math.PI * R0) / PERIOD;
const GM = VC * VC * R0;

type Shot = {at: number; v: number; colour: string; seed: string};
const SHOTS: Shot[] = [
  {at: L(EV.shot1), v: 0.42, colour: C.cream, seed: 's1'},
  {at: L(EV.shot2), v: 0.64, colour: C.yellow, seed: 's2'},
  {at: L(EV.shot3), v: 0.82, colour: C.orange, seed: 's3'},
  {at: L(EV.shot4), v: 1.0, colour: C.yellow, seed: 's4'},
];

/** Integrate a cannonball under inverse-square gravity; one sample per frame. */
const simulate = (v: number, frames: number): {pts: Pt[]; landed: number} => {
  const rx = MUZZLE[0] - EC[0];
  const ry = MUZZLE[1] - EC[1];
  // fire perpendicular to the radius, heading "east" (clockwise on screen)
  let vx = (-ry / R0) * VC * v;
  let vy = (rx / R0) * VC * v;
  let x = rx;
  let y = ry;
  const pts: Pt[] = [[MUZZLE[0], MUZZLE[1]]];
  let landed = -1;
  const sub = 20;
  for (let i = 1; i <= frames; i++) {
    for (let k = 0; k < sub; k++) {
      const r = Math.hypot(x, y);
      const a = -GM / (r * r * r);
      vx += a * x / sub;
      vy += a * y / sub;
      x += vx / sub;
      y += vy / sub;
    }
    const r = Math.hypot(x, y);
    if (r <= ER + 10) {
      const s = (ER + 10) / r;
      pts.push([EC[0] + x * s, EC[1] + y * s]);
      landed = i;
      break;
    }
    pts.push([EC[0] + x, EC[1] + y]);
  }
  return {pts, landed};
};

const Ball: React.FC<{shot: Shot; f: number}> = ({shot, f}) => {
  const sim = useMemo(() => simulate(shot.v, 400), [shot.v]);
  if (f < shot.at) return null;
  const i = Math.min(sim.pts.length - 1, f - shot.at);
  const p = sim.pts[i];
  // dotted trail: one paper dot per held step
  const dots: React.ReactNode[] = [];
  const start = Math.max(0, i - (shot.v >= 1 ? 110 : 400));
  for (let k = start + 2; k < i; k += 2) {
    const q = sim.pts[k];
    dots.push(<circle key={k} cx={q[0]} cy={q[1]} r={5.5} fill={shot.colour} />);
  }
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, filter: 'drop-shadow(3px 3px 2px rgba(0,0,0,0.4))'}}>
        {dots}
      </svg>
      <Cutout name="star_dot" x={p[0]} y={p[1]} scale={0.7} seed={`ball-${shot.seed}`} />
    </>
  );
};

export const OrbitCannon: React.FC = () => {
  const f = useOnTwos();
  const recoil = SHOTS.some((s) => f >= s.at && f < s.at + 2) ? -7 : 0;
  const sim2 = useMemo(() => simulate(SHOTS[1].v, 400), []);
  const sim3 = useMemo(() => simulate(SHOTS[2].v, 400), []);
  const land2 = sim2.pts[sim2.pts.length - 1];
  const land3 = sim3.pts[sim3.pts.length - 1];
  return (
    <Sheet bg="navy" dir="left">
      <Stars n={36} seed="orbit" />
      <Cutout name="earth" x={EC[0]} y={EC[1]} scale={EARTH_SCALE} seed="earth-orbit" />
      <Cutout name="mountain" x={540} y={772} scale={0.65} anchor={[0.5, 270 / 292]} seed="mtn" />
      <Cutout name="cannon" x={560 + recoil} y={614} scale={0.55} anchor={[0.4, 0.85]} seed="cannon" />
      <Pin x={EC[0]} y={EC[1]} />
      {SHOTS.map((s) => (
        <React.Fragment key={s.seed}>
          <SmokeBurst x={MUZZLE[0] + 10} y={MUZZLE[1]} from={s.at} n={2} spread={50} size={0.22} seed={`muz${s.seed}`} dur={14} />
          <Ball shot={s} f={f} />
        </React.Fragment>
      ))}

      <PaperStrip text="faster…" x={land2[0] + 120} y={land2[1] + 10} size={42} from={L(MARKS.orbitFaster1)} mode="type" rotate={-4} bg={C.yellow} />
      <PaperStrip text="even faster…" x={land3[0] + 30} y={land3[1] + 130} size={42} from={L(MARKS.orbitFaster2)} mode="type" rotate={3} bg={C.orange} />
      <MarkerStroke d={handPath(arc(EC[0], EC[1], R0 + 52, -100, -10, 10), 'fastenough', 3)} from={L(EV.shot4) + 30} steps={8} color={C.cream} width={9} arrow arrowSize={24} />
      <PaperStrip text="FAST ENOUGH" x={880} y={600} size={60} font="head" from={L(EV.shot4) + 40} mode="stamp" rotate={6} />

      <PaperStrip text="NEWTON'S CANNON" x={540} y={300} size={92} font="head" from={4} until={L(EV.orbitHeadline)} mode="type" cps={2} rotate={-1.5} />
      <PaperStrip text="ORBIT = FALLING SIDEWAYS" x={540} y={300} size={80} font="head" bg={C.yellow} from={L(EV.orbitHeadline)} mode="stamp" rotate={1} />
      <PaperStrip text="IT NEVER LANDS" x={540} y={455} size={76} font="head" bg={C.orange} from={L(EV.neverLands)} mode="stamp" rotate={-2.5} />
    </Sheet>
  );
};
