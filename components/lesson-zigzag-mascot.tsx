// components/lesson-zigzag-mascot.tsx
//
// Маскот в "пустом пространстве" зигзага кнопок уроков — на экстремумах
// изгиба (когда кружок урока максимально сдвинут в одну сторону) с
// противоположной стороны остаётся пустое место, и туда мы ставим Lottie.
// В отличие от UnitCardLottie (справа от карточки Unit'а): нет порога по
// прогрессу — проигрывается при первом попадании в область видимости
// независимо от прогресса, плюс клик по нему проигрывает анимацию заново.

'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { MASCOT_FILES, loadMascot } from '@/components/unit-card-lottie';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

type Props = {
    side: 'left' | 'right';
    size?: number;
};

export const LessonZigzagMascot = ({ side, size = 48 }: Props) => {
    const [file] = useState(() => MASCOT_FILES[Math.floor(Math.random() * MASCOT_FILES.length)]);
    const [animationData, setAnimationData] = useState<unknown>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lottieRef = useRef<any>(null);
    const hasPlayedRef = useRef(false);

    useEffect(() => {
        let cancelled = false;
        loadMascot(file).then((data) => {
            if (!cancelled) setAnimationData(data);
        });
        return () => {
            cancelled = true;
        };
    }, [file]);

    useEffect(() => {
        if (!animationData || !containerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasPlayedRef.current) {
                        hasPlayedRef.current = true;
                        lottieRef.current?.goToAndPlay(0, true);
                    }
                });
            },
            { threshold: 0.4 }
        );
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [animationData]);

    const replay = () => {
        lottieRef.current?.goToAndPlay(0, true);
    };

    return (
        <div
            ref={containerRef}
            onClick={replay}
            role="button"
            aria-label="Проиграть анимацию ещё раз"
            className="absolute top-1/2 hidden md:block cursor-pointer select-none"
            style={{
                [side === 'right' ? 'left' : 'right']: 'calc(100% + 12px)',
                transform: 'translateY(-50%)',
                width: size,
                height: size,
                flexShrink: 0,
            }}
        >
            {!!animationData && (
                <Lottie lottieRef={lottieRef} animationData={animationData} loop={false} autoplay={false} />
            )}
        </div>
    );
};
