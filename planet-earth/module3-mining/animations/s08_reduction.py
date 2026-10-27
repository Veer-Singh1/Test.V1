import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mine import *  # noqa: E402,F403

PB, O, C = "#94A3B8", CORAL, "#374151"


class S08Reduction(Shot):
    """Reduction vs oxidation; carbon as the reducing agent; PbO + C -> Pb + CO."""

    def construct(self):
        head = VGroup(T("Refining, stage 2:", 44, PROC, BOLD), T("reduction", 44, INK, BOLD)).arrange(RIGHT, buff=0.3)
        head.move_to(UP * 3.35)
        self.at(0, -0.2)
        self.play(FadeIn(head, shift=DOWN * 0.2), run_time=0.5)

        pb = atom("Pb", PB, 0.45)
        ox = atom("O", O, 0.32).next_to(pb, RIGHT, buff=0.0)
        oxide = VGroup(pb, ox).move_to([-1.6, 0.85, 0])
        olbl = T("metal oxide", 28, INK).next_to(oxide, DOWN, buff=0.25)
        self.at(1, 0.1)
        self.play(FadeIn(oxide, scale=0.6), FadeIn(olbl), run_time=0.6)

        red = pill("Reduction: loses oxygen", PROC, 30).move_to([-3.4, 2.45, 0])
        oxi = pill("Oxidation: gains oxygen", CORAL, 30).move_to([3.4, 2.45, 0])
        self.at(2)
        self.play(FadeIn(red, shift=DOWN * 0.1), run_time=0.45)
        self.at(2, 0.55)
        self.play(FadeIn(oxi, shift=DOWN * 0.1), run_time=0.45)

        carbon = atom("C", C, 0.38, WHITE).move_to([2.6, 0.85, 0])
        clbl = VGroup(T("reducing agent: carbon", 26, INK), T("(coke or charcoal)", 24, MUTED)).arrange(DOWN, buff=0.05)
        clbl.next_to(carbon, DOWN, buff=0.25)
        self.at(3)
        self.play(FadeIn(carbon, scale=0.6), FadeIn(clbl), run_time=0.6)

        heat = glow(MAGMA, 2.4, 8, 0.45).stretch(0.6, 1).move_to([0.5, 0.85, 0])
        hot = T("high temperature", 26, MAGMA).move_to([0.5, -0.35, 0])
        self.at(4)
        self.play(FadeIn(heat), FadeIn(hot), FadeOut(olbl), FadeOut(clbl), run_time=0.6)
        self.play(carbon.animate.move_to([0.4, 0.85, 0]), run_time=1.0)
        self.at(4, 0.4)
        self.sfx("pop", -3)
        self.play(ox.animate.next_to(carbon, LEFT, buff=0.0), run_time=0.8)
        co = VGroup(ox, carbon)
        self.play(co.animate.shift(RIGHT * 2.6), pb.animate.shift(LEFT * 0.6), run_time=0.9)
        molten = glow(MAGMA, 0.9, 6, 0.8).move_to(pb)
        pure = T("pure molten metal", 26, WARM).next_to(pb, DOWN, buff=0.3)
        gas = T("carbon monoxide", 26, INK).next_to(co, DOWN, buff=0.3)
        self.play(FadeOut(hot), FadeIn(molten), FadeIn(pure), FadeIn(gas), run_time=0.6)

        eq = M(f"{col('PbO', PROC)} + {col('C', CORAL)} → Pb + CO", 70, INK, BOLD).move_to([0, -1.0, 0])
        words = T("lead(II) oxide + carbon → lead + carbon monoxide", 26, MUTED).next_to(eq, DOWN, buff=0.15)
        self.at(5)
        self.play(FadeOut(VGroup(heat, molten, pure, gas, pb, co)), run_time=0.4)
        self.sfx("click")
        self.play(FadeIn(eq, shift=UP * 0.15), FadeIn(words), run_time=0.6)
        self.play(eq.animate.shift(UP * 0.9), words.animate.shift(UP * 0.9), run_time=0.5)
        left_part = eq[:3]
        c_part = eq[4:5]
        b1 = Brace(left_part, UP, color=PROC, buff=0.1)
        t1 = T("reduced (loses O)", 28, PROC, SEMIBOLD).next_to(b1, UP, buff=0.1)
        self.at(6)
        self.play(GrowFromCenter(b1), FadeIn(t1), run_time=0.5)
        b2 = Brace(c_part, UP, color=CORAL, buff=0.1)
        t2 = T("oxidised (gains O)", 28, CORAL, SEMIBOLD).next_to(b2, UP, buff=0.1)
        if t2.get_left()[0] < t1.get_right()[0] + 0.2:
            t2.shift(RIGHT * (t1.get_right()[0] + 0.25 - t2.get_left()[0]))
            t2.shift(UP * 0.0)
        self.at(7)
        self.play(GrowFromCenter(b2), FadeIn(t2), run_time=0.5)
        self.finish()
