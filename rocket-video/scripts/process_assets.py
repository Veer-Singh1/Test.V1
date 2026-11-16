#!/usr/bin/env python3
"""Repeatable cut-out pipeline: raw art/photos -> paper cut-outs.

Reads assets/manifest.json and, for every entry, applies the requested
treatment, then writes assets/cutouts/<name>.png (textures go to assets/tex/).
Remotion serves assets/ as its public folder. Everything is seeded, so a
re-run gives byte-identical output.

Treatments
  paper    flat-colour art + optional *_shade.png -> halftone shading dots,
           paper fibre, slightly uneven scissor edge, cream paper border
  plate    greyscale "photo" plate (255 = dark) -> halftone duotone, torn
           edge, paper border (the archival-collage look)
  photo    a real photo in assets/raw/ -> background removal (rembg if
           installed, else the manifest's mask / luma key) -> greyscale ->
           halftone duotone -> torn edge -> paper border
  texture  copied unchanged (backgrounds, grain, vignette...)

Run: .venv/bin/python scripts/process_assets.py
"""
from __future__ import annotations

import json
import os
import shutil
import sys

import numpy as np
from PIL import Image, ImageOps

sys.path.insert(0, os.path.dirname(__file__))
from paperlib import (BORDER, duotone, halftone, hex2rgb, pad, paper_surface,  # noqa: E402
                      rgba_arrays, soften, tear, to_rgba, uneven_border)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
RAW = os.path.join(ROOT, 'assets', 'raw')
CUT = os.path.join(ROOT, 'assets', 'cutouts')
TEX = os.path.join(ROOT, 'assets', 'tex')  # Remotion's public dir is assets/ (see remotion.config.ts)
for d in (CUT, TEX):
    os.makedirs(d, exist_ok=True)


def seed_for(name: str) -> int:
    return sum((i + 1) * ord(c) for i, c in enumerate(name)) % 100000


def add_border(rgb: np.ndarray, alpha: np.ndarray, rng, wmin: float, wmax: float,
               colour=BORDER) -> tuple[np.ndarray, np.ndarray]:
    if wmax <= 0:
        return rgb, alpha
    b = uneven_border(alpha, rng, wmin, wmax)
    h, w = alpha.shape
    paper = np.array(colour, np.float32)[None, None, :] * paper_surface(h, w, rng, 0.8)[..., None]
    a = alpha[..., None]
    out = rgb * a + paper * (1 - a)
    return out, np.maximum(b, alpha)


def treat_paper(e, rng):
    img = Image.open(os.path.join(RAW, e['src'])).convert('RGBA')
    p = int(e.get('border', [4, 9])[1]) + 8
    img = pad(img, p)
    rgb, alpha = rgba_arrays(img)
    h, w = alpha.shape
    if e.get('shade'):
        sh = Image.open(os.path.join(RAW, e['shade'])).convert('L')
        sh = np.asarray(pad(sh, p), np.float32) / 255
        ink = halftone(sh * e.get('shade_gain', 1.0), e.get('dot', 6.0), e.get('angle', 45.0))
        k = np.array(hex2rgb(e.get('ink', '#1B1B1B')), np.float32)
        ia = (ink * e.get('ink_alpha', 0.5))[..., None]
        rgb = rgb * (1 - ia) + k[None, None, :] * ia
    rgb = rgb * paper_surface(h, w, rng, e.get('fibre', 1.0))[..., None]
    if e.get('rough', 0.35) > 0:
        alpha = np.minimum(alpha, tear((alpha > 0.5).astype(np.float32), rng, e.get('rough', 0.35)))
    wmin, wmax = e.get('border', [4, 9])
    return add_border(rgb, alpha, rng, wmin, wmax, hex2rgb(e['border_colour']) if 'border_colour' in e else BORDER)


def _plate_common(dark: np.ndarray, alpha: np.ndarray | None, e, rng):
    p = int(e.get('border', [5, 10])[1]) + 10
    dark = np.pad(dark, p)
    h, w = dark.shape
    if alpha is None:
        alpha = np.zeros((h, w), np.float32)
        alpha[p:-p, p:-p] = 1
    else:
        alpha = np.pad(alpha, p)
    ink = halftone(dark ** e.get('gamma', 1.0), e.get('dot', 7.0), e.get('angle', 45.0))
    rgb = duotone(ink, hex2rgb(e.get('paper', '#EDE5D3')), hex2rgb(e.get('ink', '#1B1B1B')))
    rgb = rgb * paper_surface(h, w, rng, 1.0)[..., None]
    alpha = tear((alpha > 0.5).astype(np.float32), rng, e.get('rough', 1.4))
    wmin, wmax = e.get('border', [5, 10])
    return add_border(rgb, alpha, rng, wmin, wmax)


def treat_plate(e, rng):
    dark = np.asarray(Image.open(os.path.join(RAW, e['src'])).convert('L'), np.float32) / 255
    alpha = None
    if e.get('alpha'):
        alpha = np.asarray(Image.open(os.path.join(RAW, e['alpha'])).convert('L'), np.float32) / 255
    return _plate_common(dark, alpha, e, rng)


def remove_background(img: Image.Image, e) -> np.ndarray:
    """Return alpha 0..1 for a real photo."""
    if e.get('mask'):
        return np.asarray(Image.open(os.path.join(RAW, e['mask'])).convert('L').resize(img.size), np.float32) / 255
    try:
        from rembg import remove  # type: ignore
        cut = remove(img.convert('RGB'))
        return np.asarray(cut.split()[-1], np.float32) / 255
    except Exception:
        # fallback luma key: treat near-white/near-black backgrounds as empty
        g = np.asarray(img.convert('L'), np.float32) / 255
        key = e.get('luma_key', 'none')
        if key == 'white':
            return (soften((g < 0.92).astype(np.float32), 1.5) > 0.5).astype(np.float32)
        if key == 'black':
            return (soften((g > 0.08).astype(np.float32), 1.5) > 0.5).astype(np.float32)
        return np.ones_like(g)


def treat_photo(e, rng):
    img = Image.open(os.path.join(RAW, e['src']))
    if e.get('crop'):
        img = img.crop(tuple(e['crop']))
    if e.get('max_size'):
        img.thumbnail((e['max_size'], e['max_size']), Image.LANCZOS)
    alpha = remove_background(img, e)
    g = ImageOps.autocontrast(img.convert('L'), cutoff=1)
    dark = 1 - np.asarray(g, np.float32) / 255
    return _plate_common(dark, alpha, e, rng)


def main():
    with open(os.path.join(ROOT, 'assets', 'manifest.json')) as f:
        manifest = json.load(f)
    only = set(sys.argv[1:])
    index = {}
    for e in manifest['assets']:
        name = e['name']
        if only and name not in only:
            continue
        t = e['treatment']
        if t == 'texture':
            shutil.copyfile(os.path.join(RAW, e['src']), os.path.join(TEX, f'{name}.png'))
            print('texture', name)
            continue
        rng = np.random.default_rng(seed_for(name))
        rgb, alpha = {'paper': treat_paper, 'plate': treat_plate, 'photo': treat_photo}[t](e, rng)
        img = to_rgba(rgb, alpha)
        img.save(os.path.join(CUT, f'{name}.png'), optimize=True)
        index[name] = {'w': img.width, 'h': img.height}
        print(f'{t:6s} {name} {img.width}x{img.height}')
    if not only:
        with open(os.path.join(ROOT, 'src', 'cutouts.json'), 'w') as f:
            json.dump(index, f, indent=1)


if __name__ == '__main__':
    main()
