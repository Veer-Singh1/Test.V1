import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mine import *  # noqa: E402,F403


class S05Uses(Shot):
    """A card per mineral, each appearing as it is named in the one long sentence."""

    def construct(self):
        head = T("Where the minerals end up", 44, ORE, BOLD).move_to(UP * 3.35)
        data = [("gold in", "Gold", GOLD, ["jewellery, electronics,", "medicine"]),
                ("platinum in", "Platinum", "#E2E8F0", ["catalytic converters", "(clean car exhaust)"]),
                ("chrome in", "Chrome", "#94A3B8", ["stainless steel"]),
                ("manganese to", "Manganese", "#A78BFA", ["makes steel stronger"]),
                ("iron in", "Iron", "#C2410C", ["steel"]),
                ("coal in", "Coal", "#9CA3AF", ["power stations"]),
                ("diamonds in", "Diamonds", "#67E8F9", ["cutting and", "drilling tools"]),
                ("copper in", "Copper", "#FB923C", ["electrical wiring"])]
        text = self.segs[0]["text"]
        cards = []
        for k, (key, name, colr, uses) in enumerate(data):
            x, y = (-5.1 + 3.4 * (k % 4), 1.5 if k < 4 else -0.85)
            c = card(3.15, 2.15, colr, stroke=3).move_to([x, y, 0])
            disc = Circle(radius=0.22, fill_color=colr, fill_opacity=1, stroke_color=WHITE, stroke_width=2)
            title = VGroup(disc, T(name, 30, colr, BOLD)).arrange(RIGHT, buff=0.2).move_to(c.get_top() + DOWN * 0.45)
            body = VGroup(*[T(u, 22, INK) for u in uses]).arrange(DOWN, buff=0.08).next_to(title, DOWN, buff=0.3)
            cards.append((text.index(key) / len(text), VGroup(c, title, body)))
        self.at(0, -0.25)
        self.play(FadeIn(head, shift=DOWN * 0.2), run_time=0.5)
        for frac, g in cards:
            self.at(0, max(0.0, frac - 0.02))
            self.sfx("pop", -5)
            self.play(FadeIn(g, shift=UP * 0.15), run_time=0.45)
        self.finish()
