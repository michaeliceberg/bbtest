// components/path-decor.tsx
//
// Декорации вдоль дорожки тренажёра (простой вид): пара штук на юнит, чтобы полотно
// с кнопками уроков выглядело живее. Пока своих анимаций нет — рисуем простые
// SVG-заглушки (пальма, куст, камень, кристалл, цветок). Когда появятся Lottie —
// положить JSON в public/Lottie/decor/ и добавить пути в DECOR_LOTTIE_SRCS:
// тогда они подмешиваются к заглушкам (или полностью заменят их, если
// DECOR_ONLY_LOTTIE = true).

'use client';

import { useEffect, useRef, useState } from 'react';
import Lottie from '@/components/lottie-player';
import type { LottieRefCurrentProps } from 'lottie-react';

// Анимации дорожки лежат в public/Lottie/trainer-road-map/ (по 512×512, 2–3 секунды).
export const DECOR_LOTTIE_SRCS: string[] = [
    '01', '02', '04', '05', '06', '07', '08', '10', '11', '14', '15', '16', '19', '21', '23', '25',
].map((n) => `/Lottie/trainer-road-map/${n}.json`);
// Только Lottie, SVG-заглушки больше не используются.
export const DECOR_ONLY_LOTTIE = true;

const KINDS = ['palm', 'bush', 'rock', 'crystal', 'flower', 'tuft'] as const;
export type DecorKind = (typeof KINDS)[number];

// Всё доступное разнообразие: заглушки (или только Lottie) — индекс выбирает вызывающий по seed.
export const DECOR_VARIANTS: { type: 'svg'; kind: DecorKind }[] | { type: 'lottie'; src: string }[] | (
    { type: 'svg'; kind: DecorKind } | { type: 'lottie'; src: string }
)[] = [
    ...(DECOR_ONLY_LOTTIE && DECOR_LOTTIE_SRCS.length ? [] : KINDS.map((kind) => ({ type: 'svg' as const, kind }))),
    ...DECOR_LOTTIE_SRCS.map((src) => ({ type: 'lottie' as const, src })),
];

const Art = ({ kind }: { kind: DecorKind }) => {
    switch (kind) {
        case 'palm':
            return (
                <svg viewBox="0 0 64 64" className="w-full h-full">
                    <path d="M33 62 C31 46 34 34 32 24" stroke="#A8743C" strokeWidth="5" strokeLinecap="round" fill="none" />
                    <path d="M32 24 C20 14 8 16 4 24 C14 18 24 20 32 24Z" fill="#5FB04A" />
                    <path d="M32 24 C44 14 56 16 60 24 C50 18 40 20 32 24Z" fill="#78C93C" />
                    <path d="M32 24 C26 8 32 2 38 4 C34 10 34 18 32 24Z" fill="#6DBE45" />
                    <path d="M32 24 C22 22 14 30 12 38 C20 30 26 28 32 24Z" fill="#4E9C3C" />
                    <path d="M32 24 C42 22 50 30 52 38 C44 30 38 28 32 24Z" fill="#5FB04A" />
                </svg>
            );
        case 'bush':
            return (
                <svg viewBox="0 0 64 64" className="w-full h-full">
                    <ellipse cx="32" cy="52" rx="24" ry="6" fill="rgba(0,0,0,0.18)" />
                    <circle cx="20" cy="40" r="14" fill="#4E9C3C" />
                    <circle cx="44" cy="40" r="14" fill="#5FB04A" />
                    <circle cx="32" cy="30" r="16" fill="#78C93C" />
                </svg>
            );
        case 'rock':
            return (
                <svg viewBox="0 0 64 64" className="w-full h-full">
                    <ellipse cx="32" cy="52" rx="24" ry="5" fill="rgba(0,0,0,0.18)" />
                    <path d="M8 50 C8 34 22 24 34 26 C48 26 58 38 56 50Z" fill="#7B6A5A" />
                    <path d="M18 42 C20 34 28 30 34 30 C28 34 24 40 24 46Z" fill="#9A8A78" />
                </svg>
            );
        case 'crystal':
            return (
                <svg viewBox="0 0 64 64" className="w-full h-full">
                    <ellipse cx="32" cy="54" rx="22" ry="5" fill="rgba(0,0,0,0.18)" />
                    <path d="M22 52 L16 30 L26 14 L34 30 L30 52Z" fill="#C385F7" />
                    <path d="M34 52 L32 24 L42 10 L52 28 L46 52Z" fill="#E0B4FF" />
                    <path d="M26 14 L34 30 L26 34Z" fill="#F3DCFF" />
                </svg>
            );
        case 'tuft':
            return (
                <svg viewBox="0 0 64 64" className="w-full h-full">
                    <ellipse cx="32" cy="54" rx="20" ry="4" fill="rgba(0,0,0,0.16)" />
                    <path d="M14 54 C14 40 18 30 22 26 C24 36 26 46 26 54Z" fill="#5FB04A" />
                    <path d="M26 54 C26 36 30 22 34 14 C38 24 40 40 38 54Z" fill="#78C93C" />
                    <path d="M38 54 C40 42 44 32 50 28 C50 38 48 48 50 54Z" fill="#4E9C3C" />
                </svg>
            );
        case 'flower':
        default:
            return (
                <svg viewBox="0 0 64 64" className="w-full h-full">
                    <path d="M32 58 C32 46 31 40 32 32" stroke="#4E9C3C" strokeWidth="4" strokeLinecap="round" fill="none" />
                    <path d="M32 46 C24 44 20 38 22 34 C28 36 31 40 32 46Z" fill="#5FB04A" />
                    {[0, 72, 144, 216, 288].map((a) => (
                        <ellipse key={a} cx="32" cy="20" rx="6" ry="10" fill="#F27BA8" transform={`rotate(${a} 32 28)`} />
                    ))}
                    <circle cx="32" cy="28" r="5" fill="#FFD84D" />
                </svg>
            );
    }
};

// Lottie-декорация: пока до неё не дошли — серая и неподвижная (последний кадр), когда дошли —
// один раз проигрывается при попадании в область видимости экрана и остаётся на последнем кадре.
const RoadLottie = ({ src, size, reached }: { src: string; size: number; reached: boolean }) => {
    const wrapRef = useRef<HTMLDivElement>(null);
    const lottieRef = useRef<LottieRefCurrentProps>(null);
    const [loaded, setLoaded] = useState(false);
    const [inView, setInView] = useState(false);
    const playedRef = useRef(false);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') { setInView(true); return; }
        const io = new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) { setInView(true); io.disconnect(); }
        }, { threshold: 0.35 });
        io.observe(el);
        return () => io.disconnect();
    }, []);

    useEffect(() => {
        const l = lottieRef.current;
        if (!loaded || !l) return;
        if (!reached) {
            // Недостижимая: показываем последний кадр (готовая картинка), без проигрывания.
            l.goToAndStop(Math.max(0, Math.floor(l.getDuration(true) ?? 1) - 1), true);
            playedRef.current = false;
            return;
        }
        if (inView && !playedRef.current) {
            playedRef.current = true;
            l.goToAndPlay(0, true);
        }
    }, [loaded, reached, inView]);

    return (
        <div
            ref={wrapRef}
            style={{ width: size, height: size, filter: reached ? 'none' : 'grayscale(1)', opacity: reached ? 1 : 0.5, transition: 'filter 600ms, opacity 600ms' }}
        >
            <Lottie
                animationData={src}
                loop={false}
                autoplay={false}
                lottieRef={lottieRef}
                onDOMLoaded={() => setLoaded(true)}
                style={{ width: size, height: size }}
            />
        </div>
    );
};

export const PathDecoration = ({ variant, size = 64, reached = true }: { variant: { type: 'svg'; kind: DecorKind } | { type: 'lottie'; src: string }; size?: number; reached?: boolean }) => (
    <div style={{ width: size, height: size }} className="pointer-events-none select-none">
        {variant.type === 'lottie'
            ? <RoadLottie src={variant.src} size={size} reached={reached} />
            : <div className="w-full h-full opacity-90"><Art kind={variant.kind} /></div>}
    </div>
);

// Мелкий реквизит по краям тропинки (кусты, камни, цветы, кристаллы, пальмы, трава) — статичные SVG.
export const PROP_KINDS: DecorKind[] = ['bush', 'rock', 'flower', 'tuft', 'crystal', 'palm'];

export const PathProp = ({ kind, size }: { kind: DecorKind; size: number }) => (
    <div style={{ width: size, height: size }} className="pointer-events-none select-none opacity-90">
        <Art kind={kind} />
    </div>
);

// Каменная арка: тропинка проходит под ней.
export const PathArch = ({ size = 92 }: { size?: number }) => (
    <div style={{ width: size, height: size * 0.85 }} className="pointer-events-none select-none">
        <svg viewBox="0 0 96 82" className="w-full h-full">
            <ellipse cx="48" cy="76" rx="40" ry="5" fill="rgba(0,0,0,0.2)" />
            <path d="M6 74 V36 A42 42 0 0 1 90 36 V74 H72 V38 A24 24 0 0 0 24 38 V74 Z" fill="#A29786" />
            <path d="M6 74 V36 A42 42 0 0 1 20 8 L30 18 A28 28 0 0 0 24 38 V74 Z" fill="#8F8577" />
            <path d="M30 4 L38 14 M48 0 L48 12 M66 4 L58 14 M12 50 H24 M72 56 H84 M14 62 H24 M72 44 H84" stroke="#7B7164" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="22" cy="14" r="7" fill="#5FB04A" />
            <circle cx="34" cy="8" r="6" fill="#78C93C" />
            <circle cx="76" cy="12" r="7" fill="#4E9C3C" />
            <circle cx="64" cy="6" r="5" fill="#78C93C" />
            <path d="M10 36 C8 48 10 56 14 62" stroke="#5FB04A" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M86 34 C88 46 86 54 82 60" stroke="#4E9C3C" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
    </div>
);
