// Выбор скатерти для панели сета: 4 варианта из Leonardo (public/set-tablecloth/cloth-N.webp),
// на каждой — три блюда сета для примера. Исходники — docs/miguel/leonardo/tablecloth/.

const CLOTHS = [
    { src: '/set-tablecloth/cloth-1.webp', name: '1 · Бордовая скатерть со свисающим краем' },
    { src: '/set-tablecloth/cloth-2.webp', name: '2 · Зелёная, кружево по углам' },
    { src: '/set-tablecloth/cloth-3.webp', name: '3 · Деревянный стол с кружевными лентами' },
    { src: '/set-tablecloth/cloth-4.webp', name: '4 · Кружевная салфетка на столе, свеча' },
]
const DISHES = ['🥗', '🍝', '🍰']

export default function TestTableclothPage() {
    return (
        <div className="min-h-screen bg-[#161F23] px-4 py-6 text-[#F2F7FB]">
            <h1 className="mb-4 text-center text-xl font-extrabold">Скатерть для сета</h1>
            <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
                {CLOTHS.map((c) => (
                    <div key={c.src}>
                        <div className="mb-2 text-sm font-bold text-[#C9D3D9]">{c.name}</div>
                        <div className="relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={c.src} alt="" className="block w-full rounded-xl" />
                            <div className="absolute inset-0 flex items-center justify-center gap-4">
                                {DISHES.map((d) => (
                                    <span key={d} className="text-4xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.45)]">{d}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
