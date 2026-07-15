// components/trainer-skill-tree.tsx
//
// "Паучье" дерево навыков тренажёра: каждый юнит — центральный узел
// с радиальным кольцом прогресса, от которого угловатыми "ножками"
// расходятся уроки. Юниты соединены вертикальным стержнем сверху вниз.
// Когда урок только что открылся (предыдущий пройден, этот ещё не начат),
// его ножка при заходе на страницу подсвечивается бегущей искрой,
// перекрашивающей её из серого в зелёный.

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

const BASE_W = 400
const HUB_R = 50
const LOCKED_COLOR = '#cbd5e1'
const LOCKED_STROKE = '#e2e8f0'
const STEM_COLOR = '#e2e8f0'
const TRACK_COLOR = '#eef0f4'
const RING_COLOR = '#f59e0b'

const legColor = (percentage: number) => {
    if (percentage > 90) return '#f59e0b'
    if (percentage > 60) return '#22c55e'
    if (percentage > 1) return '#ef4444'
    return '#22c55e'
}

const toRad = (deg: number) => (deg * Math.PI) / 180

type LegGeom = {
    lesson: SkillLesson
    knee: { x: number; y: number }
    foot: { x: number; y: number }
    isRevealTarget: boolean
}

type HubGeom = {
    unit: SkillUnit
    x: number
    y: number
    legs: LegGeom[]
    blockBottom: number
}

const legAngles = (n: number) => {
    if (n <= 1) return [-90]
    const start = -165
    const end = -15
    const step = (end - start) / (n - 1)
    return Array.from({ length: n }, (_, i) => start + i * step)
}

const legGeometry = (hx: number, hy: number, angleDeg: number, thighR: number, shinR: number) => {
    const a = toRad(angleDeg)
    const knee = { x: hx + thighR * Math.cos(a), y: hy + thighR * Math.sin(a) }
    const bend = angleDeg === -90 ? 32 : angleDeg < -90 ? -20 : 20
    const a2 = toRad(angleDeg + bend)
    const foot = { x: knee.x + shinR * Math.cos(a2), y: knee.y + shinR * Math.sin(a2) }
    return { knee, foot }
}

const buildLayout = (units: SkillUnit[]) => {
    const hubs: HubGeom[] = []
    let cursorY = 140

    units.forEach((unit) => {
        const n = unit.lessons.length
        const rows = n <= 6 ? [n] : [Math.ceil(n / 2), Math.floor(n / 2)]

        const legs: LegGeom[] = []
        let li = 0
        rows.forEach((rowCount, rowIndex) => {
            const angles = legAngles(rowCount)
            const thighR = rowIndex === 0 ? 55 : 95
            const shinR = rowIndex === 0 ? 60 : 65
            angles.forEach((angle) => {
                const lesson = unit.lessons[li]
                const { knee, foot } = legGeometry(200, cursorY, angle, thighR, shinR)
                const isRevealTarget = li > 0 && !lesson.isDisabled && lesson.percentage === 0
                legs.push({ lesson, knee, foot, isRevealTarget })
                li += 1
            })
        })

        const maxFootY = Math.max(cursorY, ...legs.map((l) => l.foot.y))
        const blockBottom = maxFootY + 46

        hubs.push({ unit, x: 200, y: cursorY, legs, blockBottom })
        cursorY = blockBottom + 90
    })

    const totalHeight = hubs.length ? hubs[hubs.length - 1].blockBottom + 20 : 300
    return { hubs, totalHeight }
}

const pct = (value: number, base: number) => `${((value / base) * 100).toFixed(3)}%`

export const TrainerSkillTree = ({ units }: Props) => {
    const svgRef = useRef<SVGSVGElement>(null)

    const { hubs, totalHeight } = buildLayout(units)

    useEffect(() => {
        const svg = svgRef.current
        if (!svg) return

        const targets = Array.from(svg.querySelectorAll<SVGPathElement>('[data-reveal="true"]'))
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
        <div className="rounded-2xl bg-[#0f1420] p-4 pt-8 pb-10">
            <div style={{ position: 'relative', width: '100%', aspectRatio: `${BASE_W} / ${totalHeight}` }}>
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${BASE_W} ${totalHeight}`}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                >
                    {hubs.slice(1).map((hub, i) => {
                        const prev = hubs[i]
                        return (
                            <path
                                key={`stem-${hub.unit.id}`}
                                d={`M ${prev.x} ${prev.y + HUB_R} L ${hub.x} ${hub.y - HUB_R}`}
                                stroke={STEM_COLOR}
                                strokeWidth={6}
                                strokeLinecap="square"
                                fill="none"
                            />
                        )
                    })}

                    {hubs.map((hub) => (
                        <g key={hub.unit.id}>
                            {hub.legs.map((leg) => {
                                const d = `M ${hub.x} ${hub.y} L ${leg.knee.x} ${leg.knee.y} L ${leg.foot.x} ${leg.foot.y}`
                                const locked = leg.lesson.isDisabled
                                const color = locked ? LOCKED_COLOR : legColor(leg.lesson.percentage)

                                if (leg.isRevealTarget) {
                                    return (
                                        <g key={leg.lesson.id}>
                                            <path d={d} stroke={LOCKED_COLOR} strokeWidth={7} strokeLinecap="square" strokeLinejoin="miter" fill="none" />
                                            <path
                                                data-reveal="true"
                                                data-leg-id={leg.lesson.id}
                                                d={d}
                                                stroke={color}
                                                strokeWidth={7}
                                                strokeLinecap="square"
                                                strokeLinejoin="miter"
                                                fill="none"
                                            />
                                            <circle data-spark-id={leg.lesson.id} r={6} fill="#fef08a" opacity={0} cx={hub.x} cy={hub.y} />
                                        </g>
                                    )
                                }

                                return (
                                    <path
                                        key={leg.lesson.id}
                                        d={d}
                                        stroke={color}
                                        strokeWidth={locked ? 6 : 7}
                                        strokeLinecap="square"
                                        strokeLinejoin="miter"
                                        fill="none"
                                    />
                                )
                            })}

                            <circle cx={hub.x} cy={hub.y} r={HUB_R} fill="#111827" stroke="#1e293b" strokeWidth={2} />
                            <circle cx={hub.x} cy={hub.y} r={HUB_R} fill="none" stroke={TRACK_COLOR === '#eef0f4' ? '#22303f' : TRACK_COLOR} strokeWidth={8} />
                            <circle
                                cx={hub.x}
                                cy={hub.y}
                                r={HUB_R}
                                fill="none"
                                stroke={RING_COLOR}
                                strokeWidth={8}
                                strokeLinecap="round"
                                transform={`rotate(-90 ${hub.x} ${hub.y})`}
                                strokeDasharray={2 * Math.PI * HUB_R}
                                strokeDashoffset={2 * Math.PI * HUB_R * (1 - hub.unit.percentage / 100)}
                            />
                        </g>
                    ))}
                </svg>

                {hubs.map((hub) => (
                    <div
                        key={`label-${hub.unit.id}`}
                        style={{
                            position: 'absolute',
                            left: pct(hub.x, BASE_W),
                            top: pct(hub.y, totalHeight),
                            transform: 'translate(-50%, -50%)',
                            width: 84,
                            pointerEvents: 'none',
                        }}
                        className="text-center"
                    >
                        <div className="text-[11px] font-semibold text-white leading-tight">{hub.unit.title}</div>
                        <div className="text-[10px] font-medium text-amber-400 mt-0.5">{Math.round(hub.unit.percentage)}%</div>
                    </div>
                ))}

                {hubs.flatMap((hub) =>
                    hub.legs.map((leg) => {
                        const locked = leg.lesson.isDisabled
                        const mastered = leg.lesson.percentage > 90
                        const Icon = locked ? Lock : mastered ? Trophy : Zap

                        const badge = (
                            <div
                                data-node-id={leg.lesson.id}
                                className={cn(
                                    'relative flex h-11 w-11 items-center justify-center rounded-xl border-[3px] transition-colors',
                                    locked
                                        ? 'bg-slate-100 border-slate-300'
                                        : mastered
                                            ? 'bg-amber-400 border-amber-500'
                                            : leg.lesson.percentage > 60
                                                ? 'bg-green-500 border-green-600'
                                                : leg.lesson.percentage > 1
                                                    ? 'bg-red-400 border-red-500'
                                                    : 'bg-green-500 border-green-600',
                                )}
                            >
                                <Icon className={cn('h-5 w-5', locked ? 'text-slate-400' : 'text-white')} />
                                {leg.lesson.hasHw && !locked && (
                                    <Image src="/hwSvgs/friesW.svg" width={20} height={20} alt="ДЗ" className="absolute -top-2 -left-2 animate-bounce" />
                                )}
                                {leg.lesson.isInQuest && !locked && leg.lesson.percentage < 100 && (
                                    <Image src="/hwSvgs/donut.svg" width={18} height={18} alt="Квест" className="absolute -top-2 -right-2 animate-bounce" />
                                )}
                            </div>
                        )

                        return (
                            <div
                                key={leg.lesson.id}
                                style={{
                                    position: 'absolute',
                                    left: pct(leg.foot.x, BASE_W),
                                    top: pct(leg.foot.y, totalHeight),
                                    transform: 'translate(-50%, -50%)',
                                    width: 90,
                                }}
                            >
                                <div className="flex flex-col items-center gap-1.5">
                                    {locked ? badge : (
                                        <Link href={`/t-lesson/${leg.lesson.id}`}>{badge}</Link>
                                    )}
                                    <div className={cn('text-[10px] font-medium text-center leading-tight', locked ? 'text-slate-500' : 'text-slate-200')}>
                                        {leg.lesson.title}
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
