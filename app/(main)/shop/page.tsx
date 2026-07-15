// app/(main)/shop/page.tsx

import { FeedWrapper } from '@/components/feed-wrapper';
import { StickyWrapper } from '@/components/sticky-wrapper';
import { UserProgress } from '@/components/user-progress';
import { auth } from '@/lib/server-auth';
import { redirect } from 'next/navigation';
import { MineShop } from '@/components/mine-shop';
import { PizzaReward } from '@/components/pizza-reward';
import { CollectGemsButton } from '@/components/collect-gems-button';
import { getUserProgress, getMineTypes, getUserStreaks } from '@/db/queries';

const ShopPage = async () => {
    const session = await auth();
    if (!session?.user) redirect('/');
    
    const userId = session.user.id;
    const userProgress = await getUserProgress();
    
    if (!userProgress || !userProgress.activeCourse) {
        redirect('/courses');
    }
    
    const streaks = await getUserStreaks(userId);
    const mineTypes = await getMineTypes();
    
    return (
        <div className='flex flex-row-reverse gap-[48px] px-6'>
            <StickyWrapper>
                <UserProgress 
                    activeCourse={userProgress.activeCourse}
                    hearts={userProgress.hearts}
                    points={userProgress.points}
                    gems={userProgress.gems}
                    hasActiveSubscription={false}
                />
            </StickyWrapper>
            
            <FeedWrapper>
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">🏪 Королевский магазин</h1>
                    <p className="text-[#9AA7B0] mt-1">
                        Инвестируй в шахты и получай реальные призы!
                    </p>
                </div>
                
                <div className="space-y-6">
                    <CollectGemsButton />
                    
                    <MineShop 
                        mines={mineTypes}
                        userGems={userProgress.gems}
                        userPoints={userProgress.points}
                        userStreak={streaks.homeworkStreak}
                    />
                    
                    <PizzaReward 
                        userGems={userProgress.gems}
                        userStreak={streaks.homeworkStreak}
                        userRank={5}
                    />
                </div>
            </FeedWrapper>
        </div>
    );
};

export default ShopPage;