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
import { LESSON_RATING_OPTIONS } from '@/lib/lessonRating'
import { COZY, type UiTheme } from '@/lib/cozyTheme'

type Props = {
	tLessonId: number
	theme?: UiTheme
	onDone: () => void
}

// Цвет выбранного варианта: от красного (не понял) к зелёному (всё понял).
const ACCENTS = ['#DC605B', '#F09B38', '#53ADEF', '#78C93C']

export const LessonRatingScreen = ({ tLessonId, theme = 'metal', onDone }: Props) => {
	const cozy = theme === 'cozy'
	const [score, setScore] = useState<number | null>(null)
	const [comment, setComment] = useState('')
	const [sending, setSending] = useState(false)

	const isBad = score != null && score <= 2
	const accent = score != null ? ACCENTS[score - 1] : null

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
			<div className="w-full max-w-md flex-1 flex flex-col items-center justify-center gap-6">
				<motion.div
					initial={{ scale: 0.4, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ type: 'spring', bounce: 0.5 }}
					className="text-6xl"
				>
					{score != null ? LESSON_RATING_OPTIONS[score - 1].emoji : '🤔'}
				</motion.div>
				<h1
					className="text-2xl sm:text-3xl font-extrabold text-center"
					style={{ color: cozy ? COZY.title : '#F2F7FB' }}
				>
					Насколько понятен был урок?
				</h1>

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
								<span className="text-4xl leading-none">{o.emoji}</span>
								<span className="font-extrabold text-sm" style={{ color: selected ? c : cozy ? COZY.title : '#F2F7FB' }}>
									{o.label}
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
							placeholder="Например: не понял, куда направлено поле B"
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
						boxShadow: `0 5px 0 ${cozy ? COZY.grassEdge : '#4E8A33'}`,
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
