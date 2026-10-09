// app/(main)/gangs/page.tsx
//
// Рейтинг банд: по умолчанию — битва текущей недели (lib/gangWeek.ts:
// +1 за урок тренажёра, +2 за квест дня, с понедельника), вкладка
// "Всё время" — старый рейтинг (gg-стикеры + квесты за всю жизнь).

import Link from 'next/link';
import { auth } from '@/lib/server-auth';
import { redirect } from 'next/navigation';
import { getGangMembership } from '@/db/queries';
import { ArrowLeft } from 'lucide-react';
import { GangBattleCountdown } from '@/components/gang-battle-countdown';
import { getGangWeekScores, getLastWeekWinner, getWeekMsLeft, settleLastGangWeek, GANG_WEEK_POINTS } from '@/lib/gangWeek';
import { declensionRu } from '@/usefulFunctions';
import { GangEmblem } from '@/components/gang-emblem';

export const dynamic = 'force-dynamic';

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
        rows = (await getGangWeekScores('all')).map((g) => ({ id: g.gangId, emoji: g.emoji, color: g.color, name: g.name, members: g.members, score: g.score }));
    }
    const msLeft = await getWeekMsLeft();

    const membership = await getGangMembership(session.user.id!);
    const myGangId = membership?.gangId ?? null;
    const top = Math.max(1, ...rows.map((r) => r.score));
    const MEDALS = [
        { bg: 'linear-gradient(180deg, #FFD84D, #E0A21C)', edge: '#9C6B0B', text: '#4A3200' },
        { bg: 'linear-gradient(180deg, #E4ECF1, #A9B6BE)', edge: '#6E7B83', text: '#2A3439' },
        { bg: 'linear-gradient(180deg, #F0A86A, #C07434)', edge: '#7E4517', text: '#3B1E06' },
    ];

    return (
        <div className="max-w-[600px] mx-auto px-4 pb-10 flex flex-col gap-5">
            <Link href="/gang" className="self-start inline-flex items-center gap-1.5 rounded-xl border-2 border-[#3A464E] bg-[#161F23] px-3 py-1.5 text-sm font-bold text-[#C9D3D9] active:translate-y-[1px]"
                style={{ boxShadow: '0 3px 0 #0E1518' }}>
                <ArrowLeft className="h-4 w-4" /> Моя банда
            </Link>

            {/* шапка-арена */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-[#3A2F5C] p-5 text-center"
                style={{ background: 'radial-gradient(circle at 50% 0%, rgba(195,133,247,0.28), #161F23 65%)' }}>
                <p className="text-3xl font-black tracking-wide text-[#F2F7FB]">⚔️ БИТВА БАНД</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#B79BE0]">{tab === 'week' ? 'Неделя идёт' : 'Зал славы'}</p>

                {tab === 'week' ? (
                    <>
                        <div className="mt-4"><GangBattleCountdown initialMs={msLeft} /></div>
                        <div className="mt-5 flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left"
                            style={{ borderColor: 'rgba(0,197,255,0.45)', background: 'rgba(0,197,255,0.08)' }}>
                            <img src="/chests/rare0001.svg" alt="" className="h-12 w-12 shrink-0 animate-tile-float" />
                            <div className="min-w-0">
                                <p className="text-sm font-black text-[#F2F7FB]">Приз победителям</p>
                                <p className="text-xs font-bold text-[#8FD8F2]">Каждому в банде-победителе — редкий кейс</p>
                            </div>
                        </div>
                        <div className="mt-3 flex justify-center gap-2">
                            <span className="rounded-full border-2 border-[#2E4A2A] bg-[#1C2A1A] px-3 py-1 text-xs font-black text-[#A1D151]">📚 урок тренажёра +{GANG_WEEK_POINTS.lesson}</span>
                            <span className="rounded-full border-2 border-[#4A3A1C] bg-[#2A2116] px-3 py-1 text-xs font-black text-[#F2C35B]">🎯 квест дня +{GANG_WEEK_POINTS.quest}</span>
                        </div>
                    </>
                ) : (
                    <p className="mt-3 text-sm text-[#9AA7B0]">Те же очки, что в битве недели (урок тренажёра +1, квест дня +2), — за всё время.</p>
                )}
            </div>

            {/* вкладки */}
            <div className="flex rounded-2xl border-2 border-[#2A363C] bg-[#11191C] p-1">
                {[{ key: 'week', label: '⚔️ Эта неделя' }, { key: 'all', label: '🏛 Всё время' }].map((t) => (
                    <Link key={t.key} href={t.key === 'week' ? '/gangs' : '/gangs?tab=all'}
                        className={`flex-1 rounded-xl py-2 text-center text-sm font-black ${tab === t.key ? 'text-[#F2F7FB]' : 'text-[#7A8A93]'}`}
                        style={tab === t.key ? { background: 'linear-gradient(180deg, #8E5BD6, #6A3FB0)', boxShadow: '0 3px 0 #45277A' } : undefined}>
                        {t.label}
                    </Link>
                ))}
            </div>

            {tab === 'week' && lastWinner && (
                <div className="flex items-center gap-3 rounded-2xl border-2 border-amber-400/50 bg-amber-400/10 px-3 py-2.5">
                    <span className="text-2xl">🏆</span>
                    <p className="text-sm font-bold text-amber-200">
                        Прошлая неделя: <span className="font-black text-amber-300">«{lastWinner.name}»</span> · {lastWinner.score} {declensionRu(lastWinner.score, 'очко', 'очка', 'очков')}
                    </p>
                </div>
            )}

            {rows.length === 0 && (
                <p className="text-sm text-[#9AA7B0] text-center py-8">Банд пока нет — стань первым, создай свою на странице «Банда»!</p>
            )}

            <div className="flex flex-col gap-3">
                {rows.map((g, i) => {
                    const medal = i < 3 && g.score > 0 ? MEDALS[i] : null;
                    const mine = g.id === myGangId;
                    const leader = i === 0 && g.score > 0;
                    return (
                        <div key={g.id} className="relative overflow-hidden rounded-2xl border-2 p-3"
                            style={{
                                borderColor: leader ? 'rgba(242,195,91,0.75)' : mine ? 'rgba(195,133,247,0.7)' : '#2A363C',
                                background: leader ? 'linear-gradient(135deg, rgba(242,195,91,0.16), #161F23 60%)' : '#161F23',
                                boxShadow: '0 4px 0 #0E1518',
                            }}>
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-black"
                                    style={medal ? { background: medal.bg, color: medal.text, boxShadow: `0 3px 0 ${medal.edge}` } : { background: '#26323A', color: '#9AA7B0' }}>
                                    {leader ? '👑' : i + 1}
                                </div>
                                <GangEmblem value={g.emoji} color={g.color} size={52} />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-base font-black text-[#F2F7FB]">
                                        {g.name}{mine && <span className="ml-1.5 rounded-md bg-violet-400/20 px-1.5 py-0.5 text-[10px] font-black uppercase text-violet-300">твоя</span>}
                                    </p>
                                    <p className="text-xs font-bold text-[#9AA7B0]">{g.members} {declensionRu(g.members, 'участник', 'участника', 'участников')}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="text-2xl font-black leading-none" style={{ color: leader ? '#F2C35B' : '#C385F7' }}>{g.score}</p>
                                    <p className="text-[10px] font-bold uppercase text-[#7A8A93]">{declensionRu(g.score, 'очко', 'очка', 'очков')}</p>
                                </div>
                            </div>
                            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#26323A]">
                                <div className="h-full rounded-full" style={{ width: `${Math.max(3, (g.score / top) * 100)}%`, background: leader ? 'linear-gradient(90deg, #F09B38, #F2C35B)' : 'linear-gradient(90deg, #8E5BD6, #C385F7)' }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GangsLeaderboardPage;
