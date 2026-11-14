"""Stills ("plates") for the Five Keys short, path traced in the same style as the street clip.

Each plate is one locked-off frame. Remotion adds the slow zoom or pan, captions and overlays.

  python blender/fivekeys.py                       # every plate, full quality
  python blender/fivekeys.py --only B1,D2 --scale 35 --samples 12 --out /tmp/preview

Plates are written as JPEGs to public/fivekeys/plates/. Existing ones are skipped unless --force.
"""
import argparse
import math
import os
import random
import time

from lib import (Geo, bars, boards, camera, cash, figure, light, pendant, render, reset, room, sack, setup_render,
                 table, text, tiles, world_flat)
import street

from mathutils import Matrix, Vector

PI = math.pi
PLATES = {}


def plate(name, **opts):
    def deco(fn):
        PLATES[name] = (fn, opts)
        return fn
    return deco


def inside(sc, strength=0.02, color="#0b0d14"):
    sc.world = world_flat(color, strength)


# ----------------------------------------------------------------- the street
MASKED = ["mask_a", "mask_b", "mask_c", "mask_d"]


@plate("A1", haze=0.5)
def a1(sc):  # the street, before the truck arrives
    street.build(sc)
    camera(sc, (0.7, -3.6, 1.6), (-0.5, 30.0, 1.6), lens=24, shift_y=0.2, fstop=2.0, focus=(-3.3, 13.5, 1.2))


@plate("A3", haze=0.5)
def a3(sc):  # the crew, close
    street.build(sc, truck_at=street.Y_END, truck_lights=False)
    camera(sc, (0.2, 7.5, 1.5), (-3.65, 13.0, 1.5), lens=45, shift_y=0.03, fstop=2.0, focus=(-3.5, 13.0, 1.5))


@plate("A4", haze=0.5)
def a4(sc):  # carrying the bags out to the truck
    people = [dict(loc=(-3.65, 13.4, 0.18), facing=PI, mask="mask_a", carry=True),
              dict(loc=(-3.3, 15.9, 0.18), facing=PI + 0.2, mask="mask_c", carry=True),
              dict(loc=(-3.0, 19.3, 0.18), facing=-PI / 2 - 0.3, mask="mask_b")]
    street.build(sc, crew=(), people=people, truck_at=street.Y_END, truck_lights=False, truck_sacks=6)
    camera(sc, (-3.78, 9.9, 1.45), (-3.0, 19.0, 1.3), lens=28, shift_y=0.1, fstop=2.0, focus=(-3.5, 14.5, 1.2))


@plate("A4b", haze=0.5)
def a4b(sc):  # the bed of the truck, loaded
    people = [dict(loc=(-0.7, 22.1, 0.06), facing=0.25, mask="mask_b", carry=True),
              dict(loc=(-3.3, 19.6, 0.18), facing=-PI / 2, mask="mask_a")]
    street.build(sc, crew=(), people=people, truck_at=street.Y_END, truck_lights=False, truck_sacks=8)
    camera(sc, (1.7, 23.6, 2.5), (-1.5, 19.6, 1.15), lens=35, level=False, fstop=2.2, focus=(-1.5, 19.6, 1.3))


@plate("A5", haze=0.5)
def a5(sc):  # the same street, empty
    street.build(sc, crew=())
    street.clip_camera(sc)


@plate("A6", haze=0.3, exposure=0.8, bloom=0.2)
def a6(sc):  # years pass: the street by day
    walk = [((-3.6, 9.0), 0.1, "coat_brown", "brim", "hat_brown"), ((-3.9, 20.5), PI, "coat_grey", "brim", "hat_grey"),
            ((3.5, 14.0), 0.0, "coat_olive", "cap", "hat_grey"), ((3.9, 31.0), PI, "coat_navy", "brim", "hat_black"),
            ((-3.4, 33.0), 0.2, "coat_okeefe", None, None), ((3.4, 44.0), 0.0, "coat_brown", "brim", "hat_brown")]
    people = [dict(loc=(x, y, 0.18), facing=f, coat=c, hat=h, hatm=hm) for (x, y), f, c, h, hm in walk]
    street.build(sc, crew=(), people=people, day=True)
    camera(sc, (0.7, -3.6, 1.6), (-0.5, 30.0, 1.6), lens=24, shift_y=0.2, fstop=2.8, focus=(-3.3, 13.5, 1.2))


@plate("A7", haze=0.5)
def a7(sc):  # the hired gun, under a street lamp
    people = [dict(loc=(3.4, 25.3, 0.18), facing=-0.56, coat="coat_black", hat="brim", hatm="hat_black")]
    street.build(sc, crew=(), people=people, sedans=[((1.78, 27.5, 0.0), PI / 2, "sedan_black", "tail_off")])
    camera(sc, (-0.4, 20.6, 1.35), (2.7, 26.0, 1.5), lens=42, shift_y=0.06, fstop=2.0, focus=(3.4, 25.3, 1.5))


@plate("A8", haze=0.5)
def a8(sc):  # shot, and left on the pavement
    def hat(g):
        g.cyl("hat_brown", 0.37, 0.37, 0.025, 10, (-2.95, 29.3, 0.2), rot=(0.1, 0, 0))
        g.cyl("hat_brown", 0.2, 0.23, 0.17, 8, (-2.95, 29.3, 0.29), rot=(0.1, 0, 0))
    people = [dict(loc=(-3.6, 30.0, 0.18), facing=1.9, coat="coat_okeefe", hat=None, lying=True)]
    street.build(sc, crew=(), people=people, extras=[hat], extra_lamps=[(-3.05, 31.8, 1)],
                 sedans=[((-0.9, 41.5, 0.0), PI / 2, "sedan_black", "tail")])
    camera(sc, (-1.2, 26.3, 0.8), (-3.9, 30.0, 0.4), lens=32, level=False, fstop=2.0, focus=(-3.6, 30.0, 0.4))


@plate("A9", haze=0.3, exposure=0.8, bloom=0.2)
def a9(sc):  # the arrests
    f = -0.5
    people = [dict(loc=(3.55, 23.4, 0.18), facing=f, coat="coat_brown", hat=None),
              dict(loc=(3.0, 22.9, 0.18), facing=f + 0.3, coat="coat_agent", hat="brim", hatm="hat_grey"),
              dict(loc=(4.15, 23.3, 0.18), facing=f - 0.2, coat="coat_agent", hat="brim", hatm="hat_black"),
              dict(loc=(3.3, 25.2, 0.18), facing=f, coat="coat_pino", hat=None),
              dict(loc=(3.85, 25.6, 0.18), facing=f, coat="coat_agent", hat="brim", hatm="hat_grey"),
              dict(loc=(3.1, 27.3, 0.18), facing=f + 0.2, coat="coat_grey", hat=None)]
    street.build(sc, crew=(), people=people, day=True, sedans=[((1.78, 28.6, 0.0), PI / 2, "sedan_black", "tail_off")])
    camera(sc, (0.3, 21.0, 1.5), (3.5, 24.6, 1.4), lens=35, shift_y=0.05, fstop=2.8, focus=(3.5, 23.4, 1.4))  # clear of the utility pole


# ------------------------------------------------------- corridor and doors
def keyring(g, at, n=4):
    """A key standing in a lock at `at`, with the rest of the ring hanging from it."""
    x, y, z = at
    g.box("brass", (0.004, 0.03, 0.009), (x, y - 0.012, z))
    g.cyl("brass", 0.015, 0.015, 0.004, 8, (x, y - 0.04, z), rot=(0, PI / 2, 0))
    g.ring("galv", 0.021, 0.0022, 10, (x, y - 0.046, z - 0.024), rot=(0, PI / 2, 0))
    T0 = g.T
    for i in range(n):
        a = (i - (n - 1) / 2) * 0.3
        g.T = T0 @ Matrix.Translation(Vector((x + (i - (n - 1) / 2) * 0.005, y - 0.046 + math.sin(a) * 0.02, z - 0.045))) @ Matrix.Rotation(a, 4, "X")
        g.cyl("brass", 0.014, 0.014, 0.004, 8, (0, 0, -0.012), rot=(0, PI / 2, 0))
        g.box("brass", (0.004, 0.008, 0.045), (0, 0, -0.046))
    g.T = T0


def door(g, x=0.0, w=0.95, h=2.08, m="door_green", frame="frame_green", swing=0.0, lock="normal", style=0):
    """A door in the wall at y = 0, seen from the -y side. Hinged on the left, opening away.
    Returns where the lock is (door closed), for cameras and lights."""
    for sx in (-1, 1):
        g.box(frame, (0.1, 0.1, h + 0.1), (x + sx * (w / 2 + 0.05), -0.05, (h + 0.1) / 2))
    g.box(frame, (w + 0.2, 0.1, 0.1), (x, -0.05, h + 0.05))
    T0 = g.T
    g.T = T0 @ Matrix.Translation(Vector((x - w / 2, -0.03, 0))) @ Matrix.Rotation(swing, 4, "Z")
    g.box(m, (w, 0.05, h), (w / 2, 0, h / 2))
    if style == 0:  # panelled wood
        for cz, ch in ((0.52, 0.72), (1.5, 0.92)):
            g.box(m, (w - 0.24, 0.02, ch), (w / 2, -0.032, cz))
    elif style == 1:  # riveted steel
        for cz in (0.25, 1.0, 1.85):
            g.box("iron", (w, 0.012, 0.05), (w / 2, -0.03, cz))
        for i in range(5):
            for cz in (0.25, 1.85):
                g.cyl("iron", 0.012, 0.012, 0.02, 6, (0.1 + i * (w - 0.2) / 4, -0.04, cz), rot=(PI / 2, 0, 0))
    else:  # half glazed, wired glass
        g.box(m, (w - 0.24, 0.02, 0.7), (w / 2, -0.032, 0.5))
        g.box("glass_dark", (w - 0.26, 0.012, 0.8), (w / 2, -0.03, 1.5))
        for i in range(1, 5):
            g.box("iron", (0.006, 0.006, 0.8), (0.13 + i * (w - 0.26) / 5, -0.038, 1.5))
    lx = w - 0.11
    g.box("brass", (0.07, 0.012, 0.24), (lx, -0.031, 1.0))
    if lock == "removed":
        g.cyl("black", 0.023, 0.023, 0.012, 10, (lx, -0.034, 1.08), rot=(PI / 2, 0, 0))
    else:
        g.cyl("brass", 0.025, 0.025, 0.035, 10, (lx, -0.05, 1.08), rot=(PI / 2, 0, 0))
        g.box("black", (0.005, 0.004, 0.022), (lx, -0.069, 1.08))
    g.cyl("brass", 0.011, 0.011, 0.06, 6, (lx, -0.06, 0.93), rot=(PI / 2, 0, 0))
    g.ico("brass", 0.034, 1, (lx, -0.1, 0.93))
    if lock == "key":
        keyring(g, (lx, -0.068, 1.08))
    g.T = T0
    return (x - w / 2 + lx, -0.1, 1.08)


def corridor(g, r, wall="plaster", dado="dado_green", lamp=90, length=7.5, w=2.3, h=2.9, opening=False, dw=0.95):
    x0, x1 = -w / 2, w / 2
    room(g, x0, x1, -length, 0.0, h, wall, None, ceil="plaster", dado=dado, skip=("y1",) if opening else ())
    g.box("joint", (w + 0.4, length + 6, 0.1), (0, -length / 2 + 2, -0.05))
    tiles(g, x0, x1, -length, 0.0, 0.46, rng=r)
    if opening:  # a real doorway, with a lit room beyond
        side = (w - dw) / 2 - 0.1
        for sx in (-1, 1):
            g.box(wall, (side, 0.2, h), (sx * (w / 2 - side / 2), 0.1, h / 2))
        g.box(wall, (dw + 0.2, 0.2, h - 2.18), (0, 0.1, (h + 2.18) / 2))
        g.box("floorboard", (4, 4, 0.03), (0, 2.2, 0.0))
        g.box("win_warm", (4, 0.05, h), (0, 3.2, h / 2))
        light("AREA", (0.0, 1.0, 1.8), 320, "#ffc27a", size=1.0, aim=(0.0, -3.0, 0.3))
    g.cyl("galv", 0.035, 0.035, length, 8, (x0 + 0.2, -length / 2, h - 0.22), rot=(PI / 2, 0, 0))
    g.cyl("iron", 0.02, 0.02, length, 6, (x1 - 0.16, -length / 2, h - 0.14), rot=(PI / 2, 0, 0))
    g.cyl("hydrant", 0.13, 0.1, 0.24, 8, (x1 - 0.17, -1.7, 1.2))  # fire bucket
    g.box("iron", (0.04, 0.3, 0.03), (x1 - 0.03, -1.7, 1.36))
    g.box("wood_dark", (0.03, 0.8, 0.55), (x0 + 0.035, -2.7, 1.62))  # notice board
    for k in range(3):
        g.box("paper", (0.012, 0.2, 0.26), (x0 + 0.055, -2.95 + k * 0.25, 1.6 + r.uniform(-0.06, 0.06)))
    g.box("iron", (0.22, 0.08, 0.12), (0, -0.06, 2.42))  # bulkhead light over the door
    g.box("bulb" if lamp else "bulb_off", (0.16, 0.02, 0.07), (0, -0.11, 2.42))
    if lamp:
        light("POINT", (0, -0.3, 2.38), lamp * 0.3, "#ffd9a8", 0.05)
        pendant(g, 0.0, -2.6, h, 0.55, power=lamp)
    else:
        pendant(g, 0.0, -2.6, h, 0.55, on=False)


@plate("B1", exposure=1.3)
def b1(sc):  # the hook: masked men at a locked door
    r, g = random.Random(1), Geo("c")
    corridor(g, r)
    door(g, lock="key")
    figure(g, (-0.32, -0.85, 0.03), PI + 0.15, "mask_a")
    figure(g, (0.55, -2.2, 0.03), PI - 0.25, "mask_c")
    g.finish()
    inside(sc)
    camera(sc, (0.3, -5.2, 1.45), (0.0, 0.0, 1.25), lens=28, shift_y=0.04, fstop=2.0, focus=(-0.3, -0.85, 1.4))


def lock_shot(sc, state, torch):
    r, g = random.Random(2), Geo("c")
    corridor(g, r, lamp=0 if torch else 90)
    lk = Vector(door(g, lock=state))
    if state == "removed":  # the cylinder drawn out by a gloved hand reaching in from the left
        g.cyl("brass", 0.025, 0.025, 0.075, 10, lk + Vector((0.0, -0.02, 0.0)), rot=(PI / 2 + 0.08, 0, -0.1))
        g.box("black", (0.09, 0.07, 0.1), lk + Vector((-0.09, -0.02, -0.005)), rot=(0, 0, -0.2))
        g.box("black", (0.08, 0.065, 0.026), lk + Vector((-0.035, -0.022, 0.04)), rot=(0, -0.1, -0.15))
        g.box("black", (0.065, 0.06, 0.024), lk + Vector((-0.035, -0.022, -0.04)), rot=(0, 0.1, -0.15))
        g.box("coat_navy", (0.4, 0.12, 0.13), lk + Vector((-0.32, 0.0, -0.09)), rot=(0, 0.35, -0.12))
    g.finish()
    inside(sc, 0.03 if torch else 0.02, "#141a2a")
    if torch:
        light("SPOT", (-0.25, -1.3, 1.4), torch, "#fff2d0", 0.02, spot=30, aim=lk)
        light("AREA", (0.0, -7.0, 2.0), 10, "#9fb8ff", size=1.5, aim=(0, 0, 1.2))
    camera(sc, (0.84, -0.55, 1.2), lk, lens=55, level=False, fstop=2.8, focus=lk)


@plate("B2", exposure=1.2)
def b2(sc):  # the key in the lock
    lock_shot(sc, "key", 0)


@plate("B4", exposure=1.5)
def b4(sc):  # taking a lock out
    lock_shot(sc, "removed", 80)


@plate("B5", exposure=1.5)
def b5(sc):  # and putting it back
    lock_shot(sc, "normal", 35)


@plate("B3", exposure=1.6)
def b3(sc):  # months earlier: inside at night, by torchlight
    r, g = random.Random(3), Geo("c")
    corridor(g, r, lamp=0)
    lk = door(g)
    figure(g, (-0.28, -1.7, 0.03), PI + 0.1, coat="coat_pino", hat="brim", hatm="hat_brown")
    figure(g, (0.5, -2.8, 0.03), PI - 0.2, coat="coat_grey", hat="cap", hatm="hat_grey")
    g.finish()
    inside(sc, 0.03, "#141a2a")
    light("SPOT", (-0.02, -1.5, 1.15), 160, "#fff2d0", 0.02, spot=40, aim=lk)
    light("AREA", (0.0, -7.2, 2.0), 16, "#9fb8ff", size=1.5, aim=(0, 0, 1.2))
    camera(sc, (0.2, -5.6, 1.3), (0.0, 0.0, 1.3), lens=26, shift_y=0.03, fstop=2.0, focus=(-0.28, -1.7, 1.4))


DOORS = [dict(wall="plaster", dado="dado_green", d=dict(m="door_green", frame="frame_green", style=0)),
         dict(wall="brick_grey", dado=None, d=dict(m="steel_door", frame="iron", style=1)),
         dict(wall="plaster", dado="dado_brown", d=dict(m="door_red", frame="frame_cream", style=0)),
         dict(wall="paint_sage", dado=None, d=dict(m="door_blue", frame="frame_cream", style=2)),
         dict(wall="brick_red", dado=None, d=dict(m="steel_door", frame="iron", style=1))]


def key_door(i):
    def fn(sc):  # "key one" to "key five": five doors, the last one opening onto the light
        r, g, spec, last = random.Random(20 + i), Geo("c"), DOORS[i], i == 4
        corridor(g, r, wall=spec["wall"], dado=spec["dado"], opening=last)
        door(g, lock="key", swing=1.2 if last else 0.0, **spec["d"])
        figure(g, (-0.5 + 0.05 * i, -0.7, 0.03), PI + 0.12, MASKED[i % 4])
        g.finish()
        inside(sc)
        camera(sc, (0.4 if i % 2 else 0.22, -4.1, 1.42), (0.05, 0.0, 1.2), lens=32, shift_y=0.03, fstop=2.2, focus=(0.3, -0.1, 1.1))
    return fn


for _i in range(5):
    PLATES[f"B{6 + _i}"] = (key_door(_i), dict(exposure=1.3))


# ------------------------------------------------------ bench and calendar
def worktop(g, lamp_at=(-0.62, 0.38), power=45):
    room(g, -2.2, 2.2, -2.6, 0.75, 2.7, "wall_dark", "floorboard")
    for i in range(6):
        g.box("wood_light" if i % 2 else "wood", (2.4, 0.148, 0.05), (0, -0.35 + i * 0.15, 0.755))
    g.box("wood_dark", (2.3, 0.86, 0.1), (0, 0.02, 0.68))
    for sx in (-1.05, 1.05):
        g.box("wood_dark", (0.09, 0.8, 0.66), (sx, 0.02, 0.33))
    x, y = lamp_at  # anglepoise lamp
    g.cyl("iron", 0.085, 0.095, 0.03, 10, (x, y, 0.795))
    g.cyl("iron", 0.012, 0.012, 0.44, 6, (x + 0.06, y - 0.03, 1.0), rot=(0.12, 0.3, 0))
    g.cyl("iron", 0.012, 0.012, 0.36, 6, (x + 0.25, y - 0.1, 1.27), rot=(0.25, 1.15, 0))
    g.cyl("lamp_shade", 0.12, 0.045, 0.14, 8, (x + 0.42, y - 0.15, 1.3), rot=(0.25, 0.45, 0))
    g.ico("bulb", 0.035, 1, (x + 0.44, y - 0.17, 1.23))
    light("POINT", (x + 0.46, y - 0.18, 1.16), power, "#ffc98a", 0.035)
    return 0.78  # height of the top


@plate("C1", exposure=1.2)
def c1(sc):  # a key being cut to fit the stolen lock
    r, g = random.Random(4), Geo("b")
    Z = worktop(g)
    vx, vy = -0.05, 0.12
    g.box("door_blue", (0.16, 0.2, 0.03), (vx, vy, Z + 0.015))
    g.box("door_blue", (0.09, 0.14, 0.09), (vx, vy + 0.02, Z + 0.075))
    g.box("galv", (0.13, 0.022, 0.06), (vx, vy - 0.045, Z + 0.15))
    g.box("galv", (0.13, 0.022, 0.06), (vx, vy - 0.073, Z + 0.15))
    g.cyl("galv", 0.008, 0.008, 0.2, 6, (vx, vy - 0.16, Z + 0.1), rot=(PI / 2, 0, 0))
    g.cyl("galv", 0.006, 0.006, 0.14, 6, (vx, vy - 0.25, Z + 0.1), rot=(0, PI / 2, 0))
    kx, ky, kz = vx, vy - 0.059, Z + 0.2
    g.box("brass", (0.009, 0.004, 0.06), (kx, ky, kz - 0.01))  # the key, blade down in the jaws
    g.cyl("brass", 0.017, 0.017, 0.004, 8, (kx, ky, kz + 0.035), rot=(PI / 2, 0, 0))
    g.box("galv", (0.2, 0.018, 0.005), (vx + 0.22, vy - 0.16, Z + 0.004), rot=(0, 0, 0.5))  # file
    g.cyl("wood_light", 0.012, 0.01, 0.09, 6, (vx + 0.345, vy - 0.092, Z + 0.012), rot=(0, PI / 2, 0.5))
    g.cyl("brass", 0.025, 0.025, 0.07, 10, (0.3, 0.2, Z + 0.025), rot=(0, PI / 2, 0.4))  # the lock from the door
    g.box("black", (0.004, 0.005, 0.022), (0.333, 0.214, Z + 0.025), rot=(0, 0, 0.4))
    g.ring("galv", 0.03, 0.0025, 10, (0.33, -0.14, Z + 0.004))  # the keys already made
    for i in range(4):
        a = -0.6 + i * 0.5
        g.cyl("brass", 0.016, 0.016, 0.004, 8, (0.33 + math.cos(a) * 0.045, -0.14 + math.sin(a) * 0.045, Z + 0.003))
        g.box("brass", (0.05, 0.008, 0.004), (0.33 + math.cos(a) * 0.085, -0.14 + math.sin(a) * 0.085, Z + 0.003), rot=(0, 0, a))
    for _ in range(45):  # brass filings
        g.box("brass", (0.005, 0.002, 0.001), (vx + r.gauss(0, 0.06), vy - 0.1 + r.gauss(0, 0.05), Z + 0.001), rot=(0, 0, r.uniform(0, 3)))
    g.box("dado_brown", (1.9, 0.03, 0.8), (0, 0.735, 1.55))  # tool board
    for tx, th in ((-0.6, 0.3), (-0.35, 0.24), (0.1, 0.34), (0.4, 0.2), (0.65, 0.28)):
        g.box("galv", (0.025, 0.02, th), (tx, 0.71, 1.75 - th / 2))
        g.box("wood_light", (0.035, 0.03, 0.1), (tx, 0.705, 1.7 - th))
    g.finish()
    inside(sc)
    camera(sc, (0.46, -0.56, 1.32), (0.02, 0.06, 0.88), lens=45, level=False, fstop=2.8, focus=(kx, ky, kz))


def calendar(sc, today=None, crossed=0):
    """January 1956 on a desk. The 17th, the deadline, is ringed in red."""
    g = Geo("d")
    Z = worktop(g, lamp_at=(-0.72, 0.36), power=34)
    g.box("door_green", (0.62, 0.58, 0.004), (0, 0, Z + 0.002))  # blotter
    g.box("paper", (0.38, 0.47, 0.012), (0, 0, Z + 0.01))
    g.box("paper_red", (0.38, 0.09, 0.002), (0, 0.19, Z + 0.017))
    g.box("iron", (0.38, 0.018, 0.016), (0, 0.24, Z + 0.016))
    page = Z + 0.0165
    text("JANUARY 1956", (0, 0.19, Z + 0.0185), 0.036, "paper")
    for i, d in enumerate("SMTWTFS"):
        text(d, (-0.15 + i * 0.05, 0.118, page), 0.016, "red_mark" if i == 0 else "ink")
    for day in range(1, 32):  # 1 January 1956 was a Sunday
        x, y = -0.15 + ((day - 1) % 7) * 0.05, 0.062 - ((day - 1) // 7) * 0.062
        text(str(day), (x, y, page), 0.027, "ink")
        if day <= crossed:
            for a in (0.785, -0.785):
                g.box("red_mark", (0.044, 0.0035, 0.0006), (x, y, page + 0.0008), rot=(0, 0, a))
        if day == today:
            g.ring("ink", 0.023, 0.0016, 14, (x, y, page + 0.001))
        if day == 17:
            g.ring("red_mark", 0.025, 0.003, 14, (x, y, page + 0.0015))
            g.ring("red_mark", 0.0215, 0.0015, 14, (x, y, page + 0.0015))
    g.cyl("red_mark", 0.0045, 0.0045, 0.17, 6, (0.27, -0.13, Z + 0.0085), rot=(PI / 2, 0, 0.5))  # pencil
    g.cyl("paper", 0.04, 0.036, 0.09, 10, (-0.3, 0.22, Z + 0.045))  # mug
    g.cyl("wood_dark", 0.034, 0.034, 0.004, 10, (-0.3, 0.22, Z + 0.088))
    g.cyl("glass_dark", 0.05, 0.04, 0.02, 8, (0.31, 0.2, Z + 0.01))  # ashtray
    g.cyl("paper", 0.004, 0.004, 0.07, 5, (0.31, 0.17, Z + 0.024), rot=(PI / 2, 0, 0.6))
    g.finish()
    inside(sc)
    camera(sc, (0.07, -0.4, 1.74), (0.0, 0.0, 0.79), lens=50, level=False, fstop=4.0)


@plate("C2", exposure=1.0)
def c2(sc):  # the deadline
    calendar(sc)


@plate("C3", exposure=1.0)
def c3(sc):  # 6 January: eleven days before the deadline
    calendar(sc, today=6, crossed=5)


@plate("C4", exposure=1.0)
def c4(sc):  # 12 January: five days to spare
    calendar(sc, today=12, crossed=11)


# ------------------------------------------------------------ counting room
def clock(g, loc, rz, hour, minute):
    T0 = g.T
    g.T = T0 @ Matrix.Translation(Vector(loc)) @ Matrix.Rotation(rz, 4, "Z")
    g.cyl("wood_dark", 0.3, 0.3, 0.04, 12, (0, -0.02, 0), rot=(PI / 2, 0, 0))
    g.cyl("paper", 0.26, 0.26, 0.02, 12, (0, -0.045, 0), rot=(PI / 2, 0, 0))
    for k in range(12):
        a = k * PI / 6
        g.box("ink", (0.012, 0.004, 0.04), (math.sin(a) * 0.22, -0.057, math.cos(a) * 0.22), rot=(0, a, 0))
    for length, width, a in ((0.13, 0.022, (hour % 12 + minute / 60) * PI / 6), (0.2, 0.014, minute * PI / 30)):
        g.box("ink", (width, 0.006, length), (math.sin(a) * length / 2, -0.06, math.cos(a) * length / 2), rot=(0, a, 0))
    g.cyl("ink", 0.018, 0.018, 0.012, 8, (0, -0.062, 0), rot=(PI / 2, 0, 0))
    g.T = T0


def table_cash(g, r, x, y, w, d, fill):
    table(g, x, y, w, d)
    T0 = g.T
    for i in range(7):
        for j in range(3):
            if r.random() < fill:
                g.T = T0 @ Matrix.Translation(Vector((x - w / 2 + 0.2 + i * (w - 0.4) / 6, y - d / 2 + 0.2 + j * (d - 0.4) / 2, 0.78))) @ Matrix.Scale(1.45, 4)
                cash(g, (0, 0, 0), layers=r.randint(2, 9), rot=r.uniform(-0.1, 0.1))
    g.T = T0
    if fill > 0.3:  # adding machine and ledger
        g.box("iron", (0.2, 0.26, 0.12), (x + w / 2 - 0.2, y + d / 2 - 0.22, 0.84))
        g.box("paper", (0.07, 0.02, 0.1), (x + w / 2 - 0.2, y + d / 2 - 0.1, 0.93))


def counting(sc, state):
    """The Brink's counting room. state: work, tied or alarm."""
    r, g = random.Random(5), Geo("r")
    X0, X1, Y0, Y1, H = -4.2, 4.2, 0.0, 7.4, 3.3
    room(g, X0, X1, Y0, Y1, H, "plaster", None, dado="dado_green", dado_h=1.35)
    g.box("joint", (9, 8, 0.1), (0, 3.7, -0.05))
    boards(g, X0, X1, Y0, Y1)
    # wire cage across the back, with the safe behind it
    CY, CH = 5.6, 2.35
    for i in range(61):
        g.box("iron", (0.012, 0.012, CH), (X0 + i * (X1 - X0) / 60, CY, CH / 2))
    for k in range(8):
        g.box("iron", (X1 - X0, 0.012, 0.012), (0, CY, 0.08 + k * CH / 7.2))
    g.box("iron", (X1 - X0, 0.06, 0.06), (0, CY, CH))
    for px in (X0 + 0.03, -1.4, -0.4, X1 - 0.03):
        g.box("iron", (0.06, 0.06, CH), (px, CY, CH / 2))
    g.box("steel_door", (1.7, 0.9, 2.05), (2.3, 6.85, 1.02))
    g.cyl("iron", 0.62, 0.62, 0.06, 12, (2.3, 6.38, 1.1), rot=(PI / 2, 0, 0))
    g.cyl("brass", 0.2, 0.2, 0.05, 10, (2.3, 6.33, 1.1), rot=(PI / 2, 0, 0))
    for a in (0, PI / 3, 2 * PI / 3):
        g.box("brass", (0.5, 0.03, 0.03), (2.3, 6.31, 1.1), rot=(0, a, 0))
    g.box("wood_dark", (2.6, 0.5, 0.06), (-2.6, 6.9, 0.9))
    g.box("wood_dark", (2.6, 0.5, 0.06), (-2.6, 6.9, 1.6))
    if state != "alarm":
        for k in range(4):
            sack(g, (-3.6 + k * 0.65, 6.9, 0.93), 0.8, rot=k)
    fill = {"work": 0.9, "tied": 0.45, "alarm": 0.0}[state]
    tabs = [(-1.8, 2.7, 1.9, 0.95), (1.5, 3.2, 1.9, 0.95), (-0.2, 4.55, 1.9, 0.95)]
    for x, y, w, d in tabs:
        table_cash(g, r, x, y, w, d, fill)
        pendant(g, x, y, H, 1.3, power=120, r=0.34)
    for cx in (3.3, 3.85):  # filing cabinets
        g.box("galv", (0.5, 0.6, 1.35), (cx, 0.5, 0.675))
        for k in range(3):
            g.box("iron", (0.3, 0.02, 0.03), (cx, 0.19, 0.3 + k * 0.42))
    clock(g, (X0 + 0.01, 4.4, 2.5), PI / 2, 7, 37 if state == "alarm" else 12)
    g.cyl("alarm_red" if state == "alarm" else "hydrant", 0.17, 0.17, 0.07, 10, (X0 + 0.05, 3.6, 2.35), rot=(0, PI / 2, 0))
    g.ico("iron", 0.05, 1, (X0 + 0.1, 3.6, 2.35))
    g.box("hydrant", (0.06, 0.16, 0.22), (X0 + 0.04, 3.6, 1.45))
    if state == "work":
        for (x, y), f in (((-1.8, 3.4), 0.1), ((-0.2, 5.2), -0.15), ((1.5, 3.9), -0.3), ((0.85, 5.15), 0.2)):
            figure(g, (x, y, 0.03), f, coat="coat_worker", hat="visor")
        for k, (x, y) in enumerate(((-3.3, 1.9), (2.9, 4.6), (3.3, 4.2))):
            sack(g, (x, y, 0.03), 0.9, rot=k * 1.1)
    else:
        down = [((-2.7, 1.7), 1.2), ((-1.0, 1.6), -0.75), ((0.4, 2.3), 2.38), ((2.6, 2.3), 0.7)]  # side-on to the camera
        for k, ((x, y), f) in enumerate(down):
            if state == "alarm" and k == 0:
                continue
            figure(g, (x, y, 0.03), f, coat="coat_worker", hat=None, lying=True, tied=True)
    if state == "tied":
        figure(g, (-1.1, 3.6, 0.03), 0.2, "mask_a", carry=True)
        figure(g, (0.5, 4.0, 0.03), -0.3, "mask_b")
        figure(g, (2.4, 4.4, 0.03), -0.6, "mask_c", carry=True)
    if state == "alarm":  # one man is loose and has reached the alarm
        figure(g, (X0 + 0.5, 3.6, 0.03), -PI / 2, coat="coat_worker", hat=None)
        g.ring("rope", 0.2, 0.012, 8, (-2.6, 1.8, 0.05))
        light("POINT", (X0 + 0.45, 3.6, 2.35), 60, "#ff3a24", 0.1)
        for _ in range(14):
            g.box("bill", (0.23, 0.1, 0.004), (r.uniform(-2.5, 2.5), r.uniform(1.2, 5.0), 0.032), rot=(0, 0, r.uniform(0, 3)))
    g.finish()
    inside(sc)


@plate("D1", exposure=0.9)
def d1(sc):  # counting the day's money
    counting(sc, "work")
    camera(sc, (-3.2, 0.5, 1.6), (0.6, 5.2, 1.0), lens=22, shift_y=0.05, fstop=2.8, focus=(-0.2, 4.5, 1.0))


@plate("D2", exposure=0.9)
def d2(sc):  # tied up and gagged
    counting(sc, "tied")
    camera(sc, (2.3, 0.4, 1.3), (-0.6, 3.2, 0.55), lens=24, shift_y=-0.06, fstop=2.8, focus=(1.0, 1.5, 0.4))


@plate("D3", exposure=0.9)
def d3(sc):  # 7:37: the alarm
    counting(sc, "alarm")
    camera(sc, (-0.9, 1.6, 1.5), (-4.1, 4.0, 2.0), lens=28, shift_y=0.1, fstop=2.8, focus=(-3.7, 3.6, 1.6))


# ------------------------------------------------------------------ the cash
def cash_table(sc, n=70, sacks=True, robbers=False, power=55, drop=1.2):
    r, g = random.Random(6), Geo("m")
    room(g, -3, 3, -3, 3, 3.0, "wall_dark", "floorboard")
    for i in range(9):
        g.box("wood_light" if i % 2 else "wood", (2.8, 0.178, 0.06), (0, -0.72 + i * 0.18, 0.75))
    g.box("wood_dark", (2.6, 1.4, 0.1), (0, 0, 0.67))
    for sx in (-1.2, 1.2):
        for sy in (-0.6, 0.6):
            g.box("wood_dark", (0.09, 0.09, 0.64), (sx, sy, 0.32))
    for _ in range(n):
        x, y = (r.gauss(0, 0.36), r.gauss(0, 0.2)) if n > 5 else (r.uniform(-0.12, 0.12), r.uniform(-0.05, 0.05))
        cash(g, (x, y, 0.78), layers=r.randint(2, 8) if n > 5 else r.randint(2, 3), rot=r.uniform(-0.6, 0.6), loose=r)
    for _ in range(18 if n > 5 else 3):
        g.box(r.choice(["bill", "bill_b"]), (0.156, 0.066, 0.002), (r.uniform(-1.0, 1.0), r.uniform(-0.55, 0.55), 0.782), rot=(0, 0, r.uniform(0, 3)))
    if sacks:
        sack(g, (-0.95, 0.3, 0.78), 0.85, rot=0.4)
        sack(g, (1.0, 0.35, 0.78), 0.8, rot=2.0)
        sack(g, (-1.7, -0.3, 0.02), 1.0, rot=1.0)
        sack(g, (1.75, 0.5, 0.02), 1.0, rot=2.6)
    if robbers:
        figure(g, (-0.6, 1.05, 0.02), 0.15, "mask_a", carry=True)
        figure(g, (0.65, 1.15, 0.02), -0.2, "mask_b")
    pendant(g, 0.0, 0.05, 3.0, drop, power=power, r=0.34)
    g.finish()
    inside(sc)


@plate("E1", exposure=1.0)
def e1(sc):  # the money
    cash_table(sc)
    camera(sc, (0.8, -1.3, 1.25), (0.0, 0.0, 0.86), lens=40, level=False, fstop=2.8, focus=(0.0, -0.1, 0.86))


@plate("E2", exposure=1.0)
def e2(sc):  # bag after bag
    cash_table(sc, robbers=True)
    camera(sc, (0.25, -2.0, 1.45), (0.0, 0.3, 1.05), lens=32, shift_y=0.0, fstop=2.8, focus=(0.0, 0.0, 0.9))


@plate("E3", exposure=1.0)
def e3(sc):  # 1.2 million in cash, from above
    cash_table(sc, sacks=False, drop=0.4, power=90)
    camera(sc, (0.0, -0.3, 2.2), (0.0, 0.0, 0.8), lens=40, level=False, fstop=4.0)


@plate("E5", exposure=1.1)
def e5(sc):  # all that was ever found
    cash_table(sc, n=3, sacks=False, power=40)
    camera(sc, (0.55, -1.15, 1.2), (0.0, 0.0, 0.82), lens=45, level=False, fstop=2.8, focus=(0.0, 0.0, 0.82))


# ------------------------------------------------------------------ the pact
def backroom(sc):
    r, g = random.Random(7), Geo("p")
    room(g, -3, 3, -3, 3, 2.9, "wall_dark", "floorboard", dado="dado_brown")
    g.cyl("wood", 0.9, 0.9, 0.06, 12, (0, 0, 0.75))
    g.cyl("wood_dark", 0.12, 0.3, 0.72, 8, (0, 0, 0.36))
    for _ in range(38):
        cash(g, (r.gauss(0, 0.26), r.gauss(0, 0.2), 0.78), layers=r.randint(2, 7), rot=r.uniform(-0.6, 0.6), loose=r)
    sack(g, (-0.5, 0.45, 0.78), 0.7, rot=1.0)
    coats = ["coat_pino", "coat_grey", "coat_brown", "coat_olive", "coat_okeefe", "coat_grey", "coat_navy", "coat_brown",
             "coat_agent", "coat_olive", "coat_grey"]
    hats = [("brim", "hat_brown"), (None, None), ("brim", "hat_grey"), ("cap", "hat_grey"), (None, None), ("brim", "hat_black"),
            (None, None), ("brim", "hat_brown"), ("cap", "hat_black"), (None, None), ("brim", "hat_grey")]
    for i in range(11):
        a = i * 2 * PI / 11 + r.uniform(-0.08, 0.08)
        d = 1.55 + r.uniform(-0.08, 0.12)
        x, y = math.cos(a) * d, math.sin(a) * d
        figure(g, (x, y, 0.02), math.atan2(-x, y), coat=coats[i], hat=hats[i][0], hatm=hats[i][1], scale=r.uniform(0.95, 1.04))
    pendant(g, 0.0, 0.0, 2.9, 0.95, power=120, r=0.34)
    g.finish()
    inside(sc)


@plate("F1", exposure=1.2)
def f1(sc):  # eleven men and a pact
    backroom(sc)
    camera(sc, (1.5, -1.8, 2.78), (0.0, 0.05, 0.9), lens=24, level=False, fstop=2.8, focus=(0, 0, 0.9))


@plate("F2", exposure=1.2)
def f2(sc):  # nobody talks
    backroom(sc)
    camera(sc, (0.05, -0.8, 1.12), (0.0, 1.5, 1.5), lens=35, level=False, fstop=2.0, focus=(0.0, 1.5, 1.55))


# ------------------------------------------------- cell, interview, prison
@plate("G1", exposure=1.3)
def g1(sc):  # O'Keefe in a Pennsylvania jail
    g = Geo("j")
    room(g, -1.4, 1.4, 0.0, 3.3, 2.8, "wall_grey", "slab_b", skip=("y0",))
    room(g, -3.2, 3.2, -3.4, 0.0, 2.8, "wall_grey", "slab_a", skip=("y1",))
    for sx in (-1, 1):
        g.box("wall_grey", (1.8, 0.2, 2.8), (sx * 2.3, 0.0, 1.4))
    bars(g, -1.4, 1.4, 0.0, 0.0, 2.8, gap=0.115, r=0.015)
    g.box("iron", (0.8, 1.95, 0.05), (-0.95, 1.95, 0.42))  # bunk
    for sy in (1.05, 2.85):
        g.box("iron", (0.8, 0.05, 0.42), (-0.95, sy, 0.21))
    g.box("mattress", (0.76, 1.9, 0.12), (-0.95, 1.95, 0.5))
    g.box("blanket", (0.78, 1.0, 0.03), (-0.95, 1.55, 0.575))
    g.box("paper", (0.5, 0.3, 0.09), (-0.95, 2.65, 0.6))
    g.box("wood_dark", (0.45, 0.22, 0.03), (1.15, 2.6, 1.2))  # shelf, cup, bucket
    g.cyl("galv", 0.04, 0.035, 0.08, 8, (1.1, 2.6, 1.255))
    g.cyl("galv", 0.15, 0.12, 0.26, 10, (1.05, 2.9, 0.13))
    g.box("win_cool", (0.7, 0.03, 0.45), (0.0, 3.29, 2.25))  # high window
    for i in range(5):
        g.cyl("iron", 0.012, 0.012, 0.45, 6, (-0.28 + i * 0.14, 3.26, 2.25))
    figure(g, (0.12, 0.6, 0.0), 0.25, coat="coat_okeefe", hat=None)
    pendant(g, 0.9, -1.3, 2.8, 0.5, power=70)
    g.finish()
    inside(sc)
    light("SPOT", (0.0, 3.2, 2.3), 500, "#b9d2ff", 0.12, spot=55, aim=(0.1, 1.0, 0.0))
    camera(sc, (0.55, -1.8, 1.5), (0.05, 0.7, 1.35), lens=35, shift_y=0.0, fstop=1.8, focus=(0.12, 0.6, 1.5))


@plate("G2", exposure=1.2)
def g2(sc):  # he tells the FBI everything
    g = Geo("i")
    room(g, -2.2, 2.2, -2.8, 2.2, 2.8, "wall_grey", "floorboard", dado="dado_green")
    table(g, 0, 0, 1.5, 0.8)
    figure(g, (0.0, 0.72, 0.02), 0.0, coat="coat_okeefe", hat=None, sit=True)
    figure(g, (-0.25, -0.75, 0.02), PI, coat="coat_agent", hat="brim", hatm="hat_grey", sit=True)
    figure(g, (-1.35, 1.35, 0.02), 0.6, coat="coat_agent", hat="brim", hatm="hat_black")
    for (x, y) in ((0.0, 0.95), (-0.25, -0.98)):  # chair backs
        g.box("wood_dark", (0.44, 0.05, 0.5), (x, y, 0.75))
    g.box("paper", (0.3, 0.22, 0.012), (0.1, 0.0, 0.787), rot=(0, 0, 0.2))
    g.box("frame_cream", (0.31, 0.23, 0.008), (0.14, -0.02, 0.796), rot=(0, 0, -0.1))
    g.cyl("glass_dark", 0.06, 0.05, 0.025, 8, (-0.45, 0.12, 0.792))
    g.cyl("paper", 0.04, 0.036, 0.09, 10, (0.5, -0.15, 0.825))
    g.box("glass_dark", (1.5, 0.03, 0.85), (-0.4, 2.18, 1.6))  # one-way glass
    g.box("iron", (1.6, 0.04, 0.95), (-0.4, 2.19, 1.6))
    pendant(g, 0.0, 0.0, 2.8, 1.0, power=95, r=0.36)
    g.finish()
    inside(sc)
    camera(sc, (1.5, -2.55, 1.65), (-0.15, 0.3, 1.05), lens=28, shift_y=-0.02, fstop=2.2, focus=(0.0, 0.72, 1.15))


@plate("G3", exposure=0.7)
def g3(sc):  # eight men, life in prison
    g = Geo("l")
    room(g, -3.0, 3.0, -6.6, 1.2, 3.0, "wall_grey", "slab_b")
    for k in range(7):
        g.box("ink", (6.0, 0.01, 0.012), (0, 1.19, 1.3 + k * 0.1))
    for x in (-1.2, -0.4, 0.4, 1.2):
        figure(g, (x, 0.1, 0.0), 0.0, coat="coat_prison", hat=None)
    g.box("slab_a", (6.0, 0.7, 0.32), (0, 0.85, 0.16))  # the back row stands on a step
    for x in (-1.6, -0.8, 0.0, 0.8):
        figure(g, (x + 0.4, 0.85, 0.32), 0.0, coat="coat_prison", hat=None)
    bars(g, -3.0, 3.0, -1.7, 0.0, 3.0, gap=0.25, r=0.02)
    for x in (-1.0, 1.0):
        g.box("iron", (0.5, 0.2, 0.06), (x, -0.4, 2.96))
        g.box("win_pale", (0.44, 0.16, 0.02), (x, -0.4, 2.92))
        light("POINT", (x, -0.4, 2.75), 40, "#fff0d8", 0.1)
    g.finish()
    inside(sc)
    camera(sc, (0.4, -5.6, 1.5), (0.0, 0.3, 1.3), lens=32, shift_y=0.02, fstop=2.0, focus=(0.0, 0.3, 1.4))


# ---------------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="comma-separated plate names")
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "..", "public", "fivekeys", "plates"))
    ap.add_argument("--scale", type=int, default=100)
    ap.add_argument("--samples", type=int, default=64)
    ap.add_argument("--threshold", type=float, default=0.02)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    from PIL import Image

    os.makedirs(args.out, exist_ok=True)
    names = args.only.split(",") if args.only else list(PLATES)
    for name in names:
        fn, o = PLATES[name]
        jpg = os.path.join(args.out, f"{name}.jpg")
        if os.path.exists(jpg) and not args.force:
            continue
        t0 = time.time()
        sc = reset()
        fn(sc)
        setup_render(sc, args.scale, args.samples, args.threshold, exposure=o.get("exposure", 1.1),
                     haze=o.get("haze", 0.0), bloom=o.get("bloom", 0.5))
        png = os.path.join(args.out, f"{name}.png")
        render(sc, png)
        Image.open(png).convert("RGB").save(jpg, quality=95)
        os.remove(png)
        print(f"plate {name}: {time.time() - t0:.1f} s", flush=True)


if __name__ == "__main__":
    main()
