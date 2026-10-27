import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from geo import *  # noqa: E402,F403

COOLED = "#8E4A3D"


def slot(text, color, where, size=28):
    return pill(text, color, size).move_to(where)


class S05Igneous(Shot):
    """Crust cross-section: a crack, rising magma, an intrusion cooling inside the crust, lava erupting."""

    def construct(self):
        title = VGroup(flame_icon(IGN, 0.32), M(f"{col('Igneous', IGN)} = 'fiery'", 46, INK, BOLD)).arrange(RIGHT, buff=0.25)
        title.move_to([-4.0, 3.35, 0])
        self.at(0, -0.25)
        self.play(FadeIn(title, shift=DOWN * 0.2), run_time=0.5)

        gy = 0.6
        bands = VGroup(*[Rectangle(width=14.6, height=0.72, fill_color=c, fill_opacity=1, stroke_width=0)
                         .move_to([0, gy - 0.36 - 0.72 * k, 0])
                         for k, c in enumerate(["#6B5444", "#5D4A3C", "#7A6150", "#4E3E33"])])
        cone = Polygon([1.9, gy, 0], [3.35, 2.35, 0], [3.85, 2.35, 0], [5.3, gy, 0], fill_color="#57534E",
                       fill_opacity=1, stroke_color="#78716C", stroke_width=2)
        chamber = Ellipse(width=3.6, height=0.95, fill_color=MAGMA, fill_opacity=1, stroke_width=0).move_to([0.8, -1.72, 0])
        chamber_glow = glow(MAGMA, 1.7, 8, 0.5).stretch(0.45, 1).move_to(chamber)
        cap_a = slot("Igneous rock: molten rock that cools and hardens", IGN, [-1.3, 2.6, 0])
        cap_b = slot("The first rocks to form in the crust", INK, [-1.3, 2.6, 0])
        self.at(1)
        self.play(FadeIn(bands), FadeIn(cone), run_time=0.7)
        self.play(FadeIn(chamber_glow), FadeIn(chamber), run_time=0.6)
        self.at(1, 0.2)
        self.play(FadeIn(cap_a, shift=DOWN * 0.15), run_time=0.45)
        self.at(1, 0.68)
        self.play(ReplacementTransform(cap_a, cap_b), run_time=0.45)

        crack_pts = [[1.2, -1.28, 0], [1.75, -0.7, 0], [2.45, -0.15, 0], [3.2, 0.45, 0], [3.5, 1.3, 0], [3.6, 2.32, 0]]
        crack = VMobject(stroke_color=CORAL, stroke_width=4).set_points_as_corners(crack_pts)
        cap_c = slot("A crack or weakness opens", CORAL, [-2.9, 2.4, 0], 26)
        self.at(2)
        self.play(FadeOut(cap_b), Create(crack), FadeIn(cap_c, shift=DOWN * 0.15), run_time=1.0)

        rise = VMobject(stroke_color=MAGMA, stroke_width=14).set_points_as_corners(crack_pts[:-1] + [[3.58, 1.95, 0]])
        cap_d = slot("Pressure drops → magma rises", MAGMA, [-2.9, 2.4, 0], 26)
        cap_e = slot("Magma: molten rock below the surface", MAGMA, [-2.9, 1.55, 0], 26)
        self.at(3)
        self.play(ReplacementTransform(cap_c, cap_d), run_time=0.4)
        self.play(Create(rise), run_time=2.4, rate_func=rate_functions.ease_in_sine)
        self.at(3, 0.45)
        self.play(FadeIn(cap_e, shift=DOWN * 0.15), run_time=0.45)

        branch = VMobject(stroke_color=MAGMA, stroke_width=12).set_points_as_corners(
            [[0.4, -1.3, 0], [-0.6, -0.85, 0], [-1.4, -0.55, 0]])
        sill = Ellipse(width=2.6, height=0.36, fill_color=MAGMA, fill_opacity=1, stroke_width=0).move_to([-2.6, -0.52, 0])
        intr = VGroup(pill("Intrusive: cools INSIDE the crust", IGN, 28), T("intrusive = 'forced in'", 24, INK))
        intr.arrange(DOWN, buff=0.12).move_to([-2.9, 2.0, 0])
        lead = DashedLine(intr.get_bottom() + DOWN * 0.08, sill.get_top(), color=IGN, stroke_width=3)
        self.at(4)
        self.play(FadeOut(cap_d), FadeOut(cap_e), Create(branch), run_time=0.9)
        self.play(GrowFromEdge(sill, RIGHT), run_time=0.7)
        self.at(4, 0.4)
        self.play(FadeIn(intr[0], shift=DOWN * 0.15), Create(lead), run_time=0.5)
        self.sfx("pop", -3)
        self.play(sill.animate.set_fill(COOLED), branch.animate.set_stroke(COOLED), run_time=1.2)
        self.at(4, 0.75)
        self.play(FadeIn(intr[1]), run_time=0.4)

        lava = Polygon([3.4, 2.35, 0], [3.85, 2.35, 0], [4.55, 1.45, 0], [5.05, 0.75, 0], [5.6, 0.6, 0], [4.7, 0.6, 0],
                       [4.15, 1.35, 0], fill_color=MAGMA, fill_opacity=1, stroke_width=0)
        burst = VGroup(*[Line([3.6, 2.4, 0], [3.6 + 0.6 * np.cos(a), 2.4 + 0.6 * np.sin(a), 0], color=WARM,
                              stroke_width=5) for a in np.linspace(0.3, PI - 0.3, 6)])
        extr = VGroup(pill("Extrusive: cools ON the surface", IGN, 28), T("Lava: molten rock on the surface", 24, INK))
        extr.arrange(DOWN, buff=0.12).move_to([3.4, 3.35, 0]).shift(DOWN * 0.15)
        self.at(5)
        self.sfx("whoosh", -6)
        self.play(ShowPassingFlash(burst, time_width=0.5), FadeIn(lava, shift=DOWN * 0.1), run_time=0.8)
        self.play(FadeIn(extr[0], shift=DOWN * 0.15), run_time=0.45)
        self.at(5, 0.45)
        self.play(FadeIn(extr[1]), run_time=0.4)
        self.play(lava.animate.set_fill("#44403C"), run_time=1.4)
        self.finish()
