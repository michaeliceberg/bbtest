'use client'

// Примерка выделения основания логарифма «маркером» вместо рамки-стикера (уроки «Как складывать/вычитать логарифмы»).
// Рамка + уменьшенный шрифт делали цифру основания дважды мелкой; здесь цифра остаётся крупной, а выделение — цветной фон-маркер.
// Формула показана в «телефонной» ширине 343 px с рабочим размером шрифта и проверкой: помещается ли в одну строку.

import { useEffect, useRef, useState } from 'react'
import { GGEGE_PALETTE, hexToRgba } from '@/src/constants/lessonButtonColors'

type StyleId = 'under' | 'full' | 'solid' | 'skew' | 'wave' | 'text'
const STYLES: { id: StyleId; name: string; hint: string }[] = [
    { id: 'under', name: '1. Маркер снизу', hint: 'полоса под нижней половиной цифры, цифра белая' },
    { id: 'full', name: '2. Маркер на всю высоту', hint: 'мягкая заливка цвета, цифра белая' },
    { id: 'solid', name: '3. Сплошной маркер, тёмная цифра', hint: 'яркая заливка, цифра тёмная' },
    { id: 'skew', name: '4. Скошенный маркер', hint: 'как мазок текстовыделителя, цифра белая' },
    { id: 'wave', name: '5. Толстое подчёркивание', hint: 'без фона, цифра цветная, жирная линия снизу' },
    { id: 'text', name: '6. Только цвет цифры', hint: 'без фона и линий, цифра цветная' },
]
const COLORS = Object.entries(GGEGE_PALETTE).map(([k, v]) => ({ id: k, hex: v.button, dark: v.bottom }))

const Mark = ({ children, style, color, dark }: { children: React.ReactNode; style: StyleId; color: string; dark: string }) => {
    if (style === 'under') return (
        <span className="px-[2px] text-[#F2F7FB]" style={{ background: `linear-gradient(transparent 48%, ${hexToRgba(color, 0.85)} 48%, ${hexToRgba(color, 0.85)} 92%, transparent 92%)`, borderRadius: 2 }}>{children}</span>
    )
    if (style === 'full') return (
        <span className="rounded-[3px] px-[3px] text-[#F2F7FB]" style={{ background: hexToRgba(color, 0.4) }}>{children}</span>
    )
    if (style === 'solid') return (
        <span className="rounded-[3px] px-[3px]" style={{ background: color, color: '#10181C' }}>{children}</span>
    )
    if (style === 'skew') return (
        <span className="relative inline-block px-[4px] text-[#F2F7FB]" style={{ lineHeight: 1.1 }}>
            <span className="absolute inset-x-0 bottom-[6%] top-[10%] -skew-x-[10deg] rounded-[3px]" style={{ background: hexToRgba(color, 0.55) }} />
            <span className="relative">{children}</span>
        </span>
    )
    if (style === 'wave') return (
        <span className="px-[1px]" style={{ color, boxShadow: `inset 0 -0.28em 0 ${hexToRgba(color, 0.35)}` }}>{children}</span>
    )
    void dark
    return <span style={{ color }}>{children}</span>
}

const Formula = ({ style, color, dark, subScale }: { style: StyleId; color: string; dark: string; subScale: number }) => {
    const ref = useRef<HTMLDivElement>(null)
    const [w, setW] = useState(0)
    useEffect(() => {
        const measure = () => { if (ref.current) setW(ref.current.offsetWidth) }
        measure()
        const t = setTimeout(measure, 400) // после загрузки шрифта
        return () => clearTimeout(t)
    }, [style, subScale])
    const base = (
        <sub style={{ fontSize: `${subScale}em`, lineHeight: 0 }} className="ml-[1px]"><Mark style={style} color={color} dark={dark}>2</Mark></sub>
    )
    const T = ({ children }: { children: React.ReactNode }) => <span>{children}</span>
    return (
        <div>
            <div style={{ width: 343, fontSize: 15.75 }} className="rounded-xl bg-[#161F23] px-2 py-3">
                <div ref={ref} className="inline-flex items-baseline gap-x-2 whitespace-nowrap font-extrabold text-[#F2F7FB]">
                    <T>log{base} 15</T><T>−</T><T>log{base} 5</T><T>=</T><T>log{base} (15<span className="mx-[2px]">:</span>5)</T>
                </div>
            </div>
            <p className="mt-1 text-xs font-bold" style={{ color: w <= 327 ? '#78C93C' : '#DC605B' }}>
                ширина строки {w}px из 327 — {w <= 327 ? 'помещается' : 'НЕ помещается'}
            </p>
        </div>
    )
}

export default function TestBaseMarker() {
    const [colorId, setColorId] = useState('blue')
    const [subScale, setSubScale] = useState(0.83)
    const [zoom, setZoom] = useState(1.5)
    const c = COLORS.find((x) => x.id === colorId)!
    return (
        <div className="min-h-screen bg-[#131D22] p-4 text-white">
            <h1 className="text-xl font-extrabold">Выделение основания маркером</h1>
            <p className="mt-1 max-w-xl text-sm text-[#9AA7B0]">Цифра основания не уменьшается второй раз: рамки нет, размер задаёт только индекс (по умолчанию как у обычного нижнего индекса).</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
                {COLORS.map((x) => (
                    <button key={x.id} onClick={() => setColorId(x.id)} className="h-9 w-9 rounded-full border-2" style={{ background: x.hex, borderColor: x.id === colorId ? '#fff' : 'transparent' }} aria-label={x.id} />
                ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold">
                <span className="text-[#9AA7B0]">размер основания:</span>
                {[0.7, 0.83, 1].map((s) => (
                    <button key={s} onClick={() => setSubScale(s)} className="rounded-lg border-2 px-3 py-1" style={{ borderColor: subScale === s ? '#53ADEF' : '#3A464E' }}>{s === 0.83 ? '0.83 (обычный)' : s}</button>
                ))}
                <span className="ml-3 text-[#9AA7B0]">увеличить:</span>
                {[1, 1.5, 2].map((s) => (
                    <button key={s} onClick={() => setZoom(s)} className="rounded-lg border-2 px-3 py-1" style={{ borderColor: zoom === s ? '#53ADEF' : '#3A464E' }}>×{s}</button>
                ))}
            </div>

            <div className="mt-5 flex flex-col gap-6" style={{ zoom }}>
                <div>
                    <p className="mb-1 text-sm font-extrabold text-[#9AA7B0]">Сейчас (рамка-стикер, основание ~0.5 от текста)</p>
                    <div style={{ width: 343, fontSize: 15.75 }} className="rounded-xl bg-[#161F23] px-2 py-3">
                        <div className="inline-flex items-baseline gap-x-2 whitespace-nowrap font-extrabold">
                            <span>log<sub className="ml-0.5"><span className="inline-flex items-center justify-center rounded-lg border-2 px-1 text-[0.6em] font-extrabold leading-none" style={{ borderColor: c.hex, background: hexToRgba(c.hex, 0.18), color: c.hex }}>2</span></sub> 15</span>
                            <span>−</span>
                            <span>log<sub className="ml-0.5"><span className="inline-flex items-center justify-center rounded-lg border-2 px-1 text-[0.6em] font-extrabold leading-none" style={{ borderColor: c.hex, background: hexToRgba(c.hex, 0.18), color: c.hex }}>2</span></sub> 5</span>
                            <span>=</span>
                            <span>log<sub className="ml-0.5"><span className="inline-flex items-center justify-center rounded-lg border-2 px-1 text-[0.6em] font-extrabold leading-none" style={{ borderColor: c.hex, background: hexToRgba(c.hex, 0.18), color: c.hex }}>2</span></sub> (15:5)</span>
                        </div>
                    </div>
                </div>
                {STYLES.map((s) => (
                    <div key={s.id}>
                        <p className="text-sm font-extrabold">{s.name}</p>
                        <p className="mb-1 text-xs text-[#9AA7B0]">{s.hint}</p>
                        <Formula style={s.id} color={c.hex} dark={c.dark} subScale={subScale} />
                    </div>
                ))}
            </div>
        </div>
    )
}
