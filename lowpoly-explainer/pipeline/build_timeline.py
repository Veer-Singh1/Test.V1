"""Steps 6 and 7: shot list, caption chunks and overlay cues -> public/<slug>/timeline.json

Shot rules (from the spec):
  one shot per sentence that carries a "shot"; sentences without one continue the previous shot
  a shot starts on its first word
  a shot under 1 s merges into the one before it; a shot over 6 s splits in two
Caption rules:
  chunks of up to 3 words and 16 characters, breaking after punctuation
  a chunk shows from its first word to the next chunk's first word
"""
import argparse
import json

from common import FPS, duration, load_script, norm, out_dir, sentences

MAX_SHOT, MIN_SHOT = 6.0, 1.0
TAIL = 0.5  # seconds held after the last word
ALT_CAMERA = {
    "push_in": "track_right", "pull_out": "track_left", "track_left": "push_in",
    "track_right": "push_in", "orbit_low": "push_in", "top_down": "push_in",
}


def f(seconds: float) -> int:
    return int(round(seconds * FPS))


def build_shots(script, words, total):
    shots = []
    for si, (beat, s) in enumerate(sentences(script)):
        if "shot" not in s and shots:
            continue
        start = next(w["s"] for w in words if w["sent"] == si)
        spec = dict(s.get("shot") or {"scene": "skyline", "camera": "push_in", "time": "night"})
        shots.append({"start": 0.0 if not shots else start, "beat": beat, **spec})
    for a, b in zip(shots, shots[1:]):
        a["end"] = b["start"]
    shots[-1]["end"] = total

    merged = []
    for sh in shots:
        if merged and sh["end"] - sh["start"] < MIN_SHOT:
            merged[-1]["end"] = sh["end"]
        else:
            merged.append(sh)

    final = []
    for sh in merged:
        length = sh["end"] - sh["start"]
        if length > MAX_SHOT and sh["scene"] != "title":
            # Cut on the word boundary nearest the midpoint.
            mid = sh["start"] + length / 2
            cut = min((w["s"] for w in words if sh["start"] + 1 < w["s"] < sh["end"] - 1),
                      key=lambda t: abs(t - mid), default=mid)
            final.append({**sh, "end": cut})
            final.append({**sh, "start": cut, "camera": ALT_CAMERA.get(sh["camera"], "push_in"), "variant": 1})
        else:
            final.append(sh)

    out = []
    for i, sh in enumerate(final):
        start, end = sh.pop("start"), sh.pop("end")
        out.append({"from": f(start), "to": f(end), "seed": i, **sh})
    return out


def build_captions(words, total):
    chunks, cur = [], []
    for w in words:
        text_len = sum(len(x["w"]) for x in cur) + len(cur) + len(w["w"])
        if cur and (len(cur) >= 3 or text_len > 16 or cur[-1]["w"][-1] in ".,?!:;"):
            chunks.append(cur)
            cur = []
        cur.append(w)
    if cur:
        chunks.append(cur)
    out = []
    for i, ch in enumerate(chunks):
        end = chunks[i + 1][0]["s"] if i + 1 < len(chunks) else total
        out.append({
            "from": f(ch[0]["s"]), "to": f(end),
            "words": [{"w": w["w"].strip(".,?!:;").upper(), "from": f(w["s"])} for w in ch],
        })
    return out


def build_overlays(script, words, total):
    hold = {"badge": 1.9, "kicker": 1.9, "nametag": 2.2}
    out = []
    for si, (_, s) in enumerate(sentences(script)):
        ov = s.get("overlay")
        if not ov:
            continue
        ov = dict(ov)
        key = norm(ov.pop("on_word", ""))
        sent_words = [w for w in words if w["sent"] == si]
        start = next((w["s"] for w in sent_words if norm(w["w"]) == key), sent_words[0]["s"])
        out.append({"from": f(start), "to": f(min(total, start + hold[ov["kind"]])), **ov})
    for a, b in zip(out, out[1:]):
        a["to"] = min(a["to"], b["from"])
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    args = ap.parse_args()

    d = out_dir(args.slug)
    script = load_script(args.slug)
    words = json.loads((d / "words.json").read_text())
    total = duration(d / "voice.wav") + TAIL

    timeline = {
        "fps": FPS,
        "durationInFrames": f(total),
        "audio": f"{args.slug}/voice.wav",
        "title": script["title"],
        "shots": build_shots(script, words, total),
        "captions": build_captions(words, total),
        "overlays": build_overlays(script, words, total),
    }
    (d / "timeline.json").write_text(json.dumps(timeline, indent=1))
    lens = sorted((s["to"] - s["from"]) / FPS for s in timeline["shots"])
    print(f"{len(timeline['shots'])} shots (median {lens[len(lens) // 2]:.1f} s, "
          f"min {lens[0]:.1f}, max {lens[-1]:.1f}), {len(timeline['captions'])} caption chunks, "
          f"{len(timeline['overlays'])} overlays, {total:.1f} s")


if __name__ == "__main__":
    main()
