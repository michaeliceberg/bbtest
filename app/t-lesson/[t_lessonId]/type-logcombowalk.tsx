// app/t-lesson/[t_lessonId]/type-logcombowalk.tsx
//
// Тип LOGCOMBOWALK — «К-к-комбо логарифмов»: log_a b · log_b c = log_a c (число под первым логарифмом = основание второго).
// Два примера (log₂3·log₃4 и log₅7·log₇3), каждый — одна сцена: две одинаковые цифры в маркере → вычёркиваем →
// первое основание и последнее число перелетают в итоговый логарифм. Движок и тренировка — в log-chain-walk.tsx.

'use client'

import type { QuestionType } from './page'
import { LogChainWalk, Plain, Mark, COL_MATCH, COL_BASE, COL_ARG, type ChainExample, type ChainWalkConfig, type LeftOpts } from './log-chain-walk'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

const Combo = ({ a, b, c, o }: { a: number; b: number; c: number; o: LeftOpts }) => (
    <span className="inline-flex items-baseline whitespace-nowrap">
        <Plain>log</Plain>
        <sub className="ml-0.5">
            <span data-marker="a" className="inline-block" style={{ opacity: o.sent ? 0.3 : 1, transition: 'opacity 0.5s' }}>
                {o.fly ? <Mark value={a} color={COL_BASE} /> : <Plain>{a}</Plain>}
            </span>
        </sub>
        <span data-marker="s1" className="ml-1 inline-block" style={{ opacity: o.dim ? 0.3 : 1, transition: 'opacity 0.5s' }}>
            {o.marked ? <Mark value={b} color={COL_MATCH} /> : <Plain>{b}</Plain>}
        </span>
        <span className="mx-2"><Plain>·</Plain></span>
        <span data-marker="s2" className="inline-flex items-baseline" style={{ opacity: o.dim ? 0.3 : 1, transition: 'opacity 0.5s' }}>
            <Plain>log</Plain>
            <sub className="ml-0.5">{o.marked ? <Mark value={b} color={COL_MATCH} /> : <Plain>{b}</Plain>}</sub>
        </span>
        <span data-marker="c" className="ml-1 inline-block" style={{ opacity: o.sent ? 0.3 : 1, transition: 'opacity 0.5s' }}>
            {o.fly ? <Mark value={c} color={COL_ARG} /> : <Plain>{c}</Plain>}
        </span>
    </span>
)

const example = (a: number, b: number, c: number, lines: ChainExample['lines'], labels: ChainExample['labels']): ChainExample => ({
    left: (o) => <Combo a={a} b={b} c={c} o={o} />,
    strike: ['s1', 's2'],
    // первое основание — в основание итога, последнее число — под логарифм
    flyers: [{ from: 'a', to: 'base', n: a, color: COL_BASE, arc: -48 }, { from: 'c', to: 'arg', n: c, color: COL_ARG, arc: -84 }],
    lines,
    labels,
})

const CFG: ChainWalkConfig = {
    examples: [
        example(2, 3, 4,
            [['Видишь две тройки?', 'Одна под логарифмом, другая в основании.'], ['Тройки встретились и исчезли.', 'Любовь сильнее логарифмов.'], ['Остались двойка и четвёрка.', 'Двойка в основание, четвёрка под логарифм.']],
            ['К-к-комбо!', 'Одинаковые сокращаем', 'Края слипаются в один логарифм']),
        example(5, 7, 3,
            [['А здесь?', 'Две семёрки рядом.'], ['Семёрки сокращаем.', 'Ещё одна пара разбита.'], ['Пятёрка в основание.', 'Тройка под логарифм.']],
            ['Снова комбо', 'Семёрки долой', 'Комбо собрано']),
    ],
    prompt: ([a, b, c]) => <Combo a={a} b={b} c={c} o={{ marked: false, dim: false, fly: false, sent: false }} />,
    answer: ([a, , c]) => [a, c],
    stagePrompts: ['Какое основание?', 'Что под логарифмом?'],
    joke: {
        question: 'Видим log₂3 · log₃4. Что делаем?',
        options: ['Сокращаем одинаковые тройки', 'Делаем вид, что так и было', 'Включаем музыку и танцуем', 'Спрашиваем у кота'],
        correct: ['Сокращаем одинаковые тройки'],
    },
}

export const TypeLogComboWalk = ({ onAnswer, onComplete }: Props) => <LogChainWalk cfg={CFG} onAnswer={onAnswer} onComplete={onComplete} />
