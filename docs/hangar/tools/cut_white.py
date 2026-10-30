#!/usr/bin/env python3
"""Убрать белый фон у картинки Leonardo бесплатно (вместо Remove Background за токены).

Заливка от краёв картинки по почти белым пикселям → прозрачно; внутренние белые места (блики, табличка) остаются,
если отделены от фона контуром. Край сглаживается на 1 пиксель.
    python3 docs/hangar/tools/cut_white.py вход.jpg выход.png [порог=236]
"""
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
thr = int(sys.argv[3]) if len(sys.argv) > 3 else 236
im = Image.open(src).convert('RGBA')
a = np.array(im)
rgb = a[..., :3].astype(int)
white = (rgb.min(axis=2) >= thr) | (a[..., 3] < 10)
h, w = white.shape
bg = np.zeros_like(white)
q = deque()
for x in range(w):
    for y in (0, h - 1):
        if white[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
for y in range(h):
    for x in (0, w - 1):
        if white[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w and white[ny, nx] and not bg[ny, nx]:
            bg[ny, nx] = True; q.append((ny, nx))
mask = Image.fromarray(np.where(bg, 0, 255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.8))
a[..., 3] = np.minimum(a[..., 3], np.array(mask))
out = Image.fromarray(a)
out = out.crop(out.getchannel('A').getbbox())
out.save(dst)
print(dst, out.size)
