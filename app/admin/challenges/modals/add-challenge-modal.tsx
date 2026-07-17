"use client"

import { useState } from "react"
import { ChallengePreview } from "../challenge-preview"
import type { FormData } from "../challenge-form"

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

export function AddChallengeModal({
  lessonId,
  isOpen,
  onClose,
  onSave,
}: {
  lessonId: number
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState<FormData>({
    question: "",
    type: "ASSIST",
    author: "",
    difficulty: "",
    points: 10,
    options: [
      { text: "", correct: true },
      { text: "", correct: false },
      { text: "", correct: false },
      { text: "", correct: false },
      { text: "", correct: false },
      { text: "", correct: false },
    ],
  })

  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!formData.question.trim()) {
      alert("Введите вопрос")
      return
    }

    const validOptions = formData.options.filter((o) => o.text.trim())
    if (validOptions.length < 2) {
      alert("Нужно минимум 2 варианта ответов")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/admin/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          ...formData,
          options: validOptions,
        }),
      })

      if (res.ok) {
        alert("✅ Задача добавлена!")
        setFormData({
          question: "",
          type: "ASSIST",
          author: "",
          difficulty: "",
          points: 10,
          options: [
            { text: "", correct: true },
            { text: "", correct: false },
            { text: "", correct: false },
            { text: "", correct: false },
            { text: "", correct: false },
            { text: "", correct: false },
          ],
        })
        onSave()
        onClose()
      } else {
        alert("❌ Ошибка при добавлении задачи")
      }
    } catch (err) {
      console.error(err)
      alert("❌ Ошибка")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-[#161F23] rounded-lg w-full max-w-4xl my-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Левая сторона: Форма */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Добавить задачу</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">Вопрос</label>
                <textarea
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  placeholder="Введите вопрос..."
                  className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-4 py-2 text-white placeholder-[#5A6A72] h-20"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Тип</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-4 py-2 text-white"
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
                  <label className="block text-white font-semibold mb-2 text-sm">
                    Сложность
                  </label>
                  <input
                    type="text"
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData({ ...formData, difficulty: e.target.value })
                    }
                    placeholder="Средняя..."
                    className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5A6A72]"
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-2 text-sm">
                    Баллы
                  </label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        points: Number(e.target.value),
                      })
                    }
                    min="1"
                    className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2 text-sm">
                  Автор (опц)
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                  placeholder="Имя автора..."
                  className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-3 py-2 text-xs text-white placeholder-[#5A6A72]"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2 text-sm">
                  Варианты ответов
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {formData.options.map((option, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${
                          option.correct
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {option.correct ? "✓" : "✗"}
                      </span>
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => {
                          const newOptions = [...formData.options]
                          newOptions[idx].text = e.target.value
                          setFormData({ ...formData, options: newOptions })
                        }}
                        placeholder={`Вариант ${idx + 1}...`}
                        className="flex-1 bg-[#232F34] border border-[#3A464E] rounded px-2 py-1 text-xs text-white placeholder-[#5A6A72]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Правая сторона: Preview */}
          <div className="sticky top-6 h-fit">
            <div className="bg-[#232F34] border border-[#3A464E] rounded-lg p-4">
              <h3 className="text-white font-bold mb-3 text-sm">📱 Preview</h3>
              <div className="bg-[#0F1419] rounded-lg p-3 text-sm">
                <ChallengePreview data={formData} />
              </div>
            </div>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 p-6 pt-0 justify-end border-t border-[#3A464E]">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#232F34] hover:bg-[#2A3A42] text-white rounded-lg text-sm"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-[#5183A4] hover:bg-[#4A7A97] text-white rounded-lg text-sm disabled:opacity-50"
          >
            {loading ? "⏳ Добавляю..." : "➕ Добавить задачу"}
          </button>
        </div>
      </div>
    </div>
  )
}
