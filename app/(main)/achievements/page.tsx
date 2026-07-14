// app/(main)/achievements/page.tsx

import { FeedWrapper } from '@/components/feed-wrapper';
import { StickyWrapper } from '@/components/sticky-wrapper';
import { UserProgress } from '@/components/user-progress';
import { auth } from '@/lib/server-auth';
import { redirect } from 'next/navigation';
import { getUserProgress, getUserAchievementsWithDetails } from '@/db/queries';
import { AchievementsGrid } from '@/components/achievements-grid';
// import { AchievementsGrid } from '@/components/achievements-grid';

const AchievementsPage = async () => {
    const session = await auth();
    if (!session?.user) redirect('/');
    
    const userId = session.user.id;
    const userProgress = await getUserProgress();
    
    if (!userProgress || !userProgress.activeCourse) {
        redirect('/courses');
    }
    
    // Получаем достижения с прогрессом пользователя
    const achievementsWithProgress = await getUserAchievementsWithDetails(userId);
    
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
                    <h1 className="text-3xl font-bold">🏆 Достижения</h1>
                    <p className="text-gray-500 mt-1">
                        Собирай достижения и получай награды!
                    </p>
                </div>
                
                <AchievementsGrid 
                    userId={userId}
                    achievementsWithProgress={achievementsWithProgress}
                />
            </FeedWrapper>
        </div>
    );
};

export default AchievementsPage;





// // app/(main)/achievements/page.tsx

// import { FeedWrapper } from '@/components/feed-wrapper';
// import { StickyWrapper } from '@/components/sticky-wrapper';
// import { UserProgress } from '@/components/user-progress';
// import { auth } from '@/lib/server-auth';
// import { redirect } from 'next/navigation';
// import { getUserProgress, getUserAchievements } from '@/db/queries';
// import { AchievementsGrid } from '@/components/achievements-grid';

// const AchievementsPage = async () => {
//     const session = await auth();
//     if (!session?.user) redirect('/');
    
//     const userId = session.user.id;
//     const userProgress = await getUserProgress();
//     const userAchievements = await getUserAchievements(userId);
    
//     if (!userProgress) redirect('/courses');
    
//     return (
//         <div className='flex flex-row-reverse gap-[48px] px-6'>
//             <StickyWrapper>
//                 <UserProgress 
//                     activeCourse={userProgress.activeCourse}
//                     hearts={userProgress.hearts}
//                     points={userProgress.points}
//                     gems={userProgress.gems}
//                     hasActiveSubscription={false}
//                 />
//             </StickyWrapper>
            
//             <FeedWrapper>
//                 <div className="mb-6">
//                     <h1 className="text-3xl font-bold">🏆 Достижения</h1>
//                     <p className="text-gray-500 mt-1">
//                         Собирай достижения и получай награды!
//                     </p>
//                 </div>
                
//                 <AchievementsGrid 
//                     userId={userId}
//                     userAchievements={userAchievements}
//                 />
//             </FeedWrapper>
//         </div>
//     );
// };

// export default AchievementsPage;