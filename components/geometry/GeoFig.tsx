// components/geometry/GeoFig.tsx
//
// Лёгкий SVG-«холст» для чертежей в планиметрических разборах (SIMWALK и
// следующие): фигура описывается данными — отрезки, многоугольники, дуги
// углов, метки прямого угла, подписи и точки (в т.ч. кликабельные для
// мини-игр). У каждого элемента есть `show` — при переключении в true он
// «рисуется» (линии — pathLength, подписи — отскок). Анимации только
// transform/opacity/pathLength (iPhone).

'use client'

import { motion } from 'framer-motion'

export type Pt = [number, number]

export type FigItem =
    | { k: 'seg'; a: Pt; b: Pt; color?: string; w?: number; dash?: boolean; show?: boolean; delay?: number; hit?: boolean; onClick?: () => void }
    | { k: 'poly'; pts: Pt[]; color?: string; w?: number; fill?: string; show?: boolean; delay?: number }
    | { k: 'arc'; v: Pt; p1: Pt; p2: Pt; r?: number; color?: string; w?: number; show?: boolean; delay?: number }
    | { k: 'right'; v: Pt; p1: Pt; p2: Pt; size?: number; color?: string; show?: boolean }
    | { k: 'text'; at: Pt; text: string; color?: string; size?: number; show?: boolean; delay?: number; italic?: boolean }
    | { k: 'dot'; at: Pt; r?: number; color?: string; show?: boolean; hit?: number; onClick?: () => void; pulse?: boolean }

const WHITE = '#F2F7FB'

const unit = (from: Pt, to: Pt): Pt => {
    const dx = to[0] - from[0], dy = to[1] - from[1]
    const l = Math.hypot(dx, dy) || 1
    return [dx / l, dy / l]
}

// Дуга угла при вершине v между лучами v→p1 и v→p2 (всегда меньший угол).
export const arcPath = (v: Pt, p1: Pt, p2: Pt, r: number): string => {
    const a1 = Math.atan2(p1[1] - v[1], p1[0] - v[0])
    const a2 = Math.atan2(p2[1] - v[1], p2[0] - v[0])
    let diff = a2 - a1
    while (diff > Math.PI) diff -= 2 * Math.PI
    while (diff < -Math.PI) diff += 2 * Math.PI
    const s: Pt = [v[0] + r * Math.cos(a1), v[1] + r * Math.sin(a1)]
    const e: Pt = [v[0] + r * Math.cos(a2), v[1] + r * Math.sin(a2)]
    return `M ${s[0]} ${s[1]} A ${r} ${r} 0 0 ${diff > 0 ? 1 : 0} ${e[0]} ${e[1]}`
}

const rightPath = (v: Pt, p1: Pt, p2: Pt, size: number): string => {
    const u1 = unit(v, p1), u2 = unit(v, p2)
    const a: Pt = [v[0] + u1[0] * size, v[1] + u1[1] * size]
    const c: Pt = [v[0] + u2[0] * size, v[1] + u2[1] * size]
    const b: Pt = [a[0] + u2[0] * size, a[1] + u2[1] * size]
    return `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} L ${c[0]} ${c[1]}`
}

const Draw = ({ show, delay = 0, d, color, w, fill, dash }: { show: boolean; delay?: number; d: string; color: string; w: number; fill?: string; dash?: boolean }) => (
    <motion.path
        d={d} fill={fill ?? 'none'} stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={dash ? '6 6' : undefined}
        initial={false}
        animate={{ pathLength: show ? 1 : 0, opacity: show ? 1 : 0 }}
        transition={{ duration: 0.7, delay: show ? delay : 0, ease: 'easeOut' }}
    />
)

export const GeoFig = ({ items, vb = [400, 240], maxH = '34vh' }: { items: FigItem[]; vb?: [number, number]; maxH?: string }) => (
    <svg viewBox={`0 0 ${vb[0]} ${vb[1]}`} className="w-full h-auto select-none" style={{ maxHeight: maxH }}>
        {items.map((it, i) => {
            const show = it.show ?? true
            switch (it.k) {
                case 'seg':
                    return (
                        <g key={i}>
                            <Draw show={show} delay={it.delay} d={`M ${it.a[0]} ${it.a[1]} L ${it.b[0]} ${it.b[1]}`} color={it.color ?? WHITE} w={it.w ?? 4} dash={it.dash} />
                            {it.hit && it.onClick && show && (
                                <line x1={it.a[0]} y1={it.a[1]} x2={it.b[0]} y2={it.b[1]} stroke="transparent" strokeWidth={26} strokeLinecap="round" style={{ cursor: 'pointer' }} onClick={it.onClick} />
                            )}
                        </g>
                    )
                case 'poly':
                    return <Draw key={i} show={show} delay={it.delay} d={`M ${it.pts.map((p) => p.join(' ')).join(' L ')} Z`} color={it.color ?? WHITE} w={it.w ?? 4} fill={it.fill} />
                case 'arc':
                    return <Draw key={i} show={show} delay={it.delay} d={arcPath(it.v, it.p1, it.p2, it.r ?? 22)} color={it.color ?? '#F2C35B'} w={it.w ?? 3.5} />
                case 'right':
                    return <Draw key={i} show={show} d={rightPath(it.v, it.p1, it.p2, it.size ?? 14)} color={it.color ?? '#F09B38'} w={3} />
                case 'text':
                    return (
                        <motion.text
                            key={i} x={it.at[0]} y={it.at[1]} textAnchor="middle" dominantBaseline="middle"
                            fontFamily={it.italic ? 'Georgia, serif' : 'var(--font-nunito), sans-serif'} fontStyle={it.italic ? 'italic' : 'normal'}
                            fontSize={it.size ?? 18} fontWeight={800} fill={it.color ?? WHITE}
                            initial={false}
                            animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.3 }}
                            transition={{ type: 'spring', duration: 0.6, bounce: 0.45, delay: show ? it.delay ?? 0 : 0 }}
                            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                        >
                            {it.text}
                        </motion.text>
                    )
                case 'dot':
                    return (
                        <g key={i} style={{ cursor: it.onClick ? 'pointer' : undefined }} onClick={it.onClick}>
                            {it.pulse && show && (
                                <circle cx={it.at[0]} cy={it.at[1]} r={(it.r ?? 5) + 5} fill="none" stroke={it.color ?? WHITE} strokeWidth={2} className="animate-pulse" opacity={0.7} />
                            )}
                            <motion.circle
                                cx={it.at[0]} cy={it.at[1]} r={it.r ?? 5} fill={it.color ?? WHITE}
                                initial={false} animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.2 }}
                                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                            />
                            {it.hit && it.onClick && show && <circle cx={it.at[0]} cy={it.at[1]} r={it.hit} fill="transparent" />}
                        </g>
                    )
            }
        })}
    </svg>
)

// ===== Геометрические помощники для сцен =====

export const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

// Пересечение прямых a1a2 и b1b2.
export const intersect = (a1: Pt, a2: Pt, b1: Pt, b2: Pt): Pt => {
    const d = (a1[0] - a2[0]) * (b1[1] - b2[1]) - (a1[1] - a2[1]) * (b1[0] - b2[0])
    const x = ((a1[0] * a2[1] - a1[1] * a2[0]) * (b1[0] - b2[0]) - (a1[0] - a2[0]) * (b1[0] * b2[1] - b1[1] * b2[0])) / d
    const y = ((a1[0] * a2[1] - a1[1] * a2[0]) * (b1[1] - b2[1]) - (a1[1] - a2[1]) * (b1[0] * b2[1] - b1[1] * b2[0])) / d
    return [x, y]
}

// Подобное преобразование набора точек: поворот, зеркало, масштаб, сдвиг.
export const xf = (pts: Pt[], o: { rot?: number; mirror?: boolean; scale?: number; tx?: number; ty?: number }): Pt[] => {
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length
    const r = ((o.rot ?? 0) * Math.PI) / 180
    return pts.map(([x, y]) => {
        let dx = x - cx, dy = y - cy
        if (o.mirror) dx = -dx
        const rx = dx * Math.cos(r) - dy * Math.sin(r)
        const ry = dx * Math.sin(r) + dy * Math.cos(r)
        const s = o.scale ?? 1
        return [cx + rx * s + (o.tx ?? 0), cy + ry * s + (o.ty ?? 0)] as Pt
    })
}

// Точка для подписи вершины — чуть снаружи от центра фигуры.
export const outward = (p: Pt, center: Pt, d = 18): Pt => {
    const u = unit(center, p)
    return [p[0] + u[0] * d, p[1] + u[1] * d]
}

export const centroid = (pts: Pt[]): Pt => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length]
