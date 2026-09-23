// app/t-lesson/[t_lessonId]/type-sinwalk.tsx
//
// Тип SINWALK — интерактивный разбор по шагам "что такое синус угла"
// (тренажёр "Геометрия: Синус, косинус, тангенс", урок ПЕРЕД остальными
// этапами темы). Тот же "накопительный лог" (WalkthroughLog.tsx) и та же
// философия самодостаточного типа, что уже у MULTISTEP/FRACTRICK —
// компонент сам ведёт свою внутреннюю хореографию и зовёт onComplete
// РОВНО один раз в конце; общая нижняя кнопка (components/trainer-
// question.tsx) в это время задизейблена (answerState остаётся
// "pending", пока onComplete не сработает — см. handleMultistepComplete),
// а по факту завершения превращается в обычное "далее"/"ответить".
//
// Сюжет — прямая инструкция пользователя, по шагам:
// 1. Рисуем прямоугольный треугольник, пауза.
// 2. Прямой угол (bounce), стрелка к гипотенузе, подпись "гипотенуза".
// 3. Выбираем один из острых углов, bounce-появление "α".
// 4. Стрелка от α к противолежащему катету (сторона, НЕ касающаяся α),
//    подпись "противолежащий катет".
// 5. Несколько тренировочных заданий — треугольник каждый раз в НОВОМ
//    повороте/зеркале/с новым выбором α, нужно кликнуть по
//    противолежащему катету на самом чертеже (не по кнопкам-вариантам).
//
// Обучающие кадры (rotationDeg=0, фиксированная ориентация) — длинные
// подписи "гипотенуза"/"противолежащий катет" читаемы только без
// поворота (см. комментарий в RightTriangleDiagram.tsx). Тренировочные
// кадры вращаются свободно — там подписывается только короткая "α".

'use client'

import { Fragment, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import type { QuestionType } from './page'
import {
    RightTriangleDiagram, oppositeLegOf,
    HYPOTENUSE_COLOR, LEG_COLOR, ADJACENT_LEG_COLOR,
    ZOOM_TOTAL_S, PAN_TOTAL_S, SIDE_DRAW_DURATION,
    type AlphaVertex, type SideId,
} from '@/components/geometry/RightTriangleDiagram'
import { Typewriter } from '@/components/geometry/Typewriter'
import { MARKER_COLOR, MARKER_COLOR_GREEN } from '@/components/geometry/WalkthroughMarker'
import {
    TypedLine, TypedKeyPhraseLine, DiagramBlock, pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    isFieryMilestoneTrial, FieryFeedbackBanner,
} from '@/components/geometry/WalkthroughLog'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'

// Пауза ПОСЛЕ клика "Дальше", ДО начала новой анимации следующей сцены
// (зума, дорисовки стороны и т.п.) — по прямой просьбе пользователя,
// чтобы глаз успевал заметить "это новая сцена", а не воспринимал переход
// как непрерывное продолжение предыдущей.
const SCENE_TRANSITION_PAUSE_MS = 1000

// Пауза МЕЖДУ окончанием СОБСТВЕННОЙ анимации диаграммы этого шага (зум-
// цикл/дорисовка стороны+bounce подписи) и появлением печатаемого текста
// ниже — по прямой просьбе пользователя ("сначала анимация, потом пауза,
// потом текст"), а не одновременно, как раньше. Тот же порядок величины,
// что и SCENE_TRANSITION_PAUSE_MS выше.
const DIAGRAM_TO_TEXT_PAUSE_MS = 900

// Момент, когда СОБСТВЕННАЯ анимация диаграммы каждого из шагов 2-4
// полностью устаканивается (не только когда элемент появляется, а когда
// ВЕСЬ цикл — включая zoom-аут — закончился, см. CLAUDE.md "если шаг
// сопровождается zoom-эффектом... любые подписи должны ждать, пока
// зум-цикл ПОЛНОСТЬЮ завершится"):
// — шаг 2 (гипотенуза, без zoomFocus) — линия дорисовывается
//   SIDE_DRAW_DURATION, подпись начинает bounce-появляться сразу после
//   (delay=SIDE_DRAW_DURATION) и сама занимает ~0.6с (spring) — общий
//   запас с небольшим буфером.
const STEP2_SETTLE_MS = (SIDE_DRAW_DURATION + 0.6) * 1000
// — шаг 3 (угол α, zoomFocus="alpha") — полный зум-цикл ZOOM_TOTAL_S.
const STEP3_SETTLE_MS = ZOOM_TOTAL_S * 1000
// — шаг 4 (противолежащий катет, zoomFocus="alphaToOppositeLeg") —
//   полный цикл панорамы PAN_TOTAL_S.
const STEP4_SETTLE_MS = PAN_TOTAL_S * 1000

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
    // Админская "карта сцен" справа — по прямой просьбе пользователя,
    // чтобы при тестировании не прощёлкивать весь урок заново, а прыгать
    // сразу в любую сцену (см. jumpToScene ниже). Обычные ученики её не
    // видят — гейтится реальным серверным userProgress.isAdmin, не
    // клиентским предположением.
    isAdmin?: boolean
}

// НАЧАЛЬНОЕ число заданий практики — реальное число может вырасти по
// ходу прохождения (см. handleNextTrial/"работа над ошибками" ниже), для
// проверки текущего общего количества использовать trialConfigs.length,
// не эту константу.
const TRIAL_COUNT = 4
// 0° сознательно исключён — это уже показанная обучающая ориентация,
// тренировка должна выглядеть заметно "новой" с первого же задания.
const ROTATIONS = [35, -35, 55, -55, 75, -75, 110, -110, 140, -140, 160, -160]

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

type TrialConfig = { rotationDeg: number; mirror: boolean; alphaVertex: AlphaVertex }

// Похвала за верный ответ — ВЫБРАНА ДЕТЕРМИНИРОВАННО из уже случайных
// (но стабильных на весь заход в урок) полей самого задания, а НЕ через
// Math.random()/useMemo прямо в JSX внутри .map() — вызов хуков внутри
// цикла .map() нарушил бы Rules of Hooks (число вызовов росло бы вместе
// с trialConfigs), а обычный Math.random() в теле рендера давал бы НОВУЮ
// фразу на каждый лишний ре-рендер, а не одну стабильную на задание.
const pickTrialFeedback = (cfg: TrialConfig): string => {
    const seed = cfg.rotationDeg * 3 + (cfg.mirror ? 17 : 0) + (cfg.alphaVertex === 'P' ? 5 : 0)
    return CORRECT_FEEDBACK_PHRASES[Math.abs(seed) % CORRECT_FEEDBACK_PHRASES.length]
}

const makeTrialConfigs = (n: number): TrialConfig[] => {
    const configs: TrialConfig[] = []
    let lastRotation: number | null = null
    for (let i = 0; i < n; i++) {
        let rotationDeg = pick(ROTATIONS)
        let guard = 0
        while (rotationDeg === lastRotation && guard < 6) {
            rotationDeg = pick(ROTATIONS)
            guard++
        }
        lastRotation = rotationDeg
        configs.push({ rotationDeg, mirror: Math.random() < 0.5, alphaVertex: Math.random() < 0.5 ? 'P' : 'Q' })
    }
    return configs
}

// Число шагов обучающей части — по прямой просьбе пользователя шаги
// больше НЕ проигрываются каскадом сами по себе: каждый требует явного
// клика "Дальше", чтобы дать время рассмотреть рисунок, прежде чем идти
// дальше (см. handleIntroNext).
const INTRO_STEPS = 5

// Число сцен "adjacent"-фазы (после тренировки) — по прямой просьбе
// пользователя: adj-0 напоминает уже известный "противолежащий катет" на
// полной картинке, adj-1 вводит "прилежащий катет". Настоящее завершение
// урока (onComplete/onAnswer) теперь происходит ЗДЕСЬ, не в конце
// практики — см. handleAdjacentNext/handleNextTrial ниже.
const ADJACENT_STEPS = 2

// Шаг 2 (гипотенуза) — диаграмма монтируется и проигрывает СВОЮ анимацию
// (дорисовка стороны + bounce подписи) сама по себе; текст появляется
// ТОЛЬКО после того, как она устоялась + доп. пауза (по прямой просьбе
// пользователя — не одновременно с анимацией).
const Step2Scene = ({ onSettled }: { onSettled?: () => void }) => {
    const [textVisible, setTextVisible] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setTextVisible(true), STEP2_SETTLE_MS + DIAGRAM_TO_TEXT_PAUSE_MS)
        return () => clearTimeout(t)
    }, [])
    return (
        <>
            <DiagramBlock>
                <RightTriangleDiagram compact rightAngleMarkShown legsLabelShown hypotenuseHighlighted hypotenuseLabelShown />
            </DiagramBlock>
            {textVisible && (
                <TypedKeyPhraseLine
                    before="Сторона напротив прямого угла — самая длинная сторона треугольника. Она называется "
                    phrase="гипотенуза"
                    color={HYPOTENUSE_COLOR}
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

// Шаг 3 (угол α) — та же логика: ждём полный zoom-цикл диаграммы
// (STEP3_SETTLE_MS = ZOOM_TOTAL_S), потом паузу, потом текст.
const Step3Scene = ({ onSettled }: { onSettled?: () => void }) => {
    const [textVisible, setTextVisible] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setTextVisible(true), STEP3_SETTLE_MS + DIAGRAM_TO_TEXT_PAUSE_MS)
        return () => clearTimeout(t)
    }, [])
    return (
        <>
            <DiagramBlock>
                <RightTriangleDiagram compact rightAngleMarkShown legsLabelShown hypotenuseHighlighted hypotenuseLabelShown alphaVertex="P" zoomFocus="alpha" />
            </DiagramBlock>
            {textVisible && (
                <TypedLine
                    className="w-full text-base md:text-lg text-[#F2F7FB]"
                    text="Теперь выберем один из двух других углов — назовём его α (альфа)."
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

// Шаг 4 (противолежащий катет) — ждём полный цикл панорамы диаграммы
// (STEP4_SETTLE_MS = PAN_TOTAL_S), потом паузу, потом текст.
const Step4Scene = ({ onSettled }: { onSettled?: () => void }) => {
    const [textVisible, setTextVisible] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setTextVisible(true), STEP4_SETTLE_MS + DIAGRAM_TO_TEXT_PAUSE_MS)
        return () => clearTimeout(t)
    }, [])
    return (
        <>
            <DiagramBlock>
                <RightTriangleDiagram
                    compact rightAngleMarkShown legsLabelShown hypotenuseHighlighted hypotenuseLabelShown alphaVertex="P" zoomFocus="alphaToOppositeLeg"
                    oppositeLegHighlighted oppositeLegLabelShown
                />
            </DiagramBlock>
            {textVisible && (
                <TypedKeyPhraseLine
                    before="Катет напротив угла α называется "
                    phrase="противолежащий катет"
                    color={LEG_COLOR}
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

// ===== Боксовый стикер для слова "прилежащий" — тот же визуальный язык,
// что уже устоялся в LOG*WALK-разборах (Sticker/TypedLineWithSticker) —
// локальная копия, общего экспорта этих утилит нет (каждый *WALK-файл
// несёт свою). =====
const Sticker = ({ value, color }: { value: React.ReactNode; color: string }) => (
    <motion.span
        initial={{ scale: 2.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15 }}
        className="inline-flex items-center justify-center rounded-lg border-2 font-extrabold align-middle px-1.5 py-0.5 leading-none"
        style={{ borderColor: color, backgroundColor: hexToRgba(color, 0.18), color }}
    >
        {value}
    </motion.span>
)

// Печатаемая строка с ОДНИМ встроенным стикером-словом — Typewriter
// печатает ПЛОСКИЙ текст (без разметки), а по завершении печати (onTyped
// — РОВНО в этот момент, не после доп. паузы) заменяется на размеченную
// версию со стикером. onTyped отдельно от onSettled (которая срабатывает
// на 450мс позже) — по прямой просьбе пользователя диаграмма должна
// поменяться "в этот момент", т.е. синхронно с появлением стикера, а не
// с задержкой, которая используется для продвижения общего флоу.
const TypedLineWithSticker = ({
    before, stickerContent, plainTextForTyping, stickerColor, after = '', onTyped, onSettled,
}: {
    before: string; stickerContent: React.ReactNode; plainTextForTyping: string; stickerColor: string; after?: string; onTyped?: () => void; onSettled?: () => void
}) => {
    const [typed, setTyped] = useState(false)
    return (
        <div className="w-full text-base md:text-lg text-[#F2F7FB]">
            {!typed ? (
                <Typewriter
                    text={`${before}${plainTextForTyping}${after}`}
                    onDone={() => { setTyped(true); onTyped?.(); setTimeout(() => onSettled?.(), 450) }}
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

// Шаг "adj-0" (recap, после тренировки) — та же картинка, что уже
// установлена в Step4Scene (противолежащий катет уже подписан), БЕЗ
// zoomFocus — это напоминание уже известного факта, не первое знакомство,
// камере незачем ехать. Текст ждёт устаканивания собственной анимации
// диаграммы (линии+bounce подписей — та же STEP2_SETTLE_MS, что и у
// гипотенузы, поскольку и гипотенуза, и противолежащий катет рисуются с
// тем же SIDE_DRAW_DURATION, просто теперь оба сразу, не по очереди).
const AdjacentRecapScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [textVisible, setTextVisible] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setTextVisible(true), STEP2_SETTLE_MS + DIAGRAM_TO_TEXT_PAUSE_MS)
        return () => clearTimeout(t)
    }, [])
    return (
        <>
            <DiagramBlock>
                <RightTriangleDiagram
                    compact rightAngleMarkShown legsLabelShown hypotenuseHighlighted hypotenuseLabelShown
                    alphaVertex="P" oppositeLegHighlighted oppositeLegLabelShown
                />
            </DiagramBlock>
            {textVisible && (
                <TypedKeyPhraseLine
                    before="Катет напротив угла α называется "
                    phrase="противолежащий катет"
                    color={LEG_COLOR}
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

// Шаг "adj-1" — второй катет (рядом с α, "нижний" на этой диаграмме —
// R-P) получает своё название. Диаграмма показывает его СНАЧАЛА обычным
// зелёным "катет" (как и раньше), а ровно В МОМЕНТ, когда слово
// "прилежащий" в тексте допечатывается и превращается в стикер (onTyped,
// см. TypedLineWithSticker выше) — катет подсвечивается и
// переименовывается в "прилежащий катет" (тот же "стандарт подсветки
// стороны", что уже используется для противолежащего катета: толстая
// цветная линия поверх базовой + 2-строчная подпись).
const AdjacentSwapScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [swapped, setSwapped] = useState(false)
    return (
        <>
            <DiagramBlock>
                <RightTriangleDiagram
                    compact rightAngleMarkShown legsLabelShown hypotenuseHighlighted hypotenuseLabelShown
                    alphaVertex="P" oppositeLegHighlighted oppositeLegLabelShown
                    adjacentLegHighlighted={swapped} adjacentLegLabelShown={swapped}
                />
            </DiagramBlock>
            <TypedLineWithSticker
                before="Катет рядом с углом α называется "
                plainTextForTyping="прилежащий"
                stickerContent="прилежащий"
                stickerColor={ADJACENT_LEG_COLOR}
                after="."
                onTyped={() => setSwapped(true)}
                onSettled={onSettled}
            />
        </>
    )
}

export const TypeSinWalk = ({ onAnswer, onComplete, isAdmin = false }: Props) => {
    const [phase, setPhase] = useState<'intro' | 'practice' | 'adjacent'>('intro')
    const [hadMistake, setHadMistake] = useState(false)

    // "adjacent"-фаза (2 сцены ПОСЛЕ тренировки, см. ADJACENT_STEPS выше)
    // — та же схема, что и у обучающего step/stepReady/introNextLabel
    // ниже, только под свою фазу: adjStep продвигается ТОЛЬКО по клику
    // "Дальше", adjStepReady включается, когда сцена доиграла (текст
    // допечатан).
    const [adjStep, setAdjStep] = useState(0)
    const [adjStepReady, setAdjStepReady] = useState(false)

    // Текущий обучающий шаг (0..INTRO_STEPS-1) — продвигается ТОЛЬКО по
    // клику "Дальше"; stepReady включается, когда печать текста текущего
    // шага завершилась (кнопка до этого задизейблена — нечего листать
    // дальше, пока текст ещё печатается).
    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    // true между кликом "Дальше" и фактическим применением следующего шага
    // (см. SCENE_TRANSITION_PAUSE_MS) — блокирует повторный клик во время
    // паузы и держит экран неизменным, прежде чем начнётся новая сцена.
    const [advancing, setAdvancing] = useState(false)
    const [trialConfigs, setTrialConfigs] = useState<TrialConfig[]>(() => makeTrialConfigs(TRIAL_COUNT))
    const [trialIndex, setTrialIndex] = useState(0)
    const [checked, setChecked] = useState(false)
    // Режим "пробуй, пока не угадаешь" (та же механика, что и у
    // LOGCOMBOWALK/LOGDEFWALK) — неверно нажатые стороны ТЕКУЩЕГО задания
    // накапливаются здесь (красятся красным и перестают быть кликабельны,
    // см. RightTriangleDiagram.wrongSides), пока пользователь не найдёт
    // верную; сбрасывается при переходе к новому заданию/откате назад.
    // wrongFlash — ПЕРСИСТЕНТНОЕ сообщение под диаграммой на неверный
    // клик (не гаснет по таймеру, остаётся до следующего клика).
    const [wrongTried, setWrongTried] = useState<SideId[]>([])
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)

    // Счётчики "повторов" — ОТДЕЛЬНЫЙ nonce на каждый шаг/задание
    // ('step-0'..'step-4', 'trial-0'..'trial-3'), а не один общий на всё
    // (см. useReplayNonces в WalkthroughLog.tsx — тот же общий хук теперь
    // используют и кнопка "Повторить", и полный откат "назад", обоим
    // нужно ПЕРЕМОНТИРОВАТЬ содержимое сцены, чтобы анимация проигралась
    // заново). Это важно: если бы nonce был один общий и входил в key
    // каждого блока БЕЗУСЛОВНО, клик "повторить" на шаге 3 пересоздавал
    // бы (и заново печатал текст) ВСЕ уже пройденные шаги 0-2 тоже —
    // реальный баг, пойманный пользователем живьём ("почему в предыдущей
    // сцене снова проигрывается анимация текста"). Причина была именно в
    // ФОРМАТЕ key: раньше он переключался между `step1-${nonce}` (пока
    // шаг активен) и просто `step1` (как только шаг становится пройден)
    // — а любая смена ФОРМАТА key — это уже смена key для React, даже
    // если nonce не менялся, поэтому переход НА следующий шаг сам по
    // себе пересоздавал/перепечатывал предыдущий. Теперь key каждого
    // блока — ВСЕГДА один и тот же формат `step-N-${nonce}`, не зависит
    // от того, активен шаг сейчас или уже пройден — он не меняется просто
    // от перехода дальше, только от явного клика "повторить"/"назад"
    // ИМЕННО на этом шаге.
    const { bump: bumpNonce, nonceFor: replayNonceFor } = useReplayNonces()
    const currentReplayKey = phase === 'intro' ? `step-${step}` : phase === 'practice' ? `trial-${trialIndex}` : `adj-${adjStep}`
    const handleReplay = () => bumpNonce(currentReplayKey)

    const currentCorrectSide = oppositeLegOf(trialConfigs[trialIndex].alphaVertex)

    const handleSideClick = (side: SideId) => {
        if (checked) return
        if (wrongTried.includes(side)) return
        if (side === currentCorrectSide) {
            setChecked(true)
            setTrialNextLabel(pickWalkthroughNextLabel('Дальше'))
        } else {
            setHadMistake(true)
            setWrongTried((prev) => [...prev, side])
            setWrongFlash(pickWrongTryPhrase())
        }
    }

    const handleNextTrial = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            const isLastInList = trialIndex + 1 >= trialConfigs.length
            if (isLastInList) {
                // Урок больше НЕ заканчивается здесь — по прямой просьбе
                // пользователя после тренировки идут ещё 2 сцены (adjacent
                // фаза, см. ADJACENT_STEPS) про прилежащий катет; настоящее
                // завершение (onComplete/onAnswer) теперь в
                // handleAdjacentNext ниже.
                setAdvancing(false)
                setPhase('adjacent')
                return
            }
            setTrialIndex((i) => i + 1)
            setChecked(false)
            setWrongTried([])
            setWrongFlash(null)
            setAdvancing(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }

    // Клик "Дальше"/"Готово" в adjacent-фазе — тот же паттерн паузы, что и
    // у handleIntroNext/handleNextTrial. На последней сцене (adjStep+1 >=
    // ADJACENT_STEPS) — настоящее завершение урока: onComplete красит
    // маскота/локальный статус ВНУТРИ trainer-question.tsx, onAnswer —
    // реальный переход дальше в TQUIZ.tsx (та же пара вызовов, что раньше
    // была в конце практики, просто теперь после ещё двух сцен).
    const handleAdjacentNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            if (adjStep + 1 >= ADJACENT_STEPS) {
                setAdvancing(false)
                const isFullyCorrect = !hadMistake
                onComplete(isFullyCorrect)
                onAnswer(isFullyCorrect ? 'right' : 'wrong')
                return
            }
            setAdjStep((s) => s + 1)
            setAdjStepReady(false)
            setAdvancing(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }

    // Клик "Дальше" в обучающей части — единственный способ продвинуться
    // (никакого автопроигрыша). На последнем шаге переводит в практику.
    // Пауза (advancing) — ДО применения следующего шага, чтобы новая
    // сцена (например zoom-эффект) не начиналась вплотную к клику.
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

    // Подпись кнопки "Дальше" — иногда варьируется (см. WALKTHROUGH_NEXT_
    // PHRASES); пересчитывается на каждый НОВЫЙ шаг/задание, а не на любой
    // ре-рендер, иначе текст менялся бы "на лету" под уже видимой кнопкой.
    // Случайный выбор — ТОЛЬКО после монтирования (useEffect), не в самом
    // рендере/useMemo: тот выполняется и при SSR, и при первом клиентском
    // рендере независимо — Math.random() даёт разные значения на сервере
    // и клиенте и ломает гидратацию (тот же класс бага, что уже не раз
    // документирован в CLAUDE.md для случайного текста, видимого в SSR-HTML).
    // trialNextLabel выставляется ПРЯМО в handleSideClick, не эффектом на
    // trialIndex — раз "Дальше" появляется только ПОСЛЕ верного клика
    // (режим "пробуй, пока не угадаешь"), тон всегда поздравительный.
    const [introNextLabel, setIntroNextLabel] = useState('Дальше')
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    const [adjNextLabel, setAdjNextLabel] = useState('Дальше')
    useEffect(() => { setIntroNextLabel(pickWalkthroughNextLabel('Дальше')) }, [step])
    useEffect(() => { setAdjNextLabel(pickWalkthroughNextLabel('Дальше')) }, [adjStep])

    // Затемнение прошлых сцен + автоскролл к новой (см. useSceneFocus в
    // WalkthroughLog.tsx) — ключи сцен СТАБИЛЬНЫЕ (`step-N`/`trial-N`, без
    // replayNonce), иначе клик "Повторить" сбрасывал бы ref.
    const latestSceneKey = phase === 'intro' ? `step-${step}` : phase === 'practice' ? `trial-${trialIndex}` : `adj-${adjStep}`
    const prevSceneKeyOf = (key: string): string | null => {
        if (key.startsWith('adj-')) {
            const idx = Number(key.slice('adj-'.length))
            return idx > 0 ? `adj-${idx - 1}` : `trial-${trialConfigs.length - 1}`
        }
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
    const contentSettled = phase === 'intro' ? stepReady : phase === 'practice' ? checked : adjStepReady
    // topPaddingVh=6 (было 22 по умолчанию) — по прямой просьбе пользователя
    // "рисовать треугольник выше": шаг 0 (голый треугольник, compact
    // viewBox, см. RightTriangleDiagram.compact) — короткая сцена, и
    // стандартные 22vh пустого места перед ней оставляли слишком большой
    // отступ сверху. Остальные шаги/тренировка по-прежнему центрируются
    // тем же скроллом (см. delta в useSceneFocus) — уменьшился только
    // стартовый ЗАПАС места, а не сама логика центрирования.
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, contentSettled, 6)
    const canGoBack = prevSceneKeyOf(latestSceneKey) !== null

    // "Назад" — по прямой просьбе пользователя (2026-09-19) РЕАЛЬНЫЙ откат
    // на предыдущую сцену (не просто "полистать взглядом"): состояние
    // step/trialIndex/phase откатывается на target, answer этой сцены
    // сбрасывается (можно ответить заново), nonce цели бампается (её
    // содержимое ПЕРЕМОНТИРУЕТСЯ — Typewriter/DiagramBlock/подсветка
    // стороны проигрываются заново). Сцены ПОСЛЕ target (в т.ч. та, с
    // которой кликнули "назад") сами исчезают из DOM — рендер-условие
    // `step >= i`/`trialIndex+1` уже не покрывает их, отдельно "стирать"
    // ничего не нужно.
    // Применить состояние ЛЮБОЙ сцены по её ключу — общая точка для
    // "назад" (откат на СОСЕДНЮЮ предыдущую) и админской карты сцен
    // (прыжок в ПРОИЗВОЛЬНУЮ, не обязательно соседнюю, см. ниже) — раньше
    // это было только внутри handleBack, здесь вынесено, чтобы не
    // дублировать те же 3 ветки применения состояния дважды.
    const jumpToScene = (target: string) => {
        if (advancing) return
        bumpNonce(target)
        if (target.startsWith('adj-')) {
            const idx = Number(target.slice('adj-'.length))
            setPhase('adjacent')
            setAdjStep(idx)
            setAdjStepReady(false)
        } else if (target.startsWith('trial-')) {
            const idx = Number(target.slice('trial-'.length))
            setPhase('practice')
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

    const handleBack = () => {
        const target = prevSceneKeyOf(latestSceneKey)
        if (!target) return
        jumpToScene(target)
    }

    // ===== Админская "карта сцен" (справа от урока) — по прямой просьбе
    // пользователя: при тестировании не прощёлкивать урок с нуля, а
    // прыгнуть сразу в нужную сцену. Полный список ключей в ПОРЯДКЕ
    // прохождения — те же ключи, что использует latestSceneKey/
    // prevSceneKeyOf выше, просто перечислены все разом, а не только
    // "предыдущий". trialConfigs.length (не TRIAL_COUNT) — на случай,
    // если реальное число тренировочных заданий когда-нибудь начнёт
    // отличаться от начального.
    const allSceneKeys = [
        ...Array.from({ length: INTRO_STEPS }, (_, i) => `step-${i}`),
        ...Array.from({ length: trialConfigs.length }, (_, i) => `trial-${i}`),
        ...Array.from({ length: ADJACENT_STEPS }, (_, i) => `adj-${i}`),
    ]
    const STEP_LABELS = ['Треугольник', 'Прямой угол', 'Гипотенуза', 'Угол α', 'Противолежащий катет']
    const ADJ_LABELS = ['Recap: противолежащий катет', 'Прилежащий катет']
    const sceneLabel = (key: string): string => {
        if (key.startsWith('step-')) return STEP_LABELS[Number(key.slice('step-'.length))] ?? key
        if (key.startsWith('trial-')) return `Тренировка ${Number(key.slice('trial-'.length)) + 1}`
        if (key.startsWith('adj-')) return ADJ_LABELS[Number(key.slice('adj-'.length))] ?? key
        return key
    }
    const sceneDotColor = (key: string): string =>
        key.startsWith('adj-') ? ADJACENT_LEG_COLOR : key.startsWith('trial-') ? GGEGE_PALETTE.blue.button : '#8B98A1'

    return (
        <div className={`w-full mx-auto flex flex-row items-start gap-3 ${isAdmin ? 'max-w-[46rem]' : 'max-w-2xl'}`}>
        <div className="min-w-0 flex-1 flex flex-col items-center gap-4">
            <div className="w-full flex flex-col gap-4">
                {/* Шаг 0 — просто треугольник. Заголовок вопроса ("Что такое
                    синус угла?") здесь НЕ дублируется — его уже показывает
                    облако маскота над карточкой (TrainerMascot.taskMessage),
                    свой <h2> с тем же текстом раньше был лишним повтором. */}
                <SceneWrapper key="step-0" innerRef={sceneRef('step-0')} active={isSceneActive('step-0')}>
                    <Fragment key={`step-0-${replayNonceFor('step-0')}`}>
                        {/* compact — узкий viewBox без запаса под произвольный
                            поворот (тут его и не будет — просто голый
                            треугольник, никакого zoomFocus/вращения), по
                            прямой просьбе пользователя убрать огромный
                            пустой отступ сверху/снизу на самой первой сцене. */}
                        <DiagramBlock><RightTriangleDiagram compact /></DiagramBlock>
                        <TypedLine
                            className="w-full text-base md:text-lg text-[#F2F7FB]"
                            text="Это прямоугольный треугольник — у него есть прямой угол."
                            onSettled={() => setStepReady(true)}
                        />
                    </Fragment>
                </SceneWrapper>

                {/* Шаг 1 — появляется маркер прямого угла (с zoom-эффектом
                    "смотри сюда" — камера ненадолго приближается к углу,
                    рисует маркер, затем ПОЛНОСТЬЮ отдаляется обратно — и
                    только ПОСЛЕ этого, поочерёдно, а не одновременно с
                    зум-аутом, появляются зелёные подписи "катет" на обеих
                    сторонах, см. RightTriangleDiagram). Слово "катетами" в
                    тексте ниже — просто жирным зелёным (без текстовыделителя,
                    по прямой просьбе пользователя убрать этот эффект). */}
                {step >= 1 && (
                    <SceneWrapper key="step-1" innerRef={sceneRef('step-1')} active={isSceneActive('step-1')}>
                        <Fragment key={`step-1-${replayNonceFor('step-1')}`}>
                            <DiagramBlock><RightTriangleDiagram compact rightAngleMarkShown legsLabelShown zoomFocus="rightAngle" /></DiagramBlock>
                            <TypedKeyPhraseLine
                                before="Вот он — прямой угол между двумя "
                                phrase="катетами"
                                after=" треугольника."
                                color={MARKER_COLOR_GREEN}
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 2 — гипотенуза (ключевая фраза, подпись вдоль стороны).
                    Текст ждёт, пока диаграмма сама себя доиграет (Step2Scene). */}
                {step >= 2 && (
                    <SceneWrapper key="step-2" innerRef={sceneRef('step-2')} active={isSceneActive('step-2')}>
                        <Fragment key={`step-2-${replayNonceFor('step-2')}`}>
                            <Step2Scene onSettled={() => setStepReady(true)} />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 3 — выбираем угол α (тоже с zoom-эффектом на саму
                    вершину, где рисуется дуга угла) — текст ждёт полного
                    zoom-цикла (Step3Scene). */}
                {step >= 3 && (
                    <SceneWrapper key="step-3" innerRef={sceneRef('step-3')} active={isSceneActive('step-3')}>
                        <Fragment key={`step-3-${replayNonceFor('step-3')}`}>
                            <Step3Scene onSettled={() => setStepReady(true)} />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 4 — противолежащий катет. Камера панорамирует от α к
                    самому катету (zoomFocus="alphaToOppositeLeg"); в момент
                    прибытия зелёная подпись "катет" на этой стороне
                    сменяется на "противолежащий катет" — В ТОМ ЖЕ зелёном
                    формате (без золотого/мигающего акцента, по прямой
                    просьбе пользователя убрать этот эффект). Текст ждёт
                    полного цикла панорамы (Step4Scene). */}
                {step >= 4 && (
                    <SceneWrapper key="step-4" innerRef={sceneRef('step-4')} active={isSceneActive('step-4')}>
                        <Fragment key={`step-4-${replayNonceFor('step-4')}`}>
                            <Step4Scene onSettled={() => setStepReady(true)} />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* (phase === 'practice' || 'adjacent') — не только
                    'practice': как только фаза переходит в 'adjacent'
                    (тренировка пройдена), уже показанные задания НЕ должны
                    исчезать из DOM (тот же принцип "накопительного лога",
                    что и у шагов 0-4 выше, которые вообще не проверяют
                    phase) — просто тускнеют, как и остальные пройденные
                    сцены. */}
                {(phase === 'practice' || phase === 'adjacent') && Array.from({ length: trialIndex + 1 }).map((_, i) => {
                    const cfg = trialConfigs[i]
                    const isCurrent = i === trialIndex
                    const isDone = i < trialIndex || (isCurrent && checked)
                    const correctSide = oppositeLegOf(cfg.alphaVertex)
                    return (
                        <SceneWrapper key={`trial-${i}`} innerRef={sceneRef(`trial-${i}`)} active={isSceneActive(`trial-${i}`)}>
                        <div key={`trial-${i}-${replayNonceFor(`trial-${i}`)}`} className="w-full flex flex-col gap-3">
                            {/* "N из M" — отдельная цветная плашка (не часть
                                печатаемого текста); сама фраза-задание
                                упрощена по прямой просьбе пользователя
                                ("Выбери противолежащий катет к углу α —
                                кликни по стороне треугольника" → просто
                                "Кликни по противолежащему катету"), слово
                                "противолежащему" выделено текстовыделителем
                                — чтобы сразу было понятно, что искать. */}
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
                                    <span>{trialConfigs.length}</span>
                                </div>
                                <TypedKeyPhraseLine
                                    className="flex-1 text-base md:text-lg text-[#F2F7FB]"
                                    before="Кликни по "
                                    phrase="противолежащему"
                                    after=" катету."
                                    color={MARKER_COLOR}
                                    highlight
                                />
                            </div>
                            <DiagramBlock>
                                <RightTriangleDiagram
                                    rotationDeg={cfg.rotationDeg}
                                    mirror={cfg.mirror}
                                    rightAngleMarkShown
                                    alphaVertex={cfg.alphaVertex}
                                    interactive={isCurrent && !checked}
                                    onSideClick={isCurrent ? handleSideClick : undefined}
                                    wrongSides={isCurrent ? wrongTried : []}
                                    correctSide={correctSide}
                                    checked={isDone}
                                />
                            </DiagramBlock>
                            {/* Режим "пробуй, пока не угадаешь" — неверный
                                клик красит сторону красным и блокирует её
                                (см. RightTriangleDiagram.wrongSides), но НЕ
                                завершает задание; wrongFlash — персистентное
                                сообщение под диаграммой (не гаснет по
                                таймеру, остаётся до следующего клика). */}
                            {isCurrent && !checked && (
                                wrongFlash ? (
                                    <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#DC605B22] text-[#DC605B]">
                                        <X className="w-5 h-5" /> {wrongFlash}
                                    </div>
                                ) : (
                                    <p className="text-sm text-[#9AA7B0] text-center">Кликни по одной из сторон треугольника выше</p>
                                )
                            )}
                            {isDone && (
                                <FieryFeedbackBanner fiery={isCurrent && isFieryMilestoneTrial(i)}>
                                    <Check className="w-5 h-5" /> {pickTrialFeedback(cfg)}
                                </FieryFeedbackBanner>
                            )}
                            {/* Конфетти на верный ответ — по прямой просьбе
                                пользователя, во всех step-by-step разборах
                                (см. LocalAnswerConfetti). Только пока это
                                ТЕКУЩЕЕ задание И мы ещё в самой практике —
                                естественно размонтируется при переходе к
                                следующему заданию ИЛИ (для ПОСЛЕДНЕГО
                                задания, у которого trialIndex/isCurrent
                                больше не меняются) при переходе в adjacent-
                                фазу — без явной проверки phase конфетти
                                иначе осталось бы висеть бессрочно, т.к. на
                                последнем задании isCurrent никогда не
                                становится false. */}
                            {isCurrent && isDone && phase === 'practice' && <LocalAnswerConfetti />}
                        </div>
                        </SceneWrapper>
                    )
                })}

                {/* Adjacent-фаза (2 сцены ПОСЛЕ тренировки, см. ADJACENT_
                    STEPS) — adj-0 напоминает уже известный противолежащий
                    катет на полной картинке (AdjacentRecapScene), adj-1
                    вводит прилежащий катет (AdjacentSwapScene). Гейтится
                    `phase === 'adjacent'` — попасть сюда можно только ПОСЛЕ
                    полностью пройденной тренировки. */}
                {phase === 'adjacent' && adjStep >= 0 && (
                    <SceneWrapper key="adj-0" innerRef={sceneRef('adj-0')} active={isSceneActive('adj-0')}>
                        <Fragment key={`adj-0-${replayNonceFor('adj-0')}`}>
                            <AdjacentRecapScene onSettled={() => setAdjStepReady(true)} />
                        </Fragment>
                    </SceneWrapper>
                )}
                {phase === 'adjacent' && adjStep >= 1 && (
                    <SceneWrapper key="adj-1" innerRef={sceneRef('adj-1')} active={isSceneActive('adj-1')}>
                        <Fragment key={`adj-1-${replayNonceFor('adj-1')}`}>
                            <AdjacentSwapScene onSettled={() => setAdjStepReady(true)} />
                        </Fragment>
                    </SceneWrapper>
                )}
            </div>

            {phase === 'intro' ? (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={handleReplay} disabled={advancing} />
                    <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                    <button type="button" onClick={handleIntroNext} disabled={!stepReady || advancing} className={walkthroughButtonClass(stepReady && !advancing)} style={walkthroughButtonStyle(stepReady && !advancing)}>
                        {introNextLabel}
                    </button>
                </div>
            ) : phase === 'practice' ? (
                checked ? (
                    <div className="w-full flex items-center gap-2">
                        <ReplayButton onClick={handleReplay} disabled={advancing} />
                        <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                        <button type="button" onClick={handleNextTrial} disabled={advancing} className={walkthroughButtonClass(!advancing)} style={walkthroughButtonStyle(!advancing)}>
                            {/* "Готово" здесь больше НЕ используется — после
                                тренировки идёт ещё adjacent-фаза (см. ниже),
                                значит ни один клик в практике не является
                                настоящим концом урока. */}
                            {trialNextLabel}
                        </button>
                    </div>
                ) : null
            ) : (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={handleReplay} disabled={advancing} />
                    <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                    <button type="button" onClick={handleAdjacentNext} disabled={!adjStepReady || advancing} className={walkthroughButtonClass(adjStepReady && !advancing)} style={walkthroughButtonStyle(adjStepReady && !advancing)}>
                        {/* "Готово" — на последней (по счёту) adjacent-сцене
                            это уже настоящий конец урока, см.
                            handleAdjacentNext. */}
                        {adjStep + 1 >= ADJACENT_STEPS ? 'Готово' : adjNextLabel}
                    </button>
                </div>
            )}
        </div>

        {/* Админская карта сцен — sticky-колонка справа (внутри того же
            overflow-y-auto контейнера, что и весь урок, см. trainer-
            question.tsx, — поэтому sticky "следует" за скроллом лога, а
            не fixed относительно viewport: framer-motion-обёртки выше по
            дереву задают transform, который сделал бы position:fixed
            позиционированным относительно НИХ, а не окна). Кружок —
            текущая сцена (крупнее, залит цветом фазы), клик — мгновенный
            прыжок (jumpToScene), не только на соседнюю. Видна ТОЛЬКО
            isAdmin — обычным ученикам не рендерится вовсе. */}
        {isAdmin && (
            <div className="shrink-0 sticky top-4 flex flex-col items-center gap-1.5 py-2">
                <div className="text-[9px] text-[#6B7A83] font-bold tracking-wide mb-1">СЦЕНЫ</div>
                {allSceneKeys.map((key) => {
                    const isCurrentScene = key === latestSceneKey
                    const color = sceneDotColor(key)
                    return (
                        <button
                            key={key}
                            type="button"
                            title={sceneLabel(key)}
                            onClick={() => jumpToScene(key)}
                            disabled={advancing}
                            className="rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                                width: isCurrentScene ? 16 : 9,
                                height: isCurrentScene ? 16 : 9,
                                backgroundColor: isCurrentScene ? color : hexToRgba(color, 0.4),
                                border: isCurrentScene ? '2px solid #F2F7FB' : 'none',
                            }}
                        />
                    )
                })}
                <div className="text-[9px] text-[#6B7A83] mt-1 whitespace-nowrap">
                    {allSceneKeys.indexOf(latestSceneKey) + 1}/{allSceneKeys.length}
                </div>
            </div>
        )}
        </div>
    )
}
