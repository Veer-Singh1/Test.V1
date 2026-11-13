#!/usr/bin/env python3
"""Build the timeline from audio/01.mp3 ... 18.mp3 (one clip per script line).

If a clip is missing, its length is estimated from the word count, so the
animation can be previewed before the narration exists (the build then has no voice).
"""
import json, re, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "audio"
SCRIPT = json.loads((ROOT / "src" / "script.json").read_text())

FPS = 30
GAP = 0.2
GAP_BEFORE = {5: 0.08, 6: 0.3, 8: 0.45, 10: 0.5, 11: 0.35, 12: 0.8, 15: 0.5, 18: 0.35}
HOLD_END = 3.0
LEAD_IN = 0.1
WPS = 3.0            # words per second used for missing clips (180 wpm)


def duration(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                       capture_output=True, text=True)
    return float(r.stdout.strip())


def part2_offset(p, dur):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(p), "-af", "silencedetect=noise=-35dB:d=0.15", "-f", "null", "-"],
                       capture_output=True, text=True)
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr) if 0.3 < float(x) < dur - 0.3]
    return ends[-1] if ends else dur * 0.68


def main():
    t, lines, missing = LEAD_IN, [], 0
    for n, s in enumerate(SCRIPT, 1):
        clip = AUDIO / f"{n:02d}.mp3"
        if clip.exists():
            d = duration(clip)
        else:
            d = max(0.6, len(s.split()) / WPS + 0.25); missing += 1
        if n > 1:
            t += GAP_BEFORE.get(n, GAP)
        lines.append({"n": n, "start": round(t, 3), "end": round(t + d, 3), "dur": round(d, 3), "voice": clip.exists()})
        t += d
    total = round((t + HOLD_END) * FPS + 0.5) / FPS
    last = AUDIO / f"{len(SCRIPT):02d}.mp3"
    tl = {"fps": FPS, "duration": round(total, 4), "frames": int(round(total * FPS)), "lines": lines,
          "lastLinePart2": round(part2_offset(last, lines[-1]["dur"]) if last.exists() else lines[-1]["dur"] * 0.68, 3)}
    (ROOT / "src" / "timeline.json").write_text(json.dumps(tl, indent=1))
    (ROOT / "src" / "timeline.js").write_text("window.TIMELINE = " + json.dumps(tl) + ";\n")
    print(f"{'line':>4} {'start':>7} {'end':>7} {'dur':>6}  text")
    for l, s in zip(lines, SCRIPT):
        print(f"{l['n']:>4} {l['start']:>7.2f} {l['end']:>7.2f} {l['dur']:>6.2f}  {s}")
    print(f"total: {total:.2f} s, {tl['frames']} frames" + (f"  ({missing} clips missing: durations estimated, NO VOICE)" if missing else ""))


if __name__ == "__main__":
    main()
