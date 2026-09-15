// components/geometry/WalkthroughMarker.tsx
//
// Общий маркер-текстовыделитель для всех интерактивных разборов по
// шагам (TrapezoidWalkthrough, TangentialQuadWalkthrough и т.д.) —
// вынесен из TrapezoidWalkthrough.tsx при появлении ВТОРОГО такого
// разбора, чтобы не копировать одну и ту же хореографию во второй раз.
//
// История цвета (см. предыдущие раунды обратной связи): тёмно-фиолетовый
// сливался с тёмным фоном приложения; розово-красный читался как
// "ошибка". Итог — яркий фиолетовый (тот же акцент, что и у бейджа
// "разбор по шагам" в ChallengeNav, и у HYPOTENUSE_COLOR в
// TrapezoidDiagram) — не сливается с фоном, не ассоциируется с
// error-состоянием. Расширен ТОЛЬКО вниз от исходной позиции (верхний
// край подтверждён пользователем как корректный) — захватывает нижние
// выносные элементы букв (р, у, б...).

import { motion } from 'framer-motion'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'

// Цвета маркера-текстовыделителя — из «Палитры ggege» (см. CLAUDE.md), по
// прямой просьбе пользователя (2026-09-15) использовать те же 6 цветов,
// что и кнопки уроков на /learn. Фиолетовый — тот же, что HYPOTENUSE_COLOR
// в TrapezoidDiagram/RightTriangleDiagram (единая роль "вот что мы сейчас
// ищем"/ключевой термин).
export const MARKER_COLOR = hexToRgba(GGEGE_PALETTE.purple.button, 0.85)
// Зелёный вариант маркера — для ключевых слов, помеченных тем же цветом,
// что и зелёные подписи "катет" на RightTriangleDiagram (см. TypeSinWalk).
export const MARKER_COLOR_GREEN = hexToRgba(GGEGE_PALETTE.green.button, 0.85)

// color — необязательный, по умолчанию фиолетовый MARKER_COLOR (все уже
// существующие вызовы без явного цвета продолжают работать как раньше).
export const HighlightWord = ({ children, active, color = MARKER_COLOR }: { children: React.ReactNode; active: boolean; color?: string }) => (
    <span className="relative inline-block whitespace-nowrap">
        <motion.span
            className="absolute -inset-x-1.5 top-[0.03em] h-[1.25em] rounded-[3px]"
            style={{ backgroundColor: color, transformOrigin: 'left center' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: active ? 1 : 0 }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
        />
        <span className="relative">{children}</span>
    </span>
)
