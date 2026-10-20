import itertools, math
exec(open('scripts/sect-tools/r4search.py').read().split('random.seed')[0])
S,DEPTH,OX,OY=150,0.5,62,252
def P(v): return (OX+S*v[0]+S*DEPTH*v[1]*0.7071, OY-S*v[2]-S*DEPTH*v[1]*0.7071)
def segd(p,a,b):
    ax,ay=a; bx,by=b; px,py=p; dx,dy=bx-ax,by-ay; L=dx*dx+dy*dy
    t=max(0,min(1,((px-ax)*dx+(py-ay)*dy)/L)); return math.hypot(px-ax-t*dx,py-ay-t*dy)
def on_edge(v,e):
    a,b=e; d=sub(b,a); w=sub(v,a); c=cross(d,w)
    if max(abs(x) for x in c)>1e-6: return False
    t=dot(w,d)/dot(d,d); return -1e-6<=t<=1+1e-6
EDGE_TH, PT_TH = 16, 22
def issues(points, label=''):
    out=[]
    for name,v in points:
        own=[e for e in edges if on_edge(v,e)]
        for e in edges:
            if on_edge(v,e): continue
            if any(set(e)&set(o) for o in own): continue  # соседнее ребро того же угла — это не сливание
            d=segd(P(v),P(e[0]),P(e[1]))
            hid=(0,1,0) in e  # пунктирные рёбра — у невидимого угла (0,1,0)
            if d<(6 if hid else 16): out.append(f'{name}{tuple(round(c,2) for c in v)} ~ {"пунктир" if hid else "ребро"} {e[0]}-{e[1]} {d:.0f}px')
    for (n1,a),(n2,b) in itertools.combinations(points,2):
        d=math.hypot(P(a)[0]-P(b)[0],P(a)[1]-P(b)[1])
        if d<PT_TH and max(abs(a[i]-b[i]) for i in range(3))>1e-6: out.append(f'{n1}~{n2} {d:.0f}px')
    return out
def check_cfg(start, extra=()):
    poly=section(*start)
    pts=[('s%d'%i,v) for i,v in enumerate(start)]+[('v%d'%i,v) for i,v in enumerate(poly) if not any(max(abs(v[k]-s[k]) for k in range(3))<1e-6 for s in start)]+list(extra)
    return issues(pts)
