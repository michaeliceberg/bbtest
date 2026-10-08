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
import { Dices } from 'lucide-react';
import { VIBES, VIBE_CATEGORIES, VIBE_MIN, VIBE_MAX, buildNicknameFromVibes } from '@/lib/vibes';

export const GUEST_VIBES_STORAGE_KEY = 'guestVibes';
export const GUEST_NICKNAME_STORAGE_KEY = 'guestVibeNickname';

type Props = {
	onDone: (nickname: string, vibes: string[]) => void;
	// Подзаголовок под "Что тебе заходит?" (после кейса — про выбитый приз).
	subtitle?: string;
};

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
			<div className="w-full max-w-xl mx-auto min-h-[100dvh] flex flex-col items-center justify-center gap-6 px-4 py-8 text-center">
				<div className="flex gap-2 text-3xl">
					{chosen.map((v) =>
						v.image ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img key={v.id} src={v.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
						) : (
							<span key={v.id}>{v.emoji}</span>
						),
					)}
				</div>
				<p className="text-[#9AA7B0]">Твой позывной:</p>
				<motion.p
					key={rollKey}
					initial={{ scale: 3, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ type: 'spring', bounce: 0.55, duration: 0.6 }}
					className="text-3xl sm:text-4xl font-extrabold text-violet-300 leading-tight"
				>
					{nickname}
				</motion.p>
				<div className="w-full flex flex-col gap-3 mt-4">
					<button
						type="button"
						onClick={finish}
						className="w-full h-14 rounded-2xl bg-green-500 text-white font-extrabold text-lg uppercase tracking-wide border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition"
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
		);
	}

	// Шаг 1 — плитки.
	const canGo = selected.length >= VIBE_MIN;
	return (
		<div className="w-full max-w-xl mx-auto flex flex-col gap-5 px-4 pt-6 pb-32">
			<div className="text-center">
				<h1 className="text-2xl sm:text-3xl font-extrabold text-[#F2F7FB]">Что тебе заходит? 😎</h1>
				{subtitle && <p className="text-yellow-300 font-bold mt-2">{subtitle}</p>}
				<p className="text-[#9AA7B0] mt-1">Выбери минимум {VIBE_MIN} — чем больше, тем круче</p>
			</div>

			{VIBE_CATEGORIES.map((cat) => (
				<div key={cat.id}>
					<p className="text-xs font-bold uppercase tracking-wider text-[#9AA7B0] mb-2">{cat.title}</p>
					<div className="grid grid-cols-3 gap-2">
						{VIBES.filter((v) => v.category === cat.id).map((v) => {
							const on = selected.includes(v.id);
							const full = !on && selected.length >= VIBE_MAX;
							return (
								<motion.button
									key={v.id}
									type="button"
									onClick={() => toggle(v.id)}
									whileTap={{ scale: 0.92 }}
									animate={{ scale: on ? 1.04 : 1 }}
									transition={{ type: 'spring', bounce: 0.5, duration: 0.3 }}
									className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-b-4 py-3 px-1 transition-colors ${
										on
											? 'bg-violet-500/20 border-violet-400 text-[#F2F7FB]'
											: 'bg-[#151F23] border-[#3A464E] text-[#C7D0D6]'
									} ${full ? 'opacity-40' : ''}`}
								>
									{v.image ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img src={v.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
									) : (
										<span className="text-3xl leading-none">{v.emoji}</span>
									)}
									<span className="text-xs sm:text-sm font-bold leading-tight text-center">{v.label}</span>
								</motion.button>
							);
						})}
					</div>
				</div>
			))}

			<div className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[#131D22] via-[#131D22] to-transparent pt-6 pb-4 px-4">
				<div className="max-w-xl mx-auto">
					<button
						type="button"
						disabled={!canGo}
						onClick={roll}
						className={`w-full h-14 rounded-2xl font-extrabold text-lg uppercase tracking-wide border-b-4 transition ${
							canGo
								? 'bg-violet-500 border-violet-700 text-white active:border-b-0 active:translate-y-1'
								: 'bg-[#232F34] border-[#1A2327] text-[#6B7A83]'
						}`}
					>
						{canGo ? 'Придумать позывной' : `Выбери ещё ${VIBE_MIN - selected.length}`} ({selected.length})
					</button>
				</div>
			</div>
		</div>
	);
};
