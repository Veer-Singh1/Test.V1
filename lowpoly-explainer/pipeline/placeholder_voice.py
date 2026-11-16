"""A stand-in narration from the local Kokoro voice, so a documentary can be cut before the real
recording exists. Writes public/<slug>/voice_tts/<part>.wav for every part of stories/<slug>/script.md.

  python pipeline/placeholder_voice.py dragons
"""
import argparse

import sherpa_onnx
import soundfile as sf

from build_doc import script_parts
from common import MODELS, ROOT


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--sid", type=int, default=17, help="11 am_adam, 14 am_fenrir, 16 am_michael, 17 am_onyx")
    ap.add_argument("--speed", type=float, default=0.95)
    args = ap.parse_args()
    m = MODELS / "kokoro-multi-lang-v1_0"
    tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
        kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
            model=str(m / "model.onnx"), voices=str(m / "voices.bin"), tokens=str(m / "tokens.txt"),
            data_dir=str(m / "espeak-ng-data"), lexicon=str(m / "lexicon-us-en.txt"), lang="en-us"),
        num_threads=4)))
    out = ROOT / "public" / args.slug / "voice_tts"
    out.mkdir(parents=True, exist_ok=True)
    for part, text in script_parts(args.slug).items():
        audio = tts.generate(text.replace("“", '"').replace("”", '"'), sid=args.sid, speed=args.speed)
        sf.write(out / f"{part}.wav", audio.samples, audio.sample_rate)
        print(part, f"{len(audio.samples) / audio.sample_rate:.1f} s", flush=True)


if __name__ == "__main__":
    main()
