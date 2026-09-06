'use client'

// Интерактивный тренажёр "выразить переменную в пропорции" —
// перетаскивание карточек-букв мышкой, по мотивам
// https://motion.dev/examples/react-reorder-grid (магнитное прилипание
// к месту + сдвиг соседей), но с СОБСТВЕННОЙ моделью "разрешённых
// ходов" вместо свободной сортировки списка: карточку можно перекинуть
// только ПО ДИАГОНАЛИ — из знаменателя одной части уравнения в
// числитель другой (и наоборот), это и есть визуальное правило
// "креста-накрест" при решении пропорции.
//
// Область действия ЭТОЙ первой версии (по прямой договорённости с
// пользователем — "потом усложним"): искомая буква (target) стоит ОДНА
// в числителе слева (tl) и никогда не двигается; остальные буквы либо
// уже стоят на своих правильных местах (tr/br — просто опоры, их
// трогать не нужно), либо стоят в знаменателе слева (bl) и их НУЖНО
// перетащить по диагонали в числитель справа (tr), чтобы получить
// target = (bl·tr) / br. Более сложный случай (искомая буква сама
// сидит в знаменателе, несколько множителей на нескольких этажах —
// см. пример пользователя a/(cd)=qp/(at)) требует уже полноценной
// перестройки уравнения, а не просто диагонального хода — сознательно
// не реализован здесь.

import { useEffect, useRef, useState } from 'react'
import { motion, animate as fmAnimate, useMotionValue, type PanInfo, type MotionValue } from 'framer-motion'

type SlotKey = 'tl' | 'bl' | 'tr' | 'br'

export type ProportionExercise = {
    id: string
    // Показывается над тренажёром, например "Выразите a".
    target: string
    tl: string[]
    bl: string[]
    tr: string[]
    br: string[]
    // Рисовать ли дробную черту и рамку у правого знаменателя — для
    // простого случая a/b=c (denominator справа подразумевается "1" и
    // визуально не нужен) должно быть false.
    showRightDenominator: boolean
}

type CardState = {
    letter: string
    slot: SlotKey
    home: SlotKey
    draggable: boolean
}

const DIAGONAL: Record<SlotKey, SlotKey> = { tl: 'br', br: 'tl', bl: 'tr', tr: 'bl' }

const CARD_SIZE = 56
const CARD_HALF = CARD_SIZE / 2
const STACK_GAP = 60

const SLOT_CENTER: Record<SlotKey, { x: number; y: number }> = {
    tl: { x: 90, y: 68 },
    bl: { x: 90, y: 212 },
    tr: { x: 372, y: 68 },
    br: { x: 372, y: 212 },
}

function buildInitialCards(ex: ProportionExercise): CardState[] {
    const cards: CardState[] = []
    ;(['tl', 'bl', 'tr', 'br'] as SlotKey[]).forEach((slot) => {
        ex[slot].forEach((letter) => {
            cards.push({ letter, slot, home: slot, draggable: slot === 'bl' })
        })
    })
    return cards
}

function computeTargets(cards: CardState[]): Record<string, { x: number; y: number }> {
    const bySlot: Record<SlotKey, CardState[]> = { tl: [], bl: [], tr: [], br: [] }
    cards.forEach((c) => bySlot[c.slot].push(c))
    const result: Record<string, { x: number; y: number }> = {}
    ;(Object.keys(bySlot) as SlotKey[]).forEach((slot) => {
        const list = bySlot[slot]
        const n = list.length
        list.forEach((c, i) => {
            const offset = (i - (n - 1) / 2) * STACK_GAP
            result[c.letter] = {
                x: SLOT_CENTER[slot].x + offset - CARD_HALF,
                y: SLOT_CENTER[slot].y - CARD_HALF,
            }
        })
    })
    return result
}

function DraggableCard({
    card,
    target,
    containerRef,
    zoneRefs,
    onDragStart,
    onDragMove,
    onDragEnd,
    isHome,
}: {
    card: CardState
    target: { x: number; y: number }
    containerRef: React.RefObject<HTMLDivElement | null>
    zoneRefs: React.RefObject<Record<SlotKey, HTMLDivElement | null>>
    onDragStart: (card: CardState) => void
    onDragMove: (x: number, y: number) => void
    onDragEnd: (card: CardState, hoverSlot: SlotKey | null, x: MotionValue<number>, y: MotionValue<number>) => void
    isHome: boolean
}) {
    const x = useMotionValue(target.x)
    const y = useMotionValue(target.y)
    const prevTarget = useRef(target)
    const hoverRef = useRef<SlotKey | null>(null)

    useEffect(() => {
        if (prevTarget.current.x !== target.x || prevTarget.current.y !== target.y) {
            fmAnimate(x, target.x, { type: 'spring', stiffness: 280, damping: 26 })
            fmAnimate(y, target.y, { type: 'spring', stiffness: 280, damping: 26 })
            prevTarget.current = target
        }
    }, [target.x, target.y, x, y])

    const findZone = (px: number, py: number): SlotKey | null => {
        const zones = zoneRefs.current
        if (!zones) return null
        for (const key of ['tl', 'bl', 'tr', 'br'] as SlotKey[]) {
            const el = zones[key]
            if (!el) continue
            const r = el.getBoundingClientRect()
            if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) return key
        }
        return null
    }

    return (
        <motion.div
            drag={card.draggable}
            dragMomentum={false}
            dragElastic={0.12}
            dragConstraints={containerRef}
            style={{ position: 'absolute', left: 0, top: 0, x, y, touchAction: 'none' }}
            whileDrag={{ scale: 1.08, zIndex: 20 }}
            onDragStart={() => onDragStart(card)}
            onDrag={(_e, info: PanInfo) => {
                const zone = findZone(info.point.x, info.point.y)
                hoverRef.current = zone
                onDragMove(info.point.x, info.point.y)
            }}
            onDragEnd={() => onDragEnd(card, hoverRef.current, x, y)}
            className={
                'flex items-center justify-center rounded-2xl border-2 font-serif italic text-2xl font-bold select-none ' +
                (card.draggable
                    ? 'cursor-grab active:cursor-grabbing bg-[#1B2C3D] border-[#4A90D9] text-[#F2F7FB] shadow-[0_4px_0_0_#2C4A63]'
                    : 'bg-[#1B2C3D]/70 border-[#3A464E] text-[#9AA7B0]')
            }
            initial={false}
            animate={isHome ? { scale: [1, 1.15, 1] } : undefined}
            transition={isHome ? { duration: 0.35 } : undefined}
        >
            <div style={{ width: CARD_SIZE, height: CARD_SIZE }} className="flex items-center justify-center">
                {card.letter}
            </div>
        </motion.div>
    )
}

export default function ProportionDragTrainer({
    exercise,
    onSolved,
}: {
    exercise: ProportionExercise
    onSolved?: () => void
}) {
    const [cards, setCards] = useState<CardState[]>(() => buildInitialCards(exercise))
    const [dragHome, setDragHome] = useState<SlotKey | null>(null)
    const [hoverZone, setHoverZone] = useState<SlotKey | null>(null)
    const [solved, setSolved] = useState(false)
    const [wrongFlashSlot, setWrongFlashSlot] = useState<SlotKey | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const zoneRefs = useRef<Record<SlotKey, HTMLDivElement | null>>({ tl: null, bl: null, tr: null, br: null })
    const notifiedRef = useRef(false)

    // Сброс на новое упражнение, если поменялся exercise.id.
    const exerciseIdRef = useRef(exercise.id)
    if (exerciseIdRef.current !== exercise.id) {
        exerciseIdRef.current = exercise.id
    }

    const targets = computeTargets(cards)
    const allowedZone = dragHome ? DIAGONAL[dragHome] : null

    const handleDragStart = (card: CardState) => setDragHome(card.home)

    const handleDragMove = (px: number, py: number) => {
        const zones = zoneRefs.current
        let found: SlotKey | null = null
        for (const key of ['tl', 'bl', 'tr', 'br'] as SlotKey[]) {
            const el = zones[key]
            if (!el) continue
            const r = el.getBoundingClientRect()
            if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) {
                found = key
                break
            }
        }
        setHoverZone(found)
    }

    const handleDragEnd = (
        card: CardState,
        hover: SlotKey | null,
        x: MotionValue<number>,
        y: MotionValue<number>,
    ) => {
        setDragHome(null)
        setHoverZone(null)
        const wantedSlot = DIAGONAL[card.home]
        if (hover === wantedSlot) {
            setCards((prev) => {
                const next = prev.map((c) => (c.letter === card.letter ? { ...c, slot: wantedSlot } : c))
                return next
            })
        } else {
            if (hover) {
                setWrongFlashSlot(hover)
                setTimeout(() => setWrongFlashSlot(null), 350)
            }
            const home = targets[card.letter]
            fmAnimate(x, home.x, { type: 'spring', stiffness: 500, damping: 30 })
            fmAnimate(y, home.y, { type: 'spring', stiffness: 500, damping: 30 })
        }
    }

    useEffect(() => {
        const allMoved = cards.filter((c) => c.draggable).every((c) => c.slot === DIAGONAL[c.home])
        if (allMoved && !notifiedRef.current) {
            notifiedRef.current = true
            setSolved(true)
            onSolved?.()
        }
    }, [cards, onSolved])

    const zoneClass = (key: SlotKey): string => {
        const base = 'absolute rounded-xl border-2 border-dashed transition-colors duration-150'
        if (wrongFlashSlot === key) return base + ' border-[#DC605B] bg-[#DC605B]/15'
        if (hoverZone === key && allowedZone === key) return base + ' border-[#A1D151] bg-[#A1D151]/20'
        if (hoverZone === key && allowedZone !== key && dragHome) return base + ' border-[#DC605B] bg-[#DC605B]/15'
        if (allowedZone === key) return base + ' border-[#4A90D9] bg-[#4A90D9]/10'
        return base + ' border-[#3A464E]/60 bg-transparent'
    }

    const zoneStyle = (key: SlotKey): React.CSSProperties => {
        const c = SLOT_CENTER[key]
        const w = 150
        const h = 96
        return { left: c.x - w / 2, top: c.y - h / 2, width: w, height: h }
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="text-sm text-[#9AA7B0]">
                Перетащи букву из знаменателя на другую сторону уравнения — в числитель,
                чтобы выразить <span className="text-[#F2F7FB] font-semibold">{exercise.target}</span>
            </div>
            <div
                ref={containerRef}
                className="relative select-none"
                style={{ width: 460, height: 280 }}
            >
                {(['tl', 'bl', 'tr', 'br'] as SlotKey[]).map((key) => {
                    if (key === 'br' && !exercise.showRightDenominator && exercise.br.length === 0) return null
                    return (
                        <div
                            key={key}
                            ref={(el) => {
                                zoneRefs.current[key] = el
                            }}
                            className={zoneClass(key)}
                            style={zoneStyle(key)}
                        />
                    )
                })}

                {/* дробные черты */}
                <div
                    className="absolute bg-[#5A6A72]"
                    style={{ left: 20, top: 139, width: 140, height: 3, borderRadius: 2 }}
                />
                {exercise.showRightDenominator && (
                    <div
                        className="absolute bg-[#5A6A72]"
                        style={{ left: 302, top: 139, width: 140, height: 3, borderRadius: 2 }}
                    />
                )}

                {/* знак равенства */}
                <div
                    className="absolute flex flex-col items-center justify-center gap-1.5"
                    style={{ left: 216, top: 128 }}
                >
                    <div className="w-7 h-[3px] rounded bg-[#9AA7B0]" />
                    <div className="w-7 h-[3px] rounded bg-[#9AA7B0]" />
                </div>

                {cards.map((card) => (
                    <DraggableCard
                        key={card.letter}
                        card={card}
                        target={targets[card.letter]}
                        containerRef={containerRef}
                        zoneRefs={zoneRefs}
                        onDragStart={handleDragStart}
                        onDragMove={handleDragMove}
                        onDragEnd={handleDragEnd}
                        isHome={card.slot === DIAGONAL[card.home]}
                    />
                ))}
            </div>

            {solved && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-4 py-2 rounded-xl bg-[#A1D151]/15 border border-[#A1D151] text-[#A1D151] text-sm font-medium"
                >
                    Готово! Значит {exercise.target} = {[...exercise.tr, ...exercise.bl].join(' · ')}
                    {exercise.br.length > 0 ? ` / ${exercise.br.join(' · ')}` : ''}
                </motion.div>
            )}
        </div>
    )
}
