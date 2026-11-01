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
import { buyCatFood } from '@/actions/cat'
import { reportAchievement } from '@/lib/achievementsClient'
import { catNameGenitive } from '@/lib/catName'
import { CAT_FOOD, type CatFood, type CatFoodStock } from '@/lib/catFood'
import { playJustClick, playSound, CASE_PRIZE_SOUND, WRONG_ANSWER_SOUND } from '@/lib/sound'


// снежинки: место по x, размер, длительность и задержка (фиксированные — без рассинхрона сервера и браузера)
const FLAKES = Array.from({ length: 16 }, (_, i) => ({
    x: (i * 37) % 100, s: 10 + ((i * 7) % 4) * 4, d: 6 + ((i * 5) % 5), delay: -((i * 1.3) % 8),
}))

export function CatFridgeModal({ stock, onBought, onClose, offline, catName }: {
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
    // лампочка изредка мигает (раз в 6–13 с: погасла-зажглась-погасла-зажглась)
    const [dark, setDark] = useState(false)
    useEffect(() => {
        let alive = true
        const timers: ReturnType<typeof setTimeout>[] = []
        const loop = () => {
            const t = 6000 + Math.random() * 7000
            ;[[0, true], [90, false], [190, true], [260, false]].forEach(([d, v]) => timers.push(setTimeout(() => alive && setDark(v as boolean), t + (d as number))))
            timers.push(setTimeout(() => alive && loop(), t + 300))
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

    // продукт стоит на полке (низ картинки — на линии полки). Куплено 2–3 — стоят рядом друг за другом (молоко —
    // в ряд, колбаски — горкой друг на друге); больше трёх — видно три, а справа снизу число: 4, 5, 6…
    const item = (kind: CatFood, w: number) => {
        const f = CAT_FOOD[kind]
        const n = stock[kind]
        const shown = Math.max(1, Math.min(n, 3))
        const pile = kind === 'sausage'
        const size = pile ? w : w * [1, 0.86, 0.76][shown - 1]
        return (
            <div className="relative flex h-full items-end justify-center">
                {Array.from({ length: shown }, (_, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <motion.img key={`${kind}-${i}`} src={f.src} alt={i === 0 ? f.title : ''} draggable={false}
                        initial={n > 0 && i === shown - 1 ? { scale: 0.6, y: -20 } : false} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 14 }}
                        className="max-h-full select-none"
                        style={{
                            width: `${size}%`, filter: n > 0 ? (i > 0 ? `brightness(${1 - i * 0.08})` : undefined) : 'brightness(0) opacity(0.22)',
                            position: i === 0 ? 'relative' : 'absolute', zIndex: shown - i,
                            ...(i > 0 && !pile ? { left: `calc(50% - ${size / 2}% + ${i * size * 0.62}%)`, bottom: `${i * 2}%` } : {}),
                            ...(i > 0 && pile ? { left: `calc(50% - ${size / 2}% + ${i * 4}%)`, bottom: `${i * 20}%` } : {}),
                        }} />
                ))}
                {n > 3 && (
                    // число — справа снизу от ряда пакетов (ряд кончается на 50% − size/2 + 2,24·size)
                    <span className="absolute bottom-0 z-10 rounded-md bg-white/85 px-1 text-sm font-black leading-tight text-[#3A2A1E]"
                        style={{ left: `calc(${50 - size / 2 + size * (pile ? 1 : 2.24)}% + 2px)` }}>{n}</span>
                )}
            </div>
        )
    }
    // ценник на краю полки (маленький, чтобы не закрывать нижнюю полку): цена + монета, нажал — купить
    const tag = (kind: CatFood) => (
        <div className="flex flex-col items-center">
            <button type="button" onClick={() => void buy(kind)} disabled={busy !== null} aria-label={`Купить: ${CAT_FOOD[kind].title}`}
                className="flex items-center gap-0.5 rounded-lg border-b-4 border-[#B8862E] bg-[#FFE58A] py-0.5 pl-2 pr-0.5 text-sm font-black text-[#3A2A08] shadow-md active:border-b-0 disabled:opacity-70">
                {CAT_FOOD[kind].price}
                <Lottie animationData={LottieCoins} loop autoplay className="-my-2 h-7 w-7 -translate-y-[14%]" />
            </button>
            {noCoins === kind && <span className="mt-1 text-xs font-bold text-[#B23A32]">Не хватает монет</span>}
        </div>
    )

    // Внутренность холодильника — картинка Leonardo (public/hangar/life/cat-fridge-inside.webp, 707×914, высокий, наледь
    // и сосульки уже нарисованы; исходник docs/hangar/leonardo/cat-fridge-inside-2.webp). Координаты — % этой картинки:
    // камера x 14.4–85.1%, y 13.5–88%; полки — верх 34.4%, 49.8%, 64%; низ нижней 71%; лампочка (50%, 16%).
    // Продукты — на верхней полке, ценники — на её краю. Лампочка иногда мигает — всё внутри на миг тускнеет.
    // Пасхалка «SG was here» нацарапана справа между второй и третьей полкой (снизу — между нижней и второй).
    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/65 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                className="w-full max-w-[340px]" onClick={(e) => e.stopPropagation()}>
                <div className="mb-2 text-center text-lg font-black text-[#FFF1D6]">Холодильник {catNameGenitive(catName)}</div>
                <div className="relative w-full overflow-hidden" style={{ aspectRatio: '707 / 914' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/hangar/life/cat-fridge-inside.webp" alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none" />
                    {/* свет лампочки */}
                    <span className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-75"
                        style={{ left: '50%', top: '17%', width: '60%', height: '22%', opacity: dark ? 0 : 0.8, mixBlendMode: 'screen',
                            background: 'radial-gradient(closest-side, rgba(255,246,200,0.75), rgba(255,240,190,0.25) 55%, transparent)' }} />
                    {/* пасхалка: нажал на нацарапанную надпись — ачивка «Сол Гудман был здесь!» (в зале ачивок — кусочек пиццы) */}
                    <button type="button" aria-label="SG was here" onClick={() => { playJustClick(); setSgTapped(true); if (!offline) reportAchievement('fridge_sg') }}
                        className="absolute" style={{ left: '54%', top: '58.2%', width: '25%', height: '6%' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/hangar/life/cat-fridge-sg.webp" alt="" draggable={false} className="pointer-events-none h-full w-full select-none object-contain"
                            style={{ rotate: '-4deg', opacity: sgTapped ? 0.9 : 0.7, mixBlendMode: 'multiply', transition: 'opacity .3s' }} />
                    </button>
                    {/* верхняя полка: продукты стоят на ней */}
                    <div className="absolute grid grid-cols-2" style={{ left: '20%', width: '60%', top: '20.4%', height: '14.4%' }}>
                        {item('milk', 34)}
                        {item('sausage', 72)}
                    </div>
                    {/* ценники на краю верхней полки */}
                    <div className="absolute grid grid-cols-2" style={{ left: '20%', width: '60%', top: '35.4%' }}>
                        {tag('milk')}
                        {tag('sausage')}
                    </div>
                    {/* снежинки — внутри камеры */}
                    <div className="pointer-events-none absolute overflow-hidden" style={{ left: '14.4%', top: '13.5%', width: '70.7%', height: '74.5%' }}>
                        {FLAKES.map((f, i) => (
                            <span key={i} className="cat-fridge-flake absolute top-0 select-none text-white"
                                style={{ left: `${f.x}%`, fontSize: f.s * 0.8, animationDuration: `${f.d}s`, animationDelay: `${f.delay}s` }}>❄</span>
                        ))}
                    </div>
                    {/* лампочка мигнула — всё внутри на миг тускнеет */}
                    <div className="pointer-events-none absolute transition-opacity duration-75"
                        style={{ left: '14.4%', top: '13.5%', width: '70.7%', height: '74.5%', background: 'rgba(12,20,32,0.5)', opacity: dark ? 1 : 0 }} />
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
