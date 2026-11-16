#!/usr/bin/env python3
"""Draw every original art plate for the video (deterministic, seeded).

No usable archival photos could be downloaded in the build environment (see
DECISIONS.md), so all visual material is drawn here in code. Output goes to
assets/raw/generated/ as:
  <name>.png        RGBA flat-colour art (alpha = cut line before tearing)
  <name>_shade.png  optional L image: 0..255 "darkness" that process_assets.py
                    turns into halftone dots
  plate_*.png       greyscale "photo" plates (L, 255 = dark ink) for the
                    halftone/duotone archival treatment
  tex_*.png         background textures and overlays (used as-is)
Run:  .venv/bin/python scripts/generate_assets.py
"""
from __future__ import annotations

import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(__file__))
from paperlib import (CREAM, INK, NAVY, ORANGE, WARM, YELLOW, fbm, fibres,  # noqa: E402
                      hex2rgb, paper_surface, soften, tear, value_noise)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(ROOT, 'assets', 'raw', 'generated')
os.makedirs(OUT, exist_ok=True)

SS = 3  # supersampling for polygon masks


def rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


def poly(size, pts, ss=SS) -> np.ndarray:
    w, h = size
    im = Image.new('L', (w * ss, h * ss), 0)
    ImageDraw.Draw(im).polygon([(x * ss, y * ss) for x, y in pts], fill=255)
    return np.asarray(im.resize((w, h), Image.LANCZOS), np.float32) / 255


def ellipse(size, box, ss=SS) -> np.ndarray:
    w, h = size
    im = Image.new('L', (w * ss, h * ss), 0)
    ImageDraw.Draw(im).ellipse([v * ss for v in box], fill=255)
    return np.asarray(im.resize((w, h), Image.LANCZOS), np.float32) / 255


def rrect(size, box, r, ss=SS) -> np.ndarray:
    w, h = size
    im = Image.new('L', (w * ss, h * ss), 0)
    ImageDraw.Draw(im).rounded_rectangle([v * ss for v in box], radius=r * ss, fill=255)
    return np.asarray(im.resize((w, h), Image.LANCZOS), np.float32) / 255


class Layered:
    """Paint flat paper colours with masks, track overall alpha and shade."""

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.rgb = np.zeros((h, w, 3), np.float32)
        self.alpha = np.zeros((h, w), np.float32)
        self.shade = np.zeros((h, w), np.float32)

    def paint(self, mask, colour, shade=None):
        m = np.clip(mask, 0, 1)[..., None]
        self.rgb = self.rgb * (1 - m) + np.array(colour, np.float32) * m
        self.alpha = np.maximum(self.alpha, mask)
        if shade is not None:
            s = shade if np.ndim(shade) else np.full((self.h, self.w), shade, np.float32)
            self.shade = self.shade * (1 - mask) + s * mask

    def save(self, name, with_shade=True):
        arr = np.dstack([np.clip(self.rgb, 0, 255), np.clip(self.alpha, 0, 1) * 255]).astype(np.uint8)
        Image.fromarray(arr, 'RGBA').save(os.path.join(OUT, f'{name}.png'))
        if with_shade:
            sh = (np.clip(self.shade, 0, 1) * 255).astype(np.uint8)
            Image.fromarray(sh, 'L').save(os.path.join(OUT, f'{name}_shade.png'))
        print('  wrote', name)


def cyl_shade(w, h, x0, x1, base=0.12, edge=0.55):
    """Darkness across a cylinder from x0..x1 (light from the left)."""
    xs = np.arange(w, dtype=np.float32)
    xn = np.clip((xs - (x0 + x1) / 2) / ((x1 - x0) / 2), -1, 1)
    s = base + edge * np.clip(xn, 0, 1) ** 1.4 + 0.22 * np.clip(-xn, 0, 1) ** 4
    return np.tile(s, (h, 1))


GREY = hex2rgb('#5B5752')
DARK = hex2rgb('#2E2C2A')


# ---------------------------------------------------------------------------
def rocket_lower():
    W, H = 200, 690
    L = Layered(W, H)
    sz = (W, H)
    # interstage cone at top (stays with the first stage at separation)
    L.paint(poly(sz, [(48, 0), (152, 0), (160, 50), (40, 50)]), DARK, cyl_shade(W, H, 40, 160, 0.1, 0.5))
    # main body
    L.paint(poly(sz, [(40, 50), (160, 50), (160, 575), (40, 575)]), CREAM, cyl_shade(W, H, 40, 160))
    L.paint(poly(sz, [(40, 92), (160, 92), (160, 110), (40, 110)]), INK, 0.2)
    L.paint(poly(sz, [(40, 520), (160, 520), (160, 540), (40, 540)]), INK, 0.2)
    L.paint(poly(sz, [(40, 300), (160, 300), (160, 316), (40, 316)]), ORANGE, cyl_shade(W, H, 40, 160, 0.05, 0.4))
    # fins
    L.paint(poly(sz, [(42, 420), (3, 600), (3, 650), (42, 600)]), NAVY, 0.25)
    L.paint(poly(sz, [(158, 420), (197, 600), (197, 650), (158, 600)]), NAVY, 0.45)
    # engine bell
    L.paint(poly(sz, [(72, 575), (128, 575), (150, 688), (50, 688)]), GREY, cyl_shade(W, H, 50, 150, 0.2, 0.55))
    L.save('rocket_lower')


def rocket_upper():
    W, H = 200, 420
    L = Layered(W, H)
    sz = (W, H)
    # fairing (ogive)
    right = [(100 + 54 * math.sin(i / 40 * math.pi / 2) ** 0.75, 175 * i / 40) for i in range(41)]
    left = [(200 - x, y) for (x, y) in reversed(right)]
    L.paint(poly(sz, right + [(154, 178), (46, 178)] + left), ORANGE, cyl_shade(W, H, 46, 154, 0.08, 0.5))
    # body
    L.paint(poly(sz, [(48, 172), (152, 172), (152, 420), (48, 420)]), CREAM, cyl_shade(W, H, 48, 152))
    L.paint(poly(sz, [(48, 172), (152, 172), (152, 186), (48, 186)]), INK, 0.2)
    L.paint(poly(sz, [(48, 380), (152, 380), (152, 396), (48, 396)]), NAVY, 0.3)
    L.save('rocket_upper')


def nozzle_small():
    W, H = 90, 80
    L = Layered(W, H)
    L.paint(poly((W, H), [(30, 0), (60, 0), (84, 78), (6, 78)]), GREY, cyl_shade(W, H, 6, 84, 0.2, 0.55))
    L.save('nozzle_small')


def rocket_cutaway():
    W, H = 400, 1060
    sz = (W, H)
    L = Layered(W, H)
    cx = 200
    # fins
    L.paint(poly(sz, [(96, 800), (30, 980), (30, 1020), (96, 960)]), NAVY, 0.25)
    L.paint(poly(sz, [(304, 800), (370, 980), (370, 1020), (304, 960)]), NAVY, 0.45)
    # engine bells
    for ex in (150, 250):
        L.paint(poly(sz, [(ex - 22, 935), (ex + 22, 935), (ex + 40, 1055), (ex - 40, 1055)]), GREY,
                cyl_shade(W, H, ex - 40, ex + 40, 0.2, 0.55))
    # shell outline (nose + body)
    nose = []
    for i in range(41):
        t = i / 40
        nose.append((cx + 104 * math.sin(t * math.pi / 2) ** 0.75, 250 * t))
    shell = nose + [(cx + 104, 940), (cx - 104, 940)] + [(2 * cx - x, y) for (x, y) in reversed(nose)]
    L.paint(poly(sz, shell), CREAM, cyl_shade(W, H, 96, 304, 0.1, 0.45))
    # interior cavity (the "cut open" window), slightly irregular edges
    r = rng(11)
    inner = []
    for i in range(30):
        t = 0.18 + 0.82 * i / 29
        inner.append((cx + (104 * math.sin(t * math.pi / 2) ** 0.75 - 16) + r.normal(0, 1.5), 250 * t))
    cav = inner + [(cx + 88 + r.normal(0, 2), y) for y in range(270, 925, 45)] + \
        [(cx - 88 + r.normal(0, 2), y) for y in range(925, 270, -45)] + \
        [(2 * cx - x, y) for (x, y) in reversed(inner)]
    L.paint(poly(sz, cav), hex2rgb('#3A3633'), 0.35)
    # payload: a small satellite inside the fairing
    L.paint(poly(sz, [(178, 120), (222, 120), (222, 200), (178, 200)]), NAVY, 0.2)
    L.paint(poly(sz, [(132, 140), (176, 140), (176, 180), (132, 180)]), YELLOW, 0.15)
    L.paint(poly(sz, [(224, 140), (268, 140), (268, 180), (224, 180)]), YELLOW, 0.15)
    L.paint(poly(sz, [(170, 214), (230, 214), (230, 226), (170, 226)]), GREY, 0.3)  # payload adapter
    # tanks with domed ends
    def tank(y0, y1, col):
        m = rrect(sz, (cx - 80, y0, cx + 80, y1), 70)
        L.paint(m, col, cyl_shade(W, H, cx - 80, cx + 80, 0.06, 0.5))
    tank(258, 590, YELLOW)    # oxidiser
    tank(606, 880, ORANGE)    # fuel
    # feed lines + engine bay
    L.paint(poly(sz, [(cx - 6, 880), (cx + 6, 880), (cx + 6, 935), (cx - 6, 935)]), INK, 0.2)
    L.paint(poly(sz, [(cx - 60, 905), (cx + 60, 905), (cx + 60, 935), (cx - 60, 935)]), GREY, 0.35)
    L.save('rocket_cutaway')


def balloon():
    W, H = 300, 440
    sz = (W, H)
    L = Layered(W, H)
    body = ellipse(sz, (22, 10, 278, 350))
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    rad = np.sqrt(((xx - 110) / 150) ** 2 + ((yy - 120) / 190) ** 2)
    L.paint(np.maximum(body, poly(sz, [(128, 330), (172, 330), (162, 372), (138, 372)])), ORANGE,
            np.clip(0.05 + 0.6 * rad ** 2, 0, 0.8))
    L.paint(ellipse(sz, (70, 60, 120, 140)), CREAM, 0.0)
    L.save('balloon')


def flame(i: int):
    W, H = 200, 430
    sz = (W, H)
    r = rng(100 + i)
    L = Layered(W, H)

    def tongue(scale, length, sway, phase, wob):
        pts_r, pts_l = [], []
        for k in range(61):
            t = k / 60
            if t < 0.22:
                hw = 34 + (scale * 82 - 34) * math.sin(t / 0.22 * math.pi / 2)
            else:
                hw = scale * 82 * (1 - (t - 0.22) / 0.78) ** 0.85
            hw *= 1 + wob * math.sin(t * 13 + phase) + 0.5 * wob * math.sin(t * 29 + 2 * phase)
            y = t * length
            x = 100 + sway * t ** 2
            pts_r.append((x + hw, y))
            pts_l.append((x - hw * (1 + 0.15 * math.sin(phase + t * 7)), y))
        return pts_r + list(reversed(pts_l))

    sway = r.uniform(-30, 30)
    ph = r.uniform(0, 6.28)
    outer = poly(sz, tongue(1.0, r.uniform(330, 420), sway, ph, 0.10))
    # extra side licks
    for _ in range(2):
        y0 = r.uniform(80, 200)
        side = r.choice([-1, 1])
        lick = poly(sz, [(100 + side * 40, y0 - 30), (100 + side * r.uniform(85, 98), y0 + r.uniform(40, 90)),
                         (100 + side * 30, y0 + 60)])
        outer = np.maximum(outer, lick)
    L.paint(tear(outer, r, 1.2), ORANGE)
    L.paint(tear(poly(sz, tongue(0.66, r.uniform(220, 290), sway * 0.7, ph + 1, 0.12)), r, 1.1), YELLOW)
    L.paint(tear(poly(sz, tongue(0.36, r.uniform(110, 160), sway * 0.4, ph + 2, 0.15)), r, 1.0), CREAM)
    L.save(f'flame_{i}', with_shade=False)


def smoke(i: int):
    W, H = 480, 340
    r = rng(200 + i)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    m = np.zeros((H, W), np.float32)
    shade = np.ones((H, W), np.float32)
    for _ in range(9):
        cx, cy = r.uniform(110, 370), r.uniform(120, 230)
        rad = r.uniform(55, 115)
        d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / rad
        inside = d < 1
        m = np.maximum(m, inside.astype(np.float32))
        # each puff lit from upper-left
        s = np.clip(0.1 + 0.4 * ((xx - cx) + (yy - cy)) / (rad * 1.6) + 0.3 * d ** 3, 0, 0.75)
        shade = np.where(inside, np.minimum(shade, s), shade)
    L = Layered(W, H)
    L.paint(tear(m, r, 1.3), hex2rgb('#ECE5D6'), shade * (0.85 + 0.3 * fbm(H, W, r, 60, 3)))
    L.save(f'smoke_{i}')


# ---------------------------------------------------------------------------
# Earth: orthographic paper globe with hand-traced (approximate) continents
CONTINENTS = {
    'africa': [(-5.9, 35.8), (10, 37.2), (11, 33.5), (15, 32.5), (20, 31.5), (25, 31.8), (29.9, 31.2), (32.5, 31.3),
               (32.6, 29.9), (35.5, 23.5), (37.2, 19), (39.5, 15.6), (43.3, 12), (51.2, 11.8), (49, 6), (45.3, 2),
               (41.5, -1.5), (39.7, -4), (40.4, -10.5), (40.7, -15), (34.9, -19.8), (35.5, -23.8), (32.6, -25.9),
               (31, -29.9), (27.9, -33), (25.6, -34), (20, -34.8), (18.4, -34.4), (17.9, -32.5), (16.5, -29),
               (14.5, -22.9), (11.8, -17), (13.8, -12), (13.2, -8.8), (12.3, -6), (9, -1), (9.7, 3.9), (8.5, 4.5),
               (6, 4.3), (3.4, 6.4), (-1, 5.2), (-4, 5.3), (-7.5, 4.4), (-10.8, 6.3), (-13.2, 8.5), (-15, 11),
               (-17.4, 14.7), (-16.5, 19.5), (-17, 21), (-13.2, 27), (-9.6, 30.4), (-7.6, 33.6), (-5.9, 35.8)],
    'madagascar': [(49.3, -12), (50.4, -15.5), (47.1, -25), (45, -25.5), (43.8, -21), (44.5, -16), (49.3, -12)],
    'eurasia': [(-5.6, 36.0), (-2, 36.7), (0.5, 38.8), (3.2, 41.9), (4.8, 43.4), (7.5, 43.8), (8.8, 44.4),
                (10.5, 43.5), (12.3, 41.7), (15.6, 40.1), (16.0, 38.0), (17.1, 39.0), (18.5, 40.1), (16.9, 41.3),
                (13.6, 43.6), (12.3, 45.3), (13.7, 45.6), (15.2, 44.2), (19.1, 41.9), (19.4, 40.3), (21.1, 38.3),
                (22.9, 36.4), (24.0, 38.0), (24.0, 40.0), (26.5, 40.3), (27.3, 37.0), (30.6, 36.7), (36.0, 36.6),
                (35.9, 35.0), (34.9, 32.6), (34.3, 31.3), (35, 29.5), (37, 25.5), (39.2, 21.5), (41.5, 17),
                (43.3, 12.7), (45, 12.8), (49, 14.6), (52.2, 16.0), (55.5, 17.5), (57.8, 19.0), (59.8, 22.5),
                (58.5, 23.6), (56.3, 24.9), (56.4, 26.4), (54.5, 24.3), (51.6, 24.5), (51.1, 26.1), (48.5, 28.4),
                (48, 30), (50.0, 30.2), (51.5, 27.9), (54.7, 26.5), (56.8, 27.1), (61.6, 25.2), (66.7, 25.4),
                (68.6, 23.3), (70.3, 20.9), (72.8, 19.0), (73.4, 16), (74.8, 12.8), (76.3, 9.5), (77.5, 8.1),
                (78.2, 8.9), (79.8, 10.3), (80.3, 13.2), (80.1, 15.7), (82.3, 16.6), (86.9, 19.9), (86.9, 21.4),
                (89, 21.8), (91.8, 22.4), (94.2, 18.8), (94.4, 16), (97.6, 16.6), (98.6, 13.0), (98.7, 10.0),
                (100.4, 7.0), (100.3, 5.0), (102.0, 2.5), (103.4, 1.4), (103.4, 4.0), (102.6, 6.2), (100.2, 13.4),
                (102.3, 12.2), (104.9, 8.6), (106.7, 10.4), (109.2, 12.0), (108.8, 15.4), (106.6, 18.0),
                (108.0, 21.6), (110, 21), (113, 22.3), (117, 23.7), (120, 27), (122, 30.8), (121, 32.2),
                (119.5, 35), (122.5, 37.4), (118, 38.8), (121.5, 40.8), (124.3, 40), (126.5, 37.7), (129.4, 35.4),
                (129.5, 42.3), (135.5, 43.8), (140, 48), (141, 52), (137, 54), (141, 59), (160, 61), (180, 65),
                (180, 72), (140, 73), (110, 77), (80, 73), (66, 69), (50, 68), (40, 66), (41, 64.5), (36, 64.8),
                (34, 66), (30, 70), (25, 71), (18, 70), (14, 68), (12.5, 66), (10, 64), (5, 62), (5.5, 58.5),
                (7.5, 58), (10.5, 59.2), (11.2, 58.4), (12.5, 56.3), (12.8, 55.4), (10.5, 54.4), (8.5, 57),
                (8.6, 53.9), (4.7, 53), (3.4, 51.4), (1.6, 50.9), (-1.2, 49.4), (-4.7, 48.5), (-1.2, 46.2),
                (-1.5, 43.4), (-8, 43.7), (-9.3, 43), (-8.9, 38.7), (-8.9, 37), (-5.6, 36.0)],
    'britain': [(-5.7, 50.1), (1.4, 51.3), (1.7, 52.7), (0, 53.5), (-1.6, 55.6), (-2, 57.6), (-3.3, 58.6),
                (-5, 58.6), (-6.2, 56.3), (-4.9, 54.8), (-3, 53.4), (-4.6, 52.8), (-5.2, 51.7), (-3.1, 51.4)],
    'ireland': [(-6.0, 52.2), (-6.2, 54.1), (-5.6, 54.6), (-7.5, 55.3), (-10, 54.2), (-9.5, 51.6)],
    'samerica': [(-77.4, 8.7), (-75.5, 10.6), (-71.6, 12.4), (-68, 10.6), (-62.5, 10.7), (-60.8, 8.5), (-57, 6),
                 (-52, 5), (-50, 1.8), (-48.5, -1), (-44, -2.5), (-39, -3.5), (-35.2, -5.5), (-34.9, -8),
                 (-37.1, -11), (-39, -14), (-39.2, -17.7), (-40.9, -21.9), (-43.2, -22.9), (-48.5, -26),
                 (-48.8, -28.6), (-51.2, -30.1), (-53.4, -33.7), (-57, -35), (-57.5, -38), (-62, -39), (-65, -42),
                 (-65.8, -45), (-67.5, -46.5), (-65.8, -48), (-69, -51), (-68.6, -52.6), (-71, -54), (-74.5, -52),
                 (-75.5, -46), (-73.5, -42.5), (-73.6, -37), (-71.5, -30), (-70.2, -23), (-70.3, -18.4),
                 (-76, -14.6), (-79.6, -7.9), (-81.2, -5), (-80.4, -0.6), (-78.8, 1.6), (-77.4, 4), (-77.3, 7)],
    'greenland': [(-44, 60), (-38, 66), (-22, 70), (-18, 77), (-30, 83), (-60, 82), (-72, 78), (-58, 75),
                  (-53, 70), (-50, 64)],
    'sumatra': [(95.3, 5.6), (97.5, 5.2), (100.4, 2.2), (103.8, -1), (106, -3), (105.9, -5.8), (104.5, -5.9),
                (102, -4), (100, -1), (98.6, 1.7)],
    'borneo': [(109, 1.5), (110.5, -1.5), (116, -4), (117.5, 0.5), (119, 5), (117, 7), (115, 5), (113, 3.2),
               (111, 1.6)],
    'antarctica': [(-180, -66), (180, -66), (180, -90), (-180, -90)],
}
WATER = {
    'black_sea': [(28, 41.2), (28.6, 43.4), (30.2, 46.3), (33.5, 46), (36.5, 45.3), (39.5, 47), (38, 44.4),
                  (41.6, 41.6), (36, 41.7), (31, 41.1)],
    'caspian': [(47, 44), (49, 46.5), (53, 46.8), (51.3, 45), (53, 42), (54, 37.5), (50.3, 37.2), (49, 38.5),
                (48.6, 41.9)],
}
DESERT = {
    'sahara': [(-16, 27), (-10, 30), (0, 32), (10, 33), (20, 30.5), (31, 30), (33, 25), (36, 20), (30, 16),
               (20, 15), (10, 16), (0, 16), (-12, 18), (-16, 22)],
    'arabia': [(36, 30), (46, 31), (50, 26), (55, 22), (52, 18), (44, 17), (38, 22)],
    'kalahari': [(15.5, -18), (24, -18.5), (26, -25.5), (21, -28.5), (16.2, -27)],
}


def earth():
    D = 1960
    R = 950
    cx = cy = D / 2
    lat0, lon0 = math.radians(4.0), math.radians(18.0)
    MW, MH = 2880, 1440

    def mapimg(polys):
        im = Image.new('L', (MW, MH), 0)
        dr = ImageDraw.Draw(im)
        for pts in polys.values():
            dr.polygon([((lon + 180) / 360 * MW, (90 - lat) / 180 * MH) for lon, lat in pts], fill=255)
        return np.asarray(im, np.float32) / 255

    land_map = mapimg(CONTINENTS)
    land_map = np.minimum(land_map, 1 - mapimg(WATER))
    desert_map = mapimg(DESERT)
    ice_map = mapimg({'a': CONTINENTS['antarctica'], 'g': CONTINENTS['greenland']})

    yy, xx = np.mgrid[0:D, 0:D].astype(np.float32)
    X = (xx - cx) / R
    Y = -(yy - cy) / R
    rho = np.sqrt(X * X + Y * Y)
    disc = rho <= 1.0
    rho_c = np.clip(rho, 1e-6, 1)
    c = np.arcsin(rho_c)
    lat = np.arcsin(np.clip(np.cos(c) * math.sin(lat0) + Y * np.sin(c) * math.cos(lat0) / rho_c, -1, 1))
    lon = lon0 + np.arctan2(X * np.sin(c), rho_c * np.cos(c) * math.cos(lat0) - Y * np.sin(c) * math.sin(lat0))
    lon = (np.degrees(lon) + 180) % 360 - 180
    mx = np.clip(((lon + 180) / 360 * MW).astype(int), 0, MW - 1)
    my = np.clip(((90 - np.degrees(lat)) / 180 * MH).astype(int), 0, MH - 1)
    land = np.where(disc, land_map[my, mx], 0)
    desert = np.where(disc, desert_map[my, mx], 0)
    ice = np.where(disc, ice_map[my, mx], 0)

    r = rng(300)
    disc_m = ellipse((D, D), (cx - R, cy - R, cx + R, cy + R))
    land_t = tear(land, r, 1.3) * (disc_m > 0.5)
    desert_t = tear(desert * land, r, 0.9) * land_t
    ice_t = tear(ice, r, 0.8) * (disc_m > 0.5)

    Z = np.sqrt(np.clip(1 - X * X - Y * Y, 0, 1))
    Lx, Ly, Lz = -0.55, 0.45, 0.70
    n = math.sqrt(Lx * Lx + Ly * Ly + Lz * Lz)
    lam = np.clip((X * Lx + Y * Ly + Z * Lz) / n, 0, 1)
    shade = np.clip(0.06 + 0.78 * (1 - lam) ** 1.8, 0, 0.9)

    L = Layered(D, D)
    L.paint(disc_m, hex2rgb('#3E6EA3'), shade)
    # raised-paper shadow under the land pieces
    sh = np.roll(np.roll(land_t, 8, 0), 6, 1)
    L.rgb *= (1 - 0.28 * (sh * (1 - land_t)))[..., None]
    L.paint(land_t, hex2rgb('#86A85A'), shade)
    L.paint(desert_t, hex2rgb('#D6B47A'), shade)
    L.paint(ice_t, hex2rgb('#F1EEE6'), shade * 0.8)
    # torn-paper cloud wisps, banded by latitude
    latd = np.degrees(lat)
    band = 0.35 * np.exp(-((latd - 6) / 9) ** 2) + 0.45 * np.exp(-((np.abs(latd) - 50) / 12) ** 2)
    cl = fbm(D, D, r, 120, 4) + band * 0.3
    clouds = (cl > 0.70).astype(np.float32) * (disc_m > 0.5)
    clouds = tear(clouds, r, 1.0) * disc_m
    L.paint(clouds * 0.95, hex2rgb('#F6F2E8'), shade * 0.7)
    L.alpha = disc_m
    L.save('earth')


def mountain():
    W, H = 380, 260
    sz = (W, H)
    r = rng(400)
    L = Layered(W, H)
    xs = np.arange(W, dtype=np.float32)
    grad = np.tile(np.clip(0.08 + 0.45 * xs / W, 0, 0.6), (H, 1))
    m = poly(sz, [(0, 260), (110, 70), (160, 125), (225, 8), (380, 260)])
    L.paint(tear(m, r, 1.2), hex2rgb('#8C7E69'), grad + 0.15 * fbm(H, W, r, 40, 3))
    L.paint(tear(poly(sz, [(225, 8), (262, 70), (244, 62), (230, 78), (212, 60), (196, 66)]), r, 1.0),
            CREAM, 0.12)
    L.save('mountain')


def cannon():
    W, H = 230, 160
    sz = (W, H)
    L = Layered(W, H)
    L.paint(poly(sz, [(40, 95), (150, 95), (170, 130), (30, 130)]), hex2rgb('#7A5332'), 0.3)
    L.paint(rrect(sz, (30, 46, 214, 88), 18), hex2rgb('#2B2B2B'), 0.25)
    L.paint(rrect(sz, (196, 40, 222, 94), 8), hex2rgb('#1E1E1E'), 0.3)
    L.paint(ellipse(sz, (12, 52, 44, 84)), hex2rgb('#2B2B2B'), 0.3)
    L.paint(ellipse(sz, (62, 92, 130, 158)), hex2rgb('#4A3020'), 0.35)
    L.paint(ellipse(sz, (86, 116, 106, 136)), hex2rgb('#A07850'), 0.1)
    L.save('cannon')


def jet():
    W, H = 560, 190
    sz = (W, H)
    L = Layered(W, H)
    yy = np.mgrid[0:H, 0:W][0].astype(np.float32)
    body_sh = np.clip((yy - 80) / 45, 0, 1) * 0.55 + 0.05
    L.paint(poly(sz, [(18, 30), (52, 30), (100, 86), (40, 92)]), NAVY, 0.3)            # tail fin
    L.paint(rrect(sz, (30, 80, 540, 120), 20), CREAM, body_sh)                         # fuselage
    L.paint(poly(sz, [(30, 84), (110, 80), (110, 118), (60, 112)]), CREAM, body_sh)   # tail cone
    L.paint(poly(sz, [(14, 96), (96, 98), (28, 110)]), NAVY, 0.3)                      # stabiliser
    L.paint(poly(sz, [(220, 108), (330, 110), (250, 178), (206, 178)]), hex2rgb('#D8D1C1'), 0.35)  # wing
    L.paint(rrect(sz, (228, 128, 306, 152), 11), GREY, 0.4)                             # engine
    for x in range(128, 470, 13):
        L.paint(ellipse(sz, (x, 91, x + 6, 98)), INK, 0.0)
    L.paint(poly(sz, [(496, 88), (516, 88), (526, 98), (500, 98)]), INK, 0.0)
    L.save('jet')


def stars():
    for i, (col, ro, ri) in enumerate([(YELLOW, 30, 13), (CREAM, 26, 11), (CREAM, 18, 8)]):
        S = 76
        pts = []
        for k in range(10):
            a = -math.pi / 2 + k * math.pi / 5
            rr = ro if k % 2 == 0 else ri
            pts.append((S / 2 + rr * math.cos(a), S / 2 + rr * math.sin(a)))
        L = Layered(S, S)
        L.paint(tear(poly((S, S), pts), rng(500 + i), 0.6), col)
        L.save(f'star_{i}', with_shade=False)
    S = 30
    L = Layered(S, S)
    L.paint(tear(ellipse((S, S), (6, 6, 24, 24)), rng(510), 0.5), CREAM)
    L.save('star_dot', with_shade=False)


def strips():
    for name, col, seed in [('strip_orange', ORANGE, 600), ('strip_cream', CREAM, 601),
                            ('strip_yellow', YELLOW, 602), ('strip_navy', NAVY, 603)]:
        W, H = 1000, 120
        L = Layered(W, H)
        m = poly((W, H), [(14, 18), (986, 12), (990, 106), (10, 110)])
        L.paint(tear(m, rng(seed), 1.4), col)
        L.save(name, with_shade=False)


# ---------------------------------------------------------------------------
# greyscale "photo" plates (darkness 0..1) for the archival halftone treatment
def save_plate(name, dark, alpha=None):
    Image.fromarray((np.clip(dark, 0, 1) * 255).astype(np.uint8), 'L').save(os.path.join(OUT, f'{name}.png'))
    if alpha is not None:
        Image.fromarray((np.clip(alpha, 0, 1) * 255).astype(np.uint8), 'L').save(
            os.path.join(OUT, f'{name}_alpha.png'))
    print('  wrote', name)


def billow(W, H, r, n, x_range, y_range, rad_range, light=(-0.6, -0.8)):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    mask = np.zeros((H, W), np.float32)
    dark = np.ones((H, W), np.float32)
    lx, ly = light
    for _ in range(n):
        cx, cy = r.uniform(*x_range), r.uniform(*y_range)
        rad = r.uniform(*rad_range)
        d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / rad
        inside = d < 1
        nz = np.sqrt(np.clip(1 - d * d, 0, 1))
        nx, ny = (xx - cx) / rad, (yy - cy) / rad
        lam = np.clip(-(nx * lx + ny * ly) * 0.8 + nz * 0.5, 0, 1)
        dd = 0.08 + 0.55 * (1 - lam)
        dark = np.where(inside, dd, dark)  # later puffs sit in front
        mask = np.maximum(mask, inside.astype(np.float32))
    return mask, dark


def plate_launch():
    W, H = 900, 740
    r = rng(700)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    dark = 0.30 - 0.12 * yy / H + 0.05 * (fbm(H, W, r, 200, 3) - 0.5)
    # launch tower (lattice) on the left
    tower = np.zeros((H, W), np.float32)
    im = Image.new('L', (W, H), 0)
    dr = ImageDraw.Draw(im)
    for x0 in (250, 300):
        dr.line([(x0, 90), (x0, 640)], fill=255, width=7)
    for y in range(100, 640, 36):
        dr.line([(250, y), (300, y + 36)], fill=255, width=4)
        dr.line([(300, y), (250, y + 36)], fill=255, width=4)
        dr.line([(250, y), (300, y)], fill=255, width=3)
    dr.line([(300, 260), (405, 260)], fill=255, width=8)
    dr.line([(300, 380), (405, 380)], fill=255, width=6)
    tower = np.asarray(im, np.float32) / 255
    dark = np.maximum(dark, tower * 0.88)
    # the rocket, just clearing the tower
    rk = poly((W, H), [(430, 260), (470, 260), (470, 470), (430, 470)]) + \
        poly((W, H), [(430, 262), (450, 180), (470, 262)])
    rk = np.clip(rk, 0, 1)
    shade_r = 0.25 + 0.5 * np.clip((xx - 430) / 40, 0, 1)
    dark = dark * (1 - rk) + shade_r * rk
    # bright exhaust jet
    jetm = poly((W, H), [(432, 470), (468, 470), (480, 520), (450, 640), (420, 520)])
    dark = dark * (1 - jetm)
    # billowing exhaust clouds
    m, d = billow(W, H, r, 46, (40, 860), (520, 700), (50, 120))
    d = d + 0.12 * (fbm(H, W, r, 30, 3) - 0.5)
    dark = dark * (1 - m) + d * m
    # glow near the flame
    glow = np.exp(-(((xx - 450) / 110) ** 2 + ((yy - 600) / 70) ** 2))
    dark = np.clip(dark - 0.5 * glow, 0, 1)
    save_plate('plate_launch', dark)


def plate_clouds():
    W, H = 1180, 620
    r = rng(710)
    m, d = billow(W, H, r, 70, (-40, 1220), (180, 640), (60, 150), light=(-0.4, -0.9))
    m2 = tear(m, r, 1.5)
    d = d * 0.7 + 0.15 * (fbm(H, W, r, 40, 3) - 0.5)
    save_plate('plate_clouds', d, m2)


# ---------------------------------------------------------------------------
# textures and overlays (used directly)
def tex(name, arr, mode='RGB'):
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode).save(os.path.join(OUT, f'tex_{name}.png'))
    print('  wrote tex_' + name)


def textures():
    W, H = 1080, 1920
    r = rng(800)
    surf = paper_surface(H, W, r, 1.25)
    big = 1 + 0.035 * (fbm(H, W, r, 500, 3) - 0.5)
    tex('warm', np.array(WARM, np.float32)[None, None, :] * (surf * big)[..., None])

    r = rng(801)
    mott = 1 + 0.10 * (fbm(H, W, r, 260, 4) - 0.5)
    fib = fibres(H, W, r, count=int(W * H / 500))
    navy = np.array(NAVY, np.float32)[None, None, :] * mott[..., None]
    navy += np.clip(fib, 0, 1)[..., None] * np.array([48, 52, 66], np.float32)
    navy -= np.clip(-fib, 0, 1)[..., None] * 10
    navy += ((r.random((H, W)) - 0.5) * 6)[..., None]
    tex('navy', navy)

    # vignette (black with alpha)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2)
    a = np.clip((d - 0.55) / 0.65, 0, 1) ** 1.5 * 0.55
    tex('vignette', np.dstack([np.zeros((H, W, 3)), a * 255]), 'RGBA')

    # 4 grain frames (swapped on twos)
    for i in range(4):
        rg = rng(820 + i)
        n = rg.normal(0, 1, (H // 2, W // 2)).astype(np.float32)
        n = np.asarray(Image.fromarray(n, 'F').resize((W, H), Image.BILINEAR))
        a = np.clip(np.abs(n) * 0.05, 0, 0.16)
        col = np.where(n[..., None] > 0, 255.0, 0.0) * np.ones((1, 1, 3))
        tex(f'grain_{i}', np.dstack([col, a * 255]), 'RGBA')

    # tileable fibre overlay for paper strips (light + dark fibres on transparent)
    T = 512
    rt = rng(830)
    f = fibres(T, T, rt, count=520)
    f = np.roll(f, 0)  # (not perfectly tileable; used at low opacity)
    a = np.clip(np.abs(f) * 0.9, 0, 0.5)
    col = np.where(f[..., None] > 0, 255.0, 60.0) * np.ones((1, 1, 3))
    tex('fibre', np.dstack([col, a * 255]), 'RGBA')

    # rubber-stamp grunge mask (white = ink kept)
    SW, SH = 1000, 360
    rs = rng(840)
    g = fbm(SH, SW, rs, 24, 4)
    keep = (g > 0.24).astype(np.float32)
    holes = rs.random((SH, SW)) < 0.02
    keep[holes] = 0
    keep = np.clip(soften(keep, 0.7) * 1.3, 0, 1)
    tex('stamp', np.dstack([np.full((SH, SW, 3), 255.0), keep * 255]), 'RGBA')

    # sliding sheets with a torn leading (left) edge
    for name, base_name, seed in [('sheet_warm', 'warm', 850), ('sheet_navy', 'navy', 851)]:
        base = np.asarray(Image.open(os.path.join(OUT, f'tex_{base_name}.png')).convert('RGB'), np.float32)
        SWd = W + 120
        sheet = np.zeros((H, SWd, 3), np.float32)
        sheet[:, 120:, :] = base
        sheet[:, :120, :] = base[:, :120, :]
        m = np.zeros((H, SWd), np.float32)
        m[:, 60:] = 1
        rs = rng(seed)
        m = tear(m, rs, 2.2)
        # white torn fibre edge
        edge = np.clip(soften((m > 0.5).astype(np.float32), 3) - m, 0, 1)
        sheet = sheet * (1 - edge[..., None]) + np.array([250, 246, 236])[None, None, :] * edge[..., None]
        m = np.maximum(m, (soften((m > 0.5).astype(np.float32), 3) > 0.15).astype(np.float32))
        tex(name, np.dstack([sheet, m * 255]), 'RGBA')


def main():
    which = set(sys.argv[1:])
    jobs = {
        'rocket': lambda: (rocket_lower(), rocket_upper(), nozzle_small()),
        'cutaway': rocket_cutaway,
        'balloon': balloon,
        'flames': lambda: [flame(i) for i in range(4)],
        'smoke': lambda: [smoke(i) for i in range(4)],
        'earth': earth,
        'mountain': mountain,
        'cannon': cannon,
        'jet': jet,
        'stars': stars,
        'strips': strips,
        'plates': lambda: (plate_launch(), plate_clouds()),
        'textures': textures,
    }
    for k, fn in jobs.items():
        if not which or k in which:
            print(k)
            fn()


if __name__ == '__main__':
    main()
