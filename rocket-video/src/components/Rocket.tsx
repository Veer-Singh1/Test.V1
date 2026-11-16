import React from 'react';
import {Cutout} from './Cutout';
import {PaperFlame} from './PaperFlame';

/** Positions children in a transformed space: screen = local * scale, rotated, then offset. */
export const Group: React.FC<{x?: number; y?: number; scale?: number; rotate?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  x = 0,
  y = 0,
  scale = 1,
  rotate = 0,
  children,
  style,
}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      overflow: 'visible',
      transform: `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale})`,
      transformOrigin: '0 0',
      ...style,
    }}
  >
    {children}
  </div>
);

// geometry of the processed cut-outs (see scripts/generate_assets.py, pad = 17 px)
export const LOWER_H = 688; // nozzle bottom -> interstage top
export const UPPER_H = 437; // body bottom -> nose tip
export const LOWER_ANCHOR: [number, number] = [0.5, 705 / 724];
export const UPPER_ANCHOR: [number, number] = [0.5, 437 / 454];

type StackProps = {
  /** nozzle bottom of the first stage */
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  seed?: string;
  lower?: boolean;
  upper?: boolean;
  flameFrom?: number;
  flameUntil?: number;
  flameScale?: number;
};

/** Two-stage paper rocket (stage 1 + stage 2 with fairing), optional flame. */
export const RocketStack: React.FC<StackProps> = ({
  x,
  y,
  scale = 0.6,
  rotate = 0,
  seed = 'rk',
  lower = true,
  upper = true,
  flameFrom,
  flameUntil,
  flameScale = 1,
}) => (
  <Group x={x} y={y} rotate={rotate}>
    {flameFrom !== undefined && (
      <PaperFlame x={0} y={-8 * scale} scale={scale * 1.05 * flameScale} seed={`${seed}-fl`} from={flameFrom} until={flameUntil} />
    )}
    {lower && <Cutout name="rocket_lower" x={0} y={0} scale={scale} anchor={LOWER_ANCHOR} seed={`${seed}-lo`} />}
    {upper && <Cutout name="rocket_upper" x={0} y={-LOWER_H * scale} scale={scale} anchor={UPPER_ANCHOR} seed={`${seed}-up`} />}
  </Group>
);
