'use client'

import { useEffect, useState } from 'react'
import { playSound, preloadSound, RIGHT_CLICK_SOUND } from '@/lib/sound'

// Выбор звука верного ответа: все подходящие короткие звуки, что уже есть в приложении.
const CANDIDATES = [
    { src: RIGHT_CLICK_SOUND, name: 'Сейчас: snd-right-click', vol: 0.45 },
    { src: '/snd-just-click.mp3', name: 'snd-just-click (клик выбора)', vol: 0.45 },
    { src: '/snd-click-soft.wav', name: 'snd-click-soft (мягкий клик)', vol: 0.45 },
    { src: '/snd-done-mini.mp3', name: 'snd-done-mini (мини-готово)', vol: 0.45 },
    { src: '/snd-plus1-appear.mp3', name: 'snd-plus1-appear (плюс один)', vol: 0.45 },
    { src: '/snd-plus1-appear2.mp3', name: 'snd-plus1-appear2 (плюс один 2)', vol: 0.45 },
    { src: '/snd-progress-plus1-appear.mp3', name: 'snd-progress-plus1-appear', vol: 0.45 },
    { src: '/snd-gem-drop.mp3', name: 'snd-gem-drop (кристалл)', vol: 0.45 },
    { src: '/snd-drop-coins.mp3', name: 'snd-drop-coins (монеты)', vol: 0.45 },
    { src: '/snd-set-bell.mp3', name: 'snd-set-bell (колокольчик)', vol: 0.45 },
    { src: '/snd-pizza-1.mp3', name: 'snd-pizza-1 (пицца)', vol: 0.45 },
    { src: '/snd-achievement.mp3', name: 'snd-achievement (достижение)', vol: 0.45 },
    { src: '/snd-harp-win.mp3', name: 'snd-harp-win (арфа)', vol: 0.45 },
    { src: '/snd-done-progress.mp3', name: 'snd-done-progress', vol: 0.45 },
]

export default function TestRightSounds() {
    const [vol, setVol] = useState(0.45)
    const [last, setLast] = useState<string | null>(null)
    useEffect(() => { CANDIDATES.forEach((c) => preloadSound(c.src)) }, [])
    return (
        <div className="min-h-screen bg-[#131D22] text-white p-4 flex flex-col items-center gap-3">
            <h1 className="text-2xl font-extrabold mt-4">Звук верного ответа</h1>
            <p className="text-white/60 text-sm text-center max-w-sm">Нажимай и выбирай: какой больше подходит. Первый — тот, что сейчас.</p>
            <label className="flex items-center gap-3 text-sm text-white/80">
                Громкость {Math.round(vol * 100)}%
                <input type="range" min={0.1} max={1} step={0.05} value={vol} onChange={(e) => setVol(Number(e.target.value))} />
            </label>
            <div className="w-full max-w-sm flex flex-col gap-2">
                {CANDIDATES.map((c) => (
                    <button key={c.src} onClick={() => { playSound(c.src, vol); setLast(c.src) }}
                        className={`rounded-xl border-2 border-b-4 active:border-b-0 px-4 py-3 text-left font-bold ${last === c.src ? 'bg-[#2A3A22] border-[#60A12F]' : 'bg-[#1E2A30] border-[#3A464E]'}`}>
                        {c.name}
                    </button>
                ))}
            </div>
        </div>
    )
}
