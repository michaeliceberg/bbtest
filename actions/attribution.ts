'use server';

// actions/attribution.ts — вызовы из components/attribution-catcher.tsx.

import { and, eq } from 'drizzle-orm';
import db from '@/db/drizzle';
import { visitorEvents } from '@/db/schema';
import { auth } from '@/lib/auth';
import { cleanTouch, logVisitorEvent, readAttribution, type Touch } from '@/lib/attribution';
import { getTLessonPublic } from '@/db/queries';
import { isGuestOpenLesson } from '@/lib/guestLessons';

// isNew — браузер только что получил ggVid; touch — касание из ЭТОГО захода (utm/ref/referrer).
export async function recordVisit(isNew: boolean, rawTouch: Partial<Record<keyof Touch, unknown>> | null, path: string) {
	const { visitorId } = readAttribution();
	if (!visitorId) return;
	const touch = cleanTouch(rawTouch);
	if (!isNew && !touch) return;
	const session = await auth().catch(() => null);
	await logVisitorEvent(visitorId, 'visit', { userId: session?.user?.id ?? null, path, touch });
}

// Гость открыл пробный урок — один раз на браузер и урок.
export async function recordTrialStart(path: string) {
	const m = path.match(/^\/t-lesson\/(\d+)/);
	if (!m) return;
	const { visitorId, touch } = readAttribution();
	if (!visitorId) return;
	if (!isGuestOpenLesson(await getTLessonPublic(Number(m[1])).catch(() => null))) return;
	const session = await auth().catch(() => null);
	if (session?.user?.id) return;
	const lessonPath = `/t-lesson/${m[1]}`;
	const exists = await db.query.visitorEvents.findFirst({
		where: and(eq(visitorEvents.visitorId, visitorId), eq(visitorEvents.event, 'trial_start'), eq(visitorEvents.path, lessonPath)),
	});
	if (exists) return;
	await logVisitorEvent(visitorId, 'trial_start', { path: lessonPath, touch });
}
