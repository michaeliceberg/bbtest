'use client'

// Планиметрия → «Треугольник» → «6 площадей» (AREA6WALK): шесть формул площади треугольника.
//   1. S = ½·a·h — треугольник это половина прямоугольника.
//   2. S = ½·a·b·sin γ — высота = сторона · sin угла.
//   3. Герон — когда знаем только 3 стороны.
//   4. S = abc / 4R — описанная окружность.
//   5. S = p·r — вписанная окружность режет треугольник на 3 части.
//   6. Пик — треугольник на клетчатой бумаге.
// Сцены 1, 2, 3, 5 — на одном треугольнике 13-14-15: каждая формула даёт 84 (главная «вау»-мысль).
// Затем 6 заданий «пробуй, пока не угадаешь» — по одному на формулу.

import { Fragment, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { QuestionType } from './page'
import {
    DiagramBlock,
    walkthroughButtonClass, walkthroughButtonStyle,
    SceneWrapper, useSceneFocus, useReplayNonces, BackButton, ReplayButton,
    pickWrongTryPhrase, pickFunNextLabel, LocalAnswerConfetti, CORRECT_FEEDBACK_PHRASES, useWalkthroughCombo,
    AdminSceneMap, MAP_INTRO_COLOR, MAP_PRACTICE_COLOR, type AdminMapEntry,
} from '@/components/geometry/WalkthroughLog'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { Typewriter } from '@/components/geometry/Typewriter'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css'

const SCENE_TRANSITION_PAUSE_MS = 1000

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}
type SceneProps = { onSettled?: () => void }

const LINE = '#F2F7FB'
const H_COLOR = GGEGE_PALETTE.orange.button   // высота / «смотри сюда»
const ANGLE_COLOR = GGEGE_PALETTE.blue.button // угол
const SIDE_A = GGEGE_PALETTE.teal.button
const SIDE_B = GGEGE_PALETTE.green.button
const CIRCLE_COLOR = GGEGE_PALETTE.purple.button
const OK_COLOR = '#A1D151'
const PIECE = [GGEGE_PALETTE.blue.button, GGEGE_PALETTE.raspberry.button, GGEGE_PALETTE.green.button]

type Pt = { x: number; y: number }
const poly = (ps: Pt[]) => ps.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
const mid = (p: Pt, q: Pt): Pt => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 })

// ===== Треугольник 13-14-15 (BC = 14, AB = 13, AC = 15, высота из A = 12), масштаб 18 =====
const K = 18
const B: Pt = { x: 28, y: 236 }, C: Pt = { x: 28 + 14 * K, y: 236 }, A: Pt = { x: 28 + 5 * K, y: 236 - 12 * K }
const H: Pt = { x: A.x, y: B.y } // основание высоты
const I: Pt = { x: 28 + 6 * K, y: 236 - 4 * K } // центр вписанной окружности, r = 4
const R_IN = 4 * K
// Точки касания вписанной окружности: на BC, на AC, на AB.
const footOn = (p: Pt, q: Pt, o: Pt): Pt => {
    const dx = q.x - p.x, dy = q.y - p.y
    const t = ((o.x - p.x) * dx + (o.y - p.y) * dy) / (dx * dx + dy * dy)
    return { x: p.x + dx * t, y: p.y + dy * t }
}
const T_BC = footOn(B, C, I), T_AC = footOn(A, C, I), T_AB = footOn(A, B, I)

// ===== Прямоугольный 6-8-10 (для abc/4R), масштаб 22: прямой угол в C =====
const K2 = 22
const RC: Pt = { x: 48, y: 222 }, RA: Pt = { x: 48, y: 222 - 6 * K2 }, RB: Pt = { x: 48 + 8 * K2, y: 222 }
const RO = mid(RA, RB) // центр описанной — середина гипотенузы
const RR = 5 * K2

const Label = ({ p, children, color = LINE, size = 18 }: { p: Pt; children: React.ReactNode; color?: string; size?: number }) => (
    <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fill={color} fontSize={size} fontWeight={900}
        style={{ fontFamily: 'var(--font-nunito), sans-serif', paintOrder: 'stroke', stroke: '#131D22', strokeWidth: 4 }}>{children}</text>
)
// Текст на рисунке с отскоком (позиция на статичном <g>: framer перезаписывает transform у motion-узла).
const SvgPop = ({ p, children, color = LINE, size = 20 }: { p: Pt; children: React.ReactNode; color?: string; size?: number }) => (
    <g transform={`translate(${p.x} ${p.y})`}>
        <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 11 }}>
            <Label p={{ x: 0, y: 0 }} color={color} size={size}>{children}</Label>
        </motion.g>
    </g>
)
const Seg = ({ p, q, color = LINE, w = 4, draw = false, delay = 0, dash }: { p: Pt; q: Pt; color?: string; w?: number; draw?: boolean; delay?: number; dash?: string }) => (
    <motion.line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash}
        initial={{ pathLength: draw ? 0 : 1 }} animate={{ pathLength: 1 }} transition={{ duration: draw ? 0.7 : 0, delay, ease: 'easeOut' }} />
)
const RightMark = ({ at, ux, uy, vx, vy, color = LINE }: { at: Pt; ux: number; uy: number; vx: number; vy: number; color?: string }) => {
    const s = 12
    return <path d={`M ${at.x + ux * s} ${at.y + uy * s} L ${at.x + (ux + vx) * s} ${at.y + (uy + vy) * s} L ${at.x + vx * s} ${at.y + vy * s}`}
        fill="none" stroke={color} strokeWidth={2.5} />
}

const Tri1314 = ({ sides = true }: { sides?: boolean }) => (
    <>
        <polygon points={poly([A, B, C])} fill="none" stroke={LINE} strokeWidth={4} strokeLinejoin="round" />
        <Label p={{ x: A.x, y: A.y - 14 }}>A</Label>
        <Label p={{ x: B.x - 12, y: B.y + 12 }}>B</Label>
        <Label p={{ x: C.x + 12, y: C.y + 12 }}>C</Label>
        {sides && <>
            <Label p={{ x: mid(B, C).x + 40, y: B.y + 18 }} size={17}>14</Label>
            <Label p={{ x: mid(A, B).x - 16, y: mid(A, B).y - 4 }} size={17}>13</Label>
            <Label p={{ x: mid(A, C).x + 16, y: mid(A, C).y - 6 }} size={17}>15</Label>
        </>}
    </>
)

const Svg = ({ children, h = 262 }: { children: React.ReactNode; h?: number }) => (
    <div className="w-full flex justify-center">
        <svg viewBox={`0 0 310 ${h}`} className="w-full max-w-[320px] overflow-visible">{children}</svg>
    </div>
)

const TypedBig = ({ text, onDone, readMs = 400, small }: { text: string; onDone?: () => void; readMs?: number; small?: boolean }) => (
    <div className={cn('w-full text-center font-black text-[#F2F7FB]', small ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl')}>
        <Typewriter text={text} onDone={() => setTimeout(() => onDone?.(), readMs)} />
    </div>
)
const PauseThen = ({ ms, onDone }: { ms: number; onDone: () => void }) => {
    useEffect(() => {
        const t = setTimeout(onDone, ms)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return null
}
// Карточка формулы — золотая рамка, формула KaTeX, появляется с отскоком.
const FormulaCard = ({ tex, title }: { tex: string; title: string }) => (
    <motion.div className="w-full rounded-2xl border-2 px-4 py-3 flex flex-col items-center gap-1"
        style={{ borderColor: 'rgba(232,182,54,0.85)', backgroundColor: '#161F23', boxShadow: '0 0 14px -4px rgba(232,182,54,0.45)' }}
        initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 13 }}>
        <div className="text-xs font-black uppercase tracking-wide text-[#F2C35B]">{title}</div>
        <div className="text-2xl md:text-3xl text-[#F2F7FB]"><Latex>{`$${tex}$`}</Latex></div>
    </motion.div>
)
// Строка-вычисление крупно.
const CalcLine = ({ tex }: { tex: string }) => (
    <motion.div className="w-full text-center text-xl md:text-2xl text-[#F2F7FB]"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Latex>{`$${tex}$`}</Latex>
    </motion.div>
)

// Мини-игра «выбери вариант»: неверный — красный, попытка не блокируется; в ошибки урока не идёт.
const ChoiceRow = ({ options, correct, hint, onDone }: { options: string[]; correct: string; hint: string; onDone: () => void }) => {
    const [wrong, setWrong] = useState<string[]>([])
    const [done, setDone] = useState(false)
    return (
        <div className="w-full flex flex-col gap-2">
            <div className="drop-in-options grid grid-cols-3 gap-3 w-full">
                {options.map((o) => {
                    const isWrong = wrong.includes(o)
                    const isRight = done && o === correct
                    return (
                        <button key={o} type="button" disabled={isWrong || done}
                            onClick={() => {
                                if (o === correct) { setDone(true); showAnswerMeme(true); setTimeout(onDone, 500) }
                                else { setWrong((w) => [...w, o]); playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false) }
                            }}
                            className={cn('min-h-[56px] rounded-xl border-2 border-b-4 text-xl font-black transition-colors',
                                isRight ? 'border-[#A1D151] bg-[#A1D15122] text-[#A1D151]'
                                    : isWrong ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]'
                                        : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                            {o}
                        </button>
                    )
                })}
            </div>
            {!done && wrong.length > 0 && (
                <div className="rounded-xl px-4 py-2 font-bold w-full text-center bg-[#DC605B22] text-[#DC605B]">{hint}</div>
            )}
        </div>
    )
}
const useSteps = () => {
    const [phase, setPhase] = useState(0)
    const next = (n: number) => () => setPhase((p) => Math.max(p, n))
    return { phase, setPhase, next }
}

// ===== 1. ½·a·h =====
const HalfAhScene = ({ onSettled }: SceneProps) => {
    const { phase, setPhase, next } = useSteps()
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(next(1), 500)}>
                <Svg>
                    {phase >= 2 && (
                        <>
                            {/* прямоугольник 14 × 12 вокруг треугольника; две «лишние» части — бледные */}
                            <motion.polygon points={poly([B, { x: B.x, y: A.y }, A])} fill={hexToRgba(H_COLOR, 0.18)}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.6 }} />
                            <motion.polygon points={poly([C, { x: C.x, y: A.y }, A])} fill={hexToRgba(H_COLOR, 0.18)}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.9 }} />
                            <motion.polygon points={poly([B, { x: B.x, y: A.y }, { x: C.x, y: A.y }, C])} fill="none" stroke={H_COLOR} strokeWidth={2.5} strokeDasharray="7 6"
                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9 }} />
                        </>
                    )}
                    <polygon points={poly([A, B, C])} fill={phase >= 2 ? hexToRgba(SIDE_A, 0.28) : 'none'} />
                    <Tri1314 sides={false} />
                    <Label p={{ x: mid(B, C).x + 40, y: B.y + 18 }} size={17} color={SIDE_A}>a = 14</Label>
                    {phase >= 1 && <>
                        <Seg p={A} q={H} color={H_COLOR} w={3} dash="7 6" draw />
                        <RightMark at={H} ux={1} uy={0} vx={0} vy={-1} color={H_COLOR} />
                        <SvgPop p={{ x: A.x - 34, y: mid(A, H).y + 20 }} color={H_COLOR}>h = 12</SvgPop>
                    </>}
                </Svg>
            </DiagramBlock>
            {phase >= 1 && <PauseThen ms={1300} onDone={next(2)} />}
            {phase >= 2 && <TypedBig small text="Треугольник — ровно ПОЛОВИНА прямоугольника" onDone={next(3)} />}
            {phase >= 3 && <FormulaCard title="Формула 1" tex="S = \dfrac{1}{2}\cdot a\cdot h" />}
            {phase >= 3 && <PauseThen ms={900} onDone={next(4)} />}
            {phase >= 4 && <CalcLine tex="S = \tfrac{1}{2}\cdot 14\cdot 12 = \;?" />}
            {phase === 4 && <ChoiceRow options={['84', '168', '42']} correct="84" hint="Не забудь ½ 🙃" onDone={() => setPhase(5)} />}
            {phase >= 5 && <TypedBig text="S = 84 ✅" onDone={() => onSettled?.()} readMs={300} />}
        </>
    )
}

// ===== 2. ½·a·b·sin γ =====
const SinScene = ({ onSettled }: SceneProps) => {
    const { phase, setPhase, next } = useSteps()
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(next(1), 500)}>
                <Svg>
                    {phase >= 3 && <motion.polygon points={poly([A, B, H])} fill={hexToRgba(H_COLOR, 0.2)}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} />}
                    <path d={`M ${B.x + 30} ${B.y} A 30 30 0 0 0 ${B.x + 30 * 5 / 13} ${B.y - 30 * 12 / 13}`} fill={hexToRgba(ANGLE_COLOR, 0.35)} stroke={ANGLE_COLOR} strokeWidth={3} />
                    <Tri1314 sides={false} />
                    <Seg p={B} q={C} color={SIDE_A} w={6} />
                    <Seg p={B} q={A} color={SIDE_B} w={6} />
                    <Label p={{ x: mid(B, C).x + 40, y: B.y + 18 }} size={17} color={SIDE_A}>a = 14</Label>
                    <Label p={{ x: mid(A, B).x - 26, y: mid(A, B).y - 4 }} size={17} color={SIDE_B}>b = 13</Label>
                    <Label p={{ x: B.x + 46, y: B.y - 20 }} size={17} color={ANGLE_COLOR}>γ</Label>
                    {phase >= 3 && <>
                        <Seg p={A} q={H} color={H_COLOR} w={3} dash="7 6" draw />
                        <RightMark at={H} ux={1} uy={0} vx={0} vy={-1} color={H_COLOR} />
                        <SvgPop p={{ x: A.x + 50, y: A.y + 162 }} color={H_COLOR} size={18}>h = b·sin γ</SvgPop>
                    </>}
                </Svg>
            </DiagramBlock>
            {phase >= 1 && <TypedBig small text="Знаем 2 стороны и угол МЕЖДУ ними" onDone={next(2)} />}
            {phase >= 2 && <PauseThen ms={700} onDone={next(3)} />}
            {phase >= 3 && <TypedBig small text="А высота h = b · sin γ" onDone={next(4)} />}
            {phase >= 4 && <FormulaCard title="Формула 2" tex="S = \dfrac{1}{2}\cdot a\cdot b\cdot \sin\gamma" />}
            {phase >= 4 && <PauseThen ms={900} onDone={next(5)} />}
            {phase >= 5 && <CalcLine tex="\sin\gamma = \tfrac{12}{13}" />}
            {phase >= 5 && <CalcLine tex="S = \tfrac{1}{2}\cdot 14\cdot 13\cdot \tfrac{12}{13} = \;?" />}
            {phase === 5 && <ChoiceRow options={['84', '182', '156']} correct="84" hint="13 сократится: ½ · 14 · 12 🙃" onDone={() => setPhase(6)} />}
            {phase >= 6 && <TypedBig text="Опять 84 😏" onDone={() => onSettled?.()} readMs={300} />}
        </>
    )
}

// ===== 3. Герон =====
const HeronScene = ({ onSettled }: SceneProps) => {
    const { phase, setPhase, next } = useSteps()
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(next(1), 500)}>
                <Svg>
                    <Tri1314 />
                    {phase >= 1 && <>
                        <Seg p={B} q={C} color={SIDE_A} w={6} draw />
                        <Seg p={C} q={A} color={SIDE_B} w={6} draw delay={0.5} />
                        <Seg p={A} q={B} color={PIECE[1]} w={6} draw delay={1} />
                    </>}
                </Svg>
            </DiagramBlock>
            {phase >= 1 && <TypedBig small text="Знаем ТОЛЬКО 3 стороны. Тогда — формула Герона" onDone={next(2)} />}
            {phase >= 2 && <TypedBig small text="Сначала полупериметр p: половина суммы сторон" onDone={next(3)} readMs={200} />}
            {phase >= 3 && <CalcLine tex="p = \dfrac{13 + 14 + 15}{2} = \;?" />}
            {phase === 3 && <ChoiceRow options={['21', '42', '14']} correct="21" hint="Сумма 42, а нам нужна половина 🙃" onDone={() => setPhase(4)} />}
            {phase >= 4 && <FormulaCard title="Формула 3 · Герон" tex="S = \sqrt{p(p-a)(p-b)(p-c)}" />}
            {phase >= 4 && <PauseThen ms={1200} onDone={next(5)} />}
            {phase >= 5 && <CalcLine tex="S = \sqrt{21\cdot 8\cdot 7\cdot 6} = \sqrt{7056} = 84" />}
            {phase >= 5 && <PauseThen ms={900} onDone={next(6)} />}
            {phase >= 6 && <TypedBig text="И снова 84 🤯" onDone={() => onSettled?.()} readMs={300} />}
        </>
    )
}

// ===== 4. abc / 4R =====
const CircumScene = ({ onSettled }: SceneProps) => {
    const { phase, setPhase, next } = useSteps()
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(next(1), 500)}>
                <Svg h={272}>
                    {phase >= 1 && <motion.circle cx={RO.x} cy={RO.y} r={RR} fill="none" stroke={CIRCLE_COLOR} strokeWidth={3}
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: 'easeInOut' }} />}
                    <polygon points={poly([RA, RB, RC])} fill="none" stroke={LINE} strokeWidth={4} strokeLinejoin="round" />
                    <RightMark at={RC} ux={1} uy={0} vx={0} vy={-1} />
                    <Label p={{ x: RC.x - 16, y: mid(RA, RC).y }} size={17}>6</Label>
                    <Label p={{ x: mid(RC, RB).x, y: RC.y + 18 }} size={17}>8</Label>
                    <Label p={{ x: mid(RA, RB).x + 20, y: mid(RA, RB).y - 22 }} size={17}>10</Label>
                    {phase >= 4 && <>
                        <Seg p={RO} q={RB} color={CIRCLE_COLOR} w={3} draw />
                        <circle cx={RO.x} cy={RO.y} r={5} fill={CIRCLE_COLOR} />
                        <SvgPop p={{ x: (RO.x + RB.x) / 2 + 6, y: (RO.y + RB.y) / 2 + 18 }} color={CIRCLE_COLOR} size={18}>R = 5</SvgPop>
                    </>}
                </Svg>
            </DiagramBlock>
            {phase >= 1 && <TypedBig small text="Вокруг треугольника — описанная окружность" onDone={next(2)} />}
            {phase >= 2 && <TypedBig small text="У прямоугольного центр на СЕРЕДИНЕ гипотенузы. R = ?" onDone={next(3)} readMs={100} />}
            {phase === 3 && <ChoiceRow options={['5', '10', '4']} correct="5" hint="R — половина гипотенузы 🙃" onDone={() => setPhase(4)} />}
            {phase >= 4 && <PauseThen ms={900} onDone={next(5)} />}
            {phase >= 5 && <FormulaCard title="Формула 4" tex="S = \dfrac{a\cdot b\cdot c}{4R}" />}
            {phase >= 5 && <PauseThen ms={900} onDone={next(6)} />}
            {phase >= 6 && <CalcLine tex="S = \dfrac{6\cdot 8\cdot 10}{4\cdot 5} = \;?" />}
            {phase === 6 && <ChoiceRow options={['24', '48', '96']} correct="24" hint="480 делим на 20 🙃" onDone={() => setPhase(7)} />}
            {phase >= 7 && <TypedBig small text="Проверка: ½ · 6 · 8 = 24 ✅" onDone={() => onSettled?.()} readMs={300} />}
        </>
    )
}

// ===== 5. p · r =====
const InscribedScene = ({ onSettled }: SceneProps) => {
    const { phase, setPhase, next } = useSteps()
    const parts: Pt[][] = [[I, B, C], [I, C, A], [I, A, B]]
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(next(1), 500)}>
                <Svg>
                    {phase >= 3 && parts.map((ps, i) => (
                        <motion.polygon key={i} points={poly(ps)} fill={hexToRgba(PIECE[i], 0.4)}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: i * 0.5 }} />
                    ))}
                    {phase >= 1 && <motion.circle cx={I.x} cy={I.y} r={R_IN} fill="none" stroke={CIRCLE_COLOR} strokeWidth={3}
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: 'easeInOut' }} />}
                    <Tri1314 />
                    {phase >= 3 && <>
                        <Seg p={I} q={A} color={LINE} w={2} /><Seg p={I} q={B} color={LINE} w={2} /><Seg p={I} q={C} color={LINE} w={2} />
                    </>}
                    {phase >= 2 && <>
                        <Seg p={I} q={T_BC} color={H_COLOR} w={3} draw />
                        <Seg p={I} q={T_AC} color={H_COLOR} w={3} draw delay={0.3} />
                        <Seg p={I} q={T_AB} color={H_COLOR} w={3} draw delay={0.6} />
                        <circle cx={I.x} cy={I.y} r={5} fill={CIRCLE_COLOR} />
                        <SvgPop p={{ x: I.x + 14, y: (I.y + T_BC.y) / 2 }} color={H_COLOR} size={18}>r</SvgPop>
                    </>}
                </Svg>
            </DiagramBlock>
            {phase >= 1 && <PauseThen ms={1300} onDone={next(2)} />}
            {phase >= 2 && <TypedBig small text="Вписанная окружность: 3 радиуса r к сторонам" onDone={next(3)} />}
            {phase >= 3 && <TypedBig small text="Разрежем на 3 треугольника: у каждого высота r" onDone={next(4)} />}
            {phase >= 4 && <CalcLine tex="S = \tfrac12 a r + \tfrac12 b r + \tfrac12 c r = r\cdot\dfrac{a+b+c}{2}" />}
            {phase >= 4 && <PauseThen ms={1300} onDone={next(5)} />}
            {phase >= 5 && <FormulaCard title="Формула 5" tex="S = p\cdot r" />}
            {phase >= 5 && <PauseThen ms={900} onDone={next(6)} />}
            {phase >= 6 && <CalcLine tex="p = 21,\; r = 4:\;\; S = \;?" />}
            {phase === 6 && <ChoiceRow options={['84', '168', '25']} correct="84" hint="Просто перемножь p и r 🙃" onDone={() => setPhase(7)} />}
            {phase >= 7 && <TypedBig text="84 в четвёртый раз 😎" onDone={() => onSettled?.()} readMs={300} />}
        </>
    )
}

// ===== 6. Пик: треугольник (0,0)–(6,0)–(2,4) на клетках. В = 7, Г = 12, S = 12 =====
const CELL = 38, GX = 40, GY = 228
const gp = (x: number, y: number): Pt => ({ x: GX + x * CELL, y: GY - y * CELL })
const PICK_TRI: Pt[] = [gp(0, 0), gp(6, 0), gp(2, 4)]
const INNER = [[1, 1], [2, 1], [3, 1], [4, 1], [2, 2], [3, 2], [2, 3]]
const BORDER = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [1, 2], [2, 4], [3, 3], [4, 2], [5, 1]]
const PickScene = ({ onSettled }: SceneProps) => {
    const { phase, setPhase, next } = useSteps()
    const [inShown, setInShown] = useState(0)
    const [bShown, setBShown] = useState(0)
    useEffect(() => {
        if (phase === 3 && inShown < INNER.length) { const t = setTimeout(() => setInShown((n) => n + 1), 320); return () => clearTimeout(t) }
        if (phase === 3 && inShown >= INNER.length) { const t = setTimeout(() => setPhase(4), 700); return () => clearTimeout(t) }
        if (phase === 5 && bShown < BORDER.length) { const t = setTimeout(() => setBShown((n) => n + 1), 220); return () => clearTimeout(t) }
        if (phase === 5 && bShown >= BORDER.length) { const t = setTimeout(() => setPhase(6), 700); return () => clearTimeout(t) }
    }, [phase, inShown, bShown, setPhase])
    return (
        <>
            <DiagramBlock onSettled={() => setTimeout(next(1), 500)}>
                <Svg h={250}>
                    {Array.from({ length: 7 }, (_, i) => <line key={`v${i}`} x1={gp(i, 0).x} y1={gp(0, 0).y} x2={gp(i, 5).x} y2={gp(0, 5).y} stroke="#2A363C" strokeWidth={1.5} />)}
                    {Array.from({ length: 6 }, (_, j) => <line key={`h${j}`} x1={gp(0, j).x} y1={gp(0, j).y} x2={gp(6, j).x} y2={gp(6, j).y} stroke="#2A363C" strokeWidth={1.5} />)}
                    <polygon points={poly(PICK_TRI)} fill={hexToRgba(SIDE_A, 0.15)} stroke={LINE} strokeWidth={3.5} strokeLinejoin="round" />
                    {INNER.slice(0, inShown).map(([x, y], i) => (
                        <motion.circle key={`i${i}`} cx={gp(x, y).x} cy={gp(x, y).y} r={7} fill={ANGLE_COLOR}
                            initial={{ scale: 0 }} animate={{ scale: [0, 1.6, 1] }} transition={{ duration: 0.35 }} />
                    ))}
                    {BORDER.slice(0, bShown).map(([x, y], i) => (
                        <motion.circle key={`b${i}`} cx={gp(x, y).x} cy={gp(x, y).y} r={7} fill={H_COLOR}
                            initial={{ scale: 0 }} animate={{ scale: [0, 1.6, 1] }} transition={{ duration: 0.3 }} />
                    ))}
                </Svg>
            </DiagramBlock>
            {phase >= 1 && <TypedBig small text="Треугольник на клетках. Считаем узлы ВНУТРИ (В)..." onDone={next(3)} readMs={100} />}
            {phase >= 4 && <TypedBig small text={`В = ${INNER.length}. А теперь узлы НА ГРАНИЦЕ (Г)...`} onDone={next(5)} readMs={100} />}
            {phase >= 6 && <TypedBig small text={`Г = ${BORDER.length}`} onDone={next(7)} readMs={200} />}
            {phase >= 7 && <FormulaCard title="Формула 6 · Пик" tex="S = \text{В} + \dfrac{\text{Г}}{2} - 1" />}
            {phase >= 7 && <PauseThen ms={900} onDone={next(8)} />}
            {phase >= 8 && <CalcLine tex="S = 7 + \dfrac{12}{2} - 1 = \;?" />}
            {phase === 8 && <ChoiceRow options={['12', '18', '13']} correct="12" hint="7 + 6 − 1 🙃" onDone={() => setPhase(9)} />}
            {phase >= 9 && <TypedBig small text="Проверка: ½ · 6 · 4 = 12 ✅" onDone={() => onSettled?.()} readMs={300} />}
        </>
    )
}

// ===== Итог: все 6 формул =====
const SummaryScene = ({ onSettled }: SceneProps) => {
    useEffect(() => {
        const t = setTimeout(() => onSettled?.(), 1500)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    const rows: [string, string][] = [
        ['S = \\tfrac12 a h', 'есть высота'],
        ['S = \\tfrac12 ab\\sin\\gamma', '2 стороны и угол'],
        ['S = \\sqrt{p(p-a)(p-b)(p-c)}', '3 стороны'],
        ['S = \\dfrac{abc}{4R}', 'описанная окружность'],
        ['S = p\\,r', 'вписанная окружность'],
        ['S = \\text{В} + \\tfrac{\\text{Г}}{2} - 1', 'клетки'],
    ]
    return (
        <motion.div className="w-full rounded-2xl border-2 overflow-hidden"
            style={{ borderColor: 'rgba(232,182,54,0.85)', backgroundColor: '#161F23', boxShadow: '0 0 14px -4px rgba(232,182,54,0.45)' }}
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }}>
            <div className="py-2.5 text-center font-black text-lg tracking-wide text-[#F2C35B] border-b border-[rgba(232,182,54,0.35)]">6 ПЛОЩАДЕЙ</div>
            <div className="flex flex-col divide-y divide-[#2A363C]">
                {rows.map(([tex, when], i) => (
                    <motion.div key={i} className="flex items-center gap-3 px-3 py-1.5"
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.18 }}>
                        <span className="text-xs font-black text-[#5C6B73] w-3">{i + 1}</span>
                        <div className="flex-1 min-w-0 flex flex-col items-start">
                            <span className="text-base md:text-lg text-[#F2F7FB] whitespace-nowrap [&_.katex-display]:m-0"><Latex>{`$${tex}$`}</Latex></span>
                            <span className="text-[11px] font-bold text-[#8FA3AE]">{when}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}

const SCENES = [HalfAhScene, SinScene, HeronScene, CircumScene, InscribedScene, PickScene, SummaryScene]
const SCENE_TITLES = ['½·a·h', '½·a·b·sin', 'Герон', 'abc / 4R', 'p · r', 'Пик', 'Итог: 6 формул']
const NEXT_LABELS = ['База! Дальше', 'Синус зашёл', 'Герон, уважаю', 'Изи, R понял', 'p · r — кайф', 'Пик — топ', 'ЛЕТС ГООУ']

// ===== Тренировка: по заданию на формулу =====
type Trial = { tag: string; text: string; options: number[]; answer: number; hint: string }
const TRIALS: Trial[] = [
    { tag: '½·a·h', text: 'Основание 12, высота к нему 5. Найди площадь.', options: [30, 60, 17, 15], answer: 30, hint: 'S = ½ · a · h 🙃' },
    { tag: '½·a·b·sin', text: 'Стороны 8 и 10, угол между ними 150°. Найди площадь.', options: [20, 40, 80, 10], answer: 20, hint: 'sin 150° = ½ 🙃' },
    { tag: 'Герон', text: 'Стороны 5, 5 и 6. Найди площадь.', options: [12, 24, 15, 9], answer: 12, hint: 'p = 8, S = √(8 · 3 · 3 · 2) 🙃' },
    { tag: 'abc / 4R', text: 'Стороны 5, 12, 13, радиус описанной окружности 6,5. Найди площадь.', options: [30, 60, 15, 65], answer: 30, hint: 'S = 5 · 12 · 13 / (4 · 6,5) 🙃' },
    { tag: 'p · r', text: 'Периметр 30, радиус вписанной окружности 4. Найди площадь.', options: [60, 120, 30, 34], answer: 60, hint: 'p — это ПОЛОВИНА периметра 🙃' },
    { tag: 'Пик', text: 'Внутри треугольника 5 узлов, на границе 8. Найди площадь.', options: [8, 9, 12, 13], answer: 8, hint: 'S = В + Г/2 − 1 🙃' },
]
const pickPraise = (i: number) => CORRECT_FEEDBACK_PHRASES[(i * 5 + 2) % CORRECT_FEEDBACK_PHRASES.length]

export const TypeArea6Walk = ({ onAnswer, onComplete, isAdmin = false }: Props & { isAdmin?: boolean }) => {
    const [startStep, setStartStep] = useState(0)
    const [phase, setPhase] = useState<'intro' | 'practice'>('intro')
    const [step, setStep] = useState(0)
    const [stepReady, setStepReady] = useState(false)
    const [advancing, setAdvancing] = useState(false)
    const [hadMistake, setHadMistake] = useState(false)
    const [trialIndex, setTrialIndex] = useState(0)
    const [checked, setChecked] = useState(false)
    const [wrongTried, setWrongTried] = useState<number[]>([])
    const [wrongFlash, setWrongFlash] = useState<string | null>(null)
    const [trialNextLabel, setTrialNextLabel] = useState('Дальше')
    // Правило: сначала карточка задания, потом печатается вопрос, потом падают варианты.
    const [qShow, setQShow] = useState(false)
    const [qTyped, setQTyped] = useState(false)
    useEffect(() => {
        setQShow(false); setQTyped(false)
        if (phase !== 'practice' || checked) return
        const t = setTimeout(() => setQShow(true), 600)
        return () => clearTimeout(t)
    }, [phase, trialIndex, checked])
    const registerCombo = useWalkthroughCombo()
    const { bump: bumpNonce, nonceFor } = useReplayNonces()
    const latestSceneKey = phase === 'intro' ? `step-${step}` : `trial-${trialIndex}`
    const { isActive, sceneRef } = useSceneFocus(latestSceneKey, phase === 'intro' ? stepReady : checked)

    const handleNext = () => {
        if (advancing) return
        setAdvancing(true)
        setTimeout(() => {
            setAdvancing(false)
            if (step + 1 >= SCENES.length) { setPhase('practice'); return }
            setStep((s) => s + 1)
            setStepReady(false)
        }, SCENE_TRANSITION_PAUSE_MS)
    }
    const handleReplay = () => { bumpNonce(latestSceneKey); setStepReady(false) }
    const handleBack = () => {
        if (advancing || step === 0) return
        bumpNonce(`step-${step - 1}`)
        setStep(step - 1)
        setStepReady(false)
    }

    const answer = (v: number) => {
        const t = TRIALS[trialIndex]
        if (checked || wrongTried.includes(v)) return
        if (v === t.answer) {
            showAnswerMeme(true)
            registerCombo(wrongTried.length === 0)
            setWrongFlash(null)
            setChecked(true)
            setTrialNextLabel(trialIndex + 1 >= TRIALS.length ? 'Все 6 площадей мои!' : pickFunNextLabel())
        } else {
            playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
            setHadMistake(true)
            setWrongTried((w) => [...w, v])
            setWrongFlash(`${pickWrongTryPhrase()} ${t.hint}`)
        }
    }
    const nextTrial = () => {
        if (advancing) return
        if (trialIndex + 1 >= TRIALS.length) { onComplete(!hadMistake); onAnswer(hadMistake ? 'wrong' : 'right'); return }
        setAdvancing(true)
        setTimeout(() => {
            setAdvancing(false)
            setTrialIndex((i) => i + 1); setChecked(false); setWrongTried([]); setWrongFlash(null)
        }, 300)
    }

    const jumpTo = (key: string) => {
        setAdvancing(false); setChecked(false); setWrongTried([]); setWrongFlash(null)
        if (key.startsWith('step-')) {
            const i = Number(key.slice(5))
            bumpNonce(key)
            setPhase('intro'); setStartStep(i); setStep(i); setStepReady(false)
            return
        }
        setStartStep(SCENES.length); setStep(SCENES.length - 1)
        setTrialIndex(Number(key.slice(6))); setPhase('practice')
    }
    const mapEntries: AdminMapEntry[] = [
        ...SCENE_TITLES.map((label, i) => ({
            dotKey: `s${i}`, label, jumpKey: `step-${i}`, isActive: phase === 'intro' && step === i, color: MAP_INTRO_COLOR,
        })),
        ...TRIALS.map((tr, i) => ({
            dotKey: `t${i}`, label: `Задание ${i + 1}: ${tr.tag}`, jumpKey: `trial-${i}`, isActive: phase === 'practice' && trialIndex === i, color: MAP_PRACTICE_COLOR,
        })),
    ]

    const t = TRIALS[trialIndex]
    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            {isAdmin && <AdminSceneMap enabled entries={mapEntries} onJump={jumpTo} disabled={advancing} />}
            <div className="w-full flex flex-col gap-4">
                {SCENES.map((Scene, i) => step >= i && i >= startStep ? (
                    <SceneWrapper key={`step-${i}`} innerRef={sceneRef(`step-${i}`)} active={isActive(`step-${i}`)}>
                        <Fragment key={`step-${i}-${nonceFor(`step-${i}`)}`}>
                            <Scene onSettled={() => i === step && setStepReady(true)} />
                        </Fragment>
                    </SceneWrapper>
                ) : null)}

                {phase === 'practice' && (
                    <SceneWrapper key={`trial-${trialIndex}`} innerRef={sceneRef(`trial-${trialIndex}`)} active={isActive(`trial-${trialIndex}`)}>
                        <div className="w-full flex items-center gap-3" aria-hidden>
                            <div className="flex-1 h-px bg-[#3A464E]" />
                            <span className="text-xs font-bold uppercase tracking-wide text-[#5C6B73]">Проверим себя</span>
                            <div className="flex-1 h-px bg-[#3A464E]" />
                        </div>
                        <div className="w-full flex items-center justify-between">
                            <motion.div key={`cnt-${trialIndex}`} initial={trialIndex === 0 ? false : { scale: 1.8 }} animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 10 }}
                                className="flex items-center gap-0.5 px-3 h-9 rounded-full border-2 font-black text-sm tabular-nums"
                                style={{ borderColor: hexToRgba(CIRCLE_COLOR, 0.55), backgroundColor: hexToRgba(CIRCLE_COLOR, 0.16), color: CIRCLE_COLOR }}>
                                <span>{trialIndex + 1}</span><span className="opacity-50 font-normal">/</span><span>{TRIALS.length}</span>
                            </motion.div>
                            <span className="px-3 h-9 flex items-center rounded-full border-2 text-sm font-black"
                                style={{ borderColor: 'rgba(232,182,54,0.7)', color: '#F2C35B' }}>{t.tag}</span>
                        </div>
                        <p className="w-full text-lg md:text-xl font-bold text-[#F2F7FB] text-center min-h-[3.5rem]">
                            {qShow || checked
                                ? <Typewriter key={`q-${trialIndex}`} text={t.text} onDone={() => setQTyped(true)} />
                                : ' '}
                        </p>
                        {!checked && qTyped && (
                            <div key={`opts-${trialIndex}`} className="drop-in-options grid grid-cols-2 gap-3 w-full">
                                {t.options.map((v) => {
                                    const isWrong = wrongTried.includes(v)
                                    return (
                                        <button key={v} type="button" disabled={isWrong} onClick={() => answer(v)}
                                            className={cn('min-h-[60px] rounded-xl border-2 border-b-4 text-2xl font-black transition-colors',
                                                isWrong ? 'border-[#DC605B] bg-[#DC605B22] text-[#DC605B]' : 'border-[#3A464E] bg-[#161F23] text-[#F2F7FB] hover:border-[#4A90D9]')}>
                                            {v}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                        {!checked && wrongFlash && (
                            <div className="rounded-xl px-4 py-2 font-bold w-full text-center bg-[#DC605B22] text-[#DC605B]">{wrongFlash}</div>
                        )}
                        {checked && (
                            <div className="rounded-xl px-4 py-2 font-bold w-full text-center" style={{ backgroundColor: hexToRgba(OK_COLOR, 0.15), color: OK_COLOR }}>
                                {pickPraise(trialIndex)} S = {t.answer}
                            </div>
                        )}
                        {checked && <LocalAnswerConfetti />}
                    </SceneWrapper>
                )}
            </div>
            {phase === 'intro' ? (
                <div className="w-full flex items-center gap-2">
                    <ReplayButton onClick={handleReplay} disabled={advancing} />
                    <BackButton onClick={handleBack} disabled={advancing || step === 0} />
                    <button type="button" onClick={handleNext} disabled={!stepReady || advancing}
                        className={walkthroughButtonClass(stepReady && !advancing)} style={walkthroughButtonStyle(stepReady && !advancing)}>
                        {NEXT_LABELS[step]}
                    </button>
                </div>
            ) : checked ? (
                <div className="w-full flex">
                    <button type="button" onClick={nextTrial} disabled={advancing}
                        className={walkthroughButtonClass(!advancing)} style={walkthroughButtonStyle(!advancing)}>
                        {trialNextLabel}
                    </button>
                </div>
            ) : null}
        </div>
    )
}
