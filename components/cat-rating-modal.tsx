'use client'

// components/cat-rating-modal.tsx
//
// Рейтинг котиков среди учеников: у кого котик больше (выпито больше зелий толстости, actions/cat.ts buyFatPotion).
// Открывается по плашке «Место N» рядом с холодильником (components/hangar-cat.tsx). Данные — actions/cat.ts getCatRating.

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, X } from 'lucide-react'
import { getCatRating, type CatRating } from '@/actions/cat'
import { catFatLabel, catFatSizeText } from '@/lib/catFood'

export function CatRatingModal({ onClose, demo }: { onClose: () => void; demo?: CatRating }) {
    const [data, setData] = useState<CatRating | null>(demo ?? null)
    useEffect(() => { if (!demo) getCatRating().then(setData).catch(() => {}) }, [demo])
    return (
        <div className="fixed inset-0 z-[3000] flex justify-center overflow-y-auto bg-black/65 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                className="my-auto w-full max-w-[380px] rounded-2xl border-2 border-[#5A3A22] bg-[#FFF6E4] p-3 text-[#3A2A1E] shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-[#D9A21B]" fill="#F2C35B" />
                    <span className="flex-1 text-lg font-black leading-tight">Рейтинг котиков</span>
                    <button type="button" onClick={onClose} aria-label="Закрыть" className="rounded-lg p-1 text-[#8C6A44]"><X className="h-5 w-5" /></button>
                </div>
                <p className="mt-0.5 text-sm font-bold text-[#8C6A44]">Чем больше зелий выпил котик, тем он больше</p>
                {!data ? (
                    <div className="py-8 text-center font-bold text-[#8C6A44]">Считаем котиков…</div>
                ) : (
                    <ol className="mt-2 space-y-1.5">
                        {data.rows.map((r, i) => (
                            <li key={`${r.place}-${i}`} className={`flex items-center gap-2 rounded-xl border-2 px-2 py-1.5 ${r.me ? 'border-[#D9A21B] bg-[#FFE9A8]' : 'border-[#E2D2AE] bg-white/60'}`}>
                                <span className="w-7 shrink-0 text-center text-lg font-black">{r.place}</span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-base font-black leading-tight">{r.name}{r.me ? ' (мой)' : ''}</span>
                                    <span className="block truncate text-xs font-bold text-[#8C6A44]">{r.owner} · {catFatLabel(r.fat)}</span>
                                </span>
                                <span className="shrink-0 text-right text-base font-black">{catFatSizeText(r.fat)}</span>
                            </li>
                        ))}
                        {data.rows.length === 0 && <li className="py-6 text-center font-bold text-[#8C6A44]">Пока ни одного котика</li>}
                    </ol>
                )}
                {data && data.myPlace !== null && !data.rows.some((r) => r.me) && (
                    <div className="mt-2 rounded-xl border-2 border-[#D9A21B] bg-[#FFE9A8] px-3 py-1.5 text-center text-base font-black">
                        Твой котик: {data.myPlace} место из {data.total}, {catFatSizeText(data.myFat)}
                    </div>
                )}
                <button type="button" onClick={onClose}
                    className="mx-auto mt-3 flex items-center gap-1.5 rounded-xl border-2 border-b-4 border-[#3A2A1E] bg-white px-4 py-2 text-base font-black active:border-b-0">
                    Закрыть
                </button>
            </motion.div>
        </div>
    )
}
