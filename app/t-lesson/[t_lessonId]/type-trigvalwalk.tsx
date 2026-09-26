// app/t-lesson/[t_lessonId]/type-trigvalwalk.tsx
//
// Разборы по шагам «Таблица 30°, 45°, 60°» (юнит t_unit=18) — два типа на
// одном компоненте:
//   TRIGSCWALK — «Три волшебных угла»: 30/45/60 (+ игра «нажми по порядку»),
//                синус — «лесенка» √1, √2, √3 над 2, косинус — та же
//                лесенка справа налево.
//   TRIGTGWALK — тангенс = синус : косинус, по столбцам 30° → 45° → 60°:
//                столбец подсвечен, синус и косинус «падают» из таблицы
//                вниз в деление, результат вписывается в строку tg;
//                итог: «маленький — 1 — большой».
// Тот же самодостаточный принцип, что у остальных *WALK: компонент сам
// ведёт хореографию, зовёт onAnswer/onComplete один раз в конце; общая
// нижняя кнопка скрыта. После разбора — 6 тренировочных заданий (значение
// по углу / угол по значению), режим «пробуй, пока не угадаешь».

'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'
import {
    TypedLine, DiagramBlock,
    pickWalkthroughNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    isFieryMilestoneTrial, FieryFeedbackBanner,
} from '@/components/geometry/WalkthroughLog'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'

const SCENE_TRANSITION_PAUSE_MS = 1000
const TRIAL_COUNT = 6

type Mode = 'sincos' | 'tg'
type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
    mode: Mode
}

// ===== Значения =====
type Fn = 'sin' | 'cos' | 'tg'
type V = { num: string; den?: string }
const ANGLES = [30, 45, 60] as const
const VALUES: Record<Fn, V[]> = {
    sin: [{ num: '1', den: '2' }, { num: '√2', den: '2' }, { num: '√3', den: '2' }],
    cos: [{ num: '√3', den: '2' }, { num: '√2', den: '2' }, { num: '1', den: '2' }],
    tg: [{ num: '√3', den: '3' }, { num: '1' }, { num: '√3' }],
}
const ALL_DISTINCT: V[] = [
    { num: '1', den: '2' }, { num: '√2', den: '2' }, { num: '√3', den: '2' },
    { num: '√3', den: '3' }, { num: '1' }, { num: '√3' },
]
const vKey = (v: V) => `${v.num}/${v.den ?? ''}`

// Цвета: каждый угол — свой цвет (как стикеры в интро), строки функций — свой.
const ANGLE_COLOR: Record<number, string> = {
    30: GGEGE_PALETTE.teal.button,
    45: GGEGE_PALETTE.blue.button,
    60: GGEGE_PALETTE.purple.button,
}
const FN_COLOR: Record<Fn, string> = {
    sin: GGEGE_PALETTE.orange.button,
    cos: GGEGE_PALETTE.green.button,
    tg: GGEGE_PALETTE.raspberry.button,
}
const ATTENTION = GGEGE_PALETTE.orange.button

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

// ===== Отрисовка чисел (HTML, без KaTeX) =====
// «√3» — знак корня и черта над подкоренным числом.
const Num = ({ s }: { s: string }) =>
    s.startsWith('√') ? (
        <span className="inline-flex items-baseline whitespace-nowrap">
            <span>√</span>
            <span className="border-t-2 border-current leading-none pt-[1px]">{s.slice(1)}</span>
        </span>
    ) : (
        <span>{s}</span>
    )

const Frac = ({ num, den }: { num: React.ReactNode; den: React.ReactNode }) => (
    <span className="inline-flex flex-col leading-none align-middle">
        <span className="pb-1 border-b-2 border-current px-1 flex justify-center">{num}</span>
        <span className="pt-1 px-1 flex justify-center">{den}</span>
    </span>
)

const ValView = ({ v }: { v: V }) => (v.den ? <Frac num={<Num s={v.num} />} den={<Num s={v.den} />} /> : <Num s={v.num} />)

// Появление с отскоком (bounce) с задержкой.
const Pop = ({ delay = 0, children, className }: { delay?: number; children: React.ReactNode; className?: string }) => (
    <motion.span
        initial={{ scale: 2.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 15, delay }}
        className={cn('inline-flex', className)}
    >
        {children}
    </motion.span>
)

const AngleSticker = ({ a, big = false }: { a: number; big?: boolean }) => (
    <span
        className={cn('inline-flex items-center justify-center rounded-xl border-2 font-black', big ? 'px-4 py-2 text-4xl md:text-5xl' : 'px-2 py-0.5 text-base md:text-lg')}
        style={{ borderColor: ANGLE_COLOR[a], backgroundColor: hexToRgba(ANGLE_COLOR[a], 0.18), color: ANGLE_COLOR[a] }}
    >
        {a}°
    </span>
)

// Кусок таблицы: шапка с углами + строки функций. cell(fn, i) — содержимое ячейки.
// highlight — номер столбца, который подсвечен (остальные приглушены).
const TrigTable = ({ fns, cell, highlight }: { fns: Fn[]; cell: (fn: Fn, i: number) => React.ReactNode; highlight?: number }) => (
    <div className="w-full flex justify-center py-2">
        <div className="grid grid-cols-[3.5rem_repeat(3,minmax(4.5rem,6.5rem))] gap-1.5 text-xl md:text-2xl font-extrabold text-[#F2F7FB]">
            <div />
            {ANGLES.map((a, i) => (
                <div key={a} className="flex h-12 items-center justify-center transition-opacity duration-500" style={{ opacity: highlight === undefined || highlight === i ? 1 : 0.3 }}>
                    <AngleSticker a={a} />
                </div>
            ))}
            {fns.map((fn) => (
                <Fragment key={fn}>
                    <div className="flex items-center justify-center text-lg md:text-xl font-black" style={{ color: FN_COLOR[fn] }}>
                        {fn}
                    </div>
                    {ANGLES.map((a, i) => (
                        <div
                            key={a}
                            data-cell={`${fn}-${i}`}
                            className="flex h-20 items-center justify-center rounded-xl border-2 transition-opacity duration-500"
                            style={{
                                borderColor: highlight === i ? FN_COLOR[fn] : hexToRgba(FN_COLOR[fn], 0.35),
                                backgroundColor: hexToRgba(FN_COLOR[fn], highlight === i ? 0.16 : 0.06),
                                boxShadow: highlight === i ? `0 0 14px ${hexToRgba(FN_COLOR[fn], 0.45)}` : undefined,
                                opacity: highlight === undefined || highlight === i ? 1 : 0.3,
                            }}
                        >
                            {cell(fn, i)}
                        </div>
                    ))}
                </Fragment>
            ))}
        </div>
    </div>
)

const TEXT = 'w-full text-base md:text-lg text-[#F2F7FB]'

// Сцена: диаграмма → пауза (с запасом под её анимации) → строки текста по очереди.
const SeqScene = ({ diagram, diagramMs = 900, lines, onSettled, confetti }: {
    diagram: React.ReactNode; diagramMs?: number; lines: string[]; onSettled?: () => void; confetti?: boolean
}) => {
    const [shown, setShown] = useState(0)
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(() => setShown(1), diagramMs)}>{diagram}</DiagramBlock>
            {lines.map((text, i) =>
                shown > i ? (
                    <TypedLine
                        key={i}
                        className={TEXT}
                        text={text}
                        onSettled={() => (i + 1 < lines.length ? setShown(i + 2) : onSettled?.())}
                    />
                ) : null,
            )}
            {confetti && shown >= lines.length && <LocalAnswerConfetti />}
        </>
    )
}

// ===== Сцены «синус и косинус» =====
const IntroAnglesScene = ({ onSettled }: { onSettled?: () => void }) => (
    <SeqScene
        diagramMs={1900}
        diagram={
            <div className="w-full flex flex-col items-center gap-5 py-3">
                <motion.p
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
                    className="text-2xl md:text-3xl font-black text-center text-[#F2F7FB]"
                >
                    Запомни <span style={{ color: ATTENTION }}>ТРИ ВОЛШЕБНЫХ</span> угла!
                </motion.p>
                <div className="flex items-center gap-3">
                    {ANGLES.map((a, i) => (
                        <Pop key={a} delay={0.6 + i * 0.4}>
                            <AngleSticker a={a} big />
                        </Pop>
                    ))}
                </div>
            </div>
        }
        lines={['Именно в таком порядке: каждый следующий на 15° больше.']}
        onSettled={onSettled}
    />
)

// Мини-игра: нажми углы по порядку.
const OrderGameScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [ready, setReady] = useState(false)
    const [order] = useState(() => shuffle([...ANGLES]))
    const [picked, setPicked] = useState<number[]>([])
    const [flash, setFlash] = useState<string | null>(null)
    const done = picked.length === ANGLES.length
    const tap = (a: number) => {
        if (done || picked.includes(a)) return
        playSound('/click6.wav')
        if (a === ANGLES[picked.length]) {
            const next = [...picked, a]
            setPicked(next)
            setFlash(null)
            if (next.length === ANGLES.length) setTimeout(() => onSettled?.(), 900)
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setFlash(pickWrongTryPhrase())
        }
    }
    return (
        <>
            <TypedLine className={TEXT} text="Нажми углы по порядку — от меньшего к большему:" onSettled={() => setReady(true)} delayAfter={200} />
            {ready && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-4 py-2">
                        <div className="flex items-center gap-3">
                            {ANGLES.map((_, i) => (
                                <div key={i} className="flex h-16 w-20 items-center justify-center rounded-xl border-2 border-dashed border-[#3A464E]">
                                    {picked[i] !== undefined && (
                                        <Pop>
                                            <AngleSticker a={picked[i]} />
                                        </Pop>
                                    )}
                                </div>
                            ))}
                        </div>
                        {!done && (
                            <div className="flex items-center gap-3">
                                {order.map((a) => (
                                    <button
                                        key={a}
                                        type="button"
                                        onClick={() => tap(a)}
                                        disabled={picked.includes(a)}
                                        className={cn('transition-opacity', picked.includes(a) && 'opacity-0')}
                                    >
                                        <AngleSticker a={a} big />
                                    </button>
                                ))}
                            </div>
                        )}
                        {flash && !done && (
                            <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold bg-[#DC605B22] text-[#DC605B]">
                                <X className="w-5 h-5" /> {flash}
                            </div>
                        )}
                        {done && <p className="text-lg font-black text-[#A1D151]">30° → 45° → 60°. Отлично!</p>}
                    </div>
                    {done && <LocalAnswerConfetti />}
                </DiagramBlock>
            )}
        </>
    )
}

// Ячейка-дробь, у которой числитель и знаменатель (с чертой) появляются
// по отдельности: showNum / showDen, delay — задержка появления.
const SplitFrac = ({ num, den, showNum, showDen, numDelay = 0, denDelay = 0 }: {
    num: string; den: string; showNum: boolean; showDen: boolean; numDelay?: number; denDelay?: number
}) => (
    <span className="inline-flex flex-col items-stretch leading-none">
        <span className="flex h-7 justify-center px-1 pb-1">{showNum && <Pop delay={numDelay}><Num s={num} /></Pop>}</span>
        <span className="flex h-7 justify-center px-1 pt-1">
            {showDen && (
                <Pop delay={denDelay} className="w-full justify-center border-t-2 border-current pt-1">
                    <Num s={den} />
                </Pop>
            )}
        </span>
    </span>
)

// Крупная «запомни»-фраза.
const BigLine = ({ children }: { children: React.ReactNode }) => (
    <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
        className="w-full text-center text-2xl md:text-3xl font-black text-[#F2F7FB]"
    >
        {children}
    </motion.div>
)

// Синус по шагам: «sin — ЛЕСЕНКА ВВЕРХ √1, √2, √3» → числители в таблице →
// «и всё делим на 2» → знаменатели 2 в каждой ячейке по очереди.
const SIN_PHASES_MS = [1800, 2000, 1400, 1800] // 0→1 фраза, 1→2 числители, 2→3 фраза, 3→4 знаменатели
const SinLadderScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        if (phase >= SIN_PHASES_MS.length) {
            const t = setTimeout(() => onSettled?.(), 400)
            return () => clearTimeout(t)
        }
        const t = setTimeout(() => setPhase((p) => p + 1), SIN_PHASES_MS[phase])
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    return (
        <>
            <BigLine>
                Запомни: <span style={{ color: FN_COLOR.sin }}>sin</span> — это <span style={{ color: ATTENTION }}>ЛЕСЕНКА ВВЕРХ</span>
                <div className="mt-2 flex items-center justify-center gap-4" style={{ color: FN_COLOR.sin }}>
                    {['√1', '√2', '√3'].map((n, i) => (
                        <Pop key={n} delay={0.5 + i * 0.35}><Num s={n} /></Pop>
                    ))}
                </div>
            </BigLine>
            {phase >= 1 && (
                <DiagramBlock>
                    <TrigTable
                        fns={['sin']}
                        cell={(_fn, i) => (
                            <span style={{ color: FN_COLOR.sin }}>
                                <SplitFrac
                                    num={`√${i + 1}`}
                                    den="2"
                                    showNum={phase >= 1}
                                    numDelay={0.3 + i * 0.5}
                                    showDen={phase >= 3}
                                    denDelay={0.3 + i * 0.45}
                                />
                            </span>
                        )}
                    />
                </DiagramBlock>
            )}
            {phase >= 2 && (
                <BigLine>
                    И всё делим на <span className="text-6xl md:text-7xl align-middle" style={{ color: FN_COLOR.sin }}>2</span>
                </BigLine>
            )}
        </>
    )
}

// Майкл Джексон лунной походкой проходит по строке косинуса справа налево
// (public/video/mj-moonwalk.mp4, 186×140, ~5.8 с, со звуком — если браузер не
// даст звук, играет без него). Идёт ровно всё время ролика: от середины
// ячейки cos 60° до середины ячейки cos 30°.
const MOONWALK_FALLBACK_S = 5.8
const VIDEO_H = 80 // px — высота строки таблицы (h-20)
const VIDEO_W = Math.round((VIDEO_H * 186) / 140)
const Moonwalker = ({ fromX, toX, onDone }: { fromX: number; toX: number; onDone: () => void }) => {
    const ref = useRef<HTMLVideoElement>(null)
    const doneRef = useRef(false)
    const [duration, setDuration] = useState<number | null>(null)
    const finish = () => {
        if (doneRef.current) return
        doneRef.current = true
        onDone()
    }
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const start = () => {
            setDuration(Number.isFinite(el.duration) && el.duration > 0 ? el.duration : MOONWALK_FALLBACK_S)
            el.play().catch(() => {
                el.muted = true
                el.play().catch(() => {})
            })
        }
        if (el.readyState >= 1) start()
        else el.addEventListener('loadedmetadata', start, { once: true })
        // Если метаданные не пришли — стартуем с расчётной длительностью.
        const t = setTimeout(() => setDuration((d) => d ?? MOONWALK_FALLBACK_S), 1500)
        return () => clearTimeout(t)
    }, [])
    // Ролик закончился — дошли до cos 30°. Страховка по таймеру — если
    // событие не придёт.
    useEffect(() => {
        if (duration === null) return
        const t = setTimeout(finish, duration * 1000 + 400)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration])
    return (
        <motion.div
            className="pointer-events-none absolute top-0 left-0"
            style={{ width: VIDEO_W, height: VIDEO_H }}
            initial={{ x: fromX - VIDEO_W / 2 }}
            animate={duration !== null ? { x: toX - VIDEO_W / 2 } : { x: fromX - VIDEO_W / 2 }}
            transition={duration !== null ? { duration, ease: 'linear' } : { duration: 0 }}
        >
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video ref={ref} src="/video/mj-moonwalk.mp4" playsInline onEnded={finish} className="h-full w-full rounded-lg object-cover" />
        </motion.div>
    )
}

// Косинус: таблица с пустой строкой cos → фраза → лунная походка справа
// налево по строке → заполняем ячейки справа налево.
const CosMirrorScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0) // 0 таблица, 1 фраза, 2 походка, 3 заполнение
    const [walked, setWalked] = useState(false)
    const wrapRef = useRef<HTMLDivElement>(null)
    // Середины ячеек cos 60° и cos 30° относительно обёртки таблицы.
    const [path, setPath] = useState<{ from: number; to: number } | null>(null)
    useEffect(() => {
        if (phase !== 2) return
        const wrap = wrapRef.current
        const c60 = wrap?.querySelector('[data-cell="cos-2"]')
        const c30 = wrap?.querySelector('[data-cell="cos-0"]')
        if (!wrap || !c60 || !c30) return
        const w = wrap.getBoundingClientRect()
        const r60 = c60.getBoundingClientRect()
        const r30 = c30.getBoundingClientRect()
        setPath({ from: r60.left + r60.width / 2 - w.left, to: r30.left + r30.width / 2 - w.left })
    }, [phase])
    useEffect(() => {
        if (phase === 3) {
            const t = setTimeout(() => onSettled?.(), 2200)
            return () => clearTimeout(t)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(() => setPhase(1), 700)}>
                <div ref={wrapRef} className="relative w-full">
                    <TrigTable
                        fns={['sin', 'cos']}
                        cell={(fn, i) => (
                            <span style={{ color: FN_COLOR[fn] }}>
                                {fn === 'sin' ? (
                                    <ValView v={VALUES.sin[i]} />
                                ) : phase >= 3 ? (
                                    <Pop delay={0.2 + (2 - i) * 0.5}>
                                        <ValView v={VALUES.cos[i]} />
                                    </Pop>
                                ) : null}
                            </span>
                        )}
                    />
                    {/* Строка косинуса — нижние 80px таблицы (h-20) + отступ py-2. */}
                    {phase === 2 && !walked && path && (
                        <div className="absolute inset-x-0 bottom-2 h-20">
                            <Moonwalker fromX={path.from} toX={path.to} onDone={() => { setWalked(true); setPhase(3) }} />
                        </div>
                    )}
                </div>
            </DiagramBlock>
            {phase >= 1 && (
                <TypedLine className={TEXT} text="Косинус — та же лесенка, только справа налево." onSettled={() => setPhase((p) => Math.max(p, 2))} />
            )}
            {phase >= 3 && <LocalAnswerConfetti />}
        </>
    )
}

// ===== Сцены «тангенс» =====
const TgIntroScene = ({ onSettled }: { onSettled?: () => void }) => (
    <SeqScene
        diagramMs={600}
        diagram={
            <TrigTable
                fns={['sin', 'cos', 'tg']}
                cell={(fn, i) => (
                    <span style={{ color: FN_COLOR[fn] }}>{fn === 'tg' ? <span className="font-black">?</span> : <ValView v={VALUES[fn][i]} />}</span>
                )}
            />
        }
        lines={['Синус и косинус ты уже знаешь.', 'Нижнюю строку — тангенс — построим по двум верхним.']}
        onSettled={onSettled}
    />
)

// Столбец тангенса: таблица с подсвеченным столбцом → из неё вниз «падают»
// синус, потом косинус, между ними «:», затем результат; он же вписывается
// в строку tg таблицы. Уже посчитанные столбцы (done) в строке tg заполнены.
const DROP = { y: -120, opacity: 0 }
const Drop = ({ delay, children }: { delay: number; children: React.ReactNode }) => (
    <motion.span
        initial={DROP}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay }}
        className="inline-flex"
    >
        {children}
    </motion.span>
)
const TgColumnScene = ({ i, done, lines, onSettled }: { i: number; done: number[]; lines: string[]; onSettled?: () => void }) => (
    <SeqScene
        diagramMs={3600}
        diagram={
            <div className="w-full flex flex-col items-center">
                <TrigTable
                    fns={['sin', 'cos', 'tg']}
                    highlight={i}
                    cell={(fn, j) => (
                        <span style={{ color: FN_COLOR[fn] }}>
                            {fn !== 'tg' ? (
                                <ValView v={VALUES[fn][j]} />
                            ) : done.includes(j) ? (
                                <ValView v={VALUES.tg[j]} />
                            ) : j === i ? (
                                <Pop key="res" delay={3.1}>
                                    <ValView v={VALUES.tg[j]} />
                                </Pop>
                            ) : (
                                <span className="font-black">?</span>
                            )}
                        </span>
                    )}
                />
                <div className="w-full flex items-center justify-center gap-2 flex-wrap text-2xl md:text-3xl font-extrabold pt-2 pb-3 text-[#F2F7FB]">
                    <span style={{ color: FN_COLOR.tg }}>tg</span>
                    <AngleSticker a={ANGLES[i]} />
                    <span>=</span>
                    <Drop delay={0.7}>
                        <span style={{ color: FN_COLOR.sin }}><ValView v={VALUES.sin[i]} /></span>
                    </Drop>
                    <Pop delay={1.4}><span>:</span></Pop>
                    <Drop delay={1.8}>
                        <span style={{ color: FN_COLOR.cos }}><ValView v={VALUES.cos[i]} /></span>
                    </Drop>
                    <Pop delay={2.5}><span>=</span></Pop>
                    <Pop delay={2.7}>
                        <span style={{ color: FN_COLOR.tg }}><ValView v={VALUES.tg[i]} /></span>
                    </Pop>
                </div>
            </div>
        }
        lines={lines}
        onSettled={onSettled}
    />
)

const TgFullScene = ({ onSettled }: { onSettled?: () => void }) => (
    <SeqScene
        diagramMs={1800}
        confetti
        diagram={
            <TrigTable
                fns={['sin', 'cos', 'tg']}
                cell={(fn, i) => (
                    <span style={{ color: FN_COLOR[fn] }}>
                        {fn === 'tg' ? (
                            <Pop delay={0.3 + i * 0.4}>
                                <ValView v={VALUES.tg[i]} />
                            </Pop>
                        ) : (
                            <ValView v={VALUES[fn][i]} />
                        )}
                    </span>
                )}
            />
        }
        lines={['Тангенс: маленький — 1 — большой.', 'А 1 стоит ровно посередине, у 45°!']}
        onSettled={onSettled}
    />
)

// ===== Тренировка =====
type Opt = { kind: 'val'; v: V } | { kind: 'ang'; a: number }
type Trial =
    | { kind: 'value'; fn: Fn; ai: number; options: Opt[] }
    | { kind: 'angle'; fn: Fn; ai: number; options: Opt[] }

const optKey = (o: Opt) => (o.kind === 'val' ? `v:${vKey(o.v)}` : `a:${o.a}`)

const makeValueTrial = (fn: Fn, ai: number): Trial => {
    const correct = VALUES[fn][ai]
    // Приоритет — правдоподобные ошибки: та же строка (другой угол) и другая
    // функция того же угла.
    const pool: V[] = []
    const add = (v: V) => { if (vKey(v) !== vKey(correct) && !pool.some((p) => vKey(p) === vKey(v))) pool.push(v) }
    ;(['sin', 'cos', 'tg'] as Fn[]).filter((f) => f !== fn).forEach((f) => add(VALUES[f][ai]))
    VALUES[fn].forEach(add)
    shuffle(ALL_DISTINCT).forEach(add)
    const opts: Opt[] = [correct, ...pool.slice(0, 3)].map((v) => ({ kind: 'val', v }))
    return { kind: 'value', fn, ai, options: shuffle(opts) }
}

const makeAngleTrial = (fn: Fn, ai: number): Trial => ({
    kind: 'angle', fn, ai,
    options: [30, 45, 60, 90].map((a) => ({ kind: 'ang', a } as Opt)),
})

const makeTrials = (mode: Mode): Trial[] => {
    const fnsMain: Fn[] = mode === 'sincos' ? ['sin', 'cos'] : ['tg']
    const fnsMix: Fn[] = mode === 'sincos' ? ['sin', 'cos'] : ['tg', 'tg', 'sin', 'cos']
    const kinds: ('value' | 'angle')[] = ['value', 'value', 'angle', 'value', 'angle', 'value']
    const out: Trial[] = []
    let prev = ''
    for (let i = 0; i < TRIAL_COUNT; i++) {
        let t: Trial
        let guard = 0
        do {
            const fn = i < 2 ? pick(fnsMain) : pick(fnsMix)
            const ai = Math.floor(Math.random() * 3)
            // У тангенса угол по значению однозначен; у sin/cos тоже (30/45/60).
            t = kinds[i] === 'value' ? makeValueTrial(fn, ai) : makeAngleTrial(fn, ai)
            guard++
        } while (`${t.kind}${t.fn}${t.ai}` === prev && guard < 8)
        prev = `${t.kind}${t.fn}${t.ai}`
        out.push(t)
    }
    return out
}

const correctOptKey = (t: Trial) => (t.kind === 'value' ? optKey({ kind: 'val', v: VALUES[t.fn][t.ai] }) : optKey({ kind: 'ang', a: ANGLES[t.ai] }))

const TrialPrompt = ({ t }: { t: Trial }) => (
    <div className="w-full flex items-center justify-center gap-2 flex-wrap text-2xl md:text-3xl font-extrabold py-2 text-[#F2F7FB]">
        {t.kind === 'value' ? (
            <>
                <span style={{ color: FN_COLOR[t.fn] }}>{t.fn}</span>
                <span>{ANGLES[t.ai]}°</span>
                <span>=</span>
                <span className="font-black" style={{ color: '#4A90D9' }}>?</span>
            </>
        ) : (
            <>
                <span style={{ color: FN_COLOR[t.fn] }}>{t.fn}</span>
                <span>α =</span>
                <span style={{ color: FN_COLOR[t.fn] }}><ValView v={VALUES[t.fn][t.ai]} /></span>
                <span className="ml-2 text-lg md:text-xl text-[#9AA7B0]">α = ?</span>
            </>
        )}
    </div>
)

const OptButton = ({ o, onClick, disabled, state }: { o: Opt; onClick?: () => void; disabled?: boolean; state: 'idle' | 'correct' | 'wrong' }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
            'flex min-h-[72px] items-center justify-center py-3 px-3 rounded-xl border-2 text-xl md:text-2xl font-extrabold transition-colors',
            state === 'correct' && 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]',
            state === 'wrong' && 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]',
            state === 'idle' && 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]',
        )}
    >
        {o.kind === 'val' ? <ValView v={o.v} /> : <span>{o.a}°</span>}
    </button>
)

const pickTrialFeedback = (t: Trial, i: number): string =>
    CORRECT_FEEDBACK_PHRASES[(t.ai * 7 + i * 5 + t.fn.length) % CORRECT_FEEDBACK_PHRASES.length]

// ===== Компонент =====
export const TypeTrigValWalk = ({ onAnswer, onComplete, mode }: Props) => {
    const scenes = useMemo(
        () =>
            mode === 'sincos'
                ? [IntroAnglesScene, OrderGameScene, SinLadderScene, CosMirrorScene]
                : [
                    TgIntroScene,
                    (p: { onSettled?: () => void }) => (
                        <TgColumnScene i={0} done={[]} lines={['Смотри: тангенс — это синус : косинус из того же столбика.', 'Двойки сокращаются — получается 1/√3, то есть √3/3.']} {...p} />
                    ),
                    (p: { onSettled?: () => void }) => (
                        <TgColumnScene i={1} done={[0]} lines={['Одинаковые числа делим друг на друга — получается 1!']} {...p} />
                    ),
                    (p: { onSettled?: () => void }) => (
                        <TgColumnScene i={2} done={[0, 1]} lines={['Двойки сокращаются — остаётся √3.']} {...p} />
                    ),
                    TgFullScene,
                ],
        [mode],
    )
    const INTRO_STEPS = scenes.length

    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
    const [hadMistake, setHadMistake] = useState(false)
    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)

    const [trials] = useState<Trial[]>(() => makeTrials(mode))
    const [trialIndex, setTrialIndex] = useState(0)
    const [checked, setChecked] = useState(false)
    const [wrongTried, setWrongTried] = useState<string[]>([])
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)

    const [introNextLabel, setIntroNextLabel] = useState('Дальше')
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    useEffect(() => { setIntroNextLabel(pickWalkthroughNextLabel('Дальше')) }, [step])

    const handleOptionClick = (t: Trial, o: Opt) => {
        playSound('/click6.wav')
        if (checked) return
        const k = optKey(o)
        if (wrongTried.includes(k)) return
        if (k === correctOptKey(t)) {
            setChecked(true)
            setTrialNextLabel(pickWalkthroughNextLabel('Дальше'))
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setHadMistake(true)
            setWrongTried((prev) => [...prev, k])
            setWrongFlash(pickWrongTryPhrase())
        }
    }

    const handleNextTrial = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            if (trialIndex + 1 >= trials.length) {
                setAdvancing(false)
                const ok = !hadMistake
                onComplete(ok)
                onAnswer(ok ? 'right' : 'wrong')
                return
            }
            setTrialIndex((i) => i + 1)
            setChecked(false)
            setWrongTried([])
            setWrongFlash(null)
            setAdvancing(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }

    const handleIntroNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            if (step + 1 >= INTRO_STEPS) setPhase('practice')
            else {
                setStep((s) => s + 1)
                setStepReady(false)
            }
            setAdvancing(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }

    const { bump: bumpNonce, nonceFor } = useReplayNonces()
    const latestSceneKey = phase === 'intro' ? `step-${step}` : `trial-${trialIndex}`
    const prevSceneKeyOf = (key: string): string | null => {
        if (key.startsWith('trial-')) {
            const idx = Number(key.slice(6))
            return idx > 0 ? `trial-${idx - 1}` : `step-${INTRO_STEPS - 1}`
        }
        const idx = Number(key.slice(5))
        return idx > 0 ? `step-${idx - 1}` : null
    }
    const contentSettled = phase === 'intro' ? stepReady : checked
    const { isActive: isSceneActive, sceneRef } = useSceneFocus(latestSceneKey, contentSettled)
    const canGoBack = prevSceneKeyOf(latestSceneKey) !== null
    const handleReplay = () => {
        bumpNonce(latestSceneKey)
        if (phase === 'intro') setStepReady(false)
    }
    const handleBack = () => {
        if (advancing) return
        const target = prevSceneKeyOf(latestSceneKey)
        if (!target) return
        bumpNonce(target)
        if (target.startsWith('trial-')) {
            setTrialIndex(Number(target.slice(6)))
            setChecked(false)
            setWrongTried([])
            setWrongFlash(null)
        } else {
            setPhase('intro')
            setStep(Number(target.slice(5)))
            setStepReady(false)
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            <div className="w-full flex flex-col gap-4">
                {scenes.map((Scene, i) =>
                    step >= i ? (
                        <SceneWrapper key={`step-${i}`} innerRef={sceneRef(`step-${i}`)} active={isSceneActive(`step-${i}`)}>
                            <Fragment key={`step-${i}-${nonceFor(`step-${i}`)}`}>
                                <Scene onSettled={() => i === step && setStepReady(true)} />
                            </Fragment>
                        </SceneWrapper>
                    ) : null,
                )}

                {phase === 'practice' && Array.from({ length: trialIndex + 1 }).map((_, i) => {
                    const t = trials[i]
                    const isCurrent = i === trialIndex
                    const isDone = i < trialIndex || (isCurrent && checked)
                    const correctK = correctOptKey(t)
                    return (
                        <SceneWrapper key={`trial-${i}`} innerRef={sceneRef(`trial-${i}`)} active={isSceneActive(`trial-${i}`)}>
                            <Fragment key={`trial-${i}-${nonceFor(`trial-${i}`)}`}>
                                {i === 0 && (
                                    <div className="w-full flex items-center gap-3" aria-hidden>
                                        <div className="flex-1 h-px bg-[#3A464E]" />
                                        <span className="text-xs font-bold uppercase tracking-wide text-[#5C6B73]">Тренировка</span>
                                        <div className="flex-1 h-px bg-[#3A464E]" />
                                    </div>
                                )}
                                <div className="relative w-full flex items-center justify-center">
                                    <div
                                        className="absolute left-0 top-1/2 -translate-y-1/2 shrink-0 flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                                        style={{
                                            borderColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.55),
                                            backgroundColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.16),
                                            color: GGEGE_PALETTE.purple.button,
                                        }}
                                    >
                                        <span>{i + 1}</span>
                                        <span className="opacity-50 font-normal">/</span>
                                        <span>{trials.length}</span>
                                    </div>
                                    <p className="text-base md:text-lg text-[#F2F7FB] text-center">
                                        {t.kind === 'value' ? 'Выбери значение:' : 'Какой это угол?'}
                                    </p>
                                </div>
                                <DiagramBlock>
                                    <TrialPrompt t={t} />
                                </DiagramBlock>
                                <div className="grid grid-cols-2 gap-3">
                                    {t.options.map((o) => {
                                        const k = optKey(o)
                                        const isWrong = isCurrent && wrongTried.includes(k)
                                        const state = isDone && k === correctK ? 'correct' : isWrong ? 'wrong' : 'idle'
                                        return (
                                            <OptButton
                                                key={k}
                                                o={o}
                                                state={state}
                                                disabled={isDone || isWrong}
                                                onClick={isDone ? undefined : () => handleOptionClick(t, o)}
                                            />
                                        )
                                    })}
                                </div>
                                {isCurrent && !checked && (
                                    wrongFlash ? (
                                        <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-bold w-full justify-center bg-[#DC605B22] text-[#DC605B]">
                                            <X className="w-5 h-5" /> {wrongFlash}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-[#9AA7B0] text-center">Кликни на вариант выше</p>
                                    )
                                )}
                                {isDone && (
                                    <FieryFeedbackBanner fiery={isCurrent && isFieryMilestoneTrial(i)}>
                                        {pickTrialFeedback(t, i)}
                                    </FieryFeedbackBanner>
                                )}
                                {isCurrent && checked && <LocalAnswerConfetti />}
                            </Fragment>
                        </SceneWrapper>
                    )
                })}
            </div>

            {phase === 'intro' ? (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={handleReplay} disabled={advancing} />
                    <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                    <button type="button" onClick={handleIntroNext} disabled={!stepReady || advancing} className={walkthroughButtonClass(stepReady && !advancing)} style={walkthroughButtonStyle(stepReady && !advancing)}>
                        {introNextLabel}
                    </button>
                </div>
            ) : checked ? (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={handleReplay} disabled={advancing} />
                    <BackButton onClick={handleBack} disabled={advancing || !canGoBack} />
                    <button type="button" onClick={handleNextTrial} disabled={advancing} className={walkthroughButtonClass(!advancing)} style={walkthroughButtonStyle(!advancing)}>
                        {trialIndex + 1 >= trials.length ? 'Готово' : trialNextLabel}
                    </button>
                </div>
            ) : null}
        </div>
    )
}
