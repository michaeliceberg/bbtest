// components/trainer-stage-link.tsx
//
// Клик по квадратику этапа тренажёра — вместо мгновенной навигации
// (не даёт пользователю понять, тот ли именно квадратик открылся, см.
// обсуждение) квадратик подпрыгивает: увеличивается в SCALE_FACTOR раз
// с bounce-эффектом и едет в центр экрана, затем открывается сам урок.
// Тот же портал + ручной router.push паттерн, что уже применяется в
// utils/TransitionLink.tsx для переходов между разделами сайдбара —
// но без случайного Lottie: анимация исходит ИМЕННО из нажатого
// элемента (shared-element style), это и даёт пользователю
// пространственную обратную связь "открылся именно этот этап", а не
// просто "что-то грузится".
//
// Первая версия растила квадратик до fullscreen (top/left/width/height
// → 0/0/100vw/100vh) — пользователь оценил как "скучно и некрасиво".
// Переделано на transform (x/y/scale) вместо layout-свойств: transform
// дёшев для браузера и, в отличие от анимации width/height, естественно
// поддерживает spring-bounce (лёгкий перехлёст перед тем, как осесть в
// финальной точке) — именно этого эффекта попросил пользователь.
//
// Настоящий cross-route framer-motion `layoutId` shared layout здесь не
// подходит — /trainer и /t-lesson/[id] рендерятся в независимых
// поддеревьях без общего motion-контекста (LayoutGroup пришлось бы
// поднимать на уровень общего layout, где живут и десятки других
// анимаций). Ручной portal-оверлей, который сам знает стартовый rect
// и просто едет transform'ом к центру, — надёжнее и не требует правок
// layout.tsx.

'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

const SCALE_FACTOR = 5;
const FADE_DURATION = 0.18;
// Пользователь явно попросил: если lesson загрузился быстрее анимации —
// открывать сразу, не ждать. Поэтому минимум держим маленьким — только
// чтобы гарантировать хотя бы один отрисованный кадр эффекта (иначе при
// мгновенной (закэшированной) навигации оверлей мог бы не успеть даже
// показаться на экране). Если страница подгружается дольше — bounce
// доигрывает до конца сам, ждать её не приходится.
const MIN_EXPAND_DISPLAY = 150;

type Phase = 'idle' | 'expanding' | 'fading';

type Props = {
    href: string;
    className?: string;
    style?: React.CSSProperties;
    // Иконка этапа — показывается и в самом квадратике, и (тем же
    // элементом, просто увеличенным вместе со всем квадратиком через
    // общий transform) в оверлее.
    icon: React.ReactNode;
    // Доп. контент квадратика (бейдж-подарок и т.п.) — рисуется только
    // в самом квадратике, не участвует в анимации.
    extra?: React.ReactNode;
};

export const TrainerStageLink = ({ href, className, style, icon, extra }: Props) => {
    const ref = useRef<HTMLAnchorElement>(null);
    const router = useRouter();
    const pathname = usePathname();
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [phase, setPhase] = useState<Phase>('idle');
    const [mounted, setMounted] = useState(false);
    const clickTimeRef = useRef<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        setMounted(true);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    // usePathname() не включает query-строку — сравниваем без "?boss=1".
    const targetPathname = href.split('?')[0];

    // Страница реально сменилась на целевую — можно начинать угасание
    // (не раньше MIN_EXPAND_DISPLAY от клика, см. комментарий выше —
    // только маленький защитный буфер, не полное ожидание bounce).
    useEffect(() => {
        if (phase !== 'expanding') return;
        if (pathname !== targetPathname) return;

        const elapsed = clickTimeRef.current ? Date.now() - clickTimeRef.current : MIN_EXPAND_DISPLAY;
        const remaining = Math.max(0, MIN_EXPAND_DISPLAY - elapsed);
        timerRef.current = setTimeout(() => setPhase('fading'), remaining);
        return () => clearTimeout(timerRef.current);
    }, [pathname, targetPathname, phase]);

    useEffect(() => {
        if (phase !== 'fading') return;
        timerRef.current = setTimeout(() => setPhase('idle'), FADE_DURATION * 1000);
        return () => clearTimeout(timerRef.current);
    }, [phase]);

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (phase !== 'idle' || pathname === targetPathname) return;

        const r = ref.current?.getBoundingClientRect();
        if (!r) {
            router.push(href);
            return;
        }

        setRect(r);
        clickTimeRef.current = Date.now();
        setPhase('expanding');
        router.push(href);
    };

    // Смещение от центра нажатого квадратика до центра экрана — считается
    // один раз, в момент клика (viewport не меняется за время жизни
    // оверлея). rect — координаты relative-to-viewport (getBoundingClientRect),
    // ровно то, что нужно для position:fixed элемента без поправки на скролл.
    const centerDelta = rect
        ? {
            x: window.innerWidth / 2 - (rect.left + rect.width / 2),
            y: window.innerHeight / 2 - (rect.top + rect.height / 2),
        }
        : { x: 0, y: 0 };

    // Портал прямо в <body> — та же причина, что и в TransitionLink.tsx:
    // fixed внутри анимированного (framer-motion transform) предка может
    // "прилипнуть" не ко всему экрану.
    const overlay = mounted && phase !== 'idle' && rect
        ? createPortal(
            <motion.div
                className="fixed z-[70] flex items-center justify-center overflow-hidden pointer-events-none rounded-xl"
                style={{
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    backgroundColor: style?.backgroundColor,
                    border: style?.border,
                    boxSizing: 'border-box',
                }}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={
                    phase === 'fading'
                        ? { x: centerDelta.x, y: centerDelta.y, scale: SCALE_FACTOR, opacity: 0 }
                        : { x: centerDelta.x, y: centerDelta.y, scale: SCALE_FACTOR, opacity: 1 }
                }
                transition={
                    phase === 'fading'
                        ? { opacity: { duration: FADE_DURATION, ease: 'easeIn' } }
                        : { type: 'spring', duration: 0.45, bounce: 0.5 }
                }
            >
                {icon}
            </motion.div>,
            document.body
        )
        : null;

    return (
        <>
            {overlay}
            <Link ref={ref} href={href} onClick={handleClick} className={className} style={style}>
                {icon}
                {extra}
            </Link>
        </>
    );
};
