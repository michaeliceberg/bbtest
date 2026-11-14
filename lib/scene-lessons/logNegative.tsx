// «Отрицательные степени в логарифмах»: сначала напоминаем степени (минус = перевёртыш, корень = дробная степень,
// aᵐ/ⁿ = ⁿ√aᵐ, a⁰ = 1, комбо минус + дробь), потом логарифмы от дробей и корней.
// Переделка по правилам step-by-step: маленькие порции, ack-тезисы, мини-игры вместо чтения, шутки, перелёт числа в знаменатель.
import { useRef, useState } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import type { SceneLesson } from './types'
import { dessert } from './logHelpers'
import { walkthroughButtonClass, walkthroughButtonStyle } from '@/components/geometry/WalkthroughLog'
import { playJustClick } from '@/lib/sound'
import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors'

const NUM = GGEGE_PALETTE.blue.button

// Степень как HTML: основание + показатель; для перелёта нужны настоящие элементы, а не KaTeX.
const Pw = ({ b, children }: { b: string; children: React.ReactNode }) => (
    <span className="inline-flex items-start leading-none">
        <span>{b}</span>
        <span className="ml-0.5 mt-[-0.05em] text-[0.55em] leading-none">{children}</span>
    </span>
)

// «Перевёртыш»: ученик нажимает кнопку, и число (без минуса) перелетает по дуге в знаменатель.
// Слева остаётся a⁻ⁿ, справа растёт 1 / aⁿ; движется только transform/opacity.
const FlipDemo = ({ b, n, label, onDone }: { b: string; n: string; label: string; onDone: () => void }) => {
    const src = useRef<HTMLSpanElement>(null)
    const dst = useRef<HTMLSpanElement>(null)
    const d = useRef({ x: 0, y: 0 })
    const [phase, setPhase] = useState<'idle' | 'fly' | 'done'>('idle')
    const p = useMotionValue(0)
    const x = useTransform(p, (v) => d.current.x * v)
    const y = useTransform(p, (v) => d.current.y * v - 46 * 4 * v * (1 - v))
    const minusOp = useTransform(p, [0.5, 0.85], [1, 0])
    const cloneOp = useTransform(p, [0.88, 1], [1, 0])
    const dstOp = useTransform(p, [0.88, 1], [0, 1])
    const go = () => {
        if (phase !== 'idle' || !src.current || !dst.current) return
        playJustClick()
        const s = src.current.getBoundingClientRect(), t = dst.current.getBoundingClientRect()
        d.current = { x: t.left + t.width / 2 - (s.left + s.width / 2), y: t.top + t.height / 2 - (s.top + s.height / 2) }
        setPhase('fly')
        animate(p, 1, { duration: 1.2, ease: 'easeInOut', onComplete: () => { setPhase('done'); setTimeout(onDone, 900) } })
    }
    return (
        <div className="w-full flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-4 text-6xl font-black text-[#F2F7FB] h-[140px]">
                <span ref={src} className="relative inline-block">
                    <Pw b={b}>−{n}</Pw>
                    {phase !== 'idle' && (
                        <motion.span className="absolute left-0 top-0 whitespace-nowrap" style={{ x, y, opacity: cloneOp, color: NUM }}>
                            <Pw b={b}><motion.span style={{ opacity: minusOp }}>−</motion.span>{n}</Pw>
                        </motion.span>
                    )}
                </span>
                <span>=</span>
                <span className="inline-flex flex-col items-center gap-1 transition-opacity duration-500" style={{ opacity: phase === 'idle' ? 0 : 1 }}>
                    <span>1</span>
                    <span className="block h-[4px] w-full rounded-full bg-[#F2F7FB]" />
                    <motion.span ref={dst} className="inline-block" style={{ opacity: dstOp, color: NUM }}><Pw b={b}>{n}</Pw></motion.span>
                </span>
            </div>
            {phase === 'idle' && (
                <div className="w-full flex">
                    <button type="button" className={walkthroughButtonClass(true)} style={walkthroughButtonStyle(true)} onClick={go}>{label}</button>
                </div>
            )}
        </div>
    )
}
const flip = (b: string, n: string, label: string) => ({ t: 'custom' as const, render: (done: () => void) => <FlipDemo b={b} n={n} label={label} onDone={done} /> })

export const LOG_NEGATIVE: SceneLesson = {
    question: 'Отрицательные степени в логарифмах',
    mascot: 'Минус и дробь в степени',
    last: 'Готово, я шарю',
    scenes: [
        {
            title: 'Минус в степени', next: 'Минус — это вниз', parts: [
                { t: 'say', text: 'Что значит минус в степени?' },
                { t: 'pause', ms: 700 },
                { t: 'say', text: 'Число от этого не стало отрицательным' },
                { t: 'pause', ms: 800 },
                { t: 'say', text: 'Минус говорит: переверни' },
                { t: 'pause', ms: 700 },
                flip('5', '2', 'Отправить вниз'),
                { t: 'say', text: 'Минус пропал, а пятёрка уехала в знаменатель' },
                { t: 'pause', ms: 800 },
                { t: 'calc', tex: '5^{-2} = \\dfrac{1}{5^2} = \\dfrac{1}{25}' },
                { t: 'ack', label: 'Понял, минус — это вниз' },
                { t: 'say', text: 'Сел в лифт и поехал на первый этаж' },
                { t: 'pause', ms: 800 },
                { t: 'say', text: 'Ещё раз, теперь сам' },
                flip('7', '3', 'Отправить вниз'),
                { t: 'calc', tex: '7^{-3} = \\dfrac{1}{7^3}' },
                { t: 'pause', ms: 700 },
                { t: 'remember', title: 'ЗАПОМНИ', lines: ['$a^{-n} = \\dfrac{1}{a^n}$', 'Минус пропадает, число едет в знаменатель'] },
            ],
        },
        {
            title: 'Тренируем минус', next: 'Минус-степень освоил', parts: [
                { t: 'say', text: 'Теперь собери сам' },
                {
                    t: 'build', prompt: 'Собери перевёртыш', tpl: ['$3^{-2} =$', { frac: [['1'], [{ s: 0 }]] }],
                    chips: ['$3^2$', '$-3^2$', '$2^3$', '$-9$', '$3$', '$6$'], slots: ['$3^2$'], hint: 'Минус пропадает, а $3^2$ едет вниз',
                },
                {
                    t: 'choice', label: 'Разминка', rounds: [
                        { prompt: '$2^{-3} = \\ ?$', options: ['$\\dfrac18$', '$-8$', '$-6$'], correct: '$\\dfrac18$', hint: 'Это не минус восемь. Это один делить на $2^3$', ok: '$2^{-3} = \\dfrac18$' },
                        { prompt: '$10^{-2} = \\ ?$', options: ['$\\dfrac{1}{100}$', '$-100$', '$\\dfrac{1}{20}$'], correct: '$\\dfrac{1}{100}$', hint: '$10^2 = 100$, и сотка едет вниз', ok: '$10^{-2} = \\dfrac{1}{100}$' },
                        { prompt: 'А в обратную сторону: $\\dfrac{1}{4^3} = 4^{?}$', options: ['$-3$', '$3$', '$-4$'], correct: '$-3$', hint: 'Всё стоит в знаменателе, значит показатель с минусом', ok: '$\\dfrac{1}{4^3} = 4^{-3}$' },
                        { prompt: '$\\dfrac{1}{7} = 7^{?}$', options: ['$-1$', '$1$', '$0$'], correct: '$-1$', hint: '$7 = 7^1$, и она стоит внизу', ok: '$\\dfrac17 = 7^{-1}$' },
                    ],
                },
            ],
        },
        {
            title: 'Корень — это степень', next: 'Корень — это дробь в степени', parts: [
                { t: 'say', text: 'Корень тоже умеет прикидываться степенью' },
                { t: 'pause', ms: 700 },
                { t: 'calc', tex: '\\sqrt[3]{5}' },
                { t: 'say', text: 'Тройка у корня уезжает в знаменатель показателя' },
                { t: 'pause', ms: 900 },
                { t: 'calc', tex: '\\sqrt[3]{5} = 5^{\\frac13}' },
                { t: 'pause', ms: 900 },
                { t: 'say', text: 'Пятёрка в корне, пятёрка в основании, а в показателе единица на тройку' },
                { t: 'ack', label: 'Корень — это дробь в степени' },
                { t: 'say', text: 'Ещё один пример' },
                { t: 'calc', tex: '\\sqrt[5]{4} = 4^{\\frac15}' },
                { t: 'pause', ms: 700 },
                { t: 'remember', title: 'ЗАПОМНИ', lines: ['$\\sqrt[n]{a} = a^{\\frac1n}$', 'Корень — это степень с дробью'] },
            ],
        },
        {
            title: 'Тренируем корни', next: 'Корни освоил', parts: [
                {
                    t: 'build', prompt: 'Собери степень', tpl: ['$\\sqrt[5]{4} =$', { s: 0 }],
                    chips: ['$4^{\\frac15}$', '$4^5$', '$5^4$', '$4^{-5}$', '$\\dfrac45$', '$5^{\\frac14}$'], slots: ['$4^{\\frac15}$'], hint: 'Пятёрка у корня уезжает в знаменатель показателя',
                },
                {
                    t: 'choice', label: 'Корни', rounds: [
                        { prompt: '$\\sqrt[4]{3} = 3^{?}$', options: ['$\\dfrac14$', '$4$', '$-4$'], correct: '$\\dfrac14$', hint: 'Четвёрка у корня уезжает в знаменатель', ok: '$\\sqrt[4]{3} = 3^{\\frac14}$' },
                        { prompt: '$\\sqrt{7} = 7^{?}$', options: ['$\\dfrac12$', '$2$', '$-\\dfrac12$'], correct: '$\\dfrac12$', hint: 'У квадратного корня двойка спрятана', ok: '$\\sqrt{7} = 7^{\\frac12}$' },
                        { prompt: 'В обратную сторону: $11^{\\frac13} = \\ ?$', options: ['$\\sqrt[3]{11}$', '$\\sqrt{11}$', '$\\dfrac{11}{3}$'], correct: '$\\sqrt[3]{11}$', hint: 'Знаменатель показателя — это степень корня', ok: '$11^{\\frac13} = \\sqrt[3]{11}$' },
                        { prompt: '$2^{\\frac16} = \\ ?$', options: ['$\\sqrt[6]{2}$', '$\\sqrt{2}$', '$\\dfrac{2}{6}$'], correct: '$\\sqrt[6]{2}$', hint: 'Шестёрка снизу значит корень шестой степени', ok: '$2^{\\frac16} = \\sqrt[6]{2}$' },
                    ],
                },
            ],
        },
        {
            title: 'Числитель — степень под корнем', next: 'Верх — степень, низ — корень', parts: [
                { t: 'say', text: 'А если в числителе не единица?' },
                { t: 'pause', ms: 700 },
                { t: 'calc', tex: '5^{\\frac23}' },
                { t: 'say', text: 'Знаменатель 3 — это корень третьей степени' },
                { t: 'pause', ms: 900 },
                { t: 'say', text: 'А числитель 2 — степень под корнем' },
                { t: 'pause', ms: 900 },
                { t: 'calc', tex: '5^{\\frac23} = \\sqrt[3]{5^2}' },
                { t: 'pause', ms: 900 },
                { t: 'remember', title: 'ЗАПОМНИ', lines: ['$a^{\\frac mn} = \\sqrt[n]{a^m}$', 'Низ — корень, верх — степень под корнем'] },
                {
                    t: 'choice', label: 'Туда и обратно', rounds: [
                        { prompt: '$7^{\\frac34} = \\ ?$', options: ['$\\sqrt[4]{7^3}$', '$\\sqrt[3]{7^4}$', '$\\dfrac{7^3}{7^4}$'], correct: '$\\sqrt[4]{7^3}$', hint: 'Знаменатель 4 — корень четвёртой степени, числитель 3 — степень', ok: '$7^{\\frac34} = \\sqrt[4]{7^3}$' },
                        { prompt: '$\\sqrt[5]{2^3} = 2^{?}$', options: ['$\\dfrac35$', '$\\dfrac53$', '$15$'], correct: '$\\dfrac35$', hint: 'Корень пятой степени уезжает вниз, тройка остаётся вверху', ok: '$\\sqrt[5]{2^3} = 2^{\\frac35}$' },
                        { prompt: '$\\sqrt{3^5} = 3^{?}$', options: ['$\\dfrac52$', '$\\dfrac25$', '$10$'], correct: '$\\dfrac52$', hint: 'У квадратного корня двойка внизу, пятёрка сверху', ok: '$\\sqrt{3^5} = 3^{\\frac52}$' },
                    ],
                },
                { t: 'ack', label: 'Верх — степень, низ — корень' },
            ],
        },
        {
            title: 'Нулевая степень', next: 'Нуль в степени — единица', parts: [
                { t: 'say', text: 'И ещё один фокус' },
                { t: 'calc', tex: '2^0 = \\ ?' },
                {
                    t: 'choice', rounds: [
                        { prompt: '$2^0 = \\ ?$', options: ['$1$', '$0$', '$2$'], correct: '$1$', hint: 'Ноль в степени не обнуляет число', ok: '$2^0 = 1$' },
                        { prompt: '$100^0 = \\ ?$', options: ['$1$', '$0$', '$100$'], correct: '$1$', hint: 'Любое число в нулевой степени — единица', ok: '$100^0 = 1$' },
                    ],
                },
                { t: 'remember', title: 'ЗАПОМНИ', lines: ['$a^0 = 1$', 'Любое число, кроме нуля'] },
            ],
        },
        {
            title: 'Комбо: минус и дробь', next: 'Комбо собрал', parts: [
                { t: 'say', text: 'А теперь всё вместе: и корень, и минус' },
                { t: 'pause', ms: 700 },
                { t: 'calc', tex: '\\dfrac{1}{\\sqrt[4]{5^5}}' },
                { t: 'say', text: 'Идём по порядку. Сначала корень' },
                { t: 'pause', ms: 700 },
                {
                    t: 'choice', rounds: [
                        { prompt: '$\\sqrt[4]{5^5} = 5^{?}$', options: ['$\\dfrac54$', '$\\dfrac45$', '$20$'], correct: '$\\dfrac54$', hint: 'Четвёрка внизу, пятёрка сверху', ok: '$\\sqrt[4]{5^5} = 5^{\\frac54}$' },
                    ],
                },
                { t: 'calc', tex: '\\dfrac{1}{5^{\\frac54}}' },
                { t: 'say', text: 'Теперь число стоит в знаменателе' },
                { t: 'pause', ms: 700 },
                {
                    t: 'choice', rounds: [
                        { prompt: '$\\dfrac{1}{5^{\\frac54}} = 5^{?}$', options: ['$-\\dfrac54$', '$\\dfrac54$', '$-\\dfrac45$'], correct: '$-\\dfrac54$', hint: 'В знаменателе — значит минус в показателе', ok: '$\\dfrac{1}{\\sqrt[4]{5^5}} = 5^{-\\frac54}$' },
                    ],
                },
                { t: 'ack', label: 'Минус и дробь — комбо' },
                { t: 'say', text: 'И обратно: от степени к корню' },
                { t: 'pause', ms: 700 },
                {
                    t: 'choice', label: 'Комбо', rounds: [
                        { prompt: '$7^{-\\frac23} = \\ ?$', options: ['$\\dfrac{1}{\\sqrt[3]{7^2}}$', '$\\dfrac{1}{\\sqrt{7^3}}$', '$-\\sqrt[3]{7^2}$'], correct: '$\\dfrac{1}{\\sqrt[3]{7^2}}$', hint: 'Минус отправляет всё вниз, тройка внизу — корень третьей степени', ok: '$7^{-\\frac23} = \\dfrac{1}{\\sqrt[3]{7^2}}$' },
                        { prompt: '$\\dfrac{1}{\\sqrt[3]{2^4}} = 2^{?}$', options: ['$-\\dfrac43$', '$\\dfrac43$', '$-\\dfrac34$'], correct: '$-\\dfrac43$', hint: 'Корень третьей степени — внизу, четвёрка — вверху, а перед всем минус', ok: '$\\dfrac{1}{\\sqrt[3]{2^4}} = 2^{-\\frac43}$' },
                        { prompt: '$\\sqrt[5]{3^{-2}} = 3^{?}$', options: ['$-\\dfrac25$', '$-\\dfrac52$', '$\\dfrac25$'], correct: '$-\\dfrac25$', hint: 'Показатель −2 делим на 5', ok: '$\\sqrt[5]{3^{-2}} = 3^{-\\frac25}$' },
                        { prompt: 'Минус, дробь и корень в одном примере. Что делаем?', options: ['Идём по порядку', 'Плачем', 'Закрываем тетрадь', 'Звоним маме'], correct: 'Идём по порядку', hint: 'Слёзы не помогут. Сначала корень, потом минус', ok: 'Так и делаем, шаг за шагом' },
                    ],
                },
            ],
        },
        {
            title: 'Числа с красивым ответом', next: 'Числа считаются', parts: [
                { t: 'say', text: 'Иногда степень можно просто посчитать' },
                { t: 'calc', tex: '8^{-\\frac13} = \\ ?' },
                { t: 'say', text: 'Восемь это два в кубе' },
                { t: 'pause', ms: 700 },
                {
                    t: 'choice', rounds: [
                        { prompt: '$8^{\\frac13} = \\sqrt[3]{8} = \\ ?$', options: ['$2$', '$3$', '$\\dfrac83$'], correct: '$2$', hint: '$2 \\cdot 2 \\cdot 2 = 8$', ok: '$8^{\\frac13} = 2$' },
                        { prompt: 'А с минусом: $8^{-\\frac13} = \\dfrac{1}{8^{\\frac13}} = \\ ?$', options: ['$\\dfrac12$', '$-2$', '$-\\dfrac12$'], correct: '$\\dfrac12$', hint: 'Минус перевернул двойку', ok: '$8^{-\\frac13} = \\dfrac12$' },
                        { prompt: '$9^{-\\frac12} = \\ ?$', options: ['$\\dfrac13$', '$-3$', '$-\\dfrac13$'], correct: '$\\dfrac13$', hint: '$9^{\\frac12} = \\sqrt9 = 3$, а потом переворот', ok: '$9^{-\\frac12} = \\dfrac13$' },
                    ],
                },
            ],
        },
        {
            title: 'Логарифм дроби', next: 'Минус в ответе — норм', parts: [
                { t: 'say', text: 'Вернёмся к логарифмам' },
                { t: 'calc', tex: '\\log_2 \\dfrac18 = \\ ?' },
                { t: 'say', text: 'Спрашиваем: 2 в какой степени даёт одну восьмую?' },
                { t: 'pause', ms: 700 },
                {
                    t: 'choice', rounds: [
                        { prompt: '$\\dfrac18 = 2^{?}$', options: ['$-3$', '$3$', '$-8$'], correct: '$-3$', hint: '$8 = 2^3$, а дробь — значит минус', ok: '$\\dfrac18 = 2^{-3}$' },
                    ],
                },
                { t: 'calc', tex: '\\log_2 \\dfrac18 = -3' },
                { t: 'say', text: 'Логарифм бывает отрицательным, и это нормально' },
                { t: 'ack', label: 'Минус в ответе — это нормально' },
                { t: 'card', title: 'Логарифм дроби', tex: '\\log_a \\dfrac{1}{a^n} = -n' },
                {
                    t: 'choice', rounds: [
                        { prompt: '$\\log_2 \\dfrac14 = \\ ?$', options: ['$-2$', '$2$', '$\\dfrac14$'], correct: '$-2$', hint: '$\\dfrac14 = 2^{-2}$', ok: '$-2$' },
                        { prompt: '$\\log_3 \\dfrac{1}{27} = \\ ?$', options: ['$-3$', '$3$', '$-9$'], correct: '$-3$', hint: '$27 = 3^3$, а в знаменателе минус', ok: '$-3$' },
                        { prompt: '$\\log_5 0{,}2 = \\ ?$', options: ['$-1$', '$-2$', '$0{,}2$'], correct: '$-1$', hint: '$0{,}2 = \\dfrac15$. Хитро замаскировался', ok: '$0{,}2 = \\dfrac15 = 5^{-1}$, ответ −1' },
                    ],
                },
            ],
        },
        {
            title: 'Корень в логарифме', next: 'Дробь в ответе — норм', parts: [
                { t: 'calc', tex: '\\log_2 \\sqrt[3]{2} = \\ ?' },
                { t: 'say', text: 'Корень — это степень с дробью' },
                { t: 'pause', ms: 700 },
                {
                    t: 'choice', rounds: [
                        { prompt: '$\\sqrt[3]{2} = 2^{?}$', options: ['$\\dfrac13$', '$3$', '$-\\dfrac13$'], correct: '$\\dfrac13$', hint: 'Тройка у корня уезжает в знаменатель', ok: '$\\sqrt[3]{2} = 2^{\\frac13}$' },
                    ],
                },
                { t: 'calc', tex: '\\log_2 \\sqrt[3]{2} = \\dfrac13' },
                { t: 'say', text: 'А если корень ещё и в знаменателе?' },
                { t: 'calc', tex: '\\log_3 \\dfrac{1}{\\sqrt{3}}' },
                { t: 'pause', ms: 700 },
                {
                    t: 'choice', rounds: [
                        { prompt: '$\\dfrac{1}{\\sqrt{3}} = 3^{?}$', options: ['$-\\dfrac12$', '$\\dfrac12$', '$-2$'], correct: '$-\\dfrac12$', hint: 'Корень — это половинка степени, а знаменатель добавляет минус', ok: '$\\dfrac{1}{\\sqrt3} = 3^{-\\frac12}$, ответ $-\\dfrac12$' },
                        { prompt: '$\\log_5 \\sqrt[4]{5} = \\ ?$', options: ['$\\dfrac14$', '$4$', '$-\\dfrac14$'], correct: '$\\dfrac14$', hint: '$\\sqrt[4]{5} = 5^{\\frac14}$', ok: '$\\dfrac14$' },
                    ],
                },
            ],
        },
        {
            title: 'Разные основания и дробь внизу', next: 'Общее основание — сила', parts: [
                { t: 'calc', tex: '\\log_8 \\dfrac12 = \\ ?' },
                { t: 'say', text: 'Восемь и одна вторая — оба из семьи двойки' },
                { t: 'pause', ms: 700 },
                {
                    t: 'choice', label: 'Через двойку', rounds: [
                        { prompt: '$8 = 2^{?}$', options: ['$3$', '$4$', '$-3$'], correct: '$3$', hint: '2 · 2 · 2', ok: '$8 = 2^3$' },
                        { prompt: '$\\dfrac12 = 2^{?}$', options: ['$-1$', '$1$', '$-2$'], correct: '$-1$', hint: 'Перевёртыш двойки', ok: '$\\dfrac12 = 2^{-1}$' },
                    ],
                },
                { t: 'calc', tex: '(2^3)^x = 2^{-1} \\;\\Rightarrow\\; 3x = -1' },
                {
                    t: 'choice', rounds: [
                        { prompt: '$3x = -1,\\ x = \\ ?$', options: ['$-\\dfrac13$', '$-3$', '$\\dfrac13$'], correct: '$-\\dfrac13$', hint: 'Делим −1 на 3', ok: '$\\log_8 \\dfrac12 = -\\dfrac13$. Минус и дробь сразу, комбо' },
                    ],
                },
                { t: 'ack', label: 'Всё через двойку, понял' },
                { t: 'calc', tex: '\\log_{\\frac12} 16 = \\ ?' },
                { t: 'say', text: 'Теперь дробь в основании. Тот же трюк' },
                { t: 'calc', tex: '\\left(\\tfrac12\\right)^x = 16 \\;\\Rightarrow\\; 2^{-x} = 2^4' },
                {
                    t: 'choice', rounds: [
                        { prompt: '$-x = 4,\\ x = \\ ?$', options: ['$-4$', '$4$', '$\\dfrac14$'], correct: '$-4$', hint: 'Если −x = 4, то x = −4', ok: '$\\log_{\\frac12} 16 = -4$' },
                        { prompt: 'А если обе дроби? $\\log_{\\frac13} \\dfrac19 = \\ ?$', options: ['$2$', '$-2$', '$\\dfrac12$'], correct: '$2$', hint: '$\\left(\\tfrac13\\right)^2 = \\tfrac19$', ok: 'Минус на минус даёт плюс' },
                    ],
                },
                {
                    t: 'remember', title: 'ЗАПОМНИ', lines: [
                        '1. $\\dfrac{1}{a^n} = a^{-n}$, а корень — это дробь в степени',
                        '2. Основание и аргумент записываем через одно число (2, 3, 5)',
                        '3. Основание и аргумент по разные стороны от 1, значит ответ отрицательный',
                    ],
                },
            ],
        },
    ],
    trials: [
        { tag: 'Минус', text: '$6^{-2} = \\ ?$', options: ['$\\dfrac{1}{36}$', '$-36$', '$-12$', '$\\dfrac{1}{12}$'], answer: '$\\dfrac{1}{36}$', hint: '$6^{-2} = \\dfrac{1}{6^2}$' },
        { tag: 'Корень', text: '$\\sqrt[4]{5} = 5^{?}$', options: ['$\\dfrac14$', '$4$', '$-\\dfrac14$', '$\\dfrac54$'], answer: '$\\dfrac14$', hint: 'Четвёрка у корня уезжает в знаменатель' },
        { tag: 'Числитель', text: '$3^{\\frac52} = \\ ?$', options: ['$\\sqrt{3^5}$', '$\\sqrt[5]{3^2}$', '$\\dfrac{3^5}{3^2}$', '$\\dfrac{3^2}{3^5}$'], answer: '$\\sqrt{3^5}$', hint: 'Знаменатель 2 — корень, числитель 5 — степень под корнем' },
        {
            tag: 'Подвох', text: 'Минус в показателе степени. Что делаем?',
            options: ['Переворачиваем число', 'Плачем', 'Закрываем тетрадь', 'Звоним маме'], answer: 'Переворачиваем число',
            hint: 'Слёзы не помогут. Минус отправляет число в знаменатель',
        },
        { tag: 'Комбо', text: '$\\dfrac{1}{\\sqrt[3]{7^2}} = 7^{?}$', options: ['$-\\dfrac23$', '$\\dfrac23$', '$-\\dfrac32$', '$-6$'], answer: '$-\\dfrac23$', hint: 'Корень третьей степени, двойка вверху, а знаменатель добавляет минус' },
        { tag: 'Считаем', text: '$27^{-\\frac13} = \\ ?$', options: ['$\\dfrac13$', '$-3$', '$-\\dfrac13$', '$9$'], answer: '$\\dfrac13$', hint: '$27^{\\frac13} = 3$, потом переворот' },
        { tag: 'Считаем', text: '$16^{\\frac34} = \\ ?$', options: ['$8$', '$12$', '$4$', '$64$'], answer: '$8$', hint: '$16^{\\frac14} = 2$, потом в третьей степени: 8' },
        { tag: 'Логарифм', text: '$\\log_2 \\dfrac{1}{32} = \\ ?$', options: ['$-5$', '$5$', '$-\\dfrac15$', '$-16$'], answer: '$-5$', hint: '$32 = 2^5$' },
        { tag: 'Логарифм', text: '$\\log_9 \\dfrac13 = \\ ?$', options: ['$-\\dfrac12$', '$\\dfrac12$', '$-3$', '$-2$'], answer: '$-\\dfrac12$', hint: '$9 = 3^2$, $\\tfrac13 = 3^{-1}$, значит $2x = -1$' },
        { tag: 'Логарифм', text: '$\\log_3 \\dfrac{1}{\\sqrt{3}} = \\ ?$', options: ['$-\\dfrac12$', '$\\dfrac12$', '$-2$', '$-3$'], answer: '$-\\dfrac12$', hint: '$\\dfrac{1}{\\sqrt3} = 3^{-\\frac12}$' },
        { tag: 'Дробь внизу', text: '$\\log_{\\frac13} 27 = \\ ?$', options: ['$-3$', '$3$', '$-9$', '$\\dfrac13$'], answer: '$-3$', hint: '$\\left(\\tfrac13\\right)^{-3} = 27$' },
        dessert('степенях и логарифмах'),
    ],
}
