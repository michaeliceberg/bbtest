'use client'

// Тестовая сцена: котик спрыгивает с коробки, идёт к лежащей бочке, запрыгивает, греется на солнце, спрыгивает
// и возвращается на коробку — сразу и по кругу (HangarScene catDemo="barrel"). Всё сломано, чтобы бочка лежала.
import { useEffect, useState } from 'react'
import { HangarScene, type HangarTime, type SceneItem } from '@/components/hangar-scene'
import { getHangarLayout } from '@/actions/hangar-layout'
import type { LayoutOverrides } from '@/lib/hangarModel'

const ITEMS: SceneItem[] = Array.from({ length: 20 }, (_, i) => ({ num: i + 1, title: `Задание ${i + 1}`, state: 'broken', progress: 0, href: null }))

export default function Page() {
    const [layout, setLayout] = useState<LayoutOverrides | null | undefined>(undefined)
    const [time, setTime] = useState<HangarTime>('day')
    const [key, setKey] = useState(0)
    useEffect(() => { getHangarLayout().then(setLayout).catch(() => setLayout(null)) }, [])
    return (
        <div className="min-h-screen bg-[#0F171B] p-4 text-white">
            <div className="mx-auto max-w-3xl">
                <h1 className="text-xl font-black">Котик и бочка</h1>
                <p className="mt-1 text-sm text-[#9AA7B0]">Котик сразу и по кругу: спрыгивает с коробки → к бочке → прыжок → греется → обратно на коробку.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => setKey((k) => k + 1)}
                        className="rounded-xl border-b-4 border-[#B8862E] bg-[#FFE58A] px-3 py-1.5 text-sm font-black text-[#3A2A08] active:border-b-0">Сначала</button>
                    {(['day', 'evening'] as HangarTime[]).map((t) => (
                        <button key={t} type="button" onClick={() => setTime(t)}
                            className="rounded-xl border-b-4 px-3 py-1.5 text-sm font-black active:border-b-0"
                            style={{ background: time === t ? '#53ADEF' : '#26333B', borderBottomColor: time === t ? '#2C6FA0' : '#141C21', color: time === t ? '#0F171B' : '#C9D4DA' }}>
                            {t === 'day' ? 'День' : 'Вечер'}
                        </button>
                    ))}
                </div>
                <div className="mt-4">
                    {layout === undefined ? <div className="aspect-square animate-pulse rounded-2xl bg-[#161F23]" />
                        : <HangarScene key={key} items={ITEMS} layout={layout} time={time} catStage={2} catFridgeFixed catDemo="barrel" onCatHome={() => {}} onFix={() => {}} />}
                </div>
            </div>
        </div>
    )
}
