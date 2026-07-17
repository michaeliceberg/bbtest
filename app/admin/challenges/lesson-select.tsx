"use client"

interface Lesson {
  id: number
  title: string
  unitId: number
}

export function LessonSelect({
  lessons,
  selected,
  onSelect,
  disabled,
}: {
  lessons: Lesson[]
  selected: number | null
  onSelect: (id: number | null) => void
  disabled: boolean
}) {
  return (
    <div>
      <label className="block text-white font-semibold mb-2">Урок</label>
      <select
        value={selected || ""}
        onChange={(e) => onSelect(e.target.value ? Number(e.target.value) : null)}
        disabled={disabled}
        className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-4 py-2 text-white disabled:opacity-50"
      >
        <option value="">Выберите урок...</option>
        {lessons.map((lesson) => (
          <option key={lesson.id} value={lesson.id}>
            {lesson.title}
          </option>
        ))}
      </select>
    </div>
  )
}
