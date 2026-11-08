# Стикер без белой обводки, с мягкой тенью по силуэту (как стикеры гуся Мигеля). 512×512 WebP.
# Запуск: python3 docs/stickers/tools/soft_shadow.py вход выход [--strip]
# --strip: у готового стикера с белой обводкой срезать обводку (белое, связанное с прозрачным краем, глубиной до 9% размера).
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

SIZE = 512
# Две тени (запечены в картинку — процессор телефона на них не тратится): широкая мягкая + плотная у края.
DROP_Y, DROP_BLUR, DROP_A = 0.045, 0.03, 0.75
NEAR_Y, NEAR_BLUR, NEAR_A = 0.014, 0.009, 0.5

def outline_width(white, opaque):
    """Толщина белой обводки: самая частая длина белой полосы от прозрачного края внутрь (по строкам и столбцам).
    Белая шерсть или буквы дают полосы длиннее и разной длины — мода их не замечает."""
    runs = []
    for arr_w, arr_o in ((white, opaque), (white.T, opaque.T)):
        for rw, ro in zip(arr_w, arr_o):
            idx = np.flatnonzero(ro)
            if not len(idx): continue
            for start, step in ((idx[0], 1), (idx[-1], -1)):
                n, i = 0, start
                while 0 <= i < len(rw) and rw[i] and ro[i]: n += 1; i += step
                if n and 0 <= i < len(rw) and ro[i]: runs.append(n)   # полоса кончилась картинкой, а не прозрачностью
    if not runs: return 0
    vals, cnt = np.unique(runs, return_counts=True)
    return int(vals[np.argmax(cnt)])

def strip_outline(im):
    a = np.array(im.convert('RGBA')).astype(int)
    H, W = a.shape[:2]
    rgb, al = a[..., :3], a[..., 3]
    white = (rgb.min(-1) > 200) & (rgb.max(-1) - rgb.min(-1) < 40) & (al > 0)
    semi = (al >= 30) & (al < 200)
    lim = outline_width(white, al > 30) + 2
    dist = np.full((H, W), -1)
    q = deque()
    for y, x in zip(*np.nonzero(al < 30)):
        dist[y, x] = 0; q.append((y, x))
    keep = np.ones((H, W), bool)
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if not (0 <= ny < H and 0 <= nx < W) or dist[ny, nx] >= 0: continue
            if semi[ny, nx] and not white[ny, nx]:      # старая полупрозрачная тень за обводкой — убираем, глубину не считаем
                dist[ny, nx] = dist[y, x]; keep[ny, nx] = False; q.appendleft((ny, nx))
            elif white[ny, nx] and dist[y, x] < lim:
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
    pad = int(s * 0.09)
    C = s + 2 * pad
    canvas = Image.new('RGBA', (C, C), (0, 0, 0, 0))
    ox, oy = (C - w) // 2, pad + (s - h)
    for dy, blur, op in ((DROP_Y, DROP_BLUR, DROP_A), (NEAR_Y, NEAR_BLUR, NEAR_A)):
        al = Image.new('L', (C, C), 0); al.paste(im.split()[3], (ox, oy + int(s * dy)))
        al = al.filter(ImageFilter.GaussianBlur(s * blur)).point(lambda v, op=op: int(v * op))
        sh = Image.new('RGBA', (C, C), (0, 0, 0, 0)); sh.putalpha(al)
        canvas = Image.alpha_composite(canvas, sh)
    canvas.paste(im, (ox, oy), im)
    return canvas.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def inplace(im):
    """Тот же холст и то же место (стикеры в уроках стоят по координатам): срезали обводку, тень — на её место."""
    im = strip_outline(im)
    W, H = im.size
    s = max(W, H)
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for dy, blur, op in ((DROP_Y * 0.7, DROP_BLUR * 0.8, DROP_A), (NEAR_Y, NEAR_BLUR, NEAR_A)):
        al = Image.new('L', (W, H), 0); al.paste(im.split()[3], (0, int(s * dy)))
        al = al.filter(ImageFilter.GaussianBlur(s * blur)).point(lambda v, op=op: int(v * op))
        sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); sh.putalpha(al)
        canvas = Image.alpha_composite(canvas, sh)
    return Image.alpha_composite(canvas, im)


if __name__ == '__main__':
    # python3 soft_shadow.py вход выход         — новый стикер без обводки (квадрат 512)
    # python3 soft_shadow.py вход выход --inplace — у готового стикера с белой обводкой: тот же холст, обводка → тень
    src, dst = sys.argv[1], sys.argv[2]
    im = Image.open(src).convert('RGBA')
    (inplace(im) if '--inplace' in sys.argv else shadowed(im)).save(dst, quality=88)
