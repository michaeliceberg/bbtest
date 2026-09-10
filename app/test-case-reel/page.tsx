'use client'

// Тестовая страница кейса-барабана (components/CaseReel.tsx) — та же
// роль, что у уже существующего /test-chest для старой сундук-механики:
// ручная проверка визуала/анимации без необходимости проходить целый
// урок тренажёра до чекстейджа.

import { useState } from 'react'
import { CaseReel } from '@/components/CaseReel'
import type { CaseReward } from '@/lib/caseRewards'
import { rewardLabel } from '@/lib/caseRewards'

export default function TestCaseReelPage() {
    const [isMega, setIsMega] = useState(false)
    const [started, setStarted] = useState(false)
    const [done, setDone] = useState<{ reward: CaseReward; justMaxedPizza: boolean } | null>(null)
    const [key, setKey] = useState(0)

    const start = (mega: boolean) => {
        setIsMega(mega)
        setDone(null)
        setKey((k) => k + 1)
        setStarted(true)
    }

    return (
        <div className="min-h-screen bg-[#0F1419] text-white p-8">
            <div className="max-w-xl mx-auto">
                <h1 className="text-2xl font-bold mb-2">Тест кейса-барабана</h1>
                <p className="text-sm text-[#9AA7B0] mb-6">
                    Открывает настоящий кейс через сервер (actions/open-case.ts) —
                    награда реально списывается/начисляется тестовому пользователю
                    в БД, как в реальном уроке.
                </p>

                <div className="flex gap-3 mb-8">
                    <button
                        onClick={() => start(false)}
                        className="px-5 py-2.5 rounded-xl border-2 border-b-4 active:border-b-2 bg-[#4A90D9] border-[#3A73AD] font-bold uppercase tracking-wide"
                    >
                        Открыть кейс
                    </button>
                    <button
                        onClick={() => start(true)}
                        className="px-5 py-2.5 rounded-xl border-2 border-b-4 active:border-b-2 bg-[#EF9F27] border-[#B87A1C] font-bold uppercase tracking-wide"
                    >
                        Открыть мегакейс
                    </button>
                </div>

                {started && !done && <CaseReel key={key} isMega={isMega} onDone={(r) => setDone(r)} />}

                {done && (
                    <div className="mt-4 p-5 rounded-xl bg-[#151F24] border border-[#3A464E]">
                        <p className="text-lg font-bold text-[#FFD460] mb-1">
                            Выпало: {rewardLabel(done.reward)}
                        </p>
                        {done.justMaxedPizza && (
                            <p className="text-sm font-bold text-[#F2A6D0]">
                                🍕 Все 8 кусочков пиццы собраны!
                            </p>
                        )}
                        <button
                            onClick={() => start(isMega)}
                            className="mt-3 px-4 py-2 rounded-lg bg-[#232F34] border border-[#3A464E]"
                        >
                            Открыть ещё раз
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
