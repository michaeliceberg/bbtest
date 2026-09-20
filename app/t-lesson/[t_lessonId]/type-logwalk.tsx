// app/t-lesson/[t_lessonId]/type-logwalk.tsx
//
// Тип LOGWALK — интерактивный разбор по шагам "как складывать логарифмы"
// (тренажёр "Логарифмы", урок ПЕРЕД остальными этапами темы) — по прямой
// просьбе пользователя, тот же архитектурный принцип, что уже у SINWALK
// (см. type-sinwalk.tsx): самодостаточный тип, компонент сам ведёт свою
// внутреннюю хореографию и зовёт onAnswer/onComplete РОВНО один раз в
// конце; общая нижняя кнопка (components/trainer-question.tsx) скрыта —
// у LOGWALK своя кнопка "Дальше"/"Готово" на протяжении всего прохождения.
//
// Сюжет — прямая инструкция пользователя, по шагам, на ОДНОМ фиксированном
// примере (log₂3 + log₂5 = log₂15):
// 1. Пишем крупно "log₂3 + log₂5 =" — просто условие, без текста-подписи.
// 2. Обводим ОБА основания (двойки) как "стикер" — заметим одинаковое
//    основание.
// 3. Дописываем справа "= log₂" — то же основание обведено тем же цветом.
// 4. Обводим аргументы 3 и 5 РАЗНЫМИ цветами (не один общий, как раньше) —
//    стрелка от "+" слева к "·" справа показывает "сумма превращается в
//    произведение". "= log₂(3·5)".
// 5. Считаем: "Ответ: log₂15".
//
// После разбора — несколько тренировочных заданий с НОВЫМИ случайными
// числами (log_a x + log_a y = log_a ?), нужно кликнуть на верное число
// среди вариантов — тот же формат, что и у SINWALK (клик = мгновенная
// проверка, ошибка на последнем по счёту задании не завершает попытку, а
// добавляет ещё одно, см. handleNextTrial).

'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'
import {
    DiagramBlock,
    pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    ACTIVE_COLOR, WRONG_COLOR, CORRECT_COLOR, ATTENTION_COLOR,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    isFieryMilestoneTrial, FieryCelebration,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'

// Пауза ПОСЛЕ клика "Дальше", ДО начала новой сцены — тот же приём и то
// же значение, что у SINWALK (см. там же комментарий).
const SCENE_TRANSITION_PAUSE_MS = 1000

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

const INTRO_STEPS = 5
const TRIAL_COUNT = 4

// Основание — синий (та же роль "величина, вводимая отдельно", что уже
// закреплена за синим в палитре ggege). Аргументы 3 и 5 — РАЗНЫЕ цвета
// (по прямой просьбе пользователя — одинаковый цвет для обоих читался
// как "это одно и то же число"), взяты из двух ролей палитры, пока
// свободных для новой задачи ("Малиновый/бирюзовый — пока используются
// только на /learn... свободны для новой роли", см. CLAUDE.md).
const BASE_COLOR = GGEGE_PALETTE.blue.button
const ARG_COLOR_X = GGEGE_PALETTE.teal.button
const ARG_COLOR_Y = GGEGE_PALETTE.raspberry.button

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

// ===== Общие строительные блоки формулы (HTML+CSS, без KaTeX — короткая
// целочисленная запись log_a(x) не содержит ни одной конструкции, которая
// требовала бы формульного рендера, а обычные HTML-элементы избавляют от
// всех уже известных в проекте KaTeX-сегментирования/цвет-протечка гэтч
// (см. историю INSERT в CLAUDE.md) — тот же вывод, что уже сделан для
// x1/x2 в type-vieta.tsx). =====

// "Стикер" числа — HTML-версия того же приёма, что уже используют
// HtmlLetterSticker (reference-browser.tsx) и LetterSticker
// (RightTriangleRefDiagram.tsx): скруглённый цветной бокс с полупрозрачной
// заливкой того же цвета. Bounce-появление — числа начинают крупнее
// финального размера и с пружинным отскоком уменьшаются (тот же паттерн,
// что уже применяется в проекте для чисел/букв, см. numberBounce в
// CLAUDE.md).
const NumSticker = ({ value, color, small = false }: { value: number | string; color: string; small?: boolean }) => (
    <motion.span
        initial={{ scale: 2.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15 }}
        className={cn(
            'inline-flex items-center justify-center rounded-lg border-2 font-extrabold align-middle',
            // leading-none ПОСЛЕ text-[...] — tailwind-merge относит
            // произвольный text-[size] и leading-* к одной "font-size"
            // конфликт-группе (кто later, тот и остаётся), при обратном
            // порядке leading-none тихо вырезался бы (найдено живьём —
            // sticker коллапсировал до 4px по высоте).
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

// Один "токен" формулы — по прямой просьбе пользователя ("можно ли
// сделать так, чтобы формула тоже 'печаталась'?") каждый смысловой
// кусок формулы появляется по очереди с небольшой задержкой, а не весь
// разом. Настоящий Typewriter (по буквам) здесь не имеет смысла —
// формула это НЕ единая строка текста, а структура из под/над-строчных
// элементов и цветных стикеров (то же самое, из-за чего когда-то ушли от
// KaTeX, см. историю INSERT) — но каскадное появление ЦЕЛЫХ элементов
// слева направо визуально даёт тот же эффект "формула печатается", просто
// не по одному символу, а по "словам"/операндам.
const Token = ({ delay, children }: { delay: number; children: React.ReactNode }) => (
    <motion.span
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay }}
        className="inline-flex items-baseline"
    >
        {children}
    </motion.span>
)

// "logₐ x" — базовый (левый) член суммы. Основание — subscript (тег
// <sub>, естественная позиция браузера, без ручных transform); аргумент —
// обычный размер сразу после. argColor не задан — аргумент показывается
// плоским текстом (см. FormulaState.arg1Color/arg2Color ниже). baseMarker
// — data-marker на самом <sub>, нужен BaseMatchArrow (см. ниже), чтобы
// измерить реальную позицию этого конкретного основания; присутствует
// всегда (безвредно там, где стрелка не рисуется), тот же приём, что уже
// применён для "plus"/"multiply" в ExampleFormula.
const LogTerm = ({
    base, arg, baseHighlighted, argColor, baseMarker,
}: {
    base: number; arg: number; baseHighlighted: boolean; argColor?: string; baseMarker?: string
}) => (
    <span className="inline-flex items-baseline whitespace-nowrap">
        <Plain>log</Plain>
        <sub className="ml-0.5" data-marker={baseMarker}>
            {baseHighlighted ? <NumSticker value={base} color={BASE_COLOR} small /> : <Plain>{base}</Plain>}
        </sub>
        <span className="ml-1">
            {argColor ? <NumSticker value={arg} color={argColor} /> : <Plain>{arg}</Plain>}
        </span>
    </span>
)

type FormulaState = {
    baseHighlighted: boolean
    // Цвет аргумента 3/5 — РАЗНЫЙ для каждого (см. ARG_COLOR_X/Y выше),
    // undefined до того, как аргументы вообще подсвечиваются (шаг 0-2).
    arg1Color?: string
    arg2Color?: string
    showRightSide: boolean
    showProduct: boolean
    showResult: boolean
}

// Полная строка примера "log₂3 + log₂5 [= log₂(3·5) [= 15]]" — на каждом
// шаге разбора рисуется НОВЫЙ (не мутирующий предыдущий) экземпляр с
// накопленными флагами — тот же "накопительный лог", что у SINWALK: все
// уже пройденные шаги остаются на экране, новый дописывается ниже.
// data-marker="plus"/"multiply" — точки, между которыми на шаге 3 рисуется
// стрелка (см. ArgumentsArrow) — присутствуют всегда, безвредны там, где
// стрелка не рисуется.
const ExampleFormula = ({ baseHighlighted, arg1Color, arg2Color, showRightSide, showProduct, showResult }: FormulaState) => {
    let tokenCount = 0
    const nextDelay = () => (tokenCount++) * 0.13
    return (
        <div className="w-full flex items-center justify-center flex-wrap gap-x-2 gap-y-2 text-2xl md:text-3xl font-extrabold py-1">
            <Token delay={nextDelay()}>
                <LogTerm base={2} arg={3} baseHighlighted={baseHighlighted} argColor={arg1Color} baseMarker="base1" />
            </Token>
            <Token delay={nextDelay()}>
                <span data-marker="plus" className="text-[#F2F7FB]">+</span>
            </Token>
            <Token delay={nextDelay()}>
                <LogTerm base={2} arg={5} baseHighlighted={baseHighlighted} argColor={arg2Color} baseMarker="base2" />
            </Token>
            {showRightSide && (
                <>
                    <Token delay={nextDelay()}><Plain>=</Plain></Token>
                    <Token delay={nextDelay()}>
                        <span className="inline-flex items-baseline whitespace-nowrap">
                            <Plain>log</Plain>
                            <sub className="ml-0.5" data-marker="base3">
                                <NumSticker value={2} color={BASE_COLOR} small />
                            </sub>
                            {showProduct && (
                                <span className="ml-1 inline-flex items-baseline gap-1 whitespace-nowrap">
                                    <Plain>(</Plain>
                                    {arg1Color ? <NumSticker value={3} color={arg1Color} /> : <Plain>3</Plain>}
                                    <span data-marker="multiply" className="text-[#F2F7FB]">·</span>
                                    {arg2Color ? <NumSticker value={5} color={arg2Color} /> : <Plain>5</Plain>}
                                    <Plain>)</Plain>
                                </span>
                            )}
                        </span>
                    </Token>
                </>
            )}
            {showResult && (
                <>
                    <Token delay={nextDelay()}><Plain>=</Plain></Token>
                    <Token delay={nextDelay()}>
                        <motion.span
                            initial={{ scale: 2.4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                            style={{ color: CORRECT_COLOR }}
                        >
                            15
                        </motion.span>
                    </Token>
                </>
            )}
        </div>
    )
}

// Печатаемая строка объяснения, где в конце — не цветное слово/число, а
// НАСТОЯЩИЙ боксовый стикер (тот же NumSticker, что и в самой формуле) —
// по прямой просьбе пользователя ("эту 2 надо сделать в виде стикера", и
// позже — "перемножить надо не текстовыделителем, а стикером", 2026-09-19,
// единый визуальный язык со стикерами LOGDEFWALK/LOGPOWWALK). Структура —
// типим целиком обычным текстом, после завершения печати заменяем
// число/слово на стикер. stickerValue — number (числа основания) ИЛИ
// string (слово "перемножить").
const TypedLineWithSticker = ({
    before, stickerValue, stickerColor, after = '', onSettled,
}: {
    before: string; stickerValue: number | string; stickerColor: string; after?: string; onSettled?: () => void
}) => {
    const [typed, setTyped] = useState(false)
    return (
        <div className="w-full text-base md:text-lg text-[#F2F7FB]">
            {!typed ? (
                <Typewriter
                    text={`${before}${stickerValue}${after}`}
                    onDone={() => { setTyped(true); setTimeout(() => onSettled?.(), 450) }}
                />
            ) : (
                <>
                    {before}
                    <NumSticker value={stickerValue} color={stickerColor} />
                    {after}
                </>
            )}
        </div>
    )
}

// Финальная строка "Ответ: log₂15" — по прямой просьбе пользователя
// вместо арифметического пересказа ("3·5=15, поэтому..."). "Ответ:"
// печатается как обычный текст, сама формула справа — статичная (без
// анимации подстановки, результат уже показан построчно выше в самой
// диаграмме) зелёным (цвет "верно" по всему проекту).
const AnswerLine = ({ onSettled }: { onSettled?: () => void }) => {
    const [typed, setTyped] = useState(false)
    return (
        <div className="w-full text-base md:text-lg text-[#F2F7FB] flex items-baseline gap-2 flex-wrap">
            {!typed ? (
                <Typewriter text="Ответ:" onDone={() => { setTyped(true); setTimeout(() => onSettled?.(), 400) }} />
            ) : (
                <>
                    <span>Ответ:</span>
                    <motion.span
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 16 }}
                        className="inline-flex items-baseline font-extrabold text-lg md:text-xl"
                        style={{ color: CORRECT_COLOR }}
                    >
                        log<sub className="ml-0.5">2</sub><span className="ml-0.5">15</span>
                    </motion.span>
                </>
            )}
        </div>
    )
}

// "Уголок" (elbow/orthogonal-connector) со скруглёнными углами — та же
// техника, что уже применена в LOGPOWWALK/LOGSWAPWALK/LOGSUBWALK/
// LOGDIVWALK (см. buildElbowPath там же, 2026-09-19: заменена гладкая
// квадратичная дуга — по прямой просьбе пользователя нарисовать стрелку
// "угловой", как у LOGSWAPWALK). Скругление — квадратичная кривая через
// САМУ угловую точку как control point (кривая проходит РЯДОМ с углом, не
// через него — не нужно вычислять центр отдельной дуги).
function buildElbowPath(x1: number, y1: number, x2: number, y2: number, bridgeY: number, radius = 10): string {
    const vDir1 = bridgeY < y1 ? -1 : 1
    const vDir2 = y2 < bridgeY ? -1 : 1
    const hDir = x2 >= x1 ? 1 : -1
    const rV1 = Math.min(radius, Math.abs(bridgeY - y1))
    const rH = Math.min(radius, Math.abs(x2 - x1) / 2)
    const rV2 = Math.min(radius, Math.abs(y2 - bridgeY))

    const p2 = `${x1} ${bridgeY - vDir1 * rV1}`
    const p3 = `${x1 + hDir * rH} ${bridgeY}`
    const p4 = `${x2 - hDir * rH} ${bridgeY}`
    const p5 = `${x2} ${bridgeY + vDir2 * rV2}`

    return `M ${x1} ${y1} L ${p2} Q ${x1} ${bridgeY} ${p3} L ${p4} Q ${x2} ${bridgeY} ${p5} L ${x2} ${y2}`
}

// Зазор между якорной точкой стрелки и реальным краем элемента (цифры/
// знака), на который она указывает — SVG-маркер наконечника (markerWidth=8,
// refX=6, markerUnits по умолчанию "strokeWidth") физически ВЫСТУПАЕТ за
// сам path-координату конца линии на (8-6)×strokeWidth ≈ 5-6px В
// НАПРАВЛЕНИИ движения — если анкорить ровно на границе элемента (rect.top/
// rect.bottom без отступа), видимый КОНЧИК наконечника залезает НА
// элемент (реальный баг, найденный пользователем — "нижняя угловая стрелка
// залезает на цифры со стикерами"). ARROW_TIP_GAP — компенсирующий отступ:
// всегда используется ТАК, чтобы отодвинуть анкор ДАЛЬШЕ от элемента (не
// ближе) — см. каждое использование ниже.
const ARROW_TIP_GAP = 8

// Угловая стрелка от "+" (левая часть — складываем логарифмы) к "·"
// (правая часть — аргументы перемножаются) — по прямой просьбе
// пользователя, показывает "сумма превращается в умножение" наглядно, не
// только словами. Позиции обоих концов измеряются по факту отрисовки
// (data-marker), а не считаются аналитически — формула это обычный HTML
// в потоке текста, не SVG с известной геометрией, поэтому живое измерение
// здесь единственный вариант (в отличие от зум-эффектов SVG-диаграмм, где
// проект принципиально требует аналитический расчёт, см. CLAUDE.md, —
// там причина не работать с getBBox была в ИСКАЖЕНИИ от bounce-анимации
// детей; здесь измеряем ПОСЛЕ того, как токены/стикеры уже осели). "+" и
// "·" — на одной строке (не стикеры одна над другой, как в LOGPOWWALK),
// поэтому якорь — верхний край обоих (мост выше, тот же принцип, что и
// curve='up' в LOGPOWWALK).
const ArgumentsArrow = ({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) => {
    const [d, setD] = useState<string | null>(null)

    useEffect(() => {
        const measure = () => {
            const container = containerRef.current
            if (!container) return
            const plusEl = container.querySelector<HTMLElement>('[data-marker="plus"]')
            const mulEl = container.querySelector<HTMLElement>('[data-marker="multiply"]')
            if (!plusEl || !mulEl) return
            const cRect = container.getBoundingClientRect()
            const pRect = plusEl.getBoundingClientRect()
            const mRect = mulEl.getBoundingClientRect()
            const x1 = pRect.left + pRect.width / 2 - cRect.left
            const y1 = pRect.top - cRect.top - ARROW_TIP_GAP
            const x2 = mRect.left + mRect.width / 2 - cRect.left
            const y2 = mRect.top - cRect.top - ARROW_TIP_GAP
            const bridgeY = Math.min(y1, y2) - 26
            setD(buildElbowPath(x1, y1, x2, y2, bridgeY))
        }
        // Ждём, пока каскад токенов (Token, ~0.13с шаг) и bounce стикеров
        // осядут, прежде чем измерять реальные позиции.
        const t = setTimeout(measure, 750)
        window.addEventListener('resize', measure)
        return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!d) return null
    return (
        <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible', width: '100%', height: '100%' }}>
            <defs>
                <marker id="logwalk-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 Z" fill={ATTENTION_COLOR} />
                </marker>
            </defs>
            <motion.path
                d={d}
                stroke={ATTENTION_COLOR}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                markerEnd="url(#logwalk-arrowhead)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.2 }}
            />
        </svg>
    )
}

// Угловая стрелка(и) ПОД формулой, показывающая, что 2 (или 3) основания —
// ОДНО И ТО ЖЕ число — по прямой просьбе пользователя ("угловой стрелкой
// снизу показать обеими концами на левую двойку и правую", затем "нарисовать
// внизу угловую стрелку и к этой двойке... то есть длинную угловую стрелку
// с тремя указателями на 'двойки'"). Один общий мост НИЖЕ всех оснований —
// тот же buildElbowPath, что и у ArgumentsArrow/DoubleArrow (функция сама
// определяет направление уголка по тому, выше или ниже bridgeY каждая
// точка, — тут просто ниже, не выше, как у остальных стрелок этого
// семейства файлов), с наконечником на ОБОИХ концах (markerStart с
// orient="auto-start-reverse", тот же приём, что и DoubleArrow в
// LOGSWAPWALK). Для СРЕДНЕЙ (не крайней) точки, когда markers.length===3, —
// отдельный прямой вертикальный "отвод" от моста вверх к основанию со
// своим наконечником (markerEnd общего пути применяется только к самому
// первому/последнему узлу ЦЕЛОГО d, поэтому средняя ветвь — отдельный
// <path>, не часть общего). Якорь на каждом основании — НИЖНИЙ край (мост
// идёт СНИЗУ формулы, а не сверху, как у остальных стрелок в проекте).
const BaseMatchArrow = ({
    containerRef, markers, color,
}: { containerRef: React.RefObject<HTMLDivElement | null>; markers: string[]; color: string }) => {
    const [paths, setPaths] = useState<{ main: string; branches: string[] } | null>(null)

    useEffect(() => {
        const measure = () => {
            const container = containerRef.current
            if (!container) return
            const cRect = container.getBoundingClientRect()
            const points = markers
                .map((m) => {
                    const el = container.querySelector<HTMLElement>(`[data-marker="${m}"]`)
                    if (!el) return null
                    const r = el.getBoundingClientRect()
                    return { x: r.left + r.width / 2 - cRect.left, y: r.bottom - cRect.top + ARROW_TIP_GAP }
                })
                .filter((p): p is { x: number; y: number } => p !== null)
                .sort((a, b) => a.x - b.x)
            if (points.length < 2) return
            const bridgeY = Math.max(...points.map((p) => p.y)) + 26
            const first = points[0]
            const last = points[points.length - 1]
            const main = buildElbowPath(first.x, first.y, last.x, last.y, bridgeY)
            const branches = points.slice(1, -1).map((p) => `M ${p.x} ${bridgeY} L ${p.x} ${p.y}`)
            setPaths({ main, branches })
        }
        // Ждём, пока каскад токенов и bounce-стикеры осядут, прежде чем
        // измерять реальные позиции (тот же таймаут, что и у ArgumentsArrow).
        const t = setTimeout(measure, 750)
        window.addEventListener('resize', measure)
        return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!paths) return null
    const startId = `logwalk-base-arrow-start-${markers.join('-')}`
    const endId = `logwalk-base-arrow-end-${markers.join('-')}`
    return (
        <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible', width: '100%', height: '100%' }}>
            <defs>
                <marker id={startId} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto-start-reverse">
                    <path d="M0,0 L8,4 L0,8 Z" fill={color} />
                </marker>
                <marker id={endId} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 Z" fill={color} />
                </marker>
            </defs>
            <motion.path
                d={paths.main}
                stroke={color}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                markerStart={`url(#${startId})`}
                markerEnd={`url(#${endId})`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.2 }}
            />
            {paths.branches.map((d, i) => (
                <motion.path
                    key={i}
                    d={d}
                    stroke={color}
                    strokeWidth={2.5}
                    fill="none"
                    strokeLinecap="round"
                    markerEnd={`url(#${endId})`}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.2 }}
                />
            ))}
        </svg>
    )
}

// ===== Тренировочные задания — новые случайные (a, x, y), нужно кликнуть
// верный вариант ОТВЕТА (основание + число) среди вариантов. По прямой
// просьбе пользователя (2026-09-19, "сейчас основание уже показывают
// какое будет... давай варианты с разными основаниями") — раньше правая
// часть формулы уже показывала правильное основание готовым (logₐ?, менять
// нужно было только число x·y) — угадать можно было, даже не заметив, что
// у обеих частей суммы ОДИНАКОВОЕ основание. Теперь правая часть — ПОЛНОЕ
// "log?  ?" (и основание, и число — "?" до выбора), а сами варианты ответа
// — готовые ПАРЫ (основание, число), среди которых есть дистракторы с
// ЧУЖИМ основанием (не только с неверным числом) — клик по варианту
// подставляет обе части сразу.

type TrialOption = { base: number; value: number }
type LogTrial = { a: number; x: number; y: number; options: TrialOption[] }

const A_POOL = [2, 3, 5, 7, 9] as const
const XY_POOL = [2, 3, 4, 5, 6, 7, 8, 9] as const

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

const sameOption = (p: TrialOption | null, q: TrialOption): boolean =>
    p !== null && p.base === q.base && p.value === q.value

// Дистракторы — правдоподобные ошибки школьника, теперь СРАЗУ по двум
// осям: (1) число — сложил вместо того, чтобы умножить, ошибся на 1 в
// одном из множителей; (2) основание — самая частая ошибка тут взять
// основанием один из АРГУМЕНТОВ (x/y) вместо настоящего a. Ровно один
// вариант из четырёх — полностью верная пара {a, x·y}.
function makeOptionsFull(a: number, x: number, y: number): TrialOption[] {
    const correctValue = x * y
    const correct: TrialOption = { base: a, value: correctValue }

    const valueCandidates = new Set<number>()
    valueCandidates.add(x + y)
    valueCandidates.add(x * (y + 1))
    valueCandidates.add((x + 1) * y)
    valueCandidates.delete(correctValue)
    let valuePool = Array.from(valueCandidates).filter((n) => n > 0)
    let extraV = correctValue + 6
    while (valuePool.length < 2) {
        if (extraV !== correctValue && !valuePool.includes(extraV)) valuePool.push(extraV)
        extraV++
    }
    valuePool = shuffle(valuePool)

    const baseCandidates = shuffle(
        Array.from(new Set<number>([x, y, a + 1, a > 2 ? a - 1 : a + 2])).filter((n) => n > 1 && n !== a)
    )
    let extraB = a + 10
    while (baseCandidates.length < 2) {
        if (extraB !== a && !baseCandidates.includes(extraB)) baseCandidates.push(extraB)
        extraB++
    }

    const seen = new Set<string>([`${correct.base}:${correct.value}`])
    const options: TrialOption[] = [correct]
    const pushUnique = (opt: TrialOption) => {
        const key = `${opt.base}:${opt.value}`
        if (seen.has(key)) return
        seen.add(key)
        options.push(opt)
    }
    pushUnique({ base: baseCandidates[0], value: correctValue })
    pushUnique({ base: a, value: valuePool[0] })
    pushUnique({ base: baseCandidates[1], value: valuePool[1] ?? valuePool[0] })
    let guardBump = 1
    while (options.length < 4) {
        const b = baseCandidates[guardBump % baseCandidates.length] ?? a + guardBump
        pushUnique({ base: b, value: correctValue + guardBump * 5 })
        guardBump++
    }
    return shuffle(options)
}

const makeTrial = (prev: LogTrial | null): LogTrial => {
    let t: LogTrial
    let guard = 0
    do {
        const a = pick(A_POOL)
        const x = pick(XY_POOL)
        let y = pick(XY_POOL)
        while (y === x) y = pick(XY_POOL)
        t = { a, x, y, options: makeOptionsFull(a, x, y) }
        guard++
    } while (prev && t.a === prev.a && t.x === prev.x && t.y === prev.y && guard < 8)
    return t
}

const makeTrials = (n: number): LogTrial[] => {
    const out: LogTrial[] = []
    let prev: LogTrial | null = null
    for (let i = 0; i < n; i++) {
        const t = makeTrial(prev)
        out.push(t)
        prev = t
    }
    return out
}

// Похвала за верный ответ — детерминированно из полей самого задания (не
// Math.random() прямо в JSX внутри .map(), см. тот же приём и его причину
// в type-sinwalk.tsx).
const pickTrialFeedback = (t: LogTrial): string => {
    const seed = t.a * 7 + t.x * 3 + t.y
    return CORRECT_FEEDBACK_PHRASES[Math.abs(seed) % CORRECT_FEEDBACK_PHRASES.length]
}

// selected — заполняется ТОЛЬКО когда пользователь нашёл верный ответ
// (режим "пробуй, пока не угадаешь" — см. handleOptionClick), поэтому
// цвет при checked=true всегда "верно".
const LogTrialFormula = ({
    trial, selected, checked,
}: {
    trial: LogTrial; selected: TrialOption | null; checked: boolean
}) => {
    const { a, x, y } = trial
    const color = checked ? CORRECT_COLOR : '#F2F7FB'
    return (
        <div className="w-full flex items-center justify-center flex-wrap gap-x-2 gap-y-2 text-2xl md:text-3xl font-extrabold py-1">
            <span className="inline-flex items-baseline whitespace-nowrap">
                <Plain>log</Plain><sub className="ml-0.5"><Plain>{a}</Plain></sub>
                <span className="ml-1"><Plain>{x}</Plain></span>
            </span>
            <Plain>+</Plain>
            <span className="inline-flex items-baseline whitespace-nowrap">
                <Plain>log</Plain><sub className="ml-0.5"><Plain>{a}</Plain></sub>
                <span className="ml-1"><Plain>{y}</Plain></span>
            </span>
            <Plain>=</Plain>
            <span className="inline-flex items-baseline whitespace-nowrap">
                <Plain>log</Plain>
                <sub className="ml-0.5">
                    {selected === null ? (
                        <span style={{ color: ACTIVE_COLOR }} className="font-black">?</span>
                    ) : (
                        <motion.span
                            key={`base-${selected.base}`}
                            initial={{ scale: 2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 15 }}
                            style={{ color }}
                        >
                            {selected.base}
                        </motion.span>
                    )}
                </sub>
                <span className="ml-1">
                    {selected === null ? (
                        <span style={{ color: ACTIVE_COLOR }} className="font-black">?</span>
                    ) : (
                        <motion.span
                            key={`val-${selected.value}`}
                            initial={{ scale: 2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 15 }}
                            style={{ color }}
                        >
                            {selected.value}
                        </motion.span>
                    )}
                </span>
            </span>
        </div>
    )
}

export const TypeLogWalk = ({ onAnswer, onComplete }: Props) => {
    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
    const [hadMistake, setHadMistake] = useState(false)

    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)

    const [trials, setTrials] = useState<LogTrial[]>(() => makeTrials(TRIAL_COUNT))
    const [trialIndex, setTrialIndex] = useState(0)
    const [checked, setChecked] = useState(false)
    // Режим "пробуй, пока не угадаешь" (та же механика, что и у
    // LOGCOMBOWALK/LOGDEFWALK/SINWALK) — неверно нажатые пары ТЕКУЩЕГО
    // задания красятся красным и блокируются, wrongFlash — ПЕРСИСТЕНТНОЕ
    // сообщение под вариантами (не гаснет по таймеру).
    const [wrongTried, setWrongTried] = useState<TrialOption[]>([])
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)
    // Конфетти на финальный "Ответ: log₂15" (шаг 4 обучающей части) — по
    // прямой просьбе пользователя, во ВСЕХ таких "локальных ответах"
    // разбора (см. LocalAnswerConfetti). Отдельная конфетти на верный
    // ответ ТРЕНИРОВОЧНОГО задания — см. handleOptionClick ниже.
    const [showAnswerConfetti, setShowAnswerConfetti] = useState(false)

    // Контейнеры шагов 1/2 — нужны BaseMatchArrow, чтобы измерить реальные
    // позиции оснований (двоек) внутри каждого; шаг 3 (аргументы 3/5) —
    // ArgumentsArrow, чтобы измерить реальные позиции "+" и "·" (см.
    // компоненты выше).
    const step1Ref = useRef<HTMLDivElement>(null)
    const step2Ref = useRef<HTMLDivElement>(null)
    const step3Ref = useRef<HTMLDivElement>(null)

    const currentCorrectOption: TrialOption = {
        base: trials[trialIndex].a,
        value: trials[trialIndex].x * trials[trialIndex].y,
    }

    const handleOptionClick = (option: TrialOption) => {
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
                // onComplete — только красит маскота/локальный статус,
                // настоящее завершение вопроса — через onAnswer, как у
                // SINWALK/CHECK/FRACTRICK (те же самодостаточные типы).
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

    // Подпись кнопки "Дальше" — та же случайная вариативность, что и у
    // SINWALK, только после монтирования (не в рендере/useMemo — избегает
    // SSR/клиент-рассинхрона Math.random(), см. тот же комментарий там).
    // trialNextLabel — НЕ через отдельный эффект на смену trialIndex, а
    // выставляется ПРЯМО в handleOptionClick (см. ниже), т.к. её тон
    // (поздравительный/"принял, идём дальше") зависит от того, верно ли
    // ответили именно СЕЙЧАС.
    const [introNextLabel, setIntroNextLabel] = useState('Дальше')
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    useEffect(() => { setIntroNextLabel(pickWalkthroughNextLabel('Дальше')) }, [step])

    // Счётчики "повторов" — нужны, чтобы "назад" (см. handleBack ниже)
    // мог ПЕРЕМОНТИРОВАТЬ содержимое целевой сцены (Typewriter/
    // DiagramBlock/NumSticker заново проигрывают анимацию), не трогая
    // остальные — тот же общий хук, что и в SINWALK.
    const { bump: bumpNonce, nonceFor } = useReplayNonces()

    // Затемнение прошлых сцен + автоскролл к новой (см. useSceneFocus в
    // WalkthroughLog.tsx) — та же схема ключей, что и в SINWALK.
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

    // "Назад" — реальный откат на предыдущую сцену (не просто "полистать
    // взглядом"): состояние step/trialIndex/phase откатывается на target,
    // answer этой сцены сбрасывается, nonce цели бампается (её содержимое
    // ПЕРЕМОНТИРУЕТСЯ). Сцены ПОСЛЕ target сами исчезают из DOM.
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
                {/* Шаг 0 — просто условие, без текстовой подписи (по прямой
                    просьбе пользователя убрана целиком). stepReady включает
                    сама диаграмма (DiagramBlock.onSettled), раз текста
                    печатать больше не нужно. */}
                <SceneWrapper key="step-0" innerRef={sceneRef('step-0')} active={isSceneActive('step-0')}>
                    <Fragment key={`step-0-${nonceFor('step-0')}`}>
                        <DiagramBlock onSettled={() => setStepReady(true)}>
                            <ExampleFormula baseHighlighted={false} showRightSide={false} showProduct={false} showResult={false} />
                        </DiagramBlock>
                    </Fragment>
                </SceneWrapper>

                {/* Шаг 1 — основания (двойки) становятся стикерами; угловая
                    стрелка снизу с обоими концами на левую и правую двойку
                    ("2 — 2, одно и то же"); "2" в тексте объяснения — тоже
                    настоящий стикер. */}
                {step >= 1 && (
                    <SceneWrapper key="step-1" innerRef={sceneRef('step-1')} active={isSceneActive('step-1')}>
                        <Fragment key={`step-1-${nonceFor('step-1')}`}>
                            <DiagramBlock>
                                <div ref={step1Ref} className="relative w-full pb-9">
                                    <ExampleFormula baseHighlighted showRightSide={false} showProduct={false} showResult={false} />
                                    <BaseMatchArrow containerRef={step1Ref} markers={['base1', 'base2']} color={BASE_COLOR} />
                                </div>
                            </DiagramBlock>
                            <TypedLineWithSticker
                                before="Заметим что у них одинаковое основание - это "
                                stickerValue={2}
                                stickerColor={BASE_COLOR}
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 2 — справа дописывается "= log₂", то же основание;
                    угловая стрелка снизу теперь ДЛИННАЯ, с ТРЕМЯ указателями
                    — на обе левые двойки и на новую третью справа (все они
                    одно и то же число). */}
                {step >= 2 && (
                    <SceneWrapper key="step-2" innerRef={sceneRef('step-2')} active={isSceneActive('step-2')}>
                        <Fragment key={`step-2-${nonceFor('step-2')}`}>
                            <DiagramBlock>
                                <div ref={step2Ref} className="relative w-full pb-9">
                                    <ExampleFormula baseHighlighted showRightSide showProduct={false} showResult={false} />
                                    <BaseMatchArrow containerRef={step2Ref} markers={['base1', 'base2', 'base3']} color={BASE_COLOR} />
                                </div>
                            </DiagramBlock>
                            <TypedLineWithSticker
                                before="Поэтому получится логарифм с тем же основанием "
                                stickerValue={2}
                                stickerColor={BASE_COLOR}
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 3 — аргументы 3 и 5 РАЗНЫМИ цветами, стрелка от "+"
                    к "·" (сумма превращается в произведение). */}
                {step >= 3 && (
                    <SceneWrapper key="step-3" innerRef={sceneRef('step-3')} active={isSceneActive('step-3')}>
                        <Fragment key={`step-3-${nonceFor('step-3')}`}>
                            <DiagramBlock>
                                <div ref={step3Ref} className="relative w-full">
                                    <ExampleFormula baseHighlighted arg1Color={ARG_COLOR_X} arg2Color={ARG_COLOR_Y} showRightSide showProduct showResult={false} />
                                    <ArgumentsArrow containerRef={step3Ref} />
                                </div>
                            </DiagramBlock>
                            <TypedLineWithSticker
                                before="Так как логарифмы складываются, то аргументы надо "
                                stickerValue="перемножить"
                                stickerColor={ATTENTION_COLOR}
                                after="."
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 4 — итог. По прямой просьбе пользователя ВСЯ формула
                    здесь больше НЕ перерисовывается заново (это уже
                    показано в шаге 3 выше) — просто короткий "Ответ:
                    log₂15", с конфетти в момент появления. */}
                {step >= 4 && (
                    <SceneWrapper key="step-4" innerRef={sceneRef('step-4')} active={isSceneActive('step-4')}>
                        <Fragment key={`step-4-${nonceFor('step-4')}`}>
                            <AnswerLine onSettled={() => { setStepReady(true); setShowAnswerConfetti(true) }} />
                            {showAnswerConfetti && <LocalAnswerConfetti />}
                        </Fragment>
                    </SceneWrapper>
                )}

                {phase === 'practice' && Array.from({ length: trialIndex + 1 }).map((_, i) => {
                    const t = trials[i]
                    const isCurrent = i === trialIndex
                    const isDone = i < trialIndex || (isCurrent && checked)
                    const correctValue = t.x * t.y
                    const correctOpt: TrialOption = { base: t.a, value: correctValue }
                    return (
                        <SceneWrapper key={`trial-${i}`} innerRef={sceneRef(`trial-${i}`)} active={isSceneActive(`trial-${i}`)}>
                        <Fragment key={`trial-${i}-${nonceFor(`trial-${i}`)}`}>
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
                                    <span>{trials.length}</span>
                                </div>
                                <p className="flex-1 text-base md:text-lg text-[#F2F7FB]">
                                    Выбери правильный ответ:
                                </p>
                            </div>
                            <DiagramBlock>
                                <LogTrialFormula trial={t} selected={isDone ? correctOpt : null} checked={isDone} />
                            </DiagramBlock>
                            {isCurrent && !checked && (
                                <>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {t.options.map((opt, idx) => {
                                            const isWrongTriedOpt = wrongTried.some((w) => sameOption(w, opt))
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleOptionClick(opt)}
                                                    disabled={isWrongTriedOpt}
                                                    className={cn(
                                                        'min-w-[84px] py-3 px-4 rounded-xl border-2 text-lg md:text-xl font-bold transition-colors inline-flex items-baseline justify-center whitespace-nowrap',
                                                        isWrongTriedOpt
                                                            ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]'
                                                            : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]',
                                                    )}
                                                >
                                                    <Plain>log</Plain><sub className="ml-0.5"><Plain>{opt.base}</Plain></sub><span className="ml-1"><Plain>{opt.value}</Plain></span>
                                                </button>
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
                                <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#A1D15122] text-[#A1D151]">
                                    {pickTrialFeedback(t)}
                                </div>
                            )}
                            {/* Конфетти на верный ответ ТРЕНИРОВОЧНОГО
                                задания — только пока это ТЕКУЩЕЕ задание
                                (isCurrent), поэтому естественно
                                размонтируется, как только переходим к
                                следующему (см. LocalAnswerConfetti). */}
                            {isCurrent && isDone && <LocalAnswerConfetti />}
                            {/* "Огненная" анимация-подбадривание — только на
                                milestone-упражнениях (1-е, затем каждое 4-е —
                                см. isFieryMilestoneTrial), поверх обычного
                                confetti. */}
                            {isCurrent && isDone && isFieryMilestoneTrial(i) && <FieryCelebration />}
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
