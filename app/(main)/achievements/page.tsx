// app/(main)/achievements/page.tsx

import { FeedWrapper } from '@/components/feed-wrapper';
import { StickyWrapper } from '@/components/sticky-wrapper';
import { UserProgress } from '@/components/user-progress';
import { auth } from '@/lib/server-auth';
import { redirect } from 'next/navigation';
import { getUserProgress, getUserAchievementsWithDetails } from '@/db/queries';
import { AchievementsGrid } from '@/components/achievements-grid';
import { getMyAchievements } from '@/actions/achievements';
import { ACHIEVEMENTS, ACHIEVEMENT_GROUPS } from '@/lib/achievementsCatalog';
import { AchievementIcon } from '@/components/achievement-icon';
import { Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' });

const AchievementsPage = async () => {
    const session = await auth();
    if (!session?.user) redirect('/');

    const userId = session.user.id;
    const userProgress = await getUserProgress();

    if (!userProgress || !userProgress.activeCourse) {
        redirect('/courses');
    }

    const unlocked = await getMyAchievements();
    const unlockedAt = new Map(unlocked.map((u) => [u.key, u.unlockedAt]));
    const total = ACHIEVEMENTS.length;
    const got = ACHIEVEMENTS.filter((a) => unlockedAt.has(a.key)).length;

    // Старые достижения с наградами (задачник/домашка) — остаются ниже.
    const oldAchievements = await getUserAchievementsWithDetails(userId);

    return (
        <div className='flex flex-row-reverse gap-[48px] px-6'>
            <StickyWrapper>
                <UserProgress
                    activeCourse={userProgress.activeCourse}
                    hearts={userProgress.hearts}
                    points={userProgress.points}
                    gems={userProgress.gems}
                    xp={userProgress.xp}
                    ggStickers={userProgress.ggStickers}
                    hasActiveSubscription={false}
                />
            </StickyWrapper>

            <FeedWrapper>
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">🏆 Ачивки</h1>
                    <p className="text-[#9AA7B0] mt-1">Собирай все — открыто {got} из {total}</p>
                    <div className="mt-3 h-3 rounded-full bg-[#232F34] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(got / total) * 100}%`, background: 'linear-gradient(90deg, #53ADEF, #C385F7)' }} />
                    </div>
                </div>

                <div className="space-y-8">
                    {ACHIEVEMENT_GROUPS.map((g) => {
                        const list = ACHIEVEMENTS.filter((a) => a.group === g.id);
                        const done = list.filter((a) => unlockedAt.has(a.key)).length;
                        return (
                            <section key={g.id}>
                                <div className="flex items-baseline gap-3 mb-3">
                                    <h2 className="text-lg font-extrabold" style={{ color: g.color }}>{g.title}</h2>
                                    <span className="text-xs font-bold text-[#6B7A83]">{done}/{list.length}</span>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {list.map((a) => {
                                        const at = unlockedAt.get(a.key);
                                        const has = !!at;
                                        return (
                                            <div
                                                key={a.key}
                                                className="flex items-center gap-3 rounded-xl p-3"
                                                style={{
                                                    background: has ? `linear-gradient(135deg, ${g.color}22, #161F23)` : '#161F23',
                                                    border: `1.5px solid ${has ? `${g.color}77` : '#2B373D'}`,
                                                }}
                                            >
                                                <AchievementIcon emoji={a.emoji} iconSrc={a.iconSrc} color={g.color} size={60} unlocked={has} />
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-extrabold leading-tight" style={{ color: has ? '#F2F7FB' : '#72838D' }}>{a.title}</p>
                                                    <p className="text-xs leading-snug mt-0.5" style={{ color: has ? '#9AA7B0' : '#56646C' }}>{a.desc}</p>
                                                    <p className="text-[11px] font-bold mt-1" style={{ color: has ? g.color : '#56646C' }}>
                                                        {has ? `Получено ${fmtDate(at!)}` : <span className="inline-flex items-center gap-1"><Lock className="w-3 h-3" /> Ещё не получено</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}
                </div>

                {oldAchievements.length > 0 && (
                    <div className="mt-10">
                        <h2 className="text-lg font-extrabold mb-1">Награды за достижения</h2>
                        <p className="text-sm text-[#9AA7B0] mb-4">Задания с призами: забирай очки и гемы.</p>
                        <AchievementsGrid userId={userId} achievementsWithProgress={oldAchievements} />
                    </div>
                )}
            </FeedWrapper>
        </div>
    );
};

export default AchievementsPage;
