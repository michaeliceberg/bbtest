'use client'

// components/ege-diagnostic.tsx
//
// Диагностика «Мой путь»: вопрос во весь экран (без прокрутки на телефоне),
// ответ — клавиатура цифр, обязательная кнопка «Не знаю». Верно — второй вопрос
// того же задания посложнее, иначе следующее задание. В конце — прогноз диапазоном,
// сильные задания / что подтянуть / «скоро». Логика и проверка — на сервере.

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { X, Flame, Check, HelpCircle } from 'lucide-react'
import 'katex/dist/katex.min.css'
import { HighlightedNumbersText } from '@/components/HighlightedNumbersText'
import { KeyboardInput } from '@/app/lesson/keyboard-input'
import { answerEgeDiagnostic, finishEgeDiagnostic } from '@/actions/ege-diagnostic'
import type { DiagAnswer, DiagPlanItem, DiagQuestion, DiagResult } from '@/lib/egeDiagnostic'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'

const GREEN = '#A1D151'
const RED = '#DC605B'

// Следующий вопрос: задание без ответа → обычный вопрос; ответил верно и есть посложнее → он.
function nextStep(plan: DiagPlanItem[], answers: DiagAnswer[]): { num: number; level: 1 | 2 } | null {
    for (const p of plan) {
        const a1 = answers.find((a) => a.num === p.num && a.level === 1)
        if (!a1) return { num: p.num, level: 1 }
        if (a1.result === 'right' && p.hard && !answers.some((a) => a.num === p.num && a.level === 2)) return { num: p.num, level: 2 }
    }
    return null
}

type Feedback = { result: DiagAnswer['result']; correct: string }

export const EgeDiagnostic = ({ id, plan, questions, initialAnswers, initialResult }: {
    id: number
    plan: DiagPlanItem[]
    questions: DiagQuestion[]
    initialAnswers: DiagAnswer[]
    initialResult: DiagResult | null
}) => {
    const [answers, setAnswers] = useState<DiagAnswer[]>(initialAnswers)
    const [result, setResult] = useState<DiagResult | null>(initialResult)
    const [typed, setTyped] = useState('')
    const [feedback, setFeedback] = useState<Feedback | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()

    const step = useMemo(() => nextStep(plan, answers), [plan, answers])
    const q = step ? questions.find((x) => x.num === step.num && x.level === step.level) ?? null : null
    const taskIndex = step ? plan.findIndex((p) => p.num === step.num) : plan.length

    const finish = () => startTransition(async () => {
        const r = await finishEgeDiagnostic(id).catch(() => null)
        if (r && !('error' in r)) setResult(r)
        else setError('Не получилось подвести итог — попробуй ещё раз')
    })

    const submit = (answer: string | null) => {
        if (!step || pending || feedback) return
        startTransition(async () => {
            const r = await answerEgeDiagnostic(id, step.num, step.level, answer).catch(() => null)
            if (!r || 'error' in r) { setError('Не получилось отправить ответ'); return }
            setError(null)
            if (r.result === 'wrong') playSound(WRONG_ANSWER_SOUND)
            setFeedback({ result: r.result, correct: r.correct })
        })
    }

    const goNext = () => {
        if (!step || !feedback) return
        const nextAnswers = [...answers, { num: step.num, level: step.level, result: feedback.result }]
        setFeedback(null)
        setTyped('')
        setAnswers(nextAnswers)
        if (!nextStep(plan, nextAnswers)) finish()
    }

    if (result) return <DiagResultView r={result} />

    if (!q) {
        return (
            <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 bg-[#131D22] px-6 text-center">
                <p className="text-xl font-black text-[#F2F7FB]">Считаем твой балл…</p>
                {error && (
                    <>
                        <p className="text-sm font-bold text-[#DC605B]">{error}</p>
                        <button type="button" onClick={finish} disabled={pending} className="rounded-2xl px-6 py-3 font-black text-[#151F24]" style={{ backgroundColor: GREEN, boxShadow: '0 5px 0 #7DA83D' }}>Ещё раз</button>
                    </>
                )}
                {!error && !pending && <button type="button" onClick={finish} className="rounded-2xl px-6 py-3 font-black text-[#151F24]" style={{ backgroundColor: GREEN, boxShadow: '0 5px 0 #7DA83D' }}>Показать итог</button>}
            </div>
        )
    }

    const hard = q.level === 2
    return (
        <div className="mx-auto flex h-[100dvh] w-full max-w-lg flex-col bg-[#131D22] px-4 pb-4 pt-3">
            {/* шапка: выход и прогресс по заданиям */}
            <div className="flex items-center gap-3">
                <Link href="/path" aria-label="Выйти" className="text-[#5C6B73] hover:text-[#9AA7B0]"><X className="h-6 w-6" /></Link>
                <div className="h-3 flex-1 rounded-full bg-[#2A363C]">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: GGEGE_PALETTE.blue.button }}
                        initial={false} animate={{ width: `${(taskIndex / plan.length) * 100}%` }} transition={{ duration: 0.4 }} />
                </div>
                <span className="text-xs font-black text-[#9AA7B0]">{taskIndex + 1}/{plan.length}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
                <span className="rounded-lg px-2 py-0.5 text-xs font-black" style={{ color: GGEGE_PALETTE.blue.button, backgroundColor: hexToRgba(GGEGE_PALETTE.blue.button, 0.14) }}>№{q.num}</span>
                <span className="min-w-0 flex-1 truncate text-xs font-bold text-[#9AA7B0]">{q.title}</span>
                {hard && (
                    <span className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-black" style={{ color: GGEGE_PALETTE.orange.button, backgroundColor: hexToRgba(GGEGE_PALETTE.orange.button, 0.14) }}>
                        <Flame className="h-3.5 w-3.5" /> посложнее
                    </span>
                )}
            </div>

            {/* условие и картинка — картинка сжимается, чтобы всё влезло без прокрутки */}
            <div key={`${q.num}-${q.level}`} className="mt-3 flex min-h-0 flex-1 flex-col gap-2">
                <div className={`${q.imageSrc ? 'max-h-[45%] shrink-0' : 'min-h-0 flex-1'} overflow-y-auto pb-1 text-[15px] leading-snug text-[#F2F7FB]`}>
                    <HighlightedNumbersText text={q.question} />
                </div>
                {q.imageSrc && (
                    <div className="flex min-h-0 flex-1 items-center justify-center">
                        <img src={q.imageSrc} alt="" className="h-full max-h-full w-auto max-w-full rounded-xl object-contain" />
                    </div>
                )}
            </div>

            {/* ответ */}
            <div className="mt-2 shrink-0">
                <div className="mb-2 flex items-center gap-1.5">
                <button type="button" onClick={() => setTyped(typed.startsWith('-') ? typed.slice(1) : `-${typed}`)} disabled={pending || !!feedback}
                    className="h-10 w-12 shrink-0 rounded-xl border-2 border-b-4 text-lg font-bold disabled:opacity-50"
                    style={typed.startsWith('-') ? { backgroundColor: '#38BDF8', color: '#0B1114', borderColor: '#0EA5E9' } : { backgroundColor: '#161F23', color: '#F2F7FB', borderColor: '#3A464E' }}>
                    &minus;
                </button>
                <div className="flex h-10 flex-1 items-center justify-center rounded-xl border-2 text-xl font-black"
                    style={{
                        borderColor: feedback ? (feedback.result === 'right' ? GREEN : RED) : '#3A464E',
                        color: feedback ? (feedback.result === 'right' ? GREEN : RED) : '#F2F7FB',
                    }}>
                    {typed || (feedback?.result === 'skip' ? '—' : <span className="text-[#5A6A72]">?</span>)}
                </div>
                </div>
                <KeyboardInput value={typed} onChange={setTyped} disabled={pending || !!feedback} showDisplay={false} allowNegative={false} />

                {feedback ? (
                    <div className="mt-3 flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                            {feedback.result === 'right'
                                ? <p className="flex items-center gap-1.5 text-base font-black" style={{ color: GREEN }}><Check className="h-5 w-5" /> Верно!</p>
                                : <p className="text-sm font-black" style={{ color: feedback.result === 'skip' ? '#9AA7B0' : RED }}>
                                    {feedback.result === 'skip' ? 'Ок, отметили' : 'Не совсем'} · ответ: <span className="text-[#F2F7FB]">{feedback.correct}</span>
                                </p>}
                        </div>
                        <button type="button" onClick={goNext}
                            className="rounded-2xl px-6 py-3 text-base font-black uppercase text-[#151F24]"
                            style={{ backgroundColor: feedback.result === 'right' ? GREEN : '#F2F7FB', boxShadow: `0 5px 0 ${feedback.result === 'right' ? '#7DA83D' : '#9AA7B0'}` }}>
                            Дальше
                        </button>
                    </div>
                ) : (
                    <div className="mt-3 grid grid-cols-[auto_1fr] gap-2">
                        <button type="button" onClick={() => submit(null)} disabled={pending}
                            className="flex items-center gap-1.5 rounded-2xl border-2 border-b-4 border-[#3A464E] bg-[#161F23] px-4 py-3 text-sm font-black text-[#C9D3D9] active:border-b-2 disabled:opacity-50">
                            <HelpCircle className="h-4 w-4" /> Не знаю
                        </button>
                        <button type="button" onClick={() => submit(typed)} disabled={pending || !typed.replace('-', '')}
                            className="rounded-2xl py-3 text-base font-black uppercase text-[#151F24] disabled:opacity-40"
                            style={{ backgroundColor: GREEN, boxShadow: '0 5px 0 #7DA83D' }}>
                            Ответить
                        </button>
                    </div>
                )}
                {error && <p className="mt-2 text-center text-xs font-bold text-[#DC605B]">{error}</p>}
            </div>
        </div>
    )
}

const Chips = ({ items, color }: { items: { num: number; title: string }[]; color: string }) => (
    <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((t) => (
            <span key={t.num} className="rounded-xl border-2 px-2.5 py-1 text-xs font-bold text-[#F2F7FB]" style={{ borderColor: hexToRgba(color, 0.6), backgroundColor: hexToRgba(color, 0.1) }}>
                <span style={{ color }} className="font-black">№{t.num}</span> {t.title}
            </span>
        ))}
    </div>
)

export const DiagResultView = ({ r }: { r: DiagResult }) => {
    const router = useRouter()
    const fmt = (x: number) => (Math.round(x * 10) / 10).toString().replace('.', ',')
    return (
        <div className="mx-auto min-h-[100dvh] w-full max-w-lg bg-[#131D22] px-4 pb-10 pt-8">
            <p className="text-center text-xs font-black uppercase tracking-wide text-[#9AA7B0]">Твой прогноз на ЕГЭ</p>
            <motion.p initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                className="mt-1 text-center text-5xl font-black text-[#F2C35B]">
                ≈{r.testLo === r.testHi ? r.test : `${r.testLo}–${r.testHi}`}
            </motion.p>
            <p className="text-center text-sm font-bold text-[#9AA7B0]">
                тестовых баллов · {fmt(r.primary)} первичных из {r.primaryMax} в проверенных заданиях
            </p>

            {r.strong.length > 0 && (
                <div className="mt-6">
                    <p className="text-sm font-black" style={{ color: GREEN }}>💪 Сильные</p>
                    <Chips items={r.strong} color={GREEN} />
                </div>
            )}
            {r.middle.length > 0 && (
                <div className="mt-4">
                    <p className="text-sm font-black" style={{ color: GGEGE_PALETTE.orange.button }}>🤏 Почти получается</p>
                    <Chips items={r.middle} color={GGEGE_PALETTE.orange.button} />
                </div>
            )}
            {r.weak.length > 0 && (
                <div className="mt-4">
                    <p className="text-sm font-black" style={{ color: RED }}>🎯 Надо подтянуть</p>
                    <Chips items={r.weak} color={RED} />
                </div>
            )}
            {r.soon.length > 0 && (
                <div className="mt-4">
                    <p className="text-sm font-black text-[#9AA7B0]">🔒 Скоро в приложении</p>
                    <p className="text-xs font-bold text-[#5C6B73]">В прогноз не входят: задач по ним пока нет</p>
                    <Chips items={r.soon} color="#5C6B73" />
                </div>
            )}

            <p className="mt-6 text-[11px] leading-snug text-[#5C6B73]">
                По 1–2 вопроса на задание — оценка примерная, поэтому диапазон. Дальше прогноз уточняется по твоим урокам и задачам. Шкала 2027 ещё не опубликована — считаем по 2026.
            </p>
            <button type="button" onClick={() => { router.push('/path'); router.refresh() }}
                className="mt-4 w-full rounded-2xl py-4 text-base font-black uppercase tracking-wide text-[#151F24]"
                style={{ backgroundColor: GGEGE_PALETTE.orange.button, boxShadow: `0 5px 0 ${GGEGE_PALETTE.orange.bottom}` }}>
                Построить мой план ➜
            </button>
        </div>
    )
}
