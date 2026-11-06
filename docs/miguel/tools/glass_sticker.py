# Мигель за стеклом: пурпурный фон убираем, блики стекла становятся полупрозрачно-белыми, рамка — светлой, внутри лёгкая дымка.
# Картинка 900×900: она же показывается на весь экран (components/glass-knock-intro.tsx), поэтому крупнее обычного стикера.
# Запуск: python3 docs/miguel/tools/glass_sticker.py вход.jpg выход.webp ширина_рамки  (0 — рамки нет, только блики)
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SIZE, PAD = 900, 20
FRAME = np.array([190, 225, 240])

def main(src, dst, ring_w):
    a = np.array(Image.open(src).convert('RGB')).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    H, W = r.shape
    bg_g = float(np.median([g[5, 5], g[5, W - 6], g[H - 6, 5], g[H - 6, W - 6]]))
    key = (r > 130) & (g < 100) & (r - b > 35) & (b > g + 45)
    key |= (r > 140) & (b > 140) & (g < np.minimum(r, b) - 70)
    if ring_w:
        key |= (r > g + 40) & (b > g + 25) & (r < 175) & (r > b)  # тёмный след фона в углах рамки
    streak = (r > 190) & (b > 125) & (g >= 60) & (g < 140) & (r - g > 70) & (b - g > 35)
    alpha = np.where(key | streak, 0.0, 255.0)
    alpha = np.array(Image.fromarray(alpha.astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))).astype(float)
    # блик = белый над фоном: восстанавливаем его непрозрачность по зелёному каналу
    sa = np.clip((g - bg_g) / (255 - bg_g), 0, 1) * 255
    a[streak] = 255
    alpha = np.where(streak, sa * 0.9, alpha)
    ys, xs = np.where(~(key | streak))
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    if ring_w:
        rad = int(min(x1 - x0, y1 - y0) * 0.16)
        outer = Image.new('L', (W, H), 0)
        ImageDraw.Draw(outer).rounded_rectangle([x0, y0, x1, y1], rad, fill=255)
        inner = Image.new('L', (W, H), 0)
        ImageDraw.Draw(inner).rounded_rectangle([x0 + ring_w, y0 + ring_w, x1 - ring_w, y1 - ring_w], max(rad - ring_w, 1), fill=255)
        o, i = np.array(outer) > 0, np.array(inner) > 0
        ring = o & ~i
        a[ring] = FRAME
        alpha = np.where(ring, 255, alpha)
        fog = i & (alpha < 20)
        a[fog] = 255
        alpha = np.where(fog, np.maximum(alpha, 16), alpha)
    else:
        # без рамки — кусок стекла с тёмной линией слева
        dark = (a.max(-1) < 70) & (np.arange(W)[None, :] < x0 + 12)
        a[dark] = FRAME
    st = Image.fromarray(np.dstack([a, alpha]).astype('uint8'), 'RGBA')
    st = st.crop(st.getbbox())
    w, h = st.size
    k = min((SIZE - 2 * PAD) / w, (SIZE - 2 * PAD) / h)
    st = st.resize((round(w * k), round(h * k)), Image.Resampling.LANCZOS)
    out = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    out.paste(st, ((SIZE - st.width) // 2, (SIZE - st.height) // 2))
    out.save(dst, quality=88)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]))
