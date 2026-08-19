// lib/identity.ts
//
// Связка (provider, providerAccountId) -> canonical userId. Позволяет
// одному человеку заходить разными способами (VK/Telegram/звонок) и
// оставаться ОДНИМ аккаунтом, если способы явно привязаны друг к другу.

import db from '@/db/drizzle';
import { identities } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

export type Provider = 'vk' | 'telegram' | 'phone-call';

function generateCanonicalUserId(): string {
    return `u_${crypto.randomBytes(9).toString('base64url')}`;
}

/**
 * Возвращает canonical userId для данного способа входа. Если способ
 * входит впервые — создаёт новый canonical id (новый независимый аккаунт).
 */
export async function resolveCanonicalUserId(
    provider: Provider,
    providerAccountId: string
): Promise<{ userId: string; isNew: boolean }> {
    const existing = await db.query.identities.findFirst({
        where: and(eq(identities.provider, provider), eq(identities.providerAccountId, providerAccountId)),
    });

    if (existing) {
        return { userId: existing.userId, isNew: false };
    }

    const userId = generateCanonicalUserId();
    await db.insert(identities).values({ provider, providerAccountId, userId });
    return { userId, isNew: true };
}

export type LinkResult =
    | { status: 'linked' }
    | { status: 'already-linked' }
    | { status: 'conflict'; existingUserId: string };

/**
 * Привязывает способ входа к УЖЕ АВТОРИЗОВАННОМУ аккаунту targetUserId.
 * Если способ уже привязан к ДРУГОМУ аккаунту с реальными данными —
 * не сливаем автоматически, возвращаем conflict.
 */
export async function linkIdentity(
    provider: Provider,
    providerAccountId: string,
    targetUserId: string
): Promise<LinkResult> {
    const existing = await db.query.identities.findFirst({
        where: and(eq(identities.provider, provider), eq(identities.providerAccountId, providerAccountId)),
    });

    if (existing) {
        if (existing.userId === targetUserId) {
            return { status: 'already-linked' };
        }
        return { status: 'conflict', existingUserId: existing.userId };
    }

    await db.insert(identities).values({ provider, providerAccountId, userId: targetUserId });
    return { status: 'linked' };
}

export async function getLinkedProviders(userId: string): Promise<Provider[]> {
    const rows = await db.query.identities.findMany({
        where: eq(identities.userId, userId),
    });
    return rows.map((r) => r.provider as Provider);
}
