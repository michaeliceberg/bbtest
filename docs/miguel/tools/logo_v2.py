# Логотип v2: гусь и монстр из новых картинок Leonardo (уже с прозрачным фоном) + прежняя надпись.
# Чёрная обводка + мягкая тень. Запуск: python3 docs/miguel/tools/logo_v2.py [папка]
import os, sys
from collections import deque
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from logo_variants import peel, ring, shadow, SRC

OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/logo-test/v2'
W, H = 640, 400
BLACK = (6, 9, 11)
RING, TEXT_TOP = 4, 256

def clean_edge(a, depth):
    """Снимает светлую кайму у края (остаток фона), не глубже depth пикселей."""
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    mn, mx = np.minimum(np.minimum(r, g), b), np.maximum(np.maximum(r, g), b)
    light = ((mn > 130) & (mx - mn < 60)) | (al < 200)
    h, w = al.shape
    seen = np.zeros((h, w), bool)
    q = deque((y, x, 0) for y in range(h) for x in range(w) if al[y, x] < 30)
    for y, x, _ in q:
        seen[y, x] = True
    while q:
        y, x, d = q.popleft()
        if d >= depth:
            continue
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not seen[ny, nx] and light[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx, d + 1))
    a[..., 3] = np.where(seen, 0, al)
    return a

def goose():
    a = np.array(Image.open('docs/miguel/leonardo/logo-goose-v2.webp').convert('RGBA')).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    yy, xx = np.mgrid[0:1024, 0:1024]
    # лишнее от Leonardo: малиновая тень под ногами и розовый кусочек, вылетевший из дула
    shadow_px = (yy > 860) & (r - g > 50) & (b - g > 25) & (r < 200)
    stray = (xx > 945) | ((xx > 880) & (yy < 215))
    a[..., 3] = np.where(shadow_px | stray, 0, a[..., 3])
    return clean_edge(a, 4)

def monster():
    a = np.array(Image.open('docs/miguel/leonardo/logo-monster-v2.webp').convert('RGBA')).astype(float)
    return clean_edge(a, 8)

def place(a, box):
    """Вписывает картинку в box (x0, y0, x1, y1) канваса 640×400, низ по y1."""
    im = Image.fromarray(a.astype('uint8'), 'RGBA')
    im = im.crop(im.getbbox())
    x0, y0, x1, y1 = box
    k = min((x1 - x0) / im.width, (y1 - y0) / im.height)
    im2 = im.resize((round(im.width * k), round(im.height * k)), Image.Resampling.LANCZOS)
    c = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    c.paste(im2, (x0, y1 - im2.height), im2)
    return np.array(c).astype(float), k, (x0, y1 - im2.height), im.size

os.makedirs(OUT, exist_ok=True)
def save(a, name):
    Image.fromarray(a.clip(0, 255).astype('uint8'), 'RGBA').save(f'{OUT}/{name}.webp', quality=90)

g, k, (ox, oy), _ = place(goose(), (40, 62, 250, 272))
m, _, _, _ = place(monster(), (378, 6, 638, 262))
base = peel('base')
base[:TEXT_TOP, :, 3] = 0   # обломки лап старого гуся
# старая лапа врезалась в верх буквы G: кромку буквы восстанавливаем чистым столбцом левее,
# а щель между буквами (x ≥ 155) закрашиваем чёрным
base[TEXT_TOP:282, 108:155] = base[TEXT_TOP:282, 100:101]
gap = base[TEXT_TOP:282, 155:178]
gap[(gap[..., 3] > 40) & (gap[..., :3].max(-1) > 70) & (np.arange(TEXT_TOP, 282)[:, None] < 270), :3] = BLACK
save(shadow(ring(base, BLACK, RING)), 'base')
save(shadow(ring(g, BLACK, RING)), 'goose')
save(shadow(ring(m, BLACK, RING)), 'monster')

# вспышка: кончик у дула, по направлению ствола
src_box = Image.open('docs/miguel/leonardo/logo-goose-v2.webp')
fl = Image.open(f'{SRC}/flash.webp').convert('RGBA')
print('scale', k, 'origin', ox, oy)
OLD_TIP = (240, 118)
MUZZLE = tuple(map(float, os.environ.get('MUZZLE', '240,100').split(',')))
ANGLE = float(os.environ.get('ANGLE', '14'))
fl = fl.rotate(ANGLE, resample=Image.Resampling.BICUBIC, center=OLD_TIP)
c = Image.new('RGBA', (W, H), (0, 0, 0, 0))
c.paste(fl, (round(MUZZLE[0] - OLD_TIP[0]), round(MUZZLE[1] - OLD_TIP[1])), fl)
c.save(f'{OUT}/flash.webp', quality=90)
