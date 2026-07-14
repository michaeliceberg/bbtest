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
import { ParentBindCode } from '@/components/parent-bind-code';
import { cookies } from 'next/headers';
import { getCourseUnitsWithProgress } from '@/lib/lesson-access';
import { LearnWrapper } from '@/components/learn-wrapper';
import { generateHomework } from '@/actions/generate-homework';

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
  const missedCIds: number[] = [];

  const currentPoints = userProgress.points;
  const currentGems = userProgress.gems;
  const currentHearts = userProgress.hearts;
  const hwAssigned = todayStats?.hwAssigned || 0;
  const hwDone = todayStats?.hwDone || 0;
  const hwList = [hwAssigned, hwDone, 0];
  const isHwCompleted = todayStats?.hwCompleted ?? false;

  return (
    <LearnWrapper>
      <div className='flex flex-row-reverse gap-[48px] px-6'>
        <StickyWrapper>
          <UserProgress 
            activeCourse={activeCourse}
            hearts={currentHearts}
            points={currentPoints}
            gems={currentGems}
            hasActiveSubscription={false}
          />

          <ParentBindCode userId={userId} userName={userProgress.userName} />

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
          />

          <div className='mt-5'>
            {unitsWithFormattedLessons.map((unit, index) => (
              <div key={unit.id} className='mb-10'>
                <Unit 
                  id={unit.id}
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
                  missedCIds={missedCIds}
                  homeworkStatusMap={homeworkStatusMap}
                  isUnlocked={unit.isUnlocked}
                  isCompleted={unit.isCompleted}
                  unitProgressPercent={unit.percent}
                  needMoreLessons={unit.needMoreLessons}
                  isNextUnitUnlocked={unit.isNextUnitUnlocked}
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


