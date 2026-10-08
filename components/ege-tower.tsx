'use client'

// components/ege-tower.tsx
//
// «Башня ЕГЭ»: 20 этажей снизу вверх (задание 1 — первый этаж), на каждом этаже столько
// монет, сколько первичных баллов стоит задание; монеты заполняются по мере освоения.
// Этаж текущего хода подсвечен, на нём стоит персонаж. Тап по этажу — что его закрывает.

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, Dumbbell, Swords } from 'lucide-react'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'
import type { EgeMap, EgeStation } from '@/lib/egeMap'
import { cn } from '@/lib/utils'

// Короткие названия этажей (полные — в ege_tasks.title).
const SHORT: Record<number, string> = {
    1: 'Планиметрия', 2: 'Векторы', 3: 'Стереометрия', 4: 'Вероятность', 5: 'Сложная вероятность',
    6: 'Мат. ожидание', 7: 'Уравнения', 8: 'Выражения', 9: 'Производная', 10: 'Прикладные',
    11: 'Текстовые', 12: 'Графики', 13: 'Финансы', 14: 'Уравнения', 15: 'Стереометрия',
    16: 'Неравенства', 17: 'Моделирование', 18: 'Планиметрия', 19: 'Параметр', 20: 'Теория чисел',
}
const GOLD = '#F2C35B', GOLD_EDGE = '#B8862E', ORANGE = GGEGE_PALETTE.orange.button

const fmt = (x: number) => (Math.round(x * 10) / 10).toString().replace('.', ',')

// Монета, заполненная снизу на долю fill (0..1).
const Coin = ({ fill, id, dim }: { fill: number; id: string; dim: boolean }) => (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px] shrink-0">
        <defs>
            <clipPath id={id}><rect x={0} y={20 - 20 * fill} width={20} height={20 * fill} /></clipPath>
        </defs>
        <circle cx={10} cy={10} r={8.5} fill="#1C262B" stroke={dim ? '#2A363C' : '#4A5860'} strokeWidth={1.5} />
        {fill > 0 && (
            <g clipPath={`url(#${id})`}>
                <circle cx={10} cy={10} r={8.5} fill={GOLD} stroke={GOLD_EDGE} strokeWidth={1.5} />
                <circle cx={10} cy={10} r={5} fill="none" stroke={GOLD_EDGE} strokeWidth={1.2} opacity={0.7} />
            </g>
        )}
    </svg>
)

const Floor = ({ s, isMove, open, onToggle }: { s: EgeStation; isMove: boolean; open: boolean; onToggle: () => void }) => {
    const soon = s.status === 'soon'
    const part2 = s.part === 2
    const done = !soon && s.mastery >= 0.95
    const bg = soon ? '#141B1F' : part2 ? 'linear-gradient(180deg, #2B2540, #221D33)' : 'linear-gradient(180deg, #2C3A41, #232F35)'
    const edge = soon ? '#10161A' : part2 ? '#17132A' : '#172025'
    return (
        <div className="relative">
            <button type="button" onClick={soon ? undefined : onToggle}
                className={cn('relative flex h-9 w-full items-center gap-2 rounded-xl border-2 px-2 text-left', soon ? 'cursor-default' : 'active:translate-y-[2px]')}
                style={{
                    background: bg,
                    borderColor: isMove ? ORANGE : done ? hexToRgba(GOLD, 0.7) : soon ? '#1E272C' : '#34434B',
                    boxShadow: `0 3px 0 ${edge}${isMove ? `, 0 0 16px ${hexToRgba(ORANGE, 0.55)}` : ''}`,
                }}>
                <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-black',
                    soon ? 'bg-[#1A2226] text-[#3E4B52]' : 'bg-[#151F23] text-[#F2F7FB]')}>
                    {soon ? <Lock className="h-3.5 w-3.5" /> : s.num}
                </span>
                <span className={cn('min-w-0 flex-1 truncate text-sm font-extrabold', soon ? 'text-[#4A5860]' : 'text-[#F2F7FB]')}>
                    {SHORT[s.num] ?? s.title}{soon && <span className="ml-1 text-[10px] font-bold uppercase">скоро</span>}
                </span>
                <span className="flex items-center gap-0.5">
                    {Array.from({ length: s.points }, (_, i) => (
                        <Coin key={i} id={`coin-${s.num}-${i}`} fill={soon ? 0 : Math.max(0, Math.min(1, s.earned - i))} dim={soon} />
                    ))}
                </span>
                {isMove && (
                    <motion.span className="pointer-events-none absolute -top-4 left-9 text-lg" animate={{ y: [0, -4, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>🧍</motion.span>
                )}
            </button>
            {open && !soon && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="mx-1 mt-1 rounded-xl border-2 border-[#2A363C] bg-[#131A1E] p-3 text-xs text-[#C9D3D9]">
                    <p className="font-extrabold text-[#F2F7FB]">№{s.num} · {s.title} — {fmt(s.earned)} из {s.points}</p>
                    {s.courseTarget > 0 && <p className="mt-1">📚 Задачник: решено {s.courseSolved} из {s.courseTarget}</p>}
                    {s.trainerTotal > 0 && <p>🏋️ Тренажёр: уроков {s.trainerDone} из {s.trainerTotal}</p>}
                    {s.trainerOnly && s.part === 2 && <p className="mt-1 text-[#9AA7B0]">Пока до четверти баллов: задачи с развёрнутым ответом — скоро.</p>}
                    <div className="mt-2 flex gap-2">
                        {s.trainerHref && (
                            <Link href={s.trainerHref} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#A1D151] py-2 font-bold text-[#151F24]"><Dumbbell className="h-4 w-4" /> Тренажёр</Link>
                        )}
                        {s.lessonHref && (
                            <Link href={s.lessonHref} className="flex flex-1 items-center justify-center gap-1 rounded-lg border-2 border-[#3A464E] py-1.5 font-bold text-[#F2F7FB]"><Swords className="h-4 w-4" /> Задачи</Link>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    )
}

export const EgeTower = ({ map }: { map: EgeMap }) => {
    const [open, setOpen] = useState<number | null>(null)
    const moveNum = map.move?.station.num ?? null
    // снизу вверх: 1-й этаж внизу. Рендерим сверху (20) вниз (1).
    const top = [...map.stations].sort((a, b) => b.num - a.num)
    return (
        <div className="mt-6 lg:sticky lg:top-6 lg:mt-0">
            <div className="rounded-3xl border-2 border-[#2A363C] bg-[#11181C] p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                    <p className="text-base font-black text-[#F2F7FB]">🏰 Башня ЕГЭ</p>
                    <p className="font-black" style={{ color: GOLD }}>{fmt(map.primary)}<span className="text-sm text-[#9AA7B0]"> / {map.primaryMax}</span></p>
                </div>
                <div className="mb-2 text-center text-xs font-black uppercase tracking-wider" style={{ color: GOLD }}>👑 100 баллов</div>
                <div className="flex flex-col gap-1.5">
                    {top.map((s) => (
                        <div key={s.num}>
                            <Floor s={s} isMove={s.num === moveNum} open={open === s.num} onToggle={() => setOpen(open === s.num ? null : s.num)} />
                            {s.num === 14 && (
                                <p className="mt-2 text-center text-[10px] font-black uppercase tracking-wider text-[#5C6B73]">▲ часть 2 · развёрнутый ответ</p>
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-2 h-3 rounded-b-xl bg-[#26323A]" style={{ boxShadow: '0 4px 0 #172025' }} />
                <p className="mt-2 text-center text-[10px] font-black uppercase tracking-wider text-[#5C6B73]">старт · часть 1</p>
            </div>
        </div>
    )
}
