import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import *  # noqa: E402,F403


def bang(color=CORAL):
    c = Circle(radius=0.22, fill_color=color, fill_opacity=1, stroke_width=0)
    return VGroup(c, T("!", 28, NAVY, BOLD).move_to(c))


class S09Power(Shot):
    """P = V x I, and the 9 V x 3 A = 27 W example."""

    def construct(self):
        tag = pill("BONUS", GREEN, 28).move_to([-5.7, 3.3, 0])
        head = T("Power", 64, INK, BOLD).move_to([0, 2.5, 0])
        sub = T("how fast energy is delivered", 36, MUTED).next_to(head, DOWN, buff=0.25)
        eq = M(f"P = {cv()} × {ci()}", 124, INK, BOLD).move_to([0, -0.2, 0])
        unit = T("measured in watts (W)", 34, MUTED).next_to(eq, DOWN, buff=0.35)
        self.at(0, -0.25)
        self.play(FadeIn(tag, shift=RIGHT * 0.15), FadeIn(head, shift=DOWN * 0.2), run_time=0.5)
        self.at(0, 0.18)
        self.play(FadeIn(sub, shift=UP * 0.12), run_time=0.45)
        self.at(0, 0.55)
        self.sfx("click")
        self.play(FadeIn(eq, scale=0.9), run_time=0.5)
        self.at(0, 0.76)
        self.play(FadeIn(unit), run_time=0.4)

        calc = M(f"{cv('9 V')} × {ci('3 A')}", 88, INK, BOLD)
        res = M("= 27 W", 88, INK, BOLD)
        row = VGroup(calc, res).arrange(RIGHT, buff=0.35).move_to([0, -0.85, 0])
        self.at(1)
        self.play(FadeOut(sub), FadeOut(unit), eq.animate.scale(0.6).move_to([0, 1.05, 0]), run_time=0.6)
        self.play(FadeIn(calc, shift=UP * 0.15), run_time=0.45)
        self.at(1, 0.48)
        self.sfx("ding", -2)
        self.play(FadeIn(res, shift=LEFT * 0.15), run_time=0.4)
        self.play(Create(boxed(res)), run_time=0.4)
        self.finish()


class S09Safety(Shot):
    """Safety card: current harms, voltage drives it; 0.1 A can be fatal; three rules."""

    def construct(self):
        frame = card(12.6, 5.3, CORAL, PANEL, stroke=4).move_to([0, 0.55, 0])
        title = VGroup(warning_icon(0.62, CORAL), T("SAFETY", 46, CORAL, BOLD)).arrange(RIGHT, buff=0.3)
        title.move_to(frame.get_top() + DOWN * 0.62)
        self.play(FadeIn(frame), FadeIn(title, shift=DOWN * 0.15), run_time=0.5)
        p1 = pill("Current through your body → harm", CYAN, 34).move_to([0, 1.3, 0])
        p2 = pill("Voltage → drives that current", AMBER, 34).move_to([0, 0.15, 0])
        self.at(0, 0.08)
        self.play(FadeIn(p1, shift=UP * 0.15), run_time=0.45)
        self.at(0, 0.62)
        self.play(FadeIn(p2, shift=UP * 0.15), run_time=0.45)

        big = T("0.1 A", 156, CORAL, BOLD).move_to([0, 1.05, 0])
        line = T("across the chest can be fatal", 42, INK, SEMIBOLD).next_to(big, DOWN, buff=0.3)
        self.at(1)
        self.play(FadeOut(p1), FadeOut(p2), run_time=0.35)
        self.sfx("pop")
        self.play(FadeIn(big, scale=0.8), run_time=0.45)
        self.play(FadeIn(line, shift=UP * 0.12), run_time=0.4)

        rows = [T("Never poke anything into sockets", 38, INK, SEMIBOLD),
                T("Keep water away from electricity", 38, INK, SEMIBOLD),
                VGroup(T("Stay clear of fallen power lines;", 38, INK, SEMIBOLD),
                       T("call emergency services", 38, INK, SEMIBOLD)).arrange(DOWN, aligned_edge=LEFT, buff=0.12)]
        items = []
        for k, (r, y) in enumerate(zip(rows, (1.45, 0.35, -0.85))):
            b = bang().move_to([-5.3, y + (0.25 if k == 2 else 0), 0])
            r.next_to(b, RIGHT, buff=0.35)
            if k == 2:
                r.align_to(b, UP).shift(UP * 0.08)
            items.append(VGroup(b, r))
        self.at(2)
        self.play(FadeOut(big), FadeOut(line), run_time=0.35)
        for k, it in enumerate(items):
            self.at(2, (0.0, 0.3, 0.6)[k])
            self.sfx("tick", -3)
            self.play(FadeIn(it, shift=RIGHT * 0.2), run_time=0.45)
        self.finish()
