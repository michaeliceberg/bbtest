"use client"

interface Course {
  id: number
  title: string
}

export function CourseSelect({
  courses,
  selected,
  onSelect,
}: {
  courses: Course[]
  selected: number | null
  onSelect: (id: number | null) => void
}) {
  return (
    <div>
      <label className="block text-white font-semibold mb-2">Курс</label>
      <select
        value={selected || ""}
        onChange={(e) => onSelect(e.target.value ? Number(e.target.value) : null)}
        className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-4 py-2 text-white"
      >
        <option value="">Выберите курс...</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.title}
          </option>
        ))}
      </select>
    </div>
  )
}
