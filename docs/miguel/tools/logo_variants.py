# Варианты логотипа: снимает внешнюю белую обводку со слоёв public/logo-anim (base, goose, monster),
# собирает новые обводки ровным контуром и кладёт в public/logo-test/<вариант>/. Запуск: python3 docs/miguel/tools/logo_variants.py
import os, shutil
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

SRC, OUT = 'public/logo-anim', 'public/logo-test'
LAYERS = ['base', 'goose', 'monster']
MAX_BAND = {'base': 9, 'goose': 9, 'monster': 18}  # толщина старой белой обводки, px (у монстра внутри нет белого)
TEXT_BOTTOM = 382  # ниже этой строки у надписи только белые остатки обводки под чёрным объёмом

def peel(name):
    """Убирает светлую полосу, связанную с прозрачным фоном: заливка снаружи внутрь по светлым пикселям."""
    a = np.array(Image.open(f'{SRC}/{name}.webp').convert('RGBA')).astype(float)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    mn, mx = np.minimum(np.minimum(r, g), b), np.maximum(np.maximum(r, g), b)
    light = ((mn > 120) & (mx - mn < 60)) | (al < 200)
    H, W = al.shape
    seen = np.zeros((H, W), bool)
    # глубина ограничена толщиной обводки: иначе через щель в контуре заливка съедает белую букву G целиком
    q = deque((y, x, 0) for y in range(H) for x in range(W) if al[y, x] < 30)
    for y, x, _ in q:
        seen[y, x] = True
    while q:
        y, x, d = q.popleft()
        if d >= MAX_BAND[name]:
            continue
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and not seen[ny, nx] and light[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx, d + 1))
    m = Image.fromarray(((~seen) * 255).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.5))
    a[..., 3] = np.minimum(al, np.array(m))
    if name == 'monster':  # белый кармашек между рукой и телом снаружи не достать заливкой
        a[..., 3] = np.where((mn > 170) & (mx - mn < 40), 0, a[..., 3])
    if name == 'base':
        rows = np.arange(H)[:, None] >= TEXT_BOTTOM
        a[..., 3] = np.where(rows & (mn > 90), 0, a[..., 3])
    return a

def ring(a, color, width):
    """Ровная скруглённая обводка под слоем: маска ×2 → размытие → порог."""
    H, W = a.shape[:2]
    m = Image.fromarray(((a[..., 3] > 90) * 255).astype('uint8')).resize((W * 2, H * 2), Image.Resampling.BILINEAR)
    bm = np.array(m.filter(ImageFilter.GaussianBlur(width * 2 * 0.62))).astype(float) / 255
    o = np.clip((bm - 0.05) / 0.06, 0, 1)
    o = np.array(Image.fromarray((o * 255).astype('uint8')).resize((W, H), Image.Resampling.LANCZOS)).astype(float) / 255
    out = np.zeros_like(a)
    out[..., :3] = color
    out[..., 3] = o * 255
    f = a[..., 3:4] / 255
    out[..., :3] = out[..., :3] * (1 - f) + a[..., :3] * f
    out[..., 3] = np.maximum(out[..., 3], a[..., 3])
    return out

def shadow(a, dy=5, blur=4, alpha=0.6):
    H, W = a.shape[:2]
    s = Image.new('L', (W, H), 0)
    s.paste(Image.fromarray(a[..., 3].astype('uint8')), (0, dy))
    s = np.array(s.filter(ImageFilter.GaussianBlur(blur))).astype(float) * alpha
    f = a[..., 3:4] / 255
    out = np.zeros_like(a)
    out[..., :3] = a[..., :3]
    out[..., 3] = 255 * (1 - (1 - f[..., 0]) * (1 - s / 255))
    k = np.where(out[..., 3:4] > 0, f * 255 / np.maximum(out[..., 3:4], 1), 0)
    out[..., :3] = a[..., :3] * k
    return out

if __name__ == '__main__':
    WHITE, BLACK, PURPLE = (255, 255, 255), (6, 9, 11), (124, 58, 237)
    core = {n: peel(n) for n in LAYERS}
    V = {
        'none': lambda n, a: a,
        'white-text': lambda n, a: ring(a, WHITE, 4) if n == 'base' else a,
        'black': lambda n, a: ring(a, BLACK, 5),
        'black-thin': lambda n, a: ring(a, BLACK, 3),
        'white-text-black': lambda n, a: ring(a, WHITE, 4) if n == 'base' else ring(a, BLACK, 4),
        'shadow': lambda n, a: shadow(a),
        'black-shadow': lambda n, a: shadow(ring(a, BLACK, 4)),
        'purple-text': lambda n, a: ring(a, PURPLE, 4) if n == 'base' else ring(a, BLACK, 3),
        'monster-purple': lambda n, a: ring(a, (167, 139, 250), 3) if n == 'monster' else a,
    }
    for name, fn in V.items():
        d = f'{OUT}/{name}'
        os.makedirs(d, exist_ok=True)
        for n in LAYERS:
            Image.fromarray(fn(n, core[n]).clip(0, 255).astype('uint8'), 'RGBA').save(f'{d}/{n}.webp', quality=90)
        shutil.copy(f'{SRC}/flash.webp', f'{d}/flash.webp')
    print(list(V))
