import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import check_icon  # noqa: E402
from mine import *  # noqa: E402,F403


class S12People(Shot):
    """Benefits and harms for people; rehabilitation in five steps as the land recovers."""

    def construct(self):
        head = T("Impact on people", 44, INK, BOLD).move_to(UP * 3.35)
        self.at(0, -0.2)
        self.play(FadeIn(head, shift=DOWN * 0.2), run_time=0.5)
        good = card(6.4, 3.6, GOOD, stroke=3).move_to([-3.45, 0.5, 0])
        bad = card(6.4, 3.6, HARM, stroke=3).move_to([3.45, 0.5, 0])
        gt = T("Benefits", 34, GOOD, BOLD).move_to(good.get_top() + DOWN * 0.38)
        bt = T("Harms", 34, HARM, BOLD).move_to(bad.get_top() + DOWN * 0.38)
        self.at(0, 0.4)
        self.play(FadeIn(good), FadeIn(bad), FadeIn(gt), FadeIn(bt), run_time=0.5)

        def items(rows, colr, anchor):
            g = VGroup(*[VGroup(Dot(radius=0.08, color=colr), T(r, 28, INK)).arrange(RIGHT, buff=0.22) for r in rows])
            return g.arrange(DOWN, aligned_edge=LEFT, buff=0.3).next_to(anchor, DOWN, buff=0.4)

        gi = items(["Jobs", "Roads and towns", "Billions of rands in", "foreign income"], GOOD, gt)
        gi[3][0].set_opacity(0)
        bi = items(["Dangerous work", "Dust → lung diseases:", "silicosis, pneumoconiosis"], HARM, bt)
        bi[2][0].set_opacity(0)
        for k, frac in enumerate((0.05, 0.3, 0.55)):
            self.at(1, frac)
            self.play(FadeIn(gi[k:k + 2] if k == 2 else gi[k], shift=RIGHT * 0.1), run_time=0.4)
        for k, frac in enumerate((0.05, 0.35, 0.55)):
            self.at(2, frac)
            self.play(FadeIn(bi[k], shift=RIGHT * 0.1), run_time=0.4)

        # --- rehabilitation
        rhead = VGroup(T("Rehabilitation", 44, GOOD, BOLD), T("(required by law)", 30, MUTED)).arrange(RIGHT, buff=0.3)
        rhead.move_to(UP * 3.35)
        frame = card(6.2, 3.9, MUTED, stroke=3).move_to([-3.55, 0.35, 0])
        fc = frame.get_center()
        land = Polygon(fc + [-2.9, -0.4, 0], fc + [-1.2, -0.4, 0], fc + [-0.7, -1.4, 0], fc + [0.7, -1.4, 0],
                       fc + [1.2, -0.4, 0], fc + [2.9, -0.4, 0], fc + [2.9, -1.75, 0], fc + [-2.9, -1.75, 0],
                       fill_color="#8B6B4A", fill_opacity=1, stroke_width=0)
        dump = ore_pile(14, 1.4, 0.7, seed=12).move_to(fc + [-1.9, -0.05, 0])
        pond = Ellipse(width=1.3, height=0.32, fill_color="#65A30D", fill_opacity=0.8, stroke_width=0).move_to(fc + [0, -1.25, 0])
        steps = ["make the site safe and stable", "remove pollutants, treat the water", "reshape the land, replace topsoil",
                 "replant indigenous plants", "restore rivers and wetlands"]
        keys = ["make the site", "remove pollutants", "reshape the land", "replant", "restore rivers"]
        checks = VGroup(*[VGroup(check_icon(GOOD, 0.2), T(s, 25, INK)).arrange(RIGHT, buff=0.22) for s in steps])
        checks.arrange(DOWN, aligned_edge=LEFT, buff=0.3).move_to([0, 0.3, 0]).align_to([0.55, 0, 0], LEFT)
        self.at(3, -0.03)
        self.play(FadeOut(VGroup(head, good, bad, gt, bt, gi, bi)), run_time=0.4)
        self.play(FadeIn(rhead, shift=DOWN * 0.2), FadeIn(frame), FadeIn(land), FadeIn(dump), FadeIn(pond), run_time=0.6)
        flat = Polygon(fc + [-2.9, -0.55, 0], fc + [2.9, -0.55, 0], fc + [2.9, -1.75, 0], fc + [-2.9, -1.75, 0],
                       fill_color="#8B6B4A", fill_opacity=1, stroke_width=0)
        topsoil = Rectangle(width=5.8, height=0.25, fill_color="#3F2A1D", fill_opacity=1, stroke_width=0).move_to(fc + [0, -0.45, 0])
        rng = np.random.default_rng(4)
        trees = VGroup(*[VGroup(Line(ORIGIN, UP * 0.25, color="#78350F", stroke_width=4),
                                Triangle(fill_color=GOOD, fill_opacity=1, stroke_width=0).scale(0.28).shift(UP * 0.42))
                         .move_to(fc + [x, -0.0 + rng.uniform(-0.05, 0.05), 0]) for x in np.linspace(-2.5, 2.5, 9)])
        river = VMobject(stroke_color=WATER, stroke_width=8).set_points_smoothly(
            [fc + [x, -1.1 + 0.12 * np.sin(x * 2), 0] for x in np.linspace(-2.8, 2.8, 12)])
        text = self.segs[3]["text"]
        scenes = [lambda: [FadeOut(dump), ReplacementTransform(land, flat)],
                  lambda: [pond.animate.set_fill(WATER, 0.8)],
                  lambda: [FadeIn(topsoil)],
                  lambda: [LaggedStart(*[GrowFromEdge(t, DOWN) for t in trees], lag_ratio=0.1)],
                  lambda: [Create(river), FadeOut(pond)]]
        for k, key in enumerate(keys):
            self.at(3, max(0.0, text.index(key) / len(text) - 0.02))
            self.sfx("tick", -6)
            self.play(FadeIn(checks[k], shift=RIGHT * 0.1), *scenes[k](), run_time=0.7)
        self.finish()
