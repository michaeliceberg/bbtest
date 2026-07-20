// components/tab-t-courses.tsx

'use client'

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { allTypesCT, t_challengeOptions, t_lessonProgress, t_units } from "@/db/schema";
import { GetTLessonStat } from "@/usefulFunctions";
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
import { useState } from "react";
import { Button } from "./ui/button";
import { TrainerSkillTree, SkillUnit } from "./trainer-skill-tree";

type Props = {
    t_courses: {
        id: number;
        title: string;
        imageSrc: string;
    }[],

    t_units: {
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
                type: allTypesCT;
                question: string;
                author: string;
                t_lessonId: number;
                t_challengeOptions: typeof t_challengeOptions.$inferSelect[];
            }[];
        }[];
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

    questLessonIds?: number[],
}

export const TabTCourses = ({
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
    questLessonIds = [],
}: Props) => {
    const [showFormulas, setShowFormulas] = useState(false)

    const onClickHandler = () => {
        setShowFormulas(!showFormulas)
    }

    const AllTStat = t_courses.map(course => {
        const this_courseUnits = t_units.filter(unit => unit.t_courseId == course.id)
        const StatThisUnit = this_courseUnits.map(unit => {
            const unitStat = unit.t_lessons.map(t_lesson => ({
                lessonId: t_lesson.id,
                PD: GetTLessonStat(t_lessonProgress, t_lesson.id).totalPercentDR
            }))
            return {
                unitStat: unitStat,
                unitId: unit.id,
            }
        })
        return {
            StatThisCourse: StatThisUnit,
            courseTitle: course.title
        }
    })

    let CourseStat = AllTStat.map(t_course => {
        let listOfMini: number[] = []
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

    const usersThisClass = allUsers.filter(user => user.classId == this_class_id)
    const thisClassHW = allClassHW?.filter(el => el.classId == this_class_id)

    const big = usersThisClass.map(user => {
        const lessonsDoneByThisUser = all_t_lessonProgress.filter(t_less_propg => t_less_propg.userId == user.userId)
        if (thisClassHW) {
            const thisUserListHWStat = thisClassHW.map(cur_hw => {
                let controlMultiply = 1
                let ListOfMissedLessonsIds: number[] = []
                const hw_trainer_string = cur_hw.taskTrainer
                if (hw_trainer_string != null && hw_trainer_string != "") {
                    const hw_trainer = hw_trainer_string.split(',').map((str) => Number(str));
                    hw_trainer.map(cur_les_in_hw => {
                        const doneRightPercent = lessonsDoneByThisUser.filter(lessonDone => lessonDone.t_lessonId == cur_les_in_hw)[0]?.doneRightPercent
                        const timesDoneCurLessonAfterHWDate = lessonsDoneByThisUser.filter(lessonDone =>
                            (lessonDone.t_lessonId == cur_les_in_hw) && (lessonDone.dateDone > cur_hw.dateHw))?.length
                        if (doneRightPercent > 90 && timesDoneCurLessonAfterHWDate > 0) {
                            // ничего не делаем
                        } else {
                            controlMultiply = controlMultiply * 0
                            ListOfMissedLessonsIds.push(cur_les_in_hw)
                        }
                    })
                }
                return {
                    dateHW: cur_hw.dateHw,
                    isDone: controlMultiply,
                    ListOfMissedLessonsIds: ListOfMissedLessonsIds,
                }
            })
            return {
                thisUserListHWStat: thisUserListHWStat,
                userName: user.userName,
                userId: user.userId,
            }
        }
    })

    const thisUserStatHW = big.filter(user => user?.userId == user_id)[0]
    let missedLIds: number[] = []
    thisUserStatHW?.thisUserListHWStat.map(cur_hw => {
        cur_hw.ListOfMissedLessonsIds.map(lesson_id => {
            missedLIds.push(lesson_id)
        })
    })

    return (
        <div className="w-full">
            <Tabs defaultValue={t_courses[0]?.title} className="w-full">
                {/* Табы курсов - центрируем */}
                <div className="flex justify-center mb-6">
                    <TabsList className="bg-[#232F34] rounded-xl p-1">
                        {t_courses.map((t_course, index) => (
                            <TabsTrigger
                                key={index * 21983}
                                value={t_course.title}
                                className="data-[state=active]:bg-[#151F23] data-[state=active]:shadow-sm px-4 py-2"
                            >
                                {t_course.title.split(' ')[0]}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {/* Контент для каждого курса */}
                {t_courses.map((t_course, indexCourse) => {
                    const skillUnits = t_units.filter(u => u.t_courseId === t_course.id).map((t_unit, indexUnit) => {
                        const StatThisUnitLessons = AllTStat[indexCourse].StatThisCourse[indexUnit].unitStat

                        const lessons = t_unit.t_lessons.map((t_lesson, indexLesson) => {
                            let isDisabled = true
                            if (indexLesson == 0 || StatThisUnitLessons[indexLesson - 1]?.PD > 0.9) {
                                isDisabled = false
                            }
                            const percentage = Math.round((StatThisUnitLessons[indexLesson]?.PD ?? 0) * 100)

                            return {
                                id: t_lesson.id,
                                title: t_lesson.title,
                                percentage,
                                isDisabled,
                                isInQuest: questLessonIds.includes(t_lesson.id),
                                hasHw: missedLIds.includes(t_lesson.id),
                            }
                        })

                        const unitPercentage = lessons.length
                            ? Math.round(lessons.reduce((a, b) => a + b.percentage, 0) / lessons.length)
                            : 0

                        return {
                            id: t_unit.id,
                            title: t_unit.title,
                            percentage: unitPercentage,
                            lessons,
                        }
                    })

                    return (
                    <TabsContent key={indexCourse * 19339} value={t_course.title} className="mt-0">
                        <h2 className="text-center text-lg font-bold text-[#F2F7FB] mb-3">
                            {t_course.title.split(' ')[1] ?? t_course.title}
                        </h2>

                        <div className="w-full mt-2">
                            <TrainerSkillTree units={skillUnits} />
                        </div>

                        <div className="flex justify-center mt-8">
                            <Button
                                onClick={onClickHandler}
                                variant='primaryOutline'
                                className="px-6"
                            >
                                {showFormulas ? 'Скрыть формулы' : 'Показать все формулы'}
                            </Button>
                        </div>

                        {showFormulas && (
                            <div className="mt-6 p-6 bg-[#1A252B] rounded-xl border">
                                <h3 className="text-xl font-bold mb-4 text-center">📖 Все формулы</h3>
                                <div className="space-y-6">
                                    {t_units.filter(u => u.t_courseId === t_course.id).map((t_unit, index) => (
                                        <div key={index * 14213} className="border-b pb-4 last:border-b-0">
                                            <h4 className="font-bold text-lg mb-3 text-green-700">{t_unit.title}</h4>
                                            <div className="space-y-3 pl-4">
                                                {t_units.filter(ul => ul.id == t_unit.id)[0].t_lessons.map((t_lesson, idx) => (
                                                    <div key={idx * 2241}>
                                                        <p className="font-medium text-[#9AA7B0] mb-2">{t_lesson.title}:</p>
                                                        <div className="space-y-2 pl-4">
                                                            {t_lesson.t_challenges.map((t_challenge, i) => (
                                                                <div key={i * 9135} className="p-3 bg-[#151F23] rounded-lg border">
                                                                    <Latex>{t_challenge.question}</Latex>
                                                                    <div className="text-green-600 mt-1 text-sm">
                                                                        Ответ: <Latex>{t_challenge.t_challengeOptions[0]?.text}</Latex>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>
                    )
                })}
            </Tabs>
        </div>
    )
}

export default TabTCourses;