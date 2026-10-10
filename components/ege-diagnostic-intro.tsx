'use client'

// components/ege-diagnostic-intro.tsx
// Приглашение на диагностику «Мой путь»: большой экран при первом заходе на /path
// (variant='screen') и компактная карточка, если отложили (variant='card').

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Timer, Target, Sparkles } from 'lucide-react'
import { postponeEgeDiagnostic, startEgeDiagnostic } from '@/actions/ege-diagnostic'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'

export const DiagnosticIntro = ({ variant, questionsCount, resume }: { variant: 'screen' | 'card'; questionsCount: number; resume?: boolean }) => {
    const router = useRouter()
    const [pending, start] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const go = () => start(async () => {
        const r = await startEgeDiagnostic().catch(() => null)
        if (r && 'id' in r) router.push('/diagnostic')
        else setError(r && 'error' in r ? r.error : 'Не получилось начать')
    })
    const later = () => start(async () => { await postponeEgeDiagnostic().catch(() => null); router.refresh() })

    if (variant === 'card') {
        return (
            <button type="button" onClick={go} disabled={pending}
                className="mt-4 flex w-full items-center gap-3 rounded-3xl border-2 p-3 text-left active:translate-y-[1px] disabled:opacity-60"
                style={{ borderColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.6), background: `linear-gradient(135deg, ${hexToRgba(GGEGE_PALETTE.purple.button, 0.16)}, #161F23 70%)`, boxShadow: `0 4px 0 ${GGEGE_PALETTE.purple.bottom}` }}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl" style={{ backgroundColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.2) }}>🎯</span>
                <span className="min-w-0 flex-1">
                    <span className="block text-base font-black text-[#F2F7FB]">{resume ? 'Закончи диагностику' : 'Узнай свой балл за 15 минут'}</span>
                    <span className="block text-xs font-bold text-[#C9A6F5]">Прогноз станет точнее · {questionsCount} заданий ЕГЭ</span>
                </span>
                <span className="shrink-0 rounded-xl px-3 py-1.5 text-sm font-black text-[#151F24]" style={{ backgroundColor: GGEGE_PALETTE.purple.button }}>{resume ? 'Дальше' : 'Начать'}</span>
                {error && <span className="sr-only">{error}</span>}
            </button>
        )
    }

    return (
        <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col items-center justify-center px-4 py-8 text-center">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                className="flex h-24 w-24 items-center justify-center rounded-[28px] text-5xl"
                style={{ backgroundColor: hexToRgba(GGEGE_PALETTE.purple.button, 0.18), boxShadow: `0 6px 0 ${GGEGE_PALETTE.purple.bottom}` }}>
                🎯
            </motion.div>
            <h1 className="mt-5 text-3xl font-black text-[#F2F7FB]">Узнай свой балл<br />за 15 минут</h1>
            <p className="mt-2 text-sm font-bold text-[#9AA7B0]">Профильная математика · ЕГЭ-2027</p>
            <div className="mt-6 flex w-full flex-col gap-2 text-left">
                {[
                    [Target, `По вопросу на каждое из ${questionsCount} заданий, где у нас уже есть задачи`],
                    [Sparkles, 'Справился — дадим вопрос посложнее. Не знаешь — жми «Не знаю», это нормально'],
                    [Timer, 'В конце — прогноз балла, сильные стороны и что подтянуть'],
                ].map(([Icon, text], i) => {
                    const I = Icon as typeof Target
                    return (
                        <div key={i} className="flex items-center gap-3 rounded-2xl border-2 border-[#2A363C] bg-[#161F23] px-3 py-2.5">
                            <I className="h-5 w-5 shrink-0" style={{ color: GGEGE_PALETTE.purple.button }} />
                            <span className="text-sm font-bold text-[#E1E8EC]">{text as string}</span>
                        </div>
                    )
                })}
            </div>
            <button type="button" onClick={go} disabled={pending}
                className="mt-6 w-full rounded-2xl py-4 text-base font-black uppercase tracking-wide text-[#151F24] disabled:opacity-60"
                style={{ backgroundColor: GGEGE_PALETTE.purple.button, boxShadow: `0 5px 0 ${GGEGE_PALETTE.purple.bottom}` }}>
                Начать ➜
            </button>
            <button type="button" onClick={later} disabled={pending} className="mt-3 text-sm font-black text-[#9AA7B0] underline-offset-4 hover:underline">
                Пройду позже
            </button>
            {error && <p className="mt-2 text-sm font-bold text-[#DC605B]">{error}</p>}
        </div>
    )
}
