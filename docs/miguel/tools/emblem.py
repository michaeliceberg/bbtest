from PIL import Image, ImageDraw
import math, sys
CX,CY=float(sys.argv[1]),float(sys.argv[2]); SC=float(sys.argv[3]); ROT=math.radians(float(sys.argv[4])); SY=float(sys.argv[5])
S=8
GOLD=(233,200,66,255); DARK=(45,26,8,255); EYE=(120,20,20,255)
def T(p):
    x,y=p; x*=SC; y*=SC*SY
    xr=x*math.cos(ROT)-y*math.sin(ROT); yr=x*math.sin(ROT)+y*math.cos(ROT)
    return ((CX+xr)*S,(CY+yr)*S)
def arc(r,a0,a1,n=40):
    return [(r*math.cos(math.radians(a0+(a1-a0)*k/n)), r*math.sin(math.radians(a0+(a1-a0)*k/n))) for k in range(n+1)]
# G-body: arc from top (-60deg) counter... screen angles: 0=right, 90=down
body=arc(10,-55,235)          # open on the upper right
bar=[(10*math.cos(math.radians(235))*0+2,3),(9,3)]  # inner bar of G
head_c=(10*math.cos(math.radians(-55)),10*math.sin(math.radians(-55)))  # end of arc = goose head
beak=[(head_c[0]+2.5,head_c[1]-2.5),(head_c[0]+10,head_c[1]+0.5),(head_c[0]+2.5,head_c[1]+2.5)]
def star(cx,cy,R,r):
    pts=[]
    for k in range(10):
        a=math.radians(-90+36*k); rr=R if k%2==0 else r
        pts.append((cx+rr*math.cos(a),cy+rr*math.sin(a)))
    return pts
st=star(-11,-13,4.2,1.8)
lay=Image.new('RGBA',(1024*S,1024*S),(0,0,0,0)); d=ImageDraw.Draw(lay)
W=4.2*SC*S; O=1.6*SC*S
# outline pass
d.line([T(p) for p in body],fill=DARK,width=int(W+2*O),joint='curve')
d.line([T(p) for p in bar],fill=DARK,width=int(W*0.8+2*O))
d.ellipse([T((head_c[0]-3.6,head_c[1]-3.6))[0]-0,0,0,0],fill=None) if False else None
def circ(c,r,fill):
    pts=[T((c[0]+r*math.cos(a/20*2*math.pi), c[1]+r*math.sin(a/20*2*math.pi))) for a in range(20)]
    d.polygon(pts,fill=fill)
circ(head_c,3.6+1.6,DARK)
d.polygon([T(p) for p in beak],fill=DARK,outline=DARK,width=int(2*O))
d.polygon([T(p) for p in st],fill=DARK,outline=DARK,width=int(2*O))
# gold pass
d.line([T(p) for p in body],fill=GOLD,width=int(W),joint='curve')
d.line([T(p) for p in bar],fill=GOLD,width=int(W*0.8))
circ(head_c,3.6,GOLD)
d.polygon([T(p) for p in beak],fill=GOLD)
d.polygon([T(p) for p in st],fill=GOLD)
circ((head_c[0]+0.6,head_c[1]-0.6),1.0,EYE)
lay=lay.resize((1024,1024),Image.LANCZOS)
base=Image.open('base24.jpg').convert('RGBA'); base.alpha_composite(lay); base=base.convert('RGB')
base.save('base24_emblem.jpg',quality=95)
base.crop((380,440,520,560)).resize((560,480),Image.LANCZOS).save('emblem_zoom.png')
