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


def ruin_canvas(img, quad):
    """«До»: на портрете клякса, треснувшее стекло и паутина поверх холста (в координатах холста, потом в перспективу)."""
    cw, ch = 400, 900
    rng = np.random.default_rng(7)
    over = np.zeros((ch, cw, 4), np.float32)  # BGRA слой поверх портрета
    # клякса: тёмные чернила — несколько пятен и брызги, справа ниже лица
    blot = np.zeros((ch, cw), np.uint8)
    cx, cy = 290, 640  # на пиджаке, лицо остаётся видно
    for _ in range(9):
        r = int(rng.integers(16, 40))
        cv2.circle(blot, (int(cx + rng.normal(0, 22)), int(cy + rng.normal(0, 18))), r, 255, -1)
    for _ in range(18):
        a = rng.uniform(0, 2 * np.pi)
        d = rng.uniform(60, 120)
        cv2.circle(blot, (int(cx + np.cos(a) * d), int(cy + np.sin(a) * d * 0.9)), int(rng.integers(3, 10)), 255, -1)
    # подтёк вниз
    cv2.line(blot, (cx + 10, cy + 30), (cx + 18, cy + 150), 255, 14)
    cv2.circle(blot, (cx + 18, cy + 155), 11, 255, -1)
    blot = cv2.GaussianBlur(blot, (5, 5), 0)
    ink = np.array([38, 30, 26], np.float32)
    over[..., :3] += ink * (blot[..., None] / 255.0)
    over[..., 3] = np.maximum(over[..., 3], blot * 0.92)
    # трещина стекла: ломаные лучи из точки удара слева вверху
    crack = np.zeros((ch, cw), np.uint8)
    hx, hy = 110, 230
    for k in range(7):
        a = k / 7 * 2 * np.pi + rng.uniform(-0.3, 0.3)
        x, y = hx, hy
        pts = [(x, y)]
        for _ in range(6):
            a += rng.uniform(-0.35, 0.35)
            step = rng.uniform(40, 85)
            x, y = x + np.cos(a) * step, y + np.sin(a) * step
            pts.append((int(x), int(y)))
        cv2.polylines(crack, [np.array(pts, np.int32)], False, 255, 3)
    for rr in (35, 70):
        cv2.ellipse(crack, (hx, hy), (rr, int(rr * 0.85)), 0, 20, 300, 255, 2)
    crack_sh = cv2.dilate(crack, np.ones((3, 3), np.uint8))
    m = crack_sh > 0
    over[m, :3] = (30, 30, 34)
    over[m, 3] = 170
    m = crack > 0
    over[m, :3] = (235, 240, 245)
    over[m, 3] = 230
    # паутина поверх холста в правом верхнем углу
    web = np.zeros((ch, cw), np.uint8)
    ox, oy = cw - 4, 4
    rays = [np.pi * (0.5 + i / 9 * 0.5) for i in range(10)]
    for a in rays:
        cv2.line(web, (ox, oy), (int(ox + np.cos(a) * 330), int(oy + np.sin(a) * 330)), 255, 2)
    for rr in range(40, 330, 38):
        pts = [(int(ox + np.cos(a) * rr * rng.uniform(0.92, 1.05)), int(oy + np.sin(a) * rr * rng.uniform(0.92, 1.05))) for a in rays]
        cv2.polylines(web, [np.array(pts, np.int32)], False, 255, 2)
    # и клочок в левом нижнем
    ox, oy = 4, ch - 4
    rays2 = [-np.pi * (i / 6 * 0.5) for i in range(7)]
    for a in rays2:
        cv2.line(web, (ox, oy), (int(ox + np.cos(a) * 170), int(oy + np.sin(a) * 170)), 255, 2)
    for rr in range(30, 170, 32):
        pts = [(int(ox + np.cos(a) * rr), int(oy + np.sin(a) * rr)) for a in rays2]
        cv2.polylines(web, [np.array(pts, np.int32)], False, 255, 2)
    m = web > 0
    over[m, :3] = (212, 216, 218)
    over[m, 3] = np.maximum(over[m, 3], 215)
    # пыль: всё чуть серее
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [cw, 0], [cw, ch], [0, ch]]), quad.astype(np.float32))
    warped = cv2.warpPerspective(over, M, (W, H), flags=cv2.INTER_LINEAR)
    cmask = cv2.warpPerspective(np.full((ch, cw), 255, np.uint8), M, (W, H))
    out = img.astype(np.float32)
    dust = cmask > 0
    out[dust] = out[dust] * 0.78 + np.array([60, 62, 64], np.float32) * 0.22
    a = warped[..., 3:4] / 255.0
    out = out * (1 - a) + warped[..., :3] * a
    return np.clip(out, 0, 255).astype(np.uint8)


B = ruin_canvas(B, qb)

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
