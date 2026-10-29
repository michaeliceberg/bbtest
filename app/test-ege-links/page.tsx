'use client'

// Тестовая страница: варианты, как показать связь «тренажёр → задания ЕГЭ»,
// и пробная «ракета-раскраска» (каркас = тренажёр, обшивка = задачник).
import { useState } from 'react'
import { Check, KeyRound, Lock, Rocket } from 'lucide-react'
import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors'

const SHORT: Record<number, string> = {
    1: 'Планиметрия', 2: 'Векторы', 3: 'Стереометрия', 4: 'Вероятность', 5: 'Сложная вероятность',
    6: 'Мат. ожидание', 7: 'Уравнения', 8: 'Выражения', 9: 'Производная', 10: 'Прикладные',
    11: 'Текстовые', 12: 'Графики', 13: 'Финансы', 14: 'Уравнения', 15: 'Стереометрия',
    16: 'Неравенства', 17: 'Моделирование', 18: 'Планиметрия', 19: 'Параметр', 20: 'Теория чисел',
}
const POINTS = (n: number) => (n <= 13 ? 1 : ({ 14: 2, 15: 3, 16: 2, 17: 2, 18: 3, 19: 4, 20: 4 } as Record<number, number>)[n])
const NUMS = Array.from({ length: 20 }, (_, i) => i + 1)

// Реальные связи из ege_task_links (на 29.10.2026)
const UNITS: { id: number; title: string; tasks: number[] }[] = [
    { id: 30, title: 'Тригонометрическая окружность', tasks: [7, 8, 14] },
    { id: 16, title: '8 свойств логарифмов', tasks: [7, 8, 16] },
    { id: 35, title: 'Теорема о Трёх Перпендикулярах', tasks: [3, 15] },
    { id: 37, title: 'Треугольник', tasks: [1, 18] },
]
const TASK_UNITS: Record<number, string[]> = {
    15: ['Сечение', 'ТТП', 'Угол между прямой и плоскостью', 'Расстояние от точки до плоскости'],
    7: ['Степени и корни', 'Тригонометрическая окружность', 'Теорема Виета', '8 свойств логарифмов'],
}

const BLUE = GGEGE_PALETTE.blue.button, GOLD = '#F2C35B', PURPLE = GGEGE_PALETTE.purple.button
const card = 'rounded-2xl border border-[#2C3A41] bg-[#161F23] p-4'

const Title = ({ n, children }: { n: number; children: React.ReactNode }) => (
    <h2 className="mb-3 text-lg font-extrabold text-white"><span className="mr-2 rounded-lg bg-white/10 px-2 py-0.5">{n}</span>{children}</h2>
)

// ── 1. Ключи-номера
function V1({ u }: { u: typeof UNITS[0] }) {
    return (
        <div className={card}>
            <div className="font-extrabold text-white">{u.title}</div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-[#F2C35B]" />
                <span className="text-xs font-bold text-[#9AA7B0]">ключ к</span>
                {u.tasks.map((n) => (
                    <span key={n} className="flex items-center gap-1 rounded-lg border-2 px-2 py-0.5 text-xs font-extrabold"
                        style={{ borderColor: n <= 13 ? BLUE : PURPLE, color: n <= 13 ? BLUE : PURPLE, background: '#0F171B' }}>
                        №{n} <span className="font-bold text-[#C9D4DA]">{SHORT[n]}</span>
                    </span>
                ))}
            </div>
        </div>
    )
}

// ── 2. Вся плитка заданий, подсвечены свои
function V2({ u }: { u: typeof UNITS[0] }) {
    const row = (from: number, to: number, color: string) => (
        <div className="flex gap-1">
            {NUMS.filter((n) => n >= from && n <= to).map((n) => {
                const on = u.tasks.includes(n)
                return (
                    <div key={n} className="flex h-7 flex-1 items-center justify-center rounded-md text-[11px] font-extrabold"
                        style={on ? { background: color, color: '#0F171B', boxShadow: `0 0 10px ${color}88` } : { background: '#222D33', color: '#4A5860' }}>
                        {n}
                    </div>
                )
            })}
        </div>
    )
    return (
        <div className={card}>
            <div className="font-extrabold text-white">{u.title}</div>
            <div className="mt-2 space-y-1">
                {row(1, 13, BLUE)}
                <div className="w-[54%]">{row(14, 20, PURPLE)}</div>
            </div>
        </div>
    )
}

// ── 3. Мини-башня
function V3({ u }: { u: typeof UNITS[0] }) {
    return (
        <div className={`${card} flex items-center gap-4`}>
            <div className="flex flex-col-reverse gap-[2px]">
                {NUMS.map((n) => {
                    const on = u.tasks.includes(n)
                    return (
                        <div key={n} className="h-[7px] rounded-sm" style={{
                            width: n <= 13 ? 46 : 34, marginLeft: n <= 13 ? 0 : 6,
                            background: on ? GOLD : '#26333B', boxShadow: on ? `0 0 8px ${GOLD}` : undefined,
                        }} />
                    )
                })}
            </div>
            <div>
                <div className="font-extrabold text-white">{u.title}</div>
                <div className="mt-1 text-xs font-bold text-[#9AA7B0]">Строит этажи башни ЕГЭ:</div>
                <div className="mt-1 text-sm font-extrabold text-[#F2C35B]">{u.tasks.map((n) => `№${n}`).join(' · ')}</div>
            </div>
        </div>
    )
}

// ── 4. С обратной стороны: плитка задачника → «скелет»
function V4({ n, done }: { n: number; done: number }) {
    const list = TASK_UNITS[n]
    const ready = done >= list.length
    return (
        <div className={card}>
            <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-extrabold text-[#0F171B]" style={{ background: n <= 13 ? BLUE : PURPLE }}>{n}</div>
                <div>
                    <div className="font-extrabold text-white">{SHORT[n]}</div>
                    <div className="text-xs font-bold text-[#9AA7B0]">{ready ? 'Каркас готов — решай задачи!' : `Сначала каркас: ${done} из ${list.length} тренажёров`}</div>
                </div>
            </div>
            <div className="mt-3 space-y-1.5">
                {list.map((t, i) => (
                    <div key={t} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-bold"
                        style={{ background: i < done ? '#1F3A2A' : '#1C262B', color: i < done ? '#A1D151' : '#C9D4DA' }}>
                        {i < done ? <Check className="h-4 w-4" /> : <span className="h-4 w-4 rounded-full border-2 border-[#4A5860]" />}
                        {t}
                    </div>
                ))}
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold"
                style={ready ? { background: '#22A22F', color: 'white' } : { background: '#222D33', color: '#6B7A83' }}>
                {ready ? null : <Lock className="h-4 w-4" />} Задачи №{n} в задачнике
            </div>
        </div>
    )
}

// ── 5. Ракета-раскраска: каркас (тренажёр) + обшивка (задачник)
function RocketArt({ prog }: { prog: number }) {
    // демо-прогресс: каркас идёт впереди обшивки
    const frame = (n: number) => Math.max(0, Math.min(1, prog * 2.2 - (n - 1) * 0.08))
    const skin = (n: number) => Math.max(0, Math.min(1, prog * 2 - 0.6 - (n - 1) * 0.07))
    const W = 200, cx = W / 2
    const seg = (n: number) => {
        const p2 = n > 13
        const i = p2 ? n - 14 : n - 1
        const h = p2 ? 16 : 14
        const y = p2 ? 210 - i * h - h : 420 - i * h - h
        const w = p2 ? 60 : 84
        return { x: cx - w / 2, y, w, h }
    }
    const allSkin = NUMS.every((n) => skin(n) >= 1)
    return (
        <svg viewBox={`0 0 ${W} 470`} className="h-[420px] w-auto">
            <defs>
                <linearGradient id="hull" x1="0" x2="1">
                    <stop offset="0" stopColor="#9AA9B4" /><stop offset=".45" stopColor="#F2F7FB" /><stop offset="1" stopColor="#6E7E89" />
                </linearGradient>
                <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#FFE07A" /><stop offset=".5" stopColor="#F09B38" /><stop offset="1" stopColor="#DC605B" stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* нос */}
            <path d={`M${cx} 46 Q${cx + 34} 80 ${cx + 30} 98 L${cx - 30} 98 Q${cx - 34} 80 ${cx} 46Z`} fill={allSkin ? '#DC605B' : '#26333B'} stroke="#4A5860" strokeDasharray={allSkin ? undefined : '4 3'} />
            {/* переходник между ступенями */}
            <path d={`M${cx - 30} 210 L${cx - 42} 238 L${cx + 42} 238 L${cx + 30} 210Z`} fill="#26333B" stroke="#4A5860" />
            {/* стабилизаторы */}
            <path d={`M${cx - 42} 360 L${cx - 72} 420 L${cx - 42} 420Z`} fill={skin(1) >= 1 ? '#DC605B' : '#26333B'} stroke="#4A5860" />
            <path d={`M${cx + 42} 360 L${cx + 72} 420 L${cx + 42} 420Z`} fill={skin(1) >= 1 ? '#DC605B' : '#26333B'} stroke="#4A5860" />
            {NUMS.map((n) => {
                const s = seg(n), f = frame(n), k = skin(n)
                return (
                    <g key={n}>
                        <rect x={s.x} y={s.y} width={s.w} height={s.h} fill="#141C20" />
                        {/* обшивка растёт слева направо */}
                        <rect x={s.x} y={s.y} width={s.w * k} height={s.h} fill="url(#hull)" opacity={0.95} />
                        {/* каркас: пунктир → яркая рамка */}
                        <rect x={s.x + 0.5} y={s.y + 0.5} width={s.w - 1} height={s.h - 1} fill="none"
                            stroke={f >= 1 ? GOLD : '#3A464E'} strokeWidth={f >= 1 ? 1.6 : 1} strokeDasharray={f >= 1 ? undefined : '3 3'} />
                        <text x={s.x + s.w / 2} y={s.y + s.h / 2 + 4} textAnchor="middle" fontSize="10" fontWeight={800}
                            fill={k > 0.5 ? '#26333B' : f >= 1 ? GOLD : '#4A5860'} fontFamily="var(--font-nunito), sans-serif">{n}</text>
                    </g>
                )
            })}
            {allSkin && <path d={`M${cx - 30} 420 Q${cx} 470 ${cx + 30} 420Z`} fill="url(#flame)" />}
        </svg>
    )
}

export default function Page() {
    const [done, setDone] = useState(2)
    const [prog, setProg] = useState(0.62)
    return (
        <div className="min-h-screen bg-[#0F171B] px-4 py-6 text-white">
            <div className="mx-auto max-w-xl space-y-8">
                <h1 className="text-2xl font-extrabold">Тренажёр ↔ задания ЕГЭ</h1>

                <section><Title n={1}>Ключи-номера на карточке тренажёра</Title>
                    <div className="space-y-2">{UNITS.map((u) => <V1 key={u.id} u={u} />)}</div></section>

                <section><Title n={2}>Вся плитка заданий, свои подсвечены</Title>
                    <div className="space-y-2">{UNITS.map((u) => <V2 key={u.id} u={u} />)}</div></section>

                <section><Title n={3}>Мини-башня: какие этажи строит тренажёр</Title>
                    <div className="space-y-2">{UNITS.slice(0, 2).map((u) => <V3 key={u.id} u={u} />)}</div></section>

                <section><Title n={4}>С обратной стороны — плитка задачника</Title>
                    <div className="mb-2 flex gap-2">
                        {[0, 2, 4].map((d) => (
                            <button key={d} onClick={() => setDone(d)} className="rounded-lg bg-white/10 px-3 py-1 text-sm font-bold"
                                style={done === d ? { background: BLUE, color: '#0F171B' } : undefined}>пройдено {d}</button>
                        ))}
                    </div>
                    <V4 n={15} done={done} /></section>

                <section><Title n={5}>Ракета: каркас — тренажёр, обшивка — задачник</Title>
                    <div className={`${card} flex flex-col items-center`}>
                        <RocketArt prog={prog} />
                        <input type="range" min={0} max={1} step={0.01} value={prog} onChange={(e) => setProg(+e.target.value)} className="mt-3 w-full" />
                        <div className="mt-2 flex items-center gap-2 text-xs font-bold text-[#9AA7B0]">
                            <Rocket className="h-4 w-4" /> пунктир → золотая рамка = тренажёры пройдены · серебро = задачи решены
                        </div>
                    </div></section>
            </div>
        </div>
    )
}
