'use client'

// components/learn-unit-fold.tsx
//
// Задачник (/learn): раскрыт только один раздел. Остальные — компактная плашка (номер, название, %),
// по нажатию раздел раскрывается, прошлый сворачивается, страница доезжает до него.

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronDown, Dumbbell, Lock } from 'lucide-react'
import { useLearnOpenUnit } from '@/store/use-learn-open-unit'
import { EGE_PART_COLOR } from '@/components/ege-task-grid'
import { NAV_ITEM_PRESS, navItemStyle } from '@/components/nav-sheet-ui'
import { scrollToLearnUnit } from '@/components/learn-unit-nav'

type Props = {
    id: number
    title: string
    unitIndex: number
    percent: number
    isUnlocked: boolean
    isCompleted: boolean
    defaultOpenId: number | null
    // тренажёры к этому заданию ЕГЭ: сколько пройдено (есть медаль) из скольких
    trainers?: { done: number; total: number } | null
    children: ReactNode
}

export const openLearnUnit = (id: number) => {
    useLearnOpenUnit.getState().setOpenId(id)
    // ждём, пока раздел раскроется и прошлый свернётся, потом доезжаем
    setTimeout(() => scrollToLearnUnit(id), 80)
}

export const LearnUnitFold = ({ id, title, unitIndex, percent, isUnlocked, isCompleted, defaultOpenId, trainers, children }: Props) => {
    const openId = useLearnOpenUnit((s) => s.openId) ?? defaultOpenId
    if (openId === id) return <div className="mb-8">{children}</div>

    const m = title.match(/^(\d+)\.\s*(.*)$/)
    const num = m ? m[1] : null
    const name = m ? m[2] : title
    // Серая плитка как меню навигации; цвет только у номера и полоски — по части ЕГЭ (1–13 синий, 14–20 фиолетовый).
    const c = num && Number(num) >= 14 ? EGE_PART_COLOR.part2 : EGE_PART_COLOR.part1
    return (
        <motion.button
            type="button"
            whileTap={isUnlocked ? { scale: 0.98 } : undefined}
            disabled={!isUnlocked}
            onClick={() => openLearnUnit(id)}
            className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left disabled:cursor-not-allowed ${NAV_ITEM_PRESS}`}
            style={navItemStyle(false, !isUnlocked)}
        >
            {num && (
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[15px] font-black"
                    style={isUnlocked ? { background: `${c}22`, color: c, boxShadow: `inset 0 0 0 1.5px ${c}66` } : { background: '#26333B', color: '#4E5D65' }}>
                    {num}
                </span>
            )}
            <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-extrabold" style={{ color: isUnlocked ? '#E2EAF0' : '#5C6B73' }}>{name}</span>
                {/* короткая полоска решённых задач + сколько тренажёров к заданию пройдено */}
                <span className="mt-1 flex items-center gap-2">
                    <span className="block h-1 w-14 flex-shrink-0 overflow-hidden rounded-full bg-[#0E1518]">
                        <span className="block h-full rounded-full" style={{ width: `${isCompleted ? 100 : percent}%`, background: c }} />
                    </span>
                    {trainers && (
                        <span className="flex items-center gap-1 text-[11px] font-bold"
                            style={{ color: trainers.done === trainers.total ? '#F2C35B' : trainers.done ? '#AEBCC5' : '#6B7A83' }}>
                            <Dumbbell className="h-3 w-3" />
                            тренажёры {trainers.done}/{trainers.total}
                        </span>
                    )}
                </span>
            </span>
            {!isUnlocked ? <Lock className="h-4 w-4 flex-shrink-0 text-[#5C6B73]" />
                : isCompleted ? <Check className="h-5 w-5 flex-shrink-0 text-[#AEBCC5]" />
                : <span className="flex-shrink-0 text-xs font-black text-[#AEBCC5]">{percent}%</span>}
            {isUnlocked && <ChevronDown className="h-4 w-4 flex-shrink-0 text-[#5C6B73]" />}
        </motion.button>
    )
}
