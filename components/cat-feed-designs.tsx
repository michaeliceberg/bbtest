'use client'

// components/cat-feed-designs.tsx
//
// Варианты нижней части холодильника («кормим котика») для выбора на странице /test-cat-feed.
// Все получают одно и то же: сытость 0…1, запас еды и колбэк onFeed. Котик меняет позу по сытости и «ест» после кормления.

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { CAT_FOOD, CAT_FOODS, CAT_FEED_BELOW, type CatFood, type CatFoodStock } from '@/lib/catFood'

export type FeedDesignProps = {
    catName: string
    satiety: number
    stock: CatFoodStock
    feedStreak: number
    eating: CatFood | null
    onFeed: (k: CatFood) => void
}

const BROWN = '#3A2A1E'
const CREAM = '#FFF6E4'

type Mood = { pose: string; phrase: string; color: string }
/** Настроение котика по сытости: поза (public/hangar/life/cat-<pose>.webp), реплика и цвет полоски. */
function moodOf(sat: number, eating: boolean): Mood {
    if (eating) return { pose: 'eat', phrase: 'Ням-ням-ням', color: '#8FD460' }
    if (sat >= 0.9) return { pose: 'happy', phrase: 'Мурр, я самый сытый', color: '#8FD460' }
    if (sat >= CAT_FEED_BELOW) return { pose: 'sit', phrase: 'Пока не голодный', color: '#B7D84B' }
    if (sat >= 0.2) return { pose: 'meow', phrase: 'Мяу! Хочу кушать', color: '#F5A524' }
    return { pose: 'sit-shy', phrase: 'Мне совсем грустно без еды', color: '#E5533D' }
}

const pct = (v: number) => Math.round(v * 100)
const canFeed = (p: FeedDesignProps, k: CatFood) => p.satiety < CAT_FEED_BELOW && p.stock[k] > 0 && !p.eating

/** Мордочка: вырезка головы из картинки сидящего котика. */
function Face({ pose, size, ring }: { pose: string; size: number; ring?: string }) {
    return (
        <div className="relative shrink-0 overflow-hidden rounded-full bg-[#FFE9C2]" style={{ width: size, height: size, boxShadow: ring ? `0 0 0 4px ${ring}` : undefined }}>
            <motion.img key={pose} src={`/hangar/life/cat-${pose === 'eat' ? 'sit' : pose}.webp`} alt="" draggable={false}
                initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                className="absolute max-w-none select-none" style={{ width: '150%', left: '-22%', top: '-2%' }} />
        </div>
    )
}

function Bar({ sat, color, ghost, h = 14 }: { sat: number; color: string; ghost?: number; h?: number }) {
    return (
        <div className="relative w-full overflow-hidden rounded-full border-2 bg-[#EADCBF]" style={{ height: h, borderColor: BROWN }}>
            {ghost ? <div className="absolute inset-y-0 left-0 rounded-full bg-white/70" style={{ width: `${Math.min(1, sat + ghost) * 100}%` }} /> : null}
            <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ background: color }} initial={false}
                animate={{ width: `${sat * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} />
            {/* отметка «после неё кормить нельзя» */}
            <div className="absolute inset-y-0 w-0.5 bg-[#3A2A1E]/50" style={{ left: `${CAT_FEED_BELOW * 100}%` }} />
        </div>
    )
}

const Streak = ({ n }: { n: number }) => n > 0 ? (
    <div className="mt-2 text-center text-xs font-bold text-[#8C6A44]">Кормишь {n} дн. подряд · награды за 10, 50 и 100 дней</div>
) : null

const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-2xl border-2 p-3 text-[#3A2A1E]" style={{ borderColor: BROWN, background: CREAM }}>{children}</div>
)

// ───────────── A. «Мордочка»: портрет + полоска, еда круглыми кнопками в ряд ─────────────
export function FeedDesignA(p: FeedDesignProps) {
    const m = moodOf(p.satiety, !!p.eating)
    const [hover, setHover] = useState<CatFood | null>(null)
    return (
        <Shell>
            <div className="flex items-center gap-3">
                <Face pose={m.pose} size={76} ring={m.color} />
                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between">
                        <span className="font-black">{p.catName}</span>
                        <span className="text-sm font-black" style={{ color: m.color }}>{pct(p.satiety)}%</span>
                    </div>
                    <div className="mb-1.5 text-xs font-bold text-[#8C6A44]">{m.phrase}</div>
                    <Bar sat={p.satiety} color={m.color} ghost={hover ? CAT_FOOD[hover].gain / 100 : 0} />
                </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1.5">
                {CAT_FOODS.map((k) => (
                    <button key={k} type="button" disabled={!canFeed(p, k)} onClick={() => p.onFeed(k)}
                        onPointerEnter={() => setHover(k)} onPointerLeave={() => setHover(null)}
                        className="relative flex flex-col items-center rounded-xl border-b-4 border-[#4E8F2A] bg-[#8FD460] px-0.5 pb-1 pt-1.5 active:border-b-0 disabled:border-[#BDB293] disabled:bg-[#DCD2B8] disabled:opacity-70">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={CAT_FOOD[k].src} alt="" draggable={false} className="h-9 w-9 object-contain" />
                        <span className="text-[11px] font-black leading-tight">{CAT_FOOD[k].title}</span>
                        <span className="text-[10px] font-black text-[#1E5A0E]">+{CAT_FOOD[k].gain}%</span>
                        <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-[#3A2A1E] px-1 text-center text-[11px] font-black leading-[18px] text-white">{p.stock[k]}</span>
                    </button>
                ))}
            </div>
            <Streak n={p.feedStreak} />
        </Shell>
    )
}

// ───────────── B. «Котик в рост»: большой котик, реплика-облачко, сердечки сытости, еда карточками ─────────────
export function FeedDesignB(p: FeedDesignProps) {
    const m = moodOf(p.satiety, !!p.eating)
    return (
        <Shell>
            <div className="flex items-end gap-4">
                <div className="relative h-[120px] w-[100px] shrink-0">
                    <motion.img key={m.pose} src={`/hangar/life/cat-${m.pose}.webp`} alt="" draggable={false}
                        initial={{ y: 6, scale: 0.95 }} animate={{ y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 12 }}
                        className="absolute bottom-0 left-1/2 h-full -translate-x-1/2 select-none object-contain" />
                </div>
                <div className="flex-1 pb-1">
                    <div className="relative rounded-xl border-2 bg-white px-2.5 py-1.5 text-sm font-black leading-tight" style={{ borderColor: BROWN }}>
                        {m.phrase}
                        <span className="absolute -left-[7px] bottom-3 h-3 w-3 rotate-45 border-b-2 border-l-2 bg-white" style={{ borderColor: BROWN }} />
                    </div>
                    <div className="mt-2 flex items-center gap-0.5" aria-label={`Сытость ${pct(p.satiety)}%`}>
                        {[0, 1, 2, 3, 4].map((i) => {
                            const fill = Math.max(0, Math.min(1, p.satiety * 5 - i))
                            return (
                                <span key={i} className="relative h-6 w-6">
                                    <Heart className="absolute inset-0 h-6 w-6 text-[#D9C8A4]" strokeWidth={2.5} fill="#EADCBF" />
                                    <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                                        <Heart className="h-6 w-6" style={{ color: m.color }} strokeWidth={2.5} fill={m.color} />
                                    </span>
                                </span>
                            )
                        })}
                        <span className="ml-1 text-xs font-black text-[#8C6A44]">{pct(p.satiety)}%</span>
                    </div>
                </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
                {CAT_FOODS.map((k) => (
                    <button key={k} type="button" disabled={!canFeed(p, k)} onClick={() => p.onFeed(k)}
                        className="flex items-center gap-2 rounded-xl border-2 border-b-4 bg-white px-2 py-1.5 text-left active:border-b-2 disabled:opacity-45"
                        style={{ borderColor: p.stock[k] > 0 ? '#4E8F2A' : '#BDB293' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={CAT_FOOD[k].src} alt="" draggable={false} className="h-9 w-9 shrink-0 object-contain" />
                        <span className="min-w-0 flex-1 leading-tight">
                            <span className="block text-sm font-black">{CAT_FOOD[k].title}</span>
                            <span className="block text-[11px] font-bold text-[#8C6A44]">осталось {p.stock[k]}</span>
                        </span>
                        <span className="rounded-md bg-[#4E8F2A] px-1 text-xs font-black text-white">+{CAT_FOOD[k].gain}</span>
                    </button>
                ))}
            </div>
            <Streak n={p.feedStreak} />
        </Shell>
    )
}

// ───────────── C. «Миска»: котик у миски, нажал еду — она летит в миску, котик ест ─────────────
export function FeedDesignC(p: FeedDesignProps) {
    const m = moodOf(p.satiety, !!p.eating)
    return (
        <Shell>
            <div className="relative flex h-[130px] items-end justify-center overflow-hidden rounded-xl bg-[#F3E2BE]">
                <div className="absolute inset-x-0 bottom-0 h-5 bg-[#D9B883]" />
                <motion.img key={m.pose} src={`/hangar/life/cat-${m.pose === 'eat' ? 'sit' : m.pose}.webp`} alt="" draggable={false}
                    initial={{ y: 6 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 12 }}
                    className="absolute bottom-1 left-3 h-[112px] select-none" />
                <div className="absolute bottom-1 right-4 w-[120px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/hangar/life/cat-bowl.webp" alt="" draggable={false} className="w-full select-none" />
                    {p.eating && (
                        <motion.img key={p.eating} src={CAT_FOOD[p.eating].src} alt="" draggable={false}
                            initial={{ y: -90, x: 30, opacity: 0, scale: 0.6 }} animate={{ y: -18, x: 0, opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                            className="absolute left-1/2 top-0 h-12 w-12 -translate-x-1/2 select-none object-contain" />
                    )}
                </div>
                <div className="absolute left-2 top-2 rounded-lg bg-white/90 px-2 py-0.5 text-xs font-black">{m.phrase}</div>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
                <span className="text-xs font-black text-[#8C6A44]">Сытость</span>
                <Bar sat={p.satiety} color={m.color} h={16} />
                <span className="w-9 text-right text-sm font-black">{pct(p.satiety)}%</span>
            </div>
            <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1">
                {CAT_FOODS.map((k) => (
                    <button key={k} type="button" disabled={!canFeed(p, k)} onClick={() => p.onFeed(k)}
                        className="relative flex w-[74px] shrink-0 flex-col items-center rounded-2xl border-2 border-b-4 border-[#3A2A1E] bg-white py-1.5 active:border-b-2 disabled:opacity-45">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={CAT_FOOD[k].src} alt="" draggable={false} className="h-11 w-11 object-contain" />
                        <span className="text-xs font-black">{CAT_FOOD[k].title}</span>
                        <span className="text-[11px] font-black text-[#4E8F2A]">+{CAT_FOOD[k].gain}%</span>
                        <span className="absolute -right-1.5 -top-1.5 min-w-[20px] rounded-full bg-[#E5533D] px-1 text-center text-xs font-black leading-5 text-white">{p.stock[k]}</span>
                    </button>
                ))}
            </div>
            <Streak n={p.feedStreak} />
        </Shell>
    )
}

// ───────────── D. «Кольцо»: круглая шкала сытости вокруг мордочки, еда списком с кнопкой «Дать» ─────────────
export function FeedDesignD(p: FeedDesignProps) {
    const m = moodOf(p.satiety, !!p.eating)
    const R = 46, C = 2 * Math.PI * R
    return (
        <Shell>
            <div className="flex flex-col items-center">
                <div className="relative h-[112px] w-[112px]">
                    <svg viewBox="0 0 112 112" className="absolute inset-0 -rotate-90">
                        <circle cx="56" cy="56" r={R} fill="none" stroke="#EADCBF" strokeWidth="9" />
                        <motion.circle cx="56" cy="56" r={R} fill="none" stroke={m.color} strokeWidth="9" strokeLinecap="round"
                            strokeDasharray={C} initial={false} animate={{ strokeDashoffset: C * (1 - p.satiety) }} transition={{ type: 'spring', stiffness: 90, damping: 18 }} />
                    </svg>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"><Face pose={m.pose} size={80} /></div>
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border-2 bg-white px-2 text-sm font-black leading-5" style={{ borderColor: BROWN }}>{pct(p.satiety)}%</span>
                </div>
                <div className="mt-2 font-black">{p.catName}</div>
                <div className="text-xs font-bold text-[#8C6A44]">{m.phrase}</div>
            </div>
            <div className="mt-3 space-y-1.5">
                {CAT_FOODS.map((k) => (
                    <div key={k} className="flex items-center gap-2 rounded-xl bg-white px-2 py-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={CAT_FOOD[k].src} alt="" draggable={false} className="h-9 w-9 object-contain" style={{ filter: p.stock[k] > 0 ? undefined : 'brightness(0) opacity(0.25)' }} />
                        <div className="min-w-0 flex-1 leading-tight">
                            <div className="text-sm font-black">{CAT_FOOD[k].title} <span className="text-[#8C6A44]">×{p.stock[k]}</span></div>
                            <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-[#EADCBF]">
                                <div className="h-full rounded-full bg-[#8FD460]" style={{ width: `${CAT_FOOD[k].gain}%` }} />
                            </div>
                        </div>
                        <button type="button" disabled={!canFeed(p, k)} onClick={() => p.onFeed(k)}
                            className="rounded-lg border-b-4 border-[#4E8F2A] bg-[#8FD460] px-3 py-1 text-sm font-black text-[#1E3A0E] active:border-b-0 disabled:border-[#BDB293] disabled:bg-[#DCD2B8] disabled:text-[#8C8470]">
                            {p.stock[k] > 0 ? 'Дать' : 'Нет'}
                        </button>
                    </div>
                ))}
            </div>
            <Streak n={p.feedStreak} />
        </Shell>
    )
}

export const FEED_DESIGNS = [
    { id: 'A', title: 'Мордочка', note: 'Портрет с кольцом настроения, полоска с подсказкой «сколько добавит», еда кнопками в ряд.', C: FeedDesignA },
    { id: 'B', title: 'Котик в рост', note: 'Большой котик с облачком-репликой, сытость сердечками, еда карточками.', C: FeedDesignB },
    { id: 'C', title: 'Миска', note: 'Котик сидит у миски; нажал еду, она падает в миску, котик ест. Еда лентой.', C: FeedDesignC },
    { id: 'D', title: 'Кольцо', note: 'Круглая шкала вокруг мордочки, еда списком с кнопкой «Дать» и шкалой пользы.', C: FeedDesignD },
]
