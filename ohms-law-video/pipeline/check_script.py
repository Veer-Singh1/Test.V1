"""Check that the narration segments in scenes.py match script.md word for word."""
import re
import sys

from .config import ROOT
from .scenes import SCENES


def norm(s):
    return re.sub(r"\s+", " ", s.replace("*", "")).strip()


def script_narration():
    text = (ROOT / "script.md").read_text()
    out = {}
    for m in re.finditer(r"^## Scene (\d+) — (.*?)(?=^## |\Z)", text, flags=re.M | re.S):
        lines = re.findall(r"^> (.*)$", m.group(0), flags=re.M)
        out[f"s{int(m.group(1)):02d}"] = norm(" ".join(lines))
    return out


def main():
    script, bad = script_narration(), 0
    for sc in SCENES:
        ours = norm(" ".join(s["text"] for s in sc["segments"] if not s["silent"]))
        if ours != script.get(sc["id"], ""):
            bad += 1
            print(f"MISMATCH {sc['id']}:\n  script: {script.get(sc['id'])}\n  scenes: {ours}")
    print("narration matches script.md" if not bad else f"{bad} scene(s) differ")
    return bad


if __name__ == "__main__":
    sys.exit(main())
