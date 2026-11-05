'use client'

// components/ege-ruler.tsx
//
// «Линейка ЕГЭ» — узкая армейская линейка у правого края экрана: сверху вниз задания 1–20, у каждого
// риска, длина которой — прогресс задания. Нажал — линейка выезжает целиком: справа от номера квадратик
// на каждый подраздел (урок задачника или тема тренажёра). Переключатель сверху: «Задачник» (оливковая
// линейка) / «Тренажёр» (бордовая). Колокольчик — задание текущего сета. Замок — подраздел только в PRO.
// Данные — lib/egeRuler.ts.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lock, X } from 'lucide-react'
import type { RulerData, RulerTask } from '@/lib/egeRuler'
import { declensionRu } from '@/usefulFunctions'

type Mode = 'learn' | 'trainer'

const SHORT: Record<number, string> = {
    1: 'Планиметрия', 2: 'Векторы', 3: 'Стереометрия', 4: 'Вероятность', 5: 'Сложная вероятность',
    6: 'Мат. ожидание', 7: 'Уравнения', 8: 'Выражения', 9: 'Производная', 10: 'Прикладные',
    11: 'Текстовые', 12: 'Графики', 13: 'Финансы', 14: 'Уравнения', 15: 'Стереометрия',
    16: 'Неравенства', 17: 'Моделирование', 18: 'Планиметрия', 19: 'Параметр', 20: 'Теория чисел',
}

// Линейка задачника — армейская оливковая, тренажёра — бордовая. Риски кремовые, как краска на старой линейке.
const SKIN: Record<Mode, { body: string; edge: string; light: string; fill: string; label: string }> = {
    learn: { body: '#3D4728', edge: '#272E19', light: '#55613A', fill: '#C9E36B', label: 'Задачник' },
    trainer: { body: '#4A1F28', edge: '#2E1218', light: '#673040', fill: '#F2C35B', label: 'Тренажёр' },
}
const TICK = '#D9D2B0'
const MEDAL = { bronze: '#C98A4B', silver: '#C9D4DA', gold: '#F2C35B' }
const MODE_KEY = 'egeRulerMode'

const pct = (n: number, d: number) => (d > 0 ? n / d : 0)

/** Прогресс задания 0..1 в выбранном режиме. */
function taskProgress(t: RulerTask, mode: Mode) {
    if (mode === 'learn') {
        const total = t.lessons.reduce((s, l) => s + l.total, 0)
        return pct(t.lessons.reduce((s, l) => s + Math.min(l.solved, l.total), 0), total)
    }
    return t.trainers.length ? t.trainers.reduce((s, k) => s + k.percent, 0) / t.trainers.length / 100 : 0
}

const medalColor = (p: number) => (p >= 100 ? MEDAL.gold : p >= 50 ? MEDAL.silver : p > 0 ? MEDAL.bronze : null)

function Bell({ size = 14 }: { size?: number }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/set-bells/bell-1-body.webp" alt="Сет" title="Сейчас в сете" className="shrink-0 animate-bounce" style={{ width: size, height: size }} />
}

function Square({ fill, color, locked, title, gold }: { fill: number; color: string; locked: boolean; title: string; gold?: boolean }) {
    return (
        <span title={title} className="relative h-[13px] w-[13px] shrink-0 overflow-hidden rounded-[3px]"
            style={{ background: '#00000040', boxShadow: `inset 0 0 0 1px ${TICK}33` }}>
            {fill > 0 && <span className="absolute inset-x-0 bottom-0" style={{ height: `${Math.max(fill, 0.15) * 100}%`, background: color, boxShadow: gold ? `0 0 6px ${color}` : undefined }} />}
            {locked && <Lock className="absolute inset-0 m-auto h-[9px] w-[9px]" style={{ color: `${TICK}99` }} strokeWidth={3} />}
        </span>
    )
}

function Squares({ t, mode, color }: { t: RulerTask; mode: Mode; color: string }) {
    if (mode === 'learn') {
        if (!t.lessons.length) return <span className="text-[10px] font-bold" style={{ color: `${TICK}55` }}>скоро</span>
        return <>{t.lessons.map((l) => {
            const f = pct(Math.min(l.solved, l.total), l.total)
            return <Square key={l.id} fill={f} color={color} gold={f >= 1} locked={l.proLocked && f < 1} title={`${l.title}: ${l.solved}/${l.total}`} />
        })}</>
    }
    if (!t.trainers.length) return <span className="text-[10px] font-bold" style={{ color: `${TICK}55` }}>скоро</span>
    return <>{t.trainers.map((k) => {
        const c = medalColor(k.percent)
        return <Square key={k.tUnitId} fill={c ? 1 : 0} color={c ?? color} gold={k.percent >= 100} locked={k.proLocked && k.percent < 100} title={`${k.title}: ${k.percent}%`} />
    })}</>
}

const rowHref = (t: RulerTask, mode: Mode) =>
    mode === 'trainer' && t.trainers.length
        ? `/trainer?topic=${encodeURIComponent((t.trainers.find((k) => k.percent < 100) ?? t.trainers[0]).title)}`
        : `/learn?task=${t.num}`

/** Узкая свёрнутая линейка: только риски и мелкие номера. */
function Strip({ data, mode, onOpen }: { data: RulerData; mode: Mode; onOpen: () => void }) {
    const s = SKIN[mode]
    return (
        <button type="button" onClick={onOpen} aria-label="Открыть линейку ЕГЭ"
            className="flex w-[30px] flex-col items-stretch rounded-l-lg border-y border-l pb-2 pt-1.5 shadow-[-3px_3px_10px_#0007]"
            style={{ background: `linear-gradient(90deg, ${s.light}, ${s.body} 40%, ${s.edge})`, borderColor: s.edge }}>
            <span className="mb-1 text-center text-[8px] font-black tracking-wider" style={{ color: TICK }}>ЕГЭ</span>
            {data.tasks.map((t) => {
                const p = taskProgress(t, mode)
                return (
                    <span key={t.num} className={`relative flex h-[17px] items-center gap-[2px] pl-[2px] ${t.num === 14 ? 'mt-1.5 border-t' : ''}`} style={{ borderColor: `${TICK}66` }}>
                        <span className="w-[12px] text-right font-mono text-[8px] font-bold leading-none" style={{ color: `${TICK}${p > 0 ? 'DD' : '77'}` }}>{t.num}</span>
                        <span className="h-[2px] rounded-full" style={{ width: 3 + 10 * p, background: p >= 1 ? s.fill : p > 0 ? TICK : `${TICK}55` }} />
                        {data.setTaskNum === t.num && <span className="absolute -left-[5px] h-[7px] w-[7px] rounded-full" style={{ background: '#F2C35B', boxShadow: '0 0 6px #F2C35B' }} />}
                    </span>
                )
            })}
        </button>
    )
}

/** Выдвижная линейка: 20 строк, переключатель задачник/тренажёр, замки PRO. */
function Panel({ data, mode, setMode, onClose }: { data: RulerData; mode: Mode; setMode: (m: Mode) => void; onClose?: () => void }) {
    const s = SKIN[mode]
    const all = data.tasks.reduce((sum, t) => sum + taskProgress(t, mode), 0) / Math.max(data.tasks.length, 1)
    const locked = data.tasks.reduce((n, t) => n + (mode === 'learn'
        ? t.lessons.filter((l) => l.proLocked && l.solved < l.total).length
        : t.trainers.filter((k) => k.proLocked && k.percent < 100).length), 0)
    return (
        <div className="flex max-h-full w-[min(340px,92vw)] flex-col rounded-l-2xl border-y border-l shadow-[-6px_6px_24px_#000a]"
            style={{ background: `linear-gradient(90deg, ${s.light}, ${s.body} 18%, ${s.body} 85%, ${s.edge})`, borderColor: s.edge }}>
            <div className="flex items-center gap-2 px-3 pb-2 pt-3">
                <div className="flex rounded-full p-[3px]" style={{ background: '#0006' }}>
                    {(['learn', 'trainer'] as Mode[]).map((m) => (
                        <button key={m} type="button" onClick={() => setMode(m)}
                            className="rounded-full px-3 py-1 text-xs font-black transition-colors"
                            style={m === mode ? { background: SKIN[m].fill, color: '#1D2210' } : { color: `${TICK}AA` }}>
                            {SKIN[m].label}
                        </button>
                    ))}
                </div>
                <span className="ml-auto font-mono text-sm font-black" style={{ color: TICK }}>{Math.round(all * 100)}%</span>
                {onClose && (
                    <button type="button" onClick={onClose} aria-label="Закрыть" className="rounded-full p-1" style={{ color: TICK }}>
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
                {data.tasks.map((t) => {
                    const p = taskProgress(t, mode)
                    const isSet = data.setTaskNum === t.num
                    return (
                        <div key={t.num}>
                            {t.num === 14 && (
                                <div className="mb-1 mt-2 flex items-center gap-2 px-1">
                                    <span className="h-px flex-1" style={{ background: `${TICK}66` }} />
                                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: `${TICK}AA` }}>часть 2</span>
                                    <span className="h-px flex-1" style={{ background: `${TICK}66` }} />
                                </div>
                            )}
                            <Link href={rowHref(t, mode)} onClick={onClose}
                                className="flex items-center gap-2 rounded-lg px-1 py-[5px] hover:bg-black/20"
                                style={isSet ? { background: '#F2C35B1A', boxShadow: 'inset 0 0 0 1px #F2C35B66' } : undefined}>
                                <span className="flex w-[34px] shrink-0 items-center gap-[3px]">
                                    <span className="h-[2px] rounded-full" style={{ width: 4 + 6 * p, background: p >= 1 ? s.fill : TICK }} />
                                    <span className="font-mono text-[13px] font-black leading-none" style={{ color: p > 0 ? TICK : `${TICK}88` }}>{t.num}</span>
                                </span>
                                <span className="w-[86px] shrink-0 truncate text-[11px] font-bold" style={{ color: `${TICK}${p > 0 ? 'CC' : '77'}` }}>{SHORT[t.num] ?? t.title}</span>
                                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-[3px]">
                                    <Squares t={t} mode={mode} color={s.fill} />
                                </span>
                                {isSet && <Bell />}
                            </Link>
                        </div>
                    )
                })}
            </div>
            {locked > 0 && (
                <Link href="/pro?from=ruler" onClick={onClose}
                    className="mx-3 mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold"
                    style={{ background: '#0006', color: TICK, boxShadow: `inset 0 0 0 1px ${TICK}33` }}>
                    <Lock className="h-4 w-4 shrink-0" />
                    <span>Ещё {locked} {declensionRu(locked, 'подраздел', 'подраздела', 'подразделов')} {locked === 1 ? 'открывается' : 'открываются'} в <span className="pro-pill rounded px-1 font-black">PRO</span></span>
                </Link>
            )}
        </div>
    )
}

export function EgeRuler({ data, inline = false }: { data: RulerData; inline?: boolean }) {
    const [mode, setModeState] = useState<Mode>('learn')
    const [open, setOpen] = useState(false)
    useEffect(() => {
        try { const m = localStorage.getItem(MODE_KEY); if (m === 'learn' || m === 'trainer') setModeState(m) } catch {}
    }, [])
    const setMode = (m: Mode) => {
        setModeState(m)
        try { localStorage.setItem(MODE_KEY, m) } catch {}
    }

    if (inline) return <Panel data={data} mode={mode} setMode={setMode} />

    return (
        <>
            <div className="fixed right-0 top-[120px] z-[60] lg:top-[140px]">
                <Strip data={data} mode={mode} onOpen={() => setOpen(true)} />
            </div>
            {open && <div className="fixed inset-0 z-[119] bg-black/40" onClick={() => setOpen(false)} />}
            <div className="fixed bottom-4 right-0 top-[64px] z-[120] flex items-start transition-transform duration-300 ease-out"
                style={{ transform: open ? 'translateX(0)' : 'translateX(105%)' }}>
                <Panel data={data} mode={mode} setMode={setMode} onClose={() => setOpen(false)} />
            </div>
        </>
    )
}
