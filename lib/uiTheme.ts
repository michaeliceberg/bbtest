// lib/uiTheme.ts
//
// Выбранный пользователем стиль оформления: 'metal' (игровой, по умолчанию)
// или 'cozy' (тёплый, lib/cozyTheme.ts). Хранится в cookie `uiTheme` на
// устройстве — сервер читает её в страницах (lib/uiThemeServer.ts), клиент —
// через useUiTheme(). Переключатель — components/theme-switch.tsx в сайдбаре.

'use client'

import { useEffect, useState } from 'react'
import type { UiTheme } from '@/lib/cozyTheme'

export const UI_THEME_COOKIE = 'uiTheme'

export const parseUiTheme = (v: string | undefined | null): UiTheme => (v === 'cozy' ? 'cozy' : 'metal')

export const readUiThemeCookie = (): UiTheme => {
    if (typeof document === 'undefined') return 'metal'
    const m = document.cookie.match(/(?:^|;\s*)uiTheme=([^;]+)/)
    return parseUiTheme(m?.[1])
}

export const writeUiThemeCookie = (theme: UiTheme) => {
    document.cookie = `${UI_THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`
    window.dispatchEvent(new Event('uitheme-change'))
}

// Для экранов, которые появляются только после действия пользователя
// (итоги урока, кейс, уровень), — первый рендер 'metal', затем значение
// из cookie (без рассинхрона с серверным HTML).
export const useUiTheme = (): UiTheme => {
    const [theme, setTheme] = useState<UiTheme>('metal')
    useEffect(() => {
        const sync = () => setTheme(readUiThemeCookie())
        sync()
        window.addEventListener('uitheme-change', sync)
        return () => window.removeEventListener('uitheme-change', sync)
    }, [])
    return theme
}
