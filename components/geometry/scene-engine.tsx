'use client'

// Движок пошаговых разборов «данными» (SCENEWALK, см. app/t-lesson/[t_lessonId]/type-scenewalk.tsx).
// Урок = список сцен, сцена = список шагов Part, которые открываются по очереди:
//   fig — рисунок (ReactNode), обновляется на месте (одна «картинка» на сцену),
//   say — печатная фраза, card — карточка формулы (KaTeX), calc — строка-вычисление, remember — плашка ЗАПОМНИ,
//   choice — «посчитай / выбери» (раунды, «пробуй, пока не угадаешь»),
//   build — «собери формулу» из кнопок (слоты, дроби, корень; группы слотов, где порядок не важен),
//   system — «собери систему» из кнопок (строки неравенств, кнопки можно жать много раз),
//   custom — своя мини-игра урока: render(done) рисует её, done() открывает следующий шаг.
// Ошибки в мини-играх в зачёт урока не идут. Тот же подход, что в type-area6walk.tsx (там свой движок с рисунками-элементами).

import { Fragment, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RememberPlate } from '@/components/geometry/WalkthroughLog'
import { Typewriter } from '@/components/geometry/Typewriter'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css'

export const SLOT_COL = GGEGE_PALETTE.purple.button
const OK = '#A1D151'
const BAD = '#DC605B'

export type ChoiceRound = { prompt: string; options: string[]; correct: string; hint: string; ok?: string }
export type Tok = string | { s: number } | { frac: [Tok[], Tok[]] } | { sqrt: Tok[] }
export type SysRow = Tok[]
export type Part =
    | { t: 'fig'; node: React.ReactNode }
    | { t: 'say'; text: string; big?: boolean }
    | { t: 'pause'; ms: number }
    | { t: 'card'; title: string; tex: string }
    | { t: 'calc'; tex: string }
    | { t: 'remember'; title: string; lines: string[] }
    | { t: 'choice'; label?: string; rounds: ChoiceRound[] }
    | { t: 'build'; prompt: string; tpl: Tok[]; chips: string[]; slots: string[]; any?: number[][]; hint: string }
    // rows: строки системы; slots — ожидаемые значения по номерам слотов; sameRows — строки, порядок которых не важен;
    // any — группы слотов, где порядок не важен (как множители (a − 1)(b − 1)).
    | { t: 'system'; prompt: string; rows: SysRow[]; chips: string[]; slots: string[]; sameRows?: number[]; any?: number[][]; hint: string }
    | { t: 'custom'; label?: string; render: (done: () => void) => React.ReactNode }
export type Scene = { title: string; next: string; parts: Part[] }

const L = ({ children }: { children: string }) => (children.includes('$') ? <Latex>{children}</Latex> : <>{children}</>)

export const TypedLine = ({ text, onDone, big }: { text: string; onDone?: () => void; big?: boolean }) => (
    <div className={cn('w-full text-center font-black text-[#F2F7FB]', big ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl')}>
        <Typewriter text={text} onDone={() => setTimeout(() => onDone?.(), 350)} />
    </div>
)
export const After = ({ ms, onDone }: { ms: number; onDone: () => void }) => {
    useEffect(() => {
        const t = setTimeout(onDone, ms)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return null
}
export const FormulaCard = ({ tex, title }: { tex: string; title: string }) => (
    <motion.div className="w-full rounded-2xl border-2 px-4 py-3 flex flex-col items-center gap-1"
        style={{ borderColor: 'rgba(232,182,54,0.85)', backgroundColor: '#161F23', boxShadow: '0 0 14px -4px rgba(232,182,54,0.45)' }}
        initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 13 }}>
        <div className="text-xs font-black uppercase tracking-wide text-[#F2C35B]">{title}</div>
        <div className="text-xl md:text-2xl text-[#F2F7FB]"><Latex>{`$${tex}$`}</Latex></div>
    </motion.div>
)
export const CalcLine = ({ tex }: { tex: string }) => (
    <motion.div className="w-full text-center text-3xl md:text-4xl text-[#F2F7FB] py-1"
        initial={{ opacity: 0, y: 8, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }}>
        <Latex>{`$${tex}$`}</Latex>
    </motion.div>
)
export const GameLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="w-full flex items-center gap-2" aria-hidden>
        <div className="flex-1 h-px bg-[#3A464E]" />
        <span className="text-[11px] font-black uppercase tracking-wide text-[#F2C35B]">🎮 {children}</span>
        <div className="flex-1 h-px bg-[#3A464E]" />
    </div>
)
export const Note = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className={cn('rounded-xl px-4 py-2 font-bold w-full text-center', ok ? 'bg-[#A1D15122] text-[#A1D151]' : 'bg-[#DC605B22] text-[#DC605B]')}>
        {children}
    </motion.div>
)

// --- «Выбери / посчитай» ---
export const ChoiceGame = ({ rounds, onDone }: { rounds: ChoiceRound[]; onDone: () => void }) => {
    const [r, setR] = useState(0)
    const [wrong, setWrong] = useState<string[]>([])
    const [done, setDone] = useState(false)
    const round = rounds[r]
    const pick = (o: string) => {
        if (done || wrong.includes(o)) return
        if (o === round.correct) {
            setDone(true); showAnswerMeme(true)
            setTimeout(() => {
                if (r + 1 >= rounds.length) { onDone(); return }
                setR(r + 1); setWrong([]); setDone(false)
            }, 1800)
        } else { setWrong((w) => [...w, o]); playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false) }
    }
    const long = round.options.some((o) => o.replace(/\$|\\[a-z]+|[{}]/g, '').length > 9)
    return (
        <div className="w-full flex flex-col gap-2">
            <motion.div key={r} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="w-full text-center text-xl md:text-2xl font-black text-[#F2F7FB]">
                <L>{round.prompt}</L>
                {rounds.length > 1 && <span className="ml-1 text-sm font-bold text-[#5C6B73]">{r + 1}/{rounds.length}</span>}
            </motion.div>
            <div key={`o${r}`} className={cn('drop-in-options grid gap-3 w-full', round.options.length === 2 || long ? 'grid-cols-2' : 'grid-cols-3')}>
                {round.options.map((o) => {
                    const isWrong = wrong.includes(o), isRight = done && o === round.correct
                    return (
                        <button key={o} type="button" disabled={isWrong || done} onClick={() => pick(o)}
                            className={cn('min-h-[56px] px-2 rounded-xl border-2 border-b-4 text-xl font-black transition-colors',
                                isRight ? 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]'
                                    : isWrong ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]'
                                        : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                            <L>{o}</L>
                        </button>
                    )
                })}
            </div>
            {!done && wrong.length > 0 && <Note ok={false}><L>{round.hint}</L></Note>}
            {done && round.ok && <Note ok><L>{round.ok}</L></Note>}
        </div>
    )
}

// --- Слот и токены для сборки ---
const SlotBtn = ({ value, active, color, onClick }: { value: string | null; active: boolean; color: string | null; onClick: () => void }) => (
    <button type="button" onClick={onClick}
        className={cn('mx-0.5 min-w-[42px] h-[42px] px-2 rounded-xl border-2 inline-flex items-center justify-center align-middle not-italic', active && 'border-dashed')}
        style={{ borderColor: color ?? (active ? SLOT_COL : '#3A464E'), backgroundColor: '#161F23', color: color ?? '#F2F7FB' }}>
        {value === null
            ? <span className={cn(active && 'animate-slot-label')} style={{ ['--slot-c' as string]: SLOT_COL } as React.CSSProperties}>?</span>
            : <motion.span key={value} initial={{ scale: 0.3, y: -24, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 16 }} className="whitespace-nowrap"><L>{value}</L></motion.span>}
    </button>
)
const renderToks = (toks: Tok[], slot: (j: number) => React.ReactNode): React.ReactNode => toks.map((tk, i) => {
    if (typeof tk === 'string') return <span key={i} className="mx-1 whitespace-nowrap"><L>{tk}</L></span>
    if ('s' in tk) return <Fragment key={i}>{slot(tk.s)}</Fragment>
    if ('frac' in tk) return (
        <span key={i} className="inline-flex flex-col items-center align-middle mx-1 gap-1">
            <span className="inline-flex items-center">{renderToks(tk.frac[0], slot)}</span>
            <span className="block w-full h-[3px] rounded-full bg-[#F2F7FB]" />
            <span className="inline-flex items-center">{renderToks(tk.frac[1], slot)}</span>
        </span>
    )
    return (
        <span key={i} className="inline-flex items-center mx-1">
            <span className="text-3xl mr-0.5">√</span>
            <span className="inline-flex items-center border-t-[3px] border-[#F2F7FB] pt-1">{renderToks(tk.sqrt, slot)}</span>
        </span>
    )
})
const ChipGrid = ({ chips, used, onPick }: { chips: string[]; used?: (i: number) => boolean; onPick: (i: number) => void }) => (
    <div className="drop-in-options grid grid-cols-3 gap-2 w-full">
        {chips.map((c, i) => (
            <button key={i} type="button" disabled={used?.(i)} onClick={() => onPick(i)}
                className={cn('min-h-[50px] px-1 rounded-xl border-2 border-b-4 text-lg md:text-xl font-black transition-opacity',
                    'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]', used?.(i) && 'opacity-25')}>
                <L>{c}</L>
            </button>
        ))}
    </div>
)
const sameMultiset = (a: string[], b: string[]) => [...a].sort().join('|') === [...b].sort().join('|')

// --- «Собери формулу» (кнопка используется один раз) ---
export const BuildGame = ({ prompt, tpl, chips, slots, any = [], hint, onDone }: Extract<Part, { t: 'build' }> & { onDone: () => void }) => {
    const [fill, setFill] = useState<(number | null)[]>(slots.map(() => null))
    const [state, setState] = useState<'idle' | 'bad' | 'ok'>('idle')
    const [typed, setTyped] = useState(false)
    const active = fill.indexOf(null)
    const check = (f: (number | null)[]) => {
        const vals = f.map((i) => chips[i!])
        const inAny = new Set(any.flat())
        const ok = slots.every((s, j) => inAny.has(j) || vals[j] === s) && any.every((g) => sameMultiset(g.map((j) => vals[j]), g.map((j) => slots[j])))
        if (ok) { setState('ok'); showAnswerMeme(true); setTimeout(onDone, 1000) }
        else {
            setState('bad'); playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
            setTimeout(() => { setFill(slots.map(() => null)); setState('idle') }, 1500)
        }
    }
    const color = state === 'ok' ? OK : state === 'bad' ? BAD : null
    return (
        <div className="w-full flex flex-col gap-3">
            <div className="w-full text-center text-lg md:text-xl font-black text-[#F2F7FB]"><Typewriter text={prompt} onDone={() => setTyped(true)} /></div>
            <motion.div animate={state === 'bad' ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }} transition={{ duration: 0.4 }}
                className="w-full flex flex-wrap items-center justify-center text-2xl font-black text-[#F2F7FB]">
                {renderToks(tpl, (j) => (
                    <SlotBtn value={fill[j] === null ? null : chips[fill[j]!]} active={state === 'idle' && j === active} color={color}
                        onClick={() => { if (state === 'idle' && fill[j] !== null) { const f = [...fill]; f[j] = null; setFill(f) } }} />
                ))}
            </motion.div>
            {typed && state !== 'ok' && (
                <ChipGrid chips={chips} used={(i) => fill.includes(i)} onPick={(i) => {
                    if (state !== 'idle' || active < 0 || fill.includes(i)) return
                    const f = [...fill]; f[active] = i; setFill(f)
                    if (!f.includes(null)) check(f)
                }} />
            )}
            {state === 'bad' && <Note ok={false}><L>{hint}</L></Note>}
            {state === 'ok' && <Note ok>Собрано! 🔥</Note>}
        </div>
    )
}

// --- «Собери систему» (кнопки многоразовые; неверные строки краснеют и очищаются) ---
const slotsIn = (toks: Tok[]): number[] => toks.flatMap((tk) =>
    typeof tk === 'string' ? [] : 's' in tk ? [tk.s] : 'frac' in tk ? [...slotsIn(tk.frac[0]), ...slotsIn(tk.frac[1])] : slotsIn(tk.sqrt))
export const SystemGame = ({ prompt, rows, chips, slots, sameRows = [], any = [], hint, onDone }: Extract<Part, { t: 'system' }> & { onDone: () => void }) => {
    const [fill, setFill] = useState<(string | null)[]>(slots.map(() => null))
    const [badRows, setBadRows] = useState<number[]>([])
    const [okAll, setOkAll] = useState(false)
    const [typed, setTyped] = useState(false)
    const active = fill.indexOf(null)
    const rowSlots = rows.map(slotsIn)
    // строка верна, если её значения совпадают с ожидаемыми (с учётом групп any); строки sameRows сравниваются
    // между собой как набор — можно записать в любом порядке.
    const rowKey = (vals: (string | null)[], r: number) => {
        const js = rowSlots[r]
        const anyHere = any.filter((g) => g.every((j) => js.includes(j)))
        return js.map((j) => {
            const g = anyHere.find((gg) => gg.includes(j))
            return g ? [...g.map((k) => vals[k] ?? '')].sort().join('&') : vals[j] ?? ''
        }).join(' ')
    }
    const check = (f: (string | null)[]) => {
        const bad: number[] = []
        const expectedSame = sameRows.map((r) => rowKey(slots, r))
        const leftSame = [...expectedSame]
        rows.forEach((_, r) => {
            const got = rowKey(f, r)
            if (sameRows.includes(r)) {
                const k = leftSame.indexOf(got)
                if (k >= 0) leftSame.splice(k, 1); else bad.push(r)
            } else if (got !== rowKey(slots, r)) bad.push(r)
        })
        if (bad.length === 0) { setOkAll(true); showAnswerMeme(true); setTimeout(onDone, 1200); return }
        setBadRows(bad); playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
        setTimeout(() => {
            setFill((cur) => cur.map((v, j) => (bad.some((r) => rowSlots[r].includes(j)) ? null : v)))
            setBadRows([])
        }, 1600)
    }
    const busy = badRows.length > 0 || okAll
    return (
        <div className="w-full flex flex-col gap-3">
            <div className="w-full text-center text-lg md:text-xl font-black text-[#F2F7FB]"><Typewriter text={prompt} onDone={() => setTyped(true)} /></div>
            <div className="w-full flex justify-center">
                <div className="flex items-stretch">
                    <div className="w-3 border-l-[3px] border-y-[3px] rounded-l-xl mr-2" style={{ borderColor: okAll ? OK : '#F2F7FB' }} />
                    <div className="flex flex-col gap-1.5">
                        {rows.map((row, r) => (
                            <motion.div key={r} animate={badRows.includes(r) ? { x: [0, -7, 7, -4, 4, 0] } : { x: 0 }} transition={{ duration: 0.4 }}
                                className="flex flex-wrap items-center text-lg md:text-xl font-black text-[#F2F7FB]">
                                {renderToks(row, (j) => (
                                    <SlotBtn value={fill[j]} active={!busy && j === active}
                                        color={okAll ? OK : badRows.includes(r) ? BAD : null}
                                        onClick={() => { if (!busy && fill[j] !== null) { const f = [...fill]; f[j] = null; setFill(f) } }} />
                                ))}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            {typed && !okAll && (
                <ChipGrid chips={chips} onPick={(i) => {
                    if (busy || active < 0) return
                    const f = [...fill]; f[active] = chips[i]; setFill(f)
                    if (!f.includes(null)) check(f)
                }} />
            )}
            {badRows.length > 0 && <Note ok={false}><L>{hint}</L></Note>}
            {okAll && <Note ok>Система собрана! 🔥</Note>}
        </div>
    )
}

export const SceneRunner = ({ parts, onSettled }: { parts: Part[]; onSettled?: () => void }) => {
    const [reached, setReached] = useState(0)
    const done = (i: number) => () => setReached((r) => (r === i ? i + 1 : r))
    useEffect(() => { if (reached >= parts.length) onSettled?.() }, [reached]) // eslint-disable-line react-hooks/exhaustive-deps
    let fig: React.ReactNode = null
    for (let i = 0; i <= Math.min(reached, parts.length - 1); i++) { const p = parts[i]; if (p.t === 'fig') fig = p.node }
    return (
        <>
            {fig && (
                <motion.div className="w-full flex justify-center" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
                    {fig}
                </motion.div>
            )}
            {parts.map((p, i) => {
                if (i > reached) return null
                const d = done(i)
                switch (p.t) {
                    case 'fig': return i === reached ? <After key={i} ms={700} onDone={d} /> : null
                    case 'pause': return i === reached ? <After key={i} ms={p.ms} onDone={d} /> : null
                    case 'say': return <TypedLine key={i} text={p.text} big={p.big} onDone={d} />
                    case 'card': return <Fragment key={i}><FormulaCard title={p.title} tex={p.tex} />{i === reached && <After ms={1000} onDone={d} />}</Fragment>
                    case 'calc': return <Fragment key={i}><CalcLine tex={p.tex} />{i === reached && <After ms={900} onDone={d} />}</Fragment>
                    case 'remember': return (
                        <Fragment key={i}>
                            <RememberPlate title={p.title}>
                                <div className="flex flex-col gap-1 text-sm md:text-base font-bold text-[#F2F7FB]">
                                    {p.lines.map((l, j) => <div key={j}><L>{l}</L></div>)}
                                </div>
                            </RememberPlate>
                            {i === reached && <After ms={1500} onDone={d} />}
                        </Fragment>
                    )
                    case 'choice': return <Fragment key={i}><GameLabel>{p.label ?? 'Посчитай'}</GameLabel><ChoiceGame rounds={p.rounds} onDone={d} /></Fragment>
                    case 'build': return <Fragment key={i}><GameLabel>Собери формулу</GameLabel><BuildGame {...p} onDone={d} /></Fragment>
                    case 'system': return <Fragment key={i}><GameLabel>Собери систему</GameLabel><SystemGame {...p} onDone={d} /></Fragment>
                    case 'custom': return <Fragment key={i}>{p.label && <GameLabel>{p.label}</GameLabel>}{p.render(d)}</Fragment>
                }
            })}
        </>
    )
}
