
'use client'

import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import React, { useState, useTransition } from 'react'
import TabTCoursesHW from './tab-t-courses-hw'
import { challengeProgress, courses, t_challengeOptions, allTypesCT } from '@/db/schema'
import TabCoursesHW from './tab-courses-hw'


type Props = {
    usersThisClass: {
        userId: string;
        userName: string;
        userImageSrc: string;
        points: number;
        classId: number | null;
    }[],
    cur_class_id: number,


    all_t_lessonProgress: {
        id: number;
        userId: string;
        doneRight: number;
        dateDone: Date;
        t_lessonId: number;
        doneRightPercent: number;
        doneWrong: number;
        trainingPts: number;
    }[],


    allClassHW: {
        id: number;
        classId: number;
        task: string | null;
        taskTrainer: string | null;
        dateHw: Date;
    }[] | null,







    t_courses: {
        id: number;
        title: string;
        imageSrc: string;
    }[],
    t_units:  
   
    {
        id: number;
        title: string;
        description: string;
        imageSrc: string;
        t_courseId: number;
        order: number;
        t_lessons: {
            id: number;
            title: string;
            order: number;
            t_unitId: number;
            t_challenges: {
                imageSrc: string;
                numRans: string;
                difficulty: string;
                id: number;
                points: number;
                order: number;
                // type: allTypesCasualTrainer;
                // type: typeof allTypesCasualTrainer;
                type: allTypesCT;

                // type:  "SELECT" | "ASSIST" | "CONNECT" | "SLIDER" | "CONSTRUCT" | "WORKBOOK" | "R ASSIST" | "R CONNECT" | "R SLIDER" | "GEOSIN",
                // type:  typeof t_challengesEnum.$inferSelect[],
                // type: 
                question: string;
                author: string;
                t_lessonId: number;
                t_challengeOptions: typeof t_challengeOptions.$inferSelect[],
            }[];}[]
    }[],


    courses: typeof courses.$inferSelect[],
    // units: typeof units.$inferSelect[],
    units:
    {
        id: number;
        title: string;
        description: string;
        imageSrc: string;
        courseId: number;
        order: number;
        lessons: {
            id: number;
            title: string;
            order: number;
            unitId: number;
            challenges: {
                imageSrc: string;
                // numRans: string;
                difficulty: string;
                id: number;
                points: number;
                order: number;
                // type: typeof allTypesCasualTrainer;
                type: allTypesCT,
                // type:  "SELECT" | "ASSIST" | "CONNECT" | "SLIDER" | "CONSTRUCT" | "WORKBOOK" | "R ASSIST" | "R CONNECT" | "R SLIDER" | "GEOSIN",

                question: string;
                author: string;
                lessonId: number;
                // challengeOptions: typeof challengeOptions.$inferSelect[],
                challengeProgress: typeof challengeProgress.$inferSelect[],

            }[];}[]
    }[],




    challengeProgress: {
        id: number;
        userId: string;
        challengeId: number;
        completed: boolean;
        doneRight: boolean;
        dateDone: Date;
    }[],
    
}
export const CheckListUsers = ({
    usersThisClass,
    cur_class_id,

    all_t_lessonProgress,
    allClassHW,

    t_courses,
    t_units,

    courses,
    units,
    challengeProgress,



}: Props) => {


    const thisClassHW = allClassHW?.filter(el => el.classId == cur_class_id)

    const big = usersThisClass.map(user => {
        
        // смотрим во ВСЕМ списке выполненых Lesson те, которые выполнены ЭТИМ user
        //
        const lessonsDoneByThisUser = all_t_lessonProgress.filter(t_less_propg => t_less_propg.userId == user.userId)

        const challengesDoneByThisUser = challengeProgress.filter(chal_prog => chal_prog.userId == user.userId)


        //NEW SELF    СЧИТАЕМ сколько всего Lesson Trainer сделал user САМ (с HW и БЕЗ)
        //
        const selfLIdsDoneRight = lessonsDoneByThisUser.filter(el => el.doneRightPercent > 80)?.length

        //NEW SELF      СЧИТАЕМ сколько всего Challenge сделал user САМ (с HW и БЕЗ)
        //
        const selfCIdsDoneRight = challengesDoneByThisUser.filter(el => el.doneRight)?.length
        const ListSelfCIdsDoneRight = challengesDoneByThisUser.filter(el => el.doneRight).map(el => el.challengeId)
        
        
        // идем по HW, 
        // смотрим в КАЖДОМ HW, выполнены ЛИ Lesson'ы на 90% после ДАТЫ ВЫДАЧИ задания
        if (thisClassHW) {
            const thisUserListHWStat = thisClassHW.map(cur_hw => {
                // смотрим конкретное ОДНО HW
                //
                // Контрольное ПРОИЗВЕДЕНИЕ (если будет 1 то все Lesson'ы этого HW выполнены)
                let controlMultiplyTrainer = 1
                let controlMultiplyCasual = 1
                let ListOfMissedLessonsIds: number[] = []
                let ListOfMissedChallengesIds: number[] = []
                //
                let wasHwTrainer = 0
                let wasHwCasual = 0
                const hw_trainer_string = cur_hw.taskTrainer
                const hw_casual_string = cur_hw.task
                //
                if (hw_trainer_string != null && hw_trainer_string != "") {
                    wasHwTrainer = 1







                    const hw_trainer_list_of_str = hw_trainer_string.split(',')
                    
                    // hw_trainer - список номеров задач Тренажёра этого HW
                    const hw_trainer = hw_trainer_list_of_str.map((str) => Number(str));
                    

                    // TODO:
                    // считаем, сколько user'ов НЕ сделали каждый lesson
                   
   
                    hw_trainer.map(cur_les_in_hw => {
                        // смотрим первый (нулевой) результат по этому Lesson'у тк УЖЕ был отсортирован в query по дате
                        const doneRightPercent = lessonsDoneByThisUser.filter(lessonDone => lessonDone.t_lessonId == cur_les_in_hw)[0]?.doneRightPercent
 
                        // смотрим, сколько раз был решен Lesson ПОСЛЕ даты выдачи HW
                        //
                        const timesDoneCurLessonAfterHWDate = lessonsDoneByThisUser.filter(lessonDone => 
                            (lessonDone.t_lessonId == cur_les_in_hw) && (lessonDone.dateDone > cur_hw.dateHw))?.length

                        if (doneRightPercent > 90 && timesDoneCurLessonAfterHWDate > 0) {
                            //
                            // ничего не делаем
                            //
                        } else {
                            controlMultiplyTrainer = controlMultiplyTrainer * 0
                            ListOfMissedLessonsIds.push(cur_les_in_hw)
                        }
                    })


                }






                if (hw_casual_string != null && hw_casual_string != "") {
                    wasHwCasual = 1
                    const hw_casual_list_of_str = hw_casual_string.split(',')
                    
                    // hw_casual - список номеров задач Задачника этого HW
                    const hw_casual = hw_casual_list_of_str.map((str) => Number(str));
                    

                    // TODO:
                    // считаем, сколько user'ов НЕ сделали каждый challenge
                   

                    hw_casual.map(cur_chal_in_hw => {
                        // смотрим первый (нулевой) результат по этому Lesson'у тк УЖЕ был отсортирован в query по дате
                        const isDone = challengesDoneByThisUser.filter(challengeDone => challengeDone.challengeId == cur_chal_in_hw)[0]?.completed
                        const isDoneRight = challengesDoneByThisUser.filter(challengeDone => challengeDone.challengeId == cur_chal_in_hw)[0]?.doneRight
 
                        // смотрим, сколько раз был решен Lesson ПОСЛЕ даты выдачи HW
                        //
                        const timesDoneCurLessonAfterHWDate = challengesDoneByThisUser.filter(challengeDone => 
                            (challengeDone.challengeId == cur_chal_in_hw) && (challengeDone.dateDone > cur_hw.dateHw))?.length

                        if (isDoneRight && timesDoneCurLessonAfterHWDate > 0) {
                            //
                            // ничего не делаем
                            //
                        } else {
                            controlMultiplyCasual = controlMultiplyCasual * 0
                            ListOfMissedChallengesIds.push(cur_chal_in_hw)
                        }
                    })




                }



                return (
                    {
                        dateHW: cur_hw.dateHw,
                        wasHwCasual: wasHwCasual,
                        wasHwTrainer: wasHwTrainer,
                        isDoneTrainer: controlMultiplyTrainer,
                        isDoneCasual: controlMultiplyCasual,
                        ListOfMissedLessonsIds: ListOfMissedLessonsIds,
                        ListOfMissedChallengesIds: ListOfMissedChallengesIds,
                    }
                )
                

            })
            return (
                {
                    thisUserListHWStat: thisUserListHWStat,
                    userName: user.userName,
                    userId: user.userId,    
                    selfLIdsDoneRight: selfLIdsDoneRight,
                    selfCIdsDoneRight: selfCIdsDoneRight,
                    ListSelfCIdsDoneRight: ListSelfCIdsDoneRight,



                }
            )
        }
    })

    // console.log(big)

    
    
    
    
    // TODO: LESSON TRAINER
    
    // Собираем подготовку к HW списку всех НЕ решенных LessonId
    //
    let listOfAllHWLessonsIds:number[] = []
    //
    thisClassHW?.map(cur_hw=> {
        let ListOfMissedLessonsIds: number[] = []
        //
        const hw_trainer_string = cur_hw.taskTrainer
        if (hw_trainer_string != null && hw_trainer_string != "") {
            const hw_trainer_list_of_str = hw_trainer_string.split(',')
            
            // hw_trainer - список номеров задач этого HW
            hw_trainer_list_of_str.map(str => {
                listOfAllHWLessonsIds.push(Number(str))
            })
        }
    })


    const uniqueSet = new Set(listOfAllHWLessonsIds)
    const listOfUniqueHWIds = Array.from(uniqueSet);

    const hwLIdsToDoNumUsersMissed = listOfUniqueHWIds.map(lessonIdToDo => {

        let missNumOfToDoLIds = 0

        let numToDo = 0 // за каждого User по +1 за Не сделанный LessonId

        big.map(cur_user => {
            
            cur_user?.thisUserListHWStat.map(cur_hw => {

                // Если этот LessonIdToDo находится ХОТЯ БЫ в одном из НЕ сделанных списках HW, то = 1 
                // то есть этот ученик НЕ сделал ЭТОТ lessonId из одного из HW
                //
                if (cur_hw.ListOfMissedLessonsIds.includes(lessonIdToDo)) {
                    numToDo = 1
                }
                
            })

            missNumOfToDoLIds += numToDo // За каждого User по +1 у ЭТОГО LessonId
        })


        return (
            {
                lessonIdToDo: lessonIdToDo,
                missNumOfToDoLIds: missNumOfToDoLIds,
            }
        )
    })




    // Считаем СКОЛЬКО LESSON Id's НЕ решил ЭТОТ user из всех HW
    
    const hwLIdsEachUserMissedAndDone = big.map(cur_user => {
        
        let lessonsMissedThisUser = 0

        let numLessonsDoneRightByThisUser = 0
        let numLessonsDoneTriesByThisUser = 0

        cur_user?.thisUserListHWStat.map(cur_hw => {

            listOfAllHWLessonsIds.map(lessonIdToDo => {
                if (cur_hw.ListOfMissedLessonsIds.includes(lessonIdToDo)) {
                    lessonsMissedThisUser += 1
                }
            })
            //
            // сколько ВСЕГО решено LessonIds из HW
            //
            numLessonsDoneRightByThisUser = all_t_lessonProgress.filter(t_less_propg => (t_less_propg.userId == cur_user.userId)).filter(el=>el.doneRightPercent > 90).length
            numLessonsDoneTriesByThisUser = all_t_lessonProgress.filter(t_less_propg => t_less_propg.userId == cur_user.userId).length
            
        })
        return (
            {
                userId: cur_user?.userId,
                hwLIdsThisUserMissed: lessonsMissedThisUser,
                numLessonsDoneRightByThisUser: numLessonsDoneRightByThisUser,
                numLessonsDoneTriesByThisUser: numLessonsDoneTriesByThisUser,

            }
        )
    })
    



    // TODO: CHALLANGE CASUAL
    
    // Собираем подготовку к HW списку всех НЕ решенных Challenge
    //
    let listOfAllHWChallengeIds:number[] = []
    //
    thisClassHW?.map(cur_hw=> {
        let ListOfMissedChallengesIds: number[] = []
        //
        const hw_casual_string = cur_hw.task
        if (hw_casual_string != null && hw_casual_string != "") {
            const hw_casual_list_of_str = hw_casual_string.split(',')
            
            // hw_trainer - список номеров задач этого HW
            hw_casual_list_of_str.map(str => {
                listOfAllHWChallengeIds.push(Number(str))
            })
        }
    })

    const uniqueSet2 = new Set(listOfAllHWChallengeIds)
    const listOfUniqueHWChallengeIds = Array.from(uniqueSet2);

    const hwCIdsToDoNumUsersMissed = listOfUniqueHWChallengeIds.map(challengeIdToDo => {

        let missNumOfToDoCIds = 0

        let numToDo = 0 // за каждого User по +1 за Не сделанный ChallengeId

        big.map(cur_user => {
            
            cur_user?.thisUserListHWStat.map(cur_hw => {

                // Если этот challengeIdToDo находится ХОТЯ БЫ в одном из НЕ сделанных списках HW, то = 1 
                // то есть этот ученик НЕ сделал ЭТОТ lessonId из одного из HW
                //
                if (cur_hw.ListOfMissedChallengesIds.includes(challengeIdToDo)) {
                    numToDo = 1
                }
                
            })

            missNumOfToDoCIds += numToDo // За каждого User по +1 у ЭТОГО ChallengeId
        })


        return (
            {
                challengeIdToDo: challengeIdToDo,
                missNumOfToDoCIds: missNumOfToDoCIds,
            }
        )
    })



    // Считаем СКОЛЬКО CHALLANGE Id's НЕ решил ЭТОТ user из всех HW
    
    const hwCIdsEachUserMissed = big.map(cur_user => {
        
        let challengesMissedThisUser = 0

        cur_user?.thisUserListHWStat.map(cur_hw => {

            listOfUniqueHWChallengeIds.map(challengeIdToDo => {
                if (cur_hw.ListOfMissedChallengesIds.includes(challengeIdToDo)) {
                    challengesMissedThisUser += 1
                }
            })
            
        })
        return (
            {
                userId: cur_user?.userId,
                hwCIdsThisUserMissed: challengesMissedThisUser,

            }
        )
    })
        
    
    


    const ListSelfChallengeDoneRight = challengeProgress.filter(el=>el.doneRight).map(el => el.challengeId)
    
    // big.map(el => el.)

    const uniqueSetC = new Set(ListSelfChallengeDoneRight)
    const UniqueListSelfChallengeDoneRight = Array.from(uniqueSetC);

    
    // Делаем СПИСОК СКОЛЬКО ЛЮДЕЙ СДЕЛАЛО ОДИН И ТОТ ЖЕ CHALLENGE SELF ИЛИ ПО HW (вообще сделало правильно)
    const nUsersDoneCurChallenge = UniqueListSelfChallengeDoneRight.map(challengeId => {
        let nUsersDone = 0
        big.map(el => {
            if (el?.ListSelfCIdsDoneRight.includes(challengeId)) {
                nUsersDone += 1
            }
        })
        
        return (
            {
                challengeId: challengeId,
                nUsersDone: nUsersDone,
            }
    )
    })




    const [pending, startTransition] = useTransition()

    const placeholder = 'введите класс'
    const [newName, setNewName] = useState(placeholder);
    const handleChangeName = (event:any) => {
        setNewName(event.target.value);
    }

    // в одном компоненте TabTCoursesHW мы получаем LessonIds List с HW который отправляем во второй компонент TabCoursesHW
    // откуда уже отправляем ДЗ вместе с ChallengeIds
    const [hwTLessonIds, setHwTLessonIds] = useState<number[]>([])




    return (


    
    <div className="pt-10 w-full">
           


        <ul className="grid grid-cols-8 gap-y-4 ">


            <li className="col-span-1 flex justify-center ">
                    
            </li>

            

            <li className="col-span-2 flex justify-center">
                <p className="text-sm content-center">
                    имя
                </p>    
            </li>


            

            <li className="flex justify-center">
                <p className="text-sm content-center">
                    🏡C
                    {/* сверху сколько Домашек по Сhallenge НЕ СДЕЛАЛ снизу сколько СДЕЛАЛ */}
                </p>    
            </li>

            <li className="flex justify-center">
                <p className="text-sm content-center">
                    🏡T
                    {/* сверху сколько Домашек по Trainer НЕ СДЕЛАЛ снизу сколько СДЕЛАЛ */}
                </p>    
            </li>

            <li className="flex justify-center">
                <div className="text-sm content-center">
                    nC
                    <p
                        // сколько задач ВСЕГО НЕ сделал (из HW)
                    >
                        🏡🐢
                    </p>
                    <p 
                    // сколько задач ВСЕГО сделал (c HW и без)
                    >
                        Σ✓ 
                    </p>
                    
                    
                </div>    
            </li>
            <li className="flex justify-center">
                <div className="text-sm content-center">
                    nT
                    
                    <p
                    // сколько задач ВСЕГО НЕ сделал (из HW)
                    >
                        🏡🐢
                    </p>
                    <p 
                    // сколько задач ВСЕГО сделал (c HW и без)
                    >
                        Σ✓ 
                    </p>    
                    
                </div>    
            </li>
            
            <li className="flex justify-center">
                <p className="text-sm content-center">
                    
                </p>    
            </li>




            {usersThisClass.map((user, index) => {
                
                const thisUserListHWStat = big.filter(el => el?.userId == user.userId)[0]?.thisUserListHWStat
                
                // Если тренажер ЗАДАВАЛИ (wasHwTrainer)
                //
                let notFinishedHWTrainer = thisUserListHWStat?.reduce((accum, el) => (!el.isDoneTrainer && el.wasHwTrainer) ? accum + 1 : accum, 0)
                let finishedHWTrainer = thisUserListHWStat?.reduce((accum, el) => (el.isDoneTrainer && el.wasHwTrainer)? accum + 1 : accum, 0)

                // Если задачник ЗАДАВАЛИ (wasHwCasual)
                //
                let notFinishedHWCasual = thisUserListHWStat?.reduce((accum, el) => (!el.isDoneCasual && el.wasHwCasual) ? accum + 1 : accum, 0)
                let finishedHWCasual = thisUserListHWStat?.reduce((accum, el) => (el.isDoneCasual && el.wasHwCasual) ? accum + 1 : accum, 0)

                notFinishedHWTrainer == undefined ? notFinishedHWTrainer = 0 : notFinishedHWTrainer
                finishedHWTrainer == undefined ? finishedHWTrainer = 0 : finishedHWTrainer
                


                let hwCIdsThisUserMissed = hwCIdsEachUserMissed.filter(el => el.userId == user.userId)[0]?.hwCIdsThisUserMissed

                let hwLIdsThisUserMissed = hwLIdsEachUserMissedAndDone.filter(el => el.userId == user.userId)[0]?.hwLIdsThisUserMissed
                let hwLIdsThisUserDoneRigth = hwLIdsEachUserMissedAndDone.filter(el => el.userId == user.userId)[0]?.numLessonsDoneRightByThisUser
                let hwLIdsThisUserDoneWrong = hwLIdsEachUserMissedAndDone.filter(el => el.userId == user.userId)[0]?.numLessonsDoneTriesByThisUser


                // SELF  Сколько user СДЕЛАЛ САМ 
                const selfCIdsDoneRight = big.filter(el => el?.userId == user.userId)[0]?.selfCIdsDoneRight
                const selfLIdsDoneRight = big.filter(el => el?.userId == user.userId)[0]?.selfLIdsDoneRight


                return (

                    <React.Fragment key={index}> {/* or omit if not in a list */}
                    <li key={index} className="list-item">
                      <Button className="w-full" variant='ghost' size='leader'>
                        <div className="flex flex-1 justify-between items-center">
                          <div>
                            <h1>{index + 1}</h1>
                          </div>
                          <div>
                            <Avatar>
                              <AvatarImage
                                className="object-cover"
                                src={user.userImageSrc}
                              />
                            </Avatar>
                          </div>
                        </div>
                      </Button>
                    </li>
                  





                    <li  key={index + 2000} className="col-span-2 flex justify-center" >
                        <p className="text-sm font-bold content-center">
                            {user.userName}
                        </p>
                        </li>



                        {/* STREAK */}



                    <li  key={index + 3000} className=
                        {notFinishedHWCasual == 0 
                            ? "content-center text-center text-sm text-white font-bold bg-green-400 rounded-sm"  
                            : "content-center text-center text-sm text-white font-bold bg-red-400 rounded-sm"
                        }
                        >
                        <p>
                            {notFinishedHWCasual}
                        </p>
                        <p>
                            {finishedHWCasual}
                        </p>

                    </li>




                    <li  key={index + 4000} className=
                        {notFinishedHWTrainer == 0 
                            ? "content-center text-center text-sm text-white font-bold bg-green-400 rounded-sm"  
                            : "content-center text-center text-sm text-white font-bold bg-red-400 rounded-sm"
                        }
                        >
                        <p>
                            {notFinishedHWTrainer}
                        </p>
                        <p>
                            {finishedHWTrainer}
                        </p>

                    </li>











                    <li  key={index + 5000} className=
                        {hwCIdsThisUserMissed == 0 
                            // СКОЛЬКО ВСЕГО challenge casual НЕ СДЕЛАЛ ЭТОТ УЧЕНИК по HW
                            //
                            ? "content-center text-center text-sm text-white font-bold bg-green-400 rounded-sm"  
                            : "content-center text-center text-sm text-white font-bold bg-red-400 rounded-sm"
                        }
                        >
                        <p
                            // сколько задач ВСЕГО НЕ сделал (из HW)
                        >
                            {hwCIdsThisUserMissed}
                        </p>
                        <p
                        // сколько задач ВСЕГО сделал (c HW и без)
                        >
                            {selfCIdsDoneRight}
                        </p>

                        </li>





                    <li  key={index + 6000} className=
                        {hwLIdsThisUserMissed > 0
                            // СКОЛЬКО ВСЕГО lesson trainer НЕ СДЕЛАЛ ЭТОТ УЧЕНИК по HW
                            // сколько всего сдела правильно Из / всех, что сделал
                            ? "content-center text-center text-sm text-white font-bold bg-red-400 rounded-sm"
                            : "content-center text-center text-sm text-white font-bold bg-green-400 rounded-sm"  
                        }
                        >
                        <p>
                            {hwLIdsThisUserMissed}
                        </p>
                        <p>
                            {selfLIdsDoneRight}
                            {/* {hwLIdsThisUserDoneRigth}/{hwLIdsThisUserDoneWrong + hwLIdsThisUserDoneRigth} */}
                        </p>

                    </li>





                  
                    <li key={index + 1000} className="col-span-1">
                      <Button className="w-full" variant='ghost' size='leader'>
                        {user.classId}
                      </Button>
                    </li>
                  </React.Fragment>




                



            )})}










        </ul>












                    <TabTCoursesHW 
                        t_courses={t_courses} 
                        t_units={t_units} 

                        cur_class_id={cur_class_id}

                        hwLIdsToDoNumUsersMissed={hwLIdsToDoNumUsersMissed}

                        hwTLessonIds={hwTLessonIds}
                        setHwTLessonIds={setHwTLessonIds}


                    />



                    <TabCoursesHW 
                        courses={courses} 
                        units={units} 

                        cur_class_id={cur_class_id}

                        hwCIdsToDoNumUsersMissed={hwCIdsToDoNumUsersMissed}

                        nUsersDoneCurChallenge={nUsersDoneCurChallenge}

                        hwTLessonIds={hwTLessonIds}

                        // const ListSelfCIdsDoneRight = big.filter(el => el?.userId == user.userId)[0]?.ListSelfCIdsDoneRight


                    /> 



    </div>


  )
}































