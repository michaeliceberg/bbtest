// app/actions/claim-achievement.ts

'use server';

import db from '@/db/drizzle';
import { userProgress } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function claimAchievementReward(userId: string, achievementId: number) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Не авторизован' };
    }
    
    // 1. Проверяем и получаем данные одним запросом
    const result = await db.execute(sql`
        SELECT 
            ua.is_completed, 
            ua.claimed,
            a.reward_points,
            a.reward_gems
        FROM user_achievements ua
        JOIN achievements a ON a.id = ua.achievement_id
        WHERE ua.user_id = ${userId} AND ua.achievement_id = ${achievementId}
    `);
    
    const row = result.rows[0] as any;
    
    if (!row) {
        return { success: false, error: 'Достижение не найдено' };
    }
    
    if (!row.is_completed) {
        return { success: false, error: 'Достижение ещё не выполнено' };
    }
    
    if (row.claimed) {
        return { success: false, error: 'Награда уже получена' };
    }
    
    const rewardPoints = row.reward_points || 0;
    const rewardGems = row.reward_gems || 0;
    
    // 2. Отмечаем как полученное
    await db.execute(sql`
        UPDATE user_achievements 
        SET claimed = true 
        WHERE user_id = ${userId} AND achievement_id = ${achievementId}
    `);
    
    // 3. Добавляем награду
    if (rewardPoints > 0) {
        await db.update(userProgress)
            .set({ points: sql`${userProgress.points} + ${rewardPoints}` })
            .where(eq(userProgress.userId, userId));
    }
    
    if (rewardGems > 0) {
        await db.update(userProgress)
            .set({ gems: sql`${userProgress.gems} + ${rewardGems}` })
            .where(eq(userProgress.userId, userId));
    }
    
    revalidatePath('/achievements');
    revalidatePath('/learn');
    
    return { 
        success: true, 
        points: rewardPoints,
        gems: rewardGems,
    };
}