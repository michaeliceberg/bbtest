'use client'

// components/plan-build-modal.tsx
//
// После диагностики «Построить мой план»: сам план (копилка, прогноз, следующий ход) /path считает
// по ответам диагностики мгновенно (lib/egeMap.ts) — чтобы было видно, что путь собран под ученика,
// показываем сборку по этапам с полосками загрузки. Этапы берут настоящие данные результата
// (сильные задания, «почти», прогноз). В конце — переход на /path.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { GGEGE_PALETTE } from '@/src/constants/lessonButtonColors'
import { declensionRu } from '@/usefulFunctions'
import type { DiagResult } from '@/lib/egeDiagnostic'

const STEP_MS = 1100
const short = (items: { num: number }[], n = 4) => items.slice(0, n).map((t) => `№${t.num}`).join(', ') + (items.length > n ? '…' : '')

export const PlanBuildModal = ({ r, onClose }: { r: DiagResult; onClose?: () => void }) => {
    const router = useRouter()
    const checked = r.strong.length + r.middle.length + r.weak.length
    const steps = [
        { title: 'Проверяю твои ответы', detail: `${checked} ${declensionRu(checked, 'задание', 'задания', 'заданий')} ЕГЭ` },
        { title: 'Отмечаю, что уже умеешь', detail: r.strong.length ? `Сильные: ${short(r.strong)}` : 'Начнём с основ — так быстрее' },
        { title: 'Ищу баллы, которые ближе всего', detail: r.middle.length ? `Почти получается: ${short(r.middle)}` : r.weak.length ? `Подтянуть: ${short(r.weak)}` : 'Всё ровно — идём по порядку' },
        { title: 'Считаю прогноз', detail: `≈${r.testLo === r.testHi ? r.test : `${r.testLo}–${r.testHi}`} тестовых баллов` },
        { title: 'Расставляю задания по выгоде', detail: 'Сначала то, что даёт больше баллов за меньшее время' },
        { title: 'Строю твою башню ЕГЭ', detail: '20 этажей · первый ход готов' },
    ]
    const [done, setDone] = useState(0)

    useEffect(() => { router.prefetch('/path') }, [router])
    useEffect(() => {
        if (done >= steps.length) {
            const t = setTimeout(() => { router.push('/path'); router.refresh() }, 700)
            return () => clearTimeout(t)
        }
        const t = setTimeout(() => setDone((d) => d + 1), STEP_MS)
        return () => clearTimeout(t)
    }, [done, steps.length, router])

    const total = Math.min(100, Math.round((done / steps.length) * 100))

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#0B1114]/90 px-4">
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md rounded-3xl border-2 border-[#2A363C] bg-[#151F23] p-5">
                <p className="text-center text-xl font-black text-[#F2F7FB]">Строим твой путь</p>
                <p className="mt-0.5 text-center text-xs font-bold text-[#9AA7B0]">по ответам диагностики</p>

                <div className="mt-4 flex flex-col gap-3">
                    {steps.map((s, i) => {
                        const state = i < done ? 'done' : i === done ? 'active' : 'wait'
                        return (
                            <div key={i} className={state === 'wait' ? 'opacity-35' : ''}>
                                <div className="flex items-center gap-2.5">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                                        style={{ backgroundColor: state === 'done' ? GGEGE_PALETTE.green.button : '#26333B' }}>
                                        {state === 'done' && <Check className="h-4 w-4 text-[#0F1A0A]" strokeWidth={3} />}
                                    </span>
                                    <span className="flex-1 text-sm font-black text-[#F2F7FB]">{s.title}</span>
                                </div>
                                <div className="ml-[34px] mt-1.5 h-2 overflow-hidden rounded-full bg-[#0F171B]">
                                    <motion.div className="h-full rounded-full"
                                        style={{ background: `linear-gradient(90deg, ${GGEGE_PALETTE.purple.button}, ${GGEGE_PALETTE.blue.button})` }}
                                        initial={{ width: '0%' }}
                                        animate={{ width: state === 'wait' ? '0%' : '100%' }}
                                        transition={{ duration: state === 'active' ? STEP_MS / 1000 : 0.2, ease: 'easeInOut' }} />
                                </div>
                                {state === 'done' && (
                                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                        className="ml-[34px] mt-1 text-xs font-bold text-[#9AA7B0]">{s.detail}</motion.p>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="mt-5 flex items-center justify-between text-xs font-black text-[#9AA7B0]">
                    <span>{done >= steps.length ? 'Готово! Открываю…' : 'Собираю…'}</span>
                    <span style={{ color: GGEGE_PALETTE.purple.button }}>{total}%</span>
                </div>
                {onClose && done < steps.length && (
                    <button type="button" onClick={() => { router.push('/path'); router.refresh() }} className="mt-2 w-full text-center text-[11px] font-bold text-[#5C6B73] underline-offset-4 hover:underline">
                        Пропустить
                    </button>
                )}
            </motion.div>
        </div>
    )
}
