'use client'

// Экран загрузки после «Приступить» в панели сета (components/set-bar.tsx): пока грузится урок/задачи —
// вилка и нож ходят навстречу друг другу и заходят крест-накрест, как будто сейчас начнём есть.
// Только transform/opacity (CSS .set-load-* в globals.css). Исчезает сам, когда открылась новая страница.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const FORK = 'M7 2v6a3 3 0 0 0 2 2.83V22h2V10.83A3 3 0 0 0 13 8V2h-1.5v5.5h-1V2h-1v5.5h-1V2z'
const KNIFE = 'M15 2c2.5 1.6 4 4.6 4 8.2V13h-2.2v9h-2V2z'

export function SetLoadingScreen({ text = 'Команданте накрывает на стол' }: { text?: string }) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])
    if (!mounted) return null
    return createPortal(
        <div className="fixed inset-0 z-[3000] flex flex-col items-center justify-center gap-6 bg-[#0F171B]/95">
            <div className="relative h-32 w-44">
                <svg viewBox="0 0 24 24" className="set-load-fork absolute left-1/2 top-0 h-32 w-32 -ml-16" aria-hidden>
                    <path d={FORK} transform="translate(2 0)" fill="#F2E3C2" stroke="#4A3A14" strokeWidth="0.9" strokeLinejoin="round" />
                </svg>
                <svg viewBox="0 0 24 24" className="set-load-knife absolute left-1/2 top-0 h-32 w-32 -ml-16" aria-hidden>
                    <path d={KNIFE} transform="translate(-5 0)" fill="#C9D3D9" stroke="#2A363C" strokeWidth="0.9" strokeLinejoin="round" />
                </svg>
            </div>
            <p className="text-lg font-black text-[#F2C35B]">
                {text}<span className="set-load-dot">.</span><span className="set-load-dot [animation-delay:.2s]">.</span><span className="set-load-dot [animation-delay:.4s]">.</span>
            </p>
        </div>,
        document.body,
    )
}
