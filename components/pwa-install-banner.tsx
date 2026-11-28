'use client'

// Плашка «Установить на экран» для телефона в обычном браузере: в приложении (PWA) нет нижней панели браузера,
// которая закрывала кнопку ответа. Android/Chrome — настоящая кнопка (beforeinstallprompt), iPhone — подсказка про
// «Поделиться → На экран Домой». Уже открыто как приложение / не телефон / закрыли (на 14 дней) — не показываем.

import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import { playJustClick } from '@/lib/sound'

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
const KEY = 'ggInstallDismissedAt'
const HIDE_MS = 14 * 24 * 60 * 60 * 1000

export function PwaInstallBanner() {
    const [mode, setMode] = useState<'android' | 'ios' | null>(null)
    const [evt, setEvt] = useState<InstallEvent | null>(null)

    useEffect(() => {
        try {
            const nav = navigator as Navigator & { standalone?: boolean }
            if (nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches) return
            const at = Number(localStorage.getItem(KEY) || 0)
            if (at && Date.now() - at < HIDE_MS) return
            const ua = navigator.userAgent
            if (/iPhone|iPad|iPod/i.test(ua)) setMode('ios')
            else if (/Android/i.test(ua)) setMode('android')
        } catch { /* хранилище недоступно — просто не показываем */ }
        const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as InstallEvent) }
        const onInstalled = () => setMode(null)
        window.addEventListener('beforeinstallprompt', onPrompt)
        window.addEventListener('appinstalled', onInstalled)
        return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled) }
    }, [])

    if (!mode) return null
    const close = () => { try { localStorage.setItem(KEY, String(Date.now())) } catch { /* ok */ } setMode(null) }
    const install = async () => {
        playJustClick()
        if (!evt) return
        await evt.prompt()
        const r = await evt.userChoice.catch(() => null)
        if (r?.outcome === 'accepted') setMode(null)
        setEvt(null)
    }
    return (
        <div className="lg:hidden mx-4 mb-3 flex items-center gap-3 rounded-2xl border-2 border-[#3A464E] bg-[#1B262C] p-3 text-[#F2F7FB]">
            <div className="min-w-0 flex-1">
                <div className="text-[15px] font-black leading-tight">Установи ГГ ЕГЭ на экран</div>
                {mode === 'ios' ? (
                    <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[13px] font-bold text-[#9AAAB4]">
                        Нажми <Share size={14} strokeWidth={3} className="inline" /> и «На экран Домой». Так удобнее
                    </div>
                ) : (
                    <div className="mt-0.5 text-[13px] font-bold text-[#9AAAB4]">Без панели браузера, кнопки видно целиком</div>
                )}
            </div>
            {mode === 'android' && evt && (
                <button type="button" onClick={install}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-b-4 border-[#5FA12F] bg-[#78C93C] px-3 py-2 text-[14px] font-black text-[#151F24] active:border-b-0">
                    <Download size={16} strokeWidth={3} />Установить
                </button>
            )}
            <button type="button" onClick={close} aria-label="Закрыть" className="shrink-0 p-1 text-[#9AAAB4]"><X size={20} strokeWidth={3} /></button>
        </div>
    )
}
