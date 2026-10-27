import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import flip_cards  # noqa: E402
from kit import Shot  # noqa: E402


class S12Traps(Shot):
    """Three exam traps, each flipped to the fact."""

    def construct(self):
        flip_cards(self, "Three exam traps", [
            (["Weathering", "= erosion"], ["Weathering: breaks", "rock down in place", "Erosion: wears it", "away and carries it off"]),
            (["Metamorphic", "rock melts"], ["It changes while", "it is still solid", "Melted rock", "= magma"]),
            (["The cycle starts", "with igneous rock"], ["No start,", "no end", "Any rock can become", "any other type"]),
        ])
