import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kit import *  # noqa: E402,F403


class S02Title(Shot):
    """Animated title card (no narration)."""

    def construct(self):
        wire = Line([-7.6, -0.55, 0], [7.6, -0.55, 0], color=WIRE, stroke_width=5)
        flow = Flow(wire, n=34, speed=0.06)
        words = VGroup(T("VOLTAGE", 56, AMBER, BOLD), T("CURRENT", 56, CYAN, BOLD),
                       T("RESISTANCE", 56, CORAL, BOLD)).arrange(RIGHT, buff=0.75).move_to(UP * 0.55)
        if words.width > 12.8:
            words.scale_to_fit_width(12.8)
        sub = T("What makes electricity move?", 34, MUTED, MEDIUM).move_to(DOWN * 1.45)

        self.sfx("whoosh", -4)
        self.play(Create(wire), run_time=0.55, rate_func=rate_functions.ease_in_out_sine)
        self.play(FadeIn(flow), run_time=0.25)
        for k, w in enumerate(words):
            self.to(0.7 + 0.42 * k)
            self.sfx("click")
            self.play(FadeIn(w, shift=UP * 0.25, scale=0.92), run_time=0.38)
        self.to(1.95)
        self.play(FadeIn(sub, shift=UP * 0.15), run_time=0.45)
        self.finish()
