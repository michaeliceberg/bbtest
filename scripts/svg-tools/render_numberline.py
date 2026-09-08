# render_numberline.py
#
# Диаграмма "координатная прямая" (число/несколько чисел, отмеченных
# точками, с делениями/подписями) — под задания ОГЭ №7 ("оцените число",
# "какое утверждение верно", "сопоставьте число и точку").
#
# Единый стиль проекта: тёмный фон, белая ось/деления/цифры, голубой
# акцент (#7dd3fc) для отмеченных точек и их подписей-букв (та же роль,
# что в оригиналах sdamgia играет оранжевый).

BG = "#151F23"
AXIS = "#F2F7FB"
ACCENT = "#7dd3fc"
TEXT = "#F2F7FB"

def _line(x1, y1, x2, y2, color=AXIS, width=2.2, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"{d}/>'

def _text(x, y, s, size=15, italic=False, color=TEXT, anchor="middle"):
    style = ' font-style="italic"' if italic else ""
    return f'<text x="{x:.2f}" y="{y:.2f}" font-family="Georgia, serif"{style} font-size="{size}" fill="{color}" text-anchor="{anchor}">{s}</text>'

def _frac_label(cx, y_num, num, den, size=13):
    """Stacked numerator/denominator fraction label centered at cx, numerator
    baseline at y_num (denominator sits below a short divider line)."""
    bar_y = y_num + 4
    bar_half = max(7, 4 + 3 * max(len(str(num)), len(str(den))))
    parts = [
        _text(cx, y_num, num, size=size),
        f'<line x1="{cx-bar_half:.2f}" y1="{bar_y:.2f}" x2="{cx+bar_half:.2f}" y2="{bar_y:.2f}" stroke="{TEXT}" stroke-width="1.3" stroke-linecap="round"/>',
        _text(cx, bar_y + size + 1, den, size=size),
    ]
    return "\n".join(parts)

def render_numberline(
    width, height,
    x_left, x_right, y,
    ticks=(),          # list of x-pixel positions for short tick marks
    tick_labels=(),    # list of (x_pixel, label, {"frac": (num,den)} optional)
    points=(),         # list of (x_pixel, letter_or_None, color)
    tick_h=6,
    label_dy=22,
    arrow_label="x",
):
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">',
        f'<rect x="0" y="0" width="{width}" height="{height}" fill="{BG}"/>',
    ]

    arrow_x = x_right + 18
    parts.append(_line(x_left, y, arrow_x, y))
    # arrowhead
    parts.append(
        f'<path d="M {arrow_x-10:.2f} {y-5:.2f} L {arrow_x:.2f} {y:.2f} L {arrow_x-10:.2f} {y+5:.2f}" '
        f'fill="none" stroke="{AXIS}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
    )
    parts.append(_text(arrow_x + 14, y + 5, arrow_label, size=15, italic=True, anchor="middle"))

    for tx in ticks:
        parts.append(_line(tx, y - tick_h, tx, y + tick_h, width=1.8))

    for entry in tick_labels:
        tx, label = entry[0], entry[1]
        opts = entry[2] if len(entry) > 2 else {}
        if "frac" in opts:
            num, den = opts["frac"]
            parts.append(_frac_label(tx, y + label_dy, num, den))
        else:
            parts.append(_text(tx, y + label_dy, label, size=15))

    for px, letter, color in points:
        parts.append(f'<circle cx="{px:.2f}" cy="{y:.2f}" r="3.6" fill="{color}"/>')
        if letter:
            parts.append(_text(px, y - 12, letter, size=17, italic=True, color=color))

    parts.append("</svg>")
    return "\n".join(parts)
