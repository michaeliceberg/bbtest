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

export const MARKER_COLOR = 'rgba(139, 92, 246, 0.85)' // violet-500 @ 85%

export const HighlightWord = ({ children, active }: { children: React.ReactNode; active: boolean }) => (
    <span className="relative inline-block whitespace-nowrap">
        <motion.span
            className="absolute -inset-x-1.5 top-[0.03em] h-[1.25em] rounded-[3px]"
            style={{ backgroundColor: MARKER_COLOR, transformOrigin: 'left center' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: active ? 1 : 0 }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
        />
        <span className="relative">{children}</span>
    </span>
)
