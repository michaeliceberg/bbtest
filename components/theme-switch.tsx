'use client'

// Переключатель стиля оформления в сайдбаре: «Игровой» / «Тёплый».
// Пишет cookie (lib/uiTheme.ts) и перерисовывает страницу с сервера.

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { UiTheme } from '@/lib/cozyTheme'
import { readUiThemeCookie, writeUiThemeCookie } from '@/lib/uiTheme'

const OPTIONS: { value: UiTheme; label: string }[] = [
    { value: 'metal', label: '🎮 Игровой' },
    { value: 'cozy', label: '🏡 Тёплый' },
]

export const ThemeSwitch = ({ cozy = false }: { cozy?: boolean }) => {
    const router = useRouter()
    const [theme, setTheme] = useState<UiTheme>('metal')
    const [, startTransition] = useTransition()
    useEffect(() => setTheme(readUiThemeCookie()), [])

    const choose = (t: UiTheme) => {
        if (t === theme) return
        setTheme(t)
        writeUiThemeCookie(t)
        startTransition(() => router.refresh())
    }

    return (
        <div className="px-2 pb-3">
            <div className="px-1 mb-1.5 text-[10px] font-bold tracking-widest text-[#5A6A72] uppercase">Стиль</div>
            <div className="flex gap-1 rounded-xl p-1" style={{ background: cozy ? '#2D2A27' : '#1C282E' }}>
                {OPTIONS.map((o) => {
                    const active = o.value === theme
                    return (
                        <button
                            key={o.value}
                            type="button"
                            onClick={() => choose(o.value)}
                            className="relative flex-1 rounded-lg py-2 text-xs font-bold transition-colors"
                            style={{ color: active ? (o.value === 'cozy' ? '#3A2412' : '#FFFFFF') : '#9AA7B0' }}
                        >
                            {active && (
                                <motion.span
                                    layoutId="ui-theme-pill"
                                    className="absolute inset-0 rounded-lg"
                                    style={
                                        o.value === 'cozy'
                                            ? { background: '#F2C35B', boxShadow: '0 3px 0 #B8862E' }
                                            : { background: 'linear-gradient(135deg, #53ADEF, #428BC0)', boxShadow: '0 0 12px -2px rgba(83,173,239,0.7)' }
                                    }
                                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                                />
                            )}
                            <span className="relative z-10">{o.label}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
