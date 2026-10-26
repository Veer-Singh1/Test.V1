import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import *  # noqa: E402,F403


class S01Spark(Shot):
    """'Electricity.' / 'We use it every day.' / 'But what actually makes it move?'"""

    def construct(self):
        core = Dot(radius=0.13, color=CYAN)
        halo = glow(CYAN, 1.15, 12, 0.9)
        ring = Circle(radius=0.16, color=CYAN, stroke_width=6)
        self.to(self.s(0) - 0.05)
        self.sfx("spark")
        self.play(GrowFromCenter(core), FadeIn(halo, scale=0.3), ring.animate.scale(16).set_stroke(opacity=0),
                  run_time=0.8, rate_func=rate_functions.ease_out_cubic)
        self.remove(ring)
        t0, ref, w0 = self.time, halo.copy(), core.width
        halo.add_updater(lambda m: m.become(ref.copy().scale(core.width / w0 * (1 + 0.1 * np.sin((self.time - t0) * 3.6)))
                                            .move_to(core.get_center())))

        orbits = VGroup(*[Ellipse(width=3.6, height=1.25).rotate(a * DEGREES) for a in (0, 60, -60)])
        orbits.set_stroke(MUTED, 1.5, opacity=0.45)
        flows = [Flow(o, n=2, r=0.055, speed=0.32 + 0.04 * k) for k, o in enumerate(orbits)]
        self.at(1)
        self.play(Create(orbits, lag_ratio=0.25), *[FadeIn(f) for f in flows], run_time=self.rt(1, 0.6, 1.0))

        atom = VGroup(halo, core, orbits, *flows)
        q1 = T("What actually makes", 60, INK, SEMIBOLD)
        q2 = M(f"electricity {col('move?', CYAN)}", 60, INK, SEMIBOLD)
        q = VGroup(q1, q2).arrange(DOWN, buff=0.28).move_to(DOWN * 0.75)
        self.at(2)
        self.play(atom.animate.scale(0.62).move_to(UP * 1.9), run_time=0.7)
        self.play(FadeIn(q1, shift=UP * 0.25), run_time=0.45)
        self.play(FadeIn(q2, shift=UP * 0.25), run_time=0.45)
        self.finish()
