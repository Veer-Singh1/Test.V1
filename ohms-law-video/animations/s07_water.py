import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import *  # noqa: E402,F403

PIPE = "#2B4366"
CHANNEL = "#10243F"


class S07Water(Shot):
    """Water-pipe analogy side by side with a circuit, then where the analogy breaks."""

    def construct(self):
        LW, LH = 5.0, 2.8
        lc, rc = np.array([-3.55, 0.75, 0]), np.array([3.55, 0.75, 0])

        # --- water circuit (left)
        wpath = Polygon(lc + [-LW / 2, LH / 2, 0], lc + [-LW / 2, -LH / 2, 0], lc + [LW / 2, -LH / 2, 0],
                        lc + [LW / 2, LH / 2, 0]).round_corners(0.35).set_stroke(opacity=0)
        pipe = VGroup(wpath.copy().set_stroke(PIPE, 30, opacity=1), wpath.copy().set_stroke(CHANNEL, 18, opacity=1))
        top = lc + [0, LH / 2, 0]
        nmask = Rectangle(width=1.4, height=0.62, fill_color=NAVY, fill_opacity=1, stroke_width=0).move_to(top)
        n_outer = Line(top + LEFT * 0.72, top + RIGHT * 0.72).set_stroke(PIPE, 16)
        n_inner = Line(top + LEFT * 0.72, top + RIGHT * 0.72).set_stroke(CHANNEL, 7)
        narrow = VGroup(nmask, n_outer, n_inner)
        water = Flow(wpath, n=34, color=WATER, r=0.06, speed=0.06, reverse=True)

        pc = lc + [-LW / 2, 0, 0]
        pump_body = Circle(radius=0.46, fill_color=PANEL, fill_opacity=1, stroke_color=AMBER, stroke_width=5).move_to(pc)
        blades = VGroup(*[Line(pc, pc + 0.34 * np.array([np.cos(a), np.sin(a), 0]), color=INK, stroke_width=5)
                          for a in (0, 2 * PI / 3, 4 * PI / 3)])
        spin = ValueTracker(4.0)
        blades.add_updater(lambda m, dt: m.rotate(-spin.get_value() * dt, about_point=pump_body.get_center()))
        pump = VGroup(pump_body, blades)

        gc = lc + [-LW / 2 + 1.25, -0.05, 0]
        pressure = ValueTracker(0.45)
        dial = Arc(radius=0.4, start_angle=0, angle=PI, color=MUTED, stroke_width=4).move_arc_center_to(gc)
        needle = always_redraw(lambda: Line(gc, gc + 0.34 * np.array([np.cos(PI * (1 - pressure.get_value())),
                                                                       np.sin(PI * (1 - pressure.get_value())), 0]),
                                            color=AMBER, stroke_width=5))
        gauge_lbl = T("pressure", 20, MUTED).next_to(dial, DOWN, buff=0.12)
        gauge = VGroup(dial, needle, gauge_lbl)

        # --- electric circuit (right)
        loop = Loop(w=LW, h=LH, load="resistor").move_to(rc)
        arrows = loop.arrows(n=12, speed=0.06)

        ltitle = T("Water circuit", 32, WATER, SEMIBOLD).move_to(lc + [0, LH / 2 + 0.72, 0])
        rtitle = T("Electric circuit", 32, CYAN, SEMIBOLD).move_to(rc + [0, LH / 2 + 0.72, 0])

        # --- seg 0: the water loop
        self.at(0, -0.3)
        self.play(Create(pipe), FadeIn(ltitle), run_time=1.0)
        self.add(wpath)
        self.play(FadeIn(narrow), FadeIn(pump), FadeIn(gauge), run_time=0.5)
        self.play(FadeIn(water), run_time=0.5)

        legend = VGroup(pill("Pressure ↔ Voltage", AMBER, 26), pill("Flow rate ↔ Current", CYAN, 26),
                        pill("Narrow pipe ↔ Resistance", CORAL, 26)).arrange(RIGHT, buff=0.3)
        legend.scale_to_fit_width(min(legend.width, 13.0)).move_to([0, -1.7, 0])

        # --- seg 1: pressure <-> voltage
        self.at(1)
        self.play(FadeIn(loop), FadeIn(rtitle), run_time=0.5)
        self.play(FadeIn(arrows), run_time=0.3)
        self.play(Circumscribe(pump_body, color=AMBER, shape=Circle, buff=0.12),
                  Circumscribe(loop.battery[1:3], color=AMBER, buff=0.15), FadeIn(legend[0], shift=UP * 0.15),
                  run_time=0.9)

        # --- seg 2: flow rate <-> current
        self.at(2)
        self.play(ShowPassingFlash(wpath.copy().set_stroke(CYAN, 9, opacity=1), time_width=0.35),
                  ShowPassingFlash(loop.path.copy().set_stroke(CYAN, 9, opacity=1).reverse_points(), time_width=0.35),
                  FadeIn(legend[1], shift=UP * 0.15), run_time=1.2)

        # --- seg 3: narrow pipe <-> resistance
        self.at(3)
        self.play(Circumscribe(narrow, color=CORAL, buff=0.1), Circumscribe(loop.load, color=CORAL, buff=0.12),
                  FadeIn(legend[2], shift=UP * 0.15), run_time=0.9)

        # --- seg 4: more pressure, more flow; narrower pipe, less flow
        bglow = glow(AMBER, 0.9, 8, 0.55).move_to(loop.battery[1].get_center())
        self.at(4)
        self.play(spin.animate.set_value(9), pressure.animate.set_value(0.88), FadeIn(bglow),
                  water.speed.animate.set_value(0.13), arrows.speed.animate.set_value(0.13), run_time=0.8)
        self.at(4, 0.52)
        self.play(n_inner.animate.set_stroke(width=2.5), n_outer.animate.set_stroke(width=9),
                  loop.load.animate.stretch(1.5, 1), water.speed.animate.set_value(0.025),
                  arrows.speed.animate.set_value(0.025), pressure.animate.set_value(0.6), spin.animate.set_value(5),
                  FadeOut(bglow), run_time=0.9)

        # --- seg 5: where the analogy breaks
        banner = VGroup(warning_icon(0.62), T("Where the analogy breaks", 40, AMBER, BOLD)).arrange(RIGHT, buff=0.3)
        banner.move_to(UP * 3.3)
        self.at(5)
        self.play(FadeOut(ltitle), FadeOut(rtitle), FadeOut(legend), run_time=0.4)
        self.play(FadeIn(banner, shift=DOWN * 0.15), n_inner.animate.set_stroke(width=7), n_outer.animate.set_stroke(width=16),
                  loop.load.animate.stretch(1 / 1.5, 1), water.speed.animate.set_value(0.06),
                  arrows.speed.animate.set_value(0.06), run_time=0.6)

        # --- seg 6: cut the pipe (water spills) and the wire (current stops)
        gap_w = lc + [LW / 2, 0, 0]
        cut_w = Rectangle(width=0.8, height=0.55, fill_color=NAVY, fill_opacity=1, stroke_width=0).move_to(gap_w)
        gap_e = rc + [LW / 2, 0, 0]
        cut_e = Rectangle(width=0.5, height=0.5, fill_color=NAVY, fill_opacity=1, stroke_width=0).move_to(gap_e)
        cross = VGroup(Line(UL, DR), Line(DL, UR)).scale(0.2).set_stroke(CORAL, 7).move_to(gap_e + RIGHT * 0.45)
        rng = np.random.default_rng(5)
        drops = VGroup(*[Dot(radius=0.05, color=WATER) for _ in range(46)])
        st = {"t": 0.0, "v": np.stack([rng.uniform(0.6, 2.4, 46), rng.uniform(-0.6, 1.4, 46)], 1),
              "delay": rng.uniform(0, 1.4, 46)}

        def spray(m, dt):
            st["t"] += dt
            for k, d in enumerate(m):
                tt = st["t"] - st["delay"][k]
                if tt <= 0:
                    d.set_opacity(0)
                    continue
                p = gap_w + np.array([st["v"][k][0] * tt, st["v"][k][1] * tt - 2.4 * tt * tt, 0])
                d.move_to(p).set_opacity(max(0, 1 - tt / 1.4))

        lbl_w = pill("Cut pipe → water spills", WATER, 28).move_to([-3.55, -1.7, 0])
        lbl_e = pill("Cut wire → current stops", CORAL, 28).move_to([3.55, -1.7, 0])
        self.at(6)
        self.sfx("pop")
        self.play(FadeIn(cut_w), water.speed.animate.set_value(0), water.animate.fade(0.65), run_time=0.4)
        drops.add_updater(spray)
        self.add(drops)
        self.play(FadeIn(lbl_w, shift=UP * 0.15), run_time=0.4)
        self.at(6, 0.5)
        self.sfx("click")
        self.play(FadeIn(cut_e), FadeIn(cross, scale=0.5), arrows.speed.animate.set_value(0), run_time=0.4)
        self.play(FadeIn(lbl_e, shift=UP * 0.15), run_time=0.4)

        # --- seg 7: water carries energy; in a circuit, fields carry it
        drops.clear_updaters()
        energy_w = Flow(wpath, n=9, color=AMBER, r=0.055, speed=0.06, reverse=True)
        energy_w.phase = 0.5 / 34
        fields = VGroup(*[RoundedRectangle(corner_radius=0.5, width=LW + d, height=LH + d).move_to(rc)
                          for d in (0.6, 1.1, -0.8)])
        fields.set_stroke(AMBER, 2, opacity=0.35)
        rglow = glow(CORAL, 1.0, 8, 0.5).move_to(loop.load)
        self.at(7)
        self.play(FadeOut(cut_w), FadeOut(cut_e), FadeOut(cross), FadeOut(drops), water.animate.fade(1 - 1 / 0.35),
                  water.speed.animate.set_value(0.06), arrows.speed.animate.set_value(0.008), run_time=0.6)
        self.play(FadeIn(energy_w), run_time=0.5)
        lbl_w2 = pill("Pipe: water carries energy", WATER, 28).move_to([-3.55, -1.7, 0])
        lbl_e2 = pill("Circuit: fields carry energy", AMBER, 28).move_to([3.55, -1.7, 0])
        self.play(ReplacementTransform(lbl_w, lbl_w2), run_time=0.5)
        self.at(7, 0.42)
        self.play(Create(fields, lag_ratio=0.2), FadeIn(rglow), ReplacementTransform(lbl_e, lbl_e2), run_time=0.9)
        for _ in range(3):
            self.play(*[ShowPassingFlash(f.copy().set_stroke(AMBER, 6, opacity=1), time_width=0.4) for f in fields],
                      run_time=1.0)
        self.finish()
