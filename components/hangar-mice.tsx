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
import { playJustClick, playSound, playSoundTracked, preloadSound, CAT_MEW_SOUNDS, MICE_SIREN_SOUND, MICE_SIREN_VOLUME } from '@/lib/sound'
import { Siren } from 'lucide-react'
import type { MiceLoot } from '@/lib/catMice'
import Lottie from '@/components/lottie-player'
import LottieCoins from '@/public/Lottie/LottieCoins.json'
import LottieGems from '@/public/Lottie/LottieGems.json'
import { MICE_DECOR, placeAnyState, placeStyle, type LayoutOverrides } from '@/lib/hangarModel'

export type MiceScene = 'peek' | 'raid' | 'catch'

const pct = (v: number) => `${(v / 1024) * 100}%`

// норка — место из редактора (MICE_DECOR 'mouse-hole'); вход (низ арки по центру) — доля картинки куска стены
const HOLE_MOUTH = { dx: 0.28, dy: 0.2 }
// мышка в норке — в перспективе стены, как сама норка: стена справа уходит вниз к зрителю (skewY > 0), слева — наоборот
const WALL_SKEW = 20
const WALL_SQUASH = 0.85
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
const mouseW = (y: number, holeY: number) => Math.max(40, Math.min(66, 46 + ((y - holeY) / 100) * 10))

// Что пищит мышка, когда её засекли (случайная фраза; шутки про физику и математику).
const CAUGHT_PHRASES = [
    'Пи! Меня засекли!',
    'Я тут просто π считаю…',
    'Пи = 3,14… дальше не помню!',
    'Я не мышь, я точка на графике!',
    'Тсс! Я в суперпозиции',
    'Ты меня не видел. Я — мнимая единица',
    'Я просто стремлюсь к нулю…',
    'Кратчайший путь — прямо в норку!',
    'Скорость — производная от страха!',
    'Норка — начало моих координат',
    'Не трогай, я корень уравнения!',
    'Мой вектор направлен к сыру',
    'Я не ворую, я перераспределяю',
    'Ищу экстремум… сыра',
    'Сработал закон сохранения мышки',
    'Не говори котику!',
    'Сыр делится на всё, кроме котика',
    'Я тут на подготовке к ЕГЭ',
    'Мышь Шрёдингера: я есть и меня нет',
    'Сила трения тянет меня в норку!',
    'Пи-пи-пи! Это не сигнал, это я',
    'Мой IQ — целое число сыров',
]
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
// котик отпускает пойманную мышку
const CATCH_PHRASES = ['Мяу! Ещё раз — и сыра не будет!', 'Мяу! Беги, пока я добрый', 'Мяу! Сундук под охраной', 'Мяу! Иди учи физику', 'Мяу! Это мой ангар']

type Pose = 'run' | 'stand' | 'carry' | 'peek'
type MouseState = { x: number; y: number; pose: Pose; flip: boolean; dur: number; show: boolean }
type CatState = { pose: 'pounce' | 'caught'; x: number; y: number; w: number; dur: number; flip: boolean } | null

function boxAt(x: number, y: number, w: number, r: number) {
    return { left: pct(x - w / 2), top: pct(y - w * r), width: pct(w), height: pct(w * r) }
}

/** Добыча над головой мышки (одна картинка мышки на любую добычу): кусочек пиццы, гем или монета. */
function Loot({ kind }: { kind: MiceLoot }) {
    if (kind === 'pizza') return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/pizzaSVG/pizza_8_1.svg" alt="" draggable={false} className="h-full w-full select-none drop-shadow-[0_3px_0_rgba(0,0,0,0.35)]" />
    )
    // монета в LottieCoins нарисована внизу холста и мелко — увеличиваем и поднимаем
    if (kind === 'gems') return <Lottie animationData={LottieGems} className="h-full w-full" />
    return <Lottie animationData={LottieCoins} className="h-full w-full" style={{ transform: 'scale(2.2) translateY(-14%)' }} />
}

export type MiceEventView = { id: number; kind: 'raid' | 'catch'; lootKind: MiceLoot; resolved: boolean; resolvedAt?: string | null }

export function HangarMice({ scene, auto = false, chest: showChest = true, offline = false, bare = false, layout, onDone, event = null, onEventStart, onEventDone, fedAt = null }: {
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
    /** Расстановка из редактора (место норки и сундука). */
    layout?: LayoutOverrides | null
    /** Событие дня (lib/catMice.ts): кража играет сама при заходе; поимка — котик сидит с мышкой, пока не нажмут. */
    event?: MiceEventView | null
    /** Кража началась (котик спит, холодильник закрыт). */
    onEventStart?: () => void
    /** Событие досмотрено: сервер его помечает и выдаёт ачивку. */
    onEventDone?: (ev: MiceEventView) => void
    /** Когда котика кормили последний раз: покормили после кражи — сундук закрывается. */
    fedAt?: string | null
}) {
    const holeP = placeAnyState(layout, 'b', MICE_DECOR[0])
    const HOLE = { x: holeP.x - holeP.w / 2 + holeP.w * (0.5 + HOLE_MOUTH.dx), y: holeP.y - holeP.h * HOLE_MOUTH.dy }
    const holeK = holeP.w / 96 // окошко выглядывания растёт вместе с норкой
    const skew = holeP.x > 512 ? WALL_SKEW : -WALL_SKEW
    const catchP = placeAnyState(layout, 'b', MICE_DECOR[1])
    const chestP = placeAnyState(layout, 'b', MICE_DECOR[2])
    const CHEST = { x: chestP.x, y: chestP.y - chestP.h * (1 - CHEST_BODY_BOTTOM), w: chestP.w }
    const [mouse, setMouse] = useState<MouseState>({ ...HOLE, pose: 'peek', flip: false, dur: 0, show: false })
    const [peekUp, setPeekUp] = useState(false)
    const [look, setLook] = useState(false)
    const [step, setStep] = useState(0)
    // сундук ограблен — стоит открытым и пустым, пока котика не покормят после кражи
    const robbedAt = useRef<number | null>(event?.kind === 'raid' && event.resolved ? (event.resolvedAt ? Date.parse(event.resolvedAt) : Date.now()) : null)
    const fedAfterRaid = (t: number | null) => t !== null && !!fedAt && Date.parse(fedAt) > t
    const [chest, setChest] = useState<'closed' | 'open' | 'robbed'>(robbedAt.current !== null && !fedAfterRaid(robbedAt.current) ? 'robbed' : 'closed')
    const [slam, setSlam] = useState(0)
    useEffect(() => {
        if (chest === 'robbed' && fedAfterRaid(robbedAt.current)) { robbedAt.current = null; setChest('closed'); setSlam((n) => n + 1) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fedAt, chest])
    const [loot, setLoot] = useState<MiceLoot | false>(false)
    const [siren, setSiren] = useState(false)
    // поимка: котик сидит с мышкой (holding) → нажали: мяу, отпустил (released) → мышка в норке, котик ушёл домой (null)
    const [catchSt, setCatchSt] = useState<'holding' | 'released' | null>(event?.kind === 'catch' && !event.resolved && !bare ? 'holding' : null)
    const [cat, setCat] = useState<CatState>(null)
    const [say, setSay] = useState<{ x: number; y: number; text: string } | null>(null)
    const busy = useRef(false)
    const timers = useRef<ReturnType<typeof setTimeout>[]>([])
    const onDoneRef = useRef(onDone)
    onDoneRef.current = onDone
    // конец кражи дня: отдельный ref — onDoneRef перезаписывается пропом на каждой перерисовке
    const eventDoneRef = useRef<(() => void) | null>(null)

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
    const finish = (t: number) => later(t, () => {
        busy.current = false
        const ev = eventDoneRef.current
        eventDoneRef.current = null
        if (ev) ev()
        onDoneRef.current?.()
    })

    const play = (kind: MiceScene, lootKind: MiceLoot = null) => {
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
            later(t + 1300, () => { setSay(null); setLoot(lootKind ?? 'coins'); setMouse((m) => ({ ...m, pose: 'carry', flip: false })) })
            t = runTo(t + 1700, atChest, HOLE, 'carry', 95)
            later(t, () => { setMouse((m) => ({ ...m, show: false })); setLoot(false); robbedAt.current = Date.now(); setChest('robbed') })
            finish(t + 300)
            return
        }
        // catch
        setChest('closed')
        let t = peek(200, 1400)
        const mid = { x: Math.round(HOLE.x - 130), y: Math.round(HOLE.y + 50) } // от норки к зрителю — котик успевает прыгнуть
        later(t, () => setMouse({ ...HOLE, pose: 'run', flip: true, dur: 0, show: true }))
        t = runTo(t + 50, HOLE, mid, 'run', 90)
        // котик прыгает слева на мышку
        const from = { x: mid.x - 280, y: mid.y + 60 }
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

    useEffect(() => { if (scene) play(scene.kind, scene.kind === 'raid' ? 'coins' : null) }, [scene?.key]) // eslint-disable-line react-hooks/exhaustive-deps

    // кража дня: играет сама вскоре после захода в ангар, с сиреной; после — событие досмотрено
    const eventStarted = useRef(false)
    // тихая сирена звучит, пока идёт кража (siren), и обрывается, когда мышь скрылась в норке
    useEffect(() => {
        if (!siren) return
        const stop = playSoundTracked(MICE_SIREN_SOUND, undefined, MICE_SIREN_VOLUME)
        return stop
    }, [siren])
    useEffect(() => {
        if (!bare && event?.kind === 'raid' && !event.resolved) preloadSound(MICE_SIREN_SOUND)
    }, [event?.id, bare]) // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (bare || !event || event.resolved || event.kind !== 'raid' || eventStarted.current) return
        // флаг — только когда таймер сработал: в dev React дважды запускает эффект и первый таймер отменяет
        const t = setTimeout(() => {
            if (eventStarted.current) return
            eventStarted.current = true
            onEventStart?.()
            setSiren(true)
            eventDoneRef.current = () => { setSiren(false); onEventDone?.(event) }
            play('raid', event.lootKind)
        }, 1500)
        return () => clearTimeout(t)
    }, [event?.id, bare]) // eslint-disable-line react-hooks/exhaustive-deps

    // нажали на котика с мышкой: мяукнул, отпустил — мышка удирает в норку, котик идёт домой
    const releaseMouse = () => {
        if (catchSt !== 'holding' || !event) return
        playSound(pick(CAT_MEW_SOUNDS))
        clearAll()
        busy.current = true
        setCatchSt('released')
        setSay({ x: catchP.x, y: catchP.y - catchP.h - 4, text: pick(CATCH_PHRASES) })
        const from = { x: catchP.x + catchP.w * 0.4, y: catchP.y }
        later(1200, () => { setSay(null); setMouse({ ...from, pose: 'run', flip: from.x > HOLE.x, dur: 0, show: true }) })
        const t = runTo(1250, from, HOLE, 'run', 200)
        later(t, () => setMouse((m) => ({ ...m, show: false })))
        later(t + 400, () => { setCatchSt(null); busy.current = false; onEventDone?.(event) })
    }

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
        setSay({ x: HOLE.x, y: HOLE.y - 40 * holeK, text: pick(CAUGHT_PHRASES) })
        later(250, () => setPeekUp(false))
        later(2600, () => setSay(null))
        later(2800, () => { setMouse((m) => ({ ...m, show: false })); busy.current = false })
        if (!offline) reportAchievement('mouse_spy')
    }

    const w = mouseW(mouse.y, HOLE.y)
    const pose = mouse.pose
    const r = pose === 'run' || pose === 'stand' ? IMG.run.r : IMG[pose].r
    return (
        <>
            {/* норка в стене: поверх фона, под всем на полу */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hangar/life/mouse-hole.webp" alt="" draggable={false} className="pointer-events-none absolute select-none"
                style={{ ...placeStyle(holeP), zIndex: 2 }} />
            {/* сундук с богатством: три картинки в одной рамке, видна одна */}
            {showChest && <motion.div key={slam} className="pointer-events-none absolute" style={{ ...placeStyle(chestP), transformOrigin: '50% 100%' }}
                initial={slam ? { scaleY: 0.82, scaleX: 1.08 } : false} animate={{ scaleY: 1, scaleX: 1 }} transition={{ type: 'spring', stiffness: 520, damping: 9 }}>
                {(['closed', 'open', 'robbed'] as const).map((c) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={c} src={`/hangar/life/loot-chest-${c}.webp`} alt="" draggable={false}
                        className="absolute inset-0 h-full w-full select-none transition-opacity duration-300" style={{ opacity: chest === c ? 1 : 0 }} />
                ))}
            </motion.div>}
            {/* выглядывает: голова поднимается из норки, обрезана по её низу */}
            {mouse.show && pose === 'peek' && mouse.x === HOLE.x && (
                <div className={`absolute overflow-hidden ${bare ? 'pointer-events-none' : 'cursor-pointer'}`} onClick={caught}
                    style={{ left: pct(HOLE.x - 24 * holeK), top: pct(HOLE.y - 34 * holeK), width: pct(48 * holeK), height: pct(34 * holeK), zIndex: 3,
                        transform: `skewY(${skew}deg) scaleX(${WALL_SQUASH})`, transformOrigin: '50% 100%' }}>
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
                        <motion.div className="pointer-events-none absolute" style={{ left: '-70%', top: '-228%', width: '240%', aspectRatio: '1' }}
                            initial={{ scale: 0, y: 10 }} animate={{ scale: 1, y: [0, -10, 0] }} transition={{ y: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }, scale: { type: 'spring', stiffness: 400, damping: 12 } }}>
                            <Loot kind={loot} />
                        </motion.div>
                    )}
                </motion.div>
            )}
            {/* сытый котик поймал мышку: сидит с ней, пока не нажмут; потом — просто сидит, пока мышка удирает */}
            {catchSt && (
                <button type="button" aria-label="Котик поймал мышку" disabled={catchSt !== 'holding'} onClick={releaseMouse}
                    className="absolute cursor-pointer disabled:cursor-default" style={placeStyle(catchP)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={catchSt === 'holding' ? IMG.caught.src : '/hangar/life/cat-sit.webp'} alt="" draggable={false}
                        className={`absolute inset-0 h-full w-full select-none object-contain object-bottom ${catchSt === 'holding' ? 'animate-cat-proud' : ''}`} />
                </button>
            )}
            {catchSt === 'holding' && !say && (
                <div className="pointer-events-none absolute" style={{ left: pct(catchP.x), top: pct(catchP.y - catchP.h - 4), zIndex: 1160, transform: 'translate(-50%, -100%)' }}>
                    <div className="w-max max-w-[30cqw] animate-bounce rounded-xl border-2 border-[#5A3A22] bg-[#FFF6E4] px-2 py-1 text-center font-black leading-tight text-[#5A3A22] shadow-md" style={{ fontSize: '2.1cqw' }}>
                        Смотри, кого поймал! Нажми на меня
                    </div>
                </div>
            )}
            {/* сирена: мыши грабят сундук */}
            {siren && (
                <>
                    <div className="pointer-events-none absolute inset-0 animate-hangar-siren" style={{ zIndex: 1150, background: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(230,40,40,0.55))' }} />
                    <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center gap-[1cqw] rounded-full border-2 border-[#7A1010] bg-[#E53935] px-[2cqw] py-[0.8cqw] font-black uppercase text-white shadow-lg"
                        style={{ top: '9%', zIndex: 1170, fontSize: '2.6cqw' }}>
                        <Siren className="h-[3.4cqw] w-[3.4cqw] animate-pulse" /> Мыши грабят сундук!
                    </div>
                </>
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
                // у края ангара облачко уходит внутрь (прижато правым/левым краем), длинная фраза переносится
                <div className="pointer-events-none absolute" style={{ left: pct(say.x), top: pct(say.y), zIndex: 1160,
                    transform: `translate(${say.x > 760 ? '-92%' : say.x < 260 ? '-8%' : '-50%'}, -100%)` }}>
                    <motion.div key={say.text} className="w-max max-w-[30cqw] rounded-xl border-2 border-[#5A3A22] bg-[#FFF6E4] px-2 py-1 text-center font-black leading-tight text-[#5A3A22] shadow-md"
                        style={{ fontSize: '2.2cqw' }}
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 14 }}>
                        {say.text}
                    </motion.div>
                </div>
            )}
        </>
    )
}
