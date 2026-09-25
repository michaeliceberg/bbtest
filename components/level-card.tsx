// components/level-card.tsx

'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronRight, Sparkles } from 'lucide-react';
import { getLevelInfo, LEVEL_UP_GEM_REWARD } from '@/lib/xp';
import { COZY, type UiTheme } from '@/lib/cozyTheme';

// lottie-react трогает `document` при монтировании — статический импорт
// в компонент, который рендерится с сервера (даже внутри 'use client'
// файла, если сам файл попадает в SSR-проход), уже не раз ронял dev/prod
// в этом проекте (см. CLAUDE.md, баги TrainerMascot/question-bubble) —
// поэтому всегда через dynamic(..., { ssr: false }).
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

type Props = {
    xp: number;
    // Сколько файлов lvlN.json реально лежит в public/Lottie/lvl/ —
    // считается на сервере (lib/lvl-lottie.ts:getLvlLottieCount) и
    // прокидывается пропом, чтобы не хардкодить число здесь: пользователь
    // будет докидывать новых персонажей постепенно (сейчас 5, планирует
    // ещё ~40) без необходимости трогать код карточки.
    lvlLottieCount: number;
    // 'compact' — карточка в основной колонке /learn и /trainer, видна и
    // на мобильном (в отличие от StickyWrapper — тот `hidden lg:block`,
    // на телефоне сайдбар с очками/сердечками вообще не рендерится).
    // 'full' — крупный блок на /progress, в стиле уже существующей там
    // карточки "Общий прогресс курса".
    variant?: 'compact' | 'full';
    // Стиль оформления: игровой (по умолчанию) или тёплый «cozy».
    theme?: UiTheme;
};

// Сухое "Уровень 1, 0/100 XP" не вызывает эмоций и не даёт понять, к
// чему стремиться — карточка показывает ДВЕ панели рядом: текущее
// состояние (с поддерживающей фразой и Lottie-персонажем) и "что
// дальше" — следующий уровень с сундуком и превью реальной награды (см.
// lib/xp.ts:LEVEL_UP_GEM_REWARD, начисляется по факту в actions/
// challenge-progress.ts, actions/user-progress.ts,
// actions/claim-achievement.ts — не просто картинка).
const getMotivation = (progressPercent: number): string => {
    if (progressPercent >= 75) return 'Почти у цели! ⚡';
    if (progressPercent >= 50) return 'На полпути! 🔥';
    if (progressPercent >= 25) return 'Хороший темп! 💪';
    return 'Погнали! 🚀';
};

// 3 уровня на одного персонажа (1-3 → lvl1, 4-6 → lvl2, ...), с зажимом
// по факту доступных файлов — пока их 5, более высокие уровни просто
// повторно используют последнего персонажа, ничего не ломая.
const getMascotSrc = (level: number, lvlLottieCount: number): string => {
    const index = Math.min(Math.ceil(level / 3), Math.max(1, lvlLottieCount));
    return `/Lottie/lvl/lvl${index}.json`;
};

export const LevelCard = ({ xp, lvlLottieCount, variant = 'compact', theme = 'metal' }: Props) => {
    const cozy = theme === 'cozy';
    const { level, xpIntoLevel, xpForNextLevel, progressPercent } = getLevelInfo(xp);
    const xpLeft = xpForNextLevel - xpIntoLevel;
    const motivation = getMotivation(progressPercent);
    const mascotSrc = getMascotSrc(level, lvlLottieCount);

    // lottie-react типизирует только `animationData` (готовый объект), не
    // `path` (хотя lottie-web под капотом его поддерживает) — поэтому
    // сами fetch'им JSON и передаём как animationData; отдельный fetch на
    // смену персонажа раз в 3 уровня — не на каждый рендер.
    const [mascotData, setMascotData] = useState<object | null>(null);
    useEffect(() => {
        let cancelled = false;
        setMascotData(null);
        fetch(mascotSrc)
            .then((res) => res.json())
            .then((data) => { if (!cancelled) setMascotData(data); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [mascotSrc]);

    const isFull = variant === 'full';
    // Персонаж — главный источник эмоции в карточке, увеличен насколько
    // позволяет освободившееся место (фразы-мотиваторы укорочены выше,
    // текстовой колонке теперь нужно меньше горизонтального места).
    const mascotSize = isFull ? 'h-24 w-24 sm:h-32 sm:w-32' : 'h-20 w-20';
    const chestWidth = isFull ? 'w-[128px] sm:w-[144px]' : 'w-[92px]';
    // Без явного минимума текстовая колонка (flex-1 min-w-0) охотно
    // схлопывается до пары пикселей вместо того, чтобы вытолкнуть панель
    // сундука на отдельную строку — flex-wrap только переносит элемент,
    // если он ДЕЙСТВИТЕЛЬНО не помещается, а не когда сосед просто может
    // сжаться. Минимум подобран так, чтобы "Уровень N" не переносился по
    // слову на телефоне (короче, чем раньше, — фразы-мотиваторы тоже
    // укорочены, экономят место).
    const textGroupMinWidth = isFull ? 'min-w-[190px]' : 'min-w-[120px]';

    return (
        <div
            className={cozy
                ? `relative min-w-0 overflow-hidden rounded-xl ${isFull ? 'p-6 mb-8' : 'p-4'}`
                : `relative min-w-0 overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-[#1c1533] via-[#181228] to-[#151F23] shadow-[0_0_28px_-10px_rgba(167,139,250,0.45)] ${isFull ? 'p-6 mb-8' : 'p-4'}`}
            style={cozy ? { background: COZY.card, border: `3px solid ${COZY.cardBorder}`, boxShadow: `0 6px 0 ${COZY.cardEdge}` } : undefined}
        >
            {/* Декоративное свечение — чисто визуальный акцент, не мешает контенту */}
            {!cozy && <div className="pointer-events-none absolute -top-10 -left-10 h-32 w-32 rounded-full bg-violet-500/20 blur-3xl" />}
            {!cozy && <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-amber-400/10 blur-3xl" />}

            {/* flex-wrap — на узких экранах панель сундука не помещается
                рядом с текстовой колонкой одной строкой и переносится на
                отдельную строку под уровнем, а не сжимает текст до
                нечитаемого состояния (см. textGroupMinWidth выше). */}
            <div className="relative flex flex-wrap items-center gap-3 min-w-0">
                <div className={`flex items-center gap-3 flex-1 ${textGroupMinWidth}`}>
                    <div className={`shrink-0 overflow-hidden ${cozy ? 'rounded-xl' : 'rounded-full bg-white/5 ring-2 ring-violet-400/40'} ${mascotSize}`} style={cozy ? { background: '#3A342D', border: '3px solid #C9AEF5' } : undefined}>
                        {mascotData && <Lottie animationData={mascotData} loop autoplay />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className={isFull ? 'h-5 w-5 shrink-0' : 'h-4 w-4 shrink-0'} style={{ color: cozy ? COZY.honey : '#A78BFA' }} />
                            <span className={`font-extrabold whitespace-nowrap ${isFull ? 'text-lg' : ''}`} style={{ color: cozy ? COZY.title : '#F2F7FB' }}>Уровень {level}</span>
                        </div>
                        <p className={`mb-2 ${isFull ? 'text-sm' : 'text-xs truncate'}`} style={{ color: cozy ? '#D9C4A3' : '#C9B8F5' }}>{motivation}</p>
                        <div className={`w-full overflow-hidden ${cozy ? 'rounded-md' : 'rounded-full'} ${isFull ? 'h-3' : cozy ? 'h-2.5' : 'h-1.5'}`} style={{ backgroundColor: cozy ? COZY.track : 'rgba(167,139,250,0.2)' }}>
                            <div
                                className={cozy ? 'h-full transition-all duration-500' : 'h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all duration-500'}
                                style={{ width: `${progressPercent}%`, ...(cozy ? { background: '#C9AEF5' } : {}) }}
                            />
                        </div>
                        <p className={`mt-1 ${isFull ? 'text-sm' : 'text-[10px]'}`} style={{ color: cozy ? '#B8A68E' : '#9AA7B0' }}>{xpIntoLevel}/{xpForNextLevel} XP</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
                    <ChevronRight className={`text-[#3A464E] shrink-0 hidden sm:block ${isFull ? 'h-6 w-6' : 'h-4 w-4'}`} />

                    <div
                        className={`shrink-0 ${chestWidth} rounded-xl ${cozy ? '' : 'border border-dashed border-amber-400/40 bg-amber-400/5'} flex flex-col items-center text-center gap-0.5 ${isFull ? 'p-3 sm:p-4' : 'p-2'}`}
                        style={cozy ? { background: COZY.wood, border: `2px solid ${COZY.woodBorder}`, boxShadow: `0 4px 0 ${COZY.woodEdge}` } : undefined}
                    >
                        <span className={isFull ? 'text-3xl leading-none' : 'text-xl leading-none'}>🎁</span>
                        <span className={`font-bold text-amber-400 leading-tight ${isFull ? 'text-sm' : 'text-[11px]'}`}>Ур. {level + 1}</span>
                        <span className={`text-[#9AA7B0] leading-tight ${isFull ? 'text-xs' : 'text-[10px]'}`}>Ещё {xpLeft} XP</span>
                        <span className={`font-bold text-amber-400 leading-tight ${isFull ? 'text-xs' : 'text-[10px]'}`}>+{LEVEL_UP_GEM_REWARD}💎</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
