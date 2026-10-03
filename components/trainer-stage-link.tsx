// components/trainer-stage-link.tsx
//
// Ссылка-плитка этапа тренажёра. Клик не ведёт сразу: запускается переход
// «шторка» (components/stage-curtain-provider.tsx, живёт в корневом layout) —
// косая полоса закрывает экран, на ней загрузка с названием урока, затем
// полоса уезжает вправо, открывая урок. Сама навигация выполняется провайдером.
// (Раньше плитка «подпрыгивала» и росла в центр — оверлей жил внутри этого
// компонента и пропадал вместе со страницей /trainer при смене маршрута.)

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { useStageCurtainStore } from '@/store/use-stage-curtain-store';

const SCALE_FACTOR = 4.2;

type Props = {
    href: string;
    className?: string;
    style?: React.CSSProperties;
    // Иконка этапа — показывается и в самом квадратике, и на шторке.
    icon: React.ReactNode;
    // Доп. контент квадратика (бейдж и т.п.) — только в самой плитке.
    extra?: React.ReactNode;
    // Подписи на экране загрузки: название урока и «тема · этап N».
    title?: string;
    subtitle?: string;
    // Цвет юнита — шторка, кольцо, свечение и полоска загрузки.
    accent?: string;
};

export const TrainerStageLink = ({ href, className, style, icon, extra, title, subtitle, accent = '#53ADEF' }: Props) => {
    const ref = useRef<HTMLAnchorElement>(null);
    const pathname = usePathname();
    const start = useStageCurtainStore((s) => s.start);
    const targetPathname = href.split('?')[0];

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (pathname === targetPathname) return;
        const r = ref.current?.getBoundingClientRect();
        start({
            href,
            tileSize: (r?.width ?? 56) * SCALE_FACTOR,
            tileBackground: (style?.background ?? style?.backgroundColor) as string | undefined,
            tileBorder: style?.border as string | undefined,
            icon,
            title,
            subtitle,
            accent,
        });
    };

    return (
        <Link ref={ref} href={href} onClick={handleClick} className={className} style={style}>
            {icon}
            {extra}
        </Link>
    );
};
