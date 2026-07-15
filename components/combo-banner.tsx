// components/combo-banner.tsx
//
// Короткий ободряющий баннер "COMBO x5 / x10 / ...", который появляется
// при сериях правильных ответов подряд и сам исчезает через ~1с.

'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Props = {
    combo: number | null
    onDone: () => void
}

export const ComboBanner = ({ combo, onDone }: Props) => {
    useEffect(() => {
        if (combo === null) return
        const timer = window.setTimeout(onDone, 1100)
        return () => window.clearTimeout(timer)
    }, [combo, onDone])

    return (
        <AnimatePresence>
            {combo !== null && (
                <motion.div
                    className="fixed inset-x-0 top-1/3 z-[60] flex justify-center pointer-events-none"
                    initial={{ opacity: 0, scale: 0.6, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -10 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                >
                    <span
                        className="text-4xl sm:text-5xl font-extrabold tracking-wide text-amber-400"
                        style={{
                            WebkitTextStroke: '2px #7c2d12',
                            textShadow: '0 4px 0 #7c2d12',
                        }}
                    >
                        COMBO x{combo}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default ComboBanner
