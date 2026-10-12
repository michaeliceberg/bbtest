'use client';

// components/attribution-catcher.tsx — смонтирован в app/layout.tsx на всех страницах.
// Даёт браузеру id (cookie ggVid), запоминает первое рекламное касание (cookie ggUtm) и
// пишет события в visitor_events. Подробности — lib/attribution.ts.

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { recordTrialStart, recordVisit } from '@/actions/attribution';

const VID = 'ggVid';
const UTM = 'ggUtm';
const OWN_HOSTS = ['ggege.ru', 'www.ggege.ru', 'localhost'];

const getCookie = (name: string) =>
	document.cookie.split('; ').find((c) => c.startsWith(name + '='))?.slice(name.length + 1) ?? null;
const setCookie = (name: string, value: string, days: number) => {
	document.cookie = `${name}=${value}; max-age=${days * 86400}; path=/; samesite=lax`;
};

const newId = () =>
	typeof crypto !== 'undefined' && 'randomUUID' in crypto
		? crypto.randomUUID()
		: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const currentTouch = () => {
	const p = new URLSearchParams(window.location.search);
	const landing = window.location.pathname;
	let refHost: string | null = null;
	try { refHost = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : null; } catch { refHost = null; }
	if (refHost && OWN_HOSTS.includes(refHost)) refHost = null;
	const base = { content: p.get('utm_content'), landing, referrer: refHost };
	if (p.get('utm_source')) {
		return { ...base, source: p.get('utm_source'), medium: p.get('utm_medium'), campaign: p.get('utm_campaign') };
	}
	if (p.get('ref')) return { ...base, source: 'invite', medium: 'friend', campaign: null };
	if (refHost) return { ...base, source: refHost, medium: 'referral', campaign: null };
	return null;
};

export const AttributionCatcher = () => {
	const pathname = usePathname();
	const doneRef = useRef(false);

	useEffect(() => {
		if (doneRef.current) return;
		doneRef.current = true;
		let isNew = false;
		if (!getCookie(VID)) {
			setCookie(VID, newId(), 730);
			isNew = true;
		}
		const touch = currentTouch();
		if (touch && !getCookie(UTM)) setCookie(UTM, encodeURIComponent(JSON.stringify(touch)), 90);
		if (isNew || touch) recordVisit(isNew, touch, window.location.pathname).catch(() => {});
	}, []);

	useEffect(() => {
		if (pathname?.startsWith('/t-lesson/')) {
			// Небольшая задержка — чтобы первый эффект успел поставить ggVid.
			const t = setTimeout(() => recordTrialStart(pathname).catch(() => {}), 300);
			return () => clearTimeout(t);
		}
	}, [pathname]);

	return null;
};
