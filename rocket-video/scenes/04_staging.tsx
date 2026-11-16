import React from 'react';
import {Cutout} from '../src/components/Cutout';
import {MarkerStroke} from '../src/components/MarkerStroke';
import {Sheet, Stars} from '../src/components/Paper';
import {PaperFlame, SmokeBurst} from '../src/components/PaperFlame';
import {C, PaperStrip} from '../src/components/PaperStrip';
import {Group, LOWER_ANCHOR, LOWER_H, UPPER_ANCHOR} from '../src/components/Rocket';
import {handPath} from '../src/lib/paths';
import {Easing, tween, useOnTwos} from '../src/lib/twos';
import {BEATS, EV, MARKS} from '../src/timeline';

const B = BEATS.staging.from;
const L = (g: number) => g - B;

const S = 0.6; // rocket scale
const X = 540;
const NOZZLE_Y = 1300;
const SEP_Y = NOZZLE_Y - LOWER_H * S; // interstage joint

export const Staging: React.FC = () => {
  const f = useOnTwos();
  const sep = L(EV.separation);
  const ign = L(EV.upperIgnition);
  const dt = Math.max(0, f - sep);
  // first stage: falls away and tumbles (held steps)
  const fallY = 0.22 * dt * dt + 2 * dt;
  const fallX = -2.2 * dt;
  const tumble = -3.2 * dt;
  // upper stage: after ignition it pulls ahead a little
  const up = f < ign ? 0 : -tween(f, ign, ign + 60, 0, 170, Easing.out(Easing.quad));
  // the world streams past: stars drift down, faster after the upper stage lights
  const drift = 5;
  const clouds = tween(f, 0, 70, 0, 900, Easing.in(Easing.quad));

  return (
    <Sheet bg="navy" dir="right">
      <Stars n={40} seed="stage" drift={drift} />
      {f >= ign && <Stars n={14} seed="stage-fast" drift={13} driftFrom={ign} />}
      <Cutout name="plate_clouds" x={540} y={1960 + clouds} scale={1} anchor={[0.5, 1]} seed="clouds" shadow={false} />

      {/* first stage (with its flame until engine cut-off) */}
      <Group x={X + fallX} y={NOZZLE_Y + fallY} rotate={tumble}>
        <PaperFlame x={0} y={-8 * S} scale={S * 1.1} seed="st1" from={-20} until={L(EV.meco)} />
        <Cutout name="rocket_lower" x={0} y={0} scale={S} anchor={LOWER_ANCHOR} seed="st-lo" />
      </Group>
      {f >= sep && <SmokeBurst x={X} y={SEP_Y + 10} from={sep} n={5} spread={230} size={0.55} seed="sep" dur={26} />}

      {/* second stage */}
      <Group x={X} y={SEP_Y + up}>
        {f >= sep + 4 && <Cutout name="nozzle_small" x={0} y={-10} scale={S * 1.1} anchor={[0.5, 0.15]} seed="nz" />}
        <PaperFlame x={0} y={50 * S} scale={S * 0.8} seed="st2" from={ign} />
        <Cutout name="rocket_upper" x={0} y={0} scale={S} anchor={UPPER_ANCHOR} seed="st-up" />
      </Group>

      {/* labels */}
      <PaperStrip text="stage 2" x={X + 200} y={SEP_Y - 160} size={42} from={14} until={sep} mode="type" rotate={2} />
      <PaperStrip text="stage 1" x={X + 210} y={SEP_Y + 200} size={42} from={26} until={sep} mode="type" rotate={-2} />
      <PaperStrip text="empty tank: dropped" x={300} y={1270} size={42} from={L(MARKS.stagingArrow)} mode="type" rotate={-3} bg={C.yellow} />
      <MarkerStroke d={handPath([[290, 1320], [330, 1380], [410, 1420]], 'dropArrow', 5)} from={L(MARKS.stagingArrow) + 4} steps={6} color={C.yellow} width={12} arrow />
      <PaperStrip text="lighter = more speed" x={X + 230} y={SEP_Y - 380} size={42} from={L(MARKS.stagingLight)} mode="type" rotate={2.5} />
      <MarkerStroke d={handPath([[X + 120, SEP_Y - 330], [X + 70, SEP_Y - 270]], 'litArrow', 3)} from={L(MARKS.stagingLight) + 6} steps={5} color={C.orange} width={11} arrow arrowSize={26} />

      <PaperStrip text="ROCKETS COME IN STAGES" x={540} y={300} size={82} font="head" from={4} until={sep + 6} mode="type" cps={2} rotate={-1} />
      <PaperStrip text="DROP THE DEAD WEIGHT" x={540} y={300} size={90} font="head" bg={C.orange} from={sep + 6} mode="stamp" rotate={1.5} />
    </Sheet>
  );
};
