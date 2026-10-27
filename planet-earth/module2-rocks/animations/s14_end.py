import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import end_card  # noqa: E402
from geo import *  # noqa: E402,F403


class S14End(Shot):
    def construct(self):
        row = VGroup(T("Igneous: cooled", 40, IGN, BOLD), T("·", 40, MUTED), T("Sedimentary: layered", 40, SED, BOLD),
                     T("·", 40, MUTED), T("Metamorphic: changed", 40, MET, BOLD)).arrange(RIGHT, buff=0.3)
        end_card(self, row)
