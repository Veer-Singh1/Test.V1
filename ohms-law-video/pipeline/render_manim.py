"""Render the Manim shots listed in build/timing.json, several at a time.

    python -m pipeline.render_manim                 # all shots, 1080p30
    python -m pipeline.render_manim S03Atoms -q low # one shot, quick 480p15 check
"""
import argparse
import subprocess
from concurrent.futures import ThreadPoolExecutor

from . import timeline
from .config import BUILD, ROOT


def media_dir(quality):
    return BUILD / ("manim" if quality == "high" else "manim_lq")


def output(shot, quality="high"):
    folder = "1080p30" if quality == "high" else "480p15"
    return media_dir(quality) / "videos" / shot["module"] / folder / f"{shot['cls']}.mp4"


def render(shot, quality="high"):
    cmd = [str(ROOT / ".venv/bin/manim"), "render", "--disable_caching", "--media_dir", str(media_dir(quality)),
           "-o", shot["cls"], str(ROOT / "animations" / f"{shot['module']}.py"), shot["cls"]]
    cmd[2:2] = ["-r", "1920,1080", "--fps", "30"] if quality == "high" else ["-ql"]
    log = BUILD / "logs" / f"manim_{shot['cls']}_{quality}.log"
    log.parent.mkdir(parents=True, exist_ok=True)
    with open(log, "w") as f:
        rc = subprocess.run(cmd, stdout=f, stderr=subprocess.STDOUT, cwd=ROOT).returncode
    tail = log.read_text().strip().splitlines()[-12:]
    ok = rc == 0 and output(shot, quality).exists()
    print(f"{'ok  ' if ok else 'FAIL'} {shot['cls']}" + ("" if ok else "\n    " + "\n    ".join(tail)), flush=True)
    return ok


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("names", nargs="*", help="class names or module names (default: all)")
    ap.add_argument("-q", "--quality", choices=["high", "low"], default="high")
    ap.add_argument("-j", "--jobs", type=int, default=4)
    args = ap.parse_args()
    shots = [s for s in timeline.load()["shots"] if s["kind"] == "manim"
             and (not args.names or s["cls"] in args.names or s["module"] in args.names)]
    with ThreadPoolExecutor(args.jobs) as ex:
        results = list(ex.map(lambda s: render(s, args.quality), shots))
    if not all(results):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
