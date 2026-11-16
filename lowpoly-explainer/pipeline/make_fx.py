"""Textures and data for the collage style, made once:
  public/<slug>/fx/paper.jpg   cream paper with fibres and a soft vignette
  public/<slug>/fx/grain.png   a light film-grain overlay (transparent)
  public/<slug>/fx/map.json    Europe as SVG paths (Natural Earth, public domain), and how to place a point
  public/<slug>/art/*_cut.png  objects lifted off plain backgrounds, for sticker cutouts

  python pipeline/make_fx.py dragons <natural-earth land.geojson> <rivers.geojson>
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
rng = np.random.default_rng(7)


def blur(a, r):
    return np.asarray(Image.fromarray(a).filter(ImageFilter.GaussianBlur(r)), dtype=np.float32)


def paper(path, w=2400, h=1350, base=(238, 231, 216)):
    n = rng.normal(0, 1, (h, w)).astype(np.float32)
    fine = n * 2.2
    cloud = (blur(((rng.normal(0, 1, (h // 8, w // 8)) * 40 + 128).clip(0, 255)).astype(np.uint8), 3) - 128) / 40
    cloud = np.asarray(Image.fromarray(((cloud * 40 + 128).clip(0, 255)).astype(np.uint8)).resize((w, h), Image.BICUBIC),
                       dtype=np.float32)
    cloud = (cloud - 128) / 40 * 6
    fib = np.zeros((h, w), np.float32)  # short fibres
    for _ in range(2600):
        x, y, a, L = rng.uniform(0, w), rng.uniform(0, h), rng.uniform(0, math.pi), rng.uniform(8, 40)
        t = np.linspace(0, 1, int(L))
        xs = (x + np.cos(a) * L * t).astype(int).clip(0, w - 1)
        ys = (y + np.sin(a) * L * t).astype(int).clip(0, h - 1)
        fib[ys, xs] += rng.uniform(-9, 5)
    fib = blur(((fib + 128).clip(0, 255)).astype(np.uint8), 0.6) - 128
    yy, xx = np.mgrid[0:h, 0:w]
    vig = 1 - 0.10 * (((xx / w - 0.5) ** 2 + (yy / h - 0.5) ** 2) * 2.4)
    img = np.stack([np.clip((b + fine + cloud + fib) * vig, 0, 255) for b in base], -1).astype(np.uint8)
    Image.fromarray(img).save(path, quality=90)


def grain(path, w=1920, h=1080):
    n = rng.normal(0, 1, (h, w))
    a = (np.abs(n) * 22).clip(0, 60).astype(np.uint8)
    v = np.where(n > 0, 255, 0).astype(np.uint8)
    Image.fromarray(np.stack([v, v, v, a], -1), "RGBA").save(path, optimize=True)


def europe(path, land, rivers, lon0=-13.0, lon1=40.0, lat0=30.0, lat1=64.0, width=2400.0):
    """Equirectangular, squeezed by cos(47°) so shapes look right in mid-Europe. x, y in map units."""
    c = math.cos(math.radians(47))
    k = width / ((lon1 - lon0) * c)

    def xy(lon, lat):
        return (lon - lon0) * c * k, (lat1 - lat) * k

    def rings(geom):
        if geom["type"] == "Polygon":
            yield from geom["coordinates"]
        elif geom["type"] == "MultiPolygon":
            for poly in geom["coordinates"]:
                yield from poly

    parts = []
    for f in json.load(open(land))["features"]:
        for ring in rings(f["geometry"]):
            if not any(lon0 - 5 < lon < lon1 + 5 and lat0 - 5 < lat < lat1 + 5 for lon, lat in ring):
                continue
            pts = [xy(lon, lat) for lon, lat in ring]
            parts.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + "Z")
    rpaths = []
    for f in json.load(open(rivers))["features"]:
        if f["properties"].get("scalerank", 9) > 5:
            continue
        g = f["geometry"]
        lines = g["coordinates"] if g["type"] == "MultiLineString" else [g["coordinates"]]
        for line in lines:
            if any(lon0 < lon < lon1 and lat0 < lat < lat1 for lon, lat in line):
                rpaths.append("M" + "L".join("{:.1f},{:.1f}".format(*xy(lon, lat)) for lon, lat in line))
    json.dump({"lon0": lon0, "lat1": lat1, "cos": c, "k": k, "width": width, "height": (lat1 - lat0) * k,
               "land": "".join(parts), "rivers": "".join(rpaths)}, open(path, "w"))


def cutout(src, dst, tol=28):
    """Flood-fill the background from the image's border (it must be plain and light) and make it clear."""
    im = Image.open(src).convert("RGB")
    im.thumbnail((1400, 1400))
    a = np.asarray(im).astype(np.int16)
    h, w, _ = a.shape
    ref = np.median(np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]]), axis=0)
    close = (np.abs(a - ref).max(-1) < tol)
    bg = np.zeros((h, w), bool)
    stack = [(0, x) for x in range(w)] + [(h - 1, x) for x in range(w)] + [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)]
    while stack:
        y, x = stack.pop()
        if 0 <= y < h and 0 <= x < w and close[y, x] and not bg[y, x]:
            bg[y, x] = True
            stack += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    alpha = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    out = im.convert("RGBA")
    out.putalpha(alpha)
    bbox = alpha.getbbox()
    out.crop(bbox).save(dst)
    return out.crop(bbox).size


if __name__ == "__main__":
    slug = sys.argv[1]
    fx = ROOT / "public" / slug / "fx"
    fx.mkdir(parents=True, exist_ok=True)
    paper(fx / "paper.jpg")
    paper(fx / "paper_dark.jpg", base=(36, 32, 28))
    grain(fx / "grain.png")
    europe(fx / "map.json", sys.argv[2], sys.argv[3])
    art = ROOT / "public" / slug / "art"
    for name, tol in (("romanesque_dragon_head_carving", 45), ("hunt_lenox_globe", 26)):
        print(name, cutout(art / f"{name}.jpg", art / f"{name}_cut.png", tol))
    print("done")
