// components/HighlightedNumbersText.tsx
//
// Обёртка над react-latex-next: рендерит текст задачи, где ВСЕ числа —
// и в обычном тексте, и внутри LaTeX-формул ($...$) — выделены жирным и
// акцентным голубым цветом, по прямой просьбе пользователя ("чтобы
// читающий взглядом мог выделить числа в текстах задач"). Применяется к
// тексту ЛЮБОГО задания (не только математики).
//
// Строка сперва делится на LaTeX-сегменты ($...$) и обычный текст;
// внутри каждого обычнотекстового куска числа (целые/десятичные, включая
// запятую как разделитель) оборачиваются в цветной жирный <span>, внутри
// каждого LaTeX-сегмента — в KaTeX-примитив \textcolor{...}{\mathbf{...}}
// (тот же прямой \textcolor-приём, что уже используется в INSERT-типе
// тренажёра — \color бы "протёк" на следующий символ формулы, см.
// историю проекта). Замена ВСЕГДА оборачивается в дополнительную {} —
// это делает её безопасной даже сразу после "_"/"^" без своих скобок
// (напр. "\log_5" → "\log_{\textcolor{...}{\mathbf{5}}}"): без этой
// внешней группы KaTeX не может разобрать функцию с аргументами как
// прямой аргумент верхнего/нижнего индекса и падает с ошибкой парсинга.

import Latex from 'react-latex-next'
import { Fragment } from 'react'

export const NUMBER_ACCENT = '#7dd3fc'

const NUMBER_RE = /(\d+(?:[.,]\d+)?)/g

// Цветовой аргумент уже существующего \textcolor{...}/\color{...} (сам
// HEX-код вроде "#C386F8") нельзя трогать общим числовым регэкспом — иначе
// цифры внутри кода цвета превратились бы в собственную вложенную
// \textcolor-разметку и сломали бы KaTeX-парсинг ("невалидный цвет").
// Такой код маскируется NUL-плейсхолдером до замены чисел и
// восстанавливается после.
const COLOR_ARG_RE = /\\(?:textcolor|color)\{[^}]*\}/g

const highlightNumbersInLatex = (latex: string): string => {
    const protectedSpans: string[] = []
    const masked = latex.replace(COLOR_ARG_RE, (match) => {
        protectedSpans.push(match)
        return `\u0000${protectedSpans.length - 1}\u0000`
    })
    const highlighted = masked.replace(NUMBER_RE, (n) => `{\\textcolor{${NUMBER_ACCENT}}{\\mathbf{${n}}}}`)
    return highlighted.replace(/\u0000(\d+)\u0000/g, (_, i) => protectedSpans[Number(i)])
}

const renderPlainTextWithNumbers = (text: string, keyPrefix: string) => {
    // split() с ОДНОЙ группой захвата всегда чередует
    // [текст, число, текст, число, ..., текст] — нечётные индексы это
    // ровно захваченные числа, без нужды в отдельной (stateful, с /g)
    // повторной проверке регэкспом.
    const parts = text.split(NUMBER_RE)
    return parts.map((part, i) =>
        i % 2 === 1
            ? <span key={`${keyPrefix}-n${i}`} className="font-bold" style={{ color: NUMBER_ACCENT }}>{part}</span>
            : <Fragment key={`${keyPrefix}-t${i}`}>{part}</Fragment>
    )
}

export const HighlightedNumbersText = ({ text }: { text: string }) => {
    const segments = text.split(/(\$[^$]*\$)/g)
    return (
        <>
            {segments.map((seg, i) =>
                seg.startsWith('$') && seg.endsWith('$')
                    ? <Latex key={`m${i}`}>{`$${highlightNumbersInLatex(seg.slice(1, -1))}$`}</Latex>
                    : <Fragment key={`s${i}`}>{renderPlainTextWithNumbers(seg, `s${i}`)}</Fragment>
            )}
        </>
    )
}
