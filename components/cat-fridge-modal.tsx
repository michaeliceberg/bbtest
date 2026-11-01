'use client'

// components/cat-fridge-modal.tsx
//
// Холодильник котика изнутри: открывается окном поверх ангара по нажатию на починенный холодильник.
// Внутри — картинка Leonardo, поверх кодом: наледь, снежинки, пасхалка «SG was here».
// На полках еда (lib/catFood.ts): купленная — цветная со счётчиком, не купленная — силуэт. Под каждой — цена в монетах
// (Lottie-монета, как в шапке); нажал — покупка на сервере (actions/cat.ts buyCatFood).

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import Lottie from '@/components/lottie-player'
import LottieCoins from '@/public/Lottie/LottieCoins.json'
import { buyCatFood } from '@/actions/cat'
import { reportAchievement } from '@/lib/achievementsClient'
import { CAT_FOOD, type CatFood, type CatFoodStock } from '@/lib/catFood'
import { playJustClick, playSound, CASE_PRIZE_SOUND, WRONG_ANSWER_SOUND } from '@/lib/sound'


// снежинки: место по x, размер, длительность и задержка (фиксированные — без рассинхрона сервера и браузера)
const FLAKES = Array.from({ length: 16 }, (_, i) => ({
    x: (i * 37) % 100, s: 10 + ((i * 7) % 4) * 4, d: 6 + ((i * 5) % 5), delay: -((i * 1.3) % 8),
}))

export function CatFridgeModal({ stock, onBought, onClose, offline }: {
    stock: CatFoodStock
    onBought: (kind: CatFood, count: number) => void
    onClose: () => void
    /** Тестовая страница: покупка без сервера. */
    offline?: boolean
}) {
    const [busy, setBusy] = useState<CatFood | null>(null)
    const [noCoins, setNoCoins] = useState<CatFood | null>(null)
    const [sgTapped, setSgTapped] = useState(false)
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

    // Внутренность холодильника — картинка Leonardo (public/hangar/life/cat-fridge-inside.webp, 904×956,
    // исходник docs/hangar/leonardo/cat-fridge-inside.jpg). Координаты ниже — % этой картинки: верхняя полка ~41%,
    // нижняя ~58.5%, камера x 14.5–85.5%, y 13.5–86.5%. Пасхалка «SG was here» нацарапана под нижней полкой справа (cat-fridge-sg.webp).
    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/65 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                className="w-full max-w-[380px]" onClick={(e) => e.stopPropagation()}>
                <div className="mb-2 flex items-center justify-between px-1">
                    <span className="text-lg font-black text-[#FFF1D6]">Холодильник котика</span>
                    <button type="button" onClick={onClose} aria-label="Закрыть холодильник"
                        className="flex items-center gap-1 rounded-xl border-2 border-b-4 border-[#3A2A1E] bg-[#FFF6E4] px-2.5 py-1 text-sm font-black text-[#3A2A1E] active:border-b-0">
                        <X className="h-4 w-4" strokeWidth={3} />Закрыть
                    </button>
                </div>
                <div className="relative w-full overflow-hidden" style={{ aspectRatio: '904 / 956' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/hangar/life/cat-fridge-inside.webp" alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none" />
                    {/* камера: наледь по углам, пасхалка, снежинки */}
                    <div className="pointer-events-none absolute overflow-hidden" style={{ left: '14.5%', top: '13.5%', width: '71%', height: '73%', borderRadius: '5%' }}>
                        {[['0%', '0%'], ['100%', '0%'], ['0%', '100%'], ['100%', '100%']].map(([x, y], i) => (
                            <span key={i} className="absolute h-[34%] w-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                                style={{ left: x, top: y, background: 'radial-gradient(closest-side, rgba(255,255,255,0.85), rgba(225,240,255,0.45) 45%, transparent)' }} />
                        ))}
                        {/* сосульки-наледь под потолком камеры */}
                        <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-[6%] w-full" aria-hidden>
                            <path d="M0 0 H100 V2 L96 3 L94 6 L92 2.5 L84 3.5 L82 7 L80 3 L66 2.5 L64 5 L62 2.5 L40 3 L38 6.5 L36 2.8 L20 3 L18 5.5 L16 2.6 L6 3 L4 6 L2 2.5 L0 2.5 Z" fill="rgba(245,251,255,0.9)" />
                        </svg>

                        {FLAKES.map((f, i) => (
                            <span key={i} className="cat-fridge-flake absolute top-0 select-none text-white"
                                style={{ left: `${f.x}%`, fontSize: f.s, animationDuration: `${f.d}s`, animationDelay: `${f.delay}s` }}>❄</span>
                        ))}
                    </div>
                    {/* пасхалка: нажал на нацарапанную надпись — ачивка «Сол Гудман был здесь!» (в зале ачивок — кусочек пиццы) */}
                    <button type="button" aria-label="SG was here" onClick={() => { playJustClick(); setSgTapped(true); if (!offline) reportAchievement('fridge_sg') }}
                        className="absolute" style={{ left: '55%', top: '63%', width: '25%', height: '8%' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/hangar/life/cat-fridge-sg.webp" alt="" draggable={false} className="pointer-events-none h-full w-full select-none object-contain"
                            style={{ rotate: '-4deg', opacity: sgTapped ? 0.9 : 0.7, mixBlendMode: 'multiply', transition: 'opacity .3s' }} />
                    </button>
                    {/* верхняя полка: продукты стоят на ней */}
                    <div className="absolute grid grid-cols-2" style={{ left: '17%', width: '66%', top: '15%', height: '26.5%' }}>
                        {item('milk', 42)}
                        {item('sausage', 78)}
                    </div>
                    {/* ценники на краю верхней полки */}
                    <div className="absolute grid grid-cols-2" style={{ left: '17%', width: '66%', top: '41%' }}>
                        {tag('milk')}
                        {tag('sausage')}
                    </div>
                    <p className="pointer-events-none absolute inset-x-[20%] text-center text-[11px] font-bold leading-tight text-[#56646C]" style={{ top: '76%' }}>
                        Скоро здесь будет больше вкусного
                    </p>
                </div>
                <style>{`
                    .cat-fridge-flake { animation-name: cat-fridge-fall; animation-timing-function: linear; animation-iteration-count: infinite; opacity: 0; text-shadow: 0 0 4px rgba(150,200,255,.8) }
                    @keyframes cat-fridge-fall { 0% { transform: translate(0,-20px) rotate(0); opacity: 0 } 10% { opacity: .9 } 90% { opacity: .8 } 100% { transform: translate(18px,360px) rotate(220deg); opacity: 0 } }
                    @media (prefers-reduced-motion: reduce) { .cat-fridge-flake { animation: none; display: none } }
                `}</style>
            </motion.div>
        </div>
    )
}
