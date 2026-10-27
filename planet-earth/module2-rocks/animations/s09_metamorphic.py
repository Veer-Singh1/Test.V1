import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from geo import *  # noqa: E402,F403


class S09Metamorphic(Shot):
    """Heat (batholith) re-forms crystals; pressure folds the rock and squeezes crystals into bands."""

    def construct(self):
        head = M(f"{col('Metamorphic', MET)} = 'changed in form'", 46, INK, BOLD).move_to(UP * 3.35)
        self.at(0, -0.2)
        self.play(FadeIn(head, shift=DOWN * 0.2), run_time=0.5)

        # --- seg 1: any rock in, changed by heat and/or pressure
        srcs = VGroup(labelled_swatch("granite", "igneous", IGN, 1.8, 0.85, 2, 24),
                      labelled_swatch("sandstone", "sedimentary", SED, 1.8, 0.85, 3, 24),
                      labelled_swatch("gneiss", "metamorphic", MET, 1.8, 0.85, 4, 24)).arrange(DOWN, buff=0.25)
        srcs.move_to([-5.2, 0.55, 0])
        mid = card(3.6, 2.2, MET, stroke=3).move_to([0, 0.55, 0])
        icons = VGroup(flame_icon(IGN, 0.38), T("+", 40, INK, BOLD), squeeze_icon(MET).scale(0.7)).arrange(RIGHT, buff=0.25)
        icons.move_to(mid.get_center() + UP * 0.3)
        mid_lbl = T("heat · pressure", 28, INK, SEMIBOLD).next_to(icons, DOWN, buff=0.25)
        out = labelled_swatch("gneiss", "metamorphic rock", MET, 2.4, 1.2, 9, 26).move_to([5.0, 0.55, 0])
        arrows = VGroup(*[Arrow(s[0].get_right(), mid.get_left(), buff=0.15, color=MUTED, stroke_width=4) for s in srcs])
        arrow_out = Arrow(mid.get_right(), out[0].get_left(), buff=0.15, color=MET, stroke_width=6)
        nomelt = pill("without melting completely", MET, 30).move_to([0, -1.65, 0])
        self.at(1)
        self.play(LaggedStart(*[FadeIn(s, shift=RIGHT * 0.15) for s in srcs], lag_ratio=0.25), run_time=0.9)
        self.at(1, 0.3)
        self.play(FadeIn(mid), FadeIn(icons), FadeIn(mid_lbl), Create(arrows), run_time=0.8)
        self.play(GrowArrow(arrow_out), FadeIn(out, shift=LEFT * 0.15), run_time=0.6)
        self.at(1, 0.78)
        self.play(FadeIn(nomelt, shift=UP * 0.15), run_time=0.45)

        # --- seg 2-3: heat from a batholith re-forms crystals
        block = Rectangle(width=8.0, height=2.0, fill_color="#7A6150", fill_opacity=1, stroke_color="#A8A29E",
                          stroke_width=2).move_to([-1.6, 1.0, 0])
        rng = np.random.default_rng(6)
        grains = VGroup(*[Dot(block.get_center() + [rng.uniform(-3.8, 3.8), rng.uniform(-0.9, 0.9), 0], 0.035,
                              color=rng.choice(["#D6D3D1", "#57534E"])) for _ in range(140)])
        dome = Sector(radius=2.4, angle=PI, start_angle=0, fill_color=MAGMA, fill_opacity=1, stroke_width=0)
        dome.stretch(0.42, 1).move_to([-1.6, -0.55, 0])
        heat = glow(MAGMA, 2.6, 8, 0.6).stretch(0.5, 1).move_to([-1.6, -0.2, 0])
        bat = VGroup(pill("Batholith: a huge magma intrusion", MAGMA, 26)).move_to([3.7, -1.35, 0])
        self.at(2, -0.1)
        self.play(FadeOut(VGroup(srcs, mid, icons, mid_lbl, out, arrows, arrow_out, nomelt)), run_time=0.4)
        self.play(FadeIn(block), FadeIn(grains), run_time=0.5)
        self.at(2, 0.4)
        self.play(FadeIn(heat), GrowFromEdge(dome, DOWN), run_time=0.9)
        self.play(FadeIn(bat, shift=LEFT * 0.15), run_time=0.4)
        new = VGroup(*[Polygon(*[c + 0.13 * np.array([np.cos(a), np.sin(a), 0]) * (1 + 0.3 * np.sin(2 * a + k))
                                 for a in np.linspace(0, 2 * np.pi, 7)[:-1]],
                               fill_color=["#E7E5E4", "#44403C", "#D6D3D1"][k % 3], fill_opacity=1, stroke_width=0)
                       for k, c in enumerate([block.get_center() + [x, y, 0] for x in np.linspace(-3.6, 3.6, 13)
                                              for y in (-0.6, 0.0, 0.6)])])
        reform = pill("crystals re-form as new crystals", MET, 26).move_to([3.5, 2.45, 0])
        self.at(3)
        self.play(FadeOut(grains, lag_ratio=0.01), LaggedStart(*[GrowFromCenter(n) for n in new], lag_ratio=0.02),
                  FadeIn(reform, shift=LEFT * 0.15), run_time=1.6)

        # --- seg 4: pressure folds the rock and lines crystals up into bands
        rock = Rectangle(width=5.6, height=2.3, fill_color="#9CA3AF", fill_opacity=1, stroke_color="#CBD5E1",
                         stroke_width=2).move_to([-2.6, 0.75, 0])
        rc = rock.get_center()
        angles = rng.uniform(0, PI, 90)
        specks = VGroup(*[Ellipse(width=0.22, height=0.08, fill_color=("#F1F5F9" if k % 2 else "#1F2937"), fill_opacity=1,
                                  stroke_width=0).rotate(angles[k]).move_to(rc + [rng.uniform(-2.6, 2.6),
                                                                                  rng.uniform(-1.0, 1.0), 0])
                          for k in range(90)])
        push = VGroup(Arrow(rc + LEFT * 4.4, rc + LEFT * 3.0, buff=0, color=MET, stroke_width=8),
                      Arrow(rc + RIGHT * 4.4, rc + RIGHT * 3.0, buff=0, color=MET, stroke_width=8),
                      Arrow(rc + UP * 2.2, rc + UP * 1.3, buff=0, color=MET, stroke_width=8))
        notes = VGroup(T("weight of rock above", 24, INK), T("plates collide → folding", 24, INK),
                       T("crystals squeezed into bands", 24, MET, SEMIBOLD)).arrange(DOWN, aligned_edge=LEFT, buff=0.25)
        notes.move_to([0, 0.75, 0]).align_to([2.35, 0, 0], LEFT)
        self.at(4, -0.1)
        self.play(FadeOut(VGroup(block, new, dome, heat, bat, reform)), run_time=0.4)
        self.play(FadeIn(rock), FadeIn(specks), run_time=0.5)
        self.play(GrowArrow(push[2]), FadeIn(notes[0]), run_time=0.5)
        self.at(4, 0.28)
        self.play(GrowArrow(push[0]), GrowArrow(push[1]), FadeIn(notes[1]), run_time=0.5)
        targets = []
        for k, s in enumerate(specks):
            row = k % 2
            band = (k // 2) % 5
            x = -2.5 + 5.0 * ((k // 10) / 8.0)
            y = -0.95 + 0.42 * band + 0.18 * row
            targets.append(rc + np.array([x, y, 0]))
        self.at(4, 0.55)
        self.play(*[s.animate.rotate(-angles[k]).move_to(t) for k, (s, t) in enumerate(zip(specks, targets))],
                  rock.animate.stretch(0.88, 0), run_time=1.6)
        fold = lambda p: p + np.array([0, 0.22 * np.sin((p[0] - rc[0]) * 1.3), 0])  # noqa: E731
        self.play(VGroup(rock, specks).animate.apply_function(fold), FadeIn(notes[2]), run_time=1.0)

        # --- seg 5: characteristics
        traits = VGroup(*[pill(t, MET, 28) for t in ("Harder", "Denser", "Often banded", "No fossils")]).arrange(RIGHT, buff=0.3)
        traits.move_to([0, -1.75, 0])
        self.at(5)
        for k, frac in enumerate((0.0, 0.12, 0.3, 0.62)):
            self.at(5, frac)
            self.play(FadeIn(traits[k], shift=UP * 0.12), run_time=0.35)
        self.finish()
