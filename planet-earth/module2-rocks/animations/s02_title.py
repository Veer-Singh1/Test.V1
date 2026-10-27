import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import title_card  # noqa: E402
from geo import *  # noqa: E402,F403


class S02Title(Shot):
    """Title card (no narration): strata draw across the bottom, then the title builds."""

    def construct(self):
        cols = [SED, "#B7804A", IGN, "#8B6B4A", MET]
        strata = VGroup()
        for k, c in enumerate(cols):
            xs = np.linspace(-7.6, 7.6, 30)
            ys = -2.0 - 0.36 * k + 0.12 * np.sin(xs * 0.8 + k)
            strata.add(VMobject(stroke_color=c, stroke_width=10, stroke_opacity=0.55)
                       .set_points_smoothly([[x, y, 0] for x, y in zip(xs, ys)]))
        title_card(self, "HOW ROCKS FORM", [("Igneous", IGN), ("Sedimentary", SED), ("Metamorphic", MET)], strata)
