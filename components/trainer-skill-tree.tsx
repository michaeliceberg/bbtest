// components/trainer-skill-tree.tsx
//
// Тёмная извилистая дорожка уроков в стиле настоящего Duolingo:
// цветной баннер юнита сверху, круглые узлы уроков змейкой вниз
// (без подписей и без "паучьих ножек"), в конце всего курса — сундук,
// который открывается тремя тапами.

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Lock, Zap, Trophy, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TrainerChest } from './trainer-chest'

export type SkillLesson = {
    id: number
    title: string
    percentage: number
    isDisabled: boolean
    isInQuest?: boolean
    hasHw?: boolean
}

export type SkillUnit = {
    id: number
    title: string
    percentage: number
    lessons: SkillLesson[]
}

type Props = {
    units: SkillUnit[]
}

const NODE = 76
const STEP_Y = 108
const AMPLITUDE = 78
const BANNER_H = 74
const BANNER_GAP = 34
const TOP_PAD = 8
const BOTTOM_PAD = 40

const wave = (i: number) => {
    const cycle = i % 8
    if (cycle <= 2) return cycle
    if (cycle <= 6) return 4 - cycle
    return cycle - 8
}

const legColor = (percentage: number) => {
    if (percentage > 90) return { bg: 'bg-amber-400', border: 'border-amber-300', icon: Trophy }
    if (percentage > 60) return { bg: 'bg-emerald-500', border: 'border-emerald-400', icon: Star }
    if (percentage > 1) return { bg: 'bg-rose-500', border: 'border-rose-400', icon: Zap }
    return { bg: 'bg-emerald-500', border: 'border-emerald-400', icon: Zap }
}

type Row = { kind: 'lesson'; unit: SkillUnit; lesson: SkillLesson; x: number; y: number; justUnlocked: boolean }

export const TrainerSkillTree = ({ units }: Props) => {
    const [flashIds, setFlashIds] = useState<Set<number>>(new Set())

    const rows: Row[] = []
    const bannerYs: { unit: SkillUnit; y: number }[] = []
    let globalIndex = 0
    let cursorY = TOP_PAD

    units.forEach((unit) => {
        cursorY += BANNER_H + BANNER_GAP
        bannerYs.push({ unit, y: cursorY - BANNER_H - BANNER_GAP })

        unit.lessons.forEach((lesson, idxInUnit) => {
            const x = wave(globalIndex) * AMPLITUDE
            const y = cursorY
            const justUnlocked = idxInUnit > 0 && !lesson.isDisabled && lesson.percentage === 0
            rows.push({ kind: 'lesson', unit, lesson, x, y, justUnlocked })
            cursorY += STEP_Y
            globalIndex += 1
        })

        cursorY += 30
    })

    const chestX = wave(globalIndex) * AMPLITUDE
    const chestY = cursorY
    const totalHeight = chestY + NODE + BOTTOM_PAD

    useEffect(() => {
        const targets = rows.filter((r) => r.justUnlocked).map((r) => r.lesson.id)
        if (targets.length === 0) return
        const timer = window.setTimeout(() => {
            setFlashIds(new Set(targets))
            window.setTimeout(() => setFlashIds(new Set()), 1600)
        }, 500)
        return () => window.clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const minX = Math.min(0, ...rows.map((r) => r.x), chestX) - NODE / 2 - 20
    const maxX = Math.max(0, ...rows.map((r) => r.x), chestX) + NODE / 2 + 20
    const width = maxX - minX
    const centerOffset = -minX

    return (
        <div className="relative w-full rounded-2xl bg-[#0b0f19] overflow-hidden">
            <style>{`
                @keyframes sktreeUnlock {
                    0% { box-shadow: 0 0 0 0 rgba(52,211,153,0.7); }
                    70% { box-shadow: 0 0 0 18px rgba(52,211,153,0); }
                    100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); }
                }
                .sktree-flash { animation: sktreeUnlock 0.8s ease-out 2; }
            `}</style>

            <div style={{ position: 'relative', width: Math.max(width, 300), height: totalHeight, margin: '0 auto' }}>
                {bannerYs.map(({ unit, y }, idx) => (
                    <div
                        key={`banner-${unit.id}`}
                        className="absolute left-3 right-3 rounded-xl bg-emerald-600 flex items-center justify-between px-4"
                        style={{ top: y, height: BANNER_H }}
                    >
                        <div>
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-100/80">
                                Юнит {idx + 1}
                            </div>
                            <div className="text-[15px] font-bold text-white leading-tight">{unit.title}</div>
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-100/90">{Math.round(unit.percentage)}%</div>
                    </div>
                ))}

                {rows.map((r) => {
                    const locked = r.lesson.isDisabled
                    const state = legColor(r.lesson.percentage)
                    const Icon = locked ? Lock : state.icon
                    const cx = centerOffset + r.x

                    const node = (
                        <div
                            data-node-id={r.lesson.id}
                            className={cn(
                                'relative flex items-center justify-center rounded-full border-4 transition-colors',
                                flashIds.has(r.lesson.id) ? 'sktree-flash' : '',
                                locked ? 'bg-[#1c2333] border-[#2a3348]' : cn(state.bg, state.border),
                            )}
                            style={{ width: NODE, height: NODE }}
                        >
                            <Icon className={cn('h-7 w-7', locked ? 'text-[#3a4358]' : 'text-white')} />
                            {r.lesson.hasHw && !locked && (
                                <Image src="/hwSvgs/friesW.svg" width={24} height={24} alt="ДЗ" className="absolute -top-2 -left-2 animate-bounce" />
                            )}
                            {r.lesson.isInQuest && !locked && r.lesson.percentage < 100 && (
                                <Image src="/hwSvgs/donut.svg" width={22} height={22} alt="Квест" className="absolute -top-2 -right-2 animate-bounce" />
                            )}
                        </div>
                    )

                    return (
                        <div
                            key={r.lesson.id}
                            className="absolute"
                            style={{ top: r.y, left: cx, transform: 'translate(-50%, 0)' }}
                        >
                            {locked ? node : <Link href={`/t-lesson/${r.lesson.id}`}>{node}</Link>}
                        </div>
                    )
                })}

                <div className="absolute" style={{ top: chestY, left: centerOffset + chestX, transform: 'translate(-50%, 0)' }}>
                    <TrainerChest size={NODE} />
                </div>
            </div>
        </div>
    )
}

export default TrainerSkillTree
