'use client'

// Макет «Сета» — порции на один заход по одному разделу ЕГЭ (метафора ресторана):
// закуска (тренажёр) → основное (микс задач разных видов раздела) → десерт (награда и «сытость»).
// Полоска-мини-карта сверху → по нажатию карточка сета (микс вариантов 1 и 3 с /test-mission)
// → после сета экран «сытости» с анонсом следующего сета. Данные выдуманные, ничего не сохраняется.

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronDown, ChevronRight, Lock, Radar, RotateCcw } from 'lucide-react'

const SET = {
    task: 7,
    taskTitle: 'Уравнения',
    starter: 'Логарифмические уравнения',
    // все виды задания №7; mix — какие из них подаём в этом сете
    kinds: ['Квадратные', 'С корнем', 'Показательные', 'Логарифмические', 'Тригонометрические', 'Дробные'],
    mix: [0, 1, 2, 3, 3, 1], // 6 задач: по видам
    knownBefore: [] as number[],
    next: ['тригонометрические', 'дробные'],
}
const CHEST = '/chests/myth0001.svg'
const DISHES = ['Закуска', 'Основное', 'Десерт']
const kindsInSet = Array.from(new Set(SET.mix))

type S = { starterDone: boolean; solved: number }
const dishIndex = (s: S) => (!s.starterDone ? 0 : s.solved < SET.mix.length ? 1 : 2)

function shout(s: S) {
    const d = dishIndex(s)
    if (d === 0) return `Сет дня, компаньеро! Три блюда — и задание №${SET.task} станет твоим 🍽`
    const left = SET.mix.length - s.solved
    if (left === 1) return 'Последняя задача — и десерт твой! 🔥'
    if (left === 2) return 'Последние 2 задачи — и десерт твой! 🔥'
    return `Основное блюдо: ${SET.mix.length} задач, ${kindsInSet.length} разных вида — пробуем №${SET.task} со всех сторон`
}

// ── Полоска-мини-карта (висит сверху на /trainer и в задачнике) ─────────────────────────
function Strip({ s, open, onToggle }: { s: S; open: boolean; onToggle: () => void }) {
    const d = dishIndex(s)
    return (
        <button onClick={onToggle} className="flex w-full items-center gap-2.5 rounded-2xl border-2 border-[#2A363C] bg-[#0F171B] px-3 py-2">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#163322]">
                <Radar className="h-5 w-5 text-[#9EE8B0]" />
                <span className="absolute inset-0 animate-ping rounded-full border-2 border-[#78C93C] opacity-40" />
            </span>
            <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-black text-[#F2F7FB]">Сет: задание №{SET.task}</span>
                <span className="block text-xs font-bold text-[#9EE8B0]">{d < 2 ? `Блюдо ${d + 1} из 3 · ${DISHES[d]}` : 'Десерт ждёт тебя 🍰'}</span>
            </span>
            <span className="flex items-center gap-1">
                {DISHES.map((_, i) => (
                    <span key={i} className="h-2.5 w-2.5 rounded-full" style={{ background: i < d ? '#78C93C' : i === d ? '#F2C35B' : '#26333B' }} />
                ))}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={CHEST} alt="" className={`h-7 w-7 ${d === 2 ? 'animate-bounce' : ''}`} />
            <ChevronDown className={`h-4 w-4 text-[#6B7A83] transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
    )
}

// ── Карточка сета: Команданте + тропинка из трёх блюд (рядом светло, дальше туман) ─────
// ── Варианты оформления стикера гуся (картинка без обводки + CSS) ─────────────────────
const GOOSE = '/miguel/miguel-megaphone-nooutline.webp'
const GOOSE_STYLES: { id: string; title: string }[] = [
    { id: 'plain', title: 'Без обводки' },
    { id: 'shadow', title: 'Тень под ногами' },
    { id: 'drop', title: 'Мягкая тень' },
    { id: 'black', title: 'Чёрная обводка' },
    { id: 'thinwhite', title: 'Тонкая белая' },
    { id: 'pop3d', title: '3D: толщина' },
    { id: 'glow', title: 'Свечение сзади' },
    { id: 'drop+shadow', title: 'Мягкая + тень' },
    { id: 'black+shadow', title: 'Чёрная + тень' },
    { id: 'black+drop+shadow', title: 'Чёрная + мягкая + тень' },
    { id: 'badge', title: 'Из круга' },
    { id: 'badge+shadow', title: 'Круг + тень' },
    { id: 'badge+drop', title: 'Круг + мягкая' },
    { id: 'badge+drop+shadow', title: 'Круг + мягкая + тень' },
    { id: 'badge+black', title: 'Круг + чёрная' },
    { id: 'badge+black+shadow', title: 'Круг + чёрная + тень' },
    { id: 'badge+black+drop+shadow', title: 'Круг + чёрная + мягкая + тень' },
]
// Чёрная обводка — готовая картинка (ровный скруглённый контур), CSS-обводка из 4 теней давала острые зубцы
const GOOSE_BLACK = '/miguel/miguel-megaphone-black.webp'
const DROP = 'drop-shadow(0 6px 6px rgba(0,0,0,.6))'
const FeetShadow = ({ strong = false }: { strong?: boolean }) => (
    <span className="absolute bottom-[3%] left-1/2 h-[16%] w-[75%] -translate-x-1/2 rounded-[50%]"
        style={{ background: `radial-gradient(closest-side, rgba(0,0,0,${strong ? 0.75 : 0.9}), rgba(0,0,0,0))` }} />
)
// Вариант — набор флагов через «+»: badge (золотой круг), black (чёрная обводка), drop (мягкая тень), shadow (тень под ногами).
// Порядок слоёв: круг → тень под ногами (на круге) → гусь.
function GooseSticker({ variant, size = 64 }: { variant: string; size?: number }) {
    const f = new Set(variant.split('+'))
    const src = f.has('black') ? GOOSE_BLACK : GOOSE
    const sz = { width: size, height: size }
    if (f.has('thinwhite')) return (
        // eslint-disable-next-line @next/next/no-img-element
        <span className="relative shrink-0" style={sz}><img src={GOOSE} alt="" className="h-full w-full object-contain" style={{ filter: 'drop-shadow(1.5px 0 0 #fff) drop-shadow(-1.5px 0 0 #fff) drop-shadow(0 1.5px 0 #fff) drop-shadow(0 -1.5px 0 #fff)' }} /></span>
    )
    if (f.has('pop3d')) return (
        // eslint-disable-next-line @next/next/no-img-element
        <span className="relative shrink-0" style={{ ...sz, transform: 'rotate(-4deg)' }}><img src={GOOSE} alt="" className="h-full w-full object-contain" style={{ filter: 'drop-shadow(1px 1.5px 0 #6B5A3A) drop-shadow(1px 1.5px 0 #5A4A2E) drop-shadow(1px 1.5px 0 #4A3C24) drop-shadow(1px 1.5px 0 #3A2E1A) drop-shadow(0 8px 6px rgba(0,0,0,.6))' }} /></span>
    )
    const goose = (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" draggable={false} className="relative h-full w-full object-contain"
            style={{ filter: f.has('drop') ? DROP : undefined, transform: f.has('badge') ? 'translateY(-6%) scale(1.05)' : undefined }} />
    )
    return (
        <span className="relative shrink-0" style={sz}>
            {f.has('glow') && <span className="absolute inset-[-14%] rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(242,195,91,.45), rgba(242,195,91,0))' }} />}
            {f.has('badge') && <span className="absolute inset-x-[4%] bottom-0 top-[22%] rounded-full border-b-4" style={{ background: 'linear-gradient(180deg,#F2C35B,#C9971C)', borderBottomColor: '#8C6A14' }} />}
            {f.has('badge') ? (
                <span className="absolute inset-0 overflow-hidden" style={{ clipPath: 'inset(-40% 0 0 0 round 0 0 999px 999px)' }}>
                    {f.has('shadow') && <FeetShadow strong />}
                    {goose}
                </span>
            ) : (
                <>{f.has('shadow') && <FeetShadow />}{goose}</>
            )}
        </span>
    )
}

function SetCard({ s, onStep, goose = 'plain' }: { s: S; onStep: () => void; goose?: string }) {
    const d = dishIndex(s)
    const tile = (i: number) => {
        const ok = i < d
        const cur = i === d
        const far = i > d
        return { ok, cur, far, style: { borderColor: ok ? '#3D8A55' : cur ? '#F2C35B' : '#2A363C', background: ok ? '#163322' : cur ? '#2A2410' : '#0F171B', boxShadow: cur ? '0 0 18px 2px rgba(242,195,91,.35)' : undefined } }
    }
    const t0 = tile(0), t1 = tile(1), t2 = tile(2)
    const here = (on: boolean) => on && (
        <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 1, repeat: Infinity }}
            className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#F2C35B] px-1.5 text-[10px] font-black text-[#3A2A08]">ты здесь</motion.span>
    )
    return (
        <div className="rounded-2xl border-2 border-[#4A3A14] bg-[#151F23] p-3.5">
            <div className="flex items-start gap-3">
                <GooseSticker variant={goose} />
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-wider text-[#F2C35B]">Сет дня · задание №{SET.task}</p>
                    <p className="text-lg font-black leading-tight text-[#F2F7FB]">{SET.taskTitle}</p>
                    <p className="mt-1 text-sm font-bold leading-snug text-[#E8D9B8]">{shout(s)}</p>
                </div>
            </div>

            <div className="mt-4 flex items-stretch gap-1.5">
                {/* закуска */}
                <div className="relative flex flex-1 flex-col">
                    {here(t0.cur)}
                    <div className={`flex h-full flex-col items-center gap-1 rounded-xl border-2 p-2 text-center ${t0.far ? 'opacity-35' : ''}`} style={t0.style}>
                        <span className="text-[10px] font-black uppercase text-[#9AA7B0]">Закуска</span>
                        <span className="text-[11px] font-bold leading-tight text-[#C9D3D9]">Тренажёр: {SET.starter}</span>
                        {t0.ok && <Check className="mt-auto h-4 w-4 text-[#9EE8B0]" strokeWidth={3.5} />}
                    </div>
                </div>
                {/* основное — микс */}
                <div className="relative flex flex-[1.3] flex-col">
                    {here(t1.cur)}
                    <div className={`flex h-full flex-col items-center gap-1 rounded-xl border-2 p-2 text-center ${t1.far ? 'opacity-35' : ''}`} style={t1.style}>
                        <span className="text-[10px] font-black uppercase text-[#9AA7B0]">Основное</span>
                        <span className="text-[11px] font-bold leading-tight text-[#C9D3D9]">{t1.far ? '???' : `Микс: ${SET.mix.length} задач`}</span>
                        <span className="mt-auto flex gap-1">
                            {SET.mix.map((_, k) => (
                                <span key={k} className="h-2.5 w-2.5 rounded-full border-b-2"
                                    style={k < s.solved ? { background: '#78C93C', borderBottomColor: '#4F8A24' } : { background: '#26333B', borderBottomColor: '#1B252A' }} />
                            ))}
                        </span>
                        {t1.far && <Lock className="h-3.5 w-3.5 text-[#6B7A83]" />}
                    </div>
                </div>
                {/* десерт */}
                <div className="relative flex flex-1 flex-col">
                    {here(t2.cur)}
                    <div className={`flex h-full flex-col items-center justify-center gap-1 rounded-xl border-2 p-2 text-center ${t2.far ? 'opacity-50' : ''}`} style={t2.style}>
                        <span className="text-[10px] font-black uppercase text-[#9AA7B0]">Десерт</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={CHEST} alt="" className={`h-10 w-10 ${t2.cur ? 'animate-bounce' : 'grayscale'}`} />
                    </div>
                </div>
            </div>

            {/* виды в этом сете — видно, что задание №7 подают с разных сторон */}
            {d >= 1 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {kindsInSet.map((k) => {
                        const doneK = SET.mix.slice(0, s.solved).includes(k)
                        return (
                            <span key={k} className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-black ${doneK ? 'bg-[#163322] text-[#9EE8B0]' : 'bg-[#0F171B] text-[#9AA7B0]'}`}>
                                {doneK && <Check className="h-3 w-3" strokeWidth={3.5} />}{SET.kinds[k]}
                            </span>
                        )
                    })}
                </div>
            )}

            <button onClick={onStep}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-b-4 py-2.5 text-sm font-black text-[#16240C] active:border-b-0"
                style={{ background: d === 2 ? 'linear-gradient(180deg,#FFD84D,#F2C35B)' : '#78C93C', borderBottomColor: d === 2 ? '#B8862E' : '#60A12F' }}>
                {d === 0 ? `Закуска: ${SET.starter}` : d === 1 ? `Задача ${s.solved + 1} из ${SET.mix.length} · ${SET.kinds[SET.mix[s.solved]]}` : 'Забрать десерт 🍰'}
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    )
}

// ── Экран «сытости» после сета ─────────────────────────────────────────────────────────
function FullScreen({ onClose }: { onClose: () => void }) {
    const mastered = new Set([...SET.knownBefore, ...SET.mix])
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="w-full max-w-md rounded-3xl border-2 border-[#4A3A14] bg-[#151F23] p-5 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/miguel/miguel-victory.webp" alt="" className="mx-auto h-28 w-28 object-contain" />
                <p className="mt-1 text-2xl font-black text-[#FFE58A]">Сет съеден! 😋</p>
                <p className="mt-1 text-sm font-bold text-[#C9D3D9]">Задание №{SET.task} «{SET.taskTitle}» — ты попробовал его со всех сторон</p>

                <div className="mt-4 rounded-2xl bg-[#0F171B] p-3 text-left">
                    <p className="text-xs font-black uppercase tracking-wide text-[#9AA7B0]">Виды задания №{SET.task}: {mastered.size} из {SET.kinds.length}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {SET.kinds.map((k, i) => (
                            <span key={k} className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-black ${mastered.has(i) ? 'bg-[#163322] text-[#9EE8B0]' : 'bg-[#1B252A] text-[#6B7A83]'}`}>
                                {mastered.has(i) ? <Check className="h-3.5 w-3.5" strokeWidth={3.5} /> : <Lock className="h-3.5 w-3.5" />}{k}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-1.5 text-[11px] font-black leading-tight text-[#E8D9B8]">
                    <span className="flex flex-col items-center gap-1 rounded-lg bg-[#0F171B] p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={CHEST} alt="" className="h-8 w-8" />Мифический кейс
                    </span>
                    <span className="flex flex-col items-center justify-center gap-1 rounded-lg bg-[#0F171B] p-2"><span className="text-xl leading-none">🐷</span>+0,4 балла в копилку</span>
                    <span className="flex flex-col items-center justify-center gap-1 rounded-lg bg-[#0F171B] p-2"><span className="text-xl leading-none">🔧</span>Компьютер почти починен</span>
                </div>

                <p className="mt-4 rounded-xl border-2 border-dashed border-[#4A3A14] p-2.5 text-sm font-bold text-[#F2C35B]">
                    🍽 В следующем сете подадим: {SET.next.join(' и ')} уравнения
                </p>
                <p className="mt-2 text-xs font-bold text-[#9AA7B0]">Команданте: «Можно ещё один сет — или переваривай до завтра, амиго»</p>

                <button onClick={onClose} className="mt-4 w-full rounded-xl border-b-4 py-3 text-sm font-black text-[#16240C] active:border-b-0"
                    style={{ background: '#78C93C', borderBottomColor: '#60A12F' }}>Объелся, спасибо 🤤</button>
            </motion.div>
        </div>
    )
}

export default function TestSetPage() {
    const [s, setS] = useState<S>({ starterDone: false, solved: 0 })
    const [open, setOpen] = useState(true)
    const [full, setFull] = useState(false)
    const [goose, setGoose] = useState('plain')
    const step = () => {
        const d = dishIndex(s)
        if (d === 0) setS({ ...s, starterDone: true })
        else if (d === 1) setS({ ...s, solved: s.solved + 1 })
        else setFull(true)
    }
    return (
        <div className="min-h-screen bg-[#131D22] px-4 py-6">
            <div className="mx-auto flex w-full max-w-md flex-col gap-3">
                <p className="text-sm font-bold text-[#9AA7B0]">Макет: полоска висит сверху на /trainer и в задачнике. Жми зелёную кнопку — как будто прошёл шаг.</p>
                <Strip s={s} open={open} onToggle={() => setOpen((o) => !o)} />
                {open && <SetCard s={s} onStep={step} goose={goose} />}
                <p className="mt-4 font-black text-[#F2F7FB]">Стикер гуся — выбери вариант (нажми, и он встанет в карточку):</p>
                <div className="grid grid-cols-2 gap-2">
                    {GOOSE_STYLES.map((g) => (
                        <button key={g.id} onClick={() => setGoose(g.id)}
                            className={`flex items-center gap-2 rounded-2xl border-2 bg-[#151F23] p-2.5 text-left ${goose === g.id ? 'border-[#F2C35B]' : 'border-[#2A363C]'}`}>
                            <GooseSticker variant={g.id} size={84} />
                            <span className="min-w-0 text-xs font-black leading-tight text-[#C9D3D9]">{g.title}</span>
                        </button>
                    ))}
                </div>
                <button onClick={() => { setS({ starterDone: false, solved: 0 }); setFull(false); setOpen(true) }}
                    className="flex items-center justify-center gap-2 self-center rounded-xl border-b-4 border-[#1B252A] bg-[#26333B] px-4 py-2 text-sm font-black text-[#C9D3D9] active:border-b-0">
                    <RotateCcw className="h-4 w-4" />Сначала
                </button>
            </div>
            {full && <FullScreen onClose={() => { setFull(false); setS({ starterDone: false, solved: 0 }) }} />}
        </div>
    )
}
