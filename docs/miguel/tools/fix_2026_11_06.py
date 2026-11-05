# Точечные правки двух картинок Мигеля от 06.11: панель-голограмма у scan просвечивала пурпурным фоном,
# у path нижний и правый край сцены были обрезаны по линейке — делаем мягкое затухание.
import sys
sys.path.insert(0, 'docs/miguel/tools')
import numpy as np
from PIL import Image
import make_sticker_v2 as ms

SRC = 'docs/miguel/leonardo/2026-11-06/'

# scan: стекло панели → голубое, малиновые столбики → коралловые (иначе их съест ключ по фону)
a = np.array(Image.open(SRC + 'miguel-scan.jpg').convert('RGB')).astype(float)
x0, x1, y0, y1 = 222, 505, 490, 726
p = a[y0:y1, x0:x1]
r, g, b = p[..., 0], p[..., 1], p[..., 2]
# столбики только внутри панели: у её наклонных краёв такой же цвет даёт сам фон
yy, xx = np.mgrid[y0:y1, x0:x1]
bars = (r > 170) & (g < 90) & (b < 150) & (r - b > 60) & (xx > 240) & (xx < 490) & (yy > 530) & (yy < 695)
glass = (r > g + 35) & (b > g + 15) & ~bars
p[glass] = np.array([38, 96, 122]) + (p[glass] - p[glass].mean(0)) * 0.3
p[bars] = [238, 112, 118]
Image.fromarray(a.astype('uint8')).save('/tmp/ggege-scan-fixed.png')
ms.build('/tmp/ggege-scan-fixed.png', 'public/miguel/miguel-scan.webp')

# path: край сцены растворяется, а не обрывается
cut0 = ms.cut
def faded(path, extra=()):
    st = cut0(path, extra)
    al = np.array(st).astype(float)
    h, w = al.shape[:2]
    # скруглённый край: расстояние до внутреннего прямоугольника со скруглением снизу и справа
    R, F = 170, 120
    yy, xx = np.mgrid[0:h, 0:w]
    dx = np.maximum(xx - (w - R), 0)
    dy = np.maximum(yy - (h - R), 0)
    d = np.hypot(dx, dy)
    al[..., 3] *= np.clip((R - d) / F, 0, 1) ** 1.4
    return Image.fromarray(al.astype('uint8'), 'RGBA')
ms.cut = faded
ms.build(SRC + 'miguel-path.jpg', 'public/miguel/miguel-path.webp')
