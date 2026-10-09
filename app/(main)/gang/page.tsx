// app/(main)/gang/page.tsx

import { auth } from '@/lib/server-auth';
import { getGangMembership, getGangRoster, getUserProgressById } from '@/db/queries';
import { BandStickersPanel } from '@/components/band-stickers-panel';
import { BandMegaCaseCard } from '@/components/band-mega-case';
import { getGangWins, getMyBandStickers, hasUnclaimedBandReward } from '@/lib/bandStickersServer';
import { bandIdOf } from '@/lib/bandStickers';
import { redirect } from 'next/navigation';
import { CreateGangForm } from '@/components/create-gang-form';
import { GangQrCard } from '@/components/gang-qr-card';
import { getOrCreateInvite } from '@/lib/invite';
import { GangRoster } from '@/components/gang-roster';
import { GangLeaveButton } from '@/components/gang-leave-button';
import { GangWeekCaseCard } from '@/components/gang-week-case-card';
import Link from 'next/link';
import { GangEmblem } from '@/components/gang-emblem';
import { DEFAULT_GANG_COLOR } from '@/lib/gangEmblems';
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
    const [bandLevels, hasBandReward, me] = await Promise.all([
        getMyBandStickers(userId), hasUnclaimedBandReward(userId), getUserProgressById(userId),
    ]);
    const isAdmin = me?.isAdmin === 1;
    // Банд-стикеры — в самом верху страницы; мегакейс главы — если ждёт открытия; админу — тестовый.
    const bandTop = (
        <>
            {hasBandReward && <BandMegaCaseCard />}
            {isAdmin && <BandMegaCaseCard test />}
            <BandStickersPanel levels={bandLevels} isLeader={membership?.role === 'leader'} currentId={bandIdOf(membership?.gang.emoji)} />
        </>
    );

    if (!membership) {
        return (
            <div className="max-w-[600px] mx-auto px-4 pb-10 flex flex-col gap-8">
                {bandTop}
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-[#F2F7FB] mb-1">Создай свою банду</h1>
                    <p className="text-sm text-[#9AA7B0]">
                        Выбери эмблему и название — зови друзей, копите очки и громите другие банды GG
                    </p>
                </div>
                {hasWeekReward && <GangWeekCaseCard />}
                <CreateGangForm />
            </div>
        );
    }

    const roster = await getGangRoster(membership.gangId);
    const isLeader = membership.role === 'leader';
    const canInvite = membership.role === 'leader' || membership.role === 'kapo';
    const [weekScores, allScores] = await Promise.all([getGangWeekScores(0), getGangWeekScores('all')]);
    // «Очки за всё время» — та же формула, что у недели (+1 урок, +2 квест), без границ по дате.
    const rating = allScores.find((g) => g.gangId === membership.gangId)?.score ?? 0;
    const weekIdx = weekScores.findIndex((g) => g.gangId === membership.gangId);
    const weekScore = weekIdx >= 0 ? weekScores[weekIdx].score : 0;
    const gangColor = membership.gang.color || DEFAULT_GANG_COLOR;
    const wins = (await getGangWins([membership.gangId]))[membership.gangId] ?? 0;

    return (
        <div className="max-w-[600px] mx-auto px-4 pb-10 flex flex-col gap-6">
            {bandTop}
            <div
                className="relative overflow-hidden rounded-3xl border-2 border-[#3A464E] bg-[#151F23] px-5 py-7 text-center"
                style={{ backgroundImage: `radial-gradient(circle at 50% 0%, ${gangColor}45, transparent 65%)` }}
            >
                <div className="flex items-center justify-center gap-4 mb-3">
                    <GangEmblem value={membership.gang.emoji} color={gangColor} size={132} />
                    {/* Достижения банды — пока одно: сколько раз выиграла битву банд */}
                    {wins > 0 && (
                        <div className="flex flex-col items-center rounded-2xl border-2 px-3 py-2"
                            style={{ borderColor: '#F2C35B', background: 'linear-gradient(180deg, rgba(242,195,91,0.22), rgba(242,195,91,0.05))', boxShadow: '0 4px 0 #7A5A12' }}>
                            <span className="text-3xl leading-none">🏆</span>
                            <span className="mt-1 text-lg font-black text-[#F2C35B]">×{wins}</span>
                            <span className="text-[9px] font-black uppercase tracking-wider text-[#E6C47A]">{declensionRu(wins, 'победа', 'победы', 'побед')}</span>
                        </div>
                    )}
                </div>
                <h1 className="text-3xl font-extrabold text-[#F2F7FB] break-words">{membership.gang.name}</h1>
                <p className="text-xs font-bold uppercase tracking-[0.18em] mt-1" style={{ color: gangColor }}>
                    {membership.role === 'leader' ? 'Ты — глава банды' : membership.role === 'kapo' ? 'Ты — капо' : 'Ты — в банде'}
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2">
                    {[
                        { label: declensionRu(roster.length, 'Участник', 'Участника', 'Участников'), value: roster.length },
                        { label: 'Очков всего', value: rating },
                        { label: 'Место недели', value: weekIdx >= 0 ? `#${weekIdx + 1}` : '—' },
                    ].map((s) => (
                        <div key={s.label} className="rounded-2xl border-2 border-[#2B373D] bg-[#0F171B] px-2 py-3">
                            <p className="text-2xl font-extrabold text-[#F2F7FB]">{s.value}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA7B0]">{s.label}</p>
                        </div>
                    ))}
                </div>
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
