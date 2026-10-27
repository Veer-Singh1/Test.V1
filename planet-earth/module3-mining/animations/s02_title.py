import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import title_card  # noqa: E402
from mine import *  # noqa: E402,F403


class S02Title(Shot):
    def construct(self):
        strata = VGroup()
        for k, c in enumerate(["#8B6B4A", "#6B5444", GOLD, "#57534E", "#7A6150"]):
            xs = np.linspace(-7.6, 7.6, 30)
            ys = -2.0 - 0.36 * k + 0.1 * np.sin(xs * 0.7 + 2 * k)
            strata.add(VMobject(stroke_color=c, stroke_width=10 if c != GOLD else 6, stroke_opacity=0.6)
                       .set_points_smoothly([[x, y, 0] for x, y in zip(xs, ys)]))
        title_card(self, "MINING", [("Ore", ORE), ("Mine", INK), ("Refine", PROC), ("Rehabilitate", GOOD)], strata)
