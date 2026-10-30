"""Портрет Фейнмана в рамке на левой стене ангара: собирает картинки «до» и «после» из результатов Leonardo.

Вход (docs/hangar/leonardo/):
  feynman-painted.webp — портрет (прозрачный фон), feynman-after.jpg — стена с рамкой, ярко-зелёным холстом и лампой,
  feynman-before.jpg — та же стена с паутиной.
Портрет вставляется в зелёный холст по его 4 углам с перспективой (так лицо одинаковое в «до» и «после»).
Выход (public/hangar/): portrait-after.webp, portrait-before.webp (рамка; у «до» ещё паутина),
  lamp-on.webp, lamp-off.webp (лампа отдельно — горит / выключена и потускневшая).
Запуск: python3 docs/hangar/tools/build_portrait.py
"""
import os
import cv2
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', '..', '..')
SRC = os.path.join(ROOT, 'docs', 'hangar', 'leonardo')
OUT = os.path.join(ROOT, 'public', 'hangar')

after = cv2.imread(os.path.join(SRC, 'feynman-after.jpg'))
before = cv2.imread(os.path.join(SRC, 'feynman-before.jpg'))
H, W = after.shape[:2]


def green_mask(img):
    b, g, r = [img[..., i].astype(int) for i in range(3)]
    return ((g > 130) & (g > r + 25) & (g > b + 50)).astype(np.uint8) * 255


def canvas_quad(img):
    m = green_mask(img)
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    c = max(cnts, key=cv2.contourArea)
    hull = cv2.convexHull(c).reshape(-1, 2).astype(float)
    s, d = hull.sum(1), hull[:, 0] - hull[:, 1]
    return np.array([hull[s.argmin()], hull[d.argmax()], hull[s.argmax()], hull[d.argmin()]], dtype=np.float32)  # TL TR BR BL


def portrait_board():
    """Портрет на тёмно-зелёной меловой доске, прямоугольник с соотношением сторон рамки (≈ 0.72)."""
    p = Image.open(os.path.join(SRC, 'feynman-painted.webp')).convert('RGBA')
    pw, ph = p.size
    cw = int(ph * 0.72)
    cx = int(pw * 0.52)
    p = p.crop((cx - cw // 2, 0, cx + cw // 2, ph))
    board = np.zeros((ph, cw, 3), np.float32)
    yy, xx = np.mgrid[0:ph, 0:cw]
    dist = np.sqrt(((xx - cw / 2) / cw) ** 2 + ((yy - ph * 0.4) / ph) ** 2)
    base = np.array([54, 72, 64], np.float32)  # RGB тёмная доска
    board[:] = base * (1.15 - 0.55 * np.clip(dist, 0, 1))[..., None]
    bimg = Image.fromarray(np.clip(board, 0, 255).astype(np.uint8)).convert('RGBA')
    bimg.alpha_composite(p)
    return cv2.cvtColor(np.array(bimg.convert('RGB')), cv2.COLOR_RGB2BGR)


def insert_portrait(img, quad, art):
    h, w = art.shape[:2]
    # чуть шире зелёного холста, чтобы не осталось зелёной каймы
    c = quad.mean(0)
    q = (quad - c) * 1.02 + c
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [w, 0], [w, h], [0, h]]), q.astype(np.float32))
    warped = cv2.warpPerspective(art, M, (W, H), flags=cv2.INTER_AREA)
    mask = cv2.warpPerspective(np.full((h, w), 255, np.uint8), M, (W, H))
    out = img.copy()
    out[mask > 0] = warped[mask > 0]
    # остатки зелёного у края — цветом доски
    g = green_mask(out) > 0
    out[g] = (64, 72, 54)
    return out


def outer_frame_poly(quad):
    """Внешний контур рамки: холст, раздвинутый наружу (рамка у ближнего края шире — перспектива)."""
    tl, tr, br, bl = quad
    return np.float32([tl + (-41, -37), tr + (22, -20), br + (22, 26), bl + (-40, 36)])


def to_rgba(img, alpha):
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    return Image.fromarray(np.dstack([rgb, alpha]))


def crop_save(im: Image.Image, name, scale=1.0):
    bb = im.getbbox()
    im = im.crop(bb)
    if scale != 1.0:
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    im.save(os.path.join(OUT, name), quality=92)
    print(name, im.size, 'bbox', bb)
    return bb


art = portrait_board()
# Углы холста: по зелёному пятну «после»; «до» — та же композиция (паутина на углу сбивает поиск), берём те же углы.
# Верх-лево у пятна скруглён тенью рамки — подправлено по сетке вручную.
qa = canvas_quad(after)
qa[0] = (183, 360)
qb = qa.copy()
print('canvas after', qa.round().tolist(), 'before', qb.round().tolist())
A = insert_portrait(after, qa, art)
B = insert_portrait(before, qb, art)

# рамка «после»
poly = outer_frame_poly(qa)
fm = np.zeros((H, W), np.uint8)
cv2.fillPoly(fm, [poly.astype(np.int32)], 255)
fm = cv2.GaussianBlur(fm, (3, 3), 0)
crop_save(to_rgba(A, fm), 'portrait-after.webp')

# рамка «до» + паутина (светлые нити, которых нет на «после»)
fmb = np.zeros((H, W), np.uint8)
cv2.fillPoly(fmb, [outer_frame_poly(qb).astype(np.int32)], 255)
la = cv2.cvtColor(after, cv2.COLOR_BGR2GRAY).astype(int)
lb = cv2.cvtColor(before, cv2.COLOR_BGR2GRAY).astype(int)
web = np.clip((lb - la - 12) * 5, 0, 255).astype(np.uint8)
keep = np.zeros_like(web)
keep[140:960, 0:470] = 1  # только паутина у рамки и лампы
web = cv2.dilate(web * keep, np.ones((2, 2), np.uint8))
# нити паутины — светло-серые (в исходнике они полупрозрачные и отдают зеленью стекла)
Bw = B.copy()
wm = (web > 0) & (fmb == 0)
Bw[wm] = (212, 216, 218)
alpha_b = np.maximum(cv2.GaussianBlur(fmb, (3, 3), 0), web)
crop_save(to_rgba(Bw, alpha_b), 'portrait-before.webp')

# лампа: латунь и её тёмный контур на сине-зелёной стене
x0, y0, x1, y1 = 240, 150, 420, 290
sub = after[y0:y1, x0:x1].astype(int)
b, g, r = sub[..., 0], sub[..., 1], sub[..., 2]
warm = (r > 100) & (g > 68) & (b < r - 35)  # латунь; деревянные стойки темнее и краснее
warm = warm.astype(np.uint8) * 255
warm = cv2.morphologyEx(warm, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
cnts, _ = cv2.findContours(warm, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
lm = np.zeros_like(warm)
for c in cnts:
    if cv2.contourArea(c) > 120:
        cv2.drawContours(lm, [c], -1, 255, -1)
lm = cv2.morphologyEx(lm, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17)))
lm = cv2.dilate(lm, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))  # захватить тёмную обводку
lm = cv2.GaussianBlur(lm, (3, 3), 0)
lamp = after[y0:y1, x0:x1]
crop_save(to_rgba(lamp, lm), 'lamp-on.webp')
# выключенная: тусклее, без жёлтой лампочки
off = lamp.astype(np.float32)
bulb = (lamp[..., 2].astype(int) > 200) & (lamp[..., 1].astype(int) > 170)
off = off * 0.62
off[bulb] = (70, 78, 82)
crop_save(to_rgba(np.clip(off, 0, 255).astype(np.uint8), lm), 'lamp-off.webp')

# превью для проверки
cv2.imwrite(os.path.join(SRC, 'feynman-after-composed.jpg'), A)
cv2.imwrite(os.path.join(SRC, 'feynman-before-composed.jpg'), B)
