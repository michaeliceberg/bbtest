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
    // Разделы по предмету — тег добавляется здесь, на сервере — раз мы и
    // так знаем источник (какой courseId дал каждую группу), нет смысла
    // гадать предмет по названию темы на клиенте. Названия совпадают с
    // courses.title ("ЕГЭ Физика"/"ЕГЭ Математика").
    const PHYSICS_SUBJECT = 'ЕГЭ Физика';
    const MATH_SUBJECT = 'ЕГЭ Математика';
    const entries = [
        ...physicsEntries.map((e) => ({ ...e, subject: PHYSICS_SUBJECT })),
        ...mathEntries.map((e) => ({ ...e, subject: MATH_SUBJECT })),
    ];

    // По прямой просьбе пользователя (2026-09-23) — больше не показываем
    // отдельный переключатель предмета, а сразу открываем раздел,
    // соответствующий активному курсу задачника (та же идея, что уже
    // реализована в /trainer через resolveActiveTCourse — там курс тоже
    // молча решает, какая тема тренажёра открыта). Курс без своего
    // раздела справочника (ЛНИП/ОГЭ) — фоллбэк на физику, тот же порядок,
    // что был у subjects[0] раньше.
    const defaultSubject =
        userProgress.activeCourse.id === MATH_COURSE_ID ? MATH_SUBJECT : PHYSICS_SUBJECT;

    return (
        <ReferenceBrowser
            entries={entries}
            defaultSubject={defaultSubject}
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
