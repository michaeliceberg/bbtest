'use client'

// Блок «Вероятность» (ЕГЭ №4 и №5), уроки SCENEWALK. Условия — как в задачнике (units 93, 100):
//   1. «Вероятность: подходящие / все» — классическая вероятность, «не» = 1 − P, жребий и рейсы.
//   2. «Монетки и кубики» — перебор исходов: 2–3 монеты, таблица 6×6 для двух кубиков.
//   3. «И — умножаем, ИЛИ — складываем» — независимые события, «хотя бы один» = 1 − «ни одного».
// Мини-игры: CoinFlipGame (кидаем монету много раз — частота тянется к 0,5), PickGame (нажми подходящие исходы).

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Note, type Part, type Scene } from '@/components/geometry/scene-engine'
import { ZnClipping } from '@/components/za-nauku-archive'
import { playJustClick, playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import { cn } from '@/lib/utils'
import type { SceneLesson } from './types'

const OK = '#A1D151'
const BAD = '#DC605B'
const GOLD = '#F2C35B'

// ===== Монета: орёл (О) золотой, решка (Р) серебряная =====
const Coin = ({ side, size = 30 }: { side: 'О' | 'Р'; size?: number }) => (
    <span className="inline-flex items-center justify-center rounded-full font-black"
        style={{
            width: size, height: size, fontSize: size * 0.48,
            background: side === 'О' ? 'radial-gradient(circle at 35% 30%, #FFE79A, #E0A72A)' : 'radial-gradient(circle at 35% 30%, #F2F7FB, #9AA7B0)',
            color: side === 'О' ? '#6B4A0A' : '#3A464E', boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.25)',
        }}>{side}</span>
)
const Coins = ({ s }: { s: string }) => (
    <span className="inline-flex gap-1">{[...s].map((c, i) => <Coin key={i} side={c as 'О' | 'Р'} size={26} />)}</span>
)

// ===== Кидаем монету: 1 или сразу 10 =====
// Каждая монета подлетает и крутится (орёл-решка-орёл…), потом падает на свою сторону. Время у каждой своё —
// монеты приземляются вразнобой. Анимация — только transform (класс .coin-flip в globals.css).
const SpinCoin = ({ result, spinId, size }: { result: 'О' | 'Р'; spinId: number; size: number }) => {
    const [face, setFace] = useState<'О' | 'Р'>(result)
    const [spinning, setSpinning] = useState(false)
    const [dur] = useState(() => 0.8 + Math.random() * 0.7)
    useEffect(() => {
        if (!spinId) return
        setSpinning(true)
        let f: 'О' | 'Р' = 'О'
        const iv = setInterval(() => { f = f === 'О' ? 'Р' : 'О'; setFace(f) }, 110)
        const t = setTimeout(() => { clearInterval(iv); setFace(result); setSpinning(false) }, dur * 1000)
        return () => { clearInterval(iv); clearTimeout(t) }
    }, [spinId]) // eslint-disable-line react-hooks/exhaustive-deps
    return (
        <motion.div key={spinId} animate={spinId ? { y: [0, -size * 0.9, 0] } : { y: 0 }} transition={{ duration: dur, ease: [0.3, 0, 0.6, 1] }}>
            <motion.div animate={!spinning && spinId ? { scale: [1, 1.18, 1] } : { scale: 1 }} transition={{ duration: 0.25 }}>
                <span className={cn('inline-flex', spinning && 'coin-flip')}><Coin side={face} size={size} /></span>
            </motion.div>
        </motion.div>
    )
}

const GOAL_THROWS = 100
const CoinFlipGame = ({ onDone }: { onDone: () => void }) => {
    const [o, setO] = useState(0)
    const [r, setR] = useState(0)
    const [results, setResults] = useState<('О' | 'Р')[]>(['О'])
    const [spinId, setSpinId] = useState(0)
    const [busy, setBusy] = useState(false)
    const total = o + r
    const throwN = (n: number) => {
        if (busy) return
        playJustClick()
        const res = Array.from({ length: n }, () => (Math.random() < 0.5 ? 'О' : 'Р') as 'О' | 'Р')
        setResults(res); setSpinId((x) => x + 1); setBusy(true)
        // счётчики обновляем, когда монеты приземлились
        setTimeout(() => {
            const a = res.filter((x) => x === 'О').length
            setO((v) => v + a); setR((v) => v + n - a); setBusy(false)
            if (total + n >= GOAL_THROWS) setTimeout(onDone, 700)
        }, 1600)
    }
    const freq = total ? (o / total).toFixed(2).replace('.', ',') : '—'
    const size = results.length > 1 ? 46 : 84
    return (
        <div className="w-full flex flex-col items-center gap-3">
            <div className={cn('grid gap-2 pt-10', results.length > 1 ? 'grid-cols-5' : 'grid-cols-1')}>
                {results.map((res, i) => <SpinCoin key={`${results.length}-${i}`} result={res} spinId={spinId} size={size} />)}
            </div>
            <div className="flex gap-4 text-lg font-black text-[#F2F7FB]">
                <span className="flex items-center gap-1"><Coin side="О" size={22} /> {o}</span>
                <span className="flex items-center gap-1"><Coin side="Р" size={22} /> {r}</span>
            </div>
            <div className="w-full max-w-[320px]">
                <div className="mb-1 text-center text-sm font-bold text-[#9AA7B0]">Доля орлов <span className="text-xl font-black" style={{ color: GOLD }}>{freq}</span></div>
                <div className="relative h-4 w-full rounded-full bg-[#26333B] overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: GOLD }} animate={{ width: total ? `${(o / total) * 100}%` : '0%' }} />
                    <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/70" />
                </div>
            </div>
            {total < GOAL_THROWS && (
                <>
                    <div className="flex w-full max-w-[320px] gap-2">
                        <button type="button" disabled={busy} onClick={() => throwN(1)} className="flex-1 rounded-xl border-2 border-b-4 active:border-b-0 border-[#3A464E] bg-[#161F23] px-3 py-3 font-black text-[#F2F7FB] disabled:opacity-50">Бросить 1</button>
                        <button type="button" disabled={busy} onClick={() => throwN(10)} className="flex-1 rounded-xl border-2 border-b-4 active:border-b-0 border-[#C07C2B] bg-[#F09B38] px-3 py-3 font-black text-[#151F24] disabled:opacity-50">Бросить 10</button>
                    </div>
                    <div className="text-xs font-bold text-[#5C6B73]">бросков {total} / {GOAL_THROWS}</div>
                </>
            )}
        </div>
    )
}

// ===== «Нажми подходящие» =====
type PickItem = { key: string; node: React.ReactNode; good: boolean }
const PickGame = ({ prompt, items, cols, ok, hint, onDone }: { prompt: string; items: PickItem[]; cols: number; ok: string; hint: string; onDone: () => void }) => {
    const [picked, setPicked] = useState<string[]>([])
    const [bad, setBad] = useState<string | null>(null)
    const need = items.filter((i) => i.good).length
    const done = picked.length >= need
    const tap = (it: PickItem) => {
        if (done || picked.includes(it.key)) return
        if (it.good) {
            const next = [...picked, it.key]
            setPicked(next); setBad(null); playJustClick()
            if (next.length >= need) { showAnswerMeme(true); setTimeout(onDone, 1400) }
        } else {
            setBad(it.key); playSound(WRONG_ANSWER_SOUND); showAnswerMeme(false)
            setTimeout(() => setBad((b) => (b === it.key ? null : b)), 700)
        }
    }
    return (
        <div className="w-full flex flex-col items-center gap-2">
            <div className="w-full text-center text-lg md:text-xl font-black text-[#F2F7FB]">
                {prompt} <span className="text-sm font-bold text-[#5C6B73]">{picked.length}/{need}</span>
            </div>
            <div className="grid w-full gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                {items.map((it) => {
                    const on = picked.includes(it.key), wrong = bad === it.key
                    return (
                        <motion.button key={it.key} type="button" onClick={() => tap(it)}
                            animate={wrong ? { x: [0, -6, 6, -4, 0] } : { x: 0 }} transition={{ duration: 0.35 }}
                            className={cn('min-h-[44px] rounded-xl border-2 px-1 py-1 flex items-center justify-center text-sm font-black',
                                on ? 'text-[#A1D151]' : wrong ? 'text-[#DC605B]' : 'text-[#F2F7FB]')}
                            style={{ borderColor: on ? OK : wrong ? BAD : '#3A464E', background: on ? '#A1D15122' : wrong ? '#DC605B22' : '#161F23' }}>
                            {it.node}
                        </motion.button>
                    )
                })}
            </div>
            {done ? <Note ok>{ok}</Note> : bad && <Note ok={false}>{hint}</Note>}
        </div>
    )
}
const pick = (label: string, prompt: string, items: PickItem[], cols: number, ok: string, hint: string): Part =>
    ({ t: 'custom', label, render: (done) => <PickGame prompt={prompt} items={items} cols={cols} ok={ok} hint={hint} onDone={done} /> })

// Все исходы n монет: ОО, ОР, РО, РР …
const outcomes = (n: number): string[] => (n === 0 ? [''] : outcomes(n - 1).flatMap((s) => [s + 'О', s + 'Р']))
const coinItems = (n: number, good: (s: string) => boolean): PickItem[] =>
    outcomes(n).map((s) => ({ key: s, node: <Coins s={s} />, good: good(s) }))
const count = (s: string, c: string) => [...s].filter((x) => x === c).length

// Два кубика: таблица 6×6, в клетке «a+b»
const diceItems = (good: (a: number, b: number) => boolean): PickItem[] =>
    Array.from({ length: 36 }, (_, i) => {
        const a = Math.floor(i / 6) + 1, b = (i % 6) + 1
        return { key: `${a}${b}`, node: <span className="text-[13px] leading-none">{a}<span className="text-[#5C6B73]">+</span>{b}</span>, good: good(a, b) }
    })

const CANDIES = ['Грильяж', 'Белочка', 'Коровка', 'Ласточка']

// Единственная шутка «За науку» про вероятность — к месту в конце первого урока
const ZN_PROB = { text: 'При испытании одного изделия произошёл один отказ. Какова вероятность безотказной работы изделия?', source: '«За науку», № 9 (679), 30 марта 1979 г.' }

const ZnFig: Part = { t: 'fig', node: <ZnClipping text={ZN_PROB.text} rubric="task" source={ZN_PROB.source} /> }

// ================= Урок 1 =================
const LESSON1_SCENES: Scene[] = [
    {
        title: 'Монетка', next: 'Понял: шанс 0,5', parts: [
            { t: 'say', text: '¡Hola, амиго! 🪙' },
            { t: 'say', text: 'Команданте подбрасывает монетку.' },
            { t: 'say', text: 'Орёл или решка?', big: true },
            { t: 'say', text: 'Угадать нельзя.' },
            { t: 'ack', label: 'Угадать нельзя 🤷' },
            { t: 'say', text: 'Но можно посчитать ШАНС.' },
            { t: 'ack', label: 'Кидаю сам!' },
            { t: 'custom', render: (done) => <CoinFlipGame onDone={done} /> },
            { t: 'say', text: 'Орлов — почти ровно половина.' },
            { t: 'calc', tex: 'P = \\dfrac{1}{2} = 0{,}5' },
        ],
    },
    {
        title: 'Конфеты Миши', next: 'Дальше', parts: [
            { t: 'ege', num: 4, text: 'У Миши в кармане 4 конфеты: «Грильяж», «Белочка», «Коровка» и «Ласточка».\nМиша случайно выронил одну.\nНайдите вероятность, что выпал «Грильяж».' },
            pick('', 'Какая подходит?', CANDIES.map((c) => ({ key: c, node: <span>🍬 {c}</span>, good: c === 'Грильяж' })), 2,
                'Подходит 1 из 4', 'Нам нужен «Грильяж» 🙃'),
            {
                t: 'build', prompt: 'Собери вероятность', tpl: ['P =', { frac: [[{ s: 0 }], [{ s: 1 }]] }],
                chips: ['1', '4', '3', '2'], slots: ['1', '4'], hint: 'Сверху — сколько подходит, снизу — сколько всего 🙃',
            },
            { t: 'calc', tex: 'P = \\dfrac{1}{4} = 0{,}25' },
        ],
    },
    {
        title: 'Формула', next: 'Понял: подходящие / все', parts: [
            { t: 'remember', title: 'ЗАПОМНИ!', lines: ['$P = \\dfrac{\\text{подходящие}}{\\text{все}}$'] },
            { t: 'ack', label: 'Подходящие / все ✍️' },
            { t: 'say', text: 'Вероятность всегда от 0 до 1.' },
            { t: 'ack', label: 'От 0 до 1' },
            { t: 'say', text: '0 — никогда.\nКоманданте проспит построение 😴' },
            { t: 'say', text: '1 — точно.\nЕГЭ будет в июне 📅' },
        ],
    },
    {
        title: 'Как в ЕГЭ', next: 'Изи', parts: [
            { t: 'ege', num: 4, text: 'На экзамен вынесено 60 вопросов. Андрей не выучил 3 из них.\nНайдите вероятность, что ему попадётся выученный вопрос.' },
            {
                t: 'choice', rounds: [
                    { prompt: 'Всего вопросов?', options: ['60', '3', '57'], correct: '60', hint: 'Может попасться любой из всех 🙃', ok: 'Всего 60' },
                    { prompt: 'Сколько подходит?', options: ['3', '57', '60'], correct: '57', hint: 'Подходят выученные: 60 − 3 🙃', ok: 'Выученных 57' },
                    { prompt: '$P = \\dfrac{57}{60} = \\ ?$', options: ['$0{,}95$', '$0{,}05$', '$0{,}57$'], correct: '$0{,}95$', hint: '57 разделить на 60 🙃', ok: '¡Vamos, Андрей!' },
                ],
            },
        ],
    },
    {
        title: 'Подвох «НЕ»', next: 'Понял: НЕ = 1 − P', parts: [
            { t: 'ege', num: 4, text: 'Из 1400 садовых насосов 7 подтекают.\nНайдите вероятность, что случайный насос НЕ подтекает.' },
            { t: 'say', text: 'Ловушка: спрашивают про НЕ подтекающие!' },
            { t: 'ack', label: 'Вижу ловушку 👀' },
            {
                t: 'choice', rounds: [
                    { prompt: 'Сколько НЕ подтекает?', options: ['1393', '7', '1400'], correct: '1393', hint: '1400 − 7 🙃', ok: '1400 − 7 = 1393' },
                    { prompt: '$P = \\dfrac{1393}{1400} = \\ ?$', options: ['$0{,}005$', '$0{,}995$', '$0{,}7$'], correct: '$0{,}995$', hint: '1393 разделить на 1400 🙃', ok: '0,995' },
                ],
            },
            { t: 'remember', title: 'ЛАЙФХАК', lines: ['$P(\\text{НЕ}) = 1 - P$', '$1 - \\dfrac{7}{1400} = 0{,}995$'] },
        ],
    },
    {
        title: 'Жребий', next: 'Жребий покорён', parts: [
            { t: 'ege', num: 4, text: 'В чемпионате 20 гимнасток: 8 из России, остальные из Кубы. Порядок выступлений — жребий.\nНайдите вероятность, что первой выступит гимнастка из России.' },
            {
                t: 'choice', rounds: [
                    { prompt: '$P = \\ ?$', options: ['$0{,}4$', '$0{,}6$', '$0{,}05$'], correct: '$0{,}4$', hint: 'Первой может быть любая из 20, подходят 8 🙃', ok: '$\\dfrac{8}{20} = 0{,}4$. Куба, не грусти 🌴' },
                ],
            },
            { t: 'ege', num: 4, text: '30 туристов везут вертолётом по 6 человек за рейс.\nНайдите вероятность, что турист П. полетит первым рейсом.' },
            {
                t: 'choice', rounds: [
                    { prompt: '$P = \\ ?$', options: ['$\\dfrac{1}{30}$', '$0{,}2$', '$0{,}6$'], correct: '$0{,}2$', hint: 'В первом рейсе 6 мест из 30 🙃', ok: '$\\dfrac{6}{30} = 0{,}2$ 🚁' },
                ],
            },
        ],
    },
    {
        title: 'Физтехи шутят', next: '¡Vamos!', parts: [
            { t: 'say', text: 'Задача физтехов, 1979 год 😏' },
            ZnFig,
            { t: 'say', text: 'Подходящих 0, всего 1.\nВероятность 0 😤' },
        ],
    },
]

// ================= Урок 2 =================
const LESSON2_SCENES: Scene[] = [
    {
        title: 'Две монеты', next: 'Близнецы, понял', parts: [
            { t: 'ege', num: 4, text: 'Монету бросают дважды.\nНайдите вероятность, что орёл выпадет ровно один раз.' },
            { t: 'say', text: 'Выпишем ВСЕ исходы. Их 4.' },
            { t: 'fig', node: <div className="flex flex-wrap justify-center gap-3">{outcomes(2).map((s) => <Coins key={s} s={s} />)}</div> },
            pick('', 'Где ровно один орёл?', coinItems(2, (s) => count(s, 'О') === 1), 4,
                'ОР и РО — два подходящих', 'Нужен ровно ОДИН орёл 🙃'),
            { t: 'say', text: 'ОР и РО — РАЗНЫЕ исходы!' },
            { t: 'ack', label: 'ОР ≠ РО, понял' },
            { t: 'calc', tex: 'P = \\dfrac{2}{4} = 0{,}5' },
        ],
    },
    {
        title: 'Три монеты', next: 'Три монеты — изи', parts: [
            { t: 'say', text: 'Три броска — 8 исходов.' },
            pick('', 'Где ровно ДВА орла?', coinItems(3, (s) => count(s, 'О') === 2), 4,
                'Подходят 3 исхода из 8', 'Посчитай орлов: нужно ровно 2 🙃'),
            { t: 'calc', tex: 'P = \\dfrac{3}{8} = 0{,}375' },
            pick('', 'Где ХОТЯ БЫ ДВЕ решки?', coinItems(3, (s) => count(s, 'Р') >= 2), 4,
                '2 решки или 3 решки — 4 исхода', '«Хотя бы две» — это две ИЛИ три 🙃'),
            { t: 'calc', tex: 'P = \\dfrac{4}{8} = 0{,}5' },
        ],
    },
    {
        title: 'Сколько исходов', next: 'Таблица в голове', parts: [
            { t: 'remember', title: 'ЗАПОМНИ!', lines: ['1 монета → 2 исхода', '2 монеты → 4', '3 монеты → 8', 'Каждая монета удваивает: $2^n$'] },
            { t: 'ack', label: 'Каждая монета ×2' },
            { t: 'say', text: 'У кубика 6 граней 🎲\nДва кубика → 36 исходов.' },
        ],
    },
    {
        title: 'Два кубика', next: 'Кубики покорены', parts: [
            { t: 'ege', num: 4, text: 'Бросают два игральных кубика.\nНайдите вероятность, что в сумме выпадет 8. Ответ округлите до сотых.' },
            pick('', 'Где сумма 8?', diceItems((a, b) => a + b === 8), 6,
                '2+6, 3+5, 4+4, 5+3, 6+2 — пять клеток', 'Сложи два числа в клетке 🙃'),
            {
                t: 'choice', rounds: [
                    { prompt: '$P = \\dfrac{5}{36} \\approx \\ ?$', options: ['$0{,}14$', '$0{,}05$', '$0{,}36$'], correct: '$0{,}14$', hint: '5 : 36 = 0,138… округляем 🙃', ok: '$0{,}138… \\approx 0{,}14$ 🎲' },
                ],
            },
            
        ],
    },
    {
        title: 'Кубик-разминка', next: '¡Caramba, легко!', parts: [
            {
                t: 'choice', rounds: [
                    { prompt: 'Выпадет чётное число', options: ['$0{,}5$', '$\\dfrac16$', '$\\dfrac13$'], correct: '$0{,}5$', hint: 'Чётные: 2, 4, 6 — три из шести 🙃', ok: '$\\dfrac36 = 0{,}5$' },
                    { prompt: 'Выпадет больше 4', options: ['$\\dfrac13$', '$\\dfrac12$', '$\\dfrac23$'], correct: '$\\dfrac13$', hint: 'Больше 4: только 5 и 6 🙃', ok: '$\\dfrac26 = \\dfrac13$' },
                ],
            },
        ],
    },
]

// ================= Урок 3 =================
const LESSON3_SCENES: Scene[] = [
    {
        title: 'Телефонный номер', next: 'И — умножаем', parts: [
            { t: 'ege', num: 5, text: 'Найдите вероятность, что случайный телефонный номер оканчивается двумя чётными цифрами.' },
            { t: 'say', text: 'Каждая цифра чётная с шансом 0,5.' },
            { t: 'say', text: 'Нужна чётная И чётная.\n«И» — УМНОЖАЕМ.' },
            { t: 'ack', label: '«И» — умножаем ✖️' },
            { t: 'calc', tex: '0{,}5 \\cdot 0{,}5 = 0{,}25' },
        ],
    },
    {
        title: 'И / ИЛИ', next: 'Правило зашло', parts: [
            { t: 'remember', title: 'ЗАПОМНИ!', lines: [
                '«И» (оба события сразу) → УМНОЖАЕМ ✖️',
                '«ИЛИ» (одно из двух, вместе не бывают) → СКЛАДЫВАЕМ ➕',
                'Умножение работает, если события не влияют друг на друга',
            ] },
            { t: 'say', text: '«И» — два замка на сейфе 🔒🔒\nОткрыть оба сложнее: шанс МЕНЬШЕ.' },
        ],
    },
    {
        title: 'Стрелок', next: 'Меткость 100%', parts: [
            { t: 'ege', num: 5, text: 'Стрелок попадает в мишень с вероятностью 0,8. Он стреляет 3 раза.' },
            {
                t: 'choice', rounds: [
                    { prompt: 'Попал все 3 раза', options: ['$0{,}512$', '$2{,}4$', '$0{,}8$'], correct: '$0{,}512$', hint: 'Попал И попал И попал: $0{,}8 \\cdot 0{,}8 \\cdot 0{,}8$ 🙃', ok: '$0{,}8^3 = 0{,}512$' },
                    { prompt: 'Первые 2 раза попал, третий промахнулся', options: ['$0{,}128$', '$0{,}64$', '$0{,}512$'], correct: '$0{,}128$', hint: 'Промах = $1 - 0{,}8 = 0{,}2$. Умножай все три 🙃', ok: '$0{,}8 \\cdot 0{,}8 \\cdot 0{,}2 = 0{,}128$' },
                ],
            },
        ],
    },
    {
        title: 'Хотя бы один', next: 'Хотя бы один — мой', parts: [
            { t: 'ege', num: 5, text: 'В магазине два продавца. Каждый занят с клиентом с вероятностью 0,3 независимо от другого.' },
            {
                t: 'choice', rounds: [
                    { prompt: 'Оба продавца заняты', options: ['$0{,}09$', '$0{,}6$', '$0{,}3$'], correct: '$0{,}09$', hint: 'Занят И занят — умножаем 🙃', ok: '$0{,}3 \\cdot 0{,}3 = 0{,}09$' },
                    { prompt: 'Хотя бы один свободен', options: ['$0{,}91$', '$0{,}49$', '$0{,}7$'], correct: '$0{,}91$', hint: 'Это «НЕ оба заняты»: $1 - 0{,}09$ 🙃', ok: '$1 - 0{,}09 = 0{,}91$' },
                ],
            },
            { t: 'remember', title: 'ЛАЙФХАК', lines: ['«Хотя бы один» $= 1 -$ «ни одного»', 'Считать «ни одного» почти всегда проще 😎'] },
        ],
    },
    {
        title: 'ИЛИ — складываем', next: 'Складываю', parts: [
            { t: 'ege', num: 5, text: 'В сборнике 25% задач по тригонометрии и 40% по логарифмам. Задач сразу на обе темы нет.\nНайдите вероятность, что попадётся тригонометрия или логарифмы.' },
            {
                t: 'choice', rounds: [
                    { prompt: 'Попадётся тригонометрия ИЛИ логарифмы', options: ['$0{,}65$', '$0{,}1$', '$0{,}15$'], correct: '$0{,}65$', hint: 'Вместе не бывают — складываем 🙃', ok: '$0{,}25 + 0{,}4 = 0{,}65$' },
                ],
            },
        ],
    },
    {
        title: 'Шахматы', next: '¡Hasta la victoria!', parts: [
            { t: 'ege', num: 5, text: 'Шахматист А. белыми выигрывает с вероятностью 0,52, чёрными — 0,3. Он играет две партии, во второй меняет цвет.\nНайдите вероятность, что А. выиграет обе.' },
            {
                t: 'choice', rounds: [
                    { prompt: '$P = \\ ?$', options: ['$0{,}156$', '$0{,}82$', '$0{,}41$'], correct: '$0{,}156$', hint: 'Выиграл первую И вторую — умножаем 🙃', ok: '$0{,}52 \\cdot 0{,}3 = 0{,}156$ 👑' },
                ],
            },
        ],
    },
]

const T = (tag: string, text: string, options: string[], answer: string, hint: string) => ({ tag, text, options, answer, hint })

export const PROB_CLASSIC: SceneLesson = {
    question: 'Вероятность: подходящие / все',
    mascot: 'Шансы, амиго!',
    last: 'Вероятность моя!',
    scenes: LESSON1_SCENES,
    trials: [
        T('ЕГЭ №4', 'На экзамен 50 билетов, Оскар не выучил 7. Найдите вероятность, что ему попадётся выученный билет.', ['$0{,}86$', '$0{,}14$', '$0{,}43$'], '$0{,}86$', 'Выученных $50 - 7 = 43$, делим на 50 🙃'),
        T('ЕГЭ №4', 'В фирме такси 20 машин: 9 жёлтых, остальные зелёные. На вызов поехала случайная машина. Вероятность, что приедет зелёное такси?', ['$0{,}55$', '$0{,}45$', '$0{,}11$'], '$0{,}55$', 'Зелёных $20 - 9 = 11$ 🙃'),
        T('ЕГЭ №4', 'Из 1000 батареек в среднем 6 неисправны. Вероятность, что случайная батарейка исправна?', ['$0{,}994$', '$0{,}006$', '$0{,}94$'], '$0{,}994$', '«Не» — это $1 - \\dfrac{6}{1000}$ 🙃'),
        T('ЕГЭ №4', 'В чемпионате 16 спортсменов: 4 из Кубы, остальные из России. Порядок — жребий. Вероятность, что последним выступит кубинец?', ['$0{,}25$', '$0{,}75$', '$\\dfrac{1}{16}$'], '$0{,}25$', 'Последним может быть любой из 16, подходят 4 🙃'),
        T('ЕГЭ №4', 'В группе 25 туристов, вертолёт везёт по 5 человек за рейс. Вероятность, что турист Б. полетит первым рейсом?', ['$0{,}2$', '$0{,}04$', '$0{,}5$'], '$0{,}2$', 'В первом рейсе 5 мест из 25 🙃'),
        T('ЕГЭ №4', 'Вероятность, что новая ручка пишет плохо, равна 0,18. Вероятность, что случайная ручка пишет хорошо?', ['$0{,}82$', '$0{,}18$', '$1{,}18$'], '$0{,}82$', '«Хорошо» — это «НЕ плохо»: $1 - 0{,}18$ 🙃'),
    ],
}

export const PROB_COINS: SceneLesson = {
    question: 'Монетки и кубики',
    mascot: 'Орёл или решка?',
    last: 'Монетки мои!',
    scenes: LESSON2_SCENES,
    trials: [
        T('ЕГЭ №4', 'Монету бросают дважды. Найдите вероятность, что оба раза выпадет решка.', ['$0{,}25$', '$0{,}5$', '$0{,}75$'], '$0{,}25$', 'Подходит только РР — 1 из 4 🙃'),
        T('ЕГЭ №4', 'Монету бросают трижды. Найдите вероятность, что орёл выпадет ровно один раз.', ['$0{,}375$', '$0{,}125$', '$0{,}5$'], '$0{,}375$', 'ОРР, РОР, РРО — 3 из 8 🙃'),
        T('ЕГЭ №4', 'Монету бросают трижды. Найдите вероятность, что выпадет хотя бы один орёл.', ['$0{,}875$', '$0{,}125$', '$0{,}5$'], '$0{,}875$', 'Не подходит только РРР: $1 - \\dfrac18$ 🙃'),
        T('ЕГЭ №4', 'Бросают два кубика. Найдите вероятность, что в сумме выпадет 5. Ответ округлите до сотых.', ['$0{,}11$', '$0{,}14$', '$0{,}05$'], '$0{,}11$', '1+4, 2+3, 3+2, 4+1 — 4 из 36 🙃'),
        T('ЕГЭ №4', 'Бросают два кубика. Найдите вероятность, что на обоих выпадет одинаковое число. Ответ округлите до сотых.', ['$0{,}17$', '$0{,}03$', '$0{,}5$'], '$0{,}17$', 'Дубли: 1+1 … 6+6 — 6 из 36 🙃'),
        T('ЕГЭ №4', 'Кубик бросают один раз. Найдите вероятность, что выпадет число меньше 3.', ['$\\dfrac13$', '$\\dfrac12$', '$\\dfrac16$'], '$\\dfrac13$', 'Меньше 3 — это 1 и 2 🙃'),
    ],
}

export const PROB_AND_OR: SceneLesson = {
    question: 'И — умножаем, ИЛИ — складываем',
    mascot: 'И или ИЛИ?',
    last: 'И с ИЛИ не путаю!',
    scenes: LESSON3_SCENES,
    trials: [
        T('ЕГЭ №5', 'Стрелок попадает с вероятностью 0,9. Он стреляет 2 раза. Найдите вероятность, что он попадёт оба раза.', ['$0{,}81$', '$1{,}8$', '$0{,}9$'], '$0{,}81$', 'Попал И попал — умножаем 🙃'),
        T('ЕГЭ №5', 'Вероятность, что батарейка бракованная, 0,05. Покупатель берёт 2 батарейки. Вероятность, что обе исправны?', ['$0{,}9025$', '$0{,}9$', '$0{,}0025$'], '$0{,}9025$', 'Исправна: 0,95. Обе: $0{,}95 \\cdot 0{,}95$ 🙃'),
        T('ЕГЭ №5', 'В магазине два автомата с кофе. Каждый может сломаться за день с вероятностью 0,2. Вероятность, что хотя бы один будет работать?', ['$0{,}96$', '$0{,}04$', '$0{,}64$'], '$0{,}96$', '«Хотя бы один» $= 1 -$ «оба сломались» $= 1 - 0{,}04$ 🙃'),
        T('ЕГЭ №5', 'Вероятность, что на тесте попадётся задача на вероятность, 0,15, а на проценты — 0,3. Вместе их не бывает. Вероятность, что попадётся одна из этих тем?', ['$0{,}45$', '$0{,}045$', '$0{,}15$'], '$0{,}45$', '«ИЛИ», вместе не бывают — складываем 🙃'),
        T('ЕГЭ №5', 'Какова вероятность, что случайный телефонный номер оканчивается на две нечётные цифры?', ['$0{,}25$', '$0{,}5$', '$0{,}01$'], '$0{,}25$', 'Нечётная: 0,5. И ещё раз: $0{,}5 \\cdot 0{,}5$ 🙃'),
        T('ЕГЭ №5', 'Биатлонист стреляет 3 раза, попадает с вероятностью 0,7. Вероятность, что он промахнётся все 3 раза?', ['$0{,}027$', '$0{,}343$', '$0{,}9$'], '$0{,}027$', 'Промах $= 0{,}3$. Три раза: $0{,}3^3$ 🙃'),
    ],
}
