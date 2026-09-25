// components/trainer-lesson-complete-screen.tsx
//
// Экран завершения урока тренажёра — в премиальном стиле экрана кейсов
// (components/CaseReel.tsx): тёмный фон со свечениями и виньеткой,
// взлетающие звёзды (Rive, CaseStars), подсветка позади маскота, карточки в
// металлической рамке. Статистика (очки опыта / серия / время) появляется
// ПО ОЧЕРЕДИ, у каждой цифры прокручиваются как барабан (RollingNumber, в
// духе motion.dev «Number Trend»). При открытии — звук арфы (WIN_SOUND).
//
// Все три цифры — честные, посчитанные в TQUIZ.tsx за реальную попытку
// (maxStreakRef / xpForAmount(TRAINER_LESSON_TRAINING_PTS) / время от
// открытия урока до последнего ответа).
// Анимации — только transform/opacity (дёшево на iPhone, см. CLAUDE.md).

'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Zap, Target, Timer, ArrowRight } from 'lucide-react'
import { declensionRu } from '@/usefulFunctions'
import { playSound, WIN_SOUND } from '@/lib/sound'
import { RollingNumber } from '@/components/rolling-number'
import { CaseStars } from '@/components/CaseReel'
import { COZY, COZY_ACCENT, type UiTheme } from '@/lib/cozyTheme'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

type Props = {
    lottieData: any
    streak: number
    xp: number
    elapsedSeconds: number
    primaryLabel: string
    onPrimary: () => void
    secondaryLabel?: string
    onSecondary?: () => void
    // "Ударный час" ещё не дошёл до рубежа (см. actions/roll-lesson-case.ts,
    // TQUIZ.tsx) — вместо заголовка "Вы запустили серию!".
    chainHint?: { count: number; remaining: number } | null
    // Стиль: игровой (по умолчанию) или тёплый «cozy» — плоские блоки с
    // толстой нижней гранью, тёплый фон, без звёзд и неона.
    theme?: UiTheme
}

// мин:сек, без долей секунды.
const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${String(s).padStart(2, '0')}`
}

// Тайминг последовательного появления (мс от открытия экрана).
const CARD_FIRST_MS = 900
const CARD_STEP_MS = 750
const BUTTONS_AFTER_MS = 500

const CozyStatCard = ({
    label, value, icon, color, edge, shown,
}: { label: string; value: string; icon: React.ReactNode; color: string; edge: string; shown: boolean }) => (
    <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.8 }}
        animate={shown ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 18, scale: 0.8 }}
        transition={{ type: 'spring', bounce: 0.45, duration: 0.6 }}
        className="flex flex-1 flex-col items-center gap-1.5 rounded-xl px-1 py-3"
        style={{ background: COZY.card, border: `3px solid ${color}`, boxShadow: `0 6px 0 ${edge}` }}
    >
        <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.1em]" style={{ color }}>
            {label}
        </span>
        <span className="flex items-center gap-1.5" style={{ color: COZY.title, textShadow: `0 2px 0 ${edge}` }}>
            <span style={{ color }}>{icon}</span>
            <RollingNumber value={value} start={shown} className="text-2xl sm:text-3xl font-black" />
        </span>
    </motion.div>
)

const StatCard = ({
    label, value, icon, color, shown,
}: { label: string; value: string; icon: React.ReactNode; color: string; shown: boolean }) => (
    <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.8 }}
        animate={shown ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 18, scale: 0.8 }}
        transition={{ type: 'spring', bounce: 0.45, duration: 0.6 }}
        className="relative flex-1 rounded-2xl p-[2px] shadow-[0_10px_28px_rgba(0,0,0,0.5)]"
        style={{ background: `linear-gradient(180deg, ${color} 0%, #2A363C 55%, #141C20 100%)` }}
    >
        {/* Свечение карточки — отдельный слой, пульсирует только opacity */}
        {shown && (
            <span
                aria-hidden
                className="animate-glow-pulse pointer-events-none absolute inset-0 rounded-2xl"
                style={{ boxShadow: `0 0 22px ${color}88` }}
            />
        )}
        <div className="relative flex h-full flex-col items-center gap-1.5 rounded-[14px] bg-gradient-to-b from-[#1C282E] to-[#0C1215] px-1 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.12em]" style={{ color }}>
                {label}
            </span>
            <span className="flex items-center gap-1.5" style={{ color, textShadow: `0 0 12px ${color}99` }}>
                {icon}
                <RollingNumber value={value} start={shown} className="text-2xl sm:text-3xl font-black" />
            </span>
        </div>
    </motion.div>
)

export const TrainerLessonCompleteScreen = ({
    lottieData, streak, xp, elapsedSeconds, primaryLabel, onPrimary, secondaryLabel, onSecondary, chainHint, theme = 'metal',
}: Props) => {
    const cozy = theme === 'cozy'
    const streakWord = declensionRu(streak, 'верный ответ', 'верных ответа', 'верных ответов')
    const lessonsWord = chainHint ? declensionRu(chainHint.remaining, 'урок', 'урока', 'уроков') : ''

    // Сколько карточек уже показано (0..3) + кнопки.
    const [shownCards, setShownCards] = useState(0)
    const [buttonsShown, setButtonsShown] = useState(false)

    useEffect(() => {
        playSound(WIN_SOUND)
        const timers = [0, 1, 2].map((i) => window.setTimeout(() => setShownCards(i + 1), CARD_FIRST_MS + i * CARD_STEP_MS))
        timers.push(window.setTimeout(() => setButtonsShown(true), CARD_FIRST_MS + 2 * CARD_STEP_MS + BUTTONS_AFTER_MS))
        return () => timers.forEach((t) => window.clearTimeout(t))
    }, [])

    const accent = chainHint ? '#FBBF24' : '#38BDF8'

    return (
        <div className="relative min-h-screen text-[#F2F7FB] flex flex-col overflow-x-clip">
            {/* Фон на весь экран: как у экрана кейсов */}
            <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundColor: cozy ? COZY.bg : '#131D22' }}>
                <div className="absolute inset-0" style={{ background: cozy ? 'radial-gradient(ellipse at 50% 25%, #FFB67A26, transparent 60%)' : `radial-gradient(ellipse at 50% 25%, ${accent}33, transparent 55%)` }} />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%, transparent 30%, rgba(0,0,0,0.6) 100%)' }} />
                {!cozy && <CaseStars tier="common" />}
            </div>

            <div className="relative z-10 flex flex-col items-center pt-6 px-4 shrink-0">
                <motion.div
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
                    className="relative w-56 h-56 sm:w-72 sm:h-72"
                >
                    <div
                        className={cozy ? 'absolute inset-4 rounded-3xl' : 'absolute inset-0'}
                        style={cozy
                            ? { background: COZY.card, border: `4px solid ${COZY.cardBorder}`, boxShadow: `0 8px 0 ${COZY.cardEdge}` }
                            : { background: 'radial-gradient(closest-side, rgba(255,255,255,0.18), transparent)' }}
                    />
                    <Lottie animationData={lottieData} loop autoplay className="relative w-full h-full" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.35, type: 'spring', bounce: 0.4, duration: 0.6 }}
                    className="text-center"
                >
                    {chainHint ? (
                        <>
                            <h1
                                className="text-3xl sm:text-4xl font-black [text-shadow:0_2px_12px_rgba(0,0,0,0.5)]"
                                style={cozy ? { color: COZY.headline, textShadow: `0 3px 0 ${COZY.headlineShadow}, 0 6px 0 rgba(0,0,0,0.35)` } : { color: '#FBBF24' }}
                            >
                                Серия x{chainHint.count} без остановки!
                            </h1>
                            <p className="text-base sm:text-lg mt-2" style={{ color: cozy ? COZY.textSoft : '#D5DEE5' }}>
                                Ещё {chainHint.remaining} {lessonsWord} без ошибок — и гарантированный мифический кейс!
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/chests/myth0001.svg" alt="" className="inline-block w-6 h-6 sm:w-7 sm:h-7 ml-1.5 -mb-1.5 align-middle" />
                            </p>
                        </>
                    ) : (
                        <>
                            <h1
                                className={cozy ? 'text-3xl sm:text-4xl font-black' : 'text-3xl sm:text-4xl font-black bg-clip-text text-transparent'}
                                style={cozy
                                    ? { color: COZY.headline, textShadow: `0 3px 0 ${COZY.headlineShadow}, 0 6px 0 rgba(0,0,0,0.35)` }
                                    : { backgroundImage: 'linear-gradient(90deg, #38BDF8, #A78BFA)' }}
                            >
                                Вы запустили серию!
                            </h1>
                            <p className="text-base sm:text-lg mt-2" style={{ color: cozy ? COZY.textSoft : '#D5DEE5' }}>
                                {streak} {streakWord} подряд? Так держать!
                            </p>
                        </>
                    )}
                </motion.div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-center px-4 py-4 min-h-0">
                {cozy ? (
                <div className="flex gap-3 w-full">
                    <CozyStatCard label="Очки опыта" value={`${xp}`} icon={<Zap className="w-5 h-5" fill="currentColor" />} color={COZY_ACCENT.mega.fill} edge={COZY_ACCENT.mega.edge} shown={shownCards >= 1} />
                    <CozyStatCard label="Серия" value={`x${streak}`} icon={<Target className="w-5 h-5" />} color={COZY_ACCENT.rare.fill} edge={COZY_ACCENT.rare.edge} shown={shownCards >= 2} />
                    <CozyStatCard label="Время" value={formatElapsed(elapsedSeconds)} icon={<Timer className="w-5 h-5" />} color={COZY.grass} edge={COZY.grassEdge} shown={shownCards >= 3} />
                </div>
                ) : (
                <div className="flex gap-3 w-full">
                    <StatCard label="Очки опыта" value={`${xp}`} icon={<Zap className="w-5 h-5" fill="currentColor" />} color="#FBBF24" shown={shownCards >= 1} />
                    <StatCard label="Серия" value={`x${streak}`} icon={<Target className="w-5 h-5" />} color="#38BDF8" shown={shownCards >= 2} />
                    <StatCard label="Время" value={formatElapsed(elapsedSeconds)} icon={<Timer className="w-5 h-5" />} color="#34D399" shown={shownCards >= 3} />
                </div>
                )}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={buttonsShown ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
                transition={{ duration: 0.35 }}
                className="relative z-10 px-4 pb-4 pt-2 shrink-0 flex flex-col gap-3"
                style={{ pointerEvents: buttonsShown ? 'auto' : 'none' }}
            >
                {cozy ? (
                    <motion.button
                        onClick={onPrimary}
                        whileTap={{ y: 5, boxShadow: `0 1px 0 ${COZY.grassEdge}` }}
                        className="flex w-full items-center justify-center gap-2.5 rounded-xl px-8 py-4 font-black text-lg uppercase tracking-[0.08em]"
                        style={{ background: COZY.grass, color: COZY.darkText, boxShadow: `0 6px 0 ${COZY.grassEdge}` }}
                    >
                        {primaryLabel}
                        <ArrowRight className="h-5 w-5" />
                    </motion.button>
                ) : (
                <PremiumButton onClick={onPrimary} accent="#78C93C">
                    {primaryLabel}
                    <ArrowRight className="h-5 w-5" />
                </PremiumButton>
                )}
                {secondaryLabel && onSecondary && (
                    <button
                        onClick={onSecondary}
                        className={cozy
                            ? 'w-full rounded-xl px-6 py-3 text-sm font-bold uppercase tracking-[0.1em]'
                            : 'w-full rounded-2xl border-2 border-[#3A464E] bg-[#151F23]/80 px-6 py-3 text-sm font-bold uppercase tracking-[0.1em] text-[#D5DEE5] transition-colors hover:border-[#5A6B76]'}
                        style={cozy ? { background: COZY.wood, color: '#FFE8C7', border: `3px solid ${COZY.woodBorder}`, boxShadow: `0 5px 0 ${COZY.woodEdge}` } : undefined}
                    >
                        {secondaryLabel}
                    </button>
                )}
            </motion.div>
        </div>
    )
}

// Кнопка в стиле кнопок кейса: металлическая рамка, тёмное стекло, цветной
// текст, пульсирующее свечение (opacity) и блик.
const PremiumButton = ({ children, onClick, accent }: { children: React.ReactNode; onClick: () => void; accent: string }) => (
    <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.97, y: 2 }}
        className="relative w-full rounded-2xl p-[2px] shadow-[0_10px_28px_rgba(0,0,0,0.5)]"
        style={{ background: `linear-gradient(180deg, ${accent} 0%, #2A363C 55%, #141C20 100%)` }}
    >
        <span aria-hidden className="animate-glow-pulse pointer-events-none absolute inset-0 rounded-2xl" style={{ boxShadow: `0 0 26px ${accent}AA` }} />
        <span
            className="animate-shine-sweep relative flex items-center justify-center gap-2.5 rounded-[14px] bg-gradient-to-b from-[#1C282E] to-[#0C1215] px-8 py-4 font-black text-lg uppercase tracking-[0.1em] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            style={{ color: accent, textShadow: `0 0 12px ${accent}99` }}
        >
            {children}
        </span>
    </motion.button>
)
