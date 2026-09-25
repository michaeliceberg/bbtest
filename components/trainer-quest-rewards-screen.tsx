// components/trainer-quest-rewards-screen.tsx
//
// Экран «Квесты дня» — ПОСЛЕДНИЙ в цепочке финала урока тренажёра
// (итоги → рулетка, если выпала → этот экран), показывается после любого
// урока. Премиальный стиль экрана кейсов (фон, металлические рамки), без звёзд.
//
// Квесты (дневные, начинаются заново каждый день; считает сервер —
// actions/generate-trainer-quest.ts, reportLessonQuestSignals):
//   Продли серию дней → Обычный кейс; 2 урока без ошибок → Редкий;
//   КОМБО 8 в трёх уроках → Мифический; ДЗ на сегодня (если есть) → МЕГА.
// Карточка: название, прогресс-бар и сундук справа; кейс получен — золотая
// блестящая карточка. Неоткрытые кейсы выполненных квестов открываются по
// «Дальше» автоматически, по очереди от менее редких к более редким
// (CaseReel; награду решает сервер — claimQuestCase, раз в день на квест).
// Каждый выполненный квест = +1 квест-поинт; внизу — сумма за месяц.

'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { declensionRu } from '@/usefulFunctions'
import { CaseReel } from '@/components/CaseReel'
import { getLessonCasePool, LESSON_CASE_TIER_ICON, type LessonCaseTier } from '@/lib/caseRewards'
import { claimQuestCase, type DailyQuest, type DailyQuestKey, type DailyQuestsData } from '@/actions/generate-trainer-quest'
import { RollingNumber } from '@/components/rolling-number'
import { openLessonCase } from '@/actions/open-case'
import { COZY, COZY_ACCENT } from '@/lib/cozyTheme'

export type QuestRewardsData = DailyQuestsData | null

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

// Горящие Lottie (public/Lottie/numbers) грузятся по запросу — по ~100 КБ,
// нужна одна цифра и звезда, не весь набор.
const useLottieFile = (src: string | null) => {
    const [data, setData] = useState<object | null>(null)
    useEffect(() => {
        if (!src) return
        let alive = true
        fetch(src)
            .then((r) => r.json())
            .then((d) => alive && setData(d))
            .catch(() => {})
        return () => {
            alive = false
        }
    }, [src])
    return data
}

// Огненная палитра экрана квестов.
const FIRE_GRADIENT = 'linear-gradient(90deg, #FFD23F, #FF7A1A 55%, #FF3D2E)'

const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']

// Цвет рамки/акцента по редкости награды (в тон фонам кейсов).
const TIER_ACCENT: Record<LessonCaseTier, string> = {
    common: '#8FA3AE',
    rare: '#00C5FF',
    mythic: '#A868FC',
    mega: '#FF8A00',
}

const questTitle = (q: DailyQuest) => {
    if (q.key === 'streak') return 'Продли серию дней'
    if (q.key === 'perfect') return `Пройди ${q.target} ${declensionRu(q.target, 'урок', 'урока', 'уроков')} без ошибок`
    if (q.key === 'combo8') return `КОМБО 8 в ${q.target} уроках`
    return 'Сделай домашние задания'
}

type Props = {
    data: QuestRewardsData
    t_lessonId: number
    primaryLabel: string
    onPrimary: () => void
    secondaryLabel?: string
    onSecondary?: () => void
    // Только для тестовой страницы /test-quests: кейсы открываются обычным
    // openLessonCase (данные примерные — серверная проверка квеста бы отказала).
    demo?: boolean
    // Оформление: 'metal' (по умолчанию, текущее) или 'cozy' — тёплый
    // мультяшный стиль в духе Minecraft (пробный, /test-quests-cozy).
    theme?: 'metal' | 'cozy'
}

// Порядок автоматического открытия кейсов — от менее редких к более редким.
const TIER_ORDER: LessonCaseTier[] = ['common', 'rare', 'mythic', 'mega']

// Золотая рамка карточки, чей кейс уже получен.
const GOLD_FRAME = 'linear-gradient(135deg, #FFE9A8 0%, #D4A017 35%, #FFF3C4 55%, #B8860B 100%)'

// Упрощённая карточка: название, под ним прогресс-бар и справа сундук.
// Кейс получен — карточка золотая и блестит (без надписей).
const QuestRow = ({ q, index }: { q: DailyQuest; index: number }) => {
    const accent = TIER_ACCENT[q.tier]
    const percent = Math.min(100, (q.progress / q.target) * 100)
    const ready = q.done && !q.claimed
    const gold = q.claimed
    return (
        <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.15, type: 'spring', bounce: 0.4, duration: 0.6 }}
            className="relative rounded-2xl p-[2px] shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
            style={{ background: gold ? GOLD_FRAME : `linear-gradient(180deg, ${ready ? accent : '#5A6B76'} 0%, #2A363C 55%, #141C20 100%)` }}
        >
            {(gold || ready) && (
                <span
                    aria-hidden
                    className="animate-glow-pulse pointer-events-none absolute inset-0 rounded-2xl"
                    style={{ boxShadow: `0 0 22px ${gold ? '#FBBF24AA' : accent + '99'}` }}
                />
            )}
            <div
                className={`relative rounded-[14px] px-4 pt-3.5 pb-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${gold ? 'animate-shine-sweep' : ''}`}
                style={{ background: gold ? 'linear-gradient(180deg, #3A2E10 0%, #1A1406 100%)' : 'linear-gradient(180deg, #1C282E 0%, #0C1215 100%)' }}
            >
                <p className="text-base font-black leading-none" style={{ color: gold ? '#FFE9A8' : '#F2F7FB' }}>
                    {questTitle(q)}
                </p>
                <div className="mt-3 flex items-center gap-3">
                    <div className="relative h-5 flex-1 overflow-hidden rounded-full" style={{ background: gold ? '#5A4410' : '#2A3A4A' }}>
                        <motion.div
                            className="h-full rounded-full"
                            style={{ background: gold ? 'linear-gradient(90deg, #D4A017, #FFE9A8)' : q.done ? accent : '#5A6B76' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ delay: 0.4 + index * 0.15, duration: 0.7, ease: 'easeOut' }}
                        />
                        <span
                            className="absolute inset-0 flex items-center justify-center text-xs font-black tabular-nums text-white"
                            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                        >
                            {q.progress}/{q.target}
                        </span>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={LESSON_CASE_TIER_ICON[q.tier]}
                        alt=""
                        className={`h-11 w-11 shrink-0 object-contain ${ready ? 'animate-chest-idle-bounce' : ''} ${!q.done ? 'opacity-50 grayscale' : ''}`}
                    />
                </div>
            </div>
        </motion.div>
    )
}


// ── Стиль «cozy»: тёплый, мультяшный, в духе Minecraft ─────────────────────
// Плоские «блоки» с толстой нижней гранью, тёплые тёмные тона камня/дерева,
// спокойные пастельные цвета редкости, сплошной прогресс-бар.
const CozyQuestRow = ({ q, index }: { q: DailyQuest; index: number }) => {
    const a = COZY_ACCENT[q.tier]
    const percent = Math.min(100, (q.progress / q.target) * 100)
    const ready = q.done && !q.claimed
    const gold = q.claimed
    const border = gold ? COZY.honeyBorder : ready ? a.fill : COZY.cardBorder
    const edge = gold ? COZY.honeyEdge : ready ? a.edge : COZY.cardEdge
    return (
        <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.15, type: 'spring', bounce: 0.45, duration: 0.6 }}
            className={`relative rounded-xl px-4 pt-3.5 pb-3 ${gold ? 'animate-shine-sweep' : ''}`}
            style={{
                background: gold ? COZY.honeyCard : COZY.card,
                border: `3px solid ${border}`,
                boxShadow: `0 6px 0 ${edge}`,
            }}
        >
            <p className="text-base font-black leading-none" style={{ color: gold ? '#FFE3A3' : COZY.title }}>
                {questTitle(q)}
            </p>
            <div className="mt-3 flex items-center gap-3">
                <div className="relative h-5 flex-1 overflow-hidden rounded-md" style={{ background: COZY.track, boxShadow: 'inset 0 2px 0 rgba(0,0,0,0.35)' }}>
                    <motion.div
                        className="h-full"
                        style={{ background: gold ? COZY.honey : q.done ? a.fill : '#6B645B' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ delay: 0.4 + index * 0.15, duration: 0.7, ease: 'easeOut' }}
                    />
                    <span
                        className="absolute inset-0 flex items-center justify-center text-xs font-black tabular-nums"
                        style={{ color: '#FFF8EC', textShadow: '0 2px 0 rgba(0,0,0,0.55)' }}
                    >
                        {q.progress}/{q.target}
                    </span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={LESSON_CASE_TIER_ICON[q.tier]}
                    alt=""
                    className={`h-11 w-11 shrink-0 object-contain ${ready ? 'animate-chest-idle-bounce' : ''} ${!q.done ? 'opacity-50 grayscale' : ''}`}
                />
            </div>
        </motion.div>
    )
}

export const TrainerQuestRewardsScreen = ({ data, t_lessonId, primaryLabel, onPrimary, secondaryLabel, onSecondary, demo, theme = 'metal' }: Props) => {
    const cozy = theme === 'cozy'
    const [quests, setQuests] = useState<DailyQuest[]>(data?.quests ?? [])
    const [opening, setOpening] = useState<DailyQuest | null>(null)
    const monthName = MONTHS[data?.monthIndex ?? new Date().getMonth()]
    const earned = Math.min(9, data?.earnedNow ?? 0)
    const digitLottie = useLottieFile(earned > 0 ? `/Lottie/numbers/burn${earned}.json` : null)
    const starLottie = useLottieFile('/Lottie/numbers/burnStar.json')

    // Выполненные квесты с неоткрытыми кейсами — открываются по «Дальше»
    // автоматически, по очереди, от менее редких к более редким.
    const pending = quests
        .filter((q) => q.done && !q.claimed)
        .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier))
    const hasPending = pending.length > 0

    if (opening) {
        const key: DailyQuestKey = opening.key
        return (
            <CaseReel
                key={key}
                isMega={opening.tier !== 'common'}
                tier={opening.tier}
                pool={getLessonCasePool(opening.tier)}
                spinAction={() => (demo ? openLessonCase(opening.tier) : claimQuestCase(t_lessonId, key))}
                theme={theme}
                onDone={() => {
                    const next = quests.map((q) => (q.key === key ? { ...q, claimed: true } : q))
                    setQuests(next)
                    // Следующий неоткрытый кейс — сразу, иначе назад к квестам.
                    const nextPending = next
                        .filter((q) => q.done && !q.claimed)
                        .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier))[0]
                    setOpening(nextPending ?? null)
                }}
            />
        )
    }

    return (
        <div className="relative min-h-screen text-[#F2F7FB] flex flex-col overflow-x-clip">
            <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundColor: '#131D22' }}>
                <div className="absolute inset-0" style={{ background: cozy ? 'radial-gradient(ellipse at 50% 10%, #FFB67A26, transparent 60%)' : 'radial-gradient(ellipse at 50% 12%, #FF7A1A33, transparent 55%)' }} />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%, transparent 30%, rgba(0,0,0,0.6) 100%)' }} />
            </div>

            <div className="relative z-10 flex flex-col gap-3 px-4 pt-8">
                {/* Заголовок в огненном стиле: «+N квест-поинт!» с горящей цифрой
                    (public/Lottie/numbers/burnN.json); если за этот урок новых
                    поинтов нет — просто «Квесты дня». */}
                <motion.h1
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
                    className="flex items-center justify-center gap-1 text-3xl font-black"
                    style={cozy ? { color: '#FFE08A', textShadow: '0 3px 0 #8A4B14, 0 6px 0 rgba(0,0,0,0.35)' } : undefined}
                >
                    {earned > 0 ? (
                        <>
                            <span className={cozy ? "" : "bg-clip-text text-transparent"} style={cozy ? undefined : { backgroundImage: FIRE_GRADIENT }}>+</span>
                            <span className="relative -my-3 inline-block h-16 w-12">
                                {digitLottie && <Lottie animationData={digitLottie} loop autoplay className="h-full w-full" />}
                            </span>
                            <span className={cozy ? "" : "bg-clip-text text-transparent"} style={cozy ? undefined : { backgroundImage: FIRE_GRADIENT }}>
                                {declensionRu(earned, 'квест-поинт', 'квест-поинта', 'квест-поинтов')}!
                            </span>
                        </>
                    ) : (
                        <span className={cozy ? "" : "bg-clip-text text-transparent"} style={cozy ? undefined : { backgroundImage: FIRE_GRADIENT }}>Квесты дня</span>
                    )}
                </motion.h1>

                <div className="mt-2 flex flex-col gap-3">
                    {quests.map((q, i) => (
                        cozy ? <CozyQuestRow key={q.key} q={q} index={i} /> : <QuestRow key={q.key} q={q} index={i} />
                    ))}
                </div>

                {/* Квест-поинты за месяц */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + quests.length * 0.15 + 0.2, duration: 0.4 }}
                    className={cozy ? 'mt-3 flex items-center justify-between rounded-xl px-4 py-3' : 'mt-2 flex items-center justify-between rounded-2xl border border-[#3A464E] bg-[#151F23]/80 px-4 py-3'}
                    style={cozy ? { background: COZY.wood, border: `3px solid ${COZY.woodBorder}`, boxShadow: `0 6px 0 ${COZY.woodEdge}` } : undefined}
                >
                    <span className="text-sm font-bold" style={{ color: cozy ? '#FFE8C7' : '#D5DEE5' }}>
                        Квест-поинты за {monthName}
                    </span>
                    <span className="flex items-center gap-1 text-[#FFB020]">
                        <RollingNumber value={String(data?.monthPoints ?? 0)} start className="text-2xl font-black" />
                        <span className="-my-2 inline-block h-10 w-10">
                            {starLottie && <Lottie animationData={starLottie} loop autoplay className="h-full w-full" />}
                        </span>
                    </span>
                </motion.div>
            </div>

            <div className="flex-1" />

            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + quests.length * 0.15, duration: 0.35 }}
                className="relative z-10 flex flex-col gap-3 px-4 pb-4 pt-4"
            >
                {cozy ? (
                <motion.button
                    onClick={hasPending ? () => setOpening(pending[0]) : onPrimary}
                    whileTap={{ y: 5, boxShadow: `0 1px 0 ${COZY.grassEdge}` }}
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl px-8 py-4 font-black text-lg uppercase tracking-[0.08em]"
                    style={{ background: COZY.grass, color: '#FFFDF5', boxShadow: `0 6px 0 ${COZY.grassEdge}`, textShadow: '0 2px 0 rgba(0,0,0,0.25)' }}
                >
                    {hasPending ? 'Дальше' : primaryLabel}
                    <ArrowRight className="h-5 w-5" strokeWidth={3} />
                </motion.button>
                ) : (
                <motion.button
                    onClick={hasPending ? () => setOpening(pending[0]) : onPrimary}
                    whileTap={{ scale: 0.97, y: 2 }}
                    className="relative w-full rounded-2xl p-[2px] shadow-[0_10px_28px_rgba(0,0,0,0.5)]"
                    style={{ background: 'linear-gradient(180deg, #78C93C 0%, #2A363C 55%, #141C20 100%)' }}
                >
                    <span aria-hidden className="animate-glow-pulse pointer-events-none absolute inset-0 rounded-2xl" style={{ boxShadow: '0 0 26px #78C93CAA' }} />
                    <span
                        className="animate-shine-sweep relative flex items-center justify-center gap-2.5 rounded-[14px] bg-gradient-to-b from-[#1C282E] to-[#0C1215] px-8 py-4 font-black text-lg uppercase tracking-[0.1em]"
                        style={{ color: '#78C93C', textShadow: '0 0 12px #78C93C99' }}
                    >
                        {hasPending ? 'Дальше' : primaryLabel}
                        <ArrowRight className="h-5 w-5" />
                    </span>
                </motion.button>
                )}
                {/* «Завершить» — только когда все кейсы открыты, чтобы их не пропустили. */}
                {!hasPending && secondaryLabel && onSecondary && (
                    <button
                        onClick={onSecondary}
                        className={cozy ? 'w-full rounded-xl px-6 py-3 text-sm font-black uppercase tracking-[0.08em] active:translate-y-1' : 'w-full rounded-2xl border-2 border-[#3A464E] bg-[#151F23]/80 px-6 py-3 text-sm font-bold uppercase tracking-[0.1em] text-[#D5DEE5] transition-colors hover:border-[#5A6B76]'}
                        style={cozy ? { background: COZY.card, color: '#FFE8C7', border: `3px solid ${COZY.cardBorder}`, boxShadow: `0 5px 0 ${COZY.cardEdge}` } : undefined}
                    >
                        {secondaryLabel}
                    </button>
                )}
            </motion.div>
        </div>
    )
}
