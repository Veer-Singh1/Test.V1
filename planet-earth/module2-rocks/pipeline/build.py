"""Assemble the video from build/timing.json.

    python -m pipeline.build                       # final_video.mp4 + subtitles.srt
    python -m pipeline.build --preview 22.4 42.4   # a short preview of that window -> preview.mp4

Manim shots must be rendered first (python -m pipeline.render_manim). Footage and photo shots use
the files in assets/ when present, otherwise a clearly labelled "pending" placeholder.
"""
import argparse
import json
import subprocess
import time

from . import media, mix, render_manim, subtitles, timeline
from .config import BUILD, FONTS, FPS, NAVY, ROOT, XFADE
from .scenes import ASSETS

SHOTS = BUILD / "shots"


def shot_clip(sh):
    SHOTS.mkdir(parents=True, exist_ok=True)
    out = SHOTS / f"{sh['id']}.mp4"
    secs = sh["duration"] + sh["tail"]
    labels = [dict(lb, dur=min(lb["dur"], secs - lb["at"] - media.LABEL_FADE - 0.05)) for lb in sh.get("labels", [])]
    if sh["kind"] == "manim":
        src = render_manim.output(sh)
        if not src.exists():
            raise SystemExit(f"missing Manim render for {sh['cls']}: run python -m pipeline.render_manim {sh['cls']}")
    else:
        src = media.asset_file(sh["key"])
    sig = json.dumps([sh, labels, str(src), src.stat().st_mtime if src else 0], sort_keys=True)
    sigf = out.with_suffix(".sig")
    if out.exists() and sigf.exists() and sigf.read_text() == sig:
        return out
    if sh["kind"] == "manim":
        media.manim_clip(src, secs, out)
    elif src is None:
        a = ASSETS[sh["key"]]
        media.still_clip(media.placeholder_image(sh["key"], a["desc"], a["kind"]), secs, out, labels, zoom=(1.0, 1.05))
    elif src.suffix.lower() in (".mp4", ".mov", ".webm", ".m4v", ".ogv"):
        media.video_clip(src, secs, out, labels, start=sh.get("start"))
    else:
        media.still_clip(src, secs, out, labels, zoom=sh.get("zoom", (1.0, 1.12)), pan=sh.get("pan", (0, 0)))
    sigf.write_text(sig)
    return out


def assemble(tl, t0, t1, out, mix_wav, ass_path):
    shots = [s for s in tl["shots"] if s["start"] < t1 and s["start"] + s["duration"] + s["tail"] > t0]
    clips = [shot_clip(s) for s in shots]
    base = shots[0]["start"]
    args = []
    for c in clips:
        args += ["-i", str(c)]
    args += ["-ss", f"{t0:.3f}", "-t", f"{t1 - t0:.3f}", "-i", str(mix_wav)]
    chain, last = [], "0:v"
    for k in range(1, len(clips)):
        off = shots[k]["start"] - base
        chain.append(f"[{last}][{k}:v]xfade=transition=fade:duration={XFADE}:offset={off:.4f}[x{k}]")
        last = f"x{k}"
    post = f"trim=start={t0 - base:.4f}:duration={t1 - t0:.4f},setpts=PTS-STARTPTS"
    if t0 == 0:
        post += f",fade=t=in:st=0:d=0.4:color=0x{NAVY.lstrip('#')}"
    post += f",ass={ass_path}:fontsdir={FONTS},format=yuv420p"
    chain.append(f"[{last}]{post}[v]")
    cmd = ["ffmpeg", "-v", "error", "-y", *args, "-filter_complex", ";".join(chain), "-map", "[v]",
           "-map", f"{len(clips)}:a", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
           "-r", str(FPS), "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart",
           "-t", f"{t1 - t0:.3f}", str(out)]
    subprocess.run(cmd, check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", nargs=2, type=float, metavar=("START", "END"))
    ap.add_argument("--out")
    args = ap.parse_args()
    tl = timeline.load()
    t_start = time.time()
    mix_wav = BUILD / "mix.wav"
    stats = mix.build(tl, mix_wav)
    print("audio:", stats)
    t0, t1 = (args.preview if args.preview else (0.0, tl["total"]))
    cs = subtitles.cues(tl, t0, t1)
    ass_path = BUILD / ("preview.ass" if args.preview else "subtitles.ass")
    subtitles.write_ass(cs, ass_path)
    if not args.preview:
        subtitles.write_srt(cs, ROOT / "subtitles.srt")
    out = ROOT / (args.out or ("preview.mp4" if args.preview else "final_video.mp4"))
    # mix.wav covers the whole timeline; slice the window being rendered
    assemble(tl, t0, t1, out, mix_wav, ass_path)
    print(f"wrote {out.name} ({t1 - t0:.1f}s) in {time.time() - t_start:.0f}s")


if __name__ == "__main__":
    main()
