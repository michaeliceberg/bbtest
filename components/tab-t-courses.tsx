'use client'

import { TCourseBanner } from "@/app/(main)/trainer/t-course-banner";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "@/components/ui/tabs"
import { allTypesCT, t_challengeOptions, t_challengesEnum, t_lessonProgress, t_units } from "@/db/schema";
import { GetTLessonStat } from "@/usefulFunctions";
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
import { ReactNode, useState } from "react";
import { Button } from "./ui/button";
import { motion } from 'framer-motion'
import { TrainerLessonItemRound } from "./trainer-list-round";
import { Block } from "./block";
import { FlipLink } from "./reveal-links";
import { AnimRightTriangleSin } from "@/app/(main)/motiontest/AnimRightTriangleSin";
import { FlameKindling } from "lucide-react";


type Props = {    
        t_courses: {
            id: number;
            title: string;
            imageSrc: string;
        }[],



        t_units:  // typeof t_units.$inferSelect[]    
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
                    // type:  "SELECT" | "ASSIST" | "CONNECT" | "SLIDER" | "CONSTRUCT" | "WORKBOOK" | "R ASSIST" | "R CONNECT" | "R SLIDER" | "GEOSIN",
                    type: allTypesCT;
                    // type:  typeof t_challengesEnum.$inferSelect[],
                    question: string;
                    author: string;
                    t_lessonId: number;
                    t_challengeOptions: typeof t_challengeOptions.$inferSelect[],
                }[];}[]
        }[],
        
        t_lessonProgress: typeof t_lessonProgress.$inferSelect[],

        TRatingUsers: {
            t_lesson_id: number;
            usersSortedStat: {
                DRP: number,
                DR_DRP: number;
                user_id: string | undefined;
                user_name: string | undefined;
            }[];
        }[],

        user_id: string,






        allClasses: {
            id: number;
            title: string;
            imageSrc: string;
        }[],

        allClassHW: {
            id: number;
            classId: number;
            task: string | null;
            taskTrainer: string | null;
            dateHw: Date;
        }[] | null,
    

        allUsers: {
            userId: string;
            userName: string;
            userImageSrc: string;
            points: number;
            classId: number | null;
        }[],

        this_class_id: number | null,

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
    }



  

    export const    TabTCourses = ({
        t_courses,
        t_units,
        t_lessonProgress,
        TRatingUsers,
        user_id,

        allClasses,
        allClassHW,
        allUsers,
        this_class_id,
        all_t_lessonProgress,

    }: Props) => {


    const [showFormulas, setShowFormulas] = useState(false)

    const onClickHandler = () => {
        setShowFormulas(!showFormulas)
    }

    const AllTStat = t_courses.map(course => {

        const this_courseUnits = t_units.filter(unit => unit.t_courseId == course.id)

        const StatThisUnit = this_courseUnits.map(unit => 
            {
                const unitStat = unit.t_lessons.map(t_lesson => ({                
                    lessonId: t_lesson.id,
                    PD: GetTLessonStat(t_lessonProgress, t_lesson.id).totalPercentDR
                }))
             
                return (
                {
                    unitStat: unitStat,
                    unitId: unit.id,
                })
            }
          


           
        )
        return {
            StatThisCourse: StatThisUnit,
            courseTitle: course.title
        }


    })


    // console.log('AllTStat')
    // console.log(AllTStat)




    let CourseStat = AllTStat.map(t_course => {
        let listOfMini:number[] = []
        t_course.StatThisCourse.map(unit => {
            unit.unitStat.map(lesson => {
                listOfMini.push(lesson.PD)
            })
            
        })
        return {
            listOfMini: listOfMini,
            courseTitle: t_course.courseTitle
        }

    })

    // для Заголовка Unit'a
    // const t_unit.t_lessons[t_unit.t_lessons.length - 1].t_challenges}


    // console.log('CourseStat CourseStat')
    // console.log(CourseStat)











    const usersThisClass = allUsers.filter(user=>user.classId == this_class_id)

    const thisClassHW = allClassHW?.filter(el => el.classId == this_class_id)

    const big = usersThisClass.map(user => {
        
        // смотрим во ВСЕМ списке выполненых Lesson те, которые выполнены ЭТИМ user
        //
        const lessonsDoneByThisUser = all_t_lessonProgress.filter(t_less_propg => t_less_propg.userId == user.userId)

        
        // идем по HW, 
        // смотрим в КАЖДОМ HW, выполнены ЛИ Lesson'ы на 90% после ДАТЫ ВЫДАЧИ задания
        if (thisClassHW) {
            const thisUserListHWStat = thisClassHW.map(cur_hw => {
                // смотрим конкретное ОДНО HW
                //
                // Контрольное ПРОИЗВЕДЕНИЕ (если будет 1 то все Lesson'ы этого HW выполнены)
                let controlMultiply = 1
                let ListOfMissedLessonsIds: number[] = []
                //
                const hw_trainer_string = cur_hw.taskTrainer
                if (hw_trainer_string != null && hw_trainer_string != "") {
                    const hw_trainer_list_of_str = hw_trainer_string.split(',')
                    
                    // hw_trainer - список номеров задач этого HW
                    const hw_trainer = hw_trainer_list_of_str.map((str) => Number(str));
                    

                    // TODO:
                    // считаем, сколько user'ов НЕ сделало каждый unit
                    // const hw_trainer_missed = 

                    
   
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
                            controlMultiply = controlMultiply * 0
                            ListOfMissedLessonsIds.push(cur_les_in_hw)
                        }
                    })
                }

                return (
                    {
                        dateHW: cur_hw.dateHw,
                        isDone: controlMultiply,
                        ListOfMissedLessonsIds: ListOfMissedLessonsIds,
                    }
                )
                

            })
            return (
                {
                    thisUserListHWStat: thisUserListHWStat,
                    userName: user.userName,
                    userId: user.userId,                    
                }
            )
        }
    })


    const thisUserStatHW = big.filter(user => user?.userId == user_id)[0]

    const numOfHwDone = thisUserStatHW?.thisUserListHWStat.filter(el => el.isDone).length
    const numOfHwNotDone = thisUserStatHW?.thisUserListHWStat.filter(el => !el.isDone).length


    let missedLIds: number[] = []
    thisUserStatHW?.thisUserListHWStat.map( cur_hw => {
        cur_hw.ListOfMissedLessonsIds.map(lesson_id => {
            missedLIds.push(lesson_id)
        })
    })


    // console.log('missedLIds    >> ', missedLIds)




return(

    // <div className="flex items-center flex-col relative ">
    <div className="flex justify-center flex-col relative ">
        


        <Tabs defaultValue=
            {t_courses[0].title}
            className="pt-5      flex items-center flex-col relative ">
    

            {/*  TODO:    TAB TOP    M9  M3 и тд */}
            <TabsList>
            {
                t_courses.map((t_course, index) => (
                    <TabsTrigger key={index*21983} value={t_course.title}>
                         {t_course.title.split(' ')[0]}
                    </TabsTrigger>
                )) 
            }
            </TabsList>
        



            {/* TODO:    COURSE banner        МАТЕМАТИКА 9 и статистика */}
            {t_courses.map((t_course, indexCourse) => (
                
                <TabsContent key={indexCourse*19339} value={t_course.title} className="pt-10">
                    
                    <div key={indexCourse*1389} >

						<TCourseBanner 
							t_course_title={t_course.title} 
							description={t_course.imageSrc} 
							imgSrc={t_course.imageSrc} 
							id={1} 
							percentageDone={20}

                            t_course_id={t_course.id}
                            t_units={t_units}
                            t_lessonProgress={t_lessonProgress}
                            CourseStat={CourseStat}
						/>
						



                        {/* TODO:   unit Banner */}
                        
						<div className="flex items-center flex-col relative w-full">

                        

							{t_units.filter(u => u.t_courseId === t_course.id)
							.map((t_unit, indexUnit) => (

								<div key={indexUnit*81872} className="w-full ml-7">


									<Block       
                                    // ТЕОРЕМА ВИЕТА      1/5                              
                                        className="mt-10 font-bold w-full rounded-xl  bg-green-500 p-4 text-2xl text-white  pt-2 pb-2 bg-[url('/MemesImage/i-like-food.svg')]  bg-repeat"
                                    >
                                        
                                        <div className="flex justify-between">
                                                                                        
                                            <p>
                                                {t_unit.title}
                                            </p>
                                            <p>
                                                {indexUnit+1}/{t_units.length}
                                            </p>
                                        </div>
                                        
                                        
                                        <div className="rounded-xl bg-white/50">

                                            {
                                                t_unit.title != '12345'                                            
                                                ?                                            
                                                <div>
                                                    
                                                </div>
                                                :
                                                <p className="text-gray-700 m-7 pt-3 pb-3 text-lg">
                                                    <Latex>
                                                        {t_unit.t_lessons[t_unit.t_lessons.length - 1].t_challenges.filter(el => !el.question.includes("Соедините") )[0].question}
                                                    </Latex>
                                                </p>
                                            }
                                        </div>

									</Block>



									
                                    {t_units.filter(ul => ul.id == t_unit.id)[0].t_lessons.map((t_lesson, indexLesson) => {
                                    //
                                    // Идем по ЛЕССОНАМ этого ЮНИТА чтобы рисовать КРУЖОЧКИ
                                    //      
                                    const StatThisUnitLessons = AllTStat[indexCourse].StatThisCourse[indexUnit].unitStat
                                    // Готовим в блокировке несделанных Lesson'ов
                                    //
                                    let isDisabled = true
                                    if (indexLesson == 0 || StatThisUnitLessons[indexLesson - 1].PD > 0.9) {
                                        isDisabled = false
                                    }
                                        

                                        return(
                                            <div key={indexLesson * 2241} className='justify-center'>

                                                <TrainerLessonItemRound 
                                                    t_lesson={t_lesson} 
                                                    t_lessonProgress={t_lessonProgress}
                                                    TRatingUsers={TRatingUsers}
                                                    user_id={user_id}
                                                    indexLesson={indexLesson}
                                                    isDisabled={isDisabled}

                                                    missedLIds={missedLIds}
                                                />
                                                
                                        
                                                {/* <h1>
                                                    {JSON.stringify(StatThisUnitLessons)}
                                                </h1> */}
                                            </div>
                                        )}

									)}
								</div>
							))}
						</div>
















                        <Button className="w-full mb-4 mt-4" onClick={onClickHandler} variant='primaryOutline'>
                            Показать все формулы                                
                        </Button>


                        


                        {showFormulas && 

                        
                        <div className="flex flex-col justify-center">
                            {t_units.filter(u => u.t_courseId === t_course.id)
                                .map((t_unit, index) => (
                                    <div key={index*14213}>

                                        <p className="w-full pb-8 pl-4">
                                            {t_unit.title}
                                        </p>

                                        {
                                            t_units.filter(ul => ul.id == t_unit.id)[0].t_lessons.map((t_lesson, index) => (
                                            
                                            <div key={index * 2241} className='justify-center'>
                                                {t_lesson.t_challenges.map((t_challenge, index) => (
                                                    <div key={index * 9135} className="w-full pb-8 pl-4">
                                                        <Latex>
                                                        {t_challenge.question}
                                                        </Latex>

                                                        <Latex>
                                                        {t_challenge.t_challengeOptions[0].text}
                                                        </Latex>
                                                    </div>
                                                ) )}
                                        
                                            </div>
                                            

                                        ))}
                                    </div>
                                ))}

                        </div>

                        }

						
					</div>

                </TabsContent>

            ))}






            

        </Tabs>

    </div>

)
}

export default TabTCourses







































// const BounceCard = ({
//     className,
//     children,
//   }: {
//     className: string;
//     children: ReactNode;
//   }) => {
//     return (
//       <motion.div
//         whileHover={{ scale: 0.95, rotate: "-1deg", boxShadow: "8px 8px #758277", }}
//         className={`w-full bg-green-500 text-2xl text-white justify-center bg-[url('/MemesImage/i-like-food.svg')] group relative min-h-[250px] overflow-hidden rounded-2xl pl-6 pr-6 pt-6 ${className}`}
//       >
//         {children}
//       </motion.div>
//     );
//   };
  
//   const CardTitle = ({ children }: { children: ReactNode }) => {
//     return (
//       <h3 className="mx-auto text-center text-3xl font-semibold">{children}</h3>
//     );
//   };




//   ?  <AnimRightTriangleSin
//   threeCoordinates = {[0.1, 0.1, 0.9, 0.1, 0.1, 0.6]}
//   xCoordinates = {[464, 42]}
//   arcSVG = {"M 440,42 Q 420,80 460,92"}
// >







// const AllTStat = t_courses.map(course => {

//     const this_courseUnits = t_units.filter(unit => unit.t_courseId == course.id)

//     const StatThisUnit = this_courseUnits.map(unit => 
// {
//          const unitStat = unit.t_lessons.map(t_lesson => {                
//             const lessonStat = {
//                 lessonId: t_lesson.id,
//                 PD: GetTLessonStat(t_lessonProgress, t_lesson.id).totalPercentDR
//                 }
//             return (
//                 {
//                 lessonStat: lessonStat,
//                 // unitId: unit.id
//                 }
//                 )
//             })
         
//          return (
//             {
//                 unitStat: unitStat,
//                 unitId: unit.id,
//             }
//           )
//         }