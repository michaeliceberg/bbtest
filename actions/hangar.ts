'use server'

import { sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import db from '@/db/drizzle'
import { auth } from '@/lib/server-auth'
import { getEgeMap } from '@/lib/egeMap'
import { isStationDone } from '@/lib/hangar'

// «Починить» деталь ангара: только если раздел задания действительно решён (проверка на сервере).
export async function fixHangarItem(num: number): Promise<{ ok: boolean }> {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return { ok: false }
    const map = await getEgeMap(userId, 'math_profile')
    const st = map.stations.find((s) => s.num === num)
    if (!st || !isStationDone(st)) return { ok: false }
    await db.execute(sql`INSERT INTO hangar_fixed (user_id, task_num) VALUES (${userId}, ${num}) ON CONFLICT (user_id, task_num) DO NOTHING`)
    revalidatePath('/path')
    return { ok: true }
}
