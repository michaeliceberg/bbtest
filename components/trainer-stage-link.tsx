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
// финальной точке).
//
// Важно: router.push() вызывается НЕ сразу по клику, а с задержкой
// REVEAL_DELAY (см. ниже). Раньше push шёл сразу, и bounce просто
// "надеялся" продержаться на экране хотя бы MIN_EXPAND_DISPLAY — но
// Next.js App Router размонтирует /trainer (а вместе с ним и портал
// оверлея) СРАЗУ, как только новый маршрут готов, независимо от того, в
// какой фазе была наша собственная анимация — на прогретом (prefetched)
// маршруте это иногда обрезало bounce почти сразу после старта.
// Пользователь явно попросил обратное: сначала пусть bounce доиграет
// полностью, и только сразу после этого открывать урок — поэтому теперь
// порядок событий (а не желаемая длительность) гарантирует результат:
// пока не вызван router.push, Next.js в принципе не может подменить
// дерево /trainer, значит наш компонент (и его портал) не может быть
// размонтирован раньше срока.
//
// REVEAL_DELAY — фиксированный таймер, а НЕ framer-motion
// onAnimationComplete на самом spring'е. Живая проверка (программные
// клики + замер реального transform по кадрам) показала: визуально
// bounce полностью оседает уже к ~470-480мс (переданный spring
// `duration: 0.45` — это ощущаемая цель, её framer-motion честно
// выдерживает), но onAnimationComplete у spring-анимации срабатывает
// только когда истинная (физически смоделированная, а не округлённая
// до пикселя) скорость/остаток падают ниже внутреннего порога покоя —
// это заняло у framer-motion ЕЩЁ ~500-700мс сверху в тесте (реальный
// push случился не раньше t≈910мс и не позже t≈1211мс), то есть почти
// вдвое дольше, чем bounce выглядит законченным на экране. Такая
// задержка воспринималась бы как "зависание", а не "аккуратно" — ровно
// то, чего пользователь просил избежать. Обычный setTimeout на
// REVEAL_DELAY, не завязанный на внутренний детектор покоя пружины,
// даёт предсказуемый и быстрый результат.
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
// Совпадает с `duration` spring-перехода ниже (0.45с) + небольшой запас,
// чтобы последние доли перехлёста точно успели визуально осесть — не
// framer-motion'овский onAnimationComplete, см. комментарий в шапке файла.
const REVEAL_DELAY = 480;
// Если целевая страница не успела смонтироваться сразу после
// REVEAL_DELAY (router.push уже вызван, но pathname ещё не сменился —
// см. STUCK_DELAY ниже), раньше квадратик просто застывал увеличенным
// и статичным — пользователь принял это за зависание. Через STUCK_DELAY
// после начала ожидания включаем лёгкое покачивание влево-вправо, пока
// страница не откроется по-настоящему.
const STUCK_DELAY = 300;

type Phase = 'idle' | 'bouncing' | 'fading';

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
    const [isStuck, setIsStuck] = useState(false);
    const stuckTimerRef = useRef<ReturnType<typeof setTimeout>>();
    // Успели ли уже реально вызвать router.push для текущего клика — до
    // этого момента pathname меняться не может, проверять его в эффекте
    // ниже нет смысла (и опасно: pathname мог случайно совпасть с целью
    // ещё до навигации, например при повторном клике по уже открытому
    // маршруту — но это уже отсекается отдельной проверкой в handleClick).
    const pushedRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();
    const revealTimerRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        setMounted(true);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
            if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
        };
    }, []);

    // usePathname() не включает query-строку — сравниваем без "?boss=1".
    const targetPathname = href.split('?')[0];

    // REVEAL_DELAY истёк — bounce визуально закончился, только теперь
    // запускаем настоящую навигацию. До этого момента маршрут не меняется
    // в принципе, поэтому Next.js не может размонтировать /trainer раньше
    // времени, каким бы быстрым (прогретым) ни был целевой урок.
    useEffect(() => {
        if (phase !== 'bouncing') return;
        revealTimerRef.current = setTimeout(() => {
            pushedRef.current = true;
            router.push(href);
            // Навигация запущена, но целевая страница может ещё какое-то
            // время монтироваться (медленная сеть, непрогретый маршрут) —
            // если за STUCK_DELAY страница так и не сменилась, включаем
            // покачивание (см. isStuck ниже), чтобы застывший увеличенный
            // квадратик не читался как зависание.
            stuckTimerRef.current = setTimeout(() => setIsStuck(true), STUCK_DELAY);
        }, REVEAL_DELAY);
        return () => clearTimeout(revealTimerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    // Страница реально сменилась на целевую — можно начинать короткое
    // угасание оверлея. Проверка pushedRef защищает от гипотетического
    // случая, когда pathname совпал бы с целью до собственного push
    // (на практике не должно происходить — see handleClick guard — но
    // без этой проверки эффект мог бы сработать по чужому совпадению).
    useEffect(() => {
        if (phase !== 'bouncing') return;
        if (!pushedRef.current) return;
        if (pathname !== targetPathname) return;

        if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
        setIsStuck(false);
        timerRef.current = setTimeout(() => setPhase('fading'), 0);
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
        pushedRef.current = false;
        setIsStuck(false);
        setPhase('bouncing');
        // router.push() здесь намеренно НЕ вызывается — см. REVEAL_DELAY-эффект выше.
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
                    // style?.background покрывает и обычный backgroundColor,
                    // и CSS-градиент (done-квадратики теперь красятся
                    // градиентом, см. trainer-grade-tree.tsx) — раньше сюда
                    // копировался только backgroundColor, из-за чего
                    // увеличенная копия done-квадратика при анимации
                    // оставалась вообще без фона.
                    background: style?.background ?? style?.backgroundColor,
                    border: style?.border,
                    boxSizing: 'border-box',
                }}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={
                    phase === 'fading'
                        ? { x: centerDelta.x, y: centerDelta.y, scale: SCALE_FACTOR, opacity: 0 }
                        : isStuck
                            // Навигация уже запущена, но целевая страница ещё
                            // не смонтировалась — лёгкое покачивание влево-
                            // вправо вместо статично замершего квадратика,
                            // чтобы было понятно, что мы всё ещё грузим урок,
                            // а не зависли.
                            ? { x: [centerDelta.x - 6, centerDelta.x + 6, centerDelta.x - 6], y: centerDelta.y, scale: SCALE_FACTOR, opacity: 1 }
                            : { x: centerDelta.x, y: centerDelta.y, scale: SCALE_FACTOR, opacity: 1 }
                }
                transition={
                    phase === 'fading'
                        ? { opacity: { duration: FADE_DURATION, ease: 'easeIn' } }
                        : isStuck
                            ? { x: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } }
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
