// components/streak-risk-banner.tsx
//
// "Огонёк грустит/мокнет под дождём" — предупреждение на /learn, когда
// у пользователя ЕСТЬ серия (user_course_progress.streak, см.
// lib/streak.ts), но сегодня он её ещё не продлил, а время уже позднее.
// По просьбе пользователя ("добавить эмоций... streakFireRain/streakFireSad
// когда опаздываем с ударным режимом или осталось мало времени").
//
// Порог "поздно" (RISK_HOUR) — намеренно проверяется на КЛИЕНТЕ по
// локальному времени БРАУЗЕРА пользователя, а не на сервере: "осталось
// мало времени" — это про то, что реально видит пользователь на своих
// часах, а не про часовой пояс сервера (тот уже и так используется для
// границы "сегодня" при подсчёте самого стрика в lib/streak.ts — отдельная,
// более широкая договорённость проекта, здесь не трогаем).

'use client'

import { useEffect, useState } from 'react'
import { LOTTIE_STREAK_CELEBRATE_LIST, LOTTIE_STREAK_RISK_LIST, getRandomLottie } from '@/src/constants/lottieConstants'
import { daysWordGenitive } from '@/usefulFunctions'
import Lottie from '@/components/lottie-player'
import { StreakFreezeCard } from '@/components/streak-freeze-card'
import { showGagaOncePerDay } from '@/components/gaga-buddy'
import { ZnClipping } from '@/components/za-nauku-archive'
import { pickShortJoke, znSource, type ZnJoke } from '@/lib/zaNauku'
import { COIN_DROP_SOUND, playSound } from '@/lib/sound'

// Lottie грузится через общую обёртку (JSON — по URL, не в бандле)

const RISK_HOUR = 20 // 20:00 по локальному времени пользователя

// Команданте радуется покупке заморозки: «мы богачи» по-кубински
const RICH_PHRASES = [
    '¡Somos ricos, amigo! Тратим гемы, как настоящие богачи 💎',
    '¡Caramba! Заморозка в кармане — Команданте доволен, амиго 😎',
    '¡Vamos! Серия теперь в холодильнике, как мороженое на Кубе 🍦',
    'Богачи, компаньеро! Гемы для нас — не проблема 💸',
    '¡Hasta la victoria! Серию так просто не сожжёшь ❄️',
    'Мы так богаты, что покупаем время. Га-га! ⏳',
]

type Props = {
    streak: number
    // Заморозки серии и гемы — если переданы, внизу баннера строка «купить заморозку»
    freezes?: number
    gems?: number
    hasExtendedToday: boolean
}

export const StreakRiskBanner = ({ streak, hasExtendedToday, freezes, gems }: Props) => {
    // Проверка часа — намеренно только после монтирования (не в самом
    // рендере): избегает SSR/клиент-рассинхрона (сервер не знает часовой
    // пояс браузера) — до монтирования просто не показываем баннер,
    // никакого "мигания" неверным состоянием не будет, т.к. по умолчанию
    // компонент скрыт.
    const [isLate, setIsLate] = useState(false)
    const [animationData, setAnimationData] = useState<object | null>(null)
    // Сколько заморозок сейчас (обновляется после покупки прямо в баннере)
    const [freezesNow, setFreezesNow] = useState(freezes ?? 0)
    // Только что купили — радуемся: фраза Команданте + шутка из «За науку»
    const [celebrate, setCelebrate] = useState<{ phrase: string; joke: ZnJoke } | null>(null)
    const safe = freezesNow > 0

    useEffect(() => {
        setIsLate(new Date().getHours() >= RISK_HOUR)
    }, [])

    useEffect(() => {
        if (!isLate) return
        // Выбирается, когда баннер реально решил показаться (не на каждый рендер);
        // серия под защитой заморозки — огонёк радуется, а не плачет.
        setAnimationData(getRandomLottie(safe ? LOTTIE_STREAK_CELEBRATE_LIST : LOTTIE_STREAK_RISK_LIST))
    }, [isLate, safe])

    const onBought = (n: number) => {
        setFreezesNow(n)
        setCelebrate({ phrase: RICH_PHRASES[Math.floor(Math.random() * RICH_PHRASES.length)], joke: pickShortJoke() })
        playSound(COIN_DROP_SOUND)
    }

    // Поздно, а серия сегодня не продлена — Га-Га раз в день напоминает (и отправляет спать)
    useEffect(() => {
        if (isLate && streak > 0 && !hasExtendedToday) showGagaOncePerDay('night', 1200)
    }, [isLate, streak, hasExtendedToday])

    if (streak <= 0 || hasExtendedToday || !isLate) return null

    return (
        <div className={safe
            ? 'rounded-2xl border border-sky-400/40 bg-gradient-to-br from-[#12243A] to-[#1c1533] px-4 py-3 mb-4'
            : 'rounded-2xl border border-amber-500/40 bg-gradient-to-br from-[#2A1B12] to-[#1c1533] px-4 py-3 mb-4'}>
            <div className="flex items-center gap-3">
                <div className="w-14 h-14 shrink-0 -my-2">
                    {animationData && <Lottie animationData={animationData} loop autoplay />}
                </div>
                <div className="flex-1 min-w-0">
                    {safe ? <>
                        <p className="font-bold text-sky-300">Серия из {streak} {daysWordGenitive(streak)} под защитой ❄️</p>
                        <p className="text-sm text-[#9AA7B0]">Даже если сегодня не успеешь — заморозка спасёт. Но лучше реши урок 😉</p>
                    </> : <>
                        <p className="font-bold text-amber-400">Не теряй серию из {streak} {daysWordGenitive(streak)}!</p>
                        <p className="text-sm text-[#9AA7B0]">Сегодня ты ещё не занимался — время уходит 🕒</p>
                    </>}
                    {freezes !== undefined && gems !== undefined && <StreakFreezeCard compact freezes={freezes} gems={gems} onBought={onBought} />}
                </div>
            </div>
            {celebrate && (
                <div className="mt-3 flex flex-col gap-2">
                    <p className="text-center text-base font-black text-[#FFD45C]">{celebrate.phrase}</p>
                    <ZnClipping text={celebrate.joke.text} rubric={celebrate.joke.rubric} source={znSource(celebrate.joke)} />
                </div>
            )}
        </div>
    )
}
