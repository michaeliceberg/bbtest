'use client'

// Страница-обзор задач одной темы тренажёра (t_unit) — все t_challenges
// всех t_lessons темы, отрендеренные последовательно сверху вниз,
// сгруппированные по этапу (t_lesson), так, как их видит пользователь
// (текст вопроса + варианты ответа, верный подсвечен), с возможностью
// перенести задачу в другой этап. Задумано под задачу "переорганизовать
// задания тренажёра, глядя на них глазами ученика", а не через голый
// текст-превью, как в уже существующем UnitChallengePool
// (app/admin/t-challenges/unit-challenge-pool.tsx).

import { useState } from 'react'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css'
import { cn } from '@/lib/utils'

interface TOption {
    id: number
    text: string
    correct: boolean
}

interface TChallenge {
    id: number
    question: string
    type: string
    order: number
    points: number
    t_lessonId: number
    t_challengeOptions: TOption[]
}

interface TLessonMeta {
    id: number
    title: string
    order: number
}

interface Props {
    unitTitle: string
    lessons: TLessonMeta[]
    initialChallenges: TChallenge[]
}

export function ReviewList({ unitTitle, lessons, initialChallenges }: Props) {
    const [challenges, setChallenges] = useState<TChallenge[]>(initialChallenges)
    // Значение <select> для каждой карточки — отдельно от challenges,
    // чтобы можно было выбрать новый этап и увидеть кнопку "Перенести"
    // активной ДО того, как перенос реально сохранён.
    const [selectValues, setSelectValues] = useState<Record<number, number>>({})
    const [savingId, setSavingId] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    const getSelectValue = (c: TChallenge) => selectValues[c.id] ?? c.t_lessonId

    const move = async (c: TChallenge) => {
        const targetLessonId = getSelectValue(c)
        if (targetLessonId === c.t_lessonId) return

        setSavingId(c.id)
        setError(null)
        try {
            const targetSiblings = challenges.filter((x) => x.t_lessonId === targetLessonId)
            const nextOrder = targetSiblings.length > 0
                ? Math.max(...targetSiblings.map((x) => x.order)) + 1
                : 1

            const res = await fetch(`/api/admin/t-challenges/${c.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId: targetLessonId, order: nextOrder }),
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)

            setChallenges((prev) =>
                prev.map((x) => (x.id === c.id ? { ...x, t_lessonId: targetLessonId, order: nextOrder } : x))
            )
        } catch (err) {
            console.error(err)
            setError(`Не удалось перенести задачу #${c.id}`)
        } finally {
            setSavingId(null)
        }
    }

    const sortedLessons = [...lessons].sort((a, b) => a.order - b.order)

    return (
        <div className="max-w-2xl mx-auto pb-24">
            {error && (
                <div className="sticky top-0 z-20 mb-4 bg-red-500/15 border border-red-500 text-red-300 text-sm rounded-lg px-4 py-2">
                    {error}
                </div>
            )}

            {sortedLessons.map((lesson) => {
                const lessonChallenges = challenges
                    .filter((c) => c.t_lessonId === lesson.id)
                    .sort((a, b) => a.order - b.order)

                return (
                    <section key={lesson.id} className="mb-8">
                        <div className="sticky top-0 z-10 -mx-6 px-6 py-2.5 bg-[#0F1419]/95 backdrop-blur border-b border-[#232F34] flex items-baseline gap-2">
                            <h2 className="text-white font-bold text-base">{lesson.title}</h2>
                            <span className="text-[#5A6A72] text-xs">
                                этап {lesson.order} · {lessonChallenges.length} задач
                            </span>
                        </div>

                        {lessonChallenges.length === 0 ? (
                            <p className="text-[#5A6A72] text-sm mt-3">Пусто</p>
                        ) : (
                            <div className="flex flex-col gap-3 mt-3">
                                {lessonChallenges.map((c) => {
                                    const dirty = getSelectValue(c) !== c.t_lessonId
                                    return (
                                        <div
                                            key={c.id}
                                            className={cn(
                                                'rounded-xl border p-4 bg-[#161F23]',
                                                dirty ? 'border-[#EF9F27]' : 'border-[#3A464E]'
                                            )}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[#5A6A72] text-xs flex-shrink-0">#{c.id}</span>
                                                <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#232F34] text-[#9AA7B0] flex-shrink-0">
                                                    {c.type}
                                                </span>
                                            </div>

                                            <div className="text-[#F2F7FB] font-medium text-sm leading-relaxed mb-3">
                                                <Latex>{c.question}</Latex>
                                            </div>

                                            {c.t_challengeOptions.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                                    {c.t_challengeOptions.map((o) => (
                                                        <div
                                                            key={o.id}
                                                            className={cn(
                                                                'px-3 py-2 rounded-lg border text-sm',
                                                                o.correct
                                                                    ? 'bg-green-500/10 border-green-500 text-green-400'
                                                                    : 'bg-[#232F34] border-[#3A464E] text-[#C7D1D6]'
                                                            )}
                                                        >
                                                            <Latex>{o.text}</Latex>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-[#5A6A72] text-xs mb-3">
                                                    Особый тип «{c.type}» — данные не в вариантах ответа, здесь не показаны.
                                                </p>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={getSelectValue(c)}
                                                    onChange={(e) =>
                                                        setSelectValues((prev) => ({ ...prev, [c.id]: Number(e.target.value) }))
                                                    }
                                                    className="bg-[#232F34] border border-[#3A464E] rounded-lg px-2 py-1.5 text-sm text-white"
                                                >
                                                    {sortedLessons.map((l) => (
                                                        <option key={l.id} value={l.id}>
                                                            {l.title}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => move(c)}
                                                    disabled={!dirty || savingId === c.id}
                                                    className="px-3 py-1.5 rounded-lg bg-[#5183A4] hover:bg-[#4A7A97] disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                                                >
                                                    {savingId === c.id ? 'Переношу…' : 'Перенести'}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </section>
                )
            })}
        </div>
    )
}
