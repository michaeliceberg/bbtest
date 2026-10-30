// components/wood-sign.tsx
//
// Табличка «из досок» для заголовков ангара: доска с волокнами, тёмная кромка, гвоздики по краям,
// текст «выжжен» — кремовый с тёмной тенью. Чуть наклонена, как прибитая от руки.

export function WoodSign({ children }: { children: React.ReactNode }) {
    return (
        <span className="relative inline-flex -rotate-[1.5deg] items-center rounded-[6px] border-2 border-[#3B2412] px-4 py-1.5"
            style={{
                background: 'repeating-linear-gradient(178deg, rgba(0,0,0,0) 0 5px, rgba(60,32,12,0.18) 5px 6px), linear-gradient(180deg, #A9743F, #8A5A2B 55%, #6E4420)',
                boxShadow: 'inset 0 2px 0 rgba(255,220,170,0.25), inset 0 -3px 0 rgba(0,0,0,0.25), 0 4px 0 #2A190B, 0 6px 14px rgba(0,0,0,0.45)',
            }}>
            {/* гвоздики */}
            <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#2B2B2B] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]" />
            <span className="absolute right-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#2B2B2B] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]" />
            <span className="whitespace-nowrap text-lg font-black uppercase tracking-wide text-[#FFF1D6]" style={{ textShadow: '0 2px 0 #3B2412, 0 0 6px rgba(0,0,0,0.35)' }}>
                {children}
            </span>
        </span>
    )
}
