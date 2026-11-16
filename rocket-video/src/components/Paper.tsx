import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame} from 'remotion';
import {BUMPS, CAPTIONS, FPS} from '../timeline';
import {Easing, jitter, quantize, stepOf, tween, useOnTwos} from '../lib/twos';
import {Cutout, CutoutName} from './Cutout';
import {C, PaperStrip} from './PaperStrip';

export type Bg = 'warm' | 'navy';

export const PaperBg: React.FC<{bg: Bg}> = ({bg}) => (
  <AbsoluteFill>
    <Img src={staticFile(`tex/bg_${bg}.png`)} style={{width: 1080, height: 1920}} />
  </AbsoluteFill>
);

/** Cut-out paper stars scattered on the navy sheet; they boil and can drift (parallax). */
export const Stars: React.FC<{n?: number; seed?: string; drift?: number; driftFrom?: number; avoid?: [number, number, number][]}> = ({
  n = 34,
  seed = 'stars',
  drift = 0,
  driftFrom = 0,
}) => {
  const f = useOnTwos();
  const move = drift * Math.max(0, f - driftFrom);
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const r = random(`${seed}${i}k`);
        const name = (r < 0.18 ? 'star_0' : r < 0.45 ? 'star_1' : r < 0.7 ? 'star_2' : 'star_dot') as CutoutName;
        const sc = 0.45 + random(`${seed}${i}s`) * 0.6;
        const x = 30 + random(`${seed}${i}x`) * 1020;
        const y0 = random(`${seed}${i}y`) * 2100 - 90;
        const y = ((y0 + move * (0.6 + sc * 0.5)) % 2100 + 2100) % 2100 - 90;
        return (
          <Cutout key={i} name={name} x={x} y={y} scale={sc} seed={`${seed}${i}`} rotate={random(`${seed}${i}r`) * 70} shadow={false} boil={0.8} />
        );
      })}
    </>
  );
};

/**
 * A new sheet of paper sliding in over the previous scene (on twos, no dissolves).
 * Children are laid out in normal 1080x1920 space on the sheet.
 */
export const Sheet: React.FC<{
  bg: Bg;
  dur?: number;
  dir?: 'left' | 'right';
  tilt?: number;
  children: React.ReactNode;
  enter?: boolean;
}> = ({bg, dur = 10, dir = 'right', tilt = 2.5, children, enter = true}) => {
  const f = useOnTwos();
  const sliding = enter && f < dur;
  const t = enter ? tween(f, 0, dur, 1, 0, Easing.out(Easing.cubic)) : 0;
  const sign = dir === 'right' ? 1 : -1;
  const tx = sign * t * 1230;
  const rot = sign * t * tilt;
  return (
    <AbsoluteFill
      style={{
        transform: `translateX(${tx}px) rotate(${rot}deg)`,
        transformOrigin: dir === 'right' ? '0% 50%' : '100% 50%',
        filter: sliding ? `drop-shadow(${-sign * 14}px 6px 12px rgba(0,0,0,0.4))` : undefined,
      }}
    >
      {/* torn leading edge */}
      <Img
        src={staticFile(`tex/sheet_${bg}.png`)}
        style={{
          position: 'absolute',
          top: 0,
          left: dir === 'right' ? -120 : 0,
          width: 1200,
          height: 1920,
          transform: dir === 'left' ? 'scaleX(-1)' : undefined,
        }}
      />
      <AbsoluteFill style={{overflow: 'visible'}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/** 2-step camera shake at launch / separation / big stamps. Uses the global frame. */
export const CameraBump: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = quantize(useCurrentFrame());
  let x = 0;
  let y = 0;
  let r = 0;
  for (const b of BUMPS) {
    if (f === b) {
      x = 11; y = -8; r = 0.35;
    } else if (f === b + 2) {
      x = -6; y = 5; r = -0.2;
    }
  }
  return <AbsoluteFill style={{transform: `translate(${x}px, ${y}px) rotate(${r}deg) scale(1.02)`}}>{children}</AbsoluteFill>;
};

/** Film/desk overlays: grain swapped on twos, vignette, and ±1.5% lighting flicker. */
export const Overlays: React.FC = () => {
  const f = quantize(useCurrentFrame());
  const s = stepOf(f);
  const flick = jitter('flicker', s, 0, 0.015);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <Img src={staticFile(`tex/grain_${s % 4}.png`)} style={{position: 'absolute', width: 1080, height: 1920, opacity: 0.9}} />
      <Img src={staticFile('tex/vignette.png')} style={{position: 'absolute', width: 1080, height: 1920}} />
      <AbsoluteFill style={{backgroundColor: flick > 0 ? '#FFF6E6' : '#000', opacity: Math.abs(flick)}} />
    </AbsoluteFill>
  );
};

/** Narration captions on paper strips (lower third, inside the 120 px safe margin). */
export const Captions: React.FC = () => {
  const f = quantize(useCurrentFrame());
  const t = f / FPS;
  const i = CAPTIONS.findIndex((c) => t >= c.from && t < c.to);
  if (i < 0) return null;
  const c = CAPTIONS[i];
  const from = quantize(Math.round(c.from * FPS));
  return (
    <PaperStrip
      key={i}
      text={c.text}
      x={540}
      y={1742}
      anchor={[0.5, 1]}
      size={46}
      font="label"
      weight={700}
      bg={C.cream}
      color={C.ink}
      mode="slide"
      from={from}
      seed={`cap${i}`}
      maxWidth={920}
      rotate={(i % 2 ? 1 : -1) * 0.6}
    />
  );
};

/** Brass push-pin used to pin the paper Earth to the board. */
export const Pin: React.FC<{x: number; y: number; size?: number}> = ({x, y, size = 30}) => (
  <svg width={size * 2} height={size * 2} style={{position: 'absolute', left: x - size, top: y - size, overflow: 'visible', filter: 'drop-shadow(5px 6px 4px rgba(0,0,0,0.45))'}}>
    <circle cx={size} cy={size} r={size * 0.62} fill="#C8462B" />
    <circle cx={size} cy={size} r={size * 0.62} fill="none" stroke="#7E2414" strokeWidth={3} />
    <circle cx={size - size * 0.2} cy={size - size * 0.22} r={size * 0.2} fill="#F4C2A8" />
  </svg>
);
