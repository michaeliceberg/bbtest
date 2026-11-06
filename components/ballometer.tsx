'use client'

// components/ballometer.tsx — Баллометр: значок (шапка, угол ангара) и окно с прибором, картой дат,
// «рецептом» и настройкой темпа. Расчёт — lib/egeMeter.ts, данные ученика — lib/ballometer.ts.
// Раз в день Команданте сообщает показание (BallometerHello).

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Hand, MoveHorizontal, X } from 'lucide-react'
import { saveBallometerProgram } from '@/actions/ballometer'
import { stencilFont } from '@/lib/fonts'
import { computeMeter, dateForSets, dateRu, dateShort, EGE_EXAM_DATE, formatScore, MAX_SETS_WEEK, METER_GREEN_FROM, METER_YELLOW_FROM, setsForDate, setsTodayGoal, type MeterResult, type MeterZone } from '@/lib/egeMeter'
import { declensionRu } from '@/usefulFunctions'

export type BallometerProps = {
    primary: number
    perWeek: number | null
    targetTest: number
    setGain: number
    goalDateIso: string | null
    setsGoal: number | null
    setsThisWeek: number
    setsToday: number
    nowIso: string
}

const NAME = 'Баллометр'
export const ZONE_COLOR: Record<MeterZone, string> = { green: '#78C93C', yellow: '#F2C35B', red: '#E5533D', new: '#7E8F99' }
const setsWord = (n: number) => declensionRu(n, 'сет', 'сета', 'сетов')
const DAY = 86400000
// за экзаменом дорога идёт ещё столько: туда попадает красная отметка «не успеваю»
const ROAD_AFTER_EXAM_DAYS = 75

const arc = (a0: number, a1: number, r: number) => {
    const r2 = (v: number) => Math.round(v * 100) / 100 // одинаково на сервере и в браузере
    const pt = (a: number) => [r2(100 + r * Math.sin((a * Math.PI) / 180)), r2(100 - r * Math.cos((a * Math.PI) / 180))]
    const [x0, y0] = pt(a0), [x1, y1] = pt(a1)
    return `M${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`
}
const toAngle = (s: number) => -120 + (s / 5) * 240

const RIVETS = [0, 45, 90, 135, 180, 225, 270, 315].map((a) => ({ x: Math.round((100 + 88.5 * Math.sin((a * Math.PI) / 180)) * 100) / 100, y: Math.round((100 - 88.5 * Math.cos((a * Math.PI) / 180)) * 100) / 100 }))
const GAUGE_TICKS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

// Армейский прибор из ангара: латунный корпус с заклёпками, тёмный циферблат, стрелка и окошко с показанием.
export const BallometerGauge = ({ m, className = '' }: { m: MeterResult; className?: string }) => (
    <svg viewBox="0 0 200 200" className={className}>
        <defs>
            <linearGradient id="bm-brass" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#C4A765" />
                <stop offset=".5" stopColor="#8C7440" />
                <stop offset="1" stopColor="#5E4C28" />
            </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="97" fill="url(#bm-brass)" stroke="#2B1E14" strokeWidth="3" />
        {RIVETS.map((r, i) => (
            <circle key={i} cx={r.x} cy={r.y} r="3.2" fill="#D9C48A" stroke="#2B1E14" strokeWidth="1.3" />
        ))}
        <circle cx="100" cy="100" r="80" fill="#232B22" stroke="#2B1E14" strokeWidth="3.5" />
        <path d={arc(toAngle(0), toAngle(5), 67)} stroke="#12170F" strokeWidth="15" fill="none" />
        <path d={arc(toAngle(0), toAngle(METER_YELLOW_FROM), 67)} stroke={ZONE_COLOR.red} strokeWidth="10" fill="none" />
        <path d={arc(toAngle(METER_YELLOW_FROM), toAngle(METER_GREEN_FROM), 67)} stroke={ZONE_COLOR.yellow} strokeWidth="10" fill="none" />
        <path d={arc(toAngle(METER_GREEN_FROM), toAngle(5), 67)} stroke={ZONE_COLOR.green} strokeWidth="10" fill="none" />
        {GAUGE_TICKS.map((n) => {
            const a = (toAngle(n) * Math.PI) / 180
            const r0 = 59, r1 = n % 1 === 0 ? 51 : 55
            const c2 = (v: number) => Math.round(v * 100) / 100
            return <line key={n} x1={c2(100 + r0 * Math.sin(a))} y1={c2(100 - r0 * Math.cos(a))} x2={c2(100 + r1 * Math.sin(a))} y2={c2(100 - r1 * Math.cos(a))} stroke="#E8D9B8" strokeWidth={n % 1 === 0 ? 2.5 : 1.3} />
        })}
        {[0, 1, 2, 3, 4, 5].map((n) => {
            const a = (toAngle(n) * Math.PI) / 180
            return <text key={n} x={Math.round(100 + 41 * Math.sin(a))} y={Math.round(105 - 41 * Math.cos(a))} textAnchor="middle" fontSize="13" fill="#E8D9B8" className={stencilFont.className}>{n}</text>
        })}
        <text x="100" y="84" textAnchor="middle" fontSize="8.5" letterSpacing=".6" fill="#C9B98F" className={stencilFont.className}>БАЛЛОМЕТР</text>
        <g style={{ transform: `rotate(${toAngle(m.score ?? 0)}deg)`, transformOrigin: '100px 100px', transition: 'transform .7s cubic-bezier(.3,1.5,.5,1)' }}>
            <path d="M95.5 116 L100 40 L104.5 116 Z" fill={m.zone === 'new' ? ZONE_COLOR.new : '#E8552F'} stroke="#2B1E14" strokeWidth="1.6" strokeLinejoin="round" />
        </g>
        <circle cx="100" cy="100" r="9" fill="url(#bm-brass)" stroke="#2B1E14" strokeWidth="2" />
        <circle cx="100" cy="100" r="2.4" fill="#2B1E14" />
        <rect x="72" y="127" width="56" height="30" rx="4" fill="#0B1012" stroke="#2B1E14" strokeWidth="3" />
        <rect x="72" y="127" width="56" height="30" rx="4" fill="none" stroke="#C4A765" strokeWidth="1" />
        <text x="100" y="150" textAnchor="middle" fontSize="21" fill={ZONE_COLOR[m.zone]} className={stencilFont.className}>{formatScore(m.score)}</text>
        <text x="100" y="170" textAnchor="middle" fontSize="9" fill="#C9B98F" className={stencilFont.className}>ИЗ 5</text>
        {/* блик на стекле */}
        <path d="M38 78 A66 66 0 0 1 112 35 A90 90 0 0 0 38 78 Z" fill="#FFFFFF" opacity=".1" />
    </svg>
)

const dateColor = (d: Date | null, goal: Date) => (!d || d > EGE_EXAM_DATE ? ZONE_COLOR.red : d > goal ? ZONE_COLOR.yellow : ZONE_COLOR.green)

// Карта подготовки: высота и положение дороги на ней.
const MAP_H = 200
const ROUTE_Y = 124
const PLAN_POLE = 82
const FORECAST_POLE = 44
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const FLAG_PALE: Record<string, string> = { [ZONE_COLOR.green]: '#C7E3A5', [ZONE_COLOR.yellow]: '#F4DE9F', [ZONE_COLOR.red]: '#F0AFA3' }
const INK = '#3A2A1E'
const r1 = (v: number) => Math.round(v * 10) / 10
const routeY = (p: number) => r1(ROUTE_Y + 6 * Math.sin(p * 7))
const routePath = (p0: number, p1: number) => {
    const n = Math.max(2, Math.ceil((p1 - p0) * 50))
    return Array.from({ length: n + 1 }, (_, i) => { const p = p0 + ((p1 - p0) * i) / n; return `${r1(p * 1000)},${routeY(p)}` }).join(' ')
}
const swallow = (flip: boolean) => (flip ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 8px 50%)' : 'polygon(0 0, 100% 0, calc(100% - 8px) 50%, 100% 100%, 0 100%)')

// Флажок на карте: древко от дороги вверх, полотнище с подписью. Справа от края полотнище разворачивается влево.
function MapFlag({ pole, bg, ink, text, flip }: { pole: number; bg: string; ink: string; text: string; flip: boolean }) {
    return (
        <div className="absolute left-0" style={{ top: -pole }}>
            <span className="absolute -left-[1.5px] top-0 w-[3px] rounded-full" style={{ height: pole, background: INK }} />
            <div className="absolute top-0 whitespace-nowrap p-[2px]" style={{ [flip ? 'right' : 'left']: 0, background: INK, clipPath: swallow(flip) } as React.CSSProperties}>
                <div className={`py-0.5 text-xs font-black leading-tight ${flip ? 'pl-4 pr-1.5' : 'pl-1.5 pr-4'}`} style={{ background: bg, color: ink, clipPath: swallow(flip) }}>{text}</div>
            </div>
        </div>
    )
}

// Карта: сегодня → экзамен и дальше. Флажок «Прогноз» показывает, куда придёшь с нынешней скоростью,
// флажок «План» ученик ставит сам: тащит или нажимает на любое место карты.
function DateMap({ now, ready, showForecast, plan, onDrag }: { now: Date; ready: Date | null; showForecast: boolean; plan: Date; onDrag: (d: Date) => void }) {
    const end = EGE_EXAM_DATE.getTime() + ROAD_AFTER_EXAM_DAYS * DAY
    const pos = (d: Date) => Math.max(0, Math.min(1, (d.getTime() - now.getTime()) / (end - now.getTime())))
    const mapRef = useRef<HTMLDivElement>(null)
    const [dragP, setDragP] = useState<number | null>(null)
    const [moved, setMoved] = useState(false)
    const [touched, setTouched] = useState(false)
    const [hoverP, setHoverP] = useState<number | null>(null)
    const [ripple, setRipple] = useState<{ id: number; x: number; y: number } | null>(null)
    const start = useRef<number | null>(null)
    const pAt = (clientX: number) => {
        const r = mapRef.current!.getBoundingClientRect()
        return Math.max(0.02, Math.min(1, ((clientX - r.left) / r.width - 0.05) / 0.9))
    }
    const dateOf = (p: number) => new Date(now.getTime() + p * (end - now.getTime()))
    const put = (p: number) => { setDragP(p); onDrag(dateOf(p)) }

    const examP = pos(EGE_EXAM_DATE)
    const planP = pos(plan)
    const shownPlanP = dragP ?? planP
    const late = plan > EGE_EXAM_DATE
    const planBg = late ? '#C8452F' : '#4E8F2A'
    const pastRoad = !ready || ready.getTime() > end
    const readyP = ready ? pos(ready) : 1
    const fColor = dateColor(ready, plan)
    const months = useMemo(() => {
        const out: { key: string; p: number; t: string }[] = []
        const d = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        for (; d.getTime() < end; d.setMonth(d.getMonth() + 1)) out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, p: pos(new Date(d)), t: MONTHS[d.getMonth()] })
        return out
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [now, end])
    const greenEnd = Math.min(planP, examP)

    return (
        <div ref={mapRef} className="relative mt-3 select-none overflow-hidden rounded-xl border-[3px]"
            style={{ height: MAP_H, borderColor: INK, background: 'linear-gradient(180deg,#EBDCB6,#DCC89A)', touchAction: 'pan-y', cursor: moved ? 'grabbing' : 'pointer' }}
            onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId)
                const r = e.currentTarget.getBoundingClientRect()
                start.current = e.clientX
                setTouched(true); setMoved(false); setHoverP(null)
                setRipple({ id: Date.now(), x: e.clientX - r.left, y: e.clientY - r.top })
                put(pAt(e.clientX))
            }}
            onPointerMove={(e) => {
                if (start.current !== null) {
                    if (Math.abs(e.clientX - start.current) > 3) setMoved(true)
                    put(pAt(e.clientX))
                } else if (e.pointerType === 'mouse') setHoverP(pAt(e.clientX))
            }}
            onPointerUp={() => { start.current = null; setDragP(null); setMoved(false) }}
            onPointerCancel={() => { start.current = null; setDragP(null); setMoved(false) }}
            onPointerLeave={() => setHoverP(null)}>
            {/* рисунок карты: сетка, горизонтали, зона после экзамена, маршрут */}
            <svg className="pointer-events-none absolute left-[5%] top-0 h-full w-[90%] overflow-visible" viewBox={`0 0 1000 ${MAP_H}`} preserveAspectRatio="none">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => <line key={i} x1={i * 125} y1="0" x2={i * 125} y2={MAP_H} stroke="#B89E6E" strokeOpacity=".3" vectorEffect="non-scaling-stroke" />)}
                {[40, 80, 120, 160].map((y) => <line key={y} x1="-60" y1={y} x2="1060" y2={y} stroke="#B89E6E" strokeOpacity=".3" vectorEffect="non-scaling-stroke" />)}
                <path d="M60 60 C160 20 300 30 350 70 S240 130 120 110 S0 90 60 60 Z" fill="none" stroke="#A98C58" strokeOpacity=".45" vectorEffect="non-scaling-stroke" />
                <path d="M110 66 C180 44 270 52 295 74 S220 106 145 94 S80 80 110 66 Z" fill="none" stroke="#A98C58" strokeOpacity=".45" vectorEffect="non-scaling-stroke" />
                <path d="M560 150 C660 120 800 130 860 160 S760 200 640 190 S500 170 560 150 Z" fill="none" stroke="#A98C58" strokeOpacity=".4" vectorEffect="non-scaling-stroke" />
                <rect x={examP * 1000} y="0" width={(1 - examP) * 1000 + 60} height={MAP_H} fill="#B23A32" fillOpacity=".16" />
                <polyline points={routePath(0, greenEnd)} fill="none" stroke="#2B1E14" strokeWidth="9" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <polyline points={routePath(0, greenEnd)} fill="none" stroke="#6DB33F" strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                {greenEnd < examP && <polyline points={routePath(greenEnd, examP)} fill="none" stroke="#5E4A2A" strokeWidth="4" strokeDasharray="8 7" vectorEffect="non-scaling-stroke" />}
                <polyline points={routePath(examP, 1)} fill="none" stroke="#B23A32" strokeWidth="4" strokeDasharray="8 7" vectorEffect="non-scaling-stroke" />
            </svg>
            {/* подсказка: пока ученик не тронул карту */}
            <div className={`pointer-events-none absolute left-2 top-1.5 flex items-center gap-1 text-[11px] font-black transition-opacity duration-300 ${touched ? 'opacity-0' : 'opacity-100'}`} style={{ color: INK }}>
                <Hand className="h-3.5 w-3.5" strokeWidth={2.6} />Тащи флажок или нажми на карту
            </div>
            {/* месяцы */}
            {months.map((mo) => (
                <span key={mo.key} className="pointer-events-none absolute -translate-x-1/2 text-[9px] font-black" style={{ left: `${5 + 90 * mo.p}%`, top: ROUTE_Y + 14, color: '#6B5634' }}>{mo.t}</span>
            ))}
            {/* сегодня */}
            <div className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] bg-[#F2F7FB]" style={{ left: '5%', top: routeY(0), borderColor: INK }} />
            <span className="pointer-events-none absolute left-1.5 whitespace-nowrap text-[11px] font-black leading-tight" style={{ top: MAP_H - 38, color: INK }}>Сегодня<br /><span className="font-bold text-[#6B5634]">{dateShort(now)}</span></span>
            {/* экзамен */}
            <span className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${5 + 90 * examP}%`, top: routeY(examP) }}><ExamStar /></span>
            <span className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap text-center text-[11px] font-black leading-tight" style={{ left: `${5 + 90 * examP}%`, top: MAP_H - 38, color: '#8E2A22' }}>Экзамен<br /><span className="font-bold">{dateShort(EGE_EXAM_DATE)}</span></span>
            {/* слой флажков */}
            <div className="pointer-events-none absolute inset-y-0 left-[5%] right-[5%]">
                {hoverP !== null && dragP === null && (
                    <div className="absolute inset-0" style={{ transform: `translate(${hoverP * 100}%, ${routeY(hoverP)}px)` }}>
                        <span className="absolute -left-px w-0.5 border-l-2 border-dashed" style={{ top: -PLAN_POLE, height: PLAN_POLE, borderColor: INK, opacity: 0.5 }} />
                        <span className="absolute whitespace-nowrap rounded bg-[#3A2A1E] px-1 text-[10px] font-bold text-[#F1E4C3]" style={{ top: -PLAN_POLE - 16, [hoverP > 0.6 ? 'right' : 'left']: 0 } as React.CSSProperties}>{dateShort(dateOf(hoverP))}</span>
                    </div>
                )}
                {showForecast && (
                    <div className="absolute inset-0" style={{ transform: `translate(${readyP * 100}%, ${routeY(readyP)}px)`, transition: 'transform .6s cubic-bezier(.3,1.5,.5,1)', zIndex: 4 }}>
                        <MapFlag pole={FORECAST_POLE} bg={FLAG_PALE[fColor]} ink={INK} flip={readyP > 0.6} text={`Прогноз: ${pastRoad ? 'не успеваешь' : dateShort(ready!)}`} />
                        <span className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2" style={{ background: FLAG_PALE[fColor], borderColor: INK }} />
                    </div>
                )}
                <div className="absolute inset-0" style={{ transform: `translate(${shownPlanP * 100}%, ${routeY(shownPlanP)}px)`, transition: moved ? 'none' : 'transform .4s cubic-bezier(.3,1.6,.5,1)', zIndex: 3 }}>
                    <div className={`absolute inset-0 ${touched ? '' : 'bm-flag-nudge'}`}>
                        <MapFlag pole={PLAN_POLE} bg={planBg} ink="#FFFFFF" flip={shownPlanP > 0.6} text={`★ План: ${dateShort(plan)}`} />
                        {!touched && <span className="bm-knob-ring absolute -left-5 -top-5 h-10 w-10 rounded-full border-[3px]" style={{ borderColor: planBg }} />}
                        <span className="absolute -left-[15px] -top-[15px] flex h-[30px] w-[30px] items-center justify-center rounded-full border-[3px] bg-[#FFF6E4]" style={{ borderColor: INK, boxShadow: '0 2px 0 rgba(43,30,20,.55)' }}>
                            <MoveHorizontal className="h-4 w-4" strokeWidth={3} style={{ color: INK }} />
                        </span>
                    </div>
                </div>
            </div>
            {/* волна там, куда нажали */}
            {ripple && <span key={ripple.id} onAnimationEnd={() => setRipple(null)} className="bm-ripple pointer-events-none absolute h-12 w-12 rounded-full border-[3px]" style={{ left: ripple.x - 24, top: ripple.y - 24, borderColor: INK }} />}
        </div>
    )
}

const ExamStar = () => (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path d="M12 2 L15 9 L22.5 9.6 L16.8 14.4 L18.6 22 L12 17.9 L5.4 22 L7.2 14.4 L1.5 9.6 L9 9 Z" fill="#C8452F" stroke="#2B1E14" strokeWidth="2" strokeLinejoin="round" />
    </svg>
)

// Крупная цель: 90 и справа в две строки «баллов ЕГЭ».
const GoalBlock = ({ target, demo }: { target: number; demo?: boolean }) => (
    <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#C9B98F]">Цель</p>
        <div className="flex items-center gap-1.5">
            <span className={`${stencilFont.className} text-5xl leading-none text-[#F2C35B]`}>{target}</span>
            <span className="text-sm font-black leading-tight text-[#F2F7FB]">{declensionRu(target, 'балл', 'балла', 'баллов')}<br />ЕГЭ</span>
        </div>
        {!demo && <Link href="/path" className="mt-1 block text-[11px] font-bold text-[#7FC8F2] underline">Сменить цель</Link>}
    </div>
)

// Сегодняшняя норма сетов: «1 из 2» и квадратики.
const TodaySets = ({ done, goal }: { done: number; goal: number }) => {
    const total = Math.max(goal, done)
    const complete = total > 0 && done >= total
    return (
        <div className="min-w-0 text-right">
            <p className="text-[10px] font-black uppercase tracking-wide text-[#C9B98F]">Сегодня</p>
            {total === 0 ? (
                <p className="mt-1 text-sm font-black leading-tight text-[#78C93C]">Норма недели<br />закрыта</p>
            ) : (
                <>
                    <p className="leading-none">
                        <span className={`${stencilFont.className} text-4xl`} style={{ color: complete ? '#78C93C' : '#F2F7FB' }}>{done}</span>
                        <span className="text-sm font-black text-[#E8D9B8]"> из {total} {total % 10 === 1 && total % 100 !== 11 ? 'сета' : 'сетов'}</span>
                    </p>
                    <div className="mt-1.5 flex justify-end gap-1">
                        {Array.from({ length: Math.min(total, 8) }, (_, i) => (
                            <span key={i} className="h-2.5 w-2.5 rounded-[3px] border-2" style={{ borderColor: i < done ? '#78C93C' : '#5C6B73', background: i < done ? '#78C93C' : 'transparent' }} />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export function BallometerPanel({ d, onClose, demo }: { d: BallometerProps; onClose?: () => void; demo?: boolean }) {
    const now = useMemo(() => new Date(d.nowIso), [d.nowIso])
    const goalDate = useMemo(() => (d.goalDateIso ? new Date(d.goalDateIso) : null), [d.goalDateIso])
    const m = computeMeter({ primary: d.primary, perWeek: d.perWeek, targetTest: d.targetTest, setGain: d.setGain, goalDate, now })
    const startSets = d.setsGoal ?? setsForDate(m.needPrimary, m.goalDate, d.setGain, now)
    const [sets, setSets] = useState(startSets)
    const [saved, setSaved] = useState<'idle' | 'saving' | 'done'>('idle')
    useEffect(() => { setSets(startSets) }, [startSets])
    const plan = dateForSets(m.needPrimary, sets, d.setGain, now)
    const change = (n: number) => { setSaved('idle'); setSets(Math.max(1, Math.min(MAX_SETS_WEEK, n))) }
    const planLate = plan > EGE_EXAM_DATE
    const save = async () => {
        if (demo) { setSaved('done'); return }
        setSaved('saving')
        const r = await saveBallometerProgram(plan.toISOString(), sets)
        setSaved(r.ok ? 'done' : 'idle')
    }
    const reached = m.needPrimary === 0

    return (
        <div className="w-full">
            <div className="mb-2 flex items-center justify-between">
                <span className={`${stencilFont.className} text-lg text-[#F2F7FB]`}>{NAME}</span>
                {onClose && <button type="button" aria-label="Закрыть" onClick={onClose} className="-mr-1 rounded-lg p-1 text-[#9AA7B0] hover:text-white"><X className="h-5 w-5" /></button>}
            </div>
            <div className="flex items-start justify-between gap-2">
                <GoalBlock target={m.targetTest} demo={demo} />
                {!reached && <TodaySets done={d.setsToday} goal={setsTodayGoal(sets, d.setsThisWeek, d.setsToday, now)} />}
            </div>
            <BallometerGauge m={m} className="mx-auto mt-2 h-[190px] w-[190px]" />
            <p className="mt-1.5 text-center text-sm font-bold leading-snug text-[#E8D9B8]">
                {reached ? 'Цель уже в кармане. Держи форму!'
                    : m.zone === 'new' ? 'Прибор прогревается. Закрой первый сет, и он покажет твою скорость.'
                    : m.readyDate ? <>С такой скоростью возьмёшь цель к <b style={{ color: dateColor(m.readyDate, m.goalDate) }}>{dateRu(m.readyDate)}</b></>
                    : 'Скорость нулевая: цель не приближается.'}
            </p>
            {!reached && (
                <>
                    <DateMap now={now} ready={m.readyDate} showForecast={m.zone !== 'new'} plan={plan}
                        onDrag={(date) => change(setsForDate(m.needPrimary, date, d.setGain, now))} />
                    <div className="mb-3 mt-1.5 space-y-0.5 text-[11px] font-bold leading-snug text-[#9AA7B0]">
                        {m.zone !== 'new' && <p><b className="text-[#F4DE9F]">Прогноз</b>: куда придёшь с нынешней скоростью</p>}
                        <p><b className="text-[#8FD460]">План</b>: куда хочешь успеть, его ставишь ты</p>
                    </div>
                    {/* рецепт */}
                    {m.zone !== 'new' && m.addSetsPerWeek > 0 && (
                        <div className="mb-3 rounded-lg border-l-4 px-3 py-2 text-sm font-bold text-[#2B2118]" style={{ borderColor: ZONE_COLOR[m.zone], background: 'linear-gradient(180deg,#F1E4C3,#E6D3A8)' }}>
                            <span className="block text-[10px] font-black uppercase tracking-wide text-[#6B5634]">Рецепт Команданте</span>
                            Прибавь +{m.addSetsPerWeek} {setsWord(m.addSetsPerWeek)} в неделю, и будешь успевать.
                        </div>
                    )}
                    {/* темп */}
                    <div className="rounded-xl border-2 border-[#2C3A41] bg-black/20 p-3">
                        <p className="text-xs font-black uppercase tracking-wide text-[#C9B98F]">Твой темп</p>
                        {d.perWeek !== null && <p className="mt-0.5 text-xs font-bold text-[#9AA7B0]">{`Сейчас: примерно ${Math.round((d.perWeek / d.setGain) * 10) / 10} в неделю.`.replace(/(\d)\.(\d)/, '$1,$2')}</p>}
                        <div className="mt-2 flex items-center justify-center gap-3">
                            <button type="button" aria-label="Меньше сетов" onClick={() => change(sets - 1)} className="h-11 w-11 rounded-xl border-2 border-b-4 border-[#1E2629] bg-[#3A454B] text-xl font-black text-white active:border-b-0">−</button>
                            <div className="w-32 text-center">
                                <motion.span key={sets} initial={{ scale: 1.7 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 14 }} className="inline-block text-3xl font-black" style={{ color: planLate ? ZONE_COLOR.red : ZONE_COLOR.green }}>{sets}</motion.span>
                                <span className="block text-xs font-bold text-[#E8D9B8]">{setsWord(sets)} в неделю</span>
                            </div>
                            <button type="button" aria-label="Больше сетов" onClick={() => change(sets + 1)} className="h-11 w-11 rounded-xl border-2 border-b-4 border-[#1E2629] bg-[#3A454B] text-xl font-black text-white active:border-b-0">+</button>
                        </div>
                        <p className="mt-2 text-center text-sm font-bold" style={{ color: planLate ? ZONE_COLOR.red : ZONE_COLOR.green }}>
                            {planLate ? `План только к ${dateRu(plan)}: это после экзамена. Прибавь сетов.` : `План: цель к ${dateRu(plan)}`}
                        </p>
                        {d.setsGoal && <p className="mt-1 text-center text-xs font-bold text-[#9AA7B0]">На этой неделе закрыто сетов: {d.setsThisWeek} из {d.setsGoal}</p>}
                        <button type="button" disabled={planLate || saved === 'saving'} onClick={save}
                            className="mt-3 w-full rounded-xl border-b-4 py-2.5 text-sm font-black text-[#151F24] active:border-b-0 disabled:opacity-40"
                            style={{ background: '#F2C35B', borderBottomColor: '#B8862E' }}>
                            {saved === 'done' ? 'Готово, Баллометр перенастроен!' : 'Применить'}
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

const Modal = ({ d, onClose }: { d: BallometerProps; onClose: () => void }) => createPortal(
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 p-3" onClick={onClose}>
        <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-[#6B5B3A] bg-[#151F23] p-3.5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <BallometerPanel d={d} onClose={onClose} />
        </div>
    </div>,
    document.body,
)

const meterFrom = (d: BallometerProps) => computeMeter({ primary: d.primary, perWeek: d.perWeek, targetTest: d.targetTest, setGain: d.setGain, goalDate: d.goalDateIso ? new Date(d.goalDateIso) : null, now: new Date(d.nowIso) })

// Значок: цветная дуга и оценка. Нажатие открывает окно.
export function BallometerChip({ d, className = '' }: { d: BallometerProps; className?: string }) {
    const [open, setOpen] = useState(false)
    const m = meterFrom(d)
    const c = ZONE_COLOR[m.zone]
    useEffect(() => {
        const on = () => setOpen(true)
        window.addEventListener('ballometer-open', on)
        return () => window.removeEventListener('ballometer-open', on)
    }, [])
    return (
        <>
            <button type="button" aria-label={`${NAME}: ${formatScore(m.score)} из 5`} onClick={() => setOpen(true)}
                className={`inline-flex items-center justify-center gap-1 rounded-xl border-2 border-b-4 bg-[#161F23] px-2 active:border-b-0 ${className}`} style={{ borderColor: c }}>
                <svg viewBox="28 28 144 100" className="h-5 w-7 shrink-0">
                    <path d={arc(-120, 120, 60)} stroke="#3A464E" strokeWidth="16" fill="none" />
                    <path d={arc(-120, Math.max(-119, toAngle(m.score ?? 0)), 60)} stroke={c} strokeWidth="16" fill="none" />
                </svg>
                <span className="text-sm font-black" style={{ color: c }}>{formatScore(m.score)}</span>
            </button>
            {open && <Modal d={d} onClose={() => setOpen(false)} />}
        </>
    )
}

// Карточка для бокового блока (на компьютере): спидометр и короткий итог.
export function BallometerCard({ d }: { d: BallometerProps }) {
    const [open, setOpen] = useState(false)
    const m = meterFrom(d)
    return (
        <>
            <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-3 rounded-xl border-2 border-b-4 border-[#3A464E] bg-[#151F23] p-3 text-left active:border-b-0">
                <BallometerGauge m={m} className="h-20 w-20 shrink-0" />
                <span className="min-w-0 text-sm font-bold leading-snug text-[#E8D9B8]">
                    <b className="block text-base text-white">{NAME}</b>
                    {m.zone === 'new' ? 'Прогревается' : m.needPrimary === 0 ? 'Цель взята' : m.readyDate ? <>Цель {m.targetTest} к <span style={{ color: dateColor(m.readyDate, m.goalDate) }}>{dateShort(m.readyDate)}</span></> : 'Скорость нулевая'}
                    {m.needPrimary > 0 && <span className="block text-xs text-[#9AA7B0]">Сегодня сетов: {d.setsToday} из {Math.max(d.setsToday, setsTodayGoal(d.setsGoal ?? setsForDate(m.needPrimary, m.goalDate, d.setGain, new Date(d.nowIso)), d.setsThisWeek, d.setsToday, new Date(d.nowIso)))}</span>}
                </span>
            </button>
            {open && <Modal d={d} onClose={() => setOpen(false)} />}
        </>
    )
}

const HELLO: Record<Exclude<MeterZone, 'new'>, { src: string; lines: string[] }> = {
    green: { src: '/miguel/miguel-thumbs.webp', lines: ['Боец, Баллометр в зелёной зоне! Идём по плану.', 'Зелёная зона, амиго. Так держать, ¡vamos!'] },
    yellow: { src: '/miguel/miguel-binoculars.webp', lines: ['Боец, Баллометр в жёлтой зоне. Чуть прибавим?', 'Жёлтая зона. Пара сетов, и снова будет зелёная.'] },
    red: { src: '/miguel/miguel-megaphone.webp', lines: ['Тревога, боец! Баллометр в красной зоне. Настроим темп?', 'Красная зона, амиго. Маньяна кончилась, настроим программу!'] },
}
const HELLO_KEY = 'ballometerHello'

// Раз в день Команданте сообщает показание и предлагает открыть прибор.
export function BallometerHello({ d }: { d: BallometerProps }) {
    const m = meterFrom(d)
    const [show, setShow] = useState(false)
    useEffect(() => {
        if (m.zone === 'new' || m.needPrimary === 0) return
        const today = new Date().toDateString()
        try { if (localStorage.getItem(HELLO_KEY) === today) return } catch { return }
        // отмечаем показ только когда он случился: иначе ушёл со страницы раньше — и за день ни разу не увидел
        const t = setTimeout(() => {
            try { localStorage.setItem(HELLO_KEY, today) } catch { /* без памяти покажем ещё раз */ }
            setShow(true)
        }, 1800)
        return () => clearTimeout(t)
    }, [m.zone, m.needPrimary])
    if (!show || m.zone === 'new') return null
    const h = HELLO[m.zone]
    const line = h.lines[new Date().getDate() % h.lines.length]
    return createPortal(
        <motion.div initial={{ opacity: 0, y: 40, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="fixed bottom-4 left-3 right-3 z-[2900] mx-auto flex max-w-md items-end gap-2 rounded-2xl border-2 bg-[#151F23] p-2.5 shadow-xl" style={{ borderColor: ZONE_COLOR[m.zone] }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={h.src} alt="" className="-mt-8 h-20 w-20 shrink-0 object-contain" />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-snug text-[#F2F7FB]">{line}</p>
                <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => { setShow(false); window.dispatchEvent(new Event('ballometer-open')) }}
                        className="rounded-lg border-b-4 px-3 py-1.5 text-xs font-black text-[#151F24] active:border-b-0" style={{ background: '#F2C35B', borderBottomColor: '#B8862E' }}>
                        Открыть Баллометр
                    </button>
                    <button type="button" onClick={() => setShow(false)} className="rounded-lg px-2 py-1.5 text-xs font-bold text-[#9AA7B0]">Позже</button>
                </div>
            </div>
        </motion.div>,
        document.body,
    )
}
