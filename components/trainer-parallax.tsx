'use client'
// Параллакс-фон /trainer: мир меняется по открытому разделу карты (store/use-parallax-theme-store.ts).
import { ParallaxWorld } from '@/components/parallax-world'
import { useParallaxThemeStore } from '@/store/use-parallax-theme-store'

export const TrainerParallax = () => {
    const theme = useParallaxThemeStore((s) => s.theme)
    return <ParallaxWorld variant="rich" layers={2} behind theme={theme} />
}
