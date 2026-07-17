"use client"

import { useEffect, useState, useCallback } from "react"
import { EditChallengeModal } from "./edit-challenge-modal"
import { Target, Zap } from "lucide-react"

interface Challenge {
  id: number
  order: number
  question: string
  type: string
  points: number
}

export function ChallengeList({ lessonId }: { lessonId: number }) {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadChallenges = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/challenges?lessonId=${lessonId}`)
      const data = await res.json()
      setChallenges(data)
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }, [lessonId])

  useEffect(() => {
    if (!lessonId) {
      setChallenges([])
      return
    }

    loadChallenges()
  }, [lessonId, loadChallenges])

  if (loading) {
    return <div className="text-[#9AA7B0]">Загрузка...</div>
  }

  if (challenges.length === 0) {
    return (
      <div className="text-[#9AA7B0] text-sm">
        Нет задач. Добавьте новую на вкладке "✏️ Новая задача"
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="bg-[#232F34] border border-[#3A464E] rounded-lg p-3 hover:bg-[#2A3A42] transition"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm line-clamp-2">
                  {challenge.question.substring(0, 70)}
                  {challenge.question.length > 70 ? "..." : ""}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingId(challenge.id)
                  setIsModalOpen(true)
                }}
                className="px-3 py-1.5 bg-[#5183A4] hover:bg-[#4A7A97] text-white text-xs rounded whitespace-nowrap flex-shrink-0"
              >
                ✏️ Редактировать
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#9AA7B0]">
              <span className="font-medium text-white">#{challenge.order}</span>
              <span className="text-[#5A6A72]">•</span>
              <div className="flex items-center gap-1">
                <Target size={14} className="text-[#5183A4]" />
                <span>{challenge.type}</span>
              </div>
              <span className="text-[#5A6A72]">•</span>
              <div className="flex items-center gap-1">
                <Zap size={14} className="text-[#C8524E]" />
                <span>{challenge.points} баллов</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingId && (
        <EditChallengeModal
          challengeId={editingId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={() => loadChallenges()}
        />
      )}
    </>
  )
}
