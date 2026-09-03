// components/HighlightedNumbersText.tsx
//
// Обёртка над react-latex-next: рендерит текст задачи, где ВСЕ числа
// (в обычном, не-LaTeX тексте — формулы внутри $...$ не трогаем, там
// KaTeX сам управляет цветом/начертанием) выделены жирным и акцентным
// голубым цветом — по прямой просьбе пользователя ("чтобы читающий
// взглядом мог выделить числа в текстах задач"), применяется к тексту
// ЛЮБОГО задания (не только математики).
//
// Строка сперва делится на LaTeX-сегменты ($...$) и обычный текст;
// внутри каждого обычнотекстового куска числа (целые/десятичные, включая
// запятую как разделитель) оборачиваются в цветной жирный <span>.

import Latex from 'react-latex-next'
import { Fragment } from 'react'

export const NUMBER_ACCENT = '#7dd3fc'

const NUMBER_RE = /(\d+(?:[.,]\d+)?)/g

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
                    ? <Latex key={`m${i}`}>{seg}</Latex>
                    : <Fragment key={`s${i}`}>{renderPlainTextWithNumbers(seg, `s${i}`)}</Fragment>
            )}
        </>
    )
}
