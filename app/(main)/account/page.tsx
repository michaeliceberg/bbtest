// app/(main)/account/page.tsx

import { auth } from '@/lib/server-auth'
import { getUserProgress, getGangMembership } from '@/db/queries'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { AccountLinking } from '@/components/account-linking'
import { AvatarReroll } from '@/components/avatar-reroll'
import { NameEditor } from '@/components/name-editor'
import { ParentBindCode } from '@/components/parent-bind-code'
import { ReferralCard } from '@/components/referral-card'
import { getOrCreateInvite } from '@/lib/invite'
import { getRank } from '@/lib/rank'
import { getLevelInfo } from '@/lib/xp'
import { Button } from '@/components/ui/button'

const AccountPage = async () => {
    const session = await auth()
    if (!session?.user) redirect('/')

    const userProgress = await getUserProgress()
    if (!userProgress) redirect('/')

    const gangMembership = await getGangMembership(userProgress.userId)
    const invite = await getOrCreateInvite(userProgress.userId)
    const rank = getRank(getLevelInfo(userProgress.xp).level, gangMembership?.role)

    return (
        <div className="max-w-[600px] mx-auto px-4 pb-10 flex flex-col gap-8">
            <div>
                <h1 className="text-2xl font-bold text-[#F2F7FB] mb-1">Настройки</h1>
                <p className="text-sm text-[#9AA7B0]">Профиль, вход в аккаунт и родительский доступ.</p>
            </div>

            <div>
                <h2 className="font-bold text-lg text-[#F2F7FB] mb-3">Профиль</h2>
                <div className="flex flex-col gap-4">
                    <NameEditor currentName={userProgress.userName} rank={rank.title} rankHint={rank.next ? `Следующее звание — «${rank.next.title}» с ${rank.next.minLevel} уровня` : undefined} />
                    <AvatarReroll currentAvatar={userProgress.userImageSrc} points={userProgress.points} />
                </div>
            </div>

            <div>
                <h2 className="font-bold text-lg text-[#F2F7FB] mb-1">Способы входа</h2>
                <p className="text-sm text-[#9AA7B0] mb-3">
                    Привяжите несколько способов входа, чтобы заходить в свой аккаунт с разных устройств.
                </p>
                <Suspense fallback={null}>
                    <AccountLinking />
                </Suspense>
            </div>

            <div className="rounded-xl border border-[#3A464E] bg-[#151F23] shadow-sm p-4 space-y-3">
                <h3 className="font-bold text-[#F2F7FB] flex items-center gap-2">
                    {gangMembership ? `${gangMembership.gang.emoji} ${gangMembership.gang.name}` : 'Моя банда'}
                </h3>
                <p className="text-sm text-[#9AA7B0]">
                    {gangMembership ? 'Приглашай друзей, назначай капо и следи за рейтингом банды.' : 'Ты ещё не в банде — создай свою или вступи по ссылке друга!'}
                </p>
                <Link href="/gang">
                    <Button type="button" variant="secondary" className="w-full">
                        {gangMembership ? 'Открыть банду' : 'Создать банду'}
                    </Button>
                </Link>
            </div>

            {invite && <ReferralCard inviteCode={invite.code} />}

            <ParentBindCode userId={userProgress.userId} userName={userProgress.userName} />
        </div>
    )
}

export default AccountPage
