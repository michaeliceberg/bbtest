'use client'

// Питомец на простом виде /trainer — только Га-Га (гусь с квадратной головой): картинка с эмоцией и ОДНА
// короткая реплика. Поздний час и серия под угрозой → спит/тревожится; квест выполнен → гордится;
// серия продлена → огонь; иначе стоит и зовёт на урок (фраза по дню — детерминированно).

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { GooseWalker } from '@/components/goose-walker'

type Props = {
    streak: number
    hasExtendedToday: boolean
    questDone: boolean
    firstName?: string | null
    dayKey: number // день месяца с сервера — чтобы SSR и клиент выбирали одно и то же
    compact?: boolean // маленькая версия для дорожки: питомец стоит у текущей точки
    cheer?: { src: string; text: string } | null // после урока: утка/гусь с подбадривающей фразой
    // Прогулка после урока: Га-Га идёт к следующему уроку (покадровая походка), фраза — когда дошёл
    walking?: boolean
    arrived?: boolean
    flip?: boolean
}

// На карте только Га-Га (гусь с квадратной головой). Утка, пёс, кот и старый гусь-фото убраны.
// Картинки — стикеры Команданте Мигеля public/miguel/* (с 2026-10-28), стоит — miguel-point.
const GAGA_STAND = '/miguel/miguel-point.webp'

// Га-Га зовёт на урок (простой вид, когда нечего срочно делать).
export const GOOSE_IDLE = [
    'Га-га! Один урок — и я отстану 🪿',
    'Гуси-гуси, га-га-га! Урок хотите? Да-да-да!',
    'Га! Мозг просит задачку',
    'Не тупи — гагакни урок! 🪿',
    'Га-га! Чую, ты сегодня в ударе',
    'Гусь верит в тебя. Га 🫶',
    'Га-га! Это значит «го решать»',
    'Я гогочу, а ты решаешь. Дил? 🤝',
    'Га! ЕГЭ не ждёт, а я жду тебя',
    'Га-га, погнали фармить баллы!',
]
// Гусь (талисман «Га-Га»): радуется квесту дня и урокам.
export const GOOSE_QUEST = [
    'Га-га-га! Квест закрыт, ты красава 🪿',
    'Га! Квест дня в кармане 😎',
    'Гусь доволен: га-га-га! 🎉',
    'Га-га! Квест сделан — можешь флексить 💅',
]
export const GOOSE_CHEER = [
    'Га-га-га! Это было имбово 🔥',
    'Гусь одобряет: ГА! 🪿',
    'Га-га! Не пойдёшь дальше — ущипну 😤',
    'Га-га-га! Ты разносишь 💥',
    'Гусь не щиплет — гусь гордится 🥹',
    'ГА! (это «давай ещё» по-гусиному)',
    'Га-га, легенда! Топаем дальше 🐾',
    'Гуси-гуси, га-га-га! Ещё урок? Да-да-да!',
    'Даже гусь так быстро не бегает ⚡',
    'Га-га! Минус урок, плюс балл 📈',
]
// Без звуков — подходят любому питомцу.
export const CHEER_PHRASES = [
    'Серия жива. Ты босс 😎',
    'Красава, го дальше! 🚀',
    'Ты на вайбе, не тормози!',
    'Вот это скорость ⚡',
    'Ещё урок и ты в топе 🏆',
    'Чётко сработано 👌',
    'Флексим знаниями 😎',
    'Рил круто получилось ✨',
    'Я в шоке, это гениально 🤯',
]
const pickOf = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]
// Подбадривание после урока: случайный питомец и фраза ЕГО голосом (или общая).
// goose — всегда Га-Га (он идёт по карте покадровой походкой, components/goose-walker.tsx)
export const pickCheer = (_only?: 'goose') => {
    return { src: GAGA_STAND, text: Math.random() < 0.75 ? pickOf(GOOSE_CHEER) : pickOf(CHEER_PHRASES) }
}

const RISK_HOUR = 20

type Mood = { src: string; text: string }

export const TrainerPet = ({ streak, hasExtendedToday, questDone, dayKey, compact = false, cheer = null, walking, arrived = true, flip = false }: Props) => {
    // Час сверяем только после монтирования (часовой пояс браузера).
    const [late, setLate] = useState(false)
    useEffect(() => setLate(new Date().getHours() >= RISK_HOUR), [])

    // Фразы выбираются по дню месяца (с сервера), а не случайно — иначе SSR и браузер нарисовали бы разное.

    let mood: Mood
    if (cheer) mood = cheer
    else if (streak > 0 && !hasExtendedToday && late) mood = { src: '/miguel/miguel-stopwatch.webp', text: 'Га… серия сгорит! Хоть один урок?' }
    else if (questDone) mood = { src: '/miguel/miguel-quest.webp', text: GOOSE_QUEST[dayKey % GOOSE_QUEST.length] }
    else if (hasExtendedToday) mood = { src: '/miguel/miguel-streak.webp', text: 'Га-га! Серия жива. Ты босс 😎' }
    else mood = { src: GAGA_STAND, text: GOOSE_IDLE[dayKey % GOOSE_IDLE.length] }

    if (compact && cheer && walking !== undefined) {
        // Га-Га идёт по дорожке; пока идёт — без облачка, дошёл — встаёт и говорит фразу
        return (
            <div className="flex flex-col items-center gap-1 w-[156px]">
                <div className="min-h-[36px] flex items-end">
                    {arrived && !walking && (
                        <motion.div className="rounded-xl border-2 border-[#3A464E] bg-[#151F23] px-2.5 py-1.5 text-[13px] font-extrabold text-[#F2F7FB] leading-tight text-center"
                            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5, duration: 0.5 }}>
                            {cheer.text}
                        </motion.div>
                    )}
                </div>
                <GooseWalker walking={walking} flip={flip} className="w-24 h-24" />
            </div>
        )
    }

    if (compact) {
        return (
            <div className="flex flex-col items-center gap-1 w-[156px]">
                <div className="rounded-xl border-2 border-[#3A464E] bg-[#151F23] px-2.5 py-1.5 text-[13px] font-extrabold text-[#F2F7FB] leading-tight text-center">
                    {mood.text}
                </div>
                <motion.img
                    key={mood.src}
                    src={mood.src}
                    alt=""
                    draggable={false}
                    className="w-24 h-24 object-contain select-none"
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
