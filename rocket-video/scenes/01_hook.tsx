import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Cutout} from '../src/components/Cutout';
import {MarkerStroke} from '../src/components/MarkerStroke';
import {PaperBg} from '../src/components/Paper';
import {SmokeBurst} from '../src/components/PaperFlame';
import {C, PaperStrip} from '../src/components/PaperStrip';
import {Group, RocketStack} from '../src/components/Rocket';
import {handPath, line, Pt, smoothPath} from '../src/lib/paths';
import {Easing, keys, tween, useOnTwos} from '../src/lib/twos';
import {EV, MARKS} from '../src/timeline';

// World space: a huge paper Earth whose top is the launch site. The camera starts close
// (ground looks flat) and pulls back in held steps until the whole Earth is visible.
const EARTH_R = 1500; // world px
const EARTH_C: Pt = [540, 1460 + EARTH_R];
const EARTH_IMG_R = 950; // disc radius inside earth.png (before padding)
const ORBIT_R = 2000;
const Z_END = 0.24;
const EARTH_SCREEN_END: Pt = [540, 1185];

const camera = (f: number) => {
  const t = tween(f, EV.pullBack, EV.pullBack + 26, 0, 1, Easing.inOut(Easing.cubic));
  const z = Math.exp(Math.log(1) + (Math.log(Z_END) - Math.log(1)) * t);
  const sy = EARTH_C[1] + (EARTH_SCREEN_END[1] - EARTH_C[1]) * t;
  return {z, tx: 540 - EARTH_C[0] * z, ty: sy - EARTH_C[1] * z};
};

// rocket flight path in world space: straight up, pitch over, then follow the orbit circle
const onOrbit = (deg: number): Pt => {
  const a = (deg * Math.PI) / 180;
  return [EARTH_C[0] + ORBIT_R * Math.sin(a), EARTH_C[1] - ORBIT_R * Math.cos(a)];
};
const PATH: Pt[] = [
  [540, 1450], [540, 1250], [552, 1110], [600, 1010], [680, 975],
  onOrbit(6), onOrbit(14), onOrbit(24), onOrbit(34), onOrbit(44), onOrbit(54), onOrbit(62), onOrbit(70), onOrbit(77),
];
const cum: number[] = [0];
for (let i = 1; i < PATH.length; i++) cum.push(cum[i - 1] + Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1]));
const along = (s: number): {p: Pt; ang: number} => {
  const L = Math.max(0, Math.min(cum[cum.length - 1], s));
  let i = 1;
  while (i < cum.length - 1 && cum[i] < L) i++;
  const t = (L - cum[i - 1]) / (cum[i] - cum[i - 1]);
  const a = PATH[i - 1];
  const b = PATH[i];
  return {p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], ang: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI + 90};
};

export const Hook: React.FC = () => {
  const f = useOnTwos();
  const cam = camera(f);
  // distance travelled along the path: slow, accelerating climb, then faster along orbit
  const s = f < EV.liftoff ? 0 : keys(f, [EV.liftoff, EV.pullBack, EV.pullBack + 26, 120], [0, 760, 1650, 2550], Easing.in(Easing.quad));
  const {p, ang} = along(s);
  const rocketScale = 0.62;
  const toScreen = (q: Pt): Pt => [q[0] * cam.z + cam.tx, q[1] * cam.z + cam.ty];

  // annotation geometry (screen space, after the pull-back has finished)
  const launch = toScreen([300, 1380]);
  const upTip = toScreen([300, 300]);
  const trail = PATH.slice(0, 11).map(toScreen);
  const plateOut = tween(f, 50, 58, 0, -1100, Easing.in(Easing.quad));

  return (
    <AbsoluteFill>
      <PaperBg bg="warm" />
      {/* "archival" halftone launch plate, pinned to the desk, then pulled away */}
      <Cutout name="plate_launch" x={560 + plateOut} y={860} scale={0.98} rotate={-2.2} seed="plate" />
      <PaperStrip text="fig. 1  liftoff" x={300 + plateOut} y={1210} size={40} from={0} until={58} mode="none" rotate={-3} bg={C.yellow} />

      <Group x={cam.tx} y={cam.ty} scale={cam.z}>
        <Cutout name="earth" x={EARTH_C[0]} y={EARTH_C[1]} scale={EARTH_R / EARTH_IMG_R} seed="earth-hook" boil={0.6} />
        {/* launch pad */}
        <Cutout w={260} h={36} x={540} y={1462} seed="pad">
          <div style={{width: '100%', height: '100%', background: '#3A3633'}} />
        </Cutout>
        <SmokeBurst x={540} y={1440} from={EV.ignition} n={4} spread={300} size={0.9} seed="pad1" dur={40} />
        <SmokeBurst x={540} y={1430} from={EV.liftoff - 2} n={6} spread={480} size={1.25} seed="pad2" dur={60} lift={60} />
        <RocketStack x={p[0]} y={p[1]} scale={rocketScale} rotate={f < EV.liftoff ? 0 : ang} seed="hook" flameFrom={EV.ignition} flameScale={f < EV.pullBack ? 1 : 1.4} />
      </Group>

      {/* after the pull-back: "up" is crossed out, the real path bends sideways */}
      <MarkerStroke d={handPath(line(launch, upTip, 4), 'up', 3)} from={MARKS.hookUpCross - 6} steps={6} color={C.ink} width={9} arrow arrowSize={26} />
      <MarkerStroke
        d={smoothPath([[upTip[0] - 40, upTip[1] + 60], [upTip[0] + 40, upTip[1] + 130]]) + ' ' + smoothPath([[upTip[0] + 40, upTip[1] + 60], [upTip[0] - 40, upTip[1] + 130]])}
        from={MARKS.hookUpCross + 8}
        steps={4}
        color={C.orange}
        width={12}
      />
      <MarkerStroke d={smoothPath(trail)} from={MARKS.hookSideways} steps={8} color={C.orange} width={13} arrow />
      <PaperStrip text="UP?" x={upTip[0] - 110} y={upTip[1] + 40} size={56} font="head" from={MARKS.hookUpCross + 2} mode="stamp" rotate={-5} />
      <PaperStrip text="SIDEWAYS!" x={830} y={trail[8][1] - 120} size={70} font="head" bg={C.orange} color={C.ink} from={MARKS.hookSideways + 10} mode="stamp" rotate={4} />

      <PaperStrip text="HOW TO REACH ORBIT" x={540} y={300} size={88} font="head" from={2} until={MARKS.hookSideways + 8} mode="type" cps={2} rotate={-1.5} />
      <PaperStrip text="NOT JUST UP. SIDEWAYS. FAST." x={540} y={300} size={76} font="head" bg={C.yellow} from={MARKS.hookSideways + 8} mode="stamp" rotate={1.2} />
    </AbsoluteFill>
  );
};
