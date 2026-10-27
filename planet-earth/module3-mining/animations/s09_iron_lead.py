import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mine import *  # noqa: E402,F403


class S09IronLead(Shot):
    """The blast furnace for iron, then the lead flow from galena."""

    def construct(self):
        head = T("Iron: the blast furnace", 42, ORE, BOLD).move_to([-3.6, 3.4, 0])
        fc = np.array([-3.9, 0.35, 0])
        shell = Polygon(fc + [-1.0, 2.35, 0], fc + [1.0, 2.35, 0], fc + [1.5, -0.4, 0], fc + [1.2, -2.2, 0],
                        fc + [-1.2, -2.2, 0], fc + [-1.5, -0.4, 0], fill_color="#1C1917", fill_opacity=1,
                        stroke_color="#A8A29E", stroke_width=6)
        iron = Polygon(fc + [-1.22, -1.75, 0], fc + [1.22, -1.75, 0], fc + [1.2, -2.2, 0], fc + [-1.2, -2.2, 0],
                       fill_color=MAGMA, fill_opacity=1, stroke_width=0)
        slag = Polygon(fc + [-1.3, -1.35, 0], fc + [1.3, -1.35, 0], fc + [1.22, -1.75, 0], fc + [-1.22, -1.75, 0],
                       fill_color="#84CC16", fill_opacity=0.65, stroke_width=0)
        rng = np.random.default_rng(2)
        charge = VGroup(*[Dot(fc + [rng.uniform(-0.9, 0.9), rng.uniform(-1.2, 2.2), 0], 0.08,
                              color=rng.choice(["#C2410C", "#1F2937", "#E7E5E4"])) for _ in range(60)])

        def sink(m, dt):
            for d in m:
                d.shift(DOWN * 0.35 * dt)
                if d.get_y() < fc[1] - 1.25:
                    d.set_y(fc[1] + 2.2)

        self.at(0, -0.25)
        self.play(FadeIn(head), DrawBorderThenFill(shell), run_time=0.9)
        notes = VGroup(T("In at the top: iron ore + coke + limestone", 28, INK),
                       T("Hot air blown in at the bottom", 28, WATER),
                       M(f"Carbon burns → {col('carbon monoxide', PROC)}", 28, INK, MEDIUM),
                       M(f"CO {col('reduces', PROC)} iron oxide → molten iron", 28, INK, MEDIUM),
                       M(f"Limestone removes sandy impurities → {col('slag', '#A3E635')}", 28, INK, MEDIUM),
                       T("Slag floats on the iron and is drained off", 28, INK))
        notes.arrange(DOWN, aligned_edge=LEFT, buff=0.32).move_to([0, 0.6, 0]).align_to([-1.35, 0, 0], LEFT)
        for n in notes:
            if n.get_right()[0] > 6.9:
                n.scale_to_fit_width(6.9 - n.get_left()[0])
        drops = VGroup(*[Arrow(fc + [x, 3.05, 0], fc + [x, 2.45, 0], buff=0, color=INK, stroke_width=5) for x in (-0.5, 0, 0.5)])
        air = VGroup(Arrow(fc + [-2.6, -1.1, 0], fc + [-1.45, -1.1, 0], buff=0, color=WATER, stroke_width=6),
                     Arrow(fc + [2.6, -1.1, 0], fc + [1.45, -1.1, 0], buff=0, color=WATER, stroke_width=6))
        self.at(1)
        self.play(FadeIn(charge), GrowArrow(drops[0]), GrowArrow(drops[1]), GrowArrow(drops[2]), FadeIn(notes[0]), run_time=0.7)
        charge.add_updater(sink)
        self.at(1, 0.55)
        self.play(*[GrowArrow(a) for a in air], FadeIn(notes[1]), run_time=0.6)
        co = glow(PROC, 1.0, 6, 0.5).move_to(fc + [0, -0.6, 0])
        self.at(2)
        self.play(FadeIn(co), FadeIn(notes[2]), run_time=0.5)
        self.at(2, 0.45)
        self.play(GrowFromEdge(iron, DOWN), FadeIn(notes[3]), run_time=0.8)
        tap_iron = Arrow(fc + [1.15, -1.98, 0], fc + [2.4, -1.98, 0], buff=0, color=MAGMA, stroke_width=6)
        tap_slag = Arrow(fc + [1.25, -1.55, 0], fc + [2.4, -1.4, 0], buff=0, color="#A3E635", stroke_width=6)
        self.at(3)
        self.play(GrowFromEdge(slag, DOWN), FadeIn(notes[4]), run_time=0.7)
        self.at(3, 0.5)
        self.play(GrowArrow(tap_iron), GrowArrow(tap_slag), FadeIn(notes[5]), run_time=0.6)

        # --- lead
        lead_head = T("Lead: from galena", 42, ORE, BOLD).move_to([2.6, 3.4, 0])
        boxes, arrows = flow_column(["Galena (lead sulphide, PbS)", "Crush, roast in air",
                                     "Lead oxide (PbO) + sulphur dioxide gas", "Reduce with coke → molten lead (Pb)"],
                                    x=2.75, y_top=2.75, color=ORE, w=7.4, gap=0.32, size=26)
        self.at(4, -0.1)
        charge.clear_updaters()
        self.play(FadeOut(notes), FadeOut(co), VGroup(shell, iron, slag, charge, drops, air, tap_iron, tap_slag).animate.set_opacity(0.25),
                  ReplacementTransform(head, T("Iron: the blast furnace", 30, MUTED, BOLD).move_to([-3.9, 3.1, 0])),
                  FadeIn(lead_head), run_time=0.6)
        for k, frac in enumerate((0.0, 0.25, 0.55)):
            self.at(4, frac)
            anims = [FadeIn(boxes[k], shift=DOWN * 0.1)]
            if k:
                anims.append(GrowArrow(arrows[k - 1]))
            self.play(*anims, run_time=0.45)
        self.at(5)
        self.sfx("click")
        self.play(GrowArrow(arrows[2]), FadeIn(boxes[3], shift=DOWN * 0.1), run_time=0.5)
        self.finish()
