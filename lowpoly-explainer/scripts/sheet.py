"""Tile images into a labelled contact sheet: python scripts/sheet.py out.jpg img1 img2 ..."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

out, files = sys.argv[1], sys.argv[2:]
cols = 7
ims = [Image.open(f).convert("RGB") for f in files]
w, h = 270, 480
sheet = Image.new("RGB", (cols * (w + 6), ((len(ims) + cols - 1) // cols) * (h + 6)), "black")
for i, (f, im) in enumerate(zip(files, ims)):
    im = im.resize((w, h))
    ImageDraw.Draw(im).text((6, 4), Path(f).stem, fill="yellow")
    sheet.paste(im, ((i % cols) * (w + 6), (i // cols) * (h + 6)))
sheet.save(out, quality=88)
