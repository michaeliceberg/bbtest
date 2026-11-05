'use client'

// components/set-bar.tsx — полоска «Сета» в шапке /trainer и /learn (данные — lib/setBar.ts).
// Сет = три блюда от Команданте: закуска (урок тренажёра) → основное (задачи задачника) → десерт (кейс).
// Телефон: липкая полоска сразу под верхней шапкой; листаешь вниз — уезжает под шапку, а в шапке
// справа от юнита остаются точки и сундук (components/mobile-header.tsx). Компьютер — под кнопкой юнита.
// Под полоской — «язычок» с колокольчиком уровня (1-й/2-й/3-й сет за день): тянешь вниз или жмёшь — панель сета
// выезжает вниз прямо из полоски. Новое блюдо — звенит колокольчик. Еда блюд и колокольчики — SET_DISH_ICONS /
// SET_BELLS (еда пока эмодзи; колокольчики — картинки из Leonardo с отдельной кнопкой сверху).
// Макет, по которому сделано, — /test-set-bar.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { motion, type PanInfo } from 'framer-motion'
import { Check, ChevronDown, Swords, Utensils, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css'
import type { SetBarData, SetPreview } from '@/lib/setBar'
import { EGE_TASK_BLURB, pointsWord } from '@/lib/egeTaskBlurb'
import { startEgeMove } from '@/actions/ege-move'
import { useSetBarStore } from '@/store/use-set-bar-store'
import { SET_BELL_SOUND, SET_BELL_VOLUME, playSound, preloadSound } from '@/lib/sound'
import { LESSON_CASE_TIER_ICON, LESSON_CASE_TIER_LABEL, type LessonCaseTier } from '@/lib/caseRewards'
import { PetBust } from './trainer-pet'

const GREEN = '#78C93C'
const GOLD = '#F2C35B'
const DISHES = ['Закуска', 'Основное', 'Десерт']
// Еда блюд вместо слов (временно эмодзи — заменить на картинки public/set-food/*.webp, когда будут)
const SET_TABLECLOTH = '/set-tablecloth/cloth-1.webp'
export const SET_DISH_ICONS = ['🍟', '🍔', '🍩']
// Уровень колокольчика = какой это сет за день: 1-й — серебряный (обычный сундук), 2-й — синий (редкий),
// 3-й — фиолетовый (мифический), 4-й и дальше — огненный золотой (сундук тот же мифический).
// Картинка разрезана на корпус и кнопку сверху (public/set-bells/bell-N-body/knob.webp, исходники —
// docs/miguel/leonardo/bells, вырезка — docs/miguel/tools/bell_key.py, резка — bell_split.py): при нажатии кнопка уходит вниз внутрь колокольчика.
// press — насколько опускать кнопку, в долях размера картинки.
const SET_BELLS: { tier: LessonCaseTier; color: string; press: number }[] = [
    { tier: 'common', color: '#C9D3D9', press: 0.077 },
    { tier: 'rare', color: '#38BDF8', press: 0.064 },
    { tier: 'mythic', color: '#C385F7', press: 0.096 },
    { tier: 'mythic', color: '#F2C35B', press: 0.048 },
]
// Мигель в панели по блюду: закуска — клош с подносом, основное — шеф пробует, десерт — сундук на подносе,
// нового сета ещё нет — жмёт колокольчик «заказ готов»
const SET_MIGUEL = ['/miguel/miguel-cloche.webp', '/miguel/miguel-chef.webp', '/miguel/miguel-tray-chest.webp', '/miguel/miguel-bell.webp']
const bellLevel = (n: number) => Math.min(Math.max(n, 1), SET_BELLS.length)
const bellOf = (n: number) => SET_BELLS[bellLevel(n) - 1]

// Колокольчик: слои снизу вверх — подложка (свечение там, где была кнопка), кнопка, корпус с дыркой под кнопку.
// Кнопка лежит ПОД корпусом, при нажатии опускается и прячется в купол, корпус чуть сплющивается
function BellIcon({ n, size = 22, pressed = false }: { n: number; size?: number; pressed?: boolean }) {
    const lvl = bellLevel(n)
    const b = SET_BELLS[lvl - 1]
    return (
        <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/set-bells/bell-${lvl}-back.webp`} alt="" draggable={false} className="absolute inset-0 h-full w-full" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/set-bells/bell-${lvl}-knob.webp`} alt="" draggable={false}
                className="absolute inset-0 h-full w-full transition-transform duration-75 ease-out"
                style={{ transform: `translateY(${pressed ? b.press * size : 0}px)` }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/set-bells/bell-${lvl}-body.webp`} alt="" draggable={false}
                className="absolute inset-0 h-full w-full origin-bottom transition-transform duration-75 ease-out"
                style={{ transform: pressed ? 'scaleY(0.96)' : 'none' }} />
        </span>
    )
}

// Уровни сета столбиком: «ур1 🔔», «ур2 🔔», «ур3+ 🔔» (колокольчик = какой сундук в десерте); текущий — в рамке, остальные бледные
function ChestLevels({ setNumber }: { setNumber: number }) {
    const cur = Math.min(Math.max(setNumber, 1), 3)
    return (
        <div className="flex w-[68px] shrink-0 flex-col gap-1">
            {SET_BELLS.slice(0, 3).map((b, i) => {
                const n = i + 1
                const here = n === cur
                return (
                    <div key={n} title={`${LESSON_CASE_TIER_LABEL[b.tier]} сундук`}
                        className={`flex h-[26px] items-center justify-between rounded-lg border-2 pl-1.5 pr-1 ${here ? '' : 'opacity-40'}`}
                        style={{ borderColor: here ? b.color : 'transparent', background: here ? `${b.color}1F` : 'transparent' }}>
                        <span className="text-[11px] font-black leading-none" style={{ color: b.color }}>ур{n}{n === 3 ? '+' : ''}</span>
                        <BellIcon n={n} size={20} />
                    </div>
                )
            })}
        </div>
    )
}

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

// Кнопка «начать блюдо» — короткий призыв без стрелки; варианты сравниваются на /test-tablecloth
export const SET_GO_VARIANTS: { label: string; Icon: LucideIcon | null }[] = [
    { label: 'Приступить', Icon: Utensils },
    { label: 'К бою!', Icon: Swords },
    { label: 'За стол, компаньеро!', Icon: UtensilsCrossed },
    { label: 'Есть, Команданте!', Icon: Utensils },
    { label: 'Начать', Icon: null },
]

// Что ждёт в текущем блюде, без подписей: картинка или формула из финала урока; для задач — сама задача
function SetPreviewCard({ p }: { p: SetPreview }) {
    if (p.kind === 'task') {
        return (
            <div className="mt-3 flex gap-2.5 rounded-xl border-2 border-[#4A3A14] bg-[#1B1810] p-2.5">
                {p.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt="" className="h-16 w-16 shrink-0 rounded-lg bg-white object-contain" />
                )}
                <div className="line-clamp-4 min-w-0 flex-1 text-[13px] font-bold leading-snug text-[#E8D9B8]"><Latex>{p.question}</Latex></div>
            </div>
        )
    }
    return (
        <div className="mt-3 flex h-[150px] items-center justify-center overflow-hidden rounded-xl border-2 border-[#4A3A14] bg-[#1B1810] p-2">
            {p.kind === 'image'
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={p.src} alt="" className="h-full w-full object-contain" />
                : <div className="scene-tex max-w-full overflow-hidden text-[22px] text-[#F2F7FB]"><Latex>{p.tex}</Latex></div>}
        </div>
    )
}

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

function useBell(d: SetBarData, dish: number) {
    useEffect(() => preloadSound(SET_BELL_SOUND), [])
    useEffect(() => {
        if (!d.moveId) return
        let prev: { id: number; dish: number } | null = null
        try { prev = JSON.parse(localStorage.getItem('setBarDish') || 'null') } catch { /* нет хранилища */ }
        // новое блюдо подано — колокольчик, как на стойке ресторана
        if (prev && prev.id === d.moveId && dish > prev.dish && dish <= 2) playSound(SET_BELL_SOUND, SET_BELL_VOLUME)
        try { localStorage.setItem('setBarDish', JSON.stringify({ id: d.moveId, dish })) } catch { /* нет хранилища */ }
    }, [d.moveId, dish])
}

// ── Панель сета: выезжает вниз прямо из полоски ─────────────────────────────────────────
export function SetPanel({ d, dish, closing, onClose, goVariant = 0 }: { d: SetBarData; dish: number; closing: boolean; onClose: () => void; goVariant?: number }) {
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
    const go0 = SET_GO_VARIANTS[goVariant] ?? SET_GO_VARIANTS[0]
    const label = dish < 2 ? go0.label : dish === 2 ? `Забрать ${tierLabel(d)} сундук 🎁` : busy ? 'Накрываем на стол…' : 'Накрыть стол'
    const GoIcon = dish < 2 ? go0.Icon : dish === 3 ? UtensilsCrossed : null

    const tiles = dish === 3 ? [{ what: 'Тренажёр' }, { what: 'Задачи' }, { what: '' }] : [
        { what: d.hasTrainer ? (d.trainerTitle ? `Тренажёр: ${d.trainerTitle}` : 'Тренажёр') : 'Без закуски' },
        { what: d.tLessonId2 ? `Тренажёр: ${d.trainer2Title ?? 'урок'}` : d.tasksTotal ? `Задачи №${d.taskNum}: ${d.tasksDone}/${d.tasksTotal}` : 'Без задач' },
        { what: '' },
    ]
    return (
        // Открытие — пружина вниз из полоски; закрытие (closing) — так же мягко сворачивается вверх, потом размонтируется
        <motion.div initial={{ y: -16, opacity: 0, scaleY: 0.92 }}
            animate={closing ? { y: -14, opacity: 0, scaleY: 0.9 } : { y: 0, opacity: 1, scaleY: 1 }}
            transition={closing ? { duration: 0.26, ease: [0.4, 0, 1, 1] } : { type: 'spring', stiffness: 420, damping: 32 }}
            style={{ transformOrigin: 'top' }}
            className="absolute inset-x-0 top-full z-10 mt-1 grid max-h-[calc(100dvh-110px)] overflow-y-auto rounded-2xl border-2 border-[#4A3A14] bg-[#151F23] p-3.5 shadow-2xl shadow-black/60 sm:max-w-[680px] sm:grid-cols-[270px_1fr] sm:grid-rows-[auto_auto_1fr] sm:gap-x-5">
            {/* Телефон: шапка → превью → стол → кнопка. Шире — слева стол, справа Мигель, превью и кнопка */}
            <div className="flex items-start gap-2 sm:col-start-2">
                {/* Мигель по пояс, как на карте тренажёра; поза — по блюду (SET_MIGUEL) */}
                <div className="-mb-3.5 -ml-1 -mt-1"><PetBust src={SET_MIGUEL[dish]} size={124} width={84} flip={dish === 0} /></div>
                <div className="min-w-0 flex-1">
                    <p className="whitespace-nowrap text-[10px] font-black uppercase text-[#F2C35B]">
                        {d.taskNum ? `ЕГЭ №${d.taskNum}` : 'От Команданте'}
                    </p>
                    <p className="text-[15px] font-black leading-tight text-[#F2F7FB]">{d.taskTitle ?? 'Обед из трёх блюд'}</p>
                    {/* что это за задание ЕГЭ — коротко, место справа от Мигеля */}
                    {d.taskNum && EGE_TASK_BLURB[d.taskNum] && (
                        <p className="mt-1 text-[12px] font-bold leading-snug text-[#9AA7B0]">
                            {EGE_TASK_BLURB[d.taskNum].text}
                            <span className="ml-1 whitespace-nowrap text-[#F2C35B]">· {EGE_TASK_BLURB[d.taskNum].points} {pointsWord(EGE_TASK_BLURB[d.taskNum].points)}</span>
                        </p>
                    )}
                </div>
                {/* отступ сверху — над уровнями висит язычок с колокольчиком */}
                <div className="mt-4"><ChestLevels setNumber={d.setNumber} /></div>
            </div>
            <div className="sm:col-start-2">
                {dish < 2 ? (d.preview && <SetPreviewCard p={d.preview} />)
                    : <p className="mt-2 text-sm font-bold leading-snug text-[#E8D9B8]">{shout(d, dish)}</p>}
            </div>
            {/* Блюда стоят на бархатной скатерти (public/set-tablecloth/cloth-1.webp, исходник Leonardo —
                docs/miguel/leonardo/tablecloth): ряд блюд — на гладкой середине стола, между розой сверху и вилкой снизу */}
            <div className="relative mx-auto mt-2 w-[min(70%,250px)] sm:col-start-1 sm:row-span-3 sm:row-start-1 sm:mt-0 sm:w-full sm:self-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={SET_TABLECLOTH} alt="" draggable={false} className="block w-full select-none" />
                <div className="absolute inset-x-[9%] top-[27%] flex h-[31%] items-center gap-1.5">
                {DISHES.map((name, i) => {
                    const ok = dish < 3 && i < dish, cur = i === dish, far = dish === 3 || i > dish
                    return (
                        <div key={i} className="relative flex min-w-0 flex-1 flex-col">
                            {cur && (
                                <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 1, repeat: Infinity }}
                                    className="absolute -top-3 left-0 right-0 z-10 mx-auto w-fit whitespace-nowrap rounded-full bg-[#F2C35B] px-1.5 text-[10px] font-black text-[#3A2A08]">{name}</motion.span>
                            )}
                            <div className="flex flex-col items-center gap-0.5 rounded-xl border-2 px-1 py-1.5 text-center"
                                style={{ borderColor: ok ? '#3D8A55' : cur ? GOLD : '#2A363C', background: ok ? '#163322E6' : cur ? '#2A2410E6' : '#0F171BD9' }}>
                                <span className={`relative text-3xl leading-none ${far ? 'opacity-35 grayscale' : ''}`} aria-label={name}>
                                    {SET_DISH_ICONS[i]}
                                    {ok && <Check className="absolute -bottom-1 -right-2 h-5 w-5 rounded-full bg-[#78C93C] p-0.5 text-[#16240C]" strokeWidth={4} />}
                                </span>
                                <span className="mt-0.5 line-clamp-2 text-[10px] font-bold leading-tight text-[#C9D3D9]">
                                    {i < 2 ? tiles[i].what : ''}
                                </span>
                                {i === 2 && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={LESSON_CASE_TIER_ICON[d.tier]} alt="" className={`h-7 w-7 ${cur ? 'animate-bounce' : far ? 'opacity-60' : ''}`} />
                                )}
                            </div>
                        </div>
                    )
                })}
                </div>
            </div>
            <div className="sm:col-start-2 sm:row-start-3 sm:self-end">
            <button onClick={go} disabled={busy}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-b-4 py-3 text-base font-black uppercase tracking-wide text-[#16240C] active:border-b-0"
                style={{ background: dish === 2 ? 'linear-gradient(180deg,#FFD84D,#F2C35B)' : GREEN, borderBottomColor: dish === 2 ? '#B8862E' : '#60A12F' }}>
                {GoIcon && <GoIcon className="h-5 w-5 shrink-0" strokeWidth={2.6} />}
                <span className="truncate">{label}</span>
            </button>
            <button onClick={onClose} className="mx-auto mt-1.5 flex items-center gap-1 px-3 py-1 text-xs font-black text-[#6B7A83]" aria-label="Свернуть">
                <ChevronDown className="h-4 w-4 rotate-180" />Свернуть
            </button>
            </div>
        </motion.div>
    )
}

function FreshStamp() {
    return (
        <motion.span initial={{ scale: 2.2, opacity: 0, rotate: -4 }} animate={{ scale: 1, opacity: 1, rotate: -12 }}
            transition={{ type: 'spring', stiffness: 520, damping: 14, delay: 0.25 }}
            className="ml-auto shrink-0 select-none rounded-md border-2 px-1.5 py-[1px] text-[11px] font-black italic leading-tight tracking-wider"
            style={{ color: '#7BE0B6', borderColor: '#5CC99F', background: '#5CC99F1F', boxShadow: 'inset 0 0 0 2px #0F171B, inset 0 0 0 3px #5CC99F88', textShadow: '0 0 6px #5CC99F66' }}>
            FRESH
        </motion.span>
    )
}

export function BarButton({ d, dish, onClick }: { d: SetBarData; dish: number; onClick: () => void }) {
    const eaten = dish === 2
    return (
        <button type="button" onClick={onClick}
            className="flex h-[44px] w-full items-center gap-2 rounded-xl border-2 pl-2.5 pr-[58px] shadow-lg shadow-black/40"
            style={{ borderColor: eaten ? '#B8862E' : '#2A363C', background: eaten ? 'linear-gradient(90deg,#3A2E0C,#1D1A0C)' : '#0F171B' }}>
            {/* Награды (блюда и сундук) — слева, текст — справа; язычок с колокольчиком — у правого края, под правый палец */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LESSON_CASE_TIER_ICON[d.tier]} alt="" className={`h-7 w-7 shrink-0 ${eaten ? 'animate-bounce' : ''}`} />
            {dish < 2 && (
                <span className="flex items-center gap-0.5 text-[19px] leading-none">
                    {SET_DISH_ICONS.map((f, i) => (
                        <span key={i} className={i < dish ? '' : i === dish ? 'animate-bounce' : 'opacity-30 grayscale'}>{f}</span>
                    ))}
                </span>
            )}
            {/* Штамп «FRESH» наискосок: сет свежий, его надо «выпить» сегодня — с размаху «ставится» при появлении */}
            {dish < 2 && <FreshStamp />}
            <span className={`min-w-0 truncate text-right ${dish < 2 ? '' : 'flex-1'} text-[13px] font-black text-[#F2F7FB]`}>
                {dish < 2 ? <>Сет дня <span className="text-[#F2C35B]">· <span className="hidden min-[400px]:inline">ЕГЭ </span>№{d.taskNum}</span></>
                    : dish === 2 ? <span className="text-[#FFE58A]">Всё съедено! Забрать сундук</span>
                        : 'Команданте накрыл стол 🍽'}
            </span>
        </button>
    )
}

// «Язычок» под полоской с колокольчиком уровня: тянешь вниз (или жмёшь) — панель выезжает, вверх — прячется
export function BellTongue({ n, open, onToggle }: { n: number; open: boolean; onToggle: (v: boolean) => void }) {
    const b = bellOf(n)
    const [pressed, setPressed] = useState(false)
    const timers = useRef<number[]>([])
    // «дзинь»: кнопка уходит вниз и возвращается; times — сколько раз подряд
    const ring = (times: number) => {
        timers.current.forEach(window.clearTimeout)
        timers.current = []
        for (let i = 0; i < times; i++) {
            timers.current.push(window.setTimeout(() => setPressed(true), i * 300))
            timers.current.push(window.setTimeout(() => setPressed(false), i * 300 + 150))
        }
    }
    // пока панель закрыта — колокольчик сам изредка звонит «дзинь-дзинь» (без звука), зовёт открыть
    useEffect(() => {
        if (open) return
        const id = window.setInterval(() => { if (document.visibilityState === 'visible') ring(2) }, 4200)
        return () => window.clearInterval(id)
    }, [open])
    useEffect(() => () => timers.current.forEach(window.clearTimeout), [])
    const onEnd = (_: unknown, info: PanInfo) => {
        if (info.offset.y > 24) onToggle(true)
        else if (info.offset.y < -24) onToggle(false)
    }
    return (
        <motion.button type="button" aria-label={open ? 'Свернуть сет' : 'Открыть сет'}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.5} onDragEnd={onEnd}
            onTap={() => { ring(1); playSound(SET_BELL_SOUND, SET_BELL_VOLUME); onToggle(!open) }}
            className="absolute right-1.5 top-0 z-20 flex h-[58px] w-[48px] touch-none flex-col items-center justify-center rounded-b-2xl rounded-t-xl border-2 border-t-0 bg-[#151F23] shadow-lg shadow-black/50"
            style={{ borderColor: `${b.color}AA` }}>
            <BellIcon n={n} size={36} pressed={pressed} />
            <ChevronDown className={`-mt-1 h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: b.color }} />
        </motion.button>
    )
}

export function SetBar({ data }: { data: SetBarData }) {
    const dish = setDishOf(data)
    const [sheet, setSheetRaw] = useState(false)
    const [closing, setClosing] = useState(false)
    const closeTimer = useRef<number | null>(null)
    const [compact, setCompact] = useState(false)
    const store = useSetBarStore()
    const setStore = store.set
    const lastY = useRef(0)
    const sheetRef = useRef(false)
    sheetRef.current = sheet
    useBell(data, dish)
    // открыли панель (в т.ч. из мини-значка в шапке) — полоска снова видна целиком
    const setSheet = (v: boolean) => {
        if (closeTimer.current) { window.clearTimeout(closeTimer.current); closeTimer.current = null }
        if (v) { setClosing(false); setSheetRaw(true); setCompact(false); setStore({ compact: false }); return }
        if (!sheetRef.current) return
        // сначала играем сворачивание, потом убираем панель
        setClosing(true)
        closeTimer.current = window.setTimeout(() => { setSheetRaw(false); setClosing(false); closeTimer.current = null }, 270)
    }

    // мини-значок в шапке телефона знает, какое блюдо и как открыть карточку
    useEffect(() => {
        setStore({ dish, chest: LESSON_CASE_TIER_ICON[data.tier], open: () => setSheet(true) })
        return () => setStore({ dish: null, open: null, compact: false })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dish, data.tier, setStore])

    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY
            const dy = y - lastY.current
            let c: boolean | null = null
            if (y < 40) c = false
            else if (dy > 6) c = true
            else if (dy < -6) c = false
            if (c !== null && !sheetRef.current) { setCompact(c); setStore({ compact: c }) }
            lastY.current = y
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [setStore])

    return (
        <>
            {/* телефон: полоска липнет под верхней шапкой (50px) вместе с шапкой страницы; листаешь вниз — уезжает под шапку.
                компьютер: стоит под кнопкой юнита, не прячется. */}
            <div className={`relative w-full pt-1.5 pb-3.5 lg:pb-3 lg:pt-0 lg:mt-2 transition-[transform,opacity] duration-300 lg:!translate-y-0 lg:!opacity-100 lg:!pointer-events-auto ${compact ? '-translate-y-[60px] opacity-0 pointer-events-none' : ''}`}>
                <div className="relative">
                    <BarButton d={data} dish={dish} onClick={() => setSheet(!(sheet && !closing))} />
                    <BellTongue n={data.setNumber} open={sheet && !closing} onToggle={setSheet} />
                    {sheet && <SetPanel d={data} dish={dish} closing={closing} onClose={() => setSheet(false)} />}
                </div>
            </div>
            {sheet && typeof document !== 'undefined' && createPortal(
                <button aria-label="Свернуть сет" onClick={() => setSheet(false)} className={`fixed inset-0 z-30 bg-black/45 transition-opacity duration-300 ${closing ? 'opacity-0' : 'opacity-100'}`} />,
                document.body,
            )}
        </>
    )
}
