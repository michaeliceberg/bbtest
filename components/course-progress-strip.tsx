'use client'

// components/course-progress-strip.tsx
//
// «Прогресс по разделам» в задачнике (/learn) — игровая шкала: на каждую часть ЕГЭ (для ЕГЭ курсов)
// одна полоска из ячеек, как полоска здоровья/опыта в игре. Ячейка = раздел: заливается цветом раздела
// по доле решённых задач, пройденный — полностью. Номер задания мелко под ячейкой. В конце полоски —
// сундук части: серый, пока часть не пройдена целиком, потом мифический и подпрыгивает.
// Нажатие на ячейку — прокрутка к разделу, снизу подпись выбранного раздела.
// percent приходит уже посчитанным на сервере (доля решённых задач юнита, app/(main)/learn/page.tsx).

import { useState } from 'react'
import { motion } from 'framer-motion'
import { getUnitButtonColor } from '@/src/constants/lessonButtonColors'
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

const cellLabel = (u: StripUnit) => {
    const m = u.title.match(/^(\d+)\./)
    return m ? m[1] : String(u.order)
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

    return (
        <div className="mb-5 rounded-2xl border-2 border-[#2A363C] bg-[#161F23] px-3 pb-2.5 pt-3">
            <div className="flex flex-col gap-2.5">
                {groups.map((g, gi) => {
                    const label = g.section ? SECTION_LABEL[g.section] : null
                    const [labelMain, labelSub] = label ? label.title.split(' · ') : ['Разделы', '']
                    const allDone = g.units.every((u) => u.isCompleted)
                    return (
                        <div key={gi}>
                            <div className="mb-1 flex items-center">
                                <span className="text-[11px] font-black uppercase tracking-wide" style={{ color: label?.color ?? '#9AA7B0' }}>
                                    {labelMain}
                                    {labelSub && <span className="ml-1.5 normal-case tracking-normal text-[#5C6B73]">{labelSub}</span>}
                                </span>
                            </div>
                            <div className="flex items-end gap-2">
                                {/* полоска из ячеек */}
                                <div className="flex flex-1 gap-[3px] rounded-lg bg-[#0F171B] p-[3px]" style={{ boxShadow: 'inset 0 2px 0 rgba(0,0,0,0.35)' }}>
                                    {g.units.map((u) => {
                                        const c = getUnitButtonColor(u.unitIndex)
                                        const fill = u.isCompleted ? 100 : u.percent > 0 ? Math.max(u.percent, 12) : 0
                                        const isSel = u.id === selected
                                        return (
                                            <motion.button
                                                key={u.id}
                                                type="button"
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => { setSelected(u.id); if (u.isUnlocked) scrollToLearnUnit(u.id) }}
                                                title={`${u.title} — ${Math.round(u.percent)}%`}
                                                className="relative min-w-0 flex-1"
                                            >
                                                <div
                                                    className="relative h-4 overflow-hidden rounded-[4px]"
                                                    style={{
                                                        background: u.isUnlocked ? '#26333B' : '#1A2328',
                                                        boxShadow: isSel ? `0 0 0 2px ${c.button}` : undefined,
                                                    }}
                                                >
                                                    {u.isUnlocked && fill > 0 && (
                                                        <motion.div
                                                            className="absolute inset-y-0 left-0"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${fill}%` }}
                                                            transition={{ duration: 0.7, ease: 'easeOut' }}
                                                            style={{ background: `linear-gradient(180deg, ${c.button}, ${c.bottom})` }}
                                                        />
                                                    )}
                                                    {/* блик сверху — «стеклянная» ячейка */}
                                                    <div className="absolute inset-x-0 top-0 h-1/3 bg-white/10" />
                                                </div>
                                                <span className="mt-0.5 block text-center text-[9px] font-black leading-none" style={{ color: u.isCompleted ? c.button : u.isUnlocked ? '#72838D' : '#3E4B52' }}>
                                                    {cellLabel(u)}
                                                </span>
                                            </motion.button>
                                        )
                                    })}
                                </div>
                                {/* сундук части */}
                                <motion.img
                                    src={allDone ? '/chests/myth0001.svg' : '/chests/comm0001.svg'}
                                    alt=""
                                    className="mb-1.5 h-7 w-7 flex-shrink-0"
                                    style={{ filter: allDone ? 'none' : 'grayscale(1) brightness(0.55)' }}
                                    animate={allDone ? { y: [0, -3, 0] } : undefined}
                                    transition={allDone ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            <p className="mt-1.5 truncate text-[11px] font-bold text-[#5C6B73]">
                {sel ? <><span className="text-[#E2EAF0]">{sel.title}</span> · {Math.round(sel.percent)}%</> : 'Нажми на ячейку — перейдёшь к разделу'}
            </p>
        </div>
    )
}
