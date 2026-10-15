'use client'

// Выбор курса в шторке «Юниты» тренажёра (второе место, где можно переключить курс, кроме бокового меню).
// Сверху — название текущего курса, по нажатию раскрывается список; выбор — тот же switchCourse, что в сайдбаре.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Loader2 } from 'lucide-react'
import { switchCourse } from '@/actions/switch-course'
import { cn } from '@/lib/utils'

export type PickerCourse = { id: number; title: string }

const GROUP_ORDER = ['ЕГЭ', 'ОГЭ', 'ЛНИП']
const groupOf = (title: string) => title.split(' ')[0]

export const UnitSheetCoursePicker = ({ courses, activeCourseId }: { courses: PickerCourse[]; activeCourseId: number }) => {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [pendingId, setPendingId] = useState<number | null>(null)
    const [, startTransition] = useTransition()
    const active = courses.find((c) => c.id === activeCourseId)

    const groups = new Map<string, PickerCourse[]>()
    for (const c of courses) {
        const g = groupOf(c.title)
        groups.set(g, [...(groups.get(g) ?? []), c])
    }
    const entries = [...groups.entries()].sort(([a], [b]) => {
        const ia = GROUP_ORDER.indexOf(a), ib = GROUP_ORDER.indexOf(b)
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b)
    })

    const pick = (id: number) => {
        if (id === activeCourseId) { setOpen(false); return }
        setPendingId(id)
        startTransition(async () => {
            await switchCourse(id, '/trainer')
            router.refresh()
        })
    }

    return (
        <div className="px-4 pt-6 pb-2">
            <div className="mb-1.5 px-1 text-[10px] font-bold tracking-widest text-[#5A6A72] uppercase">Курс</div>
            <button type="button" onClick={() => setOpen((v) => !v)}
                className={cn('w-full flex items-center gap-2 rounded-2xl px-4 py-3 border-2 border-b-4 transition-colors',
                    open ? 'border-green-400/70 bg-[#1A2B22]' : 'border-green-400/30 bg-[#1A2B22]/60')}>
                <span className="flex-1 min-w-0 text-left text-lg font-extrabold text-green-300 truncate">{active?.title ?? 'Выбери курс'}</span>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="h-5 w-5 text-green-400" />
                </motion.span>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }} className="overflow-hidden">
                        <div className="mt-2 flex flex-col gap-1 rounded-2xl border border-[#2A363C] bg-[#1A252A] p-2">
                            {entries.map(([g, list], i) => (
                                <div key={g}>
                                    <div className={cn('px-2 pb-1 text-[10px] font-bold tracking-widest text-[#5A6A72] uppercase', i > 0 && 'pt-2')}>{g}</div>
                                    {list.map((c) => {
                                        const isActive = c.id === activeCourseId
                                        return (
                                            <button key={c.id} type="button" disabled={pendingId != null} onClick={() => pick(c.id)}
                                                className={cn('w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[15px] font-bold transition-colors',
                                                    isActive ? 'bg-green-500/15 text-green-300' : 'text-[#C9D4DA] hover:bg-[#232F34]')}>
                                                <span className="flex-1 min-w-0 truncate">{c.title}</span>
                                                {pendingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" />
                                                    : isActive ? <Check className="h-4 w-4" /> : null}
                                            </button>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
