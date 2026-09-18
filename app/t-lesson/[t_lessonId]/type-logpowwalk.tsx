// app/t-lesson/[t_lessonId]/type-logpowwalk.tsx
//
// Тип LOGPOWWALK — интерактивный разбор по шагам "степень в основании и
// аргументе" (log_{a^n} b^m = (m/n)·log_a b) — тот же архитектурный
// принцип, что у SINWALK/LOGWALK/LOGDEFWALK/LOGSUBWALK: компонент сам
// ведёт хореографию и зовёт onAnswer/onComplete РОВНО один раз в конце;
// общая нижняя кнопка скрыта — своя кнопка "Дальше"/"Готово" на
// протяжении всего прохождения.
//
// Сюжет — прямая инструкция пользователя, на ОДНОМ фиксированном примере
// с однозначными числами (a=2, n=3, b=5, m=7 — log₂³5⁷):
// 1. Пишем крупно "log_{2³}5⁷ = ?" — просто условие.
// 2. Обводим ОБА показателя степени (3 и 7) как стикеры — РАЗНЫМИ
//    цветами (та же причина, что и у аргументов x/y в LOGWALK —
//    одинаковый цвет читался бы как "это одно и то же число"): m=7
//    (показатель аргумента) — teal, n=3 (показатель основания) — raspberry.
// 3. "Эти степени можно снести перед логарифмом" — 7 (показатель
//    аргумента) становится ЧИСЛИТЕЛЕМ дроби, стрелка от 7-в-степени к
//    7-в-числителе (реальные координаты, тот же приём measure+quadratic
//    bezier, что уже в ArgumentsArrow LOGWALK/LOGSUBWALK — направление
//    считается по факту отрисовки, не подгоняется вручную).
// 4. "А 3 (показатель основания) становится ЗНАМЕНАТЕЛЕМ" — отдельная
//    сцена, отдельная стрелка от 3-в-степени к 3-в-знаменателе.
// 5. "Ответ: 7/3 log₂5".
//
// После разбора — тренировочные задания с НОВЫМИ случайными числами
// (log_{a^n} b^m = ?), нужно кликнуть верную формулу-ответ среди 4
// вариантов (дистракторы — перепутанные числитель/знаменатель, перепутанные
// основание/аргумент, ошибка на 1) — тот же формат клика по варианту, что
// у LOGWALK/LOGSUBWALK, только вариант — не число, а компактная формула.

'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'
import {
    TypedLine, DiagramBlock,
    pickWalkthroughNextLabel, CORRECT_FEEDBACK_PHRASES,
    ACTIVE_COLOR, CORRECT_COLOR,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton,
} from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'

// Тот же приём и то же значение, что у SINWALK/LOGWALK/LOGSUBWALK.
const SCENE_TRANSITION_PAUSE_MS = 1000

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

const INTRO_STEPS = 5
const TRIAL_COUNT = 4

// Фиксированный обучающий пример — a=2 (основание), n=3 (степень
// основания → знаменатель), b=5 (аргумент), m=7 (степень аргумента →
// числитель). Однозначные числа по прямой просьбе пользователя ("чтобы
// было легче увидеть").
const A = 2
const N = 3
const B = 5
const M = 7

// m — teal, n — синий: те же две "свободные" роли палитры ggege, что
// уже закреплены в LOGWALK/LOGSUBWALK за двумя РАЗНЫМИ величинами одной
// формулы (не один общий цвет — иначе читалось бы как "одно и то же число").
// Раньше n был raspberry (малиновый) — пользователь пожаловался, что
// стикер "3" сливался с тёмным фоном страницы (малиновый заметно темнее/
// приглушённее teal на этом фоне); синий даёт заметно выше контраст.
const M_COLOR = GGEGE_PALETTE.teal.button
const N_COLOR = GGEGE_PALETTE.blue.button

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

// ===== Общие строительные блоки (HTML+CSS, без KaTeX — та же причина, что
// и в LOGWALK/LOGSUBWALK: короткая целочисленная запись не требует
// формульного рендера, а HTML избавляет от KaTeX-сегментирования). =====

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

// Показатель степени — НЕ нативный <sup> (даёт разный визуальный масштаб/
// высоту в зависимости от того, вложен он в <sub> или в обычный baseline-
// контекст — нашёл живьём: "7" у аргумента получался заметно крупнее и
// выше, чем "3" у основания, хотя должны читаться как единый приём).
// Явный `position:relative`+`top`+`font-size` в одних и тех же em-долях
// даёт одинаковую ОТНОСИТЕЛЬНУЮ посадку в обоих местах — абсолютный
// размер у "3" (внутри уже уменьшенного <sub>) естественно чуть меньше,
// чем у "7" (в обычном baseline), что и требуется для настоящей
// вложенной типографики (степень степени мельче степени).
// Увеличено с 0.6em до 0.78em по прямой просьбе пользователя ("степени
// очень маленького размера шрифта") — см. ТАКЖЕ фикс ниже: главная
// причина крошечных стикер-степеней была не в самом Exp, а в том, что
// стикер внутри Exp дополнительно применял свой собственный "small"
// (ещё ×0.6) — итоговый масштаб схлопывался до ~0.36em. small убран у
// стикеров степеней (см. PowFormula), Exp сам держит разумный масштаб.
const Exp = ({ children }: { children: React.ReactNode }) => (
    <span className="relative inline-block ml-px" style={{ fontSize: '0.78em', top: '-0.8em' }}>{children}</span>
)

// Дробь "числитель / знаменатель" — классическая CSS-подложка (нижняя
// граница числителя = черта дроби). numMarker/denMarker — опциональные
// data-marker для измерения реальных координат стрелкой (см. TravelArrow).
// Размер увеличен 0.62em→0.72em (та же просьба "увеличить пропорционально",
// см. Exp выше — теперь совпадает по масштабу с самими степенями, единый
// размер для одной и той же величины до/после переноса).
// inline-block + align-middle (не inline-flex+items-center) — иначе
// соседний inline-flex-блок логарифма (LogTerm/лог+аргумент) центрируется
// по высоте СВОЕГО бокса относительно дроби, а не по общей строке, из-за
// разницы в фактической высоте блоков (дробь мельче) лог визуально
// "проваливался" ниже строки (баг, найденный пользователем на "Ответ:").
// vertical-align:middle — стандартный браузерный механизм именно для
// этого случая (тот же приём, что и у инлайновых иконок рядом с текстом):
// центрирует дробь относительно математической оси строки, а соседний
// лог-терм остаётся на обычной text-baseline — как и должно быть.
const Fraction = ({
    num, den, numMarker, denMarker,
}: { num: React.ReactNode; den: React.ReactNode; numMarker?: string; denMarker?: string }) => (
    <span className="inline-block align-middle leading-none mr-2" style={{ fontSize: '0.72em' }}>
        <span data-marker={numMarker} className="block px-1.5 pb-1 border-b-2 border-[#F2F7FB]/70 min-w-[1.5em] text-center">{num}</span>
        <span data-marker={denMarker} className="block px-1.5 pt-1 min-w-[1.5em] text-center">{den}</span>
    </span>
)

// Полная строка примера "log_{a^n} b^m = [7/3] log_a b" — тот же
// накопительный приём, что у LOGWALK/LOGSUBWALK: на каждом шаге разбора
// рисуется НОВЫЙ (не мутирующий предыдущий) экземпляр с накопленными
// флагами. containerRef нужен только тем шагам, где рисуется стрелка (см.
// TravelArrow) — измеряет data-marker'ы ВНУТРИ этого же экземпляра.
// a/n/b/m — по умолчанию фиксированный обучающий пример (A/N/B/M), но
// ТРЕНИРОВОЧНЫЕ задания передают СВОИ случайные числа — без этого
// параметра вопрос тренировки всегда показывал бы "log₂³5⁷" независимо
// от реально сгенерированных вариантов ответа (реальный баг, пойманный
// живьём при первой проверке).
const PowFormula = ({
    a = A, n = N, b = B, m = M, exponentsAsStickers, showRHS, numeratorFilled, denominatorFilled, containerRef,
}: {
    a?: number; n?: number; b?: number; m?: number
    exponentsAsStickers: boolean; showRHS: boolean; numeratorFilled: boolean; denominatorFilled: boolean
    containerRef?: React.Ref<HTMLDivElement>
}) => (
    <div ref={containerRef} className="w-full flex items-center justify-center flex-wrap gap-x-2 gap-y-3 text-2xl md:text-3xl font-extrabold py-1">
        <span className="inline-flex items-baseline whitespace-nowrap">
            <Plain>log</Plain>
            <sub className="ml-0.5 inline-flex items-baseline">
                <Plain>{a}</Plain>
                <Exp>
                    <span data-marker="exp-n">
                        {/* small снят — Exp УЖЕ даёт масштаб 0.78em, добавочный
                            "small" (ещё ×0.6) схлопывал степень до крошечного
                            размера, см. комментарий у Exp выше. */}
                        {exponentsAsStickers ? <NumSticker value={n} color={N_COLOR} /> : <Plain>{n}</Plain>}
                    </span>
                </Exp>
            </sub>
            <span className="ml-1.5 inline-flex items-baseline">
                <Plain>{b}</Plain>
                <Exp>
                    <span data-marker="exp-m">
                        {exponentsAsStickers ? <NumSticker value={m} color={M_COLOR} /> : <Plain>{m}</Plain>}
                    </span>
                </Exp>
            </span>
        </span>
        <Plain>=</Plain>
        {showRHS ? (
            // НЕ flex — inline поток, чтобы у Fraction (align-middle) и у
            // лог-терма (обычный baseline) сработало обычное браузерное
            // вертикальное выравнивание относительно ОДНОЙ строки (см.
            // комментарий у Fraction выше про баг "лог провалился ниже").
            <span className="whitespace-nowrap">
                <Fraction
                    num={numeratorFilled ? <NumSticker value={m} color={M_COLOR} /> : <span className="opacity-30">?</span>}
                    den={denominatorFilled ? <NumSticker value={n} color={N_COLOR} /> : <span className="opacity-30">?</span>}
                    numMarker="num-target"
                    denMarker="den-target"
                />
                <span className="inline-flex items-baseline whitespace-nowrap">
                    <Plain>log</Plain><sub className="ml-0.5"><Plain>{a}</Plain></sub>
                    <span className="ml-1"><Plain>{b}</Plain></span>
                </span>
            </span>
        ) : (
            <QuestionMark />
        )}
    </div>
)

// "Уголок" (elbow/orthogonal-connector) со скруглёнными углами — по
// прямой просьбе пользователя вместо гладкой дуги: от точки A едем по
// вертикали к горизонтальному "мосту", проезжаем по нему, спускаемся/
// поднимаемся в точку B — тот же приём, что в диаграммных инструментах
// ("orthogonal routing"), просто без острых 90° — угол сглажен небольшим
// радиусом. Скругление — квадратичная кривая через САМУ угловую точку как
// control point (классический трюк "смягчить угол": кривая проходит РЯДОМ
// с углом, не через него, — не нужно вычислять центр отдельной дуги).
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

// Стрелка от одного data-marker к другому ВНУТРИ containerRef — реальные
// координаты, направление НЕ подгоняется вручную, обобщена на произвольную
// пару маркеров + свой цвет — здесь нужны ДВЕ независимые стрелки
// (числитель/знаменатель) на РАЗНЫХ шагах. curve — куда выгибается
// горизонтальный "мост" уголка: 'up' (мост ВЫШЕ обоих концов — подходит
// для шага "в числитель", идём вверх-и-через-верх) или 'down' (мост НИЖЕ
// обоих концов — обязателен для шага "в знаменатель": знаменатель физически
// ниже строки, и если мост всё равно тянуть вверх, путь возвращается назад
// через верх формулы и рисуется ПОВЕРХ чисел — баг, найденный пользователем).
const TravelArrow = ({
    containerRef, fromMarker, toMarker, color, curve = 'up',
}: { containerRef: React.RefObject<HTMLDivElement | null>; fromMarker: string; toMarker: string; color: string; curve?: 'up' | 'down' }) => {
    const [d, setD] = useState<string | null>(null)

    useEffect(() => {
        const measure = () => {
            const container = containerRef.current
            if (!container) return
            const fromEl = container.querySelector<HTMLElement>(`[data-marker="${fromMarker}"]`)
            const toEl = container.querySelector<HTMLElement>(`[data-marker="${toMarker}"]`)
            if (!fromEl || !toEl) return
            const cRect = container.getBoundingClientRect()
            const fRect = fromEl.getBoundingClientRect()
            const tRect = toEl.getBoundingClientRect()
            const x1 = fRect.left + fRect.width / 2 - cRect.left
            const y1 = fRect.top - cRect.top
            const x2 = tRect.left + tRect.width / 2 - cRect.left
            const y2 = tRect.top - cRect.top
            let bridgeY: number
            if (curve === 'up') {
                bridgeY = Math.min(y1, y2) - 26
            } else {
                // "Вниз" — мост должен быть НИЖЕ реальных НИЖНИХ краёв обоих
                // боксов (не просто ниже их верхних якорных точек y1/y2), а
                // денаменатор к тому же соседствует с "log_a b" того же роста,
                // что и главный текст формулы — если считать зазор только от
                // y1/y2 (верх), мост едет прямо ПОСЕРЕДИНЕ строки и режет
                // текст (баг, найденный пользователем на скриншоте).
                const fBottom = fRect.bottom - cRect.top
                const tBottom = tRect.bottom - cRect.top
                bridgeY = Math.max(fBottom, tBottom) + 34
            }
            setD(buildElbowPath(x1, y1, x2, y2, bridgeY))
        }
        // Ждём, пока bounce-стикеры и раскладка осядут, прежде чем мерить
        // реальные позиции (тот же таймаут, что и в LOGWALK).
        const t = setTimeout(measure, 750)
        window.addEventListener('resize', measure)
        return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!d) return null
    const markerId = `logpowwalk-arrowhead-${fromMarker}`
    return (
        <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible', width: '100%', height: '100%' }}>
            <defs>
                <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 Z" fill={color} />
                </marker>
            </defs>
            <motion.path
                d={d}
                stroke={color}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                markerEnd={`url(#${markerId})`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.2 }}
            />
        </svg>
    )
}

// Печатаемая строка со СЛОВОМ-стикером внутри текста ("числителем"/
// "знаменателем") — по прямой просьбе пользователя заменить текстовыделитель
// (HighlightWord) на тот же боксовый стикер, что и у чисел формулы (единый
// визуальный язык), тот же приём, что TypedLineWithSticker в type-
// logdefwalk.tsx. NumSticker уже принимает и число, и строку.
// leadNumber/leadMid — опциональный ВТОРОЙ (числовой) стикер перед словом
// (например "аргумента [7] становится [числителем]") — по прямой просьбе
// пользователя: раньше число стояло голым текстом между длинными тире
// ("— 7 —"), теперь само число — такой же боксовый стикер, а тире убраны.
const TypedLineWithSticker = ({
    before, leadNumber, leadMid = '', word, after = '', color, onSettled,
}: { before: string; leadNumber?: number; leadMid?: string; word: string; after?: string; color: string; onSettled?: () => void }) => {
    const [typed, setTyped] = useState(false)
    const plainLead = leadNumber !== undefined ? `${leadNumber}${leadMid}` : ''
    return (
        <div className="w-full text-base md:text-lg text-[#F2F7FB]">
            {!typed ? (
                <Typewriter
                    text={`${before}${plainLead}${word}${after}`}
                    onDone={() => { setTyped(true); setTimeout(() => onSettled?.(), 450) }}
                />
            ) : (
                <>
                    {before}
                    {leadNumber !== undefined && (
                        <>
                            <NumSticker value={leadNumber} color={color} />
                            {leadMid}
                        </>
                    )}
                    <NumSticker value={word} color={color} />
                    {after}
                </>
            )}
        </div>
    )
}

// Финальная строка "Ответ: 7/3 log₂5" — та же структура, что у
// AnswerLine в LOGWALK/LOGSUBWALK, только с дробью вместо одного числа.
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
                        className="font-extrabold text-lg md:text-xl whitespace-nowrap"
                        style={{ color: CORRECT_COLOR }}
                    >
                        {/* inline-block+align-middle, не flex — та же причина,
                            что у Fraction/PowFormula выше: иначе лог визуально
                            "проваливается" ниже дроби (баг, найденный
                            пользователем) — vertical-align:middle держит дробь
                            на математической оси, а лог остаётся на обычном
                            text-baseline. */}
                        <span className="inline-block align-middle leading-none text-[0.72em] mr-1.5">
                            <span className="block px-1.5 pb-0.5 border-b-2 border-current text-center">{M}</span>
                            <span className="block px-1.5 pt-0.5 text-center">{N}</span>
                        </span>
                        <span className="inline-flex items-baseline whitespace-nowrap">
                            log<sub className="ml-0.5">{A}</sub><span className="ml-0.5">{B}</span>
                        </span>
                    </motion.span>
                </>
            )}
        </div>
    )
}

// ===== Тренировочные задания — новые случайные (a, n, b, m), нужно
// кликнуть верную формулу-ответ (m/n · log_a b) среди 4 вариантов. =====

type PowOption = { frac: [number, number]; base: number; arg: number }
type PowTrial = { a: number; n: number; b: number; m: number; options: PowOption[] }

const NUM_POOL = [2, 3, 4, 5, 6, 7, 8, 9] as const

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

const sameOption = (x: PowOption, y: PowOption) => x.frac[0] === y.frac[0] && x.frac[1] === y.frac[1] && x.base === y.base && x.arg === y.arg

// Дистракторы — правдоподобные ошибки школьника, не случайный шум:
// перепутал местами числитель/знаменатель, перепутал местами основание и
// аргумент лога, ошибся на 1 в числителе.
function makeOptions(a: number, n: number, b: number, m: number): PowOption[] {
    const correct: PowOption = { frac: [m, n], base: a, arg: b }
    const candidates: PowOption[] = [
        { frac: [n, m], base: a, arg: b },
        { frac: [m, n], base: b, arg: a },
        { frac: [m + 1, n], base: a, arg: b },
    ]
    const chosen: PowOption[] = [correct]
    for (const c of candidates) {
        if (!chosen.some((x) => sameOption(x, c))) chosen.push(c)
    }
    let extraShift = 2
    while (chosen.length < 4) {
        const extra: PowOption = { frac: [m + extraShift, n], base: a, arg: b }
        if (!chosen.some((x) => sameOption(x, extra))) chosen.push(extra)
        extraShift++
    }
    return shuffle(chosen)
}

const makeTrial = (prev: PowTrial | null): PowTrial => {
    let t: PowTrial
    let guard = 0
    do {
        const a = pick(NUM_POOL)
        let b = pick(NUM_POOL)
        while (b === a) b = pick(NUM_POOL)
        const n = pick(NUM_POOL)
        let m = pick(NUM_POOL)
        while (m === n) m = pick(NUM_POOL)
        t = { a, n, b, m, options: makeOptions(a, n, b, m) }
        guard++
    } while (prev && t.a === prev.a && t.n === prev.n && t.b === prev.b && t.m === prev.m && guard < 8)
    return t
}

const makeTrials = (n: number): PowTrial[] => {
    const out: PowTrial[] = []
    let prev: PowTrial | null = null
    for (let i = 0; i < n; i++) {
        const t = makeTrial(prev)
        out.push(t)
        prev = t
    }
    return out
}

const pickTrialFeedback = (t: PowTrial): string => {
    const seed = t.a * 7 + t.n * 5 + t.b * 3 + t.m
    return CORRECT_FEEDBACK_PHRASES[Math.abs(seed) % CORRECT_FEEDBACK_PHRASES.length]
}

// Кнопка-вариант — компактная формула "m/n · logₐb". Цвет всей формулы —
// текущий текстовый цвет кнопки (border-current/наследуемый text color),
// а НЕ Plain/NumSticker с зашитым белым — иначе состояние correct/wrong
// не смогло бы перекрасить дробь и лог вместе с рамкой кнопки.
const MiniAnswerButton = ({
    option, onClick, disabled, state,
}: { option: PowOption; onClick?: () => void; disabled?: boolean; state: 'idle' | 'correct' | 'wrong' }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
            'flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl border-2 text-base md:text-lg font-bold transition-colors',
            state === 'correct' && 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]',
            state === 'wrong' && 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]',
            state === 'idle' && 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]',
        )}
    >
        <span className="inline-flex flex-col items-center leading-none text-[0.7em]">
            <span className="px-1 pb-0.5 border-b-2 border-current">{option.frac[0]}</span>
            <span className="px-1 pt-0.5">{option.frac[1]}</span>
        </span>
        <span className="inline-flex items-baseline whitespace-nowrap">
            log<sub className="ml-0.5 text-[0.7em]">{option.base}</sub><span className="ml-0.5">{option.arg}</span>
        </span>
    </button>
)

export const TypeLogPowWalk = ({ onAnswer, onComplete }: Props) => {
    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
    const [hadMistake, setHadMistake] = useState(false)

    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)

    const [trials, setTrials] = useState<PowTrial[]>(() => makeTrials(TRIAL_COUNT))
    const [trialIndex, setTrialIndex] = useState(0)
    const [trialAnswers, setTrialAnswers] = useState<(PowOption | null)[]>(Array(TRIAL_COUNT).fill(null))
    const [checked, setChecked] = useState(false)
    const [showAnswerConfetti, setShowAnswerConfetti] = useState(false)

    // Контейнеры шагов 2 и 3 — каждому своя стрелка (числитель/знаменатель),
    // TravelArrow измеряет data-marker'ы внутри СВОЕГО контейнера.
    const step2Ref = useRef<HTMLDivElement>(null)
    const step3Ref = useRef<HTMLDivElement>(null)

    const currentCorrectOption = trials[trialIndex].options.find(
        (o) => sameOption(o, { frac: [trials[trialIndex].m, trials[trialIndex].n], base: trials[trialIndex].a, arg: trials[trialIndex].b })
    )!

    const handleOptionClick = (option: PowOption) => {
        if (checked) return
        const next = [...trialAnswers]
        next[trialIndex] = option
        setTrialAnswers(next)
        setChecked(true)
        if (!sameOption(option, currentCorrectOption)) setHadMistake(true)
    }

    const handleNextTrial = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            const answer = trialAnswers[trialIndex]
            const wasLastCorrect = !!answer && sameOption(answer, currentCorrectOption)
            const isLastInList = trialIndex + 1 >= trials.length
            if (isLastInList) {
                if (wasLastCorrect) {
                    setAdvancing(false)
                    const isFullyCorrect = !hadMistake
                    onComplete(isFullyCorrect)
                    onAnswer(isFullyCorrect ? 'right' : 'wrong')
                    return
                }
                // Ошибка на последнем по счёту задании — не завершаем
                // попытку, добавляем ещё одно (тот же приём, что у LOGWALK).
                const [extra] = makeTrials(1)
                setTrials((prev) => [...prev, extra])
                setTrialAnswers((prev) => [...prev, null])
            }
            setTrialIndex((i) => i + 1)
            setChecked(false)
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

    const [introNextLabel, setIntroNextLabel] = useState('Дальше')
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    useEffect(() => { setIntroNextLabel(pickWalkthroughNextLabel('Дальше')) }, [step])
    useEffect(() => { setTrialNextLabel(pickWalkthroughNextLabel('Дальше')) }, [trialIndex])

    // Счётчики "повторов" — нужны кнопке "назад" для перемонтирования
    // содержимого целевой сцены (см. type-sinwalk.tsx).
    const { bump: bumpNonce, nonceFor } = useReplayNonces()

    // Затемнение прошлых сцен + автоскролл к новой — та же схема ключей,
    // что и в LOGWALK/LOGSUBWALK/LOGDEFWALK (см. useSceneFocus в
    // WalkthroughLog.tsx).
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

    // "Назад" — реальный откат состояния на предыдущую сцену (см.
    // type-logwalk.tsx для подробного комментария).
    const handleBack = () => {
        if (advancing) return
        const target = prevSceneKeyOf(latestSceneKey)
        if (!target) return
        bumpNonce(target)
        if (target.startsWith('trial-')) {
            const idx = Number(target.slice('trial-'.length))
            setTrialIndex(idx)
            setChecked(false)
            setTrialAnswers((prev) => { const next = [...prev]; next[idx] = null; return next })
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
                {/* Шаг 0 — просто условие "log_{2³}5⁷ = ?", без текста. */}
                <SceneWrapper key="step-0" innerRef={sceneRef('step-0')} active={isSceneActive('step-0')}>
                    <Fragment key={`step-0-${nonceFor('step-0')}`}>
                        <DiagramBlock onSettled={() => setStepReady(true)}>
                            <PowFormula exponentsAsStickers={false} showRHS={false} numeratorFilled={false} denominatorFilled={false} />
                        </DiagramBlock>
                    </Fragment>
                </SceneWrapper>

                {/* Шаг 1 — показатели степени 3 и 7 становятся стикерами. */}
                {step >= 1 && (
                    <SceneWrapper key="step-1" innerRef={sceneRef('step-1')} active={isSceneActive('step-1')}>
                        <Fragment key={`step-1-${nonceFor('step-1')}`}>
                            <DiagramBlock>
                                <PowFormula exponentsAsStickers showRHS={false} numeratorFilled={false} denominatorFilled={false} />
                            </DiagramBlock>
                            <TypedLine
                                className="w-full text-base md:text-lg text-[#F2F7FB]"
                                text="У этого логарифма два показателя степени — у основания и у аргумента."
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 2 — 7 (показатель аргумента) сносится в числитель,
                    стрелка от 7-в-степени к 7-в-числителе. */}
                {step >= 2 && (
                    <SceneWrapper key="step-2" innerRef={sceneRef('step-2')} active={isSceneActive('step-2')}>
                        <Fragment key={`step-2-${nonceFor('step-2')}`}>
                            <DiagramBlock>
                                {/* pt-10 — запас сверху, чтобы дуга стрелки (мост
                                    выше обоих концов) не налезала на текст
                                    ПРЕДЫДУЩЕЙ сцены над этой (баг, найденный
                                    пользователем). */}
                                <div ref={step2Ref} className="relative w-full pt-10">
                                    <PowFormula exponentsAsStickers showRHS numeratorFilled denominatorFilled={false} />
                                    <TravelArrow containerRef={step2Ref} fromMarker="exp-m" toMarker="num-target" color={M_COLOR} />
                                </div>
                            </DiagramBlock>
                            <TypedLineWithSticker
                                before="Показатели степени можно перенести перед логарифмом. Показатель аргумента "
                                leadNumber={M}
                                leadMid=" становится "
                                word="числителем"
                                after=" дроби."
                                color={M_COLOR}
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 3 — 3 (показатель основания) сносится в знаменатель,
                    стрелка от 3-в-степени к 3-в-знаменателе. */}
                {step >= 3 && (
                    <SceneWrapper key="step-3" innerRef={sceneRef('step-3')} active={isSceneActive('step-3')}>
                        <Fragment key={`step-3-${nonceFor('step-3')}`}>
                            <DiagramBlock>
                                {/* pb-12 — запас снизу, чтобы дуга стрелки (мост
                                    ниже обоих концов) не налезала на текст ПОД
                                    диаграммой этой же сцены. */}
                                <div ref={step3Ref} className="relative w-full pb-12">
                                    <PowFormula exponentsAsStickers showRHS numeratorFilled denominatorFilled />
                                    <TravelArrow containerRef={step3Ref} fromMarker="exp-n" toMarker="den-target" color={N_COLOR} curve="down" />
                                </div>
                            </DiagramBlock>
                            <TypedLineWithSticker
                                before="А показатель основания "
                                leadNumber={N}
                                leadMid=" становится "
                                word="знаменателем"
                                after="."
                                color={N_COLOR}
                                onSettled={() => setStepReady(true)}
                            />
                        </Fragment>
                    </SceneWrapper>
                )}

                {/* Шаг 4 — итог, короткий "Ответ: 7/3 log₂5" с конфетти. */}
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
                    const answer = trialAnswers[i]
                    const correctOption = t.options.find(
                        (o) => sameOption(o, { frac: [t.m, t.n], base: t.a, arg: t.b })
                    )!
                    return (
                        <SceneWrapper key={`trial-${i}`} innerRef={sceneRef(`trial-${i}`)} active={isSceneActive(`trial-${i}`)}>
                        <Fragment key={`trial-${i}-${nonceFor(`trial-${i}`)}`}>
                            {/* Разделитель перед ПЕРВЫМ тренировочным заданием —
                                по прямой просьбе пользователя визуально
                                отгородить практику от предшествующего разбора
                                по шагам. */}
                            {i === 0 && (
                                <div className="w-full flex items-center gap-3" aria-hidden>
                                    <div className="flex-1 h-px bg-[#3A464E]" />
                                    <span className="text-xs font-bold uppercase tracking-wide text-[#5C6B73]">Тренировка</span>
                                    <div className="flex-1 h-px bg-[#3A464E]" />
                                </div>
                            )}
                            {/* Бейдж "N/M" вынесен из потока (absolute), иначе
                                текст "Выбери правильный ответ:" центрировался
                                относительно ОСТАВШЕГОСЯ места (после бейджа),
                                а не всей строки, и визуально съезжал вправо —
                                баг, найденный пользователем. */}
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
                                <PowFormula a={t.a} n={t.n} b={t.b} m={t.m} exponentsAsStickers showRHS={false} numeratorFilled={false} denominatorFilled={false} />
                            </DiagramBlock>
                            {isCurrent && !checked && (
                                <div className="grid grid-cols-2 gap-3">
                                    {t.options.map((opt, oi) => (
                                        <MiniAnswerButton key={oi} option={opt} state="idle" onClick={() => handleOptionClick(opt)} />
                                    ))}
                                </div>
                            )}
                            {isDone && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        {t.options.map((opt, oi) => (
                                            <MiniAnswerButton
                                                key={oi}
                                                option={opt}
                                                disabled
                                                state={sameOption(opt, correctOption) ? 'correct' : (answer && sameOption(answer, opt) ? 'wrong' : 'idle')}
                                            />
                                        ))}
                                    </div>
                                    <div
                                        className={cn(
                                            'flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center',
                                            (answer && sameOption(answer, correctOption)) ? 'bg-[#A1D15122] text-[#A1D151]' : 'bg-[#DC605B22] text-[#DC605B]'
                                        )}
                                    >
                                        {(answer && sameOption(answer, correctOption)) ? pickTrialFeedback(t) : `Неверно — правильный ответ ${correctOption.frac[0]}/${correctOption.frac[1]} log${correctOption.base}(${correctOption.arg}).`}
                                    </div>
                                </>
                            )}
                            {isCurrent && isDone && answer && sameOption(answer, correctOption) && <LocalAnswerConfetti />}
                        </Fragment>
                        </SceneWrapper>
                    )
                })}
            </div>

            {phase === 'intro' ? (
                <div className="w-full flex items-center gap-2">
                    <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                    <button type="button" onClick={handleIntroNext} disabled={!stepReady || advancing} className={walkthroughButtonClass(stepReady && !advancing)} style={walkthroughButtonStyle(stepReady && !advancing)}>
                        {introNextLabel}
                    </button>
                </div>
            ) : checked ? (
                <div className="w-full flex items-center gap-2">
                    <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                    <button type="button" onClick={handleNextTrial} disabled={advancing} className={walkthroughButtonClass(!advancing)} style={walkthroughButtonStyle(!advancing)}>
                        {trialIndex + 1 >= trials.length && trialAnswers[trialIndex] && sameOption(trialAnswers[trialIndex]!, currentCorrectOption) ? 'Готово' : trialNextLabel}
                    </button>
                </div>
            ) : (
                <p className="text-sm text-[#9AA7B0] text-center">Кликни на вариант выше</p>
            )}
        </div>
    )
}
