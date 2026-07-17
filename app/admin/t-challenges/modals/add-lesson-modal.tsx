'use client'

import { useState } from 'react'

export function AddLessonModal({
  unitId,
  onClose,
  onSuccess,
}: {
  unitId: number
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Введите название урока')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/t-lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          title: title.trim(),
          order: 1,
        }),
      })

      if (res.ok) {
        alert('✅ Урок добавлен!')
        setTitle('')
        onSuccess()
      } else {
        alert('❌ Ошибка при добавлении урока')
      }
    } catch (err) {
      console.error(err)
      alert('❌ Ошибка')
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
        <h2 className="text-2xl font-bold text-white mb-4">Добавить урок</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-white font-semibold mb-2">
              Название урока
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Подбери два числа..."
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
            {loading ? '⏳ Добавляю...' : '➕ Добавить'}
          </button>
        </div>
      </div>
    </div>
  )
}
