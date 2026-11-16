import React from 'react';
import {Img, staticFile} from 'remotion';
import sizes from '../cutouts.json';
import {boilAt, useOnTwos} from '../lib/twos';

export type CutoutName = keyof typeof sizes;

export const SHADOW = 'drop-shadow(8px 9px 8px rgba(0,0,0,0.35))';
export const SHADOW_SOFT = 'drop-shadow(6px 7px 6px rgba(0,0,0,0.30))';
// For hand-drawn SVG paper shapes: an uneven cream margin built from offset copies.
export const PAPER_BORDER =
  'drop-shadow(5px 0 0 #F8F3E7) drop-shadow(-5px 1px 0 #F8F3E7) drop-shadow(1px 6px 0 #F8F3E7) drop-shadow(0 -5px 0 #F8F3E7)';

type Props = {
  /** a processed cut-out from public/cutouts (paper border + fibre already baked in) */
  name?: CutoutName;
  /** OR custom content (SVG etc.) of the given size; it gets a paper border via CSS */
  children?: React.ReactNode;
  w?: number;
  h?: number;
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  /** where (x,y) sits on the piece, as fractions */
  anchor?: [number, number];
  seed?: string | number;
  /** boil multiplier: 1 = ±1.5 px, ±0.4° every 2 frames */
  boil?: number;
  shadow?: boolean;
  flipX?: boolean;
  opacity?: number;
  style?: React.CSSProperties;
  /** frame override (already quantised) - for pieces placed outside a Sequence */
  frame?: number;
};

/**
 * One cut-out piece of paper: border, drop shadow (fixed light direction even when the
 * piece rotates), and boil that changes every second frame.
 */
export const Cutout: React.FC<Props> = ({
  name,
  children,
  w,
  h,
  x,
  y,
  scale = 1,
  rotate = 0,
  anchor = [0.5, 0.5],
  seed = name ?? 'cut',
  boil = 1,
  shadow = true,
  flipX = false,
  opacity = 1,
  style,
  frame,
}) => {
  const f2 = useOnTwos();
  const b = boilAt(seed, frame ?? f2, 1.5 * boil, 0.4 * boil);
  const nw = name ? sizes[name].w : (w ?? 100);
  const nh = name ? sizes[name].h : (h ?? 100);
  const W = nw * scale;
  const H = nh * scale;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - anchor[0] * W + b.x,
        top: y - anchor[1] * H + b.y,
        width: W,
        height: H,
        filter: shadow ? SHADOW : undefined,
        opacity,
        ...style,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `rotate(${rotate + b.r}deg)${flipX ? ' scaleX(-1)' : ''}`,
          transformOrigin: `${anchor[0] * 100}% ${anchor[1] * 100}%`,
          filter: children ? PAPER_BORDER : undefined,
        }}
      >
        {name ? (
          <Img src={staticFile(`cutouts/${name}.png`)} style={{width: '100%', height: '100%', display: 'block'}} />
        ) : (
          children
        )}
      </div>
    </div>
  );
};
