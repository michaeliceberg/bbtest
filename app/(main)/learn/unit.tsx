// app/learn/unit.tsx

import { lessons, units } from "@/db/schema";
import { UnitBanner } from "./unit-banner";
import { LessonButton } from "./lesson-button";

interface lessonDone {
    lesson: number;
    done: number[];
}

type SimpleChallenge = {
    id: number;
    type: string;
    question: string;
    order: number;
    points: number;
    author: string;
    difficulty: string;
    imageSrc: string;
    lessonId: number;
}

type Props = {
    id: number;
    order: number;
    title: string;
    description: string;
    
    lessons: {
        completed: boolean;
        id: number;
        title: string;
        order: number;
        unitId: number;
        challenges: SimpleChallenge[]
    }[]

    activeLesson: typeof lessons.$inferSelect & {
        unit: typeof units.$inferSelect;
    } | undefined;
    lessonStat: Array<lessonDone>;
    imgSrc: string;
    percentageDone: number;
    RecomNumChallengesToday: number;
    bgSvgSrc: string,
    missedCIds: number[],
    homeworkStatusMap: Map<number, { homeworkId: number; status: string; dueDate: Date; correctCount: number; totalCount: number }>;
    
    // Новые пропсы от родителя
    isUnlocked?: boolean;
    isCompleted?: boolean;
    unitProgressPercent?: number;
    needMoreLessons?: number;
    isNextUnitUnlocked?: boolean;
}

// Количество задач, необходимых для открытия следующего урока
const CHALLENGES_TO_UNLOCK_NEXT_LESSON = 4;

export const Unit = ({
    id,
    order,
    title,
    description,
    lessons,
    activeLesson,
    lessonStat,
    imgSrc,
    percentageDone,
    RecomNumChallengesToday,
    bgSvgSrc,
    missedCIds,
    homeworkStatusMap,
    isUnlocked = true,
    isCompleted = false,
    unitProgressPercent = 0,
    needMoreLessons = 0,
    isNextUnitUnlocked = false,
}: Props) => {
    // Если юнит заблокирован и не завершён — все уроки locked
    const isUnitLocked = !isUnlocked && !isCompleted;
    
    // Вычисляем, сколько задач решено в каждом уроке
    const getLessonProgress = (lessonId: number): { correct: number; total: number } => {
        const stat = lessonStat.find(ls => ls.lesson === lessonId);
        if (!stat) return { correct: 0, total: 0 };
        return {
            correct: stat.done[1], // doneRight
            total: stat.done[0],
        };
    };
    
    // Определяем, открыт ли урок
    const isLessonUnlocked = (index: number): boolean => {
        if (isUnitLocked) return false;
        
        // Первый урок всегда открыт
        if (index === 0) return true;
        
        // Проверяем предыдущий урок
        const prevLesson = lessons[index - 1];
        if (!prevLesson) return true;
        
        const progress = getLessonProgress(prevLesson.id);
        // Следующий урок открывается, если решено 4 задачи в предыдущем
        return progress.correct >= CHALLENGES_TO_UNLOCK_NEXT_LESSON;
    };
    
    return (
        <>
            <UnitBanner 
                title={title} 
                description={description} 
                imgSrc={imgSrc} 
                id={id} 
                percentageDone={percentageDone} 
                bgSvgSrc={bgSvgSrc}
                isUnlocked={isUnlocked}
                isCompleted={isCompleted}
                unitProgressPercent={unitProgressPercent}
                needMoreLessons={needMoreLessons}
                isNextUnitUnlocked={isNextUnitUnlocked}
            />
            <div className="flex items-center flex-col relative">
                {lessons.map((lesson, index) => {
                    const isCurrent = lesson.id === activeLesson?.id;
                    const lessonProgress = getLessonProgress(lesson.id);
                    const isLessonCompleted = lessonProgress.correct >= lessonProgress.total && lessonProgress.total > 0;
                    const isUnlocked = isLessonUnlocked(index);
                    




                    // Убери проверку || lesson.completed из isLessonLocked:
                    // const isLessonLocked = isUnitLocked || !isUnlocked;
                    // // без проверки на completed, чтобы пройденные уроки были доступны


                    // Урок заблокирован, если:
                    // 1. Юнит заблокирован
                    // 2. ИЛИ урок не открыт по логике последовательности
                    // 3. ИЛИ урок уже пройден (можно сделать опциональным для повторения)
                    const isLessonLocked = isUnitLocked || !isUnlocked;
                    
                    // Для повторения: пройденные уроки тоже можно открыть, но сделаем их серыми
                    const isCompletedLesson = isLessonCompleted;
                    
                    return (
                        <LessonButton 
                            key={lesson.id} 
                            id={lesson.id}
                            index={index}
                            totalCount={lessons.length - 1}
                            current={isCurrent} 
                            locked={isLessonLocked}
                            title={lesson.title}
                            lessonStat={lessonStat}
                            missedCIds={missedCIds}
                            challengeIdsInLesson={lesson.challenges.map(el => el.id)}
                            homeworkStatus={null}
                            completed={isCompletedLesson}
                            // Дополнительные пропсы для отображения прогресса
                            needMore={CHALLENGES_TO_UNLOCK_NEXT_LESSON - lessonProgress.correct}
                            totalChallenges={lessonProgress.total}
                            correctChallenges={lessonProgress.correct}
                            challengesNeeded={CHALLENGES_TO_UNLOCK_NEXT_LESSON}
                        />
                    );
                })}
            </div>
        </>
    )
}


