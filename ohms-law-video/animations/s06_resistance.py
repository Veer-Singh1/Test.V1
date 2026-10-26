import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import *  # noqa: E402,F403


def two(a, b, color=INK, size=24):
    return VGroup(T(a, size, color), T(b, size, color)).arrange(DOWN, buff=0.08)


def thermometer(level):
    tube = RoundedRectangle(corner_radius=0.1, width=0.22, height=1.1, stroke_color=INK, stroke_width=3)
    bulb = Circle(radius=0.17, stroke_color=INK, stroke_width=3, fill_color=CORAL, fill_opacity=1)
    bulb.next_to(tube, DOWN, buff=-0.08)
    fill = always_redraw(lambda: Rectangle(width=0.1, height=max(0.01, 1.0 * level.get_value()), stroke_width=0,
                                           fill_color=CORAL, fill_opacity=1).align_to(tube, DOWN).shift(UP * 0.05)
                         .set_x(tube.get_x()))
    return VGroup(tube, fill, bulb)


class S06Resistance(Shot):
    """Resistance, ohms and omega; the four things that set it; R = rho L / A."""

    def construct(self):
        head = M(f"{cr('Resistance')}: opposition to current, in ohms (Ω)", 38, INK, SEMIBOLD).move_to(UP * 3.25)
        wire = Line([-7.6, 1.15, 0], [7.6, 1.15, 0], color=WIRE, stroke_width=6)
        flow = Flow(Line([-7.8, 1.15, 0], [7.8, 1.15, 0]), n=30, speed=0.05)
        res = resistor(2.6, CORAL, 0.38, 7, 8).move_to([0, 1.15, 0])
        rglow = glow(CORAL, 1.5, 8, 0.4).move_to(res)
        self.play(Create(wire), FadeIn(flow), run_time=0.6)
        self.at(0, 0.02)
        self.play(FadeIn(head, shift=DOWN * 0.2), run_time=0.5)
        self.at(0, 0.18)
        self.sfx("pop")
        self.play(GrowFromCenter(res), FadeIn(rglow), flow.speed.animate.set_value(0.016), run_time=0.9)

        portrait = ROOT / "assets" / "photos"
        found = sorted(portrait.glob("ohm_portrait.*")) if portrait.exists() else []
        if found:
            img = ImageMobject(str(found[0])).set_height(2.3)
            frame = SurroundingRectangle(img, color=MUTED, buff=0.0, stroke_width=3)
            cap = two("Georg Simon Ohm", "1789–1854", INK, 28).next_to(img, RIGHT, buff=0.35)
            ohm = Group(img, frame, cap).move_to([-3.6, -0.95, 0])
        else:
            ohm = pill("Georg Simon Ohm (1789–1854)", INK, 30).move_to([-3.4, -0.95, 0])
        self.at(0, 0.42)
        self.play(FadeIn(ohm, shift=UP * 0.2), run_time=0.6)
        omega = T("Ω", 170, CORAL, BOLD).move_to([4.0, -0.75, 0])
        self.at(0, 0.8)
        self.sfx("click")
        self.play(FadeIn(omega, scale=0.6), run_time=0.5)

        # --- seg 1: four cards
        xs = (-5.1, -1.7, 1.7, 5.1)
        titles = ("Material", "Length", "Thickness", "Temperature")
        cards = [card(3.2, 3.2, MUTED).move_to([x, 0.95, 0]) for x in xs]
        heads = [T(t, 30, INK, SEMIBOLD).move_to(c.get_top() + DOWN * 0.38) for t, c in zip(titles, cards)]
        self.at(1)
        self.play(FadeOut(VGroup(wire, flow, res, rglow, omega)), FadeOut(ohm), run_time=0.4)
        self.play(LaggedStart(*[FadeIn(VGroup(c, h), shift=UP * 0.2) for c, h in zip(cards, heads)], lag_ratio=0.15),
                  run_time=0.8)

        def activate(k):
            anims = [cards[k].animate.set_stroke(CORAL, 4)]
            if k:
                anims.append(cards[k - 1].animate.set_stroke(MUTED, 2.5))
            return anims

        # --- seg 2: material
        c0 = cards[0].get_center()
        bars = VGroup(
            VGroup(T("Copper", 22, INK), Rectangle(width=0.3, height=0.2, fill_color=CORAL, fill_opacity=1, stroke_width=0)),
            VGroup(T("Nichrome", 22, INK), Rectangle(width=1.5, height=0.2, fill_color=CORAL, fill_opacity=1, stroke_width=0)))
        for b in bars:
            b[1].next_to(b[0], RIGHT, buff=0.15)
        bars.arrange(DOWN, aligned_edge=LEFT, buff=0.32).move_to(c0 + UP * 0.05)
        cap0 = two("Copper: low R", "Nichrome: high R").move_to(c0 + DOWN * 1.05)
        self.at(2)
        self.play(*activate(0), FadeIn(bars[0], shift=RIGHT * 0.1), run_time=0.5)
        self.at(2, 0.42)
        self.play(FadeIn(bars[1], shift=RIGHT * 0.1), FadeIn(cap0), run_time=0.5)

        # --- seg 3: length
        c1 = cards[1].get_center()
        short = Line(LEFT * 0.45, RIGHT * 0.45, color=CORAL, stroke_width=7).move_to(c1 + UP * 0.35)
        long_ = Line(LEFT * 1.25, RIGHT * 1.25, color=CORAL, stroke_width=7).move_to(c1 + DOWN * 0.2)
        cap1 = two("Longer", "→ more R").move_to(c1 + DOWN * 1.05)
        self.at(3)
        self.play(*activate(1), Create(short), run_time=0.5)
        self.play(Create(long_), FadeIn(cap1), run_time=0.6)

        # --- seg 4: thickness
        c2 = cards[2].get_center()
        thin = Line(LEFT * 1.1, RIGHT * 1.1, color=CORAL, stroke_width=4).move_to(c2 + UP * 0.38)
        thick = Line(LEFT * 1.1, RIGHT * 1.1, color=CORAL, stroke_width=26).move_to(c2 + DOWN * 0.22)
        lanes = VGroup(*[Dot([x, y, 0], 0.03, color=NAVY) for x in np.linspace(-0.9, 0.9, 7) for y in (-0.06, 0.06)])
        lanes.move_to(thick)
        cap2 = two("Thicker", "→ less R").move_to(c2 + DOWN * 1.05)
        formula = M(f"{cr('R')} = ρ L / A", 64, INK, BOLD).move_to([0, -1.25, 0])
        legend = T("ρ: material   ·   L: length   ·   A: cross-section area", 24, MUTED).move_to([0, -1.95, 0])
        self.at(4)
        self.play(*activate(2), Create(thin), run_time=0.5)
        self.play(Create(thick), FadeIn(lanes), FadeIn(cap2), run_time=0.6)
        self.at(4, 0.7)
        self.sfx("click")
        self.play(FadeIn(formula, shift=UP * 0.15), FadeIn(legend), run_time=0.6)

        # --- seg 5: temperature
        c3 = cards[3].get_center()
        level = ValueTracker(0.2)
        thermo = thermometer(level).move_to(c3 + LEFT * 0.95 + DOWN * 0.05)
        hot = Line(LEFT * 0.75, RIGHT * 0.75, color=CORAL, stroke_width=8).move_to(c3 + RIGHT * 0.35 + DOWN * 0.05)
        hglow = glow("#FB923C", 0.9, 8, 0.6).move_to(hot)
        cap3 = two("Hotter (metals)", "→ more R").move_to(c3 + DOWN * 1.05)
        self.at(5)
        self.play(*activate(3), FadeIn(thermo), Create(hot), run_time=0.5)
        self.play(level.animate.set_value(0.9), FadeIn(hglow), hot.animate.set_stroke("#FDBA74"), FadeIn(cap3),
                  run_time=1.2)
        self.finish()
