'use client'

// components/ddx-sandbox.tsx — песочница паззла «абонемент в DDX» (страница /gym).
// Логотип режется на 9 квадратных кусочков 3×3 с выступами и выемками, как у настоящего паззла.
// Свои кусочки лежат внизу вразнобой; их тащат пальцем в рамку — у своего места кусочек
// примагничивается. 2 повторки можно слить в недостающий кусочек. Все 9 на местах — промокод.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, Copy, Sparkles } from 'lucide-react'
import { DDX_PIECES, DDX_MERGE_COST, type DdxPieceState } from '@/lib/ddxConst'
import { DDX_LOGO, DDX_CELL, DDX_BOARD, ddxPiecePath, ddxHome } from '@/components/ddx-piece'
import { claimDdx, mergeDdx, placeDdx } from '@/actions/ddx'
import { LocalAnswerConfetti } from '@/components/geometry/WalkthroughLog'
import { playSound, PIZZA_DROP_SOUND } from '@/lib/sound'

const LOGO = DDX_LOGO
const CELL = DDX_CELL
const BOARD = DDX_BOARD
const piecePath = ddxPiecePath
const home = ddxHome
const SNAP = 30 // насколько близко к месту нужно поднести кусочек
const TRAY_Y = 335 // верх «песочницы» под рамкой
const VIEW = { x: -30, y: -30, w: 360, h: 580 }
const randomTrayPos = () => ({ x: -10 + Math.random() * 220, y: TRAY_Y + Math.random() * 90 })
// Вразнобой, но не кучей: из 30 случайных мест берём самое далёкое от уже лежащих кусочков.
const spreadTrayPos = (taken: { x: number; y: number }[]) => {
    let best = randomTrayPos(), bestD = -1
    for (let k = 0; k < 30; k++) {
        const c = randomTrayPos()
        const d = taken.length ? Math.min(...taken.map((t) => Math.hypot(t.x - c.x, (t.y - c.y) * 1.6))) : 1
        if (d > bestD) { best = c; bestD = d }
    }
    return best
}

// demo — тренировка (страница /ddx-practice): все 9 кусочков сразу, ничего не сохраняется, промокода нет.
type Props = { pieces: DdxPieceState[]; promoCode: string | null; demo?: boolean }

export const DdxSandbox = ({ pieces: initial, promoCode: initialCode, demo = false }: Props) => {
    const router = useRouter()
    const [pieces, setPieces] = useState(initial)
    const [code, setCode] = useState(initialCode)
    const [pos, setPos] = useState<Record<number, { x: number; y: number }>>({})
    const [drag, setDrag] = useState<{ piece: number; dx: number; dy: number } | null>(null)
    const [fresh, setFresh] = useState<number | null>(null)
    const [merging, setMerging] = useState(false)
    const [copied, setCopied] = useState(false)
    const [celebrate, setCelebrate] = useState(false)
    const svgRef = useRef<SVGSVGElement>(null)

    useEffect(() => { setPieces(initial) }, [initial])
    // Случайные места в песочнице — только на клиенте (иначе сервер и браузер разойдутся).
    useEffect(() => {
        setPos((p) => {
            const next = { ...p }
            for (const pc of pieces) {
                if (pc.placed || next[pc.piece]) continue
                const taken = pieces.filter((o) => !o.placed && next[o.piece]).map((o) => next[o.piece])
                next[pc.piece] = spreadTrayPos(taken)
            }
            return next
        })
    }, [pieces])

    const owned = pieces.length
    const placedCount = pieces.filter((p) => p.placed).length
    const dups = pieces.reduce((s, p) => s + Math.max(0, p.qty - 1), 0)
    const missing = DDX_PIECES - owned
    const done = placedCount >= DDX_PIECES

    useEffect(() => {
        if (!done || !demo) return
        setCelebrate(true); playSound(PIZZA_DROP_SOUND)
    }, [done, demo])
    const reshuffle = () => {
        setCelebrate(false)
        setPieces(initial.map((p) => ({ ...p, placed: false })))
        const fresh: Record<number, { x: number; y: number }> = {}
        for (const p of initial) fresh[p.piece] = spreadTrayPos(Object.values(fresh))
        setPos(fresh)
    }

    useEffect(() => {
        if (!done || code || demo) return
        claimDdx().then((c) => { if (c) { setCode(c); setCelebrate(true); playSound(PIZZA_DROP_SOUND) } })
    }, [done, code])

    const toSvg = (e: React.PointerEvent) => {
        const svg = svgRef.current
        if (!svg) return { x: 0, y: 0 }
        const pt = svg.createSVGPoint()
        pt.x = e.clientX; pt.y = e.clientY
        const m = svg.getScreenCTM()
        const p = m ? pt.matrixTransform(m.inverse()) : pt
        return { x: p.x, y: p.y }
    }
    const onDown = (e: React.PointerEvent, piece: number) => {
        const p = toSvg(e), cur = pos[piece]
        if (!cur) return
        svgRef.current?.setPointerCapture(e.pointerId)
        setDrag({ piece, dx: p.x - cur.x, dy: p.y - cur.y })
        setFresh(null)
    }
    const onMove = (e: React.PointerEvent) => {
        if (!drag) return
        const p = toSvg(e)
        setPos((s) => ({ ...s, [drag.piece]: { x: p.x - drag.dx, y: p.y - drag.dy } }))
    }
    const onUp = () => {
        if (!drag) return
        const piece = drag.piece
        setDrag(null)
        const cur = pos[piece], h = home(piece)
        if (cur && Math.hypot(cur.x - h.x, cur.y - h.y) < SNAP) {
            setPos((s) => ({ ...s, [piece]: h }))
            setPieces((ps) => ps.map((p) => (p.piece === piece ? { ...p, placed: true } : p)))
            playSound(PIZZA_DROP_SOUND)
            if (!demo) placeDdx(piece)
        }
    }

    const merge = async () => {
        if (merging) return
        setMerging(true)
        const res = await mergeDdx()
        setMerging(false)
        if (res.ok) { setFresh(res.piece); playSound(PIZZA_DROP_SOUND); router.refresh() }
    }

    const loose = useMemo(() => pieces.filter((p) => !p.placed && pos[p.piece]), [pieces, pos])
    const placed = pieces.filter((p) => p.placed)

    const renderPiece = (i: number, at: { x: number; y: number }, opts: { lifted?: boolean; qty?: number; onDown?: (e: React.PointerEvent) => void }) => {
        const h = home(i)
        return (
            <g key={`p${i}`} transform={`translate(${at.x - h.x} ${at.y - h.y})`} onPointerDown={opts.onDown}
                style={{ cursor: opts.onDown ? 'grab' : undefined, filter: opts.lifted ? 'drop-shadow(0 8px 10px rgba(0,0,0,0.55))' : 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }}>
                <g clipPath={`url(#ddx-clip-${i})`}>
                    <image href={LOGO} x={-6} y={-6} width={BOARD + 12} height={BOARD + 12} preserveAspectRatio="xMidYMid slice" />
                </g>
                <path d={piecePath(i)} fill="none" stroke={opts.lifted ? '#FFD460' : 'rgba(255,255,255,0.55)'} strokeWidth={opts.lifted ? 2.5 : 1.5} />
                {opts.qty && opts.qty > 1 && (
                    <g transform={`translate(${h.x + CELL - 14} ${h.y + 14})`}>
                        <circle r={13} fill="#F47B20" stroke="#fff" strokeWidth={2} />
                        <text textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={900} fill="#fff">×{opts.qty}</text>
                    </g>
                )}
            </g>
        )
    }

    // Кусочек, который тащим, рисуем последним — поверх остальных.
    const order = [...loose].sort((a, b) => (a.piece === drag?.piece ? 1 : b.piece === drag?.piece ? -1 : 0))

    return (
        <div className="w-full flex flex-col items-center gap-4">
            <div className="w-full flex items-center gap-3 rounded-2xl border-2 border-[#F47B20]/60 bg-[#033F48] px-3 py-2">
                <div className="flex-1 min-w-0">
                    <p className="text-lg font-black text-[#F2F7FB]">🧩 {owned}/{DDX_PIECES} кусочков</p>
                    <p className="text-xs font-bold text-[#9AA7B0]">На месте {placedCount}/{DDX_PIECES} · повторок {dups}</p>
                </div>
                {demo ? (
                    <button type="button" onClick={reshuffle}
                        className="shrink-0 whitespace-nowrap rounded-xl border-2 border-b-4 border-[#C0601A] bg-[#F47B20] px-3 py-2 text-sm font-black text-white active:border-b-2">
                        Перемешать
                    </button>
                ) : missing > 0 && dups >= DDX_MERGE_COST && (
                    <button type="button" onClick={merge} disabled={merging}
                        className="shrink-0 flex items-center gap-1.5 whitespace-nowrap rounded-xl border-2 border-b-4 border-[#C0601A] bg-[#F47B20] px-3 py-2 text-sm font-black text-white active:border-b-2 disabled:opacity-60">
                        <Sparkles className="h-4 w-4" /> Слить 2 повторки
                    </button>
                )}
            </div>

            {done && demo && (
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-full max-w-[420px] rounded-2xl border-2 border-[#F47B20] bg-[#033F48] p-4 text-center">
                    <p className="text-2xl font-black text-[#F2F7FB]">Собрал! 🏋️</p>
                    <p className="mt-1 text-sm font-bold text-[#9AA7B0]">Это тренировка. Настоящие кусочки выпадают из мифических и МЕГА кейсов — за собранный паззл дают промокод на месяц в DDX Fitness.</p>
                </motion.div>
            )}
            {done && code && (
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-full max-w-[420px] rounded-2xl border-2 border-[#F47B20] bg-[#033F48] p-4 text-center">
                    <p className="text-2xl font-black text-[#F2F7FB]">Абонемент собран! 🏋️</p>
                    <p className="mt-1 text-sm font-bold text-[#9AA7B0]">Твой промокод на месяц в DDX Fitness:</p>
                    <button type="button" onClick={() => { navigator.clipboard.writeText(code); setCopied(true) }}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#F47B20] px-4 py-2 text-xl font-black text-white">
                        {code} {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </button>
                </motion.div>
            )}
            {/* Рамка и песочница целиком влезают в экран: ширина ограничена и высотой окна */}
            <svg ref={svgRef} viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} className="w-full select-none"
                style={{ touchAction: 'none', maxWidth: `min(420px, calc((100dvh - 350px) * ${VIEW.w / VIEW.h}))` }} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
                <defs>
                    {Array.from({ length: DDX_PIECES }, (_, i) => (
                        <clipPath key={i} id={`ddx-clip-${i}`}><path d={piecePath(i)} /></clipPath>
                    ))}
                </defs>
                {/* рамка с силуэтами мест */}
                <rect x={-6} y={-6} width={BOARD + 12} height={BOARD + 12} rx={14} fill="#0F1A1E" stroke="#F47B20" strokeWidth={3} />
                {Array.from({ length: DDX_PIECES }, (_, i) => (
                    <path key={`s${i}`} d={piecePath(i)} fill="rgba(3,63,72,0.35)" stroke="rgba(255,255,255,0.18)" strokeWidth={1.5} strokeDasharray="5 5" />
                ))}
                {placed.map((p) => renderPiece(p.piece, home(p.piece), {}))}
                {/* песочница */}
                <rect x={-26} y={TRAY_Y - 30} width={352} height={VIEW.h + VIEW.y - TRAY_Y + 26} rx={16} fill="rgba(244,123,32,0.06)" stroke="rgba(244,123,32,0.35)" strokeDasharray="8 6" strokeWidth={2} />
                {loose.length === 0 && !done && (
                    <text x={150} y={TRAY_Y + 90} textAnchor="middle" fontSize={15} fontWeight={800} fill="#9AA7B0">
                        {owned === 0 ? 'Кусочки выпадают из мифических и МЕГА кейсов' : 'Все твои кусочки уже на местах'}
                    </text>
                )}
                {order.map((p) => renderPiece(p.piece, pos[p.piece], { lifted: drag?.piece === p.piece || fresh === p.piece, qty: p.qty, onDown: (e) => onDown(e, p.piece) }))}
            </svg>

            {celebrate && <LocalAnswerConfetti />}
        </div>
    )
}
