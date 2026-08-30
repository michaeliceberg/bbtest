// components/level-card.tsx

import { Sparkles } from 'lucide-react';
import { getLevelInfo } from '@/lib/xp';

type Props = {
    xp: number;
    // 'compact' — карточка в основной колонке /learn и /trainer, видна и
    // на мобильном (в отличие от StickyWrapper — тот `hidden lg:block`,
    // на телефоне сайдбар с очками/сердечками вообще не рендерится).
    // 'full' — крупный блок на /progress, в стиле уже существующей там
    // карточки "Общий прогресс курса".
    variant?: 'compact' | 'full';
};

export const LevelCard = ({ xp, variant = 'compact' }: Props) => {
    const { level, xpIntoLevel, xpForNextLevel, progressPercent } = getLevelInfo(xp);

    if (variant === 'full') {
        return (
            <div className="bg-[#151F23] rounded-xl border p-6 mb-8">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-violet-400" />
                        Уровень
                    </h3>
                    <span className="text-2xl font-bold text-violet-400">{level}</span>
                </div>
                <div className="w-full rounded-full h-3" style={{ backgroundColor: 'rgba(167,139,250,0.2)' }}>
                    <div
                        className="h-full rounded-full bg-violet-400 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <p className="text-sm text-[#9AA7B0] mt-3">
                    {xpIntoLevel} из {xpForNextLevel} XP до следующего уровня
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-[#3A464E] bg-[#151F23] shadow-sm p-4 flex items-center gap-3">
            <div className="rounded-full p-2 bg-violet-400/20 shrink-0">
                <Sparkles className="h-5 w-5 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="font-bold text-[#F2F7FB]">Уровень {level}</span>
                    <span className="text-xs text-[#9AA7B0] shrink-0">{xpIntoLevel}/{xpForNextLevel} XP</span>
                </div>
                <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: 'rgba(167,139,250,0.2)' }}>
                    <div
                        className="h-full rounded-full bg-violet-400 transition-all"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
