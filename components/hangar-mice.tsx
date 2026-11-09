'use client'

// components/hangar-mice.tsx
//
// Мыши в ангаре: норка внизу правой стены и сундук с богатством ученика на полу.
// Сцены (пока только на /test-mice):
// • peek — мышка выглядывает из норки, озирается и прячется (в режиме auto — часто, раз в 4–8 с);
// • raid — котика давно не кормили: мышка бежит к сундуку, сундук открывается, мышка уносит монету над головой
//   в норку, сундук остаётся «ограбленным» (следы лапок, монетки на полу);
// • catch — котик сыт: мышка выбегает, котик прыгает и ловит её за хвост, держит, отпускает — мышка удирает в норку
//   без добычи. Никто не страдает.
// Картинки — public/hangar/life/mouse-*.webp, cat-pounce/cat-caught-mouse, loot-chest-*.webp (Leonardo,
// промпты docs/hangar/leonardo-prompts-mice.md). Норка — кусок стены (mouse-hole.webp), вырезан из правки ангара.
// Координаты сцены — 1024×1024, точка персонажа = низ по центру. Бег — 3 кадра, выровнены по глазу.

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { reportAchievement } from '@/lib/achievementsClient'
import { playJustClick } from '@/lib/sound'
import { MICE_DECOR, placeAnyState, placeStyle, type LayoutOverrides } from '@/lib/hangarModel'

export type MiceScene = 'peek' | 'raid' | 'catch'

const pct = (v: number) => `${(v / 1024) * 100}%`

// норка: кусок стены и её «вход» (низ арки по центру)
const HOLE_IMG = { x: 901, y: 657, w: 96, h: 65 }
const HOLE = { x: 976, y: 709 }
// сундук — место из редактора /test-hangar-layout (MICE_DECOR); низ корпуса выше низа рамки (там монеты на полу)
const CHEST_BODY_BOTTOM = 0.93 // доля высоты картинки, где низ корпуса

const RUN = ['/hangar/life/mouse-run-1.webp', '/hangar/life/mouse-run-2.webp', '/hangar/life/mouse-run-3.webp']
const IMG = {
    carry: { src: '/hangar/life/mouse-carry.webp', r: 247 / 320 },
    peek: { src: '/hangar/life/mouse-peek.webp', r: 183 / 247 },
    run: { r: 165 / 320 },
    pounce: { src: '/hangar/life/cat-pounce.webp', r: 203 / 320 },
    caught: { src: '/hangar/life/cat-caught-mouse.webp', r: 338 / 320 },
}
// ширина мышки растёт к зрителю: у норки 46, на 100 точек ближе — на 10 больше
const mouseW = (y: number) => Math.max(40, Math.min(66, 46 + ((y - HOLE.y) / 100) * 10))

type Pose = 'run' | 'stand' | 'carry' | 'peek'
type MouseState = { x: number; y: number; pose: Pose; flip: boolean; dur: number; show: boolean }
type CatState = { pose: 'pounce' | 'caught'; x: number; y: number; w: number; dur: number; flip: boolean } | null

function boxAt(x: number, y: number, w: number, r: number) {
    return { left: pct(x - w / 2), top: pct(y - w * r), width: pct(w), height: pct(w * r) }
}

/** Монета над головой мышки (рисуется кодом: одна картинка мышки на любую добычу). */
function Coin() {
    return (
        <svg viewBox="0 0 20 20" className="h-full w-full">
            <ellipse cx="10" cy="10" rx="8.5" ry="8.5" fill="#F2C35B" stroke="#5A3A12" strokeWidth="1.6" />
            <ellipse cx="10" cy="10" rx="5" ry="5" fill="none" stroke="#B8862E" strokeWidth="1.2" />
        </svg>
    )
}

export function HangarMice({ scene, auto = false, chest: showChest = true, offline = false, bare = false, layout, onDone }: {
    /** Запустить сцену (меняется вместе с runKey снаружи). */
    scene?: { kind: MiceScene; key: number } | null
    /** Мышка сама часто выглядывает из норки. */
    auto?: boolean
    onDone?: () => void
    /** Сундук с богатством на полу (пока только на /test-mice). */
    chest?: boolean
    /** Тестовая страница: без сервера (ачивка не выдаётся). */
    offline?: boolean
    /** Превью ангара: мышку нельзя нажать. */
    bare?: boolean
    /** Расстановка из редактора (место сундука). */
    layout?: LayoutOverrides | null
}) {
    const chestP = placeAnyState(layout, 'a', MICE_DECOR[0])
    const CHEST = { x: chestP.x, y: chestP.y - chestP.h * (1 - CHEST_BODY_BOTTOM), w: chestP.w }
    const [mouse, setMouse] = useState<MouseState>({ ...HOLE, pose: 'peek', flip: false, dur: 0, show: false })
    const [peekUp, setPeekUp] = useState(false)
    const [look, setLook] = useState(false)
    const [step, setStep] = useState(0)
    const [chest, setChest] = useState<'closed' | 'open' | 'robbed'>('closed')
    const [loot, setLoot] = useState(false)
    const [cat, setCat] = useState<CatState>(null)
    const [say, setSay] = useState<{ x: number; y: number; text: string } | null>(null)
    const busy = useRef(false)
    const timers = useRef<ReturnType<typeof setTimeout>[]>([])
    const onDoneRef = useRef(onDone)
    onDoneRef.current = onDone

    const later = (ms: number, f: () => void) => { timers.current.push(setTimeout(f, ms)) }
    const clearAll = () => { timers.current.forEach(clearTimeout); timers.current = [] }
    useEffect(() => () => clearAll(), [])

    // кадры бега
    const running = mouse.show && mouse.pose === 'run'
    useEffect(() => {
        if (!running) return
        const t = setInterval(() => setStep((s) => (s + 1) % 3), 120)
        return () => clearInterval(t)
    }, [running])

    // выглядывание: из норки появляется голова, озирается и прячется. Возвращает время сцены.
    const peek = (t0: number, stay = 2200) => {
        later(t0, () => { setMouse({ ...HOLE, pose: 'peek', flip: false, dur: 0, show: true }); setPeekUp(true) })
        later(t0 + 700, () => setLook(true))
        later(t0 + 1300, () => setLook(false))
        later(t0 + stay, () => setPeekUp(false))
        return t0 + stay + 400
    }
    // бег из точки в точку со скоростью ~110 точек сцены в секунду
    const runTo = (t0: number, from: { x: number; y: number }, to: { x: number; y: number }, pose: Pose = 'run', speed = 110) => {
        const dur = Math.hypot(to.x - from.x, to.y - from.y) / speed
        later(t0, () => setMouse({ x: to.x, y: to.y, pose, flip: to.x < from.x, dur, show: true }))
        return t0 + dur * 1000
    }
    const finish = (t: number) => later(t, () => { busy.current = false; onDoneRef.current?.() })

    const play = (kind: MiceScene) => {
        clearAll()
        busy.current = true
        setCat(null); setSay(null); setLoot(false); setPeekUp(false); setLook(false)
        setMouse({ ...HOLE, pose: 'peek', flip: false, dur: 0, show: false })
        if (kind === 'peek') { finish(peek(200, 3600)); return }
        if (kind === 'raid') {
            setChest('closed')
            let t = peek(200, 1600)
            const atChest = { x: CHEST.x + CHEST.w * 0.55, y: CHEST.y + 14 }
            later(t, () => setMouse({ ...HOLE, pose: 'run', flip: true, dur: 0, show: true }))
            t = runTo(t + 50, HOLE, atChest)
            later(t, () => { setMouse((m) => ({ ...m, pose: 'stand', dur: 0 })); setChest('open'); setSay({ x: atChest.x, y: atChest.y - 70, text: 'Ого, богатство!' }) })
            later(t + 1300, () => { setSay(null); setLoot(true); setMouse((m) => ({ ...m, pose: 'carry', flip: false })) })
            t = runTo(t + 1700, atChest, HOLE, 'carry', 95)
            later(t, () => { setMouse((m) => ({ ...m, show: false })); setLoot(false); setChest('robbed') })
            finish(t + 300)
            return
        }
        // catch
        setChest('closed')
        let t = peek(200, 1400)
        const mid = { x: 840, y: 760 }
        later(t, () => setMouse({ ...HOLE, pose: 'run', flip: true, dur: 0, show: true }))
        t = runTo(t + 50, HOLE, mid, 'run', 90)
        // котик прыгает слева на мышку
        const from = { x: 560, y: 820 }
        later(t - 700, () => setCat({ pose: 'pounce', x: from.x, y: from.y, w: 150, dur: 0, flip: false }))
        later(t - 650, () => setCat({ pose: 'pounce', x: mid.x - 40, y: mid.y + 10, w: 150, dur: 0.65, flip: false }))
        later(t, () => { setMouse((m) => ({ ...m, show: false })); setCat({ pose: 'caught', x: mid.x - 20, y: mid.y + 12, w: 120, dur: 0, flip: false }); setSay({ x: mid.x - 20, y: mid.y - 120, text: 'Попалась! 😼' }) })
        later(t + 2200, () => setSay({ x: mid.x - 20, y: mid.y - 120, text: 'Ладно, беги…' }))
        later(t + 3200, () => { setSay(null); setCat({ pose: 'caught', x: mid.x - 20, y: mid.y + 12, w: 120, dur: 0, flip: false }) })
        // отпустил — мышка удирает в норку без добычи
        later(t + 3400, () => { setCat(null); setMouse({ x: mid.x + 30, y: mid.y, pose: 'run', flip: false, dur: 0, show: true }) })
        const t2 = runTo(t + 3450, { x: mid.x + 30, y: mid.y }, HOLE, 'run', 200)
        later(t2, () => setMouse((m) => ({ ...m, show: false })))
        finish(t2 + 300)
    }

    useEffect(() => { if (scene) play(scene.kind) }, [scene?.key]) // eslint-disable-line react-hooks/exhaustive-deps

    // сама выглядывает раз в 4–8 с
    useEffect(() => {
        if (!auto) return
        let alive = true
        let t: ReturnType<typeof setTimeout>
        const loop = () => {
            t = setTimeout(() => { if (!alive) return; if (!busy.current) play('peek'); loop() }, 6000 + Math.random() * 6000)
        }
        loop()
        return () => { alive = false; clearTimeout(t) }
    }, [auto]) // eslint-disable-line react-hooks/exhaustive-deps

    // нажали на выглядывающую мышку: «Пи!», прячется, ачивка «Агент 00-Сыр»
    const caught = () => {
        if (bare || !peekUp) return
        playJustClick()
        clearAll()
        setLook(false)
        setSay({ x: HOLE.x - 30, y: HOLE.y - 80, text: 'Пи! Меня засекли! 🙈' })
        later(250, () => setPeekUp(false))
        later(1800, () => setSay(null))
        later(2000, () => { setMouse((m) => ({ ...m, show: false })); busy.current = false })
        if (!offline) reportAchievement('mouse_spy')
    }

    const w = mouseW(mouse.y)
    const pose = mouse.pose
    const r = pose === 'run' || pose === 'stand' ? IMG.run.r : IMG[pose].r
    return (
        <>
            {/* норка в стене: поверх фона, под всем на полу */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hangar/life/mouse-hole.webp" alt="" draggable={false} className="pointer-events-none absolute select-none"
                style={{ left: pct(HOLE_IMG.x), top: pct(HOLE_IMG.y), width: pct(HOLE_IMG.w), height: pct(HOLE_IMG.h), zIndex: 2 }} />
            {/* сундук с богатством: три картинки в одной рамке, видна одна */}
            {showChest && <div className="pointer-events-none absolute" style={placeStyle(chestP)}>
                {(['closed', 'open', 'robbed'] as const).map((c) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={c} src={`/hangar/life/loot-chest-${c}.webp`} alt="" draggable={false}
                        className="absolute inset-0 h-full w-full select-none transition-opacity duration-300" style={{ opacity: chest === c ? 1 : 0 }} />
                ))}
            </div>}
            {/* выглядывает: голова поднимается из норки, обрезана по её низу */}
            {mouse.show && pose === 'peek' && mouse.x === HOLE.x && (
                <div className={`absolute overflow-hidden ${bare ? 'pointer-events-none' : 'cursor-pointer'}`} onClick={caught}
                    style={{ left: pct(HOLE.x - 24), top: pct(HOLE.y - 34), width: pct(48), height: pct(34), zIndex: 3 }}>
                    <motion.div className="absolute bottom-0 left-0 w-full" style={{ height: '100%' }}
                        animate={{ y: peekUp ? '0%' : '105%' }} initial={{ y: '105%' }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={IMG.peek.src} alt="" draggable={false} className="absolute bottom-0 left-0 w-full select-none"
                            style={{ transform: look ? 'scaleX(-1)' : undefined }} />
                    </motion.div>
                </div>
            )}
            {/* бежит / несёт добычу / стоит у сундука */}
            {mouse.show && !(pose === 'peek' && mouse.x === HOLE.x) && (
                <motion.div className="pointer-events-none absolute" style={{ zIndex: 875 }}
                    initial={false}
                    animate={boxAt(mouse.x, mouse.y, w, r)}
                    transition={{ duration: mouse.dur, ease: 'linear' }}>
                    <div className="absolute inset-0" style={{ transform: mouse.flip ? 'scaleX(-1)' : undefined }}>
                        {pose === 'run' ? RUN.map((s, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={s} src={s} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" style={{ opacity: i === step ? 1 : 0 }} />
                        )) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={pose === 'stand' ? RUN[2] : IMG[pose].src} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />
                        )}
                    </div>
                    {loot && (
                        <motion.div className="absolute" style={{ left: '38%', top: '-28%', width: '34%', aspectRatio: '1' }}
                            initial={{ scale: 0, y: 10 }} animate={{ scale: 1, y: [0, -3, 0] }} transition={{ y: { duration: 0.3, repeat: Infinity }, scale: { type: 'spring', stiffness: 400, damping: 12 } }}>
                            <Coin />
                        </motion.div>
                    )}
                </motion.div>
            )}
            {/* котик: прыжок и «поймал» */}
            {cat && (
                <motion.div className="pointer-events-none absolute" style={{ zIndex: 878 }}
                    initial={false}
                    animate={boxAt(cat.x, cat.y, cat.w, cat.pose === 'pounce' ? IMG.pounce.r : IMG.caught.r)}
                    transition={{ duration: cat.dur, ease: [0.3, 0, 0.5, 1] }}>
                    <motion.div className="absolute inset-0" animate={{ y: cat.pose === 'pounce' && cat.dur ? ['0%', '-30%', '0%'] : '0%' }} transition={{ duration: cat.dur }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cat.pose === 'pounce' ? IMG.pounce.src : IMG.caught.src} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />
                    </motion.div>
                </motion.div>
            )}
            {say && (
                // центрирование — на статичной обёртке: framer перезаписывает transform анимируемого узла
                <div className="pointer-events-none absolute -translate-x-1/2" style={{ left: pct(say.x), top: pct(say.y), zIndex: 1160 }}>
                    <motion.div key={say.text} className="whitespace-nowrap rounded-xl border-2 border-[#5A3A22] bg-[#FFF6E4] px-2 py-0.5 font-black text-[#5A3A22] shadow-md"
                        style={{ fontSize: '2.2cqw' }}
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 14 }}>
                        {say.text}
                    </motion.div>
                </div>
            )}
        </>
    )
}
