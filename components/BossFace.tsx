// components/BossFace.tsx
//
// Мордочка босса тренажёра — 4 явно разных состояния (не оттенки одного
// рисунка, как в первой версии этого компонента, а честно разные кадры),
// переключается по hp с кроссфейдом. Персонаж выбирается случайно один
// раз на всю боссовскую попытку (при монтировании компонента) — не
// перевыбирается между вопросами, только если пользователь начнёт урок
// заново.
//
// Арт — пиксель-арт из бесплатного пака "Boss Portraits Emotion Pixel
// Art" (автор CraftPix.net), источник:
// https://opengameart.org/content/boss-portraits-emotion-pixel-art
// Лицензия OGA-BY 3.0 (эквивалент CC-BY 3.0) — ТРЕБУЕТ указания
// авторства при использовании. Credit: "Boss Portraits Emotion Pixel Art"
// by CraftPix.net (craftpix.net), OpenGameArt.org, лицензия OGA-BY 3.0.
// Если у приложения появится публичная страница "О приложении"/credits —
// эту атрибуцию нужно продублировать туда (сейчас её негде показать
// пользователю, кроме этого комментария).
//
// Файлы — по 4 из 12 эмоций каждого из 3 персонажей пака
// (public/boss/{troll,toad,beetle}-*.png), выбраны как чёткая история
// "от полного здоровья до нокаута": Calm → Angry → Furious (уже с кровью
// на лице) → Stunning (вырубило).

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

type Props = {
    hp: number // 0-100, оставшееся здоровье босса
    size?: number
}

type Stage = { src: string; label: string }

const CHARACTERS: Stage[][] = [
    [
        { src: '/boss/troll-calm.png', label: 'Спокоен' },
        { src: '/boss/troll-angry.png', label: 'Злится' },
        { src: '/boss/troll-furious.png', label: 'В ярости, ранен' },
        { src: '/boss/troll-stunning.png', label: 'Вырубило' },
    ],
    [
        { src: '/boss/toad-calm.png', label: 'Спокоен' },
        { src: '/boss/toad-angry.png', label: 'Злится' },
        { src: '/boss/toad-furious.png', label: 'В ярости, ранен' },
        { src: '/boss/toad-stunning.png', label: 'Вырубило' },
    ],
    [
        { src: '/boss/beetle-calm.png', label: 'Спокоен' },
        { src: '/boss/beetle-angry.png', label: 'Злится' },
        { src: '/boss/beetle-furious.png', label: 'В ярости, ранен' },
        { src: '/boss/beetle-stunning.png', label: 'Вырубило' },
    ],
]

const thresholdFor = (hp: number) => {
    if (hp > 65) return 0
    if (hp > 35) return 1
    if (hp > 12) return 2
    return 3
}

export const BossFace = ({ hp, size = 56 }: Props) => {
    // Случайный персонаж — один раз на попытку, не на каждый рендер/удар.
    const [stages] = useState(() => CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)])
    const activeIndex = thresholdFor(Math.max(0, Math.min(100, hp)))

    return (
        <div className="relative" style={{ width: size, height: size }}>
            {stages.map((stage, i) => (
                <motion.img
                    key={stage.src}
                    src={stage.src}
                    alt={stage.label}
                    className="absolute inset-0"
                    style={{ width: size, height: size, imageRendering: 'pixelated' }}
                    animate={{ opacity: i === activeIndex ? 1 : 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                />
            ))}
        </div>
    )
}
