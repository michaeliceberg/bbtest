'use client'

// Примерка способов зачёркивания (уроки «Деление логарифмов» и «К-к-комбо»): нажмите «Повторить», чтобы увидеть рисование заново.

import { useState } from 'react'
import { STRIKE_VARIANTS, StrikeMark } from '@/components/geometry/strike-variants'

export default function TestStrikePage() {
    const [nonce, setNonce] = useState(0)
    return (
        <div className="min-h-screen bg-[#161F23] p-6 text-[#F2F7FB]">
            <h1 className="text-xl font-extrabold">Способы зачёркивания</h1>
            <button type="button" onClick={() => setNonce((n) => n + 1)} className="my-4 rounded-xl border-2 border-[#3A464E] px-4 py-2 font-bold">Повторить</button>
            <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
                {STRIKE_VARIANTS.map((v, i) => (
                    <div key={`${v.id}-${nonce}`} className="rounded-xl border border-[#3A464E] p-4">
                        <div className="mb-3 text-sm text-[#8A98A1]">{i + 1}. {v.name}</div>
                        <div className="relative flex items-center justify-center gap-3 text-3xl font-extrabold py-4">
                            <span className="relative inline-flex flex-col items-center">
                                <span className="border-b-2 border-[#F2F7FB] px-2 pb-1">
                                    <span className="inline-block" style={{ opacity: 0.35 }}>log<sub>2</sub></span> 9
                                </span>
                                <span className="px-2 pt-1">
                                    <span className="inline-block" style={{ opacity: 0.35 }}>log<sub>2</sub></span> 3
                                </span>
                                <StrikeMark rect={{ x: 8, y: 2, w: 56, h: 32 }} variant={v} />
                                <StrikeMark rect={{ x: 8, y: 40, w: 56, h: 32 }} variant={v} delay={0.4} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
