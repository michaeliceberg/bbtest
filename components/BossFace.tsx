// components/BossFace.tsx
//
// Оригинальная (не сторонняя) SVG-мордочка босса тренажёра — заменяет
// прежний emoji-плейсхолдер 👹 в TrainerBossBar. Один базовый рисунок +
// несколько слоёв повреждений, чья непрозрачность плавно нарастает по
// мере падения hp (0=мёртв, 100=полное здоровье) — не отдельные "кадры"
// на каждый порог, а непрерывный кроссфейд, синхронный с самой HP-полосой.
// Палитра — целиком из уже используемых в проекте акцентов (красный
// сердечек #DC605B, голубой подсветки #7dd3fc и т.п.), чтобы не заводить
// новый визуальный язык только под одного персонажа.

'use client'

import { motion } from 'framer-motion'

type Props = {
    hp: number // 0-100, оставшееся здоровье босса
    size?: number
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
const T = { duration: 0.4, ease: 'easeOut' as const }

const HEAD_FILL = '#7A2E3D'
const HEAD_STROKE = '#3A1420'
const HORN_FILL = '#4A1B28'
const BROW = '#2A0F18'
const EYE_WHITE = '#F2F7FB'
const EYE_IRIS = '#DC605B'
const EYE_PUPIL = '#1A0A10'
const MOUTH_FILL = '#2A0F18'
const TEETH = '#F2F7FB'
const BRUISE = '#5B3A8B'
const SCRATCH = '#C23B4A'
const BLOOD = '#9A1F2E'
const BANDAGE = '#E8DCC8'
const STITCH = '#8A7A5C'
const SWEAT = '#7dd3fc'

export const BossFace = ({ hp, size = 56 }: Props) => {
    const bruise = clamp01((72 - hp) / 28)
    const scratch = clamp01((55 - hp) / 22)
    const crack = clamp01((40 - hp) / 18)
    const blood = clamp01((26 - hp) / 18)
    const dizzy = clamp01((14 - hp) / 14)
    const normalEyes = 1 - dizzy

    return (
        <svg viewBox="0 0 64 64" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            {/* уши */}
            <polygon points="10,26 4,32 11,36" fill={HEAD_FILL} stroke={HEAD_STROKE} strokeWidth={1.2} />
            <polygon points="54,26 60,32 53,36" fill={HEAD_FILL} stroke={HEAD_STROKE} strokeWidth={1.2} />

            {/* рога (правый ниже подменяется трещиной/сколом) */}
            <polygon points="16,14 6,2 22,16" fill={HORN_FILL} stroke={HEAD_STROKE} strokeWidth={1} />
            <polygon points="48,14 58,2 42,16" fill={HORN_FILL} stroke={HEAD_STROKE} strokeWidth={1} />

            {/* голова */}
            <path
                d="M12 30 C10 18 20 10 32 10 C44 10 54 18 52 30 C54 42 46 56 32 56 C18 56 10 42 12 30 Z"
                fill={HEAD_FILL}
                stroke={HEAD_STROKE}
                strokeWidth={1.4}
            />

            {/* синяки — проступают первыми */}
            <motion.g animate={{ opacity: bruise }} transition={T}>
                <ellipse cx={17.5} cy={41} rx={5} ry={3.4} fill={BRUISE} fillOpacity={0.6} />
                <ellipse cx={46.5} cy={41} rx={5} ry={3.4} fill={BRUISE} fillOpacity={0.6} />
            </motion.g>

            {/* царапины — следом */}
            <motion.g
                animate={{ opacity: scratch }}
                transition={T}
                stroke={SCRATCH}
                strokeWidth={1.3}
                strokeLinecap="round"
            >
                <path d="M38 25 L42 34" />
                <path d="M41 24 L45 33" />
                <path d="M44 25 L48 34" />
            </motion.g>

            {/* брови (всегда сердитые) */}
            <path d="M18 24 L28 27" stroke={BROW} strokeWidth={2.6} strokeLinecap="round" />
            <path d="M46 24 L36 27" stroke={BROW} strokeWidth={2.6} strokeLinecap="round" />

            {/* обычные (сердитые) глаза — гаснут при низком hp */}
            <motion.g animate={{ opacity: normalEyes }} transition={T}>
                <ellipse cx={24} cy={32} rx={6} ry={5} fill={EYE_WHITE} />
                <ellipse cx={40} cy={32} rx={6} ry={5} fill={EYE_WHITE} />
                <circle cx={24} cy={32} r={3} fill={EYE_IRIS} />
                <circle cx={40} cy={32} r={3} fill={EYE_IRIS} />
                <circle cx={24} cy={32} r={1.3} fill={EYE_PUPIL} />
                <circle cx={40} cy={32} r={1.3} fill={EYE_PUPIL} />
                {/* прищур — слегка прикрытое верхнее веко */}
                <path d="M18 28.5 Q24 24.5 30 28.5 Q24 30 18 28.5 Z" fill={HEAD_FILL} />
                <path d="M34 28.5 Q40 24.5 46 28.5 Q40 30 34 28.5 Z" fill={HEAD_FILL} />
            </motion.g>

            {/* оглушённые крестики-глаза — проступают при почти нулевом hp */}
            <motion.g
                animate={{ opacity: dizzy }}
                transition={T}
                stroke={EYE_PUPIL}
                strokeWidth={2.1}
                strokeLinecap="round"
            >
                <path d="M20 28 L28 36" />
                <path d="M28 28 L20 36" />
                <path d="M36 28 L44 36" />
                <path d="M44 28 L36 36" />
            </motion.g>
            <motion.g animate={{ opacity: dizzy }} transition={T}>
                <path d="M52 13 Q55.5 19 52 22 Q48.5 19 52 13 Z" fill={SWEAT} />
            </motion.g>

            {/* нос */}
            <polygon points="30,37 34,37 32,40" fill={HEAD_STROKE} />

            {/* открытый рот с клыками */}
            <path d="M22 44 Q32 54 42 44 Q32 50 22 44 Z" fill={MOUTH_FILL} />
            <polygon points="26,44 29,44 27.5,48.5" fill={TEETH} />
            <polygon points="35,44 38,44 36.5,48.5" fill={TEETH} />

            {/* скол на правом роге */}
            <motion.g animate={{ opacity: crack }} transition={T}>
                <path d="M50 6 L47 9 L50 11 L46 15" stroke={EYE_WHITE} strokeWidth={1} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <polygon points="56,4 60,8 55,9" fill={HORN_FILL} stroke={HEAD_STROKE} strokeWidth={0.8} transform="rotate(18 57 6)" />
            </motion.g>

            {/* кровь — на самых низких hp */}
            <motion.g animate={{ opacity: blood }} transition={T} fill={BLOOD}>
                <path d="M22 46 Q20 50 22 53 Q24 50 22 46 Z" />
                <path d="M42 46 Q44 50 42 53 Q40 50 42 46 Z" />
                <path d="M54 16 Q52 20 54 23 Q56 20 54 16 Z" />
            </motion.g>

            {/* пластырь на лбу — вместе с "оглушением" */}
            <motion.g animate={{ opacity: dizzy }} transition={T} transform="rotate(-10 32 21)">
                <rect x={16} y={18} width={32} height={7} rx={3} fill={BANDAGE} />
                <path d="M23 18 L25 25" stroke={STITCH} strokeWidth={1} />
                <path d="M30 18 L32 25" stroke={STITCH} strokeWidth={1} />
                <path d="M37 18 L39 25" stroke={STITCH} strokeWidth={1} />
            </motion.g>
        </svg>
    )
}
