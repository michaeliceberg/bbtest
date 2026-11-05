import numpy as np, json
from PIL import Image, ImageFilter
# порядок уровней: 1 серебро, 2 синий, 3 фиолетовый, 4 огненный золотой
SPEC = [('9', 1, 320), ('12', 2, 298), ('11', 3, 359), ('10', 4, 346)]
info = {}
for f, lvl, cut in SPEC:
    im = np.asarray(Image.open(f'k{f}.png')).copy()
    filled = np.load(f'k{f}.png.filled.npy')
    top = np.where(filled.any(1))[0][0]
    cols = np.where(filled[top:cut].any(0))[0]
    x0, x1 = cols[0] - 4, cols[-1] + 5
    sel = np.zeros(filled.shape, bool); sel[top-4:cut, x0:x1] = True
    fm = np.asarray(Image.fromarray((filled*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) > 0
    sel &= fm
    knob = np.zeros_like(im); knob[sel] = im[sel]
    body = im.copy().astype(np.float32)
    # дырку от кнопки заполняем свечением/фоном слева и справа (линейно по строке)
    for y in np.where(sel.any(1))[0]:
        xs_ = np.where(sel[y])[0]; L, R = xs_[0] - 1, xs_[-1] + 1
        for x in xs_:
            t = (x - L) / (R - L)
            body[y, x] = body[y, L] * (1 - t) + body[y, R] * t
    body = body.astype(np.uint8)
    # подложка — только залитая дырка (кладём ПОД кнопку), корпус — с прозрачной дыркой (кладём НАД кнопкой)
    back = np.zeros_like(body); back[sel] = body[sel]
    body[sel, 3] = 0
    # общая рамка по всей картинке
    al = im[..., 3] > 12
    ys, xs = np.where(al)
    bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max()+1, ys.max()+1
    s = max(bx1-bx0, by1-by0) + 16
    cx, cy = (bx0+bx1)//2, (by0+by1)//2
    box = (cx - s//2, cy - s//2, cx - s//2 + s, cy - s//2 + s)
    def save(arr, name):
        Image.fromarray(arr).crop(box).resize((256, 256), Image.Resampling.LANCZOS).save(name, 'WEBP', quality=90)
    save(body, f'bell-{lvl}-body.webp'); save(back, f'bell-{lvl}-back.webp'); save(knob, f'bell-{lvl}-knob.webp'); save(im, f'bell-{lvl}.webp')
    # насколько опустить кнопку: ~40% её высоты, в долях картинки
    info[lvl] = round((cut - top) * 0.4 / s, 3)
print(json.dumps(info))
