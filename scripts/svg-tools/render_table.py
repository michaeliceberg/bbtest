BG = "#151F23"
LINE = "#3A464E"
AXIS = "#9AA7B0"
TEXT = "#F2F7FB"
HEAD = "#f0a868"

F_vals = ['0', '0,5', '1', '1,5', '2', '2,5']
x_vals = ['0', '0,02', '0,04', '0,06', '0,08', '0,10']

col_w = 46
label_w = 74
row_h = 42
n = len(F_vals)
W = label_w + col_w * n
H = row_h * 2 + 20
PAD_TOP = 10

svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">']
svg.append(f'<rect x="0" y="0" width="{W}" height="{H}" fill="{BG}"/>')

# внешняя рамка
svg.append(f'<rect x="4" y="{PAD_TOP}" width="{W-8}" height="{H-PAD_TOP-8}" rx="8" fill="none" stroke="{AXIS}" stroke-width="1.5"/>')

# горизонтальная линия между строками
svg.append(f'<line x1="4" y1="{PAD_TOP+row_h}" x2="{W-4}" y2="{PAD_TOP+row_h}" stroke="{LINE}" stroke-width="1.5"/>')
# вертикальная линия после подписи строки
svg.append(f'<line x1="{label_w}" y1="{PAD_TOP}" x2="{label_w}" y2="{H-8}" stroke="{LINE}" stroke-width="1.5"/>')
# вертикальные линии между столбцами данных
for i in range(1, n):
    x = label_w + col_w * i
    svg.append(f'<line x1="{x}" y1="{PAD_TOP}" x2="{x}" y2="{H-8}" stroke="{LINE}" stroke-width="1"/>')

# подписи строк (курсив, акцентный цвет)
svg.append(f'<text x="16" y="{PAD_TOP+row_h/2+6:.1f}" font-family="Georgia, serif" font-style="italic" font-size="17" fill="{HEAD}">F, Н</text>')
svg.append(f'<text x="16" y="{PAD_TOP+row_h*1.5+6:.1f}" font-family="Georgia, serif" font-style="italic" font-size="17" fill="{HEAD}">x, м</text>')

# значения
for i, v in enumerate(F_vals):
    cx = label_w + col_w * i + col_w / 2
    svg.append(f'<text x="{cx:.1f}" y="{PAD_TOP+row_h/2+6:.1f}" text-anchor="middle" font-family="Georgia, serif" font-size="15" fill="{TEXT}">{v}</text>')
for i, v in enumerate(x_vals):
    cx = label_w + col_w * i + col_w / 2
    svg.append(f'<text x="{cx:.1f}" y="{PAD_TOP+row_h*1.5+6:.1f}" text-anchor="middle" font-family="Georgia, serif" font-size="15" fill="{TEXT}">{v}</text>')

svg.append('</svg>')

open('/tmp/phys217_work/originals/51009_table.svg', 'w', encoding='utf-8').write('\n'.join(svg))
print('OK', W, H)
