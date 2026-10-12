'use client'

// components/vuz-plaque.tsx
//
// Табличка на вершине «Башни ЕГЭ» (/learn и /path): вуз-цель ученика. По нажатию — окно выбора
// вуза (lib/vuzList.ts). Выбор ставит и цель по баллу (actions/ege-target.ts setTargetVuz).

import { useMemo, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GraduationCap, Search, X, ChevronDown, Check } from 'lucide-react'
import { VUZ_LIST, VUZ_DATA_YEAR, getVuz } from '@/lib/vuzList'
import { setTargetVuz } from '@/actions/ege-target'

const GOLD = '#F2C35B'

// Логотип на белой плашке — у большинства логотипов вузов тёмные цвета, на тёмном фоне не видно.
const VuzLogo = ({ src, size }: { src: string; size: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={`${size} shrink-0 rounded-lg bg-white object-contain p-1`} loading="lazy" />
)

export const VuzPlaque = ({ vuzId, forecast }: { vuzId: string | null; forecast?: number | null }) => {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [pending, startTransition] = useTransition()
    const [current, setCurrent] = useState<string | null>(vuzId)
    const vuz = getVuz(current)

    const list = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return VUZ_LIST
        return VUZ_LIST.filter((v) => `${v.short} ${v.name} ${v.city}`.toLowerCase().includes(q))
    }, [query])

    const pick = (id: string) => {
        setCurrent(id)
        setOpen(false)
        startTransition(async () => {
            await setTargetVuz(id)
            router.refresh()
        })
    }

    const gap = vuz && forecast != null ? Math.ceil(vuz.avg) - forecast : null

    return (
        <>
            <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setOpen(true)}
                className="relative mx-auto flex w-full items-center gap-2.5 rounded-2xl border-2 px-3 py-2 text-left"
                style={{
                    borderColor: vuz ? `${GOLD}AA` : '#3A464E',
                    background: vuz ? 'linear-gradient(180deg, rgba(242,195,91,0.18), rgba(242,195,91,0.05))' : '#1B252A',
                    boxShadow: `0 4px 0 ${vuz ? '#7A5A1C' : '#10171B'}`,
                }}
            >
                {vuz?.logo ? <VuzLogo src={vuz.logo} size="h-11 w-11" /> : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: vuz ? GOLD : '#26333B' }}>
                        <GraduationCap className="h-5 w-5" style={{ color: vuz ? '#3A2A08' : '#9AA7B0' }} />
                    </span>
                )}
                <span className="min-w-0 flex-1">
                    {vuz ? (
                        <>
                            <span className="block truncate text-[15px] font-black text-[#F2F7FB]">{vuz.short}</span>
                            <span className="block truncate text-[11px] font-bold text-[#C9B27A]">
                                на бюджет ≈ {Math.ceil(vuz.avg)} за предмет
                                {gap != null && (gap > 0 ? ` · ещё +${gap}` : ' · ты уже на уровне!')}
                            </span>
                        </>
                    ) : (
                        <>
                            <span className="block text-[15px] font-black text-[#F2F7FB]">Выбери вуз мечты</span>
                            <span className="block text-[11px] font-bold text-[#9AA7B0]">Покажем, сколько баллов нужно</span>
                        </>
                    )}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-[#9AA7B0]" />
                {pending && <span className="absolute inset-0 rounded-2xl bg-black/20" />}
            </motion.button>

            {open && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 sm:items-center" onClick={() => setOpen(false)}>
                    <div
                        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl border-2 border-[#2A363C] bg-[#151F23] sm:rounded-3xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-4 pb-2 pt-4">
                            <p className="text-lg font-black text-[#F2F7FB]">Куда поступаешь?</p>
                            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-[#9AA7B0]"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl border-2 border-[#2A363C] bg-[#0F171B] px-3 py-2">
                            <Search className="h-4 w-4 text-[#72838D]" />
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Поиск: МГУ, Бауманка, Казань…"
                                className="w-full bg-transparent text-sm font-bold text-[#F2F7FB] outline-none placeholder:text-[#5C6B73]"
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto px-3 pb-3">
                            {list.map((v) => {
                                const sel = v.id === current
                                return (
                                    <button
                                        key={v.id}
                                        type="button"
                                        onClick={() => pick(v.id)}
                                        className="mb-1.5 flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2 text-left active:translate-y-[1px]"
                                        style={{ borderColor: sel ? GOLD : '#232F34', background: sel ? 'rgba(242,195,91,0.1)' : '#1A2328' }}
                                    >
                                        {v.logo ? <VuzLogo src={v.logo} size="h-10 w-10" /> : (
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#26333B]">
                                                <GraduationCap className="h-5 w-5 text-[#72838D]" />
                                            </span>
                                        )}
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-black text-[#F2F7FB]">{v.short}</span>
                                            <span className="block truncate text-[11px] font-bold text-[#72838D]">{v.city}</span>
                                        </span>
                                        <span className="shrink-0 text-right">
                                            <span className="block text-base font-black" style={{ color: GOLD }}>{Math.ceil(v.avg)}</span>
                                            <span className="block text-[9px] font-bold uppercase text-[#5C6B73]">за предмет</span>
                                        </span>
                                        {sel && <Check className="h-4 w-4 shrink-0" style={{ color: GOLD }} />}
                                    </button>
                                )
                            })}
                            {list.length === 0 && <p className="py-6 text-center text-sm font-bold text-[#72838D]">Такого вуза пока нет в списке</p>}
                        </div>
                        <p className="border-t border-[#232F34] px-4 py-2 text-[10px] font-bold leading-snug text-[#5C6B73]">
                            Средний проходной балл ЕГЭ на бюджет за {VUZ_DATA_YEAR} год по всем направлениям вуза (postupi.online).
                            На сильные программы нужно больше.
                        </p>
                    </div>
                </div>,
                document.body,
            )}
        </>
    )
}
