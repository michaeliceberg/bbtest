// components/centered-lottie.tsx
//
// Lottie, у которого рисунок честно по центру квадрата и во весь его размер. Многие наши Lottie
// (монеты, гемы…) нарисованы смещёнными на большом холсте — выглядят «ниже» и мельче. Здесь после
// загрузки замеряем реальный размер рисунка (getBBox) и подгоняем под него viewBox.
// play=false — просто картинка (кадр frame), play=true — проигрывается один раз/по кругу (loop).

'use client';

import { useRef } from 'react';
import type { LottieRefCurrentProps } from 'lottie-react';
import Lottie from '@/components/lottie-player';

export const CenteredLottie = ({
    animationData,
    size,
    play = false,
    loop = false,
    frame = 0.5,
    pad = 0.04,
}: {
    animationData: unknown;
    size: number;
    play?: boolean;
    loop?: boolean;
    frame?: number; // доля длительности для кадра, по которому меряем (и показываем, если play=false)
    pad?: number;
}) => {
    const ref = useRef<LottieRefCurrentProps>(null);
    const wrap = useRef<HTMLDivElement>(null);

    const onLoaded = () => {
        const l = ref.current;
        const svg = wrap.current?.querySelector('svg');
        if (!l || !svg) return;
        l.goToAndStop(Math.floor((l.getDuration(true) ?? 1) * frame), true);
        try {
            const bb = svg.getBBox();
            if (bb.width > 0 && bb.height > 0) {
                const side = Math.max(bb.width, bb.height) * (1 + pad * 2);
                const cx = bb.x + bb.width / 2;
                const cy = bb.y + bb.height / 2;
                svg.setAttribute('viewBox', `${cx - side / 2} ${cy - side / 2} ${side} ${side}`);
                svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            }
        } catch {
            // getBBox может не сработать в нестандартной среде — тогда остаётся как есть
        }
        if (play) l.goToAndPlay(0, true);
    };

    return (
        <div ref={wrap} style={{ width: size, height: size }}>
            <Lottie
                animationData={animationData}
                lottieRef={ref}
                loop={loop}
                autoplay={false}
                onDOMLoaded={onLoaded}
                style={{ width: size, height: size }}
            />
        </div>
    );
};
