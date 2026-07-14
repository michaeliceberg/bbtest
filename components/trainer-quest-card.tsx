'use client';

import { Flame, CheckCircle, Circle, Gift } from 'lucide-react';
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
    tCourseId?: number;  // ← добавляем пропс
};

export const TrainerQuestCard = ({ quest, streak, tCourseId }: Props) => {
    const router = useRouter();
    
    if (!quest) {
        return (
            <div className="border-2 rounded-xl p-4 space-y-4 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    <h3 className="font-bold text-lg">Квест</h3>
                </div>
                <p className="text-sm text-gray-500 text-center py-4">
                    🔄 Загрузка квеста...
                </p>
            </div>
        );
    }
    
    const progress = (quest.completedCount / quest.totalCount) * 100;
    const lessons = quest.lessons || [];
    
    const handleLessonClick = (lessonId: number) => {
        // Используем переданный tCourseId
        router.push(`/t-lesson/${lessonId}?fromQuest=true&tCourseId=${tCourseId}`);
    };
    
    return (
        <div className="border-2 rounded-xl p-4 space-y-4 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    <h3 className="font-bold text-lg">🔥 Ежедневный квест</h3>
                </div>
                {streak > 0 && (
                    <div className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-full">
                        <Flame className="h-3 w-3 text-orange-500" />
                        <span className="text-xs font-bold text-orange-700">стрик x{streak}</span>
                    </div>
                )}
            </div>
            
            <div className="space-y-1">
                <div className="flex justify-between text-sm">
                    <span>Прогресс</span>
                    <span className="font-bold">{quest.completedCount}/{quest.totalCount}</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>
            
            <div className="space-y-2">
                {lessons.map((lesson, idx) => (
                    <div 
                        key={lesson.id}
                        className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer ${
                            lesson.completed 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-white border border-gray-200 hover:shadow-md'
                        }`}
                        onClick={() => !lesson.completed && handleLessonClick(lesson.id)}
                    >
                        <div className="flex items-center gap-2">
                            {lesson.completed ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                                <Circle className="h-4 w-4 text-gray-300" />
                            )}
                            <span className={`text-sm ${lesson.completed ? 'text-green-600 line-through' : 'text-gray-700'}`}>
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
                <div className="bg-green-100 rounded-lg p-2 text-center text-sm text-green-700">
                    🎉 Квест выполнен! +1 к стрику!
                </div>
            )}
        </div>
    );
};



// 'use client';

// import { Flame, CheckCircle, Circle, Gift } from 'lucide-react';
// import { Progress } from './ui/progress';
// import { useRouter } from 'next/navigation';

// type TrainerQuest = {
//     id: number;
//     tLessonIds: string;
//     completedCount: number;
//     totalCount: number;
//     isCompleted: boolean;
//     date: Date;
//     lessons?: {
//         id: number;
//         title: string;
//         completed: boolean;
//     }[];
// };

// type Props = {
//     quest: TrainerQuest | null;
//     streak: number;
//     // onLessonClick - удаляем, будем использовать router.push напрямую
// };

// export const TrainerQuestCard = ({ quest, streak }: Props) => {
//     const router = useRouter();
    
//     if (!quest) {
//         return (
//             <div className="border-2 rounded-xl p-4 space-y-4 bg-gradient-to-r from-indigo-50 to-purple-50">
//                 <div className="flex items-center gap-2">
//                     <Flame className="h-5 w-5 text-orange-500" />
//                     <h3 className="font-bold text-lg">Квест</h3>
//                 </div>
//                 <p className="text-sm text-gray-500 text-center py-4">
//                     🔄 Загрузка квеста...
//                 </p>
//             </div>
//         );
//     }
    
//     const progress = (quest.completedCount / quest.totalCount) * 100;
//     const lessons = quest.lessons || [];
    
//     const handleLessonClick = (lessonId: number) => {
//         // Получаем tCourseId из URL или из пропсов
//         const urlParams = new URLSearchParams(window.location.search);
//         const tCourseId = urlParams.get('tCourseId') || '';
//         router.push(`/t-lesson/${lessonId}?fromQuest=true&tCourseId=${tCourseId}`);
//     };
    
//     return (
//         <div className="border-2 rounded-xl p-4 space-y-4 bg-gradient-to-r from-indigo-50 to-purple-50">
//             <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                     <Flame className="h-5 w-5 text-orange-500" />
//                     <h3 className="font-bold text-lg">🔥 Ежедневный квест</h3>
//                 </div>
//                 {streak > 0 && (
//                     <div className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-full">
//                         <Flame className="h-3 w-3 text-orange-500" />
//                         <span className="text-xs font-bold text-orange-700">стрик x{streak}</span>
//                     </div>
//                 )}
//             </div>
            
//             <div className="space-y-1">
//                 <div className="flex justify-between text-sm">
//                     <span>Прогресс</span>
//                     <span className="font-bold">{quest.completedCount}/{quest.totalCount}</span>
//                 </div>
//                 <Progress value={progress} className="h-2" />
//             </div>
            
//             <div className="space-y-2">
//                 {lessons.map((lesson, idx) => (
//                     <div 
//                         key={lesson.id}
//                         className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer ${
//                             lesson.completed 
//                                 ? 'bg-green-50 border border-green-200' 
//                                 : 'bg-white border border-gray-200 hover:shadow-md'
//                         }`}
//                         onClick={() => !lesson.completed && handleLessonClick(lesson.id)}
//                     >
//                         <div className="flex items-center gap-2">
//                             {lesson.completed ? (
//                                 <CheckCircle className="h-4 w-4 text-green-500" />
//                             ) : (
//                                 <Circle className="h-4 w-4 text-gray-300" />
//                             )}
//                             <span className={`text-sm ${lesson.completed ? 'text-green-600 line-through' : 'text-gray-700'}`}>
//                                 {idx + 1}. {lesson.title}
//                             </span>
//                         </div>
//                         {!lesson.completed && (
//                             <Gift className="h-4 w-4 text-amber-500" />
//                         )}
//                     </div>
//                 ))}
//             </div>
            
//             {quest.isCompleted && (
//                 <div className="bg-green-100 rounded-lg p-2 text-center text-sm text-green-700">
//                     🎉 Квест выполнен! +1 к стрику!
//                 </div>
//             )}
//         </div>
//     );
// };



// // components/trainer-quest-card.tsx

// 'use client';

// import { Flame, CheckCircle, Circle, Gift } from 'lucide-react';
// import { Progress } from './ui/progress';
// import { useRouter } from 'next/navigation';

// type TrainerQuest = {
//     id: number;
//     tLessonIds: string;
//     completedCount: number;
//     totalCount: number;
//     isCompleted: boolean;  // ← должно быть boolean, не null
//     date: Date;
//     lessons?: {
//         id: number;
//         title: string;
//         completed: boolean;
//     }[];
// };

// type Props = {
//     quest: TrainerQuest | null;
//     streak: number;
//     onLessonClick?: (tLessonId: number) => void;
// };

// export const TrainerQuestCard = ({ quest, streak, onLessonClick }: Props) => {
//     const router = useRouter();

//     if (!quest) {
//         return (
//             <div className="border-2 rounded-xl p-4 space-y-4 bg-gradient-to-r from-indigo-50 to-purple-50">
//                 <div className="flex items-center gap-2">
//                     <Flame className="h-5 w-5 text-orange-500" />
//                     <h3 className="font-bold text-lg">Квест</h3>
//                 </div>
//                 <p className="text-sm text-gray-500 text-center py-4">
//                     🔄 Загрузка квеста...
//                 </p>
//             </div>
//         );
//     }
    
//     const progress = (quest.completedCount / quest.totalCount) * 100;
//     const lessons = quest.lessons || [];
    
//     const handleLessonClick = (lessonId: number) => {
//         if (onLessonClick) {
//             onLessonClick(lessonId);
//         } else {
//             router.push(`/t-lesson/${lessonId}?fromQuest=true`);
//         }
//     };
    
//     return (
//         <div className="border-2 rounded-xl p-4 space-y-4 bg-gradient-to-r from-indigo-50 to-purple-50">
//             <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                     <Flame className="h-5 w-5 text-orange-500" />
//                     <h3 className="font-bold text-lg">🔥 Ежедневный квест</h3>
//                 </div>
//                 {streak > 0 && (
//                     <div className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-full">
//                         <Flame className="h-3 w-3 text-orange-500" />
//                         <span className="text-xs font-bold text-orange-700">стрик x{streak}</span>
//                     </div>
//                 )}
//             </div>
            
//             <div className="space-y-1">
//                 <div className="flex justify-between text-sm">
//                     <span>Прогресс</span>
//                     <span className="font-bold">{quest.completedCount}/{quest.totalCount}</span>
//                 </div>
//                 <Progress value={progress} className="h-2" />
//             </div>
            
//             <div className="space-y-2">
//                 {lessons.map((lesson, idx) => (
//                     <div 
//                         key={lesson.id}
//                         className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer ${
//                             lesson.completed 
//                                 ? 'bg-green-50 border border-green-200' 
//                                 : 'bg-white border border-gray-200 hover:shadow-md'
//                         }`}
//                         onClick={() => !lesson.completed && handleLessonClick(lesson.id)}
//                     >
//                         <div className="flex items-center gap-2">
//                             {lesson.completed ? (
//                                 <CheckCircle className="h-4 w-4 text-green-500" />
//                             ) : (
//                                 <Circle className="h-4 w-4 text-gray-300" />
//                             )}
//                             <span className={`text-sm ${lesson.completed ? 'text-green-600 line-through' : 'text-gray-700'}`}>
//                                 {idx + 1}. {lesson.title}
//                             </span>
//                         </div>
//                         {!lesson.completed && (
//                             <Gift className="h-4 w-4 text-amber-500" />
//                         )}
//                     </div>
//                 ))}
//             </div>
            
//             {quest.isCompleted && (
//                 <div className="bg-green-100 rounded-lg p-2 text-center text-sm text-green-700">
//                     🎉 Квест выполнен! +1 к стрику!
//                 </div>
//             )}
//         </div>
//     );
// };