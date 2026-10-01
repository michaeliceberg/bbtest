// app/(main)/gang/page.tsx

import { auth } from '@/lib/server-auth';
import { getGangMembership, getGangRoster } from '@/db/queries';
import { redirect } from 'next/navigation';
import { computeGangRating } from '@/lib/gangRating';
import { CreateGangForm } from '@/components/create-gang-form';
import { GangQrCard } from '@/components/gang-qr-card';
import { getOrCreateInvite } from '@/lib/invite';
import { GangRoster } from '@/components/gang-roster';
import { GangLeaveButton } from '@/components/gang-leave-button';
import { GangWeekCaseCard } from '@/components/gang-week-case-card';
import Link from 'next/link';
import { declensionRu } from '@/usefulFunctions';
import { getGangWeekScores, hasUnclaimedGangWeekReward, settleLastGangWeek } from '@/lib/gangWeek';

export const dynamic = 'force-dynamic';

const GangPage = async () => {
    const session = await auth();
    if (!session?.user) redirect('/');
    const userId = session.user.id;

    // Итоги прошлой недели подводим до чтения награды — иначе первый заход
    // победителя после понедельника не увидит свой кейс.
    await settleLastGangWeek();
    const hasWeekReward = await hasUnclaimedGangWeekReward(userId);
    const membership = await getGangMembership(userId);
    const invite = membership ? await getOrCreateInvite(userId) : null;

    if (!membership) {
        return (
            <div className="max-w-[600px] mx-auto px-4 pb-10 flex flex-col gap-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#F2F7FB] mb-1">Банда</h1>
                    <p className="text-sm text-[#9AA7B0]">
                        Объединяйся с друзьями, приглашай новых учеников и соревнуйся с другими бандами.
                    </p>
                </div>
                {hasWeekReward && <GangWeekCaseCard />}
                <CreateGangForm />
            </div>
        );
    }

    const roster = await getGangRoster(membership.gangId);
    const rating = computeGangRating(roster);
    const isLeader = membership.role === 'leader';
    const canInvite = membership.role === 'leader' || membership.role === 'kapo';
    const weekScores = await getGangWeekScores(0);
    const weekIdx = weekScores.findIndex((g) => g.gangId === membership.gangId);
    const weekScore = weekIdx >= 0 ? weekScores[weekIdx].score : 0;

    return (
        <div className="max-w-[600px] mx-auto px-4 pb-10 flex flex-col gap-6">
            <div className="text-center">
                <p className="text-5xl mb-2">{membership.gang.emoji}</p>
                <h1 className="text-2xl font-bold text-[#F2F7FB]">{membership.gang.name}</h1>
                <p className="text-sm text-[#9AA7B0] mt-1">Рейтинг банды: <span className="font-bold text-violet-400">{rating}</span></p>
            </div>

            {hasWeekReward && <GangWeekCaseCard />}

            <Link href="/gangs" className="rounded-xl border-2 border-violet-400/50 bg-violet-400/10 p-4 flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs text-[#9AA7B0]">Битва недели</p>
                    <p className="font-bold text-[#F2F7FB]">
                        {weekIdx >= 0 ? `${weekIdx + 1} место из ${weekScores.length}` : '—'} · {weekScore} {declensionRu(weekScore, 'очко', 'очка', 'очков')}
                    </p>
                </div>
                <span className="text-sm font-bold text-violet-300 shrink-0">Рейтинг →</span>
            </Link>

            {canInvite && invite && <GangQrCard inviteCode={invite.code} gangName={membership.gang.name} />}

            <GangRoster gangId={membership.gangId} members={roster} currentUserId={userId} isLeader={isLeader} />

            {!isLeader && <GangLeaveButton />}
        </div>
    );
};

export default GangPage;
