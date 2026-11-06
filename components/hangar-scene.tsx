'use client'

// components/hangar-scene.tsx
//
// «Ангар» в «Моём пути»: задания 1–13 — предметы (сломано → на месте), 14–20 — детали ракеты.
// Решил раздел — у предмета появляется кнопка «Починить …», ученик сам жмёт и видит, как ангар меняется.
// Грязь стен/пола проявляется ступенями, хлам исчезает по одному — по числу починенного.
// Время суток — по часам ученика (оттенок поверх, предметы не перерисовываются).
// Картинки и координаты — docs/hangar/tools/build.py → public/hangar/, lib/hangarLayout.json; правки расстановки
// (слой, поворот, место) — из редактора /test-hangar-layout (проп layout, lib/hangarModel.ts). №11 — вентилятор.

import { useEffect, useLayoutEffect, useRef, useState, useTransition, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Check, Dumbbell, Lock, Star, LogOut, Rocket, Wrench, X } from 'lucide-react'
import { motion } from 'framer-motion'
import type { CatFoodStock } from '@/lib/catFood'
import { RepairIcon } from '@/components/repair-icon'
import Link from 'next/link'
import { L, JUNK, FAN_NUM, DECOR, CAT_DECOR, PORTRAIT_NUM, itemOf, place, placeStyle, hangarItemPic, hangarTarpPic, TARP_OF_ITEM, type LayoutOverrides } from '@/lib/hangarModel'
import { ItemBadge } from '@/components/learn-section-header'
import { HangarFan, FAN } from '@/components/hangar-fan'
import { HangarCat } from '@/components/hangar-cat'
import { HangarSky, HangarSpider, HangarHangingSpider, HangarBug, HangarPaper, ComputerFlicker, HangarMoon } from '@/components/hangar-life'
import { unveilHangarItem, fixHangarItem, claimHangarGold } from '@/actions/hangar'
import { openKeyCase } from '@/actions/open-key-case'
import { CaseReel } from '@/components/CaseReel'
import { getLessonCasePool } from '@/lib/caseRewards'
import { playSound, playJustClick, CASE_PRIZE_SOUND } from '@/lib/sound'
import { ZaNaukuArchive } from '@/components/za-nauku-archive'
import { HangarQuotesButton } from '@/components/hangar-quotes-info'
import { pickHangarJoke } from '@/lib/hangarJokes'
import Confetti from 'react-confetti'
import { pickShortJoke, ZN_RUBRIC_TITLE, znSource, type ZnJoke } from '@/lib/zaNauku'

export type SceneItem = {
    num: number; title: string; state: 'broken' | 'ready' | 'fixed'; progress: number; href: string | null
    tasks?: { solved: number; target: number; full?: number }
    trainers?: { title: string; percent: number }[]
    locked?: boolean // «под брезентом»: сначала тренажёры к заданию
    canUnveil?: boolean // тренажёры начаты: ученик может снять брезент сам
    mastered?: boolean // золото: раздел решён весь, тренажёры на золоте
    goldClaimed?: boolean // кейс за золото уже открыт
}

// По номеру ЗАДАНИЯ: что делаем с его предметом (кнопка «Починить»). Фразы предметов — lib/hangarJokes.ts.
// Какой предмет у задания — ITEM_OF_TASK (lib/hangarModel.ts).
const FIX_LABEL: Record<number, string> = {
    1: 'Поставить стремянку', 2: 'Поднять флаг отряда', 3: 'Собрать инструменты в ящик', 4: 'Включить робота', 5: 'Распутать провода',
    6: 'Развесить ключи по местам', 7: 'Починить компьютер Мигеля', 8: 'Зажечь лампу над Фейнманом', 9: 'Зарядить шуруповёрт',
    10: 'Запустить генератор', 11: 'Починить вентилятор', 12: 'Повесить огнетушитель', 13: 'Поднять бочку с топливом',
}
// Что откроется после починки (рядом с шуткой в окне задания)
const UNLOCK_HINT: Record<number, string> = {
    7: 'В компьютере откроется архив физтех-шуток из газеты «За науку»',
    4: 'Робот будет рассказывать физтех-шутки из газеты «За науку»',
}
const ARCHIVE_ITEM = 7 // компьютер
const ROBOT_ITEM = 13 // робот (бывший «автомат»)
const ROCKET_STEP = ['Поставить опоры', 'Поставить сопло', 'Надеть обшивку', 'Прикрутить стабилизаторы', 'Пристегнуть баки', 'Покрасить звезду', 'Надеть нос']
const WALL = new Set([2, 6, 8]) // id предметов на стене (стенд с ключами, флаг, лампа)
const pct = (v: number) => `${(v / 1024) * 100}%`

type Time = 'day' | 'evening' | 'night'
const TIME_TINT: Record<Time, string> = {
    day: 'transparent',
    // обычная прозрачная заливка, а не mix-blend multiply: смешивание поверх всей сцены с живыми анимациями
    // заставляло iPhone пересчитывать весь ангар каждый кадр и подвешивало страницу
    evening: 'linear-gradient(180deg, rgba(190,85,45,0.2), rgba(90,30,70,0.22))',
    night: 'linear-gradient(180deg, rgba(8,14,42,0.55), rgba(6,10,30,0.48))',
}
const timeOf = (h: number): Time => (h >= 7 && h < 18 ? 'day' : h >= 18 && h < 21 ? 'evening' : 'night')

// Значок задания — жёлтая плашка с номером (как номер задания на карточке юнита /trainer), без ключика и подложки.
// Раздел решён — плашка подпрыгивает. Наводишь или жмёшь — предмет, который починится, подсвечивается;
// по нажатию — окошко «Перейти в задачник».
function KeyBadge({ x, y, n, ready, active, locked = false, label, onHover, onOpen }: { x: number; y: number; n: number; ready: boolean; active: boolean; locked?: boolean; label?: string; onHover: (n: number | null) => void; onOpen: (n: number) => void }) {
    return (
        <span className="absolute -translate-x-1/2 -translate-y-[12px]" style={{ left: pct(x), top: pct(y), zIndex: 1150 }}>
            <button type="button" aria-label={`Задание №${n}`}
                onMouseEnter={() => onHover(n)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(n)} onBlur={() => onHover(null)}
                onClick={() => onOpen(n)}
                className={`relative flex min-h-[clamp(18px,4.4cqw,27px)] min-w-[clamp(18px,4.4cqw,27px)] flex-col items-center justify-center rounded-[7px] px-1 text-[clamp(11px,2.7cqw,15px)] font-black leading-none transition-transform active:scale-90 ${label ? 'py-1' : ''} ${ready ? 'animate-bounce' : ''}`}
                style={{ background: 'linear-gradient(180deg,#FFE58A,#F2C35B)', color: '#3A2A08',
                    boxShadow: active ? '0 2px 0 #B8862E, 0 0 0 2px #FFF4C2, 0 0 10px 2px rgba(242,195,91,.8)' : '0 2px 0 #B8862E, 0 2px 6px rgba(0,0,0,.45)' }}>
                {n}
                {label?.split(' ').map((w) => <span key={w} className="mt-0.5 block text-[clamp(8px,1.8cqw,10px)] leading-[1.05]">{w}</span>)}
            </button>
        </span>
    )
}

/** Лоток пульта: кнопки заданий 14–20 в гнёздах (картинка Leonardo public/hangar/ui/rocket-tray.webp,
 *  исходник — docs/hangar/leonardo/ui-rocket-tray.png). Координаты гнёзд и таблички — в % картинки 1175×449.
 *  Замок — тренажёры не пройдены, галочка — сделано, звезда — золото ждёт кейс. */
const TRAY_SOCKETS: [number, number][] = [[11.32, 18.98], [22.98, 30.72], [35.15, 42.89], [47.06, 54.81], [58.98, 66.72], [70.81, 78.55], [82.55, 90.21]]
const TRAY_SOCKET_Y: [number, number] = [39.42, 65.26]
function RocketTray({ parts, lit, onHover, onPick, onClose }: { parts: SceneItem[]; lit: (n: number) => boolean; onHover: (n: number | null) => void; onPick: (n: number) => void; onClose: () => void }) {
    return (
        <div className="relative mx-auto w-full max-w-[560px] select-none" style={{ aspectRatio: '1175 / 449', containerType: 'inline-size' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hangar/ui/rocket-tray.webp" alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full" />
            <span className="pointer-events-none absolute flex items-center justify-center font-black uppercase leading-none text-[#3B3A30]"
                style={{ left: '32%', width: '34.8%', top: '10.7%', height: '9.4%', fontSize: '2.7cqw', letterSpacing: '0.08em', whiteSpace: 'nowrap', textShadow: '0 1px 0 rgba(255,255,255,.55)' }}>
                Вторая часть ЕГЭ
            </span>
            {/* «Убрать» — на самой плашке справа от таблички (кнопка в углу ангара перекрывала кнопку 20) */}
            <button type="button" onClick={onClose} aria-label="Убрать лоток"
                className="absolute flex items-center justify-center gap-[0.6cqw] rounded-[1cqw] border-b-4 border-[#1E2629] bg-[#2A3338] font-black leading-none text-[#E6EDF1] active:border-b-0"
                style={{ left: '71%', width: '17%', top: '8.5%', height: '13%', fontSize: '2.6cqw' }}>
                <X className="h-[1em] w-[1em]" strokeWidth={3} />Убрать
            </button>
            {parts.slice(0, 7).map((i, k) => {
                const [l, r] = TRAY_SOCKETS[k]
                const done = i.state === 'fixed'
                const gold = done && !!i.mastered && !i.goldClaimed
                const look = done
                    ? { background: 'linear-gradient(180deg,#9BE07A,#5FA84A)', color: '#173A0F', borderBottomColor: '#3E7A2E' }
                    : { background: 'linear-gradient(180deg,#FFE58A,#F2C35B)', color: '#3A2A08', borderBottomColor: '#B8862E' }
                const padX = (r - l) * 0.12
                const padY = (TRAY_SOCKET_Y[1] - TRAY_SOCKET_Y[0]) * 0.1
                return (
                    <button key={i.num} type="button" aria-label={`Задание №${i.num}`} disabled={done && !gold}
                        onClick={() => onPick(i.num)} onPointerEnter={(e) => { if (e.pointerType === 'mouse') onHover(i.num) }} onPointerLeave={() => onHover(null)}
                        className={`absolute flex flex-col items-center justify-center rounded-[1.2cqw] border-b-4 font-black leading-none active:border-b-0 disabled:cursor-default`}
                        style={{ ...look, left: `${l + padX}%`, width: `${r - l - 2 * padX}%`, top: `${TRAY_SOCKET_Y[0] + padY}%`, height: `${TRAY_SOCKET_Y[1] - TRAY_SOCKET_Y[0] - 2 * padY}%`,
                            fontSize: '3.6cqw', boxShadow: lit(i.num) ? '0 0 0 2px #FFF4C2, 0 0 10px 2px rgba(242,195,91,.8)' : undefined }}>
                        {done && !gold && <Check className="h-[0.8em] w-[0.8em]" strokeWidth={3.5} />}
                        {gold && <Star className="h-[0.8em] w-[0.8em]" fill="#3A2A08" />}
                        {i.num}
                    </button>
                )
            })}
        </div>
    )
}

/** Подсветка предмета, который починится: яркий золотой контур по форме картинки (drop-shadow) и заметно светлее.
 *  Вечером и ночью подсвеченный предмет ещё и поднимается над затемнением (litZ) — иначе его почти не видно. */
const HIGHLIGHT = 'drop-shadow(0 0 2px #FFFBE6) drop-shadow(0 0 5px #FFE58A) drop-shadow(0 0 12px #FFD84D) drop-shadow(0 0 24px #F2C35B) brightness(1.4) saturate(1.15)'
// для вентилятора — полегче: два слоя тени вместо четырёх (он тонкий, большой размытый ореол не нужен)
const FAN_GLOW = 'drop-shadow(0 0 3px #FFE58A) drop-shadow(0 0 10px #F2C35B) brightness(1.5)'
// Тень предмета на полу — по его собственному силуэту, прижатая к нему (drop-shadow на картинке). Раньше под предметом
// рисовался отдельный размытый овал, он оказывался ниже предмета, и вещи будто парили над полом (шуруповёрт).
export const FLOOR_SHADOW = 'drop-shadow(1px 3px 2px rgba(20,10,8,0.5))'
// золотой предмет: тёплый ореол по силуэту (статично — без пересчёта на каждом кадре)
const GOLD_SHINE = 'drop-shadow(0 0 3px #FFE58A) drop-shadow(0 0 9px rgba(255,200,60,.75)) brightness(1.08) saturate(1.1)'
const LIT_Z = 1104 // выше затемнения времени суток (1100), ниже звёзд и луны (1105)

export type HangarTime = Time

/**
 * onFix / time / decorFixed — для тестовой страницы /test-hangar: починка без сервера, своё время суток,
 * состояние портрета вручную. В приложении не передаются.
 */
export function HangarScene({ items: itemsProp, layout, onFix, time: forcedTime, decorFixed, bare = false, onClose, onGoTask, catStage = 0, catFridgeFixed = false, catName = null, onCatHome, catFood, catDemo, cornerRight, cornerTop, phoneReserve = 116 }: {
    /** плашка в правом верхнем углу ангара (серия на /learn) */
    cornerRight?: React.ReactNode
    cornerTop?: React.ReactNode // сверху по центру поверх картинки (полоска «Сета» на /learn); тогда ключ и cornerRight — столбиком слева под ней
    /** телефон: сколько px высоты экрана оставить под шапку и пульт (ангар = экран минус это) */
    phoneReserve?: number
    catFood?: CatFoodStock
    catDemo?: 'barrel' | 'sbox'
    items: SceneItem[]; layout?: LayoutOverrides | null; onFix?: (num: number) => void; time?: Time; decorFixed?: boolean
    /** Только сама картинка ангара — без заголовка и подсказок снизу (превью на /learn). */
    bare?: boolean
    /** Крестик в шапке (окно ангара на /learn). */
    onClose?: () => void
    /** «Перейти в раздел N» внутри задачника: закрыть окно ангара и раскрыть раздел (иначе — ссылка на /learn?task=N). */
    onGoTask?: (num: number) => void
    /** Котик: 0 нет, 1 мяукает у ворот, 2 живёт на картонке (user_progress.cat_stage). */
    catStage?: number
    /** Холодильник котика починен. */
    catFridgeFixed?: boolean
    /** Имя котика. */
    catName?: string | null
    /** Тестовая страница: котик приручён без сервера. */
    onCatHome?: () => void
}) {
    const router = useRouter()
    const [pending, start] = useTransition()
    // Снятый только что брезент: предмет открыт сразу, пока сервер обновляет страницу; flying — брезент ещё улетает
    const [unveiledNow, setUnveiledNow] = useState<number[]>([])
    const [flying, setFlying] = useState<number | null>(null)
    const [party, setParty] = useState(0)
    const items = unveiledNow.length ? itemsProp.map((i) => (unveiledNow.includes(i.num) ? { ...i, locked: false, canUnveil: false } : i)) : itemsProp
    const [justFixed, setJustFixed] = useState<number | null>(null)
    const [time, setTime] = useState<Time>('day')
    const [hover, setHover] = useState<number | null>(null)
    const [openNum, setOpenNum] = useState<number | null>(null)
    // подсветка предмета; под брезентом — не подсвечиваем: что там, пока секрет
    const lit = (n: number) => (hover === n || openNum === n) && !items.find((i) => i.num === n)?.locked
    // Плашка задания появляется на середине зума (зум 1,1 с → через 0,55 с) — не сразу и без долгого ожидания; закрывается сразу.
    const ZOOM_MS = 550
    const [panelNum, setPanelNum] = useState<number | null>(null)
    const [panelJoke, setPanelJoke] = useState('') // случайная фраза предмета, выбирается при открытии плашки
    // середина ангара по горизонтали в пикселях экрана — по ней центрируется плашка на компьютере
    const [panelX, setPanelX] = useState<number | null>(null)
    // на компьютере плашка — в body: страница задачника обёрнута анимацией (transform), и fixed внутри неё
    // считался бы от колонки, а не от экрана (плашка уезжала вправо)
    const [isLg, setIsLg] = useState(false)
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)')
        const on = () => setIsLg(mq.matches)
        on(); mq.addEventListener('change', on)
        return () => mq.removeEventListener('change', on)
    }, [])
    const [archiveOpen, setArchiveOpen] = useState(false)
    const [robotJoke, setRobotJoke] = useState<{ joke: ZnJoke; key: number } | null>(null)
    useEffect(() => {
        if (!robotJoke) return
        const t = setTimeout(() => setRobotJoke(null), Math.min(18000, Math.max(8000, robotJoke.joke.text.length * 110)))
        return () => clearTimeout(t)
    }, [robotJoke])
    const robotSay = () => setRobotJoke({ joke: pickShortJoke(), key: Date.now() })
    useEffect(() => {
        setPanelNum(null)
        // закрыли плашку — снимаем «наведение»: на телефоне касание наводит и не снимает его (подсветка залипала)
        if (openNum === null) { setHover(null); trayGuard.current.closed = Date.now(); setTrayOpen(false); return }
        const t = setTimeout(() => { setPanelJoke(pickHangarJoke(openNum)); setPanelNum(openNum) }, ZOOM_MS)
        return () => clearTimeout(t)
    }, [openNum])
    useEffect(() => { setTime(forcedTime ?? timeOf(new Date().getHours())) }, [forcedTime])

    const byNum = new Map(items.map((i) => [i.num, i]))
    const room = items.filter((i) => i.num <= 13)
    const rocketParts = items.filter((i) => i.num >= 14)
    const stage = rocketParts.filter((i) => i.state === 'fixed').length
    const fixedCount = items.filter((i) => i.state === 'fixed').length
    const goldCount = items.filter((i) => i.mastered).length
    // золото, за которое ещё не забран кейс — у такого предмета прыгает звёздочка
    const goldWaiting = (i?: SceneItem | null) => !!i?.mastered && !i.goldClaimed
    const rocketGold = rocketParts.find(goldWaiting)
    const dirt = [1, 0.75, 0.5, 0.25, 0][Math.min(4, Math.floor(fixedCount / 4))]
    const junkLeft = Math.max(0, JUNK.length - Math.round((fixedCount * JUNK.length) / 16))
    const lampOn = byNum.get(8)?.state === 'fixed'
    const RS = L.rocket[Math.min(7, stage)]
    const R = { ...RS, ...place(layout, stage >= 7 ? 'a' : 'b', 'rocket', RS) }
    const fan = byNum.get(FAN_NUM)
    // стол с компьютером (№7) — котик лежит под ним; картинка без задней ножки (public/hangar/07-*-front.webp)
    const deskDone = byNum.get(7)?.state === 'fixed'
    const deskId = itemOf(7)
    // лежащая бочка (задание №13 ещё не починено) — котик любит залезать на неё греться
    const barrelId = itemOf(13)
    const barrelP = byNum.get(13)?.state !== 'fixed' && L[barrelId] ? place(layout, 'b', `${barrelId}`, L[barrelId].b) : null
    const desk = deskId === 7 ? { src: `/hangar/07-${deskDone ? 'after' : 'before'}-front.webp`, p: place(layout, deskDone ? 'a' : 'b', '7', L[7][deskDone ? 'a' : 'b']) } : null
    const decorDone = decorFixed ?? (PORTRAIT_NUM !== null && byNum.get(PORTRAIT_NUM)?.state === 'fixed')
    const decorState = decorDone ? 'a' : 'b'
    const lampP = place(layout, decorState, 'lamp', DECOR[1][decorState])
    const readyRocket = rocketParts.find((i) => i.state === 'ready')
    const nextRocket = readyRocket ?? rocketParts.find((i) => i.state !== 'fixed')
    const ready = [...room.filter((i) => i.state === 'ready'), ...(readyRocket ? [readyRocket] : [])]

    // Задания 14–20 — не значками на ракете (закрывали атмосферу), а на выезжающем лотке: нажал ракету (или красную
    // кнопку пульта) — снизу выезжает лоток с кнопками 14…20, нажал ещё раз — уезжает обратно.
    const [trayOpen, setTrayOpen] = useState(false)
    // открыли боковое меню на телефоне — лоток «Вторая часть» уезжает
    useEffect(() => {
        const close = () => setTrayOpen(false)
        window.addEventListener('mobile-sidebar-open', close)
        return () => window.removeEventListener('mobile-sidebar-open', close)
    }, [])
    // На телефоне касание иногда срабатывает дважды, а после закрытия плашки крестиком «долетает» до того, что под пальцем
    // (часто — ракета). Тогда лоток тихо переключался, и следующее нажатие на ракету его закрывало, а не открывало.
    // Поэтому: повторы в пределах 400 мс и нажатия сразу после закрытия плашки игнорируем.
    const trayGuard = useRef({ toggled: 0, closed: 0 })
    const toggleTray = () => {
        const now = Date.now()
        if (now - trayGuard.current.toggled < 400 || now - trayGuard.current.closed < 500) return
        trayGuard.current.toggled = now
        playJustClick()
        setTrayOpen((v) => !v)
    }
    const fixed = (num: number) => { setJustFixed(num); playSound(CASE_PRIZE_SOUND); setTimeout(() => setJustFixed(null), 1500) }
    // золотой предмет: получить ключ редкого кейса и сразу открыть барабан
    const [goldKey, setGoldKey] = useState<number | null>(null)
    const [goldError, setGoldError] = useState<string | null>(null)
    const claimGold = (num: number) => {
        if (onFix) { setOpenNum(null); return } // тестовая страница — без сервера
        setGoldError(null)
        start(async () => {
            const r = await claimHangarGold(num)
            if (r.keyId) { setOpenNum(null); setGoldKey(r.keyId) } else setGoldError(r.error ?? 'Не получилось')
        })
    }
    const unveil = (num: number) => {
        const show = () => {
            setFlying(num)
            setUnveiledNow((l) => [...l, num])
            fixed(num)
            setParty((p) => p + 1)
            setTimeout(() => setFlying(null), 1200)
        }
        if (onFix) { show(); return }
        start(async () => {
            const r = await unveilHangarItem(num)
            if (r.ok) { show(); setTimeout(() => router.refresh(), 1300) }
        })
    }
    const fix = (num: number) => {
        if (onFix) { onFix(num); fixed(num); return }
        start(async () => {
            const r = await fixHangarItem(num)
            if (r.ok) { fixed(num); router.refresh() }
        })
    }
    const openItem = openNum !== null ? byNum.get(openNum) ?? null : null
    const panelItem = panelNum !== null && panelNum === openNum ? byNum.get(panelNum) ?? null : null
    // Точка, к которой приближается картинка при выборе задания (в пикселях картинки 1024×1024).
    const focusOf = (num: number): { x: number; y: number } => {
        if (num >= 14) return { x: R.x, y: R.y - R.h / 2 }
        if (num === FAN_NUM) return { x: FAN.x, y: FAN.top + FAN.motorH }
        const it = byNum.get(num)
        const st = it?.state === 'fixed' ? 'a' : 'b'
        const sl = L[itemOf(num)]?.[st]
        if (!sl) return { x: 512, y: 512 }
        const p = place(layout, st, `${itemOf(num)}`, sl)
        const c = { x: p.x, y: p.y - p.h / 2 }
        if (num !== PORTRAIT_NUM) return c
        // лампа чинится вместе с портретом — приближаемся к середине между ними
        const pp = place(layout, decorState, 'portrait', DECOR[0][decorState])
        return { x: (c.x + pp.x) / 2, y: (c.y + pp.y - pp.h / 2) / 2 }
    }
    const focus = openNum !== null ? focusOf(openNum) : null
    // Крупный ангар на телефоне: квадрат картинки не по ширине экрана, а по высоте (~62% экрана) — предметы
    // в полтора раза крупнее, картинку листаем вбок пальцем. На компьютере (и в превью) — квадрат по ширине.
    const frameRef = useRef<HTMLDivElement>(null)
    const [frame, setFrame] = useState<{ w: number; s: number } | null>(null)
    // при первом замере и смене размера — встаём по центру картинки
    useEffect(() => { if (frame && frameRef.current) frameRef.current.scrollLeft = (frame.s - frame.w) / 2 }, [frame])
    useLayoutEffect(() => {
        if (bare) return
        const el = frameRef.current
        if (!el) return
        const measure = () => {
            // ширину берём у внешнего блока (рамка на компьютере сужается под квадрат) минус рамка 2+2 px
            const w = (el.parentElement?.parentElement?.clientWidth ?? el.clientWidth + 4) - 4
            // компьютер: квадрат не выше экрана — нижний край виден целиком без прокрутки страницы
            // телефон: ангар во всю высоту экрана, снизу остаётся место только под кнопки (влево · к ракете · вправо)
            const s = w < 480 ? Math.max(w, Math.round(Math.min(window.innerHeight - phoneReserve, 900))) : Math.min(w, Math.max(360, window.innerHeight - 40))
            setFrame((prev) => {
                if (prev && prev.w === w && prev.s === s) return prev
                return { w, s }
            })
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el.parentElement?.parentElement ?? el)
        window.addEventListener('resize', measure)
        return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
    }, [bare, phoneReserve])
    const scrollMode = !!frame && frame.s > frame.w
    // тени-фильтры у ~40 предметов — только на компьютере; телефону это слишком тяжело (подвисания на iPhone)
    const floorShadow = scrollMode ? undefined : FLOOR_SHADOW
    // можно ли ещё листать влево/вправо (стрелки под ангаром гаснут у края)
    const [edge, setEdge] = useState({ l: true, r: true })
    const onFrameScroll = () => {
        const el = frameRef.current
        if (!el) return
        const l = el.scrollLeft > 4
        const r = el.scrollLeft < el.scrollWidth - el.clientWidth - 4
        setEdge((e) => (e.l === l && e.r === r ? e : { l, r }))
    }
    useEffect(() => { onFrameScroll() }, [frame]) // eslint-disable-line react-hooks/exhaustive-deps
    // своя плавная прокрутка (разгон-торможение) + страховка в конце: scroll-behavior smooth не везде срабатывает
    const slide = (dir: -1 | 1) => {
        const el = frameRef.current
        if (el) scrollToX(el.scrollLeft + dir * (frame ? frame.w * 0.6 : 200))
    }
    // кнопка с ракетой: встать ракетой в центр экрана
    const centerRocket = () => { if (frame) scrollToX((R.x / 1024) * frame.s - frame.w / 2) }
    const scrollToX = (x: number) => {
        const el = frameRef.current
        if (!el) return
        const from = el.scrollLeft
        const to = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, x))
        const t0 = performance.now()
        const D = 420
        const step = (now: number) => {
            const k = Math.min(1, (now - t0) / D)
            el.scrollLeft = from + (to - from) * (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2)
            if (k < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
        setTimeout(() => { el.scrollLeft = to }, D + 80)
    }
    // где была прокрутка в момент выбора задания (зум считается относительно видимой части)
    const [zoomFrom, setZoomFrom] = useState(0)
    const ZOOM = scrollMode ? 1.8 : 2.2
    // Приближение с предметом в центре кадра: масштаб от левого верхнего угла + сдвиг так, чтобы точка предмета
    // встала в середину видимой части; сдвиг ограничен, чтобы за краем картинки не было пустоты.
    const zoomTransform = (() => {
        if (!focus) return 'translate(0px, 0px) scale(1)'
        const S = frame?.s ?? 1024
        const vw = Math.min(frame?.w ?? S, S) // видимая ширина: на компьютере рамка сужена под квадрат
        const fx = (focus.x / 1024) * S
        const fy = (focus.y / 1024) * S
        const tx = Math.min(zoomFrom, Math.max(zoomFrom + vw - ZOOM * S, zoomFrom + vw / 2 - ZOOM * fx))
        const ty = Math.min(0, Math.max(S - ZOOM * S, (scrollMode ? S * 0.3 : S / 2) - ZOOM * fy))
        return `translate(${tx}px, ${ty}px) scale(${ZOOM})`
    })()
    // открыть окошко задания: по ключику или по самому предмету (если он ещё не починен)
    const openTask = (num: number) => {
        const it = byNum.get(num)
        if (it?.state === 'fixed' && !goldWaiting(it)) return
        setZoomFrom(frameRef.current?.scrollLeft ?? 0)
        setOpenNum(num)
        const fr = frameRef.current?.getBoundingClientRect()
        if (fr) setPanelX(Math.round(fr.left + fr.width / 2))
        // большой ангар на компьютере выше экрана: ставим его серединой в кадр (предмет после зума — в центре квадрата)
        const el = frameRef.current
        if (el && el.getBoundingClientRect().height > window.innerHeight * 0.9) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
    // раздел задачника под брезентом нажали в списке — открываем его предмет здесь (шаг «Тренажёры»)
    const openTaskRef = useRef(openTask)
    openTaskRef.current = openTask
    useEffect(() => {
        if (bare) return
        const on = (e: Event) => openTaskRef.current(Number((e as CustomEvent).detail))
        window.addEventListener('hangar-open', on)
        return () => window.removeEventListener('hangar-open', on)
    }, [bare])
    // подсветка + вечером/ночью подъём над затемнением
    // keepZ — подсветить, но не поднимать над затемнением: предмет стоит за вещами котика (генератор №10 за холодильником)
    // и, поднявшись, оказался бы перед ними
    const catDecorP = catStage >= 2 ? [place(layout, catFridgeFixed ? 'a' : 'b', 'cat-fridge', CAT_DECOR[0][catFridgeFixed ? 'a' : 'b']), place(layout, 'a', 'cat-box', CAT_DECOR[1].a)] : []
    // всё, что стоит на полу: предметы заданий в текущем состоянии, ракета, вещи котика. Подсвеченный предмет вечером/ночью
    // не поднимаем над затемнением, если перед ним (z больше) что-то стоит и перекрывает его — иначе он вылезет поверх
    // (бочка №13 поверх предмета №10)
    const occluders = [
        ...catDecorP, R,
        ...room.filter((i) => i.num !== FAN_NUM).map((i) => {
            const st = i.state === 'fixed' ? 'a' : 'b'
            const id = itemOf(i.num)
            return place(layout, st, `${id}`, L[id][st])
        }),
    ]
    const behindCatDecor = (p: { x: number; y: number; w: number; h: number; z: number }) => occluders.some((d) =>
        d !== p && d.z > p.z && Math.abs(d.x - p.x) < (d.w + p.w) / 2 && p.y > d.y - d.h && p.y - p.h < d.y)
    const litStyle = (on: boolean, keepZ = false): React.CSSProperties => ({
        ...(on ? { filter: HIGHLIGHT } : {}), transition: 'filter .25s',
        ...(on && time !== 'day' && !keepZ ? { zIndex: LIT_Z } : {}),
    })
    const inBody = (el: ReactNode) => (isLg && !scrollMode ? createPortal(el, document.body) : el)
    const label = (i: SceneItem) => (i.num >= 14 ? ROCKET_STEP[Math.min(6, stage)] : FIX_LABEL[i.num] ?? 'Починить')

    return (
        <div className={`relative ${bare || scrollMode ? '' : 'mt-6 lg:mt-0'}`}>
            <style>{`@keyframes hangar-pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.1);opacity:1}100%{transform:scale(1)}}`}</style>
            {/* ключ «N/20» и «Выйти» — плашками поверх картинки, вне прокручиваемой рамки (не уезжают при листании) */}
            <div className="relative mx-auto" style={{ width: frame && frame.s < frame.w ? frame.s : '100%' }}>
            {!bare && cornerTop && (
                <div className="absolute left-2 right-2 top-1" style={{ zIndex: 1250 }}>{cornerTop}</div>
            )}
            {!bare && (
                <div className={`pointer-events-none absolute left-2.5 flex flex-col items-start gap-1.5 ${cornerTop ? 'top-[58px]' : 'top-2.5'}`} style={{ zIndex: 1200 }}>
                    <span className="flex items-center gap-1.5 rounded-xl border-2 border-[#4A3A14] bg-[#151F23]/90 px-2.5 py-1 text-sm font-black text-[#F2E3C2] shadow-lg" title="Починено">
                    <RepairIcon className="h-4 w-4 text-[#F2C35B]" />{fixedCount}/20
                    {goldCount > 0 && <span className="ml-1 flex items-center gap-0.5 text-[#FFD84D]"><Star className="h-4 w-4" fill="#FFD84D" />{goldCount}</span>}
                </span>
                    {cornerTop && !onClose && cornerRight && <div className="pointer-events-auto">{cornerRight}</div>}
                </div>
            )}
            {!bare && !onClose && !cornerTop && cornerRight && (
                <div className="absolute right-2.5 top-2.5" style={{ zIndex: 1200 }}>{cornerRight}</div>
            )}
            {!bare && onClose && (
                <button type="button" onClick={onClose}
                    className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-xl border-2 border-b-4 border-[#2A363C] bg-[#161F23]/95 px-3 py-1.5 text-sm font-black text-[#E6EDF1] shadow-lg active:border-b-0"
                    style={{ zIndex: 1200 }}>
                    <LogOut className="h-4 w-4" />Выйти
                </button>
            )}
            <div ref={frameRef} onScroll={onFrameScroll}
                className={`hangar-frame relative w-full ${scrollMode ? '' : 'rounded-2xl'} ${scrollMode && !openItem ? 'overflow-x-auto overflow-y-hidden' : 'overflow-hidden'} ${frame ? '' : 'aspect-square'}`}
                style={frame ? { height: frame.s } : undefined}>
            <div className="relative overflow-hidden" style={frame ? { width: frame.s, height: frame.s, containerType: 'inline-size' } : { position: 'absolute', inset: 0, containerType: 'inline-size' }}>
                {/* все слои сцены — в одной обёртке: при выборе задания она плавно приближается к предмету */}
                <div className="absolute inset-0"
                    style={{ transform: zoomTransform, transformOrigin: '0 0', transition: 'transform 1.1s cubic-bezier(.45,0,.2,1)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/hangar/bg.webp" alt="" className="absolute inset-0 h-full w-full" draggable={false} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/hangar/bg-dirty.webp" alt="" className="absolute inset-0 h-full w-full transition-opacity duration-1000" style={{ opacity: dirt }} draggable={false} />
                {/* небо в окне живёт: облака, птицы, кукурузник с транспарантом (под всеми предметами) */}
                <HangarSky time={time} />
                {/* пока бардак — по балке бегает паучок, по полу жучок, на сквозняке кружит листок */}
                {junkLeft > 0 && <><HangarSpider /><HangarHangingSpider /><HangarBug /><HangarPaper /><HangarPaper second /></>}
                {JUNK.map((jp, j) => {
                    const p = place(layout, 'b', jp.key, jp)
                    return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={jp.key} src={jp.src} alt="" draggable={false} className="absolute select-none transition-[opacity,transform] duration-700"
                            style={{ ...placeStyle(p), filter: floorShadow, opacity: j < junkLeft ? 1 : 0, transform: j < junkLeft ? 'scale(1)' : 'scale(0.3)' }} />
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
                            style={{ ...placeStyle(p), ...litStyle(PORTRAIT_NUM !== null && !decorDone && lit(PORTRAIT_NUM)) }} />
                    )
                })}
                {decorDone && (
                    // тёплый конус света от лампы на портрет
                    <div className="pointer-events-none absolute"
                        style={{ left: pct(lampP.x - lampP.w * 1.1), top: pct(lampP.y - lampP.h * 0.2), width: pct(lampP.w * 2.2), height: pct(lampP.h * 5.5), zIndex: Math.round(lampP.z * 10) + 11,
                            background: 'radial-gradient(ellipse 50% 60% at 50% 0%, rgba(255,214,140,0.32), transparent 75%)' }} />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img key={R.src} src={R.src} alt="Ракета" title={bare ? undefined : 'Задания 14–20 — нажми на ракету'} draggable={false} className={`absolute select-none ${bare ? '' : 'cursor-pointer'}`}
                    onClick={() => { if (!bare) toggleTray() }}
                    style={{ ...placeStyle(R), filter: floorShadow, ...litStyle(rocketParts.some((i) => i.state !== 'fixed' && lit(i.num))), animation: justFixed && justFixed >= 14 ? 'hangar-pop .6s ease-out' : undefined }} />
                <HangarCat stage={catStage} layout={layout} desk={desk} barrel={barrelP} fridgeFixed={catFridgeFixed} catName={catName} catFood={catFood} demo={catDemo} bare={bare} night={time === 'night'} onHome={onCatHome} />
                {rocketGold && !bare && <GoldBadge x={R.x} y={R.y - R.h * 0.62} onOpen={() => openTask(rocketGold.num)} />}
                {room.filter((i) => i.num !== FAN_NUM).map((i) => {
                    const done = i.state === 'fixed'
                    const id = itemOf(i.num) // картинка предмета этого задания
                    const sl = done ? L[id].a : L[id].b
                    const p = { ...sl, ...place(layout, done ? 'a' : 'b', `${id}`, sl) }
                    const onWall = WALL.has(id) && !(id === 6 && !done)
                    return (
                        <div key={i.num}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img key={p.src} src={p.src} alt={i.title} draggable={false} className={`absolute select-none ${!done || (!bare && (id === ARCHIVE_ITEM || id === ROBOT_ITEM)) ? 'cursor-pointer' : ''}`}
                                onClick={() => {
                                    if (done && !bare && id === ARCHIVE_ITEM) setArchiveOpen(true)
                                    else if (done && !bare && id === ROBOT_ITEM) robotSay()
                                    else openTask(i.num)
                                }}
                                onMouseEnter={() => { if (!done) setHover(i.num) }} onMouseLeave={() => setHover(null)}
                                style={{ ...placeStyle(p), ...litStyle(!done && lit(i.num), behindCatDecor(p)), ...(!onWall && !(!done && lit(i.num)) && floorShadow ? { filter: floorShadow } : {}), ...(i.mastered ? { filter: GOLD_SHINE } : {}), animation: justFixed === i.num ? 'hangar-pop .6s ease-out' : undefined }} />
                            {id === 7 && !done && !i.locked && <ComputerFlicker style={placeStyle(p)} />}
                            {((i.locked && !done) || flying === i.num) && <Tarp item={id} shadow={floorShadow} flying={flying === i.num} style={placeStyle(p)} onClick={() => openTask(i.num)} onHover={(on) => setHover(on ? i.num : null)} />}
                            {!done && !bare && <KeyBadge x={id === 5 && !done ? p.x - p.w * 0.32 : p.x} y={p.y - p.h - 14} n={i.num} ready={i.state === 'ready' || !!i.canUnveil} locked={!!i.locked && !i.canUnveil} label={i.canUnveil ? 'Снять брезент' : undefined} active={lit(i.num)} onHover={setHover} onOpen={openTask} />}
                            {done && !bare && goldWaiting(i) && <GoldBadge x={p.x} y={p.y - p.h - 14} onOpen={() => openTask(i.num)} />}
                            {done && !bare && (id === ARCHIVE_ITEM || id === ROBOT_ITEM) && !(id === ROBOT_ITEM && robotJoke) && !goldWaiting(i) && (
                                <FunBadge x={p.x} y={p.y - p.h - 6} label={id === ARCHIVE_ITEM ? 'Читать' : 'Шутка'}
                                    onClick={() => (id === ARCHIVE_ITEM ? setArchiveOpen(true) : robotSay())} />
                            )}
                            {id === ROBOT_ITEM && robotJoke && (
                                <RobotBubble key={robotJoke.key} x={p.x} y={p.y - p.h - 4} joke={robotJoke.joke} onClose={() => setRobotJoke(null)} />
                            )}
                        </div>
                    )
                })}
                {fan && (
                    // подсветка — не фильтром на весь слой (он размером со всю картинку и пересчитывался на каждом кадре
                    // покачивания — лагало), а внутри вентилятора на моторчике и лопастях, покачивание на это время замирает
                    <div className="pointer-events-none absolute inset-0" style={{ zIndex: fan.state !== 'fixed' && lit(FAN_NUM) && time !== 'day' ? LIT_Z : 900, animation: justFixed === FAN_NUM ? 'hangar-pop .6s ease-out' : undefined }}>
                        <HangarFan broken={fan.state !== 'fixed'} glow={fan.state !== 'fixed' && lit(FAN_NUM) ? FAN_GLOW : undefined} />
                    </div>
                )}
                {fan && fan.state !== 'fixed' && !bare && (
                    // сломанный вентилятор — тоже можно навести и нажать (сам слой вентилятора нажатия пропускает)
                    <button type="button" aria-label="Задание №11" className="absolute cursor-pointer"
                        style={{ left: pct(FAN.x - FAN.bladesD / 2), top: pct(FAN.top), width: pct(FAN.bladesD), height: pct(FAN.motorH + 70), zIndex: 905 }}
                        onMouseEnter={() => setHover(FAN_NUM)} onMouseLeave={() => setHover(null)} onClick={() => openTask(FAN_NUM)} />
                )}
                {fan && goldWaiting(fan) && !bare && <GoldBadge x={FAN.x} y={FAN.top + FAN.motorH + 46} onOpen={() => openTask(FAN_NUM)} />}
                {fan && fan.state !== 'fixed' && !bare && <KeyBadge x={FAN.x} y={FAN.top + FAN.motorH + 46} n={FAN_NUM} ready={fan.state === 'ready' || !!fan.canUnveil} locked={!!fan.locked && !fan.canUnveil} label={fan.canUnveil ? 'Снять брезент' : undefined} active={lit(FAN_NUM)} onHover={setHover} onOpen={openTask} />}
                <div className="pointer-events-none absolute inset-0 transition-[background] duration-700" style={{ background: TIME_TINT[time], zIndex: 1100 }} />
                {time === 'night' && <HangarMoon cutout={R.rot ? undefined : { src: R.src, x: R.x, y: R.y, w: R.w, h: R.h }} />}
                <div className="pointer-events-none absolute rounded-full transition-opacity duration-700"
                    style={{ left: pct(232 - 170), top: pct(415 - 170), width: pct(340), height: pct(340), opacity: lampOn ? (time === 'day' ? 0.55 : 0.9) : 0, background: 'radial-gradient(closest-side, rgba(255,200,110,0.4), transparent)', zIndex: 1101 }} />
                </div>
                {openItem && (
                    // клик мимо предмета — закрыть (картинка отъезжает обратно)
                    <button type="button" aria-label="Закрыть" className="absolute inset-0 cursor-default bg-black/15" style={{ zIndex: 1190 }} onClick={() => setOpenNum(null)} />
                )}
            </div>
            </div>
            {!bare && !openItem && !trayOpen && (
                // откуда фразы на предметах: над кнопкой «Вторая часть», на телефоне её нет — просто в углу
                <HangarQuotesButton className={`absolute right-3 ${scrollMode ? 'bottom-3' : 'bottom-[60px]'}`} />
            )}
            {!bare && !scrollMode && !openItem && !trayOpen && (
                // компьютер: пульта нет — отдельная кнопка в правом нижнем углу открывает лоток 14–20 (нажатие на ракету тоже работает)
                <button type="button" onClick={toggleTray}
                    className="absolute bottom-3 right-3 flex items-center gap-2 rounded-xl border-2 border-b-4 border-[#1E2629] bg-[#3A454B] px-3 py-2 text-sm font-black text-[#E6EDF1] shadow-lg active:border-b-0"
                    style={{ zIndex: 1260 }}>
                    <Rocket className="h-4 w-4 text-[#FF6B5E]" />
                    Вторая часть
                </button>
            )}
            {!bare && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden" style={{ zIndex: 1250 }}>
                    {/* выезжает не целиком: над краем видна только часть до гнёзд (нижние 26% с полозьями остаются внизу) */}
                    {/* без AnimatePresence (в проекте не всегда доигрывает уход) — лоток всегда в DOM, едет вверх/вниз */}
                    <div className={trayOpen && !openItem ? 'pointer-events-auto' : ''}
                        style={{ transform: `translateY(${trayOpen && !openItem ? '26%' : '105%'})`, transition: 'transform .32s cubic-bezier(.2,.9,.3,1.1)' }}>
                        <RocketTray parts={rocketParts} lit={lit} onHover={setHover}
                            onPick={(n) => { setTrayOpen(false); setHover(null); openTask(n) }} onClose={toggleTray} />
                    </div>
                </div>
            )}
            </div>

            {scrollMode && !openItem && (
                // пульт с тремя кнопками: листать влево / к ракете / вправо (картинки Leonardo, public/hangar/ui)
                <HangarControlPanel canLeft={edge.l} canRight={edge.r} onLeft={() => slide(-1)} onRocket={() => { centerRocket(); toggleTray() }} onRight={() => slide(1)} />
            )}
            {party > 0 && createPortal(
                <div className="pointer-events-none fixed inset-0 z-[3000]">
                    <Confetti key={party} width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={260} />
                </div>, document.body)}
            {!bare && panelItem && inBody((
                // Плашка задания — под картинкой, чтобы не закрывать ангар; на компьютере ангар большой и выше экрана —
                // там плашка висит внизу экрана поверх (центрирование — на обёртке, анимация — на самой плашке)
                // Телефон (ангар листается): плашка поверх нижней части ангара, предмет при зуме уезжает в верхнюю треть.
                // Компьютер: висит внизу экрана по центру самого ангара (panelX — середина рамки).
                <div className={scrollMode ? 'absolute inset-x-2 bottom-2' : 'lg:pointer-events-none lg:fixed lg:bottom-5 lg:z-[1300] lg:w-[min(540px,calc(100vw-32px))] lg:-translate-x-1/2'}
                    style={scrollMode ? { zIndex: 1300 } : panelX !== null ? { left: panelX } : undefined}>
                <div className={`${scrollMode ? '' : 'mt-3'} rounded-2xl border-2 border-[#4A3A14] bg-[#151F23] p-3.5 shadow-xl lg:pointer-events-auto lg:mt-0 lg:w-full`} style={{ animation: 'hangar-pop .35s ease-out' }}>
                    <div className="flex items-start gap-2">
                        {/* под брезентом предмет не показываем; круг — чтобы тёмные предметы читались на тёмной плашке */}
                        <ItemBadge size={48} pic={panelItem.locked ? hangarTarpPic(panelItem.num) : hangarItemPic(panelItem.num, panelItem.state === 'fixed')} />
                        <span className="min-w-0 flex-1 text-lg font-black leading-tight text-[#F2F7FB]">Раздел {panelItem.num} — {panelItem.title}</span>
                        <button type="button" aria-label="Закрыть" onClick={() => setOpenNum(null)} className="-mr-1 -mt-1 rounded-lg p-1 text-[#9AA7B0] hover:text-white"><X className="h-5 w-5" /></button>
                    </div>
                    <p className="mt-2 text-base font-bold leading-snug text-[#E8D9B8]">{panelItem.canUnveil ? 'Тренажёр взят, боец! Тяни брезент, посмотрим, что там' : panelItem.locked ? 'Под брезентом что-то спрятано… Пройди тренажёр и узнаешь, что там' : panelJoke}</p>
                    {!panelItem.locked && UNLOCK_HINT[panelItem.num] && <p className="mt-1.5 text-sm font-bold leading-snug text-[#9EE8B0]">{UNLOCK_HINT[panelItem.num]}</p>}
                    {panelItem.state === 'fixed' ? (
                        <GoldClaim error={goldError} pending={pending} onClaim={() => claimGold(panelItem.num)} />
                    ) : (
                        <TaskSteps item={panelItem} fixLabel={label(panelItem)} pending={pending} onUnveil={() => unveil(panelItem.num)}
                            onFix={() => { setOpenNum(null); fix(panelItem.num) }}
                            onGo={onGoTask ? () => { setOpenNum(null); onGoTask(panelItem.num) } : undefined} />
                    )}
                </div>
                </div>
            ))}
            {bare || openItem ? null : ready.length > 0 ? (
                <div className="mt-3 space-y-2">
                    <p className="text-center text-sm font-black text-[#F2C35B]">Раздел решён — наводи порядок!</p>
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
            ) : null}
            {archiveOpen && <ZaNaukuArchive onClose={() => setArchiveOpen(false)} />}
            {goldKey !== null && createPortal(
                <div className="fixed inset-0 z-[3000] overflow-y-auto bg-[#131D22]">
                    <CaseReel isMega tier="rare" pool={getLessonCasePool('rare')} spinAction={() => openKeyCase(goldKey)}
                        onDone={() => { setGoldKey(null); router.refresh() }} />
                </div>,
                document.body,
            )}
        </div>
    )
}

// Кнопочка над починенным компьютером/роботом: «Читать» / «Шутка»
function FunBadge({ x, y, label, onClick }: { x: number; y: number; label: string; onClick: () => void }) {
    return (
        <button type="button" onClick={onClick}
            className="absolute -translate-x-1/2 -translate-y-full rounded-full border-2 border-[#3D8A55] bg-[#163322]/90 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#9EE8B0] shadow-[0_0_10px_rgba(120,220,150,0.45)]"
            style={{ left: pct(x), top: pct(y), zIndex: 1150 }}>
            {label}
        </button>
    )
}

// Облачко робота с шуткой из «За науку» — над его головой
function RobotBubble({ x, y, joke, onClose }: { x: number; y: number; joke: ZnJoke; onClose: () => void }) {
    // Центрирование (translate) — на внешней обёртке, анимация появления (scale) — на самом облачке:
    // если оба на одном элементе, анимация затирает translate и облачко сначала стоит правее, а потом прыгает на место.
    return (
        <div className="absolute w-[66%] -translate-x-1/2 -translate-y-full" style={{ left: pct(Math.min(Math.max(x, 345), 679)), top: pct(y), zIndex: 1180 }}>
            <button type="button" onClick={onClose}
                className="block w-full rounded-xl border-2 border-[#3D8A55] bg-[#10231A]/95 px-3 py-2 text-left shadow-xl"
                style={{ animation: 'hangar-pop .35s ease-out', transformOrigin: '50% 100%' }}>
                <span className="block text-[10px] font-black uppercase tracking-wide text-[#9EE8B0] sm:text-[11px]">{ZN_RUBRIC_TITLE[joke.rubric]}</span>
                <span className="mt-0.5 block text-sm font-bold leading-snug text-[#E9F7EE] sm:text-[15px]">{joke.text}</span>
                <span className="mt-1 block text-[10px] font-bold text-[#7FA48B]">{znSource(joke)}</span>
            </button>
        </div>
    )
}

// Пульт под ангаром на телефоне (Leonardo: docs/hangar/leonardo/ui-panel2-*.png). Планка с пустыми гнёздами —
// panel2-plate (на всю ширину, своя пропорция 1170×275), колпачки вырезаны из картинки с кнопками и стоят ровно в гнёздах
// (координаты — % планки). Стрелка датчика стёрта с картинки и рисуется кодом: в покое чуть подрагивает, при нажатии
// кнопки взлетает вверх и плавно, с перелётом, возвращается (пружина — разгон и торможение как у настоящей стрелки).
// Нажатие кнопки: колпачок утапливается в гнездо (вниз, меньше, темнее), зелёная лампочка над ней вспыхивает.
const PANEL_CAPS = {
    left: { src: '/hangar/ui/cap2-left.webp', left: 6.5, top: 18.55, w: 12.82, h: 54.55 },
    rocket: { src: '/hangar/ui/cap2-rocket.webp', left: 46.5, top: 17.09, w: 12.99, h: 55.27 },
    right: { src: '/hangar/ui/cap2-right.webp', left: 80.34, top: 18.55, w: 12.82, h: 54.55 },
}
const PANEL_LAMPS = { left: 23.68, right: 76.32 } // центры зелёных лампочек по x, y — 17.09%
const GAUGE = { x: 32.26, y: 53.82, w: 5.13, h: 21.82 } // ось стрелки и квадрат вокруг неё (60×60 точек планки)
const NEEDLE_REST = -28 // градусы от вертикали: в покое стрелка слева, красная зона справа (~+50)
function HangarControlPanel({ canLeft, canRight, onLeft, onRocket, onRight }: { canLeft: boolean; canRight: boolean; onLeft: () => void; onRocket: () => void; onRight: () => void }) {
    const [flash, setFlash] = useState<{ k: 'left' | 'right'; n: number } | null>(null)
    const [needle, setNeedle] = useState({ a: NEEDLE_REST, kick: false })
    const backTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    // в покое стрелка изредка чуть гуляет — «прибор живой»
    useEffect(() => {
        const t = setInterval(() => setNeedle((n) => (n.kick ? n : { a: NEEDLE_REST + (Math.random() * 14 - 7), kick: false })), 3500)
        return () => clearInterval(t)
    }, [])
    useEffect(() => () => { if (backTimer.current) clearTimeout(backTimer.current) }, [])
    const press = (k: keyof typeof PANEL_CAPS) => {
        playJustClick()
        setFlash({ k: k === 'right' ? 'right' : 'left', n: Date.now() })
        if (k === 'left') onLeft(); else if (k === 'right') onRight(); else onRocket()
        if (k === 'rocket') setTimeout(() => setFlash({ k: 'right', n: Date.now() }), 120)
        // стрелка взлетает (ракета — до красной зоны), потом возвращается
        setNeedle({ a: k === 'rocket' ? 52 : 18 + Math.random() * 16, kick: true })
        if (backTimer.current) clearTimeout(backTimer.current)
        backTimer.current = setTimeout(() => setNeedle({ a: NEEDLE_REST, kick: false }), k === 'rocket' ? 900 : 550)
    }
    const on = { left: canLeft, rocket: true, right: canRight }
    const label = { left: 'Листать ангар влево', rocket: 'К ракете', right: 'Листать ангар вправо' }
    return (
        <div className="relative mt-2 w-full select-none" style={{ aspectRatio: '1170 / 275' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hangar/ui/panel2-plate.webp" alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full" />
            <motion.div className="pointer-events-none absolute"
                style={{ left: `${GAUGE.x - GAUGE.w / 2}%`, top: `${GAUGE.y - GAUGE.h / 2}%`, width: `${GAUGE.w}%`, height: `${GAUGE.h}%` }}
                animate={{ rotate: needle.a }}
                transition={needle.kick ? { type: 'spring', stiffness: 260, damping: 11 } : { type: 'spring', stiffness: 34, damping: 8 }}>
                <svg viewBox="-30 -30 60 60" className="h-full w-full overflow-visible">
                    <line x1={0} y1={8} x2={0} y2={-21} stroke="#2B2522" strokeWidth={3.4} strokeLinecap="round" />
                    <circle r={4.6} fill="#2B2522" />
                    <circle r={1.8} fill="#DDD8B1" />
                </svg>
            </motion.div>
            {flash && (
                <span key={flash.n} className="pointer-events-none absolute h-[15%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ left: `${PANEL_LAMPS[flash.k]}%`, top: '17.09%', aspectRatio: '1', background: 'radial-gradient(closest-side, #E8FFB0, #6BE05A 55%, transparent)', animation: 'panel-lamp .5s ease-out forwards' }} />
            )}
            {(Object.keys(PANEL_CAPS) as (keyof typeof PANEL_CAPS)[]).map((k) => {
                const c = PANEL_CAPS[k]
                return (
                    <button key={k} type="button" aria-label={label[k]} disabled={!on[k]} onClick={() => press(k)}
                        className="group absolute disabled:cursor-default"
                        style={{ left: `${c.left}%`, top: `${c.top}%`, width: `${c.w}%`, height: `${c.h}%` }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.src} alt="" draggable={false}
                            className="pointer-events-none h-full w-full transition-[transform,filter] duration-75 group-active:translate-y-[7%] group-active:scale-[0.94] group-active:brightness-[0.82] group-disabled:opacity-40 group-disabled:grayscale group-disabled:group-active:translate-y-0 group-disabled:group-active:scale-100" />
                    </button>
                )
            })}
            <style>{`@keyframes panel-lamp{0%{opacity:0;transform:translate(-50%,-50%) scale(.6)}25%{opacity:1;transform:translate(-50%,-50%) scale(1.5)}100%{opacity:0;transform:translate(-50%,-50%) scale(1)}}`}</style>
        </div>
    )
}

// Брезент поверх предмета, к которому ещё не пройдены тренажёры: картинки Leonardo (public/hangar/tarp-*.webp,
// исходники docs/hangar/leonardo/tarp-*), у каждого предмета свой по форме (TARP_OF_ITEM), растянут по размеру предмета.
// Красная трафаретная звезда запечена в картинки (docs/hangar/tools/bake_tarp_stars.py, без звезды — docs/hangar/tarp-nostar/):
// раньше рисовалась SVG-фильтром feTurbulence, и на iPhone приближение к предмету подвешивало страницу. Замок — только у номера.
function Tarp({ item, style, shadow, flying = false, onClick, onHover }: { item: number; style: React.CSSProperties; shadow?: string; flying?: boolean; onClick: () => void; onHover: (on: boolean) => void }) {
    const z = typeof style.zIndex === 'number' ? style.zIndex + 1 : 20
    const kind = TARP_OF_ITEM[item] ?? 'square'
    return (
        <button type="button" aria-label="Под брезентом — сначала тренажёры" onClick={onClick}
            onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}
            className={`absolute cursor-pointer ${flying ? 'hangar-tarp-off' : ''}`} style={{ ...style, zIndex: flying ? 1099 : z, scale: '1.12', filter: flying ? undefined : shadow }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/hangar/tarp-${kind}.webp`} alt="" draggable={false} className="hangar-tarp-rustle absolute inset-0 h-full w-full select-none"
                style={{ objectFit: 'fill', animationDelay: `${-((item * 1.7) % 7)}s` }} />
        </button>
    )
}

// Плашка задания: три шага — «Тренажёры → Задачи → Починить». Каждый шаг со своей кнопкой.
function TaskSteps({ item, fixLabel, pending, onFix, onGo, onUnveil }: { item: SceneItem; fixLabel: string; pending: boolean; onFix: () => void; onGo?: () => void; onUnveil: () => void }) {
    const trainers = item.trainers ?? []
    const tDone = trainers.filter((t) => t.percent >= 50).length // на серебре — нужно для починки
    const nextTrainer = trainers.find((t) => t.percent < 50) ?? trainers[0]
    const tasks = item.tasks ?? { solved: 0, target: 0 }
    const fixed = item.state === 'fixed'
    const trainerOk = trainers.length === 0 || tDone >= trainers.length
    const tasksOk = item.state !== 'broken'
    const btn = 'flex w-full items-center justify-center gap-1 rounded-xl border-b-4 px-1.5 py-2 text-center text-[13px] font-black leading-tight active:border-b-0'
    const step = (n: number, active: boolean, done: boolean) =>
        `relative flex min-w-0 flex-1 flex-col gap-1.5 rounded-xl border-2 p-2 ${done ? 'border-[#3D8A55] bg-[#163322]/60' : active ? 'border-[#F2C35B] bg-[#2A2410]/70' : 'border-[#2A363C] bg-[#0F171B]/70'}`
    // «① Тренажёры 0/1» — одной строкой
    const head = (n: number, title: string, done: boolean, count: string) => (
        <span className="flex min-w-0 items-center gap-1.5 text-sm font-black text-[#C9D3D9]">
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${done ? 'bg-[#3D8A55] text-white' : 'bg-[#26333B] text-[#C9D3D9]'}`}>
                {done ? <Check className="h-3 w-3" strokeWidth={3.5} /> : n}
            </span>
            <span className="truncate">{title}</span>
            <span className="ml-auto shrink-0 text-[#F2F7FB]">{count}</span>
        </span>
    )
    const goTasks = (
        <Link href={`/learn?task=${item.num}`} onClick={(e) => { if (onGo) { e.preventDefault(); onGo() } }}
            className={`${btn.replace("gap-1", "gap-2")} text-[#0F171B]`} style={{ background: '#53ADEF', borderBottomColor: '#3A85BC' }}>
            Го к задачам<TaskChain filled={tasks.target > 0 ? Math.round((Math.min(tasks.solved, tasks.target) / tasks.target) * 3) : 0} />
        </Link>
    )
    return (
        <>
        <div className="mt-3 flex gap-1.5">
            {trainers.length > 0 && (
                <div className={step(1, !trainerOk, trainerOk)}>
                    {head(1, 'Тренажёры', trainerOk, `${tDone}/${trainers.length}`)}
                    {nextTrainer && (
                        <Link href={`/trainer?topic=${encodeURIComponent(nextTrainer.title)}`}
                            className={`${btn} mt-auto text-[#16240C]`} style={{ background: '#78C93C', borderBottomColor: '#60A12F' }}>
                            <Dumbbell className="h-4 w-4 shrink-0" />{trainerOk ? 'Повторить' : 'Пройти'}
                        </Link>
                    )}
                </div>
            )}
            <div className={step(2, trainerOk && !tasksOk, tasksOk)}>
                {head(trainers.length > 0 ? 2 : 1, 'Задачи', tasksOk, tasks.target > 0 ? `${Math.min(tasks.solved, tasks.target)}/${tasks.target}` : '—')}
                {item.canUnveil ? (
                    // прыгает обёртка: у самой кнопки transform занят нажатием
                    <span className="mt-auto animate-bounce">
                        <button type="button" disabled={pending} onClick={onUnveil} className={`${btn} text-[#3A2A08]`}
                            style={{ background: 'linear-gradient(180deg,#FFE58A,#F2C35B)', borderBottomColor: '#B8862E' }}>
                            Снять брезент!
                        </button>
                    </span>
                ) : item.locked ? (
                    // брезент откроется после тренажёра: здесь нажимать нечего, действие — зелёная кнопка «Пройти» слева
                    <span aria-disabled className="mt-auto flex w-full cursor-not-allowed items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-center text-[13px] font-black leading-tight text-[#6B7A83]" style={{ background: '#1B252A' }}>
                        <Lock className="h-3.5 w-3.5 shrink-0" />Снять брезент
                    </span>
                ) : <span className="mt-auto">{goTasks}</span>}
            </div>
        </div>
        {item.canUnveil ? null : item.locked ? (
            <p className="mt-2 text-sm font-bold leading-snug text-[#F2C35B]">
                🔒 Чтобы снять брезент и открыть задачи — {trainers.length > 1 ? 'пройди хотя бы 1 урок в каждом тренажёре' : 'пройди хотя бы 1 урок тренажёра'}
            </p>
        ) : item.state === 'broken' && (
            <p className="mt-2 text-xs font-bold text-[#8A98A0]">
                Чтобы починить: {trainers.length > 0 ? 'тренажёры на серебро' : ''}{trainers.length > 0 && tasks.target > 0 ? ' и ' : ''}{tasks.target > 0 ? `${tasks.target} задач` : ''}
            </p>
        )}
        {/* раздел решён — появляется кнопка починить */}
        {item.state === 'ready' && (
            <button type="button" disabled={pending} onClick={onFix}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-b-4 px-3 py-2.5 text-sm font-black text-[#151F24] active:border-b-0 disabled:opacity-60"
                style={{ background: 'linear-gradient(180deg,#FFD84D,#F2C35B)', borderBottomColor: '#B8862E' }}>
                <Wrench className="h-4 w-4 shrink-0" />{fixLabel}
            </button>
        )}
        </>
    )
}

// Цепочка кружочков, как уроки в задачнике: сколько залито — столько задач до починки уже решено (из трёх частей).
function TaskChain({ filled }: { filled: number }) {
    return (
        <span className="flex shrink-0 items-center" aria-hidden>
            {[0, 1, 2].map((k) => (
                <span key={k} className="flex items-center">
                    {k > 0 && <span className="h-1 w-2.5" style={{ background: k <= filled ? '#F2F7FB' : '#1F4F72' }} />}
                    <span className="h-5 w-5 rounded-full border-2 border-b-[3px]"
                        style={k < filled ? { background: '#F2F7FB', borderColor: '#F2F7FB', borderBottomColor: '#9FB4C2' } : { background: '#2F6E9C', borderColor: '#1F4F72', borderBottomColor: '#173C57' }} />
                </span>
            ))}
        </span>
    )
}

// Звёздочка над золотым предметом, за который ещё не забран кейс
function GoldBadge({ x, y, onOpen }: { x: number; y: number; onOpen: () => void }) {
    return (
        <span className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pct(x), top: pct(y), zIndex: 1150 }}>
            <button type="button" aria-label="Золото — забрать кейс" onClick={onOpen}
                className="flex h-[clamp(20px,5cqw,30px)] w-[clamp(20px,5cqw,30px)] animate-bounce items-center justify-center rounded-full active:scale-90"
                style={{ background: 'radial-gradient(circle at 40% 35%, #FFF4C2, #F2C35B 60%, #B8862E)', boxShadow: '0 0 12px 3px rgba(255,216,77,.7)' }}>
                <Star className="h-[60%] w-[60%] text-[#7A4E0C]" fill="#7A4E0C" />
            </button>
        </span>
    )
}

// Плашка золотого предмета: раздел решён целиком и тренажёры на золоте — забрать редкий кейс
function GoldClaim({ pending, error, onClaim }: { pending: boolean; error: string | null; onClaim: () => void }) {
    return (
        <div className="mt-3">
            <p className="flex items-center gap-1.5 text-sm font-black text-[#FFD84D]"><Star className="h-4 w-4" fill="#FFD84D" />Золото! Раздел решён целиком, тренажёры на золоте</p>
            <button type="button" disabled={pending} onClick={onClaim}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-b-4 px-3 py-2.5 text-sm font-black text-[#151F24] active:border-b-0 disabled:opacity-60"
                style={{ background: 'linear-gradient(180deg,#FFE58A,#F2C35B)', borderBottomColor: '#B8862E' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/chests/rare0001.svg" alt="" className="h-5 w-5" />Забрать редкий кейс
            </button>
            {error && <p className="mt-1.5 text-xs font-bold text-[#FFB4A8]">{error}</p>}
        </div>
    )
}
