"""The dragon's hoard (Beowulf): a burial chamber inside a mound, a heap of gold, the dragon asleep on it.

    import env_hoard
    sc = lib.reset()
    info = env_hoard.build(sc, dragon=True)          # info["cameras"]: wide, cup, head
    lib.setup_render(sc, ...); sc.render.resolution_x, sc.render.resolution_y = 1920, 1080

The chamber is a corbelled dry-stone vault (like Maeshowe) under an earth mound, earth floor, roots coming
through the stones. A shaft of pale daylight falls through a collapsed hole in the roof onto the top of the
heap, where the jewelled cup stands; the thief's torch glows warm from the entrance passage, front right.
A visible beam is faked with a camera-only emissive tube (no volumetrics).

Free CC0 assets from Poly Haven, downloaded on first use into blender/assets/polyhaven/ (see ASSETS).
The dragon is "Animated Dragon Three Motion Loops" by LasquetiSpice, CC-BY-4.0 (see dragon_model.py):
its wingbeat is muted and it is posed asleep here.

Chamber coordinates: floor at z = 0, +Y away from the entrance (the back wall), +X to the right as you enter.
Everything random uses fixed seeds, so every run builds the same scene.
"""
import math
import random

import bpy  # first: it makes bmesh and mathutils importable
import bmesh
from mathutils import Euler, Matrix, Quaternion, Vector, noise

from lib import M, get_mat, light, srgb
from dragon import ph_fetch
import dragon_model as dm

ASSETS = {  # Poly Haven ids (all CC0) and what they are used for
    "castle_wall_slates": "dry-stone wall blocks",
    "dark_rock_02": "capstones and big orthostats",
    "brown_mud": "earth floor and the mound's earth",
    "brass_goblets": "gold and silver cups, the jewelled cup",
    "brass_vase_02": "tall ewers",
    "brass_vase_03": "small vases",
    "brass_pot_01": "a cauldron",
    "antique_estoc": "swords",
    "ornate_medieval_dagger": "daggers",
}

# --------------------------------------------------------------------------- layout
RX, RY = 8.4, 7.2          # chamber floor plan: an ellipse, metres
SPRING, TOP = 1.7, 6.7     # the walls rise straight to SPRING, then corbel inward to TOP
CUP = Vector((-0.55, -0.45, 0.0))  # the jewelled cup (z is set from the heap)
SUN = Vector((0.22, 0.62, 1.0)).normalized()  # towards the sun: high, behind the heap as the camera sees it
GAP_R = 0.78               # radius of the hole in the roof, metres
ENTRANCE = (2.3, 0.85, 2.2)  # x of the passage, its half width, its height (front wall, -Y)
TORCH = Vector((2.35, -6.25, 1.45))

MOUNDS = [  # the heap of gold: x, y, radius x, radius y, height
    (0.0, 0.7, 3.7, 2.9, 1.45),
    (-3.9, -0.4, 1.6, 1.3, 0.45),
    (3.5, -0.9, 1.3, 1.1, 0.35),
    (2.9, 2.7, 1.8, 1.5, 0.6),
    (-2.6, 2.9, 1.7, 1.4, 0.55),
    (-0.8, -2.9, 1.0, 0.8, 0.18),
]


def heap_h(x, y):
    """Height of the gold heap above the floor at (x, y)."""
    h = 0.0
    for cx, cy, rx, ry, hh in MOUNDS:
        r2 = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
        if r2 < 1:
            h += hh * (1 - r2) ** 1.35
    if h > 0:
        v = Vector((x * 0.7, y * 0.7, 0.3))
        h *= 1 + 0.10 * noise.noise(v) + 0.04 * noise.noise(v * 3.1)
    return h


def heap_n(x, y, e=0.02):
    """Surface normal of the heap."""
    return Vector((heap_h(x - e, y) - heap_h(x + e, y), heap_h(x, y - e) - heap_h(x, y + e), 2 * e)).normalized()


def on_heap(x, y, lift=0.0):
    return Vector((x, y, heap_h(x, y) + lift))


def wall_s(z):
    """How far in the vault has corbelled at height z: 1 at the walls, less towards the top."""
    if z <= SPRING:
        return 1.0
    u = min(1.0, (z - SPRING) / (TOP - SPRING))
    return 1.0 - 0.86 * u ** 1.55


def wall_r(theta, z):
    """Radius of the inner wall face in direction theta at height z (an ellipse, a little irregular)."""
    w = 1 + 0.035 * noise.noise(Vector((math.cos(theta) * 1.7, math.sin(theta) * 1.7, z * 0.3)))
    c, s = math.cos(theta), math.sin(theta)
    return wall_s(z) * w / math.sqrt((c / RX) ** 2 + (s / RY) ** 2)


def cup_pos():
    return on_heap(CUP.x, CUP.y)


def in_tunnel(p, extra=0.0):
    """Is p inside the shaft the sunlight comes down, from the cup up through the roof?"""
    c = cup_pos()
    d = Vector(p) - c
    t = d.dot(SUN)
    if t < 2.0:
        return False
    off = d - SUN * t
    ang = math.atan2(off.y, off.x)
    r = GAP_R * (1 + 0.22 * math.sin(3 * ang + 1.0) + 0.12 * math.sin(5 * ang + 2.3)) + extra
    return off.length < r


# --------------------------------------------------------------------------- materials
def tex_nodes(nt, path, tile, color=True, proj="BOX", vec=None):
    tc = vec
    if tc is None:
        tcn = nt.nodes.new("ShaderNodeTexCoord")
        tc = tcn.outputs["Object"]
    mp, im = nt.nodes.new("ShaderNodeMapping"), nt.nodes.new("ShaderNodeTexImage")
    mp.inputs["Scale"].default_value = (1 / tile,) * 3
    im.image = bpy.data.images.load(path, check_existing=True)
    if not color:
        im.image.colorspace_settings.name = "Non-Color"
    im.projection = proj
    if proj == "BOX":
        im.projection_blend = 0.3
    nt.links.new(tc, mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], im.inputs["Vector"])
    return im


def ph_material(name, asset, tile, value=1.0, sat=1.0, hue=0.5, bump=0.6, rough=(0.0, 1.0), per_block=0.0):
    """A material from a Poly Haven texture set (colour, roughness, displacement as bump), projected
    from the object's coordinates. per_block: tone variation from the face attribute 'blk' (one stone each)."""
    t = ph_fetch(asset, "texture", "2k")
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = next(n for n in nt.nodes if n.bl_idname == "ShaderNodeBsdfPrincipled")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    dif = tex_nodes(nt, t["Diffuse"], tile, vec=tc.outputs["Object"])
    ro = tex_nodes(nt, t["Rough"], tile, False, vec=tc.outputs["Object"])
    di = tex_nodes(nt, t["Displacement"], tile, False, vec=tc.outputs["Object"])
    hs = nt.nodes.new("ShaderNodeHueSaturation")
    hs.inputs["Hue"].default_value, hs.inputs["Saturation"].default_value, hs.inputs["Value"].default_value = hue, sat, value
    nt.links.new(dif.outputs["Color"], hs.inputs["Color"])
    col = hs.outputs["Color"]
    if per_block:
        at, mix = nt.nodes.new("ShaderNodeAttribute"), nt.nodes.new("ShaderNodeMix")
        at.attribute_name = "blk"
        rng_ = nt.nodes.new("ShaderNodeMapRange")
        rng_.inputs["To Min"].default_value, rng_.inputs["To Max"].default_value = 1 - per_block, 1 + per_block
        nt.links.new(at.outputs["Fac"], rng_.inputs["Value"])
        mix.data_type, mix.blend_type = "RGBA", "MULTIPLY"
        mix.inputs[0].default_value = 1.0
        nt.links.new(col, mix.inputs[6])
        nt.links.new(rng_.outputs["Result"], mix.inputs[7])
        col = mix.outputs[2]
    nt.links.new(col, p.inputs["Base Color"])
    rr = nt.nodes.new("ShaderNodeMapRange")
    rr.inputs["To Min"].default_value, rr.inputs["To Max"].default_value = rough
    nt.links.new(ro.outputs["Color"], rr.inputs["Value"])
    nt.links.new(rr.outputs["Result"], p.inputs["Roughness"])
    bp = nt.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value, bp.inputs["Distance"].default_value = 1.0, bump * 0.05
    nt.links.new(di.outputs["Color"], bp.inputs["Height"])
    nt.links.new(bp.outputs["Normal"], p.inputs["Normal"])
    return m


def gold_heap_material():
    """The heap's surface reads as countless coins: Voronoi cells, each a disc tilted its own way."""
    m = bpy.data.materials.new("heap_gold")
    m.use_nodes = True
    nt = m.node_tree
    L = nt.links.new
    p = next(n for n in nt.nodes if n.bl_idname == "ShaderNodeBsdfPrincipled")
    p.inputs["Metallic"].default_value = 1.0
    tc, geo = nt.nodes.new("ShaderNodeTexCoord"), nt.nodes.new("ShaderNodeNewGeometry")
    vo = nt.nodes.new("ShaderNodeTexVoronoi")
    vo.voronoi_dimensions, vo.feature = "3D", "F1"
    vo.inputs["Scale"].default_value = 42.0
    vo.inputs["Randomness"].default_value = 0.85
    L(tc.outputs["Object"], vo.inputs["Vector"])
    # disc mask: inside a coin where the distance to the cell centre is small
    disc = nt.nodes.new("ShaderNodeMapRange")
    disc.inputs["From Min"].default_value, disc.inputs["From Max"].default_value = 0.42, 0.36
    L(vo.outputs["Distance"], disc.inputs["Value"])
    # each coin's own tilt: the cell's random colour bends the normal
    sub, add, nrm, mixn = (nt.nodes.new("ShaderNodeVectorMath"), nt.nodes.new("ShaderNodeVectorMath"),
                           nt.nodes.new("ShaderNodeVectorMath"), nt.nodes.new("ShaderNodeMix"))
    sub.operation = "SUBTRACT"
    sub.inputs[1].default_value = (0.5, 0.5, 0.5)
    L(vo.outputs["Color"], sub.inputs[0])
    sc_ = nt.nodes.new("ShaderNodeVectorMath")
    sc_.operation, sc_.inputs[3].default_value = "SCALE", 1.5
    L(sub.outputs[0], sc_.inputs[0])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value, bump.inputs["Distance"].default_value = 0.6, 0.002
    L(disc.outputs["Result"], bump.inputs["Height"])
    add.operation = "ADD"
    L(bump.outputs["Normal"], add.inputs[0])
    L(sc_.outputs[0], add.inputs[1])
    nrm.operation = "NORMALIZE"
    L(add.outputs[0], nrm.inputs[0])
    mixn.data_type = "VECTOR"
    L(disc.outputs["Result"], mixn.inputs[0])
    L(bump.outputs["Normal"], mixn.inputs[4])
    L(nrm.outputs[0], mixn.inputs[5])
    L(mixn.outputs[1], p.inputs["Normal"])
    # colour: gold coins, a dark crevice between them; each coin a slightly different alloy
    tint = nt.nodes.new("ShaderNodeValToRGB")
    e = tint.color_ramp.elements
    e[0].position, e[0].color = 0.0, srgb("#d9a441")
    e[1].position, e[1].color = 1.0, srgb("#f2cf74")
    mid = e.new(0.55)
    mid.color = srgb("#e6b552")
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    L(vo.outputs["Color"], sep.inputs[0])
    L(sep.outputs[1], tint.inputs[0])
    col = nt.nodes.new("ShaderNodeMix")
    col.data_type = "RGBA"
    col.inputs[6].default_value = srgb("#3a2508")
    L(disc.outputs["Result"], col.inputs[0])
    L(tint.outputs[0], col.inputs[7])
    L(col.outputs[2], p.inputs["Base Color"])
    ro = nt.nodes.new("ShaderNodeMapRange")
    ro.inputs["To Min"].default_value, ro.inputs["To Max"].default_value = 0.16, 0.42
    L(sep.outputs[2], ro.inputs["Value"])
    rmix = nt.nodes.new("ShaderNodeMix")
    rmix.inputs[2].default_value = 0.75
    L(disc.outputs["Result"], rmix.inputs[0])
    L(ro.outputs["Result"], rmix.inputs[3])
    L(rmix.outputs[0], p.inputs["Roughness"])
    return m


def coin_material(name, base, rough=0.2):
    """A coin: worn stamped face (bead border and a blurred relief), each instance a slightly different tone."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    L = nt.links.new
    p = next(n for n in nt.nodes if n.bl_idname == "ShaderNodeBsdfPrincipled")
    p.inputs["Metallic"].default_value = 1.0
    tc, oi = nt.nodes.new("ShaderNodeTexCoord"), nt.nodes.new("ShaderNodeObjectInfo")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    L(tc.outputs["Object"], sep.inputs[0])
    # radius and angle on the face
    r, ang = nt.nodes.new("ShaderNodeVectorMath"), nt.nodes.new("ShaderNodeMath")
    comb = nt.nodes.new("ShaderNodeCombineXYZ")
    L(sep.outputs["X"], comb.inputs["X"])
    L(sep.outputs["Y"], comb.inputs["Y"])
    r.operation = "LENGTH"
    L(comb.outputs[0], r.inputs[0])
    ang.operation = "ARCTAN2"
    L(sep.outputs["Y"], ang.inputs[0])
    L(sep.outputs["X"], ang.inputs[1])
    beads = nt.nodes.new("ShaderNodeMath")
    beads.operation = "SINE"
    k = nt.nodes.new("ShaderNodeMath")
    k.operation, k.inputs[1].default_value = "MULTIPLY", 36.0
    L(ang.outputs[0], k.inputs[0])
    L(k.outputs[0], beads.inputs[0])
    ring = nt.nodes.new("ShaderNodeMapRange")  # a band of beads just inside the rim
    ring.interpolation_type = "SMOOTHSTEP"
    ring.inputs["From Min"].default_value, ring.inputs["From Max"].default_value = 0.0006, 0.0
    d = nt.nodes.new("ShaderNodeMath")
    d.operation = "ABSOLUTE"
    off = nt.nodes.new("ShaderNodeMath")
    off.operation, off.inputs[1].default_value = "SUBTRACT", 0.0092
    L(r.outputs["Value"], off.inputs[0])
    L(off.outputs[0], d.inputs[0])
    L(d.outputs[0], ring.inputs["Value"])
    bead = nt.nodes.new("ShaderNodeMath")
    bead.operation = "MULTIPLY"
    L(ring.outputs["Result"], bead.inputs[0])
    L(beads.outputs[0], bead.inputs[1])
    relief = nt.nodes.new("ShaderNodeTexNoise")  # the worn portrait: a soft lump of relief in the middle
    relief.inputs["Scale"].default_value, relief.inputs["Detail"].default_value = 260.0, 3.0
    L(tc.outputs["Object"], relief.inputs["Vector"])
    cen = nt.nodes.new("ShaderNodeMapRange")
    cen.interpolation_type = "SMOOTHSTEP"
    cen.inputs["From Min"].default_value, cen.inputs["From Max"].default_value = 0.0078, 0.0055
    L(r.outputs["Value"], cen.inputs["Value"])
    rel = nt.nodes.new("ShaderNodeMath")
    rel.operation = "MULTIPLY"
    L(relief.outputs["Fac"], rel.inputs[0])
    L(cen.outputs["Result"], rel.inputs[1])
    h = nt.nodes.new("ShaderNodeMath")
    h.operation = "ADD"
    L(bead.outputs[0], h.inputs[0])
    L(rel.outputs[0], h.inputs[1])
    bp = nt.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value, bp.inputs["Distance"].default_value = 0.5, 0.0003
    L(h.outputs[0], bp.inputs["Height"])
    L(bp.outputs["Normal"], p.inputs["Normal"])
    tint = nt.nodes.new("ShaderNodeValToRGB")
    e = tint.color_ramp.elements
    e[0].color, e[1].color = srgb(base[0]), srgb(base[1])
    L(oi.outputs["Random"], tint.inputs[0])
    L(tint.outputs[0], p.inputs["Base Color"])
    rr = nt.nodes.new("ShaderNodeMapRange")
    rr.inputs["To Min"].default_value, rr.inputs["To Max"].default_value = rough * 0.6, rough * 1.6
    L(oi.outputs["Random"], rr.inputs["Value"])
    L(rr.outputs["Result"], p.inputs["Roughness"])
    return m


def metal_mat(name, color, rough, tex=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = next(n for n in m.node_tree.nodes if n.bl_idname == "ShaderNodeBsdfPrincipled")
    p.inputs["Base Color"].default_value = srgb(color)
    p.inputs["Metallic"].default_value = 1.0
    p.inputs["Roughness"].default_value = rough
    if tex:  # fine hammered / worn surface
        nt = m.node_tree
        tc, nz, bp = nt.nodes.new("ShaderNodeTexCoord"), nt.nodes.new("ShaderNodeTexNoise"), nt.nodes.new("ShaderNodeBump")
        nz.inputs["Scale"].default_value, nz.inputs["Detail"].default_value = tex, 4.0
        bp.inputs["Strength"].default_value, bp.inputs["Distance"].default_value = 0.25, 0.002
        nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
        nt.links.new(nz.outputs["Fac"], bp.inputs["Height"])
        nt.links.new(bp.outputs["Normal"], p.inputs["Normal"])
    return m


def gem_mat(name, color, emit=0.0):
    """A cut gem: a deep colour under a sharp, strong reflection (no refraction, which costs bounces)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = next(n for n in m.node_tree.nodes if n.bl_idname == "ShaderNodeBsdfPrincipled")
    p.inputs["Base Color"].default_value = srgb(color)
    p.inputs["Roughness"].default_value = 0.03
    p.inputs["IOR"].default_value = 1.77
    p.inputs["Specular IOR Level"].default_value = 1.0
    p.inputs["Coat Weight"].default_value = 1.0
    p.inputs["Coat Roughness"].default_value = 0.0
    if emit:
        p.inputs["Emission Color"].default_value = srgb(color)
        p.inputs["Emission Strength"].default_value = emit
    return m


M("hoard_iron", "#2b2622", rough=0.55, metal=0.85, vary=0.25)
M("hoard_rust", "#5a2f18", rough=0.85, metal=0.2, vary=0.3)
M("hoard_root", "#3b2a1f", rough=0.85, vary=0.25)
M("hoard_root_pale", "#6b5440", rough=0.9, vary=0.2)
M("hoard_wood_rot", "#3a2c20", rough=0.9, vary=0.3)
M("hoard_sky", "#000000", emit="#dfe9ff", strength=6.0)


# --------------------------------------------------------------------------- helpers
def link(ob, coll=None):
    (coll or bpy.context.scene.collection).objects.link(ob)
    return ob


def mesh_obj(name, bm, mat, smooth=False):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        me.shade_smooth()
    if isinstance(mat, (list, tuple)):
        for mm in mat:
            me.materials.append(mm)
    else:
        me.materials.append(mat)
    return link(bpy.data.objects.new(name, me))


def import_parts(path):
    """Import a glTF; return its mesh objects (unparented, transforms applied) and remove the empties."""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    bpy.context.view_layer.update()
    new = [o for o in bpy.data.objects if o not in before]
    meshes = []
    for o in new:
        if o.type == "MESH":
            mw = o.matrix_world.copy()
            o.parent = None
            o.matrix_world = mw
            meshes.append(o)
    for o in new:
        if o.type != "MESH":
            bpy.data.objects.remove(o)
    return meshes


def base_at_origin(ob):
    """Move a model's mesh so its origin sits at the centre of its base."""
    me = ob.data
    me.transform(ob.matrix_world)
    ob.matrix_world = Matrix.Identity(4)
    vs = [v.co for v in me.vertices]
    cx = (min(v.x for v in vs) + max(v.x for v in vs)) / 2
    cy = (min(v.y for v in vs) + max(v.y for v in vs)) / 2
    me.transform(Matrix.Translation((-cx, -cy, -min(v.z for v in vs))))
    return ob


def place(src, loc, rot=(0, 0, 0), scale=1.0, mat=None, name=None):
    """Another object sharing src's mesh (Cycles keeps one copy)."""
    ob = bpy.data.objects.new(name or src.name, src.data)
    ob.location, ob.rotation_euler, ob.scale = loc, rot, (scale,) * 3
    if mat is not None:  # this copy's own material, leaving the shared mesh alone
        ob.material_slots[0].link = "OBJECT"
        ob.material_slots[0].material = mat
    return link(ob)


def settle(n, spin, tilt_axis=0.0, tilt=0.0):
    """Rotation that stands an object on a surface with normal n, spun about it, then tipped by tilt."""
    q = Vector((0, 0, 1)).rotation_difference(n)
    q = q @ Quaternion((0, 0, 1), spin)
    if tilt:
        q = Quaternion((math.cos(tilt_axis), math.sin(tilt_axis), 0), tilt) @ q
    return q.to_euler()


# --------------------------------------------------------------------------- chamber
def rough_block(bm, size, mx, rng, jag=0.025, bevel=0.05):
    """A rough stone: a bevelled box, its corners pushed about, transformed by mx."""
    tmp = bmesh.new()
    bmesh.ops.create_cube(tmp, size=1.0)
    for v in tmp.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    bmesh.ops.bevel(tmp, geom=list(tmp.edges), offset=min(bevel, min(size) * 0.3), segments=2, affect="EDGES",
                    profile=0.6)
    o = Vector((rng.uniform(0, 50), rng.uniform(0, 50), rng.uniform(0, 50)))
    for v in tmp.verts:
        v.co += Vector((noise.noise(v.co * 3 + o), noise.noise(v.co * 3 + o + Vector((7, 0, 0))),
                        noise.noise(v.co * 3 + o + Vector((0, 9, 0))))) * jag
        v.co = mx @ v.co
    shade = rng.random()
    me = bpy.data.meshes.new("tmp")
    tmp.to_mesh(me)
    tmp.free()
    n0 = len(bm.faces)
    bm.from_mesh(me)
    bpy.data.meshes.remove(me)
    lay = bm.faces.layers.float.get("blk") or bm.faces.layers.float.new("blk")
    bm.faces.ensure_lookup_table()
    for f in bm.faces[n0:]:
        f[lay] = shade


def ellipse_pt(theta, z, out=0.0):
    r = wall_r(theta, z) + out
    return Vector((r * math.cos(theta), r * math.sin(theta), z))


def build_chamber(sc):
    rng = random.Random(11)
    wall = ph_material("hoard_wall", "castle_wall_slates", 2.2, value=0.55, sat=0.7, bump=0.9, rough=(0.55, 0.95),
                       per_block=0.28)
    slab = ph_material("hoard_slab", "dark_rock_02", 2.5, value=0.7, sat=0.6, bump=1.0, rough=(0.5, 0.9), per_block=0.2)
    earth = ph_material("hoard_earth", "brown_mud", 2.0, value=0.6, sat=0.9, bump=0.8, rough=(0.7, 1.0))
    ex, ew, eh = ENTRANCE

    # dry-stone courses, big orthostats at the bottom, corbelled inward towards the top
    bm, bm_big = bmesh.new(), bmesh.new()
    z = 0.0
    course = 0
    while z < TOP - 0.15:
        big = z < 0.05
        hgt = rng.uniform(1.25, 1.6) if big else rng.uniform(0.2, 0.36)
        zc = z + hgt / 2
        theta = rng.uniform(0, 2 * math.pi)
        end = theta + 2 * math.pi
        while theta < end - 0.02:
            r = wall_r(theta, zc)
            L = (rng.uniform(1.1, 1.9) if big else rng.uniform(0.45, 1.15)) * (0.7 + 0.3 * wall_s(zc))
            dth = L / r
            dth = min(dth, end - theta)
            mid = theta + dth / 2
            p = ellipse_pt(mid, zc)
            t = (ellipse_pt(mid + 0.01, zc) - ellipse_pt(mid - 0.01, zc)).normalized()
            n_out = Vector((p.x / RX ** 2, p.y / RY ** 2, 0)).normalized()
            depth = rng.uniform(0.5, 0.8) if not big else rng.uniform(0.35, 0.55)
            proud = rng.uniform(-0.04, 0.07)
            c = p + n_out * (depth / 2 - proud)
            # the passage in the front wall, and the hole the sunlight comes through
            if c.y < 0 and abs(c.x - ex) < ew + L * 0.45 and z < eh:
                theta += dth
                continue
            if in_tunnel(c, extra=0.25):
                theta += dth
                continue
            up = Vector((0, 0, 1))
            if z > SPRING:  # corbelled stones lean a little, their faces following the vault
                up = (up - n_out * 0.25).normalized()
            x_ax = t
            y_ax = up.cross(x_ax).normalized()
            z_ax = x_ax.cross(y_ax)
            rotm = Matrix((x_ax, y_ax, z_ax)).transposed().to_4x4()
            rotm = rotm @ Euler((rng.uniform(-0.04, 0.04), rng.uniform(-0.03, 0.03), rng.uniform(-0.04, 0.04))).to_matrix().to_4x4()
            mx = Matrix.Translation(c) @ rotm
            size = (L * 0.5 * (r * dth) / L * 2 - rng.uniform(0.02, 0.06), depth, hgt - rng.uniform(0.015, 0.04))
            rough_block(bm_big if big else bm, size, mx, rng, jag=0.04 if big else 0.02, bevel=0.06 if big else 0.035)
            theta += dth
        z += hgt
        course += 1
    walls = mesh_obj("hoard_walls", bm, wall)
    orth = mesh_obj("hoard_orthostats", bm_big, slab)

    # capstones over the top of the vault, leaving the hole
    bm = bmesh.new()
    for k, (x, y, a, w, l) in enumerate(((-0.9, -0.2, 0.3, 1.6, 3.4), (0.7, -0.6, -0.2, 1.4, 3.0),
                                         (0.2, 1.3, 0.1, 1.5, 3.2), (-1.3, 1.6, -0.4, 1.3, 2.6),
                                         (1.5, 1.4, 0.5, 1.2, 2.4), (-0.4, -1.9, 0.15, 1.3, 2.8))):
        c = Vector((x, y, TOP + 0.12))
        if in_tunnel(c, extra=0.55):
            continue
        mx = Matrix.Translation(c) @ Euler((rng.uniform(-0.06, 0.06), rng.uniform(-0.06, 0.06), a)).to_matrix().to_4x4()
        rough_block(bm, (l, w, 0.42), mx, rng, jag=0.05, bevel=0.08)
    mesh_obj("hoard_capstones", bm, slab)

    # the mound's earth behind the stones: a closed shell, open only where the roof has fallen in
    bm = bmesh.new()
    nu, nv = 96, 40
    rows = []
    for j in range(nv + 1):
        zz = -0.3 + (TOP + 1.0) * j / nv
        row = []
        for i in range(nu):
            th = 2 * math.pi * i / nu
            if zz < TOP:
                p = ellipse_pt(th, max(0.0, zz), out=0.75)
            else:
                p = ellipse_pt(th, TOP - 0.01, out=0.75) * (1 - (zz - TOP) / 1.0)
                p.z = TOP + 0.55
            row.append(bm.verts.new(p))
        rows.append(row)
    top = bm.verts.new((0, 0, TOP + 0.55))
    for j in range(nv):
        for i in range(nu):
            q = [rows[j][i], rows[j][(i + 1) % nu], rows[j + 1][(i + 1) % nu], rows[j + 1][i]]
            c = sum((v.co for v in q), Vector()) / 4
            if in_tunnel(c, extra=-0.05):
                continue
            bm.faces.new(q)
    for i in range(nu):
        bm.faces.new([rows[-1][i], rows[-1][(i + 1) % nu], top])
    # the outside of the mound around the hole: earth that the light has to pass through
    shell = mesh_obj("hoard_shell", bm, earth)

    # the earth floor: gently uneven, banked up against the walls
    bm = bmesh.new()
    nx, ny = 110, 96
    vs = {}
    for j in range(ny + 1):
        for i in range(nx + 1):
            x, y = -RX - 1.2 + (2 * RX + 2.4) * i / nx, -RY - 1.2 + (2 * RY + 2.4) * j / ny
            e = math.sqrt((x / RX) ** 2 + (y / RY) ** 2)
            bank = 0.35 * max(0.0, (e - 0.82) / 0.18) ** 2
            zz = 0.03 * noise.noise(Vector((x * 0.6, y * 0.6, 1.3))) + 0.012 * noise.noise(Vector((x * 3, y * 3, 0))) + bank
            vs[i, j] = bm.verts.new((x, y, zz - 0.01))
    for j in range(ny):
        for i in range(nx):
            bm.faces.new([vs[i, j], vs[i + 1, j], vs[i + 1, j + 1], vs[i, j + 1]])
    mesh_obj("hoard_floor", bm, earth, smooth=True)

    # fallen stones on the floor near the walls
    bm = bmesh.new()
    for k in range(26):
        th = rng.uniform(0, 2 * math.pi)
        p = ellipse_pt(th, 0.0) * rng.uniform(0.8, 0.93)
        if (p.y < -4 and abs(p.x - ex) < 1.6) or heap_h(p.x, p.y) > 0.05:
            continue
        s = rng.uniform(0.18, 0.5)
        mx = Matrix.Translation((p.x, p.y, s * 0.2)) @ Euler((rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), rng.uniform(0, 6.3))).to_matrix().to_4x4()
        rough_block(bm, (s * rng.uniform(1.2, 2.0), s, s * 0.6), mx, rng, jag=0.03, bevel=0.04)
    mesh_obj("hoard_rubble", bm, wall)

    # the passage: a short corridor of big stones beyond the entrance, dark
    bm = bmesh.new()
    y0 = -wall_r(-math.pi / 2, 0.5) - 0.2
    for k in range(5):
        y = y0 - 0.9 * k
        for sx in (-1, 1):
            mx = Matrix.Translation((ex + sx * (ew + 0.3), y, eh / 2))
            rough_block(bm, (0.6, 0.85, eh), mx, rng, jag=0.04, bevel=0.06)
        mx = Matrix.Translation((ex, y, eh + 0.25))
        rough_block(bm, (2 * ew + 1.3, 0.85, 0.5), mx, rng, jag=0.04, bevel=0.06)
    mx = Matrix.Translation((ex, y0 - 4.6, eh / 2))
    rough_block(bm, (2 * ew + 1.0, 0.5, eh + 0.6), mx, rng, jag=0.05, bevel=0.06)  # blocked further on
    mesh_obj("hoard_passage", bm, slab)

    # sky seen through the hole: emits for the camera only (the sun lamp and a skylight do the lighting)
    c = cup_pos() + SUN * ((TOP + 3.0 - cup_pos().z) / SUN.z)
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=4.0, matrix=Matrix.Translation(c))
    sky = mesh_obj("hoard_sky", bm, get_mat("hoard_sky"))
    for a in ("visible_diffuse", "visible_glossy", "visible_shadow", "visible_transmission"):
        setattr(sky, a, False)
    return {"walls": walls, "shell": shell}


# --------------------------------------------------------------------------- roots
def tube(bm, pts, r0, r1, seg=6):
    """A tapering tube along a polyline."""
    rings = []
    for i, p in enumerate(pts):
        a = pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]
        a.normalize()
        u = a.orthogonal().normalized()
        v = a.cross(u)
        r = r0 + (r1 - r0) * i / (len(pts) - 1)
        rings.append([bm.verts.new(p + (u * math.cos(2 * math.pi * k / seg) + v * math.sin(2 * math.pi * k / seg)) * r)
                      for k in range(seg)])
    for i in range(len(rings) - 1):
        for k in range(seg):
            bm.faces.new([rings[i][k], rings[i][(k + 1) % seg], rings[i + 1][(k + 1) % seg], rings[i + 1][k]])


def root_path(rng, start, length, step=0.06, drift=0.5, gravity=1.0):
    p, pts = Vector(start), [Vector(start)]
    d = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), -gravity)).normalized()
    o = Vector((rng.uniform(0, 99), rng.uniform(0, 99), 0))
    n = int(length / step)
    for i in range(n):
        w = Vector((noise.noise(p * 2.5 + o), noise.noise(p * 2.5 + o + Vector((5, 0, 0))), 0)) * drift
        d = (d + w * 0.35 + Vector((0, 0, -0.18 * gravity))).normalized()
        p = p + d * step
        pts.append(p.copy())
    return pts


def build_roots(sc):
    rng = random.Random(23)
    bm, bm2 = bmesh.new(), bmesh.new()
    c = cup_pos()
    t_gap = (TOP - 0.3 - c.z) / SUN.z
    gap = c + SUN * t_gap
    # around the edge of the hole: roots and rootlets hanging into the light
    for k in range(34):
        a = rng.uniform(0, 2 * math.pi)
        r = GAP_R * rng.uniform(0.85, 1.35)
        u = SUN.orthogonal().normalized()
        v = SUN.cross(u)
        s = gap + (u * math.cos(a) + v * math.sin(a)) * r + Vector((0, 0, rng.uniform(-0.2, 0.3)))
        L = rng.uniform(0.4, 2.3) if k % 3 else rng.uniform(1.8, 3.2)
        pts = root_path(rng, s, L, drift=0.7)
        thick = rng.uniform(0.006, 0.03)
        tube(bm if thick > 0.012 else bm2, pts, thick, 0.0015, seg=6 if thick > 0.012 else 4)
        for b in range(rng.randint(0, 3)):  # side rootlets
            i = rng.randint(1, max(1, len(pts) - 2))
            tube(bm2, root_path(rng, pts[i], rng.uniform(0.15, 0.6), step=0.04, drift=1.0), thick * 0.35, 0.001, seg=4)
    # through the joints of the vault elsewhere, mostly near the top
    for k in range(70):
        th = rng.uniform(0, 2 * math.pi)
        zz = rng.uniform(SPRING + 0.4, TOP - 0.1)
        s = ellipse_pt(th, zz, out=-0.02)
        n_in = -Vector((s.x / RX ** 2, s.y / RY ** 2, 0)).normalized()
        s = s + n_in * 0.05
        if in_tunnel(s, extra=0.2):
            continue
        L = rng.uniform(0.3, 1.8) * (0.5 + 0.5 * zz / TOP)
        pts = root_path(rng, s, L, drift=0.5)
        thick = rng.uniform(0.004, 0.022)
        tube(bm if thick > 0.012 else bm2, pts, thick, 0.0012, seg=5 if thick > 0.012 else 4)
    a = mesh_obj("hoard_roots", bm, get_mat("hoard_root"), smooth=True)
    b = mesh_obj("hoard_rootlets", bm2, get_mat("hoard_root_pale"), smooth=True)
    return a, b
