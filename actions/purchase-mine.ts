// app/actions/purchase-mine.ts

'use server';

import db from '@/db/drizzle';
import { userMines, mineTypes, userProgress } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function purchaseMine(mineTypeId: number) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Не авторизован' };
    }
    
    const userId = session.user.id;
    
    // Получаем тип шахты
    const mineType = await db.query.mineTypes.findFirst({
        where: eq(mineTypes.id, mineTypeId),
    });
    
    if (!mineType) {
        return { success: false, error: 'Шахта не найдена' };
    }
    
    // Получаем пользователя
    const user = await db.query.userProgress.findFirst({
        where: eq(userProgress.userId, userId),
    });
    
    if (!user) {
        return { success: false, error: 'Пользователь не найден' };
    }
    
    // Проверяем, может ли пользователь купить
    let useGems = false;
    let usePoints = false;
    
    if (user.gems >= mineType.priceGems && mineType.priceGems > 0) {
        useGems = true;
    } else if (user.points >= mineType.pricePoints && mineType.pricePoints > 0) {
        usePoints = true;
    } else {
        return { success: false, error: 'Недостаточно ресурсов' };
    }
    
    // Проверяем, не куплена ли уже такая шахта
    const existing = await db.query.userMines.findFirst({
        where: and(
            eq(userMines.userId, userId),
            eq(userMines.mineTypeId, mineTypeId)
        ),
    });
    
    if (existing) {
        // Если уже есть, повышаем уровень
        await db.update(userMines)
            .set({ level: existing.level + 1 })
            .where(eq(userMines.id, existing.id));
    } else {
        // Покупаем новую
        await db.insert(userMines).values({
            userId,
            mineTypeId,
            lastCollectedAt: new Date(),
        });
    }
    
    // Списываем ресурсы (исправлено: sql вместо $raw)
    if (useGems) {
        await db.update(userProgress)
            .set({ gems: sql`${userProgress.gems} - ${mineType.priceGems}` })
            .where(eq(userProgress.userId, userId));
    } else if (usePoints) {
        await db.update(userProgress)
            .set({ points: sql`${userProgress.points} - ${mineType.pricePoints}` })
            .where(eq(userProgress.userId, userId));
    }
    
    revalidatePath('/shop');
    
    return { 
        success: true, 
        mineName: mineType.name,
        gemPerDay: mineType.gemPerDay,
    };
}