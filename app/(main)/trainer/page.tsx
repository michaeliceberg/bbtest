// app/trainer/page.tsx

import { FeedWrapper } from '@/components/feed-wrapper';
import { StickyWrapper } from '@/components/sticky-wrapper';
import { UserProgress } from '@/components/user-progress';
import { 
    getAllClassHW, 
    getAllClasses, 
    getAllTLessonProgress, 
    getAllUsers, 
    getAllUsersProgress, 
    getChallengeProgress, 
    getCourseProgress, 
    getTCourses, 
    getTLessonProgress, 
    getTUnits, 
    getUserProgress 
} from '@/db/queries';
import { redirect } from 'next/navigation';
import { Header } from './header';
import { TabTCourses } from '@/components/tab-t-courses';
import { HwTopBanner } from '../learn/hw-top-banner';
import { auth } from '@/lib/auth';
import { generateDailyTrainerQuest } from '@/actions/generate-trainer-quest';
import { TrainerQuestCard } from '@/components/trainer-quest-card';
import { ParentBindCode } from '@/components/parent-bind-code';
import db from '@/db/drizzle';
import { and, eq } from 'drizzle-orm';
import { trainerStreaks } from '@/db/schema';

const TLearnPage = async () => {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        redirect('/login');
    }

    // Получаем все данные
    const t_coursesData = getTCourses();
    const userProgressData = getUserProgress();
    const courseProgressData = getCourseProgress();
    const challengeProgressData = getChallengeProgress();
    const t_unitsData = getTUnits();
    const userTLessonProgressData = getTLessonProgress();
    const userAllTLessonProgressData = getAllTLessonProgress();
    const allUsersProgressData = getAllUsersProgress();
    const allClassesData = getAllClasses();
    const allClassHWData = getAllClassHW();
    const allUsersData = getAllUsers();

    const [
        t_courses,
        userProgress,
        t_units,
        courseProgress,
        challengeProgress,
        t_lessonProgress,
        all_t_lessonProgress,
        allUsersProgress,
        allClasses,
        allClassHW,
        allUsers,
    ] = await Promise.all([
        t_coursesData,
        userProgressData,
        t_unitsData,
        courseProgressData,
        challengeProgressData,
        userTLessonProgressData,
        userAllTLessonProgressData,
        allUsersProgressData,
        allClassesData,
        allClassHWData,
        allUsersData,
    ]);

    if (!userProgress || !userProgress.activeCourse || !allClasses) {
        redirect('/courses');
    }

    if (!courseProgress) {
        redirect('/courses');
    }

    if (!challengeProgress) {
        redirect('/learn');
    }

    if (!t_units) {
        redirect('/learn');
    }

    const ThisClassId = userProgress.classId;

    // ========== ДАННЫЕ ДЛЯ РЕЙТИНГА ==========
    const UniqueLessonIds = all_t_lessonProgress.map(el => el.t_lessonId)
        .filter((value, index, current_value) => current_value.indexOf(value) === index);

    const TRatingUsers = UniqueLessonIds.map(t_lesson_id => {
        const currentLessonProgress = all_t_lessonProgress.filter(progress => progress.t_lessonId == t_lesson_id);
        const UniqueUserIds = currentLessonProgress.map(el => el.userId)
            .filter((value, index, current_value) => current_value.indexOf(value) === index);

        const usersStat = UniqueUserIds.map(user_id => {
            const CLCUProgress = currentLessonProgress.filter(progress => progress.userId == user_id);
            let DRP = 0;
            const doneRight = CLCUProgress.reduce((total, elem) => total + elem.doneRight, 0);
            const doneWrong = CLCUProgress.reduce((total, elem) => total + elem.doneWrong, 0);
            if (doneRight + doneWrong > 0) {
                DRP = doneRight / (doneRight + doneWrong);
            }
            const DR_DRP = doneRight * DRP;
            return {
                DRP: Math.round(DRP * 100),
                DR_DRP: DR_DRP,
                user_id: allUsersProgress?.filter(pr => pr.userId == user_id)[0]?.userId,
                user_name: allUsersProgress?.filter(pr => pr.userId == user_id)[0]?.userName,
            };
        });
        usersStat.sort((a, b) => b.DR_DRP - a.DR_DRP);
        return { t_lesson_id: t_lesson_id, usersSortedStat: usersStat };
    });

    // ========== ДАННЫЕ ДЛЯ HW BANNER ==========
    const usersThisClass = allUsers.filter(user => user.classId == ThisClassId);
    const thisClassHW = allClassHW?.filter(el => el.classId == ThisClassId);

    const big = usersThisClass.map(user => {
        const lessonsDoneByThisUser = all_t_lessonProgress.filter(t_less_propg => t_less_propg.userId == user.userId);
        if (thisClassHW) {
            const thisUserListHWStat = thisClassHW.map(cur_hw => {
                let controlMultiplyTrainer = 1;
                let ListOfMissedLessonsIds: number[] = [];
                const hw_trainer_string = cur_hw.taskTrainer;
                if (hw_trainer_string != null && hw_trainer_string != "") {
                    const hw_trainer = hw_trainer_string.split(',').map((str) => Number(str));
                    hw_trainer.map(cur_les_in_hw => {
                        const doneRightPercent = lessonsDoneByThisUser.filter(lessonDone => lessonDone.t_lessonId == cur_les_in_hw)[0]?.doneRightPercent;
                        const timesDoneCurLessonAfterHWDate = lessonsDoneByThisUser.filter(lessonDone =>
                            (lessonDone.t_lessonId == cur_les_in_hw) && (lessonDone.dateDone > cur_hw.dateHw))?.length;
                        if (doneRightPercent > 90 && timesDoneCurLessonAfterHWDate > 0) {
                            // ничего не делаем
                        } else {
                            controlMultiplyTrainer = controlMultiplyTrainer * 0;
                            ListOfMissedLessonsIds.push(cur_les_in_hw);
                        }
                    });
                }
                return {
                    dateHW: cur_hw.dateHw,
                    isDone: controlMultiplyTrainer,
                    ListOfMissedLessonsIds: ListOfMissedLessonsIds,
                };
            });
            return {
                thisUserListHWStat: thisUserListHWStat,
                userName: user.userName,
                userId: user.userId,
            };
        }
    });

    const thisUserStatHW = big.filter(user => user?.userId == userProgress.userId)[0];
    let missedLIds: number[] = [];
    thisUserStatHW?.thisUserListHWStat.map(cur_hw => {
        cur_hw.ListOfMissedLessonsIds.map(lesson_id => {
            missedLIds.push(lesson_id);
        });
    });

    // ========== КВЕСТЫ И СТРИКИ ==========
    const activeTCourse = t_courses[0];
    let questWithLessons = null;
    let streak = 0;

    if (activeTCourse && t_units) {
        // Генерируем квест на сегодня
        const quest = await generateDailyTrainerQuest(activeTCourse.id);
        
        // Получаем стрик
        const streakData = await db.query.trainerStreaks.findFirst({
            where: and(
                eq(trainerStreaks.userId, userId),
                eq(trainerStreaks.tCourseId, activeTCourse.id)
            ),
        });
        streak = streakData?.currentStreak || 0;

        // Получаем детали уроков для квеста
        if (quest && quest.tLessonIds) {
            const lessonIds = quest.tLessonIds.split(',').map(Number);
            
            if (lessonIds.length > 0) {
                // Собираем все уроки из t_units (они уже содержат t_lessons)
                const allLessons: { id: number; title: string }[] = [];
                for (const unit of t_units) {
                    if (unit.t_courseId === activeTCourse.id && unit.t_lessons) {
                        for (const lesson of unit.t_lessons) {
                            allLessons.push({
                                id: lesson.id,
                                title: lesson.title,
                            });
                        }
                    }
                }
                
                // Фильтруем нужные уроки
                const questLessons = allLessons.filter(l => lessonIds.includes(l.id));
                
                // Используем уже полученный t_lessonProgress
                const completedIds = t_lessonProgress
                    .filter(lp => lessonIds.includes(lp.t_lessonId) && lp.doneRightPercent === 100)
                    .map(lp => lp.t_lessonId);
                
                questWithLessons = {
                    ...quest,
                    isCompleted: quest.isCompleted === true,
                    lessons: questLessons.map(l => ({
                        id: l.id,
                        title: l.title,
                        completed: completedIds.includes(l.id),
                    })),
                };
            }
        }
    }

    // Собираем ID уроков, которые входят в сегодняшний квест
    let questLessonIds: number[] = [];
    if (questWithLessons && questWithLessons.tLessonIds) {
        questLessonIds = questWithLessons.tLessonIds.split(',').map(Number);
    }

    const currentPoints = userProgress.points;
    const currentGems = userProgress.gems;
    const currentHearts = userProgress.hearts;

    return (
        <div className='rounded-3xl bg-game-bg -mx-4 px-4 py-6 md:mx-0 md:px-6'>
        <div className='flex flex-row-reverse gap-[48px]'>
            <StickyWrapper>
                <UserProgress
                    activeCourse={userProgress.activeCourse}
                    hearts={currentHearts}
                    points={currentPoints}
                    gems={currentGems}
                    hasActiveSubscription={false}
                    theme='dark'
                />

                <ParentBindCode userId={userId} userName={userProgress.userName} />

                {/* Квест тренажера */}
                {activeTCourse && questWithLessons && (
                    <TrainerQuestCard 
                        quest={questWithLessons}
                        streak={streak}
                        tCourseId={activeTCourse.id}
                    />
                )}
            </StickyWrapper>

            <FeedWrapper>
                <Header title="Тренажёр" />

                <div className='content-center mx-auto justify-center text-center align-middle'>
                    <HwTopBanner missedCIds={missedLIds} variant='trainer' />
                </div>

                <TabTCourses 
                    t_courses={t_courses} 
                    t_units={t_units} 
                    t_lessonProgress={t_lessonProgress}
                    TRatingUsers={TRatingUsers}
                    user_id={userProgress.userId}
                    allClasses={allClasses}
                    allClassHW={allClassHW}
                    allUsers={allUsers}
                    all_t_lessonProgress={all_t_lessonProgress}
                    this_class_id={userProgress.classId}
                    questLessonIds={questLessonIds}
                />
            </FeedWrapper>
        </div>
        </div>
    );
};

export default TLearnPage;

