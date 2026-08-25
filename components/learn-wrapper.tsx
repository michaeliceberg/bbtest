// components/learn-wrapper.tsx

'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Celebration } from '@/components/celebration';
import { useCelebrationStore } from '@/store/celebration-store';

type Props = {
    children: React.ReactNode;
};

export const LearnWrapper = ({ children }: Props) => {
    const searchParams = useSearchParams();
    const { isOpen, hide, show } = useCelebrationStore();
    
    useEffect(() => {
        const completed = searchParams.get('homeworkCompleted');
        if (completed === 'daily') {
            show('Челлендж дня выполнен!', 'Отличная работа! Продолжай в том же духе!', { points: 50, gems: 10 });
        }
    }, [searchParams, show]);
    
    return (
        <>
            <Celebration isOpen={isOpen} onClose={hide} />
            {/* Плавный въезд контента справа при каждом маунте страницы —
                в частности, при смене курса (redirect на /learn), чтобы
                новый курс не вспыхивал резко, а въезжал к центру. */}
            <motion.div
                initial={{ x: 28, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
            >
                {children}
            </motion.div>
        </>
    );
};