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
import { CAT_DECOR, place, placeStyle, type LayoutOverrides, type Place } from '@/lib/hangarModel'
import Lottie from '@/components/lottie-player'
import LottieGems from '@/public/Lottie/LottieGems.json'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { CatFridgeModal } from '@/components/cat-fridge-modal'
import type { CatFoodStock } from '@/lib/catFood'
import { bringCatHome, fixCatFridge, setCatName } from '@/actions/cat'
import { checkCatName, CAT_NAME_MAX } from '@/lib/catName'
import { useAchievementUnlockStore } from '@/store/use-achievement-unlock-store'
import { playSound, playJustClick, CASE_PRIZE_SOUND } from '@/lib/sound'

type Pose = 'happy' | 'peek' | 'walk-1' | 'walk-2' | 'walk-3' | 'jump' | 'land' | 'sun' | 'sun-wink' | 'meow' | 'pet' | 'sniff' | 'sleep' | 'sit' | 'sit-half' | 'sit-closed' | 'sit-shy'

// Размер позы в исходных пикселях (обрезка по картинке, до уменьшения).
const CAT_PX: Record<Pose, [number, number]> = {
    peek: [536, 651], 'walk-1': [811, 689], 'walk-2': [811, 689], 'walk-3': [811, 689], jump: [750, 715], land: [825, 671], sun: [892, 581], 'sun-wink': [891, 640], meow: [648, 750], pet: [611, 764], sniff: [632, 727],
    sleep: [672, 453], happy: [626, 755], sit: [626, 755], 'sit-half': [626, 755], 'sit-closed': [626, 755], 'sit-shy': [627, 635],
}
// Ходьба — 3 кадра Leonardo (docs/hangar/leonardo/cat-walk2-*): лапа вперёд → широкий шаг → лапы собраны.
// Кадры выровнены по голове, поэтому голова не дёргается — двигаются только лапы.
const WALK_FRAMES: Pose[] = ['walk-1', 'walk-2', 'walk-3']
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
// Перспектива: размер котика растёт к зрителю (ниже на полу) и уменьшается вдаль — как у коробки (BED_K на y 852).
// Горизонт пола ~ y 470: размер ∝ (y − 470), смягчено наполовину, чтобы менялся «чуть-чуть».
const kAt = (y: number) => Math.min(0.175, Math.max(0.085, BED_K * (0.5 + (0.5 * (y - 470)) / (852 - 470))))
// Гуляющий котик выше всего на полу (хлам, штаны, банки, флаг) — ниже вентилятора (900). Под столом компьютера —
// столешница и передние ножки рисуются поверх котика (DESK_FRONT_Z), задняя ножка вырезана из этой картинки и остаётся сзади.
const CAT_TOP_Z = 880
// наклон верха лежащей бочки (05-before: верхний край идёт от (80,24) к (260,1) — ~7° вверх вправо)
const BARREL_TILT = -8
const DESK_FRONT_Z = 885
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

/** Мягкая тень под лапками (низ картинки котика), не прыгает вместе с ним. */
const CatShadow = () => (
    <span className="pointer-events-none absolute left-[12%] w-[76%] rounded-[50%]"
        style={{ bottom: '-3%', height: '12%', background: 'radial-gradient(closest-side, rgba(20,10,8,0.45), transparent)' }} />
)

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

// Фразы котика — только «мяу» и «мурр» с разной интонацией, без человеческих слов (выбираются в момент реакции, не на каждый рендер).
const PHRASES = {
    meow: ['Мяу!', 'Мяу?', 'Мя-я-яу!', 'Мяу-мяу!', 'Мр-мяу!', 'МЯУ!', 'мяу…', 'Мяяяу?!', 'Мя!'],
    pet: ['Мрр-мрр', 'Мур-мур', 'Мурр…', 'Мур-р-р-р', 'Мрр!', 'мрр…'],
    happy: ['Мррр…', 'Мур-мур-мур', 'Мур-р-р…', 'Мрр-мяу', 'Мурмяу~'],
    hungry: ['Мяу… мяу…', 'Мя-я-у?..', 'Мяяяу…'],
}
const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)]

// Ночью котик спит и ему снятся задачки — классические народные головоломки (свой пересказ, тексты «Кванта» не копируем).
const DREAMS: { q: string; a: string }[] = [
    { q: 'Кирпич весит 1 кг и ещё полкирпича. Сколько весит кирпич?', a: '2 кг' },
    { q: 'Три кошки за три минуты ловят три мышки. Сколько кошек поймают 100 мышек за 100 минут?', a: 'Те же 3 кошки' },
    { q: 'Бревно пилят на 10 частей, каждый распил — минута. Сколько минут уйдёт?', a: '9 минут — распилов на один меньше, чем частей' },
    { q: 'Улитка ползёт на столб высотой 10 м: днём поднимается на 3 м, ночью сползает на 2 м. На какой день она будет наверху?', a: 'На 8-й день' },
    { q: 'Сколько раз за сутки совпадают часовая и минутная стрелки?', a: '22 раза' },
    { q: 'Половина половины числа равна половине. Что это за число?', a: '2' },
    { q: 'Как разделить 5 рыбок между 5 котиками, чтобы каждому досталось по рыбке и одна осталась в миске?', a: 'Последнему котику отдать рыбку вместе с миской' },
    { q: 'Лист бумаги сложили пополам три раза и проткнули иголкой. Сколько дырок на развёрнутом листе?', a: '8' },
    { q: 'Что больше: 2 в десятой степени или 10 в кубе?', a: '2¹⁰ = 1024 — чуть больше, чем 10³ = 1000' },
    { q: 'В комнате 4 угла, в каждом сидит кошка, напротив каждой кошки — 3 кошки. Сколько всего кошек?', a: '4' },
    { q: 'Сумма двух чисел 10, а разность 4. Что это за числа?', a: '7 и 3' },
    { q: 'Утка весит 2 кг, стоя на одной лапе. Сколько она весит, стоя на двух?', a: 'Те же 2 кг' },
]

/** Сон котика: облако-мысль с задачкой над спящим котиком. Висит, пока не нажмут крестик; «Ответ» — открыть ответ. */
function Dream({ x, y, dream, onNext, onClose }: { x: number; y: number; dream: { q: string; a: string }; onNext: () => void; onClose: () => void }) {
    const [shown, setShown] = useState(false)
    useEffect(() => setShown(false), [dream])
    return (
        <div className="absolute w-[62%] -translate-x-1/2 -translate-y-full" style={{ left: pct(Math.min(Math.max(x, 330), 694)), top: pct(y), zIndex: 1185 }}>
            <motion.div key={dream.q} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                className="relative rounded-[22px] border-2 border-[#6E7BC4] bg-[#1B2140]/95 px-3 py-2.5 text-left shadow-[0_0_24px_rgba(140,160,255,0.35)]"
                style={{ transformOrigin: '20% 100%' }}>
                <div className="flex items-center gap-2">
                    <span className="flex-1 text-[10px] font-black uppercase tracking-wide text-[#AEB8FF] sm:text-[11px]">💤 Котику снится задачка</span>
                    <button type="button" aria-label="Закрыть сон" onClick={onClose} className="-mr-1 -mt-0.5 rounded-md px-1 text-base font-black leading-none text-[#AEB8FF] hover:text-white">✕</button>
                </div>
                <p className="mt-1 text-sm font-bold leading-snug text-[#EEF0FF] sm:text-[15px]">{dream.q}</p>
                {shown && <p className="mt-1.5 text-sm font-black leading-snug text-[#9EE8B0]">Ответ: {dream.a}</p>}
                <div className="mt-2 flex gap-2">
                    {!shown && <button type="button" onClick={() => setShown(true)} className="rounded-lg border-b-4 border-[#3E4A8C] bg-[#5865C9] px-2.5 py-1 text-xs font-black text-white active:border-b-0">Ответ</button>}
                    <button type="button" onClick={onNext} className="rounded-lg border-b-4 border-[#262E55] bg-[#323B6E] px-2.5 py-1 text-xs font-black text-[#C9D0FF] active:border-b-0">Другой сон</button>
                </div>
            </motion.div>
            {/* «пузырьки» мысли к спящему котику */}
            <span className="absolute left-[18%] top-full mt-1 h-3 w-3 rounded-full border-2 border-[#6E7BC4] bg-[#1B2140]" />
            <span className="absolute left-[14%] top-full mt-5 h-2 w-2 rounded-full border-2 border-[#6E7BC4] bg-[#1B2140]" />
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
            // в тон соседнего хлама у стены: темнее и чуть менее рыжая
            style={{ ...placeStyle(p), filter: 'sepia(0.35) brightness(0.62) saturate(0.95) contrast(0.95)' }} />
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

export function HangarCat({ stage, bare, night, onHome, fridgeFixed = false, catName = null, layout, desk, barrel, catFood, demo }: {
    stage: number
    /** Тестовая страница /test-cat-barrel: котик сразу и по кругу запрыгивает на бочку. */
    demo?: 'barrel'
    /** Лежащая бочка (№13, пока не починена) — любимое место: котик запрыгивает на неё и греется на солнце. */
    barrel?: Place | null
    /** Еда в холодильнике (user_progress.cat_milk / cat_sausage). */
    catFood?: CatFoodStock
    /** Стол с компьютером (№7): место и картинка без задней ножки — котик любит лежать под ним. */
    desk?: { src: string; p: Place } | null
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
    // ky — по какой глубине пола считать размер (котик на бочке стоит выше пола, но размер — как у бочки),
    // perch — сидит на бочке и греется, jump — сейчас прыгает (вверх на бочку или вниз)
    const [stroll, setStroll] = useState<{ x: number; y: number; walking: boolean; flip: boolean; dur: number; under?: boolean; ky?: number; k?: number; perch?: boolean; jump?: boolean; crouch?: boolean; land?: boolean } | null>(null)
    const [wink, setWink] = useState(false)
    const strollingRef = useRef(false)
    // стол — через ref: объект desk новый на каждой перерисовке ангара, в зависимостях эффекта прогулки он сбрасывал
    // таймеры, и котик оставался в позе ходьбы («ходил на месте»)
    const deskRef = useRef(desk)
    deskRef.current = desk
    const barrelRef = useRef(barrel)
    barrelRef.current = barrel
    const bedRef = useRef<{ x: number; y: number; k: number; floorY: number } | null>(null)
    strollingRef.current = !!stroll?.walking
    const [react, setReact] = useState<'pet' | 'meow' | 'happy' | null>(null)
    // ночью: тап по спящему котику — ему снится задачка (не исчезает сама)
    const [dreamIdx, setDreamIdx] = useState<number | null>(null)
    const nextDream = () => setDreamIdx((i) => {
        let n = Math.floor(Math.random() * DREAMS.length)
        if (n === i) n = (n + 1) % DREAMS.length
        return n
    })
    useEffect(() => { if (!night) setDreamIdx(null) }, [night])
    const [meowShown, setMeowShown] = useState(true)
    const reactKey = useRef(0)
    const [say, setSay] = useState('')
    const router = useRouter()
    const [fridgeOk, setFridgeOk] = useState(fridgeFixed)
    const st = fridgeOk ? 'a' : 'b'
    const boxP = place(layout, st, 'cat-box', CAT_DECOR[1][st])
    const frP = place(layout, st, 'cat-fridge', CAT_DECOR[0][st])
    const BED = bedOf(boxP)
    bedRef.current = { ...BED, floorY: boxP.y }
    const catZ = zOf(boxP) + 1 // котик сидит на коробке — на слой выше неё
    // реакция + фраза одним махом; голодный котик (холодильник сломан) иногда просит молока
    const doReact = (r: 'pet' | 'meow' | 'happy') => {
        reactKey.current++
        setSay(r === 'meow' && !fridgeOk && Math.random() < 0.4 ? pick(PHRASES.hungry) : pick(PHRASES[r]))
        setReact(r)
    }
    const [fridgeOpen, setFridgeOpen] = useState(false)
    const [fridgeBusy, setFridgeBusy] = useState(false)
    const [noCoins, setNoCoins] = useState(false)
    const [fridgeJust, setFridgeJust] = useState(false)
    // открытый холодильник (окно с полками) и сколько еды куплено
    const [shopOpen, setShopOpen] = useState(false)
    const [food, setFood] = useState<CatFoodStock>(catFood ?? { milk: 0, sausage: 0 })
    useEffect(() => { if (catFood) setFood(catFood) }, [catFood?.milk, catFood?.sausage])
    useEffect(() => { if (fridgeFixed) setFridgeOk(true) }, [fridgeFixed])
    const [name, setName] = useState<string | null>(catName)
    const [nameOpen, setNameOpen] = useState(false)
    useEffect(() => { if (catName) setName(catName) }, [catName])
    const saveName = async (n: string): Promise<string | null> => {
        const r = onHome ? { ok: true, name: n, error: undefined } : await setCatName(n)
        if (!r.ok) return r.error ?? 'Не получилось'
        setName(r.name ?? n); setNameOpen(false); playSound(CASE_PRIZE_SOUND)
        doReact('happy')
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

    // у входа «Мяу?» то появляется, то пропадает — каждый раз немного по-разному
    const PEEK = ['Мяу?', 'Мяу…', 'Мя?', 'Мяу-мяу?', 'Мя-я-у?']
    const [peekSay, setPeekSay] = useState('Мяу?')
    useEffect(() => { if (meowShown) setPeekSay((p) => (Math.random() < 0.5 ? 'Мяу?' : PEEK[Math.floor(Math.random() * PEEK.length)] || p)) }, [meowShown])
    useEffect(() => {
        if (phase !== 'peek') return
        const t = setInterval(() => setMeowShown((v) => !v), 2600)
        return () => clearInterval(t)
    }, [phase])

    // кадры ходьбы
    useEffect(() => {
        if (phase !== 'walk' && !stroll?.walking) return
        const t = setInterval(() => setStep((s) => (s + 1) % 3), 150)
        return () => clearInterval(t)
    }, [phase, stroll?.walking])

    // дома иногда мяукает сам
    useEffect(() => {
        if (phase !== 'home' || bare || night) return
        // иногда сам мяукает, иногда жмурится от удовольствия («котику хорошо»)
        // на ходу не мяукает (облачко не успевало бы за котиком)
        const t = setInterval(() => { if (strollingRef.current) return; const r = Math.random(); if (r < 0.3) doReact('meow'); else if (r < 0.6) doReact('happy') }, 12000)
        return () => clearInterval(t)
    }, [phase, bare, night])
    useEffect(() => {
        if (!react) return
        const t = setTimeout(() => setReact(null), react === 'meow' ? 2000 : react === 'happy' ? 2800 : 2200)
        return () => clearTimeout(t)
    }, [react])

    // греется на бочке — изредка подмигивает
    const basking = !!stroll?.perch && !stroll.jump && !stroll.land
    useEffect(() => {
        if (!basking) { setWink(false); return }
        const t = setInterval(() => { setWink(true); setTimeout(() => setWink(false), 700) }, 5200)
        return () => clearInterval(t)
    }, [basking])

    const blink = useBlink(phase === 'home' && !react && !night)

    // прогулка днём: { куда, идёт ли сейчас, смотрит ли влево, сколько секунд идти }
    useEffect(() => {
        if (phase !== 'home' || bare || night) { setStroll(null); return }
        let alive = true
        const timers: ReturnType<typeof setTimeout>[] = []
        const later = (ms: number, f: () => void) => timers.push(setTimeout(() => alive && f(), ms))
        const durTo = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.min(3.6, Math.max(1.4, Math.hypot(a.x - b.x, a.y - b.y) / STROLL_SPEED))
        // Прогулка по шагам на одной шкале времени: t — когда начать следующий шаг (мс от начала прогулки).
        const go = () => {
            if (!demo && Math.random() < 0.5) { later(20000 + Math.random() * 15000, go); return }
            const bed = bedRef.current
            if (!bed) return
            const BEDp = { x: bed.x, y: bed.y }
            const boxFloor = { x: Math.round(bed.x + 18), y: Math.round(bed.floorY + 8) } // на полу перед коробкой
            let t = 0
            const at = (f: () => void) => later(t, f)
            // прыжок дугой from → to: присел, полёт, приземлился (k — размер на «верхней» точке)
            const jump = (from: { x: number; y: number }, to: { x: number; y: number }, flip: boolean, kFrom: { k?: number; ky?: number }, kTo: { k?: number; ky?: number }, extra: { perch?: boolean } = {}) => {
                at(() => setStroll({ ...from, walking: false, flip, dur: 0, crouch: true, ...kFrom }))
                t += 350
                at(() => setStroll({ ...to, walking: false, flip, dur: 0.5, jump: true, ...kTo, ...extra }))
                t += 500
                at(() => setStroll({ ...to, walking: false, flip, dur: 0, land: true, ...kTo, ...extra }))
                t += 300
            }
            const walk = (from: { x: number; y: number }, to: { x: number; y: number }) => {
                const d = durTo(from, to)
                at(() => setStroll({ ...to, walking: true, flip: to.x < from.x, dur: d }))
                t += d * 1000
            }
            // спрыгнул с коробки → …прогулка… → вернулся к коробке, запрыгнул и сел дома
            const leaveBox = (toward: { x: number }) => jump(BEDp, boxFloor, toward.x < BEDp.x, { k: bed.k }, {})
            const comeHome = (from: { x: number; y: number }) => {
                walk(from, boxFloor)
                jump(boxFloor, BEDp, BEDp.x < boxFloor.x, {}, { k: bed.k })
                at(() => { setStroll(null); later(demo ? 1500 : 25000 + Math.random() * 20000, go) })
            }

            // самое любимое днём — лежащая бочка: запрыгивает, греется на солнце и мурчит, потом спрыгивает
            const br = barrelRef.current
            if (br && (demo === 'barrel' || Math.random() < 0.45)) {
                const floor = { x: Math.round(br.x + br.w * 0.12), y: Math.round(br.y + 6) } // перед бочкой на полу
                const top = { x: Math.round(br.x + br.w * 0.1), y: Math.round(br.y - br.h * 0.86) } // на верху бочки
                const flip = floor.x < boxFloor.x
                leaveBox(floor)
                walk(boxFloor, floor)
                jump(floor, top, flip, {}, { ky: br.y }, { perch: true })
                at(() => { setStroll((st) => st && { ...st, land: false }); doReact('happy') })
                const stay = demo ? 7000 : 16000 + Math.random() * 10000
                later(t + stay / 2, () => doReact('happy'))
                t += stay
                jump(top, floor, !flip, { ky: br.y }, {}, {})
                comeHome(floor)
                return
            }
            // любимое место — под столом с компьютером (лежит там подольше); иначе — одна из точек пола
            const dk = deskRef.current
            const under = !!dk && Math.random() < 0.4
            const spot = under && dk ? { x: Math.round(dk.p.x - dk.p.w * 0.13), y: Math.round(dk.p.y - dk.p.h * 0.11) } : STROLL_SPOTS[Math.floor(Math.random() * STROLL_SPOTS.length)]
            leaveBox(spot)
            const d = durTo(boxFloor, spot)
            at(() => setStroll({ ...spot, walking: true, flip: spot.x < boxFloor.x, dur: d, under }))
            t += d * 1000
            at(() => setStroll((st) => st && { ...st, walking: false }))
            t += under ? 12000 + Math.random() * 8000 : 5000 + Math.random() * 4000
            const back = durTo(spot, boxFloor)
            at(() => setStroll({ ...boxFloor, walking: true, flip: boxFloor.x < spot.x, dur: back, under }))
            t += back * 1000
            jump(boxFloor, BEDp, BEDp.x < boxFloor.x, {}, { k: bed.k })
            at(() => { setStroll(null); later(demo ? 1500 : 25000 + Math.random() * 20000, go) })
        }
        later(demo ? 800 : 15000 + Math.random() * 15000, go)
        return () => { alive = false; timers.forEach(clearTimeout) }
    }, [phase, bare, night, demo])

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
                <div className="pointer-events-none absolute animate-[cat-peek_2.6s_ease-in-out_infinite]"
                    style={{ ...b, zIndex: 215, transformOrigin: '100% 100%' }}>
                    <CatImg pose="peek" poses={['peek']} flip />
                </div>
                {/* Котик маленький и прячется за воротами — рядом ракета (№14) и компьютер (№7), по ним легко промахнуться.
                    Поэтому зона нажатия — невидимая, с запасом вокруг котика и ПОВЕРХ предметов и их номеров. */}
                {!bare && (
                    <button type="button" aria-label="Котик" className="absolute cursor-pointer"
                        style={{ left: pct(GATE.x - 70), top: pct(GATE.y - 115), width: pct(130), height: pct(135), zIndex: 1160 }}
                        onClick={() => { playJustClick(); setPhase((p) => (p === 'choice' ? 'peek' : 'choice')) }} />
                )}
                <style>{`@keyframes cat-peek{0%,100%{transform:rotate(0)}50%{transform:rotate(4deg)}}`}</style>
                {!bare && meowShown && phase === 'peek' && <Bubble x={GATE.x - 18} y={GATE.y - 72}>{peekSay}</Bubble>}
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
        const pose: Pose = WALK_FRAMES[step]
        const frames = [...PATH.slice(0, -1), BED].map((p) => box('walk-1', p))
        return (
            <>
                <Cardboard p={boxP} />
                <motion.div className="pointer-events-none absolute" style={{ zIndex: catZ }}
                    initial={frames[0]}
                    animate={{ left: frames.map((f) => f.left), top: frames.map((f) => f.top), width: frames.map((f) => f.width), height: frames.map((f) => f.height) }}
                    transition={{ duration: WALK_S, ease: 'linear', times: [0, 0.3, 0.65, 1] }}>
                    <CatShadow />
                    <motion.div className="absolute inset-0" animate={{ y: ['0%', '-1.5%', '0%'] }} transition={{ duration: 0.3, repeat: Infinity }}>
                        <CatImg pose={pose} poses={WALK_FRAMES} flip />
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
    // где говорит котик: над коробкой или над точкой прогулки (верх его картинки)
    // поза на прогулке: идёт / прыгает (кадр широкого шага) / лежит под столом / греется на бочке / сидит
    const strollPose: Pose = !stroll ? 'sit' : stroll.walking ? WALK_FRAMES[step] : stroll.crouch ? 'walk-3' : stroll.jump ? 'jump' : stroll.land ? 'land'
        : stroll.under ? 'sleep' : stroll.perch ? (wink ? 'sun-wink' : 'sun') : 'sit-shy'
    const strollBox: Pose = !stroll ? 'sit' : stroll.walking ? 'walk-1' : strollPose
    const strollK = stroll ? stroll.k ?? kAt(stroll.ky ?? stroll.y) : BED_K
    const talkAt = stroll ? { x: stroll.x, y: stroll.y - CAT_PX[strollBox][1] * strollK - 6 } : { x: BED.x, y: BED.y - 96 }
    const allSit: Pose[] = ['sit', 'sit-half', 'sit-closed', 'happy', 'pet', 'meow', 'sleep']
    return (
        <>
            <Fridge p={frP} fixed={fridgeOk} justFixed={fridgeJust} onClick={bare ? undefined : !fridgeOk ? () => { playJustClick(); setNoCoins(false); setNameOpen(false); setFridgeOpen((v) => !v) } : () => { playJustClick(); setNameOpen(false); setShopOpen(true) }} />
            {shopOpen && typeof document !== 'undefined' && createPortal(
                <CatFridgeModal stock={food} catName={name} offline={!!onHome} onClose={() => setShopOpen(false)}
                    onBought={(k, n) => { setFood((f) => ({ ...f, [k]: n })); if (!onHome) router.refresh() }} />, document.body)}
            <NameSign fr={frP} name={name} onClick={!bare ? () => { playJustClick(); setFridgeOpen(false); setNameOpen((v) => !v) } : undefined} />
            {!bare && nameOpen && <NamePanel fr={frP} initial={name ?? ''} onSave={saveName} onClose={() => setNameOpen(false)} />}
            {!bare && !fridgeOk && fridgeOpen && <FridgePanel fr={frP} pending={fridgeBusy} noCoins={noCoins} onFix={fixFridge} onClose={() => setFridgeOpen(false)} />}
            <Cardboard p={boxP} />
            {/* гуляет: слой по глубине точки, где сидит (что стоит ниже на полу — перед ним); пока идёт — не ниже своей коробки */}
            {stroll ? (
                // гуляет: идёт (кадры ходьбы, отражены, если влево) или сидит в точке и смотрит по сторонам; под столом — лежит.
                // Слой — поверх всего на полу (CAT_TOP_Z), размер — по глубине точки (kAt).
                <motion.div className={`absolute ${stroll.walking ? 'pointer-events-none' : 'cursor-pointer'}`} style={{ zIndex: CAT_TOP_Z, transformOrigin: '50% 100%' }}
                    // старт прогулки — от коробки (раньше initial={false}: котик сразу оказывался в точке прогулки, «телепортировался»)
                    initial={box('walk-1', { x: BED.x, y: BED.y, k: kAt(BED.y) })}
                    // на бочке котик лежит вдоль её верха: бочка лежит наискосок (верх уходит вверх-вправо ~8°), поэтому котик
                    // наклонён так же и чуть сплющен по высоте — смотрим на него сверху, как на бочку
                    animate={{ ...box(strollBox, { x: stroll.x, y: stroll.y, k: strollK }),
                        rotate: stroll.perch && !stroll.jump ? BARREL_TILT : 0, scaleY: stroll.perch && !stroll.jump && !stroll.land ? 0.9 : 1 }}
                    transition={{ duration: stroll.walking || stroll.jump ? stroll.dur : 0, ease: stroll.jump ? [0.3, 0, 0.4, 1] : 'linear' }}
                    onClick={stroll.walking || bare ? undefined : () => { playJustClick(); const r = Math.random(); doReact(r < 0.5 ? 'pet' : 'meow') }}>
                    {!stroll.perch && !stroll.jump && <CatShadow />}
                    {/* прыжок — дугой: кроме перелёта к точке, картинка подлетает вверх и опускается */}
                    <motion.div className="absolute inset-0"
                        animate={{ y: stroll.walking ? ['0%', '-1.5%', '0%'] : stroll.jump ? ['0%', '-45%', '0%'] : '0%' }}
                        transition={stroll.jump ? { duration: stroll.dur, ease: 'easeOut' } : { duration: 0.3, repeat: stroll.walking ? Infinity : 0 }}>
                        <CatImg pose={strollPose} poses={[...WALK_FRAMES, 'jump', 'land', 'sun', 'sun-wink', 'sit-shy', 'sleep']} flip={stroll.flip} />
                    </motion.div>
                </motion.div>
            ) : (
            <button type="button" aria-label="Котик" disabled={bare}
                className="absolute cursor-pointer disabled:cursor-default"
                style={{ ...box(pose, BED), zIndex: catZ }}
                onClick={() => { playJustClick(); if (night) { nextDream(); return } const r = Math.random(); doReact(r < 0.45 ? 'happy' : r < 0.8 ? 'pet' : 'meow') }}>
                <CatImg pose={pose} poses={allSit} />
            </button>
            )}
            {stroll?.perch && !stroll.jump && (
                // котик на бочке греется: тёплое пятно солнца на нём
                <div className="pointer-events-none absolute rounded-full" style={{ left: pct(stroll.x - 70), top: pct(stroll.y - 120), width: pct(140), height: pct(150),
                    background: 'radial-gradient(closest-side, rgba(255,214,120,0.55), rgba(255,200,90,0.18) 60%, transparent)', mixBlendMode: 'screen', zIndex: CAT_TOP_Z + 1, animation: 'cat-sun 4s ease-in-out infinite' }}>
                    <style>{`@keyframes cat-sun{0%,100%{opacity:.75}50%{opacity:1}}`}</style>
                </div>
            )}
            {stroll?.under && desk && (
                // столешница и передние ножки — поверх котика, пока он идёт под стол, лежит там и уходит
                // eslint-disable-next-line @next/next/no-img-element
                <img src={desk.src} alt="" draggable={false} className="pointer-events-none absolute select-none" style={{ ...placeStyle(desk.p), zIndex: DESK_FRONT_Z }} />
            )}
            {/* облачко и сердечки — над котиком там, где он сейчас (на коробке или в точке прогулки) */}
            {!bare && !stroll?.walking && (react === 'pet' || react === 'happy') && <><Hearts key={reactKey.current} x={talkAt.x} y={talkAt.y + 1} /><Bubble x={talkAt.x + 30} y={talkAt.y}>{say}</Bubble></>}
            {!bare && !stroll?.walking && react === 'meow' && <Bubble key={reactKey.current} x={talkAt.x + 34} y={talkAt.y}>{say}</Bubble>}
            {!bare && night && dreamIdx !== null && (
                <Dream x={BED.x + 40} y={BED.y - 100} dream={DREAMS[dreamIdx]} onNext={nextDream} onClose={() => setDreamIdx(null)} />
            )}
            {night && (
                <motion.span className="pointer-events-none absolute font-black text-[#C9D3FF]" style={{ left: pct(BED.x + 30), top: pct(BED.y - 80), zIndex: 1160, fontSize: '3cqw' }}
                    animate={{ y: ['0cqw', '-3cqw'], opacity: [0, 1, 0] }} transition={{ duration: 2.4, repeat: Infinity }}>Zzz</motion.span>
            )}
        </>
    )
}
