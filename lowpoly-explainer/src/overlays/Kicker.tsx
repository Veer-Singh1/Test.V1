import {interpolate, useCurrentFrame} from 'remotion';
import type {Overlay} from '../types';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Letters blur in left to right, 1 frame apart, 9 frames each. Fades out over the last 6 frames.
export const RevealLines = ({lines, red, start, end}: {lines: string[]; red?: string; start: number; end: number}) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [end - 6, end], [1, 0], clamp);
  // A whole line goes red when it matches exactly (title card); otherwise only the key word does.
  const wholeLine = red !== undefined && lines.includes(red);
  const redWords = (red ?? '').split(' ');
  let index = 0;
  return (
    <div style={{opacity: fade}}>
      {lines.map((line, li) => (
        <div key={li}>
          {line.split(' ').map((word, wi) => {
            // Only the key word is red; the rest of the line stays white.
            const isRed = wholeLine ? line === red : redWords.includes(word);
            return (
              <span
                key={wi}
                style={
                  isRed
                    ? {color: '#F74E30', textShadow: '0 0 18px rgba(247,78,48,0.55)'}
                    : {color: '#FFFFFF', textShadow: '0 2px 12px rgba(0,0,0,0.5)'}
                }
              >
                {[...(wi > 0 ? ' ' + word : word)].map((ch, ci) => {
                  const p = interpolate(frame - start - index++, [0, 9], [0, 1], clamp);
                  return (
                    <span key={ci} style={{opacity: p, filter: `blur(${(1 - p) * 8}px)`, whiteSpace: 'pre'}}>
                      {ch}
                    </span>
                  );
                })}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const Kicker = ({overlay}: {overlay: Overlay}) => (
  <div
    style={{
      position: 'absolute', left: '7%', top: '14.5%',
      fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 100, lineHeight: 1.12,
      textTransform: 'uppercase',
    }}
  >
    <RevealLines
      lines={[overlay.line1 ?? '', overlay.line2 ?? ''].filter(Boolean)}
      red={overlay.red}
      start={overlay.from}
      end={overlay.to}
    />
  </div>
);
