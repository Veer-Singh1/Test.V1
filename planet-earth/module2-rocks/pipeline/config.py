"""Shared paths, video format, palette and timing constants."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"
ASSETS = ROOT / "assets"
FONTS = ROOT / "fonts"
MODELS = ROOT / "models"
TIMING_JSON = BUILD / "timing.json"

W, H, FPS = 1920, 1080, 30
SR = 48000  # final audio sample rate

# Palette (matches script.md)
NAVY = "#0B1A33"
PANEL = "#132A4F"
CYAN = "#22D3EE"    # current
AMBER = "#FBBF24"   # voltage
CORAL = "#FB7185"   # resistance
INK = "#F1F5F9"     # text
MUTED = "#94A3B8"

FONT = {w: FONTS / f"Inter-{w}.ttf" for w in ("Regular", "Medium", "SemiBold", "Bold", "ExtraBold")}

# Voiceover
VOICE = "af_heart"
LANG = "en-us"
VOICE_SPEED = 0.9
KOKORO_MODEL = MODELS / "kokoro" / "kokoro-v1.0.onnx"
KOKORO_VOICES = MODELS / "kokoro" / "voices-v1.0.bin"
# espeak gets these words wrong; patch them at the phoneme level
PHONEME_FIXES = {
    "nˈɪʃɹoʊm": "nˈaɪkɹoʊm",   # nichrome -> NY-krohm
    "dʒˈɔːɹɡ": "ɡˈeɪɔːɹɡ",     # Georg -> GAY-org
}

# Timeline
GAP = 0.35        # default pause between narration segments
PAD_IN = 0.45     # silence at the start of a narrated scene
PAD_OUT = 0.55    # silence at the end of a narrated scene
XFADE = 0.4       # crossfade between shots
SHOT_LEAD = 0.15  # cut to a new shot slightly before its sentence starts
TARGET_TOTAL = 480.0  # 8:00
MIN_TEXT_SECONDS = 2.0
