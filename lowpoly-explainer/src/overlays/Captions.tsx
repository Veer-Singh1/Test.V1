import {useCurrentFrame} from 'remotion';
import type {CaptionChunk} from '../types';

// One line, all caps, white with the spoken word in yellow. No scale or opacity animation.
export const Captions = ({chunk}: {chunk: CaptionChunk}) => {
  const frame = useCurrentFrame();
  let active = 0;
  chunk.words.forEach((w, i) => {
    if (frame >= w.from) active = i;
  });
  return (
    <div
      style={{
        position: 'absolute', left: '50%', top: '78%', transform: 'translate(-50%, -50%)',
        fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 68, lineHeight: 1,
        whiteSpace: 'nowrap', textTransform: 'uppercase', color: '#FFFFFF',
        WebkitTextStroke: '10px #000', paintOrder: 'stroke fill',
        textShadow: '0 4px 6px rgba(0,0,0,0.6)',
      }}
    >
      {chunk.words.map((w, i) => (
        <span key={i} style={{color: i === active ? '#FAFE1A' : '#FFFFFF'}}>
          {i > 0 ? ' ' : ''}
          {w.w}
        </span>
      ))}
    </div>
  );
};
