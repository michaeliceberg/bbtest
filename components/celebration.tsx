// components/celebration.tsx

'use client';

import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindowSize } from 'react-use';
import { Crown, Sparkles, Gift } from 'lucide-react';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
    reward?: {
        points?: number;
        gems?: number;
        lootBox?: string;
    } | null;  // ← добавить | null
};

export const Celebration = ({ isOpen, onClose, title = 'Челлендж дня выполнен!', message, reward }: Props) => {
    const { width, height } = useWindowSize();
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShowConfetti(true);
            const timer = setTimeout(() => {
                setShowConfetti(false);
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            {showConfetti && (
                <Confetti
                    width={width}
                    height={height}
                    recycle={false}
                    numberOfPieces={500}
                    gravity={0.3}
                    colors={['#8b5cf6', '#fbbf24', '#f97316', '#10b981', '#3b82f6']}
                />
            )}
            <AnimatePresence>
                <motion.div
                    className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 rounded-2xl shadow-2xl p-6 max-w-md mx-4 pointer-events-auto"
                        initial={{ scale: 0.3, y: 100, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                    >
                        <div className="text-center">
                            <motion.div
                                className="text-6xl mb-3"
                                animate={{ rotate: [0, -10, 10, -10, 0] }}
                                transition={{ duration: 0.5 }}
                            >
                                🎉
                            </motion.div>
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Sparkles className="h-5 w-5 text-yellow-300" />
                                <span className="text-white text-sm font-semibold uppercase tracking-wide">
                                    {title}
                                </span>
                                <Sparkles className="h-5 w-5 text-yellow-300" />
                            </div>
                            <p className="text-white text-lg mb-3">
                                {message || 'Ты выполнил все задания челленджа!'}
                            </p>
                            {reward && (
                                <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/20">
                                    {reward.points && (
                                        <div className="flex items-center gap-1 text-white">
                                            <span className="text-xl">⭐</span>
                                            <span className="font-bold">+{reward.points}</span>
                                        </div>
                                    )}
                                    {reward.gems && (
                                        <div className="flex items-center gap-1 text-white">
                                            <span className="text-xl">💎</span>
                                            <span className="font-bold">+{reward.gems}</span>
                                        </div>
                                    )}
                                    {reward.lootBox && (
                                        <div className="flex items-center gap-1 text-white">
                                            <Gift className="h-5 w-5" />
                                            <span className="font-bold">+1 {reward.lootBox}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            <motion.div
                                className="mt-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Crown className="h-8 w-8 text-yellow-300 mx-auto" />
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </>
    );
};