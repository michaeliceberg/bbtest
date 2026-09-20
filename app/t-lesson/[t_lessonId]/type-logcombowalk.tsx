// app/t-lesson/[t_lessonId]/type-logcombowalk.tsx
//
// Тип LOGCOMBOWALK — интерактивный разбор по шагам "комбо-конструкция"
// (log_a b · log_b c = log_a c, "цепное правило" логарифмов) — тот же
// самодостаточный принцип, что у SINWALK/LOGWALK/LOGDEFWALK/LOGSUBWALK/
// LOGPOWWALK/LOGSWAPWALK/LOGDIVWALK: компонент сам ведёт хореографию,
// зовёт onAnswer/onComplete РОВНО один раз в конце; общая нижняя кнопка
// скрыта.
//
// Сюжет — прямая инструкция пользователя ("К-к-комбо конструкция"), на
// фиксированном примере log₂3 · log₃4 = log₂4:
// 0. "log₂3 · log₃4 = ?" — просто условие.
// 1. "К-к-комбо! Если видим такую конструкцию..." — обводим СОВПАДАЮЩУЮ
//    часть: аргумент первого лога (3) и основание второго (log₃) —
//    единая обводка прямоугольником со скруглёнными углами вокруг
//    "3 · log₃".
// 2. Пауза, затем зачёркиваем ту же обведённую часть (аргумент и
//    основание совпали — сокращаются).
// 3. Зачёркнутая часть становится бледной, а числа СНАРУЖИ (2 и 4)
//    становятся цветными стикерами.
// 4. "Получилось: log₂4." — итог.
//
// После разбора — тренировочные задания с НОВЫМИ случайными числами
// (log_a b · log_b c = ?), нужно кликнуть верную формулу-ответ среди 4
// вариантов — тот же формат клика по варианту, что у LOGDIVWALK/
// LOGSWAPWALK/LOGPOWWALK.

'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'
import {
    TypedLine, DiagramBlock,
    pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    ACTIVE_COLOR, CORRECT_COLOR, ATTENTION_COLOR,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    isFieryMilestoneTrial, FieryCelebration,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'

const SCENE_TRANSITION_PAUSE_MS = 1000

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

// Фиксированный обучающий пример — ровно тот, что дал пользователь.
// EX.b встречается ДВАЖДЫ (аргумент первого лога = основание второго) —
// это и есть само условие срабатывания "комбо".
const EX = { a: 2, b: 3, c: 4 }

const INTRO_STEPS = 5
const TRIAL_COUNT = 4

// Числа, которые ВЫЖИВАЮТ снаружи комбо (новое основание/аргумент) —
// свои цвета, тот же приём ARG_COLOR_X/ARG_COLOR_Y, что уже используется
// в LOGWALK/LOGDIVWALK для однозначного отслеживания чисел глазом.
const OUTER_A_COLOR = GGEGE_PALETTE.teal.button
const OUTER_C_COLOR = GGEGE_PALETTE.raspberry.button
// Совпадающая ("комбо") часть — обводка и зачёркивание — оранжевый
// "смотри сюда/важно" из палитры ggege (см. CLAUDE.md), та же роль, что
// уже играет ATTENTION_COLOR в BlinkingExclaim и т.п.
const COMBO_COLOR = ATTENTION_COLOR

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

// ===== Общие строительные блоки (HTML+CSS, без KaTeX — та же причина,
// что и в LOGSUBWALK/LOGDIVWALK). =====

const NumSticker = ({ value, color, small = false }: { value: number | string; color: string; small?: boolean }) => (
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

// Опрашивает data-marker внутри containerRef на КАЖДОМ кадре, пока размер
// не перестанет меняться (2 кадра подряд с одинаковой шириной), и только
// тогда отдаёт финальный rect наружу — вместо гадания с фиксированной
// задержкой. Реальный баг, пойманный живьём: ChainExpression рисуется
// ВНУТРИ DiagramBlock (WalkthroughLog.tsx), у которого есть СВОЯ entrance-
// анимация `initial:{scale:0.94} → animate:{scale:1}` (350мс) —
// getBoundingClientRect() ВКЛЮЧАЕТ активный CSS-transform, и замер,
// сделанный ДО того, как этот scale-переход доиграет, ловил "combo"-
// маркер уменьшенным на те же ~6% (правый край овала обрезал "log₃").
// ResizeObserver эту разницу в принципе не ловит (transform не меняет
// layout-размер элемента), а фиксированный setTimeout — ненадёжен
// (нет гарантии, что 350мс где-либо реально означают 350мс, см. другие
// записи в CLAUDE.md про троттлинг таймеров в этом инструментарии) —
// поэтому вместо угаданного числа мс просто ЖДЁМ, пока значение
// действительно перестанет меняться. Одинаковая логика нужна и
// ComboCircle, и ComboStrike ниже — общий хук.
function useStableMarkerRect(containerRef: React.RefObject<HTMLDivElement | null>, marker: string) {
    const [rects, setRects] = useState<{ cRect: DOMRect; eRect: DOMRect } | null>(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        let rafId: number
        let frame = 0
        let prevWidth: number | null = null
        let stableCount = 0
        let cancelled = false

        const measureNow = () => {
            const el = container.querySelector<HTMLElement>(`[data-marker="${marker}"]`)
            if (!el) return null
            return { cRect: container.getBoundingClientRect(), eRect: el.getBoundingClientRect() }
        }

        const tick = () => {
            const el = container.querySelector<HTMLElement>(`[data-marker="${marker}"]`)
            if (el) {
                const eRect = el.getBoundingClientRect()
                const cRect = container.getBoundingClientRect()
                if (prevWidth !== null && Math.abs(eRect.width - prevWidth) < 0.5) {
                    stableCount++
                } else {
                    stableCount = 0
                }
                prevWidth = eRect.width
                // 2 стабильных кадра подряд ИЛИ подстраховка по числу
                // кадров (на случай, если размер по какой-то причине
                // никогда не "устаканится" до бита в бит одинакового
                // значения) — не блокировать рендер вечно.
                if (stableCount >= 2 || frame >= 180) {
                    setRects({ cRect, eRect })
                    return
                }
            }
            frame++
            rafId = requestAnimationFrame(tick)
        }
        rafId = requestAnimationFrame(tick)

        // Реальный баг, пойманный пользователем живьём: обводка "3 log₃"
        // рисовалась заметно левее реального текста, залезая на соседнюю
        // "2". Причина — веб-шрифт (Nunito) может подмениться (FOUT/FOIT)
        // УЖЕ ПОСЛЕ того, как ширина маркера успела "стабилизироваться" на
        // паре кадров подряд в ЕЩЁ fallback-шрифте (ложная стабильность —
        // stableCount ловит совпадение двух подряд идущих кадров, а не
        // истинную финальную геометрию). document.fonts.ready гарантированно
        // резолвится ПОСЛЕ применения всех шрифтов страницы — форсируем
        // свежий замер сразу после него, независимо от того, что ранняя
        // "стабильность" уже сработала.
        document.fonts?.ready?.then(() => {
            if (cancelled) return
            const fresh = measureNow()
            if (fresh) setRects(fresh)
        })

        // ResizeObserver — наблюдаем ЗА САМИМ МАРКЕРОМ, не только за
        // контейнером: контейнер — на всю ширину (w-full), его border-box
        // не меняется от того, что содержимое ВНУТРИ рефлоуится
        // (font-swap и т.п.), а маркер как раз и есть тот элемент, чья
        // ширина при этом реально меняется — раньше отслеживался только
        // контейнер, и такой сдвиг маркера ResizeObserver не ловил вовсе.
        const el = container.querySelector<HTMLElement>(`[data-marker="${marker}"]`)
        const observer = new ResizeObserver(() => {
            const fresh = measureNow()
            if (fresh) setRects(fresh)
        })
        if (el) observer.observe(el)
        observer.observe(container)

        return () => { cancelled = true; cancelAnimationFrame(rafId); observer.disconnect() }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return rects
}

// Обводка прямоугольником со скруглёнными углами вокруг data-marker'а —
// <motion.rect> с rx/ry, framer-motion умеет анимировать pathLength
// напрямую на примитивах rect/ellipse/circle, готовый path не нужен
// считать вручную. Раньше был овал — по прямой просьбе пользователя
// заменён на прямоугольник (точнее облегает прямоугольную область текста,
// овал слева/справа "срезал" её неточно).
const ComboCircle = ({
    containerRef, marker, color,
}: { containerRef: React.RefObject<HTMLDivElement | null>; marker: string; color: string }) => {
    const rects = useStableMarkerRect(containerRef, marker)
    if (!rects) return null
    const { cRect, eRect } = rects
    const padX = 10
    const padY = 8
    const box = {
        x: eRect.left - cRect.left - padX,
        y: eRect.top - cRect.top - padY,
        width: eRect.width + padX * 2,
        height: eRect.height + padY * 2,
    }
    return (
        <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible', width: '100%', height: '100%' }}>
            <motion.rect
                x={box.x}
                y={box.y}
                width={box.width}
                height={box.height}
                rx={14}
                ry={14}
                stroke={color}
                strokeWidth={3}
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.7, ease: 'easeInOut' }}
            />
        </svg>
    )
}

// Диагональная зачёркивающая линия поверх обведённой области — из
// ЛЕВОГО-ВЕРХНЕГО угла в ПРАВЫЙ-НИЖНИЙ (по прямой просьбе пользователя —
// раньше шла снизу-слева вверх-направо и цепляла соседние цифры сверху;
// такое направление ближе к "низу" области, не задевает текст выше).
// Измерение через useStableMarkerRect (надёжнее фиксированного таймаута —
// см. комментарий у самого хука выше).
const ComboStrike = ({
    containerRef, marker, color,
}: { containerRef: React.RefObject<HTMLDivElement | null>; marker: string; color: string }) => {
    const rects = useStableMarkerRect(containerRef, marker)
    if (!rects) return null
    const { cRect, eRect } = rects
    const pad = 10
    const x1 = eRect.left - cRect.left - pad
    const y1 = eRect.top - cRect.top - pad
    const x2 = eRect.right - cRect.left + pad
    const y2 = eRect.bottom - cRect.top + pad
    return (
        <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible', width: '100%', height: '100%' }}>
            <motion.line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={3.5}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.45, ease: 'easeInOut', delay: 0.2 }}
            />
        </svg>
    )
}

// Основная строка примера "log_a b · log_b c = ?" — один компонент на ВСЕ
// 4 диаграммных шага, различаются только stage:
// 'plain'   — просто условие, без акцентов (шаг 0).
// 'circled' — combo-часть (b · log_b) обведена овалом (шаг 1).
// 'struck'  — то же + горизонтальная зачёркивающая черта (шаг 2).
// 'faded'   — combo-часть приглушена (opacity), a/c снаружи — стикеры (шаг 3).
const ChainExpression = ({
    containerRef, stage,
}: { containerRef: React.RefObject<HTMLDivElement>; stage: 'plain' | 'circled' | 'struck' | 'faded' }) => (
    <div ref={containerRef} className="relative w-full flex items-center justify-center gap-2 flex-wrap text-2xl md:text-3xl font-extrabold py-2">
        <span className="inline-flex items-baseline whitespace-nowrap">
            <Plain>log</Plain>
            <sub className="ml-0.5">
                {stage === 'faded' ? <NumSticker value={EX.a} color={OUTER_A_COLOR} small /> : <Plain>{EX.a}</Plain>}
            </sub>
            <span
                data-marker="combo"
                className="inline-flex items-baseline ml-1 rounded transition-opacity duration-500"
                style={{ opacity: stage === 'faded' ? 0.32 : 1 }}
            >
                <Plain>{EX.b}</Plain>
                <Plain>&nbsp;·&nbsp;</Plain>
                <Plain>log</Plain>
                <sub className="ml-0.5"><Plain>{EX.b}</Plain></sub>
            </span>
            <span className="ml-1">
                {stage === 'faded' ? <NumSticker value={EX.c} color={OUTER_C_COLOR} small /> : <Plain>{EX.c}</Plain>}
            </span>
        </span>
        <Plain>=</Plain>
        <QuestionMark />
        {(stage === 'circled' || stage === 'struck') && (
            <ComboCircle containerRef={containerRef} marker="combo" color={COMBO_COLOR} />
        )}
        {stage === 'struck' && (
            <ComboStrike containerRef={containerRef} marker="combo" color={COMBO_COLOR} />
        )}
    </div>
)

// Финальная строка "Получилось: log₂4" — та же структура, что у
// ResultLine в LOGDIVWALK/LOGSUBWALK/LOGWALK.
const ResultLine = ({ onSettled }: { onSettled?: () => void }) => {
    const [typed, setTyped] = useState(false)
    return (
        <div className="w-full text-base md:text-lg text-[#F2F7FB] flex items-baseline gap-2 flex-wrap">
            {!typed ? (
                <Typewriter text="Получилось:" onDone={() => { setTyped(true); setTimeout(() => onSettled?.(), 400) }} />
            ) : (
                <>
                    <span>Получилось:</span>
                    <motion.span
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 16 }}
                        className="inline-flex items-baseline font-extrabold text-lg md:text-xl"
                        style={{ color: CORRECT_COLOR }}
                    >
                        log<sub className="ml-0.5">{EX.a}</sub><span className="ml-0.5">{EX.c}</span>
                    </motion.span>
                </>
            )}
        </div>
    )
}

// ===== Тренировочные задания — новые случайные (a, b, c) — нужно
// кликнуть верную формулу log_a(c) среди 4 вариантов. =====

type ComboOption = { base: number; arg: number }
type ComboTrial = { a: number; b: number; c: number; options: ComboOption[] }

const NUM_POOL = [2, 3, 4, 5, 6, 7, 8, 9] as const

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

const sameOption = (p: ComboOption, q: ComboOption) => p.base === q.base && p.arg === q.arg

// Дистракторы — правдоподобные ошибки школьника: (1) забыл про второй
// множитель, повторил только первый лог, (2) забыл про первый, повторил
// только второй, (3) перепутал местами основание/аргумент итога, (4)
// ошибся на 1 в аргументе верного ответа.
function makeOptions(a: number, b: number, c: number): ComboOption[] {
    const correct: ComboOption = { base: a, arg: c }
    const candidates: ComboOption[] = [
        { base: a, arg: b },
        { base: b, arg: c },
        { base: c, arg: a },
    ]
    const chosen: ComboOption[] = [correct]
    for (const cand of candidates) {
        if (!chosen.some((x) => sameOption(x, cand))) chosen.push(cand)
    }
    let extraShift = 1
    while (chosen.length < 4) {
        const extra: ComboOption = { base: a, arg: c + extraShift }
        if (!chosen.some((x) => sameOption(x, extra))) chosen.push(extra)
        extraShift++
    }
    return shuffle(chosen)
}

const makeTrial = (prev: ComboTrial | null): ComboTrial => {
    let t: ComboTrial
    let guard = 0
    do {
        const a = pick(NUM_POOL)
        let b = pick(NUM_POOL)
        while (b === a) b = pick(NUM_POOL)
        let c = pick(NUM_POOL)
        while (c === a || c === b) c = pick(NUM_POOL)
        t = { a, b, c, options: makeOptions(a, b, c) }
        guard++
    } while (prev && t.a === prev.a && t.b === prev.b && t.c === prev.c && guard < 8)
    return t
}

const makeTrials = (n: number): ComboTrial[] => {
    const out: ComboTrial[] = []
    let prev: ComboTrial | null = null
    for (let i = 0; i < n; i++) {
        const t = makeTrial(prev)
        out.push(t)
        prev = t
    }
    return out
}

const pickTrialFeedback = (t: ComboTrial): string => {
    const seed = t.a * 7 + t.b * 5 + t.c * 3
    return CORRECT_FEEDBACK_PHRASES[Math.abs(seed) % CORRECT_FEEDBACK_PHRASES.length]
}

// Продукт тренировочного задания — без обводки/зачёркивания, только числа.
const TrialProduct = ({ a, b, c }: { a: number; b: number; c: number }) => (
    <div className="w-full flex items-center justify-center gap-2 flex-wrap text-2xl md:text-3xl font-extrabold py-2">
        <span className="inline-flex items-baseline whitespace-nowrap">
            <Plain>log</Plain><sub className="ml-0.5"><Plain>{a}</Plain></sub>
            <span className="ml-1"><Plain>{b}</Plain></span>
        </span>
        <Plain>·</Plain>
        <span className="inline-flex items-baseline whitespace-nowrap">
            <Plain>log</Plain><sub className="ml-0.5"><Plain>{b}</Plain></sub>
            <span className="ml-1"><Plain>{c}</Plain></span>
        </span>
        <Plain>=</Plain>
        <QuestionMark />
    </div>
)

// Кнопка-вариант — компактная формула "log_base(arg)".
const MiniAnswerButton = ({
    option, onClick, disabled, state,
}: { option: ComboOption; onClick?: () => void; disabled?: boolean; state: 'idle' | 'correct' | 'wrong' }) => (
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
        <span className="inline-flex items-baseline whitespace-nowrap">
            log<sub className="ml-0.5">{option.base}</sub><span className="ml-0.5">{option.arg}</span>
        </span>
    </button>
)

export const TypeLogComboWalk = ({ onAnswer, onComplete }: Props) => {
    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
    const [hadMistake, setHadMistake] = useState(false)

    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)

    const [trials, setTrials] = useState<ComboTrial[]>(() => makeTrials(TRIAL_COUNT))
    const [trialIndex, setTrialIndex] = useState(0)
    const [checked, setChecked] = useState(false)
    // Режим "пробуй, пока не угадаешь" — неверно нажатые варианты ТЕКУЩЕГО
    // задания накапливаются здесь (красятся красным + блокируются), пока
    // пользователь не найдёт верный; сбрасывается при переходе к новому
    // заданию/откате назад. wrongFlash — сообщение под вариантами на
    // неверный клик; ПЕРСИСТЕНТНОЕ (не гаснет само по таймеру) — раньше
    // авто-скрывалось через WRONG_FLASH_MS и тут же подменялось обратно
    // нейтральной подсказкой "Кликни на вариант выше" в футере, что
    // читалось как "сообщение исчезло само" — по прямой просьбе
    // пользователя теперь остаётся на экране до следующего клика.
    const [wrongTried, setWrongTried] = useState<ComboOption[]>([])
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)

    const step0Ref = useRef<HTMLDivElement>(null)
    const step1Ref = useRef<HTMLDivElement>(null)
    const step2Ref = useRef<HTMLDivElement>(null)
    const step3Ref = useRef<HTMLDivElement>(null)

    const currentCorrectOption: ComboOption = { base: trials[trialIndex].a, arg: trials[trialIndex].c }

    const handleOptionClick = (option: ComboOption) => {
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
                {/* Шаг 0 — просто условие, без текста. */}
                <SceneWrapper key="step-0" innerRef={sceneRef('step-0')} active={isSceneActive('step-0')}>
                    <Fragment key={`step-0-${nonceFor('step-0')}`}>
                        <DiagramBlock onSettled={() => setStepReady(true)}>
                            <ChainExpression containerRef={step0Ref} stage="plain" />
                        </DiagramBlock>
                    </Fragment>
                </SceneWrapper>

                {/* Шаг 1 — "К-к-комбо!" — обводим совпадающую часть
                    (аргумент первого лога = основание второго). */}
                {step >= 1 && (
                    <SceneWrapper key="step-1" innerRef={sceneRef('step-1')} active={isSceneActive('step-1')}>
                        <Fragment key={`step-1-${nonceFor('step-1')}`}>
                            <DiagramBlock>
                                <ChainExpression containerRef={step1Ref} stage="circled" />
                            </DiagramBlock>
                            <TypedLine
                                className="w-full text-base md:text-lg text-[#F2F7FB]"
                                text="К-к-комбо! Если видим такую конструкцию — обводим совпадающую часть."
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 2 — вычёркиваем обведённое (совпало — сокращается). */}
                {step >= 2 && (
                    <SceneWrapper key="step-2" innerRef={sceneRef('step-2')} active={isSceneActive('step-2')}>
                        <Fragment key={`step-2-${nonceFor('step-2')}`}>
                            <DiagramBlock>
                                <ChainExpression containerRef={step2Ref} stage="struck" />
                            </DiagramBlock>
                            <TypedLine
                                className="w-full text-base md:text-lg text-[#F2F7FB]"
                                text="Аргумент первого и основание второго совпадают — значит, вычёркиваем их."
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 3 — вычеркнутое бледнеет, числа снаружи (2 и 4)
                    становятся стикерами. */}
                {step >= 3 && (
                    <SceneWrapper key="step-3" innerRef={sceneRef('step-3')} active={isSceneActive('step-3')}>
                        <Fragment key={`step-3-${nonceFor('step-3')}`}>
                            <DiagramBlock>
                                <ChainExpression containerRef={step3Ref} stage="faded" />
                            </DiagramBlock>
                            <TypedLine
                                className="w-full text-base md:text-lg text-[#F2F7FB]"
                                text="Осталось только снаружи — 2 и 4 — это и есть новый логарифм."
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 4 — итог: "Получилось: log₂4." */}
                {step >= 4 && (
                    <SceneWrapper key="step-4" innerRef={sceneRef('step-4')} active={isSceneActive('step-4')}>
                        <Fragment key={`step-4-${nonceFor('step-4')}`}>
                            <ResultLine onSettled={() => setStepReady(true)} />
                            <LocalAnswerConfetti />
                        </Fragment>
                    </SceneWrapper>
                )}

                {phase === 'practice' && Array.from({ length: trialIndex + 1 }).map((_, i) => {
                    const t = trials[i]
                    const isCurrent = i === trialIndex
                    const isDone = i < trialIndex || (isCurrent && checked)
                    const correctOption: ComboOption = { base: t.a, arg: t.c }
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
                                <TrialProduct a={t.a} b={t.b} c={t.c} />
                            </DiagramBlock>
                            {isCurrent && !checked && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        {t.options.map((opt, oi) => {
                                            const isWrongTriedOpt = wrongTried.some((w) => sameOption(w, opt))
                                            return (
                                                <MiniAnswerButton
                                                    key={oi}
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
                                            const isCorrectOpt = sameOption(opt, correctOption)
                                            const isWrongTriedOpt = isCurrent && wrongTried.some((w) => sameOption(w, opt))
                                            return (
                                                <MiniAnswerButton
                                                    key={oi}
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
