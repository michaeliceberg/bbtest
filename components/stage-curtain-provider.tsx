'use client';

// components/stage-curtain-provider.tsx
//
// Переход «шторка» (как motion.dev/examples/react-curtains-wipe): после клика
// по плитке этапа косая полоса заезжает слева и закрывает экран, на ней
// появляется загрузка (плитка, кольцо, название урока, полоска) — минимум
// MIN_SHOW_MS или пока урок не загрузится, затем полоса уезжает вправо, а под
// ней уже открыт урок. Две тёмные полосы: передняя чуть светлее, основная — фон тренажёра. Звук — свуш.
// Живёт в корневом layout — переживает смену маршрута.

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { LOTTIE_TEST_PICKER_LIST, getRandomLottie } from '@/src/constants/lottieConstants';
import { playSound, preloadSound } from '@/lib/sound';
import { useStageCurtainStore } from '@/store/use-stage-curtain-store';

const SWEEP_S = 0.6; // время заезда/выезда полосы
const LAG_S = 0.12; // отставание тёмной полосы от акцентной
const COVER_MS = (SWEEP_S + LAG_S) * 1000; // экран полностью закрыт
const MIN_SHOW_MS = 2000; // минимум показываем загрузку
const MAX_WAIT_MS = 15000; // страховка, если маршрут так и не сменился
const OUT_MS = (SWEEP_S + LAG_S) * 1000 + 100;
const CURTAIN_SOUND = '/snd-curtain-swoosh.mp3';
const CURTAIN_BG = '#171F23'; // фон тренажёра
const CURTAIN_FRONT = '#27333B';
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
    const [cycleDone, setCycleDone] = useState(false);
    const [lottieData, setLottieData] = useState<unknown>(null);

    useEffect(() => { preloadSound(CURTAIN_SOUND); }, []);

    const href = payload?.href;
    useEffect(() => {
        if (!href) return;
        setPhase('in');
        setPushed(false);
        setMinElapsed(false);
        setCycleDone(false);
        setLottieData(getRandomLottie(LOTTIE_TEST_PICKER_LIST));
        playSound(CURTAIN_SOUND);
        setVw(window.innerWidth);
        const t1 = setTimeout(() => { setPushed(true); router.push(href); }, COVER_MS);
        const t2 = setTimeout(() => setMinElapsed(true), COVER_MS + MIN_SHOW_MS);
        const t3 = setTimeout(() => setPhase('out'), MAX_WAIT_MS);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [href]);

    useEffect(() => {
        if (!href || phase !== 'in' || !pushed || !minElapsed || !cycleDone) return;
        if (pathname === href.split('?')[0]) setPhase('out');
    }, [href, phase, pushed, minElapsed, cycleDone, pathname]);

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
    const lottieSize = Math.min(vw * 0.7, 300);

    const curtainProps = (delayIn: number, delayOut: number) => ({
        initial: { x: hidden },
        animate: { x: out ? gone : 0 },
        transition: { duration: SWEEP_S, ease: EASE, delay: out ? delayOut : delayIn },
    });

    return (
        <div className={`fixed inset-0 z-[80] overflow-hidden ${out ? 'pointer-events-none' : ''}`}>
            {/* Передняя полоса — чуть светлее фона */}
            <motion.div
                className="absolute top-0 h-full"
                style={{ left: -slant, width, clipPath: clip, background: CURTAIN_FRONT }}
                {...curtainProps(0, LAG_S)}
            />
            {/* Основная полоса с загрузкой — фон тренажёра */}
            <motion.div
                className="absolute top-0 h-full"
                style={{ left: -slant, width, clipPath: clip, background: CURTAIN_BG }}
                {...curtainProps(LAG_S, 0)}
            >
                <div className="absolute top-0 h-full" style={{ left: slant, width: vw }}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.45, type: 'spring', stiffness: 260, damping: 20 }}
                            style={{ width: lottieSize, height: lottieSize }}
                        >
                            {lottieData ? (
                                <Lottie
                                    animationData={lottieData as object}
                                    loop
                                    autoplay
                                    onLoopComplete={() => setCycleDone(true)}
                                    style={{ width: '100%', height: '100%' }}
                                />
                            ) : null}
                        </motion.div>
                        {payload.title && (
                            <motion.span
                                className="max-w-[22rem] text-center text-2xl md:text-3xl font-extrabold leading-tight"
                                style={{
                                    backgroundImage: `linear-gradient(90deg, ${accent}, color-mix(in srgb, ${accent} 45%, #ffffff))`,
                                    WebkitBackgroundClip: 'text',
                                    backgroundClip: 'text',
                                    color: 'transparent',
                                }}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, type: 'spring', stiffness: 300, damping: 22 }}
                            >
                                {payload.title}
                            </motion.span>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
