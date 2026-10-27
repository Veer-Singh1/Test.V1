"""Quality checks on final_video.mp4; writes qc_report.md.

Checks: stream format, audio/video duration match, black frames, long silences, on-screen text
duration and position, subtitle timing, credits/licence coverage, and the on-screen arithmetic.
"""
import csv
import json
import re
import subprocess

from . import subtitles, timeline
from .config import ASSETS, BUILD, MIN_TEXT_SECONDS, ROOT
from .media import LABEL_FADE, asset_file
from .scenes import ASSETS as WANTED, MATH_CHECKS

ALLOWED = re.compile(r"^(Pexels License|Pixabay Content License|CC0.*|Public domain|PD.*|CC BY \d(\.\d)?)$")


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def ffmpeg_log(path, *filters):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), *filters, "-f", "null", "-"],
                       capture_output=True, text=True)
    return r.stderr


def main():
    tl = timeline.load()
    final = ROOT / "final_video.mp4"
    rep, problems = [], []

    def ok(cond, msg):
        rep.append(f"- {'✅' if cond else '❌'} {msg}")
        if not cond:
            problems.append(msg)

    # --- format and sync
    info = probe(final)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    a = next(s for s in info["streams"] if s["codec_type"] == "audio")
    vd, ad = float(v["duration"]), float(a["duration"])
    rep.append("## Format and sync")
    ok(v["width"] == 1920 and v["height"] == 1080 and v["r_frame_rate"] == "30/1",
       f"video {v['width']}x{v['height']} @ {v['r_frame_rate']} fps, {v['codec_name']}")
    ok(abs(vd - tl["total"]) < 0.05, f"video length {vd:.2f}s matches the timeline ({tl['total']:.2f}s)")
    ok(abs(vd - ad) < 1 / 30 + 0.03, f"audio {ad:.2f}s vs video {vd:.2f}s (drift {abs(vd - ad) * 1000:.0f} ms)")
    ok(int(a["sample_rate"]) == 48000 and a["channels"] == 2, f"audio {a['codec_name']} {a['sample_rate']} Hz, {a['channels']} ch")

    # --- black frames: pix_th 0.05 so the navy background (#0B1A33) is not counted as black
    log = ffmpeg_log(final, "-vf", "blackdetect=d=0.1:pix_th=0.05", "-an")
    blacks = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", log)
    rep.append("\n## Black frames and silence")
    ok(not blacks, f"black frames: {len(blacks)} run(s)" + (f" {blacks[:5]}" if blacks else ""))
    log = ffmpeg_log(final, "-af", "silencedetect=n=-50dB:d=2", "-vn")
    sil = re.findall(r"silence_start: ([\d.]+)", log)
    ok(not sil, f"stretches of near-silence (< -50 dB for 2 s+): {len(sil)}" + (f" at {sil}" if sil else ""))

    # --- on-screen text
    rep.append("\n## On-screen text")
    short, outside, zone = [], [], []
    for f in sorted((BUILD / "qc").glob("text_*.json")):
        shot = f.stem[5:]
        for t in json.loads(f.read_text()):
            dur = t["end"] - t["start"]
            name = t["text"][:40].replace("\n", " ")
            if shot == "s11b" and re.fullmatch(r"[1-5]", t["text"]):
                continue  # countdown digits change every second by design; the ring and cards stay up 5 s
            if dur < MIN_TEXT_SECONDS:
                short.append(f"{shot} '{name}' {dur:.2f}s")
            if "box" not in t:
                continue
            left, right, bottom, top = t["box"]
            if left < -7.05 or right > 7.05 or top > 3.98 or bottom < -3.98:
                outside.append(f"{shot} '{name}' box={t['box']}")
            if bottom < -2.4 and not shot.startswith("s12"):
                zone.append(f"{shot} '{name}' bottom={bottom}")
    ok(not short, f"Manim text on screen for ≥ {MIN_TEXT_SECONDS:.0f}s: {len(short)} exception(s)")
    rep += [f"  - {s}" for s in short]
    ok(not outside, f"Manim text inside the frame: {len(outside)} exception(s)")
    rep += [f"  - {s}" for s in outside]
    ok(not zone, f"Manim text clear of the subtitle area: {len(zone)} exception(s)")
    rep += [f"  - {s}" for s in zone]
    labels = []
    for sh in tl["shots"]:
        secs = sh["duration"] + sh["tail"]
        for lb in sh.get("labels", []):
            labels.append((sh["id"], lb["text"], min(lb["dur"], secs - lb["at"] - LABEL_FADE - 0.05) + LABEL_FADE))
    short_lb = [x for x in labels if x[2] < MIN_TEXT_SECONDS]
    ok(not short_lb, f"footage/photo labels ≥ {MIN_TEXT_SECONDS:.0f}s: {len(labels)} labels, shortest "
       f"{min(x[2] for x in labels):.2f}s")
    cs = subtitles.cues(tl)
    durs = [b - a for a, b, _ in cs]
    lines_ok = all(len(lines) <= 2 and all(len(ln) <= subtitles.MAX_LINE for ln in lines) for _, _, lines in cs)
    ok(lines_ok and min(durs) >= 1.0, f"subtitles: {len(cs)} cues, ≤ 2 lines of ≤ {subtitles.MAX_LINE} chars: "
       f"{lines_ok}; shortest cue {min(durs):.2f}s")

    # --- credits and licences
    rep.append("\n## Assets and licences")
    rows = []
    if (ASSETS / "credits.csv").exists():
        with open(ASSETS / "credits.csv", newline="", encoding="utf-8") as fh:
            rows = list(csv.DictReader(fh))
    by_key = {r["key"]: r for r in rows}
    pending = [k for k in WANTED if asset_file(k) is None]
    for k in WANTED:
        f = asset_file(k)
        if f is None:
            continue
        r = by_key.get(k)
        ok(bool(r) and bool(ALLOWED.match(r["license"])) and r["source_url"] and r["author"],
           f"{f.name}: {r['source'] + ', ' + r['license'] + ', ' + r['author'] if r else 'NOT IN credits.csv'}")
    ok(not pending, f"stock media downloaded: {len(WANTED) - len(pending)}/{len(WANTED)}"
       + (f" (placeholders still in the video for: {', '.join(pending)})" if pending else ""))

    # --- physics and arithmetic shown on screen
    rep.append("\n## On-screen numbers and facts")
    checks = MATH_CHECKS
    for name, got, want in checks:
        ok(abs(got - want) / want < 0.005, f"{name} = {got:g}")

    head = ["# QC report: final_video.mp4", "",
            f"Length {vd // 60:.0f}:{vd % 60:04.1f}. " + ("All checks passed." if not problems else
                                                         f"{len(problems)} check(s) need attention."), ""]
    (ROOT / "qc_report.md").write_text("\n".join(head + rep) + "\n", encoding="utf-8")
    print("\n".join(head + rep))


if __name__ == "__main__":
    main()
