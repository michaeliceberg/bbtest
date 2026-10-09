// app/g/[code]/page.tsx — приглашение в банду: ggege.ru/g/КОД (код главы/капо).
// Аккаунт есть — кнопка «Вступить». Нет — вход; cookie приглашения (ReferralCatcher)
// запишет новичка в банду при регистрации (actions/user-progress.ts).

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserProgress, getGangMembership } from '@/db/queries'
import { getGangInvite } from '@/lib/gangInvite'
import { GangJoinCard } from '@/components/gang-join-card'
import { getGangWins } from '@/lib/bandStickersServer'
import { getGangWeekScores } from '@/lib/gangWeek'

export const dynamic = 'force-dynamic'

const GangInvitePage = async ({ params }: { params: { code: string } }) => {
    const code = params.code.toUpperCase()
    const invite = await getGangInvite(code)
    const session = await auth()
    const loggedIn = !!session?.user?.id
    if (loggedIn && invite) {
        const up = await getUserProgress()
        if (!up) redirect('/courses')
    }
    const current = loggedIn ? await getGangMembership(session!.user!.id!) : null
    // Достижения банды — чтобы приглашённому хотелось вступить.
    let stats: { wins: number; members: number; points: number; weekPlace: number | null; weekTotal: number } | null = null
    if (invite) {
        const [wins, all, week] = await Promise.all([getGangWins([invite.gang.id]), getGangWeekScores('all'), getGangWeekScores(0)])
        const a = all.find((g) => g.gangId === invite.gang.id)
        const wi = week.findIndex((g) => g.gangId === invite.gang.id)
        stats = { wins: wins[invite.gang.id] ?? 0, members: a?.members ?? 1, points: a?.score ?? 0, weekPlace: wi >= 0 ? wi + 1 : null, weekTotal: week.length }
    }

    return (
        <GangJoinCard
            code={code}
            loggedIn={loggedIn}
            invite={invite ? {
                gangName: invite.gang.name,
                emoji: invite.gang.emoji,
                color: invite.gang.color,
                inviter: invite.inviterNickname ?? 'Друг',
                inviterRole: invite.inviterRole,
            } : null}
            stats={stats}
            isSelf={!!invite && invite.inviterUserId === session?.user?.id}
            currentGang={current ? { name: current.gang.name, sameGang: !!invite && current.gangId === invite.gang.id, isLeader: current.role === 'leader' } : null}
        />
    )
}

export default GangInvitePage
