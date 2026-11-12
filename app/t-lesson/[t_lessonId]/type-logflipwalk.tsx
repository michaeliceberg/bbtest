// app/t-lesson/[t_lessonId]/type-logflipwalk.tsx
//
// Тип LOGFLIPWALK — «Перевёртыш»: log_a b = 1 / log_b a (основание и число под логарифмом меняются местами, логарифм уезжает в знаменатель).
// Два примера (log₈2 и log₉3), каждый — одна сцена: числа в маркерах → справа вырастает «= 1 / log □ □» →
// основание и число перелетают крест-накрест (одно по нижней дуге, другое по верхней). Движок и тренировка — в log-chain-walk.tsx.

'use client'

import type { QuestionType } from './page'
import { LogChainWalk, Plain, Mark, COL_BASE, COL_ARG, type ChainExample, type ChainWalkConfig, type LeftOpts } from './log-chain-walk'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    onComplete: (isCorrect: boolean) => void
}

// log_a b: a (основание) — маркер синий, b (число) — зелёный; после взлёта оригиналы бледнеют.
const Flip = ({ a, b, o }: { a: number; b: number; o: LeftOpts }) => {
    const mk = o.marked || o.fly
    const fade = { opacity: o.sent ? 0.3 : 1, transition: 'opacity 0.5s' }
    return (
        <span className="inline-flex items-baseline whitespace-nowrap">
            <Plain>log</Plain>
            <sub className="ml-0.5"><span data-marker="a" className="inline-block" style={fade}>{mk ? <Mark value={a} color={COL_BASE} /> : <Plain>{a}</Plain>}</span></sub>
            <span data-marker="b" className="ml-1 inline-block" style={fade}>{mk ? <Mark value={b} color={COL_ARG} /> : <Plain>{b}</Plain>}</span>
        </span>
    )
}

const example = (a: number, b: number, lines: ChainExample['lines'], labels: ChainExample['labels']): ChainExample => ({
    left: (o) => <Flip a={a} b={b} o={o} />,
    kind: 'flip',
    strike: ['a', 'b'],
    // основание уходит под логарифм и наоборот: одно число по нижней дуге, другое по верхней
    flyers: [{ from: 'b', to: 'base', n: b, color: COL_ARG, arc: 34 }, { from: 'a', to: 'arg', n: a, color: COL_BASE, arc: -50 }],
    lines,
    labels,
})

const CFG: ChainWalkConfig = {
    frac: true,
    examples: [
        example(8, 2,
            [
                ['Смотрим на логарифм.', [{ t: 'Основание — ' }, { n: 8, color: COL_BASE }], [{ t: 'Под логарифмом — ' }, { n: 2, color: COL_ARG }]],
                ['Логарифм любит кувыркаться.', 'Единицу пишем наверх.'],
                ['Основание и число меняются местами.', 'Получили перевёртыш!'],
            ],
            ['Вижу 👀 основание и число', 'Единица наверху', 'Какой кульбит!']),
        example(9, 3,
            [
                ['А здесь?', [{ t: 'Основание — ' }, { n: 9, color: COL_BASE }], [{ t: 'Под логарифмом — ' }, { n: 3, color: COL_ARG }]],
                ['Снова единицу наверх.'],
                ['Меняем местами.', 'Опять кувырок!'],
            ],
            ['Снова вижу 👀 два числа', 'Единица наверху', 'Перевёртыш готов 🙃']),
    ],
    prompt: ([a, b]) => <Flip a={a} b={b} o={{ marked: false, dim: false, fly: false, sent: false }} />,
    answer: ([a, b]) => [b, a],
    stagePrompts: ['Что станет основанием?', 'Что под логарифмом?'],
    joke: {
        question: 'Логарифм хочет в знаменатель. Ваши действия?',
        options: ['Меняем числа местами, единицу пишем сверху', 'Выдаём логарифму парашют', 'Смотрим на него с уважением', 'Отправляем его в отпуск'],
        correct: ['Меняем числа местами, единицу пишем сверху'],
    },
}

export const TypeLogFlipWalk = ({ onAnswer, onComplete }: Props) => <LogChainWalk cfg={CFG} onAnswer={onAnswer} onComplete={onComplete} />
