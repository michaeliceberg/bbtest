'use client'

import { useEffect, useState } from 'react'
import { Target, Zap } from 'lucide-react'

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

  const loadChallenges = async () => {
    try {
      const res = await fetch(`/api/admin/t-challenges?lessonId=${lessonId}`)
      const data = await res.json()
      setChallenges(data)
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!lessonId) {
      setChallenges([])
      return
    }

    loadChallenges()
  }, [lessonId])

  if (loading) {
    return <div className="text-[#9AA7B0]">Загрузка...</div>
  }

  if (challenges.length === 0) {
    return (
      <div className="text-[#9AA7B0] text-sm">
        Нет задач. Добавьте новую в форме справа ➡️
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      <h3 className="text-white font-semibold text-sm mb-3">Загруженные задачи ({challenges.length})</h3>
      {challenges.map((challenge) => (
        <div
          key={challenge.id}
          className="bg-[#232F34] border border-[#3A464E] rounded-lg p-3 hover:bg-[#2A3A42] transition"
        >
          <div className="flex-1 min-w-0 mb-2">
            <p className="text-white font-semibold text-xs line-clamp-2">
              {challenge.question.substring(0, 70)}
              {challenge.question.length > 70 ? '...' : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#9AA7B0]">
            <span className="font-medium text-white">#{challenge.id}</span>
            <span className="text-[#5A6A72]">•</span>
            <span className="text-[#5A6A72]">order:{challenge.order}</span>
            <span className="text-[#5A6A72]">•</span>
            <div className="flex items-center gap-1">
              <Target size={12} className="text-[#5183A4]" />
              <span>{challenge.type}</span>
            </div>
            <span className="text-[#5A6A72]">•</span>
            <div className="flex items-center gap-1">
              <Zap size={12} className="text-[#C8524E]" />
              <span>{challenge.points} pts</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
