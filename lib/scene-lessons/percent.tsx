'use client'

// Юнит «Проценты» → урок «Кредиты, банки, проценты» (SCENEWALK, ЕГЭ №10, №11, №13).
// Главная мысль: +30% — умножаем на 1,3; −20% — умножаем на 0,8. Дальше подвох «+20% и −20%»,
// вклад (сложные проценты), кредит, обратная задача («сколько было») и «на сколько процентов».
// Мини-игра PercentBar: полоска «100%» растёт или режется, под ней число и множитель.

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Note, type Part, type Scene } from '@/components/geometry/scene-engine'
import { playJustClick } from '@/lib/sound'
import { showAnswerMeme } from '@/components/answer-meme-burst'
import type { SceneLesson } from './types'

const BLUE = '#53ADEF'
const GREEN = '#78C93C'
const RED = '#DC605B'
const fmt = (n: number) => Math.round(n).toLocaleString('ru-RU')
const comma = (n: number) => String(n).replace('.', ',')

// ===== Полоска «100%»: жмёшь кнопку — она растёт на p% или теряет p% =====
const PercentBar = ({ price, p, item, onDone }: { price: number; p: number; item: string; onDone: () => void }) => {
    const [on, setOn] = useState(false)
    const up = p > 0
    const k = 1 + p / 100
    const tap = () => {
        if (on) return
        playJustClick(); setOn(true); showAnswerMeme(true)
        setTimeout(onDone, 1600)
    }
    // ширина: 100% цены = 70% полоски (чтобы влезло +30%)
    const base = 70
    return (
        <div className="w-full flex flex-col items-center gap-3">
            <div className="text-lg font-black text-[#F2F7FB]">{item} · <span style={{ color: BLUE }}>{fmt(price)} ₽</span></div>
            <div className="relative w-full max-w-[340px] h-12">
                {/* 100% */}
                <motion.div className="absolute left-0 top-0 h-12 rounded-xl flex items-center justify-center font-black text-[#151F24]"
                    style={{ background: BLUE }} initial={{ width: `${base}%` }}
                    animate={{ width: !up && on ? `${(base * (100 + p)) / 100 - 1}%` : `${base}%` }} transition={{ type: 'spring', stiffness: 180, damping: 18 }}>
                    {!up && on ? `${100 + p}%` : '100%'}
                </motion.div>
                {up ? (
                    <motion.div className="absolute top-0 h-12 rounded-xl flex items-center justify-center font-black text-[#151F24] overflow-hidden"
                        style={{ left: `${base}%`, background: GREEN, originX: 0 }}
                        initial={{ width: 0 }} animate={{ width: on ? `${(base * p) / 100}%` : 0 }} transition={{ type: 'spring', stiffness: 180, damping: 16 }}>
                        +{p}%
                    </motion.div>
                ) : (
                    <motion.div className="absolute top-0 h-12 rounded-xl border-2 border-dashed flex items-center justify-center font-black"
                        style={{ right: `${100 - base}%`, width: `${(base * -p) / 100}%`, borderColor: RED, color: RED, background: '#161F23' }}
                        initial={{ opacity: 0 }} animate={{ opacity: on ? 1 : 0 }} transition={{ duration: 0.4 }}>
                        −{-p}%
                    </motion.div>
                )}
            </div>
            {!on ? (
                <button type="button" onClick={tap}
                    className="rounded-xl border-2 border-b-4 active:border-b-0 px-5 py-2.5 font-black text-[#151F24]"
                    style={{ background: up ? GREEN : RED, borderColor: up ? '#60A12F' : '#A84440' }}>
                    {up ? `Поднять цену на ${p}% 📈` : `Скидка ${-p}% 📉`}
                </button>
            ) : (
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 13 }}
                    className="text-center">
                    <div className="text-sm font-bold text-[#9AA7B0]">Было 100%, стало <span style={{ color: up ? GREEN : RED }}>{100 + p}%</span> = <span style={{ color: up ? GREEN : RED }}>{comma(k)}</span></div>
                    <div className="text-2xl font-black text-[#F2F7FB]">{fmt(price)} · {comma(k)} = <span style={{ color: up ? GREEN : RED }}>{fmt(price * k)} ₽</span></div>
                </motion.div>
            )}
        </div>
    )
}
const bar = (label: string, price: number, p: number, item: string): Part =>
    ({ t: 'custom', label, render: (done) => <PercentBar price={price} p={p} item={item} onDone={done} /> })

// ===== Сцены =====
const SCENES: Scene[] = [
    {
        title: 'Подорожали', next: 'Умножаю на 1,3', parts: [
            { t: 'say', text: '¡Hola, амиго! 👟 Кроссовки мечты стоили 5000 ₽. А потом про них снял видос блогер 📱' },
            { t: 'say', text: 'Цена выросла на 30%. Подними её сам 👇' },
            bar('Поднимаем цену', 5000, 30, '👟 Кроссовки'),
            { t: 'say', text: 'Было 100%, стало 130%. А 130% — это просто 1,3' },
            { t: 'say', text: 'Поэтому не надо считать 30% отдельно и прибавлять. Сразу умножай на 1,3 😎' },
        ],
    },
    {
        title: 'Скидка', next: 'Умножаю на 0,8', parts: [
            { t: 'say', text: 'Чёрная пятница! 🛍️ На кроссовки за 6500 ₽ скидка 20%' },
            bar('Режем цену', 6500, -20, '👟 Кроссовки'),
            { t: 'say', text: 'Было 100%, убрали 20%, осталось 80%. А 80% — это 0,8' },
            { t: 'calc', tex: '6500 \\cdot 0{,}8 = 5200' },
        ],
    },
    {
        title: 'Правило', next: 'Правило в кармане', parts: [
            { t: 'remember', title: 'ЗАПОМНИ!', lines: [
                'Выросло на 30% → умножаем на $1{,}3$ 📈',
                'Упало на 20% → умножаем на $0{,}8$ 📉',
                'Выросло на $p\\%$ → $\\times\\left(1 + \\dfrac{p}{100}\\right)$',
                'Упало на $p\\%$ → $\\times\\left(1 - \\dfrac{p}{100}\\right)$',
            ] },
            { t: 'say', text: 'Мнемоника Команданте: всё начинается со 100% = 1. Плюс — прибавь к единице, минус — отними от единицы 🎯' },
        ],
    },
    {
        title: 'Множитель-машина', next: 'Машина прокачана', parts: [
            { t: 'say', text: 'Включаем множитель-машину ⚙️ Называю проценты — выбери, на что умножать' },
            {
                t: 'choice', label: 'На что умножаем?', rounds: [
                    { prompt: 'Цена выросла на 15%', options: ['$1{,}15$', '$0{,}15$', '$0{,}85$'], correct: '$1{,}15$', hint: 'Выросло — к единице ПРИБАВЛЯЕМ: 1 + 0,15 🙃', ok: '100% + 15% = 115% = 1,15' },
                    { prompt: 'Скидка 40%', options: ['$0{,}6$', '$0{,}4$', '$1{,}4$'], correct: '$0{,}6$', hint: 'После скидки 40% остаётся 60% 🙃', ok: 'Осталось 60% = 0,6' },
                    { prompt: 'Цена выросла на 7%', options: ['$1{,}07$', '$1{,}7$', '$0{,}93$'], correct: '$1{,}07$', hint: '7% = 0,07, а не 0,7 🙃 (0,7 — это 70%)', ok: '1,07. Ловушку 1,7 обошёл 😎' },
                    { prompt: 'Цена выросла на 100%', options: ['$2$', '$1{,}1$', '$100$'], correct: '$2$', hint: '100% + 100% = 200% 🙃', ok: 'Выросло на 100% — значит в 2 раза ✌️' },
                    { prompt: 'Подешевело на 5%', options: ['$0{,}95$', '$0{,}5$', '$1{,}05$'], correct: '$0{,}95$', hint: '100% − 5% = 95% 🙃', ok: 'Осталось 95% = 0,95' },
                    { prompt: 'Умножили на 1,25. На сколько выросло?', options: ['на 25%', 'на 125%', 'на 1,25%'], correct: 'на 25%', hint: '1,25 = 125%, а было 100% 🙃', ok: '125% − 100% = +25%' },
                ],
            },
        ],
    },
    {
        title: 'Подвох', next: 'Меня не проведёшь', parts: [
            { t: 'say', text: 'Магазин перед распродажей поднял цену на 20%, а потом дал скидку 20% 🤡' },
            {
                t: 'choice', rounds: [
                    { prompt: 'Цена вернулась к старой?', options: ['Да, та же', 'Стала меньше', 'Стала больше'], correct: 'Стала меньше', hint: 'Умножь: 1,2 · 0,8 = ? 🙃', ok: '$1{,}2 \\cdot 0{,}8 = 0{,}96$ — на 4% меньше!' },
                ],
            },
            { t: 'say', text: 'Минус 20% берут уже от БОЛЬШЕЙ цены. Проценты всегда считаются от того, что есть СЕЙЧАС ☝️' },
        ],
    },
    {
        title: 'Вклад в банке', next: 'Я почти банкир', parts: [
            { t: 'say', text: 'Кладёшь в банк 10 000 ₽ под 10% годовых 🏦 Каждый год сумма умножается на 1,1' },
            {
                t: 'choice', label: 'Считаем вклад', rounds: [
                    { prompt: 'Сколько будет через 1 год?', options: ['11 000', '10 100', '20 000'], correct: '11 000', hint: '10 000 · 1,1 🙃', ok: '$10\\,000 \\cdot 1{,}1 = 11\\,000$' },
                    { prompt: 'А через 2 года?', options: ['12 100', '12 000', '11 100'], correct: '12 100', hint: 'Второй год считаем от 11 000: 11 000 · 1,1 🙃', ok: '$10\\,000 \\cdot 1{,}1^2 = 12\\,100$' },
                ],
            },
            { t: 'say', text: 'Видишь: не 12 000, а 12 100. Проценты капают и на проценты. Это сложные проценты 💸' },
            { t: 'card', title: 'Через n лет', tex: 'S \\cdot 1{,}1^{\\,n}' },
        ],
    },
    {
        title: 'Кредит', next: 'Кредит мне не страшен', parts: [
            { t: 'say', text: 'Взял в кредит 100 000 ₽ на игровой комп под 20% годовых 🎮 Банк — не Команданте, он ничего не прощает 😤' },
            {
                t: 'choice', label: 'Сколько должен?', rounds: [
                    { prompt: 'Долг через год (ничего не платил)', options: ['120 000', '102 000', '200 000'], correct: '120 000', hint: '+20% → умножаем на 1,2 🙃', ok: '$100\\,000 \\cdot 1{,}2 = 120\\,000$' },
                    { prompt: 'Через год вернул 50 000. Сколько остался должен?', options: ['70 000', '50 000', '60 000'], correct: '70 000', hint: '120 000 − 50 000 🙃', ok: 'Осталось 70 000' },
                    { prompt: 'А ещё через год (снова +20%)?', options: ['84 000', '90 000', '70 000'], correct: '84 000', hint: '70 000 · 1,2 🙃', ok: '$70\\,000 \\cdot 1{,}2 = 84\\,000$. Это и есть задача №13 ЕГЭ 🔥' },
                ],
            },
        ],
    },
    {
        title: 'Сколько было?', next: 'Обратно умею', parts: [
            { t: 'say', text: 'Обратная задача ⏪ После подорожания на 25% наушники стоят 5000 ₽. Сколько стоили раньше?' },
            { t: 'say', text: 'Было x, умножили на 1,25 — получили 5000. Значит, назад надо ДЕЛИТЬ' },
            {
                t: 'choice', rounds: [
                    { prompt: '$x = \\dfrac{5000}{1{,}25} = \\ ?$', options: ['4000', '3750', '6250'], correct: '4000', hint: 'Не отнимай 25% от 5000 — дели на 1,25 🙃', ok: '4000 ₽. А 3750 — классическая ловушка!' },
                ],
            },
            { t: 'remember', title: 'ЛАЙФХАК', lines: ['Знаешь «было» → УМНОЖАЙ на множитель', 'Знаешь «стало» → ДЕЛИ на множитель'] },
        ],
    },
    {
        title: 'На сколько процентов?', next: '¡Vamos!', parts: [
            { t: 'say', text: 'Последний приём 🎯 Подписка стоила 800 ₽, стала 1000 ₽. На сколько процентов подорожала?' },
            {
                t: 'choice', rounds: [
                    { prompt: '$\\dfrac{1000}{800} = \\ ?$', options: ['$1{,}25$', '$1{,}2$', '$0{,}8$'], correct: '$1{,}25$', hint: 'Раздели новую цену на старую 🙃', ok: 'Множитель 1,25' },
                    { prompt: 'Значит, подорожала на…', options: ['25%', '20%', '200%'], correct: '25%', hint: '1,25 = 125%. Отними 100% 🙃', ok: 'На 25%. Подписка, ты чего? 😤' },
                ],
            },
        ],
    },
]

const T = (tag: string, text: string, options: string[], answer: string, hint: string) => ({ tag, text, options, answer, hint })

export const PERCENT_BANK: SceneLesson = {
    question: 'Кредиты, банки, проценты',
    mascot: 'Деньги любят счёт, амиго!',
    last: 'Я финансовый гений!',
    scenes: SCENES,
    trials: [
        T('ЕГЭ №11', 'Футболка стоила 1200 ₽. Цену подняли на 15%. Сколько стоит футболка?', ['1380', '1215', '1020'], '1380', '+15% → умножаем на 1,15 🙃'),
        T('ЕГЭ №11', 'Телефон стоил 30 000 ₽, на распродаже скидка 35%. Сколько он стоит со скидкой?', ['19 500', '10 500', '29 650'], '19 500', 'Остаётся 65% → умножаем на 0,65 🙃'),
        T('ЕГЭ №11', 'Цену сначала подняли на 10%, потом снизили на 10%. Как изменилась цена?', ['уменьшилась на 1%', 'не изменилась', 'выросла на 1%'], 'уменьшилась на 1%', '$1{,}1 \\cdot 0{,}9 = 0{,}99$ 🙃'),
        T('ЕГЭ №11', 'После подорожания на 20% торт стоит 900 ₽. Сколько он стоил раньше?', ['750', '720', '1080'], '750', 'Знаешь «стало» → дели на 1,2 🙃'),
        T('ЕГЭ №11', 'Билет стоил 400 ₽, стал стоить 500 ₽. На сколько процентов подорожал?', ['на 25%', 'на 20%', 'на 100%'], 'на 25%', '$\\dfrac{500}{400} = 1{,}25$ 🙃'),
        T('ЕГЭ №13', 'Вклад 20 000 ₽ под 10% годовых. Сколько будет на вкладе через 2 года?', ['24 200', '24 000', '22 000'], '24 200', '$20\\,000 \\cdot 1{,}1 \\cdot 1{,}1$ 🙃'),
        T('ЕГЭ №13', 'Взяли кредит 200 000 ₽ под 10% годовых. Через год вернули 100 000 ₽. Сколько осталось должны?', ['120 000', '100 000', '110 000'], '120 000', '$200\\,000 \\cdot 1{,}1 - 100\\,000$ 🙃'),
        T('ЕГЭ №10', 'Зарплата выросла на 20%, а потом ещё на 50%. Во сколько раз она выросла за два раза?', ['в 1,8 раза', 'в 1,7 раза', 'в 1,1 раза'], 'в 1,8 раза', '$1{,}2 \\cdot 1{,}5$ 🙃'),
    ],
}
