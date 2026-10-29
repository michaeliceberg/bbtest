'use client'

// Пробная страница: потолочный вентилятор в ангаре — lo-fi (покадрово) или плавно, рабочий или сломанный.
import { useState } from 'react'
import { HangarFan, type FanMode } from '@/components/hangar-fan'

const Btn = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} className="rounded-lg px-3 py-1.5 text-sm font-bold" style={{ background: on ? '#53ADEF' : '#26333B', color: on ? '#0F171B' : '#C9D4DA' }}>{children}</button>
)

export default function Page() {
    const [mode, setMode] = useState<FanMode>('lofi')
    const [fps, setFps] = useState(2)
    const [broken, setBroken] = useState(false)
    return (
        <div className="min-h-screen bg-[#0F171B] px-4 py-5 text-white">
            <div className="mx-auto max-w-xl">
                <h1 className="text-xl font-extrabold">Вентилятор в ангаре</h1>
                <div className="my-3 flex flex-wrap gap-2">
                    <Btn on={!broken} onClick={() => setBroken(false)}>Работает</Btn>
                    <Btn on={broken} onClick={() => setBroken(true)}>Сломан</Btn>
                    <Btn on={mode === 'lofi'} onClick={() => setMode('lofi')}>Lo-fi (кадрами)</Btn>
                    <Btn on={mode === 'smooth'} onClick={() => setMode('smooth')}>Плавно</Btn>
                </div>
                {mode === 'lofi' && <div className="mb-3 flex flex-wrap gap-2">
                    {[0.5, 1, 2, 4].map((f) => <Btn key={f} on={fps === f} onClick={() => setFps(f)}>{f < 1 ? 'кадр в 2 с' : `${f} кадр/с`}</Btn>)}
                </div>}
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-[#2C3A41]" style={{ containerType: 'inline-size' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/hangar/bg.webp" alt="" className="absolute inset-0 h-full w-full" draggable={false} />
                    <HangarFan key={`${mode}-${fps}-${broken}`} broken={broken} mode={mode} fps={fps} />
                </div>
                <p className="mt-2 text-xs font-bold text-[#7E8F99]">Лопасти пока нарисованы кодом — заменим на картинку из Leonardo.</p>
            </div>
        </div>
    )
}
