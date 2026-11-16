import React from 'react';
import {Img, staticFile} from 'remotion';
import {Cutout, SHADOW} from '../src/components/Cutout';
import {MarkerStroke} from '../src/components/MarkerStroke';
import {Sheet} from '../src/components/Paper';
import {C, PaperStrip} from '../src/components/PaperStrip';
import {RocketStack} from '../src/components/Rocket';
import {handPath, line} from '../src/lib/paths';
import {boilAt, Easing, tween, useOnTwos} from '../src/lib/twos';
import {BEATS, EV, MARKS} from '../src/timeline';

const B = BEATS.fuel.from;
const L = (g: number) => g - B;

// layout
const RX = 300; // rocket centre x
const BOTTOM = 1440; // nozzle bottom
const HEIGHT = 860; // rocket height on screen
const CUT_SCALE = HEIGHT / 1055; // cutaway raw height 1055 px (+18 px pad)
const STACK_SCALE = HEIGHT / (688 + 437);
const BAR_X = 840;
const BAR_W = 210;
const BAR_TOP = BOTTOM - HEIGHT;
const PROP = 0.9; // share of launch mass that is propellant (FACTS.md)

/** A torn paper strip stood on end and revealed from the bottom in held steps. */
const BarSegment: React.FC<{y0: number; y1: number; strip: string; reveal: number; seed: string}> = ({y0, y1, strip, reveal, seed}) => {
  const f = useOnTwos();
  const b = boilAt(seed, f, 1.2, 0.3);
  const h = y1 - y0;
  const shown = h * reveal;
  if (shown <= 1) return null;
  const CW = BAR_W + 60;
  return (
    <div style={{position: 'absolute', left: BAR_X - CW / 2 + b.x, top: y1 - shown + b.y, width: CW, height: shown + 14, overflow: 'hidden', filter: SHADOW, transform: `rotate(${b.r}deg)`}}>
      <div style={{position: 'absolute', left: 0, bottom: 0, width: CW, height: h + 14}}>
        <Img
          src={staticFile(`cutouts/${strip}.png`)}
          style={{position: 'absolute', width: h + 14, height: BAR_W + 26, left: (CW - (h + 14)) / 2, top: (h + 14 - (BAR_W + 26)) / 2, transform: 'rotate(-90deg)'}}
        />
      </div>
    </div>
  );
};

export const FuelProblem: React.FC = () => {
  const f = useOnTwos();
  const swapped = f >= L(EV.cutawaySwap);
  const grow = tween(f, L(EV.barGrow), L(EV.barGrow) + 22, 0, 1, Easing.out(Easing.quad));
  const propTop = BOTTOM - HEIGHT * PROP;
  const tankTop = BOTTOM - (1073 - 276) * CUT_SCALE;
  const tankBot = BOTTOM - (1073 - 898) * CUT_SCALE;

  return (
    <Sheet bg="warm" dir="left">
      {!swapped ? (
        <RocketStack x={RX} y={BOTTOM} scale={STACK_SCALE} seed="fuel" />
      ) : (
        <Cutout name="rocket_cutaway" x={RX} y={BOTTOM} scale={CUT_SCALE} anchor={[0.5, 1073 / 1096]} seed="cutaway" />
      )}
      {/* the "slice" line drawn down the rocket before it is opened up */}
      <MarkerStroke d={handPath(line([RX, BAR_TOP + 10], [RX, BOTTOM - 20], 8), 'slice', 3)} from={L(MARKS.fuelSlice)} until={L(EV.cutawaySwap)} steps={8} color={C.orange} width={8} />
      <PaperStrip text="slice it open" x={RX + 150} y={BAR_TOP + 140} size={40} from={L(MARKS.fuelSlice) + 4} until={L(EV.cutawaySwap)} mode="type" rotate={3} bg={C.yellow} />

      {/* bracket over the tanks */}
      <MarkerStroke
        d={handPath([[RX + 168, tankTop], [RX + 200, tankTop + 8], [RX + 204, (tankTop + tankBot) / 2], [RX + 200, tankBot - 8], [RX + 168, tankBot]], 'brk', 3)}
        from={L(MARKS.fuelBracket)}
        steps={7}
        color={C.orange}
        width={12}
      />
      <PaperStrip text="tanks" x={RX + 262} y={(tankTop + tankBot) / 2} size={40} from={L(MARKS.fuelBracket) + 6} mode="type" rotate={-4} bg={C.yellow} />

      {/* torn-strip bar: launch mass split */}
      <BarSegment y0={propTop} y1={BOTTOM} strip="strip_orange" reveal={grow} seed="bar1" />
      <BarSegment y0={BAR_TOP} y1={propTop} strip="strip_cream" reveal={tween(f, L(EV.barGrow) + 20, L(EV.barGrow) + 28, 0, 1)} seed="bar2" />
      <PaperStrip text="LAUNCH MASS" x={BAR_X} y={BAR_TOP - 48} size={40} from={L(EV.barGrow)} mode="type" rotate={2} />
      <PaperStrip text={'everything\nelse ~10%'} x={BAR_X - 20} y={BAR_TOP + 46} size={40} from={L(EV.barGrow) + 30} mode="slide" rotate={-3} />
      <PaperStrip text="~90%" x={BAR_X + 22} y={970} size={130} font="head" bg={C.yellow} from={L(EV.barStamp)} mode="stamp" rotate={-6} />
      <PaperStrip text="PROPELLANT" x={BAR_X - 30} y={1190} size={60} font="head" from={L(EV.barStamp) + 8} mode="stamp" rotate={3} />
      <PaperStrip text="fuel + oxidiser" x={BAR_X - 10} y={1290} size={40} from={L(EV.barStamp) + 16} mode="type" rotate={-1} />

      <PaperStrip text="THE FUEL PROBLEM" x={540} y={300} size={92} font="head" from={4} mode="type" cps={2} rotate={-1.5} />
    </Sheet>
  );
};
