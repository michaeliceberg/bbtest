'use client'

// components/ai-helper-button.tsx — кнопка «ИИ-помощник» на /trainer (ведёт на /photo-task).
// Дизайн — «волшебная кнопка» из Garaggio (класс .btn-magic в app/globals.css): переливающийся градиент,
// бегущий блик, всплывающие искры, иконка мерцает. Только CSS (transform/opacity/background-position).

import Link from 'next/link'
import { Sparkles, ChevronRight } from 'lucide-react'

export const AiHelperButton = () => (
    <Link href='/photo-task' className='btn-magic mt-4 !justify-start text-left'
        style={{ minHeight: 68, padding: '12px 16px', borderRadius: '1rem', gap: '0.75rem' }}>
        {[12, 34, 58, 80, 94].map((left, i) => (
            <span key={left} aria-hidden className='magic-spark' style={{ left: `${left}%`, animationDelay: `${i * 0.37}s` }} />
        ))}
        <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl'
            style={{ background: 'rgba(27,20,7,0.16)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.45)' }}>
            <Sparkles className='magic-icon h-6 w-6' strokeWidth={2.4} />
        </span>
        <span className='min-w-0 flex-1'>
            <span className='block text-[17px] font-black leading-tight'>ИИ-помощник</span>
            <span className='block text-xs font-bold leading-snug opacity-80'>Пришли фото любой задачи — подскажу, какие уроки пройти</span>
        </span>
        <ChevronRight className='h-6 w-6 shrink-0' strokeWidth={3} />
    </Link>
)
