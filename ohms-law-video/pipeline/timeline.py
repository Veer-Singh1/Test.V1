"""Turn narration durations into a frame-accurate timeline of scenes, segments and shots."""
import json
import string

from .config import FPS, GAP, PAD_IN, PAD_OUT, SHOT_LEAD, TIMING_JSON, XFADE
from .scenes import SCENES


def q(t):
    """Quantise a time to the frame grid."""
    return round(t * FPS) / FPS


def seg_id(scene, i):
    return f"{scene['id']}_{i + 1:02d}"


def build(durations):
    """durations: {segment id: seconds of trimmed speech}. Returns the timeline dict."""
    scenes, shots, t0 = [], [], 0.0
    for sc in SCENES:
        segs, t = [], PAD_IN
        n = len(sc["segments"])
        for i, s in enumerate(sc["segments"]):
            sid = seg_id(sc, i)
            d = s["silent"] if s["silent"] else durations[sid]
            segs.append({"id": sid, "text": s["text"], "start": t, "end": t + d, "silent": bool(s["silent"])})
            pause = s["gap"] if s["gap"] is not None else (PAD_OUT if i == n - 1 else GAP)
            t += d + pause
        dur = q(sc["fixed"] if sc.get("fixed") else t)
        scenes.append({"id": sc["id"], "title": sc["title"], "start": q(t0), "duration": dur, "segments": segs})

        starts = []
        for k, sh in enumerate(sc["shots"]):
            if k == 0:
                starts.append(0.0)
                continue
            s = segs[sh["from"]]
            st = s["start"] + sh["frac"] * (s["end"] - s["start"])
            starts.append(q(st - (SHOT_LEAD if sh["frac"] == 0 else 0.0)))
        starts.append(dur)
        for k, sh in enumerate(sc["shots"]):
            a, b = starts[k], starts[k + 1]
            rel = [{"id": s["id"], "text": s["text"], "start": round(s["start"] - a, 4),
                    "end": round(s["end"] - a, 4), "silent": s["silent"]}
                   for s in segs if s["end"] > a and s["start"] < b]
            shot = {k2: v for k2, v in sh.items() if k2 not in ("from", "frac")}
            shot.update({"id": f"{sc['id']}{string.ascii_lowercase[k]}", "scene": sc["id"],
                         "start": q(t0 + a), "duration": q(b - a), "segs": rel})
            shots.append(shot)
        t0 += dur

    for i, sh in enumerate(shots):
        sh["tail"] = XFADE if i < len(shots) - 1 else 0.0
    return {"fps": FPS, "xfade": XFADE, "total": q(t0), "scenes": scenes, "shots": shots}


def save(tl):
    TIMING_JSON.parent.mkdir(parents=True, exist_ok=True)
    TIMING_JSON.write_text(json.dumps(tl, indent=1, ensure_ascii=False))


def load():
    return json.loads(TIMING_JSON.read_text())
