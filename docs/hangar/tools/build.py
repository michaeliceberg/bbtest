# Собирает ангар: обрезает предметы, правит перспективу, приглушает цвета под фон,
# сохраняет в public/hangar/ и делает превью двух состояний (всё сломано / всё починено).
# Запуск: python3 docs/hangar/tools/build.py
import json, numpy as np
from PIL import Image, ImageDraw, ImageFilter
H = 'docs/hangar'; OUT = 'public/hangar'
import os; os.makedirs(OUT, exist_ok=True)

# id: (файл до, файл после, {до: (x, y низа, ширина px), после: ...}, сжатие по высоте, отражение после)
# координаты — на холсте фона 1024×1024, точка = середина нижнего края предмета
ITEMS = {
  1:  ('01-before', '01-after',  dict(b=(330, 805, 230), a=(330, 800, 72)),  1, 1,   False),
  2:  ('02-before', '02-after',  dict(b=(910, 480, 130), a=(910, 480, 160)), 1, 1,   False),
  3:  ('03-before', '03-after',  dict(b=(735, 790, 230), a=(185, 715, 80)),  1, 1,   False),
  4:  ('04-before', '04-after',  dict(b=(575, 975, 115), a=(575, 975, 78)),  .7, 1,  False),
  5:  ('05-before', '05-after',  dict(b=(330, 690, 150), a=(300, 672, 62)),  1, 1,   False),
  6:  ('06-before', '06-after',  dict(b=(865, 1020, 210), a=(512, 190, 150)), 1, 1,  False),
  7:  ('07-before', '07-after',  dict(b=(860, 715, 165), a=(860, 715, 165)), 1, 1,   False),
  8:  ('08-before', '08-after',  dict(b=(232, 470, 74), a=(232, 470, 68)),   1, 1,   False),
  9:  ('09-before', '09-after',  dict(b=(330, 915, 120), a=(210, 790, 40)),  1, 1,   False),
  10: ('10-before', '10-after',  dict(b=(110, 815, 185), a=(115, 805, 118)), 1, 1,   False),
  11: ('11-before', '11-after', dict(b=(250, 990, 240), a=(215, 975, 130)), 1, 1, False),
  12: ('12-before', '12-after',  dict(b=(720, 965, 170), a=(720, 960, 120)), 1, 1,   False),
  13: ('13-before', '13-after',  dict(b=(745, 715, 85), a=(745, 715, 85)),   1, 1,   False),
}

def grade(im):
    """Приглушить цвета и подтянуть к тёплому свету ангара."""
    a = np.asarray(im, dtype=float)
    rgb = a[..., :3]; lum = rgb.mean(-1, keepdims=True)
    rgb = rgb * 0.8 + lum * 0.2                      # чуть меньше насыщенности
    rgb = rgb * np.array([1.0, 0.93, 0.84]) * 0.92   # тёплый тон, чуть темнее
    a[..., :3] = rgb
    return Image.fromarray(a.clip(0, 255).astype('uint8'), 'RGBA')

def wall_warp(im, top_slope=0.30, bottom_slope=0.17, grow=1.12):
    # Стенд на правой стене: правая сторона ближе (выше), верх и низ идут вдоль балок стены.
    W, Hh = im.size
    hR = Hh * grow; hL = hR + bottom_slope * W - top_slope * W
    yTL = top_slope * W
    outH = int(max(yTL + hL, hR)) + 2
    dst = [(0, yTL), (W, 0), (W, hR), (0, yTL + hL)]
    src = [(0, 0), (W, 0), (W, Hh), (0, Hh)]
    import numpy as _np
    A = []; B = []
    for (x, y), (u, v) in zip(dst, src):
        A += [[x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]]; B += [u, v]
    coef = _np.linalg.solve(_np.array(A, float), _np.array(B, float))
    return im.transform((W, outH), Image.Transform.PERSPECTIVE, tuple(coef), Image.Resampling.BICUBIC)

def prep(name, squash, flip, erase=None):
    im = Image.open(f'{H}/{name}.png').convert('RGBA')
    if erase:  # стереть лишнее (угол ящика у 11-before)
        d = ImageDraw.Draw(im); d.polygon(erase, fill=(0, 0, 0, 0))
    im = im.crop(im.getchannel('A').getbbox())
    if squash != 1: im = im.resize((im.width, max(1, round(im.height * squash))), Image.Resampling.LANCZOS)
    if flip: im = im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    if name.startswith('02-'): im = wall_warp(im); im = im.crop(im.getchannel('A').getbbox())
    return grade(im)

bg = Image.open(f'{H}/bg-empty.jpg').convert('RGB')
bg.save(f'{OUT}/bg.webp', quality=86)
layout = {}
for i, (bn, an, pos, sb, sa, flip) in ITEMS.items():
    for key, name, sq, fl in (('b', bn, sb, False), ('a', an, sa, flip)):
        im = prep(name, sq, fl, erase=None)
        x, y, w = pos[key]
        h = round(im.height * w / im.width)
        im = im.resize((w * 2, h * 2), Image.Resampling.LANCZOS)  # ×2 — чётко на телефоне с ретиной
        fn = f'{i:02d}-{"before" if key == "b" else "after"}.webp'
        im.save(f'{OUT}/{fn}', quality=88)
        layout.setdefault(i, {})[key] = dict(src=f'/hangar/{fn}', x=x, y=y, w=w, h=h)
# Ракета: 8 стадий R0–R7 (решено заданий второй части 0…7). Общая рамка для всех стадий — не прыгает.
RX, RY, RH = 512, 668, 435          # середина низа и высота ракеты на холсте фона
box = (205, 100, 815, 935)          # объединение рамок всех стадий
rocket = []
for st in range(8):
    im = Image.open(f'{H}/R{st}.png').convert('RGBA').crop(box)
    w = round(im.width * RH / im.height)
    im = grade(im).resize((w * 2, RH * 2), Image.Resampling.LANCZOS)
    im.save(f'{OUT}/R{st}.webp', quality=88)
    rocket.append(dict(src=f'/hangar/R{st}.webp', x=RX, y=RY, w=w, h=RH))
layout['rocket'] = rocket
# Грязный фон (выровнен с чистым — проявляется поверх него ступенями) и хлам на полу (исчезает по одному).
Image.open(f'{H}/bg-dirty.jpg').convert('RGB').save(f'{OUT}/bg-dirty.webp', quality=86)
JUNK = {  # номер: (x, y низа, ширина) на холсте 1024
  1: (470, 885, 75), 2: (600, 735, 70), 3: (420, 712, 62), 4: (70, 905, 115), 5: (955, 800, 120),
  6: (640, 870, 110), 7: (985, 965, 95), 8: (385, 772, 58), 9: (655, 805, 120), 10: (50, 730, 100),
  11: (560, 940, 62), 12: (455, 1022, 135), 13: (705, 770, 70),
}
junk = []
for j, (x, y, w) in JUNK.items():
    im = Image.open(f'{H}/junk-{j:02d}.png').convert('RGBA'); im = im.crop(im.getchannel('A').getbbox())
    h = round(im.height * w / im.width)
    grade(im).resize((w * 2, h * 2), Image.Resampling.LANCZOS).save(f'{OUT}/junk-{j:02d}.webp', quality=86)
    junk.append(dict(src=f'/hangar/junk-{j:02d}.webp', x=x, y=y, w=w, h=h))
layout['junk'] = junk
json.dump(layout, open('lib/hangarLayout.json', 'w'), indent=1)

def compose(state):
    c = (Image.open(f'{H}/bg-dirty.jpg').convert('RGB') if state == 'b' else bg).convert('RGBA')
    if state == 'b':
        for p in layout['junk']:
            c.alpha_composite(Image.open(f'{OUT}' + p['src'][len('/hangar'):]).resize((p['w'], p['h'])), (round(p['x'] - p['w'] / 2), p['y'] - p['h']))
    r = layout['rocket'][0 if state == 'b' else 7]
    c.alpha_composite(Image.open(f'{OUT}/R{0 if state == "b" else 7}.webp').resize((r['w'], r['h'])), (round(r['x'] - r['w'] / 2), r['y'] - r['h']))
    for i, L in layout.items():
        if i in ('rocket', 'junk'): continue
        p = L[state]; im = Image.open(f'{OUT}' + p['src'][len('/hangar'):]).resize((p['w'], p['h']))
        if i not in (2, 6, 8) or state == 'b' and i == 6:  # тень под предметами на полу
            sh = Image.new('L', c.size, 0); ImageDraw.Draw(sh).ellipse((p['x'] - p['w'] * .45, p['y'] - p['h'] * .07 - 4, p['x'] + p['w'] * .45, p['y'] + p['h'] * .05 + 4), fill=120)
            c = Image.composite(Image.new('RGBA', c.size, (20, 10, 15, 255)), c, sh.filter(ImageFilter.GaussianBlur(6)))
        c.alpha_composite(im, (round(p['x'] - p['w'] / 2), round(p['y'] - p['h'])))
    return c.convert('RGB')
prev = Image.new('RGB', (2048, 1024))
prev.paste(compose('b'), (0, 0)); prev.paste(compose('a'), (1024, 0))
prev.save('/private/tmp/claude-501/-Users-mac-Desktop-DuoLingoClone-lingo/979e57f5-2914-4ced-b31a-e9289601fcd3/scratchpad/hangar_preview.png')
print('ok')
