"""Check that Blender can use this computer's GPU, and time a test render.

  python blender/check_gpu.py          # writes out/gpu_check.png

The test is plate B1 of the Five Keys short (a corridor, two figures) at half size.
"""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import fivekeys  # noqa: E402  (imports Blender)
from lib import render, reset, setup_render  # noqa: E402

CLOUD_SECONDS = 12.7  # measured: the same test on the 4-core cloud machine the project was built on (CPU only)

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "out", "gpu_check.png")
os.makedirs(os.path.dirname(out), exist_ok=True)
sc = reset()
fivekeys.PLATES["B1"][0](sc)
setup_render(sc, scale=50, samples=32, threshold=0.03, exposure=1.3, haze=0.0)
render(sc, out)  # the first render also compiles GPU kernels, which can take a few minutes once
t0 = time.time()
render(sc, out)
took = time.time() - t0
print(f"\ntest render: {took:.1f} s (the cloud machine took {CLOUD_SECONDS:.0f} s on its CPU, "
      f"so this computer is about {CLOUD_SECONDS / max(took, 0.01):.1f}x as fast)")
print(f"picture: {os.path.normpath(out)}")
