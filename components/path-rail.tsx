'use client'

// components/path-rail.tsx — «тропинка» между этапами на карте тренажёра в игровом стиле.
// Не пройдено: тёмный жёлоб с вдавленной тенью и «камешками». Пройдено: объёмная трубка цвета
// темы (градиент + блик сверху + свечение), по ней бежит отблеск. Анимации — только transform/opacity.
import { motion } from 'framer-motion'
import { hexToRgba } from '@/src/constants/lessonButtonColors'

type Props = {
    vertical?: boolean
    filled: boolean // этап перед тропинкой пройден
    fuse?: boolean // «фитиль»: тропинка загорается прямо сейчас (после прохождения урока)
    revealed?: boolean // фитиль уже догорел
    reversed?: boolean // змейка идёт справа налево
    color: string // основной цвет темы
    edge: string // тёмный оттенок темы
    groove: string // цвет пустого жёлоба (как рамка закрытого этапа)
}

export const PathRail = ({ vertical = false, filled, fuse = false, revealed = false, reversed = false, color, edge, groove }: Props) => {
    const studs = vertical
        ? 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.14) 1.3px, transparent 1.8px) center / 100% 9px repeat-y'
        : 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.14) 1.3px, transparent 1.8px) center / 9px 100% repeat-x'
    const fill = vertical
        ? `linear-gradient(90deg, ${edge} 0%, ${color} 45%, ${color} 70%, ${edge} 100%)`
        : `linear-gradient(180deg, ${color} 0%, ${color} 55%, ${edge} 100%)`
    const origin = vertical ? 'top' : reversed ? 'right' : 'left'
    const showFill = filled || fuse
    return (
        <div
            className={`relative rounded-full ${vertical ? 'w-2 h-6' : 'h-2'}`}
            style={{
                background: `${studs}, linear-gradient(${vertical ? '90deg' : '180deg'}, rgba(0,0,0,0.55), rgba(0,0,0,0.25)), ${groove}`,
                boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.65), 0 1px 0 rgba(255,255,255,0.06)',
            }}
        >
            {showFill && (
                <motion.div
                    className="absolute inset-0 rounded-full overflow-hidden"
                    style={{
                        background: fill,
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.45), 0 0 8px ${hexToRgba(color, 0.55)}`,
                        transformOrigin: origin,
                    }}
                    initial={fuse ? (vertical ? { scaleY: 0 } : { scaleX: 0 }) : false}
                    animate={vertical ? { scaleY: fuse ? (revealed ? 1 : 0) : 1 } : { scaleX: fuse ? (revealed ? 1 : 0) : 1 }}
                    transition={fuse ? { duration: 0.45, ease: 'easeInOut' } : { duration: 0 }}
                >
                    {/* бегущий отблеск */}
                    <span className={`absolute ${vertical ? 'inset-x-0 h-1/2 animate-rail-shine-y' : 'inset-y-0 w-1/2 animate-rail-shine-x'}`}
                        style={{ background: vertical
                            ? 'linear-gradient(180deg, transparent, rgba(255,255,255,0.55), transparent)'
                            : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)' }} />
                </motion.div>
            )}
        </div>
    )
}
