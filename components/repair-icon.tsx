// components/repair-icon.tsx
//
// Значок «ремонт» (ангар): гаечный ключ и отвёртка крест-накрест. Ключ — контур lucide Wrench,
// отвёртка — своя (в lucide её нет). Цвет — currentColor, ручка отвёртки — тёплый акцент.

export function RepairIcon({ className = 'h-4 w-4' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
            {/* отвёртка: ручка вверху слева, жало внизу справа */}
            <path d="M11.5 11.5 19 19" />
            <path d="M19 19l2 2" strokeWidth={2.6} />
            <rect x="4.2" y="1.8" width="4.6" height="10" rx="2" transform="rotate(-45 6.5 6.8)" fill="#F09B38" stroke="currentColor" />
            {/* гаечный ключ (lucide), головка вверху справа */}
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
    )
}
