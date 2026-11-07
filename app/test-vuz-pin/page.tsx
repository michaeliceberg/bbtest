'use client'


import { VuzPin, VUZ_PIN_VARIANTS } from '@/components/ballometer'
import { VUZ_LIST } from '@/lib/vuzList'

// Варианты значка вуза над звездой ЕГЭ на карте Сетометра.
const IDS = ['mfti', 'hse', 'msu', 'spbpu', 'misis', 'leti', 'itmo', 'bmstu']

export default function Page() {
    const vuzes = IDS.map((id) => VUZ_LIST.find((v) => v.id === id)!).map((v) => ({ short: v.short, logo: v.logo ?? null }))
    return (
        <main className="min-h-screen bg-[#131D22] px-4 py-6 text-white">
            <h1 className="mb-4 text-xl font-black">Значок вуза на карте</h1>
            <div className="mx-auto flex max-w-[640px] flex-col gap-4">
                {VUZ_PIN_VARIANTS.map((title, vi) => (
                    <section key={title}>
                        <div className="mb-1 text-sm font-black text-[#F1E4C3]">{vi + 1}. {title}</div>
                        <div className="relative flex flex-wrap items-end justify-around gap-y-2 overflow-hidden rounded-xl px-3 pb-3 pt-4"
                            style={{ boxSizing: 'border-box', borderStyle: 'solid', borderWidth: 24, borderImageSource: 'url(/meter/map.webp)', borderImageSlice: '110 fill', borderImageRepeat: 'stretch round' }}>
                            {vuzes.map((v) => (
                                <div key={v.short} className="flex flex-col items-center">
                                    <VuzPin vuz={v} variant={vi} />
                                    <svg viewBox="0 0 24 24" className="-mt-1 h-6 w-6"><path d="M12 2 L15 9 L22.5 9.6 L16.8 14.4 L18.6 22 L12 17.9 L5.4 22 L7.2 14.4 L1.5 9.6 L9 9 Z" fill="#C8452F" stroke="#2B1E14" strokeWidth="2" strokeLinejoin="round" /></svg>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </main>
    )
}
