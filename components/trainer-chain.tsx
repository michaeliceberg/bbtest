// components/trainer-chain.tsx
//
// "Бесконечная цепочка" на таблицу умножения — кроссворд-стиль: старт
// со случайного однозначного числа, дальше подряд ×/÷ на случайный
// множитель 2-9 (деление — только когда делится нацело), результат
// прошлого шага сразу становится операндом следующего, без остановки.
// Ошибка не откатывает прогресс назад — просто обрывает текущую
// серию и показывает её длину; рекорд хранится в localStorage (это
// отдельный "аркадный" режим для разминки, не часть системы уроков/
// сердечек/XP тренажёра).

'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Delete, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const BEST_STREAK_KEY = 'arithmeticChainBestStreak'
const MAX_VALUE = 90
const MIN_FACTOR = 2
const MAX_FACTOR = 9
const HISTORY_WINDOW = 4

type Op = '×' | '÷'
type Step = { op: Op; factor: number; result: number }

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickStep(current: number, forceMultiply: boolean): Step {
    const divisors: number[] = []
    for (let f = MIN_FACTOR; f <= MAX_FACTOR; f++) {
        if (current % f === 0 && current / f >= 1) divisors.push(f)
    }
    const multiples: number[] = []
    for (let f = MIN_FACTOR; f <= MAX_FACTOR; f++) {
        if (current * f <= MAX_VALUE) multiples.push(f)
    }

    const canDivide = !forceMultiply && divisors.length > 0
    const canMultiply = multiples.length > 0
    const useDivide = canDivide && (!canMultiply || Math.random() < 0.5)

    if (useDivide) {
        const f = divisors[randomInt(0, divisors.length - 1)]
        return { op: '÷', factor: f, result: current / f }
    }
    if (canMultiply) {
        const f = multiples[randomInt(0, multiples.length - 1)]
        return { op: '×', factor: f, result: current * f }
    }
    // Крайне маловероятный запасной случай (некуда ни умножать, ни
    // делить в пределах MAX_VALUE) — просто умножаем на 2 без учёта
    // потолка, лишь бы цепочка не застряла.
    return { op: '×', factor: 2, result: current * 2 }
}

export const TrainerChain = () => {
    const router = useRouter()

    // base/pending рандомизируются — если сгенерировать их прямо в
    // useState-инициализаторе, Next.js посчитает их и на сервере (SSR
    // первого рендера клиентского компонента), и заново на клиенте при
    // гидратации, и эти два Math.random() почти никогда не совпадут —
    // classic hydration mismatch (тот же класс бага, что уже не раз
    // чинили в проекте для случайных эмодзи/Lottie — см. CLAUDE.md).
    // Поэтому null — детерминированный плейсхолдер для SSR, а настоящая
    // рандомизация — только внутри useEffect, ПОСЛЕ монтирования.
    const [base, setBase] = useState<number | null>(null)
    const [history, setHistory] = useState<Step[]>([])
    const [current, setCurrent] = useState(0)
    const [pending, setPending] = useState<Step | null>(null)
    const [input, setInput] = useState('')
    const [checked, setChecked] = useState(false)
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
    const [streak, setStreak] = useState(0)
    const [best, setBest] = useState<number | null>(null)
    const [gameOver, setGameOver] = useState(false)

    useEffect(() => {
        try {
            const saved = localStorage.getItem(BEST_STREAK_KEY)
            setBest(saved ? parseInt(saved, 10) : 0)
        } catch {
            setBest(0)
        }

        const initialBase = randomInt(2, 9)
        setBase(initialBase)
        setCurrent(initialBase)
        setPending(pickStep(initialBase, true))
    }, [])

    const startNewChain = () => {
        const newBase = randomInt(2, 9)
        setBase(newBase)
        setHistory([])
        setCurrent(newBase)
        setPending(pickStep(newBase, true))
        setInput('')
        setChecked(false)
        setIsCorrect(null)
        setStreak(0)
        setGameOver(false)
    }

    const saveBestIfNeeded = (newStreak: number) => {
        setBest((prevBest) => {
            const b = prevBest ?? 0
            if (newStreak > b) {
                try {
                    localStorage.setItem(BEST_STREAK_KEY, String(newStreak))
                } catch {
                    // localStorage может быть недоступен (приватный режим и т.п.) — не критично
                }
                return newStreak
            }
            return b
        })
    }

    const handleDigit = (d: string) => {
        if (checked) return
        if (input.length >= 6) return
        setInput((v) => v + d)
    }

    const handleBackspace = () => {
        if (checked) return
        setInput((v) => v.slice(0, -1))
    }

    const handleCheck = () => {
        if (input.trim().length === 0 || !pending) return
        const correct = parseInt(input, 10) === pending.result
        setIsCorrect(correct)
        setChecked(true)

        if (correct) {
            const newStreak = streak + 1
            setStreak(newStreak)
            saveBestIfNeeded(newStreak)
        } else {
            saveBestIfNeeded(streak)
        }
    }

    const handleNext = () => {
        if (!pending) return
        if (isCorrect) {
            const finishedStep = pending
            setHistory((h) => [...h, finishedStep])
            setCurrent(finishedStep.result)
            setPending(pickStep(finishedStep.result, false))
            setInput('')
            setChecked(false)
            setIsCorrect(null)
        } else {
            setGameOver(true)
        }
    }

    if (base === null || pending === null) {
        return <div className="min-h-screen bg-[#151F24]" />
    }

    if (gameOver) {
        const isNewRecord = best !== null && streak >= best && streak > 0
        return (
            <div className="min-h-screen bg-[#151F24] text-[#F2F7FB] flex flex-col items-center justify-center gap-6 px-6">
                <div className="text-5xl">{isNewRecord ? '🏆' : '⛓️‍💥'}</div>
                <h1 className="text-2xl font-black text-center">
                    {isNewRecord ? 'Новый рекорд!' : 'Цепочка прервалась'}
                </h1>
                <p className="text-lg text-[#9AA7B0]">
                    Верных ответов подряд: <span className="font-bold text-[#F2F7FB]">{streak}</span>
                </p>
                {best !== null && (
                    <p className="text-sm text-[#5A6A72]">Рекорд: {best}</p>
                )}
                <button
                    type="button"
                    onClick={startNewChain}
                    className="w-full max-w-xs py-3 rounded-xl font-bold text-lg border-2 border-b-4 active:border-b-2 bg-[#4A90D9] border-[#3572B0] text-white transition-colors"
                >
                    Начать заново
                </button>
                <button
                    type="button"
                    onClick={() => router.push('/trainer')}
                    className="text-[#9AA7B0] hover:text-[#F2F7FB] transition-colors"
                >
                    Вернуться в тренажёр
                </button>
            </div>
        )
    }

    const visibleHistory = history.slice(-HISTORY_WINDOW)

    return (
        <div className="min-h-screen bg-[#151F24] text-[#F2F7FB] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3">
                <button type="button" onClick={() => router.push('/trainer')} aria-label="Выйти">
                    <X className="w-6 h-6 text-[#9AA7B0] hover:text-[#F2F7FB] transition-colors" />
                </button>
                <div className="flex items-center gap-2 text-sm font-bold">
                    <span className="text-[#A1D151]">🔥 {streak}</span>
                    {best !== null && <span className="text-[#5A6A72]">рекорд {best}</span>}
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-4 gap-8">
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-lg md:text-xl text-[#5A6A72] font-semibold">
                    {visibleHistory.length === 0 && history.length === 0 && (
                        <span className="text-2xl md:text-3xl font-black text-[#F2F7FB]">{base}</span>
                    )}
                    {visibleHistory.length > 0 && (
                        <>
                            {history.length > HISTORY_WINDOW && <span>…</span>}
                            {visibleHistory.map((s, i) => (
                                <span key={i}>
                                    {s.op} {s.factor} = {s.result}
                                </span>
                            ))}
                        </>
                    )}
                    <motion.span
                        key={history.length}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            'text-2xl md:text-3xl font-black',
                            checked ? (isCorrect ? 'text-[#A1D151]' : 'text-[#DC605B]') : 'text-[#F2F7FB]'
                        )}
                    >
                        {pending.op} {pending.factor} = {checked ? pending.result : (input || '?')}
                    </motion.span>
                </div>

                {checked && !isCorrect && (
                    <div className="text-[#DC605B] font-bold">Правильный ответ: {pending.result}</div>
                )}

                <div className="w-full max-w-xs flex flex-col items-center gap-3">
                    <div className="w-full h-14 rounded-xl bg-[#232F34] border-2 border-[#3A464E] flex items-center justify-center px-3">
                        <span className="text-2xl font-bold tracking-wide">
                            {input || <span className="text-[#5A6A72]">?</span>}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 w-full">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, i) =>
                            key === '' ? (
                                <div key={i} />
                            ) : (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => (key === '⌫' ? handleBackspace() : handleDigit(key))}
                                    disabled={checked}
                                    className="h-11 rounded-xl bg-[#161F23] border-2 border-b-4 border-[#3A464E] text-lg font-bold hover:bg-[#232F34] active:border-b-2 transition-colors disabled:opacity-50 flex items-center justify-center"
                                >
                                    {key === '⌫' ? <Delete className="h-4 w-4" /> : key}
                                </button>
                            )
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={checked ? handleNext : handleCheck}
                        disabled={!checked && input.trim().length === 0}
                        className={cn(
                            'w-full py-3 rounded-xl font-bold text-lg border-2 border-b-4 active:border-b-2 transition-colors',
                            !checked && input.trim().length === 0
                                ? 'bg-[#161F23] border-[#3A464E] text-[#5A6A72] cursor-not-allowed'
                                : checked && !isCorrect
                                    ? 'bg-[#DC605B] border-[#B94944] text-white'
                                    : 'bg-[#A1D151] border-[#78C93C] text-[#151F24]'
                        )}
                    >
                        {checked ? (isCorrect ? 'Дальше' : 'Понятно') : 'Проверить'}
                    </button>
                </div>
            </div>
        </div>
    )
}
