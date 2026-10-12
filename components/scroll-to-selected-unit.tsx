'use client'

// components/scroll-to-selected-unit.tsx — задачник с «Башней ЕГЭ»: после выбора этажа (?unit=ID)
// прокручивает к показанному разделу (на телефоне башня стоит над ним).

import { useEffect, useRef } from 'react'
import { scrollToLearnUnit } from '@/components/learn-unit-nav'

export const ScrollToSelectedUnit = ({ unitId }: { unitId: number | null }) => {
    const first = useRef(true)
    useEffect(() => {
        const fromUrl = new URLSearchParams(window.location.search).has('unit')
        if (unitId == null || (first.current && !fromUrl)) { first.current = false; return }
        first.current = false
        const t = setTimeout(() => scrollToLearnUnit(unitId), 120)
        return () => clearTimeout(t)
    }, [unitId])
    return null
}
