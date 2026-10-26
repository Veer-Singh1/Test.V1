import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import *  # noqa: E402,F403


def ion(r=0.27):
    c = Circle(radius=r, stroke_color="#E3A27A", stroke_width=2, fill_color=COPPER, fill_opacity=1)
    return VGroup(c, T("+", 24, INK, BOLD).move_to(c))


class S03Atoms(Shot):
    """Electrons in atoms; conductors (free electrons) vs insulators (bound electrons)."""

    def construct(self):
        # --- seg 0: an atom with orbiting electrons
        offsets = [(0, 0), (0.24, 0.1), (-0.22, 0.13), (0.05, -0.24), (-0.16, -0.2), (0.23, -0.15), (0.0, 0.26)]
        nucleus = VGroup(*[Circle(radius=0.17, stroke_width=0, fill_color=("#CBD5E1" if k % 2 else "#94A3B8"),
                                  fill_opacity=1).move_to([x, y, 0]) for k, (x, y) in enumerate(offsets)])
        orbits = VGroup(*[Ellipse(width=4.4, height=1.5).rotate(a * DEGREES) for a in (0, 60, -60)])
        orbits.set_stroke(MUTED, 2, opacity=0.6)
        flows = [Flow(o, n=2, r=0.075, speed=0.18 + 0.03 * k) for k, o in enumerate(orbits)]
        atom = VGroup(nucleus, orbits, *flows).move_to(UP * 0.55)
        tag = pill("Electron: negative charge (−)", CYAN, 30).move_to([3.35, 2.45, 0])

        self.at(0, -0.3)
        self.play(FadeIn(nucleus, scale=0.5), Create(orbits, lag_ratio=0.2), run_time=1.1)
        self.play(*[FadeIn(f) for f in flows], run_time=0.5)
        self.at(0, 0.45)
        self.play(FadeIn(tag, shift=LEFT * 0.2), run_time=0.5)

        # --- seg 1: conductor panel with free electrons in a copper lattice
        lbox = card(6.4, 4.2, MUTED).move_to([-3.5, 0.45, 0])
        ltitle = T("Conductor: free electrons", 34, CYAN, SEMIBOLD).next_to(lbox, UP, buff=0.25)
        lattice = VGroup(*[ion().move_to(lbox.get_center() + [x * 1.2, y * 1.15, 0])
                           for x in range(-2, 3) for y in (-1, 0, 1)])
        free = Wanderers(lbox, n=16, speed=1.25, seed=4)
        lcap = T("e.g. copper", 26, MUTED).next_to(lbox, DOWN, buff=0.22)
        self.at(1)
        self.play(FadeOut(tag), atom.animate.scale(0.35).move_to([0, 3.2, 0]).set_opacity(0),
                  FadeIn(lbox), FadeIn(ltitle, shift=DOWN * 0.15),
                  LaggedStart(*[FadeIn(i) for i in lattice], lag_ratio=0.03), run_time=1.0)
        self.remove(atom, *flows)
        self.play(FadeIn(free), FadeIn(lcap), run_time=0.6)

        # --- seg 2: insulator panel with bound electrons
        rbox = card(6.4, 4.2, MUTED).move_to([3.5, 0.45, 0])
        rtitle = T("Insulator: bound electrons", 34, CORAL, SEMIBOLD).next_to(rbox, UP, buff=0.25)
        centres = [rbox.get_center() + [x * 1.2, y * 1.15, 0] for x in range(-2, 3) for y in (-1, 0, 1)]
        atoms = VGroup(*[Circle(radius=0.24, stroke_width=0, fill_color="#64748B", fill_opacity=1).move_to(c)
                         for c in centres])
        bound = VGroup(*[electron(0.06) for _ in centres])
        t0 = self.time

        def hold(m):
            t = self.time - t0
            for k, (d, c) in enumerate(zip(m, centres)):
                a = 2.4 * t + k * 1.7
                d.move_to(c + 0.38 * np.array([np.cos(a), np.sin(a), 0]))

        bound.add_updater(hold)
        rcap = T("e.g. plastic, rubber, glass", 26, MUTED).next_to(rbox, DOWN, buff=0.22)
        self.at(2)
        self.play(FadeIn(rbox), FadeIn(rtitle, shift=DOWN * 0.15), LaggedStart(*[FadeIn(a) for a in atoms], lag_ratio=0.03),
                  run_time=1.0)
        self.play(FadeIn(bound), FadeIn(rcap), run_time=0.6)
        self.finish()


class S03Loop(Shot):
    """'...a complete path: a closed loop.' / 'Open a switch, and the flow stops everywhere.'"""

    def construct(self):
        loop = Loop(w=7.4, h=3.6, switch=True).move_to(UP * 0.45)
        flow = loop.flow(n=30, speed=0.055)
        closed = pill("Closed loop → current flows", CYAN, 32).move_to(UP * 3.2)
        self.play(Create(loop.wire), run_time=1.0)
        self.play(FadeIn(loop.battery), FadeIn(loop.load), FadeIn(loop.switch), run_time=0.5)
        self.play(FadeIn(flow), loop.load.on(0.7), run_time=0.7)
        self.at(0, 0.62)
        self.play(FadeIn(closed, shift=DOWN * 0.15), run_time=0.45)

        broken = pill("No closed loop → no current", CORAL, 32).move_to(UP * 3.2)
        self.at(1, 0.12)
        self.sfx("click")
        self.play(loop.switch.open(), run_time=0.35)
        self.play(flow.speed.animate.set_value(0), loop.load.off(0.5), ReplacementTransform(closed, broken),
                  run_time=0.55)
        self.finish()
