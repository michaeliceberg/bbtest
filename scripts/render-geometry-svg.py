#!/usr/bin/env python3
# scripts/render-geometry-svg.py
#
# Шаблон для отрисовки геометрических фигур (задачи с картинкой из
# sdamgia.ru) в едином стиле приложения: тёмный фон, клетчатая сетка,
# полупрозрачная заливка фигуры, жирные точки-вершины ровно в узлах
# сетки, подписи буквами.
#
# Вершины задаются ЦЕЛЫМИ координатами в клетках (не пикселях исходной
# картинки с sdamgia — те произвольные и не подходят). Форму/пропорции
# беру за основу из исходника, но подбираю близкие целые координаты
# вручную по картинке, чтобы вершины точно попадали в узлы сетки —
# как в примере пользователя.
#
# spec = {
#   "shapes": [
#       {"points": [{"x":0,"y":3,"label":"A"}, ...], "closed": true, "fill": true},
#       {"points": [{"x":..,"y":..}, {"x":..,"y":..}], "closed": false, "dashed": true}  # диагональ/биссектриса без подписи точек
#   ],
#   "points": [{"x":..,"y":..,"label":"E"}]  # отдельные подписанные точки (например середина стороны), не входящие в shapes
# }

import json
import sys
import math

BG_COLOR = "#151F23"
GRID_COLOR = "#3A464E"
LINE_COLOR = "#7dd3fc"
HELPER_LINE_COLOR = "#38bdf8"
POINT_FILL = "#7dd3fc"
POINT_RING = "#0369a1"
FILL_COLOR = "#7dd3fc"
FILL_OPACITY = 0.18
INNER_FILL_OPACITY = 0.30
LABEL_COLOR = "#7dd3fc"

CELL = 52
MARGIN_CELLS = 1


def render(shapes, extra_points=None, cell=CELL, margin_cells=MARGIN_CELLS):
    extra_points = extra_points or []

    all_xy = [(p["x"], p["y"]) for shape in shapes for p in shape["points"]]
    all_xy += [(p["x"], p["y"]) for p in extra_points]
    xs = [p[0] for p in all_xy]
    ys = [p[1] for p in all_xy]

    grid_x0 = min(xs) - margin_cells
    grid_x1 = max(xs) + margin_cells
    grid_y0 = min(ys) - margin_cells
    grid_y1 = max(ys) + margin_cells

    cols = grid_x1 - grid_x0
    rows = grid_y1 - grid_y0
    width = cols * cell
    height = rows * cell

    def sx(x):
        return (x - grid_x0) * cell

    def sy(y):
        return (y - grid_y0) * cell

    # центр масс всех подписанных точек — чтобы разносить подписи наружу
    labeled = [p for shape in shapes for p in shape["points"]] + extra_points
    cx = sum(sx(p["x"]) for p in labeled) / len(labeled)
    cy = sum(sy(p["y"]) for p in labeled) / len(labeled)

    svg = []
    svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">')
    svg.append(f'<rect x="0" y="0" width="{width}" height="{height}" fill="{BG_COLOR}"/>')

    for i in range(cols + 1):
        x = i * cell
        svg.append(f'<line x1="{x}" y1="0" x2="{x}" y2="{height}" stroke="{GRID_COLOR}" stroke-width="1"/>')
    for j in range(rows + 1):
        y = j * cell
        svg.append(f'<line x1="0" y1="{y}" x2="{width}" y2="{y}" stroke="{GRID_COLOR}" stroke-width="1"/>')

    # Фигуры (сначала все линии/заливки, точки и подписи — поверх)
    for shape in shapes:
        pts = [(sx(p["x"]), sy(p["y"])) for p in shape["points"]]
        poly_points = " ".join(f"{p[0]:.1f},{p[1]:.1f}" for p in pts)
        dash = ' stroke-dasharray="6,5"' if shape.get("dashed") else ""
        color = shape.get("color", LINE_COLOR if shape.get("fill", True) else HELPER_LINE_COLOR)
        if shape.get("closed", True):
            fill_op = shape.get("fill_opacity", FILL_OPACITY if shape.get("fill", True) else 0)
            svg.append(f'<polygon points="{poly_points}" fill="{FILL_COLOR}" fill-opacity="{fill_op}" stroke="{color}" stroke-width="2.5" stroke-linejoin="round"{dash}/>')
        else:
            svg.append(f'<polyline points="{poly_points}" fill="none" stroke="{color}" stroke-width="2" stroke-linejoin="round"{dash}/>')

    def draw_point(px, py, label):
        dx, dy = px - cx, py - cy
        dist = math.hypot(dx, dy) or 1
        lx = px + dx / dist * 24
        ly = py + dy / dist * 24
        svg.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="9" fill="{POINT_FILL}" stroke="{POINT_RING}" stroke-width="2.5"/>')
        if label:
            svg.append(
                f'<text x="{lx:.1f}" y="{ly:.1f}" font-family="Arial, sans-serif" font-style="italic" '
                f'font-weight="bold" font-size="20" fill="{LABEL_COLOR}" text-anchor="middle" '
                f'dominant-baseline="middle">{label}</text>'
            )

    seen = set()
    for shape in shapes:
        for p in shape["points"]:
            key = (p["x"], p["y"])
            if key in seen:
                continue
            seen.add(key)
            draw_point(sx(p["x"]), sy(p["y"]), p.get("label", ""))
    for p in extra_points:
        draw_point(sx(p["x"]), sy(p["y"]), p.get("label", ""))

    svg.append('</svg>')
    return "\n".join(svg)


if __name__ == "__main__":
    spec = json.load(sys.stdin)
    print(render(spec["shapes"], spec.get("points")))
