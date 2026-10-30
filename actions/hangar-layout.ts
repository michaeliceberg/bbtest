'use server'

import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import db from '@/db/drizzle'
import { userProgress } from '@/db/schema'
import { auth } from '@/lib/server-auth'
import type { LayoutOverrides } from '@/lib/hangarModel'

// Расстановка ангара из редактора /test-hangar-layout. Читать может кто угодно, сохранять — только админ.
export async function getHangarLayout(): Promise<LayoutOverrides | null> {
    const rows = (await db.execute(sql`SELECT data FROM hangar_layout WHERE id = 1`)) as unknown as { data: unknown }[]
    const d = rows[0]?.data
    if (!d) return null
    return (typeof d === 'string' ? JSON.parse(d) : d) as LayoutOverrides
}

export async function saveHangarLayout(data: LayoutOverrides): Promise<{ ok: boolean; error?: string }> {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return { ok: false, error: 'Войди в аккаунт' }
    const me = await db.query.userProgress.findFirst({ where: eq(userProgress.userId, userId), columns: { isAdmin: true } })
    if (me?.isAdmin !== 1) return { ok: false, error: 'Сохранять может только админ' }
    const json = JSON.stringify(data)
    await db.execute(sql`INSERT INTO hangar_layout (id, data, updated_at, updated_by) VALUES (1, ${json}::jsonb, now(), ${userId})
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now(), updated_by = EXCLUDED.updated_by`)
    revalidatePath('/path')
    return { ok: true }
}
