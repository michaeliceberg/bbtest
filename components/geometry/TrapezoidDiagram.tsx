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
const ACCENT = '#7dd3fc'       // акцент математики (см. CLAUDE.md) — боковые стороны, финальный ответ
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
// Направление перпендикуляра посчитано аналитически (единичный вектор
// B→C, повёрнутый на 90°, в сторону, противоположную третьей вершине
// треугольника B_FOOT — то есть НАРУЖУ, не внутрь фигуры).
const HYP_MID = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 }
const HYP_QMARK = { x: HYP_MID.x + 29.8, y: HYP_MID.y - 23.6 }

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
            <svg viewBox="0 0 700 320" width="100%" height="auto" style={{ maxWidth: 480 }}>
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

                    {/* боковые стороны — подсвечиваются акцентом */}
                    <motion.line
                        x1={A.x} y1={A.y} x2={D.x} y2={D.y}
                        stroke={legsHighlighted ? ACCENT : EDGE}
                        strokeWidth={legsHighlighted ? 7 : 5}
                        strokeLinecap="round"
                        animate={{ stroke: legsHighlighted ? ACCENT : EDGE }}
                        transition={{ duration: 0.4 }}
                    />
                    <motion.line
                        x1={B.x} y1={B.y} x2={C.x} y2={C.y}
                        stroke={hypotenuseFocused ? HYPOTENUSE_COLOR : legsHighlighted ? ACCENT : EDGE}
                        strokeWidth={hypotenuseFocused ? 8 : legsHighlighted ? 7 : 5}
                        strokeLinecap="round"
                        animate={{ stroke: hypotenuseFocused ? HYPOTENUSE_COLOR : legsHighlighted ? ACCENT : EDGE }}
                        transition={{ duration: 0.4 }}
                    />
                    {/* "?" выезжает из гипотенузы наружу — сигнал "вот что мы ищем".
                        Фиксированный атрибут x/y — конечная (offset) позиция; сам
                        motion.x/y — ОТНОСИТЕЛЬНОЕ смещение НАЗАД к середине линии,
                        тот же проверенный приём, что уже используется у подписей
                        43/73 выше (transform-offset поверх фиксированного атрибута,
                        а не анимация самого x/y-атрибута напрямую). */}
                    <motion.text
                        x={HYP_QMARK.x} y={HYP_QMARK.y}
                        initial={{ opacity: 0, scale: 0.3, x: HYP_MID.x - HYP_QMARK.x, y: HYP_MID.y - HYP_QMARK.y }}
                        animate={hypotenuseFocused
                            ? { opacity: 1, scale: 1, x: 0, y: 0 }
                            : { opacity: 0, scale: 0.3, x: HYP_MID.x - HYP_QMARK.x, y: HYP_MID.y - HYP_QMARK.y }}
                        transition={{ type: 'spring', duration: 0.7, bounce: 0.5, delay: hypotenuseFocused ? 0.3 : 0 }}
                        textAnchor="middle" fontFamily="var(--font-nunito), sans-serif" fontSize={28} fontWeight={800} fill={HYPOTENUSE_COLOR}
                    >?</motion.text>

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
