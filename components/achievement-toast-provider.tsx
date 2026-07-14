// В components/achievement-toast-provider.tsx

'use client';

import { useState, useEffect } from 'react';
import { AchievementToast } from './achievement-toast';
import { useAchievementStore } from '@/store/use-achievement-store';

export const AchievementToastProvider = () => {
    const { currentAchievement, clearAchievement } = useAchievementStore();
    
    return (
        <AchievementToast 
            achievement={currentAchievement}
            onClose={clearAchievement}
        />
    );
};