// components/trainer-speed-drill.tsx
//
// "Таблица умножения на скорость" — общий банк времени на всю игру
// (не таймер на каждый отдельный вопрос): стартует с 5 секунд, тратится
// непрерывно, +1с за верный ответ, дополнительно −1с за неверный.
// Игра заканчивается, когда банк обнуляется. Клик по варианту сразу же
// засчитывает ответ и почти мгновенно (короткая вспышка цвета, не
// многосекундная анимация) показывает следующий вопрос — сделано как
// отдельный аркадный режим (не часть системы уроков/сердечек/XP
// тренажёра), тот же принцип, что уже у components/trainer-chain.tsx.

'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Latex from 'react-latex-next'
import { cn } from '@/lib/utils'

const BEST_SCORE_KEY = 'arithmeticSpeedBestScore'
const START_SECONDS = 5
const CORRECT_BONUS = 1
const WRONG_PENALTY = 1
const TICK_MS = 100
const FLASH_MS = 180
const BAR_VISUAL_MAX = 8 // секунд — при большем банке бар просто остаётся полным

const GREEN = '#A1D151'
const RED = '#DC605B'
const PURPLE = '#C386F8'

type Question = { a: number; b: number; answer: number; options: number[] }

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateQuestion(): Question {
    const a = randomInt(2, 9)
    const b = randomInt(1, 10)
    const answer = a * b

    const pool = new Set<number>()
    for (const da of [-1, 0, 1]) {
        for (const db of [-1, 0, 1]) {
            const x = a + da
            const y = b + db
            if (x >= 1 && y >= 1) {
                const v = x * y
                if (v !== answer) pool.add(v)
            }
        }
    }
    for (const delta of [1, -1, 2, -2, 10, -10]) {
        const v = answer + delta
        if (v > 0 && v !== answer) pool.add(v)
    }

    const distractors = shuffle([...pool]).slice(0, 3)
    const options = shuffle([answer, ...distractors])

    return { a, b, answer, options }
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

export const TrainerSpeedDrill = () => {
    const router = useRouter()

    // null — детерминированный SSR-плейсхолдер, настоящая рандомизация
    // только внутри useEffect после монтирования (та же причина, что уже
    // потребовала этого фикса в trainer-chain.tsx — Math.random() в
    // useState-инициализаторе иначе даёт hydration mismatch).
    const [question, setQuestion] = useState<Question | null>(null)
    const [timeBank, setTimeBank] = useState(START_SECONDS)
    const [score, setScore] = useState(0)
    const [best, setBest] = useState<number | null>(null)
    const [phase, setPhase] = useState<'playing' | 'gameover'>('playing')
    const [flash, setFlash] = useState<{ selected: number; correct: boolean } | null>(null)

    const timeBankRef = useRef(timeBank)
    const phaseRef = useRef(phase)
    const flashRef = useRef(flash)
    timeBankRef.current = timeBank
    phaseRef.current = phase
    flashRef.current = flash

    const saveBestIfNeeded = (finalScore: number) => {
        setBest((prevBest) => {
            const b = prevBest ?? 0
            if (finalScore > b) {
                try {
                    localStorage.setItem(BEST_SCORE_KEY, String(finalScore))
                } catch {
                    // localStorage недоступен (приватный режим и т.п.) — не критично
                }
                return finalScore
            }
            return b
        })
    }

    useEffect(() => {
        try {
            const saved = localStorage.getItem(BEST_SCORE_KEY)
            setBest(saved ? parseInt(saved, 10) : 0)
        } catch {
            setBest(0)
        }
        setQuestion(generateQuestion())
    }, [])

    // Непрерывный расход банка времени — не зависит от того, идёт ли
    // сейчас короткая цветовая вспышка после ответа (по прямой просьбе
    // пользователя банк тратится непрерывно, а не только между ответами).
    useEffect(() => {
        if (phase !== 'playing') return
        const interval = setInterval(() => {
            setTimeBank((t) => {
                const next = t - TICK_MS / 1000
                if (next <= 0) {
                    clearInterval(interval)
                    setPhase('gameover')
                    saveBestIfNeeded(scoreRefValue())
                    return 0
                }
                return next
            })
        }, TICK_MS)
        return () => clearInterval(interval)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])

    // scoreRefValue — читает актуальный score в момент истечения таймера
    // (замыкание интервала иначе видело бы score на момент СОЗДАНИЯ
    // эффекта, а не текущий — тот же класс проблемы, что уже решался в
    // TQUIZ.tsx через scoreRef).
    const scoreRef = useRef(0)
    scoreRef.current = score
    const scoreRefValue = () => scoreRef.current

    const handleClick = (option: number) => {
        if (phase !== 'playing' || flashRef.current || !question) return

        const isRight = option === question.answer
        setFlash({ selected: option, correct: isRight })

        if (isRight) {
            setScore((s) => s + 1)
            setTimeBank((t) => t + CORRECT_BONUS)
        } else {
            setTimeBank((t) => Math.max(0, t - WRONG_PENALTY))
        }

        setTimeout(() => {
            setFlash(null)
            if (timeBankRef.current > 0) {
                setQuestion(generateQuestion())
            }
        }, FLASH_MS)
    }

    const startNewGame = () => {
        setScore(0)
        setTimeBank(START_SECONDS)
        setQuestion(generateQuestion())
        setFlash(null)
        setPhase('playing')
    }

    if (question === null) {
        return <div className="min-h-screen bg-[#151F24]" />
    }

    if (phase === 'gameover') {
        const isNewRecord = best !== null && score >= best && score > 0
        return (
            <div className="min-h-screen bg-[#151F24] text-[#F2F7FB] flex flex-col items-center justify-center gap-6 px-6">
                <div className="text-5xl">{isNewRecord ? '🏆' : '⏱️'}</div>
                <h1 className="text-2xl font-black text-center">
                    {isNewRecord ? 'Новый рекорд!' : 'Время вышло!'}
                </h1>
                <p className="text-lg text-[#9AA7B0]">
                    Верных ответов: <span className="font-bold text-[#F2F7FB]">{score}</span>
                </p>
                {best !== null && (
                    <p className="text-sm text-[#5A6A72]">Рекорд: {best}</p>
                )}
                <button
                    type="button"
                    onClick={startNewGame}
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

    const barPercent = Math.min(100, (timeBank / BAR_VISUAL_MAX) * 100)
    const barColor = barPercent > 50 ? '#A1D151' : barPercent > 20 ? '#E8A23D' : '#DC605B'
    const coloredQuestion = `$\\textcolor{${GREEN}}{${question.a}} \\times \\textcolor{${RED}}{${question.b}}$`

    return (
        <div className="min-h-screen bg-[#151F24] text-[#F2F7FB] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3">
                <button type="button" onClick={() => router.push('/trainer')} aria-label="Выйти">
                    <span className="text-2xl leading-none text-[#9AA7B0] hover:text-[#F2F7FB] transition-colors">×</span>
                </button>
                <span className="text-sm font-bold text-[#A1D151]">⭐ {score}</span>
            </div>

            <div className="px-4">
                <div className="h-3 rounded-full bg-[#2A3A4A] overflow-hidden">
                    <div
                        className="h-full rounded-full transition-[width] duration-100 ease-linear"
                        style={{ width: `${barPercent}%`, backgroundColor: barColor }}
                    />
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-4 gap-8">
                <div className="text-5xl md:text-6xl font-black tracking-wide">
                    <Latex>{coloredQuestion}</Latex>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                    {question.options.map((option, i) => {
                        const isFlashSelected = flash?.selected === option
                        const isFlashCorrect = flash !== null && option === question.answer

                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleClick(option)}
                                disabled={flash !== null}
                                className={cn(
                                    'aspect-square rounded-2xl border-2 border-b-4 font-black text-3xl md:text-4xl transition-colors flex items-center justify-center',
                                    flash !== null
                                        ? isFlashCorrect
                                            ? 'bg-[#A1D151] border-[#78C93C] text-[#151F24]'
                                            : isFlashSelected
                                                ? 'bg-[#DC605B] border-[#B94944] text-white'
                                                : 'bg-[#161F23] border-[#3A464E] text-[#5A6A72] opacity-60'
                                        : 'bg-[#161F23] border-[#3A464E] hover:bg-[#232F34] active:border-b-2'
                                )}
                                style={flash === null ? { color: PURPLE } : undefined}
                            >
                                {option}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
