"use client"

interface Unit {
  id: number
  title: string
  courseId: number
}

export function UnitSelect({
  units,
  selected,
  onSelect,
  disabled,
}: {
  units: Unit[]
  selected: number | null
  onSelect: (id: number | null) => void
  disabled: boolean
}) {
  return (
    <div>
      <label className="block text-white font-semibold mb-2">Юнит</label>
      <select
        value={selected || ""}
        onChange={(e) => onSelect(e.target.value ? Number(e.target.value) : null)}
        disabled={disabled}
        className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-4 py-2 text-white disabled:opacity-50"
      >
        <option value="">Выберите юнит...</option>
        {units.map((unit) => (
          <option key={unit.id} value={unit.id}>
            {unit.title}
          </option>
        ))}
      </select>
    </div>
  )
}
