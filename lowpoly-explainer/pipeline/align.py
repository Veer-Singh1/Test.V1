"""Step 5: word timings from the processed voice.wav, snapped back to the script text.

Recognition uses NVIDIA Parakeet TDT through sherpa-onnx (token timestamps).
Any recogniser that gives word start times can be swapped in: only `recognise` changes.
Output: public/<slug>/words.json  [{"w": "Did", "s": 0.00, "e": 0.21, "sent": 0}, ...]
"""
import argparse
import difflib
import json
import subprocess
import sys

import numpy as np

from common import MODELS, duration, load_script, norm, out_dir, sentences, split_words


def recognise(wav) -> list[tuple[str, float]]:
    """Return [(word, start_seconds)] for the whole file."""
    import sherpa_onnx

    m = MODELS / "sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8"
    if not m.exists():
        sys.exit(f"Recognition model not found at {m}. See README, 'Models'.")
    rec = sherpa_onnx.OfflineRecognizer.from_transducer(
        encoder=str(m / "encoder.int8.onnx"), decoder=str(m / "decoder.int8.onnx"),
        joiner=str(m / "joiner.int8.onnx"), tokens=str(m / "tokens.txt"),
        model_type="nemo_transducer", num_threads=4,
    )
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(wav), "-ar", "16000", "-ac", "1",
                          "-f", "f32le", "-"], check=True, capture_output=True).stdout
    samples = np.frombuffer(pcm, dtype=np.float32)

    sr = 16000
    words: list[tuple[str, float]] = []
    for a, b in windows(samples, sr):
        st = rec.create_stream()
        st.accept_waveform(sr, samples[a:b])
        rec.decode_stream(st)
        cur, cur_t = "", 0.0
        for tok, t in zip(st.result.tokens, st.result.timestamps):
            if tok.startswith(" ") or not cur:
                if cur.strip():
                    words.append((cur.strip(), cur_t))
                cur, cur_t = tok, a / sr + t
            else:
                cur += tok
        if cur.strip():
            words.append((cur.strip(), cur_t))
    return words


def windows(samples, sr, target=12.0, search=3.0):
    """Split into windows of about `target` seconds, each cut at the quietest
    20 ms within `search` seconds of the target point, so no word is cut in half.
    Long windows make the recogniser skip whole sentences, so keep them short."""
    hop = sr // 50
    energy = np.array([np.mean(samples[i:i + hop] ** 2) for i in range(0, len(samples), hop)])
    cuts, pos = [0], 0
    while len(samples) - pos > (target + search) * sr:
        lo, hi = int((pos / sr + target - search) * 50), int((pos / sr + target + search) * 50)
        pos = (lo + int(np.argmin(energy[lo:hi]))) * hop
        cuts.append(pos)
    cuts.append(len(samples))
    return list(zip(cuts, cuts[1:]))


def snap(script_words: list[str], heard: list[tuple[str, float]], total: float) -> list[float]:
    """Give every script word a start time, interpolating where recognition disagrees."""
    a = [norm(w) for w in script_words]
    b = [norm(w) for w, _ in heard]
    starts: list[float | None] = [None] * len(a)
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            starts[blk.a + k] = heard[blk.b + k][1]

    # Fill gaps, weighting each missing word by its length in characters.
    i = 0
    while i < len(starts):
        if starts[i] is not None:
            i += 1
            continue
        j = i
        while j < len(starts) and starts[j] is None:
            j += 1
        left = starts[i - 1] if i > 0 else 0.0
        right = starts[j] if j < len(starts) else total
        span = script_words[max(i - 1, 0):j]
        weights = [len(w) + 1 for w in span]
        acc, tot = (weights[0] if i > 0 else 0), sum(weights)
        for k in range(i, j):
            starts[k] = left + (right - left) * acc / tot
            acc += weights[k - max(i - 1, 0)]
        i = j
    # Keep times strictly increasing.
    for k in range(1, len(starts)):
        starts[k] = max(starts[k], starts[k - 1] + 0.04)
    return starts  # type: ignore[return-value]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    args = ap.parse_args()

    d = out_dir(args.slug)
    wav = d / "voice.wav"
    total = duration(wav)
    script_words, sent_of = [], []
    for si, (_, s) in enumerate(sentences(load_script(args.slug))):
        for w in split_words(s["text"]):
            script_words.append(w)
            sent_of.append(si)

    heard = recognise(wav)
    starts = snap(script_words, heard, total)
    matched = len(set(norm(w) for w in script_words) & set(norm(w) for w, _ in heard))
    out = []
    for k, w in enumerate(script_words):
        end = starts[k + 1] if k + 1 < len(starts) else total
        out.append({"w": w, "s": round(starts[k], 3), "e": round(min(end, starts[k] + 0.6), 3), "sent": sent_of[k]})
    (d / "words.json").write_text(json.dumps(out))
    (d / "heard.json").write_text(json.dumps(heard))
    print(f"aligned {len(out)} script words to {len(heard)} recognised words "
          f"({matched} distinct words in common), audio {total:.1f} s")


if __name__ == "__main__":
    main()
