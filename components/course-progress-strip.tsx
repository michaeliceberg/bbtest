'use client'

// components/course-progress-strip.tsx
//
// «Прогресс по разделам» в задачнике (/learn) — игровая шкала: на каждую часть ЕГЭ (для ЕГЭ курсов)
// одна полоска из ячеек, как полоска здоровья/опыта в игре. Ячейка = раздел: заливается цветом раздела
// по доле решённых задач, пройденный — полностью. Номер задания мелко под ячейкой.
// На странице раскрыт только один раздел (components/learn-unit-fold.tsx): его ячейка обведена,
// номер подсвечен, снизу его название. Нажатие на ячейку раскрывает раздел и доезжает до него.
// percent приходит уже посчитанным на сервере (доля решённых задач юнита, app/(main)/learn/page.tsx).

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, Dumbbell } from 'lucide-react'
import { TrainerGoDialog, TRAINER_GREEN, trainerKeyDone } from '@/components/trainer-key-chips'
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

// Как показать над ячейкой тренажёры-«ключи» задания (сравнение — /test-strip-keys).
export type KeyStyle = 'button' | 'medals' | 'count' | 'dots' | 'bar' | 'pill' | 'check'

// Тренажёр «взят», если по нему есть хотя бы бронза.
const keyDone = (k: TrainerKey) => k.percent > 0

function KeyIndicator({ keys, style, color }: { keys: TrainerKey[]; style: KeyStyle; color: string }) {
    if (!keys.length) return null
    const done = keys.filter(keyDone).length
    const all = done === keys.length
    const title = keys.map((k) => `«${k.title}»${keyDone(k) ? ' ✓' : ''}`).join(', ')
    if (style === 'count') return (
        <span title={title} className="text-[9px] font-black leading-none" style={{ color: all ? '#F2C35B' : done ? '#C9D4DA' : '#56646C' }}>{done}/{keys.length}</span>
    )
    if (style === 'dots') return (
        <span title={title} className="flex gap-[2px]">
            {keys.map((k) => <span key={k.tUnitId} className="h-[5px] w-[5px] rounded-full" style={keyDone(k) ? { background: all ? '#F2C35B' : color } : { boxShadow: 'inset 0 0 0 1px #4E5D65' }} />)}
        </span>
    )
    if (style === 'bar') return (
        <span title={title} className="flex w-[70%] gap-[1px]">
            {keys.map((k) => <span key={k.tUnitId} className="h-[4px] flex-1 rounded-full" style={{ background: keyDone(k) ? (all ? '#F2C35B' : color) : '#2C3A41' }} />)}
        </span>
    )
    if (style === 'pill') return (
        <span title={title} className="rounded-[4px] px-[3px] text-[8px] font-black leading-[11px]"
            style={all ? { background: '#F2C35B', color: '#3A2A08' } : done ? { background: '#2C3A41', color: '#E2EAF0' } : { boxShadow: 'inset 0 0 0 1px #35434A', color: '#56646C' }}>
            {done}/{keys.length}
        </span>
    )
    if (style === 'check') return all
        ? <span title={title} className="flex h-[11px] w-[11px] items-center justify-center rounded-full text-[8px] font-black leading-none" style={{ background: '#F2C35B', color: '#3A2A08' }}>✓</span>
        : <span title={title} className="text-[9px] font-black leading-none" style={{ color: done ? '#C9D4DA' : '#56646C' }}>{done}/{keys.length}</span>
    return null
}

export function CourseProgressStrip({ units, defaultOpenId = null, trainerKeys = {}, keyStyle = 'button' }: { units: StripUnit[]; defaultOpenId?: number | null; trainerKeys?: Record<number, TrainerKey[]>; keyStyle?: KeyStyle }) {
    const selected = useLearnOpenUnit((s) => s.openId) ?? defaultOpenId
    const [ask, setAsk] = useState<number | null>(null)
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
                            <div className="mb-1 flex items-center gap-2">
                                <span className="min-w-0 truncate text-[11px] font-black uppercase tracking-wide" style={{ color: label?.color ?? '#9AA7B0' }}>
                                    {labelMain}
                                    {labelSub && <span className="ml-1.5 normal-case tracking-normal text-[#5C6B73]">{labelSub}</span>}
                                </span>
                                {/* одна подпись на ряд вместо гантели на каждой кнопке: зелёные кнопки ниже — тренажёры */}
                                {hasKeys && keyStyle === 'button' && g.units.some((u) => (trainerKeys[Number(cellLabel(u))] ?? []).length > 0) && (
                                    <span className="ml-auto flex shrink-0 items-center gap-1 text-[10px] font-black uppercase tracking-wide" style={{ color: TRAINER_GREEN.top }}>
                                        <Dumbbell className="h-3.5 w-3.5" strokeWidth={2.6} />тренажёры<ArrowDown className="h-3 w-3" strokeWidth={3} />
                                    </span>
                                )}
                            </div>
                            <div>
                                <div className="flex gap-[3px] rounded-lg bg-[#0F171B] p-[3px]" style={{ boxShadow: 'inset 0 2px 0 rgba(0,0,0,0.35)' }}>
                                    {g.units.map((u) => {
                                        const c = partColor(u.section)
                                        const keys = trainerKeys[Number(cellLabel(u))] ?? []
                                        const fill = u.isCompleted ? 100 : u.percent > 0 ? Math.max(u.percent, 12) : 0
                                        const isSel = u.id === selected
                                        return (
                                            <div key={u.id} className="relative min-w-0 flex-1">
                                                {/* над ячейкой — зелёная кнопка тренажёров этого задания (гантель + «пройдено/всего»), по ней окошко «Перейти в тренажёр» */}
                                                {hasKeys && keyStyle === 'button' && (keys.length > 0 ? (
                                                    <button type="button" onClick={() => setAsk(Number(cellLabel(u)))}
                                                        title={`Тренажёры к заданию №${cellLabel(u)}: ${keys.filter(trainerKeyDone).length} из ${keys.length}`}
                                                        className="mb-[3px] flex h-[24px] w-full items-center justify-center rounded-[5px] border-b-[3px] active:border-b-0"
                                                        style={{ background: `linear-gradient(180deg, ${TRAINER_GREEN.top}, ${TRAINER_GREEN.bottom})`, borderBottomColor: TRAINER_GREEN.edge, color: TRAINER_GREEN.text }}>
                                                        <span className="whitespace-nowrap text-[10px] font-black leading-none">{keys.filter(trainerKeyDone).length}/{keys.length}</span>
                                                    </button>
                                                ) : <div className="mb-[3px] h-[24px]" />)}
                                                {hasKeys && keyStyle !== 'button' && keyStyle !== 'medals' && (
                                                    <div className="mb-[3px] flex h-[12px] items-center justify-center"><KeyIndicator keys={keys} style={keyStyle} color={c.button} /></div>
                                                )}
                                                {hasKeys && keyStyle === 'medals' && (
                                                    <div className="mb-[3px] flex h-[12px] justify-center">
                                                        {keys.map((k, i) => (
                                                            <span key={k.tUnitId} className="relative" style={{ marginLeft: i ? (keys.length >= 4 ? -7 : -5) : 0, zIndex: 10 - i }}>
                                                                <TinyMedal percent={k.percent} size={12} title={`Тренажёр «${k.title}»`} />
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <motion.button
                                                    type="button"
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => { if (u.isUnlocked) openLearnUnit(u.id) }}
                                                    title={`${u.title} — ${Math.round(u.percent)}%`}
                                                    className="block w-full"
                                                >
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
                                            </div>
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
                {keyStyle === 'button' ? 'Зелёные кнопки — тренажёры к заданию (пройдено/всего): сначала они, потом задачи' : keyStyle === 'medals' ? 'Медали над ячейкой — тренажёры-каркас этого задания' : 'Над ячейкой — сколько тренажёров к этому заданию пройдено'}
            </p>}
            {ask !== null && <TrainerGoDialog num={ask} keys={trainerKeys[ask] ?? []} open onClose={() => setAsk(null)} />}
        </div>
    )
}
