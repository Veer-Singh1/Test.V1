"""Write the narration as plain text, one paragraph per beat, for pasting into the ElevenLabs app.

  python pipeline/export_text.py brinks   ->  stories/brinks/voice_script.txt
"""
import argparse

from common import load_script, story_dir


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    args = ap.parse_args()
    script = load_script(args.slug)
    paras = [" ".join(s["text"] for s in beat["sentences"]) for beat in script["beats"]]
    out = story_dir(args.slug) / "voice_script.txt"
    out.write_text("\n\n".join(paras) + "\n")
    text = " ".join(paras)
    print(f"wrote {out}: {len(text.split())} words, {len(text)} characters")


if __name__ == "__main__":
    main()
