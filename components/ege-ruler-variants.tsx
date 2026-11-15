'use client'

// Варианты «Линейки ЕГЭ», где задачник и тренажёр на одном экране (смотреть на /test-ruler-variants).
// Все варианты берут те же данные (lib/egeRuler.ts) и ведут в те же места: /learn?task=N и /trainer?topic=….

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, ChevronDown, Dumbbell, Lock } from 'lucide-react'
import type { RulerData, RulerTask } from '@/lib/egeRuler'
import { SHORT, TICK, MEDAL, medalColor, learnProgress, trainerProgress, topicHref } from './ege-ruler'

const LIME = '#C9E36B'
const BG = '#3D4728'
const learnHref = (n: number) => `/learn?task=${n}`
const name = (t: RulerTask) => SHORT[t.num] ?? t.title

function useGo() {
    const router = useRouter()
    return (href: string | null) => { if (href) router.push(href) }
}

function Sq({ fill, color, locked, title, onClick, size = 18 }: { fill: number; color: string; locked?: boolean; title: string; onClick: () => void; size?: number }) {
    return (
        <button type="button" title={title} onClick={onClick} className="relative shrink-0 overflow-hidden rounded-[5px] active:scale-90"
            style={{ width: size, height: size, background: '#00000040', boxShadow: `inset 0 0 0 1px ${TICK}33` }}>
            {fill > 0 && <span className="absolute inset-x-0 bottom-0" style={{ height: `${Math.max(fill, 0.15) * 100}%`, background: color }} />}
            {locked && <Lock className="absolute inset-0 m-auto h-[10px] w-[10px]" style={{ color: `${TICK}AA` }} strokeWidth={3} />}
        </button>
    )
}

function LessonSqs({ t, go, size }: { t: RulerTask; go: (h: string | null) => void; size?: number }) {
    if (!t.lessons.length) return <span className="text-[10px] font-bold" style={{ color: `${TICK}55` }}>скоро</span>
    return <>{t.lessons.map((l) => {
        const f = l.total ? Math.min(l.solved, l.total) / l.total : 0
        return <Sq key={l.id} size={size} fill={f} color={LIME} locked={l.proLocked && f < 1} title={`${l.title}: ${l.solved}/${l.total}`} onClick={() => go(learnHref(t.num))} />
    })}</>
}
function TopicSqs({ t, go, size }: { t: RulerTask; go: (h: string | null) => void; size?: number }) {
    if (!t.trainers.length) return <span className="text-[10px] font-bold" style={{ color: `${TICK}55` }}>скоро</span>
    return <>{t.trainers.map((k) => {
        const c = medalColor(k.percent)
        return <Sq key={k.tUnitId} size={size} fill={c ? 1 : 0} color={c ?? MEDAL.gold} locked={k.proLocked && k.percent < 100} title={`${k.title}: ${k.percent}%`} onClick={() => go(topicHref(k.title))} />
    })}</>
}

const Frame = ({ children }: { children: React.ReactNode }) => (
    <div className="w-[min(380px,100%)] rounded-2xl border p-2" style={{ background: BG, borderColor: '#272E19' }}>{children}</div>
)

/** Б. «Сетка»: два столбца — задачник и тренажёр, квадратики в одной строке с названием, как таблица. */
export function RulerGrid({ data }: { data: RulerData }) {
    const go = useGo()
    return (
        <Frame>
            <div className="flex items-center gap-2 px-1 pb-1 text-[10px] font-black uppercase tracking-wider" style={{ color: `${TICK}AA` }}>
                <span className="w-[108px]" />
                <span className="flex flex-1 items-center gap-1"><BookOpen className="h-3 w-3" style={{ color: LIME }} />Задачник</span>
                <span className="flex flex-1 items-center gap-1"><Dumbbell className="h-3 w-3" style={{ color: MEDAL.gold }} />Тренажёр</span>
            </div>
            {data.tasks.map((t) => (
                <div key={t.num} className="flex items-start gap-2 rounded-lg px-1 py-[5px] odd:bg-black/10">
                    <span className="flex w-[108px] shrink-0 items-baseline gap-1.5 pt-[1px]">
                        <span className="w-[20px] text-right font-mono text-[13px] font-black" style={{ color: TICK }}>{t.num}</span>
                        <span className="truncate text-[11px] font-bold" style={{ color: `${TICK}CC` }}>{name(t)}</span>
                    </span>
                    <span className="flex flex-1 flex-wrap gap-[4px]"><LessonSqs t={t} go={go} /></span>
                    <span className="flex flex-1 flex-wrap gap-[4px]"><TopicSqs t={t} go={go} /></span>
                </div>
            ))}
        </Frame>
    )
}

/** В. «Раскрывашка»: в строке две полоски прогресса; нажал на строку — раскрылись квадратики обоих. */
export function RulerAccordion({ data }: { data: RulerData }) {
    const go = useGo()
    const [open, setOpen] = useState<number | null>(null)
    const Bar = ({ v, n, color }: { v: number; n: number; color: string }) => (
        <span className="block h-[6px] flex-1 overflow-hidden rounded-full" style={{ background: n ? '#00000055' : '#00000022' }}>
            <span className="block h-full rounded-full" style={{ width: `${v * 100}%`, background: color }} />
        </span>
    )
    return (
        <Frame>
            {data.tasks.map((t) => {
                const isOpen = open === t.num
                return (
                    <div key={t.num} className="rounded-lg" style={isOpen ? { background: '#0004' } : undefined}>
                        <button type="button" onClick={() => setOpen(isOpen ? null : t.num)} className="flex w-full items-center gap-2 px-1.5 py-[7px] text-left">
                            <span className="w-[20px] text-right font-mono text-[13px] font-black" style={{ color: TICK }}>{t.num}</span>
                            <span className="w-[96px] shrink-0 truncate text-[11px] font-bold" style={{ color: `${TICK}CC` }}>{name(t)}</span>
                            <span className="flex flex-1 flex-col gap-[3px]">
                                <Bar v={learnProgress(t)} n={t.lessons.length} color={LIME} />
                                <Bar v={trainerProgress(t)} n={t.trainers.length} color={MEDAL.gold} />
                            </span>
                            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: `${TICK}99` }} />
                        </button>
                        {isOpen && (
                            <div className="space-y-1.5 px-2 pb-2.5 pl-[30px]">
                                <div className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: LIME }} /><span className="flex flex-wrap gap-[5px]"><LessonSqs t={t} go={go} size={22} /></span></div>
                                <div className="flex items-center gap-2"><Dumbbell className="h-3.5 w-3.5 shrink-0" style={{ color: MEDAL.gold }} /><span className="flex flex-wrap gap-[5px]"><TopicSqs t={t} go={go} size={22} /></span></div>
                            </div>
                        )}
                    </div>
                )
            })}
        </Frame>
    )
}

/** Г. «Плитки»: у каждого задания плитка с двумя большими кнопками — задачник и тренажёр, на каждой свой процент. */
export function RulerTiles({ data }: { data: RulerData }) {
    const go = useGo()
    const Btn = ({ icon, v, n, color, onClick }: { icon: React.ReactNode; v: number; n: number; color: string; onClick: () => void }) => (
        <button type="button" disabled={!n} onClick={onClick} className="relative flex flex-1 items-center justify-center gap-1 overflow-hidden rounded-md py-1.5 text-[11px] font-black disabled:opacity-35 active:scale-95"
            style={{ background: '#00000055', color: TICK, boxShadow: `inset 0 0 0 1px ${TICK}22` }}>
            <span className="absolute inset-y-0 left-0" style={{ width: `${v * 100}%`, background: `${color}55` }} />
            <span className="relative flex items-center gap-1">{icon}{n ? `${Math.round(v * 100)}%` : '—'}</span>
        </button>
    )
    return (
        <Frame>
            <div className="grid grid-cols-2 gap-2">
                {data.tasks.map((t) => {
                    const next = t.trainers.find((k) => k.percent < 100) ?? t.trainers[0]
                    return (
                        <div key={t.num} className="rounded-xl p-2" style={{ background: '#0003', boxShadow: data.setTaskNum === t.num ? `inset 0 0 0 1.5px ${MEDAL.gold}` : `inset 0 0 0 1px ${TICK}22` }}>
                            <div className="mb-1.5 flex items-baseline gap-1.5">
                                <span className="font-mono text-lg font-black leading-none" style={{ color: TICK }}>{t.num}</span>
                                <span className="truncate text-[11px] font-bold" style={{ color: `${TICK}CC` }}>{name(t)}</span>
                            </div>
                            <div className="flex gap-1.5">
                                <Btn icon={<BookOpen className="h-3.5 w-3.5" style={{ color: LIME }} />} v={learnProgress(t)} n={t.lessons.length} color={LIME} onClick={() => go(learnHref(t.num))} />
                                <Btn icon={<Dumbbell className="h-3.5 w-3.5" style={{ color: MEDAL.gold }} />} v={trainerProgress(t)} n={t.trainers.length} color={MEDAL.gold} onClick={() => next && go(topicHref(next.title))} />
                            </div>
                        </div>
                    )
                })}
            </div>
        </Frame>
    )
}
