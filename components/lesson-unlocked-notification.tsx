// components/lesson-unlocked-notification.tsx

'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Crown, Sparkles, Rocket } from 'lucide-react';

type Props = {
    lessonTitle: string;
    unitTitle: string;
    isOpen: boolean;
    onClose: () => void;
};

export const LessonUnlockedNotification = ({ lessonTitle, unitTitle, isOpen, onClose }: Props) => {
    const { width, height } = useWindowSize();

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            <Confetti
                width={width}
                height={height}
                recycle={false}
                numberOfPieces={300}
                gravity={0.3}
                colors={['#fbbf24', '#f97316', '#8b5cf6', '#10b981', '#3b82f6']}
            />
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
                                    Новый урок открыт!
                                </span>
                                <Sparkles className="h-5 w-5 text-yellow-300" />
                            </div>
                            <h3 className="text-white text-2xl font-bold mb-1">{lessonTitle}</h3>
                            <p className="text-white/80 text-sm">
                                Раздел: {unitTitle}
                            </p>
                            <motion.div
                                className="mt-4 flex items-center justify-center gap-2 text-white/90 text-sm"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Rocket className="h-4 w-4" />
                                <span>Продолжай в том же духе!</span>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </>
    );
};