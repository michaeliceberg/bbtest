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

const GAUGE_TICKS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

// Армейский прибор из ангара: латунный корпус с заклёпками, тёмный циферблат, стрелка и окошко с показанием.
export const BallometerGauge = ({ m, className = '' }: { m: MeterResult; className?: string }) => (
    <svg viewBox="0 0 200 200" className={className}>
        {/* корпус — картинка Leonardo (docs/hangar/tools/cut_meter.py), шкала и стрелка кодом */}
        <image href="/meter/gauge.webp" x="0" y="0" width="200" height="200" />
        <path d={arc(toAngle(0), toAngle(5), 62)} stroke="#12170F" strokeWidth="13" fill="none" />
        <path d={arc(toAngle(0), toAngle(METER_YELLOW_FROM), 62)} stroke={ZONE_COLOR.red} strokeWidth="9" fill="none" />
        <path d={arc(toAngle(METER_YELLOW_FROM), toAngle(METER_GREEN_FROM), 62)} stroke={ZONE_COLOR.yellow} strokeWidth="9" fill="none" />
        <path d={arc(toAngle(METER_GREEN_FROM), toAngle(5), 62)} stroke={ZONE_COLOR.green} strokeWidth="9" fill="none" />
        {GAUGE_TICKS.map((n) => {
            const a = (toAngle(n) * Math.PI) / 180
            const r0 = 55, r1 = n % 1 === 0 ? 47 : 51
            const c2 = (v: number) => Math.round(v * 100) / 100
            return <line key={n} x1={c2(100 + r0 * Math.sin(a))} y1={c2(100 - r0 * Math.cos(a))} x2={c2(100 + r1 * Math.sin(a))} y2={c2(100 - r1 * Math.cos(a))} stroke="#E8D9B8" strokeWidth={n % 1 === 0 ? 2.5 : 1.3} />
        })}
        {[0, 1, 2, 3, 4, 5].map((n) => {
            const a = (toAngle(n) * Math.PI) / 180
            return <text key={n} x={Math.round(100 + 38 * Math.sin(a))} y={Math.round(105 - 38 * Math.cos(a))} textAnchor="middle" fontSize="13" fill="#E8D9B8" className={stencilFont.className}>{n}</text>
        })}
        <text x="100" y="84" textAnchor="middle" fontSize="8.5" letterSpacing=".6" fill="#C9B98F" className={stencilFont.className}>БАЛЛОМЕТР</text>
        <g style={{ transform: `rotate(${toAngle(m.score ?? 0)}deg)`, transformOrigin: '100px 100px', transition: 'transform .7s cubic-bezier(.3,1.5,.5,1)' }}>
            <path d="M95.5 114 L100 44 L104.5 114 Z" fill={m.zone === 'new' ? ZONE_COLOR.new : '#E8552F'} stroke="#2B1E14" strokeWidth="1.6" strokeLinejoin="round" />
        </g>
        <circle cx="100" cy="100" r="9" fill="#B08E4E" stroke="#2B1E14" strokeWidth="2" />
        <circle cx="100" cy="100" r="2.4" fill="#2B1E14" />
        <rect x="72" y="124" width="56" height="28" rx="4" fill="#0B1012" stroke="#2B1E14" strokeWidth="3" />
        <rect x="72" y="124" width="56" height="28" rx="4" fill="none" stroke="#C4A765" strokeWidth="1" />
        <text x="100" y="145" textAnchor="middle" fontSize="20" fill={ZONE_COLOR[m.zone]} className={stencilFont.className}>{formatScore(m.score)}</text>
        <text x="100" y="165" textAnchor="middle" fontSize="8.5" fill="#C9B98F" className={stencilFont.className}>ИЗ 5</text>
    </svg>
)

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
const GoalBlock = ({ target, demo }: { target: number; demo?: boolean }) => (
    <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#C9B98F]">Цель</p>
        <div className="flex items-center gap-1.5">
            <span className={`${stencilFont.className} text-[44px] leading-none text-[#F2C35B]`}>{target}</span>
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
        <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wide text-[#C9B98F]">Сегодня</p>
            {total === 0 ? (
                <p className="mt-1 text-sm font-black leading-tight text-[#78C93C]">Норма недели<br />закрыта</p>
            ) : (
                <>
                    <p className="leading-none">
                        <span className={`${stencilFont.className} text-3xl`} style={{ color: complete ? '#78C93C' : '#F2F7FB' }}>{done}</span>
                        <span className="text-sm font-black text-[#E8D9B8]"> из {total} {total % 10 === 1 && total % 100 !== 11 ? 'сета' : 'сетов'}</span>
                    </p>
                    <div className="mt-1 flex gap-1">
                        {Array.from({ length: Math.min(total, 8) }, (_, i) => (
                            <span key={i} className="h-2.5 w-2.5 rounded-[3px] border-2" style={{ borderColor: i < done ? '#78C93C' : '#5C6B73', background: i < done ? '#78C93C' : 'transparent' }} />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

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

// Что говорит Команданте: настроение + факт (дата прогноза или сколько прибавить).
// Что говорит Команданте. В красной/жёлтой зоне — сколько баллов будет на ЕГЭ с нынешним темпом:
// «к ЕГЭ ≈84 из 90» понятнее, чем «цель к 22 июня 2027 года».
function moodLine(mood: Mood, m: MeterResult, primary: number, perWeek: number | null, now: Date) {
    const date = m.readyDate ? <b style={{ color: dateColor(m.readyDate, m.goalDate) }}>{dateShort(m.readyDate)}</b> : null
    const add = m.addSetsPerWeek > 0 ? <> Прибавь <b className="text-[#F2C35B]">+{m.addSetsPerWeek} {setsWord(m.addSetsPerWeek)}</b> в неделю.</> : null
    const weeksToExam = Math.max(0, (EGE_EXAM_DATE.getTime() - now.getTime()) / (7 * DAY))
    const examTest = Math.min(m.targetTest, primaryToTest(primary + (perWeek ?? 0) * weeksToExam))
    const atExam = <b style={{ color: mood === 'mobilize' ? ZONE_COLOR.yellow : ZONE_COLOR.red }}>≈{examTest} из {m.targetTest}</b>
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
        style={full ? { height: h * (round ? 1.15 : 1), top: round ? 2 : 0 } : { width: h * 1.7, top: -h * 0.06 }} />
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
                {src ? <MoodBust src={src} h={78} /> : <span className="block h-[78px] w-[113px]" />}
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
    const mood = moodOf(m)
    const nowRate = d.perWeek !== null ? String(Math.round((d.perWeek / d.setGain) * 10) / 10).replace('.', ',') : null
    const tone = planLate ? ZONE_COLOR.red : ZONE_COLOR.green

    return (
        <div className="relative w-full">
            {onClose && <button type="button" aria-label="Закрыть" onClick={onClose} className="absolute -right-1.5 -top-1.5 z-10 rounded-lg p-1 text-[#9AA7B0] hover:text-white"><X className="h-5 w-5" /></button>}
            {/* сверху цель, сегодня и Команданте; ниже прибор и темп */}
            <div className={`flex items-end justify-between gap-1 ${onClose ? 'pr-5' : ''}`}>
                <GoalBlock target={m.targetTest} demo={demo} />
                {!reached && <TodaySets done={d.setsToday} goal={setsTodayGoal(sets, d.setsThisWeek, d.setsToday, now)} />}
                <CommandanteMood mood={mood} />
            </div>
            <div className="mt-2 grid grid-cols-[148px_minmax(0,1fr)] gap-x-2">
                <BallometerGauge m={m} className="h-[148px] w-[148px] self-center" />
                {!reached ? (
                    <div className="flex flex-col justify-center rounded-xl border-2 border-[#2C3A41] bg-black/20 px-2 py-1.5">
                        <div className="flex items-baseline justify-between gap-1">
                            <span className="text-[10px] font-black uppercase tracking-wide text-[#C9B98F]">Твой темп</span>
                            {nowRate && <span className="text-[10px] font-bold text-[#9AA7B0]">сейчас ≈{nowRate}</span>}
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-1">
                            <button type="button" aria-label="Меньше сетов" onClick={() => change(sets - 1)} className="h-9 w-9 shrink-0 rounded-lg border-2 border-b-4 border-[#1E2629] bg-[#3A454B] text-lg font-black leading-none text-white active:border-b-0">−</button>
                            <div className="min-w-0 text-center leading-none">
                                <motion.span key={sets} initial={{ scale: 1.7 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 14 }} className="inline-block text-2xl font-black" style={{ color: tone }}>{sets}</motion.span>
                                <span className="block text-[10px] font-bold text-[#E8D9B8]">{setsWord(sets)}/нед</span>
                            </div>
                            <button type="button" aria-label="Больше сетов" onClick={() => change(sets + 1)} className="h-9 w-9 shrink-0 rounded-lg border-2 border-b-4 border-[#1E2629] bg-[#3A454B] text-lg font-black leading-none text-white active:border-b-0">+</button>
                        </div>
                        <button type="button" disabled={planLate || saved === 'saving'} onClick={save}
                            className="mt-1.5 w-full rounded-lg border-b-4 py-1.5 text-xs font-black text-[#151F24] active:border-b-0 disabled:opacity-40"
                            style={{ background: '#F2C35B', borderBottomColor: '#B8862E' }}>
                            {saved === 'done' ? 'Готово!' : planLate ? 'После экзамена' : 'Применить'}
                        </button>
                    </div>
                ) : <div />}
            </div>
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
    green: { src: '/miguel/miguel-calm.webp', lines: ['Боец, Баллометр в зелёной зоне! Идём по плану.', 'Зелёная зона, амиго. Так держать, ¡vamos!'] },
    yellow: { src: '/miguel/miguel-mobilize-bucket.webp', lines: ['Боец, Баллометр в жёлтой зоне. Чуть прибавим?', 'Жёлтая зона. Пара сетов, и снова будет зелёная.'] },
    red: { src: '/miguel/miguel-panic-watch.webp', lines: ['Тревога, боец! Баллометр в красной зоне. Настроим темп?', 'Красная зона, амиго. Маньяна кончилась, настроим программу!'] },
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

// ——— Мини-значок у правого края экрана (над свёрнутой линейкой ЕГЭ) и панель, выезжающая справа ———

const todayOf = (d: BallometerProps, m: MeterResult) => {
    const now = new Date(d.nowIso)
    const goal = setsTodayGoal(d.setsGoal ?? setsForDate(m.needPrimary, m.goalDate, d.setGain, now), d.setsThisWeek, d.setsToday, now)
    return { done: d.setsToday, total: Math.max(goal, d.setsToday) }
}
// колокольчик следующего сета: 1-й сет за день — серебряный, 2-й — синий… (как на столе сета)
const bellN = (d: BallometerProps) => Math.min(d.setsToday + 1, 4)

const MiniArc = ({ m, w = 26 }: { m: MeterResult; w?: number }) => (
    <svg viewBox="28 28 144 100" style={{ width: w, height: (w * 100) / 144 }} className="shrink-0">
        <path d={arc(-120, 120, 60)} stroke="#3A464E" strokeWidth="18" fill="none" />
        <path d={arc(-120, Math.max(-119, toAngle(m.score ?? 0)), 60)} stroke={ZONE_COLOR[m.zone]} strokeWidth="18" fill="none" />
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
    const c = ZONE_COLOR[m.zone]
    const t = todayOf(d, m)
    const label = `${NAME}: ${formatScore(m.score)} из 5, сегодня сетов ${t.done} из ${t.total}`
    const score = <span className={`${stencilFont.className} leading-none`} style={{ color: c }}>{formatScore(m.score)}</span>
    if (variant === 1) return (
        // латунный корпус, как у прибора; показание в круглом окошке
        <button type="button" onClick={onClick} aria-label={label}
            className="flex w-[42px] flex-col items-center gap-1 rounded-l-xl border-y-2 border-l-2 border-[#5E4A26] py-1.5 shadow-[-3px_3px_10px_#0007]"
            style={{ background: 'linear-gradient(90deg,#C9A45C,#9A7838 45%,#6E5426)' }}>
            <BellIcon n={bellN(d)} size={22} />
            <TodayText {...t} />
            <span className="mt-0.5 flex h-[32px] w-[32px] items-center justify-center rounded-full border-2 border-[#2B1E14] bg-[#12170F] text-[12px]" style={{ boxShadow: `inset 0 0 0 2px ${c}` }}>{score}</span>
        </button>
    )
    if (variant === 2) return (
        // шире: колокольчик и счёт в строку, под ними дуга с показанием
        <button type="button" onClick={onClick} aria-label={label}
            className="flex w-[58px] flex-col items-center gap-1 rounded-l-xl border-y-2 border-l-2 bg-[#151F23] py-1.5 pl-1 shadow-[-3px_3px_10px_#0007]" style={{ borderColor: c }}>
            <span className="flex items-center gap-0.5"><BellIcon n={bellN(d)} size={18} /><TodayText {...t} /></span>
            <span className="h-px w-9 bg-[#3A464E]" />
            <MiniArc m={m} w={34} />
            <span className="-mt-1.5 text-[14px]">{score}</span>
        </button>
    )
    if (variant === 3) return (
        // капсула со свечением цвета зоны
        <button type="button" onClick={onClick} aria-label={label}
            className="mr-1 flex w-[38px] flex-col items-center gap-1 rounded-full border-2 bg-[#151F23] px-0.5 py-2" style={{ borderColor: c, boxShadow: `0 0 10px ${c}66, -3px 3px 10px #0007` }}>
            <BellIcon n={bellN(d)} size={20} />
            <TodayText {...t} size={10.5} />
            <span className="h-[2px] w-5 rounded-full" style={{ background: c }} />
            <span className="text-[13px]">{score}</span>
        </button>
    )
    return (
        // колонка в ширину свёрнутой линейки
        <button type="button" onClick={onClick} aria-label={label}
            className="flex w-[34px] flex-col items-center gap-1 rounded-l-lg border-y border-l border-[#2C3A41] bg-[#151F23] py-1.5 shadow-[-3px_3px_10px_#0007]">
            <BellIcon n={bellN(d)} size={20} />
            <TodayText {...t} size={10.5} />
            <span className="h-px w-5 bg-[#3A464E]" />
            <MiniArc m={m} />
            <span className="-mt-1 text-[12px]">{score}</span>
        </button>
    )
}

// Вкладка у правого края + панель Баллометра, выезжающая справа налево. Портал: fixed внутри анимированных обёрток страницы
// считался бы от обёртки. По умолчанию стоит над свёрнутой линейкой (та по центру экрана высотой ~370px).
export function BallometerSide({ d, variant = 0, bottom = 'calc(50% + 196px)', demo }: { d: BallometerProps; variant?: number; bottom?: string; demo?: boolean }) {
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
