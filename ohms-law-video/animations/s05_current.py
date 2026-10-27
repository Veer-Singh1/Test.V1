import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import *  # noqa: E402,F403


def check_icon(color=GREEN, s=0.28):
    return VMobject(stroke_color=color, stroke_width=7).set_points_as_corners(
        [LEFT * s + UP * 0.05, LEFT * s * 0.25 + DOWN * s * 0.7, RIGHT * s + UP * s * 0.75])


class S05Current(Shot):
    """Current as charge per second; 1 A = 1 C/s; conventional current vs electron flow."""

    def construct(self):
        # --- seg 0: charges passing a point
        head = T("Current", 56, CYAN, BOLD).move_to(UP * 3.25)
        yc = 1.7
        tube = VGroup(Line([-7.6, yc + 0.45, 0], [7.6, yc + 0.45, 0]), Line([-7.6, yc - 0.45, 0], [7.6, yc - 0.45, 0]))
        tube.set_stroke(WIRE, 5)
        lanes = []
        for k, dy in enumerate((-0.22, 0.0, 0.22)):
            f = Flow(Line([-7.8, yc + dy, 0], [7.8, yc + dy, 0]), n=13, speed=0.034, r=0.06)
            f.phase = 0.023 * k
            f._place()
            lanes.append(f)
        gate = DashedLine([0, yc - 0.7, 0], [0, yc + 0.7, 0], color=AMBER, stroke_width=5, dash_length=0.12)
        gate_lbl = T("counting point", 24, AMBER).next_to(gate, DOWN, buff=0.12)
        count, prev = [0], {}
        counter = T("Charges counted: 0", 32, INK).move_to([0, 0.15, 0])

        def tally(m):
            c = count[0]
            for f in lanes:
                for d in f:
                    x = d.get_x()
                    if prev.get(id(d), x) < 0 <= x:
                        c += 1
                    prev[id(d)] = x
            if c != count[0]:
                count[0] = c
                m.become(T(f"Charges counted: {c}", 32, INK).move_to([0, 0.15, 0]))

        self.play(FadeIn(head, shift=DOWN * 0.2), Create(tube), run_time=0.7)
        self.play(*[FadeIn(f) for f in lanes], Create(gate), FadeIn(gate_lbl), run_time=0.6)
        counter.add_updater(tally)
        self.add(counter)
        per_sec = pill("Current = charge per second", CYAN, 32).move_to([0, -0.85, 0])
        self.at(0, 0.5)
        self.play(FadeIn(per_sec, shift=UP * 0.15), run_time=0.5)

        # --- seg 1: I = Q / t, 1 A = 1 C/s
        eq = M(f"{ci()} = Q / t", 72, INK, BOLD).move_to([0, -1.75, 0])
        amp = M(f"1 ampere ({ci('A')}) = 1 C/s", 56, INK, BOLD).move_to([0, -1.75, 0])
        self.at(0, 0.72)
        self.sfx("click")
        self.play(per_sec.animate.shift(UP * 0.2), FadeIn(eq, shift=UP * 0.15), run_time=0.5)
        self.at(1, 0.38)
        self.sfx("click")
        self.play(ReplacementTransform(eq, amp), run_time=0.6)

        # --- seg 2: conventional current, + to -
        loop = Loop(w=7.2, h=3.2).move_to(UP * 0.5)
        loop.load.set_on()
        arrows = loop.arrows(n=12, speed=0.045)
        conv = pill("Conventional current: + → −", CYAN, 30).move_to([-3.45, 3.25, 0])
        self.at(2)
        counter.clear_updaters()
        self.play(*[FadeOut(m) for m in (head, tube, gate, gate_lbl, counter, per_sec, amp, *lanes)], run_time=0.6)
        self.play(FadeIn(loop), run_time=0.6)
        self.at(2, 0.3)
        self.play(FadeIn(arrows), run_time=0.6)
        self.at(2, 0.78)
        self.play(FadeIn(conv, shift=DOWN * 0.15), run_time=0.5)

        # --- seg 3: electrons drift the other way
        electrons = loop.flow(n=26, speed=0.022, r=0.05)
        elec = pill("Electron flow: − → +", INK, 30).move_to([3.45, 3.25, 0])
        self.at(3, 0.15)
        self.play(FadeIn(electrons), arrows.animate.set_stroke(opacity=0.35), run_time=0.7)
        self.at(3, 0.45)
        self.play(FadeIn(elec, shift=DOWN * 0.15), run_time=0.5)

        # --- seg 4: same answers
        same = VGroup(check_icon(), T("Same answers", 34, GREEN, SEMIBOLD)).arrange(RIGHT, buff=0.25)
        box = SurroundingRectangle(same, color=GREEN, buff=0.22, corner_radius=0.18, stroke_width=3)
        box.set_fill(PANEL, 0.94)
        same_grp = VGroup(box, same).move_to([0, -1.75, 0])
        self.at(4)
        self.play(arrows.animate.set_stroke(opacity=1), FadeIn(same_grp, shift=UP * 0.15), run_time=0.6)
        self.finish()


class S05Signal(Shot):
    """The light comes on almost instantly: the wire is full of electrons and the push races along."""

    def construct(self):
        loop = Loop(w=12.6, h=3.0, switch=True).move_to(UP * 0.4)
        c = loop.path.get_center()
        loop.load.move_to(c + [4.6, 1.5, 0])
        loop.switch.move_to(c + [-4.2, -1.5, 0])
        loop.switch.lever.rotate(32 * DEGREES, about_point=loop.switch.lever.get_start())
        flow = loop.flow(n=64, speed=0.0, r=0.05)
        self.play(FadeIn(loop), FadeIn(flow), run_time=0.5)

        path = loop.path
        a_sw = proportion_of(path, loop.switch.get_center())
        a_bulb = proportion_of(path, loop.load.get_center())
        if a_bulb < a_sw:
            a_bulb += 1

        def pulse(a0, a1, rt):
            head = VGroup(*[glow(CYAN, 0.42 - 0.05 * k, 6, 0.9 - 0.12 * k) for k in range(6)])
            tracker = ValueTracker(a0)

            def follow(m):
                a = tracker.get_value()
                for k, g in enumerate(m):
                    g.move_to(path.point_from_proportion((a - 0.006 * k) % 1))
            head.add_updater(follow)
            follow(head)
            self.add(head)
            self.play(tracker.animate.set_value(a1), run_time=rt, rate_func=linear)
            head.clear_updaters()
            self.play(FadeOut(head), run_time=0.2)

        self.at(0, 0.03)
        self.sfx("click")
        self.play(loop.switch.close(), run_time=0.25)
        self.sfx("whoosh", -8)
        pulse(a_sw, a_bulb, 0.45)
        self.play(loop.load.on(0.3), flow.speed.animate.set_value(0.003), run_time=0.3)

        full = pill("Wire: already full of electrons", CYAN, 28).move_to([-3.6, 3.25, 0])
        self.at(0, 0.3)
        self.play(FadeIn(full, shift=DOWN * 0.15), run_time=0.5)
        self.play(LaggedStart(*[Indicate(d, scale_factor=1.7, color=WHITE) for d in flow], lag_ratio=0.03),
                  run_time=1.6)

        sig = pill("Signal: > ½ the speed of light", CYAN, 28).move_to([3.65, 3.25, 0])
        self.at(0, 0.6)
        self.sfx("whoosh", -10)
        pulse(a_sw, a_sw + 1, 0.5)
        self.play(FadeIn(sig, shift=DOWN * 0.15), run_time=0.45)
        pulse(a_sw, a_sw + 1, 0.5)
        self.finish()
