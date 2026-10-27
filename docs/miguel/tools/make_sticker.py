# Вырезает фон у стикера Leonardo (светлый фон + белая обводка), делает свою ровную белую обводку,
# квадрат с полем 4%, 512×512 WebP. Запуск: python3 docs/miguel/tools/make_sticker.py вход.jpg выход.webp
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB'); a = np.array(im).astype(int)
mx = a.max(-1); mn = a.min(-1); bgc = (mn > 150) & (mx - mn < 30)
H, W = bgc.shape; seen = np.zeros_like(bgc); q = deque()
for y, x in [(0, 0), (0, W - 1), (H - 1, 0), (H - 1, W - 1)]:
    seen[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < H and 0 <= nx < W and not seen[ny, nx] and bgc[ny, nx]:
            seen[ny, nx] = True; q.append((ny, nx))
fg = Image.fromarray(((~seen) * 255).astype('uint8')).filter(ImageFilter.MaxFilter(3))
bm = np.array(fg.filter(ImageFilter.GaussianBlur(20 / 1.6))).astype(float) / 255
border = np.clip((bm - 0.03) / 0.04, 0, 1)
rgba = np.zeros((H, W, 4)); rgba[..., :3] = 255; rgba[..., 3] = border * 255
fa = np.array(fg).astype(float) / 255
rgba[..., :3] = rgba[..., :3] * (1 - fa[..., None]) + a * fa[..., None]
st = Image.fromarray(rgba.clip(0, 255).astype('uint8'), 'RGBA'); st = st.crop(st.getbbox())
w, h = st.size; S = max(w, h); pad = int(S * 0.04); S += 2 * pad
sq = Image.new('RGBA', (S, S), (0, 0, 0, 0)); sq.paste(st, ((S - w) // 2, (S - h) // 2), st)
sq.resize((512, 512), Image.LANCZOS).save(dst, quality=88)
