import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mine import *  # noqa: E402,F403


class S07Physical(Shot):
    """Refining stage 1: crush and grind, sort and sift, wash/sieve/pan/sluice."""

    def construct(self):
        head = VGroup(T("Refining, stage 1:", 44, PROC, BOLD), T("physical separation", 44, INK, BOLD)).arrange(RIGHT, buff=0.3)
        head.move_to(UP * 3.35)
        self.at(0, -0.2)
        self.play(FadeIn(head, shift=DOWN * 0.2), run_time=0.5)
        nochem = pill("Physical: no chemical change", PROC, 28).move_to([0, 2.45, 0])
        xs = (-4.55, 0.0, 4.55)
        cards = [card(4.3, 3.7, PROC, stroke=3).move_to([x, 0.15, 0]) for x in xs]
        titles = [T(t, 28, PROC, BOLD).move_to(c.get_top() + DOWN * 0.35)
                  for t, c in zip(("Crush & grind", "Sort & sift", "Wash, sieve, pan, sluice"), cards)]
        titles[2].scale(0.88)
        self.at(1)
        self.play(FadeIn(nochem, shift=DOWN * 0.1), run_time=0.45)
        self.play(LaggedStart(*[FadeIn(VGroup(c, t), shift=UP * 0.15) for c, t in zip(cards, titles)], lag_ratio=0.2),
                  run_time=0.8)

        # crush & grind
        c0 = cards[0].get_center()
        rock = ore_pile(1, 0.01, 0.01, seed=1)[0].scale(3.2).move_to(c0 + UP * 0.25)
        jaws = VGroup(Rectangle(width=0.35, height=1.5, fill_color="#64748B", fill_opacity=1, stroke_width=0).move_to(c0 + [-1.4, 0.25, 0]),
                      Rectangle(width=0.35, height=1.5, fill_color="#64748B", fill_opacity=1, stroke_width=0).move_to(c0 + [1.4, 0.25, 0]))
        rng = np.random.default_rng(3)
        powder = VGroup(*[Dot(c0 + [rng.uniform(-1.2, 1.2), rng.uniform(-1.25, -0.85), 0], 0.035, color="#A8A29E") for _ in range(70)])
        self.at(2)
        self.play(FadeIn(rock), FadeIn(jaws), run_time=0.4)
        self.sfx("pop", -3)
        self.play(jaws[0].animate.shift(RIGHT * 0.75), jaws[1].animate.shift(LEFT * 0.75), rock.animate.scale(0.4), run_time=0.7)
        self.play(FadeOut(rock), FadeIn(powder, lag_ratio=0.01), jaws[0].animate.shift(LEFT * 0.75),
                  jaws[1].animate.shift(RIGHT * 0.75), run_time=0.9)

        # sort & sift
        c1 = cards[1].get_center()
        sieve = VGroup(*[Line(c1 + [-1.5, 0.15, 0] + RIGHT * 0.3 * k, c1 + [-1.5, -0.05, 0] + RIGHT * 0.3 * k,
                              color=INK, stroke_width=2) for k in range(11)],
                       Line(c1 + [-1.6, 0.05, 0], c1 + [1.6, 0.05, 0], color=INK, stroke_width=3))
        big = VGroup(*[Dot(c1 + [rng.uniform(-1.3, 1.3), 0.35, 0], 0.14, color="#78716C") for _ in range(6)])
        fine = VGroup(*[Dot(c1 + [rng.uniform(-1.3, 1.3), 0.45, 0], 0.045, color="#D6D3D1") for _ in range(26)])
        self.at(3)
        self.play(FadeIn(sieve), FadeIn(big), FadeIn(fine), run_time=0.4)
        self.play(*[d.animate.shift(DOWN * rng.uniform(1.1, 1.4)) for d in fine], run_time=1.0)
        self.play(FadeOut(big, shift=UP * 0.3 + LEFT * 0.5), run_time=0.5)

        # wash and gravity: a sluice with riffles catches heavy grains
        c2 = cards[2].get_center()
        slope = Line(c2 + [-1.7, 0.6, 0], c2 + [1.7, -0.9, 0], color="#A8A29E", stroke_width=8)
        riffles = VGroup(*[Line(slope.point_from_proportion(a), slope.point_from_proportion(a) + UP * 0.18,
                                color="#A8A29E", stroke_width=5) for a in (0.3, 0.5, 0.7)])
        water = VMobject(stroke_color=WATER, stroke_width=10, stroke_opacity=0.7).set_points_as_corners(
            [c2 + [-1.7, 0.75, 0], c2 + [1.7, -0.75, 0]])
        heavy = VGroup(*[Dot(riffles[k].get_start() + [-0.12, 0.08, 0], 0.07, color=GOLD) for k in range(3)])
        lights = VGroup(*[Dot(c2 + [-1.5 + 0.2 * k, 0.7 - 0.09 * k, 0], 0.05, color="#D6D3D1") for k in range(8)])
        self.at(4)
        self.play(Create(slope), FadeIn(riffles), run_time=0.5)
        self.play(Create(water), FadeIn(lights), run_time=0.5)
        self.play(*[d.animate.move_to(c2 + [2.2, -1.25, 0]).set_opacity(0) for d in lights], FadeIn(heavy, scale=0.5),
                  run_time=1.6)
        keep = T("heavy particles stay", 22, GOLD).move_to(c2 + DOWN * 1.45)
        self.play(FadeIn(keep), run_time=0.4)
        self.finish()
