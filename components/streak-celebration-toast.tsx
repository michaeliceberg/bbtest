// components/streak-celebration-toast.tsx
//
// "Огонёк радуется" — показывается, когда user_course_progress.streak
// продлевается на новый день (см. lib/streak.ts, вызывается из
// app/lesson/quiz.tsx и app/t-lesson/[t_lessonId]/TQUIZ.tsx через
// store/use-streak-celebration-store.ts). По просьбе пользователя ("чтобы
// добавить ЭМОЦИЙ, пользователь чувствовал, что ему хочется увидеть
// приятный Lottie") — раньше это был обычный текстовый toast.success(),
// теперь Lottie-анимация огонька (public/Lottie/streak/), случайно
// выбранная из 4 вариантов при каждом показе.
//
// Тот же паттерн, что уже проверен в components/achievement-toast.tsx:
// key-ремонт на motion.div вместо AnimatePresence (в проекте
// AnimatePresence не раз давала зависшую exit-анимацию, см. CLAUDE.md),
// свой таймер закрытия, полоска прогресса до автозакрытия.

'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { LOTTIE_STREAK_CELEBRATE_LIST, getRandomLottie } from '@/src/constants/lottieConstants';
import { daysWord } from '@/usefulFunctions';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

type StreakEvent = { id: number; streak: number } | null;

type Props = {
    event: StreakEvent;
    onClose: () => void;
};

const DURATION_MS = 3800;

export const StreakCelebrationToast = ({ event, onClose }: Props) => {
    // Выбирается один раз на показ (не на каждый ре-рендер) — новый
    // случайный вариант при каждом НОВОМ событии благодаря remount по
    // key={event.id} на обёртке ниже (React пересоздаёт этот useState
    // вместе со всем компонентом).
    const [animationData] = useState(() => getRandomLottie(LOTTIE_STREAK_CELEBRATE_LIST));

    useEffect(() => {
        if (!event) return;
        const timer = setTimeout(onClose, DURATION_MS);
        return () => clearTimeout(timer);
    }, [event, onClose]);

    if (!event) return null;

    return (
        <motion.div
            key={event.id}
            // bottom-28, не bottom-4 — тот же угол экрана, что уже занят
            // components/achievement-toast.tsx (bottom-4), оба могут
            // сработать почти одновременно (уровень + ачивка + серия за
            // один и тот же верный ответ) — фиксированный вертикальный
            // сдвиг вместо общего менеджера стека тостов, простое решение
            // под редкий, а не постоянный кейс одновременного показа.
            className="fixed bottom-28 right-4 z-50 max-w-xs"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        >
            <div className="rounded-xl shadow-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #F97316, #EF4444)' }}>
                <div className="p-3 flex items-center gap-1">
                    <div className="w-16 h-16 shrink-0 -my-2">
                        <Lottie animationData={animationData} loop={false} autoplay />
                    </div>
                    <div>
                        <p className="text-white text-xs font-medium">🔥 СЕРИЯ ПРОДЛЕНА!</p>
                        <p className="text-white font-extrabold text-xl leading-tight">
                            {event.streak} {daysWord(event.streak)} подряд
                        </p>
                    </div>
                </div>
                <div className="h-1 bg-white/30">
                    <motion.div
                        key={event.id}
                        className="h-full bg-[#151F23]"
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: DURATION_MS / 1000, ease: 'linear' }}
                    />
                </div>
            </div>
        </motion.div>
    );
};
