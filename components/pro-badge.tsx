// components/pro-badge.tsx — синяя переливающаяся плашка «PRO» (в цвет синей молнии КОМБО x8).
// Ставится на уроки, которые открываются только по подписке.
import { Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

export const ProBadge = ({ className }: { className?: string }) => (
    <span className={cn('pro-pill inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[11px] font-black uppercase tracking-[0.18em] leading-none text-[#06303D]', className)}>
        <Crown className='relative h-3.5 w-3.5' strokeWidth={2.6} />
        <span className='relative'>PRO</span>
    </span>
)
