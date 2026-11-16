import {Easing, interpolate, useCurrentFrame} from 'remotion';
import type {Overlay} from '../types';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Near-black rounded box with a gold border. The number counts up with an ease-out over 20 frames.
export const Badge = ({overlay}: {overlay: Overlay}) => {
  const frame = useCurrentFrame();
  const target = overlay.value ?? 0;
  const p = overlay.step ? 1 : interpolate(frame - overlay.from, [0, 20], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const shown = overlay.decimals ? (target * p).toFixed(overlay.decimals) : Math.round(target * p).toLocaleString('en-US');
  // A stepped run (1, 2, 3 ...) only fades in on its first badge and out on its last.
  const opacity = Math.min(
    overlay.step && overlay.step !== 'first' ? 1 : interpolate(frame - overlay.from, [0, 4], [0, 1], clamp),
    overlay.step && overlay.step !== 'last' ? 1 : interpolate(frame, [overlay.to - 6, overlay.to], [1, 0], clamp),
  );
  return (
    <div style={{opacity}}>
      <div
        style={{
          position: 'absolute', left: '6%', top: '12%', height: '9%', padding: '0 36px',
          display: 'flex', alignItems: 'center', boxSizing: 'border-box',
          background: 'rgba(15,12,8,0.85)', border: '3px solid #D9A441', borderRadius: 12,
          fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 104, lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span
          style={{
            background: 'linear-gradient(180deg, #F6D27A 0%, #EEBB62 50%, #B8862B 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', whiteSpace: 'pre',
          }}
        >
          {overlay.prefix ?? ''}
          {shown}
          {overlay.suffix ?? ''}
        </span>
      </div>
      <div
        style={{
          position: 'absolute', left: '6.5%', top: '22.3%',
          fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 30, lineHeight: 1,
          letterSpacing: '0.12em', textTransform: 'uppercase', color: '#FFFFFF',
          textShadow: '0 2px 8px rgba(0,0,0,0.7)',
        }}
      >
        {overlay.label}
      </div>
    </div>
  );
};
