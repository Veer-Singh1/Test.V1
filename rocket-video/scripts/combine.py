"""Tile PNGs side by side: combine.py out.png in1.png in2.png ..."""
import sys
from PIL import Image
ims = [Image.open(p).convert('RGB') for p in sys.argv[2:]]
w, h = ims[0].size
out = Image.new('RGB', (len(ims) * (w + 10) - 10, h), 'white')
for i, im in enumerate(ims):
    out.paste(im, (i * (w + 10), 0))
out.save(sys.argv[1])
