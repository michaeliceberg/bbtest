import math

BG = "#151F23"
GRID = "#3A464E"
AXIS = "#9AA7B0"
CURVE = "#f0a868"
TEXT = "#F2F7FB"
DOT = "#0369a1"
CELL = 40

def axis_label(gtype):
    return {'v':'v, м/с','x':'x, м','a':'a, м/с²','F':'F, Н'}.get(gtype, gtype)

def render(pts, gtype, pts2=None, label1=None, label2=None, xlabel="t, с", ylabel=None):
    all_pts = pts + (pts2 or [])
    ts = [p[0] for p in all_pts]
    vs = [p[1] for p in all_pts]
    tmin, tmax = min(0, min(ts)), max(ts)
    vmin, vmax = min(vs), max(vs)
    pad_t = max(1, (tmax - tmin) * 0.15)
    pad_v = max(1, (vmax - vmin) * 0.25)
    x_min, x_max = tmin - pad_t*0.3, tmax + pad_t
    y_min, y_max = min(0, vmin - pad_v), vmax + pad_v

    def nice_step(span):
        if span <= 0: return 1
        raw = span / 8
        mag = 10 ** math.floor(math.log10(raw)) if raw > 0 else 1
        for m in (1,2,2.5,5,10):
            if mag*m >= raw:
                return mag*m
        return mag*10

    tstep = nice_step(x_max - x_min)
    vstep = nice_step(y_max - y_min)

    MARGIN = 30
    w = (x_max - x_min) / tstep * CELL + MARGIN
    h = (y_max - y_min) / vstep * CELL + MARGIN

    def sx(t): return (t - x_min) / tstep * CELL + MARGIN*0.3
    def sy(v): return h - MARGIN - (v - y_min) / vstep * CELL + MARGIN*0.7

    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:.0f}" height="{h:.0f}" viewBox="0 0 {w:.0f} {h:.0f}">']
    svg.append(f'<rect x="0" y="0" width="{w:.0f}" height="{h:.0f}" fill="{BG}"/>')

    # grid
    t = math.ceil(x_min/tstep)*tstep
    while t <= x_max + 1e-9:
        svg.append(f'<line x1="{sx(t):.1f}" y1="0" x2="{sx(t):.1f}" y2="{h:.0f}" stroke="{GRID}" stroke-width="1"/>')
        t += tstep
    v = math.ceil(y_min/vstep)*vstep
    while v <= y_max + 1e-9:
        svg.append(f'<line x1="0" y1="{sy(v):.1f}" x2="{w:.0f}" y2="{sy(v):.1f}" stroke="{GRID}" stroke-width="1"/>')
        v += vstep

    ox, oy = sx(0), sy(0)
    svg.append(f'<line x1="{ox:.1f}" y1="{h:.0f}" x2="{ox:.1f}" y2="0" stroke="{AXIS}" stroke-width="2"/>')
    svg.append(f'<polygon points="{ox-5:.1f},10 {ox+5:.1f},10 {ox:.1f},0" fill="{AXIS}"/>')
    svg.append(f'<line x1="0" y1="{oy:.1f}" x2="{w:.0f}" y2="{oy:.1f}" stroke="{AXIS}" stroke-width="2"/>')
    svg.append(f'<polygon points="{w-10:.1f},{oy-5:.1f} {w-10:.1f},{oy+5:.1f} {w:.0f},{oy:.1f}" fill="{AXIS}"/>')

    svg.append(f'<text x="{ox-16:.1f}" y="{oy+18:.1f}" font-family="Georgia, serif" font-style="italic" font-size="15" fill="{TEXT}">0</text>')
    svg.append(f'<text x="{w-16:.1f}" y="{oy-8:.1f}" font-family="Georgia, serif" font-style="italic" font-size="15" fill="{TEXT}">{xlabel}</text>')
    svg.append(f'<text x="{ox+8:.1f}" y="14" font-family="Georgia, serif" font-style="italic" font-size="15" fill="{TEXT}">{ylabel or axis_label(gtype)}</text>')

    def fmt(n):
        if abs(n-round(n)) < 1e-6:
            return str(int(round(n)))
        return f"{n:g}".replace('.', ',')

    t = math.ceil(x_min/tstep)*tstep
    while t <= x_max + 1e-9:
        if abs(t) > 1e-9:
            svg.append(f'<text x="{sx(t)-5:.1f}" y="{oy+16:.1f}" font-family="Georgia, serif" font-style="italic" font-size="11" fill="{TEXT}">{fmt(t)}</text>')
        t += tstep
    v = math.ceil(y_min/vstep)*vstep
    while v <= y_max + 1e-9:
        if abs(v) > 1e-9:
            svg.append(f'<text x="{ox+5:.1f}" y="{sy(v)+4:.1f}" font-family="Georgia, serif" font-style="italic" font-size="11" fill="{TEXT}">{fmt(v)}</text>')
        v += vstep

    path = "M " + " L ".join(f"{sx(t):.1f},{sy(v):.1f}" for t,v in pts)
    svg.append(f'<path d="{path}" fill="none" stroke="{CURVE}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>')
    for t,v_ in pts:
        svg.append(f'<circle cx="{sx(t):.1f}" cy="{sy(v_):.1f}" r="3.5" fill="{CURVE}" stroke="{DOT}" stroke-width="1.2"/>')
    if label1:
        lt,lv = pts[-1]
        svg.append(f'<text x="{sx(lt)+8:.1f}" y="{sy(lv)+4:.1f}" font-family="Georgia, serif" font-style="italic" font-weight="bold" font-size="13" fill="{CURVE}">{label1}</text>')

    if pts2:
        CURVE2 = "#7dd3fc"
        path2 = "M " + " L ".join(f"{sx(t):.1f},{sy(v):.1f}" for t,v in pts2)
        svg.append(f'<path d="{path2}" fill="none" stroke="{CURVE2}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>')
        for t,v_ in pts2:
            svg.append(f'<circle cx="{sx(t):.1f}" cy="{sy(v_):.1f}" r="3.5" fill="{CURVE2}" stroke="{DOT}" stroke-width="1.2"/>')
        if label2:
            lt,lv = pts2[-1]
            svg.append(f'<text x="{sx(lt)+8:.1f}" y="{sy(lv)+4:.1f}" font-family="Georgia, serif" font-style="italic" font-weight="bold" font-size="13" fill="{CURVE2}">{label2}</text>')

    svg.append('</svg>')
    return '\n'.join(svg)
