import numpy as np
from PIL import Image, ImageFilter, ImageDraw
im=np.array(Image.open('images/5.png').convert('RGBA')).astype(float)
r,g,b,a=[im[...,i] for i in range(4)]
green=(a>0)&(g>=r-4)&(g>b+8)
glass=(a>0)&(np.maximum(np.maximum(r,g),b)<95)&(g>=r-2)
def P(x): return Image.fromarray((x*255).astype(np.uint8))
def N(p): return np.array(p)>127
m=P(green|glass)
m=m.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))   # убрать крошки
m=m.filter(ImageFilter.MaxFilter(13)).filter(ImageFilter.MinFilter(13)) # закрыть щели
# заливка дыр: снаружи от угла
inv=Image.fromarray(np.where(N(m),0,255).astype(np.uint8)).convert('L')
ImageDraw.floodfill(inv,(0,0),128)
mm=N(m)|(np.array(inv)==255)
ring=N(P(mm).filter(ImageFilter.MaxFilter(15)))&~mm
out=im.copy()
dark=[45,25,16]
for c in range(3): out[...,c]=np.where(ring, np.where((r+g+b)<200, im[...,c], dark[c]), out[...,c])
full=mm|ring
out[...,3]=np.array(P(full).filter(ImageFilter.GaussianBlur(1.2)))
sel=mm&green
mean=np.array([out[...,c][sel].mean() for c in range(3)])
k=np.array([128,134,80])/mean
for c in range(3): out[...,c]=np.where(mm, np.clip(out[...,c]*k[c],0,255), out[...,c])
img=Image.fromarray(out.astype(np.uint8),'RGBA'); img=img.crop(img.getbbox())
img.save('scratchpad/table/helmet-cut.png'); print(img.size, mean)
