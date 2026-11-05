'use client'

// components/rambo-run.tsx
//
// Экран «Рэмбо» (lib/rambo.ts): по одному вопросу — тренажёр и задачник вперемешку. Нажал вариант — сразу
// видно, верно или нет; ошибиться можно, засчитывается доля верных (RAMBO_PASS_SHARE). В конце — итог,
// монеты и «Ещё раз» (новая случайная смесь той же клетки).

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css'
import { X } from 'lucide-react'
import Confetti from 'react-confetti'
import type { RamboQuestion } from '@/lib/rambo'
import { finishRambo } from '@/actions/rambo'
import { playRightClick, playSound, preloadSound, WRONG_ANSWER_SOUND } from '@/lib/sound'
import { declensionRu } from '@/usefulFunctions'

const RED = '#D83A3A'
const OLIVE = '#3D4728'
const CREAM = '#E9E2C0'

const PRAISE = ['Чётко, боец 💪', 'Минус задача 🎯', 'Рэмбо одобряет 😎', 'Как по учебнику 📗', 'Огонь 🔥', 'Это было легко? 😏']
const OOPS = ['Мимо, но не страшно', 'Запомни правильный 👆', 'Бывает и у Рэмбо', 'Следующая будет твоя']

export function RamboRun({ taskNum, taskTitle, level, questions }: { taskNum: number; taskTitle: string; level: number; questions: RamboQuestion[] }) {
    const router = useRouter()
    const [i, setI] = useState(0)
    const [picked, setPicked] = useState<string | null>(null)
    const [answers, setAnswers] = useState<{ kind: 't' | 'c'; id: number; answer: string }[]>([])
    const [result, setResult] = useState<{ correct: number; total: number; passed: boolean; coins: number } | null>(null)
    const [saving, setSaving] = useState(false)
    useEffect(() => { preloadSound(WRONG_ANSWER_SOUND) }, [])

    const q = questions[i]
    const isRight = picked !== null && q?.correct.includes(picked)
    const reaction = useMemo(() => {
        if (picked === null) return ''
        const arr = isRight ? PRAISE : OOPS
        return arr[(i * 7 + picked.length) % arr.length]
    }, [picked, isRight, i])

    const pick = (opt: string) => {
        if (picked !== null) return
        setPicked(opt)
        if (q.correct.includes(opt)) playRightClick()
        else playSound(WRONG_ANSWER_SOUND)
    }

    const next = async () => {
        const all = [...answers, { kind: q.kind, id: q.id, answer: picked! }]
        setAnswers(all)
        if (i + 1 < questions.length) { setI(i + 1); setPicked(null); return }
        setSaving(true)
        try { setResult(await finishRambo(taskNum, level, all)) } finally { setSaving(false) }
    }

    const back = () => router.push(`/learn?task=${taskNum}`)
    // Ещё раз: сервер (force-dynamic) соберёт новую смесь, состояние сессии сбрасываем.
    const again = () => { setResult(null); setI(0); setAnswers([]); setPicked(null); router.refresh() }

    if (!questions.length) {
        return (
            <Shell taskNum={taskNum} taskTitle={taskTitle} level={level} onClose={back}>
                <p className="mt-10 text-center text-lg font-bold" style={{ color: CREAM }}>Здесь пока нечего решать — задания скоро появятся 🛠</p>
            </Shell>
        )
    }

    if (result) {
        return (
            <Shell taskNum={taskNum} taskTitle={taskTitle} level={level} onClose={back}>
                {result.passed && <Confetti recycle={false} numberOfPieces={260} />}
                <div className="mt-6 flex flex-col items-center gap-3 text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={result.passed ? '/miguel/miguel-commando-win.webp' : '/miguel/miguel-commando-again.webp'} alt="" className="h-44 w-44 object-contain" />
                    <div className="text-4xl font-black" style={{ color: CREAM }}>{result.correct} из {result.total}</div>
                    <div className="text-lg font-bold" style={{ color: result.passed ? '#A1D151' : CREAM }}>
                        {result.passed ? `Клетка ${level} пройдена!` : `Нужно ${Math.ceil(result.total * 0.75)} верных — давай ещё раз`}
                    </div>
                    {result.coins > 0 && <div className="rounded-full px-4 py-1 text-sm font-black" style={{ background: '#F2C35B22', color: '#F2C35B' }}>+{result.coins} {declensionRu(result.coins, 'монета', 'монеты', 'монет')}</div>}
                    <p className="max-w-xs text-sm font-semibold" style={{ color: `${CREAM}AA` }}>
                        «Рэмбо» можно проходить по кругу — каждый раз новая смесь тренажёра и задачника.
                    </p>
                </div>
                <div className="mt-auto flex flex-col gap-3 pb-4">
                    <BigButton color={RED} edge="#8E2222" onClick={again}>Ещё раз 🔁</BigButton>
                    <BigButton color="#2A3238" edge="#161B1F" onClick={back}>К заданию №{taskNum}</BigButton>
                </div>
            </Shell>
        )
    }

    return (
        <Shell taskNum={taskNum} taskTitle={taskTitle} level={level} onClose={back}>
            <div className="mt-3 flex gap-1">
                {questions.map((_, k) => (
                    <span key={k} className="h-2 flex-1 rounded-full" style={{ background: k < i ? RED : k === i ? `${RED}88` : '#ffffff1a' }} />
                ))}
            </div>
            <div key={i} className="mt-4 flex flex-1 flex-col">
                <span className="self-start rounded-md px-2 py-0.5 text-[11px] font-black uppercase tracking-wider"
                    style={q.kind === 't' ? { background: '#F2C35B22', color: '#F2C35B' } : { background: '#C9E36B22', color: '#C9E36B' }}>
                    {q.kind === 't' ? 'Тренажёр' : 'Задачник'}
                </span>
                <div className="mt-3 rounded-2xl p-4 text-lg font-bold leading-snug" style={{ background: '#ffffff0d', color: '#F2F7FB', boxShadow: 'inset 0 0 0 1px #ffffff14' }}>
                    <Latex>{q.question}</Latex>
                </div>
                {q.imageSrc && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={q.imageSrc} alt="" className="mx-auto mt-3 max-h-[28vh] w-auto rounded-xl bg-[#161F23] object-contain" />
                )}
                <div className={`drop-in-options mt-4 grid gap-2 ${q.options.some((o) => o.replace(/\$|\\[a-z]+/g, '').length > 22) ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {q.options.map((opt) => {
                        const state = picked === null ? 'idle' : q.correct.includes(opt) ? 'right' : opt === picked ? 'wrong' : 'dim'
                        const bg = state === 'right' ? '#A1D151' : state === 'wrong' ? '#DC605B' : '#26333B'
                        const edge = state === 'right' ? '#6E9A2E' : state === 'wrong' ? '#9C3A36' : '#161F23'
                        return (
                            <button key={opt} type="button" onClick={() => pick(opt)} disabled={picked !== null}
                                className="min-h-[56px] rounded-2xl border-b-4 px-3 py-2 text-base font-bold transition-opacity active:border-b-0"
                                style={{ background: bg, borderBottomColor: edge, color: state === 'right' || state === 'wrong' ? '#11181C' : '#F2F7FB', opacity: state === 'dim' ? 0.45 : 1 }}>
                                <Latex>{opt}</Latex>
                            </button>
                        )
                    })}
                </div>
            </div>
            <div className="mt-4 pb-4">
                {picked !== null && <p className="mb-2 text-center text-sm font-black" style={{ color: isRight ? '#A1D151' : '#F2A19D' }}>{reaction}</p>}
                <BigButton color={picked === null ? '#2A3238' : RED} edge={picked === null ? '#161B1F' : '#8E2222'} onClick={next} disabled={picked === null || saving}>
                    {saving ? 'Считаем…' : i + 1 < questions.length ? 'Дальше' : 'Итог'}
                </BigButton>
            </div>
        </Shell>
    )
}

function Shell({ taskNum, taskTitle, level, onClose, children }: { taskNum: number; taskTitle: string; level: number; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="min-h-[100dvh] bg-[#11181C]">
            <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col px-4 pt-3">
                <div className="flex items-center gap-3 rounded-2xl px-3 py-2" style={{ background: `linear-gradient(90deg, ${OLIVE}, #2A3120)`, boxShadow: `inset 0 -3px 0 ${RED}` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/miguel/miguel-commando.webp" alt="" className="-my-1 h-11 w-11 shrink-0 object-contain" />
                    <div className="min-w-0 flex-1 leading-tight">
                        <div className="text-[11px] font-black uppercase tracking-widest" style={{ color: RED }}>Рэмбо · клетка {level}/4</div>
                        <div className="truncate text-sm font-black" style={{ color: CREAM }}>№{taskNum} {taskTitle}</div>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Выйти" className="rounded-full p-1" style={{ color: CREAM }}><X className="h-6 w-6" /></button>
                </div>
                {children}
            </div>
        </div>
    )
}

function BigButton({ color, edge, onClick, disabled, children }: { color: string; edge: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
    return (
        <button type="button" onClick={onClick} disabled={disabled}
            className="h-14 w-full rounded-2xl border-b-4 text-lg font-black text-white active:border-b-0 disabled:opacity-60"
            style={{ background: color, borderBottomColor: edge }}>
            {children}
        </button>
    )
}
