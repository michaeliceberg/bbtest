'use client'

// components/learn-unit-nav.tsx
//
// Задачник (/learn): как на /trainer — верхняя липкая шапка показывает кнопку с разделом, который
// сейчас на экране (его цвет, bounce при смене), по нажатию — меню разделов, сгруппированное
// «Часть 1 / Часть 2 / Дополнительно» (для ЕГЭ). Кнопку рисуют components/mobile-header.tsx (телефон)
// и app/(main)/trainer/header.tsx (компьютер) — они читают useTrainerNavStore.
// Блоки юнитов на странице помечены data-learn-unit-id (app/(main)/learn/page.tsx).

import { useEffect, useRef, useState } from 'react'
import { Check, Lock } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useTrainerNavStore } from '@/store/use-trainer-nav-store'
import { getUnitButtonColor, hexToRgba } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'

export type LearnSection = 'part1' | 'part2' | 'extra' | null
export type LearnNavUnit = { id: number; title: string; unitIndex: number; percent: number; isUnlocked: boolean; isCompleted: boolean; section: LearnSection }

export const SECTION_LABEL: Record<Exclude<LearnSection, null>, { title: string; color: string }> = {
    part1: { title: 'Часть 1 · краткий ответ', color: '#53ADEF' },
    part2: { title: 'Часть 2 · развёрнутый ответ', color: '#C385F7' },
    extra: { title: 'Дополнительно', color: '#9AA7B0' },
}

const HEADER_OFFSET = 76

export const scrollToLearnUnit = (id: number) => {
    const node = document.querySelector<HTMLElement>(`[data-learn-unit-id="${id}"]`)
    if (!node) return
    const y = node.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
    // страховка: если плавная прокрутка не доехала (поменялась высота страницы) — доезжаем сразу
    setTimeout(() => {
        if (Math.abs(node.getBoundingClientRect().top - HEADER_OFFSET) > 10) {
            window.scrollTo({ top: Math.max(0, node.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET), behavior: 'instant' as ScrollBehavior })
        }
    }, 1100)
}

export const LearnUnitNav = ({ units }: { units: LearnNavUnit[] }) => {
    const [currentId, setCurrentId] = useState<number | null>(units[0]?.id ?? null)
    const [menuOpen, setMenuOpen] = useState(false)
    const currentRef = useRef(currentId)
    currentRef.current = currentId
    const navSet = useTrainerNavStore((s) => s.set)
    const navSetOpen = useTrainerNavStore((s) => s.setOpen)
    const navClear = useTrainerNavStore((s) => s.clear)

    // какой раздел сейчас на экране: последний, чей верх поднялся выше шапки
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | null = null
        const update = () => {
            timer = null
            let pick: number | null = units[0]?.id ?? null
            for (const u of units) {
                const node = document.querySelector<HTMLElement>(`[data-learn-unit-id="${u.id}"]`)
                if (node && node.getBoundingClientRect().top <= 150) pick = u.id
            }
            setCurrentId((prev) => (prev === pick ? prev : pick))
        }
        const onScroll = () => { if (!timer) timer = setTimeout(update, 60) }
        update()
        const t0 = setTimeout(update, 400)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => { window.removeEventListener('scroll', onScroll); clearTimeout(t0); if (timer) clearTimeout(timer) }
    }, [units])

    useEffect(() => {
        navSetOpen(() => setMenuOpen(true))
        return () => navClear()
    }, [navSetOpen, navClear])

    useEffect(() => {
        const u = units.find((x) => x.id === currentId)
        if (!u) return
        const c = getUnitButtonColor(u.unitIndex)
        navSet({ title: u.title, button: c.button, bottom: c.bottom })
    }, [currentId, units, navSet])

    const go = (id: number) => {
        setMenuOpen(false)
        setTimeout(() => scrollToLearnUnit(id), 250)
    }

    // группы по частям (если разделов-частей нет — одна группа без заголовка)
    const groups: { section: LearnSection; units: LearnNavUnit[] }[] = []
    for (const u of units) {
        const last = groups[groups.length - 1]
        if (last && last.section === u.section) last.units.push(u)
        else groups.push({ section: u.section, units: [u] })
    }

    return (
        <Sheet open={menuOpen} onOpenChange={setMenuOpen} modal={false}>
            {/* Не модальное окно: у модального блокировка прокрутки сбрасывала страницу в начало. */}
            {menuOpen && <div className="fixed inset-0 z-[99] bg-black/70" onClick={() => setMenuOpen(false)} aria-hidden />}
            <SheetContent side="left" className="p-0 z-[100] bg-[#151F23] border-[#2B373D] w-[82%] sm:max-w-xs overflow-y-auto">
                <SheetTitle className="px-5 pt-6 pb-3 text-lg font-extrabold text-white">Разделы</SheetTitle>
                <div className="flex flex-col gap-4 px-4 pb-8">
                    {groups.map((g, gi) => (
                        <div key={gi} className="flex flex-col gap-1.5">
                            {g.section && (
                                <p className="px-1 pb-1 text-xs font-black uppercase tracking-wide" style={{ color: SECTION_LABEL[g.section].color }}>
                                    {SECTION_LABEL[g.section].title}
                                </p>
                            )}
                            {g.units.map((u) => {
                                const c = getUnitButtonColor(u.unitIndex)
                                const here = u.id === currentRef.current
                                return (
                                    <button
                                        key={u.id}
                                        type="button"
                                        disabled={!u.isUnlocked}
                                        onClick={() => go(u.id)}
                                        className={cn('flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left border-b-4 active:border-b-0 active:translate-y-[2px]', !u.isUnlocked && 'opacity-45 cursor-not-allowed')}
                                        style={here
                                            ? { background: `linear-gradient(135deg, ${c.button}, ${c.bottom})`, borderBottomColor: c.bottom }
                                            : { background: '#1E2A30', boxShadow: `inset 0 0 0 1.5px ${hexToRgba(c.button, 0.35)}`, borderBottomColor: '#161F23' }}
                                    >
                                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: here ? '#FFFFFF' : c.button }} />
                                        <span className="flex-1 min-w-0 text-[14px] font-extrabold leading-tight" style={{ color: here ? '#FFFFFF' : '#E2EAF0' }}>{u.title}</span>
                                        {!u.isUnlocked ? <Lock className="w-4 h-4 text-[#72838D] flex-shrink-0" />
                                            : u.isCompleted ? <Check className="w-4 h-4 flex-shrink-0" style={{ color: here ? '#FFFFFF' : c.button }} />
                                            : <span className="text-xs font-bold flex-shrink-0" style={{ color: here ? 'rgba(255,255,255,0.85)' : hexToRgba(c.button, 0.9) }}>{u.percent}%</span>}
                                    </button>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    )
}
