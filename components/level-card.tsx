// components/level-card.tsx

import { ChevronRight, Sparkles } from 'lucide-react';
import { getLevelInfo, LEVEL_UP_GEM_REWARD } from '@/lib/xp';

type Props = {
    xp: number;
    // 'compact' — карточка в основной колонке /learn и /trainer, видна и
    // на мобильном (в отличие от StickyWrapper — тот `hidden lg:block`,
    // на телефоне сайдбар с очками/сердечками вообще не рендерится).
    // 'full' — крупный блок на /progress, в стиле уже существующей там
    // карточки "Общий прогресс курса".
    variant?: 'compact' | 'full';
};

// Сухое "Уровень 1, 0/100 XP" не вызывает эмоций и не даёт понять, к
// чему стремиться — по просьбе пользователя карточка теперь показывает
// ДВЕ панели рядом: текущее состояние (с поддерживающей фразой) и
// "что дальше" — следующий уровень с сундуком и превью реальной
// награды (см. lib/xp.ts:LEVEL_UP_GEM_REWARD, начисляется по факту в
// actions/challenge-progress.ts, actions/user-progress.ts,
// actions/claim-achievement.ts — не просто картинка).
const getMotivation = (progressPercent: number): string => {
    if (progressPercent >= 75) return 'Почти у цели — рывок! ⚡';
    if (progressPercent >= 50) return 'Уже на полпути! 🔥';
    if (progressPercent >= 25) return 'Хороший темп, продолжай! 💪';
    return 'Погнали за новым уровнем! 🚀';
};

export const LevelCard = ({ xp, variant = 'compact' }: Props) => {
    const { level, xpIntoLevel, xpForNextLevel, progressPercent } = getLevelInfo(xp);
    const xpLeft = xpForNextLevel - xpIntoLevel;
    const motivation = getMotivation(progressPercent);

    if (variant === 'full') {
        return (
            <div className="bg-[#151F23] rounded-xl border p-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="h-5 w-5 text-violet-400 shrink-0" />
                            <h3 className="font-bold text-lg">Уровень {level}</h3>
                        </div>
                        <p className="text-sm text-[#9AA7B0] mb-3">{motivation}</p>
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

                    <ChevronRight className="h-6 w-6 text-[#3A464E] shrink-0 hidden sm:block" />

                    <div className="shrink-0 w-[128px] sm:w-[144px] rounded-xl border border-dashed border-amber-400/40 bg-amber-400/5 p-3 sm:p-4 flex flex-col items-center text-center gap-1">
                        <span className="text-3xl leading-none">🎁</span>
                        <span className="text-sm font-bold text-amber-400">Ур. {level + 1}</span>
                        <span className="text-xs text-[#9AA7B0]">Ещё {xpLeft} XP</span>
                        <span className="text-xs font-bold text-amber-400">+{LEVEL_UP_GEM_REWARD}💎</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-[#3A464E] bg-[#151F23] shadow-sm p-4">
            <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="rounded-full p-1.5 bg-violet-400/20 shrink-0">
                            <Sparkles className="h-4 w-4 text-violet-400" />
                        </div>
                        <span className="font-extrabold text-[#F2F7FB]">Уровень {level}</span>
                    </div>
                    <p className="text-xs text-[#9AA7B0] mb-2 truncate">{motivation}</p>
                    <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: 'rgba(167,139,250,0.2)' }}>
                        <div
                            className="h-full rounded-full bg-violet-400 transition-all"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-[#9AA7B0] mt-1">{xpIntoLevel}/{xpForNextLevel} XP</p>
                </div>

                <ChevronRight className="h-4 w-4 text-[#3A464E] shrink-0" />

                <div className="shrink-0 w-[92px] rounded-lg border border-dashed border-amber-400/40 bg-amber-400/5 p-2 flex flex-col items-center text-center gap-0.5">
                    <span className="text-xl leading-none">🎁</span>
                    <span className="text-[11px] font-bold text-amber-400 leading-tight">Ур. {level + 1}</span>
                    <span className="text-[10px] text-[#9AA7B0] leading-tight">−{xpLeft} XP</span>
                    <span className="text-[10px] font-bold text-amber-400 leading-tight">+{LEVEL_UP_GEM_REWARD}💎</span>
                </div>
            </div>
        </div>
    );
};
