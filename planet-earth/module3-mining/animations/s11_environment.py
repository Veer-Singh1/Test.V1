import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mine import *  # noqa: E402,F403


class S11Environment(Shot):
    """Impacts on the four spheres, then one cause-and-effect chain followed to the end."""

    def construct(self):
        head = T("Impact on the environment", 42, HARM, BOLD).move_to([-2.9, 3.4, 0])
        linked = pill("The spheres are linked", INK, 26).move_to([4.4, 3.4, 0])
        self.at(0, -0.2)
        self.play(FadeIn(head, shift=DOWN * 0.2), run_time=0.5)
        self.at(0, 0.45)
        self.play(FadeIn(linked), run_time=0.4)
        use = pill("Huge amounts of water and electricity", WATER, 28).move_to([0, 2.55, 0])
        self.at(1)
        self.play(FadeIn(use, shift=DOWN * 0.1), run_time=0.45)
        data = [("Hydrosphere", WATER, ["acid drainage and", "chemicals in rivers", "and groundwater"]),
                ("Lithosphere", "#D6B48C", ["pits, waste rock", "and mine dumps:", "land changed for good"]),
                ("Atmosphere", "#CBD5E1", ["dust and gases from", "blasting, crushing", "and smelting"]),
                ("Biosphere", GOOD, ["habitats destroyed,", "biodiversity", "threatened"])]
        cards = []
        for k, (name, colr, rows) in enumerate(data):
            c = card(3.3, 2.25, colr, stroke=3).move_to([-5.1 + 3.4 * k, 0.75, 0])
            t = T(name, 30, colr, BOLD).move_to(c.get_top() + DOWN * 0.35)
            b = VGroup(*[T(r, 22, INK) for r in rows]).arrange(DOWN, buff=0.06).next_to(t, DOWN, buff=0.18)
            if b.width > c.width - 0.4:
                b.scale_to_fit_width(c.width - 0.4)
            cards.append(VGroup(c, t, b))
        for k in range(4):
            self.at(2 + k)
            self.sfx("pop", -4)
            self.play(FadeIn(cards[k], shift=UP * 0.15), run_time=0.5)

        steps = ["Blasting\nreleases dust", "Dust settles\non leaves", "Blocks\nsunlight", "Less\nphotosynthesis",
                 "Lower\ncrop yield"]
        text = self.segs[6]["text"]
        keys = ["blasting releases", "settles on leaves", "blocks sunlight", "photosynthesis drops", "crop yield"]
        boxes = []
        for k, s in enumerate(steps):
            t = VGroup(*[T(x, 22, INK, SEMIBOLD) for x in s.split("\n")]).arrange(DOWN, buff=0.04)
            b = RoundedRectangle(corner_radius=0.12, width=2.3, height=0.95, fill_color=PANEL, fill_opacity=1,
                                 stroke_color=HARM if k == 4 else INK, stroke_width=3)
            if t.width > b.width - 0.3:
                t.scale_to_fit_width(b.width - 0.3)
            boxes.append(VGroup(b, t.move_to(b)).move_to([-5.35 + 2.675 * k, -1.45, 0]))
        arrows = [Arrow(a.get_right(), b.get_left(), buff=0.05, color=HARM, stroke_width=5,
                        max_tip_length_to_length_ratio=0.4) for a, b in zip(boxes, boxes[1:])]
        self.at(6, -0.05)
        self.play(FadeOut(use), run_time=0.3)
        for k, key in enumerate(keys):
            self.at(6, max(0.0, text.index(key) / len(text) - 0.03))
            anims = [FadeIn(boxes[k], shift=RIGHT * 0.1)]
            if k:
                anims.append(GrowArrow(arrows[k - 1]))
            self.play(*anims, run_time=0.45)
        self.finish()
