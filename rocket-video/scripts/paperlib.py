"""Shared, deterministic image helpers for the paper stop-motion look.

Everything here is seeded: the same inputs always give the same pixels, so the
asset pipeline is repeatable. Used by generate_assets.py and process_assets.py.
"""
from __future__ import annotations

import numpy as np
from PIL import Image
from scipy import ndimage

# ---- palette (from the brief) -------------------------------------------
WARM = (0xEF, 0xE8, 0xDA)
NAVY = (0x1C, 0x24, 0x40)
ORANGE = (0xF0, 0x8A, 0x24)
YELLOW = (0xF6, 0xD3, 0x3C)
CREAM = (0xF4, 0xEE, 0xDF)
INK = (0x1B, 0x1B, 0x1B)
BORDER = (0xF8, 0xF3, 0xE7)  # slightly whiter paper used for cut-out borders


def hex2rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))  # type: ignore


# ---- noise ---------------------------------------------------------------
def value_noise(h: int, w: int, cell: float, rng: np.random.Generator) -> np.ndarray:
    """Smooth value noise in [0,1] with features roughly `cell` px wide."""
    gh, gw = int(h / cell) + 3, int(w / cell) + 3
    g = rng.random((gh, gw)).astype(np.float32)
    img = Image.fromarray(g, mode='F').resize((int(gw * cell), int(gh * cell)), Image.BICUBIC)
    a = np.asarray(img, dtype=np.float32)
    ox = int(rng.integers(0, max(1, a.shape[1] - w)))
    oy = int(rng.integers(0, max(1, a.shape[0] - h)))
    return np.clip(a[oy:oy + h, ox:ox + w], 0, 1)


def fbm(h: int, w: int, rng: np.random.Generator, base: float = 128, octaves: int = 5,
        gain: float = 0.5) -> np.ndarray:
    total = np.zeros((h, w), np.float32)
    amp, norm, cell = 1.0, 0.0, base
    for _ in range(octaves):
        total += amp * value_noise(h, w, max(cell, 1.5), rng)
        norm += amp
        amp *= gain
        cell /= 2
    return total / norm


# ---- masks -----------------------------------------------------------------
def soften(mask: np.ndarray, sigma: float) -> np.ndarray:
    return ndimage.gaussian_filter(mask.astype(np.float32), sigma)


def tear(alpha: np.ndarray, rng: np.random.Generator, rough: float = 1.0) -> np.ndarray:
    """Roughen a mask edge so it looks torn/hand-cut. Returns float alpha 0..1."""
    h, w = alpha.shape
    a = soften(alpha, 2.2 * rough + 0.6)
    n = (value_noise(h, w, 3.0, rng) - 0.5) * 0.55 + (value_noise(h, w, 18.0, rng) - 0.5) * 0.5
    out = (a + n * rough) > 0.5
    out = clean_mask(out)
    return np.clip(soften(out, 0.6), 0, 1)


def clean_mask(out: np.ndarray, min_frac: float = 0.03, min_px: int = 80, hole_px: int = 400) -> np.ndarray:
    """Drop stray specks (tiny islands) and fill pin-holes left by tearing."""
    lab, k = ndimage.label(out)
    if k > 1:
        sizes = ndimage.sum(out, lab, range(1, k + 1))
        keep = sizes >= max(sizes.max() * min_frac, min_px)
        out = np.concatenate([[False], keep])[lab]
    holes = ndimage.binary_fill_holes(out) & ~out
    hl, hk = ndimage.label(holes)
    if hk:
        hs = ndimage.sum(holes, hl, range(1, hk + 1))
        small = np.concatenate([[False], hs < hole_px])[hl]
        out = out | small
    return out


def uneven_border(alpha: np.ndarray, rng: np.random.Generator, wmin: float = 4,
                  wmax: float = 10) -> np.ndarray:
    """Mask of shape + an uneven paper margin between wmin and wmax px wide."""
    h, w = alpha.shape
    inside = alpha > 0.5
    dist = ndimage.distance_transform_edt(~inside)
    width = wmin + (wmax - wmin) * value_noise(h, w, 60.0, rng)
    border = (dist <= width).astype(np.float32)
    return np.maximum(tear(border, rng, 0.55), alpha)


def pad(img: Image.Image, p: int) -> Image.Image:
    out = Image.new(img.mode, (img.width + 2 * p, img.height + 2 * p), (0, 0, 0, 0) if img.mode == 'RGBA' else 0)
    out.paste(img, (p, p))
    return out


# ---- surface textures ----------------------------------------------------------
def fibres(h: int, w: int, rng: np.random.Generator, count: int | None = None) -> np.ndarray:
    """Signed fibre field (-1..1) of short, slightly curved strands."""
    if count is None:
        count = int(h * w / 900)
    canvas = np.zeros((h, w), np.float32)
    ys = rng.integers(0, h, count)
    xs = rng.integers(0, w, count)
    lengths = rng.integers(6, 28, count)
    angles = rng.random(count) * np.pi
    signs = np.where(rng.random(count) < 0.55, 1.0, -1.0) * (0.35 + 0.65 * rng.random(count))
    for y, x, L, a, s in zip(ys, xs, lengths, angles, signs):
        curve = (rng.random() - 0.5) * 0.08
        for t in range(L):
            aa = a + curve * t
            yy = int(y + np.sin(aa) * t)
            xx = int(x + np.cos(aa) * t)
            if 0 <= yy < h and 0 <= xx < w:
                canvas[yy, xx] += s
    canvas = ndimage.gaussian_filter(canvas, 0.55)
    return np.clip(canvas, -1, 1)


def paper_surface(h: int, w: int, rng: np.random.Generator, strength: float = 1.0) -> np.ndarray:
    """Multiplicative brightness field (~1.0) combining mottling, grain and fibres."""
    mott = (fbm(h, w, rng, base=220, octaves=4) - 0.5) * 0.06
    grain = (rng.random((h, w)).astype(np.float32) - 0.5) * 0.035
    fib = fibres(h, w, rng) * 0.07
    return 1.0 + strength * (mott + grain + fib)


def apply_surface(rgb: np.ndarray, surf: np.ndarray) -> np.ndarray:
    return np.clip(rgb * surf[..., None], 0, 255)


# ---- halftone ---------------------------------------------------------------
def halftone(dark: np.ndarray, spacing: float = 7.0, angle_deg: float = 45.0,
             gamma: float = 1.0) -> np.ndarray:
    """Return ink coverage (0..1) as round dots whose area follows `dark` (0..1)."""
    h, w = dark.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    a = np.deg2rad(angle_deg)
    u = (xx * np.cos(a) - yy * np.sin(a)) / spacing
    v = (xx * np.sin(a) + yy * np.cos(a)) / spacing
    fu = u - np.floor(u) - 0.5
    fv = v - np.floor(v) - 0.5
    d = np.sqrt(fu * fu + fv * fv)  # 0 .. 0.707 in cell units
    cov = np.clip(dark, 0, 1) ** gamma
    r = np.sqrt(cov / np.pi) * 1.08
    aa = 0.9 / spacing
    ink = np.clip((r - d) / aa + 0.5, 0, 1)
    ink[cov < 0.015] = 0
    return ink


def duotone(ink: np.ndarray, paper_rgb, ink_rgb) -> np.ndarray:
    p = np.array(paper_rgb, np.float32)
    k = np.array(ink_rgb, np.float32)
    return p[None, None, :] * (1 - ink[..., None]) + k[None, None, :] * ink[..., None]


# ---- io ------------------------------------------------------------------
def to_rgba(rgb: np.ndarray, alpha: np.ndarray) -> Image.Image:
    arr = np.dstack([np.clip(rgb, 0, 255), np.clip(alpha * 255, 0, 255)]).astype(np.uint8)
    return Image.fromarray(arr, 'RGBA')


def rgba_arrays(img: Image.Image):
    a = np.asarray(img.convert('RGBA'), np.float32)
    return a[..., :3], a[..., 3] / 255.0
