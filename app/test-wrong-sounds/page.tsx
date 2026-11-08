'use client'

import { useEffect, useState } from 'react'
import { playSound, preloadSound, JUST_CLICK_SOUND, RIGHT_CLICK_SOUND } from '@/lib/sound'

// Выбор звука неверного ответа: сейчас он почти такой же «клик», как верный.
const CANDIDATES = [
    { src: '/snd-wrong-answer-click.mp3', name: 'Сейчас: клик ошибки' },
    { src: '/snd-answer-wrong.mp3', name: 'Старый «неверно» (длинный)' },
    { src: '/incorrect.wav', name: 'Старый incorrect.wav' },
    { src: '/wrong-candidates/1-boop-boop.m4a', name: '1. Уп-уп (два низких)' },
    { src: '/wrong-candidates/2-buzz.m4a', name: '2. Жужжание' },
    { src: '/wrong-candidates/3-wah.m4a', name: '3. Ва-а (вниз)' },
    { src: '/wrong-candidates/4-bonk.m4a', name: '4. Бонк (деревянный)' },
    { src: '/wrong-candidates/5-uh-oh.m4a', name: '5. Ой-ой (две ноты)' },
    { src: '/wrong-candidates/6-thud.m4a', name: '6. Глухой удар' },
]

export default function TestWrongSounds() {
    const [vol, setVol] = useState(0.6)
    const [last, setLast] = useState<string | null>(null)
    useEffect(() => { CANDIDATES.forEach((c) => preloadSound(c.src)) }, [])

    return (
        <div className="min-h-screen bg-[#131D22] text-white p-4 flex flex-col items-center gap-3">
            <h1 className="text-2xl font-extrabold mt-4">Звук неверного ответа</h1>
            <p className="text-white/60 text-sm text-center max-w-sm">Нажимай и выбирай. Для сравнения ниже — клики «выбрал вариант» и «верно» с новой (тише) громкостью.</p>
            <label className="flex items-center gap-3 text-sm text-white/80">
                Громкость {Math.round(vol * 100)}%
                <input type="range" min={0.1} max={1} step={0.05} value={vol} onChange={(e) => setVol(Number(e.target.value))} />
            </label>
            <div className="w-full max-w-sm flex flex-col gap-2">
                {CANDIDATES.map((c) => (
                    <button
                        key={c.src}
                        onClick={() => { playSound(c.src, vol); setLast(c.name) }}
                        className={`rounded-xl border-2 border-b-4 active:border-b-0 px-4 py-3 text-left font-bold ${last === c.name ? 'bg-[#3A2A2C] border-[#DC605B]' : 'bg-[#1E2A30] border-[#3A464E]'}`}
                    >{c.name}</button>
                ))}
            </div>
            <div className="w-full max-w-sm flex gap-2 mt-4">
                <button onClick={() => playSound(JUST_CLICK_SOUND, 0.3)} className="flex-1 rounded-xl border-2 border-b-4 active:border-b-0 border-[#3A464E] bg-[#1E2A30] px-3 py-3 font-bold">Клик выбора</button>
                <button onClick={() => playSound(RIGHT_CLICK_SOUND, 0.45)} className="flex-1 rounded-xl border-2 border-b-4 active:border-b-0 border-[#60A12F] bg-[#2A3A22] px-3 py-3 font-bold">Верно</button>
            </div>
        </div>
    )
}
