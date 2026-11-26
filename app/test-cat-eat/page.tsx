'use client'

// Тестовая сцена: кормление котика. Нажми на холодильник и покорми: котик минуту ест из большой миски.
// Молоко и колбаска в запасе, ничего не сохраняется; «Сначала» — покормить снова.
import { useEffect, useState } from 'react'
import { HangarScene, type SceneItem } from '@/components/hangar-scene'
import { getHangarLayout } from '@/actions/hangar-layout'
import type { LayoutOverrides } from '@/lib/hangarModel'

const ITEMS: SceneItem[] = Array.from({ length: 20 }, (_, i) => ({ num: i + 1, title: `Задание ${i + 1}`, state: 'broken', progress: 0, href: null }))

export default function Page() {
    const [layout, setLayout] = useState<LayoutOverrides | null | undefined>(undefined)
    const [key, setKey] = useState(0)
    // ?fat=N — сколько зелий выпито, ?fed=D — сколько суток назад кормили (0.2 — сыт, 3 — худенький, 5 — высушенный)
    const [q, setQ] = useState<{ fat: number; fed: number | null }>({ fat: 0, fed: null })
    useEffect(() => { const u = new URLSearchParams(window.location.search); setQ({ fat: Number(u.get('fat')) || 0, fed: u.get('fed') ? Number(u.get('fed')) : null }) }, [])
    useEffect(() => { getHangarLayout().then(setLayout).catch(() => setLayout(null)) }, [])
    return (
        <div className="min-h-screen bg-[#0F171B] p-4 text-white">
            <div className="mx-auto max-w-3xl">
                <h1 className="text-xl font-black">Кормление котика</h1>
                <p className="mt-1 text-sm text-[#9AA7B0]">Нажми на холодильник и покорми: молочко, колбаска, сметанка или рыбка.</p>
                <button type="button" onClick={() => setKey((k) => k + 1)}
                    className="mt-3 rounded-xl border-b-4 border-[#B8862E] bg-[#FFE58A] px-3 py-1.5 text-sm font-black text-[#3A2A08] active:border-b-0">Сначала</button>
                <div className="mt-4">
                    {layout === undefined ? <div className="aspect-square animate-pulse rounded-2xl bg-[#161F23]" />
                        : <HangarScene key={`${key}-${q.fat}-${q.fed}`} items={ITEMS} layout={layout} time="day" catStage={2} catFridgeFixed catFedAt={q.fed === null ? null : new Date(Date.now() - q.fed * 86_400_000).toISOString()} catFood={{ milk: 3, sausage: 3, sourcream: 2, fish: 1, fat: q.fat }} onCatHome={() => {}} onFix={() => {}} />}
                </div>
            </div>
        </div>
    )
}
