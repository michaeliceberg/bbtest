'use client'

// Пробная страница: как показать в карточке юнита тренажёра, к какому заданию ЕГЭ он готовит.
// Под названием — ключик и номер(а) задания в квадратиках. Каждый вариант — на всех цветах юнитов.
import { useState } from 'react'
import { ChevronDown, KeyRound } from 'lucide-react'
import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors'
import { NavMedal } from '@/components/nav-sheet-ui'

type Color = { button: string; bottom: string }
const COLORS: Color[] = Object.values(GGEGE_PALETTE)
const EXAMPLES: { title: string; tasks: number[]; percent: number }[] = [
    { title: 'Теорема Виета', tasks: [7], percent: 0 },
    { title: 'Логарифмы', tasks: [7, 8, 16], percent: 40 },
    { title: 'Треугольник', tasks: [1, 18], percent: 70 },
]

type Variant = { id: string; name: string; note: string; render: (tasks: number[], c: Color) => JSX.Element }

const Sq = ({ n, style, className = '' }: { n: number; style: React.CSSProperties; className?: string }) => (
    <span className={`flex h-6 min-w-6 items-center justify-center rounded-[6px] px-1 text-[13px] font-black leading-none ${className}`} style={style}>{n}</span>
)

const VARIANTS: Variant[] = [
    {
        id: 'A', name: 'Белое стекло', note: 'Полупрозрачная плашка, номер — белый квадрат',
        render: (tasks, c) => (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 py-1 pl-1.5 pr-1 ring-1 ring-white/25">
                <KeyRound className="h-4 w-4 text-white" strokeWidth={2.6} />
                {tasks.map((n) => <Sq key={n} n={n} style={{ background: '#FFFFFF', color: c.bottom }} />)}
            </span>
        ),
    },
    {
        id: 'B', name: 'Тёмная плашка + золото', note: 'Как бейдж ранга: тёмная таблетка, золотой ключ',
        render: (tasks) => (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/30 py-1 pl-1.5 pr-1">
                <KeyRound className="h-4 w-4 text-[#F2C35B]" strokeWidth={2.6} />
                {tasks.map((n) => <Sq key={n} n={n} style={{ background: 'linear-gradient(180deg,#FFE58A,#F2C35B)', color: '#3A2A08', boxShadow: '0 2px 0 #B8862E' }} />)}
            </span>
        ),
    },
    {
        id: 'C', name: 'Без плашки', note: 'Самый лёгкий: ключ и квадраты прямо на цвете юнита',
        render: (tasks) => (
            <span className="inline-flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-white/90" strokeWidth={2.6} />
                {tasks.map((n) => <Sq key={n} n={n} style={{ background: 'rgba(0,0,0,0.22)', color: '#FFFFFF', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.55)' }} />)}
            </span>
        ),
    },
    {
        id: 'D', name: 'Вдавленные квадраты', note: 'Номер «выбит» в карточке тёмным тоном её цвета',
        render: (tasks, c) => (
            <span className="inline-flex items-center gap-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-[6px]" style={{ background: c.bottom, boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.35)' }}>
                    <KeyRound className="h-3.5 w-3.5 text-white" strokeWidth={2.6} />
                </span>
                {tasks.map((n) => <Sq key={n} n={n} style={{ background: c.bottom, color: '#FFFFFF', boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.35)' }} />)}
            </span>
        ),
    },
    {
        id: 'E', name: 'Ключ-брелок', note: 'Золотой кружок с ключом, номера — белые с тенью',
        render: (tasks, c) => (
            <span className="inline-flex items-center gap-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: 'linear-gradient(180deg,#FFE58A,#E5A93A)', boxShadow: '0 2px 0 #9A6E22' }}>
                    <KeyRound className="h-3.5 w-3.5 text-[#3A2A08]" strokeWidth={2.8} />
                </span>
                {tasks.map((n) => <Sq key={n} n={n} style={{ background: '#FFFFFF', color: c.bottom, boxShadow: '0 2px 0 rgba(0,0,0,0.25)' }} />)}
            </span>
        ),
    },
    {
        id: 'F', name: 'Тёмное стекло, тонкая рамка', note: 'Строго и сдержанно: номер в тонкой белой рамке',
        render: (tasks) => (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F171B]/45 py-1 pl-2 pr-1 backdrop-blur-[2px]">
                <KeyRound className="h-4 w-4 text-[#F2C35B]" strokeWidth={2.6} />
                <span className="h-4 w-px bg-white/25" />
                {tasks.map((n) => <Sq key={n} n={n} style={{ color: '#FFFFFF', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.7)' }} />)}
            </span>
        ),
    },
]

function Banner({ title, tasks, percent, c, v }: { title: string; tasks: number[]; percent: number; c: Color; v: Variant }) {
    return (
        <div className="relative block w-full overflow-hidden rounded-2xl border-b-[6px] px-4 pb-3.5 pt-4 text-left text-white"
            style={{ background: `linear-gradient(135deg, ${c.button}, ${c.bottom})`, borderBottomColor: c.bottom }}>
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="break-words text-xl font-bold tracking-tight">{title}</h2>
                    <div className="mt-1.5">{v.render(tasks, c)}</div>
                </div>
                <span className="flex flex-shrink-0 items-center gap-2">
                    <span className="-my-3 -mr-1"><NavMedal percent={percent} size={80} onColor /></span>
                    <ChevronDown className="h-5 w-5 -rotate-90 opacity-80" />
                </span>
            </div>
        </div>
    )
}

export default function Page() {
    const [ex, setEx] = useState(0)
    const e = EXAMPLES[ex]
    return (
        <div className="min-h-screen bg-[#0F171B] px-4 py-5 text-white">
            <div className="mx-auto max-w-xl">
                <h1 className="text-xl font-extrabold">Ключ к заданию ЕГЭ в карточке юнита</h1>
                <p className="mb-3 text-xs font-bold text-[#7E8F99]">Каждый вариант показан на всех цветах юнитов. Выбери букву.</p>
                <div className="sticky top-0 z-10 -mx-4 mb-4 flex gap-2 bg-[#0F171B]/95 px-4 py-2">
                    {EXAMPLES.map((x, i) => (
                        <button key={x.title} onClick={() => setEx(i)} className="rounded-lg px-3 py-1.5 text-sm font-bold"
                            style={{ background: ex === i ? '#53ADEF' : '#26333B', color: ex === i ? '#0F171B' : '#C9D4DA' }}>
                            {x.tasks.length === 1 ? '1 задание' : `${x.tasks.length} задания`}
                        </button>
                    ))}
                </div>
                <div className="space-y-8">
                    {VARIANTS.map((v) => (
                        <section key={v.id}>
                            <div className="mb-2 flex items-baseline gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F2C35B] text-sm font-black text-[#0F171B]">{v.id}</span>
                                <span className="font-black">{v.name}</span>
                            </div>
                            <p className="mb-2 text-xs font-bold text-[#7E8F99]">{v.note}</p>
                            <div className="space-y-2.5">
                                {COLORS.map((c) => <Banner key={c.button} title={e.title} tasks={e.tasks} percent={e.percent} c={c} v={v} />)}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    )
}
