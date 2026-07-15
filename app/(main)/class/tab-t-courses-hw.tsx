// components/tab-t-courses-hw.tsx

'use client'

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { allTypesCT, t_challengeOptions } from "@/db/schema";
import { useState, useTransition } from "react";
import { Block } from "@/components/block";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { upsertTrainerHomework } from "@/actions/upsert-trainer-homework";

type t_lessonsType = number[]

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
    cur_class_id: number,
    hwLIdsToDoNumUsersMissed: {
        lessonIdToDo: number;
        missNumOfToDoLIds: number;
    }[],
    hwTLessonIds: number[],
    setHwTLessonIds: React.Dispatch<React.SetStateAction<number[]>>,
}

export const TabTCoursesHW = ({
    t_courses,
    t_units,
    hwLIdsToDoNumUsersMissed,
    cur_class_id,
    hwTLessonIds,
    setHwTLessonIds,
}: Props) => {
    const [pending, startTransition] = useTransition()
    const [showFormulas, setShowFormulas] = useState(false)

    const allLessonsIds: number[] = []

    const AllLessonsInCourses = t_courses.map(course => {
        const this_courseUnits = t_units.filter(unit => unit.t_courseId == course.id)
        const all_Lessons_in_units_this_course: t_lessonsType = []

        this_courseUnits.map(unit => {
            unit.t_lessons.map(t_lessons => {
                all_Lessons_in_units_this_course.push(t_lessons.id)
                allLessonsIds.push(t_lessons.id)
            })
        })

        return {
            courseId: course.id,
            courseTitle: course.title,
            lessons: all_Lessons_in_units_this_course,
        }
    })

    const initialCheckState = allLessonsIds.map(lessonId => ({
        lessonId: lessonId,
        isChecked: false,
    }))

    const [checkedState, setCheckedState] = useState(initialCheckState)

    const handleOnChange = (checkedId: number) => {
        const newState = checkedState.map(el => {
            if (el.lessonId === checkedId) {
                return { lessonId: el.lessonId, isChecked: !el.isChecked }
            }
            return el
        })

        setCheckedState(newState)
        setHwTLessonIds(newState.filter(el => el.isChecked).map(el => el.lessonId))
    }

    const onButtonPressSendHW = () => {
        startTransition(async () => {
            if (pending) return
            
            const selectedLessonIds = checkedState
                .filter(el => el.isChecked)
                .map(el => el.lessonId)
            
            if (selectedLessonIds.length === 0) {
                toast.error('Выберите хотя бы один урок')
                return
            }
            
            try {
                await upsertTrainerHomework(cur_class_id, selectedLessonIds)
                toast.success('✅ ДЗ по тренажеру выдано!')
                
                // Сбрасываем выбранные чекбоксы
                setCheckedState(initialCheckState)
                setHwTLessonIds([])
                
            } catch (error) {
                toast.error('❌ Ошибка при выдаче ДЗ')
                console.error(error)
            }
        })
    }

    if (!t_courses || t_courses.length === 0) {
        return <div className="text-center py-8 text-[#9AA7B0]">Нет доступных курсов</div>
    }

    return (
        <div className="w-full max-w-6xl mx-auto px-4">
            <Tabs defaultValue={t_courses[0].title} className="w-full">
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

                {t_courses.map((t_course, indexCourse) => (
                    <TabsContent key={indexCourse * 19339} value={t_course.title} className="mt-0">
                        <div className="bg-[#151F23] rounded-xl border p-6">
                            <h2 className="text-2xl font-bold mb-6 text-center text-[#F2F7FB]">
                                Выберите уроки для ДЗ
                            </h2>
                            <p className="text-center text-[#9AA7B0] mb-6">
                                Отметьте уроки тренажера, которые хотите задать классу
                            </p>

                            <div className="space-y-6">
                                {t_units.filter(u => u.t_courseId === t_course.id).map((t_unit, indexUnit) => (
                                    <div key={indexUnit * 81872} className="border rounded-lg overflow-hidden">
                                        <Block className="font-bold w-full bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
                                            <div className="flex justify-between items-center">
                                                <p className="text-lg">{t_unit.title}</p>
                                                <p className="text-sm bg-white/20 px-3 py-1 rounded-full">
                                                    {indexUnit + 1}/{t_units.filter(u => u.t_courseId === t_course.id).length}
                                                </p>
                                            </div>
                                        </Block>

                                        <div className="divide-y">
                                            {t_units.filter(ul => ul.id === t_unit.id)[0]?.t_lessons?.map((t_lesson, indexLesson) => {
                                                const missedCount = hwLIdsToDoNumUsersMissed.find(el => el.lessonIdToDo === t_lesson.id)?.missNumOfToDoLIds || 0
                                                const isChecked = checkedState.find(el => el.lessonId === t_lesson.id)?.isChecked || false

                                                return (
                                                    <div key={indexLesson * 2241} className="flex items-center justify-between p-4 hover:bg-[#1A252B] transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[#9AA7B0] font-medium">{t_lesson.title}</span>
                                                            {missedCount > 0 && (
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                    missedCount === 0 
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                    {missedCount} ученик(ов) не сделали
                                                                </span>
                                                            )}
                                                        </div>
                                                        <Checkbox
                                                            checked={isChecked}
                                                            onCheckedChange={() => handleOnChange(t_lesson.id)}
                                                            className="w-5 h-5"
                                                        />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-4 border-t">
                                <Button
                                    onClick={onButtonPressSendHW}
                                    type="submit"
                                    className="w-full py-6 text-lg"
                                    variant="default"
                                    disabled={pending}
                                >
                                    {pending ? 'Отправка...' : '📚 Выдать ДЗ по тренажеру'}
                                </Button>
                            </div>

                            <div className="mt-4 text-center">
                                <p className="text-xs text-gray-400">
                                    Выбрано уроков: {checkedState.filter(el => el.isChecked).length}
                                </p>
                            </div>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}

export default TabTCoursesHW


