'use client'

// components/ege-diagnostic-v3.tsx
//
// Диагностика «База в уме» в новом, премиальном виде (проба — /test-diagnostic-v3). Задания и проверка —
// те же, что в components/ege-diagnostic-v2.tsx (TASKS); поменян только вид: тёмный фон со свечением в
// цветах логотипа, Мигель на вступлении и в реакциях, сегментный прогресс, кольцо таймера, стеклянные
// карточки, объёмные кнопки с бликом, итог с кольцом результата. Пока ничего не сохраняет (save — как у v2).

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css'
import { Brain, Timer, HelpCircle, Check, X, Hourglass, Sparkles, Target } from 'lucide-react'
import { KeyboardInput } from '@/app/lesson/keyboard-input'
import { FormulaAssemble } from '@/components/geometry/FormulaAssemble'
import { PlanBuildModal } from '@/components/plan-build-modal'
import { TASKS, norm, type Result, type Status, type Task } from '@/components/ege-diagnostic-v2'
import type { DiagResult } from '@/lib/egeDiagnostic'

const SECONDS = 60
const GREEN = '#A1D151'
const RED = '#DC605B'
const TEXT = '#F2F7FB'
const MUTED = '#9AA7B0'
const VIOLET = '#A74CE8' // фиолетовый логотипа
const LEAF = '#22A22F' // зелёный логотипа
const GOLD = '#F2C35B'
const BLUE = '#53ADEF'

const glass = { background: 'linear-gradient(180deg, #1B262C, #141D22)', boxShadow: 'inset 0 0 0 1px #ffffff12, 0 10px 30px -12px #000c' } as const

type SaveFn = (rows: Result[]) => Promise<DiagResult | { error: string }>

/** Фон страницы: тёмный, мягкие пятна цветов логотипа и виньетка (без filter: blur — дёшево на iPhone). */
function Backdrop() {
    return (
        <div className="pointer-events-none fixed inset-0 -z-10" style={{
            background: `radial-gradient(60% 40% at 15% 0%, ${VIOLET}33, transparent 70%),
                radial-gradient(55% 40% at 100% 20%, ${LEAF}26, transparent 70%),
                radial-gradient(80% 60% at 50% 110%, ${BLUE}1f, transparent 70%), #0E151A`,
        }} />
    )
}

/** Объёмная кнопка с бликом: цветная плашка + нижняя грань (стандарт нажатия — грань исчезает). */
function PremiumButton({ onClick, disabled, color = GREEN, edge = '#6E9A2E', text = '#11190A', children, className = '' }: {
    onClick: () => void; disabled?: boolean; color?: string; edge?: string; text?: string; children: React.ReactNode; className?: string
}) {
    return (
        <button type="button" onClick={onClick} disabled={disabled}
            className={`animate-shine-sweep rounded-2xl border-b-4 py-3.5 text-base font-black uppercase tracking-wide active:border-b-0 disabled:opacity-40 ${className}`}
            style={{ background: `linear-gradient(180deg, ${color}, ${color}DD)`, borderBottomColor: edge, color: text, boxShadow: disabled ? undefined : `0 0 22px -6px ${color}` }}>
            {children}
        </button>
    )
}

function NotKnowButton({ onClick, disabled, wide }: { onClick: () => void; disabled: boolean; wide?: boolean }) {
    return (
        <button type="button" onClick={onClick} disabled={disabled}
            className={`${wide ? 'w-full' : 'shrink-0 px-4'} flex items-center justify-center gap-1.5 rounded-2xl border-b-4 py-3 text-sm font-black active:border-b-0 disabled:opacity-40`}
            style={{ background: '#ffffff0d', borderBottomColor: '#0A0F12', color: '#C9D3D9', boxShadow: 'inset 0 0 0 1px #ffffff1a' }}>
            <HelpCircle className="h-4 w-4" style={{ color: VIOLET }} /> Пока не знаю
        </button>
    )
}

export const EgeDiagnosticV3 = ({ save }: { save?: SaveFn } = {}) => {
    const [phase, setPhase] = useState<'intro' | 'count' | 'quiz' | 'done'>('intro')
    const [count, setCount] = useState(3)
    const [index, setIndex] = useState(0)
    const [results, setResults] = useState<Result[]>([])
    const [result, setResult] = useState<DiagResult | null>(null)
    const [saveError, setSaveError] = useState<string | null>(null)
    const savedRef = useRef(false)

    useEffect(() => {
        if (phase !== 'done' || !save || savedRef.current) return
        savedRef.current = true
        save(results).then((r) => ('error' in r ? setSaveError(r.error) : setResult(r))).catch(() => setSaveError('Не получилось сохранить'))
    }, [phase, save, results])

    useEffect(() => {
        if (phase !== 'count') return
        if (count === 0) { const t = setTimeout(() => setPhase('quiz'), 500); return () => clearTimeout(t) }
        const t = setTimeout(() => setCount((c) => c - 1), 800)
        return () => clearTimeout(t)
    }, [phase, count])

    const record = (rows: Result[]) => {
        setResults((r) => [...r, ...rows])
        if (index + 1 >= TASKS.length) setPhase('done')
        else setIndex((i) => i + 1)
    }

    return (
        <>
            <Backdrop />
            {phase === 'intro' && <Intro onStart={() => { setCount(3); setPhase('count') }} />}
            {phase === 'count' && (
                <div className="flex min-h-[100dvh] items-center justify-center">
                    <div className="relative flex h-48 w-48 items-center justify-center">
                        <motion.span key={`ring-${count}`} initial={{ scale: 0.6, opacity: 0.9 }} animate={{ scale: 1.6, opacity: 0 }} transition={{ duration: 0.8 }}
                            className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 0 3px ${count === 0 ? GREEN : GOLD}` }} />
                        <motion.p key={count} initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                            className="text-8xl font-black" style={{ color: count === 0 ? GREEN : GOLD, textShadow: `0 0 30px ${count === 0 ? GREEN : GOLD}88` }}>
                            {count === 0 ? 'Го!' : count}
                        </motion.p>
                    </div>
                </div>
            )}
            {phase === 'quiz' && <TaskScreen key={TASKS[index].id} task={TASKS[index]} index={index} total={TASKS.length} results={results} onDone={record} />}
            {phase === 'done' && <ResultsView results={results} result={result} saving={!!save && !result && !saveError} saveError={saveError} testMode={!save} />}
        </>
    )
}

function Intro({ onStart }: { onStart: () => void }) {
    const points = [
        { icon: <Brain className="h-5 w-5" />, color: VIOLET, title: 'Всё в уме', text: 'Без черновика — проверяем, что уже сидит в голове' },
        { icon: <HelpCircle className="h-5 w-5" />, color: BLUE, title: '«Пока не знаю» — норм', text: 'Честный ответ лучше угадывания. Чего не знаешь — научу' },
        { icon: <Timer className="h-5 w-5" />, color: GOLD, title: '60 секунд на задачу', text: `${TASKS.length} заданий — примерно 15 минут` },
    ]
    return (
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-6 pt-6">
            <div className="relative mx-auto mt-2 h-40 w-40">
                <div className="absolute inset-3 rounded-full" style={{ background: `radial-gradient(circle, ${VIOLET}55, transparent 70%)` }} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <motion.img src="/miguel/miguel-think.webp" alt="Команданте Мигель" className="relative h-full w-full object-contain"
                    initial={{ y: 30, opacity: 0, scale: 0.8 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.45 }} />
            </div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest" style={{ background: `${GOLD}1f`, color: GOLD }}>
                    <Target className="h-3.5 w-3.5" /> Старт пути к ЕГЭ
                </span>
                <h1 className="mt-3 text-3xl font-black leading-tight text-[#F2F7FB]">
                    Узнай свой балл<br />
                    <span style={{ background: `linear-gradient(90deg, ${VIOLET}, ${BLUE}, ${LEAF})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>за 15 минут</span>
                </h1>
                <p className="mt-2 text-sm font-bold" style={{ color: MUTED }}>Команданте посмотрит, что ты уже знаешь, и построит план</p>
            </motion.div>
            <div className="mt-5 flex flex-col gap-2.5">
                {points.map((p, i) => (
                    <motion.div key={p.title} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.12 }}
                        className="flex items-center gap-3 rounded-2xl p-3" style={glass}>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${p.color}26`, color: p.color, boxShadow: `inset 0 0 0 1px ${p.color}55` }}>{p.icon}</span>
                        <span className="min-w-0">
                            <span className="block text-sm font-black text-[#F2F7FB]">{p.title}</span>
                            <span className="block text-xs font-bold leading-snug" style={{ color: MUTED }}>{p.text}</span>
                        </span>
                    </motion.div>
                ))}
            </div>
            <div className="mt-auto pt-6">
                <PremiumButton onClick={onStart} className="w-full">Погнали 🚀</PremiumButton>
            </div>
        </div>
    )
}

/** Кольцо таймера: полоса по кругу тает, последние 10 секунд — красная. */
function TimerRing({ left }: { left: number }) {
    const r = 17, c = 2 * Math.PI * r
    const low = left <= 10
    return (
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
            <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
                <circle cx={22} cy={22} r={r} fill="none" stroke="#ffffff14" strokeWidth={4} />
                <circle cx={22} cy={22} r={r} fill="none" stroke={low ? RED : GOLD} strokeWidth={4} strokeLinecap="round"
                    strokeDasharray={c} strokeDashoffset={c * (1 - left / SECONDS)} style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }} />
            </svg>
            <span className="text-xs font-black tabular-nums" style={{ color: low ? RED : TEXT }}>{left}</span>
        </span>
    )
}

const FLASH: Record<Status, { text: string; color: string; sticker: string }> = {
    right: { text: 'Верно!', color: GREEN, sticker: '/miguel/miguel-happy.webp' },
    wrong: { text: 'Мимо — разберёмся', color: RED, sticker: '/miguel/miguel-oops.webp' },
    unknown: { text: 'Научим 💜', color: VIOLET, sticker: '/miguel/miguel-salute.webp' },
    timeout: { text: 'Время вышло', color: GOLD, sticker: '/miguel/miguel-stopwatch.webp' },
}

function TaskScreen({ task, index, total, results, onDone }: { task: Task; index: number; total: number; results: Result[]; onDone: (rows: Result[]) => void }) {
    const [left, setLeft] = useState(SECONDS)
    const [typed, setTyped] = useState('')
    const [signs, setSigns] = useState<(string | null)[]>(task.item.kind === 'signs' ? task.item.rows.map(() => null) : [])
    const [flash, setFlash] = useState<Status | null>(null)
    const finished = useRef(false)

    const finish = (rows: Result[], shown: Status) => {
        if (finished.current) return
        finished.current = true
        setFlash(shown)
        setTimeout(() => onDone(rows), 900)
    }
    const single = (status: Status) => finish([{ id: task.id, status }], status)
    const signRows = (status: Status) => task.item.kind === 'signs' ? task.item.rows.map((_, i) => ({ id: `${task.id}.${i + 1}`, status })) : []

    // Пока страница не на экране — таймер стоит (как в v2).
    const [visible, setVisible] = useState(true)
    useEffect(() => {
        const onVis = () => setVisible(document.visibilityState === 'visible')
        onVis()
        document.addEventListener('visibilitychange', onVis)
        return () => document.removeEventListener('visibilitychange', onVis)
    }, [])
    useEffect(() => {
        if (flash || !visible) return
        if (left <= 0) { task.item.kind === 'signs' ? finish(signRows('timeout'), 'timeout') : single('timeout'); return }
        const t = setTimeout(() => setLeft((s) => s - 1), 1000)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [left, flash, visible])

    const notKnow = () => task.item.kind === 'signs' ? finish(signRows('unknown'), 'unknown') : single('unknown')
    const submitNumber = () => {
        if (task.item.kind !== 'number') return
        const ok = [task.item.answer, ...(task.item.alsoOk ?? [])].some((a) => norm(a) === norm(typed))
        single(ok ? 'right' : 'wrong')
    }
    const submitSigns = () => {
        if (task.item.kind !== 'signs') return
        const rows = task.item.rows.map((r, i) => ({ id: `${task.id}.${i + 1}`, status: (signs[i] === r.answer ? 'right' : 'wrong') as Status }))
        finish(rows, rows.every((r) => r.status === 'right') ? 'right' : 'wrong')
    }
    const choices = useMemo(() => task.item.kind === 'choice' ? task.item.options.map((o, i) => ({ o, i })).sort(() => Math.random() - 0.5) : [], [task])
    const chips = useMemo(() => task.item.kind === 'fraction' ? task.item.chips.map((c) => ({ id: c, label: c })) : [], [task])

    // Сегменты прогресса окрашены итогом прошлых заданий: зелёный — верно, остальное приглушённое.
    const segColor = (i: number) => {
        if (i === index) return GOLD
        if (i > index) return '#ffffff14'
        const rows = results.filter((r) => r.id === TASKS[i].id || r.id.startsWith(`${TASKS[i].id}.`))
        return rows.length && rows.every((r) => r.status === 'right') ? GREEN : '#4A5A63'
    }

    return (
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 pb-6 pt-4">
            <div className="flex items-center gap-3">
                <div className="flex flex-1 gap-[3px]">
                    {Array.from({ length: total }, (_, i) => (
                        <span key={i} className="h-2 flex-1 rounded-full transition-colors" style={{ background: segColor(i), boxShadow: i === index ? `0 0 8px ${GOLD}` : undefined }} />
                    ))}
                </div>
                <TimerRing left={left} />
            </div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex flex-1 flex-col justify-center py-3">
                <div className="flex justify-center">
                    <span className="rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider" style={{ background: `${VIOLET}22`, color: '#D8B4FE', boxShadow: `inset 0 0 0 1px ${VIOLET}55` }}>
                        Задание {task.label} из {total} · {task.topic}
                    </span>
                </div>
                <div className="mt-3 rounded-3xl px-4 py-4" style={glass}>
                    <p className="whitespace-pre-line text-center text-lg font-extrabold leading-snug text-[#F2F7FB]">{task.text}</p>
                    {task.formula && <Formula tex={task.formula} />}
                    {task.text2 && <p className="mt-3 text-center text-lg font-extrabold text-[#F2F7FB]">{task.text2}</p>}
                    {task.formula2 && <Formula tex={task.formula2} />}
                    {task.words && (
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {task.words.map((w, i) => {
                                const c = [VIOLET, BLUE, GOLD, GREEN][i % 4]
                                return <span key={w} className="rounded-xl px-3 py-1.5 text-base font-black" style={{ color: c, background: `${c}1f`, boxShadow: `inset 0 0 0 1.5px ${c}88` }}>{w}</span>
                            })}
                        </div>
                    )}
                    {task.picture && <div className="mt-3">{task.picture}</div>}
                    {task.item.kind === 'signs' && (
                        <div className="mt-4 flex flex-col gap-2">
                            {task.item.rows.map((r, i) => (
                                <div key={i} className="flex items-center gap-2 rounded-2xl px-3 py-2" style={{ background: '#00000033', boxShadow: 'inset 0 0 0 1px #ffffff12' }}>
                                    <span className="flex-1 text-center text-xl text-[#F2F7FB]"><Latex>{`$${r.tex}$`}</Latex></span>
                                    {(['>', '<'] as const).map((s) => (
                                        <button key={s} type="button" disabled={!!flash} onClick={() => setSigns((a) => a.map((v, j) => (j === i ? s : v)))}
                                            className="h-10 w-12 rounded-xl border-b-4 text-xl font-black active:border-b-0"
                                            style={signs[i] === s ? { background: BLUE, borderBottomColor: '#2E6FA0', color: '#0B1114' } : { background: '#ffffff10', borderBottomColor: '#0A0F12', color: TEXT }}>
                                            {s}
                                        </button>
                                    ))}
                                    <span className="w-6 text-center text-xl font-black" style={{ color: MUTED }}>0</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>

            <div className="pt-1">
                {task.item.kind === 'number' && (
                    <>
                        <div className="mb-2 flex h-14 items-center justify-center rounded-2xl text-3xl font-black transition-shadow"
                            style={{ background: '#00000040', color: TEXT, boxShadow: `inset 0 0 0 2px ${flash === 'right' ? GREEN : flash === 'wrong' ? RED : typed ? `${GOLD}99` : '#ffffff1a'}` }}>
                            {typed || <span style={{ color: '#3E4B52' }}>?</span>}
                        </div>
                        <KeyboardInput value={typed} onChange={setTyped} disabled={!!flash} showDisplay={false} allowNegative />
                        <div className="mt-3 flex gap-2">
                            <NotKnowButton onClick={notKnow} disabled={!!flash} />
                            <PremiumButton onClick={submitNumber} disabled={!!flash || !typed.replace('-', '')} className="flex-1">Ответить</PremiumButton>
                        </div>
                    </>
                )}
                {task.item.kind === 'fraction' && (
                    <div className="flex justify-center">
                        <FormulaAssemble prefix={<span className="text-2xl text-[#F2F7FB]"><Latex>{`$${task.item.prefix}$`}</Latex></span>} layout="fraction"
                            chips={chips} correct={task.item.correct} onWrong={() => single('wrong')} onSolved={(first) => single(first ? 'right' : 'wrong')} />
                    </div>
                )}
                {task.item.kind === 'choice' && (
                    <div className="drop-in-options grid grid-cols-2 gap-2.5">
                        {choices.map((x) => (
                            <button key={x.i} type="button" disabled={!!flash}
                                onClick={() => task.item.kind === 'choice' && single(x.i === task.item.correct ? 'right' : 'wrong')}
                                className="flex h-16 items-center justify-center rounded-2xl border-b-4 text-2xl text-[#F2F7FB] active:border-b-0"
                                style={{ ...glass, borderBottomColor: '#0A0F12' }}>
                                <Latex>{`$${x.o}$`}</Latex>
                            </button>
                        ))}
                    </div>
                )}
                {task.item.kind === 'signs' && (
                    <div className="mt-1 flex gap-2">
                        <NotKnowButton onClick={notKnow} disabled={!!flash} />
                        <PremiumButton onClick={submitSigns} disabled={!!flash || signs.some((v) => v === null)} className="flex-1">Ответить</PremiumButton>
                    </div>
                )}
                {(task.item.kind === 'fraction' || task.item.kind === 'choice') && <div className="mt-3"><NotKnowButton onClick={notKnow} disabled={!!flash} wide /></div>}
            </div>

            {flash && (
                <div className="pointer-events-none fixed inset-x-0 top-[22%] z-50 flex flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <motion.img src={FLASH[flash].sticker} alt="" className="h-28 w-28 object-contain"
                        initial={{ scale: 0.3, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }} />
                    <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.08, type: 'spring', bounce: 0.5 }}
                        className="mt-1 rounded-2xl px-5 py-2 text-lg font-black"
                        style={{ background: FLASH[flash].color, color: flash === 'right' || flash === 'timeout' ? '#11190A' : '#FFFFFF', boxShadow: `0 0 30px -4px ${FLASH[flash].color}` }}>
                        {FLASH[flash].text}
                    </motion.span>
                </div>
            )}
        </div>
    )
}

function Formula({ tex }: { tex: string }) {
    return (
        <div className="mt-3 flex justify-center">
            <div className="max-w-full overflow-x-auto rounded-2xl px-5 py-3 text-[28px] leading-none text-[#F2F7FB]"
                style={{ background: '#00000040', boxShadow: `inset 0 0 0 1px ${GOLD}33, 0 0 24px -10px ${GOLD}` }}>
                <Latex>{`$\\displaystyle ${tex}$`}</Latex>
            </div>
        </div>
    )
}

const STATUS_VIEW: Record<Status, { icon: React.ReactNode; color: string; label: string }> = {
    right: { icon: <Check className="h-4 w-4" />, color: GREEN, label: 'знаешь' },
    wrong: { icon: <X className="h-4 w-4" />, color: RED, label: 'ошибка' },
    unknown: { icon: <HelpCircle className="h-4 w-4" />, color: VIOLET, label: 'научим' },
    timeout: { icon: <Hourglass className="h-4 w-4" />, color: GOLD, label: 'не успел' },
}

function ResultsView({ results, result, saving, saveError, testMode }: { results: Result[]; result: DiagResult | null; saving: boolean; saveError: string | null; testMode: boolean }) {
    const [building, setBuilding] = useState(false)
    const right = results.filter((r) => r.status === 'right').length
    const share = results.length ? right / results.length : 0
    const byTask = TASKS.map((t) => {
        const rows = results.filter((r) => r.id === t.id || r.id.startsWith(`${t.id}.`))
        const status: Status = rows.every((r) => r.status === 'right') ? 'right'
            : rows.some((r) => r.status === 'unknown') ? 'unknown'
            : rows.some((r) => r.status === 'timeout') ? 'timeout' : 'wrong'
        return { t, status, rows }
    })
    const strong = byTask.filter((x) => x.status === 'right').length
    const r = 54, c = 2 * Math.PI * r
    return (
        <div className="mx-auto w-full max-w-md px-4 pb-10 pt-6">
            <div className="flex flex-col items-center">
                <div className="relative h-40 w-40">
                    <svg viewBox="0 0 128 128" className="absolute inset-0 -rotate-90">
                        <circle cx={64} cy={64} r={r} fill="none" stroke="#ffffff12" strokeWidth={10} />
                        <motion.circle cx={64} cy={64} r={r} fill="none" stroke="url(#diag-ring)" strokeWidth={10} strokeLinecap="round" strokeDasharray={c}
                            initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - share) }} transition={{ duration: 1.4, ease: [0.2, 0.8, 0.2, 1] }} />
                        <defs>
                            <linearGradient id="diag-ring" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor={VIOLET} /><stop offset="100%" stopColor={GREEN} />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-[#F2F7FB]">{right}<span className="text-xl" style={{ color: MUTED }}>/{results.length}</span></span>
                        <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: MUTED }}>верно</span>
                    </div>
                </div>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest" style={{ background: `${GOLD}1f`, color: GOLD }}>
                    <Sparkles className="h-3.5 w-3.5" /> База проверена
                </span>
                <p className="mt-2 text-center text-sm font-bold" style={{ color: MUTED }}>
                    Уверенно знаешь {strong} из {TASKS.length} тем. Остальное — в твой план.
                </p>
            </div>
            <div className="mt-5 flex flex-col gap-1.5">
                {byTask.map(({ t, status, rows }, i) => {
                    const v = STATUS_VIEW[status]
                    return (
                        <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.03 }}
                            className="flex items-center gap-2.5 rounded-2xl px-3 py-2" style={glass}>
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: `${v.color}26`, color: v.color, boxShadow: `inset 0 0 0 1px ${v.color}66` }}>{v.icon}</span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-bold text-[#F2F7FB]">{t.label}. {t.topic}</span>
                                {status !== 'right' && <span className="block text-xs font-bold" style={{ color: MUTED }}>Ответ: <span className="text-[#F2F7FB]"><Latex>{`$${t.answerTex}$`}</Latex></span></span>}
                            </span>
                            <span className="shrink-0 text-xs font-black" style={{ color: v.color }}>
                                {rows.length > 1 ? `${rows.filter((x) => x.status === 'right').length}/${rows.length}` : v.label}
                            </span>
                        </motion.div>
                    )
                })}
            </div>
            {testMode ? (
                <p className="mt-4 text-center text-[11px] font-bold text-[#5C6B73]">Тестовая версия: результаты не сохраняются.</p>
            ) : (
                <>
                    {saveError && <p className="mt-4 text-center text-sm font-bold text-[#DC605B]">{saveError}</p>}
                    <PremiumButton onClick={() => setBuilding(true)} disabled={!result} color="#F09B38" edge="#C07C2B" className="mt-5 w-full">
                        {saving ? 'Сохраняю…' : 'Построить мой план ➜'}
                    </PremiumButton>
                    {building && result && <PlanBuildModal r={result} onClose={() => setBuilding(false)} />}
                </>
            )}
        </div>
    )
}
