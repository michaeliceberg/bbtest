// components/hangar-progress-corners.tsx
//
// Прогресс раздела вокруг жёлтой кнопки-номера в ангаре: четыре уголка по углам кнопки на тёмной подложке-уголком
// (подложка повторяет форму уголков: её край проходит по внешнему краю уголков, углы скруглены тем же радиусом).
// Каждый уголок = 25% раздела: бледный, пока не решён, зелёный по мере решения (текущий заполняется частично).
// Порядок: левый верхний, правый верхний, правый нижний, левый нижний. Всё в долях стороны кнопки (viewBox), поэтому
// масштабируется вместе с кнопкой. Только SVG без фильтров и размытия (лёгкий для iPhone).
// Выбран на /test-hangar-progress (вариант В «Уголки» + тёмная подложка).

const VB = 1.6 // сторона viewBox; кнопка занимает [B0, B0 + 1]
const B0 = 0.3
const T = 0.13 // толщина уголка
const O = 0.09 // зазор между кнопкой и уголком
const ARM = 0.4 // длина плеча
const R = 0.14 // радиус изгиба уголка
const X0 = B0 - O - T / 2
const X1 = B0 + 1 + O + T / 2
const PLATE = { x: X0 - T / 2, y: X0 - T / 2, w: X1 - X0 + T, rx: R + T / 2 } // внешний край уголков

const PATHS = [
    `M ${X0} ${X0 + ARM} V ${X0 + R} Q ${X0} ${X0} ${X0 + R} ${X0} H ${X0 + ARM}`, // левый верхний
    `M ${X1 - ARM} ${X0} H ${X1 - R} Q ${X1} ${X0} ${X1} ${X0 + R} V ${X0 + ARM}`, // правый верхний
    `M ${X1} ${X1 - ARM} V ${X1 - R} Q ${X1} ${X1} ${X1 - R} ${X1} H ${X1 - ARM}`, // правый нижний
    `M ${X0 + ARM} ${X1} H ${X0 + R} Q ${X0} ${X1} ${X0} ${X1 - R} V ${X1 - ARM}`, // левый нижний
]
/** Доля заполнения уголка i при общем прогрессе p (0…1). */
const part = (p: number, i: number) => Math.max(0, Math.min(1, p * 4 - i))

export const PROGRESS_GREEN = '#78C93C'

/** Кладётся ВНУТРИ position:relative-обёртки размером с кнопку: выступает за неё на 30% со всех сторон. */
export function ProgressCorners({ p, color = PROGRESS_GREEN }: { p: number; color?: string }) {
    return (
        <svg aria-hidden className="pointer-events-none absolute" viewBox={`0 0 ${VB} ${VB}`} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={T}
            style={{ left: '-30%', top: '-30%', width: '160%', height: '160%' }}>
            <rect x={PLATE.x} y={PLATE.y} width={PLATE.w} height={PLATE.w} rx={PLATE.rx} fill="rgba(24,18,12,0.62)" />
            {PATHS.map((d, i) => <path key={`b${i}`} d={d} stroke="rgba(255,255,255,0.32)" />)}
            {PATHS.map((d, i) => { const v = part(p, i); return v > 0 ? <path key={`f${i}`} d={d} stroke={color} pathLength={1} strokeDasharray={`${v} 1`} /> : null })}
        </svg>
    )
}
