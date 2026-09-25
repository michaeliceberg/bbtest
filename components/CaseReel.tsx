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
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-webgl2'
import { playSound, preloadSound, CASE_PRIZE_SOUND } from '@/lib/sound'
import {
  getCasePool, getLessonCasePool, isJackpotReward, pickWeightedReward, rewardEmoji, rewardLabel, type CaseReward,
  LESSON_CASE_TIER_ICON, LESSON_CASE_TIER_LABEL, LESSON_CASE_TIER_PAGE_BG, type LessonCaseTier,
} from '@/lib/caseRewards'
import { COZY, COZY_ACCENT, COZY_PAGE_BG, type UiTheme } from '@/lib/cozyTheme'
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
// Звук барабана — AAC 192 кбит/с из WAV-оригинала (public/sounds-originals/roulete.wav,
// 1.1 МБ → ~150 КБ); предзагружается при появлении кейса, чтобы звук стартовал
// ровно с нажатием «Крутить», а не после скачивания.
const ROULETTE_SOUND = '/roulete.m4a'
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

// Тёплый стиль «cozy»: плоская ячейка-блок, цветная обводка по типу награды.
const COZY_CELL: Record<CaseReward['kind'], { border: string; text: string }> = {
    coins: { border: '#C9A15A', text: '#F2C35B' },
    gems: { border: '#6FB8D8', text: '#8FD3F0' },
    pizza: { border: '#E8955A', text: '#FFB67A' },
}

const RewardCell = ({ reward, highlighted, cozy }: { reward: CaseReward; highlighted?: boolean; cozy?: boolean }) => {
    const rarity = RARITY_STYLE[reward.kind]
    return (
        <motion.div
            className={
                cozy
                    ? 'shrink-0 w-24 h-24 rounded-xl flex flex-col items-center justify-center gap-1'
                    : 'shrink-0 w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ' +
                      (highlighted ? 'bg-gradient-to-b from-[#4A3B12] to-[#2A2008] border-[#FFD460]' : rarity.cell + ' ' + rarity.glow)
            }
            style={
                cozy
                    ? {
                          width: ITEM_WIDTH,
                          height: ITEM_WIDTH - 4,
                          background: highlighted ? COZY.honeyCard : COZY.card,
                          border: `3px solid ${highlighted ? COZY.honeyBorder : COZY_CELL[reward.kind].border}`,
                          boxShadow: `0 4px 0 ${highlighted ? COZY.honeyEdge : COZY.cardEdge}`,
                      }
                    : { width: ITEM_WIDTH, height: ITEM_WIDTH }
            }
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
            <span className="text-[11px] font-bold whitespace-nowrap" style={{ color: cozy ? (highlighted ? COZY.honey : COZY_CELL[reward.kind].text) : highlighted ? '#FFD460' : rarity.text }}>
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

// Акцент кнопки "Крутить" в тон фону страницы по редкости кейса
// (LESSON_CASE_TIER_PAGE_BG) — у common фон почти чёрный, поэтому акцент
// светлее самого фона, иначе кнопка бы растворилась.
const LESSON_CASE_TIER_ACCENT: Record<LessonCaseTier, string> = {
    common: '#8FA3AE',
    rare: '#00C5FF',
    mythic: '#A868FC',
    mega: '#FF8A00',
}

// Кнопки кейса ("Крутить"/"Продолжить") в том же премиальном стиле, что
// и окно барабана: металлическая градиентная рамка, тёмное "стекло"
// внутри, текст/иконка в цвет редкости, пульсирующее свечение + блик.
// Свечение вокруг — светлое на ярких фонах (rare/mythic/mega): свечение
// в цвет редкости на фоне того же цвета не видно; на тёмном common —
// в цвет акцента (как понравилось пользователю).
const CaseButton = ({ accent, glow, onClick, children }: { accent: string; glow: string; onClick: () => void; children: React.ReactNode }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96, y: 2 }}
        className="relative z-10 rounded-2xl p-[2px] shadow-[0_10px_28px_rgba(0,0,0,0.5)]"
        style={{ background: `linear-gradient(180deg, ${accent} 0%, #2A363C 55%, #141C20 100%)` }}
    >
        {/* Свечение — отдельный слой, пульсирует только opacity (CSS): анимация
            самого box-shadow на iPhone давала ~10 fps. */}
        <span
            aria-hidden
            className="animate-glow-pulse pointer-events-none absolute inset-0 rounded-2xl"
            style={{ boxShadow: `0 0 28px ${glow}BB` }}
        />
        <span
            className="animate-shine-sweep relative flex items-center gap-2.5 px-10 py-3.5 rounded-[14px] bg-gradient-to-b from-[#1C282E] to-[#0C1215] font-black text-lg uppercase tracking-[0.12em] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            style={{ color: accent, textShadow: `0 0 12px ${accent}99` }}
        >
            {children}
        </span>
    </motion.button>
)

// Взлетающие звёзды на заднем фоне кейса (Rive, public/rive/stars-<tier>.riv).
// Оригинал пользователя — public/rive/originals/stars.riv: у вариантов фон
// артборда сделан прозрачным (байт альфы цвета #282828), у rare/mythic/mega
// цвет звёзд перекрашен в светлый тон фона страницы (common — исходный цвет).
// Растянуты на весь экран (Fit.Cover), полупрозрачные.
export const CaseStars = ({ tier }: { tier: LessonCaseTier }) => {
    const { RiveComponent } = useRive({
        src: `/rive/stars-${tier}.riv`,
        stateMachines: 'State Machine 1',
        autoplay: true,
        layout: new Layout({ fit: Fit.Cover, alignment: Alignment.Center }),
    })
    return <RiveComponent className="absolute inset-0 w-full h-full opacity-70" />
}

// Кнопка тёплого стиля: плоский пастельный блок с толстой нижней гранью,
// при нажатии «утапливается».
const CozyButton = ({ fill, edge, onClick, children }: { fill: string; edge: string; onClick: () => void; children: React.ReactNode }) => (
    <motion.button
        onClick={onClick}
        whileTap={{ y: 5, boxShadow: `0 1px 0 ${edge}` }}
        className="relative z-10 flex items-center gap-2.5 rounded-xl px-10 py-3.5 font-black text-lg uppercase tracking-[0.08em]"
        style={{ background: fill, color: COZY.darkText, boxShadow: `0 6px 0 ${edge}` }}
    >
        {children}
    </motion.button>
)

type Props = {
    isMega: boolean
    onDone: (result: { reward: CaseReward; justMaxedPizza: boolean }) => void
    // Опционально — переопределяют пул наград/сам вызов открытия кейса и
    // заголовок над барабаном. Нужно для анонимного диагностического
    // теста (app/test/[subject]/diagnostic-client.tsx), где вместо
    // openCase() (требует auth()) используется openDiagnosticCase() и
    // отдельный, более узкий пул (только пицца/гемы, см. lib/caseRewards.ts).
    // Без этих пропов поведение полностью совпадает с прежним.
    pool?: CaseReward[]
    spinAction?: () => Promise<OpenCaseResult>
    title?: string
    // Редкость самого КЕЙСА (не награды внутри него) — common/rare/mythic,
    // см. lib/caseRewards.ts. Только у "кейса за урок" (actions/roll-lesson-
    // case.ts) их реально три — у позиционных кейса/мегакейса на карте
    // скиллов и у мегакейса за горячий вопрос всегда бинарно isMega, им
    // этот проп не передаётся. По прямой просьбе пользователя — над
    // барабаном должно быть явно видно, какая именно это редкость.
    tier?: LessonCaseTier
    // Оформление: игровое (по умолчанию) или тёплое «cozy» (lib/cozyTheme.ts).
    theme?: UiTheme
}

export const CaseReel = ({ isMega, onDone, pool: poolOverride, spinAction, title, tier, theme = 'metal' }: Props) => {
    const cozy = theme === 'cozy'
    const [phase, setPhase] = useState<Phase>('idle')
    const [chestEntered, setChestEntered] = useState(false)
    const basePool = poolOverride ?? (tier ? getLessonCasePool(tier) : getCasePool(isMega))
    const [strip, setStrip] = useState<CaseReward[]>(() => {
        const pool = basePool
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
        preloadSound(ROULETTE_SOUND)
        preloadSound(CASE_PRIZE_SOUND)
    }, [])
    const accent = tier ? LESSON_CASE_TIER_ACCENT[tier] : '#4A90D9'
    const glow = !tier || tier === 'common' ? accent : '#FFFFFF'
    // Тёплый стиль: кнопка «Крутить» — пастельный цвет редкости (или трава).
    const cozyFill = tier ? COZY_ACCENT[tier] : { fill: COZY.grass, edge: COZY.grassEdge }

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
        // Звук рулетки — на нажатие "Крутить" и на всю анимацию барабана,
        // по прямой просьбе пользователя. Файл (~6.2с) короче самой
        // анимации (SPIN_DURATION=8с) — специально не растягивается
        // playbackRate'ом (сбило бы тон), спин просто доигрывает молча
        // последние ~1.8с, что совпадает с моментом, когда лента и так уже
        // визуально замедляется.
        playSound(ROULETTE_SOUND)

        const result = await (spinAction ? spinAction() : openCase(isMega)).catch(() => null)
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
    }, [phase, isMega, spinAction])

    const handleAnimationComplete = useCallback(() => {
        if (phase !== 'spinning') return
        // Звук «приз!» — ровно в момент, когда барабан встал на награде.
        playSound(CASE_PRIZE_SOUND)
        setPhase('revealed')
    }, [phase])

    const result = finalResultRef.current
    const wonReward = result && result.success ? result.reward : null
    const wonRarity = wonReward ? RARITY_STYLE[wonReward.kind] : null
    // Джекпот (пицца или максимум монет/гемов для этого пула) — повод
    // для конфетти, по просьбе пользователя.
    const isJackpot = phase === 'revealed' && wonReward ? isJackpotReward(wonReward, basePool) : false

    return (
        <div className="relative w-full max-w-md mx-auto px-4 py-6 flex flex-col items-center gap-5">
            {/* Фон ВСЕЙ страницы в цвет редкости кейса (по прямой просьбе
                пользователя) — fixed-слой под контентом (z-0, контент z-10). */}
            {tier && (
                <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundColor: cozy ? COZY_PAGE_BG[tier] : LESSON_CASE_TIER_PAGE_BG[tier] }}>
                    {/* Подсветка позади ящика + затемнение к краям (виньетка) —
                        как понравилось пользователю на тёмном common; на ярких
                        фонах без виньетки подсветка не читалась. */}
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.22), transparent 55%)' }} />
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%, transparent 30%, rgba(0,0,0,0.55) 100%)' }} />
                    {/* Звёзды плавно гаснут после нажатия «Крутить». */}
                    <div
                        className="absolute inset-0 transition-opacity duration-700 ease-out"
                        style={{ opacity: phase === 'idle' ? 1 : 0 }}
                    >
                        <CaseStars tier={tier} />
                    </div>
                </div>
            )}
            {isJackpot && <Confetti width={width} height={height} recycle={false} numberOfPieces={260} />}
            {/* Заголовок — по прямой просьбе пользователя (2026-09-18)
                отдельная рамка-бейдж "ОБЫЧНЫЙ КЕЙС" над этой строкой убрана
                целиком, а иконка теперь сама показывает редкость: у "кейса
                за урок" (tier задан) — настоящая SVG-картинка кейса своей
                редкости (тот же набор, что и у мифического сундука на
                экране "Серия без остановки"), вместо голой lucide-иконки
                Gift; у позиционных кейса/мегакейса на карте скиллов и
                мегакейса за горячий вопрос (tier не задан, только isMega)
                — Gift не тронут, как и было. */}
            {tier ? (
                <div className="relative z-10 flex flex-col items-center gap-1 text-white">
                    {title && <span className="text-sm font-bold opacity-90 [text-shadow:0_1px_4px_rgba(0,0,0,0.45)]">{title}</span>}
                    {/* После пружинного появления — бесконечное покачивание-
                        bounce, пока не нажали «Крутить» (CSS-анимация на
                        обёртке: framer владеет transform самой картинки). */}
                    <div className={chestEntered && phase === 'idle' ? 'animate-chest-idle-bounce' : ''}>
                        <motion.img
                            src={LESSON_CASE_TIER_ICON[tier]}
                            alt=""
                            className="w-44 h-auto drop-shadow-[0_8px_18px_rgba(0,0,0,0.35)]"
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', bounce: 0.5, duration: 0.7 }}
                            onAnimationComplete={() => setChestEntered(true)}
                        />
                    </div>
                    <span
                        className="text-4xl font-black tracking-wide uppercase [text-shadow:0_2px_8px_rgba(0,0,0,0.45)]"
                        style={cozy ? { color: COZY.headline, textShadow: `0 3px 0 ${COZY.headlineShadow}, 0 6px 0 rgba(0,0,0,0.3)` } : undefined}
                    >
                        {LESSON_CASE_TIER_LABEL[tier]}
                    </span>
                </div>
            ) : (
                <div className="flex items-center gap-2.5 text-[#F2F7FB]">
                    <Gift className={isMega ? 'w-6 h-6 text-[#FFD460]' : 'w-5 h-5 text-[#EF9F27]'} />
                    <span className="font-black text-lg tracking-wide">{title ?? (isMega ? 'Мегакейс' : 'Кейс')}</span>
                </div>
            )}

            {/* Окно барабана — резиновая ширина (заполняет мобильный экран со
                стандартными отступами px-4 у обёртки), премиальная рамка с
                градиентом + мягкое свечение снаружи. */}
            <div
                className={cozy ? 'relative z-10 w-full rounded-xl' : 'relative z-10 w-full rounded-2xl p-[2px] bg-gradient-to-b from-[#5A6B76] via-[#2A363C] to-[#141C20] shadow-[0_10px_34px_rgba(0,0,0,0.55)]'}
                style={cozy ? { border: `3px solid ${COZY.woodBorder}`, boxShadow: `0 6px 0 ${COZY.woodEdge}`, background: COZY.wood } : undefined}
            >
                <div
                    ref={windowRef}
                    className={cozy ? 'relative w-full overflow-hidden rounded-lg' : 'relative w-full overflow-hidden rounded-[14px] bg-gradient-to-b from-[#1C282E] to-[#0C1215]'}
                    style={cozy ? { height: ITEM_WIDTH + 16, background: COZY.track } : { height: ITEM_WIDTH + 16 }}
                >
                    {/* Указатель по центру окна */}
                    <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-0.5 z-30" style={cozy ? { background: COZY.headline } : { background: '#4A90D9', boxShadow: '0 0 8px rgba(74,144,217,0.8)' }} />
                    <div className="absolute left-1/2 -top-1 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] z-30" style={{ borderTopColor: cozy ? COZY.headline : '#4A90D9' }} />

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
                            <RewardCell key={i} reward={reward} cozy={cozy} highlighted={phase === 'revealed' && i === TARGET_INDEX} />
                        ))}
                    </motion.div>

                    {/* Затухающие "маски" по краям окна — прячут резкий обрез
                        ленты слева/справа, классический приём кейс-барабанов. */}
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-10 z-20" style={{ background: `linear-gradient(to right, ${cozy ? COZY.track : '#0C1215'}, transparent)` }} />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-10 z-20" style={{ background: `linear-gradient(to left, ${cozy ? COZY.track : '#0C1215'}, transparent)` }} />
                </div>
            </div>

            {error && <p className="relative z-10 text-sm text-red-400">{error}</p>}

            {phase === 'idle' &&
                (cozy ? (
                    <CozyButton fill={cozyFill.fill} edge={cozyFill.edge} onClick={handleSpin}>
                        <Sparkles className="w-5 h-5" />
                        Крутить
                    </CozyButton>
                ) : (
                    <CaseButton accent={accent} glow={glow} onClick={handleSpin}>
                        <Sparkles className="w-5 h-5" />
                        Крутить
                    </CaseButton>
                ))}

            {phase === 'spinning' && (
                <div className={"relative z-10 px-8 py-3.5 font-bold uppercase tracking-wide " + (tier ? "text-white" : "text-[#9AA7B0]")}>
                    Крутим...
                </div>
            )}

            {phase === 'revealed' && wonReward && wonRarity && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 flex flex-col items-center gap-4"
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
                        <p className={"relative text-xl font-black " + (tier || cozy ? "px-4 py-1.5 rounded-xl" : "")} style={cozy ? { color: COZY.headline, background: COZY.card, border: `3px solid ${COZY.cardBorder}`, boxShadow: `0 4px 0 ${COZY.cardEdge}` } : tier ? { color: wonRarity.text, background: 'rgba(12,18,21,0.8)' } : { color: wonRarity.text }}>
                            {rewardLabel(wonReward)}
                        </p>
                    </div>
                    {result && result.success && result.justMaxedPizza && (
                        <p className="text-sm font-bold text-center text-[#F2A6D0] max-w-xs">
                            🍕 Ты собрал все 8 кусочков пиццы! Скоро сможешь заказать настоящую пиццу.
                        </p>
                    )}
                    {cozy ? (
                        <CozyButton
                            fill={COZY.grass}
                            edge={COZY.grassEdge}
                            onClick={() => onDone({ reward: wonReward, justMaxedPizza: (result && result.success && result.justMaxedPizza) || false })}
                        >
                            Продолжить
                        </CozyButton>
                    ) : (
                        <CaseButton
                            accent={accent}
                            glow={glow}
                            onClick={() => onDone({ reward: wonReward, justMaxedPizza: (result && result.success && result.justMaxedPizza) || false })}
                        >
                            Продолжить
                        </CaseButton>
                    )}
                </motion.div>
            )}
        </div>
    )
}
