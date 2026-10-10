'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { wantPro } from '@/actions/pro-interest'

export const ProWantButton = ({ initiallyWanted, source, earlyPrice, discount }: {
    initiallyWanted: boolean; source?: string; earlyPrice: number; discount: number
}) => {
    const [wanted, setWanted] = useState(initiallyWanted)
    const [pending, startTransition] = useTransition()

    if (wanted) {
        return (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                className="rounded-2xl border-2 border-[#78C93C] bg-[#78C93C]/10 p-4 text-center">
                <div className="text-3xl">🎉</div>
                <div className="mt-1 text-lg font-black">Ты в списке!</div>
                <p className="mt-1 text-sm text-[#C9D3D9]">
                    PRO скоро запустится. Тем, кто записался первым, — скидка {discount}%: <b className="text-[#F2C35B]">{earlyPrice} ₽</b> за первый месяц.
                </p>
            </motion.div>
        )
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(async () => {
                    const res = await wantPro(source)
                    if (res.ok) setWanted(true)
                })}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#F2C35B] via-[#FFD84D] to-[#F2C35B] text-lg font-black text-[#3A2A08] shadow-[0_6px_0_#8A6A1E] active:translate-y-1 active:shadow-[0_2px_0_#8A6A1E] transition-transform disabled:opacity-60"
            >
                {pending ? '...' : 'Хочу PRO 👑'}
            </button>
            <p className="text-xs text-[#6B7A83]">Сейчас ничего не списываем — запишем тебя в ранний доступ со скидкой {discount}%</p>
        </div>
    )
}
