'use client';

// components/referral-catcher.tsx
//
// Смонтирован БЕЗУСЛОВНО в app/(marketing)/layout.tsx (покрывает `/` и
// `/test`) — самодостаточный "fire and forget", как GuestRewardClaimer
// (Фаза 1). Если в URL нет ?ref=, ничего не делает. Ловит переход по
// реферальной ссылке (lib/referral.ts, components/referral-card.tsx) и
// ставит cookie ДО регистрации — сама атрибуция происходит позже, при
// первом создании userProgress (actions/user-progress.ts).

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { setReferralCookie } from '@/actions/referral';

export const ReferralCatcher = () => {
	const searchParams = useSearchParams();
	const firedRef = useRef(false);

	useEffect(() => {
		if (firedRef.current) return;
		const ref = searchParams.get('ref');
		if (!ref) return;
		firedRef.current = true;
		setReferralCookie(ref);
	}, [searchParams]);

	return null;
};
