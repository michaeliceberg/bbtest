// components/homework-list.tsx

'use client';

import { format, isPast, differenceInHours } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Clock, AlertCircle, CheckCircle, Skull, ChevronRight, Zap, BookOpen, Gift, Sparkles } from 'lucide-react';
import { Progress } from './ui/progress';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

type Homework = {
    id: number;
    challengeIds: string | null;
    tLessonIds: string | null;
    assignedAt: Date;
    dueDate: Date;
    status: string;
    correctCount: number;
    totalCount: number;
    wrongCount?: number;
    type: 'teacher' | 'daily';
};

type Props = {
    activeHomework: Homework[];
    expiredHomework: Homework[];
    completedHomework: Homework[];
};

export const HomeworkList = ({ activeHomework, expiredHomework, completedHomework }: Props) => {
    const router = useRouter();

    const dailyActive = activeHomework.filter(h => h.type === 'daily');
    const teacherActive = activeHomework.filter(h => h.type === 'teacher');
    const dailyExpired = expiredHomework.filter(h => h.type === 'daily');
    const teacherExpired = expiredHomework.filter(h => h.type === 'teacher');
    const dailyCompleted = completedHomework.filter(h => h.type === 'daily');
    const teacherCompleted = completedHomework.filter(h => h.type === 'teacher');

    const hasAnyActive = dailyActive.length > 0 || teacherActive.length > 0;

    const getStatusIcon = (status: string, dueDate: Date) => {
        if (status === 'completed') {
            return <CheckCircle className="h-4 w-4 text-green-500" />;
        }
        if (status === 'expired' || isPast(dueDate)) {
            return <Skull className="h-4 w-4 text-red-500" />;
        }
        const hoursLeft = differenceInHours(dueDate, new Date());
        if (hoursLeft < 3) {
            return <AlertCircle className="h-4 w-4 text-orange-500 animate-pulse" />;
        }
        return <Clock className="h-4 w-4 text-amber-500" />;
    };

    const getTimeLeft = (dueDate: Date) => {
        if (isPast(dueDate)) return 'Просрочено';
        const hours = differenceInHours(dueDate, new Date());
        if (hours < 1) return '< 1 часа';
        if (hours < 24) return `${hours} ч`;
        return format(dueDate, 'd MMM', { locale: ru });
    };

    const getProgress = (homework: Homework) => {
        if (homework.totalCount === 0) return 0;
        return (homework.correctCount / homework.totalCount) * 100;
    };

    const startHomework = (homework: Homework) => {
        const challengeIds = homework.challengeIds?.split(',').map(Number) || [];
        if (challengeIds.length > 0) {
            router.push(`/lesson/${challengeIds[0]}?homeworkId=${homework.id}`);
        }
    };

    const sortByDueDate = (a: Homework, b: Homework) => a.dueDate.getTime() - b.dueDate.getTime();
    const sortedDailyActive = [...dailyActive].sort(sortByDueDate);
    const sortedTeacherActive = [...teacherActive].sort(sortByDueDate);

    const HomeworkCard = ({ hw, typeTitle, isUrgent, isExpired = false }: { hw: Homework; typeTitle: string; isUrgent: boolean; isExpired?: boolean }) => {
        const progress = getProgress(hw);
        const isCompleted = hw.correctCount >= hw.totalCount;
        
        const getCardColor = () => {
            if (isExpired) return 'from-red-50 to-red-100 border-red-200';
            if (isCompleted) return 'from-green-50 to-emerald-100 border-green-200';
            if (isUrgent) return 'from-orange-50 to-amber-100 border-orange-200';
            return hw.type === 'daily' ? 'from-purple-50 to-fuchsia-100 border-purple-200' : 'from-amber-50 to-yellow-100 border-amber-200';
        };
        
        const getIconBg = () => {
            if (isExpired) return 'bg-red-500';
            if (isCompleted) return 'bg-green-500';
            if (isUrgent) return 'bg-orange-500';
            return hw.type === 'daily' ? 'bg-purple-500' : 'bg-amber-500';
        };

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                className={`bg-gradient-to-r ${getCardColor()} rounded-xl p-4 border cursor-pointer transition-all hover:shadow-md`}
                onClick={() => startHomework(hw)}
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`${getIconBg()} rounded-full p-1.5 shadow-sm`}>
                                {hw.type === 'daily' ? (
                                    <Zap className="h-3.5 w-3.5 text-white" />
                                ) : (
                                    <BookOpen className="h-3.5 w-3.5 text-white" />
                                )}
                            </div>
                            <span className="text-xs font-medium text-gray-500">
                                {format(hw.assignedAt, 'dd MMMM', { locale: ru })}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                isExpired ? 'bg-red-200 text-red-700' :
                                isCompleted ? 'bg-green-200 text-green-700' :
                                isUrgent ? 'bg-orange-200 text-orange-700' :
                                hw.type === 'daily' ? 'bg-purple-200 text-purple-700' : 'bg-amber-200 text-amber-700'
                            }`}>
                                {isExpired ? 'Просрочено' : getTimeLeft(hw.dueDate)}
                            </span>
                        </div>
                        
                        <h4 className="font-bold text-gray-800 mb-1">{typeTitle}</h4>
                        
                        <div className="flex items-center gap-3 mt-2">
                            <div className="flex-1">
                                <Progress value={progress} className="h-2" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">
                                {hw.correctCount}/{hw.totalCount}
                            </span>
                        </div>
                        
                        {hw.wrongCount && hw.wrongCount > 0 && !isCompleted && !isExpired && (
                            <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                                <Skull className="h-3 w-3" />
                                ошибок: {hw.wrongCount}
                            </p>
                        )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 mt-1" />
                </div>
            </motion.div>
        );
    };

    return (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            {/* Заголовок */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-4 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-1.5">
                            <Gift className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-800">Задания</h3>
                    </div>
                    {!hasAnyActive && completedHomework.length > 0 && (
                        <div className="flex items-center gap-1 text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full">
                            <Sparkles className="h-3 w-3" />
                            <span>Все выполнено!</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Активные задания */}
                {hasAnyActive ? (
                    <>
                        {sortedDailyActive.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-1 h-5 bg-purple-500 rounded-full" />
                                    <h4 className="text-sm font-semibold text-purple-700">Челлендж дня</h4>
                                </div>
                                <div className="space-y-3">
                                    {sortedDailyActive.map(hw => {
                                        const isUrgent = differenceInHours(hw.dueDate, new Date()) < 3;
                                        return <HomeworkCard key={hw.id} hw={hw} typeTitle="Челлендж дня" isUrgent={isUrgent} />;
                                    })}
                                </div>
                            </div>
                        )}

                        {sortedTeacherActive.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-1 h-5 bg-amber-500 rounded-full" />
                                    <h4 className="text-sm font-semibold text-amber-700">Домашняя работа</h4>
                                </div>
                                <div className="space-y-3">
                                    {sortedTeacherActive.map(hw => {
                                        const isUrgent = differenceInHours(hw.dueDate, new Date()) < 3;
                                        return <HomeworkCard key={hw.id} hw={hw} typeTitle="Домашняя работа" isUrgent={isUrgent} />;
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8"
                    >
                        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                            <CheckCircle className="h-8 w-8 text-white" />
                        </div>
                        <p className="text-gray-600 font-medium">Все задания выполнены!</p>
                        <p className="text-xs text-gray-400 mt-1">Отличная работа, продолжай в том же духе</p>
                    </motion.div>
                )}

                {/* Просроченные задания (сворачиваемые) */}
                {(dailyExpired.length > 0 || teacherExpired.length > 0) && (
                    <details className="mt-4">
                        <summary className="cursor-pointer text-sm text-red-500 hover:text-red-600 flex items-center gap-2 py-2">
                            <Skull className="h-4 w-4" />
                            <span className="font-medium">Просроченные ({dailyExpired.length + teacherExpired.length})</span>
                        </summary>
                        <div className="mt-3 space-y-2">
                            {dailyExpired.map(hw => (
                                <div key={hw.id} className="flex items-center justify-between text-sm bg-red-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-red-400" />
                                        <span className="text-gray-600">Челлендж</span>
                                        <span className="text-gray-400 text-xs">{format(hw.assignedAt, 'dd MMM', { locale: ru })}</span>
                                    </div>
                                    <span className="text-red-500 font-medium">{hw.correctCount}/{hw.totalCount}</span>
                                </div>
                            ))}
                            {teacherExpired.map(hw => (
                                <div key={hw.id} className="flex items-center justify-between text-sm bg-red-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-red-400" />
                                        <span className="text-gray-600">ДЗ</span>
                                        <span className="text-gray-400 text-xs">{format(hw.assignedAt, 'dd MMM', { locale: ru })}</span>
                                    </div>
                                    <span className="text-red-500 font-medium">{hw.correctCount}/{hw.totalCount}</span>
                                </div>
                            ))}
                        </div>
                    </details>
                )}

                {/* Выполненные задания (сворачиваемые) */}
                {(dailyCompleted.length > 0 || teacherCompleted.length > 0) && (
                    <details className="mt-4 pt-2 border-t">
                        <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-600 flex items-center gap-2 py-2">
                            <CheckCircle className="h-4 w-4" />
                            <span className="font-medium">Выполненные ({dailyCompleted.length + teacherCompleted.length})</span>
                        </summary>
                        <div className="mt-3 space-y-2">
                            {dailyCompleted.map(hw => (
                                <div key={hw.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-green-500" />
                                        <span className="text-gray-500">Челлендж</span>
                                        <span className="text-gray-400 text-xs">{format(hw.assignedAt, 'dd MMM', { locale: ru })}</span>
                                    </div>
                                    <span className="text-green-600">✓ {hw.correctCount}/{hw.totalCount}</span>
                                </div>
                            ))}
                            {teacherCompleted.map(hw => (
                                <div key={hw.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-green-500" />
                                        <span className="text-gray-500">ДЗ</span>
                                        <span className="text-gray-400 text-xs">{format(hw.assignedAt, 'dd MMM', { locale: ru })}</span>
                                    </div>
                                    <span className="text-green-600">✓ {hw.correctCount}/{hw.totalCount}</span>
                                </div>
                            ))}
                        </div>
                    </details>
                )}
            </div>
        </div>
    );
};














// // components/homework-list.tsx

// 'use client';

// import { format, isPast, differenceInHours } from 'date-fns';
// import { ru } from 'date-fns/locale';
// import { Clock, AlertCircle, CheckCircle, Skull, ChevronRight, Zap, BookOpen } from 'lucide-react';
// import { Progress } from './ui/progress';
// import { useRouter } from 'next/navigation';

// type Homework = {
//     id: number;
//     challengeIds: string | null;
//     tLessonIds: string | null;
//     assignedAt: Date;
//     dueDate: Date;
//     status: string;
//     correctCount: number;
//     totalCount: number;
//     wrongCount?: number;
//     type: 'teacher' | 'daily';  // ← добавляем тип
// };

// type Props = {
//     activeHomework: Homework[];
//     expiredHomework: Homework[];
//     completedHomework: Homework[];
// };

// export const HomeworkList = ({ activeHomework, expiredHomework, completedHomework }: Props) => {
//     const router = useRouter();

//     // Разделяем по типам
//     const dailyActive = activeHomework.filter(h => h.type === 'daily');
//     const teacherActive = activeHomework.filter(h => h.type === 'teacher');
//     const dailyExpired = expiredHomework.filter(h => h.type === 'daily');
//     const teacherExpired = expiredHomework.filter(h => h.type === 'teacher');
//     const dailyCompleted = completedHomework.filter(h => h.type === 'daily');
//     const teacherCompleted = completedHomework.filter(h => h.type === 'teacher');

//     const getStatusIcon = (status: string, dueDate: Date, type: string) => {
//         if (status === 'completed') {
//             return <CheckCircle className="h-4 w-4 text-green-500" />;
//         }
//         if (status === 'expired' || isPast(dueDate)) {
//             return <Skull className="h-4 w-4 text-red-500" />;
//         }
//         const hoursLeft = differenceInHours(dueDate, new Date());
//         if (hoursLeft < 3) {
//             return <AlertCircle className="h-4 w-4 text-orange-500 animate-pulse" />;
//         }
//         return <Clock className="h-4 w-4 text-amber-500" />;
//     };

//     const getTypeIcon = (type: string) => {
//         if (type === 'daily') {
//             return <Zap className="h-4 w-4 text-purple-500" />;
//         }
//         return <BookOpen className="h-4 w-4 text-orange-500" />;
//     };

//     const getTypeTitle = (type: string) => {
//         if (type === 'daily') {
//             return '⚡ Челлендж дня';
//         }
//         return '📚 Домашняя работа';
//     };

//     const getTypeColor = (type: string) => {
//         if (type === 'daily') {
//             return 'from-purple-500 to-purple-600 border-purple-200';
//         }
//         return 'from-orange-500 to-orange-600 border-orange-200';
//     };

//     const getTimeLeft = (dueDate: Date) => {
//         if (isPast(dueDate)) return 'Просрочено';
//         const hours = differenceInHours(dueDate, new Date());
//         if (hours < 1) return '< 1 часа';
//         if (hours < 24) return `${hours} ч`;
//         return format(dueDate, 'd MMM', { locale: ru });
//     };

//     const getProgress = (homework: Homework) => {
//         if (homework.totalCount === 0) return 0;
//         return (homework.correctCount / homework.totalCount) * 100;
//     };

//     const isFullyCompleted = (homework: Homework) => {
//         return homework.correctCount >= homework.totalCount;
//     };

//     const startHomework = (homework: Homework) => {
//         const challengeIds = homework.challengeIds?.split(',').map(Number) || [];
//         if (challengeIds.length > 0) {
//             router.push(`/lesson/${challengeIds[0]}?homeworkId=${homework.id}`);
//         }
//     };

//     // Сортируем активные ДЗ по сроку (сначала самые срочные)
//     const sortByDueDate = (a: Homework, b: Homework) => a.dueDate.getTime() - b.dueDate.getTime();
//     const sortedDailyActive = [...dailyActive].sort(sortByDueDate);
//     const sortedTeacherActive = [...teacherActive].sort(sortByDueDate);

//     const renderHomeworkCard = (hw: Homework, typeTitle: string, typeColor: string) => {
//         const isUrgent = differenceInHours(hw.dueDate, new Date()) < 3;
//         const progress = getProgress(hw);
//         const isCompleted = isFullyCompleted(hw);
        
//         return (
//             <div 
//                 key={hw.id} 
//                 className={`p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md 
//                     ${isCompleted ? 'bg-green-50 border-green-200' : 
//                       isUrgent ? 'bg-orange-50 border-orange-200' : `bg-${typeColor.includes('purple') ? 'purple' : 'orange'}-50 border-${typeColor.includes('purple') ? 'purple' : 'orange'}-200`}`}
//                 onClick={() => startHomework(hw)}
//             >
//                 <div className="flex items-center justify-between mb-2">
//                     <div className="flex items-center gap-2">
//                         {getStatusIcon(hw.status, hw.dueDate, hw.type)}
//                         <div className="flex items-center gap-1">
//                             {getTypeIcon(hw.type)}
//                             <span className="text-xs text-gray-500">{typeTitle}</span>
//                         </div>
//                         <span className="text-sm font-medium">
//                             {format(hw.assignedAt, 'dd MMM', { locale: ru })}
//                         </span>
//                         <span className={`text-xs px-1.5 py-0.5 rounded 
//                             ${isCompleted ? 'bg-green-200 text-green-800' :
//                               isUrgent ? 'bg-orange-200 text-orange-800' : 
//                               hw.type === 'daily' ? 'bg-purple-200 text-purple-800' : 'bg-orange-200 text-orange-800'}`}>
//                             {getTimeLeft(hw.dueDate)}
//                         </span>
//                     </div>
//                     <ChevronRight className="h-4 w-4 text-neutral-400" />
//                 </div>
//                 <div className="flex items-center gap-2">
//                     <Progress 
//                         value={progress} 
//                         className={`h-1.5 flex-1 ${
//                             isCompleted ? '[&>div]:bg-green-500' : 
//                             isUrgent ? '[&>div]:bg-orange-500' :
//                             hw.type === 'daily' ? '[&>div]:bg-purple-500' : '[&>div]:bg-orange-500'
//                         }`}
//                     />
//                     <span className={`text-xs ${isCompleted ? 'text-green-600' : 'text-neutral-500'}`}>
//                         {hw.correctCount}/{hw.totalCount}
//                     </span>
//                 </div>
                
//                 {hw.wrongCount && hw.wrongCount > 0 && !isCompleted && (
//                     <div className="text-xs text-red-400 mt-1 flex items-center gap-1">
//                         <Skull className="h-3 w-3" />
//                         ошибок: {hw.wrongCount}
//                     </div>
//                 )}
//             </div>
//         );
//     };

//     return (
//         <div className="border-2 rounded-xl p-4 space-y-4 bg-white">
//             <div className="flex items-center justify-between">
//                 <h3 className="font-bold text-lg flex items-center gap-2">
//                     📋 Задания
//                     {(dailyActive.length + teacherActive.length) > 0 && (
//                         <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
//                             {dailyActive.length + teacherActive.length}
//                         </span>
//                     )}
//                 </h3>
//             </div>

//             {/* ===== ЧЕЛЛЕНДЖ ДНЯ (ежедневное ДЗ) ===== */}
//             {sortedDailyActive.length > 0 && (
//                 <div className="space-y-3">
//                     <div className="flex items-center gap-2 pb-1 border-b border-purple-200">
//                         <Zap className="h-4 w-4 text-purple-500" />
//                         <h4 className="font-semibold text-purple-700 text-sm">Челлендж дня</h4>
//                     </div>
//                     {sortedDailyActive.map(hw => renderHomeworkCard(hw, 'Челлендж дня', 'purple'))}
//                 </div>
//             )}

//             {/* ===== ДОМАШНЯЯ РАБОТА (от учителя) ===== */}
//             {sortedTeacherActive.length > 0 && (
//                 <div className="space-y-3">
//                     <div className="flex items-center gap-2 pb-1 border-b border-orange-200">
//                         <BookOpen className="h-4 w-4 text-orange-500" />
//                         <h4 className="font-semibold text-orange-700 text-sm">Домашняя работа</h4>
//                     </div>
//                     {sortedTeacherActive.map(hw => renderHomeworkCard(hw, 'Домашняя работа', 'orange'))}
//                 </div>
//             )}

//             {/* Сообщение, если нет активных заданий */}
//             {sortedDailyActive.length === 0 && sortedTeacherActive.length === 0 && (
//                 <div className="text-center py-6 text-neutral-400 text-sm">
//                     🎉 Нет активных заданий
//                 </div>
//             )}

//             {/* ===== ПРОСРОЧЕННЫЕ ===== */}
//             {(dailyExpired.length > 0 || teacherExpired.length > 0) && (
//                 <details className="text-sm">
//                     <summary className="cursor-pointer text-red-500 hover:text-red-700 flex items-center gap-1">
//                         <Skull className="h-3 w-3" />
//                         Просроченные ({dailyExpired.length + teacherExpired.length})
//                     </summary>
//                     <div className="mt-2 space-y-2">
//                         {dailyExpired.map((hw) => (
//                             <div key={hw.id} className="flex items-center justify-between text-sm text-red-400 p-2 bg-red-50 rounded">
//                                 <div className="flex items-center gap-2">
//                                     <Zap className="h-3 w-3" />
//                                     <span>Челлендж</span>
//                                     <span>{format(hw.assignedAt, 'dd MMM', { locale: ru })}</span>
//                                 </div>
//                                 <span>{hw.correctCount}/{hw.totalCount}</span>
//                             </div>
//                         ))}
//                         {teacherExpired.map((hw) => (
//                             <div key={hw.id} className="flex items-center justify-between text-sm text-red-400 p-2 bg-red-50 rounded">
//                                 <div className="flex items-center gap-2">
//                                     <BookOpen className="h-3 w-3" />
//                                     <span>ДЗ</span>
//                                     <span>{format(hw.assignedAt, 'dd MMM', { locale: ru })}</span>
//                                 </div>
//                                 <span>{hw.correctCount}/{hw.totalCount}</span>
//                             </div>
//                         ))}
//                     </div>
//                 </details>
//             )}

//             {/* ===== ВЫПОЛНЕННЫЕ ===== */}
//             {(dailyCompleted.length > 0 || teacherCompleted.length > 0) && (
//                 <details className="text-sm">
//                     <summary className="cursor-pointer text-neutral-500 hover:text-neutral-700">
//                         ✅ Выполненные ({dailyCompleted.length + teacherCompleted.length})
//                     </summary>
//                     <div className="mt-2 space-y-1">
//                         {dailyCompleted.map((hw) => (
//                             <div key={hw.id} className="flex items-center justify-between text-xs text-neutral-400">
//                                 <div className="flex items-center gap-2">
//                                     <Zap className="h-3 w-3" />
//                                     <span>Челлендж</span>
//                                     <span>{format(hw.assignedAt, 'dd MMM', { locale: ru })}</span>
//                                 </div>
//                                 <span>✓ {hw.correctCount}/{hw.totalCount}</span>
//                             </div>
//                         ))}
//                         {teacherCompleted.map((hw) => (
//                             <div key={hw.id} className="flex items-center justify-between text-xs text-neutral-400">
//                                 <div className="flex items-center gap-2">
//                                     <BookOpen className="h-3 w-3" />
//                                     <span>ДЗ</span>
//                                     <span>{format(hw.assignedAt, 'dd MMM', { locale: ru })}</span>
//                                 </div>
//                                 <span>✓ {hw.correctCount}/{hw.totalCount}</span>
//                             </div>
//                         ))}
//                     </div>
//                 </details>
//             )}
//         </div>
//     );
// };




// // components/homework-list.tsx

// 'use client';

// import { format, isPast, differenceInHours } from 'date-fns';
// import { ru } from 'date-fns/locale';
// import { Clock, AlertCircle, CheckCircle, Skull, ChevronRight, BookOpen, Dumbbell } from 'lucide-react';
// import { Progress } from './ui/progress';
// import { useRouter } from 'next/navigation';

// type Homework = {
//     id: number;
//     challengeIds: string | null;
//     tLessonIds: string | null;
//     assignedAt: Date;
//     dueDate: Date;
//     status: string;
//     correctCount: number;
//     totalCount: number;
//     wrongCount?: number;
// };

// type Props = {
//     activeHomework: Homework[];
//     expiredHomework: Homework[];
//     completedHomework: Homework[];
// };

// export const HomeworkList = ({ activeHomework, expiredHomework, completedHomework }: Props) => {
//     const router = useRouter();

//     const getHomeworkType = (homework: Homework): 'challenge' | 'trainer' => {
//         return homework.challengeIds ? 'challenge' : 'trainer';
//     };

//     const getTypeIcon = (type: 'challenge' | 'trainer') => {
//         if (type === 'challenge') {
//             return <BookOpen className="h-4 w-4 text-blue-500" />;
//         }
//         return <Dumbbell className="h-4 w-4 text-purple-500" />;
//     };

//     const getTypeLabel = (type: 'challenge' | 'trainer') => {
//         return type === 'challenge' ? 'Задачник' : 'Тренажер';
//     };

//     const getStatusIcon = (status: string, dueDate: Date) => {
//         if (status === 'completed') {
//             return <CheckCircle className="h-4 w-4 text-green-500" />;
//         }
//         if (status === 'expired' || isPast(dueDate)) {
//             return <Skull className="h-4 w-4 text-red-500" />;
//         }
//         const hoursLeft = differenceInHours(dueDate, new Date());
//         if (hoursLeft < 3) {
//             return <AlertCircle className="h-4 w-4 text-orange-500 animate-pulse" />;
//         }
//         return <Clock className="h-4 w-4 text-amber-500" />;
//     };

//     const getTimeLeft = (dueDate: Date) => {
//         if (isPast(dueDate)) return 'Просрочено';
//         const hours = differenceInHours(dueDate, new Date());
//         if (hours < 1) return '< 1 часа';
//         if (hours < 24) return `${hours} ч`;
//         return format(dueDate, 'd MMM', { locale: ru });
//     };

//     const getProgress = (homework: Homework) => {
//         if (homework.totalCount === 0) return 0;
//         return (homework.correctCount / homework.totalCount) * 100;
//     };

//     const isFullyCompleted = (homework: Homework) => {
//         return homework.correctCount >= homework.totalCount;
//     };

//     const startHomework = (homework: Homework) => {
//         if (homework.challengeIds) {
//             // Задачник: переходим к первому challenge
//             const challengeIds = homework.challengeIds.split(',').map(Number);
//             if (challengeIds.length > 0) {
//                 router.push(`/lesson/${challengeIds[0]}?homeworkId=${homework.id}`);
//             }
//         } else if (homework.tLessonIds) {
//             // Тренажер: переходим к первому t_lesson
//             const tLessonIds = homework.tLessonIds.split(',').map(Number);
//             if (tLessonIds.length > 0) {
//                 router.push(`/t-lesson/${tLessonIds[0]}?fromQuest=true&homeworkId=${homework.id}`);
//             }
//         }
//     };

//     const sortedActive = [...activeHomework].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

//     return (
//         <div className="border-2 rounded-xl p-4 space-y-4 bg-white">
//             <div className="flex items-center justify-between">
//                 <h3 className="font-bold text-lg flex items-center gap-2">
//                     📚 Домашние задания
//                     {activeHomework.length > 0 && (
//                         <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
//                             {activeHomework.length}
//                         </span>
//                     )}
//                 </h3>
//             </div>

//             {/* Активные задания */}
//             {sortedActive.length > 0 ? (
//                 <div className="space-y-3">
//                     {sortedActive.map((hw) => {
//                         const type = getHomeworkType(hw);
//                         const isUrgent = differenceInHours(hw.dueDate, new Date()) < 3;
//                         const progress = getProgress(hw);
//                         const isCompleted = isFullyCompleted(hw);
                        
//                         return (
//                             <div 
//                                 key={hw.id} 
//                                 className={`p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md 
//                                     ${isCompleted ? 'bg-green-50 border-green-200' : 
//                                       isUrgent ? 'bg-orange-50 border-orange-200' : 'bg-amber-50 border-amber-200'}`}
//                                 onClick={() => startHomework(hw)}
//                             >
//                                 <div className="flex items-center justify-between mb-2">
//                                     <div className="flex items-center gap-2">
//                                         {getStatusIcon(hw.status, hw.dueDate)}
//                                         <div className="flex items-center gap-1">
//                                             {getTypeIcon(type)}
//                                             <span className="text-xs text-gray-500">{getTypeLabel(type)}</span>
//                                         </div>
//                                         <span className="text-sm font-medium">
//                                             {format(hw.assignedAt, 'dd MMM', { locale: ru })}
//                                         </span>
//                                         <span className={`text-xs px-1.5 py-0.5 rounded 
//                                             ${isCompleted ? 'bg-green-200 text-green-800' :
//                                               isUrgent ? 'bg-orange-200 text-orange-800' : 'bg-amber-200 text-amber-800'}`}>
//                                             {getTimeLeft(hw.dueDate)}
//                                         </span>
//                                     </div>
//                                     <ChevronRight className="h-4 w-4 text-neutral-400" />
//                                 </div>
//                                 <div className="flex items-center gap-2">
//                                     <Progress 
//                                         value={progress} 
//                                         className={`h-1.5 flex-1 ${
//                                             isCompleted ? '[&>div]:bg-green-500' : 
//                                             isUrgent ? '[&>div]:bg-orange-500' : '[&>div]:bg-amber-500'
//                                         }`}
//                                     />
//                                     <span className={`text-xs ${isCompleted ? 'text-green-600' : 'text-neutral-500'}`}>
//                                         {hw.correctCount}/{hw.totalCount}
//                                     </span>
//                                 </div>
                                
//                                 {hw.wrongCount && hw.wrongCount > 0 && !isCompleted && (
//                                     <div className="text-xs text-red-400 mt-1 flex items-center gap-1">
//                                         <Skull className="h-3 w-3" />
//                                         ошибок: {hw.wrongCount}
//                                     </div>
//                                 )}
//                             </div>
//                         );
//                     })}
//                 </div>
//             ) : (
//                 <div className="text-center py-6 text-neutral-400 text-sm">
//                     🎉 Нет активных заданий
//                 </div>
//             )}

//             {/* Просроченные задания */}
//             {expiredHomework.length > 0 && (
//                 <details className="text-sm">
//                     <summary className="cursor-pointer text-red-500 hover:text-red-700 flex items-center gap-1">
//                         <Skull className="h-3 w-3" />
//                         Просроченные ({expiredHomework.length})
//                     </summary>
//                     <div className="mt-2 space-y-2">
//                         {expiredHomework.map((hw) => {
//                             const type = getHomeworkType(hw);
//                             return (
//                                 <div key={hw.id} className="flex items-center justify-between text-sm text-red-400 p-2 bg-red-50 rounded">
//                                     <div className="flex items-center gap-2">
//                                         {getTypeIcon(type)}
//                                         <span>{format(hw.assignedAt, 'dd MMM', { locale: ru })}</span>
//                                     </div>
//                                     <span>{hw.correctCount}/{hw.totalCount}</span>
//                                 </div>
//                             );
//                         })}
//                     </div>
//                 </details>
//             )}

//             {/* Выполненные задания */}
//             {completedHomework.length > 0 && (
//                 <details className="text-sm">
//                     <summary className="cursor-pointer text-neutral-500 hover:text-neutral-700">
//                         ✅ Выполненные ({completedHomework.length})
//                     </summary>
//                     <div className="mt-2 space-y-1">
//                         {completedHomework.map((hw) => {
//                             const type = getHomeworkType(hw);
//                             return (
//                                 <div key={hw.id} className="flex items-center justify-between text-xs text-neutral-400">
//                                     <div className="flex items-center gap-2">
//                                         {getTypeIcon(type)}
//                                         <span>{format(hw.assignedAt, 'dd MMM', { locale: ru })}</span>
//                                     </div>
//                                     <span>✓ {hw.correctCount}/{hw.totalCount}</span>
//                                 </div>
//                             );
//                         })}
//                     </div>
//                 </details>
//             )}
//         </div>
//     );
// };


