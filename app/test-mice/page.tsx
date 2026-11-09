'use client'

// Тестовая сцена мышей в ангаре (components/hangar-mice.tsx): норка в правой стене и сундук с богатством.
// «Утро после голода» и «Котик держит мышку» — как в настоящем ангаре (событие дня). Кнопки: мышка выглядывает, мышки воруют монету (котика не кормили), котик ловит мышку (котик сыт).
// Мышка и сама часто выглядывает. Котик с коробкой здесь выключен (catStage 0) — в сцене «ловит» он прыгает сам.
import { useEffect, useState } from 'react'
import { HangarScene, type HangarTime, type SceneItem } from '@/components/hangar-scene'
import type { MiceScene, MiceEventView } from '@/components/hangar-mice'
import { getHangarLayout } from '@/actions/hangar-layout'
import type { LayoutOverrides } from '@/lib/hangarModel'

const ITEMS: SceneItem[] = Array.from({ length: 20 }, (_, i) => ({ num: i + 1, title: `Задание ${i + 1}`, state: 'broken', progress: 0, href: null }))
const SCENES: { kind: MiceScene; label: string }[] = [
    { kind: 'peek', label: 'Выглядывает' },
    { kind: 'raid', label: 'Кража' },
    { kind: 'catch', label: 'Котик ловит' },
]

export default function Page() {
    const [layout, setLayout] = useState<LayoutOverrides | null | undefined>(undefined)
    const [time, setTime] = useState<HangarTime>('day')
    const [scene, setScene] = useState<{ kind: MiceScene; key: number } | null>(null)
    const [auto, setAuto] = useState(true)
    // «день»: как в настоящем ангаре — событие дня (кража с сиреной или котик с пойманной мышкой); null — просто сцены
    const [day, setDay] = useState<{ ev: MiceEventView; fedAt: string; key: number } | null>(null)
    const startDay = (kind: 'raid' | 'catch') => setDay((d) => ({
        ev: { id: -1, kind, lootKind: kind === 'raid' ? 'pizza' : null, resolved: false },
        fedAt: new Date(Date.now() - (kind === 'raid' ? 40 : 10) * 3600_000).toISOString(), key: (d?.key ?? 0) + 1 }))
    useEffect(() => { getHangarLayout().then(setLayout).catch(() => setLayout(null)) }, [])
    const btn = (on: boolean) => ({ background: on ? '#53ADEF' : '#26333B', borderBottomColor: on ? '#2C6FA0' : '#141C21', color: on ? '#0F171B' : '#C9D4DA' })
    return (
        <div className="min-h-screen bg-[#0F171B] p-4 text-white">
            <div className="mx-auto max-w-3xl">
                <h1 className="text-xl font-black">Мыши в ангаре</h1>
                <p className="mt-1 text-sm text-[#9AA7B0]">Норка — внизу правой стены, сундук с богатством — на полу. Выбери сцену.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    {SCENES.map((s) => (
                        <button key={s.kind} type="button" onClick={() => { setDay(null); setScene((c) => ({ kind: s.kind, key: (c?.key ?? 0) + 1 })) }}
                            className="rounded-xl border-b-4 border-[#B8862E] bg-[#FFE58A] px-3 py-1.5 text-sm font-black text-[#3A2A08] active:border-b-0">{s.label}</button>
                    ))}
                    <button type="button" onClick={() => startDay('raid')}
                        className="rounded-xl border-b-4 border-[#7A1010] bg-[#E5534B] px-3 py-1.5 text-sm font-black text-white active:border-b-0">Утро после голода</button>
                    <button type="button" onClick={() => startDay('catch')}
                        className="rounded-xl border-b-4 border-[#2E6B1E] bg-[#78C93C] px-3 py-1.5 text-sm font-black text-[#0F171B] active:border-b-0">Котик держит мышку</button>
                    <button type="button" onClick={() => setAuto((a) => !a)} className="rounded-xl border-b-4 px-3 py-1.5 text-sm font-black active:border-b-0" style={btn(auto)}>
                        Сама выглядывает: {auto ? 'да' : 'нет'}
                    </button>
                    {(['day', 'evening', 'night'] as HangarTime[]).map((t) => (
                        <button key={t} type="button" onClick={() => setTime(t)} className="rounded-xl border-b-4 px-3 py-1.5 text-sm font-black active:border-b-0" style={btn(time === t)}>
                            {t === 'day' ? 'День' : t === 'evening' ? 'Вечер' : 'Ночь'}
                        </button>
                    ))}
                </div>
                <div className="mt-4">
                    {layout === undefined ? <div className="aspect-square animate-pulse rounded-2xl bg-[#161F23]" />
                        : day ? <HangarScene key={day.key} items={ITEMS} layout={layout} time={time} catStage={2} catFridgeFixed miceEvent={day.ev} catFedAt={day.fedAt} onCatHome={() => {}} onFix={() => {}} />
                        : <HangarScene items={ITEMS} layout={layout} time={time} catStage={0} mice={{ scene, auto }} onFix={() => {}} />}
                </div>
            </div>
        </div>
    )
}
