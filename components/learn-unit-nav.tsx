'use client'

// components/learn-unit-nav.tsx
//
// Задачник (/learn): как на /trainer — верхняя липкая шапка показывает кнопку с разделом, который
// сейчас на экране (его цвет, bounce при смене), по нажатию — меню разделов, сгруппированное
// «Часть 1 / Часть 2 / Дополнительно» (для ЕГЭ). Кнопку рисуют components/mobile-header.tsx (телефон)
// и app/(main)/trainer/header.tsx (компьютер) — они читают useTrainerNavStore.
// Блоки юнитов на странице помечены data-learn-unit-id (app/(main)/learn/page.tsx).

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { NAV_SHEET_CLASS, NAV_ITEM_PRESS, NAV_SECTION_LABEL_CLASS, NavProgress, navItemStyle } from '@/components/nav-sheet-ui'
import { useTrainerNavStore } from '@/store/use-trainer-nav-store'
import { getUnitButtonColor } from '@/src/constants/lessonButtonColors'
import { cn } from '@/lib/utils'
import { useLearnOpenUnit } from '@/store/use-learn-open-unit'

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

// navigate — задачник с «Башней ЕГЭ»: на странице показан только один раздел, меню переключает раздел (?unit=ID).
export const LearnUnitNav = ({ units, navigate = false, selectedUnitId = null }: { units: LearnNavUnit[]; navigate?: boolean; selectedUnitId?: number | null }) => {
    const router = useRouter()
    const [currentId, setCurrentId] = useState<number | null>(navigate ? selectedUnitId : units[0]?.id ?? null)
    const [menuOpen, setMenuOpen] = useState(false)
    const currentRef = useRef(currentId)
    currentRef.current = currentId
    const navSet = useTrainerNavStore((s) => s.set)
    const navSetOpen = useTrainerNavStore((s) => s.setOpen)
    const navClear = useTrainerNavStore((s) => s.clear)

    // какой раздел сейчас на экране: последний, чей верх поднялся выше шапки
    useEffect(() => { if (navigate) setCurrentId(selectedUnitId) }, [navigate, selectedUnitId])

    useEffect(() => {
        if (navigate) return
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
    }, [units, navigate])

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
        if (navigate) { router.push(`/learn?unit=${id}`, { scroll: false }); return }
        useLearnOpenUnit.getState().setOpenId(id)
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
            <SheetContent side="left" className={NAV_SHEET_CLASS}>
                <SheetTitle className="px-5 pt-6 pb-3 text-lg font-extrabold text-white">Разделы</SheetTitle>
                <div className="flex flex-col gap-4 px-4 pb-8">
                    {groups.map((g, gi) => (
                        <div key={gi} className="flex flex-col gap-1.5">
                            {g.section && (
                                <p className={NAV_SECTION_LABEL_CLASS}>
                                    {SECTION_LABEL[g.section].title}
                                </p>
                            )}
                            {g.units.map((u) => {
                                                                const here = u.id === currentRef.current
                                return (
                                    <button
                                        key={u.id}
                                        type="button"
                                        disabled={!u.isUnlocked}
                                        onClick={() => go(u.id)}
                                        className={cn('flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left', NAV_ITEM_PRESS, !u.isUnlocked && 'opacity-45 cursor-not-allowed')}
                                        style={navItemStyle(here, !u.isUnlocked)}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: here ? '#F2F7FB' : '#5C6B73' }} />
                                        <span className="flex-1 min-w-0 text-[14px] font-extrabold leading-tight" style={{ color: here ? '#FFFFFF' : '#E2EAF0' }}>{u.title}</span>
                                        {!u.isUnlocked ? <Lock className="w-4 h-4 text-[#72838D] flex-shrink-0" />
                                            : <NavProgress percent={u.percent} done={u.isCompleted} />}
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
