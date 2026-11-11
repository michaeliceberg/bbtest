// app/t-lesson/[t_lessonId]/type-logsubwalk.tsx
//
// Тип LOGSUBWALK — разбор «как вычитать логарифмы»: log₂15 − log₂5 = log₂(15 : 5) = log₂3. Устроен так же, как LOGWALK
// (type-logwalk.tsx): одна сцена с растущей формулой (стикеры основания, двойная и тройная стрелки, сдвиг влево,
// две стрелки к «(15 : 5)», ответ «= log₂3» с конфетти), затем четыре задания в два этапа (основание, потом число).
// Самодостаточный тип: сам зовёт onAnswer/onComplete РОВНО один раз в конце; общая нижняя кнопка скрыта.

'use client'

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { showAnswerMeme } from '@/components/answer-meme-burst'
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
    isFieryMilestoneTrial, FieryFeedbackBanner,
    useWalkthroughCombo,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter, withBreaks } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'

// Пауза ПОСЛЕ клика "Дальше", ДО начала новой сцены — тот же приём и то
// же значение, что у SINWALK (см. там же комментарий).
const SCENE_TRANSITION_PAUSE_MS = 1000

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

const INTRO_STEPS = 4
const TRIAL_COUNT = 4

// Основание — синий (та же роль "величина, вводимая отдельно", что уже
// закреплена за синим в палитре ggege). Аргументы 3 и 5 — РАЗНЫЕ цвета
// (по прямой просьбе пользователя — одинаковый цвет для обоих читался
// как "это одно и то же число"), взяты из двух ролей палитры, пока
// свободных для новой задачи ("Малиновый/бирюзовый — пока используются
// только на /learn... свободны для новой роли", см. CLAUDE.md).
const BASE_COLOR = GGEGE_PALETTE.blue.button

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

// Основание, выделенное маркером (вариант «сплошной маркер, тёмная цифра», /test-base-marker): без рамки и без
// второго уменьшения — размер задаёт только индекс.
const BaseMark = ({ value }: { value: number | string }) => (
    <motion.span
        initial={{ scale: 2.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15 }}
        className="inline-block rounded-[3px] px-[3px] font-extrabold"
        style={{ background: BASE_COLOR, color: '#10181C', lineHeight: 1.15 }}
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
    base, arg, baseHighlighted, baseMarker, argMarker, ghost = false,
}: {
    base: number; arg: number; baseHighlighted: boolean; baseMarker?: string; argMarker?: string; ghost?: boolean
}) => (
    <span className="inline-flex items-baseline whitespace-nowrap">
        <Plain>log</Plain>
        <sub className="ml-0.5" data-marker={baseMarker}>
            {baseHighlighted ? <BaseMark value={base} /> : <Plain>{base}</Plain>}
        </sub>
        <span className="ml-1" data-marker={argMarker} style={{ opacity: ghost ? 0.28 : 1, transition: 'opacity 0.4s' }}>
            <Plain>{arg}</Plain>
        </span>
    </span>
)

type FormulaState = {
    baseHighlighted: boolean
    showRightSide: boolean
    // 'reserved' — «(3·5)» занимает место, но невидимо (стрелки целятся в него); 'shown' — падает баунсом
    product: 'reserved' | 'shown'
    rowRef: React.RefObject<HTMLDivElement | null>
    // сдвиг всей строки по X: пока справа ничего нет, левая часть стоит по центру (правая часть уже занимает место, но невидима)
    shift: number | null
    slide: boolean
    // вариант «числа летят»: ghost — исходные числа бледные, skeleton — скобки и знак справа, landed — числа сели на место; null — вариант со стрелками
    carry: { ghost: boolean; skeleton: boolean; landed: boolean } | null
}

// Строка примера «log₂3 + log₂5 = log₂(3·5)» — ОДНА на весь разбор, растёт на месте (MergedScene). Правая часть присутствует
// с самого начала невидимой, чтобы ничего не прыгало: левая часть сначала стоит по центру за счёт сдвига, потом плавно
// уезжает влево (slide), и справа проявляется «= log₂».
// data-marker: base1/2/3 — основания (BaseMatchArrow), arg3/arg5 и prod — аргументы и «(3·5)» (ProductArrows), rightgrp — правая часть.
const ExampleFormula = ({ baseHighlighted, showRightSide, product, rowRef, shift, slide, carry }: FormulaState) => {
    let tokenCount = 0
    const nextDelay = () => (tokenCount++) * 0.13
    return (
        <motion.div
            ref={rowRef as React.RefObject<HTMLDivElement>}
            className="w-full flex items-center justify-center flex-wrap gap-x-2 gap-y-2 text-[min(1.875rem,4.2vw)] font-extrabold py-1"
            style={{ opacity: shift === null ? 0 : 1 }}
            initial={false}
            animate={{ x: shift ?? 0 }}
            transition={{ duration: slide ? 0.9 : 0, ease: 'easeInOut' }}
        >
            <Token delay={nextDelay()}>
                <LogTerm base={2} arg={15} baseHighlighted={baseHighlighted} baseMarker="base1" argMarker="arg3" ghost={!!carry?.ghost} />
            </Token>
            <Token delay={nextDelay()}>
                <span className="text-[#F2F7FB]">−</span>
            </Token>
            <Token delay={nextDelay()}>
                <LogTerm base={2} arg={5} baseHighlighted={baseHighlighted} baseMarker="base2" argMarker="arg5" ghost={!!carry?.ghost} />
            </Token>
            <span data-marker="rightgrp" className="inline-flex items-center gap-x-2" style={{ opacity: showRightSide ? 1 : 0, transition: 'opacity 0.35s' }}>
                <Plain>=</Plain>
                <span className="inline-flex items-baseline whitespace-nowrap">
                    <Plain>log</Plain>
                    <sub className="ml-0.5" data-marker="base3">
                        <BaseMark key={showRightSide ? 'on' : 'off'} value={2} />
                    </sub>
                    {/* внешняя обёртка неподвижна — по ней стрелки меряют место, куда упадёт «(3·5)» */}
                    <span data-marker="prod" className="ml-1 inline-flex">
                        {carry ? (
                            <span className="inline-flex items-baseline gap-1 whitespace-nowrap text-[#F2F7FB]">
                                <span style={{ opacity: carry.skeleton || carry.landed ? 1 : 0, transition: 'opacity 0.4s' }}>(</span>
                                <span data-marker="pn1" style={{ opacity: carry.landed ? 1 : 0 }}>15</span>
                                <span style={{ opacity: carry.skeleton || carry.landed ? 1 : 0, transition: 'opacity 0.4s' }}>:</span>
                                <span data-marker="pn2" style={{ opacity: carry.landed ? 1 : 0 }}>5</span>
                                <span style={{ opacity: carry.skeleton || carry.landed ? 1 : 0, transition: 'opacity 0.4s' }}>)</span>
                            </span>
                        ) : (
                            <motion.span
                                className="inline-flex items-baseline gap-1 whitespace-nowrap text-[#F2F7FB]"
                                initial={false}
                                animate={product === 'shown' ? { y: 0, opacity: 1 } : { y: -70, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 11 }}
                            >
                                (15<span>:</span>5)
                            </motion.span>
                        )}
                    </span>
                </span>
            </span>
        </motion.div>
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
                    {withBreaks(before)}
                    {stickerValue !== '' && (stickerColor === BASE_COLOR ? <BaseMark value={stickerValue} /> : <NumSticker value={stickerValue} color={stickerColor} />)}
                    {withBreaks(after)}
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

// Две угловые стрелки НАД формулой: одна от тройки, другая от пятёрки — вправо, к месту, куда упадёт «(3·5)».
// Концы разведены (тройка целится правее, пятёрка левее) и мосты на разной высоте, чтобы линии не пересекались.
// Позиции измеряются по факту отрисовки (после каскада токенов).
const ProductArrows = ({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) => {
    const [paths, setPaths] = useState<string[] | null>(null)

    useEffect(() => {
        const measure = () => {
            const c = containerRef.current
            if (!c) return
            const q = (m: string) => c.querySelector<HTMLElement>(`[data-marker="${m}"]`)
            const a3 = q('arg3'), a5 = q('arg5'), prod = q('prod')
            if (!a3 || !a5 || !prod) return
            const cr = c.getBoundingClientRect()
            const r3 = a3.getBoundingClientRect(), r5 = a5.getBoundingClientRect(), rp = prod.getBoundingClientRect()
            const top = (r: DOMRect) => r.top - cr.top - ARROW_TIP_GAP
            const mid = (r: DOMRect) => r.left + r.width / 2 - cr.left
            const yEnd = rp.top - cr.top - 5
            const bridge = Math.min(top(r3), top(r5), yEnd)
            setPaths([
                buildElbowPath(mid(r3), top(r3), rp.left - cr.left + rp.width * 0.8, yEnd, bridge - 38),
                buildElbowPath(mid(r5), top(r5), rp.left - cr.left + rp.width * 0.26, yEnd, bridge - 16),
            ])
        }
        const t = setTimeout(measure, ARROW_MEASURE_MS)
        window.addEventListener('resize', measure)
        return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!paths) return null
    return (
        <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible', width: '100%', height: '100%' }}>
            <defs>
                <marker id="logsubwalk-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 Z" fill={ATTENTION_COLOR} />
                </marker>
            </defs>
            {paths.map((d, i) => (
                <motion.path
                    key={i}
                    d={d}
                    stroke={ATTENTION_COLOR}
                    strokeWidth={2.5}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    markerEnd="url(#logsubwalk-arrowhead)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.2 + i * 0.35 }}
                />
            ))}
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
                    const host = container.querySelector<HTMLElement>(`[data-marker="${m}"]`)
                    if (!host) return null
                    // маркер основания — первый ребёнок индекса; низ считаем от центра и высоты вёрстки, чтобы анимация scale не мешала
                    const el = (host.firstElementChild as HTMLElement | null) ?? host
                    const r = el.getBoundingClientRect()
                    return { x: r.left + r.width / 2 - cRect.left, y: r.top + r.height / 2 + el.offsetHeight / 2 - cRect.top + ARROW_TIP_GAP }
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
        const t = setTimeout(measure, ARROW_MEASURE_MS)
        window.addEventListener('resize', measure)
        return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!paths) return null
    const startId = `logsubwalk-base-arrow-start-${markers.join('-')}`
    const endId = `logsubwalk-base-arrow-end-${markers.join('-')}`
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

// Пауза между тем, как стрелка ДОРИСОВАЛАСЬ, и появлением текста — по
// прямой просьбе пользователя обе сцены с BaseMatchArrow (шаги 1 и 2)
// раскрываются строго последовательно: сначала диаграмма+стрелка, потом
// пауза, потом только текст — не всё разом, как раньше. Тот же принцип
// "не начинать следующий бит, пока не доиграл предыдущий", что уже
// применён в FluxScene (FARADAYWALK) / DefinitionSequence (LOGDEFWALK).
// Стрелки меряют позиции почти сразу (стикеры уже на месте), рисуются 0.2с задержка + 0.8с.
const ARROW_MEASURE_MS = 120
const ARROW_DRAW_MS = 1150

// Шаги 0-3 — ОДНА сцена с одной формулой, которая растёт на месте (по просьбе пользователя: не переписывать
// пример заново в каждой сцене). step приходит от родителя (кнопка), внутри — строгая очередь:
// 0: «Если вычитаем логарифмы с одинаковым основанием, например здесь это 2» → двойки стикерами и сразу двойная стрелка;
// 1: «Тогда получится логарифм с тем же основанием 2» → вся формула плавно уезжает влево → справа «= log₂» и сразу тройная стрелка;
// 2: прошлый текст бледнеет → «И, так как логарифмы вычитаются, то цифры 15 и 5 надо перемножить» → две стрелки вверху →
//    «(3·5)» падает баунсом;
// 3: прошлое бледнеет → с новой строки по центру «= log₂15» + конфетти.
// Как показываем «числа переезжают вправо»: 'carry' — числа поднимаются, летят над строкой и опускаются в скобки;
// 'arrows' — прежний вариант с двумя угловыми стрелками (ProductArrows), оставлен на случай, если к нему вернёмся.
const ARGS_ANIM: 'carry' | 'arrows' = 'carry'
type Flyer = { n: string; left: number; top: number; h: number; dx: number; dy: number; lift: number; delay: number }
type MergedArrow = 'none' | 'two' | 'three' | 'args'
const MergedScene = ({ step, onSettled }: { step: number; onSettled: () => void }) => {
    const [lines, setLines] = useState(0)
    const [sticks, setSticks] = useState(false)
    const [rightSide, setRightSide] = useState(false)
    const [product, setProduct] = useState<'reserved' | 'shown'>('reserved')
    const [arrow, setArrow] = useState<MergedArrow>('none')
    const [shift, setShift] = useState<number | null>(null)
    const [slide, setSlide] = useState(false)
    const [answer, setAnswer] = useState(false)
    const [ghost, setGhost] = useState(false)
    const [skeleton, setSkeleton] = useState(false)
    const [landed, setLanded] = useState(false)
    const [flyers, setFlyers] = useState<Flyer[] | null>(null)
    const ref = useRef<HTMLDivElement>(null)
    const rowRef = useRef<HTMLDivElement>(null)
    const timers = useRef<ReturnType<typeof setTimeout>[]>([])
    const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)) }

    // Пока справа пусто, левая часть стоит по центру: сдвигаем строку вправо на половину ширины невидимой правой части.
    // DiagramBlock монтирует детей не сразу, поэтому пробуем, пока строка не появится.
    useLayoutEffect(() => {
        const measure = (): boolean => {
            const row = rowRef.current
            if (!row) return false
            const grp = row.querySelector<HTMLElement>('[data-marker="rightgrp"]')
            const a5 = row.querySelector<HTMLElement>('[data-marker="arg5"]')
            if (!grp || !a5) return false
            if (!slide) setShift(Math.round((grp.getBoundingClientRect().right - a5.getBoundingClientRect().right) / 2))
            return true
        }
        const poll = setInterval(() => { if (measure()) clearInterval(poll) }, 60)
        const onResize = () => { measure() }
        window.addEventListener('resize', onResize)
        return () => { clearInterval(poll); window.removeEventListener('resize', onResize) }
    }, [slide])

    useEffect(() => {
        const list = timers.current
        if (step === 0) later(() => setLines(1), 1100)
        if (step === 1) later(() => setLines(2), 300)
        if (step === 2) {
            setArrow('none')
            later(() => setLines(3), 900)
        }
        if (step === 3) {
            later(() => setAnswer(true), 800)
            later(onSettled, 1900)
        }
        return () => { list.forEach(clearTimeout); list.length = 0 }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step])

    // Числа поднимаются над строкой (исходные остаются бледными), пауза, летят вправо и опускаются в скобки.
    const startCarry = () => {
        const c = ref.current
        const q = (m: string) => c?.querySelector<HTMLElement>(`[data-marker="${m}"]`) ?? null
        const pairs: [string, string, string, number][] = [['arg3', 'pn1', '15', 0], ['arg5', 'pn2', '5', 0.12]]
        if (!c || pairs.some(([a, b]) => !q(a) || !q(b))) { setLanded(true); later(onSettled, 600); return }
        const cr = c.getBoundingClientRect()
        const list: Flyer[] = pairs.map(([a, b, n, delay]) => {
            const ra = q(a)!.getBoundingClientRect(), rb = q(b)!.getBoundingClientRect()
            return { n, left: ra.left - cr.left, top: ra.top - cr.top, h: ra.height, dx: rb.left - ra.left, dy: rb.top - ra.top, lift: ra.height * 1.1, delay }
        })
        setGhost(true)
        setFlyers(list)
        later(() => setSkeleton(true), 1300)
        later(() => { setLanded(true); setFlyers(null) }, 2900)
        later(onSettled, 3900)
    }

    const dim = (n: number) => (lines > n || step >= 2 && n < 3 || step >= 3)
        ? { opacity: 0.35, filter: 'grayscale(1)', transition: 'opacity 0.4s' }
        : { transition: 'opacity 0.4s' }

    return (
        <>
            <DiagramBlock>
                <div ref={ref} className="relative w-full overflow-x-clip pt-12 pb-9">
                    <ExampleFormula baseHighlighted={sticks} showRightSide={rightSide} product={product} rowRef={rowRef} shift={shift} slide={slide} carry={ARGS_ANIM === 'carry' ? { ghost, skeleton, landed } : null} />
                    {answer && (
                        <motion.div
                            className="w-full text-center text-[min(1.875rem,4.2vw)] font-extrabold py-1"
                            style={{ color: CORRECT_COLOR }}
                            initial={{ scale: 2.2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                        >
                            = log<sub className="ml-0.5">2</sub><span className="ml-1">3</span>
                        </motion.div>
                    )}
                    {flyers?.map((f) => (
                        <motion.span
                            key={f.n + f.left}
                            className="absolute whitespace-nowrap font-extrabold text-[min(1.875rem,4.2vw)]"
                            style={{ left: f.left, top: f.top, height: f.h, lineHeight: `${f.h}px`, color: ATTENTION_COLOR }}
                            initial={{ x: 0, y: 0 }}
                            animate={{ x: [0, 0, 0, f.dx, f.dx], y: [0, -f.lift, -f.lift, -f.lift, f.dy] }}
                            transition={{ duration: 2.6, delay: f.delay, times: [0, 0.15, 0.4, 0.8, 1], ease: 'easeInOut' }}
                        >
                            {f.n}
                        </motion.span>
                    ))}
                    {arrow === 'two' && <BaseMatchArrow key="two" containerRef={ref} markers={['base1', 'base2']} color={BASE_COLOR} />}
                    {arrow === 'three' && <BaseMatchArrow key="three" containerRef={ref} markers={['base1', 'base2', 'base3']} color={BASE_COLOR} />}
                    {arrow === 'args' && <ProductArrows containerRef={ref} />}
                </div>
            </DiagramBlock>
            {answer && <LocalAnswerConfetti />}
            {lines >= 1 && (
                <div style={dim(1)}>
                    <TypedLineWithSticker
                        before="Если вычитаем логарифмы с одинаковым основанием, например здесь это "
                        stickerValue={2}
                        stickerColor={BASE_COLOR}
                        after="."
                        onSettled={() => {
                            // двойки становятся стикерами и сразу рисуется двойная стрелка
                            setSticks(true)
                            setArrow('two')
                            later(onSettled, ARROW_MEASURE_MS + ARROW_DRAW_MS + 300)
                        }}
                    />
                </div>
            )}
            {lines >= 2 && (
                <div style={dim(2)}>
                    <TypedLineWithSticker
                        before="Тогда получится логарифм с тем же основанием "
                        stickerValue={2}
                        stickerColor={BASE_COLOR}
                        onSettled={() => {
                            setArrow('none')
                            setSlide(true)
                            setShift(0)
                            // формула доехала влево → справа «= log₂» и сразу тройная стрелка
                            later(() => {
                                setRightSide(true)
                                setArrow('three')
                                later(onSettled, ARROW_MEASURE_MS + ARROW_DRAW_MS + 300)
                            }, 950)
                        }}
                    />
                </div>
            )}
            {lines >= 3 && (
                <div style={dim(3)}>
                    <TypedLineWithSticker
                        before={"И, так как ЛОГАРИФМЫ ВЫЧИТАЮТСЯ,\nто цифры 15 и 5 надо "}
                        stickerValue="РАЗДЕЛИТЬ"
                        stickerColor={ATTENTION_COLOR}
                        after="."
                        onSettled={() => {
                            if (ARGS_ANIM === 'carry') { later(startCarry, 600); return }
                            // две стрелки сверху → «(15:5)» падает баунсом → кнопка
                            later(() => setArrow('args'), 600)
                            later(() => setProduct('shown'), 600 + ARROW_MEASURE_MS + ARROW_DRAW_MS + 500)
                            later(onSettled, 600 + ARROW_MEASURE_MS + ARROW_DRAW_MS + 500 + 1300)
                        }}
                    />
                </div>
            )}
        </>
    )
}

// ===== Тренировочные задания — новые случайные (a, x, y). Правая часть «log□ □» собирается в ДВА этапа
// (по просьбе пользователя, как слоты в теореме Виета): сначала из вариантов выбираем основание, затем число.
// Активный пропуск — цветной пунктирный квадратик, который «дышит» (увеличивается и уменьшается).
// Два этапа на задание: сначала выбираем ОСНОВАНИЕ (первый пропуск), потом ЧИСЛО под логарифмом (второй).
// x КРАТНО y, ответ q = x : y.
type LogTrial = { a: number; x: number; y: number; q: number; baseOptions: number[]; valueOptions: number[] }

const A_POOL = [2, 3, 5, 7, 9] as const
const Y_POOL = [2, 3, 4, 5, 6] as const
const Q_POOL = [2, 3, 4, 5, 6, 7, 8, 9] as const

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

// Дистракторы — типичные ошибки школьника. Основание: взял один из аргументов вместо настоящего a.
// Число: вычел аргументы вместо деления, ошибся на единицу в частном.
function makeStageOptions(a: number, x: number, y: number, q: number): { baseOptions: number[]; valueOptions: number[] } {
    const uniq = (list: number[], bad: number, min: number) => Array.from(new Set(list)).filter((n) => n >= min && n !== bad)
    const baseWrong = shuffle(uniq([y, q, a + 1, a > 2 ? a - 1 : a + 2, a + 3], a, 2)).slice(0, 3)
    const valueWrong = shuffle(uniq([x - y, q + 1, q - 1, q + 6, y], q, 1)).slice(0, 3)
    return { baseOptions: shuffle([a, ...baseWrong]), valueOptions: shuffle([q, ...valueWrong]) }
}

const makeTrial = (prev: LogTrial | null): LogTrial => {
    let t: LogTrial
    let guard = 0
    do {
        const a = pick(A_POOL)
        const y = pick(Y_POOL)
        const q = pick(Q_POOL)
        const x = y * q
        t = { a, x, y, q, ...makeStageOptions(a, x, y, q) }
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

// Пропуск-квадратик: пунктирный, активный — цветной и «дышит»; заполненный — число влетает пружиной.
const TrialSlot = ({ value, active, color, done, small = false }: { value: number | null; active: boolean; color: string; done: boolean; small?: boolean }) => (
    value === null ? (
        <span
            className={cn('inline-block align-middle rounded-md border-2 border-dashed', active && 'animate-slot-breathe')}
            style={{
                width: small ? '1.3em' : '0.95em', height: small ? '1.4em' : '1.05em',
                borderColor: active ? color : '#3A464E',
                backgroundColor: active ? hexToRgba(color, 0.18) : 'transparent',
            }}
        />
    ) : (
        <motion.span
            initial={{ scale: 2.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 15 }}
            className="inline-block"
            style={{ color: done ? CORRECT_COLOR : '#F2F7FB' }}
        >
            {value}
        </motion.span>
    )
)

const TRIAL_BASE_SLOT_COLOR = BASE_COLOR
const TRIAL_VALUE_SLOT_COLOR = GGEGE_PALETTE.purple.button

const LogTrialFormula = ({
    trial, baseDone, valueDone,
}: {
    trial: LogTrial; baseDone: boolean; valueDone: boolean
}) => {
    const { a, x, y, q } = trial
    return (
        <div className="w-full flex items-center justify-center flex-wrap gap-x-2 gap-y-2 text-2xl md:text-3xl font-extrabold py-1">
            <span className="inline-flex items-baseline whitespace-nowrap">
                <Plain>log</Plain><sub className="ml-0.5"><Plain>{a}</Plain></sub>
                <span className="ml-1"><Plain>{x}</Plain></span>
            </span>
            <Plain>−</Plain>
            <span className="inline-flex items-baseline whitespace-nowrap">
                <Plain>log</Plain><sub className="ml-0.5"><Plain>{a}</Plain></sub>
                <span className="ml-1"><Plain>{y}</Plain></span>
            </span>
            <Plain>=</Plain>
            <span className="inline-flex items-baseline whitespace-nowrap">
                <Plain>log</Plain>
                <sub className="ml-0.5">
                    <TrialSlot value={baseDone ? a : null} active={!baseDone} color={TRIAL_BASE_SLOT_COLOR} done={valueDone} small />
                </sub>
                <span className="ml-1">
                    <TrialSlot value={valueDone ? q : null} active={baseDone && !valueDone} color={TRIAL_VALUE_SLOT_COLOR} done={valueDone} />
                </span>
            </span>
        </div>
    )
}

export const TypeLogSubWalk = ({ onAnswer, onComplete }: Props) => {
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
    const [wrongTried, setWrongTried] = useState<number[]>([])
    // этап текущего задания: false — выбираем основание, true — основание выбрано, выбираем число
    const [baseDone, setBaseDone] = useState(false)
    const registerCombo = useWalkthroughCombo()
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)

    const handleOptionClick = (n: number) => {
        if (checked) return
        if (wrongTried.includes(n)) return
        const t = trials[trialIndex]
        const correct = baseDone ? t.q : t.a
        if (n === correct) {
            registerCombo(wrongTried.length === 0)
            if (!baseDone) {
                // основание на месте → второй этап
                setBaseDone(true)
                setWrongTried([])
                setWrongFlash(null)
                return
            }
            showAnswerMeme(true)
            setChecked(true)
            setTrialNextLabel(pickWalkthroughNextLabel('Дальше'))
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setHadMistake(true)
            showAnswerMeme(false)
            setWrongTried((prev) => [...prev, n])
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
            setBaseDone(false)
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
    const stepLabel = ['Вижу 👀 одинаковые основания', 'Основание такое же', 'Понял, делим'][step] ?? introNextLabel

    // Счётчики "повторов" — нужны, чтобы "назад" (см. handleBack ниже)
    // мог ПЕРЕМОНТИРОВАТЬ содержимое целевой сцены (Typewriter/
    // DiagramBlock/NumSticker заново проигрывают анимацию), не трогая
    // остальные — тот же общий хук, что и в SINWALK.
    const { bump: bumpNonce, nonceFor } = useReplayNonces()

    // Затемнение прошлых сцен + автоскролл к новой (см. useSceneFocus в
    // WalkthroughLog.tsx) — та же схема ключей, что и в SINWALK.
    const latestSceneKey = phase === 'intro' ? 'step-0' : `trial-${trialIndex}`
    const prevSceneKeyOf = (key: string): string | null => {
        if (key.startsWith('trial-')) {
            const idx = Number(key.slice('trial-'.length))
            return idx > 0 ? `trial-${idx - 1}` : 'step-0'
        }
        if (key.startsWith('step-')) {
            return null
        }
        return null
    }
    const contentSettled = phase === 'intro' ? stepReady : checked
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, contentSettled)
    const canGoBack = prevSceneKeyOf(latestSceneKey) !== null || (phase === 'intro' && step > 0)
    // "Повторить" — переигрывает анимацию ТЕКУЩЕЙ сцены заново, не трогая
    // состояние (в отличие от handleBack ниже) — та же пара useReplayNonces,
    // что уже используется для отката.
    const handleReplay = () => {
        // сцена с растущей формулой проигрывается с самого начала
        if (latestSceneKey === 'step-0') { setStep(0); setStepReady(false) }
        else { setChecked(false); setBaseDone(false); setWrongTried([]); setWrongFlash(null) }
        bumpNonce(latestSceneKey)
    }

    // "Назад" — реальный откат на предыдущую сцену (не просто "полистать
    // взглядом"): состояние step/trialIndex/phase откатывается на target,
    // answer этой сцены сбрасывается, nonce цели бампается (её содержимое
    // ПЕРЕМОНТИРУЕТСЯ). Сцены ПОСЛЕ target сами исчезают из DOM.
    const handleBack = () => {
        if (advancing) return
        if (phase === 'intro' && step > 0) {
            bumpNonce('step-0'); setStep(0); setStepReady(false)
            return
        }
        const target = prevSceneKeyOf(latestSceneKey)
        if (!target) return
        bumpNonce(target)
        if (target.startsWith('trial-')) {
            const idx = Number(target.slice('trial-'.length))
            setTrialIndex(idx)
            setChecked(false)
            setBaseDone(false)
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
                {/* Шаги 0-3 — одна сцена с растущей формулой (MergedScene). */}
                <SceneWrapper key="step-0" innerRef={sceneRef('step-0')} active={isSceneActive('step-0')}>
                    <Fragment key={`step-0-${nonceFor('step-0')}`}>
                        <MergedScene step={step} onSettled={() => setStepReady(true)} />
                    </Fragment>
                </SceneWrapper>

                {phase === 'practice' && Array.from({ length: trialIndex + 1 }).map((_, i) => {
                    const t = trials[i]
                    const isCurrent = i === trialIndex
                    const isDone = i < trialIndex || (isCurrent && checked)
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
                                    {isDone || !isCurrent ? 'Собрали логарифм' : baseDone ? 'Что под логарифмом?' : 'Какое основание?'}
                                </p>
                            </div>
                            <DiagramBlock>
                                <LogTrialFormula trial={t} baseDone={isDone || (isCurrent && baseDone)} valueDone={isDone} />
                            </DiagramBlock>
                            {isCurrent && !checked && (
                                <>
                                    <div key={baseDone ? 'value' : 'base'} className="drop-in-options flex flex-wrap justify-center gap-3">
                                        {(baseDone ? t.valueOptions : t.baseOptions).map((n) => {
                                            const isWrongTriedOpt = wrongTried.includes(n)
                                            return (
                                                <button
                                                    key={n}
                                                    type="button"
                                                    onClick={() => handleOptionClick(n)}
                                                    disabled={isWrongTriedOpt}
                                                    className={cn(
                                                        'min-w-[72px] py-3 px-4 rounded-xl border-2 text-xl md:text-2xl font-extrabold transition-colors inline-flex items-center justify-center',
                                                        isWrongTriedOpt
                                                            ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]'
                                                            : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]',
                                                    )}
                                                >
                                                    {n}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    {wrongFlash ? (
                                        <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#DC605B22] text-[#DC605B]">
                                            <X className="w-5 h-5" /> {wrongFlash}
                                        </div>
                                    ) : (
                                        null
                                    )}
                                </>
                            )}
                            {isDone && (
                                <FieryFeedbackBanner fiery={isCurrent && isFieryMilestoneTrial(i)}>
                                    {pickTrialFeedback(t)}
                                </FieryFeedbackBanner>
                            )}
                            {/* Конфетти на верный ответ ТРЕНИРОВОЧНОГО
                                задания — только пока это ТЕКУЩЕЕ задание
                                (isCurrent), поэтому естественно
                                размонтируется, как только переходим к
                                следующему (см. LocalAnswerConfetti). */}
                            {isCurrent && isDone && <LocalAnswerConfetti />}
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
                        {stepLabel}
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
