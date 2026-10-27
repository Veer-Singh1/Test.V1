import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import check_icon  # noqa: E402
from geo import *  # noqa: E402,F403


class S06IgneousTraits(Shot):
    """Crystalline; cooling rate sets crystal size (granite vs basalt); no layers, no fossils; examples."""

    def construct(self):
        head = T("Recognising igneous rock", 46, IGN, BOLD).move_to(UP * 3.35)
        self.at(0, -0.25)
        self.play(FadeIn(head, shift=DOWN * 0.2), run_time=0.5)

        # --- seg 1: crystals form as magma cools
        box = RoundedRectangle(corner_radius=0.2, width=6.4, height=2.4, fill_color=MAGMA, fill_opacity=0.3,
                               stroke_color=MAGMA, stroke_width=3).move_to([0, 0.7, 0])
        rng = np.random.default_rng(2)
        cols = ["#E0F2FE", "#64748B", "#A3E635"]
        dots = VGroup(*[Dot([rng.uniform(-2.9, 2.9), 0.7 + rng.uniform(-1.0, 1.0), 0], 0.07, color=cols[k % 3])
                        for k in range(42)])
        legend = VGroup(*[VGroup(Dot(radius=0.08, color=c), T(n, 24, INK)).arrange(RIGHT, buff=0.12)
                          for c, n in zip(cols, ("silica", "iron", "magnesium"))]).arrange(RIGHT, buff=0.6)
        legend.next_to(box, DOWN, buff=0.25)
        self.at(1)
        self.play(FadeIn(box), FadeIn(dots), FadeIn(legend), run_time=0.6)
        centres = [np.array([x, 0.7 + y, 0]) for x, y in ((-2.1, 0.4), (-0.7, -0.4), (0.6, 0.45), (2.0, -0.3), (-1.6, -0.6), (1.5, 0.6))]
        crystals = VGroup(*[Polygon(*[c + 0.42 * np.array([np.cos(a), np.sin(a), 0]) * (1 + 0.25 * np.sin(3 * a + k))
                                      for a in np.linspace(0, 2 * np.pi, 7)[:-1]],
                                    fill_color=["#F9A8D4", "#F1F5F9", "#1F2937", "#E5E7EB", "#F9A8D4", "#F1F5F9"][k],
                                    fill_opacity=1, stroke_color="#94A3B8", stroke_width=2)
                            for k, c in enumerate(centres)])
        lbl = pill("Cooling → mineral crystals", IGN, 28).next_to(legend, DOWN, buff=0.2)
        self.at(1, 0.35)
        self.play(*[d.animate.move_to(centres[k % 6] + 0.15 * np.array([np.cos(k), np.sin(k), 0]))
                    for k, d in enumerate(dots)], box.animate.set_fill(opacity=0.12), run_time=1.6)
        self.play(FadeIn(crystals, scale=0.5), FadeOut(dots), FadeIn(lbl), run_time=0.7)

        # --- seg 2-4: slow vs fast cooling
        left = card(6.3, 3.6, IGN, stroke=3).move_to([-3.35, 0.55, 0])
        right = card(6.3, 3.6, IGN, stroke=3).move_to([3.35, 0.55, 0])
        lt = T("Slow cooling · deep underground", 28, INK, SEMIBOLD).move_to(left.get_top() + DOWN * 0.38)
        rt = T("Fast cooling · at the surface", 28, INK, SEMIBOLD).move_to(right.get_top() + DOWN * 0.38)
        self.at(2)
        self.play(FadeOut(VGroup(box, crystals, legend, lbl)), run_time=0.4)
        self.play(FadeIn(left), FadeIn(right), FadeIn(lt), FadeIn(rt), run_time=0.6)
        gran = swatch("granite", 5.2, 1.9, seed=11).move_to(left.get_center() + DOWN * 0.1)
        gran_lbl = M(f"large crystals → {col('GRANITE', IGN)}", 30, INK, SEMIBOLD).next_to(gran, DOWN, buff=0.18)
        self.at(3)
        self.add(gran[0])
        self.play(LaggedStart(*[GrowFromCenter(m) for m in gran[1:]], lag_ratio=0.02), run_time=3.2)
        self.play(FadeIn(gran_lbl, shift=UP * 0.1), run_time=0.4)
        bas = swatch("basalt", 5.2, 1.9, seed=12).move_to(right.get_center() + DOWN * 0.1)
        bas_lbl = M(f"tiny crystals → {col('BASALT', IGN)}", 30, INK, SEMIBOLD).next_to(bas, DOWN, buff=0.18)
        self.at(4, 0.1)
        self.play(FadeIn(bas, scale=1.05), run_time=0.7)
        self.play(FadeIn(bas_lbl, shift=UP * 0.1), run_time=0.4)

        # --- seg 5: checklist
        rows = ["Crystalline", "Massive: no layers", "No fossils: heat destroys living material"]
        checks = VGroup(*[VGroup(check_icon(IGN, 0.22), T(r, 32, INK, SEMIBOLD)).arrange(RIGHT, buff=0.3) for r in rows])
        checks.arrange(DOWN, aligned_edge=LEFT, buff=0.28).move_to([0, 1.7, 0])
        self.at(5, -0.1)
        self.play(FadeOut(VGroup(left, right, lt, rt, gran, gran_lbl, bas, bas_lbl)), run_time=0.4)
        for k, frac in enumerate((0.0, 0.2, 0.55)):
            self.at(5, frac)
            self.play(FadeIn(checks[k], shift=RIGHT * 0.15), run_time=0.4)

        # --- seg 6-7: examples
        def row(tag, names, y, kind):
            chip = pill(tag, IGN, 28)
            s = swatch(kind, 1.3, 0.62, seed=3)
            txt = T(names, 30, INK)
            return VGroup(chip, s, txt).arrange(RIGHT, buff=0.35).move_to([0, y, 0]).align_to([-6.4, 0, 0], LEFT)

        intr = row("Intrusive", "granite · gabbro · dolerite", -0.4, "granite")
        extr = row("Extrusive", "basalt · pumice · obsidian · scoria", -1.4, "basalt")
        self.at(6)
        self.play(FadeIn(intr, shift=UP * 0.15), run_time=0.45)
        self.at(7)
        self.play(FadeIn(extr, shift=UP * 0.15), run_time=0.45)
        water = Rectangle(width=1.9, height=0.42, fill_color=WATER, fill_opacity=0.45, stroke_width=0).move_to([5.7, -1.62, 0])
        surface = Line(water.get_corner(UL), water.get_corner(UR), color=WATER, stroke_width=3)
        stone = swatch("pumice", 0.62, 0.38, seed=5).move_to([5.7, -1.42, 0])
        t0 = self.time
        stone.add_updater(lambda m: m.move_to([5.7, -1.42 + 0.04 * np.sin((self.time - t0) * 3), 0]))
        floats = T("pumice floats", 24, WATER).next_to(surface, UP, buff=0.32)
        self.at(7, 0.62)
        self.play(FadeIn(water), Create(surface), FadeIn(stone), FadeIn(floats), run_time=0.6)
        self.finish()
