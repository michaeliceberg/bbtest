import math

BG = "#151F23"
AXIS = "#9AA7B0"
HATCH = "#5A6A72"
BLOCK_FILL = "#f0a86840"
BLOCK_STROKE = "#f0a868"
TEXT = "#F2F7FB"
ARROW = "#f0a868"

def render(force_dir):
    # force_dir: 'right' (растяжение, F от стены) или 'left' (сжатие, F к стене)
    W, H = 260, 140
    wall_x = 30
    ground_y = 100
    wall_top = 20

    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">']
    svg.append(f'<rect x="0" y="0" width="{W}" height="{H}" fill="{BG}"/>')

    # стена (вертикальная, слева, со штриховкой)
    svg.append(f'<line x1="{wall_x}" y1="{wall_top}" x2="{wall_x}" y2="{ground_y}" stroke="{AXIS}" stroke-width="2"/>')
    n = int((ground_y - wall_top) / 8)
    for i in range(n + 1):
        y0 = wall_top + i * 8
        y1 = min(y0 + 8, ground_y)
        svg.append(f'<line x1="{wall_x-8:.1f}" y1="{y0+8:.1f}" x2="{wall_x:.1f}" y2="{y0:.1f}" stroke="{HATCH}" stroke-width="1"/>')

    # земля (горизонтальная, со штриховкой)
    svg.append(f'<line x1="{wall_x}" y1="{ground_y}" x2="{W-20}" y2="{ground_y}" stroke="{AXIS}" stroke-width="2"/>')
    n2 = int((W - 20 - wall_x) / 8)
    for i in range(n2 + 1):
        x0 = wall_x + i * 8
        x1 = min(x0 + 8, W - 20)
        svg.append(f'<line x1="{x0:.1f}" y1="{ground_y+8:.1f}" x2="{x1:.1f}" y2="{ground_y:.1f}" stroke="{HATCH}" stroke-width="1"/>')

    # пружина (зигзаг-катушка) между стеной и бруском
    spring_y = ground_y - 22
    spring_x0 = wall_x
    block_x = 100
    n_coils = 7
    coil_w = (block_x - spring_x0) / n_coils
    pts = [(spring_x0, spring_y)]
    for i in range(n_coils):
        cx = spring_x0 + coil_w * (i + 0.5)
        cy = spring_y - 9 if i % 2 == 0 else spring_y + 9
        pts.append((cx, cy))
    pts.append((block_x, spring_y))
    path = "M " + " L ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    svg.append(f'<path d="{path}" fill="none" stroke="{AXIS}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>')
    svg.append(f'<text x="{(spring_x0+block_x)/2-6:.1f}" y="{spring_y-18:.1f}" font-family="Georgia, serif" font-style="italic" font-size="17" fill="{TEXT}">k</text>')

    # брусок (m)
    block_w, block_h = 46, 34
    block_y = ground_y - block_h
    svg.append(f'<rect x="{block_x:.1f}" y="{block_y:.1f}" width="{block_w}" height="{block_h}" rx="3" fill="{BLOCK_FILL}" stroke="{BLOCK_STROKE}" stroke-width="2"/>')
    svg.append(f'<text x="{block_x+block_w/2-6:.1f}" y="{block_y-8:.1f}" font-family="Georgia, serif" font-style="italic" font-size="17" fill="{TEXT}">m</text>')

    # сила F
    fy = block_y + block_h / 2
    arrow_len = 46
    if force_dir == 'right':
        x0, x1 = block_x + block_w + 6, block_x + block_w + 6 + arrow_len
        svg.append(f'<line x1="{x0:.1f}" y1="{fy:.1f}" x2="{x1:.1f}" y2="{fy:.1f}" stroke="{ARROW}" stroke-width="2.4"/>')
        svg.append(f'<polygon points="{x1-8:.1f},{fy-5:.1f} {x1-8:.1f},{fy+5:.1f} {x1+2:.1f},{fy:.1f}" fill="{ARROW}"/>')
        svg.append(f'<text x="{x1+6:.1f}" y="{fy-8:.1f}" font-family="Georgia, serif" font-style="italic" font-size="17" fill="{TEXT}">F</text>')
    else:
        x1, x0 = block_x + block_w + 6, block_x + block_w + 6 + arrow_len
        svg.append(f'<line x1="{x0:.1f}" y1="{fy:.1f}" x2="{x1:.1f}" y2="{fy:.1f}" stroke="{ARROW}" stroke-width="2.4"/>')
        svg.append(f'<polygon points="{x1+8:.1f},{fy-5:.1f} {x1+8:.1f},{fy+5:.1f} {x1-2:.1f},{fy:.1f}" fill="{ARROW}"/>')
        svg.append(f'<text x="{x0-4:.1f}" y="{fy-8:.1f}" font-family="Georgia, serif" font-style="italic" font-size="17" fill="{TEXT}">F</text>')

    svg.append('</svg>')
    return '\n'.join(svg)


if __name__ == '__main__':
    open('/tmp/phys217_work/originals/106567_new.svg', 'w', encoding='utf-8').write(render('right'))
    open('/tmp/phys217_work/originals/106592_new.svg', 'w', encoding='utf-8').write(render('left'))
    print('OK')
