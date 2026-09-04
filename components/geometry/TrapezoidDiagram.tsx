// components/geometry/TrapezoidDiagram.tsx
//
// Анимированная равнобедренная трапеция для интерактивного разбора
// задачи (см. TrapezoidWalkthrough.tsx). НЕ статичный SVG-файл (как
// диаграммы sdamgia в public/geometry/) — параметризуемый React-
// компонент, реагирующий на явные булевы/значимые пропы (не общий
// "stage"-номер — по мере усложнения хореографии этого стало
// недостаточно: числа 43/73 должны появляться НЕЗАВИСИМО друг от друга
// и с РАЗНЫМ направлением слайда, а не одним общим флагом).
//
// Топология не в масштабе (реальная высота трапеции при этих числах
// визуально почти плоская — h=6√6≈14.7 при основаниях 43/73), высота
// осознанно завышена для читаемости чертежа — и по прямой просьбе
// пользователя увеличена ещё раз ("более вытянутой вниз"), т.к. по
// вертикали было много неиспользуемого места.

import { motion } from 'framer-motion'

const BG = '#161F23'
const EDGE = '#F2F7FB'
const ACCENT = '#7dd3fc'       // акцент математики (см. CLAUDE.md) — финальный ответ, подсветка треугольника
// Подсветка боковых сторон ("равнобедренная" — обе ноги равны) раньше
// красилась тем же ACCENT (голубой #7dd3fc) — пользователь отметил, что
// на светлой линии EDGE (#F2F7FB) этот голубой почти не отличим по
// яркости, сливается. Янтарный — тот же цвет, что уже используется в
// проекте как "смотри сюда" (BlinkingExclaim в WalkthroughLog.tsx) —
// контрастен и к тёмному фону, и к белым линиям трапеции.
const LEGS_HIGHLIGHT_COLOR = '#FBBF24'
const SEGMENT_COLOR = '#FB923C' // оранжевый — отрезки основания после проведения высот
const HYPOTENUSE_COLOR = '#8B5CF6' // тот же фиолетовый, что и текст-маркер — "вот что мы сейчас ищем"
// (розово-красный первой версии читался пользователем как "ошибка", а
// оранжевый уже занят под отрезки основания — фиолетовый нейтрален)
const TEXT = '#F2F7FB'

// Координаты — не в масштабе, топология точная: отступ верхних вершин
// пропорционален разности оснований (73-43)/2 = 15 с каждой стороны.
// Высота (D.y-A.y) увеличена с 110 до 170 по просьбе пользователя —
// трапеция была визуально "приплюснута", вертикального места хватало.
const D = { x: 40, y: 260 }   // низ-лево
const C = { x: 660, y: 260 }  // низ-право
const A = { x: 175, y: 90 }   // верх-лево
const B = { x: 525, y: 90 }   // верх-право
const A_FOOT = { x: A.x, y: D.y } // основание левой высоты
const B_FOOT = { x: B.x, y: D.y } // основание правой высоты (правый треугольник — B, C, B_FOOT)

// Зум на правый треугольник (B-C-B_FOOT) — трансформ всего <g>, не
// анимация viewBox (framer-motion не умеет плавно интерполировать
// произвольные SVG-атрибуты вроде viewBox из коробки, а scale+translate
// на группе — стандартный, хорошо поддерживаемый приём).
//
// ВАЖНО: framer-motion для motion.g принудительно ставит CSS
// transform-origin: 50% 50% относительно fill-box (bounding box самого
// содержимого группы) и ИГНОРИРУЕТ любую попытку переопределить это
// через style-проп (проверено вживую) — поэтому translate/scale здесь
// считаются НЕ от (0,0) viewBox, а от формулы композиции CSS-трансформов
// вокруг центра bbox: result = scale·(P − O) + O + (tx,ty), где O — центр
// bbox УСТОЯВШЕГОСЯ (не анимирующегося) содержимого. Посчитан аналитически
// по известной геометрии (не через живой getBBox() в браузере — при
// bounce-анимации цифр с initial scale:5 промежуточные/замороженные кадры
// раздувают измеренный bbox некорректно): x:[40,660], y:[60.6,294.4] (верх —
// подпись "43" над трапецией, низ — подписи "73"/"15" под ней) →
// O=(350, 177.5). Числа ниже подобраны решением этого уравнения так, чтобы
// центр блока "треугольник + подпись 15 под его катетом" (592.5, 192)
// переходил в центр viewBox (350, 160) — то есть и сам треугольник, и
// подпись гарантированно остаются в кадре (проверено расчётом координат
// всех вершин после трансформа).
const ZOOM_SCALE = 1.3
const ZOOM_TX = -315.25
const ZOOM_TY = -36.35

// "?" у гипотенузы B-C — стартует ПРЯМО НА линии (в её середине) и
// "выезжает" наружу перпендикулярно ей, будто выныривая из самой стороны.
// Направление — единичный вектор B→C, повёрнутый на 90°, в сторону,
// противоположную третьей вершине треугольника B_FOOT (НАРУЖУ, не внутрь
// фигуры) — это направление уже было верным, но пользователь отметил, что
// глиф всё равно сливался с линией. Увеличен ТОЛЬКО отступ (магнитуда
// вдоль той же перпендикулярной прямой) — простое "отражение по Y" здесь
// увело бы точку ВДОЛЬ линии, а не от неё, т.к. сама линия B-C не
// вертикальна и не горизонтальна.
const HYP_MID = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 }
const HYP_QMARK = { x: HYP_MID.x + 43, y: HYP_MID.y - 34 }

// Те же "?" + наклонная стрелочка нужны и для отрезков основания
// (левый/правый), пока их длина ещё не найдена — по прямой просьбе
// пользователя ("когда кусочки ищем нижние — там тоже нужны
// стрелочки"). Раньше "?" стоял НАД серединой каждого отрезка —
// оказывался вплотную к диагональной боковой стороне трапеции (A-D
// слева / B-C справа) и визуально сливался с ней. Отражён по вертикали
// — теперь ПОД нижним основанием, в свободном месте под фигурой,
// стрелка указывает вверх на сам отрезок; когда длина найдена — "?"
// гаснет, а число "15" появляется чуть выше (уже существующая позиция),
// они по-прежнему не перекрываются (взаимно исключающие active-условия).
const SEG_L_MID = { x: (D.x + A_FOOT.x) / 2, y: D.y }
const SEG_L_QMARK = { x: SEG_L_MID.x - 20, y: SEG_L_MID.y + 34 }
const SEG_R_MID = { x: (B_FOOT.x + C.x) / 2, y: D.y }
const SEG_R_QMARK = { x: SEG_R_MID.x + 20, y: SEG_R_MID.y + 34 }

type Pt = { x: number; y: number }

// Наклонная стрелочка от "?" к самой стороне/отрезку, которую ищем — по
// прямой просьбе пользователя. Направление считается аналитически
// (единичный вектор from→to), не подбирается на глаз — общая функция,
// переиспользуемая для гипотенузы и обоих отрезков основания.
const computeArrow = (from: Pt, to: Pt, headLen = 14, headWidth = 9) => {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const len = Math.sqrt(dx * dx + dy * dy)
    const ux = dx / len, uy = dy / len
    const px = -uy, py = ux
    // Хвост стрелки начинается чуть в стороне от самого символа "?" (не
    // из его центра — иначе накладывался бы на глиф).
    const tail = { x: from.x + ux * 10, y: from.y + uy * 10 }
    const headBack = { x: to.x - ux * headLen, y: to.y - uy * headLen }
    const headPoints = [
        `${to.x},${to.y}`,
        `${headBack.x + px * (headWidth / 2)},${headBack.y + py * (headWidth / 2)}`,
        `${headBack.x - px * (headWidth / 2)},${headBack.y - py * (headWidth / 2)}`,
    ].join(' ')
    return { tail, headBack, headPoints }
}

export type TrapezoidVisual = {
    legsHighlighted?: boolean
    base43Shown?: boolean
    base73Shown?: boolean
    altitudesDrawn?: boolean
    segmentsHighlighted?: boolean
    segmentValue?: string | null   // "15" — подпись на отрезках D-A_FOOT/B_FOOT
    triangleHighlighted?: boolean  // подсветка правого треугольника (до зума)
    zoomTriangle?: boolean         // зум на правый треугольник
    hypotenuseFocused?: boolean    // гипотенуза B-C красится отдельным цветом + "?" выезжает из неё
    legValue?: string | null       // "21" — подпись на боковой стороне (финал)
}

const line = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
    `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`

// Общий "bounce"-эффект появления цифры: стартует В 5 РАЗ крупнее своего
// конечного размера и с отскоком уменьшается до него — по явной просьбе
// пользователя ("цифра сейчас просто резко появляется"), вместо прежнего
// мгновенного/мелкого масштаба.
const numberBounce = {
    initial: { opacity: 0, scale: 5 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: 'spring' as const, duration: 0.8, bounce: 0.6 },
}

// "?" + наклонная стрелочка, указывающая на сторону/отрезок, который мы
// сейчас ищем — общий компонент для гипотенузы и обоих отрезков
// основания (было 3 копии одной и той же JSX-хореографии, вынесено
// один раз). Порядок появления: линия-стрелка рисуется первой (0.15с
// задержка), затем наконечник (0.45с), затем сам "?" всплывает
// пружинным bounce (0.3с) — тот же тайминг, что был у гипотенузы.
const ArrowHint = ({ from, to, active, color, fontSize = 24 }: { from: Pt; to: Pt; active: boolean; color: string; fontSize?: number }) => {
    const { tail, headBack, headPoints } = computeArrow(from, to)
    return (
        <>
            <motion.line
                x1={tail.x} y1={tail.y} x2={headBack.x} y2={headBack.y}
                stroke={color}
                strokeWidth={3}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: active ? 1 : 0, opacity: active ? 1 : 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: active ? 0.15 : 0 }}
            />
            <motion.polygon
                points={headPoints}
                fill={color}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.4 }}
                transition={{ duration: 0.25, delay: active ? 0.45 : 0 }}
            />
            {/* Появление (спрятано→на месте) — framer-motion на ОБЁРТКЕ,
                разовая анимация, settles и больше не пишет transform.
                Непрерывный bounce вверх-вниз — ЧИСТЫЙ CSS-класс на
                ВЛОЖЕННОМ обычном <text> (не framer): если бы framer
                продолжал писать transform на том же узле, что и CSS
                @keyframes, они конкурировали бы за одно и то же
                свойство и дёргались бы — тот же принцип разделения
                ответственности, что и у .animate-insert-wobble/
                .animate-blank-blink в type-insert.tsx/WalkthroughLog.tsx. */}
            <motion.g
                initial={{ opacity: 0, scale: 0.3, x: to.x - from.x, y: to.y - from.y }}
                animate={active
                    ? { opacity: 1, scale: 1, x: 0, y: 0 }
                    : { opacity: 0, scale: 0.3, x: to.x - from.x, y: to.y - from.y }}
                transition={{ type: 'spring', duration: 0.7, bounce: 0.5, delay: active ? 0.3 : 0 }}
            >
                <text
                    x={from.x} y={from.y}
                    className={active ? 'animate-qmark-bounce' : undefined}
                    textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={fontSize} fontWeight={800} fill={color}
                >?</text>
            </motion.g>
        </>
    )
}

export const TrapezoidDiagram = (props: TrapezoidVisual) => {
    const {
        legsHighlighted = false,
        base43Shown = false,
        base73Shown = false,
        altitudesDrawn = false,
        segmentsHighlighted = false,
        segmentValue = null,
        triangleHighlighted = false,
        zoomTriangle = false,
        hypotenuseFocused = false,
        legValue = null,
    } = props

    return (
        <div className="flex items-center justify-center py-2 px-2 mb-4 bg-[#161F23] rounded-xl overflow-hidden">
            <svg viewBox="0 0 700 320" width="100%" height="auto" style={{ maxWidth: 560 }}>
                <rect x="0" y="0" width="700" height="320" fill={BG} />

                <motion.g
                    animate={{
                        scale: zoomTriangle ? ZOOM_SCALE : 1,
                        x: zoomTriangle ? ZOOM_TX : 0,
                        y: zoomTriangle ? ZOOM_TY : 0,
                    }}
                    transition={{ duration: 0.9, ease: 'easeInOut' }}
                >
                    {/* подсветка правого треугольника — под линиями трапеции */}
                    {triangleHighlighted && (
                        <motion.polygon
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.22 }}
                            transition={{ duration: 0.4 }}
                            points={`${B.x},${B.y} ${C.x},${C.y} ${B_FOOT.x},${B_FOOT.y}`}
                            fill={ACCENT}
                        />
                    )}

                    {/* верхнее основание A-B */}
                    <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={EDGE} strokeWidth={5} strokeLinecap="round" />
                    {/* нижнее основание D-C */}
                    <line x1={D.x} y1={D.y} x2={C.x} y2={C.y} stroke={EDGE} strokeWidth={5} strokeLinecap="round" />

                    {/* боковые стороны — подсвечиваются янтарным (контрастнее
                        голубого ACCENT на фоне белых линий основания) и
                        заметно толще (8 против базовых 5) */}
                    <motion.line
                        x1={A.x} y1={A.y} x2={D.x} y2={D.y}
                        stroke={legsHighlighted ? LEGS_HIGHLIGHT_COLOR : EDGE}
                        strokeWidth={legsHighlighted ? 8 : 5}
                        strokeLinecap="round"
                        animate={{ stroke: legsHighlighted ? LEGS_HIGHLIGHT_COLOR : EDGE }}
                        transition={{ duration: 0.4 }}
                    />
                    <motion.line
                        x1={B.x} y1={B.y} x2={C.x} y2={C.y}
                        stroke={hypotenuseFocused ? HYPOTENUSE_COLOR : legsHighlighted ? LEGS_HIGHLIGHT_COLOR : EDGE}
                        strokeWidth={hypotenuseFocused ? 8 : legsHighlighted ? 8 : 5}
                        strokeLinecap="round"
                        animate={{ stroke: hypotenuseFocused ? HYPOTENUSE_COLOR : legsHighlighted ? LEGS_HIGHLIGHT_COLOR : EDGE }}
                        transition={{ duration: 0.4 }}
                    />
                    {/* "?" + стрелка у гипотенузы — сигнал "вот что мы ищем". */}
                    <ArrowHint from={HYP_QMARK} to={HYP_MID} active={hypotenuseFocused} color={HYPOTENUSE_COLOR} fontSize={28} />

                    {/* высоты — дорисовываются анимированно (pathLength), медленнее и толще */}
                    <motion.path
                        d={line(A, A_FOOT)}
                        stroke={EDGE}
                        strokeWidth={4}
                        strokeDasharray="10,7"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: altitudesDrawn ? 1 : 0, opacity: altitudesDrawn ? 1 : 0 }}
                        transition={{ duration: 0.8, ease: 'easeInOut' }}
                    />
                    <motion.path
                        d={line(B, B_FOOT)}
                        stroke={EDGE}
                        strokeWidth={4}
                        strokeDasharray="10,7"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: altitudesDrawn ? 1 : 0, opacity: altitudesDrawn ? 1 : 0 }}
                        transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.2 }}
                    />

                    {/* отрезки основания слева/справа от высот — оранжевый акцент,
                        появляются ПОСЛЕ паузы за высотами (тайминг — в TrapezoidWalkthrough) */}
                    <motion.line
                        x1={D.x} y1={D.y} x2={A_FOOT.x} y2={A_FOOT.y}
                        stroke={segmentsHighlighted ? SEGMENT_COLOR : 'transparent'}
                        strokeWidth={8}
                        strokeLinecap="round"
                        animate={{ opacity: segmentsHighlighted ? 1 : 0 }}
                        transition={{ duration: 0.5 }}
                    />
                    <motion.line
                        x1={B_FOOT.x} y1={B_FOOT.y} x2={C.x} y2={C.y}
                        stroke={segmentsHighlighted ? SEGMENT_COLOR : 'transparent'}
                        strokeWidth={8}
                        strokeLinecap="round"
                        animate={{ opacity: segmentsHighlighted ? 1 : 0 }}
                        transition={{ duration: 0.5 }}
                    />

                    {/* "?" + стрелки у отрезков основания, пока их длина ещё
                        не найдена — гаснут, как только появляется сама
                        цифра (segmentValue), чтобы не перекрываться с ней. */}
                    <ArrowHint from={SEG_L_QMARK} to={SEG_L_MID} active={segmentsHighlighted && !segmentValue} color={SEGMENT_COLOR} fontSize={22} />
                    <ArrowHint from={SEG_R_QMARK} to={SEG_R_MID} active={segmentsHighlighted && !segmentValue} color={SEGMENT_COLOR} fontSize={22} />

                    {/* подпись "43" — "выныривает" СНИЗУ ВВЕРХ с bounce-эффектом
                        (стартует крупнее и ближе к телу трапеции, оседает на своё
                        место над ней). */}
                    <motion.text
                        initial={{ ...numberBounce.initial, y: 18 }}
                        animate={{ ...numberBounce.animate, y: base43Shown ? 0 : 18, opacity: base43Shown ? 1 : 0, scale: base43Shown ? 1 : 5 }}
                        transition={numberBounce.transition}
                        x={(A.x + B.x) / 2} y={A.y - 14}
                        textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={22} fontWeight={700} fill={TEXT}
                    >43</motion.text>
                    {/* подпись "73" — "выныривает" СВЕРХУ ВНИЗ с bounce-эффектом. */}
                    <motion.text
                        initial={{ ...numberBounce.initial, y: -18 }}
                        animate={{ ...numberBounce.animate, y: base73Shown ? 0 : -18, opacity: base73Shown ? 1 : 0, scale: base73Shown ? 1 : 5 }}
                        transition={numberBounce.transition}
                        x={(D.x + C.x) / 2} y={D.y + 30}
                        textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={22} fontWeight={700} fill={TEXT}
                    >73</motion.text>

                    {/* подписи отрезков 15/15 — оранжевые, тот же bounce-эффект */}
                    {segmentValue && (
                        <>
                            <motion.text
                                initial={numberBounce.initial}
                                animate={numberBounce.animate}
                                transition={numberBounce.transition}
                                x={(D.x + A_FOOT.x) / 2} y={D.y + 30}
                                textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={20} fontWeight={800} fill={SEGMENT_COLOR}
                            >{segmentValue}</motion.text>
                            <motion.text
                                initial={numberBounce.initial}
                                animate={numberBounce.animate}
                                transition={numberBounce.transition}
                                x={(B_FOOT.x + C.x) / 2} y={D.y + 30}
                                textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={20} fontWeight={800} fill={SEGMENT_COLOR}
                            >{segmentValue}</motion.text>
                        </>
                    )}

                    {/* подпись боковой стороны 21 (финал) — правая сторона B-C */}
                    {legValue && (
                        <motion.text
                            initial={numberBounce.initial}
                            animate={numberBounce.animate}
                            transition={numberBounce.transition}
                            x={(B.x + C.x) / 2 + 34} y={(B.y + C.y) / 2}
                            textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={20} fontWeight={800} fill={ACCENT}
                        >{legValue}</motion.text>
                    )}
                </motion.g>
            </svg>
        </div>
    )
}
