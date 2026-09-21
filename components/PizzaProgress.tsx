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

	const left = MAX_PIZZA_SLICES - clamped

	return (
		<div className="flex w-full items-center justify-center gap-4">
			<div className="relative shrink-0" style={{ width: size, height: size }}>
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
			<div className="flex flex-col gap-1.5 min-w-0">
				<span className="text-5xl font-black leading-none text-yellow-300">
					{clamped}/{MAX_PIZZA_SLICES}
				</span>
				<span className="flex items-end gap-2 text-base font-semibold text-[#C9D3D9] leading-snug">
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
