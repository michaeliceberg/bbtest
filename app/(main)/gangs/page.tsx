// app/(main)/gangs/page.tsx

import { auth } from '@/lib/server-auth';
import { redirect } from 'next/navigation';
import { getAllGangsWithRoster } from '@/db/queries';
import { computeGangRating } from '@/lib/gangRating';

const GangsLeaderboardPage = async () => {
    const session = await auth();
    if (!session?.user) redirect('/');

    const gangsWithRoster = await getAllGangsWithRoster();
    const ranked = gangsWithRoster
        .map(({ gang, roster }) => ({ gang, memberCount: roster.length, rating: computeGangRating(roster) }))
        .sort((a, b) => b.rating - a.rating);

    return (
        <div className="max-w-[600px] mx-auto px-4 pb-10 flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold text-[#F2F7FB] mb-1">Лидерборд банд</h1>
                <p className="text-sm text-[#9AA7B0]">Рейтинг — сумма gg-стикеров и выполненных квестов всех участников.</p>
            </div>

            {ranked.length === 0 && (
                <p className="text-sm text-[#9AA7B0] text-center py-8">Банд пока нет — стань первым, создай свою на странице «Банда»!</p>
            )}

            <div className="flex flex-col gap-2">
                {ranked.map(({ gang, memberCount, rating }, i) => (
                    <div key={gang.id} className="flex items-center gap-3 rounded-xl border border-[#3A464E] bg-[#151F23] p-3">
                        <span className="text-lg font-bold text-[#9AA7B0] w-6 text-center shrink-0">{i + 1}</span>
                        <span className="text-3xl shrink-0">{gang.emoji}</span>
                        <div className="min-w-0 flex-1">
                            <p className="font-bold text-[#F2F7FB] truncate">{gang.name}</p>
                            <p className="text-xs text-[#9AA7B0]">{memberCount} участников</p>
                        </div>
                        <span className="font-bold text-violet-400 shrink-0">{rating}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GangsLeaderboardPage;
