"""Lindisfarne (Holy Island, Northumberland) on a night in AD 793, when the Anglo-Saxon Chronicle saw
"immense sheets of light rushing through the air, and whirlwinds, and fiery dragons flying across the firmament".

build(sc) puts the whole place into a scene: the night sky with an aurora in it, the moving sea, the island with
its beach and rocky headland, the monastery (a small stone church, timber halls, stone cells, an enclosure wall,
a standing cross) and the lights. It returns a dict of useful points and camera set-ups (see build()). Render
settings stay with the caller; after lib.setup_render call look(sc) for the matching haze and bloom:

    sc = reset()
    info = env_lindisfarne.build(sc)
    setup_render(sc, 100, 12, 0.05, 3, exposure=env_lindisfarne.EXPOSURE, fast=True)
    sc.render.resolution_x, sc.render.resolution_y = 1920, 1080
    env_lindisfarne.look(sc)
    env_lindisfarne.camera(sc, info["cameras"]["beach"])

Metres; +Y is north, +X east, sea level is z = 0, and the church stands at the origin. The sea moves for FRAMES
frames at 30 fps (its time is keyed linearly, so later frames keep moving), and so does the aurora.

Everything random uses fixed seeds and a noise function written out here (numpy), so the scene is the same on
every machine. Free CC0 assets from Poly Haven (polyhaven.com), downloaded on the first run into
blender/assets/polyhaven/ (rock models are reduced and cached there as .blend files on the first run):
  sky        kloppenheim_07_puresky (8k HDRI): an overcast night with moonlit breaks in the cloud
  ground     sparse_grass, coast_sand_01, rock_wall_02
  buildings  castle_wall_slates, stacked_stone_wall, roof_slates_02, thatch_roof_angled, weathered_planks
  rocks      coastal_cliff_01, coast_rocks_01, coast_rocks_05, boulder_01
"""
import math
import os
import random

import bpy  # must come first: it makes bmesh and mathutils importable
import bmesh
import numpy as np
from mathutils import Matrix, Vector

from lib import MAT, Geo, compositor, light, srgb
from dragon import PH, ph_fetch, smooth_mist

FPS, FRAMES = 30, 300
SEED = 793

# the sky: an overcast moonlit night. The moon is at bearing -54.4 deg (clockwise from north), 38.1 deg up in the
# image as downloaded; it is turned to MOON_BEARING, a little west of north, so it lights the clouds behind the
# priory as the beach camera sees it.
HDRI, HDRI_RES = "kloppenheim_07_puresky", "8k"
HDRI_MOON = (-54.4, 38.1)
MOON_BEARING = -10.0
SKY = 0.16  # world strength: the photo is exposed for day; this makes it night
SKY_SAT, SKY_TINT = 0.45, (0.78, 0.9, 1.16)  # moonlight reads cool and colourless
HORIZON = (0.31, 0.32, 0.33)  # mean colour of the photo just above the horizon
HAZE = 0.32  # how much the far distance fades into HAZE_RGB (the night horizon)
EXPOSURE = 0.0
MIST = (25.0, 1400.0)  # start and depth of the haze, metres

PRIORY = Vector((0.0, 0.0))
CRAG = Vector((-150.0, 300.0))  # the rocky headland across the bay, north-west of the priory
# The coast, anticlockwise, land inside. The priory sits on a low rise 40 m from the west shore; the bay north of
# it ends at the headland; the island runs on to the north and east.
COAST = np.array([
    (300, -420), (100, -330), (-10, -262), (-24, -165), (-27, -100), (-28, -72), (-31, -42), (-39, -5),
    (-52, 35), (-76, 75), (-100, 130), (-112, 190), (-122, 235), (-150, 248), (-182, 262), (-202, 290),
    (-200, 325), (-176, 350), (-140, 357), (-112, 380), (-118, 470), (-140, 620), (-120, 850), (-40, 1100),
    (150, 1350), (600, 1450), (1200, 1300), (1600, 900), (1700, 300), (1500, -150), (1000, -380), (600, -470),
], float)


# ------------------------------------------------------------------ noise and the lie of the land
def _perm(seed):
    p = np.random.RandomState(seed).permutation(256)
    return np.concatenate([p, p]).astype(np.int64)


_P = _perm(SEED)
_G = np.array([(1, 1), (-1, 1), (1, -1), (-1, -1), (1, 0), (-1, 0), (0, 1), (0, -1)], float) * 0.85


def perlin(x, y):
    """2D gradient noise, about -1..1. Plain numpy, so it gives the same numbers everywhere."""
    x, y = np.asarray(x, float), np.asarray(y, float)
    xi, yi = np.floor(x), np.floor(y)
    xf, yf = x - xi, y - yi
    xi, yi = xi.astype(np.int64) & 255, yi.astype(np.int64) & 255
    u, v = xf ** 3 * (xf * (xf * 6 - 15) + 10), yf ** 3 * (yf * (yf * 6 - 15) + 10)

    def g(ix, iy, dx, dy):
        h = _P[_P[ix] + iy] & 7
        return _G[h, 0] * dx + _G[h, 1] * dy

    a = g(xi, yi, xf, yf) + u * (g(xi + 1, yi, xf - 1, yf) - g(xi, yi, xf, yf))
    b = g(xi, yi + 1, xf, yf - 1) + u * (g(xi + 1, yi + 1, xf - 1, yf - 1) - g(xi, yi + 1, xf, yf - 1))
    return a + v * (b - a)


def fbm(x, y, octaves=4):
    x, y = np.asarray(x, float), np.asarray(y, float)
    s, amp, tot = 0.0, 1.0, 0.0
    for i in range(octaves):
        s = s + amp * perlin(x + 17.3 * i, y - 9.1 * i)
        tot += amp
        x, y, amp = x * 2.03, y * 2.03, amp * 0.5
    return s / tot * 1.6


def smooth(v, a, b):
    """0 at a, 1 at b, smooth in between (a > b counts down)."""
    t = np.clip((np.asarray(v, float) - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def coast_distance(x, y):
    """Signed distance to the coast in metres: positive on land."""
    x, y = np.asarray(x, float), np.asarray(y, float)
    d2 = np.full(np.broadcast(x, y).shape, np.inf)
    inside = np.zeros(d2.shape, bool)
    for (ax, ay), (bx, by) in zip(COAST, np.roll(COAST, -1, axis=0)):
        ex, ey = bx - ax, by - ay
        t = np.clip(((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey), 0, 1)
        d2 = np.minimum(d2, (x - ax - t * ex) ** 2 + (y - ay - t * ey) ** 2)
        inside ^= ((ay > y) != (by > y)) & (x < ex * (y - ay) / (ey if ey else 1e-9) + ax)
    d = np.sqrt(d2)
    return np.where(inside, d, -d) + 4.5 * fbm(x / 70, y / 70, 3) + 1.4 * perlin(x / 13 + 3.1, y / 13 + 7.7)


def crag_r(x, y):
    """Distance from the middle of the headland, made ragged."""
    return np.hypot(x - CRAG.x, y - CRAG.y) + 11 * fbm(x / 26 + 40, y / 26, 3)


def ground(x, y):
    """Height of the land or the sea floor. Works on numbers or numpy arrays."""
    x, y = np.asarray(x, float), np.asarray(y, float)
    d = coast_distance(x, y)
    land = 0.045 * np.clip(d, 0, 30) + 6.5 * smooth(d, 30, 130)  # a sandy beach, then a gentle rise inland
    land = land + (1.5 * fbm(x / 95 + 11, y / 95 + 5, 3) + 0.35 * fbm(x / 13, y / 13, 2)) * smooth(d, 6, 45)
    rp = np.hypot(x - PRIORY.x - 3, y - PRIORY.y - 2)
    land = land + 6.0 * np.exp(-(rp / 50) ** 2) * smooth(d, 2, 26)  # the low rise the monastery stands on
    sea = -0.035 * np.clip(-d, 0, 300) - 0.004 * np.clip(-d - 300, 0, None)
    h = np.where(d > 0, land, sea)
    rc = crag_r(x, y)
    h = h + 23 * smooth(rc, 54, 12) + 2.5 * fbm(x / 9, y / 9, 3) * smooth(rc, 60, 30)
    return h if h.ndim else float(h)


def rockiness(x, y):
    return np.clip(smooth(crag_r(x, y), 58, 34), 0, 1)


def _gz(x, y):
    return float(ground(np.array([x]), np.array([y]))[0])


# ------------------------------------------------------------------ meshes from arrays
def mesh_from_arrays(name, co, faces, attrs=None):
    """co: (n, 3) floats; faces: (m, k) vertex indices (all faces with k corners)."""
    me = bpy.data.meshes.new(name)
    co = np.ascontiguousarray(co, np.float32)
    faces = np.ascontiguousarray(faces, np.int32)
    me.vertices.add(len(co))
    me.vertices.foreach_set("co", co.ravel())
    k = faces.shape[1]
    me.loops.add(faces.size)
    me.loops.foreach_set("vertex_index", faces.ravel())
    me.polygons.add(len(faces))
    me.polygons.foreach_set("loop_start", np.arange(0, faces.size, k, dtype=np.int32))
    me.update(calc_edges=True)
    for nm, (kind, vals) in (attrs or {}).items():
        a = me.attributes.new(nm, kind, "POINT")
        a.data.foreach_set("vector" if kind == "FLOAT_VECTOR" else "value", np.ascontiguousarray(vals, np.float32).ravel())
    me.shade_smooth()
    return me


def link(ob, sc=None):
    (sc or bpy.context.scene).collection.objects.link(ob)
    return ob


def axis(c0, c1, step, lo, hi, grow=1.035, cap=25.0):
    """Coordinates along one axis: even steps from c0 to c1, then steps growing outwards to lo and hi."""
    core = list(np.linspace(c0, c1, int(round((c1 - c0) / step)) + 1))
    left, s, x = [], step, c0
    while x > lo:
        s = min(cap, s * grow)
        x -= s
        left.append(max(x, lo))
    right, s, x = [], step, c1
    while x < hi:
        s = min(cap, s * grow)
        x += s
        right.append(min(x, hi))
    return np.array(left[::-1] + core + right)


def grid_faces(nx, ny):
    i, j = np.meshgrid(np.arange(nx - 1), np.arange(ny - 1))
    a = (j * nx + i).ravel()
    return np.stack([a, a + 1, a + nx + 1, a + nx], axis=1)


def keep_faces(co, faces, keep):
    """Drop the faces not in keep, and the vertices left unused."""
    faces = faces[keep]
    used = np.unique(faces)
    remap = np.full(len(co), -1, np.int64)
    remap[used] = np.arange(len(used))
    return co[used], remap[faces], used


# ------------------------------------------------------------------ materials
def _nodes(m):
    nt = m.node_tree
    p = next(n for n in nt.nodes if n.bl_idname == "ShaderNodeBsdfPrincipled")
    return nt, p, nt.links.new


def new_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    MAT[name] = m  # so lib.Geo can use it by name
    return m


def image(nt, path, color=True):
    im = nt.nodes.new("ShaderNodeTexImage")
    im.image = bpy.data.images.load(path, check_existing=True)
    if not color:
        im.image.colorspace_settings.name = "Non-Color"
    im.projection, im.projection_blend = "BOX", 0.3
    return im


def tex_set(nt, L, vec, asset, tile, res="2k"):
    """A Poly Haven texture set, box-projected from `vec` (object coordinates, metres) at `tile` metres a repeat."""
    tx = ph_fetch(asset, "texture", res)
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / tile,) * 3
    mp.inputs["Location"].default_value = (0.37, 0.71, 0.13)
    L(vec, mp.inputs["Vector"])
    out = {}
    for k, color in (("Diffuse", True), ("Rough", False), ("Displacement", False)):
        im = image(nt, tx[k], color)
        L(mp.outputs["Vector"], im.inputs["Vector"])
        out[k] = im.outputs["Color"]
    return out


def grade(nt, L, col, sat=1.0, val=1.0, tint=None):
    hs = nt.nodes.new("ShaderNodeHueSaturation")
    hs.inputs["Saturation"].default_value, hs.inputs["Value"].default_value = sat, val
    L(col, hs.inputs["Color"])
    col = hs.outputs["Color"]
    if tint:
        mx = nt.nodes.new("ShaderNodeMix")
        mx.data_type, mx.blend_type = "RGBA", "MULTIPLY"
        mx.inputs[0].default_value = 1.0
        mx.inputs[7].default_value = srgb(tint)
        L(col, mx.inputs[6])
        col = mx.outputs[2]
    return col


def weathering(nt, L, vec, col, scale=0.15, amount=0.25):
    """Slow patches of lighter and darker: breaks up the repeat of a texture."""
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value, nz.inputs["Detail"].default_value = scale, 3.0
    L(vec, nz.inputs["Vector"])
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["To Min"].default_value, mr.inputs["To Max"].default_value = 1 - amount, 1 + amount
    L(nz.outputs["Fac"], mr.inputs["Value"])
    mx = nt.nodes.new("ShaderNodeMix")
    mx.data_type, mx.blend_type = "RGBA", "MULTIPLY"
    mx.inputs[0].default_value = 1.0
    L(col, mx.inputs[6])
    L(mr.outputs[0], mx.inputs[7])
    return mx.outputs[2]


def pbr(name, asset, tile, sat=1.0, val=1.0, tint=None, rough=(0.0, 1.0), bump=0.6, dist=0.04, vary=0.22):
    """A textured surface for buildings and stones, box-projected in object space."""
    m = new_mat(name)
    nt, p, L = _nodes(m)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    t = tex_set(nt, L, tc.outputs["Object"], asset, tile)
    col = weathering(nt, L, tc.outputs["Object"], grade(nt, L, t["Diffuse"], sat, val, tint), amount=vary)
    L(col, p.inputs["Base Color"])
    r = nt.nodes.new("ShaderNodeMapRange")
    r.inputs["To Min"].default_value, r.inputs["To Max"].default_value = rough
    L(t["Rough"], r.inputs["Value"])
    L(r.outputs[0], p.inputs["Roughness"])
    b = nt.nodes.new("ShaderNodeBump")
    b.inputs["Strength"].default_value, b.inputs["Distance"].default_value = bump, dist
    L(t["Displacement"], b.inputs["Height"])
    L(b.outputs["Normal"], p.inputs["Normal"])
    return m


def glow_mat(name, color="#ffa047", strength=6.0, flicker=0.25):
    """Candlelight through oiled cloth: warm, a little uneven."""
    m = new_mat(name)
    nt, p, L = _nodes(m)
    p.inputs["Base Color"].default_value = srgb("#1a1008")
    p.inputs["Emission Color"].default_value = srgb(color)
    tc, nz, mr = nt.nodes.new("ShaderNodeTexCoord"), nt.nodes.new("ShaderNodeTexNoise"), nt.nodes.new("ShaderNodeMapRange")
    nz.inputs["Scale"].default_value = 3.0
    L(tc.outputs["Object"], nz.inputs["Vector"])
    mr.inputs["To Min"].default_value, mr.inputs["To Max"].default_value = strength * (1 - flicker), strength * (1 + flicker)
    L(nz.outputs["Fac"], mr.inputs["Value"])
    L(mr.outputs[0], p.inputs["Emission Strength"])
    return m


def plain(name, color, rough=0.8):
    m = new_mat(name)
    _, p, _ = _nodes(m)
    p.inputs["Base Color"].default_value = srgb(color)
    p.inputs["Roughness"].default_value = rough
    return m


def materials():
    pbr("lf_church", "castle_wall_slates", 2.6, sat=0.75, val=0.95, tint="#e8dccb", bump=0.8, dist=0.06)
    pbr("lf_drystone", "stacked_stone_wall", 2.2, sat=0.55, val=0.9, tint="#e2dccf", bump=0.9, dist=0.06)
    pbr("lf_slates", "roof_slates_02", 3.0, sat=0.6, val=0.85, bump=0.7, dist=0.03)
    pbr("lf_thatch", "thatch_roof_angled", 2.2, sat=0.7, val=0.8, tint="#d8c8a8", bump=0.8, dist=0.08, vary=0.3)
    pbr("lf_timber", "weathered_planks", 2.4, sat=0.6, val=0.75, bump=0.5, dist=0.02)
    pbr("lf_sandstone", "rock_wall_02", 1.6, sat=0.7, val=1.25, tint="#e9c9a5", bump=0.5, dist=0.02, vary=0.12)
    glow_mat("lf_glow", "#ff9d45", 7.0)
    glow_mat("lf_glow_dim", "#ff8a35", 3.5)
    plain("lf_door", "#2b1d12", 0.75)
    plain("lf_floor", "#2a241d", 0.95)


def terrain_material():
    """Grass on the land, sand on the beach (dark and glossy where the sea wets it), rock on steep ground
    and on the headland."""
    m = new_mat("lf_terrain")
    nt, p, L = _nodes(m)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    ob = tc.outputs["Object"]
    grass, sand, rock = (tex_set(nt, L, ob, "sparse_grass", 3.5), tex_set(nt, L, ob, "coast_sand_01", 3.0),
                         tex_set(nt, L, ob, "rock_wall_02", 9.0))
    gcol = weathering(nt, L, ob, grade(nt, L, grass["Diffuse"], 0.65, 0.85), 0.03, 0.35)
    scol = weathering(nt, L, ob, grade(nt, L, sand["Diffuse"], 0.6, 1.0), 0.05, 0.15)
    rcol = weathering(nt, L, ob, grade(nt, L, rock["Diffuse"], 0.45, 0.85), 0.04, 0.3)
    sep, geo, nz = nt.nodes.new("ShaderNodeSeparateXYZ"), nt.nodes.new("ShaderNodeNewGeometry"), nt.nodes.new("ShaderNodeTexNoise")
    L(ob, sep.inputs[0])
    nz.inputs["Scale"].default_value, nz.inputs["Detail"].default_value = 0.12, 4.0
    L(ob, nz.inputs["Vector"])

    def math(op, a, b=None, clamp=False):
        n = nt.nodes.new("ShaderNodeMath")
        n.operation, n.use_clamp = op, clamp
        for i, v in enumerate((a, b)):
            if v is None:
                continue
            if isinstance(v, (int, float)):
                n.inputs[i].default_value = v
            else:
                L(v, n.inputs[i])
        return n.outputs[0]

    def ramp(v, a, b):
        n = nt.nodes.new("ShaderNodeMapRange")
        n.interpolation_type = "SMOOTHSTEP"
        n.inputs["From Min"].default_value, n.inputs["From Max"].default_value = a, b
        L(v, n.inputs["Value"])
        return n.outputs[0]

    wob = math("MULTIPLY", math("SUBTRACT", nz.outputs["Fac"], 0.5), 1.6)  # -0.8 .. 0.8 m of wobble
    z = math("ADD", sep.outputs["Z"], wob)
    sandf = ramp(z, 2.3, 1.3)
    wetf = ramp(math("ADD", sep.outputs["Z"], math("MULTIPLY", wob, 0.25)), 0.75, 0.15)
    nsep = nt.nodes.new("ShaderNodeSeparateXYZ")
    L(geo.outputs["Normal"], nsep.inputs[0])
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "rock"
    rockf = math("MAXIMUM", ramp(nsep.outputs["Z"], 0.8, 0.6), math("MULTIPLY", attr.outputs["Fac"],
                                                                    ramp(nsep.outputs["Z"], 0.97, 0.88)), True)

    def mix3(kind, g, s, r):
        a, b = nt.nodes.new("ShaderNodeMix"), nt.nodes.new("ShaderNodeMix")
        a.data_type = b.data_type = kind
        i0, i1, o = (6, 7, 2) if kind == "RGBA" else (2, 3, 0)
        L(sandf, a.inputs[0])
        L(g, a.inputs[i0])
        L(s, a.inputs[i1])
        L(rockf, b.inputs[0])
        L(a.outputs[o], b.inputs[i0])
        L(r, b.inputs[i1])
        return b.outputs[o]

    col = mix3("RGBA", gcol, scol, rcol)
    wet = nt.nodes.new("ShaderNodeMix")
    wet.data_type, wet.blend_type = "RGBA", "MULTIPLY"
    L(wetf, wet.inputs[0])
    L(col, wet.inputs[6])
    wet.inputs[7].default_value = (0.42, 0.44, 0.47, 1)
    L(wet.outputs[2], p.inputs["Base Color"])
    rough = mix3("FLOAT", math("MULTIPLY", grass["Rough"], 1.0), sand["Rough"], rock["Rough"])
    rmix = nt.nodes.new("ShaderNodeMix")
    rmix.data_type = "FLOAT"
    L(wetf, rmix.inputs[0])
    L(rough, rmix.inputs[2])
    rmix.inputs[3].default_value = 0.12
    L(rmix.outputs[0], p.inputs["Roughness"])
    disp = mix3("FLOAT", grass["Displacement"], sand["Displacement"], rock["Displacement"])
    b = nt.nodes.new("ShaderNodeBump")
    b.inputs["Strength"].default_value, b.inputs["Distance"].default_value = 0.6, 0.12
    L(disp, b.inputs["Height"])
    L(b.outputs["Normal"], p.inputs["Normal"])
    return m


# ------------------------------------------------------------------ animated values
def keyed_value(nt, name, v0, v1):
    """A Value node that runs linearly from v0 at frame 1 to v1 at frame FRAMES + 1, and on beyond."""
    n = nt.nodes.new("ShaderNodeValue")
    n.name = n.label = name
    key_linear(n.outputs[0], "default_value", [(1, v0), (FRAMES + 1, v1), (4 * FRAMES + 1, v0 + 4 * (v1 - v0))])
    return n.outputs[0]


def key_linear(owner, prop, keys):
    pref = bpy.context.preferences.edit
    old, pref.keyframe_new_interpolation_type = pref.keyframe_new_interpolation_type, "LINEAR"
    try:
        for f, v in keys:
            setattr(owner, prop, v)
            owner.keyframe_insert(prop, frame=f)
    finally:
        pref.keyframe_new_interpolation_type = old


# ------------------------------------------------------------------ the sky
def bearing_dir(bearing, elev=0.0):
    b, e = math.radians(bearing), math.radians(elev)
    return Vector((math.sin(b) * math.cos(e), math.cos(b) * math.cos(e), math.sin(e)))


def haze_rgb():
    """The colour of the night sky at the horizon, as the camera records it: what far things fade into."""
    g = sum(HORIZON) / 3
    return tuple(SKY * t * (g + SKY_SAT * (c - g)) for c, t in zip(HORIZON, SKY_TINT))


def hexcolor(rgb):
    f = lambda c: 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055
    return "#" + "".join(f"{round(255 * min(1.0, f(c))):02x}" for c in rgb)


def world():
    """The night sky: the HDRI, darkened and cooled, below the horizon its own horizon colour (the sea out past
    the end of the water mesh), with an aurora in it: faint green curtains with red tops, low in the north,
    rippling along, showing through the gaps in the cloud."""
    w = bpy.data.worlds.new("lindisfarne")
    w.use_nodes = True
    nt = w.node_tree
    L = nt.links.new
    bg = next(n for n in nt.nodes if n.bl_idname == "ShaderNodeBackground")
    N = nt.nodes.new

    def math(op, a, b=None, clamp=False):
        n = N("ShaderNodeMath")
        n.operation, n.use_clamp = op, clamp
        for i, v in enumerate((a, b)):
            if v is None:
                continue
            if isinstance(v, (int, float)):
                n.inputs[i].default_value = v
            else:
                L(v, n.inputs[i])
        return n.outputs[0]

    def ramp(v, a, b, lo=0.0, hi=1.0, smooth_=True):
        n = N("ShaderNodeMapRange")
        if smooth_:
            n.interpolation_type = "SMOOTHSTEP"
        n.inputs["From Min"].default_value, n.inputs["From Max"].default_value = a, b
        n.inputs["To Min"].default_value, n.inputs["To Max"].default_value = lo, hi
        L(v, n.inputs["Value"])
        return n.outputs[0]

    def noise(vec, scale, detail=2.0, rough=0.5, dims="3D", w_=None):
        n = N("ShaderNodeTexNoise")
        n.noise_dimensions = dims
        n.inputs["Scale"].default_value, n.inputs["Detail"].default_value = scale, detail
        n.inputs["Roughness"].default_value = rough
        L(vec, n.inputs["Vector"])
        if w_ is not None:
            L(w_, n.inputs["W"])
        return n.outputs["Fac"]

    def combine(a, b, c=0.0):
        n = N("ShaderNodeCombineXYZ")
        for i, v in enumerate((a, b, c)):
            if isinstance(v, (int, float)):
                n.inputs[i].default_value = v
            else:
                L(v, n.inputs[i])
        return n.outputs[0]

    tc, sep = N("ShaderNodeTexCoord"), N("ShaderNodeSeparateXYZ")
    L(tc.outputs["Generated"], sep.inputs[0])
    dx, dy, dz = sep.outputs
    # the photo: turned, the horizon row repeated below the horizon
    mp, env = N("ShaderNodeMapping"), N("ShaderNodeTexEnvironment")
    L(combine(dx, dy, math("MAXIMUM", dz, 0.004)), mp.inputs["Vector"])
    mp.inputs["Rotation"].default_value = (0, 0, math_rad(MOON_BEARING - HDRI_MOON[0]))
    env.image = bpy.data.images.load(ph_fetch(HDRI, "hdri", HDRI_RES), check_existing=True)
    env.interpolation = "Cubic"
    L(mp.outputs["Vector"], env.inputs["Vector"])
    hs = N("ShaderNodeHueSaturation")
    hs.inputs["Saturation"].default_value = SKY_SAT
    L(env.outputs["Color"], hs.inputs["Color"])
    tint = N("ShaderNodeMix")
    tint.data_type, tint.blend_type = "RGBA", "MULTIPLY"
    tint.inputs[0].default_value = 1.0
    tint.inputs[7].default_value = SKY_TINT + (1,)
    L(hs.outputs["Color"], tint.inputs[6])
    sky = tint.outputs[2]
    # where the cloud is thin (darker in the photo) the aurora shows through
    bw = N("ShaderNodeRGBToBW")
    L(env.outputs["Color"], bw.inputs[0])
    clear = ramp(bw.outputs[0], 0.24, 0.55, 1.0, 0.18)

    # the aurora, in sky coordinates: bearing (radians clockwise from north) and elevation
    t = keyed_value(nt, "aurora_time", 0.0, FRAMES / FPS)
    az = math("ARCTAN2", dx, dy)
    el = math("ARCSINE", math("MINIMUM", math("MAXIMUM", dz, -1.0), 1.0))
    a0, a1 = math_rad(-80), math_rad(18)  # it spans the northern sky from west-north-west to just east of north
    span = math("MULTIPLY", ramp(az, a0, a0 + 0.45), ramp(az, a1, a1 - 0.5))
    # lower edge: low in the north, lower towards the ends of the arc, folded, the folds moving
    fold = noise(combine(math("MULTIPLY", az, 1.7), math("MULTIPLY", t, 0.035), 7.3), 1.0, 2.0, 0.55)
    edge = math("ADD", math("MULTIPLY", math("SUBTRACT", fold, 0.5), 0.16),
                math("ADD", 0.075, math("MULTIPLY", math("COSINE", math("SUBTRACT", az, math_rad(-25))), 0.05)))
    p = math("SUBTRACT", el, edge)
    pp = math("MAXIMUM", p, 0.0)
    base = ramp(p, -0.012, 0.022)
    green = math("MULTIPLY", base, math("EXPONENT", math("MULTIPLY", pp, -1 / 0.085)))
    red = math("MULTIPLY", ramp(p, 0.04, 0.2), math("EXPONENT", math("MULTIPLY", pp, -1 / 0.3)))
    # rays: thin vertical streaks drifting along the arc, bunched into brighter folds
    drift = math("ADD", math("MULTIPLY", az, 48.0), math("MULTIPLY", t, 0.55))
    rays = ramp(noise(combine(drift, math("MULTIPLY", el, 1.4), math("MULTIPLY", t, 0.12)), 1.0, 3.0, 0.55),
                0.36, 0.72, 0.1, 1.0)
    rays = math("POWER", rays, 1.6)
    bunch = ramp(noise(combine(math("ADD", math("MULTIPLY", az, 3.2), math("MULTIPLY", t, 0.06)), 2.0, 0.0), 1.0, 2.0),
                 0.32, 0.68, 0.15, 1.0)
    amount = math("MULTIPLY", math("MULTIPLY", span, bunch), math("MULTIPLY", rays, clear))
    gcol, rcol = N("ShaderNodeMix"), N("ShaderNodeMix")
    for node, f, c in ((gcol, green, (0.05, 1.0, 0.32)), (rcol, red, (1.0, 0.07, 0.16))):
        node.data_type = "RGBA"
        node.inputs[6].default_value = (0, 0, 0, 1)
        node.inputs[7].default_value = c + (1,)
        L(math("MULTIPLY", f, amount), node.inputs[0])
    aur = N("ShaderNodeMix")
    aur.data_type, aur.blend_type = "RGBA", "ADD"
    aur.inputs[0].default_value = 1.0
    L(gcol.outputs[2], aur.inputs[6])
    L(rcol.outputs[2], aur.inputs[7])
    scale = N("ShaderNodeVectorMath")
    scale.operation = "SCALE"
    scale.inputs["Scale"].default_value = AURORA
    L(aur.outputs[2], scale.inputs[0])
    add = N("ShaderNodeVectorMath")
    add.operation = "ADD"
    L(sky, add.inputs[0])
    L(scale.outputs[0], add.inputs[1])
    col = add.outputs[0]
    # The compositor fades far things into the haze colour by distance, and the sky counts as far: so camera rays
    # see a sky with that haze taken out in advance, and come out right after it. Reflections and light see the
    # real sky.
    hz = N("ShaderNodeVectorMath")
    hz.operation = "SUBTRACT"
    hz.inputs[1].default_value = tuple(HAZE * c / SKY for c in haze_rgb())
    L(col, hz.inputs[0])
    mx0, sc_ = N("ShaderNodeVectorMath"), N("ShaderNodeVectorMath")
    mx0.operation, sc_.operation = "MAXIMUM", "SCALE"
    L(hz.outputs[0], mx0.inputs[0])
    sc_.inputs["Scale"].default_value = 1 / (1 - HAZE)
    L(mx0.outputs[0], sc_.inputs[0])
    lp, pick = N("ShaderNodeLightPath"), N("ShaderNodeMix")
    pick.data_type = "RGBA"
    L(lp.outputs["Is Camera Ray"], pick.inputs[0])
    L(col, pick.inputs[6])
    L(sc_.outputs[0], pick.inputs[7])
    L(pick.outputs[2], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = SKY
    w.mist_settings.start, w.mist_settings.depth, w.mist_settings.falloff = MIST[0], MIST[1], "LINEAR"
    return w


AURORA = 0.55  # brightness of the aurora against the photo (before SKY)


def math_rad(d):
    return math.radians(d)


def moon(sc, strength=0.3):
    d = bpy.data.lights.new("moon", "SUN")
    d.energy, d.color, d.angle = strength, srgb("#b4c4e4")[:3], math.radians(3.0)
    ob = bpy.data.objects.new("moon", d)
    ob.rotation_euler = (-bearing_dir(MOON_BEARING, HDRI_MOON[1])).to_track_quat("-Z", "Y").to_euler()
    return link(ob, sc)


# ------------------------------------------------------------------ land
def build_terrain(sc):
    xs = axis(-260, 70, 1.2, -800, 2100)
    ys = axis(-140, 380, 1.2, -1000, 1900)
    X, Y = np.meshgrid(xs, ys)
    Z = ground(X, Y)
    co = np.stack([X.ravel(), Y.ravel(), Z.ravel()], axis=1)
    faces = grid_faces(len(xs), len(ys))
    keep = Z.ravel()[faces].max(axis=1) > -4.0  # the sea floor further out is never seen through the water
    co, faces, used = keep_faces(co, faces, keep)
    rock = rockiness(co[:, 0], co[:, 1])
    me = mesh_from_arrays("terrain", co, faces, {"rock": ("FLOAT", rock)})
    me.materials.append(terrain_material())
    ob = link(bpy.data.objects.new("terrain", me), sc)
    print(f"terrain: {len(co)} vertices", flush=True)
    return ob


# ------------------------------------------------------------------ sea
def calm_nodes():
    """Geometry nodes: pull the ocean's displacement back towards the rest position where the vertex's 'calm'
    attribute says so (in the shallows, so the surf does not swallow the beach)."""
    ng = bpy.data.node_groups.new("calm", "GeometryNodeTree")
    ng.interface.new_socket(name="Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
    ng.interface.new_socket(name="Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    N, L = ng.nodes.new, ng.links.new
    gi, go, sp = N("NodeGroupInput"), N("NodeGroupOutput"), N("GeometryNodeSetPosition")
    rest, calm, pos, mix = (N("GeometryNodeInputNamedAttribute"), N("GeometryNodeInputNamedAttribute"),
                            N("GeometryNodeInputPosition"), N("ShaderNodeMix"))
    rest.data_type, calm.data_type = "FLOAT_VECTOR", "FLOAT"
    rest.inputs["Name"].default_value, calm.inputs["Name"].default_value = "rest", "calm"
    mix.data_type = "VECTOR"
    L(calm.outputs["Attribute"], mix.inputs[0])
    L(pos.outputs["Position"], mix.inputs[4])
    L(rest.outputs["Attribute"], mix.inputs[5])
    L(gi.outputs[0], sp.inputs["Geometry"])
    L(mix.outputs[1], sp.inputs["Position"])
    L(sp.outputs["Geometry"], go.inputs[0])
    return ng


def sea_material():
    """Dark water that mirrors the sky; wind ripples as a moving bump; foam from the ocean modifier on the crests
    and in bands along the shore."""
    m = new_mat("lf_sea")
    nt, p, L = _nodes(m)
    N = nt.nodes.new
    p.inputs["Base Color"].default_value = srgb("#0b1519")
    p.inputs["Roughness"].default_value = 0.05
    p.inputs["IOR"].default_value = 1.333
    t = keyed_value(nt, "sea_time", 0.0, FRAMES / FPS)
    tc = N("ShaderNodeTexCoord")
    # ripples: two noise layers drifting with the wind
    bumps = []
    for scale, speed, strength in ((0.9, 0.35, 0.22), (3.5, 0.9, 0.12)):
        nz = N("ShaderNodeTexNoise")
        nz.noise_dimensions = "4D"
        nz.inputs["Scale"].default_value, nz.inputs["Detail"].default_value = scale, 4.0
        mp = N("ShaderNodeMapping")
        mp.inputs["Scale"].default_value = (1.0, 2.2, 1.0)  # crests run across the wind
        L(tc.outputs["Object"], mp.inputs["Vector"])
        L(mp.outputs["Vector"], nz.inputs["Vector"])
        mul = N("ShaderNodeMath")
        mul.operation, mul.inputs[1].default_value = "MULTIPLY", speed
        L(t, mul.inputs[0])
        L(mul.outputs[0], nz.inputs["W"])
        b = N("ShaderNodeBump")
        b.inputs["Strength"].default_value, b.inputs["Distance"].default_value = strength, 0.06
        L(nz.outputs["Fac"], b.inputs["Height"])
        if bumps:
            L(bumps[-1].outputs["Normal"], b.inputs["Normal"])
        bumps.append(b)
    # foam
    foam, shore = N("ShaderNodeAttribute"), N("ShaderNodeAttribute")
    foam.attribute_name, shore.attribute_name = "foam", "shore"
    lines = N("ShaderNodeTexNoise")
    lines.noise_dimensions = "4D"
    lines.inputs["Scale"].default_value, lines.inputs["Detail"].default_value = 0.35, 5.0
    lines.inputs["Roughness"].default_value = 0.65
    L(tc.outputs["Object"], lines.inputs["Vector"])
    mul = N("ShaderNodeMath")
    mul.operation, mul.inputs[1].default_value = "MULTIPLY", 0.12
    L(t, mul.inputs[0])
    L(mul.outputs[0], lines.inputs["W"])
    band = N("ShaderNodeMath")
    band.operation = "MULTIPLY"
    L(shore.outputs["Fac"], band.inputs[0])
    L(lines.outputs["Fac"], band.inputs[1])
    sf = N("ShaderNodeMapRange")
    sf.interpolation_type = "SMOOTHSTEP"
    sf.inputs["From Min"].default_value, sf.inputs["From Max"].default_value = 0.42, 0.62
    L(band.outputs[0], sf.inputs["Value"])
    cf = N("ShaderNodeMapRange")
    cf.inputs["From Min"].default_value, cf.inputs["From Max"].default_value = 0.25, 0.9
    cf.inputs["To Max"].default_value = 0.7
    L(foam.outputs["Fac"], cf.inputs["Value"])
    tot = N("ShaderNodeMath")
    tot.operation, tot.use_clamp = "MAXIMUM", True
    L(sf.outputs[0], tot.inputs[0])
    L(cf.outputs[0], tot.inputs[1])
    col, rough = N("ShaderNodeMix"), N("ShaderNodeMix")
    col.data_type, rough.data_type = "RGBA", "FLOAT"
    col.inputs[6].default_value = srgb("#0b1519")
    col.inputs[7].default_value = srgb("#a6b0b2")
    rough.inputs[2].default_value, rough.inputs[3].default_value = 0.05, 0.7
    for n_ in (col, rough):
        L(tot.outputs[0], n_.inputs[0])
    L(col.outputs[2], p.inputs["Base Color"])
    L(rough.outputs[0], p.inputs["Roughness"])
    L(bumps[-1].outputs["Normal"], p.inputs["Normal"])
    return m


def build_sea(sc, centre=(-48.0, -40.0)):
    """A disc of water 9 km across, its rings close together near the beach camera and wide far out, displaced by
    Blender's ocean modifier. Under the land it is left out."""
    cx, cy = centre
    rs = [0.0]
    while rs[-1] < 9000:
        rs.append(rs[-1] + max(0.28, 0.0105 * rs[-1]))
    rs = np.array(rs[1:])
    n = 640
    th = np.linspace(0, 2 * np.pi, n, endpoint=False)
    R, T = np.meshgrid(rs, th, indexing="ij")
    X, Y = cx + R * np.cos(T), cy + R * np.sin(T)
    co = np.concatenate([[[cx, cy]], np.stack([X.ravel(), Y.ravel()], axis=1)])
    co = np.concatenate([co, np.zeros((len(co), 1))], axis=1)
    ring = lambda k, j: 1 + k * n + (j % n)
    k, j = np.meshgrid(np.arange(len(rs) - 1), np.arange(n), indexing="ij")
    k, j = k.ravel(), j.ravel()
    quads = np.stack([ring(k, j), ring(k, j + 1), ring(k + 1, j + 1), ring(k + 1, j)], axis=1)
    fan = np.stack([np.zeros(n, np.int64), ring(0, np.arange(n)), ring(0, np.arange(n) + 1), ring(0, np.arange(n) + 1)], 1)
    h = ground(co[:, 0], co[:, 1])
    keep_q = h[quads].min(axis=1) < 1.6
    co_q, quads, used = keep_faces(co, quads, keep_q)
    hq = h[used]
    # (the tiny fan round the centre is under water: add it as triangles)
    me = mesh_from_arrays("sea", co_q, quads, {
        "rest": ("FLOAT_VECTOR", co_q),
        "calm": ("FLOAT", 0.75 * smooth(hq, -4.0, -0.3)),
        "shore": ("FLOAT", smooth(hq, -2.6, -0.2)),
    })
    me.materials.append(sea_material())
    ob = link(bpy.data.objects.new("sea", me), sc)
    oc = ob.modifiers.new("ocean", "OCEAN")
    oc.geometry_mode = "DISPLACE"
    oc.spatial_size, oc.resolution, oc.viewport_resolution = 90, 12, 6
    oc.wave_scale, oc.choppiness, oc.wind_velocity = 0.8, 1.1, 13.0
    oc.wave_scale_min, oc.wave_alignment, oc.wave_direction = 0.6, 0.45, math.radians(15)
    oc.damping, oc.depth, oc.random_seed = 0.5, 30.0, SEED
    oc.use_foam, oc.foam_coverage, oc.foam_layer_name = True, 0.35, "foam"
    key_linear(oc, "time", [(1, 0.0), (FRAMES + 1, FRAMES / FPS), (4 * FRAMES + 1, 4 * FRAMES / FPS)])
    ob.modifiers.new("calm", "NODES").node_group = calm_nodes()
    print(f"sea: {len(co_q)} vertices", flush=True)
    return ob


# ------------------------------------------------------------------ rocks
def rock_mesh(asset, ratio):
    """A Poly Haven rock model as one mesh with its own materials, reduced to `ratio` of its faces. The reduced
    mesh is cached beside the download, so only the first run pays for it."""
    cache = os.path.join(PH, asset, f"{asset}_1k_r{int(ratio * 1000):04d}.blend")
    name = f"{asset}_r{int(ratio * 1000):04d}"
    if os.path.exists(cache):
        with bpy.data.libraries.load(cache, link=False) as (src, dst):
            dst.meshes = [name]
        return dst.meshes[0]
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=ph_fetch(asset, "model", "1k"))
    new = [o for o in bpy.data.objects if o not in before]
    ob = next(o for o in new if o.type == "MESH")
    if ratio < 1:
        ob.modifiers.new("reduce", "DECIMATE").ratio = ratio
    bpy.context.view_layer.update()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    me.transform(ob.matrix_world)
    me.name = name
    for o in new:
        bpy.data.objects.remove(o)
    bpy.data.libraries.write(cache, {me}, path_remap="ABSOLUTE", compress=True)
    return me


def place(sc, me, loc, scale, rot=0.0, tilt=(0.0, 0.0)):
    ob = bpy.data.objects.new(me.name, me)
    ob.location, ob.scale, ob.rotation_euler = loc, (scale,) * 3, (tilt[0], tilt[1], rot)
    return link(ob, sc)


def build_rocks(sc, rng):
    boulder, group, shelf, cliff = (rock_mesh("boulder_01", 1.0), rock_mesh("coast_rocks_05", 0.08),
                                    rock_mesh("coast_rocks_01", 0.1), rock_mesh("coastal_cliff_01", 0.25))
    n = 0
    # boulders and rock groups along the shore of the bay, thicker towards the headland
    for (ax, ay), (bx, by) in zip(COAST[3:15], COAST[4:16]):
        seg = Vector((bx - ax, by - ay))
        for i in range(max(1, int(seg.length / 9))):
            if rng.random() < 0.35:
                continue
            u = rng.random()
            nrm = Vector((seg.y, -seg.x)).normalized()  # pointing out to sea
            p = Vector((ax, ay)) + seg * u + nrm * rng.uniform(-3, 9)
            s = rng.uniform(0.7, 2.4) if rng.random() < 0.7 else rng.uniform(2.5, 4.0)
            me = boulder if rng.random() < 0.6 else group
            if me is group:
                s *= 0.55
            place(sc, me, (p.x, p.y, _gz(p.x, p.y) - 0.25 * s), s, rng.uniform(0, 6.283),
                  (rng.uniform(-0.15, 0.15), rng.uniform(-0.15, 0.15)))
            n += 1
    # a few in the surf in front of the beach camera
    for x, y, s, r in ((-38, -38, 2.2, 0.4), (-35, -52, 1.3, 2.1), (-45, -20, 3.0, 4.0), (-33, -30, 0.9, 1.0),
                       (-50, 5, 2.4, 5.2), (-41, -61, 1.0, 3.3)):
        place(sc, boulder, (x, y, _gz(x, y) - 0.3 * s), s, r)
        n += 1
    # the headland: low cliffs round its sea side, rock shelves at its foot
    for ang, s in ((205, 0.55), (250, 0.5), (160, 0.5), (115, 0.45)):
        a = math.radians(ang)
        r = 46
        x, y = CRAG.x + r * math.cos(a), CRAG.y + r * math.sin(a)
        place(sc, cliff, (x, y, -1.2), s, a - math.pi / 2)
        n += 1
    for ang, s in ((215, 0.35), (175, 0.3), (250, 0.32)):
        a = math.radians(ang)
        x, y = CRAG.x + 62 * math.cos(a), CRAG.y + 62 * math.sin(a)
        place(sc, shelf, (x, y, -0.9), s, rng.uniform(0, 6.283))
        n += 1
    print(f"rocks: {n}", flush=True)


# ------------------------------------------------------------------ buildings
def arch_profile(w, h, seg=8):
    """A round-headed opening, width w, total height h, in the XZ plane, sill at z = 0."""
    r = w / 2
    pts = [(-r, 0.0), (r, 0.0)]
    pts += [(r * math.cos(math.pi * i / seg), h - r + r * math.sin(math.pi * i / seg)) for i in range(seg + 1)]
    return pts


def frustum(bm, outer, inner, depth, M_):
    """Join a profile on the outside face (y = -depth/2) to a smaller one on the inside: a splayed opening."""
    a = [bm.verts.new(M_ @ Vector((x, -depth / 2, z))) for x, z in outer]
    b = [bm.verts.new(M_ @ Vector((x, depth / 2, z))) for x, z in inner]
    bm.faces.new(a)
    bm.faces.new(b[::-1])
    for i in range(len(a)):
        j = (i + 1) % len(a)
        bm.faces.new([a[j], a[i], b[i], b[j]])


def wall_ring(bm, w, d, h, t, M_):
    """Four walls round a w x d rectangle (outside size), t thick, h tall: one closed shell."""
    def loop(hw, hd, z):
        return [bm.verts.new(M_ @ Vector(p)) for p in ((-hw, -hd, z), (hw, -hd, z), (hw, hd, z), (-hw, hd, z))]
    ob_, ot = loop(w / 2, d / 2, 0), loop(w / 2, d / 2, h)
    ib, it = loop(w / 2 - t, d / 2 - t, 0), loop(w / 2 - t, d / 2 - t, h)
    for i in range(4):
        j = (i + 1) % 4
        bm.faces.new([ob_[i], ob_[j], ot[j], ot[i]])
        bm.faces.new([ib[j], ib[i], it[i], it[j]])
        bm.faces.new([ot[i], ot[j], it[j], it[i]])
        bm.faces.new([ob_[j], ob_[i], ib[i], ib[j]])


def round_wall(bm, r, h, t, M_, seg=28):
    def loop(rr, z):
        return [bm.verts.new(M_ @ Vector((rr * math.cos(2 * math.pi * i / seg), rr * math.sin(2 * math.pi * i / seg), z)))
                for i in range(seg)]
    ob_, ot, ib, it = loop(r, 0), loop(r, h), loop(r - t, 0), loop(r - t, h)
    for i in range(seg):
        j = (i + 1) % seg
        bm.faces.new([ob_[i], ob_[j], ot[j], ot[i]])
        bm.faces.new([ib[j], ib[i], it[i], it[j]])
        bm.faces.new([ot[i], ot[j], it[j], it[i]])
        bm.faces.new([ob_[j], ob_[i], ib[i], ib[j]])


def to_object(sc, name, bm, mat):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(MAT[mat])
    return link(bpy.data.objects.new(name, me), sc)


def cut(sc, ob, cutters):
    """Cut the openings (bmesh shells in cutters) out of ob, for good."""
    cobj = to_object(sc, "cutters", cutters, "lf_door")
    m = ob.modifiers.new("cut", "BOOLEAN")
    m.operation, m.operand_type, m.object, m.solver = "DIFFERENCE", "OBJECT", cobj, "EXACT"
    m.use_self, m.use_hole_tolerant = True, True
    bpy.context.view_layer.update()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    ob.modifiers.clear()
    old, ob.data = ob.data, me
    bpy.data.meshes.remove(old)
    me.materials.clear()
    me.materials.append(MAT[ob.name.split(".")[0]] if ob.name.split(".")[0] in MAT else old_mat(ob))
    bpy.data.objects.remove(cobj)


def old_mat(ob):
    return ob.material_slots[0].material if ob.material_slots else None


def ridge_roof(g, mat, L_, W, he, pitch, th, over_side, over_end, M_):
    """A pitched roof on walls W wide (outside), ridge along local X, eaves at he: two slabs as one prism."""
    tp = math.tan(pitch)
    tv = th / math.cos(pitch)
    a = W / 2 + over_side
    ze = he - over_side * tp - 0.06
    zr = he + W / 2 * tp - 0.06
    prof = [(-a, ze + tv), (0, zr + tv), (a, ze + tv), (a, ze), (0, zr), (-a, ze)]
    T0 = g.T
    g.T = M_ @ Matrix.Rotation(math.pi / 2, 4, "Z")
    g.prism(mat, prof, L_ + 2 * over_end)
    g.T = T0


def gable(g, mat, W, he, pitch, t, x, M_):
    tp = math.tan(pitch)
    T0 = g.T
    g.T = M_ @ Matrix.Translation((x, 0, 0)) @ Matrix.Rotation(math.pi / 2, 4, "Z")
    g.prism(mat, [(-W / 2, he - 0.02), (W / 2, he - 0.02), (0, he + W / 2 * tp - 0.04)], t)
    g.T = T0


def hip_roof(bm, L_, W, zb, pitch, th, over, M_):
    """A thick hipped roof (thatch) over an L x W building, as one convex solid; its flat underside at zb."""
    a, b = L_ / 2 + over, W / 2 + over
    rise = b * math.tan(pitch)
    pts = [(sx * a, sy * b, z) for sx in (-1, 1) for sy in (-1, 1) for z in (zb, zb + th)]
    pts += [(sx * max(0.2, a - b), 0, zb + th + rise) for sx in (-1, 1)]
    vs = [bm.verts.new(M_ @ Vector(p)) for p in pts]
    bmesh.ops.convex_hull(bm, input=vs)


def cone_roof(bm, r, zb, th, h, M_, seg=28):
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=th, matrix=M_ @ Matrix.Translation((0, 0, zb + th / 2)))
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=0.05, depth=h,
                          matrix=M_ @ Matrix.Translation((0, 0, zb + th + h / 2 - 0.02)))


def footing(x, y, w, d, rot):
    """The lowest ground under a footprint: where a building's floor goes."""
    c, s = math.cos(rot), math.sin(rot)
    pts = [(x + c * u - s * v, y + s * u + c * v) for u in (-w / 2, 0, w / 2) for v in (-d / 2, 0, d / 2)]
    return min(_gz(px, py) for px, py in pts)


def church(sc, g, walls, cuts, panes, x, y):
    """A small early Anglo-Saxon church, after Escomb: a tall narrow nave and a small square chancel to the east,
    rough rubble walls, a few small round-headed windows set high, a stone-slab roof."""
    Ln, Wn, Hn, t = 13.6, 6.2, 6.4, 0.8
    Lc, Wc, Hc = 4.8, 4.6, 4.9
    z0 = footing(x + 2.4, y, Ln + Lc, Wn, 0) + 0.15
    pitch = math.radians(52)
    Mn = Matrix.Translation((x, y, z0))
    Mc = Matrix.Translation((x + Ln / 2 + Lc / 2 - t, y, z0))
    sink = Matrix.Translation((0, 0, -1.2))
    wall_ring(walls, Ln, Wn, Hn + 1.2, t, Mn @ sink)
    wall_ring(walls, Lc + t, Wc, Hc + 1.2, t, Mc @ sink)
    g.box("lf_floor", (Ln - 2 * t + 0.02, Wn - 2 * t + 0.02, 0.2), (x, y, z0 - 0.1))
    g.box("lf_floor", (Lc - t + 0.02, Wc - 2 * t + 0.02, 0.2), (x + Ln / 2 + Lc / 2 - t / 2, y, z0 - 0.1))
    for xx in (-Ln / 2 + t / 2, Ln / 2 - t / 2):
        gable(g, "lf_church", Wn, Hn, pitch, t, xx, Mn)
    gable(g, "lf_church", Wc, Hc, pitch, t, Lc / 2 + t / 2 - t, Mc)
    ridge_roof(g, "lf_slates", Ln, Wn, Hn, pitch, 0.22, 0.35, 0.3, Mn)
    ridge_roof(g, "lf_slates", Lc, Wc, Hc, pitch, 0.2, 0.3, 0.3, Mc @ Matrix.Translation((0.25, 0, 0)))
    # windows: (wall: "S", "N", "W" or "E", position along it, sill height, lit?)
    win = [("S", -3.6, 3.7, True), ("S", 0.4, 3.7, True), ("S", 4.2, 3.7, False), ("N", -2.0, 3.7, True),
           ("N", 2.6, 3.7, False), ("W", 0.0, 4.4, True)]
    R90 = Matrix.Rotation(math.pi / 2, 4, "Z")
    for side, u, sill, lit in win + [("CS", 0.0, 2.6, True), ("CE", 0.0, 2.8, True)]:
        if side in ("S", "N"):
            M_ = Mn @ Matrix.Translation((u, (-1 if side == "S" else 1) * (Wn / 2 - t / 2), sill))
            if side == "N":
                M_ = M_ @ Matrix.Rotation(math.pi, 4, "Z")
        elif side == "W":
            M_ = Mn @ Matrix.Translation((-Ln / 2 + t / 2, u, sill)) @ R90 @ Matrix.Rotation(math.pi, 4, "Z")
        elif side == "CS":
            M_ = Mc @ Matrix.Translation((0.3, -(Wc / 2 - t / 2), sill))
        else:
            M_ = Mc @ Matrix.Translation((Lc / 2 + t / 2 - t, 0, sill)) @ R90
        frustum(cuts, arch_profile(0.95, 1.55), arch_profile(0.42, 1.05), t + 0.3, M_ @ Matrix.Translation((0, 0, -0.25)))
        pane_at(panes, M_, 0.44, 1.07, t / 2 - 0.18, "lf_glow" if lit else "lf_door")
    # west door, round-headed, its door a little open on a candlelit nave
    Md = Mn @ Matrix.Translation((-Ln / 2 + t / 2, -0.6, 0.0)) @ R90 @ Matrix.Rotation(math.pi, 4, "Z")
    frustum(cuts, arch_profile(1.25, 2.55), arch_profile(1.25, 2.55), t + 0.4, Md @ Matrix.Translation((0, 0, -0.05)))
    hinge = Md @ Matrix.Translation((-0.6, t / 2 - 0.22, 0.0)) @ Matrix.Rotation(math.radians(-24), 4, "Z")
    T0 = g.T
    g.T = hinge
    g.box("lf_door", (1.15, 0.08, 2.0), (0.575, 0.04, 1.0))
    g.T = T0
    for k, (u, h) in enumerate(((-3.0, 1.6), (2.5, 1.8))):
        light("POINT", (x + u, y, z0 + h), 28 if k == 0 else 22, "#ff9a48", 0.08)
    light("POINT", (x + Ln / 2 + 1.0, y, z0 + 1.5), 12, "#ff9a48", 0.08)
    return z0, Hn


def pane_at(bm_g, M_, w, h, depth, mat):
    """The glowing (or dark) pane inside a window opening, as a flat arch shape facing out."""
    bm = bm_g.bm(mat)
    M2 = M_ @ Matrix.Translation((0, depth, 0))
    vs = [bm.verts.new(M2 @ Vector((x, 0, z))) for x, z in arch_profile(w, h)]
    bm.faces.new(vs)


def hall(sc, g, x, y, rot, L_=9.5, W=5.4, lit=True):
    """A timber hall with a thick hipped thatched roof."""
    z0 = footing(x, y, L_, W, rot) + 0.1
    M_ = Matrix.Translation((x, y, z0)) @ Matrix.Rotation(rot, 4, "Z")
    He = 2.3
    bm = g.bm("lf_timber")
    wall_ring(bm, L_, W, He + 0.5, 0.22, M_ @ Matrix.Translation((0, 0, -0.5)))
    T0 = g.T
    g.T = M_
    for sx in (-1, 1):
        for sy in (-1, 1):
            g.box("lf_timber", (0.32, 0.32, He + 0.5), (sx * (L_ / 2 - 0.1), sy * (W / 2 - 0.1), He / 2 - 0.25))
    g.box("lf_door", (1.2, 0.12, 1.9), (0.8, -W / 2 - 0.02, 0.95))
    g.box("lf_floor", (L_ - 0.4, W - 0.4, 0.1), (0, 0, -0.04))
    if lit:
        g.box("lf_glow_dim", (0.55, 0.06, 0.45), (-2.6, -W / 2 - 0.005, 1.45))
        g.box("lf_timber", (0.62, 0.08, 0.06), (-2.6, -W / 2 - 0.03, 1.71))
        g.box("lf_glow_dim", (0.05, 0.1, 1.5), (1.38, -W / 2 - 0.02, 0.95))  # light round the door
    g.T = T0
    hip_roof(g.bm("lf_thatch"), L_, W, He - 0.25, math.radians(53), 0.5, 0.75, M_)
    if lit:
        light("POINT", M_ @ Vector((-1.5, 0, 1.4)), 14, "#ff9040", 0.1)
    return z0


def cell(sc, g, walls, cuts, x, y, r=2.6, door=0.0, lit=False):
    """A round stone cell with a conical thatched roof, the door facing `door` (radians)."""
    z0 = footing(x, y, 2 * r, 2 * r, 0) + 0.1
    M_ = Matrix.Translation((x, y, z0))
    H = 1.9
    round_wall(walls, r, H + 0.6, 0.6, M_ @ Matrix.Translation((0, 0, -0.6)))
    Md = M_ @ Matrix.Rotation(door, 4, "Z") @ Matrix.Translation((r - 0.3, 0, 0)) @ Matrix.Rotation(math.pi / 2, 4, "Z")
    frustum(cuts, arch_profile(0.9, 1.55, 6), arch_profile(0.9, 1.55, 6), 1.2, Md @ Matrix.Translation((0, 0, -0.05)))
    cone_roof(g.bm("lf_thatch"), r + 0.55, H - 0.2, 0.42, 2.7, M_)
    g.box("lf_floor", (2 * r - 1.0, 2 * r - 1.0, 0.1), (x, y, z0 - 0.04))
    if lit:
        light("POINT", (x, y, z0 + 1.0), 9, "#ff9040", 0.08)
    return z0


def cross(g, x, y, face=0.0):
    """A tall standing cross: a stepped base, a tapering shaft and a ringed head."""
    z0 = _gz(x, y) - 0.15
    T0 = g.T
    g.T = Matrix.Translation((x, y, z0)) @ Matrix.Rotation(face, 4, "Z")
    m = "lf_sandstone"
    g.box(m, (1.7, 1.7, 0.5), (0, 0, 0.1))
    g.box(m, (1.15, 1.15, 0.36), (0, 0, 0.53))
    sh = 3.9
    g.cyl(m, 0.3, 0.2, sh, 4, (0, 0, 0.71 + sh / 2), rot=(0, 0, math.pi / 4), scale=(1.0, 0.72, 1.0))
    hz = 0.71 + sh + 0.38
    g.cyl(m, 0.17, 0.25, 0.62, 4, (0, 0, hz + 0.38), rot=(0, 0, math.pi / 4), scale=(1.0, 0.75, 1.0))
    g.box(m, (0.36, 0.26, 0.42), (0, 0, hz))
    for s in (-1, 1):
        g.cyl(m, 0.15, 0.24, 0.5, 4, (s * 0.38, 0, hz), rot=(0, s * math.pi / 2, math.pi / 4), scale=(1.0, 0.75, 1.0))
    g.ring(m, 0.43, 0.06, 16, (0, 0, hz), rot=(math.pi / 2, 0, 0))
    g.T = T0


def enclosure(g, cx, cy, ra, rb, gap=(-2.6, -1.9)):
    """The low dry-stone wall round the monastery, stepping with the ground, with a gateway."""
    n = int(2 * math.pi * (ra + rb) / 2 / 1.7)
    pts = [(cx + ra * math.cos(2 * math.pi * i / n), cy + rb * math.sin(2 * math.pi * i / n)) for i in range(n + 1)]
    rng = random.Random(SEED + 1)
    for i in range(n):
        a = 2 * math.pi * (i + 0.5) / n
        aa = math.atan2(math.sin(a), math.cos(a))
        if gap[0] < aa < gap[1]:
            continue
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2
        L_ = math.hypot(x1 - x0, y1 - y0) + 0.25
        h = rng.uniform(1.0, 1.25)
        z = _gz(mx, my)
        g.box("lf_drystone", (L_, 0.85, h + 0.5), (mx, my, z + h / 2 - 0.25), rot=(0, 0, math.atan2(y1 - y0, x1 - x0)))


def build_priory(sc):
    g = Geo("priory")
    walls, cells_bm, cuts = bmesh.new(), bmesh.new(), bmesh.new()
    cx, cy = PRIORY
    z0, hn = church(sc, g, walls, cuts, g, cx, cy + 6)
    hall(sc, g, cx + 21, cy - 12, math.radians(4), lit=True)
    hall(sc, g, cx + 26, cy + 18, math.radians(92), 8.5, 5.0, lit=False)
    cell(sc, g, cells_bm, cuts, cx - 20, cy + 18, 2.6, math.radians(-120), lit=True)
    cell(sc, g, cells_bm, cuts, cx - 23, cy - 3, 2.4, math.radians(-160), lit=False)
    cell(sc, g, cells_bm, cuts, cx - 8, cy + 24, 2.3, math.radians(-90), lit=False)
    cross(g, cx - 13, cy + 1.5)
    enclosure(g, cx + 3, cy + 4, 34, 31)
    cuts2 = cuts.copy()
    w = to_object(sc, "church_walls", walls, "lf_church")
    c = to_object(sc, "cell_walls", cells_bm, "lf_drystone")
    cut(sc, w, cuts)
    cut(sc, c, cuts2)
    g.finish()
    return Vector((cx, cy + 6, z0)), hn


# ------------------------------------------------------------------ the whole place
def build(sc):
    """Build the night, the sea, the island and the monastery into sc. Returns a dict:
      priory      Vector: middle of the church floor
      cross       Vector: foot of the standing cross
      headland    Vector: top of the rocky headland
      sea_level   0.0
      sky_focus   Vector: where the dragons look best from the beach camera, about 120 m up over the bay
      sky_box     ((x0, y0, z0), (x1, y1, z1)): the airspace to fly them through, 60-200 m up
      moon_dir    Vector towards the moon (the sun lamp "moon" shines from there)
      north       Vector((0, 1, 0))
      cameras     {"beach": (pos, look_at, lens), "bay": ..., "priory": ...}: 16:9 compositions
      frames      FRAMES (the sea and the aurora move over these; they keep moving after)
    """
    rng = random.Random(SEED)
    sc.frame_start, sc.frame_end = 1, FRAMES
    sc.render.fps = FPS
    sc.world = world()
    materials()
    moon(sc)
    build_terrain(sc)
    build_sea(sc)
    build_rocks(sc, rng)
    church_at, nave_h = build_priory(sc)
    ch = Vector((CRAG.x, CRAG.y, _gz(CRAG.x, CRAG.y)))
    beach = Vector((-20.0, -78.0))
    bz = _gz(beach.x, beach.y)
    cams = {
        # (a) low and wide from the wet sand: the sea and the headland on the left, the monastery on its rise
        # against the sky on the right, most of the frame sky
        "beach": ((beach.x, beach.y, bz + 1.7), (-29.0, 40.0, bz + 22.0), 24.0),
        # (b) from a boat-height-and-more over the bay: the beach, the monastery, the headland, the open sea
        "bay": ((-215.0, -255.0, 34.0), (-58.0, 95.0, 4.0), 30.0),
        # (c) close, low, from the west: the cross and the church gable against the aurora
        "priory": ((-36.0, -10.0, _gz(-36, -10) + 1.6), (-4.0, 10.0, _gz(-4, 10) + 7.0), 26.0),
    }
    return {
        "priory": church_at,
        "cross": Vector((PRIORY.x - 13, PRIORY.y + 1.5, _gz(PRIORY.x - 13, PRIORY.y + 1.5))),
        "headland": ch,
        "beach": Vector((beach.x, beach.y, bz)),
        "sea_level": 0.0,
        "sky_focus": Vector((-45.0, 150.0, 120.0)),
        "sky_box": ((-320.0, -60.0, 60.0), (220.0, 480.0, 200.0)),
        "moon_dir": bearing_dir(MOON_BEARING, HDRI_MOON[1]),
        "north": Vector((0.0, 1.0, 0.0)),
        "cameras": {k: (Vector(p), Vector(l), lens) for k, (p, l, lens) in cams.items()},
        "frames": FRAMES,
    }


def look(sc, bloom=0.45, size=0.55, threshold=1.2, mist_blur=None):
    """After lib.setup_render: haze in the night's own colour, a soft bloom on the windows."""
    compositor(sc, haze=HAZE, haze_color=hexcolor(haze_rgb()), bloom=bloom, size=size, threshold=threshold)
    smooth_mist(sc, mist_blur or max(2, round(6 * sc.render.resolution_x * sc.render.resolution_percentage / 100 / 1920)))


def camera(sc, shot, name="cam"):
    """Make a camera from a (position, look-at, lens) tuple and make it the scene's."""
    pos, at, lens = shot
    cd = bpy.data.cameras.new(name)
    cd.lens, cd.sensor_width, cd.clip_start, cd.clip_end = lens, 36.0, 0.1, 20000.0
    ob = bpy.data.objects.new(name, cd)
    ob.location = pos
    ob.rotation_euler = (Vector(at) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
    sc.collection.objects.link(ob)
    sc.camera = ob
    return ob
