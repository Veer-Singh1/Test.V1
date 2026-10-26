import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from kit import *  # noqa: E402,F403
from pipeline.scenes import ASSETS  # noqa: E402

FIXED = ["Narration: AI voice (Kokoro TTS, voice af_heart, Apache-2.0)",
         "Music and sound effects: original, synthesised for this video",
         "Animation: Manim Community  ·  Font: Inter (SIL OFL 1.1)"]


def credit_lines():
    path = ROOT / "assets" / "credits.csv"
    if not path.exists():
        return ["Stock footage and photos: pending (Pexels, Pixabay, Wikimedia Commons)"] + FIXED
    out = []
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            desc = ASSETS.get(row["key"], {}).get("desc", row["key"])
            out.append(f"{desc}: {row['author']} / {row['source']} ({row['license']})")
    return out + FIXED


class S12End(Shot):
    """End card: the three equations, thanks, and credits."""

    def construct(self):
        eqs = VGroup(M(f"{cv()} = {ci()} × {cr()}", 52, INK, BOLD), M(f"P = {cv()} × {ci()}", 52, INK, BOLD),
                     M(f"{cr()} = ρL / A", 52, INK, BOLD)).arrange(RIGHT, buff=1.2).move_to(UP * 2.85)
        thanks = T("Thanks for watching!", 46, INK, SEMIBOLD).move_to(UP * 1.75)
        lines = credit_lines()
        head = T("CREDITS", 24, MUTED, BOLD)
        rows = VGroup(*[T(ln, 23, MUTED) for ln in lines]).arrange(DOWN, aligned_edge=LEFT, buff=0.14)
        if len(lines) > 9:
            half = (len(lines) + 1) // 2
            cols = VGroup(VGroup(*rows[:half]).copy(), VGroup(*rows[half:]).copy())
            for col_ in cols:
                col_.arrange(DOWN, aligned_edge=LEFT, buff=0.14)
            cols.arrange(RIGHT, aligned_edge=UP, buff=0.6)
            rows = cols
        if rows.width > 13.4:
            rows.scale_to_fit_width(13.4)
        block = VGroup(head, rows).arrange(DOWN, buff=0.25).next_to(thanks, DOWN, buff=0.55)
        self.play(LaggedStart(*[FadeIn(e, shift=UP * 0.15) for e in eqs], lag_ratio=0.25), run_time=0.8)
        self.play(FadeIn(thanks, shift=UP * 0.12), run_time=0.5)
        self.play(FadeIn(block), run_time=0.6)
        self.finish()
