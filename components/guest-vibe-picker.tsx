'use client';

// components/guest-vibe-picker.tsx
//
// Экран "Что тебе заходит?" после открытия кейса пробного урока гостя
// (components/guest-reward-screen.tsx; раньше был перед уроком): 3-5 плиток (игры, музыка, гаджеты, еда, спорт, увлечения) →
// позывной из выбора (lib/vibes.ts) с кнопкой "Ещё вариант" → урок.
// Выбор и позывной сохраняются в localStorage — при повторном заходе
// экран не показывается второй раз; выбор уходит в guest_lesson_leads.vibes.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Dices } from 'lucide-react';
import { CaseStars } from '@/components/CaseReel';
import { VIBES, VIBE_CATEGORIES, VIBE_MIN, VIBE_MAX, buildNicknameFromVibes } from '@/lib/vibes';

export const GUEST_VIBES_STORAGE_KEY = 'guestVibes';
export const GUEST_NICKNAME_STORAGE_KEY = 'guestVibeNickname';

type Props = {
	onDone: (nickname: string, vibes: string[]) => void;
	// Подзаголовок под "Что тебе заходит?" (после кейса — про выбитый приз).
	subtitle?: string;
};

const ACCENT = '#A78BFA';
const ACCENT_2 = '#E879F9';

// Премиальный фон как на экранах кейсов/уровня: тёмная база, свечение акцента сверху,
// взлетающие звёзды и виньетка. Только статичные слои + transform/opacity внутри CaseStars.
const Backdrop = () => (
	<div className="pointer-events-none fixed inset-0 z-0" style={{ backgroundColor: '#101820' }}>
		<div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 0%, ${ACCENT}55, transparent 55%), radial-gradient(ellipse at 15% 60%, ${ACCENT_2}22, transparent 50%), radial-gradient(ellipse at 90% 85%, #38BDF822, transparent 45%)` }} />
		<div className="absolute inset-0 opacity-60"><CaseStars tier="mythic" /></div>
		<div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(0,0,0,0.65) 100%)' }} />
	</div>
);

export const GuestVibePicker = ({ onDone, subtitle }: Props) => {
	const [selected, setSelected] = useState<string[]>([]);
	const [nickname, setNickname] = useState<string | null>(null);
	const [rollKey, setRollKey] = useState(0);

	const toggle = (id: string) => {
		setSelected((prev) => {
			if (prev.includes(id)) return prev.filter((x) => x !== id);
			if (prev.length >= VIBE_MAX) return prev;
			return [...prev, id];
		});
	};

	const roll = () => {
		setNickname(buildNicknameFromVibes(selected));
		setRollKey((k) => k + 1);
	};

	const finish = () => {
		if (!nickname) return;
		try {
			localStorage.setItem(GUEST_VIBES_STORAGE_KEY, selected.join(','));
			localStorage.setItem(GUEST_NICKNAME_STORAGE_KEY, nickname);
		} catch { /* приватный режим — просто не запоминаем */ }
		onDone(nickname, selected);
	};

	// Шаг 2 — позывной.
	if (nickname) {
		const chosen = VIBES.filter((v) => selected.includes(v.id));
		return (
			<div className="relative w-full min-h-[100dvh]">
				<Backdrop />
				<div className="relative z-10 w-full max-w-xl mx-auto min-h-[100dvh] flex flex-col items-center justify-center gap-6 px-4 py-8 text-center">
					<div className="flex flex-wrap justify-center gap-2">
						{chosen.slice(0, 8).map((v) => (
							<div key={v.id} className="rounded-xl p-[2px]" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_2})` }}>
								{v.image ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={v.image} alt="" className="h-11 w-11 rounded-[10px] object-cover" />
								) : (
									<span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#151F23] text-2xl">{v.emoji}</span>
								)}
							</div>
						))}
					</div>
					<p className="text-xs font-extrabold uppercase tracking-[0.25em]" style={{ color: ACCENT }}>GG · Твой позывной</p>
					<div className="relative w-full rounded-3xl p-[2px] shadow-[0_18px_48px_rgba(0,0,0,0.55)]" style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #2A363C 45%, ${ACCENT_2} 100%)` }}>
						<span aria-hidden className="animate-glow-pulse pointer-events-none absolute inset-0 rounded-3xl" style={{ boxShadow: `0 0 36px ${ACCENT}88` }} />
						<div className="relative rounded-[22px] bg-gradient-to-b from-[#1C282E] to-[#0C1215] px-5 py-8">
							<motion.p
								key={rollKey}
								initial={{ scale: 3, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								transition={{ type: 'spring', bounce: 0.55, duration: 0.6 }}
								className="bg-gradient-to-r from-violet-200 via-white to-fuchsia-200 bg-clip-text text-3xl sm:text-4xl font-black leading-tight text-transparent"
							>
								{nickname}
							</motion.p>
						</div>
					</div>
					<div className="w-full flex flex-col gap-3 mt-2">
						<button
							type="button"
							onClick={finish}
							className="w-full h-14 rounded-2xl bg-green-500 text-white font-extrabold text-lg uppercase tracking-wide border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition shadow-[0_8px_24px_rgba(52,211,153,0.35)]"
						>
							Погнали!
						</button>
						<button
							type="button"
							onClick={roll}
							className="w-full h-12 rounded-2xl bg-[#232F34] text-[#F2F7FB] font-bold border-2 border-b-4 border-[#3A464E] active:border-b-2 flex items-center justify-center gap-2"
						>
							<Dices className="h-5 w-5" />
							Ещё вариант
						</button>
						<button type="button" onClick={() => setNickname(null)} className="text-sm text-[#9AA7B0] underline">
							Выбрать заново
						</button>
					</div>
				</div>
			</div>
		);
	}

	// Шаг 1 — плитки.
	const canGo = selected.length >= VIBE_MIN;
	const progress = Math.min(1, selected.length / VIBE_MIN);
	return (
		<div className="relative w-full min-h-[100dvh]">
			<Backdrop />
			<div className="relative z-10 w-full max-w-xl mx-auto flex flex-col gap-6 px-4 pt-8 pb-40">
				<div className="text-center">
					<p className="text-xs font-extrabold uppercase tracking-[0.25em] mb-2" style={{ color: ACCENT }}>GG · Персонаж</p>
					<h1 className="text-3xl sm:text-4xl font-black"><span className="bg-gradient-to-r from-violet-200 via-white to-fuchsia-200 bg-clip-text text-transparent">Что тебе заходит?</span> 😎</h1>
					{subtitle && (
						<p className="mx-auto mt-3 inline-block rounded-full border border-yellow-300/40 bg-yellow-300/10 px-4 py-1 text-sm font-bold text-yellow-300">{subtitle}</p>
					)}
					<p className="text-[#9AA7B0] mt-3">Выбери минимум {VIBE_MIN} — чем больше, тем круче</p>
				</div>

				{VIBE_CATEGORIES.map((cat) => (
					<div key={cat.id}>
						<div className="mb-3 flex items-center gap-3">
							<span className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}66)` }} />
							<p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#C9B8FF]">{cat.title}</p>
							<span className="h-px flex-1" style={{ background: `linear-gradient(270deg, transparent, ${ACCENT}66)` }} />
						</div>
						<div className="grid grid-cols-3 gap-2.5">
							{VIBES.filter((v) => v.category === cat.id).map((v) => {
								const on = selected.includes(v.id);
								const full = !on && selected.length >= VIBE_MAX;
								return (
									<motion.button
										key={v.id}
										type="button"
										onClick={() => toggle(v.id)}
										whileTap={{ scale: 0.92 }}
										animate={{ scale: on ? 1.05 : 1 }}
										transition={{ type: 'spring', bounce: 0.5, duration: 0.3 }}
										className={`relative rounded-2xl p-[2px] ${full ? 'opacity-40' : ''}`}
										style={{
											background: on ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT_2})` : 'linear-gradient(180deg, #34424A, #1E2A30)',
											boxShadow: on ? `0 0 18px -2px ${ACCENT}AA, 0 4px 0 #5B3FA8` : '0 4px 0 #11181C',
										}}
									>
										<span className={`flex flex-col items-center justify-center gap-1 rounded-[14px] py-3 px-1 ${on ? 'bg-gradient-to-b from-[#2A2150] to-[#171236]' : 'bg-gradient-to-b from-[#1B262C] to-[#121B20]'}`}>
											{v.image ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img src={v.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
											) : (
												<span className="text-3xl leading-none">{v.emoji}</span>
											)}
											<span className={`text-xs sm:text-sm font-bold leading-tight text-center ${on ? 'text-white' : 'text-[#C7D0D6]'}`}>{v.label}</span>
										</span>
										{on && (
											<span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-400 text-[#2A0A33] shadow-[0_0_10px_#E879F9]">
												<Check className="h-3.5 w-3.5" strokeWidth={4} />
											</span>
										)}
									</motion.button>
								);
							})}
						</div>
					</div>
				))}
			</div>

			<div className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[#101820] via-[#101820E6] to-transparent pt-8 pb-4 px-4">
				<div className="max-w-xl mx-auto">
					<div className="mb-2 flex items-center gap-2">
						<div className="h-2 flex-1 overflow-hidden rounded-full bg-[#232F34]">
							<motion.div
								className="h-full origin-left rounded-full"
								style={{ background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_2})`, width: '100%' }}
								animate={{ scaleX: progress }}
								transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
							/>
						</div>
						<span className="text-xs font-extrabold text-[#C9B8FF]">{selected.length}/{VIBE_MIN}</span>
					</div>
					<button
						type="button"
						disabled={!canGo}
						onClick={roll}
						className={`relative w-full h-14 rounded-2xl p-[2px] transition ${canGo ? 'shadow-[0_10px_28px_rgba(0,0,0,0.5)] active:translate-y-0.5' : 'opacity-70'}`}
						style={{ background: canGo ? `linear-gradient(180deg, ${ACCENT} 0%, #2A363C 55%, #141C20 100%)` : '#2A363C' }}
					>
						{canGo && <span aria-hidden className="animate-glow-pulse pointer-events-none absolute inset-0 rounded-2xl" style={{ boxShadow: `0 0 26px ${ACCENT}AA` }} />}
						<span
							className="relative flex h-full items-center justify-center rounded-[14px] bg-gradient-to-b from-[#1C282E] to-[#0C1215] font-black text-base sm:text-lg uppercase tracking-[0.1em]"
							style={{ color: canGo ? ACCENT : '#6B7A83', textShadow: canGo ? `0 0 12px ${ACCENT}99` : 'none' }}
						>
							{canGo ? 'Придумать позывной' : `Выбери ещё ${VIBE_MIN - selected.length}`}
						</span>
					</button>
				</div>
			</div>
		</div>
	);
};
