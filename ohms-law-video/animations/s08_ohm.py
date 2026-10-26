import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import *  # noqa: E402,F403


def eq_line(markup, size=48, weight=BOLD):
    return M(markup, size, INK, weight)


class S08Law(Shot):
    """Ohm's law, proportionality on an I-V graph, and the V = IR triangle trick."""

    def construct(self):
        head = T("Ohm's law", 56, INK, BOLD).move_to(UP * 3.25)
        words = VGroup(T("Voltage", 44, AMBER, SEMIBOLD), T("Current", 44, CYAN, SEMIBOLD),
                       T("Resistance", 44, CORAL, SEMIBOLD)).arrange(RIGHT, buff=0.9).move_to(UP * 1.2)
        law = M(f"{cv()} = {ci()} × {cr()}", 120, INK, BOLD).move_to(UP * 0.4)
        self.at(0, -0.2)
        self.play(FadeIn(head, shift=DOWN * 0.2), LaggedStart(*[FadeIn(w, shift=UP * 0.2) for w in words], lag_ratio=0.25),
                  run_time=0.9)
        self.sfx("click")
        self.play(ReplacementTransform(words, law), run_time=0.7)

        # --- seg 1: proportionality
        axes = Axes(x_range=[0, 10, 2], y_range=[0, 4, 1], x_length=5.2, y_length=3.0,
                    axis_config={"color": MUTED, "stroke_width": 3, "include_ticks": False,
                                 "tip_width": 0.18, "tip_height": 0.18}).move_to([-3.4, 0.55, 0])
        xl = T("Voltage", 28, AMBER, SEMIBOLD).next_to(axes.x_axis.get_end(), RIGHT, buff=0.15)
        yl = T("Current", 28, CYAN, SEMIBOLD).next_to(axes.y_axis.get_end(), RIGHT, buff=0.2)
        line = axes.plot(lambda x: x / 3, x_range=[0, 9.6], color=CORAL, stroke_width=6)
        cap = T("metal wire, steady temperature", 26, MUTED).next_to(axes, DOWN, buff=0.35)
        x = ValueTracker(1.5)
        dot = always_redraw(lambda: Dot(axes.c2p(x.get_value(), x.get_value() / 3), 0.1, color=INK))
        guides = always_redraw(lambda: VGroup(
            DashedLine(axes.c2p(x.get_value(), 0), axes.c2p(x.get_value(), x.get_value() / 3), color=AMBER, stroke_width=3),
            DashedLine(axes.c2p(0, x.get_value() / 3), axes.c2p(x.get_value(), x.get_value() / 3), color=CYAN, stroke_width=3)))
        self.at(1)
        self.play(law.animate.scale(0.62).move_to([3.4, 0.55, 0]), run_time=0.7)
        self.play(Create(axes), FadeIn(xl), FadeIn(yl), run_time=0.8)
        self.play(FadeIn(cap), run_time=0.4)
        self.at(1, 0.45)
        self.play(Create(line), run_time=0.9)
        self.add(guides, dot)
        self.play(x.animate.set_value(8.4), run_time=1.8, rate_func=rate_functions.ease_in_out_sine)
        self.at(1, 0.82)
        self.sfx("click")
        self.play(Circumscribe(law, color=INK, buff=0.25), run_time=0.9)

        # --- seg 2: the triangle
        tc = np.array([-2.7, 0.5, 0])
        tri = Polygon(tc + [0, 1.85, 0], tc + [-2.35, -1.8, 0], tc + [2.35, -1.8, 0], color=INK, stroke_width=5)
        ym = tc[1] + 0.02
        half = 2.35 * (tc[1] + 1.85 - ym) / 3.65
        hline = Line([tc[0] - half, ym, 0], [tc[0] + half, ym, 0], color=INK, stroke_width=4)
        vline = Line([tc[0], ym, 0], [tc[0], tc[1] - 1.8, 0], color=INK, stroke_width=4)
        cells = {"V": tc + [0, 0.75, 0], "I": tc + [-0.95, -0.85, 0], "R": tc + [0.95, -0.85, 0]}
        letters = {"V": T("V", 86, AMBER, BOLD).move_to(cells["V"]), "I": T("I", 86, CYAN, BOLD).move_to(cells["I"]),
                   "R": T("R", 86, CORAL, BOLD).move_to(cells["R"])}
        self.at(2)
        self.play(FadeOut(VGroup(axes, xl, yl, line, cap, guides, dot)), FadeOut(law), run_time=0.5)
        self.play(Create(tri), run_time=0.8)
        self.play(Create(hline), Create(vline), run_time=0.4)
        self.at(2, 0.4)
        self.play(FadeIn(letters["V"], scale=0.7), run_time=0.4)
        self.at(2, 0.65)
        self.play(FadeIn(letters["I"], scale=0.7), FadeIn(letters["R"], scale=0.7), run_time=0.45)

        # --- seg 3-6: cover the one you want
        cover = RoundedRectangle(corner_radius=0.15, width=1.25, height=1.05, fill_color=PANEL_HI, fill_opacity=0.97,
                                 stroke_color=INK, stroke_width=3).move_to([-6.1, 0.5, 0])
        cover_lbl = T("cover", 24, MUTED).next_to(cover, DOWN, buff=0.15)
        self.at(3)
        self.play(FadeIn(cover, shift=RIGHT * 0.3), FadeIn(cover_lbl), run_time=0.5)
        results = [eq_line(f"{cv()} = {ci()} × {cr()}", 64), eq_line(f"{ci()} = {cv()} / {cr()}", 64),
                   eq_line(f"{cr()} = {cv()} / {ci()}", 64)]
        for k, r in enumerate(results):
            r.move_to([3.4, 1.55 - 1.15 * k, 0])
        for k, key in enumerate("VIR"):
            self.at(4 + k)
            self.sfx("click")
            anims = [cover.animate.move_to(cells[key])]
            if k == 0:
                anims.append(FadeOut(cover_lbl))
            self.play(*anims, run_time=0.45)
            self.play(FadeIn(results[k], shift=LEFT * 0.25), run_time=0.45)
        self.finish()


class S08Examples(Shot):
    """Two worked examples, built line by line."""

    def steps(self, lines, idx_times, box_color=GREEN):
        """Reveal each line at its (segment, fraction) time; box the last one."""
        for k, (line, (seg, frac)) in enumerate(zip(lines, idx_times)):
            self.at(seg, frac)
            self.sfx("ding" if k == len(lines) - 1 else "click", -2 if k == len(lines) - 1 else 0)
            self.play(FadeIn(line, shift=UP * 0.12), run_time=0.4)
        box = boxed(lines[-1], box_color)
        self.play(Create(box), run_time=0.4)
        return box

    def construct(self):
        x_left = 0.55

        def place(mob, y):
            return mob.move_to([0, y, 0]).align_to([x_left, 0, 0], LEFT)

        # --- example 1
        head = T("Example 1", 48, INK, BOLD).move_to([-4.7, 3.25, 0])
        loop = Loop(w=4.8, h=3.0, load="resistor").move_to([-3.55, 0.55, 0])
        flow = loop.flow(n=22, speed=0.05)
        v_lbl = T("9 V", 40, AMBER, BOLD).next_to(loop.battery[1], RIGHT, buff=0.4)
        r_lbl = T("3 Ω", 40, CORAL, BOLD).next_to(loop.load, UP, buff=0.25)
        note = T("Ideal battery = no internal resistance", 24, MUTED).move_to([-3.55, -1.5, 0])
        given = place(M(f"Given:  {cv()} = 9 V,  {cr()} = 3 Ω", 32, INK, MEDIUM), 2.35)
        find = place(M(f"Find:  {ci()} = ?", 32, INK, MEDIUM), 1.5)
        lines = [place(eq_line(f"{ci()} = {cv()} / {cr()}", 52), 0.45),
                 place(eq_line(f"{ci()} = 9 V / 3 Ω", 52), -0.5),
                 place(eq_line(f"{ci()} = 3 A", 60), -1.5)]
        self.at(0, -0.2)
        self.play(FadeIn(head, shift=DOWN * 0.15), run_time=0.45)
        self.at(1)
        self.play(FadeIn(loop), FadeIn(flow), run_time=0.6)
        self.play(FadeIn(v_lbl, shift=RIGHT * 0.1), FadeIn(r_lbl, shift=DOWN * 0.1), FadeIn(given), run_time=0.6)
        self.at(1, 0.55)
        self.play(FadeIn(note), run_time=0.4)
        self.at(2)
        self.play(FadeIn(find, shift=UP * 0.1), run_time=0.4)
        box1 = self.steps(lines, [(3, 0.0), (3, 0.3), (3, 0.78)])
        self.play(flow.speed.animate.set_value(0.09), run_time=0.4)

        # --- example 2
        ex1 = VGroup(head, loop, flow, v_lbl, r_lbl, note, given, find, *lines, box1)
        head2 = T("Example 2", 48, INK, BOLD).move_to([-4.7, 3.25, 0])
        loop2 = Loop(w=4.8, h=3.0, load="bulb").move_to([-3.55, 0.35, 0])
        loop2.load.set_on()
        flow2 = loop2.flow(n=22, speed=0.05)
        v2 = T("12 V", 40, AMBER, BOLD).next_to(loop2.battery[1], RIGHT, buff=0.4)
        bulb_cap = T("small car bulb", 26, MUTED).next_to(loop2.load, DOWN, buff=0.55)
        i2 = pill("0.5 A", CYAN, 30).move_to(loop2.get_bottom() + DOWN * 0.55)
        given2 = place(M(f"Given:  {cv()} = 12 V,  {ci()} = 0.5 A", 32, INK, MEDIUM), 2.35)
        find2 = place(M(f"Find:  {cr()} = ?", 32, INK, MEDIUM), 1.5)
        lines2 = [place(eq_line(f"{cr()} = {cv()} / {ci()}", 52), 0.45),
                  place(eq_line(f"{cr()} = 12 V / 0.5 A", 52), -0.5),
                  place(eq_line(f"{cr()} = 24 Ω", 60), -1.5)]
        self.at(4)
        self.play(FadeOut(ex1), run_time=0.45)
        self.play(FadeIn(head2, shift=DOWN * 0.15), run_time=0.4)
        self.at(5)
        self.play(FadeIn(loop2), FadeIn(flow2), FadeIn(v2), FadeIn(bulb_cap), run_time=0.7)
        self.play(FadeIn(given2), FadeIn(i2), run_time=0.5)
        self.at(6)
        self.play(FadeIn(find2, shift=UP * 0.1), run_time=0.4)
        self.steps(lines2, [(7, 0.0), (7, 0.3), (7, 0.8)])
        self.finish()
