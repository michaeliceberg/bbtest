'use client'

// components/pwa-resume.tsx — приложение «на экране Домой» (PWA) открывается там, где ученик был в прошлый раз.
// iPhone при новом запуске всегда открывает start_url из manifest (/trainer). Мы запоминаем последнюю страницу
// в localStorage и при холодном запуске (в sessionStorage ещё нет метки) переходим на неё.
// Работает только в режиме приложения (standalone), в обычном браузере ничего не делает.

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const KEY = 'ggLastPath'
const SESSION_KEY = 'ggPwaStarted'
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000 // старше трёх дней — открываем как обычно
const START = '/trainer'
// Страницы, куда возвращаем; остальное (вход, тесты, оплата) не запоминаем
const RESUME = /^\/(learn|trainer|path|account|gang|gangs|gym|photo-task|reference|lesson\/\d+|t-lesson\/\d+|move\/\d+)(\/|\?|$)/

const isStandalone = () =>
    (typeof navigator !== 'undefined' && (navigator as Navigator & { standalone?: boolean }).standalone === true) ||
    (typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches)

export function PwaResume() {
    const pathname = usePathname()
    const router = useRouter()

    // Холодный запуск приложения: один раз за сессию
    useEffect(() => {
        try {
            if (!isStandalone() || sessionStorage.getItem(SESSION_KEY)) return
            sessionStorage.setItem(SESSION_KEY, '1')
            if (window.location.pathname !== START) return
            const saved = JSON.parse(localStorage.getItem(KEY) || 'null') as { path: string; at: number } | null
            if (saved && saved.path !== START && Date.now() - saved.at < MAX_AGE_MS && RESUME.test(saved.path)) router.replace(saved.path)
        } catch { /* хранилище недоступно — открываем как обычно */ }
    }, [router])

    // Запоминаем текущую страницу
    useEffect(() => {
        try {
            if (!isStandalone() || !pathname || !RESUME.test(pathname)) return
            localStorage.setItem(KEY, JSON.stringify({ path: pathname + window.location.search, at: Date.now() }))
        } catch { /* ignore */ }
    }, [pathname])

    return null
}
