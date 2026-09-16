'use client'

import { useEffect, useState } from 'react'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css'

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

type DropTarget = { lessonId: number; index: number } | null

// Kanban-доска вместо плоского списка — колонка на каждый t_lesson,
// перенос задачи между этапами перетаскиванием мышкой (native HTML5 DnD,
// без сторонних библиотек). Перетаскивание сразу сохраняет результат на
// сервере (нет отдельного шага "Сохранить", как в прежней версии) —
// это и есть основное ускорение по сравнению со старым select+число+кнопка
// на каждую строку.
export function UnitChallengePool({ unitId }: { unitId: number }) {
  const [lessons, setLessons] = useState<TLesson[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [dragId, setDragId] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget>(null)
  const [moving, setMoving] = useState(false)
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null)
  const [duplicateOpenId, setDuplicateOpenId] = useState<number | null>(null)

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
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId])

  const challengesByLesson = (lessonId: number) =>
    challenges.filter((c) => c.t_lessonId === lessonId).sort((a, b) => a.order - b.order)

  // Дубль задачи в другой этап — в отличие от переноса (drag&drop),
  // исходная задача остаётся на месте, появляется независимая копия.
  const duplicate = async (challengeId: number, targetLessonId: number) => {
    setDuplicatingId(challengeId)
    setDuplicateOpenId(null)
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

  const handleDrop = async (targetLessonId: number, dropIndex: number) => {
    const draggedId = dragId
    setDragId(null)
    setDropTarget(null)
    if (draggedId == null) return
    const dragged = challenges.find((c) => c.id === draggedId)
    if (!dragged) return

    // Итоговый порядок карточек в целевом уроке: всё, что там уже было
    // (кроме самой перетаскиваемой, если она уже там была), плюс сама
    // перетаскиваемая — вставленная на позицию dropIndex.
    const targetList = challengesByLesson(targetLessonId).filter((c) => c.id !== draggedId)
    const clampedIndex = Math.max(0, Math.min(dropIndex, targetList.length))
    targetList.splice(clampedIndex, 0, dragged)

    // В PUT идут только реально изменившиеся записи — не трогаем то, что
    // и так стояло на своём месте.
    const updates: { id: number; lessonId: number; order: number }[] = []
    targetList.forEach((c, i) => {
      const desiredOrder = i + 1
      if (c.t_lessonId !== targetLessonId || c.order !== desiredOrder) {
        updates.push({ id: c.id, lessonId: targetLessonId, order: desiredOrder })
      }
    })

    if (updates.length === 0) return

    // Оптимистичное обновление — карточки сразу встают на новые места, не
    // дожидаясь ответа сервера.
    setChallenges((prev) =>
      prev.map((c) => {
        const u = updates.find((u) => u.id === c.id)
        return u ? { ...c, t_lessonId: u.lessonId, order: u.order } : c
      })
    )

    setMoving(true)
    try {
      await Promise.all(
        updates.map((u) =>
          fetch(`/api/admin/t-challenges/${u.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lessonId: u.lessonId, order: u.order }),
          })
        )
      )
    } catch (err) {
      console.error(err)
    } finally {
      setMoving(false)
      await load()
    }
  }

  if (loading) {
    return <div className="text-[#9AA7B0]">Загрузка пула задач...</div>
  }

  if (lessons.length === 0) {
    return <div className="text-[#9AA7B0] text-sm">В юните пока нет этапов (t_lessons) — добавьте хотя бы один слева.</div>
  }

  return (
    <div className="relative h-full">
      {duplicateOpenId != null && (
        <div className="fixed inset-0 z-10" onClick={() => setDuplicateOpenId(null)} />
      )}

      {moving && (
        <div className="absolute top-0 right-0 z-20 text-[10px] text-[#9AA7B0] bg-[#161F23] border border-[#3A464E] rounded px-2 py-0.5">
          сохраняю...
        </div>
      )}

      <div className="flex gap-2 h-full overflow-x-auto pb-1">
        {lessons.map((lesson) => {
          const list = challengesByLesson(lesson.id)
          const isDropLesson = dropTarget?.lessonId === lesson.id

          return (
            <div
              key={lesson.id}
              className="flex flex-col w-64 flex-shrink-0 bg-[#232F34] border border-[#3A464E] rounded-lg overflow-hidden h-full"
              onDragOver={(e) => {
                e.preventDefault()
                setDropTarget({ lessonId: lesson.id, index: list.length })
              }}
              onDrop={(e) => {
                e.preventDefault()
                const idx = dropTarget?.lessonId === lesson.id ? dropTarget.index : list.length
                handleDrop(lesson.id, idx)
              }}
            >
              <div className="px-2.5 py-2 border-b border-[#3A464E] bg-[#1B242A] flex items-center justify-between flex-shrink-0">
                <h4 className="text-white font-semibold text-xs truncate" title={lesson.title}>
                  {lesson.title}
                </h4>
                <span className="text-[#5A6A72] text-[11px] flex-shrink-0 ml-1">{list.length}</span>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-1.5 space-y-1">
                {list.length === 0 && (
                  <div
                    className={`text-center text-[#5A6A72] text-[11px] py-6 rounded border-2 border-dashed transition ${
                      isDropLesson ? 'border-[#5183A4] bg-[#5183A4]/10' : 'border-transparent'
                    }`}
                  >
                    {isDropLesson ? 'Отпусти сюда' : 'Пусто'}
                  </div>
                )}

                {list.map((challenge, index) => (
                  <div key={challenge.id}>
                    {isDropLesson && dropTarget!.index === index && (
                      <div className="h-0.5 bg-[#5183A4] rounded-full my-0.5" />
                    )}
                    <div
                      draggable
                      onDragStart={(e) => {
                        setDragId(challenge.id)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragEnd={() => {
                        setDragId(null)
                        setDropTarget(null)
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const rect = e.currentTarget.getBoundingClientRect()
                        const before = e.clientY < rect.top + rect.height / 2
                        setDropTarget({ lessonId: lesson.id, index: before ? index : index + 1 })
                      }}
                      className={`group relative bg-[#161F23] border rounded p-1.5 text-[11px] cursor-grab active:cursor-grabbing transition ${
                        dragId === challenge.id ? 'opacity-30' : 'border-[#3A464E] hover:border-[#5183A4]'
                      }`}
                    >
                      <div className="flex items-start gap-1.5">
                        <span className="text-[#5A6A72] flex-shrink-0 select-none">#{challenge.id}</span>
                        {/* KaTeX вместо сырого текста ($...$/\huge и т.п. как
                          в БД) — та же связка react-latex-next+katex.css, что
                          уже используется в превью формы (challenge-preview.tsx)
                          и в самом задачнике. max-h+overflow-hidden вместо
                          line-clamp — line-clamp на инлайновом KaTeX-выводе
                          обрезает непредсказуемо (может обрубить формулу
                          посередине глифа), обрезка по высоте безопаснее. */}
                        <div
                          className="text-white flex-1 min-w-0 max-h-[54px] overflow-hidden leading-snug"
                          title={challenge.question}
                        >
                          <Latex>{challenge.question}</Latex>
                        </div>
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDuplicateOpenId(duplicateOpenId === challenge.id ? null : challenge.id)
                            }}
                            disabled={duplicatingId === challenge.id}
                            className="text-[#5A6A72] hover:text-white px-1 disabled:opacity-30"
                            title="Копировать в другой этап (оригинал останется на месте)"
                          >
                            {duplicatingId === challenge.id ? '…' : '📋'}
                          </button>
                          {duplicateOpenId === challenge.id && (
                            <div className="absolute right-0 top-5 z-20 bg-[#232F34] border border-[#3A464E] rounded shadow-lg py-1 w-44 max-h-48 overflow-y-auto">
                              {lessons
                                .filter((l) => l.id !== lesson.id)
                                .map((l) => (
                                  <button
                                    key={l.id}
                                    onClick={() => duplicate(challenge.id, l.id)}
                                    className="block w-full text-left px-2 py-1 text-[11px] text-[#9AA7B0] hover:bg-[#2A3A42] hover:text-white truncate"
                                  >
                                    {l.title}
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {isDropLesson && dropTarget!.index === list.length && list.length > 0 && (
                  <div className="h-0.5 bg-[#5183A4] rounded-full my-0.5" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
