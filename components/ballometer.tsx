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
import { computeMeter, computeSetMeter, dateForSets, dateRu, dateShort, EGE_EXAM_DATE, formatScore, MAX_SETS_WEEK, needSetsOf, SET_YELLOW_FROM, setsForDate, daysPassedInWeek, type MeterResult, type MeterZone, type SetMeter } from '@/lib/egeMeter'
import { declensionRu } from '@/usefulFunctions'
import { primaryToTest } from '@/lib/egeScale'
import { BellIcon } from '@/components/set-bar'

export type BallometerProps = {
    primary: number
    perWeek: number | null
    targetTest: number
    setGain: number
    goalDateIso: string | null
    setsGoal: number | null
    setsThisWeek: number
    weekEq?: number // сделано на этой неделе в «задачах» (урок = 5, сет = 10)
    days?: number[] // по 7 чисел на неделю, последняя семёрка — эта неделя (пн … вс, по Москве)
    gridStartIso?: string // понедельник первой строки сетки, 'YYYY-MM-DD'
    weekHistory?: number[] // сеты по неделям за полгода, последняя — эта неделя
    setsToday: number
    nowIso: string
}

const NAME = 'Сетометр'
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
const toAngle = (v: number, max: number) => -120 + (Math.min(Math.max(v, 0), max) / max) * 240

// Сетометр — армейский прибор: стрелка — сколько сетов сделано на этой неделе (с понедельника), белая засечка —
// недельная норма. Зоны — «по графику на сегодня» (computeSetMeter): зелёная начинается с того, что должно быть сделано
// к концу вчерашнего дня. Справа — хорошо, как у спидометра. Внизу окошко «2,5» и под ним «из 5 за неделю».
export const BallometerGauge = ({ s: sm, className = '' }: { s: SetMeter; className?: string }) => {
    const { max, need } = sm
    const step = max <= 8 ? 1 : max <= 14 ? 2 : 3
    const ticks: number[] = []
    for (let v = 0; v <= max + 1e-6; v += max <= 8 ? 0.5 : 1) ticks.push(Math.round(v * 10) / 10)
    const labels = ticks.filter((v) => v % step === 0)
    const greenFrom = sm.expected
    const yellowFrom = greenFrom * SET_YELLOW_FROM
    const pt = (v: number, r: number) => {
        const a = (toAngle(v, max) * Math.PI) / 180
        return [Math.round((100 + r * Math.sin(a)) * 100) / 100, Math.round((100 - r * Math.cos(a)) * 100) / 100]
    }
    const needEdge = pt(need, 69), needIn = pt(need, 50)
    return (
        <svg viewBox="0 0 200 200" className={className}>
            {/* корпус — картинка Leonardo (docs/hangar/tools/cut_meter.py), шкала и стрелка кодом */}
            <image href="/meter/gauge.webp" x="0" y="0" width="200" height="200" />
            <path d={arc(-120, 120, 62)} stroke="#12170F" strokeWidth="13" fill="none" />
            {need > 0 && yellowFrom > 0.05 && <path d={arc(-120, toAngle(yellowFrom, max), 62)} stroke={ZONE_COLOR.red} strokeWidth="9" fill="none" />}
            {need > 0 && greenFrom > 0.05 && <path d={arc(toAngle(yellowFrom, max), toAngle(greenFrom, max), 62)} stroke={ZONE_COLOR.yellow} strokeWidth="9" fill="none" />}
            <path d={arc(toAngle(need > 0 ? greenFrom : 0, max), 120, 62)} stroke={ZONE_COLOR.green} strokeWidth="9" fill="none" />
            {ticks.map((v) => {
                const major = v % 1 === 0
                const [x1, y1] = pt(v, 55), [x2, y2] = pt(v, major ? 47 : 51)
                return <line key={v} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E8D9B8" strokeWidth={major ? 2.2 : 1.2} />
            })}
            {labels.map((v) => {
                const [x, y] = pt(v, 38)
                return <text key={v} x={Math.round(x)} y={Math.round(y + 5)} textAnchor="middle" fontSize={max > 9 ? 11 : 13} fill="#E8D9B8" className={stencilFont.className}>{v}</text>
            })}
            {/* засечка «норма недели» */}
            {need > 0 && <line x1={needEdge[0]} y1={needEdge[1]} x2={needIn[0]} y2={needIn[1]} stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />}
            <text x="100" y="84" textAnchor="middle" fontSize="8.5" letterSpacing=".6" fill="#C9B98F" className={stencilFont.className}>СЕТОМЕТР</text>
            <g style={{ transform: `rotate(${toAngle(sm.pace ?? 0, max)}deg)`, transformOrigin: '100px 100px', transition: 'transform .7s cubic-bezier(.3,1.5,.5,1)' }}>
                <path d="M95.5 114 L100 44 L104.5 114 Z" fill={sm.zone === 'new' ? ZONE_COLOR.new : '#E8552F'} stroke="#2B1E14" strokeWidth="1.6" strokeLinejoin="round" />
            </g>
            <circle cx="100" cy="100" r="9" fill="#B08E4E" stroke="#2B1E14" strokeWidth="2" />
            <circle cx="100" cy="100" r="2.4" fill="#2B1E14" />
            <rect x="72" y="124" width="56" height="28" rx="4" fill="#0B1012" stroke="#2B1E14" strokeWidth="3" />
            <rect x="72" y="124" width="56" height="28" rx="4" fill="none" stroke="#C4A765" strokeWidth="1" />
            <text x="100" y="145" textAnchor="middle" fontSize="20" fill={ZONE_COLOR[sm.zone]} className={stencilFont.className}>{formatScore(sm.pace)}</text>
            {/* «из N» — сколько сетов в неделю нужно (колокольчик здесь пробовали — лишний) */}
            <text x="100" y="166" textAnchor="middle" fontSize="9" fill="#E8D9B8" className={stencilFont.className}>ИЗ {need} ЗА НЕДЕЛЮ</text>
        </svg>
    )
}

const dateColor = (d: Date | null, goal: Date) => (!d || d > EGE_EXAM_DATE ? ZONE_COLOR.red : d > goal ? ZONE_COLOR.yellow : ZONE_COLOR.green)

// Карта подготовки: высота и положение дороги на ней.
const MAP_H = 188
const ROUTE_Y = 120
const PLAN_POLE = 114
const FORECAST_POLE = 70
const MAP_EDGE = 40 // сколько на экране занимает нерастянутый край картинки карты
const MAP_SLICE = 110 // тот же край в пикселях файла (public/meter/map.webp)
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const INK = '#3A2A1E'
const r1 = (v: number) => Math.round(v * 10) / 10
const routeY = (p: number) => r1(ROUTE_Y + 5 * Math.sin(p * 7))
const routePath = (p0: number, p1: number) => {
    const n = Math.max(2, Math.ceil((p1 - p0) * 50))
    return Array.from({ length: n + 1 }, (_, i) => { const p = p0 + ((p1 - p0) * i) / n; return `${r1(p * 1000)},${routeY(p)}` }).join(' ')
}

// Геометрия флажков-картинок в px на экране: шапка (навершие + полотнище), древко тянем кодом, остриё снизу.
// FLAG_K — общий масштаб: окно должно влезать в экран телефона, поэтому флажки чуть меньше нарисованных.
const FLAG_K = 0.82
const scaleFlag = <T extends Record<string, number | string>>(f: T) =>
    Object.fromEntries(Object.entries(f).map(([k, v]) => [k, typeof v === 'number' ? Math.round(v * FLAG_K * 10) / 10 : v])) as T
const FLAG = {
    plan: scaleFlag({ base: 'flag-plan', w: 103, h: 60.5, poleX: 6.6, poleW: 10.6, pinW: 12.5, pinH: 18, textL: 12, textR: 78, textT: 13, textB: 58 }),
    forecast: scaleFlag({ base: 'flag-forecast', w: 97, h: 64.5, poleX: 4.8, poleW: 8, pinW: 9.7, pinH: 17, textL: 9, textR: 70, textT: 12, textB: 59 }),
}

// Флажок на карте: остриё в точке дороги, полотнище вправо, а у правого края — влево (отражаем картинку, не текст).
function MapFlag({ kind, src, pole, ink, title, value, flip }: { kind: keyof typeof FLAG; src: string; pole: number; ink: string; title: string; value: string; flip: boolean }) {
    const f = FLAG[kind]
    const textLeft = flip ? f.poleX - f.textR : f.textL - f.poleX
    /* eslint-disable @next/next/no-img-element */
    return (
        <div className="absolute left-0" style={{ top: -pole }}>
            <img src={`/meter/${f.base}-pole.webp`} alt="" draggable={false} className="absolute max-w-none" style={{ left: -f.poleW / 2, top: f.h - 2, width: f.poleW, height: pole - f.h - f.pinH + 4 }} />
            <img src={`/meter/${f.base}-pin.webp`} alt="" draggable={false} className="absolute max-w-none" style={{ left: -f.pinW / 2, top: pole - f.pinH, width: f.pinW, height: f.pinH }} />
            <img src={`/meter/${src}.webp`} alt="" draggable={false} className="absolute max-w-none" style={{ left: flip ? f.poleX - f.w : -f.poleX, top: 0, width: f.w, height: f.h, transform: flip ? 'scaleX(-1)' : undefined }} />
            <div className="absolute flex flex-col items-center justify-center whitespace-nowrap text-center leading-[1.15]" style={{ left: textLeft, width: f.textR - f.textL, top: f.textT, height: f.textB - f.textT, color: ink }}>
                <span className="text-[8px] font-black uppercase tracking-wide opacity-90">{title}</span>
                <span className="font-black" style={{ fontSize: value.length >= 9 ? 8.5 : 10 }}>{value}</span>
            </div>
        </div>
    )
    /* eslint-enable @next/next/no-img-element */
}

// Карта: сегодня → экзамен и дальше. Флажок «Прогноз» показывает, куда придёшь с нынешней скоростью,
// флажок «План» ученик ставит сам: тащит или нажимает на любое место карты.
function DateMap({ now, ready, showForecast, plan, goal, onDrag }: { now: Date; ready: Date | null; showForecast: boolean; plan: Date; goal: Date; onDrag: (d: Date) => void }) {
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
    const planColor = late ? '#C8452F' : '#4E8F2A'
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
        <div className="mt-2">
        {/* подсказка: пока ученик не тронул карту */}
        <div className={`mb-0.5 flex items-center justify-center gap-1 text-[11px] font-black text-[#F1E4C3] transition-opacity duration-300 ${touched ? 'opacity-0' : 'opacity-100'}`}>
            <Hand className="h-3.5 w-3.5" strokeWidth={2.6} />Тащи флажок или нажми на карту
        </div>
        <div ref={mapRef} className="relative select-none overflow-hidden"
            style={{ height: MAP_H, touchAction: 'pan-y', cursor: moved ? 'grabbing' : 'pointer' }}
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
            {/* карта — картинка Leonardo: углы не тянем, середину тянем по ширине и повторяем по высоте */}
            <div className="pointer-events-none absolute inset-0" style={{ boxSizing: 'border-box', borderStyle: 'solid', borderWidth: MAP_EDGE, borderImageSource: 'url(/meter/map.webp)', borderImageSlice: `${MAP_SLICE} fill`, borderImageRepeat: 'stretch round' }} />
            {/* зона после экзамена и маршрут */}
            <svg className="pointer-events-none absolute left-[5%] top-0 h-full w-[90%] overflow-visible" viewBox={`0 0 1000 ${MAP_H}`} preserveAspectRatio="none">
                <rect x={examP * 1000} y="7" width={(1 - examP) * 1000 + 45} height={MAP_H - 14} fill="#B23A32" fillOpacity=".18" />
                <polyline points={routePath(0, greenEnd)} fill="none" stroke="#2B1E14" strokeWidth="9" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <polyline points={routePath(0, greenEnd)} fill="none" stroke="#6DB33F" strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                {greenEnd < examP && <polyline points={routePath(greenEnd, examP)} fill="none" stroke="#5E4A2A" strokeWidth="4" strokeDasharray="8 7" vectorEffect="non-scaling-stroke" />}
                <polyline points={routePath(examP, 1)} fill="none" stroke="#B23A32" strokeWidth="4" strokeDasharray="8 7" vectorEffect="non-scaling-stroke" />
            </svg>
            {/* месяцы */}
            {months.map((mo) => (
                <span key={mo.key} className="pointer-events-none absolute -translate-x-1/2 text-[9px] font-black" style={{ left: `${5 + 90 * mo.p}%`, top: ROUTE_Y + 11, color: '#5A4728' }}>{mo.t}</span>
            ))}
            {/* сегодня */}
            <div className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] bg-[#F2F7FB]" style={{ left: '5%', top: routeY(0), borderColor: INK }} />
            <span className="pointer-events-none absolute left-3 whitespace-nowrap rounded bg-[#EBDCB6]/85 px-1 text-[11px] font-black leading-tight" style={{ top: MAP_H - 40, color: INK }}>Сегодня<br /><span className="font-bold">{dateShort(now)}</span></span>
            {/* экзамен */}
            <span className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${5 + 90 * examP}%`, top: routeY(examP) }}><ExamStar /></span>
            <span className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded bg-[#EBDCB6]/85 px-1 text-center text-[11px] font-black leading-tight" style={{ left: `${5 + 90 * examP}%`, top: MAP_H - 40, color: '#8E2A22' }}>ЕГЭ<br /><span className="font-bold">{dateShort(EGE_EXAM_DATE)}</span></span>
            {/* слой флажков */}
            <div className="pointer-events-none absolute inset-y-0 left-[5%] right-[5%]">
                {hoverP !== null && dragP === null && (
                    <div className="absolute inset-0" style={{ transform: `translate(${hoverP * 100}%, ${routeY(hoverP)}px)` }}>
                        <span className="absolute -left-px w-0.5 border-l-2 border-dashed" style={{ top: -PLAN_POLE, height: PLAN_POLE, borderColor: INK, opacity: 0.5 }} />
                        {/* дата — под линией маршрута: сверху она уезжала за край карты */}
                        <span className="absolute whitespace-nowrap rounded bg-[#3A2A1E] px-1 text-[10px] font-bold text-[#F1E4C3]" style={{ top: 9, left: 0, transform: `translateX(${hoverP < 0.1 ? -10 : hoverP > 0.88 ? -90 : -50}%)` }}>{dateShort(dateOf(hoverP))}</span>
                    </div>
                )}
                {showForecast && (
                    <div className="absolute inset-0" style={{ transform: `translate(${readyP * 100}%, ${routeY(readyP)}px)`, transition: 'transform .6s cubic-bezier(.3,1.5,.5,1)', zIndex: 4 }}>
                        <MapFlag kind="forecast" src={`flag-forecast-${fColor === ZONE_COLOR.green ? 'green' : fColor === ZONE_COLOR.yellow ? 'yellow' : 'red'}`} pole={FORECAST_POLE} ink={INK} flip={readyP > 0.6} title="Прогноз" value={pastRoad ? 'опоздаешь' : dateShort(ready!)} />
                    </div>
                )}
                <div className="absolute inset-0" style={{ transform: `translate(${shownPlanP * 100}%, ${routeY(shownPlanP)}px)`, transition: moved ? 'none' : 'transform .4s cubic-bezier(.3,1.6,.5,1)', zIndex: 3 }}>
                    <div className={`absolute inset-0 ${touched ? '' : 'bm-flag-nudge'}`}>
                        <MapFlag kind="plan" src={late ? 'flag-plan-late' : 'flag-plan'} pole={PLAN_POLE} ink="#FFFFFF" flip={shownPlanP > 0.6} title="★ План" value={dateShort(plan)} />
                        {/* Команданте слева от древка, под полотнищем; у левого края карты — справа, чтобы не обрезался */}
                        <span className="absolute" style={{ top: -PLAN_POLE + FLAG.plan.h + 4, left: shownPlanP < 0.22 ? 7 : -53 }}>
                            <PlanMoodBadge mood={planMoodOf(plan, goal)} />
                        </span>
                        {!touched && <span className="bm-knob-ring absolute -left-5 -top-5 h-10 w-10 rounded-full border-[3px]" style={{ borderColor: planColor }} />}
                        <span className="absolute -left-[15px] -top-[15px] flex h-[30px] w-[30px] items-center justify-center rounded-full border-[3px] bg-[#FFF6E4]" style={{ borderColor: INK, boxShadow: '0 2px 0 rgba(43,30,20,.55)' }}>
                            <MoveHorizontal className="h-4 w-4" strokeWidth={3} style={{ color: INK }} />
                        </span>
                    </div>
                </div>
            </div>
            {/* волна там, куда нажали */}
            {ripple && <span key={ripple.id} onAnimationEnd={() => setRipple(null)} className="bm-ripple pointer-events-none absolute h-12 w-12 rounded-full border-[3px]" style={{ left: ripple.x - 24, top: ripple.y - 24, borderColor: INK }} />}
        </div>
        </div>
    )
}

const ExamStar = () => (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path d="M12 2 L15 9 L22.5 9.6 L16.8 14.4 L18.6 22 L12 17.9 L5.4 22 L7.2 14.4 L1.5 9.6 L9 9 Z" fill="#C8452F" stroke="#2B1E14" strokeWidth="2" strokeLinejoin="round" />
    </svg>
)

// Крупная цель: 90 и справа в две строки «баллов ЕГЭ».
// Верхняя строка окна (решение пользователя 2026-11-06): три ровные колонки в минимальном стиле —
// «Цель 33/100 баллов ЕГЭ», «Эта неделя 1/5 сетов», крупный Команданте. Подпись сверху, крупная дробь, единица снизу.
const TopStat = ({ label, children, unit, href }: { label: string; children: React.ReactNode; unit: string; href?: string }) => {
    const body = (
        <>
            <span className="block text-[10px] font-black uppercase tracking-wide text-[#C9B98F]">{label}</span>
            <span className={`${stencilFont.className} mt-0.5 flex items-baseline whitespace-nowrap leading-none`}>{children}</span>
            <span className="mt-1 block whitespace-nowrap text-[11px] font-bold text-[#9AA7B0]">{unit}</span>
        </>
    )
    return href ? <Link href={href} className="block min-w-0">{body}</Link> : <div className="min-w-0">{body}</div>
}

const GOAL_CHOICES = [60, 70, 80, 90, 100]
// Цель кликабельна: в «Моём пути» раскрывает выбор, в окне Сетометра ведёт в «Мой путь».
const GoalWrap = ({ demo, onClick, children }: { demo?: boolean; onClick?: () => void; children: React.ReactNode }) =>
    onClick ? <button type="button" onClick={onClick} className="block min-w-0 text-left">{children}</button>
        : <Link href={demo ? '#' : '/path'} className="block min-w-0">{children}</Link>

// «/5» — норма недели; при «− / +» в «Мой план» меняется крупным отскоком, чтобы было видно, что меняется и она.
const BouncyTotal = ({ value, color, size, slash = true }: { value: number | string; color: string; size: number; slash?: boolean }) => (
    <motion.span key={String(value)} initial={{ scale: 2.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 12 }}
        className="inline-block origin-left" style={{ color, fontSize: size }}>{slash ? '/' : ''}{value}</motion.span>
)

// Настроение Команданте по показанию прибора. Картинки — public/miguel (промпты — docs/miguel/leonardo-prompts-ballometer.md).
// Если поз несколько, на каждое открытие берётся случайная (выбор уже в браузере, после монтирования).
type Mood = 'chill' | 'calm' | 'mobilize' | 'alarm' | 'angry' | 'new'
const MOOD: Record<Mood, { src: string | string[]; motion: 'bob' | 'shake' | 'jitter' | 'none' }> = {
    chill: { src: '/miguel/miguel-chill.webp', motion: 'bob' }, // шезлонг и коктейль: успеваем раньше срока
    calm: { src: '/miguel/miguel-calm.webp', motion: 'bob' }, // идём по плану
    mobilize: { src: ['/miguel/miguel-mobilize-bucket.webp', '/miguel/miguel-mobilize-box.webp', '/miguel/miguel-mobilize-bugle.webp'], motion: 'jitter' }, // жёлтая: собраться
    alarm: { src: '/miguel/miguel-panic-watch.webp', motion: 'jitter' }, // красная: паника, часы
    angry: { src: '/miguel/miguel-glare.webp', motion: 'shake' }, // почти стоим: злится крупным планом
    new: { src: '/miguel/miguel-think.webp', motion: 'none' },
}
const moodOf = (m: MeterResult): Mood => {
    if (m.needPrimary === 0) return 'chill'
    if (m.zone === 'new' || m.score === null) return 'new'
    if (m.score >= 4.8) return 'chill'
    if (m.zone === 'green') return 'calm'
    if (m.zone === 'yellow') return 'mobilize'
    return m.score >= 1.5 ? 'alarm' : 'angry'
}
const MOOD_MOTION = {
    bob: { animate: { y: [0, -4, 0] }, transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' as const } },
    jitter: { animate: { rotate: [0, -3, 3, -2, 0, 0, 0] }, transition: { duration: 1.4, repeat: Infinity } },
    shake: { animate: { x: [0, -3, 3, -3, 0, 0, 0, 0] }, transition: { duration: 1.2, repeat: Infinity } },
    none: { animate: {}, transition: {} },
}

// Тёмные оттенки цветов зон — для текста на бежевом облачке.
const INK_ON_PAPER: Record<string, string> = { [ZONE_COLOR.green]: '#2F6B1E', [ZONE_COLOR.yellow]: '#8A5A00', [ZONE_COLOR.red]: '#A3271C', [ZONE_COLOR.new]: '#4A5560' }

// Что говорит Команданте. В красной/жёлтой зоне — сколько баллов будет на ЕГЭ с нынешним темпом:
// «на ЕГЭ будет 84 из 90» понятнее, чем «цель к 22 июня 2027 года».
function moodLine(mood: Mood, m: MeterResult, primary: number, perWeek: number | null, now: Date) {
    // облачко бежевое — яркие цвета зон на нём не читаются, берём тёмные оттенки
    const date = m.readyDate ? <b style={{ color: INK_ON_PAPER[dateColor(m.readyDate, m.goalDate)] }}>{dateShort(m.readyDate)}</b> : null
    const add = m.addSetsPerWeek > 0 ? <> Прибавь <b className="whitespace-nowrap rounded-md bg-[#2B2118] px-1.5 py-px text-[#F2C35B]">+{m.addSetsPerWeek} {setsWord(m.addSetsPerWeek)}</b> в неделю.</> : null
    const weeksToExam = Math.max(0, (EGE_EXAM_DATE.getTime() - now.getTime()) / (7 * DAY))
    const examTest = Math.min(m.targetTest, primaryToTest(primary + (perWeek ?? 0) * weeksToExam))
    const atExam = <b style={{ color: mood === 'mobilize' ? INK_ON_PAPER[ZONE_COLOR.yellow] : INK_ON_PAPER[ZONE_COLOR.red] }}>{examTest} из {m.targetTest}</b>
    const early = m.readyDate ? Math.round((EGE_EXAM_DATE.getTime() - m.readyDate.getTime()) / DAY) : 0
    const ahead = early >= 45 ? `за ${Math.round(early / 30)} ${declensionRu(Math.round(early / 30), 'месяц', 'месяца', 'месяцев')} до ЕГЭ` : `за ${Math.max(1, Math.round(early / 7))} ${declensionRu(Math.max(1, Math.round(early / 7)), 'неделю', 'недели', 'недель')} до ЕГЭ`
    switch (mood) {
        case 'chill': return m.needPrimary === 0 ? <>Цель в кармане, амиго. Отдыхаю, но форму держим!</> : <>Чилим, амиго. {m.targetTest} возьмём к {date}, {ahead}.</>
        case 'calm': return <>Идём по плану, боец. {m.targetTest} возьмём к {date}.</>
        case 'mobilize': return <>Собраться, боец! С таким темпом на ЕГЭ будет {atExam}.{add}</>
        case 'alarm': return <>Тревога! На ЕГЭ наберёшь только {atExam}.{add}</>
        case 'angry': return <>Боец! Так на ЕГЭ будет {atExam}.{add ?? ' Закрой сет сегодня.'}</>
        default: return <>Прибор прогревается. Закрой первый сет, и я скажу, успеваем ли.</>
    }
}

const pickMoodSrc = (mood: Mood) => {
    const src = MOOD[mood].src
    return typeof src === 'string' ? src : src[Math.floor(Math.random() * src.length)]
}
// Стикер обрезан по пояс: виден верх картинки (полный рост тратил место). miguel-glare уже нарисован крупно — его целиком.
const BUST_FULL = ['/miguel/miguel-glare.webp']
const MoodBust = ({ src, h, round }: { src: string; h: number; round?: boolean }) => {
    const full = BUST_FULL.includes(src)
    /* eslint-disable-next-line @next/next/no-img-element */
    const img = <img src={src} alt="" draggable={false} className="absolute left-1/2 top-0 max-w-none -translate-x-1/2"
        style={full ? { height: h * (round ? 1.15 : 1), top: round ? 2 : 0 } : { width: h * 1.7, top: h * 0.02 }} />
    return round
        ? <span className="relative block overflow-hidden rounded-full border-[3px] bg-[#F1E4C3]" style={{ width: h, height: h, borderColor: INK, boxShadow: '0 2px 0 rgba(43,30,20,.55)' }}>{img}</span>
        : <span className="relative block overflow-hidden" style={{ width: h * 1.45, height: h }}>{img}</span>
}

// Случайная поза выбранного настроения (выбор уже в браузере, после монтирования).
const useMoodSrc = (mood: Mood) => {
    const [src, setSrc] = useState<string | null>(null)
    useEffect(() => { setSrc(pickMoodSrc(mood)) }, [mood])
    return src
}

const CommandanteMood = ({ mood }: { mood: Mood }) => {
    const mo = MOOD_MOTION[MOOD[mood].motion]
    const src = useMoodSrc(mood)
    return (
        <motion.div key={mood} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 16 }}>
            <motion.div animate={mo.animate} transition={mo.transition}>
                {src ? <MoodBust src={src} h={92} /> : <span className="block h-[92px] w-[133px]" />}
            </motion.div>
        </motion.div>
    )
}

// Настроение плана: насколько спокойно с выбранной датой.
const planMoodOf = (plan: Date, goal: Date): Mood =>
    plan.getTime() <= goal.getTime() - 30 * DAY ? 'chill' : plan <= goal ? 'calm' : plan <= EGE_EXAM_DATE ? 'mobilize' : 'alarm'

// Кружок с Команданте у флажка «План»: тащишь флажок — меняется с отскоком.
const PlanMoodBadge = ({ mood }: { mood: Mood }) => {
    const src = useMoodSrc(mood)
    return (
        <motion.span key={mood} initial={{ scale: 0.2 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 520, damping: 13 }} className="block">
            {src ? <MoodBust src={src} h={46} round /> : <span className="block h-[46px] w-[46px]" />}
        </motion.span>
    )
}

// hideGoal — на «Моём пути» цель уже показана на шкале баллов, здесь её не дублируем.
// onPickGoal — в «Моём пути»: нажатие на цель раскрывает выбор 60…100 прямо здесь (без него цель ведёт в «Мой путь»).
export function BallometerPanel({ d, onClose, demo, hideGoal, onPickGoal }: { d: BallometerProps; onClose?: () => void; demo?: boolean; hideGoal?: boolean; onPickGoal?: (g: number) => void }) {
    const [goalOpen, setGoalOpen] = useState(false)
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
    const mood = moodOf(m)
    const sm = computeSetMeter(weekSetsOf(d), reached ? 0 : sets, now)
    const tone = planLate ? ZONE_COLOR.red : ZONE_COLOR.green
    const weekDone = (d.weekEq ?? d.setsThisWeek * 10) / 10

    return (
        <div className="relative w-full">
            {onClose && <button type="button" aria-label="Закрыть" onClick={onClose} className="absolute -right-1.5 -top-1.5 z-10 rounded-lg p-1 text-[#9AA7B0] hover:text-white"><X className="h-5 w-5" /></button>}
            {/* сверху цель, сегодня и Команданте; ниже прибор и темп */}
            <div className={`grid grid-cols-[auto_auto_minmax(0,1fr)] items-end gap-x-4 ${onClose ? 'pr-5' : ''}`}>
                {!hideGoal && (
                    // подпись над каждым числом своя: «сейчас» над прогнозом, «цель» над целью
                    <GoalWrap demo={demo} onClick={onPickGoal ? () => setGoalOpen((v) => !v) : undefined}>
                        <span className="inline-grid grid-cols-[auto_auto_auto] items-baseline gap-x-1">
                            <span className="text-[10px] font-black uppercase tracking-wide text-[#9AA7B0]">Сейчас</span>
                            <span />
                            <span className="text-[10px] font-black uppercase tracking-wide text-[#C9B98F]">Цель</span>
                            <span className={`${stencilFont.className} mt-0.5 text-[30px] leading-none text-[#F2F7FB]`}>{primaryToTest(d.primary)}</span>
                            <span className={`${stencilFont.className} mt-0.5 text-[20px] leading-none text-[#5C6B73]`}>/</span>
                            <span className={`${stencilFont.className} mt-0.5 text-[24px] leading-none text-[#F2C35B]`}>{m.targetTest}</span>
                        </span>
                        <span className="mt-1 block whitespace-nowrap text-[11px] font-bold text-[#9AA7B0]">{declensionRu(m.targetTest, 'балл', 'балла', 'баллов')} ЕГЭ</span>
                    </GoalWrap>
                )}
                {!reached && (
                    <TopStat label="Эта неделя" unit={setsWord(sets)}>
                        <span className="text-[30px]" style={{ color: sm.zone === 'new' ? '#F2F7FB' : ZONE_COLOR[sm.zone] }}>{fmtSets(weekDone) || '0'}</span>
                        <BouncyTotal value={sets} color="#F2C35B" size={20} />
                    </TopStat>
                )}
                <div className="justify-self-end"><CommandanteMood mood={mood} /></div>
            </div>
            {onPickGoal && goalOpen && (
                <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wide text-[#C9B98F]">Цель:</span>
                    {GOAL_CHOICES.map((g) => (
                        <button key={g} type="button" onClick={() => { onPickGoal(g); setGoalOpen(false) }}
                            className="flex-1 rounded-lg border-2 border-b-4 py-1.5 text-sm font-black active:border-b-0"
                            style={g === m.targetTest ? { background: '#F2C35B', borderColor: '#B8862E', color: '#151F24' } : { background: '#1C282E', borderColor: '#3A464E', color: '#F2F7FB' }}>{g}</button>
                    ))}
                </div>
            )}
            {/* круглый прибор убран (решение пользователя 2026-11-06): он показывал то же «1,3 из 3», что верхняя строка и сетка */}
            {!reached && d.days && <WeekGrid days={d.days} need={sets} now={now} startIso={d.gridStartIso} history={d.weekHistory} />}
            {!reached && (
                // «Мой план»: сколько сетов в неделю ставим себе — это норма в верхней строке и в сетке
                <div className="mt-2 flex items-center gap-2 rounded-xl border-2 border-[#2C3A41] bg-black/20 px-2 py-1.5">
                    <span className="shrink-0 text-[10px] font-black uppercase leading-tight tracking-wide text-[#C9B98F]">Мой<br />план</span>
                    <button type="button" aria-label="Меньше сетов" onClick={() => change(sets - 1)} className="h-9 w-9 shrink-0 rounded-lg border-2 border-b-4 border-[#1E2629] bg-[#3A454B] text-lg font-black leading-none text-white active:border-b-0">−</button>
                    <div className="w-12 shrink-0 text-center leading-none">
                        <motion.span key={sets} initial={{ scale: 1.7 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 14 }} className="inline-block text-2xl font-black" style={{ color: tone }}>{sets}</motion.span>
                        <span className="block text-[10px] font-bold text-[#E8D9B8]">{setsWord(sets)}/нед</span>
                    </div>
                    <button type="button" aria-label="Больше сетов" onClick={() => change(sets + 1)} className="h-9 w-9 shrink-0 rounded-lg border-2 border-b-4 border-[#1E2629] bg-[#3A454B] text-lg font-black leading-none text-white active:border-b-0">+</button>
                    <button type="button" disabled={planLate || saved === 'saving'} onClick={save}
                        className="min-w-0 flex-1 rounded-lg border-b-4 py-2 text-xs font-black text-[#151F24] active:border-b-0 disabled:opacity-40"
                        style={{ background: '#F2C35B', borderBottomColor: '#B8862E' }}>
                        {saved === 'done' ? 'Готово!' : planLate ? 'После экзамена' : 'Применить'}
                    </button>
                </div>
            )}
            {/* реплика Команданте: облачко с хвостиком к нему */}
            <div className="relative mt-2 rounded-xl border-2 bg-[#F1E4C3] px-3 py-1.5 text-[13px] font-bold leading-snug text-[#2B2118]" style={{ borderColor: ZONE_COLOR[m.zone] }}>
                <span className="relative">{moodLine(mood, m, d.primary, d.perWeek, now)}</span>
            </div>
            {!reached && (
                <DateMap now={now} ready={m.readyDate} showForecast={m.zone !== 'new'} plan={plan} goal={m.goalDate}
                    onDrag={(date) => change(setsForDate(m.needPrimary, date, d.setGain, now))} />
            )}
        </div>
    )
}

// Сетка 2 × 7: прошлая и эта неделя по дням (пн … вс). В квадратике — сеты за день (урок = полсета, задача = десятая),
// заливка снизу по доле сета; справа — сумма за неделю и галочка, если норма закрыта (решение пользователя 2026-11-06).
const fmtSets = (v: number) => (v === 0 ? '' : (Math.round(v * 10) / 10).toString().replace('.', ','))
// Под сеткой одной строкой (2026-11-07): серия закрытых недель (как у Strava/GitHub — один пропущенный день её не
// ломает), рекорд недели и сравнение с тем же днём прошлой недели. Норма прошлых недель — нынешняя (истории нет).
const WeekFacts = ({ days, need, now, history }: { days: number[]; need: number; now: Date; history?: number[] }) => {
    const facts: { text: string; color: string }[] = []
    if (history && history.length > 1 && need > 0) {
        const closed = (v: number) => v >= need - 0.05
        let streak = 0
        for (let i = history.length - 2; i >= 0 && closed(history[i]); i--) streak++
        if (closed(history[history.length - 1])) streak++ // эта неделя уже закрыта — тоже в серию
        if (streak > 0) facts.push({ text: `🔥 ${streak} ${declensionRu(streak, 'неделя', 'недели', 'недель')} подряд норма`, color: '#F2C35B' })
        const best = Math.max(...history)
        if (best > 0) facts.push({ text: `🏆 рекорд недели: ${fmtSets(best)}`, color: '#E8D9B8' })
    }
    if (days.length >= 14) {
        const k = daysPassedInWeek(now) + 1 // сколько дней этой недели уже было, считая сегодня
        const thisWeek = days.slice(-7, -7 + k).reduce((a, b) => a + b, 0)
        const lastWeek = days.slice(-14, -14 + k).reduce((a, b) => a + b, 0)
        const diff = Math.round((thisWeek - lastWeek) * 10) / 10
        if (thisWeek > 0 || lastWeek > 0) {
            facts.push(diff > 0 ? { text: `▲ на ${fmtSets(diff)} больше, чем к этому дню прошлой недели`, color: '#78C93C' }
                : diff < 0 ? { text: `▼ на ${fmtSets(-diff)} меньше, чем к этому дню прошлой недели`, color: '#F2C35B' }
                    : { text: 'как к этому дню прошлой недели', color: '#9AA7B0' })
        }
    }
    if (!facts.length) return null
    return (
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 border-t border-[#2C3A41] pt-1.5 text-[11px] font-bold">
            {facts.map((f) => <span key={f.text} style={{ color: f.color }}>{f.text}</span>)}
        </div>
    )
}

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const WeekGrid = ({ days, need, now, startIso, history }: { days: number[]; need: number; now: Date; startIso?: string; history?: number[] }) => {
    const weeks = Math.floor(days.length / 7)
    const today = daysPassedInWeek(now) + (weeks - 1) * 7 // индекс сегодняшнего дня в сетке
    // подпись строки: две последние — «Прошлая/Эта неделя», раньше — дата понедельника («с 13 окт»)
    const labelOf = (w: number) => {
        if (w === weeks - 1) return 'Эта неделя'
        if (w === weeks - 2) return 'Прошлая неделя'
        if (!startIso) return ''
        const mon = new Date(Date.parse(startIso + 'T00:00:00Z') + w * 7 * DAY)
        return `с ${mon.getUTCDate()} ${MONTHS_SHORT[mon.getUTCMonth()]}`
    }
    const rows = Array.from({ length: weeks }, (_, w) => ({ label: labelOf(w), from: w * 7 }))
    return (
        <div className="mt-2 rounded-xl border-2 border-[#2C3A41] bg-black/20 px-2 pb-1.5 pt-1">
            <div className="grid grid-cols-[52px_repeat(7,minmax(0,1fr))_44px] gap-1 text-[10px] font-black uppercase text-[#C9B98F]">
                <span />
                <span className="text-center">Пн</span>
                <span className="col-span-5" />
                <span className="text-center">Вс</span>
                <span className="text-center">Итого</span>
            </div>
            {rows.map((r) => {
                const vals = days.slice(r.from, r.from + 7)
                const sum = vals.reduce((a, b) => a + b, 0)
                const closed = need > 0 && sum >= need - 0.05
                const current = r.from === (weeks - 1) * 7
                return (
                    <div key={r.from} className="mt-1 grid grid-cols-[52px_repeat(7,minmax(0,1fr))_44px] items-center gap-1">
                        <span className="text-[10px] font-bold leading-tight text-[#9AA7B0]">{r.label}</span>
                        {vals.map((v, j) => {
                            const i = r.from + j
                            const future = i > today
                            return (
                                <span key={j} className="relative flex aspect-square items-center justify-center overflow-hidden rounded-md border-2"
                                    style={{ borderColor: i === today ? '#F2F7FB' : future ? '#2C3A41' : '#3E4C54', borderStyle: future ? 'dashed' : 'solid' }}>
                                    {v > 0 && <span className="absolute inset-x-0 bottom-0" style={{ height: `${Math.min(1, v) * 100}%`, background: v >= 1 ? '#78C93C' : 'rgba(120,201,60,0.45)' }} />}
                                    <span className="relative text-[11px] font-black text-white">{fmtSets(v)}</span>
                                </span>
                            )
                        })}
                        <span className="text-center leading-none">
                            <span className={`${stencilFont.className} text-[15px]`} style={{ color: closed ? '#78C93C' : current ? '#F2F7FB' : '#E5533D' }}>{fmtSets(sum) || '0'}</span>
                            {closed ? <span className="block text-[10px] font-bold text-[#9AA7B0]">✓ норма</span>
                                : <span className="block text-[10px] font-bold text-[#9AA7B0]">из <BouncyTotal value={need} color="#F2C35B" size={15} slash={false} /></span>}
                        </span>
                    </div>
                )
            })}
            <WeekFacts days={days} need={need} now={now} history={history} />
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

// Сеты на этой неделе (дробно); null — ученик ещё ничего не решал.
const weekSetsOf = (d: BallometerProps) => (d.perWeek === null ? null : (d.weekEq ?? d.setsThisWeek * 10) / 10)
const setMeterFrom = (d: BallometerProps, m: MeterResult) => computeSetMeter(weekSetsOf(d), needSetsOf(d.setsGoal, m, d.setGain, new Date(d.nowIso)), new Date(d.nowIso))
const meterFrom = (d: BallometerProps) => computeMeter({ primary: d.primary, perWeek: d.perWeek, targetTest: d.targetTest, setGain: d.setGain, goalDate: d.goalDateIso ? new Date(d.goalDateIso) : null, now: new Date(d.nowIso) })

// Значок: цветная дуга и оценка. Нажатие открывает окно.
export function BallometerChip({ d, className = '' }: { d: BallometerProps; className?: string }) {
    const [open, setOpen] = useState(false)
    const m = meterFrom(d)
    const sm = setMeterFrom(d, m)
    const c = ZONE_COLOR[sm.zone]
    useEffect(() => {
        const on = () => setOpen(true)
        window.addEventListener('ballometer-open', on)
        return () => window.removeEventListener('ballometer-open', on)
    }, [])
    return (
        <>
            <button type="button" aria-label={`${NAME}: на этой неделе ${formatScore(sm.pace)} из ${sm.need} сетов`} onClick={() => setOpen(true)}
                className={`inline-flex items-center justify-center gap-1 rounded-xl border-2 border-b-4 bg-[#161F23] px-2 active:border-b-0 ${className}`} style={{ borderColor: c }}>
                <svg viewBox="28 28 144 100" className="h-5 w-7 shrink-0">
                    <path d={arc(-120, 120, 60)} stroke="#3A464E" strokeWidth="16" fill="none" />
                    <path d={arc(-120, Math.max(-119, toAngle(sm.pace ?? 0, sm.max)), 60)} stroke={c} strokeWidth="16" fill="none" />
                </svg>
                <span className="text-sm font-black" style={{ color: c }}>{formatScore(sm.pace)}<span className="text-[11px] text-[#9AA7B0]">/{sm.need}</span></span>
            </button>
            {open && <Modal d={d} onClose={() => setOpen(false)} />}
        </>
    )
}

// Карточка для бокового блока (на компьютере): сеты этой недели (цветом графика, без круглого прибора) и короткий итог.
export function BallometerCard({ d }: { d: BallometerProps }) {
    const [open, setOpen] = useState(false)
    const m = meterFrom(d)
    const sm = setMeterFrom(d, m)
    return (
        <>
            <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-3 rounded-xl border-2 border-b-4 border-[#3A464E] bg-[#151F23] p-3 text-left active:border-b-0">
                <span className={`${stencilFont.className} shrink-0 whitespace-nowrap leading-none`}>
                    <span className="text-[30px]" style={{ color: sm.zone === 'new' ? '#F2F7FB' : ZONE_COLOR[sm.zone] }}>{formatScore(sm.pace)}</span>
                    <span className="text-[18px] text-[#F2C35B]">/{sm.need}</span>
                </span>
                <span className="min-w-0 text-sm font-bold leading-snug text-[#E8D9B8]">
                    <b className="block text-base text-white">{NAME}</b>
                    {m.zone === 'new' ? 'Прогревается' : m.needPrimary === 0 ? 'Цель взята' : m.readyDate ? <>Цель {m.targetTest} к <span style={{ color: dateColor(m.readyDate, m.goalDate) }}>{dateShort(m.readyDate)}</span></> : 'Скорость нулевая'}
                    {m.needPrimary > 0 && <span className="block text-xs text-[#9AA7B0]">сетов на этой неделе</span>}
                </span>
            </button>
            {open && <Modal d={d} onClose={() => setOpen(false)} />}
        </>
    )
}

const HELLO: Record<Exclude<MeterZone, 'new'>, { src: string; lines: string[] }> = {
    green: { src: '/miguel/miguel-calm.webp', lines: ['Боец, Сетометр в зелёной зоне! Идём по плану.', 'Зелёная зона, амиго. Так держать, ¡vamos!'] },
    yellow: { src: '/miguel/miguel-mobilize-bucket.webp', lines: ['Боец, Сетометр в жёлтой зоне. Чуть прибавим?', 'Жёлтая зона. Пара сетов, и снова будет зелёная.'] },
    red: { src: '/miguel/miguel-panic-watch.webp', lines: ['Тревога, боец! Сетометр в красной зоне. Настроим темп?', 'Красная зона, амиго. Маньяна кончилась, настроим программу!'] },
}
const HELLO_KEY = 'ballometerHello'

// Раз в день Команданте сообщает показание и предлагает открыть прибор.
export function BallometerHello({ d }: { d: BallometerProps }) {
    const m = meterFrom(d)
    const zone = setMeterFrom(d, m).zone // как на стрелке Сетометра
    const [show, setShow] = useState(false)
    useEffect(() => {
        if (zone === 'new' || m.needPrimary === 0) return
        const today = new Date().toDateString()
        try { if (localStorage.getItem(HELLO_KEY) === today) return } catch { return }
        // отмечаем показ только когда он случился: иначе ушёл со страницы раньше — и за день ни разу не увидел
        const t = setTimeout(() => {
            try { localStorage.setItem(HELLO_KEY, today) } catch { /* без памяти покажем ещё раз */ }
            setShow(true)
        }, 1800)
        return () => clearTimeout(t)
    }, [zone, m.needPrimary])
    if (!show || zone === 'new') return null
    const h = HELLO[zone]
    const line = h.lines[new Date().getDate() % h.lines.length]
    return createPortal(
        <motion.div initial={{ opacity: 0, y: 40, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="fixed bottom-4 left-3 right-3 z-[2900] mx-auto flex max-w-md items-end gap-2 rounded-2xl border-2 bg-[#151F23] p-2.5 shadow-xl" style={{ borderColor: ZONE_COLOR[zone] }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={h.src} alt="" className="-mt-8 h-20 w-20 shrink-0 object-contain" />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-snug text-[#F2F7FB]">{line}</p>
                <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => { setShow(false); window.dispatchEvent(new Event('ballometer-open')) }}
                        className="rounded-lg border-b-4 px-3 py-1.5 text-xs font-black text-[#151F24] active:border-b-0" style={{ background: '#F2C35B', borderBottomColor: '#B8862E' }}>
                        Открыть Сетометр
                    </button>
                    <button type="button" onClick={() => setShow(false)} className="rounded-lg px-2 py-1.5 text-xs font-bold text-[#9AA7B0]">Позже</button>
                </div>
            </div>
        </motion.div>,
        document.body,
    )
}

// ——— Мини-значок у правого края экрана (над свёрнутой линейкой ЕГЭ) и панель, выезжающая справа ———

// сетов на этой неделе из недельной нормы (тот же знаменатель, что на Сетометре)
const weekOf = (d: BallometerProps, sm: SetMeter) => ({ done: d.setsThisWeek, total: sm.need })
// колокольчик следующего сета: 1-й сет за день — серебряный, 2-й — синий… (как на столе сета)
const bellN = (d: BallometerProps) => Math.min(d.setsToday + 1, 4)

const MiniArc = ({ s: sm, w = 26 }: { s: SetMeter; w?: number }) => (
    <svg viewBox="28 28 144 100" style={{ width: w, height: (w * 100) / 144 }} className="shrink-0">
        <path d={arc(-120, 120, 60)} stroke="#3A464E" strokeWidth="18" fill="none" />
        <path d={arc(-120, Math.max(-119, toAngle(sm.pace ?? 0, sm.max)), 60)} stroke={ZONE_COLOR[sm.zone]} strokeWidth="18" fill="none" />
    </svg>
)
const TodayText = ({ done, total, size = 11 }: { done: number; total: number; size?: number }) => (
    <span className="font-black leading-none" style={{ fontSize: size, color: total > 0 && done >= total ? '#78C93C' : '#F2F7FB' }}>
        {total === 0 ? '✓' : `${done}/${total}`}
    </span>
)

export const BALLOMETER_TAB_VARIANTS = ['Колонка', 'Латунь', 'Широкая', 'Капсула'] as const

// Вкладка: сверху колокольчик и «сегодня сетов 1/3», ниже показание прибора «3,8». Прижата к правому краю экрана.
export function BallometerTab({ d, variant = 0, onClick }: { d: BallometerProps; variant?: number; onClick?: () => void }) {
    const m = meterFrom(d)
    const sm = setMeterFrom(d, m)
    const c = ZONE_COLOR[sm.zone]
    const t = weekOf(d, sm)
    const label = `${NAME}: на этой неделе ${formatScore(sm.pace)} из ${sm.need} сетов`
    // показание: темп и мелко «/3» — сколько нужно в неделю
    const score = <span className={`${stencilFont.className} leading-none`} style={{ color: c }}>{formatScore(sm.pace)}<span className="text-[0.7em] text-[#9AA7B0]">/{sm.need}</span></span>
    if (variant === 1) return (
        // латунный корпус, как у прибора; показание в круглом окошке
        <button type="button" onClick={onClick} aria-label={label}
            className="flex w-[48px] flex-col items-center gap-1 rounded-l-xl border-y-2 border-l-2 border-[#5E4A26] py-1.5 shadow-[-3px_3px_10px_#0007]"
            style={{ background: 'linear-gradient(90deg,#C9A45C,#9A7838 45%,#6E5426)' }}>
            <BellIcon n={bellN(d)} size={22} />
            <TodayText {...t} />
            <span className="mt-0.5 flex h-[40px] w-[40px] items-center justify-center rounded-full border-2 border-[#2B1E14] bg-[#12170F] text-[12px]" style={{ boxShadow: `inset 0 0 0 2px ${c}` }}>{score}</span>
        </button>
    )
    if (variant === 2) return (
        // шире: колокольчик и счёт в строку, под ними дуга с показанием
        <button type="button" onClick={onClick} aria-label={label}
            className="flex w-[58px] flex-col items-center gap-1 rounded-l-xl border-y-2 border-l-2 bg-[#151F23] py-1.5 pl-1 shadow-[-3px_3px_10px_#0007]" style={{ borderColor: c }}>
            <span className="flex items-center gap-0.5"><BellIcon n={bellN(d)} size={18} /><TodayText {...t} /></span>
            <span className="h-px w-9 bg-[#3A464E]" />
            <MiniArc s={sm} w={34} />
            <span className="-mt-1.5 text-[14px]">{score}</span>
        </button>
    )
    if (variant === 3) return (
        // капсула со свечением цвета зоны
        <button type="button" onClick={onClick} aria-label={label}
            className="mr-1 flex w-[42px] flex-col items-center gap-1 rounded-full border-2 bg-[#151F23] px-0.5 py-2" style={{ borderColor: c, boxShadow: `0 0 10px ${c}66, -3px 3px 10px #0007` }}>
            <BellIcon n={bellN(d)} size={20} />
            <TodayText {...t} size={10.5} />
            <span className="h-[2px] w-5 rounded-full" style={{ background: c }} />
            <span className="text-[13px]">{score}</span>
        </button>
    )
    return (
        // колонка в ширину свёрнутой линейки
        <button type="button" onClick={onClick} aria-label={label}
            className="flex w-[38px] flex-col items-center gap-0.5 rounded-l-lg border-y border-l border-[#2C3A41] bg-[#151F23] py-1 shadow-[-3px_3px_10px_#0007]">
            {/* одно число — сетов на этой неделе из нормы; темп только цветом дуги (две дроби рядом путали) */}
            <BellIcon n={bellN(d)} size={18} />
            <span className="text-[7.5px] font-black uppercase leading-none text-[#9AA7B0]">неделя</span>
            <TodayText {...t} size={12} />
            <MiniArc s={sm} />
        </button>
    )
}

// Вкладка у правого края + панель Баллометра, выезжающая справа налево. Портал: fixed внутри анимированных обёрток страницы
// считался бы от обёртки. По умолчанию стоит над свёрнутой линейкой (та по центру экрана высотой ~370px).
export function BallometerSide({ d, variant = 0, bottom = 'calc(50% + 194px)', demo }: { d: BallometerProps; variant?: number; bottom?: string; demo?: boolean }) {
    const [open, setOpenState] = useState(false)
    const [shown, setShown] = useState(false) // содержимое держим после первого открытия: иначе пропадало бы посреди уезжания
    const setOpen = (v: boolean) => { setOpenState(v); if (v) setShown(true) }
    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true) }, [])
    useEffect(() => {
        const on = () => { setOpenState(true); setShown(true) }
        window.addEventListener('ballometer-open', on)
        return () => window.removeEventListener('ballometer-open', on)
    }, [])
    if (!mounted) return null
    return createPortal(
        <>
            <div className="fixed right-0 z-[60]" style={{ bottom }}>
                <BallometerTab d={d} variant={variant} onClick={() => setOpen(true)} />
            </div>
            {open && <div className="fixed inset-0 z-[119] bg-black/50" onClick={() => setOpen(false)} />}
            <div className="fixed inset-y-3 right-0 z-[120] flex w-[min(94vw,430px)] items-center transition-transform duration-300 ease-out"
                style={{ transform: open ? 'translateX(0)' : 'translateX(105%)' }}>
                <div className="max-h-full w-full overflow-y-auto rounded-l-2xl border-y-2 border-l-2 border-[#6B5B3A] bg-[#151F23] p-3.5 shadow-[-6px_0_24px_#000a]">
                    {shown && <BallometerPanel d={d} demo={demo} onClose={() => setOpen(false)} />}
                </div>
            </div>
        </>,
        document.body,
    )
}
