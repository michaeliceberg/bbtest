// components/tab-courses-hw.tsx

'use client'

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { allTypesCT, challengeProgress, courses, } from "@/db/schema";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Block } from "@/components/block";
import { upsertClassHW } from "@/actions/class-hw-update";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {
    courses: typeof courses.$inferSelect[],
    units: {
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
                difficulty: string;
                id: number;
                points: number;
                order: number;
                type: allTypesCT;
                question: string;
                author: string;
                lessonId: number;
                challengeProgress: typeof challengeProgress.$inferSelect[];
            }[];
        }[];
    }[],
    cur_class_id: number,
    hwCIdsToDoNumUsersMissed: {
        challengeIdToDo: number;
        missNumOfToDoCIds: number;
    }[],
    hwTLessonIds: number[],
    nUsersDoneCurChallenge: {
        challengeId: number;
        nUsersDone: number;
    }[],
}

export const TabCoursesHW = ({
    courses,
    units,
    hwCIdsToDoNumUsersMissed,
    cur_class_id,
    hwTLessonIds,
    nUsersDoneCurChallenge,
}: Props) => {
    const [showFormulas, setShowFormulas] = useState(false)
    const [pending, startTransition] = useTransition()
    const [hwListChallengeIds, setHwListChallengeIds] = useState<number[]>([])

    const handleChallengeClick = (challengeId: number) => {
        setHwListChallengeIds(prev => 
            prev.includes(challengeId) 
                ? prev.filter(id => id !== challengeId)
                : [...prev, challengeId]
        )
    }

    const onButtonPressSendHW = () => {
        startTransition(async () => {
            if (pending) return
            
            if (hwListChallengeIds.length === 0 && hwTLessonIds.length === 0) {
                toast.error('Выберите хотя бы одно задание или урок тренажера')
                return
            }
            
            try {
                await upsertClassHW(cur_class_id, hwTLessonIds, hwListChallengeIds)
                toast.success('✅ ДЗ успешно отправлено!')
                
                // Сбрасываем выбранные задания
                setHwListChallengeIds([])
                
            } catch (error) {
                toast.error('❌ Ошибка при выдаче ДЗ')
                console.error(error)
            }
        })
    }

    if (!courses || courses.length === 0) {
        return <div className="text-center py-8 text-[#9AA7B0]">Нет доступных курсов</div>
    }

    return (
        <div className="w-full max-w-6xl mx-auto px-4 mt-8">
            <Tabs defaultValue={courses[0].title} className="w-full">
                <div className="flex justify-center mb-6">
                    <TabsList className="bg-[#232F34] rounded-xl p-1">
                        {courses.map((course, index) => (
                            <TabsTrigger
                                key={index * 21983}
                                value={course.title}
                                className="data-[state=active]:bg-[#151F23] data-[state=active]:shadow-sm px-4 py-2"
                            >
                                {course.title.split(' ')[0]}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {courses.map((course, indexCourse) => (
                    <TabsContent key={indexCourse * 19339} value={course.title} className="mt-0">
                        <div className="bg-[#151F23] rounded-xl border p-6">
                            <h2 className="text-2xl font-bold mb-6 text-center text-[#F2F7FB]">
                                Выберите задания для ДЗ
                            </h2>
                            <p className="text-center text-[#9AA7B0] mb-6">
                                Нажмите на номер задания, чтобы добавить его в ДЗ
                            </p>

                            <div className="space-y-6">
                                {units.filter(u => u.courseId === course.id).map((unit, indexUnit) => (
                                    <div key={indexUnit * 81872} className="border rounded-lg overflow-hidden">
                                        <Block className="font-bold w-full bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                                            <div className="flex justify-between items-center">
                                                <p className="text-lg">{unit.title}</p>
                                                <p className="text-sm bg-white/20 px-3 py-1 rounded-full">
                                                    {indexUnit + 1}/{units.filter(u => u.courseId === course.id).length}
                                                </p>
                                            </div>
                                        </Block>

                                        <div className="divide-y">
                                            {units.filter(u => u.id === unit.id)[0]?.lessons?.map((lesson, lessonIndex) => (
                                                <div key={lessonIndex} className="p-4">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="font-medium text-[#F2F7FB]">{lesson.title}</span>
                                                        <span className="text-xs text-gray-400">({lesson.challenges.length} заданий)</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {lesson.challenges.map((challenge, challengeIndex) => {
                                                            const missedCount = hwCIdsToDoNumUsersMissed.find(
                                                                el => el.challengeIdToDo === challenge.id
                                                            )?.missNumOfToDoCIds || 0
                                                            
                                                            const nUsersDone = nUsersDoneCurChallenge.find(
                                                                el => el.challengeId === challenge.id
                                                            )?.nUsersDone || 0
                                                            
                                                            const isSelected = hwListChallengeIds.includes(challenge.id)

                                                            return (
                                                                <Button
                                                                    key={challengeIndex * 44289}
                                                                    variant={isSelected ? 'default' : 'secondaryOutline'}
                                                                    onClick={() => handleChallengeClick(challenge.id)}
                                                                    className="relative min-w-[60px]"
                                                                    size="sm"
                                                                >
                                                                    <div className="flex flex-col items-center">
                                                                        <span>{challenge.id % 1000}</span>
                                                                        <div className="flex gap-1 text-[10px] mt-0.5">
                                                                            {missedCount > 0 && (
                                                                                <span className={`px-1 rounded ${
                                                                                    missedCount === 0 
                                                                                        ? 'bg-green-100 text-green-700'
                                                                                        : 'bg-red-100 text-red-700'
                                                                                }`}>
                                                                                    🏡{missedCount}
                                                                                </span>
                                                                            )}
                                                                            {nUsersDone > 0 && (
                                                                                <span className="bg-blue-100 text-blue-700 px-1 rounded">
                                                                                    👍{nUsersDone}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </Button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-4 border-t">
                                <div className="mb-4 p-3 bg-[#1A252B] rounded-lg">
                                    <p className="text-sm text-[#9AA7B0]">
                                        📋 Выбрано заданий: <span className="font-bold text-blue-600">{hwListChallengeIds.length}</span>
                                    </p>
                                    {hwTLessonIds.length > 0 && (
                                        <p className="text-sm text-[#9AA7B0] mt-1">
                                            🎯 Выбрано уроков тренажера: <span className="font-bold text-green-600">{hwTLessonIds.length}</span>
                                        </p>
                                    )}
                                </div>
                                
                                <Button
                                    onClick={onButtonPressSendHW}
                                    type="submit"
                                    className="w-full py-6 text-lg"
                                    variant="default"
                                    disabled={pending}
                                >
                                    {pending ? 'Отправка...' : '📚 Выдать ДЗ'}
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}

export default TabCoursesHW


