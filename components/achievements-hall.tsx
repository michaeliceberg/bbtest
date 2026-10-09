// components/achievements-hall.tsx
//
// «Зал ачивок»: карточки всех ачивок по группам. Полученную ачивку можно кликнуть ОДИН раз — откроется
// модалка с наградой (монеты, гемы или кусочки пиццы). Полученные, но ещё не забранные — светятся
// и подписаны «Забрать награду», чтобы хотелось зайти и нажать.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { ChevronDown, Gift } from 'lucide-react';
import { CenteredLottie } from '@/components/centered-lottie';
import { playSound, preloadSound, COIN_DROP_SOUND, GEM_DROP_SOUND, CASE_PRIZE_SOUND, PIZZA_DROP_SOUND } from '@/lib/sound';
import LottieCoins from '@/public/Lottie/LottieCoins.json';
import LottieGems from '@/public/Lottie/LottieGems.json';
import LottiePizza from '@/public/Lottie/test/pizza.json';
import { ACHIEVEMENTS, ACHIEVEMENT_GROUPS, REWARDS, rewardText, type AchievementReward } from '@/lib/achievementsCatalog';
import { AchievementIcon } from '@/components/achievement-icon';
import { claimAchievementReward } from '@/actions/achievements';
import { useAchievementClaimStore } from '@/store/use-achievement-claim-store';

type Unlock = { key: string; unlockedAt: string; claimed: boolean };

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' });

// Награда справа на карточке: Lottie как обычная картинка (кадр без проигрывания) + крупное число.
const REWARD_LOTTIE = { coins: LottieCoins, gems: LottieGems, pizza: LottiePizza } as const;
const THANKS = [
    'Благодарочка!', 'Мерси!', 'Грасиас!', 'Пасиба, чётко!', 'Респект!', 'Имба!', 'Лучший подгон!', 'Спасибо, бро!',
    'GG!', 'GG, бро!', 'GG WP!', 'ГГ, спасибо!', 'Джи-Джи!', 'Джи-Джи, спасибо!', 'Топчик!', 'Красота!', 'Кайф!', 'Это база', 'Забираю!', 'GG!', 'Ну наконец-то!', 'Вау, мне? 😳', 'Сойдёт, беру 😎', 'Лайк, подписка!',
];
const pickThanks = () => THANKS[Math.floor(Math.random() * THANKS.length)];
const rewardSound = (k: AchievementReward['kind']) => (k === 'gems' ? GEM_DROP_SOUND : k === 'coins' ? COIN_DROP_SOUND : k === 'pizza' ? PIZZA_DROP_SOUND : CASE_PRIZE_SOUND);

const StaticReward = ({ reward, dim }: { reward: AchievementReward; dim?: boolean }) => (
    <div className="flex flex-shrink-0 flex-col items-center gap-0.5" style={{ opacity: dim ? 0.45 : 1, filter: dim ? 'grayscale(0.8)' : 'none' }}>
        <CenteredLottie animationData={REWARD_LOTTIE[reward.kind]} size={48} />
        <span className="text-xl font-black leading-none text-[#FFC53D]">+{reward.amount}</span>
    </div>
);

export const AchievementsHall = ({ unlocks }: { unlocks: Unlock[] }) => {
    const router = useRouter();
    const setClaimCount = useAchievementClaimStore((s) => s.setCount);
    const [state, setState] = useState(() => new Map(unlocks.map((u) => [u.key, u])));
    const [busy, setBusy] = useState<string | null>(null);
    const [modal, setModal] = useState<{ key: string; reward: AchievementReward; thanks: string } | null>(null);
    const { width, height } = useWindowSize();
    useEffect(() => { [COIN_DROP_SOUND, GEM_DROP_SOUND, CASE_PRIZE_SOUND, PIZZA_DROP_SOUND].forEach(preloadSound); }, []);
    const unclaimed = Array.from(state.values()).filter((u) => !u.claimed).length;

    // «Магнит ачивок»: плавно ведёт к следующей награде ниже по странице (если ниже нет — к первой).
    const scrollToNext = () => {
        const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-claimable]'));
        if (!nodes.length) return;
        const next = nodes.find((n) => n.getBoundingClientRect().top > 160) ?? nodes[0];
        next.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const claim = async (key: string) => {
        if (busy) return;
        setBusy(key);
        const res = await claimAchievementReward(key).catch(() => null);
        setBusy(null);
        if (!res || !res.success) return;
        setState((m) => new Map(m).set(key, { ...(m.get(key) as Unlock), claimed: true }));
        setClaimCount(res.unclaimed);
        playSound(rewardSound(res.reward.kind));
        setModal({ key, reward: res.reward, thanks: pickThanks() });
        router.refresh(); // обновить монеты/гемы/пиццу в шапке
    };

    return (
        <>
            {unclaimed > 0 && (
                <div className="pointer-events-none sticky top-[60px] z-30 mb-5 flex justify-center lg:top-3">
                    <motion.button
                        type="button"
                        onClick={scrollToNext}
                        animate={{ y: [0, -9, 0, -4, 0] }}
                        transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 3 }}
                        className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-[#FFC53D] px-4 py-2 text-sm font-black text-[#4A3206] shadow-[0_6px_0_#C99412,0_8px_24px_rgba(255,197,61,0.45)] active:translate-y-[2px]"
                    >
                        <Gift className="h-4 w-4" />
                        Ждут награды: {unclaimed}
                        <ChevronDown className="h-4 w-4" />
                    </motion.button>
                </div>
            )}
            <div className="space-y-8">
                {ACHIEVEMENT_GROUPS.map((g) => {
                    const list = ACHIEVEMENTS.filter((a) => a.group === g.id);
                    const done = list.filter((a) => state.has(a.key)).length;
                    return (
                        <section key={g.id}>
                            <div className="flex items-baseline gap-3 mb-3">
                                <h2 className="text-lg font-extrabold" style={{ color: g.color }}>{g.title}</h2>
                                <span className="text-xs font-bold text-[#6B7A83]">{done}/{list.length}</span>
                            </div>
                            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))' }}>
                                {list.map((a) => {
                                    const u = state.get(a.key);
                                    const has = !!u;
                                    const canClaim = has && !u!.claimed;
                                    const reward = REWARDS[a.key];
                                    const Wrapper = canClaim ? motion.button : motion.div;
                                    return (
                                        <Wrapper
                                            key={a.key}
                                            {...(canClaim
                                                ? {
                                                    type: 'button' as const,
                                                    onClick: () => claim(a.key),
                                                    animate: { boxShadow: ['0 0 0 0 rgba(255,197,61,0.0)', '0 0 22px 2px rgba(255,197,61,0.55)', '0 0 0 0 rgba(255,197,61,0.0)'] },
                                                    transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const },
                                                    whileTap: { scale: 0.98 },
                                                }
                                                : {})}
                                            data-claimable={canClaim ? '' : undefined}
                                            className={`flex items-center gap-3 rounded-xl p-3 text-left ${canClaim ? 'cursor-pointer' : ''}`}
                                            style={{
                                                background: has ? `linear-gradient(135deg, ${g.color}22, #161F23)` : '#161F23',
                                                border: `1.5px solid ${canClaim ? '#FFC53D' : has ? `${g.color}77` : '#2B373D'}`,
                                            }}
                                        >
                                            <AchievementIcon emoji={a.emoji} iconSrc={a.iconSrc} color={g.color} size={60} unlocked={has} />
                                            <div className="min-w-0 flex-1">
                                                <p className="font-extrabold leading-tight" style={{ color: has ? '#F2F7FB' : '#72838D' }}>{a.title}</p>
                                                <p className="text-xs leading-snug mt-0.5" style={{ color: has ? '#9AA7B0' : '#56646C' }}>{a.desc}</p>
                                                {canClaim && (
                                                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#FFC53D] px-2 py-0.5 text-[11px] font-black text-[#4A3206]">
                                                        <Gift className="h-3 w-3" /> Забрать награду
                                                    </span>
                                                )}
                                                {has && <p className="text-[11px] font-bold mt-1" style={{ color: g.color }}>Получено {fmtDate(u!.unlockedAt)}</p>}
                                            </div>
                                            {reward && <StaticReward reward={reward} dim={!has || u!.claimed} />}
                                        </Wrapper>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}
            </div>

            {modal && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-4" onClick={() => setModal(null)}>
                    <Confetti width={width} height={height} recycle={false} numberOfPieces={modal.reward.kind === 'pizza' ? 320 : 180} />
                    <motion.div
                        initial={{ scale: 0.7, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 360, damping: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-sm rounded-3xl p-6 text-center"
                        style={{ background: 'linear-gradient(160deg, #26333B, #151F23)', border: '2px solid #FFC53D', boxShadow: '0 0 60px -10px rgba(255,197,61,0.6)' }}
                    >
                        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#FFC53D]">GG! Награда за ачивку</p>
                        <p className="mt-1 text-lg font-extrabold text-white">{ACHIEVEMENTS.find((a) => a.key === modal.key)?.title}</p>
                        <div className="my-4 flex items-center justify-center gap-4">
                            <CenteredLottie animationData={REWARD_LOTTIE[modal.reward.kind]} size={104} play loop />
                            <span className="text-5xl font-black text-[#FFC53D]">+{modal.reward.amount}</span>
                        </div>
                        <p className="text-sm leading-snug text-[#C9D4DB]">{ACHIEVEMENTS.find((a) => a.key === modal.key)?.desc}</p>
                        <button
                            type="button"
                            onClick={() => setModal(null)}
                            className="mt-5 w-full rounded-2xl bg-[#FFC53D] py-3 text-sm font-black uppercase tracking-wide text-[#4A3206] border-b-4 border-[#C99412] active:border-b-0"
                        >
                            {modal.thanks}
                        </button>
                    </motion.div>
                </div>
            )}
        </>
    );
};
