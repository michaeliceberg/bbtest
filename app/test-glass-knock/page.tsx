'use client'

// Проба эффекта «Мигель стучит по стеклу»: кнопки запускают заново, на карте /trainer он срабатывает при прокрутке.

import { useRef, useState } from 'react'
import { GlassKnockIntro } from '@/components/glass-knock-intro'
import { PetBust } from '@/components/trainer-pet'

const SRCS = ['/miguel/miguel-glass-stop.webp', '/miguel/miguel-glass-fist.webp', '/miguel/miguel-danger-pencil.webp', '/miguel/miguel-danger-pencil-2.webp']

export default function TestGlassKnockPage() {
    const ref = useRef<HTMLDivElement>(null)
    const [run, setRun] = useState(0)
    const [src, setSrc] = useState(SRCS[0])
    const [hidden, setHidden] = useState(false)
    return (
        <div className="flex min-h-screen flex-col items-center gap-4 bg-[#161F23] p-6 text-[#F2F7FB]">
            <div className="flex flex-wrap justify-center gap-2">
                {SRCS.map((s, i) => (
                    <button key={s} type="button" onClick={() => { setSrc(s); setRun((r) => r + 1) }} className="rounded-lg bg-[#26333B] px-3 py-1.5 text-sm font-bold">Поза {i + 1}</button>
                ))}
            </div>
            <div ref={ref} style={{ visibility: hidden ? 'hidden' : undefined }}><PetBust src={src} size={184} width={150} bob /></div>
            {run > 0 && <GlassKnockIntro key={run} force src={src} targetRef={ref} size={184} onActive={setHidden} />}
        </div>
    )
}
