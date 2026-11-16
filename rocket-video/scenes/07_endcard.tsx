import React from 'react';
import {Sequence} from 'remotion';
import {Cutout} from '../src/components/Cutout';
import {MarkerStroke} from '../src/components/MarkerStroke';
import {Pin, Sheet, Stars} from '../src/components/Paper';
import {C, LABEL, PaperStrip} from '../src/components/PaperStrip';
import {arc, handPath, Pt} from '../src/lib/paths';
import {Easing, tween, useOnTwos} from '../src/lib/twos';
import {BEATS, EV} from '../src/timeline';
import {CREDITS} from '../src/credits';

const B = BEATS.end.from;
const L = (g: number) => g - B;

const EC: Pt = [540, 1060];
const ER = 270;
const OR = 400; // orbit radius on screen

export const EndCard: React.FC = () => {
  const f = useOnTwos();
  // rocket coasting clockwise around the pinned Earth (angle from "up")
  const a0 = -70;
  const ang = a0 + tween(f, 0, L(EV.titleCard) + 10, 0, 175, Easing.linear);
  const rad = (ang * Math.PI) / 180;
  const pos: Pt = [EC[0] + OR * Math.sin(rad), EC[1] - OR * Math.cos(rad)];
  const trail = arc(EC[0], EC[1], OR, a0 - 90, ang - 90 - 6, 14);
  const card = L(EV.titleCard);

  return (
    <>
      <Sheet bg="navy" dir="left">
        <Stars n={36} seed="end" />
        <Cutout name="earth" x={EC[0]} y={EC[1]} scale={ER / 950} seed="earth-end" />
        <Pin x={EC[0]} y={EC[1]} />
        {/* thread from the pin to the coasting rocket: the desk-model "gravity" */}
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
          <line x1={EC[0]} y1={EC[1]} x2={pos[0]} y2={pos[1]} stroke="#F4EEDF" strokeOpacity={0.55} strokeWidth={2.5} />
        </svg>
        {ang - a0 > 8 && <MarkerStroke d={handPath(trail, 'endtrail', 2)} from={0} steps={1} color={C.yellow} width={10} seed="endtrail" />}
        <Cutout name="rocket_upper" x={pos[0]} y={pos[1]} scale={0.34} rotate={ang + 90} seed="endrk" />
        <PaperStrip text="ORBIT ISN'T UP." x={540} y={300} size={96} font="head" from={L(EV.endHeadline1)} mode="stamp" rotate={-2} />
        <PaperStrip text="IT'S SIDEWAYS." x={540} y={455} size={96} font="head" bg={C.orange} from={L(EV.endHeadline2)} mode="stamp" rotate={1.5} />
      </Sheet>

      {f >= card && (
        <Sequence from={card}>
        <Sheet bg="warm" dir="right" tilt={3}>
          <Cutout name="earth" x={540} y={1180} scale={0.3} seed="earth-card" />
          <Cutout name="rocket_upper" x={845} y={950} scale={0.42} rotate={62} seed="cardrk" />
          <PaperStrip text={'HOW A ROCKET\nGETS TO ORBIT'} x={540} y={430} size={118} font="head" mode="none" rotate={-1.5} lineHeight={1.05} />
          <PaperStrip text="Orbit isn't up. It's sideways." x={540} y={700} size={56} mode="none" bg={C.yellow} rotate={1.5} />
          <div
            style={{
              position: 'absolute',
              left: 90,
              right: 90,
              top: 1540,
              fontFamily: LABEL,
              fontWeight: 500,
              fontSize: 26,
              lineHeight: 1.35,
              color: C.ink,
              textAlign: 'center',
            }}
          >
            {CREDITS.map((c) => (
              <div key={c}>{c}</div>
            ))}
          </div>
        </Sheet>
        </Sequence>
      )}
    </>
  );
};
