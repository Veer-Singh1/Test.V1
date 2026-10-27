import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from geo import *  # noqa: E402,F403


def quartz():
    return Polygon([-0.18, -0.4, 0], [0.18, -0.4, 0], [0.18, 0.18, 0], [0, 0.42, 0], [-0.18, 0.18, 0],
                   fill_color="#E0F2FE", fill_opacity=0.9, stroke_color="#7DD3FC", stroke_width=3)


def mica():
    return VGroup(*[Polygon([-0.32, -0.1, 0], [0.22, -0.1, 0], [0.32, 0.1, 0], [-0.22, 0.1, 0],
                            fill_color=c, fill_opacity=1, stroke_color="#422006", stroke_width=1.5).shift(UP * 0.13 * k)
                    for k, c in enumerate(["#854D0E", "#A16207", "#CA8A04"])]).move_to(ORIGIN)


def feldspar():
    return Polygon([-0.32, -0.3, 0], [0.2, -0.34, 0], [0.34, 0.12, 0], [0.05, 0.36, 0], [-0.3, 0.2, 0],
                   fill_color="#F9A8D4", fill_opacity=1, stroke_color="#DB2777", stroke_width=2)


def gold():
    n = VMobject(fill_color="#FACC15", fill_opacity=1, stroke_color="#A16207", stroke_width=2).set_points_smoothly(
        [[-0.3, 0, 0], [-0.15, 0.25, 0], [0.12, 0.22, 0], [0.32, 0.02, 0], [0.18, -0.24, 0], [-0.16, -0.22, 0], [-0.3, 0, 0]])
    return VGroup(n, Dot([0.06, 0.08, 0], 0.05, color="#FEF9C3"))


class S04Minerals(Shot):
    """Mineral vs rock; the cake analogy; three rock types grouped by how they formed."""

    def construct(self):
        head = T("Mineral or rock?", 44, INK, BOLD).move_to(UP * 3.45)
        mcard = card(6.4, 2.0, GREEN, stroke=3).move_to([-3.6, 1.85, 0])
        rcard = card(6.4, 2.0, INK, stroke=3).move_to([3.6, 1.85, 0])
        mt = T("Mineral", 34, GREEN, BOLD).move_to(mcard.get_top() + DOWN * 0.38)
        rt = T("Rock", 34, INK, BOLD).move_to(rcard.get_top() + DOWN * 0.38)
        mdef = [T(s, 26, INK) for s in ("naturally occurring, non-living solid", "with a definite chemical composition")]
        VGroup(*mdef).arrange(DOWN, buff=0.1).next_to(mt, DOWN, buff=0.2)
        rdef = VGroup(T("a solid mixture of", 26, INK), T("one or more minerals", 26, INK)).arrange(DOWN, buff=0.1)
        rdef.next_to(rt, DOWN, buff=0.2)
        self.at(0, -0.2)
        self.play(FadeIn(head, shift=DOWN * 0.2), run_time=0.5)
        self.at(1)
        self.play(FadeIn(mcard), FadeIn(mt), run_time=0.45)
        self.at(1, 0.3)
        self.play(FadeIn(mdef[0], shift=UP * 0.1), run_time=0.4)
        self.at(1, 0.65)
        self.play(FadeIn(mdef[1], shift=UP * 0.1), run_time=0.4)

        makers = [("quartz", quartz), ("mica", mica), ("feldspar", feldspar), ("gold", gold)]
        icons = VGroup()
        for k, (name, f) in enumerate(makers):
            ic = f().move_to([-5.5 + 1.3 * k, 0.2, 0])
            icons.add(VGroup(ic, T(name, 24, INK).next_to(ic, DOWN, buff=0.15)))
        for k, frac in enumerate((0.0, 0.2, 0.38, 0.62)):
            self.at(2, frac)
            self.play(FadeIn(icons[k], shift=UP * 0.15), run_time=0.35)

        rock = swatch("granite", 2.8, 1.35, seed=7).move_to([3.6, 0.05, 0])
        self.at(3)
        self.play(FadeIn(rcard), FadeIn(rt), FadeIn(rdef, shift=UP * 0.1), run_time=0.5)
        flyers = VGroup(*[i[0].copy() for i in icons])
        self.play(LaggedStart(*[f.animate.scale(0.5).move_to(rock.get_center() + [0.5 * (k - 1.5), 0, 0])
                                for k, f in enumerate(flyers)], lag_ratio=0.15), run_time=1.0)
        self.play(FadeIn(rock), FadeOut(flyers), run_time=0.5)

        cake = VGroup(pill("Minerals = the ingredients", GREEN, 28).move_to([-3.6, -1.3, 0]),
                      pill("Rock = the baked cake", INK, 28).move_to([3.6, -1.3, 0]))
        self.at(4, 0.05)
        self.play(FadeIn(cake[0], shift=UP * 0.15), run_time=0.4)
        self.at(4, 0.55)
        self.play(FadeIn(cake[1], shift=UP * 0.15), run_time=0.4)

        types = VGroup(type_card("Igneous", IGN, flame_icon()), type_card("Sedimentary", SED, layers_icon()),
                       type_card("Metamorphic", MET, squeeze_icon())).arrange(RIGHT, buff=0.45).move_to(UP * 0.8)
        how = pill("Grouped by HOW they formed", AMBER, 32).move_to(DOWN * 1.45)
        self.at(5, -0.1)
        self.play(FadeOut(VGroup(mcard, rcard, mt, rt, *mdef, rdef, icons, rock, cake)), run_time=0.45)
        self.play(LaggedStart(*[FadeIn(t, shift=UP * 0.2) for t in types], lag_ratio=0.25), run_time=0.9)
        self.at(5, 0.6)
        self.play(FadeIn(how, shift=UP * 0.15), run_time=0.45)
        self.finish()
