'use client'

// Тестовая страница: варианты спокойного вида задачника (/learn) — шкала заданий с медалями тренажёров,
// уровень, кнопки разделов, кнопки тренажёров в разделе. Данные — пример, ничего не сохраняет.
import { useState } from 'react'
import { Check, ChevronDown, Dumbbell, Gem, Lock, Sparkles } from 'lucide-react'
import { NAV_ITEM_PRESS, TinyMedal, medalFor, navItemStyle } from '@/components/nav-sheet-ui'

const BLUE = '#53ADEF', PURPLE = '#C385F7'
const NUMS = Array.from({ length: 20 }, (_, i) => i + 1)
// пример: % каждой темы-«каркаса» по заданиям (как у реальных связей)
const KEYS: Record<number, number[]> = {
    1: [0, 100, 0], 3: [67], 7: [20, 9, 0, 0], 8: [20, 0, 100, 0], 9: [0], 10: [0], 12: [0],
    14: [0, 100, 0], 15: [67, 100, 0, 0], 16: [20, 0], 18: [100, 0, 0],
}
const SOLVED: Record<number, number> = { 1: 5, 2: 2, 3: 1, 7: 40, 8: 12, 15: 0 }
const UNITS = [
    { n: 1, t: 'Планиметрия', p: 5 }, { n: 2, t: 'Векторы', p: 2 }, { n: 3, t: 'Стереометрия', p: 1 },
    { n: 7, t: 'Простейшие уравнения', p: 40 }, { n: 8, t: 'Вычисления и преобразования', p: 100 }, { n: 9, t: 'Производная', p: 0, locked: true },
]
const CHIPS = [
    { t: 'ТТП', p: 67 }, { t: 'Угол между прямой и плоскостью', p: 100 }, { t: 'Расстояние от точки до плоскости', p: 0 }, { t: 'Сечение', p: 0 },
]
const MEDAL_C = { none: '#4A5860', bronze: '#B9784F', silver: '#9FC3DE', gold: '#F0A818' } as const

const Title = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <h2 className="mb-2 mt-8 text-lg font-extrabold text-white"><span className="mr-2 rounded-lg bg-white/10 px-2 py-0.5">{id}</span>{children}</h2>
)
const Note = ({ children }: { children: React.ReactNode }) => <p className="mb-3 text-xs font-bold text-[#7E8F99]">{children}</p>

// ── Шкала: 3 способа уложить медали так, чтобы ячейки не росли в высоту
function Strip({ v }: { v: 'A' | 'B' | 'C' }) {
    const cell = (n: number) => {
        const keys = KEYS[n] ?? []
        const fill = SOLVED[n] ?? 0
        const c = n <= 13 ? BLUE : PURPLE
        return (
            <div key={n} className="min-w-0">
                {v === 'A' && (
                    // медали внахлёст одной строкой, как аватарки
                    <div className="mb-[3px] flex h-[12px] justify-center">
                        {keys.map((p, i) => <span key={i} style={{ marginLeft: i ? -5 : 0, zIndex: 10 - i }} className="relative"><TinyMedal percent={p} size={12} /></span>)}
                    </div>
                )}
                {v === 'B' && (
                    // точки-«рисочки»: сколько тем-каркаса и сколько уже с медалью
                    <div className="mb-[4px] flex h-[4px] justify-center gap-[2px]">
                        {keys.map((p, i) => <span key={i} className="h-[4px] w-[4px] rounded-full" style={{ background: MEDAL_C[medalFor(p)], opacity: p > 0 ? 1 : 0.6 }} />)}
                    </div>
                )}
                <div className="relative h-4 overflow-hidden rounded-[4px] bg-[#26333B]">
                    {fill > 0 && <div className="absolute inset-y-0 left-0" style={{ width: `${Math.max(fill, 12)}%`, background: c }} />}
                    <div className="absolute inset-x-0 top-0 h-1/3 bg-white/10" />
                </div>
                <div className="mt-0.5 flex items-center justify-center gap-[1px]">
                    <span className="text-[9px] font-black leading-[13px] text-[#72838D]">{n}</span>
                    {v === 'C' && keys.length > 0 && <TinyMedal percent={Math.min(...keys)} size={9} />}
                </div>
            </div>
        )
    }
    const row = (from: number, to: number, label: string, color: string) => (
        <div>
            <div className="mb-1 text-[11px] font-black uppercase tracking-wide" style={{ color }}>{label}</div>
            <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${to - from + 1}, minmax(0, 1fr))` }}>
                {NUMS.filter((n) => n >= from && n <= to).map(cell)}
            </div>
        </div>
    )
    return (
        <div className="space-y-2.5">
            {row(1, 13, 'Часть 1', BLUE)}
            <div className="w-[56%]">{row(14, 20, 'Часть 2', PURPLE)}</div>
        </div>
    )
}

// ── Уровень
function Level({ v }: { v: 'L1' | 'L2' }) {
    if (v === 'L1') return (
        <div className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={navItemStyle(false)}>
            <span className="rounded-lg bg-[#2C3B43] px-2 py-0.5 text-xs font-black text-white">Ур. 20</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#0E1518]"><span className="block h-full w-[90%] rounded-full bg-[linear-gradient(90deg,#9FB0BA,#F2F7FB)]" /></span>
            <span className="text-[11px] font-black text-[#AEBCC5]">90/100</span>
            <Gem className="h-4 w-4 text-[#7FB6DE]" />
        </div>
    )
    return (
        <div className="flex items-center gap-2 text-xs font-bold text-[#7E8F99]">
            <span className="relative flex h-8 w-8 items-center justify-center">
                <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90"><circle cx="18" cy="18" r="15" fill="none" stroke="#26333B" strokeWidth="4" /><circle cx="18" cy="18" r="15" fill="none" stroke="#C385F7" strokeWidth="4" strokeDasharray={`${0.9 * 94} 94`} strokeLinecap="round" /></svg>
                <span className="text-[11px] font-black text-white">20</span>
            </span>
            ещё 10 XP до ур. 21 <Sparkles className="ml-auto h-4 w-4 text-[#C385F7]" />
        </div>
    )
}

// ── Кнопки разделов (свёрнутые)
function UnitBtn({ u, v }: { u: typeof UNITS[0]; v: 'U1' | 'U2' }) {
    const done = u.p >= 100
    const c = u.n <= 13 ? BLUE : PURPLE
    return (
        <div className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 ${NAV_ITEM_PRESS}`} style={navItemStyle(false, u.locked)}>
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[15px] font-black"
                style={v === 'U1' ? { background: '#2C3B43', color: u.locked ? '#4E5D65' : '#E2EAF0', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)' }
                    : { background: u.locked ? '#26333B' : `${c}22`, color: u.locked ? '#4E5D65' : c, boxShadow: `inset 0 0 0 1.5px ${u.locked ? '#2F3C43' : c + '66'}` }}>{u.n}</span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-extrabold" style={{ color: u.locked ? '#5C6B73' : '#E2EAF0' }}>{u.t}</span>
                <span className="mt-1 block h-1 overflow-hidden rounded-full bg-[#0E1518]">
                    <span className="block h-full rounded-full" style={{ width: `${u.p}%`, background: v === 'U1' ? 'linear-gradient(90deg,#9FB0BA,#F2F7FB)' : c }} />
                </span>
            </span>
            {u.locked ? <Lock className="h-4 w-4 text-[#5C6B73]" /> : done ? <Check className="h-5 w-5 text-[#AEBCC5]" /> : <span className="text-xs font-black text-[#AEBCC5]">{u.p}%</span>}
            {!u.locked && <ChevronDown className="h-4 w-4 text-[#5C6B73]" />}
        </div>
    )
}

// ── Кнопки тренажёров в открытом разделе
function Chips({ v }: { v: 'K1' | 'K2' | 'K3' }) {
    return (
        <div className="flex flex-wrap items-center gap-1.5">
            <Dumbbell className="mr-0.5 h-5 w-5 text-[#9AA7B0]" />
            {CHIPS.map((k) => {
                const m = medalFor(k.p), on = m !== 'none'
                if (v === 'K1') return (
                    // нейтральная «стеклянная» плитка как в меню; не начато — приглушена
                    <span key={k.t} className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[13px] font-extrabold ${NAV_ITEM_PRESS}`}
                        style={{ ...navItemStyle(false), color: on ? '#E2EAF0' : '#6B7A83', opacity: on ? 1 : 0.75 }}>
                        <TinyMedal percent={k.p} size={16} />{k.t}
                    </span>
                )
                if (v === 'K2') return (
                    // то же, но у начатых — тонкая цветная полоска медали снизу
                    <span key={k.t} className={`relative flex items-center gap-1.5 overflow-hidden rounded-xl px-2.5 py-1.5 text-[13px] font-extrabold ${NAV_ITEM_PRESS}`}
                        style={{ ...navItemStyle(false), color: on ? '#E2EAF0' : '#6B7A83' }}>
                        <TinyMedal percent={k.p} size={16} />{k.t}
                        {on && <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full" style={{ background: MEDAL_C[m] }} />}
                    </span>
                )
                return (
                    // крупная медаль слева, текст без рамки — «значок», не кнопка
                    <span key={k.t} className={`flex items-center gap-1 rounded-full py-1 pl-1 pr-3 text-[13px] font-extrabold ${NAV_ITEM_PRESS}`}
                        style={{ background: on ? '#1F2B31' : 'transparent', boxShadow: on ? 'inset 0 0 0 1px #2F3C43' : 'inset 0 0 0 1px #222D33', color: on ? '#E2EAF0' : '#6B7A83' }}>
                        <TinyMedal percent={k.p} size={22} />{k.t}
                    </span>
                )
            })}
        </div>
    )
}

export default function Page() {
    const [bg, setBg] = useState(false)
    return (
        <div className="min-h-screen bg-[#131D22] px-4 py-6 text-white">
            <div className="mx-auto max-w-xl">
                <h1 className="text-2xl font-extrabold">Задачник: спокойный вид</h1>
                <p className="mt-1 text-sm font-bold text-[#7E8F99]">Выберите по одной букве в каждом блоке.</p>

                <Title id="Шкала">Медали над ячейками без чёрной плашки</Title>
                <button onClick={() => setBg(!bg)} className="mb-3 rounded-lg bg-white/10 px-3 py-1 text-xs font-bold">{bg ? 'Убрать подложку' : 'Показать со старой тёмной подложкой'}</button>
                {(['A', 'B', 'C'] as const).map((v) => (
                    <div key={v} className="mb-5">
                        <div className="mb-1 text-sm font-black text-[#F2C35B]">{v}{v === 'A' ? ' — медали внахлёст в одну строку' : v === 'B' ? ' — точки цвета медали' : ' — одна медаль у номера: худшая из тем'}</div>
                        <div className={bg ? 'rounded-2xl border-2 border-[#2A363C] bg-[#161F23] p-3' : ''}><Strip v={v} /></div>
                    </div>
                ))}

                <Title id="Уровень">Над шкалой — тише</Title>
                <Note>L0 — убрать карточку уровня с задачника совсем (уровень и так в шапке).</Note>
                <div className="mb-3"><div className="mb-1 text-sm font-black text-[#F2C35B]">L1 — тонкая плашка</div><Level v="L1" /></div>
                <div><div className="mb-1 text-sm font-black text-[#F2C35B]">L2 — колечко и одна строка</div><Level v="L2" /></div>

                <Title id="Разделы">Свёрнутые разделы без радуги</Title>
                <div className="mb-1 text-sm font-black text-[#F2C35B]">U1 — как меню: серебро</div>
                <div className="mb-4 space-y-2">{UNITS.map((u) => <UnitBtn key={u.n} u={u} v="U1" />)}</div>
                <div className="mb-1 text-sm font-black text-[#F2C35B]">U2 — серое, номер и полоска цвета части (синий / фиолетовый)</div>
                <div className="space-y-2">{UNITS.map((u) => <UnitBtn key={u.n} u={u} v="U2" />)}</div>

                <Title id="Тренажёры">Кнопки тренажёров в разделе</Title>
                {(['K1', 'K2', 'K3'] as const).map((v) => (
                    <div key={v} className="mb-4">
                        <div className="mb-1.5 text-sm font-black text-[#F2C35B]">{v}{v === 'K1' ? ' — серые плитки, не начатые приглушены' : v === 'K2' ? ' — серые, у начатых полоска цвета медали' : ' — крупная медаль, без рамки у не начатых'}</div>
                        <Chips v={v} />
                    </div>
                ))}
            </div>
        </div>
    )
}
