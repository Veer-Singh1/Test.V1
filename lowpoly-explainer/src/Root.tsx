import {Composition, staticFile} from 'remotion';
import {Doc} from './doc/Doc';
import type {DocTimeline} from './doc/types';
import {Explainer} from './Explainer';
import type {Timeline} from './types';

const EMPTY: Timeline = {
  fps: 30, durationInFrames: 30, audio: '', title: {line1: '', line2_red: ''},
  shots: [], captions: [], overlays: [],
};

const EMPTY_DOC: DocTimeline = {fps: 30, width: 1920, height: 1080, durationInFrames: 30, audio: '', shots: [], captions: []};

export const Root = () => (
  <>
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
    {/* Long-form documentary (16:9) and its Short (9:16): the size comes from the timeline file. */}
    <Composition
      id="Documentary"
      component={Doc}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={30}
      defaultProps={{story: 'dragons', file: 'doc.json', timeline: EMPTY_DOC}}
      calculateMetadata={async ({props}) => {
        const timeline: DocTimeline = await (await fetch(staticFile(`${props.story}/${props.file}`))).json();
        return {durationInFrames: timeline.durationInFrames, fps: timeline.fps, width: timeline.width,
          height: timeline.height, props: {...props, timeline}};
      }}
    />
  </>
);
