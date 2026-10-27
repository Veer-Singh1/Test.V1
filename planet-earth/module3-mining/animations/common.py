"""Reusable scene builders shared by the Planet Earth modules: title card, flip cards
(trap/myth -> fact), recap cards, the three-question quiz with countdown, and the end card."""
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from kit import *  # noqa: E402,F403
from pipeline.scenes import ASSETS  # noqa: E402

FIXED_CREDITS = ["Narration: AI voice (Kokoro TTS, voice af_heart, Apache-2.0)",
                 "Music and sound effects: original, synthesised for this video",
                 "Animation: Manim Community  ·  Font: Inter (SIL OFL 1.1)",
                 "Content based on the WBHS Grade 9 study guide 'Planet Earth: Units 1–3'"]


def check_icon(color=GREEN, s=0.3):
    return VMobject(stroke_color=color, stroke_width=8).set_points_as_corners(
        [LEFT * s + UP * 0.05, LEFT * s * 0.25 + DOWN * s * 0.7, RIGHT * s + UP * s * 0.75])


def lines(rows, size=30, color=INK, weight=MEDIUM, buff=0.12):
    return VGroup(*[T(r, size, color, weight) for r in rows]).arrange(DOWN, buff=buff)


def title_card(scene, title, parts, deco=None):
    """parts: [(text, colour), ...] shown under the title, separated by dots."""
    if deco is not None:
        scene.sfx("whoosh", -4)
        scene.play(Create(deco, lag_ratio=0.15), run_time=0.8)
    t = T(title, 80, INK, BOLD).move_to(UP * 0.55)
    if t.width > 12.5:
        t.scale_to_fit_width(12.5)
    row = VGroup()
    for k, (txt, c) in enumerate(parts):
        if k:
            row.add(T("·", 36, MUTED, BOLD))
        row.add(T(txt, 36, c, SEMIBOLD))
    row.arrange(RIGHT, buff=0.3).next_to(t, DOWN, buff=0.45)
    scene.to(0.85)
    scene.sfx("click")
    scene.play(FadeIn(t, shift=UP * 0.25, scale=0.95), run_time=0.5)
    scene.to(1.6)
    scene.play(LaggedStart(*[FadeIn(m, shift=UP * 0.15) for m in row], lag_ratio=0.2), run_time=0.7)
    scene.finish()


def flip_cards(scene, heading, items, bad_word="TRAP", first_seg=1):
    """items: [(bad_rows, good_rows)]; card k shows bad at segment first_seg+2k, flips at first_seg+2k+1."""
    head = T(heading, 52, INK, BOLD).move_to(UP * 3.3)
    xs = (-4.55, 0.0, 4.55)
    cards = [card(4.3, 4.9, CORAL).move_to([x, 0.35, 0]) for x in xs]
    scene.at(0, -0.2)
    scene.play(FadeIn(head, shift=DOWN * 0.2), run_time=0.5)
    for k, (bad, good) in enumerate(items):
        c = cards[k]
        st_bad = pill(bad_word, CORAL, 30).move_to(c.get_top() + DOWN * 0.6)
        tx_bad = lines(bad, 30, INK, SEMIBOLD).move_to(c.get_center() + UP * 0.2)
        tx_good = lines(good, 28, INK, SEMIBOLD).move_to(c.get_center() + UP * 0.1)
        for m in (tx_bad, tx_good):
            if m.width > 3.9:
                m.scale_to_fit_width(3.9)
        scene.at(first_seg + 2 * k)
        scene.sfx("pop")
        scene.play(FadeIn(c, shift=UP * 0.2), FadeIn(st_bad, scale=1.3), FadeIn(tx_bad), run_time=0.55)
        st_good = pill("FACT", CYAN, 30).move_to(st_bad)
        tick = check_icon(CYAN).move_to(c.get_bottom() + UP * 0.75)
        scene.at(first_seg + 2 * k + 1, 0.03)
        scene.sfx("click")
        scene.play(c.animate.set_stroke(CYAN), ReplacementTransform(st_bad, st_good),
                   FadeOut(tx_bad, shift=UP * 0.2), FadeIn(tx_good, shift=UP * 0.2), run_time=0.6)
        scene.play(Create(tick), run_time=0.35)
    scene.finish()


def recap_cards(scene, heading, cards_data, seg_for=None, footer=None, footer_seg=None):
    """cards_data: [(name, colour, rows)]; card k appears at segment seg_for[k] (default k+1)."""
    head = T(heading, 52, INK, BOLD).move_to(UP * 3.3)
    n = len(cards_data)
    w = 4.3 if n == 3 else 3.25
    xs = np.linspace(-(n - 1) / 2, (n - 1) / 2, n) * (w + 0.25)
    groups = []
    for (name, color, rows), x in zip(cards_data, xs):
        c = card(w, 3.4, color, stroke=3).move_to([x, 1.0, 0])
        title = T(name, 40 if n == 3 else 34, color, BOLD).move_to(c.get_top() + DOWN * 0.55)
        body = lines(rows, 28 if n == 3 else 25, INK, MEDIUM, 0.14).next_to(title, DOWN, buff=0.3)
        if body.width > w - 0.3:
            body.scale_to_fit_width(w - 0.3)
        groups.append(VGroup(c, title, body))
    seg_for = seg_for or list(range(1, n + 1))
    scene.at(0, -0.25)
    scene.play(FadeIn(head, shift=DOWN * 0.2), run_time=0.5)
    for g, s in zip(groups, seg_for):
        scene.at(s)
        scene.sfx("pop", -2)
        scene.play(FadeIn(g, shift=UP * 0.2), run_time=0.55)
    if footer is not None:
        scene.at(footer_seg, 0.2)
        scene.sfx("click")
        scene.play(FadeIn(footer.move_to([0, -1.45, 0]), scale=0.9), run_time=0.5)
    scene.finish()


def quiz(scene, questions, answers):
    """Segments: 0 'your turn', 1-3 questions, 4 silent countdown, 5 'Answers!', 6-8 answers, 9 closer."""
    head = T("Your turn", 52, INK, BOLD).move_to([-4.3, 3.3, 0])
    bars = VGroup(Rectangle(width=0.12, height=0.42), Rectangle(width=0.12, height=0.42)).arrange(RIGHT, buff=0.12)
    pause = VGroup(bars.set_fill(MUTED, 1).set_stroke(width=0), T("Pause if you need more time", 28, MUTED))
    pause.arrange(RIGHT, buff=0.25).move_to([3.5, 3.3, 0])
    ys = (1.85, 0.2, -1.45)
    cards, rows, ans = [], [], []
    for k, y in enumerate(ys):
        c = card(12.4, 1.45, MUTED).move_to([0, y, 0])
        badge = VGroup(Circle(radius=0.34, fill_color=PANEL_HI, fill_opacity=1, stroke_color=INK, stroke_width=3),
                       T(str(k + 1), 32, INK, BOLD)).move_to([-5.55, y, 0])
        badge[1].move_to(badge[0])
        q = (M if "<span" in questions[k] else T)(questions[k], 32, INK, MEDIUM)
        q.move_to([0, y + 0.3, 0]).align_to([-4.95, 0, 0], LEFT)
        a = (M if "<span" in answers[k] else T)(answers[k], 30, GREEN, SEMIBOLD)
        a.move_to([0, y - 0.33, 0]).align_to([-4.95, 0, 0], LEFT)
        for m in (q, a):
            if m.width > 10.2:
                m.scale_to_fit_width(10.2).align_to([-4.95, 0, 0], LEFT)
        cards.append(c)
        rows.append(VGroup(c, badge, q))
        ans.append(a)
    scene.at(0, -0.1)
    scene.play(FadeIn(head, shift=DOWN * 0.2), FadeIn(pause), run_time=0.5)
    for k in range(3):
        scene.at(1 + k)
        scene.sfx("pop", -2)
        scene.play(FadeIn(rows[k], shift=UP * 0.2), run_time=0.5)
    cc = np.array([5.95, 3.3, 0])
    left = ValueTracker(1.0)
    ring_bg = Circle(radius=0.4, color=PANEL_HI, stroke_width=8).move_to(cc)
    ring = always_redraw(lambda: Arc(radius=0.4, start_angle=PI / 2, angle=max(1e-3, 2 * PI * left.get_value()),
                                     color=CYAN, stroke_width=8, arc_center=cc))
    scene.at(4)
    scene.play(FadeOut(pause), FadeIn(ring_bg), run_time=0.3)
    scene.add(ring)
    start, num = scene.s(4), None
    for k in range(5):
        new = T(str(5 - k), 36, INK, BOLD).move_to(cc)
        scene.to(start + k)
        scene.sfx("tick", -4)
        if num is not None:
            scene.remove(num)
        scene.add(new)
        num = new
        scene.play(left.animate.set_value(1 - (k + 1) / 5), run_time=0.98, rate_func=linear)
    head2 = T("Answers", 52, GREEN, BOLD).move_to(head)
    scene.at(5)
    scene.play(FadeOut(ring), FadeOut(ring_bg), FadeOut(num), ReplacementTransform(head, head2), run_time=0.45)
    checks = []
    for k in range(3):
        scene.at(6 + k)
        scene.sfx("ding", -4)
        chk = check_icon().move_to([5.6, ys[k], 0])
        checks.append(chk)
        scene.play(cards[k].animate.set_stroke(GREEN, 4), FadeIn(ans[k], shift=UP * 0.12), Create(chk), run_time=0.55)
    scene.at(9, 0.3)
    scene.play(LaggedStart(*[Indicate(c, color=GREEN, scale_factor=1.35) for c in checks], lag_ratio=0.3), run_time=1.3)
    scene.finish()


def credit_lines():
    path = ROOT / "assets" / "credits.csv"
    if not path.exists():
        return ["Stock footage and photos: pending (Pexels, Pixabay, Wikimedia Commons)"] + FIXED_CREDITS
    out = []
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            desc = ASSETS.get(row["key"], {}).get("desc", row["key"])
            out.append(f"{desc}: {row['author']} / {row['source']} ({row['license']})")
    return out + FIXED_CREDITS


def end_card(scene, summary):
    summary.move_to(UP * 2.85)
    if summary.width > 13.2:
        summary.scale_to_fit_width(13.2)
    thanks = T("Thanks for watching!", 46, INK, SEMIBOLD).move_to(UP * 1.75)
    rows = VGroup(*[T(ln, 23, MUTED) for ln in credit_lines()]).arrange(DOWN, aligned_edge=LEFT, buff=0.14)
    if rows.width > 13.4:
        rows.scale_to_fit_width(13.4)
    block = VGroup(T("CREDITS", 24, MUTED, BOLD), rows).arrange(DOWN, buff=0.25).next_to(thanks, DOWN, buff=0.55)
    scene.play(LaggedStart(*[FadeIn(e, shift=UP * 0.15) for e in summary], lag_ratio=0.25), run_time=0.8)
    scene.play(FadeIn(thanks, shift=UP * 0.12), run_time=0.5)
    scene.play(FadeIn(block), run_time=0.6)
    scene.finish()
