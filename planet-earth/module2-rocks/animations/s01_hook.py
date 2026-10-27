import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from geo import *  # noqa: E402,F403


class S01Types(Shot):
    """'Today we'll read those stories: igneous, sedimentary and metamorphic rock...'"""

    def construct(self):
        cards = VGroup(type_card("Igneous", IGN, flame_icon()), type_card("Sedimentary", SED, layers_icon()),
                       type_card("Metamorphic", MET, squeeze_icon())).arrange(RIGHT, buff=0.45).move_to(UP * 0.75)
        for k, frac in enumerate((0.14, 0.23, 0.33)):
            self.at(0, frac)
            self.sfx("pop", -2)
            self.play(FadeIn(cards[k], shift=UP * 0.2), run_time=0.45)
        tags = VGroup(pill("How it forms", INK, 24), pill("How to recognise it", INK, 24),
                      pill("How one turns into another", INK, 24)).arrange(RIGHT, buff=0.3).move_to(DOWN * 1.45)
        for k, frac in enumerate((0.48, 0.63, 0.78)):
            self.at(0, frac)
            self.play(FadeIn(tags[k], shift=UP * 0.15), run_time=0.4)
        arcs = VGroup(*[CurvedArrow(cards[k].get_top() + UP * 0.12, cards[k + 1].get_top() + UP * 0.12, angle=-PI / 3,
                                    color=MUTED, stroke_width=4) for k in range(2)])
        self.at(0, 0.86)
        self.play(Create(arcs), run_time=0.6)
        self.finish()
