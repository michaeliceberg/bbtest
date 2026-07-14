// // components/lesson-snake.tsx

// 'use client';

// import { motion, AnimatePresence } from 'framer-motion';
// import { Lock, Crown, Star, CheckCircle, Target, Gift, Flame } from 'lucide-react';
// import { Button } from './ui/button';
// import { TransitionLink } from '@/utils/TransitionLink';

// type Lesson = {
//     id: number;
//     title: string;
//     order: number;
//     isUnlocked: boolean;
//     isCompleted: boolean;
//     isCurrent?: boolean;
//     type?: 'normal' | 'boss' | 'bonus';
//     needMore?: number;
// };

// type Props = {
//     lessons: Lesson[];
//     unitTitle: string;
//     unitId: number;
//     onBack: () => void;
//     unitProgressPercent?: number;
// };

// const getLessonIcon = (type: string = 'normal') => {
//     switch (type) {
//         case 'boss': return '👑';
//         case 'bonus': return '🎁';
//         default: return '⚔️';
//     }
// };

// const getLessonColor = (isUnlocked: boolean, isCompleted: boolean, type: string) => {
//     if (isCompleted) return 'from-green-500 to-emerald-600';
//     if (type === 'boss') return 'from-red-500 to-orange-600';
//     if (type === 'bonus') return 'from-yellow-500 to-amber-600';
//     if (isUnlocked) return 'from-purple-500 to-indigo-600';
//     return 'from-gray-600 to-gray-700';
// };

// export const LessonSnake = ({ lessons, unitTitle, unitId, onBack, unitProgressPercent = 0 }: Props) => {
//     return (
//         <motion.div
//             initial={{ opacity: 0, scale: 0.95 }}
//             animate={{ opacity: 1, scale: 1 }}
//             exit={{ opacity: 0, scale: 0.95 }}
//             className="bg-[#0f0f1a] rounded-2xl border border-purple-500/30 overflow-hidden"
//         >
//             {/* Заголовок с прогрессом */}
//             <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 p-4 border-b border-purple-500/30">
//                 <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
//                     <button 
//                         onClick={onBack}
//                         className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
//                     >
//                         ← Назад к картам
//                     </button>
//                     <div className="flex items-center gap-2">
//                         <span className="text-2xl">📚</span>
//                         <h2 className="text-xl font-bold text-white">{unitTitle}</h2>
//                     </div>
//                     <div className="flex items-center gap-2 text-sm">
//                         <TrendingUp className="h-4 w-4 text-purple-400" />
//                         <span className="text-gray-300">Прогресс: {Math.round(unitProgressPercent * 100)}%</span>
//                     </div>
//                 </div>
                
//                 {/* Прогресс-бар юнита */}
//                 <div className="w-full bg-gray-800 rounded-full h-1.5">
//                     <div 
//                         className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-500"
//                         style={{ width: `${Math.min(100, Math.max(0, unitProgressPercent * 100))}%` }}
//                     />
//                 </div>
//             </div>
            
//             {/* Змейка уроков */}
//             <div className="p-8">
//                 <div className="relative flex flex-col items-center max-w-md mx-auto">
//                     {lessons.map((lesson, index) => {
//                         const isLast = index === lessons.length - 1;
//                         const Icon = lesson.isCompleted ? CheckCircle : Target;
//                         const isActive = lesson.isUnlocked && !lesson.isCompleted;
                        
//                         return (
//                             <div key={lesson.id} className="relative w-full">
//                                 {/* Соединительная линия */}
//                                 {!isLast && (
//                                     <div className="absolute left-1/2 transform -translate-x-1/2 top-16 bottom-0 w-0.5">
//                                         <div className={`h-12 w-0.5 mx-auto ${index % 2 === 0 ? 'bg-gradient-to-b from-purple-500 to-indigo-500' : 'bg-gradient-to-b from-indigo-500 to-purple-500'}`} />
//                                     </div>
//                                 )}
                                
//                                 {/* Урок */}
//                                 <motion.div
//                                     initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
//                                     animate={{ opacity: 1, x: 0 }}
//                                     transition={{ delay: index * 0.1 }}
//                                     className={`
//                                         relative flex items-center gap-4 mb-12
//                                         ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}
//                                     `}
//                                 >
//                                     {/* Линия-связка */}
//                                     <div className={`flex-1 ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
//                                         <div className="text-sm text-gray-400">
//                                             Урок {lesson.order}
//                                         </div>
//                                         <div className="font-medium text-white">
//                                             {lesson.title}
//                                         </div>
//                                         {lesson.needMore && lesson.needMore > 0 && !lesson.isCompleted && (
//                                             <div className="text-xs text-orange-400 mt-1">
//                                                 ⚔️ Осталось {lesson.needMore} битв
//                                             </div>
//                                         )}
//                                     </div>
                                    
//                                     {/* Кружок урока */}
//                                     <TransitionLink href={`/lesson/${lesson.id}`}>
//                                         <div className={`
//                                             relative w-16 h-16 rounded-full flex items-center justify-center
//                                             bg-gradient-to-br ${getLessonColor(lesson.isUnlocked, lesson.isCompleted, lesson.type)}
//                                             shadow-lg transition-all duration-300 cursor-pointer
//                                             hover:scale-110 hover:shadow-xl
//                                             ${!lesson.isUnlocked && !lesson.isCompleted ? 'opacity-50 grayscale' : ''}
//                                         `}>
//                                             <span className="text-2xl">
//                                                 {lesson.isCompleted ? '✅' : getLessonIcon(lesson.type)}
//                                             </span>
                                            
//                                             {/* Анимация для активного урока */}
//                                             {isActive && (
//                                                 <div className="absolute inset-0 rounded-full animate-ping bg-purple-500 opacity-50" />
//                                             )}
//                                         </div>
//                                     </TransitionLink>
                                    
//                                     {/* Пустая заглушка для баланса */}
//                                     <div className="flex-1" />
//                                 </motion.div>
//                             </div>
//                         );
//                     })}
//                 </div>
//             </div>
//         </motion.div>
//     );
// };