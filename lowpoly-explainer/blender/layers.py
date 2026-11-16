"""Prepare each plate for camera moves (src/Plate3D.tsx). Needs only numpy and Pillow.

1. Two background layers, at half resolution: the picture and its depth with whatever stands in
   front removed near every depth edge and filled in from the far side. When the virtual camera
   moves, near things slide off the far things behind them, and these layers show in the gap.
   The middle layer reaches a short way (the wall behind a railing, the floor behind a figure);
   the back layer reaches as far as the shot's widest gap needs (the sky behind a building).
2. Fringe flags, at full resolution, in the blue channel of the depth map: background pixels right
   beside a near edge, whose colour is part foreground because of anti-aliasing. The front layer
   drops them, so no sliver of a figure is left behind on the wall when the figure moves.

  python blender/layers.py public/fivekeys/plates [--force]   # every <name>.jpg with a <name>_d.png
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

R, GUARD, TAU = 30, 3, 0.12  # reach of the fill and margin cleared beside edges (half-resolution pixels), depth jump that counts
FRINGE = 2  # full-resolution pixels flagged beside each near edge
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


def write_depth(d, path, flag=None):
    v = np.round(np.clip(d, 0, 1) * 65535).astype(np.uint16)
    b = np.zeros_like(v, np.uint8) if flag is None else (flag * 255).astype(np.uint8)
    Image.fromarray(np.dstack([(v >> 8).astype(np.uint8), (v & 255).astype(np.uint8), b]), "RGB").save(path)


def half(color, depth):
    """2 x 2 blocks: colour averaged, depth the farthest of the four (so near things shrink, never grow)."""
    h, w = depth.shape
    h, w = h // 2 * 2, w // 2 * 2
    c = color[:h, :w].reshape(h // 2, 2, w // 2, 2, 3).mean(axis=(1, 3))
    d = depth[:h, :w].reshape(h // 2, 2, w // 2, 2).min(axis=(1, 3))
    return c, d


def background(color, depth, R=R):
    """color: HxWx3 float, depth: HxW disparity (bigger = nearer). R: how far the fill reaches,
    which must cover the widest gap the camera move opens. Returns the filled pair."""
    near = depth > spread(depth, R, np.minimum) * (1 + TAU)  # something clearly farther lies within reach
    blurred = ~near & (spread(depth, GUARD, np.maximum) > depth * (1 + TAU))  # far, but right beside something near
    todo = near | blurred
    limit = np.where(near, depth / (1 + TAU / 2), depth * 1.05)  # a source must be at least this far away
    d, c, valid = depth.copy(), color.copy(), ~todo
    for _ in range(R + GUARD + 4):
        if not todo.any():
            break
        # Of the neighbours that are far enough behind, take the nearest: the surface directly
        # behind the thing being removed (the wall behind a railing, not the sky beyond the wall).
        best = np.full_like(d, -np.inf)
        for dy, dx in SHIFTS:
            nd, nv = shift(d, dy, dx, np.inf), shift(valid, dy, dx, False)
            best = np.where(nv & (nd <= limit) & (nd > best), nd, best)
        hit = todo & np.isfinite(best)
        if not hit.any():
            break
        acc, cnt = np.zeros_like(c), np.zeros_like(d)
        for dy, dx in SHIFTS:
            nd, nv, nc = shift(d, dy, dx, np.inf), shift(valid, dy, dx, False), shift(c, dy, dx, 0.0)
            use = hit & nv & (nd <= limit) & (nd >= best / 1.1)
            acc += nc * use[..., None]
            cnt += use
        c[hit] = acc[hit] / np.maximum(cnt[hit], 1)[:, None]
        d[hit] = best[hit]
        valid |= hit
        todo &= ~hit
    return c, d


def process(jpg, dpng, out_jpg, out_dpng, back_jpg, back_dpng, reach=R):
    depth = read_depth(dpng)
    h, w = depth.shape
    color = np.asarray(Image.open(jpg).convert("RGB").resize((w, h), Image.LANCZOS), dtype=np.float32)
    fringe = spread(depth, FRINGE, np.maximum) > depth * (1 + TAU)
    write_depth(depth, dpng, fringe)
    hc, hd = half(color, depth)
    for (c, d), oj, od in ((background(hc, hd, R), out_jpg, out_dpng), (background(hc, hd, max(reach, R)), back_jpg, back_dpng)):
        Image.fromarray(np.clip(c, 0, 255).astype(np.uint8), "RGB").save(oj, quality=90)
        write_depth(d, od)


def _job(args):
    process(*args)
    return 1


def main(folder, force=False):
    """reach.json in the folder (written by the gap check) sets the fill reach per plate or clip."""
    import json
    from multiprocessing import Pool

    folder = Path(folder)
    reach = json.loads((folder / "reach.json").read_text()) if (folder / "reach.json").exists() else {}
    jobs = []
    for p in sorted(folder.glob("*_d.png")):  # plates: B1.jpg + B1_d.png -> B1_bg.jpg, B1_bgd.png, B1_bg2.jpg, B1_bg2d.png
        n = p.name[:-6]
        jobs.append((p.with_name(n + ".jpg"), p, *(p.with_name(n + x) for x in ("_bg.jpg", "_bgd.png", "_bg2.jpg", "_bg2d.png")), reach.get(n, R)))
    for sub in (q for q in folder.iterdir() if q.is_dir()):  # clips: c_0001.jpg + d_0001.png -> b_, e_ (middle), f_, g_ (back)
        for p in sorted(sub.glob("d_*.png")):
            k = p.name[2:-4]
            jobs.append((sub / f"c_{k}.jpg", p, sub / f"b_{k}.jpg", sub / f"e_{k}.png", sub / f"f_{k}.jpg", sub / f"g_{k}.png", reach.get(sub.name, R)))
    todo = [j for j in jobs if j[0].exists() and (force or not all(x.exists() for x in j[2:6]))]
    with Pool(4) as pool:
        done = sum(pool.imap_unordered(_job, todo))
    print(f"background layers: {done} written, {len(jobs) - done} already there")


if __name__ == "__main__":
    main(sys.argv[1], "--force" in sys.argv)
