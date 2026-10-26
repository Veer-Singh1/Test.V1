import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import *  # noqa: E402,F403


def check_icon(color=GREEN, s=0.3):
    return VMobject(stroke_color=color, stroke_width=8).set_points_as_corners(
        [LEFT * s + UP * 0.05, LEFT * s * 0.25 + DOWN * s * 0.7, RIGHT * s + UP * s * 0.75])


class S11Recap(Shot):
    """Three recap cards and V = IR."""

    def construct(self):
        head = T("Quick recap", 52, INK, BOLD).move_to(UP * 3.3)
        data = [("Voltage", AMBER, ["the push", "energy per charge", "volts (V)"]),
                ("Current", CYAN, ["the flow", "charge per second", "amps (A)"]),
                ("Resistance", CORAL, ["the opposition", "ohms (Ω)"])]
        groups = []
        for (name, color, rows), x in zip(data, (-4.55, 0.0, 4.55)):
            c = card(4.3, 3.2, color, stroke=3).move_to([x, 1.1, 0])
            title = T(name, 42, color, BOLD).move_to(c.get_top() + DOWN * 0.55)
            body = VGroup(*[T(r, 30, INK) for r in rows]).arrange(DOWN, buff=0.16).next_to(title, DOWN, buff=0.35)
            groups.append(VGroup(c, title, body))
        law = M(f"{cv()} = {ci()} × {cr()}", 92, INK, BOLD).move_to([0, -1.35, 0])
        self.at(0, -0.25)
        self.play(FadeIn(head, shift=DOWN * 0.2), run_time=0.5)
        for k, g in enumerate(groups):
            self.at(1 + k)
            self.sfx("pop", -2)
            self.play(FadeIn(g, shift=UP * 0.2), run_time=0.55)
        self.at(4, 0.35)
        self.sfx("click")
        self.play(FadeIn(law, scale=0.9), run_time=0.5)
        self.play(Circumscribe(law, color=INK, buff=0.2), run_time=0.9)
        self.finish()


class S11Quiz(Shot):
    """Three questions, a five-second countdown, then the answers."""

    def construct(self):
        head = T("Your turn", 52, INK, BOLD).move_to([-4.3, 3.3, 0])
        pause = VGroup(VGroup(Rectangle(width=0.12, height=0.42), Rectangle(width=0.12, height=0.42)).arrange(RIGHT, buff=0.12)
                       .set_fill(MUTED, 1).set_stroke(width=0), T("Pause if you need more time", 28, MUTED))
        pause.arrange(RIGHT, buff=0.25).move_to([3.5, 3.3, 0])
        ys = (1.85, 0.2, -1.45)
        qs = [M(f"12 V battery, 6 Ω resistor. {ci('Current')} = ?", 32, INK, MEDIUM),
              T("Water analogy: a narrow pipe = ?", 32, INK, MEDIUM),
              T("True or false: a bulb uses up current", 32, INK, MEDIUM)]
        ans = [M(f"{ci()} = 12 V / 6 Ω = 2 A", 30, GREEN, SEMIBOLD),
               T("Resistance", 30, GREEN, SEMIBOLD),
               T("False: same current in and out; energy is transferred", 28, GREEN, SEMIBOLD)]
        cards, rows = [], []
        for k, y in enumerate(ys):
            c = card(12.4, 1.45, MUTED).move_to([0, y, 0])
            badge = VGroup(Circle(radius=0.34, fill_color=PANEL_HI, fill_opacity=1, stroke_color=INK, stroke_width=3),
                           T(str(k + 1), 32, INK, BOLD)).move_to([-5.55, y, 0])
            badge[1].move_to(badge[0])
            qs[k].move_to([0, y + 0.3, 0]).align_to([-4.95, 0, 0], LEFT)
            ans[k].move_to([0, y - 0.33, 0]).align_to([-4.95, 0, 0], LEFT)
            cards.append(c)
            rows.append(VGroup(c, badge, qs[k]))

        self.at(0, -0.1)
        self.play(FadeIn(head, shift=DOWN * 0.2), FadeIn(pause), run_time=0.5)
        for k in range(3):
            self.at(1 + k)
            self.sfx("pop", -2)
            self.play(FadeIn(rows[k], shift=UP * 0.2), run_time=0.5)

        # --- countdown (silent segment 4)
        cc = np.array([5.95, 3.3, 0])
        left = ValueTracker(1.0)
        ring_bg = Circle(radius=0.4, color=PANEL_HI, stroke_width=8).move_to(cc)
        ring = always_redraw(lambda: Arc(radius=0.4, start_angle=PI / 2, angle=max(1e-3, 2 * PI * left.get_value()),
                                         color=CYAN, stroke_width=8, arc_center=cc))
        self.at(4)
        self.play(FadeOut(pause), FadeIn(ring_bg), run_time=0.3)
        self.add(ring)
        start = self.s(4)
        num = None
        for k in range(5):
            new = T(str(5 - k), 36, INK, BOLD).move_to(cc)
            self.to(start + k)
            self.sfx("tick", -4)
            if num is None:
                self.add(new)
            else:
                self.remove(num)
                self.add(new)
            num = new
            self.play(left.animate.set_value(1 - (k + 1) / 5), run_time=0.98, rate_func=linear)

        # --- answers
        head2 = T("Answers", 52, GREEN, BOLD).move_to(head)
        self.at(5)
        self.play(FadeOut(ring), FadeOut(ring_bg), FadeOut(num), ReplacementTransform(head, head2), run_time=0.45)
        checks = []
        for k in range(3):
            self.at(6 + k)
            self.sfx("ding", -4)
            chk = check_icon().move_to([5.6, ys[k], 0])
            checks.append(chk)
            self.play(cards[k].animate.set_stroke(GREEN, 4), FadeIn(ans[k], shift=UP * 0.12), Create(chk), run_time=0.55)
        self.at(9, 0.3)
        self.play(LaggedStart(*[Indicate(c, color=GREEN, scale_factor=1.35) for c in checks], lag_ratio=0.3),
                  run_time=1.3)
        self.finish()
