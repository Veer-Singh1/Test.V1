// Narration through the ElevenLabs API, with word timings for the captions.
//
//   npx tsx scripts/narrate.ts --count   character count only (no network, no credits)
//   npx tsx scripts/narrate.ts --check   check the key and the voice (free)
//   npx tsx scripts/narrate.ts           the same checks, then stops and shows the cost
//   npx tsx scripts/narrate.ts --yes     generate (SPENDS CREDITS) unless the cache is current
//   npx tsx scripts/narrate.ts --timings rebuild assets/timings.json from assets/alignment.json (free)
//
// Writes assets/narration.mp3, assets/alignment.json, assets/timings.json and assets/narration.meta.json.
// The cache key is a hash of script + voice + model: the API is only called again when one of them changes.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { MODEL_ID, OUTPUT_FORMAT, SCRIPT, VOICE_ID } from '../src/script';

const ROOT = path.resolve(__dirname, '..');
const A = (f: string) => path.join(ROOT, 'assets', f);
const API = 'https://api.elevenlabs.io/v1';
const args = new Set(process.argv.slice(2));

function loadKey(): string | undefined {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  for (const f of [path.join(ROOT, '.env'), path.join(ROOT, '..', '.env')]) {
    if (!existsSync(f)) continue;
    const m = readFileSync(f, 'utf8').match(/^\s*ELEVENLABS_API_KEY\s*=\s*["']?([^"'\r\n#]+)/m);
    if (m && m[1].trim()) return m[1].trim();
  }
  return undefined;
}

type Alignment = { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] };
export type Word = { text: string; start: number; end: number };

// Character alignment -> words. Anything inside [...] is a delivery tag, not a word.
export function toWords(al: Alignment): Word[] {
  const words: Word[] = [];
  let cur: Word | null = null, inTag = false;
  const flush = () => { if (cur) words.push(cur); cur = null; };
  al.characters.forEach((ch, i) => {
    if (ch === '[') { inTag = true; flush(); return; }
    if (ch === ']') { inTag = false; return; }
    if (inTag) return;
    if (/\s/.test(ch)) { flush(); return; }
    const s = al.character_start_times_seconds[i], e = al.character_end_times_seconds[i];
    if (!cur) cur = { text: ch, start: s, end: e }; else { cur.text += ch; cur.end = e; }
  });
  flush();
  return words.map((w) => ({ text: w.text, start: +w.start.toFixed(3), end: +w.end.toFixed(3) }));
}

async function main() {
  const hash = createHash('sha256').update(JSON.stringify([SCRIPT, VOICE_ID, MODEL_ID, OUTPUT_FORMAT])).digest('hex');
  const spoken = SCRIPT.replace(/\[[^\]]*\]\s*/g, '');
  console.log(`Script: ${SCRIPT.length} characters sent to ElevenLabs (${spoken.split(/\s+/).filter(Boolean).length} spoken words, ${SCRIPT.length - spoken.length} characters of delivery tags).`);
  if (args.has('--count')) return;

  if (args.has('--timings')) {
    const al = JSON.parse(readFileSync(A('alignment.json'), 'utf8'));
    const words = toWords(al.alignment ?? al);
    writeFileSync(A('timings.json'), JSON.stringify({ hash, duration: words[words.length - 1].end, words }, null, 1));
    console.log(`timings.json rebuilt: ${words.length} words.`);
    return;
  }

  const meta = existsSync(A('narration.meta.json')) ? JSON.parse(readFileSync(A('narration.meta.json'), 'utf8')) : null;
  if (meta?.hash === hash && ['narration.mp3', 'alignment.json', 'timings.json'].every((f) => existsSync(A(f)))) {
    console.log('Cache is current (same script, voice and model). Nothing to generate, no credits spent.');
    return;
  }

  const key = loadKey();
  if (!key) { console.error('ELEVENLABS_API_KEY is missing. Add it to the environment or to a .env file (see .env.example).'); process.exit(2); }
  const headers = { 'xi-api-key': key as string, 'content-type': 'application/json' };

  // 1. the voice must exist in this account (free call)
  const vr = await fetch(`${API}/voices`, { headers });
  if (!vr.ok) { console.error(`GET /v1/voices failed: HTTP ${vr.status} ${(await vr.text()).slice(0, 300)}`); process.exit(3); }
  const voices: { voice_id: string; name: string; category?: string }[] = (await vr.json()).voices ?? [];
  const voice = voices.find((v) => v.voice_id === VOICE_ID);
  if (!voice) {
    console.error(`Voice ${VOICE_ID} is not in this account. Available voices:`);
    voices.forEach((v) => console.error(`  ${v.voice_id}  ${v.name}${v.category ? `  (${v.category})` : ''}`));
    process.exit(4);
  }
  console.log(`Voice OK: ${voice.name} (${VOICE_ID}), model ${MODEL_ID}.`);
  if (args.has('--check')) return;

  // 2. generating spends credits: only with --yes
  if (!args.has('--yes')) { console.log(`Generating will send ${SCRIPT.length} characters and spend credits. Re-run with --yes to go ahead.`); return; }
  const r = await fetch(`${API}/text-to-speech/${VOICE_ID}/with-timestamps?output_format=${OUTPUT_FORMAT}`, { method: 'POST', headers, body: JSON.stringify({ text: SCRIPT, model_id: MODEL_ID }) });
  if (!r.ok) { console.error(`Text-to-speech failed: HTTP ${r.status} ${(await r.text()).slice(0, 500)}`); process.exit(5); }
  const j = await r.json();
  mkdirSync(path.join(ROOT, 'assets'), { recursive: true });
  writeFileSync(A('narration.mp3'), Buffer.from(j.audio_base64, 'base64'));
  writeFileSync(A('alignment.json'), JSON.stringify({ alignment: j.alignment, normalized_alignment: j.normalized_alignment }, null, 1));
  const words = toWords(j.alignment);
  writeFileSync(A('timings.json'), JSON.stringify({ hash, duration: words[words.length - 1].end, words }, null, 1));
  writeFileSync(A('narration.meta.json'), JSON.stringify({ hash, voice_id: VOICE_ID, voice_name: voice.name, model_id: MODEL_ID, output_format: OUTPUT_FORMAT, characters: SCRIPT.length, generated_at: new Date().toISOString() }, null, 1));
  console.log(`Saved narration.mp3, alignment.json and timings.json (${words.length} words, ${words[words.length - 1].end.toFixed(1)} s).`);
}
main().catch((e) => { console.error(String(e?.message ?? e)); process.exit(1); });
