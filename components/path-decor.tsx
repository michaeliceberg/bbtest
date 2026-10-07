// components/path-decor.tsx
//
// Декорации вдоль дорожки тренажёра (простой вид): пара штук на юнит, чтобы полотно
// с кнопками уроков выглядело живее. Пока своих анимаций нет — рисуем простые
// SVG-заглушки (пальма, куст, камень, кристалл, цветок). Когда появятся Lottie —
// положить JSON в public/Lottie/decor/ и добавить пути в DECOR_LOTTIE_SRCS:
// тогда они подмешиваются к заглушкам (или полностью заменят их, если
// DECOR_ONLY_LOTTIE = true).

'use client';

import Lottie from '@/components/lottie-player';

export const DECOR_LOTTIE_SRCS: string[] = [
    // '/Lottie/decor/palm.json',
];
export const DECOR_ONLY_LOTTIE = false;

const KINDS = ['palm', 'bush', 'rock', 'crystal', 'flower'] as const;
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

export const PathDecoration = ({ variant, size = 64 }: { variant: { type: 'svg'; kind: DecorKind } | { type: 'lottie'; src: string }; size?: number }) => (
    <div style={{ width: size, height: size }} className="pointer-events-none select-none opacity-90">
        {variant.type === 'lottie'
            ? <Lottie animationData={variant.src} loop autoplay style={{ width: size, height: size }} />
            : <Art kind={variant.kind} />}
    </div>
);
