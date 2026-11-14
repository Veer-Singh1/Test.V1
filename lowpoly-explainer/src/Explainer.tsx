import '@fontsource/outfit/700.css';
import '@fontsource/outfit/800.css';
import {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Badge} from './overlays/Badge';
import {Captions} from './overlays/Captions';
import {Kicker} from './overlays/Kicker';
import {NameTag} from './overlays/NameTag';
import {TitleCard} from './overlays/TitleCard';
import {Stage} from './three/Stage';
import type {Timeline} from './types';

export const Explainer = ({timeline}: {story: string; timeline: Timeline}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  // Sign textures and captions both need Outfit, so hold the frame until it is ready.
  const [handle] = useState(() => delayRender('fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.all([document.fonts.load('700 100px Outfit'), document.fonts.load('800 68px Outfit')]).then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);

  const shot = timeline.shots.find((s) => frame >= s.from && frame < s.to) ?? timeline.shots[timeline.shots.length - 1];
  const chunk = timeline.captions.find((c) => frame >= c.from && frame < c.to);
  const overlay = timeline.overlays.find((o) => frame >= o.from && frame < o.to);

  return (
    <AbsoluteFill style={{backgroundColor: '#05070d'}}>
      {ready && shot ? (
        <ThreeCanvas width={width} height={height} gl={{antialias: true}} camera={{fov: 46, near: 0.1, far: 220}}>
          <Stage key={shot.from} shot={shot} />
        </ThreeCanvas>
      ) : null}
      {/* Vignette: cheaper than a post-processing pass and identical in look. */}
      <AbsoluteFill
        style={{background: 'radial-gradient(ellipse 85% 70% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)'}}
      />
      {shot?.scene === 'title' ? <TitleCard title={timeline.title} start={shot.from} end={shot.to} /> : null}
      {overlay?.kind === 'kicker' ? <Kicker overlay={overlay} /> : null}
      {overlay?.kind === 'badge' ? <Badge overlay={overlay} /> : null}
      {overlay?.kind === 'nametag' ? <NameTag overlay={overlay} /> : null}
      {chunk ? <Captions chunk={chunk} /> : null}
      {timeline.audio ? <Audio src={staticFile(timeline.audio)} /> : null}
    </AbsoluteFill>
  );
};
