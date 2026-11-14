'use client'

// Тестовая страница: выбор дизайна нижней части холодильника (кормление котика). Ничего не сохраняется.
import { useEffect, useRef, useState } from 'react'
import { FEED_DESIGNS } from '@/components/cat-feed-designs'
import { CAT_FOOD, type CatFood, type CatFoodStock } from '@/lib/catFood'

const START: CatFoodStock = { milk: 3, sausage: 2, sourcream: 1, fish: 0 }

export default function Page() {
    const [sat, setSat] = useState(0.3)
    const [stock, setStock] = useState<CatFoodStock>(START)
    const [eating, setEating] = useState<CatFood | null>(null)
    const t = useRef<ReturnType<typeof setTimeout>>()
    useEffect(() => () => clearTimeout(t.current), [])
    const feed = (k: CatFood) => {
        if (eating || stock[k] <= 0) return
        setStock((s) => ({ ...s, [k]: s[k] - 1 }))
        setEating(k)
        t.current = setTimeout(() => { setSat((v) => Math.min(1, v + CAT_FOOD[k].gain / 100)); setEating(null) }, 1400)
    }
    return (
        <div className="min-h-screen bg-[#0F171B] p-4 text-white">
            <div className="mx-auto max-w-5xl">
                <h1 className="text-xl font-black">Холодильник: как кормим котика</h1>
                <p className="mt-1 text-sm text-[#9AA7B0]">Четыре варианта нижней части. Двигай сытость, жми на еду. Кормить можно, пока сытость меньше 50%.</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-[#161F23] p-3 text-sm font-bold">
                    <label className="flex items-center gap-2">Сытость {Math.round(sat * 100)}%
                        <input type="range" min={0} max={100} value={Math.round(sat * 100)} onChange={(e) => setSat(+e.target.value / 100)} />
                    </label>
                    <button type="button" onClick={() => { setStock(START); setSat(0.1) }}
                        className="rounded-xl border-b-4 border-[#B8862E] bg-[#FFE58A] px-3 py-1 font-black text-[#3A2A08] active:border-b-0">Сначала</button>
                </div>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    {FEED_DESIGNS.map(({ id, title, note, C }) => (
                        <div key={id} className="mx-auto w-full max-w-[340px]">
                            <div className="mb-1 font-black text-[#FFE58A]">{id}. {title}</div>
                            <div className="mb-2 min-h-[48px] text-xs text-[#9AA7B0]">{note}</div>
                            <C catName="Мурзик" satiety={sat} stock={stock} feedStreak={3} eating={eating} onFeed={feed} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
