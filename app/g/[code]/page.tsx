// app/g/[code]/page.tsx — приглашение в банду: ggege.ru/g/КОД (код главы/капо).
// Аккаунт есть — кнопка «Вступить». Нет — вход; cookie приглашения (ReferralCatcher)
// запишет новичка в банду при регистрации (actions/user-progress.ts).

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserProgress, getGangMembership } from '@/db/queries'
import { getGangInvite } from '@/lib/gangInvite'
import { GangJoinCard } from '@/components/gang-join-card'

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
            isSelf={!!invite && invite.inviterUserId === session?.user?.id}
            currentGang={current ? { name: current.gang.name, sameGang: !!invite && current.gangId === invite.gang.id, isLeader: current.role === 'leader' } : null}
        />
    )
}

export default GangInvitePage
