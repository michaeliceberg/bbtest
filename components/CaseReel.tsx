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

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import { Gift, Sparkles } from 'lucide-react'
import { openCase, type OpenCaseResult } from '@/actions/open-case'
import { getCasePool, isJackpotReward, pickWeightedReward, rewardEmoji, rewardLabel, type CaseReward } from '@/lib/caseRewards'
import LottieCoins from '@/public/Lottie/LottieCoins.json'
import LottieGems from '@/public/Lottie/LottieGems.json'

// Те же самые lottie-анимации монет/гемов, что уже используются в шапке
// (components/user-progress.tsx) и магазине — вместо голых эмодзи,
// по просьбе пользователя ("у нас уже есть готовые lottie").
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

const ITEM_WIDTH = 96 // px, соответствует w-24 ниже
const ITEM_GAP = 12 // px, соответствует gap-3 ниже
const SLOT_STRIDE = ITEM_WIDTH + ITEM_GAP
const STRIP_LENGTH = 40 // достаточно длинная лента, чтобы "разгон" не выглядел куце
// Раньше окно барабана было фиксированной ширины (320px) — по просьбе
// пользователя теперь тянется на всю доступную ширину мобильного экрана
// (тот же стандартный отступ px-4, что и у остального контента урока
// тренажёра, см. trainer-question.tsx) — реальная ширина измеряется
// через ref в момент запуска, а не жёстко зашита в код.
const FALLBACK_WINDOW_WIDTH = 320 // на случай, если измерить ширину почему-то не удалось
const SPIN_DURATION = 8 // сек — по просьбе пользователя, для более плавного затухания
// Награда останавливается НЕ на последней ячейке ленты — так после
// остановки в окне видно ещё несколько ячеек СПРАВА от выигрыша (могут
// быть пиццей), создавая ощущение "чуть-чуть не доехало" по просьбе
// пользователя. 10 ячеек после — с запасом под ширину окна (несколько
// ячеек видно одновременно) плюс ощутимый "видимый остаток" ленты.
const TARGET_INDEX = STRIP_LENGTH - 10

type Phase = 'idle' | 'spinning' | 'revealed'

// Премиальная палитра по редкости награды — пицца оформлена как самая
// "легендарная" (золотое свечение), гемы — холодный синий акцент,
// монеты — нейтральный тёплый металлик.
const RARITY_STYLE: Record<CaseReward['kind'], { cell: string; glow: string; text: string }> = {
    coins: {
        cell: 'bg-gradient-to-b from-[#2E383F] to-[#1B2429] border-[#4A5860]',
        glow: '',
        text: '#F2C879',
    },
    gems: {
        cell: 'bg-gradient-to-b from-[#232C52] to-[#161B35] border-[#4F63B8]',
        glow: 'shadow-[0_0_14px_rgba(90,120,230,0.35)]',
        text: '#8FA6FF',
    },
    pizza: {
        cell: 'bg-gradient-to-b from-[#3D2E10] to-[#241A0A] border-[#FFD460]',
        glow: 'shadow-[0_0_18px_rgba(255,212,96,0.45)]',
        text: '#FFD460',
    },
}

const RewardCell = ({ reward, highlighted }: { reward: CaseReward; highlighted?: boolean }) => {
    const rarity = RARITY_STYLE[reward.kind]
    return (
        <motion.div
            className={
                'shrink-0 w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ' +
                (highlighted ? 'bg-gradient-to-b from-[#4A3B12] to-[#2A2008] border-[#FFD460]' : rarity.cell + ' ' + rarity.glow)
            }
            style={{ width: ITEM_WIDTH, height: ITEM_WIDTH }}
            animate={highlighted ? { boxShadow: ['0 0 8px rgba(255,212,96,0.3)', '0 0 22px rgba(255,212,96,0.7)', '0 0 8px rgba(255,212,96,0.3)'] } : undefined}
            transition={highlighted ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
        >
            {/* Пока лента крутится — lottie как СТАТИЧНАЯ картинка (autoplay
                выключен, показывает 1-й кадр), не проигрывается на всех
                ячейках сразу; оживает только на итоговой выигрышной ячейке
                (highlighted) — и ради экономии ресурсов на быстрой
                прокрутке, и по прямой просьбе пользователя. */}
            {reward.kind === 'coins' && <Lottie animationData={LottieCoins} loop autoplay={!!highlighted} className="w-10 h-10" />}
            {reward.kind === 'gems' && <Lottie animationData={LottieGems} loop autoplay={!!highlighted} className="w-9 h-9" />}
            {reward.kind === 'pizza' && <span className="text-3xl leading-none">{rewardEmoji(reward)}</span>}
            <span className="text-[11px] font-bold whitespace-nowrap" style={{ color: highlighted ? '#FFD460' : rarity.text }}>
                {reward.kind === 'pizza' ? `x${reward.amount}` : `+${reward.amount}`}
            </span>
        </motion.div>
    )
}

// Не-пиццевые реакции — по одному случайному ролику на показ (не
// перевыбирается на каждый ре-рендер), см. RewardVideo ниже.
const OK_REACTION_FILES = ['ok1.webm', 'ok2.webm', 'ok3.webm', 'ok4.webm', 'ok5.webm', 'ok6.webm', 'ok7.webm']

// Пробует проиграть со звуком (реальный клик по "Крутить" — настоящий
// user gesture, браузер обычно это разрешает); если политика браузера
// всё же заблокирует автовоспроизведение со звуком — тихо повторяет
// попытку без звука, чтобы ролик показался в любом случае, а не пропал.
// Крутится по кругу (loop), пока не сменится награда — реакция короткая,
// а карточка результата может провисеть на экране заметно дольше.
const RewardVideo = ({ src, glow }: { src: string; glow?: string }) => {
    const ref = useRef<HTMLVideoElement>(null)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        el.play().catch(() => {
            el.muted = true
            el.play().catch(() => {})
        })
    }, [src])
    return (
        <video
            ref={ref}
            src={src}
            loop
            playsInline
            className={'w-full max-w-[240px] h-auto rounded-xl ' + (glow ?? '')}
        />
    )
}

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
    const windowRef = useRef<HTMLDivElement>(null)
    // Реальная ширина окна барабана — измеряется из DOM (окно теперь
    // резиновое, w-full), а не жёстко задана константой.
    const windowWidthRef = useRef(FALLBACK_WINDOW_WIDTH)
    // Случайный сдвиг ВНУТРИ финальной ячейки — барабан не тормозит ровно
    // по центру, как в реальных CS:GO-кейсах: может почти доехать до
    // соседней ячейки (перелёт) или остановиться ближе к своему левому
    // краю (недолёт) — по просьбе пользователя это добавляет напряжения,
    // "чуть не долетело/чуть не переехало". Диапазон ±0.42 от ширины
    // ячейки — заметно, но не настолько, чтобы указатель визуально ушёл
    // на СЛЕДУЮЩУЮ ячейку целиком.
    const jitterRef = useRef((Math.random() - 0.5) * (ITEM_WIDTH * 0.84))
    // Случайная не-пиццевая реакция выбирается ОДИН раз за спин (в момент
    // получения результата от сервера), а не на каждый ре-рендер.
    const reactionVideoRef = useRef<string>(OK_REACTION_FILES[0])
    const { width, height } = useWindowSize()

    useEffect(() => {
        if (!windowRef.current) return
        const measure = () => {
            if (windowRef.current) windowWidthRef.current = windowRef.current.getBoundingClientRect().width || FALLBACK_WINDOW_WIDTH
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(windowRef.current)
        return () => ro.disconnect()
    }, [])

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
        if (result.reward.kind !== 'pizza') {
            reactionVideoRef.current = OK_REACTION_FILES[Math.floor(Math.random() * OK_REACTION_FILES.length)]
        }

        // Финальная награда — НЕ последний элемент ленты (см. TARGET_INDEX),
        // остальные — та же случайная "витрина" для разнообразия картинки,
        // включая те, что остаются видны СПРАВА от выигрыша после остановки.
        setStrip((prev) => {
            const next = [...prev]
            next[TARGET_INDEX] = result.reward
            return next
        })

        const windowWidth = windowWidthRef.current
        const centerOfTarget = TARGET_INDEX * SLOT_STRIDE + ITEM_WIDTH / 2
        const finalX = -(centerOfTarget - windowWidth / 2) + jitterRef.current
        setTranslateX(finalX)
    }, [phase, isMega])

    const handleAnimationComplete = useCallback(() => {
        if (phase !== 'spinning') return
        setPhase('revealed')
    }, [phase])

    const result = finalResultRef.current
    const wonReward = result && result.success ? result.reward : null
    const wonRarity = wonReward ? RARITY_STYLE[wonReward.kind] : null
    // Джекпот (пицца или максимум монет/гемов для этого пула) — повод
    // для конфетти, по просьбе пользователя.
    const isJackpot = phase === 'revealed' && wonReward ? isJackpotReward(wonReward, getCasePool(isMega)) : false

    return (
        <div className="w-full max-w-md mx-auto px-4 py-6 flex flex-col items-center gap-5">
            {isJackpot && <Confetti width={width} height={height} recycle={false} numberOfPieces={260} />}
            <div className="flex items-center gap-2 text-[#F2F7FB]">
                <Gift className={isMega ? 'w-6 h-6 text-[#FFD460]' : 'w-5 h-5 text-[#EF9F27]'} />
                <span className="font-black text-lg tracking-wide">{isMega ? 'Мегакейс' : 'Кейс'}</span>
            </div>

            {/* Окно барабана — резиновая ширина (заполняет мобильный экран со
                стандартными отступами px-4 у обёртки), премиальная рамка с
                градиентом + мягкое свечение снаружи. */}
            <div className="relative w-full rounded-2xl p-[2px] bg-gradient-to-b from-[#5A6B76] via-[#2A363C] to-[#141C20] shadow-[0_10px_34px_rgba(0,0,0,0.55)]">
                <div
                    ref={windowRef}
                    className="relative w-full overflow-hidden rounded-[14px] bg-gradient-to-b from-[#1C282E] to-[#0C1215]"
                    style={{ height: ITEM_WIDTH + 16 }}
                >
                    {/* Указатель по центру окна */}
                    <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-0.5 bg-[#4A90D9] z-30 shadow-[0_0_8px_rgba(74,144,217,0.8)]" />
                    <div className="absolute left-1/2 -top-1 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#4A90D9] z-30" />

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

                    {/* Затухающие "маски" по краям окна — прячут резкий обрез
                        ленты слева/справа, классический приём кейс-барабанов. */}
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-10 z-20 bg-gradient-to-r from-[#0C1215] to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-10 z-20 bg-gradient-to-l from-[#0C1215] to-transparent" />
                </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            {phase === 'idle' && (
                <motion.button
                    onClick={handleSpin}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-xl border-2 border-b-4 active:border-b-2 bg-gradient-to-b from-[#5CA6E8] to-[#3A73AD] border-[#2E5C8A] text-white font-bold uppercase tracking-wide shadow-[0_0_22px_rgba(74,144,217,0.45)]"
                >
                    <Sparkles className="w-5 h-5" />
                    Крутить
                </motion.button>
            )}

            {phase === 'spinning' && (
                <div className="px-8 py-3.5 text-[#9AA7B0] font-bold uppercase tracking-wide">
                    Крутим...
                </div>
            )}

            {phase === 'revealed' && wonReward && wonRarity && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    {/* Реакция-видео (WebM, зацикленное) — "Pizza time!" на
                        дроп пиццы, иначе случайный ролик из ok1..ok7 — по
                        просьбе пользователя. */}
                    {wonReward.kind === 'pizza' ? (
                        <RewardVideo src="/webm/pizzaTime.webm" glow="shadow-[0_0_24px_rgba(255,212,96,0.35)]" />
                    ) : (
                        <RewardVideo src={`/webm/${reactionVideoRef.current}`} />
                    )}
                    <div className="relative flex items-center justify-center">
                        <div
                            className="absolute inset-0 rounded-full blur-2xl opacity-60"
                            style={{ background: `radial-gradient(closest-side, ${wonRarity.text}66, transparent 75%)` }}
                        />
                        <p className="relative text-xl font-black" style={{ color: wonRarity.text }}>
                            {rewardLabel(wonReward)}
                        </p>
                    </div>
                    {result && result.success && result.justMaxedPizza && (
                        <p className="text-sm font-bold text-center text-[#F2A6D0] max-w-xs">
                            🍕 Ты собрал все 8 кусочков пиццы! Скоро сможешь заказать настоящую пиццу.
                        </p>
                    )}
                    <motion.button
                        onClick={() => onDone({ reward: wonReward, justMaxedPizza: (result && result.success && result.justMaxedPizza) || false })}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        className="px-8 py-3 rounded-xl border-2 border-b-4 active:border-b-2 bg-gradient-to-b from-[#6BB236] to-[#4A8322] border-[#3D6B1B] text-white font-bold uppercase tracking-wide shadow-[0_0_18px_rgba(95,161,47,0.4)]"
                    >
                        Продолжить
                    </motion.button>
                </motion.div>
            )}
        </div>
    )
}
