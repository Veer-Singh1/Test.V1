"""Geology drawing helpers: procedural rock swatches, mineral icons and rock-type icons."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import *  # noqa: E402,F403

IGN, SED, MET = CORAL, AMBER, CYAN          # rock-type colours used throughout
MAGMA = "#F97316"
LAVA_DARK = "#7C2D12"
ROCK_COLOURS = {"igneous": IGN, "sedimentary": SED, "metamorphic": MET}


def _blob(rng, c, r, n=7, jitter=0.35):
    a = np.sort(rng.uniform(0, 2 * np.pi, n))
    rr = r * (1 + rng.uniform(-jitter, jitter, n))
    return [c + np.array([np.cos(t) * q, np.sin(t) * q, 0]) for t, q in zip(a, rr)]


def swatch(kind, w=2.4, h=1.4, seed=1):
    """A rounded rectangle of stylised rock texture. Elements stay inside the frame."""
    rng = np.random.default_rng(seed)
    base_col, edge = {
        "granite": ("#CBD5E1", "#94A3B8"), "basalt": ("#334155", "#1E293B"), "sandstone": ("#D9A066", "#B7804A"),
        "shale": ("#5B6472", "#475569"), "conglomerate": ("#B08968", "#8D6E52"), "limestone": ("#E7E0C9", "#C9BFA0"),
        "coal": ("#1C1917", "#0C0A09"), "slate": ("#3B4A5E", "#2C3A4D"), "marble": ("#F8FAFC", "#CBD5E1"),
        "quartzite": ("#F1D9D0", "#D6B4A6"), "gneiss": ("#9CA3AF", "#6B7280"), "graphite": ("#3F3F46", "#27272A"),
        "pumice": ("#D6D3D1", "#A8A29E"), "obsidian": ("#0F172A", "#020617"), "magma": (MAGMA, "#C2410C"),
        "salt": ("#F1F5F9", "#CBD5E1"),
    }[kind]
    frame = RoundedRectangle(corner_radius=0.12, width=w, height=h, fill_color=base_col, fill_opacity=1,
                             stroke_color=edge, stroke_width=3)
    g = VGroup(frame)
    x0, x1, y0, y1 = -w / 2 + 0.1, w / 2 - 0.1, -h / 2 + 0.1, h / 2 - 0.1

    def pts(n):
        return np.stack([rng.uniform(x0, x1, n), rng.uniform(y0, y1, n), np.zeros(n)], 1)

    if kind == "granite":
        for c in pts(int(w * h * 26)):
            col = rng.choice(["#F9A8D4", "#F1F5F9", "#1F2937", "#E5E7EB"], p=[0.35, 0.3, 0.2, 0.15])
            r = rng.uniform(0.07, 0.14)
            g.add(Polygon(*_blob(rng, c, r, 6, 0.3), fill_color=col, fill_opacity=1, stroke_width=0))
    elif kind in ("basalt", "obsidian"):
        for c in pts(int(w * h * 60)):
            g.add(Dot(c, radius=0.012, color=rng.choice(["#64748B", "#94A3B8", "#0F172A"])))
        if kind == "obsidian":
            g.add(Arc(radius=w * 0.35, start_angle=PI * 0.6, angle=PI * 0.25, color=WHITE, stroke_width=4,
                      stroke_opacity=0.5).move_to([-w * 0.15, h * 0.18, 0]))
    elif kind == "pumice":
        for c in pts(int(w * h * 14)):
            g.add(Ellipse(width=rng.uniform(0.04, 0.12), height=rng.uniform(0.03, 0.08), fill_color="#78716C",
                          fill_opacity=0.8, stroke_width=0).move_to(c))
    elif kind in ("sandstone", "shale", "limestone", "salt"):
        bands = {"sandstone": 4, "shale": 9, "limestone": 3, "salt": 1}[kind]
        for k in range(bands):
            yy = y0 + (k + 0.5) * (y1 - y0) / bands
            g.add(Line([x0, yy, 0], [x1, yy, 0], color=edge, stroke_width=2, stroke_opacity=0.7))
        n = {"sandstone": 90, "shale": 25, "limestone": 20, "salt": 0}[kind] * w * h
        for c in pts(int(n)):
            g.add(Dot(c, radius=0.018 if kind == "sandstone" else 0.012, color=edge))
        if kind == "limestone":
            for c in pts(4):
                g.add(Arc(radius=0.07, angle=PI, color="#A8A29E", stroke_width=3).move_to(c))
        if kind == "salt":
            for c in pts(int(w * h * 5)):
                g.add(Square(side_length=rng.uniform(0.1, 0.18), fill_color=WHITE, fill_opacity=0.9,
                             stroke_color="#CBD5E1", stroke_width=1.5).rotate(rng.uniform(0, 0.5)).move_to(c))
    elif kind == "conglomerate":
        for c in pts(int(w * h * 7)):
            g.add(Ellipse(width=rng.uniform(0.12, 0.26), height=rng.uniform(0.09, 0.18),
                          fill_color=rng.choice(["#E7E5E4", "#A8A29E", "#78716C", "#D6D3D1"]), fill_opacity=1,
                          stroke_color="#57534E", stroke_width=1).rotate(rng.uniform(0, PI)).move_to(c))
    elif kind in ("coal", "graphite"):
        for k in range(6):
            yy = y0 + (k + 0.5) * (y1 - y0) / 6
            g.add(Line([x0, yy, 0], [x1, yy, 0], color="#57534E" if kind == "coal" else "#71717A", stroke_width=1.5))
        g.add(Line([x0 + 0.2, y1 - 0.15, 0], [x1 - 0.4, y1 - 0.15, 0], color=WHITE, stroke_width=3, stroke_opacity=0.25))
    elif kind == "slate":
        for k in range(14):
            yy = y0 + (k + 0.5) * (y1 - y0) / 14
            g.add(Line([x0, yy, 0], [x1, yy + 0.02, 0], color="#526075", stroke_width=1.5))
    elif kind == "marble":
        for k in range(3):
            xs = np.linspace(x0, x1, 12)
            ys = y0 + (k + 0.6) * (y1 - y0) / 3 + 0.08 * np.sin(xs * 3 + k)
            g.add(VMobject(stroke_color="#94A3B8", stroke_width=2).set_points_smoothly([[x, y, 0] for x, y in zip(xs, ys)]))
    elif kind == "quartzite":
        for c in pts(int(w * h * 30)):
            g.add(Polygon(*_blob(rng, c, rng.uniform(0.06, 0.1), 6, 0.2), fill_color=rng.choice(["#FBE4DA", "#EBC9BB"]),
                          fill_opacity=1, stroke_color="#C9A291", stroke_width=1))
    elif kind == "gneiss":
        nb = 7
        for k in range(nb):
            xs = np.linspace(x0, x1, 16)
            yy = y0 + (k + 0.5) * (y1 - y0) / nb
            ys = yy + 0.05 * np.sin(xs * 4 + k)
            g.add(VMobject(stroke_color="#1F2937" if k % 2 else "#F1F5F9", stroke_width=7 if k % 2 else 9)
                  .set_points_smoothly([[x, y, 0] for x, y in zip(xs, ys)]))
    elif kind == "magma":
        for c in pts(int(w * h * 10)):
            g.add(Dot(c, radius=rng.uniform(0.02, 0.05), color=rng.choice(["#FDBA74", "#FDE68A", "#EA580C"])))
    return g


def labelled_swatch(kind, name, color, w=2.2, h=1.25, seed=1, size=28):
    s = swatch(kind, w, h, seed)
    return VGroup(s, T(name, size, color, SEMIBOLD).next_to(s, DOWN, buff=0.15))


def flame_icon(color=IGN, s=0.55):
    outer = VMobject(fill_color=color, fill_opacity=1, stroke_width=0).set_points_smoothly(
        [[0, s, 0], [s * 0.45, s * 0.1, 0], [s * 0.35, -s * 0.55, 0], [0, -s * 0.7, 0], [-s * 0.35, -s * 0.55, 0],
         [-s * 0.45, s * 0.1, 0], [0, s, 0]])
    inner = outer.copy().scale(0.5).set_fill(WARM).shift(DOWN * s * 0.25)
    return VGroup(outer, inner)


def layers_icon(color=SED, w=1.2):
    return VGroup(*[RoundedRectangle(corner_radius=0.06, width=w, height=0.2, fill_color=color,
                                     fill_opacity=0.35 + 0.2 * k, stroke_width=0) for k in range(4)]).arrange(DOWN, buff=0.07)


def squeeze_icon(color=MET):
    block = VGroup(*[Line(LEFT * 0.38, RIGHT * 0.38).shift(UP * (0.24 - 0.12 * k)) for k in range(5)]).set_stroke(color, 4)
    arrows = VGroup(Arrow(LEFT * 1.0, LEFT * 0.48, buff=0, color=color, stroke_width=5),
                    Arrow(RIGHT * 1.0, RIGHT * 0.48, buff=0, color=color, stroke_width=5))
    return VGroup(block, arrows)


def type_card(name, color, icon, w=3.9, h=2.6):
    c = card(w, h, color, stroke=3)
    icon.move_to(c.get_center() + UP * 0.35)
    t = T(name, 36, color, BOLD).next_to(icon, DOWN, buff=0.3)
    return VGroup(c, icon, t)


def ammonite(r=0.32, color="#E7E5E4"):
    t = np.linspace(0, 4 * np.pi, 160)
    rr = r * np.exp(-0.17 * t)
    spiral = VMobject(stroke_color=color, stroke_width=4).set_points_smoothly(
        [[q * np.cos(a), q * np.sin(a), 0] for q, a in zip(rr, t)])
    ribs = VGroup(*[Line([rr[i] * 0.75 * np.cos(t[i]), rr[i] * 0.75 * np.sin(t[i]), 0],
                         [rr[i] * np.cos(t[i]), rr[i] * np.sin(t[i]), 0], color=color, stroke_width=2)
                    for i in range(0, 80, 6)])
    return VGroup(spiral, ribs)
