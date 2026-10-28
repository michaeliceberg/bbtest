'use client'
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react'
import { Check, ChevronDown, ChevronRight, ArrowLeftRight, BookOpen } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { NAV_SHEET_CLASS, NAV_ITEM_PRESS, navItemStyle } from '@/components/nav-sheet-ui'

type C = { id: number; title: string; imageSrc: string }
const GROUP_ORDER = ['ЕГЭ', 'ОГЭ', 'ЛНИП']
const groupsOf = (courses: C[]) => {
    const m = new Map<string, C[]>()
    for (const c of courses) { const g = c.title.split(' ')[0]; m.set(g, [...(m.get(g) ?? []), c]) }
    return [...m.entries()].sort(([a], [b]) => ((GROUP_ORDER.indexOf(a) + 99) % 99) - ((GROUP_ORDER.indexOf(b) + 99) % 99))
}
const LABEL = 'px-1 pb-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#7E8F99]'

// --- кнопки в сайдбаре ---
const ButtonNav = ({ c, onClick }: { c?: C; onClick: () => void }) => (
    <button type="button" onClick={onClick} className={`w-full flex items-center gap-3 rounded-2xl p-2.5 text-left ${NAV_ITEM_PRESS}`} style={navItemStyle(false)}>
        {c && <img src={c.imageSrc} alt="" className="h-11 w-11 flex-shrink-0 rounded-xl object-cover" />}
        <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#7E8F99]">Курс</span>
            <span className="truncate text-[15px] font-extrabold text-white">{c?.title ?? 'Выбери курс'}</span>
        </span>
        <ChevronRight className="h-5 w-5 flex-shrink-0 text-[#AEBCC5]" />
    </button>
)
const ButtonBanner = ({ c, onClick }: { c?: C; onClick: () => void }) => (
    <button type="button" onClick={onClick} className={`relative w-full overflow-hidden rounded-2xl text-left ${NAV_ITEM_PRESS}`} style={{ boxShadow: 'inset 0 0 0 1px #2F3C43, 0 4px 0 #0C1215' }}>
        {c && <img src={c.imageSrc} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />}
        <span className="absolute inset-0 bg-[linear-gradient(90deg,#121B20_15%,rgba(18,27,32,0.35))]" />
        <span className="relative flex items-center gap-2 px-3.5 py-3">
            <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#AEBCC5]">Курс</span>
                <span className="truncate text-base font-extrabold text-white">{c?.title ?? 'Выбери курс'}</span>
            </span>
            <span className="flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-xs font-bold text-white"><ArrowLeftRight className="h-3.5 w-3.5" />Сменить</span>
        </span>
    </button>
)
const ButtonCurrent = ({ c, onClick }: { c?: C; onClick: () => void }) => (
    <button type="button" onClick={onClick} className="w-full flex items-center justify-between rounded-xl border border-green-400/25 bg-[#1A2B22]/50 p-3 shadow-[0_0_10px_1px_rgba(74,222,128,0.15)]">
        <span className="truncate font-medium text-green-300">{c?.title}</span><ChevronDown className="h-4 w-4 text-green-400" />
    </button>
)

// --- что открывается ---
const ListRows = ({ courses, activeId, pick }: { courses: C[]; activeId: number; pick: (id: number) => void }) => (
    <div className="flex flex-col gap-4 px-4 pb-8">
        {groupsOf(courses).map(([g, list]) => (
            <div key={g} className="flex flex-col gap-2">
                <div className={LABEL}>{g}</div>
                {list.map((c) => {
                    const here = c.id === activeId
                    return (
                        <button key={c.id} type="button" onClick={() => pick(c.id)} className={`flex items-center gap-3 rounded-2xl p-2.5 text-left ${NAV_ITEM_PRESS}`} style={navItemStyle(here)}>
                            <img src={c.imageSrc} alt="" className="h-12 w-12 flex-shrink-0 rounded-xl object-cover" />
                            <span className="min-w-0 flex-1 truncate text-[15px] font-extrabold text-white">{c.title}</span>
                            {here && <Check className="h-5 w-5 flex-shrink-0 text-white" />}
                        </button>
                    )
                })}
            </div>
        ))}
    </div>
)
const ListTiles = ({ courses, activeId, pick }: { courses: C[]; activeId: number; pick: (id: number) => void }) => (
    <div className="flex flex-col gap-4 px-4 pb-8">
        {groupsOf(courses).map(([g, list]) => (
            <div key={g} className="flex flex-col gap-2">
                <div className={LABEL}>{g}</div>
                <div className="grid grid-cols-2 gap-3">
                    {list.map((c) => {
                        const here = c.id === activeId
                        return (
                            <button key={c.id} type="button" onClick={() => pick(c.id)} className={`relative flex flex-col overflow-hidden rounded-2xl p-1.5 text-left ${NAV_ITEM_PRESS}`} style={navItemStyle(here)}>
                                <img src={c.imageSrc} alt="" className="aspect-square w-full rounded-xl object-cover" />
                                <span className="px-1 pb-0.5 pt-1.5 text-[13px] font-extrabold leading-tight text-white">{c.title}</span>
                                {here && <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#151F23]"><Check className="h-4 w-4" /></span>}
                            </button>
                        )
                    })}
                </div>
            </div>
        ))}
    </div>
)

type Variant = { n: number; title: string; desc: string; button: 'current' | 'nav' | 'banner'; open: 'slide' | 'sheet-rows' | 'sheet-tiles' | 'dialog' }
const VARIANTS: Variant[] = [
    { n: 0, title: 'Как сейчас', desc: 'Зелёная обводка со свечением, список выезжает вниз.', button: 'current', open: 'slide' },
    { n: 1, title: 'Кнопка как в меню юнитов + шторка списком', desc: 'Плитка того же стиля, что пункты меню юнитов: картинка курса, «Курс», название, стрелка. Шторка слева, курсы строками.', button: 'nav', open: 'sheet-rows' },
    { n: 2, title: 'Кнопка как в меню юнитов + шторка с плитками', desc: 'Та же кнопка. В шторке курсы большими квадратными баннерами по 2 в ряд.', button: 'nav', open: 'sheet-tiles' },
    { n: 3, title: 'Кнопка-баннер + шторка списком', desc: 'Кнопка — сама картинка курса (приглушённая) и плашка «Сменить».', button: 'banner', open: 'sheet-rows' },
    { n: 4, title: 'Кнопка-баннер + окно по центру с плитками', desc: 'Окно посередине экрана вместо шторки.', button: 'banner', open: 'dialog' },
]

export const CoursePickerDemo = ({ courses }: { courses: C[] }) => {
    const [activeId, setActiveId] = useState(courses[0]?.id ?? 0)
    const [opened, setOpened] = useState<number | null>(null)
    const [slideOpen, setSlideOpen] = useState(false)
    const active = courses.find((c) => c.id === activeId)
    const pick = (id: number) => { setActiveId(id); setOpened(null); setSlideOpen(false) }
    const v = VARIANTS.find((x) => x.n === opened)

    return (
        <div className="min-h-screen bg-[#0F171B] px-4 py-6 text-white">
            <h1 className="mb-1 text-2xl font-black">Выбор курса — варианты</h1>
            <p className="mb-6 text-sm text-[#9AA7B0]">Нажми на кнопку в каждом варианте. Выбор здесь ничего не переключает.</p>
            <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {VARIANTS.map((x) => (
                    <section key={x.n} className="flex flex-col gap-3">
                        <div>
                            <h2 className="text-lg font-black">{x.n}. {x.title}</h2>
                            <p className="text-xs text-[#9AA7B0]">{x.desc}</p>
                        </div>
                        {/* кусок сайдбара */}
                        <div className="rounded-2xl border border-[#2A363C] bg-[#151F23] p-4">
                            {x.button === 'current' && <div className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-widest text-[#5A6A72]">Курс</div>}
                            {x.button === 'current' && <ButtonCurrent c={active} onClick={() => setSlideOpen((s) => !s)} />}
                            {x.button === 'nav' && <ButtonNav c={active} onClick={() => setOpened(x.n)} />}
                            {x.button === 'banner' && <ButtonBanner c={active} onClick={() => setOpened(x.n)} />}
                            {x.open === 'slide' && slideOpen && (
                                <div className="mt-2 space-y-1">{courses.map((c) => (
                                    <button key={c.id} onClick={() => pick(c.id)} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${c.id === activeId ? 'bg-green-500/15 text-green-300' : 'text-[#9AA7B0]'}`}>{c.title}</button>
                                ))}</div>
                            )}
                            <div className="mt-4 flex flex-col gap-2 opacity-40">
                                {['Мой путь', 'Тренажёр', 'Задачник'].map((t) => <div key={t} className="rounded-xl bg-[#1B262B] px-3 py-2.5 text-sm font-bold">{t}</div>)}
                            </div>
                        </div>
                    </section>
                ))}
            </div>

            <Sheet open={!!v && v.open.startsWith('sheet')} onOpenChange={(o) => !o && setOpened(null)}>
                <SheetContent side="left" className={NAV_SHEET_CLASS}>
                    <SheetTitle className="flex items-center gap-2 px-5 pb-3 pt-6 text-lg font-extrabold text-white"><BookOpen className="h-5 w-5" />Курсы</SheetTitle>
                    {v?.open === 'sheet-rows' && <ListRows courses={courses} activeId={activeId} pick={pick} />}
                    {v?.open === 'sheet-tiles' && <ListTiles courses={courses} activeId={activeId} pick={pick} />}
                </SheetContent>
            </Sheet>
            <Dialog open={v?.open === 'dialog'} onOpenChange={(o) => !o && setOpened(null)}>
                <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto border-[#2B373D] bg-[linear-gradient(180deg,#18232A_0%,#121B20_100%)] p-0 pt-5">
                    <DialogTitle className="flex items-center gap-2 px-5 pb-1 text-lg font-extrabold text-white"><BookOpen className="h-5 w-5" />Выбери курс</DialogTitle>
                    <ListTiles courses={courses} activeId={activeId} pick={pick} />
                </DialogContent>
            </Dialog>
        </div>
    )
}
