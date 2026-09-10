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

import { MAX_PIZZA_SLICES } from '@/lib/caseRewards'

type Props = {
	collected: number
	size?: number
}

export const PizzaProgress = ({ collected, size = 140 }: Props) => {
	const clamped = Math.max(0, Math.min(MAX_PIZZA_SLICES, collected))
	const isComplete = clamped >= MAX_PIZZA_SLICES

	return (
		<div className="flex flex-col items-center gap-2">
			<div className="relative" style={{ width: size, height: size }}>
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
			</div>
			<span className="text-sm font-bold text-[#F2F7FB]">
				{clamped}/{MAX_PIZZA_SLICES} {isComplete ? '🍕 Пицца готова к заказу!' : 'кусочков пиццы'}
			</span>
		</div>
	)
}
