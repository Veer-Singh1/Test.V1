"""Mining drawing helpers: atoms, flow boxes, ore piles, a schematic South Africa map."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from geo import *  # noqa: E402,F403

ORE, PROC, HARM, GOOD = AMBER, CYAN, CORAL, GREEN
GOLD = "#FACC15"
SOIL = "#6B5444"


def atom(sym, color, r=0.36, text_color=NAVY):
    c = Circle(radius=r, fill_color=color, fill_opacity=1, stroke_color=WHITE, stroke_width=2)
    return VGroup(c, T(sym, int(r * 80), text_color, BOLD).move_to(c))


def flow_box(text, color=PROC, w=5.6, size=26):
    t = VGroup(*[T(s, size, INK, MEDIUM) for s in text.split("\n")]).arrange(DOWN, buff=0.06)
    if t.width > w - 0.4:
        t.scale_to_fit_width(w - 0.4)
    box = RoundedRectangle(corner_radius=0.14, width=w, height=t.height + 0.32, fill_color=PANEL, fill_opacity=1,
                           stroke_color=color, stroke_width=3)
    return VGroup(box, t.move_to(box))


def flow_column(texts, x, y_top, color=PROC, w=5.6, gap=0.38, size=26):
    boxes = [flow_box(t, color, w, size) for t in texts]
    y = y_top
    for b in boxes:
        b.move_to([x, y - b.height / 2, 0])
        y -= b.height + gap
    arrows = [Arrow(a.get_bottom(), b.get_top(), buff=0.04, color=color, stroke_width=5,
                    max_tip_length_to_length_ratio=0.35) for a, b in zip(boxes, boxes[1:])]
    return boxes, arrows


def ore_pile(n=26, w=2.8, h=1.4, seed=2, gold=0):
    rng = np.random.default_rng(seed)
    g = VGroup()
    for k in range(n):
        x = rng.uniform(-w / 2, w / 2)
        top = h * (1 - (2 * x / w) ** 2)
        y = rng.uniform(0, max(0.15, top))
        r = rng.uniform(0.12, 0.22)
        g.add(Polygon(*[[x + r * np.cos(a), y + r * np.sin(a), 0] for a in np.linspace(0, 2 * PI, 7)[:-1] + rng.uniform(-0.3, 0.3)],
                      fill_color=rng.choice(["#78716C", "#57534E", "#A8A29E"]), fill_opacity=1, stroke_color="#44403C",
                      stroke_width=1.5))
    for k in range(gold):
        g.add(Dot([rng.uniform(-w / 3, w / 3), rng.uniform(0.1, h * 0.6), 0], 0.05, color=GOLD))
    return g


def nugget(s=0.3):
    n = VMobject(fill_color=GOLD, fill_opacity=1, stroke_color="#A16207", stroke_width=2).set_points_smoothly(
        [[-s, 0, 0], [-s / 2, s * 0.8, 0], [s * 0.4, s * 0.7, 0], [s, 0.05, 0], [s * 0.6, -s * 0.8, 0], [-s / 2, -s * 0.7, 0], [-s, 0, 0]])
    return VGroup(n, Dot([s * 0.15, s * 0.25, 0], s * 0.15, color="#FEF9C3"))


def headgear(h=1.5, color=INK):
    legs = VGroup(Line([-0.5, 0, 0], [0, h, 0]), Line([0.5, 0, 0], [0, h, 0]), Line([-0.25, h * 0.5, 0], [0.25, h * 0.5, 0]))
    wheel = Circle(radius=0.22, color=color, stroke_width=4).move_to([0, h, 0])
    return VGroup(legs.set_stroke(color, 5), wheel)


# --- schematic map of South Africa (lon/lat outline, approximate; not survey accurate) ---
SA_BORDER = [(16.45, -28.63), (17.4, -28.75), (18.2, -28.9), (19.0, -28.9), (19.9, -28.45), (20.0, -28.4), (20.0, -24.75),
             (20.65, -26.85), (21.7, -26.85), (22.6, -26.2), (23.0, -25.3), (24.4, -25.7), (25.4, -25.7), (25.8, -25.5),
             (26.4, -24.6), (26.9, -24.3), (27.5, -23.6), (28.3, -22.65), (29.4, -22.15), (30.4, -22.3), (31.3, -22.4),
             (31.6, -23.5), (31.98, -24.6), (31.98, -25.95), (32.13, -26.85), (32.89, -26.86), (32.4, -28.5), (31.8, -28.9),
             (31.0, -29.85), (30.2, -31.1), (29.2, -32.1), (27.9, -33.0), (26.6, -33.75), (25.6, -33.95), (24.8, -34.2),
             (23.4, -34.1), (22.1, -34.2), (20.0, -34.83), (19.2, -34.45), (18.47, -34.36), (18.45, -33.95), (18.0, -33.0),
             (18.2, -32.3), (17.3, -30.3)]
LESOTHO = [(27.0, -29.6), (27.5, -28.7), (28.2, -28.6), (29.0, -28.9), (29.45, -29.4), (29.2, -29.9), (28.7, -30.4),
           (28.0, -30.65), (27.4, -30.3), (27.0, -29.9)]
ESWATINI = [(30.8, -26.0), (31.3, -25.75), (31.95, -25.95), (32.12, -26.5), (32.1, -27.3), (31.3, -27.3), (30.8, -26.8)]


class SAMap:
    def __init__(self, centre=(-3.0, 0.55), k=0.41, lon0=24.7, lat0=-28.5):
        self.c, self.k, self.lon0, self.lat0 = np.array([*centre, 0]), k, lon0, lat0

    def p(self, lon, lat):
        return self.c + self.k * np.array([lon - self.lon0, lat - self.lat0, 0])

    def shapes(self):
        sa = Polygon(*[self.p(*q) for q in SA_BORDER], fill_color=PANEL_HI, fill_opacity=1, stroke_color=MUTED, stroke_width=3)
        enclaves = VGroup(*[Polygon(*[self.p(*q) for q in pts], fill_color=NAVY, fill_opacity=1, stroke_color=MUTED,
                                    stroke_width=2) for pts in (LESOTHO, ESWATINI)])
        return VGroup(sa, enclaves)
