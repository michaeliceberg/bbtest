'use server'

import db from "@/db/drizzle"
import { getUserProgress } from "@/db/queries"
import { SuperType, challengeProgress, challenges, progressType, userProgress } from "@/db/schema"
import { auth } from "@/lib/auth"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export const upsertChallengeProgress = async (
        challengeId: number, 
        doneRight: boolean, 
        oldCourseProgress: SuperType,
        activeCourseTitle: string,
        challengePts: number,
        isDoneChallenge: boolean,
    ) => {
    
    const session = await auth();  
    // Проверяем авторизацию
    if (!session?.user?.id) {
        throw new Error('Вы не авторизованы!');
    }	
    const userId = session.user.id;

    const currentUserProgress = await getUserProgress()

    if (!currentUserProgress) {
        throw new Error("У пользователя нет прогресса!")
    }

    const challenge = await db.query.challenges.findFirst({
        where: eq(challenges.id, challengeId)
    })

    if (!challenge) {
        throw new Error('Задание не найдено!')
    }

    const lessonId = challenge.lessonId

    const existingChallengeProgress = await db.query.challengeProgress.findFirst({
        where: and(
            eq(challengeProgress.userId, userId),
            eq(challengeProgress.challengeId, challengeId)
        )
    })

    const isPractice = !!existingChallengeProgress

    // HEARTS NEW

    if (currentUserProgress.hearts === 0 && !isPractice && 2 < 1) {
        return { error: "hearts"}
    }

    if (isPractice) {
        await db.update(challengeProgress).set({
            completed: true,
        })
        .where(
            eq(challengeProgress.id, existingChallengeProgress.id)
        )

        await db.update(userProgress).set({
            hearts: Math.min(currentUserProgress.hearts + 1, 5),

            


            points: isDoneChallenge ? currentUserProgress.points + 0 : currentUserProgress.points + challengePts
            // points: currentUserProgress.points + challengePts
        }).where(eq(userProgress.userId, userId))

        revalidatePath('/learn')
        revalidatePath('/lesson')
        revalidatePath('/progress')
        revalidatePath('/leaderboard')
        revalidatePath(`/lesson/${lessonId}`)
        return
    }


    // ВСТАВЛЯЕМ НОВЫЕ ДАННЫЕ В CHALLENGE PROGRESS
    // КОГДА РЕШИЛИ НОВЫЙ CHALLENGE
    //

    await db.insert(challengeProgress).values({
        challengeId,
        userId,
        completed: true,
        doneRight,
    })


   

    

   

    




    var today = new Date();
    var dd:number = today.getDate();
    var mm:number = today.getMonth()+1; 
    var yyyy:number = today.getFullYear();
    var TodayStr = dd + "."  + mm + "." + yyyy
    


    // let newCourseProgress = {
    let newCourseProgress:SuperType = [{
            course: activeCourseTitle,
        progress:[{
            date: TodayStr,
            hw: [10, 0, 0],
            selfDoneRight: doneRight ? 1 : 0,
            selfDoneWrong: doneRight ? 0 : 1,
            dateReady: '01.01.2125',
            hearts: 20,
            pts: doneRight ? challengePts : 0,
            gems: 0,
        }]
      }]


    if (oldCourseProgress instanceof Array) {
        //
        // Ищем Индекс название книги:
        //
        
        let indexCourse = oldCourseProgress.findIndex( el => el.course === activeCourseTitle );

        if (indexCourse > -1){
            //
            // Эта книга УЖЕ есть в прогрессе,
            // ищем индекс Сегодняшней ДАТЫ
            //

            let currentProgress:progressType = oldCourseProgress[indexCourse].progress

            if (currentProgress instanceof Array) {
                let indexDate = currentProgress.findIndex( el => el.date === TodayStr );
                if (indexDate > -1){
                    
                    //
                    // Нашли ДАТУ
                    // Обновляем данные в найденной КНИГЕ найденной ДАТЕ
                    //

                    // ЕСЛИ ПРАВИЛЬНО РЕШИЛ,ДОБАВЛЯЕМ В HW ДОМАШКУ +1
                    //
                    oldCourseProgress[indexCourse].progress[indexDate].hw = [
                        oldCourseProgress[indexCourse].progress[indexDate].hw[0],
                        (doneRight && oldCourseProgress[indexCourse].progress[indexDate].hw[0] > oldCourseProgress[indexCourse].progress[indexDate].hw[1])
                        ? oldCourseProgress[indexCourse].progress[indexDate].hw[1] + 1
                        : oldCourseProgress[indexCourse].progress[indexDate].hw[1]
                        ]
                    oldCourseProgress[indexCourse].progress[indexDate].selfDoneRight = doneRight ? oldCourseProgress[indexCourse].progress[indexDate].selfDoneRight + 1 : oldCourseProgress[indexCourse].progress[indexDate].selfDoneRight,
                    oldCourseProgress[indexCourse].progress[indexDate].selfDoneWrong = doneRight ? oldCourseProgress[indexCourse].progress[indexDate].selfDoneWrong : oldCourseProgress[indexCourse].progress[indexDate].selfDoneWrong + 1,
                    oldCourseProgress[indexCourse].progress[indexDate].hearts = doneRight ? oldCourseProgress[indexCourse].progress[indexDate].hearts : oldCourseProgress[indexCourse].progress[indexDate].hearts - 1
                    oldCourseProgress[indexCourse].progress[indexDate].pts = 
                        isDoneChallenge ? oldCourseProgress[indexCourse].progress[indexDate].pts 
                        : doneRight ? oldCourseProgress[indexCourse].progress[indexDate].pts + challengePts : oldCourseProgress[indexCourse].progress[indexDate].pts


                        
                    

                    await db.update(userProgress).set({
                        points: 
                            isDoneChallenge ? currentUserProgress.points :
                            doneRight ? currentUserProgress.points + challengePts : currentUserProgress.points,
                        courseProgress: oldCourseProgress
                
                        }).where(eq(userProgress.userId, userId))

                    
                    // Выполнили ДЗ!








                } else {
                    
                    //
                    // ДАТУ НЕ нашли. Добавляем новый PROGRESS с ДАТОЙ
                    // Ищем прогресс с ПОСЛЕДНЕЙ ДАТОЙ
                    //
                    let lastProgress = oldCourseProgress[indexCourse].progress[oldCourseProgress[indexCourse].progress.length - 1]

                    
                    oldCourseProgress[indexCourse].progress.push({
                        date: TodayStr,
                        // Смотрим HW ПОДРЯД
                        hw: [10, 0, 
                            lastProgress.hw[1] === lastProgress.hw[0]
                            ? lastProgress.hw[2] += 1
                            : 0
                        ],
                        selfDoneRight: doneRight ? 1 : 0,
                        selfDoneWrong: doneRight ? 0 : 1,
                        dateReady: '01.01.2125',
                        hearts: doneRight ? 20 : 19,
                        pts: 
                            isDoneChallenge ? lastProgress.pts
                            : doneRight ? lastProgress.pts + challengePts : lastProgress.pts,
                        gems: lastProgress.gems
                    })

                    await db.update(userProgress).set({
                        points: 
                            isDoneChallenge ? currentUserProgress.points :
                            doneRight ? currentUserProgress.points + challengePts : currentUserProgress.points,
                        courseProgress: oldCourseProgress
                    }).where(eq(userProgress.userId, userId))
                }
            }


               

            } 
            
            else {
                // ТАКОЙ КНИГИ НЕТ
                //
                
                oldCourseProgress.push(newCourseProgress[0])

                //


                await db.update(userProgress).set({
                    points: 
                        isDoneChallenge ? currentUserProgress.points:
                        doneRight ? currentUserProgress.points + challengePts : currentUserProgress.points,
                    courseProgress: oldCourseProgress
            
                }).where(eq(userProgress.userId, userId))

            }
        } 


    revalidatePath('/learn')
    revalidatePath('/lesson')
    revalidatePath('/progress')
    revalidatePath('/leaderboard')
    revalidatePath(`/lesson/${lessonId}`)
}


