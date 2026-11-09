'use client'

// Редактор расстановки ангара: тащишь предмет — двигается, колёсико / кнопки ± — размер и поворот. Слой считается сам
// по глубине (ниже на полу — ближе), для исключений — поправка «Ближе/Дальше». «Сохранить» пишет расстановку в базу (таблица hangar_layout, только админ),
// и ангар в «Моём пути» сразу рисуется по ней. Модель — lib/hangarModel.ts.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { zFor, editorObjects, placeStyle, TARP_OF_ITEM, type EditorObj, type HangarState, type LayoutOverrides } from '@/lib/hangarModel'
import { getHangarLayout, saveHangarLayout } from '@/actions/hangar-layout'
import { HangarFan } from '@/components/hangar-fan'

const STATES: HangarState[] = ['b', 'a']

export default function Page() {
    const [state, setState] = useState<HangarState>('b')
    const [objs, setObjs] = useState<Record<HangarState, EditorObj[]> | null>(null)
    const [sel, setSel] = useState<string | null>(null)
    // на «Сломано» поверх предметов — брезент, как в ангаре (он на 12% крупнее предмета и может закрыть соседей, например норку)
    const [tarps, setTarps] = useState(true)
    const [saveMsg, setSaveMsg] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [dirty, setDirty] = useState(false)
    const box = useRef<HTMLDivElement>(null)
    const drag = useRef<{ key: string; dx: number; dy: number; resize?: { w: number; h: number; x0: number } } | null>(null)
    // На телефоне (как в самом ангаре) квадрат по высоте экрана — предметы крупнее, картинка листается вбок
    // пальцем по пустому месту; тащить предмет — пальцем по предмету.
    const frameRef = useRef<HTMLDivElement>(null)
    const [frame, setFrame] = useState<{ w: number; s: number } | null>(null)
    const loaded = !!objs
    // при первом замере и смене размера — встаём по центру картинки
    useEffect(() => { if (frame && frameRef.current) frameRef.current.scrollLeft = (frame.s - frame.w) / 2 }, [frame])
    useLayoutEffect(() => {
        const el = frameRef.current
        if (!el) return
        const measure = () => {
            const w = el.clientWidth
            const sz = w < 480 ? Math.max(w, Math.round(Math.min(window.innerHeight * 0.62, 640))) : w
            setFrame((prev) => {
                if (prev && prev.w === w && prev.s === sz) return prev
                return { w, s: sz }
            })
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [loaded])

    useEffect(() => {
        getHangarLayout().then((o) => setObjs({ b: editorObjects(o, 'b'), a: editorObjects(o, 'a') })).catch(() => setObjs({ b: editorObjects(null, 'b'), a: editorObjects(null, 'a') }))
    }, [])

    if (!objs) return <div className="min-h-screen bg-[#0F171B] p-6 text-sm font-bold text-[#7E8F99]">Загружаю расстановку…</div>
    const list = objs[state]
    const sorted = [...list].sort((a, b) => a.z - b.z)

    const toCanvas = (e: React.PointerEvent) => {
        const r = box.current!.getBoundingClientRect()
        return { x: ((e.clientX - r.left) / r.width) * 1024, y: ((e.clientY - r.top) / r.height) * 1024 }
    }
    // слой пересчитывается сам по глубине (lib/hangarModel.ts depthZIndex), поэтому после любого сдвига обновляем z
    const update = (key: string, f: (o: EditorObj) => Partial<EditorObj>) => {
        setDirty(true)
        setObjs((s) => s && ({ ...s, [state]: s[state].map((o) => { if (o.key !== key) return o; const n = { ...o, ...f(o) }; return { ...n, z: zFor(state, n.key, n.y, n.h, n.dz) } }) }))
    }
    const scale = (key: string, k: number) => update(key, (o) => ({ w: Math.max(12, Math.round(o.w * k)), h: Math.max(12, Math.round(o.h * k)) }))
    const rotate = (key: string, d: number | null) => update(key, (o) => ({ rot: d === null ? 0 : Math.max(-45, Math.min(45, o.rot + d)) }))
    // Поправка глубины для исключений: «Ближе» — предмет рисуется поверх тех, что стоят чуть ниже на полу.
    const nudge = (key: string, d: number | null) => update(key, (o) => ({ dz: d === null ? 0 : Math.max(-200, Math.min(200, o.dz + d)) }))

    const save = async () => {
        setSaving(true)
        const data: LayoutOverrides = {}
        for (const st of STATES) data[st] = Object.fromEntries(objs[st].map((o) => [o.key, { x: Math.round(o.x), y: Math.round(o.y), w: o.w, h: o.h, dz: o.dz, rot: o.rot }]))
        const r = await saveHangarLayout(data).catch(() => ({ ok: false, error: 'Нет связи' }))
        setSaving(false)
        if (r.ok) setDirty(false)
        setSaveMsg(r.ok ? 'Сохранено ✓' : r.error ?? 'Не сохранилось')
        setTimeout(() => setSaveMsg(null), 2500)
    }
    const pct = (v: number) => `${(v / 1024) * 100}%`
    const s = list.find((o) => o.key === sel)
    const smallBtn = 'h-9 rounded-lg bg-[#26333B] px-2.5 text-xs font-black text-[#E6EDF1] active:bg-[#33444D]'

    return (
        <div className="min-h-screen bg-[#0F171B] px-4 py-5 text-white">
            <div className="mx-auto max-w-2xl lg:max-w-[1152px]">
                <h1 className="text-xl font-extrabold">Ангар — расстановка</h1>
                <p className="mb-3 text-xs font-bold text-[#7E8F99]">Тащи предмет пальцем или мышкой. Размер — жёлтый уголок, кнопки − / + или колёсико. Ниже — слой и поворот. «Сохранить» — и ангар в «Моём пути» станет таким.</p>
                <div className="mb-2 flex gap-2">
                    {STATES.map((k) => (
                        <button key={k} onClick={() => { setState(k); setSel(null) }} className="rounded-lg px-3 py-1.5 text-sm font-bold"
                            style={{ background: state === k ? '#53ADEF' : '#26333B', color: state === k ? '#0F171B' : '#C9D4DA' }}>
                            {k === 'b' ? 'Сломано' : 'Починено'}
                        </button>
                    ))}
                    {state === 'b' && (
                        <button onClick={() => setTarps((v) => !v)} className="rounded-lg px-3 py-1.5 text-sm font-bold"
                            style={{ background: tarps ? '#53ADEF' : '#26333B', color: tarps ? '#0F171B' : '#C9D4DA' }}>
                            Брезент: {tarps ? 'да' : 'нет'}
                        </button>
                    )}
                    <button onClick={save} disabled={saving} className="ml-auto rounded-lg bg-[#78C93C] px-3 py-1.5 text-sm font-black text-[#0F171B] disabled:opacity-60">
                        {saveMsg ?? (saving ? 'Сохраняю…' : dirty ? 'Сохранить •' : 'Сохранить')}
                    </button>
                </div>

                <div className="relative">
                <div ref={frameRef} className={`hangar-frame w-full overflow-y-hidden rounded-2xl border-2 border-[#2C3A41] ${frame && frame.s > frame.w ? 'overflow-x-auto' : 'overflow-x-hidden'} ${frame ? '' : 'aspect-square'}`}
                    style={frame ? { height: frame.s + 4 } : undefined}>
                <div ref={box} className="relative select-none overflow-hidden" style={frame ? { width: frame.s, height: frame.s, containerType: 'inline-size' } : { width: '100%', height: '100%', containerType: 'inline-size' }}
                    onPointerMove={(e) => { const d = drag.current; if (!d) return; const p = toCanvas(e); const rz = d.resize; if (rz) { const w = Math.max(12, Math.round(rz.w + (p.x - rz.x0) * 2)); update(d.key, () => ({ w, h: Math.round(rz.h * w / rz.w) })) } else update(d.key, () => ({ x: p.x - d.dx, y: p.y - d.dy })) }}
                    onPointerUp={() => { drag.current = null }} onPointerLeave={() => { drag.current = null }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={state === 'b' ? '/hangar/bg-dirty.webp' : '/hangar/bg.webp'} alt="" className="pointer-events-none absolute inset-0 h-full w-full" draggable={false} />
                    {sorted.map((o) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={o.key} src={o.src} alt={o.label} draggable={false} className="absolute cursor-grab touch-none"
                            style={{ ...placeStyle(o), outline: sel === o.key ? '2px dashed #F2C35B' : undefined }}
                            onPointerDown={(e) => { e.preventDefault(); (e.currentTarget.parentElement as HTMLElement).setPointerCapture(e.pointerId); const p = toCanvas(e); drag.current = { key: o.key, dx: p.x - o.x, dy: p.y - o.y }; setSel(o.key) }}
                            onWheel={(e) => { setSel(o.key); scale(o.key, e.deltaY < 0 ? 1.05 : 1 / 1.05) }} />
                    ))}
                    {/* брезент поверх сломанных предметов — как в ангаре (components/hangar-scene.tsx Tarp: scale 1.12), нажатия проходят к предмету */}
                    {state === 'b' && tarps && sorted.filter((o) => TARP_OF_ITEM[Number(o.key)]).map((o) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={`tarp-${o.key}`} src={`/hangar/tarp-${TARP_OF_ITEM[Number(o.key)]}.webp`} alt="" draggable={false}
                            className="pointer-events-none absolute select-none" style={{ ...placeStyle(o), zIndex: (placeStyle(o).zIndex as number) + 1, scale: '1.12', opacity: 0.85, objectFit: 'fill' }} />
                    ))}
                    {/* вентилятор (задание №11) висит под потолком — для ориентира, не двигается */}
                    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 900 }}>
                        <HangarFan broken={state === 'b'} />
                    </div>
                    {s && (
                        <span className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize touch-none rounded-md border-2 border-[#0F171B] bg-[#F2C35B]"
                            style={{ left: pct(s.x + s.w / 2), top: pct(s.y), zIndex: 1000 }}
                            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget.parentElement as HTMLElement).setPointerCapture(e.pointerId); const p = toCanvas(e); drag.current = { key: s.key, dx: 0, dy: 0, resize: { w: s.w, h: s.h, x0: p.x } } }} />
                    )}
                </div>
                </div>
                    {s && (
                        <div className="absolute right-2 top-2 flex gap-1.5" style={{ zIndex: 1000 }}>
                            <button onClick={() => scale(s.key, 1 / 1.1)} className="h-11 w-11 rounded-xl bg-[#0F171B]/85 text-2xl font-black text-white">−</button>
                            <button onClick={() => scale(s.key, 1.1)} className="h-11 w-11 rounded-xl bg-[#0F171B]/85 text-2xl font-black text-white">+</button>
                        </div>
                    )}
                </div>

                <div className="mt-3 rounded-xl bg-[#1C262B] px-3 py-2 text-sm font-bold">
                    {s ? (
                        <>
                            <div className="flex items-center gap-2">
                                <span className="min-w-0 flex-1 truncate">{s.label}: x {Math.round(s.x)}, y {Math.round(s.y)}, ширина {s.w}{s.rot ? `, поворот ${s.rot}°` : ''}</span>
                                <button onClick={() => scale(s.key, 1 / 1.08)} className="h-9 w-9 rounded-lg bg-[#26333B] text-lg font-black">−</button>
                                <button onClick={() => scale(s.key, 1.08)} className="h-9 w-9 rounded-lg bg-[#26333B] text-lg font-black">+</button>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                <span className="mr-1 text-xs text-[#7E8F99]">Слой — сам по глубине (ниже на полу = ближе){s.dz ? `, поправка ${s.dz > 0 ? '+' : ''}${s.dz}` : ''}</span>
                                <button onClick={() => nudge(s.key, 20)} className={smallBtn}>Ближе</button>
                                <button onClick={() => nudge(s.key, -20)} className={smallBtn}>Дальше</button>
                                {s.dz !== 0 && <button onClick={() => nudge(s.key, null)} className={smallBtn}>Сбросить</button>}
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <span className="mr-1 text-xs text-[#7E8F99]">Поворот</span>
                                <button onClick={() => rotate(s.key, -5)} className={smallBtn}>↺ 5°</button>
                                <button onClick={() => rotate(s.key, -1)} className={smallBtn}>↺ 1°</button>
                                <button onClick={() => rotate(s.key, 1)} className={smallBtn}>↻ 1°</button>
                                <button onClick={() => rotate(s.key, 5)} className={smallBtn}>↻ 5°</button>
                                <button onClick={() => rotate(s.key, null)} className={smallBtn}>Ровно</button>
                            </div>
                        </>
                    ) : <span className="text-[#7E8F99]">Нажми на предмет, чтобы выбрать</span>}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {list.map((o) => (
                        <button key={o.key} onClick={() => setSel(o.key)} className="rounded-lg px-2 py-1 text-xs font-bold"
                            style={{ background: sel === o.key ? '#F2C35B' : '#26333B', color: sel === o.key ? '#0F171B' : '#C9D4DA' }}>{o.label}</button>
                    ))}
                </div>
                <p className="mt-3 text-xs font-bold text-[#7E8F99]">№11 теперь вентилятор под потолком. Старые инструменты лежат как хлам и исчезнут вместе с остальным хламом.</p>
            </div>
        </div>
    )
}
