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
    cheer?: { src: string; text: string } | null // после урока: утка/гусь с подбадривающей фразой
}

// После пройденного урока питомец перебегает к следующему кружку — только утка или гусь.
// Утка крякает («кря»), гусь гогочет («га-га»). «Ква» — это лягушка, не путать 🐸
export const CHEER_PETS = ['/pets/duck.webp', '/pets/goose.webp']

// Утка: зовёт на урок (простой вид, когда нечего срочно делать) и радуется после урока.
export const DUCK_IDLE = [
    'Ну что, крякнем один урок? 🦆',
    'Кря! Один урок — и я отстану 🦆',
    'Кря-кря, мозг просит задачку',
    'Не тупи — крякни урок! 🦆',
    'Кряк! Чую, ты сегодня в ударе',
    'Утка верит в тебя. Кря 🫶',
    'Кря-кря! Это значит «го решать»',
    'Я крякаю, а ты решаешь. Дил? 🤝',
    'Кря! Урок — и хлебушек мой 🍞',
    'Кряк-кряк, ЕГЭ не ждёт!',
]
export const DUCK_CHEER = [
    'Кря-кря! Вот это ты выдал 🔥',
    'Кряк, легенда! Го дальше 🦆',
    'Я аж крякнула от восторга 🤯',
    'Кря! Мозг прокачан на +1 💪',
    'Утка в шоке. Ты имба 🦆',
    'Кря-кря-кря! (это аплодисменты) 👏',
    'Кряк! Изи катка. Следующий? 😏',
    'Кря! Так держать, легенда 👑',
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
export const pickCheer = () => {
    const src = pickOf(CHEER_PETS)
    const own = src.includes('goose') ? GOOSE_CHEER : DUCK_CHEER
    return { src, text: Math.random() < 0.75 ? pickOf(own) : pickOf(CHEER_PHRASES) }
}

const RISK_HOUR = 20

type Mood = { src: string; text: string }

export const TrainerPet = ({ streak, hasExtendedToday, questDone, dayKey, compact = false, cheer = null }: Props) => {
    // Час сверяем только после монтирования (часовой пояс браузера).
    const [late, setLate] = useState(false)
    useEffect(() => setLate(new Date().getHours() >= RISK_HOUR), [])

    // Фразы выбираются по дню месяца (с сервера), а не случайно — иначе SSR и браузер нарисовали бы разное.
    const idle: Mood[] = [
        { src: '/pets/duck.webp', text: DUCK_IDLE[dayKey % DUCK_IDLE.length] },
        { src: '/pets/dog-smirk.webp', text: 'Я верю, что ты сможешь 😏' },
    ]

    let mood: Mood
    if (cheer) mood = cheer
    else if (streak > 0 && !hasExtendedToday && late) mood = { src: '/pets/dog-side.webp', text: 'Серия сгорит! Хоть один урок?' }
    else if (questDone) mood = { src: '/pets/goose.webp', text: GOOSE_QUEST[dayKey % GOOSE_QUEST.length] }
    else if (hasExtendedToday) mood = { src: '/pets/cat-cool.webp', text: 'Серия жива. Ты босс 😎' }
    else mood = idle[dayKey % idle.length]

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
