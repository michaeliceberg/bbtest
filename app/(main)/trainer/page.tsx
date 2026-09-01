// app/(main)/trainer/page.tsx

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
import { cookies } from 'next/headers';
import { Header } from './header';
import { TabTCourses } from '@/components/tab-t-courses';
import { HwTopBanner } from '../learn/hw-top-banner';
import { auth } from '@/lib/auth';
import { getDailyQuestStatus, getRecentQuestHistory } from '@/actions/generate-trainer-quest';
import { TrainerQuestCard } from '@/components/trainer-quest-card';
import { LevelCard } from '@/components/level-card';
import { getLvlLottieCount } from '@/lib/lvl-lottie';
import { StreakRiskBanner } from '@/components/streak-risk-banner';
import { getUserCourseProgress } from '@/db/queries';

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
        t_coursesRaw,
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

    // М9 и Физика-9 временно скрыты из тренажёра (пусто/не готово) — не
    // мешают, но не удалены из БД, легко вернуть обратно.
    const HIDDEN_T_COURSE_IDS = [1, 2];
    const t_courses = t_coursesRaw.filter((c) => !HIDDEN_T_COURSE_IDS.includes(c.id));

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

    // ========== КВЕСТ (пройди 1 урок тренажёра + реши 1 задачу курса) ==========
    // Та же тема тренажёра, что и на /learn (там — по activeCourseId,
    // курс, который пользователь сейчас реально изучает; связь через
    // t_courses.courseId) — раньше здесь брался безусловно t_courses[0]
    // (первая по id тема), из-за чего "Квест дня" на /trainer и /learn мог
    // показывать РАЗНЫЕ темы тренажёра и, соответственно, рассинхронное
    // состояние "пройди урок тренажёра" — пользователь проходил урок под
    // активным курсом, /learn корректно засчитывал квест именно этой темы,
    // а /trainer продолжал спрашивать статус первой попавшейся другой темы.
    // Без cookie/активного курса (не должно случаться после редиректов выше,
    // но на всякий случай) — откат на старое поведение (первая тема).
    const activeCourseIdFromCookie = cookies().get('activeCourseId')?.value;
    const resolvedActiveCourseId = activeCourseIdFromCookie
        ? parseInt(activeCourseIdFromCookie)
        : userProgress.activeCourse.id;
    const activeTCourse = t_courses.find((tc) => tc.courseId === resolvedActiveCourseId) ?? t_courses[0];
    const dailyQuest = activeTCourse ? await getDailyQuestStatus(activeTCourse.id) : null;
    const questHistory = activeTCourse ? await getRecentQuestHistory(activeTCourse.id) : [];

    const currentPoints = userProgress.points;
    const currentGems = userProgress.gems;
    const currentHearts = userProgress.hearts;
    const currentXp = userProgress.xp;

    // "Ударный режим под угрозой" (components/streak-risk-banner.tsx) —
    // тот же единый курсовый стрик, что и на /learn (см. lib/streak.ts),
    // читаем через привязанный к теме тренажёра courseId (t_courses.courseId,
    // nullable — у части тем привязки может не быть, тогда banner тихо не
    // рендерится, т.к. currentStreakForRisk останется 0).
    let currentStreakForRisk = 0;
    let hasExtendedStreakToday = false;
    if (activeTCourse?.courseId) {
        const linkedCourseProgress = await getUserCourseProgress(activeTCourse.courseId);
        currentStreakForRisk = linkedCourseProgress?.streak ?? 0;
        const lastActive = linkedCourseProgress?.lastActiveDate ? new Date(linkedCourseProgress.lastActiveDate) : null;
        if (lastActive) lastActive.setHours(0, 0, 0, 0);
        const todayForStreak = new Date();
        todayForStreak.setHours(0, 0, 0, 0);
        hasExtendedStreakToday = !!lastActive && lastActive.getTime() === todayForStreak.getTime();
    }

    return (
        <div className='flex flex-row-reverse gap-[48px] px-6'>
            <StickyWrapper>
                <UserProgress
                    activeCourse={userProgress.activeCourse}
                    hearts={currentHearts}
                    points={currentPoints}
                    gems={currentGems}
                    xp={currentXp}
                    hasActiveSubscription={false}
                />

                {/* Квест тренажера */}
                {dailyQuest && (
                    <TrainerQuestCard
                        trainerDone={dailyQuest.trainerDone}
                        taskDone={dailyQuest.taskDone}
                        isCompleted={dailyQuest.isCompleted}
                        streak={dailyQuest.streak}
                        dueDateIso={dailyQuest.dueDateIso}
                        pointsReward={dailyQuest.pointsReward}
                        history={questHistory}
                    />
                )}
            </StickyWrapper>

            <FeedWrapper>
                <Header title="Тренажёр" />

                <div className='mt-2 lg:mt-5'>
                    <StreakRiskBanner streak={currentStreakForRisk} hasExtendedToday={hasExtendedStreakToday} />

                    <div className='mb-4'>
                        <LevelCard xp={currentXp} lvlLottieCount={getLvlLottieCount()} />
                    </div>

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
                    />
                </div>
            </FeedWrapper>
        </div>
    );
};

export default TLearnPage;

