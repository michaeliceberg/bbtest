'use client'
/* eslint-disable @next/next/no-img-element */

// Выбор курса в сайдбаре (выбран пользователем 2026-10-29 на /test-course-picker, вариант 2):
// кнопка в стиле пунктов меню юнитов (картинка курса, «Курс», название, стрелка) открывает шторку слева,
// в ней курсы — квадратные баннеры по 2 в ряд, сгруппированы по первому слову названия (ЕГЭ / ОГЭ / ЛНИП).
// Запасной вариант на будущее — вариант 4 там же (кнопка-баннер + окно по центру).

import { BookOpen, Check, ChevronRight, Flame } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { NAV_SHEET_CLASS, NAV_ITEM_PRESS, NAV_SECTION_LABEL_CLASS, navItemStyle } from '@/components/nav-sheet-ui'

export type PickerSheetCourse = { id: number; title: string; imageSrc?: string; streak?: number }

const GROUP_ORDER = ['ЕГЭ', 'ОГЭ', 'ЛНИП']
const groupsOf = (courses: PickerSheetCourse[]) => {
    const m = new Map<string, PickerSheetCourse[]>()
    for (const c of courses) { const g = c.title.split(' ')[0]; m.set(g, [...(m.get(g) ?? []), c]) }
    return [...m.entries()].sort(([a], [b]) => {
        const ia = GROUP_ORDER.indexOf(a), ib = GROUP_ORDER.indexOf(b)
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b)
    })
}

export const CoursePickerButton = ({ course, onClick }: { course?: PickerSheetCourse | null; onClick: () => void }) => (
    <button type="button" onClick={onClick} className={`w-full flex items-center gap-3 rounded-2xl p-2.5 text-left ${NAV_ITEM_PRESS}`} style={navItemStyle(false)}>
        {course?.imageSrc && <img src={course.imageSrc} alt="" className="h-11 w-11 flex-shrink-0 rounded-xl object-cover" />}
        <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#7E8F99]">Курс</span>
            <span className="truncate text-[15px] font-extrabold text-white">{course?.title ?? 'Выбери курс'}</span>
        </span>
        <ChevronRight className="h-5 w-5 flex-shrink-0 text-[#AEBCC5]" />
    </button>
)

export const CoursePickerSheet = ({ open, onOpenChange, courses, activeId, onPick }: {
    open: boolean
    onOpenChange: (open: boolean) => void
    courses: PickerSheetCourse[]
    activeId: number | null
    onPick: (id: number) => void
}) => (
    // Не модальное окно + своё затемнение (как меню юнитов): на телефоне шторка открывается поверх мобильного сайдбара.
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
        {open && <div className="fixed inset-0 z-[109] bg-black/70" onClick={() => onOpenChange(false)} aria-hidden />}
        <SheetContent side="left" className={`${NAV_SHEET_CLASS} z-[110]`}>
            <SheetTitle className="flex items-center gap-2 px-5 pb-3 pt-6 text-lg font-extrabold text-white"><BookOpen className="h-5 w-5" />Курсы</SheetTitle>
            <div className="flex flex-col gap-4 px-4 pb-8">
                {groupsOf(courses).map(([g, list]) => (
                    <div key={g} className="flex flex-col gap-2">
                        <div className={NAV_SECTION_LABEL_CLASS}>{g}</div>
                        <div className="grid grid-cols-2 gap-3">
                            {list.map((c) => {
                                const here = c.id === activeId
                                return (
                                    <button key={c.id} type="button" onClick={() => onPick(c.id)}
                                        className={`relative flex flex-col overflow-hidden rounded-2xl p-1.5 text-left ${NAV_ITEM_PRESS}`} style={navItemStyle(here)}>
                                        {c.imageSrc
                                            ? <img src={c.imageSrc} alt="" className="aspect-square w-full rounded-xl object-cover" />
                                            : <span className="aspect-square w-full rounded-xl bg-[#0F171B]" />}
                                        <span className="px-1 pb-0.5 pt-1.5 text-[13px] font-extrabold leading-tight text-white">{c.title}</span>
                                        {here && <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#151F23]"><Check className="h-4 w-4" /></span>}
                                        {!!c.streak && (
                                            <span className="absolute left-2.5 top-2.5 flex items-center gap-0.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[11px] font-bold text-orange-300"><Flame className="h-3 w-3 text-orange-400" />{c.streak}</span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </SheetContent>
    </Sheet>
)
