"""Build a documentary timeline (public/<slug>/<out>.json) from a storyboard and the recorded voice parts.

  python pipeline/build_doc.py dragons                       # stories/dragons/storyboard.json
  python pipeline/build_doc.py dragons --board short.json    # the Short

The narration is recorded in parts (public/<slug>/voice/01.mp3 ... ). Each part is trimmed of silence and
the parts are joined with short gaps, longer where a card (title, chapter) sits between them. Each part is
aligned separately against its text in stories/<slug>/script.md ("## 01 · ..." sections), which keeps the
recogniser on track. Shots in the storyboard start at a phrase of a part ("at"), or fill a silence
inserted before a part ("before": seconds), or after the last part ("after": seconds).
"""
import argparse
import json
import re
import subprocess
from pathlib import Path

from PIL import Image

from align import recognise, snap
from common import ROOT, duration, norm, split_words

FPS = 30
FADE = 15  # frames; must match src/doc/types.ts
LEAD = 0.2  # a cut lands this much before the word it is cued on


def script_parts(slug):
    text = (ROOT / "stories" / slug / "script.md").read_text()
    parts = {}
    for m in re.finditer(r"^## (\w+) · [^\n]*\n(.*?)(?=^## |\Z)", text, re.S | re.M):
        body = m.group(2).split("\n---")[0].strip()
        parts[m.group(1)] = re.sub(r"\s+", " ", body)
    return parts


def find_voice(folder, part):
    for ext in ("wav", "mp3", "m4a", "flac", "ogg"):
        p = folder / f"{part}.{ext}"
        if p.exists():
            return p
    raise SystemExit(f"no recording for part {part} in {folder}")


def trimmed(src, dst):
    """48 kHz mono, silence trimmed from both ends (keeping a breath of 0.1 s)."""
    trim = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.1,areverse,"
            "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15,areverse")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-af", trim, "-ar", "48000", "-ac", "1", str(dst)],
                   check=True)
    return duration(dst)


def phrases(text, limit=62):
    """Subtitle phrases: sentences, and long sentences split into balanced pieces, preferring a break
    after a comma or before "and"/"but"/"then" near each balanced point."""
    out = []
    for sent in re.findall(r"[^.!?]+[.!?]+[\"”]?|[^.!?]+$", text):
        sent = sent.strip()
        while len(sent) > limit:
            n = -(-len(sent) // limit)  # pieces still needed
            target = len(sent) / n
            spaces = [m.start() for m in re.finditer(" ", sent)]
            def cost(i):
                good = sent[i - 1] in ",;:" or sent[i + 1:].startswith(("and ", "but ", "then "))
                return abs(i - target) - (10 if good else 0)
            cut = min((i for i in spaces if 12 < i < len(sent) - 12), key=cost)
            out.append(sent[:cut].strip())
            sent = sent[cut:].strip()
        if sent:
            out.append(sent)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--board", default="storyboard.json")
    ap.add_argument("--voice-dir", default="voice", help="folder in public/<slug> with the recorded parts")
    args = ap.parse_args()

    story = ROOT / "stories" / args.slug
    pub = ROOT / "public" / args.slug
    board = json.loads((story / args.board).read_text())
    texts = script_parts(args.slug)
    work = pub / args.voice_dir / "trimmed"
    work.mkdir(parents=True, exist_ok=True)

    # 1. lay the parts out in time
    before = {}
    for s in board["shots"]:
        if "before" in s:
            before[s["part"]] = before.get(s["part"], 0) + s["before"]
    t, layout, pieces = board.get("preroll", 0.4), {}, []
    for part in board["parts"]:
        t += before.get(part, board.get("gap", 0.6) if layout else 0)
        wav = work / f"{part}.wav"
        src = find_voice(pub / args.voice_dir, part)
        dur = duration(wav) if wav.exists() and wav.stat().st_mtime > src.stat().st_mtime else trimmed(src, wav)
        layout[part] = (t, dur)
        pieces.append((t, wav))
        t += dur
    after = sum(s.get("after", 0) for s in board["shots"])
    total = t + board.get("tail", 0.8) + after

    # 2. one narration file, silence between the parts, loudness for YouTube (-14 LUFS)
    inputs, filters = [], []
    for i, (start, wav) in enumerate(pieces):
        inputs += ["-i", str(wav)]
        filters.append(f"[{i}]adelay={int(start * 1000)}:all=1[a{i}]")
    mix = "".join(f"[a{i}]" for i in range(len(pieces)))
    filters.append(f"{mix}amix=inputs={len(pieces)}:normalize=0,apad,atrim=0:{total:.3f},"
                   "loudnorm=I=-14:TP=-1.5:LRA=11,aformat=channel_layouts=stereo[out]")
    voice_out = board.get("voice_out", "narration.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", ";".join(filters), "-map", "[out]",
                    "-ar", "48000", str(pub / voice_out)], check=True)

    # 3. word times for every part
    words = {}
    for part, (start, dur) in layout.items():
        sw = split_words(texts[part])
        wav = work / f"{part}.wav"
        cache = work / f"{part}.heard.json"
        stamp = [wav.stat().st_size, round(wav.stat().st_mtime)]
        cached = json.loads(cache.read_text()) if cache.exists() else {}
        if cached.get("stamp") == stamp:
            heard = [tuple(h) for h in cached["heard"]]
        else:
            heard = recognise(wav)
            cache.write_text(json.dumps({"stamp": stamp, "heard": heard}))
        starts = snap(sw, heard, dur)
        hit = len(set(map(norm, sw)) & set(norm(w) for w, _ in heard))
        print(f"part {part}: {len(sw)} words, {len(heard)} heard, {hit} distinct in common, {dur:.1f} s")
        words[part] = [(w, start + s) for w, s in zip(sw, starts)]

    def cue(part, phrase, after_t=0.0):
        target = [norm(w) for w in split_words(phrase)]
        ws = words[part]
        for i in range(len(ws) - len(target) + 1):
            if ws[i][1] >= after_t and [norm(w) for w, _ in ws[i:i + len(target)]] == target:
                return ws[i][1]
        raise SystemExit(f'cue "{phrase}" not found in part {part}')

    # 4. shots
    shots, filled, last_t = [], {}, 0.0
    for s in board["shots"]:
        s = dict(s)
        part = s.pop("part", None)
        if "before" in s:
            gap_start = layout[part][0] - before[part]
            t0 = gap_start + filled.get(part, 0)
            filled[part] = filled.get(part, 0) + s.pop("before")
        elif "after" in s:
            t0 = layout[board["parts"][-1]][0] + layout[board["parts"][-1]][1] + board.get("tail", 0.8)
            s.pop("after")
        else:
            t0 = max(0.0, cue(part, s.pop("at"), last_t if part == shots[-1].get("_part") else 0.0) - LEAD) \
                if shots else 0.0
            if not shots:
                s.pop("at", None)
        last_t = t0
        s["_part"] = part
        s["from"] = round(t0 * FPS)
        if s["kind"] == "art" and s.get("src"):
            if (pub / "art" / s["src"]).exists():
                with Image.open(pub / "art" / s["src"]) as im:
                    s["w"], s["h"] = im.size
            else:
                print(f"warning: art {s['src']} is missing")
        shots.append(s)
    n = round(total * FPS)
    for a, b in zip(shots, shots[1:]):
        a["to"] = b["from"] + FADE
    shots[-1]["to"] = n
    for s in shots:
        s.pop("_part")
        if s["kind"] == "clip":
            clip = pub / "clips" / s["src"]
            if clip.exists():
                have = duration(clip) - s.get("clip_start", 0)
                need = (s["to"] - s["from"]) / FPS * s.get("rate", 1)
                if need > have + 0.05:
                    print(f"warning: {s['src']} has {have:.1f} s from {s.get('clip_start', 0)} s but the shot needs {need:.1f} s")
            else:
                print(f"warning: clip {s['src']} not rendered yet")

    # 5. subtitles
    captions = []
    for part in board["parts"]:
        ws, k = words[part], 0
        for ph in phrases(texts[part]):
            m = len(split_words(ph))
            if m == 0:
                continue
            a = ws[k][1]
            b = ws[k + m][1] - 0.05 if k + m < len(ws) else layout[part][0] + layout[part][1] + 0.3
            captions.append({"from": round(a * FPS), "to": round(b * FPS), "text": ph})
            k += m

    sfx = []
    for e in board.get("sfx", []):
        t0 = cue(e["part"], e["at"]) + e.get("offset", 0) if "at" in e else e.get("t", 0)
        sfx.append({"src": e["src"], "from": max(0, round(t0 * FPS)), "volume": e.get("volume", 0.5)})

    w, h = board.get("size", [1920, 1080])
    tl = {"fps": FPS, "width": w, "height": h, "durationInFrames": n, "audio": voice_out, "shots": shots,
          "captions": captions, "sfx": sfx}
    if board.get("music"):
        tl["music"] = board["music"]
    out = pub / board.get("out", "doc.json")
    out.write_text(json.dumps(tl, indent=1))
    print(f"wrote {out}: {n / FPS:.1f} s, {len(shots)} shots, {len(captions)} subtitles")


if __name__ == "__main__":
    main()
