// app/api/cron/update-homework/route.ts

import db from "@/db/drizzle";
import { userHomework } from "@/db/schema";
import { and, eq, lt } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
    const now = new Date();
    
    // Находим все просроченные ДЗ
    const expiredHomework = await db.query.userHomework.findMany({
        where: and(
            eq(userHomework.status, 'pending'),
            lt(userHomework.dueDate, now)
        ),
    });
    
    for (const hw of expiredHomework) {
        await db.update(userHomework)
            .set({ status: 'expired' })
            .where(eq(userHomework.id, hw.id));
    }
    
    return NextResponse.json({ success: true });
}