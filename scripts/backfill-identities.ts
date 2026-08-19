// scripts/backfill-identities.ts
//
// Одноразовая миграция: у существующих аккаунтов userProgress.userId уже
// содержит "сырой" id провайдера (VK-номер, phone:..., tg:...). Чтобы
// новая система привязки (identities) не считала их "новыми" людьми,
// заводим identities-запись, где userId = тот же самый существующий id —
// данные никуда не переносятся, просто "усыновляем" старые аккаунты.
//
// Безопасно запускать повторно (ON CONFLICT DO NOTHING).

import db from '@/db/drizzle';
import { userProgress, identities } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

function parseProvider(userId: string): { provider: string; providerAccountId: string } {
    if (userId.startsWith('phone:')) {
        return { provider: 'phone-call', providerAccountId: userId.slice('phone:'.length) };
    }
    if (userId.startsWith('tg:')) {
        return { provider: 'telegram', providerAccountId: userId.slice('tg:'.length) };
    }
    // Все остальные существующие id — "сырые" VK-номера
    return { provider: 'vk', providerAccountId: userId };
}

async function backfill() {
    console.log('🔎 Читаю существующих пользователей...');
    const allUsers = await db.select({ userId: userProgress.userId }).from(userProgress);
    console.log(`Найдено ${allUsers.length} аккаунтов`);

    let created = 0;
    let skipped = 0;

    for (const { userId } of allUsers) {
        const { provider, providerAccountId } = parseProvider(userId);

        const existing = await db.query.identities.findFirst({
            where: and(eq(identities.provider, provider), eq(identities.providerAccountId, providerAccountId)),
        });

        if (existing) {
            skipped++;
            continue;
        }

        await db.insert(identities).values({ provider, providerAccountId, userId });
        console.log(`  ✅ ${provider}:${providerAccountId} -> ${userId}`);
        created++;
    }

    console.log('====================================');
    console.log(`Готово. Создано: ${created}, уже было: ${skipped}`);
}

backfill()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
