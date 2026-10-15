'use client'

// Тестовая страница: как подписывать уроки на карте тренажёра поверх параллакс-фона.
// Варианты подложки под названием урока: без подложки, размытие фона (стекло), плотная плашка, тень у текста.
// Внизу — переключатель 2 / 3 слоя параллакса.

import { useState } from 'react'
import { BookOpen, Egg, Shield, Sword, Crown, Lock } from 'lucide-react'
import { ParallaxWorld } from '@/components/parallax-world'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'

type Style = 'none' | 'blur' | 'plate' | 'shadow'
const STYLES: { id: Style; label: string }[] = [
    { id: 'none', label: 'Без подложки' },
    { id: 'blur', label: 'Размытие' },
    { id: 'plate', label: 'Плашка' },
    { id: 'shadow', label: 'Тень' },
]

const STAGES = [
    { title: 'Знакомство с окружностью', badge: 'π · 2π · π/2', lesson: true },
    { title: 'Окружность: тренировка', badge: '13 заданий', lesson: false },
    { title: 'Три волшебных угла', badge: '30° · 45° · 60°', lesson: true },
    { title: 'Тангенс из синуса и косинуса', badge: '', lesson: true },
    { title: 'Таблица 30°, 45°, 60°: тренировка', badge: '10 заданий', lesson: false },
    { title: 'Секторы', badge: '', lesson: false },
    { title: 'Контрольная: мифический кейс', badge: '20 заданий', lesson: false },
]
const ICONS = [Egg, Shield, Sword, Crown]
const BLOCKS = [
    { title: 'Тригонометрическая окружность', color: GGEGE_PALETTE.blue, done: 4 },
    { title: 'Логарифмы', color: GGEGE_PALETTE.purple, done: 1 },
    { title: 'Теорема Виета', color: GGEGE_PALETTE.green, done: 0 },
]

// Подложка под текст. blur — backdrop-filter: на телефоне это дорого, если фон под ним двигается.
const labelBox = (style: Style): { className: string; style?: React.CSSProperties } => {
    switch (style) {
        case 'blur':
            return { className: 'rounded-xl px-2.5 py-1.5 backdrop-blur-md', style: { backgroundColor: 'rgba(19,29,34,0.45)' } }
        case 'plate':
            return { className: 'rounded-xl px-2.5 py-1.5 border border-[#2A363C]', style: { backgroundColor: 'rgba(21,31,35,0.88)' } }
        default:
            return { className: '' }
    }
}

export default function TestStageLabelsPage() {
    const [style, setStyle] = useState<Style>('blur')
    const [layers, setLayers] = useState(2)
    const [on, setOn] = useState(true)
    const shadow = style === 'shadow' ? '0 1px 2px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.8)' : undefined

    return (
        <div className="relative min-h-screen bg-[#131D22]">
            <ParallaxWorld enabled={on} layers={layers} variant="rich" />

            <div className="sticky top-0 z-20 flex flex-wrap items-center justify-center gap-2 border-b border-[#2A363C] bg-[#131D22]/95 px-3 py-2">
                {STYLES.map((s) => (
                    <button key={s.id} type="button" onClick={() => setStyle(s.id)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-black ${style === s.id ? 'bg-[#C385F7] text-[#1E0F2E]' : 'bg-[#2A363C] text-[#9AA7B0]'}`}>
                        {s.label}
                    </button>
                ))}
                {[2, 3].map((n) => (
                    <button key={n} type="button" onClick={() => setLayers(n)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-black ${layers === n ? 'bg-[#53ADEF] text-[#0B1F2E]' : 'bg-[#2A363C] text-[#9AA7B0]'}`}>
                        {n} слоя
                    </button>
                ))}
                <button type="button" onClick={() => setOn((v) => !v)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-black ${on ? 'bg-[#78C93C] text-[#1B2A10]' : 'bg-[#2A363C] text-[#9AA7B0]'}`}>
                    Фон: {on ? 'вкл' : 'выкл'}
                </button>
            </div>

            <div className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-10 px-4 py-8">
                {BLOCKS.map((b) => (
                    <div key={b.title} className="flex flex-col gap-6">
                        <div className="w-full rounded-2xl border-2 px-4 py-3 text-lg font-black text-white"
                            style={{ borderColor: b.color.bottom, backgroundColor: hexToRgba(b.color.button, 0.18) }}>
                            {b.title}
                        </div>
                        {STAGES.map((s, i) => {
                            const unlocked = i <= b.done
                            const Icon = ICONS[i % ICONS.length]
                            const shift = Math.sin(i * 1.15) * 60
                            const box = labelBox(style)
                            return (
                                <div key={i} className="relative flex items-center" style={{ paddingLeft: 90 + shift }}>
                                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border-b-4"
                                        style={{
                                            backgroundColor: unlocked ? b.color.button : '#2A363C',
                                            borderColor: unlocked ? b.color.bottom : '#1C252A',
                                        }}>
                                        {unlocked ? <Icon className="h-7 w-7 text-white" /> : <Lock className="h-6 w-6 text-[#5A6B76]" />}
                                    </div>
                                    <div className="ml-3 min-w-0">
                                        <div className={`inline-block max-w-full ${box.className}`} style={box.style}>
                                            {s.lesson && (
                                                <div className={`mb-1 inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[11px] font-black uppercase leading-none tracking-[0.2em] ${unlocked ? 'lesson-pill' : 'border border-[#8A8466]/50 opacity-40'}`}>
                                                    <BookOpen className="relative h-3.5 w-3.5" style={{ color: unlocked ? '#412402' : '#8A8466' }} />
                                                    <span className="relative" style={{ color: unlocked ? '#412402' : '#8A8466' }}>Урок</span>
                                                </div>
                                            )}
                                            <div className="line-clamp-3 text-[15px] font-extrabold leading-tight"
                                                style={{ color: unlocked ? b.color.button : 'rgba(114,131,141,0.75)', textShadow: shadow }}>
                                                {s.title}
                                            </div>
                                            {s.badge && (
                                                <div className="mt-1 text-[11px] font-semibold leading-tight"
                                                    style={{ color: unlocked ? hexToRgba(b.color.button, 0.75) : 'rgba(114,131,141,0.6)', textShadow: shadow }}>
                                                    {s.badge}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}
