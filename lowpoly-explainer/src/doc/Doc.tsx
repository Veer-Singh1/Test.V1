import '@fontsource/outfit/600.css';
import {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ArtShot, ChapterCard, ClipShot, Credit, EndCard, QuoteCard, TitleShot} from './Shots';
import {FADE, type DocShot, type DocTimeline} from './types';

const Shot = ({shot, story}: {shot: DocShot; story: string}) => {
  switch (shot.kind) {
    case 'art':
      return <ArtShot shot={shot} story={story} />;
    case 'clip':
      return <ClipShot shot={shot} story={story} />;
    case 'chapter':
      return <ChapterCard shot={shot} story={story} />;
    case 'quote':
      return <QuoteCard shot={shot} story={story} />;
    case 'title':
      return shot.src ? (
        <>
          <ClipShot shot={shot} story={story} />
          <TitleShot shot={shot} />
        </>
      ) : <TitleShot shot={shot} />;
    case 'end':
      return <EndCard shot={shot} story={story} />;
    default:
      return <AbsoluteFill style={{backgroundColor: 'black'}} />;
  }
};

/* Subtitles: one phrase at a time, low in the frame. */
const Subtitle = ({text}: {text: string}) => {
  const {width: W, height: H} = useVideoConfig();
  const wide = W > H;
  const u = Math.min(W, H) / 1080;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: wide ? 70 * u : 520 * u, display: 'flex',
      justifyContent: 'center', padding: `0 ${wide ? 200 * u : 70 * u}px`}}>
      <div style={{fontFamily: 'Outfit', fontWeight: 600, fontSize: (wide ? 40 : 52) * u, lineHeight: 1.3, color: '#fbf6ea',
        textAlign: 'center', textShadow: '0 2px 6px rgba(0,0,0,0.9)', background: 'rgba(8,6,4,0.55)',
        padding: `${6 * u}px ${18 * u}px`, borderRadius: 8 * u}}>
        {text}
      </div>
    </div>
  );
};

export const Doc = ({story, timeline}: {story: string; file?: string; timeline: DocTimeline}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([
      document.fonts.load('600 40px Cinzel'), document.fonts.load('800 40px Cinzel'),
      document.fonts.load('italic 40px "EB Garamond"'), document.fonts.load('600 40px Outfit'),
    ]).then(() => continueRender(handle));
  }, [handle]);

  // every shot on screen now: the one before stays underneath while the next fades in over it
  const live = timeline.shots.filter((s) => frame >= s.from && frame < s.to);
  const caption = timeline.captions.find((c) => frame >= c.from && frame < c.to);
  const top = live[live.length - 1];
  const words = timeline.durationInFrames;
  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      {live.map((s) => (
        <AbsoluteFill key={`${s.kind}-${s.from}`}
          style={{opacity: interpolate(frame, [s.from, s.from + FADE], [s === live[0] ? 1 : 0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
          <Shot shot={s} story={story} />
        </AbsoluteFill>
      ))}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 80% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.45) 100%)'}} />
      {top?.kind === 'art' || top?.kind === 'clip' ? <Credit shot={top} /> : null}
      {caption && top?.kind !== 'quote' && top?.kind !== 'title' ? <Subtitle text={caption.text} /> : null}
      <Audio src={staticFile(`${story}/${timeline.audio}`)} />
      {timeline.music ? (
        <Audio src={staticFile(`${story}/${timeline.music.src}`)} loop
          volume={(f) => timeline.music!.volume * interpolate(f, [0, 2 * fps, words - 4 * fps, words], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
      ) : null}
      {(timeline.sfx ?? []).map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.to ? s.to - s.from : undefined} layout="none">
          <Audio src={staticFile(`${story}/${s.src}`)} volume={s.volume ?? 0.5} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
