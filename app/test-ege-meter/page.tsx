'use client'

// Проба прибора скорости подготовки: формула lib/egeMeter.ts и 5 вариантов вида. Значения задаются ползунками,
// реальных данных ученика здесь нет. Картинки Leonardo пока не подключены: всё нарисовано кодом.

import { useState } from 'react'
import { computeMeter, EGE_DEFAULT_TARGET, METER_GREEN_FROM, METER_YELLOW_FROM, type MeterResult, type MeterZone } from '@/lib/egeMeter'
import { declensionRu } from '@/usefulFunctions'

const ZONE_COLOR: Record<MeterZone, string> = { green: '#78C93C', yellow: '#F2C35B', red: '#E5533D', new: '#7E8F99' }
const NAMES = ['Баллометр', 'ЕГЭ-метр', 'ГГ-метр', 'ЕГЭнамометр', 'Гусеметр', 'ЕГЭ-спидометр']
const METAL = 'linear-gradient(160deg,#55626A,#2A343A 55%,#1B2327)'

const fmt = (s: number | null) => (s === null ? '–' : s.toFixed(1).replace('.', ','))
const dateRu = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).replace(' г.', ' года')

function verdict(m: MeterResult) {
    if (m.zone === 'new') return 'Прибор прогревается: закрой первый сет, и он покажет скорость'
    if (m.needPrimary === 0) return 'Цель уже в кармане. Держи форму!'
    const when = m.readyDate ? `С такой скоростью цель будет взята к ${dateRu(m.readyDate)}.` : 'Сейчас скорость нулевая, цель не приближается.'
    if (m.zone === 'green') return `${when} ${(m.score ?? 0) >= 5 ? 'Идёшь с запасом!' : 'К экзамену успеваешь, но запаса нет.'}`
    return `${when} Прибавь ${m.addSetsPerWeek} ${declensionRu(m.addSetsPerWeek, 'сет', 'сета', 'сетов')} в неделю, и будешь успевать.`
}

const Bolt = ({ x, y }: { x: number; y: number }) => (
    <g><circle cx={x} cy={y} r="3.2" fill="#8A7A55" stroke="#1B2327" strokeWidth="1" /><line x1={x - 2} y1={y} x2={x + 2} y2={y} stroke="#1B2327" strokeWidth="1" /></g>
)

const arc = (a0: number, a1: number, r: number) => {
    const pt = (a: number) => [100 + r * Math.sin((a * Math.PI) / 180), 100 - r * Math.cos((a * Math.PI) / 180)]
    const [x0, y0] = pt(a0), [x1, y1] = pt(a1)
    return `M${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`
}
const toAngle = (s: number) => -120 + (s / 5) * 240

// A. Круглый спидометр
const Round = ({ m, name }: { m: MeterResult; name: string }) => (
    <svg viewBox="0 0 200 200" className="w-full max-w-[280px]">
        <circle cx="100" cy="100" r="92" fill="#141B1F" stroke="#6B5B3A" strokeWidth="6" />
        <circle cx="100" cy="100" r="85" fill="#1E282D" />
        <Bolt x={22} y={30} /><Bolt x={178} y={30} />
        <path d={arc(toAngle(0), toAngle(METER_YELLOW_FROM), 72)} stroke={ZONE_COLOR.red} strokeWidth="11" fill="none" />
        <path d={arc(toAngle(METER_YELLOW_FROM), toAngle(METER_GREEN_FROM), 72)} stroke={ZONE_COLOR.yellow} strokeWidth="11" fill="none" />
        <path d={arc(toAngle(METER_GREEN_FROM), toAngle(5), 72)} stroke={ZONE_COLOR.green} strokeWidth="11" fill="none" />
        {[0, 1, 2, 3, 4, 5].map((n) => {
            const a = (toAngle(n) * Math.PI) / 180
            return <text key={n} x={100 + 54 * Math.sin(a)} y={104 - 54 * Math.cos(a)} textAnchor="middle" fontSize="12" fontWeight="900" fill="#E8D9B8">{n}</text>
        })}
        <text x="100" y="74" textAnchor="middle" fontSize="10" fontWeight="900" fill="#C9B98F">{name}</text>
        <g style={{ transform: `rotate(${toAngle(m.score ?? 0)}deg)`, transformOrigin: '100px 100px', transition: 'transform .7s cubic-bezier(.3,1.5,.5,1)' }}>
            <path d="M97 106 L100 34 L103 106 Z" fill={m.zone === 'new' ? ZONE_COLOR.new : '#FF6B4A'} stroke="#1B2327" strokeWidth=".8" />
        </g>
        <circle cx="100" cy="100" r="8" fill="#6B5B3A" stroke="#1B2327" strokeWidth="1.5" />
        <rect x="74" y="128" width="52" height="26" rx="4" fill="#0B1012" stroke="#6B5B3A" />
        <text x="100" y="147" textAnchor="middle" fontSize="19" fontWeight="900" fill={ZONE_COLOR[m.zone]}>{fmt(m.score)}</text>
    </svg>
)

// B. Линейная шкала: плашка во всю ширину
const Linear = ({ m, name }: { m: MeterResult; name: string }) => (
    <div className="w-full rounded-xl border-2 p-2.5" style={{ background: METAL, borderColor: '#6B5B3A' }}>
        <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wide text-[#E8D9B8]">{name}</span>
            <span className="rounded bg-[#0B1012] px-2 py-0.5 text-base font-black" style={{ color: ZONE_COLOR[m.zone] }}>{fmt(m.score)}</span>
        </div>
        <div className="relative h-4 overflow-visible rounded-sm" style={{ background: `linear-gradient(90deg,${ZONE_COLOR.red} 0 ${(METER_YELLOW_FROM / 5) * 100}%,${ZONE_COLOR.yellow} 0 ${(METER_GREEN_FROM / 5) * 100}%,${ZONE_COLOR.green} 0)` }}>
            <div className="absolute inset-0" style={{ transform: `translateX(${((m.score ?? 0) / 5) * 100}%)`, transition: 'transform .6s ease' }}>
                <div className="absolute -left-[3px] -top-1 bottom-[-4px] w-1.5 rounded-sm border border-[#0B1012] bg-white shadow" />
            </div>
        </div>
    </div>
)

// C. Маленький значок: для шапки рядом с серией
const Chip = ({ m }: { m: MeterResult }) => (
    <span className="inline-flex items-center gap-1.5 rounded-xl border-2 border-b-4 bg-[#161F23] px-2 py-1" style={{ borderColor: ZONE_COLOR[m.zone] }}>
        <svg viewBox="28 28 144 100" className="h-7 w-9">
            <path d={arc(-120, 120, 60)} stroke="#3A464E" strokeWidth="14" fill="none" />
            <path d={arc(-120, Math.max(-119, toAngle(m.score ?? 0)), 60)} stroke={ZONE_COLOR[m.zone]} strokeWidth="14" fill="none" />
        </svg>
        <span className="text-base font-black" style={{ color: ZONE_COLOR[m.zone] }}>{fmt(m.score)}</span>
    </span>
)

// D. Пять лампочек на панели
const Lamps = ({ m, name }: { m: MeterResult; name: string }) => (
    <div className="w-full rounded-xl border-2 p-3 text-center" style={{ background: METAL, borderColor: '#6B5B3A' }}>
        <div className="mb-2 text-xs font-black uppercase tracking-wide text-[#E8D9B8]">{name}</div>
        <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => {
                const lit = Math.max(0, Math.min(1, (m.score ?? 0) - n + 1))
                return (
                    <span key={n} className="relative h-9 w-9 rounded-full border-2 border-[#0B1012] bg-[#141B1F]">
                        <span className="absolute inset-0.5 rounded-full transition-opacity duration-500" style={{ background: ZONE_COLOR[m.zone], opacity: lit, boxShadow: `0 0 10px ${ZONE_COLOR[m.zone]}` }} />
                    </span>
                )
            })}
        </div>
        <div className="mt-2 text-xl font-black" style={{ color: ZONE_COLOR[m.zone] }}>{fmt(m.score)} из 5</div>
    </div>
)

// E. Вертикальный столбик, как термометр: стоит на стене ангара
const Thermo = ({ m, name }: { m: MeterResult; name: string }) => {
    const part = (m.score ?? 0) / 5
    return (
        <div className="flex items-center gap-3">
            <svg viewBox="0 0 70 190" className="h-44 shrink-0">
                <rect x="24" y="8" width="22" height="150" rx="11" fill="#141B1F" stroke="#6B5B3A" strokeWidth="3" />
                <circle cx="35" cy="165" r="18" fill={ZONE_COLOR[m.zone]} stroke="#6B5B3A" strokeWidth="3" />
                <g style={{ transform: `scaleY(${part})`, transformOrigin: '35px 155px', transition: 'transform .7s ease' }}>
                    <rect x="29" y="15" width="12" height="140" fill={ZONE_COLOR[m.zone]} />
                </g>
                {[0, 1, 2, 3, 4, 5].map((n) => <text key={n} x="56" y={159 - n * 28} fontSize="10" fontWeight="900" fill="#E8D9B8">{n}</text>)}
            </svg>
            <div>
                <div className="text-xs font-black uppercase tracking-wide text-[#C9B98F]">{name}</div>
                <div className="text-3xl font-black" style={{ color: ZONE_COLOR[m.zone] }}>{fmt(m.score)}</div>
            </div>
        </div>
    )
}

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="rounded-2xl border border-[#2C3A41] bg-[#151F23] p-3">
        <h2 className="mb-2 text-xs font-bold text-[#9AA7B0]">{title}</h2>
        <div className="flex justify-center">{children}</div>
    </section>
)

const PRESETS: { label: string; primary: number; perWeek: number | null }[] = [
    { label: 'Летит', primary: 8, perWeek: 1 },
    { label: 'Почти успевает', primary: 8, perWeek: 0.48 },
    { label: 'Сбавил', primary: 8, perWeek: 0.35 },
    { label: 'Стоит', primary: 8, perWeek: 0 },
    { label: 'Новичок', primary: 0, perWeek: null },
]

export default function TestEgeMeterPage() {
    const [primary, setPrimary] = useState(8)
    const [perWeek, setPerWeek] = useState<number | null>(0.48)
    const [target, setTarget] = useState(EGE_DEFAULT_TARGET)
    const [name, setName] = useState(NAMES[0])
    const m = computeMeter({ primary, perWeek, targetTest: target })

    return (
        <main className="mx-auto min-h-screen max-w-xl space-y-3 bg-[#131D22] p-4 text-[#F2F7FB]">
            <h1 className="text-xl font-black">Прибор скорости подготовки: проба</h1>

            <section className="space-y-2 rounded-2xl border border-[#2C3A41] bg-[#151F23] p-3 text-sm">
                <div className="flex flex-wrap gap-1.5">
                    {PRESETS.map((p) => (
                        <button key={p.label} type="button" onClick={() => { setPrimary(p.primary); setPerWeek(p.perWeek) }}
                            className="rounded-lg border-2 border-b-4 border-[#3A464E] bg-[#1C282E] px-2.5 py-1 text-xs font-bold active:border-b-0">{p.label}</button>
                    ))}
                </div>
                <label className="block">Сейчас первичных: <b>{primary}</b>
                    <input type="range" min={0} max={33} step={0.5} value={primary} onChange={(e) => setPrimary(+e.target.value)} className="w-full" /></label>
                <label className="block">Набирает в неделю: <b>{perWeek === null ? 'нет данных' : perWeek.toFixed(2).replace('.', ',')}</b>
                    <input type="range" min={0} max={2} step={0.01} value={perWeek ?? 0} onChange={(e) => setPerWeek(+e.target.value)} className="w-full" /></label>
                <div className="flex flex-wrap items-center gap-1.5">Цель:
                    {[70, 80, 90, 100].map((t) => (
                        <button key={t} type="button" onClick={() => setTarget(t)} className={`rounded-lg border px-2 py-0.5 font-bold ${t === target ? 'border-[#F2C35B] text-[#F2C35B]' : 'border-[#3A464E]'}`}>{t}</button>
                    ))}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">Название:
                    {NAMES.map((n) => (
                        <button key={n} type="button" onClick={() => setName(n)} className={`rounded-lg border px-2 py-0.5 text-xs font-bold ${n === name ? 'border-[#F2C35B] text-[#F2C35B]' : 'border-[#3A464E]'}`}>{n}</button>
                    ))}
                </div>
                <p className="rounded-lg bg-black/25 p-2 text-[#E8D9B8]">
                    Нужно {m.requiredPerWeek.toFixed(2).replace('.', ',')} первичных в неделю до цели {m.targetPrimary}. {verdict(m)}
                </p>
            </section>

            <Card title="A. Круглый спидометр"><Round m={m} name={name} /></Card>
            <Card title="B. Линейная шкала"><Linear m={m} name={name} /></Card>
            <Card title="C. Маленький значок для шапки"><Chip m={m} /></Card>
            <Card title="D. Пять лампочек"><Lamps m={m} name={name} /></Card>
            <Card title="E. Термометр на стене ангара"><Thermo m={m} name={name} /></Card>
        </main>
    )
}
