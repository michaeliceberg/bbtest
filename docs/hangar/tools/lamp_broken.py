# Делает 00-start.png из 00-reference.jpg: лампа №8 выключена и разбита (трещины, выбитый осколок, паутина).
# Рисуем поверх той же лампы — форма и стиль не меняются. Запуск: python3 docs/hangar/tools/lamp_broken.py
import math, random, numpy as np
from PIL import Image, ImageDraw, ImageFilter
random.seed(3)
a = np.array(Image.open('docs/hangar/00-reference.jpg').convert('RGB')).astype(float)
H, W, _ = a.shape; yy, xx = np.mgrid[0:H, 0:W]
cx, cy = 232, 414
r, g, b = a[..., 0], a[..., 1], a[..., 2]; lum = (r + g + b) / 3
glass = (r > 170) & (g > 150) & (b < 140) & (np.hypot(xx - cx, yy - cy) < 40)
gm = np.array(Image.fromarray((glass * 255).astype('uint8')).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1))).astype(float) / 255
dark = np.stack([lum * 0.18 + 62, lum * 0.18 + 74, lum * 0.18 + 84], -1)  # выключенное стекло: тусклое серо-голубое
out = a * (1 - gm[..., None]) + dark * gm[..., None]
d = np.hypot(xx - cx, (yy - cy) * 0.9); halo = np.clip(1 - d / 120, 0, 1) ** 1.5 * (1 - gm)
warm = np.clip((r - b) / 120, 0, 1); k = halo * warm * 0.45
out = out * (1 - k[..., None]) + np.stack([out[..., 0] * .7, out[..., 1] * .78, out[..., 2] * .95], -1) * k[..., None]
base = Image.fromarray(out.clip(0, 255).astype('uint8')).convert('RGBA')

SC = 4; x0, y0, x1, y1 = 150, 340, 300, 480
crop = base.crop((x0, y0, x1, y1)).resize(((x1 - x0) * SC, (y1 - y0) * SC), Image.Resampling.LANCZOS)
P = lambda x, y: ((x - x0) * SC, (y - y0) * SC)
gmask = Image.fromarray((glass[y0:y1, x0:x1] * 255).astype('uint8')).filter(ImageFilter.MaxFilter(3)).resize(crop.size)
ys, xs = np.nonzero(glass); gx0, gx1, gy0, gy1 = xs.min(), xs.max(), ys.min(), ys.max()
ix, iy = gx0 + 0.78 * (gx1 - gx0), gy0 + 0.35 * (gy1 - gy0)   # точка удара у края
hole = Image.new('L', crop.size, 0)
ImageDraw.Draw(hole).polygon([P(ix - 3, iy - 2), P(ix, iy - 4), P(ix + 4, iy - 2), P(ix + 3, iy + 3), P(ix - 2, iy + 4), P(ix - 4, iy + 1)], fill=255)
hole = Image.fromarray(np.minimum(np.array(hole), np.array(gmask)))
crop.paste((34, 14, 27, 255), mask=hole)  # дыра — цвет контуров картинки
# Трещины в стиле картинки: тёмная контурная линия (как у всех предметов) + рядом тонкий приглушённый блик стекла.
# Белого на картинке нет — самый светлый тон бледно-зелёный (195,233,195), поэтому блик тусклый.
OUTLINE, SHINE = (34, 14, 27, 255), (128, 140, 146, 150)
cracks = []
for ang0 in (150, 195, 235, 115, 300):
    ang = math.radians(ang0 + random.uniform(-10, 10)); x, y = ix, iy; pts = [(x, y)]
    for s_ in range(random.randint(4, 6)):
        L = random.uniform(5, 8); ang += random.uniform(-.6, .6); x += L * math.cos(ang); y += L * math.sin(ang); pts.append((x, y))
        if random.random() < .2:
            ba = ang + random.choice((-1, 1)) * random.uniform(.6, 1.1)
            cracks.append([(x, y), (x + 4 * math.cos(ba), y + 4 * math.sin(ba))])
    cracks.append(pts)
shine = Image.new('RGBA', crop.size, (0, 0, 0, 0)); sd = ImageDraw.Draw(shine)
lines = Image.new('RGBA', crop.size, (0, 0, 0, 0)); ld = ImageDraw.Draw(lines)
for pts in cracks:
    sd.line([P(x + .55, y + .55) for x, y in pts], fill=SHINE, width=SC - 1, joint='curve')
    ld.line([P(x, y) for x, y in pts], fill=OUTLINE, width=SC, joint='curve')
for layer in (shine, lines):
    lm = np.array(layer); lm[..., 3] = np.minimum(lm[..., 3], np.array(gmask)); crop.alpha_composite(Image.fromarray(lm))
# паутина: угол между изогнутым кронштейном и корпусом лампы (слева сверху)
web = Image.new('RGBA', crop.size, (0, 0, 0, 0)); wd = ImageDraw.Draw(web)
wx, wy = 182, 378                      # центр паутины — в изгибе кронштейна
anchors = [(176, 404), (186, 366), (208, 368), (214, 392), (198, 410)]
col = (232, 238, 244, 165)
for ax_, ay_ in anchors: wd.line([P(wx, wy), P(ax_, ay_)], fill=col, width=2)
for f in (.3, .55, .8):
    pts = [(wx + (ax_ - wx) * f, wy + (ay_ - wy) * f) for ax_, ay_ in anchors]
    for i in range(len(pts) - 1):
        (pa, pb), (qa, qb) = pts[i], pts[i + 1]
        m = ((pa + qa) / 2 + (wx - (pa + qa) / 2) * .15, (pb + qb) / 2 + (wy - (pb + qb) / 2) * .15)  # провис к центру
        wd.line([P(pa, pb), P(*m), P(qa, qb)], fill=col, width=2, joint='curve')
crop.alpha_composite(web)
crop = crop.resize((x1 - x0, y1 - y0), Image.Resampling.LANCZOS)
base.paste(crop, (x0, y0)); base.convert('RGB').save('docs/hangar/00-start.png')
