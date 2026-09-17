// components/geometry/RightTriangleRefDiagram.tsx
//
// Статичная (без анимации/интерактивности) диаграмма прямоугольного
// треугольника для справочника (components/reference-browser.tsx, тема
// "Геометрия: sin, cos, tg") — по прямой просьбе пользователя оформлена
// ТЕМ ЖЕ визуальным стандартом, что уже используется в интерактивных
// разборах по шагам (см. components/geometry/RightTriangleDiagram.tsx):
// цвета из GGEGE_PALETTE, угловые индикаторы (маркер прямого угла, дуга
// угла α) рисуются ПЕРВЫМИ — под линиями сторон, а не поверх; подписи
// сторон (a/b/c) — Nunito, подпись самого угла α — Georgia italic (та же
// единственная исключение-конвенция, что и в шаблоне).
//
// НЕ статичный SVG-файл (как было раньше) — намеренно: var(--font-nunito)
// это CSS-переменная от next/font, объявленная на layout приложения;
// SVG, загруженный через <img src="...">, рендерится в изолированном
// image-контексте и НЕ наследует CSS-переменные родительского документа
// (даже если бы наследовал — браузеры вдобавок блокируют подгрузку
// внешних шрифтов внутри img-контекста SVG из соображений безопасности).
// Инлайновый React-компонент в самом DOM страницы наследует переменную
// нормально, ровно как и сам RightTriangleDiagram.tsx.

import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors'

const EDGE = '#F2F7FB'
const RIGHT_ANGLE_COLOR = GGEGE_PALETTE.orange.button
const ALPHA_COLOR = GGEGE_PALETTE.blue.button

// A — вершина угла α, C — прямой угол, B — третья вершина. Координаты
// подобраны так же, как в прежнем статичном SVG (визуально не меняем
// расположение, только технику рендера и стиль).
const A = { x: 40, y: 220 }
const C = { x: 280, y: 220 }
const B = { x: 280, y: 60 }

export const RightTriangleRefDiagram = () => (
    <svg viewBox="0 0 320 260" className="w-full h-auto max-h-56">
        {/* Прямой угол при C — трёхточечный path (не прямоугольник), как в
            RightTriangleDiagram.tsx. */}
        <path d="M 262 220 L 262 202 L 280 202" fill="none" stroke={RIGHT_ANGLE_COLOR} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />

        {/* Дуга угла α — квадратичная кривая вдоль биссектрисы, тот же
            приём, что и в шаблоне (не arc-flag). */}
        <path d="M 70 220 Q 77.3 208.7 65 203.4" fill="none" stroke={ALPHA_COLOR} strokeWidth={3} strokeLinecap="round" />
        <text x={90} y={205} textAnchor="middle" dominantBaseline="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize={22} fontWeight={700} fill={ALPHA_COLOR}>α</text>

        {/* Стороны — поверх угловых индикаторов выше. */}
        <polygon points={`${A.x},${A.y} ${C.x},${C.y} ${B.x},${B.y}`} fill="none" stroke={EDGE} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />

        {/* Подписи сторон — Nunito, как любые буквенные подписи в проекте
            (см. TangentialQuadDiagram.tsx). */}
        <text x={160} y={248} fontFamily="var(--font-nunito), sans-serif" fontWeight={800} fontSize={24} fill={EDGE} textAnchor="middle">a</text>
        <text x={304} y={146} fontFamily="var(--font-nunito), sans-serif" fontWeight={800} fontSize={24} fill={EDGE} textAnchor="middle">b</text>
        <text x={141} y={122} fontFamily="var(--font-nunito), sans-serif" fontWeight={800} fontSize={24} fill={EDGE} textAnchor="middle" transform="rotate(-34 141 122)">c</text>

        {/* Вершины */}
        <circle cx={A.x} cy={A.y} r={4} fill={EDGE} />
        <circle cx={C.x} cy={C.y} r={4} fill={EDGE} />
        <circle cx={B.x} cy={B.y} r={4} fill={EDGE} />
    </svg>
)
