// app/t-lesson/[t_lessonId]/type-logflipwalk.tsx
//
// Тип LOGFLIPWALK — интерактивный разбор по шагам "перевёртыш"
// (log_a(b) = 1/log_b(a) — логарифм переворачивается местами основания
// и аргумента и уезжает в знаменатель) — тот же самодостаточный принцип,
// что у SINWALK/LOGWALK/LOGDEFWALK/LOGSUBWALK/LOGPOWWALK/LOGSWAPWALK/
// LOGDIVWALK/LOGCOMBOWALK: компонент сам ведёт хореографию, зовёт
// onAnswer/onComplete РОВНО один раз в конце; общая нижняя кнопка скрыта.
//
// Сюжет — прямая инструкция пользователя, на фиксированном примере
// log₈2 = 1/log₂8:
// 0. "log₈2" — просто условие (8 и 2 — стикеры РАЗНЫХ цветов), без "=?"
//    (это не квиз с выбором ответа — ответ раскрывается сразу на
//    следующем шаге). Текст: "Как поменять местами 8 и 2?"
// 1. "log₈2 = 1/log₂8" — ТЕ ЖЕ два стикера, просто основание/аргумент
//    поменялись местами и весь новый логарифм уехал в знаменатель.
//    Текст: "Надо логарифм просто закинуть в знаменатель!"
//
// После разбора — тренировочные задания с НОВЫМИ случайными числами
// (log_a(b) = ?), нужно кликнуть верную формулу-ответ среди 4 вариантов
// (все 4 комбинации "перевернул/не перевернул" × "добавил 1/ /не
// добавил" — ровно 4 различных исхода, дополнительных дистракторов не
// требуется) — тот же формат клика по варианту, что у LOGCOMBOWALK/
// LOGDIVWALK/LOGSWAPWALK, включая режим "пробуй, пока не угадаешь"
// (неверные варианты красятся и блокируются, сообщение персистентное).

'use client'

import { Fragment, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'
import {
    TypedLine, DiagramBlock,
    pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    ACTIVE_COLOR,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    isFieryMilestoneTrial, FieryCelebration,
} from '@/components/geometry/WalkthroughLog'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'

const SCENE_TRANSITION_PAUSE_MS = 1000

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

// Фиксированный обучающий пример — ровно тот, что дал пользователь.
const EX = { a: 8, b: 2 }

const INTRO_STEPS = 2
const TRIAL_COUNT = 4

// Два числа примера — разные цвета, СВЯЗАННЫЕ С ЧИСЛОМ, а не с ролью
// (8 остаётся тем же цветом, даже когда переезжает из основания в
// аргумент) — тот же приём, что уже применён в LOGSWAPWALK для a/c.
const A_COLOR = GGEGE_PALETTE.teal.button
const B_COLOR = GGEGE_PALETTE.raspberry.button

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

// ===== Общие строительные блоки (HTML+CSS, без KaTeX — та же причина,
// что и в LOGCOMBOWALK/LOGDIVWALK). =====

const NumSticker = ({ value, color, small = false }: { value: number; color: string; small?: boolean }) => (
    <motion.span
        initial={{ scale: 2.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15 }}
        className={cn(
            'inline-flex items-center justify-center rounded-lg border-2 font-extrabold align-middle',
            small ? 'px-1 text-[0.6em]' : 'px-1.5 py-0.5',
            'leading-none',
        )}
        style={{ borderColor: color, backgroundColor: hexToRgba(color, 0.18), color }}
    >
        {value}
    </motion.span>
)

const Plain = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[#F2F7FB]">{children}</span>
)

const QuestionMark = () => <span style={{ color: ACTIVE_COLOR }} className="font-black">?</span>

// "logₐ(x)" — база подстрочная, аргумент обычного размера. base/arg —
// готовые ReactNode (Plain или NumSticker).
const LogTerm = ({ base, arg }: { base: React.ReactNode; arg: React.ReactNode }) => (
    <span className="inline-flex items-baseline whitespace-nowrap">
        <Plain>log</Plain>
        <sub className="ml-0.5">{base}</sub>
        <span className="ml-1">{arg}</span>
    </span>
)

// Дробь "числитель / знаменатель" — та же CSS-подложка (нижняя граница
// числителя = черта дроби), что уже используется в LOGDIVWALK/
// LOGPOWWALK/LOGSUBWALK для стековой записи 1/logₓ(y).
const Fraction = ({ num, den }: { num: React.ReactNode; den: React.ReactNode }) => (
    <span className="inline-flex flex-col items-center leading-none align-middle">
        <span className="pb-1 border-b-2 border-[#F2F7FB]/70 px-1">{num}</span>
        <span className="pt-1 px-1">{den}</span>
    </span>
)

// Основная строка примера — 'plain' (шаг 0, "log₈2", без "=") и
// 'flipped' (шаг 1, "log₈2 = 1/log₂8") — на ОБОИХ шагах 8 и 2 стикеры
// своего цвета, просто на шаге 1 роли (основание/аргумент) поменялись.
const FlipExpression = ({ stage }: { stage: 'plain' | 'flipped' }) => (
    <div className="w-full flex items-center justify-center gap-2 flex-wrap text-2xl md:text-3xl font-extrabold py-2">
        <LogTerm
            base={<NumSticker value={EX.a} color={A_COLOR} small />}
            arg={<NumSticker value={EX.b} color={B_COLOR} />}
        />
        {stage === 'flipped' && (
            <>
                <Plain>=</Plain>
                <Fraction
                    num={<Plain>1</Plain>}
                    den={
                        <LogTerm
                            base={<NumSticker value={EX.b} color={B_COLOR} small />}
                            arg={<NumSticker value={EX.a} color={A_COLOR} />}
                        />
                    }
                />
            </>
        )}
    </div>
)

// ===== Тренировочные задания — новые случайные (a, b) — нужно
// кликнуть верную формулу "1/log_b(a)" среди 4 вариантов. =====

// flipped — основание/аргумент поменяны местами (true = log_b(a), false
// = log_a(b)); reciprocal — обёрнуто в "1/(...)". Все 4 комбинации этих
// двух независимых булевых переключателей дают РОВНО 4 разных, всегда
// различных варианта — дополнительных "ошибка на 1"-дистракторов не
// требуется (в отличие от других разборов, где вариантов физически
// меньше 4 без добора).
type FlipOption = { flipped: boolean; reciprocal: boolean }
type FlipTrial = { a: number; b: number; options: FlipOption[] }

const NUM_POOL = [2, 3, 4, 5, 6, 7, 8, 9] as const
const ALL_OPTIONS: FlipOption[] = [
    { flipped: false, reciprocal: false },
    { flipped: false, reciprocal: true },
    { flipped: true, reciprocal: false },
    { flipped: true, reciprocal: true },
]

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

const sameOption = (p: FlipOption, q: FlipOption) => p.flipped === q.flipped && p.reciprocal === q.reciprocal

const makeTrial = (prev: FlipTrial | null): FlipTrial => {
    let t: FlipTrial
    let guard = 0
    do {
        const a = pick(NUM_POOL)
        let b = pick(NUM_POOL)
        while (b === a) b = pick(NUM_POOL)
        t = { a, b, options: shuffle(ALL_OPTIONS) }
        guard++
    } while (prev && t.a === prev.a && t.b === prev.b && guard < 8)
    return t
}

const makeTrials = (n: number): FlipTrial[] => {
    const out: FlipTrial[] = []
    let prev: FlipTrial | null = null
    for (let i = 0; i < n; i++) {
        const t = makeTrial(prev)
        out.push(t)
        prev = t
    }
    return out
}

const pickTrialFeedback = (t: FlipTrial): string => {
    const seed = t.a * 7 + t.b * 5
    return CORRECT_FEEDBACK_PHRASES[Math.abs(seed) % CORRECT_FEEDBACK_PHRASES.length]
}

// Продукт тренировочного задания — без стикеров, только числа.
const TrialProduct = ({ a, b }: { a: number; b: number }) => (
    <div className="w-full flex items-center justify-center gap-2 flex-wrap text-2xl md:text-3xl font-extrabold py-2">
        <LogTerm base={<Plain>{a}</Plain>} arg={<Plain>{b}</Plain>} />
        <Plain>=</Plain>
        <QuestionMark />
    </div>
)

// Кнопка-вариант — компактная формула, с дробью (reciprocal) или без.
const MiniAnswerButton = ({
    a, b, option, onClick, disabled, state,
}: { a: number; b: number; option: FlipOption; onClick?: () => void; disabled?: boolean; state: 'idle' | 'correct' | 'wrong' }) => {
    const base = option.flipped ? b : a
    const arg = option.flipped ? a : b
    const formula = <LogTerm base={<Plain>{base}</Plain>} arg={<Plain>{arg}</Plain>} />
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'flex items-center justify-center py-3 px-3 rounded-xl border-2 text-base md:text-lg font-bold transition-colors',
                state === 'correct' && 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]',
                state === 'wrong' && 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]',
                state === 'idle' && 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]',
            )}
        >
            {option.reciprocal ? <Fraction num={<Plain>1</Plain>} den={formula} /> : formula}
        </button>
    )
}

export const TypeLogFlipWalk = ({ onAnswer, onComplete }: Props) => {
    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
    const [hadMistake, setHadMistake] = useState(false)

    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)

    const [trials, setTrials] = useState<FlipTrial[]>(() => makeTrials(TRIAL_COUNT))
    const [trialIndex, setTrialIndex] = useState(0)
    const [checked, setChecked] = useState(false)
    // Режим "пробуй, пока не угадаешь" — та же механика, что и в
    // LOGCOMBOWALK/LOGDEFWALK: неверно нажатые варианты ТЕКУЩЕГО задания
    // красятся красным и блокируются, wrongFlash — ПЕРСИСТЕНТНОЕ
    // сообщение под вариантами (не гаснет по таймеру, остаётся до
    // следующего клика).
    const [wrongTried, setWrongTried] = useState<FlipOption[]>([])
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)

    const currentCorrectOption: FlipOption = { flipped: true, reciprocal: true }

    const handleOptionClick = (option: FlipOption) => {
        if (checked) return
        if (wrongTried.some((w) => sameOption(w, option))) return
        if (sameOption(option, currentCorrectOption)) {
            setChecked(true)
            setTrialNextLabel(pickWalkthroughNextLabel('Дальше'))
        } else {
            setHadMistake(true)
            setWrongTried((prev) => [...prev, option])
            setWrongFlash(pickWrongTryPhrase())
        }
    }

    const handleNextTrial = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            const isLastInList = trialIndex + 1 >= trials.length
            if (isLastInList) {
                setAdvancing(false)
                const isFullyCorrect = !hadMistake
                onComplete(isFullyCorrect)
                onAnswer(isFullyCorrect ? 'right' : 'wrong')
                return
            }
            setTrialIndex((i) => i + 1)
            setChecked(false)
            setWrongTried([])
            setWrongFlash(null)
            setAdvancing(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }

    const handleIntroNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            if (step + 1 >= INTRO_STEPS) {
                setPhase('practice')
            } else {
                setStep((s) => s + 1)
                setStepReady(false)
            }
            setAdvancing(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }

    // trialNextLabel выставляется ПРЯМО в handleOptionClick (не эффектом
    // на trialIndex) — её тон зависит от того, верно ли ответили сейчас.
    const [introNextLabel, setIntroNextLabel] = useState('Дальше')
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    useEffect(() => { setIntroNextLabel(pickWalkthroughNextLabel('Дальше')) }, [step])

    const { bump: bumpNonce, nonceFor } = useReplayNonces()

    const latestSceneKey = phase === 'intro' ? `step-${step}` : `trial-${trialIndex}`
    const prevSceneKeyOf = (key: string): string | null => {
        if (key.startsWith('trial-')) {
            const idx = Number(key.slice('trial-'.length))
            return idx > 0 ? `trial-${idx - 1}` : `step-${INTRO_STEPS - 1}`
        }
        if (key.startsWith('step-')) {
            const idx = Number(key.slice('step-'.length))
            return idx > 0 ? `step-${idx - 1}` : null
        }
        return null
    }
    const contentSettled = phase === 'intro' ? stepReady : checked
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, contentSettled)
    const canGoBack = prevSceneKeyOf(latestSceneKey) !== null
    // "Повторить" — переигрывает анимацию ТЕКУЩЕЙ сцены заново, не трогая
    // состояние (в отличие от handleBack ниже) — та же пара useReplayNonces,
    // что уже используется для отката.
    const handleReplay = () => bumpNonce(latestSceneKey)

    const handleBack = () => {
        if (advancing) return
        const target = prevSceneKeyOf(latestSceneKey)
        if (!target) return
        bumpNonce(target)
        if (target.startsWith('trial-')) {
            const idx = Number(target.slice('trial-'.length))
            setTrialIndex(idx)
            setChecked(false)
            setWrongTried([])
            setWrongFlash(null)
        } else if (target.startsWith('step-')) {
            const idx = Number(target.slice('step-'.length))
            setPhase('intro')
            setStep(idx)
            setStepReady(false)
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            <div className="w-full flex flex-col gap-4">
                {/* Шаг 0 — просто условие "log₈2" (без "=?" — это не квиз,
                    ответ раскрывается на следующем шаге), стикеры + вопрос. */}
                <SceneWrapper key="step-0" innerRef={sceneRef('step-0')} active={isSceneActive('step-0')}>
                    <Fragment key={`step-0-${nonceFor('step-0')}`}>
                        <DiagramBlock>
                            <FlipExpression stage="plain" />
                        </DiagramBlock>
                        <TypedLine
                            className="w-full text-base md:text-lg text-[#F2F7FB]"
                            text={`Как поменять местами ${EX.a} и ${EX.b}?`}
                            onSettled={() => setStepReady(true)}
                        />
                    </Fragment>
                </SceneWrapper>

                {/* Шаг 1 — раскрытие: "log₈2 = 1/log₂8" (те же 2 стикера,
                    роли поменялись, весь логарифм уехал в знаменатель). */}
                {step >= 1 && (
                    <SceneWrapper key="step-1" innerRef={sceneRef('step-1')} active={isSceneActive('step-1')}>
                        <Fragment key={`step-1-${nonceFor('step-1')}`}>
                            <DiagramBlock>
                                <FlipExpression stage="flipped" />
                            </DiagramBlock>
                            <TypedLine
                                className="w-full text-base md:text-lg text-[#F2F7FB]"
                                text="Надо логарифм просто закинуть в знаменатель!"
                                onSettled={() => setStepReady(true)}
                            />
                            <LocalAnswerConfetti />
                        </Fragment>
                    </SceneWrapper>
                )}

                {phase === 'practice' && Array.from({ length: trialIndex + 1 }).map((_, i) => {
                    const t = trials[i]
                    const isCurrent = i === trialIndex
                    const isDone = i < trialIndex || (isCurrent && checked)
                    return (
                        <SceneWrapper key={`trial-${i}`} innerRef={sceneRef(`trial-${i}`)} active={isSceneActive(`trial-${i}`)}>
                        <Fragment key={`trial-${i}-${nonceFor(`trial-${i}`)}`}>
                            {i === 0 && (
                                <div className="w-full flex items-center gap-3" aria-hidden>
                                    <div className="flex-1 h-px bg-[#3A464E]" />
                                    <span className="text-xs font-bold uppercase tracking-wide text-[#5C6B73]">Тренировка</span>
                                    <div className="flex-1 h-px bg-[#3A464E]" />
                                </div>
                            )}
                            <div className="relative w-full flex items-center justify-center">
                                <div
                                    className="absolute left-0 top-1/2 -translate-y-1/2 shrink-0 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                                    style={{
                                        borderColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.55),
                                        backgroundColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.16),
                                        color: GGEGE_PALETTE.purple.button,
                                    }}
                                >
                                    <span>{i + 1}</span>
                                    <span className="opacity-50 font-normal">/</span>
                                    <span>{trials.length}</span>
                                </div>
                                <p className="text-base md:text-lg text-[#F2F7FB] text-center">
                                    Выбери правильный ответ:
                                </p>
                            </div>
                            <DiagramBlock>
                                <TrialProduct a={t.a} b={t.b} />
                            </DiagramBlock>
                            {isCurrent && !checked && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        {t.options.map((opt, oi) => {
                                            const isWrongTriedOpt = wrongTried.some((w) => sameOption(w, opt))
                                            return (
                                                <MiniAnswerButton
                                                    key={oi}
                                                    a={t.a}
                                                    b={t.b}
                                                    option={opt}
                                                    state={isWrongTriedOpt ? 'wrong' : 'idle'}
                                                    disabled={isWrongTriedOpt}
                                                    onClick={() => handleOptionClick(opt)}
                                                />
                                            )
                                        })}
                                    </div>
                                    {wrongFlash ? (
                                        <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#DC605B22] text-[#DC605B]">
                                            <X className="w-5 h-5" /> {wrongFlash}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-[#9AA7B0] text-center">Кликни на вариант выше</p>
                                    )}
                                </>
                            )}
                            {isDone && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        {t.options.map((opt, oi) => {
                                            const isCorrectOpt = sameOption(opt, currentCorrectOption)
                                            const isWrongTriedOpt = isCurrent && wrongTried.some((w) => sameOption(w, opt))
                                            return (
                                                <MiniAnswerButton
                                                    key={oi}
                                                    a={t.a}
                                                    b={t.b}
                                                    option={opt}
                                                    disabled
                                                    state={isCorrectOpt ? 'correct' : (isWrongTriedOpt ? 'wrong' : 'idle')}
                                                />
                                            )
                                        })}
                                    </div>
                                    <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#A1D15122] text-[#A1D151]">
                                        {pickTrialFeedback(t)}
                                    </div>
                                </>
                            )}
                            {isCurrent && checked && <LocalAnswerConfetti />}
                            {/* "Огненная" анимация-подбадривание — только на
                                milestone-упражнениях (1-е, затем каждое 4-е —
                                см. isFieryMilestoneTrial), поверх обычного
                                confetti. */}
                            {isCurrent && checked && isFieryMilestoneTrial(i) && <FieryCelebration />}
                        </Fragment>
                        </SceneWrapper>
                    )
                })}
            </div>

            {phase === 'intro' ? (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={handleReplay} disabled={advancing} />
                    <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                    <button type="button" onClick={handleIntroNext} disabled={!stepReady || advancing} className={walkthroughButtonClass(stepReady && !advancing)} style={walkthroughButtonStyle(stepReady && !advancing)}>
                        {introNextLabel}
                    </button>
                </div>
            ) : checked ? (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={handleReplay} disabled={advancing} />
                    <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                    <button type="button" onClick={handleNextTrial} disabled={advancing} className={walkthroughButtonClass(!advancing)} style={walkthroughButtonStyle(!advancing)}>
                        {trialIndex + 1 >= trials.length ? 'Готово' : trialNextLabel}
                    </button>
                </div>
            ) : null}
        </div>
    )
}
