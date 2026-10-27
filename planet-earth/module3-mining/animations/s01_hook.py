import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mine import *  # noqa: E402,F403


class S01Scale(Shot):
    """'And from one tonne of gold ore, you get only about five grams of gold.'"""

    def construct(self):
        pile = ore_pile(60, 4.6, 2.2, seed=4).move_to([-3.2, 0.6, 0])
        pl = T("1 tonne of gold ore", 36, INK, BOLD).next_to(pile, DOWN, buff=0.3)
        pl2 = T("1 000 000 g", 28, MUTED).next_to(pl, DOWN, buff=0.12)
        arrow = Arrow([0.0, 0.6, 0], [1.6, 0.6, 0], buff=0, color=INK, stroke_width=7)
        gold = nugget(0.32).move_to([3.6, 0.6, 0])
        gl = T("≈ 5 g of gold", 40, GOLD, BOLD).next_to(gold, DOWN, buff=0.45)
        self.play(FadeIn(pile, lag_ratio=0.02), run_time=0.7)
        self.play(FadeIn(pl, shift=UP * 0.1), FadeIn(pl2), run_time=0.4)
        self.at(0, 0.55)
        self.sfx("ding", -4)
        self.play(GrowArrow(arrow), FadeIn(gold, scale=0.4), run_time=0.5)
        self.play(FadeIn(gl, shift=UP * 0.1), run_time=0.35)
        self.finish()
