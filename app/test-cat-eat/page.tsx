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
                        : <HangarScene key={key} items={ITEMS} layout={layout} time="day" catStage={2} catFridgeFixed catFood={{ milk: 3, sausage: 3, sourcream: 2, fish: 1 }} onCatHome={() => {}} onFix={() => {}} />}
                </div>
            </div>
        </div>
    )
}
