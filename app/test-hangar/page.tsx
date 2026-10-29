'use client'

// Пробная страница «Ангар»: предметы 1–13 переключаются «сломано / на месте»,
// у несобранных — номер задания ЕГЭ. Время суток — слой поверх сцены (предметы не перерисовываем).
// Картинки и координаты собирает docs/hangar/tools/build.py → public/hangar/.
import { useState } from 'react'
import layout from '@/lib/hangarLayout.json'

type Slot = { src: string; x: number; y: number; w: number; h: number }
const L = layout as unknown as Record<string, { b: Slot; a: Slot }> & { rocket: Slot[]; junk: Slot[] }
const IDS = Object.keys(L).filter((k) => k !== 'rocket' && k !== 'junk').map(Number).sort((a, b) => a - b)
// Ракета: стадия = сколько заданий второй части (14–20) решено. Каждое задание добавляет одну деталь.
const ROCKET_PARTS = ['Опоры', 'Сопло', 'Обшивка', 'Стабилизаторы', 'Боковые баки', 'Звезда', 'Нос']
const NAMES: Record<number, string> = {
    1: 'Кабель', 2: 'Ключи', 3: 'Стремянка', 4: 'Шуруповёрт', 5: 'Бочка', 6: 'Флаг', 7: 'Пульт',
    8: 'Лампа', 9: 'Огнетушитель', 10: 'Аппарат', 11: 'Инструменты', 12: 'Ящик', 13: 'Робот',
}
const WALL = new Set([2, 6, 8]) // висят на стене — без тени на полу
const pct = (v: number) => `${(v / 1024) * 100}%`

type Time = 'day' | 'evening' | 'night'
const TIME_TINT: Record<Time, string> = {
    day: 'transparent',
    evening: 'linear-gradient(180deg, rgba(255,120,60,0.28), rgba(120,40,80,0.25))',
    night: 'linear-gradient(180deg, rgba(10,20,60,0.62), rgba(10,15,40,0.55))',
}

function Item({ id, done }: { id: number; done: boolean }) {
    const p = done ? L[id].a : L[id].b
    const onWall = WALL.has(id) && !(id === 6 && !done)
    return (
        <>
            {!onWall && (
                <div className="pointer-events-none absolute rounded-[50%]"
                    style={{ left: pct(p.x - p.w * 0.45), top: pct(p.y - p.h * 0.07 - 4), width: pct(p.w * 0.9), height: pct(p.h * 0.12 + 8), background: 'radial-gradient(closest-side, rgba(20,10,15,0.5), transparent)' }} />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={p.src} src={p.src} alt={NAMES[id]} draggable={false}
                className="absolute select-none transition-transform duration-500"
                style={{ left: pct(p.x - p.w / 2), top: pct(p.y - p.h), width: pct(p.w), animation: done ? 'hangar-pop .6s ease-out' : undefined }} />
            {!done && (
                <span className="absolute flex h-[6%] w-[6%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-[clamp(9px,2.4vw,15px)] font-black text-[#0F171B]"
                    style={{ left: pct(p.x), top: pct(p.y - p.h - 14), background: '#53ADEF', boxShadow: '0 2px 6px rgba(0,0,0,.5)' }}>
                    {id}
                </span>
            )}
        </>
    )
}

export default function Page() {
    const [done, setDone] = useState<Set<number>>(new Set())
    const [time, setTime] = useState<Time>('day')
    const toggle = (id: number) => setDone((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
    const lampOn = done.has(8)
    const [stage, setStage] = useState(0)
    const R = L.rocket[stage]
    // Грязь: 20 заданий всего, решено = починенные предметы + стадия ракеты. 5 ступеней — грязный фон проявляется на 100/75/50/25/0%.
    const solved = done.size + stage
    const dirt = [1, 0.75, 0.5, 0.25, 0][Math.min(4, Math.floor(solved / 4))]
    // Хлам исчезает по одному: на каждое решённое задание — минус кусок (13 кусков на 20 заданий).
    const junkLeft = Math.max(0, L.junk.length - Math.round((solved * L.junk.length) / 16))
    return (
        <div className="min-h-screen bg-[#0F171B] px-4 py-5 text-white">
            <style>{`@keyframes hangar-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}`}</style>
            <div className="mx-auto max-w-xl">
                <h1 className="mb-3 text-xl font-extrabold">Ангар — проба</h1>
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-[#2C3A41]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/hangar/bg.webp" alt="" className="absolute inset-0 h-full w-full" draggable={false} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/hangar/bg-dirty.webp" alt="" className="absolute inset-0 h-full w-full transition-opacity duration-700" style={{ opacity: dirt }} draggable={false} />
                    {L.junk.map((p, j) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={p.src} src={p.src} alt="" draggable={false} className="absolute select-none transition-all duration-500"
                            style={{ left: pct(p.x - p.w / 2), top: pct(p.y - p.h), width: pct(p.w), opacity: j < junkLeft ? 1 : 0, transform: j < junkLeft ? 'scale(1)' : 'scale(0.3)' }} />
                    ))}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img key={R.src} src={R.src} alt="Ракета" draggable={false} className="absolute select-none"
                        style={{ left: pct(R.x - R.w / 2), top: pct(R.y - R.h), width: pct(R.w), animation: stage ? 'hangar-pop .6s ease-out' : undefined }} />
                    {stage < 7 && (
                        <span className="absolute flex h-[6%] w-[6%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-[clamp(9px,2.4vw,15px)] font-black text-[#0F171B]"
                            style={{ left: pct(R.x + R.w * 0.42), top: pct(R.y - R.h * 0.55), background: '#C385F7', boxShadow: '0 2px 6px rgba(0,0,0,.5)' }}>
                            {14 + stage}
                        </span>
                    )}
                    {IDS.map((id) => <Item key={id} id={id} done={done.has(id)} />)}
                    <div className="pointer-events-none absolute inset-0 transition-[background] duration-700" style={{ background: TIME_TINT[time], mixBlendMode: 'multiply' }} />
                    {/* свет лампы — отдельный слой, плавно разгорается */}
                    <div className="pointer-events-none absolute rounded-full transition-opacity duration-500"
                        style={{ left: pct(232 - 170), top: pct(415 - 170), width: pct(340), height: pct(340), opacity: lampOn ? (time === 'day' ? 0.55 : 0.9) : 0, background: 'radial-gradient(closest-side, rgba(255,200,110,0.55), transparent)', mixBlendMode: 'screen' }} />
                </div>

                <div className="mt-3 flex gap-2">
                    {(['day', 'evening', 'night'] as Time[]).map((t) => (
                        <button key={t} onClick={() => setTime(t)} className="rounded-lg px-3 py-1.5 text-sm font-bold"
                            style={{ background: time === t ? '#53ADEF' : '#26333B', color: time === t ? '#0F171B' : '#C9D4DA' }}>
                            {t === 'day' ? 'День' : t === 'evening' ? 'Вечер' : 'Ночь'}
                        </button>
                    ))}
                    <button onClick={() => { const all = done.size === IDS.length; setDone(all ? new Set() : new Set(IDS)); setStage(all ? 0 : 7) }} className="ml-auto rounded-lg bg-[#26333B] px-3 py-1.5 text-sm font-bold">
                        {done.size === IDS.length ? 'Сломать всё' : 'Починить всё'}
                    </button>
                </div>
                <div className="mt-3 rounded-xl bg-[#1C262B] px-3 py-2.5">
                    <div className="flex items-center justify-between text-sm font-bold">
                        <span>Ракета: решено {stage} из 7 заданий второй части · всего {solved}/20, грязь {Math.round(dirt * 100)}%</span>
                        <span className="text-[#C385F7]">{stage < 7 ? `дальше: №${14 + stage} ${ROCKET_PARTS[stage]}` : 'готова к старту 🚀'}</span>
                    </div>
                    <input type="range" min={0} max={7} value={stage} onChange={(e) => setStage(+e.target.value)} className="mt-2 w-full" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {IDS.map((id) => (
                        <button key={id} onClick={() => toggle(id)} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-bold"
                            style={{ background: done.has(id) ? '#1F3A2A' : '#1C262B', color: done.has(id) ? '#A1D151' : '#C9D4DA' }}>
                            <span className="w-5 text-center font-black">{id}</span>{NAMES[id]}{done.has(id) ? ' ✓' : ''}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
