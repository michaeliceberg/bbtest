// app/t-lesson/[t_lessonId]/type-sincosdefwalk.tsx
//
// Тип SINCOSDEFWALK — интерактивный разбор "sin/cos как отношение сторон"
// (тренажёр "Геометрия: Синус, косинус, тангенс", урок СРАЗУ ПОСЛЕ SINWALK
// — "что такое противолежащий/прилежащий катет" уже пройдено, здесь эти
// понятия используются, не объясняются заново). Тот же принцип
// самодостаточного типа, что и у SINWALK/LOG*WALK — компонент сам ведёт
// свою внутреннюю хореографию и зовёт onComplete РОВНО один раз в конце.
//
// Сюжет — прямая инструкция пользователя:
// 1. Сцена "формула sin": треугольник сверху (подписаны только гипотенуза
//    и противолежащий катет), под ним "sin α = противолежащий/гипотенуза"
//    (стикеры на словах, настоящая дробь). Затем 3 задания на sin.
// 2. Сцена "формула cos": тот же треугольник, но подписан прилежащий катет
//    (противолежащий — нет), под ним "cos α = прилежащий/гипотенуза".
//    Затем 3 задания на cos. Порядок сцен — см. SCENES.
// Тренировка (3+3 задания, см. makeTrials) —
//    НОВЫЙ треугольник на каждое задание, стороны подписаны ЧИСЛАМИ
//    (случайная пифагорова тройка 3-4-5/5-12-13/6-8-10, случайный угол α,
//    случайный поворот/зеркало — та же идея визуального разнообразия,
//    что и в тренировке SINWALK), нужно заполнить дробь "sin α = ?/?"
//    (или cos), кликая числа из пула снизу — они "прилетают" в дробь
//    (framer-motion shared layoutId, настоящий FLIP-переход между пулом
//    и пропуском, а не просто bounce на месте). Клик по уже стоящему в
//    дроби числу возвращает его обратно в пул. Числа на диаграмме — ВСЕГДА
//    нейтрального белого цвета (не подсказывают роль стороны цветом,
//    как это делает SINWALK для наименования — здесь ученик САМ должен
//    определить по положению относительно α, какая сторона куда идёт).

'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import type { QuestionType } from './page'
import {
    RightTriangleDiagram, LEG_COLOR, ADJACENT_LEG_COLOR, HYPOTENUSE_COLOR, SIDE_DRAW_DURATION,
    type AlphaVertex,
} from '@/components/geometry/RightTriangleDiagram'
import { Typewriter } from '@/components/geometry/Typewriter'
import {
    TypedLine, DiagramBlock, pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    isFieryMilestoneTrial, FieryFeedbackBanner,
    AdminSceneMap, MAP_INTRO_COLOR, MAP_PRACTICE_COLOR, type AdminMapEntry,
} from '@/components/geometry/WalkthroughLog'
import { hexToRgba } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'
import { playSound } from '@/lib/sound'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
    isAdmin?: boolean
}

// Пауза ПОСЛЕ клика "Дальше", ДО начала следующей сцены — тот же принцип
// (и то же значение), что и у SINWALK.
const SCENE_TRANSITION_PAUSE_MS = 1000
const DIAGRAM_TO_TEXT_PAUSE_MS = 900
// Момент, когда собственная анимация диаграммы концепции (гипотенуза +
// оба катета дорисовываются параллельно, все highlighted=true с самого
// начала — не по очереди, как в SINWALK, там это разные ШАГИ) устаканивается.
const CONCEPT_SETTLE_MS = (SIDE_DRAW_DURATION + 0.6) * 1000

// ===== Боксовый стикер — тот же визуальный язык, что уже устоялся в
// LOG*WALK/SINWALK-разборах — локальная копия, общего экспорта нет
// (каждый *WALK-файл несёт свою, см. историю в CLAUDE.md). =====
const Sticker = ({ value, color }: { value: React.ReactNode; color: string }) => (
    <motion.span
        initial={{ scale: 2.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15 }}
        className="inline-flex items-center justify-center rounded-lg border-2 font-extrabold align-middle px-2 py-1 leading-none whitespace-nowrap"
        style={{ borderColor: color, backgroundColor: hexToRgba(color, 0.18), color }}
    >
        {value}
    </motion.span>
)

// Настоящая дробь (числитель НАД знаменателем, не "a/b" строкой) — оба
// стикера и разделительная черта лежат в flex-col с items-stretch, черта
// автоматически растягивается до ширины САМОГО широкого стикера (тот же
// приём, что классический CSS-фрокшн-бар).
// Черта дроби заметно толще и выступает за края стикеров с обеих сторон
// (по жалобе пользователя: между двумя стикерами тонкую черту почти не было
// видно — непонятно, что одно делится на другое).
const StaticFraction = ({
    numerator, denominator,
}: { numerator: { text: string; color: string }; denominator: { text: string; color: string } }) => (
    <span className="inline-flex flex-col items-center mx-4 align-middle">
        <Sticker value={numerator.text} color={numerator.color} />
        <span className="self-stretch -mx-3 h-[5px] my-2.5 rounded-full bg-[#F2F7FB]" />
        <Sticker value={denominator.text} color={denominator.color} />
    </span>
)

// Печатаемая строка "sin α = " → по завершении печати появляется дробь со
// стикерами (тот же принцип, что и TypedLineWithSticker в SINWALK — типа
// плоский текст, потом размеченная версия).
const TypedFractionLine = ({
    label, numerator, denominator, onSettled,
}: {
    label: string
    numerator: { text: string; color: string }
    denominator: { text: string; color: string }
    onSettled?: () => void
}) => {
    const [typed, setTyped] = useState(false)
    return (
        <div className="w-full text-lg md:text-xl font-bold text-[#F2F7FB] flex items-center justify-center flex-wrap gap-1">
            {!typed ? (
                <Typewriter text={`${label} = `} onDone={() => { setTyped(true); setTimeout(() => onSettled?.(), 450) }} />
            ) : (
                <>
                    <span>{label} = </span>
                    <StaticFraction numerator={numerator} denominator={denominator} />
                </>
            )}
        </div>
    )
}

// Сцена-концепция: треугольник СВЕРХУ, под ним формула — ТОЛЬКО одна
// (sin или cos, по прямой просьбе пользователя: сначала говорим только про
// sin, потом отдельной сценой — только про cos). На треугольнике подписан и
// подсвечен ТОЛЬКО тот катет, который входит в формулу этой сцены.
const ConceptScene = ({ kind, onSettled }: { kind: Kind; onSettled?: () => void }) => {
    const [formulaVisible, setFormulaVisible] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setFormulaVisible(true), CONCEPT_SETTLE_MS + DIAGRAM_TO_TEXT_PAUSE_MS)
        return () => clearTimeout(t)
    }, [])
    const isSin = kind === 'sin'
    return (
        <div className="w-full flex flex-col items-center gap-4">
            <div className="w-full max-w-[460px]">
                <DiagramBlock>
                    <RightTriangleDiagram
                        compact rightAngleMarkShown hypotenuseHighlighted hypotenuseLabelShown
                        alphaVertex="P"
                        oppositeLegHighlighted={isSin} oppositeLegLabelShown={isSin}
                        adjacentLegHighlighted={!isSin} adjacentLegLabelShown={!isSin}
                    />
                </DiagramBlock>
            </div>
            <div className="w-full flex justify-center">
                {formulaVisible && (
                    <TypedFractionLine
                        label={isSin ? 'sin α' : 'cos α'}
                        numerator={isSin
                            ? { text: 'противолежащий', color: LEG_COLOR }
                            : { text: 'прилежащий', color: ADJACENT_LEG_COLOR }}
                        denominator={{ text: 'гипотенуза', color: HYPOTENUSE_COLOR }}
                        onSettled={onSettled}
                    />
                )}
            </div>
        </div>
    )
}

// ===== Тренировка =====

// Пифагоровы тройки (сторона, сторона, гипотенуза — третье число ВСЕГДА
// наибольшее, поэтому роль гипотенузы однозначна по величине; какая из
// первых двух достанется legRP, а какая legRQ — решает makeTrial случайно).
const TRIPLES: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [6, 8, 10]]
// 0° сознательно исключён — тот же принцип, что и в тренировке SINWALK:
// обучающая (неповёрнутая) ориентация уже показана в концепции, тренировка
// должна выглядеть заметно "новой" картинкой с первого же задания.
const ROTATIONS = [35, -35, 55, -55, 75, -75, 110, -110, 140, -140, 160, -160]
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

type Kind = 'sin' | 'cos'
type TrialConfig = {
    legRPValue: number
    legRQValue: number
    hypValue: number
    alphaVertex: AlphaVertex
    rotationDeg: number
    mirror: boolean
    kind: Kind
}

const oppositeValueOf = (cfg: TrialConfig) => (cfg.alphaVertex === 'P' ? cfg.legRQValue : cfg.legRPValue)
const adjacentValueOf = (cfg: TrialConfig) => (cfg.alphaVertex === 'P' ? cfg.legRPValue : cfg.legRQValue)
const correctNumerator = (cfg: TrialConfig) => (cfg.kind === 'sin' ? oppositeValueOf(cfg) : adjacentValueOf(cfg))
const correctDenominator = (cfg: TrialConfig) => cfg.hypValue

// Сначала 3 задания на sin (сразу после сцены "формула sin"), затем
// 3 на cos (сразу после сцены "формула cos") — см. SCENES ниже.
const KIND_LIST: Kind[] = ['sin', 'sin', 'sin', 'cos', 'cos', 'cos']
const TRIALS_PER_BLOCK = 3

// Порядок сцен урока: формула sin → 3 тренировки sin → формула cos →
// 3 тренировки cos.
const SCENES = ['intro-sin', 'trial-0', 'trial-1', 'trial-2', 'intro-cos', 'trial-3', 'trial-4', 'trial-5'] as const
type SceneKey = typeof SCENES[number]
const trialIdxOf = (key: string): number | null => (key.startsWith('trial-') ? Number(key.slice('trial-'.length)) : null)

const makeTrials = (): TrialConfig[] => {
    const kinds = KIND_LIST
    let lastRotation: number | null = null
    return kinds.map((kind) => {
        const [a, b, hyp] = pick(TRIPLES)
        const swapLegs = Math.random() < 0.5
        let rotationDeg = pick(ROTATIONS)
        let guard = 0
        while (rotationDeg === lastRotation && guard < 6) {
            rotationDeg = pick(ROTATIONS)
            guard++
        }
        lastRotation = rotationDeg
        return {
            legRPValue: swapLegs ? a : b,
            legRQValue: swapLegs ? b : a,
            hypValue: hyp,
            alphaVertex: Math.random() < 0.5 ? 'P' : 'Q',
            rotationDeg,
            mirror: Math.random() < 0.5,
            kind,
        }
    })
}

// Похвала за верный ответ — детерминированно из полей самого задания (тот
// же принцип, что и pickTrialFeedback в SINWALK — не Math.random() прямо
// в рендере, чтобы фраза не "мигала" на посторонних ре-рендерах).
const pickTrialFeedback = (cfg: TrialConfig): string => {
    const seed = cfg.rotationDeg * 3 + cfg.hypValue * 7 + (cfg.mirror ? 17 : 0) + (cfg.kind === 'sin' ? 5 : 0)
    return CORRECT_FEEDBACK_PHRASES[Math.abs(seed) % CORRECT_FEEDBACK_PHRASES.length]
}

const CHIP_BASE = 'w-12 h-12 rounded-lg border-2 flex items-center justify-center text-lg font-black shrink-0'

// Число, которое можно кликнуть — либо лежит в пуле снизу, либо уже стоит
// в числителе/знаменателе дроби. Один и тот же layoutId у ОБОИХ мест, где
// оно может оказаться, — framer-motion сам анимирует FLIP-переход между
// позициями (тот самый эффект "прилетает", запрошенный пользователем), а
// не просто bounce на месте.
const ValueChip = ({
    value, layoutId, tone, onClick, disabled,
}: { value: number; layoutId: string; tone: 'pool' | 'selected' | 'wrong'; onClick: () => void; disabled?: boolean }) => (
    <motion.button
        layoutId={layoutId}
        layout
        type="button"
        onClick={onClick}
        disabled={disabled}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className={cn(
            CHIP_BASE,
            tone === 'pool' && 'border-[#3A464E] bg-[#1B252B] text-[#F2F7FB] cursor-pointer hover:border-[#4A90D9]',
            tone === 'selected' && 'border-[#4A90D9] bg-[#1B2C3D] text-[#4A90D9] cursor-pointer',
            tone === 'wrong' && 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B] cursor-pointer',
        )}
    >
        {value}
    </motion.button>
)

// Пустой пропуск, ждущий число — активный (сейчас сюда попадёт следующий
// клик по пулу) пульсирует синим, неактивный — тускло-серый.
const EmptySlot = ({ active }: { active: boolean }) => (
    <div className={cn(
        CHIP_BASE, 'border-dashed',
        active ? 'border-[#4A90D9] text-[#4A90D9] animate-pulse' : 'border-[#3A464E] text-[#5A6A72]',
    )}>
        ?
    </div>
)

// Уже проверенное (верное) задание — застывший, не интерактивный вид: и
// для ПРОШЛЫХ заданий в накопительном логе, и для ТЕКУЩЕГО сразу после
// того, как найдена верная пара (checked=true) — там больше нечего
// анимировать shared-layoutId'ом, поэтому НЕ ValueChip (просто div).
const StaticChip = ({ value }: { value: number }) => (
    <div className={cn(CHIP_BASE, 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]')}>{value}</div>
)

export const TypeSinCosDefWalk = ({ onAnswer, onComplete, isAdmin = false }: Props) => {
    const [sceneIdx, setSceneIdx] = useState(0)
    const [readyIntros, setReadyIntros] = useState<Record<string, boolean>>({})
    const [advancing, setAdvancing] = useState(false)
    const [hadMistake, setHadMistake] = useState(false)

    const [trials] = useState<TrialConfig[]>(() => makeTrials())
    const [numerator, setNumerator] = useState<number | null>(null)
    const [denominator, setDenominator] = useState<number | null>(null)
    const [activeSlot, setActiveSlot] = useState<'num' | 'den'>('num')
    const [checked, setChecked] = useState(false)
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)

    const latestSceneKey: SceneKey = SCENES[sceneIdx]
    const currentTrialIdx = trialIdxOf(latestSceneKey)
    const isIntro = currentTrialIdx === null
    const isLastScene = sceneIdx + 1 >= SCENES.length

    const { bump: bumpNonce, nonceFor: replayNonceFor } = useReplayNonces()
    const handleReplay = () => {
        if (isIntro) setReadyIntros((r) => ({ ...r, [latestSceneKey]: false }))
        bumpNonce(latestSceneKey)
    }

    const cfg = currentTrialIdx !== null ? trials[currentTrialIdx] : null

    // Клик по числу в пуле — заполняет активный пропуск; если ОБА пропуска
    // после этого заполнены, сразу проверяет пару (мгновенная проверка, без
    // кнопки "Ответить"). round-robin активного пропуска — как в INSERT.
    const evaluate = (numVal: number | null, denVal: number | null) => {
        if (numVal === null || denVal === null || !cfg) return
        if (numVal === correctNumerator(cfg) && denVal === correctDenominator(cfg)) {
            setChecked(true)
            setWrongFlash(null)
        } else {
            setHadMistake(true)
            setWrongFlash(pickWrongTryPhrase())
        }
    }

    const handlePoolClick = (value: number) => {
        playSound('/click6.wav')
        if (checked) return
        setWrongFlash(null)
        if (activeSlot === 'num') {
            setNumerator(value)
            if (denominator !== null) evaluate(value, denominator)
            else setActiveSlot('den')
        } else {
            setDenominator(value)
            if (numerator !== null) evaluate(numerator, value)
            else setActiveSlot('num')
        }
    }

    const handleClearSlot = (slot: 'num' | 'den') => {
        if (checked) return
        setWrongFlash(null)
        if (slot === 'num') { setNumerator(null); setActiveSlot('num') }
        else { setDenominator(null); setActiveSlot('den') }
    }

    const resetTrialState = () => {
        setNumerator(null)
        setDenominator(null)
        setActiveSlot('num')
        setChecked(false)
        setWrongFlash(null)
    }

    const handleNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            setAdvancing(false)
            if (isLastScene) {
                const isFullyCorrect = !hadMistake
                onComplete(isFullyCorrect)
                onAnswer(isFullyCorrect ? 'right' : 'wrong')
                return
            }
            resetTrialState()
            setSceneIdx((i) => i + 1)
        }, SCENE_TRANSITION_PAUSE_MS)
    }

    // Подпись кнопки "Дальше" после верного ответа — иногда живая фраза.
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')

    const contentSettled = isIntro ? !!readyIntros[latestSceneKey] : checked
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, contentSettled, 6)
    const canGoBack = sceneIdx > 0

    const jumpToScene = (target: string) => {
        if (advancing) return
        const idx = SCENES.indexOf(target as SceneKey)
        if (idx < 0) return
        bumpNonce(target)
        resetTrialState()
        if (trialIdxOf(target) === null) setReadyIntros((r) => ({ ...r, [target]: false }))
        setSceneIdx(idx)
    }

    const handleBack = () => {
        if (!canGoBack) return
        jumpToScene(SCENES[sceneIdx - 1])
    }

    const cosIntroIdx = SCENES.indexOf('intro-cos')
    const sceneMapEntries: AdminMapEntry[] = [
        { dotKey: 'intro-sin', label: 'Формула sin', jumpKey: 'intro-sin', isActive: sceneIdx === 0, color: MAP_INTRO_COLOR },
        { dotKey: 'practice-sin', label: `Тренировка sin (${TRIALS_PER_BLOCK})`, jumpKey: 'trial-0', isActive: sceneIdx > 0 && sceneIdx < cosIntroIdx, color: MAP_PRACTICE_COLOR },
        { dotKey: 'intro-cos', label: 'Формула cos', jumpKey: 'intro-cos', isActive: sceneIdx === cosIntroIdx, color: MAP_INTRO_COLOR },
        { dotKey: 'practice-cos', label: `Тренировка cos (${TRIALS_PER_BLOCK})`, jumpKey: 'trial-3', isActive: sceneIdx > cosIntroIdx, color: MAP_PRACTICE_COLOR },
    ]

    const renderIntro = (key: SceneKey, kind: Kind) => (
        <SceneWrapper key={key} innerRef={sceneRef(key)} active={isSceneActive(key)}>
            <Fragment key={`${key}-${replayNonceFor(key)}`}>
                <ConceptScene kind={kind} onSettled={() => setReadyIntros((r) => ({ ...r, [key]: true }))} />
            </Fragment>
        </SceneWrapper>
    )

    const renderTrial = (i: number) => {
        const t = trials[i]
        const isCurrent = i === currentTrialIdx
        const isDone = !isCurrent || checked
        const showInteractive = isCurrent && !checked
        const corrNum = correctNumerator(t)
        const corrDen = correctDenominator(t)
        const poolValues = [t.legRPValue, t.legRQValue, t.hypValue]
        const dividerColor = isDone ? '#A1D151' : (showInteractive && wrongFlash) ? '#DC605B' : '#F2F7FB'
        const localIdx = i % TRIALS_PER_BLOCK

        return (
            <SceneWrapper key={`trial-${i}`} innerRef={sceneRef(`trial-${i}`)} active={isSceneActive(`trial-${i}`)}>
            <div key={`trial-${i}-${replayNonceFor(`trial-${i}`)}`} className="w-full flex flex-col gap-3">
                <div className="flex items-center gap-3 w-full">
                    <div
                        className="shrink-0 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                        style={{
                            borderColor: hexToRgba('#C385F7', 0.55),
                            backgroundColor: hexToRgba('#C385F7', 0.16),
                            color: '#C385F7',
                        }}
                    >
                        <span>{localIdx + 1}</span>
                        <span className="opacity-50 font-normal">/</span>
                        <span>{TRIALS_PER_BLOCK}</span>
                    </div>
                    <p className="flex-1 text-base md:text-lg text-[#F2F7FB]">Чему равен {t.kind} α?</p>
                </div>
                <DiagramBlock>
                    <RightTriangleDiagram
                        rotationDeg={t.rotationDeg}
                        mirror={t.mirror}
                        rightAngleMarkShown
                        alphaVertex={t.alphaVertex}
                        sideNumberLabels={{ legRP: t.legRPValue, legRQ: t.legRQValue, hyp: t.hypValue }}
                    />
                </DiagramBlock>
                <div className="flex items-center justify-center gap-2 text-xl md:text-2xl font-bold text-[#F2F7FB]">
                    <span>{t.kind} α = </span>
                    <div className="inline-flex flex-col items-stretch">
                        {showInteractive ? (
                            numerator !== null
                                ? <ValueChip value={numerator} layoutId={`chip-t${i}-${numerator}`} tone={wrongFlash ? 'wrong' : 'selected'} onClick={() => handleClearSlot('num')} />
                                : <EmptySlot active={activeSlot === 'num'} />
                        ) : (
                            <StaticChip value={corrNum} />
                        )}
                        <div className="h-0.5 my-1 rounded" style={{ backgroundColor: dividerColor }} />
                        {showInteractive ? (
                            denominator !== null
                                ? <ValueChip value={denominator} layoutId={`chip-t${i}-${denominator}`} tone={wrongFlash ? 'wrong' : 'selected'} onClick={() => handleClearSlot('den')} />
                                : <EmptySlot active={activeSlot === 'den'} />
                        ) : (
                            <StaticChip value={corrDen} />
                        )}
                    </div>
                </div>
                {showInteractive && (
                    <div className="flex items-center justify-center gap-3">
                        {poolValues
                            .filter((v) => v !== numerator && v !== denominator)
                            .map((v) => (
                                <ValueChip key={v} value={v} layoutId={`chip-t${i}-${v}`} tone="pool" onClick={() => handlePoolClick(v)} />
                            ))}
                    </div>
                )}
                {/* "Пробуй, пока не угадаешь" — числа НЕ блокируются, кликом
                    по ним можно вернуть их в пул и попробовать другую пару. */}
                {showInteractive && wrongFlash && (
                    <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#DC605B22] text-[#DC605B]">
                        <X className="w-5 h-5" /> {wrongFlash}
                    </div>
                )}
                {isDone && (
                    <FieryFeedbackBanner fiery={isCurrent && isFieryMilestoneTrial(localIdx)}>
                        <Check className="w-5 h-5" /> {pickTrialFeedback(t)}
                    </FieryFeedbackBanner>
                )}
                {isCurrent && isDone && <LocalAnswerConfetti />}
            </div>
            </SceneWrapper>
        )
    }

    const nextEnabled = isIntro ? !!readyIntros[latestSceneKey] && !advancing : checked && !advancing

    return (
        <div className={`w-full mx-auto flex flex-row items-start gap-3 ${isAdmin ? 'max-w-[46rem]' : 'max-w-2xl'}`}>
        <div className="min-w-0 flex-1 flex flex-col items-center gap-4">
            <div className="w-full flex flex-col gap-4">
                {SCENES.slice(0, sceneIdx + 1).map((key) => {
                    const ti = trialIdxOf(key)
                    if (ti !== null) return renderTrial(ti)
                    return renderIntro(key, key === 'intro-sin' ? 'sin' : 'cos')
                })}
            </div>

            {isIntro || checked ? (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={handleReplay} disabled={advancing} />
                    <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                    <button
                        type="button"
                        onClick={() => {
                            if (!isIntro) setTrialNextLabel(pickWalkthroughNextLabel(isLastScene ? 'Готово' : 'Дальше'))
                            handleNext()
                        }}
                        disabled={!nextEnabled}
                        className={walkthroughButtonClass(nextEnabled)}
                        style={walkthroughButtonStyle(nextEnabled)}
                    >
                        {isIntro ? 'Дальше' : isLastScene ? 'Готово' : trialNextLabel}
                    </button>
                </div>
            ) : (
                <div className="w-full flex items-center gap-2">
                    <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                </div>
            )}
        </div>

        {isAdmin && <AdminSceneMap entries={sceneMapEntries} onJump={jumpToScene} disabled={advancing} />}
        </div>
    )
}
