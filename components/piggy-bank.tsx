'use client'

// components/piggy-bank.tsx — свинка-копилка «Мой путь» (2026-10-13).
// Внутри свинки золото поднимается снизу по доле fill (0..1) — сколько первичных уже в копилке.
// dropKey: при каждой смене значения сверху в прорезь падает золотая монетка (CSS .animate-coin-drop).

import { useId } from 'react'

type Props = {
    fill: number          // 0..1
    size?: number         // ширина в px
    dropKey?: number | string | null
}

const PINK = '#F6A9C4'
const PINK_DARK = '#C96F92'
const PINK_DEEP = '#A9506F'

export const PiggyBank = ({ fill, size = 84, dropKey = null }: Props) => {
    const uid = useId().replace(/:/g, '')
    const f = Math.max(0, Math.min(1, fill))
    // тело свинки: эллипс cx 58 cy 60 rx 40 ry 30 → по высоте 30..90
    const top = 90 - 60 * f
    return (
        <svg width={size} height={size * 0.92} viewBox="0 0 120 110" className="overflow-visible">
            <defs>
                <clipPath id={`body-${uid}`}>
                    <ellipse cx="58" cy="60" rx="40" ry="30" />
                </clipPath>
                <linearGradient id={`gold-${uid}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#FFE9A8" />
                    <stop offset="0.45" stopColor="#F2C35B" />
                    <stop offset="1" stopColor="#C98E1E" />
                </linearGradient>
            </defs>

            {/* ножки и хвостик */}
            <rect x="30" y="80" width="11" height="16" rx="4" fill={PINK_DARK} />
            <rect x="72" y="80" width="11" height="16" rx="4" fill={PINK_DARK} />
            <path d="M18,56 q-10,-4 -7,-12 q3,-6 8,-1" fill="none" stroke={PINK_DARK} strokeWidth="3" strokeLinecap="round" />

            {/* ухо */}
            <path d="M70,34 L80,14 L90,36 Z" fill={PINK_DARK} />

            {/* тело */}
            <ellipse cx="58" cy="60" rx="40" ry="30" fill={PINK} />
            {/* золото внутри */}
            <g clipPath={`url(#body-${uid})`}>
                <rect x="10" y={top} width="100" height={90 - top + 2} fill={`url(#gold-${uid})`}
                    style={{ transition: 'y 0.8s cubic-bezier(.3,1.4,.5,1), height 0.8s cubic-bezier(.3,1.4,.5,1)' }} />
                {f > 0.02 && (
                    <path d={`M10,${top} q12,-4 24,0 t24,0 t24,0 t24,0`} fill="none" stroke="#FFF4C9" strokeWidth="2" opacity="0.8" />
                )}
            </g>
            <ellipse cx="58" cy="60" rx="40" ry="30" fill="none" stroke={PINK_DEEP} strokeWidth="3" />
            {/* блик */}
            <path d="M32,44 q8,-10 22,-11" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.55" />

            {/* пятачок и глаз */}
            <ellipse cx="99" cy="62" rx="10" ry="9" fill={PINK} stroke={PINK_DEEP} strokeWidth="3" />
            <circle cx="96" cy="62" r="1.8" fill={PINK_DEEP} />
            <circle cx="102" cy="62" r="1.8" fill={PINK_DEEP} />
            <circle cx="84" cy="50" r="3" fill="#2B1A22" />

            {/* прорезь */}
            <rect x="46" y="27" width="22" height="5" rx="2.5" fill="#5A2A3E" />

            {/* падающая монетка */}
            {dropKey !== null && (
                <g key={String(dropKey)} className="animate-coin-drop">
                    <ellipse cx="57" cy="-10" rx="9" ry="9" fill={`url(#gold-${uid})`} stroke="#A8740F" strokeWidth="2" />
                    <text x="57" y="-6" textAnchor="middle" fontSize="11" fontWeight="900" fill="#7A5408">1</text>
                </g>
            )}
        </svg>
    )
}
