// components/lesson-zigzag-mascot.tsx
//
// Маскот в "пустом пространстве" зигзага кнопок уроков — на экстремумах
// изгиба (когда кружок урока максимально сдвинут в одну сторону) с
// противоположной стороны остаётся пустое место, и туда мы ставим Lottie.
// В отличие от UnitCardLottie (справа от карточки Unit'а): нет порога по
// прогрессу — проигрывается при первом попадании в область видимости
// независимо от прогресса, плюс клик по нему проигрывает анимацию заново.
//
// Размер и отступ — НЕ фиксированные/vw-based (это либо обрезалось по
// правому краю на десктопе, либо было мельче, чем реально можно, на
// телефоне), а вычисляются через реальный замер свободного места: от
// правого/левого края ряда урока до края общего контейнера уроков
// (data-zigzag-container в unit.tsx) — тогда размер честно подстраивается
// под то, сколько места на самом деле есть.

'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { MASCOT_FILES, loadMascot } from '@/components/unit-card-lottie';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

type Props = {
    side: 'left' | 'right';
};

const MIN_SIZE = 28;
const MAX_SIZE = 150;
const EDGE_MARGIN = 8; // отступ от самого края контейнера, чтобы не липло вплотную

export const LessonZigzagMascot = ({ side }: Props) => {
    const [file] = useState(() => MASCOT_FILES[Math.floor(Math.random() * MASCOT_FILES.length)]);
    const [animationData, setAnimationData] = useState<unknown>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const lottieRef = useRef<any>(null);
    const hasPlayedRef = useRef(false);

    const [layout, setLayout] = useState<{ size: number; offset: number } | null>(null);

    useEffect(() => {
        let cancelled = false;
        loadMascot(file).then((data) => {
            if (!cancelled) setAnimationData(data);
        });
        return () => {
            cancelled = true;
        };
    }, [file]);

    // Замер реального свободного места: от края ряда урока (родитель этого
    // wrapper'а) до края общего контейнера уроков — и вычисление размера/
    // отступа так, чтобы маскот занимал примерно 60% этого зазора, но не
    // вплотную к краю.
    useEffect(() => {
        const measure = () => {
            const rowEl = wrapperRef.current?.parentElement;
            const containerEl = wrapperRef.current?.closest<HTMLElement>('[data-zigzag-container]');
            if (!rowEl || !containerEl) return;

            const rowRect = rowEl.getBoundingClientRect();
            const containerRect = containerEl.getBoundingClientRect();
            const available = side === 'right'
                ? containerRect.right - rowRect.right
                : rowRect.left - containerRect.left;

            const usable = Math.max(0, available - EDGE_MARGIN);
            const size = Math.min(MAX_SIZE, Math.max(MIN_SIZE, usable * 0.6));
            const offset = Math.max(EDGE_MARGIN, (usable - size) / 2 + EDGE_MARGIN);
            setLayout({ size, offset });
        };

        measure();
        // Двойной замер следующим кадром — на случай, если шрифты/змейка
        // ещё не успели встать на финальные позиции к первому рендеру.
        const raf = requestAnimationFrame(measure);
        window.addEventListener('resize', measure);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', measure);
        };
    }, [side]);

    useEffect(() => {
        if (!animationData || !wrapperRef.current) return;

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
        observer.observe(wrapperRef.current);
        return () => observer.disconnect();
    }, [animationData]);

    const replay = (e: React.MouseEvent) => {
        // Маскот лежит внутри <Link> урока — без stopPropagation/preventDefault
        // клик всплывал бы до ссылки и вместо повтора анимации открывал урок.
        e.preventDefault();
        e.stopPropagation();
        lottieRef.current?.goToAndPlay(0, true);
    };

    // wrapperRef должен существовать с самого первого рендера — иначе
    // измерению (см. выше) буквально нечего мерить. Поэтому обёртка
    // рендерится всегда, а до первого замера просто нулевого размера
    // (невидима, ни на что не влияет).
    const isMeasured = !!layout && layout.size >= MIN_SIZE;

    return (
        <div
            ref={wrapperRef}
            onClick={isMeasured ? replay : undefined}
            role="button"
            aria-label="Проиграть анимацию ещё раз"
            className="absolute top-1/2 z-10 select-none"
            style={
                isMeasured
                    ? {
                        [side === 'right' ? 'left' : 'right']: `calc(100% + ${layout.offset}px)`,
                        transform: 'translateY(-50%)',
                        width: layout.size,
                        height: layout.size,
                        cursor: 'pointer',
                    }
                    : { width: 0, height: 0, overflow: 'hidden', [side === 'right' ? 'left' : 'right']: '100%' }
            }
        >
            {isMeasured && !!animationData && (
                <Lottie lottieRef={lottieRef} animationData={animationData} loop={false} autoplay={false} />
            )}
        </div>
    );
};
