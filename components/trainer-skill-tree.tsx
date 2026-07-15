// components/trainer-skill-tree.tsx
//
// "Паучье" дерево навыков тренажёра: каждый юнит — центральный узел
// с радиальным кольцом прогресса, от которого строго ортогональными
// (90°) ножками расходятся уроки: вверх, влево, вправо от хаба.
// Если уроков больше трёх, следующие ножки растут не от хаба,
// а от уже нарисованных узлов (получается граф/дерево, а не звезда).
// Юниты соединены вертикальным стержнем сверху вниз (направление "вниз"
// у хаба всегда свободно под этот стержень).
//
// Когда урок только что открылся (предыдущий пройден на 90%+, этот ещё
// не начат), его ножка при заходе на страницу подсвечивается бегущей
// искрой, перекрашивающей её из серого в целевой цвет.

'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Lock, Zap, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SkillLesson = {
    id: number
    title: string
    percentage: number
    isDisabled: boolean
    isInQuest?: boolean
    hasHw?: boolean
}

export type SkillUnit = {
    id: number
    title: string
    percentage: number
    lessons: SkillLesson[]
}

type Props = {
    units: SkillUnit[]
}

type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

const DIR_VEC: Record<Dir, { dx: number; dy: number }> = {
    UP: { dx: 0, dy: -1 },
    DOWN: { dx: 0, dy: 1 },
    LEFT: { dx: -1, dy: 0 },
    RIGHT: { dx: 1, dy: 0 },
}
const OPPOSITE: Record<Dir, Dir> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }

const HUB_R = 62
const NODE_R = 30
const STEP = 150
const STEM_LEN = 170
const PAD = 50

const LOCKED_COLOR = '#cbd5e1'
const TRACK_COLOR = '#e2e8f0'
const STEM_COLOR = '#e2e8f0'
const RING_COLOR = '#f59e0b'

const legColor = (percentage: number) => {
    if (percentage > 90) return '#f59e0b'
    if (percentage > 60) return '#22c55e'
    if (percentage > 1) return '#ef4444'
    return '#22c55e'
}

type Pt = { x: number; y: number }
type PlacedLesson = { lesson: SkillLesson; pos: Pt; parentPos: Pt; isRevealTarget: boolean }
type UnitLayout = {
    unit: SkillUnit
    hub: Pt
    placed: PlacedLesson[]
    minX: number
    maxX: number
    minY: number
    maxY: number
}

type Slot = { parentPos: Pt; dir: Dir }

const buildUnitPositions = (unit: SkillUnit): Omit<UnitLayout, 'hub' | 'unit'> => {
    const slotQueue: Slot[] = [
        { parentPos: { x: 0, y: 0 }, dir: 'UP' },
        { parentPos: { x: 0, y: 0 }, dir: 'LEFT' },
        { parentPos: { x: 0, y: 0 }, dir: 'RIGHT' },
    ]

    const placed: PlacedLesson[] = []

    unit.lessons.forEach((lesson, i) => {
        let slot = slotQueue.shift()
        if (!slot) {
            slot = { parentPos: { x: 0, y: 0 }, dir: 'DOWN' }
        }
        const vec = DIR_VEC[slot.dir]
        const pos: Pt = { x: slot.parentPos.x + vec.dx * STEP, y: slot.parentPos.y + vec.dy * STEP }

        const isRevealTarget = i > 0 && !lesson.isDisabled && lesson.percentage === 0
        placed.push({ lesson, pos, parentPos: slot.parentPos, isRevealTarget })

        const order: Dir[] = (['UP', 'LEFT', 'RIGHT', 'DOWN'] as Dir[]).filter((d) => d !== OPPOSITE[slot!.dir])
        order.forEach((d) => slotQueue.push({ parentPos: pos, dir: d }))
    })

    let minX = -HUB_R
    let maxX = HUB_R
    let minY = -HUB_R
    let maxY = HUB_R
    placed.forEach((p) => {
        minX = Math.min(minX, p.pos.x - NODE_R)
        maxX = Math.max(maxX, p.pos.x + NODE_R)
        minY = Math.min(minY, p.pos.y - NODE_R)
        maxY = Math.max(maxY, p.pos.y + NODE_R)
    })

    return { placed, minX, maxX, minY, maxY }
}

const buildLayout = (units: SkillUnit[]) => {
    const raw = units.map((unit) => ({ unit, ...buildUnitPositions(unit) }))

    const globalMinX = raw.length ? Math.min(...raw.map((u) => u.minX)) : -HUB_R
    const globalMaxX = raw.length ? Math.max(...raw.map((u) => u.maxX)) : HUB_R
    const centerX = PAD - globalMinX
    const totalWidth = centerX + globalMaxX + PAD

    let cursorY = PAD - (raw[0]?.minY ?? -HUB_R)
    const layouts: UnitLayout[] = raw.map((u, i) => {
        const hub = { x: centerX, y: cursorY }
        const layout: UnitLayout = {
            unit: u.unit,
            hub,
            placed: u.placed.map((p) => ({
                ...p,
                pos: { x: centerX + p.pos.x, y: cursorY + p.pos.y },
                parentPos: { x: centerX + p.parentPos.x, y: cursorY + p.parentPos.y },
            })),
            minX: u.minX,
            maxX: u.maxX,
            minY: u.minY,
            maxY: u.maxY,
        }
        const next = raw[i + 1]
        cursorY = cursorY + u.maxY + STEM_LEN + (next ? -next.minY : 0)
        return layout
    })

    const totalHeight = layouts.length ? layouts[layouts.length - 1].hub.y + raw[raw.length - 1].maxY + PAD : 300

    return { layouts, totalWidth, totalHeight }
}

const pct = (value: number, base: number) => `${((value / base) * 100).toFixed(3)}%`

export const TrainerSkillTree = ({ units }: Props) => {
    const svgRef = useRef<SVGSVGElement>(null)

    const { layouts, totalWidth, totalHeight } = buildLayout(units)

    useEffect(() => {
        const svg = svgRef.current
        if (!svg) return

        const targets = Array.from(svg.querySelectorAll<SVGLineElement>('[data-reveal="true"]'))
        if (targets.length === 0) return

        const timer = window.setTimeout(() => {
            targets.forEach((overlay, idx) => {
                const len = overlay.getTotalLength()
                overlay.style.strokeDasharray = `${len}`
                overlay.style.strokeDashoffset = `${len}`

                const legId = overlay.getAttribute('data-leg-id')
                const spark = svg.querySelector<SVGCircleElement>(`[data-spark-id="${legId}"]`)
                const nodeBadge = document.querySelector<HTMLDivElement>(`[data-node-id="${legId}"]`)

                window.setTimeout(() => {
                    overlay.style.transition = 'stroke-dashoffset 900ms linear'
                    overlay.style.strokeDashoffset = '0'
                    if (spark) spark.setAttribute('opacity', '1')

                    const duration = 900
                    let start: number | null = null
                    const frame = (ts: number) => {
                        if (start === null) start = ts
                        const p = Math.min((ts - start) / duration, 1)
                        if (spark) {
                            const pt = overlay.getPointAtLength(p * len)
                            spark.setAttribute('cx', `${pt.x}`)
                            spark.setAttribute('cy', `${pt.y}`)
                        }
                        if (p < 1) {
                            requestAnimationFrame(frame)
                        } else {
                            if (spark) spark.setAttribute('opacity', '0')
                            if (nodeBadge) nodeBadge.classList.add('sktree-revealed')
                        }
                    }
                    requestAnimationFrame(frame)
                }, idx * 200)
            })
        }, 500)

        return () => window.clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 pt-8 pb-10">
            <div style={{ position: 'relative', width: '100%', aspectRatio: `${totalWidth} / ${totalHeight}` }}>
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${totalWidth} ${totalHeight}`}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                >
                    {layouts.slice(1).map((layout, i) => {
                        const prev = layouts[i]
                        return (
                            <line
                                key={`stem-${layout.unit.id}`}
                                x1={prev.hub.x}
                                y1={prev.hub.y + HUB_R}
                                x2={layout.hub.x}
                                y2={layout.hub.y - HUB_R}
                                stroke={STEM_COLOR}
                                strokeWidth={6}
                                strokeLinecap="square"
                            />
                        )
                    })}

                    {layouts.map((layout) => (
                        <g key={layout.unit.id}>
                            {layout.placed.map((p) => {
                                const locked = p.lesson.isDisabled
                                const color = locked ? LOCKED_COLOR : legColor(p.lesson.percentage)

                                if (p.isRevealTarget) {
                                    return (
                                        <g key={p.lesson.id}>
                                            <line x1={p.parentPos.x} y1={p.parentPos.y} x2={p.pos.x} y2={p.pos.y} stroke={LOCKED_COLOR} strokeWidth={8} strokeLinecap="square" />
                                            <line
                                                data-reveal="true"
                                                data-leg-id={p.lesson.id}
                                                x1={p.parentPos.x}
                                                y1={p.parentPos.y}
                                                x2={p.pos.x}
                                                y2={p.pos.y}
                                                stroke={color}
                                                strokeWidth={8}
                                                strokeLinecap="square"
                                            />
                                            <circle data-spark-id={p.lesson.id} r={7} fill="#facc15" opacity={0} cx={p.parentPos.x} cy={p.parentPos.y} />
                                        </g>
                                    )
                                }

                                return (
                                    <line
                                        key={p.lesson.id}
                                        x1={p.parentPos.x}
                                        y1={p.parentPos.y}
                                        x2={p.pos.x}
                                        y2={p.pos.y}
                                        stroke={color}
                                        strokeWidth={locked ? 6 : 8}
                                        strokeLinecap="square"
                                    />
                                )
                            })}

                            <circle cx={layout.hub.x} cy={layout.hub.y} r={HUB_R} fill="#ffffff" stroke="#e2e8f0" strokeWidth={2} />
                            <circle cx={layout.hub.x} cy={layout.hub.y} r={HUB_R} fill="none" stroke={TRACK_COLOR} strokeWidth={9} />
                            <circle
                                cx={layout.hub.x}
                                cy={layout.hub.y}
                                r={HUB_R}
                                fill="none"
                                stroke={RING_COLOR}
                                strokeWidth={9}
                                strokeLinecap="round"
                                transform={`rotate(-90 ${layout.hub.x} ${layout.hub.y})`}
                                strokeDasharray={2 * Math.PI * HUB_R}
                                strokeDashoffset={2 * Math.PI * HUB_R * (1 - layout.unit.percentage / 100)}
                            />
                        </g>
                    ))}
                </svg>

                {layouts.map((layout) => (
                    <div
                        key={`label-${layout.unit.id}`}
                        style={{
                            position: 'absolute',
                            left: pct(layout.hub.x, totalWidth),
                            top: pct(layout.hub.y, totalHeight),
                            transform: 'translate(-50%, -50%)',
                            width: HUB_R * 1.5,
                            pointerEvents: 'none',
                        }}
                        className="text-center"
                    >
                        <div className="text-[13px] font-semibold text-slate-700 leading-tight">{layout.unit.title}</div>
                        <div className="text-[11px] font-medium text-amber-600 mt-0.5">{Math.round(layout.unit.percentage)}%</div>
                    </div>
                ))}

                {layouts.flatMap((layout) =>
                    layout.placed.map((p) => {
                        const locked = p.lesson.isDisabled
                        const mastered = p.lesson.percentage > 90
                        const Icon = locked ? Lock : mastered ? Trophy : Zap

                        const badge = (
                            <div
                                data-node-id={p.lesson.id}
                                className={cn(
                                    'relative flex h-[60px] w-[60px] items-center justify-center rounded-2xl border-4 transition-colors',
                                    locked
                                        ? 'bg-slate-100 border-slate-300'
                                        : mastered
                                            ? 'bg-amber-400 border-amber-500'
                                            : p.lesson.percentage > 60
                                                ? 'bg-green-500 border-green-600'
                                                : p.lesson.percentage > 1
                                                    ? 'bg-red-400 border-red-500'
                                                    : 'bg-green-500 border-green-600',
                                )}
                            >
                                <Icon className={cn('h-6 w-6', locked ? 'text-slate-400' : 'text-white')} />
                                {p.lesson.hasHw && !locked && (
                                    <Image src="/hwSvgs/friesW.svg" width={22} height={22} alt="ДЗ" className="absolute -top-2 -left-2 animate-bounce" />
                                )}
                                {p.lesson.isInQuest && !locked && p.lesson.percentage < 100 && (
                                    <Image src="/hwSvgs/donut.svg" width={20} height={20} alt="Квест" className="absolute -top-2 -right-2 animate-bounce" />
                                )}
                            </div>
                        )

                        return (
                            <div
                                key={p.lesson.id}
                                style={{
                                    position: 'absolute',
                                    left: pct(p.pos.x, totalWidth),
                                    top: pct(p.pos.y, totalHeight),
                                    transform: 'translate(-50%, -50%)',
                                    width: 104,
                                }}
                            >
                                <div className="flex flex-col items-center gap-1.5">
                                    {locked ? badge : (
                                        <Link href={`/t-lesson/${p.lesson.id}`}>{badge}</Link>
                                    )}
                                    <div className={cn('text-[11px] font-medium text-center leading-tight', locked ? 'text-slate-400' : 'text-slate-600')}>
                                        {p.lesson.title}
                                    </div>
                                </div>
                            </div>
                        )
                    }),
                )}
            </div>
        </div>
    )
}

export default TrainerSkillTree
