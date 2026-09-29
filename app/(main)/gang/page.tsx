// app/(main)/gang/page.tsx

import { auth } from '@/lib/server-auth';
import { getGangMembership, getGangRoster } from '@/db/queries';
import { redirect } from 'next/navigation';
import { computeGangRating } from '@/lib/gangRating';
import { CreateGangForm } from '@/components/create-gang-form';
import { GangQrCard } from '@/components/gang-qr-card';
import { GangRoster } from '@/components/gang-roster';
import { GangLeaveButton } from '@/components/gang-leave-button';

const GangPage = async () => {
    const session = await auth();
    if (!session?.user) redirect('/');
    const userId = session.user.id;

    const membership = await getGangMembership(userId);

    if (!membership) {
        return (
            <div className="max-w-[600px] mx-auto px-4 pb-10 flex flex-col gap-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#F2F7FB] mb-1">Банда</h1>
                    <p className="text-sm text-[#9AA7B0]">
                        Объединяйся с друзьями, приглашай новых учеников и соревнуйся с другими бандами.
                    </p>
                </div>
                <CreateGangForm />
            </div>
        );
    }

    const roster = await getGangRoster(membership.gangId);
    const rating = computeGangRating(roster);
    const isLeader = membership.role === 'leader';
    const canInvite = membership.role === 'leader' || membership.role === 'kapo';

    return (
        <div className="max-w-[600px] mx-auto px-4 pb-10 flex flex-col gap-6">
            <div className="text-center">
                <p className="text-5xl mb-2">{membership.gang.emoji}</p>
                <h1 className="text-2xl font-bold text-[#F2F7FB]">{membership.gang.name}</h1>
                <p className="text-sm text-[#9AA7B0] mt-1">Рейтинг банды: <span className="font-bold text-violet-400">{rating}</span></p>
            </div>

            {canInvite && <GangQrCard userId={userId} gangName={membership.gang.name} />}

            <GangRoster gangId={membership.gangId} members={roster} currentUserId={userId} isLeader={isLeader} />

            {!isLeader && <GangLeaveButton />}
        </div>
    );
};

export default GangPage;
