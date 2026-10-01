'use client'

// Тест экрана «Насколько понятен был урок?» (components/lesson-rating-screen.tsx).
// Кнопку «Отправить» не жать — оценка уйдёт в базу (t_lesson 490) и админу в Telegram.

import { useState } from 'react'
import { LessonRatingScreen } from '@/components/lesson-rating-screen'
import type { UiTheme } from '@/lib/cozyTheme'

const btn = 'rounded-xl px-5 py-3 font-black uppercase text-sm'

export default function TestRatingPage() {
	const [shown, setShown] = useState<{ theme: UiTheme; key: number } | null>(null)
	if (shown) return <LessonRatingScreen key={shown.key} tLessonId={490} theme={shown.theme} onDone={() => setShown(null)} />
	return (
		<div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#131D22] p-4 text-center">
			<p className="text-[#9AA7B0] font-bold">Оценка урока (стикер в 4-м варианте каждый раз случайный)</p>
			<button className={btn + ' bg-[#78C93C] text-[#1B2A10]'} onClick={() => setShown({ theme: 'metal', key: Date.now() })}>▶ Игровой стиль</button>
			<button className={btn + ' bg-[#FFB67A] text-[#3A2412]'} onClick={() => setShown({ theme: 'cozy', key: Date.now() })}>▶ Тёплый стиль</button>
		</div>
	)
}
