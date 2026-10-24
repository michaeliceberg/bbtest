'use client'

// /test-gaga — послушать все реплики Га-Га (lib/gagaVoice.ts) вместе с картинками эмоций. Только для проверки.

import { useRef, useState } from 'react'
import { Play, Square } from 'lucide-react'
import { showGaga } from '@/components/gaga-buddy'
import { GAGA_LINES, GAGA_EMOTION, gagaAudio, gagaCaption, type GagaEvent } from '@/lib/gagaVoice'

const EVENT_TITLE: Record<GagaEvent, string> = {
    start: 'Начало урока', correct: 'Верный ответ', wrong: 'Ошибка', rule: 'Правило / ЗАПОМНИ', streak: 'Серия',
    chest: 'Сундук', levelup: 'Новый уровень', done: 'Урок пройден', boss: 'Босс-экзамен', night: 'Ночь',
}

export default function TestGaga() {
    const audio = useRef<HTMLAudioElement | null>(null)
    const [playing, setPlaying] = useState<string | null>(null)
    const play = (id: string) => {
        audio.current?.pause()
        if (playing === id) { setPlaying(null); return }
        const a = new Audio(gagaAudio(id))
        audio.current = a
        a.onended = () => setPlaying((p) => (p === id ? null : p))
        a.play()
        setPlaying(id)
    }
    const events = Object.keys(EVENT_TITLE) as GagaEvent[]
    return (
        <div className="min-h-screen bg-[#161F23] text-[#F2F7FB] px-4 py-6">
            <div className="max-w-2xl mx-auto flex flex-col gap-6">
                <h1 className="text-2xl font-black">Голос Га-Га</h1>
                <button type="button" onClick={() => showGaga('streak', { shot: true })}
                    className="self-start rounded-xl bg-[#F09B38] px-4 py-2.5 font-black text-[#1C1206]">
                    🔫 Выстрел (удар молнии КОМБО)
                </button>
                {events.map((ev) => (
                    <div key={ev} className="rounded-2xl border-2 border-[#3A464E] bg-[#1C272C] p-4 flex gap-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={GAGA_EMOTION[ev]} alt="" className="w-24 h-24 md:w-28 md:h-28 object-contain shrink-0" />
                        <div className="flex-1 min-w-0 flex flex-col gap-2">
                            <div className="font-black text-[#C385F7]">{EVENT_TITLE[ev]}</div>
                            {GAGA_LINES.filter((l) => l.event === ev).map((l) => (
                                <button key={l.id} type="button" onClick={() => play(l.id)}
                                    className="flex items-center gap-2 text-left rounded-xl px-3 py-2 bg-[#161F23] border border-[#3A464E] active:translate-y-[2px]">
                                    {playing === l.id ? <Square className="w-4 h-4 shrink-0 text-[#F2C35B]" /> : <Play className="w-4 h-4 shrink-0 text-[#78C93C]" />}
                                    <span className="text-sm font-bold">{gagaCaption(l.text)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
