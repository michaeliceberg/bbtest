'use client'

// Редактор расстановки ангара: тащишь предмет — двигается, колёсико / кнопки ± — размер.
// Готовые координаты копируются кнопкой «Скопировать» и вставляются в docs/hangar/tools/build.py
// (ITEMS / JUNK / ракета). Ничего не сохраняет на сервер.
import { useRef, useState } from 'react'
import layout from '@/lib/hangarLayout.json'

type Slot = { src: string; x: number; y: number; w: number; h: number }
type Obj = Slot & { key: string; label: string }
const L = layout as unknown as Record<string, { b: Slot; a: Slot }> & { rocket: Slot[]; junk: Slot[] }
const IDS = Object.keys(L).filter((k) => k !== 'rocket' && k !== 'junk').map(Number).sort((a, b) => a - b)

const initial = (state: 'b' | 'a'): Obj[] => [
    { ...L.rocket[state === 'b' ? 0 : 7], key: 'rocket', label: 'Ракета' },
    ...(state === 'b' ? L.junk.map((j, i) => ({ ...j, key: `junk-${i + 1}`, label: `хлам ${i + 1}` })) : []),
    ...IDS.map((id) => ({ ...L[id][state], key: `${id}`, label: `№${id}` })),
]

export default function Page() {
    const [state, setState] = useState<'b' | 'a'>('b')
    const [objs, setObjs] = useState<Record<'b' | 'a', Obj[]>>({ b: initial('b'), a: initial('a') })
    const [sel, setSel] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const box = useRef<HTMLDivElement>(null)
    const drag = useRef<{ key: string; dx: number; dy: number; resize?: { w: number; h: number; x0: number } } | null>(null)
    const list = objs[state]

    const toCanvas = (e: React.PointerEvent) => {
        const r = box.current!.getBoundingClientRect()
        return { x: ((e.clientX - r.left) / r.width) * 1024, y: ((e.clientY - r.top) / r.height) * 1024 }
    }
    const update = (key: string, f: (o: Obj) => Partial<Obj>) =>
        setObjs((s) => ({ ...s, [state]: s[state].map((o) => (o.key === key ? { ...o, ...f(o) } : o)) }))
    const scale = (key: string, k: number) => update(key, (o) => ({ w: Math.max(12, Math.round(o.w * k)), h: Math.max(12, Math.round(o.h * k)) }))

    const copy = () => {
        const fmt = (o: Obj) => `${o.label}: x=${Math.round(o.x)}, y=${Math.round(o.y)}, w=${o.w}`
        const text = [`=== ${state === 'b' ? 'ДО (сломано)' : 'ПОСЛЕ (на месте)'} ===`, ...list.map(fmt)].join('\n')
        navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500)
    }
    const pct = (v: number) => `${(v / 1024) * 100}%`
    const s = list.find((o) => o.key === sel)

    return (
        <div className="min-h-screen bg-[#0F171B] px-4 py-5 text-white">
            <div className="mx-auto max-w-2xl">
                <h1 className="text-xl font-extrabold">Ангар — расстановка</h1>
                <p className="mb-3 text-xs font-bold text-[#7E8F99]">Тащи предмет пальцем или мышкой. Размер — жёлтый уголок у выбранного предмета, кнопки − / + на картинке или колёсико мыши. Потом «Скопировать» и пришли мне текст.</p>
                <div className="mb-2 flex gap-2">
                    {(['b', 'a'] as const).map((k) => (
                        <button key={k} onClick={() => { setState(k); setSel(null) }} className="rounded-lg px-3 py-1.5 text-sm font-bold"
                            style={{ background: state === k ? '#53ADEF' : '#26333B', color: state === k ? '#0F171B' : '#C9D4DA' }}>
                            {k === 'b' ? 'Сломано' : 'Починено'}
                        </button>
                    ))}
                    <button onClick={copy} className="ml-auto rounded-lg bg-[#78C93C] px-3 py-1.5 text-sm font-black text-[#0F171B]">{copied ? 'Скопировано ✓' : 'Скопировать'}</button>
                </div>

                <div ref={box} className="relative aspect-square w-full touch-none select-none overflow-hidden rounded-2xl border-2 border-[#2C3A41]"
                    onPointerMove={(e) => { const d = drag.current; if (!d) return; const p = toCanvas(e); const rz = d.resize; if (rz) { const w = Math.max(12, Math.round(rz.w + (p.x - rz.x0) * 2)); update(d.key, () => ({ w, h: Math.round(rz.h * w / rz.w) })) } else update(d.key, () => ({ x: p.x - d.dx, y: p.y - d.dy })) }}
                    onPointerUp={() => { drag.current = null }} onPointerLeave={() => { drag.current = null }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={state === 'b' ? '/hangar/bg-dirty.webp' : '/hangar/bg.webp'} alt="" className="pointer-events-none absolute inset-0 h-full w-full" draggable={false} />
                    {list.map((o) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={o.key} src={o.src} alt={o.label} draggable={false}
                            className="absolute cursor-grab"
                            style={{ left: pct(o.x - o.w / 2), top: pct(o.y - o.h), width: pct(o.w), height: pct(o.h), outline: sel === o.key ? '2px dashed #F2C35B' : undefined }}
                            onPointerDown={(e) => { e.preventDefault(); (e.currentTarget.parentElement as HTMLElement).setPointerCapture(e.pointerId); const p = toCanvas(e); drag.current = { key: o.key, dx: p.x - o.x, dy: p.y - o.y }; setSel(o.key) }}
                            onWheel={(e) => { setSel(o.key); scale(o.key, e.deltaY < 0 ? 1.05 : 1 / 1.05) }} />
                    ))}
                    {s && (
                        // уголок для растягивания: тянешь вправо — больше, влево — меньше (низ предмета остаётся на месте)
                        <span className="absolute z-10 h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize rounded-md border-2 border-[#0F171B] bg-[#F2C35B]"
                            style={{ left: pct(s.x + s.w / 2), top: pct(s.y) }}
                            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget.parentElement as HTMLElement).setPointerCapture(e.pointerId); const p = toCanvas(e); drag.current = { key: s.key, dx: 0, dy: 0, resize: { w: s.w, h: s.h, x0: p.x } } }} />
                    )}
                    {s && (
                        <div className="absolute right-2 top-2 z-10 flex gap-1.5">
                            <button onClick={() => scale(s.key, 1 / 1.1)} className="h-11 w-11 rounded-xl bg-[#0F171B]/85 text-2xl font-black text-white">−</button>
                            <button onClick={() => scale(s.key, 1.1)} className="h-11 w-11 rounded-xl bg-[#0F171B]/85 text-2xl font-black text-white">+</button>
                        </div>
                    )}
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#1C262B] px-3 py-2 text-sm font-bold">
                    {s ? (
                        <>
                            <span className="min-w-0 flex-1 truncate">{s.label}: x {Math.round(s.x)}, y {Math.round(s.y)}, ширина {s.w}</span>
                            <button onClick={() => scale(s.key, 1 / 1.08)} className="h-9 w-9 rounded-lg bg-[#26333B] text-lg font-black">−</button>
                            <button onClick={() => scale(s.key, 1.08)} className="h-9 w-9 rounded-lg bg-[#26333B] text-lg font-black">+</button>
                        </>
                    ) : <span className="text-[#7E8F99]">Нажми на предмет, чтобы выбрать</span>}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {list.map((o) => (
                        <button key={o.key} onClick={() => setSel(o.key)} className="rounded-lg px-2 py-1 text-xs font-bold"
                            style={{ background: sel === o.key ? '#F2C35B' : '#26333B', color: sel === o.key ? '#0F171B' : '#C9D4DA' }}>{o.label}</button>
                    ))}
                </div>
            </div>
        </div>
    )
}
