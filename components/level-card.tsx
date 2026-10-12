// components/level-card.tsx
//
// Карточка уровня на /learn, /trainer и /progress — в стиле шкалы «Прогресс по разделам»
// (components/course-progress-strip.tsx): тёмная карточка, полоска опыта в утопленном жёлобе,
// светлая полоса сверху / тёмная снизу. Справа — следующая награда: гемы за уровень и, если
// следующий уровень кратен 5, редкий кейс (иконка сундука). Ещё не открытый кейс за уровень
// (ключ lib/levelCase.ts) — отдельной строкой «Открыть», кейс крутится прямо поверх страницы.

'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Gem } from 'lucide-react';
import { getLevelInfo, LEVEL_UP_GEM_REWARD, isLevelCaseLevel, nextLevelCaseLevel } from '@/lib/xp';
import { getLessonCasePool } from '@/lib/caseRewards';
import { openKeyCase } from '@/actions/open-key-case';
import { CaseReel } from '@/components/CaseReel';
import { type UiTheme } from '@/lib/cozyTheme';
import Lottie from '@/components/lottie-player';

type Props = {
    xp: number;
    // Сколько файлов lvlN.json лежит в public/Lottie/lvl/ (lib/lvl-lottie.ts).
    lvlLottieCount: number;
    variant?: 'compact' | 'full';
    theme?: UiTheme;
    // Неоткрытый кейс за уровень (lib/levelCase.ts:getPendingLevelCase).
    levelCase?: { keyId: number; level: number } | null;
};

const RARE = '#00C5FF';
const VIOLET = '#A78BFA';

// 3 уровня на одного персонажа (1-3 → lvl1, 4-6 → lvl2, ...), с зажимом по числу файлов.
const getMascotSrc = (level: number, lvlLottieCount: number): string =>
    `/Lottie/lvl/lvl${Math.min(Math.ceil(level / 3), Math.max(1, lvlLottieCount))}.json`;

export const LevelCard = ({ xp, lvlLottieCount, variant = 'compact', levelCase = null }: Props) => {
    const router = useRouter();
    const { level, xpIntoLevel, xpForNextLevel, progressPercent } = getLevelInfo(xp);
    const xpLeft = xpForNextLevel - xpIntoLevel;
    const nextLevel = level + 1;
    const nextHasCase = isLevelCaseLevel(nextLevel);
    const caseLevel = nextLevelCaseLevel(level);
    const mascotSrc = getMascotSrc(level, lvlLottieCount);
    const isFull = variant === 'full';

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

    const [openingCase, setOpeningCase] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <div className={`rounded-2xl border-2 border-[#2A363C] bg-[#161F23] ${isFull ? 'p-5 mb-8' : 'p-3'}`}>
            <div className="flex items-center gap-3">
                {/* Персонаж уровня */}
                <div
                    className={`shrink-0 overflow-hidden rounded-xl bg-[#0F171B] ${isFull ? 'h-20 w-20 sm:h-24 sm:w-24' : 'h-16 w-16'}`}
                    style={{ boxShadow: `inset 0 2px 0 rgba(0,0,0,0.35), 0 0 0 2px ${VIOLET}55` }}
                >
                    {mascotData && <Lottie animationData={mascotData} loop autoplay />}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                        <span className={`font-black uppercase tracking-wide text-[#F2F7FB] ${isFull ? 'text-lg' : 'text-[15px]'}`}>
                            Уровень {level}
                        </span>
                        <span className="shrink-0 text-[11px] font-black text-[#72838D]">{xpIntoLevel}/{xpForNextLevel} XP</span>
                    </div>

                    {/* Полоска опыта: жёлоб + заливка, светлая полоса сверху, тёмная снизу */}
                    <div className="mt-1.5 rounded-lg bg-[#0F171B] p-[3px]" style={{ boxShadow: 'inset 0 2px 0 rgba(0,0,0,0.35)' }}>
                        <div className={`relative overflow-hidden rounded-[5px] bg-[#26333B] ${isFull ? 'h-5' : 'h-4'}`}>
                            {progressPercent > 0 && (
                                <div
                                    className="absolute inset-y-0 left-0 rounded-[5px] transition-[width] duration-700"
                                    style={{ width: `${Math.max(progressPercent, 6)}%`, background: 'linear-gradient(180deg, #C385F7, #9C6AC6)' }}
                                />
                            )}
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-white/10" />
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-black/15" />
                        </div>
                    </div>

                    <p className="mt-1 truncate text-[11px] font-bold text-[#72838D]">
                        Ещё <span className="text-[#C4B5FD]">{xpLeft} XP</span> до ур. {nextLevel}
                        {!nextHasCase && <> · кейс на ур. {caseLevel}</>}
                    </p>
                </div>

                {/* Следующая награда */}
                <div
                    className={`shrink-0 flex flex-col items-center justify-center rounded-xl border-2 ${isFull ? 'w-24 py-2' : 'w-[72px] py-1.5'}`}
                    style={nextHasCase
                        ? { borderColor: `${RARE}88`, background: 'linear-gradient(180deg, rgba(0,197,255,0.16), rgba(0,197,255,0.04))', boxShadow: `0 0 14px -4px ${RARE}` }
                        : { borderColor: '#2A363C', background: '#1B252A' }}
                >
                    <span className="text-[10px] font-black uppercase tracking-wide text-[#72838D]">Ур. {nextLevel}</span>
                    {nextHasCase ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src="/chests/rare0001.svg" alt="Редкий кейс" className={`object-contain ${isFull ? 'h-11 w-11' : 'h-9 w-9'}`} />
                    ) : (
                        <Gem className={`text-[#8FA6FF] ${isFull ? 'my-1.5 h-8 w-8' : 'my-1 h-6 w-6'}`} />
                    )}
                    <span className="text-[11px] font-black leading-none" style={{ color: nextHasCase ? RARE : '#8FA6FF' }}>
                        {nextHasCase ? `+${LEVEL_UP_GEM_REWARD} · кейс` : `+${LEVEL_UP_GEM_REWARD}`}
                    </span>
                </div>
            </div>

            {/* Кейс за уровень ждёт открытия */}
            {levelCase && (
                <button
                    type="button"
                    onClick={() => setOpeningCase(true)}
                    className="mt-3 flex w-full items-center gap-3 rounded-xl border-2 border-b-4 px-3 py-2 text-left active:translate-y-[2px] active:border-b-2"
                    style={{ borderColor: `${RARE}99`, borderBottomColor: '#0090BB', background: 'linear-gradient(90deg, rgba(0,197,255,0.18), rgba(0,197,255,0.05))' }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/chests/rare0001.svg" alt="" className="h-9 w-9 shrink-0 object-contain animate-chest-idle-bounce" />
                    <span className="min-w-0 flex-1">
                        <span className="block text-sm font-black text-[#F2F7FB]">Редкий кейс за уровень {levelCase.level}</span>
                        <span className="block text-[11px] font-bold text-[#7FE0FF]">Ждёт тебя</span>
                    </span>
                    <span className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-black uppercase text-[#06222C]" style={{ background: RARE }}>
                        Открыть
                    </span>
                </button>
            )}

            {mounted && openingCase && levelCase && createPortal(
                <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#131D22]">
                    <CaseReel
                        isMega
                        tier="rare"
                        pool={getLessonCasePool('rare')}
                        spinAction={() => openKeyCase(levelCase.keyId)}
                        onDone={() => {
                            setOpeningCase(false);
                            router.refresh();
                        }}
                    />
                </div>,
                document.body,
            )}
        </div>
    );
};
