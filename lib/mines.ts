// lib/mines.ts

import db from '@/db/drizzle';
import { userProgress } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function getPendingGems(userId: string) {
    const result = await db.execute(sql`
        SELECT 
            um.id,
            um.last_collected_at,
            um.purchase_date,
            um.level,
            mt.name,
            mt.gem_per_day
        FROM user_mines um
        JOIN mine_types mt ON mt.id = um.mine_type_id
        WHERE um.user_id = ${userId}
    `);
    
    let totalPending = 0;
    const mines = [];
    
    for (const mine of result as any[]) {
        const lastCollected = mine.last_collected_at || mine.purchase_date;
        const now = new Date();
        const lastDate = new Date(lastCollected);
        const daysPassed = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
        
        const pending = Math.min(1, daysPassed) * (mine.gem_per_day || 1) * (mine.level || 1);
        
        if (pending > 0) {
            totalPending += pending;
            mines.push({
                id: mine.id,
                name: mine.name,
                pending,
                lastCollected: lastDate,
            });
        }
    }
    
    return { totalPending, mines };
}

export async function collectGems(userId: string) {
    const { totalPending, mines } = await getPendingGems(userId);
    
    if (totalPending === 0) return { success: false, gems: 0 };
    
    for (const mine of mines) {
        await db.execute(sql`
            UPDATE user_mines 
            SET last_collected_at = NOW(),
                total_collected = total_collected + ${mine.pending}
            WHERE id = ${mine.id}
        `);
    }
    
    await db.update(userProgress)
        .set({ gems: sql`${userProgress.gems} + ${totalPending}` })
        .where(eq(userProgress.userId, userId));
    
    return { success: true, gems: totalPending };
}