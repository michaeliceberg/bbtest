"""Запекает красную трафаретную звезду в картинки брезента (раньше рисовалась SVG-фильтром feTurbulence поверх —
на iPhone этот фильтр пересчитывался на всех брезентах каждый кадр приближения и подвешивал страницу).
Исходники без звезды — docs/hangar/tarp-nostar/, результат — public/hangar/tarp-*.webp.
Положение звезды (доли картинки + наклон) — те же числа, что были в TARPS (components/hangar-scene.tsx).
Запуск: python3 docs/hangar/tools/bake_tarp_stars.py
"""
import math, numpy as np
from PIL import Image, ImageDraw, ImageFilter

STAR = [(50,4),(61,37),(96,37),(68,58),(79,92),(50,71),(21,92),(32,58),(4,37),(39,37)]
TARPS = {
    'square': (50, 24, 28, 36, -13), 'cube': (58, 34, 22, 27, -10), 'tall': (34, 22, 40, 24, 0),
    'wide-rope': (46, 35, 18, 38, -8), 'wide-straps': (46, 36, 18, 37, -6),
    'hang-tall': (35, 26, 30, 23, 0), 'hang-square': (36, 27, 28, 25, 0),
}
rng = np.random.default_rng(7)

def noise(w, h):
    # «стёртая краска»: крупный и мелкий шум, местами краска пропадает
    out = np.zeros((h, w))
    for s, a in [(6, 0.6), (14, 0.3), (40, 0.1)]:
        sm = rng.random((max(2, h // s), max(2, w // s)))
        out += a * np.array(Image.fromarray((sm * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)) / 255
    return np.clip((out - 0.25) * 2.4, 0, 1)

for kind, (l, t, w, h, skew) in TARPS.items():
    im = Image.open(f'docs/hangar/tarp-nostar/tarp-{kind}.webp').convert('RGBA')
    W, H = im.size
    bx, by, bw, bh = l / 100 * W, t / 100 * H, w / 100 * W, h / 100 * H
    k = math.tan(math.radians(skew))
    cx = bx + bw / 2
    pts = []
    for px, py in STAR:
        x = bx + px / 100 * bw
        y = by + py / 100 * bh + k * (x - cx)  # skewY вокруг центра
        pts.append((x, y))
    SS = 3  # сглаживание
    m = Image.new('L', (W * SS, H * SS), 0)
    ImageDraw.Draw(m).polygon([(x * SS, y * SS) for x, y in pts], fill=255)
    m = m.resize((W, H), Image.LANCZOS)
    a = np.array(m) / 255 * noise(W, H) * 0.85 * (np.array(im)[:, :, 3] / 255)
    star = np.zeros((H, W, 4), np.uint8)
    star[:, :, 0], star[:, :, 1], star[:, :, 2] = 0xD8, 0x35, 0x2C
    star[:, :, 3] = (a * 255).astype(np.uint8)
    out = Image.alpha_composite(im, Image.fromarray(star))
    out.save(f'public/hangar/tarp-{kind}.webp', quality=90)
    print(kind, W, H)
