'use client';

import { Flame, CheckCircle2, Circle, Gift, Target } from 'lucide-react';
import { Progress } from './ui/progress';
import { useRouter } from 'next/navigation';

type TrainerQuest = {
    id: number;
    tLessonIds: string;
    completedCount: number;
    totalCount: number;
    isCompleted: boolean;
    date: Date;
    lessons?: {
        id: number;
        title: string;
        completed: boolean;
    }[];
};

type Props = {
    quest: TrainerQuest | null;
    streak: number;
    tCourseId?: number;
};

export const TrainerQuestCard = ({ quest, streak, tCourseId }: Props) => {
    const router = useRouter();

    if (!quest) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-amber-500" />
                    <h3 className="font-bold text-slate-700">Квест</h3>
                </div>
                <p className="text-sm text-slate-400 text-center py-4">
                    Загрузка квеста...
                </p>
            </div>
        );
    }

    const progress = (quest.completedCount / quest.totalCount) * 100;
    const lessons = quest.lessons || [];

    const handleLessonClick = (lessonId: number) => {
        router.push(`/t-lesson/${lessonId}?fromQuest=true&tCourseId=${tCourseId}`);
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-amber-500" />
                    <h3 className="font-bold text-slate-700">Ежедневный квест</h3>
                </div>
                {streak > 0 && (
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                        <Flame className="h-3 w-3 text-amber-500" />
                        <span className="text-xs font-bold text-amber-600">x{streak}</span>
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <div className="flex justify-between text-sm text-slate-500">
                    <span>Прогресс</span>
                    <span className="font-bold text-slate-700">{quest.completedCount}/{quest.totalCount}</span>
                </div>
                <Progress value={progress} className="h-2 bg-slate-100" indicatorClassName="bg-amber-400" />
            </div>

            <div className="space-y-2">
                {lessons.map((lesson, idx) => (
                    <div
                        key={lesson.id}
                        className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer border ${
                            lesson.completed
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-slate-50 border-slate-200 hover:border-amber-300'
                        }`}
                        onClick={() => !lesson.completed && handleLessonClick(lesson.id)}
                    >
                        <div className="flex items-center gap-2">
                            {lesson.completed ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                                <Circle className="h-4 w-4 text-slate-300" />
                            )}
                            <span className={`text-sm ${lesson.completed ? 'text-emerald-600 line-through' : 'text-slate-600'}`}>
                                {idx + 1}. {lesson.title}
                            </span>
                        </div>
                        {!lesson.completed && (
                            <Gift className="h-4 w-4 text-amber-500" />
                        )}
                    </div>
                ))}
            </div>

            {quest.isCompleted && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center text-sm text-emerald-600 font-medium">
                    Квест выполнен! +1 к стрику
                </div>
            )}
        </div>
    );
};
