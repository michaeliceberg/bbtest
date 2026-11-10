// Логарифмы → «Как складывать логарифмы?»: log_a x + log_a y = log_a (x·y), одинаковое основание, подвох с разными, как в ЕГЭ (№7).
// Переделка старого LOGWALK по правилам step-by-step (исходник — тег logs-lesson-original-2026-11-10).
import type { SceneLesson } from './types'
import { MathText } from '@/components/geometry/plain-math'
import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors'

const BASE = GGEGE_PALETTE.blue.button
const X = GGEGE_PALETTE.teal.button
const Y = GGEGE_PALETTE.raspberry.button
const col = (c: string, s: string) => `\\textcolor{${c}}{${s}}`

// Формула-«картинка» сцены: одна на сцену, меняется на месте (подсветка, не перерисовка)
const Fig = ({ tex }: { tex: string }) => (
    <div className="w-full text-center text-3xl md:text-4xl font-black text-[#F2F7FB] py-1"><MathText>{`$${tex}$`}</MathText></div>
)

const EGE_TEXT = 'Найдите значение выражения\n{{base|log₉}} {{arg|16,2}} + {{base|log₉}} {{arg|5}}'

export const LOG_SUM: SceneLesson = {
    question: 'Как складывать логарифмы?',
    mascot: 'Сумма логарифмов',
    last: 'Готово, я шарю',
    scenes: [
        {
            title: 'Одинаковые основания', next: 'Склеим близнецов', parts: [
                { t: 'say', text: 'Знакомься: два логарифма и плюс между ними' },
                { t: 'fig', node: <Fig tex="\log_2 3 + \log_2 5" /> },
                { t: 'pause', ms: 700 },
                { t: 'say', text: 'Первым делом смотрим на основания' },
                { t: 'fig', node: <Fig tex={`\\log_{${col(BASE, '2')}} 3 + \\log_{${col(BASE, '2')}} 5`} /> },
                { t: 'pause', ms: 900 },
                { t: 'say', text: 'У обоих двойка. Близнецы!' },
                { t: 'ack', label: 'Основания одинаковые, понял' },
                { t: 'say', text: 'А близнецов можно склеить в один логарифм' },
            ],
        },
        {
            title: 'Плюс становится умножением', next: 'Плюс снаружи, умножение внутри', parts: [
                { t: 'fig', node: <Fig tex="\log_2 3 + \log_2 5 = \log_2(\ ?\ )" /> },
                { t: 'say', text: 'Основание остаётся то же' },
                { t: 'pause', ms: 700 },
                { t: 'say', text: 'А что будет в скобках?' },
                {
                    t: 'choice', rounds: [
                        { prompt: 'Числа 3 и 5 внутри:', options: ['перемножатся', 'сложатся', 'вычтутся'], correct: 'перемножатся', hint: 'Плюс остаётся снаружи, а внутри хитрее' },
                    ],
                },
                { t: 'say', text: 'Сложили логарифмы, а числа перемножились. Математика любит подлянки' },
                { t: 'pause', ms: 900 },
                {
                    t: 'build', prompt: 'Собери, что в скобках', tpl: ['$\\log_2 3 + \\log_2 5 = \\log_2$', '(', { s: 0 }, { s: 1 }, { s: 2 }, ')'],
                    chips: ['3', '·', '5', '+', '8'], slots: ['3', '·', '5'], any: [[0, 2]], hint: 'Внутри тройка и пятёрка, а между ними умножение',
                },
                { t: 'calc', tex: '\\log_2 3 + \\log_2 5 = \\log_2 (3 \\cdot 5) = \\log_2 15' },
                { t: 'pause', ms: 700 },
                {
                    t: 'remember', title: 'ЗАПОМНИ', lines: [
                        '$\\log_a x + \\log_a y = \\log_a (x \\cdot y)$',
                        'Плюс снаружи, умножение внутри',
                        'Основание не меняется',
                    ],
                },
            ],
        },
        {
            title: 'Считаем до числа', next: 'Считаю до конца', parts: [
                { t: 'fig', node: <Fig tex="\log_6 4 + \log_6 9" /> },
                { t: 'say', text: 'Основания одинаковые, склеиваем' },
                {
                    t: 'choice', rounds: [
                        { prompt: '$4 \\cdot 9 = \\ ?$', options: ['$36$', '$13$', '$49$'], correct: '$36$', hint: 'Умножаем, а не складываем', ok: '$4 \\cdot 9 = 36$' },
                    ],
                },
                { t: 'calc', tex: '\\log_6 4 + \\log_6 9 = \\log_6 36' },
                { t: 'pause', ms: 700 },
                { t: 'say', text: 'В какую степень возвести 6, чтобы получить 36?' },
                {
                    t: 'choice', rounds: [
                        { prompt: '$6^{?} = 36$', options: ['$2$', '$3$', '$6$'], correct: '$2$', hint: 'Шесть на шесть: 6 · 6 = 36', ok: '$6^2 = 36$' },
                    ],
                },
                { t: 'calc', tex: '\\log_6 4 + \\log_6 9 = \\log_6 36 = 2' },
            ],
        },
        {
            title: 'Разные основания', next: 'Разные основания, стоп', parts: [
                { t: 'fig', node: <Fig tex="\log_2 3 + \log_5 7" /> },
                { t: 'say', text: 'А тут основания разные: 2 и 5' },
                { t: 'pause', ms: 700 },
                {
                    t: 'choice', rounds: [
                        { prompt: 'Склеиваем?', options: ['Нет, основания разные', 'Да, перемножаем 3 и 7', 'Да, складываем 2 и 5'], correct: 'Нет, основания разные', hint: 'Разные основания дружить не будут: склеить нельзя' },
                    ],
                },
                { t: 'say', text: 'Разные основания дружить не будут' },
                { t: 'pause', ms: 700 },
                { t: 'remember', title: 'ЗАПОМНИ', lines: ['Склеивать можно только при одинаковом основании'] },
            ],
        },
        {
            title: 'Как в ЕГЭ', next: 'Решил как в ЕГЭ', parts: [
                {
                    t: 'ege', num: 7, text: EGE_TEXT, start: 'Найти значение',
                    quiz: [
                        { focus: 'base', prompt: 'Основания одинаковые?', options: ['Да, оба девятки', 'Нет, разные'], correct: 'Да, оба девятки', hint: 'Смотри на маленькие цифры внизу' },
                        { focus: 'arg', prompt: 'Что делаем с 16,2 и 5?', options: ['Перемножаем', 'Складываем', 'Делим'], correct: 'Перемножаем', hint: 'Плюс снаружи, умножение внутри' },
                        { focus: 'arg', prompt: '16,2 · 5 = ?', options: ['81', '21,2', '8,1'], correct: '81', hint: '16 · 5 = 80, и ещё 0,2 · 5 = 1', ok: 'Получили log₉ 81' },
                        { focus: 'base', prompt: 'log₉ 81 = ?', options: ['2', '9', '81'], correct: '2', hint: 'В какую степень возвести 9, чтобы получить 81? 9 · 9', ok: '9 в квадрате это 81, ответ 2' },
                    ],
                },
            ],
        },
    ],
    trials: [
        { tag: 'Десятичные', text: 'log₂ 3,2 + log₂ 5 = ?', options: ['4', '8,2', '16', '2'], answer: '4', hint: 'Склеиваем: 3,2 · 5 = 16, а 2 в четвёртой степени это 16' },
        { tag: 'Как в ЕГЭ', text: 'log₅ 12,5 + log₅ 10 = ?', options: ['3', '22,5', '125', '25'], answer: '3', hint: '12,5 · 10 = 125, а 5 в кубе это 125' },
        { tag: 'Как в ЕГЭ', text: 'log₇ 98 + log₇ 0,5 = ?', options: ['2', '98,5', '49', '7'], answer: '2', hint: '98 · 0,5 = 49, а 7 в квадрате это 49' },
        {
            tag: 'Подвох', text: 'Основания разные: log₂ 3 + log₅ 7. Что делаем?',
            options: ['Оставляем как есть, склеить нельзя', 'Плачем', 'Закрываем тетрадь', 'Звоним маме'], answer: 'Оставляем как есть, склеить нельзя',
            hint: 'Слезы не помогут. При разных основаниях склеивать нельзя',
        },
        { tag: 'Как в ЕГЭ', text: 'log₁₂ 4 + log₁₂ 36 = ?', options: ['2', '40', '144', '12'], answer: '2', hint: '4 · 36 = 144, а 12 в квадрате это 144' },
        { tag: 'Как в ЕГЭ', text: 'log₃ 4,5 + log₃ 6 = ?', options: ['3', '10,5', '27', '9'], answer: '3', hint: '4,5 · 6 = 27, а 3 в кубе это 27' },
        {
            tag: 'Десерт', text: 'Кто теперь шарит в сумме логарифмов?',
            options: ['Я', 'Конечно, я', 'Несомненно, я', 'Кто же ещё, как не я'], answer: 'Я', hint: '', allCorrect: true,
        },
    ],
}
