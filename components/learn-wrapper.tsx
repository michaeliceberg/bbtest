// components/learn-wrapper.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Celebration } from '@/components/celebration';
import { useCelebrationStore } from '@/store/celebration-store';
import { useCourseSwitchStore } from '@/store/course-switch-store';

type Props = {
    children: React.ReactNode;
    courseId?: number | null;
};

export const LearnWrapper = ({ children, courseId }: Props) => {
    const searchParams = useSearchParams();
    const { isOpen, hide, show } = useCelebrationStore();
    const pendingCourseId = useCourseSwitchStore((s) => s.pendingCourseId);
    const clearPending = useCourseSwitchStore((s) => s.clear);

    // Снимок ("замороженный") старый контент — захватывается в момент клика
    // по курсу (см. sidebar.tsx), пока сервер ещё не ответил, и сразу же
    // начинает уезжать влево. Реальный контент под ним на это время просто
    // прячется (он идентичен снимку в первый кадр, так что подмены не видно).
    const [frozenOld, setFrozenOld] = useState<React.ReactNode | null>(null);
    const prevCourseIdRef = useRef(courseId);

    useEffect(() => {
        if (pendingCourseId != null && pendingCourseId !== courseId && frozenOld === null) {
            setFrozenOld(children);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingCourseId, courseId]);

    // Реальные данные нового курса пришли — переключение фактически
    // завершилось, снимаем "ожидание" (сам frozenOld доиграет свой выезд
    // и уберётся себя сам по onAnimationComplete).
    useEffect(() => {
        if (prevCourseIdRef.current !== courseId) {
            prevCourseIdRef.current = courseId;
            clearPending();
        }
    }, [courseId, clearPending]);

    const isTransitioning = pendingCourseId != null && pendingCourseId !== courseId;

    useEffect(() => {
        const completed = searchParams.get('homeworkCompleted');
        if (completed === 'daily') {
            show('Челлендж дня выполнен!', 'Отличная работа! Продолжай в том же духе!', { points: 50, gems: 10 });
        }
    }, [searchParams, show]);

    return (
        <>
            <Celebration isOpen={isOpen} onClose={hide} />
            {/* overflow-x-clip — обе анимации (выезд старого контента влево,
                въезд нового справа) двигают motion.div на ±60px по X; без
                клипа этот сдвиг на мобильной ширине даёт горизонтальный
                скролл всей страницы на время (и, судя по всему, "залипает"
                в scrollWidth на весь остаток жизни вкладки — см. диагностику
                в spawn_task). "clip", не "hidden", — чтобы не зацепить
                overflow-y (он тут нигде не используется намеренно, но
                hidden на одной оси у флекс-контейнеров в этом проекте уже
                раз давал неожиданные эффекты на другой оси). */}
            <div className="relative overflow-x-clip">
                {frozenOld && (
                    <motion.div
                        className="absolute inset-0"
                        initial={{ x: 0, opacity: 1 }}
                        animate={{ x: -60, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeIn" }}
                        onAnimationComplete={() => setFrozenOld(null)}
                    >
                        {frozenOld}
                    </motion.div>
                )}
                <motion.div
                    key={courseId ?? "default"}
                    initial={{ x: 60, opacity: 0 }}
                    animate={isTransitioning ? { opacity: 0 } : { x: 0, opacity: 1 }}
                    transition={{ duration: isTransitioning ? 0 : 0.4, ease: "easeOut" }}
                >
                    {children}
                </motion.div>
            </div>
        </>
    );
};
