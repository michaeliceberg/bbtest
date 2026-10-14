'use client'

// components/learn-unit-fold.tsx
//
// Задачник (/learn): раскрыт только один раздел. Остальные — компактная плашка (номер, название, %),
// по нажатию раздел раскрывается, прошлый сворачивается, страница доезжает до него.

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronDown, Lock } from 'lucide-react'
import { useLearnOpenUnit } from '@/store/use-learn-open-unit'
import { getUnitButtonColor, hexToRgba } from '@/src/constants/lessonButtonColors'
import { scrollToLearnUnit } from '@/components/learn-unit-nav'

type Props = {
    id: number
    title: string
    unitIndex: number
    percent: number
    isUnlocked: boolean
    isCompleted: boolean
    defaultOpenId: number | null
    children: ReactNode
}

export const openLearnUnit = (id: number) => {
    useLearnOpenUnit.getState().setOpenId(id)
    // ждём, пока раздел раскроется и прошлый свернётся, потом доезжаем
    setTimeout(() => scrollToLearnUnit(id), 80)
}

export const LearnUnitFold = ({ id, title, unitIndex, percent, isUnlocked, isCompleted, defaultOpenId, children }: Props) => {
    const openId = useLearnOpenUnit((s) => s.openId) ?? defaultOpenId
    if (openId === id) return <div className="mb-8">{children}</div>

    const c = getUnitButtonColor(unitIndex)
    const m = title.match(/^(\d+)\.\s*(.*)$/)
    const num = m ? m[1] : null
    const name = m ? m[2] : title
    return (
        <motion.button
            type="button"
            whileTap={isUnlocked ? { scale: 0.98 } : undefined}
            disabled={!isUnlocked}
            onClick={() => openLearnUnit(id)}
            className="flex w-full items-center gap-3 rounded-2xl border-2 border-b-4 px-3 py-2.5 text-left disabled:cursor-not-allowed"
            style={{ background: '#161F23', borderColor: isUnlocked ? hexToRgba(c.button, 0.35) : '#232F35', opacity: isUnlocked ? 1 : 0.55 }}
        >
            {num && (
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[15px] font-black text-white"
                    style={{ background: isUnlocked ? `linear-gradient(180deg, ${c.button}, ${c.bottom})` : '#26333B' }}>
                    {num}
                </span>
            )}
            <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-extrabold text-[#E2EAF0]">{name}</span>
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[#26333B]">
                    <span className="block h-full rounded-full" style={{ width: `${isCompleted ? 100 : percent}%`, background: c.button }} />
                </span>
            </span>
            {!isUnlocked ? <Lock className="h-4 w-4 flex-shrink-0 text-[#72838D]" />
                : isCompleted ? <Check className="h-5 w-5 flex-shrink-0" style={{ color: c.button }} />
                : <span className="flex-shrink-0 text-xs font-black" style={{ color: c.button }}>{percent}%</span>}
            {isUnlocked && <ChevronDown className="h-4 w-4 flex-shrink-0 text-[#72838D]" />}
        </motion.button>
    )
}
