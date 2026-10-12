// lib/attribution.ts
//
// Откуда пришёл посетитель и связь «гость → аккаунт».
// - cookie `ggVid` — id браузера (ставит components/attribution-catcher.tsx, 2 года);
// - cookie `ggUtm` — первое «рекламное» касание: utm-метки, иначе ?ref= (source=invite),
//   иначе внешний referrer (source=домен, medium=referral). Ставится один раз, 90 дней.
// Пишется в visitor_events, в лиды (guest_lesson_leads, diagnostic_leads) и при регистрации
// в user_progress. Сводка по кампаниям — /admin/funnel.

import 'server-only';
import { cookies } from 'next/headers';
import { and, eq, isNull } from 'drizzle-orm';
import db from '@/db/drizzle';
import { diagnosticLeads, visitorEvents } from '@/db/schema';

export const VISITOR_COOKIE = 'ggVid';
export const UTM_COOKIE = 'ggUtm';

export type Touch = {
	source: string | null;
	medium: string | null;
	campaign: string | null;
	content: string | null;
	landing: string | null;
	referrer: string | null;
};

const clip = (v: unknown, max = 120): string | null => {
	if (typeof v !== 'string') return null;
	const s = v.trim().slice(0, max);
	return s || null;
};

export const cleanTouch = (raw: Partial<Record<keyof Touch, unknown>> | null | undefined): Touch | null => {
	if (!raw) return null;
	const t: Touch = {
		source: clip(raw.source)?.toLowerCase() ?? null,
		medium: clip(raw.medium)?.toLowerCase() ?? null,
		campaign: clip(raw.campaign),
		content: clip(raw.content),
		landing: clip(raw.landing, 200),
		referrer: clip(raw.referrer),
	};
	return t.source ? t : null;
};

export const readAttribution = (): { visitorId: string | null; touch: Touch | null } => {
	const jar = cookies();
	const visitorId = clip(jar.get(VISITOR_COOKIE)?.value, 64);
	let touch: Touch | null = null;
	const raw = jar.get(UTM_COOKIE)?.value;
	if (raw) {
		try { touch = cleanTouch(JSON.parse(decodeURIComponent(raw))); } catch { touch = null; }
	}
	return { visitorId, touch };
};

export const logVisitorEvent = async (
	visitorId: string, event: string, opts: { userId?: string | null; path?: string | null; touch?: Touch | null } = {},
) => {
	const t = opts.touch;
	await db.insert(visitorEvents).values({
		visitorId,
		userId: opts.userId ?? null,
		event,
		path: clip(opts.path, 200),
		utmSource: t?.source ?? null,
		utmMedium: t?.medium ?? null,
		utmCampaign: t?.campaign ?? null,
		utmContent: t?.content ?? null,
		referrer: t?.referrer ?? null,
	});
};

// При регистрации: всё, что этот браузер делал гостем, теперь принадлежит ученику.
export const linkVisitorToUser = async (visitorId: string | null, userId: string) => {
	if (!visitorId) return;
	await db.update(visitorEvents).set({ userId })
		.where(and(eq(visitorEvents.visitorId, visitorId), isNull(visitorEvents.userId)));
	await db.update(diagnosticLeads).set({ userId })
		.where(and(eq(diagnosticLeads.visitorId, visitorId), isNull(diagnosticLeads.userId)));
};
