// components/geometry/FluxCylinder.tsx
//
// «Цилиндр потока» (идея пользователя, 2026-09-28): поток Φ рисуем как
// объём цилиндра — основание = площадь кольца S, высота = длина стрелки
// поля B. Φ = B·S, как объём цилиндра V = S·h. Используется в FARADAYWALK
// (знакомство с потоком, сравнение цилиндров, финальная игра) и LENZWALK
// (упругий цилиндр: растянули/сжали → B_инд возвращает обратно).
//
// orient 'v' — вертикальный (кольцо лежит горизонтально, стрелка сверху
// вниз), 'h' — горизонтальный (видим правый торец). radius — половина
// размера основания поперёк оси, depth — «перспектива» (вторая полуось
// эллипса), length — длина вдоль оси. (cx, cy) — центр цилиндра.

'use client'

import { hexToRgba } from '@/src/constants/lessonButtonColors'

type Props = {
    cx: number
    cy: number
    radius: number
    depth: number
    length: number
    orient?: 'v' | 'h'
    color: string
    fill?: number
    strokeWidth?: number
    dashed?: boolean
}

export function FluxCylinder({ cx, cy, radius: r, depth: d, length: L, orient = 'v', color, fill = 0.2, strokeWidth = 2.5, dashed = false }: Props) {
    const dash = dashed ? '6 5' : undefined
    const bodyFill = hexToRgba(color, fill)
    const capFill = hexToRgba(color, fill + 0.12)
    if (orient === 'v') {
        const yt = cy - L / 2, yb = cy + L / 2
        const body = `M ${cx - r} ${yt} L ${cx - r} ${yb} A ${r} ${d} 0 0 0 ${cx + r} ${yb} L ${cx + r} ${yt} A ${r} ${d} 0 0 1 ${cx - r} ${yt} Z`
        return (
            <g>
                <path d={`M ${cx - r} ${yb} A ${r} ${d} 0 0 1 ${cx + r} ${yb}`} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray="4 5" opacity={0.6} />
                <path d={body} fill={bodyFill} stroke="none" />
                <line x1={cx - r} y1={yt} x2={cx - r} y2={yb} stroke={color} strokeWidth={strokeWidth} strokeDasharray={dash} />
                <line x1={cx + r} y1={yt} x2={cx + r} y2={yb} stroke={color} strokeWidth={strokeWidth} strokeDasharray={dash} />
                <path d={`M ${cx - r} ${yb} A ${r} ${d} 0 0 0 ${cx + r} ${yb}`} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={dash} />
                <ellipse cx={cx} cy={yt} rx={r} ry={d} fill={capFill} stroke={color} strokeWidth={strokeWidth} strokeDasharray={dash} />
            </g>
        )
    }
    const xl = cx - L / 2, xr = cx + L / 2
    const body = `M ${xl} ${cy - r} L ${xr} ${cy - r} A ${d} ${r} 0 0 0 ${xr} ${cy + r} L ${xl} ${cy + r} A ${d} ${r} 0 0 1 ${xl} ${cy - r} Z`
    return (
        <g>
            <path d={`M ${xl} ${cy - r} A ${d} ${r} 0 0 1 ${xl} ${cy + r}`} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray="4 5" opacity={0.6} />
            <path d={body} fill={bodyFill} stroke="none" />
            <line x1={xl} y1={cy - r} x2={xr} y2={cy - r} stroke={color} strokeWidth={strokeWidth} strokeDasharray={dash} />
            <line x1={xl} y1={cy + r} x2={xr} y2={cy + r} stroke={color} strokeWidth={strokeWidth} strokeDasharray={dash} />
            <path d={`M ${xl} ${cy - r} A ${d} ${r} 0 0 0 ${xl} ${cy + r}`} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={dash} />
            <ellipse cx={xr} cy={cy} rx={d} ry={r} fill={capFill} stroke={color} strokeWidth={strokeWidth} strokeDasharray={dash} />
        </g>
    )
}

// Толстая стрелка поля B (вертикальная или горизонтальная), от (x1,y1) к (x2,y2).
export function FieldArrow({ x1, y1, x2, y2, color, width = 6, head = 11 }: { x1: number; y1: number; x2: number; y2: number; color: string; width?: number; head?: number }) {
    const len = Math.hypot(x2 - x1, y2 - y1) || 1
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len
    const bx = x2 - ux * head * 1.2, by = y2 - uy * head * 1.2
    const px = -uy * head, py = ux * head
    return (
        <g>
            <line x1={x1} y1={y1} x2={bx + ux * 2} y2={by + uy * 2} stroke={color} strokeWidth={width} strokeLinecap="round" />
            <path d={`M ${bx + px} ${by + py} L ${x2} ${y2} L ${bx - px} ${by - py} Z`} fill={color} stroke={color} strokeWidth={2} strokeLinejoin="round" />
        </g>
    )
}

// Маленький стикер-подпись внутри SVG (B, S, Φ, B инд).
export function SvgTag({ x, y, text, sub, color }: { x: number; y: number; text: string; sub?: string; color: string }) {
    const w = sub ? 50 : 28
    return (
        <g transform={`translate(${x},${y})`}>
            <rect x={-w / 2} y={-13} width={w} height={26} rx={7} fill="#161F23" stroke={color} strokeWidth={2.5} />
            <text x={0} y={6} textAnchor="middle" fontSize={16} fontWeight={900} fill={color}>
                {text}{sub && <tspan fontSize={10} dy={4}>{sub}</tspan>}
            </text>
        </g>
    )
}
