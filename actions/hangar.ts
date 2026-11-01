'use server'

import { sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import db from '@/db/drizzle'
import { auth } from '@/lib/server-auth'
import { getEgeMap } from '@/lib/egeMap'
import { repairStatus, getFixedNums } from '@/lib/hangar'
import { getTrainerKeysByTask } from '@/lib/egeTrainerLinks'
import { grantCaseKey } from '@/lib/caseKeys'

async function statusOf(userId: string, num: number) {
    const [map, keys] = await Promise.all([getEgeMap(userId, 'math_profile'), getTrainerKeysByTask(userId)])
    const st = map.stations.find((s) => s.num === num)
    return st ? repairStatus(st, keys[num] ?? []) : null
}

// «Починить» деталь ангара: только если правило починки выполнено (проверка на сервере, lib/hangar.ts).
export async function fixHangarItem(num: number): Promise<{ ok: boolean }> {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return { ok: false }
    if (!(await statusOf(userId, num))?.canFix) return { ok: false }
    await db.execute(sql`INSERT INTO hangar_fixed (user_id, task_num) VALUES (${userId}, ${num}) ON CONFLICT (user_id, task_num) DO NOTHING`)
    revalidatePath('/path')
    return { ok: true }
}

// Золотой предмет: ключ редкого кейса (один раз на задание). Возвращает ключ — его открывает барабан (openKeyCase).
export async function claimHangarGold(num: number): Promise<{ keyId: number | null; error?: string }> {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return { keyId: null }
    if (!(await getFixedNums(userId)).includes(num) || !(await statusOf(userId, num))?.mastered) return { keyId: null, error: 'Предмет ещё не золотой' }
    const key = await grantCaseKey(userId, 'rare', 'hangar_gold', String(num))
    return key ? { keyId: key.keyId } : { keyId: null, error: 'Сегодня кейсов уже много — забери завтра' }
}
