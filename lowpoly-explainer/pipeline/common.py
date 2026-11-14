"""Shared helpers for the pipeline scripts."""
import json
import os
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODELS = Path(os.environ.get("EXPLAINER_MODELS", ROOT / "models"))
FPS = 30


def story_dir(slug: str) -> Path:
    return ROOT / "stories" / slug


def out_dir(slug: str) -> Path:
    d = ROOT / "public" / slug
    d.mkdir(parents=True, exist_ok=True)
    return d


def load_script(slug: str) -> dict:
    return json.loads((story_dir(slug) / "script.json").read_text())


def sentences(script: dict):
    """Yield (beat_type, sentence_dict) in reading order."""
    for beat in script["beats"]:
        for s in beat["sentences"]:
            yield beat["type"], s


def split_words(text: str) -> list[str]:
    return text.split()


def norm(word: str) -> str:
    """Lowercase and strip punctuation so script and recognised words compare."""
    return re.sub(r"[^a-z0-9]", "", word.lower())


def run(cmd: list[str]) -> str:
    return subprocess.run(cmd, check=True, capture_output=True, text=True).stderr


def duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        check=True, capture_output=True, text=True,
    ).stdout
    return float(out.strip())
