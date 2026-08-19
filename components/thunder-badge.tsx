// components/thunder-badge.tsx
//
// Иконка "Челлендж дня" — Lottie-молния. Проигрывается один раз, когда
// попадает в область видимости, и повторно по клику. Анимация грузится
// один раз на всё приложение (модуль-level кэш) и переиспользуется всеми
// инстансами бейджа.

'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

let cachedAnimationData: unknown = null;
let loadPromise: Promise<unknown> | null = null;

function loadThunderAnimation(): Promise<unknown> {
    if (cachedAnimationData) return Promise.resolve(cachedAnimationData);
    if (!loadPromise) {
        loadPromise = fetch('/Lottie/ggege/thunder.json')
            .then((res) => res.json())
            .then((data) => {
                cachedAnimationData = data;
                return data;
            });
    }
    return loadPromise;
}

type Props = {
    size?: number;
    className?: string;
};

export const ThunderBadge = ({ size = 20, className }: Props) => {
    const [animationData, setAnimationData] = useState<unknown>(cachedAnimationData);
    const containerRef = useRef<HTMLDivElement>(null);
    const lottieRef = useRef<any>(null);
    const hasPlayedRef = useRef(false);

    useEffect(() => {
        let cancelled = false;
        loadThunderAnimation().then((data) => {
            if (!cancelled) setAnimationData(data);
        });
        return () => {
            cancelled = true;
        };
    }, []);

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

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        lottieRef.current?.goToAndPlay(0, true);
    };

    return (
        <div
            ref={containerRef}
            onClick={handleClick}
            className={className}
            style={{ width: size, height: size, flexShrink: 0, cursor: 'pointer' }}
        >
            {!!animationData && (
                <Lottie lottieRef={lottieRef} animationData={animationData} loop={false} autoplay={false} />
            )}
        </div>
    );
};
