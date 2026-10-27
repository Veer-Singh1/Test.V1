import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mine import *  # noqa: E402,F403


class S03Ores(Shot):
    """Metals are bonded to oxygen or sulphur; ore = worth the cost; refining."""

    def construct(self):
        head = T("Ores", 52, ORE, BOLD).move_to([-5.6, 3.35, 0])
        rock = ore_pile(20, 2.4, 1.2, seed=9, gold=6).move_to([-4.6, 0.6, 0])
        lens = Circle(radius=1.9, color=INK, stroke_width=3).move_to([0.6, 0.6, 0])
        link = DashedLine(rock.get_right(), lens.get_left(), color=MUTED, stroke_width=3)
        self.at(0, -0.2)
        self.play(FadeIn(head), FadeIn(rock, lag_ratio=0.05), run_time=0.7)
        pure = pill("Most metals aren't found pure", INK, 28).move_to([2.6, 3.25, 0])
        self.play(FadeIn(pure, shift=DOWN * 0.1), run_time=0.4)

        pairs = VGroup()
        for (m, mc, x, y), (o, oc) in zip([("Fe", "#B45309", -0.55, 0.7), ("Pb", "#94A3B8", 0.55, -0.2),
                                           ("Cu", "#F97316", -0.6, -0.75), ("Fe", "#B45309", 0.65, 0.95)],
                                          [("O", CORAL), ("S", GOLD), ("S", GOLD), ("O", CORAL)]):
            a, b = atom(m, mc, 0.3), atom(o, oc, 0.22)
            a.move_to([x, y, 0])
            b.next_to(a, RIGHT, buff=0.02)
            pairs.add(VGroup(a, b).shift([0.6, 0.6, 0]))
        tags = VGroup(T("metal + oxygen (oxides)", 24, CORAL), T("metal + sulphur (sulphides)", 24, GOLD))
        tags.arrange(DOWN, aligned_edge=LEFT, buff=0.15).move_to([0, 0.6, 0]).align_to([2.75, 0, 0], LEFT)
        self.at(1)
        self.play(Create(link), Create(lens), run_time=0.6)
        self.play(LaggedStart(*[FadeIn(p, scale=0.6) for p in pairs], lag_ratio=0.2), run_time=1.0)
        self.at(1, 0.55)
        self.play(FadeIn(tags, shift=LEFT * 0.15), run_time=0.5)

        defin = VGroup(T("Ore", 34, ORE, BOLD), T("a rock with enough useful mineral", 30, INK),
                       T("to be worth the cost of mining and processing", 30, INK)).arrange(DOWN, buff=0.12)
        dbox = SurroundingRectangle(defin, color=ORE, buff=0.3, corner_radius=0.18, stroke_width=3).set_fill(PANEL, 1)
        definition = VGroup(dbox, defin).move_to([0, 0.6, 0])
        self.at(2)
        self.play(FadeOut(VGroup(lens, link, pairs, tags, rock, pure)), run_time=0.4)
        self.play(FadeIn(definition, scale=0.95), run_time=0.6)

        # balance: value of the metal vs cost of mining and processing
        piv = np.array([0, -0.6, 0])
        post = Line(piv + DOWN * 1.35, piv, color=INK, stroke_width=6)
        tilt = ValueTracker(0.0)

        def beam():
            a = tilt.get_value()
            d = np.array([np.cos(a), np.sin(a), 0])
            left, right = piv - 2.2 * d, piv + 2.2 * d
            pan_l = VGroup(Line(left, left + DOWN * 0.45, color=INK, stroke_width=3),
                           RoundedRectangle(corner_radius=0.1, width=2.5, height=0.5, fill_color=ORE, fill_opacity=0.9,
                                            stroke_width=0).move_to(left + DOWN * 0.7))
            pan_r = VGroup(Line(right, right + DOWN * 0.45, color=INK, stroke_width=3),
                           RoundedRectangle(corner_radius=0.1, width=2.5, height=0.5, fill_color=HARM, fill_opacity=0.9,
                                            stroke_width=0).move_to(right + DOWN * 0.7))
            return VGroup(Line(left, right, color=INK, stroke_width=7), pan_l, pan_r,
                          T("value of metal", 20, NAVY, BOLD).move_to(pan_l[1]), T("cost", 20, NAVY, BOLD).move_to(pan_r[1]))

        scale = always_redraw(beam)
        verdict = pill("ORE ✓ worth mining", GOOD, 30).move_to([0, -2.0, 0])
        verdict2 = pill("Too little mineral → not an ore", HARM, 30).move_to([0, -2.0, 0])
        self.at(2, 0.5)  # "worth the cost"
        self.play(definition.animate.scale(0.8).move_to([0, 2.45, 0]), run_time=0.5)
        self.play(FadeIn(post), FadeIn(scale), run_time=0.4)
        self.play(tilt.animate.set_value(0.22), run_time=0.7)
        self.at(2, 0.85)  # "is called an ore"
        self.play(FadeIn(verdict, shift=UP * 0.1), run_time=0.3)
        self.at(3, 0.5)
        self.play(tilt.animate.set_value(-0.22), ReplacementTransform(verdict, verdict2), run_time=0.8)

        refine = VGroup(T("Refining", 34, PROC, BOLD), T("separating the pure metal from", 28, INK),
                        T("everything else in the ore", 28, INK)).arrange(DOWN, buff=0.1)
        ore_ic = ore_pile(12, 1.6, 0.8, seed=3, gold=4)
        bar = VGroup(RoundedRectangle(corner_radius=0.08, width=2.0, height=0.5, fill_color=GOLD, fill_opacity=1,
                                      stroke_color="#A16207", stroke_width=2), T("pure metal", 20, NAVY, BOLD))
        bar[1].move_to(bar[0])
        waste = ore_pile(10, 1.4, 0.6, seed=5)
        chain = VGroup(ore_ic, Arrow(LEFT * 0.6, RIGHT * 0.6, buff=0, color=PROC, stroke_width=6), bar,
                       T("+ waste", 26, MUTED), waste).arrange(RIGHT, buff=0.35)
        group = VGroup(refine, chain).arrange(DOWN, buff=0.45).move_to([0, 0.2, 0])
        self.at(4)
        self.play(FadeOut(VGroup(post, scale, verdict2, definition)), run_time=0.4)
        self.play(FadeIn(refine, shift=UP * 0.1), run_time=0.5)
        self.play(FadeIn(chain, lag_ratio=0.2), run_time=1.0)
        self.finish()
