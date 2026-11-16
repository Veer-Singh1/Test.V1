import React from 'react';
import {Img, staticFile} from 'remotion';
import {Cutout, SHADOW} from '../src/components/Cutout';
import {MarkerStroke} from '../src/components/MarkerStroke';
import {Sheet, Stars} from '../src/components/Paper';
import {C, HEAD, PaperStrip} from '../src/components/PaperStrip';
import {handPath} from '../src/lib/paths';
import {boilAt, Easing, stepOf, tween, useOnTwos} from '../src/lib/twos';
import {BEATS, EV, MARKS} from '../src/timeline';

const B = BEATS.number.from;
const L = (g: number) => g - B;

// comparison bars (FACTS.md: ~28,000 km/h for low Earth orbit, ~900 km/h airliner cruise)
const ORBIT_KMH = 28000;
const JET_KMH = 900;
const BAR_X0 = 300;
const BAR_MAX = 700;

const TornBar: React.FC<{y: number; len: number; strip: string; seed: string; thick?: number}> = ({y, len, strip, seed, thick = 70}) => {
  const f = useOnTwos();
  const b = boilAt(seed, f, 1.2, 0.3);
  if (len < 1) return null;
  return (
    <div style={{position: 'absolute', left: BAR_X0 + b.x, top: y - thick / 2 + b.y, width: len, height: thick, overflow: 'hidden', filter: SHADOW, transform: `rotate(${b.r}deg)`}}>
      <Img src={staticFile(`cutouts/${strip}.png`)} style={{position: 'absolute', left: -6, top: -8, width: BAR_MAX + 20, height: thick + 16}} />
    </div>
  );
};

/** Big rubber-stamped number: ink with a grunge mask, thumped in from larger. */
const Stamp: React.FC<{text: string; x: number; y: number; from: number; size: number; color: string; rotate?: number}> = ({text, x, y, from, size, color, rotate = 0}) => {
  const f = useOnTwos();
  if (f < from) return null;
  const k = stepOf(f - from);
  const s = [1.45, 1.12, 1][Math.min(2, k)];
  const b = boilAt('stamp' + text, f, 0.8, 0.2);
  const mask = `url(${staticFile('tex/stamp.png')})`;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) translate(${b.x}px, ${b.y}px) rotate(${rotate + b.r}deg) scale(${s})`,
        padding: '6px 34px',
        border: `9px solid ${color}`,
        borderRadius: 14,
        color,
        fontFamily: HEAD,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.05,
        whiteSpace: 'nowrap',
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
      }}
    >
      {text}
    </div>
  );
};

export const TheNumber: React.FC = () => {
  const f = useOnTwos();
  const grow = tween(f, L(EV.compare) + 6, L(EV.compare) + 26, 0, 1, Easing.out(Easing.quad));
  const orbitLen = BAR_MAX * grow;
  const jetLen = f >= L(EV.compare) ? Math.max(14, (BAR_MAX * JET_KMH) / ORBIT_KMH) : 0;

  return (
    <Sheet bg="navy" dir="right">
      <Stars n={30} seed="num" />
      <PaperStrip text="LOW EARTH ORBIT NEEDS" x={540} y={300} size={80} font="head" from={4} mode="type" cps={2} rotate={-1} />
      <Stamp text="28,000 KM/H" x={540} y={600} from={L(EV.speedStamp)} size={150} color={C.orange} rotate={-4} />
      <MarkerStroke d={handPath([[150, 735], [400, 748], [700, 740], [930, 728]], 'numUL', 4)} from={L(MARKS.numberUnderline)} steps={7} color={C.yellow} width={14} />
      <PaperStrip text="≈ 7.8 km every second" x={540} y={830} size={46} from={L(MARKS.numberUnderline) + 12} mode="type" rotate={1.5} />

      {/* airliner row */}
      <Cutout name="jet" x={160} y={1010} scale={0.4} seed="jetc" />
      <TornBar y={1010} len={jetLen} strip="strip_cream" seed="jetbar" />
      <PaperStrip text="airliner ~900 km/h" x={BAR_X0 + 60} y={1010} size={42} from={L(EV.compare)} mode="type" anchor={[0, 0.5]} rotate={-1.5} />
      {/* orbit row */}
      <Cutout name="rocket_upper" x={150} y={1210} scale={0.36} rotate={90} seed="numrk" />
      <TornBar y={1210} len={orbitLen} strip="strip_orange" seed="orbbar" thick={84} />
      <PaperStrip text="orbit ~28,000 km/h" x={BAR_X0 + 60} y={1305} size={42} from={L(EV.compare) + 22} mode="type" anchor={[0, 0.5]} rotate={1} />
      {/* stretch arrow from the airliner's speed to orbital speed */}
      <MarkerStroke d={handPath([[BAR_X0 + 30, 1118], [BAR_X0 + 260, 1110], [BAR_X0 + 520, 1116], [BAR_X0 + BAR_MAX - 10, 1112]], 'x30', 4)} from={L(MARKS.numberBracket)} steps={7} color={C.yellow} width={11} arrow arrowSize={28} />
      <PaperStrip text="≈ 30× FASTER" x={640} y={1450} size={84} font="head" bg={C.yellow} from={L(EV.timesFaster)} mode="stamp" rotate={-3} />
    </Sheet>
  );
};
