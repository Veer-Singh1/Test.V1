import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mine import *  # noqa: E402,F403


class S04Map(Shot):
    """Schematic map of South Africa with a marker for each mineral as it is named."""

    def construct(self):
        m = SAMap(centre=(-3.2, 0.45), k=0.4)
        shapes = m.shapes()
        head = T("South Africa's mineral wealth", 34, ORE, BOLD).move_to([3.6, 3.42, 0])
        note = T("map not to scale", 20, MUTED)
        note.move_to(shapes.get_corner(DR) + [-note.width / 2 - 0.1, note.height / 2 + 0.1, 0])  # in the sea, clear of subtitles
        self.at(0, -0.3)
        self.play(DrawBorderThenFill(shapes[0]), FadeIn(shapes[1]), FadeIn(head), FadeIn(note), run_time=1.4)
        minerals = [  # (segment, fraction, name, place, colour, [(lon, lat), ...])
            (1, 0.0, "Gold", "Witwatersrand basin", GOLD, [(27.3, -26.6), (26.8, -27.9)]),
            (2, 0.0, "Platinum & chrome", "Bushveld Igneous Complex", "#E2E8F0", [(28.4, -24.9)]),
            (3, 0.0, "Iron ore", "Sishen (Northern Cape)", "#C2410C", [(22.98, -27.78)]),
            (3, 0.42, "Manganese", "Kalahari field (Northern Cape)", "#A78BFA", [(22.95, -27.05)]),
            (4, 0.0, "Coal", "Mpumalanga & Limpopo", "#9CA3AF", [(29.2, -25.9), (27.7, -23.7)]),
            (4, 0.42, "Diamonds", "Kimberley & the coast", "#67E8F9", [(24.77, -28.74), (17.1, -29.6)]),
            (4, 0.8, "Copper", "Phalaborwa", "#FB923C", [(31.14, -23.94)]),
        ]
        rows = VGroup()
        for k, (_, _, name, place, colr, _) in enumerate(minerals):
            dot = Dot(radius=0.13, color=colr).set_stroke(WHITE, 2)
            txt = VGroup(T(name, 24, colr, BOLD), T(place, 20, INK)).arrange(DOWN, aligned_edge=LEFT, buff=0.03)
            rows.add(VGroup(dot, txt).arrange(RIGHT, buff=0.25, aligned_edge=UP))
        rows.arrange(DOWN, aligned_edge=LEFT, buff=0.12).move_to([0, 0.75, 0]).align_to([2.0, 0, 0], LEFT)
        for (seg, frac, name, place, colr, pts), row in zip(minerals, rows):
            marks = VGroup(*[VGroup(Dot(m.p(*q), 0.13, color=colr).set_stroke(WHITE, 2),
                                    Circle(radius=0.22, color=colr, stroke_width=3).move_to(m.p(*q))) for q in pts])
            self.at(seg, frac)
            self.sfx("pop", -4)
            self.play(LaggedStart(*[GrowFromCenter(mk) for mk in marks], lag_ratio=0.3), FadeIn(row, shift=LEFT * 0.15),
                      run_time=0.6)
            self.play(*[mk[1].animate.scale(1.6).set_stroke(opacity=0) for mk in marks], run_time=0.5)
        gains = pill("Jobs · foreign income · raw materials", GOOD, 24).move_to([0, -1.95, 0]).align_to([6.8, 0, 0], RIGHT)
        self.at(5)
        self.play(FadeIn(gains, shift=UP * 0.12), run_time=0.5)
        self.finish()
