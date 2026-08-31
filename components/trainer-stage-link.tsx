// components/trainer-stage-link.tsx
//
// Клик по квадратику этапа тренажёра — вместо мгновенной навигации
// (не даёт пользователю понять, тот ли именно квадратик открылся, см.
// обсуждение) квадратик "вырастает" из точки клика на весь экран тем
// же цветом, что и он сам, затем открывается сам урок. Тот же
// портал + ручной router.push паттерн, что уже применяется в
// utils/TransitionLink.tsx для переходов между разделами сайдбара —
// но без случайного Lottie: анимация исходит ИМЕННО из нажатого
// элемента (shared-element style), это и даёт пользователю
// пространственную обратную связь "открылся именно этот этап", а не
// просто "что-то грузится".
//
// Настоящий cross-route framer-motion `layoutId` shared layout здесь не
// подходит — /trainer и /t-lesson/[id] рендерятся в независимых
// поддеревьях без общего motion-контекста (LayoutGroup пришлось бы
// поднимать на уровень общего layout, где живут и десятки других
// анимаций). Ручной portal-оверлей, который сам знает стартовый rect
// и просто едет к fullscreen, — надёжнее и не требует правок layout.tsx.

'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

const EXPAND_DURATION = 0.5;
const FADE_DURATION = 0.25;
// Держим полностью развёрнутый оверлей чуть дольше самой анимации
// роста — если страница успела отрендериться раньше (быстрый переход),
// не хотим сразу же начинать угасание посреди роста.
const MIN_EXPAND_DISPLAY = EXPAND_DURATION * 1000 + 100;

type Phase = 'idle' | 'expanding' | 'fading';

type Props = {
    href: string;
    className?: string;
    style?: React.CSSProperties;
    // Иконка этапа — показывается и в самом квадратике, и (укрупнённая
    // через scale, тем же элементом — transform не зависит от
    // интринсик-размера) в центре разворачивающегося оверлея.
    icon: React.ReactNode;
    // Доп. контент квадратика (бейдж-подарок и т.п.) — рисуется только
    // в самом квадратике, не участвует в fullscreen-анимации.
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
    // (не раньше MIN_EXPAND_DISPLAY от клика, см. комментарий выше).
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

    // Портал прямо в <body> — та же причина, что и в TransitionLink.tsx:
    // fixed внутри анимированного (framer-motion transform) предка может
    // "прилипнуть" не ко всему экрану.
    const overlay = mounted && phase !== 'idle' && rect
        ? createPortal(
            <motion.div
                className="fixed z-[70] flex items-center justify-center overflow-hidden pointer-events-none"
                style={{ backgroundColor: style?.backgroundColor, border: style?.border, boxSizing: 'border-box' }}
                initial={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, borderRadius: 12, opacity: 1 }}
                animate={
                    phase === 'fading'
                        ? { opacity: 0 }
                        : { top: 0, left: 0, width: '100vw', height: '100vh', borderRadius: 0, opacity: 1 }
                }
                transition={{ duration: phase === 'fading' ? FADE_DURATION : EXPAND_DURATION, ease: [0.4, 0, 0.2, 1] }}
            >
                <motion.div
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 5, opacity: 0 }}
                    transition={{ duration: EXPAND_DURATION * 0.8, ease: 'easeOut' }}
                >
                    {icon}
                </motion.div>
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
