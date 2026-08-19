// app/learn/unit-banner.tsx

import { Flame, Lock } from 'lucide-react';
import { getUnitButtonColor } from '@/src/constants/lessonButtonColors';
import { UnitCardLottie } from '@/components/unit-card-lottie';

type Props = {
    title: string;
    description: string;
    imgSrc: string;
    id: number;
    unitIndex: number;
    percentageDone: number;
    bgSvgSrc?: string;  // делаем опциональным
    isUnlocked?: boolean;
    isCompleted?: boolean;
    unitProgressPercent?: number;
    needMoreLessons?: number;
    isNextUnitUnlocked?: boolean;
}

export const UnitBanner = ({
    title,
    description,
    id,
    unitIndex,
    isUnlocked = true,
    isCompleted = false,
    unitProgressPercent = 0,
    needMoreLessons = 0,
    isNextUnitUnlocked = false,
}: Props) => {
    const progressPercent = Math.round(unitProgressPercent * 100);
    // Та же палитра, что и у lesson button этого юнита — карточка должна совпадать по цвету.
    const colors = getUnitButtonColor(unitIndex);
    
    // Заблокированный юнит
    if (!isUnlocked && !isCompleted) {
        return (
            <div className="relative mb-6 md:mb-8">
                <div className="bg-[#232F34] rounded-2xl p-4 md:p-6 border-2 border-dashed border-[#3A464E]">
                    <div className="flex items-center gap-3 md:gap-5">
                        <div className="bg-[#2E3A40] rounded-2xl p-3 md:p-4 flex-shrink-0">
                            <Lock className="h-6 w-6 md:h-8 md:w-8 text-[#9AA7B0]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-bold text-lg md:text-xl text-[#9AA7B0] break-words">{title}</h3>
                                <span className="text-xs bg-[#2E3A40] text-[#9AA7B0] px-2 py-0.5 rounded-full flex-shrink-0">
                                    Закрыто
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm break-words">{description}</p>
                            {needMoreLessons > 0 && (
                                <div className="mt-3 flex items-start gap-2">
                                    <Flame className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm text-[#9AA7B0] break-words">
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
        <div className="relative mb-6 md:mb-8 flex items-center gap-3">
            <div
                className="flex-1 min-w-0 overflow-hidden rounded-2xl p-4 md:p-6 text-white"
                style={{
                    background: `linear-gradient(135deg, ${colors.button}, ${colors.bottom})`,
                }}
            >
                <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight break-words min-w-0">
                        {title}
                    </h2>
                    <span className="text-2xl md:text-3xl font-bold flex-shrink-0">
                        {progressPercent}%
                    </span>
                </div>

                <p className="text-white/80 text-sm md:text-base mt-1 break-words">
                    {description}
                </p>
            </div>

            <UnitCardLottie progress={unitProgressPercent} />
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
//                 <div className="bg-[#232F34] rounded-xl p-6 border-2 border-dashed border-[#3A464E]">
//                     <div className="flex items-center gap-4">
//                         <div className="bg-gray-300 rounded-full p-3">
//                             <Lock className="h-8 w-8 text-[#9AA7B0]" />
//                         </div>
//                         <div className="flex-1">
//                             <h3 className="font-bold text-xl text-[#9AA7B0]">{title}</h3>
//                             <p className="text-gray-400 text-sm">{description}</p>
//                             {needMoreLessons > 0 && (
//                                 <div className="mt-2 flex items-center gap-2">
//                                     <Flame className="h-4 w-4 text-orange-400" />
//                                     <span className="text-sm text-[#9AA7B0]">
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


