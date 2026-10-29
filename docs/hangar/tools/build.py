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
  2:  ('02-before', '02-after',  dict(b=(905, 585, 130), a=(905, 585, 160)), 1, 1,   False),
  3:  ('03-before', '03-after',  dict(b=(735, 790, 230), a=(850, 735, 75)),  1, 1,   True),
  4:  ('04-before', '04-after',  dict(b=(575, 975, 115), a=(575, 975, 78)),  .7, 1,  False),
  5:  ('05-before', '05-after',  dict(b=(905, 875, 175), a=(930, 860, 70)),  1, 1,   False),
  6:  ('06-before', '06-after',  dict(b=(865, 1020, 210), a=(512, 205, 170)), 1, 1,  False),
  7:  ('07-before', '07-after',  dict(b=(860, 715, 165), a=(860, 715, 165)), 1, 1,   False),
  8:  ('08-before', '08-after',  dict(b=(232, 470, 74), a=(232, 470, 68)),   1, 1,   False),
  9:  ('09-before', '09-after',  dict(b=(330, 915, 120), a=(210, 790, 40)),  1, 1,   False),
  10: ('10-before', '10-after',  dict(b=(110, 815, 185), a=(115, 805, 118)), 1, 1,   False),
  11: ('11-before-draft', '11-after-draft', dict(b=(215, 985, 235), a=(215, 985, 200)), .45, .55, False),
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

def prep(name, squash, flip, erase=None):
    im = Image.open(f'{H}/{name}.png').convert('RGBA')
    if erase:  # стереть лишнее (угол ящика у 11-before)
        d = ImageDraw.Draw(im); d.polygon(erase, fill=(0, 0, 0, 0))
    im = im.crop(im.getchannel('A').getbbox())
    if squash != 1: im = im.resize((im.width, max(1, round(im.height * squash))), Image.Resampling.LANCZOS)
    if flip: im = im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    return grade(im)

bg = Image.open(f'{H}/bg-empty.jpg').convert('RGB')
bg.save(f'{OUT}/bg.webp', quality=86)
layout = {}
for i, (bn, an, pos, sb, sa, flip) in ITEMS.items():
    for key, name, sq, fl in (('b', bn, sb, False), ('a', an, sa, flip)):
        im = prep(name, sq, fl, erase=[(0, 760), (330, 1024), (0, 1024)] if name == '11-before-draft' else None)
        x, y, w = pos[key]
        h = round(im.height * w / im.width)
        im = im.resize((w * 2, h * 2), Image.Resampling.LANCZOS)  # ×2 — чётко на телефоне с ретиной
        fn = f'{i:02d}-{"before" if key == "b" else "after"}.webp'
        im.save(f'{OUT}/{fn}', quality=88)
        layout.setdefault(i, {})[key] = dict(src=f'/hangar/{fn}', x=x, y=y, w=w, h=h)
json.dump(layout, open('lib/hangarLayout.json', 'w'), indent=1)

def compose(state):
    c = bg.convert('RGBA')
    for i, L in layout.items():
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
