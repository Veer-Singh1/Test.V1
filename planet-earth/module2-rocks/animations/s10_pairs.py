import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from geo import *  # noqa: E402,F403


class S10Pairs(Shot):
    """The five metamorphic changes, with two memory tricks."""

    def construct(self):
        head = T("The big five", 46, MET, BOLD).move_to([0, 3.35, 0])
        data = [("shale", "Shale", SED, "slate", "Slate"), ("limestone", "Limestone", SED, "marble", "Marble"),
                ("sandstone", "Sandstone", SED, "quartzite", "Quartzite"), ("granite", "Granite", IGN, "gneiss", "Gneiss"),
                ("coal", "Coal", SED, "graphite", "Graphite")]
        rows = []
        for k, (a, an, ac, b, bn) in enumerate(data):
            y = 2.25 - 0.95 * k
            sa = swatch(a, 1.45, 0.66, seed=30 + k).move_to([-6.3, y, 0])
            ta = T(an, 32, ac, BOLD).next_to(sa, RIGHT, buff=0.3)
            arrow = Arrow([-2.8, y, 0], [-1.75, y, 0], buff=0, color=INK, stroke_width=6)
            sb = swatch(b, 1.45, 0.66, seed=40 + k).move_to([-0.85, y, 0])
            tb = T(bn, 32, MET, BOLD).next_to(sb, RIGHT, buff=0.3)
            rows.append(VGroup(sa, ta, arrow, sb, tb))
        self.at(0, -0.2)
        self.play(FadeIn(head, shift=DOWN * 0.2), run_time=0.5)
        for k in range(5):
            self.at(1 + k)
            self.sfx("click")
            self.play(FadeIn(rows[k][:2], shift=RIGHT * 0.1), GrowArrow(rows[k][2]), run_time=0.4)
            self.play(FadeIn(rows[k][3:], shift=RIGHT * 0.1), run_time=0.35)
        tip1 = VGroup(T("Memory trick", 24, MUTED, BOLD), M("<b>S</b>hale → <b>S</b>late:", 28, INK, MEDIUM), T("same first letter", 28, INK))
        tip2 = VGroup(T("Memory trick", 24, MUTED, BOLD), T("Sand is mostly", 28, INK), M("<b>quartz</b> → quartzite", 28, INK, MEDIUM))
        for t, y in ((tip1, 1.95), (tip2, 0.0)):
            t.arrange(DOWN, aligned_edge=LEFT, buff=0.12)
            box = SurroundingRectangle(t, color=AMBER, buff=0.25, corner_radius=0.15, stroke_width=3).set_fill(PANEL, 1)
            t.add_to_back(box)
            t.move_to([0, y, 0]).align_to([2.85, 0, 0], LEFT)
        self.at(6)
        self.play(FadeIn(tip1, shift=LEFT * 0.15), Circumscribe(rows[0], color=AMBER, buff=0.08), run_time=0.8)
        self.at(6, 0.48)
        self.play(FadeIn(tip2, shift=LEFT * 0.15), Circumscribe(rows[2], color=AMBER, buff=0.08), run_time=0.8)
        self.finish()
