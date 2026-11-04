'use client'

// components/set-bar.tsx — полоска «Сета» в шапке /trainer и /learn (данные — lib/setBar.ts).
// Сет = три блюда от Команданте: закуска (урок тренажёра) → основное (задачи задачника) → десерт (кейс).
// Телефон: липкая полоска сразу под верхней шапкой; листаешь вниз — уезжает под шапку, а в шапке
// справа от юнита остаются точки и сундук (components/mobile-header.tsx). Компьютер — под кнопкой юнита.
// Нажатие — карточка сета шторкой поверх страницы. Новое блюдо — звенит колокольчик.
// Макет, по которому сделано, — /test-set-bar.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, ChevronRight, Lock, Radar, X } from 'lucide-react'
import type { SetBarData } from '@/lib/setBar'
import { startEgeMove } from '@/actions/ege-move'
import { useSetBarStore } from '@/store/use-set-bar-store'
import { SET_BELL_SOUND, playSound, preloadSound } from '@/lib/sound'
import { LESSON_CASE_TIER_ICON, LESSON_CASE_TIER_LABEL } from '@/lib/caseRewards'
import { PetBust } from './trainer-pet'

const GREEN = '#78C93C'
const GOLD = '#F2C35B'
const DISHES = ['Закуска', 'Основное', 'Десерт']

export const setDishOf = (d: SetBarData): number =>
    d.step === 'trainer' ? 0 : d.step === 'tasks' || d.step === 'trainer2' ? 1 : d.step === 'done' && !d.caseClaimed ? 2 : 3

export function SetDots({ dish, size = 10 }: { dish: number; size?: number }) {
    const cur = Math.min(dish, 2)
    return (
        <span className="flex items-center gap-1">
            {DISHES.map((_, i) => {
                const done = dish === 3 ? false : i < cur
                const now = dish !== 3 && i === cur
                return (
                    <span key={i} className="rounded-full" style={{ width: size, height: size, background: done ? GREEN : now ? GOLD : '#2E3B42', boxShadow: now ? `0 0 6px ${GOLD}` : undefined }} />
                )
            })}
        </span>
    )
}

const tierLabel = (d: SetBarData) => LESSON_CASE_TIER_LABEL[d.tier].toLowerCase()

function shout(d: SetBarData, dish: number) {
    if (dish === 0) return `Три блюда — и ${tierLabel(d)} сундук твой, компаньеро 🍽`
    if (dish === 1) {
        if (d.tLessonId2) return 'Закуска съедена! Основное — ещё один урок тренажёра 🔥'
        const left = d.tasksTotal - d.tasksDone
        if (left === 1) return 'Последняя задача — и десерт твой! 🔥'
        return `Закуска съедена! Теперь основное: ${left} ${left < 5 ? 'задачи' : 'задач'} задания №${d.taskNum} 🔥`
    }
    if (dish === 2) return `Всё съедено! Забирай ${tierLabel(d)} сундук 🎁`
    return 'Урок тренажёра, задачи — и сундук на десерт 😋'
}

// Чем больше сетов за день, тем лучше сундук: подсказка, что даст следующий сет
function nextTierHint(d: SetBarData) {
    if (d.setNumber >= 3) return 'Сегодня каждый следующий — с мифическим сундуком 🔥'
    if (d.setNumber === 2) return 'Ещё один после этого — и мифический сундук'
    return 'Чем больше за день, тем круче сундук: 2-й — редкий, 3-й — мифический'
}

function useBell(d: SetBarData, dish: number) {
    useEffect(() => preloadSound(SET_BELL_SOUND), [])
    useEffect(() => {
        if (!d.moveId) return
        let prev: { id: number; dish: number } | null = null
        try { prev = JSON.parse(localStorage.getItem('setBarDish') || 'null') } catch { /* нет хранилища */ }
        // новое блюдо подано — колокольчик, как на стойке ресторана
        if (prev && prev.id === d.moveId && dish > prev.dish && dish <= 2) playSound(SET_BELL_SOUND)
        try { localStorage.setItem('setBarDish', JSON.stringify({ id: d.moveId, dish })) } catch { /* нет хранилища */ }
    }, [d.moveId, dish])
}

// ── Карточка сета (шторка) ──────────────────────────────────────────────────────────────
function SetSheet({ d, dish, top, onClose }: { d: SetBarData; dish: number; top: number; onClose: () => void }) {
    const router = useRouter()
    const [busy, setBusy] = useState(false)
    const go = async () => {
        if (busy) return
        if (dish === 0 && d.tLessonId && d.moveId) router.push(`/t-lesson/${d.tLessonId}?move=${d.moveId}`)
        else if (dish === 1 && d.moveId && d.tLessonId2) router.push(`/t-lesson/${d.tLessonId2}?move=${d.moveId}`)
        else if (dish === 1 && d.moveId) router.push(`/move/${d.moveId}/tasks`)
        else if (dish === 2 && d.moveId) router.push(`/move/${d.moveId}`)
        else {
            setBusy(true)
            const r = await startEgeMove().catch(() => ({ error: 'Ошибка' }))
            setBusy(false)
            // сет собран — обновляем страницу, карточка остаётся открытой уже с закуской
            if ('id' in r) router.refresh()
            return
        }
        onClose()
    }
    const label = dish === 0 ? `Закуска: ${d.trainerTitle ?? 'урок тренажёра'}`
        : dish === 1 ? (d.tLessonId2 ? `Основное: ${d.trainer2Title ?? 'урок тренажёра'}` : `Задачи: ${d.tasksDone} из ${d.tasksTotal}`)
            : dish === 2 ? `Забрать ${tierLabel(d)} сундук 🎁` : busy ? 'Накрываем на стол…' : 'Погнали 🍽'

    const tiles = [
        { what: d.hasTrainer ? (d.trainerTitle ? `Тренажёр: ${d.trainerTitle}` : 'Тренажёр') : 'Без закуски' },
        { what: d.tLessonId2 ? `Тренажёр: ${d.trainer2Title ?? 'урок'}` : d.tasksTotal ? `Задачи №${d.taskNum}: ${d.tasksDone}/${d.tasksTotal}` : 'Без задач' },
        { what: '' },
    ]
    return createPortal(
        <div className="fixed inset-0 z-[120]">
            <button aria-label="Закрыть" onClick={onClose} className="absolute inset-0 bg-black/55" />
            <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="absolute inset-x-0 mx-auto max-w-md px-3" style={{ top }}>
                <div className="rounded-2xl border-2 border-[#4A3A14] bg-[#151F23] p-3.5 shadow-2xl">
                    <div className="flex items-start gap-3">
                        {/* Мигель по пояс, как на карте тренажёра: с клошем и подносом блюд, на десерте — с сундуком на подносе */}
                        <div className="-mb-3.5 -ml-1 -mt-1"><PetBust src={dish === 2 ? '/miguel/miguel-tray-chest.webp' : '/miguel/miguel-cloche.webp'} size={132} width={108} /></div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black uppercase tracking-wider text-[#F2C35B]">
                                {d.taskNum ? `Задание ЕГЭ №${d.taskNum}` : 'От Команданте'}
                            </p>
                            <p className="text-lg font-black leading-tight text-[#F2F7FB]">{d.taskTitle ?? 'Обед из трёх блюд'}</p>
                            <p className="mt-1 text-sm font-bold leading-snug text-[#E8D9B8]">{shout(d, dish)}</p>
                            <p className="mt-1 text-[11px] font-black text-[#9AA7B0]">{nextTierHint(d)}</p>
                        </div>
                        <button onClick={onClose} className="-mr-1 -mt-1 p-1 text-[#6B7A83]" aria-label="Закрыть"><X className="h-5 w-5" /></button>
                    </div>
                    {dish < 3 && (
                        <div className="mt-4 flex items-stretch gap-1.5">
                            {DISHES.map((name, i) => {
                                const ok = i < dish, cur = i === dish, far = i > dish
                                return (
                                    <div key={i} className="relative flex flex-1 flex-col">
                                        {cur && (
                                            <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 1, repeat: Infinity }}
                                                className="absolute -top-3 left-0 right-0 z-10 mx-auto w-fit whitespace-nowrap rounded-full bg-[#F2C35B] px-1.5 text-[10px] font-black text-[#3A2A08]">ты здесь</motion.span>
                                        )}
                                        <div className={`flex h-full flex-col items-center gap-1 rounded-xl border-2 p-2 text-center ${far ? 'opacity-40' : ''}`}
                                            style={{ borderColor: ok ? '#3D8A55' : cur ? GOLD : '#2A363C', background: ok ? '#163322' : cur ? '#2A2410' : '#0F171B' }}>
                                            <span className="text-[10px] font-black uppercase text-[#9AA7B0]">{name}</span>
                                            {i < 2 ? (
                                                <span className="text-[11px] font-bold leading-tight text-[#C9D3D9]">{tiles[i].what}</span>
                                            ) : (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={LESSON_CASE_TIER_ICON[d.tier]} alt="" className={`h-9 w-9 ${cur ? 'animate-bounce' : far ? 'grayscale' : ''}`} />
                                            )}
                                            {ok && <Check className="mt-auto h-4 w-4 text-[#9EE8B0]" strokeWidth={3.5} />}
                                            {far && i < 2 && <Lock className="mt-auto h-3.5 w-3.5 text-[#6B7A83]" />}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                    <button onClick={go} disabled={busy}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-b-4 py-2.5 text-sm font-black text-[#16240C] active:border-b-0"
                        style={{ background: dish === 2 ? 'linear-gradient(180deg,#FFD84D,#F2C35B)' : GREEN, borderBottomColor: dish === 2 ? '#B8862E' : '#60A12F' }}>
                        <span className="truncate">{label}</span>
                        <ChevronRight className="h-4 w-4 shrink-0" />
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body,
    )
}

function BarButton({ d, dish, onClick }: { d: SetBarData; dish: number; onClick: () => void }) {
    const eaten = dish === 2
    return (
        <button type="button" onClick={onClick}
            className="flex h-[44px] w-full items-center gap-2.5 rounded-xl border-2 px-2.5 shadow-lg shadow-black/40"
            style={{ borderColor: eaten ? '#B8862E' : '#2A363C', background: eaten ? 'linear-gradient(90deg,#3A2E0C,#1D1A0C)' : '#0F171B' }}>
            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#163322]">
                <Radar className="h-4 w-4 text-[#9EE8B0]" />
                <span className="absolute inset-0 animate-ping rounded-full border-2 border-[#78C93C] opacity-40" />
            </span>
            <span className="min-w-0 flex-1 truncate text-left text-[13px] font-black text-[#F2F7FB]">
                {dish < 2 ? <>Сет · №{d.taskNum} · <span className="text-[#F2C35B]">{dish === 0 ? 'закуска' : d.tLessonId2 ? 'основное' : `задачи ${d.tasksDone}/${d.tasksTotal}`}</span></>
                    : dish === 2 ? <span className="text-[#FFE58A]">Сет съеден! Забрать сундук</span>
                        : 'Новый сет готов 🍽'}
            </span>
            {dish < 3 && <SetDots dish={dish} />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LESSON_CASE_TIER_ICON[d.tier]} alt="" className={`h-7 w-7 shrink-0 ${eaten ? 'animate-bounce' : ''}`} />
        </button>
    )
}

export function SetBar({ data }: { data: SetBarData }) {
    const dish = setDishOf(data)
    const [sheet, setSheet] = useState(false)
    const [compact, setCompact] = useState(false)
    const store = useSetBarStore()
    const setStore = store.set
    const lastY = useRef(0)
    useBell(data, dish)

    // мини-значок в шапке телефона знает, какое блюдо и как открыть карточку
    useEffect(() => {
        setStore({ dish, chest: LESSON_CASE_TIER_ICON[data.tier], open: () => setSheet(true) })
        return () => setStore({ dish: null, open: null, compact: false })
    }, [dish, data.tier, setStore])

    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY
            const dy = y - lastY.current
            let c: boolean | null = null
            if (y < 40) c = false
            else if (dy > 6) c = true
            else if (dy < -6) c = false
            if (c !== null) { setCompact(c); setStore({ compact: c }) }
            lastY.current = y
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [setStore])

    return (
        <>
            {/* телефон: полоска липнет под верхней шапкой (50px) вместе с шапкой страницы; листаешь вниз — уезжает под шапку.
                компьютер: стоит под кнопкой юнита, не прячется. */}
            <div className={`w-full pt-1.5 lg:pt-0 lg:mt-2 transition-[transform,opacity] duration-300 lg:!translate-y-0 lg:!opacity-100 lg:!pointer-events-auto ${compact ? '-translate-y-[60px] opacity-0 pointer-events-none' : ''}`}>
                <BarButton d={data} dish={dish} onClick={() => setSheet(true)} />
            </div>
            {sheet && <SetSheet d={data} dish={dish} top={typeof window !== 'undefined' && window.innerWidth >= 1024 ? 90 : 56} onClose={() => setSheet(false)} />}
        </>
    )
}
