'use client'

// Простые формулы ($6t^5 - 12t^3$, $(t^4)' = 4t^3$, $2 \cdot 5 = 10$) — тем же шрифтом, что и текст урока, а не KaTeX.
// Степень — аккуратный верхний индекс, не налезает на букву. Если в формуле что-то сложнее (дроби, корни, \alpha…) —
// эта часть рисуется KaTeX, как раньше.

import { createContext, Fragment, useContext, type ReactNode } from 'react'
import Latex from 'react-latex-next'

// Сдвиг через position (а не vertical-align) — одинаково и в обычном тексте, и во flex-строках
export const SUP_STYLE = { fontSize: '0.62em', position: 'relative', top: '-0.78em', marginLeft: '0.1em', lineHeight: 1 } as const

const SIMPLE = /^[\s\w()'.,=+\-?:<>^{}|]*$/
const simplify = (tex: string) => tex
    .replace(/\\cdot/g, '·').replace(/\\ /g, ' ').replace(/\\quad/g, ' ').replace(/\\,/g, ' ')

const renderTex = (tex: string, key: number): ReactNode => {
    const s = simplify(tex)
    if (!SIMPLE.test(s.replace(/·/g, ''))) return <Latex key={key}>{`$${tex}$`}</Latex>
    const out: ReactNode[] = []
    let i = 0, k = 0
    while (i < s.length) {
        const ch = s[i]
        if (ch === '^') {
            let exp = ''
            if (s[i + 1] === '{') { const j = s.indexOf('}', i); exp = s.slice(i + 2, j); i = j + 1 }
            else { const m = s.slice(i + 1).match(/^-?\d+|^\w/); exp = m ? m[0] : ''; i += 1 + exp.length }
            out.push(<span key={k++} className="font-bold" style={SUP_STYLE}>{exp.replace('-', '−')}</span>)
            continue
        }
        if (/[a-zA-Z]/.test(ch)) { out.push(<span key={k++} className="italic">{ch}</span>); i++; continue }
        if (ch === '-') { out.push(<span key={k++} className="mx-[0.15em]">−</span>); i++; continue }
        if (ch === '+' || ch === '=' || ch === '·') { out.push(<span key={k++} className="mx-[0.2em]">{ch}</span>); i++; continue }
        if (ch === "'") { out.push('′'); i++; continue }
        if (ch === ' ' || ch === '{' || ch === '}') { i++; continue }
        out.push(ch); i++
    }
    return <span key={key} className="whitespace-nowrap font-bold">{out}</span>
}

export const PlainMath = ({ children }: { children: string }) => {
    const parts = children.split('$')
    return <>{parts.map((p, i) => (i % 2 ? renderTex(p, i) : <Fragment key={i}>{p}</Fragment>))}</>
}

// Урок может включить «простые формулы» для всего движка сцен
export const PlainMathCtx = createContext(false)
export const usePlainMath = () => useContext(PlainMathCtx)
export const MathText = ({ children }: { children: string }) => {
    const plain = usePlainMath()
    if (!children.includes('$')) return <>{children}</>
    return plain ? <PlainMath>{children}</PlainMath> : <Latex>{children}</Latex>
}
