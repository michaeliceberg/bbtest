// components/geometry/WalkthroughCards.tsx
//
// Карточки для «гениальных выводов» и знакомства с персонажами в
// интерактивных разборах (*WALK). Стиль — тёплый «cozy» (как экран «Квесты
// дня», /test-quests-cozy): плоские блоки с толстой нижней гранью, медовые и
// деревянные тона, заголовок с коричневой «3D»-тенью. Анимации — только
// transform/opacity (см. CLAUDE.md про производительность на iPhone).

'use client'

import { motion } from 'framer-motion'
import { COZY } from '@/lib/cozyTheme'

const HEADLINE_SHADOW = `0 3px 0 ${COZY.headlineShadow}, 0 6px 0 rgba(0,0,0,0.35)`

// Медовая плашка-ярлык над карточкой («💡 ВЫВОД», «⚡ НОВЫЙ ГЕРОЙ» и т.п.).
const Tab = ({ children, bg, edge, color }: { children: React.ReactNode; bg: string; edge: string; color: string }) => (
    <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-3 py-1 text-xs font-black uppercase tracking-[0.14em]"
        style={{ background: bg, color, boxShadow: `0 3px 0 ${edge}` }}>
        {children}
    </div>
)

// Одноразовый блик, пробегающий по карточке при появлении.
const Shine = () => (
    <motion.span aria-hidden className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3"
        style={{ background: 'linear-gradient(100deg, transparent, rgba(255,241,220,0.22), transparent)' }}
        initial={{ x: '0%' }} animate={{ x: '420%' }} transition={{ duration: 1.1, delay: 0.35, ease: 'easeInOut' }} />
)

/** Карточка-вывод: главный итог шага разбора крупно и красиво. */
export const InsightCard = ({ children, label = '💡 Вывод' }: { children: React.ReactNode; label?: string }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', bounce: 0.45, duration: 0.6 }}
        className="relative w-full mt-4"
    >
        <div className="relative overflow-hidden rounded-2xl px-5 pt-6 pb-5 text-center text-lg md:text-xl font-extrabold leading-snug"
            style={{ background: COZY.honeyCard, border: `3px solid ${COZY.honeyBorder}`, boxShadow: `0 6px 0 ${COZY.honeyEdge}`, color: COZY.title }}>
            <Shine />
            <div className="relative">{children}</div>
        </div>
        <Tab bg={COZY.honey} edge="#B8862E" color={COZY.darkText}>{label}</Tab>
    </motion.div>
)

/** Акцент внутри карточки-вывода: медовое слово с «3D»-тенью. */
export const InsightWord = ({ children, color = COZY.headline }: { children: React.ReactNode; color?: string }) => (
    <span className="font-black" style={{ color, textShadow: `0 2px 0 ${COZY.headlineShadow}` }}>{children}</span>
)

type Stat = { icon: string; label: string; value: string }

/** Карточка-знакомство с персонажем (в духе карточки героя из игры). */
export const CharacterCard = ({ avatar, badge, title, name, tagline, stats, accent = COZY.headline }: {
    avatar: string
    badge?: string
    title: string
    name: string
    tagline: string
    stats: Stat[]
    accent?: string
}) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: -3 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: 'spring', bounce: 0.5, duration: 0.7 }}
        className="relative w-full mt-4"
    >
        <div className="relative overflow-hidden rounded-2xl px-4 pt-7 pb-4"
            style={{ background: COZY.wood, border: `3px solid ${COZY.woodBorder}`, boxShadow: `0 6px 0 ${COZY.woodEdge}` }}>
            <Shine />
            <div className="relative flex items-center gap-4">
                <motion.div
                    className="relative shrink-0 flex items-center justify-center w-20 h-20 rounded-2xl text-5xl"
                    style={{ background: COZY.card, border: `3px solid ${accent}`, boxShadow: `0 4px 0 ${COZY.cardEdge}` }}
                    initial={{ scale: 0.2 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.65, delay: 0.25 }}
                >
                    <span>{avatar}</span>
                    {badge && (
                        <span className="absolute -bottom-2 -right-2 flex items-center justify-center w-9 h-9 rounded-full text-xl"
                            style={{ background: COZY.honey, boxShadow: `0 3px 0 #B8862E` }}>{badge}</span>
                    )}
                </motion.div>
                <div className="min-w-0 text-left">
                    <p className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: COZY.textSoft }}>Приятно познакомиться!</p>
                    <p className="text-sm font-extrabold mt-1" style={{ color: COZY.title }}>{title}</p>
                    <p className="text-2xl md:text-3xl font-black leading-tight mt-0.5" style={{ color: accent, textShadow: HEADLINE_SHADOW }}>{name}</p>
                </div>
            </div>
            <p className="relative mt-3 text-sm md:text-base font-bold text-center" style={{ color: COZY.title }}>{tagline}</p>
            <div className="relative mt-3 grid grid-cols-1 gap-2">
                {stats.map((s, i) => (
                    <motion.div key={s.label}
                        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.25, type: 'spring', bounce: 0.35 }}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold"
                        style={{ background: COZY.card, border: `2px solid ${COZY.cardBorder}`, boxShadow: `0 3px 0 ${COZY.cardEdge}` }}>
                        <span className="text-lg leading-none">{s.icon}</span>
                        <span style={{ color: COZY.textSoft }}>{s.label}:</span>
                        <span className="ml-auto text-right" style={{ color: COZY.title }}>{s.value}</span>
                    </motion.div>
                ))}
            </div>
        </div>
        <Tab bg={accent} edge={COZY.headlineShadow} color={COZY.darkText}>⚡ Новый герой</Tab>
    </motion.div>
)
