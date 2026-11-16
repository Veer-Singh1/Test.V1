import {RevealLines} from './Kicker';

// Two-line title over the dark title scene, second line in red.
export const TitleCard = ({title, start, end}: {title: {line1: string; line2_red: string}; start: number; end: number}) => (
  <div
    style={{
      position: 'absolute', left: '7%', top: '38%',
      fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 124, lineHeight: 1.1,
      textTransform: 'uppercase',
    }}
  >
    <RevealLines lines={[title.line1, title.line2_red]} red={title.line2_red} start={start + 3} end={end + 6} />
  </div>
);
