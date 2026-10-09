// components/ddx-piece.tsx — геометрия кусочков паззла «абонемент в DDX» (3×3) и картинка одного кусочка.
// Используется песочницей (components/ddx-sandbox.tsx) и экраном выигрыша кейса (CaseReel).
import { DDX_COLS } from '@/lib/ddxConst'

export const DDX_LOGO = '/ddx/ddx-logo.svg'
export const DDX_CELL = 100
export const DDX_BOARD = DDX_CELL * DDX_COLS // 300

// Направление выступа на общем крае: +1 — выступ уходит к соседу справа/снизу.
const vSign = (r: number, c: number) => ((r + c) % 2 === 0 ? 1 : -1)
const hSign = (r: number, c: number) => ((r + c) % 2 === 0 ? -1 : 1)

// Край от P0 до P1 с выступом (s = +1 наружу от кусочка, −1 внутрь, 0 — ровный край рамки).
const edge = (x0: number, y0: number, x1: number, y1: number, nx: number, ny: number, s: number) => {
    if (s === 0) return `L${x1} ${y1}`
    const dx = x1 - x0, dy = y1 - y0
    const p = (t: number, o: number) => `${x0 + dx * t + nx * o * s * DDX_CELL} ${y0 + dy * t + ny * o * s * DDX_CELL}`
    return `L${p(0.37, 0)} C${p(0.4, 0.1)} ${p(0.27, 0.25)} ${p(0.5, 0.25)} C${p(0.73, 0.25)} ${p(0.6, 0.1)} ${p(0.63, 0)} L${x1} ${y1}`
}

// Контур кусочка i в координатах рамки (обход по часовой, нормали — наружу).
export const ddxPiecePath = (i: number) => {
    const r = Math.floor(i / DDX_COLS), c = i % DDX_COLS
    const x0 = c * DDX_CELL, y0 = r * DDX_CELL, x1 = x0 + DDX_CELL, y1 = y0 + DDX_CELL
    const top = r === 0 ? 0 : -hSign(r - 1, c)
    const bottom = r === DDX_COLS - 1 ? 0 : hSign(r, c)
    const right = c === DDX_COLS - 1 ? 0 : vSign(r, c)
    const left = c === 0 ? 0 : -vSign(r, c - 1)
    return `M${x0} ${y0} ${edge(x0, y0, x1, y0, 0, -1, top)} ${edge(x1, y0, x1, y1, 1, 0, right)} ${edge(x1, y1, x0, y1, 0, 1, bottom)} ${edge(x0, y1, x0, y0, -1, 0, left)} Z`
}
export const ddxHome = (i: number) => ({ x: (i % DDX_COLS) * DDX_CELL, y: Math.floor(i / DDX_COLS) * DDX_CELL })

// Один кусочек отдельной картинкой (экран выигрыша): кусочек логотипа по своему контуру.
export const DdxPieceImage = ({ piece, className }: { piece: number; className?: string }) => {
    const h = ddxHome(piece)
    const pad = DDX_CELL * 0.3
    const id = `ddx-one-${piece}`
    return (
        <svg viewBox={`${h.x - pad} ${h.y - pad} ${DDX_CELL + 2 * pad} ${DDX_CELL + 2 * pad}`} className={className}>
            <defs><clipPath id={id}><path d={ddxPiecePath(piece)} /></clipPath></defs>
            <g style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}>
                <g clipPath={`url(#${id})`}>
                    <image href={DDX_LOGO} x={-6} y={-6} width={DDX_BOARD + 12} height={DDX_BOARD + 12} preserveAspectRatio="xMidYMid slice" />
                </g>
                <path d={ddxPiecePath(piece)} fill="none" stroke="#FFD460" strokeWidth={2.5} />
            </g>
        </svg>
    )
}
