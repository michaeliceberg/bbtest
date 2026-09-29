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
		if (searchParams.get('claimReward') !== '1') return;
		firedRef.current = true;

		claimGuestLeadReward().then((result) => {
			if (result.success) {
				toast.success(`${rewardEmoji(result.reward)} Зачислено: ${rewardLabel(result.reward)}`);
			}
			router.replace('/trainer');
		});
	}, [searchParams, router]);

	return null;
};
