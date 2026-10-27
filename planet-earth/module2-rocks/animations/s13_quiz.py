import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import quiz, recap_cards  # noqa: E402
from geo import *  # noqa: E402,F403


class S13Recap(Shot):
    def construct(self):
        recap_cards(self, "Quick recap", [
            ("Igneous", IGN, ["magma or lava cools", "crystals", "no layers, no fossils"]),
            ("Sedimentary", SED, ["compacted & cemented", "strata (layers)", "fossils"]),
            ("Metamorphic", MET, ["heat & pressure", "harder, denser", "often banded"]),
        ])


class S13Quiz(Shot):
    def construct(self):
        quiz(self, ["Why does granite have large crystals?", "What does limestone become when it is metamorphosed?",
                    "Which two processes turn loose sand into sandstone?"],
             ["It cooled slowly, deep underground", "Marble", "Compaction and cementation"])
