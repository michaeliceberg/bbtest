'use client';

// components/guest-reward-screen.tsx
//
// Финальный экран урока для АНОНИМНОГО гостя (PUBLIC_TRIAL_T_LESSON_ID,
// см. app/t-lesson/[t_lessonId]/page.tsx) — рендерится в TQUIZ.tsx вместо
// TrainerQuestRewardsScreen, когда isGuest. Кейс открывается и показывает
// приз СРАЗУ (никакого Telegram/логин-гейта до этого момента, в отличие
// от app/test/[subject]/diagnostic-client.tsx) — регистрация предлагается
// уже ПОСЛЕ показа приза, чтобы его "забрать" (эффект неприятия потери).

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CaseReel } from '@/components/CaseReel';
import { shareInviteLink } from '@/components/share-story-button';
import { getInviteLink } from '@/lib/referral';
import { createGuestLead, openGuestLeadCase, updateGuestLeadVibes } from '@/actions/guest-lesson';
import { GuestVibePicker, GUEST_NICKNAME_STORAGE_KEY } from '@/components/guest-vibe-picker';
import { DIAGNOSTIC_CASE_POOL, rewardEmoji, rewardLabel, type CaseReward } from '@/lib/caseRewards';
import type { UiTheme } from '@/lib/cozyTheme';

const LoginDialog = dynamic(() => import('@/components/login-dialog').then((m) => ({ default: m.LoginDialog })), { ssr: false });

type Props = {
	t_lessonId: number;
	nickname: string;
	// id плиток экрана "Что тебе заходит?" (lib/vibes.ts) — пишем в лид для статистики.
	vibes?: string[];
	theme: UiTheme;
};

export const GuestRewardScreen = ({ t_lessonId, nickname: initialNickname, vibes, theme }: Props) => {
	const [nickname, setNickname] = useState(initialNickname);
	// После приза — экран "Что тебе заходит?" (позывной из увлечений), если
	// гость его ещё не проходил (позывной уже сохранён в localStorage).
	const [vibeStage, setVibeStage] = useState<'pending' | 'picker' | 'done'>('pending');
	const [leadId, setLeadId] = useState<number | null>(null);
	const [wonReward, setWonReward] = useState<CaseReward | null>(null);
	const [loginOpen, setLoginOpen] = useState(false);
	const createdRef = useRef(false)

	// Лид создаётся один раз на маунте (не по клику) — та же причина, что
	// у startDiagnosticTelegramLead: к моменту клика по "Крутить" он уже
	// должен существовать. createdRef (а не [t_lessonId, nickname] в
	// зависимостях) — защита от повторного создания ВТОРОГО лида (и
	// перезаписи cookie guestLeadId поверх уже открытого первого), если
	// компонент почему-то перерендерится с другим nickname уже после
	// маунта (React Strict Mode в dev — двойной вызов эффекта на той же
	// инстанции — тот же класс защиты, что уже применяется в проекте для
	// подобных "создать один раз" эффектов).
	useEffect(() => {
		if (createdRef.current) return
		createdRef.current = true
		createGuestLead(t_lessonId, nickname, vibes ?? []).then(({ leadId }) => setLeadId(leadId));
	}, [t_lessonId, nickname, vibes]);

	const onCaseDone = (reward: CaseReward) => {
		setWonReward(reward);
		let picked = false;
		try { picked = !!localStorage.getItem(GUEST_NICKNAME_STORAGE_KEY); } catch { /* нет доступа — покажем выбор */ }
		setVibeStage(picked ? 'done' : 'picker');
	};

	if (wonReward && vibeStage === 'picker') {
		return (
			<GuestVibePicker
				subtitle={`Приз твой: ${rewardEmoji(wonReward)} ${rewardLabel(wonReward)}! Теперь придумаем тебе позывной`}
				onDone={(nick, picked) => {
					setNickname(nick);
					setVibeStage('done');
					updateGuestLeadVibes(nick, picked).catch(() => null);
				}}
			/>
		);
	}

	return (
		<div className="w-full max-w-xl mx-auto flex flex-col items-center gap-4 py-6 px-2">
			<div className="text-center">
				<p className="text-sm text-[#9AA7B0] mb-1">Урок пройден!</p>
				<p className="text-2xl font-extrabold">{nickname} 🎉</p>
			</div>

			{leadId != null && !wonReward && (
				<div className="w-full rounded-xl border-2 border-violet-400/40 bg-[#151F23]">
					<CaseReel
						theme={theme}
						isMega={false}
						pool={DIAGNOSTIC_CASE_POOL}
						title="Твой приз"
						spinAction={() => openGuestLeadCase(leadId)}
						onDone={({ reward }) => onCaseDone(reward)}
					/>
				</div>
			)}

			{wonReward && (
				<>
					<div className="w-full rounded-xl border-2 border-violet-400/40 bg-violet-400/10 p-3 text-center">
						<p className="text-xs text-[#9AA7B0] mb-1">Твой приз</p>
						<p className="text-2xl font-extrabold tracking-wide text-violet-300">
							{rewardEmoji(wonReward)} {rewardLabel(wonReward)}
						</p>
					</div>

					<button
						type="button"
						onClick={() => shareInviteLink(
							`🍕 ЗАРАБОТАЙ НАМ ПИЦЦУ!\n\n😎 ${nickname}\n⚡ Выбил ${rewardEmoji(wonReward)} ${rewardLabel(wonReward)} за урок физики\n\n👇 Пройди урок по ссылке — регистрация не нужна.\n\nСлабо выбить круче? 😏`,
							getInviteLink(null),
						)}
						className="w-full h-12 rounded-2xl bg-[#232F34] text-[#F2F7FB] font-bold border-2 border-b-4 border-[#3A464E] active:border-b-2"
					>
						🍕 Позвать друга
					</button>

					<div className="w-full rounded-xl border-2 border-sky-500/50 bg-sky-500/10 p-3">
						<p className="text-xs text-[#9AA7B0] mb-2">Чтобы забрать приз и открыть остальные уроки — зарегистрируйся:</p>
						<Button
							variant="primary"
							size="lg"
							className="w-full flex items-center justify-center gap-2"
							onClick={() => setLoginOpen(true)}
						>
							Зарегистрироваться и забрать приз
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</>
			)}

			<LoginDialog open={loginOpen} onOpenChange={setLoginOpen} callbackUrl="/trainer?claimReward=1" />
		</div>
	);
};
