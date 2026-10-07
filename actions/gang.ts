'use server';

// actions/gang.ts
//
// Банды (Фаза 3, MVP-срез, 2026-09-29). Приглашение НЕ здесь — оно
// переиспользует реферальную ссылку/cookie Фазы 2 (lib/referral.ts,
// actions/user-progress.ts's upsertUserProgress) — эти экшены отвечают
// только за саму банду (создание/роли/выход), не за механику вступления.

import { eq, and, ne } from 'drizzle-orm';
import { unlockAchievements } from '@/lib/achievements';
import db from '@/db/drizzle';
import { gangs, gangMembers } from '@/db/schema';
import { auth } from '@/lib/auth';
import { getGangMembership } from '@/db/queries';
import { revalidatePath } from 'next/cache';

import { DEFAULT_GANG_COLOR, GANG_COLORS, isValidEmblem } from '@/lib/gangEmblems';

const GANG_NAME_MAX_LENGTH = 30;

export async function createGang(name: string, emoji: string, color?: string) {
	const session = await auth();
	if (!session?.user?.id) throw new Error('Вы не авторизованы!');
	const userId = session.user.id;

	const trimmedName = name.trim().slice(0, GANG_NAME_MAX_LENGTH);
	if (!trimmedName) throw new Error('Введите название банды');

	// Гвард "ещё не в банде" — UNIQUE на gang_members.user_id и так не даст
	// вступить дважды (insert упадёт), но явная проверка даёт понятную
	// ошибку вместо голого constraint violation.
	const existing = await getGangMembership(userId);
	if (existing) throw new Error('Вы уже состоите в банде');

	const [gang] = await db.insert(gangs).values({
		name: trimmedName,
		emoji: isValidEmblem(emoji) ? emoji : '🔥',
		color: color && (GANG_COLORS as readonly string[]).includes(color) ? color : DEFAULT_GANG_COLOR,
		creatorUserId: userId,
	}).returning({ id: gangs.id });

	await db.insert(gangMembers).values({
		gangId: gang.id,
		userId,
		role: 'leader',
	});

	revalidatePath('/gang');
	revalidatePath('/gangs');

	await unlockAchievements(userId, ['gang_create'], { seen: false }).catch(() => {});
	return { gangId: gang.id };
}

// Только глава банды может звать — назначить/снять капо. Нельзя менять
// роль самого себя (глава всегда 'leader', отдельного экшена смены
// лидерства в MVP нет).
export async function setGangMemberRole(gangId: number, memberUserId: string, role: 'kapo' | 'member') {
	const session = await auth();
	if (!session?.user?.id) throw new Error('Вы не авторизованы!');
	const callerId = session.user.id;

	if (memberUserId === callerId) throw new Error('Нельзя менять свою собственную роль');

	const caller = await getGangMembership(callerId);
	if (!caller || caller.gangId !== gangId || caller.role !== 'leader') {
		throw new Error('Только глава банды может это сделать');
	}

	await db.update(gangMembers)
		.set({ role })
		.where(and(eq(gangMembers.gangId, gangId), eq(gangMembers.userId, memberUserId), ne(gangMembers.role, 'leader')));

	revalidatePath('/gang');
	revalidatePath('/gangs');
}

// Только глава, нельзя выгнать самого себя.
export async function kickGangMember(gangId: number, memberUserId: string) {
	const session = await auth();
	if (!session?.user?.id) throw new Error('Вы не авторизованы!');
	const callerId = session.user.id;

	if (memberUserId === callerId) throw new Error('Нельзя выгнать самого себя');

	const caller = await getGangMembership(callerId);
	if (!caller || caller.gangId !== gangId || caller.role !== 'leader') {
		throw new Error('Только глава банды может это сделать');
	}

	await db.delete(gangMembers).where(and(eq(gangMembers.gangId, gangId), eq(gangMembers.userId, memberUserId)));

	revalidatePath('/gang');
	revalidatePath('/gangs');
}

// Любой НЕ-глава может выйти сам. Глава в MVP выйти не может (нет
// передачи лидерства/удаления банды) — кнопка ему просто не показывается
// на клиенте, но и на сервере дублируем проверку на всякий случай.
export async function leaveGang() {
	const session = await auth();
	if (!session?.user?.id) throw new Error('Вы не авторизованы!');
	const userId = session.user.id;

	const membership = await getGangMembership(userId);
	if (!membership) throw new Error('Вы не состоите в банде');
	if (membership.role === 'leader') throw new Error('Глава банды не может выйти — сначала распустите банду');

	await db.delete(gangMembers).where(eq(gangMembers.userId, userId));

	revalidatePath('/gang');
	revalidatePath('/gangs');
	revalidatePath('/account');
}
