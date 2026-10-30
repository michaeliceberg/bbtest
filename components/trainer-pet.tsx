'use client'

// Питомец на простом виде /trainer — Команданте Мигель (с 2026-10-28, раньше Га-Га): стикер с эмоцией и ОДНА
// короткая реплика в армейском тоне с юмором (docs/miguel/miguel.md). Поздний час и серия под угрозой →
// секундомер; квест выполнен → чек-лист; серия продлена → огонь; иначе стоит и зовёт на урок (фраза по дню).

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
    // Прогулка после урока: Мигель маршем идёт к следующему уроку, фраза — когда дошёл
    walking?: boolean
    arrived?: boolean
    flip?: boolean
}

// На карте Команданте Мигель. Картинки — стикеры public/miguel/*, стоит — miguel-point (тычет в ученика).
const GAGA_STAND = '/miguel/miguel-point.webp'

// Мигель зовёт на урок (простой вид, когда нечего срочно делать).
export const GOOSE_IDLE = [
    'Боец! Один урок — и свободен 🫡',
    'Смирно! Задание на сегодня ждёт',
    'Га! Разговорчики — урок открываем',
    'Маньяна — враг революции. Урок сейчас!',
    'Отряд уже на задании. А ты? 👀',
    'Мозг без тренировки ржавеет. Марш на урок!',
    'Га-га! Это значит «шагом марш»',
    'До экзамена ближе с каждым днём. Готовимся спокойно и по плану 😤',
    'Ещё один урок — ещё один шаг к ВУЗу',
    'Боец, баллы сами себя не нафармят!',
]
// Квест дня выполнен.
export const GOOSE_QUEST = [
    'Квест закрыт! Заношу в личное дело 📋',
    'Задание дня выполнено. Хорошо служишь 🫡',
    'Га-га-га! Квест в кармане, боец 😎',
    'Чётко! Командование довольно 🎖️',
]
// После урока, когда Мигель дошёл до следующего урока по дорожке.
export const GOOSE_CHEER = [
    'Высота взята! Следующая — там 👉',
    'Чётко сработано. Шагом марш дальше!',
    'Га-га-га! К экзамену готов всё лучше 💥',
    'Вот это выправка! Ещё урок?',
    'Отставить отдых — наступаем! 🚀',
    'Заношу в личное дело: молодец 📋',
    'Га! Это значит «давай ещё»',
    'Минус урок, плюс балл. Так держать 📈',
    'Так держать, боец. Отряд гордится 🫡',
    'Темп хороший. Не сбавляем ⚡',
]
// Общие подбадривания без «Га».
export const CHEER_PHRASES = [
    'Серия жива. Так держать 🔥',
    'Красава, шагом марш дальше! 🚀',
    'Дисциплина — твоё оружие 💪',
    'Вот это скорость ⚡',
    'Ещё урок — и ты впереди отряда 🏆',
    'Чётко, по-командирски 👌',
]
const pickOf = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]
// Подбадривание после урока: фраза Мигеля (или общая). Мигель идёт по карте маршем (components/goose-walker.tsx).
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
    else if (streak > 0 && !hasExtendedToday && late) mood = { src: '/miguel/miguel-stopwatch.webp', text: 'Боец, серия сгорит! Хоть один урок? ⏱️' }
    else if (questDone) mood = { src: '/miguel/miguel-quest.webp', text: GOOSE_QUEST[dayKey % GOOSE_QUEST.length] }
    else if (hasExtendedToday) mood = { src: '/miguel/miguel-streak.webp', text: 'Серия жива! Хорошо служишь 🔥' }
    else mood = { src: GAGA_STAND, text: GOOSE_IDLE[dayKey % GOOSE_IDLE.length] }

    if (compact && cheer && walking !== undefined) {
        // Мигель идёт по дорожке; пока идёт — без облачка, дошёл — встаёт и говорит фразу
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
        // узкий: стоит слева от кружка урока (справа — название урока)
        return (
            <div className="flex flex-col items-center gap-1 w-[112px]">
                <div className="rounded-xl border-2 border-[#3A464E] bg-[#151F23] px-2 py-1.5 text-[12px] font-extrabold text-[#F2F7FB] leading-tight text-center">
                    {mood.text}
                </div>
                <motion.img
                    key={mood.src}
                    src={mood.src}
                    alt=""
                    draggable={false}
                    className="w-20 h-20 object-contain select-none"
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
