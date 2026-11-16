"""A dragon flies over snowy mountains at sunset and breathes fire. 10 seconds at 30 fps.

The default look uses free CC0 assets from Poly Haven (polyhaven.com), downloaded on the first run into
blender/assets/polyhaven/: the Belfast Sunset (Pure Sky) HDRI for the sky and its light, the
fir_sapling_medium tree model, and the snow_02 and aerial_rocks_02 textures on a large mountain terrain.
--lowpoly gives the earlier faceted look instead, with Quaternius's low-poly models described below.

The dragon is built here from faceted shapes on a skeleton (an armature), so its wings, neck, jaw and
tail bend as it flies. The scenery is free CC0 (public domain) models by Quaternius: mountains, clouds,
pine trees and rocks. They are in blender/assets/quaternius/; any that are missing are downloaded from a
public mirror of Quaternius's packs on the first run.

  python blender/dragon.py --out out/dragon/frames --scale 50 --samples 8 --fast
  python blender/dragon.py --out test.png --frame 120 --scale 50 --samples 8 --fast

Frames can be split between computers with --start/--end (see README). Needs bpy (pip install bpy).
"""
import argparse
import json
import math
import os
import random
import time
import urllib.request

from lib import MAT, M, compositor, get_mat, render, reset, setup_render, srgb
import dragon_model

import bpy
import bmesh
from mathutils import Euler, Matrix, Quaternion, Vector, noise

FPS = 30
FRAMES = 300
HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets", "quaternius")
MIRROR = "https://raw.githubusercontent.com/trebeljahr/quaternius-showcase/main/public/glb/"
MODELS = {  # file here: path on the mirror. All CC0, by Quaternius (quaternius.com)
    "mountains_a.glb": "real_time_strategy_pack/Mountain_Group_1.glb",
    "mountains_b.glb": "real_time_strategy_pack/Mountain_Group_2.glb",
    "mountain_large.glb": "real_time_strategy_pack/MountainLarge_Single.glb",
    "mountain_small.glb": "real_time_strategy_pack/Mountain_Single.glb",
    "cloud_a.glb": "platformer_game_pack/Cloud_1.glb",
    "cloud_c.glb": "platformer_game_pack/Cloud_3.glb",
    "cloud_d.glb": "platformer_game_pack/Cloud_2.glb",
    "pine_snow.glb": "nature_pack/PineTree_Snow_1.glb",
    "pine_a.glb": "nature_pack/PineTree_1.glb",
    "pine_b.glb": "nature_pack/PineTree_3.glb",
    "rock_snow.glb": "nature_pack/Rock_Snow_1.glb",
}
SUN = Vector((0.85, -0.45, 0.08)).normalized()  # towards the sun: low, behind the dragon as the camera sees it
# The sun in the Poly Haven sky (its brightest pixel) is 2 degrees up at -0.659 rad from +X. The sky is
# turned so it sets at SUN_AZ, just right of frame for most of the shot; the sun lamp matches, a little higher.
HDRI_SUN_AZ, SUN_AZ = -0.659, -0.35
SUN_REAL = Vector((math.cos(SUN_AZ) * math.cos(0.07), math.sin(SUN_AZ) * math.cos(0.07), math.sin(0.07)))
PH = os.path.join(HERE, "assets", "polyhaven")
UA = {"User-Agent": "lowpoly-explainer-render/1.0"}  # Poly Haven refuses Python's default one
BURSTS = [(2.9, 5.0), (6.6, 9.3)]  # seconds when it breathes fire


def translucent(amount):
    """Material setup: let some light through, as thin skin and cloud edges do against the sun."""
    def setup(m):
        nt = m.node_tree
        p = next(n for n in nt.nodes if n.bl_idname == "ShaderNodeBsdfPrincipled")
        out = next(n for n in nt.nodes if n.bl_idname == "ShaderNodeOutputMaterial")
        tr, mix = nt.nodes.new("ShaderNodeBsdfTranslucent"), nt.nodes.new("ShaderNodeMixShader")
        tr.inputs["Color"].default_value = p.inputs["Base Color"].default_value
        mix.inputs[0].default_value = amount
        nt.links.new(p.outputs[0], mix.inputs[1])
        nt.links.new(tr.outputs[0], mix.inputs[2])
        nt.links.new(mix.outputs[0], out.inputs["Surface"])
    return setup


def scales(m):
    """Material setup: a fine pattern of raised scales, as a bump on the skin."""
    nt = m.node_tree
    p = next(n for n in nt.nodes if n.bl_idname == "ShaderNodeBsdfPrincipled")
    tc, vor, bump = nt.nodes.new("ShaderNodeTexCoord"), nt.nodes.new("ShaderNodeTexVoronoi"), nt.nodes.new("ShaderNodeBump")
    vor.feature = "DISTANCE_TO_EDGE"
    vor.inputs["Scale"].default_value = 9.0
    bump.inputs["Strength"].default_value, bump.inputs["Distance"].default_value = 0.35, 0.03
    nt.links.new(tc.outputs["Object"], vor.inputs["Vector"])
    nt.links.new(vor.outputs["Distance"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], p.inputs["Normal"])


M("dr_scale", "#7c1b15", rough=0.5, coat=0.2, vary=0.15)
M("dr_scale_real", "#6e1712", rough=0.42, coat=0.35, vary=0.2, setup=scales)
M("dr_belly", "#c0824a", rough=0.6)
M("dr_membrane", "#5e1610", rough=0.65, setup=translucent(0.45))
M("dr_horn", "#e3d4b2", rough=0.45)
M("dr_spike", "#2a0c0a", rough=0.45)
M("dr_mouth", "#3d0606", rough=0.5)
M("dr_tooth", "#efe6d2", rough=0.35)
M("dr_eye", "#ffb347", emit="#ffb347", strength=14.0)


def snow_patches(m):
    """Material setup: snow, broken by patches of bare ground."""
    nt = m.node_tree
    p = next(n for n in nt.nodes if n.bl_idname == "ShaderNodeBsdfPrincipled")
    tc, nz, ramp = nt.nodes.new("ShaderNodeTexCoord"), nt.nodes.new("ShaderNodeTexNoise"), nt.nodes.new("ShaderNodeValToRGB")
    nz.inputs["Scale"].default_value, nz.inputs["Detail"].default_value = 0.035, 6.0
    a, b = ramp.color_ramp.elements
    a.position, a.color = 0.32, srgb("#5b564a")
    b.position, b.color = 0.58, srgb("#d6d0d8")
    nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
    nt.links.new(nz.outputs[0], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], p.inputs["Base Color"])


M("dr_ground", "#d6d0d8", rough=0.9, setup=snow_patches)
M("dr_cloud", "#f6e4dc", rough=1.0, emit="#f2c9bd", strength=0.15, setup=translucent(0.5))

rng = random.Random(7)
SMOOTH_SKIN = False  # set by build(): rounded, subdivided skin for the realistic look


# ------------------------------------------------------------------ assets
def fetch():
    os.makedirs(ASSETS, exist_ok=True)
    for name, path in MODELS.items():
        dst = os.path.join(ASSETS, name)
        if not os.path.exists(dst):
            print(f"downloading {path}", flush=True)
            urllib.request.urlretrieve(MIRROR + path, dst + ".part")
            os.replace(dst + ".part", dst)


def load(name, material=None):
    """Import a model once; return its mesh with the object's transform baked in."""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ASSETS, name))
    bpy.context.view_layer.update()
    new = [o for o in bpy.data.objects if o not in before]
    ob = next(o for o in new if o.type == "MESH")
    me = ob.data
    me.transform(ob.matrix_world)
    if material:
        me.materials.clear()
        me.materials.append(get_mat(material))
    for o in new:
        bpy.data.objects.remove(o)
    return me


def place(me, loc, scale, rot=0.0):
    ob = bpy.data.objects.new(me.name, me)  # shares the mesh: Cycles stores it once
    ob.location, ob.scale, ob.rotation_euler = loc, (scale,) * 3, (0, 0, rot)
    bpy.context.scene.collection.objects.link(ob)
    return ob


# ------------------------------------------------------------------ the dragon
# Bones in the dragon's own space: +Y forward, +Z up, +X its right; metres.
BONES = {
    "body": ((0, -1.6, 0.0), (0, 1.8, 0.15), None),
    "neck1": ((0, 1.8, 0.15), (0, 2.9, 0.75), "body"),
    "neck2": ((0, 2.9, 0.75), (0, 3.9, 1.3), "neck1"),
    "neck3": ((0, 3.9, 1.3), (0, 4.9, 1.6), "neck2"),
    "head": ((0, 4.9, 1.6), (0, 6.9, 1.5), "neck3"),
    "jaw": ((0, 5.3, 1.36), (0, 7.1, 1.26), "head"),
    "hips": ((0, -1.6, 0.0), (0, -3.2, -0.1), "body"),
    "tail1": ((0, -3.2, -0.1), (0, -5.2, -0.25), "hips"),
    "tail2": ((0, -5.2, -0.25), (0, -7.2, -0.35), "tail1"),
    "tail3": ((0, -7.2, -0.35), (0, -9.2, -0.4), "tail2"),
    "tail4": ((0, -9.2, -0.4), (0, -11.2, -0.4), "tail3"),
}
for _s, _n in ((1, "R"), (-1, "L")):
    BONES[f"upper.{_n}"] = ((0.55 * _s, 0.9, 0.55), (3.6 * _s, 0.5, 0.95), "body")
    BONES[f"fore.{_n}"] = ((3.6 * _s, 0.5, 0.95), (6.8 * _s, 1.1, 0.95), f"upper.{_n}")
    BONES[f"hand.{_n}"] = ((6.8 * _s, 1.1, 0.95), (9.0 * _s, 0.5, 0.85), f"fore.{_n}")
SPINE = ["tail4", "tail3", "tail2", "tail1", "hips", "body", "neck1", "neck2", "neck3", "head"]
MOUTH = Vector((0, 7.05, 1.4))  # rest position, between the tips of the jaws


def spine_w(p):
    """Skin weights for a point on the body: the two nearest spine bones, blended smoothly."""
    p = Vector(p)
    ws = []
    for b in SPINE:
        a, c = Vector(BONES[b][0]), Vector(BONES[b][1])
        d = c - a
        t = max(0.0, min(1.0, (p - a).dot(d) / d.length_squared))
        ws.append((math.exp(-((p - (a + d * t)).length / 0.9) ** 2), b))
    ws = sorted(ws, reverse=True)[:2]
    tot = sum(w for w, _ in ws)
    return {b: w / tot for w, b in ws if w / tot > 0.02}


def blend(wa, wb, t):
    out = {}
    for w, k in ((wa, 1 - t), (wb, t)):
        for b, x in w.items():
            out[b] = out.get(b, 0) + x * k
    return out


class Skin:
    """One mesh whose vertices each follow one or more bones."""

    def __init__(self):
        self.co, self.w, self.faces = [], [], []

    def add(self, bm, mat, w):
        bm.verts.index_update()
        base = len(self.co)
        for v in bm.verts:
            self.co.append(v.co.copy())
            self.w.append(w(v.co) if callable(w) else w)
        for f in bm.faces:
            self.faces.append(([base + v.index for v in f.verts], mat))
        bm.free()

    def vert(self, p, w):
        self.co.append(Vector(p))
        self.w.append(w)
        return len(self.co) - 1

    def face(self, idx, mat):
        self.faces.append((list(idx), mat))

    def finish(self, arm):
        mats = sorted({m for _, m in self.faces})
        me = bpy.data.meshes.new("dragon")
        me.from_pydata([tuple(c) for c in self.co], [], [f for f, _ in self.faces])
        for m in mats:
            me.materials.append(get_mat(m))
        index = {m: i for i, m in enumerate(mats)}
        me.polygons.foreach_set("material_index", [index[m] for _, m in self.faces])
        me.update()
        ob = bpy.data.objects.new("dragon_skin", me)
        bpy.context.scene.collection.objects.link(ob)
        groups = {}
        for i, w in enumerate(self.w):
            for b, x in w.items():
                if b not in groups:
                    groups[b] = ob.vertex_groups.new(name=b)
                groups[b].add([i], x, "REPLACE")
        ob.parent = arm
        ob.modifiers.new("bones", "ARMATURE").object = arm
        if SMOOTH_SKIN:
            me.shade_smooth()
            sub = ob.modifiers.new("smooth", "SUBSURF")
            sub.levels, sub.render_levels = 0, 1
        return ob


def cone(r1, r2, a, b, seg=6):
    a, b = Vector(a), Vector(b)
    d = b - a
    q = Vector((0, 0, 1)).rotation_difference(d.normalized())
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r1, radius2=max(r2, 0.004),
                          depth=d.length, matrix=Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4())
    return bm


def ico(r, loc, scale=(1, 1, 1), rot=(0, 0, 0), sub=1):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r,
                               matrix=Matrix.LocRotScale(Vector(loc), Euler(rot), Vector(scale)))
    return bm


def loft(sk, rings, n, mats, weight):
    """A faceted tube through rings of (y, z, half width, half height), ordered tail to head.
    mats(angle) picks each face's material; weight(centre) gives the ring's bone weights."""
    idx = []
    for i, (y, z, rx, rz) in enumerate(rings):
        c = Vector((0, y, z))
        j0, j1 = max(0, i - 1), min(len(rings) - 1, i + 1)
        tan = Vector((0, rings[j1][0] - rings[j0][0], rings[j1][1] - rings[j0][1])).normalized()
        side = Vector((1, 0, 0))
        up = side.cross(tan).normalized()
        w = weight(c)
        idx.append([sk.vert(c + side * (rx * math.cos(a)) + up * (rz * math.sin(a)), w)
                    for a in (2 * math.pi * (k + 0.5) / n for k in range(n))])
    for i in range(len(rings) - 1):
        for k in range(n):
            k2 = (k + 1) % n
            a = 2 * math.pi * (k + 1) / n
            sk.face([idx[i][k], idx[i][k2], idx[i + 1][k2], idx[i + 1][k]], mats(a))
    for ring, flip in ((idx[0], True), (idx[-1], False)):
        sk.face(ring[::-1] if flip else ring, mats(math.pi / 2))
    return idx


def build_dragon(sc):
    arm_data = bpy.data.armatures.new("dragon")
    arm = bpy.data.objects.new("dragon", arm_data)
    sc.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    arm.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    for name, (h, t, parent) in BONES.items():
        eb = arm_data.edit_bones.new(name)
        eb.head, eb.tail, eb.roll = h, t, 0.0
        if parent:
            eb.parent = arm_data.edit_bones[parent]
            eb.use_connect = (Vector(h) - Vector(BONES[parent][1])).length < 1e-4
    bpy.ops.object.mode_set(mode="OBJECT")

    sk = Skin()
    belly = lambda lo: (lambda a: "dr_belly" if math.sin(a - math.pi / 8) < lo else "dr_scale")
    if SMOOTH_SKIN:
        get_mat("dr_scale_real")
        MAT["dr_scale"] = MAT["dr_scale_real"]  # same faces, the scaled skin
    # body, from the tail tip to the base of the skull: (y, z, half width, half height)
    key = [(-11.4, -0.4, 0.04, 0.04), (-10.0, -0.4, 0.12, 0.13), (-8.5, -0.38, 0.2, 0.22), (-7.0, -0.33, 0.28, 0.3),
           (-5.5, -0.26, 0.4, 0.42), (-4.0, -0.15, 0.58, 0.6), (-2.6, -0.05, 0.8, 0.82), (-1.2, 0.0, 0.98, 0.98),
           (0.2, -0.05, 1.08, 1.05), (1.3, 0.1, 0.98, 0.95), (2.1, 0.35, 0.68, 0.7), (2.8, 0.7, 0.5, 0.52),
           (3.5, 1.08, 0.43, 0.45), (4.2, 1.4, 0.39, 0.41), (4.95, 1.62, 0.36, 0.38)]
    rings = []
    for a, b in zip(key, key[1:]):
        rings += [a, tuple((x + y) / 2 for x, y in zip(a, b))]
    rings.append(key[-1])
    loft(sk, rings, 8, belly(-0.55), spine_w)
    # skull, its underside is the inside of the mouth; then the lower jaw
    loft(sk, [(4.8, 1.62, 0.36, 0.36), (5.3, 1.8, 0.46, 0.42), (5.9, 1.79, 0.42, 0.37), (6.5, 1.67, 0.32, 0.27),
              (7.0, 1.59, 0.24, 0.2), (7.32, 1.56, 0.16, 0.13)], 8,
         lambda a: "dr_mouth" if math.sin(a - math.pi / 8) < -0.6 else "dr_scale", lambda c: {"head": 1.0})
    loft(sk, [(5.15, 1.32, 0.34, 0.16), (5.9, 1.3, 0.32, 0.13), (6.6, 1.28, 0.24, 0.1), (7.15, 1.28, 0.15, 0.07)], 8,
         lambda a: "dr_mouth" if math.sin(a - math.pi / 8) > 0.6 else "dr_belly", lambda c: {"jaw": 1.0})
    for s in (1, -1):
        sk.add(ico(0.085, (0.31 * s, 5.78, 1.93), (1, 1.3, 0.8)), "dr_eye", {"head": 1.0})
        sk.add(cone(0.1, 0.05, (0.28 * s, 5.55, 2.02), (0.4 * s, 5.2, 2.22), 5), "dr_spike", {"head": 1.0})  # brow
        sk.add(cone(0.14, 0.08, (0.22 * s, 5.25, 2.05), (0.42 * s, 4.6, 2.55), 6), "dr_horn", {"head": 1.0})
        sk.add(cone(0.08, 0.0, (0.42 * s, 4.6, 2.55), (0.52 * s, 3.85, 2.78), 6), "dr_horn", {"head": 1.0})
        sk.add(cone(0.09, 0.0, (0.38 * s, 5.3, 1.55), (0.8 * s, 4.75, 1.62), 5), "dr_horn", {"head": 1.0})  # cheek
        sk.add(cone(0.06, 0.0, (0.3 * s, 5.4, 1.32), (0.62 * s, 5.0, 1.12), 5), "dr_horn", {"jaw": 1.0})
        for i in range(6):
            y = 5.95 + i * 0.22
            hw = 0.4 - 0.27 * (y - 5.9) / 1.4
            sk.add(cone(0.035, 0.0, (hw * s, y, 1.47), (hw * s, y, 1.33), 4), "dr_tooth", {"head": 1.0})
            sk.add(cone(0.03, 0.0, ((hw - 0.06) * s, y + 0.1, 1.36), ((hw - 0.06) * s, y + 0.1, 1.47), 4), "dr_tooth",
                   {"jaw": 1.0})
    # spikes down the back, getting smaller towards the tail
    for y, z, rx, rz in rings[2:-2:2]:
        if y > 4.6:
            continue
        base = Vector((0, y, z + rz * 0.88))
        h = 0.12 + 0.42 * rz
        sk.add(cone(0.1 + 0.12 * rz, 0.0, base, base + Vector((0, -0.45 * h, h)), 4), "dr_spike", spine_w((0, y, z)))
    sk.add(ico(0.55, (0, -11.75, -0.4), (0.75, 1.0, 0.09), (0, 0, math.pi / 4)), "dr_spike", {"tail4": 1.0})  # tail spade

    for s, n in ((1, "R"), (-1, "L")):
        up, fo, ha = f"upper.{n}", f"fore.{n}", f"hand.{n}"
        P = lambda x, y, z: Vector((x * s, y, z))
        S, E, W = P(0.55, 0.9, 0.55), P(3.6, 0.5, 0.95), P(6.8, 1.1, 0.95)
        F1, F2, F3, F4, H = P(10.2, -0.4, 0.85), P(8.4, -2.4, 0.75), P(6.0, -3.3, 0.65), P(3.4, -3.1, 0.5), P(0.75, -2.6, 0.2)
        wt = {"S": {"body": 1.0}, "E": {up: 1.0}, "W": {fo: 1.0}, "F1": {ha: 1.0}, "F2": {ha: 1.0},
              "F3": {ha: 0.5, fo: 0.5}, "F4": {up: 0.5, fo: 0.5}, "H": {"hips": 0.5, "body": 0.5}}
        pt = dict(S=S, E=E, W=W, F1=F1, F2=F2, F3=F3, F4=F4, H=H)
        v = {k: sk.vert(p, wt[k]) for k, p in pt.items()}
        for a, b, toward, name in (("F1", "F2", W, "M12"), ("F2", "F3", W, "M23"), ("F3", "F4", E, "M34"), ("F4", "H", S, "M4H")):
            mid = (pt[a] + pt[b]) / 2
            v[name] = sk.vert(mid + (toward - mid) * 0.2, blend(wt[a], wt[b], 0.5))  # scalloped trailing edge
        for tri in (("W", "F1", "M12"), ("W", "M12", "F2"), ("W", "F2", "M23"), ("W", "M23", "F3"), ("E", "W", "F3"),
                    ("E", "F3", "M34"), ("E", "M34", "F4"), ("S", "E", "F4"), ("S", "F4", "M4H"), ("S", "M4H", "H")):
            sk.face([v[k] for k in tri], "dr_membrane")

        def rod(a, b, r1, r2, mat="dr_scale", seg=6):
            pa, pb = pt[a] if isinstance(a, str) else a, pt[b] if isinstance(b, str) else b
            wa, wb = wt[a] if isinstance(a, str) else wt["W"], wt[b] if isinstance(b, str) else wt["W"]
            d = pb - pa
            sk.add(cone(r1, r2, pa, pb, seg), mat,
                   lambda co: blend(wa, wb, max(0.0, min(1.0, (Vector(co) - pa).dot(d) / d.length_squared))))

        rod("S", "E", 0.2, 0.13)
        rod("E", "W", 0.13, 0.09)
        rod("W", "F1", 0.075, 0.02)
        rod("W", "F2", 0.055, 0.015)
        rod("W", "F3", 0.05, 0.015)
        sk.add(ico(0.16, W, (1, 1, 0.8)), "dr_scale", {fo: 1.0})
        sk.add(cone(0.06, 0.0, W, W + P(0.12, 0.5, 0.18), 5), "dr_horn", {fo: 1.0})  # thumb claw
        # legs, tucked up in flight
        sk.add(ico(0.42, P(0.72, -2.1, -0.35), (0.8, 1.4, 1.0)), "dr_scale", {"hips": 1.0})
        sk.add(cone(0.22, 0.13, P(0.85, -2.4, -0.6), P(0.8, -3.4, -1.0)), "dr_scale", {"hips": 1.0})
        sk.add(cone(0.12, 0.05, P(0.8, -3.4, -1.0), P(0.75, -4.05, -0.95)), "dr_scale", {"hips": 1.0})
        sk.add(cone(0.17, 0.1, P(0.6, 1.1, -0.55), P(0.72, 1.7, -1.0)), "dr_scale", {"body": 1.0})
        sk.add(cone(0.1, 0.06, P(0.72, 1.7, -1.0), P(0.62, 2.3, -0.85)), "dr_scale", {"body": 1.0})
        for k in (-1, 0, 1):
            sk.add(cone(0.035, 0.0, P(0.75 + 0.07 * k, -4.0, -0.95), P(0.75 + 0.1 * k, -4.3, -1.05), 4), "dr_horn", {"hips": 1.0})
            sk.add(cone(0.03, 0.0, P(0.62 + 0.06 * k, 2.3, -0.85), P(0.62 + 0.08 * k, 2.55, -0.98), 4), "dr_horn", {"body": 1.0})
    sk.finish(arm)
    return arm


# ------------------------------------------------------------------ motion
def smooth(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def window(t, a, b, rin, rout):
    return smooth((t - a) / rin) * (1 - smooth((t - b) / rout))


def fire_env(t):
    return max(window(t, a, b, 0.12, 0.25) for a, b in BURSTS)


def rear_env(t):
    return max(window(t, a - 0.6, a - 0.05, 0.3, 0.2) for a, b in BURSTS)


def path(t):
    """Where the dragon's body is (without the bob of its wingbeats), and its heading."""
    p = Vector((6 * math.sin(0.21 * t), 13.0 * t, 74 + 1.8 * math.sin(0.45 * t)))
    return p, math.atan2(-6 * 0.21 * math.cos(0.21 * t), 13.0)


def animate_dragon(arm, n):
    pbs = arm.pose.bones
    for pb in pbs:
        pb.rotation_mode = "QUATERNION"
    rest = {pb.name: pb.bone.matrix_local.to_quaternion() for pb in pbs}
    X, Y, Z = Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))
    arm.rotation_mode = "XYZ"
    phase = 0.0
    for f in range(1, n + 1):
        t = (f - 1) / FPS
        fire, rear = fire_env(t), rear_env(t)
        A = 1 - 0.35 * fire  # smaller wingbeats while it breathes fire
        sw = math.sin(phase)
        R = {}
        for s, side in ((1, "R"), (-1, "L")):
            wing = lambda up, sweep: Quaternion(Z, s * sweep) @ Quaternion(Y, -s * up)
            R[f"upper.{side}"] = wing(0.18 + 0.72 * A * sw, 0.12 * A * math.cos(phase))
            R[f"fore.{side}"] = wing(0.08 + 0.3 * A * math.sin(phase - 0.7), 0.0)
            R[f"hand.{side}"] = wing(-0.05 + 0.4 * A * math.sin(phase - 1.3), -0.18 * A * (0.5 - 0.5 * math.sin(phase - 0.6)))
        sweep = 0.22 * math.sin(2 * math.pi * (t - 6.6) / 2.7) * window(t, 6.6, 9.3, 0.3, 0.3)
        R["neck1"] = Quaternion(X, 0.10 * rear - 0.06 * fire + 0.04 * sw)
        R["neck2"] = Quaternion(Z, 0.4 * sweep) @ Quaternion(X, 0.16 * rear - 0.10 * fire)
        R["neck3"] = Quaternion(Z, 0.3 * sweep) @ Quaternion(X, 0.12 * rear - 0.06 * fire - 0.03 * sw)
        R["head"] = Quaternion(Z, 0.3 * sweep) @ Quaternion(X, 0.22 * rear - 0.14 * fire - 0.02 * sw)
        jaw = 0.12 * rear + 0.5 * fire + 0.06 * fire * math.sin(t * 37)
        R["jaw"] = Quaternion(X, -jaw)
        R["hips"] = Quaternion(X, 0.03 * sw)
        for k, b in enumerate(("tail1", "tail2", "tail3", "tail4"), 1):
            R[b] = Quaternion(Z, 0.10 * math.sin(0.5 * phase - 0.8 * k)) @ Quaternion(X, 0.05 * math.sin(phase - 0.9 * k))
        for name, q in R.items():
            pbs[name].rotation_quaternion = rest[name].inverted() @ q @ rest[name]
            pbs[name].keyframe_insert("rotation_quaternion", frame=f)
        p, yaw = path(t)
        arm.location = p + Vector((0, 0, -0.35 * A * sw))
        lateral = -6 * 0.21 ** 2 * math.sin(0.21 * t)
        arm.rotation_euler = (0.05 * A * math.cos(phase) + 0.08 * rear - 0.04 * fire, 0.25 * lateral, yaw)
        arm.keyframe_insert("location", frame=f)
        arm.keyframe_insert("rotation_euler", frame=f)
        phase += 2 * math.pi * (0.85 - 0.15 * fire) / FPS


def animate_rig(rig, arm, n):
    """Fly the downloaded model along the same path: it banks into the turns, rears its head back before
    each burst and lunges into it, sweeps its neck through the second, and opens its jaw. Its own
    wingbeat keeps playing underneath."""
    rig.rotation_mode = "XYZ"
    for f in range(1, n + 1):
        t = (f - 1) / FPS
        fire, rear = fire_env(t), rear_env(t)
        p, yaw = path(t)
        lateral = -6 * 0.21 ** 2 * math.sin(0.21 * t)
        rig.location = p
        rig.rotation_euler = (0.06 * rear - 0.03 * fire, 0.25 * lateral, yaw)
        rig.keyframe_insert("location", frame=f)
        rig.keyframe_insert("rotation_euler", frame=f)
        sweep = 0.22 * math.sin(2 * math.pi * (t - 6.6) / 2.7) * window(t, 6.6, 9.3, 0.3, 0.3)
        dragon_model.neck_key(arm, f, 0.55 * rear - 0.35 * fire, sweep)
        dragon_model.jaw_key(arm, f, 0.15 * rear + 0.55 * fire + 0.06 * fire * math.sin(t * 37))


def mouth_track_model(sc, arm, n):
    """The mouth track for the downloaded model: its fireBreath bone, aimed out of the open jaw."""
    out = []
    for f in range(1, n + 1):
        sc.frame_set(f)
        p, d = dragon_model.mouth(arm)
        side = d.cross(Vector((0, 0, 1))).normalized()
        d = (Quaternion(side, -0.22) @ d).normalized()  # a little below the line of the head
        out.append((p + d * 0.3, d))
    vel = [(out[min(i + 1, n - 1)][0] - out[max(i - 1, 0)][0]) * (FPS / 2) for i in range(n)]
    return [(p, d, v) for (p, d), v in zip(out, vel)]


def mouth_track(sc, arm, n):
    """Where the mouth is, which way it points, and how fast it moves, at every frame."""
    out = []
    for f in range(1, n + 1):
        sc.frame_set(f)
        ev = arm.evaluated_get(bpy.context.evaluated_depsgraph_get())
        pb = ev.pose.bones["head"]
        m = ev.matrix_world @ pb.matrix @ pb.bone.matrix_local.inverted()
        d = (m.to_3x3() @ Vector((0, 1, -0.24))).normalized()  # between the jaws, pitched down
        out.append((m @ MOUTH, d))
    vel = [(out[min(i + 1, n - 1)][0] - out[max(i - 1, 0)][0]) * (FPS / 2) for i in range(n)]
    return [(p, d, v) for (p, d), v in zip(out, vel)]


def at(track, ft):
    """The mouth track at a fractional frame."""
    i = max(0, min(len(track) - 2, int(ft) - 1))
    k = max(0.0, min(1.0, ft - 1 - i))
    a, b = track[i], track[i + 1]
    return a[0].lerp(b[0], k), a[1].lerp(b[1], k).normalized(), a[2].lerp(b[2], k)


# ------------------------------------------------------------------ fire
def fire_material():
    """Colour comes from each puff's object colour (keyed per frame), its alpha is the heat, and the
    custom property "fade" is how solid it is. Hot puffs glow; cooled ones turn to grey smoke."""
    m = bpy.data.materials.new("dr_fire")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    info, fade = nt.nodes.new("ShaderNodeObjectInfo"), nt.nodes.new("ShaderNodeAttribute")
    fade.attribute_type, fade.attribute_name = "OBJECT", "fade"
    emit, smoke, trans = nt.nodes.new("ShaderNodeEmission"), nt.nodes.new("ShaderNodeBsdfDiffuse"), nt.nodes.new("ShaderNodeBsdfTransparent")
    strength, hot = nt.nodes.new("ShaderNodeMath"), nt.nodes.new("ShaderNodeMath")
    strength.operation, strength.inputs[1].default_value = "MULTIPLY", 18.0 if SMOOTH_SKIN else 9.0
    hot.operation, hot.inputs[1].default_value, hot.use_clamp = "MULTIPLY", 3.0, True
    mix1, mix2, out = nt.nodes.new("ShaderNodeMixShader"), nt.nodes.new("ShaderNodeMixShader"), nt.nodes.new("ShaderNodeOutputMaterial")
    L = nt.links.new
    L(info.outputs["Color"], emit.inputs["Color"])
    L(info.outputs["Alpha"], strength.inputs[0])
    L(strength.outputs[0], emit.inputs["Strength"])
    L(info.outputs["Color"], smoke.inputs["Color"])
    L(info.outputs["Alpha"], hot.inputs[0])
    L(hot.outputs[0], mix1.inputs[0])
    L(smoke.outputs[0], mix1.inputs[1])
    L(emit.outputs[0], mix1.inputs[2])
    if SMOOTH_SKIN:
        # feather the edges: a puff is solid where it faces the camera and fades out towards its outline,
        # so the smooth spheres read as soft volume instead of balls
        lw, inv, pw, mul = (nt.nodes.new("ShaderNodeLayerWeight"), nt.nodes.new("ShaderNodeMath"),
                            nt.nodes.new("ShaderNodeMath"), nt.nodes.new("ShaderNodeMath"))
        lw.inputs["Blend"].default_value = 0.5
        inv.operation, inv.inputs[0].default_value = "SUBTRACT", 1.0
        pw.operation, pw.inputs[1].default_value = "POWER", 2.0
        mul.operation = "MULTIPLY"
        L(lw.outputs["Facing"], inv.inputs[1])
        L(inv.outputs[0], pw.inputs[0])
        L(pw.outputs[0], mul.inputs[0])
        L(fade.outputs["Fac"], mul.inputs[1])
        # ragged flames: a noise pattern fixed to each puff (so it tumbles with it) cuts holes and
        # varies the glow, instead of every puff being a smooth disc
        tc, nz, mr, mul2, glow, add = (nt.nodes.new("ShaderNodeTexCoord"), nt.nodes.new("ShaderNodeTexNoise"),
                                       nt.nodes.new("ShaderNodeMapRange"), nt.nodes.new("ShaderNodeMath"),
                                       nt.nodes.new("ShaderNodeMath"), nt.nodes.new("ShaderNodeMath"))
        nz.inputs["Scale"].default_value, nz.inputs["Detail"].default_value = 1.4, 6.0
        nz.inputs["Roughness"].default_value, nz.inputs["Distortion"].default_value = 0.62, 0.8
        mr.inputs["From Min"].default_value, mr.inputs["From Max"].default_value = 0.38, 0.68
        mul2.operation, glow.operation, add.operation = "MULTIPLY", "MULTIPLY", "ADD"
        add.inputs[1].default_value = 0.4
        L(tc.outputs["Object"], nz.inputs["Vector"])
        L(nz.outputs["Fac"], mr.inputs["Value"])
        L(mul.outputs[0], mul2.inputs[0])
        L(mr.outputs[0], mul2.inputs[1])
        L(mul2.outputs[0], mix2.inputs[0])
        L(mr.outputs[0], add.inputs[0])
        L(strength.outputs[0], glow.inputs[0])
        L(add.outputs[0], glow.inputs[1])
        L(glow.outputs[0], emit.inputs["Strength"])
    else:
        L(fade.outputs["Fac"], mix2.inputs[0])
    L(trans.outputs[0], mix2.inputs[1])
    L(mix1.outputs[0], mix2.inputs[2])
    L(mix2.outputs[0], out.inputs["Surface"])
    return m


HEAT = [(0.0, (1.0, 0.9, 0.62), 1.0), (0.1, (1.0, 0.72, 0.3), 1.0), (0.35, (1.0, 0.42, 0.08), 0.85),
        (0.7, (0.85, 0.16, 0.02), 0.5), (1.0, (0.2, 0.06, 0.02), 0.0)]
SMOKE = (0.11, 0.1, 0.095)
SMOKE_REAL = (0.035, 0.033, 0.032)


def heat_at(u):
    if u >= 1:
        return (SMOKE_REAL if SMOOTH_SKIN else SMOKE), 0.0
    for (u0, c0, h0), (u1, c1, h1) in zip(HEAT, HEAT[1:]):
        if u <= u1:
            k = (u - u0) / (u1 - u0)
            return tuple(a + (b - a) * k for a, b in zip(c0, c1)), h0 + (h1 - h0) * k
    return SMOKE, 0.0


def build_fire(sc, track, n):
    mat = fire_material()
    bm = ico(1.0, (0, 0, 0), sub=3 if SMOOTH_SKIN else 2)
    puff_me = bpy.data.meshes.new("puff")
    bm.to_mesh(puff_me)
    bm.free()
    puff_me.materials.append(mat)
    if SMOOTH_SKIN:
        puff_me.shade_smooth()
    up = Vector((0, 0, 1))
    count = 0
    for a, b in BURSTS:
        ts = a
        while ts < b:
            ts += (1 / 90) * rng.uniform(0.6, 1.4)
            f0 = 1 + ts * FPS
            p0, d0, vd = at(track, f0)
            spread = Vector((rng.gauss(0, 1), rng.gauss(0, 1), rng.gauss(0, 1))) * 0.12
            vrel = (d0 + spread).normalized() * rng.uniform(20, 26)
            l_fire = rng.uniform(0.32, 0.5)
            life = l_fire + (rng.uniform(0.45, 0.8) if SMOOTH_SKIN else rng.uniform(0.8, 1.3))
            size = rng.uniform(0.8, 1.25)
            roll0, spin = rng.uniform(0, 6.3), rng.uniform(-4, 4)
            seed = Vector((rng.uniform(0, 100), rng.uniform(0, 100), rng.uniform(0, 100)))
            ob = bpy.data.objects.new(f"puff{count}", puff_me)
            sc.collection.objects.link(ob)
            ob.visible_shadow = False
            ob["fade"] = 0.0
            first, last = math.floor(f0), min(n, math.ceil(f0 + life * FPS))
            for f in range(first - 1, last + 2):
                age = (f - f0) / FPS
                alive = 0 <= age <= life and f <= last
                ob.hide_render = not alive
                ob.keyframe_insert("hide_render", frame=f)
                if not alive:
                    continue
                # the dragon's speed carries over and air drag slows it; the jet slows faster.
                # Heat lifts it, and turbulence grows as it slows.
                k, kd = 2.6, 0.9
                swirl = Vector([noise.noise(seed + Vector((age * 1.7, i * 7.0, 0))) for i in range(3)])
                ob.location = (p0 + vd * ((1 - math.exp(-kd * age)) / kd) + vrel * ((1 - math.exp(-k * age)) / k)
                               + up * (1.4 * age * age) + swirl * (2.2 * age * age))
                vel = vd * math.exp(-kd * age) + vrel * math.exp(-k * age) + up * (2.8 * age)
                r = size * (0.12 + 1.5 * age ** 0.9)
                stretch = 1 + 1.8 * (vrel * math.exp(-k * age)).length / 23  # long tongues near the mouth
                ob.rotation_mode = "QUATERNION"
                ob.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(vel.normalized()) @ Quaternion((0, 0, 1), roll0 + spin * age)
                ob.scale = (r, r, r * stretch)
                col, heat = heat_at(age / l_fire)
                ob.color = col + (heat,)
                ob["fade"] = 0.6 if age < l_fire else (0.28 if SMOOTH_SKIN else 0.42) * (1 - (age - l_fire) / (life - l_fire))
                for prop in ("location", "scale", "rotation_quaternion", "color", '["fade"]'):
                    ob.keyframe_insert(prop, frame=f)
            count += 1

    # a hot core straight out of the mouth, and the light the fire throws
    core_me = bpy.data.meshes.new("core")
    bm = cone(0.12, 0.55, (0, 0, 0), (0, 0, 3.2), 7)
    bm.to_mesh(core_me)
    bm.free()
    core_me.materials.append(mat)
    core = bpy.data.objects.new("core", core_me)
    sc.collection.objects.link(core)
    core.visible_shadow = False
    core["fade"] = 0.85
    core.color = (1.0, 0.88, 0.6, 1.0)
    lights = []
    for name, ahead, power, radius in (("fire_near", 1.5, 1200.0, 0.6), ("fire_far", 7.0, 4000.0, 2.0)):
        d = bpy.data.lights.new(name, "POINT")
        d.color, d.shadow_soft_size = (1.0, 0.55, 0.2), radius
        ob = bpy.data.objects.new(name, d)
        sc.collection.objects.link(ob)
        lights.append((ob, ahead, power))
    for f in range(1, n + 1):
        t = (f - 1) / FPS
        e = fire_env(t)
        p, d, _ = track[f - 1]
        flicker = 0.75 + 0.25 * noise.noise(Vector((t * 9.0, 0.3, 0.7)))
        core.hide_render = e < 0.03
        core.location = p - d * 0.25
        core.rotation_mode = "QUATERNION"
        core.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d)
        core.scale = (0.6 + 0.4 * e, 0.6 + 0.4 * e, max(0.05, e) * (0.85 + 0.3 * flicker))
        for prop in ("hide_render", "location", "rotation_quaternion", "scale"):
            core.keyframe_insert(prop, frame=f)
        for ob, ahead, power in lights:
            ob.location = p + d * ahead
            ob.data.energy = power * e * flicker
            ob.keyframe_insert("location", frame=f)
            ob.data.keyframe_insert("energy", frame=f)
    return count


# ------------------------------------------------------------------ world and scenery
def world_sunset():
    w = bpy.data.worlds.new("sunset")
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

    toward = ramp([(-0.1, "#4a3440"), (0.0, "#ffb27a"), (0.04, "#ff9f68"), (0.14, "#f08a6e"), (0.32, "#a07aa0"), (1.0, "#33427c")])
    away = ramp([(-0.1, "#2c2838"), (0.0, "#d9998e"), (0.1, "#a88aa6"), (0.32, "#6672a6"), (1.0, "#2e3d78")])
    sun_h = Vector((SUN.x, SUN.y, 0)).normalized()
    dot, mr, pw, mix = (nt.nodes.new("ShaderNodeVectorMath"), nt.nodes.new("ShaderNodeMapRange"),
                        nt.nodes.new("ShaderNodeMath"), nt.nodes.new("ShaderNodeMix"))
    dot.operation = "DOT_PRODUCT"
    dot.inputs[1].default_value = sun_h
    mr.inputs["From Min"].default_value, mr.inputs["From Max"].default_value = -1.0, 1.0
    pw.operation, pw.inputs[1].default_value = "POWER", 2.2
    mix.data_type = "RGBA"
    nt.links.new(tc.outputs["Generated"], dot.inputs[0])
    nt.links.new(dot.outputs["Value"], mr.inputs["Value"])
    nt.links.new(mr.outputs[0], pw.inputs[0])
    nt.links.new(pw.outputs[0], mix.inputs[0])
    nt.links.new(away.outputs["Color"], mix.inputs[6])
    nt.links.new(toward.outputs["Color"], mix.inputs[7])
    # the sun's disc and the glow round it
    sdot, disc, halo, hp, add1, add2, glow = (nt.nodes.new("ShaderNodeVectorMath"), nt.nodes.new("ShaderNodeMapRange"),
                                              nt.nodes.new("ShaderNodeMapRange"), nt.nodes.new("ShaderNodeMath"),
                                              nt.nodes.new("ShaderNodeMix"), nt.nodes.new("ShaderNodeMix"),
                                              nt.nodes.new("ShaderNodeMath"))
    sdot.operation = "DOT_PRODUCT"
    sdot.inputs[1].default_value = SUN
    nt.links.new(tc.outputs["Generated"], sdot.inputs[0])
    disc.inputs["From Min"].default_value, disc.inputs["From Max"].default_value = 0.99955, 0.9997
    disc.inputs["To Max"].default_value = 30.0
    halo.inputs["From Min"].default_value, halo.inputs["From Max"].default_value = 0.9, 1.0
    hp.operation, hp.inputs[1].default_value = "POWER", 5.0
    glow.operation, glow.inputs[1].default_value = "MULTIPLY", 1.6
    for node in (disc, halo):
        nt.links.new(sdot.outputs["Value"], node.inputs["Value"])
    nt.links.new(halo.outputs[0], hp.inputs[0])
    nt.links.new(hp.outputs[0], glow.inputs[0])
    for node, amount in ((add1, glow), (add2, disc)):
        node.data_type, node.blend_type = "RGBA", "ADD"
        node.inputs[7].default_value = srgb("#ffb070")
        nt.links.new(amount.outputs[0], node.inputs[0])
    nt.links.new(mix.outputs[2], add1.inputs[6])
    nt.links.new(add1.outputs[2], add2.inputs[6])
    nt.links.new(add2.outputs[2], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 1.0
    w.mist_settings.start, w.mist_settings.depth, w.mist_settings.falloff = 40.0, 1400.0, "LINEAR"
    return w


def ph_fetch(asset, kind, res):
    """Download a Poly Haven asset once: kind is hdri, model or texture. Returns its local path(s)."""
    folder = os.path.join(PH, asset)

    def get(url, dst):
        if not os.path.exists(dst):
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            print(f"downloading {url.split('/')[-1]}", flush=True)
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=600) as r, open(dst + ".part", "wb") as f:
                f.write(r.read())
            os.replace(dst + ".part", dst)
        return dst

    files = None
    def info():
        nonlocal files
        if files is None:
            req = urllib.request.Request(f"https://api.polyhaven.com/files/{asset}", headers=UA)
            files = json.load(urllib.request.urlopen(req, timeout=60))
        return files

    if kind == "hdri":
        dst = os.path.join(PH, f"{asset}_{res}.hdr")
        return dst if os.path.exists(dst) else get(info()["hdri"][res]["hdr"]["url"], dst)
    if kind == "model":
        dst = os.path.join(folder, f"{asset}_{res}.gltf")
        if not os.path.exists(dst):
            g = info()["gltf"][res]["gltf"]
            for rel, f in g["include"].items():
                get(f["url"], os.path.join(folder, rel))
            get(g["url"], dst)
        return dst
    out = {}
    for m in ("Diffuse", "Rough", "Displacement"):
        dst = os.path.join(folder, f"{asset}_{m.lower()}_{res}.jpg")
        out[m] = dst if os.path.exists(dst) else get(info()[m][res]["jpg"]["url"], dst)
    return out


def world_hdri():
    w = bpy.data.worlds.new("hdri")
    w.use_nodes = True
    nt = w.node_tree
    bg = next(n for n in nt.nodes if n.bl_idname == "ShaderNodeBackground")
    env, tc, mp = nt.nodes.new("ShaderNodeTexEnvironment"), nt.nodes.new("ShaderNodeTexCoord"), nt.nodes.new("ShaderNodeMapping")
    env.image = bpy.data.images.load(ph_fetch("belfast_sunset_puresky", "hdri", "4k"))
    mp.inputs["Rotation"].default_value = (0, 0, HDRI_SUN_AZ - SUN_AZ)
    nt.links.new(tc.outputs["Generated"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], env.inputs["Vector"])
    nt.links.new(env.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 1.0
    w.mist_settings.start, w.mist_settings.depth, w.mist_settings.falloff = 60.0, 5000.0, "LINEAR"
    return w


def warp(u, r):
    """Grid spacing that is fine near the flight path and coarse far away."""
    return r * (0.12 * u + 0.88 * math.copysign(abs(u) ** 2.5, u))


def terrain_h(x, y):
    """A snowy valley under the flight path, mountains rising either side and far ahead and behind."""
    v = Vector((x, y, 0))
    h = -30 + 25 * noise.noise(v * 0.0012) + 12 * noise.noise(v * 0.0025) + 4 * noise.noise(v * 0.012 + Vector((3, 7, 0)))
    side = smooth((abs(x) - 900) / 2200)
    ends = smooth((abs(y - 60) - 1800) / 2200)
    mask = max(side, ends)
    if mask > 0:
        ridge = noise.ridged_multi_fractal(v * 0.00045 + Vector((11.3, 4.1, 0)), 1.0, 2.1, 6, 1.0, 2.0)
        h += mask * (250 + 1100 * max(0.0, ridge - 0.25))
    return h


def terrain_material(rock, snow):
    m = bpy.data.materials.new("dr_terrain")
    m.use_nodes = True
    nt = m.node_tree
    p = next(n for n in nt.nodes if n.bl_idname == "ShaderNodeBsdfPrincipled")
    L = nt.links.new
    tc, geo = nt.nodes.new("ShaderNodeTexCoord"), nt.nodes.new("ShaderNodeNewGeometry")

    def tex(path, tile, color=True):
        mp, im = nt.nodes.new("ShaderNodeMapping"), nt.nodes.new("ShaderNodeTexImage")
        mp.inputs["Scale"].default_value = (1 / tile,) * 3
        im.image = bpy.data.images.load(path)
        if not color:
            im.image.colorspace_settings.name = "Non-Color"
        im.projection, im.projection_blend = "BOX", 0.25
        L(tc.outputs["Object"], mp.inputs["Vector"])
        L(mp.outputs["Vector"], im.inputs["Vector"])
        return im

    rc, rr, rd = tex(rock["Diffuse"], 140.0), tex(rock["Rough"], 140.0, False), tex(rock["Displacement"], 140.0, False)
    grey = nt.nodes.new("ShaderNodeHueSaturation")  # the photo's moss reads green from afar: make it grey stone
    grey.inputs["Saturation"].default_value, grey.inputs["Value"].default_value = 0.25, 0.8
    L(rc.outputs["Color"], grey.inputs["Color"])
    sc_, sr, sd = tex(snow["Diffuse"], 5.0), tex(snow["Rough"], 5.0, False), tex(snow["Displacement"], 5.0, False)
    # snow lies where the ground is gentle; broken up a little so the edge is not a clean line
    sep, flat, nz, add = (nt.nodes.new("ShaderNodeSeparateXYZ"), nt.nodes.new("ShaderNodeMapRange"),
                          nt.nodes.new("ShaderNodeTexNoise"), nt.nodes.new("ShaderNodeMath"))
    L(geo.outputs["Normal"], sep.inputs[0])
    L(sep.outputs["Z"], flat.inputs["Value"])
    flat.inputs["From Min"].default_value, flat.inputs["From Max"].default_value = 0.52, 0.74
    nz.inputs["Scale"].default_value = 0.02
    L(tc.outputs["Object"], nz.inputs["Vector"])
    add.operation, add.use_clamp = "ADD", True
    L(flat.outputs[0], add.inputs[0])
    sub_ = nt.nodes.new("ShaderNodeMath")
    sub_.operation, sub_.inputs[1].default_value = "SUBTRACT", 0.5
    L(nz.outputs["Fac"], sub_.inputs[0])
    L(sub_.outputs[0], add.inputs[1])
    tint = nt.nodes.new("ShaderNodeMix")
    tint.data_type, tint.blend_type = "RGBA", "MULTIPLY"
    tint.inputs[0].default_value = 1.0
    tint.inputs[7].default_value = (0.92, 0.95, 1.05, 1.0)  # snow reads slightly blue
    L(sc_.outputs["Color"], tint.inputs[6])
    col, rough, disp = (nt.nodes.new("ShaderNodeMix"), nt.nodes.new("ShaderNodeMix"), nt.nodes.new("ShaderNodeMix"))
    col.data_type = "RGBA"
    for node, a, b in ((col, rc, tint), (rough, rr, sr), (disp, rd, sd)):
        L(add.outputs[0], node.inputs[0])
        if node is col:
            L(grey.outputs["Color"], node.inputs[6])
            L(b.outputs[2], node.inputs[7])
        else:
            L(a.outputs["Color"], node.inputs[2])
            L(b.outputs["Color"], node.inputs[3])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value, bump.inputs["Distance"].default_value = 0.6, 0.4
    L(disp.outputs[0], bump.inputs["Height"])
    L(col.outputs[2], p.inputs["Base Color"])
    L(rough.outputs[0], p.inputs["Roughness"])
    L(bump.outputs["Normal"], p.inputs["Normal"])
    return m


def build_scenery_real(sc):
    n = 360
    us = [-1 + 2 * i / (n - 1) for i in range(n)]
    xs, ys = [warp(u, 5200) for u in us], [warp(u, 5200) + 60 for u in us]
    verts = [(x, y, terrain_h(x, y)) for y in ys for x in xs]
    faces = [(j * n + i, j * n + i + 1, (j + 1) * n + i + 1, (j + 1) * n + i) for j in range(n - 1) for i in range(n - 1)]
    me = bpy.data.meshes.new("terrain")
    me.from_pydata(verts, [], faces)
    me.shade_smooth()
    me.materials.append(terrain_material(ph_fetch("aerial_rocks_02", "texture", "2k"), ph_fetch("snow_02", "texture", "2k")))
    sc.collection.objects.link(bpy.data.objects.new("terrain", me))

    # fir trees, all sharing one mesh, on the gentle lower ground
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=ph_fetch("fir_sapling_medium", "model", "1k"))
    bpy.context.view_layer.update()
    parts = [o for o in bpy.data.objects if o not in before]
    tree = bpy.data.collections.new("fir")
    for o in parts:
        for c in o.users_collection:
            c.objects.unlink(o)
        tree.objects.link(o)
    placed = 0
    while placed < 1600:
        x, y = rng.uniform(-900, 1300), rng.uniform(-1400, 1500)
        h = terrain_h(x, y)
        slope = abs(terrain_h(x + 6, y) - h) + abs(terrain_h(x, y + 6) - h)
        if h > 140 or slope > 4.5 or noise.noise(Vector((x * 0.006, y * 0.006, 5.0))) < -0.2:
            continue  # bare ground on steep slopes and high up, and a few clearings
        ob = bpy.data.objects.new("fir", None)
        ob.instance_type, ob.instance_collection = "COLLECTION", tree
        ob.location = (x, y, h - 0.4)
        ob.scale = (rng.uniform(1.5, 2.3),) * 3
        ob.rotation_euler = (0, 0, rng.uniform(0, 6.3))
        sc.collection.objects.link(ob)
        placed += 1

    sun = bpy.data.lights.new("sun", "SUN")
    sun.energy, sun.color, sun.angle = 2.2, srgb("#ffb27a")[:3], 0.03
    ob = bpy.data.objects.new("sun", sun)
    ob.rotation_euler = (-SUN_REAL).to_track_quat("-Z", "Y").to_euler()
    sc.collection.objects.link(ob)


def ground_h(x, y):
    v = Vector((x, y, 0))
    h = 18 * noise.noise(v * 0.0035) + 7 * noise.noise(v * 0.011 + Vector((5, 1, 0))) + 2.5 * noise.noise(v * 0.03)
    return h + 0.00012 * x * x - 30  # the valley rises towards its sides; the dragon flies about 100 m up


def build_scenery(sc):
    fetch()
    # rolling valley floor, flat-shaded facets
    bm = bmesh.new()
    xs, ys = range(-700, 701, 25), range(-1300, 501, 25)
    grid = {(x, y): bm.verts.new((x, y, ground_h(x, y))) for x in xs for y in ys}
    for x in xs[:-1]:
        for y in ys[:-1]:
            bm.faces.new([grid[x, y], grid[x + 25, y], grid[x + 25, y + 25], grid[x, y + 25]])
    me = bpy.data.meshes.new("ground")
    bm.to_mesh(me)
    bm.free()
    me.materials.append(get_mat("dr_ground"))
    ground = bpy.data.objects.new("ground", me)
    sc.collection.objects.link(ground)

    mtn = {k: load(f"{k}.glb") for k in ("mountains_a", "mountains_b", "mountain_large", "mountain_small")}
    for k, x, y, s, r in (("mountains_a", -60, -780, 115, 0.2), ("mountain_large", 300, -900, 170, 1.1),
                          ("mountains_b", 280, -560, 95, 2.6), ("mountain_large", -330, -560, 125, 0.7),
                          ("mountain_small", -160, -380, 70, 1.9), ("mountains_b", -480, -260, 110, 4.0),
                          ("mountains_a", 470, -260, 105, 3.3), ("mountain_small", 210, -330, 60, 0.4),
                          ("mountain_large", 40, -1150, 200, 2.2), ("mountains_a", -420, 250, 110, 5.1),
                          ("mountains_b", 430, 260, 100, 1.4)):
        place(mtn[k], (x, y, ground_h(x, y) - 8), s, r)

    trees = [load(f"{k}.glb") for k in ("pine_snow", "pine_a", "pine_b")]
    rock = load("rock_snow.glb")
    for _ in range(900):
        x, y = rng.uniform(-420, 420), rng.uniform(-650, 330)
        if noise.noise(Vector((x * 0.008, y * 0.008, 3.0))) < -0.15:
            continue  # leave clearings
        place(rng.choice(trees), (x, y, ground_h(x, y) - 0.5), rng.uniform(5.0, 8.5), rng.uniform(0, 6.3))
    for _ in range(40):
        x, y = rng.uniform(-400, 400), rng.uniform(-600, 300)
        place(rock, (x, y, ground_h(x, y) - 3), rng.uniform(14, 30), rng.uniform(0, 6.3))

    clouds = [load(f"cloud_{k}.glb", "dr_cloud") for k in "acd"]
    for c in clouds:
        c.shade_smooth()
    cams = [cam_at(t / 2)[0] for t in range(21)] + [path(t / 2)[0] for t in range(21)]
    placed = 0
    while placed < 40:
        x, y, z, s = rng.uniform(-320, 320), rng.uniform(-700, 320), rng.uniform(30, 160), rng.uniform(7, 18)
        near = min((Vector((x, y, z)) - c).length for c in cams)
        if near < 4 * s + 45 or (z < 100 and near < 260):
            continue  # keep the dragon, its fire and the camera clear, and nothing between them and the ground
        place(rng.choice(clouds), (x, y, z), s, rng.uniform(0, 6.3))
        placed += 1

    sun = bpy.data.lights.new("sun", "SUN")
    sun.energy, sun.color, sun.angle = 3.2, srgb("#ffb27a")[:3], 0.03
    ob = bpy.data.objects.new("sun", sun)
    ob.rotation_euler = (-SUN).to_track_quat("-Z", "Y").to_euler()
    sc.collection.objects.link(ob)


# ------------------------------------------------------------------ camera
def cam_at(t):
    """Camera position, where it looks, and where it focuses. It travels with the dragon on its left,
    swinging from behind it to in front of it, so the fire crosses the frame and never comes at the lens."""
    u = smooth(t / 10.0)
    az = math.radians(-128 + 66 * u)
    dist = 23 - 2 * u
    if WIDE:  # 16:9: more from the side, so the dragon and its fire run across the wide frame
        az, dist = math.radians(-118 + 50 * u), 21 - 3 * u
    p, yaw = path(t)
    rz = Matrix.Rotation(yaw, 3, "Z")
    shake = Vector([0.15 * noise.noise(Vector((t * 0.7, k * 3.1, 0.5))) for k in range(3)])
    if SMOOTH_SKIN:  # realistic look: just below the dragon, so the sunset sky is behind it
        pos = p + rz @ Vector((dist * math.sin(az), dist * math.cos(az), 1.0 - 3.0 * u)) + shake
        look = p + rz @ Vector((0, 1.5, 0.4)) + shake * 0.4
    else:
        pos = p + rz @ Vector((dist * math.sin(az), dist * math.cos(az), 7.0 - 5.0 * u)) + shake
        look = p + rz @ Vector((0, 1.5, -1.6)) + shake * 0.4
    return pos, look, (p + rz @ Vector((0, 4.5, 1.2)) - pos).length


def build_camera(sc, n):
    cd = bpy.data.cameras.new("cam")
    cam = bpy.data.objects.new("cam", cd)
    sc.collection.objects.link(cam)
    sc.camera = cam
    cd.lens, cd.sensor_width = (32.0 if WIDE else 26.0), 36.0
    cd.clip_end = 4000.0
    cd.dof.use_dof, cd.dof.aperture_fstop, cd.dof.aperture_blades = True, 4.0, 7
    prev = None
    for f in range(1, n + 1):
        t = (f - 1) / FPS
        pos, look, focus = cam_at(t)
        q = (look - pos).to_track_quat("-Z", "Y")
        q = q @ Quaternion((0, 0, 1), math.radians(1.2) * noise.noise(Vector((t * 0.5, 9.0, 1.0))))
        cam.location = pos
        cam.rotation_euler = q.to_euler("XYZ", prev) if prev else q.to_euler("XYZ")
        prev = cam.rotation_euler.copy()
        cd.dof.focus_distance = focus
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_euler", frame=f)
        cd.dof.keyframe_insert("focus_distance", frame=f)
    return cam


WIDE = False  # set by build(): 16:9 framing


def build(sc, n=FRAMES, lowpoly=False, model=True, wide=False):
    """model: the downloaded dragon (dragon_model.py) rather than the one built here (realistic look only)."""
    global SMOOTH_SKIN, WIDE
    SMOOTH_SKIN, WIDE = not lowpoly, wide
    sc.frame_start, sc.frame_end = 1, n
    if lowpoly:
        sc.world = world_sunset()
        build_scenery(sc)
    else:
        sc.world = world_hdri()
        build_scenery_real(sc)
    if model and not lowpoly:
        rig, arm = dragon_model.load(sc, wingspan=18.0)
        animate_rig(rig, arm, n)
        track = mouth_track_model(sc, arm, n)
    else:
        arm = build_dragon(sc)
        animate_dragon(arm, n)
        track = mouth_track(sc, arm, n)
    puffs = build_fire(sc, track, n)
    build_camera(sc, n)
    return puffs


def smooth_mist(sc, px):
    """The haze is mixed in by distance, from the mist pass. That pass is not denoised, and through the
    see-through smoke it is grainy, so blur it a little first."""
    g = sc.compositing_node_group
    rl = next(n for n in g.nodes if n.bl_idname == "CompositorNodeRLayers")
    for link in list(g.links):
        if link.from_socket == rl.outputs["Mist"]:
            to = link.to_socket
            blur = g.nodes.new("CompositorNodeBlur")
            blur.inputs["Size"].default_value = (px, px)
            g.links.new(rl.outputs["Mist"], blur.inputs["Image"])
            g.links.new(blur.outputs["Image"], to)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True, help="image path with --frame, else a folder for the frames")
    ap.add_argument("--frame", type=int, help="render one frame only")
    ap.add_argument("--start", type=int, default=1)
    ap.add_argument("--end", type=int)
    ap.add_argument("--frames", type=int, default=FRAMES, help="300 = 10 seconds at 30 fps")
    ap.add_argument("--scale", type=float, default=100, help="percent of 1080 x 1920 (or 1920 x 1080 with --wide)")
    ap.add_argument("--samples", type=int, default=48, help="upper limit per pixel; easy pixels stop early")
    ap.add_argument("--threshold", type=float, default=0.03, help="noise level at which a pixel stops sampling")
    ap.add_argument("--seed", type=int, default=3)
    ap.add_argument("--fast", action="store_true", help="lower quality for speed: fewer light bounces")
    ap.add_argument("--blur", action="store_true", help="motion blur on the wings (slower)")
    ap.add_argument("--label", default="", help="name for this computer in times.json, e.g. laptop or cloud")
    ap.add_argument("--jpg", action="store_true", help="save frames as JPEG (quality 95): a fifth of the size, to upload")
    ap.add_argument("--lowpoly", action="store_true", help="the earlier faceted look, with Quaternius models")
    ap.add_argument("--exposure", type=float, default=None)
    ap.add_argument("--wide", action="store_true", help="16:9 (1920 x 1080 at --scale 100) instead of 9:16")
    ap.add_argument("--built", action="store_true", help="the dragon built in this script, not the downloaded model")
    args = ap.parse_args()

    t0 = time.time()
    sc = reset()
    puffs = build(sc, args.frames, args.lowpoly, model=not args.built, wide=args.wide)
    exposure = args.exposure if args.exposure is not None else (0.9 if args.lowpoly else -0.5)
    setup_render(sc, int(round(args.scale)), args.samples, args.threshold, args.seed, exposure=exposure, motion_blur=args.blur,
                 haze=0.25, bloom=0.6, fast=args.fast)
    sc.render.use_motion_blur = args.blur
    if args.wide:  # sizes rounded to even numbers, which video encoders need
        sc.render.resolution_x = 2 * round(1920 * args.scale / 200)
        sc.render.resolution_y = 2 * round(1080 * args.scale / 200)
        sc.render.resolution_percentage = 100
    if args.lowpoly:
        compositor(sc, haze=0.25, haze_color="#b48c96", bloom=0.6, size=0.5, threshold=1.4)
    else:
        compositor(sc, haze=0.5, haze_color="#a693a8", bloom=0.5, size=0.5, threshold=1.6)
    # each see-through puff costs two bounces; where many overlap, a low limit stops rays and leaves flat
    # opaque patches
    sc.cycles.transparent_max_bounces = 16 if args.lowpoly else 64
    smooth_mist(sc, max(2, round(8 * args.scale / 100)))
    ext = "png"
    if args.jpg:
        ext = "jpg"
        sc.render.image_settings.file_format, sc.render.image_settings.quality = "JPEG", 95
    print(f"built scene in {time.time() - t0:.1f} s ({puffs} fire puffs)", flush=True)
    if args.frame is not None:
        t0 = time.time()
        render(sc, args.out, args.frame)
        print(f"frame {args.frame}: {time.time() - t0:.1f} s", flush=True)
        return
    os.makedirs(args.out, exist_ok=True)
    log = os.path.join(args.out, f"times{'_' + args.label if args.label else ''}.json")
    times = json.load(open(log)) if os.path.exists(log) else {}
    for f in range(args.start, (args.end or args.frames) + 1):
        path_ = os.path.join(args.out, f"{f:04d}.{ext}")
        if os.path.exists(path_):
            continue  # lets an interrupted render resume
        t0 = time.time()
        render(sc, path_, f)
        times[str(f)] = round(time.time() - t0, 2)
        json.dump({"label": args.label, "scale": args.scale, "samples": args.samples, "fast": args.fast, **times},
                  open(log, "w"), indent=0)
        print(f"frame {f}/{args.frames}: {time.time() - t0:.1f} s", flush=True)
    done = [v for k, v in times.items() if k.isdigit()]
    if done:
        print(f"{len(done)} frames, {sum(done) / len(done):.1f} s per frame, {sum(done) / 60:.1f} min in all", flush=True)


if __name__ == "__main__":
    main()
