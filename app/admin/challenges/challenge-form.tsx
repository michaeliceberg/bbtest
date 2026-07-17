"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChallengePreview } from "./challenge-preview"

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

interface ChallengeFormProps {
  lessonId: number
  onDataChange?: (data: FormData) => void
}

export interface FormData {
  question: string
  type: string
  author: string
  difficulty: string
  points: number
  options: { text: string; correct: boolean }[]
}

export function ChallengeForm({ lessonId, onDataChange }: ChallengeFormProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/admin/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          ...formData,
          options: formData.options.filter((o) => o.text.trim()),
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-white font-semibold mb-2">Вопрос</label>
        <textarea
          value={formData.question}
          onChange={(e) => {
            const newData = { ...formData, question: e.target.value }
            setFormData(newData)
            onDataChange?.(newData)
          }}
          placeholder="Введите вопрос для задачи..."
          className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-4 py-2 text-white placeholder-[#5A6A72] h-24"
        />
      </div>

      <div>
        <label className="block text-white font-semibold mb-2">Тип</label>
        <select
          value={formData.type}
          onChange={(e) => {
            const newData = { ...formData, type: e.target.value }
            setFormData(newData)
            onDataChange?.(newData)
          }}
          className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-4 py-2 text-white"
        >
          {CHALLENGE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-white font-semibold mb-2">Сложность</label>
          <input
            type="text"
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
            placeholder="Средняя, Высокая..."
            className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-4 py-2 text-white placeholder-[#5A6A72]"
          />
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">Баллы</label>
          <input
            type="number"
            value={formData.points}
            onChange={(e) => {
              const newData = { ...formData, points: Number(e.target.value) }
              setFormData(newData)
              onDataChange?.(newData)
            }}
            min="1"
            className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-4 py-2 text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-white font-semibold mb-2">Автор (опционально)</label>
        <input
          type="text"
          value={formData.author}
          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
          placeholder="Имя автора..."
          className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-4 py-2 text-white placeholder-[#5A6A72]"
        />
      </div>

      <div>
        <label className="block text-white font-semibold mb-4">Варианты ответов</label>
        <div className="space-y-3">
          {formData.options.map((option, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className={`text-sm font-semibold w-12 ${
                option.correct ? "text-green-500" : "text-[#9AA7B0]"
              }`}>
                {option.correct ? "✓ ВЕРНО" : "✗ ошибка"}
              </span>
              <input
                type="text"
                value={option.text}
                onChange={(e) => {
                  const newOptions = [...formData.options]
                  newOptions[idx].text = e.target.value
                  const newData = { ...formData, options: newOptions }
                  setFormData(newData)
                  onDataChange?.(newData)
                }}
                placeholder={`Вариант ${idx + 1}...`}
                className="flex-1 bg-[#232F34] border border-[#3A464E] rounded-lg px-4 py-2 text-white placeholder-[#5A6A72]"
              />
            </div>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#5183A4] hover:bg-[#4A7A97] text-white font-bold py-2 rounded-lg"
      >
        {loading ? "⏳ Добавляю..." : "➕ Добавить задачу"}
      </Button>
    </form>
  )
}
