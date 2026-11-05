'use client'

// Кнопка PRO в сайдбаре — правее аккаунта (имя ученика внизу).
// Не куплена — золотая, переливается и искрит (как «ИИ-помощник»), зовёт нажать.
// Куплена — спокойная плашка «PRO» с короной, не призывает кликать.
// Сравнение вариантов (для админа) — /test-pro-button.

import { Crown } from 'lucide-react'
import { TransitionLink } from '@/utils/TransitionLink'

export function ProSidebarButton({ bought }: { bought: boolean }) {
    if (bought) return (
        <TransitionLink href="/pro" className="shrink-0">
            <span className="flex h-9 items-center gap-1 rounded-xl border-2 border-[#4A3A14] bg-[#1B1810] px-2.5 text-xs font-black text-[#D9B867]" title="У тебя PRO">
                <Crown className="h-3.5 w-3.5" strokeWidth={2.6} />PRO
            </span>
        </TransitionLink>
    )
    return (
        <TransitionLink href="/pro?from=sidebar" className="shrink-0">
            <span className="btn-pro flex h-9 items-center gap-1 px-2.5 text-xs" title="Подписка PRO">
                <Crown className="magic-icon h-4 w-4" strokeWidth={2.6} />PRO
                <i className="magic-spark" style={{ left: '22%', animationDelay: '0s' }} />
                <i className="magic-spark" style={{ left: '70%', animationDelay: '.9s' }} />
            </span>
        </TransitionLink>
    )
}
