#!/usr/bin/env python3
"""5-frame contact sheet from the final MP4: contact_sheet.py <video> <out.png> [t1 ... t5]"""
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw, ImageFont

video, out = sys.argv[1], sys.argv[2]
times = [float(t) for t in sys.argv[3:]] or [0.5, 18.0, 28.5, 44.0, 59.0]
tmp = tempfile.mkdtemp()
tiles = []
for i, t in enumerate(times):
    p = os.path.join(tmp, f'{i}.png')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t}', '-i', video, '-frames:v', '1', p], check=True)
    tiles.append(Image.open(p).convert('RGB').resize((432, 768), Image.LANCZOS))
pad, label_h = 16, 46
W = len(tiles) * 432 + (len(tiles) + 1) * pad
H = 768 + 2 * pad + label_h
sheet = Image.new('RGB', (W, H), (239, 232, 218))
draw = ImageDraw.Draw(sheet)
font_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fonts', 'Inter-700.ttf')
font = ImageFont.truetype(font_path, 26)
for i, (im, t) in enumerate(zip(tiles, times)):
    x = pad + i * (432 + pad)
    sheet.paste(im, (x, pad))
    draw.text((x + 6, pad + 768 + 8), f'{t:.1f} s', fill=(27, 27, 27), font=font)
sheet.save(out)
print('wrote', out)
