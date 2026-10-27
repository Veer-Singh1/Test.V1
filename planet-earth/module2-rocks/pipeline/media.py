"""Per-shot video clips: Manim renders, stock footage, Ken Burns stills and labelled placeholders.

Every clip comes out as 1920x1080, 30 fps, yuv420p H.264 with an exact frame count, so the
crossfade chain in build.py lines up frame-accurately with the narration timeline.
"""
import json
import subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from .config import ASSETS, BUILD, FONT, FPS, H, W

ENC = ["-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-an"]
LABEL_FADE = 0.35


def frames(seconds):
    return int(round(seconds * FPS))


def rgb(hexstr, a=255):
    h = hexstr.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (a,)


def font(weight, size):
    return ImageFont.truetype(str(FONT[weight]), size)


def probe_duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return float(json.loads(out)["format"]["duration"])


def asset_file(key):
    for sub in ("footage", "photos"):
        for f in sorted((ASSETS / sub).glob(f"{key}.*")):
            return f
    return None


# ---------- labels ----------
def label_layer(lb):
    """A full-frame RGBA image with one pill label (matches the Manim pill style)."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    f = font("SemiBold", lb["size"])
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = d.textbbox((0, 0), lb["text"], font=f)
    padx, pady = int(lb["size"] * 0.55), int(lb["size"] * 0.38)
    w, h = x1 - x0 + 2 * padx, y1 - y0 + 2 * pady
    margin_x, top = 110, 92
    if lb["pos"] == "top-left":
        bx = margin_x
    elif lb["pos"] == "top-right":
        bx = W - margin_x - w
    else:
        bx = (W - w) // 2
    by = top
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle([bx, by + 8, bx + w, by + h + 8], radius=min(h // 2, 26), fill=(0, 0, 0, 120))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(14)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([bx, by, bx + w, by + h], radius=min(h // 2, 26), fill=rgb("#132A4F", 236),
                        outline=rgb(lb["color"]), width=4)
    d.text((bx + padx - x0, by + pady - y0), lb["text"], font=f, fill=rgb(lb["color"]))
    return img


def label_alpha(lb, t):
    a, b = lb["at"], lb["at"] + lb["dur"]
    if t < a or t > b + LABEL_FADE:
        return 0.0
    return min(1.0, (t - a) / LABEL_FADE, (b + LABEL_FADE - t) / LABEL_FADE)


# ---------- placeholders ----------
def placeholder_image(key, desc, kind):
    img = Image.new("RGB", (W, H), rgb("#0B1A33")[:3])
    d = ImageDraw.Draw(img)
    for x in range(-H, W, 46):  # faint diagonal hatching
        d.line([(x, H), (x + H, 0)], fill=rgb("#10223F")[:3], width=14)
    m = 150
    for i in range(m, W - m, 36):  # dashed frame
        d.line([(i, m), (i + 18, m)], fill=rgb("#94A3B8")[:3], width=3)
        d.line([(i, H - m), (i + 18, H - m)], fill=rgb("#94A3B8")[:3], width=3)
    for j in range(m, H - m, 36):
        d.line([(m, j), (m, j + 18)], fill=rgb("#94A3B8")[:3], width=3)
        d.line([(W - m, j), (W - m, j + 18)], fill=rgb("#94A3B8")[:3], width=3)
    lines = [("STOCK " + ("FOOTAGE" if kind == "video" else "PHOTO") + " PENDING", "SemiBold", 34, "#94A3B8"),
             (desc, "SemiBold", 60, "#F1F5F9"),
             ("Pexels · Pixabay · Wikimedia Commons", "Medium", 30, "#94A3B8")]
    y = H // 2 - 120
    for text, weight, size, color in lines:
        f = font(weight, size)
        x0, y0, x1, y1 = d.textbbox((0, 0), text, font=f)
        d.text(((W - (x1 - x0)) // 2 - x0, y - y0), text, font=f, fill=rgb(color)[:3])
        y += (y1 - y0) + 52
    return img


# ---------- encoders ----------
def _ffmpeg(args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def still_clip(src, seconds, out, labels=(), zoom=(1.0, 1.12), pan=(0.0, 0.0)):
    """Ken Burns move over a still (path or PIL image), with labels composited per frame."""
    img = src if isinstance(src, Image.Image) else Image.open(src)
    img = img.convert("RGB")
    # cover 1920x1080 with headroom for the zoom, then work at that size
    s = max(W / img.width, H / img.height) * max(zoom) * 1.02
    img = img.resize((int(img.width * s) + 2, int(img.height * s) + 2), Image.Resampling.LANCZOS)
    layers = [(lb, label_layer(lb)) for lb in labels]
    n = frames(seconds)
    proc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                             "-r", str(FPS), "-i", "-", *ENC, "-frames:v", str(n), str(out)], stdin=subprocess.PIPE)
    cx, cy = img.width / 2, img.height / 2
    base_w = img.width / max(zoom) / 1.02
    for k in range(n):
        u = 0.5 - 0.5 * np.cos(np.pi * k / max(1, n - 1))  # ease in-out
        z = zoom[0] + (zoom[1] - zoom[0]) * u
        w = base_w / z
        h = w * H / W
        x = cx + pan[0] * u * (img.width - w) / 2 - w / 2
        y = cy + pan[1] * u * (img.height - h) / 2 - h / 2
        frame = img.transform((W, H), Image.Transform.EXTENT, (x, y, x + w, y + h), Image.Resampling.BICUBIC)
        if layers:
            frame = frame.convert("RGBA")
            t = k / FPS
            for lb, layer in layers:
                a = label_alpha(lb, t)
                if a > 0:
                    lay = layer if a >= 1 else Image.fromarray((np.asarray(layer) * [1, 1, 1, a]).astype(np.uint8))
                    frame.alpha_composite(lay)
            frame = frame.convert("RGB")
        proc.stdin.write(frame.tobytes())
    proc.stdin.close()
    if proc.wait() != 0:
        raise RuntimeError(f"ffmpeg failed for {out}")


def video_clip(src, seconds, out, labels=(), start=None):
    """Trim, cover-crop and lightly grade stock footage; overlay labels with alpha fades."""
    avail = probe_duration(src)
    need = seconds
    stretch = 1.0  # >1 plays the clip slower when it is a little short
    if avail < need:
        stretch = min(1.6, need / max(avail, 0.1))
    span = need / stretch
    st = start if start is not None else max(0.0, (avail - span) / 2)
    st = min(st, max(0.0, avail - span))
    inputs = ["-ss", f"{st:.3f}"] + (["-stream_loop", "-1"] if avail * 1.6 < need else []) + ["-i", str(src)]
    chain = (f"[0:v]setpts={stretch:.4f}*(PTS-STARTPTS),scale={W}:{H}:force_original_aspect_ratio=increase,"
             f"crop={W}:{H},fps={FPS},eq=saturation=1.05:brightness=-0.02,vignette=PI/5,format=rgba[v0]")
    last = "v0"
    tmp = []
    for i, lb in enumerate(labels):
        p = BUILD / "labels" / f"{out.stem}_{i}.png"
        p.parent.mkdir(parents=True, exist_ok=True)
        label_layer(lb).save(p)
        tmp.append(p)
        inputs += ["-loop", "1", "-t", f"{seconds + 1:.2f}", "-i", str(p)]
        a, b = lb["at"], lb["at"] + lb["dur"]
        chain += (f";[{i + 1}:v]format=rgba,fade=t=in:st={a:.2f}:d={LABEL_FADE}:alpha=1,"
                  f"fade=t=out:st={b:.2f}:d={LABEL_FADE}:alpha=1[l{i}];[{last}][l{i}]overlay=0:0[v{i + 1}]")
        last = f"v{i + 1}"
    chain += f";[{last}]format=yuv420p[out]"
    _ffmpeg([*inputs, "-filter_complex", chain, "-map", "[out]", *ENC, "-frames:v", str(frames(seconds)), str(out)])


def manim_clip(src, seconds, out):
    """Normalise a Manim render to the exact length (holding the last frame if it is short)."""
    _ffmpeg(["-i", str(src), "-vf", f"fps={FPS},tpad=stop_mode=clone:stop_duration=3,format=yuv420p", *ENC,
             "-frames:v", str(frames(seconds)), str(out)])
