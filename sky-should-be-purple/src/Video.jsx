import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useDelayRender } from 'remotion';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/900.css';
import '@fontsource/playfair-display/500-italic.css';
import { FPS } from './timing.js';
import { World, Overlays } from './Scene.jsx';
import { Captions } from './kit/Captions.jsx';
import { C } from './kit/palette.js';

export const Video = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const { delayRender, continueRender } = useDelayRender();
  const [handle] = useState(() => delayRender('Loading fonts'));
  useEffect(() => {
    Promise.all(['500 20px Inter', '600 20px Inter', '700 20px Inter', '900 20px Inter', 'italic 500 20px "Playfair Display"'].map((f) => document.fonts.load(f))).then(() => continueRender(handle));
  }, [handle, continueRender]);
  return (
    <AbsoluteFill style={{ backgroundColor: C.void }}>
      <Audio src={staticFile('soundtrack.wav')} />
      <World t={t} />
      <Overlays t={t} />
      <Captions t={t} />
    </AbsoluteFill>
  );
};
