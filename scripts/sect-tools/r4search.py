import itertools, random
E=1e-9
corners=[(x,y,z) for x in (0,1) for y in (0,1) for z in (0,1)]
edges=[(a,b) for a,b in itertools.combinations(corners,2) if sum(abs(a[i]-b[i]) for i in range(3))==1]
def faces(v):
    f=[]
    if abs(v[2]-1)<E:f.append('ceiling')
    if abs(v[2])<E:f.append('floor')
    if abs(v[1])<E:f.append('front')
    if abs(v[1]-1)<E:f.append('back')
    if abs(v[0])<E:f.append('left')
    if abs(v[0]-1)<E:f.append('right')
    return f
OPP={'ceiling':'floor','floor':'ceiling','front':'back','back':'front','left':'right','right':'left'}
def lerp(a,b,t): return tuple(a[i]+(b[i]-a[i])*t for i in range(3))
def sub(a,b): return tuple(a[i]-b[i] for i in range(3))
def cross(a,b): return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def dot(a,b): return sum(a[i]*b[i] for i in range(3))
def section(p1,p2,p3):
    n=cross(sub(p2,p1),sub(p3,p1)); d=dot(n,p1)
    pts=[]
    for a,b in edges:
        fa=dot(n,a)-d; fb=dot(n,b)-d
        if abs(fa)<E: pts.append(a)
        if abs(fb)<E: pts.append(b)
        if fa*fb<-E: pts.append(lerp(a,b,fa/(fa-fb)))
    u=[]
    for p in pts:
        if not any(max(abs(p[i]-q[i]) for i in range(3))<1e-6 for q in u): u.append(p)
    return u
def is_corner(p): return all(abs(c)<1e-6 or abs(c-1)<1e-6 for c in p)
def solve(poly, known):
    # rules 1,2 only (greedy): chords on faces
    polyf=set(f for p in poly for f in faces(p) if sum(1 for q in poly if f in faces(q))>=2)
    known=list(known); done=set()
    def kf(f): return [p for p in known if f in faces(p)]
    for _ in range(20):
        ch=False
        for f in polyf:
            if f in done: continue
            if len(kf(f))>=2:
                done.add(f)
                for p in poly:
                    if f in faces(p) and p not in known: known.append(p)
                ch=True
        for f in list(done):
            g=OPP[f]
            if g in polyf and g not in done and kf(g):
                done.add(g)
                for p in poly:
                    if g in faces(p) and p not in known: known.append(p)
                ch=True
        if not ch: break
    return done==polyf, done, polyf
random.seed(7)
ts=[0.25,0.3,0.35,0.4,0.6,0.65,0.7,0.75]
nonfloor=[e for e in edges if not (abs(e[0][2])<E and abs(e[1][2])<E)]
flooredges=[e for e in edges if abs(e[0][2])<E and abs(e[1][2])<E]
res=[]
for fe in flooredges:
  for tf in ts:
    F=lerp(*fe,tf)
    for ea,eb in itertools.combinations(nonfloor,2):
      for ta in ts:
        for tb in ts:
          A=lerp(*ea,ta); B=lerp(*eb,tb)
          if abs(A[2]-B[2])<0.15: continue
          if any(set(faces(p))&set(faces(q)) for p,q in [(F,A),(F,B),(A,B)]): continue
          t=A[2]/(A[2]-B[2]); X=lerp(A,B,t)
          if -0.05<X[0]<1.05 and -0.05<X[1]<1.05: continue
          if max(abs(X[0]-0.5),abs(X[1]-0.5))>1.3: continue
          poly=section(F,A,B)
          if len(poly)<5 or any(is_corner(p) for p in poly): continue
          # floor chord F->X
          fl=[p for p in poly if 'floor' in faces(p)]
          if len(fl)!=2: continue
          N1=[p for p in fl if max(abs(p[i]-F[i]) for i in range(3))>1e-6][0]
          # X on line F-N1 ?
          ok,_,_=solve(poly,[F,N1,A,B])
          if not ok: continue
          res.append((len(poly),F,A,B,X,N1))
random.shuffle(res)
seen=set(); out=[]
for r in res:
    key=(r[0], tuple(sorted(faces(r[2])+faces(r[3]))))
    if key in seen: continue
    seen.add(key); out.append(r)
for r in out[:20]: print(r[0],'F',r[1],'A',r[2],'B',r[3],'X',tuple(round(c,3) for c in r[4]),'N1',tuple(round(c,3) for c in r[5]))
print(len(res))
