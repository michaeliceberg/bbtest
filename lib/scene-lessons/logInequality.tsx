'use client'

// Логарифмы → «Логарифмические неравенства» (ЕГЭ №16, вторая часть).
//   1. Знак log_a b: правило единицы — a и b по одну сторону от 1 → > 0, по разные → < 0 (числовая прямая, 0 выколот).
//   2. Игры на прямой: двигаешь b (a закреплён), двигаешь a, двигаешь оба, угадай знак.
//   3. log_{f(x)} g(x) ∨ 0 ⇔ система: f > 0, g > 0, f ≠ 1, (f − 1)(g − 1) ∨ 0 — собираешь из кнопок.

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css'
import { Note, type Part, type Scene, type SysRow } from '@/components/geometry/scene-engine'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors'
import type { SceneLesson } from './types'

const A_COL = GGEGE_PALETTE.purple.button  // основание
const B_COL = GGEGE_PALETTE.teal.button    // аргумент
const W = 320, X0 = 22, PX = 92            // 0 → x = 22, единица = 92px, прямая до 3
const X = (v: number) => X0 + v * PX
const V_MIN = 0.12, V_MAX = 2.9
const fmt = (v: number) => (Math.round(v * 10) / 10).toString().replace('.', '{,}')
const signOf = (a: number, b: number): 'pos' | 'neg' => ((a - 1) * (b - 1) > 0 ? 'pos' : 'neg')

type Mov = 'a' | 'b' | 'both' | 'none'
const NumberLine = ({ a, b, movable = 'none', onMove, onRelease }: {
    a: number; b: number; movable?: Mov; onMove?: (which: 'a' | 'b', v: number) => void; onRelease?: () => void
}) => {
    const svgRef = useRef<SVGSVGElement>(null)
    const [drag, setDrag] = useState<'a' | 'b' | null>(null)
    const valueAt = (clientX: number) => {
        const r = svgRef.current!.getBoundingClientRect()
        let v = (((clientX - r.left) / r.width) * W - X0) / PX
        v = Math.min(V_MAX, Math.max(V_MIN, v))
        if (Math.abs(v - 1) < 0.07) v = v < 1 ? 0.93 : 1.07   // ровно 1 нельзя
        return v
    }
    const canMove = (w: 'a' | 'b') => movable === 'both' || movable === w
    const down = (e: React.PointerEvent, w: 'a' | 'b' | null) => {
        if (movable === 'none') return
        let which = w
        if (!which || !canMove(which)) {
            // тап по прямой двигает ближайшую подвижную точку
            const v = valueAt(e.clientX)
            which = movable === 'both' ? (Math.abs(v - a) <= Math.abs(v - b) ? 'a' : 'b') : (movable as 'a' | 'b')
        }
        setDrag(which)
        svgRef.current?.setPointerCapture(e.pointerId)
        onMove?.(which, valueAt(e.clientX))
    }
    const marker = (w: 'a' | 'b', v: number, c: string) => (
        <g style={{ cursor: canMove(w) ? 'grab' : undefined }} onPointerDown={(e) => { e.stopPropagation(); down(e, w) }}>
            <circle cx={X(v)} cy={52} r={22} fill="transparent" />
            <circle cx={X(v)} cy={52} r={canMove(w) ? 11 : 9} fill={c} stroke="#131D22" strokeWidth={2.5} />
            {canMove(w) && <circle cx={X(v)} cy={52} r={16} fill="none" stroke={c} strokeWidth={2} className="animate-sel-pulse" />}
            <text x={X(v)} y={w === 'a' ? 24 : 86} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={900} fontStyle="italic" fill={c}
                style={{ fontFamily: 'var(--font-nunito), sans-serif', pointerEvents: 'none' }}>{w}</text>
        </g>
    )
    return (
        <svg ref={svgRef} viewBox={`0 0 ${W} 104`} className="w-full max-w-[380px] select-none touch-none overflow-visible"
            onPointerDown={(e) => down(e, null)}
            onPointerMove={(e) => { if (drag) onMove?.(drag, valueAt(e.clientX)) }}
            onPointerUp={() => { if (drag) { setDrag(null); onRelease?.() } }}>
            <rect x={X(0)} y={44} width={PX} height={16} rx={4} fill="rgba(83,173,239,0.10)" />
            <rect x={X(1)} y={44} width={X(3) - X(1)} height={16} rx={4} fill="rgba(240,155,56,0.08)" />
            <line x1={X0 - 6} y1={52} x2={W - 4} y2={52} stroke="#F2F7FB" strokeWidth={3} />
            <path d={`M ${W - 4} 52 L ${W - 14} 46 L ${W - 14} 58 Z`} fill="#F2F7FB" />
            <circle cx={X(0)} cy={52} r={6} fill="#131D22" stroke="#F2F7FB" strokeWidth={2.5} />
            <text x={X(0)} y={74} textAnchor="middle" fill="#8FA3AE" fontSize={15} fontWeight={900}>0</text>
            <line x1={X(1)} y1={40} x2={X(1)} y2={64} stroke="#F2C35B" strokeWidth={4} strokeLinecap="round" />
            <text x={X(1)} y={78} textAnchor="middle" fill="#F2C35B" fontSize={17} fontWeight={900}>1</text>
            {marker('a', a, A_COL)}
            {marker('b', b, B_COL)}
        </svg>
    )
}
const LogSign = ({ a, b, glow }: { a: number; b: number; glow?: 'ok' | 'bad' | null }) => (
    <div className="w-full text-center text-2xl font-black"
        style={{ color: glow === 'ok' ? '#A1D151' : glow === 'bad' ? '#DC605B' : '#F2F7FB' }}>
        <Latex>{`$\\log_{\\color{${A_COL}}{${fmt(a)}}} {\\color{${B_COL}}{${fmt(b)}}} ${signOf(a, b) === 'pos' ? '> 0' : '< 0'}$`}</Latex>
    </div>
)

type LineRound = { prompt: string; a: number; b: number; movable: 'a' | 'b' | 'both'; target: 'pos' | 'neg'; ok: string }
const LineGame = ({ rounds, onDone }: { rounds: LineRound[]; onDone: () => void }) => {
    const [r, setR] = useState(0)
    const [a, setA] = useState(rounds[0].a)
    const [b, setB] = useState(rounds[0].b)
    const [state, setState] = useState<'idle' | 'ok' | 'bad'>('idle')
    const round = rounds[r]
    const release = () => {
        if (state === 'ok') return
        if (signOf(a, b) === round.target) {
            setState('ok'); showAnswerMeme(true)
            setTimeout(() => {
                if (r + 1 >= rounds.length) { onDone(); return }
                const n = rounds[r + 1]
                setR(r + 1); setA(n.a); setB(n.b); setState('idle')
            }, 1700)
        } else { setState('bad'); playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false) }
    }
    return (
        <div className="w-full flex flex-col items-center gap-2">
            <motion.div key={r} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="w-full text-center text-lg md:text-xl font-black text-[#F2F7FB]">
                <Latex>{round.prompt}</Latex> <span className="text-sm font-bold text-[#5C6B73]">{r + 1}/{rounds.length}</span>
            </motion.div>
            <NumberLine a={a} b={b} movable={state === 'ok' ? 'none' : round.movable}
                onMove={(w, v) => { if (state === 'bad') setState('idle'); if (w === 'a') setA(v); else setB(v) }} onRelease={release} />
            <LogSign a={a} b={b} glow={state === 'ok' ? 'ok' : state === 'bad' ? 'bad' : null} />
            {state === 'ok' && <Note ok>{round.ok}</Note>}
            {state === 'bad' && <Note ok={false}>{round.target === 'pos' ? 'Нужно > 0: поставь a и b по ОДНУ сторону от 1' : 'Нужно < 0: поставь a и b по РАЗНЫЕ стороны от 1'}</Note>}
        </div>
    )
}
const lineGame = (label: string, rounds: LineRound[]): Part => ({ t: 'custom', label, render: (done) => <LineGame rounds={rounds} onDone={done} /> })

// ===== Система из 4 строчек =====
const SIGNS = ['>', '<', '≥', '≤']
const sysRows: SysRow[] = [
    [{ s: 0 }, { s: 1 }, { s: 2 }],
    [{ s: 3 }, { s: 4 }, { s: 5 }],
    [{ s: 6 }, { s: 7 }, { s: 8 }],
    ['(', { s: 9 }, '− 1)(', { s: 10 }, '− 1)', { s: 11 }, '0'],
]
const systemPart = (A: string, B: string, sign: string, prompt: string): Part => ({
    t: 'system', prompt, rows: sysRows,
    chips: [A, B, ...SIGNS, '0', '1', '≠'],
    slots: [A, '>', '0', B, '>', '0', A, '≠', '1', A, B, sign],
    sameRows: [0, 1, 2], any: [[9, 10]],
    hint: 'Основание > 0, аргумент > 0, основание ≠ 1. А в 4-й знак — как в самом неравенстве 🙃',
})
const SYSTEM_TEX = (A: string, B: string, s: string) =>
    `\\begin{cases} ${A} > 0 \\\\ ${B} > 0 \\\\ ${A} \\ne 1 \\\\ (${A} - 1)(${B} - 1) ${s} 0 \\end{cases}`

const scenes: Scene[] = [
    {
        title: 'Какой знак?', next: 'Интересненько', parts: [
            { t: 'say', text: 'Это задание №16 второй части ЕГЭ 🥷 Звучит страшно, но начнём с простого' },
            { t: 'calc', tex: '\\log_3 2' },
            { t: 'say', text: 'Он положительный или отрицательный? 🤔' },
            {
                t: 'choice', label: 'Угадай', rounds: [{
                    prompt: '$\\log_3 2$ это…', options: ['$> 0$', '$< 0$'], correct: '$> 0$',
                    hint: '3 в какой степени даёт 2? Где-то между 0 и 1 🙃', ok: 'Да! $3^{0{,}63} \\approx 2$, степень положительная',
                }],
            },
        ],
    },
    {
        title: 'Правило единицы', next: 'Правило единицы зашло', parts: [
            { t: 'fig', node: <NumberLine a={3 - 0.12} b={2} /> },
            { t: 'say', text: 'Рисуем прямую. 0 выколот: основание и аргумент всегда > 0. А 1 — граница' },
            { t: 'say', text: 'Основание 3 и аргумент 2 ОБА справа от 1. Поэтому логарифм > 0' },
            { t: 'fig', node: <NumberLine a={0.4} b={2} /> },
            { t: 'say', text: 'А если по РАЗНЫЕ стороны от 1, логарифм < 0' },
            {
                t: 'remember', title: 'ПРАВИЛО ЕДИНИЦЫ', lines: [
                    'a и b по ОДНУ сторону от 1 → $\\log_a b > 0$',
                    'a и b по РАЗНЫЕ стороны от 1 → $\\log_a b < 0$',
                    'Обе левее единицы тоже считается: $\\log_{0{,}5} 0{,}2 > 0$',
                ],
            },
        ],
    },
    {
        title: 'Двигай b', next: 'b слушается', parts: [
            { t: 'say', text: 'Основание a приклеено. Тащи аргумент b пальцем 👆' },
            lineGame('Двигай по прямой', [
                { prompt: 'Сделай логарифм ОТРИЦАТЕЛЬНЫМ', a: 2.4, b: 1.8, movable: 'b', target: 'neg', ok: 'Разные стороны от 1, минус 😈' },
                { prompt: 'Теперь ПОЛОЖИТЕЛЬНЫМ', a: 0.4, b: 2.2, movable: 'b', target: 'pos', ok: 'Оба слева от 1, плюс 😇' },
                { prompt: 'И снова ОТРИЦАТЕЛЬНЫМ', a: 0.6, b: 0.3, movable: 'b', target: 'neg', ok: 'Красава! 🔥' },
            ]),
        ],
    },
    {
        title: 'Двигай a', next: 'a тоже слушается', parts: [
            { t: 'say', text: 'Теперь приклеен b. Двигаем основание a' },
            lineGame('Двигай по прямой', [
                { prompt: 'Сделай ПОЛОЖИТЕЛЬНЫМ', a: 2, b: 0.5, movable: 'a', target: 'pos', ok: 'Оба левее 1 👌' },
                { prompt: 'Сделай ОТРИЦАТЕЛЬНЫМ', a: 1.6, b: 2.5, movable: 'a', target: 'neg', ok: 'Разбежались по разные стороны 💔' },
            ]),
        ],
    },
    {
        title: 'Двигай оба', next: 'Я повелитель прямой', parts: [
            { t: 'say', text: 'Свобода! Двигай обе точки 🕹️' },
            lineGame('Двигай по прямой', [
                { prompt: 'Сделай ОТРИЦАТЕЛЬНЫМ', a: 2, b: 2.5, movable: 'both', target: 'neg', ok: 'Минус получен 😈' },
                { prompt: 'Сделай ПОЛОЖИТЕЛЬНЫМ', a: 0.4, b: 2, movable: 'both', target: 'pos', ok: 'Плюс получен 😇' },
            ]),
        ],
    },
    {
        title: 'Угадай знак', next: 'Знаки чую', parts: [
            {
                t: 'choice', label: 'Плюс или минус?', rounds: [
                    { prompt: '$\\log_{0{,}3} 5$', options: ['$> 0$', '$< 0$'], correct: '$< 0$', hint: '0,3 слева от 1, а 5 справа 🙃', ok: 'Разные стороны, минус' },
                    { prompt: '$\\log_{0{,}5} 0{,}2$', options: ['$> 0$', '$< 0$'], correct: '$> 0$', hint: 'Оба левее единицы 🙃', ok: 'Оба слева, плюс' },
                    { prompt: '$\\log_7 3$', options: ['$> 0$', '$< 0$'], correct: '$> 0$', hint: 'Оба правее единицы 🙃', ok: 'Оба справа, плюс' },
                    { prompt: '$\\log_2 0{,}9$', options: ['$> 0$', '$< 0$'], correct: '$< 0$', hint: '0,9 — это меньше 1! 🙃', ok: '0,9 чуть-чуть не дотянул до 1, минус' },
                    { prompt: '$\\log_{\\frac13} 4$', options: ['$> 0$', '$< 0$'], correct: '$< 0$', hint: '⅓ слева, 4 справа 🙃', ok: 'Минус 😎' },
                ],
            },
        ],
    },
    {
        title: 'Выражения вместо чисел', next: 'Не паникую', parts: [
            { t: 'say', text: 'А в ЕГЭ вместо чисел — выражения с x 😱' },
            { t: 'calc', tex: '\\log_{x-1}(12x+5) \\le 0' },
            { t: 'say', text: 'Не паникуем! Это разбирается на систему из 4 строчек' },
            { t: 'card', title: 'Система', tex: SYSTEM_TEX('x-1', '12x+5', '\\le') },
        ],
    },
    {
        title: 'Откуда 4 строчки', next: 'Логика ясна', parts: [
            {
                t: 'remember', title: '4 СТРОЧКИ', lines: [
                    '1. Основание > 0',
                    '2. Аргумент > 0',
                    '3. Основание ≠ 1',
                    '4. (основание − 1)(аргумент − 1) и знак как в неравенстве',
                ],
            },
            { t: 'say', text: '4-я строчка — это наше правило единицы! Скобки разных знаков, значит по разные стороны от 1 😎' },
            { t: 'say', text: 'Умное название — «метод рационализации». Можно пугать им одноклассников 😏' },
        ],
    },
    {
        title: 'Собери систему 1', next: 'Систему собрал', parts: [
            { t: 'calc', tex: '\\log_{x-1}(12x+5) \\le 0' },
            systemPart('x − 1', '12x + 5', '≤', 'Собери систему из кнопок 👇'),
        ],
    },
    {
        title: 'Собери систему 2', next: 'Ещё одну!', parts: [
            { t: 'calc', tex: '\\log_{x}(x+3) > 0' },
            systemPart('x', 'x + 3', '>', 'Основание тут просто x 👇'),
        ],
    },
    {
        title: 'Собери систему 3', next: 'Изи', parts: [
            { t: 'calc', tex: '\\log_{2x+1}(5-x) \\ge 0' },
            systemPart('2x + 1', '5 − x', '≥', 'Знак теперь ≥. Не перепутай 👀'),
        ],
    },
    {
        title: 'Собери систему 4', next: 'Я рационализатор 😎', parts: [
            { t: 'calc', tex: '\\log_{x+2} x^2 < 0' },
            systemPart('x + 2', 'x²', '<', 'Последний босс этой сцены 👹'),
        ],
    },
]

export const LOG_INEQUALITY: SceneLesson = {
    question: 'Логарифмические неравенства',
    mascot: 'Логарифмические неравенства',
    last: '№16 мне по зубам!',
    scenes,
    trials: [
        { tag: 'Знак', text: '$\\log_{0{,}2} 7$ — какой знак?', options: ['$> 0$', '$< 0$'], answer: '$< 0$', hint: '0,2 и 7 по разные стороны от 1 🙃' },
        { tag: 'Знак', text: '$\\log_{0{,}4} 0{,}1$ — какой знак?', options: ['$> 0$', '$< 0$'], answer: '$> 0$', hint: 'Оба левее единицы 🙃' },
        { tag: 'Лишнее условие', text: 'Какого условия НЕТ в системе для $\\log_{x-2}(x+4) \\le 0$?', options: ['$x-2>0$', '$x+4>0$', '$x-2\\ne 1$', '$x+4\\ne 1$'], answer: '$x+4\\ne 1$', hint: 'Аргумент может быть равен 1, тогда логарифм просто 0 🙃' },
        { tag: '4-я строчка', text: '$\\log_x(3x-1) \\ge 0$. Четвёртая строчка системы:', options: ['$(x-1)(3x-2)\\ge 0$', '$(x-1)(3x-1)\\ge 0$', '$(x-1)(3x-2)\\le 0$', '$x(3x-1)\\ge 0$'], answer: '$(x-1)(3x-2)\\ge 0$', hint: 'Из основания и аргумента вычитаем по 1, знак тот же 🙃' },
        { tag: '4-я строчка', text: '$\\log_{x+1}(5-x) < 0$. Четвёртая строчка:', options: ['$x(4-x)<0$', '$(x+1)(5-x)<0$', '$x(4-x)>0$', '$x(6-x)<0$'], answer: '$x(4-x)<0$', hint: '$(x+1-1) = x$, $(5-x-1) = 4-x$ 🙃' },
    ],
}
