'use client'

// Аккаунт: «Голос Га-Га» вкл/выкл (хранится на устройстве, localStorage). Стикер с облачком показывается всегда.

import { useEffect, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { isGagaVoiceOn, setGagaVoiceOn, showGaga } from '@/components/gaga-buddy'

export const GagaVoiceToggle = () => {
    const [on, setOn] = useState<boolean | null>(null)
    useEffect(() => { setOn(isGagaVoiceOn()) }, [])
    const toggle = () => {
        const next = !on
        setOn(next)
        setGagaVoiceOn(next)
        if (next) showGaga('correct', { force: true })
    }
    return (
        <div className="flex items-center gap-3 rounded-xl border-2 border-[#3A464E] bg-[#151F23] px-4 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/gaga/gaga-wave.webp" alt="" className="h-12 w-12 shrink-0 object-contain" />
            <div className="flex-1 min-w-0">
                <div className="font-black text-[#F2F7FB]">Голос Га-Га</div>
                <div className="text-xs font-bold text-[#8FA3AE]">Наставник подбадривает в уроках</div>
            </div>
            <button type="button" onClick={toggle} disabled={on === null}
                aria-pressed={!!on}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 font-black text-sm border-2"
                style={on
                    ? { borderColor: '#78C93C', backgroundColor: 'rgba(120,201,60,0.15)', color: '#A1D151' }
                    : { borderColor: '#3A464E', backgroundColor: '#1C272C', color: '#8FA3AE' }}>
                {on ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                {on ? 'Вкл' : 'Выкл'}
            </button>
        </div>
    )
}
