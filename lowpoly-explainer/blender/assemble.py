"""Turn rendered frames into the finished clip: upscale to 1080 x 1920, slow push-in, vignette.

The camera is locked off in 3D (see street.py), so the push-in is done here as a slow zoom
towards a point of interest. Sub-pixel crops keep it smooth.

  python blender/assemble.py out/street/frames out/street/street.mp4
"""
import argparse
import subprocess
from pathlib import Path

from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("frames")
ap.add_argument("out")
ap.add_argument("--zoom", type=float, default=1.06, help="scale at the last frame")
ap.add_argument("--anchor", type=float, nargs=2, default=(0.42, 0.63), help="point that stays put, as fractions of the frame")
ap.add_argument("--fps", type=int, default=30)
args = ap.parse_args()

W, H = 1080, 1920
files = sorted(Path(args.frames).glob("*.png"))
enc = subprocess.Popen(
    ["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(args.fps), "-i", "-",
     # light grain stops the sky gradient from banding once it is compressed
     "-vf", "vignette=PI/5.5,noise=alls=3:allf=t",
     "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", args.out],
    stdin=subprocess.PIPE)
for i, f in enumerate(files):
    im = Image.open(f).convert("RGB")
    z = 1 + (args.zoom - 1) * i / max(1, len(files) - 1)  # linear, so the move never settles
    w, h = im.width / z, im.height / z
    ax, ay = args.anchor[0] * im.width, args.anchor[1] * im.height
    left, top = ax - args.anchor[0] * w, ay - args.anchor[1] * h
    enc.stdin.write(im.resize((W, H), Image.LANCZOS, box=(left, top, left + w, top + h)).tobytes())
enc.stdin.close()
enc.wait()
print(f"wrote {args.out}: {len(files)} frames, {len(files) / args.fps:.1f} s")
