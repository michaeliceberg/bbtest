'use client'

import { useEffect, useState } from 'react'

interface TLesson {
  id: number
  title: string
  order: number
  t_unitId: number
}

interface Challenge {
  id: number
  order: number
  question: string
  type: string
  points: number
  t_lessonId: number
}

export function UnitChallengePool({ unitId }: { unitId: number }) {
  const [lessons, setLessons] = useState<TLesson[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  // Локальные несохранённые правки: challengeId -> {lessonId, order}
  const [pending, setPending] = useState<Record<number, { lessonId: number; order: number }>>({})
  const [savingId, setSavingId] = useState<number | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [lessonsRes, challengesRes] = await Promise.all([
        fetch(`/api/admin/t-lessons?unitId=${unitId}`),
        fetch(`/api/admin/t-challenges?unitId=${unitId}`),
      ])
      const lessonsData: TLesson[] = await lessonsRes.json()
      const challengesData: Challenge[] = await challengesRes.json()
      setLessons([...lessonsData].sort((a, b) => a.order - b.order))
      setChallenges(challengesData)
      setPending({})
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [unitId])

  const getPending = (challenge: Challenge) => pending[challenge.id] ?? { lessonId: challenge.t_lessonId, order: challenge.order }

  const setPendingField = (challengeId: number, field: 'lessonId' | 'order', value: number) => {
    setPending((prev) => {
      const current = prev[challengeId] ?? {
        lessonId: challenges.find((c) => c.id === challengeId)!.t_lessonId,
        order: challenges.find((c) => c.id === challengeId)!.order,
      }
      return { ...prev, [challengeId]: { ...current, [field]: value } }
    })
  }

  const isDirty = (challenge: Challenge) => {
    const p = pending[challenge.id]
    if (!p) return false
    return p.lessonId !== challenge.t_lessonId || p.order !== challenge.order
  }

  const save = async (challenge: Challenge) => {
    const p = getPending(challenge)
    setSavingId(challenge.id)
    try {
      await fetch(`/api/admin/t-challenges/${challenge.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: p.lessonId, order: p.order }),
      })
      await load()
    } catch (err) {
      console.error(err)
    } finally {
      setSavingId(null)
    }
  }

  // Дубль задачи в другой этап — в отличие от save() (переноса), исходная
  // задача остаётся на месте, появляется независимая копия во втором уроке.
  const duplicate = async (challengeId: number, targetLessonId: number) => {
    setDuplicatingId(challengeId)
    try {
      await fetch(`/api/admin/t-challenges/${challengeId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: targetLessonId }),
      })
      await load()
    } catch (err) {
      console.error(err)
    } finally {
      setDuplicatingId(null)
    }
  }

  if (loading) {
    return <div className="text-[#9AA7B0]">Загрузка пула задач...</div>
  }

  if (lessons.length === 0) {
    return <div className="text-[#9AA7B0] text-sm">В юните пока нет этапов (t_lessons) — добавьте хотя бы один слева.</div>
  }

  return (
    <div className="space-y-4">
      {lessons.map((lesson) => {
        const lessonChallenges = challenges
          .filter((c) => getPending(c).lessonId === lesson.id)
          .sort((a, b) => getPending(a).order - getPending(b).order)

        return (
          <div key={lesson.id} className="bg-[#232F34] border border-[#3A464E] rounded-lg p-3">
            <h4 className="text-white font-semibold text-sm mb-2">
              {lesson.title} <span className="text-[#5A6A72] font-normal">({lessonChallenges.length} задач)</span>
            </h4>

            {lessonChallenges.length === 0 ? (
              <p className="text-[#5A6A72] text-xs">Пусто</p>
            ) : (
              <div className="space-y-1.5">
                {lessonChallenges.map((challenge) => {
                  const p = getPending(challenge)
                  const dirty = isDirty(challenge)
                  return (
                    <div
                      key={challenge.id}
                      className={`flex items-center gap-2 rounded p-2 text-xs ${dirty ? 'bg-[#3A2F1A] border border-[#EF9F27]' : 'bg-[#161F23]'}`}
                    >
                      <span className="text-[#5A6A72] flex-shrink-0">#{challenge.id}</span>
                      <span className="text-white truncate flex-1" title={challenge.question}>
                        {challenge.question.slice(0, 60)}
                      </span>
                      <select
                        value={p.lessonId}
                        onChange={(e) => setPendingField(challenge.id, 'lessonId', Number(e.target.value))}
                        className="bg-[#232F34] border border-[#3A464E] rounded px-1.5 py-1 text-white flex-shrink-0"
                      >
                        {lessons.map((l) => (
                          <option key={l.id} value={l.id}>{l.title}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={p.order}
                        onChange={(e) => setPendingField(challenge.id, 'order', Number(e.target.value))}
                        className="bg-[#232F34] border border-[#3A464E] rounded px-1.5 py-1 text-white w-16 flex-shrink-0"
                      />
                      <button
                        onClick={() => save(challenge)}
                        disabled={!dirty || savingId === challenge.id}
                        className="px-2 py-1 rounded bg-[#5183A4] hover:bg-[#4A7A97] disabled:opacity-30 disabled:cursor-not-allowed text-white flex-shrink-0"
                      >
                        {savingId === challenge.id ? '...' : 'Сохранить'}
                      </button>
                      <select
                        value=""
                        disabled={duplicatingId === challenge.id}
                        onChange={(e) => {
                          const targetId = Number(e.target.value)
                          if (targetId) duplicate(challenge.id, targetId)
                          e.target.value = ''
                        }}
                        className="bg-[#232F34] border border-[#3A464E] rounded px-1.5 py-1 text-[#9AA7B0] flex-shrink-0"
                        title="Скопировать эту задачу в другой этап (исходная останется на месте)"
                      >
                        <option value="">{duplicatingId === challenge.id ? '...' : '📋 Копировать в...'}</option>
                        {lessons.map((l) => (
                          <option key={l.id} value={l.id}>{l.title}</option>
                        ))}
                      </select>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
