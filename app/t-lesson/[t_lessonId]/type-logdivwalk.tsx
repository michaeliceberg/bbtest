// app/t-lesson/[t_lessonId]/type-logdivwalk.tsx
//
// Тип LOGDIVWALK — «Деление логарифмов»: log_a x / log_a y = log_y x (одинаковые основания).
// Два примера (log₂9/log₂3 и log₅16/log₅2), каждый — одна сцена: основания в маркере → вычёркиваем одинаковое →
// нижнее число летит в основание, верхнее под логарифм. Движок и тренировка — в log-chain-walk.tsx.

'use client'

import type { QuestionType } from './page'
import { LogChainWalk, Plain, Mark, COL_MATCH, COL_BASE, COL_ARG, type ChainExample, type ChainWalkConfig, type LeftOpts } from './log-chain-walk'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

// Один логарифм «log_a n»: wrap — обёртка «log_a» (для вычёркивания), argMarker — число под логарифмом (точка вылета).
const LogTerm = ({ a, n, wrap, argMarker, o, fly }: { a: number; n: number; wrap: string; argMarker: string; o: LeftOpts; fly: string }) => (
    <span className="inline-flex items-baseline whitespace-nowrap">
        <span data-marker={wrap} className="inline-flex items-baseline" style={{ opacity: o.dim ? 0.3 : 1, transition: 'opacity 0.5s' }}>
            <Plain>log</Plain>
            <sub className="ml-0.5">{o.marked ? <Mark value={a} color={COL_MATCH} /> : <Plain>{a}</Plain>}</sub>
        </span>
        <span data-marker={argMarker} className="ml-1 inline-block" style={{ opacity: o.sent ? 0.3 : 1, transition: 'opacity 0.5s' }}>
            {o.fly ? <Mark value={n} color={fly} /> : <Plain>{n}</Plain>}
        </span>
    </span>
)

const Frac = ({ a, x, y, o }: { a: number; x: number; y: number; o: LeftOpts }) => (
    <span className="inline-flex flex-col items-center">
        <span className="border-b-2 border-[#F2F7FB] px-2 pb-1"><LogTerm a={a} n={x} wrap="s1" argMarker="x" o={o} fly={COL_ARG} /></span>
        <span className="px-2 pt-1"><LogTerm a={a} n={y} wrap="s2" argMarker="y" o={o} fly={COL_BASE} /></span>
    </span>
)

const example = (a: number, x: number, y: number, lines: ChainExample['lines'], labels: ChainExample['labels']): ChainExample => ({
    left: (o) => <Frac a={a} x={x} y={y} o={o} />,
    strike: ['s1', 's2'],
    // нижнее число — в основание, верхнее — под логарифм
    flyers: [{ from: 'y', to: 'base', n: y, color: COL_BASE }, { from: 'x', to: 'arg', n: x, color: COL_ARG }],
    lines,
    labels,
})

const CFG: ChainWalkConfig = {
    examples: [
        example(2, 9, 3,
            [['Смотрим на основания.', 'У обоих двойка.'], ['Одинаковое убираем.', 'Двойки ушли. Никто не плакал.'], ['Нижнее число идёт в основание.', 'Верхнее встаёт под логарифм.']],
            ['Основания одинаковые', 'Одинаковое убираем', 'Низ в основание, верх под логарифм']),
        example(5, 16, 2,
            [['А здесь?', 'У обоих пятёрка.'], ['Пятёрки убираем.', 'Сократили, как в школе.'], ['Низ в основание.', 'Верх под логарифм.']],
            ['Снова одинаковые', 'Пятёрки долой', 'Деление побеждено']),
    ],
    prompt: ([a, x, y]) => <Frac a={a} x={x} y={y} o={{ marked: false, dim: false, fly: false, sent: false }} />,
    answer: ([, x, y]) => [y, x],
    stagePrompts: ['Что станет основанием?', 'Что под логарифмом?'],
    joke: {
        question: 'Видим log₂9 / log₂3. Что делаем?',
        options: ['Убираем одинаковые основания', 'Плачем', 'Закрываем тетрадь', 'Звоним маме'],
        correct: ['Убираем одинаковые основания'],
    },
}

export const TypeLogDivWalk = ({ onAnswer, onComplete }: Props) => <LogChainWalk cfg={CFG} onAnswer={onAnswer} onComplete={onComplete} />
