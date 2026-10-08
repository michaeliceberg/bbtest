'use client'

// components/ege-path.tsx
//
// Экран «Мой путь к ЕГЭ»: прогноз ↔ цель, копилка первичных баллов, «что решать сегодня»
// и дорожка из станций-заданий экзамена. Данные считает lib/egeMap.ts на сервере.

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Dumbbell, Swords, Target, Flag } from 'lucide-react'
import { setEgeTarget } from '@/actions/ege-target'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import type { EgeMap } from '@/lib/egeMap'
import { testToPrimary } from '@/lib/egeScale'
import { EgeTower } from '@/components/ege-tower'

const GOALS = [60, 70, 80, 90, 100]
const fmt = (x: number) => (Math.round(x * 10) / 10).toString().replace('.', ',')
export const EgePath = ({ map, target: initialTarget }: { map: EgeMap; target: number | null }) => {
    const [target, setTarget] = useState<number | null>(initialTarget)
    const [editing, setEditing] = useState(initialTarget === null)
    const [, startTransition] = useTransition()
    const chooseGoal = (g: number) => {
        setTarget(g); setEditing(false)
        startTransition(() => { setEgeTarget(g).catch(() => null) })
    }
    const targetPrimary = target !== null ? testToPrimary(target) : null
    const left = targetPrimary !== null ? Math.max(0, targetPrimary - map.primary) : null

    return (
        <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-[#F2F7FB]">Мой путь к ЕГЭ</h1>
            <p className="text-sm font-bold text-[#9AA7B0]">Профильная математика · 20 заданий (ЕГЭ-2027)</p>

            {/* прогноз и цель */}
            <div className="mt-4 rounded-3xl border-2 border-[#2A363C] bg-[#161F23] p-4">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-[#9AA7B0]">Копилка</p>
                        <p className="font-black text-[#F2C35B]"><span className="text-4xl">{fmt(map.primary)}</span><span className="text-lg text-[#9AA7B0]"> / {map.primaryMax}</span></p>
                        <p className="text-xs font-bold text-[#9AA7B0]">первичных · ≈{map.test} тестовых</p>
                    </div>
                    {target !== null && !editing && (
                        <button type="button" onClick={() => setEditing(true)} className="text-right">
                            <p className="text-xs font-bold uppercase tracking-wide text-[#9AA7B0]">Цель</p>
                            <p className="flex items-center justify-end gap-1 text-3xl font-black" style={{ color: GGEGE_PALETTE.purple.button }}>
                                <Flag className="h-6 w-6" />{target}
                            </p>
                            <p className="text-xs font-bold text-[#9AA7B0]">≈{targetPrimary} первичных</p>
                        </button>
                    )}
                </div>
                <div className="relative mt-3 h-4 w-full rounded-full bg-[#2A363C]">
                    <motion.div className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${GGEGE_PALETTE.blue.button}, ${GGEGE_PALETTE.green.button})` }}
                        initial={{ width: 0 }} animate={{ width: `${(map.primary / map.primaryMax) * 100}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} />
                    {targetPrimary !== null && (
                        <div className="absolute -top-1.5 h-7 w-1.5 rounded-full" style={{ left: `calc(${(targetPrimary / map.primaryMax) * 100}% - 3px)`, backgroundColor: GGEGE_PALETTE.purple.button }} />
                    )}
                </div>
                {left !== null && !editing && (
                    <p className="mt-2 text-sm font-bold text-[#C9D3D9]">
                        {left > 0
                            ? <>До цели ещё <span style={{ color: GGEGE_PALETTE.purple.button }}>{fmt(left)}</span> первичных</>
                            : <>Цель достигнута 🎉</>}
                    </p>
                )}
                {editing && (
                    <div className="mt-3">
                        <p className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-[#F2F7FB]"><Target className="h-4 w-4" /> На какой балл хочешь сдать?</p>
                        <div className="grid grid-cols-5 gap-2">
                            {GOALS.map((g) => (
                                <button key={g} type="button" onClick={() => chooseGoal(g)}
                                    className="rounded-xl border-2 py-2 font-black"
                                    style={{ borderColor: target === g ? GGEGE_PALETTE.purple.button : '#3A464E', color: target === g ? GGEGE_PALETTE.purple.button : '#F2F7FB', backgroundColor: target === g ? hexToRgba(GGEGE_PALETTE.purple.button, 0.15) : 'transparent' }}>
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <p className="mt-3 text-[11px] leading-snug text-[#5C6B73]">
                    Копилка — первичные баллы за то, что ты уже умеешь (по тренажёру и задачнику). Тестовый балл — ориентир по шкале 2026 года: шкалу 2027 ещё не опубликовали.
                </p>
            </div>

            {/* следующий ход: две парящие плитки */}
            {map.move && (() => {
                const mv = map.move
                const gain = mv.toPrimary - mv.fromPrimary
                return (
                    <div className="mt-4 rounded-3xl border-2 p-4" style={{ borderColor: hexToRgba(GGEGE_PALETTE.orange.button, 0.6), backgroundColor: hexToRgba(GGEGE_PALETTE.orange.button, 0.07) }}>
                        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: GGEGE_PALETTE.orange.button }}>Твой следующий ход</p>
                        <div className="relative mt-2 flex h-40 items-end justify-between px-4">
                            {/* дуга прыжка */}
                            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 300 160" preserveAspectRatio="none">
                                <path d="M80,92 C130,10 170,10 220,62" fill="none" stroke={GGEGE_PALETTE.orange.button} strokeWidth={3} strokeDasharray="6 7" strokeLinecap="round" />
                                <path d="M208,56 L221,63 L214,49" fill="none" stroke={GGEGE_PALETTE.orange.button} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="animate-tile-float flex flex-col items-center">
                                <span className="mb-1 text-3xl">🧍</span>
                                <div className="flex h-14 w-24 items-center justify-center rounded-2xl text-2xl font-black text-[#F2F7FB]"
                                    style={{ background: 'linear-gradient(180deg, #3A4A52, #26323A)', boxShadow: '0 6px 0 #1A2328, 0 14px 22px rgba(0,0,0,0.45)' }}>
                                    {fmt(mv.fromPrimary)}
                                </div>
                                <span className="mt-2 text-[11px] font-bold text-[#9AA7B0]">ты сейчас</span>
                            </div>
                            <div className="animate-tile-float-late mb-10 flex flex-col items-center">
                                <div className="flex h-14 w-24 items-center justify-center rounded-2xl border-2 border-dashed text-2xl font-black"
                                    style={{ borderColor: GGEGE_PALETTE.green.button, color: GGEGE_PALETTE.green.button, backgroundColor: hexToRgba(GGEGE_PALETTE.green.button, 0.12), boxShadow: '0 14px 22px rgba(0,0,0,0.35)' }}>
                                    {fmt(mv.toPrimary)}
                                </div>
                                <span className="mt-2 text-[11px] font-bold" style={{ color: GGEGE_PALETTE.green.button }}>{gain > 0.04 ? `+${fmt(gain)} в копилку · ≈${mv.toTest}` : 'следующая плитка'}</span>
                            </div>
                        </div>
                        <p className="mt-1 text-base font-black text-[#F2F7FB]">Задание №{mv.station.num} · {mv.station.title}</p>
                        <p className="text-xs font-bold text-[#9AA7B0]">Сделай — и прыгай на следующую плитку:</p>
                        <div className="mt-2 flex flex-col gap-2">
                            {mv.trainerLesson && (
                                <Link href={mv.trainerLesson.href} className="flex items-center gap-3 rounded-xl border-2 border-[#2A363C] bg-[#161F23] px-3 py-2.5 active:translate-y-[1px]">
                                    <Dumbbell className="h-5 w-5 shrink-0 text-[#A1D151]" />
                                    <span className="min-w-0 flex-1 text-sm font-bold text-[#F2F7FB]">1 урок тренажёра: <span className="text-[#C9D3D9]">{mv.trainerLesson.title}</span></span>
                                    <span className="rounded-lg bg-[#A1D151] px-2.5 py-1 text-xs font-black text-[#151F24]">Начать</span>
                                </Link>
                            )}
                            {mv.tasks && (
                                <Link href={mv.tasks.href} className="flex items-center gap-3 rounded-xl border-2 border-[#2A363C] bg-[#161F23] px-3 py-2.5 active:translate-y-[1px]">
                                    <Swords className="h-5 w-5 shrink-0 text-[#53ADEF]" />
                                    <span className="min-w-0 flex-1 text-sm font-bold text-[#F2F7FB]">{mv.tasks.count} задач из задачника: <span className="text-[#C9D3D9]">{mv.tasks.title}</span></span>
                                    <span className="rounded-lg border-2 border-[#3A464E] px-2.5 py-0.5 text-xs font-black text-[#F2F7FB]">Решать</span>
                                </Link>
                            )}
                        </div>
                    </div>
                )
            })()}

          </div>
          <EgeTower map={map} />
        </div>
    )
}
