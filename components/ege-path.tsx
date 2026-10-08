'use client'

// components/ege-path.tsx
//
// Экран «Мой путь к ЕГЭ»: прогноз ↔ цель, копилка первичных баллов, «что решать сегодня»
// и дорожка из станций-заданий экзамена. Данные считает lib/egeMap.ts на сервере.

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, ChevronDown, Dumbbell, Swords, Target, Flag } from 'lucide-react'
import { setEgeTarget } from '@/actions/ege-target'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import type { EgeMap, EgeStation } from '@/lib/egeMap'
import { cn } from '@/lib/utils'

const GOALS = [60, 70, 80, 90, 100]
const masteryColor = (m: number) =>
    m >= 0.9 ? GGEGE_PALETTE.green.button : m >= 0.5 ? GGEGE_PALETTE.blue.button : m > 0 ? GGEGE_PALETTE.orange.button : '#4A5860'
const fmt = (x: number) => (Math.round(x * 10) / 10).toString().replace('.', ',')
const ballsWord = (x: number) => {
    const n = Math.round(x * 10) / 10
    if (!Number.isInteger(n)) return 'балла'
    const m10 = n % 10, m100 = n % 100
    if (m10 === 1 && m100 !== 11) return 'балл'
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'балла'
    return 'баллов'
}

const Ring = ({ value, color, num, soon }: { value: number; color: string; num: number; soon: boolean }) => {
    const r = 21, c = 2 * Math.PI * r
    return (
        <div className="relative h-14 w-14 shrink-0">
            <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
                <circle cx={28} cy={28} r={r} fill="#161F23" stroke="#2A363C" strokeWidth={6} />
                {!soon && (
                    <motion.circle cx={28} cy={28} r={r} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"
                        strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value) }}
                        transition={{ duration: 1, ease: 'easeOut' }} />
                )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                {soon ? <Lock className="h-4 w-4 text-[#5C6B73]" /> : <span className="text-base font-black text-[#F2F7FB]">{num}</span>}
            </div>
        </div>
    )
}

const StationCard = ({ s, open, onToggle }: { s: EgeStation; open: boolean; onToggle: () => void }) => {
    const soon = s.status === 'soon'
    const color = masteryColor(s.mastery)
    return (
        <div className="relative pl-1">
            <button type="button" onClick={soon ? undefined : onToggle}
                className={cn('flex w-full items-center gap-3 rounded-2xl border-2 p-2.5 text-left transition-colors',
                    soon ? 'cursor-default border-[#232F34] bg-[#131A1E]' : 'border-[#2A363C] bg-[#161F23] active:translate-y-[1px]')}>
                <Ring value={s.mastery} color={color} num={s.num} soon={soon} />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className={cn('truncate font-extrabold', soon ? 'text-[#5C6B73]' : 'text-[#F2F7FB]')}>
                            {soon ? `№${s.num} · ` : ''}{s.title}
                        </span>
                    </div>
                    {soon ? (
                        <p className="text-xs font-bold text-[#5C6B73]">Скоро · {s.points} {ballsWord(s.points)}</p>
                    ) : (
                        <>
                            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#2A363C]">
                                <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
                                    initial={{ width: 0 }} animate={{ width: `${Math.round(s.mastery * 100)}%` }} transition={{ duration: 0.9, ease: 'easeOut' }} />
                            </div>
                            <p className="mt-1 text-xs font-bold text-[#9AA7B0]">
                                В копилке <span style={{ color }}>{fmt(s.earned)}</span> из {s.points} {s.points === 1 ? 'балла' : 'баллов'}
                            </p>
                        </>
                    )}
                </div>
                {!soon && <ChevronDown className={cn('h-5 w-5 shrink-0 text-[#5C6B73] transition-transform', open && 'rotate-180')} />}
            </button>
            {open && !soon && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="mx-2 -mt-2 rounded-b-2xl border-2 border-t-0 border-[#2A363C] bg-[#131A1E] px-3 pb-3 pt-4 text-sm text-[#C9D3D9]">
                    {s.courseTarget > 0 && <p>📚 Задачник: решено <b>{s.courseSolved}</b> из {s.courseTarget}</p>}
                    {s.trainerTotal > 0 && <p>🏋️ Тренажёр: пройдено уроков <b>{s.trainerDone}</b> из {s.trainerTotal}</p>}
                    {s.trainerOnly && s.part === 2 && (
                        <p className="mt-1 text-xs text-[#9AA7B0]">Пока засчитываем до четверти баллов: теория в тренажёре есть, задачи с развёрнутым ответом — скоро.</p>
                    )}
                    <div className="mt-3 flex gap-2">
                        {s.trainerHref && (
                            <Link href={s.trainerHref} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#A1D151] py-2.5 font-bold text-[#151F24]">
                                <Dumbbell className="h-4 w-4" /> Тренажёр
                            </Link>
                        )}
                        {s.lessonHref && (
                            <Link href={s.lessonHref} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-[#3A464E] py-2 font-bold text-[#F2F7FB]">
                                <Swords className="h-4 w-4" /> Задачи
                            </Link>
                        )}
                        {!s.trainerHref && !s.lessonHref && <p className="text-[#A1D151] font-bold">Станция закрыта 💪</p>}
                    </div>
                </motion.div>
            )}
        </div>
    )
}

export const EgePath = ({ map, target: initialTarget }: { map: EgeMap; target: number | null }) => {
    const [target, setTarget] = useState<number | null>(initialTarget)
    const [editing, setEditing] = useState(initialTarget === null)
    const [openNum, setOpenNum] = useState<number | null>(null)
    const [, startTransition] = useTransition()
    const chooseGoal = (g: number) => {
        setTarget(g); setEditing(false)
        startTransition(() => { setEgeTarget(g).catch(() => null) })
    }
    const left = target !== null ? Math.max(0, target - map.test) : null
    const part1 = map.stations.filter((s) => s.part === 1)
    const part2 = map.stations.filter((s) => s.part === 2)

    return (
        <div className="mx-auto w-full max-w-md px-4 pb-24 pt-6">
            <h1 className="text-2xl font-black text-[#F2F7FB]">Мой путь к ЕГЭ</h1>
            <p className="text-sm font-bold text-[#9AA7B0]">Профильная математика · 20 заданий (ЕГЭ-2027)</p>

            {/* прогноз и цель */}
            <div className="mt-4 rounded-3xl border-2 border-[#2A363C] bg-[#161F23] p-4">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-[#9AA7B0]">Прогноз</p>
                        <p className="text-4xl font-black text-[#F2F7FB]">≈{map.test}</p>
                    </div>
                    {target !== null && !editing && (
                        <button type="button" onClick={() => setEditing(true)} className="text-right">
                            <p className="text-xs font-bold uppercase tracking-wide text-[#9AA7B0]">Цель</p>
                            <p className="flex items-center justify-end gap-1 text-3xl font-black" style={{ color: GGEGE_PALETTE.purple.button }}>
                                <Flag className="h-6 w-6" />{target}
                            </p>
                        </button>
                    )}
                </div>
                <div className="relative mt-3 h-4 w-full rounded-full bg-[#2A363C]">
                    <motion.div className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${GGEGE_PALETTE.blue.button}, ${GGEGE_PALETTE.green.button})` }}
                        initial={{ width: 0 }} animate={{ width: `${map.test}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} />
                    {target !== null && (
                        <div className="absolute -top-1.5 h-7 w-1.5 rounded-full" style={{ left: `calc(${target}% - 3px)`, backgroundColor: GGEGE_PALETTE.purple.button }} />
                    )}
                </div>
                <p className="mt-2 text-sm font-bold text-[#C9D3D9]">
                    Копилка: <span className="text-[#F2F7FB]">{fmt(map.primary)}</span> из {map.primaryMax} первичных баллов
                    {left !== null && !editing && (left > 0
                        ? <> · до цели <span style={{ color: GGEGE_PALETTE.purple.button }}>+{left}</span></>
                        : <> · цель достигнута 🎉</>)}
                </p>
                {editing && (
                    <div className="mt-3">
                        <p className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-[#F2F7FB]"><Target className="h-4 w-4" /> На какой балл хочешь сдать?</p>
                        <div className="grid grid-cols-5 gap-2">
                            {GOALS.map((g) => (
                                <button key={g} type="button" onClick={() => chooseGoal(g)}
                                    className="rounded-xl border-2 py-2 font-black"
                                    style={{ borderColor: target === g ? GGEGE_PALETTE.purple.button : '#3A464E', color: target === g ? GGEGE_PALETTE.purple.button : '#F2F7FB', backgroundColor: target === g ? hexToRgba(GGEGE_PALETTE.purple.button, 0.15) : 'transparent' }}>
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <p className="mt-3 text-[11px] leading-snug text-[#5C6B73]">
                    Прогноз — ориентир по тому, что ты уже решил в тренажёре и задачнике. Тестовый балл посчитан по шкале 2026 года: шкалу 2027 ещё не опубликовали.
                </p>
            </div>

            {/* следующий ход: две парящие плитки */}
            {map.move && (() => {
                const mv = map.move
                const gain = mv.toTest - mv.fromTest
                return (
                    <div className="mt-4 rounded-3xl border-2 p-4" style={{ borderColor: hexToRgba(GGEGE_PALETTE.orange.button, 0.6), backgroundColor: hexToRgba(GGEGE_PALETTE.orange.button, 0.07) }}>
                        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: GGEGE_PALETTE.orange.button }}>Твой следующий ход</p>
                        <div className="relative mt-2 flex h-40 items-end justify-between px-4">
                            {/* дуга прыжка */}
                            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 300 160" preserveAspectRatio="none">
                                <path d="M80,92 C130,10 170,10 220,62" fill="none" stroke={GGEGE_PALETTE.orange.button} strokeWidth={3} strokeDasharray="6 7" strokeLinecap="round" />
                                <path d="M208,56 L221,63 L214,49" fill="none" stroke={GGEGE_PALETTE.orange.button} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="animate-tile-float flex flex-col items-center">
                                <span className="mb-1 text-3xl">🧍</span>
                                <div className="flex h-14 w-24 items-center justify-center rounded-2xl text-2xl font-black text-[#F2F7FB]"
                                    style={{ background: 'linear-gradient(180deg, #3A4A52, #26323A)', boxShadow: '0 6px 0 #1A2328, 0 14px 22px rgba(0,0,0,0.45)' }}>
                                    ≈{mv.fromTest}
                                </div>
                                <span className="mt-2 text-[11px] font-bold text-[#9AA7B0]">ты сейчас</span>
                            </div>
                            <div className="animate-tile-float-late mb-10 flex flex-col items-center">
                                <div className="flex h-14 w-24 items-center justify-center rounded-2xl border-2 border-dashed text-2xl font-black"
                                    style={{ borderColor: GGEGE_PALETTE.green.button, color: GGEGE_PALETTE.green.button, backgroundColor: hexToRgba(GGEGE_PALETTE.green.button, 0.12), boxShadow: '0 14px 22px rgba(0,0,0,0.35)' }}>
                                    ≈{mv.toTest}
                                </div>
                                <span className="mt-2 text-[11px] font-bold" style={{ color: GGEGE_PALETTE.green.button }}>{gain > 0 ? `+${gain} к прогнозу` : 'следующая плитка'}</span>
                            </div>
                        </div>
                        <p className="mt-1 text-base font-black text-[#F2F7FB]">Задание №{mv.station.num} · {mv.station.title}</p>
                        <p className="text-xs font-bold text-[#9AA7B0]">Сделай — и прыгай на следующую плитку:</p>
                        <div className="mt-2 flex flex-col gap-2">
                            {mv.trainerLesson && (
                                <Link href={mv.trainerLesson.href} className="flex items-center gap-3 rounded-xl border-2 border-[#2A363C] bg-[#161F23] px-3 py-2.5 active:translate-y-[1px]">
                                    <Dumbbell className="h-5 w-5 shrink-0 text-[#A1D151]" />
                                    <span className="min-w-0 flex-1 text-sm font-bold text-[#F2F7FB]">1 урок тренажёра: <span className="text-[#C9D3D9]">{mv.trainerLesson.title}</span></span>
                                    <span className="rounded-lg bg-[#A1D151] px-2.5 py-1 text-xs font-black text-[#151F24]">Начать</span>
                                </Link>
                            )}
                            {mv.tasks && (
                                <Link href={mv.tasks.href} className="flex items-center gap-3 rounded-xl border-2 border-[#2A363C] bg-[#161F23] px-3 py-2.5 active:translate-y-[1px]">
                                    <Swords className="h-5 w-5 shrink-0 text-[#53ADEF]" />
                                    <span className="min-w-0 flex-1 text-sm font-bold text-[#F2F7FB]">{mv.tasks.count} задач из задачника: <span className="text-[#C9D3D9]">{mv.tasks.title}</span></span>
                                    <span className="rounded-lg border-2 border-[#3A464E] px-2.5 py-0.5 text-xs font-black text-[#F2F7FB]">Решать</span>
                                </Link>
                            )}
                        </div>
                    </div>
                )
            })()}

            {/* дорожка */}
            {[{ title: 'Часть 1 · краткий ответ', list: part1 }, { title: 'Часть 2 · развёрнутый ответ', list: part2 }].map((grp) => (
                <div key={grp.title} className="mt-6">
                    <p className="mb-2 text-sm font-extrabold uppercase tracking-wide text-[#9AA7B0]">{grp.title}</p>
                    <div className="relative flex flex-col gap-2">
                        <div className="absolute bottom-6 left-[34px] top-6 w-1 rounded-full bg-[#232F34]" />
                        {grp.list.map((s) => (
                            <StationCard key={s.num} s={s} open={openNum === s.num} onToggle={() => setOpenNum(openNum === s.num ? null : s.num)} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
