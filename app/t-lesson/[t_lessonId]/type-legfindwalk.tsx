// app/t-lesson/[t_lessonId]/type-legfindwalk.tsx
//
// Тип LEGFINDWALK — степбайстеп-разбор "Как найти катет" (тема "Геометрия:
// sin, cos, tg", сразу после SINCOSDEFWALK). Самодостаточный тип, как и
// остальные *WALK: сам ведёт хореографию и зовёт onComplete один раз в конце.
//
// Сюжет (прямая инструкция пользователя):
// 1. Прямоугольный треугольник → угол α → гипотенуза (стикер вдоль стороны)
//    → "А как нам найти [противолежащий] катет?" → катет подсвечен + "?".
// 2. ЗАПОМНИ! "Противолежащий катет = [гипотенуза] · [sin α]" (sin α — цветом
//    противолежащего катета) → на рисунке противолежащий катет подписан
//    [гип] · [sin α].
// 3. "А прилежащий катет = [гипотенуза] · [cos α]" → на рисунке прилежащий
//    катет подписан [гип] · [cos α].
// 4. Тренировка: 6 заданий (3 на противолежащий, 3 на прилежащий,
//    вперемешку) — дана гипотенуза (числом) и угол α (в градусах), искомый
//    катет помечен "x", выбрать верное выражение среди 4 вариантов.

'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import type { QuestionType } from './page'
import {
    RightTriangleDiagram, LEG_COLOR, ADJACENT_LEG_COLOR, HYPOTENUSE_COLOR, SIDE_DRAW_DURATION,
    oppositeLegOf, adjacentLegOf,
    type AlphaVertex, type StickerPart, type SideId,
} from '@/components/geometry/RightTriangleDiagram'
import { Typewriter } from '@/components/geometry/Typewriter'
import {
    DiagramBlock, pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    isFieryMilestoneTrial, FieryFeedbackBanner, BlinkingExclaim, ATTENTION_COLOR, ACTIVE_COLOR,
    AdminSceneMap, MAP_INTRO_COLOR, MAP_PRACTICE_COLOR, type AdminMapEntry,
} from '@/components/geometry/WalkthroughLog'
import { hexToRgba } from '@/src/constants/lessonButtonColors'
import paperPolice from '@/public/Lottie/stepByStep/paperPolice.json'
import { cn } from '@/lib/utils'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'

// lottie-react трогает document на импорте — только ssr:false.
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
    isAdmin?: boolean
}

const SCENE_TRANSITION_PAUSE_MS = 1000
// Паузы поэтапного появления на первой сцене: треугольник → α → гипотенуза.
const INTRO_ALPHA_AT_MS = 1300
const INTRO_HYP_AT_MS = 2600
const INTRO_SETTLED_AT_MS = 3700 // здесь начинает печататься вопрос
const DIAGRAM_SETTLE_MS = 1400

// ===== Стикеры (тот же визуальный язык, что в остальных *WALK) =====
const Sticker = ({ value, color }: { value: React.ReactNode; color: string }) => (
    <motion.span
        initial={{ scale: 2.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15 }}
        className="inline-flex items-center justify-center rounded-lg border-2 font-extrabold align-middle px-2 py-0.5 mx-0.5 leading-tight whitespace-nowrap"
        style={{ borderColor: color, backgroundColor: hexToRgba(color, 0.18), color }}
    >
        {value}
    </motion.span>
)

type LinePart = { text: string } | { sticker: string; color: string }

// Печатаем плоский текст, после печати — та же строка со стикерами.
const TypedLineWithParts = ({ parts, onSettled, className }: { parts: LinePart[]; onSettled?: () => void; className?: string }) => {
    const [typed, setTyped] = useState(false)
    const plain = parts.map((p) => ('text' in p ? p.text : p.sticker)).join('')
    return (
        <div className={cn('w-full text-base md:text-lg text-[#F2F7FB] leading-loose', className)}>
            {!typed ? (
                <Typewriter text={plain} onDone={() => { setTyped(true); setTimeout(() => onSettled?.(), 450) }} />
            ) : (
                parts.map((p, i) => ('text' in p
                    ? <span key={i}>{p.text}</span>
                    : <Sticker key={i} value={p.sticker} color={p.color} />))
            )}
        </div>
    )
}

// ЗАПОМНИ! — Lottie "полицейский с бумагой" + оранжевая плашка (тот же
// баннер, что в LOGDEFWALK).
const RememberBanner = () => (
    <div className="w-full flex items-center gap-3">
        <Lottie animationData={paperPolice} loop autoplay className="w-16 h-16 md:w-20 md:h-20 shrink-0" />
        <div
            className="flex-1 flex items-center justify-center rounded-xl px-4 py-3 font-black text-lg"
            style={{ backgroundColor: hexToRgba(ATTENTION_COLOR, 0.16), border: `2px solid ${ATTENTION_COLOR}`, color: ATTENTION_COLOR }}
        >
            <span>ЗАПОМНИ<BlinkingExclaim /></span>
        </div>
    </div>
)

const HYP_STICKER: StickerPart = { text: 'гипотенуза', color: HYPOTENUSE_COLOR }
const HYP_SHORT: StickerPart = { text: 'гип', color: HYPOTENUSE_COLOR }
const DOT: StickerPart = { text: '·' }
const SIN_STICKER: StickerPart = { text: 'sin α', color: LEG_COLOR }
const COS_STICKER: StickerPart = { text: 'cos α', color: ADJACENT_LEG_COLOR }

// Обучающий треугольник: α у вершины P → противолежащий катет legRQ,
// прилежащий legRP.
const INTRO_ALPHA: AlphaVertex = 'P'
const INTRO_OPP = oppositeLegOf(INTRO_ALPHA)
const INTRO_ADJ = adjacentLegOf(INTRO_ALPHA)

const DiagramFrame = ({ children, maxW = 420 }: { children: React.ReactNode; maxW?: number }) => (
    <div className="w-full flex justify-center">
        <div className="w-full [&_svg]:max-h-[34vh]" style={{ maxWidth: maxW }}>
            <DiagramBlock>{children}</DiagramBlock>
        </div>
    </div>
)

// Сцена 1: треугольник → α → гипотенуза (маленький стикер вдоль стороны) →
// "А как нам найти [противолежащий] катет?" → подсвечивается противолежащий
// катет и рядом с ним стикер "?" его цвета.
const IntroTriangleScene = ({ onSettled }: { onSettled: () => void }) => {
    const [alphaShown, setAlphaShown] = useState(false)
    const [hypShown, setHypShown] = useState(false)
    const [askShown, setAskShown] = useState(false)
    const [oppShown, setOppShown] = useState(false)
    const [qShown, setQShown] = useState(false)
    useEffect(() => {
        const t1 = setTimeout(() => setAlphaShown(true), INTRO_ALPHA_AT_MS)
        const t2 = setTimeout(() => setHypShown(true), INTRO_HYP_AT_MS)
        const t3 = setTimeout(() => setAskShown(true), INTRO_SETTLED_AT_MS)
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    }, [])
    const handleAskDone = () => {
        setTimeout(() => setOppShown(true), 500)
        setTimeout(() => setQShown(true), 500 + SIDE_DRAW_DURATION * 1000 + 200)
        setTimeout(onSettled, 500 + SIDE_DRAW_DURATION * 1000 + 1000)
    }
    const stickers: Partial<Record<SideId, StickerPart[]>> = {}
    if (hypShown) stickers.hyp = [HYP_STICKER]
    if (qShown) stickers[INTRO_OPP] = [{ text: '?', color: LEG_COLOR }]
    return (
        <div className="w-full flex flex-col gap-3">
            <DiagramFrame>
                <RightTriangleDiagram
                    compact rightAngleMarkShown
                    alphaVertex={alphaShown ? INTRO_ALPHA : null}
                    hypotenuseHighlighted={hypShown}
                    oppositeLegHighlighted={oppShown}
                    sideStickerLabels={stickers}
                    sideStickerAlong={['hyp']}
                />
            </DiagramFrame>
            {askShown && (
                <TypedLineWithParts
                    className="text-lg md:text-xl font-bold"
                    parts={[{ text: 'А как нам найти ' }, { sticker: 'противолежащий', color: LEG_COLOR }, { text: ' катет?' }]}
                    onSettled={handleAskDone}
                />
            )}
        </div>
    )
}

// Сцены 2/3: формула-строка → рисунок с подписанным катетом.
const FormulaScene = ({
    kind, onSettled,
}: { kind: 'opp' | 'adj'; onSettled: () => void }) => {
    const [lineDone, setLineDone] = useState(false)
    useEffect(() => {
        if (!lineDone) return
        const t = setTimeout(onSettled, DIAGRAM_SETTLE_MS)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lineDone])
    const isOpp = kind === 'opp'
    const stickers: Partial<Record<SideId, StickerPart[]>> = {
        [INTRO_OPP]: [HYP_SHORT, DOT, SIN_STICKER],
    }
    if (!isOpp) stickers[INTRO_ADJ] = [HYP_SHORT, DOT, COS_STICKER]
    return (
        <div className="w-full flex flex-col gap-3">
            {isOpp && <DiagramBlock><RememberBanner /></DiagramBlock>}
            <TypedLineWithParts
                className="text-lg md:text-xl font-bold"
                parts={isOpp
                    ? [{ text: 'Противолежащий катет = ' }, { sticker: 'гипотенуза', color: HYPOTENUSE_COLOR }, { text: ' · ' }, { sticker: 'sin α', color: LEG_COLOR }]
                    : [{ text: 'А прилежащий катет = ' }, { sticker: 'гипотенуза', color: HYPOTENUSE_COLOR }, { text: ' · ' }, { sticker: 'cos α', color: ADJACENT_LEG_COLOR }]}
                onSettled={() => setLineDone(true)}
            />
            {lineDone && (
                <DiagramFrame maxW={460}>
                    <RightTriangleDiagram
                        compact rightAngleMarkShown alphaVertex={INTRO_ALPHA}
                        hypotenuseHighlighted
                        oppositeLegHighlighted
                        adjacentLegHighlighted={!isOpp}
                        sideStickerLabels={stickers}
                    />
                </DiagramFrame>
            )}
        </div>
    )
}

// ===== Тренировка =====

type TrialKind = 'opp' | 'adj'
type TrialOption = { text: string; correct: boolean }
type TrialConfig = {
    kind: TrialKind
    hyp: number
    angle: number
    alphaVertex: AlphaVertex
    rotationDeg: number
    mirror: boolean
    options: TrialOption[]
}

const HYPS = [4, 5, 6, 7, 8, 9, 10, 12, 13, 15, 16, 20, 25]
const ANGLES = [20, 25, 30, 35, 37, 40, 50, 53, 55, 60, 65, 70]
const ROTATIONS = [0, 35, -35, 55, -55, 110, -110, 140, -140, 160, -160]
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]
const shuffle = <T,>(arr: T[]): T[] => {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
}

const makeOptions = (kind: TrialKind, hyp: number, angle: number): TrialOption[] => shuffle([
    { text: `${hyp} · sin ${angle}°`, correct: kind === 'opp' },
    { text: `${hyp} · cos ${angle}°`, correct: kind === 'adj' },
    // Типичные ошибки: делить вместо умножать, взять tg.
    { text: `${hyp} / ${kind === 'opp' ? 'sin' : 'cos'} ${angle}°`, correct: false },
    { text: `${hyp} · tg ${angle}°`, correct: false },
])

const makeTrials = (): TrialConfig[] => {
    const kinds = shuffle<TrialKind>(['opp', 'opp', 'opp', 'adj', 'adj', 'adj'])
    let lastRot: number | null = null
    return kinds.map((kind) => {
        const hyp = pick(HYPS)
        const angle = pick(ANGLES)
        let rotationDeg = pick(ROTATIONS)
        for (let g = 0; g < 6 && rotationDeg === lastRot; g++) rotationDeg = pick(ROTATIONS)
        lastRot = rotationDeg
        return {
            kind, hyp, angle, rotationDeg,
            alphaVertex: Math.random() < 0.5 ? 'P' : 'Q',
            mirror: Math.random() < 0.5,
            options: makeOptions(kind, hyp, angle),
        }
    })
}

const pickTrialFeedback = (cfg: TrialConfig): string => {
    const seed = cfg.hyp * 7 + cfg.angle * 3 + cfg.rotationDeg + (cfg.kind === 'opp' ? 5 : 0)
    return CORRECT_FEEDBACK_PHRASES[Math.abs(seed) % CORRECT_FEEDBACK_PHRASES.length]
}

const INTRO_SCENES = ['intro-0', 'intro-1', 'intro-2'] as const
const TRIAL_COUNT = 6

export const TypeLegFindWalk = ({ onAnswer, onComplete, isAdmin = false }: Props) => {
    // sceneIdx: 0..2 — обучающие сцены, 3..8 — задания 0..5.
    const [sceneIdx, setSceneIdx] = useState(0)
    const [ready, setReady] = useState<Record<string, boolean>>({})
    const [advancing, setAdvancing] = useState(false)
    const [hadMistake, setHadMistake] = useState(false)

    const [trials] = useState<TrialConfig[]>(() => makeTrials())
    const [wrongTried, setWrongTried] = useState<string[]>([])
    const [checked, setChecked] = useState(false)
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)
    const [nextLabel, setNextLabel] = useState('Дальше')

    const isIntro = sceneIdx < INTRO_SCENES.length
    const trialIndex = isIntro ? -1 : sceneIdx - INTRO_SCENES.length
    const sceneKeyOf = (idx: number) => (idx < INTRO_SCENES.length ? INTRO_SCENES[idx] : `trial-${idx - INTRO_SCENES.length}`)
    const latestSceneKey = sceneKeyOf(sceneIdx)
    const totalScenes = INTRO_SCENES.length + TRIAL_COUNT
    const isLastScene = sceneIdx + 1 >= totalScenes

    const { bump: bumpNonce, nonceFor: replayNonceFor } = useReplayNonces()
    const contentSettled = isIntro ? !!ready[latestSceneKey] : checked
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, contentSettled, 6)

    const resetTrial = () => {
        setWrongTried([])
        setChecked(false)
        setWrongFlash(null)
    }

    const jumpTo = (idx: number) => {
        if (advancing || idx < 0 || idx >= totalScenes) return
        const key = sceneKeyOf(idx)
        bumpNonce(key)
        resetTrial()
        setReady((r) => ({ ...r, [key]: false }))
        setSceneIdx(idx)
    }

    const handleReplay = () => jumpTo(sceneIdx)
    const handleBack = () => jumpTo(sceneIdx - 1)

    const handleNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            setAdvancing(false)
            if (isLastScene) {
                const ok = !hadMistake
                onComplete(ok)
                onAnswer(ok ? 'right' : 'wrong')
                return
            }
            resetTrial()
            setSceneIdx((i) => i + 1)
        }, SCENE_TRANSITION_PAUSE_MS)
    }

    const handleOptionClick = (opt: TrialOption) => {
        playSound('/click6.wav')
        if (checked || wrongTried.includes(opt.text)) return
        if (opt.correct) {
            setChecked(true)
            setWrongFlash(null)
            setNextLabel(pickWalkthroughNextLabel(isLastScene ? 'Готово' : 'Дальше'))
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setHadMistake(true)
            setWrongTried((w) => [...w, opt.text])
            setWrongFlash(pickWrongTryPhrase())
        }
    }

    const markReady = (key: string) => () => setReady((r) => ({ ...r, [key]: true }))

    const renderIntro = (idx: number) => {
        const key = INTRO_SCENES[idx]
        return (
            <SceneWrapper key={key} innerRef={sceneRef(key)} active={isSceneActive(key)}>
                <div key={`${key}-${replayNonceFor(key)}`} className="w-full">
                    {idx === 0 && <IntroTriangleScene onSettled={markReady(key)} />}
                    {idx === 1 && <FormulaScene kind="opp" onSettled={markReady(key)} />}
                    {idx === 2 && <FormulaScene kind="adj" onSettled={markReady(key)} />}
                </div>
            </SceneWrapper>
        )
    }

    const renderTrial = (i: number) => {
        const t = trials[i]
        const key = `trial-${i}`
        const isCurrent = i === trialIndex
        const isDone = !isCurrent || checked
        const targetSide: SideId = t.kind === 'opp' ? oppositeLegOf(t.alphaVertex) : adjacentLegOf(t.alphaVertex)
        const doneColor = '#A1D151'
        return (
            <SceneWrapper key={key} innerRef={sceneRef(key)} active={isSceneActive(key)}>
                <div key={`${key}-${replayNonceFor(key)}`} className="w-full flex flex-col gap-3">
                    <div className="flex items-center gap-3 w-full">
                        <div
                            className="shrink-0 flex items-center gap-0.5 px-3 h-8 rounded-full border-2 font-black text-sm tabular-nums"
                            style={{ borderColor: hexToRgba('#C385F7', 0.55), backgroundColor: hexToRgba('#C385F7', 0.16), color: '#C385F7' }}
                        >
                            <span>{i + 1}</span>
                            <span className="opacity-50 font-normal">/</span>
                            <span>{TRIAL_COUNT}</span>
                        </div>
                        <p className="flex-1 text-base md:text-lg text-[#F2F7FB]">Чему равен катет x?</p>
                    </div>
                    <DiagramFrame maxW={380}>
                        <RightTriangleDiagram
                            compact
                            rotationDeg={t.rotationDeg}
                            mirror={t.mirror}
                            rightAngleMarkShown
                            alphaVertex={t.alphaVertex}
                            alphaText={`${t.angle}°`}
                            sideNumberLabels={{ hyp: t.hyp }}
                            sideStickerLabels={{ [targetSide]: [{ text: 'x', color: isDone ? doneColor : ACTIVE_COLOR }] }}
                        />
                    </DiagramFrame>
                    <div className="grid grid-cols-2 gap-2">
                        {t.options.map((opt) => {
                            const wrong = isCurrent && wrongTried.includes(opt.text)
                            const right = isDone && opt.correct
                            return (
                                <button
                                    key={opt.text}
                                    type="button"
                                    onClick={() => isCurrent && handleOptionClick(opt)}
                                    disabled={!isCurrent || checked || wrong}
                                    className={cn(
                                        'h-12 rounded-xl border-2 border-b-4 font-extrabold text-base md:text-lg tabular-nums transition-colors',
                                        right && 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]',
                                        wrong && 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]',
                                        !right && !wrong && 'border-[#3A464E] bg-[#1B252B] text-[#F2F7FB]',
                                        !right && !wrong && isCurrent && !checked && 'hover:border-[#4A90D9] active:border-b-2',
                                        !isCurrent && !right && 'opacity-50',
                                    )}
                                >
                                    {opt.text}
                                </button>
                            )
                        })}
                    </div>
                    {isCurrent && !checked && wrongFlash && (
                        <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#DC605B22] text-[#DC605B]">
                            <X className="w-5 h-5" /> {wrongFlash}
                        </div>
                    )}
                    {isDone && (
                        <FieryFeedbackBanner fiery={isCurrent && isFieryMilestoneTrial(i)}>
                            <Check className="w-5 h-5" /> {pickTrialFeedback(t)}
                        </FieryFeedbackBanner>
                    )}
                    {isCurrent && isDone && <LocalAnswerConfetti />}
                </div>
            </SceneWrapper>
        )
    }

    const nextEnabled = (isIntro ? !!ready[latestSceneKey] : checked) && !advancing
    const sceneMapEntries: AdminMapEntry[] = [
        { dotKey: 'intro-0', label: 'Треугольник, α, гипотенуза', jumpKey: 'intro-0', isActive: sceneIdx === 0, color: MAP_INTRO_COLOR },
        { dotKey: 'intro-1', label: 'Противолежащий = гип · sin α', jumpKey: 'intro-1', isActive: sceneIdx === 1, color: MAP_INTRO_COLOR },
        { dotKey: 'intro-2', label: 'Прилежащий = гип · cos α', jumpKey: 'intro-2', isActive: sceneIdx === 2, color: MAP_INTRO_COLOR },
        { dotKey: 'practice', label: `Тренировка (${TRIAL_COUNT})`, jumpKey: 'trial-0', isActive: !isIntro, color: MAP_PRACTICE_COLOR },
    ]
    const jumpToKey = (key: string) => {
        const idx = key.startsWith('trial-') ? INTRO_SCENES.length + Number(key.slice(6)) : INTRO_SCENES.indexOf(key as typeof INTRO_SCENES[number])
        jumpTo(idx)
    }

    return (
        <div className={`w-full mx-auto flex flex-row items-start gap-3 ${isAdmin ? 'max-w-[46rem]' : 'max-w-2xl'}`}>
            <div className="min-w-0 flex-1 flex flex-col items-center gap-4">
                <div className="w-full flex flex-col gap-4">
                    {Array.from({ length: sceneIdx + 1 }).map((_, idx) =>
                        idx < INTRO_SCENES.length ? renderIntro(idx) : renderTrial(idx - INTRO_SCENES.length))}
                </div>

                {isIntro || checked ? (
                    <div className="w-full flex items-center gap-2">
                        <ReplayButton onClick={handleReplay} disabled={advancing} />
                        <BackButton onClick={handleBack} disabled={advancing || sceneIdx === 0} />
                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={!nextEnabled}
                            className={walkthroughButtonClass(nextEnabled)}
                            style={walkthroughButtonStyle(nextEnabled)}
                        >
                            {isIntro ? 'Дальше' : isLastScene ? 'Готово' : nextLabel}
                        </button>
                    </div>
                ) : (
                    <div className="w-full flex items-center gap-2">
                        <BackButton onClick={handleBack} disabled={advancing} />
                    </div>
                )}
            </div>

            {isAdmin && <AdminSceneMap entries={sceneMapEntries} onJump={jumpToKey} disabled={advancing} />}
        </div>
    )
}
