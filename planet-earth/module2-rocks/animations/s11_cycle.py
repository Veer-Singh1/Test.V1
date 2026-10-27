import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from geo import *  # noqa: E402,F403


class S11Cycle(Shot):
    """The rock cycle diagram, then one journey: granite -> sand -> sandstone -> quartzite -> magma -> granite."""

    def construct(self):
        head = T("The rock cycle", 40, INK, BOLD).move_to([-5.0, 3.42, 0])
        c = np.array([0, 0.55, 0])
        rx, ry = 4.25, 2.3
        names = [("Magma", MAGMA, 90), ("Igneous rock", IGN, 18), ("Sediment", "#D9A066", -54),
                 ("Sedimentary rock", SED, -126), ("Metamorphic rock", MET, 162)]
        pos = {n: c + np.array([rx * np.cos(a * DEGREES), ry * np.sin(a * DEGREES), 0]) for n, _, a in names}
        nodes = {n: pill(n, colr, 28).move_to(pos[n]) for n, colr, _ in names}
        procs = [("Magma", "Igneous rock", "cooling &\nsolidifying"), ("Igneous rock", "Sediment", "weathering\n& erosion"),
                 ("Sediment", "Sedimentary rock", "deposition, compaction\n& cementation"),
                 ("Sedimentary rock", "Metamorphic rock", "heat &\npressure"), ("Metamorphic rock", "Magma", "melting")]
        arrows, labels = {}, {}
        for a, b, txt in procs:
            ar = CurvedArrow(nodes[a].get_center(), nodes[b].get_center(), angle=-PI / 4.2, color=MUTED, stroke_width=5)
            ar.scale(0.6, about_point=(nodes[a].get_center() + nodes[b].get_center()) / 2)
            mid = ar.point_from_proportion(0.5)
            out = (mid - c) / np.linalg.norm(mid - c)
            lab = VGroup(*[T(s, 22, MUTED) for s in txt.split("\n")]).arrange(DOWN, buff=0.05)
            spot = mid + out * 0.55
            lab.move_to(spot if spot[1] > -1.6 else mid - out * 0.55)
            arrows[(a, b)], labels[(a, b)] = ar, lab
        self.at(0, -0.3)
        self.play(FadeIn(head), LaggedStart(*[FadeIn(nodes[n], scale=0.8) for n, *_ in names], lag_ratio=0.15), run_time=1.0)
        self.at(1)
        for a, b, _ in procs:
            self.play(Create(arrows[(a, b)]), FadeIn(labels[(a, b)]), run_time=0.75)
        ring = VGroup(*[Arc(radius=0.75, start_angle=k * 2 * PI / 3, angle=PI / 2, color=INK, stroke_width=5)
                        .add_tip(tip_length=0.18) for k in range(3)]).move_to(c)
        nb = pill("No beginning, no end", INK, 26).next_to(ring, DOWN, buff=0.15)
        self.at(2, 0.3)
        self.play(FadeIn(ring), FadeIn(nb), run_time=0.5)
        ring.add_updater(lambda m, dt: m.rotate(-0.9 * dt, about_point=c))

        # --- the journey
        token = VGroup(glow(WARM, 0.45, 6, 0.9), Dot(radius=0.11, color=WHITE))
        token.move_to(nodes["Igneous rock"].get_top() + UP * 0.25)
        stops = [(4, "Igneous rock", "Sediment", "sand", "sandstone"), (5, "Sediment", "Sedimentary rock", "sandstone", "sandstone"),
                 (6, "Sedimentary rock", "Metamorphic rock", "quartzite", "quartzite"), (7, "Metamorphic rock", "Magma", "magma", "magma"),
                 (8, "Magma", "Igneous rock", "granite", "granite")]
        now = labelled_swatch("granite", "granite", IGN, 1.5, 0.72, 50, 28).move_to(c + DOWN * 0.05)
        self.at(3)
        ring.clear_updaters()
        self.play(FadeOut(ring), FadeOut(nb), FadeIn(token, scale=0.5), FadeIn(now, shift=UP * 0.1), run_time=0.5)
        swatch_kind = {"sand": "sandstone", "sandstone": "sandstone", "quartzite": "quartzite", "magma": "magma",
                       "granite": "granite"}
        for seg, a, b, name, _ in stops:
            ar = arrows[(a, b)]
            self.at(seg, 0.05)
            hi = ar.copy().set_stroke(WARM, 7)
            tracker = ValueTracker(0)
            token.add_updater(lambda m: m.move_to(ar.point_from_proportion(tracker.get_value())))
            self.play(Create(hi), tracker.animate.set_value(1), labels[(a, b)].animate.set_color(WARM), run_time=1.3)
            token.clear_updaters()
            color = {"sand": "#D9A066", "sandstone": SED, "quartzite": MET, "magma": MAGMA, "granite": IGN}[name]
            nxt = labelled_swatch(swatch_kind[name], name, color, 1.5, 0.72, 51 + seg, 28).move_to(now)
            self.play(ReplacementTransform(now, nxt), Indicate(nodes[b], color=WARM, scale_factor=1.12),
                      FadeOut(hi), labels[(a, b)].animate.set_color(MUTED), run_time=0.6)
            now = nxt
        self.finish()
