'use server'

// Действия песочницы паззла «абонемент в спортзал» (/gym). Ученик берётся из сессии.
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { claimDdxPromo, mergeDdxDuplicates, placeDdxPiece } from '@/lib/ddx'

const uid = async () => (await auth())?.user?.id ?? null

export async function mergeDdx() {
    const userId = await uid()
    if (!userId) return { ok: false as const, error: 'Не авторизован' }
    const res = await mergeDdxDuplicates(userId)
    revalidatePath('/gym')
    return res
}

export async function placeDdx(piece: number) {
    const userId = await uid()
    if (!userId || !Number.isInteger(piece)) return false
    return placeDdxPiece(userId, piece)
}

export async function claimDdx() {
    const userId = await uid()
    if (!userId) return null
    const code = await claimDdxPromo(userId)
    revalidatePath('/gym')
    return code
}
