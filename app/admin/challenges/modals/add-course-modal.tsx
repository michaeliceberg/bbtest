"use client"

import { useState } from "react"

export function AddCourseModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}) {
  const [title, setTitle] = useState("")
  const [imageSrc, setImageSrc] = useState("")
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("Введите название курса")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/admin/courses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          imageSrc: imageSrc.trim() || "/default-course.svg",
        }),
      })

      if (res.ok) {
        alert("✅ Курс добавлен!")
        setTitle("")
        setImageSrc("")
        onSave()
      } else {
        alert("❌ Ошибка при добавлении курса")
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-[#161F23] rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">Добавить курс</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-white font-semibold mb-2">Название курса</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ЛНИП Физика 7..."
              className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-4 py-2 text-white placeholder-[#5A6A72]"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              Иконка (опционально)
            </label>
            <input
              type="text"
              value={imageSrc}
              onChange={(e) => setImageSrc(e.target.value)}
              placeholder="/course-icon.svg"
              className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-4 py-2 text-white placeholder-[#5A6A72]"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#232F34] hover:bg-[#2A3A42] text-white rounded-lg"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-[#5183A4] hover:bg-[#4A7A97] text-white rounded-lg disabled:opacity-50"
          >
            {loading ? "⏳ Добавляю..." : "➕ Добавить"}
          </button>
        </div>
      </div>
    </div>
  )
}
