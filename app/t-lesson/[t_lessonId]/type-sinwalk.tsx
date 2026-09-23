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
// 5. Блок 1 практики (PRACTICE1_COUNT заданий) — треугольник каждый раз в
//    НОВОМ повороте/зеркале/с новым выбором α, нужно кликнуть по
//    противолежащему катету на самом чертеже (не по кнопкам-вариантам).
// 6. "Прилежащий катет" (AdjacentSwapScene) — второе название для второго
//    катета, введено ПОСЛЕ блока 1, а не в самом начале, — раз ученик уже
//    попрактиковался искать один катет, вводить второе название и сразу
//    тренировать оба проще для восприятия.
// 7. Блок 2 практики (PRACTICE2_COUNT заданий) — по прямой просьбе
//    пользователя ВСЕ задания только на прилежащий катет (было 6: 3
//    фиксированных + 3 вперемешку с противолежащим — убрано, для второго
//    закрепления достаточно 3 и без смешивания). Тот же треугольник-клик,
//    что и в блоке 1, просто с розовым стикером ADJACENT_LEG_COLOR вместо
//    зелёного LEG_COLOR в инструкции — см. renderTrial ниже.
//
// Обучающие кадры (rotationDeg=0, фиксированная ориентация) — длинные
// подписи "гипотенуза"/"противолежащий катет" читаемы только без
// поворота (см. комментарий в RightTriangleDiagram.tsx). Тренировочные
// кадры вращаются свободно — там подписывается только короткая "α".

'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import type { QuestionType } from './page'
import {
    RightTriangleDiagram, oppositeLegOf, adjacentLegOf,
    HYPOTENUSE_COLOR, LEG_COLOR, ADJACENT_LEG_COLOR,
    ZOOM_TOTAL_S, PAN_TOTAL_S, SIDE_DRAW_DURATION,
    type AlphaVertex, type SideId,
} from '@/components/geometry/RightTriangleDiagram'
import { Typewriter } from '@/components/geometry/Typewriter'
import { MARKER_COLOR_GREEN } from '@/components/geometry/WalkthroughMarker'
import {
    TypedLine, TypedKeyPhraseLine, DiagramBlock, pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    isFieryMilestoneTrial, FieryFeedbackBanner,
    AdminSceneMap, MAP_INTRO_COLOR, MAP_PRACTICE_COLOR, type AdminMapEntry,
} from '@/components/geometry/WalkthroughLog'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { playSound } from '@/lib/sound'

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

// Блок 1 практики — только противолежащий катет (единственное понятие,
// известное на этот момент урока).
const PRACTICE1_COUNT = 4
// Блок 2 практики (ПОСЛЕ "Прилежащий катет", см. AdjacentSwapScene) — по
// прямой просьбе пользователя ВСЕ задания только на только что введённый
// прилежащий катет (было 6: 3 фиксированных + 3 вперемешку с
// противолежащим — сокращено и убрано смешивание, см. makeAskForList).
const PRACTICE2_COUNT = 3
// 0° сознательно исключён — это уже показанная обучающая ориентация,
// тренировка должна выглядеть заметно "новой" с первого же задания.
const ROTATIONS = [35, -35, 55, -55, 75, -75, 110, -110, 140, -140, 160, -160]

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

// Какую сторону ищем в задании — противолежащую (не касается α) или
// прилежащую (касается α); см. makeAskForList для порядка блока 2.
type AskFor = 'opposite' | 'adjacent'

type TrialConfig = { rotationDeg: number; mirror: boolean; alphaVertex: AlphaVertex; askFor: AskFor }

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

// Список "что спрашиваем" на ВСЕ задания обоих блоков разом (длина =
// PRACTICE1_COUNT + PRACTICE2_COUNT) — блок 1 целиком "opposite", блок 2
// целиком "adjacent".
const makeAskForList = (): AskFor[] => [
    ...Array.from({ length: PRACTICE1_COUNT }, (): AskFor => 'opposite'),
    ...Array.from({ length: PRACTICE2_COUNT }, (): AskFor => 'adjacent'),
]

const makeTrialConfigs = (askForList: AskFor[]): TrialConfig[] => {
    const configs: TrialConfig[] = []
    let lastRotation: number | null = null
    for (const askFor of askForList) {
        let rotationDeg = pick(ROTATIONS)
        let guard = 0
        while (rotationDeg === lastRotation && guard < 6) {
            rotationDeg = pick(ROTATIONS)
            guard++
        }
        lastRotation = rotationDeg
        configs.push({ rotationDeg, mirror: Math.random() < 0.5, alphaVertex: Math.random() < 0.5 ? 'P' : 'Q', askFor })
    }
    return configs
}

// Число шагов обучающей части — по прямой просьбе пользователя шаги
// больше НЕ проигрываются каскадом сами по себе: каждый требует явного
// клика "Дальше", чтобы дать время рассмотреть рисунок, прежде чем идти
// дальше (см. handleIntroNext).
const INTRO_STEPS = 5

// Число сцен "adjacent"-фазы (после тренировки) — раньше было 2 (adj-0
// напоминал уже известный "противолежащий катет" на полной картинке, adj-1
// вводил "прилежащий катет"), но recap-шаг убран по прямой просьбе
// пользователя как избыточный — остался только один шаг, вводящий
// "прилежащий катет" (AdjacentSwapScene, теперь сам под ключом adj-0).
// Настоящее завершение урока (onComplete/onAnswer) происходит ЗДЕСЬ, не в
// конце практики — см. handleAdjacentNext/handleNextTrial ниже.
const ADJACENT_STEPS = 1

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
                // Стикер ТОЛЬКО на "противолежащий", "катет" — обычным
                // текстом сразу после (единый формат наименования катета
                // по всему разбору, см. AdjacentSwapScene ниже — тот же
                // приём на "прилежащий").
                <TypedLineWithSticker
                    before="Катет напротив угла α называется "
                    plainTextForTyping="противолежащий"
                    stickerContent="противолежащий"
                    stickerColor={LEG_COLOR}
                    after=" катет."
                    onSettled={onSettled}
                />
            )}
        </>
    )
}

// ===== Боксовый стикер для слов "противолежащий"/"прилежащий" — тот же
// визуальный язык, что уже устоялся в LOG*WALK-разборах (Sticker/
// TypedLineWithSticker) — локальная копия, общего экспорта этих утилит
// нет (каждый *WALK-файл несёт свою). По прямой просьбе пользователя
// заменяет собой ВСЕ текстовыделения (HighlightWord) в этом разборе —
// единственное место, где highlight использовался, было задание практики
// "Кликни по противолежащему катету" (см. renderTrial ниже). =====
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
    before, stickerContent, plainTextForTyping, stickerColor, after = '', onTyped, onSettled, emphasisWord, className,
}: {
    before: string; stickerContent: React.ReactNode; plainTextForTyping: string; stickerColor: string; after?: string; onTyped?: () => void; onSettled?: () => void
    // Слово ВНУТРИ before, которое по завершении печати нужно показать
    // крупным капсом (например "рядом" → "РЯДОМ") — по прямой просьбе
    // пользователя, отдельно от Sticker'а (это просто визуальный акцент
    // размером, без цветной рамки). Печатается Typewriter'ом как обычный
    // текст (строчными), крупный капс подставляется только ПОСЛЕ печати —
    // тот же принцип, что и у самого стикера.
    emphasisWord?: string
    // По умолчанию — та же полноширинная строка, что и раньше (обучающие
    // сцены); задания практики (renderTrial) передают свой className —
    // строка там стоит РЯДОМ с круглой плашкой "N/M" в одном flex-ряду, ей
    // нужен flex-1, а не w-full.
    className?: string
}) => {
    const [typed, setTyped] = useState(false)
    const beforeParts = emphasisWord ? before.split(emphasisWord) : [before]
    return (
        <div className={className ?? 'w-full text-base md:text-lg text-[#F2F7FB]'}>
            {!typed ? (
                <Typewriter
                    text={`${before}${plainTextForTyping}${after}`}
                    onDone={() => { setTyped(true); onTyped?.(); setTimeout(() => onSettled?.(), 450) }}
                />
            ) : (
                <>
                    {emphasisWord && beforeParts.length === 2 ? (
                        <>
                            {beforeParts[0]}
                            <span className="font-black uppercase text-lg md:text-xl align-middle">{emphasisWord}</span>
                            {beforeParts[1]}
                        </>
                    ) : before}
                    <Sticker value={stickerContent} color={stickerColor} />
                    {after}
                </>
            )}
        </div>
    )
}

// Шаг "adj-0" — второй катет (рядом с α, "нижний" на этой диаграмме —
// R-P) получает своё название. Раньше этому шагу предшествовал отдельный
// "recap"-шаг (AdjacentRecapScene, напоминал уже известный "противолежащий
// катет" на той же картинке) — по прямой просьбе пользователя убран
// целиком как избыточный (одна и та же информация уже дана на шаге 4
// обучающей части и закреплена всей тренировкой). По прямой просьбе
// пользователя — ТРИ РАЗНЕСЁННЫХ ВО ВРЕМЕНИ БИТА, не одновременно: (1)
// сначала доигрывает СОБСТВЕННАЯ entrance-анимация диаграммы (гипотенуза+
// противолежащий катет рисуются при монтировании — тот же STEP2_SETTLE_MS,
// что и у гипотенузы), прилежащий катет всё ещё обычный зелёный "катет";
// (2) только ПОТОМ (после паузы) начинает печататься текст; (3) и только
// ПОСЛЕ ТОГО, как текст полностью допечатан (не одновременно со стикером
// "прилежащий" в тексте, как было раньше) — ещё одна пауза, и уже тогда
// катет подсвечивается/переименовывается в "прилежащий катет" (тот же
// "стандарт подсветки стороны" — толстая линия + 2-строчная подпись).
// onSettled (разблокирует кнопку) ждёт ВСЮ цепочку целиком — до конца
// собственной draw+bounce анимации самого прилежащего катета, не раньше.
const AdjacentSwapScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [textVisible, setTextVisible] = useState(false)
    const [swapped, setSwapped] = useState(false)
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
                    adjacentLegHighlighted={swapped} adjacentLegLabelShown={swapped}
                />
            </DiagramBlock>
            {textVisible && (
                // after=" катет." (не просто ".") — по прямой просьбе
                // пользователя единый формат "качественное слово(стикер)
                // катет" для ОБОИХ катетов, см. Step4Scene выше.
                <TypedLineWithSticker
                    before="Катет рядом с углом α называется "
                    emphasisWord="рядом"
                    plainTextForTyping="прилежащий"
                    stickerContent="прилежащий"
                    stickerColor={ADJACENT_LEG_COLOR}
                    after=" катет."
                    onTyped={() => {
                        setTimeout(() => {
                            setSwapped(true)
                            setTimeout(() => onSettled?.(), STEP2_SETTLE_MS)
                        }, DIAGRAM_TO_TEXT_PAUSE_MS)
                    }}
                />
            )}
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
    const [trialConfigs, setTrialConfigs] = useState<TrialConfig[]>(() => makeTrialConfigs(makeAskForList()))
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

    const correctSideFor = (cfg: TrialConfig): SideId => (cfg.askFor === 'adjacent' ? adjacentLegOf(cfg.alphaVertex) : oppositeLegOf(cfg.alphaVertex))
    const currentCorrectSide = correctSideFor(trialConfigs[trialIndex])

    const handleSideClick = (side: SideId) => {
        playSound('/click6.wav')
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

    // По прямой просьбе пользователя "Прилежащий катет" вводится ПОСЛЕ
    // блока 1 практики (не в самом начале урока, не в конце) — поэтому
    // клик "Дальше" на ПОСЛЕДНЕМ задании блока 1 (idx === PRACTICE1_COUNT-1)
    // ведёт не в следующее задание и не сразу в конец урока, а в
    // "adjacent"-фазу (AdjacentSwapScene); та, закончившись
    // (handleAdjacentNext ниже), сама возвращает в практику — на первое
    // задание блока 2. Настоящее завершение урока происходит здесь же,
    // просто теперь на ПОСЛЕДНЕМ задании блока 2 (idx === trialConfigs.
    // length-1), а не сразу после блока 1.
    const handleNextTrial = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            const isEndOfBlock1 = trialIndex === PRACTICE1_COUNT - 1
            if (isEndOfBlock1) {
                setAdvancing(false)
                setPhase('adjacent')
                return
            }
            const isLastOverall = trialIndex + 1 >= trialConfigs.length
            if (isLastOverall) {
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

    // Клик "Дальше" в adjacent-фазе — та же пауза, что и у handleIntroNext/
    // handleNextTrial. ADJACENT_STEPS===1 (единственная сцена, adj-0) —
    // урок здесь НЕ заканчивается (в отличие от более ранней версии этого
    // разбора, когда "прилежащий катет" был последней сценой урока): по
    // прямой просьбе пользователя после него идёт блок 2 практики, поэтому
    // handleAdjacentNext просто возвращает в практику на первое задание
    // блока 2 (trialIndex было PRACTICE1_COUNT-1, становится PRACTICE1_
    // COUNT) — настоящее завершение теперь только в handleNextTrial выше.
    const handleAdjacentNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            setPhase('practice')
            setTrialIndex((i) => i + 1)
            setChecked(false)
            setWrongTried([])
            setWrongFlash(null)
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
            // adj-0 (единственная сцена) сидит МЕЖДУ блоками практики — её
            // "предыдущая" сцена всегда последнее задание блока 1, а не
            // последнее задание вообще (то было верно, пока adjacent была
            // последней фазой урока; теперь после неё есть ещё блок 2).
            return idx > 0 ? `adj-${idx - 1}` : `trial-${PRACTICE1_COUNT - 1}`
        }
        if (key.startsWith('trial-')) {
            const idx = Number(key.slice('trial-'.length))
            // Первое задание блока 2 (idx===PRACTICE1_COUNT) — предыдущая
            // сцена в накопительном логе это adj-0 ("Прилежащий катет"),
            // а не соседнее по индексу trial-(PRACTICE1_COUNT-1) напрямую.
            if (idx === PRACTICE1_COUNT) return 'adj-0'
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

    // ===== Админская "карта этапов" — теперь ШАБЛОННЫЙ переиспользуемый
    // AdminSceneMap (components/geometry/WalkthroughLog.tsx, см. его
    // комментарий) — здесь остаётся только СПИСОК пунктов, вся логика
    // позиционирования/автоскролла живёт в самом компоненте. Раньше на
    // тренировку был один кружок на всё (нельзя было прыгнуть на
    // конкретное задание), потом — по кружку на каждое из 4 заданий
    // (карта разрослась до 11 пунктов); по прямой просьбе пользователя
    // ("сократить количество этапов на карте") тренировочный блок снова
    // ОДИН пункт — но теперь ещё и особого, "тренировочного" красного
    // цвета (MAP_PRACTICE_COLOR), а не того же цвета, что и обучающие
    // шаги. Сцены ПОСЛЕ практики (adjacent-фаза) — снова обычный серый
    // MAP_INTRO_COLOR, как и вводные шаги (раньше был отдельный ADJACENT_
    // LEG_COLOR — тот остаётся только у подсветки САМОЙ диаграммы/стикера
    // "прилежащий", не у точки на карте).
    const practice2Count = trialConfigs.length - PRACTICE1_COUNT
    const sceneMapEntries: AdminMapEntry[] = [
        ...Array.from({ length: INTRO_STEPS }, (_, i) => ({
            dotKey: `step-${i}`,
            label: ['Треугольник', 'Прямой угол', 'Гипотенуза', 'Угол α', 'Противолежащий катет'][i] ?? `Шаг ${i + 1}`,
            jumpKey: `step-${i}`,
            isActive: phase === 'intro' && step === i,
            color: MAP_INTRO_COLOR,
        })),
        // Блок 1 практики — ОТДЕЛЬНЫЙ пункт карты (этап 6), не общий на всю
        // практику: теперь между двумя блоками практики стоит сцена
        // "Прилежащий катет" (этап 7), и по прямой просьбе пользователя
        // карта должна отражать эту структуру (6 → блок 1, 7 → прилежащий
        // катет, 8 → блок 2), а не сваливать оба блока в один пункт 6.
        {
            dotKey: 'practice-block-1',
            label: `Тренировка 1 (${PRACTICE1_COUNT} заданий)`,
            jumpKey: 'trial-0',
            isActive: phase === 'practice' && trialIndex < PRACTICE1_COUNT,
            color: MAP_PRACTICE_COLOR,
        },
        ...Array.from({ length: ADJACENT_STEPS }, (_, i) => ({
            dotKey: `adj-${i}`,
            label: ['Прилежащий катет'][i] ?? `Adj ${i + 1}`,
            jumpKey: `adj-${i}`,
            isActive: phase === 'adjacent' && adjStep === i,
            color: MAP_INTRO_COLOR,
        })),
        // Блок 2 практики — этап 8, jumpKey сразу на первое задание блока 2
        // (не trial-0), чтобы прыжок с карты не откатывал обратно в блок 1.
        {
            dotKey: 'practice-block-2',
            label: `Тренировка 2 (${practice2Count} заданий)`,
            jumpKey: `trial-${PRACTICE1_COUNT}`,
            isActive: phase === 'practice' && trialIndex >= PRACTICE1_COUNT,
            color: MAP_PRACTICE_COLOR,
        },
    ]

    // Одна задача практики (и блок 1 — только противолежащий, и блок 2 —
    // только прилежащий, см. TrialConfig.askFor) — вынесена в функцию,
    // т.к. теперь рендерится ДВУМЯ отдельными .map() (см. return ниже, JSX
    // блока 2 идёт ПОСЛЕ сцены "Прилежащий катет" в накопительном логе, не
    // одним общим списком с блоком 1).
    const renderTrial = (i: number) => {
        const cfg = trialConfigs[i]
        const isCurrent = i === trialIndex
        const isDone = i < trialIndex || (isCurrent && checked)
        const correctSide = correctSideFor(cfg)
        const askForWord = cfg.askFor === 'adjacent' ? 'прилежащему' : 'противолежащему'
        const askForColor = cfg.askFor === 'adjacent' ? ADJACENT_LEG_COLOR : LEG_COLOR
        return (
            <SceneWrapper key={`trial-${i}`} innerRef={sceneRef(`trial-${i}`)} active={isSceneActive(`trial-${i}`)}>
            <div key={`trial-${i}-${replayNonceFor(`trial-${i}`)}`} className="w-full flex flex-col gap-3">
                {/* "N из M" — отдельная цветная плашка (не часть печатаемого
                    текста). Слово-цель ("противолежащему"/"прилежащему") —
                    боксовый стикер (см. Sticker/TypedLineWithSticker выше),
                    цвет совпадает с тем, каким этот катет подписан на
                    диаграмме (зелёный LEG_COLOR / розовый ADJACENT_LEG_
                    COLOR) — по прямой просьбе пользователя ВЗАМЕН старого
                    текстовыделителя (HighlightWord), единственного места в
                    этом разборе, где он использовался. */}
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
                    <TypedLineWithSticker
                        className="flex-1 text-base md:text-lg text-[#F2F7FB]"
                        before="Кликни по "
                        plainTextForTyping={askForWord}
                        stickerContent={askForWord}
                        stickerColor={askForColor}
                        after=" катету."
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
                {/* Режим "пробуй, пока не угадаешь" — неверный клик красит
                    сторону красным и блокирует её (см. RightTriangleDiagram.
                    wrongSides), но НЕ завершает задание; wrongFlash —
                    персистентное сообщение под диаграммой (не гаснет по
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
                {/* Конфетти на верный ответ — по прямой просьбе пользователя,
                    во всех step-by-step разборах (см. LocalAnswerConfetti).
                    Только пока это ТЕКУЩЕЕ задание И мы ещё в самой
                    практике — естественно размонтируется при переходе к
                    следующему заданию ИЛИ (для ПОСЛЕДНЕГО задания блока,
                    у которого trialIndex/isCurrent больше не меняются) при
                    переходе в adjacent-фазу — без явной проверки phase
                    конфетти иначе осталось бы висеть бессрочно. */}
                {isCurrent && isDone && phase === 'practice' && <LocalAnswerConfetti />}
            </div>
            </SceneWrapper>
        )
    }

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
                    (блок 1 практики пройден), уже показанные задания НЕ
                    должны исчезать из DOM (тот же принцип "накопительного
                    лога", что и у шагов 0-4 выше, которые вообще не
                    проверяют phase) — просто тускнеют, как и остальные
                    пройденные сцены. Блок 1 (i < PRACTICE1_COUNT) и блок 2
                    (i >= PRACTICE1_COUNT) — ДВА отдельных .map(), а не один
                    общий: между ними в накопительном логе стоит сцена
                    "Прилежащий катет" (adj-0, см. ниже), JSX-порядок здесь
                    ЭТО и есть визуальный/хронологический порядок. */}
                {(phase === 'practice' || phase === 'adjacent') &&
                    Array.from({ length: Math.min(trialIndex + 1, PRACTICE1_COUNT) }).map((_, i) => renderTrial(i))}

                {/* Сцена "Прилежащий катет" (AdjacentSwapScene) — ПОСЛЕ
                    блока 1, ПЕРЕД блоком 2 практики (по прямой просьбе
                    пользователя ввести второе название катета не сразу, а
                    когда первое уже закреплено). Раньше здесь была ещё и
                    отдельная recap-сцена (adj-0, AdjacentRecapScene) —
                    убрана как избыточная. Условие — `phase === 'adjacent'`
                    (сцена ещё показывается сейчас) ИЛИ `trialIndex >=
                    PRACTICE1_COUNT` (сцена уже пройдена, мы в блоке 2) —
                    в отличие от прежней версии, где adjacent была ПОСЛЕДНЕЙ
                    фазой урока и достаточно было проверить только
                    `phase === 'adjacent'`. */}
                {(phase === 'adjacent' || trialIndex >= PRACTICE1_COUNT) && (
                    <SceneWrapper key="adj-0" innerRef={sceneRef('adj-0')} active={isSceneActive('adj-0')}>
                        <Fragment key={`adj-0-${replayNonceFor('adj-0')}`}>
                            <AdjacentSwapScene onSettled={() => setAdjStepReady(true)} />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Блок 2 практики (PRACTICE1_COUNT..trialConfigs.length-1)
                    — доступен только после того, как adjacent-фаза уже
                    пройдена хотя бы раз (trialIndex >= PRACTICE1_COUNT),
                    см. handleAdjacentNext. */}
                {trialIndex >= PRACTICE1_COUNT &&
                    Array.from({ length: trialIndex + 1 - PRACTICE1_COUNT }).map((_, j) => renderTrial(PRACTICE1_COUNT + j))}
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
                        {/* Никогда "Готово" — adjacent-фаза больше не
                            заканчивает урок (см. handleAdjacentNext), после
                            неё всегда идёт блок 2 практики. */}
                        {adjNextLabel}
                    </button>
                </div>
            )}
        </div>

        {/* Шаблонная переиспользуемая карта этапов (см. её комментарий в
            WalkthroughLog.tsx) — одна строка вместо ref/effect-обвязки,
            видна ТОЛЬКО isAdmin, обычным ученикам не рендерится вовсе. */}
        {isAdmin && <AdminSceneMap entries={sceneMapEntries} onJump={jumpToScene} disabled={advancing} />}
        </div>
    )
}
