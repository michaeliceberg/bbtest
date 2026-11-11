'use client'

// components/lesson-label-preview.tsx — живая картинка вместо названия урока на карте тренажёра: вместо слов показываем,
// о чём урок. Пока готово для двух уроков логарифмов; у остальных остаётся обычное название (previewFor вернёт null).
// Только transform/opacity, анимации бесконечные и лёгкие (две-три цифры).

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
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

// Общий ритм: 3 секунды на цикл. Хелперы: подпрыгивающая/мерцающая цифра по ключевым кадрам.
const LOOP = { repeat: Infinity, ease: 'easeInOut' as const }
const T = 3

// «Как вычитать логарифмы?»: log₂8 − log₂4 — левый логарифм уезжает влево, правый вправо, минус растягивается, и обратно.
const LogSubPreview = () => (
    <span className="inline-flex items-center text-[22px] font-black leading-none">
        <motion.span className="inline-block" animate={{ x: [0, -9, 0] }} transition={{ ...LOOP, duration: 1.6 }}><Log base="2" arg="8" /></motion.span>
        <motion.span className="mx-3 inline-block" animate={{ scaleX: [1, 1.9, 1] }} transition={{ ...LOOP, duration: 1.6 }}>−</motion.span>
        <motion.span className="inline-block" animate={{ x: [0, 9, 0] }} transition={{ ...LOOP, duration: 1.6 }}><Log base="2" arg="4" /></motion.span>
    </span>
)

// «Сумма и разность логарифмов — тренировка»: log₂ ± log₂ — знак по очереди то плюс, то минус.
const SumDiffPreview = () => (
    <span className="inline-flex items-center text-[22px] font-black leading-none">
        <Log base="2" arg="x" />
        <span className="relative mx-2 inline-block w-[1em] text-center">
            <motion.span className="absolute inset-0" animate={{ opacity: [1, 1, 0, 0, 1], scale: [1, 1, 0.4, 0.4, 1] }} transition={{ ...LOOP, duration: T, times: [0, 0.4, 0.5, 0.9, 1] }}>+</motion.span>
            <motion.span className="absolute inset-0" animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.4, 0.4, 1, 1, 0.4] }} transition={{ ...LOOP, duration: T, times: [0, 0.4, 0.5, 0.9, 1] }}>−</motion.span>
            <span className="invisible">+</span>
        </span>
        <Log base="2" arg="y" />
    </span>
)

// «Степени»: log₂³5⁷ ↔ ⁷⁄₃·log₂5 — показатели уходят в дробь слева и возвращаются.
const PowPreview = () => (
    <span className="inline-flex items-center text-[22px] font-black leading-none">
        <span className="mr-1 inline-block text-center text-[0.62em] leading-none">
            <motion.span className="block border-b-2 border-current px-0.5 pb-0.5" animate={{ opacity: [0, 0, 1, 1, 0], y: [-8, -8, 0, 0, -8] }} transition={{ ...LOOP, duration: T, times: [0, 0.3, 0.5, 0.85, 1] }}>7</motion.span>
            <motion.span className="block px-0.5 pt-0.5" animate={{ opacity: [0, 0, 1, 1, 0], y: [8, 8, 0, 0, 8] }} transition={{ ...LOOP, duration: T, times: [0, 0.3, 0.5, 0.85, 1] }}>3</motion.span>
        </span>
        <span className="inline-flex items-baseline">
            log<sub className="ml-px text-[0.7em]" style={{ lineHeight: 0 }}>2</sub>
            <motion.sup className="text-[0.55em]" style={{ lineHeight: 0 }} animate={{ opacity: [1, 1, 0, 0, 1] }} transition={{ ...LOOP, duration: T, times: [0, 0.3, 0.45, 0.85, 1] }}>3</motion.sup>
            <span className="ml-0.5">5</span>
            <motion.sup className="text-[0.55em]" style={{ lineHeight: 0 }} animate={{ opacity: [1, 1, 0, 0, 1] }} transition={{ ...LOOP, duration: T, times: [0, 0.3, 0.45, 0.85, 1] }}>7</motion.sup>
        </span>
    </span>
)

// «Логарифм в степени»: 8^(log₂3) — 8 и 3 меняются местами (восьмёрка облетает по дуге вверх, тройка спускается).
const SwapPreview = () => (
    <span className="relative inline-flex h-8 w-[88px] items-end text-[22px] font-black leading-none">
        <motion.span className="absolute bottom-0 left-0 inline-block"
            animate={{ x: [0, 22, 56, 56, 22, 0, 0], y: [0, -20, -10, -10, -20, 0, 0] }} transition={{ ...LOOP, duration: T + 1, times: [0, 0.15, 0.3, 0.6, 0.75, 0.9, 1] }}>8</motion.span>
        <span className="absolute bottom-3 left-[18px] inline-flex items-baseline text-[0.62em]">log<sub className="ml-px" style={{ lineHeight: 0 }}>2</sub></span>
        <motion.span className="absolute bottom-3 left-[56px] inline-block text-[0.62em]"
            animate={{ x: [0, -22, -56, -56, -22, 0, 0], y: [0, 6, 10, 10, 6, 0, 0] }} transition={{ ...LOOP, duration: T + 1, times: [0, 0.15, 0.3, 0.6, 0.75, 0.9, 1] }}>3</motion.span>
    </span>
)

// «Деление логарифмов»: log₂9 / log₂3 — одинаковые log₂ сверху и снизу бледнеют и вычёркиваются, остаются 9 и 3.
const LogDivPreview = () => {
    const fade = { opacity: [1, 1, 0.15, 0.15, 1] }
    const tr = { ...LOOP, duration: T, times: [0, 0.3, 0.5, 0.85, 1] }
    const Row = ({ n }: { n: string }) => (
        <span className="inline-flex items-baseline leading-none">
            <motion.span className="inline-flex items-baseline" animate={fade} transition={tr}>log<sub className="ml-px text-[0.7em]" style={{ lineHeight: 0 }}>2</sub></motion.span>
            <span className="ml-0.5">{n}</span>
        </span>
    )
    return (
        <span className="inline-flex flex-col items-center text-[17px] font-black leading-none">
            <span className="border-b-2 border-current px-1 pb-1"><Row n="9" /></span>
            <span className="px-1 pt-1"><Row n="3" /></span>
        </span>
    )
}

// «К-к-комбо логарифмов»: log₂3 · log₃4 — две одинаковые тройки вспыхивают и исчезают, остаются края.
const ComboPreview = () => {
    const pop = { opacity: [1, 1, 0.1, 0.1, 1], scale: [1, 1.5, 1, 1, 1] }
    const tr = { ...LOOP, duration: T, times: [0, 0.3, 0.5, 0.85, 1] }
    return (
        <span className="inline-flex items-baseline text-[22px] font-black leading-none">
            log<sub className="ml-px text-[0.7em]" style={{ lineHeight: 0 }}>2</sub>
            <motion.span className="ml-0.5 inline-block" animate={pop} transition={tr}>3</motion.span>
            <span className="mx-1.5">·</span>
            log<motion.sub className="ml-px inline-block text-[0.7em]" style={{ lineHeight: 0 }} animate={pop} transition={tr}>3</motion.sub>
            <span className="ml-0.5">4</span>
        </span>
    )
}

// «Перевёртыш»: log₂8 — основание и аргумент меняются местами (по дуге), и обратно.
const FlipPreview = () => (
    <span className="relative inline-flex h-8 w-[78px] items-end text-[22px] font-black leading-none">
        <span className="absolute bottom-0 left-0">log</span>
        <motion.span className="absolute bottom-0 left-[38px] text-[0.7em]" animate={{ x: [0, 14, 28, 28, 14, 0, 0], y: [0, 12, 0, 0, 12, 0, 0] }} transition={{ ...LOOP, duration: T + 1, times: [0, 0.15, 0.3, 0.6, 0.75, 0.9, 1] }}>2</motion.span>
        <motion.span className="absolute bottom-0 left-[56px]" animate={{ x: [0, -14, -28, -28, -14, 0, 0], y: [0, -16, 0, 0, -16, 0, 0] }} transition={{ ...LOOP, duration: T + 1, times: [0, 0.15, 0.3, 0.6, 0.75, 0.9, 1] }}>8</motion.span>
    </span>
)

// «Отрицательные степени в логарифмах»: log₂⅛ = −3 — минус подпрыгивает.
const NegPowPreview = () => (
    <span className="inline-flex items-center text-[20px] font-black leading-none">
        <span className="inline-flex items-baseline">log<sub className="ml-px text-[0.7em]" style={{ lineHeight: 0 }}>2</sub>
            <span className="ml-0.5 inline-block text-center text-[0.62em]"><span className="block border-b-2 border-current px-0.5 pb-0.5">1</span><span className="block px-0.5 pt-0.5">8</span></span>
        </span>
        <span className="mx-1.5">=</span>
        <motion.span className="inline-block" animate={{ scale: [1, 1.6, 1], rotate: [0, -8, 0] }} transition={{ ...LOOP, duration: 1.4 }}>−</motion.span>
        <span>3</span>
    </span>
)

const norm = (t: string) => t.trim().toLowerCase().replace(/\?+$/, '')
const PREVIEWS: Record<string, () => ReactNode> = {
    'что такое логарифм': () => <LogDefPreview />,
    'как складывать логарифмы': () => <LogSumPreview />,
    'как вычитать логарифмы': () => <LogSubPreview />,
    'сумма и разность логарифмов — тренировка': () => <SumDiffPreview />,
    'степени': () => <PowPreview />,
    'логарифм в степени': () => <SwapPreview />,
    'деление логарифмов': () => <LogDivPreview />,
    'к-к-комбо логарифмов': () => <ComboPreview />,
    'перевёртыш': () => <FlipPreview />,
    'отрицательные степени в логарифмах': () => <NegPowPreview />,
}

export const hasLessonPreview = (title: string) => norm(title) in PREVIEWS

export const LessonLabelPreview = ({ title, color }: { title: string; color: string }) => {
    const make = PREVIEWS[norm(title)]
    const outer = useRef<HTMLSpanElement>(null)
    const inner = useRef<HTMLSpanElement>(null)
    const [k, setK] = useState(1)
    // на узком экране картинка шире доступного места: уменьшаем целиком (transform), а не режем многоточием
    useLayoutEffect(() => {
        const fit = () => {
            const o = outer.current, n = inner.current
            if (!o || !n) return
            const avail = o.parentElement?.clientWidth ?? o.clientWidth
            const need = n.offsetWidth - 12
            setK(avail > 0 && need > avail ? Math.max(0.5, avail / need) : 1)
        }
        fit()
        window.addEventListener('resize', fit)
        return () => window.removeEventListener('resize', fit)
    }, [title])
    if (!make) return null
    return (
        <span ref={outer} className="block" style={{ color }} aria-label={title} title={title}>
            <span ref={inner} className="-ml-3 inline-block px-3 py-2" style={{ transform: `scale(${k})`, transformOrigin: 'left center' }}>
                {make()}
            </span>
        </span>
    )
}
