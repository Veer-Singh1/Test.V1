"""Build the background layer for each plate: the picture and its depth with whatever stands in
front removed near every depth edge, filled in from the far side.

When the virtual camera moves (src/Plate3D.tsx), near things slide off the far things behind
them. This layer is what shows in the gap. Needs only numpy and Pillow.

  python blender/layers.py public/fivekeys/plates          # every <name>.jpg with a <name>_d.png
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

R, GUARD, TAU = 30, 3, 0.12  # reach of the fill, margin kept clear of blurred edges (depth-map pixels), depth jump that counts
SHIFTS = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]


def shift(a, dy, dx, fill):
    out = np.full_like(a, fill)
    h, w = a.shape[:2]
    out[max(dy, 0):h + min(dy, 0), max(dx, 0):w + min(dx, 0)] = a[max(-dy, 0):h + min(-dy, 0), max(-dx, 0):w + min(-dx, 0)]
    return out


def spread(a, n, op):
    for _ in range(n):  # a (2n+1) square window, built from 3x3 steps
        a = op.reduce([a] + [shift(a, dy, dx, a.max() if op is np.minimum else a.min()) for dy, dx in SHIFTS])
    return a


def read_depth(path):
    p = np.asarray(Image.open(path).convert("RGB"), dtype=np.float32)
    return (p[..., 0] * 256 + p[..., 1]) / 65535.0


def write_depth(d, path):
    v = np.round(np.clip(d, 0, 1) * 65535).astype(np.uint16)
    Image.fromarray(np.dstack([(v >> 8).astype(np.uint8), (v & 255).astype(np.uint8), np.zeros_like(v, np.uint8)]), "RGB").save(path)


def background(color, depth):
    """color: HxWx3 float, depth: HxW disparity (bigger = nearer). Returns the filled pair."""
    near = depth > spread(depth, R, np.minimum) * (1 + TAU)  # something clearly farther lies within reach
    blurred = ~near & (spread(depth, GUARD, np.maximum) > depth * (1 + TAU))  # far, but right beside something near
    todo = near | blurred
    limit = np.where(near, depth / (1 + TAU / 2), depth * 1.05)  # a source must be at least this far away
    d, c, valid = depth.copy(), color.copy(), ~todo
    for _ in range(R + GUARD + 4):
        if not todo.any():
            break
        best = np.full_like(d, np.inf)
        for dy, dx in SHIFTS:
            nd, nv = shift(d, dy, dx, np.inf), shift(valid, dy, dx, False)
            best = np.where(nv & (nd <= limit) & (nd < best), nd, best)
        hit = todo & np.isfinite(best)
        if not hit.any():
            break
        acc, cnt = np.zeros_like(c), np.zeros_like(d)
        for dy, dx in SHIFTS:
            nd, nv, nc = shift(d, dy, dx, np.inf), shift(valid, dy, dx, False), shift(c, dy, dx, 0.0)
            use = hit & nv & (nd <= best * 1.1)
            acc += nc * use[..., None]
            cnt += use
        c[hit] = acc[hit] / np.maximum(cnt[hit], 1)[:, None]
        d[hit] = best[hit]
        valid |= hit
        todo &= ~hit
    return c, d


def process(jpg, dpng, out_jpg, out_dpng):
    depth = read_depth(dpng)
    h, w = depth.shape
    color = np.asarray(Image.open(jpg).convert("RGB").resize((w, h), Image.LANCZOS), dtype=np.float32)
    c, d = background(color, depth)
    Image.fromarray(np.clip(c, 0, 255).astype(np.uint8), "RGB").save(out_jpg, quality=90)
    write_depth(d, out_dpng)


def main(folder):
    folder = Path(folder)
    jobs = [(p.with_name(p.name[:-6] + ".jpg"), p, p.with_name(p.name[:-6] + "_bg.jpg"), p.with_name(p.name[:-6] + "_bgd.png"))
            for p in sorted(folder.glob("*_d.png"))]
    for sub in (q for q in folder.iterdir() if q.is_dir()):  # clips: c_0001.jpg + d_0001.png -> b_0001.jpg + e_0001.png
        jobs += [(p.with_name("c_" + p.name[2:-4] + ".jpg"), p, p.with_name("b_" + p.name[2:-4] + ".jpg"), p.with_name("e_" + p.name[2:])) for p in sorted(sub.glob("d_*.png"))]
    done = 0
    for jpg, dpng, oj, od in jobs:
        if jpg.exists() and not (oj.exists() and od.exists()):
            process(jpg, dpng, oj, od)
            done += 1
    print(f"background layers: {done} written, {len(jobs) - done} already there")


if __name__ == "__main__":
    main(sys.argv[1])
