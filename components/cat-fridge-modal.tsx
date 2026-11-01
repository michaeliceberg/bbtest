'use client'

// components/cat-fridge-modal.tsx
//
// Холодильник котика изнутри: открывается окном поверх ангара по нажатию на починенный холодильник.
// Мультяшный корпус и полки нарисованы кодом (пока нет картинки Leonardo), по окну летают снежинки — «мороз».
// На полках еда (lib/catFood.ts): купленная — цветная со счётчиком, не купленная — силуэт. Под каждой — цена в монетах
// (Lottie-монета, как в шапке); нажал — покупка на сервере (actions/cat.ts buyCatFood).

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import Lottie from '@/components/lottie-player'
import LottieCoins from '@/public/Lottie/LottieCoins.json'
import { buyCatFood } from '@/actions/cat'
import { CAT_FOOD, type CatFood, type CatFoodStock } from '@/lib/catFood'
import { playJustClick, playSound, CASE_PRIZE_SOUND, WRONG_ANSWER_SOUND } from '@/lib/sound'

const BODY = '#E7D9A6' // корпус — как у картинки холодильника
const EDGE = '#3A2A1E'

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

    // продукт стоит на полке (низ картинки — на линии полки), счётчик «×N» — если куплено больше одного
    const item = (kind: CatFood, w: string) => {
        const f = CAT_FOOD[kind]
        const have = stock[kind] > 0
        return (
            <div className="relative flex h-[110px] items-end justify-center sm:h-[130px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <motion.img key={`${kind}-${stock[kind]}`} src={f.src} alt={f.title} draggable={false}
                    initial={have ? { scale: 0.6, y: -20 } : false} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 14 }}
                    className="max-h-full select-none" style={{ width: w, filter: have ? undefined : 'brightness(0) opacity(0.22)' }} />
                {stock[kind] > 1 && (
                    <span className="absolute right-1 top-1 rounded-full border-2 border-[#3A2A1E] bg-[#FFE58A] px-1.5 text-xs font-black text-[#3A2A08]">×{stock[kind]}</span>
                )}
            </div>
        )
    }
    // ценник под полкой: цена + монета, нажал — купить
    const tag = (kind: CatFood) => (
        <div className="flex flex-col items-center">
            <button type="button" onClick={() => void buy(kind)} disabled={busy !== null} aria-label={`Купить: ${CAT_FOOD[kind].title}`}
                className="flex items-center gap-0.5 rounded-xl border-b-4 border-[#B8862E] bg-[#FFE58A] py-1 pl-2.5 pr-1 text-base font-black text-[#3A2A08] shadow-md active:border-b-0 disabled:opacity-70">
                {CAT_FOOD[kind].price}
                <Lottie animationData={LottieCoins} loop autoplay className="-my-3 h-9 w-9 -translate-y-[14%]" />
            </button>
            {noCoins === kind && <span className="mt-1 text-xs font-bold text-[#B23A32]">Не хватает монет</span>}
        </div>
    )

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                className="relative w-full max-w-[380px] overflow-hidden rounded-[28px] border-[4px] p-3 shadow-2xl"
                style={{ background: BODY, borderColor: EDGE }} onClick={(e) => e.stopPropagation()}>
                <div className="mb-2 flex items-center justify-between px-1">
                    <span className="text-lg font-black text-[#3A2A1E]">Холодильник котика</span>
                    <button type="button" onClick={onClose} aria-label="Закрыть холодильник"
                        className="flex items-center gap-1 rounded-xl border-2 border-b-4 border-[#3A2A1E] bg-[#FFF6E4] px-2.5 py-1 text-sm font-black text-[#3A2A1E] active:border-b-2">
                        <X className="h-4 w-4" strokeWidth={3} />Закрыть
                    </button>
                </div>
                {/* камера холодильника */}
                <div className="relative overflow-hidden rounded-2xl border-[3px]" style={{ borderColor: EDGE, background: 'linear-gradient(180deg,#DDE7EC 0%,#B9C7CF 100%)' }}>
                    {/* лампочка сверху — холодный свет */}
                    <div className="pointer-events-none absolute left-1/2 top-0 h-24 w-3/4 -translate-x-1/2" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,240,0.85), transparent 70%)' }} />
                    <div className="relative grid grid-cols-2 gap-x-2 px-3 pt-4">
                        {item('milk', '66px')}
                        {item('sausage', '118px')}
                    </div>
                    {/* полка */}
                    <div className="relative mx-2 h-3 rounded-full border-2" style={{ borderColor: EDGE, background: 'linear-gradient(180deg,#FFFFFF,#C9D4DA)' }} />
                    <div className="relative mb-4 mt-2 grid grid-cols-2 gap-x-2 px-3">
                        {tag('milk')}
                        {tag('sausage')}
                    </div>
                    <div className="relative grid grid-cols-2 gap-2 px-3 pb-4">
                        <div className="h-16 rounded-xl border-2 border-dashed border-[#8C9BA4]/60" />
                        <div className="h-16 rounded-xl border-2 border-dashed border-[#8C9BA4]/60" />
                    </div>
                    <div className="relative mx-2 mb-3 h-3 rounded-full border-2" style={{ borderColor: EDGE, background: 'linear-gradient(180deg,#FFFFFF,#C9D4DA)' }} />
                    <p className="relative pb-3 text-center text-xs font-bold text-[#56646C]">Скоро здесь будет больше вкусного</p>
                    {/* снежинки — мороз */}
                    {FLAKES.map((f, i) => (
                        <span key={i} className="cat-fridge-flake pointer-events-none absolute top-0 select-none text-white"
                            style={{ left: `${f.x}%`, fontSize: f.s, animationDuration: `${f.d}s`, animationDelay: `${f.delay}s` }}>❄</span>
                    ))}
                </div>
                <style>{`
                    .cat-fridge-flake { animation-name: cat-fridge-fall; animation-timing-function: linear; animation-iteration-count: infinite; opacity: 0; text-shadow: 0 0 4px rgba(150,200,255,.8) }
                    @keyframes cat-fridge-fall { 0% { transform: translate(0,-20px) rotate(0); opacity: 0 } 10% { opacity: .9 } 90% { opacity: .8 } 100% { transform: translate(18px,420px) rotate(220deg); opacity: 0 } }
                    @media (prefers-reduced-motion: reduce) { .cat-fridge-flake { animation: none; display: none } }
                `}</style>
            </motion.div>
        </div>
    )
}
