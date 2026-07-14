// app/api/user/daily-stats/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import db from '@/db/drizzle';
import { userDailyStats, userHomework } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { recalculateDailyStats } from '@/actions/recalculate-daily-stats';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const userId = session.user.id;
        const { courseId, challengeId, isCorrect, isFromHomework } = await req.json();
        
        if (!isFromHomework || !isCorrect) {
            return NextResponse.json({ success: true });
        }
        
        // Обновляем correctCount в userHomework
        const activeHomework = await db.query.userHomework.findMany({
            where: and(
                eq(userHomework.userId, userId),
                eq(userHomework.courseId, courseId),
                eq(userHomework.status, 'pending')
            ),
        });
        
        let targetHomework = null;
        for (const hw of activeHomework) {
            if (!hw.challengeIds) continue;
            const ids = hw.challengeIds.split(',').map(id => parseInt(id));
            if (ids.includes(challengeId)) {
                targetHomework = hw;
                break;
            }
        }
        
        if (targetHomework) {
            const newCorrectCount = (targetHomework.correctCount || 0) + 1;
            
            await db.update(userHomework)
                .set({
                    correctCount: newCorrectCount,
                    status: newCorrectCount >= targetHomework.totalCount ? 'completed' : 'pending',
                    updatedAt: new Date(),
                })
                .where(eq(userHomework.id, targetHomework.id));
            
            // Пересчитываем daily stats
            await recalculateDailyStats(userId, courseId);
        }
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating HW progress:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}