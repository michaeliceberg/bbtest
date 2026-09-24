'use client'

// Тестовая страница кейса-барабана (components/CaseReel.tsx) — ручная
// проверка визуала/анимации всех видов кейсов без прохождения урока
// тренажёра. Кейсы открываются НАСТОЯЩИМ серверным вызовом
// (actions/open-case.ts) — награда реально начисляется текущему юзеру.

import { useState } from 'react'
import { CaseReel } from '@/components/CaseReel'
import { openLessonCase } from '@/actions/open-case'
import {
    getLessonCasePool,
    rewardLabel,
    LESSON_CASE_TIER_LABEL,
    LESSON_CASE_TIER_PAGE_BG,
    type CaseReward,
    type LessonCaseTier,
} from '@/lib/caseRewards'

type Variant =
    | { kind: 'tier'; tier: LessonCaseTier; chain?: number }
    | { kind: 'legacy'; isMega: boolean }

const TIERS: LessonCaseTier[] = ['common', 'rare', 'mythic', 'mega']

export default function TestCaseReelPage() {
    const [variant, setVariant] = useState<Variant | null>(null)
    const [done, setDone] = useState<{ reward: CaseReward; justMaxedPizza: boolean } | null>(null)
    const [key, setKey] = useState(0)

    const start = (v: Variant) => {
        setVariant(v)
        setDone(null)
        setKey((k) => k + 1)
    }

    // Пока крутится барабан — показываем ТОЛЬКО его (как в реальном уроке),
    // плюс маленькая кнопка «← К выбору» поверх.
    if (variant && !done) {
        return (
            <div className="min-h-screen bg-[#0F1419] text-white">
                <button
                    onClick={() => setVariant(null)}
                    className="fixed top-3 left-3 z-50 px-3 py-1.5 rounded-lg bg-black/50 text-sm font-bold"
                >
                    ← К выбору
                </button>
                <div className="pt-10">
                    {variant.kind === 'tier' ? (
                        <CaseReel
                            key={key}
                            isMega={variant.tier !== 'common'}
                            tier={variant.tier}
                            pool={getLessonCasePool(variant.tier)}
                            spinAction={() => openLessonCase(variant.tier)}
                            title={variant.chain ? `🔥 Серия x${variant.chain}` : undefined}
                            onDone={(r) => setDone(r)}
                        />
                    ) : (
                        <CaseReel key={key} isMega={variant.isMega} onDone={(r) => setDone(r)} />
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0F1419] text-white p-6">
            <div className="max-w-xl mx-auto">
                <h1 className="text-2xl font-bold mb-2">Тест кейсов</h1>
                <p className="text-sm text-[#9AA7B0] mb-6">
                    Кейсы открываются настоящим запросом к серверу — награда реально
                    начисляется текущему пользователю (монеты/гемы/пицца).
                </p>

                <h2 className="text-sm font-bold uppercase tracking-wide text-[#9AA7B0] mb-2">Кейс за урок</h2>
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {TIERS.map((tier) => (
                        <button
                            key={tier}
                            onClick={() => start({ kind: 'tier', tier })}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-b-4 active:border-b-2 border-black/30 font-black uppercase tracking-wide text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]"
                            style={{ backgroundColor: LESSON_CASE_TIER_PAGE_BG[tier] }}
                        >
                            <img src={`/chests/${{ common: 'comm', rare: 'rare', mythic: 'myth', mega: 'mega' }[tier]}0001.svg`} alt="" className="w-10 h-10 object-contain" />
                            {LESSON_CASE_TIER_LABEL[tier]}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => start({ kind: 'tier', tier: 'mythic', chain: 3 })}
                    className="w-full mb-8 px-4 py-3 rounded-xl border-2 border-b-4 active:border-b-2 bg-[#232F34] border-[#3A464E] font-bold"
                >
                    🔥 Мифический за серию x3
                </button>

                <h2 className="text-sm font-bold uppercase tracking-wide text-[#9AA7B0] mb-2">Кейсы на карте скиллов (старый вид)</h2>
                <div className="flex gap-3 mb-8">
                    <button
                        onClick={() => start({ kind: 'legacy', isMega: false })}
                        className="px-5 py-2.5 rounded-xl border-2 border-b-4 active:border-b-2 bg-[#4A90D9] border-[#3A73AD] font-bold uppercase tracking-wide"
                    >
                        Кейс 🎁
                    </button>
                    <button
                        onClick={() => start({ kind: 'legacy', isMega: true })}
                        className="px-5 py-2.5 rounded-xl border-2 border-b-4 active:border-b-2 bg-[#EF9F27] border-[#B87A1C] font-bold uppercase tracking-wide"
                    >
                        Мегакейс 👑
                    </button>
                </div>

                {done && (
                    <div className="p-5 rounded-xl bg-[#151F24] border border-[#3A464E]">
                        <p className="text-lg font-bold text-[#FFD460] mb-1">Выпало: {rewardLabel(done.reward)}</p>
                        {done.justMaxedPizza && (
                            <p className="text-sm font-bold text-[#F2A6D0]">🍕 Все 8 кусочков пиццы собраны!</p>
                        )}
                        {variant && (
                            <button
                                onClick={() => start(variant)}
                                className="mt-3 px-4 py-2 rounded-lg bg-[#232F34] border border-[#3A464E]"
                            >
                                Открыть ещё раз
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
