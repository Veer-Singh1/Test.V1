import {Composition, staticFile} from 'remotion';
import {Explainer} from './Explainer';
import type {Timeline} from './types';

const EMPTY: Timeline = {
  fps: 30, durationInFrames: 30, audio: '', title: {line1: '', line2_red: ''},
  shots: [], captions: [], overlays: [],
};

export const Root = () => (
  <Composition
    id="Explainer"
    component={Explainer}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={30}
    defaultProps={{story: 'antwerp', timeline: EMPTY}}
    calculateMetadata={async ({props}) => {
      const timeline: Timeline = await (await fetch(staticFile(`${props.story}/timeline.json`))).json();
      return {durationInFrames: timeline.durationInFrames, fps: timeline.fps, props: {...props, timeline}};
    }}
  />
);
