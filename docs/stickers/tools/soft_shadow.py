# Стикер без белой обводки, с мягкой тенью по силуэту (как стикеры гуся Мигеля). 512×512 WebP.
# Запуск: python3 docs/stickers/tools/soft_shadow.py вход выход [--strip]
# --strip: у готового стикера с белой обводкой срезать обводку (белое, связанное с прозрачным краем, глубиной до 9% размера).
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

SIZE = 512
DROP_Y, DROP_BLUR, DROP_A = 0.03, 0.022, 0.55   # доли размера и прозрачность тени

def strip_outline(im):
    a = np.array(im.convert('RGBA')).astype(int)
    H, W = a.shape[:2]
    rgb, al = a[..., :3], a[..., 3]
    white = (rgb.min(-1) > 200) & (rgb.max(-1) - rgb.min(-1) < 40) & (al > 0)
    lim = int(max(H, W) * 0.09)
    dist = np.full((H, W), -1)
    q = deque()
    for y in range(H):
        for x in range(W):
            if al[y, x] < 30:
                dist[y, x] = 0; q.append((y, x))
    keep = np.ones((H, W), bool)
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and dist[ny, nx] < 0 and white[ny, nx] and dist[y, x] < lim:
                dist[ny, nx] = dist[y, x] + 1; keep[ny, nx] = False; q.append((ny, nx))
    m = np.where(keep, al, 0).astype('uint8')
    # подрезаем светлую кайму на переходе обводка → картинка
    m = np.array(Image.fromarray(m).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7)))
    out = np.dstack([a[..., :3], m]).astype('uint8')
    return Image.fromarray(out, 'RGBA')

def shadowed(im):
    im = im.crop(im.getbbox())
    w, h = im.size
    s = max(w, h)
    pad = int(s * 0.07)
    C = s + 2 * pad
    canvas = Image.new('RGBA', (C, C), (0, 0, 0, 0))
    ox, oy = (C - w) // 2, pad + (s - h)
    al = Image.new('L', (C, C), 0); al.paste(im.split()[3], (ox, oy + int(s * DROP_Y)))
    al = al.filter(ImageFilter.GaussianBlur(s * DROP_BLUR)).point(lambda v: int(v * DROP_A))
    sh = Image.new('RGBA', (C, C), (0, 0, 0, 0)); sh.putalpha(al)
    canvas = Image.alpha_composite(canvas, sh)
    canvas.paste(im, (ox, oy), im)
    return canvas.resize((SIZE, SIZE), Image.Resampling.LANCZOS)

if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    im = Image.open(src).convert('RGBA')
    if '--strip' in sys.argv: im = strip_outline(im)
    shadowed(im).save(dst, quality=88)
