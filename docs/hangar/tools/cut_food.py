# Еда котика из Leonardo на малиновом фоне → прозрачная WebP (ширина до 320). Запуск: python3 docs/hangar/tools/cut_food.py вход.jpg выход.webp
import sys
import numpy as np
from PIL import Image, ImageFilter

a = np.array(Image.open(sys.argv[1]).convert('RGB')).astype(int)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
# малиновый фон и его смесь с контуром: красный и синий заметно выше зелёного, красный выше синего
bg = (r > 110) & (g < 110) & (r - b > 25) & (b - g > 35)
mask = Image.fromarray(((~bg) * 255).astype('uint8'))
mask = mask.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))  # закрыть мелкие дырки
mask = mask.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(0.9))  # срезать малиновую кайму
im = Image.fromarray(np.dstack([a, np.array(mask)]).astype('uint8'), 'RGBA')
im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox())
w = min(320, im.width)
im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
im.save(sys.argv[2], 'WEBP', quality=88)
print(sys.argv[2], im.size)
