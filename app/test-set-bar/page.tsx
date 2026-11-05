'use client'

// Макет: полоска «Сета» в липкой шапке тренажёра на телефоне.
// Шапка = гамбургер + кнопка юнита (как в components/mobile-header.tsx), под ней полоска сета ~40px.
// Листаешь вниз — полоска уезжает под шапку, а три точки и сундук встают справа от кнопки юнита.
// Листаешь вверх — полоска возвращается. Нажал на полоску — карточка сета выезжает шторкой поверх страницы.
// Данные выдуманные, ничего не сохраняется.

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronDown, ChevronRight, Lock, Menu, Radar, X } from 'lucide-react'
import { SET_BELL_SOUND, SET_BELL_VOLUME, playSound, preloadSound } from '@/lib/sound'

const UNIT = { title: 'Тригонометрическая окружность (БАЗА)', button: '#BC418A', bottom: '#96346F' }
const SET = {
    task: 7,
    taskTitle: 'Уравнения',
    dishes: [
        { name: 'Закуска', what: 'Тренажёр: Знакомство с окружностью' },
        { name: 'Основное', what: 'Тренажёр: Таблица 30°, 45°, 60°' },
        { name: 'Десерт', what: 'Редкий кейс' },
    ],
}
const CHEST = '/chests/rare0001.svg'
const HEADER_H = 50
const BAR_H = 44

const GREEN = '#78C93C'
const GOLD = '#F2C35B'

function Dots({ d, size = 10 }: { d: number; size?: number }) {
    return (
        <span className="flex items-center gap-1">
            {SET.dishes.map((_, i) => (
                <span key={i} className="rounded-full" style={{ width: size, height: size, background: i < d ? GREEN : i === d ? GOLD : '#2E3B42', boxShadow: i === d ? `0 0 6px ${GOLD}` : undefined }} />
            ))}
        </span>
    )
}

function shout(d: number) {
    if (d === 0) return 'Сет на сегодня, компаньеро! Три блюда — и сундук твой 🍽'
    if (d === 1) return 'Закуска съедена! Ещё одно блюдо — и десерт 🔥'
    if (d === 2) return 'Десерт ждёт! Забирай сундук 🎁'
    return 'Сет съеден! Новый уже готовится 😋'
}

// ── Шторка с карточкой сета ─────────────────────────────────────────────────────────────
function SetSheet({ d, onClose, onStep }: { d: number; onClose: () => void; onStep: () => void }) {
    return (
        <div className="fixed inset-0 z-[60]">
            <button aria-label="Закрыть" onClick={onClose} className="absolute inset-0 bg-black/55" />
            <motion.div
                initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="absolute inset-x-0 mx-auto max-w-md px-3" style={{ top: HEADER_H + 6 }}>
                <div className="rounded-2xl border-2 border-[#4A3A14] bg-[#151F23] p-3.5 shadow-2xl">
                    <div className="flex items-start gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/miguel/miguel-megaphone.webp" alt="" className="h-16 w-16 shrink-0 object-contain" />
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black uppercase tracking-wider text-[#F2C35B]">Сет · задание №{SET.task}</p>
                            <p className="text-lg font-black leading-tight text-[#F2F7FB]">{SET.taskTitle}</p>
                            <p className="mt-1 text-sm font-bold leading-snug text-[#E8D9B8]">{shout(d)}</p>
                        </div>
                        <button onClick={onClose} className="-mr-1 -mt-1 p-1 text-[#6B7A83]"><X className="h-5 w-5" /></button>
                    </div>
                    <div className="mt-4 flex items-stretch gap-1.5">
                        {SET.dishes.map((dish, i) => {
                            const ok = i < d, cur = i === d, far = i > d
                            return (
                                <div key={i} className="relative flex flex-1 flex-col">
                                    {cur && (
                                        <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 1, repeat: Infinity }}
                                            className="absolute -top-3 left-0 right-0 z-10 mx-auto w-fit whitespace-nowrap rounded-full bg-[#F2C35B] px-1.5 text-[10px] font-black text-[#3A2A08]">ты здесь</motion.span>
                                    )}
                                    <div className={`flex h-full flex-col items-center gap-1 rounded-xl border-2 p-2 text-center ${far ? 'opacity-40' : ''}`}
                                        style={{ borderColor: ok ? '#3D8A55' : cur ? GOLD : '#2A363C', background: ok ? '#163322' : cur ? '#2A2410' : '#0F171B' }}>
                                        <span className="text-[10px] font-black uppercase text-[#9AA7B0]">{dish.name}</span>
                                        {i < 2 ? (
                                            <span className="text-[11px] font-bold leading-tight text-[#C9D3D9]">{far ? '???' : dish.what}</span>
                                        ) : (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={CHEST} alt="" className={`h-9 w-9 ${cur ? 'animate-bounce' : far ? 'grayscale' : ''}`} />
                                        )}
                                        {ok && <Check className="mt-auto h-4 w-4 text-[#9EE8B0]" strokeWidth={3.5} />}
                                        {far && i < 2 && <Lock className="mt-auto h-3.5 w-3.5 text-[#6B7A83]" />}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <button onClick={onStep}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-b-4 py-2.5 text-sm font-black text-[#16240C] active:border-b-0"
                        style={{ background: d >= 2 ? 'linear-gradient(180deg,#FFD84D,#F2C35B)' : GREEN, borderBottomColor: d >= 2 ? '#B8862E' : '#60A12F' }}>
                        {d < 2 ? SET.dishes[d].what : d === 2 ? 'Забрать сундук 🎁' : 'Начать новый сет'}
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

// ── Фейковая карта тренажёра, чтобы было что листать ───────────────────────────────────
function FakeMap() {
    const rows = Array.from({ length: 14 }, (_, i) => i)
    return (
        <div className="flex flex-col gap-10 px-6 py-6">
            {rows.map((i) => {
                const x = [20, 55, 35, 65, 25, 50][i % 6]
                const here = i === 4
                return (
                    <div key={i} className="flex items-center gap-3" style={{ marginLeft: `${x}%` }}>
                        <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-b-[6px] text-lg font-black text-white"
                            style={{ background: i < 4 ? UNIT.button : '#26333B', borderBottomColor: i < 4 ? UNIT.bottom : '#1B252A', boxShadow: here ? `0 0 0 3px ${GOLD}` : undefined }}>
                            {i + 1}
                            {here && (
                                <span className="absolute -top-3 rounded-full bg-[#F2C35B] px-1.5 text-[10px] font-black text-[#3A2A08]">сет</span>
                            )}
                        </span>
                        <span className="text-sm font-extrabold text-[#9AA7B0]">Этап {i + 1}</span>
                    </div>
                )
            })}
        </div>
    )
}

export default function TestSetBarPage() {
    const [d, setD] = useState(0) // 0,1 — блюда; 2 — десерт; 3 — съеден
    const [compact, setCompact] = useState(false)
    const [sheet, setSheet] = useState(false)
    const lastY = useRef(0)

    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY
            const dy = y - lastY.current
            if (y < 40) setCompact(false)
            else if (dy > 6) setCompact(true)
            else if (dy < -6) setCompact(false)
            lastY.current = y
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => preloadSound(SET_BELL_SOUND), [])

    const step = () => {
        // новое блюдо подано (закуска → основное → десерт) — звенит колокольчик, как на стойке ресторана
        if (d < 2) playSound(SET_BELL_SOUND, SET_BELL_VOLUME)
        if (d < 3) setD(d + 1)
        else setD(0)
        if (d >= 1) setSheet(false)
    }
    const eaten = d >= 2

    return (
        <div className="min-h-screen bg-[#131D22]">
            {/* липкая шапка: гамбургер + кнопка юнита (+ точки сета, когда полоска свернулась) */}
            <div className="fixed inset-x-0 top-0 z-50">
                <nav className="relative z-10 flex h-[50px] items-center gap-2 border-b border-[#3A464E] bg-[#151F23] px-4">
                    <Menu className="h-6 w-6 shrink-0 text-[#9AA7B0]" />
                    <button type="button" className="ml-1 flex h-[38px] min-w-0 flex-1 items-center gap-2 rounded-xl border-b-4 px-3 text-sm font-extrabold text-white active:border-b-0"
                        style={{ background: `linear-gradient(135deg, ${UNIT.button}, ${UNIT.bottom})`, borderBottomColor: UNIT.bottom }}>
                        <span className="flex-1 truncate text-center">{UNIT.title}</span>
                        <ChevronDown className="h-4 w-4 shrink-0 opacity-90" />
                    </button>
                    {/* мини-сет: появляется, когда полоска уехала под шапку */}
                    <button type="button" onClick={() => setSheet(true)}
                        className="flex h-[38px] shrink-0 items-center gap-1.5 overflow-hidden rounded-xl border-2 border-[#2A363C] bg-[#0F171B] transition-[width,opacity,padding] duration-300"
                        style={{ width: compact ? 78 : 0, opacity: compact ? 1 : 0, paddingLeft: compact ? 8 : 0, paddingRight: compact ? 6 : 0, borderWidth: compact ? 2 : 0 }}
                        aria-hidden={!compact} tabIndex={compact ? 0 : -1}>
                        <Dots d={Math.min(d, 2)} size={8} />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={CHEST} alt="" className={`h-6 w-6 shrink-0 ${eaten ? 'animate-bounce' : ''}`} />
                    </button>
                </nav>
                {/* полоска сета: уезжает под шапку при прокрутке вниз */}
                <div className="px-3 pt-1.5 transition-[transform,opacity] duration-300"
                    style={{ transform: compact ? `translateY(-${BAR_H + 8}px)` : 'translateY(0)', opacity: compact ? 0 : 1, pointerEvents: compact ? 'none' : 'auto' }}>
                    <button type="button" onClick={() => setSheet(true)}
                        className="flex w-full items-center gap-2.5 rounded-xl border-2 px-2.5 shadow-lg shadow-black/40"
                        style={{ height: BAR_H, borderColor: eaten ? '#B8862E' : '#2A363C', background: eaten ? 'linear-gradient(90deg,#3A2E0C,#1D1A0C)' : '#0F171B' }}>
                        <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#163322]">
                            <Radar className="h-4 w-4 text-[#9EE8B0]" />
                            <span className="absolute inset-0 animate-ping rounded-full border-2 border-[#78C93C] opacity-40" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-left text-[13px] font-black text-[#F2F7FB]">
                            {d < 2 ? <>Сет · №{SET.task} · <span className="text-[#F2C35B]">блюдо {d + 1} из 3</span></>
                                : d === 2 ? <span className="text-[#FFE58A]">Сет съеден! Забрать сундук</span>
                                    : 'Новый сет готов 🍽'}
                        </span>
                        <Dots d={Math.min(d, 2)} />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={CHEST} alt="" className={`h-7 w-7 shrink-0 ${eaten ? 'animate-bounce' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="mx-auto max-w-md" style={{ paddingTop: HEADER_H + BAR_H + 14 }}>
                <div className="mx-3 mt-2 rounded-xl border border-dashed border-[#3A464E] p-3 text-xs font-bold text-[#9AA7B0]">
                    Макет. Листай вниз — полоска сета прячется под шапку, справа от юнита остаются точки и сундук.
                    Листай вверх — возвращается. Нажми на полоску — карточка сета.
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {['Блюдо 1', 'Блюдо 2', 'Десерт', 'Съеден'].map((t, i) => (
                            <button key={t} onClick={() => { if (i > d && i <= 2) playSound(SET_BELL_SOUND, SET_BELL_VOLUME); setD(i) }}
                                className={`rounded-lg px-2 py-1 text-[11px] font-black ${d === i ? 'bg-[#F2C35B] text-[#3A2A08]' : 'bg-[#26333B] text-[#C9D3D9]'}`}>{t}</button>
                        ))}
                    </div>
                </div>
                <FakeMap />
            </div>

            {sheet && <SetSheet d={d} onClose={() => setSheet(false)} onStep={step} />}
        </div>
    )
}
