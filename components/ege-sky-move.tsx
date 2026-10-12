'use client'

// components/ege-sky-move.tsx
//
// «Мой путь»: одна карточка-«небо» вместо двух (копилка+цель и «Твой следующий ход»).
// Сверху — коротко копилка и цель (пояснение — за «?», выбор цели — по нажатию на цель),
// ниже два качающихся облака: на левом «ты сейчас» (первичные баллы сейчас), на правом — сколько
// будет после хода. Облака вырезаны из картинок пользователя: public/clouds/*.webp.
// Нижняя часть — шаги хода и кнопка.

import { useEffect, useState } from 'react'
import { Dumbbell, Swords, Flag, CircleHelp, Pencil } from 'lucide-react'
import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors'
import type { EgeMap } from '@/lib/egeMap'
import { PiggyBank } from '@/components/piggy-bank'
import { COIN_DROP_SOUND, playSound, preloadSound } from '@/lib/sound'

const fmt = (x: number) => (Math.round(x * 10) / 10).toString().replace('.', ',')
const GOALS = [60, 70, 80, 90, 100]
const PIGGY_KEY = 'egePiggyLast'
// «2,8 балла», «1 балл», «5 баллов»
const ballWord = (x: number) => {
    if (Math.round(x * 10) % 10 !== 0) return 'балла'
    const n = Math.round(x), m10 = n % 10, m100 = n % 100
    return m10 === 1 && m100 !== 11 ? 'балл' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'балла' : 'баллов'
}
const NAVY = '#1F4E7A'
const LEAF = '#3E8E2C'

type Props = {
    map: EgeMap
    target: number | null
    targetPrimary: number | null
    onPickGoal: (g: number) => void
    activeMoveId: number | null
    onMove: () => void
    movePending: boolean
    moveError: string | null
}

const Cloud = ({ src, className, children, delay = 0 }: { src: string; className: string; children: React.ReactNode; delay?: number }) => (
    <div className={`absolute ${className} animate-cloud-bob`} style={{ animationDelay: `${delay}s` }}>
        <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="w-full select-none drop-shadow-[0_8px_10px_rgba(20,70,120,0.35)]" draggable={false} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-[14%]">{children}</div>
        </div>
    </div>
)

export const EgeSkyMove = ({ map, target, targetPrimary, onPickGoal, activeMoveId, onMove, movePending, moveError }: Props) => {
    const [showHelp, setShowHelp] = useState(false)
    const [editing, setEditing] = useState(target === null)
    // Монетка падает в свинку, если с прошлого захода в копилке прибавилось (храним на устройстве).
    const [dropKey, setDropKey] = useState<number | null>(null)
    const [gainShown, setGainShown] = useState<number | null>(null)
    useEffect(() => {
        let last: number | null = null
        try { const v = localStorage.getItem(PIGGY_KEY); last = v === null ? null : Number(v) } catch { /* нет хранилища */ }
        try { localStorage.setItem(PIGGY_KEY, String(map.primary)) } catch { /* нет хранилища */ }
        const grew = last === null ? map.primary > 0 : map.primary - last >= 0.05
        if (!grew) return
        preloadSound(COIN_DROP_SOUND)
        setDropKey(Date.now())
        if (last !== null) setGainShown(map.primary - last)
        const t = setTimeout(() => playSound(COIN_DROP_SOUND, 0.6), 1050)
        return () => clearTimeout(t)
    }, [map.primary])
    const mv = map.move
    const from = mv ? mv.fromPrimary : map.primary
    const to = mv ? mv.toPrimary : targetPrimary
    const gain = mv ? mv.toPrimary - mv.fromPrimary : 0
    const left = targetPrimary !== null ? Math.max(0, targetPrimary - map.primary) : null
    const testLabel = map.hasDiag && map.testLo !== map.testHi ? `${map.testLo}–${map.testHi}` : String(map.test)

    return (
        <div className="mt-4 overflow-hidden rounded-3xl border-2 border-[#2F86C4]" style={{ boxShadow: '0 5px 0 #1D5A88' }}>
            {/* небо */}
            <div className="relative" style={{ background: 'linear-gradient(180deg, #3E9BDD 0%, #62B6EC 55%, #93D0F4 100%)' }}>
                {/* копилка и цель */}
                <div className="relative z-10 flex items-start gap-2 px-3 pt-3">
                    <div key={dropKey ?? 'still'} className={dropKey !== null ? 'animate-piggy-bump' : ''}>
                        <PiggyBank fill={map.primary / map.primaryMax} size={96} dropKey={dropKey} />
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                        <p className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wide text-white/85">
                            В копилке
                            <button type="button" onClick={() => setShowHelp((v) => !v)} aria-label="Что такое копилка" className="rounded-full p-0.5 text-white/70 hover:text-white">
                                <CircleHelp className="h-3.5 w-3.5" />
                            </button>
                        </p>
                        <span className="lesson-pill mt-0.5 inline-flex items-baseline gap-1 rounded-xl px-2.5 py-0.5 font-black text-[#5A3A06]">
                            <span className="text-2xl leading-tight">{fmt(map.primary)}</span>
                            <span className="text-sm">{ballWord(map.primary)}</span>
                            {gainShown !== null && (
                                <span className="animate-coin-plus ml-1 text-sm text-[#2F6B1E]">+{fmt(gainShown)}</span>
                            )}
                        </span>
                        <p className="mt-1 text-[11px] font-bold leading-tight text-white/80">из {map.primaryMax} · это ≈{testLabel} на ЕГЭ</p>
                    </div>
                    <button type="button" onClick={() => setEditing((v) => !v)}
                        className="mt-1 flex shrink-0 items-center gap-1.5 rounded-xl bg-white/90 px-2.5 py-1 font-black active:translate-y-[1px]"
                        style={{ color: NAVY, boxShadow: '0 3px 0 rgba(20,70,120,0.35)' }}>
                        <Flag className="h-4 w-4" />
                        {target !== null ? <span className="text-lg">{target}</span> : <span className="text-sm">Цель</span>}
                        <Pencil className="h-3 w-3 opacity-60" />
                    </button>
                </div>
                {left !== null && !editing && (
                    <p className="relative z-10 mt-1 px-4 text-xs font-bold text-white/90">
                        {left > 0 ? <>Чтобы сдать на {target}, положи в копилку ещё <b className="text-white">{fmt(left)}</b></> : <>Копилка полна для цели 🎉</>}
                    </p>
                )}
                {showHelp && (
                    <p className="relative z-10 mx-4 mt-2 rounded-xl bg-[#123B5E]/80 p-3 text-[11px] font-bold leading-snug text-white/90">
                        Копилка — первичные баллы за то, что ты уже умеешь (по тренажёру, задачнику и диагностике; диагностика весит меньше, когда появляются свои уроки и задачи). Тестовый балл — ориентир по шкале 2026 года: шкалу 2027 ещё не опубликовали.
                    </p>
                )}
                {editing && (
                    <div className="relative z-10 mx-4 mt-2 rounded-2xl bg-[#123B5E]/70 p-3">
                        <p className="mb-2 text-sm font-black text-white">На какой балл хочешь сдать?</p>
                        <div className="grid grid-cols-5 gap-2">
                            {GOALS.map((g) => (
                                <button key={g} type="button" onClick={() => { onPickGoal(g); setEditing(false) }}
                                    className="rounded-xl py-1.5 font-black"
                                    style={target === g ? { backgroundColor: '#FFFFFF', color: NAVY } : { backgroundColor: 'rgba(255,255,255,0.18)', color: '#FFFFFF' }}>
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* облака */}
                <div className="relative h-48">
                    {/* дальние маленькие облака для глубины */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/clouds/cloud-puffy.webp" alt="" className="pointer-events-none absolute right-[38%] top-2 w-12 opacity-50" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/clouds/cloud-wide.webp" alt="" className="pointer-events-none absolute -left-4 top-10 w-16 opacity-35" />

                    {to !== null && (
                        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 300 190" preserveAspectRatio="none">
                            <path d="M95,112 C135,40 175,30 205,62" fill="none" stroke="#FFFFFF" strokeWidth={3} strokeDasharray="6 7" strokeLinecap="round" opacity={0.9} />
                            <path d="M193,58 L206,63 L201,50" fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
                        </svg>
                    )}

                    <Cloud src="/clouds/cloud-wide.webp" className="bottom-3 left-2 w-[48%] max-w-[230px]">
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl">🧍</span>
                        <span className="text-[28px] font-black leading-none" style={{ color: NAVY }}>{fmt(from)}</span>
                        <span className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-[#5B86AE]">ты сейчас</span>
                    </Cloud>

                    {to !== null && (
                        <Cloud src="/clouds/cloud-puffy.webp" className="right-3 top-3 w-[38%] max-w-[180px]" delay={1.4}>
                            <span className="text-[26px] font-black leading-none" style={{ color: LEAF }}>{fmt(to)}</span>
                            <span className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-[#5B9A4C]">
                                {mv ? (gain > 0.04 ? `+${fmt(gain)} · ≈${mv.toTest}` : 'следующий шаг') : 'цель'}
                            </span>
                        </Cloud>
                    )}
                </div>
            </div>

            {/* шаги хода */}
            {mv && (
                <div className="bg-[#161F23] p-4">
                    <p className="text-[11px] font-black uppercase tracking-wide" style={{ color: GGEGE_PALETTE.orange.button }}>Твой следующий ход</p>
                    <p className="mt-0.5 text-base font-black text-[#F2F7FB]">Задание №{mv.station.num} · {mv.station.title}</p>
                    <div className="mt-2 flex flex-col gap-2">
                        {mv.trainerLesson && (
                            <div className="flex items-center gap-3 rounded-xl border-2 border-[#2A363C] bg-[#1B252A] px-3 py-2.5">
                                <Dumbbell className="h-5 w-5 shrink-0 text-[#A1D151]" />
                                <span className="min-w-0 flex-1 text-sm font-bold text-[#F2F7FB]">1 урок тренажёра: <span className="text-[#C9D3D9]">{mv.trainerLesson.title}</span></span>
                            </div>
                        )}
                        {mv.tasks && (
                            <div className="flex items-center gap-3 rounded-xl border-2 border-[#2A363C] bg-[#1B252A] px-3 py-2.5">
                                <Swords className="h-5 w-5 shrink-0 text-[#53ADEF]" />
                                <span className="min-w-0 flex-1 text-sm font-bold text-[#F2F7FB]">{mv.tasks.count} задач из задачника: <span className="text-[#C9D3D9]">{mv.tasks.title}</span></span>
                            </div>
                        )}
                    </div>
                    <button type="button" onClick={onMove} disabled={movePending}
                        className="mt-3 w-full rounded-2xl py-3 text-base font-black uppercase tracking-wide text-[#151F24] disabled:opacity-60"
                        style={{ backgroundColor: GGEGE_PALETTE.orange.button, boxShadow: `0 5px 0 ${GGEGE_PALETTE.orange.bottom}` }}>
                        {activeMoveId ? 'Продолжить ход ➜' : 'Начать ход ➜'}
                    </button>
                    {moveError && <p className="mt-2 text-center text-sm font-bold text-[#DC605B]">{moveError}</p>}
                </div>
            )}
        </div>
    )
}
