'use client'

// Компактная сводка "сколько сделано в каждом разделе курса" — по
// прямой просьбе пользователя: открыв задачник, сразу увидеть одной
// картинкой, какие разделы уже тронуты, а какие нет, и провалиться в
// недоделанный раздел одним кликом. Вместо тонкой пилюли слева — сетка
// на всю ширину карточки (grid-cols=N, каждая колонка тянется на свою
// долю), и вместо гладкого фона — пиксельный "вокселlater"-стиль в духе
// логотипа (public/ggegelogo.png): толстый тёмно-коричневый контур,
// золотая заливка в процессе, фиолетовая (тон шляпы волшебника на
// логотипе) — когда раздел пройден целиком.
//
// percent приходит УЖЕ посчитанным на сервере как доля РЕШЁННЫХ ЗАДАЧ
// во всём разделе (не "открытых уроков" — урок засчитывается открытым
// уже после нескольких решённых задач из многих, что давало обманчиво
// высокий процент, см. app/(main)/learn/page.tsx).

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

const OUTLINE = '#2A1A0F'
const TRACK_BG = '#241A12'
const GOLD_TOP = '#F7C35C'
const GOLD_BOTTOM = '#E8A23D'
const PURPLE_TOP = '#9B6FE0'
const PURPLE_BOTTOM = '#6B4FA0'

function scrollToUnit(lessonId: number | null) {
    if (!lessonId) return
    document.getElementById(`lesson-${lessonId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
    })
}

function fillStyle(unit: StripUnit): React.CSSProperties {
    if (!unit.isUnlocked) {
        return { height: '0%' }
    }
    if (unit.isCompleted) {
        return {
            height: '100%',
            background: `linear-gradient(180deg, ${PURPLE_TOP} 0%, ${PURPLE_BOTTOM} 100%)`,
        }
    }
    const h = Math.max(unit.percent, unit.percent > 0 ? 8 : 0)
    return {
        height: `${h}%`,
        background: unit.percent > 0 ? `linear-gradient(180deg, ${GOLD_TOP} 0%, ${GOLD_BOTTOM} 100%)` : 'transparent',
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
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${units.length}, minmax(0, 1fr))` }}>
                {units.map((unit, i) => (
                    <button
                        key={unit.id}
                        type="button"
                        disabled={!unit.isUnlocked}
                        onClick={() => scrollToUnit(unit.firstLessonId)}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                        className={'flex flex-col items-center gap-1.5 group ' + (unit.isUnlocked ? 'cursor-pointer' : 'cursor-default')}
                        title={`${unit.title} — ${Math.round(unit.percent)}%`}
                    >
                        <div
                            className="relative w-full overflow-hidden transition-transform group-hover:-translate-y-0.5"
                            style={{
                                height: 56,
                                borderRadius: 3,
                                border: `2.5px solid ${unit.isUnlocked ? OUTLINE : '#3A2E22'}`,
                                background: TRACK_BG,
                                opacity: unit.isUnlocked ? 1 : 0.55,
                                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.25)',
                            }}
                        >
                            {/* заливка */}
                            <div className="absolute bottom-0 left-0 w-full transition-[height] duration-500" style={fillStyle(unit)} />
                            {/* пиксельные полосы-деления поверх заливки — эффект "вокселя" */}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 12px, rgba(0,0,0,0.28) 12px, rgba(0,0,0,0.28) 14px)',
                                }}
                            />
                            {unit.isCompleted && (
                                <div
                                    className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2"
                                    style={{ background: GOLD_TOP, clipPath: 'polygon(40% 0,60% 0,60% 40%,100% 40%,100% 60%,60% 60%,60% 100%,40% 100%,40% 60%,0 60%,0 40%,40% 40%)' }}
                                />
                            )}
                        </div>
                        <span className={'text-[10px] font-mono font-bold tabular-nums ' + (unit.isUnlocked ? 'text-[#9AA7B0]' : 'text-[#5A6A72]')}>
                            {unit.order}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    )
}
