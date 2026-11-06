'use client'

// Варианты шапки раздела задачника (/learn?task=N): как убрать дубль «Тренажёры 0/1» и показать ученику один понятный
// следующий шаг: сначала тренажёр, потом задачи, потом починка предмета. Данные выдуманные, кнопки никуда не ведут.

import { useState, type ReactNode } from 'react'
import { ArrowLeft, Check, ChevronRight, Dumbbell, Hammer, ListChecks, Lock, Play } from 'lucide-react'
import { ItemBadge } from '@/components/learn-section-header'
import { TinyMedal } from '@/components/nav-sheet-ui'
import { TrainerPathStops } from '@/components/trainer-path-stops'
import { hangarItemPic } from '@/lib/hangarModel'
import { declensionRu } from '@/usefulFunctions'

const ACCENT = { button: '#C385F7', bottom: '#9C6AC6', text: '#1F1230' }
const TARGET = 5

type Topic = { title: string; percent: number }
type S = { topics: Topic[]; solved: number; step: 0 | 1 | 2; left: Topic | undefined }

const stateOf = (progress: number, two: boolean): S => {
    const topics: Topic[] = two
        ? [{ title: 'Вероятность', percent: progress > 0 ? 100 : 60 }, { title: 'Дерево вариантов', percent: progress > 0 ? 50 : 0 }]
        : [{ title: 'Вероятность', percent: progress > 0 ? 100 : 0 }]
    const left = topics.find((t) => t.percent < 50)
    const solved = progress === 0 ? 0 : progress === 1 ? 2 : TARGET
    return { topics, solved, left, step: left ? 0 : solved < TARGET ? 1 : 2 }
}
const doneCount = (s: S) => s.topics.filter((t) => t.percent >= 50).length
const actionLabel = (s: S) => s.step === 0 ? `Пройти тренажёр «${s.left!.title}»` : s.step === 1 ? `Решать задачи · ещё ${TARGET - s.solved}` : 'Починить предмет'
const ActionIcon = ({ s }: { s: S }) => {
    const I = s.step === 0 ? Dumbbell : s.step === 1 ? ListChecks : Hammer
    return <I className="h-5 w-5 shrink-0" strokeWidth={2.6} />
}

function MainBtn({ s }: { s: S }) {
    return (
        <button type="button" className="flex w-full items-center justify-center gap-2 rounded-xl border-b-4 px-3 py-3 text-[15px] font-black active:border-b-0"
            style={{ background: ACCENT.button, borderBottomColor: ACCENT.bottom, color: ACCENT.text }}>
            <span className="min-w-0 truncate">{actionLabel(s)}</span><ActionIcon s={s} />
        </button>
    )
}
function Head({ children }: { children?: ReactNode }) {
    return (
        <div className="flex items-center gap-3">
            <ItemBadge pic={hangarItemPic(5, false)} />
            <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-wide" style={{ color: ACCENT.button }}>Задание 5</p>
                <p className="text-lg font-black leading-tight text-[#F2F7FB]">Вероятность сложных событий</p>
                {children}
            </div>
        </div>
    )
}
function Card({ children }: { children: ReactNode }) {
    return <div className="rounded-2xl border-2 border-[#2A363C] bg-[#151F23] p-3">{children}</div>
}
// Кружки уроков задачника под шапкой: виден контекст и то, что задачи идут после тренажёра
function Lessons({ locked = false }: { locked?: boolean }) {
    return (
        <div className={`mt-4 flex flex-col items-center gap-3 ${locked ? 'opacity-35' : ''}`}>
            {locked && <p className="flex items-center gap-1 text-xs font-black text-[#C9D3D9]"><Lock className="h-3.5 w-3.5" />Откроются после тренажёра</p>}
            {[0, 1].map((i) => (
                <span key={i} className="h-14 w-14 rounded-full border-b-[6px]" style={{ background: ACCENT.button, borderBottomColor: ACCENT.bottom, transform: `translateX(${i ? 34 : -34}px)` }} />
            ))}
        </div>
    )
}
function TopicRows({ s, compact = false }: { s: S; compact?: boolean }) {
    return (
        <div className="flex flex-col gap-1">
            {s.topics.map((t) => (
                <div key={t.title} className={`flex items-center gap-2 rounded-lg bg-[#1B252A] px-2 ${compact ? 'py-1' : 'py-1.5'}`}>
                    <TinyMedal percent={t.percent} size={22} boost />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-extrabold text-[#E2EAF0]">{t.title}</span>
                    {t.percent >= 50 ? <Check className="h-4 w-4 text-[#9EE8B0]" strokeWidth={3} /> : <ChevronRight className="h-4 w-4 text-[#9AA7B0]" />}
                </div>
            ))}
        </div>
    )
}

// A. Маршрут: 3 шага столбиком, текущий раскрыт, остальные свёрнуты в одну строку
function Route({ s }: { s: S }) {
    const steps = [
        { name: 'Тренажёры', count: `${doneCount(s)}/${s.topics.length}`, I: Dumbbell },
        { name: 'Задачи', count: `${Math.min(s.solved, TARGET)}/${TARGET}`, I: ListChecks },
        { name: 'Починить предмет', count: '', I: Hammer },
    ]
    return (
        <>
            <Card>
                <Head />
                <div className="mt-3 flex flex-col">
                    {steps.map((st, i) => {
                        const done = i < s.step, cur = i === s.step
                        return (
                            <div key={st.name} className="flex gap-2.5">
                                <div className="flex flex-col items-center">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-black"
                                        style={{ background: done ? '#2E6B41' : cur ? ACCENT.button : '#26333B', color: done ? '#D5F5DD' : cur ? ACCENT.text : '#7A8A93' }}>
                                        {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                                    </span>
                                    {i < 2 && <span className="my-0.5 w-0.5 flex-1 bg-[#2A363C]" />}
                                </div>
                                <div className="min-w-0 flex-1 pb-2.5">
                                    <p className={`flex items-center justify-between pt-0.5 text-sm font-black ${cur ? 'text-[#F2F7FB]' : done ? 'text-[#9AA7B0]' : 'text-[#6B7A83]'}`}>
                                        <span>{st.name}</span><span className="text-xs">{st.count}</span>
                                    </p>
                                    {cur && <div className="mt-2 flex flex-col gap-2">{i === 0 && <TopicRows s={s} compact />}<MainBtn s={s} /></div>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Card>
            <Lessons locked={s.step === 0} />
        </>
    )
}

// B. Одна главная кнопка: шапка, полоска из двух частей и единственное действие
function OneButton({ s }: { s: S }) {
    const a = doneCount(s) / s.topics.length, b = Math.min(s.solved, TARGET) / TARGET
    const Bar = ({ v, label, on }: { v: number; label: string; on: boolean }) => (
        <div className="min-w-0 flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-[#0F171B]"><div className="h-full rounded-full" style={{ width: `${v * 100}%`, background: ACCENT.button }} /></div>
            <p className={`mt-1 text-[11px] font-black ${on ? 'text-[#F2F7FB]' : 'text-[#7A8A93]'}`}>{label}</p>
        </div>
    )
    return (
        <>
            <Card>
                <Head />
                <div className="mt-3 flex gap-2">
                    <Bar v={a} on={s.step === 0} label={`1. Тренажёры ${doneCount(s)}/${s.topics.length}`} />
                    <Bar v={b} on={s.step === 1} label={`2. Задачи ${Math.min(s.solved, TARGET)}/${TARGET}`} />
                </div>
                <div className="mt-3"><MainBtn s={s} /></div>
            </Card>
            <Lessons locked={s.step === 0} />
        </>
    )
}

// C. Две вкладки-шага: под ними содержимое только выбранной
function Tabs({ s }: { s: S }) {
    const [own, setOwn] = useState<number | null>(null)
    const tab = own ?? (s.step === 0 ? 0 : 1)
    const Tab = ({ i, label }: { i: number; label: string }) => (
        <button type="button" onClick={() => setOwn(i)} className="min-w-0 flex-1 rounded-lg px-2 py-2 text-[13px] font-black"
            style={{ background: tab === i ? ACCENT.button : 'transparent', color: tab === i ? ACCENT.text : '#9AA7B0' }}>{label}</button>
    )
    return (
        <>
            <Card>
                <Head />
                <div className="mt-3 flex gap-1 rounded-xl bg-[#0F171B] p-1">
                    <Tab i={0} label={`1 · Тренажёры ${doneCount(s)}/${s.topics.length}`} />
                    <Tab i={1} label={`2 · Задачи ${Math.min(s.solved, TARGET)}/${TARGET}`} />
                </div>
                {tab === 0 && <div className="mt-2 flex flex-col gap-2"><TopicRows s={s} />{s.step === 0 && <MainBtn s={s} />}</div>}
                {tab === 1 && s.step === 0 && <p className="mt-2 text-center text-xs font-bold text-[#F2C35B]">Задачи можно решать и сейчас, но с тренажёром пойдёт легче</p>}
                {tab === 1 && s.step > 0 && <div className="mt-2"><MainBtn s={s} /></div>}
            </Card>
            {tab === 1 && <Lessons />}
        </>
    )
}

// D. Мигель подсказывает: шапка компактная, совет и кнопка — от него
function Miguel({ s }: { s: S }) {
    const say = s.step === 0 ? 'Сначала тренажёр, компаньеро. Потом задачи пойдут легче' : s.step === 1 ? 'Тренажёр взят! Теперь в бой: задачи' : 'Задачи решены. Чини предмет!'
    return (
        <>
            <Card><Head><p className="mt-0.5 text-xs font-black text-[#9AA7B0]">Тренажёры {doneCount(s)}/{s.topics.length} · Задачи {Math.min(s.solved, TARGET)}/{TARGET}</p></Head></Card>
            <div className="mt-3 flex items-end gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/miguel/miguel-point.webp" alt="" className="h-24 w-20 shrink-0 object-contain" />
                <div className="min-w-0 flex-1 rounded-2xl rounded-bl-none border-2 border-[#3A464E] bg-[#1B252A] p-2.5">
                    <p className="text-sm font-black leading-snug text-[#F2F7FB]">{say}</p>
                </div>
            </div>
            <div className="mt-2"><MainBtn s={s} /></div>
            <Lessons locked={s.step === 0} />
        </>
    )
}

// E. Тренажёр — это первый кружок дорожки: кружок с гантелью стоит над кружками уроков, замок на остальных
function Path({ s }: { s: S }) {
    return (
        <>
            <Card><Head><p className="mt-0.5 text-xs font-black text-[#9AA7B0]">Задачи {Math.min(s.solved, TARGET)}/{TARGET}</p></Head></Card>
            <div className="mt-4 flex flex-col items-center gap-3">
                {s.topics.map((t) => {
                    const ok = t.percent >= 50, cur = t === s.left
                    return (
                        <button key={t.title} type="button" className="flex flex-col items-center gap-1">
                            {cur && <span className="animate-bounce rounded-lg bg-[#F2C35B] px-2 py-0.5 text-[11px] font-black text-[#3A2A08]">Начни здесь</span>}
                            <span className="flex h-16 w-16 items-center justify-center rounded-full border-b-[6px] active:border-b-0"
                                style={{ background: ok ? '#2E6B41' : ACCENT.button, borderBottomColor: ok ? '#1E4A2C' : ACCENT.bottom, color: ok ? '#D5F5DD' : ACCENT.text }}>
                                {ok ? <Check className="h-7 w-7" strokeWidth={3} /> : <Dumbbell className="h-7 w-7" strokeWidth={2.6} />}
                            </span>
                            <span className="text-xs font-black text-[#C9D3D9]">Тренажёр: {t.title}</span>
                        </button>
                    )
                })}
            </div>
            <div className={`mt-3 flex flex-col items-center gap-3 ${s.step === 0 ? 'opacity-35' : ''}`}>
                {[0, 1].map((i) => (
                    <span key={i} className="flex h-14 w-14 items-center justify-center rounded-full border-b-[6px]" style={{ background: ACCENT.button, borderBottomColor: ACCENT.bottom, color: ACCENT.text, transform: `translateX(${i ? 34 : -34}px)` }}>
                        {s.step === 0 ? <Lock className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </span>
                ))}
            </div>
        </>
    )
}

const VARIANTS = [
    { name: 'A. Маршрут из 3 шагов', note: 'Видно весь путь, раскрыт только текущий шаг', C: Route },
    { name: 'B. Одна главная кнопка', note: 'Меньше всего текста и только одно действие', C: OneButton },
    { name: 'C. Две вкладки', note: 'Тренажёры и задачи разделены, ученик может переключиться сам', C: Tabs },
    { name: 'D. Мигель подсказывает', note: 'Совет от персонажа и кнопка под ним', C: Miguel },
    { name: 'E. Тренажёр в дорожке', note: 'Тренажёр — первый кружок перед уроками, отдельной карточки нет', C: Path },
]

export default function TestLearnSectionPage() {
    const [progress, setProgress] = useState(0)
    const [two, setTwo] = useState(false)
    const s = stateOf(progress, two)
    const left = s.topics.filter((t) => t.percent < 50).length
    return (
        <div className="min-h-screen bg-[#161F23] px-4 py-6 text-[#F2F7FB]">
            <h1 className="text-center text-xl font-black">Шапка раздела задачника</h1>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
                {['Тренажёр не пройден', 'Решено 2 задачи', 'Можно чинить'].map((t, i) => (
                    <button key={t} type="button" onClick={() => setProgress(i)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-bold ${progress === i ? 'bg-[#F2C35B] text-[#3A2A08]' : 'bg-[#26333B]'}`}>{t}</button>
                ))}
                <button type="button" onClick={() => setTwo(!two)} className={`rounded-lg px-3 py-1.5 text-sm font-bold ${two ? 'bg-[#C385F7] text-[#1F1230]' : 'bg-[#26333B]'}`}>Две темы тренажёра</button>
            </div>
            {left > 0 && <p className="mt-2 text-center text-xs font-bold text-[#9AA7B0]">Не пройдено: {left} {declensionRu(left, 'тема', 'темы', 'тем')}</p>}
            <div className="mx-auto mt-6 grid max-w-[1160px] grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-8">
                {VARIANTS.map(({ name, note, C }) => (
                    <section key={name} className="min-w-0">
                        <h2 className="text-base font-black">{name}</h2>
                        <p className="mb-2 text-xs font-bold text-[#9AA7B0]">{note}</p>
                        <span className="mb-3 inline-flex items-center gap-1.5 rounded-xl border-2 border-b-4 border-[#2A363C] bg-[#151F23] px-3 py-1.5 text-sm font-black text-[#C9D3D9]"><ArrowLeft className="h-4 w-4" />В ангар</span>
                        <C s={s} />
                    </section>
                ))}
                <section className="min-w-0">
                    <h2 className="text-base font-black">Все темы на золоте</h2>
                    <p className="text-xs font-bold text-[#9AA7B0]">Настоящие кружки: сами свёрнуты, нажатие разворачивает</p>
                    <TrainerPathStops num={1} accent={ACCENT} keys={[
                        { tUnitId: 1, title: 'Окружность', percent: 100, doneLessons: 3, totalLessons: 3, nextLessonId: 503, nextLessonTitle: null },
                        { tUnitId: 2, title: 'Треугольник', percent: 100, doneLessons: 3, totalLessons: 3, nextLessonId: 504, nextLessonTitle: null },
                    ]} />
                </section>
            </div>
        </div>
    )
}
