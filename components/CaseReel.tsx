// components/CaseReel.tsx
//
// CS:GO-style кейс — замена старой сундук/мегасундук механики
// (components/ChestReward.tsx, Rive-анимация тапов, которая глючила на
// телефонах и была тихо отключена). Пользователь жмёт кнопку "крутить" —
// лента наград быстро едет справа налево и с затуханием останавливается
// на награде, которую УЖЕ решил сервер (actions/open-case.ts) ДО начала
// анимации — сама анимация только красиво показывает уже случившийся
// результат, подделать её невозможно (тот же принцип, что и у всех
// остальных наград в проекте: сервер решает сумму, клиент её просто рисует).

'use client'

import { useCallback, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Gift } from 'lucide-react'
import { openCase, type OpenCaseResult } from '@/actions/open-case'
import { getCasePool, pickWeightedReward, rewardEmoji, rewardLabel, type CaseReward } from '@/lib/caseRewards'

const ITEM_WIDTH = 96 // px, соответствует w-24 ниже
const ITEM_GAP = 12 // px, соответствует gap-3 ниже
const SLOT_STRIDE = ITEM_WIDTH + ITEM_GAP
const STRIP_LENGTH = 40 // достаточно длинная лента, чтобы "разгон" не выглядел куце
const WINDOW_WIDTH = 320 // px, ширина видимого окна барабана (см. className ниже)
const SPIN_DURATION = 5.2 // сек — по просьбе пользователя минимум 5с, было 4.2
// Награда останавливается НЕ на последней ячейке ленты — так после
// остановки в окне видно ещё несколько ячеек СПРАВА от выигрыша (могут
// быть пиццей), создавая ощущение "чуть-чуть не доехало" по просьбе
// пользователя. 10 ячеек после — с запасом под ширину окна (~3 ячейки
// видно одновременно) плюс ощутимый "видимый остаток" ленты.
const TARGET_INDEX = STRIP_LENGTH - 10

type Phase = 'idle' | 'spinning' | 'revealed'

const RewardCell = ({ reward, highlighted }: { reward: CaseReward; highlighted?: boolean }) => (
    <div
        className={
            'shrink-0 w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-1 ' +
            (highlighted ? 'bg-[#3A2E0B] border-[#FFD460]' : 'bg-[#232F34] border-[#3A464E]')
        }
        style={{ width: ITEM_WIDTH, height: ITEM_WIDTH }}
    >
        <span className="text-3xl leading-none">{rewardEmoji(reward)}</span>
        <span className="text-[11px] font-bold text-[#F2F7FB] whitespace-nowrap">
            {reward.kind === 'pizza' ? `x${reward.amount}` : `+${reward.amount}`}
        </span>
    </div>
)

type Props = {
    isMega: boolean
    onDone: (result: { reward: CaseReward; justMaxedPizza: boolean }) => void
}

export const CaseReel = ({ isMega, onDone }: Props) => {
    const [phase, setPhase] = useState<Phase>('idle')
    const [strip, setStrip] = useState<CaseReward[]>(() => {
        const pool = getCasePool(isMega)
        return Array.from({ length: STRIP_LENGTH }, () => pickWeightedReward(pool))
    })
    const [translateX, setTranslateX] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const finalResultRef = useRef<OpenCaseResult | null>(null)
    // Случайный сдвиг ВНУТРИ финальной ячейки — барабан не тормозит ровно
    // по центру, как в реальных CS:GO-кейсах: может почти доехать до
    // соседней ячейки (перелёт) или остановиться ближе к своему левому
    // краю (недолёт) — по просьбе пользователя это добавляет напряжения,
    // "чуть не долетело/чуть не переехало". Диапазон ±0.42 от ширины
    // ячейки — заметно, но не настолько, чтобы указатель визуально ушёл
    // на СЛЕДУЮЩУЮ ячейку целиком.
    const jitterRef = useRef((Math.random() - 0.5) * (ITEM_WIDTH * 0.84))

    const handleSpin = useCallback(async () => {
        if (phase !== 'idle') return
        setPhase('spinning')
        setError(null)

        const result = await openCase(isMega).catch(() => null)
        if (!result || !result.success) {
            setError('Не удалось открыть кейс. Попробуй ещё раз.')
            setPhase('idle')
            return
        }
        finalResultRef.current = result

        // Финальная награда — НЕ последний элемент ленты (см. TARGET_INDEX),
        // остальные — та же случайная "витрина" для разнообразия картинки,
        // включая те, что остаются видны СПРАВА от выигрыша после остановки.
        setStrip((prev) => {
            const next = [...prev]
            next[TARGET_INDEX] = result.reward
            return next
        })

        const centerOfTarget = TARGET_INDEX * SLOT_STRIDE + ITEM_WIDTH / 2
        const finalX = -(centerOfTarget - WINDOW_WIDTH / 2) + jitterRef.current
        setTranslateX(finalX)
    }, [phase, isMega])

    const handleAnimationComplete = useCallback(() => {
        if (phase !== 'spinning') return
        setPhase('revealed')
    }, [phase])

    const result = finalResultRef.current
    const wonReward = result && result.success ? result.reward : null

    return (
        <div className="w-full max-w-md mx-auto py-6 flex flex-col items-center gap-5">
            <div className="flex items-center gap-2 text-[#F2F7FB]">
                <Gift className={isMega ? 'w-6 h-6 text-[#FFD460]' : 'w-5 h-5 text-[#EF9F27]'} />
                <span className="font-black text-lg">{isMega ? 'Мегакейс' : 'Кейс'}</span>
            </div>

            {/* Окно барабана — фиксированная ширина, лента едет внутри него */}
            <div
                className="relative overflow-hidden rounded-2xl border-2 border-[#3A464E] bg-[#161F23]"
                style={{ width: WINDOW_WIDTH, height: ITEM_WIDTH + 16 }}
            >
                {/* Указатель по центру окна */}
                <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-0.5 bg-[#4A90D9] z-10" />
                <div className="absolute left-1/2 -top-1 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#4A90D9] z-10" />

                <motion.div
                    className="absolute top-2 left-0 flex gap-3 px-0"
                    animate={{ x: translateX }}
                    transition={
                        phase === 'spinning'
                            ? { duration: SPIN_DURATION, ease: [0.1, 0.85, 0.25, 1] }
                            : { duration: 0 }
                    }
                    onAnimationComplete={handleAnimationComplete}
                >
                    {strip.map((reward, i) => (
                        <RewardCell key={i} reward={reward} highlighted={phase === 'revealed' && i === TARGET_INDEX} />
                    ))}
                </motion.div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            {phase === 'idle' && (
                <button
                    onClick={handleSpin}
                    className="px-8 py-3.5 rounded-xl border-2 border-b-4 active:border-b-2 bg-[#4A90D9] border-[#3A73AD] text-white font-bold uppercase tracking-wide transition-colors hover:bg-[#5499DE]"
                >
                    Крутить
                </button>
            )}

            {phase === 'spinning' && (
                <div className="px-8 py-3.5 text-[#9AA7B0] font-bold uppercase tracking-wide">
                    Крутим...
                </div>
            )}

            {phase === 'revealed' && wonReward && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <p className="text-xl font-black text-[#FFD460]">
                        {rewardLabel(wonReward)}
                    </p>
                    {result && result.success && result.justMaxedPizza && (
                        <p className="text-sm font-bold text-center text-[#F2A6D0] max-w-xs">
                            🍕 Ты собрал все 8 кусочков пиццы! Скоро сможешь заказать настоящую пиццу.
                        </p>
                    )}
                    <button
                        onClick={() => onDone({ reward: wonReward, justMaxedPizza: (result && result.success && result.justMaxedPizza) || false })}
                        className="px-8 py-3 rounded-xl border-2 border-b-4 active:border-b-2 bg-[#5FA12F] border-[#4A8322] text-white font-bold uppercase tracking-wide transition-colors hover:bg-[#6BB236]"
                    >
                        Продолжить
                    </button>
                </motion.div>
            )}
        </div>
    )
}
