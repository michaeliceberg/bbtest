'use client'

// components/parallax-world-rich.tsx — второй, «богатый» набор рисунков для параллакс-фона (прототип /test-parallax).
// Те же правила производительности: всё статично (градиенты не анимируются), двигается только слой целиком.
// Цвета приглушённые, чтобы не спорить с картой уроков; тёплые огоньки — низкая прозрачность.

import { useId } from 'react'
import type { LayerSpec, Item } from '@/components/parallax-world'

export const RICH_LAYERS: LayerSpec[] = [
    { speed: 0.1, color: '#1A2732', accent: '#24384A', stars: 0 },
    { speed: 0.3, color: '#1F3141', accent: '#2C4459', stars: 1 },
    { speed: 0.55, color: '#263B4C', accent: '#35506A', stars: 2 },
]

const WARM = '#F2C35B'
const COOL = '#7DD3FC'

// ===== Дальний план =====
const StarField = ({ w }: { w: number }) => {
    const stars = [[12, 20, 2], [40, 64, 1.4], [78, 12, 1.8], [110, 48, 1.2], [150, 22, 2.2], [190, 70, 1.4], [228, 30, 1.6],
        [262, 80, 1.2], [300, 16, 2], [24, 110, 1.2], [96, 128, 1.8], [176, 118, 1.2], [244, 136, 1.6], [290, 112, 1.2]]
    return (
        <svg width={w} height={w * 0.5} viewBox="0 0 320 160" aria-hidden>
            {stars.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#CFE6F5" opacity={0.18 + (i % 3) * 0.08} />)}
            <path d="M150 22 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 Z" fill="#E8F4FC" opacity={0.35} />
        </svg>
    )
}

const BigMoon = ({ w, accent }: { w: number; accent: string }) => {
    const id = useId()
    return (
        <svg width={w} height={w} viewBox="0 0 140 140" aria-hidden>
            <defs>
                <radialGradient id={`h${id}`}>
                    <stop offset="0.45" stopColor={COOL} stopOpacity={0.12} />
                    <stop offset="1" stopColor={COOL} stopOpacity={0} />
                </radialGradient>
                <radialGradient id={`m${id}`} cx="0.38" cy="0.35">
                    <stop offset="0" stopColor="#3E5A70" />
                    <stop offset="1" stopColor={accent} />
                </radialGradient>
            </defs>
            <circle cx="70" cy="70" r="70" fill={`url(#h${id})`} />
            <circle cx="70" cy="70" r="38" fill={`url(#m${id})`} />
            <circle cx="58" cy="60" r="7" fill="#1E2E3B" opacity={0.45} />
            <circle cx="82" cy="78" r="5" fill="#1E2E3B" opacity={0.4} />
            <circle cx="72" cy="52" r="3.5" fill="#1E2E3B" opacity={0.4} />
            <circle cx="62" cy="86" r="3" fill="#1E2E3B" opacity={0.35} />
        </svg>
    )
}

const SnowPeaks = ({ w, color, accent }: { w: number; color: string; accent: string }) => {
    const id = useId()
    return (
        <svg width={w} height={w * 0.46} viewBox="0 0 520 240" aria-hidden>
            <defs>
                <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={accent} />
                    <stop offset="1" stopColor={color} />
                </linearGradient>
            </defs>
            {/* задний хребет */}
            <path d="M0 240 L40 150 L90 180 L150 90 L210 160 L260 110 L330 170 L390 80 L460 150 L520 120 V240 Z" fill={color} opacity={0.7} />
            {/* передний хребет */}
            <path d="M0 240 L60 130 L110 170 L190 40 L250 140 L300 100 L370 180 L430 70 L500 160 L520 150 V240 Z" fill={`url(#g${id})`} />
            {/* снежные шапки */}
            <path d="M190 40 L212 76 L200 70 L190 82 L178 70 L168 76 Z" fill="#BCD4E4" opacity={0.35} />
            <path d="M430 70 L450 100 L440 96 L430 106 L420 96 L412 100 Z" fill="#BCD4E4" opacity={0.3} />
            {/* тень склонов */}
            <path d="M190 40 L250 140 L210 150 Z M430 70 L500 160 L460 165 Z" fill="#0F1A22" opacity={0.25} />
        </svg>
    )
}

const FloatingIsland = ({ w, color, accent }: { w: number; color: string; accent: string }) => (
    <svg width={w} height={w * 0.8} viewBox="0 0 200 160" aria-hidden>
        <path d="M20 70 Q100 52 180 70 L150 100 L120 150 L100 120 L80 140 L60 100 Z" fill={color} />
        <path d="M20 70 Q100 52 180 70 Q100 82 20 70 Z" fill={accent} />
        {/* домик и деревце */}
        <path d="M80 66 V46 L94 34 L108 46 V66 Z" fill={accent} />
        <rect x="90" y="52" width="7" height="8" fill={WARM} opacity={0.4} />
        <path d="M128 66 V54 L118 54 L132 30 L146 54 L136 54 V66 Z" fill={accent} />
        {/* водопадик с края */}
        <path d="M168 72 L172 72 L170 126 L166 126 Z" fill={COOL} opacity={0.18} />
    </svg>
)

// ===== Средний план =====
const CliffCastle = ({ w, color, accent }: { w: number; color: string; accent: string }) => (
    <svg width={w} height={w * 1.15} viewBox="0 0 220 254" aria-hidden>
        {/* скала */}
        <path d="M10 254 L24 170 L46 150 L60 160 L80 140 L150 140 L176 150 L196 176 L210 254 Z" fill={color} />
        <path d="M80 140 L104 254 H70 Z M150 140 L176 254 H150 Z" fill="#0F1A22" opacity={0.25} />
        {/* стены */}
        <path d="M52 150 V96 H60 V88 H70 V96 H80 V88 H90 V96 H100 V150 Z" fill={accent} />
        <path d="M120 150 V96 H130 V88 H140 V96 H150 V88 H160 V96 H168 V150 Z" fill={accent} />
        {/* главная башня */}
        <path d="M92 150 V60 H128 V150 Z" fill={accent} />
        <path d="M86 62 L110 20 L134 62 Z" fill={color} />
        <path d="M110 20 V4" stroke={accent} strokeWidth="2" />
        <path d="M110 4 L128 9 L110 14 Z" fill="#DC605B" opacity={0.6} />
        {/* боковые башенки с конусами */}
        <path d="M44 100 V64 H64 V100 Z M156 100 V64 H176 V100 Z" fill={accent} />
        <path d="M40 66 L54 40 L68 66 Z M152 66 L166 40 L180 66 Z" fill={color} />
        {/* окна */}
        {[[104, 76], [110, 100], [104, 124], [116, 124], [52, 78], [164, 78], [64, 112], [146, 112]].map(([x, y], i) => (
            <rect key={i} x={x - 3} y={y} width="6" height="9" rx="3" fill={WARM} opacity={0.32 + (i % 2) * 0.12} />
        ))}
        {/* ворота */}
        <path d="M100 150 V134 Q110 124 120 134 V150 Z" fill="#0F1A22" opacity={0.6} />
    </svg>
)

const PirateShip = ({ w, color, accent, flip }: { w: number; color: string; accent: string; flip?: boolean }) => (
    <svg width={w} height={w * 0.95} viewBox="0 0 200 190" aria-hidden style={flip ? { transform: 'scaleX(-1)' } : undefined}>
        {/* корпус */}
        <path d="M14 128 H186 L172 150 Q100 170 28 150 Z" fill={color} />
        <path d="M150 112 H186 V128 H150 Z" fill={color} />
        <path d="M24 140 H176" stroke={accent} strokeWidth="2" />
        {[50, 76, 102, 128].map((x) => <circle key={x} cx={x} cy={134} r={3} fill="#0F1A22" opacity={0.6} />)}
        {/* мачты */}
        <path d="M70 128 V30 M120 128 V18" stroke={color} strokeWidth="4" />
        {/* паруса */}
        <path d="M46 40 Q70 52 94 40 L90 76 Q70 86 50 76 Z" fill={accent} />
        <path d="M50 82 Q70 92 90 82 L88 116 Q70 124 52 116 Z" fill={accent} />
        <path d="M94 28 Q120 40 146 28 L142 66 Q120 76 98 66 Z" fill={accent} />
        <path d="M98 72 Q120 82 142 72 L140 110 Q120 118 100 110 Z" fill={accent} />
        {/* флаг с черепом */}
        <path d="M120 18 L146 22 L144 34 L120 32 Z" fill="#0F1A22" />
        <circle cx="132" cy="25" r="3" fill="#CFE6F5" opacity={0.5} />
        {/* фонарь на корме */}
        <circle cx="180" cy="108" r="3.5" fill={WARM} opacity={0.55} />
        <circle cx="180" cy="108" r="9" fill={WARM} opacity={0.1} />
        {/* волны */}
        <path d="M0 160 Q20 150 40 160 T80 160 T120 160 T160 160 T200 160 V190 H0 Z" fill={accent} opacity={0.55} />
    </svg>
)

const Lighthouse = ({ w, color, accent }: { w: number; color: string; accent: string }) => {
    const id = useId()
    return (
        <svg width={w} height={w * 1.3} viewBox="0 0 200 260" aria-hidden>
            <defs>
                <linearGradient id={`b${id}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor={WARM} stopOpacity={0.22} />
                    <stop offset="1" stopColor={WARM} stopOpacity={0} />
                </linearGradient>
            </defs>
            <path d="M120 62 L200 30 L200 100 Z" fill={`url(#b${id})`} />
            <path d="M40 260 L60 220 L150 220 L170 260 Z" fill={color} />
            <path d="M84 220 L92 80 H116 L124 220 Z" fill={accent} />
            <path d="M88 170 H120 L121 190 H87 Z M90 120 H118 L119 138 H89 Z" fill="#DC605B" opacity={0.35} />
            <rect x="88" y="54" width="32" height="26" rx="3" fill={color} />
            <rect x="94" y="58" width="20" height="18" rx="2" fill={WARM} opacity={0.5} />
            <path d="M84 56 L104 36 L124 56 Z" fill={accent} />
        </svg>
    )
}

const Dragon = ({ w, color }: { w: number; color: string }) => (
    <svg width={w} height={w * 0.6} viewBox="0 0 200 120" aria-hidden>
        {/* крыло дальнее */}
        <path d="M96 52 L120 6 L132 28 L150 14 L150 40 L170 34 L140 60 Z" fill={color} opacity={0.75} />
        {/* тело и хвост */}
        <path d="M30 66 Q60 50 100 56 Q140 60 168 74 Q190 82 196 74 Q190 92 168 88 Q130 86 100 76 Q60 74 40 80 Z" fill={color} />
        {/* голова */}
        <path d="M30 66 L6 58 L12 66 L4 72 L30 76 Z" fill={color} />
        <path d="M18 60 L22 50 L26 62 Z" fill={color} />
        <circle cx="16" cy="66" r="1.6" fill={WARM} opacity={0.7} />
        {/* крыло ближнее */}
        <path d="M70 60 L80 4 L94 30 L112 12 L110 40 L132 36 L100 66 Z" fill={color} />
    </svg>
)

const Waterfall = ({ w, color, accent }: { w: number; color: string; accent: string }) => {
    const id = useId()
    return (
        <svg width={w} height={w * 1.2} viewBox="0 0 160 192" aria-hidden>
            <defs>
                <linearGradient id={`w${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={COOL} stopOpacity={0.3} />
                    <stop offset="1" stopColor={COOL} stopOpacity={0.05} />
                </linearGradient>
            </defs>
            <path d="M0 0 H70 L74 30 L60 192 H0 Z" fill={color} />
            <path d="M120 0 H160 V192 H110 L100 120 Z" fill={color} />
            <path d="M70 6 H118 L104 192 H64 Z" fill={`url(#w${id})`} />
            {[78, 90, 102].map((x, i) => <path key={x} d={`M${x} 10 L${x - 4 + i} 180`} stroke={COOL} strokeWidth="1.5" opacity={0.18} />)}
            <ellipse cx="86" cy="186" rx="40" ry="8" fill={accent} opacity={0.6} />
            <path d="M8 40 Q20 30 30 44 M130 70 Q144 60 152 74" stroke={accent} strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
    )
}

// ===== Ближний план =====
const Mushrooms = ({ w, color, accent }: { w: number; color: string; accent: string }) => (
    <svg width={w} height={w * 0.8} viewBox="0 0 120 96" aria-hidden>
        <path d="M30 96 V56 H40 V96 Z M78 96 V66 H86 V96 Z" fill={color} />
        <path d="M8 60 Q35 18 62 60 Z" fill={accent} />
        <path d="M60 70 Q82 40 104 70 Z" fill={accent} />
        {[[24, 46], [40, 40], [50, 52], [76, 58], [90, 60]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={3} fill={COOL} opacity={0.35} />
        ))}
        <ellipse cx="35" cy="58" rx="30" ry="10" fill={COOL} opacity={0.06} />
    </svg>
)

const Lantern = ({ w, color }: { w: number; color: string }) => (
    <svg width={w} height={w * 2.2} viewBox="0 0 50 110" aria-hidden>
        <path d="M25 0 V30" stroke={color} strokeWidth="2" />
        <circle cx="25" cy="58" r="24" fill={WARM} opacity={0.08} />
        <path d="M14 36 H36 L32 44 H18 Z" fill={color} />
        <rect x="16" y="44" width="18" height="26" rx="3" fill={WARM} opacity={0.4} />
        <path d="M16 44 H34 M16 70 H34 M25 44 V70" stroke={color} strokeWidth="2" />
        <path d="M14 70 H36 L32 78 H18 Z" fill={color} />
    </svg>
)

const Owl = ({ w, color, accent }: { w: number; color: string; accent: string }) => (
    <svg width={w} height={w * 0.9} viewBox="0 0 140 126" aria-hidden>
        {/* ветка */}
        <path d="M0 96 Q60 86 140 100 L140 108 Q60 96 0 104 Z" fill={color} />
        <path d="M100 98 L120 78 M112 86 L132 84" stroke={color} strokeWidth="4" strokeLinecap="round" />
        {/* сова */}
        <path d="M38 96 Q30 60 46 44 L42 30 L54 40 Q62 36 70 40 L82 30 L78 44 Q94 60 86 96 Z" fill={accent} />
        <circle cx="54" cy="54" r="8" fill={color} />
        <circle cx="70" cy="54" r="8" fill={color} />
        <circle cx="54" cy="54" r="3.5" fill={WARM} opacity={0.75} />
        <circle cx="70" cy="54" r="3.5" fill={WARM} opacity={0.75} />
        <path d="M62 62 L58 68 L66 68 Z" fill={color} />
        <path d="M48 76 Q62 84 76 76" stroke={color} strokeWidth="2" fill="none" opacity={0.6} />
    </svg>
)

const BigCrystals = ({ w, color, accent }: { w: number; color: string; accent: string }) => (
    <svg width={w} height={w * 0.85} viewBox="0 0 140 120" aria-hidden>
        <ellipse cx="70" cy="110" rx="60" ry="14" fill={COOL} opacity={0.05} />
        <path d="M20 120 L14 70 L28 44 L40 70 L36 120 Z" fill={accent} />
        <path d="M28 44 L40 70 L28 72 Z" fill={COOL} opacity={0.12} />
        <path d="M44 120 L48 46 L64 10 L78 46 L74 120 Z" fill={accent} />
        <path d="M64 10 L78 46 L62 50 Z" fill={COOL} opacity={0.18} />
        <path d="M80 120 L86 70 L100 52 L112 72 L104 120 Z" fill={color} />
        <path d="M100 52 L112 72 L98 74 Z" fill={COOL} opacity={0.12} />
        <path d="M108 120 L114 94 L124 86 L132 98 L126 120 Z" fill={accent} />
    </svg>
)

const BatFlock = ({ w, color }: { w: number; color: string }) => (
    <svg width={w} height={w * 0.6} viewBox="0 0 140 84" aria-hidden>
        {[[10, 50, 1], [50, 20, 0.8], [90, 44, 0.65], [110, 12, 0.5]].map(([x, y, s], i) => (
            <path key={i} transform={`translate(${x} ${y}) scale(${s})`}
                d="M30 12 L26 6 L27 14 Q18 4 2 8 Q11 13 10 20 Q18 16 24 22 L30 18 L36 22 Q42 16 50 20 Q49 13 58 8 Q42 4 33 14 L34 6 Z" fill={color} />
        ))}
    </svg>
)

export const RICH_PANELS: Item[][][] = [
    // дальний: звёзды, луна, снежные горы, летающий остров
    [
        [{ y: 20, x: '-6%', el: () => <StarField w={320} /> },
         { y: 60, x: '64%', el: (c) => <BigMoon w={150} accent={c.accent} /> },
         { y: 520, x: '-14%', el: (c) => <SnowPeaks w={600} color={c.color} accent={c.accent} /> }],
        [{ y: 80, x: '60%', el: () => <StarField w={300} /> },
         { y: 260, x: '-6%', el: (c) => <FloatingIsland w={190} color={c.color} accent={c.accent} /> },
         { y: 560, x: '40%', el: (c) => <SnowPeaks w={600} color={c.color} accent={c.accent} /> }],
    ],
    // средний: замок на скале, пиратский корабль, маяк, дракон, водопад
    [
        [{ y: 120, x: '68%', el: (c) => <CliffCastle w={190} color={c.color} accent={c.accent} /> },
         { y: 600, x: '-4%', el: (c) => <PirateShip w={180} color={c.color} accent={c.accent} /> }],
        [{ y: 140, x: '-2%', el: (c) => <Lighthouse w={160} color={c.color} accent={c.accent} /> },
         { y: 560, x: '62%', el: (c) => <Dragon w={200} color={c.accent} /> }],
        [{ y: 100, x: '74%', el: (c) => <Waterfall w={150} color={c.color} accent={c.accent} /> },
         { y: 620, x: '0%', el: (c) => <PirateShip w={150} color={c.color} accent={c.accent} flip /> }],
    ],
    // ближний: сова, фонари, грибы, кристаллы, стая мышей
    [
        [{ y: 0, x: '84%', el: (c) => <Lantern w={44} color={c.color} /> },
         { y: 640, x: '-6%', el: (c) => <Owl w={150} color={c.color} accent={c.accent} /> }],
        [{ y: 220, x: '80%', el: (c) => <BatFlock w={110} color={c.accent} /> },
         { y: 720, x: '0%', el: (c) => <Mushrooms w={110} color={c.color} accent={c.accent} /> }],
        [{ y: 280, x: '-2%', el: (c) => <BigCrystals w={120} color={c.color} accent={c.accent} /> },
         { y: 700, x: '82%', el: (c) => <Mushrooms w={90} color={c.color} accent={c.accent} /> }],
    ],
]
