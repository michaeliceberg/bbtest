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

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, useAnimationControls } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { declensionRu } from '@/usefulFunctions'
import { CaseReel } from '@/components/CaseReel'
import { getLessonCasePool, LESSON_CASE_TIER_ICON, type LessonCaseTier } from '@/lib/caseRewards'
import { claimQuestCase, type DailyQuest, type DailyQuestKey, type DailyQuestsData } from '@/actions/generate-trainer-quest'
import { openLessonCase } from '@/actions/open-case'
import { COZY, COZY_ACCENT } from '@/lib/cozyTheme'
import { playSound, preloadSound, QUEST_SWOOSH_SOUND, QUEST_DONE_SOUND, QUEST_LAND_SOUND } from '@/lib/sound'

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

// Изменился ли прогресс квеста за этот урок — только такие бары заполняются
// анимацией (от прошлого значения к новому), остальные сразу показывают факт.
const progressChange = (q: DailyQuest) => {
    const prev = q.prevProgress ?? q.progress
    return { changed: prev !== q.progress, prevPercent: Math.min(100, (prev / q.target) * 100) }
}

// Поочерёдная анимация квестов: у изменившихся квестов по очереди сверху
// вниз — заполнение бара (звук swoosh), затем «+1» над сундуком (звук done),
// и только потом следующий. null — без анимации (факт сразу).
type RowTiming = { fillDelay: number | null; badgeDelay: number | null }
const FILL_S = 0.9
const NO_ANIM: RowTiming = { fillDelay: null, badgeDelay: null }

const buildTimings = (quests: DailyQuest[]): RowTiming[] => {
    // Старт — после появления всех карточек.
    let t = 0.3 + quests.length * 0.15 + 0.4
    return quests.map((q) => {
        const changed = (q.prevProgress ?? q.progress) !== q.progress
        if (!changed && !q.pointNow) return NO_ANIM
        const timing: RowTiming = { fillDelay: null, badgeDelay: null }
        if (changed) {
            timing.fillDelay = t
            t += FILL_S
        }
        if (q.pointNow) {
            timing.badgeDelay = t
            t += 0.55
        }
        t += 0.25
        return timing
    })
}

// «+1» квест-поинт на карточке квеста, выполненного именно в этом уроке
// (из них складывается «+N квест-поинт!» в заголовке). Появляется с отскоком
// после заполнения прогресс-бара.
const badgeStyle = (cozy?: boolean): React.CSSProperties =>
    cozy
        ? { color: '#3A2A12', background: '#FFD27A', boxShadow: '0 3px 0 #B8862E' }
        : { color: '#FFF3C4', background: 'linear-gradient(90deg, #FF7A1A, #FF3D2E)', boxShadow: '0 0 12px #FF7A1A88' }
const BADGE_CLASS = 'w-8 rounded-lg py-0.5 text-center text-sm font-black leading-none'

// gone — значок уже улетел на плашку квест-поинтов (см. FlyingPoint).
const PointBadge = ({ delay, cozy, questKey, gone }: { delay: number; cozy?: boolean; questKey: string; gone?: boolean }) => (
    <motion.span
        data-quest-badge={questKey}
        initial={{ opacity: 0, scale: 2.4, y: 10 }}
        animate={{ opacity: gone ? 0 : 1, scale: 1, y: 0 }}
        transition={gone ? { duration: 0 } : { delay, type: 'spring', bounce: 0.55, duration: 0.6 }}
        className={'absolute -top-5 left-1/2 z-10 -ml-4 ' + BADGE_CLASS}
        style={badgeStyle(cozy)}
    >
        +1
    </motion.span>
)

// «+1», летящий по дуге от сундука к плашке квест-поинтов: сначала подлетает
// вверх, затем с ускорением падает. Координаты — центр значка на сундуке и
// точка падения на плашке (fixed, в пикселях экрана).
type Flight = { id: string; from: { x: number; y: number }; to: { x: number; y: number } }
const FLIGHT_S = 0.9
const APEX_PX = 110
const FLIGHT_STEPS = 24
const FlyingPoint = ({ f, cozy, onLand }: { f: Flight; cozy?: boolean; onLand: () => void }) => {
    const dx = f.to.x - f.from.x
    const dy = f.to.y - f.from.y
    // Настоящая парабола, как у тела, брошенного под углом к горизонту:
    // x растёт равномерно, y(t) = −a·t + b·t² (b — «гравитация»), вершина на
    // APEX_PX выше старта, в t=1 — точка падения. Кривая задана плотными
    // ключевыми кадрами с линейной интерполяцией.
    const H = APEX_PX
    const a = 2 * H + 2 * Math.sqrt(H * H + H * Math.max(dy, 0))
    const b = a + dy
    const ts = Array.from({ length: FLIGHT_STEPS + 1 }, (_, i) => i / FLIGHT_STEPS)
    return (
        <motion.span
            className={'pointer-events-none fixed z-[80] ' + BADGE_CLASS}
            style={{ ...badgeStyle(cozy), left: f.from.x - 16, top: f.from.y - 10 }}
            initial={{ x: 0, y: 0, scale: 1 }}
            animate={{
                x: ts.map((t) => dx * t),
                y: ts.map((t) => -a * t + b * t * t),
                scale: ts.map((t) => 1 + 0.35 * Math.sin(Math.PI * t) - 0.2 * t),
            }}
            transition={{ duration: FLIGHT_S, ease: 'linear' }}
            onAnimationComplete={onLand}
        >
            +1
        </motion.span>
    )
}

// Упрощённая карточка: название, под ним прогресс-бар и справа сундук.
// Кейс получен — карточка золотая и блестит (без надписей).
const QuestRow = ({ q, index, timing, gone }: { q: DailyQuest; index: number; timing: RowTiming; gone?: boolean }) => {
    const accent = TIER_ACCENT[q.tier]
    const percent = Math.min(100, (q.progress / q.target) * 100)
    const changed = timing.fillDelay !== null
    const { prevPercent } = progressChange(q)
    const ready = q.done && !q.claimed
    const gold = q.claimed
    return (
        <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.15, type: 'spring', bounce: 0.4, duration: 0.6 }}
            className="relative rounded-2xl p-[2px] shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
            style={{ background: gold ? GOLD_FRAME : `linear-gradient(180deg, ${accent} 0%, #2A363C 55%, #141C20 100%)` }}
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
                <div className="flex items-center justify-between gap-2">
                    <p className="text-base font-black leading-none" style={{ color: gold ? '#FFE9A8' : '#F2F7FB' }}>
                        {questTitle(q)}
                    </p>
                </div>
                <div className="mt-3 flex items-center gap-3">
                    <div className="relative h-5 flex-1 overflow-hidden rounded-full" style={{ background: gold ? '#5A4410' : '#2A3A4A' }}>
                        <motion.div
                            className="h-full rounded-full"
                            style={{ background: gold ? 'linear-gradient(90deg, #D4A017, #FFE9A8)' : accent }}
                            initial={{ width: `${changed ? prevPercent : percent}%` }}
                            animate={{ width: `${percent}%` }}
                            transition={changed ? { delay: timing.fillDelay ?? 0, duration: FILL_S, ease: 'easeOut' } : { duration: 0 }}
                        />
                        <span
                            className="absolute inset-0 flex items-center justify-center text-xs font-black tabular-nums text-white"
                            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                        >
                            {q.progress}/{q.target}
                        </span>
                    </div>
                    <div className="relative shrink-0">
                        {timing.badgeDelay !== null && <PointBadge delay={timing.badgeDelay} questKey={q.key} gone={gone} />}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={LESSON_CASE_TIER_ICON[q.tier]}
                            alt=""
                            className={`h-11 w-11 object-contain ${ready ? 'animate-chest-idle-bounce' : ''} `}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    )
}


// ── Стиль «cozy»: тёплый, мультяшный, в духе Minecraft ─────────────────────
// Плоские «блоки» с толстой нижней гранью, тёплые тёмные тона камня/дерева,
// спокойные пастельные цвета редкости, сплошной прогресс-бар.
const CozyQuestRow = ({ q, index, timing, gone }: { q: DailyQuest; index: number; timing: RowTiming; gone?: boolean }) => {
    const a = COZY_ACCENT[q.tier]
    const percent = Math.min(100, (q.progress / q.target) * 100)
    const changed = timing.fillDelay !== null
    const { prevPercent } = progressChange(q)
    const ready = q.done && !q.claimed
    const gold = q.claimed
    // Все квесты — активного вида (цвет своей награды); выполнен и кейс получен — золотой.
    const border = gold ? COZY.honeyBorder : a.fill
    const edge = gold ? COZY.honeyEdge : a.edge
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
            <div className="flex items-center justify-between gap-2">
                <p className="text-base font-black leading-none" style={{ color: gold ? '#FFE3A3' : COZY.title }}>
                    {questTitle(q)}
                </p>
            </div>
            <div className="mt-3 flex items-center gap-3">
                <div className="relative h-5 flex-1 overflow-hidden rounded-md" style={{ background: COZY.track, boxShadow: 'inset 0 2px 0 rgba(0,0,0,0.35)' }}>
                    <motion.div
                        className="h-full"
                        style={{ background: gold ? COZY.honey : a.fill }}
                        initial={{ width: `${changed ? prevPercent : percent}%` }}
                        animate={{ width: `${percent}%` }}
                        transition={changed ? { delay: timing.fillDelay ?? 0, duration: FILL_S, ease: 'easeOut' } : { duration: 0 }}
                    />
                    <span
                        className="absolute inset-0 flex items-center justify-center text-xs font-black tabular-nums"
                        style={{ color: '#FFF8EC', textShadow: '0 2px 0 rgba(0,0,0,0.55)' }}
                    >
                        {q.progress}/{q.target}
                    </span>
                </div>
                <div className="relative shrink-0">
                    {timing.badgeDelay !== null && <PointBadge delay={timing.badgeDelay} questKey={q.key} gone={gone} cozy />}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={LESSON_CASE_TIER_ICON[q.tier]}
                        alt=""
                        className={`h-11 w-11 object-contain ${ready ? 'animate-chest-idle-bounce' : ''} `}
                    />
                </div>
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

    // Расписание считается один раз; после возврата с кейса анимация не
    // повторяется — показываем факт (и уже появившиеся «+1»).
    const [timings] = useState<RowTiming[]>(() => buildTimings(data?.quests ?? []))
    const [introDone, setIntroDone] = useState(false)
    useEffect(() => {
        preloadSound(QUEST_SWOOSH_SOUND)
        preloadSound(QUEST_DONE_SOUND)
        preloadSound(QUEST_LAND_SOUND)
        const ids: ReturnType<typeof setTimeout>[] = []
        timings.forEach((tm) => {
            if (tm.fillDelay !== null) ids.push(setTimeout(() => playSound(QUEST_SWOOSH_SOUND), tm.fillDelay * 1000))
            if (tm.badgeDelay !== null) ids.push(setTimeout(() => playSound(QUEST_DONE_SOUND), tm.badgeDelay * 1000))
        })
        return () => ids.forEach(clearTimeout)
    }, [timings])
    useEffect(() => {
        if (opening) setIntroDone(true)
    }, [opening])
    const rowTiming = (i: number, q: DailyQuest): RowTiming =>
        introDone ? { fillDelay: null, badgeDelay: q.pointNow ? 0 : null } : timings[i] ?? NO_ANIM

    // После всех баров и «+1» — значки по очереди улетают по дуге на плашку
    // «Квест-поинты за месяц»; на каждом приземлении плашка пружинит, а число
    // крупно подпрыгивает и растёт на 1 (monthPoints уже включает earnedNow).
    const flyKeys = (data?.quests ?? []).filter((q) => q.pointNow).map((q) => q.key)
    const totalPoints = data?.monthPoints ?? 0
    const [landed, setLanded] = useState(0)
    const [flights, setFlights] = useState<Flight[]>([])
    const [goneKeys, setGoneKeys] = useState<string[]>([])
    const plateRef = useRef<HTMLDivElement>(null)
    const plateControls = useAnimationControls()
    const shownPoints = introDone ? totalPoints : totalPoints - flyKeys.length + landed
    useEffect(() => {
        if (flyKeys.length === 0) return
        const badgesEnd = Math.max(0, ...timings.map((t) => t.badgeDelay ?? 0)) + 0.7
        const ids = flyKeys.map((key, k) =>
            setTimeout(() => {
                const badge = document.querySelector(`[data-quest-badge="${key}"]`)
                const plate = plateRef.current
                if (!badge || !plate) return
                const b = badge.getBoundingClientRect()
                const p = plate.getBoundingClientRect()
                // Своя точка падения для каждого сундука — равномерно по плашке.
                const frac = flyKeys.length === 1 ? 0.5 : 0.2 + (0.6 * k) / (flyKeys.length - 1)
                setGoneKeys((g) => [...g, key])
                setFlights((f) => [...f, {
                    id: key,
                    from: { x: b.left + b.width / 2, y: b.top + b.height / 2 },
                    to: { x: p.left + p.width * frac, y: p.top + p.height / 2 },
                }])
            }, (badgesEnd + k * 0.9) * 1000),
        )
        return () => ids.forEach(clearTimeout)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timings])
    const handleLand = (id: string) => {
        setFlights((f) => f.filter((x) => x.id !== id))
        setLanded((n) => n + 1)
        playSound(QUEST_LAND_SOUND)
        plateControls.start({ scale: [1, 1.07, 0.97, 1], transition: { duration: 0.45 } })
    }

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
                        cozy ? <CozyQuestRow key={q.key} q={q} index={i} timing={rowTiming(i, q)} gone={introDone || goneKeys.includes(q.key)} /> : <QuestRow key={q.key} q={q} index={i} timing={rowTiming(i, q)} gone={introDone || goneKeys.includes(q.key)} />
                    ))}
                </div>

                {flights.map((f) => (
                    <FlyingPoint key={f.id} f={f} cozy={cozy} onLand={() => handleLand(f.id)} />
                ))}

                {/* Квест-поинты за месяц */}
                <motion.div ref={plateRef} animate={plateControls}>
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
                        <motion.span
                            key={shownPoints}
                            initial={landed > 0 && !introDone ? { scale: 2.6 } : false}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', bounce: 0.6, duration: 0.6 }}
                            className="inline-block text-2xl font-black tabular-nums"
                        >
                            {shownPoints}
                        </motion.span>
                        <span className="-my-2 inline-block h-10 w-10">
                            {starLottie && <Lottie animationData={starLottie} loop autoplay className="h-full w-full" />}
                        </span>
                    </span>
                </motion.div>
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
