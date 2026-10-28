'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { checkProPayment, startProPayment } from '@/actions/pro-payment'

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })

// Сколько ждём подтверждения после возврата с формы оплаты (СБП иногда подтверждается не сразу).
const POLL_MS = 2500
const POLL_MAX = 30

export const ProBuyButton = ({ price, proUntil, paidId, test }: {
    price: number; proUntil: string | null; paidId: number | null; test: boolean
}) => {
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [check, setCheck] = useState<'idle' | 'waiting' | 'paid' | 'canceled' | 'slow'>(paidId ? 'waiting' : 'idle')
    const [until, setUntil] = useState<string | null>(proUntil)
    const [receipt, setReceipt] = useState<string | null>(null)

    useEffect(() => {
        if (!paidId) return
        let stop = false
        let tries = 0
        const tick = async () => {
            if (stop) return
            tries++
            const r = await checkProPayment(paidId)
            if (stop) return
            if (r.status === 'succeeded') {
                setCheck('paid')
                if (r.proUntil) setUntil(r.proUntil)
                if (r.receiptUrl) setReceipt(r.receiptUrl)
                router.replace('/pro')
                router.refresh()
                return
            }
            if (r.status === 'canceled' || r.status === 'error') { setCheck('canceled'); router.replace('/pro'); return }
            if (tries >= POLL_MAX) { setCheck('slow'); return }
            setTimeout(tick, POLL_MS)
        }
        tick()
        return () => { stop = true }
    }, [paidId, router])

    const buy = () => startTransition(async () => {
        setError(null)
        const r = await startProPayment()
        if (r.ok) window.location.href = r.url
        else setError(r.error)
    })

    if (check === 'waiting') {
        return (
            <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-[#3A464E] p-4 text-center">
                <Loader2 className="h-7 w-7 animate-spin text-[#F2C35B]" />
                <div className="font-bold">Проверяем оплату…</div>
                <p className="text-xs text-[#9AA7B0]">Обычно это пара секунд. Не закрывай страницу.</p>
            </div>
        )
    }

    const active = !!until && new Date(until).getTime() > Date.now()

    return (
        <div className="flex flex-col items-center gap-3">
            {check === 'paid' && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-full rounded-2xl border-2 border-[#78C93C] bg-[#78C93C]/10 p-4 text-center">
                    <div className="text-3xl">🎉</div>
                    <div className="mt-1 text-lg font-black">PRO подключён!</div>
                    {until && <p className="mt-1 text-sm text-[#C9D3D9]">Всё открыто до <b className="text-[#F2C35B]">{fmtDate(until)}</b></p>}
                    {receipt && <a href={receipt} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-bold text-[#53ADEF] underline">🧾 Чек об оплате</a>}
                </motion.div>
            )}
            {check === 'canceled' && (
                <div className="w-full rounded-2xl border-2 border-[#DC605B] bg-[#DC605B]/10 p-3 text-center text-sm">
                    Оплата не прошла. Деньги не списаны — можно попробовать ещё раз.
                </div>
            )}
            {check === 'slow' && (
                <div className="w-full rounded-2xl border-2 border-[#3A464E] p-3 text-center text-sm text-[#C9D3D9]">
                    Оплата ещё подтверждается. Обнови страницу через минуту — PRO включится сам.
                </div>
            )}
            {active && check !== 'paid' && (
                <div className="w-full rounded-2xl border-2 border-[#F2C35B]/60 bg-[#F2C35B]/10 p-3 text-center text-sm">
                    👑 PRO активен до <b className="text-[#F2C35B]">{fmtDate(until!)}</b>
                </div>
            )}
            <button
                type="button"
                disabled={pending}
                onClick={buy}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#F2C35B] via-[#FFD84D] to-[#F2C35B] text-lg font-black text-[#3A2A08] shadow-[0_6px_0_#8A6A1E] active:translate-y-[6px] active:shadow-none transition-transform disabled:opacity-60"
            >
                {pending ? '...' : active ? `Продлить на 30 дней · ${price} ₽` : `Купить PRO · ${price} ₽`}
            </button>
            {error && <p className="text-sm text-[#DC605B]">{error}</p>}
            <p className="text-xs text-[#6B7A83]">
                СБП или картой · доступ на 30 дней, без автосписаний
                {test && <span className="block text-[#F09B38]">Тестовый режим ЮKassa — настоящие деньги не списываются</span>}
            </p>
        </div>
    )
}
