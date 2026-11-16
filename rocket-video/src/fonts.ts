import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Fonts are bundled locally (downloaded from Google Fonts, SIL OFL 1.1).
const faces: [string, string, string][] = [
  ['Oswald', 'fonts/Oswald-500.ttf', '500'],
  ['Oswald', 'fonts/Oswald-700.ttf', '700'],
  ['Inter', 'fonts/Inter-500.ttf', '500'],
  ['Inter', 'fonts/Inter-700.ttf', '700'],
  ['Inter', 'fonts/Inter-800.ttf', '800'],
];

export const fontsReady = Promise.all(
  faces.map(([family, file, weight]) => loadFont({family, url: staticFile(file), weight})),
);
