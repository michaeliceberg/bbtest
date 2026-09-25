'use client'

// components/PizzaProgress.tsx
//
// 8 кусочков пиццы (public/pizzaSVG/pizza_8_N.svg), собранных из кейсов
// тренажёра (см. lib/caseRewards.ts/actions/open-case.ts) — файлы уже
// заранее нарисованы так, что простое наложение всех 8 друг на друга (без
// поворота) даёт целую круглую пиццу. Несобранные кусочки — тем же
// файлом, просто с CSS-фильтром grayscale (проверено визуально: не нужно
// ни отдельных "серых" версий файлов, ни ручного перекрашивания путей).
// Собрал все 8 — открывается право заказать настоящую пиццу (сама заявка
// на заказ — отдельная, ещё не реализованная фича, см. CLAUDE.md).

import { useRef } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { MAX_PIZZA_SLICES } from '@/lib/caseRewards'

type Props = {
	collected: number
	size?: number
	// Тёплый стиль — кремовый текст подписи.
	cozy?: boolean
}

export const PizzaProgress = ({ collected, size = 140, cozy = false }: Props) => {
	const clamped = Math.max(0, Math.min(MAX_PIZZA_SLICES, collected))
	const isComplete = clamped >= MAX_PIZZA_SLICES

	const left = MAX_PIZZA_SLICES - clamped

	// Наведение (или тап) — пицца раскручивается с ускорением, делает 2
	// оборота с затуханием, перекручивает на 20°, откатывается на 5° назад и встаёт ровно.
	const controls = useAnimationControls()
	const counterControls = useAnimationControls()
	const spinning = useRef(false)
	const spin = async () => {
		if (spinning.current) return
		spinning.current = true
		await controls.start({ rotate: 740, transition: { duration: 1.8, ease: [0.55, 0, 0.15, 1] } })
		// Счётчик «6/8» пружинит (увеличивается и уменьшается) в момент доворотов.
		counterControls.start({ scale: [1, 1.4, 0.9, 1.15, 1], transition: { duration: 0.9, ease: 'easeOut' } })
		await controls.start({ rotate: 715, transition: { duration: 0.35, ease: 'easeInOut' } })
		await controls.start({ rotate: 720, transition: { duration: 0.3, ease: 'easeInOut' } })
		controls.set({ rotate: 0 })
		spinning.current = false
	}

	return (
		<div className="flex w-full items-center justify-center gap-4" onMouseEnter={spin} onClick={spin}>
			<motion.div animate={controls} className="relative shrink-0" style={{ width: size, height: size }}>
				{Array.from({ length: MAX_PIZZA_SLICES }, (_, i) => {
					const sliceIndex = i + 1
					const isCollected = sliceIndex <= clamped
					return (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							key={sliceIndex}
							src={`/pizzaSVG/pizza_8_${sliceIndex}.svg`}
							alt=""
							className="absolute inset-0 w-full h-full transition-all duration-500"
							style={{
								filter: isCollected ? 'none' : 'grayscale(1) brightness(0.45)',
								opacity: isCollected ? 1 : 0.7,
							}}
						/>
					)
				})}
			</motion.div>
			<div className="flex flex-col gap-1.5 min-w-0">
				<motion.span animate={counterControls} className={`text-5xl font-black leading-none origin-left ${cozy ? '' : 'text-yellow-300'}`} style={cozy ? { color: '#EDE3D2', textShadow: '0 3px 0 #4A3F33' } : undefined}>
					{clamped}/{MAX_PIZZA_SLICES}
				</motion.span>
				<span className="flex items-end gap-2 text-base font-semibold leading-snug" style={{ color: cozy ? '#E6DED1' : '#C9D3D9' }}>
					<span>
						{isComplete ? (
							<>Пицца собрана —<br />промокод в Додо!</>
						) : (
							<>Собери ещё {left} и получи<br />промокод в Додо</>
						)}
					</span>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src="/dodo-icon.svg" alt="Додо" className="w-10 h-10 shrink-0" />
				</span>
			</div>
		</div>
	)
}
