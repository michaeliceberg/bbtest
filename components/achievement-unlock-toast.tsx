// components/achievement-unlock-toast.tsx
//
// Тост «Достижение разблокировано» в стиле Steam: тёмная карточка справа внизу, слева иконка,
// справа мелкая подпись, название жирным и описание. Очередь — store/use-achievement-unlock-store.ts.

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ACHIEVEMENT_GROUPS } from '@/lib/achievementsCatalog';
import { useAchievementUnlockStore } from '@/store/use-achievement-unlock-store';
import { AchievementIcon } from '@/components/achievement-icon';

const DURATION_MS = 5500;

export const AchievementUnlockToast = () => {
    const { queue, dismissCurrent, check } = useAchievementUnlockStore();
    const pathname = usePathname();
    const current = queue[0] ?? null;

    // Забираем «тихо» выданные ачивки при заходе и при смене страницы.
    useEffect(() => {
        void check();
    }, [pathname, check]);

    useEffect(() => {
        if (!current) return;
        const t = setTimeout(dismissCurrent, DURATION_MS);
        return () => clearTimeout(t);
    }, [current, dismissCurrent]);

    if (!current) return null;
    const color = ACHIEVEMENT_GROUPS.find((g) => g.id === current.group)?.color ?? '#53ADEF';

    return (
        <motion.button
            key={current.key}
            type="button"
            onClick={dismissCurrent}
            className="fixed bottom-4 right-4 z-[120] w-[min(92vw,360px)] text-left"
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        >
            <div
                className="flex items-center gap-3 rounded-lg p-3 shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #1E2A31, #151F23)', border: `1.5px solid ${color}88`, boxShadow: `0 10px 30px -8px rgba(0,0,0,0.7), 0 0 0 1px ${color}22` }}
            >
                <AchievementIcon emoji={current.emoji} iconSrc={current.iconSrc} color={color} size={56} unlocked />
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em]" style={{ color }}>Достижение разблокировано</p>
                    <p className="text-[15px] font-extrabold leading-tight text-white">{current.title}</p>
                    <p className="text-xs leading-snug text-[#9AA7B0] mt-0.5">{current.desc}</p>
                </div>
            </div>
        </motion.button>
    );
};
