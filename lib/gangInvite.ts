import 'server-only'

// lib/gangInvite.ts — приглашение в банду по коду приглашающего (ggege.ru/g/КОД).
// Звать в банду может только глава или капо (тот же принцип, что у ?ref= при регистрации).

import { resolveInviteCode } from '@/lib/invite'
import { getGangMembership, getUserProgressById } from '@/db/queries'

export const getGangInvite = async (code: string) => {
    const inviter = await resolveInviteCode(code.toUpperCase()).catch(() => null)
    if (!inviter) return null
    const m = await getGangMembership(inviter.userId)
    if (!m || (m.role !== 'leader' && m.role !== 'kapo')) return null
    const up = await getUserProgressById(inviter.userId).catch(() => null)
    return { inviterUserId: inviter.userId, inviterNickname: up?.userName || inviter.nickname, gang: m.gang, inviterRole: m.role }
}
