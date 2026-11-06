#!/usr/bin/env python3
# Баллометр: вырезает картинки Leonardo (docs/hangar/leonardo/meter-military, map-strip, flag-*) в public/meter/.
# Фон — пурпурный, ключ по цвету. Флажок режется на шапку (навершие + полотнище), кусок древка и остриё:
# древко тянем кодом до нужной высоты, текст на полотнище кладём кодом.
import colorsys, os
from PIL import Image, ImageFilter
L='docs/hangar/leonardo/'; OUT='public/meter/'; os.makedirs(OUT,exist_ok=True)

def key(path):
    im=Image.open(path).convert('RGB'); W,H=im.size; p=im.load()
    a=Image.new('L',(W,H),255); ap=a.load()
    for y in range(H):
        for x in range(W):
            r,g,b=p[x,y]
            if r-g>45 and b-g>15: ap[x,y]=0  # и пурпурный фон, и его смесь с контуром (кайма)
    a=a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.7))
    im=im.convert('RGBA'); im.putalpha(a); return im

def save(im,name,w=None):
    if w: im=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS)
    im.save(OUT+name,'WEBP',quality=88,method=6); print(name,im.size,os.path.getsize(OUT+name)//1024,'KB')

g=key(L+'meter-military.jpg'); bb=g.getbbox(); print('gauge bbox',bb)
g=g.crop(bb); s=max(g.size); c=Image.new('RGBA',(s,s)); c.paste(g,((s-g.width)//2,(s-g.height)//2)); save(c,'gauge.webp',620)

m=key(L+'map-strip-wide.jpg'); bb=m.getbbox(); print('map bbox',bb); save(m.crop(bb),'map.webp',900)

def pole_center(im,y):
    a=im.split()[3]; xs=[x for x in range(im.width) if a.getpixel((x,y))>128]
    return (xs[0]+xs[-1])/2,(xs[-1]-xs[0]+1)

def recolor(im,fn):
    out=im.copy(); p=out.load()
    for y in range(out.height):
        for x in range(out.width):
            r,g,b,a=p[x,y]
            if a: p[x,y]=(*fn(r,g,b),a)
    return out

def flag(path,name,y_pole0,y_pole1,top,mid_y,tip_y_guess,head_bottom,paint=None):
    im=key(path)
    x0,_=pole_center(im,y_pole0); x1,_=pole_center(im,y_pole1)
    k=(x1-x0)/(y_pole1-y_pole0)
    if abs(k)>.005: # древко наклонено: выпрямляем
        im=im.transform(im.size,Image.AFFINE,(1,k,-k*y_pole0,0,1,0),Image.BICUBIC)
    if paint: paint(im)
    bb=im.getbbox(); print(name,'bbox',bb,'k',round(k,3))
    cx,w=pole_center(im,mid_y); print(' pole x',cx,'w',w)
    head=im.crop((bb[0],top,bb[2],head_bottom)); print(' head',head.size,'poleX',cx-bb[0])
    pw=int(w//2+5)
    pole=im.crop((int(cx)-pw,mid_y-30,int(cx)+pw,mid_y+30))
    pin=im.crop((int(cx)-pw-4,y_pole1+8,int(cx)+pw+4,bb[3]))
    print(' pole',pole.size,'pin',pin.size)
    return head,pole,pin

def erase_star(im):
    p=im.load()
    for y in range(300,395):
        for x in range(405,495):
            r,g,b,a=p[x,y]
            if a and min(r,g,b)>120: p[x,y]=p[x,398 if y>350 else 298]
    # подчистить светлую кайму звезды
    bg=p[400,350]
    for y in range(300,395):
        for x in range(405,495):
            r,g,b,a=p[x,y]
            if g-r<25 or g<110: p[x,y]=bg
head,pole,pin=flag(L+'flag-plan.jpg','plan',480,770,200,620,0,452,erase_star)
hw=head.size; save(head,'flag-plan.webp',360); 
def to_red(r,g,b):
    if g>r+8: return (min(255,g+70),max(0,r-40),max(0,b-20))  # зелёное полотнище → красное
    return (r,g,b)
save(recolor(head,to_red),'flag-plan-late.webp',360)
save(pole,'flag-plan-pole.webp'); save(pin,'flag-plan-pin.webp')

head,pole,pin=flag(L+'flag-forecast.jpg','forecast',530,740,222,620,0,515)
save(head,'flag-forecast-red.webp',360)
def tint(h):
    def f(r,g,b):
        if r>190 and g>140:  # бледное полотнище
            _,l,s=colorsys.rgb_to_hls(r/255,g/255,b/255)
            return tuple(round(v*255) for v in colorsys.hls_to_rgb(h,l,min(1,s*1.1)))
        return (r,g,b)
    return f
save(recolor(head,tint(.13)),'flag-forecast-yellow.webp',360)
save(recolor(head,tint(.26)),'flag-forecast-green.webp',360)
save(pole,'flag-forecast-pole.webp'); save(pin,'flag-forecast-pin.webp')
# контрольный лист
sheet=Image.new('RGB',(1300,620),(21,31,35)); x=10
for n,w in [('gauge',300),('map',480),('flag-plan',170),('flag-plan-late',170)]:
    i=Image.open(OUT+n+'.webp').convert('RGBA'); i=i.resize((w,round(i.height*w/i.width))); sheet.paste(i,(x,10),i); x+=w+10
x=10
for n in ['flag-forecast-red','flag-forecast-yellow','flag-forecast-green','flag-plan-pole','flag-plan-pin','flag-forecast-pole','flag-forecast-pin']:
    i=Image.open(OUT+n+'.webp').convert('RGBA'); sheet.paste(i,(x,330),i) if i.width<300 else None
    if i.width>=300:
        i=i.resize((220,round(i.height*220/i.width))); sheet.paste(i,(x,330),i); x+=230
    else: x+=i.width+10
sheet.save(os.environ.get('SHEET','/tmp/sheet.png'))
