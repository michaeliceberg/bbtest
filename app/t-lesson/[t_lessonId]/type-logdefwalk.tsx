// app/t-lesson/[t_lessonId]/type-logdefwalk.tsx
//
// Тип LOGDEFWALK — интерактивный разбор "что такое логарифм" (тренажёр
// "Логарифмы", НОВЫЙ первый урок темы, остальные — включая LOGWALK
// "Как складывать логарифмы" — сдвинуты дальше). Тот же самодостаточный
// принцип, что у SINWALK/LOGWALK: компонент сам ведёт хореографию и
// зовёт onAnswer/onComplete РОВНО один раз в конце; общая нижняя кнопка
// скрыта — своя кнопка "Дальше"/"Готово" на протяжении всего прохождения.
//
// Сюжет — прямая инструкция пользователя:
// 1. "2³ = ?" — мини-викторина (варианты ответа). После выбора 8:
//    "Тогда log₂8 = 3" (2, 8, 3 — ВСЕ стикерами), затем текст "логарифм
//    показывает СТЕПЕНЬ (стикер того же цвета, что "3"), в которую надо
//    возвести 2, чтобы получить 8".
// 2. Практика — 4 мини-викторины: log₅25=?, log₆36=?, log₁₀1000=?,
//    log₂16=?.
// 3. "ЗАПОМНИ!" — в логарифм нельзя подставлять отрицательные числа
//    (примеры с красными стикерами на невалидной части), и нельзя
//    писать 1 в основание (тоже красный стикер).
// 4. Финальная мини-викторина "бывает ли такой логарифм?" — 6 ПРИМЕРОВ
//    БЕЗ стикеров (по прямой просьбе пользователя — "не спойлерить"),
//    ответ ДА/НЕТ.
//
// Квизы 0-4 (индексы совпадают с шагами 0-4) хранят свой ответ в ОТДЕЛЬНОМ
// массиве quizAnswers — НЕ в одном общем состоянии, которое сбрасывалось
// бы между шагами: раз это "накопительный лог" (все прошлые шаги
// остаются на экране), состояние прошлого шага должно переживать переход
// на следующий, иначе его блок в логе начал бы отражать ответ УЖЕ
// СЛЕДУЮЩЕГО шага (реальный класс бага, отловленный на этапе проектирования,
// не постфактум).

'use client'

import { Fragment, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'
import {
    DiagramBlock,
    pickWalkthroughNextLabel, pickWalkthroughWrongLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    ACTIVE_COLOR, WRONG_COLOR, CORRECT_COLOR, ATTENTION_COLOR,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    BlinkingExclaim, SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import paperPolice from '@/public/Lottie/stepByStep/paperPolice.json'

// lottie-react трогает document на импорте — без ssr:false падает на
// сервере (та же SSR-ловушка, что уже чинили у TrainerMascot/
// question-bubble/type-hot.tsx, см. CLAUDE.md).
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

const SCENE_TRANSITION_PAUSE_MS = 1000

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

// Основание — синий (та же роль, что и в LOGWALK); аргумент — зелёный;
// степень/показатель (то, что мы ищем — "вот ключевой термин этого
// урока") — фиолетовый, роль уже закреплена в палитре ggege за "вот что
// мы сейчас ищем". Невалидные значения — WRONG_COLOR (красный, единая
// feedback-семантика проекта, не новый цвет).
const BASE_COLOR = GGEGE_PALETTE.blue.button
const ARG_COLOR = GGEGE_PALETTE.green.button
const RESULT_COLOR = GGEGE_PALETTE.purple.button

// ===== Общие строительные блоки (HTML+CSS, без KaTeX — та же причина,
// что и в LOGWALK: короткая целочисленная запись не требует формульного
// рендера, а HTML избавляет от KaTeX-сегментирования). =====

const Sticker = ({ value, color, small = false }: { value: React.ReactNode; color: string; small?: boolean }) => (
    <motion.span
        initial={{ scale: 2.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15 }}
        className={cn(
            'inline-flex items-center justify-center rounded-lg border-2 font-extrabold align-middle',
            // leading-none ПОСЛЕ text-[...] — иначе tailwind-merge тихо
            // вырезает leading-none (см. тот же баг, найденный и описанный
            // в type-logwalk.tsx).
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

const FormulaRow = ({ children }: { children: React.ReactNode }) => (
    <div className="w-full flex items-center justify-center flex-wrap gap-x-2 gap-y-2 text-2xl md:text-3xl font-extrabold py-1">
        {children}
    </div>
)

// "logₐ(x)" — база — subscript, аргумент — обычный размер. Оба принимают
// готовый ReactNode (Plain или Sticker) — компонент не решает сам, как
// красить, только раскладывает.
const LogExpr = ({ base, arg, tail }: { base: React.ReactNode; arg: React.ReactNode; tail?: React.ReactNode }) => (
    <span className="inline-flex items-baseline whitespace-nowrap">
        <Plain>log</Plain>
        <sub className="ml-0.5">{base}</sub>
        <span className="ml-1">{arg}</span>
        {tail}
    </span>
)

const PowerExpr = ({ base, exp }: { base: React.ReactNode; exp: React.ReactNode }) => (
    <span className="inline-flex items-baseline whitespace-nowrap">
        {base}
        <sup className="ml-0.5">{exp}</sup>
    </span>
)

// Показывает выбранное число цветом по итогу проверки — тот же приём,
// что и в LOGWALK (выбор подставляется в формулу и красится сразу).
const PickedValue = ({ value, isCorrect }: { value: number; isCorrect: boolean }) => (
    <motion.span
        key={value}
        initial={{ scale: 2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15 }}
        style={{ color: isCorrect ? CORRECT_COLOR : WRONG_COLOR }}
    >
        {value}
    </motion.span>
)

const QuestionMark = () => <span style={{ color: ACTIVE_COLOR }} className="font-black">?</span>

// Режим "пробуй, пока не угадаешь" (та же механика, что и у LOGCOMBOWALK) —
// неверно нажатые варианты красятся красным и блокируются, остальные
// остаются кликабельны.
const OptionButton = ({
    value, onClick, disabled, state = 'idle',
}: { value: number; onClick?: () => void; disabled?: boolean; state?: 'idle' | 'wrong' }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
            'min-w-[64px] py-3 px-4 rounded-xl border-2 text-lg md:text-xl font-bold transition-colors',
            state === 'wrong'
                ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]'
                : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]',
        )}
    >
        {value}
    </button>
)

// Персистентное сообщение под вариантами — та же строка, что и в
// LOGCOMBOWALK: по умолчанию нейтральная подсказка, после первого
// неверного клика — красный баннер со случайной зумерской фразой,
// остаётся на экране (не гаснет само) до следующего клика.
const OptionsHint = ({ wrongFlash }: { wrongFlash: string | null }) => (
    wrongFlash ? (
        <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#DC605B22] text-[#DC605B]">
            <X className="w-5 h-5" /> {wrongFlash}
        </div>
    ) : (
        <p className="text-sm text-[#9AA7B0] text-center">Кликни на вариант выше</p>
    )
)

// Похвала за верный ответ — детерминированно из seed (не Math.random()
// прямо в рендере, см. тот же приём в type-sinwalk.tsx/type-logwalk.tsx).
const FeedbackBanner = ({ correct, correctText = '', seed }: { correct: boolean; correctText?: string; seed: number }) => (
    <div
        className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center',
            correct ? 'bg-[#A1D15122] text-[#A1D151]' : 'bg-[#DC605B22] text-[#DC605B]'
        )}
    >
        {correct ? CORRECT_FEEDBACK_PHRASES[Math.abs(seed) % CORRECT_FEEDBACK_PHRASES.length] : correctText}
    </div>
)

// Печатаемая строка с ОДНИМ встроенным стикером внутри текста (не число
// в формуле, а слово — например "степень") — по прямой просьбе
// пользователя ("степень сделай спикером"). plainTextForTyping — то же
// содержимое обычным текстом, используется только на время печати
// (Typewriter печатает целиком одну строку, без разметки).
const TypedLineWithSticker = ({
    before, stickerContent, plainTextForTyping, stickerColor, after = '', onSettled,
}: {
    before: string; stickerContent: React.ReactNode; plainTextForTyping: string; stickerColor: string; after?: string; onSettled?: () => void
}) => {
    const [typed, setTyped] = useState(false)
    return (
        <div className="w-full text-base md:text-lg text-[#F2F7FB]">
            {!typed ? (
                <Typewriter
                    text={`${before}${plainTextForTyping}${after}`}
                    onDone={() => { setTyped(true); setTimeout(() => onSettled?.(), 450) }}
                />
            ) : (
                <>
                    {before}
                    <Sticker value={stickerContent} color={stickerColor} />
                    {after}
                </>
            )}
        </div>
    )
}

// Баннер "ВНИМАААААНИЕ!" (был "ЗАПОМНИ!", заменён по прямой просьбе
// пользователя) — привлекает внимание к правилам ОДЗ логарифма. По
// уточнению пользователя — Lottie "полицейский с бумагой" (public/Lottie/
// stepByStep/paperPolice.json) теперь рисуется КРУПНО отдельно (не внутри
// самой плашки-кнопки, как раньше), а справа от него — сама плашка с
// текстом "ВНИМАААААНИЕ!" (тот же оранжевый ATTENTION_COLOR и мигающий
// "!"/BlinkingExclaim, что уже используются в разборах для "смотри сюда/
// важно") — тот же пропорции Lottie, что уже задействованы в
// TrainerMascot.tsx (w-16 h-16 md:w-20 md:h-20) для "персонаж + текст
// справа".
const RememberBanner = () => (
    <div className="w-full flex items-center gap-3">
        <Lottie animationData={paperPolice} loop autoplay className="w-16 h-16 md:w-20 md:h-20 shrink-0" />
        <div
            className="flex-1 flex items-center justify-center rounded-xl px-4 py-3 font-black text-lg"
            style={{ backgroundColor: hexToRgba(ATTENTION_COLOR, 0.16), border: `2px solid ${ATTENTION_COLOR}`, color: ATTENTION_COLOR }}
        >
            <span>ВНИМАААААНИЕ<BlinkingExclaim /></span>
        </div>
    </div>
)

// Печатаемая строка ЗАПОМНИ/ВНИМАНИЕ-баннера с ДВУМЯ красными акцентами —
// слово "нельзя" И ключевая фраза дальше — ОБА красными боксовыми
// СТИКЕРАМИ (та же рамка, что и у числовых стикеров), не текстовыделителем.
// Раньше фраза шла через HighlightWord ("выезжающая" подложка) — по
// прямой просьбе пользователя (2026-09-18, "надо не текстовыделителем, а
// красным стикером, чтобы всё было в одном стиле") переведена на Sticker,
// единый визуальный язык с "нельзя".
const TypedForbidLine = ({
    before, stickerWord, between, phrase, after = '.', color, onSettled,
}: {
    before: string; stickerWord: string; between: string; phrase: string; after?: string; color: string; onSettled?: () => void
}) => {
    const [typed, setTyped] = useState(false)
    return (
        <div className="w-full text-base md:text-lg text-[#F2F7FB]">
            {!typed ? (
                <Typewriter
                    text={`${before}${stickerWord}${between}${phrase}${after}`}
                    onDone={() => { setTyped(true); setTimeout(() => onSettled?.(), 450) }}
                />
            ) : (
                <>
                    {before}
                    <Sticker value={stickerWord} color={color} />
                    {between}
                    <Sticker value={phrase} color={color} />
                    {after}
                </>
            )}
        </div>
    )
}

// ===== Мини-викторины 0-4 (см. QUIZ_STEP_DEFS) =====

type LogQuizDef = { base: number; arg: number; correct: number; options: number[] }

const DEFINE_OPTIONS = [6, 8, 9, 16]
const DEFINE_CORRECT = 8

const LOG_QUIZZES: LogQuizDef[] = [
    { base: 5, arg: 25, correct: 2, options: [2, 5, 10, 25] },
    { base: 6, arg: 36, correct: 2, options: [2, 6, 12, 36] },
    { base: 10, arg: 1000, correct: 3, options: [3, 10, 100, 1000] },
    { base: 2, arg: 16, correct: 4, options: [2, 4, 8, 16] },
]

// Индексы шагов: 0 — определение (2³=?), 1-4 — LOG_QUIZZES[0..3],
// 5 — ЗАПОМНИ (отрицательные числа), 6 — ЗАПОМНИ (основание 1).
const TOTAL_INTRO_STEPS = 7

// ===== Финальная викторина "бывает ли такой логарифм?" — 6 ФИКСИРОВАННЫХ
// примеров (не случайная генерация — пользователь дал точный список),
// БЕЗ стикеров вообще (по прямой просьбе — не подсказывать цветом). =====

type ExistItem = { base: number; arg: number; correct: boolean }
const EXIST_ITEMS: ExistItem[] = [
    { base: -3, arg: 27, correct: false },
    { base: 3, arg: 81, correct: true },
    { base: 1, arg: 4, correct: false },
    { base: 24, arg: 576, correct: true },
    { base: 10, arg: -100, correct: false },
    { base: 4, arg: 1, correct: true },
]

const YesNoButton = ({
    label, onClick, disabled, state,
}: {
    label: string; onClick?: () => void; disabled?: boolean; state: 'idle' | 'correct' | 'wrong'
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
            'min-w-[100px] py-3 px-6 rounded-xl border-2 text-lg md:text-xl font-bold transition-colors',
            state === 'correct' && 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]',
            state === 'wrong' && 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]',
            state === 'idle' && 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]',
        )}
    >
        {label}
    </button>
)

export const TypeLogDefWalk = ({ onAnswer, onComplete }: Props) => {
    const [phase, setPhase] = useState<'intro' | 'existence'>('intro')
    const [hadMistake, setHadMistake] = useState(false)

    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)

    // Ответы квизов 0-4 — ПО ИНДЕКСУ ШАГА, не общее состояние (см.
    // комментарий в начале файла про накопительный лог). Значение
    // попадает сюда ТОЛЬКО когда оно верное (см. handleQuizPick) — режим
    // "пробуй, пока не угадаешь", та же механика, что и у LOGCOMBOWALK.
    const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>(Array(5).fill(null))
    // Неверно нажатые варианты ТЕКУЩЕГО (единственного активного на данный
    // момент — шаги 0-4 линейны) квиза + персистентное сообщение под
    // вариантами — сбрасываются при переходе на следующий шаг/откате назад.
    const [quizWrongTried, setQuizWrongTried] = useState<number[]>([])
    const [quizWrongFlash, setQuizWrongFlash] = useState<string | null>(null)

    const [existIndex, setExistIndex] = useState(0)
    const [existAnswers, setExistAnswers] = useState<(boolean | null)[]>(Array(EXIST_ITEMS.length).fill(null))
    const [existChecked, setExistChecked] = useState(false)

    // Конфетти на "локальный" верный ответ — ОДНО общее состояние с
    // ключом момента, а не постоянное "answer===correct" на каждый шаг:
    // накопительный лог держит ВСЕ прошлые шаги на экране одновременно,
    // и если условие рендера конфетти навсегда остаётся true после
    // правильного ответа, все прошлые бёрсты остаются смонтированными
    // разом — реальный баг, пойманный живьём (экран засыпан конфетти со
    // всех 4 практических квизов сразу, как только доходишь до 5-го
    // шага). Автоочистка по таймеру — конфетти играет один раз и
    // пропадает, как и у остальных "локальных ответов" в проекте.
    const [confettiFor, setConfettiFor] = useState<string | null>(null)
    useEffect(() => {
        if (!confettiFor) return
        const t = setTimeout(() => setConfettiFor(null), 2200)
        return () => clearTimeout(t)
    }, [confettiFor])

    const handleQuizPick = (stepIdx: number, value: number, correct: number) => {
        if (quizAnswers[stepIdx] !== null) return
        if (quizWrongTried.includes(value)) return
        if (value !== correct) {
            setHadMistake(true)
            setQuizWrongTried((prev) => [...prev, value])
            setQuizWrongFlash(pickWrongTryPhrase())
            return
        }
        const next = [...quizAnswers]
        next[stepIdx] = value
        setQuizAnswers(next)
        setConfettiFor(`step-${stepIdx}`)
        setQuizWrongTried([])
        setQuizWrongFlash(null)
        // Шаг 0 (определение) не открывает "Дальше" сразу — сначала должна
        // допечататься реплика-раскрытие определения (см. её onSettled).
        if (stepIdx !== 0) setStepReady(true)
    }

    const handleExistPick = (guess: boolean) => {
        if (existChecked) return
        const next = [...existAnswers]
        next[existIndex] = guess
        setExistAnswers(next)
        setExistChecked(true)
        if (guess !== EXIST_ITEMS[existIndex].correct) {
            setHadMistake(true)
            setExistNextLabel(pickWalkthroughWrongLabel('Дальше'))
        } else {
            setConfettiFor(`exist-${existIndex}`)
            setExistNextLabel(pickWalkthroughNextLabel('Дальше'))
        }
    }

    const handleIntroNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            if (step + 1 >= TOTAL_INTRO_STEPS) {
                setPhase('existence')
            } else {
                setStep((s) => s + 1)
                setStepReady(false)
            }
            setQuizWrongTried([])
            setQuizWrongFlash(null)
            setAdvancing(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }

    const handleExistNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            const isLast = existIndex + 1 >= EXIST_ITEMS.length
            if (isLast) {
                setAdvancing(false)
                const isFullyCorrect = !hadMistake
                onComplete(isFullyCorrect)
                onAnswer(isFullyCorrect ? 'right' : 'wrong')
                return
            }
            setExistIndex((i) => i + 1)
            setExistChecked(false)
            setAdvancing(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }

    // existNextLabel выставляется ПРЯМО в handleExistPick (не эффектом на
    // existIndex) — её тон зависит от того, верно ли ответили сейчас.
    const [introNextLabel, setIntroNextLabel] = useState('Дальше')
    const [existNextLabel, setExistNextLabel] = useState('Дальше')
    useEffect(() => { setIntroNextLabel(pickWalkthroughNextLabel('Дальше')) }, [step])

    // Счётчики "повторов" — нужны кнопке "назад" для перемонтирования
    // содержимого целевой сцены (см. type-sinwalk.tsx).
    const { bump: bumpNonce, nonceFor } = useReplayNonces()

    // Затемнение прошлых сцен + автоскролл к новой (см. useSceneFocus в
    // WalkthroughLog.tsx) — та же схема ключей, что и в SINWALK/LOGWALK,
    // только вторая фаза называется "exist-N", а не "trial-N".
    const latestSceneKey = phase === 'intro' ? `step-${step}` : `exist-${existIndex}`
    const prevSceneKeyOf = (key: string): string | null => {
        if (key.startsWith('exist-')) {
            const idx = Number(key.slice('exist-'.length))
            return idx > 0 ? `exist-${idx - 1}` : `step-${TOTAL_INTRO_STEPS - 1}`
        }
        if (key.startsWith('step-')) {
            const idx = Number(key.slice('step-'.length))
            return idx > 0 ? `step-${idx - 1}` : null
        }
        return null
    }
    const contentSettled = phase === 'intro' ? stepReady : existChecked
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, contentSettled)
    const canGoBack = prevSceneKeyOf(latestSceneKey) !== null
    // "Повторить" — переигрывает анимацию ТЕКУЩЕЙ сцены заново, не трогая
    // состояние (в отличие от handleBack ниже) — та же пара useReplayNonces,
    // что уже используется для отката.
    const handleReplay = () => bumpNonce(latestSceneKey)

    // "Назад" — реальный откат состояния на предыдущую сцену (см.
    // type-logwalk.tsx для подробного комментария). Шаги 0-4 — мини-квизы
    // (quizAnswers), их ответ сбрасывается тоже — иначе сцена показала бы
    // уже отвеченное состояние вместо того, чтобы "начать заново".
    const handleBack = () => {
        if (advancing) return
        const target = prevSceneKeyOf(latestSceneKey)
        if (!target) return
        bumpNonce(target)
        if (target.startsWith('exist-')) {
            const idx = Number(target.slice('exist-'.length))
            setExistIndex(idx)
            setExistChecked(false)
            setExistAnswers((prev) => { const next = [...prev]; next[idx] = null; return next })
        } else if (target.startsWith('step-')) {
            const idx = Number(target.slice('step-'.length))
            setPhase('intro')
            setStep(idx)
            setStepReady(false)
            if (idx <= 4) {
                setQuizAnswers((prev) => { const next = [...prev]; next[idx] = null; return next })
                setQuizWrongTried([])
                setQuizWrongFlash(null)
            }
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            <div className="w-full flex flex-col gap-4">
                {/* Шаг 0 — определение через 2³=8 → log₂8=3. */}
                <SceneWrapper key="step-0" innerRef={sceneRef('step-0')} active={isSceneActive('step-0')}>
                    <Fragment key={`step-0-${nonceFor('step-0')}`}>
                        <DiagramBlock>
                            <FormulaRow>
                                <PowerExpr base={<Plain>2</Plain>} exp={<Plain>3</Plain>} />
                                <Plain>=</Plain>
                                {quizAnswers[0] === null ? <QuestionMark /> : <PickedValue value={quizAnswers[0]} isCorrect={quizAnswers[0] === DEFINE_CORRECT} />}
                            </FormulaRow>
                        </DiagramBlock>
                        {quizAnswers[0] === null && (
                            <>
                                <div className="flex flex-wrap justify-center gap-3">
                                    {DEFINE_OPTIONS.map((num) => {
                                        const isWrong = quizWrongTried.includes(num)
                                        return (
                                            <OptionButton
                                                key={num}
                                                value={num}
                                                state={isWrong ? 'wrong' : 'idle'}
                                                disabled={isWrong}
                                                onClick={() => handleQuizPick(0, num, DEFINE_CORRECT)}
                                            />
                                        )
                                    })}
                                </div>
                                <OptionsHint wrongFlash={quizWrongFlash} />
                            </>
                        )}
                        {quizAnswers[0] !== null && (
                            <>
                                <FeedbackBanner correct seed={quizAnswers[0]} />
                                {confettiFor === 'step-0' && <LocalAnswerConfetti />}
                                <DiagramBlock>
                                    <FormulaRow>
                                        <Plain>Тогда</Plain>
                                        <LogExpr
                                            base={<Sticker value={2} color={BASE_COLOR} small />}
                                            arg={<Sticker value={8} color={ARG_COLOR} />}
                                            tail={<><Plain>=</Plain><Sticker value={3} color={RESULT_COLOR} /></>}
                                        />
                                    </FormulaRow>
                                </DiagramBlock>
                                <TypedLineWithSticker
                                    before="То есть логарифм показывает "
                                    stickerContent="степень"
                                    plainTextForTyping="степень"
                                    stickerColor={RESULT_COLOR}
                                    after=", в которую надо возвести 2, чтобы получить 8."
                                    onSettled={() => setStepReady(true)}
                                />
                            </>
                        )}
                    </Fragment>
                </SceneWrapper>

                {/* Шаги 1-4 — практика: чему равен log_a x? */}
                {LOG_QUIZZES.map((def, idx) => {
                    const i = idx + 1
                    if (step < i) return null
                    const answer = quizAnswers[i]
                    return (
                        <SceneWrapper key={`step-${i}`} innerRef={sceneRef(`step-${i}`)} active={isSceneActive(`step-${i}`)}>
                            <Fragment key={`step-${i}-${nonceFor(`step-${i}`)}`}>
                                <DiagramBlock>
                                    <FormulaRow>
                                        <LogExpr
                                            base={<Plain>{def.base}</Plain>}
                                            arg={<Plain>{def.arg}</Plain>}
                                            tail={<><Plain>=</Plain>{answer === null ? <QuestionMark /> : <PickedValue value={answer} isCorrect={answer === def.correct} />}</>}
                                        />
                                    </FormulaRow>
                                </DiagramBlock>
                                {answer === null && (
                                    <>
                                        <div className="flex flex-wrap justify-center gap-3">
                                            {def.options.map((num) => {
                                                const isWrong = quizWrongTried.includes(num)
                                                return (
                                                    <OptionButton
                                                        key={num}
                                                        value={num}
                                                        state={isWrong ? 'wrong' : 'idle'}
                                                        disabled={isWrong}
                                                        onClick={() => handleQuizPick(i, num, def.correct)}
                                                    />
                                                )
                                            })}
                                        </div>
                                        <OptionsHint wrongFlash={quizWrongFlash} />
                                    </>
                                )}
                                {answer !== null && (
                                    <>
                                        <FeedbackBanner correct seed={answer + i * 11} />
                                        {confettiFor === `step-${i}` && <LocalAnswerConfetti />}
                                    </>
                                )}
                            </Fragment>
                        </SceneWrapper>
                    )
                })}

                {/* Шаг 5 — ЗАПОМНИ: отрицательные числа. */}
                {step >= 5 && (
                    <SceneWrapper key="step-5" innerRef={sceneRef('step-5')} active={isSceneActive('step-5')}>
                        <Fragment key={`step-5-${nonceFor('step-5')}`}>
                            <DiagramBlock><RememberBanner /></DiagramBlock>
                            <TypedForbidLine
                                before="В логарифм "
                                stickerWord="нельзя"
                                between=" подставлять "
                                phrase="отрицательные числа"
                                color={WRONG_COLOR}
                                onSettled={() => setStepReady(true)}
                            />
                            <DiagramBlock>
                                <div className="w-full flex flex-col items-center gap-3">
                                    <FormulaRow>
                                        <LogExpr base={<Sticker value={-2} color={WRONG_COLOR} small />} arg={<Plain>8</Plain>} />
                                        <Sticker value="НЕЛЬЗЯ!" color={WRONG_COLOR} small />
                                    </FormulaRow>
                                    <FormulaRow>
                                        <LogExpr base={<Plain>5</Plain>} arg={<Sticker value={-25} color={WRONG_COLOR} />} />
                                        <Sticker value="НЕЛЬЗЯ!" color={WRONG_COLOR} small />
                                    </FormulaRow>
                                    <div className="flex items-center gap-2 text-base md:text-lg font-bold text-[#F2F7FB]">
                                        <span>А такое — тем более!</span>
                                        <span className="text-2xl">🤢</span>
                                    </div>
                                    <FormulaRow>
                                        <LogExpr base={<Sticker value={-6} color={WRONG_COLOR} small />} arg={<Sticker value={-36} color={WRONG_COLOR} />} />
                                        <Sticker value="ВАЩЕ НЕЛЬЗЯ!" color={WRONG_COLOR} small />
                                    </FormulaRow>
                                </div>
                            </DiagramBlock>
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 6 — ЗАПОМНИ: основание не может быть 1. */}
                {step >= 6 && (
                    <SceneWrapper key="step-6" innerRef={sceneRef('step-6')} active={isSceneActive('step-6')}>
                        <Fragment key={`step-6-${nonceFor('step-6')}`}>
                            <DiagramBlock><RememberBanner /></DiagramBlock>
                            <TypedForbidLine
                                before="А ещё в основание логарифма "
                                stickerWord="нельзя"
                                between=" писать "
                                phrase="1"
                                color={WRONG_COLOR}
                                onSettled={() => setStepReady(true)}
                            />
                            <DiagramBlock>
                                <div className="w-full flex flex-col items-center gap-3">
                                    <FormulaRow>
                                        <LogExpr base={<Sticker value={1} color={WRONG_COLOR} small />} arg={<Plain>8</Plain>} />
                                        <Sticker value="НЕЛЬЗЯ!" color={WRONG_COLOR} small />
                                    </FormulaRow>
                                    <FormulaRow>
                                        <LogExpr base={<Sticker value={1} color={WRONG_COLOR} small />} arg={<Plain>25</Plain>} />
                                        <Sticker value="НЕЛЬЗЯ!" color={WRONG_COLOR} small />
                                    </FormulaRow>
                                </div>
                            </DiagramBlock>
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Финальная викторина — "бывает ли такой логарифм?", БЕЗ
                    стикеров (не подсказываем цветом). */}
                {phase === 'existence' && EXIST_ITEMS.slice(0, existIndex + 1).map((item, i) => {
                    const isCurrent = i === existIndex
                    const isDone = i < existIndex || (isCurrent && existChecked)
                    const guess = existAnswers[i]
                    return (
                        <SceneWrapper key={`exist-${i}`} innerRef={sceneRef(`exist-${i}`)} active={isSceneActive(`exist-${i}`)}>
                        <Fragment key={`exist-${i}-${nonceFor(`exist-${i}`)}`}>
                            <div className="flex items-start gap-3 w-full">
                                <div
                                    className="shrink-0 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                                    style={{
                                        borderColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.55),
                                        backgroundColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.16),
                                        color: GGEGE_PALETTE.purple.button,
                                    }}
                                >
                                    <span>{i + 1}</span>
                                    <span className="opacity-50 font-normal">/</span>
                                    <span>{EXIST_ITEMS.length}</span>
                                </div>
                                <p className="flex-1 text-base md:text-lg text-[#F2F7FB]">Бывает ли такой логарифм?</p>
                            </div>
                            <DiagramBlock>
                                <FormulaRow>
                                    <LogExpr base={<Plain>{item.base}</Plain>} arg={<Plain>{item.arg}</Plain>} />
                                    <Plain>?</Plain>
                                </FormulaRow>
                            </DiagramBlock>
                            {isCurrent && !existChecked && (
                                <div className="flex justify-center gap-3">
                                    <YesNoButton label="ДА" onClick={() => handleExistPick(true)} state="idle" />
                                    <YesNoButton label="НЕТ" onClick={() => handleExistPick(false)} state="idle" />
                                </div>
                            )}
                            {isDone && (
                                <>
                                    <div className="flex justify-center gap-3">
                                        <YesNoButton label="ДА" disabled state={item.correct ? 'correct' : (guess === true ? 'wrong' : 'idle')} />
                                        <YesNoButton label="НЕТ" disabled state={!item.correct ? 'correct' : (guess === false ? 'wrong' : 'idle')} />
                                    </div>
                                    <FeedbackBanner
                                        correct={guess === item.correct}
                                        correctText={item.correct ? 'Неверно — такой логарифм существует.' : 'Неверно — такого логарифма не бывает.'}
                                        seed={i * 19 + (guess ? 1 : 0)}
                                    />
                                    {confettiFor === `exist-${i}` && <LocalAnswerConfetti />}
                                </>
                            )}
                        </Fragment>
                        </SceneWrapper>
                    )
                })}
            </div>

            {phase === 'intro' ? (
                (step <= 4 && quizAnswers[step] === null) ? (
                    <div className="w-full flex items-center gap-2">
                        <ReplayButton onClick={handleReplay} disabled={advancing} />
                        <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                    </div>
                ) : (
                    <div className="w-full flex items-center gap-2">
                        <ReplayButton onClick={handleReplay} disabled={advancing} />
                        <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                        <button type="button" onClick={handleIntroNext} disabled={!stepReady || advancing} className={walkthroughButtonClass(stepReady && !advancing)} style={walkthroughButtonStyle(stepReady && !advancing)}>
                            {introNextLabel}
                        </button>
                    </div>
                )
            ) : existChecked ? (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={handleReplay} disabled={advancing} />
                    <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                    <button type="button" onClick={handleExistNext} disabled={advancing} className={walkthroughButtonClass(!advancing)} style={walkthroughButtonStyle(!advancing)}>
                        {existIndex + 1 >= EXIST_ITEMS.length ? 'Готово' : existNextLabel}
                    </button>
                </div>
            ) : (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={handleReplay} disabled={advancing} />
                    <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                    <p className="flex-1 text-sm text-[#9AA7B0] text-center">Выбери ДА или НЕТ</p>
                </div>
            )}
        </div>
    )
}
