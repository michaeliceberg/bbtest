'use client'

// components/referral-screens.tsx
//
// Экраны реферальной пиццы (2026-10-01, lib/referralRewards.ts):
// • ReferralWelcome — гость пришёл по приглашению в пробный урок: «Пройди 3 урока
//   электродинамики — получишь кусочек пиццы» (рисуем 1 из 8);
// • ReferralGiftScreen — приглашённый прошёл 3-й урок: «Красавчик, <позывной>!»;
// • ReferralCashbackScreen — пригласившему (и выше по ветке): «Тебе кэшбэк от …».

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CelebrationShell } from '@/components/celebration-shell'
import { markCashbackSeen } from '@/actions/referral'
import { MAX_PIZZA_SLICES } from '@/lib/caseRewards'
import { COZY, type UiTheme } from '@/lib/cozyTheme'

const LUCKY_COLOR = '#FBBF24'

// Пицца из 8 кусочков: первые `collected` — цветные, остальные серые;
// `highlight` последних из собранных пружинно «прилетают».
export const PizzaPie = ({ collected, highlight = 0, size = 150 }: { collected: number; highlight?: number; size?: number }) => (
	<div className="relative shrink-0" style={{ width: size, height: size }}>
		{Array.from({ length: MAX_PIZZA_SLICES }, (_, i) => {
			const n = i + 1
			const on = n <= collected
			const isNew = on && n > collected - highlight
			return (
				// eslint-disable-next-line @next/next/no-img-element
				<motion.img
					key={n}
					src={`/pizzaSVG/pizza_8_${n}.svg`}
					alt=""
					className="absolute inset-0 w-full h-full"
					initial={isNew ? { scale: 2.2, opacity: 0 } : false}
					animate={{ scale: 1, opacity: on ? 1 : 0.7 }}
					transition={isNew ? { type: 'spring', bounce: 0.5, delay: 0.5 + (n - (collected - highlight)) * 0.25 } : undefined}
					style={{ filter: on ? 'none' : 'grayscale(1) brightness(0.45)' }}
				/>
			)
		})}
	</div>
)

export const ReferralWelcome = ({ inviterNickname }: { inviterNickname: string | null }) => {
	const [open, setOpen] = useState(true)
	if (!open) return null
	return (
		<div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-5 bg-[#131D22]/95 px-6 text-center text-[#F2F7FB]">
			{inviterNickname && (
				<p className="text-base text-[#9AA7B0]">
					Тебя позвал <span className="font-extrabold text-yellow-300">{inviterNickname}</span> 🤝
				</p>
			)}
			<h1 className="text-2xl sm:text-3xl font-black leading-tight">
				Пройди 3 урока Электродинамики ЕГЭ —<br />и получишь кусочек пиццы 🍕
			</h1>
			<PizzaPie collected={1} highlight={1} size={170} />
			<p className="text-lg font-bold">
				Собери все 8 кусочков —<br />получи промокод в <span className="text-[#FF8A00]">Додо Пиццу</span>
			</p>
			<button
				type="button"
				onClick={() => setOpen(false)}
				className="mt-2 w-full max-w-sm rounded-2xl py-4 font-black text-lg uppercase tracking-wider text-[#0E1519]"
				style={{ background: '#78C93C', boxShadow: '0 5px 0 #4E8A33' }}
			>
				Погнали! 🚀
			</button>
		</div>
	)
}

type Gift = { slices: number; lucky: boolean; nickname: string; pizzaNow: number }

export const ReferralGiftScreen = ({ gift, theme = 'metal', onNext }: { gift: Gift; theme?: UiTheme; onNext: () => void }) => {
	const cozy = theme === 'cozy'
	const left = Math.max(0, MAX_PIZZA_SLICES - gift.pizzaNow)
	return (
		<CelebrationShell theme={theme} accent={gift.lucky ? LUCKY_COLOR : '#78C93C'} starsTier={gift.lucky ? 'mega' : 'rare'} confetti buttonLabel="Дальше" onButton={onNext}>
			<motion.h1
				initial={{ scale: 0.4, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ type: 'spring', bounce: 0.5 }}
				className="text-3xl sm:text-4xl font-black leading-tight"
				style={{ color: cozy ? COZY.title : '#F2F7FB' }}
			>
				Красавчик, <span className="text-yellow-300">{gift.nickname}</span>!
			</motion.h1>
			{gift.lucky && (
				<motion.p
					initial={{ scale: 3, opacity: 0, rotate: -8 }}
					animate={{ scale: 1, opacity: 1, rotate: -4 }}
					transition={{ type: 'spring', bounce: 0.6, delay: 0.4 }}
					className="mt-3 rounded-xl px-4 py-1 text-xl font-black uppercase"
					style={{ background: LUCKY_COLOR, color: '#3A2400', boxShadow: `0 0 24px ${LUCKY_COLOR}` }}
				>
					Фига ты счастливчик! ×2
				</motion.p>
			)}
			<p className="mt-4 text-xl font-bold">
				Вот и обещанн{gift.slices > 1 ? 'ые 2 кусочка' : 'ый кусочек'}! 🍕
			</p>
			<div className="my-5">
				<PizzaPie collected={gift.pizzaNow} highlight={gift.slices} size={180} />
			</div>
			<p className="text-lg font-bold">
				{left > 0 ? <>Осталось {left}. Не останавливайся! 🔥</> : <>Пицца собрана! Промокод — в тренажёре 🎉</>}
			</p>
		</CelebrationShell>
	)
}

export type CashbackItem = { id: number; level: number; eighths: number; nickname: string }

const amountLabel = (e: number) =>
	e >= 8 ? `${e / 8 === 1 ? '1 кусочек' : `${e / 8} кусочка`}` : e === 4 ? '½ кусочка' : e === 2 ? '¼ кусочка' : `${e}/8 кусочка`

export const ReferralCashbackScreen = ({ items, theme = 'metal' }: { items: CashbackItem[]; theme?: UiTheme }) => {
	const [open, setOpen] = useState(items.length > 0)
	if (!open) return null
	const close = () => {
		setOpen(false)
		markCashbackSeen(items.map((i) => i.id)).catch(() => null)
	}
	const first = items[0]
	return (
		<CelebrationShell theme={theme} accent="#FBBF24" starsTier="mythic" confetti overlay buttonLabel="Забрать 🍕" onButton={close}>
			<motion.h1
				initial={{ scale: 0.4, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ type: 'spring', bounce: 0.5 }}
				className="text-3xl sm:text-4xl font-black leading-tight"
			>
				Тебе кэшбэк{items.length === 1 ? <> от <span className="text-yellow-300">{first.nickname}</span></> : null}! 💸
			</motion.h1>
			<div className="my-6 text-7xl">🍕</div>
			<ul className="w-full max-w-sm space-y-2">
				{items.map((it) => (
					<li key={it.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2 text-left">
						<span>
							<span className="font-bold">{it.nickname}</span>
							{it.level > 1 && <span className="block text-xs text-[#9AA7B0]">друг твоего друга</span>}
						</span>
						<span className="font-black text-yellow-300">+{amountLabel(it.eighths)}</span>
					</li>
				))}
			</ul>
			<p className="mt-5 text-base text-[#C9D3D9]">Твой друг прошёл 3 урока Электродинамики — пицца твоя. Зови ещё! 🤝</p>
		</CelebrationShell>
	)
}
