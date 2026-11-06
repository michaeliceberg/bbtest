'use client'

// Экран в конце урока тренажёра: тема пройдена, и в ангаре можно снять брезент с предмета задания. Снимает ученик сам:
// кнопка ведёт в ангар (/learn?unveil=N), там предмет сам открывается с кнопкой «Снять брезент».

import { motion } from 'framer-motion'
import { CelebrationShell } from '@/components/celebration-shell'

export type UnveilTask = { num: number; title: string }

export function HangarUnveilReadyScreen({ tasks, onGo, onLater }: { tasks: UnveilTask[]; onGo: () => void; onLater: () => void }) {
    return (
        <CelebrationShell accent="#F2C35B" starsTier="rare" confetti buttonLabel="В ангар, снимать брезент" onButton={onGo}>
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <motion.div className="relative h-44 w-44" initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.55, duration: 0.8 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/hangar/tarp-cube.webp" alt="" draggable={false} className="hangar-tarp-rustle h-full w-full object-contain" />
                </motion.div>
                <h1 className="text-3xl font-black leading-tight">Брезент можно снимать!</h1>
                {tasks.map((t) => (
                    <p key={t.num} className="rounded-xl bg-[#2A2410] px-3 py-1.5 text-base font-black text-[#F2C35B]">Задание №{t.num} · {t.title}</p>
                ))}
                <p className="text-base font-bold leading-snug text-[#C9D3D9]">Тренажёр взят, боец! В ангаре тебя ждёт новый прибор. Сдёрни брезент сам.</p>
                <button type="button" onClick={onLater} className="mt-1 px-3 py-1 text-sm font-black text-[#9AA7B0]">Позже</button>
            </div>
        </CelebrationShell>
    )
}
