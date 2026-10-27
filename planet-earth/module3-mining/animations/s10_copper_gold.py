import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mine import *  # noqa: E402,F403


class S10CopperGold(Shot):
    """Copper and gold refining flows; 1 kg of gold needs 200 tonnes of ore."""

    def construct(self):
        ch = T("Copper", 42, "#FB923C", BOLD).move_to([-3.55, 3.4, 0])
        gh = T("Gold", 42, GOLD, BOLD).move_to([3.55, 3.4, 0])
        cb, ca = flow_column(["Crush, heat with oxygen", "Copper sulphide + iron oxide",
                              "Add silica: iron oxide → slag (removed)", "Heat in air → impure copper",
                              "Purify → pure copper"], x=-3.55, y_top=2.85, color="#FB923C", w=6.4, gap=0.27, size=25)
        gb, ga = flow_column(["Crush, wash, filter", "Cyanide solution dissolves the gold",
                              "Zinc brings the gold out of solution", "Pure gold: ≈ 5 g per tonne of ore"],
                             x=3.55, y_top=2.85, color=GOLD, w=6.4, gap=0.27, size=25)

        def reveal(boxes, arrows, k):
            anims = [FadeIn(boxes[k], shift=DOWN * 0.1)]
            if k:
                anims.append(GrowArrow(arrows[k - 1]))
            self.play(*anims, run_time=0.45)

        self.at(0, -0.2)
        self.play(FadeIn(ch), run_time=0.4)
        for k, (seg, frac) in enumerate([(0, 0.0), (0, 0.55), (1, 0.0), (2, 0.0), (2, 0.6)]):
            self.at(seg, frac)
            reveal(cb, ca, k)
        self.at(3)
        self.play(FadeIn(gh), run_time=0.4)
        for k, (seg, frac) in enumerate([(4, 0.0), (4, 0.4), (4, 0.75), (5, 0.0)]):
            self.at(seg, frac)
            reveal(gb, ga, k)

        calc = VGroup(T("1 kg = 1 000 g", 40, INK, BOLD), T("1 000 g ÷ 5 g per tonne", 40, INK, BOLD),
                      T("= 200 tonnes of ore", 46, GOLD, BOLD)).arrange(DOWN, aligned_edge=LEFT, buff=0.35)
        calc.move_to([-3.55, 0.6, 0])
        self.at(5, 0.15)
        self.play(FadeOut(VGroup(ch, *cb, *ca)), run_time=0.4)
        for k, frac in enumerate((0.2, 0.45, 0.72)):
            self.at(5, frac)
            self.sfx("ding" if k == 2 else "click", -3)
            self.play(FadeIn(calc[k], shift=UP * 0.12), run_time=0.4)
        self.play(Create(boxed(calc[2], GOLD)), run_time=0.4)
        self.finish()
