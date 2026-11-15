# Five Keys camera-movement fix: work in progress (handoff note, delete when done)

The user asked for camera movement in the Five Keys short. The approach: each path-traced plate
has a depth map (`<name>_d.png`) and a filled background layer (`<name>_bg.jpg` + `<name>_bgd.png`);
the clip has the same per frame in `plates/street/` (c_, d_, b_, e_). `src/Plate3D.tsx` lays the
picture on a mesh pushed to its real depth and moves a virtual camera through it (true parallax).
Where near things slide off far ones, the background layer shows through.

The user's rule: if a usage limit hits, do not use extra usage. Schedule a continuation
(send_later, about 5 h 15 min ahead) and stop.

## Done
- Full-resolution depth maps for all 35 plates and 150 clip frames (`python blender/fivekeys.py --depth --clip --force`), `plates/meta.json`.
- `plates/reach.json`: fill reach per plate from the widest gap its camera move opens (scratch gap script; values in the file).
- Layers (`python blender/layers.py public/fivekeys/plates --force`, about 10 min): fringe flags in the depth PNG blue channel,
  middle layer `_bg/_bgd` (reach 30), back layer `_bg2/_bg2d` (per-plate reach); clip: b_/e_ and f_/g_.
  The fill takes the nearest surface behind (not the farthest), which stopped sky showing through railings.
- `src/Plate3D.tsx`: three layers (front and middle drop pixels not where their depth says; back always draws).

## To do
1. Check end frames of A1, D3, F2, D2, G1, G2 (`npx remotion still ... --frame=<shot end>`); fix what remains.
2. Contact sheet of all shot ends (`node scripts/contact-sheet.mjs fivekeys --end`).
3. Render, grain, encode `out/fivekeys/fivekeys.mp4`, commit everything (plates folder is large), push, send,
   delete this note, cancel the scheduled continuation (trig_01NCec9ndhorFXgnnaJgERT9).
