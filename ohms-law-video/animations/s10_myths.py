import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import *  # noqa: E402,F403


def statement(*rows, color=INK):
    return VGroup(*[T(r, 32, color, SEMIBOLD) for r in rows]).arrange(DOWN, buff=0.12)


class S10Myths(Shot):
    """Three myths: each card is stamped MYTH, then flips to the FACT."""

    def construct(self):
        head = T("3 myths, busted", 52, INK, BOLD).move_to(UP * 3.3)
        xs = (-4.55, 0.0, 4.55)
        cards = [card(4.25, 4.9, CORAL).move_to([x, 0.35, 0]) for x in xs]
        myths = [("Batteries store", "electrons"), ("A bulb uses up", "current"), ("Voltage flows",)]
        facts = [("Batteries store", "chemical energy"), ("Same current", "in and out"),
                 ("Voltage: across", "Current: through")]

        def stamp(word, color, c):
            return pill(word, color, 30).move_to(c.get_top() + DOWN * 0.6)

        def text(rows, c, color=INK):
            return statement(*rows, color=color).move_to(c.get_center() + UP * 0.6)

        # mini diagrams that appear with each fact
        c0, c1, c2 = (c.get_center() for c in cards)
        bat = battery(plate=0.8, labels=False).rotate(PI / 2).move_to(c0 + DOWN * 1.05)
        bat_lbl = T("chemical → electrical", 24, AMBER).next_to(bat, DOWN, buff=0.3)
        d0 = VGroup(bat, bat_lbl)
        wire = Line(c1 + DOWN * 1.05 + LEFT * 1.8, c1 + DOWN * 1.05 + RIGHT * 1.8, color=WIRE, stroke_width=5)
        bulb = Bulb(0.3).move_to(c1 + DOWN * 1.05).set_on(0.8)
        a_in = pill("0.5 A", CYAN, 22).move_to(c1 + DOWN * 1.55 + LEFT * 1.15)
        a_out = pill("0.5 A", CYAN, 22).move_to(c1 + DOWN * 1.55 + RIGHT * 1.15)
        d1 = VGroup(wire, bulb, a_in, a_out)
        res = resistor(1.4, CORAL, 0.2, 5, 5).move_to(c2 + DOWN * 1.2)
        rwire = Line(c2 + DOWN * 1.2 + LEFT * 1.8, c2 + DOWN * 1.2 + RIGHT * 1.8, color=WIRE, stroke_width=5)
        thru = Arrow(c2 + DOWN * 1.65 + LEFT * 1.3, c2 + DOWN * 1.65 + RIGHT * 1.3, color=CYAN, buff=0, stroke_width=5,
                     max_tip_length_to_length_ratio=0.12)
        across = Brace(res, UP, color=AMBER, buff=0.12)
        v_lbl = T("V", 28, AMBER, BOLD).next_to(across, UP, buff=0.06)
        d2 = VGroup(rwire, res, thru, across, v_lbl)
        diagrams = [d0, d1, d2]

        self.at(0, -0.2)
        self.play(FadeIn(head, shift=DOWN * 0.2), run_time=0.5)
        for k in range(3):
            c = cards[k]
            m_stamp, m_text = stamp("MYTH", CORAL, c), text(myths[k], c)
            self.at(1 + 2 * k)
            self.sfx("pop")
            self.play(FadeIn(c, shift=UP * 0.2), FadeIn(m_stamp, scale=1.3), FadeIn(m_text), run_time=0.55)
            f_stamp, f_text = stamp("FACT", CYAN, c), text(facts[k], c, INK)
            self.at(2 + 2 * k, 0.05)
            self.sfx("click")
            self.play(c.animate.set_stroke(CYAN), ReplacementTransform(m_stamp, f_stamp),
                      FadeOut(m_text, shift=UP * 0.2), FadeIn(f_text, shift=UP * 0.2), run_time=0.6)
            self.play(FadeIn(diagrams[k], shift=UP * 0.12), run_time=0.5)
        self.finish()
