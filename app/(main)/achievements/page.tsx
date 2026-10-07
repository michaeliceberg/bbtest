// app/(main)/achievements/page.tsx

import { FeedWrapper } from '@/components/feed-wrapper';
import { StickyWrapper } from '@/components/sticky-wrapper';
import { UserProgress } from '@/components/user-progress';
import { auth } from '@/lib/server-auth';
import { redirect } from 'next/navigation';
import { getUserProgress } from '@/db/queries';
import { AchievementsHall } from '@/components/achievements-hall';
import { getMyAchievements } from '@/actions/achievements';
import { ACHIEVEMENTS } from '@/lib/achievementsCatalog';

export const dynamic = 'force-dynamic';

const AchievementsPage = async () => {
    const session = await auth();
    if (!session?.user) redirect('/');

    const userProgress = await getUserProgress();

    if (!userProgress || !userProgress.activeCourse) {
        redirect('/courses');
    }

    const unlocked = await getMyAchievements();
    const unlockedAt = new Map(unlocked.map((u) => [u.key, u.unlockedAt]));
    const total = ACHIEVEMENTS.length;
    const got = ACHIEVEMENTS.filter((a) => unlockedAt.has(a.key)).length;

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
                    <p className="text-[#9AA7B0] mt-1">Собирай все — открыто {got} из {total}. Нажми на полученную — заберёшь награду!</p>
                    <div className="mt-3 h-3 rounded-full bg-[#232F34] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(got / total) * 100}%`, background: 'linear-gradient(90deg, #53ADEF, #C385F7)' }} />
                    </div>
                </div>

                <AchievementsHall unlocks={unlocked} />
                <p className="mt-10 text-center text-[11px] leading-relaxed text-[#56646C]">
                    Иконки ачивок:{' '}
                    <a href="https://game-icons.net" target="_blank" rel="noreferrer" className="underline hover:text-[#9AA7B0]">game-icons.net</a>
                    {' '}— Lorc, Delapouite, Skoll, Caro Asercion, Zeromancer, Zajkonur (лицензия{' '}
                    <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer" className="underline hover:text-[#9AA7B0]">CC BY 3.0</a>)
                </p>
            </FeedWrapper>
        </div>
    );
};

export default AchievementsPage;
