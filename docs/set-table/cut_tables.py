# Столы сета lvl2-4: вырезаем малиновый фон, режем по столу и приводим к ширине 900 px, как cloth-green.webp.
# Запуск: python3 docs/set-table/cut_tables.py
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

for src, dst in (('lvl2', 'cloth-lvl2'), ('lvl3', 'cloth-lvl3'), ('lvl4', 'cloth-lvl4')):
    a = np.array(Image.open(f'docs/set-table/leonardo/table-{src}.jpg').convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    bg = (r > 120) & (g < 110) & (r - b > 35) & (b > g + 30)
    H, W = bg.shape
    seen = np.zeros_like(bg)
    q = deque((y, x) for y, x in ((0, 0), (0, W - 1), (H - 1, 0), (H - 1, W - 1)))
    for p in q: seen[p] = True
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and not seen[ny, nx] and bg[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
    seen |= bg
    glow = None
    if src == 'lvl4':
        # Золотое сияние: Leonardo смешал его с малиновым фоном, и вокруг стола вышла розовая кайма. Всё, что снаружи
        # тёмного контура, перекрашиваем в золото и делаем полупрозрачным — на тёмной карточке это честное свечение.
        # Ограничено полосой у фона и g < 185: контур у стола с разрывами, иначе перекраска утекает на саму скатерть.
        near = np.array(Image.fromarray((seen * 255).astype('uint8')).filter(ImageFilter.MaxFilter(61))) > 0
        halo = near & (r > 150) & (g < 185) & (b > 55) & (b < 175) & (r - b > 25)
        q = deque((y, x) for y in range(H) for x in range(W) if seen[y, x] and (
            (y + 1 < H and halo[y + 1, x]) or (y > 0 and halo[y - 1, x]) or (x + 1 < W and halo[y, x + 1]) or (x > 0 and halo[y, x - 1])))
        out = np.zeros_like(seen)
        for p in q: out[p] = True
        while q:
            y, x = q.popleft()
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < H and 0 <= nx < W and not out[ny, nx] and not seen[ny, nx] and halo[ny, nx]:
                    out[ny, nx] = True
                    q.append((ny, nx))
        out &= ~seen
        a[out] = (255, 200, 80)
        glow = np.array(Image.fromarray((out * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(14))) * 0.75
        seen |= out
    mask = Image.fromarray(((~seen) * 255).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    al = np.array(mask).astype(float)
    if glow is not None:
        al = np.maximum(al, np.where(out, glow, 0))
    st = Image.fromarray(np.dstack([a, al]).astype('uint8'), 'RGBA')
    st = st.crop(st.getbbox())
    w, h = st.size
    st = st.resize((900, round(h * 900 / w)), Image.Resampling.LANCZOS)
    st.save(f'public/set-tablecloth/{dst}.webp', quality=86)
    print(dst, st.size)
