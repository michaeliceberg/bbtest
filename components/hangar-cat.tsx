'use client'

// components/hangar-cat.tsx
//
// Рыжий котик в ангаре (user_progress.cat_stage).
// 1 — выглядывает из-за левой стойки ворот и мяукает «Мяу?». Нажали — «Погладить» или «Подманить колбаской»,
//     котик выходит, бежит по полу к картонке и садится там (сервер: bringCatHome, cat_stage 1 → 2).
// 2 — живёт на коробке: сидит и моргает, иногда мяукает или жмурится с улыбкой («котику хорошо»); ночью спит
//     клубком; по нажатию мурчит. Кадры моргания — Leonardo (kitten-closed-eyes-1/2), выровнены по cat-sit; у закрытых
//     глаз рот подменён ртом из cat-sit, вариант с улыбкой — эмоция happy.
// Картинки — public/hangar/life/cat-*.webp (Leonardo, исходники docs/hangar/leonardo/cat-*.png), все в одном масштабе:
// размер позы в сцене = исходный размер (CAT_PX) × масштаб глубины. Координаты сцены — 1024×1024, точка = низ по центру.

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CAT_DECOR, depthZIndex, place, placeStyle, type LayoutOverrides, type Place } from '@/lib/hangarModel'
import Lottie from '@/components/lottie-player'
import LottieGems from '@/public/Lottie/LottieGems.json'
import { useRouter } from 'next/navigation'
import { bringCatHome, fixCatFridge, setCatName } from '@/actions/cat'
import { checkCatName, CAT_NAME_MAX } from '@/lib/catName'
import { useAchievementUnlockStore } from '@/store/use-achievement-unlock-store'
import { playSound, playJustClick, CASE_PRIZE_SOUND } from '@/lib/sound'

type Pose = 'happy' | 'peek' | 'walk-1' | 'walk-2' | 'meow' | 'pet' | 'sniff' | 'sleep' | 'sit' | 'sit-half' | 'sit-closed' | 'sit-shy'

// Размер позы в исходных пикселях (обрезка по картинке, до уменьшения).
const CAT_PX: Record<Pose, [number, number]> = {
    peek: [536, 651], 'walk-1': [767, 659], 'walk-2': [767, 659], meow: [648, 750], pet: [611, 764], sniff: [632, 727],
    sleep: [672, 453], happy: [626, 755], sit: [626, 755], 'sit-half': [626, 755], 'sit-closed': [626, 755], 'sit-shy': [627, 635],
}
const src = (p: Pose) => `/hangar/life/cat-${p}.webp`

// Точки сцены: у правой стойки ворот (далеко — мельче; слева от ворот стоит бочка) и картонка на полу перед ракетой.
// Котик выглядывает из-за стойки справа и бежит к картонке влево — все картинки отражены (нарисованы «вправо»).
const GATE = { x: 660, y: 660, k: 0.13 }
const BED_K = 0.13
const DEFAULT_BED = { x: 548, y: 852, k: BED_K } // по умолчанию; настоящее место — от коробки (bedOf)
const PATH = [GATE, { x: 640, y: 710, k: 0.112 }, { x: 595, y: 780, k: 0.12 }, DEFAULT_BED]
const WALK_S = 3.4
// Днём котик иногда гуляет по ангару: уходит к одной из точек пола, сидит там и возвращается на коробку.
const STROLL_SPOTS = [{ x: 440, y: 882 }, { x: 702, y: 888 }, { x: 612, y: 726 }, { x: 505, y: 958 }]
const kAt = (y: number) => Math.min(0.15, Math.max(0.1, 0.105 + ((y - 660) * (BED_K - 0.105)) / (852 - 660)))
const STROLL_SPEED = 85 // точек сцены в секунду
const pct = (v: number) => `${(v / 1024) * 100}%`

function box(pose: Pose, at: { x: number; y: number; k: number }) {
    const [w, h] = CAT_PX[pose]
    return { left: pct(at.x - (w * at.k) / 2), top: pct(at.y - h * at.k), width: pct(w * at.k), height: pct(h * at.k) }
}

/** Моргание сидящего котика: открыты → полуприкрыты → закрыты → обратно, раз в 3–6 с, иногда дважды. */
function useBlink(active: boolean): Pose {
    const [pose, setPose] = useState<Pose>('sit')
    useEffect(() => {
        if (!active) return
        let alive = true
        const timers: ReturnType<typeof setTimeout>[] = []
        const at = (ms: number, p: Pose) => timers.push(setTimeout(() => alive && setPose(p), ms))
        const loop = () => {
            const wait = 3000 + Math.random() * 3000
            const twice = Math.random() < 0.25
            at(wait, 'sit-half'); at(wait + 70, 'sit-closed'); at(wait + 160, 'sit-half'); at(wait + 230, 'sit')
            if (twice) { at(wait + 380, 'sit-half'); at(wait + 450, 'sit-closed'); at(wait + 540, 'sit-half'); at(wait + 610, 'sit') }
            timers.push(setTimeout(() => alive && loop(), wait + (twice ? 700 : 300)))
        }
        loop()
        return () => { alive = false; timers.forEach(clearTimeout) }
    }, [active])
    return pose
}

/** Все позы лежат друг на друге, видна одна — смена позы без загрузки и мигания. */
function CatImg({ pose, poses, flip }: { pose: Pose; poses: Pose[]; flip?: boolean }) {
    return (
        <>
            {poses.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p} src={src(p)} alt="" draggable={false}
                    className="pointer-events-none absolute inset-0 h-full w-full select-none"
                    style={{ opacity: p === pose ? 1 : 0, transform: flip ? 'scaleX(-1)' : undefined }} />
            ))}
        </>
    )
}

function Bubble({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
    return (
        <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-full" style={{ left: pct(x), top: pct(y), zIndex: 1160 }}>
            <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 14 }}
                className="whitespace-nowrap rounded-2xl border-2 border-[#5A3A22] bg-[#FFF6E4] px-2.5 py-1 text-[3.2cqw] font-black leading-none text-[#5A3A22] shadow-md sm:text-[2.6cqw]">
                {children}
            </motion.div>
        </div>
    )
}

/** Сердечки поднимаются над котиком. */
function Hearts({ x, y }: { x: number; y: number }) {
    return (
        <div className="pointer-events-none absolute" style={{ left: pct(x), top: pct(y), zIndex: 1160 }}>
            {[0, 1, 2, 3].map((i) => (
                <motion.span key={i} className="absolute text-[3.4cqw]" style={{ left: `${(i - 1.5) * 2.2}cqw` }}
                    initial={{ y: 0, opacity: 0, scale: 0.5 }} animate={{ y: '-7cqw', opacity: [0, 1, 0], scale: 1.1 }}
                    transition={{ duration: 1.3, delay: i * 0.18, ease: 'easeOut' }}>❤️</motion.span>
            ))}
        </div>
    )
}

/** Коробка, на которой живёт котик (Leonardo, docs/hangar/leonardo/cat-cardboard.png): котик сидит на её крышке. */
// Место коробки и холодильника — из редактора /test-hangar-layout (CAT_DECOR в lib/hangarModel.ts); котик сидит на крышке.
// слой элемента в CSS (как placeStyle) и центр окошка, зажатый так, чтобы окошко (до ~50% ширины) не вылезало за край ангара
const zOf = (p: Place) => Math.round(p.z * 10) + 10
const panelX = (x: number) => Math.min(Math.max(x, 262), 762)
const bedOf = (b: Place) => ({ x: b.x - 6, y: b.y - 52, k: BED_K * (b.w / 150) })
function Cardboard({ p }: { p: Place }) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/hangar/life/cat-cardboard.webp" alt="" draggable={false} className="pointer-events-none absolute select-none"
            style={placeStyle(p)} />
    )
}

/** Мини-холодильник котика рядом с коробкой (Leonardo, cat-fridge). Сначала он сломан — чинится за FRIDGE_COST рубинов
 *  (actions/cat.ts fixCatFridge, user_progress.cat_fridge_fixed). Сломанный — cat-fridge-broken.webp. На пустой бумажке починенного — подпись кодом (потом имя котика).
 *  Бумажка на картинке: 66–92% по ширине, 37–56% по высоте. */
export const FRIDGE_COST = 25 // рубинов (gems) — на жёлтой кнопке розовый рубин читается лучше монет
function Fridge({ p, fixed, onClick, justFixed }: { p: Place; fixed: boolean; onClick?: () => void; justFixed?: boolean }) {
    return (
        <button type="button" disabled={!onClick} onClick={onClick} aria-label={fixed ? 'Холодильник котика' : 'Сломанный холодильник'}
            className={`absolute select-none ${onClick ? 'cursor-pointer' : 'pointer-events-none'}`}
            style={{ ...placeStyle(p), animation: justFixed ? 'hangar-pop .6s ease-out' : undefined }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fixed ? '/hangar/life/cat-fridge.webp' : '/hangar/life/cat-fridge-broken.webp'} alt="" draggable={false} className="absolute inset-0 h-full w-full" />
            {fixed && (
                // на бумажке — мордочка котика простым карандашом (как ребёнок нарисовал)
                <svg className="absolute" viewBox="0 0 40 30" style={{ left: '68%', top: '38.5%', width: '22%', height: '17%', rotate: '-4deg' }}
                    fill="none" stroke="#6A6A72" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 11 L12 4 L17 8 Q20 7 23 8 L28 4 L29 11 Q31 18 25 23 Q20 26 15 23 Q9 18 11 11 Z" />
                    <path d="M16 13.5 v1.2 M24 13.5 v1.2" strokeWidth="2" />
                    <path d="M19 17 L20 18 L21 17 M20 18 Q18.5 20 17 19 M20 18 Q21.5 20 23 19" strokeWidth="1.2" />
                    <path d="M9 16 L4 15 M9 18 L4 19.5 M31 16 L36 15 M31 18 L36 19.5" strokeWidth="1" />
                </svg>
            )}
        </button>
    )
}

/** Табличка с именем котика — стоит на крыше холодильника на двух ножках. Нет имени — «Назови котика ✏️». */
function NameSign({ fr, name, onClick }: { fr: Place; name: string | null; onClick?: () => void }) {
    return (
        <div className="absolute -translate-x-1/2 -translate-y-full" style={{ left: pct(Math.min(Math.max(fr.x - 6, 105), 919)), top: pct(fr.y - fr.h + 12), zIndex: zOf(fr) + 1 }}>
            <button type="button" disabled={!onClick} onClick={onClick} aria-label={name ? `Котика зовут ${name}` : 'Назови котика'}
                className={`flex flex-col items-center ${onClick ? 'cursor-pointer' : 'pointer-events-none'}`}>
                <span className="whitespace-nowrap rounded-[0.8cqw] border-[0.35cqw] border-[#5A3A22] px-[1.2cqw] py-[0.35cqw] font-black leading-none shadow-md"
                    style={{ background: 'linear-gradient(180deg,#FFF6E4,#EAD9B6)', color: name ? '#5A3A22' : '#8C6A44', fontSize: name ? '2.1cqw' : '1.7cqw', rotate: '-2deg' }}>
                    {name ?? 'Назови котика ✏️'}
                </span>
                {/* две ножки-подпорки */}
                <span className="flex w-[60%] justify-between">
                    <span className="block h-[1.6cqw] w-[0.45cqw] rounded-b bg-[#5A3A22]" />
                    <span className="block h-[1.6cqw] w-[0.45cqw] rounded-b bg-[#5A3A22]" />
                </span>
            </button>
        </div>
    )
}

/** Окошко «Как назовём котика?»: поле ввода + «Готово». */
function NamePanel({ fr, initial, onSave, onClose }: { fr: Place; initial: string; onSave: (name: string) => Promise<string | null>; onClose: () => void }) {
    const [v, setV] = useState(initial)
    const [err, setErr] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)
    const save = async () => {
        const c = checkCatName(v)
        if (!c.ok) { setErr(c.error); return }
        setBusy(true)
        const e = await onSave(c.name)
        setBusy(false)
        if (e) setErr(e)
    }
    return (
        <div className="absolute -translate-x-1/2 -translate-y-full" style={{ left: pct(panelX(fr.x - 60)), top: pct(fr.y - fr.h - 22), zIndex: 1185 }}>
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                className="w-[48cqw] rounded-2xl border-2 border-[#4A3A14] bg-[#151F23] p-[2cqw] text-center shadow-xl sm:w-[38cqw]">
                <div className="text-[3.2cqw] font-black text-[#F2C35B] sm:text-[2.6cqw]">Как назовём котика?</div>
                <input value={v} maxLength={CAT_NAME_MAX} autoFocus placeholder="Мурзик"
                    onChange={(e) => { setV(e.target.value); setErr(null) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') void save() }}
                    className="mt-[1.2cqw] w-full rounded-xl border-2 border-[#2A363C] bg-[#0F171B] px-[1.6cqw] py-[1cqw] text-center text-[3.4cqw] font-black text-white outline-none focus:border-[#F2C35B] sm:text-[2.6cqw]" />
                {err && <div className="mt-[0.8cqw] text-[2.6cqw] font-bold text-[#FF8A80] sm:text-[2cqw]">{err}</div>}
                <div className="mt-[1.4cqw] flex gap-[1.2cqw]">
                    <button type="button" onClick={onClose}
                        className="flex-1 rounded-xl border-b-4 border-[#0E1418] bg-[#26333B] py-[1cqw] text-[2.8cqw] font-black text-[#C9D3D9] active:border-b-0 sm:text-[2.2cqw]">
                        Потом
                    </button>
                    <button type="button" onClick={() => void save()} disabled={busy}
                        className="flex-[1.4] rounded-xl border-b-4 border-[#B8862E] bg-[#FFE58A] py-[1cqw] text-[2.8cqw] font-black text-[#3A2A08] active:border-b-0 disabled:opacity-60 sm:text-[2.2cqw]">
                        Готово
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

/** Окошко «Починить холодильник за 25 рубинов» над холодильником. */
function FridgePanel({ fr, pending, noCoins, onFix, onClose }: { fr: Place; pending: boolean; noCoins: boolean; onFix: () => void; onClose: () => void }) {
    return (
        <div className="absolute -translate-x-1/2 -translate-y-full" style={{ left: pct(panelX(fr.x - 40)), top: pct(fr.y - fr.h - 8), zIndex: 1185 }}>
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                className="w-[44cqw] rounded-2xl border-2 border-[#4A3A14] bg-[#151F23] p-[2cqw] text-center shadow-xl sm:w-[36cqw]">
                <div className="text-[3.2cqw] font-black text-[#F2C35B] sm:text-[2.6cqw]">Холодильник сломан</div>
                <div className="mt-[0.6cqw] text-[2.7cqw] font-bold leading-snug text-[#C9D3D9] sm:text-[2.2cqw]">
                    {noCoins ? 'Не хватает рубинов — реши ещё задач, амиго!' : 'Котику негде хранить молоко. Починим?'}
                </div>
                <div className="mt-[1.4cqw] flex gap-[1.2cqw]">
                    <button type="button" onClick={onClose}
                        className="flex-1 rounded-xl border-b-4 border-[#0E1418] bg-[#26333B] py-[0.8cqw] text-[2.8cqw] font-black text-[#C9D3D9] active:border-b-0 sm:text-[2.2cqw]">
                        Потом
                    </button>
                    <button type="button" onClick={onFix} disabled={pending}
                        className="flex flex-[1.4] flex-col items-center justify-center rounded-xl border-b-4 border-[#B8862E] bg-[#FFE58A] py-[0.8cqw] font-black leading-none text-[#3A2A08] active:border-b-0 disabled:opacity-60">
                        <span className="text-[2.8cqw] sm:text-[2.2cqw]">Починить</span>
                        <span className="flex items-center text-[3.2cqw] sm:text-[2.6cqw]">
                            {FRIDGE_COST}
                            {/* тот же рубин, что в шапке приложения (components/user-progress.tsx) */}
                            <Lottie animationData={LottieGems} className="-my-[1cqw] ml-[0.4cqw] h-[4.6cqw] w-[4.6cqw] sm:h-[3.8cqw] sm:w-[3.8cqw]" />
                        </span>
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

/** Колбаска (Leonardo, cat-sausage). */
const Sausage = ({ size = 9 }: { size?: number }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/hangar/life/cat-sausage.webp" alt="" draggable={false} className="block select-none" style={{ width: `${size}cqw` }} />
)

export function HangarCat({ stage, bare, night, onHome, fridgeFixed = false, catName = null, layout }: {
    stage: number
    /** Расстановка из редактора (коробка и холодильник котика). */
    layout?: LayoutOverrides | null
    /** Имя котика (user_progress.cat_name). */
    catName?: string | null
    /** Холодильник котика починен (user_progress.cat_fridge_fixed). */
    fridgeFixed?: boolean
    /** Превью на плитке: без нажатий и облачков. */
    bare?: boolean
    night?: boolean
    /** Тестовая страница: без сервера. */
    onHome?: () => void
}) {
    // фаза на клиенте: stage с сервера → peek / home; в момент «приручения» — choice → lure → walk → home
    const [phase, setPhase] = useState<'peek' | 'choice' | 'lure' | 'walk' | 'home'>(stage >= 2 ? 'home' : 'peek')
    const [lure, setLure] = useState<'pet' | 'sausage'>('pet')
    const [step, setStep] = useState(0)
    const [stroll, setStroll] = useState<{ x: number; y: number; walking: boolean; flip: boolean; dur: number } | null>(null)
    const [react, setReact] = useState<'pet' | 'meow' | 'happy' | null>(null)
    const [meowShown, setMeowShown] = useState(true)
    const reactKey = useRef(0)
    const router = useRouter()
    const [fridgeOk, setFridgeOk] = useState(fridgeFixed)
    const st = fridgeOk ? 'a' : 'b'
    const boxP = place(layout, st, 'cat-box', CAT_DECOR[1][st])
    const frP = place(layout, st, 'cat-fridge', CAT_DECOR[0][st])
    const BED = bedOf(boxP)
    const catZ = zOf(boxP) + 1 // котик сидит на коробке — на слой выше неё
    const [fridgeOpen, setFridgeOpen] = useState(false)
    const [fridgeBusy, setFridgeBusy] = useState(false)
    const [noCoins, setNoCoins] = useState(false)
    const [fridgeJust, setFridgeJust] = useState(false)
    useEffect(() => { if (fridgeFixed) setFridgeOk(true) }, [fridgeFixed])
    const [name, setName] = useState<string | null>(catName)
    const [nameOpen, setNameOpen] = useState(false)
    useEffect(() => { if (catName) setName(catName) }, [catName])
    const saveName = async (n: string): Promise<string | null> => {
        const r = onHome ? { ok: true, name: n, error: undefined } : await setCatName(n)
        if (!r.ok) return r.error ?? 'Не получилось'
        setName(r.name ?? n); setNameOpen(false); playSound(CASE_PRIZE_SOUND)
        reactKey.current++; setReact('happy')
        if (!onHome) router.refresh()
        return null
    }
    const fixFridge = async () => {
        playJustClick()
        setFridgeBusy(true)
        const r = onHome ? { ok: true } : await fixCatFridge()
        setFridgeBusy(false)
        if (!r.ok) { setNoCoins(true); return }
        setFridgeOk(true); setFridgeOpen(false); setFridgeJust(true); playSound(CASE_PRIZE_SOUND)
        setTimeout(() => setFridgeJust(false), 1500)
        if (!onHome) router.refresh()
    }

    useEffect(() => { if (stage >= 2) setPhase((p) => (p === 'peek' ? 'home' : p)) }, [stage])

    // у входа «Мяу?» то появляется, то пропадает
    useEffect(() => {
        if (phase !== 'peek') return
        const t = setInterval(() => setMeowShown((v) => !v), 2600)
        return () => clearInterval(t)
    }, [phase])

    // кадры ходьбы
    useEffect(() => {
        if (phase !== 'walk' && !stroll?.walking) return
        const t = setInterval(() => setStep((s) => 1 - s), 170)
        return () => clearInterval(t)
    }, [phase, stroll?.walking])

    // дома иногда мяукает сам
    useEffect(() => {
        if (phase !== 'home' || bare || night) return
        // иногда сам мяукает, иногда жмурится от удовольствия («котику хорошо»)
        const t = setInterval(() => { const r = Math.random(); if (r < 0.3) { reactKey.current++; setReact('meow') } else if (r < 0.6) { reactKey.current++; setReact('happy') } }, 12000)
        return () => clearInterval(t)
    }, [phase, bare, night])
    useEffect(() => {
        if (!react) return
        const t = setTimeout(() => setReact(null), react === 'meow' ? 1200 : react === 'happy' ? 2600 : 1800)
        return () => clearTimeout(t)
    }, [react])

    const blink = useBlink(phase === 'home' && !react && !night)

    // прогулка днём: { куда, идёт ли сейчас, смотрит ли влево, сколько секунд идти }
    useEffect(() => {
        if (phase !== 'home' || bare || night) { setStroll(null); return }
        let alive = true
        const timers: ReturnType<typeof setTimeout>[] = []
        const later = (ms: number, f: () => void) => timers.push(setTimeout(() => alive && f(), ms))
        const durTo = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.min(3.6, Math.max(1.4, Math.hypot(a.x - b.x, a.y - b.y) / STROLL_SPEED))
        const go = () => {
            if (Math.random() < 0.5) { later(20000 + Math.random() * 15000, go); return }
            const spot = STROLL_SPOTS[Math.floor(Math.random() * STROLL_SPOTS.length)]
            const d1 = durTo(BED, spot)
            setStroll({ ...spot, walking: true, flip: spot.x < BED.x, dur: d1 })
            later(d1 * 1000, () => setStroll((st) => st && { ...st, walking: false }))
            const stay = 5000 + Math.random() * 4000
            later(d1 * 1000 + stay, () => setStroll({ x: BED.x, y: BED.y, walking: true, flip: BED.x < spot.x, dur: d1 }))
            later(d1 * 2000 + stay, () => { setStroll(null); later(25000 + Math.random() * 20000, go) })
        }
        later(15000 + Math.random() * 15000, go)
        return () => { alive = false; timers.forEach(clearTimeout) }
    }, [phase, bare, night])

    if (stage < 1) return null

    const choose = (how: 'pet' | 'sausage') => {
        playJustClick()
        setLure(how)
        setPhase('lure')
        if (onHome) onHome()
        else void bringCatHome()
        setTimeout(() => setPhase('walk'), 1500)
        setTimeout(() => {
            setPhase('home'); playSound(CASE_PRIZE_SOUND)
            // котик дома: ачивка «Кот в ангаре», плитка на /learn перестаёт писать «Кто-то мяучит!»
            if (!onHome) { useAchievementUnlockStore.getState().check(); router.refresh() }
        }, 1500 + WALK_S * 1000)
    }

    // --- у входа ---
    if (phase === 'peek' || phase === 'choice') {
        const b = box('peek', GATE)
        return (
            <>
                <button type="button" aria-label="Котик" disabled={bare}
                    className="absolute cursor-pointer animate-[cat-peek_2.6s_ease-in-out_infinite] disabled:cursor-default"
                    style={{ ...b, zIndex: 215, transformOrigin: '100% 100%' }}
                    onClick={() => { playJustClick(); setPhase((p) => (p === 'choice' ? 'peek' : 'choice')) }}>
                    <CatImg pose="peek" poses={['peek']} flip />
                </button>
                <style>{`@keyframes cat-peek{0%,100%{transform:rotate(0)}50%{transform:rotate(4deg)}}`}</style>
                {!bare && meowShown && phase === 'peek' && <Bubble x={GATE.x - 18} y={GATE.y - 72}>Мяу?</Bubble>}
                {!bare && phase === 'choice' && (
                    <div className="absolute flex -translate-x-1/2 flex-col gap-[1cqw]" style={{ left: pct(GATE.x - 30), top: pct(GATE.y - 30), zIndex: 1185 }}>
                        <button type="button" onClick={() => choose('pet')}
                            className="whitespace-nowrap rounded-xl border-b-4 border-[#B8862E] bg-[#FFE58A] px-[2.4cqw] py-[1.2cqw] text-[3cqw] font-black text-[#3A2A08] shadow-lg active:border-b-0 sm:text-[2.4cqw]">
                            Погладить
                        </button>
                        <button type="button" onClick={() => choose('sausage')}
                            className="whitespace-nowrap rounded-xl border-b-4 border-[#B05868] bg-[#F7A7B4] px-[2.4cqw] py-[1.2cqw] text-[3cqw] font-black text-[#4A1A24] shadow-lg active:border-b-0 sm:text-[2.4cqw]">
                            Подманить колбаской
                        </button>
                    </div>
                )}
            </>
        )
    }

    // --- выманили: котик выходит из-за ворот (погладили — мурчит, колбаска — нюхает) ---
    if (phase === 'lure') {
        const pose: Pose = lure === 'pet' ? 'pet' : 'sniff'
        const at = { ...GATE, x: GATE.x - 20 }
        return (
            <>
                <motion.div className="pointer-events-none absolute" style={{ ...box(pose, at), zIndex: 215 }}
                    initial={{ opacity: 0, x: '30%' }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
                    <CatImg pose={pose} poses={[pose]} flip />
                </motion.div>
                {lure === 'pet'
                    ? <><Hearts x={at.x} y={at.y - 70} /><Bubble x={at.x} y={at.y - 72}>Мрр…</Bubble></>
                    : <motion.span className="pointer-events-none absolute text-[5cqw]" style={{ left: pct(at.x - 100), top: pct(at.y - 40), zIndex: 1160 }}
                        initial={{ rotate: -20, scale: 0.5 }} animate={{ rotate: 10, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 9 }}><Sausage /></motion.span>}
            </>
        )
    }

    // --- бежит к картонке ---
    if (phase === 'walk') {
        const pose: Pose = step ? 'walk-2' : 'walk-1'
        const frames = [...PATH.slice(0, -1), BED].map((p) => box('walk-1', p))
        return (
            <>
                <Cardboard p={boxP} />
                <motion.div className="pointer-events-none absolute" style={{ zIndex: catZ }}
                    initial={frames[0]}
                    animate={{ left: frames.map((f) => f.left), top: frames.map((f) => f.top), width: frames.map((f) => f.width), height: frames.map((f) => f.height) }}
                    transition={{ duration: WALK_S, ease: 'linear', times: [0, 0.3, 0.65, 1] }}>
                    <motion.div className="absolute inset-0" animate={{ y: ['0%', '-4%', '0%'] }} transition={{ duration: 0.34, repeat: Infinity }}>
                        <CatImg pose={pose} poses={['walk-1', 'walk-2']} flip />
                    </motion.div>
                </motion.div>
                {lure === 'sausage' && (
                    <motion.span className="pointer-events-none absolute text-[4cqw]" style={{ zIndex: 1160 }}
                        initial={{ left: pct(GATE.x - 110), top: pct(GATE.y - 40) }} animate={{ left: pct(BED.x - 90), top: pct(BED.y - 50) }}
                        transition={{ duration: WALK_S - 0.4, ease: 'easeInOut' }}><Sausage size={7} /></motion.span>
                )}
            </>
        )
    }

    // --- дома, на картонке ---
    const pose: Pose = night ? 'sleep' : react ?? blink
    const allSit: Pose[] = ['sit', 'sit-half', 'sit-closed', 'happy', 'pet', 'meow', 'sleep']
    return (
        <>
            <Fridge p={frP} fixed={fridgeOk} justFixed={fridgeJust} onClick={!bare && !fridgeOk ? () => { playJustClick(); setNoCoins(false); setNameOpen(false); setFridgeOpen((v) => !v) } : undefined} />
            <NameSign fr={frP} name={name} onClick={!bare ? () => { playJustClick(); setFridgeOpen(false); setNameOpen((v) => !v) } : undefined} />
            {!bare && nameOpen && <NamePanel fr={frP} initial={name ?? ''} onSave={saveName} onClose={() => setNameOpen(false)} />}
            {!bare && !fridgeOk && fridgeOpen && <FridgePanel fr={frP} pending={fridgeBusy} noCoins={noCoins} onFix={fixFridge} onClose={() => setFridgeOpen(false)} />}
            <Cardboard p={boxP} />
            {/* гуляет: слой по глубине точки, где сидит (что стоит ниже на полу — перед ним); пока идёт — не ниже своей коробки */}
            {stroll ? (
                // гуляет: идёт (кадры ходьбы, отражены, если влево) или сидит в точке и смотрит по сторонам
                <motion.div className="pointer-events-none absolute" style={{ zIndex: stroll.walking ? Math.max(catZ, depthZIndex(stroll.y)) : depthZIndex(stroll.y) }}
                    initial={false}
                    animate={box(stroll.walking ? 'walk-1' : 'sit-shy', { x: stroll.x, y: stroll.y, k: kAt(stroll.y) })}
                    transition={{ duration: stroll.walking ? stroll.dur : 0, ease: 'linear' }}>
                    <motion.div className="absolute inset-0" animate={{ y: stroll.walking ? ['0%', '-4%', '0%'] : '0%' }} transition={{ duration: 0.34, repeat: stroll.walking ? Infinity : 0 }}>
                        <CatImg pose={stroll.walking ? (step ? 'walk-2' : 'walk-1') : 'sit-shy'} poses={['walk-1', 'walk-2', 'sit-shy']} flip={stroll.flip} />
                    </motion.div>
                </motion.div>
            ) : (
            <button type="button" aria-label="Котик" disabled={bare}
                className="absolute cursor-pointer disabled:cursor-default"
                style={{ ...box(pose, BED), zIndex: catZ }}
                onClick={() => { playJustClick(); reactKey.current++; const r = Math.random(); setReact(r < 0.45 ? 'happy' : r < 0.8 ? 'pet' : 'meow') }}>
                <CatImg pose={pose} poses={allSit} />
            </button>
            )}
            {!bare && (react === 'pet' || react === 'happy') && <><Hearts key={reactKey.current} x={BED.x} y={BED.y - 95} /><Bubble x={BED.x + 30} y={BED.y - 96}>Мрр-мрр</Bubble></>}
            {!bare && react === 'meow' && <Bubble key={reactKey.current} x={BED.x + 34} y={BED.y - 96}>Мяу!</Bubble>}
            {night && (
                <motion.span className="pointer-events-none absolute font-black text-[#C9D3FF]" style={{ left: pct(BED.x + 30), top: pct(BED.y - 80), zIndex: 1160, fontSize: '3cqw' }}
                    animate={{ y: ['0cqw', '-3cqw'], opacity: [0, 1, 0] }} transition={{ duration: 2.4, repeat: Infinity }}>Zzz</motion.span>
            )}
        </>
    )
}
