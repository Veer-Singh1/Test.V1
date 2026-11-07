import React from 'react';
import { Composition } from 'remotion';
import { Full } from './Full.jsx';
import { DURATION_FRAMES, FPS } from './timing.js';

export const Root = () => (
  <Composition id="Durban1973" component={Full} durationInFrames={DURATION_FRAMES} fps={FPS} width={720} height={1280} />
);
