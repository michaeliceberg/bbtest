// components/repair-icon.tsx
//
// Значок «ремонт» (ангар, «N/20»): гаечный ключ (lucide Wrench). Цвет — currentColor.

import { Wrench } from 'lucide-react'

export function RepairIcon({ className = 'h-4 w-4' }: { className?: string }) {
    return <Wrench className={className} strokeWidth={2.4} aria-hidden />
}
