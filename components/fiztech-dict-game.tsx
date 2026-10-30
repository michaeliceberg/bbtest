'use client'

// Мини-игра «Словарь физтеха» («Крупица») посреди тренировки: слово из рубрики «Крупицы» газеты «За науку»
// и 4 смешных значения. Ошибка не в зачёт урока, это просто посмеяться.
// Использование: <FiztechDictLayer /> один раз (в trainer-question.tsx рядом с мемами), запуск — showDictGame().
// Когда показывать, решает reportGagaAnswer (components/gaga-buddy.tsx): не больше одного раза за урок.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { makeDictQuestion, znSource } from '@/lib/zaNauku'
import { playJustClick, playRightClick } from '@/lib/sound'
import { recordDictAnswer } from '@/actions/fiztech-dict'
import { useAchievementUnlockStore } from '@/store/use-achievement-unlock-store'

// Фразы в духе физтеха: жаргон «За науку» + кубинские словечки Команданте + гусь.
const TITLES = ['Крупица', 'Перемена по-физтеховски', 'Словарь общаги', 'Лингво-зачёт', '¡Mira, амиго!']
const RIGHT = ['¡Bingo, амиго! Чистый физтех 😎', 'Га-га! Зачёт без пересдачи 🪿', '¡Perfecto! Автограф в зачётку ✍️', 'Шаришь, компаньеро! Свой в общаге', '¡Vamos! Это триумф (не тройка по урматам) 🏆']
const WRONG = ['¡Caramba! Почти. На физтехе так:', 'Мимо, компаньеро. Слушай, как надо:', 'Пересдача! Но шутка того стоит:', 'Га-га… Чайхана. Физтехи говорят так:']
const BACK = ['¡Vamos, к уроку!', 'Га-га, обратно в строй', 'Погнали дальше, амиго', 'Сдал — иди дальше']
const rnd = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

const EVENT = 'fiztech-dict-show'
export const showDictGame = (delayMs = 900) => {
    if (typeof window === 'undefined') return
    setTimeout(() => window.dispatchEvent(new Event(EVENT)), delayMs)
}

type Q = ReturnType<typeof makeDictQuestion> & { title: string; right: string; wrong: string; back: string }

export function FiztechDictLayer() {
    const [q, setQ] = useState<Q | null>(null)
    const [picked, setPicked] = useState<string | null>(null)
    useEffect(() => {
        const on = () => { setPicked(null); setQ({ ...makeDictQuestion(), title: rnd(TITLES), right: rnd(RIGHT), wrong: rnd(WRONG), back: rnd(BACK) }) }
        window.addEventListener(EVENT, on)
        return () => window.removeEventListener(EVENT, on)
    }, [])
    if (!q) return null
    const right = q.entry.meaning
    const pick = (o: string) => {
        if (picked) return
        setPicked(o)
        if (o === right) playRightClick()
        else playJustClick()
        recordDictAnswer(q.entry.word, o === right)
            .then((r) => { if (r.ok) useAchievementUnlockStore.getState().check() })
            .catch(() => {})
    }
    return createPortal(
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/65 p-4">
            <motion.div className="w-full max-w-sm rounded-2xl border-2 border-[#4A3A14] bg-[#151F23] p-4 shadow-2xl"
                initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 20 }}>
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-[#F2C35B]">
                    <BookOpen className="h-4 w-4" />{q.title} · словарь физтеха
                </div>
                <p className="mt-3 text-center text-sm font-bold text-[#9AA7B0]">Что значит на физтехе</p>
                <p className="mt-1 text-center text-3xl font-black text-[#F2F7FB]">
                    {q.entry.word}{q.entry.mark && <span className="ml-1.5 align-middle text-sm font-bold text-[#7E8F99]">({q.entry.mark})</span>}
                    <span className="text-[#F2C35B]">?</span>
                </p>
                <div className="drop-in-options mt-4 grid grid-cols-1 gap-2">
                    {q.options.map((o) => {
                        const isRight = picked && o === right
                        const isWrong = picked === o && o !== right
                        return (
                            <button key={o} type="button" onClick={() => pick(o)} disabled={!!picked}
                                className="rounded-xl border-2 border-b-4 px-3 py-2.5 text-left text-base font-bold active:border-b-0"
                                style={{
                                    background: isRight ? 'rgba(161,209,81,0.16)' : isWrong ? 'rgba(220,96,91,0.16)' : '#1B272D',
                                    borderColor: isRight ? '#A1D151' : isWrong ? '#DC605B' : '#2C3A41',
                                    color: isRight ? '#CFEA9C' : isWrong ? '#F0A09C' : '#E8EEF2',
                                    opacity: picked && !isRight && !isWrong ? 0.45 : 1,
                                }}>
                                {o}
                            </button>
                        )
                    })}
                </div>
                {picked && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                        <p className="text-center text-base font-black text-[#F2F7FB]">{picked === right ? q.right : q.wrong}</p>
                        {/* слово распадается на части — так шутка «щёлкает» */}
                        <motion.p className="mt-2 text-center text-2xl font-black text-[#F2C35B]"
                            initial={{ letterSpacing: '0em', scale: 0.9 }} animate={{ letterSpacing: '0.04em', scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.15 }}>
                            {q.entry.parts}
                        </motion.p>
                        {q.entry.hint && <p className="text-center text-xs font-bold italic text-[#9AA7B0]">({q.entry.hint})</p>}
                        <p className="mt-1.5 text-center text-base font-bold text-[#E8D9B8]">= {q.entry.meaning}</p>
                        <p className="mt-1 text-center text-[11px] font-bold text-[#7E8F99]">Рубрика «Крупицы», {znSource(q.entry.joke)}</p>
                        <button type="button" onClick={() => setQ(null)}
                            className="mt-4 w-full rounded-xl border-b-4 px-3 py-3 text-base font-black text-[#151F24] active:border-b-0"
                            style={{ background: 'linear-gradient(180deg,#FFD84D,#F2C35B)', borderBottomColor: '#B8862E' }}>
                            {q.back}
                        </button>
                    </motion.div>
                )}
            </motion.div>
        </div>,
        document.body,
    )
}
