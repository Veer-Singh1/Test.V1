import React, {useMemo} from 'react';
import {getLength, getPointAtLength, getTangentAtLength} from '@remotion/paths';
import {boilAt, stepOf, useOnTwos} from '../lib/twos';

type Props = {
  d: string;
  from: number;
  /** held steps (2 frames each) to draw the whole stroke: 6-10 per the style guide */
  steps?: number;
  color?: string;
  width?: number;
  seed?: string;
  arrow?: boolean;
  arrowSize?: number;
  opacity?: number;
  until?: number;
};

/**
 * A marker-pen annotation that "draws on" over a number of held steps. Two passes (body +
 * offset darker edge) fake marker ink; the whole stroke boils slightly on twos.
 */
export const MarkerStroke: React.FC<Props> = ({
  d,
  from,
  steps = 8,
  color = '#F6D33C',
  width = 13,
  seed = d.slice(0, 24),
  arrow = false,
  arrowSize = 36,
  opacity = 0.95,
  until = Infinity,
}) => {
  const f = useOnTwos();
  const len = useMemo(() => getLength(d), [d]);
  if (f < from || f >= until) return null;
  const k = stepOf(f - from);
  const p = Math.min(1, (k + 1) / steps);
  const shownLen = len * p;
  const b = boilAt(`${seed}-mk`, f, 1.0, 0.15);

  let head: React.ReactNode = null;
  if (arrow && p >= 1) {
    const end = getPointAtLength(d, len) ?? {x: 0, y: 0};
    const t = getTangentAtLength(d, len) ?? {x: 1, y: 0};
    const ang = Math.atan2(t.y, t.x);
    const wing = (sign: number) => {
      const a = ang + Math.PI + sign * 0.5;
      return `M ${end.x} ${end.y} L ${end.x + Math.cos(a) * arrowSize} ${end.y + Math.sin(a) * arrowSize}`;
    };
    head = (
      <path d={`${wing(1)} ${wing(-1)}`} stroke={color} strokeWidth={width} strokeLinecap="round" fill="none" />
    );
  }
  return (
    <svg
      width={1080}
      height={1920}
      viewBox="0 0 1080 1920"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        overflow: 'visible',
        transform: `translate(${b.x}px, ${b.y}px) rotate(${b.r}deg)`,
        opacity,
        pointerEvents: 'none',
      }}
    >
      <path
        d={d}
        stroke="rgba(0,0,0,0.18)"
        strokeWidth={width * 0.5}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${shownLen} ${len + 10}`}
        transform="translate(2.5 2)"
      />
      <path
        d={d}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={`${shownLen} ${len + 10}`}
      />
      {head}
    </svg>
  );
};
