// app/learn/unit-banner.tsx

import { Flame, Lock, Crown, TrendingUp, Star, Rocket, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type Props = {
    title: string;
    description: string;
    imgSrc: string;
    id: number;
    percentageDone: number;
    bgSvgSrc?: string;  // делаем опциональным
    isUnlocked?: boolean;
    isCompleted?: boolean;
    unitProgressPercent?: number;
    needMoreLessons?: number;
    isNextUnitUnlocked?: boolean;
}

// Цвета для разных юнитов (циклически)
const unitColors = [
    { from: '#6366f1', to: '#8b5cf6', accent: '#c4b5fd' }, // Indigo → Purple
    { from: '#ec4899', to: '#f43f5e', accent: '#fda4af' }, // Pink → Rose
    { from: '#14b8a6', to: '#10b981', accent: '#6ee7b7' }, // Teal → Emerald
    { from: '#f59e0b', to: '#f97316', accent: '#fed7aa' }, // Amber → Orange
    { from: '#3b82f6', to: '#06b6d4', accent: '#bae6fd' }, // Blue → Cyan
    { from: '#8b5cf6', to: '#d946ef', accent: '#ddd6fe' }, // Purple → Fuchsia
];

export const UnitBanner = ({ 
    title, 
    description, 
    id,
    isUnlocked = true,
    isCompleted = false,
    unitProgressPercent = 0,
    needMoreLessons = 0,
    isNextUnitUnlocked = false,
}: Props) => {
    const progressPercent = Math.round(unitProgressPercent * 100);
    const colorIndex = (id - 1) % unitColors.length;
    const colors = unitColors[colorIndex];
    
    // Заблокированный юнит
    if (!isUnlocked && !isCompleted) {
        return (
            <div className="relative mb-8">
                <div className="bg-gray-100 rounded-2xl p-6 border-2 border-dashed border-gray-300">
                    <div className="flex items-center gap-5">
                        <div className="bg-gray-200 rounded-2xl p-4">
                            <Lock className="h-8 w-8 text-gray-500" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-xl text-gray-500">{title}</h3>
                                <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                                    Закрыто
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm">{description}</p>
                            {needMoreLessons > 0 && (
                                <div className="mt-3 flex items-center gap-2">
                                    <Flame className="h-4 w-4 text-orange-400" />
                                    <span className="text-sm text-gray-500">
                                        Нужно открыть ещё {needMoreLessons} уроков в предыдущем разделе
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    // Открытый юнит
    return (
        <div className="relative mb-8 overflow-hidden rounded-2xl shadow-lg transition-all hover:shadow-xl">
            {/* Градиентный фон */}
            <div 
                className="absolute inset-0"
                style={{
                    background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                }}
            />
            
            {/* Декоративные элементы */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl" />
            
            {/* Звёздочки для украшения */}
            <div className="absolute top-4 right-12 text-white/20">
                <Star className="h-6 w-6 fill-current" />
            </div>
            <div className="absolute bottom-2 right-24 text-white/10">
                <Rocket className="h-8 w-8 fill-current" />
            </div>
            
            {/* Контент */}
            <div className="relative p-6 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Левая часть */}
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            {isCompleted && (
                                <span className="bg-white/20 backdrop-blur rounded-full px-3 py-1 text-sm font-medium flex items-center gap-1">
                                    <Crown className="h-4 w-4 text-yellow-300" />
                                    Завершён
                                </span>
                            )}
                            {isNextUnitUnlocked && !isCompleted && (
                                <span className="bg-green-500/30 backdrop-blur rounded-full px-3 py-1 text-sm font-medium flex items-center gap-1">
                                    <Zap className="h-4 w-4" />
                                    Следующий раздел открыт
                                </span>
                            )}
                        </div>
                        
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                            {title}
                        </h2>
                        
                        <p className="text-white/80 text-base max-w-2xl">
                            {description}
                        </p>
                        
                        <div className="flex items-center gap-4 pt-2">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-white/70" />
                                <span className="text-sm text-white/80">Прогресс раздела</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Правая часть */}
                    <div className="flex flex-col items-end gap-2 min-w-[160px]">
                        <div className="text-right">
                            <div className="text-3xl font-bold">{progressPercent}%</div>
                            <div className="text-xs text-white/70">завершено</div>
                        </div>
                        <Progress 
                            value={progressPercent} 
                            className="h-2 w-32 bg-white/30" 
                        />
                        {unitProgressPercent < 1 && (
                            <p className="text-xs text-white/60 mt-1">
                                {Math.ceil((1 - unitProgressPercent) * 100)}% до открытия следующего
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};




// // app/learn/unit-banner.tsx

// import { Flame, Lock, Crown, TrendingUp } from 'lucide-react';
// import { Progress } from '@/components/ui/progress';

// type Props = {
//     title: string;
//     description: string;
//     imgSrc: string;
//     id: number;
//     percentageDone: number;
//     bgSvgSrc: string;
//     isUnlocked?: boolean;
//     isCompleted?: boolean;
//     unitProgressPercent?: number;
//     needMoreLessons?: number;
//     isNextUnitUnlocked?: boolean;
// }

// export const UnitBanner = ({ 
//     title, 
//     description, 
//     id, 
//     bgSvgSrc,
//     isUnlocked = true,
//     isCompleted = false,
//     unitProgressPercent = 0,
//     needMoreLessons = 0,
//     isNextUnitUnlocked = false,
// }: Props) => {
//     const progressPercent = Math.round(unitProgressPercent * 100);
    
//     if (!isUnlocked && !isCompleted) {
//         return (
//             <div className="relative mb-10 opacity-60">
//                 <div className="bg-gray-100 rounded-xl p-6 border-2 border-dashed border-gray-300">
//                     <div className="flex items-center gap-4">
//                         <div className="bg-gray-300 rounded-full p-3">
//                             <Lock className="h-8 w-8 text-gray-500" />
//                         </div>
//                         <div className="flex-1">
//                             <h3 className="font-bold text-xl text-gray-500">{title}</h3>
//                             <p className="text-gray-400 text-sm">{description}</p>
//                             {needMoreLessons > 0 && (
//                                 <div className="mt-2 flex items-center gap-2">
//                                     <Flame className="h-4 w-4 text-orange-400" />
//                                     <span className="text-sm text-gray-500">
//                                         Нужно открыть ещё {needMoreLessons} уроков в предыдущем разделе
//                                     </span>
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         );
//     }
    
//     return (
//         <div className="w-full rounded-xl p-5 text-white flex items-center justify-between"
//             style={{
//                 backgroundImage: `url(${bgSvgSrc})`,
//                 backgroundSize: "cover",
//                 backgroundColor: "#84cc16",
//             }}>
//             <div className="space-y-1">
//                 <div className="flex items-center gap-2">
//                     {isCompleted && (
//                         <Crown className="h-5 w-5 text-yellow-300" />
//                     )}
//                     <h1 className="text-2xl font-bold text-white">
//                         {title}
//                     </h1>
//                 </div>
//                 <p className="text-base text-white/90">
//                     {description}
//                 </p>
//                 <div className="flex items-center gap-4 mt-2">
//                     <div className="flex items-center gap-2">
//                         <TrendingUp className="h-4 w-4 text-white" />
//                         <span className="text-sm text-white">Прогресс: {progressPercent}%</span>
//                     </div>
//                     {isNextUnitUnlocked && !isCompleted && (
//                         <div className="flex items-center gap-1 bg-green-500/30 px-2 py-0.5 rounded-full">
//                             <span className="text-xs text-white">✅ Следующий раздел открыт</span>
//                         </div>
//                     )}
//                 </div>
//             </div>
//             <div className="w-32">
//                 <Progress value={progressPercent} className="h-2 bg-white/30" />
//                 <p className="text-xs text-white/80 text-center mt-1">
//                     {Math.round(progressPercent)}% завершено
//                 </p>
//             </div>
//         </div>
//     );
// };


