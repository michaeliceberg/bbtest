'use client'

// components/cat-dream-modal.tsx
//
// Загадка из сна котика: окно поверх ангара (портал в body), ответ — цифровой клавиатурой (KeyboardInput).
// Проверяет сервер (actions/cat-dreams.ts); demo-режим (onHome в ангаре) — проверка тут же, без записи.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { KeyboardInput } from '@/app/lesson/keyboard-input'
import { answerCatDream, type CatDreamState } from '@/actions/cat-dreams'
import { sameDreamAnswer, type CatDream } from '@/lib/catDreams'
import { useAchievementUnlockStore } from '@/store/use-achievement-unlock-store'
import { playJustClick, playRightClick, playSound, WRONG_ANSWER_SOUND } from '@/lib/sound'

const WRONG = ['Не то, мяу… подумай ещё', 'Мимо! Котик ворочается во сне', 'Неа. Ещё разок?', 'Мрр… не сходится']
const RIGHT = ['Верно! Котик мурчит во сне', 'Мяу-да! Разгадал', 'Точно! Котику снится, что ты гений']

export function CatDreamModal({ dream, offline, onClose, onSolved, onLimit, onState }: {
    dream: CatDream
    offline?: boolean
    onClose: () => void
    onSolved: (state: CatDreamState | null) => void
    onLimit: () => void
    /** Свежее состояние с сервера после любого ответа (счётчик «N из 5» в облачке). */
    onState?: (state: CatDreamState) => void
}) {
    const [value, setValue] = useState('')
    const [busy, setBusy] = useState(false)
    const [wrong, setWrong] = useState(0)
    const [msg, setMsg] = useState<string | null>(null)
    const [done, setDone] = useState<'right' | 'gave-up' | null>(null)
    const [shake, setShake] = useState(0)

    const submit = async () => {
        if (busy || done || !value.trim()) return
        setBusy(true)
        let correct: boolean
        let state: CatDreamState | null = null
        if (offline) correct = sameDreamAnswer(value, dream.a)
        else {
            const r = await answerCatDream(dream.id, value).catch(() => ({ ok: false as const }))
            if (!r.ok) {
                setBusy(false)
                if ('limit' in r && r.limit) onLimit()
                else setMsg('Не получилось проверить. Попробуй ещё раз')
                return
            }
            correct = r.correct
            state = r.state
            onState?.(r.state)
        }
        setBusy(false)
        if (correct) {
            playRightClick()
            setDone('right')
            setMsg(RIGHT[dream.id % RIGHT.length])
            onSolved(state)
            if (!offline) useAchievementUnlockStore.getState().check()
        } else {
            playSound(WRONG_ANSWER_SOUND)
            setWrong((w) => w + 1)
            setShake((k) => k + 1)
            setMsg(WRONG[(dream.id + wrong) % WRONG.length])
            setValue('')
        }
    }

    if (typeof document === 'undefined') return null
    return createPortal(
        <div className="fixed inset-0 z-[3000] flex justify-center overflow-y-auto bg-black/65 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                className="relative my-auto w-full max-w-sm rounded-3xl border-2 border-[#6E7BC4] bg-[#1B2140] p-4 shadow-[0_0_32px_rgba(140,160,255,0.35)]"
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                    <span className="flex-1 text-xs font-black uppercase tracking-wide text-[#AEB8FF]">Загадка из сна котика</span>
                    <button type="button" aria-label="Закрыть" onClick={onClose} className="rounded-md p-1 text-[#AEB8FF] hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <p className="mt-2 text-base font-bold leading-snug text-[#EEF0FF]">{dream.q}</p>

                <motion.div key={shake} animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.35 }}
                    className={`mt-3 flex h-12 items-center justify-center rounded-xl border-2 text-2xl font-black ${
                        done === 'right' ? 'border-[#78C93C] bg-[#78C93C]/15 text-[#B5F08A]' : done === 'gave-up' ? 'border-[#3A464E] text-[#9EE8B0]' : 'border-[#3A464E] bg-[#11162E] text-[#F2F7FB]'}`}>
                    {done ? dream.a : value || <span className="text-[#5A6A72]">?</span>}
                </motion.div>
                {msg && <p className={`mt-2 text-center text-sm font-black ${done === 'right' ? 'text-[#9EE8B0]' : 'text-[#FF9A94]'}`}>{msg}</p>}
                {done && <p className="mt-1 text-center text-sm font-bold text-[#C9D0FF]">{dream.why}</p>}

                {!done ? (
                    <div className="mt-3 flex flex-col items-center gap-2.5">
                        <KeyboardInput value={value} onChange={(v) => { setValue(v); setMsg(null) }} showDisplay={false} allowNegative={false} disabled={busy} />
                        <button type="button" onClick={() => { playJustClick(); submit() }} disabled={busy || !value.trim()}
                            className="h-12 w-full max-w-xs rounded-xl border-b-4 border-[#3E4A8C] bg-[#5865C9] text-base font-black text-white disabled:opacity-50 active:border-b-0">
                            {busy ? 'Проверяем…' : 'Ответить'}
                        </button>
                        {wrong >= 2 && (
                            <button type="button" onClick={() => { setDone('gave-up'); setMsg('Ответ такой:') }}
                                className="text-sm font-bold text-[#AEB8FF] underline underline-offset-4">Сдаюсь, покажи ответ</button>
                        )}
                    </div>
                ) : (
                    <button type="button" onClick={onClose}
                        className="mt-3 h-12 w-full rounded-xl border-b-4 border-[#60A12F] bg-[#78C93C] text-base font-black text-[#0B1114] active:border-b-0">
                        {done === 'right' ? 'Котик доволен' : 'Понятно'}
                    </button>
                )}
            </motion.div>
        </div>,
        document.body,
    )
}
