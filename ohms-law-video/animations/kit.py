"""Shared Manim style kit: palette, Inter text helpers, circuit parts, flowing charges and the
narration-synced Shot base class. Every animated shot subclasses Shot and reads its timing
(segment start/end times relative to the shot) from build/timing.json."""
import json
from pathlib import Path

import numpy as np
from manim import *  # noqa: F403

ROOT = Path(__file__).resolve().parent.parent
TIMING = ROOT / "build" / "timing.json"
QC_DIR = ROOT / "build" / "qc"
SFX_DIR = ROOT / "build" / "sfx_events"

NAVY = "#0B1A33"
PANEL = "#132A4F"
PANEL_HI = "#1D3B69"
CYAN = "#22D3EE"
AMBER = "#FBBF24"
CORAL = "#FB7185"
INK = "#F1F5F9"
MUTED = "#94A3B8"
WIRE = "#CBD5E1"
WATER = "#60A5FA"
GREEN = "#34D399"
WARM = "#FDE68A"
COPPER = "#C27C4E"
FONT = "Inter"
SAFE_BOTTOM = -2.35  # subtitles live below this line


# ---------- text ----------
def T(text, size=40, color=INK, weight=MEDIUM, **kw):
    return Text(text, font=FONT, font_size=size, color=color, weight=weight, **kw)


def M(markup, size=40, color=INK, weight=MEDIUM, **kw):
    return MarkupText(markup, font=FONT, font_size=size, color=color, weight=weight, **kw)


def col(s, c):
    return f'<span foreground="{c}">{s}</span>'


def cv(s="V"):
    return col(s, AMBER)


def ci(s="I"):
    return col(s, CYAN)


def cr(s="R"):
    return col(s, CORAL)


def pill(text, color=INK, size=32, fill=PANEL, markup=False, weight=SEMIBOLD, pad=(0.34, 0.2)):
    t = (M if markup else T)(text, size, color, weight)
    h = t.height + 2 * pad[1]
    box = RoundedRectangle(corner_radius=min(0.2, h / 2), width=t.width + 2 * pad[0], height=h,
                           fill_color=fill, fill_opacity=0.94, stroke_color=color, stroke_width=2.5)
    return VGroup(box, t.move_to(box))


def card(w, h, color=MUTED, fill=PANEL, radius=0.25, stroke=2.5):
    return RoundedRectangle(corner_radius=radius, width=w, height=h, fill_color=fill, fill_opacity=1,
                            stroke_color=color, stroke_width=stroke)


def boxed(mob, color=GREEN, buff=0.18):
    return SurroundingRectangle(mob, color=color, buff=buff, corner_radius=0.12, stroke_width=4)


def warning_icon(size=0.7, color=AMBER):
    tri = Triangle(color=color, stroke_width=6).scale(size / 2)
    bang = T("!", size * 46, color, BOLD).move_to(tri.get_center() + DOWN * size * 0.1)
    return VGroup(tri, bang)


def glow(color, r=0.6, layers=8, opacity=0.5):
    return VGroup(*[Circle(radius=r * (k + 1) / layers, stroke_width=0, fill_color=color,
                           fill_opacity=opacity / layers) for k in range(layers)])


def electron(r=0.065, color=CYAN):
    return VGroup(Dot(radius=r * 2.3, color=color, fill_opacity=0.2), Dot(radius=r, color=color))


# ---------- moving charges ----------
class Flow(VGroup):
    """n dots spaced evenly around a closed path, moving at `speed` loops per second."""

    def __init__(self, path, n=26, color=CYAN, r=0.06, speed=0.05, reverse=False, maker=None, orient=False):
        super().__init__()
        self.path, self.n, self.orient = path, n, orient
        self.dir = -1 if reverse else 1
        self.phase = 0.0
        self.speed = ValueTracker(speed)
        for _ in range(n):
            self.add(maker() if maker else electron(r, color))
        self._angles = [0.0] * n
        self._place()
        self.add_updater(lambda m, dt: m._step(dt))

    def _step(self, dt):
        self.phase = (self.phase + self.dir * self.speed.get_value() * dt) % 1
        self._place()

    def _place(self):
        for k, d in enumerate(self.submobjects):
            a = (self.phase + k / self.n) % 1
            p = self.path.point_from_proportion(a)
            d.move_to(p)
            if self.orient:
                q = self.path.point_from_proportion((a + 0.002 * self.dir) % 1)
                ang = np.arctan2(q[1] - p[1], q[0] - p[0])
                d.rotate(ang - self._angles[k])
                self._angles[k] = ang


def proportion_of(path, point, samples=600):
    """Proportion along `path` of the sample point nearest to `point`."""
    a = np.linspace(0, 1, samples, endpoint=False)
    pts = np.array([path.point_from_proportion(x) for x in a])
    return float(a[np.argmin(np.linalg.norm(pts - np.asarray(point), axis=1))])


def chevron(color=CYAN, size=0.22):
    return VMobject(stroke_color=color, stroke_width=6).set_points_as_corners(
        [LEFT * size * 0.6 + UP * size * 0.6, RIGHT * size * 0.4, LEFT * size * 0.6 + DOWN * size * 0.6])


class Wanderers(VGroup):
    """Electrons drifting randomly inside a box (free electrons in a metal)."""

    def __init__(self, box, n=14, speed=1.1, seed=3, r=0.06, color=CYAN):
        super().__init__()
        rng = np.random.default_rng(seed)
        self.lo, self.hi = box.get_corner(DL)[:2] + 0.15, box.get_corner(UR)[:2] - 0.15
        self.pos = rng.uniform(self.lo, self.hi, (n, 2))
        ang = rng.uniform(0, 2 * np.pi, n)
        self.vel = np.stack([np.cos(ang), np.sin(ang)], 1) * speed
        self.rng = rng
        for p in self.pos:
            self.add(electron(r, color).move_to([*p, 0]))
        self.add_updater(lambda m, dt: m._step(dt))

    def _step(self, dt):
        turn = self.rng.normal(0, 2.2 * np.sqrt(max(dt, 1e-6)), len(self.pos))
        c, s = np.cos(turn), np.sin(turn)
        self.vel = np.stack([self.vel[:, 0] * c - self.vel[:, 1] * s, self.vel[:, 0] * s + self.vel[:, 1] * c], 1)
        self.pos += self.vel * dt
        for ax in (0, 1):
            low, high = self.pos[:, ax] < self.lo[ax], self.pos[:, ax] > self.hi[ax]
            self.vel[low | high, ax] *= -1
            self.pos[:, ax] = np.clip(self.pos[:, ax], self.lo[ax], self.hi[ax])
        for d, p in zip(self.submobjects, self.pos):
            d.move_to([*p, 0])


# ---------- circuit parts ----------
def battery(color=AMBER, plate=0.9, labels=True):
    """Vertical battery symbol centred on the origin: + plate on top, - plate below."""
    pos = Line(LEFT * plate / 2, RIGHT * plate / 2, stroke_width=7, color=color).shift(UP * 0.14)
    neg = Line(LEFT * plate * 0.28, RIGHT * plate * 0.28, stroke_width=15, color=color).shift(DOWN * 0.14)
    mask = Rectangle(width=0.3, height=0.24, fill_color=NAVY, fill_opacity=1, stroke_width=0)
    g = VGroup(mask, pos, neg)
    if labels:
        g.add(T("+", 34, color, BOLD).move_to(LEFT * 0.75 + UP * 0.32),
              T("−", 34, color, BOLD).move_to(LEFT * 0.75 + DOWN * 0.32))
    return g


def resistor(length=1.5, color=CORAL, amp=0.22, zigs=6, width=6):
    xs = np.linspace(-length / 2, length / 2, 2 * zigs + 1)
    pts = [[x, 0 if k in (0, 2 * zigs) else (amp if k % 2 else -amp), 0] for k, x in enumerate(xs)]
    z = VMobject(stroke_color=color, stroke_width=width).set_points_as_corners(pts)
    mask = Rectangle(width=length, height=2 * amp + 0.1, fill_color=NAVY, fill_opacity=1, stroke_width=0)
    return VGroup(mask, z)


class Bulb(VGroup):
    """Lamp on a horizontal wire, centred on the origin. `level` (0..1) drives the glow."""

    def __init__(self, r=0.42):
        super().__init__()
        self.level = ValueTracker(0)
        self.halo = glow(WARM, r * 2.5, 10, 0.6)
        base = [c.get_fill_opacity() for c in self.halo]
        self.glass = Circle(radius=r, stroke_color=INK, stroke_width=4, fill_color=NAVY, fill_opacity=1)
        t = np.linspace(0, 1, 120)
        fil = [[(-r + 2 * r * u), 0.12 * r * np.sin(u * 9 * np.pi) + 0.35 * r * np.sin(u * np.pi), 0] for u in t]
        self.fil = VMobject(stroke_color=MUTED, stroke_width=3).set_points_smoothly(fil)
        dark, lit = ManimColor(NAVY), ManimColor("#3A3218")
        f_off, f_on = ManimColor(MUTED), ManimColor(WARM)

        def upd(m):
            k = self.level.get_value()
            for c, b in zip(self.halo, base):
                c.set_fill(opacity=b * k)
            self.glass.set_fill(interpolate_color(dark, lit, k), 1)
            self.fil.set_stroke(interpolate_color(f_off, f_on, k), 3 + k)

        self.add(self.halo, self.glass, self.fil)
        self.add_updater(upd)
        upd(self)

    def on(self, rt=0.6):
        return self.level.animate(run_time=rt).set_value(1)

    def off(self, rt=0.6):
        return self.level.animate(run_time=rt).set_value(0)

    def set_on(self, k=1.0):
        self.level.set_value(k)
        self.update()
        return self


class Switch(VGroup):
    def __init__(self, gap=0.9):
        super().__init__()
        self.a, self.b = LEFT * gap / 2, RIGHT * gap / 2
        mask = Rectangle(width=gap, height=0.2, fill_color=NAVY, fill_opacity=1, stroke_width=0)
        self.lever = Line(self.a, self.b, stroke_width=6, color=INK)
        self.add(mask, self.lever, Dot(self.a, 0.08, color=INK), Dot(self.b, 0.08, color=INK))

    def open(self):
        return Rotate(self.lever, 32 * DEGREES, about_point=self.lever.get_start())

    def close(self):
        return Rotate(self.lever, -32 * DEGREES, about_point=self.lever.get_start())


class Loop(VGroup):
    """Rectangular circuit: battery on the left edge, a load on the top edge, optional switch at
    the bottom. `path` runs in the electron-flow direction (out of -, round to +)."""

    def __init__(self, w=6.4, h=3.4, load="bulb", switch=False, corner=0.35, wire_width=6):
        super().__init__()
        x0, x1, y0, y1 = -w / 2, w / 2, -h / 2, h / 2
        self.path = Polygon([x0, y1, 0], [x0, y0, 0], [x1, y0, 0], [x1, y1, 0]).round_corners(corner)
        self.wire = self.path.copy().set_stroke(WIRE, wire_width).set_fill(opacity=0)
        self.battery = battery()
        self.battery.shift([x0, 0, 0])
        if load == "bulb":
            self.load = Bulb().move_to([0, y1, 0])
        else:
            self.load = resistor().move_to([0, y1, 0])
        self.switch = Switch().move_to([0, y0, 0]) if switch else None
        self.path.set_stroke(opacity=0).set_fill(opacity=0)
        self.add(self.path, self.wire, self.battery, self.load)
        if self.switch:
            self.add(self.switch)

    def flow(self, **kw):
        return Flow(self.path, **kw)

    def arrows(self, n=10, color=CYAN, speed=0.05):
        """Conventional-current chevrons (opposite to electron flow)."""
        return Flow(self.path, n=n, speed=speed, reverse=True, maker=lambda: chevron(color), orient=True)


# ---------- timed base scene ----------
class Shot(Scene):
    """Base class: loads this shot's segment times so animations can sync to the narration."""

    def setup(self):
        self.camera.background_color = NAVY
        tl = json.loads(TIMING.read_text())
        me = next(s for s in tl["shots"] if s.get("cls") == type(self).__name__)
        self.info, self.D, self.tail = me, me["duration"], me["tail"]
        self.segs = me["segs"]
        self._texts, self._sfx = {}, []

    # segment times, relative to this shot
    def s(self, i):
        return self.segs[i]["start"]

    def e(self, i):
        return self.segs[i]["end"]

    def d(self, i):
        return self.e(i) - self.s(i)

    def to(self, t):
        dt = t - self.time
        if dt > 1e-3:
            self.wait(dt)

    def at(self, i, frac=0.0):
        self.to(self.s(i) + frac * self.d(i))

    def rt(self, i, frac=0.35, cap=1.0):
        """A run time that fits comfortably inside segment i."""
        return max(0.25, min(cap, frac * self.d(i)))

    def sfx(self, kind, gain_db=0.0):
        self._sfx.append({"t": round(self.time, 3), "kind": kind, "gain_db": gain_db})

    # track on-screen text for the QC report
    def _shown(self, m):
        for t in m.get_family():
            if isinstance(t, (Text, MarkupText)) and id(t) not in self._texts:
                box = [float(t.get_left()[0]), float(t.get_right()[0]), float(t.get_bottom()[1]), float(t.get_top()[1])]
                self._texts[id(t)] = [self.time, None, getattr(t, "text", ""), box]

    def _hidden(self, m, keep=()):
        for t in m.get_family():
            if id(t) in self._texts and self._texts[id(t)][1] is None and id(t) not in keep:
                self._texts[id(t)][1] = self.time

    def add(self, *mobjects):
        for m in mobjects:
            self._shown(m)
        return super().add(*mobjects)

    def remove(self, *mobjects):
        for m in mobjects:
            self._hidden(m)
        return super().remove(*mobjects)

    def replace(self, old_mobject, new_mobject):
        # ReplacementTransform swaps mobjects through replace(), not add/remove
        self._hidden(old_mobject, keep={id(t) for t in new_mobject.get_family()})
        self._shown(new_mobject)
        return super().replace(old_mobject, new_mobject)

    def finish(self):
        self.to(self.D + self.tail)
        name = type(self).__name__
        QC_DIR.mkdir(parents=True, exist_ok=True)
        SFX_DIR.mkdir(parents=True, exist_ok=True)
        end = self.D + self.tail
        texts = [{"text": txt, "start": round(a, 2), "end": round(b if b is not None else end, 2),
                  "box": [round(v, 2) for v in box]} for a, b, txt, box in self._texts.values()]
        (QC_DIR / f"text_{self.info['id']}.json").write_text(json.dumps(texts, ensure_ascii=False, indent=0))
        (SFX_DIR / f"{self.info['id']}.json").write_text(json.dumps(self._sfx))
        print(f"{name}: rendered {self.time:.2f}s (shot {self.D:.2f}s + tail {self.tail:.2f}s)")
