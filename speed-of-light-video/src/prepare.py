#!/usr/bin/env python3
"""Step 1+2: cut the single narration file into 18 clips, then build the timeline.

Usage: python3 src/prepare.py            (run from the project folder)

If you later export real per-line clips from ElevenLabs, drop them in audio/
as 01.mp3 ... 18.mp3 and run with --no-split.
"""
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "audio"
SRC = AUDIO / "narration-full.mp3"

# ---- settings you may want to change -------------------------------------
TEMPO = 1.2          # narration speed-up (1.0 = untouched). Source is ~136 wpm.
FPS = 30
GAP = 0.25           # normal gap between lines
GAP_BEFORE = {6: 0.55, 13: 0.6}   # extra beat on the cheetah; pause before "And light?"
GAP_AFTER = {13: 0.9}
HOLD_END = 3.0       # hold after line 18 (last 0.5 s is the rewind)
LEAD_IN = 0.1
# ---------------------------------------------------------------------------

# Speech boundaries in narration-full.mp3 (seconds), found with ffmpeg
# silencedetect (-35 dB, 0.18 s). (speech_start, speech_end) per script line.
LINES = [
    (0.00, 1.664), (1.943, 2.763), (3.129, 5.202), (5.566, 7.531),
    (7.886, 9.507), (9.792, 12.442), (12.851, 15.123), (15.426, 18.280),
    (18.578, 21.247), (21.671, 24.530), (24.806, 28.033), (28.256, 33.940),
    (34.291, 34.834), (35.082, 38.398), (38.681, 42.429), (42.864, 45.483),
    (45.940, 49.192), (49.712, 53.016),
]
PAD_IN, PAD_OUT = 0.04, 0.09


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def split():
    for i, (a, b) in enumerate(LINES, 1):
        a2, b2 = max(0, a - PAD_IN), b + PAD_OUT
        out = AUDIO / f"{i:02d}.mp3"
        af = f"atempo={TEMPO}," if abs(TEMPO - 1) > 1e-3 else ""
        af += "afade=t=in:d=0.01"
        r = run(["ffmpeg", "-y", "-v", "error", "-ss", f"{a2}", "-to", f"{b2}",
                 "-i", str(SRC), "-af", af, "-c:a", "libmp3lame", "-q:a", "2", str(out)])
        if r.returncode:
            sys.exit(r.stderr)


def duration(p):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "csv=p=0", str(p)])
    return float(r.stdout.strip())


def second_sentence_offset(p, dur):
    """Where the second sentence of line 18 starts inside its clip."""
    r = run(["ffmpeg", "-hide_banner", "-i", str(p), "-af",
             "silencedetect=noise=-35dB:d=0.15", "-f", "null", "-"])
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
    ends = [e for e in ends if 0.3 < e < dur - 0.4]
    return ends[0] if ends else dur * 0.42


def main():
    if "--no-split" not in sys.argv:
        split()
    t = LEAD_IN
    lines = []
    for n in range(1, 19):
        d = duration(AUDIO / f"{n:02d}.mp3")
        if n > 1:
            t += max(GAP_BEFORE.get(n, GAP), GAP_AFTER.get(n - 1, GAP))
        lines.append({"n": n, "start": round(t, 3), "end": round(t + d, 3), "dur": round(d, 3)})
        t += d
    total = t + HOLD_END
    total = round(total * FPS + 0.5) / FPS
    tl = {
        "fps": FPS, "duration": round(total, 4), "frames": int(round(total * FPS)),
        "tempo": TEMPO, "lines": lines,
        "line18Part2": round(second_sentence_offset(AUDIO / "18.mp3", lines[17]["dur"]), 3),
    }
    (ROOT / "src" / "timeline.json").write_text(json.dumps(tl, indent=1))
    (ROOT / "src" / "timeline.js").write_text("window.TIMELINE = " + json.dumps(tl) + ";\n")

    script = [l.split("|")[2].strip() for l in
              (ROOT / "speed-comparison-video.md").read_text().splitlines()
              if re.match(r"\| \d\d \|", l)]
    print(f"{'line':>4} {'start':>7} {'end':>7} {'dur':>6}  text")
    for l, s in zip(lines, script):
        print(f"{l['n']:>4} {l['start']:>7.2f} {l['end']:>7.2f} {l['dur']:>6.2f}  {s}")
    print(f"total: {total:.2f} s, {tl['frames']} frames, narration tempo x{TEMPO}")


if __name__ == "__main__":
    main()
