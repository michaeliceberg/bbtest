'use client'

// components/ege-diagnostic-v2.tsx
//
// Новая диагностика «Мой путь» (черновик, тестовая страница /test-diagnostic-v2): не задачи ЕГЭ, а
// базовые вещи «в уме» — знает/не знает. Задания придумал пользователь (2026-10-13). На каждое
// задание 60 секунд, есть «Пока не знаю». Ответы считаются сразу на клиенте; пока ничего не сохраняем.

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css'
import { Brain, Timer, Heart, Check, X, HelpCircle, Hourglass } from 'lucide-react'
import { KeyboardInput } from '@/app/lesson/keyboard-input'
import { FormulaAssemble } from '@/components/geometry/FormulaAssemble'
import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors'

const SECONDS = 60
const GREEN = '#A1D151'
const RED = '#DC605B'
const TEXT = '#F2F7FB'
const VIOLET = GGEGE_PALETTE.purple.button
const ORANGE = GGEGE_PALETTE.orange.button
const BLUE = GGEGE_PALETTE.blue.button
const LEAF = GGEGE_PALETTE.green.button

type Status = 'right' | 'wrong' | 'unknown' | 'timeout'

type Item =
    | { kind: 'number'; answer: string; alsoOk?: string[] }
    | { kind: 'fraction'; prefix: string; correct: [string, string]; chips: string[] }
    | { kind: 'choice'; options: string[]; correct: number }
    | { kind: 'signs'; rows: { tex: string; answer: '>' | '<' }[] }

// text — обычный текст условия (по центру), formula — крупная формула по центру (KaTeX без $),
// text2/formula2 — вторая строка (задание 6), words — слова-плашки (задание 13),
// answerTex — верный ответ для итога.
type Task = {
    id: string; label: string; topic: string; text: string
    formula?: string; text2?: string; formula2?: string; words?: string[]
    picture?: React.ReactNode; answerTex: string; item: Item
}

// ── рисунки ─────────────────────────────────────────────────────────────────

const svgText = { fontFamily: 'var(--font-nunito), sans-serif', fontWeight: 900 } as const

const Tag = ({ x, y, text, color }: { x: number; y: number; text: string; color: string }) => (
    <g transform={`translate(${x},${y})`}>
        <rect x={-text.length * 7 - 8} y={-15} width={text.length * 14 + 16} height={30} rx={8} fill="#161F23" stroke={color} strokeWidth={2} />
        <text textAnchor="middle" dominantBaseline="central" fontSize={18} fill={color} style={svgText}>{text}</text>
    </g>
)

const RightMark = ({ x, y, dx, dy }: { x: number; y: number; dx: number; dy: number }) => (
    <path d={`M${x + dx * 16},${y} L${x + dx * 16},${y + dy * 16} L${x},${y + dy * 16}`} fill="none" stroke={ORANGE} strokeWidth={2.5} />
)

const Frame = ({ children, h = 210 }: { children: React.ReactNode; h?: number }) => (
    <svg viewBox={`0 0 300 ${h}`} className="mx-auto h-auto max-h-[170px] w-full max-w-[340px]">{children}</svg>
)

// Гипотенуза 13, катет 5, другой — ?
const PicLeg = (
    <Frame>
        <RightMark x={42} y={160} dx={1} dy={-1} />
        <line x1={42} y1={160} x2={258} y2={160} stroke={ORANGE} strokeWidth={5} strokeLinecap="round" />
        <line x1={42} y1={160} x2={42} y2={70} stroke={LEAF} strokeWidth={5} strokeLinecap="round" />
        <line x1={42} y1={70} x2={258} y2={160} stroke={VIOLET} strokeWidth={5} strokeLinecap="round" />
        <Tag x={150} y={188} text="?" color={ORANGE} />
        <Tag x={18} y={115} text="5" color={LEAF} />
        <Tag x={168} y={96} text="13" color={VIOLET} />
    </Frame>
)

// Треугольник 3-4-5, угол α напротив катета 3
const PicTrig = (
    <Frame h={228}>
        <RightMark x={60} y={185} dx={1} dy={-1} />
        <path d="M220,185 A40,40 0 0,1 228,161" fill="none" stroke={BLUE} strokeWidth={3} />
        <line x1={60} y1={185} x2={260} y2={185} stroke={TEXT} strokeWidth={5} strokeLinecap="round" />
        <line x1={60} y1={185} x2={60} y2={35} stroke={TEXT} strokeWidth={5} strokeLinecap="round" />
        <line x1={60} y1={35} x2={260} y2={185} stroke={TEXT} strokeWidth={5} strokeLinecap="round" />
        <text x={196} y={176} fontSize={20} fill={BLUE} style={{ ...svgText, fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>α</text>
        <Tag x={160} y={208} text="4" color={TEXT} />
        <Tag x={36} y={110} text="3" color={TEXT} />
        <Tag x={176} y={96} text="5" color={TEXT} />
    </Frame>
)

// Два куба: ребро одного в 5 раз больше
const Cube = ({ x, y, s, color }: { x: number; y: number; s: number; color: string }) => {
    const d = s * 0.45
    return (
        <g stroke={color} strokeWidth={2.5} strokeLinejoin="round" fill="none">
            <path d={`M${x},${y} h${s} v${-s} h${-s} Z`} fill={`${color}22`} />
            <path d={`M${x},${y - s} l${d},${-d} h${s} l${-d},${d}`} fill={`${color}33`} />
            <path d={`M${x + s},${y} l${d},${-d} v${-s} l${-d},${d}`} fill={`${color}18`} />
        </g>
    )
}
const PicCubes = (
    <Frame h={190}>
        <Cube x={40} y={178} s={22} color={LEAF} />
        <Cube x={110} y={178} s={110} color={BLUE} />
    </Frame>
)

// Медиана из прямого угла = 4, гипотенуза ?
const PicMedian = (
    <Frame>
        <RightMark x={42} y={170} dx={1} dy={-1} />
        <line x1={42} y1={170} x2={258} y2={170} stroke={TEXT} strokeWidth={5} strokeLinecap="round" />
        <line x1={42} y1={170} x2={42} y2={40} stroke={TEXT} strokeWidth={5} strokeLinecap="round" />
        <line x1={42} y1={40} x2={258} y2={170} stroke={ORANGE} strokeWidth={5} strokeLinecap="round" />
        <line x1={42} y1={170} x2={150} y2={105} stroke={LEAF} strokeWidth={4} strokeLinecap="round" strokeDasharray="2 9" />
        <circle cx={150} cy={105} r={5} fill={LEAF} />
        <Tag x={86} y={128} text="4" color={LEAF} />
        <Tag x={190} y={98} text="?" color={ORANGE} />
    </Frame>
)

// Треугольник 13-14-15 и вписанная окружность (центр (6;4), r = 4)
const S = 15, OX = 45, OY = 200
const P = (x: number, y: number) => `${OX + x * S},${OY - y * S}`
const PicIncircle = (
    <Frame h={232}>
        <polygon points={`${P(0, 0)} ${P(14, 0)} ${P(5, 12)}`} fill="none" stroke={TEXT} strokeWidth={4} strokeLinejoin="round" />
        <circle cx={OX + 6 * S} cy={OY - 4 * S} r={4 * S} fill={`${BLUE}22`} stroke={BLUE} strokeWidth={3} />
        <circle cx={OX + 6 * S} cy={OY - 4 * S} r={3} fill={BLUE} />
        <line x1={OX + 6 * S} y1={OY - 4 * S} x2={OX + 6 * S} y2={OY} stroke={ORANGE} strokeWidth={3} strokeDasharray="5 5" />
        <text x={OX + 6 * S + 6} y={OY - 1.6 * S} fontSize={18} fill={ORANGE} style={{ ...svgText, fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>r</text>
        <Tag x={OX + 7 * S} y={OY + 20} text="14" color={TEXT} />
        <Tag x={OX + 1.6 * S} y={OY - 6.5 * S} text="13" color={TEXT} />
        <Tag x={OX + 10.8 * S} y={OY - 6.5 * S} text="15" color={TEXT} />
    </Frame>
)

// ── задания ─────────────────────────────────────────────────────────────────

const TASKS: Task[] = [
    { id: '1', label: '1', topic: 'Устный счёт', text: 'Посчитай в уме', formula: '5 \\cdot 5 = \\,?', answerTex: '25', item: { kind: 'number', answer: '25' } },
    { id: '2', label: '2', topic: 'Отрицательные числа', text: 'Посчитай в уме', formula: '19 - 26 = \\,?', answerTex: '-7', item: { kind: 'number', answer: '-7' } },
    { id: '3', label: '3', topic: 'Длина вектора', text: 'Найди длину вектора', formula: '\\vec a = (15;\\,-8)', answerTex: '17', item: { kind: 'number', answer: '17' } },
    { id: '4', label: '4', topic: 'Теорема Пифагора', text: 'Гипотенуза 13, катет 5.\nЧему равен другой катет?', picture: PicLeg, answerTex: '12', item: { kind: 'number', answer: '12' } },
    { id: '5a', label: '5а', topic: 'Синус', text: 'Найди по рисунку', picture: PicTrig, answerTex: '\\tfrac{3}{5}', item: { kind: 'fraction', prefix: '\\sin\\alpha =', correct: ['3', '5'], chips: ['3', '4', '5'] } },
    { id: '5b', label: '5б', topic: 'Косинус', text: 'Найди по рисунку', picture: PicTrig, answerTex: '\\tfrac{4}{5}', item: { kind: 'fraction', prefix: '\\cos\\alpha =', correct: ['4', '5'], chips: ['3', '4', '5'] } },
    { id: '5c', label: '5в', topic: 'Тангенс', text: 'Найди по рисунку', picture: PicTrig, answerTex: '\\tfrac{3}{4}', item: { kind: 'fraction', prefix: '\\operatorname{tg}\\alpha =', correct: ['3', '4'], chips: ['3', '4', '5'] } },
    { id: '6', label: '6', topic: 'Косинус двойного угла', text: 'Известно, что', formula: '\\sin\\alpha = 0{,}4', text2: 'Найди', formula2: '\\cos 2\\alpha', answerTex: '0{,}68', item: { kind: 'number', answer: '0,68' } },
    { id: '7', label: '7', topic: 'Логарифмическое уравнение', text: 'Реши уравнение', formula: '\\log_7(4 - x) = 2', answerTex: 'x = -45', item: { kind: 'number', answer: '-45' } },
    { id: '8', label: '8', topic: 'Логарифм дроби', text: 'Вычисли', formula: '\\log_{\\frac{1}{16}} 2', answerTex: '-0{,}25', item: { kind: 'number', answer: '-0,25' } },
    { id: '9', label: '9', topic: 'Произведение логарифмов', text: 'Вычисли', formula: '\\log_7 99 \\cdot \\log_{99} 343', answerTex: '3', item: { kind: 'number', answer: '3' } },
    { id: '10', label: '10', topic: 'Деление логарифмов', text: 'Вычисли', formula: '\\dfrac{\\log_{101} 8}{\\log_{101} 4}', answerTex: '1{,}5', item: { kind: 'number', answer: '1,5' } },
    {
        id: '11', label: '11', topic: 'Знак логарифма', text: 'Больше или меньше нуля?', answerTex: '>\\;\\;<\\;\\;<\\;\\;>',
        item: {
            kind: 'signs', rows: [
                { tex: '\\log_{100} 4', answer: '>' },
                { tex: '\\log_{0{,}3} 14', answer: '<' },
                { tex: '\\log_{8} 0{,}5', answer: '<' },
                { tex: '\\log_{0{,}2} 0{,}03', answer: '>' },
            ],
        },
    },
    { id: '12', label: '12', topic: 'Подобие тел', text: 'Объём одного куба в 125 раз больше объёма другого.\nВо сколько раз площадь его поверхности больше?', picture: PicCubes, answerTex: '25', item: { kind: 'number', answer: '25' } },
    { id: '13', label: '13', topic: 'Перестановки', text: 'Сколькими способами можно переставить 4 слова?', words: ['Кола', 'Фанта', 'Пепси', 'Спрайт'], answerTex: '24', item: { kind: 'number', answer: '24' } },
    { id: '14', label: '14', topic: 'Медиана прямоугольного треугольника', text: 'Медиана, проведённая к гипотенузе, равна 4.\nЧему равна гипотенуза?', picture: PicMedian, answerTex: '8', item: { kind: 'number', answer: '8' } },
    { id: '15', label: '15', topic: 'Производная', text: 'Найди производную', formula: "(6x^6)'", answerTex: '36x^5', item: { kind: 'choice', options: ['36x^5', '6x^5', '36x^6', '30x^5'], correct: 0 } },
    { id: '16', label: '16', topic: 'Точка минимума', text: 'Найди точку минимума функции', formula: 'y = 777^{\\,x^2 - 2x + 5}', answerTex: 'x = 1', item: { kind: 'number', answer: '1' } },
    { id: '17', label: '17', topic: 'Вписанная окружность', text: 'Стороны треугольника 13, 14 и 15, площадь 84.\nНайди радиус вписанной окружности', picture: PicIncircle, answerTex: 'r = 4', item: { kind: 'number', answer: '4' } },
]

const norm = (s: string) => s.trim().replace(/\./g, ',').replace(/\s+/g, '').replace(/^-0$/, '0').replace(/,$/, '').replace(/^(-?)0+(\d)/, '$1$2')

// ── экраны ──────────────────────────────────────────────────────────────────

type Result = { id: string; status: Status }

export const EgeDiagnosticV2 = () => {
    const [phase, setPhase] = useState<'intro' | 'count' | 'quiz' | 'done'>('intro')
    const [count, setCount] = useState(3)
    const [index, setIndex] = useState(0)
    const [results, setResults] = useState<Result[]>([])

    useEffect(() => {
        if (phase !== 'count') return
        if (count === 0) { setPhase('quiz'); return }
        const t = setTimeout(() => setCount((c) => c - 1), 800)
        return () => clearTimeout(t)
    }, [phase, count])

    const record = (rows: Result[]) => {
        setResults((r) => [...r, ...rows])
        if (index + 1 >= TASKS.length) setPhase('done')
        else setIndex((i) => i + 1)
    }

    if (phase === 'intro') {
        return (
            <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center px-5 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl" style={{ background: `linear-gradient(180deg, ${VIOLET}, ${GGEGE_PALETTE.purple.bottom})`, boxShadow: `0 5px 0 ${GGEGE_PALETTE.purple.bottom}` }}>
                    <Brain className="h-10 w-10 text-white" />
                </div>
                <h1 className="mt-5 text-2xl font-black text-[#F2F7FB]">Проверим базу</h1>
                <div className="mt-5 flex w-full flex-col gap-2.5 text-left">
                    <p className="rounded-2xl border-2 border-[#2A363C] bg-[#161F23] p-3 text-sm font-bold text-[#F2F7FB]">🧠 Все задания нужно сделать <b className="text-[#F2C35B]">В УМЕ</b></p>
                    <p className="rounded-2xl border-2 border-[#2A363C] bg-[#161F23] p-3 text-sm font-bold text-[#F2F7FB]">
                        🤷 Если чего-то не знаешь — просто честно ответь <b className="text-[#C385F7]">«пока не знаю»</b>. Я тебя научу <Heart className="inline h-4 w-4 fill-[#BC418A] text-[#BC418A]" />
                    </p>
                    <p className="flex items-center gap-2 rounded-2xl border-2 border-[#2A363C] bg-[#161F23] p-3 text-sm font-bold text-[#F2F7FB]"><Timer className="h-5 w-5 text-[#53ADEF]" /> На каждую задачу 60 секунд</p>
                </div>
                <button type="button" onClick={() => { setCount(3); setPhase('count') }}
                    className="mt-6 w-full rounded-2xl py-4 text-base font-black uppercase tracking-wide text-[#151F24]"
                    style={{ backgroundColor: GREEN, boxShadow: '0 5px 0 #7DA83D' }}>
                    Поехали
                </button>
            </div>
        )
    }

    if (phase === 'count') {
        return (
            <div className="flex min-h-[100dvh] items-center justify-center">
                <motion.p key={count} initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                    className="text-8xl font-black" style={{ color: count === 0 ? GREEN : '#F2C35B' }}>
                    {count === 0 ? 'Поехали!' : count}
                </motion.p>
            </div>
        )
    }

    if (phase === 'done') return <ResultsView results={results} />

    return <TaskScreen key={TASKS[index].id} task={TASKS[index]} index={index} total={TASKS.length} onDone={record} />
}

const TaskScreen = ({ task, index, total, onDone }: { task: Task; index: number; total: number; onDone: (rows: Result[]) => void }) => {
    const [left, setLeft] = useState(SECONDS)
    const [typed, setTyped] = useState('')
    const [signs, setSigns] = useState<(string | null)[]>(task.item.kind === 'signs' ? task.item.rows.map(() => null) : [])
    const [flash, setFlash] = useState<Status | null>(null)
    const finished = useRef(false)

    const finish = (rows: Result[], shown: Status) => {
        if (finished.current) return
        finished.current = true
        setFlash(shown)
        setTimeout(() => onDone(rows), 650)
    }
    const single = (status: Status) => finish([{ id: task.id, status }], status)
    const signRows = (status: Status) => task.item.kind === 'signs' ? task.item.rows.map((_, i) => ({ id: `${task.id}.${i + 1}`, status })) : []

    // Пока страница не на экране (другая вкладка/приложение) — таймер стоит: иначе задания «сгорали» без ученика.
    const [visible, setVisible] = useState(true)
    useEffect(() => {
        const onVis = () => setVisible(document.visibilityState === 'visible')
        onVis()
        document.addEventListener('visibilitychange', onVis)
        return () => document.removeEventListener('visibilitychange', onVis)
    }, [])

    useEffect(() => {
        if (flash || !visible) return
        if (left <= 0) {
            task.item.kind === 'signs' ? finish(signRows('timeout'), 'timeout') : single('timeout')
            return
        }
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

    // порядок вариантов перемешан один раз (экран задания появляется только после «Поехали», без SSR)
    const choices = useMemo(() => task.item.kind === 'choice'
        ? task.item.options.map((o, i) => ({ o, i })).sort(() => Math.random() - 0.5)
        : [], [task])
    const chips = useMemo(() => task.item.kind === 'fraction' ? task.item.chips.map((c) => ({ id: c, label: c })) : [], [task])

    return (
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 pb-6 pt-4">
            {/* прогресс и таймер */}
            <div className="flex items-center gap-3">
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#2A363C]">
                    <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${(index / total) * 100}%`, background: `linear-gradient(90deg, ${VIOLET}, ${BLUE})` }} />
                </div>
                <span className="text-xs font-black text-[#9AA7B0]">{index + 1}/{total}</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
                <Timer className="h-4 w-4" style={{ color: left <= 10 ? RED : '#9AA7B0' }} />
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1E282D]">
                    <div className="h-full rounded-full transition-[width] duration-1000 ease-linear" style={{ width: `${(left / SECONDS) * 100}%`, backgroundColor: left <= 10 ? RED : '#F2C35B' }} />
                </div>
                <span className="w-7 text-right text-xs font-black tabular-nums" style={{ color: left <= 10 ? RED : '#9AA7B0' }}>{left}</span>
            </div>

            <div className="flex flex-1 flex-col justify-center py-3">
            <div className="flex justify-center">
                <span className="rounded-full border-2 border-[#2A363C] bg-[#161F23] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#9AA7B0]">
                    Задание {task.label} · {task.topic}
                </span>
            </div>
            <p className="mt-3 whitespace-pre-line text-center text-lg font-extrabold leading-snug text-[#F2F7FB]">{task.text}</p>
            {task.formula && <BigFormula tex={task.formula} />}
            {task.text2 && <p className="mt-2 text-center text-lg font-extrabold text-[#F2F7FB]">{task.text2}</p>}
            {task.formula2 && <BigFormula tex={task.formula2} />}
            {task.words && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {task.words.map((w, i) => (
                        <span key={w} className="rounded-xl border-2 border-b-4 px-3 py-1.5 text-base font-black"
                            style={{ color: WORD_COLORS[i % WORD_COLORS.length], borderColor: WORD_COLORS[i % WORD_COLORS.length], backgroundColor: `${WORD_COLORS[i % WORD_COLORS.length]}1F` }}>
                            {w}
                        </span>
                    ))}
                </div>
            )}
            {task.picture && <div className="mt-3">{task.picture}</div>}
            {task.item.kind === 'signs' && (
                        <div className="mt-4 flex flex-col gap-2">
                            {(task.item.kind === 'signs' ? task.item.rows : []).map((r, i) => (
                                <div key={i} className="flex items-center gap-2 rounded-2xl border-2 border-[#2A363C] bg-[#161F23] px-3 py-2">
                                    <span className="flex-1 text-center text-xl text-[#F2F7FB]"><Latex>{`$${r.tex}$`}</Latex></span>
                                    {(['>', '<'] as const).map((s) => (
                                        <button key={s} type="button" disabled={!!flash}
                                            onClick={() => setSigns((a) => a.map((v, j) => (j === i ? s : v)))}
                                            className="h-10 w-12 rounded-xl border-2 border-b-4 text-xl font-black"
                                            style={signs[i] === s ? { backgroundColor: BLUE, borderColor: '#428BC0', color: '#0B1114' } : { borderColor: '#3A464E', color: TEXT }}>
                                            {s}
                                        </button>
                                    ))}
                                    <span className="w-6 text-center text-xl font-black text-[#9AA7B0]">0</span>
                                </div>
                            ))}
                        </div>
            )}
            </div>

            <div className="pt-2">
                {task.item.kind === 'number' && (
                    <>
                        <div className="mb-2 flex h-12 items-center justify-center rounded-2xl border-2 text-3xl font-black"
                            style={{ borderColor: flash === 'right' ? GREEN : flash === 'wrong' ? RED : '#3A464E', color: TEXT }}>
                            {typed || <span className="text-[#3E4B52]">?</span>}
                        </div>
                        <KeyboardInput value={typed} onChange={setTyped} disabled={!!flash} showDisplay={false} allowNegative />
                        <div className="mt-3 flex gap-2">
                            <NotKnowButton onClick={notKnow} disabled={!!flash} />
                            <button type="button" onClick={submitNumber} disabled={!!flash || !typed.replace('-', '')}
                                className="flex-1 rounded-2xl py-3.5 text-base font-black uppercase text-[#151F24] disabled:opacity-40"
                                style={{ backgroundColor: GREEN, boxShadow: '0 5px 0 #7DA83D' }}>Ответить</button>
                        </div>
                    </>
                )}

                {task.item.kind === 'fraction' && (
                    <div className="flex justify-center">
                        <FormulaAssemble prefix={<span className="text-2xl text-[#F2F7FB]"><Latex>{`$${task.item.prefix}$`}</Latex></span>} layout="fraction"
                            chips={chips} correct={task.item.correct}
                            onWrong={() => single('wrong')} onSolved={(first) => single(first ? 'right' : 'wrong')} />
                    </div>
                )}

                {task.item.kind === 'choice' && (
                    <div className="grid grid-cols-2 gap-2.5">
                        {choices.map((x) => (
                            <button key={x.i} type="button" disabled={!!flash}
                                onClick={() => task.item.kind === 'choice' && single(x.i === task.item.correct ? 'right' : 'wrong')}
                                className="flex h-16 items-center justify-center rounded-2xl border-2 border-b-4 border-[#3A464E] bg-[#161F23] text-2xl text-[#F2F7FB] active:translate-y-[2px] active:border-b-2">
                                <Latex>{`$${x.o}$`}</Latex>
                            </button>
                        ))}
                    </div>
                )}

                {task.item.kind === 'signs' && (
                    <>
                        <div className="mt-3 flex gap-2">
                            <NotKnowButton onClick={notKnow} disabled={!!flash} />
                            <button type="button" onClick={submitSigns} disabled={!!flash || signs.some((v) => v === null)}
                                className="flex-1 rounded-2xl py-3.5 text-base font-black uppercase text-[#151F24] disabled:opacity-40"
                                style={{ backgroundColor: GREEN, boxShadow: '0 5px 0 #7DA83D' }}>Ответить</button>
                        </div>
                    </>
                )}

                {(task.item.kind === 'fraction' || task.item.kind === 'choice') && (
                    <div className="mt-3"><NotKnowButton onClick={notKnow} disabled={!!flash} wide /></div>
                )}
            </div>

            {flash && (
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="pointer-events-none fixed inset-x-0 top-1/3 mx-auto w-fit rounded-2xl px-5 py-3 text-lg font-black"
                    style={{ backgroundColor: flash === 'right' ? GREEN : flash === 'wrong' ? RED : '#3A464E', color: flash === 'right' ? '#0F1A0A' : '#FFFFFF' }}>
                    {flash === 'right' ? 'Верно!' : flash === 'wrong' ? 'Мимо' : flash === 'timeout' ? 'Время вышло' : 'Научим 💜'}
                </motion.div>
            )}
        </div>
    )
}

const WORD_COLORS = [GGEGE_PALETTE.raspberry.button, ORANGE, BLUE, LEAF]

// Крупная формула по центру, в рамке-«доске».
const BigFormula = ({ tex }: { tex: string }) => (
    <div className="mt-3 flex justify-center">
        <div className="max-w-full overflow-x-auto rounded-2xl border-2 border-[#2A363C] bg-[#161F23] px-5 py-3 text-[28px] leading-none text-[#F2F7FB]"
            style={{ boxShadow: '0 4px 0 #10171B' }}>
            <Latex>{`$\\displaystyle ${tex}$`}</Latex>
        </div>
    </div>
)

const NotKnowButton = ({ onClick, disabled, wide }: { onClick: () => void; disabled: boolean; wide?: boolean }) => (
    <button type="button" onClick={onClick} disabled={disabled}
        className={`${wide ? 'w-full' : 'shrink-0 px-4'} rounded-2xl border-2 border-b-4 border-[#3A464E] py-3 text-sm font-black text-[#C9D3D9] active:translate-y-[2px] active:border-b-2`}>
        🤷 Пока не знаю
    </button>
)

const STATUS_VIEW: Record<Status, { icon: React.ReactNode; color: string; label: string }> = {
    right: { icon: <Check className="h-4 w-4" />, color: GREEN, label: 'знает' },
    wrong: { icon: <X className="h-4 w-4" />, color: RED, label: 'ошибка' },
    unknown: { icon: <HelpCircle className="h-4 w-4" />, color: VIOLET, label: 'пока не знает' },
    timeout: { icon: <Hourglass className="h-4 w-4" />, color: ORANGE, label: 'не успел' },
}

const ResultsView = ({ results }: { results: Result[] }) => {
    const right = results.filter((r) => r.status === 'right').length
    const byTask = TASKS.map((t) => {
        const rows = results.filter((r) => r.id === t.id || r.id.startsWith(`${t.id}.`))
        const status: Status = rows.every((r) => r.status === 'right') ? 'right'
            : rows.some((r) => r.status === 'unknown') ? 'unknown'
            : rows.some((r) => r.status === 'timeout') ? 'timeout' : 'wrong'
        return { t, status, rows }
    })
    return (
        <div className="mx-auto w-full max-w-md px-4 pb-10 pt-8">
            <p className="text-center text-xs font-black uppercase tracking-wide text-[#9AA7B0]">База проверена</p>
            <p className="mt-1 text-center text-5xl font-black text-[#F2C35B]">{right}<span className="text-2xl text-[#9AA7B0]"> / {results.length}</span></p>
            <p className="text-center text-sm font-bold text-[#9AA7B0]">ответов верно</p>
            <div className="mt-5 flex flex-col gap-1.5">
                {byTask.map(({ t, status, rows }) => {
                    const v = STATUS_VIEW[status]
                    return (
                        <div key={t.id} className="flex items-center gap-2.5 rounded-xl border-2 border-[#232F34] bg-[#161F23] px-3 py-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${v.color}33`, color: v.color }}>{v.icon}</span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-bold text-[#F2F7FB]">{t.label}. {t.topic}</span>
                                {status !== 'right' && (
                                    <span className="block text-xs font-bold text-[#9AA7B0]">Ответ: <span className="text-[#F2F7FB]"><Latex>{`$${t.answerTex}$`}</Latex></span></span>
                                )}
                            </span>
                            <span className="shrink-0 text-xs font-black" style={{ color: v.color }}>
                                {rows.length > 1 ? `${rows.filter((r) => r.status === 'right').length}/${rows.length}` : v.label}
                            </span>
                        </div>
                    )
                })}
            </div>
            <p className="mt-4 text-center text-[11px] font-bold text-[#5C6B73]">Тестовая версия: результаты пока не сохраняются.</p>
        </div>
    )
}
