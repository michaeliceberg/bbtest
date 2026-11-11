'use client'

// components/lesson-label-preview.tsx — живая картинка вместо названия урока на карте тренажёра: вместо слов показываем,
// о чём урок. Пока готово для двух уроков логарифмов; у остальных остаётся обычное название (previewFor вернёт null).
// Только transform/opacity, анимации бесконечные и лёгкие (две-три цифры).

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

const CYCLE = 2.8

const Log = ({ base, arg }: { base: string; arg: ReactNode }) => (
    <span className="inline-flex items-baseline whitespace-nowrap">
        log<sub className="ml-px text-[0.7em]" style={{ lineHeight: 0 }}>{base}</sub><span className="ml-0.5">{arg}</span>
    </span>
)

// «Как складывать логарифмы?»: log₂3 + log₂5 — левый логарифм летит вправо, правый влево, столкнулись, разлетелись, и так по кругу.
const LogSumPreview = () => (
    <span className="inline-flex items-center text-[22px] font-black leading-none">
        <motion.span className="inline-block" animate={{ x: [0, 12, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', times: [0, 0.5, 1] }}>
            <Log base="2" arg="3" />
        </motion.span>
        <motion.span className="mx-3.5 inline-block" animate={{ scale: [1, 1.35, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', times: [0, 0.5, 1] }}>+</motion.span>
        <motion.span className="inline-block" animate={{ x: [0, -12, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', times: [0, 0.5, 1] }}>
            <Log base="2" arg="5" />
        </motion.span>
    </span>
)

// «Что такое логарифм?»: log₂8 = ? — по очереди подпрыгивают двойка, восьмёрка и вопрос, пауза, и снова.
const Bounce = ({ delay, children, className }: { delay: number; children: ReactNode; className?: string }) => (
    <motion.span className={`inline-block ${className ?? ''}`} animate={{ scale: [1, 1.7, 1] }}
        transition={{ duration: 0.55, delay, repeat: Infinity, repeatDelay: CYCLE - 0.55, ease: 'easeOut' }}>
        {children}
    </motion.span>
)
const LogDefPreview = () => (
    <span className="inline-flex items-baseline text-[22px] font-black leading-none">
        <span>log</span>
        <Bounce delay={0} className="ml-px text-[0.7em]"><sub style={{ lineHeight: 0 }}>2</sub></Bounce>
        <Bounce delay={0.5} className="ml-0.5">8</Bounce>
        <span className="mx-2">=</span>
        <Bounce delay={1.0}>?</Bounce>
    </span>
)

const norm = (t: string) => t.trim().toLowerCase().replace(/\?+$/, '')
const PREVIEWS: Record<string, () => ReactNode> = {
    'что такое логарифм': () => <LogDefPreview />,
    'как складывать логарифмы': () => <LogSumPreview />,
}

export const hasLessonPreview = (title: string) => norm(title) in PREVIEWS

export const LessonLabelPreview = ({ title, color }: { title: string; color: string }) => {
    const make = PREVIEWS[norm(title)]
    if (!make) return null
    return (
        <span className="inline-block py-1" style={{ color }} aria-label={title} title={title}>
            {make()}
        </span>
    )
}
