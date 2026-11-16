#!/usr/bin/env python3
"""Verify stop-motion timing on rendered PNG frames (not the encoded MP4).

Renders nothing itself: point it at a folder of consecutive PNG frames named
element-<n>.png (Remotion --sequence output) starting at an even frame.
Checks: frame 2k and 2k+1 are identical (held on twos), and during motion
frame 2k+1 -> 2k+2 changes. "Identical" allows <= 2/255 per channel: Chromium's
filter/compositing occasionally rounds a pixel by 1 level between two renders of the
same frame; real motion changes pixels by far more than that. A pair also counts as
held when at most 200 pixels (< 0.01% of the frame) differ: Chromium occasionally
anti-aliases a jagged clip-path edge differently in parallel render tabs.
usage: check_twos.py <frames_dir>
"""
import glob
import os
import re
import sys

import numpy as np
from PIL import Image

d = sys.argv[1]
files = sorted(glob.glob(os.path.join(d, '*.png')), key=lambda p: int(re.findall(r'(\d+)\.png$', p)[0]))
nums = [int(re.findall(r'(\d+)\.png$', p)[0]) for p in files]
frames = {n: np.asarray(Image.open(p).convert('RGB'), np.int16) for n, p in zip(nums, files)}
TOL = 2
NOISE_PX = 200  # < 0.01% of a 1080x1920 frame: antialiasing noise at strip edges, not motion
held_ok = held_bad = changes = static = exact = noisy = 0
bad = []
for n in nums:
    if n % 2 == 0 and n + 1 in frames:
        dd = np.abs(frames[n] - frames[n + 1]).max(axis=2)
        diff = dd.max()
        npx = int((dd > TOL).sum())
        if diff <= TOL or npx <= NOISE_PX:
            held_ok += 1
            exact += diff == 0
            noisy += 0 < npx
        else:
            held_bad += 1
            bad.append((n, int(diff), npx))
    if n % 2 == 1 and n + 1 in frames:
        if np.abs(frames[n] - frames[n + 1]).max() > TOL:
            changes += 1
        else:
            static += 1
print(f'pairs held (2k == 2k+1): {held_ok} ok ({exact} bit-exact, {noisy} with <= {NOISE_PX} px of edge AA noise), {held_bad} differ {bad[:10]}')
print(f'steps (2k+1 -> 2k+2): {changes} changed, {static} identical')
sys.exit(1 if held_bad else 0)
