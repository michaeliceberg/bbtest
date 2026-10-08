'use client';

// components/guest-reward-claimer.tsx
//
// Смонтирован на /trainer (app/(main)/trainer/page.tsx) БЕЗУСЛОВНО, для
// всех пользователей — самодостаточный "fire and forget" кусок: если в
// URL нет ?claimReward=1, ничего не делает. Срабатывает ровно один раз
// сразу после регистрации по CTA гостевого урока (components/guest-
// reward-screen.tsx, LoginDialog callbackUrl='/trainer?claimReward=1') —
// переносит приз, показанный ДО регистрации, на только что созданный
// аккаунт (см. actions/guest-lesson.ts, claimGuestLeadReward).

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { claimGuestLeadReward } from '@/actions/guest-lesson';
import { rewardEmoji, rewardLabel } from '@/lib/caseRewards';

export const GuestRewardClaimer = () => {
	const searchParams = useSearchParams();
	const router = useRouter();
	const firedRef = useRef(false);

	useEffect(() => {
		if (firedRef.current) return;
		// Переносим и по ?claimReward=1 (вход с экрана приза), и если у гостя осталась метка:
		// человек мог зарегистрироваться потом другим путём.
		const pending = typeof document !== 'undefined' && document.cookie.includes('guestLeadPending=1');
		if (searchParams.get('claimReward') !== '1' && !pending) return;
		firedRef.current = true;

		claimGuestLeadReward().then((result) => {
			if (result.success) {
				toast.success(`${rewardEmoji(result.reward)} Зачислено: ${rewardLabel(result.reward)}`);
			}
			// Метку чистим и на клиенте — чтобы не дёргать сервер при каждом заходе.
			document.cookie = 'guestLeadPending=; Max-Age=0; path=/';
			router.refresh();
			if (searchParams.get('claimReward') === '1') router.replace('/trainer');
		});
	}, [searchParams, router]);

	return null;
};
