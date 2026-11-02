'use client'

// Тест вариантов плашки «Миссия» — короткая цепочка тренажёров, которую программа подсказывает ученику
// (фонарик: «вот сейчас реши эти 3 урока — и получишь …»). Данные выдуманные, ничего не сохраняется.
// Переключатель сверху — сколько шагов уже пройдено, чтобы увидеть, как плашка «кричит» ближе к концу.

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronDown, ChevronRight, Lock, Radar, Sparkles } from 'lucide-react'

type Step = { title: string; badge: string }
const MISSION = {
    title: 'Синус на окружности',
    block: 'Тригонометрия',
    steps: [
        { title: 'Знакомство с окружностью', badge: 'π = 180°' },
        { title: 'Таблица 30°, 45°, 60°', badge: 'sin cos tg' },
        { title: 'Как записать ответ', badge: '+2πk' },
    ] as Step[],
    task: 7,
    reward: 'Мифический кейс',
}
const CHEST = '/chests/myth0001.svg'

function left(done: number) {
    return MISSION.steps.length - done
}
function shout(done: number): string {
    const l = left(done)
    if (l === 0) return 'Миссия выполнена! Забирай награду 🎉'
    if (l === 1) return 'Последний шаг! 🔥 Один урок — и награда твоя'
    if (done === 0) return 'Приказ на сегодня, компаньеро: 3 урока подряд'
    return `Ещё ${l} урока — и брезент с задания №${MISSION.task} слетит`
}
const lessonsWord = (n: number) => (n === 1 ? 'урок' : n < 5 ? 'урока' : 'уроков')

// ── Вариант 1: карточка-приказ от Команданте ─────────────────────────────────────────────
function V1({ done }: { done: number }) {
    return (
        <div className="relative overflow-hidden rounded-2xl border-2 border-[#4A3A14] bg-[#151F23] p-3.5">
            <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/miguel/miguel-megaphone.webp" alt="" className="h-16 w-16 shrink-0 object-contain" />
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-wider text-[#F2C35B]">Миссия · {MISSION.block}</p>
                    <p className="text-lg font-black leading-tight text-[#F2F7FB]">{MISSION.title}</p>
                    <p className="mt-1 text-sm font-bold leading-snug text-[#E8D9B8]">{shout(done)}</p>
                </div>
            </div>
            <div className="mt-3 flex items-center">
                {MISSION.steps.map((s, i) => {
                    const ok = i < done
                    const cur = i === done
                    return (
                        <div key={i} className="flex flex-1 items-center">
                            <div className="flex flex-col items-center gap-1">
                                <motion.span animate={cur ? { scale: [1, 1.12, 1] } : { scale: 1 }} transition={cur ? { duration: 1.4, repeat: Infinity } : undefined}
                                    className="flex h-10 w-10 items-center justify-center rounded-full border-b-4 text-sm font-black"
                                    style={ok ? { background: '#78C93C', borderBottomColor: '#4F8A24', color: '#16240C' }
                                        : cur ? { background: '#F2C35B', borderBottomColor: '#B8862E', color: '#3A2A08' }
                                        : { background: '#26333B', borderBottomColor: '#1B252A', color: '#6B7A83' }}>
                                    {ok ? <Check className="h-5 w-5" strokeWidth={3.5} /> : i + 1}
                                </motion.span>
                            </div>
                            <span className="mx-1 h-1 flex-1 rounded-full" style={{ background: i < done ? '#78C93C' : '#26333B' }} />
                        </div>
                    )
                })}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={CHEST} alt="" className={`h-11 w-11 shrink-0 ${left(done) === 0 ? 'animate-bounce' : left(done) === 1 ? '' : 'opacity-60 grayscale'}`} />
            </div>
            {done < MISSION.steps.length && (
                <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-b-4 py-2.5 text-sm font-black text-[#16240C] active:border-b-0"
                    style={{ background: '#78C93C', borderBottomColor: '#60A12F' }}>
                    Шаг {done + 1}: {MISSION.steps[done].title}<ChevronRight className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}

// ── Вариант 2: мини-карта как в ГТА — узкая полоска, по нажатию раскрывается ──────────────
function V2({ done }: { done: number }) {
    const [open, setOpen] = useState(false)
    const l = left(done)
    return (
        <div className="rounded-2xl border-2 border-[#2A363C] bg-[#0F171B]">
            <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2.5 px-3 py-2">
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#163322]">
                    <Radar className="h-5 w-5 text-[#9EE8B0]" />
                    <span className="absolute inset-0 animate-ping rounded-full border-2 border-[#78C93C] opacity-40" />
                </span>
                <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-black text-[#F2F7FB]">{MISSION.title}</span>
                    <span className="block text-xs font-bold text-[#9EE8B0]">{l === 0 ? 'Готово — забери награду' : `Ещё ${l} ${lessonsWord(l)} до награды`}</span>
                </span>
                <span className="flex items-center gap-1">
                    {MISSION.steps.map((_, i) => (
                        <span key={i} className="h-2.5 w-2.5 rounded-full" style={{ background: i < done ? '#78C93C' : i === done ? '#F2C35B' : '#26333B' }} />
                    ))}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={CHEST} alt="" className={`h-7 w-7 ${l === 0 ? 'animate-bounce' : ''}`} />
                <ChevronDown className={`h-4 w-4 text-[#6B7A83] transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="flex flex-col gap-1.5 border-t-2 border-[#1B252A] px-3 py-2.5">
                    {MISSION.steps.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm font-bold">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black"
                                style={{ background: i < done ? '#78C93C' : i === done ? '#F2C35B' : '#26333B', color: i <= done ? '#16240C' : '#6B7A83' }}>
                                {i < done ? <Check className="h-3 w-3" strokeWidth={4} /> : i + 1}
                            </span>
                            <span className={i < done ? 'text-[#6B7A83] line-through' : i === done ? 'text-[#F2F7FB]' : 'text-[#6B7A83]'}>{s.title}</span>
                        </div>
                    ))}
                    <p className="mt-1 text-xs font-bold text-[#F2C35B]">Награда: {MISSION.reward} + брезент с №{MISSION.task}</p>
                </div>
            )}
        </div>
    )
}

// ── Вариант 3: тропинка-фонарик — освещено то, что рядом, дальше туман ───────────────────
function V3({ done }: { done: number }) {
    return (
        <div className="rounded-2xl border-2 border-[#2A363C] bg-[#151F23] p-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#9AA7B0]">Твоя тропинка · {MISSION.title}</p>
            <div className="mt-3 flex items-stretch gap-1.5">
                {MISSION.steps.map((s, i) => {
                    const ok = i < done
                    const cur = i === done
                    const far = i > done
                    return (
                        <div key={i} className="relative flex flex-1 flex-col items-center">
                            {cur && (
                                <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 1, repeat: Infinity }}
                                    className="absolute -top-3 z-10 rounded-full bg-[#F2C35B] px-1.5 text-[10px] font-black text-[#3A2A08]">ты здесь</motion.span>
                            )}
                            <div className={`flex h-full w-full flex-col items-center gap-1 rounded-xl border-2 p-2 text-center ${far ? 'opacity-35' : ''}`}
                                style={{ borderColor: ok ? '#3D8A55' : cur ? '#F2C35B' : '#2A363C', background: ok ? '#163322' : cur ? '#2A2410' : '#0F171B',
                                    boxShadow: cur ? '0 0 18px 2px rgba(242,195,91,.35)' : undefined }}>
                                <span className="text-xs font-black" style={{ color: ok ? '#9EE8B0' : cur ? '#FFE58A' : '#6B7A83' }}>{s.badge}</span>
                                <span className="text-[11px] font-bold leading-tight text-[#C9D3D9]">{far ? '???' : s.title}</span>
                                {ok && <Check className="h-4 w-4 text-[#9EE8B0]" strokeWidth={3.5} />}
                                {far && <Lock className="h-3.5 w-3.5 text-[#6B7A83]" />}
                            </div>
                        </div>
                    )
                })}
                <div className="flex w-12 flex-col items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={CHEST} alt="" className={`h-10 w-10 ${left(done) === 0 ? 'animate-bounce' : 'opacity-50 grayscale'}`} />
                </div>
            </div>
            <p className="mt-2.5 text-sm font-bold text-[#E8D9B8]">{shout(done)}</p>
        </div>
    )
}

// ── Вариант 4: «ещё чуть-чуть» — крупная цифра + сегменты + что дадут ────────────────────
function V4({ done }: { done: number }) {
    const l = left(done)
    return (
        <div className="rounded-2xl p-[2px]" style={{ background: 'linear-gradient(135deg,#F2C35B,#C385F7)' }}>
            <div className="rounded-[14px] bg-[#151F23] p-3.5">
                <div className="flex items-center gap-3">
                    <span className="text-5xl font-black leading-none text-[#FFE58A]">{l}</span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-base font-black leading-tight text-[#F2F7FB]">{l === 0 ? 'Миссия выполнена!' : `${lessonsWord(l)} до награды`}</span>
                        <span className="block text-xs font-bold text-[#9AA7B0]">{MISSION.title} · {MISSION.block}</span>
                    </span>
                    <Sparkles className="h-6 w-6 text-[#C385F7]" />
                </div>
                <div className="mt-3 flex gap-1">
                    {MISSION.steps.map((_, i) => (
                        <span key={i} className="h-3 flex-1 overflow-hidden rounded-full bg-[#26333B]">
                            <motion.span className="block h-full rounded-full" initial={false} animate={{ scaleX: i < done ? 1 : 0 }} style={{ transformOrigin: 'left', background: '#78C93C' }} />
                        </span>
                    ))}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[11px] font-black leading-tight">
                    <span className="flex flex-col items-center gap-1 rounded-lg bg-[#0F171B] p-1.5 text-[#E8D9B8]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={CHEST} alt="" className="h-7 w-7" />Мифический кейс
                    </span>
                    <span className="flex flex-col items-center gap-1 rounded-lg bg-[#0F171B] p-1.5 text-[#E8D9B8]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/hangar/tarp-tall.webp" alt="" className="h-7 w-7 object-contain" />Брезент с №{MISSION.task}
                    </span>
                    <span className="flex flex-col items-center justify-center gap-1 rounded-lg bg-[#0F171B] p-1.5 text-[#E8D9B8]">
                        <span className="text-lg leading-none">🎯</span>+1 балл ЕГЭ
                    </span>
                </div>
            </div>
        </div>
    )
}

const VARIANTS = [
    { title: '1. Приказ Команданте: цепочка кружков и кнопка следующего шага', C: V1 },
    { title: '2. Мини-карта (как в ГТА): узкая полоска, нажми — раскроется', C: V2 },
    { title: '3. Тропинка-фонарик: рядом светло, дальше туман', C: V3 },
    { title: '4. «Ещё чуть-чуть»: крупная цифра и что дадут', C: V4 },
]

export default function TestMissionPage() {
    const [done, setDone] = useState(1)
    return (
        <div className="min-h-screen bg-[#131D22] px-4 py-6">
            <div className="mx-auto flex w-full max-w-md flex-col gap-6">
                <div>
                    <p className="mb-2 text-sm font-black text-[#9AA7B0]">Пройдено шагов миссии:</p>
                    <div className="flex gap-2">
                        {[0, 1, 2, 3].map((n) => (
                            <button key={n} onClick={() => setDone(n)}
                                className={`flex-1 rounded-xl border-b-4 py-2 text-sm font-black active:border-b-0 ${done === n ? 'bg-[#53ADEF] border-[#3A85BC] text-[#0F171B]' : 'bg-[#26333B] border-[#1B252A] text-[#C9D3D9]'}`}>
                                {n}/3
                            </button>
                        ))}
                    </div>
                </div>
                {VARIANTS.map(({ title, C }) => (
                    <div key={title} className="flex flex-col gap-2">
                        <p className="font-black text-[#F2F7FB]">{title}</p>
                        <C done={done} />
                    </div>
                ))}
            </div>
        </div>
    )
}
