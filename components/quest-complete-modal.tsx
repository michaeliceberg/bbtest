// components/quest-complete-modal.tsx
//
// Модалка "квест дня выполнен" — тот же приём, что уже проверен для
// повышения уровня (components/level-up-modal.tsx): центральное окно с
// конфетти вместо тихого тоста, момент достаточно значимый, чтобы
// прервать внимание. Палитра — амбер/золото (та же, что у бейджа
// "Выполнен!" и огонька стрика на components/trainer-quest-card.tsx),
// сознательно НЕ фиолетовая — чтобы не путать с модалкой уровня.

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Flame, Gift, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { daysWord } from '@/usefulFunctions';

type QuestCompleteEvent = {
    id: number;
    streak: number;
    pointsReward: number;
} | null;

type Props = {
    event: QuestCompleteEvent;
    onClose: () => void;
};

const AUTO_CLOSE_MS = 5000;

export const QuestCompleteModal = ({ event, onClose }: Props) => {
    const { width, height } = useWindowSize();
    const [confettiActive, setConfettiActive] = useState(true);

    useEffect(() => {
        if (!event) return;
        setConfettiActive(true);
        const confettiTimer = setTimeout(() => setConfettiActive(false), 2500);
        const closeTimer = setTimeout(onClose, AUTO_CLOSE_MS);
        return () => {
            clearTimeout(confettiTimer);
            clearTimeout(closeTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event?.id]);

    if (!event) return null;

    return (
        <div
            key={event.id}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
            onClick={onClose}
        >
            {confettiActive && (
                <Confetti
                    width={width}
                    height={height}
                    numberOfPieces={220}
                    recycle={false}
                    gravity={0.25}
                    colors={['#FBBF24', '#F59E0B', '#F2F7FB', '#FDE68A', '#EF9F27']}
                />
            )}

            <motion.div
                initial={{ scale: 0.75, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', bounce: 0.4, duration: 0.5 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-xs rounded-3xl border border-amber-400/40 bg-[#151F23] px-6 py-8 text-center overflow-hidden"
                style={{ boxShadow: '0 0 60px -10px rgba(251, 191, 36, 0.55)' }}
            >
                {/* Фоновое радиальное свечение позади контента */}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{ background: 'radial-gradient(circle at 50% 20%, rgba(251,191,36,0.25), transparent 60%)' }}
                />

                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 text-[#5C6B73] hover:text-[#F2F7FB] transition-colors"
                    aria-label="Закрыть"
                >
                    <X className="w-4 h-4" />
                </button>

                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', bounce: 0.6, duration: 0.6, delay: 0.1 }}
                    className="relative mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 border border-amber-400/40"
                >
                    <Flame className="w-8 h-8 text-amber-400" />
                </motion.div>

                <p className="relative text-sm font-bold uppercase tracking-wide text-amber-300 mb-2">
                    Квест дня выполнен!
                </p>

                <motion.div
                    initial={{ scale: 0.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', bounce: 0.65, duration: 0.7, delay: 0.35 }}
                    className="relative flex items-center justify-center gap-2 mb-1"
                >
                    <Flame className="w-9 h-9 text-amber-400" />
                    <span
                        className="text-5xl font-black text-[#F2F7FB]"
                        style={{ textShadow: '0 0 20px rgba(251, 191, 36, 0.7)' }}
                    >
                        x{event.streak}
                    </span>
                </motion.div>

                <p className="relative text-[#9AA7B0] text-sm mb-5">
                    Серия из {event.streak} {daysWord(event.streak)} подряд — молодец!
                </p>

                {event.pointsReward > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.4 }}
                        className="relative inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 px-3 py-1 mb-5 text-amber-300 text-sm font-bold"
                    >
                        <Gift className="w-3.5 h-3.5" />
                        +{event.pointsReward} очков
                    </motion.div>
                )}

                <Button variant="primary" className="relative w-full" onClick={onClose}>
                    Продолжить
                </Button>
            </motion.div>
        </div>
    );
};
