'use client'

// components/course-progress-strip.tsx
//
// «Прогресс по разделам» в задачнике (/learn). Плитка на каждый юнит: номер задания ЕГЭ, заливка
// снизу цветом юнита (как его карточка и кнопки уроков) по доле решённых задач, пройден — галочка,
// закрыт — замок. Для ЕГЭ плитки сгруппированы «Часть 1 · краткий ответ / Часть 2 · развёрнутый
// ответ / Дополнительно». Нажатие — прокрутка к юниту, снизу подпись выбранного раздела.
// percent приходит уже посчитанным на сервере (доля решённых задач юнита, app/(main)/learn/page.tsx).

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Lock } from 'lucide-react'
import { getUnitButtonColor, hexToRgba } from '@/src/constants/lessonButtonColors'
import { SECTION_LABEL, scrollToLearnUnit, type LearnSection } from '@/components/learn-unit-nav'

type StripUnit = {
    id: number
    title: string
    order: number
    unitIndex: number
    percent: number
    isUnlocked: boolean
    isCompleted: boolean
    section: LearnSection
}

const tileLabel = (u: StripUnit) => {
    const m = u.title.match(/^(\d+)\./)
    return m ? m[1] : u.section === 'extra' ? '+' : String(u.order)
}

export function CourseProgressStrip({ units }: { units: StripUnit[] }) {
    const [selected, setSelected] = useState<number | null>(null)
    if (units.length === 0) return null

    const groups: { section: LearnSection; units: StripUnit[] }[] = []
    for (const u of units) {
        const last = groups[groups.length - 1]
        if (last && last.section === u.section) last.units.push(u)
        else groups.push({ section: u.section, units: [u] })
    }
    const sel = units.find((u) => u.id === selected) ?? null
    const done = units.filter((u) => u.isCompleted).length

    return (
        <div className="mb-5 rounded-3xl border-2 border-[#2A363C] bg-[#161F23] p-4">
            <div className="mb-3 flex items-baseline justify-between">
                <span className="text-base font-black text-[#F2F7FB]">Прогресс по разделам</span>
                <span className="text-xs font-bold text-[#9AA7B0]">пройдено {done} из {units.length}</span>
            </div>

            <div className="flex flex-col gap-3">
                {groups.map((g, gi) => {
                    const label = g.section ? SECTION_LABEL[g.section] : null
                    const inline = g.section === 'extra'
                    return (
                        <div key={gi} className={inline ? 'flex items-center gap-3' : undefined}>
                            {label && (
                                <div className={inline ? 'flex flex-1 items-center gap-2' : 'mb-2 flex items-center gap-2'}>
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: label.color }} />
                                    <span className="text-xs font-black uppercase tracking-wide" style={{ color: label.color }}>{label.title}</span>
                                </div>
                            )}
                            <div
                                className={inline ? 'grid w-11 flex-shrink-0 gap-1.5' : 'grid grid-cols-7 gap-1.5 rounded-2xl p-2'}
                                style={label && !inline ? { background: hexToRgba(label.color, 0.07), boxShadow: `inset 0 0 0 1.5px ${hexToRgba(label.color, 0.28)}` } : undefined}
                            >
                                {g.units.map((u) => {
                                    const c = getUnitButtonColor(u.unitIndex)
                                    const fill = u.isCompleted ? 100 : Math.max(u.percent, u.percent > 0 ? 10 : 0)
                                    const isSel = u.id === selected
                                    return (
                                        <motion.button
                                            key={u.id}
                                            type="button"
                                            whileTap={{ y: 3 }}
                                            onClick={() => { setSelected(u.id); if (u.isUnlocked) scrollToLearnUnit(u.id) }}
                                            title={`${u.title} — ${Math.round(u.percent)}%`}
                                            className="relative aspect-square overflow-hidden rounded-xl"
                                            style={{
                                                background: u.isUnlocked ? '#22303A' : '#1D262B',
                                                boxShadow: `0 3px 0 ${u.isUnlocked ? (u.isCompleted ? c.bottom : '#0F171B') : '#121A1E'}${isSel ? `, 0 0 0 2px ${c.button}` : ''}`,
                                            }}
                                        >
                                            {u.isUnlocked && fill > 0 && (
                                                <motion.div
                                                    className="absolute bottom-0 left-0 w-full"
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${fill}%` }}
                                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                                    style={{ background: u.isCompleted ? `linear-gradient(135deg, ${c.button}, ${c.bottom})` : hexToRgba(c.button, 0.55) }}
                                                />
                                            )}
                                            <span className="relative flex h-full w-full items-center justify-center text-sm font-black"
                                                style={{ color: !u.isUnlocked ? '#55636B' : u.isCompleted ? '#FFFFFF' : '#E2EAF0' }}>
                                                {!u.isUnlocked ? <Lock className="h-3.5 w-3.5" /> : tileLabel(u)}
                                            </span>
                                            {u.isCompleted && (
                                                <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white">
                                                    <Check className="h-2.5 w-2.5" style={{ color: c.bottom }} strokeWidth={4} />
                                                </span>
                                            )}
                                        </motion.button>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            <p className="mt-3 min-h-[18px] truncate text-xs font-bold text-[#9AA7B0]">
                {sel ? <><span className="text-[#F2F7FB]">{sel.title}</span> · {Math.round(sel.percent)}%</> : 'Нажми на номер — перейдёшь к разделу'}
            </p>
        </div>
    )
}
