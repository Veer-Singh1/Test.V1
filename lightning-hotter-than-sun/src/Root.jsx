import React from 'react';
import { Composition } from 'remotion';
import { Video } from './Video.jsx';
import { DURATION_FRAMES, FPS } from './timing.js';

export const Root = () => <Composition id="LightningHotter" component={Video} durationInFrames={DURATION_FRAMES} fps={FPS} width={1080} height={1920} />;
