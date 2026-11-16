import React from 'react';
import {Sequence} from 'remotion';
import {Cutout} from '../src/components/Cutout';
import {MarkerStroke} from '../src/components/MarkerStroke';
import {Sheet, Stars} from '../src/components/Paper';
import {PaperSmoke} from '../src/components/PaperFlame';
import {C, PaperStrip} from '../src/components/PaperStrip';
import {RocketStack} from '../src/components/Rocket';
import {handPath, line, Pt, smoothPath} from '../src/lib/paths';
import {Easing, keys, useOnTwos} from '../src/lib/twos';
import {BEATS, EV, MARKS} from '../src/timeline';

const B = BEATS.move.from;
const L = (g: number) => g - B; // global -> local frame

// balloon zipping around the desk (local frames)
const BAL_T = [4, 20, 34, 48, 62, 76, 92];
const BAL_X = [250, 430, 700, 880, 760, 620, 1250];
const BAL_Y = [1380, 1150, 1080, 860, 640, 760, 560];

const balloonAt = (f: number) => {
  const x = keys(f, BAL_T, BAL_X, Easing.linear);
  const y = keys(f, BAL_T, BAL_Y, Easing.linear);
  const x2 = keys(f + 2, BAL_T, BAL_X, Easing.linear);
  const y2 = keys(f + 2, BAL_T, BAL_Y, Easing.linear);
  const ang = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI + 90;
  return {x, y, ang};
};

export const HowItMoves: React.FC = () => {
  const f = useOnTwos();
  const bal = balloonAt(f);
  const rocketOn = f >= L(EV.rocketThrust) - 6;
  const hover = rocketOn ? keys(f, [L(EV.rocketThrust), 216], [0, -60], Easing.inOut(Easing.quad)) : 0;
  const nozzleY = 1170 + hover;

  // little puffs of air left behind the balloon's neck
  const puffs = [];
  for (let k = 8; k <= 86; k += 6) {
    const b = balloonAt(k);
    const r = (b.ang * Math.PI) / 180;
    puffs.push(
      <PaperSmoke key={k} x={b.x - Math.sin(r) * 110} y={b.y + Math.cos(r) * 110} from={k} dur={22} seed={`air${k}`} s0={0.1} s1={0.26} dx={-Math.sin(r) * 60} dy={Math.cos(r) * 60} />,
    );
  }

  const downArrow: Pt[] = line([330, 1190], [330, 1470], 4);
  const upArrow: Pt[] = line([760, 1060], [760, 690], 4);

  return (
    <Sheet bg="warm" dir="right">
      {/* part A: the balloon */}
      {f < 100 && (
        <>
          {puffs}
          <Cutout name="balloon" x={bal.x} y={bal.y} scale={0.62} rotate={bal.ang} seed="balloon" anchor={[0.5, 0.45]} />
          <PaperStrip text="air shoots out one way…" x={330} y={1500} size={42} from={18} until={100} mode="type" rotate={-2} />
          <PaperStrip text="…the balloon goes the other" x={640} y={500} size={42} from={40} until={100} mode="type" rotate={1.5} bg={C.yellow} />
        </>
      )}

      {/* part C: no air needed - a navy "space" sheet slides in behind the rocket */}
      {f >= L(EV.vacuumSheet) && (
        <Sequence from={L(EV.vacuumSheet)}>
          <Sheet bg="navy" dir="left" tilt={1.5}>
            <Stars n={26} seed="vac" />
          </Sheet>
        </Sequence>
      )}

      {/* part B: the rocket and its action / reaction arrows */}
      {rocketOn && (
        <>
          <RocketStack x={540} y={nozzleY} scale={0.55} seed="move" flameFrom={L(EV.rocketThrust)} flameScale={1.1} />
          <MarkerStroke d={handPath(downArrow, 'dn', 4)} from={L(MARKS.moveDown)} steps={7} color={C.orange} width={16} arrow />
          <PaperStrip text="exhaust pushed DOWN" x={330} y={1530} size={42} from={L(MARKS.moveDown) + 8} mode="type" rotate={-2} />
          <MarkerStroke d={handPath(upArrow, 'up2', 4)} from={L(MARKS.moveUp)} steps={7} color={C.yellow} width={16} arrow />
          <PaperStrip text="rocket pushed UP" x={790} y={630} size={42} from={L(MARKS.moveUp) + 8} mode="type" rotate={2} bg={C.yellow} />
        </>
      )}

      <PaperStrip text="THROW MASS OUT THE BACK" x={540} y={300} size={80} font="head" from={4} until={L(EV.rocketThrust)} mode="type" cps={2} rotate={-1} />
      <PaperStrip text="PUSH DOWN, GO UP" x={540} y={300} size={80} font="head" bg={C.yellow} from={L(EV.rocketThrust)} until={L(EV.vacuumSheet) + 10} mode="stamp" rotate={1} />
      <PaperStrip text="NO AIR NEEDED" x={540} y={300} size={96} font="head" bg={C.orange} from={L(EV.vacuumSheet) + 10} mode="stamp" rotate={-2} />
      {f >= L(EV.vacuumSheet) + 18 && (
        <MarkerStroke d={smoothPath([[300, 380], [540, 392], [790, 378]])} from={L(EV.vacuumSheet) + 18} steps={6} color={C.cream} width={10} />
      )}
    </Sheet>
  );
};
