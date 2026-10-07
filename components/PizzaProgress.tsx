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

// ВРЕМЕННО: заглушка для просмотра оформления (взята из dodo_promo_codes, не назначена).
const PREVIEW_PROMO_CODE = 'DODO-YA6VA7'

type Props = {
	collected: number
	size?: number
	// Тёплый стиль — кремовый текст подписи.
	cozy?: boolean
	// Промокод, уже назначенный автоматически (lib/caseApply.ts,
	// applyResolvedReward) — Фаза 2, 2026-09-29. Показывается вместо
	// общей фразы "промокод в Додо", как только collected>=8.
	dodoPromoCode?: string | null
	// Дробная часть (восьмые) от реферальной лестницы — «+½ в копилке».
	eighths?: number
}

export const PizzaProgress = ({ collected, size = 140, cozy = false, dodoPromoCode = null, eighths = 0 }: Props) => {
	// Кусочков может быть больше 8 (9/8…) — тогда целая пицца уже готова, счётчик показывает реальное число.
	const total = Math.max(0, collected)
	const clamped = Math.min(MAX_PIZZA_SLICES, total)
	const isComplete = total >= MAX_PIZZA_SLICES

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
				<motion.span animate={counterControls} className="text-5xl font-black leading-none text-yellow-300 origin-left">
					{total}/{MAX_PIZZA_SLICES}
				</motion.span>
				<span className="flex items-center gap-2 text-base font-semibold leading-snug" style={{ color: cozy ? '#FFE8C7' : '#C9D3D9' }}>
					<span>Промокод в Додо</span>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src="/dodo-icon.svg" alt="Додо" className="w-8 h-8 shrink-0" />
				</span>
				{/* Код: настоящий, как только назначен; пока нет — заглушка для просмотра оформления
				    (PREVIEW_PROMO_CODE — временно, убрать, когда посмотрим, как выглядит). */}
				<span
					className="self-start font-mono text-lg font-black tracking-wider text-yellow-300 rounded-lg px-3 py-1 border-2 border-dashed border-yellow-300/50 bg-yellow-300/10"
					title={dodoPromoCode ? 'Твой промокод' : 'Так будет выглядеть промокод, когда соберёшь пиццу'}
				>
					{dodoPromoCode ?? PREVIEW_PROMO_CODE}
				</span>
				{eighths > 0 && !isComplete && (
					<span className="text-sm font-bold text-yellow-300/80">
						+ {eighths === 4 ? '½' : eighths === 2 ? '¼' : eighths === 6 ? '¾' : `${eighths}/8`} кусочка в копилке
					</span>
				)}
			</div>
		</div>
	)
}
