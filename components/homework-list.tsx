// components/homework-list.tsx

'use client';

import { format, isPast, differenceInHours } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Clock, AlertCircle, CheckCircle, Skull, ChevronRight, BookOpen, Gift, Sparkles } from 'lucide-react';
import { Progress } from './ui/progress';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PALETTE_RED } from '@/src/constants/lessonButtonColors';

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
    // Тип оставлен как объединение (не сужен до 'teacher') — Props этого
    // компонента приходят из общего getUserHomework(), который всё ещё
    // может вернуть исторические 'daily'-строки (данные не удалены, см.
    // actions/generate-homework.ts) — компонент их просто отфильтровывает.
    type: 'teacher' | 'daily';
};

type Props = {
    activeHomework: Homework[];
    expiredHomework: Homework[];
    completedHomework: Homework[];
};

export const HomeworkList = ({ activeHomework, expiredHomework, completedHomework }: Props) => {
    const router = useRouter();

    // "Челлендж дня" (type='daily', автогенерация 2 фиксированных задач
    // каждый день) убран отсюда — пользователь попросил объединить его
    // с "Квест дня" (components/trainer-quest-card.tsx), где та же
    // механика (дедлайн/очки/история/стрик) работает БЕЗ привязки к
    // конкретным id. Эта карточка теперь показывает ТОЛЬКО реальные
    // задания от учителя (type='teacher') — их generateHomework никогда
    // не касалась, эта правка их не затрагивает.
    const teacherActive = activeHomework.filter(h => h.type === 'teacher');
    const teacherExpired = expiredHomework.filter(h => h.type === 'teacher');
    const teacherCompleted = completedHomework.filter(h => h.type === 'teacher');

    // Учительского ДЗ вообще никогда не было (ни активного, ни
    // просроченного, ни выполненного) — раньше карточка всё равно
    // рисовалась с плашкой "Все задания выполнены!", потому что там
    // почти всегда был хотя бы один "Челлендж дня" (автогенерация). Тот
    // убран (см. коммент выше), и без него эта плашка вводит в
    // заблуждение — звучит как "было что-то и ты это сделал", хотя на
    // самом деле не было ничего. Пользователь поймал это живьём на
    // /learn ("похоже на кусок старого компонента") — честнее просто не
    // рисовать карточку.
    if (teacherActive.length === 0 && teacherExpired.length === 0 && teacherCompleted.length === 0) {
        return null;
    }

    const hasAnyActive = teacherActive.length > 0;

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
    const sortedTeacherActive = [...teacherActive].sort(sortByDueDate);

    const HomeworkCard = ({ hw, typeTitle, isUrgent, isExpired = false }: { hw: Homework; typeTitle: string; isUrgent: boolean; isExpired?: boolean }) => {
        const progress = getProgress(hw);
        const isCompleted = hw.correctCount >= hw.totalCount;
        // Срок мог пройти, а статус в базе ещё не успел обновиться на 'expired' —
        // визуально это тоже "просрочено", а не просто "срочно" (раньше красилось оранжевым).
        const isOverdue = isExpired || isPast(hw.dueDate);

        // Единый цвет состояния карточки: просрочено > выполнено > срочно > обычное ДЗ.
        // Ветка "челлендж дня" (мятный PALETTE_MINT) убрана вместе с самим
        // типом — эта карточка теперь показывает только type='teacher'.
        const stateColor = isOverdue
            ? PALETTE_RED.button
            : isCompleted
            ? '#4ADE80'
            : isUrgent
            ? '#FB923C'
            : '#FBBF24';

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl p-4 border cursor-pointer transition-all hover:shadow-md"
                style={{
                    background: `linear-gradient(to right, ${stateColor}1A, ${stateColor}0D)`,
                    borderColor: `${stateColor}4D`,
                }}
                onClick={() => startHomework(hw)}
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="rounded-full p-1.5 shadow-sm flex items-center justify-center" style={{ backgroundColor: stateColor }}>
                                <BookOpen className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="text-xs font-medium text-[#9AA7B0]">
                                {format(hw.assignedAt, 'dd MMMM', { locale: ru })}
                            </span>
                            <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: `${stateColor}33`, color: stateColor }}
                            >
                                {isOverdue ? 'Просрочено' : getTimeLeft(hw.dueDate)}
                            </span>
                        </div>

                        <h4 className="font-bold text-[#F2F7FB] mb-1">{typeTitle}</h4>

                        <div className="flex items-center gap-3 mt-2">
                            <div className="flex-1">
                                <Progress value={progress} className="h-2" />
                            </div>
                            <span className="text-sm font-semibold text-[#F2F7FB]">
                                {hw.correctCount}/{hw.totalCount}
                            </span>
                        </div>

                        {hw.wrongCount && hw.wrongCount > 0 && !isCompleted && !isOverdue && (
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
        <div className="bg-[#151F23] rounded-2xl border shadow-sm overflow-hidden">
            {/* Заголовок */}
            <div className="bg-[#1A252B] px-5 py-4 border-b border-[#3A464E]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-1.5">
                            <Gift className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-bold text-[#F2F7FB]">Задания</h3>
                    </div>
                    {!hasAnyActive && completedHomework.length > 0 && (
                        <div className="flex items-center gap-1 text-green-400 text-xs bg-green-500/10 px-2 py-1 rounded-full">
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
                        <p className="text-[#9AA7B0] font-medium">Все задания выполнены!</p>
                        <p className="text-xs text-gray-400 mt-1">Отличная работа, продолжай в том же духе</p>
                    </motion.div>
                )}

                {/* Просроченные задания (сворачиваемые) */}
                {teacherExpired.length > 0 && (
                    <details className="mt-4">
                        <summary
                            className="cursor-pointer text-sm flex items-center gap-2 py-2"
                            style={{ color: PALETTE_RED.button }}
                        >
                            <Skull className="h-4 w-4" />
                            <span className="font-medium">Просроченные ({teacherExpired.length})</span>
                        </summary>
                        <div className="mt-3 space-y-2">
                            {teacherExpired.map(hw => (
                                <div
                                    key={hw.id}
                                    className="flex items-center justify-between text-sm rounded-lg p-3"
                                    style={{ backgroundColor: `${PALETTE_RED.button}1A` }}
                                >
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4" style={{ color: PALETTE_RED.button }} />
                                        <span className="text-[#9AA7B0]">ДЗ</span>
                                        <span className="text-gray-400 text-xs">{format(hw.assignedAt, 'dd MMM', { locale: ru })}</span>
                                    </div>
                                    <span className="font-medium" style={{ color: PALETTE_RED.button }}>{hw.correctCount}/{hw.totalCount}</span>
                                </div>
                            ))}
                        </div>
                    </details>
                )}

                {/* Выполненные задания (сворачиваемые) */}
                {teacherCompleted.length > 0 && (
                    <details className="mt-4 pt-2 border-t">
                        <summary className="cursor-pointer text-sm text-[#9AA7B0] hover:text-[#9AA7B0] flex items-center gap-2 py-2">
                            <CheckCircle className="h-4 w-4" />
                            <span className="font-medium">Выполненные ({teacherCompleted.length})</span>
                        </summary>
                        <div className="mt-3 space-y-2">
                            {teacherCompleted.map(hw => (
                                <div key={hw.id} className="flex items-center justify-between text-sm bg-[#1A252B] rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-green-500" />
                                        <span className="text-[#9AA7B0]">ДЗ</span>
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
//                             <span className="text-xs text-[#9AA7B0]">{typeTitle}</span>
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
//         <div className="border-2 rounded-xl p-4 space-y-4 bg-[#151F23]">
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
//         <div className="border-2 rounded-xl p-4 space-y-4 bg-[#151F23]">
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
//                                             <span className="text-xs text-[#9AA7B0]">{getTypeLabel(type)}</span>
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


