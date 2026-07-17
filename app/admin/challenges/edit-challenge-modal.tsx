"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

const CHALLENGE_TYPES = [
  "ASSIST",
  "SELECT",
  "CONNECT",
  "SLIDER",
  "CONSTRUCT",
  "WORKBOOK",
  "R ASSIST",
  "R CONNECT",
  "R SLIDER",
  "GEOSIN",
  "RUSSIANDICTANT",
  "SWIPE",
]

interface ChallengeOption {
  id: number
  text: string
  correct: boolean
}

interface Challenge {
  id: number
  question: string
  type: string
  author: string
  difficulty: string
  points: number
  options?: ChallengeOption[]
}

export function EditChallengeModal({
  challengeId,
  isOpen,
  onClose,
  onSave,
}: {
  challengeId: number
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}) {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [options, setOptions] = useState<ChallengeOption[]>([])

  useEffect(() => {
    if (isOpen && challengeId) {
      loadChallenge()
    }
  }, [isOpen, challengeId])

  const loadChallenge = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/challenges/${challengeId}`)
      const data = await res.json()
      setChallenge(data)
      setOptions(data.options || [])
    } catch (err) {
      console.error(err)
      alert("Ошибка при загрузке задачи")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!challenge) return
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/challenges/${challengeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...challenge,
          options: options.filter((o) => o.text.trim()),
        }),
      })

      if (res.ok) {
        alert("✅ Задача обновлена!")
        onClose()
        onSave()
      } else {
        alert("❌ Ошибка при обновлении")
      }
    } catch (err) {
      console.error(err)
      alert("❌ Ошибка")
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#161F23] rounded-lg p-6 w-full max-w-md">
          <p className="text-white">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!challenge) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-[#161F23] rounded-lg p-4 w-full max-w-3xl h-screen max-h-[95vh] flex flex-col overflow-hidden">
        <h2 className="text-lg font-bold text-white mb-3">
          Редактирование #{challenge.id}
        </h2>

        <div className="space-y-3 overflow-y-auto flex-1 pr-2">
          <div>
            <label className="block text-white font-semibold mb-1 text-sm">Вопрос</label>
            <textarea
              value={challenge.question}
              onChange={(e) =>
                setChallenge({ ...challenge, question: e.target.value })
              }
              className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-3 py-2 text-white placeholder-[#5A6A72] text-sm h-16"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-1 text-sm">Тип</label>
            <select
              value={challenge.type}
              onChange={(e) =>
                setChallenge({ ...challenge, type: e.target.value })
              }
              className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-3 py-2 text-white text-sm"
            >
              {CHALLENGE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white font-semibold mb-1 text-xs">Сложность</label>
              <input
                type="text"
                value={challenge.difficulty}
                onChange={(e) =>
                  setChallenge({ ...challenge, difficulty: e.target.value })
                }
                className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-2 py-1.5 text-white placeholder-[#5A6A72] text-xs"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-1 text-xs">Баллы</label>
              <input
                type="number"
                value={challenge.points}
                onChange={(e) =>
                  setChallenge({ ...challenge, points: Number(e.target.value) })
                }
                min="1"
                className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-2 py-1.5 text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-white font-semibold mb-1 text-xs">Автор</label>
            <input
              type="text"
              value={challenge.author}
              onChange={(e) =>
                setChallenge({ ...challenge, author: e.target.value })
              }
              className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-3 py-1.5 text-white placeholder-[#5A6A72] text-xs"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2 text-xs">Варианты ответов</label>
            <div className="space-y-2">
              {options.map((option, idx) => (
                <div key={option.id} className="flex gap-2 items-start">
                  <button
                    onClick={() => {
                      const newOptions = [...options]
                      newOptions[idx].correct = !newOptions[idx].correct
                      setOptions(newOptions)
                    }}
                    className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap flex-shrink-0 ${
                      option.correct
                        ? "bg-green-500/20 text-green-400 border border-green-500"
                        : "bg-red-500/20 text-red-400 border border-red-500"
                    }`}
                  >
                    {option.correct ? "✓" : "✗"}
                  </button>
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => {
                      const newOptions = [...options]
                      newOptions[idx].text = e.target.value
                      setOptions(newOptions)
                    }}
                    placeholder={`Вариант ${idx + 1}...`}
                    className="flex-1 bg-[#232F34] border border-[#3A464E] rounded-lg px-2 py-1.5 text-white placeholder-[#5A6A72] text-xs"
                  />
                  <button
                    onClick={() => {
                      const newOptions = options.filter((_, i) => i !== idx)
                      setOptions(newOptions)
                    }}
                    className="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 text-xs flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setOptions([
                  ...options,
                  { id: Date.now(), text: "", correct: false },
                ])
              }}
              className="mt-2 px-3 py-1.5 bg-[#5183A4] hover:bg-[#4A7A97] text-white rounded text-xs"
            >
              ➕ Добавить вариант
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-4 justify-end pt-3 border-t border-[#3A464E]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#232F34] hover:bg-[#2A3A42] text-white rounded-lg text-sm"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-[#5183A4] hover:bg-[#4A7A97] text-white rounded-lg disabled:opacity-50 text-sm"
          >
            {saving ? "⏳ Сохраняю..." : "💾 Сохранить"}
          </button>
        </div>
      </div>
    </div>
  )
}
