// components/achievement-toast.tsx

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star } from 'lucide-react';

type Achievement = {
    id: number;
    name: string;
    description: string;
    rewardPoints: number;
    rewardGems: number;
};

type Props = {
    achievement: Achievement | null;
    onClose: () => void;
};

export const AchievementToast = ({ achievement, onClose }: Props) => {
    useEffect(() => {
        if (achievement) {
            const timer = setTimeout(() => {
                onClose();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [achievement, onClose]);
    
    if (!achievement) return null;
    
    return (
        <AnimatePresence>
            <motion.div
                className="fixed bottom-4 right-4 z-50 max-w-sm"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
            >
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-2xl overflow-hidden">
                    <div className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="bg-white/20 rounded-full p-2">
                                <Trophy className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-white text-xs font-medium">🎉 НОВОЕ ДОСТИЖЕНИЕ!</p>
                                <p className="text-white font-bold text-lg">{achievement.name}</p>
                                <p className="text-white/80 text-sm">{achievement.description}</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="flex items-center gap-1">
                                        <Star className="h-3 w-3 text-yellow-200" />
                                        <span className="text-white text-xs">+{achievement.rewardPoints}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-white text-xs">💎</span>
                                        <span className="text-white text-xs">+{achievement.rewardGems}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="h-1 bg-white/30">
                        <motion.div
                            className="h-full bg-[#151F23]"
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: 3, ease: 'linear' }}
                        />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};