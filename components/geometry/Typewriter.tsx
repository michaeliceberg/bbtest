// components/geometry/Typewriter.tsx
//
// "Естественная" печать текста по одной букве — по мотивам примера
// motion.dev "Natural Typing" (исходный код примера платный, поэтому не
// копировался; здесь — собственная реализация того же принципа,
// описанного в документации: задержка между буквами зависит от позиции
// в слове, соседних символов и пунктуации, а не одна константа на
// каждый символ, из-за чего печать не выглядит механической).

import { useEffect, useRef, useState } from 'react'

const CONSONANTS = /[бвгджзйклмнпрстфхцчшщbcdfghjklmnpqrstvwxz]/i

function charDelay(text: string, i: number): number {
    const ch = text[i]
    const prev = i > 0 ? text[i - 1] : undefined
    let base = 30

    // чуть медленнее в начале нового слова — как будто печатающий на
    // мгновение "находит" следующее слово
    const isWordStart = i === 0 || prev === ' '
    if (isWordStart) base += 30

    // стык согласных чуть медленнее гласных/одиночных согласных
    if (prev && CONSONANTS.test(ch) && CONSONANTS.test(prev)) base += 10

    // органический разброс, чтобы ритм не читался как метроном
    const jitter = (Math.random() - 0.5) * base * 0.7
    let delay = base + jitter

    // пауза ПОСЛЕ пунктуации предыдущего символа
    if (prev && /[,;:]/.test(prev)) delay += 130 + Math.random() * 90
    if (prev && /[.!?]/.test(prev)) delay += 300 + Math.random() * 150
    if (prev === ' ') delay += 15

    return Math.max(10, delay)
}

type Props = {
    text: string
    onDone?: () => void
    className?: string
    startDelay?: number
    cursor?: boolean
}

export const Typewriter = ({ text, onDone, className, startDelay = 0, cursor = true }: Props) => {
    const [shown, setShown] = useState(0)
    const onDoneRef = useRef(onDone)
    onDoneRef.current = onDone

    useEffect(() => {
        let cancelled = false
        let timer: ReturnType<typeof setTimeout>
        setShown(0)

        const step = (i: number) => {
            if (cancelled) return
            if (i >= text.length) {
                onDoneRef.current?.()
                return
            }
            timer = setTimeout(() => {
                if (cancelled) return
                setShown(i + 1)
                step(i + 1)
            }, charDelay(text, i))
        }

        const kickoff = setTimeout(() => step(0), startDelay)
        return () => {
            cancelled = true
            clearTimeout(timer)
            clearTimeout(kickoff)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text])

    const done = shown >= text.length
    return (
        <span className={className}>
            {text.slice(0, shown)}
            {cursor && !done && (
                <span className="inline-block w-[2px] h-[1em] align-middle ml-[1px] bg-current animate-pulse" />
            )}
        </span>
    )
}
