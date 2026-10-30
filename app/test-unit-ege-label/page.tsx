'use client'

// Пробная страница: подпись в карточке юнита тренажёра — к какому заданию ЕГЭ он готовит. Вместо ключика
// (ключ «открывает», а тренажёр задание не открывает — помогает решить) — текстом, белым, на тёмной подложке.
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors'
import { NavMedal } from '@/components/nav-sheet-ui'

const C = GGEGE_PALETTE.blue
const EXAMPLES: { title: string; tasks: number[]; percent: number }[] = [
    { title: 'Теорема Виета', tasks: [7], percent: 0 },
    { title: 'Логарифмы', tasks: [7, 8, 16], percent: 40 },
    { title: 'Треугольник', tasks: [1, 18], percent: 70 },
]
const list = (t: number[]) => t.join(', ')

// номер-кнопка: белый, ведёт в раздел задачника
const Num = ({ n, boxed }: { n: number; boxed?: boolean }) => boxed
    ? <span className="flex h-6 min-w-6 items-center justify-center rounded-[6px] px-1 text-[13px] font-black leading-none text-white" style={{ boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.7)' }}>{n}</span>
    : <span className="font-black">{n}</span>

type Variant = { id: string; name: string; render: (t: number[]) => JSX.Element }
const Pill = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/30 px-2 py-1 text-[13px] font-bold leading-none text-white">{children}</span>
)
const VARIANTS: Variant[] = [
    { id: 'A', name: 'ЕГЭ №7', render: (t) => <Pill>ЕГЭ <span className="font-black">№{list(t)}</span></Pill> },
    { id: 'B', name: 'Для задания ЕГЭ №7', render: (t) => <Pill>Для {t.length > 1 ? 'заданий' : 'задания'} ЕГЭ <span className="font-black">№{list(t)}</span></Pill> },
    { id: 'C', name: 'Помогает решить №7', render: (t) => <Pill>Помогает решить <span className="font-black">№{list(t)}</span> ЕГЭ</Pill> },
    { id: 'D', name: 'Тренажёр к заданию 7', render: (t) => <Pill>Тренажёр к {t.length > 1 ? 'заданиям' : 'заданию'} <span className="font-black">{list(t)}</span></Pill> },
    { id: 'E', name: 'Задание ЕГЭ + номера в рамке', render: (t) => <Pill>{t.length > 1 ? 'Задания' : 'Задание'} ЕГЭ {t.map((n) => <Num key={n} n={n} boxed />)}</Pill> },
    { id: 'F', name: 'ЕГЭ + номера в рамке', render: (t) => <Pill>ЕГЭ {t.map((n) => <Num key={n} n={n} boxed />)}</Pill> },
    { id: 'G', name: 'Готовит к №7', render: (t) => <Pill>Готовит к <span className="font-black">№{list(t)}</span> ЕГЭ</Pill> },
]

function Banner({ title, tasks, percent, v }: { title: string; tasks: number[]; percent: number; v: Variant }) {
    return (
        <div className="relative block w-full overflow-hidden rounded-2xl border-b-[6px] px-4 pb-3.5 pt-4 text-left text-white"
            style={{ background: `linear-gradient(135deg, ${C.button}, ${C.bottom})`, borderBottomColor: C.bottom }}>
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="break-words text-xl font-bold tracking-tight">{title}</h2>
                    <div className="mt-1.5">{v.render(tasks)}</div>
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
    return (
        <div className="min-h-screen bg-[#0F171B] px-4 py-5 text-white">
            <div className="mx-auto max-w-xl">
                <h1 className="text-xl font-extrabold">Подпись «к какому заданию ЕГЭ»</h1>
                <p className="mb-3 text-xs font-bold text-[#7E8F99]">Вместо ключика — текстом. Номер ведёт в этот раздел задачника. Выбери букву.</p>
                <div className="sticky top-0 z-10 -mx-4 mb-4 flex gap-2 bg-[#0F171B]/95 px-4 py-2">
                    {EXAMPLES.map((x, i) => (
                        <button key={x.title} onClick={() => setEx(i)} className="rounded-lg px-3 py-1.5 text-sm font-bold"
                            style={{ background: ex === i ? '#53ADEF' : '#26333B', color: ex === i ? '#0F171B' : '#C9D4DA' }}>
                            {x.tasks.length === 1 ? '1 задание' : `${x.tasks.length} задания`}
                        </button>
                    ))}
                </div>
                <div className="space-y-5">
                    {VARIANTS.map((v) => (
                        <section key={v.id}>
                            <div className="mb-2 flex items-baseline gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F2C35B] text-sm font-black text-[#0F171B]">{v.id}</span>
                                <span className="font-black">{v.name}</span>
                            </div>
                            <Banner title={EXAMPLES[ex].title} tasks={EXAMPLES[ex].tasks} percent={EXAMPLES[ex].percent} v={v} />
                        </section>
                    ))}
                </div>
            </div>
        </div>
    )
}
