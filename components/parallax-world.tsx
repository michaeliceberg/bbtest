'use client'

// components/parallax-world.tsx — «мир в глубине» за длинной страницей (прототип, /test-parallax).
// 3 слоя фона двигаются при прокрутке медленнее страницы (параллакс): дальний 0.12, средний 0.3, ближний 0.55.
// Дёшево по производительности: каждый слой — один элемент, который сдвигается только через transform
// (framer-motion useScroll/useTransform, без перерисовки React); никаких blur/теней/анимации прозрачности.
// Дальний слой — небо и горы, средний — замок, лес, корабли, пещера, ближний — летучие мыши, камни, кристаллы.
// Объекты стоят по краям, чтобы не мешать карте уроков в центре. Рисунки — свои простые SVG-силуэты.

import { useEffect, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { RICH_LAYERS, RICH_PANELS } from '@/components/parallax-world-rich'


// stars — глубина звёздного неба на этом слое (0 дальний, 1 средний, 2 ближний), см. StarSky.
export type LayerSpec = { speed: number; color: string; accent: string; stars?: 0 | 1 | 2 }

// ===== Звёздное небо на всю ширину =====
// Дальний слой — много мелких тусклых звёзд, средний — меньше и ярче, ближний — немного крупных.
// Координаты x в процентах (SVG cx="12%"), радиус в пикселях — звёзды не растягиваются на широком экране.
// Всё статично, мерцают только несколько ближних звёзд (CSS-анимация прозрачности).
const STAR_DEPTH = [
    { count: 70, r: [0.6, 1.1], op: [0.14, 0.3] },
    { count: 34, r: [1, 1.6], op: [0.25, 0.42] },
    { count: 14, r: [1.6, 2.4], op: [0.38, 0.6] },
] as const
const rng = (seed: number) => () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const StarSky = ({ depth, seed }: { depth: 0 | 1 | 2; seed: number }) => {
    const d = STAR_DEPTH[depth]
    const r = rng(seed * 97 + depth * 13 + 1)
    const stars = Array.from({ length: d.count }, () => ({
        x: r() * 100, y: r() * 1000,
        rad: d.r[0] + r() * (d.r[1] - d.r[0]),
        op: d.op[0] + r() * (d.op[1] - d.op[0]),
    }))
    return (
        <svg width="100%" height={PANEL_H} aria-hidden className="block">
            {stars.map((s, i) => {
                const twinkle = depth === 2 && i % 4 === 0
                return (
                    <circle key={i} cx={`${s.x}%`} cy={s.y} r={s.rad} fill="#CFE6F5" opacity={s.op}
                        className={twinkle ? 'animate-star-twinkle' : undefined}
                        style={twinkle ? { animationDelay: `${(i % 7) * 0.6}s` } : undefined} />
                )
            })}
        </svg>
    )
}
// Чем дальше слой — тем медленнее и тем ближе к цвету фона.
export const LAYERS: LayerSpec[] = [
    { speed: 0.12, color: '#1B2830', accent: '#22323C' },
    { speed: 0.3, color: '#213240', accent: '#2A3E4C' },
    { speed: 0.55, color: '#283C4A', accent: '#33495A' },
]

const PANEL_H = 1000

// ===== Силуэты =====
type ShapeProps = { w: number; color: string; accent?: string; flip?: boolean }
const Mountains = ({ w, color, accent }: ShapeProps) => (
    <svg width={w} height={w * 0.42} viewBox="0 0 500 210" aria-hidden>
        <path d="M0 210 L70 90 L120 140 L200 30 L270 120 L320 70 L400 150 L450 100 L500 160 L500 210 Z" fill={color} />
        <path d="M200 30 L222 62 L206 58 L196 70 L184 56 Z M320 70 L334 92 L322 88 L314 98 L306 88 Z" fill={accent ?? color} />
    </svg>
)
const Castle = ({ w, color, accent }: ShapeProps) => (
    <svg width={w} height={w * 0.9} viewBox="0 0 200 180" aria-hidden>
        <path d="M20 180 V70 H10 V50 H22 V60 H34 V50 H46 V60 H58 V50 H70 V70 H60 V180 Z" fill={color} />
        <path d="M140 180 V70 H130 V50 H142 V60 H154 V50 H166 V60 H178 V50 H190 V70 H180 V180 Z" fill={color} />
        <path d="M60 180 V95 H66 V82 H78 V92 H90 V82 H102 V92 H114 V82 H126 V92 H134 V95 H140 V180 Z" fill={color} />
        <path d="M84 30 V95 H116 V30 L100 10 Z" fill={color} />
        <path d="M100 0 V14 L114 7 Z" fill={accent ?? color} />
        <path d="M88 180 V145 Q100 130 112 145 V180 Z" fill="#131D22" opacity={0.6} />
        <rect x="95" y="45" width="10" height="14" rx="5" fill="#F2C35B" opacity={0.35} />
    </svg>
)
const Ship = ({ w, color, accent, flip }: ShapeProps) => (
    <svg width={w} height={w * 0.85} viewBox="0 0 160 136" aria-hidden style={flip ? { transform: 'scaleX(-1)' } : undefined}>
        <path d="M10 100 H150 L130 128 H30 Z" fill={color} />
        <path d="M78 20 V100 H82 V20 Z" fill={color} />
        <path d="M84 24 Q122 52 84 92 Z" fill={accent ?? color} />
        <path d="M76 30 Q44 60 76 92 Z" fill={accent ?? color} />
        <path d="M82 20 L104 14 L82 8 Z" fill={color} />
    </svg>
)
const Pines = ({ w, color, accent }: ShapeProps) => (
    <svg width={w} height={w * 1.1} viewBox="0 0 120 132" aria-hidden>
        <path d="M30 132 V110 L4 110 L22 84 L10 84 L28 58 L18 58 L36 26 L54 58 L44 58 L62 84 L50 84 L68 110 L42 110 V132 Z" fill={color} />
        <path d="M84 132 V112 L64 112 L80 88 L70 88 L86 62 L102 88 L92 88 L108 112 L90 112 V132 Z" fill={accent ?? color} />
    </svg>
)
const Cloud = ({ w, color }: ShapeProps) => (
    <svg width={w} height={w * 0.45} viewBox="0 0 160 72" aria-hidden>
        <path d="M20 70 Q0 70 4 52 Q8 36 28 40 Q30 14 58 16 Q76 0 98 14 Q126 8 130 36 Q158 36 156 56 Q154 70 136 70 Z" fill={color} />
    </svg>
)
const Moon = ({ w, color, accent }: ShapeProps) => (
    <svg width={w} height={w} viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="46" fill={accent ?? color} />
        <circle cx="66" cy="38" r="40" fill="#131D22" />
    </svg>
)
const Bat = ({ w, color }: ShapeProps) => (
    <svg width={w} height={w * 0.5} viewBox="0 0 100 50" aria-hidden>
        <path d="M50 20 L44 12 L46 24 Q30 8 4 14 Q18 22 16 34 Q30 26 40 36 L50 30 L60 36 Q70 26 84 34 Q82 22 96 14 Q70 8 54 24 L56 12 Z" fill={color} />
    </svg>
)
const Waves = ({ w, color }: ShapeProps) => (
    <svg width={w} height={w * 0.12} viewBox="0 0 300 36" aria-hidden>
        <path d="M0 18 Q25 0 50 18 T100 18 T150 18 T200 18 T250 18 T300 18 V36 H0 Z" fill={color} />
    </svg>
)
const Stalactites = ({ w, color, accent }: ShapeProps) => (
    <svg width={w} height={w * 0.5} viewBox="0 0 240 120" aria-hidden>
        <path d="M0 0 H240 V10 L222 70 L206 14 L190 96 L172 18 L156 60 L140 12 L118 110 L98 16 L84 64 L66 14 L48 88 L30 16 L14 54 L0 10 Z" fill={color} />
        <path d="M118 110 L112 70 L124 70 Z" fill={accent ?? color} />
    </svg>
)
const Crystals = ({ w, color, accent }: ShapeProps) => (
    <svg width={w} height={w * 0.8} viewBox="0 0 100 80" aria-hidden>
        <path d="M30 80 L22 30 L34 8 L44 30 L40 80 Z" fill={accent ?? color} />
        <path d="M44 80 L50 22 L62 0 L72 24 L64 80 Z" fill={color} />
        <path d="M66 80 L70 46 L80 34 L88 48 L82 80 Z" fill={accent ?? color} />
    </svg>
)
const Rocks = ({ w, color, accent }: ShapeProps) => (
    <svg width={w} height={w * 0.45} viewBox="0 0 160 72" aria-hidden>
        <path d="M0 72 L14 34 L40 22 L62 40 L60 72 Z" fill={color} />
        <path d="M54 72 L70 16 L104 4 L128 30 L140 72 Z" fill={accent ?? color} />
        <path d="M130 72 L140 48 L160 44 V72 Z" fill={color} />
    </svg>
)

export type Item = { y: number; x: string; el: (c: LayerSpec) => React.ReactNode }
// У каждого слоя своя лента «панелей» по PANEL_H пикселей (в координатах слоя), они идут по кругу.
// Шаг ≥ высоты экрана, поэтому даже медленный дальний слой не сваливает всё на один экран.
// x — CSS left: объекты по краям, чтобы центр с картой оставался чистым.
const LAYER_PANELS: Item[][][] = [
    // дальний: небо и горы
    [
        [{ y: 60, x: '70%', el: (c) => <Moon w={90} color={c.color} accent={c.accent} /> },
         { y: 560, x: '-12%', el: (c) => <Mountains w={560} color={c.color} accent={c.accent} /> }],
        [{ y: 160, x: '-4%', el: (c) => <Cloud w={190} color={c.color} /> },
         { y: 600, x: '45%', el: (c) => <Mountains w={560} color={c.color} accent={c.accent} /> }],
    ],
    // средний: замок, лес, море с кораблями, пещера
    [
        [{ y: 150, x: '74%', el: (c) => <Castle w={170} color={c.color} accent={c.accent} /> },
         { y: 640, x: '-2%', el: (c) => <Pines w={140} color={c.color} accent={c.accent} /> }],
        [{ y: 180, x: '2%', el: (c) => <Ship w={140} color={c.color} accent={c.accent} /> },
         { y: 300, x: '-10%', el: (c) => <Waves w={360} color={c.color} /> },
         { y: 620, x: '74%', el: (c) => <Ship w={120} color={c.color} accent={c.accent} flip /> },
         { y: 720, x: '64%', el: (c) => <Waves w={360} color={c.color} /> }],
        [{ y: 120, x: '78%', el: (c) => <Stalactites w={200} color={c.color} accent={c.accent} /> },
         { y: 640, x: '1%', el: (c) => <Crystals w={110} color={c.color} accent={c.accent} /> }],
    ],
    // ближний: летучие мыши, камни, ёлки, кристаллы
    [
        [{ y: 220, x: '84%', el: (c) => <Bat w={60} color={c.accent} /> },
         { y: 760, x: '-2%', el: (c) => <Rocks w={150} color={c.color} accent={c.accent} /> }],
        [{ y: 320, x: '86%', el: (c) => <Pines w={90} color={c.color} accent={c.accent} /> },
         { y: 700, x: '3%', el: (c) => <Bat w={50} color={c.accent} /> }],
        [{ y: 260, x: '2%', el: (c) => <Crystals w={90} color={c.color} accent={c.accent} /> },
         { y: 720, x: '84%', el: (c) => <Rocks w={130} color={c.color} accent={c.accent} /> }],
    ],
]

const Layer = ({ spec, index, layers, panels }: { spec: LayerSpec; index: number; layers: number; panels: Item[][] }) => {
    const { scrollY } = useScroll()
    const reduce = useReducedMotion()
    const speed = reduce ? 0 : spec.speed
    const y = useTransform(scrollY, (v) => -v * speed)
    // Сколько панелей нужно, чтобы слой закрыл экран на всей длине страницы.
    const [count, setCount] = useState(3)
    useEffect(() => {
        const update = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight
            setCount(Math.ceil((window.innerHeight + max * speed) / PANEL_H) + 1)
        }
        update()
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
    }, [speed])
    if (index >= layers) return null
    return (
        <motion.div className="absolute inset-x-0 top-0" style={{ y, willChange: 'transform' }}>
            {spec.stars !== undefined && Array.from({ length: count }, (_, k) => (
                <div key={`sky-${k}`} className="absolute inset-x-0" style={{ top: k * PANEL_H, height: PANEL_H }}>
                    <StarSky depth={spec.stars!} seed={k % 3} />
                </div>
            ))}
            {Array.from({ length: count }, (_, k) => panels[k % panels.length].map((it, j) => (
                <div key={`${k}-${j}`} className="absolute" style={{ top: k * PANEL_H + it.y, left: it.x }}>
                    {it.el(spec)}
                </div>
            )))}
        </motion.div>
    )
}

// layers — сколько слоёв рисовать (на слабых телефонах можно 2). enabled — выключатель для сравнения.
// variant: 'simple' — плоские силуэты, 'rich' — детальные рисунки (components/parallax-world-rich.tsx).
// behind — положить фон ПОД обычный (непозиционированный) контент страницы (z-index −10), как на /trainer.
export const ParallaxWorld = ({ layers = 3, enabled = true, variant = 'simple', behind = false }: { layers?: number; enabled?: boolean; variant?: 'simple' | 'rich'; behind?: boolean }) => {
    if (!enabled) return null
    const specs = variant === 'rich' ? RICH_LAYERS : LAYERS
    const panels = variant === 'rich' ? RICH_PANELS : LAYER_PANELS
    return (
        <div aria-hidden className={`pointer-events-none fixed inset-0 overflow-hidden ${behind ? '-z-10' : '-z-0'}`}>
            {specs.map((spec, i) => <Layer key={`${variant}-${i}`} spec={spec} index={i} layers={layers} panels={panels[i]} />)}
        </div>
    )
}
