import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import quiz, recap_cards  # noqa: E402
from mine import *  # noqa: E402,F403


class S13Recap(Shot):
    def construct(self):
        recap_cards(self, "Quick recap", [
            ("Ore", ORE, ["worth the cost", "of mining"]),
            ("Mining", ORE, ["shaft: deep ore", "open cast: near", "the surface"]),
            ("Refining", PROC, ["physical, then", "chemical:", "reduction"]),
            ("Rehabilitation", GOOD, ["required by law", "when mining stops"]),
        ])


class S13Quiz(Shot):
    def construct(self):
        quiz(self, [f"PbO + C → Pb + CO: which substance is {col('reduced', PROC)}?",
                    "At 5 g per tonne, how many tonnes of ore give 1 kg of gold?",
                    "Which mining method suits coal close to the surface?"],
             ["PbO (lead oxide): it loses oxygen", "200 tonnes", "Open cast mining"])
