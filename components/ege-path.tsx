'use client'

// components/ege-path.tsx
//
// «Мой путь к ЕГЭ» в стиле Сетометра (армейская латунь, штабная карта):
// 1) Сетометр (components/ballometer.tsx): «Сейчас / Цель» (цель выбирается тут же), эта неделя, сетка за 5 недель,
// «Мой план» и карта дат; 2) следующий сет, 3) кейс, вуз, неделя и диагностика. Прямую шкалу баллов 0–100
// (components/ege-score-ruler.tsx) убрали 2026-11-06: она повторяла «Сейчас / Цель». Данные — lib/egeMap.ts, lib/ballometer.ts.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Dumbbell, Swords, Lightbulb } from 'lucide-react'
import { startEgeMove } from '@/actions/ege-move'
import { setEgeTarget } from '@/actions/ege-target'
import { getVuz } from '@/lib/vuzList'
import type { EgeMap, EgeMove } from '@/lib/egeMap'
import { VuzPlaque } from '@/components/vuz-plaque'
import { BallometerPanel, type BallometerProps } from '@/components/ballometer'
import { stencilFont } from '@/lib/fonts'

const CARD = 'rounded-2xl border-2 border-[#6B5B3A] bg-[#151F23] p-3'
const Label = ({ children }: { children: React.ReactNode }) => (
    <p className="mb-1.5 text-[11px] font-black uppercase tracking-wide text-[#C9B98F]">{children}</p>
)

// Следующий сет: что делать прямо сейчас.
function NextSetCard({ mv, activeMoveId, onMove, pending, error }: { mv: EgeMove; activeMoveId: number | null; onMove: () => void; pending: boolean; error: string | null }) {
    return (
        <div className={CARD}>
            <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                    <Label>Следующий сет</Label>
                    <p className="-mt-1 text-base font-black text-[#F2F7FB]">
                        {mv.topic ? <>Фундамент · {mv.topic.title}</> : <>Задание №{mv.station.num} · {mv.station.title}</>}
                    </p>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/miguel/miguel-compass.webp" alt="" className="-my-2 h-16 w-16 shrink-0 object-contain" />
            </div>
            {mv.reason && (
                <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-[#2A2414] px-2.5 py-1.5 text-xs font-bold leading-snug text-[#F2C35B]">
                    <Lightbulb className="mt-px h-3.5 w-3.5 shrink-0" /><span>{mv.reason}</span>
                </p>
            )}
            <div className="mt-2 flex flex-col gap-1.5">
                {mv.trainerLesson && (
                    <div className="flex items-center gap-2.5 rounded-lg border border-[#2C3A41] bg-black/20 px-2.5 py-2">
                        <Dumbbell className="h-4 w-4 shrink-0 text-[#A1D151]" />
                        <span className="min-w-0 flex-1 text-sm font-bold text-[#F2F7FB]">1 урок тренажёра: <span className="text-[#C9D3D9]">{mv.trainerLesson.title}</span></span>
                    </div>
                )}
                {mv.tasks && (
                    <div className="flex items-center gap-2.5 rounded-lg border border-[#2C3A41] bg-black/20 px-2.5 py-2">
                        <Swords className="h-4 w-4 shrink-0 text-[#53ADEF]" />
                        <span className="min-w-0 flex-1 text-sm font-bold text-[#F2F7FB]">{mv.tasks.count} задач из задачника: <span className="text-[#C9D3D9]">{mv.tasks.title}</span></span>
                    </div>
                )}
            </div>
            <button type="button" onClick={onMove} disabled={pending}
                className="mt-2.5 w-full rounded-xl border-b-4 py-2.5 text-base font-black text-[#151F24] active:border-b-0 disabled:opacity-60"
                style={{ background: '#F2C35B', borderBottomColor: '#B8862E' }}>
                {activeMoveId ? 'Продолжить сет ➜' : 'Начать сет ➜'}
            </button>
            {error && <p className="mt-2 text-center text-sm font-bold text-[#DC605B]">{error}</p>}
        </div>
    )
}

export const EgePath = ({ map, target: initialTarget, activeMoveId, unclaimedCase, diagCard, vuzId = null, ballometer }: {
    map: EgeMap; target: number | null; vuzId?: string | null; activeMoveId: number | null
    unclaimedCase?: { id: number; taskNum: number } | null; diagCard?: React.ReactNode; ballometer: BallometerProps | null
}) => {
    const router = useRouter()
    const [moveError, setMoveError] = useState<string | null>(null)
    const [movePending, startMove] = useTransition()
    const goMove = () => startMove(async () => {
        if (activeMoveId) { router.push(`/move/${activeMoveId}`); return }
        const r = await startEgeMove().catch(() => null)
        if (r && 'id' in r) router.push(`/move/${r.id}`)
        else setMoveError(r && 'error' in r ? r.error : 'Не получилось собрать сет')
    })
    const [target, setTarget] = useState<number | null>(initialTarget)
    const [, startGoal] = useTransition()
    // цель меняет и Сетометр (нужная скорость) — перерисовываем страницу с сервера
    const chooseGoal = (g: number) => {
        setTarget(g)
        startGoal(async () => { await setEgeTarget(g).catch(() => null); router.refresh() })
    }
    const vuz = getVuz(vuzId)
    const reached = target !== null && map.test >= target

    return (
        <div className="mx-auto w-full max-w-5xl px-3 pb-24 pt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-6">
            <div className="flex min-w-0 flex-col gap-3">
                <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                        <h1 className={`${stencilFont.className} text-xl leading-tight text-[#F2F7FB]`}>{vuz ? `Мой путь в ${vuz.short}` : 'Мой путь к ЕГЭ'}</h1>
                        <p className="text-xs font-bold text-[#9AA7B0]">Профильная математика · ЕГЭ-2027</p>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={reached ? '/miguel/miguel-summit.webp' : '/miguel/miguel-path.webp'} alt="" className="-my-2 h-20 w-20 shrink-0 object-contain" />
                </div>

                {ballometer && (
                    <div className={CARD}>
                        <BallometerPanel d={ballometer} onPickGoal={chooseGoal} />
                    </div>
                )}
            </div>

            <div className="mt-3 flex min-w-0 flex-col gap-3 lg:mt-0">
                {map.move && <NextSetCard mv={map.move} activeMoveId={activeMoveId} onMove={goMove} pending={movePending} error={moveError} />}
                {/* кейс за законченный сет, который ещё не открыли */}
                {unclaimedCase && (
                    <Link href={`/move/${unclaimedCase.id}`} className="flex items-center gap-3 rounded-2xl border-2 border-b-4 border-[#00C5FF]/60 bg-[#151F23] p-3 active:border-b-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/chests/rare0001.svg" alt="" className="h-12 w-12 shrink-0" />
                        <div className="min-w-0 flex-1">
                            <p className="text-base font-black text-[#F2F7FB]">Тебя ждёт редкий кейс!</p>
                            <p className="text-xs font-bold text-[#8FD8F2]">За сет по заданию №{unclaimedCase.taskNum}</p>
                        </div>
                        <span className="shrink-0 rounded-lg border-b-4 border-[#0089B3] bg-[#00C5FF] px-3 py-1.5 text-sm font-black text-[#151F24]">Открыть</span>
                    </Link>
                )}
                <VuzPlaque vuzId={vuzId} forecast={map.test} />
                {diagCard}
                {map.hasDiag && (
                    <Link href="/diagnostic" className="block text-right text-xs font-black text-[#9AA7B0] underline-offset-4 hover:underline">Итоги диагностики ›</Link>
                )}
            </div>
        </div>
    )
}
