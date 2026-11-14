"""Step 4: cap silences, speed up and normalise. voice_raw.wav -> voice.wav

Pass --wpm to search for the atempo that lands on a target speaking rate
(the reference videos sit at about 235 words per minute).
"""
import argparse
import subprocess

from common import duration, load_script, out_dir, sentences, split_words

FILTER = (
    "silenceremove=stop_periods=-1:stop_duration=0.2:stop_silence=0.12:stop_threshold=-40dB,"
    "atempo={tempo:.3f},"
    "loudnorm=I=-14:TP=-1.5:LRA=7"
)


def process(raw, out, tempo):
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(raw), "-af", FILTER.format(tempo=tempo),
                    "-ar", "44100", "-ac", "1", str(out)], check=True)
    return duration(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--wpm", type=float, default=235, help="target rate; 0 keeps the script's atempo")
    args = ap.parse_args()

    script = load_script(args.slug)
    n_words = sum(len(split_words(s["text"])) for _, s in sentences(script))
    d = out_dir(args.slug)
    raw, out = d / "voice_raw.wav", d / "voice.wav"

    tempo = script["voice"].get("atempo", 1.18)
    secs = process(raw, out, tempo)
    if args.wpm:
        # Duration scales with 1/tempo, so one correction step is enough.
        tempo = max(0.8, min(2.0, tempo * args.wpm / (n_words / secs * 60)))
        secs = process(raw, out, tempo)
    print(f"wrote {out}: {secs:.1f} s, {n_words} words, {n_words / secs * 60:.0f} wpm, atempo {tempo:.3f}")


if __name__ == "__main__":
    main()
