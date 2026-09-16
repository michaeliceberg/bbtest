// app/(main)/reference/page.tsx
//
// Справочник формул — просматриваемый список (не квиз), чтобы ученик мог
// открыть и глазами пройтись по теме. Данные — не новый контент, а
// извлечение/обобщение уже существующих задач тренажёра, см.
// scripts/seedPhysicsReference.ts (физика) и scripts/seedMathReference.ts
// (математика).
//
// Раньше страница жёстко показывала ТОЛЬКО физику (PHYSICS_COURSE_ID) —
// поэтому кнопка "Справочник" на любой теме курса "Математика-11" вела на
// физический справочник (тема не находилась в списке — topicParam не
// совпадал ни с одной entries.topic, фильтр молча откатывался на "все
// темы" физики). Исправлено — читаем entries СРАЗУ ОБОИХ предметов и
// объединяем: раз topic — уникальная строка на предмет (темы физики и
// математики не пересекаются по названию), клиентский фильтр по topic
// (уже был в ReferenceBrowser, не менялся) сам находит нужную тему из
// объединённого списка, никакого resolve "какой именно курс сейчас
// активен" не требуется.
//
// Сам layout (StickyWrapper/FeedWrapper/поиск+фильтр в сайдбаре) собран
// внутри клиентского ReferenceBrowser — там же живёт состояние поиска/
// фильтра, общее для обеих копий панели (десктопная в сайдбаре и
// мобильная над сеткой), см. комментарий в самом компоненте.

import { auth } from '@/lib/server-auth';
import { redirect } from 'next/navigation';
import { getUserProgress, getReferenceEntries } from '@/db/queries';
import { ReferenceBrowser } from '@/components/reference-browser';

const PHYSICS_COURSE_ID = 12; // "ЕГЭ Физика"
const MATH_COURSE_ID = 11;    // "ЕГЭ Математика Профиль"

const ReferencePage = async () => {
    const session = await auth();
    if (!session?.user) redirect('/');

    const userProgress = await getUserProgress();
    if (!userProgress || !userProgress.activeCourse) {
        redirect('/courses');
    }

    const [physicsEntries, mathEntries] = await Promise.all([
        getReferenceEntries(PHYSICS_COURSE_ID),
        getReferenceEntries(MATH_COURSE_ID),
    ]);
    // По прямой просьбе пользователя — справочник разделён на разделы по
    // предмету (вкладки "Физика-11"/"Математика-11", те же названия, что
    // уже используются как заголовки вкладок предмета в /trainer), а не
    // одним общим списком тем вперемешку. Тег добавляется здесь, на
    // сервере — раз мы и так знаем источник (какой courseId дал каждую
    // группу), нет смысла гадать предмет по названию темы на клиенте.
    const entries = [
        ...physicsEntries.map((e) => ({ ...e, subject: 'Физика-11' })),
        ...mathEntries.map((e) => ({ ...e, subject: 'Математика-11' })),
    ];

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
