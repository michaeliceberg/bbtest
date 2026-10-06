'use client'

// Тестовая страница аватарок по позывному. Сравниваем два генератора:
// Multiavatar (мультяшные персонажи, @multiavatar/multiavatar — лицензия
// разрешает коммерческое использование) и Boring Avatars (абстрактные,
// MIT). Аватарка детерминированно зависит от строки-«семени» (позывной), так
// что при генерации нового позывного получаем новую аватарку, а у одного и
// того же ученика она всегда одинаковая. Случайный позывной ставим только
// после монтирования — иначе рассинхрон сервер/клиент.

import { useEffect, useState } from 'react'
import multiavatar from '@multiavatar/multiavatar'
import Avatar from 'boring-avatars'
import { pickGuestNickname } from '@/lib/nickname'

const BORING_VARIANTS = ['beam', 'marble', 'pixel', 'sunset', 'ring', 'bauhaus'] as const
// Палитра ggege (lib/…lessonButtonColors) — аватарки в цветах бренда.
const PALETTE = ['#53ADEF', '#BC418A', '#78C93C', '#F09B38', '#C385F7', '#5CC99F']

export default function TestAvatarsPage() {
    const [nickname, setNickname] = useState('')
    const [custom, setCustom] = useState('')
    useEffect(() => { setNickname(pickGuestNickname()) }, [])

    const seed = custom.trim() || nickname
    const svg = seed ? multiavatar(seed) : ''

    return (
        <div className="min-h-screen bg-[#131D22] text-[#F2F7FB] px-4 py-8 flex flex-col items-center gap-6">
            <h1 className="text-2xl font-extrabold">Аватарки по позывному</h1>

            <div className="flex flex-col items-center gap-3 w-full max-w-md">
                <div className="text-xl font-black text-center min-h-[2rem]">{seed}</div>
                <button
                    type="button"
                    onClick={() => { setCustom(''); setNickname(pickGuestNickname()) }}
                    className="rounded-xl border-2 border-b-4 border-[#3A464E] bg-[#1B252B] px-5 h-12 font-extrabold active:border-b-2"
                >
                    🎲 Новый позывной
                </button>
                <input
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    placeholder="…или впиши своё слово"
                    className="w-full h-11 rounded-xl border-2 border-[#3A464E] bg-[#1B252B] px-4 outline-none focus:border-[#4A90D9]"
                />
            </div>

            <section className="w-full max-w-md flex flex-col items-center gap-2">
                <h2 className="font-bold text-[#9AA7B0]">Multiavatar — персонажи</h2>
                <div className="flex items-center gap-4">
                    <div className="w-40 h-40 rounded-full overflow-hidden bg-[#1B252B] border-2 border-[#3A464E]" dangerouslySetInnerHTML={{ __html: svg }} />
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-[#1B252B] border-2 border-[#3A464E]" dangerouslySetInnerHTML={{ __html: svg }} />
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-[#1B252B] border-2 border-[#3A464E]" dangerouslySetInnerHTML={{ __html: svg }} />
                </div>
            </section>

            <section className="w-full max-w-md flex flex-col items-center gap-2">
                <h2 className="font-bold text-[#9AA7B0]">Boring Avatars — абстракция</h2>
                <div className="grid grid-cols-3 gap-4">
                    {BORING_VARIANTS.map((v) => (
                        <div key={v} className="flex flex-col items-center gap-1">
                            {seed && <Avatar size={88} name={seed} variant={v} colors={PALETTE} />}
                            <span className="text-xs text-[#9AA7B0]">{v}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
