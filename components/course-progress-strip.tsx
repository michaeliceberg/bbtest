'use client'

// Компактная сводка "сколько сделано в каждом разделе курса" — по
// прямой просьбе пользователя: открыв задачник, сразу увидеть одной
// картинкой, какие разделы уже тронуты, а какие нет, и провалиться в
// недоделанный раздел одним кликом. Вместо дискретных "3 квадратика на
// раздел" (первая идея пользователя) — тонкий вертикальный мини-бар с
// ПРОПОРЦИОНАЛЬНОЙ высотой заливки (0-100%), это честнее показывает
// разницу между "начал" (10%) и "почти закончил" (80%), которую 3
// ступеньки-квадратика неизбежно смазывают в один и тот же бакет.

import { useState } from 'react'

type StripUnit = {
    id: number
    title: string
    order: number
    percent: number
    isUnlocked: boolean
    isCompleted: boolean
    firstLessonId: number | null
}

const BAR_HEIGHT = 40
const BAR_WIDTH = 14

function scrollToUnit(lessonId: number | null) {
    if (!lessonId) return
    document.getElementById(`lesson-${lessonId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
    })
}

function fillStyle(unit: StripUnit): React.CSSProperties {
    if (!unit.isUnlocked) {
        return { height: 4, background: '#3A464E' }
    }
    if (unit.isCompleted) {
        return {
            height: '100%',
            background: 'linear-gradient(180deg, #C026D3 0%, #7C3AED 100%)',
            boxShadow: '0 0 8px -1px rgba(167, 139, 250, 0.6)',
        }
    }
    const h = Math.max(unit.percent, 3)
    return {
        height: `${h}%`,
        background: unit.percent > 0 ? 'linear-gradient(180deg, #6BB3F0 0%, #4A90D9 100%)' : 'transparent',
    }
}

export function CourseProgressStrip({ units }: { units: StripUnit[] }) {
    const [hovered, setHovered] = useState<number | null>(null)

    if (units.length === 0) return null

    return (
        <div className="bg-[#151F23] rounded-xl border border-[#232F34] px-4 py-3.5 mb-4">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-[#F2F7FB]">Прогресс по разделам</span>
                {hovered !== null && (
                    <span className="text-xs text-[#9AA7B0] truncate max-w-[60%]">
                        {units[hovered].title} — {Math.round(units[hovered].percent)}%
                    </span>
                )}
            </div>
            <div className="flex items-end gap-2.5 overflow-x-auto pb-1">
                {units.map((unit, i) => (
                    <button
                        key={unit.id}
                        type="button"
                        disabled={!unit.isUnlocked}
                        onClick={() => scrollToUnit(unit.firstLessonId)}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                        className={
                            'flex flex-col items-center gap-1.5 flex-shrink-0 group ' +
                            (unit.isUnlocked ? 'cursor-pointer' : 'cursor-default')
                        }
                        title={`${unit.title} — ${Math.round(unit.percent)}%`}
                    >
                        <div
                            className="relative rounded-full bg-[#232F34] overflow-hidden transition-transform group-hover:scale-110"
                            style={{ width: BAR_WIDTH, height: BAR_HEIGHT }}
                        >
                            <div className="absolute bottom-0 left-0 w-full rounded-full transition-[height]" style={fillStyle(unit)} />
                        </div>
                        <span className={'text-[10px] tabular-nums ' + (unit.isUnlocked ? 'text-[#9AA7B0]' : 'text-[#5A6A72]')}>
                            {unit.order}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    )
}
