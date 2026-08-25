// components/unit-card-lottie.tsx
//
// Небольшой декоративный маскот справа от карточки Unit'а — случайный
// файл из public/Lottie/UnitCard. Проигрывается один раз при попадании
// в область видимости. Если юнит решён меньше чем на 50% — статичный
// и обесцвеченный (как в состоянии Locked), совсем не проигрывается.

'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

export const MASCOT_FILES = [
    'LottieKapiAngry.json',
    'LottieKapiCry.json',
    'LottieKapiGood1.json',
    'LottieKapiHeart.json',
    'LottieKapiHeart2.json',
    'LottieKapiIll.json',
    'LottieKapiJusmroof.json',
    'LottieKapiNo.json',
    'LottieKapiParty.json',
    'LottieKapiPoor.json',
    'LottieKapiRich.json',
    'LottieKapiSad1.json',
    'LottieKapiSuperstart.json',
    'LottieKapiThink.json',
    'LottieKapiThirsty.json',
];

export const mascotCache = new Map<string, unknown>();
const cache = mascotCache;

export function loadMascot(file: string): Promise<unknown> {
    if (cache.has(file)) return Promise.resolve(cache.get(file));
    return fetch(`/Lottie/UnitCard/${file}`)
        .then((res) => res.json())
        .then((data) => {
            cache.set(file, data);
            return data;
        });
}

type Props = {
    progress: number; // 0..1, прогресс юнита
    size?: number;
    className?: string;
};

export const UnitCardLottie = ({ progress, size = 56, className }: Props) => {
    const isUnlocked = progress >= 0.5;
    const [file] = useState(() => MASCOT_FILES[Math.floor(Math.random() * MASCOT_FILES.length)]);
    const [animationData, setAnimationData] = useState<unknown>(cache.get(file) ?? null);
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
        if (!isUnlocked || !animationData || !containerRef.current) return;

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
    }, [animationData, isUnlocked]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                width: size,
                height: size,
                flexShrink: 0,
                filter: isUnlocked ? 'none' : 'grayscale(1) opacity(0.55)',
            }}
        >
            {!!animationData && (
                <Lottie lottieRef={lottieRef} animationData={animationData} loop={false} autoplay={false} />
            )}
        </div>
    );
};
