// Converts originals in assets-src/ to responsive AVIF + WebP in public/images/.
// Usage: npm run images
// Add an entry here when you add a photo, then reference its `out` base in src/content/images.ts.
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';

const jobs = [
  { src: 'assets-src/portrait-2012-shankbone.jpg', out: 'public/images/portrait-2012', widths: [480, 800, 1200] },
  { src: 'assets-src/uruguay-2014-cotidiano-mujer.png', out: 'public/images/uruguay-2014', widths: [640, 1024, 1600] },
];

mkdirSync('public/images', { recursive: true });
for (const job of jobs) {
  if (!existsSync(job.src)) {
    console.warn(`skip ${job.src} (missing) — set placeholder: true for it in src/content/images.ts`);
    continue;
  }
  const meta = await sharp(job.src).metadata();
  for (const w of job.widths) {
    const base = sharp(job.src).rotate().resize({ width: Math.min(w, meta.width ?? w), withoutEnlargement: true });
    await base.clone().avif({ quality: 52, effort: 6 }).toFile(`${job.out}-${w}.avif`);
    await base.clone().webp({ quality: 74 }).toFile(`${job.out}-${w}.webp`);
  }
  console.log(`✓ ${job.src} → ${job.out}-{${job.widths.join(',')}}.{avif,webp} (original ${meta.width}×${meta.height})`);
}
