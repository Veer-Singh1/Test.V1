"""Step 3: generate the raw voice, one call per beat, joined into voice_raw.wav.

Providers:
  elevenlabs  needs ELEVENLABS_API_KEY. Uses the voice_id in script.json.
  local       Kokoro through sherpa-onnx. Free, offline, lower quality. Stand-in only.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

from common import MODELS, load_script, out_dir


def beat_texts(script: dict) -> list[str]:
    return [" ".join(s["text"] for s in beat["sentences"]) for beat in script["beats"]]


ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()
ORD = {"one": "first", "two": "second", "three": "third", "five": "fifth", "eight": "eighth",
       "nine": "ninth", "twelve": "twelfth"}


def number_words(n: int) -> str:
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])
    if n < 1000:
        return ONES[n // 100] + " hundred" + ("" if n % 100 == 0 else " " + number_words(n % 100))
    if 1100 <= n < 2000 or 2010 <= n < 2100:  # read as a year
        return number_words(n // 100) + " " + (number_words(n % 100) if n % 100 else "hundred")
    return number_words(n // 1000) + " thousand" + ("" if n % 1000 == 0 else " " + number_words(n % 1000))


def spell_out(text: str, pronounce: dict) -> str:
    """The local voice reads from a word list: it skips digits and unknown names."""
    def ordinal(m):
        w = number_words(int(m.group(1)))
        head, _, last = w.rpartition(" ")
        last = ORD.get(last, last[:-1] + "ieth" if last.endswith("y") else last + "th")
        return (head + " " + last).strip()
    text = re.sub(r"(\d+)(?:st|nd|rd|th)\b", ordinal, text)
    text = re.sub(r"\d+", lambda m: number_words(int(m.group())), text)
    for word, said in pronounce.items():
        text = text.replace(word, said)
    return text


def elevenlabs(script: dict, texts: list[str], work: Path) -> list[Path]:
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit("ELEVENLABS_API_KEY is not set. Use --provider local for a stand-in voice.")
    voice = script["voice"]
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice['voice_id']}?output_format=pcm_44100"
    parts = []
    for i, text in enumerate(texts):
        body = {
            "text": text,
            "model_id": voice.get("model_id", "eleven_multilingual_v2"),
            "voice_settings": {
                "stability": 0.5, "similarity_boost": 0.75, "style": 0.1,
                "use_speaker_boost": True, "speed": 1.15,
            },
        }
        if i > 0:
            body["previous_text"] = texts[i - 1]
        req = urllib.request.Request(
            url, data=json.dumps(body).encode(),
            headers={"xi-api-key": key, "Content-Type": "application/json"},
        )
        pcm = work / f"beat_{i:02d}.pcm"
        pcm.write_bytes(urllib.request.urlopen(req).read())
        wav = work / f"beat_{i:02d}.wav"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "s16le", "-ar", "44100", "-ac", "1",
                        "-i", str(pcm), str(wav)], check=True)
        parts.append(wav)
    return parts


def local(script: dict, texts: list[str], work: Path) -> list[Path]:
    import sherpa_onnx
    import soundfile as sf

    m = MODELS / "kokoro-multi-lang-v1_0"
    if not m.exists():
        sys.exit(f"Kokoro model not found at {m}. See README, 'Models'.")
    tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
                model=str(m / "model.onnx"), voices=str(m / "voices.bin"),
                tokens=str(m / "tokens.txt"), data_dir=str(m / "espeak-ng-data"),
                lexicon=str(m / "lexicon-us-en.txt"), lang="en-us",
            ),
            num_threads=4,
        ),
    ))
    sid = script["voice"].get("local_sid", 16)  # 11 am_adam, 14 am_fenrir, 16 am_michael, 17 am_onyx
    parts = []
    for i, text in enumerate(texts):
        audio = tts.generate(spell_out(text, script["voice"].get("local_pronounce", {})), sid=sid, speed=1.0)
        wav = work / f"beat_{i:02d}.wav"
        sf.write(wav, audio.samples, audio.sample_rate)
        parts.append(wav)
    return parts


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--provider", choices=["elevenlabs", "local"], default="elevenlabs")
    args = ap.parse_args()

    script = load_script(args.slug)
    work = out_dir(args.slug) / "work"
    work.mkdir(exist_ok=True)
    texts = beat_texts(script)
    parts = (elevenlabs if args.provider == "elevenlabs" else local)(script, texts, work)

    listing = work / "concat.txt"
    listing.write_text("".join(f"file '{p}'\n" for p in parts))
    raw = out_dir(args.slug) / "voice_raw.wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(listing),
                    "-ar", "44100", "-ac", "1", str(raw)], check=True)
    print(f"wrote {raw} from {len(parts)} beats ({args.provider})")


if __name__ == "__main__":
    main()
