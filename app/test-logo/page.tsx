'use client'

// Варианты логотипа: обводки слоёв (собираются docs/miguel/tools/logo_variants.py, лежат в public/logo-test/).
// Логотип живой — нажатие стреляет. Показан в размере сайдбара и на разных фонах.

import { useState } from 'react'
import { AnimatedLogo } from '@/components/animated-logo'

const VARIANTS = [
    { dir: '/logo-anim', title: 'Сейчас: белая обводка у всего' },
    { dir: '/logo-test/none', title: '1. Без обводки вообще' },
    { dir: '/logo-test/white-text', title: '2. Белая только у GGEGE' },
    { dir: '/logo-test/black', title: '3. Чёрная обводка у всего' },
    { dir: '/logo-test/black-thin', title: '4. Чёрная тонкая' },
    { dir: '/logo-test/white-text-black', title: '5. GGEGE белая, гусь и монстр чёрная' },
    { dir: '/logo-test/shadow', title: '6. Мягкая тень, без обводки' },
    { dir: '/logo-test/black-shadow', title: '7. Чёрная + мягкая тень' },
    { dir: '/logo-test/purple-text', title: '8. GGEGE фиолетовая, остальное чёрная' },
    { dir: '/logo-test/monster-purple', title: '9. Без обводки, монстр в фиолетовой' },
]
const BGS = [{ c: '#131F24', t: 'Сайдбар' }, { c: '#26333B', t: 'Светлее' }, { c: '#2B2118', t: 'Тёплый' }]

export default function TestLogoPage() {
    const [bg, setBg] = useState(BGS[0].c)
    return (
        <div className="min-h-screen px-4 py-6" style={{ background: bg }}>
            <div className="mx-auto w-full max-w-3xl">
                <div className="mb-5 flex gap-2">
                    {BGS.map((b) => (
                        <button key={b.c} onClick={() => setBg(b.c)}
                            className={`rounded-xl border-b-4 px-3 py-2 text-sm font-black active:border-b-0 ${bg === b.c ? 'border-[#3A85BC] bg-[#53ADEF] text-[#0F171B]' : 'border-[#1B252A] bg-[#26333B] text-[#C9D3D9]'}`}>{b.t}</button>
                    ))}
                </div>
                <div className="grid gap-8 sm:grid-cols-2">
                    {VARIANTS.map((v) => (
                        <div key={v.dir}>
                            <p className="mb-2 text-sm font-black text-[#F2F7FB]">{v.title}</p>
                            <AnimatedLogo dir={v.dir} className="w-[300px] max-w-full" />
                            <AnimatedLogo dir={v.dir} className="mt-3 w-[140px]" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
