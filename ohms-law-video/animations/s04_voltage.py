import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import *  # noqa: E402,F403


def lines(*rows, size=26, color=INK, buff=0.1):
    return VGroup(*[T(r, size, color) for r in rows]).arrange(DOWN, buff=buff)


class S04Voltage(Shot):
    """Voltage as the charge pump; energy per charge; 1 V = 1 J/C; potential difference."""

    def construct(self):
        # --- seg 0: the circuit, then "Voltage"
        loop = Loop(w=6.6, h=3.4).move_to(UP * 0.35)
        loop.load.set_on()
        flow = loop.flow(n=28, speed=0.05)
        bglow = glow(AMBER, 1.0, 8, 0.55).move_to(loop.battery[1].get_center())
        head = T("Voltage", 56, AMBER, BOLD).move_to(UP * 3.25)
        self.play(FadeIn(loop), FadeIn(flow), run_time=0.6)
        self.at(0, 0.3)
        self.play(FadeIn(bglow), Indicate(loop.battery, color=AMBER, scale_factor=1.2), run_time=0.9)
        self.at(0, 0.7)
        self.play(FadeIn(head, shift=DOWN * 0.2), run_time=0.5)

        # --- seg 1: the battery as a charge pump on an energy diagram
        circuit = VGroup(loop, flow, bglow)
        x0, x1, y0, y1 = 0.9, 5.7, -1.45, 1.9
        track = Polygon([x0, y0, 0], [x0, y1, 0], [x1, y1, 0], [x1, y0, 0]).round_corners(0.3)
        track.set_stroke(opacity=0)
        rail = track.copy().set_stroke(WIRE, 5, opacity=1)
        lift = RoundedRectangle(corner_radius=0.18, width=0.75, height=y1 - y0 - 0.7, fill_color=AMBER,
                                fill_opacity=0.16, stroke_color=AMBER, stroke_width=3).move_to([x0, (y0 + y1) / 2, 0])
        bulb = Bulb(0.36).rotate(PI / 2).move_to([x1, 0.2, 0]).set_on()
        charges = Flow(track, n=16, speed=0.085)
        axis = Arrow([6.3, y0, 0], [6.3, y1 + 0.3, 0], buff=0, color=MUTED, stroke_width=4,
                     max_tip_length_to_length_ratio=0.08)
        axis_lbl = T("energy per charge", 24, MUTED).rotate(PI / 2).next_to(axis, RIGHT, buff=0.12)
        plus = lines("battery lifts", "the charge", color=AMBER).move_to([x0 + 1.55, 0.45, 0])
        minus = lines("bulb turns it into", "light and heat", color=WARM).move_to([x1 - 2.0, -0.6, 0])
        diagram = VGroup(rail, lift, bulb, charges, axis, axis_lbl, plus, minus, track)
        self.at(1)
        self.play(circuit.animate.scale(0.6).move_to([-4.15, 0.25, 0]), run_time=0.8)
        self.play(Create(rail), FadeIn(lift), FadeIn(bulb), GrowArrow(axis), FadeIn(axis_lbl), run_time=0.9)
        self.add(track)
        self.play(FadeIn(charges), run_time=0.4)
        self.at(1, 0.5)
        self.play(FadeIn(plus, shift=RIGHT * 0.2), run_time=0.5)
        self.at(1, 0.78)
        self.play(FadeIn(minus, shift=LEFT * 0.2), run_time=0.5)

        # --- seg 2: Voltage = energy per charge, V = E / Q
        head2 = M(f"{col('Voltage', AMBER)} = energy per charge", 48, INK, BOLD).move_to(UP * 3.25)
        eq = M(f"{cv()} = E / Q", 96, INK, BOLD).move_to([2.9, 1.0, 0])
        eq_lbl = VGroup(T("E: energy", 30, MUTED), T("Q: charge", 30, MUTED)).arrange(RIGHT, buff=0.8)
        eq_lbl.next_to(eq, DOWN, buff=0.45)
        self.at(2)
        self.play(FadeOut(diagram), ReplacementTransform(head, head2), run_time=0.6)
        self.sfx("click")
        self.play(FadeIn(eq, scale=0.9), run_time=0.5)
        self.play(FadeIn(eq_lbl, shift=UP * 0.15), run_time=0.4)

        # --- seg 3: 1 V = 1 J / C, and how big a coulomb is
        eq2 = M(f"{cv('1 V')} = 1 J / C", 96, INK, BOLD).move_to(eq)
        eq2_lbl = VGroup(T("J: joule (energy)", 30, MUTED), T("C: coulomb (charge)", 30, MUTED)).arrange(RIGHT, buff=0.6)
        eq2_lbl.next_to(eq2, DOWN, buff=0.45)
        coul = pill("1 C = charge of ≈ 6.24 × 10¹⁸ electrons", CYAN, 30).move_to([2.9, -1.55, 0])
        self.at(3)
        self.sfx("click")
        self.play(ReplacementTransform(eq, eq2), ReplacementTransform(eq_lbl, eq2_lbl), run_time=0.7)
        self.at(3, 0.5)
        self.play(FadeIn(coul, shift=UP * 0.15), run_time=0.5)

        # --- seg 4: a difference between two points
        self.at(4)
        self.play(FadeOut(eq2), FadeOut(eq2_lbl), FadeOut(coul), run_time=0.5)
        self.play(circuit.animate.scale(1 / 0.6).move_to(UP * 0.35), run_time=0.8)
        top = loop.load.get_center()
        a_pt, b_pt = top + LEFT * 1.35, top + RIGHT * 1.35
        dots = VGroup(Dot(a_pt, 0.11, color=AMBER), Dot(b_pt, 0.11, color=AMBER))
        names = VGroup(T("A", 34, AMBER, BOLD).next_to(a_pt, UP, buff=0.18), T("B", 34, AMBER, BOLD).next_to(b_pt, UP, buff=0.18))
        brace = Brace(Line(a_pt, b_pt), DOWN, color=AMBER, buff=0.62)
        dv = T("ΔV", 40, AMBER, BOLD).next_to(brace, DOWN, buff=0.15)
        head3 = pill("Potential difference", AMBER, 40).move_to(UP * 3.25)
        self.at(4, 0.22)
        self.play(FadeIn(dots, scale=0.5), FadeIn(names), run_time=0.5)
        self.play(GrowFromCenter(brace), FadeIn(dv), run_time=0.6)
        self.at(4, 0.6)
        self.play(FadeOut(head2, shift=UP * 0.15), FadeIn(head3, shift=UP * 0.15), run_time=0.6)
        self.finish()
