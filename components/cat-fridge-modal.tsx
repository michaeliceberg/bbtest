'use client'

// components/cat-fridge-modal.tsx
//
// Холодильник котика изнутри: открывается окном поверх ангара по нажатию на починенный холодильник.
// Внутри — картинка Leonardo, поверх кодом: наледь, снежинки, пасхалка «SG was here».
// На полках еда (lib/catFood.ts): купленная — цветная со счётчиком, не купленная — силуэт. Под каждой — цена в монетах
// (Lottie-монета, как в шапке); нажал — покупка на сервере (actions/cat.ts buyCatFood).

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import Lottie from '@/components/lottie-player'
import LottieCoins from '@/public/Lottie/LottieCoins.json'
import { buyCatFood, feedCat } from '@/actions/cat'
import { reportAchievement } from '@/lib/achievementsClient'
import { catNameGenitive } from '@/lib/catName'
import { FeedDesignC } from '@/components/cat-feed-designs'
import { CAT_FOOD, CAT_FEED_BELOW, type CatFood, type CatFoodStock } from '@/lib/catFood'
import { playJustClick, playSound, preloadSound, CASE_PRIZE_SOUND, FRIDGE_SPARK_SOUND, FRIDGE_SPARK_VOLUME, WRONG_ANSWER_SOUND } from '@/lib/sound'


// Контур камеры холодильника, снятый с самой картинки (в %): затемнение при мигании лампы не вылезает за скруглённые углы.
const FRIDGE_CHAMBER_CLIP = 'polygon(13.7% 43.8%, 13.9% 37.2%, 14.4% 16.4%, 15.8% 14.2%, 19.1% 13.3%, 80.9% 13.3%, 84.2% 14.2%, 85.4% 16.4%, 85.9% 35.0%, 86.0% 43.8%, 86.0% 56.9%, 85.9% 63.5%, 85.7% 67.8%, 85.4% 74.4%, 85.1% 78.8%, 84.9% 81.0%, 81.3% 86.2%, 79.2% 86.8%, 75.0% 87.2%, 70.7% 87.5%, 66.5% 87.7%, 60.1% 88.0%, 55.9% 88.1%, 45.3% 88.1%, 41.0% 88.0%, 30.4% 87.5%, 28.3% 87.4%, 24.0% 87.1%, 21.9% 86.9%, 19.8% 86.5%, 17.7% 86.0%, 14.7% 81.0%, 14.3% 74.4%, 13.9% 63.5%, 13.7% 56.9%)'

// снежинки: место по x, размер, длительность и задержка (фиксированные — без рассинхрона сервера и браузера)
const FLAKES = Array.from({ length: 16 }, (_, i) => ({
    x: (i * 37) % 100, s: 10 + ((i * 7) % 4) * 4, d: 6 + ((i * 5) % 5), delay: -((i * 1.3) % 8),
}))

export function CatFridgeModal({ stock, onBought, onClose, offline, catName, satiety = 0, feedStreak = 0, onFed }: {
    /** Сытость котика сейчас, 0…1: кормить можно, пока меньше половины. */
    satiety?: number
    /** Сколько дней подряд кормили. */
    feedStreak?: number
    /** Покормили: что, сколько осталось, новая серия. */
    onFed?: (kind: CatFood, left: number, streak: number, satiety: number) => void
    /** Имя котика — в заголовке «Холодильник Мурзика». */
    catName?: string | null
    stock: CatFoodStock
    onBought: (kind: CatFood, count: number) => void
    onClose: () => void
    /** Тестовая страница: покупка без сервера. */
    offline?: boolean
}) {
    const [busy, setBusy] = useState<CatFood | null>(null)
    const [noCoins, setNoCoins] = useState<CatFood | null>(null)
    const [sgTapped, setSgTapped] = useState(false)
    const [feeding, setFeeding] = useState(false)
    // что сейчас падает в миску: котик «ест» ~1,1 с, потом окно закрывается и котик доедает в ангаре
    const [eating, setEating] = useState<CatFood | null>(null)
    const full = satiety >= CAT_FEED_BELOW
    const feed = async (kind: CatFood) => {
        if (feeding || full || stock[kind] <= 0) return
        playJustClick()
        setFeeding(true)
        const [r] = await Promise.all([
            offline ? { ok: true, streak: feedStreak + 1, left: stock[kind] - 1, satiety: Math.min(1, satiety + CAT_FOOD[kind].gain / 100) } : feedCat(kind),
            (setEating(kind), new Promise((res) => setTimeout(res, 1100))),
        ])
        setFeeding(false); setEating(null)
        if (!r.ok || r.left === undefined || r.streak === undefined || r.satiety === undefined) { playSound(WRONG_ANSWER_SOUND); return }
        playSound(CASE_PRIZE_SOUND)
        onFed?.(kind, r.left, r.streak, r.satiety)
    }
    // Лампочка изредка барахлит, как старая лампа: каждый раз по-разному — короткая дрожь из 2–4 вспышек,
    // одно долгое затухание (~0,35 с) или «почти погасла» (тускнеет не до конца). dark — насколько темно, 0…1.
    // Каждое мигание трещит электричеством: сколько раз мигнула — столько и щелчков.
    const [dark, setDark] = useState(0)
    useEffect(() => {
        let alive = true
        const timers: ReturnType<typeof setTimeout>[] = []
        const at = (ms: number, v: number) => timers.push(setTimeout(() => alive && setDark(v), ms))
        const flick = (ms: number, v: number) => timers.push(setTimeout(() => {
            if (!alive) return
            setDark(v)
            if (!document.hidden) playSound(FRIDGE_SPARK_SOUND, FRIDGE_SPARK_VOLUME)
        }, ms))
        preloadSound(FRIDGE_SPARK_SOUND)
        const loop = () => {
            let t = 5000 + Math.random() * 8000
            const kind = Math.random()
            if (kind < 0.35) {
                // долгое затухание: гаснет, держится ~треть секунды, моргнув, загорается
                flick(t, 1); t += 280 + Math.random() * 120
                at(t, 0.35); t += 60; flick(t, 1); t += 70
            } else if (kind < 0.6) {
                // почти погасла и не сразу ожила
                flick(t, 0.6); t += 150; at(t, 0.85); t += 120
            } else {
                // дрожь: 2–4 вспышки разной длины и глубины
                const n = 2 + Math.floor(Math.random() * 3)
                for (let i = 0; i < n; i++) {
                    flick(t, 0.7 + Math.random() * 0.3); t += 40 + Math.random() * 110
                    at(t, Math.random() < 0.3 ? 0.25 : 0); t += 40 + Math.random() * 90
                }
            }
            at(t, 0)
            timers.push(setTimeout(() => alive && loop(), t + 50))
        }
        loop()
        return () => { alive = false; timers.forEach(clearTimeout) }
    }, [])
    const buy = async (kind: CatFood) => {
        if (busy) return
        playJustClick()
        setBusy(kind); setNoCoins(null)
        const r = offline ? { ok: true, count: stock[kind] + 1 } : await buyCatFood(kind)
        setBusy(null)
        if (!r.ok || r.count === undefined) { setNoCoins(kind); playSound(WRONG_ANSWER_SOUND); return }
        playSound(CASE_PRIZE_SOUND)
        onBought(kind, r.count)
    }

    // Продукт стоит на полке (низ картинки — на линии полки). Куплено 2–3 — стоят рядом в один ряд на той же линии
    // (молоко — пакеты чуть заходят друг за друга, колбаски — горкой), ряд всегда по центру над ценником.
    // Больше трёх — видно три, справа снизу число. Купил ещё — весь ряд пружинит (bounce).
    const item = (kind: CatFood, w: number) => {
        const f = CAT_FOOD[kind]
        const n = stock[kind]
        const shown = Math.max(1, Math.min(n, 3))
        const pile = kind === 'sausage' || kind === 'fish'
        // ширина одного пакета в % колонки: чем больше пакетов, тем чуть меньше, чтобы ряд влезал
        // (сметанка и так низкая, чтобы стоять под полкой: ряд из трёх банок влезает без уменьшения)
        const size = pile || kind === 'sourcream' ? w : w * [1, 0.8, 0.68][shown - 1]
        return (
            <div className="relative flex h-full items-end justify-center">
                <motion.div key={`${kind}-${n}`} className="relative flex h-full w-full items-end justify-center"
                    initial={n > 0 ? { scale: 0.75, y: -10 } : false} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 11 }}>
                    {pile ? (
                        // колбаски — горкой: нижняя на полке, следующие лежат сверху чуть со сдвигом
                        <div className="relative flex h-full items-end justify-center" style={{ width: `${size}%` }}>
                            {Array.from({ length: shown }, (_, i) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img key={i} src={f.src} alt={i === 0 ? f.title : ''} draggable={false} className="select-none"
                                    style={{ width: '100%', position: i === 0 ? 'relative' : 'absolute', left: i === 0 ? undefined : `${i * 6}%`, bottom: i === 0 ? undefined : `${i * (kind === 'fish' ? 12 : 22)}%`,
                                        zIndex: shown - i, filter: n > 0 ? (i > 0 ? `brightness(${1 - i * 0.08})` : undefined) : 'brightness(0) opacity(0.22)' }} />
                            ))}
                        </div>
                    ) : (
                        // молоко — в ряд на одной линии: каждый следующий пакет чуть заходит за предыдущий; число — справа снизу от ряда
                        <div className="relative flex h-full w-full items-end justify-center">
                            {Array.from({ length: shown }, (_, i) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img key={i} src={f.src} alt={i === 0 ? f.title : ''} draggable={false} className="max-h-full min-w-0 select-none"
                                    style={{ width: `${size}%`, marginLeft: i === 0 ? 0 : `-${size * 0.38}%`, zIndex: shown - i, position: 'relative',
                                        filter: n > 0 ? (i > 0 ? `brightness(${1 - i * 0.08})` : undefined) : 'brightness(0) opacity(0.22)' }} />
                            ))}
                        </div>
                    )}
                    {n > 3 && (
                        <span className="absolute bottom-0 z-10 rounded-md bg-white/85 px-1 text-sm font-black leading-tight text-[#3A2A1E]"
                            style={{ left: `calc(50% + ${(pile ? size : size * (1 + 2 * 0.62)) / 2}% - 4px)` }}>{n}</span>
                    )}
                </motion.div>
            </div>
        )
    }
    // подпись и ценник на краю полки (маленькие, чтобы не закрывать нижнюю полку): цена + монета, нажал — купить
    const tag = (kind: CatFood) => (
        <div className="flex flex-col items-center gap-0.5">
            <span className="rounded bg-[#FFF6E4]/90 px-1.5 text-[11px] font-black leading-tight text-[#3A2A1E]">{CAT_FOOD[kind].title} +{CAT_FOOD[kind].gain}</span>
            <button type="button" onClick={() => void buy(kind)} disabled={busy !== null} aria-label={`Купить: ${CAT_FOOD[kind].title}`}
                className="flex items-center gap-0.5 rounded-lg border-b-4 border-[#CDBB98] bg-[#FFF6E4] py-0.5 pl-2 pr-0.5 text-sm font-black text-[#3A2A1E] shadow-md active:border-b-0 disabled:opacity-70">
                {CAT_FOOD[kind].price}
                <Lottie animationData={LottieCoins} loop autoplay className="-my-2 h-7 w-7 -translate-y-[14%]" />
            </button>
            {noCoins === kind && <span className="mt-1 text-xs font-bold text-[#B23A32]">Не хватает монет</span>}
        </div>
    )

    // Внутренность холодильника — картинка Leonardo (public/hangar/life/cat-fridge-inside.webp, 707×914, высокий, наледь
    // и сосульки уже нарисованы; исходник docs/hangar/leonardo/cat-fridge-inside-2.webp). Координаты — % этой картинки:
    // камера x 14.4–85.1%, y 13.5–88%; полки — верх 34.4%, 49.8%, 64%; низ нижней 71%; лампочка (50%, 16%).
    // Продукты — на верхней и нижней полке, подписи и ценники — на краю полок. Лампочка иногда мигает — всё внутри на миг тускнеет.
    // Продукты нижнего ряда стоят строго под средней полкой (её край кончается на 55,5%), поэтому они мельче и не перекрывают её.
    // Пасхалка «SG was here» нацарапана на дне холодильника, справа.
    return (
        <div className="fixed inset-0 z-[3000] flex justify-center overflow-y-auto bg-black/65 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                className="my-auto w-full max-w-[340px]" onClick={(e) => e.stopPropagation()}>
                <div className="mb-2 text-center text-lg font-black text-[#FFF1D6]">Холодильник {catNameGenitive(catName)}</div>
                <div className="relative w-full overflow-hidden" style={{ aspectRatio: '707 / 914' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/hangar/life/cat-fridge-inside.webp" alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none" />
                    {/* свет лампочки */}
                    <span className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-75"
                        style={{ left: '50%', top: '17%', width: '60%', height: '22%', opacity: 0.8 * (1 - dark), mixBlendMode: 'screen',
                            background: 'radial-gradient(closest-side, rgba(255,246,200,0.75), rgba(255,240,190,0.25) 55%, transparent)' }} />
                    {/* пасхалка: нажал на нацарапанную надпись — ачивка «Сол Гудман был здесь!» (в зале ачивок — кусочек пиццы) */}
                    <button type="button" aria-label="SG was here" onClick={() => { playJustClick(); setSgTapped(true); if (!offline) reportAchievement('fridge_sg') }}
                        className="absolute" style={{ left: '57%', top: '80.5%', width: '24%', height: '6%' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/hangar/life/cat-fridge-sg.webp" alt="" draggable={false} className="pointer-events-none h-full w-full select-none object-contain"
                            style={{ rotate: '-4deg', opacity: sgTapped ? 0.9 : 0.7, mixBlendMode: 'multiply', transition: 'opacity .3s' }} />
                    </button>
                    {/* верхняя полка: молочко и колбаска; подписи и ценники — на её краю */}
                    <div className="absolute grid grid-cols-2" style={{ left: '20%', width: '60%', top: '13.8%', height: '20.8%' }}>
                        {item('milk', 51)}
                        {item('sausage', 72)}
                    </div>
                    <div className="absolute grid grid-cols-2" style={{ left: '20%', width: '60%', top: '35%' }}>
                        {tag('milk')}
                        {tag('sausage')}
                    </div>
                    {/* нижняя полка: сметанка и рыбка */}
                    <div className="absolute grid grid-cols-2" style={{ left: '20%', width: '60%', top: '55.8%', height: '10.7%' }}>
                        {item('sourcream', 37)}
                        {item('fish', 57)}
                    </div>
                    <div className="absolute grid grid-cols-2" style={{ left: '20%', width: '60%', top: '67%' }}>
                        {tag('sourcream')}
                        {tag('fish')}
                    </div>
                    {/* снежинки — внутри камеры */}
                    <div className="pointer-events-none absolute overflow-hidden" style={{ left: '14.4%', top: '13.5%', width: '70.7%', height: '74.5%' }}>
                        {FLAKES.map((f, i) => (
                            <span key={i} className="cat-fridge-flake absolute top-0 select-none text-white"
                                style={{ left: `${f.x}%`, fontSize: f.s * 0.8, animationDuration: `${f.d}s`, animationDelay: `${f.delay}s` }}>❄</span>
                        ))}
                    </div>
                    {/* лампочка мигнула — всё внутри на миг тускнеет; zIndex выше продуктов (у пакетов свой zIndex 1–3, иначе они рисовались поверх тени) */}
                    <div className="pointer-events-none absolute transition-opacity duration-75"
                        style={{ inset: 0, clipPath: FRIDGE_CHAMBER_CLIP, background: 'rgba(12,20,32,0.55)', opacity: dark, zIndex: 30 }} />
                </div>
                {/* кормление: пока сытость меньше половины; каждая порция добавляет свои проценты; серия — по дням */}
                <div className="mt-3">
                    <FeedDesignC catName={catName?.trim() || 'Котик'} satiety={satiety} stock={stock} feedStreak={feedStreak} eating={eating} onFeed={(k) => void feed(k)} />
                </div>
                <button type="button" onClick={onClose} aria-label="Закрыть холодильник"
                    className="mx-auto mt-3 flex items-center gap-1.5 rounded-xl border-2 border-b-4 border-[#3A2A1E] bg-[#FFF6E4] px-4 py-2 text-base font-black text-[#3A2A1E] active:border-b-0">
                    <X className="h-4 w-4" strokeWidth={3} />Закрыть холодильник
                </button>
                <style>{`
                    .cat-fridge-flake { animation-name: cat-fridge-fall; animation-timing-function: linear; animation-iteration-count: infinite; opacity: 0; text-shadow: 0 0 4px rgba(150,200,255,.8) }
                    @keyframes cat-fridge-fall { 0% { transform: translate(0,-20px) rotate(0); opacity: 0 } 10% { opacity: .9 } 90% { opacity: .8 } 100% { transform: translate(14px,340px) rotate(220deg); opacity: 0 } }
                    @media (prefers-reduced-motion: reduce) { .cat-fridge-flake { animation: none; display: none } }
                `}</style>
            </motion.div>
        </div>
    )
}
