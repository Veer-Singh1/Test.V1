import React, {useMemo} from 'react';
import {random, staticFile} from 'remotion';
import {boilAt, stepOf, useOnTwos} from '../lib/twos';
import {SHADOW_SOFT} from './Cutout';

export const C = {
  warm: '#EFE8DA',
  navy: '#1C2440',
  orange: '#F08A24',
  yellow: '#F6D33C',
  cream: '#F4EEDF',
  ink: '#1B1B1B',
};

export const HEAD = 'Oswald, sans-serif';
export const LABEL = 'Inter, sans-serif';

type Mode = 'type' | 'stamp' | 'slide' | 'none';

type Props = {
  text: string;
  x: number;
  y: number;
  size?: number;
  font?: 'head' | 'label';
  weight?: number;
  bg?: string;
  color?: string;
  from?: number;
  until?: number;
  mode?: Mode;
  rotate?: number;
  seed?: string;
  anchor?: [number, number];
  maxWidth?: number;
  padX?: number;
  padY?: number;
  align?: 'center' | 'left';
  /** characters revealed per held step when typing */
  cps?: number;
  shadow?: boolean;
  lineHeight?: number;
};

/** Jagged, hand-cut outline for a strip of paper (deterministic per seed). */
const jaggedClip = (seed: string) => {
  const pts: string[] = [];
  const n = 14;
  for (let i = 0; i <= n; i++) pts.push(`${((i / n) * 100).toFixed(1)}% ${(random(`${seed}t${i}`) * 6).toFixed(1)}px`);
  pts.push(`calc(100% - ${(random(`${seed}r1`) * 8).toFixed(1)}px) 50%`);
  for (let i = n; i >= 0; i--)
    pts.push(`${((i / n) * 100).toFixed(1)}% calc(100% - ${(random(`${seed}b${i}`) * 6).toFixed(1)}px)`);
  pts.push(`${(random(`${seed}l1`) * 8).toFixed(1)}px 50%`);
  return `polygon(${pts.join(', ')})`;
};

/**
 * Text on a strip of paper. Appears typed (letters revealed on twos), stamped (thump
 * in from slightly larger), or slid in. Text boils more subtly than cut-outs.
 */
export const PaperStrip: React.FC<Props> = ({
  text,
  x,
  y,
  size = 44,
  font = 'label',
  weight,
  bg = C.cream,
  color = C.ink,
  from = 0,
  until = Infinity,
  mode = 'type',
  rotate = 0,
  seed = text,
  anchor = [0.5, 0.5],
  maxWidth = 960,
  padX,
  padY,
  align = 'center',
  cps = 3,
  shadow = true,
  lineHeight = 1.18,
}) => {
  const f = useOnTwos();
  const clip = useMemo(() => jaggedClip(seed), [seed]);
  if (f < from || f >= until) return null;
  const k = stepOf(f - from); // held steps since appearing
  const b = boilAt(`${seed}-txt`, f, 0.8, 0.25);

  let scale = 1;
  let dx = 0;
  let extraRot = 0;
  if (mode === 'stamp') {
    scale = [1.32, 1.1, 1.0][Math.min(k, 2)];
    extraRot = [-2.5, -0.8, 0][Math.min(k, 2)];
  } else if (mode === 'slide') {
    dx = [-70, -28, -8, 0][Math.min(k, 3)];
  }
  const shown = mode === 'type' ? (k + 1) * cps : text.length;

  const isHead = font === 'head';
  const px = padX ?? (isHead ? 30 : 24);
  const py = padY ?? (isHead ? 10 : 14);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(${-anchor[0] * 100}%, ${-anchor[1] * 100}%) translate(${b.x + dx}px, ${b.y}px) rotate(${rotate + b.r + extraRot}deg) scale(${scale})`,
        transformOrigin: '50% 50%',
        filter: shadow ? SHADOW_SOFT : undefined,
        maxWidth,
        width: 'max-content',
      }}
    >
      <div
        style={{
          clipPath: clip,
          backgroundColor: bg,
          backgroundImage: `url(${staticFile('tex/fibre.png')})`,
          backgroundSize: '512px 512px',
          padding: `${py}px ${px}px`,
          color,
          fontFamily: isHead ? HEAD : LABEL,
          fontWeight: weight ?? (isHead ? 700 : 700),
          fontSize: size,
          lineHeight,
          textTransform: isHead ? 'uppercase' : undefined,
          letterSpacing: isHead ? '0.01em' : '-0.005em',
          textAlign: align,
          maxWidth,
          whiteSpace: 'pre-wrap',
          textWrap: 'balance',
        }}
      >
        {mode === 'type'
          ? Array.from(text).map((ch, i) => (
              <span key={i} style={{visibility: i < shown ? 'visible' : 'hidden'}}>
                {ch}
              </span>
            ))
          : text}
      </div>
    </div>
  );
};
