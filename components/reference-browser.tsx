// components/reference-browser.tsx
//
// Клиентская часть /reference — фильтр по теме + текстовый поиск по
// уже загруженному (см. app/(main)/reference/page.tsx) списку формул.
// Каждая карточка держит зарезервированное место под иллюстрацию к
// формуле (imageSrc пока всегда null — картинки не нарисованы, но
// вёрстка уже рассчитана под них по прямой просьбе пользователя).

'use client'

import { useMemo, useState } from 'react'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css'
import { Image as ImageIcon, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ReferenceEntryData = {
    id: number
    topic: string
    label: string
    symbol: string
    name: string | null
    unit: string | null
    formula: string
    imageSrc: string | null
}

// Разные акцентные цвета по темам — чисто навигационная функция (быстро
// отличить тему по цвету плашки), не смысловая (не пересекается с
// цветами "верно/неверно" и т.п. из разборов по шагам).
const TOPIC_ACCENT: Record<string, string> = {
    'Динамика': '#7dd3fc',
    'Кинематика': '#4ADE80',
    'Электростатика': '#FBBF24',
    'Электродинамика': '#8B5CF6',
    'Оптика': '#FB923C',
    'Газ и нагрев': '#F472B6',
}
const DEFAULT_ACCENT = '#9AA7B0'

const chipClass = (active: boolean) => cn(
    'px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors whitespace-nowrap',
    active ? '' : 'bg-[#161F23] border-[#3A464E] text-[#9AA7B0] hover:text-[#F2F7FB]'
)

export const ReferenceBrowser = ({ entries }: { entries: ReferenceEntryData[] }) => {
    const topics = useMemo(() => Array.from(new Set(entries.map((e) => e.topic))), [entries])
    const [activeTopic, setActiveTopic] = useState<string>('all')
    const [query, setQuery] = useState('')

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return entries.filter((e) => {
            if (activeTopic !== 'all' && e.topic !== activeTopic) return false
            if (!q) return true
            return (
                e.label.toLowerCase().includes(q) ||
                (e.name ?? '').toLowerCase().includes(q) ||
                e.symbol.toLowerCase().includes(q) ||
                e.formula.toLowerCase().includes(q) ||
                (e.unit ?? '').toLowerCase().includes(q)
            )
        })
    }, [entries, activeTopic, query])

    return (
        <div className="flex flex-col gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6A72]" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Искать по названию, символу, формуле или единице..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#161F23] border-2 border-[#3A464E] text-[#F2F7FB] placeholder:text-[#5A6A72] focus:outline-none focus:border-[#4A90D9] transition-colors"
                />
            </div>

            <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={() => setActiveTopic('all')} className={chipClass(activeTopic === 'all')}>
                    Все темы
                </button>
                {topics.map((t) => {
                    const active = activeTopic === t
                    const accent = TOPIC_ACCENT[t] ?? DEFAULT_ACCENT
                    return (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setActiveTopic(t)}
                            className={chipClass(active)}
                            style={active ? { backgroundColor: `${accent}22`, borderColor: `${accent}66`, color: accent } : undefined}
                        >
                            {t}
                        </button>
                    )
                })}
            </div>

            <div className="text-xs text-[#5A6A72]">
                {filtered.length} {filtered.length === 1 ? 'формула' : 'формул'}
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-16 text-[#5A6A72]">Ничего не найдено</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filtered.map((e) => {
                        const accent = TOPIC_ACCENT[e.topic] ?? DEFAULT_ACCENT
                        return (
                            <div key={e.id} className="flex gap-3 rounded-xl border-2 border-[#3A464E] bg-[#161F23] p-3">
                                {/* Зарезервированное место под иллюстрацию к ЭТОЙ
                                    конкретной формуле — по одной картинке на
                                    карточку. imageSrc пока не заполнен ни у одной
                                    записи (см. scripts/seedPhysicsReference.ts) —
                                    показываем placeholder-иконку. */}
                                <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-[#1A252B] border border-[#2A363D] flex items-center justify-center overflow-hidden">
                                    {e.imageSrc ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={e.imageSrc} alt="" className="w-full h-full object-contain" />
                                    ) : (
                                        <ImageIcon className="w-5 h-5 text-[#3A464E]" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent }}>
                                        {e.topic}
                                    </div>
                                    <div className="text-sm text-[#F2F7FB] font-semibold truncate">{e.label}</div>
                                    <div className="text-base font-bold text-[#F2F7FB] mt-0.5 overflow-x-auto">
                                        <Latex>{`$${e.symbol} = ${e.formula}$`}</Latex>
                                    </div>
                                    {e.unit && (
                                        <div className="text-xs text-[#9AA7B0] mt-1">
                                            измеряется в <span className="font-semibold text-[#7dd3fc]">{e.unit}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
