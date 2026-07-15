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
import Lottie from 'lottie-react'
import { Lock, Zap, Trophy, Star, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TrainerChest } from './trainer-chest'
import LottieWaterMellonThumbsUp from '@/public/Lottie/LottieWaterMellonThumbsUp.json'

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

const NODE_W = 76
const NODE_H = Math.round(NODE_W * 0.92)
const STEP_Y = 54
const AMPLITUDE = 145
const WAVE_PERIOD = 8
const BANNER_H = 74
const BANNER_GAP = 34
const TOP_PAD = 8
const BOTTOM_PAD = 40

// Плавная синусоида вместо ромбовидного зигзага.
const wave = (i: number) => Math.sin((2 * Math.PI * i) / WAVE_PERIOD)

// Точная вершина синусоиды (sin = ±1) — на этих индексах узел стоит
// в крайнем положении, а на противоположной пустой стороне можно
// посадить персонажа.
const isPeak = (i: number) => (i - WAVE_PERIOD / 4) % (WAVE_PERIOD / 2) === 0

const BG_COLOR = '#151F23'
const GREEN = '#78C93C'

const nodeIcon = (percentage: number) => (percentage > 90 ? Trophy : percentage > 1 ? Star : Zap)

type Row = { kind: 'lesson'; unit: SkillUnit; unitIndex: number; lesson: SkillLesson; x: number; y: number; justUnlocked: boolean }

export const TrainerSkillTree = ({ units }: Props) => {
    const [flashIds, setFlashIds] = useState<Set<number>>(new Set())

    const rows: Row[] = []
    const bannerYs: { unit: SkillUnit; y: number }[] = []
    let globalIndex = 0
    let cursorY = TOP_PAD

    units.forEach((unit, unitIndex) => {
        cursorY += BANNER_H + BANNER_GAP
        bannerYs.push({ unit, y: cursorY - BANNER_H - BANNER_GAP })

        unit.lessons.forEach((lesson, idxInUnit) => {
            const x = wave(globalIndex) * AMPLITUDE
            const y = cursorY
            const justUnlocked = idxInUnit > 0 && !lesson.isDisabled && lesson.percentage === 0
            rows.push({ kind: 'lesson', unit, unitIndex, lesson, x, y, justUnlocked })
            cursorY += STEP_Y
            globalIndex += 1
        })

        cursorY += 30
    })

    const chestX = wave(globalIndex) * AMPLITUDE
    const chestY = cursorY
    const totalHeight = chestY + NODE_H + BOTTOM_PAD

    // Персонаж (Lottie) в первой "вершине" волны юнита 1 — располагаем
    // на противоположной (пустой) стороне от узла, чтобы просто создавать
    // настроение, не мешая самой дорожке.
    const mascotRow = rows.find((r, idx) => r.unitIndex === 0 && isPeak(idx))

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

    const xs = [...rows.map((r) => r.x), chestX]
    const minX = Math.min(...xs) - NODE_W / 2 - 20
    const maxX = Math.max(...xs) + NODE_W / 2 + 20
    const width = maxX - minX
    const centerOffset = -minX

    return (
        <div className="relative w-full rounded-2xl overflow-hidden" style={{ backgroundColor: BG_COLOR }}>
            <style>{`
                @keyframes sktreeUnlock {
                    0% { box-shadow: 0 0 0 0 rgba(120,201,60,0.7); }
                    70% { box-shadow: 0 0 0 18px rgba(120,201,60,0); }
                    100% { box-shadow: 0 0 0 0 rgba(120,201,60,0); }
                }
                .sktree-flash { animation: sktreeUnlock 0.8s ease-out 2; }
            `}</style>

            <div style={{ position: 'relative', width: Math.max(width, 300), height: totalHeight, margin: '0 auto' }}>
                {bannerYs.map(({ unit, y }, idx) => (
                    <div
                        key={`banner-${unit.id}`}
                        className="absolute left-3 right-3 rounded-[20px] flex items-stretch justify-between border-b-[10px] border-b-[#5FA12E]"
                        style={{ top: y, height: BANNER_H, backgroundColor: GREEN }}
                    >
                        <div className="flex flex-col justify-center px-4">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-white/80">
                                Юнит {idx + 1}
                            </div>
                            <div className="text-[15px] font-bold text-white leading-tight">{unit.title}</div>
                        </div>
                        <div className="flex items-center pr-1">
                            <div className="self-stretch w-px my-3 bg-white/30" />
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl ml-3 mr-2" style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}>
                                <List className="h-5 w-5 text-white" />
                            </div>
                        </div>
                    </div>
                ))}

                {rows.map((r) => {
                    const locked = r.lesson.isDisabled
                    const Icon = locked ? Lock : nodeIcon(r.lesson.percentage)
                    const cx = centerOffset + r.x

                    const node = (
                        <div
                            data-node-id={r.lesson.id}
                            className={cn(
                                'relative flex items-center justify-center rounded-full border-2 border-b-8 active:border-b-2 transition-[border-width] duration-100',
                                flashIds.has(r.lesson.id) ? 'sktree-flash' : '',
                                locked
                                    ? 'bg-[#3A454E] border-[#2E383E]'
                                    : 'bg-[#78C93C] border-[#5FA12F]',
                            )}
                            style={{ width: NODE_W, height: NODE_H }}
                        >
                            <Icon className={cn('h-7 w-7', locked ? 'text-[#5A6673]' : 'text-white')} />
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

                {mascotRow && (
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            top: mascotRow.y - 50,
                            left: centerOffset - mascotRow.x,
                            transform: 'translate(-50%, 0)',
                            width: 110,
                            height: 110,
                        }}
                    >
                        <Lottie animationData={LottieWaterMellonThumbsUp} loop autoplay />
                    </div>
                )}

                <div className="absolute" style={{ top: chestY, left: centerOffset + chestX, transform: 'translate(-50%, 0)' }}>
                    <TrainerChest size={NODE_W} />
                </div>
            </div>
        </div>
    )
}

export default TrainerSkillTree
