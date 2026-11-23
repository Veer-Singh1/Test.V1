/**
 * Every image used by Marginalia is listed here, and only here.
 *
 * To swap a photo:
 *   1. Put the original in `assets-src/` (Creative Commons or your own, never press/agency photos).
 *   2. Add or edit its entry in `scripts/optimise-images.mjs` (output name + widths) and run `npm run images`.
 *   3. Update the matching entry below: `base`, `width`/`height` (the original aspect), `alt` and `credit`.
 *   4. Set `placeholder: true` to show a clearly marked placeholder frame instead of a photo.
 *
 * Credits are rendered automatically on the Colophon & Credits page.
 */

export interface Credit {
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
  /** Changes made from the original (required by CC BY / BY-SA). */
  changes: string;
}

export interface Photo {
  id: string;
  /** Path prefix under /public, without width or extension: `${base}-${w}.avif|webp` */
  base: string;
  widths: number[];
  /** Intrinsic aspect of the generated files. */
  width: number;
  height: number;
  alt: string;
  caption: string;
  credit?: Credit;
  /** Render a marked placeholder instead of the photo. */
  placeholder?: boolean;
  /** Shown inside the placeholder frame. */
  placeholderLabel?: string;
}

export const images: Record<string, Photo> = {
  portrait: {
    id: 'portrait',
    base: '/images/portrait-2012',
    widths: [480, 800, 1200],
    width: 1200,
    height: 1427,
    alt: 'Emma Watson smiling at the 2012 Tribeca Film Festival, photographed from the shoulders up.',
    caption: 'At the Tribeca Film Festival, April 2012.',
    credit: {
      title: 'Emma Watson, 2012',
      author: 'David Shankbone',
      license: 'CC BY 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Emma_Watson,_2012.jpg',
      changes: 'Resized, converted to AVIF/WebP, warm print tone applied in CSS.',
    },
  },
  /**
   * READY TO SWAP IN. Wikimedia rate-limited the download while this site was being built, so a marked
   * placeholder is shown. To use the real photo:
   *   curl -L -o assets-src/uruguay-2014-cotidiano-mujer.png \
   *     "https://upload.wikimedia.org/wikipedia/commons/e/e2/Emma_Watson_Uruguay_1.png"
   *   npm run images
   * then delete `placeholder: true` below. The credit is already filled in.
   */
  uruguay: {
    id: 'uruguay',
    base: '/images/uruguay-2014',
    widths: [640, 1024, 1600],
    width: 1600,
    height: 884,
    placeholder: true,
    placeholderLabel: 'PHOTO PLACEHOLDER · Speaking at the Uruguayan Parliament, 2014 (CC BY-SA photo ready to swap in)',
    alt: 'Emma Watson speaking at a lectern at the Uruguayan Parliament, a translator seated beside her.',
    caption: 'Speaking as UN Women Goodwill Ambassador at the Uruguayan Parliament, 2014. Still from a recording by Cotidiano Mujer.',
    credit: {
      title: 'Emma Watson Uruguay 1',
      author: 'Cotidiano Mujer',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Emma_Watson_Uruguay_1.png',
      changes: 'Resized, converted to AVIF/WebP, tone applied in CSS. Shared under the same licence.',
    },
  },
  bookDrop: {
    id: 'bookDrop',
    base: '',
    widths: [],
    width: 4,
    height: 3,
    alt: 'Placeholder for a photograph of a paperback left on a seat, with a note tucked inside.',
    caption: 'Placeholder: a book left for a stranger. Swap in a Creative Commons photo in content/images.ts.',
    placeholder: true,
    placeholderLabel: 'PHOTO PLACEHOLDER · A paperback left on a train seat, a note tucked inside',
  },
};
