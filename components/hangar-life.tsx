'use client'

// components/hangar-life.tsx
//
// «Жизнь» в ангаре (components/hangar-scene.tsx), чтобы картинка не была статичной:
// • HangarSky — в круглом окне за ракетой: плывут облака, пролетают птицы и кукурузник с транспарантом
//   (лозунги Команданте, меняются на каждом пролёте). Слой обрезан по кругу окна и лежит под предметами.
// • HangarSpider — паучок бегает по деревянной балке под потолком; HangarBug — жучок перебегает пол. Пока в ангаре бардак.
// • ComputerFlicker — сломанный компьютер (№7) иногда мигает экраном и гаснет.
// Координаты — в пикселях картинки 1024×1024; размеры в cqw (контейнер сцены — containerType: inline-size).
// Всё на transform/opacity (CSS), при «уменьшить движение» стоит (globals.css).

import { useState } from 'react'

const cq = (v: number) => `${v / 10.24}cqw`
const pct = (v: number) => `${(v / 1024) * 100}%`

// Окно: круг с центром (515, 458) и радиусом 238 — небо выше линии горизонта (y ≈ 460).
const WIN = { cx: 515, cy: 458, r: 238, top: 220, bottom: 460 }

export const BANNER_PHRASES = [
    '¡VAMOS, AMIGO!',
    'ЛОГАРИФМЫ — ИМБА',
    'ЕГЭ НА СОТКУ',
    'НЕ БОИМСЯ ЕГЭ',
    'В ВУЗ — VAMOS!',
    'ПАРАМЕТР? ИЗИ',
    'VIVA LA МАТЕША',
    'СТЕРЕОМЕТРИЯ? ИЗИ',
    'ФАРМИМ БАЛЛЫ',
    'МАНЬЯНА — ВРАГ',
]

function Cloud({ w, y, dur, delay, opacity }: { w: number; y: number; dur: number; delay: number; opacity: number }) {
    return (
        <div className="hangar-cloud absolute left-0" style={{ top: cq(y), width: cq(w), opacity, animationDuration: `${dur}s`, animationDelay: `${delay}s` }}>
            <svg viewBox="0 0 120 50" className="block w-full">
                <path d="M14 42 C2 42 2 28 14 28 C14 16 30 12 38 20 C42 6 64 4 70 18 C78 10 96 14 94 28 C108 26 114 42 100 42 Z" fill="#D6EEE9" />
                <path d="M14 42 C8 42 6 36 10 33 C24 36 80 38 104 34 C110 38 106 42 100 42 Z" fill="#A9CFCB" />
            </svg>
        </div>
    )
}

function Birds() {
    // две птички «галочкой», крылья машут
    return (
        <div className="hangar-birds absolute left-0" style={{ top: cq(90), width: cq(40) }}>
            <svg viewBox="0 0 40 20" className="block w-full" fill="none" stroke="#24313A" strokeWidth={2.2} strokeLinecap="round">
                <g className="hangar-flap" style={{ transformOrigin: '10px 10px' }}><path d="M3 9 Q7 4 10 9 Q13 4 17 9" /></g>
                <g className="hangar-flap" style={{ transformOrigin: '28px 14px', animationDelay: '-0.2s' }}><path d="M22 13 Q25 9 28 13 Q31 9 34 13" /></g>
            </svg>
        </div>
    )
}

function PlaneWithBanner() {
    const [i, setI] = useState(0)
    const text = BANNER_PHRASES[i % BANNER_PHRASES.length]
    // 400 px картинки в ширину: транспарант 0–206, трос, кукурузник 222–280 (viewBox 280×48)
    return (
        <div className="hangar-plane absolute left-0" style={{ top: cq(78), width: cq(400) }}
            onAnimationIteration={(e) => { if (e.animationName === 'hangar-plane-fly') setI((v) => v + 1) }}>
            <svg viewBox="0 0 280 48" className="block w-full overflow-visible">
                {/* транспарант на тросе — колышется */}
                <line x1="222" y1="23" x2="206" y2="23" stroke="#3A3226" strokeWidth={1.2} />
                <g className="hangar-banner-wave" style={{ transformOrigin: '206px 23px' }}>
                    <path d="M0 9 Q52 5 103 9 T206 9 L206 37 Q155 41 103 37 T0 37 Z" fill="#F4EEDC" stroke="#C9B98E" strokeWidth={1.5} />
                    <text x="103" y="29" textAnchor="middle" fontSize="17" fontWeight={900} fill="#C0392B" style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>{text}</text>
                </g>
                {/* кукурузник (биплан), летит вправо */}
                <g transform="translate(222 9)">
                    <rect x="10" y="2" width="30" height="4" rx="2" fill="#D9A93D" stroke="#3A3226" strokeWidth={1.2} />
                    <rect x="10" y="20" width="30" height="4" rx="2" fill="#D9A93D" stroke="#3A3226" strokeWidth={1.2} />
                    <line x1="18" y1="6" x2="18" y2="20" stroke="#3A3226" strokeWidth={1.2} />
                    <line x1="34" y1="6" x2="34" y2="20" stroke="#3A3226" strokeWidth={1.2} />
                    <path d="M0 13 L6 8 L46 10 Q54 13 46 17 L6 18 Z" fill="#E8C55A" stroke="#3A3226" strokeWidth={1.2} />
                    <path d="M0 13 L-3 6 L5 9 Z" fill="#E8C55A" stroke="#3A3226" strokeWidth={1.2} />
                    <circle cx="30" cy="12" r="2.2" fill="#6FB7D9" />
                    <g className="hangar-prop" style={{ transformOrigin: '54px 13px' }}>
                        <line x1="54" y1="5" x2="54" y2="21" stroke="#3A3226" strokeWidth={2} strokeLinecap="round" />
                    </g>
                </g>
            </svg>
        </div>
    )
}

/** Небо в круглом окне: облака, птицы, кукурузник с транспарантом. */
export function HangarSky() {
    const w = WIN.r * 2
    const h = WIN.bottom - WIN.top
    return (
        <div className="pointer-events-none absolute overflow-hidden" aria-hidden
            style={{ left: pct(WIN.cx - WIN.r), top: pct(WIN.top), width: pct(w), height: pct(h),
                clipPath: `ellipse(50% ${(WIN.r / h) * 100}% at 50% ${((WIN.cy - WIN.top) / h) * 100}%)` }}>
            <Cloud w={110} y={40} dur={95} delay={-20} opacity={0.75} />
            <Cloud w={80} y={120} dur={70} delay={-55} opacity={0.6} />
            <Cloud w={140} y={170} dur={120} delay={-90} opacity={0.5} />
            <Birds />
            <PlaneWithBanner />
        </div>
    )
}

/** Паучок бегает по балке под потолком. */
export function HangarSpider() {
    return (
        <div className="hangar-spider pointer-events-none absolute" aria-hidden style={{ left: pct(230), top: pct(46), width: cq(50), zIndex: 1000 }}>
            <svg viewBox="0 0 24 16" className="block w-full">
                <g stroke="#15181F" strokeWidth={1.4} strokeLinecap="round" className="hangar-legs" style={{ transformOrigin: '12px 9px' }}>
                    <path d="M9 9 L3 5 M9 10 L2 10 M9 11 L3 15 M15 9 L21 5 M15 10 L22 10 M15 11 L21 15" />
                </g>
                <ellipse cx="12" cy="10" rx="4.5" ry="3.6" fill="#1D2028" stroke="#8A7A66" strokeWidth={0.6} />
                <circle cx="12" cy="6.5" r="2.6" fill="#1D2028" stroke="#8A7A66" strokeWidth={0.6} />
                <circle cx="11" cy="6" r="0.7" fill="#E9F0F3" /><circle cx="13" cy="6" r="0.7" fill="#E9F0F3" />
            </svg>
        </div>
    )
}

/** Жучок перебегает пол слева. */
export function HangarBug() {
    return (
        <div className="hangar-bug pointer-events-none absolute" aria-hidden style={{ left: pct(60), top: pct(915), width: cq(44), zIndex: 200 }}>
            <svg viewBox="0 0 22 14" className="block w-full">
                <g stroke="#1C1712" strokeWidth={1.3} strokeLinecap="round" className="hangar-legs" style={{ transformOrigin: '11px 7px' }}>
                    <path d="M8 4 L5 1 M11 3 L11 0 M14 4 L17 1 M8 10 L5 13 M11 11 L11 14 M14 10 L17 13" />
                </g>
                <ellipse cx="11" cy="7" rx="6.5" ry="4.5" fill="#5B3A22" />
                <line x1="11" y1="2.6" x2="11" y2="11.4" stroke="#2B1A0E" strokeWidth={1} />
                <circle cx="18" cy="7" r="2.4" fill="#2B1A0E" />
            </svg>
        </div>
    )
}

/** Сломанный компьютер: экран иногда вспыхивает и гаснет. style — та же коробка, что у картинки предмета. */
export function ComputerFlicker({ style }: { style: React.CSSProperties }) {
    return (
        <div className="pointer-events-none absolute" aria-hidden style={{ ...style, zIndex: (Number(style.zIndex) || 0) + 1 }}>
            <div className="hangar-crt absolute rounded-[12%]"
                style={{ left: '31%', top: '5%', width: '44%', height: '38%', rotate: '-4deg', mixBlendMode: 'screen',
                    background: 'radial-gradient(closest-side, rgba(140,255,200,0.85), rgba(70,220,160,0.45) 60%, rgba(40,180,130,0) 100%)' }} />
        </div>
    )
}
