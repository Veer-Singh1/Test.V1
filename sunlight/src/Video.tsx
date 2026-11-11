import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame } from 'remotion';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/900.css';
import '@fontsource/playfair-display/400-italic.css';
import { C, VIDEO } from './style';
import { Captions } from './kit/Captions';
import { Overlays, World } from './scenes';

export const Video: React.FC = () => {
  const t = useCurrentFrame() / VIDEO.fps;
  const [handle] = useState(() => delayRender('Loading fonts'));
  useEffect(() => {
    Promise.all(['600 20px Inter', '700 20px Inter', '900 20px Inter', 'italic 400 20px "Playfair Display"'].map((f) => document.fonts.load(f))).then(() => continueRender(handle));
  }, [handle]);
  return (
    <AbsoluteFill style={{ backgroundColor: C.void }}>
      <Audio src={staticFile('soundtrack.wav')} />
      <World t={t} />
      <Overlays t={t} />
      <Captions t={t} />
    </AbsoluteFill>
  );
};
