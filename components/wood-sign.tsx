// components/wood-sign.tsx
//
// Табличка «из доски» для заголовков ангара: доска Leonardo (docs/hangar/leonardo/sign-plank-long.jpg →
// public/hangar/life/sign-plank.webp, 600×189). Растягивается под любую длину текста «по трём кускам» (border-image):
// края с верёвками и гвоздями (по 120 px картинки) не искажаются, тянется только середина доски.
// Текст «выжжен» — кремовый с тёмной тенью. Чуть наклонена, как прибитая от руки.

const H = 50 // высота таблички, px
const END = Math.round((120 / 189) * H) // ширина края с верёвкой и гвоздём при этой высоте

export function WoodSign({ children }: { children: React.ReactNode }) {
    return (
        <span className="relative inline-flex -rotate-[1.5deg] items-center justify-center px-1.5"
            style={{
                height: H,
                borderStyle: 'solid',
                borderWidth: `0 ${END}px`,
                borderImage: 'url(/hangar/life/sign-plank.webp) 0 120 0 120 fill stretch',
                filter: 'drop-shadow(0 3px 0 #2A190B) drop-shadow(0 6px 10px rgba(0,0,0,0.45))',
            }}>
            <span className="whitespace-nowrap pt-1.5 text-lg font-black uppercase tracking-wide text-[#FFF1D6]" style={{ textShadow: '0 2px 0 #3B2412, 0 0 6px rgba(0,0,0,0.45)' }}>
                {children}
            </span>
        </span>
    )
}
