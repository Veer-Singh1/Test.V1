# Five Keys camera-movement fix: work in progress (handoff note, delete when done)

The user asked for camera movement in the Five Keys short. The approach: each path-traced plate
has a depth map (`<name>_d.png`) and a filled background layer (`<name>_bg.jpg` + `<name>_bgd.png`);
the clip has the same per frame in `plates/street/` (c_, d_, b_, e_). `src/Plate3D.tsx` lays the
picture on a mesh pushed to its real depth and moves a virtual camera through it (true parallax).
Where near things slide off far ones, the background layer shows through.

The user's rule: if a usage limit hits, do not use extra usage. Schedule a continuation
(send_later, about 5 h 15 min ahead) and stop.

## Done
- Depth maps for all 35 plates and 150 clip frames (`python blender/fivekeys.py --depth --clip`), `plates/meta.json`.
- Background layers (`python blender/layers.py public/fivekeys/plates`, about 8 min).
- `src/Plate3D.tsx`, wired into `src/Explainer.tsx`; timeline carries `meta` per shot.

## To do
1. Plate3D back layer: use the `_bg.jpg`/`_bgd.png` (clip: `b_`/`e_`) textures, not the in-shader search.
2. Check B1 end frame against `python blender/fivekeys.py --only B1 --out /tmp/x --offset ...` (a real render from the moved camera).
3. Contact sheet of first and last frames of each shot; fix any tearing.
4. Render (`GL=swangle`, CHROME_PATH = Playwright headless shell), grain + encode to `out/fivekeys/fivekeys.mp4`,
   commit (plates folder is large: commit depth/bg files too), push, send, delete this note, cancel the scheduled continuation.
