// store/use-parallax-theme-store.ts — какой «мир» параллакс-фона показывать на /trainer.
// Карта тренажёра (components/trainer-grade-tree.tsx) сообщает название открытого блока/юнита,
// фон (components/trainer-parallax.tsx) переводит его в мир (components/parallax-themes.tsx).
import { create } from 'zustand'
import type { ParallaxTheme } from '@/components/parallax-themes'

export const themeForSection = (title: string | null | undefined): ParallaxTheme => {
    const t = (title ?? '').toLowerCase()
    if (/тригоном|sin|приведени|записать ответ/.test(t)) return 'trig'
    if (/планиметр|окружност|треугольн|подоби/.test(t)) return 'planim'
    if (/логарифм/.test(t)) return 'log'
    if (/электр|магнит|динамик|кинемат|оптик|газ|квант|физик|тепло|ленц|фараде/.test(t)) return 'physics'
    return 'default'
}

export const useParallaxThemeStore = create<{ theme: ParallaxTheme; setTheme: (t: ParallaxTheme) => void }>((set) => ({
    theme: 'default',
    setTheme: (theme) => set({ theme }),
}))
