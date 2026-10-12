'use client'

// components/ege-path.tsx
//
// Экран «Мой путь к ЕГЭ»: прогноз ↔ цель, копилка первичных баллов, «что решать сегодня»
// и дорожка из станций-заданий экзамена. Данные считает lib/egeMap.ts на сервере.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { startEgeMove } from '@/actions/ege-move'
import Link from 'next/link'
import { getVuz } from '@/lib/vuzList'
import { setEgeTarget } from '@/actions/ege-target'
import { EgeSkyMove } from '@/components/ege-sky-move'
import type { EgeMap } from '@/lib/egeMap'
import { testToPrimary } from '@/lib/egeScale'
import { EgeTower } from '@/components/ege-tower'

export const EgePath = ({ map, target: initialTarget, activeMoveId, unclaimedCase, diagCard, vuzId = null }: { map: EgeMap; target: number | null; vuzId?: string | null; activeMoveId: number | null; unclaimedCase?: { id: number; taskNum: number } | null; diagCard?: React.ReactNode }) => {
    const router = useRouter()
    const [moveError, setMoveError] = useState<string | null>(null)
    const [movePending, startMove] = useTransition()
    const goMove = () => startMove(async () => {
        if (activeMoveId) { router.push(`/move/${activeMoveId}`); return }
        const r = await startEgeMove().catch(() => null)
        if (r && 'id' in r) router.push(`/move/${r.id}`)
        else setMoveError(r && 'error' in r ? r.error : 'Не получилось собрать ход')
    })
    const [target, setTarget] = useState<number | null>(initialTarget)
    const [, startTransition] = useTransition()
    const chooseGoal = (g: number) => {
        setTarget(g)
        startTransition(() => { setEgeTarget(g).catch(() => null) })
    }
    const targetPrimary = target !== null ? testToPrimary(target) : null

    const vuz = getVuz(vuzId)

    return (
        <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-[#F2F7FB]">{vuz ? `Мой путь в ${vuz.short}` : 'Мой путь к ЕГЭ'}</h1>
            <p className="text-sm font-bold text-[#9AA7B0]">Профильная математика · 20 заданий (ЕГЭ-2027)</p>

            {diagCard}
            {map.hasDiag && (
                <Link href="/diagnostic" className="mt-2 block text-right text-xs font-black text-[#9AA7B0] underline-offset-4 hover:underline">Итоги диагностики ›</Link>
            )}

            <EgeSkyMove map={map} target={target} targetPrimary={targetPrimary} onPickGoal={chooseGoal}
                activeMoveId={activeMoveId} onMove={goMove} movePending={movePending} moveError={moveError} />

            {/* кейс за законченный ход, который ещё не открыли */}
            {unclaimedCase && (
                <Link href={`/move/${unclaimedCase.id}`} className="mt-4 flex items-center gap-3 rounded-3xl border-2 p-3 active:translate-y-[1px]"
                    style={{ borderColor: 'rgba(0,197,255,0.6)', background: 'linear-gradient(135deg, rgba(0,197,255,0.16), #161F23 70%)', boxShadow: '0 4px 0 #0B3A4A' }}>
                    <img src="/chests/rare0001.svg" alt="" className="h-14 w-14 shrink-0 animate-tile-float" />
                    <div className="min-w-0 flex-1">
                        <p className="text-base font-black text-[#F2F7FB]">Тебя ждёт редкий кейс!</p>
                        <p className="text-xs font-bold text-[#8FD8F2]">За ход по заданию №{unclaimedCase.taskNum}</p>
                    </div>
                    <span className="shrink-0 rounded-xl px-3 py-1.5 text-sm font-black text-[#151F24]" style={{ backgroundColor: '#00C5FF', boxShadow: '0 4px 0 #0089B3' }}>Открыть</span>
                </Link>
            )}

          </div>
          <EgeTower map={map} vuzId={vuzId} />
        </div>
    )
}
