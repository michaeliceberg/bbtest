// app/t-lesson/[t_lessonId]/type-hypfindwalk.tsx
//
// Тип HYPFINDWALK — степбайстеп-разбор "Как найти гипотенузу" (тема "Геометрия:
// sin, cos, tg", сразу после LEGFINDWALK). Вынесен из LEGFINDWALK: там ученик
// учится находить катет (катет = гип · sin|cos), здесь — обратная задача.
// Самодостаточный тип, как и остальные *WALK: сам ведёт хореографию и зовёт
// onComplete один раз в конце.
//
// Сюжет:
// 1. "А как найти [гипотенузу]? Теперь известны катет и угол α." — два одинаковых
//    треугольника: слева дан противолежащий катет, справа прилежащий; на
//    гипотенузе "?" → превращается в "прот / sin α" и "прил / cos α".
// 2. ЗАПОМНИ! + две формулы текстом.
// 3. Тренировка: 4 задания — дан катет и угол α (в градусах), гипотенуза
//    помечена "?", выбрать верное выражение среди 4 вариантов.

'use client'

import { useEffect, useState } from 'react'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import type { QuestionType } from './page'
import {
    RightTriangleDiagram, LEG_COLOR, ADJACENT_LEG_COLOR, HYPOTENUSE_COLOR,
    oppositeLegOf, adjacentLegOf,
    type AlphaVertex, type StickerPart, type SideId,
} from '@/components/geometry/RightTriangleDiagram'
import { Typewriter } from '@/components/geometry/Typewriter'
import {
    DiagramBlock, pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    isFieryMilestoneTrial, FieryFeedbackBanner, BlinkingExclaim, ATTENTION_COLOR,
    AdminSceneMap, MAP_INTRO_COLOR, MAP_PRACTICE_COLOR, type AdminMapEntry,
    useWalkthroughCombo,
} from '@/components/geometry/WalkthroughLog'
import { hexToRgba } from '@/src/constants/lessonButtonColors'
import paperPolice from '@/public/Lottie/stepByStep/paperPolice.json'
import { cn } from '@/lib/utils'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import Lottie from '@/components/lottie-player'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
    isAdmin?: boolean
}

const SCENE_TRANSITION_PAUSE_MS = 1000

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

// Сцена «А как найти гипотенузу?»: два одинаковых треугольника — слева дан
// противолежащий катет, справа прилежащий; на гипотенузе «?» → превращается в
// «прот / sin α» и «прил / cos α» → ЗАПОМНИ + две формулы текстом.
const HYP_Q: StickerPart[] = [{ text: '?', color: HYPOTENUSE_COLOR }]
const HYP_OPP_FRAC: StickerPart[] = [{ text: 'прот', color: LEG_COLOR }, { text: '/' }, { text: 'sin α', color: LEG_COLOR }]
const HYP_ADJ_FRAC: StickerPart[] = [{ text: 'прил', color: ADJACENT_LEG_COLOR }, { text: '/' }, { text: 'cos α', color: ADJACENT_LEG_COLOR }]
const GIVEN: StickerPart[] = [{ text: 'дан', color: HYPOTENUSE_COLOR }]

const HypotenuseScene = ({ onSettled }: { onSettled: () => void }) => {
    const [askShown, setAskShown] = useState(false)
    const [diagShown, setDiagShown] = useState(false)
    const [fracShown, setFracShown] = useState(false)
    const [line2Shown, setLine2Shown] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setAskShown(true), 600)
        return () => clearTimeout(t)
    }, [])
    useEffect(() => {
        if (!diagShown) return
        const t = setTimeout(() => setFracShown(true), 1800)
        return () => clearTimeout(t)
    }, [diagShown])
    const mini = (kind: 'opp' | 'adj') => {
        const legSide: SideId = kind === 'opp' ? INTRO_OPP : INTRO_ADJ
        const legColor = kind === 'opp' ? LEG_COLOR : ADJACENT_LEG_COLOR
        const frac = kind === 'opp' ? HYP_OPP_FRAC : HYP_ADJ_FRAC
        return (
            <DiagramFrame maxW={230}>
                <RightTriangleDiagram
                    compact rightAngleMarkShown instantBase alphaVertex={INTRO_ALPHA}
                    oppositeLegHighlighted={kind === 'opp'}
                    adjacentLegHighlighted={kind === 'adj'}
                    sideStickerLabels={{ [legSide]: [{ ...GIVEN[0], color: legColor }], hyp: fracShown ? frac : HYP_Q }}
                    sideStickerAlong={['hyp']}
                    reserveStickerLabels={{ hyp: frac }}
                />
            </DiagramFrame>
        )
    }
    return (
        <div className="w-full flex flex-col gap-3">
            {askShown && (
                <TypedLineWithParts
                    className="text-lg md:text-xl font-bold"
                    parts={[{ text: 'А как найти ' }, { sticker: 'гипотенузу', color: HYPOTENUSE_COLOR }, { text: '? Теперь известны катет и угол α.' }]}
                    onSettled={() => setDiagShown(true)}
                />
            )}
            {diagShown && (
                <div className="grid grid-cols-2 gap-2 w-full">
                    {mini('opp')}
                    {mini('adj')}
                </div>
            )}
            {fracShown && (
                <>
                    <DiagramBlock><RememberBanner /></DiagramBlock>
                    <TypedLineWithParts
                        className="text-lg md:text-xl font-bold"
                        parts={[{ sticker: 'гипотенуза', color: HYPOTENUSE_COLOR }, { text: ' = ' }, { sticker: 'противолежащий', color: LEG_COLOR }, { text: ' / ' }, { sticker: 'sin α', color: LEG_COLOR }]}
                        onSettled={() => setLine2Shown(true)}
                    />
                    {line2Shown && (
                        <TypedLineWithParts
                            className="text-lg md:text-xl font-bold"
                            parts={[{ text: 'или ' }, { sticker: 'гипотенуза', color: HYPOTENUSE_COLOR }, { text: ' = ' }, { sticker: 'прилежащий', color: ADJACENT_LEG_COLOR }, { text: ' / ' }, { sticker: 'cos α', color: ADJACENT_LEG_COLOR }]}
                            onSettled={() => setTimeout(onSettled, 600)}
                        />
                    )}
                </>
            )}
        </div>
    )
}

// ===== Тренировка =====

type TrialKind = 'opp' | 'adj'
type TrialOption = { text: string; correct: boolean }

// Угол на рисунке: при вершине P он «похож» на 30° (≈36°), при Q — на 60° (≈54°),
// поэтому в заданиях берём только эти два значения.
const angleFor = (v: AlphaVertex): number => (v === 'P' ? 30 : 60)
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

// Дан катет и угол — гипотенуза = катет / sin|cos.
type HypTrialConfig = {
    kind: TrialKind
    leg: number
    angle: number
    alphaVertex: AlphaVertex
    rotationDeg: number
    mirror: boolean
    options: TrialOption[]
}
const LEGS = [3, 4, 5, 6, 8, 9, 10, 12, 15]
const makeHypOptions = (kind: TrialKind, leg: number, angle: number): TrialOption[] => shuffle([
    { text: `${leg} / sin ${angle}°`, correct: kind === 'opp' },
    { text: `${leg} / cos ${angle}°`, correct: kind === 'adj' },
    // Типичные ошибки: умножать вместо деления.
    { text: `${leg} · ${kind === 'opp' ? 'sin' : 'cos'} ${angle}°`, correct: false },
    { text: `${leg} / tg ${angle}°`, correct: false },
])
const makeHypTrials = (): HypTrialConfig[] => {
    const kinds = shuffle<TrialKind>(['opp', 'opp', 'adj', 'adj'])
    let lastRot: number | null = null
    return kinds.map((kind) => {
        const leg = pick(LEGS)
        const alphaVertex: AlphaVertex = Math.random() < 0.5 ? 'P' : 'Q'
        const angle = angleFor(alphaVertex)
        let rotationDeg = pick(ROTATIONS)
        for (let g = 0; g < 6 && rotationDeg === lastRot; g++) rotationDeg = pick(ROTATIONS)
        lastRot = rotationDeg
        return { kind, leg, angle, rotationDeg, alphaVertex, mirror: Math.random() < 0.5, options: makeHypOptions(kind, leg, angle) }
    })
}

const HYP_TRIAL_COUNT = 4
const SCENES: string[] = [
    'intro-0',
    ...Array.from({ length: HYP_TRIAL_COUNT }, (_, i) => `htrial-${i}`),
]
const sceneKind = (key: string): 'intro' | 'htrial' => (key.startsWith('htrial-') ? 'htrial' : 'intro')
const sceneNum = (key: string) => Number(key.slice(key.indexOf('-') + 1))

export const TypeHypFindWalk = ({ onAnswer, onComplete, isAdmin = false }: Props) => {
    const [sceneIdx, setSceneIdx] = useState(0)
    const [ready, setReady] = useState<Record<string, boolean>>({})
    const [advancing, setAdvancing] = useState(false)
    const [hadMistake, setHadMistake] = useState(false)

    const [hypTrials] = useState<HypTrialConfig[]>(() => makeHypTrials())
    const [wrongTried, setWrongTried] = useState<string[]>([])
    const registerCombo = useWalkthroughCombo()
    const [checked, setChecked] = useState(false)
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)
    const [nextLabel, setNextLabel] = useState('Дальше')

    const sceneKeyOf = (idx: number) => SCENES[idx]
    const latestSceneKey = sceneKeyOf(sceneIdx)
    const latestKind = sceneKind(latestSceneKey)
    const isIntro = latestKind === 'intro'
    const totalScenes = SCENES.length
    const isLastScene = sceneIdx + 1 >= totalScenes

    const { bump: bumpNonce, nonceFor: replayNonceFor } = useReplayNonces()
    const contentSettled = isIntro ? !!ready[latestSceneKey] : checked
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, contentSettled)

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
        if (checked || wrongTried.includes(opt.text)) return
        if (opt.correct) {
            registerCombo(wrongTried.length === 0)
            showAnswerMeme(true)
            setChecked(true)
            setWrongFlash(null)
            setNextLabel(pickWalkthroughNextLabel(isLastScene ? 'Готово' : 'Дальше'))
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setHadMistake(true)
            showAnswerMeme(false)
            setWrongTried((w) => [...w, opt.text])
            setWrongFlash(pickWrongTryPhrase())
        }
    }

    const markReady = (key: string) => () => setReady((r) => ({ ...r, [key]: true }))

    const renderIntro = () => {
        const key = 'intro-0'
        return (
            <SceneWrapper key={key} innerRef={sceneRef(key)} active={isSceneActive(key)}>
                <div key={`${key}-${replayNonceFor(key)}`} className="w-full">
                    <HypotenuseScene onSettled={markReady(key)} />
                </div>
            </SceneWrapper>
        )
    }

    const renderOptions = (key: string, options: TrialOption[], isCurrent: boolean, isDone: boolean, cols: string) => (
        <div className={cn('grid gap-2', cols)}>
            {options.map((opt) => {
                const wrong = isCurrent && wrongTried.includes(opt.text)
                const right = isDone && opt.correct
                return (
                    <button
                        key={`${key}-${opt.text}`}
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
    )

    const renderHypTrial = (i: number) => {
        const t = hypTrials[i]
        const key = `htrial-${i}`
        const isCurrent = key === latestSceneKey
        const isDone = !isCurrent || checked
        const legSide: SideId = t.kind === 'opp' ? oppositeLegOf(t.alphaVertex) : adjacentLegOf(t.alphaVertex)
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
                            <span>{HYP_TRIAL_COUNT}</span>
                        </div>
                        <p className="flex-1 text-base md:text-lg text-[#F2F7FB]">Чему равна гипотенуза?</p>
                    </div>
                    <DiagramFrame maxW={380}>
                        <RightTriangleDiagram
                            compact
                            rotationDeg={t.rotationDeg}
                            mirror={t.mirror}
                            rightAngleMarkShown
                            alphaVertex={t.alphaVertex}
                            alphaText={`${t.angle}°`}
                            sideNumberLabels={{ [legSide]: t.leg }}
                            hypotenuseHighlighted
                            oppositeLegHighlighted={t.kind === 'opp'}
                            adjacentLegHighlighted={t.kind === 'adj'}
                            sideStickerLabels={{ hyp: [{ text: '?', color: isDone ? doneColor : HYPOTENUSE_COLOR }] }}
                        />
                    </DiagramFrame>
                    {renderOptions(key, t.options, isCurrent, isDone, 'grid-cols-2')}
                    {isCurrent && !checked && wrongFlash && (
                        <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#DC605B22] text-[#DC605B]">
                            <X className="w-5 h-5" /> {wrongFlash}
                        </div>
                    )}
                    {isDone && (
                        <FieryFeedbackBanner fiery={isCurrent && isFieryMilestoneTrial(i)}>
                            <Check className="w-5 h-5" /> {CORRECT_FEEDBACK_PHRASES[Math.abs(t.leg * 11 + t.angle + i) % CORRECT_FEEDBACK_PHRASES.length]}
                        </FieryFeedbackBanner>
                    )}
                    {isCurrent && isDone && <LocalAnswerConfetti />}
                </div>
            </SceneWrapper>
        )
    }

    const nextEnabled = (isIntro ? !!ready[latestSceneKey] : checked) && !advancing
    const sceneMapEntries: AdminMapEntry[] = [
        { dotKey: 'intro-0', label: 'А как найти гипотенузу?', jumpKey: 'intro-0', isActive: latestSceneKey === 'intro-0', color: MAP_INTRO_COLOR },
        { dotKey: 'hpractice', label: `Тренировка: гипотенуза (${HYP_TRIAL_COUNT})`, jumpKey: 'htrial-0', isActive: latestKind === 'htrial', color: MAP_PRACTICE_COLOR },
    ]
    const jumpToKey = (key: string) => jumpTo(SCENES.indexOf(key))

    return (
        <div className={`w-full mx-auto flex flex-row items-start gap-3 ${isAdmin ? 'max-w-[46rem]' : 'max-w-2xl'}`}>
            <div className="min-w-0 flex-1 flex flex-col items-center gap-4">
                <div className="w-full flex flex-col gap-4">
                    {SCENES.slice(0, sceneIdx + 1).map((key) => (
                        sceneKind(key) === 'htrial' ? renderHypTrial(sceneNum(key)) : renderIntro()
                    ))}
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
