// app/(main)/reference/page.tsx
//
// Справочник формул — просматриваемый список (не квиз), чтобы ученик мог
// открыть и глазами пройтись по теме. Первый заход — только физика (см.
// обсуждение с пользователем: "начнём с физики, дешевле и есть данные",
// геометрия вторым заходом). Данные — не новый контент, а извлечение из
// уже существующих "Термины: ..." уроков тренажёра, см.
// scripts/seedPhysicsReference.ts.

import { FeedWrapper } from '@/components/feed-wrapper';
import { StickyWrapper } from '@/components/sticky-wrapper';
import { UserProgress } from '@/components/user-progress';
import { auth } from '@/lib/server-auth';
import { redirect } from 'next/navigation';
import { getUserProgress, getReferenceEntries } from '@/db/queries';
import { ReferenceBrowser } from '@/components/reference-browser';

const PHYSICS_COURSE_ID = 12; // "ЕГЭ Физика" — единственный предмет со справочником пока

const ReferencePage = async () => {
    const session = await auth();
    if (!session?.user) redirect('/');

    const userProgress = await getUserProgress();
    if (!userProgress || !userProgress.activeCourse) {
        redirect('/courses');
    }

    const entries = await getReferenceEntries(PHYSICS_COURSE_ID);

    return (
        <div className='flex flex-row-reverse gap-[48px] px-6'>
            <StickyWrapper>
                <UserProgress
                    activeCourse={userProgress.activeCourse}
                    hearts={userProgress.hearts}
                    points={userProgress.points}
                    gems={userProgress.gems}
                    xp={userProgress.xp}
                    hasActiveSubscription={false}
                />
            </StickyWrapper>

            <FeedWrapper>
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">📖 Справочник</h1>
                    <p className="text-[#9AA7B0] mt-1">
                        Все формулы и единицы измерения по физике — открой и повтори любую тему.
                    </p>
                </div>

                <ReferenceBrowser entries={entries} />
            </FeedWrapper>
        </div>
    );
};

export default ReferencePage;
