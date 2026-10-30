// components/wood-sign.tsx
//
// Табличка «из доски» для заголовков ангара: одна доска с гвоздями (Leonardo, docs/hangar/leonardo/sign-planks.webp —
// вырезана верхняя доска → public/hangar/life/sign-plank.webp), растянута по тексту. Текст «выжжен» — кремовый
// с тёмной тенью. Чуть наклонена, как прибитая от руки.

export function WoodSign({ children }: { children: React.ReactNode }) {
    return (
        <span className="relative inline-flex -rotate-[1.5deg] items-center px-12 pb-2 pt-1.5"
            style={{
                backgroundImage: 'url(/hangar/life/sign-plank.webp)',
                backgroundSize: '100% 100%',
                filter: 'drop-shadow(0 4px 0 #2A190B) drop-shadow(0 6px 10px rgba(0,0,0,0.45))',
            }}>
            <span className="whitespace-nowrap text-lg font-black uppercase tracking-wide text-[#FFF1D6]" style={{ textShadow: '0 2px 0 #3B2412, 0 0 6px rgba(0,0,0,0.45)' }}>
                {children}
            </span>
        </span>
    )
}
