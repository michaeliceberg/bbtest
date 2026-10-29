'use client'

// components/course-progress-strip.tsx
//
// «Прогресс по разделам» в задачнике (/learn) — игровая шкала: на каждую часть ЕГЭ (для ЕГЭ курсов)
// одна полоска из ячеек, как полоска здоровья/опыта в игре. Ячейка = раздел: заливается цветом раздела
// по доле решённых задач, пройденный — полностью. Номер задания мелко под ячейкой.
// На странице раскрыт только один раздел (components/learn-unit-fold.tsx): его ячейка обведена,
// номер подсвечен, снизу его название. Нажатие на ячейку раскрывает раздел и доезжает до него.
// percent приходит уже посчитанным на сервере (доля решённых задач юнита, app/(main)/learn/page.tsx).

import { motion } from 'framer-motion'
import { TinyMedal } from '@/components/nav-sheet-ui'
import { EGE_PART_COLOR } from '@/components/ege-task-grid'
import { SECTION_LABEL, type LearnSection } from '@/components/learn-unit-nav'
import { openLearnUnit } from '@/components/learn-unit-fold'
import { useLearnOpenUnit } from '@/store/use-learn-open-unit'

type StripUnit = {
    id: number
    title: string
    order: number
    unitIndex: number
    percent: number
    isUnlocked: boolean
    isCompleted: boolean
    section: LearnSection
}

const cellLabel = (u: StripUnit) => {
    const m = u.title.match(/^(\d+)\./)
    return m ? m[1] : String(u.order)
}

type TrainerKey = { tUnitId: number; title: string; percent: number }

// Цвет ячейки — по части ЕГЭ (синий — часть 1, фиолетовый — часть 2), а не свой у каждого раздела:
// радуга ничего не значила. Без части (не ЕГЭ курс) — синий.
const partColor = (section: LearnSection) => {
    const c = section === 'part2' ? EGE_PART_COLOR.part2 : EGE_PART_COLOR.part1
    return { button: c, bottom: section === 'part2' ? '#9C6AC6' : '#428BC0' }
}

export function CourseProgressStrip({ units, defaultOpenId = null, trainerKeys = {} }: { units: StripUnit[]; defaultOpenId?: number | null; trainerKeys?: Record<number, TrainerKey[]> }) {
    const selected = useLearnOpenUnit((s) => s.openId) ?? defaultOpenId
    if (units.length === 0) return null

    const groups: { section: LearnSection; units: StripUnit[] }[] = []
    for (const u of units) {
        const last = groups[groups.length - 1]
        if (last && last.section === u.section) last.units.push(u)
        else groups.push({ section: u.section, units: [u] })
    }
    const sel = units.find((u) => u.id === selected) ?? null
    const hasKeys = Object.keys(trainerKeys).length > 0

    return (
        <div className="mb-5 rounded-2xl border-2 border-[#2A363C] bg-[#161F23] px-3 pb-2.5 pt-3">
            <div className="flex flex-col gap-2.5">
                {groups.map((g, gi) => {
                    const label = g.section ? SECTION_LABEL[g.section] : null
                    const [labelMain, labelSub] = label ? label.title.split(' · ') : ['Разделы', '']
                    return (
                        <div key={gi}>
                            <div className="mb-1 flex items-center">
                                <span className="text-[11px] font-black uppercase tracking-wide" style={{ color: label?.color ?? '#9AA7B0' }}>
                                    {labelMain}
                                    {labelSub && <span className="ml-1.5 normal-case tracking-normal text-[#5C6B73]">{labelSub}</span>}
                                </span>
                            </div>
                            <div>
                                <div className="flex gap-[3px] rounded-lg bg-[#0F171B] p-[3px]" style={{ boxShadow: 'inset 0 2px 0 rgba(0,0,0,0.35)' }}>
                                    {g.units.map((u) => {
                                        const c = partColor(u.section)
                                        const keys = trainerKeys[Number(cellLabel(u))] ?? []
                                        const fill = u.isCompleted ? 100 : u.percent > 0 ? Math.max(u.percent, 12) : 0
                                        const isSel = u.id === selected
                                        return (
                                            <motion.button
                                                key={u.id}
                                                type="button"
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => { if (u.isUnlocked) openLearnUnit(u.id) }}
                                                title={`${u.title} — ${Math.round(u.percent)}%`}
                                                className="relative min-w-0 flex-1"
                                            >
                                                {/* слоты медалей тренажёров-«каркаса» этого задания: пустые — ещё не пройдено */}
                                                {hasKeys && (
                                                    <div className="mb-[3px] flex h-[23px] flex-wrap content-end items-end justify-center gap-px">
                                                        {keys.slice(0, 4).map((k) => <TinyMedal key={k.tUnitId} percent={k.percent} size={10} title={`Тренажёр «${k.title}»`} />)}
                                                    </div>
                                                )}
                                                <div
                                                    className="relative h-4 overflow-hidden rounded-[4px]"
                                                    style={{
                                                        background: u.isUnlocked ? '#26333B' : '#1A2328',
                                                        boxShadow: isSel ? `0 0 0 2px #FFFFFF, 0 0 10px ${c.button}` : undefined,
                                                    }}
                                                >
                                                    {u.isUnlocked && fill > 0 && (
                                                        <motion.div
                                                            className="absolute inset-y-0 left-0"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${fill}%` }}
                                                            transition={{ duration: 0.7, ease: 'easeOut' }}
                                                            style={{ background: `linear-gradient(180deg, ${c.button}, ${c.bottom})` }}
                                                        />
                                                    )}
                                                    {/* блик сверху — «стеклянная» ячейка */}
                                                    <div className="absolute inset-x-0 top-0 h-1/3 bg-white/10" />
                                                </div>
                                                <span
                                                    className={isSel ? 'mx-auto mt-0.5 block w-fit rounded px-1 text-center text-[10px] font-black leading-[13px] text-white' : 'mt-0.5 block text-center text-[9px] font-black leading-[13px]'}
                                                    style={isSel ? { background: c.button } : { color: u.isCompleted ? c.button : u.isUnlocked ? '#72838D' : '#3E4B52' }}
                                                >
                                                    {cellLabel(u)}
                                                </span>
                                            </motion.button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <p className="mt-1.5 truncate text-[11px] font-bold text-[#5C6B73]">
                {sel ? <>Открыт: <span className="text-[#E2EAF0]">{sel.title}</span> · {Math.round(sel.percent)}%</> : 'Нажми на ячейку — откроешь раздел'}
            </p>
            {hasKeys && <p className="mt-0.5 text-[10px] font-bold text-[#4E5D65]">
                Медали над ячейкой — тренажёры-каркас этого задания
            </p>}
        </div>
    )
}
