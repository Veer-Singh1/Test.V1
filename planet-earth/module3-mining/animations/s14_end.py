import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import end_card  # noqa: E402
from mine import *  # noqa: E402,F403


class S14End(Shot):
    def construct(self):
        parts = [("Ore", ORE), ("Mine", INK), ("Refine", PROC), ("Rehabilitate", GOOD)]
        row = VGroup()
        for k, (t, c) in enumerate(parts):
            if k:
                row.add(T("→", 44, MUTED, BOLD))
            row.add(T(t, 48, c, BOLD))
        end_card(self, row.arrange(RIGHT, buff=0.35))
