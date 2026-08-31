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
import dynamic from 'next/dynamic'
import { LOTTIE_STREAK_RISK_LIST, getRandomLottie } from '@/src/constants/lottieConstants'
import { daysWordGenitive } from '@/usefulFunctions'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

const RISK_HOUR = 20 // 20:00 по локальному времени пользователя

type Props = {
    streak: number
    hasExtendedToday: boolean
}

export const StreakRiskBanner = ({ streak, hasExtendedToday }: Props) => {
    // Проверка часа — намеренно только после монтирования (не в самом
    // рендере): избегает SSR/клиент-рассинхрона (сервер не знает часовой
    // пояс браузера) — до монтирования просто не показываем баннер,
    // никакого "мигания" неверным состоянием не будет, т.к. по умолчанию
    // компонент скрыт.
    const [isLate, setIsLate] = useState(false)
    const [animationData, setAnimationData] = useState<object | null>(null)

    useEffect(() => {
        setIsLate(new Date().getHours() >= RISK_HOUR)
    }, [])

    useEffect(() => {
        if (!isLate) return
        // Выбирается один раз, когда баннер реально решил показаться —
        // не на каждый рендер.
        setAnimationData(getRandomLottie(LOTTIE_STREAK_RISK_LIST))
    }, [isLate])

    if (streak <= 0 || hasExtendedToday || !isLate) return null

    return (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-[#2A1B12] to-[#1c1533] px-4 py-3 mb-4 flex items-center gap-3">
            <div className="w-14 h-14 shrink-0 -my-2">
                {animationData && <Lottie animationData={animationData} loop autoplay />}
            </div>
            <div>
                <p className="font-bold text-amber-400">
                    Не теряй серию из {streak} {daysWordGenitive(streak)}!
                </p>
                <p className="text-sm text-[#9AA7B0]">
                    Сегодня ты ещё не занимался — время уходит 🕒
                </p>
            </div>
        </div>
    )
}
