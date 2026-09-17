// components/geometry/RightTriangleRefDiagram.tsx
//
// Статичная (без анимации/интерактивности) диаграмма прямоугольного
// треугольника для справочника (components/reference-browser.tsx, тема
// "Геометрия: sin, cos, tg") — оформлена ТЕМ ЖЕ визуальным стандартом,
// что и интерактивные разборы по шагам (см. RightTriangleDiagram.tsx):
// цвета из GGEGE_PALETTE, угловые индикаторы (маркер прямого угла, дуга
// угла α) рисуются ПЕРВЫМИ — под линиями сторон; подпись самого угла α —
// Georgia italic (единственное исключение из Nunito, та же конвенция,
// что и в шаблоне).
//
// По прямой просьбе пользователя — буквы a/b/c оформлены как "стикеры"
// (скруглённый цветной квадратик с буквой), и КАЖДАЯ сторона треугольника
// покрашена В ТОТ ЖЕ цвет, что и стикер её буквы — цвет однозначно
// связывает сторону с её обозначением, не только текстовая подпись.
// SIDE_COLORS переиспользуется и здесь (диаграмма), и в
// reference-browser.tsx (стикеры внутри формул sin α=b/c и т.п.) — одна
// точка правды на оба места, иначе цвета рисковали бы разъехаться.
//
// Инлайновый React-компонент, не статичный SVG-файл — var(--font-nunito)
// это CSS-переменная от next/font, объявленная на layout приложения; SVG,
// загруженный через <img src="...">, рендерится в изолированном
// image-контексте и НЕ наследует CSS-переменные родительского документа
// (браузеры вдобавок блокируют подгрузку внешних шрифтов внутри
// img-контекста SVG из соображений безопасности). Инлайновый компонент в
// самом DOM страницы наследует переменную нормально, ровно как и сам
// RightTriangleDiagram.tsx.

import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'

const EDGE = '#F2F7FB'
const RIGHT_ANGLE_COLOR = GGEGE_PALETTE.orange.button
const ALPHA_COLOR = GGEGE_PALETTE.blue.button

// Цвет каждой стороны/буквы — общий экспорт, переиспользуется
// reference-browser.tsx для стикеров ВНУТРИ формул (sin α = b/c и т.п.),
// чтобы цвет буквы совпадал везде, где она встречается на странице.
export const SIDE_COLORS: Record<'a' | 'b' | 'c', string> = {
    a: GGEGE_PALETTE.teal.button,   // прилежащий катет
    b: GGEGE_PALETTE.green.button,  // противолежащий катет
    c: GGEGE_PALETTE.purple.button, // гипотенуза
}

// A — вершина угла α, C — прямой угол, B — третья вершина.
const A = { x: 40, y: 220 }
const C = { x: 280, y: 220 }
const B = { x: 280, y: 60 }

// "Стикер" буквы — скруглённый цветной квадратик с буквой внутри, тот же
// приём (полупрозрачная заливка цвета + сплошная рамка того же цвета),
// что уже используют цветные плашки-фильтры в этом же справочнике
// (topicChipStyle в reference-browser.tsx).
const LetterSticker = ({ x, y, letter, color }: { x: number; y: number; letter: 'a' | 'b' | 'c'; color: string }) => (
    <g>
        <rect x={x - 16} y={y - 16} width={32} height={32} rx={10} fill={hexToRgba(color, 0.22)} stroke={color} strokeWidth={2} />
        <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-nunito), sans-serif" fontWeight={800} fontSize={18} fill={color}>{letter}</text>
    </g>
)

export const RightTriangleRefDiagram = () => (
    <svg viewBox="0 0 320 260" className="w-full h-auto max-h-56">
        {/* Прямой угол при C — трёхточечный path (не прямоугольник), как в
            RightTriangleDiagram.tsx. */}
        <path d="M 262 220 L 262 202 L 280 202" fill="none" stroke={RIGHT_ANGLE_COLOR} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />

        {/* Дуга угла α — квадратичная кривая вдоль биссектрисы, тот же
            приём, что и в шаблоне (не arc-flag). */}
        <path d="M 70 220 Q 77.3 208.7 65 203.4" fill="none" stroke={ALPHA_COLOR} strokeWidth={3} strokeLinecap="round" />
        <text x={90} y={205} textAnchor="middle" dominantBaseline="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize={22} fontWeight={700} fill={ALPHA_COLOR}>α</text>

        {/* Стороны — ТРИ отдельные линии (не единый polygon), каждая в
            цвете своей буквы — поверх угловых индикаторов выше. Раздельные
            линии с round-линкапом на общих вершинах — тот же приём, что
            уже используется в RightTriangleDiagram.tsx для подсвечиваемых
            сторон (даёт визуально непрерывный стык в вершине без явного
            strokeLinejoin, тот работает только внутри одного <path>). */}
        <line x1={A.x} y1={A.y} x2={C.x} y2={C.y} stroke={SIDE_COLORS.a} strokeWidth={6} strokeLinecap="round" />
        <line x1={C.x} y1={C.y} x2={B.x} y2={B.y} stroke={SIDE_COLORS.b} strokeWidth={6} strokeLinecap="round" />
        <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={SIDE_COLORS.c} strokeWidth={6} strokeLinecap="round" />

        {/* Стикеры букв — на месте прежних простых подписей. */}
        <LetterSticker x={160} y={240} letter="a" color={SIDE_COLORS.a} />
        <LetterSticker x={300} y={140} letter="b" color={SIDE_COLORS.b} />
        <LetterSticker x={126} y={124} letter="c" color={SIDE_COLORS.c} />

        {/* Вершины */}
        <circle cx={A.x} cy={A.y} r={4} fill={EDGE} />
        <circle cx={C.x} cy={C.y} r={4} fill={EDGE} />
        <circle cx={B.x} cy={B.y} r={4} fill={EDGE} />
    </svg>
)
