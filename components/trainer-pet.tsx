'use client'

// Питомец на простом виде /trainer: картинка с эмоцией и ОДНА короткая реплика
// в облачке — вместо стопки подсказок и баннеров. Эмоция/реплика выбираются по
// состоянию: поздний час и серия под угрозой → тревожный пёс; квест выполнен →
// гусь; серия продлена сегодня → крутой кот; иначе утка/пёс (по дню — детерминированно).

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type Props = {
    streak: number
    hasExtendedToday: boolean
    questDone: boolean
    firstName?: string | null
    dayKey: number // день месяца с сервера — чтобы SSR и клиент выбирали одно и то же
    compact?: boolean // маленькая версия для дорожки: питомец стоит у текущей точки
}

const RISK_HOUR = 20

type Mood = { src: string; text: string }

export const TrainerPet = ({ streak, hasExtendedToday, questDone, dayKey, compact = false }: Props) => {
    // Час сверяем только после монтирования (часовой пояс браузера).
    const [late, setLate] = useState(false)
    useEffect(() => setLate(new Date().getHours() >= RISK_HOUR), [])

    const idle: Mood[] = [
        { src: '/pets/duck.webp', text: 'Ну что, ква-кнем один урок? 🦆' },
        { src: '/pets/dog-smirk.webp', text: 'Я верю, что ты сможешь 😏' },
    ]

    let mood: Mood
    if (streak > 0 && !hasExtendedToday && late) mood = { src: '/pets/dog-side.webp', text: 'Серия сгорит! Хоть один урок?' }
    else if (questDone) mood = { src: '/pets/goose.webp', text: 'Квест дня закрыт! Гусь доволен 🪿' }
    else if (hasExtendedToday) mood = { src: '/pets/cat-cool.webp', text: 'Серия жива. Ты босс 😎' }
    else mood = idle[dayKey % idle.length]

    if (compact) {
        return (
            <div className="flex flex-col items-center gap-1 w-[118px]">
                <div className="rounded-xl border-2 border-[#3A464E] bg-[#151F23] px-2 py-1 text-[11px] font-extrabold text-[#F2F7FB] leading-tight text-center">
                    {mood.text}
                </div>
                <motion.img
                    key={mood.src}
                    src={mood.src}
                    alt=""
                    draggable={false}
                    className="w-14 h-14 object-contain select-none"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>
        )
    }

    return (
        <div className="flex items-center gap-3 mb-3">
            <motion.img
                key={mood.src}
                src={mood.src}
                alt=""
                draggable={false}
                className="w-20 h-20 object-contain flex-shrink-0 select-none"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, y: [0, -4, 0] }}
                transition={{ scale: { type: 'spring', bounce: 0.5, duration: 0.5 }, opacity: { duration: 0.2 }, y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } }}
            />
            <div className="relative flex-1 rounded-2xl border-2 border-[#3A464E] bg-[#151F23] px-4 py-3 text-base font-extrabold text-[#F2F7FB] leading-snug">
                <span className="absolute -left-[9px] top-1/2 -translate-y-1/2 w-4 h-4 rotate-45 bg-[#151F23] border-l-2 border-b-2 border-[#3A464E]" />
                {mood.text}
            </div>
        </div>
    )
}
