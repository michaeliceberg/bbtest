'use client'

// components/ai-helper-button.tsx — кнопка «ИИ-помощник» на /trainer (ведёт на /photo-task).
// Иконка Sparkles на градиентной плашке, вокруг неё постоянно вылетают и гаснут искры — тот же приём, что у
// горящей полоски прогресса тренажёра (components/trainer-progress-bar.tsx, класс .animate-progress-spark):
// только transform/opacity, частиц на экране не больше MAX_SPARKS. Пока вкладка скрыта — новые искры не создаём.
// Объём — boxShadow, нажатие — translate: высота кнопки не меняется, страница ниже не прыгает.

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

type Spark = { id: number; x: number; y: number; dx: number; dy: number; size: number; dur: number; color: string; star: boolean }

const COLORS = ['#9FD3FA', '#C9A2FA', '#FFFFFF', '#7FC6F7', '#E3C8FF']
const MAX_SPARKS = 22
const ICON_CX = 38 // центр плашки с иконкой от левого края кнопки (px): 16 отступ + 22 половина плашки
const SPAWN_MS = 190

export const AiHelperButton = () => {
    const [sparks, setSparks] = useState<Spark[]>([])
    const nextId = useRef(0)
    useEffect(() => {
        const t = setInterval(() => {
            if (document.visibilityState === 'hidden') return
            const n = Math.random() < 0.35 ? 2 : 1
            const fresh: Spark[] = Array.from({ length: n }, () => {
                const a = Math.random() * Math.PI * 2
                const r0 = 22 + Math.random() * 6 // старт у края плашки (половина плашки — 22px), снаружи
                const dist = 18 + Math.random() * 30
                const star = Math.random() < 0.45
                return {
                    id: nextId.current++,
                    x: ICON_CX + Math.cos(a) * r0,
                    y: Math.sin(a) * r0,
                    dx: Math.cos(a) * dist,
                    dy: Math.sin(a) * dist - 6,
                    size: star ? 10 + Math.random() * 6 : 2.5 + Math.random() * 3,
                    dur: 700 + Math.random() * 700,
                    color: COLORS[Math.floor(Math.random() * COLORS.length)],
                    star,
                }
            })
            setSparks((prev) => [...prev.slice(-(MAX_SPARKS - n)), ...fresh])
        }, SPAWN_MS)
        return () => clearInterval(t)
    }, [])
    const drop = (id: number) => setSparks((prev) => prev.filter((s) => s.id !== id))

    return (
        <Link href='/photo-task'
            className='shine-sweep relative mt-4 flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 transition-transform active:translate-y-[4px]'
            style={{
                background: 'linear-gradient(135deg, #1D3A52 0%, #1A2530 55%, #2A1F3D 100%)',
                boxShadow: 'inset 0 0 0 1.5px rgba(120,190,245,0.55), inset 0 1px 0 rgba(255,255,255,0.18), 0 4px 0 #0D1A24, 0 0 22px rgba(83,173,239,0.18)',
            }}>
            {/* Мягкое свечение за плашкой — пульсирует только opacity */}
            <span aria-hidden className='animate-glow-pulse pointer-events-none absolute left-[2px] top-1/2 h-20 w-20 -translate-y-1/2 rounded-full'
                style={{ background: 'radial-gradient(circle, rgba(150,120,240,0.55), transparent 65%)' }} />
            <span className='relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white'
                style={{ background: 'linear-gradient(135deg, #53ADEF, #7C5CE0)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 3px 0 #2E4E8A, 0 0 14px rgba(124,92,224,0.55)' }}>
                <Sparkles className='h-6 w-6' strokeWidth={2.4} />
            </span>
            {sparks.map((s) => (
                <span key={s.id} aria-hidden onAnimationEnd={() => drop(s.id)}
                    className='animate-progress-spark pointer-events-none absolute top-1/2 z-10'
                    style={{
                        left: s.x - s.size / 2,
                        marginTop: s.y - s.size / 2,
                        width: s.size,
                        height: s.size,
                        animationDuration: `${s.dur}ms`,
                        '--spark-dx': `${s.dx}px`,
                        '--spark-dy': `${s.dy}px`,
                    } as CSSProperties}>
                    {s.star ? (
                        <svg viewBox='0 0 10 10' className='h-full w-full' style={{ filter: `drop-shadow(0 0 3px ${s.color})` }}>
                            <path d='M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z' fill={s.color} />
                        </svg>
                    ) : (
                        <span className='block h-full w-full rounded-full' style={{ backgroundColor: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                    )}
                </span>
            ))}
            <span className='relative min-w-0 flex-1'>
                <span className='block font-black text-white'>ИИ-помощник</span>
                <span className='block text-xs font-bold text-[#A9C3D6]'>Пришли фото любой задачи — подскажу, какие уроки пройти</span>
            </span>
            <span className='relative text-lg font-black text-[#9FD3FA]'>›</span>
        </Link>
    )
}
