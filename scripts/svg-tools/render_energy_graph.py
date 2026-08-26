import sys
sys.path.insert(0, '/tmp/phys204_work')
import math

BG = "#151F23"
GRID = "#3A464E"
AXIS = "#9AA7B0"
CURVE = "#f0a868"
TEXT = "#F2F7FB"
DOT = "#0369a1"
CELL = 40

def render_parabola(t0, t_vertex, t1, e_max, ylabel, n=60):
    # E(t) = e_max * ((t - t_vertex)/(t_vertex - t0))^2   -- ветви вверх (t0,0)->(t_vertex,0)... on
    # используем явную формулу параболы с вершиной (t_vertex, e_vertex) и известным значением на краях
    pts = []
    for i in range(n + 1):
        t = t0 + (t1 - t0) * i / n
        pts.append(t)

    x_min, x_max = 0, t1 * 1.15
    y_min, y_max = 0, e_max * 1.2

    def nice_step(span, target=8):
        if span <= 0: return 1
        raw = span / target
        mag = 10 ** math.floor(math.log10(raw)) if raw > 0 else 1
        for m in (1, 2, 2.5, 5, 10):
            if mag * m >= raw:
                return mag * m
        return mag * 10

    tstep = 1
    vstep = nice_step(y_max - y_min)

    MARGIN_L = 44
    TOP_PAD = 24
    BOTTOM_PAD = 26
    RIGHT_PAD = 20
    w = (x_max - x_min) / tstep * CELL + MARGIN_L + RIGHT_PAD
    h = (y_max - y_min) / vstep * CELL + TOP_PAD + BOTTOM_PAD

    def sx(t): return (t - x_min) / tstep * CELL + MARGIN_L
    def sy(v): return TOP_PAD + (y_max - v) / vstep * CELL

    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:.0f}" height="{h:.0f}" viewBox="0 0 {w:.0f} {h:.0f}">']
    svg.append(f'<rect x="0" y="0" width="{w:.0f}" height="{h:.0f}" fill="{BG}"/>')

    t = 0
    while t <= x_max + 1e-9:
        svg.append(f'<line x1="{sx(t):.1f}" y1="0" x2="{sx(t):.1f}" y2="{h:.0f}" stroke="{GRID}" stroke-width="1"/>')
        t += tstep
    v = 0
    while v <= y_max + 1e-9:
        svg.append(f'<line x1="{sx(0):.1f}" y1="{sy(v):.1f}" x2="{w:.0f}" y2="{sy(v):.1f}" stroke="{GRID}" stroke-width="1"/>')
        v += vstep

    ox, oy = sx(0), sy(0)
    svg.append(f'<line x1="{ox:.1f}" y1="{h:.0f}" x2="{ox:.1f}" y2="0" stroke="{AXIS}" stroke-width="2"/>')
    svg.append(f'<polygon points="{ox-5:.1f},10 {ox+5:.1f},10 {ox:.1f},0" fill="{AXIS}"/>')
    svg.append(f'<line x1="{ox:.1f}" y1="{oy:.1f}" x2="{w:.0f}" y2="{oy:.1f}" stroke="{AXIS}" stroke-width="2"/>')
    svg.append(f'<polygon points="{w-10:.1f},{oy-5:.1f} {w-10:.1f},{oy+5:.1f} {w:.0f},{oy:.1f}" fill="{AXIS}"/>')

    svg.append(f'<text x="{ox-14:.1f}" y="{oy+18:.1f}" font-family="Georgia, serif" font-style="italic" font-size="15" fill="{TEXT}">0</text>')
    svg.append(f'<text x="{w-18:.1f}" y="{oy-8:.1f}" font-family="Georgia, serif" font-style="italic" font-size="15" fill="{TEXT}">t, с</text>')
    svg.append(f'<text x="{ox+8:.1f}" y="16" font-family="Georgia, serif" font-style="italic" font-size="15" fill="{TEXT}">{ylabel}</text>')

    def fmt(n):
        if abs(n - round(n)) < 1e-6:
            return str(int(round(n)))
        return f"{n:g}".replace('.', ',')

    t = tstep
    while t <= x_max + 1e-9:
        svg.append(f'<text x="{sx(t)-4:.1f}" y="{oy+16:.1f}" font-family="Georgia, serif" font-style="italic" font-size="12" fill="{TEXT}">{fmt(t)}</text>')
        t += tstep
    v = vstep
    while v <= y_max + 1e-9:
        svg.append(f'<text x="6" y="{sy(v)+4:.1f}" font-family="Georgia, serif" font-style="italic" font-size="12" fill="{TEXT}">{fmt(v)}</text>')
        v += vstep

    def E(t):
        return e_max * ((t - t_vertex) / (t_vertex - t0)) ** 2

    path_pts = [(t, E(t)) for t in pts]
    path = "M " + " L ".join(f"{sx(t):.1f},{sy(v):.1f}" for t, v in path_pts)
    svg.append(f'<path d="{path}" fill="none" stroke="{CURVE}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>')
    for t in (t0, t_vertex, t1):
        svg.append(f'<circle cx="{sx(t):.1f}" cy="{sy(E(t)):.1f}" r="3.5" fill="{CURVE}" stroke="{DOT}" stroke-width="1.2"/>')

    svg.append('</svg>')
    return '\n'.join(svg)


def render_inverted_parabola(t0, t_vertex, t1, e_max, ylabel, n=60):
    pts = []
    for i in range(n + 1):
        t = t0 + (t1 - t0) * i / n
        pts.append(t)

    x_min, x_max = 0, t1 * 1.15
    y_min, y_max = 0, e_max * 1.2

    def nice_step(span, target=8):
        if span <= 0: return 1
        raw = span / target
        mag = 10 ** math.floor(math.log10(raw)) if raw > 0 else 1
        for m in (1, 2, 2.5, 5, 10):
            if mag * m >= raw:
                return mag * m
        return mag * 10

    tstep = 1
    vstep = nice_step(y_max - y_min)

    MARGIN_L = 44
    TOP_PAD = 24
    BOTTOM_PAD = 26
    RIGHT_PAD = 20
    w = (x_max - x_min) / tstep * CELL + MARGIN_L + RIGHT_PAD
    h = (y_max - y_min) / vstep * CELL + TOP_PAD + BOTTOM_PAD

    def sx(t): return (t - x_min) / tstep * CELL + MARGIN_L
    def sy(v): return TOP_PAD + (y_max - v) / vstep * CELL

    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:.0f}" height="{h:.0f}" viewBox="0 0 {w:.0f} {h:.0f}">']
    svg.append(f'<rect x="0" y="0" width="{w:.0f}" height="{h:.0f}" fill="{BG}"/>')

    t = 0
    while t <= x_max + 1e-9:
        svg.append(f'<line x1="{sx(t):.1f}" y1="0" x2="{sx(t):.1f}" y2="{h:.0f}" stroke="{GRID}" stroke-width="1"/>')
        t += tstep
    v = 0
    while v <= y_max + 1e-9:
        svg.append(f'<line x1="{sx(0):.1f}" y1="{sy(v):.1f}" x2="{w:.0f}" y2="{sy(v):.1f}" stroke="{GRID}" stroke-width="1"/>')
        v += vstep

    ox, oy = sx(0), sy(0)
    svg.append(f'<line x1="{ox:.1f}" y1="{h:.0f}" x2="{ox:.1f}" y2="0" stroke="{AXIS}" stroke-width="2"/>')
    svg.append(f'<polygon points="{ox-5:.1f},10 {ox+5:.1f},10 {ox:.1f},0" fill="{AXIS}"/>')
    svg.append(f'<line x1="{ox:.1f}" y1="{oy:.1f}" x2="{w:.0f}" y2="{oy:.1f}" stroke="{AXIS}" stroke-width="2"/>')
    svg.append(f'<polygon points="{w-10:.1f},{oy-5:.1f} {w-10:.1f},{oy+5:.1f} {w:.0f},{oy:.1f}" fill="{AXIS}"/>')

    svg.append(f'<text x="{ox-14:.1f}" y="{oy+18:.1f}" font-family="Georgia, serif" font-style="italic" font-size="15" fill="{TEXT}">0</text>')
    svg.append(f'<text x="{w-18:.1f}" y="{oy-8:.1f}" font-family="Georgia, serif" font-style="italic" font-size="15" fill="{TEXT}">t, с</text>')
    svg.append(f'<text x="{ox+8:.1f}" y="16" font-family="Georgia, serif" font-style="italic" font-size="15" fill="{TEXT}">{ylabel}</text>')

    def fmt(n):
        if abs(n - round(n)) < 1e-6:
            return str(int(round(n)))
        return f"{n:g}".replace('.', ',')

    t = tstep
    while t <= x_max + 1e-9:
        svg.append(f'<text x="{sx(t)-4:.1f}" y="{oy+16:.1f}" font-family="Georgia, serif" font-style="italic" font-size="12" fill="{TEXT}">{fmt(t)}</text>')
        t += tstep
    v = vstep
    while v <= y_max + 1e-9:
        svg.append(f'<text x="6" y="{sy(v)+4:.1f}" font-family="Georgia, serif" font-style="italic" font-size="12" fill="{TEXT}">{fmt(v)}</text>')
        v += vstep

    def E(t):
        return e_max - e_max * ((t - t_vertex) / t_vertex) ** 2

    path_pts = [(t, E(t)) for t in pts]
    path = "M " + " L ".join(f"{sx(t):.1f},{sy(v):.1f}" for t, v in path_pts)
    svg.append(f'<path d="{path}" fill="none" stroke="{CURVE}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>')
    for t in (t0, t_vertex, t1):
        svg.append(f'<circle cx="{sx(t):.1f}" cy="{sy(E(t)):.1f}" r="3.5" fill="{CURVE}" stroke="{DOT}" stroke-width="1.2"/>')

    svg.append('</svg>')
    return '\n'.join(svg)


if __name__ == '__main__':
    svg1 = render_parabola(0, 2, 4, 40, 'E_к, Дж')
    open('/tmp/phys217_work/originals/3582_new.svg', 'w', encoding='utf-8').write(svg1)

    svg2 = render_inverted_parabola(0, 2, 4, 40, 'E_п, Дж')
    open('/tmp/phys217_work/originals/3598_new.svg', 'w', encoding='utf-8').write(svg2)
    print('OK')
