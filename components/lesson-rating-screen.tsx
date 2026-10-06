'use client'

// components/lesson-rating-screen.tsx
//
// «Насколько понятен был урок?» — после пошаговых разборов (*WALK), перед
// итогами урока. 4 смайлика по шкале (lib/lessonRating.ts); на плохую оценку
// (1–2) — поле «что было непонятно». Оценки пишутся в lesson_ratings
// (actions/lesson-rating.ts) — по ним видно, какой урок ТОП, а какой переделать.

import { useState } from 'react'
import { motion } from 'framer-motion'
import { submitLessonRating } from '@/actions/lesson-rating'
import { LESSON_RATING_OPTIONS, RATING_STICKERS, TOP_RATING_STICKERS } from '@/lib/lessonRating'
import { COZY, type UiTheme } from '@/lib/cozyTheme'

type Props = {
	tLessonId: number
	theme?: UiTheme
	subject?: 'math' | 'physics' // для подсказки в поле «что было непонятно»
	onDone: () => void
}

// Цвет выбранного варианта: от красного (не понял) к зелёному (всё понял).
const ACCENTS = ['#DC605B', '#F09B38', '#53ADEF', '#78C93C']
// Нижняя грань кнопки «Отправить» — тот же цвет, но темнее.
const ACCENT_EDGES = ['#A9453F', '#C07C2B', '#428BC0', '#4E8A33']

const PLACEHOLDERS = {
	math: 'Например: не понял, почему здесь минус',
	physics: 'Например: не понял, куда направлено поле B',
}

export const LessonRatingScreen = ({ tLessonId, theme = 'metal', subject = 'math', onDone }: Props) => {
	const cozy = theme === 'cozy'
	const [score, setScore] = useState<number | null>(null)
	// Экран монтируется только на клиенте (после урока) — случайный выбор безопасен.
	const [sticker] = useState(() => TOP_RATING_STICKERS[Math.floor(Math.random() * TOP_RATING_STICKERS.length)])
	// По одному случайному стикеру на каждую из оценок 1–3 (одинаковый на карточке и в большом превью).
	const [lowStickers] = useState<Record<number, string>>(() => {
		const pick = (arr: readonly string[]) => arr[Math.floor(Math.random() * arr.length)]
		return { 1: pick(RATING_STICKERS[1]), 2: pick(RATING_STICKERS[2]), 3: pick(RATING_STICKERS[3]) }
	})
	const topScore = LESSON_RATING_OPTIONS.length
	const [comment, setComment] = useState('')
	const [sending, setSending] = useState(false)

	const isBad = score != null && score <= 2
	const accent = score != null ? ACCENTS[score - 1] : null
	const accentEdge = score != null ? ACCENT_EDGES[score - 1] : null

	const send = async () => {
		if (score == null || sending) return
		setSending(true)
		await submitLessonRating(tLessonId, score, isBad ? comment : undefined).catch(() => null)
		onDone()
	}

	return (
		<div
			className="min-h-[100dvh] w-full flex flex-col items-center px-4 pt-10 pb-6"
			style={{ background: cozy ? COZY.bg : '#131D22' }}
		>
			<div className="w-full max-w-md flex-1 flex flex-col items-center justify-start gap-5">
				{/* Вопрос — в самом верху экрана. */}
				<h1
					className="text-2xl sm:text-3xl font-extrabold text-center"
					style={{ color: cozy ? COZY.title : '#F2F7FB' }}
				>
					Насколько понятен был урок?
				</h1>

				{/* Выбранный вариант: стикер и под ним — подпись выбранного ответа
					(а не статичный вопрос). До выбора — подсказка. */}
				<div className="flex flex-col items-center justify-center gap-2 min-h-[14rem]">
					<motion.div
						key={score ?? 0}
						initial={{ scale: 0.4, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ type: 'spring', bounce: 0.5 }}
						className="text-6xl flex flex-col items-center gap-2"
					>
						{score === topScore ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img src={sticker.src} alt="" className="h-36 w-36 object-contain" />
						) : score != null ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img src={lowStickers[score]} alt="" className="h-36 w-36 object-contain" />
						) : (
							<span className="leading-none">🤔</span>
						)}
						<span
							className="text-xl sm:text-2xl font-extrabold text-center"
							style={{ color: accent ?? (cozy ? COZY.textSoft : '#9AA7B0') }}
						>
							{score == null ? 'Выбери вариант ниже' : score === topScore ? sticker.label : LESSON_RATING_OPTIONS[score - 1].label}
						</span>
					</motion.div>
				</div>

				<div className="w-full grid grid-cols-2 gap-3">
					{LESSON_RATING_OPTIONS.map((o, i) => {
						const selected = score === o.score
						const c = ACCENTS[i]
						return (
							<motion.button
								key={o.score}
								type="button"
								onClick={() => setScore(o.score)}
								whileTap={{ y: 3 }}
								animate={{ scale: selected ? 1.04 : 1 }}
								className="rounded-2xl px-3 py-4 flex flex-col items-center gap-1 text-center"
								style={{
									background: selected ? `${c}2E` : cozy ? COZY.card : '#1B2A31',
									border: `2px solid ${selected ? c : cozy ? COZY.cardBorder : '#3A464E'}`,
									boxShadow: `0 4px 0 ${selected ? c : cozy ? COZY.cardEdge : '#0E1519'}`,
								}}
							>
								{o.score === topScore ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={sticker.src} alt="" className="h-14 w-14 object-contain -my-2" />
								) : (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={lowStickers[o.score]} alt="" className="h-14 w-14 object-contain -my-2" />
								)}
								<span className="font-extrabold text-sm" style={{ color: selected ? c : cozy ? COZY.title : '#F2F7FB' }}>
									{o.score === topScore ? sticker.label : o.label}
								</span>
								<span className="text-xs" style={{ color: cozy ? COZY.textSoft : '#9AA7B0' }}>{o.hint}</span>
							</motion.button>
						)
					})}
				</div>

				{isBad && (
					<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col gap-2">
						<label className="text-sm font-bold" style={{ color: cozy ? COZY.textSoft : '#D5DEE5' }}>
							Что было непонятно? Напиши — переделаем 🙏
						</label>
						<textarea
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							rows={3}
							maxLength={1000}
							placeholder={PLACEHOLDERS[subject]}
							className="w-full rounded-xl p-3 text-sm outline-none resize-none"
							style={{
								background: cozy ? COZY.track : '#0E1519',
								color: cozy ? COZY.title : '#F2F7FB',
								border: `2px solid ${cozy ? COZY.cardBorder : '#3A464E'}`,
							}}
						/>
					</motion.div>
				)}
			</div>

			<div className="w-full max-w-md flex flex-col gap-2">
				<button
					type="button"
					onClick={send}
					disabled={score == null || sending}
					className="w-full h-14 rounded-2xl font-extrabold uppercase tracking-wider transition-opacity disabled:opacity-40"
					style={{
						background: accent ?? (cozy ? COZY.grass : '#78C93C'),
						color: '#0E1519',
						boxShadow: `0 5px 0 ${accentEdge ?? (cozy ? COZY.grassEdge : '#4E8A33')}`,
					}}
				>
					{sending ? 'Отправляем…' : 'Отправить'}
				</button>
				<button
					type="button"
					onClick={onDone}
					className="w-full h-10 text-sm font-bold"
					style={{ color: cozy ? COZY.textSoft : '#9AA7B0' }}
				>
					Пропустить
				</button>
			</div>
		</div>
	)
}
