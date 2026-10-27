import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import check_icon  # noqa: E402
from geo import *  # noqa: E402,F403


def plant(scale=1.0):
    stem = Line(DOWN * 0.4, UP * 0.4, color="#4D7C0F", stroke_width=4)
    leaves = VGroup(*[Ellipse(width=0.32, height=0.12, fill_color="#65A30D", fill_opacity=1, stroke_width=0)
                      .rotate(0.5 * s).move_to([0.17 * s, y, 0]) for y in (-0.15, 0.05, 0.25) for s in (-1, 1)])
    return VGroup(stem, leaves).scale(scale)


class S08SedimentTypes(Shot):
    """Chemical and organic sedimentary rock; strata, softness, fossils; what five rocks are made of."""

    def construct(self):
        lc, rc = np.array([-3.45, 0.55, 0]), np.array([3.45, 0.55, 0])
        lcard, rcard = card(6.5, 4.0, SED, stroke=3).move_to(lc), card(6.5, 4.0, SED, stroke=3).move_to(rc)
        lt = T("Chemical", 34, SED, BOLD).move_to(lcard.get_top() + DOWN * 0.38)
        rt = T("Organic", 34, SED, BOLD).move_to(rcard.get_top() + DOWN * 0.38)
        # --- seg 0: evaporation leaves minerals behind
        basin = Rectangle(width=4.6, height=1.5, fill_color=WATER, fill_opacity=0.55, stroke_width=0).move_to(lc + DOWN * 0.45)
        rim = VGroup(Line(basin.get_corner(DL), basin.get_corner(DR)), Line(basin.get_corner(DL), basin.get_corner(UL)),
                     Line(basin.get_corner(DR), basin.get_corner(UR))).set_stroke("#A8A29E", 5)
        steam = VGroup(*[VMobject(stroke_color=WHITE, stroke_width=3, stroke_opacity=0.6).set_points_smoothly(
            [lc + [x + 0.08 * np.sin(k), 0.55 + 0.25 * k, 0] for k in range(4)]) for x in (-1.4, -0.3, 0.8, 1.6)])
        rng = np.random.default_rng(8)
        salt = VGroup(*[Square(side_length=rng.uniform(0.12, 0.2), fill_color=WHITE, fill_opacity=0.95, stroke_color="#CBD5E1",
                               stroke_width=1.5).rotate(rng.uniform(0, 0.4)).move_to(basin.get_bottom() + [rng.uniform(-2, 2), 0.12, 0])
                        for _ in range(16)])
        chem_lbl = T("rock salt · some limestone", 28, WARM, SEMIBOLD).move_to(lc + DOWN * 1.6)
        self.at(0, -0.2)
        self.play(FadeIn(lcard), FadeIn(lt), FadeIn(basin), Create(rim), run_time=0.6)
        self.at(0, 0.25)
        self.play(basin.animate.stretch(0.1, 1, about_edge=DOWN), Create(steam, lag_ratio=0.2), run_time=2.4)
        self.play(FadeIn(salt, lag_ratio=0.1), FadeOut(steam), run_time=0.8)
        self.at(0, 0.8)
        self.play(FadeIn(chem_lbl, shift=UP * 0.1), run_time=0.4)
        # --- seg 1: remains of living things are compressed
        plants = VGroup(*[plant().move_to(rc + [x, 0.75, 0]) for x in (-1.5, 0.0, 1.5)])
        pile = VGroup(*[Rectangle(width=4.2, height=0.22, fill_color=c, fill_opacity=1, stroke_width=0)
                        .move_to(rc + [0, -0.85 + 0.24 * k, 0]) for k, c in enumerate(["#3F6212", "#4D7C0F", "#365314"])])
        coal = Rectangle(width=4.2, height=0.3, fill_color="#1C1917", fill_opacity=1, stroke_color="#57534E",
                         stroke_width=2).move_to(rc + [0, -0.85, 0])
        press = Arrow(rc + [0, 0.35, 0], rc + [0, -0.3, 0], buff=0, color=INK, stroke_width=6)
        org_lbl = T("coal · shelly limestone", 28, WARM, SEMIBOLD).move_to(rc + DOWN * 1.6)
        self.at(1)
        self.play(FadeIn(rcard), FadeIn(rt), FadeIn(plants, lag_ratio=0.2), run_time=0.7)
        self.play(ReplacementTransform(plants, pile), run_time=0.9)
        self.play(GrowArrow(press), ReplacementTransform(pile, coal), run_time=1.0)
        self.play(FadeIn(org_lbl, shift=UP * 0.1), run_time=0.4)

        # --- seg 2-4: strata, softer, fossils
        sc = np.array([-3.0, 0.4, 0])
        strata = VGroup(*[Rectangle(width=6.6, height=0.55, fill_color=c, fill_opacity=1, stroke_color="#57534E",
                                    stroke_width=1.5).move_to(sc + [0, -1.375 + 0.55 * k, 0])
                          for k, c in enumerate(["#8D6E52", "#D9A066", "#A8A29E", "#C08457", "#E7E0C9", "#B7804A"])])
        facts = VGroup(*[VGroup(check_icon(SED, 0.2), T(t, 30, INK, SEMIBOLD)).arrange(RIGHT, buff=0.25)
                         for t in ("Strata: visible layers", "Softer: wears away easily", "Fossils are found here")])
        facts.arrange(DOWN, aligned_edge=LEFT, buff=0.45).move_to([0, 0.5, 0]).align_to([1.2, 0, 0], LEFT)
        self.at(2, -0.1)
        self.play(FadeOut(VGroup(lcard, rcard, lt, rt, basin, rim, salt, chem_lbl, coal, press, org_lbl)), run_time=0.4)
        self.play(LaggedStart(*[FadeIn(s, shift=RIGHT * 0.2) for s in strata], lag_ratio=0.15), run_time=1.0)
        self.play(FadeIn(facts[0], shift=RIGHT * 0.15), run_time=0.4)
        chips = VGroup(*[Dot(strata[-1].get_corner(UR) + [-0.3 - 0.25 * k, -0.1, 0], 0.06, color="#B7804A") for k in range(6)])
        self.at(3)
        self.play(FadeIn(facts[1], shift=RIGHT * 0.15), run_time=0.4)
        self.play(*[d.animate.shift(DOWN * 2.6 + RIGHT * 0.4).set_opacity(0) for d in chips], run_time=1.4)
        fossil = ammonite(0.36).move_to(strata[2].get_center() + LEFT * 1.4)
        self.at(4)
        self.sfx("pop", -3)
        self.play(FadeIn(fossil, scale=0.5), FadeIn(facts[2], shift=RIGHT * 0.15), run_time=0.6)

        # --- seg 5: what five rocks are made of
        data = [("sandstone", "Sandstone", "sand grains"), ("shale", "Shale", "clay and mud"),
                ("conglomerate", "Conglomerate", "rounded pebbles"),
                ("limestone", "Limestone", "shells, coral, calcium carbonate"), ("coal", "Coal", "plant remains")]
        rows = VGroup()
        for k, (kind, name, made) in enumerate(data):
            sw = swatch(kind, 1.5, 0.62, seed=20 + k)
            nm = T(name, 30, SED, BOLD)
            mf = T(f"made of {made}", 28, INK)
            row = VGroup(sw, nm, mf)
            sw.move_to([-5.6, 2.3 - 0.95 * k, 0])
            nm.next_to(sw, RIGHT, buff=0.35)
            mf.move_to(sw.get_center()).align_to([-1.3, 0, 0], LEFT)
            rows.add(row)
        self.at(5, -0.08)
        self.play(FadeOut(VGroup(strata, facts, fossil)), run_time=0.4)
        for k, frac in enumerate((0.0, 0.17, 0.3, 0.47, 0.84)):
            self.at(5, frac)
            self.play(FadeIn(rows[k], shift=RIGHT * 0.15), run_time=0.4)
        self.finish()
