'use client'

// components/ege-score-ruler.tsx — «Мой путь»: где ты сейчас по баллам ЕГЭ и где цель.
// Армейская латунная линейка 0–100 (тот же стиль, что у Сетометра, но прямая: круглый прибор — скорость,
// прямая шкала — положение). Стрелка «Сейчас ≈30», красный флажок «Цель 90», между ними — сколько осталось.
// Нажатие на флажок — выбрать цель.

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CircleHelp } from 'lucide-react'
import { stencilFont } from '@/lib/fonts'
import { declensionRu } from '@/usefulFunctions'

const GOALS = [60, 70, 80, 90, 100]
const W = 360, X0 = 22, X1 = 338, SCALE_Y = 96
const xOf = (v: number) => Math.round((X0 + ((X1 - X0) * Math.min(100, Math.max(0, v))) / 100) * 10) / 10
const fmt = (x: number) => (Math.round(x * 10) / 10).toString().replace('.', ',')
const RIVETS = [[12, 12], [W - 12, 12], [12, 138], [W - 12, 138]]

export function EgeScoreRuler({ test, testLo, testHi, primary, primaryMax, target, onPickGoal }: {
    test: number; testLo: number; testHi: number; primary: number; primaryMax: number; target: number | null; onPickGoal: (g: number) => void
}) {
    const [editing, setEditing] = useState(target === null)
    const [help, setHelp] = useState(false)
    const goal = target ?? 90
    const left = Math.max(0, goal - test)
    const reached = target !== null && test >= target
    const nowX = xOf(test), goalX = xOf(goal)
    return (
        <div className="rounded-2xl border-2 border-[#6B5B3A] bg-[#151F23] p-3">
            {/* сейчас и цель крупно */}
            <div className="flex items-end justify-between gap-2">
                <div>
                    <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-[#C9B98F]">
                        Сейчас
                        <button type="button" onClick={() => setHelp((v) => !v)} aria-label="Как считается" className="rounded-full p-0.5 text-[#9AA7B0] hover:text-white"><CircleHelp className="h-3.5 w-3.5" /></button>
                    </p>
                    <p className="flex items-baseline gap-1 leading-none">
                        <span className={`${stencilFont.className} text-[40px] text-[#F2F7FB]`}>≈{test}</span>
                        <span className="text-sm font-black text-[#E8D9B8]">{declensionRu(test, 'балл', 'балла', 'баллов')}</span>
                    </p>
                    {/* после диагностики, пока своих данных мало, — разброс */}
                    {testLo !== testHi && <p className="mt-0.5 text-[11px] font-bold text-[#9AA7B0]">от {testLo} до {testHi}</p>}
                </div>
                <span className={`${stencilFont.className} mb-3 self-center text-2xl text-[#5C6B73]`}>→</span>
                <button type="button" onClick={() => setEditing((v) => !v)} className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-wide text-[#C9B98F]">Цель <span className="normal-case text-[#7FC8F2] underline">сменить</span></p>
                    <p className="flex items-baseline justify-end gap-1 leading-none">
                        <span className={`${stencilFont.className} text-[40px] text-[#F2C35B]`}>{target ?? '?'}</span>
                        <span className="text-sm font-black text-[#E8D9B8]">ЕГЭ</span>
                    </p>
                </button>
            </div>
            {help && (
                <p className="mt-2 rounded-xl bg-black/30 p-2.5 text-[11px] font-bold leading-snug text-[#C9D3D9]">
                    Сейчас — что ты уже умеешь по тренажёру, задачнику и диагностике: {fmt(primary)} первичных из {primaryMax}. Тестовый балл — по шкале 2026 года, шкалу 2027 ещё не опубликовали.
                </p>
            )}
            {editing && (
                <div className="mt-2 rounded-xl bg-black/30 p-2.5">
                    <p className="mb-2 text-sm font-black text-[#F2F7FB]">На какой балл хочешь сдать?</p>
                    <div className="grid grid-cols-5 gap-2">
                        {GOALS.map((g) => (
                            <button key={g} type="button" onClick={() => { onPickGoal(g); setEditing(false) }}
                                className="rounded-lg border-b-4 py-1.5 font-black active:border-b-0"
                                style={target === g ? { background: '#F2C35B', color: '#151F24', borderBottomColor: '#B8862E' } : { background: '#3A454B', color: '#F2F7FB', borderBottomColor: '#1E2629' }}>
                                {g}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* латунная линейка */}
            <svg viewBox={`0 0 ${W} 150`} className="mt-2 w-full">
                <defs>
                    <linearGradient id="esr-brass" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#D9B66A" /><stop offset=".5" stopColor="#9A7838" /><stop offset="1" stopColor="#6E5426" />
                    </linearGradient>
                </defs>
                <rect x="2" y="2" width={W - 4} height="146" rx="14" fill="url(#esr-brass)" stroke="#2B1E14" strokeWidth="3" />
                <rect x="10" y="22" width={W - 20} height="112" rx="8" fill="#12170F" stroke="#2B1E14" strokeWidth="2" />
                {RIVETS.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3.5" fill="#B08E4E" stroke="#2B1E14" strokeWidth="1.5" />)}
                <text x={W / 2} y="16" textAnchor="middle" fontSize="9" letterSpacing="1" fill="#2B1E14" className={stencilFont.className}>БАЛЛЫ ЕГЭ</text>
                {/* пройдено */}
                <rect x={X0} y={SCALE_Y - 6} width={nowX - X0} height="12" rx="3" fill="#78C93C" />
                {testLo !== testHi && <rect x={xOf(testLo)} y={SCALE_Y - 6} width={xOf(testHi) - xOf(testLo)} height="12" fill="#78C93C" opacity=".35" />}
                {/* осталось до цели */}
                {!reached && <line x1={nowX + 4} y1={SCALE_Y} x2={goalX - 3} y2={SCALE_Y} stroke="#F2C35B" strokeWidth="3" strokeDasharray="5 5" />}
                {/* шкала */}
                <line x1={X0} y1={SCALE_Y + 8} x2={X1} y2={SCALE_Y + 8} stroke="#E8D9B8" strokeWidth="1.5" />
                {Array.from({ length: 21 }, (_, i) => i * 5).map((v) => (
                    <line key={v} x1={xOf(v)} y1={SCALE_Y + 8} x2={xOf(v)} y2={SCALE_Y + (v % 10 === 0 ? 17 : 13)} stroke="#E8D9B8" strokeWidth={v % 10 === 0 ? 1.8 : 1} />
                ))}
                {Array.from({ length: 11 }, (_, i) => i * 10).map((v) => (
                    <text key={v} x={xOf(v)} y={SCALE_Y + 29} textAnchor="middle" fontSize="10" fill="#C9B98F" className={stencilFont.className}>{v}</text>
                ))}
                {/* флажок цели */}
                <g>
                    <line x1={goalX} y1={SCALE_Y + 6} x2={goalX} y2="34" stroke="#2B1E14" strokeWidth="4" />
                    <line x1={goalX} y1={SCALE_Y + 6} x2={goalX} y2="34" stroke="#C9A45C" strokeWidth="2" />
                    <path d={goal > 80 ? `M${goalX} 34 L${goalX - 44} 34 L${goalX - 36} 44 L${goalX - 44} 54 L${goalX} 54 Z` : `M${goalX} 34 L${goalX + 44} 34 L${goalX + 36} 44 L${goalX + 44} 54 L${goalX} 54 Z`}
                        fill="#C8452F" stroke="#2B1E14" strokeWidth="2" strokeLinejoin="round" />
                    <text x={goal > 80 ? goalX - 20 : goalX + 20} y="48.5" textAnchor="middle" fontSize="12" fill="#FFF3DC" className={stencilFont.className}>{goal}</text>
                </g>
                {/* стрелка «сейчас» */}
                <motion.g initial={{ x: xOf(0) - nowX }} animate={{ x: 0 }} transition={{ duration: 1.1, ease: [0.3, 1.2, 0.5, 1] }}>
                    <path d={`M${nowX} ${SCALE_Y - 9} L${nowX - 7} ${SCALE_Y - 21} L${nowX + 7} ${SCALE_Y - 21} Z`} fill="#E8552F" stroke="#2B1E14" strokeWidth="1.6" strokeLinejoin="round" />
                    <rect x={nowX - 22} y={SCALE_Y - 42} width="44" height="19" rx="4" fill="#0B1012" stroke="#C4A765" strokeWidth="1" />
                    <text x={nowX} y={SCALE_Y - 28.5} textAnchor="middle" fontSize="12" fill="#78C93C" className={stencilFont.className}>{test}</text>
                </motion.g>
            </svg>
            <p className="mt-1.5 text-center text-sm font-bold text-[#E8D9B8]">
                {reached ? <b className="text-[#78C93C]">Цель взята! Держи форму, боец.</b>
                    : <>До цели ещё <b className="text-[#F2C35B]">{left} {declensionRu(left, 'балл', 'балла', 'баллов')}</b></>}
            </p>
        </div>
    )
}
