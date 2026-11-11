'use client'

// Питомец на простом виде /trainer — Команданте Мигель (с 2026-10-28, раньше Га-Га): стикер с эмоцией и ОДНА
// короткая реплика в армейском тоне с юмором (docs/miguel/miguel.md). Пропал или вечером серия под угрозой → стучит
// в стекло; сет съеден или серия продлена → радуется и благодарит; иначе спокойно зовёт на урок (фраза по дню).

import { useEffect, useRef, useState, type RefObject } from 'react'
import { motion } from 'framer-motion'
import { GlassKnockIntro } from './glass-knock-intro'
import { GooseWalker } from '@/components/goose-walker'

type Props = {
    streak: number
    hasExtendedToday: boolean
    setDone: boolean
    away?: boolean // с прошлого занятия прошло 2 дня и больше
    firstName?: string | null
    dayKey: number // день месяца с сервера — чтобы SSR и клиент выбирали одно и то же
    compact?: boolean // маленькая версия для дорожки: питомец стоит у текущей точки
    row?: boolean // вместе с compact: облачко сбоку от гуся (когда слева от кружка нет места)
    cheer?: { src: string; text: string } | null // после урока: утка/гусь с подбадривающей фразой
    // Прогулка после урока: Мигель маршем идёт к следующему уроку, фраза — когда дошёл
    walking?: boolean
    arrived?: boolean
    flip?: boolean
    bubbleSide?: 'top' | 'left' | 'right' // где рисовать облачко относительно гуся (выбирает карта по свободному месту)
    poseKey?: number
}

// На карте Команданте Мигель. Картинки — стикеры public/miguel/*, стоит — miguel-point (тычет в ученика).
const GAGA_STAND = '/miguel/miguel-point.webp'
// Позы на карте: у каждой вес (сколько раз встречается в пуле). big — позы за стеклом: сначала на весь экран со стуком
// (components/glass-knock-intro.tsx). Настроение гуся зависит от ученика: стук и угрозы — только когда он опаздывает или
// пропал, за выполненное — улыбчивые позы и благодарность, в обычный день — спокойные.
type Pose = { src: string; weight: number; big?: boolean }
const GLASS_POSES: Pose[] = [
    { src: '/miguel/miguel-glass-stop.webp', weight: 2, big: true },
    { src: '/miguel/miguel-knock.webp', weight: 2, big: true },
    { src: '/miguel/miguel-glass-fist.webp', weight: 1, big: true },
]
const AWAY_POSES: Pose[] = [
    ...GLASS_POSES,
    { src: '/miguel/miguel-danger-pencil.webp', weight: 1 },
    { src: '/miguel/miguel-danger-pencil-2.webp', weight: 1 },
]
const HAPPY_POSES: Pose[] = [
    { src: '/miguel/miguel-dance.webp', weight: 3 },
    { src: '/miguel/miguel-salute-stars.webp', weight: 3 },
    { src: '/miguel/miguel-happy.webp', weight: 2 },
    { src: '/miguel/miguel-thumbs.webp', weight: 2 },
    { src: '/miguel/miguel-trophy.webp', weight: 2 },
    { src: '/miguel/miguel-streak.webp', weight: 1 },
]
const IDLE_POSES: Pose[] = [
    { src: GAGA_STAND, weight: 1 },
    { src: '/miguel/miguel-watch.webp', weight: 1 },
    { src: '/miguel/miguel-arms-crossed.webp', weight: 1 },
    { src: '/miguel/miguel-beckon.webp', weight: 1 },
    { src: '/miguel/miguel-book.webp', weight: 1 },
    { src: '/miguel/miguel-book-small.webp', weight: 1 },
    { src: '/miguel/miguel-shrug.webp', weight: 1 },
    { src: '/miguel/miguel-crate.webp', weight: 1 },
]
const ALL_POSES = [...AWAY_POSES, ...HAPPY_POSES, ...IDLE_POSES]
// poseKey приходит с сервера: SSR и браузер выбирают одну и ту же позу
const pickPose = (pool: Pose[], key: number) => {
    const total = pool.reduce((sum, p) => sum + p.weight, 0)
    let left = ((key * 2654435761) >>> 0) % total
    return pool.find((p) => (left -= p.weight) < 0) ?? pool[0]
}

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
// Серия продлена сегодня: благодарим.
export const GOOSE_THANKS = [
    'Спасибо за службу! Серия жива 🔥',
    'Благодарю, боец! Сегодня отряд тобой гордится 🫡',
    'Вот это дисциплина! Спасибо 🔥',
    'Га-га-га! Серия цела, спасибо, боец 🎖️',
]
// Опаздывает: вечер, а серия не продлена.
export const GOOSE_LATE = [
    'Боец, серия сгорит! Хоть один урок? ⏱️',
    'Тук-тук! Серия на волоске, боец!',
    'Опаздываешь, боец! Один урок спасёт серию',
]
// Пропал: не заходил со вчерашнего дня и дольше.
export const GOOSE_AWAY = [
    'Боец, ты куда пропал? Отряд ждёт 👀',
    'Тук-тук! Самоволка затянулась, боец!',
    'Давно тебя не видел. Возвращайся в строй!',
    'Маньяна кончилась, боец. Урок сегодня!',
]
// Сет за сегодня съеден.
export const GOOSE_QUEST = [
    'Сет закрыт! Заношу в личное дело 📋',
    'Задание дня выполнено. Хорошо служишь 🫡',
    'Га-га-га! Сет в кармане, боец 😎',
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

// Мигель крупно «по пояс»: картинка больше, видна верхняя ~3/4 (лицо, руки и то, что в руках), низ мягко растворяется.
export const PetBust = ({ src, size, width, bob = false, flip = false }: { src: string; size: number; width: number; bob?: boolean; flip?: boolean }) => (
    <div
        className="relative overflow-hidden flex-shrink-0 select-none"
        style={{
            width,
            height: Math.round(size * 0.74),
            WebkitMaskImage: 'linear-gradient(to bottom, #000 78%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, #000 78%, transparent 100%)',
            // отражение — на обёртке: transform на motion.img перезаписал бы framer
            transform: flip ? 'scaleX(-1)' : undefined,
        }}
    >
        <motion.img
            key={src}
            src={src}
            alt=""
            draggable={false}
            className="absolute left-1/2 top-0 max-w-none object-contain"
            style={{ width: size, height: size, marginLeft: -size / 2 }}
            animate={bob ? { y: [0, -4, 0] } : undefined}
            transition={bob ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
        />
    </div>
)

export const TrainerPet = ({ streak, hasExtendedToday, setDone, away = false, dayKey, compact = false, row = false, cheer = null, walking, arrived = true, flip = false, bubbleSide = 'top', poseKey = 0 }: Props) => {
    const bustRef = useRef<HTMLDivElement>(null)
    const [bustHidden, setBustHidden] = useState(false)
    // Час сверяем только после монтирования (часовой пояс браузера).
    const [late, setLate] = useState(false)
    useEffect(() => setLate(new Date().getHours() >= RISK_HOUR), [])

    // Фразы выбираются по дню месяца (с сервера), а не случайно — иначе SSR и браузер нарисовали бы разное.

    let mood: Mood
    if (cheer) mood = cheer
    else if (away) mood = { src: pickPose(AWAY_POSES, poseKey).src, text: GOOSE_AWAY[dayKey % GOOSE_AWAY.length] }
    else if (streak > 0 && !hasExtendedToday && late) mood = { src: pickPose(GLASS_POSES, poseKey).src, text: GOOSE_LATE[dayKey % GOOSE_LATE.length] }
    else if (setDone) mood = { src: pickPose(HAPPY_POSES, poseKey).src, text: GOOSE_QUEST[dayKey % GOOSE_QUEST.length] }
    else if (hasExtendedToday) mood = { src: pickPose(HAPPY_POSES, poseKey).src, text: GOOSE_THANKS[dayKey % GOOSE_THANKS.length] }
    else mood = { src: pickPose(IDLE_POSES, poseKey).src, text: GOOSE_IDLE[dayKey % GOOSE_IDLE.length] }
    const big = ALL_POSES.some((p) => p.big && p.src === mood.src)

    if (compact && cheer && walking !== undefined) {
        // Мигель идёт по дорожке; пока идёт — без облачка, дошёл — встаёт и говорит фразу.
        // Облачко рисуем сбоку или сверху от гуся (сторону выбирает карта по свободному месту), не меняя размер блока:
        // так гусь стоит ровно там, где посчитано, а облачко не наезжает на кнопки и названия уроков.
        const pos = bubbleSide === 'left' ? 'right-full top-1/2 -translate-y-[70%] mr-1'
            : bubbleSide === 'right' ? 'left-full top-1/2 -translate-y-[70%] ml-1'
            : 'bottom-full left-1/2 -translate-x-1/2 mb-1'
        return (
            <div className="relative w-32 h-32">
                {arrived && !walking && (
                    // позиционирование (translate) — на статичной обёртке, анимация scale — на внутреннем motion.div
                    <div className={`absolute ${pos} z-10`}>
                        <motion.div className="w-[170px] rounded-xl border-2 border-[#3A464E] bg-[#151F23] px-2.5 py-1.5 text-[15px] font-extrabold text-[#F2F7FB] leading-tight text-center"
                            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5, duration: 0.5 }}>
                            {cheer.text}
                        </motion.div>
                    </div>
                )}
                <GooseWalker walking={walking} flip={flip} className="w-32 h-32" />
            </div>
        )
    }

    if (compact && row) {
        return (
            <div className="flex items-center gap-1">
                <div className="w-[122px] rounded-xl border-2 border-[#3A464E] bg-[#151F23] px-2 py-1.5 text-[14px] font-extrabold text-[#F2F7FB] leading-tight text-center">
                    {mood.text}
                </div>
                <div ref={bustRef} style={{ visibility: bustHidden ? 'hidden' : undefined }}><PetBust src={mood.src} size={156} width={140} /></div>
                {big && <GlassKnockIntro src={mood.src} targetRef={bustRef} size={156} onActive={setBustHidden} />}
            </div>
        )
    }

    if (compact) {
        // узкий: стоит слева от кружка урока (справа — название урока)
        return (
            <div className="flex flex-col items-center gap-1 w-[150px]">
                <div className="rounded-xl border-2 border-[#3A464E] bg-[#151F23] px-2.5 py-2 text-[15px] font-extrabold text-[#F2F7FB] leading-tight text-center">
                    {mood.text}
                </div>
                <div ref={bustRef} style={{ visibility: bustHidden ? 'hidden' : undefined }}><PetBust src={mood.src} size={184} width={150} bob /></div>
                {big && <GlassKnockIntro src={mood.src} targetRef={bustRef} size={184} onActive={setBustHidden} />}
            </div>
        )
    }

    return (
        <div className="flex items-center gap-3 mb-3">
            <motion.img
                ref={bustRef as RefObject<HTMLImageElement>}
                key={mood.src}
                src={mood.src}
                alt=""
                draggable={false}
                className="w-20 h-20 object-contain flex-shrink-0 select-none"
                style={{ visibility: bustHidden ? 'hidden' : undefined }}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, y: [0, -4, 0] }}
                transition={{ scale: { type: 'spring', bounce: 0.5, duration: 0.5 }, opacity: { duration: 0.2 }, y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } }}
            />
            {big && <GlassKnockIntro src={mood.src} targetRef={bustRef} size={80} onActive={setBustHidden} />}
            <div className="relative flex-1 rounded-2xl border-2 border-[#3A464E] bg-[#151F23] px-4 py-3 text-base font-extrabold text-[#F2F7FB] leading-snug">
                <span className="absolute -left-[9px] top-1/2 -translate-y-1/2 w-4 h-4 rotate-45 bg-[#151F23] border-l-2 border-b-2 border-[#3A464E]" />
                {mood.text}
            </div>
        </div>
    )
}
