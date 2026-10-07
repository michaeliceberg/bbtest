// components/achievements-hall.tsx
//
// «Зал ачивок»: карточки всех ачивок по группам. Полученную ачивку можно кликнуть ОДИН раз — откроется
// модалка с наградой (монеты, гемы или кусочки пиццы). Полученные, но ещё не забранные — светятся
// и подписаны «Забрать награду», чтобы хотелось зайти и нажать.

'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Gift } from 'lucide-react';
import Lottie from '@/components/lottie-player';
import LottieCoins from '@/public/Lottie/LottieCoins.json';
import LottieGems from '@/public/Lottie/LottieGems.json';
import LottiePizza from '@/public/Lottie/test/pizza.json';
import type { LottieRefCurrentProps } from 'lottie-react';
import { ACHIEVEMENTS, ACHIEVEMENT_GROUPS, REWARDS, rewardText, type AchievementReward } from '@/lib/achievementsCatalog';
import { AchievementIcon } from '@/components/achievement-icon';
import { claimAchievementReward } from '@/actions/achievements';
import { useAchievementClaimStore } from '@/store/use-achievement-claim-store';

type Unlock = { key: string; unlockedAt: string; claimed: boolean };

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' });

// Награда справа на карточке: Lottie как обычная картинка (кадр без проигрывания) + крупное число.
const REWARD_LOTTIE = { coins: LottieCoins, gems: LottieGems, pizza: LottiePizza } as const;
const REWARD_FRAME = { coins: 0.5, gems: 0.5, pizza: 0.5 } as const; // доля длительности — кадр «в разгаре»

const StaticReward = ({ reward, dim }: { reward: AchievementReward; dim?: boolean }) => {
    const ref = useRef<LottieRefCurrentProps>(null);
    return (
        <div className="flex flex-shrink-0 flex-col items-center" style={{ opacity: dim ? 0.45 : 1, filter: dim ? 'grayscale(0.8)' : 'none' }}>
            <Lottie
                animationData={REWARD_LOTTIE[reward.kind]}
                lottieRef={ref}
                loop={false}
                autoplay={false}
                onDOMLoaded={() => ref.current?.goToAndStop(Math.floor((ref.current.getDuration(true) ?? 1) * REWARD_FRAME[reward.kind]), true)}
                className="h-14 w-14"
            />
            <span className="-mt-1 text-xl font-black leading-none text-[#FFC53D]">+{reward.amount}</span>
        </div>
    );
};

export const AchievementsHall = ({ unlocks }: { unlocks: Unlock[] }) => {
    const router = useRouter();
    const setClaimCount = useAchievementClaimStore((s) => s.setCount);
    const [state, setState] = useState(() => new Map(unlocks.map((u) => [u.key, u])));
    const [busy, setBusy] = useState<string | null>(null);
    const [modal, setModal] = useState<{ key: string; reward: AchievementReward } | null>(null);
    const { width, height } = useWindowSize();

    const claim = async (key: string) => {
        if (busy) return;
        setBusy(key);
        const res = await claimAchievementReward(key).catch(() => null);
        setBusy(null);
        if (!res || !res.success) return;
        setState((m) => new Map(m).set(key, { ...(m.get(key) as Unlock), claimed: true }));
        setClaimCount(res.unclaimed);
        setModal({ key, reward: res.reward });
        router.refresh(); // обновить монеты/гемы/пиццу в шапке
    };

    return (
        <>
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
                        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#FFC53D]">Награда за ачивку</p>
                        <p className="mt-1 text-lg font-extrabold text-white">{ACHIEVEMENTS.find((a) => a.key === modal.key)?.title}</p>
                        <div className="my-5 flex items-center justify-center gap-3">
                            {modal.reward.kind === 'coins' && <Lottie animationData={LottieCoins} loop autoplay className="h-24 w-24" />}
                            {modal.reward.kind === 'gems' && <Lottie animationData={LottieGems} loop autoplay className="h-24 w-24" />}
                            {modal.reward.kind === 'pizza' && <Lottie animationData={LottiePizza} loop autoplay className="h-24 w-24" />}
                            <span className="text-5xl font-black text-[#FFC53D]">+{modal.reward.amount}</span>
                        </div>
                        <p className="text-sm text-[#9AA7B0]">{modal.reward.kind === 'coins' ? 'монет' : modal.reward.kind === 'gems' ? (modal.reward.amount === 1 ? 'гем' : modal.reward.amount < 5 ? 'гема' : 'гемов') : (modal.reward.amount === 1 ? 'кусочек пиццы' : 'кусочка пиццы')} уже у тебя</p>
                        <button
                            type="button"
                            onClick={() => setModal(null)}
                            className="mt-5 w-full rounded-2xl bg-[#FFC53D] py-3 text-sm font-black uppercase tracking-wide text-[#4A3206] border-b-4 border-[#C99412] active:border-b-0"
                        >
                            Круто!
                        </button>
                    </motion.div>
                </div>
            )}
        </>
    );
};
