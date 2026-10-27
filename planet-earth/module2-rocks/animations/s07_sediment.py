import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from geo import *  # noqa: E402,F403


class S07Sediment(Shot):
    """Mechanical sedimentary rock in four steps: erosion, transport & deposition, layering, compaction."""

    def construct(self):
        steps = VGroup(*[T(s, 22, MUTED, SEMIBOLD) for s in
                         ("1  Erosion", "2  Transport & deposition", "3  Layers build up", "4  Compaction & cementation")])
        steps.arrange(DOWN, aligned_edge=LEFT, buff=0.22).move_to([0, 2.0, 0]).align_to([-6.9, 0, 0], LEFT)
        head = T("Sedimentary rock: 4 steps", 40, SED, BOLD).move_to([0, 3.42, 0]).align_to([-6.9, 0, 0], LEFT)

        dx = 1.4
        land = Polygon(*[[x + (dx if x < 7 else 0), y, 0] for x, y in
                         [(-3.7, -2.25), (-3.7, 1.2), (-2.6, 2.3), (-1.6, 1.45), (-0.6, 0.55), (0.35, 0.18), (0.6, -0.4),
                          (1.4, -1.9), (7.3, -1.9), (7.3, -2.25)]],
                       fill_color="#6B5444", fill_opacity=1, stroke_color="#8B6B4A", stroke_width=2)
        sea = Polygon([0.25 + dx, 0.35, 0], [7.3, 0.35, 0], [7.3, -1.9, 0], [1.4 + dx, -1.9, 0], [0.6 + dx, -0.4, 0],
                      fill_color=WATER, fill_opacity=0.3, stroke_width=0)
        surf = Line([0.25 + dx, 0.35, 0], [7.3, 0.35, 0], color=WATER, stroke_width=3)
        river_pts = [[x + dx, y, 0] for x, y in [(-2.4, 2.12), (-1.6, 1.5), (-0.6, 0.6), (0.4, 0.34)]]
        river = VMobject(stroke_color=WATER, stroke_width=7).set_points_smoothly(river_pts)
        self.at(0, -0.25)
        self.play(FadeIn(head, shift=DOWN * 0.2), FadeIn(land), FadeIn(sea), Create(surf), run_time=0.9)
        self.play(Create(river), run_time=0.6)
        self.at(0, 0.7)
        self.play(LaggedStart(*[FadeIn(s, shift=RIGHT * 0.1) for s in steps], lag_ratio=0.2), run_time=1.0)

        def light(k):
            anims = [steps[k].animate.set_color(SED)]
            if k:
                anims.append(steps[k - 1].animate.set_color(INK))
            return anims

        # --- step 1: erosion
        rain = VGroup(*[Line([x, 3.0, 0], [x - 0.12, 2.65, 0], color=WATER, stroke_width=3)
                        for x in np.linspace(-1.9, 0.0, 7)])
        bits = Flow(river, n=10, color="#C08457", r=0.06, speed=0.22,
                    maker=lambda: Dot(radius=0.06, color="#C08457"))
        cause = T("rivers, wind and ice", 24, INK).move_to([-0.6, 2.85, 0])
        self.at(1)
        self.play(*light(0), run_time=0.4)
        self.at(2)
        self.play(FadeIn(rain, shift=DOWN * 0.2), FadeIn(cause), run_time=0.5)
        self.play(FadeIn(bits), run_time=0.5)

        # --- step 2: transport and deposition
        rng = np.random.default_rng(4)
        fall = VGroup(*[Dot([rng.uniform(2.1, 3.6), 0.2, 0], 0.055, color="#C08457") for _ in range(26)])
        layer_cols = ["#D9A066", "#A8A29E", "#C08457", "#8D6E52"]
        layers = VGroup(*[Rectangle(width=4.4, height=0.27, fill_color=c, fill_opacity=1, stroke_color="#57534E",
                                    stroke_width=1).move_to([5.05, -1.765 + 0.27 * k, 0]) for k, c in enumerate(layer_cols)])
        self.at(3)
        self.play(*light(1), FadeOut(rain), FadeOut(cause), run_time=0.4)
        self.at(4, 0.1)
        self.add(fall)
        self.play(*[d.animate.move_to([d.get_x() + rng.uniform(0.9, 3.4), -1.8, 0]) for d in fall],
                  run_time=1.6, rate_func=rate_functions.ease_in_quad)
        self.play(FadeIn(layers[0], shift=UP * 0.05), FadeOut(fall), run_time=0.5)

        # --- step 3: layers stack up over thousands of years
        years = pill("over thousands of years", INK, 26).move_to([4.9, 1.05, 0])
        self.at(5)
        self.play(*light(2), FadeIn(years, shift=DOWN * 0.1), run_time=0.45)
        for k in range(1, 4):
            self.play(FadeIn(layers[k], shift=DOWN * 0.25), run_time=0.6)

        # --- step 4: compaction and cementation
        arrows = VGroup(*[Arrow([x, -0.1, 0], [x, -0.65, 0], buff=0, color=INK, stroke_width=5) for x in (3.4, 5.0, 6.6)])
        weight = T("weight of water + layers", 24, INK).next_to(arrows, UP, buff=0.08)
        inset_c = np.array([-5.0, -1.0, 0])
        ring = Circle(radius=1.05, color=SED, stroke_width=4).move_to(inset_c)
        grains = VGroup(*[Circle(radius=0.15, fill_color="#D9A066", fill_opacity=1, stroke_color="#8D6E52", stroke_width=2)
                          .move_to(inset_c + np.array([x, y, 0])) for x, y in
                          [(-0.5, -0.45), (0.0, -0.5), (0.5, -0.45), (-0.55, 0.0), (0.0, 0.02), (0.55, 0.0),
                           (-0.45, 0.45), (0.05, 0.5), (0.5, 0.45)]])
        cement = Circle(radius=0.62, fill_color=SED, fill_opacity=0.45, stroke_width=0).move_to(inset_c)
        cap = T("grains pressed + cemented", 22, INK).next_to(ring, UP, buff=0.12)
        self.at(6)
        self.play(*light(3), FadeOut(years), FadeIn(ring), FadeIn(grains), FadeIn(cap), run_time=0.5)
        self.at(7)
        self.play(FadeIn(arrows, shift=DOWN * 0.15), FadeIn(weight), layers.animate.stretch(0.78, 1, about_edge=DOWN),
                  grains.animate.scale(0.72, about_point=inset_c), run_time=1.4)
        self.at(7, 0.55)
        self.add(cement)
        self.bring_to_front(grains)
        self.play(FadeIn(cement), layers.animate.set_stroke(SED, 2), run_time=0.9)
        self.finish()
