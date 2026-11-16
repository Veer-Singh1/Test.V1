"""The downloaded dragon: "Animated Dragon Three Motion Loops" by LasquetiSpice
(https://sketchfab.com/3d-models/animated-dragon-three-motion-loops-eca98cf6cd084c1596cecf716e110c29),
CC-BY-4.0. Credit the author wherever the video is shared.

load() imports it under an empty, the "rig", that faces +Y like the dragon built in dragon.py, so the
same flight paths and cameras work. The model's own wingbeat (one action, "Flying") loops through the
NLA. Jaw and neck motion is keyed on top of it with pose_key(): those keys are rotations made in the
rig's frame (+X right, +Y forward, +Z up) and combine with the wingbeat rather than replace it.
"""
import math
import os

import bpy
from mathutils import Quaternion, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.path.join(HERE, "assets", "sketchfab", "dragon", "scene.gltf")
SRC_FPS = 24  # the importer keys animation at the scene's frame rate at import time, 24 by default
BASE_SPAN = 5.68  # wingspan of the model as imported, in metres
NECK = [f"neck_{i:02d}.{13 + i}_{13 + i}" for i in range(1, 12)] + ["head.25_25"]
JAW = "jaw_01.26_26"
MOUTH = "fireBreath.28_28"
CREDIT = ('"Animated Dragon Three Motion Loops" by LasquetiSpice '
          '(sketchfab.com/LasquetiSpice), CC BY 4.0')


def load(sc, wingspan=18.0, fps=30, speed=1.0, name="dragon"):
    """Returns (rig, armature). Animate the rig to fly it."""
    before = set(bpy.data.objects)
    fps0 = sc.render.fps
    sc.render.fps = SRC_FPS
    bpy.ops.import_scene.gltf(filepath=MODEL)
    sc.render.fps = fps0
    new = [o for o in bpy.data.objects if o not in before]
    for o in list(new):
        if o.name.startswith("Icosphere"):  # a stray helper sphere in the file
            new.remove(o)
            bpy.data.objects.remove(o)
    root = next(o for o in new if o.name.startswith("Sketchfab_model"))
    arm = next(o for o in new if o.type == "ARMATURE")
    rig = bpy.data.objects.new(name + "_rig", None)
    sc.collection.objects.link(rig)
    root.parent = rig
    root.scale = tuple(s * wingspan / BASE_SPAN for s in root.scale)
    # the model faces -Y; the rig's forward is +Y. Turn it on top of the importer's own rotation (its
    # Y-up to Z-up correction), which is kept in quaternion mode
    root.rotation_mode = "QUATERNION"
    root.rotation_quaternion = Quaternion((0, 0, 1), math.pi) @ root.rotation_quaternion
    bpy.context.view_layer.update()
    # put the rig's origin at the dragon's chest, so turns and banks pivot there
    chest = arm.matrix_world @ arm.pose.bones["spine_04.9_9"].head
    root.location = -(rig.matrix_world.inverted() @ chest)
    bpy.context.view_layer.update()

    ad = arm.animation_data
    act = ad.action
    track = ad.nla_tracks.new()
    track.name = "wingbeat"
    strip = track.strips.new("fly", int(act.frame_range[0]), act)
    strip.scale = fps / SRC_FPS / speed
    strip.repeat = 12
    ad.action = None
    ad.action_blend_type = "COMBINE"  # keys added later layer on top of the wingbeat
    for pb in arm.pose.bones:
        pb.rotation_mode = "QUATERNION"
    # the armature's orientation in the rig's frame, to turn rig-frame rotations into bone rotations
    arm["_rig_q"] = list((rig.matrix_world.inverted() @ arm.matrix_world).to_quaternion())
    return rig, arm


def pose_key(arm, frame, rotations):
    """Key extra rotations for this frame: {bone: Quaternion made in the rig's frame}.
    Bones keyed once should be keyed on every frame they move, back to the identity when done."""
    aq = Quaternion(arm["_rig_q"])
    for bone, q in rotations.items():
        pb = arm.pose.bones[bone]
        rest = pb.bone.matrix_local.to_quaternion()
        r = aq.inverted() @ q @ aq  # into the armature's space
        pb.rotation_quaternion = rest.inverted() @ r @ rest  # into the bone's own space
        pb.keyframe_insert("rotation_quaternion", frame=frame)


def jaw_key(arm, frame, open_angle):
    """Open the jaw by open_angle radians (0 = as the wingbeat has it)."""
    pb = arm.pose.bones[JAW]
    pb.rotation_quaternion = Quaternion((0, 0, 1), -open_angle)  # the jaw bone's -Z opens it
    pb.keyframe_insert("rotation_quaternion", frame=frame)


def neck_key(arm, frame, pitch, yaw=0.0):
    """Bend the whole neck: pitch > 0 raises the head (rearing back), < 0 lunges; yaw > 0 turns left."""
    n = len(NECK)
    q = Quaternion((0, 0, 1), yaw / n) @ Quaternion((1, 0, 0), pitch / n)
    pose_key(arm, frame, {b: q for b in NECK})


def mouth(arm, depsgraph=None):
    """World position of the mouth and the direction the head points, for the current frame."""
    ev = arm.evaluated_get(depsgraph or bpy.context.evaluated_depsgraph_get())
    pb = ev.pose.bones[MOUTH]
    m = ev.matrix_world @ pb.matrix @ pb.bone.matrix_local.inverted()  # rest -> posed, in world
    head = ev.pose.bones["head.25_25"]
    mh = ev.matrix_world @ head.matrix @ head.bone.matrix_local.inverted()
    fwd = (mh.to_3x3() @ Vector((0, -1, 0))).normalized()  # the model's forward is -Y at rest
    return m @ pb.bone.head_local, fwd
