"""Cold open: Lindisfarne, AD 793. Two dragons cross the night sky over the priory, one breathing fire:
"fiery dragons flying across the firmament". 8 seconds at 30 fps, 16:9.

  python blender/shot_lindisfarne.py --out out/dragons/shots/lindisfarne --width 960 --jpg
  python blender/shot_lindisfarne.py --out test.png --frame 120 --width 640
"""
import argparse
import json
import math
import os
import time

import bpy
from mathutils import Vector

import dragon
import dragon_model
import env_lindisfarne as L
from lib import render, reset, setup_render

N = 240


def fly(sc, rig, arm, start, end, n, bob=2.0, phase=0.0):
    """A straight crossing from start to end, gently rising and falling with the wingbeat."""
    d = (end - start).normalized()
    yaw = math.atan2(-d.x, d.y)
    rig.rotation_mode = "XYZ"
    for f in range(1, n + 1):
        u = (f - 1) / (n - 1)
        rig.location = start.lerp(end, u) + Vector((0, 0, bob * math.sin(2 * math.pi * u * 2.4 + phase)))
        rig.rotation_euler = (0.04, 0.0, yaw)
        rig.keyframe_insert("location", frame=f)
        rig.keyframe_insert("rotation_euler", frame=f)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--frame", type=int)
    ap.add_argument("--start", type=int, default=1)
    ap.add_argument("--end", type=int, default=N)
    ap.add_argument("--width", type=int, default=960)
    ap.add_argument("--samples", type=int, default=10)
    ap.add_argument("--jpg", action="store_true")
    args = ap.parse_args()

    t0 = time.time()
    sc = reset()
    sc.render.fps = 30
    sc.frame_start, sc.frame_end = 1, N
    info = L.build(sc)
    pos, at, lens = info["cameras"]["beach"]
    pos, at = Vector(pos), Vector(at)
    fwd = (at - pos).normalized()
    right = fwd.cross(Vector((0, 0, 1))).normalized()
    up = right.cross(fwd).normalized()

    # the camera tilts slowly up from the priory into the sky as the dragons pass
    cam = L.camera(sc, (pos, at, lens))
    for f in range(1, N + 1):
        u = dragon.smooth((f - 1) / (N - 1))
        look = at + up * (-10 + 24 * u) + right * (6 * u)
        cam.location = pos + fwd * (2.0 * u)
        cam.rotation_euler = (look - cam.location).to_track_quat("-Z", "Y").to_euler()
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_euler", frame=f)

    # two big dragons crossing right to left, high over the island; the nearer one breathes fire
    dragon.SMOOTH_SKIN = True
    dragon.FIRE_SCALE = 2.2
    dragon.BURSTS = [(2.4, 5.6)]
    sky = pos + fwd * 150 + up * 34
    near_rig, near_arm = dragon_model.load(sc, wingspan=34.0, name="near")
    fly(sc, near_rig, near_arm, sky + right * 160 - fwd * 20, sky - right * 140 + up * 6, N)
    far_rig, far_arm = dragon_model.load(sc, wingspan=34.0, name="far", speed=0.9)
    fly(sc, far_rig, far_arm, sky + right * 220 + fwd * 110 + up * 22, sky - right * 110 + fwd * 130 + up * 30, N,
        phase=1.7)
    for f in range(1, N + 1):
        t = (f - 1) / 30
        e = dragon.fire_env(t)
        dragon_model.jaw_key(near_arm, f, 0.1 + 0.5 * e)
        dragon_model.neck_key(near_arm, f, -0.25 * e)
    track = dragon.mouth_track_model(sc, near_arm, N)
    puffs = dragon.build_fire(sc, track, N)

    setup_render(sc, 100, args.samples, 0.05, 3, exposure=L.EXPOSURE, fast=True)
    sc.render.resolution_x = args.width
    sc.render.resolution_y = 2 * round(args.width * 9 / 32)
    sc.render.resolution_percentage = 100
    L.look(sc)
    sc.cycles.transparent_max_bounces = 64
    if args.jpg:
        sc.render.image_settings.file_format, sc.render.image_settings.quality = "JPEG", 95
    print(f"built in {time.time() - t0:.1f} s, {puffs} fire puffs", flush=True)
    if args.frame:
        t0 = time.time()
        render(sc, args.out, args.frame)
        print(f"frame {args.frame}: {time.time() - t0:.1f} s", flush=True)
        return
    os.makedirs(args.out, exist_ok=True)
    ext = "jpg" if args.jpg else "png"
    log = os.path.join(args.out, "times.json")
    times = json.load(open(log)) if os.path.exists(log) else {}
    for f in range(args.start, args.end + 1):
        path = os.path.join(args.out, f"{f:04d}.{ext}")
        if os.path.exists(path):
            continue
        t0 = time.time()
        render(sc, path, f)
        times[str(f)] = round(time.time() - t0, 2)
        json.dump(times, open(log, "w"))
        print(f"frame {f}/{N}: {time.time() - t0:.1f} s", flush=True)


if __name__ == "__main__":
    main()
