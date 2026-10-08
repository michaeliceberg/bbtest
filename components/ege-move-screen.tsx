'use client'

// components/ege-move-screen.tsx — экран «хода» по башне ЕГЭ (app/move/[id]).
// Шаги хода: урок тренажёра → задачи задачника → финал (прирост копилки + редкий кейс).

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Dumbbell, Lock, Swords, Gift } from 'lucide-react'
import { CaseReel } from '@/components/CaseReel'
import { claimEgeMoveCase, startEgeMove } from '@/actions/ege-move'
import { getLessonCasePool } from '@/lib/caseRewards'
import { primaryToTest } from '@/lib/egeScale'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import { declensionRu } from '@/usefulFunctions'
import type { UiTheme } from '@/lib/cozyTheme'

export type MoveScreenData = {
    id: number
    taskNum: number
    taskTitle: string
    step: 'trainer' | 'tasks' | 'done'
    tLessonId: number | null
    trainerTitle: string | null
    trainerUnit: string | null
    tasksTotal: number
    tasksDone: number
    caseClaimed: boolean
    fromPrimary: number
    nowPrimary: number
    nowTest: number
    primaryMax: number
}

const ORANGE = GGEGE_PALETTE.orange
const GREEN = GGEGE_PALETTE.green
const fmt = (x: number) => (Math.round(x * 10) / 10).toString().replace('.', ',')

type StepState = 'done' | 'current' | 'locked'

const StepRow = ({ icon, title, sub, state, href, action }: {
    icon: React.ReactNode; title: string; sub: string; state: StepState; href?: string; action: string
}) => {
    const body = (
        <div className="flex items-center gap-3 rounded-2xl border-2 px-4 py-3"
            style={{
                borderColor: state === 'current' ? ORANGE.button : '#2A363C',
                backgroundColor: state === 'current' ? hexToRgba(ORANGE.button, 0.1) : '#161F23',
                opacity: state === 'locked' ? 0.55 : 1,
            }}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: state === 'done' ? GREEN.button : '#26323A' }}>
                {state === 'done' ? <Check className="h-6 w-6 text-[#151F24]" strokeWidth={3} /> : state === 'locked' ? <Lock className="h-5 w-5 text-[#7A8A93]" /> : icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-[#F2F7FB]">{title}</p>
                <p className="truncate text-xs font-bold text-[#9AA7B0]">{sub}</p>
            </div>
            {state === 'current' && (
                <span className="shrink-0 rounded-xl px-3 py-1.5 text-sm font-black text-[#151F24]"
                    style={{ backgroundColor: ORANGE.button, boxShadow: `0 4px 0 ${ORANGE.bottom}` }}>{action}</span>
            )}
        </div>
    )
    return state === 'current' && href ? <Link href={href} className="block active:translate-y-[1px]">{body}</Link> : body
}

export const MoveScreen = ({ move, theme }: { move: MoveScreenData; theme: UiTheme }) => {
    const router = useRouter()
    const [caseOpen, setCaseOpen] = useState(false)
    const [claimed, setClaimed] = useState(move.caseClaimed)
    const [pending, startTransition] = useTransition()

    if (caseOpen) {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-[#131D22]">
                <div className="mx-auto max-w-xl">
                    <CaseReel theme={theme} isMega tier="rare" pool={getLessonCasePool('rare')}
                        spinAction={() => claimEgeMoveCase(move.id)}
                        onDone={() => { setCaseOpen(false); setClaimed(true); router.refresh() }} />
                </div>
            </div>
        )
    }

    const trainerState: StepState = move.step === 'trainer' ? 'current' : 'done'
    const tasksState: StepState = move.step === 'tasks' ? 'current' : move.step === 'done' ? 'done' : 'locked'
    const gain = Math.max(0, move.nowPrimary - move.fromPrimary)
    const fromTest = primaryToTest(move.fromPrimary)

    const nextMove = () => startTransition(async () => {
        const r = await startEgeMove().catch(() => null)
        if (r && 'id' in r) router.push(`/move/${r.id}`)
        else router.push('/path')
    })

    return (
        <div className="min-h-screen bg-[#131D22]">
            <div className="mx-auto w-full max-w-xl px-4 pb-16 pt-5">
                <Link href="/path" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#9AA7B0]">
                    <ArrowLeft className="h-4 w-4" /> Мой путь
                </Link>

                <p className="mt-4 text-xs font-bold uppercase tracking-wide" style={{ color: ORANGE.button }}>Ход</p>
                <h1 className="text-2xl font-black text-[#F2F7FB]">Задание №{move.taskNum}</h1>
                {move.taskTitle && <p className="text-sm font-bold text-[#9AA7B0]">{move.taskTitle}</p>}

                <div className="mt-5 flex flex-col gap-3">
                    {move.tLessonId && (
                        <StepRow
                            icon={<Dumbbell className="h-5 w-5 text-[#A1D151]" />}
                            title="1 урок тренажёра"
                            sub={[move.trainerUnit, move.trainerTitle].filter(Boolean).join(' · ')}
                            state={trainerState}
                            href={`/t-lesson/${move.tLessonId}?move=${move.id}`}
                            action="Начать"
                        />
                    )}
                    {move.tasksTotal > 0 && (
                        <StepRow
                            icon={<Swords className="h-5 w-5 text-[#53ADEF]" />}
                            title={`${move.tasksTotal} ${declensionRu(move.tasksTotal, 'задача', 'задачи', 'задач')} из задачника`}
                            sub={move.step === 'done' ? 'Решено' : `Верно ${move.tasksDone} из ${move.tasksTotal} · ошибку заменим другой задачей`}
                            state={tasksState}
                            href={`/move/${move.id}/tasks`}
                            action={move.tasksDone > 0 ? 'Дальше' : 'Решать'}
                        />
                    )}
                </div>

                {move.step === 'done' && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                        className="mt-6 rounded-3xl border-2 p-5 text-center"
                        style={{ borderColor: hexToRgba(GREEN.button, 0.6), backgroundColor: hexToRgba(GREEN.button, 0.08) }}>
                        <p className="text-3xl">🎉</p>
                        <p className="mt-1 text-xl font-black text-[#F2F7FB]">Ход сделан!</p>
                        <div className="mt-4 flex items-center justify-center gap-3">
                            <div>
                                <p className="text-xs font-bold text-[#9AA7B0]">было</p>
                                <p className="text-2xl font-black text-[#C9D3D9]">{fmt(move.fromPrimary)}</p>
                            </div>
                            <span className="text-2xl font-black" style={{ color: GREEN.button }}>➜</span>
                            <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: 'spring', bounce: 0.55 }}>
                                <p className="text-xs font-bold text-[#9AA7B0]">стало</p>
                                <p className="text-3xl font-black text-[#F2C35B]">{fmt(move.nowPrimary)}</p>
                            </motion.div>
                        </div>
                        <p className="mt-2 text-sm font-bold" style={{ color: GREEN.button }}>
                            {gain >= 0.05 ? `+${fmt(gain)} первичного в копилку` : 'Копилка держится — так держать'}
                            {move.nowTest > fromTest ? ` · ≈${fromTest} → ${move.nowTest} тестовых` : ` · ≈${move.nowTest} тестовых`}
                        </p>

                        {!claimed ? (
                            <button type="button" onClick={() => setCaseOpen(true)}
                                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-base font-black uppercase tracking-wide text-[#151F24]"
                                style={{ backgroundColor: '#00C5FF', boxShadow: '0 5px 0 #0089B3' }}>
                                <Gift className="h-5 w-5" /> Открыть редкий кейс
                            </button>
                        ) : (
                            <button type="button" onClick={nextMove} disabled={pending}
                                className="mt-5 w-full rounded-2xl py-3 text-base font-black uppercase tracking-wide text-[#151F24] disabled:opacity-60"
                                style={{ backgroundColor: ORANGE.button, boxShadow: `0 5px 0 ${ORANGE.bottom}` }}>
                                Следующий ход ➜
                            </button>
                        )}
                        <Link href="/path" className="mt-3 block text-sm font-bold text-[#9AA7B0]">Вернуться в «Мой путь»</Link>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
