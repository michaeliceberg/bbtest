// components/achievements-grid.tsx

'use client';

import { useState } from 'react';
import { Trophy, Lock, CheckCircle, Star, Gem, Flame, Target, Brain, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { claimAchievementReward } from '@/actions/claim-achievement';
import { toast } from 'sonner';

type AchievementWithProgress = {
    id: number;
    name: string;
    description: string | null;
    category: string;
    requirement: number;
    rewardPoints: number;
    rewardGems: number;
    imageSrc: string | null;
    sortOrder: number;
    progress: number;
    isCompleted: boolean;
    claimed: boolean;
    completedAt: Date | null;
};

type Props = {
    userId: string;
    achievementsWithProgress: AchievementWithProgress[];
};

export const AchievementsGrid = ({ userId, achievementsWithProgress }: Props) => {
    const [achievements, setAchievements] = useState(achievementsWithProgress);
    const [claiming, setClaiming] = useState<number | null>(null);
    
    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'homework': return <Target className="h-5 w-5" />;
            case 'streak': return <Flame className="h-5 w-5" />;
            case 'trainer': return <Brain className="h-5 w-5" />;
            default: return <Trophy className="h-5 w-5" />;
        }
    };
    
    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'homework': return 'from-blue-500 to-cyan-500';
            case 'streak': return 'from-orange-500 to-red-500';
            case 'trainer': return 'from-purple-500 to-pink-500';
            default: return 'from-yellow-500 to-amber-500';
        }
    };
    
    const getCategoryTitle = (category: string) => {
        switch (category) {
            case 'homework': return '📚 Домашние задания';
            case 'streak': return '🔥 Стрики';
            case 'trainer': return '💪 Тренажер';
            case 'special': return '👑 Особые';
            default: return category;
        }
    };
    
    const handleClaim = async (achievementId: number) => {
        setClaiming(achievementId);
        try {
            const result = await claimAchievementReward(userId, achievementId);
            if (result.success) {
                toast.success(`🎉 Получено: ${result.points}⭐ и ${result.gems}💎`);
                setAchievements(prev => prev.map(ach => 
                    ach.id === achievementId 
                        ? { ...ach, claimed: true }
                        : ach
                ));
            } else {
                toast.error(result.error || 'Ошибка');
            }
        } catch {
            toast.error('Ошибка при получении награды');
        } finally {
            setClaiming(null);
        }
    };
    
    // Группируем по категориям
    const grouped = achievements.reduce((acc, ach) => {
        const cat = ach.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(ach);
        return acc;
    }, {} as Record<string, AchievementWithProgress[]>);
    
    return (
        <div className="space-y-8">
            {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        {getCategoryIcon(category)}
                        <span>{getCategoryTitle(category)}</span>
                    </h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {items.map((ach) => {
                            const progressPercent = Math.min(100, (ach.progress / ach.requirement) * 100);
                            const isCompleted = ach.isCompleted;
                            const isClaimed = ach.claimed;
                            
                            return (
                                <motion.div
                                    key={ach.id}
                                    className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                                        isCompleted 
                                            ? 'border-yellow-400 shadow-lg shadow-yellow-200'
                                            : 'border-gray-200 opacity-70'
                                    }`}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className={`p-4 bg-gradient-to-br ${getCategoryColor(ach.category)} text-white`}>
                                        <div className="flex justify-between items-start">
                                            <div className="text-4xl">
                                                {isCompleted ? '🏆' : '🔒'}
                                            </div>
                                            {isCompleted && !isClaimed && (
                                                <button
                                                    onClick={() => handleClaim(ach.id)}
                                                    disabled={claiming === ach.id}
                                                    className="bg-white/20 hover:bg-white/30 rounded-full p-1 transition"
                                                >
                                                    <Gift className="h-4 w-4" />
                                                </button>
                                            )}
                                            {isClaimed && (
                                                <CheckCircle className="h-5 w-5 text-green-300" />
                                            )}
                                        </div>
                                        <h3 className="font-bold text-lg mt-2">{ach.name}</h3>
                                        <p className="text-xs opacity-90">{ach.description}</p>
                                    </div>
                                    
                                    <div className="p-3 bg-white">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Прогресс</span>
                                            <span>{ach.progress}/{ach.requirement}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div 
                                                className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                        
                                        <div className="flex gap-3 mt-3 text-xs">
                                            <div className="flex items-center gap-1">
                                                <Star className="h-3 w-3 text-yellow-500" />
                                                <span>+{ach.rewardPoints}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Gem className="h-3 w-3 text-blue-500" />
                                                <span>+{ach.rewardGems}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {!isCompleted && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <Lock className="h-8 w-8 text-white" />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};