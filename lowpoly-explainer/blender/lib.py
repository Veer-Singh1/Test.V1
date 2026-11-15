"""Shared pieces for the path-traced scenes: palette, geometry collector, people, props, render setup."""
import math
import os

import bpy  # must come first: it makes bmesh and mathutils importable
import bmesh
from mathutils import Euler, Matrix, Vector


# ----------------------------------------------------------------- materials
def srgb(h, a=1.0):
    h = h.lstrip("#")
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return tuple(f(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)) + (a,)


PALETTE, MAT = {}, {}


def M(name, color="#888888", rough=0.8, metal=0.0, emit=None, strength=0.0, coat=0.0, spec=0.5, vary=0.0, setup=None):
    """Register a material. It is only built when a scene first uses it (see get_mat)."""
    PALETTE[name] = dict(color=color, rough=rough, metal=metal, emit=emit, strength=strength, coat=coat, spec=spec,
                         vary=vary, setup=setup)
    return name


def principled(m):
    return next(n for n in m.node_tree.nodes if n.bl_idname == "ShaderNodeBsdfPrincipled")


def get_mat(name):
    if name in MAT:
        return MAT[name]
    s = PALETTE[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = principled(m)
    col = srgb(s["color"])
    p.inputs["Base Color"].default_value = col
    p.inputs["Roughness"].default_value = s["rough"]
    p.inputs["Metallic"].default_value = s["metal"]
    p.inputs["Specular IOR Level"].default_value = s["spec"]
    p.inputs["Coat Weight"].default_value = s["coat"]
    p.inputs["Coat Roughness"].default_value = 0.08
    if s["emit"]:
        p.inputs["Emission Color"].default_value = srgb(s["emit"])
        p.inputs["Emission Strength"].default_value = s["strength"]
    if s["vary"]:  # slow, large-scale value variation: weathering
        v = s["vary"]
        tc = nt.nodes.new("ShaderNodeTexCoord")
        nz = nt.nodes.new("ShaderNodeTexNoise")
        nz.inputs["Scale"].default_value = 0.22
        nz.inputs["Detail"].default_value = 3.0
        mix = nt.nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.inputs[6].default_value = tuple(c * (1 - v) for c in col[:3]) + (1,)
        mix.inputs[7].default_value = tuple(min(1, c * (1 + v)) for c in col[:3]) + (1,)
        nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
        nt.links.new(nz.outputs[0], mix.inputs[0])
        nt.links.new(mix.outputs[2], p.inputs["Base Color"])
    if s["setup"]:
        s["setup"](m)
    MAT[name] = m
    return m


def reset():
    """Empty Blender and forget built materials. Call before building each scene."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    MAT.clear()
    return bpy.context.scene


# surfaces
M("road", "#2a2c30", rough=0.45, spec=0.5)
M("joint", "#101113", rough=0.7)
M("sett_a", "#5b5a58", rough=0.42)
M("sett_b", "#6a6560", rough=0.5)
M("sett_c", "#4d5257", rough=0.36)
M("puddle", "#0c0e12", rough=0.015, spec=1.0)
M("slab_a", "#6f6c66", rough=0.6)
M("slab_b", "#66635e", rough=0.55)
M("slab_c", "#77746c", rough=0.62)
M("kerb", "#807c76", rough=0.5)
M("iron", "#16181b", rough=0.45, metal=0.6)
M("galv", "#8e959b", rough=0.32, metal=0.9)
M("chrome", "#d8dadc", rough=0.12, metal=1.0)
M("brass", "#c9a24a", rough=0.28, metal=1.0)
M("stone", "#a39c8f", rough=0.75, vary=0.08)
M("wood", "#6a4a30", rough=0.7, vary=0.12)
M("wood_dark", "#3b2a1e", rough=0.7)
M("wood_light", "#9a7448", rough=0.6, vary=0.1)
M("crate", "#9b7a4e", rough=0.75, vary=0.1)
M("glass_dark", "#05080c", rough=0.03, spec=1.0)
M("rubber", "#0d0d0e", rough=0.75)
M("steel_door", "#4b5257", rough=0.4, metal=0.7)
M("door_green", "#1f3a2c", rough=0.45, coat=0.2)
M("door_red", "#5a1f1c", rough=0.45, coat=0.2)
M("door_blue", "#22344e", rough=0.45, coat=0.2)
M("frame_cream", "#cfc6ad", rough=0.6)
M("frame_green", "#22382e", rough=0.55)
M("canvas_green", "#284534", rough=0.9)
M("canvas_red", "#6d2a26", rough=0.9)
M("hydrant", "#9c2a22", rough=0.45, coat=0.3)
M("lamp_shade", "#1d3329", rough=0.4, coat=0.3)
M("tile_a", "#5b5d58", rough=0.3)
M("tile_b", "#2f3130", rough=0.26)
M("floorboard", "#5d4129", rough=0.5, vary=0.14)
M("plaster", "#b7ad93", rough=0.9, vary=0.08)
M("dado_green", "#42594c", rough=0.6, vary=0.08)
M("dado_brown", "#4a372a", rough=0.6, vary=0.08)
M("wall_grey", "#6d726c", rough=0.85, vary=0.1)
M("wall_dark", "#2c2a2a", rough=0.9, vary=0.12)
M("paper", "#e9e3d0", rough=0.8)
M("paper_red", "#a8302a", rough=0.7)
M("ink", "#141414", rough=0.7)
M("red_mark", "#c0271e", rough=0.6)
M("mattress", "#8e8c80", rough=0.95)
M("blanket", "#4e5a4a", rough=0.95)
# brick and painted walls
for nm, c in [("brick_red", "#7c3d30"), ("brick_brown", "#6a4636"), ("brick_dark", "#55302a"),
              ("brick_tan", "#96785a"), ("paint_sage", "#73806c"), ("paint_cream", "#a89c82"),
              ("brick_grey", "#5f5e62"), ("far", "#2c3040")]:
    M(nm, c, rough=0.85, vary=0.16)
# lights you can see
M("bulb", "#000000", emit="#ffc98a", strength=60)
M("bulb_off", "#8a8676", rough=0.2)
M("headlamp", "#000000", emit="#fff0cc", strength=70)
M("headlamp_off", "#b9b6a8", rough=0.1, spec=1.0)
M("tail", "#300606", emit="#ff2a1a", strength=5)
M("tail_off", "#5a0c0c", rough=0.15, coat=0.6)
M("win_warm", "#201408", emit="#ffb561", strength=5.5)
M("win_amber", "#201006", emit="#ff9a3d", strength=4.0)
M("win_pale", "#1c1a14", emit="#ffe2b0", strength=4.5)
M("win_cool", "#101418", emit="#b9d2ff", strength=5.0)
M("shade", "#2a2418", emit="#e9c78e", strength=1.6)
M("shade_day", "#b9ad90", rough=0.9)
M("slit", "#000000", emit="#ffb561", strength=9)
M("far_win", "#000000", emit="#ffbf73", strength=3.0)
M("alarm_red", "#300404", emit="#ff2414", strength=40)
M("flash", "#000000", emit="#ffe9a8", strength=400)
# vehicles and people
M("truck_green", "#2a6b3c", rough=0.35, coat=0.5)
M("truck_wood", "#7a5a38", rough=0.7, vary=0.1)
M("sedan", "#3a1216", rough=0.25, coat=0.9)
M("sedan_black", "#0c0d10", rough=0.22, coat=0.9)
M("hub", "#c9c2ad", rough=0.3, metal=0.4)
M("coat_navy", "#3d4d7c", rough=0.85)
M("coat_pino", "#b98a34", rough=0.85)
M("coat_okeefe", "#8e3a2c", rough=0.85)
M("coat_grey", "#666a70", rough=0.85)
M("coat_brown", "#5d4634", rough=0.85)
M("coat_olive", "#59603f", rough=0.85)
M("coat_agent", "#23262e", rough=0.8)
M("coat_black", "#0e0f12", rough=0.75)
M("coat_worker", "#7c8794", rough=0.85)
M("coat_prison", "#7f8690", rough=0.9)
M("cap", "#2a3454", rough=0.6)
M("hat_brown", "#4a3a2a", rough=0.8)
M("hat_grey", "#55585c", rough=0.8)
M("hat_black", "#101114", rough=0.7)
M("visor", "#2f5a3c", rough=0.4)
M("collar", "#0f1118", rough=0.8)
M("skin", "#d6b594", rough=0.6)
M("mask_a", "#d9c25a", rough=0.5)
M("mask_b", "#b9614a", rough=0.5)
M("mask_c", "#8fae7c", rough=0.5)
M("mask_d", "#d4cfc0", rough=0.5)
M("black", "#050506", rough=0.6)
M("rope", "#c7b48c", rough=0.9)
M("tape", "#e7e2d2", rough=0.6)
M("sack", "#b39d74", rough=0.95, vary=0.08)
M("bill", "#7f9879", rough=0.75)
M("bill_b", "#8aa184", rough=0.75)
M("band", "#ebe4d0", rough=0.8)


# ------------------------------------------------------------------ geometry
class Geo:
    """Collects primitives into one mesh per material, so the scene stays a handful of objects."""

    def __init__(self, name):
        self.name, self.bms, self.T = name, {}, Matrix.Identity(4)

    def bm(self, m):
        if m not in self.bms:
            self.bms[m] = bmesh.new()
        return self.bms[m]

    def _mx(self, loc, rot, scale):
        return self.T @ Matrix.LocRotScale(Vector(loc), Euler(rot), Vector(scale) if scale else None)

    def box(self, m, size, loc, rot=(0, 0, 0)):
        bmesh.ops.create_cube(self.bm(m), size=1.0, matrix=self._mx(loc, rot, size))

    def cyl(self, m, r1, r2, h, seg, loc, rot=(0, 0, 0), scale=None):
        bmesh.ops.create_cone(self.bm(m), cap_ends=True, cap_tris=False, segments=seg,
                              radius1=r1, radius2=r2, depth=h, matrix=self._mx(loc, rot, scale))

    def ico(self, m, r, sub, loc, scale=None, rot=(0, 0, 0)):
        bmesh.ops.create_icosphere(self.bm(m), subdivisions=sub, radius=r, matrix=self._mx(loc, rot, scale))

    def prism(self, m, pts, width, loc=(0, 0, 0), rot=(0, 0, 0)):
        """Extrude a profile drawn in the local XZ plane across `width` along Y."""
        bm, mx = self.bm(m), self._mx(loc, rot, None)
        a = [bm.verts.new(mx @ Vector((x, -width / 2, z))) for x, z in pts]
        b = [bm.verts.new(mx @ Vector((x, width / 2, z))) for x, z in pts]
        bm.faces.new(a)
        bm.faces.new(b[::-1])
        for i in range(len(pts)):
            j = (i + 1) % len(pts)
            bm.faces.new([a[j], a[i], b[i], b[j]])

    def ring(self, m, R, r, seg, loc, rot=(0, 0, 0)):
        """A low-poly ring in the local XY plane, made of straight pieces."""
        T0 = self.T
        self.T = self._mx(loc, rot, None)
        for i in range(seg):
            a = 2 * math.pi * (i + 0.5) / seg
            self.cyl(m, r, r, 2 * R * math.sin(math.pi / seg) * 1.08, 5,
                     (R * math.cos(a), R * math.sin(a), 0), rot=(math.pi / 2, 0, a))
        self.T = T0

    def finish(self, parent=None):
        objs = {}
        for m, bm in self.bms.items():
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
            me = bpy.data.meshes.new(f"{self.name}.{m}")
            bm.to_mesh(me)
            bm.free()
            ob = bpy.data.objects.new(f"{self.name}.{m}", me)
            ob.data.materials.append(get_mat(m))
            bpy.context.scene.collection.objects.link(ob)
            ob.parent = parent
            if m in ("bulb", "flash", "alarm_red"):
                ob.visible_shadow = False  # these sit around their own point lights
            objs[m] = ob
        self.bms = {}
        return objs


def light(kind, loc, energy, color="#ffd2a0", radius=0.1, rot=None, spot=None, size=None, aim=None):
    d = bpy.data.lights.new(kind.lower(), kind)
    d.energy, d.color = energy, srgb(color)[:3]
    if kind == "AREA":
        d.size = size or 1.0
    elif kind == "SUN":
        d.angle = radius
    else:
        d.shadow_soft_size = radius
    if spot:
        d.spot_size, d.spot_blend = math.radians(spot), 0.6
    ob = bpy.data.objects.new(kind.lower(), d)
    ob.location = loc
    if rot:
        ob.rotation_euler = rot
    if aim:  # point it at a spot in the scene
        ob.rotation_euler = (Vector(aim) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.collection.objects.link(ob)
    return ob


FONT = next((p for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                         "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf") if os.path.exists(p)), None)


def text(body, loc, size, m, rot=(0, 0, 0), align="CENTER"):
    """Flat printed text, lying in its own XY plane. Only for documents such as the calendar."""
    cu = bpy.data.curves.new("txt", "FONT")
    cu.body, cu.size, cu.align_x, cu.align_y = body, size, align, "CENTER"
    if FONT:
        cu.font = bpy.data.fonts.load(FONT, check_existing=True)
    ob = bpy.data.objects.new("txt", cu)
    ob.location, ob.rotation_euler = loc, rot
    ob.data.materials.append(get_mat(m))
    bpy.context.scene.collection.objects.link(ob)
    return ob


# -------------------------------------------------------------------- people
def figure(g, loc, facing, mask=None, lean=0.0, coat="coat_navy", hat="cap", hatm=None, lying=False, sit=False,
           carry=False, tied=False, scale=1.0):
    """The character: faceted head on a tapered six-sided coat, short arms, no legs.
    Local -Y is forward. mask: a mask material, or None for a bare face."""
    T0 = g.T
    T = T0 @ Matrix.Translation(Vector(loc)) @ Matrix.Rotation(facing, 4, "Z")
    if lying:  # on the back, head towards local +Y
        T = T @ Matrix.Translation(Vector((0, 0, 0.34))) @ Matrix.Rotation(-math.pi / 2, 4, "X")
    if sit:
        T = T @ Matrix.Translation(Vector((0, 0, -0.42)))
    g.T = T @ Matrix.Rotation(lean, 4, "X") @ Matrix.Scale(scale, 4)
    g.cyl(coat, 0.36, 0.2, 1.22, 6, (0, 0, 0.66))
    g.cyl("collar", 0.2, 0.26, 0.1, 6, (0, 0, 1.3))
    for sx in (-1, 1):  # arms hang inside the coat line, hands in dark gloves
        g.box(coat, (0.12, 0.13, 0.62), (sx * 0.27, 0.0, 0.97), rot=(0, sx * math.radians(-9), 0))
        g.box("black", (0.11, 0.12, 0.12), (sx * 0.325, 0.0, 0.62))
        g.box("black", (0.13, 0.3, 0.09), (sx * 0.12, -0.06, 0.045))  # shoes
    g.ico(mask or "skin", 0.24, 1, (0, 0, 1.57))
    if mask:
        for sx in (-0.09, 0.09):
            g.box("black", (0.075, 0.06, 0.045), (sx, -0.2, 1.62))
        g.box("black", (0.12, 0.06, 0.026), (0, -0.19, 1.48))
    if hat == "cap":  # chauffeur cap
        g.cyl(hatm or "cap", 0.25, 0.28, 0.11, 8, (0, 0, 1.78))
        g.box(hatm or "cap", (0.3, 0.2, 0.025), (0, -0.27, 1.73))
    elif hat == "brim":  # fedora
        g.cyl(hatm or "hat_brown", 0.37, 0.37, 0.025, 10, (0, 0, 1.75))
        g.cyl(hatm or "hat_brown", 0.2, 0.23, 0.17, 8, (0, 0, 1.84))
        g.cyl("black", 0.235, 0.235, 0.04, 8, (0, 0, 1.78))
    elif hat == "visor":  # counting-room eyeshade
        g.cyl("visor", 0.26, 0.26, 0.03, 8, (0, -0.05, 1.7))
        g.box("visor", (0.34, 0.2, 0.02), (0, -0.28, 1.68), rot=(math.radians(-14), 0, 0))
    if carry:
        sack(g, (0.42, -0.08, 0.45), 0.8)
    if tied:
        for z, r in ((0.75, 0.335), (1.0, 0.28)):
            g.cyl("rope", r, r - 0.012, 0.045, 6, (0, 0, z))
        g.box("tape", (0.24, 0.05, 0.08), (0, -0.215, 1.5))
    g.T = T0


# --------------------------------------------------------------------- props
def sack(g, loc, s=1.0, rot=0.0):
    """Canvas money bag."""
    T0 = g.T
    g.T = T0 @ Matrix.Translation(Vector(loc)) @ Matrix.Rotation(rot, 4, "Z") @ Matrix.Scale(s, 4)
    g.ico("sack", 0.34, 1, (0, 0, 0.34), scale=(1.0, 0.9, 1.1))
    g.cyl("sack", 0.13, 0.08, 0.2, 6, (0, 0, 0.74))
    g.cyl("rope", 0.1, 0.1, 0.035, 6, (0, 0, 0.7))
    g.cyl("sack", 0.08, 0.14, 0.1, 6, (0, 0, 0.87))
    g.T = T0


def cash(g, loc, layers=4, rot=0.0, loose=None):
    """A stack of banded bundles. With `loose` (a random.Random) each bundle sits a little askew."""
    T0 = g.T
    g.T = T0 @ Matrix.Translation(Vector(loc)) @ Matrix.Rotation(rot, 4, "Z")
    W, D, H = 0.16, 0.068, 0.024
    if loose is None:
        g.box("bill", (W, D, H * layers), (0, 0, H * layers / 2))
        g.box("band", (0.036, D + 0.002, H * layers + 0.002), (0, 0, H * layers / 2))
    else:
        for i in range(layers):
            dx, dy, r = loose.uniform(-0.006, 0.006), loose.uniform(-0.005, 0.005), loose.uniform(-0.06, 0.06)
            g.box(loose.choice(["bill", "bill_b"]), (W, D, H - 0.002), (dx, dy, H * (i + 0.5)), rot=(0, 0, r))
            g.box("band", (0.036, D + 0.002, H), (dx, dy, H * (i + 0.5)), rot=(0, 0, r))
    g.T = T0


def pendant(g, x, y, ztop, drop, power=120, color="#ffc98a", r=0.3, shade="lamp_shade", on=True):
    """Enamel shade on a cord, with a real light under it."""
    z = ztop - drop
    g.cyl("iron", 0.008, 0.008, drop - 0.1, 4, (x, y, ztop - (drop - 0.1) / 2))
    g.cyl(shade, r, 0.05, 0.16, 8, (x, y, z + 0.02))
    g.ico("bulb" if on else "bulb_off", 0.055, 1, (x, y, z - 0.08))
    if on:
        return light("POINT", g.T @ Vector((x, y, z - 0.17)), power, color, 0.055)


def room(g, x0, x1, y0, y1, h, wall, floor, ceil=None, dado=None, dado_h=1.25, rail="wood_dark", skip=()):
    """A closed box of a room, so lamp light bounces the way it would indoors."""
    T, cx, cy, w, d = 0.2, (x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0
    if floor:
        g.box(floor, (w + 2 * T, d + 2 * T, T), (cx, cy, -T / 2))
    g.box(ceil or wall, (w + 2 * T, d + 2 * T, T), (cx, cy, h + T / 2))
    for k, x in (("x0", x0 - T / 2), ("x1", x1 + T / 2)):
        if k not in skip:
            g.box(wall, (T, d + 2 * T, h), (x, cy, h / 2))
    for k, y in (("y0", y0 - T / 2), ("y1", y1 + T / 2)):
        if k not in skip:
            g.box(wall, (w, T, h), (cx, y, h / 2))
    if dado:
        e = 0.015
        for x, s in ((x0, 1), (x1, -1)):
            g.box(dado, (e * 2, d, dado_h), (x + s * e, cy, dado_h / 2))
            g.box(rail, (0.05, d, 0.06), (x + s * 0.025, cy, dado_h))
            g.box(rail, (0.04, d, 0.12), (x + s * 0.02, cy, 0.06))
        for k, y, s in (("y0", y0, 1), ("y1", y1, -1)):
            if k in skip:
                continue
            g.box(dado, (w, e * 2, dado_h), (cx, y + s * e, dado_h / 2))
            g.box(rail, (w, 0.05, 0.06), (cx, y + s * 0.025, dado_h))
            g.box(rail, (w, 0.04, 0.12), (cx, y + s * 0.02, 0.06))


def tiles(g, x0, x1, y0, y1, size=0.45, a="tile_a", b="tile_b", rng=None):
    """Chequered floor: separate slabs, a hair uneven, so they catch the light one by one."""
    nx, ny = round((x1 - x0) / size), round((y1 - y0) / size)
    sx, sy = (x1 - x0) / nx, (y1 - y0) / ny
    for i in range(nx):
        for j in range(ny):
            dz = rng.uniform(-0.002, 0.002) if rng else 0
            g.box(a if (i + j) % 2 else b, (sx - 0.008, sy - 0.008, 0.03), (x0 + (i + 0.5) * sx, y0 + (j + 0.5) * sy, 0.012 + dz))


def boards(g, x0, x1, y0, y1, w=0.16, m="floorboard"):
    n = round((x1 - x0) / w)
    w = (x1 - x0) / n
    for i in range(n):
        g.box(m, (w - 0.006, y1 - y0, 0.03), (x0 + (i + 0.5) * w, (y0 + y1) / 2, 0.012))


def table(g, x, y, w, d, h=0.78, top="wood", leg="wood_dark"):
    g.box(top, (w, d, 0.05), (x, y, h - 0.025))
    g.box(leg, (w - 0.12, d - 0.12, 0.09), (x, y, h - 0.095))
    for sx in (-1, 1):
        for sy in (-1, 1):
            g.box(leg, (0.07, 0.07, h - 0.05), (x + sx * (w / 2 - 0.08), y + sy * (d / 2 - 0.08), (h - 0.05) / 2))


def bars(g, x0, x1, y, z0, z1, gap=0.13, r=0.016, m="iron", rails=(0.12, 0.5, 0.88)):
    n = round((x1 - x0) / gap)
    for i in range(n + 1):
        g.cyl(m, r, r, z1 - z0, 6, (x0 + (x1 - x0) * i / n, y, (z0 + z1) / 2))
    for k in rails:
        g.box(m, (x1 - x0, 0.05, 0.03), ((x0 + x1) / 2, y, z0 + (z1 - z0) * k))


# -------------------------------------------------------------------- render
def world_flat(color="#0a0c12", strength=0.05):
    w = bpy.data.worlds.new("flat")
    w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.bl_idname == "ShaderNodeBackground")
    bg.inputs["Color"].default_value = srgb(color)
    bg.inputs["Strength"].default_value = strength
    return w


LAST_CAM = {}  # lens, shift and subject distance of the camera made last: saved beside each plate


def camera(sc, pos, look, lens=28.0, level=True, shift_y=0.0, fstop=None, focus=None):
    """level=True keeps verticals straight (use shift_y to frame); otherwise the camera tilts to aim."""
    cd = bpy.data.cameras.new("cam")
    ob = bpy.data.objects.new("cam", cd)
    sc.collection.objects.link(ob)
    sc.camera = ob
    cd.lens, cd.sensor_width, cd.shift_y = lens, 36.0, shift_y
    pos, look = Vector(pos), Vector(look)
    d = look - pos
    ob.location = pos
    ob.rotation_euler = (math.pi / 2, 0.0, math.atan2(-d.x, d.y)) if level else d.to_track_quat("-Z", "Y").to_euler()
    if fstop:
        cd.dof.use_dof, cd.dof.aperture_fstop, cd.dof.aperture_blades = True, fstop, 7
        cd.dof.focus_distance = (Vector(focus) - pos).length if focus else d.length
    LAST_CAM.clear()
    LAST_CAM.update(lens=lens, shift_y=shift_y, focus=round(((Vector(focus) - pos) if focus else d).length, 3))
    return ob


def compositor(sc, haze=0.5, haze_color="#59608f", bloom=0.5, size=0.45, threshold=1.6):
    """Depth haze from the mist pass (outdoors), then bloom on the bright lamps."""
    g = bpy.data.node_groups.new("grade", "CompositorNodeTree")
    sc.compositing_node_group = g
    g.interface.new_socket(name="Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    rl, out, glare = g.nodes.new("CompositorNodeRLayers"), g.nodes.new("NodeGroupOutput"), g.nodes.new("CompositorNodeGlare")
    src = rl.outputs["Image"]
    if haze:
        mix, amt = g.nodes.new("ShaderNodeMix"), g.nodes.new("ShaderNodeMath")
        amt.operation = "MULTIPLY"
        amt.inputs[1].default_value = haze
        mix.data_type = "RGBA"
        mix.inputs[7].default_value = srgb(haze_color)[:3] + (1,)
        g.links.new(rl.outputs["Mist"], amt.inputs[0])
        g.links.new(amt.outputs[0], mix.inputs[0])
        g.links.new(src, mix.inputs[6])
        src = mix.outputs[2]
    glare.inputs["Type"].default_value = "Bloom"
    glare.inputs["Threshold"].default_value = threshold
    glare.inputs["Strength"].default_value = bloom
    glare.inputs["Size"].default_value = size
    glare.inputs["Saturation"].default_value = 1.0
    g.links.new(src, glare.inputs["Image"])
    g.links.new(glare.outputs["Image"], out.inputs[0])


DEVICE_NOTE = []  # what pick_device chose, printed once


def pick_device(want=None):
    """The fastest device Cycles can use on this computer: OptiX or CUDA (NVIDIA), HIP (AMD),
    Metal (Apple Silicon), oneAPI (Intel Arc), else the CPU. RENDER_DEVICE=cpu forces the CPU."""
    want = (want or os.environ.get("RENDER_DEVICE", "auto")).lower()
    if want != "cpu":
        cp = bpy.context.preferences.addons["cycles"].preferences
        for kind in ("OPTIX", "CUDA", "HIP", "METAL", "ONEAPI"):
            try:
                cp.compute_device_type = kind
                cp.refresh_devices()
            except Exception:  # this kind of GPU is not supported here
                continue
            gpus = [d for d in cp.devices if d.type == kind]
            if gpus:
                for d in cp.devices:
                    d.use = d.type == kind
                return "GPU", f"{kind}: " + ", ".join(d.name for d in gpus)
    return "CPU", "CPU" + (" (no supported GPU found)" if want != "cpu" else "")


def setup_render(sc, scale=100, samples=48, threshold=0.03, seed=3, exposure=1.1, motion_blur=False, haze=0.5, bloom=0.5):
    sc.render.fps = 30
    sc.render.engine = "CYCLES"
    c = sc.cycles
    c.device, what = pick_device()
    if what not in DEVICE_NOTE:
        DEVICE_NOTE.append(what)
        print(f"render device: {what}", flush=True)
    c.samples = samples
    c.use_adaptive_sampling, c.adaptive_threshold, c.adaptive_min_samples = True, threshold, 8
    c.use_denoising, c.denoiser = True, "OPENIMAGEDENOISE"
    c.denoising_input_passes, c.denoising_prefilter = "RGB_ALBEDO_NORMAL", "FAST"
    c.max_bounces, c.diffuse_bounces, c.glossy_bounces, c.transmission_bounces = 5, 2, 3, 1
    c.sample_clamp_indirect, c.blur_glossy = 6.0, 0.6
    c.caustics_reflective = c.caustics_refractive = False
    c.seed, c.use_animated_seed = seed, False
    sc.render.use_motion_blur, sc.render.motion_blur_shutter = motion_blur, 0.5
    sc.render.use_persistent_data = True
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1080, 1920, scale
    sc.view_layers[0].use_pass_mist = bool(haze)
    sc.view_settings.view_transform = "AgX"
    for lk in ("AgX - Medium High Contrast", "Medium High Contrast", "AgX - Base Contrast"):
        try:
            sc.view_settings.look = lk
            break
        except TypeError:
            pass
    sc.view_settings.exposure = exposure
    compositor(sc, haze=haze, bloom=bloom)
    sc.render.compositor_device = "CPU"  # the default needs a GPU
    sc.render.compositor_precision = "FULL"
    try:
        sc.render.image_settings.media_type = "IMAGE"
    except Exception:
        pass
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGB"


def render(sc, path, frame=None):
    if frame is not None:
        sc.frame_set(frame)
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


NEAR = 0.1  # metres: disparity 1.0. Depth maps store NEAR / distance, so far things lose precision, not near ones.


def depth_setup(sc, scale=100):
    """Switch a built scene to a fast depth-only render: one sample at each pixel centre, so every
    pixel is one surface (no blended edges), and no lens blur."""
    c = sc.cycles
    c.samples, c.use_adaptive_sampling, c.use_denoising = 1, False, False
    sc.render.use_motion_blur = False
    c.filter_width = 0.01
    c.seed = 0
    sc.camera.data.dof.use_dof = False
    sc.render.resolution_percentage = scale
    sc.view_layers[0].use_pass_z = True
    g = bpy.data.node_groups.new("depth", "CompositorNodeTree")
    sc.compositing_node_group = g
    g.interface.new_socket(name="Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    rl, out, div = g.nodes.new("CompositorNodeRLayers"), g.nodes.new("NodeGroupOutput"), g.nodes.new("ShaderNodeMath")
    div.operation = "DIVIDE"
    div.inputs[0].default_value = NEAR
    g.links.new(rl.outputs["Depth"], div.inputs[1])
    g.links.new(div.outputs[0], out.inputs[0])
    sc.render.image_settings.file_format = "OPEN_EXR"
    sc.render.image_settings.color_mode = "RGB"
    sc.render.image_settings.color_depth = "32"


def depth_frame(sc, png):
    """Render the depth pass and save it as a PNG: 16-bit disparity, high byte in red, low byte in green."""
    import numpy as np
    from PIL import Image

    exr = png[:-4] + ".exr"
    sc.render.filepath = exr
    bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(exr)
    w, h = img.size
    a = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)[::-1, :, 0]
    bpy.data.images.remove(img)
    os.remove(exr)
    v = np.round(np.clip(a, 0.0, 1.0) * 65535).astype(np.uint16)
    Image.fromarray(np.dstack([(v >> 8).astype(np.uint8), (v & 255).astype(np.uint8), np.zeros_like(v, np.uint8)]), "RGB").save(png)
    return a
