import sys, numpy as np
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
edge = np.concatenate([im[:8].reshape(-1,3), im[-8:].reshape(-1,3), im[:,:8].reshape(-1,3), im[:,-8:].reshape(-1,3)])
K = np.median(edge, axis=0)
d = np.linalg.norm(im - K, axis=2)
a = np.clip((d - 38)/(120 - 38), 0, 1)
dark = im.max(axis=2) < 80
m = Image.fromarray(np.where(dark, 255, 0).astype(np.uint8)).copy()
ImageDraw.floodfill(m, (0, 0), 128)
filled = np.asarray(m) != 128   # контур и всё внутри него
a = np.where(filled, 1.0, a)
a3 = np.maximum(a, 1e-3)[...,None]
c = np.where(filled[...,None], im, np.clip((im - (1 - a[...,None]) * K) / a3, 0, 255))
Image.fromarray(np.dstack([c, a*255]).astype(np.uint8)).save(out)
np.save(out+'.filled.npy', filled)
ys, xs = np.where(filled)
print(src, 'obj bbox', xs.min(), ys.min(), xs.max(), ys.max())
