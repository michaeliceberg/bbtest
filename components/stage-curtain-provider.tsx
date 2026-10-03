'use client';

// components/stage-curtain-provider.tsx
//
// Переход «шторка» (как motion.dev/examples/react-curtains-wipe): после клика
// по плитке этапа косая полоса заезжает слева и закрывает экран, на ней
// появляется загрузка (плитка, кольцо, название урока, полоска) — минимум
// MIN_SHOW_MS или пока урок не загрузится, затем полоса уезжает вправо, а под
// ней уже открыт урок. Две полосы: акцентная впереди, тёмная следом.
// Живёт в корневом layout — переживает смену маршрута.

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useStageCurtainStore } from '@/store/use-stage-curtain-store';

const SWEEP_S = 0.6; // время заезда/выезда полосы
const LAG_S = 0.12; // отставание тёмной полосы от акцентной
const COVER_MS = (SWEEP_S + LAG_S) * 1000; // экран полностью закрыт
const MIN_SHOW_MS = 2000; // минимум показываем загрузку
const MAX_WAIT_MS = 15000; // страховка, если маршрут так и не сменился
const OUT_MS = (SWEEP_S + LAG_S) * 1000 + 100;
const EASE = [0.76, 0, 0.24, 1] as const;

export const StageCurtainProvider = () => {
    const payload = useStageCurtainStore((s) => s.payload);
    const end = useStageCurtainStore((s) => s.end);
    const router = useRouter();
    const pathname = usePathname();
    const [phase, setPhase] = useState<'in' | 'out'>('in');
    const [pushed, setPushed] = useState(false);
    const [minElapsed, setMinElapsed] = useState(false);
    const [vw, setVw] = useState(0);

    const href = payload?.href;
    useEffect(() => {
        if (!href) return;
        setPhase('in');
        setPushed(false);
        setMinElapsed(false);
        setVw(window.innerWidth);
        const t1 = setTimeout(() => { setPushed(true); router.push(href); }, COVER_MS);
        const t2 = setTimeout(() => setMinElapsed(true), COVER_MS + MIN_SHOW_MS);
        const t3 = setTimeout(() => setPhase('out'), MAX_WAIT_MS);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [href]);

    useEffect(() => {
        if (!href || phase !== 'in' || !pushed || !minElapsed) return;
        if (pathname === href.split('?')[0]) setPhase('out');
    }, [href, phase, pushed, minElapsed, pathname]);

    useEffect(() => {
        if (phase !== 'out' || !href) return;
        const t = setTimeout(end, OUT_MS);
        return () => clearTimeout(t);
    }, [phase, href, end]);

    if (!payload || !vw) return null;

    const slant = Math.max(80, Math.round(vw * 0.22));
    const width = vw + slant * 2;
    const hidden = -(vw + slant * 2);
    const gone = vw + slant * 2;
    const clip = `polygon(${slant}px 0, ${width}px 0, ${width - slant}px 100%, 0 100%)`;
    const out = phase === 'out';
    const { accent } = payload;
    const ringSize = payload.tileSize + 44;

    const curtainProps = (delayIn: number, delayOut: number) => ({
        initial: { x: hidden },
        animate: { x: out ? gone : 0 },
        transition: { duration: SWEEP_S, ease: EASE, delay: out ? delayOut : delayIn },
    });

    return (
        <div className={`fixed inset-0 z-[80] overflow-hidden ${out ? 'pointer-events-none' : ''}`}>
            {/* Акцентная полоса — идёт первой */}
            <motion.div
                className="absolute top-0 h-full"
                style={{ left: -slant, width, clipPath: clip, background: `color-mix(in srgb, ${accent} 55%, #ffffff)` }}
                {...curtainProps(0, LAG_S)}
            />
            {/* Тёмная полоса с загрузкой */}
            <motion.div
                className="absolute top-0 h-full"
                style={{
                    left: -slant,
                    width,
                    clipPath: clip,
                    background: `radial-gradient(circle at 50% 45%, rgba(255,255,255,0.22) 0%, transparent 60%), linear-gradient(160deg, ${accent} 0%, color-mix(in srgb, ${accent} 72%, #000000) 100%)`,
                }}
                {...curtainProps(LAG_S, 0)}
            >
                <div className="absolute top-0 h-full" style={{ left: slant, width: vw }}>
                    <motion.div
                        className="absolute left-1/2 top-1/2"
                        style={{ width: ringSize, height: ringSize, marginLeft: -ringSize / 2, marginTop: -ringSize / 2 }}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.45, type: 'spring', stiffness: 260, damping: 18 }}
                    >
                        <div
                            className="absolute inset-[-30%] rounded-full animate-glow-pulse"
                            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 40%, transparent 68%)' }}
                        />
                        <div
                            className="absolute inset-0 rounded-full animate-stage-ring"
                            style={{
                                background: `conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.5) 90deg, #FFFFFF 140deg, rgba(255,255,255,0.5) 190deg, transparent 300deg)`,
                                WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 6px))',
                                mask: 'radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 6px))',
                            }}
                        />
                        <div
                            className="absolute left-1/2 top-1/2 flex items-center justify-center overflow-hidden rounded-xl"
                            style={{
                                width: payload.tileSize,
                                height: payload.tileSize,
                                marginLeft: -payload.tileSize / 2,
                                marginTop: -payload.tileSize / 2,
                                background: payload.tileBackground,
                                border: payload.tileBorder,
                                boxSizing: 'border-box',
                            }}
                        >
                            <div style={{ transform: 'scale(4.2)' }} className="flex items-center justify-center">{payload.icon}</div>
                            <span
                                className="absolute inset-y-0 left-0 w-1/3 animate-stage-tile-shine"
                                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)' }}
                            />
                        </div>
                    </motion.div>
                    {/* Центрирование — статичной обёрткой: motion перезаписывает transform и стёр бы -translate-x-1/2 */}
                    <div
                        className="absolute left-0 right-0 flex justify-center px-4"
                        style={{ top: `calc(50% + ${ringSize / 2 + 22}px)` }}
                    >
                        <motion.div
                            className="w-full max-w-[22rem] flex flex-col items-center gap-2 text-center"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55, type: 'spring', stiffness: 300, damping: 22 }}
                        >
                            {payload.subtitle && (
                                <span className="text-xs font-bold uppercase tracking-widest text-white/85">{payload.subtitle}</span>
                            )}
                            {payload.title && (
                                <span className="text-xl md:text-2xl font-extrabold text-white leading-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.35)' }}>{payload.title}</span>
                            )}
                            <div className="mt-1 h-1.5 w-40 rounded-full bg-white/25 overflow-hidden">
                                <div className="h-full w-1/3 rounded-full animate-stage-load-bar" style={{ background: 'linear-gradient(90deg, transparent, #FFFFFF)' }} />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
