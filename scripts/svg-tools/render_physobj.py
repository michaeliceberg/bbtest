import math

BG = "#151F23"
ACCENT = "#7dd3fc"
RING = "#0369a1"
FORCE = "#f0a868"
SPRING_C = "#4ade80"
TEXT = "#F2F7FB"
SURFACE = "#5b6b76"

def new_svg(w, h):
    return [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">',
            f'<rect x="0" y="0" width="{w}" height="{h}" fill="{BG}"/>']

def finish(svg):
    svg.append('</svg>')
    return '\n'.join(svg)

def hatch_line(x1, y1, x2, y2, n=10, length=10, side=1):
    # surface with hatching (ground/wall) — косая штриховка (45° между
    # линией поверхности и нормалью к ней), стандартное обозначение
    # неподвижной опоры в физике, а не "гребёнка" строго поперёк линии
    # (та читалась как деления шкалы, а не как штриховка).
    out = [f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{SURFACE}" stroke-width="2.5"/>']
    dx, dy = x2-x1, y2-y1
    dl = math.hypot(dx,dy)
    ux,uy = dx/dl, dy/dl
    nx,ny = -uy*side, ux*side
    hx, hy = (ux+nx)/math.sqrt(2), (uy+ny)/math.sqrt(2)
    for i in range(n+1):
        px = x1 + dx*i/n
        py = y1 + dy*i/n
        out.append(f'<line x1="{px:.1f}" y1="{py:.1f}" x2="{px+hx*length:.1f}" y2="{py+hy*length:.1f}" stroke="{SURFACE}" stroke-width="1.3"/>')
    return out

def block(cx, cy, w, h, label=None, fill=ACCENT):
    out = [f'<rect x="{cx-w/2:.1f}" y="{cy-h/2:.1f}" width="{w}" height="{h}" fill="{fill}" fill-opacity="0.25" stroke="{fill}" stroke-width="2.2" rx="3"/>']
    if label:
        out.append(f'<text x="{cx:.1f}" y="{cy+5:.1f}" font-family="Arial, sans-serif" font-weight="bold" font-size="15" fill="{TEXT}" text-anchor="middle">{label}</text>')
    return out

def spring(x1, y1, x2, y2, coils=6, amp=10, color=SPRING_C):
    dx, dy = x2-x1, y2-y1
    length = math.hypot(dx, dy)
    ux, uy = dx/length, dy/length
    nx, ny = -uy, ux
    pts = [(x1, y1)]
    seg = length / (coils*2)
    for i in range(1, coils*2):
        t = i / (coils*2)
        side = amp if i % 2 == 1 else -amp
        px = x1 + dx*t + nx*side
        py = y1 + dy*t + ny*side
        pts.append((px, py))
    pts.append((x2, y2))
    path = "M " + " L ".join(f"{px:.1f},{py:.1f}" for px, py in pts)
    return [f'<path d="{path}" fill="none" stroke="{color}" stroke-width="2.2" stroke-linejoin="round"/>']

def rope(x1, y1, x2, y2, color=TEXT):
    return [f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{color}" stroke-width="1.8"/>']

def arrow(x1, y1, x2, y2, color=FORCE, label=None, width=2.6, size=10):
    out = [f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{color}" stroke-width="{width}" stroke-linecap="round"/>']
    ang = math.atan2(y2-y1, x2-x1)
    a1 = ang + math.radians(150)
    a2 = ang - math.radians(150)
    p1 = (x2+size*math.cos(a1), y2+size*math.sin(a1))
    p2 = (x2+size*math.cos(a2), y2+size*math.sin(a2))
    out.append(f'<polygon points="{x2:.1f},{y2:.1f} {p1[0]:.1f},{p1[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}" fill="{color}"/>')
    if label:
        lx, ly = x2 + (x2-x1)*0.15, y2 + (y2-y1)*0.15 - 6
        out.append(f'<text x="{lx:.1f}" y="{ly:.1f}" font-family="Georgia, serif" font-style="italic" font-weight="bold" font-size="14" fill="{color}">{label}</text>')
    return out

def circle_pt(cx, cy, r=6, color=ACCENT):
    return [f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r}" fill="{color}" stroke="{RING}" stroke-width="1.5"/>']

def text(x, y, s, size=13, color=TEXT, anchor="middle", italic=True, weight="normal"):
    style = 'font-style="italic"' if italic else ''
    return [f'<text x="{x:.1f}" y="{y:.1f}" font-family="Georgia, serif" {style} font-weight="{weight}" font-size="{size}" fill="{color}" text-anchor="{anchor}">{s}</text>']

def dashed_line(x1,y1,x2,y2,color="#5b6b76"):
    return [f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{color}" stroke-width="1.3" stroke-dasharray="5,4"/>']

def vector_grid(vectors, cell=30, pad=50):
    # vectors: list of (dx, dy, label, color) in grid units, all from origin (0,0)
    xs = [0] + [v[0] for v in vectors]
    ys = [0] + [v[1] for v in vectors]
    xmin, xmax = min(xs), max(xs)
    ymin, ymax = min(ys), max(ys)
    xmin -= 1; xmax += 1; ymin -= 1; ymax += 1
    w = (xmax - xmin) * cell + pad
    h = (ymax - ymin) * cell + pad
    def sx(x): return (x - xmin) * cell + pad/2
    def sy(y): return h - ((y - ymin) * cell + pad/2)
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:.0f}" height="{h:.0f}" viewBox="0 0 {w:.0f} {h:.0f}">']
    svg.append(f'<rect x="0" y="0" width="{w:.0f}" height="{h:.0f}" fill="{BG}"/>')
    GRIDC = "#3A464E"
    x = xmin
    while x <= xmax + 1e-9:
        svg.append(f'<line x1="{sx(x):.1f}" y1="0" x2="{sx(x):.1f}" y2="{h:.0f}" stroke="{GRIDC}" stroke-width="1"/>')
        x += 1
    y = ymin
    while y <= ymax + 1e-9:
        svg.append(f'<line x1="0" y1="{sy(y):.1f}" x2="{w:.0f}" y2="{sy(y):.1f}" stroke="{GRIDC}" stroke-width="1"/>')
        y += 1
    ox, oy = sx(0), sy(0)
    svg += circle_pt(ox, oy, r=4, color=TEXT)
    colors = [FORCE, ACCENT, SPRING_C, "#f472b6", "#facc15"]
    for i, (dx, dy, label, color) in enumerate(vectors):
        c = color or colors[i % len(colors)]
        svg += arrow(ox, oy, sx(dx), sy(dy), color=c, label=label, size=9)
    svg.append('</svg>')
    return '\n'.join(svg)
