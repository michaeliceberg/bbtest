'use client';

import { useEffect } from 'react';
import { useAchievementClaimStore } from '@/store/use-achievement-claim-store';

// Кладёт серверное число непрошенных наград в стор (при загрузке и при обновлении layout).
export const AchievementClaimInit = ({ count }: { count: number }) => {
    const setCount = useAchievementClaimStore((s) => s.setCount);
    useEffect(() => { setCount(count); }, [count, setCount]);
    return null;
};
