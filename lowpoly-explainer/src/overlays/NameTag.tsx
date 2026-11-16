import {interpolate, useCurrentFrame} from 'remotion';
import type {Overlay} from '../types';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Small dark box beside the character on first appearance.
export const NameTag = ({overlay}: {overlay: Overlay}) => {
  const frame = useCurrentFrame();
  const opacity = Math.min(
    interpolate(frame - overlay.from, [0, 5], [0, 1], clamp),
    interpolate(frame, [overlay.to - 6, overlay.to], [1, 0], clamp),
  );
  return (
    <div
      style={{
        position: 'absolute', left: '7%', top: '33%', opacity,
        padding: '18px 24px', background: 'rgba(15,12,8,0.85)', borderLeft: '6px solid #F74E30', borderRadius: 8,
        fontFamily: 'Outfit, sans-serif', color: '#FFFFFF',
      }}
    >
      <div style={{fontWeight: 800, fontSize: 40, lineHeight: 1.1}}>{overlay.name}</div>
      <div style={{fontWeight: 700, fontSize: 24, letterSpacing: '0.14em', marginTop: 8, opacity: 0.8}}>
        {overlay.place}
      </div>
    </div>
  );
};
