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
            <div className="rounded-xl border border-game-border bg-game-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-game-gold" />
                    <h3 className="font-bold text-white">Квест</h3>
                </div>
                <p className="text-sm text-gray-400 text-center py-4">
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
        <div className="rounded-xl border border-game-border bg-game-card p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-game-gold" />
                    <h3 className="font-bold text-white">Ежедневный квест</h3>
                </div>
                {streak > 0 && (
                    <div className="flex items-center gap-1 bg-game-card-light px-2 py-1 rounded-full">
                        <Flame className="h-3 w-3 text-game-gold" />
                        <span className="text-xs font-bold text-game-gold">x{streak}</span>
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <div className="flex justify-between text-sm text-gray-300">
                    <span>Прогресс</span>
                    <span className="font-bold text-white">{quest.completedCount}/{quest.totalCount}</span>
                </div>
                <Progress value={progress} className="h-2 bg-game-card-light" indicatorClassName="bg-game-gold" />
            </div>

            <div className="space-y-2">
                {lessons.map((lesson, idx) => (
                    <div
                        key={lesson.id}
                        className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer border ${
                            lesson.completed
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : 'bg-game-card-light border-game-border hover:border-game-gold/50'
                        }`}
                        onClick={() => !lesson.completed && handleLessonClick(lesson.id)}
                    >
                        <div className="flex items-center gap-2">
                            {lesson.completed ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : (
                                <Circle className="h-4 w-4 text-gray-500" />
                            )}
                            <span className={`text-sm ${lesson.completed ? 'text-emerald-400 line-through' : 'text-gray-200'}`}>
                                {idx + 1}. {lesson.title}
                            </span>
                        </div>
                        {!lesson.completed && (
                            <Gift className="h-4 w-4 text-game-gold" />
                        )}
                    </div>
                ))}
            </div>

            {quest.isCompleted && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 text-center text-sm text-emerald-400 font-medium">
                    Квест выполнен! +1 к стрику
                </div>
            )}
        </div>
    );
};
