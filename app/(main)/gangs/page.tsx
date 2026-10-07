// app/(main)/gangs/page.tsx
//
// Рейтинг банд: по умолчанию — битва текущей недели (lib/gangWeek.ts:
// +1 за урок тренажёра, +2 за квест дня, с понедельника), вкладка
// "Всё время" — старый рейтинг (gg-стикеры + квесты за всю жизнь).

import Link from 'next/link';
import { auth } from '@/lib/server-auth';
import { redirect } from 'next/navigation';
import { getAllGangsWithRoster } from '@/db/queries';
import { computeGangRating } from '@/lib/gangRating';
import { getGangWeekScores, getLastWeekWinner, getWeekMsLeft, settleLastGangWeek, GANG_WEEK_POINTS } from '@/lib/gangWeek';
import { declensionRu } from '@/usefulFunctions';
import { GangEmblem } from '@/components/gang-emblem';

export const dynamic = 'force-dynamic';

const formatLeft = (ms: number) => {
    const h = Math.floor(ms / 3600_000);
    const d = Math.floor(h / 24);
    return d > 0 ? `${d} д ${h % 24} ч` : `${h} ч ${Math.floor((ms % 3600_000) / 60_000)} мин`;
};

const GangsLeaderboardPage = async ({ searchParams }: { searchParams: { tab?: string } }) => {
    const session = await auth();
    if (!session?.user) redirect('/');

    const tab = searchParams.tab === 'all' ? 'all' : 'week';
    await settleLastGangWeek();
    const lastWinner = await getLastWeekWinner();

    let rows: { id: number; emoji: string; color: string | null; name: string; members: number; score: number }[];
    if (tab === 'week') {
        rows = (await getGangWeekScores(0)).map((g) => ({ id: g.gangId, emoji: g.emoji, color: g.color, name: g.name, members: g.members, score: g.score }));
    } else {
        rows = (await getAllGangsWithRoster())
            .map(({ gang, roster }) => ({ id: gang.id, emoji: gang.emoji, color: gang.color, name: gang.name, members: roster.length, score: computeGangRating(roster) }))
            .sort((a, b) => b.score - a.score);
    }
    const msLeft = await getWeekMsLeft();

    return (
        <div className="max-w-[600px] mx-auto px-4 pb-10 flex flex-col gap-5">
            <div>
                <h1 className="text-2xl font-bold text-[#F2F7FB] mb-1">Битва банд</h1>
                <p className="text-sm text-[#9AA7B0]">
                    {tab === 'week'
                        ? `Очки недели: +${GANG_WEEK_POINTS.lesson} за урок тренажёра, +${GANG_WEEK_POINTS.quest} за квест дня. Банда-победитель — каждому редкий кейс 🎁`
                        : 'Рейтинг за всё время — сумма gg-стикеров и выполненных квестов всех участников.'}
                </p>
            </div>

            <div className="flex gap-2">
                {[{ key: 'week', label: 'Эта неделя' }, { key: 'all', label: 'Всё время' }].map((t) => (
                    <Link
                        key={t.key}
                        href={t.key === 'week' ? '/gangs' : '/gangs?tab=all'}
                        className={`flex-1 text-center py-2 rounded-xl text-sm font-bold border-2 ${tab === t.key ? 'border-violet-400 bg-violet-400/15 text-[#F2F7FB]' : 'border-[#3A464E] text-[#9AA7B0]'}`}
                    >
                        {t.label}
                    </Link>
                ))}
            </div>

            {tab === 'week' && (
                <div className="flex flex-col gap-2">
                    <p className="text-sm text-center text-[#9AA7B0]">⏳ До конца битвы: <span className="font-bold text-[#F2F7FB]">{formatLeft(msLeft)}</span></p>
                    {lastWinner && (
                        <p className="text-sm text-center text-amber-300">
                            🏆 Победитель прошлой недели: {lastWinner.name} ({lastWinner.score} {declensionRu(lastWinner.score, 'очко', 'очка', 'очков')})
                        </p>
                    )}
                </div>
            )}

            {rows.length === 0 && (
                <p className="text-sm text-[#9AA7B0] text-center py-8">Банд пока нет — стань первым, создай свою на странице «Банда»!</p>
            )}

            <div className="flex flex-col gap-2">
                {rows.map((g, i) => (
                    <div
                        key={g.id}
                        className={`flex items-center gap-3 rounded-xl border p-3 ${tab === 'week' && i === 0 && g.score > 0 ? 'border-amber-400/70 bg-amber-400/10' : 'border-[#3A464E] bg-[#151F23]'}`}
                    >
                        <span className="text-lg font-bold text-[#9AA7B0] w-6 text-center shrink-0">
                            {tab === 'week' && i === 0 && g.score > 0 ? '👑' : i + 1}
                        </span>
                        <GangEmblem value={g.emoji} color={g.color} size={48} />
                        <div className="min-w-0 flex-1">
                            <p className="font-bold text-[#F2F7FB] truncate">{g.name}</p>
                            <p className="text-xs text-[#9AA7B0]">{g.members} {declensionRu(g.members, 'участник', 'участника', 'участников')}</p>
                        </div>
                        <span className="font-bold text-violet-400 shrink-0">{g.score}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GangsLeaderboardPage;
