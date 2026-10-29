'use client'

// components/hangar-scene.tsx
//
// «Ангар» в «Моём пути»: задания 1–13 — предметы (сломано → на месте), 14–20 — детали ракеты.
// Решил раздел — у предмета появляется кнопка «Починить …», ученик сам жмёт и видит, как ангар меняется.
// Грязь стен/пола проявляется ступенями, хлам исчезает по одному — по числу починенного.
// Время суток — по часам ученика (оттенок поверх, предметы не перерисовываются).
// Картинки и координаты — docs/hangar/tools/build.py → public/hangar/, lib/hangarLayout.json.

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench } from 'lucide-react'
import layout from '@/lib/hangarLayout.json'
import { fixHangarItem } from '@/actions/hangar'
import { playSound, CASE_PRIZE_SOUND } from '@/lib/sound'

type Slot = { src: string; x: number; y: number; w: number; h: number }
const L = layout as unknown as Record<string, { b: Slot; a: Slot }> & { rocket: Slot[]; junk: Slot[] }
export type SceneItem = { num: number; title: string; state: 'broken' | 'ready' | 'fixed'; progress: number; href: string | null }

const FIX_LABEL: Record<number, string> = {
    1: 'Смотать кабель', 2: 'Развесить ключи', 3: 'Поставить стремянку', 4: 'Зарядить шуруповёрт', 5: 'Поднять бочку',
    6: 'Повесить флаг', 7: 'Починить компьютер', 8: 'Починить лампу', 9: 'Повесить огнетушитель', 10: 'Починить аппарат',
    11: 'Собрать инструменты', 12: 'Закрыть ящик', 13: 'Включить робота',
}
const ROCKET_STEP = ['Поставить опоры', 'Поставить сопло', 'Надеть обшивку', 'Прикрутить стабилизаторы', 'Пристегнуть баки', 'Покрасить звезду', 'Надеть нос']
const WALL = new Set([2, 6, 8])
const pct = (v: number) => `${(v / 1024) * 100}%`

type Time = 'day' | 'evening' | 'night'
const TIME_TINT: Record<Time, string> = {
    day: 'transparent',
    evening: 'linear-gradient(180deg, rgba(255,120,60,0.28), rgba(120,40,80,0.25))',
    night: 'linear-gradient(180deg, rgba(10,20,60,0.6), rgba(10,15,40,0.5))',
}
const timeOf = (h: number): Time => (h >= 7 && h < 18 ? 'day' : h >= 18 && h < 21 ? 'evening' : 'night')

function Badge({ x, y, n, color, pulse }: { x: number; y: number; n: number; color: string; pulse?: boolean }) {
    return (
        <span className={`absolute flex h-[6%] w-[6%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-[clamp(9px,2.4vw,15px)] font-black text-[#0F171B] ${pulse ? 'animate-bounce' : ''}`}
            style={{ left: pct(x), top: pct(y), background: color, boxShadow: '0 2px 6px rgba(0,0,0,.5)' }}>
            {pulse ? <Wrench className="h-[55%] w-[55%]" /> : n}
        </span>
    )
}

export function HangarScene({ items }: { items: SceneItem[] }) {
    const router = useRouter()
    const [pending, start] = useTransition()
    const [justFixed, setJustFixed] = useState<number | null>(null)
    const [time, setTime] = useState<Time>('day')
    useEffect(() => { setTime(timeOf(new Date().getHours())) }, [])

    const byNum = new Map(items.map((i) => [i.num, i]))
    const room = items.filter((i) => i.num <= 13)
    const rocketParts = items.filter((i) => i.num >= 14)
    const stage = rocketParts.filter((i) => i.state === 'fixed').length
    const fixedCount = items.filter((i) => i.state === 'fixed').length
    const dirt = [1, 0.75, 0.5, 0.25, 0][Math.min(4, Math.floor(fixedCount / 4))]
    const junkLeft = Math.max(0, L.junk.length - Math.round((fixedCount * L.junk.length) / 16))
    const lampOn = byNum.get(8)?.state === 'fixed'
    const R = L.rocket[Math.min(7, stage)]
    const readyRocket = rocketParts.find((i) => i.state === 'ready')
    const nextRocket = readyRocket ?? rocketParts.find((i) => i.state !== 'fixed')
    const ready = [...room.filter((i) => i.state === 'ready'), ...(readyRocket ? [readyRocket] : [])]

    const fix = (num: number) => start(async () => {
        const r = await fixHangarItem(num)
        if (r.ok) { setJustFixed(num); playSound(CASE_PRIZE_SOUND); router.refresh(); setTimeout(() => setJustFixed(null), 1500) }
    })
    const label = (i: SceneItem) => (i.num >= 14 ? ROCKET_STEP[Math.min(6, stage)] : FIX_LABEL[i.num] ?? 'Починить')

    return (
        <div className="mt-6 lg:mt-0">
            <style>{`@keyframes hangar-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.1);opacity:1}100%{transform:scale(1)}}`}</style>
            <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-lg font-black text-[#F2F7FB]">Ангар Команданте</h2>
                <span className="text-xs font-bold text-[#9AA7B0]">починено {fixedCount}/20</span>
            </div>
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-[#2C3A41]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/hangar/bg.webp" alt="" className="absolute inset-0 h-full w-full" draggable={false} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/hangar/bg-dirty.webp" alt="" className="absolute inset-0 h-full w-full transition-opacity duration-1000" style={{ opacity: dirt }} draggable={false} />
                {L.junk.map((p, j) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={p.src} src={p.src} alt="" draggable={false} className="absolute select-none transition-all duration-700"
                        style={{ left: pct(p.x - p.w / 2), top: pct(p.y - p.h), width: pct(p.w), opacity: j < junkLeft ? 1 : 0, transform: j < junkLeft ? 'scale(1)' : 'scale(0.3)' }} />
                ))}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img key={R.src} src={R.src} alt="Ракета" draggable={false} className="absolute select-none"
                    style={{ left: pct(R.x - R.w / 2), top: pct(R.y - R.h), width: pct(R.w), animation: justFixed && justFixed >= 14 ? 'hangar-pop .6s ease-out' : undefined }} />
                {nextRocket && <Badge x={R.x + R.w * 0.42} y={R.y - R.h * 0.55} n={nextRocket.num} color="#C385F7" pulse={!!readyRocket} />}
                {room.map((i) => {
                    const done = i.state === 'fixed'
                    const p = done ? L[i.num].a : L[i.num].b
                    const onWall = WALL.has(i.num) && !(i.num === 6 && !done)
                    return (
                        <div key={i.num}>
                            {!onWall && <div className="pointer-events-none absolute rounded-[50%]"
                                style={{ left: pct(p.x - p.w * 0.45), top: pct(p.y - p.h * 0.07 - 4), width: pct(p.w * 0.9), height: pct(p.h * 0.12 + 8), background: 'radial-gradient(closest-side, rgba(20,10,15,0.5), transparent)' }} />}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img key={p.src} src={p.src} alt={i.title} draggable={false} className="absolute select-none"
                                style={{ left: pct(p.x - p.w / 2), top: pct(p.y - p.h), width: pct(p.w), animation: justFixed === i.num ? 'hangar-pop .6s ease-out' : undefined }} />
                            {!done && <Badge x={p.x} y={p.y - p.h - 14} n={i.num} color="#53ADEF" pulse={i.state === 'ready'} />}
                        </div>
                    )
                })}
                <div className="pointer-events-none absolute inset-0 transition-[background] duration-700" style={{ background: TIME_TINT[time], mixBlendMode: 'multiply' }} />
                <div className="pointer-events-none absolute rounded-full transition-opacity duration-700"
                    style={{ left: pct(232 - 170), top: pct(415 - 170), width: pct(340), height: pct(340), opacity: lampOn ? (time === 'day' ? 0.55 : 0.9) : 0, background: 'radial-gradient(closest-side, rgba(255,200,110,0.55), transparent)', mixBlendMode: 'screen' }} />
            </div>

            {ready.length > 0 ? (
                <div className="mt-3 space-y-2">
                    <p className="text-sm font-black text-[#F2C35B]">Раздел решён — наводи порядок!</p>
                    {ready.map((i) => (
                        <button key={i.num} type="button" disabled={pending} onClick={() => fix(i.num)}
                            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-black text-[#151F24] transition-transform active:translate-y-[4px] disabled:opacity-60"
                            style={{ background: 'linear-gradient(180deg,#FFD84D,#F2C35B)', boxShadow: '0 4px 0 #B8862E' }}>
                            <Wrench className="h-5 w-5 shrink-0" />
                            <span className="flex-1">{label(i)}</span>
                            <span className="text-xs font-bold opacity-70">№{i.num}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <p className="mt-2 text-xs font-bold text-[#7E8F99]">Номер на предмете — задание ЕГЭ. Реши раздел в задачнике, и появится кнопка «Починить».</p>
            )}
        </div>
    )
}
