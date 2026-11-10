'use client'

// components/notice-toast.tsx — общая тёмная плашка-уведомление в стиле «+1 балл ЕГЭ» (вместо белых sonner-тостов).
// Идёт через очередь lib/noticeQueue.ts: несколько уведомлений подряд показываются по одному.

import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { enqueueNotice } from '@/lib/noticeQueue'

export type NoticeTone = 'gold' | 'green' | 'orange' | 'blue'
const TONES: Record<NoticeTone, { border: string; bg: string; edge: string; title: string }> = {
    gold: { border: '#F2C35B', bg: 'linear-gradient(135deg, #3A2E12, #161F23 70%)', edge: '#7A5A12', title: '#F2C35B' },
    green: { border: '#78C93C', bg: 'linear-gradient(135deg, #1E2E18, #161F23 70%)', edge: '#2F4A22', title: '#A1D151' },
    orange: { border: '#FF8A3D', bg: 'linear-gradient(135deg, #3A2312, #161F23 70%)', edge: '#8A2A10', title: '#FFA85C' },
    blue: { border: '#53ADEF', bg: 'linear-gradient(135deg, #12283A, #161F23 70%)', edge: '#1F4F7A', title: '#8CCBF5' },
}

// Показывает плашку в очереди; render получает tone-стили. duration — сколько висит.
export const enqueueToast = (render: (id: string | number, close: () => void) => ReactNode, duration: number, onShow?: () => void) => {
    enqueueNotice((done) => {
        let closed = false
        const close = () => { if (!closed) { closed = true; done() } }
        const id = toast.custom((tid) => render(tid, () => { toast.dismiss(tid); close() }) as React.ReactElement, {
            duration, onDismiss: close, onAutoClose: close,
        })
        onShow?.()
        void id
    }, duration + 1500)
}

export const showNotice = ({ icon, title, sub, tone = 'gold', duration = 4200 }: { icon: ReactNode; title: string; sub?: string; tone?: NoticeTone; duration?: number }) => {
    const t = TONES[tone]
    enqueueToast((_id, close) => (
        <div
            onClick={close}
            className="flex w-[340px] max-w-[calc(100vw-32px)] items-center gap-3 rounded-2xl border-2 px-3.5 py-3"
            style={{ borderColor: t.border, background: t.bg, boxShadow: `0 5px 0 ${t.edge}, 0 12px 24px rgba(0,0,0,0.45)` }}
        >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `${t.border}26`, color: t.title }}>{icon}</span>
            <span className="min-w-0 flex-1 leading-tight">
                <span className="block text-base font-black" style={{ color: t.title }}>{title}</span>
                {sub && <span className="block text-xs font-bold text-[#C9D3D9]">{sub}</span>}
            </span>
        </div>
    ), duration)
}
