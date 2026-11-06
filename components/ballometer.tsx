'use client'

// components/ballometer.tsx — Баллометр: значок (шапка, угол ангара) и окно со спидометром, дорогой дат,
// «рецептом» и калибровкой. Расчёт — lib/egeMeter.ts, данные ученика — lib/ballometer.ts.
// Раз в день Команданте сообщает показание (BallometerHello).

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { saveBallometerProgram } from '@/actions/ballometer'
import { computeMeter, dateForSets, dateRu, dateShort, EGE_DEADLINE, EGE_EXAM_DATE, formatScore, MAX_SETS_WEEK, METER_GREEN_FROM, METER_YELLOW_FROM, setsForDate, type MeterResult, type MeterZone } from '@/lib/egeMeter'
import { declensionRu } from '@/usefulFunctions'

export type BallometerProps = {
    primary: number
    perWeek: number | null
    targetTest: number
    setGain: number
    goalDateIso: string | null
    setsGoal: number | null
    setsThisWeek: number
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

export const BallometerGauge = ({ m, className = '' }: { m: MeterResult; className?: string }) => (
    <svg viewBox="0 0 200 200" className={className}>
        <circle cx="100" cy="100" r="96" fill="#141B1F" stroke="#6B5B3A" strokeWidth="6" />
        <circle cx="100" cy="100" r="88" fill="#1E282D" />
        <path d={arc(toAngle(0), toAngle(METER_YELLOW_FROM), 74)} stroke={ZONE_COLOR.red} strokeWidth="11" fill="none" />
        <path d={arc(toAngle(METER_YELLOW_FROM), toAngle(METER_GREEN_FROM), 74)} stroke={ZONE_COLOR.yellow} strokeWidth="11" fill="none" />
        <path d={arc(toAngle(METER_GREEN_FROM), toAngle(5), 74)} stroke={ZONE_COLOR.green} strokeWidth="11" fill="none" />
        {[0, 1, 2, 3, 4, 5].map((n) => {
            const a = (toAngle(n) * Math.PI) / 180
            return <text key={n} x={Math.round(100 + 56 * Math.sin(a))} y={Math.round(104 - 56 * Math.cos(a))} textAnchor="middle" fontSize="12" fontWeight="900" fill="#E8D9B8">{n}</text>
        })}
        <text x="100" y="72" textAnchor="middle" fontSize="11" fontWeight="900" fill="#C9B98F">{NAME}</text>
        <g style={{ transform: `rotate(${toAngle(m.score ?? 0)}deg)`, transformOrigin: '100px 100px', transition: 'transform .7s cubic-bezier(.3,1.5,.5,1)' }}>
            <path d="M97 106 L100 34 L103 106 Z" fill={m.zone === 'new' ? ZONE_COLOR.new : '#FF6B4A'} stroke="#1B2327" strokeWidth=".8" />
        </g>
        <circle cx="100" cy="100" r="8" fill="#6B5B3A" stroke="#1B2327" strokeWidth="1.5" />
        <rect x="74" y="130" width="52" height="26" rx="4" fill="#0B1012" stroke="#6B5B3A" />
        <text x="100" y="149" textAnchor="middle" fontSize="19" fontWeight="900" fill={ZONE_COLOR[m.zone]}>{formatScore(m.score)}</text>
    </svg>
)

const dateColor = (d: Date | null, goal: Date) => (!d || d > EGE_EXAM_DATE ? ZONE_COLOR.red : d > goal ? ZONE_COLOR.yellow : ZONE_COLOR.green)

// Подпись над точкой дороги, не вылезает за края.
const roadAlign = (p: number) => (p < 0.18 ? 'translateX(-8%)' : p > 0.82 ? 'translateX(-92%)' : 'translateX(-50%)')

// Дорога дат: сегодня → экзамен и дальше. Точка «ты сейчас» и перетаскиваемый флажок цели.
function DateRoad({ now, ready, plan, goal, onDrag, onDrop }: { now: Date; ready: Date | null; plan: Date | null; goal: Date; onDrag?: (d: Date) => void; onDrop?: () => void }) {
    const end = EGE_EXAM_DATE.getTime() + ROAD_AFTER_EXAM_DAYS * DAY
    const pos = (d: Date) => Math.max(0, Math.min(1, (d.getTime() - now.getTime()) / (end - now.getTime())))
    const trackRef = useRef<HTMLDivElement>(null)
    const dateAt = (clientX: number) => {
        const r = trackRef.current!.getBoundingClientRect()
        return new Date(now.getTime() + Math.max(0.02, Math.min(1, (clientX - r.left) / r.width)) * (end - now.getTime()))
    }
    const examP = pos(EGE_EXAM_DATE), goalP = pos(goal)
    const readyP = ready ? pos(ready) : 1
    const planP = plan ? pos(plan) : null
    const pastRoad = !ready || ready.getTime() > end
    const planColor = plan ? dateColor(plan, EGE_EXAM_DATE) : ZONE_COLOR.green
    return (
        <div className="px-1 pb-10 pt-[68px]">
            <div ref={trackRef} className="relative h-3 rounded-full"
                onPointerDown={onDrag ? (e) => { e.currentTarget.setPointerCapture(e.pointerId); onDrag(dateAt(e.clientX)) } : undefined}
                onPointerMove={onDrag ? (e) => { if (e.buttons || e.pointerType === 'touch') onDrag(dateAt(e.clientX)) } : undefined}
                onPointerUp={onDrop}
                style={{ touchAction: onDrag ? 'none' : undefined, cursor: onDrag ? 'pointer' : undefined, background: `linear-gradient(90deg,${ZONE_COLOR.green} 0 ${goalP * 100}%,${ZONE_COLOR.yellow} 0 ${examP * 100}%,${ZONE_COLOR.red} 0)` }}>
                {/* сегодня */}
                <span className="absolute -left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-[3px] border-[#F2F7FB] bg-[#151F23]" />
                <span className="absolute left-0 top-full mt-2 whitespace-nowrap text-[11px] font-black leading-tight text-[#F2F7FB]">Сегодня<br /><span className="font-bold text-[#9AA7B0]">{dateShort(now)}</span></span>
                {/* экзамен */}
                <span className="absolute -top-1 bottom-[-4px] w-1 -translate-x-1/2 rounded bg-white" style={{ left: `${examP * 100}%` }} />
                <span className="absolute top-full mt-2 whitespace-nowrap text-right text-[11px] font-black leading-tight text-[#F2F7FB]" style={{ left: `${examP * 100}%`, transform: 'translateX(-70%)' }}>Экзамен<br /><span className="font-bold text-[#9AA7B0]">{dateShort(EGE_EXAM_DATE)}</span></span>
                {/* с такой скоростью */}
                <div className="pointer-events-none absolute inset-0" style={{ transform: `translateX(${readyP * 100}%)`, transition: 'transform .6s cubic-bezier(.3,1.5,.5,1)' }}>
                    <span className="absolute -left-2 -top-1 h-5 w-4 rounded-sm border-2 border-[#0B1012]" style={{ background: dateColor(ready, goal) }} />
                </div>
                <span className="pointer-events-none absolute bottom-full mb-1.5 whitespace-nowrap text-[11px] font-black leading-tight" style={{ left: `${readyP * 100}%`, transform: roadAlign(readyP), color: dateColor(ready, goal) }}>
                    Сейчас: {pastRoad ? 'не успеваешь' : dateShort(ready!)}
                </span>
                {/* программа: перетаскиваемый флажок */}
                {planP !== null && (
                    <>
                        <div className="pointer-events-none absolute inset-0" style={{ transform: `translateX(${planP * 100}%)`, transition: 'transform .35s cubic-bezier(.3,1.7,.5,1)' }}>
                            <svg viewBox="0 0 24 40" className="absolute -left-[3px] bottom-[-3px] h-[44px] w-[26px] overflow-visible">
                                <line x1="3" y1="40" x2="3" y2="2" stroke="#F2F7FB" strokeWidth="3" strokeLinecap="round" />
                                <path d="M4 2 L23 9 L4 17 Z" fill={planColor} stroke="#0B1012" strokeWidth="1.5" />
                            </svg>
                        </div>
                        <span className="pointer-events-none absolute whitespace-nowrap text-[11px] font-black" style={{ bottom: 'calc(100% + 42px)', left: `${planP * 100}%`, transform: roadAlign(planP), color: planColor }}>Цель: {dateShort(plan!)}</span>
                    </>
                )}
            </div>
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
    const canSave = plan <= EGE_EXAM_DATE && !demo
    const save = async () => {
        setSaved('saving')
        const r = await saveBallometerProgram(plan.toISOString(), sets)
        setSaved(r.ok ? 'done' : 'idle')
    }
    const planLate = plan > EGE_EXAM_DATE
    const reached = m.needPrimary === 0

    return (
        <div className="w-full">
            <div className="mb-1 flex items-center justify-between">
                <span className="text-lg font-black text-[#F2F7FB]">{NAME}</span>
                {onClose && <button type="button" aria-label="Закрыть" onClick={onClose} className="-mr-1 rounded-lg p-1 text-[#9AA7B0] hover:text-white"><X className="h-5 w-5" /></button>}
            </div>
            <div className="flex items-center gap-3">
                <BallometerGauge m={m} className="h-[132px] w-[132px] shrink-0" />
                <div className="min-w-0 text-sm font-bold leading-snug text-[#E8D9B8]">
                    {reached ? 'Цель уже в кармане. Держи форму!'
                        : m.zone === 'new' ? 'Прибор прогревается. Закрой первый сет, и он покажет твою скорость.'
                        : m.readyDate ? <>С такой скоростью цель <b className="text-white">{m.targetTest}</b> будет взята к <b style={{ color: dateColor(m.readyDate, m.goalDate) }}>{dateRu(m.readyDate)}</b>.</>
                        : <>Сейчас скорость нулевая: цель <b className="text-white">{m.targetTest}</b> не приближается.</>}
                    {!demo && <Link href="/path" className="mt-1 block text-xs font-bold text-[#7FC8F2] underline">Сменить цель в «Моём пути»</Link>}
                </div>
            </div>
            {!reached && (
                <>
                    <DateRoad now={now} ready={m.zone === 'new' ? null : m.readyDate} plan={plan} goal={m.goalDate}
                        onDrag={(date) => change(setsForDate(m.needPrimary, date, d.setGain, now))} />
                    {/* рецепт */}
                    {m.zone !== 'new' && m.addSetsPerWeek > 0 && (
                        <div className="mb-3 rounded-lg border-l-4 px-3 py-2 text-sm font-bold text-[#2B2118]" style={{ borderColor: ZONE_COLOR[m.zone], background: 'linear-gradient(180deg,#F1E4C3,#E6D3A8)' }}>
                            <span className="block text-[10px] font-black uppercase tracking-wide text-[#6B5634]">Рецепт Команданте</span>
                            Прибавь +{m.addSetsPerWeek} {setsWord(m.addSetsPerWeek)} в неделю, и будешь успевать.
                        </div>
                    )}
                    {/* калибровка */}
                    <div className="rounded-xl border-2 border-[#2C3A41] bg-black/20 p-3">
                        <p className="text-xs font-black uppercase tracking-wide text-[#C9B98F]">Калибровка</p>
                        <p className="mt-0.5 text-xs font-bold text-[#9AA7B0]">
                            Двигай флажок цели на дороге или меняй сеты.
                            {d.perWeek !== null && ` Твой темп сейчас: примерно ${Math.round((d.perWeek / d.setGain) * 10) / 10} в неделю.`.replace(/(\d)\.(\d)/, '$1,$2')}
                        </p>
                        <div className="mt-2 flex items-center justify-center gap-3">
                            <button type="button" aria-label="Меньше сетов" onClick={() => change(sets - 1)} className="h-11 w-11 rounded-xl border-2 border-b-4 border-[#1E2629] bg-[#3A454B] text-xl font-black text-white active:border-b-0">−</button>
                            <div className="w-32 text-center">
                                <motion.span key={sets} initial={{ scale: 1.7 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 14 }} className="inline-block text-3xl font-black" style={{ color: planLate ? ZONE_COLOR.red : ZONE_COLOR.green }}>{sets}</motion.span>
                                <span className="block text-xs font-bold text-[#E8D9B8]">{setsWord(sets)} в неделю</span>
                            </div>
                            <button type="button" aria-label="Больше сетов" onClick={() => change(sets + 1)} className="h-11 w-11 rounded-xl border-2 border-b-4 border-[#1E2629] bg-[#3A454B] text-xl font-black text-white active:border-b-0">+</button>
                        </div>
                        <p className="mt-2 text-center text-sm font-bold" style={{ color: planLate ? ZONE_COLOR.red : ZONE_COLOR.green }}>
                            {planLate ? `Цель будет взята только к ${dateRu(plan)}: это после экзамена` : `Цель будет взята к ${dateRu(plan)}`}
                        </p>
                        {d.setsGoal && <p className="mt-1 text-center text-xs font-bold text-[#9AA7B0]">На этой неделе закрыто сетов: {d.setsThisWeek} из {d.setsGoal}</p>}
                        <button type="button" disabled={!canSave || saved === 'saving'} onClick={save}
                            className="mt-3 w-full rounded-xl border-b-4 py-2.5 text-sm font-black text-[#151F24] active:border-b-0 disabled:opacity-40"
                            style={{ background: '#F2C35B', borderBottomColor: '#B8862E' }}>
                            {saved === 'done' ? 'Откалибровано!' : 'Откалибровать'}
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
                </span>
            </button>
            {open && <Modal d={d} onClose={() => setOpen(false)} />}
        </>
    )
}

const HELLO: Record<Exclude<MeterZone, 'new'>, { src: string; lines: string[] }> = {
    green: { src: '/miguel/miguel-thumbs.webp', lines: ['Боец, Баллометр в зелёной зоне! Идём по плану.', 'Зелёная зона, амиго. Так держать, ¡vamos!'] },
    yellow: { src: '/miguel/miguel-binoculars.webp', lines: ['Боец, Баллометр в жёлтой зоне. Чуть прибавим?', 'Жёлтая зона. Пара сетов, и снова будет зелёная.'] },
    red: { src: '/miguel/miguel-megaphone.webp', lines: ['Тревога, боец! Баллометр в красной зоне. Откалибруем?', 'Красная зона, амиго. Маньяна кончилась, настроим программу!'] },
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
