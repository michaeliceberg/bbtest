'use client'

// components/hangar-scene.tsx
//
// «Ангар» в «Моём пути»: задания 1–13 — предметы (сломано → на месте), 14–20 — детали ракеты.
// Решил раздел — у предмета появляется кнопка «Починить …», ученик сам жмёт и видит, как ангар меняется.
// Грязь стен/пола проявляется ступенями, хлам исчезает по одному — по числу починенного.
// Время суток — по часам ученика (оттенок поверх, предметы не перерисовываются).
// Картинки и координаты — docs/hangar/tools/build.py → public/hangar/, lib/hangarLayout.json; правки расстановки
// (слой, поворот, место) — из редактора /test-hangar-layout (проп layout, lib/hangarModel.ts). №11 — вентилятор.

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Wrench, X } from 'lucide-react'
import Link from 'next/link'
import { L, JUNK, FAN_NUM, DECOR, PORTRAIT_NUM, place, placeStyle, type LayoutOverrides } from '@/lib/hangarModel'
import { HangarFan, FAN } from '@/components/hangar-fan'
import { fixHangarItem } from '@/actions/hangar'
import { playSound, CASE_PRIZE_SOUND } from '@/lib/sound'

export type SceneItem = { num: number; title: string; state: 'broken' | 'ready' | 'fixed'; progress: number; href: string | null }

const FIX_LABEL: Record<number, string> = {
    1: 'Смотать кабель', 2: 'Развесить ключи', 3: 'Поставить стремянку', 4: 'Зарядить шуруповёрт', 5: 'Поднять бочку',
    6: 'Повесить флаг', 7: 'Починить компьютер', 8: 'Починить лампы и портрет', 9: 'Повесить огнетушитель', 10: 'Починить аппарат',
    11: 'Починить вентилятор', 12: 'Закрыть ящик', 13: 'Включить робота',
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

// Значок задания — жёлтая плашка с номером (как номер задания на карточке юнита /trainer), без ключика и подложки.
// Раздел решён — плашка подпрыгивает. Наводишь или жмёшь — предмет, который починится, подсвечивается;
// по нажатию — окошко «Перейти в задачник».
function KeyBadge({ x, y, n, ready, active, onHover, onOpen }: { x: number; y: number; n: number; ready: boolean; active: boolean; onHover: (n: number | null) => void; onOpen: (n: number) => void }) {
    return (
        <span className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pct(x), top: pct(y), zIndex: 1150 }}>
            <button type="button" aria-label={`Задание №${n}`}
                onMouseEnter={() => onHover(n)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(n)} onBlur={() => onHover(null)}
                onClick={() => onOpen(n)}
                className={`flex h-[clamp(18px,4.4cqw,27px)] min-w-[clamp(18px,4.4cqw,27px)] items-center justify-center rounded-[7px] px-1 text-[clamp(11px,2.7cqw,15px)] font-black leading-none transition-transform active:scale-90 ${ready ? 'animate-bounce' : ''}`}
                style={{ background: 'linear-gradient(180deg,#FFE58A,#F2C35B)', color: '#3A2A08',
                    boxShadow: active ? '0 2px 0 #B8862E, 0 0 0 2px #FFF4C2, 0 0 10px 2px rgba(242,195,91,.8)' : '0 2px 0 #B8862E, 0 2px 6px rgba(0,0,0,.45)' }}>
                {n}
            </button>
        </span>
    )
}

/** Подсветка предмета, который починится: золотой контур по форме картинки (drop-shadow) и чуть ярче. */
const HIGHLIGHT = 'drop-shadow(0 0 2px #FFF4C2) drop-shadow(0 0 6px #F2C35B) drop-shadow(0 0 14px #F2C35B) brightness(1.15)'

export type HangarTime = Time

/**
 * onFix / time / decorFixed — для тестовой страницы /test-hangar: починка без сервера, своё время суток,
 * состояние портрета вручную. В приложении не передаются.
 */
export function HangarScene({ items, layout, onFix, time: forcedTime, decorFixed }: {
    items: SceneItem[]; layout?: LayoutOverrides | null; onFix?: (num: number) => void; time?: Time; decorFixed?: boolean
}) {
    const router = useRouter()
    const [pending, start] = useTransition()
    const [justFixed, setJustFixed] = useState<number | null>(null)
    const [time, setTime] = useState<Time>('day')
    const [hover, setHover] = useState<number | null>(null)
    const [openNum, setOpenNum] = useState<number | null>(null)
    const lit = (n: number) => hover === n || openNum === n
    useEffect(() => { setTime(forcedTime ?? timeOf(new Date().getHours())) }, [forcedTime])

    const byNum = new Map(items.map((i) => [i.num, i]))
    const room = items.filter((i) => i.num <= 13)
    const rocketParts = items.filter((i) => i.num >= 14)
    const stage = rocketParts.filter((i) => i.state === 'fixed').length
    const fixedCount = items.filter((i) => i.state === 'fixed').length
    const dirt = [1, 0.75, 0.5, 0.25, 0][Math.min(4, Math.floor(fixedCount / 4))]
    const junkLeft = Math.max(0, JUNK.length - Math.round((fixedCount * JUNK.length) / 16))
    const lampOn = byNum.get(8)?.state === 'fixed'
    const RS = L.rocket[Math.min(7, stage)]
    const R = { ...RS, ...place(layout, stage >= 7 ? 'a' : 'b', 'rocket', RS) }
    const fan = byNum.get(FAN_NUM)
    const decorDone = decorFixed ?? (PORTRAIT_NUM !== null && byNum.get(PORTRAIT_NUM)?.state === 'fixed')
    const decorState = decorDone ? 'a' : 'b'
    const lampP = place(layout, decorState, 'lamp', DECOR[1][decorState])
    const readyRocket = rocketParts.find((i) => i.state === 'ready')
    const nextRocket = readyRocket ?? rocketParts.find((i) => i.state !== 'fixed')
    const ready = [...room.filter((i) => i.state === 'ready'), ...(readyRocket ? [readyRocket] : [])]

    const fixed = (num: number) => { setJustFixed(num); playSound(CASE_PRIZE_SOUND); setTimeout(() => setJustFixed(null), 1500) }
    const fix = (num: number) => {
        if (onFix) { onFix(num); fixed(num); return }
        start(async () => {
            const r = await fixHangarItem(num)
            if (r.ok) { fixed(num); router.refresh() }
        })
    }
    const openItem = openNum !== null ? byNum.get(openNum) ?? null : null
    // Точка, к которой приближается картинка при выборе задания (в пикселях картинки 1024×1024).
    const focusOf = (num: number): { x: number; y: number } => {
        if (num >= 14) return { x: R.x, y: R.y - R.h / 2 }
        if (num === FAN_NUM) return { x: FAN.x, y: FAN.top + FAN.motorH }
        const it = byNum.get(num)
        const st = it?.state === 'fixed' ? 'a' : 'b'
        const sl = L[num]?.[st]
        if (!sl) return { x: 512, y: 512 }
        const p = place(layout, st, `${num}`, sl)
        const c = { x: p.x, y: p.y - p.h / 2 }
        if (num !== PORTRAIT_NUM) return c
        // лампа чинится вместе с портретом — приближаемся к середине между ними
        const pp = place(layout, decorState, 'portrait', DECOR[0][decorState])
        return { x: (c.x + pp.x) / 2, y: (c.y + pp.y - pp.h / 2) / 2 }
    }
    const focus = openNum !== null ? focusOf(openNum) : null
    const ZOOM = 2.2
    // Приближение с предметом в центре кадра: масштаб от левого верхнего угла + сдвиг так, чтобы точка предмета
    // встала в середину; сдвиг ограничен, чтобы за краем картинки не было пустоты (у края предмет чуть не по центру).
    const zoomTransform = (() => {
        if (!focus) return 'translate(0%, 0%) scale(1)'
        const lim = (v: number) => Math.min(0, Math.max((1 - ZOOM) * 100, v))
        const tx = lim(50 - ZOOM * (focus.x / 1024) * 100)
        const ty = lim(50 - ZOOM * (focus.y / 1024) * 100)
        return `translate(${tx}%, ${ty}%) scale(${ZOOM})`
    })()
    // открыть окошко задания: по ключику или по самому предмету (если он ещё не починен)
    const openTask = (num: number) => { if (byNum.get(num)?.state !== 'fixed') setOpenNum(num) }
    const label = (i: SceneItem) => (i.num >= 14 ? ROCKET_STEP[Math.min(6, stage)] : FIX_LABEL[i.num] ?? 'Починить')

    return (
        <div className="mt-6 lg:mt-0">
            <style>{`@keyframes hangar-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.1);opacity:1}100%{transform:scale(1)}}`}</style>
            <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-lg font-black text-[#F2F7FB]">Ангар Команданте</h2>
                <span className="text-xs font-bold text-[#9AA7B0]">починено {fixedCount}/20</span>
            </div>
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-[#2C3A41]" style={{ containerType: 'inline-size' }}>
                {/* все слои сцены — в одной обёртке: при выборе задания она плавно приближается к предмету */}
                <div className="absolute inset-0"
                    style={{ transform: zoomTransform, transformOrigin: '0 0', transition: 'transform 1.1s cubic-bezier(.45,0,.2,1)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/hangar/bg.webp" alt="" className="absolute inset-0 h-full w-full" draggable={false} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/hangar/bg-dirty.webp" alt="" className="absolute inset-0 h-full w-full transition-opacity duration-1000" style={{ opacity: dirt }} draggable={false} />
                {JUNK.map((jp, j) => {
                    const p = place(layout, 'b', jp.key, jp)
                    return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={jp.key} src={jp.src} alt="" draggable={false} className="absolute select-none transition-[opacity,transform] duration-700"
                            style={{ ...placeStyle(p), opacity: j < junkLeft ? 1 : 0, transform: j < junkLeft ? 'scale(1)' : 'scale(0.3)' }} />
                    )
                })}
                {DECOR.map((d) => {
                    const sl = d[decorState]
                    const p = place(layout, decorState, d.key, sl)
                    return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={sl.src} src={sl.src} alt={d.label} draggable={false} className={`absolute select-none ${!decorDone && PORTRAIT_NUM !== null ? 'cursor-pointer' : ''}`}
                            onClick={() => { if (!decorDone && PORTRAIT_NUM !== null) openTask(PORTRAIT_NUM) }}
                            onMouseEnter={() => { if (!decorDone && PORTRAIT_NUM !== null) setHover(PORTRAIT_NUM) }} onMouseLeave={() => setHover(null)}
                            style={{ ...placeStyle(p), filter: PORTRAIT_NUM !== null && !decorDone && lit(PORTRAIT_NUM) ? HIGHLIGHT : undefined, transition: 'filter .25s' }} />
                    )
                })}
                {decorDone && (
                    // тёплый конус света от лампы на портрет
                    <div className="pointer-events-none absolute"
                        style={{ left: pct(lampP.x - lampP.w * 1.1), top: pct(lampP.y - lampP.h * 0.2), width: pct(lampP.w * 2.2), height: pct(lampP.h * 5.5), zIndex: Math.round(lampP.z * 10) + 11,
                            background: 'radial-gradient(ellipse 50% 60% at 50% 0%, rgba(255,214,140,0.45), transparent 75%)', mixBlendMode: 'screen' }} />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img key={R.src} src={R.src} alt="Ракета" draggable={false} className={`absolute select-none ${nextRocket ? 'cursor-pointer' : ''}`}
                    onClick={() => { if (nextRocket) openTask(nextRocket.num) }}
                    onMouseEnter={() => { if (nextRocket) setHover(nextRocket.num) }} onMouseLeave={() => setHover(null)}
                    style={{ ...placeStyle(R), filter: nextRocket && lit(nextRocket.num) ? HIGHLIGHT : undefined, transition: 'filter .25s', animation: justFixed && justFixed >= 14 ? 'hangar-pop .6s ease-out' : undefined }} />
                {nextRocket && <KeyBadge x={R.x + R.w * 0.42} y={R.y - R.h * 0.55} n={nextRocket.num} ready={!!readyRocket} active={lit(nextRocket.num)} onHover={setHover} onOpen={openTask} />}
                {room.filter((i) => i.num !== FAN_NUM).map((i) => {
                    const done = i.state === 'fixed'
                    const sl = done ? L[i.num].a : L[i.num].b
                    const p = { ...sl, ...place(layout, done ? 'a' : 'b', `${i.num}`, sl) }
                    const onWall = WALL.has(i.num) && !(i.num === 6 && !done)
                    return (
                        <div key={i.num}>
                            {!onWall && <div className="pointer-events-none absolute rounded-[50%]"
                                style={{ left: pct(p.x - p.w * 0.45), top: pct(p.y - p.h * 0.07 - 4), width: pct(p.w * 0.9), height: pct(p.h * 0.12 + 8), background: 'radial-gradient(closest-side, rgba(20,10,15,0.5), transparent)', zIndex: Math.round(p.z * 10) + 9 }} />}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img key={p.src} src={p.src} alt={i.title} draggable={false} className={`absolute select-none ${!done ? 'cursor-pointer' : ''}`}
                                onClick={() => openTask(i.num)}
                                onMouseEnter={() => { if (!done) setHover(i.num) }} onMouseLeave={() => setHover(null)}
                                style={{ ...placeStyle(p), filter: !done && lit(i.num) ? HIGHLIGHT : undefined, transition: 'filter .25s', animation: justFixed === i.num ? 'hangar-pop .6s ease-out' : undefined }} />
                            {!done && <KeyBadge x={p.x} y={p.y - p.h - 14} n={i.num} ready={i.state === 'ready'} active={lit(i.num)} onHover={setHover} onOpen={openTask} />}
                        </div>
                    )
                })}
                {fan && (
                    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 900, filter: fan.state !== 'fixed' && lit(FAN_NUM) ? HIGHLIGHT : undefined, transition: 'filter .25s', animation: justFixed === FAN_NUM ? 'hangar-pop .6s ease-out' : undefined }}>
                        <HangarFan broken={fan.state !== 'fixed'} />
                    </div>
                )}
                {fan && fan.state !== 'fixed' && <KeyBadge x={FAN.x} y={FAN.top + FAN.motorH + 46} n={FAN_NUM} ready={fan.state === 'ready'} active={lit(FAN_NUM)} onHover={setHover} onOpen={openTask} />}
                <div className="pointer-events-none absolute inset-0 transition-[background] duration-700" style={{ background: TIME_TINT[time], mixBlendMode: 'multiply', zIndex: 1100 }} />
                <div className="pointer-events-none absolute rounded-full transition-opacity duration-700"
                    style={{ left: pct(232 - 170), top: pct(415 - 170), width: pct(340), height: pct(340), opacity: lampOn ? (time === 'day' ? 0.55 : 0.9) : 0, background: 'radial-gradient(closest-side, rgba(255,200,110,0.55), transparent)', mixBlendMode: 'screen', zIndex: 1101 }} />
                </div>
                {openItem && (
                    <>
                        <button type="button" aria-label="Закрыть" className="absolute inset-0 cursor-default bg-black/20" style={{ zIndex: 1190 }} onClick={() => setOpenNum(null)} />
                        <div className={`absolute inset-x-[8%] ${focus && focus.y > 560 ? 'top-[5%]' : 'bottom-[5%]'} rounded-2xl border-2 border-[#4A3A14] bg-[#151F23]/95 p-3 shadow-2xl`} style={{ zIndex: 1200 }}>
                            <button type="button" aria-label="Закрыть" onClick={() => setOpenNum(null)} className="absolute right-2 top-2 rounded-lg p-1 text-[#9AA7B0] hover:text-white"><X className="h-4 w-4" /></button>
                            <div className="flex items-center gap-2 pr-6">
                                <KeyRound className="h-4 w-4 shrink-0 text-[#F2C35B]" strokeWidth={2.6} />
                                <span className="text-sm font-black text-[#F2F7FB]">Задание №{openItem.num} · {openItem.title}</span>
                            </div>
                            <p className="mt-1 text-xs font-bold text-[#9AA7B0]">
                                {openItem.state === 'ready' ? `Раздел решён! Можно: «${label(openItem)}».` : `Реши этот раздел в задачнике — и сможешь: «${label(openItem)}».`}
                            </p>
                            <div className="mt-2.5 flex gap-2">
                                {openItem.state === 'ready' ? (
                                    <button type="button" disabled={pending} onClick={() => { setOpenNum(null); fix(openItem.num) }}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-black text-[#151F24] transition-transform active:translate-y-[4px] disabled:opacity-60"
                                        style={{ background: 'linear-gradient(180deg,#FFD84D,#F2C35B)', boxShadow: '0 4px 0 #B8862E' }}>
                                        <Wrench className="h-4 w-4" />Починить
                                    </button>
                                ) : null}
                                <Link href={`/learn?task=${openItem.num}`}
                                    className="flex flex-1 items-center justify-center rounded-xl px-3 py-2.5 text-center text-sm font-black text-[#0F171B] transition-transform active:translate-y-[4px]"
                                    style={{ background: '#53ADEF', boxShadow: '0 4px 0 #3A85BC' }}>
                                    Перейти в задачник
                                </Link>
                            </div>
                        </div>
                    </>
                )}
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
