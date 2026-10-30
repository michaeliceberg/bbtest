'use client'

// components/hangar-cat.tsx
//
// Рыжий котик в ангаре (user_progress.cat_stage).
// 1 — выглядывает из-за левой стойки ворот и мяукает «Мяу?». Нажали — «Погладить» или «Подманить колбаской»,
//     котик выходит, бежит по полу к картонке и садится там (сервер: bringCatHome, cat_stage 1 → 2).
// 2 — живёт на картонке: сидит и моргает, иногда мяукает; ночью спит клубком; по нажатию мурчит.
// Картинки — public/hangar/life/cat-*.webp (Leonardo, исходники docs/hangar/leonardo/cat-*.png), все в одном масштабе:
// размер позы в сцене = исходный размер (CAT_PX) × масштаб глубины. Координаты сцены — 1024×1024, точка = низ по центру.

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { bringCatHome } from '@/actions/cat'
import { useAchievementUnlockStore } from '@/store/use-achievement-unlock-store'
import { playSound, playJustClick, CASE_PRIZE_SOUND } from '@/lib/sound'

type Pose = 'peek' | 'walk-1' | 'walk-2' | 'meow' | 'pet' | 'sniff' | 'sleep' | 'sit' | 'sit-half' | 'sit-closed' | 'sit-shy'

// Размер позы в исходных пикселях (обрезка по картинке, до уменьшения).
const CAT_PX: Record<Pose, [number, number]> = {
    peek: [536, 651], 'walk-1': [767, 659], 'walk-2': [767, 659], meow: [648, 750], pet: [611, 764], sniff: [632, 727],
    sleep: [672, 453], sit: [626, 755], 'sit-half': [626, 755], 'sit-closed': [626, 755], 'sit-shy': [627, 635],
}
const src = (p: Pose) => `/hangar/life/cat-${p}.webp`

// Точки сцены: у правой стойки ворот (далеко — мельче; слева от ворот стоит бочка) и картонка на полу перед ракетой.
// Котик выглядывает из-за стойки справа и бежит к картонке влево — все картинки отражены (нарисованы «вправо»).
const GATE = { x: 660, y: 660, k: 0.13 }
const BED = { x: 548, y: 852, k: 0.13 }
const PATH = [GATE, { x: 640, y: 710, k: 0.112 }, { x: 595, y: 780, k: 0.12 }, BED]
const WALK_S = 3.4
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
const BOX = { w: 150, h: 108 }
function Cardboard() {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/hangar/life/cat-cardboard.webp" alt="" draggable={false} className="pointer-events-none absolute select-none"
            style={{ left: pct(BED.x - BOX.w / 2 + 6), top: pct(BED.y + 52 - BOX.h), width: pct(BOX.w), height: pct(BOX.h), zIndex: 205 }} />
    )
}

/** Колбаска (Leonardo, cat-sausage). */
const Sausage = ({ size = 9 }: { size?: number }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/hangar/life/cat-sausage.webp" alt="" draggable={false} className="block select-none" style={{ width: `${size}cqw` }} />
)

export function HangarCat({ stage, bare, night, onHome }: {
    stage: number
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
    const [react, setReact] = useState<'pet' | 'meow' | null>(null)
    const [meowShown, setMeowShown] = useState(true)
    const reactKey = useRef(0)
    const router = useRouter()

    useEffect(() => { if (stage >= 2) setPhase((p) => (p === 'peek' ? 'home' : p)) }, [stage])

    // у входа «Мяу?» то появляется, то пропадает
    useEffect(() => {
        if (phase !== 'peek') return
        const t = setInterval(() => setMeowShown((v) => !v), 2600)
        return () => clearInterval(t)
    }, [phase])

    // кадры ходьбы
    useEffect(() => {
        if (phase !== 'walk') return
        const t = setInterval(() => setStep((s) => 1 - s), 170)
        return () => clearInterval(t)
    }, [phase])

    // дома иногда мяукает сам
    useEffect(() => {
        if (phase !== 'home' || bare || night) return
        const t = setInterval(() => { if (Math.random() < 0.35) { reactKey.current++; setReact('meow') } }, 14000)
        return () => clearInterval(t)
    }, [phase, bare, night])
    useEffect(() => {
        if (!react) return
        const t = setTimeout(() => setReact(null), react === 'pet' ? 1800 : 1200)
        return () => clearTimeout(t)
    }, [react])

    const blink = useBlink(phase === 'home' && !react && !night)

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
        const frames = PATH.map((p) => box('walk-1', p))
        return (
            <>
                <Cardboard />
                <motion.div className="pointer-events-none absolute" style={{ zIndex: 215 }}
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
    const pose: Pose = night ? 'sleep' : react === 'pet' ? 'pet' : react === 'meow' ? 'meow' : blink
    const allSit: Pose[] = ['sit', 'sit-half', 'sit-closed', 'pet', 'meow', 'sleep']
    return (
        <>
            <Cardboard />
            <button type="button" aria-label="Котик" disabled={bare}
                className="absolute cursor-pointer disabled:cursor-default"
                style={{ ...box(pose, BED), zIndex: 215 }}
                onClick={() => { playJustClick(); reactKey.current++; setReact(Math.random() < 0.65 ? 'pet' : 'meow') }}>
                <CatImg pose={pose} poses={allSit} />
            </button>
            {!bare && react === 'pet' && <><Hearts key={reactKey.current} x={BED.x} y={BED.y - 95} /><Bubble x={BED.x + 30} y={BED.y - 96}>Мрр-мрр</Bubble></>}
            {!bare && react === 'meow' && <Bubble key={reactKey.current} x={BED.x + 34} y={BED.y - 96}>Мяу!</Bubble>}
            {night && (
                <motion.span className="pointer-events-none absolute font-black text-[#C9D3FF]" style={{ left: pct(BED.x + 30), top: pct(BED.y - 80), zIndex: 1160, fontSize: '3cqw' }}
                    animate={{ y: ['0cqw', '-3cqw'], opacity: [0, 1, 0] }} transition={{ duration: 2.4, repeat: Infinity }}>Zzz</motion.span>
            )}
        </>
    )
}
