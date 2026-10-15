'use client'

// components/parallax-themes.tsx — «миры» параллакс-фона по разделам тренажёра.
// Дальний слой (звёздное небо, луна, горы) общий для всех, у каждого раздела свой СРЕДНИЙ слой с рисунками.
// Правила те же, что в parallax-world-rich.tsx: всё статично, цвета приглушённые, огоньки — низкая прозрачность.

import { useId } from 'react'
import type { Item } from '@/components/parallax-world'

export type ParallaxTheme = 'default' | 'trig' | 'planim'
export const PARALLAX_THEME_LABELS: Record<ParallaxTheme, string> = {
    default: 'Общий',
    trig: 'Тригонометрия',
    planim: 'Планиметрия',
}

const WARM = '#F2C35B'
const COOL = '#7DD3FC'
const DARK = '#0F1A22'
// Округление координат: иначе сервер и браузер дают разные последние знаки (ошибка гидрации).
const r1 = (v: number) => Math.round(v * 10) / 10
type P = { w: number; color: string; accent: string }

// ===== Тригонометрия: обсерватория, колесо обозрения, море-синусоида, фазы луны, башня с маятником =====
const Observatory = ({ w, color, accent }: P) => {
    const id = useId()
    return (
        <svg width={w} height={w * 1.05} viewBox="0 0 200 210" aria-hidden>
            <defs>
                <linearGradient id={`d${id}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#3E5A70" />
                    <stop offset="1" stopColor={accent} />
                </linearGradient>
            </defs>
            {/* холм */}
            <path d="M0 210 Q40 150 100 146 Q160 150 200 210 Z" fill={color} />
            {/* здание */}
            <path d="M50 160 V110 H150 V160 Z" fill={accent} />
            {/* купол со щелью */}
            <path d="M46 112 A54 54 0 0 1 154 112 Z" fill={`url(#d${id})`} />
            <path d="M94 60 L106 60 L110 112 L90 112 Z" fill={DARK} opacity={0.7} />
            {/* телескоп */}
            <path d="M98 74 L150 30 L158 40 L106 84 Z" fill={color} />
            <circle cx="154" cy="35" r="7" fill={accent} />
            {/* окна */}
            {[70, 100, 130].map((x) => <rect key={x} x={x - 4} y={126} width="8" height="12" rx="4" fill={WARM} opacity={0.35} />)}
            <path d="M92 160 V146 Q100 138 108 146 V160 Z" fill={DARK} opacity={0.6} />
        </svg>
    )
}

const FerrisWheel = ({ w, color, accent }: P) => {
    const R = 70
    const spokes = Array.from({ length: 12 }, (_, i) => (i * Math.PI * 2) / 12)
    return (
        <svg width={w} height={w * 1.2} viewBox="0 0 200 240" aria-hidden>
            {/* опоры */}
            <path d="M100 100 L52 236 H64 L100 120 L136 236 H148 Z" fill={color} />
            {/* обод и спицы */}
            <circle cx="100" cy="100" r={R} fill="none" stroke={accent} strokeWidth="5" />
            <circle cx="100" cy="100" r={R - 10} fill="none" stroke={accent} strokeWidth="1.5" opacity={0.6} />
            {spokes.map((a, i) => (
                <line key={i} x1="100" y1="100" x2={r1(100 + R * Math.cos(a))} y2={r1(100 + R * Math.sin(a))} stroke={accent} strokeWidth="1.5" opacity={0.7} />
            ))}
            <circle cx="100" cy="100" r="8" fill={color} />
            {/* кабинки с огоньками */}
            {spokes.map((a, i) => {
                const x = r1(100 + R * Math.cos(a))
                const y = r1(100 + R * Math.sin(a))
                return (
                    <g key={`c${i}`}>
                        <rect x={x - 7} y={y + 2} width="14" height="11" rx="3" fill={color} />
                        <rect x={x - 4} y={y + 4} width="8" height="5" rx="1.5" fill={WARM} opacity={i % 3 === 0 ? 0.45 : 0.22} />
                    </g>
                )
            })}
        </svg>
    )
}

const SineSea = ({ w, color, accent }: P) => {
    // Море из синусоид: три волны разной фазы + кораблик на гребне.
    const wave = (amp: number, phase: number, y0: number) => {
        let d = `M0 ${y0}`
        for (let x = 0; x <= 360; x += 6) d += ` L${x} ${(y0 + amp * Math.sin((x / 360) * 4 * Math.PI + phase)).toFixed(1)}`
        return d + ` L360 120 L0 120 Z`
    }
    return (
        <svg width={w} height={w / 3} viewBox="0 0 360 120" aria-hidden>
            <path d={wave(10, 0, 50)} fill={accent} opacity={0.45} />
            <path d={wave(12, 1.6, 66)} fill={color} opacity={0.85} />
            <path d={wave(8, 3.2, 86)} fill={accent} opacity={0.6} />
            {/* кораблик на гребне первой волны */}
            <path d="M232 46 H268 L262 56 H238 Z" fill={color} />
            <path d="M250 46 V18 L268 42 Z" fill={accent} />
            <path d="M248 46 V24 L234 42 Z" fill={accent} opacity={0.8} />
        </svg>
    )
}

const MoonPhases = ({ w, accent }: { w: number; accent: string }) => {
    // Пять фаз луны в ряд (полукруги «заливки» — как значения синуса от 0 до 1).
    const phases = [0.15, 0.4, 1, 0.4, 0.15]
    return (
        <svg width={w} height={w * 0.26} viewBox="0 0 230 60" aria-hidden>
            {phases.map((p, i) => {
                const cx = 25 + i * 45
                return (
                    <g key={i}>
                        <circle cx={cx} cy="30" r="16" fill={DARK} opacity={0.5} />
                        <circle cx={cx} cy="30" r="16" fill="none" stroke={accent} strokeWidth="1.2" opacity={0.5} />
                        <ellipse cx={cx + (i < 2 ? 1 : i > 2 ? -1 : 0) * 16 * (1 - p)} cy="30" rx={16 * p} ry="16" fill="#9FB7C8" opacity={0.28} />
                    </g>
                )
            })}
        </svg>
    )
}

const PendulumTower = ({ w, color, accent }: P) => (
    <svg width={w} height={w * 1.7} viewBox="0 0 120 204" aria-hidden>
        <path d="M24 204 V60 H96 V204 Z" fill={color} />
        <path d="M18 64 L60 22 L102 64 Z" fill={accent} />
        <path d="M60 22 V6" stroke={accent} strokeWidth="2" />
        {/* циферблат */}
        <circle cx="60" cy="88" r="20" fill={accent} />
        <circle cx="60" cy="88" r="16" fill={DARK} opacity={0.55} />
        {Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI) / 6
            return <circle key={i} cx={r1(60 + 13 * Math.cos(a))} cy={r1(88 + 13 * Math.sin(a))} r="1.2" fill={WARM} opacity={0.5} />
        })}
        <path d="M60 88 L60 77 M60 88 L68 92" stroke={WARM} strokeWidth="1.6" opacity={0.6} strokeLinecap="round" />
        {/* окно с маятником */}
        <rect x="42" y="118" width="36" height="58" rx="4" fill={DARK} opacity={0.6} />
        <path d="M60 120 L70 160" stroke={accent} strokeWidth="1.5" />
        <circle cx="70" cy="162" r="5" fill={WARM} opacity={0.4} />
        <path d="M50 160 Q60 168 70 160" stroke={accent} strokeWidth="1" fill="none" strokeDasharray="2 3" opacity={0.6} />
    </svg>
)

// ===== Планиметрия: пирамиды, циркуль, акведук-арки, треугольные паруса, обелиск с транспортиром =====
const Pyramids = ({ w, color, accent }: P) => (
    <svg width={w} height={w * 0.5} viewBox="0 0 300 150" aria-hidden>
        {/* дальняя */}
        <path d="M150 150 L210 64 L270 150 Z" fill={color} opacity={0.75} />
        <path d="M210 64 L270 150 L226 150 Z" fill={DARK} opacity={0.3} />
        {/* большая */}
        <path d="M20 150 L110 22 L200 150 Z" fill={accent} />
        <path d="M110 22 L200 150 L132 150 Z" fill={DARK} opacity={0.32} />
        {/* ряды кладки */}
        {[50, 78, 106, 134].map((y) => {
            const half = ((y - 22) / 128) * 90
            return <line key={y} x1={110 - half} y1={y} x2={110 + half} y2={y} stroke={DARK} strokeWidth="1.2" opacity={0.25} />
        })}
        {/* вход */}
        <path d="M104 150 V132 L110 126 L116 132 V150 Z" fill={DARK} opacity={0.6} />
        {/* песок */}
        <path d="M0 150 Q80 138 150 146 Q230 136 300 148 V150 Z" fill={color} />
    </svg>
)

const Compass = ({ w, color, accent }: P) => (
    // Гигантский циркуль, который чертит дугу.
    <svg width={w} height={w * 1.1} viewBox="0 0 200 220" aria-hidden>
        <path d="M30 196 A90 90 0 0 1 170 196" stroke={WARM} strokeWidth="2" fill="none" strokeDasharray="5 6" opacity={0.35} />
        <path d="M96 30 L56 196 L64 196 L102 34 Z" fill={accent} />
        <path d="M104 30 L144 190 L136 190 L98 34 Z" fill={color} />
        <path d="M140 188 L146 206 L134 196 Z" fill={WARM} opacity={0.5} />
        <rect x="88" y="14" width="24" height="22" rx="6" fill={accent} />
        <rect x="96" y="2" width="8" height="14" rx="3" fill={color} />
        <circle cx="100" cy="25" r="4" fill={DARK} opacity={0.5} />
        <path d="M74 120 L126 120" stroke={color} strokeWidth="3" />
    </svg>
)

const Aqueduct = ({ w, color, accent }: P) => (
    <svg width={w} height={w * 0.5} viewBox="0 0 300 150" aria-hidden>
        <path d="M0 40 H300 V60 H0 Z" fill={accent} />
        <path d="M0 60 H300 V150 H0 Z" fill={color} />
        {/* полукруглые арки */}
        {[30, 90, 150, 210, 270].map((x) => (
            <path key={x} d={`M${x - 22} 150 V96 A22 22 0 0 1 ${x + 22} 96 V150 Z`} fill={DARK} opacity={0.55} />
        ))}
        {/* верхний ярус маленьких арок */}
        {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285].map((x) => (
            <path key={`s${x}`} d={`M${x - 8} 40 V32 A8 8 0 0 1 ${x + 8} 32 V40 Z`} fill={color} />
        ))}
        <path d="M0 24 H300 V28 H0 Z" fill={accent} opacity={0.7} />
    </svg>
)

const TriangleSails = ({ w, color, accent }: P) => (
    <svg width={w} height={w * 0.9} viewBox="0 0 180 162" aria-hidden>
        <path d="M18 122 H164 L148 142 H34 Z" fill={color} />
        <path d="M88 122 V12" stroke={color} strokeWidth="4" />
        {/* прямоугольный треугольник — большой парус */}
        <path d="M92 16 L92 116 L156 116 Z" fill={accent} />
        <path d="M92 104 H104 V116" stroke={DARK} strokeWidth="1.5" fill="none" opacity={0.5} />
        {/* равнобедренный — передний */}
        <path d="M84 30 L84 116 L28 116 Z" fill={accent} opacity={0.75} />
        <path d="M88 12 L108 16 L88 22 Z" fill={WARM} opacity={0.45} />
        <path d="M0 142 Q22 134 45 142 T90 142 T135 142 T180 142 V162 H0 Z" fill={accent} opacity={0.5} />
    </svg>
)

const ProtractorTemple = ({ w, color, accent }: P) => (
    // Амфитеатр-транспортир: полукруг с делениями-колоннами.
    <svg width={w} height={w * 0.62} viewBox="0 0 220 136" aria-hidden>
        <path d="M10 130 A100 100 0 0 1 210 130 Z" fill={color} />
        <path d="M40 130 A70 70 0 0 1 180 130 Z" fill={DARK} opacity={0.35} />
        {Array.from({ length: 19 }, (_, i) => {
            const a = Math.PI - (i * Math.PI) / 18
            const long = i % 3 === 0
            const rIn = long ? 76 : 86
            return (
                <line key={i} x1={r1(110 + rIn * Math.cos(a))} y1={r1(130 - rIn * Math.sin(a))} x2={r1(110 + 98 * Math.cos(a))} y2={r1(130 - 98 * Math.sin(a))}
                    stroke={accent} strokeWidth={long ? 3 : 1.5} opacity={long ? 0.9 : 0.6} />
            )
        })}
        <path d="M0 130 H220 V136 H0 Z" fill={accent} />
        {/* луч угла */}
        <path d="M110 130 L160 72" stroke={WARM} strokeWidth="2" opacity={0.45} />
        <circle cx="110" cy="130" r="4" fill={WARM} opacity={0.5} />
    </svg>
)

const Obelisk = ({ w, color, accent }: P) => (
    <svg width={w} height={w * 2.4} viewBox="0 0 80 192" aria-hidden>
        <path d="M30 172 L34 30 L40 16 L46 30 L50 172 Z" fill={accent} />
        <path d="M40 16 L46 30 L50 172 L40 172 Z" fill={DARK} opacity={0.3} />
        <path d="M14 172 H66 V192 H14 Z" fill={color} />
        <circle cx="40" cy="60" r="5" fill="none" stroke={WARM} strokeWidth="1.2" opacity={0.4} />
        <path d="M36 92 L44 92 L40 84 Z" fill="none" stroke={WARM} strokeWidth="1.2" opacity={0.35} />
        <rect x="36" y="118" width="8" height="8" fill="none" stroke={WARM} strokeWidth="1.2" opacity={0.3} />
    </svg>
)

// Средний слой каждого мира: панели по 1000px, объекты по краям (центр — для карты уроков).
export const THEME_MIDDLE_PANELS: Record<Exclude<ParallaxTheme, 'default'>, Item[][]> = {
    trig: [
        [{ y: 100, x: '66%', el: (c) => <Observatory w={190} color={c.color} accent={c.accent} /> },
         { y: 600, x: '-6%', el: (c) => <SineSea w={330} color={c.color} accent={c.accent} /> }],
        [{ y: 120, x: '-4%', el: (c) => <FerrisWheel w={180} color={c.color} accent={c.accent} /> },
         { y: 620, x: '64%', el: (c) => <MoonPhases w={200} accent={c.accent} /> }],
        [{ y: 80, x: '76%', el: (c) => <PendulumTower w={110} color={c.color} accent={c.accent} /> },
         { y: 600, x: '0%', el: (c) => <Observatory w={150} color={c.color} accent={c.accent} /> }],
    ],
    planim: [
        [{ y: 120, x: '62%', el: (c) => <Pyramids w={260} color={c.color} accent={c.accent} /> },
         { y: 620, x: '-4%', el: (c) => <Compass w={170} color={c.color} accent={c.accent} /> }],
        [{ y: 100, x: '-8%', el: (c) => <Aqueduct w={280} color={c.color} accent={c.accent} /> },
         { y: 600, x: '70%', el: (c) => <TriangleSails w={170} color={c.color} accent={c.accent} /> }],
        [{ y: 120, x: '66%', el: (c) => <ProtractorTemple w={210} color={c.color} accent={c.accent} /> },
         { y: 560, x: '2%', el: (c) => <Obelisk w={80} color={c.color} accent={c.accent} /> }],
    ],
}

// Лёгкий отсвет фона в цвет раздела (неподвижный, за всеми слоями).
export const THEME_TINT: Record<ParallaxTheme, string | null> = {
    default: null,
    trig: '83,173,239',
    planim: '240,155,56',
}

// ===== Атмосфера мира: что «висит в воздухе» на дальнем плане =====
// stars — звёздное небо (только на дальнем слое), wind — пустыня: полосы ветра и песчинки летят слева направо.
export const THEME_SKY: Record<ParallaxTheme, 'stars' | 'wind'> = {
    default: 'stars',
    trig: 'stars',
    planim: 'wind',
}

// Пустыня (дальний слой планиметрии вместо луны и снежных гор): низкое тёплое солнце и дюны.
const DesertSun = ({ w }: { w: number }) => {
    const id = useId()
    return (
        <svg width={w} height={w} viewBox="0 0 140 140" aria-hidden>
            <defs>
                <radialGradient id={`s${id}`}>
                    <stop offset="0.4" stopColor={WARM} stopOpacity={0.14} />
                    <stop offset="1" stopColor={WARM} stopOpacity={0} />
                </radialGradient>
            </defs>
            <circle cx="70" cy="70" r="70" fill={`url(#s${id})`} />
            <circle cx="70" cy="70" r="30" fill="#5A4A2E" opacity={0.75} />
        </svg>
    )
}
const Dunes = ({ w, color, accent }: P) => (
    <svg width={w} height={w * 0.36} viewBox="0 0 520 186" aria-hidden>
        <path d="M0 186 V120 Q90 70 190 108 Q280 140 360 92 Q440 52 520 96 V186 Z" fill={color} opacity={0.7} />
        <path d="M0 186 V150 Q120 104 240 140 Q340 166 430 128 Q480 110 520 126 V186 Z" fill={accent} />
        <path d="M240 140 Q300 150 340 146" stroke="#0F1A22" strokeWidth="2" fill="none" opacity={0.25} />
    </svg>
)
export const THEME_FAR_PANELS: Partial<Record<ParallaxTheme, Item[][]>> = {
    planim: [
        [{ y: 90, x: '62%', el: () => <DesertSun w={150} /> },
         { y: 560, x: '-14%', el: (c) => <Dunes w={600} color={c.color} accent={c.accent} /> }],
        [{ y: 600, x: '36%', el: (c) => <Dunes w={600} color={c.color} accent={c.accent} /> }],
    ],
}

// Ветер в пустыне: неподвижный слой поверх дальнего плана. Тонкие полосы и песчинки
// пролетают слева направо (только transform/opacity, CSS-анимация .animate-wind-drift).
const WIND = [
    { top: 14, len: 120, dur: 11, delay: 0, op: 0.2 },
    { top: 27, len: 80, dur: 9, delay: 4, op: 0.16 },
    { top: 41, len: 150, dur: 13, delay: 7, op: 0.18 },
    { top: 58, len: 100, dur: 10, delay: 2, op: 0.16 },
    { top: 72, len: 130, dur: 12, delay: 9, op: 0.19 },
    { top: 86, len: 90, dur: 9.5, delay: 5.5, op: 0.15 },
]
const SAND = [
    { top: 20, dur: 8, delay: 1 }, { top: 36, dur: 10, delay: 6 }, { top: 49, dur: 7.5, delay: 3 },
    { top: 64, dur: 9, delay: 8 }, { top: 79, dur: 8.5, delay: 0.5 }, { top: 92, dur: 11, delay: 4.5 },
]
export const WindDrift = () => (
    <div className="absolute inset-0">
        {WIND.map((g, i) => (
            <svg key={i} width={g.len} height="14" viewBox={`0 0 ${g.len} 14`} className="absolute left-0 animate-wind-drift"
                style={{ top: `${g.top}%`, animationDuration: `${g.dur}s`, animationDelay: `${g.delay}s`, ['--wind-op' as string]: g.op }}>
                <path d={`M0 9 Q${g.len * 0.35} 2 ${g.len * 0.6} 7 T${g.len} 5`} stroke="#E8D3A8" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            </svg>
        ))}
        {SAND.map((g, i) => (
            <span key={`s${i}`} className="absolute left-0 h-[3px] w-[3px] rounded-full bg-[#E8D3A8] animate-wind-drift"
                style={{ top: `${g.top}%`, animationDuration: `${g.dur}s`, animationDelay: `${g.delay}s`, ['--wind-op' as string]: 0.35 }} />
        ))}
    </div>
)
