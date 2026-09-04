// app/(main)/reference/page.tsx
//
// Справочник формул — просматриваемый список (не квиз), чтобы ученик мог
// открыть и глазами пройтись по теме. Первый заход — только физика (см.
// обсуждение с пользователем: "начнём с физики, дешевле и есть данные",
// геометрия вторым заходом). Данные — не новый контент, а извлечение из
// уже существующих "Термины: ..." уроков тренажёра, см.
// scripts/seedPhysicsReference.ts.
//
// Сам layout (StickyWrapper/FeedWrapper/поиск+фильтр в сайдбаре) собран
// внутри клиентского ReferenceBrowser — там же живёт состояние поиска/
// фильтра, общее для обеих копий панели (десктопная в сайдбаре и
// мобильная над сеткой), см. комментарий в самом компоненте.

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
        <ReferenceBrowser
            entries={entries}
            userProgress={{
                activeCourse: userProgress.activeCourse,
                hearts: userProgress.hearts,
                points: userProgress.points,
                gems: userProgress.gems,
                xp: userProgress.xp,
            }}
        />
    );
};

export default ReferencePage;
