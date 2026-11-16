"""Low-poly street at blue hour, path traced with Blender Cycles.

The geometry stays flat-shaded boxes, prisms and cones, but light is simulated (soft shadows,
bounced light, reflections on a wet road, depth of field, motion blur).

  python blender/street.py --out out/street/frames --frames 90 --hold 60 --scale 75 --samples 24
  python blender/street.py --out test.png --frame 60 --scale 50 --samples 32

`build()` is also used by fivekeys.py, which renders stills of this street from other angles.
Needs the `bpy` package (pip install bpy). No GPU required.
"""
import argparse
import json
import math
import os
import random
import time

from lib import Geo, M, camera, figure, get_mat, light, principled, render, reset, sack, setup_render, srgb

import bpy
from mathutils import Matrix, Vector, noise

rng = random.Random(11)
HALF = 4.65  # facade line, metres from the street centre
ROAD = 2.75  # kerb line
WATER = 0.034  # height of the standing water
DAY = False  # set by build(): lamps and windows off

DAY_SWAP = {"bulb": "bulb_off", "win_warm": "glass_dark", "win_amber": "glass_dark", "win_pale": "glass_dark",
            "shade": "shade_day", "slit": "iron", "far_win": "far"}


def E(m):
    """Material for something that glows at night."""
    return DAY_SWAP.get(m, m) if DAY else m


def L(*a, **k):
    """A lamp's light: nothing by day."""
    return None if DAY else light(*a, **k)


# ----------------------------------------------------------------- buildings
def wall(g, m, x0, x1, z0, z1, openings, T=0.35):
    """Fill a rectangle of facade with boxes, leaving real holes for the openings."""
    x = x0
    for a, b, c, d in sorted(openings):
        if a > x + 1e-4:
            g.box(m, (a - x, T, z1 - z0), ((x + a) / 2, T / 2, (z0 + z1) / 2))
        if c > z0 + 1e-4:
            g.box(m, (b - a, T, c - z0), ((a + b) / 2, T / 2, (z0 + c) / 2))
        if d < z1 - 1e-4:
            g.box(m, (b - a, T, z1 - d), ((a + b) / 2, T / 2, (d + z1) / 2))
        x = b
    if x1 > x + 1e-4:
        g.box(m, (x1 - x, T, z1 - z0), ((x + x1) / 2, T / 2, (z0 + z1) / 2))


def window(g, x, z, w, h, frame, lit):
    g.box("stone", (w + 0.24, 0.24, 0.09), (x, -0.04, z - 0.045))  # sill
    g.box("stone", (w + 0.3, 0.1, 0.24), (x, 0.0, z + h + 0.12))  # lintel
    for sx in (-1, 1):
        g.box(frame, (0.07, 0.07, h), (x + sx * (w / 2 - 0.035), 0.12, z + h / 2))
    g.box(frame, (w, 0.07, 0.07), (x, 0.12, z + 0.035))
    g.box(frame, (w, 0.07, 0.07), (x, 0.12, z + h - 0.035))
    g.box(frame, (w - 0.14, 0.05, 0.05), (x, 0.12, z + h * 0.5))  # sash meeting rail
    if lit:
        g.box(E(lit), (w - 0.14, 0.02, h - 0.14), (x, 0.17, z + h / 2))
        k = rng.choice([0.0, 0.3, 0.45, 0.6, 1.0])  # how far the blind is pulled down
        if k:
            g.box(E("shade"), (w - 0.14, 0.015, (h - 0.14) * k), (x, 0.15, z + h - 0.07 - (h - 0.14) * k / 2))
    else:
        g.box("glass_dark", (w - 0.14, 0.02, h - 0.14), (x, 0.16, z + h / 2))


def fire_escape(g, xa, xb, floors, gh, fh):
    """Iron balconies with railings and stairs between them. One of these is ~150 small boxes."""
    D = 0.95
    for f in range(1, floors):
        z = gh + (f - 1) * fh + 0.7
        g.box("iron", (xb - xa, D, 0.04), ((xa + xb) / 2, -D / 2, z))
        for y in (-D, 0):
            g.box("iron", (xb - xa, 0.05, 0.08), ((xa + xb) / 2, y, z - 0.03))
        g.box("iron", (xb - xa, 0.035, 0.035), ((xa + xb) / 2, -D, z + 0.95))  # top rail
        g.box("iron", (xb - xa, 0.025, 0.025), ((xa + xb) / 2, -D, z + 0.5))
        for sx in (xa, xb):
            g.box("iron", (0.035, D, 0.035), (sx, -D / 2, z + 0.95))
            g.box("iron", (0.035, 0.035, 0.95), (sx, -D, z + 0.48))
            g.box("iron", (0.03, 0.9, 0.03), (sx, -D / 2 + 0.1, z - 0.42), rot=(math.radians(-42), 0, 0))  # bracket
        n = int((xb - xa) / 0.2)
        for i in range(1, n):
            g.box("iron", (0.016, 0.016, 0.93), (xa + (xb - xa) * i / n, -D, z + 0.48))
        if f < floors - 1:  # stair up to the next balcony
            run, rise = (xb - xa) - 0.9, fh
            ang = math.atan2(rise, run)
            length = math.hypot(run, rise)
            cx, cz = (xa + xb) / 2, z + rise / 2
            sgn = 1 if f % 2 else -1
            for y in (-0.25, -0.75):
                g.box("iron", (length, 0.03, 0.09), (cx, y, cz), rot=(0, -sgn * ang, 0))
            for i in range(1, 11):
                t = i / 11 - 0.5
                g.box("iron", (0.2, 0.5, 0.025), (cx + sgn * t * run, -0.5, cz + t * rise))
    z = gh + 0.7  # drop ladder
    for y in (-0.72, -0.4):
        g.box("iron", (0.03, 0.03, 1.9), (xa + 0.35, y - 0.2 + 0.2, z - 0.95))
    for i in range(6):
        g.box("iron", (0.025, 0.32, 0.025), (xa + 0.35, -0.56, z - 0.2 - i * 0.3))


def roof_things(g, L, H, depth, tank=True):
    for _ in range(rng.randint(1, 3)):
        cx, cy = rng.uniform(1, L - 1), rng.uniform(1.5, depth - 1.5)
        g.box("brick_dark", (0.7, 0.7, 1.7), (cx, cy, H + 0.85))
        g.box("stone", (0.85, 0.85, 0.12), (cx, cy, H + 1.72))
        for dx in (-0.16, 0.16):
            g.cyl("brick_brown", 0.09, 0.07, 0.35, 6, (cx + dx, cy, H + 1.95))
    if tank:
        cx, cy = rng.uniform(2.5, L - 2.5), rng.uniform(2.5, 4.5)
        for dx in (-0.9, 0.9):
            for dy in (-0.9, 0.9):
                g.box("iron", (0.1, 0.1, 2.2), (cx + dx, cy + dy, H + 1.1))
        g.box("wood_dark", (2.3, 2.3, 0.12), (cx, cy, H + 2.2))
        g.cyl("wood", 1.2, 1.25, 2.3, 10, (cx, cy, H + 3.4))
        for dz in (2.7, 3.4, 4.1):
            g.cyl("iron", 1.27, 1.27, 0.05, 10, (cx, cy, H + dz))
        g.cyl("wood_dark", 1.35, 0.05, 0.7, 10, (cx, cy, H + 4.9))


def building(g, origin, side, L, floors, wallm, ground=(), frame="frame_cream", lit_p=0.3, escape=None,
             gh=3.7, fh=3.3, depth=9.0, plain=False, groundm=None):
    """One building. Local frame: x runs along the facade, -y points out into the street.
    side -1 puts it on the left of the street, +1 on the right, 0 faces the camera."""
    rot = {-1: math.pi / 2, 1: -math.pi / 2, 0: 0.0}[side]
    g.T = Matrix.Translation(Vector(origin)) @ Matrix.Rotation(rot, 4, "Z")
    H = gh + (floors - 1) * fh
    T = 0.35
    if plain:  # never seen: only there to block the sky and bounce light
        g.box(wallm, (L, depth, H), (L / 2, depth / 2, H / 2))
        g.T = Matrix.Identity(4)
        return H
    groundm = groundm or wallm
    # upper floors: wall with window holes, and a solid core just behind it
    g.box(wallm, (L, depth - T, H - gh), (L / 2, T + (depth - T) / 2, gh + (H - gh) / 2))
    n = max(2, round((L - 1.2) / 2.3))
    cols = [0.6 + (L - 1.2) * (i + 0.5) / n for i in range(n)]
    ww, wh = 1.08, 1.85
    for f in range(1, floors):
        zb = gh + (f - 1) * fh
        wall(g, wallm, 0, L, zb, zb + fh, [(x - ww / 2, x + ww / 2, zb + 0.85, zb + 0.85 + wh) for x in cols])
        for x in cols:
            lit = rng.choice(["win_warm", "win_amber", "win_pale"]) if rng.random() < lit_p else None
            window(g, x, zb + 0.85, ww, wh, frame, lit)
    # ground floor
    ops, hollow = [], []
    for it in ground:
        x, w = it["x"], it["w"]
        k = it["kind"]
        z0, z1 = {"garage": (0, 3.3), "door": (0.0, 2.35), "stoop": (0.9, 3.2), "shop": (0.55, 2.75),
                  "shopdoor": (0, 2.5), "win": (1.5, 2.9)}[k]
        ops.append((x - w / 2, x + w / 2, z0, z1))
        if it.get("lit") and k in ("shop", "shopdoor"):
            hollow.append((x - w / 2, x + w / 2))
    wall(g, groundm, 0, L, 0, gh, ops)
    # core behind the ground floor, left hollow where a lit shop needs a real interior
    x = 0.0
    spans = sorted(hollow)
    merged = []
    for a, b in spans:
        if merged and a - merged[-1][1] < 0.8:
            merged[-1][1] = b
        else:
            merged.append([a - 0.3, b + 0.3])
    for a, b in merged:
        if a > x:
            g.box(groundm, (a - x, depth - T, gh), ((x + a) / 2, T + (depth - T) / 2, gh / 2))
        shop_interior(g, a, b, gh)
        x = b
    if L > x:
        g.box(groundm, (L - x, depth - T, gh), ((x + L) / 2, T + (depth - T) / 2, gh / 2))
    for it in ground:
        GROUND[it["kind"]](g, it, frame)
    # plinth, string course, corner piers, cornice, parapet
    doors = sorted((a, b) for a, b, c, d in ops if c < 0.6)
    x = 0.0
    for a, b in doors + [(L, L)]:
        if a - x > 0.05:
            g.box("stone", (a - x, 0.08, 0.6), ((x + a) / 2, -0.04, 0.3))
        x = b
    g.box("stone", (L + 0.1, 0.14, 0.22), (L / 2, -0.03, gh))
    for px in (0.22, L - 0.22):
        g.box(wallm, (0.44, 0.08, H - gh), (px, -0.04, gh + (H - gh) / 2))
    g.box("stone", (L + 0.2, 0.2, 0.16), (L / 2, -0.06, H - 0.55))
    g.box("stone", (L + 0.5, 0.55, 0.2), (L / 2, -0.2, H - 0.1))
    g.box("stone", (L + 0.36, 0.4, 0.14), (L / 2, -0.13, H - 0.27))
    for i in range(int(L / 0.55)):
        g.box("stone", (0.2, 0.2, 0.2), (0.3 + i * 0.55, -0.1, H - 0.42))
    g.box(wallm, (L, 0.3, 0.75), (L / 2, 0.15, H + 0.37))
    g.box("stone", (L + 0.1, 0.4, 0.08), (L / 2, 0.15, H + 0.78))
    g.box("iron", (L, depth, 0.1), (L / 2, depth / 2, H + 0.05))  # roof deck
    g.cyl("iron", 0.06, 0.06, H - 0.3, 6, (L - 0.5, -0.09, H / 2))  # drainpipe
    if escape:
        fire_escape(g, escape[0], escape[1], floors, gh, fh)
    roof_things(g, L, H, depth, tank=L > 13)
    g.T = Matrix.Identity(4)
    return H


def shop_interior(g, a, b, gh):
    """A real room behind a lit shopfront, so its light spills out the way it would."""
    D = 4.0
    g.box("wood", (b - a, D, 0.1), ((a + b) / 2, 0.35 + D / 2, 0.1))
    g.box("paint_cream", (b - a, 0.15, gh), ((a + b) / 2, 0.35 + D, gh / 2))
    for x in (a, b):
        g.box("paint_cream", (0.15, D, gh), (x, 0.35 + D / 2, gh / 2))
    g.box("paint_cream", (b - a, D, 0.12), ((a + b) / 2, 0.35 + D / 2, gh - 0.3))
    # counter, shelves and stock
    g.box("wood_dark", (b - a - 1.6, 0.6, 0.95), ((a + b) / 2, 2.6, 0.62))
    for sz in (1.0, 1.55, 2.1, 2.65):
        g.box("wood", (b - a - 0.5, 0.35, 0.05), ((a + b) / 2, 0.35 + D - 0.25, sz))
        x = a + 0.4
        while x < b - 0.5:
            w, h = rng.uniform(0.12, 0.3), rng.uniform(0.18, 0.42)
            g.box(rng.choice(["crate", "canvas_red", "canvas_green", "frame_cream", "galv", "hydrant"]),
                  (w, 0.22, h), (x + w / 2, 0.35 + D - 0.28, sz + 0.025 + h / 2))
            x += w + rng.uniform(0.03, 0.2)
    for lx in (a + (b - a) * 0.3, a + (b - a) * 0.7):
        g.cyl("iron", 0.012, 0.012, 0.7, 4, (lx, 1.9, gh - 0.7))
        g.cyl("lamp_shade", 0.3, 0.06, 0.16, 8, (lx, 1.9, gh - 1.1))
        g.ico(E("bulb"), 0.07, 1, (lx, 1.9, gh - 1.2))
        p = g.T @ Vector((lx, 1.9, gh - 1.32))
        L("POINT", p, 85, "#ffc98a", 0.07)


def g_garage(g, it, frame):
    x, w, gap = it["x"], it["w"], 0.32
    g.box("steel_door", (w, 0.06, 3.3 - gap), (x, 0.22, gap + (3.3 - gap) / 2))
    for i in range(11):
        g.box("steel_door", (w, 0.035, 0.05), (x, 0.185, gap + 0.14 + i * 0.27))
    g.box(E("slit"), (w - 0.1, 0.04, gap), (x, 0.6, gap / 2))  # light under the door
    g.box("iron", (w + 0.7, 0.16, 0.34), (x, -0.03, 3.3 + 0.17))  # steel lintel
    for sx in (-1, 1):
        g.cyl("iron", 0.11, 0.11, 0.95, 8, (x + sx * (w / 2 + 0.25), -0.35, 0.62))
        g.ico("iron", 0.11, 1, (x + sx * (w / 2 + 0.25), -0.35, 1.1))
    p = g.T @ Vector((x, -0.3, 0.12))
    L("AREA", p, 28, "#ffb561", size=w * 0.8, rot=(math.radians(100), 0, g.T.to_euler().z))


def g_door(g, it, frame):
    x, w = it["x"], it["w"]
    g.box("door_green", (w - 0.1, 0.06, 2.3), (x, 0.2, 1.15))
    g.box("frame_green", (w + 0.16, 0.12, 0.1), (x, 0.08, 2.4))
    for sx in (-1, 1):
        g.box("frame_green", (0.1, 0.12, 2.35), (x + sx * (w / 2 + 0.03), 0.08, 1.17))
    g.box(E("win_pale"), (0.3, 0.02, 0.4), (x, 0.165, 1.65))  # small wired-glass pane
    g.cyl("chrome", 0.03, 0.03, 0.07, 6, (x + w / 2 - 0.2, 0.14, 1.05), rot=(math.pi / 2, 0, 0))
    g.box("stone", (w + 0.5, 0.5, 0.16), (x, -0.25, 0.08))  # step
    # gooseneck lamp over the door
    g.cyl("iron", 0.02, 0.02, 0.55, 6, (x, -0.26, 3.12), rot=(math.pi / 2, 0, 0))
    g.cyl("iron", 0.02, 0.02, 0.22, 6, (x, -0.52, 3.02))
    g.cyl("lamp_shade", 0.24, 0.05, 0.14, 8, (x, -0.52, 2.86))
    g.ico(E("bulb"), 0.055, 1, (x, -0.52, 2.78))
    L("POINT", g.T @ Vector((x, -0.52, 2.68)), 70, "#ffc27a", 0.05)


def g_win(g, it, frame):
    x, w = it["x"], it["w"]
    g.box("stone", (w + 0.2, 0.22, 0.09), (x, -0.03, 1.455))
    g.box(E("win_amber") if it.get("lit") else "glass_dark", (w, 0.02, 1.4), (x, 0.2, 2.2))
    for i in range(int(w / 0.16)):
        g.cyl("iron", 0.014, 0.014, 1.4, 5, (x - w / 2 + 0.08 + i * 0.16, 0.08, 2.2))
    for dz in (1.75, 2.65):
        g.box("iron", (w, 0.03, 0.03), (x, 0.08, dz))


def g_stoop(g, it, frame):
    x, w = it["x"], it["w"]
    col = it.get("door", "door_red")
    g.box(col, (w - 0.1, 0.06, 2.0), (x, 0.2, 1.9))
    g.box(E("win_warm") if it.get("lit") else "glass_dark", (w - 0.16, 0.02, 0.26), (x, 0.2, 3.04))  # transom
    g.box(frame, (w + 0.2, 0.14, 0.12), (x, 0.06, 3.24))
    for sx in (-1, 1):
        g.box(frame, (0.12, 0.14, 2.3), (x + sx * (w / 2 + 0.04), 0.06, 2.05))
    g.cyl("chrome", 0.035, 0.035, 0.06, 6, (x + w / 2 - 0.2, 0.14, 1.9), rot=(math.pi / 2, 0, 0))
    for i in range(5):  # steps down to the pavement
        g.box("stone", (w + 0.5, 0.3, 0.18), (x, -0.15 - i * 0.28, 0.81 - i * 0.18))
    g.box("stone", (w + 0.5, 0.34, 0.9), (x, 0.0, 0.45))
    for sx in (-1, 1):
        rx = x + sx * (w / 2 + 0.2)
        g.box("iron", (0.03, 1.55, 0.03), (rx, -0.7, 1.35), rot=(math.radians(33), 0, 0))
        for i in range(5):
            g.box("iron", (0.02, 0.02, 0.8), (rx, -0.1 - i * 0.3, 1.33 - i * 0.19))
        g.cyl("iron", 0.04, 0.04, 0.95, 6, (rx, -1.38, 0.48))
        g.ico("iron", 0.06, 1, (rx, -1.38, 1.0))


def g_shop(g, it, frame):
    x, w, lit = it["x"], it["w"], it.get("lit")
    z0, z1 = 0.55, 2.75
    for sx in (-1, 0, 1):
        g.box(frame, (0.07, 0.1, z1 - z0), (x + sx * (w / 2 - 0.035), 0.1, (z0 + z1) / 2))
    g.box(frame, (w, 0.1, 0.07), (x, 0.1, z0 + 0.035))
    g.box(frame, (w, 0.1, 0.07), (x, 0.1, z1 - 0.035))
    g.box(frame, (w, 0.06, 0.05), (x, 0.1, z1 - 0.55))
    g.box("stone", (w + 0.2, 0.2, 0.08), (x, -0.02, z0 - 0.04))
    if not lit:
        g.box("glass_dark", (w - 0.1, 0.02, z1 - z0 - 0.1), (x, 0.16, (z0 + z1) / 2))
    else:  # goods in the window
        g.box("wood", (w - 0.1, 0.7, 0.06), (x, 0.7, z0 + 0.03))
        xx = x - w / 2 + 0.3
        while xx < x + w / 2 - 0.4:
            s = rng.uniform(0.18, 0.4)
            g.box(rng.choice(["crate", "canvas_red", "galv", "frame_cream", "canvas_green"]),
                  (s, s, s * rng.uniform(0.8, 1.6)), (xx + s / 2, 0.7, z0 + 0.06 + s * 0.6), rot=(0, 0, rng.uniform(-0.4, 0.4)))
            xx += s + rng.uniform(0.1, 0.4)
    # blank sign board and awning
    g.box("wood_dark", (w + 0.5, 0.08, 0.5), (x, -0.04, 3.2))
    g.box(frame, (w + 0.6, 0.1, 0.05), (x, -0.05, 3.47))
    aw = it.get("awning")
    if aw:
        g.box(aw, (w + 0.5, 1.45, 0.04), (x, -0.68, 2.72), rot=(math.radians(-20), 0, 0))
        g.box(aw, (w + 0.5, 0.03, 0.22), (x, -1.36, 2.38))
        for sx in (-1, 1):
            g.box("iron", (0.025, 1.4, 0.025), (x + sx * (w / 2 + 0.2), -0.68, 2.5))


def g_shopdoor(g, it, frame):
    x, w = it["x"], it["w"]
    g.box(frame, (w + 0.14, 0.12, 0.1), (x, 0.1, 2.55))
    for sx in (-1, 1):
        g.box(frame, (0.09, 0.12, 2.5), (x + sx * (w / 2), 0.1, 1.25))
    if it.get("lit"):  # door standing open into the shop
        g.box("door_green", (0.05, w - 0.1, 2.3), (x - w / 2 + 0.06, 0.6, 1.3))
    else:
        g.box("door_green", (w - 0.1, 0.05, 2.3), (x, 0.3, 1.3))
        g.box("glass_dark", (w - 0.4, 0.02, 1.1), (x, 0.27, 1.7))
    g.box("stone", (w + 0.3, 0.4, 0.15), (x, -0.05, 0.075))


GROUND = {"garage": g_garage, "door": g_door, "win": g_win, "stoop": g_stoop, "shop": g_shop, "shopdoor": g_shopdoor}


# ------------------------------------------------------------- street pieces
def ground(g):
    """Wet granite setts. Every stone is its own block, a little tilted and a little high or low.
    One flat sheet of water lies over the lot, so it fills the joints and floods the gutters."""
    def top(x, y):
        return 0.05 * (1 - (x / ROAD) ** 2) + 0.042 * noise.noise(Vector((x * 0.3, y * 0.2, 0.0)))

    SW, SD, Y0, Y1 = 0.36, 0.21, -3.0, 46.0
    row = 0
    y = Y0
    while y < Y1:
        x = -ROAD + (0.0 if row % 2 else -SW / 2)
        while x < ROAD - 0.02:
            a, b = max(x, -ROAD), min(x + SW, ROAD)
            if b - a > 0.08:
                cx = (a + b) / 2
                z = top(cx, y) + rng.uniform(-0.006, 0.006)
                g.box(rng.choice(["sett_a", "sett_a", "sett_b", "sett_c"]), (b - a - 0.024, SD - 0.024, 0.14),
                      (cx, y + SD / 2, z - 0.07), rot=(rng.uniform(-0.03, 0.03), rng.uniform(-0.03, 0.03), rng.uniform(-0.02, 0.02)))
            x += SW
        y += SD
        row += 1
    g.box("road", (2 * ROAD - 1.3, 60, 0.1), (0, Y1 + 30, 0.0))  # plain crown beyond the setts
    g.box("road", (2 * ROAD - 1.3, 30, 0.1), (0, Y0 - 15, 0.0))
    g.box("puddle", (2 * ROAD, 140, 0.02), (0, 40, WATER - 0.01))
    g.box("joint", (120, 150, 0.2), (0, 50, -0.13))  # everything else underfoot
    for sx in (-1, 1):
        y = -30.0
        while y < 70:
            g.box("kerb", (0.28, 1.76, 0.2), (sx * (ROAD + 0.14), y + 0.9, 0.09 + rng.uniform(-0.004, 0.004)))
            for k in range(2):
                for yy in (y, y + 0.9):
                    g.box(rng.choice(["slab_a", "slab_b", "slab_c"]), (0.79, 0.87, 0.16),
                          (sx * (ROAD + 0.28 + 0.4 + k * 0.82), yy + 0.45, 0.1 + rng.uniform(-0.006, 0.006)),
                          rot=(rng.uniform(-0.006, 0.006), rng.uniform(-0.006, 0.006), 0))
            y += 1.8
    g.cyl("iron", 0.46, 0.46, 0.2, 12, (0.1, 9.2, -0.02))  # manhole
    g.cyl("iron", 0.42, 0.42, 0.03, 12, (-0.6, 27.0, 0.06))


def street_lamp(g, x, y, side, power=260):
    g.cyl("iron", 0.17, 0.11, 0.7, 8, (x, y, 0.53))
    g.cyl("iron", 0.075, 0.05, 4.4, 8, (x, y, 3.05))
    g.box("iron", (1.05, 0.05, 0.05), (x + side * 0.5, y, 5.2))
    g.box("iron", (0.8, 0.035, 0.035), (x + side * 0.33, y, 4.9), rot=(0, side * math.radians(38), 0))
    hx = x + side * 1.0
    g.cyl("iron", 0.03, 0.03, 0.2, 6, (hx, y, 5.08))
    g.cyl("lamp_shade", 0.36, 0.07, 0.17, 8, (hx, y, 4.9))
    g.ico(E("bulb"), 0.085, 1, (hx, y, 4.8))
    L("POINT", (hx, y, 4.68), power, "#ffc98a", 0.085)


def props(g):
    # hydrant
    hx, hy = -3.05, 9.3
    g.cyl("hydrant", 0.14, 0.12, 0.55, 8, (hx, hy, 0.46))
    g.cyl("hydrant", 0.17, 0.17, 0.06, 8, (hx, hy, 0.22))
    g.ico("hydrant", 0.13, 1, (hx, hy, 0.76), scale=(1, 1, 0.8))
    for r in (0, math.pi / 2, math.pi):
        g.cyl("hydrant", 0.055, 0.055, 0.14, 6, (hx + math.cos(r) * 0.15, hy - math.sin(r) * 0.15, 0.55), rot=(math.pi / 2, 0, r + math.pi / 2))
    # dustbins by the depot wall
    for i, (bx, by, tilt) in enumerate([(-4.25, 10.4, 0), (-4.2, 11.05, 0.05), (4.2, 15.2, 0)]):
        g.cyl("galv", 0.27, 0.24, 0.8, 10, (bx, by, 0.58), rot=(tilt, 0, 0))
        g.cyl("galv", 0.3, 0.3, 0.05, 10, (bx, by, 1.0), rot=(tilt + (0.25 if i == 1 else 0), 0, 0))
        g.cyl("galv", 0.06, 0.06, 0.05, 6, (bx, by, 1.05))
    # crates stacked near the garage
    for cx, cy, cz, s, r in [(-4.15, 17.3, 0.5, 0.62, 0.1), (-4.2, 18.0, 0.46, 0.55, -0.2), (-4.15, 17.45, 1.05, 0.5, 0.35)]:
        g.box("crate", (s, s, s), (cx, cy, cz - 0.02), rot=(0, 0, r))
        for k in (-1, 1):
            g.box("wood_dark", (s + 0.03, 0.05, 0.05), (cx, cy + k * s * 0.3, cz + s / 2 - 0.02), rot=(0, 0, r))
    # utility pole and wires along the right side
    for py in (22.0, 50.0):
        g.cyl("wood_dark", 0.13, 0.1, 9.5, 8, (3.2, py, 4.9))
        g.box("wood_dark", (1.7, 0.1, 0.12), (3.2, py, 8.8))
        g.box("wood_dark", (1.2, 0.1, 0.1), (3.2, py, 8.1))
        for dx in (-0.7, -0.3, 0.3, 0.7):
            g.cyl("glass_dark", 0.04, 0.03, 0.1, 6, (3.2 + dx, py, 8.92))
        g.cyl("galv", 0.22, 0.22, 0.55, 8, (3.45, py - 0.1, 7.3))
    for dx in (-0.7, -0.3, 0.3, 0.7):  # sagging wires, six straight pieces each
        for a, b in [(-6.0, 22.0), (22.0, 50.0), (50.0, 78.0)]:
            pts = [Vector((3.2 + dx, a + (b - a) * i / 6, 8.95 - 0.55 * math.sin(math.pi * i / 6))) for i in range(7)]
            for p, q in zip(pts, pts[1:]):
                d = q - p
                g.cyl("black", 0.012, 0.012, d.length, 4, (p + q) / 2, rot=(math.atan2(d.z, d.y) + math.pi / 2, 0, 0))


def backdrop(g):
    """Skyline beyond the cross street, a church steeple, and a few low-poly clouds."""
    for _ in range(26):
        x, y = rng.uniform(-70, 70), rng.uniform(96, 170)
        w, h = rng.uniform(8, 16), rng.uniform(14, 42)
        g.box("far", (w, 10, h), (x, y, h / 2))
        for _ in range(int(h * w / 22)):
            g.box(E("far_win"), (0.7, 0.05, 1.0), (x + rng.uniform(-w / 2 + 0.6, w / 2 - 0.6), y - 5.05, rng.uniform(3, h - 1.5)))
    sx, sy = -9.5, 118.0  # steeple
    g.box("far", (7, 7, 26), (sx, sy, 13))
    g.box("far", (5.2, 5.2, 7), (sx, sy, 29.5))
    g.cyl("far", 2.6, 2.3, 5, 8, (sx, sy, 35.5))
    g.cyl("far", 2.5, 0.05, 15, 8, (sx, sy, 45.5))
    g.box(E("far_win"), (0.9, 0.05, 2.2), (sx, sy - 2.62, 29.5))
    M("cloud", "#3c4670", rough=1.0)
    cm = get_mat("cloud").node_tree
    p = next(n for n in cm.nodes if n.bl_idname == "ShaderNodeBsdfPrincipled")
    geo, sep, ramp = cm.nodes.new("ShaderNodeNewGeometry"), cm.nodes.new("ShaderNodeSeparateXYZ"), cm.nodes.new("ShaderNodeValToRGB")
    mr = cm.nodes.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value, mr.inputs["From Max"].default_value = -1.0, 1.0
    ramp.color_ramp.elements[0].color = srgb("#e8926f")  # undersides still catch the sunset
    ramp.color_ramp.elements[1].color = srgb("#39456f")
    ramp.color_ramp.elements[0].position, ramp.color_ramp.elements[1].position = 0.2, 0.7
    cm.links.new(geo.outputs["Normal"], sep.inputs[0])
    cm.links.new(sep.outputs["Z"], mr.inputs["Value"])
    cm.links.new(mr.outputs[0], ramp.inputs[0])
    cm.links.new(ramp.outputs["Color"], p.inputs["Emission Color"])
    p.inputs["Emission Strength"].default_value = 0.3
    p.inputs["Base Color"].default_value = (0.02, 0.02, 0.03, 1)
    for _ in range(9):
        cx, cy, cz = rng.uniform(-70, 60), rng.uniform(230, 420), rng.uniform(45, 150)
        for _ in range(rng.randint(4, 7)):
            g.ico("cloud", rng.uniform(5, 10), 2, (cx + rng.uniform(-22, 22), cy + rng.uniform(-6, 6), cz + rng.uniform(-2, 2)),
                  scale=(1.8, 1.0, 0.42), rot=(0, 0, rng.uniform(-0.3, 0.3)))


# ------------------------------------------------------------------ vehicles
def wheel(parent, loc, r=0.42, w=0.25, dual=False):
    g = Geo("wheel")
    for off in ((-0.15, 0.15) if dual else (0.0,)):
        g.cyl("rubber", r, r, w, 12, (0, off, 0), rot=(math.pi / 2, 0, 0))
        g.cyl("hub", r * 0.52, r * 0.52, w + 0.02, 8, (0, off, 0), rot=(math.pi / 2, 0, 0))
        for k in range(4):  # lug detail, so the spin reads
            a = k * math.pi / 2
            g.box("iron", (0.05, w + 0.04, 0.05), (math.cos(a) * r * 0.3, off, math.sin(a) * r * 0.3))
    hub = bpy.data.objects.new("wheel", None)
    hub.location, hub.parent = loc, parent
    bpy.context.scene.collection.objects.link(hub)
    g.finish(hub)
    return hub


SPOTS = []


def truck(lights=True, sacks=0):
    """1949-style stake truck. Built facing +X, then turned to drive towards the camera."""
    root = bpy.data.objects.new("truck", None)
    bpy.context.scene.collection.objects.link(root)
    root.rotation_euler = (0, 0, -math.pi / 2)
    g = Geo("truck")
    P = "truck_green"
    g.box("iron", (5.3, 0.9, 0.18), (0, 0, 0.62))  # chassis
    g.box("chrome", (0.1, 1.95, 0.15), (2.86, 0, 0.56))  # bumper
    g.prism(P, [(1.15, 0.78), (1.15, 1.5), (2.2, 1.44), (2.62, 1.3), (2.68, 0.78)], 1.06)  # bonnet
    g.box("black", (0.05, 0.86, 0.46), (2.69, 0, 1.03))  # grille
    for i in range(5):
        g.box("chrome", (0.03, 0.9, 0.03), (2.72, 0, 0.84 + i * 0.095))
    for sy in (-1, 1):
        # front wing: three flat plates forming an arch over the wheel
        g.box(P, (0.75, 0.46, 0.07), (1.95, sy * 0.78, 1.0))
        g.box(P, (0.5, 0.46, 0.07), (2.47, sy * 0.78, 0.86), rot=(0, math.radians(38), 0))
        g.box(P, (0.55, 0.46, 0.07), (1.42, sy * 0.78, 0.84), rot=(0, math.radians(-40), 0))
        g.cyl(P, 0.14, 0.11, 0.22, 10, (2.52, sy * 0.72, 1.12), rot=(0, math.pi / 2, 0))  # headlamp shell
        g.cyl("headlamp" if lights else "headlamp_off", 0.105, 0.105, 0.02, 10, (2.64, sy * 0.72, 1.12), rot=(0, math.pi / 2, 0))
        g.cyl("chrome", 0.125, 0.125, 0.02, 10, (2.63, sy * 0.72, 1.12), rot=(0, math.pi / 2, 0))
        g.box("black", (1.25, 0.24, 0.05), (0.6, sy * 0.98, 0.5))  # running board
        g.box("glass_dark", (0.5, 0.02, 0.36), (0.72, sy * 0.935, 1.74))  # side window
        g.box("tail" if lights else "tail_off", (0.03, 0.1, 0.1), (-2.87, sy * 0.8, 0.86))
    g.box(P, (1.3, 1.86, 0.78), (0.5, 0, 1.14))  # cab, lower
    g.prism(P, [(-0.1, 1.52), (-0.1, 2.08), (0.86, 2.08), (1.1, 1.52)], 1.84)  # cab, upper
    g.box(P, (1.06, 1.9, 0.06), (0.36, 0, 2.1))  # roof lip
    g.box("glass_dark", (0.03, 0.74, 0.4), (0.99, 0.4, 1.8), rot=(0, math.radians(-23), 0))  # split windscreen
    g.box("glass_dark", (0.03, 0.74, 0.4), (0.99, -0.4, 1.8), rot=(0, math.radians(-23), 0))
    # flatbed with stakes and slats
    g.box("truck_wood", (3.35, 2.02, 0.12), (-1.2, 0, 0.98))
    g.box("iron", (3.35, 0.1, 0.14), (-1.2, 0.5, 0.86))
    g.box("iron", (3.35, 0.1, 0.14), (-1.2, -0.5, 0.86))
    for sy in (-0.98, 0.98):
        for i in range(5):
            g.box("truck_wood", (0.07, 0.06, 0.95), (-2.8 + i * 0.8, sy, 1.5))
        for z in (1.28, 1.56, 1.84):
            g.box("truck_wood", (3.3, 0.03, 0.15), (-1.2, sy * 1.02, z))
    for z in (1.28, 1.56, 1.84):
        g.box("truck_wood", (0.03, 1.98, 0.15), (-2.86, 0, z))
        g.box("truck_wood", (0.03, 1.98, 0.15), (0.42, 0, z))
    for i in range(sacks):  # money bags on the bed
        sack(g, (-2.45 + (i // 2) * 0.72, 0.42 if i % 2 else -0.42, 1.04), 0.95, rot=i * 1.3)
    g.finish(root)
    wheels = [wheel(root, (1.95, sy * 0.86, 0.42)) for sy in (-1, 1)] + [wheel(root, (-1.75, sy * 0.78, 0.42), dual=True) for sy in (-1, 1)]
    for sy in ((-0.72, 0.72) if lights else ()):  # headlamps that actually light the road
        sp = light("SPOT", (2.7, sy, 1.12), 700, "#fff0cc", 0.06, rot=(0, math.radians(-82), 0), spot=70)
        sp.parent = root
        SPOTS.append(sp)
    return root, wheels


def sedan(g, loc, facing, m="sedan", tail="tail_off"):
    """A parked 1940s fastback: one profile for the body, one for the cabin."""
    g.T = Matrix.Translation(Vector(loc)) @ Matrix.Rotation(facing, 4, "Z")
    g.prism(m, [(-2.35, 0.42), (-2.4, 0.8), (-2.15, 0.98), (-0.9, 1.04), (0.75, 1.04), (1.6, 0.98), (2.3, 0.86), (2.4, 0.66), (2.35, 0.42)], 1.72)
    g.prism(m, [(-1.95, 1.0), (-1.2, 1.44), (-0.5, 1.56), (0.2, 1.56), (0.78, 1.02)], 1.5)
    g.prism("glass_dark", [(-1.2, 1.1), (-1.0, 1.4), (-0.48, 1.49), (0.16, 1.49), (0.52, 1.1)], 1.52)
    g.box("glass_dark", (0.03, 1.2, 0.42), (0.52, 0, 1.3), rot=(0, math.radians(-47), 0))
    g.box("glass_dark", (0.03, 1.0, 0.3), (-1.48, 0, 1.3), rot=(0, math.radians(60), 0))
    for sx in (-1.5, 1.45):
        for sy in (-1, 1):
            g.box(m, (1.0, 0.2, 0.3), (sx, sy * 0.84, 0.82))
            g.cyl("rubber", 0.36, 0.36, 0.2, 12, (sx, sy * 0.8, 0.36), rot=(math.pi / 2, 0, 0))
            g.cyl("chrome", 0.17, 0.15, 0.22, 10, (sx, sy * 0.8, 0.36), rot=(math.pi / 2, 0, 0))
    g.box("chrome", (0.1, 1.8, 0.13), (-2.46, 0, 0.5))
    g.box("chrome", (0.1, 1.8, 0.13), (2.46, 0, 0.5))
    for sy in (-0.62, 0.62):
        g.box(tail, (0.03, 0.12, 0.08), (-2.41, sy, 0.84))
    g.box("chrome", (0.02, 0.36, 0.2), (-2.42, 0, 0.72))  # blank plate
    g.T = Matrix.Identity(4)


# --------------------------------------------------------------------- world
def world_dusk():
    w = bpy.data.worlds.new("dusk")
    w.use_nodes = True
    nt = w.node_tree
    bg = next(n for n in nt.nodes if n.bl_idname == "ShaderNodeBackground")
    tc, sep = nt.nodes.new("ShaderNodeTexCoord"), nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Generated"], sep.inputs[0])

    def ramp(stops):
        mr, r = nt.nodes.new("ShaderNodeMapRange"), nt.nodes.new("ShaderNodeValToRGB")
        mr.inputs["From Min"].default_value, mr.inputs["From Max"].default_value = -0.1, 1.0
        nt.links.new(sep.outputs["Z"], mr.inputs["Value"])
        nt.links.new(mr.outputs[0], r.inputs[0])
        els = r.color_ramp.elements
        while len(els) < len(stops):
            els.new(0.5)
        for e, (pos, col) in zip(els, stops):
            e.position, e.color = (pos + 0.1) / 1.1, srgb(col)
        return r

    # towards the afterglow (down the street) and away from it
    west = ramp([(-0.1, "#1a1626"), (0.0, "#f2874a"), (0.06, "#eb9a78"), (0.16, "#8f86b5"), (0.4, "#2c4a86"), (1.0, "#0c1c44")])
    east = ramp([(-0.1, "#10121c"), (0.0, "#3d4d82"), (0.2, "#28407a"), (0.6, "#122652"), (1.0, "#0a183c")])
    mr, pw, mix = nt.nodes.new("ShaderNodeMapRange"), nt.nodes.new("ShaderNodeMath"), nt.nodes.new("ShaderNodeMix")
    mr.inputs["From Min"].default_value, mr.inputs["From Max"].default_value = -1.0, 1.0
    pw.operation = "POWER"
    pw.inputs[1].default_value = 2.5
    mix.data_type = "RGBA"
    nt.links.new(sep.outputs["Y"], mr.inputs["Value"])
    nt.links.new(mr.outputs[0], pw.inputs[0])
    nt.links.new(pw.outputs[0], mix.inputs[0])
    nt.links.new(east.outputs["Color"], mix.inputs[6])
    nt.links.new(west.outputs["Color"], mix.inputs[7])
    nt.links.new(mix.outputs[2], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 0.3
    w.mist_settings.start, w.mist_settings.depth, w.mist_settings.falloff = 12.0, 150.0, "QUADRATIC"
    return w


def world_day():
    """Flat winter daylight."""
    w = bpy.data.worlds.new("day")
    w.use_nodes = True
    nt = w.node_tree
    bg = next(n for n in nt.nodes if n.bl_idname == "ShaderNodeBackground")
    tc, sep, r = nt.nodes.new("ShaderNodeTexCoord"), nt.nodes.new("ShaderNodeSeparateXYZ"), nt.nodes.new("ShaderNodeValToRGB")
    r.color_ramp.elements[0].color, r.color_ramp.elements[1].color = srgb("#d3dbe0"), srgb("#7f9cc0")
    r.color_ramp.elements[1].position = 0.6
    nt.links.new(tc.outputs["Generated"], sep.inputs[0])
    nt.links.new(sep.outputs["Z"], r.inputs[0])
    nt.links.new(r.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 1.6
    w.mist_settings.start, w.mist_settings.depth, w.mist_settings.falloff = 12.0, 150.0, "QUADRATIC"
    return w


# --------------------------------------------------------------------- build
CLIP_CREW = [((-3.9, 12.0, 0.18), 2.7, "mask_a"), ((-3.3, 13.4, 0.18), 3.0, "mask_b"), ((-4.0, 15.4, 0.18), -2.6, "mask_c")]
LAMPS = [(-3.05, 14.5, 1), (3.05, 27.0, -1), (-3.05, 41.0, 1), (3.05, 55.0, -1), (-3.05, 68.0, 1), (3.05, -4.0, -1)]
PARKED = [((1.78, 27.5, 0.0), math.pi / 2, "sedan", "tail_off")]
D_TRUCK, Y_END, X_TRUCK = 13.5, 18.4, -1.5  # how far the truck rolls, and where it stops
CAM_A, CAM_B, CAM_LOOK = Vector((2.55, 0.6, 1.5)), Vector((1.95, 3.5, 1.55)), Vector((-1.8, 15.0, 1.5))
FOCUS = Vector((-3.3, 13.5, 1.2))  # the men at the door


def build(sc, crew=CLIP_CREW, people=(), truck_at=None, truck_lights=True, truck_sacks=0, sedans=PARKED,
          extra_lamps=(), day=False, extras=()):
    """Build the street. The random stream is reseeded, so every build gives the same street.
    people: keyword dicts for lib.figure. extras: functions that add props to the Geo.
    Returns (truck, wheels), or (None, []) when truck_at is None."""
    global DAY
    DAY = day
    rng.seed(11)
    SPOTS.clear()
    sc.world = world_day() if day else world_dusk()
    st = Geo("street")
    ground(st)
    props(st)
    backdrop(st)
    for x, y, side in list(LAMPS) + list(extra_lamps):
        street_lamp(st, x, y, side)
    for loc, facing, m, tail in sedans:
        sedan(st, loc, facing, m, tail)
    for loc, face, mask in crew:  # by the depot door, turned towards the truck (local -Y is "forward")
        figure(st, loc, face, mask)
    for kw in people:
        figure(st, **kw)
    for fn in extras:
        fn(st)

    B = Geo("buildings")
    depot = [{"kind": "win", "x": 3.0, "w": 1.3, "lit": True}, {"kind": "win", "x": 6.2, "w": 1.3}, {"kind": "door", "x": 9.6, "w": 1.15},
             {"kind": "garage", "x": 15.4, "w": 4.4}]
    # left side of the street (side -1): local x runs away from the camera
    building(B, (-HALF, -30, 0), -1, 34, 4, "brick_brown", plain=True)
    building(B, (-HALF, 4, 0), -1, 20, 4, "brick_red", depot, frame="frame_green", lit_p=0.22, gh=4.0, escape=(11.5, 15.0))
    building(B, (-HALF, 24, 0), -1, 14, 5, "paint_cream", [{"kind": "stoop", "x": 3.0, "w": 1.2, "lit": True}, {"kind": "shop", "x": 8.6, "w": 3.2, "awning": "canvas_red"},
                                                             {"kind": "shopdoor", "x": 11.6, "w": 1.1}], lit_p=0.4)
    building(B, (-HALF, 38, 0), -1, 16, 4, "brick_dark", [{"kind": "stoop", "x": 3.5, "w": 1.2}, {"kind": "stoop", "x": 11.5, "w": 1.2, "lit": True}], lit_p=0.4, escape=(5.5, 9.3))
    building(B, (-HALF, 54, 0), -1, 16, 6, "brick_grey", [{"kind": "shop", "x": 5.0, "w": 3.4}, {"kind": "stoop", "x": 11.5, "w": 1.2}], lit_p=0.45)
    # right side (side +1): local x runs towards the camera
    building(B, (HALF, 4, 0), 1, 34, 5, "brick_tan", plain=True)
    building(B, (HALF, 20, 0), 1, 16, 4, "brick_brown", [{"kind": "stoop", "x": 3.2, "w": 1.2, "lit": True, "door": "door_green"}, {"kind": "stoop", "x": 11.6, "w": 1.2}],
             lit_p=0.38, escape=(5.4, 9.2))
    building(B, (HALF, 36, 0), 1, 16, 5, "paint_sage", [{"kind": "shopdoor", "x": 3.3, "w": 1.1, "lit": True}, {"kind": "shop", "x": 6.3, "w": 3.6, "lit": True, "awning": "canvas_green"},
                                                        {"kind": "stoop", "x": 12.4, "w": 1.2}], lit_p=0.42)
    building(B, (HALF, 52, 0), 1, 16, 4, "brick_red", [{"kind": "stoop", "x": 4.0, "w": 1.2, "lit": True}, {"kind": "shop", "x": 10.6, "w": 3.2, "awning": "canvas_red"}], lit_p=0.4, escape=(2.5, 6.3))
    building(B, (HALF, 70, 0), 1, 18, 5, "brick_tan", [{"kind": "stoop", "x": 5.0, "w": 1.2}, {"kind": "shop", "x": 12.0, "w": 3.2}], lit_p=0.45)
    # across the far end of the street
    building(B, (-20, 79, 0), 0, 40, 5, "brick_brown", [{"kind": "shop", "x": 8.0 + i * 6.2, "w": 3.4, "awning": "canvas_green" if i % 2 else None} for i in range(5)], lit_p=0.5, depth=10)
    st.finish()
    B.finish()
    if day:
        light("SUN", (0, 0, 40), 4.0, "#ffe9cc", radius=0.03, rot=(math.radians(53), 0, math.radians(-22)))  # low sun from behind the camera
    if truck_at is None:
        return None, []
    trk, wheels = truck(lights=truck_lights, sacks=truck_sacks)
    trk.location = (X_TRUCK, truck_at, 0.0)
    return trk, wheels


def clip_camera(sc):
    """The locked-off camera of the truck clip."""
    return camera(sc, CAM_A.lerp(CAM_B, 0.6), CAM_LOOK, lens=28.0, shift_y=0.15, fstop=1.4, focus=FOCUS)


def animate(sc, trk, wheels, N, hold, dolly):
    """The truck pulls up over N frames, then the driver switches the headlights off."""
    cam = clip_camera(sc)
    for f in range(0, N + hold + 2):
        t = (f - 1) / (N - 1)
        p = CAM_A.lerp(CAM_B, t if dolly else 0.6)  # locked off unless --dolly
        d = CAM_LOOK - p
        cam.location = p
        cam.rotation_euler = (math.pi / 2, 0.0, math.atan2(-d.x, d.y))  # level: the lens shift does the tilting
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_euler", frame=f)
        s = D_TRUCK * (1 - (1 - min(max(t, 0), 1)) ** 2)  # ease out
        trk.location = (X_TRUCK, Y_END + D_TRUCK - s, 0.0)
        trk.keyframe_insert("location", frame=f)
        for wobj in wheels:
            wobj.rotation_euler = (0, s / 0.42, 0)
            wobj.keyframe_insert("rotation_euler", frame=f)
        cam.data.dof.focus_distance = (FOCUS - p).length
        cam.data.dof.keyframe_insert("focus_distance", frame=f)
    # Headlights off a little after it stops, with a short fade the way an old filament dims.
    lamp_node = principled(get_mat("headlamp")).inputs["Emission Strength"]
    for f, k in [(N + 22, 1.0), (N + 26, 0.0)]:
        lamp_node.default_value = 70 * k
        lamp_node.keyframe_insert("default_value", frame=f)
        for sp in SPOTS:
            sp.data.energy = 700 * k
            sp.data.keyframe_insert("energy", frame=f)
    sc.frame_start, sc.frame_end = 1, N + hold


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True, help="PNG path with --frame, else a folder for the frames")
    ap.add_argument("--frame", type=int, help="render one frame only")
    ap.add_argument("--start", type=int, default=1)
    ap.add_argument("--end", type=int)
    ap.add_argument("--frames", type=int, default=120, help="frames for the truck to pull up, at 30 fps")
    ap.add_argument("--hold", type=int, default=0, help="extra frames after it stops: the driver switches the headlights off")
    ap.add_argument("--scale", type=int, default=100, help="percent of 1080 x 1920")
    ap.add_argument("--samples", type=int, default=48, help="upper limit per pixel; easy pixels stop early")
    ap.add_argument("--threshold", type=float, default=0.03, help="noise level at which a pixel stops sampling")
    ap.add_argument("--seed", type=int, default=3)
    ap.add_argument("--dolly", action="store_true", help="move the camera in 3D (slower to render cleanly; see README)")
    ap.add_argument("--fast", action="store_true", help="lower quality for speed: fewer light bounces, no motion blur")
    ap.add_argument("--label", default="", help="name for this computer in times.json, e.g. laptop or cloud")
    args = ap.parse_args()

    t0 = time.time()
    sc = reset()
    trk, wheels = build(sc, truck_at=Y_END + D_TRUCK)
    animate(sc, trk, wheels, args.frames, args.hold, args.dolly)
    setup_render(sc, args.scale, args.samples, args.threshold, args.seed, motion_blur=True, fast=args.fast)
    last = args.frames + args.hold
    print(f"built scene in {time.time() - t0:.1f} s", flush=True)
    if args.frame is not None:
        t0 = time.time()
        render(sc, args.out, args.frame)
        print(f"frame {args.frame}: {time.time() - t0:.1f} s", flush=True)
        return
    os.makedirs(args.out, exist_ok=True)
    log = os.path.join(args.out, f"times{'_' + args.label if args.label else ''}.json")
    times = json.load(open(log)) if os.path.exists(log) else {}
    for f in range(args.start, (args.end or last) + 1):
        path = os.path.join(args.out, f"{f:04d}.png")
        if os.path.exists(path):
            continue  # lets an interrupted render resume
        t0 = time.time()
        render(sc, path, f)
        times[str(f)] = round(time.time() - t0, 2)
        json.dump({"label": args.label, "scale": args.scale, "samples": args.samples, "fast": args.fast, **times}, open(log, "w"), indent=0)
        print(f"frame {f}/{last}: {time.time() - t0:.1f} s", flush=True)
    done = [v for k, v in times.items() if k.isdigit()]
    if done:
        print(f"{len(done)} frames, {sum(done) / len(done):.1f} s per frame, {sum(done) / 60:.1f} min in all", flush=True)


if __name__ == "__main__":
    main()
