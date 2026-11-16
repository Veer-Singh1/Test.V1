"""Run pipeline steps 3 to 7 for one story: voice -> processed voice -> word timings -> timeline.

  python pipeline/run.py antwerp --provider elevenlabs   # needs ELEVENLABS_API_KEY
  python pipeline/run.py antwerp --provider local        # free stand-in voice
  python pipeline/run.py antwerp --skip-tts              # reuse public/<slug>/voice_raw.wav
"""
import argparse
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


def step(script: str, *args: str):
    print(f"\n== {script} {' '.join(args)}")
    subprocess.run([sys.executable, str(HERE / script), *args], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--provider", choices=["elevenlabs", "local"], default="elevenlabs")
    ap.add_argument("--skip-tts", action="store_true", help="voice_raw.wav already exists")
    ap.add_argument("--wpm", default="235")
    args = ap.parse_args()

    if not args.skip_tts:
        step("tts.py", args.slug, "--provider", args.provider)
    step("process_voice.py", args.slug, "--wpm", args.wpm)
    step("align.py", args.slug)
    step("build_timeline.py", args.slug)
    print(f"\nNext: npm run render -- out/{args.slug}/{args.slug}.mp4 --props='{{\"story\":\"{args.slug}\"}}'")


if __name__ == "__main__":
    main()
