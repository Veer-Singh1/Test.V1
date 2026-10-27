import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mine import *  # noqa: E402,F403


def ground(y_top=1.4, y_bot=-2.25):
    cols = ["#7A6150", "#6B5444", "#5D4A3C", "#4E3E33"]
    h = (y_top - y_bot) / len(cols)
    return VGroup(*[Rectangle(width=14.6, height=h, fill_color=c, fill_opacity=1, stroke_width=0)
                    .move_to([0, y_top - h * (k + 0.5), 0]) for k, c in enumerate(cols)])


class S06Shaft(Shot):
    """Depth decides the method; shaft mining with tunnels; cages and lifts."""

    def construct(self):
        head = T("Three ways to mine", 40, ORE, BOLD).move_to([-4.2, 3.4, 0])
        gy = 1.4
        earth = ground(gy)
        depth = VGroup(Arrow([-6.6, gy - 0.1, 0], [-6.6, -2.0, 0], buff=0, color=INK, stroke_width=5),
                       T("near the surface", 22, INK).move_to([-5.55, gy - 0.35, 0]),
                       T("deep", 22, INK).move_to([-6.05, -1.85, 0]))
        self.at(0, -0.25)
        self.play(FadeIn(head), FadeIn(earth), run_time=0.7)
        self.at(0, 0.35)
        self.play(GrowArrow(depth[0]), FadeIn(depth[1:]), run_time=0.7)

        ore = Polygon([1.4, -1.0, 0], [3.2, -0.55, 0], [5.4, -0.9, 0], [5.9, -1.7, 0], [3.6, -2.05, 0], [1.6, -1.8, 0],
                      fill_color=ORE, fill_opacity=0.9, stroke_color=GOLD, stroke_width=2)
        ore_lbl = T("ore body", 24, NAVY, BOLD).move_to(ore.get_center())
        frame = headgear(1.5).move_to([-2.0, gy + 0.75, 0])
        shaft = Rectangle(width=0.5, height=gy + 2.05, fill_color="#1C1917", fill_opacity=1, stroke_width=0)
        shaft.move_to([-2.0, (gy - 2.05) / 2, 0])
        tunnels = VGroup(Rectangle(width=4.0, height=0.32, fill_color="#1C1917", fill_opacity=1, stroke_width=0).move_to([0.0, -0.75, 0]),
                         Rectangle(width=3.9, height=0.32, fill_color="#1C1917", fill_opacity=1, stroke_width=0).move_to([0.0, -1.55, 0]))
        tag = pill("Shaft mining: deep ore (gold, platinum)", ORE, 28).move_to([2.6, 2.6, 0])
        self.at(1)
        self.play(FadeIn(ore), FadeIn(ore_lbl), run_time=0.5)
        self.play(FadeIn(frame, shift=DOWN * 0.2), FadeIn(tag, shift=DOWN * 0.1), run_time=0.5)
        self.at(1, 0.3)
        self.play(GrowFromEdge(shaft, UP), run_time=1.2)
        self.at(1, 0.65)
        self.play(*[GrowFromEdge(t, LEFT) for t in tunnels], run_time=1.2)
        labels = VGroup(T("vertical shaft", 22, INK).next_to(shaft, LEFT, buff=0.15).shift(UP * 0.6),
                        T("horizontal tunnels", 22, INK).next_to(tunnels[0], UP, buff=0.08))
        self.play(FadeIn(labels), run_time=0.4)

        cage = VGroup(Rectangle(width=0.36, height=0.42, fill_color=INK, fill_opacity=1, stroke_color=NAVY, stroke_width=2),
                      Line([-2.0, gy + 1.5, 0], [-2.0, gy, 0], color=INK, stroke_width=2))
        t0 = [0.0]
        cage[0].move_to([-2.0, gy - 0.4, 0])

        def ride(m, dt):
            t0[0] += dt
            y = gy - 0.4 - (gy + 1.55) * (0.5 - 0.5 * np.cos(t0[0] * 1.4))
            m[0].move_to([-2.0, y, 0])
            m[1].put_start_and_end_on([-2.0, gy + 1.5, 0], [-2.0, y + 0.21, 0])

        cage.add_updater(ride)
        lift = pill("Cages and lifts carry miners and ore", INK, 24).move_to([3.4, 1.9, 0])
        self.at(2)
        self.add(cage)
        self.play(FadeIn(lift, shift=DOWN * 0.1), run_time=0.45)
        self.finish()


class S06OpenPit(Shot):
    """Open cast: overburden stripped, benches; then panning in a riverbed."""

    def construct(self):
        gy = 1.2
        over = Polygon([-7.3, gy, 0], [7.3, gy, 0], [7.3, 0.1, 0], [-7.3, 0.1, 0], fill_color="#7A6150", fill_opacity=1,
                       stroke_width=0)
        ore = Rectangle(width=14.6, height=1.2, fill_color=ORE, fill_opacity=0.9, stroke_width=0).move_to([0, -0.5, 0])
        rock = Rectangle(width=14.6, height=1.15, fill_color="#4E3E33", fill_opacity=1, stroke_width=0).move_to([0, -1.675, 0])
        head = pill("Open cast: ore near the surface (iron, coal, copper, diamonds)", ORE, 26).move_to([0, 3.3, 0])
        self.play(FadeIn(VGroup(rock, ore, over)), FadeIn(head), run_time=0.6)
        ov_lbl = pill("Overburden: the soil and rock on top", INK, 26).move_to([0, 2.35, 0])
        self.at(0, 0.05)
        self.play(FadeIn(ov_lbl, shift=DOWN * 0.1), Indicate(over, color=WARM, scale_factor=1.0), run_time=0.7)
        left = [(-5.0, gy), (-5.0, 0.6), (-4.2, 0.6), (-4.2, 0.0), (-3.4, 0.0), (-3.4, -0.6), (-2.6, -0.6), (-2.6, -1.2)]
        prof = left + [(-x, y) for x, y in reversed(left)]
        pit = Polygon(*[[x, y, 0] for x, y in prof], fill_color=NAVY, fill_opacity=1, stroke_color=GOLD, stroke_width=3)
        heap = ore_pile(40, 3.0, 1.0, seed=6).move_to([5.6, gy + 0.55, 0])
        self.at(0, 0.3)
        self.play(FadeIn(pit), FadeIn(heap, shift=RIGHT * 0.3), run_time=1.4)
        bench = pill("Benches: steps in the pit wall", GOLD, 26).move_to([0, 1.75, 0])
        arrow = Arrow(bench.get_bottom() + LEFT * 1.0, [-3.8, 0.05, 0], buff=0.1, color=GOLD, stroke_width=4)
        self.at(0, 0.75)
        self.play(ReplacementTransform(ov_lbl, bench), GrowArrow(arrow), run_time=0.6)

        # --- panning
        pan_c = np.array([-3.0, 0.1, 0])
        pan = VGroup(Ellipse(width=4.8, height=1.9, fill_color="#57534E", fill_opacity=1, stroke_color="#A8A29E", stroke_width=5),
                     Ellipse(width=4.1, height=1.5, fill_color=WATER, fill_opacity=0.35, stroke_width=0)).move_to(pan_c)
        rng = np.random.default_rng(10)
        light = VGroup(*[Dot(pan_c + [rng.uniform(-1.6, 1.6), rng.uniform(-0.55, 0.55), 0], 0.06, color="#D6D3D1") for _ in range(40)])
        heavy = VGroup(*[Dot(pan_c + [rng.uniform(-1.5, 1.5), rng.uniform(-0.45, 0.45), 0], 0.07, color=GOLD) for _ in range(10)])
        swirl = VGroup(*[Arc(radius=r, start_angle=a, angle=PI / 2, color=WHITE, stroke_width=3, stroke_opacity=0.5)
                         .stretch(0.4, 1).move_to(pan_c) for r, a in ((1.4, 0), (1.0, PI), (1.8, PI / 2))])
        info = VGroup(pill("Panning: riverbed gold & diamonds", ORE, 24),
                      T("heavy particles sink", 26, GOLD), T("lighter sand washes over the edge", 26, INK))
        info.arrange(DOWN, aligned_edge=LEFT, buff=0.22).move_to([0, 0.3, 0]).align_to([0.7, 0, 0], LEFT)
        self.at(1, -0.05)
        self.play(FadeOut(VGroup(rock, ore, over, pit, heap, bench, arrow, head)), run_time=0.5)
        self.play(FadeIn(pan), FadeIn(light), FadeIn(heavy), FadeIn(info[0]), run_time=0.6)
        swirl.add_updater(lambda m, dt: m.rotate(1.6 * dt, about_point=pan_c))
        self.add(swirl)
        self.at(1, 0.45)
        self.play(*[d.animate.move_to(pan_c + [rng.uniform(-0.35, 0.35), rng.uniform(-0.15, 0.15), 0]) for d in heavy],
                  FadeIn(info[1]), run_time=1.6)
        self.at(1, 0.72)
        self.play(*[d.animate.move_to(pan_c + [-2.9 - rng.uniform(0, 0.6), rng.uniform(-1.4, -0.6), 0]).set_opacity(0)
                    for d in light], FadeIn(info[2]), run_time=1.8)
        self.finish()
