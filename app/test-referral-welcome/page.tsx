'use client'

// Тест экрана «Тебя позвал … — пройди 3 урока, получи кусочек пиццы»
// (components/referral-screens.tsx, ReferralWelcome) — первый экран гостя,
// пришедшего по ссылке ggege.ru/i/КОД.

import { useState } from 'react'
import { ReferralWelcome } from '@/components/referral-screens'
import { LessonLoading } from '@/components/lesson-loading'
import { GuestVibePicker } from '@/components/guest-vibe-picker'
import { SIDEBAR_LOTTIE_LOADERS } from '@/utils/TransitionLink'
import type { UiTheme } from '@/lib/cozyTheme'

const btn = 'rounded-xl px-5 py-3 font-black uppercase text-sm'

export default function TestReferralWelcomePage() {
	const [shown, setShown] = useState<{ theme: UiTheme; nick: string | null; key: number } | null>(null)
	const [loading, setLoading] = useState(false)
	const [vibes, setVibes] = useState(false)
	if (vibes) {
		return <GuestVibePicker subtitle="Приз твой: 💎 +2 гема! Теперь придумаем тебе позывной" onDone={() => setVibes(false)} />
	}
	if (loading) {
		return (
			<div onClick={() => setLoading(false)}>
				<LessonLoading minDuration={1800} lottieFiles={SIDEBAR_LOTTIE_LOADERS} />
			</div>
		)
	}
	if (shown) {
		return <ReferralWelcome key={shown.key} inviterNickname={shown.nick} theme={shown.theme} onStart={() => setShown(null)} />
	}
	return (
		<div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#131D22] p-4 text-center">
			<p className="text-[#9AA7B0] font-bold">Первый экран урока по приглашению</p>
			<button className={btn + ' bg-[#FBBF24] text-[#3A2400]'} onClick={() => setShown({ theme: 'metal', nick: 'Бушующий Экспериментатор', key: Date.now() })}>
				▶ Игровой стиль
			</button>
			<button className={btn + ' bg-[#FFB67A] text-[#3A2412]'} onClick={() => setShown({ theme: 'cozy', nick: 'Бушующий Экспериментатор', key: Date.now() })}>
				▶ Тёплый стиль
			</button>
			<button className={btn + ' bg-[#2A363C] text-[#D5DEE5]'} onClick={() => setShown({ theme: 'metal', nick: null, key: Date.now() })}>
				▶ Без имени пригласившего
			</button>
			<button className={btn + ' bg-[#2A363C] text-[#D5DEE5]'} onClick={() => setVibes(true)}>
				😎 «Что тебе заходит?» (после кейса)
			</button>
			<button className={btn + ' bg-[#2A363C] text-[#D5DEE5]'} onClick={() => setLoading(true)}>
				⏳ Заставка загрузки (клик — закрыть)
			</button>
		</div>
	)
}
