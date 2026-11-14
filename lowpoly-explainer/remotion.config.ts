import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
// 'angle' needs a GPU. On a machine without one, set GL=swangle (software rendering).
Config.setChromiumOpenGlRenderer((process.env.GL as 'angle' | 'swangle') ?? 'angle');
Config.setConcurrency(4);
// Use an already-installed Chrome instead of downloading one, when it is given.
if (process.env.CHROME_PATH) {
  Config.setBrowserExecutable(process.env.CHROME_PATH);
}
