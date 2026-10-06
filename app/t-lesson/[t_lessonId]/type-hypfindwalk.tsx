// app/t-lesson/[t_lessonId]/type-hypfindwalk.tsx
//
// Тип HYPFINDWALK — степбайстеп-разбор "Как найти гипотенузу" (тема "Геометрия:
// sin, cos, tg", сразу после LEGFINDWALK). Вынесен из LEGFINDWALK: там ученик
// учится находить катет (катет = гип · sin|cos), здесь — обратная задача.
// Самодостаточный тип, как и остальные *WALK: сам ведёт хореографию и зовёт
// onComplete один раз в конце.
//
// Сюжет (две одинаковые по ходу сцены — sin, затем cos):
// 1. Сразу, без анимации: треугольник с прямым углом, α и подписанным катетом
//    (противолежащий / прилежащий). Гипотенуза рисуется особым цветом, рядом «?».
// 2. «гипотенуза = дробь»: подпись катета слетает с рисунка в числитель, в
//    знаменатель с отскоком прилетает sin α (cos α).
// 3. Тренировка: 4 задания — дан катет и угол α (в градусах), гипотенуза
//    помечена "?", выбрать верное выражение среди 4 вариантов.

'use client'

import { useEffect, useRef, useState } from 'react'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import type { QuestionType } from './page'
import {
    RightTriangleDiagram, LEG_COLOR, ADJACENT_LEG_COLOR, HYPOTENUSE_COLOR, SIDE_DRAW_DURATION,
    oppositeLegOf, adjacentLegOf,
    type AlphaVertex, type StickerPart, type SideId,
} from '@/components/geometry/RightTriangleDiagram'
import { Typewriter } from '@/components/geometry/Typewriter'
import { FormulaAssemble, type FormulaChip } from '@/components/geometry/FormulaAssemble'
import {
    DiagramBlock, pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    isFieryMilestoneTrial, FieryFeedbackBanner,
    AdminSceneMap, MAP_INTRO_COLOR, MAP_PRACTICE_COLOR, type AdminMapEntry,
    useWalkthroughCombo,
} from '@/components/geometry/WalkthroughLog'
import { hexToRgba } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'

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

// Обучающий треугольник: α у вершины P → противолежащий катет legRQ,
// прилежащий legRP.
const INTRO_ALPHA: AlphaVertex = 'P'

const DiagramFrame = ({ children, maxW = 420 }: { children: React.ReactNode; maxW?: number }) => (
    <div className="w-full flex justify-center">
        <div className="w-full [&_svg]:max-h-[34vh]" style={{ maxWidth: maxW }}>
            <DiagramBlock>{children}</DiagramBlock>
        </div>
    </div>
)

// Сцена «А как найти гипотенузу?» — последовательно, по образцу сцены
// «Что такое синус?» из SINCOSDEFWALK:
// 1. Сразу (без анимации) прямоугольный треугольник с прямым углом, α и
//    подписанным катетом (противолежащий — для sin, прилежащий — для cos).
// 2. Гипотенуза рисуется особым цветом, рядом стикер «?».
// 3. Печатается «гипотенуза =», появляется дробь с пустыми местами, подпись
//    катета слетает с рисунка в числитель, в знаменатель с отскоком
//    прилетает «sin α» (для cos — «cos α»).
const WHITE = '#F2F7FB'
const FLY_S = 1.0
// Фразы-реплики ученика на кнопке после «?» — каждый раз случайная
// (выбирается в момент появления кнопки, не при рендере — без рассинхрона SSR).
const CURIOUS_REPLIES = [
    'Интересно..', 'Поподробнее..', 'Любопытно..', 'Ну-ну, рассказывай..', 'Хм, интригует..',
    'Ого, и как же?', 'Заинтриговал..', 'Слушаю внимательно..', 'Давай-давай, жги..', 'Так-так-так..',
]
const HYP_Q: StickerPart[] = [{ text: '?', color: HYPOTENUSE_COLOR }]

type Flight = { sx: number; sy: number; rot: number; dx: number; dy: number; lines: string[]; one: string; color: string }

const FlyingLabel = ({ f, onLanded }: { f: Flight; onLanded: () => void }) => (
    <div className="absolute pointer-events-none z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: f.sx, top: f.sy }}>
        <motion.div
            initial={{ x: 0, y: 0, rotate: f.rot }}
            animate={{ x: f.dx, y: f.dy, rotate: 0 }}
            transition={{ duration: FLY_S, ease: [0.4, 0, 0.2, 1] }}
            onAnimationComplete={onLanded}
            className="relative"
        >
            <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-extrabold leading-tight whitespace-nowrap"
                style={{ color: f.color, fontSize: 15, fontFamily: 'var(--font-nunito), sans-serif' }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
            >
                {f.lines.map((l) => <div key={l}>{l}</div>)}
            </motion.div>
            <motion.span
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-lg border-2 font-extrabold px-2 py-1 leading-none whitespace-nowrap text-lg md:text-xl"
                style={{ borderColor: f.color, backgroundColor: hexToRgba(f.color, 0.18), color: f.color }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                {f.one}
            </motion.span>
        </motion.div>
    </div>
)

type HypKind = 'opp' | 'adj'
const HYP_KIND_CFG: Record<HypKind, { needle: string; lines: string[]; one: string; color: string; trig: string; hintWord: string; hintRest: string }> = {
    opp: { needle: 'противолежащий', lines: ['противолежащий', 'катет'], one: 'противолежащий катет', color: LEG_COLOR, trig: 'sin α', hintWord: 'противолежащему', hintRest: ' катету и углу' },
    adj: { needle: 'прилежащий', lines: ['прилежащий', 'катет'], one: 'прилежащий катет', color: ADJACENT_LEG_COLOR, trig: 'cos α', hintWord: 'прилежащему', hintRest: ' катету и углу' },
}

const HypotenuseScene = ({ kind, onSettled }: { kind: HypKind; onSettled: () => void }) => {
    const cfg = HYP_KIND_CFG[kind]
    const rootRef = useRef<HTMLDivElement>(null)
    const numRef = useRef<HTMLDivElement>(null)
    const [hypOn, setHypOn] = useState(false)
    const [qOn, setQOn] = useState(false)
    const [btnShown, setBtnShown] = useState(false)
    const [hintTyped, setHintTyped] = useState(false)
    const [btnReady, setBtnReady] = useState(false)
    const [btnLabel, setBtnLabel] = useState(CURIOUS_REPLIES[0])
    const [typing, setTyping] = useState(false)
    const [typed, setTyped] = useState(false)
    const [showFrac, setShowFrac] = useState(false)
    const [flight, setFlight] = useState<Flight | null>(null)
    const [landed, setLanded] = useState(false)
    const [denShown, setDenShown] = useState(false)

    useEffect(() => {
        const t1 = 1400
        const t2 = t1 + SIDE_DRAW_DURATION * 1000 + 200
        const t3 = t2 + 1000
        const timers = [
            setTimeout(() => setHypOn(true), t1),
            setTimeout(() => setQOn(true), t2),
            setTimeout(() => setBtnShown(true), t3),
        ]
        return () => timers.forEach(clearTimeout)
    }, [])

    useEffect(() => {
        if (!typed) return
        const t = setTimeout(() => setShowFrac(true), 700)
        return () => clearTimeout(t)
    }, [typed])

    const startFlight = (): Flight | null => {
        const root = rootRef.current
        const target = numRef.current
        if (!root || !target) return null
        const label = [...root.querySelectorAll('svg text')].find((t) => (t.textContent ?? '').includes(cfg.needle)) as SVGTextElement | undefined
        if (!label) return null
        const rr = root.getBoundingClientRect()
        const lr = label.getBoundingClientRect()
        const tr = target.getBoundingClientRect()
        const m = (label.parentElement?.getAttribute('transform') ?? '').match(/rotate\((-?[\d.]+)/)
        label.style.visibility = 'hidden'
        const sx = lr.left + lr.width / 2 - rr.left
        const sy = lr.top + lr.height / 2 - rr.top
        return {
            sx, sy, rot: m ? Number(m[1]) : 0,
            dx: tr.left + tr.width / 2 - rr.left - sx,
            dy: tr.top + tr.height / 2 - rr.top - sy,
            lines: cfg.lines, one: cfg.one, color: cfg.color,
        }
    }

    useEffect(() => {
        if (!showFrac) return
        const t = setTimeout(() => setFlight(startFlight()), 900)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showFrac])

    useEffect(() => {
        if (!landed) return
        const t = setTimeout(() => setDenShown(true), 700)
        return () => clearTimeout(t)
    }, [landed])

    useEffect(() => {
        if (!denShown) return
        const t = setTimeout(onSettled, 1400)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [denShown])

    const trigColor = cfg.color
    return (
        <div ref={rootRef} className="relative w-full flex flex-col items-center gap-4">
            <DiagramFrame maxW={420}>
                <RightTriangleDiagram
                    compact rightAngleMarkShown instantBase instantLegs
                    alphaVertex={INTRO_ALPHA} alphaColor={WHITE}
                    oppositeLegHighlighted={kind === 'opp'} oppositeLegLabelShown={kind === 'opp'}
                    adjacentLegHighlighted={kind === 'adj'} adjacentLegLabelShown={kind === 'adj'}
                    hypotenuseHighlighted={hypOn}
                    sideStickerLabels={qOn ? { hyp: HYP_Q } : {}}
                    sideStickerAlong={['hyp']}
                    reserveStickerLabels={{ hyp: HYP_Q }}
                    reserveLabels={[kind]}
                />
            </DiagramFrame>
            <div className="w-full flex justify-center min-h-[8rem]">
                {btnShown && !typing && (
                    <div className="w-full text-center text-lg md:text-xl font-bold text-[#F2F7FB] flex items-center justify-center">
                        {!hintTyped ? (
                            <Typewriter text={`Найдём гипотенузу по ${cfg.hintWord}${cfg.hintRest}`} onDone={() => { setHintTyped(true); setTimeout(() => { setBtnLabel(CURIOUS_REPLIES[Math.floor(Math.random() * CURIOUS_REPLIES.length)]); setBtnReady(true) }, 500) }} />
                        ) : (
                            <span>
                                Найдём <span style={{ color: HYPOTENUSE_COLOR }}>гипотенузу</span> по{' '}
                                <span style={{ color: cfg.color }}>{cfg.hintWord}</span>{cfg.hintRest}
                            </span>
                        )}
                    </div>
                )}
                {typing && (
                    <div className="w-full text-lg md:text-xl font-bold text-[#F2F7FB] flex items-center justify-center flex-wrap gap-1">
                        {!typed ? (
                            <Typewriter text="гипотенуза = " onDone={() => setTyped(true)} />
                        ) : (
                            <>
                                <Sticker value="гипотенуза" color={HYPOTENUSE_COLOR} />
                                <span> = </span>
                                {showFrac && (
                                    <span className="inline-flex flex-col items-center mx-4 align-middle">
                                        <div ref={numRef} className="relative">
                                            <div className={landed ? '' : 'invisible'}><Sticker value={cfg.one} color={cfg.color} /></div>
                                            {!landed && <div className="absolute inset-0 rounded-lg border-2 border-dashed border-[#3A464E]" />}
                                        </div>
                                        <span className="self-stretch -mx-3 h-[5px] my-2.5 rounded-full bg-[#F2F7FB]" />
                                        <div className="relative min-h-[2.4rem] min-w-[5rem] flex items-center justify-center">
                                            {denShown
                                                ? <Sticker value={cfg.trig} color={trigColor} />
                                                : <div className="absolute inset-0 rounded-lg border-2 border-dashed border-[#3A464E]" />}
                                        </div>
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
            {btnReady && !typing && (
                <motion.div
                    className="w-full flex"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <button
                        type="button"
                        onClick={() => setTyping(true)}
                        className={`${walkthroughButtonClass(true)} w-full whitespace-nowrap`}
                        style={walkthroughButtonStyle(true)}
                    >
                        {btnLabel}
                    </button>
                </motion.div>
            )}
            {flight && !landed && <FlyingLabel f={flight} onLanded={() => setLanded(true)} />}
        </div>
    )
}

// ===== Тренировка =====

type TrialKind = 'opp' | 'adj'

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
    chips: FormulaChip[]
    correct: [string, string]
}
const LEGS = [3, 4, 5, 6, 8, 9, 10, 12, 15]
// Пул кнопок: число-катет и три функции угла (одна верная, две «ловушки»).
const makeHypChips = (leg: number, angle: number): FormulaChip[] => shuffle([
    { id: 'leg', label: String(leg) },
    { id: 'sin', label: `sin ${angle}°` },
    { id: 'cos', label: `cos ${angle}°` },
    { id: 'tg', label: `tg ${angle}°` },
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
        return { kind, leg, angle, rotationDeg, alphaVertex, mirror: Math.random() < 0.5, chips: makeHypChips(leg, angle), correct: ['leg', kind === 'opp' ? 'sin' : 'cos'] }
    })
}

const HYP_TRIAL_COUNT = 4
const SCENES: string[] = [
    'intro-0', 'intro-1',
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

    const handleWrong = () => {
        playSound(WRONG_ANSWER_SOUND)
        setHadMistake(true)
        showAnswerMeme(false)
        setWrongFlash(pickWrongTryPhrase())
    }

    const handleSolved = (firstTry: boolean) => {
        registerCombo(firstTry)
        showAnswerMeme(true)
        setChecked(true)
        setWrongFlash(null)
        setNextLabel(pickWalkthroughNextLabel(isLastScene ? 'Готово' : 'Дальше'))
    }

    const markReady = (key: string) => () => setReady((r) => ({ ...r, [key]: true }))

    const renderIntro = (idx: number) => {
        const key = `intro-${idx}`
        return (
            <SceneWrapper key={key} innerRef={sceneRef(key)} active={isSceneActive(key)}>
                <div key={`${key}-${replayNonceFor(key)}`} className="w-full">
                    <HypotenuseScene kind={idx === 0 ? 'opp' : 'adj'} onSettled={markReady(key)} />
                </div>
            </SceneWrapper>
        )
    }

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
                    <FormulaAssemble
                        prefix="гипотенуза ="
                        layout="fraction"
                        chips={t.chips}
                        correct={t.correct}
                        frozen={!isCurrent}
                        onWrong={handleWrong}
                        onSolved={handleSolved}
                    />
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
        { dotKey: 'intro-0', label: 'Гипотенуза через противолежащий катет (sin α)', jumpKey: 'intro-0', isActive: latestSceneKey === 'intro-0', color: MAP_INTRO_COLOR },
        { dotKey: 'intro-1', label: 'Гипотенуза через прилежащий катет (cos α)', jumpKey: 'intro-1', isActive: latestSceneKey === 'intro-1', color: MAP_INTRO_COLOR },
        { dotKey: 'hpractice', label: `Тренировка: гипотенуза (${HYP_TRIAL_COUNT})`, jumpKey: 'htrial-0', isActive: latestKind === 'htrial', color: MAP_PRACTICE_COLOR },
    ]
    const jumpToKey = (key: string) => jumpTo(SCENES.indexOf(key))

    return (
        <div className={`w-full mx-auto flex flex-row items-start gap-3 ${isAdmin ? 'max-w-[46rem]' : 'max-w-2xl'}`}>
            <div className="min-w-0 flex-1 flex flex-col items-center gap-4">
                <div className="w-full flex flex-col gap-4">
                    {SCENES.slice(0, sceneIdx + 1).map((key) => (
                        sceneKind(key) === 'htrial' ? renderHypTrial(sceneNum(key)) : renderIntro(sceneNum(key))
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
