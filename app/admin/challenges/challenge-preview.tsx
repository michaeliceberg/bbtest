"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Latex from "react-latex-next"
import "katex/dist/katex.min.css"
import type { FormData } from "./challenge-form"

interface ChallengePreviewProps {
  data?: FormData
}

export function ChallengePreview({ data }: ChallengePreviewProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [status, setStatus] = useState<"none" | "correct" | "wrong">("none")

  // Default preview если нет данных
  const previewData = data || {
    question: "Введите вопрос выше чтобы увидеть preview",
    type: "ASSIST",
    points: 10,
    options: [
      { text: "Вариант ответа 1", correct: true },
      { text: "Вариант ответа 2", correct: false },
    ],
  }

  const handleSelect = (id: number) => {
    if (!data) return // Не кликаем если нет реальных данных

    setSelectedOption(id)
    const option = previewData.options[id]
    if (option.correct) {
      setStatus("correct")
    } else {
      setStatus("wrong")
    }
  }

  const validOptions = previewData.options.filter((o) => o.text.trim())

  return (
    <div className="w-full space-y-6">
      {/* Вопрос */}
      <div>
        <div className="text-white font-semibold text-lg leading-relaxed">
          {previewData.question ? (
            <Latex>{previewData.question}</Latex>
          ) : (
            <p>✏️ Введите вопрос...</p>
          )}
        </div>
        <p className="text-[#9AA7B0] text-sm mt-2">
          💰 {previewData.points} баллов | 🎯 {previewData.type}
        </p>
      </div>

      {/* Варианты ответов */}
      <div
        className={cn(
          "grid gap-3",
          previewData.type === "ASSIST" && "grid-cols-1",
          previewData.type === "SELECT" && "grid-cols-1 sm:grid-cols-2"
        )}
      >
        {validOptions.map((option, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={status !== "none"}
            className={cn(
              "px-4 py-3 rounded-lg font-semibold text-left transition-all border text-sm",
              selectedOption === i
                ? status === "correct"
                  ? "bg-green-500/20 border-green-500 text-green-400"
                  : "bg-red-500/20 border-red-500 text-red-400"
                : "bg-[#232F34] border-[#3A464E] text-white hover:bg-[#2A3A42]",
              status !== "none" && "cursor-not-allowed opacity-75"
            )}
          >
            <span className="text-xs opacity-75 mr-2">
              {String.fromCharCode(65 + i)}.
            </span>
            <Latex>{option.text}</Latex>
          </button>
        ))}
      </div>

      {/* Статус */}
      {status === "correct" && (
        <div className="bg-green-500/10 border border-green-500 rounded-lg p-4">
          <p className="text-green-400 font-semibold">✅ Правильно!</p>
        </div>
      )}

      {status === "wrong" && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
          <p className="text-red-400 font-semibold">❌ Неправильно!</p>
        </div>
      )}

      {/* Легенда */}
      <div className="border-t border-[#3A464E] pt-4 mt-4">
        <p className="text-[#9AA7B0] text-xs">
          💡 Это preview - так задача будет выглядеть в приложении. Нажимайте на варианты чтобы проверить логику.
        </p>
      </div>
    </div>
  )
}
