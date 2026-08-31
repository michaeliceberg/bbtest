// app/learn/page.tsx

import { FeedWrapper } from '@/components/feed-wrapper';
import { StickyWrapper } from '@/components/sticky-wrapper';
import { UserProgress } from '@/components/user-progress';
import { 
  getChallengeProgress,
  getCourses,
  getTodayStats,
  getUserAllStatsByCourse,
  getUserCourseProgress,
  getUserHomework,
  getUserProgress
} from '@/db/queries';
import { redirect } from 'next/navigation';
import { Header } from './header';
import { Unit } from './unit';
import { format } from 'date-fns';
import { Promo } from '@/components/promo';
import { Quests } from '@/components/quests';
import { HomeworkList } from '@/components/homework-list';
import { auth } from '@/lib/server-auth';
import { recalculateDailyStats } from '@/actions/recalculate-daily-stats';
import { cookies } from 'next/headers';
import { getCourseUnitsWithProgress } from '@/lib/lesson-access';
import { LearnWrapper } from '@/components/learn-wrapper';
import { generateHomework } from '@/actions/generate-homework';
import { ScrollToLesson } from '@/components/scroll-to-lesson';
import { LevelCard } from '@/components/level-card';
import { getLvlLottieCount } from '@/lib/lvl-lottie';
import { StreakRiskBanner } from '@/components/streak-risk-banner';
import { Suspense } from 'react';

const bgList = [
  '/bg-svg/anchors-away.svg',
  '/bg-svg/Usersaztec.svg',
  '/bg-svg/bubbles.svg',
  '/bg-svg/circles-and-squares.svg',
  '/bg-svg/cutout.svg',
  '/bg-svg/floating-cogs.svg',
  '/bg-svg/glamorous.svg',
  '/bg-svg/i-like-food.svg',
  '/bg-svg/jigsaw.svg',
  '/bg-svg/leaf.svg',
  '/bg-svg/random-shapes.svg',
  '/bg-svg/skulls.svg',
  '/bg-svg/tic-tac-toe.svg',
  '/bg-svg/topography.svg',
  '/bg-svg/yyy.svg',
];

const randomizeArray = [...bgList].sort(() => 0.5 - Math.random());

interface LessonStat {
  lesson: number;
  done: number[];
  unitId: number;
  unitTitle: string;
  percentageDoneLesson: number;
}

const LearnPage = async () => {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/');
  }

  const userId = session.user.id;

  const cookieStore = cookies();
  const activeCourseIdFromCookie = cookieStore.get('activeCourseId')?.value;
  
  const [userProgress, allCourses] = await Promise.all([
    getUserProgress(),
    getCourses()
  ]);

  if (!userProgress) {
    redirect('/courses');
  }

  let activeCourse = userProgress.activeCourse;
  
  if (activeCourseIdFromCookie) {
    const foundCourse = allCourses.find(c => c.id === parseInt(activeCourseIdFromCookie));
    if (foundCourse) {
      activeCourse = foundCourse;
    }
  }
  
  if (!activeCourse) {
    redirect('/courses');
  }

  const activeCourseId = activeCourse.id;

  await recalculateDailyStats(userId, activeCourseId);

  // ✅ Просто вызываем generateHomework - он сам проверит существование
  await generateHomework(activeCourseId);

  // ✅ И получаем ДЗ (уже с учётом нового или существующего)
  const allHomework = await getUserHomework(userId, activeCourseId);


  const [challengeProgress, todayStats, allStats, courseProgressData, unitsWithProgress] = await Promise.all([
    getChallengeProgress(),
    getTodayStats(activeCourseId),
    getUserAllStatsByCourse(activeCourseId),
    getUserCourseProgress(activeCourseId),
    getCourseUnitsWithProgress(userId, activeCourseId)
  ]);

  if (!challengeProgress) {
    redirect('/learn');
  }

  const homeworkStatusMap = new Map<number, { homeworkId: number; status: string; dueDate: Date; correctCount: number; totalCount: number }>();
  const lessonStatsMap = new Map<number, LessonStat>();
  
  const activeHomework = allHomework.filter((h) => h.status === 'pending');
  const expiredHomework = allHomework.filter((h) => h.status === 'expired');
  const completedHomework = allHomework.filter((h) => h.status === 'completed');
  
  [...activeHomework, ...expiredHomework].forEach((hw) => {
    if (hw.challengeIds) {
      const challengeIds = hw.challengeIds.split(',').map(Number);
      challengeIds.forEach((challengeId: number) => {
        homeworkStatusMap.set(challengeId, {
          homeworkId: hw.id,
          status: hw.status,
          dueDate: hw.dueDate,
          correctCount: hw.correctCount,
          totalCount: hw.totalCount,
        });
      });
    }
  });

  for (const unit of unitsWithProgress) {
    for (const lesson of unit.lessons || []) {
      const challenges = lesson.challenges || [];
      let doneRight = 0;
      let doneWrong = 0;
      let numChallengesInLesson = challenges.length;

      for (const challenge of challenges) {
        const progress = challengeProgress?.find(cp => cp.challengeId === challenge.id && cp.completed);
        if (progress) {
          if (progress.doneRight) {
            doneRight++;
          } else {
            doneWrong++;
          }
        }
      }

      const percentageDone = numChallengesInLesson > 0
        ? Math.round(((doneRight + doneWrong) / numChallengesInLesson) * 100) / 100
        : 0;

      lessonStatsMap.set(lesson.id, {
        lesson: lesson.id,
        unitId: unit.id,
        unitTitle: unit.title,
        done: [numChallengesInLesson, doneRight, doneWrong],
        percentageDoneLesson: percentageDone,
      });
    }
  }

  const lessonStat: LessonStat[] = Array.from(lessonStatsMap.values());

  // Урок, в котором последний раз решали задачи в этом курсе — чтобы после
  // переключения курса плавно проскроллить туда и показать "Продолжить".
  const challengeToLessonId = new Map<number, number>();
  for (const unit of unitsWithProgress) {
    for (const lesson of unit.lessons || []) {
      for (const ch of lesson.challenges || []) {
        challengeToLessonId.set(ch.id, lesson.id);
      }
    }
  }
  let lastTouchedLessonId: number | null = null;
  let lastTouchedTime = 0;
  for (const cp of challengeProgress ?? []) {
    const lessonId = challengeToLessonId.get(cp.challengeId);
    if (!lessonId || !cp.dateDone) continue;
    const t = new Date(cp.dateDone).getTime();
    if (t > lastTouchedTime) {
      lastTouchedTime = t;
      lastTouchedLessonId = lessonId;
    }
  }

  const unitsWithFormattedLessons = unitsWithProgress.map(unit => ({
    ...unit,
    lessons: unit.lessons?.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      order: lesson.order,
      unitId: lesson.unitId,
      completed: lesson.completed || false,
      challenges: lesson.challenges.map(challenge => ({
        id: challenge.id,
        type: challenge.type,
        question: challenge.question,
        order: challenge.order,
        points: challenge.points,
        author: challenge.author,
        difficulty: challenge.difficulty,
        imageSrc: challenge.imageSrc,
        lessonId: challenge.lessonId,
      })),
    })) || [],
  }));

  const totalChallenges = lessonStat.reduce((sum, l) => sum + l.done[0], 0);
  const totalDone = lessonStat.reduce((sum, l) => sum + l.done[1] + l.done[2], 0);
  const totalLeft = totalChallenges - totalDone;

  const examDate = new Date(2026, 5, 1);
  const now = new Date();
  const daysToExam = Math.max(1, Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 3600 * 24)));

  const recommendedPerDay = Math.round((totalLeft / daysToExam) * 100) / 100;
  const recommendedToday = Math.max(1, Math.round(recommendedPerDay * 4));

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const lastWeekChallenges = challengeProgress?.filter(cp => 
    lessonStat.some(l => l.done[0] === cp.challengeId) && 
    new Date(cp.dateDone) > weekAgo
  ) || [];

  const challengesPerDayLastWeek = lastWeekChallenges.length / 7;
  const currentPerDay = Math.max(1, Math.round(challengesPerDayLastWeek * 100) / 100);

  const daysToFinish = Math.round(totalLeft / currentPerDay);
  const finishDate = new Date(now.getTime() + daysToFinish * 24 * 60 * 60 * 1000);
  const formattedFinishDate = format(finishDate, 'dd.MM.yyyy');
  const daysLate = daysToFinish - daysToExam;

  const bgSvgSrc = randomizeArray.slice(0, unitsWithFormattedLessons.length);
  const courseProgressPercent = courseProgressData?.progressPercent || 0;
  // Задачи из активных (ещё не сданных) заданий — раздельно ДЗ от учителя
  // (🍩) и челлендж дня (⚡), чтобы над названием урока была верная иконка.
  const collectActiveChallengeIds = (type: 'teacher' | 'daily') =>
    Array.from(
      new Set(
        activeHomework
          .filter((hw) => hw.type === type)
          .flatMap((hw) => (hw.challengeIds ? hw.challengeIds.split(',').map(Number) : []))
      )
    );
  const teacherMissedCIds = collectActiveChallengeIds('teacher');
  const dailyMissedCIds = collectActiveChallengeIds('daily');

  const currentPoints = userProgress.points;
  const currentGems = userProgress.gems;
  const currentHearts = userProgress.hearts;
  const currentXp = userProgress.xp;
  const isAdmin = userProgress.isAdmin === 1;
  const hwAssigned = todayStats?.hwAssigned || 0;
  const hwDone = todayStats?.hwDone || 0;
  const hwList = [hwAssigned, hwDone, 0];
  const isHwCompleted = todayStats?.hwCompleted ?? false;

  // "Ударный режим под угрозой" (components/streak-risk-banner.tsx) —
  // сама проверка часа ("поздно ли уже") целиком на клиенте (локальное
  // время браузера), здесь только честно считаем "продлевал ли сегодня".
  const currentStreak = courseProgressData?.streak ?? 0;
  const streakLastActive = courseProgressData?.lastActiveDate ? new Date(courseProgressData.lastActiveDate) : null;
  if (streakLastActive) streakLastActive.setHours(0, 0, 0, 0);
  const todayForStreak = new Date();
  todayForStreak.setHours(0, 0, 0, 0);
  const hasExtendedStreakToday = !!streakLastActive && streakLastActive.getTime() === todayForStreak.getTime();

  return (
    <LearnWrapper courseId={activeCourseId}>
      <Suspense fallback={null}>
        <ScrollToLesson lessonId={lastTouchedLessonId} />
      </Suspense>
      <div className='flex flex-row-reverse gap-[48px] px-6'>
        <StickyWrapper>
          <UserProgress
            activeCourse={activeCourse}
            hearts={currentHearts}
            points={currentPoints}
            gems={currentGems}
            xp={currentXp}
            hasActiveSubscription={false}
          />

          <HomeworkList
            activeHomework={activeHomework}
            expiredHomework={expiredHomework}
            completedHomework={completedHomework}
          />

          <Promo 
            YourDaysLate={daysLate} 
            formattedDate={formattedFinishDate}
          />
          
          <Quests 
            points={currentPoints} 
            hwList={hwList}
            isCompleted={isHwCompleted}
          />
        </StickyWrapper>

        <FeedWrapper>
          <Header
            title={activeCourse.title}
            progressPercent={courseProgressPercent}
            courseId={activeCourse.id}
          />

          <div className='mt-2 lg:mt-5'>
            <StreakRiskBanner streak={currentStreak} hasExtendedToday={hasExtendedStreakToday} />

            <div className='mb-4'>
              <LevelCard xp={currentXp} lvlLottieCount={getLvlLottieCount()} />
            </div>

            {unitsWithFormattedLessons.map((unit, index) => (
              <div key={unit.id} className='mb-10'>
                <Unit
                  id={unit.id}
                  unitIndex={index}
                  order={unit.order}
                  description={unit.description}
                  title={unit.title}
                  lessons={unit.lessons}
                  activeLesson={undefined}
                  lessonStat={lessonStat}
                  percentageDone={0}
                  imgSrc={unit.imageSrc}
                  RecomNumChallengesToday={recommendedToday}
                  bgSvgSrc={bgSvgSrc[index]}
                  missedCIds={teacherMissedCIds}
                  dailyMissedCIds={dailyMissedCIds}
                  homeworkStatusMap={homeworkStatusMap}
                  isUnlocked={unit.isUnlocked}
                  isCompleted={unit.isCompleted}
                  unitProgressPercent={unit.percent}
                  needMoreLessons={unit.needMoreLessons}
                  isNextUnitUnlocked={unit.isNextUnitUnlocked}
                  isAdmin={isAdmin}
                  lastTouchedLessonId={lastTouchedLessonId}
                />
              </div>
            ))}
          </div>
        </FeedWrapper>
      </div>
    </LearnWrapper>
  );
};

export default LearnPage;


