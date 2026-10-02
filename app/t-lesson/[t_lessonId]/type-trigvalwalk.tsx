// app/t-lesson/[t_lessonId]/type-trigvalwalk.tsx
//
// Разборы по шагам «Таблица 30°, 45°, 60°» (юнит t_unit=18) — два типа на
// одном компоненте:
//   TRIGSCWALK — «Три волшебных угла»: 30/45/60 (+ игра «нажми по порядку»),
//                синус — «лесенка» √1, √2, √3 над 2, косинус — та же
//                лесенка справа налево. Между ними — «Собери паззл»: таблицу
//                углов и синусов заполняют перемешанными кнопками; после
//                косинуса — второй паззл 3×3 с тремя готовыми клетками.
//   TRIGTGWALK — сначала паззл «углы/sin/cos», потом снизу пристыковывается
//                строка tg; по столбцам 30° → 45° → 60° квадратики синуса и
//                косинуса улетают в дробь, результат — в клетку tg;
//                итог: «маленький — 1 — большой».
// Тот же самодостаточный принцип, что у остальных *WALK: компонент сам
// ведёт хореографию, зовёт onAnswer/onComplete один раз в конце; общая
// нижняя кнопка скрыта. После разбора — 6 тренировочных заданий (значение
// по углу / угол по значению), режим «пробуй, пока не угадаешь».

'use client'

import { AlphaVideo } from '@/components/alpha-video'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { LayoutGroup, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionType } from './page'
import {
    TypedLine, DiagramBlock,
    pickWalkthroughNextLabel, pickFunNextLabel, pickWrongTryPhrase, CORRECT_FEEDBACK_PHRASES,
    walkthroughButtonClass, walkthroughButtonStyle, LocalAnswerConfetti,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    isFieryMilestoneTrial, FieryFeedbackBanner,
    useWalkthroughCombo,
} from '@/components/geometry/WalkthroughLog'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { Typewriter } from '@/components/geometry/Typewriter'

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
    tg: [{ num: '1', den: '√3' }, { num: '1' }, { num: '√3' }],
}
const ALL_DISTINCT: V[] = [
    { num: '1', den: '2' }, { num: '√2', den: '2' }, { num: '√3', den: '2' },
    { num: '1', den: '√3' }, { num: '1' }, { num: '√3' },
]
// Значения синуса/косинуса — в уроке про sin/cos только они (тангенс ещё не проходили).
const SINCOS_DISTINCT: V[] = ALL_DISTINCT.slice(0, 3)
const vKey = (v: V) => `${v.num}/${v.den ?? ''}`

// Цвета: каждый угол — свой цвет (как стикеры в интро), строки функций — свой.
const ANGLE_COLOR: Record<number, string> = {
    30: GGEGE_PALETTE.teal.button,
    45: GGEGE_PALETTE.raspberry.button,
    60: GGEGE_PALETTE.purple.button,
}
const FN_COLOR: Record<Fn, string> = {
    sin: GGEGE_PALETTE.blue.button, // как в уроке 490 (оранжевый пользователю не нравится)
    cos: GGEGE_PALETTE.green.button,
    tg: GGEGE_PALETTE.raspberry.button,
}
const ATTENTION = '#F2C35B'

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
const TrigTable = ({ fns, cell, highlight, popAngles }: { fns: Fn[]; cell: (fn: Fn, i: number) => React.ReactNode; highlight?: number; popAngles?: boolean }) => (
    <div className="w-full flex justify-center py-2">
        <div className="grid grid-cols-[3.5rem_repeat(3,minmax(4.5rem,6.5rem))] gap-1.5 text-xl md:text-2xl font-extrabold text-[#F2F7FB]">
            <div />
            {ANGLES.map((a, i) => (
                <div key={a} className="flex h-12 items-center justify-center transition-opacity duration-500" style={{ opacity: highlight === undefined || highlight === i ? 1 : 0.3 }}>
                    {popAngles ? <Pop delay={0.3 + i * 0.7}><AngleSticker a={a} /></Pop> : <AngleSticker a={a} />}
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
const IntroAnglesScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0) // 0 фраза, 1 углы, 2 строка
    return (
        <>
            <TypedBig
                parts={[{ text: 'Запомни ' }, { text: 'ТРИ ВОЛШЕБНЫХ', color: ATTENTION }, { text: ' угла!' }]}
                onDone={() => setPhase(1)}
            />
            {phase >= 1 && (
                <DiagramBlock onSettled={() => setTimeout(() => setPhase(2), 1500)}>
                    <div className="w-full flex items-center justify-center gap-3 py-3">
                        {ANGLES.map((a, i) => (
                            <Pop key={a} delay={0.2 + i * 0.4}>
                                <AngleSticker a={a} big />
                            </Pop>
                        ))}
                    </div>
                </DiagramBlock>
            )}
            {phase >= 2 && <TypedLine className={TEXT} text="Именно в таком порядке: каждый следующий на 15° больше." onSettled={onSettled} />}
        </>
    )
}

// Мини-игра: нажми углы по порядку.
const OrderGameScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [ready, setReady] = useState(false)
    const [order] = useState(() => shuffle([...ANGLES]))
    const [picked, setPicked] = useState<number[]>([])
    const [flash, setFlash] = useState<string | null>(null)
    const done = picked.length === ANGLES.length
    const tap = (a: number) => {
        if (done || picked.includes(a)) return
        if (a === ANGLES[picked.length]) {
            const next = [...picked, a]
            setPicked(next)
            setFlash(null)
            showAnswerMeme(true)
            if (next.length === ANGLES.length) setTimeout(() => onSettled?.(), 900)
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setFlash(pickWrongTryPhrase())
            showAnswerMeme(false)
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

// Крупная фраза с печатанием: сначала печатается целиком белым (Typewriter),
// после печати куски раскрашиваются (parts[].color). onDone — после паузы
// на прочтение.
type BigPart = { text: string; color?: string; className?: string }
const TypedBig = ({ parts, onDone, readMs = 500, slow }: { parts: BigPart[]; onDone?: () => void; readMs?: number; slow?: number }) => {
    const [typed, setTyped] = useState(false)
    return (
        <div className="w-full text-center text-2xl md:text-3xl font-black text-[#F2F7FB]">
            {!typed ? (
                <Typewriter
                    text={parts.map((p) => p.text).join('')}
                    slow={slow}
                    onDone={() => { setTyped(true); setTimeout(() => onDone?.(), readMs) }}
                />
            ) : (
                parts.map((p, i) => (
                    <span key={i} className={p.className} style={p.color ? { color: p.color } : undefined}>{p.text}</span>
                ))
            )}
        </div>
    )
}

// Синус по шагам (по просьбе пользователя, 2026-10-02 — медленнее и с паузами):
// «sin — ЛЕСЕНКА ВВЕРХ √1, √2, √3» → кнопка «Агась» → таблица: по очереди
// 30°, 45°, 60° → числители √1, √2, √3 → «Агась» → «И всё делим на 2» → три двойки.
// Фазы: 0 печать фразы → 1 лесенка → 2 ждём «Агась» → 3 таблица (углы) →
// 4 числители → 5 ждём «Агась» → 6 печать «делим на 2» → 7 двойки → 8 готово.
const AgasButton = ({ onClick, label = 'Агась' }: { onClick: () => void; label?: string }) => (
    <Pop className="w-full max-w-xs">
        <button type="button" onClick={onClick} className={cn(walkthroughButtonClass(true), 'w-full px-8')} style={walkthroughButtonStyle(true)}>
            {label}
        </button>
    </Pop>
)
const SinLadderScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        let t: ReturnType<typeof setTimeout> | undefined
        if (phase === 1) t = setTimeout(() => setPhase(2), 2600) // лесенка проявилась
        if (phase === 3) t = setTimeout(() => setPhase(4), 2800) // углы по очереди
        if (phase === 4) t = setTimeout(() => setPhase(5), 2900) // числители по очереди
        if (phase === 7) t = setTimeout(() => setPhase(8), 2600) // двойки по очереди
        if (phase === 8) t = setTimeout(() => onSettled?.(), 400)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    return (
        <>
            <TypedBig
                parts={[{ text: 'Запомни: ' }, { text: 'sin', color: FN_COLOR.sin }, { text: ' — это ' }, { text: 'ЛЕСЕНКА ВВЕРХ', color: ATTENTION }]}
                onDone={() => setPhase(1)}
                readMs={500}
                slow={1.8}
            />
            {phase >= 1 && (
                <div className="flex items-center justify-center gap-5 text-3xl md:text-4xl font-black" style={{ color: FN_COLOR.sin }}>
                    {['√1', '√2', '√3'].map((n, i) => (
                        <Pop key={n} delay={0.3 + i * 0.7}><Num s={n} /></Pop>
                    ))}
                </div>
            )}
            {phase === 2 && <div className="flex justify-center"><AgasButton onClick={() => setPhase(3)} /></div>}
            {phase >= 3 && (
                <DiagramBlock>
                    <TrigTable
                        fns={['sin']}
                        popAngles
                        cell={(_fn, i) => (
                            <span style={{ color: FN_COLOR.sin }}>
                                <SplitFrac
                                    num={`√${i + 1}`}
                                    den="2"
                                    showNum={phase >= 4}
                                    numDelay={0.3 + i * 0.7}
                                    showDen={phase >= 7}
                                    denDelay={0.3 + i * 0.7}
                                />
                            </span>
                        )}
                    />
                </DiagramBlock>
            )}
            {phase === 5 && <div className="flex justify-center"><AgasButton onClick={() => setPhase(6)} /></div>}
            {phase >= 6 && (
                <TypedBig
                    parts={[{ text: 'И всё делим на ' }, { text: '2', color: FN_COLOR.sin, className: 'text-6xl md:text-7xl align-middle' }]}
                    onDone={() => setPhase(7)}
                    readMs={600}
                    slow={1.8}
                />
            )}
        </>
    )
}

// «Собери паззл»: таблица (строка углов + строки функций), часть клеток
// может быть уже заполнена. Снизу — перемешанные кнопки со значениями
// пустых клеток. Подсвечивается клетка, которую надо заполнить: построчно,
// слева направо. Неверная кнопка — клетка и кнопка вспыхивают красным.
// Одинаковые значения (1/2 у sin 30° и cos 60°) взаимозаменяемы —
// сравниваем по значению, не по конкретной кнопке.
type PuzzleRow = 'angle' | Fn
type PuzzleCell = { row: number; col: number; key: string }
const cellKey = (row: PuzzleRow, col: number) => (row === 'angle' ? `a${ANGLES[col]}` : `v${vKey(VALUES[row][col])}`)
const PUZZLE_WRONG_MS = 700
const CellContent = ({ row, col }: { row: PuzzleRow; col: number }) =>
    row === 'angle' ? <AngleSticker a={ANGLES[col]} /> : <span style={{ color: FN_COLOR[row] }}><ValView v={VALUES[row][col]} /></span>
const TokenView = ({ k }: { k: string }) => {
    if (k.startsWith('a')) return <AngleSticker a={Number(k.slice(1))} />
    const [num, den] = k.slice(1).split('/')
    return <ValView v={{ num, den: den || undefined }} />
}

const TablePuzzleScene = ({ rows, prefilled, subtitle, onSettled, extraRows, footer }: {
    rows: PuzzleRow[]
    prefilled: (r: number, c: number) => boolean
    subtitle: string
    onSettled?: () => void
    // Доп. строки в той же сетке (строка tg «пристыковывается» после сборки).
    extraRows?: React.ReactNode
    // Всё, что идёт под таблицей после сборки (кнопка «Агась», фраза).
    footer?: React.ReactNode
}) => {
    const [titled, setTitled] = useState(false)
    const [ready, setReady] = useState(false)
    // Клетки для заполнения — построчно, слева направо.
    const [targets] = useState<PuzzleCell[]>(() => {
        const out: PuzzleCell[] = []
        rows.forEach((row, r) => ANGLES.forEach((_, c) => { if (!prefilled(r, c)) out.push({ row: r, col: c, key: cellKey(row, c) }) }))
        return out
    })
    const [tokens] = useState(() => shuffle(targets.map((t, i) => ({ id: i, key: t.key }))))
    const [used, setUsed] = useState<number[]>([])
    const [wrongId, setWrongId] = useState<number | null>(null)
    const [wrongNonce, setWrongNonce] = useState(0)
    const filled = used.length
    const done = filled >= targets.length
    const cur = done ? null : targets[filled]
    useEffect(() => {
        if (wrongId === null) return
        const t = setTimeout(() => setWrongId(null), PUZZLE_WRONG_MS)
        return () => clearTimeout(t)
    }, [wrongId, wrongNonce])
    const tap = (tok: { id: number; key: string }) => {
        if (done || !cur) return
        if (tok.key === cur.key) {
            const next = [...used, tok.id]
            setUsed(next)
            setWrongId(null)
            showAnswerMeme(true)
            if (next.length >= targets.length) setTimeout(() => onSettled?.(), 1000)
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setWrongId(tok.id)
            setWrongNonce((n) => n + 1)
            showAnswerMeme(false)
        }
    }
    const targetIndex = (r: number, c: number) => targets.findIndex((t) => t.row === r && t.col === c)
    const cellStyle = (r: number, c: number, color: string): React.CSSProperties => {
        const ti = targetIndex(r, c)
        const isFilled = ti === -1 || ti < filled
        const isCur = cur?.row === r && cur?.col === c
        const isWrong = isCur && wrongId !== null
        const c2 = isWrong ? '#DC605B' : isCur ? ATTENTION : color
        return {
            borderColor: isFilled ? hexToRgba(color, 0.55) : isCur ? c2 : '#3A464E',
            borderStyle: isFilled ? 'solid' : 'dashed',
            backgroundColor: isWrong ? hexToRgba('#DC605B', 0.2) : isCur ? hexToRgba(ATTENTION, 0.14) : isFilled ? hexToRgba(color, 0.08) : 'transparent',
            boxShadow: isCur ? `0 0 14px ${hexToRgba(c2, 0.5)}` : undefined,
            opacity: done || !cur || cur.row === r ? 1 : 0.45,
        }
    }
    const renderCell = (r: number, c: number) => {
        const row = rows[r]
        const color = row === 'angle' ? ANGLE_COLOR[ANGLES[c]] : FN_COLOR[row]
        const ti = targetIndex(r, c)
        const isCur = cur?.row === r && cur?.col === c
        // Текущая клетка мягко «дышит» (обёртка, т.к. transform самой клетки
        // занят тряской framer-motion).
        return (
            <div className={cn('relative', isCur && wrongId === null && 'animate-puzzle-cell-pulse')}>
            <motion.div
                key={`${r}-${c}-${isCur ? wrongNonce : 0}`}
                animate={isCur && wrongId !== null ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.35 }}
                className={cn('flex items-center justify-center rounded-xl border-2 transition-[opacity,background-color,border-color] duration-300', row === 'angle' ? 'h-12' : 'h-20')}
                style={cellStyle(r, c, color)}
            >
                {ti === -1 ? <CellContent row={row} col={c} /> : ti < filled ? <Pop><CellContent row={row} col={c} /></Pop> : null}
            </motion.div>
            </div>
        )
    }
    return (
        <>
            <TypedBig parts={[{ text: 'Собери паззл!' }]} onDone={() => setTitled(true)} readMs={200} />
            {titled && <TypedLine className={TEXT} text={subtitle} onSettled={() => setReady(true)} delayAfter={200} />}
            {ready && (
                <DiagramBlock>
                    <div className="w-full flex flex-col items-center gap-5 py-2">
                        <div className="grid grid-cols-[3.5rem_repeat(3,minmax(4.5rem,6.5rem))] gap-1.5 text-xl md:text-2xl font-extrabold text-[#F2F7FB]">
                            {rows.map((row, r) => (
                                <Fragment key={r}>
                                    {row === 'angle' ? <div /> : (
                                        <div
                                            className="flex items-center justify-center text-lg md:text-xl font-black transition-opacity duration-300"
                                            style={{ color: FN_COLOR[row], opacity: done || !cur || cur.row === r ? 1 : 0.45 }}
                                        >
                                            {row}
                                        </div>
                                    )}
                                    {ANGLES.map((_, c) => <Fragment key={c}>{renderCell(r, c)}</Fragment>)}
                                </Fragment>
                            ))}
                            {done && extraRows}
                        </div>
                        {!done && (
                            <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                                {tokens.map((tok) => {
                                    const isUsed = used.includes(tok.id)
                                    const isWrong = wrongId === tok.id
                                    return (
                                        <button
                                            key={tok.id}
                                            type="button"
                                            onClick={() => tap(tok)}
                                            disabled={isUsed}
                                            className={cn(
                                                'flex min-h-[72px] items-center justify-center rounded-xl border-2 text-xl md:text-2xl font-extrabold transition-[opacity,border-color,background-color] duration-200',
                                                isUsed && 'opacity-0 pointer-events-none',
                                                isWrong ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]',
                                            )}
                                        >
                                            <TokenView k={tok.key} />
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                        {done && <p className="text-lg font-black text-[#A1D151]">Таблица собрана!</p>}
                        {done && footer}
                    </div>
                    {done && <LocalAnswerConfetti />}
                </DiagramBlock>
            )}
        </>
    )
}

// Паззл 1: пустая таблица углов и синусов.
const SinPuzzleScene = ({ onSettled }: { onSettled?: () => void }) => (
    <TablePuzzleScene rows={['angle', 'sin']} prefilled={() => false} subtitle="Заполни таблицу: сначала углы, потом синусы — слева направо." onSettled={onSettled} />
)

// Паззл 2: таблица 3×3 (углы, sin, cos), 3 клетки уже стоят — по одной в
// каждой строке и все в разных столбцах (случайная перестановка столбцов).
const FullPuzzleScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [perm] = useState(() => shuffle([0, 1, 2]))
    return (
        <TablePuzzleScene
            rows={['angle', 'sin', 'cos']}
            prefilled={(r, c) => perm[r] === c}
            subtitle="Теперь вся таблица! Часть клеток уже на месте — заполни остальные."
            onSettled={onSettled}
        />
    )
}

// Косинус: «зеркало». Копии значений из строки синуса (оранжевые) вылетают
// вниз в строку косинуса и приземляются в ЗЕРКАЛЬНЫЕ ячейки — первая в
// последнюю, последняя в первую, пути перекрещиваются «Х». При посадке
// значение перекрашивается из цвета sin в цвет cos.
const FLIGHT_S = 1.5
const FLIGHT_STAGGER_S = 0.18
const CosMirrorScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0) // 0 таблица, 1 печать фразы, 2 полёт копий, 4 готово
    const wrapRef = useRef<HTMLDivElement>(null)
    // Смещение «из ячейки sin-(2−i) в ячейку cos-i» (центр к центру), px.
    const [deltas, setDeltas] = useState<{ dx: number; dy: number }[] | null>(null)
    useEffect(() => {
        if (phase !== 2) return
        const wrap = wrapRef.current
        if (!wrap) return
        const center = (sel: string) => {
            const el = wrap.querySelector(sel)
            if (!el) return null
            const r = el.getBoundingClientRect()
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
        }
        const next: { dx: number; dy: number }[] = []
        for (let i = 0; i < 3; i++) {
            const from = center(`[data-cell="sin-${2 - i}"]`)
            const to = center(`[data-cell="cos-${i}"]`)
            if (!from || !to) return
            next.push({ dx: from.x - to.x, dy: from.y - to.y })
        }
        setDeltas(next)
        const t = setTimeout(() => setPhase(4), (FLIGHT_S + FLIGHT_STAGGER_S * 2) * 1000 + 300)
        return () => clearTimeout(t)
    }, [phase])
    useEffect(() => {
        if (phase === 4) {
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
                                ) : deltas ? (
                                    // Центральная (45°) летит прямо вниз, крайние — дугой в разные стороны,
                                    // чтобы не наезжать друг на друга в середине пути.
                                    <motion.span
                                        className="relative z-10 inline-flex"
                                        initial={{ x: deltas[i].dx, y: deltas[i].dy, color: FN_COLOR.sin }}
                                        animate={{
                                            x: 0,
                                            y: i === 1 ? 0 : [deltas[i].dy, deltas[i].dy / 2 + (i === 0 ? -30 : 30), 0],
                                            color: FN_COLOR.cos,
                                        }}
                                        transition={{ duration: FLIGHT_S, delay: i * FLIGHT_STAGGER_S, ease: 'easeInOut' }}
                                    >
                                        <ValView v={VALUES.cos[i]} />
                                    </motion.span>
                                ) : null}
                            </span>
                        )}
                    />
                </div>
            </DiagramBlock>
            {phase >= 1 && (
                <TypedBig
                    parts={[{ text: 'Косинус', color: FN_COLOR.cos }, { text: ' — та же лесенка, только ' }, { text: 'НАОБОРОТ', color: ATTENTION }]}
                    onDone={() => setPhase((p) => Math.max(p, 2))}
                    readMs={600}
                />
            )}
            {phase >= 4 && <LocalAnswerConfetti />}
        </>
    )
}

// ===== Сцены «тангенс» =====
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

// ===== Тангенс по-новому (2026-10-02, сценарий пользователя) =====
// 1) Собираем таблицу углы/sin/cos (тот же паззл, что в уроке 488) →
//    «Агась» → снизу «пристыковывается» строка tg с пустыми клетками →
//    «А чему равен тангенс?».
// 2) По столбцам 30° → 45° → 60°: остальные столбцы приглушены; в клетке
//    tg 30° — Траволта (озирается: где тангенс?). Квадратик синуса
//    улетает из таблицы в числитель дроби, косинуса — в знаменатель,
//    «= результат», результат обводится и улетает в клетку tg
//    (общий layoutId — framer сам ведёт элемент между местами).
const TG = FN_COLOR.tg

const TgDockRow = ({ travolta }: { travolta?: boolean }) => (
    <>
        <motion.div
            initial={{ y: 280, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 11 }}
            className="flex items-center justify-center text-lg md:text-xl font-black"
            style={{ color: TG }}
        >
            tg
        </motion.div>
        {ANGLES.map((a, c) => (
            <motion.div
                key={a}
                initial={{ y: 280, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 150, damping: 11, delay: 0.04 * (c + 1) }}
                className="flex h-20 items-center justify-center rounded-xl border-2"
                style={{ borderColor: hexToRgba(TG, 0.6), borderStyle: 'dashed', backgroundColor: hexToRgba(TG, 0.06) }}
            >
                {travolta && c === 0 && (
                    <Pop>
                        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                        <video src="/video/travolta-confused.mp4" autoPlay loop muted playsInline className="h-[72px] w-[72px] max-w-none shrink-0 rounded-lg object-cover" />
                    </Pop>
                )}
            </motion.div>
        ))}
    </>
)

const TgBuildScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [perm] = useState(() => shuffle([0, 1, 2]))
    const [phase, setPhase] = useState(0) // 0 паззл, 1 ждём «Агась», 2 стыковка, 3 вопрос, 4 Траволта в tg 30°
    useEffect(() => {
        if (phase !== 2) return
        const t = setTimeout(() => setPhase(3), 1500)
        return () => clearTimeout(t)
    }, [phase])
    return (
        <TablePuzzleScene
            rows={['angle', 'sin', 'cos']}
            prefilled={(r, c) => perm[r] === c}
            subtitle="Сначала соберём знакомую таблицу: углы, синусы и косинусы."
            onSettled={() => setPhase((p) => Math.max(p, 1))}
            extraRows={phase >= 2 ? <TgDockRow travolta={phase >= 4} /> : null}
            footer={
                phase === 1 ? (
                    <AgasButton onClick={() => setPhase(2)} />
                ) : phase >= 3 ? (
                    <TypedBig
                        parts={[{ text: 'А чему равен ' }, { text: 'тангенс', color: TG }, { text: '?' }]}
                        onDone={() => { setPhase(4); setTimeout(() => onSettled?.(), 1200) }}
                        readMs={400}
                    />
                ) : null
            }
        />
    )
}

// Значение в рамке-квадратике (именно он «летает»).
const ValBox = ({ v, color, framed = false }: { v: V; color: string; framed?: boolean }) => (
    <span
        className="inline-flex items-center justify-center rounded-lg border-2 px-1.5 py-1 transition-colors duration-500"
        style={{ color, borderColor: framed ? color : 'transparent', backgroundColor: framed ? hexToRgba(color, 0.14) : 'transparent' }}
    >
        <ValView v={v} />
    </span>
)
const FLY = { type: 'spring' as const, stiffness: 120, damping: 16 }
const Slot = () => <span className="inline-flex h-14 w-16 rounded-lg border-2 border-dashed border-[#3A464E]" />

// Обводка «фломастером» + стикер-подпись над ней («берём синус»).
const MARKER_PATH = 'M 86 24 C 66 0, 16 4, 7 44 C 0 86, 58 102, 90 80 C 104 64, 99 34, 72 18'
const MarkerCircle = ({ label, color, labelDelay = 1.6 }: { label: string; color: string; labelDelay?: number }) => (
    <>
        <svg className="pointer-events-none absolute -inset-3 z-10 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: 'calc(100% + 24px)', height: 'calc(100% + 24px)' }}>
            <motion.path
                d={MARKER_PATH}
                fill="none"
                stroke={ATTENTION}
                strokeWidth={4}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.7, ease: 'easeInOut' }}
            />
        </svg>
        <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 whitespace-nowrap">
            <Pop delay={labelDelay}>
                <span className="rounded-lg border-2 px-2 py-0.5 text-sm md:text-base font-black" style={{ borderColor: color, backgroundColor: '#161F23', color }}>
                    {label}
                </span>
            </Pop>
        </span>
    </>
)

const TgColumnFlyScene = ({ i, travolta, intro, introFrac, fast, calc = 'calculating', onSettled, active = true }: {
    i: number
    travolta?: boolean
    intro?: BigPart[]
    // Вместо фразы — «Тангенс = синус / косинус» дробью.
    introFrac?: boolean
    // Уже понятно, что делаем: без кнопок и с короткими паузами.
    fast?: boolean
    // Видео во время вычисления: calculating (с подписью «считаем...») или calculating2 (без подписи, зеркально).
    calc?: 'calculating' | 'calculating2'
    onSettled?: () => void
    // Сцена текущая (Траволта танцует, пока не нажали «Дальше»).
    active?: boolean
}) => {
    // 0 таблица, 1 фраза, 2 ждём «Агась», 3 формула + обводка синуса,
    // 4 синус летит в числитель, 5 ждём «Ок», 6 обводка косинуса,
    // 7 косинус летит в знаменатель, 8 ждём «Ок», 9 «=» + видео calculating,
    // 10 результат (дальше — рамка 11, полёт 12, готово 13)
    // 10 рамка, 11 результат летит в таблицу, 12 вывод
    const [phase, setPhase] = useState(0)
    useEffect(() => {
        // 3/6: обводка (0.7 с) → пауза → стикер (1.6 с) → пауза → падение.
        const next: Record<number, number> = fast
            ? { 3: 2200, 4: 1000, 5: 500, 6: 2200, 7: 1000, 8: 400, 10: 800, 11: 900, 12: 1200 }
            : { 3: 3600, 4: 1300, 5: 1000, 6: 3600, 7: 1300, 10: 1100, 11: 1200, 12: 1400 }
        if (!(phase in next)) return
        const t = setTimeout(() => setPhase(phase + 1), next[phase])
        return () => clearTimeout(t)
    }, [phase])
    const sinId = `tg-sin-${i}`
    const cosId = `tg-cos-${i}`
    const resId = `tg-res-${i}`
    useEffect(() => {
        if (phase !== 13) return
        const t = setTimeout(() => onSettled?.(), 900)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    // Дробь «Тангенс = синус / косинус»: части появляются по очереди.
    useEffect(() => {
        if (phase !== 1 || !introFrac) return
        const t = setTimeout(() => setPhase((p) => Math.max(p, fast ? 3 : 2)), fast ? 2000 : 2400)
        return () => clearTimeout(t)
    }, [phase, introFrac, fast])
    // Зумерские подписи вместо «Ок» — новая на каждую кнопку.
    const okLabel = useMemo(() => pickFunNextLabel(), [phase])
    // Страховка, если видео calculating не доиграет.
    useEffect(() => {
        if (phase !== 9) return
        const t = setTimeout(() => setPhase((p) => Math.max(p, 10)), 9000)
        return () => clearTimeout(t)
    }, [phase])
    const sinFlown = phase >= 4
    const cosFlown = phase >= 7
    return (
        <LayoutGroup id={`tg-col-${i}`}>
            <DiagramBlock onSettled={() => setTimeout(() => setPhase((p) => Math.max(p, 1)), 600)}>
                <div className="w-full flex flex-col items-center pt-6">
                    <TrigTable
                        fns={['sin', 'cos', 'tg']}
                        highlight={i}
                        cell={(fn, j) => {
                            if (fn === 'sin' || fn === 'cos') {
                                if (j !== i) return <span style={{ color: FN_COLOR[fn] }}><ValView v={VALUES[fn][j]} /></span>
                                const flown = fn === 'sin' ? sinFlown : cosFlown
                                const circled = fn === 'sin' ? phase === 3 : phase === 6
                                return flown ? null : (
                                    <motion.span layoutId={fn === 'sin' ? sinId : cosId} transition={FLY} className="relative inline-flex">
                                        <ValBox v={VALUES[fn][j]} color={FN_COLOR[fn]} />
                                        {circled && <MarkerCircle label={fn === 'sin' ? 'берём синус' : 'берём косинус'} color={FN_COLOR[fn]} labelDelay={fast ? 0.8 : 1.6} />}
                                    </motion.span>
                                )
                            }
                            if (j < i) return <span style={{ color: TG }}><ValView v={VALUES.tg[j]} /></span>
                            if (j > i) return null
                            if (phase >= 12) {
                                return (
                                    <span className="relative inline-flex">
                                        <motion.span layoutId={resId} transition={FLY} className="inline-flex">
                                            <ValBox v={VALUES.tg[i]} color={TG} />
                                        </motion.span>
                                        {travolta && phase >= 13 && active && (
                                            <span className="pointer-events-none absolute left-full top-1/2 ml-4 h-[84px] w-[84px] -translate-y-1/2">
                                                <Pop>
                                                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                                                    <AlphaVideo src="/video/travolta-dancing.webm" autoPlay loop muted playsInline className="h-[84px] w-[84px] max-w-none shrink-0 rounded-lg object-cover" />
                                                </Pop>
                                            </span>
                                        )}
                                    </span>
                                )
                            }
                            return null
                        }}
                    />
                </div>
            </DiagramBlock>
            {phase >= 1 && introFrac && (
                <div className="w-full flex items-center justify-center gap-3 text-2xl md:text-3xl font-black text-[#F2F7FB]">
                    <Pop><span style={{ color: TG }}>Тангенс</span></Pop>
                    <Pop delay={0.4}><span>=</span></Pop>
                    <span className="inline-flex flex-col items-center gap-1">
                        <Pop delay={0.8}><span style={{ color: FN_COLOR.sin }}>синус</span></Pop>
                        <Pop delay={1.1}><span className="h-[3px] w-28 rounded-full bg-[#F2F7FB]" /></Pop>
                        <Pop delay={1.4}><span style={{ color: FN_COLOR.cos }}>косинус</span></Pop>
                    </span>
                </div>
            )}
            {phase >= 1 && !introFrac && intro && <TypedBig parts={intro} onDone={() => setPhase((p) => Math.max(p, 2))} readMs={300} />}
            {phase === 2 && <div className="flex justify-center"><AgasButton onClick={() => setPhase(3)} /></div>}
            {phase >= 3 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full flex items-center justify-center gap-3 text-2xl md:text-3xl font-extrabold text-[#F2F7FB] py-2"
                >
                    <span style={{ color: TG }}>tg</span>
                    <AngleSticker a={ANGLES[i]} />
                    <span>=</span>
                    <span className="inline-flex flex-col items-center gap-1.5">
                        {sinFlown ? (
                            <motion.span layoutId={sinId} transition={FLY} className="inline-flex">
                                <ValBox v={VALUES.sin[i]} color={FN_COLOR.sin} />
                            </motion.span>
                        ) : <Slot />}
                        <span className="h-[3px] w-24 rounded-full bg-[#F2F7FB]" />
                        {cosFlown ? (
                            <motion.span layoutId={cosId} transition={FLY} className="inline-flex">
                                <ValBox v={VALUES.cos[i]} color={FN_COLOR.cos} />
                            </motion.span>
                        ) : <Slot />}
                    </span>
                    {phase >= 9 && <Pop><span>=</span></Pop>}
                    {phase === 9 && (
                        <Pop className="flex-col items-center gap-1">
                            {calc === 'calculating' && <span className="text-base md:text-lg font-black text-[#F2C35B]">считаем...</span>}
                            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                            <video
                                src={`/video/${calc}.mp4`}
                                autoPlay
                                muted
                                playsInline
                                onEnded={() => setPhase((p) => Math.max(p, 10))}
                                // calculating2 — зеркально по горизонтали.
                                className={cn('max-w-none shrink-0 rounded-lg object-cover', calc === 'calculating2' ? 'h-28 w-[130px] -scale-x-100' : 'h-24 w-[170px]')}
                            />
                        </Pop>
                    )}
                    {phase >= 10 && phase < 12 && (
                        <motion.span
                            layoutId={resId}
                            transition={FLY}
                            initial={{ scale: 2.4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative inline-flex"
                        >
                            <ValBox v={VALUES.tg[i]} color={TG} />
                            {phase === 11 && (
                                <svg className="pointer-events-none absolute -inset-3 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: 'calc(100% + 24px)', height: 'calc(100% + 24px)' }}>
                                    <motion.path d={MARKER_PATH} fill="none" stroke={ATTENTION} strokeWidth={4} strokeLinecap="round" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7 }} />
                                </svg>
                            )}
                        </motion.span>
                    )}
                    {phase >= 12 && <span className="opacity-30" style={{ color: TG }}><ValView v={VALUES.tg[i]} /></span>}
                </motion.div>
            )}
            {phase === 8 && !fast && (
                <div className="flex justify-center"><AgasButton label={okLabel} onClick={() => setPhase(phase + 1)} /></div>
            )}
            {phase >= 13 && <LocalAnswerConfetti />}
        </LayoutGroup>
    )
}


// 60°: стрелка от tg 30° к tg 60° с подписью «переверни» → √3 в tg 60° →
// по таблице пробегает блик → «ГОТОВО!» и справа «Осталось запомнить» + Дикаприо.
const TgFlipFinishScene = ({ onSettled }: { onSettled?: () => void }) => {
    const [phase, setPhase] = useState(0) // 0 таблица, 1 стрелка, 2 √3, 3 блик, 4 ГОТОВО
    const wrapRef = useRef<HTMLDivElement>(null)
    const [arrow, setArrow] = useState<{ x1: number; x2: number; y: number } | null>(null)
    useEffect(() => {
        const next: Record<number, number> = { 1: 1800, 2: 1300, 3: 1200, 4: 1800 }
        if (!(phase in next)) return
        const t = setTimeout(() => (phase === 4 ? onSettled?.() : setPhase(phase + 1)), next[phase])
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])
    useEffect(() => {
        if (phase !== 1) return
        const w = wrapRef.current
        const a = w?.querySelector('[data-cell="tg-0"]')
        const b = w?.querySelector('[data-cell="tg-2"]')
        if (!w || !a || !b) return
        const wr = w.getBoundingClientRect()
        const ar = a.getBoundingClientRect()
        const br = b.getBoundingClientRect()
        setArrow({ x1: ar.left + ar.width / 2 - wr.left, x2: br.left + br.width / 2 - wr.left, y: ar.bottom - wr.top + 4 })
    }, [phase])
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(() => setPhase((p) => Math.max(p, 1)), 600)}>
                <div ref={wrapRef} className="relative w-full pb-14">
                    <TrigTable
                        fns={['sin', 'cos', 'tg']}
                        cell={(fn, j) =>
                            fn !== 'tg' ? (
                                <span style={{ color: FN_COLOR[fn] }}><ValView v={VALUES[fn][j]} /></span>
                            ) : j < 2 ? (
                                <span style={{ color: TG }}><ValView v={VALUES.tg[j]} /></span>
                            ) : phase >= 2 ? (
                                <Pop><span style={{ color: TG }}><ValView v={VALUES.tg[2]} /></span></Pop>
                            ) : null
                        }
                    />
                    {phase >= 1 && arrow && (
                        <>
                            <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                                <motion.path
                                    d={`M ${arrow.x1} ${arrow.y} Q ${(arrow.x1 + arrow.x2) / 2} ${arrow.y + 46} ${arrow.x2} ${arrow.y}`}
                                    fill="none"
                                    stroke={ATTENTION}
                                    strokeWidth={4}
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                                />
                                {/* Кончик дорисовывается ПОСЛЕ дуги — по касательной в конце кривой. */}
                                <g transform={`translate(${arrow.x2} ${arrow.y}) rotate(${(Math.atan2(-46, (arrow.x2 - arrow.x1) / 2) * 180) / Math.PI})`}>
                                    <motion.path
                                        d="M -12 -8 L 2 0 L -12 8 z"
                                        fill={ATTENTION}
                                        stroke={ATTENTION}
                                        strokeWidth={2}
                                        strokeLinejoin="round"
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.75, type: 'spring', stiffness: 500, damping: 18 }}
                                    />
                                </g>
                            </svg>
                            <span
                                className="pointer-events-none absolute -translate-x-1/2"
                                style={{ left: (arrow.x1 + arrow.x2) / 2, top: arrow.y + 28 }}
                            >
                                <Pop delay={0.7}>
                                    <span className="text-lg md:text-xl font-black" style={{ color: ATTENTION }}>переверни</span>
                                </Pop>
                            </span>
                        </>
                    )}
                    {/* Блик: светлая диагональная полоса слева направо по всей таблице. */}
                    {phase >= 3 && (
                        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                            <motion.div
                                className="absolute inset-y-0 w-1/4"
                                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)', skewX: -20 }}
                                initial={{ left: '-30%' }}
                                animate={{ left: '120%' }}
                                transition={{ duration: 1, ease: 'easeInOut' }}
                            />
                        </div>
                    )}
                </div>
            </DiagramBlock>
            {phase >= 4 && (
                <div className="w-full flex items-center justify-center gap-5">
                    <Pop><span className="text-4xl md:text-5xl font-black text-[#A1D151]">ГОТОВО!</span></Pop>
                    <Pop delay={0.5} className="flex-col items-center gap-1">
                        <span className="text-base md:text-lg font-black text-[#F2F7FB]">Осталось запомнить</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/lesson-pics/dicaprio-point.webp" alt="" className="h-28 w-28 object-contain" draggable={false} />
                    </Pop>
                </div>
            )}
            {phase >= 4 && <LocalAnswerConfetti />}
        </>
    )
}

// ===== Тренировка =====
type Opt = { kind: 'val'; v: V } | { kind: 'ang'; a: number }
type Trial =
    | { kind: 'value'; fn: Fn; ai: number; options: Opt[] }
    | { kind: 'angle'; fn: Fn; ai: number; options: Opt[] }

const optKey = (o: Opt) => (o.kind === 'val' ? `v:${vKey(o.v)}` : `a:${o.a}`)

const makeValueTrial = (fn: Fn, ai: number, mode: Mode): Trial => {
    const correct = VALUES[fn][ai]
    // Урок про sin/cos: ровно 3 варианта — 1/2, √2/2, √3/2 (без значений тангенса).
    if (mode === 'sincos') {
        return { kind: 'value', fn, ai, options: shuffle(SINCOS_DISTINCT).map((v) => ({ kind: 'val', v } as Opt)) }
    }
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
            t = kinds[i] === 'value' ? makeValueTrial(fn, ai, mode) : makeAngleTrial(fn, ai)
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
                ? [IntroAnglesScene, OrderGameScene, SinLadderScene, SinPuzzleScene, CosMirrorScene, FullPuzzleScene]
                : [
                    TgBuildScene,
                    (p: { onSettled?: () => void; active?: boolean }) => (
                        <TgColumnFlyScene
                            i={0}
                            travolta
                            introFrac
                            {...p}
                        />
                    ),
                    (p: { onSettled?: () => void; active?: boolean }) => (
                        <TgColumnFlyScene
                            i={1}
                            introFrac
                            fast
                            calc="calculating2"
                            {...p}
                        />
                    ),
                    TgFlipFinishScene,
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
    const registerCombo = useWalkthroughCombo()
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)

    const [introNextLabel, setIntroNextLabel] = useState('Дальше')
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    useEffect(() => { setIntroNextLabel(pickWalkthroughNextLabel('Дальше')) }, [step])

    const handleOptionClick = (t: Trial, o: Opt) => {
        if (checked) return
        const k = optKey(o)
        if (wrongTried.includes(k)) return
        if (k === correctOptKey(t)) {
            registerCombo(wrongTried.length === 0)
            showAnswerMeme(true)
            setChecked(true)
            setTrialNextLabel(pickWalkthroughNextLabel('Дальше'))
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setHadMistake(true)
            showAnswerMeme(false)
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
                                {(() => {
                                    const S = Scene as React.ComponentType<{ onSettled?: () => void; active?: boolean }>
                                    return <S onSettled={() => i === step && setStepReady(true)} active={phase === 'intro' && i === step} />
                                })()}
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
