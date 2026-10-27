"""Subtitles from the narration timeline: SRT for delivery, ASS (styled) for burning in."""
import re

MAX_LINE = 42
MIN_CUE = 1.2
LINGER = 0.35


def split_cue_text(text):
    """Split a sentence into chunks that each fit on two lines of MAX_LINE characters."""
    if len(text) <= 2 * MAX_LINE and two_lines(text):
        return [text]
    words = text.split()
    best = None
    for i in range(1, len(words)):
        a, b = " ".join(words[:i]), " ".join(words[i:])
        punct = a[-1] in ",;:—…" or words[i] == "—"
        score = abs(len(a) - len(b)) - (25 if punct else 0)
        if best is None or score < best[0]:
            best = (score, a, b)
    _, a, b = best
    return split_cue_text(a) + split_cue_text(b)


def two_lines(text):
    if len(text) <= MAX_LINE:
        return [text]
    words = text.split()
    best = None
    for i in range(1, len(words)):
        a, b = " ".join(words[:i]), " ".join(words[i:])
        if len(a) <= MAX_LINE and len(b) <= MAX_LINE:
            punct = a[-1] in ",;:—…" or b.startswith("—")
            score = abs(len(a) - len(b)) - (12 if punct else 0)
            if best is None or score < best[0]:
                best = (score, [a, b])
    return best[1] if best else None


def cues(timeline, t0=0.0, t1=None):
    """[(start, end, [line1, line2?]), ...] in seconds relative to t0."""
    out = []
    for sc in timeline["scenes"]:
        for s in sc["segments"]:
            if s["silent"] or not s["text"]:
                continue
            a, b = sc["start"] + s["start"], sc["start"] + s["end"]
            chunks = split_cue_text(s["text"])
            total = sum(len(c) for c in chunks)
            t = a
            for c in chunks:
                d = (b - a) * len(c) / total
                out.append([t, t + d, two_lines(c)])
                t += d
    # merge too-short cues into their neighbour, then let each cue linger into the following pause
    merged = []
    for c in out:
        if merged and c[1] - c[0] < MIN_CUE and abs(merged[-1][1] - c[0]) < 0.05 and \
                two_lines(" ".join(merged[-1][2] + c[2])):
            merged[-1] = [merged[-1][0], c[1], two_lines(" ".join(merged[-1][2] + c[2]))]
        else:
            merged.append(c)
    for i, c in enumerate(merged):
        nxt = merged[i + 1][0] if i + 1 < len(merged) else c[1] + LINGER
        c[1] = min(c[1] + LINGER, nxt - 0.04)
    t1 = t1 if t1 is not None else float("inf")
    return [(max(a, t0) - t0, min(b, t1) - t0, lines) for a, b, lines in merged if b > t0 and a < t1]


def ts_srt(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def ts_ass(t):
    cs = int(round(t * 100))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def write_srt(cs, path):
    path.write_text("\n".join(f"{i}\n{ts_srt(a)} --> {ts_srt(b)}\n" + "\n".join(lines) + "\n"
                              for i, (a, b, lines) in enumerate(cs, 1)), encoding="utf-8")


ASS_HEAD = """[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
ScaledBorderAndShadow: yes
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Inter SemiBold,52,&H00FFFFFF,&H00FFFFFF,&H70000000,&H8C000000,0,0,0,0,100,100,0,0,1,2.4,2.2,2,160,160,58,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def write_ass(cs, path):
    rows = [f"Dialogue: 0,{ts_ass(a)},{ts_ass(b)},Sub,,0,0,0,,{{\\blur3}}" + "\\N".join(
        re.sub(r"[{}]", "", ln) for ln in lines) for a, b, lines in cs]
    path.write_text(ASS_HEAD + "\n".join(rows) + "\n", encoding="utf-8")
