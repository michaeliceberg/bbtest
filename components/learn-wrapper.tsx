// components/learn-wrapper.tsx

'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Celebration } from '@/components/celebration';
import { useCelebrationStore } from '@/store/celebration-store';

type Props = {
    children: React.ReactNode;
    courseId?: number | null;
};

export const LearnWrapper = ({ children, courseId }: Props) => {
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
            {/* LearnWrapper — та же клиентская инстанция при смене курса
                (redirect на /learn меняет только children, не размонтирует
                обёртку), поэтому обычный motion "initial→animate" тут не
                переигрывается сам по себе. Ключ courseId в AnimatePresence
                заставляет старый курс уехать влево, а новый — въехать
                справа к центру, вместо резкой подмены контента. */}
            {/* popLayout: уходящий курс не толкает вниз/не растягивает
                контейнер, пока анимируется — иначе на миг был бы виден
                двойной высоты layout (старый ещё в потоке + новый уже
                вставлен). */}
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                    key={courseId ?? "default"}
                    initial={{ x: 60, opacity: 0 }}
                    animate={{ x: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }}
                    exit={{ x: -60, opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }}
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </>
    );
};
