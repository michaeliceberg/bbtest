'use client'

// Тестовая страница «Прогресс раздела вокруг кнопки-номера в ангаре» (без входа в аккаунт).
// Сейчас раздел (например 4 — вероятность) показывает прогресс только после нажатия. Здесь сравниваем варианты, как показать
// процент решённости сразу, 4 уровнями (слева, сверху, справа, снизу), вокруг жёлтой кнопки-номера (KeyBadge в components/hangar-scene.tsx).
// Блоки изначально бледные и закрашиваются по мере решения: каждый блок = 25% раздела, текущий закрашивается частично.
// Выберем вариант — внедрим в ангар. Только transform/opacity, без анимации box-shadow.
import { useState } from 'react'

type Variant = 'bars' | 'ring' | 'corners' | 'pips' | 'frame' | 'under'
const VARIANTS: { id: Variant; title: string; note: string }[] = [
    { id: 'bars', title: 'А. Четыре планки', note: 'Планки по сторонам кнопки, как «заряд» вокруг неё. Самый читаемый при малом размере.' },
    { id: 'ring', title: 'Б. Кольцо из четырёх дуг', note: 'Круг вокруг кнопки, четыре четвертинки; заполняется по часовой от левой точки.' },
    { id: 'corners', title: 'В. Уголки', note: 'Четыре уголка по углам кнопки (как рамка наведения в камере). Самый лёгкий, меньше всего закрывает картинку.' },
    { id: 'pips', title: 'Г. Четыре точки', note: 'Точки-огоньки слева, сверху, справа, снизу. Минимум места, но мелкие.' },
    { id: 'frame', title: 'Д. Рамка-обводка', note: 'Сама рамка кнопки делится на четыре стороны и заливается. Кнопка выглядит цельной.' },
    { id: 'under', title: 'Е. Для сравнения: ряд под кнопкой', note: 'Четыре блока в ряд под кнопкой (не «вокруг», запасной вариант, самый компактный по высоте).' },
]
const FILL = { green: '#78C93C', gold: '#FFD84D', blue: '#53ADEF' }
type FillKey = keyof typeof FILL
const PALE = 'rgba(255,255,255,0.28)'
const PALE_EDGE = 'rgba(0,0,0,0.45)'

/** Сколько заполнено у блока i (0…1) при общем прогрессе p (0…1): блок = 25%. */
const part = (p: number, i: number) => Math.max(0, Math.min(1, p * 4 - i))

/** Блок с частичной заливкой: бледная подложка + цветная полоса, растущая по scale (только transform). */
function Seg({ v, color, vertical, style, className }: { v: number; color: string; vertical?: boolean; style: React.CSSProperties; className?: string }) {
    return (
        <span className={`absolute overflow-hidden rounded-full ${className ?? ''}`} style={{ background: PALE, boxShadow: `0 0 0 1px ${PALE_EDGE}`, ...style }}>
            <span className="absolute inset-0 block rounded-full" style={{ background: color, transform: vertical ? `scaleY(${v})` : `scaleX(${v})`, transformOrigin: vertical ? '50% 100%' : '0 50%', opacity: v > 0 ? 1 : 0 }} />
        </span>
    )
}

/** Кнопка-номер (как KeyBadge в ангаре) с индикатором прогресса вокруг. size — сторона кнопки в px; поле вокруг даёт запас под индикатор. */
type Plate = 'none' | 'blur' | 'dark'
/** Подложка под кнопкой и индикатором: blur — размытие фона под ней + тёмная вуаль; dark — только мягкая тёмная плашка без размытия (дешевле для телефона). */
const plateStyle = (plate: Plate): React.CSSProperties | null =>
    plate === 'blur' ? { background: 'rgba(24,18,12,0.42)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', boxShadow: '0 0 0 1px rgba(255,255,255,0.10)' }
    : plate === 'dark' ? { background: 'rgba(24,18,12,0.62)', boxShadow: '0 0 0 1px rgba(255,255,255,0.08)' } : null

function Badge({ n, p, variant, size = 28, color, plate = 'none' }: { n: number; p: number; variant: Variant; size?: number; color: string; plate?: Plate }) {
    const b = size, t = Math.max(3, Math.round(b * 0.15)), g = Math.max(2, Math.round(b * 0.1)), pad = t + g + 2
    const W = b + pad * 2, H = variant === 'under' ? b + pad + t + g + 4 : b + pad * 2
    const off = pad
    const btn = (
        <span className="absolute flex items-center justify-center rounded-[7px] font-black leading-none"
            style={{ left: off, top: off, width: b, height: b, fontSize: b * 0.55, background: 'linear-gradient(180deg,#FFE58A,#F2C35B)', color: '#3A2A08', boxShadow: '0 2px 0 #B8862E, 0 2px 6px rgba(0,0,0,.45)' }}>
            {n}
        </span>
    )
    let ind: React.ReactNode = null
    if (variant === 'bars') {
        ind = (<>
            <Seg v={part(p, 0)} color={color} vertical style={{ left: off - g - t, top: off + b * 0.1, width: t, height: b * 0.8 }} />
            <Seg v={part(p, 1)} color={color} style={{ left: off + b * 0.1, top: off - g - t, width: b * 0.8, height: t }} />
            <Seg v={part(p, 2)} color={color} vertical style={{ left: off + b + g, top: off + b * 0.1, width: t, height: b * 0.8 }} />
            <Seg v={part(p, 3)} color={color} style={{ left: off + b * 0.1, top: off + b + g, width: b * 0.8, height: t }} />
        </>)
    } else if (variant === 'under') {
        const w = (b - g * 3) / 4
        ind = [0, 1, 2, 3].map((i) => <Seg key={i} v={part(p, i)} color={color} style={{ left: off + i * (w + g), top: off + b + g + 2, width: w, height: t }} />)
    } else if (variant === 'ring') {
        const r = b * 0.5 + g + t / 2 + 2, c = W / 2, gap = 0.1 // доли круга: 4 дуги, начало слева (-180°) по часовой
        const arc = (i: number) => {
            const a0 = Math.PI + (i * Math.PI) / 2 + gap, a1 = Math.PI + ((i + 1) * Math.PI) / 2 - gap
            return `M ${c + r * Math.cos(a0)} ${c + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${c + r * Math.cos(a1)} ${c + r * Math.sin(a1)}`
        }
        ind = (
            <svg className="absolute inset-0" width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" strokeLinecap="round" strokeWidth={t}>
                {[0, 1, 2, 3].map((i) => <path key={`b${i}`} d={arc(i)} stroke={PALE} />)}
                {[0, 1, 2, 3].map((i) => { const v = part(p, i); return v > 0 ? <path key={`f${i}`} d={arc(i)} stroke={color} pathLength={1} strokeDasharray={`${v} 1`} /> : null })}
            </svg>
        )
    } else if (variant === 'corners') {
        const L = b * 0.4, o = g + 1 // длина плеча уголка и отступ от кнопки
        const x0 = off - o - t / 2, y0 = off - o - t / 2, x1 = off + b + o + t / 2, y1 = off + b + o + t / 2
        const d = [
            `M ${x0} ${y0 + L} V ${y0} H ${x0 + L}`, // левый верхний
            `M ${x1 - L} ${y0} H ${x1} V ${y0 + L}`, // правый верхний
            `M ${x1} ${y1 - L} V ${y1} H ${x1 - L}`, // правый нижний
            `M ${x0 + L} ${y1} H ${x0} V ${y1 - L}`, // левый нижний
        ]
        ind = (
            <svg className="absolute inset-0" width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={t}>
                {d.map((s, i) => <path key={`b${i}`} d={s} stroke={PALE} />)}
                {d.map((s, i) => { const v = part(p, i); return v > 0 ? <path key={`f${i}`} d={s} stroke={color} pathLength={1} strokeDasharray={`${v} 1`} /> : null })}
            </svg>
        )
    } else if (variant === 'pips') {
        const d = t + 2, o = g + 1
        const pos = [
            { left: off - o - d, top: off + b / 2 - d / 2 },
            { left: off + b / 2 - d / 2, top: off - o - d },
            { left: off + b + o, top: off + b / 2 - d / 2 },
            { left: off + b / 2 - d / 2, top: off + b + o },
        ]
        ind = pos.map((q, i) => {
            const on = part(p, i) >= 1
            return <span key={i} className="absolute rounded-full" style={{ ...q, width: d, height: d, background: on ? color : PALE, boxShadow: on ? `0 0 0 1px ${PALE_EDGE}, 0 0 6px ${color}` : `0 0 0 1px ${PALE_EDGE}` }} />
        })
    } else if (variant === 'frame') {
        const w = b + g * 2 + t * 2, o = off - g - t
        const L = w - t * 2 - 2 // длина стороны без углов
        ind = (<>
            <Seg v={part(p, 0)} color={color} vertical style={{ left: o, top: o + t + 1, width: t, height: L, borderRadius: 2 }} />
            <Seg v={part(p, 1)} color={color} style={{ left: o + t + 1, top: o, width: L, height: t, borderRadius: 2 }} />
            <Seg v={part(p, 2)} color={color} vertical style={{ left: o + w - t, top: o + t + 1, width: t, height: L, borderRadius: 2 }} />
            <Seg v={part(p, 3)} color={color} style={{ left: o + t + 1, top: o + w - t, width: L, height: t, borderRadius: 2 }} />
        </>)
    }
    const ps = plateStyle(plate)
    return <span className="relative inline-block shrink-0" style={{ width: W, height: H }}>{ps && <span className="absolute rounded-[10px]" style={{ left: 1, top: 1, right: 1, bottom: 1, ...ps }} />}{btn}{ind}</span>
}

// фоны для проверки читаемости: жёлтый пол и прочие места ангара (куски bg.webp) и плоская охра
const HB = (x: number, y: number, z = 320): React.CSSProperties => ({ backgroundImage: 'url(/hangar/bg.webp)', backgroundSize: `${z}%`, backgroundPosition: `${x}% ${y}%` })
const BGS: { name: string; style: React.CSSProperties }[] = [
    { name: 'жёлтый', style: { background: '#D9B25A' } },
    { name: 'пол', style: HB(55, 96) },
    { name: 'стена', style: HB(8, 45) },
    { name: 'окно', style: HB(50, 28) },
    { name: 'ящики', style: HB(92, 80) },
]
const STEPS = [0, 0.1, 0.25, 0.5, 0.75, 1]

export default function Page() {
    const [p, setP] = useState(0.6)
    const [fill, setFill] = useState<FillKey>('green')
    const color = FILL[fill]
    return (
        <div className="min-h-screen bg-[#0F171B] p-4 text-white">
            <div className="mx-auto max-w-3xl">
                <h1 className="text-xl font-black">Прогресс раздела вокруг кнопки</h1>
                <p className="mt-1 text-sm text-[#9AA7B0]">Шесть вариантов, как показать, на сколько процентов решён раздел, ещё до нажатия. Каждый блок это 25% раздела, блоки бледные и закрашиваются по мере решения (текущий блок частично).</p>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold">Решено {Math.round(p * 100)}%
                        <input type="range" min={0} max={100} value={Math.round(p * 100)} onChange={(e) => setP(Number(e.target.value) / 100)} className="w-44" />
                    </label>
                    <div className="flex gap-1.5">
                        {(Object.keys(FILL) as FillKey[]).map((k) => (
                            <button key={k} type="button" onClick={() => setFill(k)} aria-label={`Цвет ${k}`}
                                className={`h-7 w-7 rounded-lg border-b-4 ${fill === k ? 'ring-2 ring-white' : ''}`} style={{ background: FILL[k], borderBottomColor: 'rgba(0,0,0,.35)' }} />
                        ))}
                    </div>
                </div>

                <section className="mt-4 rounded-2xl border-2 border-[#F2C35B] bg-[#161F23] p-3">
                    <div className="text-base font-black">Подложка: уголки (В) и точки (Г)</div>
                    <div className="text-xs font-bold text-[#9AA7B0]">Три подложки под кнопкой и индикатором: без, с размытием фона (backdrop blur) и тёмная плашка без размытия. На разных фонах ангара и на жёлтом. Реальный размер 27px, справа крупно. Ползунок сверху меняет процент.</div>
                    <div className="mt-2 space-y-2">
                        {(['corners', 'pips'] as Variant[]).map((v) => (
                            <div key={v}>
                                <div className="mb-1 text-sm font-black">{v === 'corners' ? 'В. Уголки' : 'Г. Точки'}</div>
                                <div className="grid grid-cols-[auto_repeat(3,1fr)] items-center gap-1.5 text-[11px] font-bold text-[#9AA7B0]">
                                    <span />{(['none', 'blur', 'dark'] as Plate[]).map((pl) => <span key={pl} className="text-center">{pl === 'none' ? 'без подложки' : pl === 'blur' ? 'размытие' : 'тёмная плашка'}</span>)}
                                    {BGS.map((bg) => (
                                        <div key={bg.name} className="contents">
                                            <span className="pr-1">{bg.name}</span>
                                            {(['none', 'blur', 'dark'] as Plate[]).map((pl) => (
                                                <div key={pl} className="flex h-[88px] items-center justify-around overflow-hidden rounded-xl" style={bg.style}>
                                                    <Badge n={4} p={p} variant={v} size={27} color={color} plate={pl} />
                                                    <Badge n={9} p={Math.max(0, p - 0.4)} variant={v} size={27} color={color} plate={pl} />
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-4">
                                    {(['none', 'blur', 'dark'] as Plate[]).map((pl) => (
                                        <div key={pl} className="flex h-[120px] w-[130px] items-center justify-center rounded-xl" style={BGS[0].style}>
                                            <Badge n={4} p={p} variant={v} size={56} color={color} plate={pl} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="mt-4 space-y-3">
                    {VARIANTS.map((v) => (
                        <section key={v.id} className="rounded-2xl border-2 border-[#2A363C] bg-[#161F23] p-3">
                            <div className="text-base font-black">{v.title}</div>
                            <div className="text-xs font-bold text-[#9AA7B0]">{v.note}</div>
                            {/* ступени 0 / 10 / 25 / 50 / 75 / 100% крупно */}
                            <div className="mt-2 flex flex-wrap items-end gap-3">
                                {STEPS.map((s) => (
                                    <div key={s} className="flex flex-col items-center gap-0.5">
                                        <Badge n={4} p={s} variant={v.id} size={44} color={color} />
                                        <span className="text-[11px] font-bold text-[#9AA7B0]">{Math.round(s * 100)}%</span>
                                    </div>
                                ))}
                            </div>
                            {/* реальный размер (27px) на фоне ангара + крупно по ползунку */}
                            <div className="mt-2 flex items-center gap-4">
                                <div className="relative flex h-[84px] w-[160px] items-center justify-around overflow-hidden rounded-xl bg-cover bg-center" style={{ backgroundImage: 'url(/hangar/bg.webp)', backgroundPosition: '30% 70%', backgroundSize: '320%' }}>
                                    <Badge n={4} p={p} variant={v.id} size={27} color={color} />
                                    <Badge n={9} p={Math.max(0, p - 0.35)} variant={v.id} size={27} color={color} />
                                </div>
                                <Badge n={4} p={p} variant={v.id} size={64} color={color} />
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    )
}
