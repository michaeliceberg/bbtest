# Стикер Мигеля новой версии: без белой обводки, мягкая тень по силуэту + тёмное пятно под ногами (запечено в картинку,
# чтобы не держать CSS-фильтры на анимациях). 512×512 WebP.
# Запуск: python3 docs/miguel/tools/make_sticker_v2.py вход.jpg выход.webp [x,y ...]
# x,y — доп. точки фона (в пикселях исходника) для закрытых «карманов» фона, куда заливка от углов не доходит.
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SIZE = 512
PAD_SIDE, PAD_TOP, PAD_BOTTOM = 22, 14, 62   # снизу запас под тени
DROP_Y, DROP_BLUR, DROP_A = 16, 12, 0.6      # мягкая тень по силуэту
FEET_H, FEET_BLUR, FEET_A = 34, 9, 0.75      # пятно под ногами

def cut(path, extra=()):
    a = np.array(Image.open(path).convert('RGB')).astype(int)
    mx, mn = a.max(-1), a.min(-1)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # Пурпурный фон (#FF00FF из промпта): такого цвета нет на рисунке — убираем его везде, в т.ч. в замкнутых «карманах».
    # Leonardo часто даёт фон малиновее (#D81E85): r заметно больше b. Красную бандану не задевает — у неё b почти как g.
    magenta = ((r > 140) & (b > 140) & (g < np.minimum(r, b) - 70)) | ((r > 130) & (g < 100) & (r - b > 35) & (b > g + 45))
    bg = ((mn > 150) & (mx - mn < 30)) | magenta
    H, W = bg.shape
    seen = np.zeros_like(bg)
    q = deque()
    for y, x in [(0, 0), (0, W - 1), (H - 1, 0), (H - 1, W - 1), *extra]:
        seen[y, x] = True
        q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and not seen[ny, nx] and bg[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
    seen |= magenta
    mask = Image.fromarray(((~seen) * 255).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    st = Image.fromarray(np.dstack([a, np.array(mask)]).astype('uint8'), 'RGBA')
    return st.crop(st.getbbox())

def build(src, dst, extra=()):
    st = cut(src, extra)
    w, h = st.size
    k = min((SIZE - 2 * PAD_SIDE) / w, (SIZE - PAD_TOP - PAD_BOTTOM) / h)
    st = st.resize((round(w * k), round(h * k)), Image.Resampling.LANCZOS)
    w, h = st.size
    x, y = (SIZE - w) // 2, SIZE - PAD_BOTTOM - h
    al = np.array(st)[..., 3]
    # ширина пятна — по нижней части силуэта (ноги)
    cols = np.where(al[int(h * 0.88):].max(0) > 128)[0]
    x0, x1 = (cols.min(), cols.max()) if len(cols) else (0, w)
    feet = Image.new('L', (SIZE, SIZE), 0)
    cx, fy = x + (x0 + x1) / 2, y + h - 2
    rx = max((x1 - x0) / 2 + 14, 40)
    ImageDraw.Draw(feet).ellipse([cx - rx, fy - FEET_H / 2, cx + rx, fy + FEET_H / 2], fill=255)
    feet = feet.filter(ImageFilter.GaussianBlur(FEET_BLUR))
    drop = Image.new('L', (SIZE, SIZE), 0)
    drop.paste(st.getchannel('A'), (x, y + DROP_Y))
    drop = drop.filter(ImageFilter.GaussianBlur(DROP_BLUR))
    shadow = 1 - (1 - np.array(feet) / 255 * FEET_A) * (1 - np.array(drop) / 255 * DROP_A)
    out = Image.fromarray(np.dstack([np.zeros((SIZE, SIZE, 3)), shadow * 255]).astype('uint8'), 'RGBA')
    out.alpha_composite(st, (x, y))
    out.save(dst, quality=88)

if __name__ == '__main__':
    build(sys.argv[1], sys.argv[2], [tuple(int(v) for v in reversed(p.split(','))) for p in sys.argv[3:]])
