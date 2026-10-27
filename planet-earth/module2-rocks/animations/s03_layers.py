import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from geo import *  # noqa: E402,F403


class S03Layers(Shot):
    """The lithosphere, why the Earth has layers, and the four layers (cut-away, not to scale)."""

    def construct(self):
        c = np.array([-3.3, -2.05, 0])
        spec = [("crust", 3.25, "#8B6B4A"), ("mantle", 3.08, "#B4533B"), ("outer", 1.75, "#F97316"),
                ("inner", 0.72, "#FDE68A")]
        halves = {n: Sector(radius=r, angle=PI, start_angle=0, fill_color=col, fill_opacity=1, stroke_width=0).shift(c)
                  for n, r, col in spec}
        litho = AnnularSector(inner_radius=2.9, outer_radius=3.27, angle=PI, start_angle=0, fill_opacity=0,
                              stroke_color=AMBER, stroke_width=5).shift(c)
        head = T("Inside the Earth", 46, INK, BOLD).move_to([-4.3, 3.35, 0])
        note = T("diagram not to scale", 20, MUTED).next_to(head, DOWN, buff=0.12).align_to(head, LEFT)

        def at_angle(r, deg):
            return c + r * np.array([np.cos(deg * DEGREES), np.sin(deg * DEGREES), 0])

        # --- seg 0: the lithosphere
        lit_lbl = pill("Lithosphere = crust + rigid upper mantle", AMBER, 30).move_to([2.75, 2.55, 0])
        lit_line = Line(lit_lbl.get_left() + LEFT * 0.05, at_angle(3.1, 62), color=AMBER, stroke_width=3)
        self.at(0, -0.3)
        self.play(FadeIn(head), FadeIn(note), LaggedStart(*[FadeIn(halves[n], scale=0.9) for n, *_ in spec],
                                                       lag_ratio=0.2), run_time=1.2)
        self.at(0, 0.35)
        self.play(Create(litho), FadeIn(lit_lbl, shift=LEFT * 0.2), Create(lit_line), run_time=0.8)

        # --- seg 1: heavy materials sank, light ones floated
        mc = np.array([3.55, 0.05, 0])
        ball = Circle(radius=1.5, fill_color="#C2410C", fill_opacity=0.85, stroke_color=MAGMA, stroke_width=4).move_to(mc)
        rng = np.random.default_rng(3)
        heavy = VGroup(*[Dot(mc + [*(rng.uniform(-1, 1, 2) * 1.0), 0], 0.08, color="#1E293B") for _ in range(18)])
        light = VGroup(*[Dot(mc + [*(rng.uniform(-1, 1, 2) * 1.0), 0], 0.08, color="#FEF3C7") for _ in range(18)])
        young = T("the young, hot Earth", 26, WARM).next_to(ball, UP, buff=0.15)
        self.at(1, 0.02)
        self.play(FadeIn(ball), FadeIn(heavy), FadeIn(light), FadeIn(young), run_time=0.6)
        anims = []
        for k, d in enumerate(heavy):
            a = rng.uniform(0, 2 * np.pi)
            anims.append(d.animate.move_to(mc + rng.uniform(0.05, 0.45) * np.array([np.cos(a), np.sin(a), 0])))
        for k, d in enumerate(light):
            a = 2 * np.pi * k / len(light)
            anims.append(d.animate.move_to(mc + 1.32 * np.array([np.cos(a), np.sin(a), 0])))
        self.at(1, 0.2)
        self.play(*anims, run_time=3.0, rate_func=rate_functions.ease_in_out_sine)
        tags = VGroup(T("heavy → centre", 26, INK, SEMIBOLD), T("light → top", 26, WARM, SEMIBOLD)).arrange(RIGHT, buff=0.6)
        tags.next_to(ball, DOWN, buff=0.2)
        self.play(FadeIn(tags, shift=UP * 0.1), run_time=0.4)
        self.at(2, -0.15)
        self.play(FadeOut(VGroup(ball, heavy, light, young, tags)), run_time=0.4)

        # --- seg 2-3: label the layers
        labels = [
            ("crust", VGroup(T("Crust", 30, "#D6B48C", BOLD), T("5–10 km under oceans", 24, INK),
                             T("up to ~50 km under continents", 24, INK)), 3.17, 74, 1.55, (2, 0.12)),
            ("mantle", VGroup(T("Mantle", 30, "#F0907A", BOLD), T("~2 900 km thick", 24, INK)), 2.5, 52, 0.25, (3, 0.05)),
            ("outer", VGroup(T("Outer core", 30, "#FB923C", BOLD), T("liquid iron & nickel", 24, INK)), 1.25, 38, -0.75,
             (3, 0.42)),
            ("inner", VGroup(T("Inner core", 30, "#FDE68A", BOLD), T("solid iron & nickel", 24, INK)), 0.4, 22, -1.7,
             (3, 0.68)),
        ]
        for name, grp, r, deg, y, (seg, frac) in labels:
            grp.arrange(DOWN, aligned_edge=LEFT, buff=0.06).move_to([0, y, 0]).align_to([1.1, 0, 0], LEFT)
            dot = Dot(at_angle(r, deg), 0.07, color=INK)
            lead = Line(dot.get_center(), grp.get_left() + LEFT * 0.12, color=MUTED, stroke_width=2.5)
            self.at(seg, frac)
            self.play(FadeIn(dot, scale=0.5), Create(lead), FadeIn(grp, shift=LEFT * 0.15),
                      Indicate(halves[name], color=WHITE, scale_factor=1.0), run_time=0.6)
        self.finish()
